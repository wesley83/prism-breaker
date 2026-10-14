// Remove only the uniquely labelled run created by the live browser acceptance check.
import fs from 'node:fs/promises';
import {DOMParser} from 'linkedom';
const dav='https://dav-sane-guild-8399.onpagelove.com';let input='';
if(process.stdin.isTTY)process.stdin.setRawMode(true);process.stdin.setEncoding('utf8');console.log('Ready for hidden JSON input.');
process.stdin.on('data',async chunk=>{input+=chunk;if(!/[\r\n]/.test(input))return;process.stdin.removeAllListeners('data');try{const {key}=JSON.parse(input);input='';await cleanup(key);process.exit(0);}catch(e){console.log(JSON.stringify({error:e.message}));process.exit(1);}});
async function cleanup(key){
 const headers={Authorization:'Bearer '+key};
 const parse=body=>[...new DOMParser().parseFromString(body,'text/html').querySelectorAll('#scores > li')].map(li=>Object.fromEntries([...li.querySelectorAll('meta[itemprop]')].map(m=>[m.getAttribute('itemprop'),m.getAttribute('content')])));
 for(let attempt=0;attempt<5;attempt++){
  const r=await fetch(dav+'/scores.html',{headers,signal:AbortSignal.timeout(15000)});if(!r.ok||!r.headers.get('etag'))throw Error('Read failed');const body=await r.text(),rows=parse(body);
  const candidates=rows.filter(r=>r.player==='QA-E2E-14B'&&Number(r.score)===300&&r.mode==='daily'&&r.day==='2026-10-14'&&Math.abs(Date.now()-Date.parse(r.submittedAt))<3600000);
  if(candidates.length!==1)throw Error('Expected one newly created browser QA run; found '+candidates.length);
  const run=candidates[0],newBody=body.replace(/<li\b[^>]*>[\s\S]*?<\/li>/g,row=>row.includes('content="'+run.runKey+'"')?'':row);
  const write=await fetch(dav+'/scores.html',{method:'PUT',headers:{...headers,'Content-Type':'text/html','If-Match':r.headers.get('etag')},body:newBody,signal:AbortSignal.timeout(15000)});
  if(write.status===412)continue;if(!write.ok)throw Error('Cleanup failed '+write.status);
  const reread=await fetch(dav+'/scores.html',{headers,signal:AbortSignal.timeout(15000)});const after=parse(await reread.text());
  const proof={utc:new Date().toISOString(),browserRun:{mode:run.mode,day:run.day,score:Number(run.score),level:Number(run.level),submittedAt:run.submittedAt,expiresAt:Number(run.expiresAt),serverLifetimeMs:Number(run.expiresAt)-Date.parse(run.submittedAt)},removed:!after.some(r=>r.runKey===run.runKey),otherRunsPreserved:rows.filter(r=>r.runKey!==run.runKey).every(r=>after.some(a=>a.runKey===r.runKey)),otherRunCount:rows.length-1};
  await fs.writeFile('audit/2026-10-14-final-browser-live-score.json',JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));if(!proof.removed||!proof.otherRunsPreserved)throw Error('Cleanup verification failed');return;
 }
 throw Error('Concurrent updates prevented cleanup');
}
