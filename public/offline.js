import {LEGACY_RULESET_REVISION} from './world-identity.js';
import {WORLD_COUNT} from './levels.js';
// IndexedDB keeps score submissions intact across reloads, updates and tabs.
const DATABASE='prism-offline',VERSION=1,LEASE_MS=60000,RECEIPT_DAYS=30;

export class OfflineStorageError extends Error{
 constructor(cause){super('Offline storage is unavailable. Keep this result open and try again.',{cause});this.name='OfflineStorageError';this.code='storage-unavailable';}
}

function scoreRecord(run,player){
 const name=String(player??'').trim(),id=String(run?.id??'');
 const ruleset=run?.ruleset||LEGACY_RULESET_REVISION;if(!/^[a-f0-9]{64}$/.test(ruleset))throw Error('Invalid ruleset revision');
 const validDay=run?.mode==='campaign'?run.day==='all':/^\d{4}-\d{2}-\d{2}$/.test(run?.day??'')&&Number.isFinite(Date.parse(run.day+'T00:00:00Z'))&&new Date(run.day+'T00:00:00Z').toISOString().slice(0,10)===run.day;
 if(!/^[a-f0-9-]{36}$/.test(id)||!/^[A-Za-z0-9 _-]{2,16}$/.test(name)||!['campaign','daily'].includes(run?.mode)||!validDay||!Number.isInteger(run?.score)||run.score<0||run.score>1000000||!Number.isInteger(run?.level)||run.level<1||run.level>WORLD_COUNT||!Number.isInteger(run?.seconds)||run.seconds<1||run.seconds>99999){
  const error=new Error('This score cannot be submitted. Check the player name and run details.');error.code='invalid-score';throw error;
 }
 return {id,player:name,run:{id,ruleset,score:run.score,level:run.level,mode:run.mode,day:run.day,seconds:run.seconds}};
}

export class OfflineStore{
 constructor({indexedDB=globalThis.indexedDB,name=DATABASE}={}){this.indexedDB=indexedDB;this.name=name;this.opening=null;}
 async open(){
  if(!this.indexedDB)throw new OfflineStorageError();
  if(this.opening)return this.opening;
  const opening=new Promise((resolve,reject)=>{
   let request,settled=false;
   const finish=(error,db)=>{if(settled){db?.close();return;}settled=true;clearTimeout(timer);if(error)reject(new OfflineStorageError(error));else resolve(db);};
   const timer=setTimeout(()=>finish(new Error('Opening offline storage timed out.')),5000);
   try{request=this.indexedDB.open(this.name,VERSION);}catch(error){finish(error);return;}
   request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains('metadata'))db.createObjectStore('metadata');if(!db.objectStoreNames.contains('outbox'))db.createObjectStore('outbox',{keyPath:'id'});};
   request.onerror=()=>finish(request.error);
   request.onsuccess=()=>{const db=request.result,forget=()=>{if(this.opening===opening)this.opening=null;};db.onversionchange=()=>{db.close();forget();};db.onclose=forget;finish(null,db);};
  });
  this.opening=opening;
  try{return await opening;}catch(error){if(this.opening===opening)this.opening=null;throw error;}
 }
 async transaction(name,mode,work){
  const db=await this.open();
  return new Promise((resolve,reject)=>{
   let transaction,result;
   try{try{transaction=db.transaction(name,mode,{durability:'strict'});}catch(error){if(error.name!=='TypeError')throw error;transaction=db.transaction(name,mode);}}
   catch(error){this.opening=null;reject(new OfflineStorageError(error));return;}
   transaction.oncomplete=()=>resolve(result);
   transaction.onabort=()=>reject(new OfflineStorageError(transaction.error));
   transaction.onerror=()=>{}; // The transaction abort reports request and quota failures.
   try{work(transaction.objectStore(name),value=>{result=value;});}
   catch(error){transaction.abort();reject(new OfflineStorageError(error));}
  });
 }
 readBoard(){return this.transaction('metadata','readonly',(store,done)=>{store.get('board').onsuccess=e=>done(e.target.result??null);});}
 writeBoard(board){
  if(!Array.isArray(board?.scores)||!Number.isFinite(board.fetchedAt)||!Number.isFinite(board.clockOffset))return Promise.reject(new TypeError('Invalid leaderboard snapshot.'));
  return this.transaction('metadata','readwrite',(store,done)=>{store.get('board').onsuccess=e=>{
   const previous=e.target.result;
   if(previous&&previous.fetchedAt>board.fetchedAt){done(previous);return;}
   const value={scores:board.scores,fetchedAt:board.fetchedAt,clockOffset:board.clockOffset};store.put(value,'board');done(value);
  };});
 }
 get(id){return this.transaction('outbox','readonly',(store,done)=>{store.get(id).onsuccess=e=>done(e.target.result??null);});}
 all(){return this.transaction('outbox','readonly',(store,done)=>{store.getAll().onsuccess=e=>done(e.target.result);});}
 mutate(id,change){
  return this.transaction('outbox','readwrite',(store,done)=>{store.get(id).onsuccess=e=>{
   const value=change(e.target.result??null);
   if(value===undefined){done(null);return;}
   if(value===null)store.delete(id);else store.put(value);
   done(value);
  };});
 }
 prune(now){
  return this.transaction('outbox','readwrite',(store,done)=>{store.getAll().onsuccess=e=>{
   const sent=e.target.result.filter(entry=>entry.status==='sent').sort((a,b)=>b.sentAt-a.sentAt);
   sent.forEach((entry,index)=>{if(index>=100||entry.sentAt<now-RECEIPT_DAYS*86400000)store.delete(entry.id);});done();
  };});
 }
}

export const offlineStore=new OfflineStore();
export const retryDelay=attempts=>Math.min(300000,5000*2**Math.min(6,Math.max(0,attempts-1)));

export class ScoreOutbox{
 constructor({send,onChange=()=>{},onError=()=>{},now=Date.now,isOnline=()=>globalThis.navigator?.onLine!==false,store=offlineStore}={}){
  if(typeof send!=='function')throw new TypeError('ScoreOutbox requires a send function.');
  Object.assign(this,{send,onChange,onError,now,isOnline,store});this.active=null;this.timer=null;this.disposed=false;this.again=false;this.forceAgain=false;
 }
 notify(type,entry){try{this.onChange({type,entry});}catch(error){this.report(error);}}
 report(error){try{this.onError(error);}catch{/* A display callback cannot change the saved queue. */}}
 async enqueue(run,player){
  const input=scoreRecord(run,player),time=this.now();
  try{
   const entry=await this.store.mutate(input.id,previous=>previous??{...input,status:'queued',createdAt:time,attempts:0,nextAttemptAt:time,lastError:'',leaseId:null,leaseUntil:0});
   this.notify(entry.status,entry);return entry;
  }catch(error){this.report(error);throw error;}
 }
 get(id){return this.store.get(id);}
 async list({includeSent=false}={}){return (await this.store.all()).filter(entry=>includeSent||entry.status!=='sent').sort((a,b)=>a.createdAt-b.createdAt);}
 async remove(id){
  let busy=false;
  const removed=await this.store.mutate(id,entry=>{if(entry?.status==='sending'&&entry.leaseUntil>this.now()){busy=true;return undefined;}return null;});
  if(busy){const error=new Error('This score is being sent. Wait for it to finish before removing it.');error.code='score-busy';throw error;}
  this.notify('removed',{id});return removed;
 }
 async retry(id){
  const entry=await this.store.mutate(id,previous=>{
   if(!previous||previous.status==='sent'||(previous.status==='sending'&&previous.leaseUntil>this.now()))return undefined;
   return {...previous,status:'queued',nextAttemptAt:this.now(),lastError:'',leaseId:null,leaseUntil:0};
  });
  if(entry)this.notify('queued',entry);
  await this.sync({force:true});return this.get(id);
 }
 sync({force=false}={}){
  if(this.disposed)return Promise.resolve();
  clearTimeout(this.timer);this.timer=null;
  if(this.active){this.again=true;this.forceAgain||=force;return this.active;}
  this.active=this.flush(force).catch(error=>{this.report(error);throw error;}).finally(async()=>{
   this.active=null;
   if(this.disposed)return;
   if(this.again){const forceNext=this.forceAgain;this.again=false;this.forceAgain=false;this.timer=setTimeout(()=>this.sync({force:forceNext}).catch(()=>{}),0);return;}
   try{await this.schedule();}catch(error){this.report(error);}
  });
  return this.active;
 }
 async flush(force){
  // onLine is a scheduling hint, not proof that the server is unreachable.
  if(!force&&!this.isOnline())return;
  const entries=await this.list();
  for(const candidate of entries){
   if(this.disposed||(!force&&!this.isOnline()))break;
   const time=this.now(),leaseId=globalThis.crypto?.randomUUID?.()??time+'-'+Math.random();
   const claimed=await this.store.mutate(candidate.id,entry=>{
    if(!entry||entry.status==='sent'||entry.status==='failed'||(entry.status==='sending'&&entry.leaseUntil>time)||(!force&&entry.status==='queued'&&entry.nextAttemptAt>time))return undefined;
    return {...entry,status:'sending',attempts:entry.attempts+1,leaseId,leaseUntil:time+LEASE_MS};
   });
   if(!claimed)continue;
   this.notify('sending',claimed);
   const run={...claimed.run,submittedAt:new Date(this.now()).toISOString()};
   let response,failure;
   try{response=await this.send(run,claimed.player);}catch(error){failure=error&&typeof error==='object'?error:new Error(String(error||'Could not reach the leaderboard.'));}
   // A tab that lost its lease cannot overwrite a later tab's result.
   const finished=await this.store.mutate(claimed.id,entry=>{
    if(!entry||entry.leaseId!==leaseId)return undefined;
    const common={...entry,leaseId:null,leaseUntil:0};
    if(!failure)return {...common,run:{...run,submittedAt:response?.submittedAt??run.submittedAt},status:'sent',sentAt:this.now(),nextAttemptAt:0,lastError:''};
    const permanent=failure.permanent===true;
    return {...common,status:permanent?'failed':'queued',lastError:String(failure.message||'Could not reach the leaderboard.').slice(0,240),nextAttemptAt:permanent?0:this.now()+retryDelay(entry.attempts)};
   });
   if(finished)this.notify(finished.status==='sent'?'sent':finished.status==='failed'?'failed':'retrying',finished);
  }
  await this.store.prune(this.now());
 }
 async schedule(){
  if(this.disposed||this.active||!this.isOnline())return;
  const entries=await this.list(),now=this.now();
  if(this.disposed||this.active||!this.isOnline())return;
  const times=entries.filter(entry=>entry.status==='queued'||entry.status==='sending').map(entry=>entry.status==='sending'?entry.leaseUntil:entry.nextAttemptAt);
  if(!times.length)return;
  const delay=Math.max(1000,Math.min(...times)-now);
  this.timer=setTimeout(()=>this.sync().catch(()=>{}),Math.min(delay,300000));
 }
 dispose(){this.disposed=true;clearTimeout(this.timer);this.timer=null;}
}
