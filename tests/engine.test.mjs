import test from 'node:test';import assert from 'node:assert/strict';
import {Game,LIMIT,isValidSnapshot} from '../public/engine.js';import {makeLevel,POWERS,rng,daySeed,WORLD_COUNT,LAST_WORLD,formationCount} from '../public/levels.js';
test('all worlds have reachable brick positions and unique identifiers',()=>{for(let i=0;i<WORLD_COUNT;i++)for(let p=0;p<formationCount(i);p++){const l=makeLevel(i,p);assert.ok(l.bricks.length>20);assert.equal(new Set(l.bricks.map(b=>b.id)).size,l.bricks.length);for(const b of l.bricks){assert.ok(Math.abs(b.x)+b.w/2<10);assert.ok(b.y<12&&b.hp>0);}}});
test('daily seed and drop generator are repeatable',()=>{assert.equal(daySeed('2026-10-12'),daySeed('2026-10-12'));assert.notEqual(daySeed('2026-10-12'),daySeed('2026-10-13'));const a=rng(12),b=rng(12);for(let i=0;i<100;i++)assert.equal(a(),b());});
test('wall, ceiling and paddle contacts return the ball to play',()=>{const g=new Game();g.launch();const b=g.balls[0];b.x=9.76;b.y=0;b.vx=14;b.vy=2;g.tick(1/120);assert.ok(b.vx<0);b.x=0;b.y=11.76;b.vx=1;b.vy=14;g.tick(1/120);assert.ok(b.vy<0);b.x=.8;b.y=LIMIT.paddleY+.45;b.vx=0;b.vy=-14;g.tick(1/60);assert.ok(b.vy>0);assert.ok(b.vx>0);});
test('multiball consumes one life only after every ball is lost',()=>{const g=new Game();g.launch();g.power('multi');assert.equal(g.balls.length,3);g.balls[0].y=-15;g.tick(1/120);assert.equal(g.lives,3);g.balls.forEach(b=>b.y=-15);g.tick(1/120);assert.equal(g.lives,2);assert.equal(g.state,'ready');});
test('power-ups apply, expire, save a ball and keep width independent of paddle mode',()=>{const g=new Game();g.launch();for(const kind of Object.keys(POWERS))g.power(kind);assert.equal(g.lives,4);assert.ok(g.effects.wide>0);assert.equal(g.effects.sticky,0);assert.ok(g.effects.laser>0);assert.ok(g.effects.pierce>0);assert.ok(g.effects.slow>0);g.balls=g.balls.slice(0,1);g.balls[0].y=-12.1;g.balls[0].vy=-14;g.tick(1/120);assert.ok(g.balls[0].vy>0);assert.equal(g.shield,false);g.effects.laser=.001;g.tick(1/120);assert.equal(g.effects.laser,0);});
test('switches open gates and explosions damage neighboring bricks',()=>{const g=new Game();g.start('practice',2);assert.ok(g.barriers.length);g.damage(g.bricks.find(b=>b.kind==='switch'));assert.equal(g.barriers.length,0);g.start('practice',3);const brick=g.bricks.find(b=>b.kind==='explode'),before=g.bricks.filter(b=>b.hp>0).length;g.damage(brick);assert.ok(g.bricks.filter(b=>b.hp>0).length<before-1);});
test('paused game remains unchanged and a saved campaign restores',()=>{const g=new Game();g.launch();g.award(900);g.state='paused';const before=JSON.stringify(g.snapshot());g.tick(1);assert.equal(JSON.stringify(g.snapshot()),before);const h=new Game();assert.equal(h.restore(g.snapshot()),true);assert.equal(h.score,900);assert.equal(h.state,'ready');assert.deepEqual(h.bricks,g.bricks);assert.equal(h.restore({version:1,level:99,lives:3,bricks:[]}),false);});
test('checkpoints continue the current formation’s random drop sequence',()=>{
 const g=new Game();g.start('campaign',7,8399);g.phase=2;g.loadLevel();for(let i=0;i<17;i++)g.random();
 const save=JSON.parse(JSON.stringify(g.snapshot())),restored=new Game();assert.equal(restored.restore(save),true);assert.equal(restored.randomDraws,17);
 for(let i=0;i<30;i++)assert.equal(restored.random(),g.random());
 delete save.randomDraws;assert.equal(restored.restore(save),true);assert.equal(restored.randomDraws,0);
});
test('checkpoint validation rejects malformed data before mutating a running game',()=>{
 const g=new Game(),before=JSON.stringify(g.snapshot());
 for(const change of [s=>s.bricks[0]=null,s=>s.bricks[0].x=NaN,s=>s.bricks[0].id=s.bricks[1].id,s=>s.score=-1,s=>s.lives=2.5,s=>s.elapsed=Infinity,s=>s.barriers=[{}],s=>s.nextLife=0,s=>s.phase=2,s=>s.lastClear={seconds:8,speedPoints:'bad',clearPoints:1200}]){
  const save=JSON.parse(before);change(save);assert.equal(isValidSnapshot(save),false);assert.equal(g.restore(save),false);assert.equal(JSON.stringify(g.snapshot()),before);
 }
});
test('older optional checkpoint fields default safely and restored formations use their own brick count',()=>{
 const g=new Game();g.start('campaign',7);g.phase=2;g.loadLevel();const save=JSON.parse(JSON.stringify(g.snapshot()));
 for(const key of ['launchCount','randomDraws','bonusTotals','boardElapsed','nextLife','elapsed','time','hits','runId'])delete save[key];
 assert.equal(isValidSnapshot(save),true);const restored=new Game();assert.equal(restored.restore(save),true);assert.equal(restored.total,save.bricks.length);assert.equal(restored.nextLife,12000);assert.equal(restored.elapsed,0);
 restored.bricks[0].hp=0;assert.notEqual(save.bricks[0].hp,0);restored.launch();restored.tick(1/120);assert.ok(restored.balls.every(ball=>Number.isFinite(ball.x)&&Number.isFinite(ball.y)));
});
test('all sixteen campaign levels advance, including every final-boss stage',()=>{const g=new Game();for(let level=0;level<WORLD_COUNT;level++){assert.equal(g.level,level);for(let p=0;p<formationCount(level);p++){g.launch();g.bricks.forEach(b=>b.hp=0);g.tick(1/120);if(p<formationCount(level)-1){assert.equal(g.state,'ready');assert.equal(g.phase,p+1);}else assert.equal(g.state,'cleared');}assert.equal(g.next(),level<LAST_WORLD);}assert.equal(g.state,'won');});
test('bot can clear each world through actual ball collisions',()=>{
 for(let level=0;level<WORLD_COUNT;level++){
   const g=new Game();g.start('practice',level,8399);const random=rng(54+level);let offset=.2;let contacts=0;
   g.emit=e=>{if(e.type==='paddle'){offset=(random()-.5)*1.8;contacts++;}};
   for(let frame=0;frame<180000&&!['cleared','over'].includes(g.state);frame++){
     if(g.state==='ready')g.launch();for(const b of g.balls)if(b.held)g.launch();
     const b=[...g.balls].sort((a,b)=>a.y-b.y)[0];if(b)g.move(b.x+offset);
     g.tick(1/120);if(g.lives<3)g.lives=3;
   }
   assert.equal(g.state,'cleared','World '+(level+1)+' remaining '+g.bricks.filter(b=>b.hp>0).length+' contacts '+contacts);
 }
});

