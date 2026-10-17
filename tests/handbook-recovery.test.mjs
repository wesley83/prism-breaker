import test from 'node:test';
import assert from 'node:assert/strict';
import {DOMParser} from 'linkedom';
import {writeJSON} from '../public/save-recovery.js';
import {setupPaddleInput} from '../public/pointer-input.js';
import {sameScorePayload,retryAfterMS} from '../public/score-contract.js';
import {WorldWorkingDocument} from '../public/world-working-document.js';
import {originalWorld,WORLD_SLUGS,worldHTML} from '../public/world-format.js';
import {Game} from '../public/engine.js';

test('failed storage never confirms a write or replaces the accepted value',()=>{
 let accepted='old';const storage={setItem(k,v){if(v.includes('new'))throw Error('quota');accepted=v;}};
 assert.equal(writeJSON(storage,'draft',{value:'new'}).saved,false);assert.equal(accepted,'old');
 assert.equal(writeJSON(storage,'draft',{value:'retry'}).saved,true);assert.equal(JSON.parse(accepted).value,'retry');
});
class Surface extends EventTarget{captured=null;setPointerCapture(id){this.captured=id;}hasPointerCapture(id){return this.captured===id;}releasePointerCapture(){this.captured=null;}}
const pointer=(type,fields={})=>Object.assign(new Event(type),{pointerId:1,pointerType:'touch',button:0,buttons:1,...fields});
test('only the accepted pointer steers/releases; chords, capture loss and context cancellation neutralize input',()=>{
 const surface=new Surface(),win=new EventTarget(),doc=new EventTarget();let enabled=true,moves=0,launches=0,neutral=0;
 const input=setupPaddleInput(surface,{win,doc,enabled:()=>enabled,move:()=>moves++,launch:()=>launches++,neutral:()=>neutral++});
 surface.dispatchEvent(pointer('pointerdown',{button:2}));assert.equal(launches,0);
 surface.dispatchEvent(pointer('pointerdown'));surface.dispatchEvent(pointer('pointerdown',{pointerId:2}));surface.dispatchEvent(pointer('pointermove',{pointerId:2}));surface.dispatchEvent(pointer('pointerup',{pointerId:2}));
 assert.equal(input.owner,1);assert.equal(moves,1);assert.equal(launches,1);
 surface.dispatchEvent(pointer('pointermove'));assert.equal(moves,2);surface.dispatchEvent(pointer('lostpointercapture'));assert.equal(input.owner,null);
 surface.dispatchEvent(pointer('pointerdown',{pointerType:'mouse'}));surface.dispatchEvent(pointer('pointermove',{pointerType:'mouse',buttons:2}));assert.equal(input.owner,null);
 for(const type of ['blur','resize']){surface.dispatchEvent(pointer('pointerdown'));win.dispatchEvent(new Event(type));assert.equal(input.owner,null);}
 surface.dispatchEvent(pointer('pointerdown'));enabled=false;surface.dispatchEvent(pointer('pointermove'));assert.equal(input.owner,null);assert.ok(neutral>=5);input.dispose();
});
test('score reconciliation binds every canonical field and handles bounded retry headers',()=>{
 const run={id:'key',score:123,level:2,seconds:30,mode:'daily',day:'2026-10-17'},row={...run,runKey:run.id,player:'Wes'};
 assert.equal(sameScorePayload(row,run,'Wes'),true);
 for(const [key,value]of Object.entries({score:124,level:3,seconds:31,mode:'campaign',day:'all',ruleset:'a'.repeat(64),runKey:'other',player:'Other'}))assert.equal(sameScorePayload({...row,[key]:value},run,'Wes'),false,key);
 assert.equal(retryAfterMS('120',0),120000);assert.equal(retryAfterMS('bad',0),0);assert.equal(retryAfterMS('9999999',0),86400000);
 assert.equal(retryAfterMS('Sat, 17 Oct 2026 20:00:00 GMT',Date.parse('2026-10-17T19:59:00Z')),60000);
});
test('working HTML is authoritative; commands keep identity and decorations out of export',()=>{
 const doc=new DOMParser().parseFromString('<html><body><div id="board"></div></body></html>','text/html'),working=new WorldWorkingDocument(doc.querySelector('#board'));
 working.replace(originalWorld(0));const first=working.project(),id=first.formations[0].bricks[0].id,node=working.root.querySelector('#f0-brick-'+id);
 assert.throws(()=>first.name='hidden mutable authority');
 node.querySelector('meta[itemprop="hitpoints"]').setAttribute('content','2');assert.equal(working.read().formations[0].bricks[0].maxHp,2);
 node.dataset.selected='true';node.setAttribute('aria-pressed','true');const markup=working.serialize();assert.doesNotMatch(markup,/data-selected|aria-pressed/);
 working.command(draft=>{draft.formations[0].bricks[0].x+=.1;});assert.equal(working.root.querySelector('#f0-brick-'+id),node);
 const before=working.serialize();assert.throws(()=>working.command(draft=>{draft.formations[0].bricks[0].maxHp=9;}));assert.equal(working.serialize(),before);
 working.restore(markup);assert.equal(working.root.querySelector('#f0-brick-'+id),node);assert.equal(working.read().formations[0].bricks[0].x,first.formations[0].bricks[0].x);
});
test('every official world and formation round-trips through its working DOM',()=>{
 WORLD_SLUGS.forEach((slug,index)=>{const doc=new DOMParser().parseFromString('<div id="board"></div>','text/html'),working=new WorldWorkingDocument(doc.querySelector('#board')),world=originalWorld(index);working.replace(world);assert.equal(working.serialize(),worldHTML(world),slug);working.command(w=>{w.name+=' revised';});assert.equal(working.read().name,world.name+' revised');});
});
test('late restore failure leaves active state, callbacks and random sequence intact',()=>{
 const active=new Game(),source=new Game();active.launch();active.award(900);source.award(1200);const before=active.snapshot(),events=active.events,emit=active.emit;
 assert.equal(active.restore(source.snapshot(),{prepare(){throw Error('final preparation failed');}}),false);assert.deepEqual(active.snapshot(),before);assert.equal(active.events,events);assert.equal(active.emit,emit);
 let prepared=false;assert.equal(active.restore(source.snapshot(),{prepare(candidate){prepared=true;assert.equal(candidate.score,1200);assert.equal(active.score,900);}}),true);assert.ok(prepared);
 const draws=active.randomDraws;assert.equal(active.random(),source.random());assert.equal(active.randomDraws,draws+1);assert.equal(active.events,events);
 active.launch();active.tick(1/120);assert.equal(active.state,'playing');
});
