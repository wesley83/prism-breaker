import test from 'node:test';
import assert from 'node:assert/strict';
import {DOMParser} from 'linkedom';
import {Game,LIMIT,PICKUP_POINTS,speedBonus} from '../public/engine.js';
import {rng,WORLD_COUNT} from '../public/levels.js';
import {originalWorld,worldDocument,parseWorld,worldHTML} from '../public/world-format.js';

test('R08 unsupported structured properties fail explicitly instead of disappearing on export',()=>{
 const html=worldDocument(originalWorld(0));
 for(const anchor of ['itemprop="name"','itemprop="phase"','itemprop="hitpoints"']){
  const altered=html.replace('<meta '+anchor,'<meta itemprop="designerNote" content="keep me"><meta '+anchor);
  assert.throws(()=>parseWorld(altered,{Parser:DOMParser}),/Unsupported property/);
 }
 const child=html.replace('</article>','<section itemprop="newMechanic" itemscope itemtype="urn:NewMechanic"></section></article>');
 assert.throws(()=>parseWorld(child,{Parser:DOMParser}),/Unsupported structured child/);
});
test('R08 hostile markup stays inert and supported worlds retain complete canonical round trips',()=>{
 const world=originalWorld(0);world.name='<img src=x onerror=alert(1)>';world.story='<script>bad()</script>';
 const html=worldDocument(world).replace('</body>','<script>bad()</script></body>');
 const parsed=parseWorld(html,{Parser:DOMParser}),doc=new DOMParser().parseFromString(worldHTML(parsed),'text/html');
 assert.equal(doc.querySelector('script,img'),null);assert.equal(parsed.name,world.name);assert.equal(parsed.story,world.story);
 assert.equal(worldHTML(parseWorld(worldHTML(parsed),{Parser:DOMParser})),worldHTML(parsed));
});
test('R14 generated document titles and validation messages retain correct UTF-8',()=>{
 assert.ok(worldDocument(originalWorld(0)).includes('<title>Prism Garden · World definition</title>'));
 const empty=originalWorld(0);empty.formations[0].bricks=[];assert.throws(()=>worldHTML(empty),/1–80 bricks/);
});
test('R08 inherited object names and off-board obstacle/movement geometry are rejected',()=>{
 const inherited=originalWorld(0);inherited.types.push({type:'urn:Brick:Custom:review',name:'Review',base:'constructor',effect:'none'});assert.throws(()=>worldHTML(inherited),/Invalid brick behavior/);
 const kind=originalWorld(0);kind.formations[0].bricks[0].kind='constructor';assert.throws(()=>worldHTML(kind),/Invalid brick type/);
 const obstacle=originalWorld(0);obstacle.formations[0].barriers.push({id:999,x:9,y:0,w:8,h:.5,moving:false,gate:false});assert.throws(()=>worldHTML(obstacle),/Barrier extends/);
 const moving=originalWorld(0);Object.assign(moving.formations[0].bricks[0],{moving:true,baseX:9,w:2});assert.throws(()=>worldHTML(moving),/Moving brick extends/);
});
test('R02 independent piecewise wall trajectories never miss sampled paddle-solid contacts',()=>{
 let state=72031,contacts=0;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 for(let n=0;n<6000;n++){
  const g=new Game();g.state='playing';g.hits=200;const wide=random()<.5,slow=random()<.5,side=random()<.5?-1:1;
  if(wide)g.power('wide');if(slow)g.power('slow');g.paddle.x=side*(10-g.paddle.w/2-random()*.8);g.move(g.paddle.x-side*random()*3);
  const b=g.balls[0],dt=[1/240,1/120,1/60,.05][n%4],angle=.2+random()*.9,speed=g.speed();
  Object.assign(b,{held:false,x:side*(9.65+random()*.12),y:LIMIT.paddleY-.3+random()*.95,vx:side*Math.sin(angle)*speed,vy:-Math.cos(angle)*speed});
  const x=b.x,y=b.y,vx=b.vx*(slow?.67:1),vy=b.vy*(slow?.67:1),px=g.paddle.x,tx=px+(g.target-px)*Math.min(1,dt*25),wall=side*(10-b.r);
  let touches=false;
  for(let sample=0;sample<=200;sample++){const time=dt*sample/200,raw=x+vx*time,bx=side*raw>side*wall?2*wall-raw:raw;
   const gapX=Math.max(0,Math.abs(bx-(px+(tx-px)*sample/200))-g.paddle.w/2),gapY=Math.max(0,Math.abs(y+vy*time-LIMIT.paddleY)-.17);
   if(Math.hypot(gapX,gapY)<=b.r){touches=true;break;}
  }
  g.tick(dt);if(touches){contacts++;assert.ok(b.held||b.vy>0,'wall/contact miss '+JSON.stringify({n,dt,side,x,y,vx,vy,px,tx,ball:{x:b.x,y:b.y,vx:b.vx,vy:b.vy},width:g.paddle.w}));}
 }
 assert.ok(contacts>500,'oracle must actually encounter contacts');
});
test('R07 independently calculated streak, pickup, clear and speed totals agree',()=>{
 const g=new Game();g.state='playing';g.random=()=>.99;g.hits=20;
 g.bricks=Array.from({length:13},(_,id)=>({id,x:id*3,y:5,w:1,h:.7,hp:1,maxHp:1,kind:'normal',color:'#ffffff'}));
 let expected=0;for(let i=1;i<=13;i++){g.damage(g.bricks[i-1]);expected+=100*Math.min(5,1+Math.floor(i/6));assert.equal(g.score,expected);}
 g.power('wide',true);expected+=150;assert.equal(PICKUP_POINTS,150);assert.equal(g.score,expected);
 g.boardElapsed=42;g.tick(1/120);expected+=1580+750+3*150;assert.equal(g.score,expected);assert.equal(g.state,'cleared');
 assert.equal(speedBonus(199.999),10);assert.equal(speedBonus(200),0);assert.equal(speedBonus(-1),2000);
});
test('R02 pause freezes powers and saved board time, including Sticky/Wide support',()=>{
 const g=new Game();g.state='playing';g.power('wide');g.power('sticky');const ball=g.balls[0];ball.held=true;ball.holdOffset=2.2;
 g.state='paused';const before=structuredClone({effects:g.effects,elapsed:g.elapsed,boardElapsed:g.boardElapsed,paddle:g.paddle});
 g.tick(10);assert.deepEqual({effects:g.effects,elapsed:g.elapsed,boardElapsed:g.boardElapsed,paddle:g.paddle},before);assert.equal(ball.held,true);
 g.state='playing';g.effects.wide=.001;g.tick(1/120);assert.equal(ball.held,false);assert.ok(ball.vy>0);
});
test('R02 a reflected wall contact catches the lower paddle during the actual 120 Hz game step',()=>{
 const g=new Game();g.state='playing';g.hits=200;g.power('wide');g.paddle.x=7.056439482606947;g.move(7.022434298414736);
 const b=g.balls[0];Object.assign(b,{held:false,x:9.746397232338786,y:-10.650728908495513,vx:15.862878344996556,vy:-13.761144233378243});
 g.tick(1/120);assert.ok(b.vy>0,'wall clamp must not discard the inward segment');assert.equal(g.lives,3);
});
test('R12 all sixteen worlds complete through real collisions with ordinary lives and earned powers only',()=>{
 const g=new Game(),random=rng(54);g.runId='00000000-0000-4000-8000-000000000054';let offset=.2;g.emit=e=>{if(e.type==='paddle')offset=(random()-.5)*1.8;};
 for(let level=0;level<WORLD_COUNT;level++){
  for(let frame=0;frame<180000&&!['cleared','over'].includes(g.state);frame++){
   if(g.state==='ready'||g.balls.some(b=>b.held))g.launch();const ball=[...g.balls].sort((a,b)=>a.y-b.y)[0];if(ball)g.move(ball.x+offset);g.tick(1/120);
  }
  assert.equal(g.state,'cleared','ordinary-lives collision bot stalled at world '+(level+1));assert.ok(g.lives>0);g.next();
 }
 assert.equal(g.state,'won');
});
