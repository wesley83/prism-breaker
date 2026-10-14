// Explicit acceptance check. Credentials arrive only through hidden stdin.
// Creates one zero-point production run, then removes only that run using ETags.
// All destructive boundary probes use a uniquely named disposable score document.
import fs from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {DOMParser} from 'linkedom';
import {WORLDS,RULESET_REVISION} from '../public/levels.js';
import {parseWorld} from '../public/world-format.js';
const origin='https://sane-guild-8399.onpagelove.com',dav='https://dav-sane-guild-8399.onpagelove.com';
const hash=s=>createHash('sha256').update(s).digest('hex');
const receipt={utc:new Date().toISOString(),origin,checks:[],cleanup:[]};
const record=(name,result)=>{receipt.checks.push({name,...result});console.log(JSON.stringify({name,...result}));};
const request=async(base,path,options={})=>{const r=await fetch(base+path,{...options,signal:AbortSignal.timeout(20000)});return {status:r.status,ok:r.ok,etag:r.headers.get('etag'),date:r.headers.get('date'),body:await r.text()};};
const rows=html=>[...new DOMParser().parseFromString(html,'text/html').querySelectorAll('#scores > li')].map(li=>Object.fromEntries([...li.querySelectorAll('meta[itemprop]')].map(m=>[m.getAttribute('itemprop'),m.getAttribute('content')])));
let input='';if(process.stdin.isTTY)process.stdin.setRawMode(true);process.stdin.setEncoding('utf8');console.log('Ready for hidden JSON input.');
process.stdin.on('data',async chunk=>{input+=chunk;if(!/[\r\n]/.test(input))return;process.stdin.removeAllListeners('data');try{const {key}=JSON.parse(input.trim());input='';await run(key);process.exitCode=0;}catch(e){receipt.failure=e.message;console.log(JSON.stringify({failure:e.message}));process.exitCode=1;}finally{await fs.writeFile('audit/2026-10-14-final-live-check.json',JSON.stringify(receipt,null,2));process.exit(process.exitCode);}});
async function run(key){
 const auth={Authorization:'Bearer '+key,'Content-Type':'text/html; charset=utf-8'};
 const identity=await request('https://config.onpagelove.com','/console/index.html',{headers:auth});if(!identity.ok||!identity.body.includes('dav-sane-guild-8399.onpagelove.com'))throw Error('Host identity verification failed');
 const home=await request(origin,'/');record('live-home',{status:home.status,release:home.body.match(/name="prism-release" content="([^"]+)"/)?.[1]||null});
 const assets=['/app.js','/engine.js','/levels.js','/leaderboard.js','/offline.js','/cinematic-score.js','/daily-score.js','/scores.html'];
 for(const path of assets){const live=await request(origin,path),local=await fs.readFile('public'+path,'utf8');record('live-source'+path,{status:live.status,...(path==='/scores.html'?{records:rows(live.body).length,expiryRulesPresent:live.body.includes('Only expired scores can be deleted.')}:{matchesSource:hash(live.body)===hash(local),sha256:hash(live.body)})});if(!live.ok)throw Error('Live asset failed '+path);}
 for(const world of WORLDS){const live=await request(origin,'/worlds/'+world.slug+'/definition.html');const parsed=parseWorld(live.body,{Parser:DOMParser,expectedSlug:world.slug});record('world-'+world.slug,{status:live.status,identity:parsed.id,formations:parsed.formations.length,bricks:parsed.formations.map(f=>f.bricks.length)});}
 const id=randomUUID(),resource='/_prism-final-scores-'+id+'.html',runId=randomUUID(),type=origin+'/AcceptanceRun-'+id;
 let productionAttempted=false,created=false;
 const html=(id,score=0)=>'<li itemscope itemtype="'+origin+'/Run"><meta itemprop="runKey" content="'+id+'"><meta itemprop="player" content="QA-acceptance"><meta itemprop="score" content="'+score+'"><meta itemprop="level" content="1"><meta itemprop="mode" content="campaign"><meta itemprop="day" content="all"><meta itemprop="seconds" content="1"><meta itemprop="submittedAt" content="'+new Date().toISOString()+'"><meta itemprop="ruleset" content="'+RULESET_REVISION+'"></li>';
 try{
  const live=await request(dav,'/scores.html',{headers:auth});if(!live.ok)throw Error('Cannot back up live score rules');
  // Preserve production policy text exactly; change only target path and schema identity.
  const template=live.body.replace(/<ul\b[^>]*id="scores"[^>]*>[\s\S]*?<\/ul>/,'<ul id="scores"></ul>');
  const isolated=template.replaceAll('/scores.html',resource).replaceAll(origin+'/Run',type).replaceAll('onpagelove[.]com/Run','onpagelove[.]com/AcceptanceRun-'+id);
  const createdResponse=await request(dav,resource,{method:'PUT',headers:{...auth,'If-None-Match':'*'},body:isolated});created=createdResponse.ok;if(!created)throw Error('Disposable board creation '+createdResponse.status);
  record('disposable-production-rules-copy',{status:createdResponse.status,sha256:hash(isolated)});
  productionAttempted=true;
  const posted=await request(origin,'/scores.html',{method:'POST',headers:{'Content-Type':'text/html',Range:'selector=#scores'},body:html(runId)});
  const readback=await request(dav,'/scores.html',{headers:auth}),saved=rows(readback.body).filter(r=>r.runKey===runId);
  record('production-score-submit',{status:posted.status,persistedCount:saved.length,serverExpiryMs:saved[0]?Number(saved[0].expiresAt)-Date.now():null});
  if(posted.ok){const duplicate=await request(origin,'/scores.html',{method:'POST',headers:{'Content-Type':'text/html',Range:'selector=#scores'},body:html(runId)});const after=await request(dav,'/scores.html',{headers:auth});record('production-duplicate',{status:duplicate.status,persistedCount:rows(after.body).filter(r=>r.runKey===runId).length});}
  const sampleId=randomUUID(),sample=html(sampleId).replace(origin+'/Run',type);
  // New policies can have delayed discovery; retry a harmless empty read, then submission.
  await request(origin,resource);
  const submitted=await request(origin,resource,{method:'POST',headers:{'Content-Type':'text/html',Range:'selector=#scores'},body:sample});
  record('isolated-valid-submit',{status:submitted.status,detail:submitted.ok?'accepted':submitted.body.slice(0,350)});
  for(const [name,body]of [['invalid-score',sample.replace('content="0"','content="-1"')],['client-expiry',sample.replace('</li>','<meta itemprop="expiresAt" content="1"></li>')]]){
   const r=await request(origin,resource,{method:'POST',headers:{'Content-Type':'text/html',Range:'selector=#scores'},body});record(name,{status:r.status,detail:r.ok?'unexpected acceptance':r.body.slice(0,200)});
  }
  // Seed explicit expiry timestamps using owner authoring, only on this disposable board.
  const now=Date.now(),ids={expired:randomUUID(),active:randomUUID()},fixtureRows=[['expired',now-10000],['active',now+432000000]].map(([kind,expires])=>html(ids[kind]).replace(origin+'/Run',type).replace('</li>','<meta itemprop="expiresAt" content="'+expires+'"></li>')).join('');
  const state=await request(dav,resource,{headers:auth});const seeded=await request(dav,resource,{method:'PUT',headers:{...auth,'If-Match':state.etag},body:isolated.replace('<ul id="scores"></ul>','<ul id="scores">'+fixtureRows+'</ul>')});if(!seeded.ok)throw Error('Expiry fixture seed '+seeded.status);
  for(const [name,range]of [['unrestricted-delete','selector=#scores > li'],['future-cutoff-delete','selector=#scores > li:has(meta[itemprop="expiresAt"]:value-less-than("'+(now+864000000)+'"))']]){const r=await request(origin,resource,{method:'DELETE',headers:{Range:range}});const check=rows((await request(dav,resource,{headers:auth})).body);record(name,{status:r.status,retained:check.length});}
  const get=await request(origin,resource,{headers:{Range:'selector=#scores'}});
  await new Promise(resolve=>setTimeout(resolve,1500));
  let stored=rows((await request(dav,resource,{headers:auth})).body);record('server-get-cleanup',{status:get.status,expiredPresent:stored.some(r=>r.runKey===ids.expired),activePresent:stored.some(r=>r.runKey===ids.active)});
  const deletion=await request(origin,resource,{method:'DELETE',headers:{Range:'selector=#scores > li:has(meta[itemprop="expiresAt"]:value-less-than("'+Date.now()+'"))'}});
  stored=rows((await request(dav,resource,{headers:auth})).body);record('public-expired-only-cleanup',{status:deletion.status,expiredPresent:stored.some(r=>r.runKey===ids.expired),activePresent:stored.some(r=>r.runKey===ids.active)});
 }finally{
  if(productionAttempted){let cleaned=false;for(let attempt=0;attempt<5;attempt++){const current=await request(dav,'/scores.html',{headers:auth});if(!current.ok||!current.etag)throw Error('Cannot safely clean production QA run');const existing=rows(current.body);if(!existing.some(r=>r.runKey===runId)){cleaned=true;break;}const body=current.body.replace(/<li\b[^>]*>[\s\S]*?<\/li>/g,row=>row.includes('content="'+runId+'"')?'':row);const write=await request(dav,'/scores.html',{method:'PUT',headers:{...auth,'If-Match':current.etag},body});if(write.status===412)continue;if(!write.ok)throw Error('Production QA cleanup failed '+write.status);const after=rows((await request(dav,'/scores.html',{headers:auth})).body),other=existing.filter(r=>r.runKey!==runId);cleaned=!after.some(r=>r.runKey===runId)&&other.every(r=>after.some(a=>a.runKey===r.runKey));receipt.cleanup.push({resource:'/scores.html',qaRunRemoved:cleaned,otherRunsPreserved:other.length});break;}if(!cleaned)throw Error('Production QA cleanup not confirmed');}
  if(created){const r=await request(dav,resource,{method:'DELETE',headers:auth}),after=await request(dav,resource,{headers:auth});receipt.cleanup.push({resource,status:r.status,readStatus:after.status});if(after.status!==404)throw Error('Disposable board cleanup not confirmed');}
 }
}
