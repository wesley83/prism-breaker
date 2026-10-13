import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {buildPwa} from './build-pwa.mjs';
const origin='https://sane-guild-8399.onpagelove.com';
const dav='https://dav-sane-guild-8399.onpagelove.com';
let key=''; let buffer='';
if(process.stdin.isTTY) process.stdin.setRawMode(true);
process.stdin.setEncoding('utf8');
console.log('Ready for hidden JSON input.');
process.stdin.on('data', async chunk=>{
  if(chunk.includes('\u0003')) process.exit(0);
  buffer+=chunk;
  let n;
  while((n=buffer.search(/[\r\n]/))!==-1){
    const line=buffer.slice(0,n).trim();buffer=buffer.slice(n+1);
    if(!line)continue;
    try{const c=JSON.parse(line);let result;
      if(c.op==='auth'){
        key=c.key;
        const r=await fetch('https://config.onpagelove.com/console/index.html',{headers:{Authorization:'Bearer '+key}});
        const html=await r.text();
        if(!r.ok||!html.includes('dav-sane-guild-8399.onpagelove.com'))throw Error('Host identity or authentication failed: '+r.status);
        const p=await fetch(dav+'/',{method:'PROPFIND',headers:{Authorization:'Bearer '+key,Depth:'1'}});
        result={console:r.status,hostMatched:true,dav:p.status,inventory:await p.text()};
      }else if(c.op==='request'){
        const base=c.authoring?dav:origin;
        const r=await fetch(base+c.path,{method:c.method||'GET',headers:{...(c.authoring?{Authorization:'Bearer '+key}:{}),...c.headers},body:c.body});
        const body=await r.text();result={status:r.status,headers:{type:r.headers.get('content-type'),range:r.headers.get('content-range')},body:body.slice(0,c.limit||1500)};
      }else if(c.op==='backup'){
        const r=await fetch(dav+c.path,{headers:{Authorization:'Bearer '+key}});
        if(r.ok){await fs.mkdir('.private/backup',{recursive:true});await fs.writeFile(path.join('.private/backup',c.name),Buffer.from(await r.arrayBuffer()));}
        result={status:r.status,saved:r.ok};
      }else if(c.op==='migrateScoreRules'){
        const template=await fs.readFile('public/scores.html','utf8');
        let done=false;
        for(let attempt=0;attempt<3&&!done;attempt++){
          const live=await fetch(dav+'/scores.html',{headers:{Authorization:'Bearer '+key}});if(!live.ok)throw Error('Score migration read '+live.status);
          const etag=live.headers.get('etag');if(!etag)throw Error('No ETag: refusing to replace live scores without a concurrency guard');
          const html=await live.text(),rows=html.match(/<ul\b[^>]*\bid="scores"[^>]*>[\s\S]*?<\/ul>/i)?.[0];if(!rows)throw Error('Missing live score container');
          const merged=template.replace('<ul id="scores"></ul>',rows);if(merged===template&&rows!=='<ul id="scores"></ul>')throw Error('Score merge failed');
          await fs.mkdir('.private/backup',{recursive:true});await fs.writeFile('.private/backup/score-rules-migration-'+attempt+'.html',html);
          const write=await fetch(dav+'/scores.html',{method:'PUT',headers:{Authorization:'Bearer '+key,'Content-Type':'text/html; charset=utf-8','If-Match':etag},body:merged});
          if(write.status===412)continue;if(!write.ok)throw Error('Score migration write '+write.status+': '+(await write.text()).slice(0,300));
          const check=await fetch(dav+'/scores.html',{headers:{Authorization:'Bearer '+key}}),read=await check.text();if(!check.ok||!read.includes('submittedAt'))throw Error('Score rules readback failed');
          const ids=[...rows.matchAll(/itemprop="runKey" content="([^"]+)"/g)].map(m=>m[1]);if(ids.some(id=>!read.includes('content="'+id+'"')))throw Error('A preserved score is missing');
          done=true;result={migrated:true,preservedRuns:ids.length,status:write.status,sha256:createHash('sha256').update(read).digest('hex')};await fs.writeFile('score-rules-release.json',JSON.stringify(result,null,2));
        }
        if(!done)throw Error('Concurrent score writes prevented migration; no stale copy was uploaded');
      }else if(c.op==='upload'){
        const data=await fs.readFile(c.file);
        const r=await fetch(dav+c.path,{method:'PUT',headers:{Authorization:'Bearer '+key,'Content-Type':c.type},body:data});
        result={path:c.path,status:r.status,bytes:data.length,body:r.ok?'':(await r.text()).slice(0,1000)};
      }else if(c.op==='deploy'){
        // Refuse to publish stale hashes or a release marker from an earlier edit.
        const pwa=await buildPwa({check:true});
        const headers={Authorization:'Bearer '+key};const receipt=[];
        for(const folder of ['/assets/','/vendor/']){const r=await fetch(dav+folder,{method:'MKCOL',headers});if(![201,405].includes(r.status))throw Error('MKCOL '+folder+' '+r.status);}
        const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ico':'image/vnd.microsoft.icon','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.webmanifest':'application/manifest+json','.json':'application/json'};
        async function list(dir){let result=[];for(const entry of await fs.readdir(dir,{withFileTypes:true})){const f=path.join(dir,entry.name);if(entry.isDirectory())result.push(...await list(f));else result.push(f);}return result;}
        const files=(await list('public')).filter(f=>c.initializeScores||!f.endsWith('scores.html')).sort((a,b)=>{const priority=f=>path.basename(f)==='sw.js'?3:path.basename(f)==='index.html'?2:path.basename(f)==='app.js'?1:0;return priority(a)-priority(b)||a.localeCompare(b);});
        for(const file of files){if(path.basename(file)==='sw.js')await buildPwa({check:true});const target='/'+path.relative('public',file).split(path.sep).join('/'),bytes=await fs.readFile(file);const r=await fetch(dav+target,{method:'PUT',headers:{...headers,'Content-Type':types[path.extname(file)]||'application/octet-stream'},body:bytes});if(!r.ok)throw Error(target+' upload '+r.status);const check=await fetch(dav+target,{headers});const read=Buffer.from(await check.arrayBuffer());if(!check.ok)throw Error(target+' readback '+check.status);if(!target.endsWith('.html')&&!bytes.equals(read))throw Error(target+' byte mismatch');const entry={path:target,status:r.status,bytes:read.length,sha256:createHash('sha256').update(read).digest('hex')};receipt.push(entry);console.log(JSON.stringify({uploaded:target,status:r.status}));}
        await fs.writeFile('deployment.json',JSON.stringify({origin,authoringHost:dav,deployedAt:new Date().toISOString(),pwa,files:receipt},null,2));result={deployed:true,files:receipt.length,pwa};
      }else if(c.op==='testScores'){
        const row=(key,score='100',player='QA Check')=>'<li itemscope itemtype="https://sane-guild-8399.onpagelove.com/ProbeRun"><meta itemprop="probeRunKey" content="'+key+'"><meta itemprop="player" content="'+player+'"><meta itemprop="score" content="'+score+'"><meta itemprop="level" content="1"><meta itemprop="mode" content="campaign"><meta itemprop="day" content="all"><meta itemprop="seconds" content="15"></li>';
        const runKey=crypto.randomUUID();const checks=[];
        for(const [name,method,body]of [['valid','POST',row(runKey)],['duplicate','POST',row(runKey)],['out-of-range','POST',row(crypto.randomUUID(),'999999')],['markup','POST','<script>alert(1)</script>']]){const r=await fetch(origin+'/_prism-probe.html',{method,headers:{'Content-Type':'text/html',Range:'selector=#scores'},body});checks.push({name,status:r.status,body:(await r.text()).slice(0,200)});}
        const get=await fetch(origin+'/_prism-probe.html?cb='+Date.now(),{headers:{Range:'selector=#scores'}});const body=await get.text();checks.push({name:'readback',status:get.status,found:body.includes(runKey)});await fs.writeFile('test-results/provider-checks.json',JSON.stringify(checks,null,2));result=checks;
      }else if(c.op==='quit'){key='';process.exit(0);}
      else throw Error('Unknown operation');
      console.log(JSON.stringify(result));
    }catch(e){console.log(JSON.stringify({error:e.message,cause:String(e.cause||'')}));}
  }
});
