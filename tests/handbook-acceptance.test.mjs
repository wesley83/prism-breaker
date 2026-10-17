import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import fs from 'node:fs/promises';import path from 'node:path';
import {validateRequirements,checkRequirements} from '../tools/requirements-check.mjs';
import {RunTrace,replayTrace} from '../tools/run-trace.mjs';import {Game} from '../public/engine.js';
import {ScoreOutbox} from '../public/offline.js';
import {flashDelta,flashSummary} from '../tools/visual-audit.mjs';
const sha=value=>createHash('sha256').update(value).digest('hex');
test('conservative flash screening catches rapid full-frame alternation and ignores static frames',()=>{
 const dark=new Uint8ClampedArray([0,0,0,255]),light=new Uint8ClampedArray([255,255,255,255]);
 assert.equal(flashDelta(dark,light).rise,1);assert.equal(flashDelta(light,dark).fall,1);
 assert.equal(flashSummary(Array.from({length:60},(_,i)=>flashDelta(i%2?light:dark,i%2?dark:light))).flagged,true);
 assert.equal(flashSummary(Array.from({length:60},()=>flashDelta(dark,dark))).flagged,false);
});
test('requirement evidence refuses missing, failed, changed-source and changed-contract receipts',()=>{
 const plan='<main id="requirements" data-version="1"><article id="storage" itemtype="urn:PrismBreaker:Requirement" data-kind="browser"></article></main>',identity={runtimeDigest:'a'},record={schema:1,runtimeDigest:'a',planSha256:sha(plan),environment:'Fixture engine',utc:'2026-10-17T20:00:00Z',cases:{storage:{passed:true}}};
 assert.equal(validateRequirements(plan,record,identity).requirements,1);
 for(const bad of [null,{...record,cases:{}},{...record,runtimeDigest:'b'},{...record,planSha256:'bad'},{...record,failure:'failed'},{...record,cases:{storage:{passed:false}}}])assert.throws(()=>validateRequirements(plan,bad,identity));
 assert.throws(()=>validateRequirements('<main id="requirements" data-version="1"></main>',record,identity),/Empty/);
});
test('a missing required artwork fails independently of an existing-file inventory',async()=>{
 const root=await fs.mkdtemp(path.join('test-results','requirement-refusal-'));await fs.mkdir(path.join(root,'review'));
 await fs.writeFile(path.join(root,'review/requirements.html'),'<main id="requirements" data-version="1"><article itemtype="urn:PrismBreaker:Requirement" data-kind="artifact" id="art"><meta itemprop="artifact" content="public/missing-og.jpg"></article></main>');
 await assert.rejects(checkRequirements({root}),/Missing required artifact/);
});
test('bounded run trace replays, identifies the first divergence and rejects executable/order/overflow input',()=>{
 const game=new Game(),trace=new RunTrace(game);trace.command('move',2);trace.command('launch');trace.command('step',120);trace.command('move',-2);trace.command('step',120);
 assert.equal(replayTrace(trace.export()).matched,true);const bad=JSON.parse(trace.export());bad.events[2].expected.score+=1;const result=replayTrace(JSON.stringify(bad));assert.equal(result.matched,false);assert.equal(result.index,2);assert.equal(result.tick,120);
 bad.events[0].type='eval';assert.throws(()=>replayTrace(JSON.stringify(bad)),/Invalid trace command/);
 const order=JSON.parse(trace.export());order.events[1].tick=99;assert.throws(()=>replayTrace(JSON.stringify(order)),/order/);
 assert.throws(()=>replayTrace(' '.repeat(1000001)),/budget/);assert.throws(()=>trace.command('move',Infinity));
});
test('retry-after delays and expired unclaimed leases cannot acknowledge a receipt',async()=>{
 const rows=new Map(),store={async mutate(id,fn){const v=fn(structuredClone(rows.get(id)));if(v===undefined)return null;rows.set(id,structuredClone(v));return v;},async all(){return [...rows.values()];},async get(id){return rows.get(id);},async prune(){}};
 let now=1000;const queue=new ScoreOutbox({store,now:()=>now,random:()=>0,send:async()=>{throw Object.assign(Error('rate limit'),{retryAfterMS:120000});}}),run={id:'12345678-1234-1234-1234-123456789abc',mode:'campaign',day:'all',score:100,level:1,seconds:5};
 try{await queue.enqueue(run,'QA');await queue.sync();assert.equal((await queue.get(run.id)).nextAttemptAt,121000);
 queue.send=async()=>{now+=61000;};now=121001;await queue.sync();assert.equal((await queue.get(run.id)).status,'sending');
 }finally{queue.dispose();}
});
