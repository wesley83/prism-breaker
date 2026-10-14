import fs from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {DOMParser} from 'linkedom';
import {RULESET_REVISION} from '../public/levels.js';
const origin='https://sane-guild-8399.onpagelove.com',dav='https://dav-sane-guild-8399.onpagelove.com';
const proof={utc:new Date().toISOString(),checks:[]};let input='';
if(process.stdin.isTTY)process.stdin.setRawMode(true);process.stdin.setEncoding('utf8');console.log('Ready for hidden JSON input.');
process.stdin.on('data',async chunk=>{input+=chunk;if(!/[\r\n]/.test(input))return;process.stdin.removeAllListeners('data');try{const {key}=JSON.parse(input);input='';await run(key);}catch(e){proof.failure=e.message;console.log(e.message);process.exitCode=1;}finally{await fs.writeFile('audit/2026-10-14-final-expiry-check.json',JSON.stringify(proof,null,2));process.exit(process.exitCode||0);}});
async function run(key){
 const auth={Authorization:'Bearer '+key,'Content-Type':'text/html'},path='/_prism-expiry-acceptance-'+randomUUID()+'.html';
 const req=async(base,p,opts={})=>{const r=await fetch(base+p,{...opts,signal:AbortSignal.timeout(20000)});return {status:r.status,ok:r.ok,etag:r.headers.get('etag'),serverTime:Date.parse(r.headers.get('date')),body:await r.text()};};
 const record=(name,data)=>{proof.checks.push({name,...data});console.log(JSON.stringify({name,...data}));};
 const parse=body=>[...new DOMParser().parseFromString(body,'text/html').querySelectorAll('#scores > li')].map(li=>li.querySelector('[itemprop="player"]')?.getAttribute('content'));
 const identity=await req('https://config.onpagelove.com','/console/index.html',{headers:auth});if(!identity.ok||!identity.body.includes('dav-sane-guild-8399.onpagelove.com'))throw Error('Host identity failed');
 const live=await req(dav,'/scores.html',{headers:auth}),type=origin+'/ExpiryAcceptance-'+randomUUID();
 const template=live.body.replace(/<ul\b[^>]*id="scores"[^>]*>[\s\S]*?<\/ul>/,'<ul id="scores"></ul>').replaceAll('/scores.html',path).replaceAll(origin+'/Run',type).replaceAll('onpagelove[.]com/Run',type.replace(origin,'onpagelove[.]com'));
 const row=(player,expires)=>'<li itemscope itemtype="'+type+'">'+Object.entries({runKey:randomUUID(),player,score:0,level:1,mode:'campaign',day:'all',seconds:1,submittedAt:new Date(expires-432000000).toISOString(),ruleset:RULESET_REVISION,expiresAt:expires}).map(([k,v])=>'<meta itemprop="'+k+'" content="'+v+'">').join('')+'</li>';
 let created=false;
 try{
  const create=await req(dav,path,{method:'PUT',headers:{...auth,'If-None-Match':'*'},body:template});created=create.ok;if(!created)throw Error('Create '+create.status);
  record('clock',{serverTime:create.serverTime,localTime:Date.now(),offsetMs:create.serverTime-Date.now()});
  const seed=async expired=>{for(let attempt=0;attempt<5;attempt++){const old=await req(dav,path,{headers:auth});const body=template.replace('<ul id="scores"></ul>','<ul id="scores">'+row('Boundary',old.serverTime+(expired?-10000:432000000))+row('Keep active',old.serverTime+432000000)+'</ul>');const r=await req(dav,path,{method:'PUT',headers:{...auth,'If-Match':old.etag},body});if(r.status===412)continue;if(!r.ok)throw Error('Seed '+r.status);return r.serverTime;}throw Error('Repeated conditional seed conflict');};
  await seed(false);
  const warmup=[];for(let i=0;i<8;i++){await new Promise(r=>setTimeout(r,2000));const response=await req(origin,path,{method:'DELETE',headers:{Range:'selector=#scores > li'}});warmup.push(response.status);if(response.status!==403){record('readiness-control',{status:response.status,retained:parse((await req(dav,path,{headers:auth})).body)});await seed(false);}if(warmup.length>=3&&warmup.slice(-3).every(s=>s===403))break;}
  record('policy-readiness',{statuses:warmup});if(warmup.slice(-3).some(s=>s!==403))throw Error('Fresh policy did not stabilize');
  await seed(false);await req(origin,path); // Discover rules with two unexpired controls.
  for(const [name,range]of [['unrestricted','selector=#scores > li'],['future-cutoff','selector=#scores > li:has(meta[itemprop="expiresAt"]:value-less-than("'+(Date.now()+864000000)+'"))']]){const r=await req(origin,path,{method:'DELETE',headers:{Range:range}});record(name,{status:r.status,retained:parse((await req(dav,path,{headers:auth})).body)});}
  const cutoff=await seed(true); // No GET after seeding and before DELETE; use server clock.
  const del=await req(origin,path,{method:'DELETE',headers:{Range:'selector=#scores > li:has(meta[itemprop="expiresAt"]:value-less-than("'+cutoff+'"))'}});
  record('explicit-expiry-delete',{status:del.status,retained:parse((await req(dav,path,{headers:auth})).body)});
  await seed(true); // Independent GET-driven cleanup case.
  const first=await req(origin,path,{headers:{Range:'selector=#scores'}});await new Promise(r=>setTimeout(r,1000));
  const second=await req(origin,path,{headers:{Range:'selector=#scores'}});
  record('get-driven-expiry',{firstStatus:first.status,firstRows:parse(first.body),secondStatus:second.status,secondRows:parse(second.body)});
 }finally{if(created){const del=await req(dav,path,{method:'DELETE',headers:auth});const read=await req(dav,path,{headers:auth});proof.cleanup={status:del.status,readStatus:read.status};if(read.status!==404)throw Error('Cleanup failed');}}
}
