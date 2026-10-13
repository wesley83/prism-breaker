import test from 'node:test';
import assert from 'node:assert/strict';
import {OfflineStore,OfflineStorageError,ScoreOutbox,retryDelay} from '../public/offline.js';

// Exercise queue policy with an atomic storage adapter; browser review covers IDB.
class MemoryStore{
 rows=new Map();
 async mutate(id,change){const value=change(structuredClone(this.rows.get(id)??null));if(value===undefined)return null;if(value===null)this.rows.delete(id);else this.rows.set(id,structuredClone(value));return structuredClone(value);}
 async all(){return structuredClone([...this.rows.values()]);}
 async get(id){return structuredClone(this.rows.get(id)??null);}
 async prune(){}
}
const originalRun={id:'12345678-1234-1234-1234-123456789abc',score:12500,level:5,mode:'daily',day:'2026-10-13',seconds:98};
function queue(t,options={}){const outbox=new ScoreOutbox({store:new MemoryStore(),send:async()=>{},...options});t.after(()=>outbox.dispose());return outbox;}
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};

test('offline saves survive a new queue instance and retain the original challenge day',async t=>{
 const store=new MemoryStore(),first=queue(t,{store,isOnline:()=>false});
 const saved=await first.enqueue(originalRun,'Wes');
 assert.equal(saved.status,'queued');assert.equal(saved.run.submittedAt,undefined);
 await first.sync();assert.equal((await first.get(originalRun.id)).attempts,0);
 first.dispose();
 const now=Date.parse('2026-10-14T09:00:00Z'),sent=[];
 const reopened=queue(t,{store,now:()=>now,send:async(run,player)=>sent.push({run,player})});
 await reopened.sync();
 assert.equal(sent.length,1);assert.equal(sent[0].run.day,'2026-10-13');assert.equal(sent[0].run.id,originalRun.id);
 assert.equal(sent[0].run.submittedAt,'2026-10-14T09:00:00.000Z');assert.equal(sent[0].player,'Wes');
 assert.equal((await reopened.get(originalRun.id)).status,'sent');assert.deepEqual(await reopened.list(),[]);
});

test('two tabs and repeated saves send a run once and preserve the first saved payload',async t=>{
 const store=new MemoryStore(),started=deferred(),finish=deferred();let sends=0;
 const send=async()=>{sends++;started.resolve();await finish.promise;};
 const first=queue(t,{store,send}),second=queue(t,{store,send});
 await Promise.all([first.enqueue(originalRun,'Wes'),second.enqueue({...originalRun,score:1},'Other')]);
 const sending=first.sync();await started.promise;await second.sync();
 assert.equal(sends,1);
 finish.resolve();await sending;
 const receipt=await second.enqueue({...originalRun,score:50},'Other');
 assert.equal(receipt.status,'sent');assert.equal(receipt.run.score,12500);assert.equal(receipt.player,'Wes');
 await second.sync();assert.equal(sends,1);
});

test('retry timing backs off after network failure and uses a fresh submission timestamp',async t=>{
 let now=Date.parse('2026-10-13T12:00:00Z'),attempts=0;
 const outbox=queue(t,{now:()=>now,send:async()=>{if(++attempts===1)throw new Error('Connection interrupted.');}});
 await outbox.enqueue(originalRun,'Wes');await outbox.sync();
 const pending=await outbox.get(originalRun.id);
 assert.equal(pending.status,'queued');assert.equal(pending.nextAttemptAt,now+5000);assert.equal(pending.attempts,1);
 await outbox.sync();assert.equal(attempts,1);
 now+=5000;await outbox.sync();
 const receipt=await outbox.get(originalRun.id);
 assert.equal(receipt.status,'sent');assert.equal(receipt.run.submittedAt,'2026-10-13T12:00:05.000Z');
 assert.equal(retryDelay(500),300000);
});

test('confirmed validation rejection remains visible until retry or removal',async t=>{
 let attempts=0;
 const outbox=queue(t,{send:async()=>{attempts++;const error=new Error('The score was rejected.');error.permanent=true;throw error;}});
 await outbox.enqueue(originalRun,'Wes');await outbox.sync();
 assert.equal((await outbox.list())[0].status,'failed');assert.equal((await outbox.list())[0].lastError,'The score was rejected.');
 await outbox.sync({force:true});assert.equal(attempts,1);
 await outbox.retry(originalRun.id);assert.equal(attempts,2);
 await outbox.remove(originalRun.id);assert.deepEqual(await outbox.list(),[]);
});

test('removal cannot interrupt an active send lease',async t=>{
 const started=deferred(),finish=deferred(),outbox=queue(t,{send:async()=>{started.resolve();await finish.promise;}});
 await outbox.enqueue(originalRun,'Wes');const sending=outbox.sync();await started.promise;
 await assert.rejects(outbox.remove(originalRun.id),error=>error.code==='score-busy');
 finish.resolve();await sending;assert.equal((await outbox.get(originalRun.id)).status,'sent');
});

test('an expired tab lease cannot overwrite a newer successful receipt',async t=>{
 const store=new MemoryStore(),started=deferred(),finish=deferred();let now=100000;
 const first=queue(t,{store,now:()=>now,send:async()=>{started.resolve();await finish.promise;throw new Error('Old request failed.');}});
 const second=queue(t,{store,now:()=>now,send:async()=>({submittedAt:'2026-10-13T10:20:00.000Z'})});
 await first.enqueue(originalRun,'Wes');const oldSend=first.sync();await started.promise;
 now+=60001;await second.sync();finish.resolve();await oldSend;
 const receipt=await second.get(originalRun.id);
 assert.equal(receipt.status,'sent');assert.equal(receipt.attempts,2);assert.equal(receipt.lastError,'');assert.equal(receipt.run.submittedAt,'2026-10-13T10:20:00.000Z');
});

test('unavailable storage never reports a score as queued',async t=>{
 const events=[],outbox=queue(t,{store:new OfflineStore({indexedDB:null}),onChange:event=>events.push(event)});
 await assert.rejects(outbox.enqueue(originalRun,'Wes'),error=>error instanceof OfflineStorageError&&error.code==='storage-unavailable');
 assert.deepEqual(events,[]);
});

test('invalid names, impossible challenge dates and practice runs are rejected before storage',async t=>{
 const outbox=queue(t);
 for(const [run,name] of [[originalRun,'<Wes>'],[{...originalRun,day:'2026-02-30'},'Wes'],[{...originalRun,mode:'practice'},'Wes'],[{...originalRun,score:Infinity},'Wes']]){
  await assert.rejects(outbox.enqueue(run,name),error=>error.code==='invalid-score');
 }
 assert.deepEqual(await outbox.list(),[]);
});

test('failed durable receipt write keeps a recoverable lease instead of reporting sent',async t=>{
 const store=new MemoryStore(),mutate=store.mutate.bind(store),events=[];let writes=0;
 store.mutate=async(id,change)=>{if(++writes===3)throw new OfflineStorageError(new Error('Disk full.'));return mutate(id,change);};
 const outbox=queue(t,{store,onChange:event=>events.push(event.type)});
 await outbox.enqueue(originalRun,'Wes');await assert.rejects(outbox.sync(),OfflineStorageError);
 assert.equal((await outbox.get(originalRun.id)).status,'sending');assert.equal(events.includes('sent'),false);
});

test('a falsy send rejection is still a failed attempt',async t=>{
 const outbox=queue(t,{send:async()=>{throw null;}});
 await outbox.enqueue(originalRun,'Wes');await outbox.sync();
 assert.equal((await outbox.get(originalRun.id)).status,'queued');
});

test('a successful IDB request is not acknowledged until its transaction commits',async()=>{
 const transaction={objectStore:()=>({}),abort(){}},store=new OfflineStore();
 store.open=async()=>({transaction:()=>transaction});
 let committed=false;
 const saving=store.transaction('outbox','readwrite',(_,done)=>done('saved')).then(value=>{committed=true;return value;});
 await Promise.resolve();await Promise.resolve();
 assert.equal(committed,false);
 transaction.oncomplete();assert.equal(await saving,'saved');
});

test('an IDB transaction abort rejects even after a request produced a result',async()=>{
 const transaction={objectStore:()=>({}),abort(){},error:new Error('Quota exceeded.')},store=new OfflineStore();
 store.open=async()=>({transaction:()=>transaction});
 const saving=store.transaction('outbox','readwrite',(_,done)=>done('saved'));
 await Promise.resolve();transaction.onabort();
 await assert.rejects(saving,error=>error.code==='storage-unavailable');
});
