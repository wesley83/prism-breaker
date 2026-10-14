import test from 'node:test';import assert from 'node:assert/strict';import {DOMParser} from 'linkedom';
import {Game} from '../public/engine.js';import {attachBrickDOM} from '../public/brick-events.js';
import {originalWorld,worldHTML,formationCatalog} from '../public/world-format.js';

test('every surviving hit and destruction emits strike and damage with the correct remaining HP',()=>{
 const g=new Game();g.start('practice',1);const b=g.bricks.find(b=>b.kind==='armor'),seen=[];g.events.addEventListener('strike',e=>seen.push(['strike',e.detail.brick.hp]));g.events.addEventListener('brickdamage',e=>seen.push(['damage',e.detail.brick.hp]));g.damage(b);g.damage(b);assert.deepEqual(seen,[['strike',2],['damage',1],['strike',1],['damage',0]]);
});
test('trusted custom strike handlers can cancel damage and are detachable',()=>{
 const g=new Game(),b=g.bricks[0],handler=e=>e.preventDefault();g.events.addEventListener('strike',handler);g.damage(b);assert.equal(b.hp,1);assert.equal(g.hits,0);g.events.removeEventListener('strike',handler);g.damage(b);assert.equal(b.hp,0);
});
test('bounded custom break recipes run in Practice and cannot replace Adventure layouts',()=>{
 const w=originalWorld(0),type='urn:Brick:Custom:bonus';w.types=[{type,name:'Bonus',base:'normal',effect:'bonus',points:250}];w.formations[0].bricks[0].customType=type;
 const g=new Game();g.catalog=formationCatalog(w);g.start('practice',0);const b=g.bricks[0];g.damage(b);assert.equal(g.score,350);g.start('campaign',0);assert.equal(g.bricks[0].customType,undefined);g.damage(g.bricks[0]);assert.equal(g.score,100);
});
test('DOM specializations receive strike and damage events and cleanup detaches the bridge',()=>{
 const g=new Game();g.start('practice',0);const root=new DOMParser().parseFromString(worldHTML(originalWorld(0)),'text/html').querySelector('#world'),node=root.querySelector('#f0-brick-'+g.bricks[0].id);let calls=0;node.addEventListener('strike',()=>calls++);const detach=attachBrickDOM(g,root);g.damage(g.bricks[0]);assert.equal(calls,1);assert.equal(node.dataset.remainingHitpoints,'0');assert.ok(node.classList.contains('destroyed'));detach();g.damage(g.bricks[1]);assert.equal(calls,1);
});
