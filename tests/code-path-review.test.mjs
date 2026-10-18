import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {DOMParser} from 'linkedom';
import * as T from '../public/vendor/three.module.min.js';
import {normalizeSettings,storedProgress} from '../public/preferences.js';
import {ownsKeyboard} from '../public/keyboard-input.js';
import {startFrameLoop} from '../public/frame-loop.js';
import {boardSnapshot,OfflineStore} from '../public/offline.js';
import {Sound} from '../public/audio.js';
import {publishWorld} from '../public/publish-world.js';
import {originalWorld,worldHTML,worldDocument} from '../public/world-format.js';
import {Cinematic} from '../public/cinematics.js';
import {Champion} from '../public/champion.js';
import {DailyEnding} from '../public/daily-ending.js';
import {settleWithin} from '../public/sharing.js';

test('malformed preferences fall back per field and cannot supply nonfinite gains',()=>{
 const defaults=normalizeSettings(null,{lowEffects:true,reducedMotion:true});
 for(const value of [null,[],true,'bad'])assert.deepEqual(normalizeSettings(value,{lowEffects:true,reducedMotion:true}),defaults);
 const settings=normalizeSettings({music:'oops',effects:NaN,muted:'false',classicMode:true,lowEffects:false,reducedMotion:null,interfaceTheme:'unknown',extra:true},{reducedMotion:true});
 assert.deepEqual(settings,{music:.35,effects:.7,muted:false,classicMode:true,lowEffects:false,reducedMotion:true,interfaceTheme:'system'});
 assert.equal(normalizeSettings({music:2,effects:-1}).music,1);assert.equal(normalizeSettings({music:2,effects:-1}).effects,0);
 assert.equal(normalizeSettings({interfaceTheme:'light',muted:true}).interfaceTheme,'light');
 for(const value of [null,{},NaN,Infinity,-1,17,'12',1.5])assert.equal(storedProgress(value,16),0);
 assert.equal(storedProgress(16,16),16);
});
test('cached leaderboard is validated before it can replace application state',async()=>{
 for(const value of [null,{}, {scores:{},fetchedAt:1,clockOffset:0},{scores:[],fetchedAt:Infinity,clockOffset:0},{scores:[],fetchedAt:1,clockOffset:Infinity},{scores:[],fetchedAt:1e20,clockOffset:0}])assert.equal(boardSnapshot(value),null);
 const valid={scores:[null,3,{}, {player:'QA',score:42},{player:'HTML row',score:'1200'},{player:'bad',score:null},{player:'empty',score:''}],fetchedAt:Date.now(),clockOffset:60000};
 assert.deepEqual(boardSnapshot(valid),{...valid,scores:[{player:'QA',score:42},{player:'HTML row',score:'1200'}]});
 const store=new OfflineStore();let value={scores:{},fetchedAt:Infinity,clockOffset:0},written;
 store.transaction=async(name,mode,work)=>{let done;const request={};work({get(){queueMicrotask(()=>request.onsuccess({target:{result:value}}));return request;},put(v){written=v;}},v=>{done=v;});await new Promise(r=>queueMicrotask(r));return done;};
 assert.equal(await store.readBoard(),null);await store.writeBoard(valid);assert.deepEqual(written,boardSnapshot(valid));
 await assert.rejects(store.writeBoard({scores:[],clockOffset:NaN,fetchedAt:0}),TypeError);
});
test('focused controls keep native activation while steering remains available',()=>{
 const doc=new DOMParser().parseFromString('<button><span id="child">Launch</span></button><a href="/">Home</a><input><div contenteditable><span id="edit">Text</span></div><canvas></canvas>','text/html');
 for(const target of [doc.querySelector('button'),doc.querySelector('#child'),doc.querySelector('a')]){
  assert.equal(ownsKeyboard(target,'Space'),true);assert.equal(ownsKeyboard(target,'Enter'),true);assert.equal(ownsKeyboard(target,'ArrowLeft'),false);assert.equal(ownsKeyboard(target,'KeyD'),false);
 }
 for(const target of [doc.querySelector('input'),doc.querySelector('#edit')])assert.equal(ownsKeyboard(target,'ArrowLeft'),true);
 assert.equal(ownsKeyboard(doc.querySelector('canvas'),'Space'),false);
});
test('a failed animation frame reports once, stays paused and can explicitly recover',()=>{
 let queued,steps=0,reports=0,canceled=false;const loop=startFrameLoop(()=>{if(++steps===1)throw Error('renderer failed');},{request:fn=>{queued=fn;return 9;},cancel:id=>{assert.equal(id,9);canceled=true;},onError:()=>reports++});
 queued(1);assert.equal(loop.failed,true);queued(2);queued(3);assert.equal(steps,1);assert.equal(reports,1);
 loop.resume();queued(4);assert.equal(steps,2);assert.equal(loop.failed,false);loop.dispose();queued(5);assert.equal(steps,2);assert.ok(canceled);
});
test('audio allocation and scheduling failure cannot escape into gameplay',async()=>{
 const previous=globalThis.window;let closes=0,warnings=0;const warn=console.warn;console.warn=()=>warnings++;
 try{
  globalThis.window={AudioContext:class{createGain(){throw Error('allocation refused');}close(){closes++;return Promise.resolve();}}};
  const sound=new Sound({music:.35,effects:.7,muted:false});await sound.unlock();assert.equal(sound.ctx,null);assert.equal(closes,1);
  assert.doesNotThrow(()=>sound.update(true,0));assert.doesNotThrow(()=>sound.event({type:'launch'}));
  sound.ctx={currentTime:1,state:'running',close(){closes++;return Promise.resolve();}};sound.syncGain=()=>{};sound.scheduleStep=()=>{throw Error('scheduling refused');};
  assert.doesNotThrow(()=>sound.update(true,0));assert.equal(sound.ctx,null);assert.equal(closes,2);assert.equal(warnings,1);
  sound.ctx={close(){return Promise.resolve();}};sound.playEvent=()=>{throw Error('effect refused');};assert.doesNotThrow(()=>sound.event({type:'break'}));assert.equal(sound.ctx,null);
 }finally{globalThis.window=previous;console.warn=warn;}
});
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
async function withParser(fn){const previous=globalThis.DOMParser;globalThis.DOMParser=DOMParser;try{await fn();}finally{globalThis.DOMParser=previous;}}
const reply=(world,{status=200,etag='"revision-1"'}={})=>new Response(worldDocument(world),{status,headers:{ETag:etag}});
test('publishing pins its baseline and refuses a stale read before issuing PUT',()=>withParser(async()=>{
 const world=originalWorld(0),baseline=worldHTML(world),gate=deferred();let current=baseline,calls=0;
 const pending=publishWorld({world,baseline,currentBaseline:()=>current,key:'local-fixture',fetch:async()=>{calls++;await gate.promise;return reply(world);}});
 current='newly loaded baseline';gate.resolve();await assert.rejects(pending,/different shared revision/);assert.equal(calls,1);
}));
test('publishing uses the captured snapshot, a strong ETag and a verified readback',()=>withParser(async()=>{
 const original=originalWorld(0),edited={...original,name:'Reviewed draft'},baseline=worldHTML(original),calls=[];
 const html=await publishWorld({world:edited,baseline,currentBaseline:()=>baseline,key:'local-fixture',fetch:async(url,options)=>{calls.push(options);return calls.length===1?reply(original):calls.length===2?new Response(null,{status:204}):reply(edited);}});
 assert.equal(html,worldHTML(edited));assert.equal(calls.length,3);assert.equal(calls[1].headers['If-Match'],'"revision-1"');assert.equal(calls[1].body,worldDocument(edited));assert.ok(calls.every(o=>o.redirect==='error'));
}));
test('publishing rejects changed remote content, weak validators, write conflicts and bad readback',()=>withParser(async()=>{
 const world=originalWorld(0),baseline=worldHTML(world),changed={...world,name:'Other edit'};
 for(const [responses,expected]of [
  [[reply(changed)],/published world changed/],[[reply(world,{etag:'W/"weak"'})],/strong ETag/],
  [[reply(world),new Response('',{status:412})],/Someone changed/],[[reply(world),new Response(null,{status:204}),reply(changed)],/readback/]
 ]){let n=0;await assert.rejects(publishWorld({world,baseline,currentBaseline:()=>baseline,key:'local-fixture',fetch:async()=>responses[n++]}),expected);assert.equal(n,responses.length);}
}));
test('a reload during completed publishing cannot silently replace the newer local baseline',()=>withParser(async()=>{
 const world=originalWorld(0),baseline=worldHTML(world);let current=baseline,n=0;
 await assert.rejects(publishWorld({world,baseline,currentBaseline:()=>current,key:'local-fixture',fetch:async()=>{if(++n===1)return reply(world);if(n===2)return new Response(null,{status:204});current='new baseline';return reply(world);}}),/different shared revision/);assert.equal(current,'new baseline');
}));
test('cinematic rebuild disposes instancing and owned assets without disposing shared sprite geometry',()=>{
 const scene=new T.Scene(),halo=new T.Texture(),environment=new T.CubeTexture(),cinema=new Cinematic(scene,halo,environment);cinema.build(0,true);
 let instancedDisposals=0;cinema.group.traverse(o=>{if(o.isInstancedMesh)o.addEventListener('dispose',()=>instancedDisposals++);});cinema.clear();assert.equal(instancedDisposals,1);
 const champion=new Champion(scene,halo,environment),daily=new DailyEnding(scene,halo,environment);
 for(const owner of [champion,daily]){
  const geometry=new T.BoxGeometry(),material=new T.MeshBasicMaterial(),sprite=new T.Sprite(new T.SpriteMaterial());let geometryDisposals=0,materialDisposals=0,spriteDisposals=0;
  geometry.addEventListener('dispose',()=>geometryDisposals++);material.addEventListener('dispose',()=>materialDisposals++);const observer=()=>spriteDisposals++;sprite.geometry.addEventListener('dispose',observer);
  owner.group.add(new T.Mesh(geometry,material),new T.Mesh(geometry,material),sprite);
  if(owner===champion)owner.build(true);else owner.clear();sprite.geometry.removeEventListener('dispose',observer);
  assert.equal(geometryDisposals,1);assert.equal(materialDisposals,1);assert.equal(spriteDisposals,0);
 }
});
test('share preparation has a bounded fallback for stalled/rejected font and encoding work',async()=>{
 assert.equal(await settleWithin(Promise.resolve('ready'),100), 'ready');assert.equal(await settleWithin(Promise.reject(Error('font unavailable')),100),null);assert.equal(await settleWithin(new Promise(()=>{}),5,'fallback'),'fallback');
});

const editorSource=await fs.readFile(new URL('../public/editor.js',import.meta.url),'utf8');
function handler(start,end,context){return vm.runInNewContext(editorSource.slice(editorSource.indexOf(start),editorSource.indexOf(end,editorSource.indexOf(start))),context);}
test('HTML and publish actions finish dirty details; a second submit cannot race the first',async()=>{
 const nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,{value:'',showModal(){this.open=true;}});return nodes.get(id);};let finished=0,reads=0;
 const world=originalWorld(0),gate=deferred(),context={$:get,world,baseHTML:worldHTML(world),publishing:false,detailsDirty:false,unsaved:false,finishColorEdit(){},cancelDrag(){},finishDetails(){finished++;world.name='Applied detail';return true;},worldDocument,worldHTML,publishWorld:async()=>{reads++;await gate.promise;return worldHTML(world);},saveDraft:async()=>true};
 handler("$('#show-html').onclick=", "$('#copy-html').onclick=",context);get('#show-html').onclick();assert.ok(get('#html-source').value.includes('Applied detail'));
 handler("$('#publish').onclick=",'let previewGeneration=',context);get('#publish').onclick();assert.ok(get('#publish-dialog').open);
 get('#owner-key').value='local-fixture';const first=get('#publish-form').onsubmit({preventDefault(){}});await get('#publish-form').onsubmit({preventDefault(){}});assert.equal(reads,1);assert.equal(get('#owner-key').value,'');gate.resolve();await first;assert.equal(context.publishing,false);assert.equal(finished,3);
});
test('Reload published adopts an identical draft as the new baseline',async()=>{
 const world=originalWorld(0),html=worldHTML(world),button={},context={$:()=>button,preserveDraft:async()=>true,working:{generation:4,serialize:()=>html},published:async()=>world,slugFromPath:world.slug,detailsDirty:false,baseHTML:'older baseline',worldHTML,commit(){throw Error('No command needed for identical data');},populatePhases(){},saveDraft:async()=>true,message:m=>assert.fail(m)};
 handler("$('#reload').onclick=", "$('#publish').onclick=",context);await button.onclick();assert.equal(context.baseHTML,html);
});
test('stale editor loads cannot overwrite a newer baseline or recovery screen',async()=>{
 for(const rejectOld of [false,true]){
  const oldFetch=deferred(),oldDraft=deferred(),fresh={name:'new'},old={name:'old'},nodes=new Map(),get=id=>{if(id==='#routed-world #world')return null;if(!nodes.has(id))nodes.set(id,{hidden:false});return nodes.get(id);};let reads=0,opened=[];
  const context={$:get,loadGeneration:0,index:0,slugFromPath:'prism-garden',world:null,baseHTML:'',setEditing(){},published:()=>++reads===1?oldFetch.promise:Promise.resolve(fresh),worldHTML:w=>w.name,editorDrafts:{read:()=>rejectOld&&reads===1?oldDraft.promise:Promise.resolve(null)},safeStorage:{get:()=>null},draftKey:x=>x,openWorld:w=>opened.push(w.name),message(){},parseWorld(){},normalizeWorld(){}};
  const initialize=handler('async function initialize(){','\ninitialize();',context);
  // A declaration evaluates to undefined; retrieve its actual callback in this VM.
  const run=vm.runInNewContext('initialize',context);const first=run();
  if(rejectOld){oldFetch.resolve(Promise.reject(Error('old network failure')));await new Promise(r=>setTimeout(r,0));}
  await run();assert.equal(context.baseHTML,'new');
  if(rejectOld)oldDraft.resolve(null);else oldFetch.resolve(old);
  await first;assert.equal(context.baseHTML,'new');assert.deepEqual(opened,['new']);assert.equal(get('#world-recovery').hidden,true);
 }
});
test('a stale pending-score read cannot restore a row removed by a newer read',async()=>{
 const source=await fs.readFile(new URL('../public/app.js',import.meta.url),'utf8'),old=deferred(),nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,{hidden:false,replaceChildren(){this.cleared=true;}});return nodes.get(id);};let calls=0;
 const context={$:get,outbox:{list:()=>++calls===1?old.promise:Promise.resolve([])}};
 vm.runInNewContext(source.slice(source.indexOf('let pendingRenderGeneration='),source.indexOf("$('#score-form').addEventListener")),context);
 const run=vm.runInNewContext('renderPendingScores',context),first=run();await run();assert.equal(get('#pending-scores').hidden,true);
 old.resolve([{}]);await first;assert.equal(get('#pending-scores').hidden,true);
});
