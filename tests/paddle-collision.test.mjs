import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,LIMIT,PADDLE_HALF_HEIGHT} from '../public/engine.js';
import * as T from '../public/vendor/three.module.min.js';
import {makePaddle} from '../public/paddle-art.js';

function game({x=0,y=LIMIT.paddleY+.45,vx=0,paddleX=0,target=paddleX,wide=false,sticky=false}={}){
 const g=new Game();g.launch();g.paddle.x=paddleX;g.target=target;
 if(wide)g.power('wide');if(sticky)g.power('sticky');
 Object.assign(g.balls[0],{x,y,vx,vy:-18});return g;
}
test('a paddle moving away still catches a ball that crossed its top earlier in the tick',()=>{
 const g=game({x:-1.7,y:LIMIT.paddleY+.41,target:8});g.tick(1/120);
 assert.ok(g.balls[0].vy>0,'contact must use the paddle position at impact');
});
test('moving the paddle into a descending ball beside its upper edge catches it',()=>{
 const g=game({x:2,y:LIMIT.paddleY+.30,target:8});g.tick(1/120);
 assert.ok(g.balls[0].vy>0,'side contact must not pass through the paddle');
});
test('descending balls already touching the upper paddle are recovered',()=>{
 const g=game({y:LIMIT.paddleY+.25});g.tick(1/120);assert.ok(g.balls[0].vy>0);
});
test('a late paddle cannot rescue a ball below its full body or one moving upward',()=>{
 for(const y of [LIMIT.paddleY-.46,LIMIT.paddleY-1]){const g=game({x:2,y,target:8}),ball=g.balls[0];g.tick(1/120);assert.ok(ball.vy<0);}
 const g=game({y:LIMIT.paddleY+.2});g.balls[0].vy=18;g.tick(1/120);assert.ok(g.balls[0].vy>0);assert.equal(g.combo,0);
});
test('clear misses stay misses, including a paddle arriving after the ball has passed',()=>{
 const g=game({x:4,y:LIMIT.paddleY+.05,target:8});g.tick(1/120);assert.ok(g.balls[0].vy<0);
 const h=game({x:3});h.tick(1/60);assert.ok(h.balls[0].vy<0);
});
test('Sticky stores the moving catch point and follows the paddle without snapping to center',()=>{
 const g=game({x:2,y:LIMIT.paddleY+.30,target:8,sticky:true});g.tick(1/120);
 const b=g.balls[0];assert.equal(b.held,true);assert.ok(b.holdOffset>1);
 assert.ok(Math.abs(b.x-g.paddle.x-b.holdOffset)<1e-9);
 const offset=b.holdOffset;g.move(-4);g.tick(1/120);assert.equal(b.holdOffset,offset);assert.ok(Math.abs(b.x-g.paddle.x-offset)<1e-9);
});
test('Wide catches at its outer edge and releases a Sticky ball if its support expires',()=>{
 const g=game({x:2.3,wide:true,sticky:true});g.tick(1/60);const b=g.balls[0];assert.equal(b.held,true);assert.ok(b.holdOffset>1.65);
 g.effects.wide=.001;g.tick(1/120);assert.equal(b.held,false);assert.equal(g.paddle.w,3.3);assert.ok(b.vy>0);
});
test('stationary paddle catches high-speed balls across different frame intervals and both edges',()=>{
 for(const dt of [1/240,1/120,1/60,.05])for(const x of [-1.8,-1,0,1,1.8]){
  const g=game({x,y:LIMIT.paddleY+.401});g.hits=200;g.tick(dt);assert.ok(g.balls[0].vy>0,`${x}, ${dt}`);
 }
});
test('moving edge catches are symmetric and independent for every ball in multiball',()=>{
 for(const direction of [-1,1])for(const wide of [false,true])for(const slow of [false,true]){
  const g=game({x:direction*(wide?2.8:2),y:LIMIT.paddleY+.3,target:direction*8,wide});
  if(slow)g.effects.slow=10;
  const b=g.balls[0];g.addBall(false,b.x,LIMIT.paddleY-1,0,-18);g.tick(1/120);
  assert.ok(b.vy>0);assert.equal(Math.sign(b.vx),direction);assert.ok(g.balls[1].vy<0);
 }
});
test('Wide expiry preserves an inner held ball and releases only unsupported balls',()=>{
 const g=game({x:.8,wide:true,sticky:true});g.tick(1/60);const inner=g.balls[0];
 const outer=g.addBall(true,2.3);outer.holdVX=10;outer.holdVY=10;
 g.effects.wide=.001;g.tick(1/120);assert.equal(inner.held,true);assert.equal(outer.held,false);assert.equal(inner.holdOffset,.8);
});

test('a descending ball beside the visible lower half is caught when the paddle reaches it',()=>{
 for(const direction of [-1,1])for(const offset of [-.01,-.12,-.25]){
  const g=game({x:direction*2,y:LIMIT.paddleY+offset,target:direction*8});g.tick(1/120);
  assert.ok(g.balls[0].vy>0,`visible lower-side contact missed: ${direction}, ${offset}`);
 }
});

test('a visible raised endcap catches a ball even while the paddle moves away',()=>{
 for(const direction of [-1,1]){
  const g=game({x:direction*1.6,y:LIMIT.paddleY+.43,target:-direction*8});g.tick(1/120);
  assert.ok(g.balls[0].vy>0,'the endcap is taller than the former 0.17 collision half-height');
 }
});

test('independent circle/rectangle motion sampling finds no missed contacts across the full paddle body',()=>{
 let contacts=0;
 for(const wide of [false,true])for(const slow of [false,true])for(const direction of [-1,1])for(const dt of [1/240,1/120,1/60,.05])for(const y of [-.3,-.15,-.01,.1,.3,.6]){
  const g=game({x:direction*((wide?4.9:3.3)/2+.3),y:LIMIT.paddleY+y,target:direction*8,wide});
  if(slow)g.effects.slow=10;
  const ball=g.balls[0],startY=ball.y,startX=ball.x,speed=g.speed()*(slow?.67:1);g.tick(dt);
  let touching=false;
  // Independent distance-to-solid-body oracle; no call to the swept collision helper.
  for(let i=0;i<=500;i++){const t=i/500,dx=Math.max(0,Math.abs(startX-g.paddle.x*t)-g.paddle.w/2),dy=Math.max(0,Math.abs(startY-speed*dt*t-LIMIT.paddleY)-.17);if(Math.hypot(dx,dy)<=ball.r){touching=true;break;}}
  if(touching){contacts++;assert.ok(ball.vy>0,`missed solid body: ${JSON.stringify({wide,slow,direction,dt,y})}`);}
 }
 assert.ok(contacts>100,'matrix must include substantial actual geometric contact coverage');
});

test('solid paddle artwork fits the collision height instead of relying on a body-only assumption',()=>{
 const paddle=makePaddle(null,null);paddle.position.set(0,0,0);paddle.updateMatrixWorld(true);
 const boxes=[paddle.userData.art.body,...paddle.userData.art.ends.map(end=>end.end)];
 const top=Math.max(...boxes.map(mesh=>new T.Box3().setFromObject(mesh).max.y));
 assert.ok(top<=PADDLE_HALF_HEIGHT,'future solid artwork changes must fit the collision envelope');
 const g=game({x:1.6,y:LIMIT.paddleY+top+.22,target:-8}),ball=g.balls[0];g.tick(1/120);
 assert.ok(ball.vy>0,`rendered solid top ${top} exceeds collision surface`);
});

test('seeded diagonal trajectories cannot tunnel through independently sampled solid contacts',()=>{
 let seed=90713,contacts=0,clearBelow=0;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let run=0;run<4000;run++){
  const wide=random()<.5,slow=random()<.5,dt=[1/240,1/120,1/60,.05][Math.floor(random()*4)],paddleX=random()*12-6;
  const g=game({wide}),b=g.balls[0];g.paddle.x=paddleX;g.move(random()*16-8);if(slow)g.effects.slow=10;
  g.hits=random()<.5?0:200;const speed=g.speed(),angle=(random()*2-1)*1.1;
  Object.assign(b,{x:paddleX+(random()*2-1)*(g.paddle.w/2+.8),y:LIMIT.paddleY+random()*1.9-.6,vx:Math.sin(angle)*speed,vy:-Math.cos(angle)*speed});
  const x=b.x,y=b.y,dx=b.vx*dt*(slow?.67:1),dy=b.vy*dt*(slow?.67:1);
  if(Math.abs(x+dx)>9.7)continue; // This independent straight-line oracle excludes wall bounces.
  g.tick(dt);let touching=false;
  for(let sample=0;sample<=200;sample++){const t=sample/200,px=paddleX+(g.paddle.x-paddleX)*t;
   const gapX=Math.max(0,Math.abs(x+dx*t-px)-g.paddle.w/2),gapY=Math.max(0,Math.abs(y+dy*t-LIMIT.paddleY)-.17);
   if(Math.hypot(gapX,gapY)<=b.r){touching=true;break;}
  }
  if(touching){contacts++;assert.ok(b.vy>0,`sampled contact missed in seeded run ${run}`);}
  if(y<LIMIT.paddleY-PADDLE_HALF_HEIGHT-b.r){clearBelow++;assert.ok(b.vy<0,'a fully departed ball must remain a miss');}
 }
 assert.ok(contacts>500);assert.ok(clearBelow>100);
});

test('a lower-side Sticky catch keeps its offset and releases after Wide support expires',()=>{
 const g=game({x:2.7,y:LIMIT.paddleY-.12,target:8,wide:true,sticky:true}),b=g.balls[0];g.tick(1/120);
 assert.equal(b.held,true);assert.ok(b.holdOffset>1.65);assert.ok(Math.abs(b.x-g.paddle.x-b.holdOffset)<1e-9);
 g.effects.wide=.001;g.tick(1/120);assert.equal(b.held,false);assert.ok(b.vy>0);
});
