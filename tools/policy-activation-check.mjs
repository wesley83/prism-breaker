import fs from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {DOMParser} from 'linkedom';
import {htmlIdentity} from './publish-release.mjs';
import {scorePolicyIdentity} from './policy-publication.mjs';
import {assessRound,assessWindow,OBSERVATION} from './policy-activation-assessment.mjs';

const origin='https://sane-guild-8399.onpagelove.com',dav='https://dav-sane-guild-8399.onpagelove.com';
const id=randomUUID(),stem=`audit/${new Date().toISOString().slice(0,10)}-activation-check-${id}`;
const target=`/_prism-check-data-${id}.html`,marker=`/_prism-check-read-${id}.html`,policy=`/_prism-check-policy-${id}.html`;
const owned=new Set(),possibleWrites=new Set();
const proof={schema:1,startedAt:new Date().toISOString(),origin,paths:{target,marker,policy},configuration:OBSERVATION,phases:[],events:[],cleanup:[],globalReadinessGuaranteed:false,limitations:['Disposable policy only; production activation is not measured.','Concurrent requests do not prove different workers or regions were reached.','No observation window establishes a global activation guarantee.','Any inconsistent round keeps the overall result not confirmed, even if later rounds settle.']};
const hash=text=>createHash('sha256').update(text).digest('hex');
const parse=text=>new DOMParser().parseFromString(text,'text/html');
const wrap=body=>`<!doctype html><html><head><meta name="robots" content="noindex"><meta name="prism-activation-check" content="${id}"><title>Disposable policy checker</title></head><body>`+body+'</body></html>';
let auth={},stopping=false;
const record=(name,details)=>{proof.events.push({name,at:new Date().toISOString(),...details});console.log(JSON.stringify({name,...details}));};

async function checkpoint(){await fs.writeFile(stem+'.json',JSON.stringify(proof,null,2)+'\n');}
async function request(base,path,options={}){
  const method=options.method||'GET';
  const plain=path.split('?')[0];
  if(!['GET','OPTIONS'].includes(method)&&(![target,marker,policy].includes(plain)||path!==plain))throw Error('Mutation outside exact disposable allowlist');
  if(options.headers?.Authorization&&base!==dav&&base!=='https://config.onpagelove.com')throw Error('Owner credential outside pinned authoring endpoints');
  const startedAt=new Date().toISOString(),start=performance.now();
  try{
    const response=await fetch(base+path,{...options,redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(15000)});
    const body=await response.text();
    const headers=Object.fromEntries([...response.headers].filter(([key])=>/^(date|etag|allow|cache-control|age|server|server-timing|x-request-id|request-id|x-correlation-id|traceparent|x-policy-version|x-policy-revision)$/.test(key)));
    return {status:response.status,startedAt,elapsedMs:Math.round(performance.now()-start),headers,body,marker:body.match(/activation-(?:revision|reject)-[ABC]/)?.[0]||null,baseDocument:body.includes('activation-base-document')};
  }catch(error){return {status:null,startedAt,elapsedMs:Math.round(performance.now()-start),headers:{},body:'',marker:null,error:error.name==='TimeoutError'?'timeout':'transport failure'};}
}
function summary({body,...response}){return response;}
function requireSuccess(response,label){if(response.error||response.status<200||response.status>=300)throw Error(`${label}: ${response.error||response.status}`);return response;}
async function ownerRead(path){return requireSuccess(await request(dav,path,{headers:auth}),'Owner read');}
async function snapshot(){
  const response=await ownerRead(target);
  return [...parse(response.body).querySelectorAll('#records > li')].map(n=>({id:n.getAttribute('data-probe'),revision:n.textContent}));
}
function policyHtml(revision,grant=true){
  const rule=grant?`<div itemscope itemtype="https://pagelove.org/AuthorizationRule"><meta itemprop="actor" content="*"><meta itemprop="resource" content="${target}"><meta itemprop="method" content="POST"><meta itemprop="selector" content="#records"><meta itemprop="action" content="Allow"></div>`:'';
  const trigger=(method,resource,code)=>`<div itemscope itemtype="https://pagelove.org/Trigger"><meta itemprop="resource" content="${resource}"><meta itemprop="method" content="${method}"><div itemprop="action" itemscope itemtype="https://pagelove.org/Sessel"><script itemprop="source" type="text/sessel">${code}</script></div></div>`;
  const accepted=revision==='C'?'B':revision;
  return wrap(rule+trigger('GET',marker,`@schema HTTPResponse url("https://pagelove.org/HTTPResponse"); throw new HTTPResponse {status: 418, body: "activation-revision-${revision}"}`)+trigger('POST',target,`@schema Context url("https://pagelove.org/Context"); @schema HTTPResponse url("https://pagelove.org/HTTPResponse"); if (!Context.request.body.matches("^<li data-probe=\\"[a-f0-9-]+\\">${accepted}</li>$")) {throw new HTTPResponse {status: 422, body: "activation-reject-${revision}"}}`));
}
async function put(path,html){
  if(stopping)throw Error('Interrupted before publication');
  const prior=owned.has(path)?await ownerRead(path):null;
  if(prior&&!prior.headers.etag)throw Error('Missing conditional-write ETag');
  possibleWrites.add(path); // A timeout may mean the server committed the upload.
  const response=await request(dav,path,{method:'PUT',headers:{...auth,'Content-Type':'text/html',...(prior?{'If-Match':prior.headers.etag}:{'If-None-Match':'*'})},body:html});
  if(response.status===412&&!prior)possibleWrites.delete(path); // Collision: never claim/delete another document.
  requireSuccess(response,'Conditional publication');owned.add(path);
  const readback=await ownerRead(path);
  if(htmlIdentity(Buffer.from(html))!==htmlIdentity(Buffer.from(readback.body)))throw Error('Stored source differs structurally');
  record('published',{path,status:response.status,etag:readback.headers.etag,sourceIdentity:htmlIdentity(Buffer.from(html)),sourceVerified:true});
  await checkpoint();
}
async function remove(path){
  const prior=await request(dav,path,{headers:auth});
  if(prior.status===404){possibleWrites.delete(path);owned.delete(path);return {path,status:404,readStatus:404};}
  requireSuccess(prior,'Cleanup read');
  if(parse(prior.body).querySelector('meta[name="prism-activation-check"]')?.getAttribute('content')!==id)throw Error('Cleanup ownership marker differs');
  if(!prior.headers.etag)throw Error('Missing cleanup ETag');
  const response=await request(dav,path,{method:'DELETE',headers:{...auth,'If-Match':prior.headers.etag}});
  requireSuccess(response,'Conditional cleanup');
  const absent=await request(dav,path,{headers:auth});
  if(absent.status!==404)throw Error('Cleanup not confirmed');
  possibleWrites.delete(path);owned.delete(path);
  return {path,status:response.status,readStatus:absent.status};
}
async function publicRound(revision,grant,deleted){
  const before=await snapshot().catch(()=>null),headers={'Cache-Control':'no-cache'};
  if(!before)return {matches:false,problems:['Owner snapshot failed before requests'],requestCount:0,reads:[],writes:[],before:null,after:null};
  const reads=[];
  // Independent reads overlap. Separate marker path avoids a GET diagnostic
  // affecting the selector authorization pipeline of the write target.
  const readResults=await Promise.allSettled(Array.from({length:3},()=>request(origin,marker+'?cb='+randomUUID(),{headers})));
  for(const result of readResults)reads.push(result.status==='fulfilled'?summary(result.value):{status:null,error:'request failed'});
  const options=summary(await request(origin,target+'?cb='+randomUUID(),{method:'OPTIONS',headers:{...headers,Range:'selector=#records'}}));
  const writes=[];
  // Two overlapping A/B pairs, maximum four concurrent mutations. Unique IDs
  // make acceptance/storage reconciliation independent of completion order.
  const inputs=['A','B','A','B'].map(revision=>({id:randomUUID(),revision}));
  const results=await Promise.allSettled(inputs.map(async input=>({...input,...summary(await request(origin,target,{method:'POST',headers:{...headers,'Content-Type':'text/html',Range:'selector=#records'},body:`<li data-probe="${input.id}">${input.revision}</li>`}))})));
  results.forEach((result,index)=>writes.push(result.status==='fulfilled'?result.value:{...inputs[index],status:null,error:'request failed'}));
  const after=await snapshot().catch(()=>null);
  const assessed=after?assessRound({revision,grant,deleted,before,after,reads,writes,options}):{matches:false,problems:['Owner snapshot failed after requests; stored effects unknown'],requestCount:reads.length+writes.length+1};
  return {...assessed,reads,writes,options,before,after};
}
async function phase(name,revision,grant,deleted=false){
  const start=performance.now(),entry={name,revision,grant,deleted,startedAt:new Date().toISOString(),rounds:[]};
  proof.phases.push(entry);
  do{
    if(stopping)throw Error('Interrupted; cleanup requested');
    const startedMs=Math.round(performance.now()-start);
    const round=await publicRound(revision,grant,deleted);
    entry.rounds.push({...round,startedMs,endedMs:Math.round(performance.now()-start)});
    entry.assessment=assessWindow(entry.rounds);
    record('round',{phase:name,round:entry.rounds.length,matches:round.matches,problems:round.problems,observedMs:entry.assessment.observedMs});
    await checkpoint();
    if(entry.assessment.consistentWindowObserved||performance.now()-start>=OBSERVATION.deadlineMs)break;
    const until=Math.min(performance.now()+OBSERVATION.intervalMs,start+OBSERVATION.deadlineMs);
    while(!stopping&&performance.now()<until)await new Promise(resolve=>setTimeout(resolve,Math.min(1000,until-performance.now())));
  }while(performance.now()-start<OBSERVATION.deadlineMs);
  entry.timedOut=!entry.assessment.consistentWindowObserved;
  entry.finishedAt=new Date().toISOString();
  await checkpoint();
  if(entry.timedOut)throw Error('Sustained observation deadline reached: '+name);
}
async function run(key){
  auth={Authorization:'Bearer '+key};
  const identity=requireSuccess(await request('https://config.onpagelove.com','/console/index.html',{headers:auth}),'Host identity');
  if(!identity.body.includes('dav-sane-guild-8399.onpagelove.com'))throw Error('Host identity mismatch');
  const baseline=await ownerRead('/scores.html');
  proof.productionBefore={sha256:hash(baseline.body),policy:scorePolicyIdentity(baseline.body)};
  await checkpoint();
  try{
    await put(target,wrap('<p>activation-base-document</p><ul id="records"></ul>'));
    await put(marker,wrap('<p>activation-base-document</p>'));
    const denied=await request(origin,target,{method:'POST',headers:{'Content-Type':'text/html',Range:'selector=#records'},body:'<li>baseline</li>'});
    if(![401,403].includes(denied.status)||(await snapshot()).length)throw Error('Fixture not confirmed denied before grant');
    record('baseline-denied',{status:denied.status});
    await put(policy,policyHtml('A'));await phase('initial-A','A',true);
    await put(policy,policyHtml('B'));await phase('updated-B','B',true);
    await put(policy,policyHtml('C',false));await phase('revoked-C','C',false);
    record('policy-deleted',await remove(policy));await phase('deleted',null,false,true);
  }finally{
    for(const path of [policy,target,marker]){
      if(!possibleWrites.has(path))continue;
      try{proof.cleanup.push(await remove(path));}catch{proof.cleanup.push({path,error:'Conditional cleanup not confirmed; inspect this exact fixture'});}
      // A disk error must not prevent cleanup of the other owned resources.
      try{await checkpoint();}catch{proof.checkpointError=true;}
    }
    try{const after=await ownerRead('/scores.html');proof.productionAfter={sha256:hash(after.body),policy:scorePolicyIdentity(after.body)};proof.productionUnchanged=proof.productionBefore.sha256===proof.productionAfter.sha256;proof.productionPolicyUnchanged=proof.productionBefore.policy===proof.productionAfter.policy;}catch{proof.productionReadbackError=true;}
  }
}
async function finish(){
  const clean=possibleWrites.size===0&&!proof.cleanup.some(r=>r.error);
  const confirmed=!proof.failure&&!proof.checkpointError&&clean&&proof.productionUnchanged&&proof.productionPolicyUnchanged&&proof.phases.length===4&&proof.phases.every(p=>p.assessment.status==='new policy consistently observed');
  proof.result={status:confirmed?'new policy consistently observed':'not confirmed',passed:!!confirmed,cleanupConfirmed:clean,globalReadinessGuaranteed:false,publicRequests:proof.phases.reduce((n,p)=>n+(p.assessment?.publicRequests||0),0)};
  proof.finishedAt=new Date().toISOString();await checkpoint();
  const rows=proof.phases.map(p=>`| ${p.name} | ${p.assessment?.status||'not confirmed'} | ${p.rounds.length} | ${p.assessment?.publicRequests||0} | ${((p.assessment?.observedMs||0)/1000).toFixed(1)} | ${p.assessment?.mismatchingRounds??'unknown'} |`).join('\n');
  await fs.writeFile(stem+'.md',`# Policy activation diagnostic\n\nResult: **${proof.result.status}**. This is a disposable-resource observation, not a production readiness guarantee.\n\nStarted: ${proof.startedAt}. Finished: ${proof.finishedAt}.\n\n| Phase | Result | Rounds | Public requests | Final matching window (seconds) | Mismatching rounds |\n| --- | --- | ---: | ---: | ---: | ---: |\n${rows}\n\nCleanup confirmed: ${clean}. Production document unchanged: ${proof.productionUnchanged??'unknown'}. Production policy unchanged: ${proof.productionPolicyUnchanged??'unknown'}. A changed full-document hash can reflect concurrent player activity; this checker never writes that resource.\n\n${proof.failure?'Failure: '+proof.failure+'.\n\n':''}Minimum matching window: ${OBSERVATION.stableMs/1000} seconds, ${OBSERVATION.minimumRounds} rounds; maximum inter-round gap ${OBSERVATION.maximumGapMs/1000} seconds; each phase stops after ${OBSERVATION.deadlineMs/1000} seconds plus at most one in-flight round. Any mismatch keeps the overall result not confirmed even if a later matching window is observed. These are diagnostic settings, not platform propagation guarantees.\n\n${proof.limitations.map(x=>'- '+x).join('\n')}\n\nJSON evidence: [request receipts](./${stem.split('/').at(-1)}.json). Production publisher guard is unchanged.\n`);
  console.log(JSON.stringify({result:proof.result,report:stem+'.md',receipt:stem+'.json'}));
  return confirmed?0:1;
}

if(process.argv.includes('--help')){
  console.log('bun tools/policy-activation-check.mjs\nInteractive hidden JSON input: key field only. Pinned host; disposable writes and conditional cleanup. Four phases, each requiring 120 seconds of matching observations, up to 300 seconds plus one round. Writes audit JSON/Markdown; any inconsistency exits 1. Does not authorize production policy changes.');
}else{
  if(!process.stdin.isTTY)throw Error('Use a hidden interactive TTY; no credentials in arguments or environment');
  await fs.mkdir('audit',{recursive:true});
  let input='',running=false;
  process.stdin.setRawMode(true);process.stdin.setEncoding('utf8');
  const interrupt=()=>{stopping=true;};process.on('SIGINT',interrupt);process.on('SIGTERM',interrupt);
  console.log('Ready for hidden JSON input. Ctrl+C requests cleanup; do not force-kill during a run.');
  process.stdin.on('data',async chunk=>{
    if(chunk.includes('\u0003')){stopping=true;if(!running){process.stdin.setRawMode(false);process.exit(130);}return;}
    if(running)return;
    input+=chunk;if(!/[\r\n]/.test(input))return;running=true;
    try{const options=JSON.parse(input);input='';if(typeof options.key!=='string'||!options.key)throw Error('Missing owner key');await run(options.key);options.key='';}
    catch(error){input='';proof.failure=error instanceof SyntaxError?'Invalid hidden JSON input':error.message;}
    finally{auth={};const code=await finish();process.stdin.setRawMode(false);process.exit(code);}
  });
}
