import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const source=(await fs.readFile(new URL('../public/pwa.js',import.meta.url),'utf8')).replace(/import .*?;\s*/,"const PWA_RELEASE='aaaaaaaaaaaaaaaaaaaa';\n").replace('export function','function');
const flush=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
function emitter(obj={}){const handlers=new Map();return Object.assign(obj,{addEventListener(type,fn){if(!handlers.has(type))handlers.set(type,[]);handlers.get(type).push(fn);},emit(type){for(const fn of handlers.get(type)||[])fn();}});}
function fixture({waiting=true,online=true,safe=true,version='aaaaaaaaaaaaaaaaaaaa',ready=true,throwSkip=false,failRegister=false,unsupported=false,beforeUpdate=()=>{}}={}){
 const elements=new Map(['offline-status','offline-detail','install-game','update-game','retry-download'].map(id=>['#'+id,{hidden:false,disabled:false,textContent:''}]));
 const timers=new Map();let tid=0,now=100000,reloads=0,skips=0,checks=0;
 const active=emitter({state:'activated',postMessage(message,ports){ports?.[0].postMessage({version,ready});}});
 const next=emitter({state:'installed',postMessage(message){if(throwSkip)throw Error('worker disappeared');if(message.type==='SKIP_WAITING')skips++;}});
 const registration=emitter({active,waiting:waiting?next:null,installing:null,update:async()=>{checks++;}});
 const sw=emitter({controller:active,register:async()=>{if(failRegister)throw Error('offline');return registration;}});
 const navigator={onLine:online,...(unsupported?{}:{serviceWorker:sw})};
 const document=emitter({hidden:false,querySelector:s=>elements.get(s)}),window=emitter();
 const location={pathname:'/',reload(){reloads++;}};
 class Channel{constructor(){this.port1={close(){},onmessage:null};this.port2={postMessage:data=>this.port1.onmessage?.({data})};}}
 const context=vm.createContext({navigator,document,window,location,isSecureContext:true,matchMedia:()=>({matches:false}),MessageChannel:Channel,Date:{now:()=>now},setTimeout:(fn,ms)=>{const id=++tid;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id)});
 vm.runInContext(source+'\nglobalThis.setup=setupOfflinePlay;',context);
 const api=context.setup({isSafeToUpdate:()=>safe,openHelp(){},beforeUpdate});
 return {api,sw,registration,next,navigator,document,window,elements,button:elements.get('#update-game'),detail:elements.get('#offline-detail'),retry:elements.get('#retry-download'),status:elements.get('#offline-status'),
  get reloads(){return reloads;},get skips(){return skips;},get checks(){return checks;},safe(value){safe=value;api.refresh();},advance(ms){now+=ms;},timeout(ms){for(const [id,timer]of [...timers])if(timer.ms===ms){timers.delete(id);timer.fn();}},activate(){version='bbbbbbbbbbbbbbbbbbbb';registration.waiting=null;sw.controller=next;next.postMessage=(message,ports)=>ports?.[0].postMessage({version,ready});sw.emit('controllerchange');}};
}
test('a waiting complete release is offered; one click activates then reloads once',async()=>{
 const f=fixture();await flush();assert.equal(f.button.hidden,false);assert.equal(f.button.disabled,false);
 await f.button.onclick();await f.button.onclick();assert.equal(f.skips,1);assert.equal(f.reloads,0);assert.equal(f.button.disabled,true);
 f.activate();await flush();assert.equal(f.reloads,1);
});
test('active runs block both the button and direct invocation',async()=>{
 const f=fixture({safe:false});await flush();assert.equal(f.button.disabled,true);assert.equal(f.button.textContent,'Update after this run');await f.button.onclick();assert.equal(f.skips,0);assert.equal(f.reloads,0);
 f.safe(true);await f.button.onclick();assert.equal(f.skips,1);
});
test('another tab activating the update never reloads this tab without a click',async()=>{
 const f=fixture({waiting:false});await flush();f.safe(false);f.activate();await flush();assert.equal(f.reloads,0);assert.equal(f.button.hidden,false);
 f.safe(true);await f.button.onclick();assert.equal(f.reloads,1);assert.equal(f.skips,0);
});
test('a downloaded update activates while offline',async()=>{
 const f=fixture({online:false});await flush();assert.match(f.status.textContent,/Offline · ready/);await f.button.onclick();f.activate();assert.equal(f.reloads,1);
});
test('failed worker activation shows an actionable retry instead of a stuck Applying label',async()=>{
 const f=fixture({throwSkip:true});await flush();await f.button.onclick();assert.equal(f.button.disabled,false);assert.match(f.detail.textContent,/update.*try.*again/i);assert.equal(f.reloads,0);
});
test('activation timeout preserves readiness and permits another Update game click',async()=>{
 const f=fixture();await flush();await f.button.onclick();f.timeout(12000);assert.equal(f.button.disabled,false);assert.match(f.detail.textContent,/update.*try.*again/i);assert.match(f.status.textContent,/Ready to play offline/);await f.button.onclick();assert.equal(f.skips,2);
});
test('starting a run during activation defers the requested reload until returning home',async()=>{
 const f=fixture();await flush();await f.button.onclick();f.safe(false);f.activate();await flush();assert.equal(f.reloads,0);f.safe(true);assert.equal(f.reloads,1);
});
test('no update or unsupported browser cannot trigger an accidental reload',async()=>{
 for(const options of [{waiting:false},{unsupported:true}]){const f=fixture(options);await flush();assert.equal(f.button.hidden,true);await f.button.onclick();assert.equal(f.reloads,0);}
});
test('foreground and reconnect checks are throttled; offline and hidden tabs do not check',async()=>{
 const f=fixture({waiting:false});await flush();f.window.emit('online');assert.equal(f.checks,0);f.advance(60001);f.document.hidden=true;f.document.emit('visibilitychange');assert.equal(f.checks,0);
 f.document.hidden=false;f.document.emit('visibilitychange');assert.equal(f.checks,1);f.window.emit('online');assert.equal(f.checks,1);f.advance(60001);f.navigator.onLine=false;f.document.emit('visibilitychange');assert.equal(f.checks,1);f.navigator.onLine=true;f.window.emit('online');assert.equal(f.checks,2);
});
test('a failed install is retryable while the current release stays ready',async()=>{
 const f=fixture({waiting:false});await flush();f.registration.installing=f.next;f.registration.emit('updatefound');f.next.state='redundant';f.next.emit('statechange');assert.equal(f.retry.hidden,false);assert.match(f.status.textContent,/Ready to play offline/);await f.retry.onclick();assert.equal(f.checks,1);
});
test('registration failure offers Retry download',async()=>{
 const f=fixture({failRegister:true,waiting:false});await flush();assert.equal(f.retry.hidden,false);assert.match(f.status.textContent,/unavailable/);
});
test('a failing preparation callback is caught and remains retryable',async()=>{
 const f=fixture({beforeUpdate:()=>{throw Error('Save failed');}});await flush();await f.button.onclick();assert.equal(f.skips,0);assert.equal(f.button.disabled,false);assert.match(f.detail.textContent,/update.*try.*again/i);
});
test('a run starting during asynchronous preparation cancels activation',async()=>{
 let finish;const f=fixture({beforeUpdate:()=>new Promise(resolve=>finish=resolve)});await flush();const click=f.button.onclick();f.safe(false);finish();await click;assert.equal(f.skips,0);assert.equal(f.reloads,0);f.safe(true);assert.equal(f.button.disabled,false);
});
test('late activation after timeout needs a new click and does not interrupt a run',async()=>{
 const f=fixture();await flush();await f.button.onclick();f.timeout(12000);f.safe(false);f.activate();await flush();assert.equal(f.reloads,0);f.safe(true);assert.equal(f.reloads,0);await f.button.onclick();assert.equal(f.reloads,1);
});
test('repeated controller and refresh events cannot issue duplicate reloads',async()=>{
 const f=fixture();await flush();await f.button.onclick();f.activate();f.activate();f.api.refresh();f.timeout(12000);assert.equal(f.reloads,1);
});
