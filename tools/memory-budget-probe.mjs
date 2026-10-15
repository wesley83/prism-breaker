import fs from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {DOMParser} from 'linkedom';
import {scorePolicyIdentity} from './policy-publication.mjs';

const origin='https://sane-guild-8399.onpagelove.com',dav='https://dav-sane-guild-8399.onpagelove.com';
const runId=new Date().toISOString().replace(/[:.]/g,'-');
const minimal=process.argv.includes('--minimal');
const actionMatrix=process.argv.includes('--action-matrix');
const aged=process.argv.includes('--aged-minimal');
const output='audit/2026-10-15-memory-budget-'+runId+'.json';
const proof={startedAt:new Date().toISOString(),output,experiment:aged?'aged-zero-row-controls':actionMatrix?'row-and-action-language-matrix':minimal?'minimal-zero-row-processors':'seven-row-component-comparison',method:'Sequential interleaved fixtures; no concurrent requests, no synthetic memory pressure',fixtures:[],requests:[],cleanup:[]};
const hash=value=>createHash('sha256').update(value).digest('hex');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const parse=html=>new DOMParser().parseFromString(html,'text/html');
const scoreRows=html=>[...parse(html).querySelectorAll('#scores > li')].map(li=>Object.fromEntries([...li.querySelectorAll('meta[itemprop]')].map(m=>[m.getAttribute('itemprop'),m.getAttribute('content')])));
function errorDetails(body){const doc=parse(body);return {name:doc.querySelector('[itemprop="name"]')?.textContent,description:doc.querySelector('[itemprop="description"]')?.textContent,resourceType:doc.querySelector('[itemprop="resourceType"]')?.textContent,allocated:doc.querySelector('[itemprop="allocated"]')?.textContent,consumed:doc.querySelector('[itemprop="consumed"]')?.textContent,body:body.slice(0,2500)};}
async function run(key){
  const auth={Authorization:'Bearer '+key},created=[];
  const req=async(base,path,options={})=>{const started=performance.now(),r=await fetch(base+path,{...options,redirect:'error',signal:AbortSignal.timeout(20000)}),body=await r.text();return {status:r.status,ok:r.ok,body,etag:r.headers.get('etag'),serverTime:Date.parse(r.headers.get('date')),elapsedMs:Math.round(performance.now()-started),headers:Object.fromEntries(['date','server','x-request-id','request-id','x-correlation-id','traceparent','server-timing','retry-after','content-type'].map(name=>[name,r.headers.get(name)]).filter(([,v])=>v!==null))};};
  const identity=await req('https://config.onpagelove.com','/console/index.html',{headers:auth});
  if(!identity.ok||!identity.body.includes('dav-sane-guild-8399.onpagelove.com'))throw Error('Host identity failed');
  const baseline=await req(dav,'/scores.html',{headers:auth});if(!baseline.ok)throw Error('Production baseline read '+baseline.status);
  proof.productionBefore={sha256:hash(baseline.body),policy:scorePolicyIdentity(baseline.body)};
  await fs.mkdir('.private/reference',{recursive:true});
  proof.references=[];
  for(const slug of ['languages/javascript','reference/reacting-to-changes']){
    const url='https://docs.pagelove.com/all/'+slug+'/';
    try{const r=await fetch(url,{signal:AbortSignal.timeout(20000)}),html=await r.text();const text=parse(html).body.textContent.replace(/\s+/g,' ');const i=text.indexOf('Resource limits');proof.references.push({url,status:r.status,sha256:hash(html),resourceLimits:i<0?null:text.slice(i,i+1400)});await fs.writeFile('.private/reference/memory-'+slug.replaceAll('/','-')+'.html',html);}catch(e){proof.references.push({url,error:e.message});}
  }
  const source=baseline.body.replace(/<ul\b[^>]*id="scores"[^>]*>[\s\S]*?<\/ul>/,'<ul id="scores"></ul>');
  const names=aged?['plain','js-false','sessel-false']:actionMatrix?['zero-js-js','zero-js-sessel','seven-js-js','seven-js-sessel','zero-sessel-js']:minimal?['plain','js-false','sessel-false','js-true','sessel-true']:['plain','rules-without-get','constant-false-processor','original-expiry','streaming-expiry','constant-true-trigger'];
  try{
    for(const name of names){
      const path='/_prism-memory-'+name+'-'+randomUUID()+'.html',type=origin+'/MemoryProbe-'+randomUUID();
      let html=source.replaceAll('/scores.html',path).replaceAll(origin+'/Run',type).replaceAll('onpagelove[.]com/Run',type.replace(origin,'onpagelove[.]com'));
      const doc=parse(html);
      if(name==='plain'||name==='constant-false-processor'||name==='constant-true-trigger')for(const node of doc.querySelectorAll('body > [itemscope]'))node.remove();
      if(name==='rules-without-get')for(const node of doc.querySelectorAll('[itemtype="https://pagelove.org/Processor"]'))node.remove();
      if(name==='streaming-expiry')doc.querySelector('[itemtype="https://pagelove.org/Processor"] [itemprop="when"] script').textContent=String.raw`export default ctx => { const body=String(ctx.response.body), re=/itemprop="expiresAt" content="([0-9]{13})"/g, now=Date.now(); let m; while((m=re.exec(body))!==null){if(Number(m[1])<now)return true;} return false; };`;
      if(name==='constant-false-processor')doc.body.insertAdjacentHTML('beforeend','<div itemscope itemtype="https://pagelove.org/Processor"><meta itemprop="resource" content="'+path+'"><meta itemprop="method" content="GET"><div itemprop="when" itemscope itemtype="https://pagelove.org/JavaScript/Module"><script itemprop="source" type="module">export default () => false;</script></div><div itemprop="action" itemscope itemtype="https://pagelove.org/JavaScript/Module"><script itemprop="source" type="module">export default () => true;</script></div></div>');
      if(name==='constant-true-trigger')doc.body.insertAdjacentHTML('beforeend','<div itemscope itemtype="https://pagelove.org/Trigger"><meta itemprop="resource" content="'+path+'"><meta itemprop="method" content="GET"><div itemprop="action" itemscope itemtype="https://pagelove.org/JavaScript/Module"><script itemprop="source" type="module">export default () => true;</script></div></div>');
      const list=doc.querySelector('#scores');
      for(let i=0;i<7;i++){const expiresAt=baseline.serverTime+432000000+i*1000;const row={runKey:randomUUID(),player:'Control '+i,score:100+i,level:1,mode:'campaign',day:'all',seconds:15,submittedAt:new Date(expiresAt-432000000).toISOString(),expiresAt};list.insertAdjacentHTML('beforeend','<li itemscope itemtype="'+type+'">'+Object.entries(row).map(([k,v])=>'<meta itemprop="'+k+'" content="'+v+'">').join('')+'</li>');}
      html=doc.toString();
      if(minimal||actionMatrix||aged){
        html='<!doctype html><html><head><meta name="robots" content="noindex"><title>Isolated processor probe</title></head><body><ul id="scores"></ul>';
        if(name!=='plain'){
          const js=actionMatrix?name.split('-')[1]==='js':name.startsWith('js-'),value=name.endsWith('true')?'true':'false',jsAction=actionMatrix&&name.endsWith('-js');
          html+='<div itemscope itemtype="https://pagelove.org/Processor"><meta itemprop="resource" content="'+path+'"><meta itemprop="method" content="GET"><div itemprop="when" itemscope itemtype="'+(js?'https://pagelove.org/JavaScript/Module':'https://pagelove.org/Sessel')+'"><script itemprop="source" type="'+(js?'module':'text/sessel')+'">'+(js?'export default () => '+value+';':value)+'</script></div><div itemprop="action" itemscope itemtype="'+(jsAction?'https://pagelove.org/JavaScript/Module':'https://pagelove.org/Sessel')+'"><script itemprop="source" type="'+(jsAction?'module':'text/sessel')+'">'+(jsAction?'export default () => true;':'true')+'</script></div></div>';
        }
        html+='</body></html>';
        if(actionMatrix&&name.startsWith('seven-'))html=html.replace('<ul id="scores"></ul>',list.outerHTML);
      }
      if(html.includes('/scores.html')||[...parse(html).querySelectorAll('meta[itemprop="resource"]')].some(m=>m.getAttribute('content')!==path))throw Error('Unsafe fixture target');
      const put=await req(dav,path,{method:'PUT',headers:{...auth,'Content-Type':'text/html','If-None-Match':'*'},body:html});
      if(!put.ok)throw Error('Fixture creation '+name+' '+put.status);
      created.push(path);
      const rowCount=actionMatrix?(name.startsWith('seven-')?7:0):((minimal||aged)?0:7);
      const stored=await req(dav,path,{headers:auth});if(!stored.ok||scoreRows(stored.body).length!==rowCount)throw Error('Fixture readback failed');
      const fixture={name,path,bytes:Buffer.byteLength(html),sourceSha256:hash(html),storedSha256:hash(stored.body),rowsSha256:hash(JSON.stringify(scoreRows(stored.body))),createdAt:new Date().toISOString()};proof.fixtures.push(fixture);
      if(minimal||actionMatrix||aged)fixture.source=html;
      console.log(JSON.stringify({created:name,bytes:fixture.bytes}));
    }
    if(aged){proof.aging={start:new Date().toISOString(),minimumIdleMs:65000};console.log(JSON.stringify({aging:'65 seconds without fixture writes or reads'}));for(let i=0;i<13;i++)await pause(5000);proof.aging.end=new Date().toISOString();}
    for(let round=0;round<12;round++){
      // Rotate each round so a variant is not always first/last.
      for(let i=0;i<proof.fixtures.length;i++){
        const fixture=proof.fixtures[(i+round)%proof.fixtures.length],selector=round%2===0;
        const r=await req(origin,fixture.path+'?cb='+Date.now(),{headers:selector?{Range:'selector=#scores'}:{},cache:'no-store'});
        const entry={utc:new Date().toISOString(),variant:fixture.name,fixtureAgeMs:Date.now()-Date.parse(fixture.createdAt),round,selector,status:r.status,elapsedMs:r.elapsedMs,responseBytes:Buffer.byteLength(r.body),headers:r.headers};
        if(!r.ok)entry.error=errorDetails(r.body);else entry.rowCount=scoreRows(r.body).length;
        proof.requests.push(entry);if(!r.ok)console.log(JSON.stringify(entry));
        await pause(300);
      }
      if([0,5,11].includes(round)){
        const r=await req(origin,'/scores.html?cb='+Date.now(),{headers:{Range:'selector=#scores'},cache:'no-store'});
        const entry={utc:new Date().toISOString(),variant:'production-read',round,selector:true,status:r.status,elapsedMs:r.elapsedMs,responseBytes:Buffer.byteLength(r.body),headers:r.headers};
        if(!r.ok)entry.error=errorDetails(r.body);proof.requests.push(entry);
      }
      console.log(JSON.stringify({round,requests:proof.requests.length,errors:proof.requests.filter(r=>r.status>=400).length}));
    }
    for(const fixture of proof.fixtures){const read=await req(dav,fixture.path,{headers:auth});fixture.after={status:read.status,rowsUnchanged:read.ok&&hash(JSON.stringify(scoreRows(read.body)))===fixture.rowsSha256};if(!fixture.after.rowsUnchanged)throw Error('Fixture control changed '+fixture.name);}
  }finally{
    for(const path of created){try{const del=await req(dav,path,{method:'DELETE',headers:auth}),read=await req(dav,path,{headers:auth});proof.cleanup.push({path,status:del.status,readStatus:read.status});}catch(e){proof.cleanup.push({path,error:e.message});}}
    const after=await req(dav,'/scores.html',{headers:auth});
    proof.productionAfter={status:after.status,sha256:hash(after.body),policy:after.ok?scorePolicyIdentity(after.body):null};
    proof.productionUnchanged=proof.productionBefore.sha256===proof.productionAfter.sha256;
    proof.productionPolicyUnchanged=proof.productionBefore.policy===proof.productionAfter.policy;
    proof.summary=Object.fromEntries([...names,'production-read'].map(name=>{const rows=proof.requests.filter(r=>r.variant===name);return [name,{requests:rows.length,errors:rows.filter(r=>r.status>=400).length,statuses:rows.reduce((a,r)=>(a[r.status]=(a[r.status]||0)+1,a),{})}];}));
    if(proof.cleanup.some(r=>r.readStatus!==404))throw Error('One or more disposable resources need cleanup');
    console.log(JSON.stringify({summary:proof.summary,productionUnchanged:proof.productionUnchanged,cleanupComplete:true}));
  }
}
let input='';if(!process.stdin.isTTY)throw Error('Use hidden TTY input');process.stdin.setRawMode(true);process.stdin.setEncoding('utf8');console.log('Ready for hidden JSON input.');
process.stdin.on('data',async chunk=>{input+=chunk;if(!/[\r\n]/.test(input))return;process.stdin.removeAllListeners('data');try{const parsed=JSON.parse(input);input='';await run(parsed.key);parsed.key='';}catch(error){proof.failure=error.message;console.log(JSON.stringify({failure:error.message}));process.exitCode=1;}finally{proof.finishedAt=new Date().toISOString();await fs.writeFile(output,JSON.stringify(proof,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:output}));process.exit(process.exitCode||0);}});
