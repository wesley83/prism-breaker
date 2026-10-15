import test from 'node:test';
import assert from 'node:assert/strict';
import {setupGameDisplay} from '../public/display.js';

function fixture({phone=true,allowed=true,reject=false,installed=false}={}){
 const listeners={},classes=new Set(),button={setAttribute(){},innerHTML:''},pauseButton={},layoutButton={},root={classList:{toggle(name,on){if(on)classes.add(name);else classes.delete(name);}}};
 let requests=0,exits=0,paused=0,errors=0,playing=true;
 const doc={documentElement:root,fullscreenElement:null,fullscreenEnabled:allowed,querySelector:s=>s==='#fullscreen'?button:s==='#pause-layout'?layoutButton:pauseButton,addEventListener:(name,fn)=>listeners[name]=fn,exitFullscreen:async()=>{doc.fullscreenElement=null;exits++;listeners.fullscreenchange();}};
 root.requestFullscreen=()=>{requests++;if(reject)return Promise.reject(Error('Denied'));doc.fullscreenElement=root;listeners.fullscreenchange();return Promise.resolve();};
 const win={matchMedia:query=>({matches:query==='(display-mode: fullscreen)'?installed:query==='(max-width: 650px)'?phone:false}),addEventListener(){}};
 const display=setupGameDisplay({document:doc,window:win,isPlaying:()=>playing,onExit:()=>paused++,onError:()=>errors++});
 return {display,doc,root,button,pauseButton,layoutButton,classes,listeners,get requests(){return requests;},get exits(){return exits;},get paused(){return paused;},get errors(){return errors;},home(){playing=false;display.leave();}};
}
test('phone start requests fullscreen synchronously on the document root, including dialogs',()=>{
 const f=fixture();f.display.enterForPlay();assert.equal(f.requests,1);assert.equal(f.doc.fullscreenElement,f.root);assert.equal(f.classes.has('game-focus'),true);
});
test('denied phone fullscreen retains the viewport layout with a separate layout exit',async()=>{
 const f=fixture({reject:true});f.display.enterForPlay();await new Promise(resolve=>setImmediate(resolve));assert.equal(f.classes.has('game-focus'),true);assert.equal(f.errors,0);f.layoutButton.onclick();assert.equal(f.classes.has('game-focus'),false);assert.equal(f.paused,1);
});
test('ordinary desktop starts never request fullscreen automatically',()=>{
 const f=fixture({phone:false});f.display.enterForPlay();assert.equal(f.requests,0);assert.equal(f.classes.has('game-focus'),false);f.button.onclick();assert.equal(f.doc.fullscreenElement,f.root);
});
test('an installed fullscreen app uses the screen layout without an unnecessary API request',()=>{
 const f=fixture({installed:true});f.display.enterForPlay();assert.equal(f.requests,0);assert.equal(f.classes.has('game-focus'),true);
});
test('system exit pauses active play and does not automatically request fullscreen again',()=>{
 const f=fixture();f.display.enterForPlay();f.doc.fullscreenElement=null;f.listeners.fullscreenchange();f.display.refresh();assert.equal(f.classes.has('game-focus'),false);assert.equal(f.paused,1);assert.equal(f.requests,1);
});
test('returning home exits owned browser fullscreen without a pause callback',()=>{
 const f=fixture();f.display.enterForPlay();f.home();assert.equal(f.exits,1);assert.equal(f.paused,0);assert.equal(f.classes.has('game-focus'),false);
});
