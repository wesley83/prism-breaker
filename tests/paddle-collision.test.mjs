import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,LIMIT} from '../public/engine.js';

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
test('a late paddle cannot rescue a ball below its center or one moving upward',()=>{
 for(const y of [LIMIT.paddleY-.01,LIMIT.paddleY-1]){const g=game({x:2,y,target:8});g.tick(1/120);assert.ok(g.balls[0].vy<0);}
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
