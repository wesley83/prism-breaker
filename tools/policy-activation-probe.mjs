import fs from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {DOMParser} from 'linkedom';
import {scorePolicyIdentity} from './policy-publication.mjs';

const origin='https://sane-guild-8399.onpagelove.com',dav='https://dav-sane-guild-8399.onpagelove.com';
const id=randomUUID(),target='/_prism-activation-data-'+id+'.html',policy='/_prism-activation-policy-'+id+'.html';
const readTarget='/_prism-activation-read-'+id+'.html';
const output='audit/2026-10-15-policy-activation-'+id+'.json';
const proof={startedAt:new Date().toISOString(),origin,target,readTarget,policy,readMarkerSeparated:true,publicMutations:'Synthetic POSTs to the disposable #records list only',events:[],cleanup:[]};
const hash=value=>createHash('sha256').update(value).digest('hex');
const parse=html=>new DOMParser().parseFromString(html,'text/html');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const record=(name,data)=>{const event={name,utc:new Date().toISOString(),...data};proof.events.push(event);console.log(JSON.stringify(name==='sample'?{name,phase:data.phase,elapsedMs:data.elapsedMs,get1:[data.get1.status,data.get1.marker],get2:[data.get2.status,data.get2.marker],optionsAllow:data.options.headers.allow,postA:[data.postA.status,data.postA.marker],postB:[data.postB.status,data.postB.marker],added:data.added}:name==='published'?{name,revision:data.revision,sourceVerified:data.sourceVerified,grant:data.grant,committedAt:data.committedAt}:event));};
const wrap=body=>'<!doctype html><html><head><meta name="robots" content="noindex"><title>Disposable activation probe</title></head><body>'+body+'</body></html>';
function policyHtml(revision,{grant=true,accepted=revision}={}){
  const rule=grant?'<div itemscope itemtype="https://pagelove.org/AuthorizationRule"><meta itemprop="actor" content="*"><meta itemprop="resource" content="'+target+'"><meta itemprop="method" content="POST"><meta itemprop="selector" content="#records"><meta itemprop="action" content="Allow"></div>':'';
  const trigger=(method,code)=>'<div itemscope itemtype="https://pagelove.org/Trigger"><meta itemprop="resource" content="'+(method==='GET'?readTarget:target)+'"><meta itemprop="method" content="'+method+'"><div itemprop="action" itemscope itemtype="https://pagelove.org/Sessel"><script itemprop="source" type="text/sessel">'+code+'</script></div></div>';
  return wrap(rule+trigger('GET','@schema HTTPResponse url("https://pagelove.org/HTTPResponse"); throw new HTTPResponse {status: 418, body: "activation-revision-'+revision+'"}')+trigger('POST','@schema Context url("https://pagelove.org/Context"); @schema HTTPResponse url("https://pagelove.org/HTTPResponse"); if (!Context.request.body.matches("^<li>'+accepted+'</li>$")) {throw new HTTPResponse {status: 422, body: "activation-reject-'+revision+'"}}'));
}
async function run(key){
  const auth={Authorization:'Bearer '+key};const created=new Set();
  const req=async(base,path,options={})=>{
    const method=options.method||'GET';if(!['GET','OPTIONS'].includes(method)&&![target,readTarget,policy].includes(path))throw Error('Mutation outside disposable allowlist');
    const begin=performance.now(),r=await fetch(base+path,{...options,redirect:'manual',signal:AbortSignal.timeout(20000)}),body=await r.text();
    const headers=Object.fromEntries([...r.headers].filter(([name])=>/^(date|etag|allow|accept-ranges|content-type|cache-control|age|server|server-timing|x-request-id|request-id|x-correlation-id|traceparent|x-policy-version|x-policy-revision)$/.test(name)));
    return {status:r.status,ok:r.ok,body,etag:r.headers.get('etag'),elapsedMs:Math.round(performance.now()-begin),headers};
  };
  const readOwner=async path=>{const r=await req(dav,path,{headers:auth});if(!r.ok)throw Error('Owner read '+path+' '+r.status);return r;};
  const identity=await req('https://config.onpagelove.com','/console/index.html',{headers:auth});if(!identity.ok||!identity.body.includes('dav-sane-guild-8399.onpagelove.com'))throw Error('Host identity failed');
  const baseline=await readOwner('/scores.html');proof.productionBefore={sha256:hash(baseline.body),policy:scorePolicyIdentity(baseline.body)};
  proof.references=[];
  for(const slug of ['permissions','reacting-to-changes','protocol']){
    const file='.private/reference/activation-'+slug+'.html',html=await fs.readFile(file,'utf8'),text=parse(html).body.textContent.replace(/\s+/g,' ');
    const excerpts=[];for(const term of ['60 seconds','OPTIONS method','cache','revision','readiness']){const index=text.toLowerCase().indexOf(term.toLowerCase());if(index>=0)excerpts.push({term,text:text.slice(Math.max(0,index-100),index+650)});}
    proof.references.push({url:'https://docs.pagelove.com/all/reference/'+slug+'/',provenance:'Fresh direct HTTPS read performed immediately before this run',sha256:hash(html),excerpts});
  }
  function summarize(r){return {status:r.status,elapsedMs:r.elapsedMs,headers:r.headers,marker:r.body.match(/activation-(?:revision|reject)-[ABC]/)?.[0]||null,body:r.body.slice(0,1400)};}
  async function ownerSnapshot(){const r=await readOwner(target);return {etag:r.etag,rows:[...parse(r.body).querySelectorAll('#records > li')].map(n=>n.textContent)};}
  async function publish(revision,options){
    const html=policyHtml(revision,options),prior=created.has(policy)?await readOwner(policy):null;
    if(prior&&!prior.etag)throw Error('Missing policy ETag');
    const r=await req(dav,policy,{method:'PUT',headers:{...auth,'Content-Type':'text/html',...(prior?{'If-Match':prior.etag}:{'If-None-Match':'*'})},body:html});
    if(!r.ok)throw Error('Policy publish '+r.status);created.add(policy);const committed=Date.now();
    const readback=await readOwner(policy),doc=parse(readback.body);
    const sourceScripts=[...parse(html).querySelectorAll('script')].map(s=>s.textContent);
    const storedScripts=[...doc.querySelectorAll('script')].map(s=>s.textContent);
    if(JSON.stringify(sourceScripts)!==JSON.stringify(storedScripts)||[...doc.querySelectorAll('meta[itemprop="resource"]')].some(m=>![target,readTarget].includes(m.getAttribute('content'))))throw Error('Policy source readback mismatch');
    record('published',{revision,status:r.status,committedAt:new Date(committed).toISOString(),etagBefore:prior?.etag,etagAfter:readback.etag,grant:options?.grant!==false,sourceSha256:hash(html),storedSha256:hash(readback.body),sourceVerified:true,source:html});
    return committed;
  }
  async function sample(phase,committed,offset){
    const queries=()=>'?cb='+Date.now()+'-'+randomUUID();
    const headers={'Cache-Control':'no-cache'};
    const before=await ownerSnapshot();
    const get1=await req(origin,readTarget+queries(),{headers,cache:'no-store'});
    const options=await req(origin,target+queries(),{method:'OPTIONS',headers:{...headers,Range:'selector=#records'},cache:'no-store'});
    const postA=await req(origin,target,{method:'POST',headers:{...headers,'Content-Type':'text/html',Range:'selector=#records'},body:'<li>A</li>',cache:'no-store'});
    const postB=await req(origin,target,{method:'POST',headers:{...headers,'Content-Type':'text/html',Range:'selector=#records'},body:'<li>B</li>',cache:'no-store'});
    const get2=await req(origin,readTarget+queries(),{headers,cache:'no-store'});
    const after=await ownerSnapshot();
    record('sample',{phase,scheduledOffsetSeconds:offset,elapsedMs:Date.now()-committed,get1:summarize(get1),options:summarize(options),postA:summarize(postA),postB:summarize(postB),get2:summarize(get2),rowsBefore:before.rows.length,rowsAfter:after.rows.length,added:after.rows.slice(before.rows.length),priorRowsPreserved:JSON.stringify(after.rows.slice(0,before.rows.length))===JSON.stringify(before.rows)});
  }
  async function phase(name,committed,offsets){for(const offset of offsets){const due=committed+offset*1000;while(Date.now()<due)await sleep(Math.min(5000,due-Date.now()));await sample(name,committed,offset);}}
  try{
    const data=await req(dav,target,{method:'PUT',headers:{...auth,'Content-Type':'text/html','If-None-Match':'*'},body:wrap('<p>activation-base-document</p><ul id="records"></ul>')});
    if(!data.ok)throw Error('Fixture creation '+data.status);created.add(target);
    const readFixture=await req(dav,readTarget,{method:'PUT',headers:{...auth,'Content-Type':'text/html','If-None-Match':'*'},body:wrap('<p>activation-base-document</p>')});
    if(!readFixture.ok)throw Error('Read fixture creation '+readFixture.status);created.add(readTarget);
    const baselinePost=await req(origin,target,{method:'POST',headers:{'Content-Type':'text/html',Range:'selector=#records'},body:'<li>baseline</li>'});
    const initial=await ownerSnapshot();record('before-grant',{post:summarize(baselinePost),storedRows:initial.rows});
    if(baselinePost.ok||initial.rows.length)throw Error('Fixture is writable without the scoped grant; stop to avoid ambiguous authorization evidence');
    const a=await publish('A');await phase('initial-A',a,[0,1,3,8,20,40,65]);
    const b=await publish('B');await phase('updated-B',b,[0,1,3,8,20,40,65,90]);
    const c=await publish('C',{grant:false,accepted:'B'});await phase('revoked-C',c,[0,1,3,8,20,40,65]);
    const prior=await readOwner(policy);const del=await req(dav,policy,{method:'DELETE',headers:{...auth,'If-Match':prior.etag}});if(!del.ok)throw Error('Policy removal '+del.status);const deletedAt=Date.now();
    const absent=await req(dav,policy,{headers:auth});record('policy-deleted',{status:del.status,readStatus:absent.status,deletedAt:new Date(deletedAt).toISOString()});if(absent.status!==404)throw Error('Policy still stored after deletion');created.delete(policy);
    await phase('deleted',deletedAt,[0,1,3,8,20,40,65]);
  }finally{
    for(const path of [policy,target,readTarget]){if(!created.has(path))continue;try{const r=await req(dav,path,{method:'DELETE',headers:auth}),read=await req(dav,path,{headers:auth});proof.cleanup.push({path,status:r.status,readStatus:read.status});}catch(error){proof.cleanup.push({path,error:error.message});}}
    const after=await readOwner('/scores.html');proof.productionAfter={sha256:hash(after.body),policy:scorePolicyIdentity(after.body)};proof.productionUnchanged=proof.productionBefore.sha256===proof.productionAfter.sha256;proof.productionPolicyUnchanged=proof.productionBefore.policy===proof.productionAfter.policy;
    record('finished',{cleanup:proof.cleanup,productionUnchanged:proof.productionUnchanged,productionPolicyUnchanged:proof.productionPolicyUnchanged});
    if(proof.cleanup.some(r=>r.readStatus!==404))throw Error('Disposable cleanup incomplete');
  }
}
let input='';if(!process.stdin.isTTY)throw Error('Use hidden TTY input');process.stdin.setRawMode(true);process.stdin.setEncoding('utf8');console.log('Ready for hidden JSON input.');
process.stdin.on('data',async chunk=>{input+=chunk;if(!/[\r\n]/.test(input))return;process.stdin.removeAllListeners('data');try{const options=JSON.parse(input);input='';await run(options.key);options.key='';}catch(error){proof.failure=error.message;console.log(JSON.stringify({failure:error.message}));process.exitCode=1;}finally{proof.finishedAt=new Date().toISOString();await fs.writeFile(output,JSON.stringify(proof,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:output}));process.exit(process.exitCode||0);}});
