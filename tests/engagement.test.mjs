import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,LIMIT} from '../public/engine.js';
import {WORLDS,RULESET_REVISION} from '../public/levels.js';
import {LEGACY_RULESET_REVISION} from '../public/world-identity.js';
import {ENGAGEMENT,ENGAGEMENT_REVISION} from '../public/engagement-data.js';
import {readEngagement} from '../tools/read-engagement.mjs';
import {readMastery,awardMastery,counts,unlockedCosmetics,observeRun} from '../public/mastery.js';
import {readChallenge} from '../public/engagement-ui.js';
const start=(index=0)=>{const g=new Game();g.start('practice',index,8399,{official:true});return g;};
const destroy=(g,b)=>{for(let i=0;i<4&&b.hp>0;i++)g.damage(b);};

test('engagement projection is derived entirely from the authored document',async()=>{
 const {model,revision}=await readEngagement();assert.deepEqual(model,ENGAGEMENT);assert.equal(revision,ENGAGEMENT_REVISION);assert.equal(Object.keys(model.profiles).length,16);
 for(const w of WORLDS){const p=model.profiles[w.id];assert.ok(p.swift>0);assert.ok(p.skillTarget>0);for(const e of p.encounters){assert.ok(e.opening<e.period);assert.equal(new Set([...e.cores,...e.generators]).size,e.cores.length+e.generators.length);}}
});
test('every official world and encounter has a bounded legal path to clearing all formations',()=>{
 for(let index=0;index<WORLDS.length;index++){
  const g=start(index);g.launch();
  for(let phase=0;phase<g.world.formations.length;phase++){
   assert.equal(g.phase,phase);const e=g.engagement.encounter;g.engagement.stats.seconds+=30;
   if(e){g.engagement.phasePortals=e.portalUses;g.boardElapsed=e.period-e.opening+.1;for(const id of e.generators)destroy(g,g.bricks.find(b=>b.id===id));}
   for(const b of g.bricks)destroy(g,b);assert.ok(g.bricks.every(b=>b.hp===0),g.world.id+' formation '+phase);g.tick(1/120);if(g.state==='ready')g.launch();
  }
  assert.equal(g.state,'cleared',g.world.id);assert.ok(g.engagement.report.seconds>0);
 }
});
test('Citadel protection requires both generators, including against piercing and chains',()=>{
 const g=start(7);g.phase=2;g.loadLevel();const e=g.engagement.encounter,core=g.bricks.find(b=>e.cores.includes(b.id)),hp=core.hp;
 g.effects.pierce=10;g.damage(core,true);assert.equal(core.hp,hp);
 destroy(g,g.bricks.find(b=>b.id===e.generators[0]));g.damage(core);assert.equal(core.hp,hp);
 destroy(g,g.bricks.find(b=>b.id===e.generators[1]));g.damage(core);assert.equal(core.hp,hp-1);
});
test('storm warnings, exposure and shielding follow the same active-time cycle',()=>{
 const g=start(12),e=g.engagement.encounter,core=g.bricks.find(b=>e.cores.includes(b.id));for(const id of e.generators)destroy(g,g.bricks.find(b=>b.id===id));
 g.boardElapsed=2;assert.equal(g.engagement.locked(core),true);g.boardElapsed=4;g.engagement.updateEncounter();assert.match(g.engagement.encounterState,/warning/);
 g.boardElapsed=5;assert.equal(g.engagement.locked(core),false);g.boardElapsed=9;assert.equal(g.engagement.locked(core),true);
});
test('Nexus needs its authored switches and portal journeys before core damage',()=>{
 const g=start(15);g.phase=1;g.loadLevel();const e=g.engagement.encounter,core=g.bricks.find(b=>e.cores.includes(b.id));for(const id of e.generators)destroy(g,g.bricks.find(b=>b.id===id));
 assert.equal(g.engagement.locked(core),true);g.engagement.portal();assert.equal(g.engagement.locked(core),true);g.engagement.portal();assert.equal(g.engagement.locked(core),false);
});
test('last-brick precision is earned once, catches at contact and permits bounded aiming',()=>{
 const g=start();g.launch();for(const b of g.bricks.slice(3))b.hp=0;g.boardElapsed=13;g.engagement.tick(0);assert.equal(g.engagement.finisher,'ready');assert.equal(g.engagement.arm(),true);
 const ball=g.balls[0];Object.assign(ball,{x:-1,y:-10.05,vx:0,vy:-20});g.tick(1/60);assert.ok(ball.held);assert.equal(g.engagement.finisher,'used');assert.equal(ball.holdOffset,-1);
 g.engagement.aim(90);assert.ok(Math.abs(Math.atan2(ball.holdVX,ball.holdVY)*180/Math.PI-60)<.001);const offset=ball.holdOffset;g.launch();assert.ok(!ball.held);assert.equal(ball.holdOffset,offset);assert.equal(g.engagement.arm(),false);
});
test('collecting a paired drop accepts exactly one strategy and one pickup award',()=>{
 const g=start();g.launch();g.drops=[{id:100,x:0,y:LIMIT.paddleY+.02,kind:'wide',choice:99},{id:101,x:0,y:LIMIT.paddleY+.02,kind:'laser',choice:99}];g.tick(1/120);
 assert.ok(g.effects.wide>0);assert.ok(!g.effects.laser);assert.equal(g.bonusTotals.pickups,150);assert.equal(g.engagement.stats.pickups,1);
});
test('Sticky catches cannot select a launch angle and preserve their automatic bounce',()=>{
 for(const wide of [false,true]){
  const g=start();g.launch();g.power('sticky');if(wide)g.power('wide');const b=g.balls[0];Object.assign(b,{x:wide?2.3:.8,y:LIMIT.paddleY+.45,vx:0,vy:-18});g.tick(1/60);
  assert.equal(b.held,true);assert.equal(b.aimable,false);const velocity=[b.holdVX,b.holdVY],offset=b.holdOffset;g.engagement.aim(-60);assert.deepEqual([b.holdVX,b.holdVY],velocity);
  g.move(-3);g.tick(1/120);assert.equal(b.holdOffset,offset);
  if(wide){g.effects.wide=.001;g.tick(1/120);}else g.launch();assert.equal(b.held,false);assert.ok(b.vy>0);assert.ok(Math.abs(b.vx/b.vy-velocity[0]/velocity[1])<1e-8);
 }
});
test('official seeds reproduce launch/drop decisions independently of run IDs',()=>{
 const a=start(),b=start();a.runId='first';b.runId='second';assert.deepEqual(Array.from({length:8},()=>a.freshLaunchAngle()),Array.from({length:8},()=>b.freshLaunchAngle()));
 for(let i=0;i<12;i++){a.damage(a.bricks[i]);b.damage(b.bricks[i]);}assert.deepEqual(a.drops.map(({x,y,kind,choice})=>({x,y,kind,paired:!!choice})),b.drops.map(({x,y,kind,choice})=>({x,y,kind,paired:!!choice})));
});
test('old checkpoints keep old rules and counter behavior across later worlds',()=>{
 const old=new Game();old.start('campaign',0,8399,{legacy:true});old.launchCount=7;const restored=new Game();assert.equal(restored.restore(old.snapshot()),true);assert.equal(restored.ruleset,LEGACY_RULESET_REVISION);assert.equal(restored.engagement.enabled,false);restored.next();assert.equal(restored.launchCount,7);assert.equal(restored.engagement.profile,null);
 const current=start();current.engagement.stats.seconds=40;current.engagement.phasePortals=2;current.engagement.finisher='used';const next=new Game();assert.equal(next.restore(current.snapshot()),true);assert.equal(next.engagement.game,next);assert.equal(next.engagement.stats.seconds,40);assert.equal(next.engagement.finisher,'used');
});
test('mastery medals are independent, bounded, persistent and separate from record revisions',()=>{
 const progress=readMastery(null),id=WORLDS[0].id,p=ENGAGEMENT.profiles[id];
 awardMastery(progress,{id,seconds:p.swift+10,livesLost:1,peakCombo:20,score:1000});assert.equal(counts(progress).medals,2);
 const result=awardMastery(progress,{id,seconds:p.swift-1,livesLost:0,peakCombo:0,score:900});assert.deepEqual(result.newMedals,['swift','flawless']);assert.equal(progress.worlds[id].bestScore,1000);assert.equal(counts(progress).medals,4);
 const persisted=readMastery(JSON.parse(JSON.stringify(progress)));assert.deepEqual(persisted.worlds,progress.worlds);
 persisted.worlds[id].revision='old';const revised=readMastery(persisted);assert.equal(counts(revised).medals,4);assert.equal(revised.worlds[id].bestTime,null);
 assert.ok(unlockedCosmetics(progress).some(c=>c.id==='original'));assert.ok(!unlockedCosmetics(progress).some(c=>c.id==='solar'));
});
test('workshop practice never inherits official protection or earns mastery',()=>{
 const g=new Game();g.start('practice',12);assert.equal(g.engagement.profile,null);assert.equal(g.engagement.encounter,undefined);assert.equal(g.engagement.complete(),null);
});
test('shared challenges validate revision, world, seed and optional targets',()=>{
 const q=new URLSearchParams({challenge:WORLDS[0].id,seed:'8399',ruleset:RULESET_REVISION,target:'1200',seconds:'60'});
 assert.deepEqual(readChallenge('?'+q),{world:0,seed:8399,score:1200,seconds:60});q.set('ruleset',LEGACY_RULESET_REVISION);assert.deepEqual(readChallenge('?'+q),{invalid:true});q.set('ruleset',RULESET_REVISION);q.set('seed','-1');assert.deepEqual(readChallenge('?'+q),{invalid:true});assert.equal(readChallenge(''),null);
});
test('optional balance notes stay bounded and contain no player identifiers',()=>{
 const progress=readMastery(null),g=start();g.engagement.stats.seconds=30;for(let i=0;i<90;i++)observeRun(progress,g,true);assert.equal(progress.observations.length,60);assert.ok(progress.observations.every(r=>!('player' in r)&&r.world===g.world.id));
});
