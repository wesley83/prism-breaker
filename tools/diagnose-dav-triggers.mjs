// Owner-authorized, disposable probes. No production world or authorization rules are changed.
import fs from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {worldPolicy} from './world-policy.mjs';
import {originalWorld,worldDocument} from '../public/world-format.js';
import {DOMParser} from 'linkedom';
const origin='https://sane-guild-8399.onpagelove.com';
const dav='https://dav-sane-guild-8399.onpagelove.com';
const hash=value=>createHash('sha256').update(value).digest('hex');
const wrap=content=>'<!doctype html><html><head><title>Disposable diagnostic</title></head><body>'+content+'</body></html>';
const trigger=(target,source,{methods=['GET','PUT'],language='JavaScript/Module'}={})=>'<div itemscope itemtype="https://pagelove.org/Trigger"><meta itemprop="resource" content="'+target+'">'+methods.map(method=>'<meta itemprop="method" content="'+method+'">').join('')+'<div itemprop="action" itemscope itemtype="https://pagelove.org/'+language+'"><script itemprop="source" type="'+(language==='Sessel'?'text/sessel':'module')+'">'+source.replace(/<\/script/gi,'<\\/script')+'</script></div></div>';
const deny='export default function(){throw {schema_url:"https://pagelove.org/HTTPResponse",status:422,body:"disposable-put-denied"};}';
let input='';
if(process.stdin.isTTY)process.stdin.setRawMode(true);
process.stdin.setEncoding('utf8');console.log('Enter hidden JSON with the approved host key.');
process.stdin.on('data',async chunk=>{
 if(chunk.includes('\u0003'))process.exit(1);input+=chunk;if(!input.includes('\n')&&!input.includes('\r'))return;
 process.stdin.removeAllListeners('data');let key;
 try{const options=JSON.parse(input.trim());key=options.key;if(typeof key!=='string'||!key)throw Error('Missing key');input='';await diagnose(key,options.mode);key='';process.exit(0);}
 catch(error){key='';input='';console.error(JSON.stringify({error:error.message}));process.exit(1);}
});
async function diagnose(key,mode){
 const auth={Authorization:'Bearer '+key,'Content-Type':'text/html; charset=utf-8'};
 const fetchSafe=(url,options={})=>fetch(url,{...options,signal:AbortSignal.timeout(20000)});
 const ownerRead=async target=>{const r=await fetchSafe(dav+target,{headers:auth});return {status:r.status,etag:r.headers.get('etag'),body:await r.text()};};
 const put=async(target,body,headers={})=>{const r=await fetchSafe(dav+target,{method:'PUT',headers:{...auth,...headers},body});return {status:r.status,body:await r.text()};};
 const consoleRead=await fetchSafe('https://config.onpagelove.com/console/index.html',{headers:{Authorization:'Bearer '+key}});
 if(!consoleRead.ok||!(await consoleRead.text()).includes('dav-sane-guild-8399.onpagelove.com'))throw Error('Pinned host identity/authentication failed');
 const id=randomUUID(),resources=[];let target,policy;
 const receipt={utc:new Date().toISOString(),origin,dav,isolatedPerCase:true,checks:[],cleanup:[]};
 const record=value=>{receipt.checks.push(value);console.log(JSON.stringify(value.attempts?{name:value.name,sourcePreserved:value.sourcePreserved,statuses:value.attempts.map(a=>a.status),messages:value.attempts.filter(a=>a.status!==200).map(a=>a.body.slice(0,350))}:value));};
 const remove=async p=>{const r=await fetchSafe(dav+p,{method:'DELETE',headers:auth});await r.text();if(!r.ok&&r.status!==404)throw Error('Diagnostic cleanup '+r.status);return r.status;};
 const allocate=async()=>{const suffix=randomUUID();target='/_prism-dav-diagnostic-'+suffix+'.html';policy='/_prism-dav-policy-'+suffix+'.html';resources.push(policy,target);const r=await put(target,wrap('<p id="marker">original</p>'),{'If-None-Match':'*'});if(r.status!==201)throw Error('Diagnostic target creation '+r.status);};
 const prepared=[];
 const getAction=async(name,source)=>{
  await allocate();const markup=wrap(trigger(target,source));const install=await put(policy,markup);if(install.status!==201)throw Error('Fresh action install '+install.status);
  const stored=await ownerRead(policy);const parsed=new DOMParser().parseFromString(stored.body,'text/html');const storedSource=parsed.querySelector('script[itemprop="source"]')?.textContent;
  const expectedSource=source.replace(/<\/script/gi,'<\\/script');
  prepared.push({name,target,sourcePreserved:storedSource===expectedSource,sourceHash:hash(expectedSource),storedHash:hash(storedSource||'')});
 };
 let failure;
 try{
  if(mode==='cache'){
   await allocate();const firstTarget=target,firstPolicy=policy;
   const reply=value=>'export default function(){throw {schema_url:"https://pagelove.org/HTTPResponse",status:418,body:'+JSON.stringify(value)+'};}';
   await put(firstPolicy,wrap(trigger(firstTarget,reply('policy-A'),{methods:['GET']})));
   const readPublic=async p=>{const r=await fetchSafe(origin+p+'?probe='+randomUUID(),{headers:{'Cache-Control':'no-cache'},cache:'no-store'});const body=await r.text();return {status:r.status,body:r.status===200?'normal-document':body.slice(0,350)};};
   record({name:'cache-baseline',result:await readPublic(firstTarget)});
   const policyBefore=await ownerRead(firstPolicy),replacement=wrap(trigger(firstTarget,reply('policy-B'),{methods:['GET']}));
   const updated=await put(firstPolicy,replacement,{'If-Match':policyBefore.etag}),readback=await ownerRead(firstPolicy);
   record({name:'cache-policy-update',status:updated.status,storedB:readback.body.includes('policy-B')});
   await allocate();const secondTarget=target,secondPolicy=policy;
   await put(secondPolicy,wrap(trigger(secondTarget,reply('policy-C'),{methods:['GET']})));
   const started=Date.now();for(const seconds of [0,1,5,15,31,61,91]){const delay=seconds*1000-(Date.now()-started);if(delay>0)await new Promise(resolve=>setTimeout(resolve,delay));record({name:'cache-freshness',elapsedSeconds:Math.round((Date.now()-started)/1000),updated:await readPublic(firstTarget),added:await readPublic(secondTarget)});}
   await remove(firstPolicy);record({name:'cache-policy-deleted',ownerRead:(await ownerRead(firstPolicy)).status,publicResult:await readPublic(firstTarget)});
  }else if(mode==='schema'){
   await allocate();const schemaTarget=target,definitionPolicy=policy,type=origin+'/DiagnosticType-'+randomUUID();
   const validator='export default function(){throw {schema_url:"https://pagelove.org/HTTPResponse",status:422,message:"disposable-schema-denied"};}';
   const schema='<div itemscope itemtype="https://pagelove.org/Schema"><meta itemprop="type" content="'+type+'"><div itemprop="property" itemscope itemtype="https://pagelove.org/Property"><meta itemprop="name" content="hp"><meta itemprop="type" content="https://schema.host/Integer"><meta itemprop="cardinality" content="1..1"></div><div itemprop="@validate" itemscope itemtype="https://pagelove.org/JavaScript/Module"><script itemprop="source" type="module">'+validator+'</script></div></div>';
   const installed=await put(definitionPolicy,wrap(schema));if(installed.status!==201)throw Error('Schema install '+installed.status);
   const js='import Probe from '+JSON.stringify(type)+' with {type:"https://pagelove.org/Schema"}; export default function(){const p=new Probe({hp:1});throw {schema_url:"https://pagelove.org/HTTPResponse",status:418,body:"schema-import-and-construction-succeeded"};}';
   await getAction('schema-js-construction',js);
   await allocate();const sesselTarget=target;
   const sessel='@schema Probe url("'+type+'"); @schema HTTPResponse url("https://pagelove.org/HTTPResponse"); new Probe {hp: 1}; throw new HTTPResponse {status: 418, body: "schema-construction-unexpectedly-succeeded"}';
   await put(policy,wrap(trigger(target,sessel,{methods:['GET'],language:'Sessel'})));
   // All definitions and controls exist before the first public read.
   const ownerSchema=await ownerRead(definitionPolicy);record({name:'schema-definition-readback',status:ownerSchema.status,validatorPreserved:new DOMParser().parseFromString(ownerSchema.body,'text/html').querySelector('script')?.textContent===validator});
   for(const item of prepared){const r=await fetchSafe(origin+item.target+'?probe='+randomUUID());record({name:item.name,status:r.status,body:(await r.text()).slice(0,3000)});}
   let r=await fetchSafe(origin+sesselTarget+'?probe='+randomUUID());record({name:'schema-sessel-construction',status:r.status,body:(await r.text()).slice(0,3000)});
   for(const [name,value]of [['always-rejected','<meta itemprop="hp" content="1">'],['missing-required',''],['invalid-integer','<meta itemprop="hp" content="invalid">']]){const before=await ownerRead(schemaTarget),marker='schema-'+name+'-'+randomUUID(),body=wrap('<article itemscope itemtype="'+type+'">'+value+'<p>'+marker+'</p></article>');const written=await put(schemaTarget,body,{'If-Match':before.etag}),after=await ownerRead(schemaTarget);record({name:'schema-dav-'+name,status:written.status,message:written.status<300?'accepted':written.body.slice(0,1000),persisted:after.body.includes(marker)});}
  }else if(mode==='runtime'){
   for(const [name,source]of [
    ['json-action','export default function(){throw {schema_url:"https://pagelove.org/HTTPResponse",status:418,body:JSON.stringify({probe:"json"})};}'],
    ['literal-action','export default function(){throw {schema_url:"https://pagelove.org/HTTPResponse",status:418,body:"runtime-literal"};}'],
    ['domparser-type','export default function(){throw {schema_url:"https://pagelove.org/HTTPResponse",status:418,body:typeof DOMParser};}'],
    ['domparser-parse','export default function(){const d=new DOMParser().parseFromString("<html><body><p id=probe>parsed</p></body></html>","text/html");throw {schema_url:"https://pagelove.org/HTTPResponse",status:418,body:d.querySelector("#probe").textContent};}'],
    ['runtime-error','export default function(){throw new Error("intentional-disposable-runtime-error");}'],
    ['syntax-error','export default function( { intentionally invalid module }']
   ])await getAction(name,source);
   const {guard}=await worldPolicy({paths:[target]});
   const instrumented=guard.replace('export default function(ctx)','function validateCandidate(ctx)').replace("reject(422,'Invalid world definition.');","reject(422,'Invalid world definition: '+String(error.message||error));");
   // Allocate the diagnostic target inside getAction; the virtual path must match its allowlist.
   const candidate=instrumented+'\nexport default function(){let result;try{validateCandidate({request:{method:"PUT",path:'+JSON.stringify(target)+',headers:{"If-Match":"probe"},body:'+JSON.stringify(worldDocument(originalWorld(0)))+'}});result={valid:true};}catch(error){result={valid:false,status:error.status,message:String(error.body||error.message||error)};}throw {schema_url:"https://pagelove.org/HTTPResponse",status:418,body:JSON.stringify(result)};}';
   await getAction('full-validator-get',candidate);
   const {guard:productionGuard}=await worldPolicy();
   const base=worldDocument(originalWorld(0)),instrumentedContract=productionGuard.replace('export default function(ctx)','function validateCandidate(ctx)').replace("reject(422,'Invalid world definition.');","reject(422,'Invalid world definition: '+String(error.message||error));");
   const tests=[['valid',base,{'If-Match':'probe'},'PUT','/worlds/prism-garden/definition.html'],['invalid-hp',base.replace('itemprop="hitpoints" content="1"','itemprop="hitpoints" content="99"'),{'If-Match':'probe'},'PUT','/worlds/prism-garden/definition.html'],['script',base.replace('</body>','<script>alert(1)</script></body>'),{'If-Match':'probe'},'PUT','/worlds/prism-garden/definition.html'],['unconditional',base,{},'PUT','/worlds/prism-garden/definition.html'],['wrong-identity',base,{'If-Match':'probe'},'PUT','/worlds/cloud-carnival/definition.html'],['delete',base,{'If-Match':'probe'},'DELETE','/worlds/prism-garden/definition.html']];
   const contract=instrumentedContract+'\nexport default function(){const cases='+JSON.stringify(tests)+';const results=cases.map(([name,body,headers,method,path])=>{try{validateCandidate({request:{body,headers,method,path}});return {name,accepted:true};}catch(e){return {name,accepted:false,status:e.status,message:String(e.body||e.message||e)};}});throw {schema_url:"https://pagelove.org/HTTPResponse",status:418,body:JSON.stringify(results)};}';
   await getAction('full-validator-contract',contract);
   // Build the entire policy set before public requests can populate a host schema cache.
   for(const item of prepared){const attempts=[];for(let attempt=0;attempt<2;attempt++){const r=await fetchSafe(origin+item.target+'?probe='+randomUUID(),{headers:{'Cache-Control':'no-cache'},cache:'no-store'});const body=await r.text();attempts.push({status:r.status,body:body.slice(0,2000),cache:r.headers.get('cache-control'),server:r.headers.get('server')});}record({...item,attempts});}
  }else{
  const matrix=[];
  for(const config of [
   {name:'js-external-get-put',source:deny,options:{}},
   {name:'js-external-put-only',source:deny,options:{methods:['PUT']}},
   {name:'js-external-any-method',source:deny,options:{methods:[]}},
   {name:'sessel-external-get-put',source:'@schema HTTPResponse url("https://pagelove.org/HTTPResponse"); throw new HTTPResponse {status: 422, body: "disposable-put-denied"}',options:{language:'Sessel'}},
   {name:'js-embedded-get-put',source:deny,options:{},embedded:true}
  ]){
   await allocate();
   const markup=trigger(target,config.source,config.options);
   if(config.embedded){await remove(policy);const before=await ownerRead(target);const r=await put(target,wrap('<p id="marker">embedded baseline</p>'+markup),{'If-Match':before.etag});if(r.status!==200)throw Error('Embedded baseline '+r.status);}
   else{const r=await put(policy,wrap(markup));if(![200,201].includes(r.status))throw Error('Policy install '+r.status);}
   matrix.push({...config,target,policy});
  }
  // Native schema persistence check, isolated by a unique type and path.
  await allocate();const schemaTarget=target,schemaType='urn:PrismDavDiagnostic:'+randomUUID();
  const schemaSource='export default function(){throw {schema_url:"https://pagelove.org/HTTPResponse",status:422,message:"disposable-schema-denied"};}';
  await put(policy,wrap('<div itemscope itemtype="https://pagelove.org/Schema"><meta itemprop="type" content="'+schemaType+'"><div itemprop="@validate" itemscope itemtype="https://pagelove.org/JavaScript/Module"><script itemprop="source" type="module">'+schemaSource+'</script></div></div>'));
  // A public read now loads the prepared host policy set.
  for(const config of matrix){target=config.target;policy=config.policy;
   const publicRead=await fetchSafe(origin+target+'?probe='+randomUUID(),{cache:'no-store'});const publicBody=await publicRead.text();
   const before=await ownerRead(target);if(before.status!==200||!before.etag)throw Error('Missing baseline/ETag');
   const marker=config.name+'-'+randomUUID(),body=wrap('<p id="marker">'+marker+'</p>');
   const write=await put(target,body,{'If-Match':before.etag});const after=await ownerRead(target);
   record({name:config.name,publicGet:publicRead.status,publicMessage:publicBody.slice(0,200),davPut:write.status,davMessage:write.status<300?'accepted':write.body.slice(0,250),readback:after.status,markerPersisted:after.body.includes(marker),changed:hash(before.body)!==hash(after.body)});
  }
  const schemaBefore=await ownerRead(schemaTarget),schemaWrite=await put(schemaTarget,wrap('<article itemscope itemtype="'+schemaType+'"><p id="schema-marker">schema-write-persisted</p></article>'),{'If-Match':schemaBefore.etag}),schemaAfter=await ownerRead(schemaTarget);
  record({name:'native-schema-dav-rejection',status:schemaWrite.status,message:schemaWrite.body.slice(0,500),persisted:schemaAfter.body.includes('schema-write-persisted')});
  // Authentication result, without adding a public-write permission.
  const response=await fetchSafe(origin+target,{method:'PUT',headers:auth,body:wrap('<p>public owner probe</p>')});record({name:'public-put-owner-key',status:response.status,body:(await response.text()).slice(0,250)});
  }
 }catch(error){failure=error;receipt.failure=error.message;}
 finally{
  for(const p of resources){try{const status=await remove(p);const read=await ownerRead(p);receipt.cleanup.push({path:p,deleteStatus:status,readStatus:read.status});}catch(error){receipt.cleanup.push({path:p,error:error.message});failure??=error;}}
  await fs.mkdir('audit',{recursive:true});const output='audit/2026-10-14-dav-diagnostic-'+id+'.json';await fs.writeFile(output,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({receipt:output,cleanup:receipt.cleanup}));
 }
 if(failure)throw failure;
}
