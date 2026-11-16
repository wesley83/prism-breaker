import test from 'node:test';
import assert from 'node:assert/strict';
import {setupGameDisplay} from '../public/display.js';

function fixture({phone=true,allowed=true,reject=false,installed=false,standalone=false}={}){
 const listeners={},classes=new Set(),button={setAttribute(){},innerHTML:''},pauseButton={},layoutButton={},root={classList:{toggle(name,on){if(on)classes.add(name);else classes.delete(name);}}};
 for(const control of [button,pauseButton,layoutButton]){control.getAttribute=()=>null;control.closest=()=>null;}
 let requests=0,exits=0,paused=0,errors=0,playing=true;
 const doc={documentElement:root,fullscreenElement:null,fullscreenEnabled:allowed,querySelector:s=>s==='#fullscreen'?button:s==='#pause-layout'?layoutButton:pauseButton,addEventListener:(name,fn)=>listeners[name]=fn,exitFullscreen:async()=>{doc.fullscreenElement=null;exits++;listeners.fullscreenchange();}};
 root.requestFullscreen=()=>{requests++;if(reject)return Promise.reject(Error('Denied'));doc.fullscreenElement=root;listeners.fullscreenchange();return Promise.resolve();};
 const win={matchMedia:query=>({matches:query==='(display-mode: fullscreen)'?installed:query==='(display-mode: standalone)'?standalone:query==='(max-width: 650px)'?phone:false}),addEventListener(){}};
 const display=setupGameDisplay({document:doc,window:win,isPlaying:()=>playing,onExit:()=>paused++,onError:()=>errors++});
 return {display,doc,root,button,pauseButton,layoutButton,classes,listeners,get requests(){return requests;},get exits(){return exits;},get paused(){return paused;},get errors(){return errors;},home(){playing=false;display.leave();},click({control,skip=false,disabled=false,trusted=true,prevented=false}={}){const target=control||{disabled,getAttribute:()=>null,closest:()=>skip?{}:null};listeners.click({isTrusted:trusted,defaultPrevented:prevented,target:{closest:()=>target}});}};
}
test('phone start requests fullscreen synchronously on the document root, including dialogs',()=>{
 const f=fixture();f.display.enterForPlay();assert.equal(f.requests,1);assert.equal(f.doc.fullscreenElement,f.root);assert.equal(f.classes.has('game-focus'),true);
});
test('denied phone fullscreen retains a locked viewport until returning home',async()=>{
 const f=fixture({reject:true});f.display.enterForPlay();await new Promise(resolve=>setImmediate(resolve));assert.equal(f.classes.has('game-focus'),true);assert.equal(f.errors,0);assert.equal(f.classes.has('play-locked'),true);assert.equal(f.layoutButton.hidden,true);f.home();assert.equal(f.classes.has('game-focus'),false);assert.equal(f.classes.has('play-locked'),false);
});
test('ordinary desktop starts never request fullscreen automatically',()=>{
 const f=fixture({phone:false});f.display.enterForPlay();assert.equal(f.requests,0);assert.equal(f.classes.has('game-focus'),false);assert.equal(f.classes.has('play-locked'),false);f.button.onclick();assert.equal(f.doc.fullscreenElement,f.root);
});
test('an installed fullscreen app uses the screen layout without an unnecessary API request',()=>{
 const f=fixture({installed:true});f.display.enterForPlay();assert.equal(f.requests,0);assert.equal(f.classes.has('game-focus'),true);
});
test('system exit pauses active play and does not automatically request fullscreen again',()=>{
 const f=fixture();f.display.enterForPlay();f.doc.fullscreenElement=null;f.listeners.fullscreenchange();f.display.refresh();assert.equal(f.classes.has('game-focus'),true);assert.equal(f.classes.has('play-locked'),true);assert.equal(f.paused,1);assert.equal(f.requests,1);
});
test('returning home exits owned browser fullscreen without a pause callback',()=>{
 const f=fixture();f.display.enterForPlay();f.home();assert.equal(f.exits,1);assert.equal(f.paused,0);assert.equal(f.classes.has('game-focus'),false);
});

test('home navigation and dynamically created buttons enter fullscreen without a separate tap',()=>{
 const f=fixture();f.home();f.click();assert.equal(f.requests,1);assert.equal(f.doc.fullscreenElement,f.root);assert.equal(f.classes.has('game-focus'),false);
 f.home();assert.equal(f.exits,0);assert.equal(f.doc.fullscreenElement,f.root);
});
test('button gestures request API fullscreen even when the installed window reports fullscreen',()=>{
 const f=fixture({installed:true});f.click();assert.equal(f.requests,1);
});
test('installed desktop button gestures qualify but ordinary desktop browser gestures do not',()=>{
 const app=fixture({phone:false,standalone:true});app.click();assert.equal(app.requests,1);
 const tab=fixture({phone:false});tab.click();assert.equal(tab.requests,0);
});
test('synthetic, canceled, disabled and gesture-reserved actions never request fullscreen',()=>{
 const f=fixture();f.click({trusted:false});f.click({prevented:true});f.click({disabled:true});f.click({skip:true});
 f.click({control:f.button});f.click({control:f.pauseButton});f.click({control:f.layoutButton});assert.equal(f.requests,0);
});
test('an explicit exit survives subsequent button gestures until a new run',async()=>{
 const f=fixture();f.click();await new Promise(resolve=>setImmediate(resolve));f.button.onclick();f.click({control:f.button});f.click();assert.equal(f.requests,1);assert.equal(f.doc.fullscreenElement,null);
 f.display.enterForPlay();assert.equal(f.requests,2);
});
test('system exit is respected by subsequent button gestures',async()=>{
 const f=fixture();f.click();await new Promise(resolve=>setImmediate(resolve));f.doc.fullscreenElement=null;f.listeners.fullscreenchange();f.click();assert.equal(f.requests,1);
});
test('denied button requests are silent and may retry on the next gesture',async()=>{
 const f=fixture({reject:true});f.click();f.click();assert.equal(f.requests,1);await new Promise(resolve=>setImmediate(resolve));f.click();await new Promise(resolve=>setImmediate(resolve));assert.equal(f.requests,2);assert.equal(f.errors,0);
});
test('unsupported fullscreen leaves ordinary button actions available',()=>{
 const f=fixture({allowed:false});f.click();assert.equal(f.requests,0);assert.equal(f.errors,0);
});
test('native sharing, clipboard, download and install controls declare their gesture reservation',async()=>{
 const {readFile}=await import('node:fs/promises');const {parseHTML}=await import('linkedom');
 const {document}=parseHTML(await readFile(new URL('../public/index.html',import.meta.url),'utf8'));
 for(const id of ['share-invitation','share-image','copy-invitation','copy-leaderboard-link','save-scorecard','install-game'])assert.ok(document.getElementById(id)?.closest('[data-fullscreen-skip]'),id);
});
