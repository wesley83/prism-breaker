// Isolated UI controls for reproducible faults; never shipped or written to live scores.
import fs from 'node:fs/promises';
await import('./final-browser-fixture.mjs');
let html=await fs.readFile('test-results/fixture/acceptance.html','utf8');
html=html.replace('id="qa-worlds"','id="qa-worlds"').replace('<pre id="qa-result"','<button id="qa-graphics-loss">Lose graphics context</button> <button id="qa-graphics-restore">Restore graphics context</button> <button id="qa-storage">Review actual IndexedDB</button> <button id="qa-resources">Review render resources</button><pre id="qa-result"');
html=html.replace('/__qa/acceptance-app.js','/__qa/review-app.js');
await fs.writeFile('test-results/fixture/review-bootstrap.js',`const controller=navigator.serviceWorker?.controller;if(controller)await new Promise((resolve,reject)=>{const c=new MessageChannel(),timer=setTimeout(()=>reject(Error('Worker handshake timed out')),5000);c.port1.onmessage=()=>{clearTimeout(timer);c.port1.close();resolve();};controller.postMessage({type:'CLIENT_VERSION',version:'network'},[c.port2]);});await import('/__qa/review-app.js');`);await fs.writeFile('test-results/fixture/reviews.html',html);
const app=await fs.readFile('test-results/fixture/acceptance-app.js','utf8');
const extra=`
import {OfflineStore} from "/offline.js";
let qaContextExtension;
$('#qa-storage').onclick=async()=>{let first,second,store,other;try{const name='prism-review-'+crypto.randomUUID();store=new OfflineStore({name});other=new OfflineStore({name});const run={id:crypto.randomUUID(),ruleset:RULESET_REVISION,mode:'daily',day:'2026-10-14',score:1234,level:1,seconds:20};let sent=0;
first=new ScoreOutbox({store,send:async()=>{throw Error('controlled outage');}});await first.enqueue(run,'QA Offline');await first.sync({force:true});const queued=await first.get(run.id);first.dispose();
const send=async()=>{sent++;await qaSleep(40);return {submittedAt:new Date().toISOString()};};second=new ScoreOutbox({store:other,send});const third=new ScoreOutbox({store,send});await Promise.all([second.retry(run.id),third.retry(run.id)]);const saved=await second.get(run.id);third.dispose();
let abort=true;try{await store.transaction('metadata','readwrite',s=>{s.put('should not commit','abort-probe');throw Error('abort');});abort=false;}catch{}const absent=await store.transaction('metadata','readonly',(s,done)=>{s.get('abort-probe').onsuccess=e=>done(e.target.result===undefined);});
qaReport({actualIndexedDB:{queuedAfterOutage:queued.status,sent,saved:saved.status,originalDay:saved.run.day,transactionAborted:abort&&absent},errors:qaErrors});
const db=await store.open(),db2=await other.open();db.close();db2.close();indexedDB.deleteDatabase(name);
}catch(e){qaReport({failure:e.message});}finally{first?.dispose();second?.dispose();}};
$('#qa-graphics-loss').onclick=async()=>{try{home();await begin('campaign');game.launch();await qaSleep(100);qaContextExtension=stage.renderer.getContext().getExtension('WEBGL_lose_context');if(!qaContextExtension)return qaReport({graphicsLoss:'unsupported'});const elapsed=game.elapsed;qaContextExtension.loseContext();await qaSleep(700);qaReport({graphicsLoss:{state:game.state,elapsedDelta:game.elapsed-elapsed,errorVisible:!$('#error').hidden,blocked:typeof graphicsRecovery==='undefined'?null:graphicsRecovery.blocked},errors:qaErrors});}catch(e){qaReport({failure:e.message});}};
$('#qa-graphics-restore').onclick=async()=>{qaContextExtension?.restoreContext();await qaSleep(1000);qaReport({graphicsRestored:{state:game.state,errorVisible:!$('#error').hidden,blocked:typeof graphicsRecovery==='undefined'?null:graphicsRecovery.blocked},errors:qaErrors});};
$('#qa-resources').onclick=async()=>{try{home();const memory=[];for(let pass=0;pass<3;pass++){for(let index=0;index<WORLD_COUNT;index++){game.start('practice',index);stage.render(game,0,pass*20+index,'game');for(const kind of Object.keys(POWERS))game.drops.push({id:++game.uid,kind,x:0,y:0});stage.render(game,0,pass*20+index,'game');stage.reset();await qaSleep(10);}memory.push({...stage.renderer.info.memory});}home();qaReport({resourcePasses:memory,errors:qaErrors});}catch(e){qaReport({failure:e.message});}};
`;
await fs.writeFile('test-results/fixture/review-app.js',app+extra);console.log('Review fixture: http://127.0.0.1:4173/__qa/reviews.html');
