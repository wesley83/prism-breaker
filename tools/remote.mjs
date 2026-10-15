import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {buildPwa} from './build-pwa.mjs';
import {assertReleaseGate} from './release-gate.mjs';
import {publishRelease} from './publish-release.mjs';
import {assertUnchangedScorePolicy} from './policy-publication.mjs';
import {WORLD_SLUGS} from '../public/world-format.js';
import {parseWorld,worldDocument} from '../public/world-format.js';
import {DOMParser} from 'linkedom';
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
        await p.text();result={console:r.status,hostMatched:true,dav:p.status};
      }else if(c.op==='request'){
        const base=c.authoring?dav:origin;
        const r=await fetch(base+c.path,{method:c.method||'GET',headers:{...(c.authoring?{Authorization:'Bearer '+key}:{}),...c.headers},body:c.body});
        const body=await r.text();result={status:r.status,headers:{type:r.headers.get('content-type'),range:r.headers.get('content-range'),etag:r.headers.get('etag'),cors:r.headers.get('access-control-allow-origin'),exposed:r.headers.get('access-control-expose-headers')},body:body.slice(0,c.limit||1500)};
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
          const html=await live.text();assertUnchangedScorePolicy(html,template);const rows=html.match(/<ul\b[^>]*\bid="scores"[^>]*>[\s\S]*?<\/ul>/i)?.[0];if(!rows)throw Error('Missing live score container');
          const migrationTime=Date.now();let legacyWithoutTime=0;
          const retainedRows=rows.replace(/<li\b[^>]*>[\s\S]*?<\/li>/g,row=>{if(/itemprop="expiresAt"/.test(row))return row;const submitted=row.match(/itemprop="submittedAt" content="([^"]+)"/)?.[1],time=Date.parse(submitted);if(!Number.isFinite(time))legacyWithoutTime++;const expiresAt=(Number.isFinite(time)?Math.min(time,migrationTime):migrationTime)+432000000;return row.replace('</li>','<meta itemprop="expiresAt" content="'+expiresAt+'"></li>');});
          const merged=template.replace('<ul id="scores"></ul>',retainedRows);if(merged===template&&rows!=='<ul id="scores"></ul>')throw Error('Score merge failed');
          await fs.mkdir('.private/backup',{recursive:true});await fs.writeFile('.private/backup/score-rules-migration-'+attempt+'.html',html);
          const write=await fetch(dav+'/scores.html',{method:'PUT',headers:{Authorization:'Bearer '+key,'Content-Type':'text/html; charset=utf-8','If-Match':etag},body:merged});
          if(write.status===412)continue;if(!write.ok)throw Error('Score migration write '+write.status+': '+(await write.text()).slice(0,300));
          const check=await fetch(dav+'/scores.html',{headers:{Authorization:'Bearer '+key}}),read=await check.text();if(!check.ok||!read.includes('submittedAt'))throw Error('Score rules readback failed');
          const ids=[...rows.matchAll(/itemprop="runKey" content="([^"]+)"/g)].map(m=>m[1]);if(ids.some(id=>!read.includes('content="'+id+'"')))throw Error('A preserved score is missing');
          done=true;result={migrated:true,preservedRuns:ids.length,legacyWithoutTime,status:write.status,sha256:createHash('sha256').update(read).digest('hex')};await fs.writeFile('score-rules-release.json',JSON.stringify(result,null,2));
        }
        if(!done)throw Error('Concurrent score writes prevented migration; no stale copy was uploaded');
      }else if(c.op==='probeTriggerDiscovery'){
        const id=crypto.randomUUID(),target='/_prism-trigger-probe-'+id+'.html',policyPath='/_prism-trigger-policy-'+id+'.html';
        const auth={Authorization:'Bearer '+key,'Content-Type':'text/html'};
        const trigger='<div itemscope itemtype="https://pagelove.org/Trigger"><meta itemprop="resource" content="'+target+'"><meta itemprop="method" content="GET"><div itemprop="action" itemscope itemtype="https://pagelove.org/JavaScript/Module"><script itemprop="source" type="module">export default function(){throw {schema_url:"https://pagelove.org/HTTPResponse",status:418,body:"isolated trigger probe"};}</script></div></div>';
        try{
          for(const [p,b]of [[target,'<!doctype html><html><body>Probe</body></html>'],[policyPath,'<!doctype html><html><body>'+trigger+'</body></html>']]){const r=await fetch(dav+p,{method:'PUT',headers:{...auth,'If-None-Match':'*'},body:b});if(!r.ok)throw Error('Probe creation '+r.status);}
          const external=await fetch(origin+target);await external.text();
          const embedded=await fetch(dav+target,{method:'PUT',headers:auth,body:'<!doctype html><html><body>Probe'+trigger+'</body></html>'});if(!embedded.ok)throw Error('Embedded probe '+embedded.status);
          const internal=await fetch(origin+target);await internal.text();
          result={externalTrigger:external.status,embeddedTrigger:internal.status};
        }finally{for(const p of [policyPath,target]){const r=await fetch(dav+p,{method:'DELETE',headers:auth});if(!r.ok&&r.status!==404)throw Error('Probe cleanup '+r.status);}}
      }else if(c.op==='probeWorldPolicy'){
        const writeOrigin=c.pipeline==='public'?origin:dav;
        const {worldPolicy}=await import('./world-policy.mjs');
        const {originalWorld,worldDocument}=await import('../public/world-format.js');
        const id=crypto.randomUUID(),target='/_prism-world-data-probe-'+id+'.html',policyPath='/_prism-world-policy-probe-'+id+'.html';
        const auth={Authorization:'Bearer '+key,'Content-Type':'text/html; charset=utf-8'};
        const checks=[];let installed=false;
        try{
          const policy=(await worldPolicy({paths:[target]})).html;
          const putPolicy=await fetch(dav+policyPath,{method:'PUT',headers:{...auth,'If-None-Match':'*'},body:policy});
          if(!putPolicy.ok)throw Error('Probe policy installation '+putPolicy.status);installed=true;
          const body=worldDocument(originalWorld(0));
          const valid=await fetch(writeOrigin+target,{method:'PUT',headers:{...auth,'If-None-Match':'*'},body});
          checks.push({name:'valid-world',status:valid.status,detail:valid.ok?'':(await valid.text()).slice(0,1000)});
          if(!valid.ok)throw Error('Valid world rejected: '+JSON.stringify(checks));
          const read=await fetch(dav+target,{headers:auth}),etag=read.headers.get('etag');
          if(!etag)throw Error('Probe did not expose an ETag');
          for(const [name,content,headers]of [
            ['invalid-hitpoints',body.replace('itemprop="hitpoints" content="1"','itemprop="hitpoints" content="99"'),{'If-Match':etag}],
            ['executable-markup',body.replace('</body>','<script>alert(1)</script></body>'),{'If-Match':etag}],
            ['missing-condition',body,{}],
            ['stale-condition',body,{'If-Match':'"prism-stale-probe"'}]
          ]){const r=await fetch(writeOrigin+target,{method:'PUT',headers:{...auth,...headers},body:content});checks.push({name,status:r.status,detail:r.ok?'unexpected acceptance':(await r.text()).slice(0,180)});}
          const final=await fetch(dav+target,{headers:auth});checks.push({name:'unchanged-after-rejections',equal:worldDocument(parseWorld(await final.text(),{Parser:DOMParser}))===body});
          const expected={'invalid-hitpoints':422,'executable-markup':422,'missing-condition':428,'stale-condition':412};
          if(checks.some(check=>check.name in expected&&check.status!==expected[check.name])||!checks.at(-1).equal)throw Error('World policy probe failed: '+JSON.stringify(checks));
          const policyBytes=await fs.readFile('policy-candidates/world-policy.html');
          const proof={origin,writeOrigin,utc:new Date().toISOString(),sha256:createHash('sha256').update(policyBytes).digest('hex'),checks};
          await fs.mkdir('.private',{recursive:true});await fs.writeFile('.private/world-policy-validation.json',JSON.stringify(proof,null,2));result={passed:true,checks};
        }finally{
          if(installed){const r=await fetch(dav+policyPath,{method:'DELETE',headers:auth});if(!r.ok&&r.status!==404)throw Error('Probe policy cleanup '+r.status);}
          const r=await fetch(dav+target,{method:'DELETE',headers:auth});if(!r.ok&&r.status!==404)throw Error('Probe data cleanup '+r.status);
        }
      }else if(c.op==='upload'){
        const data=await fs.readFile(c.file);
        const r=await fetch(dav+c.path,{method:'PUT',headers:{Authorization:'Bearer '+key,'Content-Type':c.type},body:data});
        result={path:c.path,status:r.status,bytes:data.length,body:r.ok?'':(await r.text()).slice(0,1000)};
      }else if(c.op==='seedWorlds'){
        const headers={Authorization:'Bearer '+key};let created=0,preserved=0;
        for(const folder of ['/worlds/',...WORLD_SLUGS.map(s=>'/worlds/'+s+'/')]){const r=await fetch(dav+folder,{method:'MKCOL',headers});if(![201,405].includes(r.status))throw Error('World directory '+r.status);}
        for(const slug of WORLD_SLUGS){const target='/worlds/'+slug+'/definition.html',existing=await fetch(dav+target,{headers});if(existing.ok){preserved++;continue;}if(existing.status!==404)throw Error('World read '+existing.status);const body=worldDocument(parseWorld(await fs.readFile('public'+target,'utf8'),{Parser:DOMParser,expectedSlug:slug}));const write=await fetch(dav+target,{method:'PUT',headers:{...headers,'Content-Type':'text/html; charset=utf-8','If-None-Match':'*'},body});if(write.status===412){preserved++;continue;}if(!write.ok)throw Error('World initialization '+write.status);created++;}
        result={created,preserved};
      }else if(c.op==='activateWorldPolicy'){
        throw Error('DAV intentionally bypasses validation and triggers. World-policy activation is disabled; owner DAV publishing is the selected authoring contract.');
      }else if(c.op==='deploy'||c.op==='rollbackRelease'){
        if(c.initializeScores)throw Error('Game publication preserves score data and policies. Score-policy initialization requires a separate reviewed activation procedure.');
        const approval=await assertReleaseGate();
        const {package:packageDirectory,...pwa}=await buildPwa({check:true});
        const version=c.op==='rollbackRelease'?c.version:pwa.version;
        if(!/^[a-f0-9]{20}$/.test(version||''))throw Error('Invalid rollback version');
        const selected=c.op==='rollbackRelease'?path.resolve('test-results/release-package',version):packageDirectory;
        const headers={Authorization:'Bearer '+key};
        const backupDirectory=path.join('.private/backup','publication-'+Date.now()+'-'+crypto.randomUUID());await fs.mkdir(backupDirectory,{recursive:true});
        for(const target of ['/index.html','/sw.js','/manifest.webmanifest','/editor.html','/editor/:worldname']){
          const r=await fetch(dav+target,{headers,cache:'no-store',signal:AbortSignal.timeout(20000)});
          if(r.ok)await fs.writeFile(path.join(backupDirectory,target.replace(/[^a-z0-9.-]/gi,'_')),Buffer.from(await r.arrayBuffer()));
          else if(r.status!==404)throw Error('Pre-publication backup '+r.status);
        }
        const published=await publishRelease({root:process.cwd(),packageDirectory:selected,version,dav,headers,
          beforePromote:async()=>{await buildPwa({check:true});await assertReleaseGate();},
          progress:record=>console.log(JSON.stringify(record)),
          onCheckpoint:checkpoint=>fs.writeFile('test-results/publication-checkpoint.json',JSON.stringify({...checkpoint,at:new Date().toISOString()},null,2))});
        const receipt={origin,authoringHost:dav,deployedAt:new Date().toISOString(),approval,pwa:{...pwa,version,...published.cache},...published};
        await fs.writeFile('deployment.json',JSON.stringify(receipt,null,2));result={deployed:true,version,files:published.files.length,publication:published.publication};
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
