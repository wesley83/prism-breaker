import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../public/vendor/three.module.min.js';
import {Champion} from '../public/champion.js';
import {WORLD_COUNT} from '../public/levels.js';
import {advanceScene} from '../public/scene-playback.js';
import {CINEMATICS,CHAMPION_DURATION,cameraFrame} from '../public/cinematic-score.js';
import {DAILY_DURATION,DAILY_RECORD_DURATION,dailyFrame} from '../public/daily-score.js';
import {BRICK_GUIDE} from '../public/brick-labels.js';

test('all world and ending timelines hold before fade until explicit navigation',()=>{
 for(const duration of [...CINEMATICS.map(c=>c.duration),CHAMPION_DURATION,DAILY_DURATION,DAILY_RECORD_DURATION,9]){
  let time=0;for(let i=0;i<2000;i++)time=advanceScene(time,.05,duration);
  assert.equal(time,duration*.94);assert.equal(advanceScene(time,3600,duration),time);
  assert.equal(advanceScene(2,.5,duration,true),2);assert.equal(advanceScene(2,.5,duration,false),2.5);
  assert.equal(advanceScene(duration,0,9,true),9*.94);
 }
 for(let i=0;i<WORLD_COUNT;i++){const frame=cameraFrame(i,CINEMATICS[i].duration*.94);assert.equal(frame.fade,0);assert.equal(frame.titleAlpha,1);}
 for(const record of [false,true]){const frame=dailyFrame((record?DAILY_RECORD_DURATION:DAILY_DURATION)*.94,1,false,record);assert.equal(frame.fade,0);assert.equal(frame.titleAlpha,1);}
});
test('all sixteen victory gems occupy the full ring and move; reduced motion remains static',()=>{
 for(const lowEffects of [false,true]){
  const scene=new T.Scene(),champion=new Champion(scene,new T.Texture(),null),settings={lowEffects,reducedMotion:false};
  champion.render(3,1,settings);assert.equal(champion.gems.length,WORLD_COUNT);
  const initial=champion.gems.map(g=>g.position.toArray());
  assert.equal(new Set(initial.map(p=>JSON.stringify(p))).size,WORLD_COUNT);
  assert.ok(Math.abs(initial.reduce((sum,p)=>sum+p[0],0))<1e-9);
  assert.ok(Math.abs(initial.reduce((sum,p)=>sum+p[2],0))<1e-9);
  for(const p of initial)assert.ok(Math.hypot(p[0],p[2])>=5);
  champion.render(4,1,settings);for(let i=0;i<WORLD_COUNT;i++)assert.notDeepEqual(champion.gems[i].position.toArray(),initial[i]);
  settings.reducedMotion=true;champion.render(1,.4,settings);const frozen=champion.gems.map(g=>[g.position.toArray(),g.rotation.toArray()]);
  champion.render(15,.4,settings);assert.deepEqual(champion.gems.map(g=>[g.position.toArray(),g.rotation.toArray()]),frozen);
 }
});
test('brick guide describes armor and switches without limiting them to an original world',()=>{
 assert.match(BRICK_GUIDE.find(b=>b.kind==='armor').description,/two or three/);
 assert.match(BRICK_GUIDE.find(b=>b.kind==='switch').description,/formation/);
 assert.doesNotMatch(BRICK_GUIDE.map(b=>b.description).join(' '),/Citadel|Electric City/);
});
