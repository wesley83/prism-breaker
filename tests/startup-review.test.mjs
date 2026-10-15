import test from 'node:test';import assert from 'node:assert/strict';import {DOMParser} from 'linkedom';import {startGame} from '../public/bootstrap.js';
test('R13 a rejected application import exposes real recovery and disables inert controls',async()=>{
 const doc=new DOMParser().parseFromString('<html><body><div id="stage" aria-busy="true"><button id="play">Start</button><p id="arena-status">Preparing</p><div id="error" hidden><p id="error-text"></p><button id="reload">Reload game</button></div></div><span id="offline-status"></span><p id="offline-detail"></p></body></html>','text/html');let reloads=0;
 assert.equal(await startGame({document:doc,load:async()=>{throw Error('engine 503');},reload:()=>reloads++}),false);
 assert.equal(doc.querySelector('#error').hidden,false);assert.equal(doc.querySelector('#play').disabled,true);assert.equal(doc.querySelector('#arena-status').hidden,true);assert.equal(doc.querySelector('#stage').getAttribute('aria-busy'),'false');assert.match(doc.querySelector('#error-text').textContent,/Reconnect and reload/);doc.querySelector('#reload').onclick();assert.equal(reloads,1);
});
test('R13 successful application import leaves existing interface state untouched',async()=>{
 let mutations=0;const document={querySelector(){mutations++;},querySelectorAll(){mutations++;}};assert.equal(await startGame({document,load:async()=>{},reload(){}}),true);assert.equal(mutations,0);
});
