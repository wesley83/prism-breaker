import fs from 'node:fs/promises';
import {createHash, randomUUID} from 'node:crypto';
import {DOMParser} from 'linkedom';
import {activeScores} from '../public/leaderboard.js';
import {scorePolicyIdentity} from './policy-publication.mjs';

const origin='https://sane-guild-8399.onpagelove.com';
const dav='https://dav-sane-guild-8399.onpagelove.com';
const output='audit/2026-10-15-multiple-score-expiry.json';
const proof={startedAt:new Date().toISOString(),scope:'isolated public request and production-filter verification; not a browser UI test',checks:[]};
const hash=value=>createHash('sha256').update(value).digest('hex');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const record=(name,data)=>{const item={name,utc:new Date().toISOString(),...data};proof.checks.push(item);console.log(JSON.stringify(item));};
function rows(body){
  const doc=new DOMParser().parseFromString(body,'text/html');
  if(!doc.querySelector('#scores'))throw Error('Response missing score list');
  return [...doc.querySelectorAll('#scores > li')].map(li=>Object.fromEntries([...li.querySelectorAll('meta[itemprop]')].map(meta=>[meta.getAttribute('itemprop'),meta.getAttribute('content')])));
}
async function run(key){
  const auth={Authorization:'Bearer '+key};
  const request=async(base,path,options={})=>{
    const r=await fetch(base+path,{...options,redirect:'error',signal:AbortSignal.timeout(20000)});
    return {status:r.status,ok:r.ok,etag:r.headers.get('etag'),serverTime:Date.parse(r.headers.get('date')),body:await r.text()};
  };
  const inspect=async path=>{const r=await request(dav,path,{headers:auth});if(!r.ok)throw Error('Authoring read '+r.status);return r;};
  const identity=await request('https://config.onpagelove.com','/console/index.html',{headers:auth});
  if(!identity.ok||!identity.body.includes('dav-sane-guild-8399.onpagelove.com'))throw Error('Host identity failed');
  const baseline=await inspect('/scores.html');
  const target='/_prism-multiple-expiry-'+randomUUID()+'.html';
  const type=origin+'/MultipleExpiry-'+randomUUID();
  proof.target=target;
  proof.productionBefore={sha256:hash(baseline.body),policy:scorePolicyIdentity(baseline.body)};
  const template=baseline.body.replace(/<ul\b[^>]*id="scores"[^>]*>[\s\S]*?<\/ul>/,'<ul id="scores"></ul>')
    .replaceAll('/scores.html',target).replaceAll(origin+'/Run',type)
    .replaceAll('onpagelove[.]com/Run',type.replace(origin,'onpagelove[.]com'));
  if(template.includes('/scores.html')||rows(template).length)throw Error('Unsafe fixture transformation');
  let created=false;
  async function publicRead(label){
    let response;
    for(let attempt=1;attempt<=5;attempt++){
      response=await request(origin,target+'?cb='+Date.now(),{headers:{Range:'selector=#scores'},cache:'no-store'});
      if(response.ok)return response;
      record('failed-read',{label,attempt,status:response.status,body:response.body.slice(0,1500)});
      if(attempt<5)await sleep(2000);
    }
    throw Error(label+' failed HTTP '+response.status+' after bounded retries');
  }
  try{
    const put=await request(dav,target,{method:'PUT',headers:{...auth,'Content-Type':'text/html','If-None-Match':'*'},body:template});
    if(!put.ok)throw Error('Fixture create '+put.status);created=true;
    record('created',{status:put.status,target});
    // Empty reads exercise discovery without risking any active test record.
    for(let i=0;i<3;i++){await sleep(2000);const r=await publicRead('empty-discovery');record('empty-discovery',{status:r.status,rows:rows(r.body).length});}
    async function seed(includeExpired){
      const before=await inspect(target);
      if(!before.etag||!Number.isFinite(before.serverTime))throw Error('Missing ETag or server clock');
      const fixtures=[];
      for(let i=0;i<7;i++){
        const expired=includeExpired&&i%2===0;
        const expiresAt=before.serverTime+(expired?-(i+1)*60000:432000000+i*60000);
        fixtures.push({runKey:randomUUID(),player:(expired?'Expired ':'Active ')+i,score:100+i,level:1,mode:'campaign',day:'all',seconds:15,submittedAt:new Date(expiresAt-432000000).toISOString(),expiresAt});
      }
      const html=fixtures.map(row=>'<li itemscope itemtype="'+type+'">'+Object.entries(row).map(([k,v])=>'<meta itemprop="'+k+'" content="'+v+'">').join('')+'</li>').join('');
      const seeded=await request(dav,target,{method:'PUT',headers:{...auth,'Content-Type':'text/html','If-Match':before.etag},body:template.replace('<ul id="scores"></ul>','<ul id="scores">'+html+'</ul>')});
      if(!seeded.ok)throw Error('Fixture seed '+seeded.status);
      const expected=rows((await inspect(target)).body);
      if(expected.length!==7)throw Error('Seed readback mismatch');
      return {expected,active:expected.filter(row=>row.player.startsWith('Active '))};
    }
    function describe(body,expected){
      const actual=rows(body),active=actual.filter(row=>row.player.startsWith('Active '));
      const intact=JSON.stringify(active)===JSON.stringify(expected.active);
      return {stored:actual.map(row=>row.player),expiredRemaining:actual.filter(row=>row.player.startsWith('Expired ')).length,activeUnchanged:intact};
    }
    const controls=await seed(false);
    for(let i=0;i<3;i++){
      const r=await publicRead('active-only');
      await sleep(1000);const state=describe((await inspect(target)).body,controls);
      record('active-only-read',{status:r.status,...state});if(!state.activeUnchanged)throw Error('Active control changed');
    }
    for(const mode of ['native-get-only','game-get-plus-fallback']){
      const expected=await seed(true);
      record('seed-'+mode,describe((await inspect(target)).body,expected));
      async function view(index){
        const response=await publicRead(mode+'-'+index);
        const readRows=rows(response.body),now=Number.isFinite(response.serverTime)?response.serverTime:Date.now();
        let fallbackStatus=null;
        if(mode==='game-get-plus-fallback'&&readRows.some(row=>Number(row.expiresAt)<=now)){
          const range='selector=#scores > li:has(meta[itemprop="expiresAt"]:value-less-than("'+Math.floor(now)+'"))';
          fallbackStatus=(await request(origin,target,{method:'DELETE',headers:{Range:range},cache:'no-store'})).status;
        }
        const visible=activeScores(readRows,now).map(row=>row.player);
        record('view-'+mode,{index,status:response.status,fallbackStatus,visible,expiredVisible:visible.some(name=>name.startsWith('Expired '))});
        // DAV polls do not invoke the GET processor; they observe completion only.
        let state;
        for(let poll=0;poll<5;poll++){
          await sleep(1000);state=describe((await inspect(target)).body,expected);
          record('storage-'+mode,{index,poll,...state});
          if(!state.activeUnchanged)throw Error('Active control altered during cleanup');
          if(!state.expiredRemaining)break;
        }
        return state;
      }
      let state=await view(1);
      proof[mode]={allRemovedAfterOneAccess:state.expiredRemaining===0};
      for(let i=2;i<=6&&state.expiredRemaining;i++)state=await view(i);
      proof[mode].allRemovedAfterRepeatedAccess=state.expiredRemaining===0;
      for(let i=0;i<2;i++){const repeated=await view('idempotent-'+i);if(repeated.expiredRemaining||!repeated.activeUnchanged)throw Error('Repeat cleanup failed');}
      proof[mode].activeControlsPreserved=true;
    }
  }finally{
    if(created){const del=await request(dav,target,{method:'DELETE',headers:auth});const check=await request(dav,target,{headers:auth});proof.cleanup={status:del.status,readStatus:check.status};if(check.status!==404)throw Error('Fixture cleanup failed');}
    const after=await inspect('/scores.html');
    proof.productionAfter={sha256:hash(after.body),policy:scorePolicyIdentity(after.body)};
    proof.productionUnchanged=proof.productionBefore.sha256===proof.productionAfter.sha256;
    proof.productionPolicyUnchanged=proof.productionBefore.policy===proof.productionAfter.policy;
    record('finished',{cleanup:proof.cleanup,productionUnchanged:proof.productionUnchanged,productionPolicyUnchanged:proof.productionPolicyUnchanged});
  }
}
let input='';
if(!process.stdin.isTTY)throw Error('Use a hidden TTY for the owner credential');
process.stdin.setRawMode(true);process.stdin.setEncoding('utf8');
console.log('Ready for hidden JSON input.');
process.stdin.on('data',async chunk=>{
  input+=chunk;if(!/[\r\n]/.test(input))return;
  process.stdin.removeAllListeners('data');
  try{const parsed=JSON.parse(input);input='';await run(parsed.key);parsed.key='';}
  catch(error){proof.failure=error.message;console.log(JSON.stringify({failure:error.message}));process.exitCode=1;}
  finally{proof.finishedAt=new Date().toISOString();await fs.writeFile(output,JSON.stringify(proof,null,2)+'\n');process.exit(process.exitCode||0);}
});
