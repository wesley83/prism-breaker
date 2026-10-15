import {makeLevel,POWERS,rng,LAST_WORLD,formationCount} from './levels.js?v=3';
import {WORLDS,RULESET_REVISION} from './levels.js';
import {checkpointLevel,compatibleRuleset} from './world-identity.js';
import {validateWorld} from './world-schema.js';
import {BrickBehaviors} from './brick-events.js';
export const LIMIT={left:-10,right:10,top:12,bottom:-13,paddleY:-10.6};
// Solid endcaps reach 0.208 from center; include them in both paddle skins.
export const PADDLE_HALF_HEIGHT=.21;
export const PICKUP_POINTS=150;
export const speedBonus=seconds=>Math.max(0,2000-10*Math.floor(Math.max(0,seconds)));
const DROP_KINDS=['wide','multi','sticky','laser','pierce','slow','shield'];
// Sweep relative motion through the full solid paddle, expanded by ball radius.
// A ball center below the paddle center can still overlap its lower side.
function paddleImpact(b,oldX,oldY,paddle,oldPaddleX){
 const bottom=LIMIT.paddleY-PADDLE_HALF_HEIGHT-b.r;
 if(b.vy>=0||oldY<bottom)return null;
 const half=paddle.w/2+b.r,surface=LIMIT.paddleY+PADDLE_HALF_HEIGHT+b.r;
 const fall=oldY-b.y;if(fall<=0)return null;
 let enter=Math.max(0,(oldY-surface)/fall),leave=Math.min(1,(oldY-bottom)/fall);
 const start=oldX-oldPaddleX,delta=(b.x-oldX)-(paddle.x-oldPaddleX);
 if(Math.abs(delta)<1e-12){if(start < -half||start>half)return null;}
 else{const a=(-half-start)/delta,c=(half-start)/delta;enter=Math.max(enter,Math.min(a,c));leave=Math.min(leave,Math.max(a,c));}
 return enter<=leave?enter:null;
}
// Compact the small, frequently updated lists without allocating new arrays every tick.
function retainBetween(items,minY,maxY){let kept=0;for(let i=0;i<items.length;i++){const item=items[i];if(item.y>minY&&item.y<maxY)items[kept++]=item;}items.length=kept;}
const finiteBetween=(value,min,max)=>Number.isFinite(value)&&value>=min&&value<=max;
const integerBetween=(value,min,max)=>Number.isSafeInteger(value)&&value>=min&&value<=max;
function validBoxes(items,bricks=false){
 if(!Array.isArray(items)||items.length>(bricks?80:16)||(bricks&&!items.length))return false;
 const ids=new Set();
 for(const item of items){
  if(!item||!integerBetween(item.id,0,100000)||ids.has(item.id)||!finiteBetween(item.x,-30,30)||!finiteBetween(item.y,-30,30)||!finiteBetween(item.w,.01,30)||!finiteBetween(item.h,.01,30))return false;
  ids.add(item.id);
  if(item.moving!==undefined&&typeof item.moving!=='boolean')return false;
  if(bricks){
   if(!integerBetween(item.maxHp,1,100)||!integerBetween(item.hp,0,item.maxHp)||!['normal','armor','switch','explode'].includes(item.kind)||typeof item.color!=='string'||!item.color.length||item.color.length>100)return false;
   if(item.moving&&(!finiteBetween(item.baseX,-30,30)||!integerBetween(item.row,0,100)))return false;
  }else if(item.gate!==undefined&&typeof item.gate!=='boolean')return false;
 }
 return true;
}
// Check storage before touching live game state. Newer optional fields stay optional.
export function isValidSnapshot(s){
 if(!s||![1,2].includes(s.version))return false;
 const level=checkpointLevel(s);if(level<0||!compatibleRuleset(s.version===2?s.ruleset:undefined))return false;
 if(s.version===2){try{validateWorld(s.definition);if(s.definition.id!==s.worldId||typeof s.ruleset!=='string'||!/^[a-f0-9]{64}$/.test(s.ruleset)||typeof s.worldRevision!=='string'||!/^[a-f0-9]{64}$/.test(s.worldRevision))return false;}catch{return false;}}
 s={...s,level};
 if(!integerBetween(s.level,0,LAST_WORLD)||!integerBetween(s.lives,1,9)||!integerBetween(s.score,0,10000000)||!validBoxes(s.bricks,true)||!validBoxes(s.barriers??[]))return false;
 if(s.mode!==undefined&&!['campaign','daily','practice'].includes(s.mode))return false;
 if(s.seed!==undefined&&!Number.isSafeInteger(s.seed))return false;
 if(s.phase!==undefined&&(!integerBetween(s.phase,0,(s.version===2?s.definition.formations.length:formationCount(s.level))-1)))return false;
 if(s.runId!==undefined&&(typeof s.runId!=='string'||!s.runId.length||s.runId.length>64))return false;
 for(const key of ['elapsed','time'])if(s[key]!==undefined&&!finiteBetween(s[key],0,1000000000))return false;
 if(s.hits!==undefined&&!integerBetween(s.hits,0,10000000))return false;
 if(s.nextLife!==undefined&&!integerBetween(s.nextLife,s.score+1,10012000))return false;
 if(s.lastClear!=null&&(!integerBetween(s.lastClear.seconds,0,1000000000)||!integerBetween(s.lastClear.speedPoints,0,2000)||!integerBetween(s.lastClear.clearPoints,0,10000000)))return false;
 return true;
}
export class Game {
 constructor(onEvent=()=>{}){this.emit=onEvent;this.uid=0;this.events=new EventTarget();this.behaviors=new BrickBehaviors();this.start('campaign',0,8399);}
 start(mode='campaign',level=0,seed=8399){this.pinnedWorld=null;this.mode=mode;this.seed=seed;this.level=level;this.score=0;this.lives=3;this.nextLife=12000;this.elapsed=0;this.phase=0;this.launchCount=0;this.bonusTotals={speed:0,pickups:0,clear:0};this.runId=globalThis.crypto?.randomUUID?.()||String(Date.now());this.loadLevel();}
 loadLevel(){
   const stored=this.mode==='practice'&&this.catalog?.get(this.level+':'+this.phase);
   if(stored&&!Array.isArray(stored)){const {bricks,barriers,portals}=stored;Object.assign(this,structuredClone({bricks,barriers,portals}));}else{Object.assign(this,makeLevel(this.level,this.phase));if(Array.isArray(stored))this.bricks=structuredClone(stored);}
   this.world=this.pinnedWorld?.id===WORLDS[this.level].id?this.pinnedWorld:stored?.world||WORLDS[this.level];
   if(this.pinnedWorld===this.world)Object.assign(this,structuredClone(this.world.formations[this.phase]));
   this.behaviors.configure(this.world.types||stored?.types||[]);
   this.resetRandom();
   this.paddle={x:0,w:3.3};this.target=0;this.balls=[];this.drops=[];this.shots=[];this.effects={};this.shield=false;this.combo=0;this.time=0;this.boardElapsed=0;this.lastClear=null;this.lastShot=0;this.hits=0;this.total=this.bricks.length;this.state='ready';this.addBall(true);this.emit({type:'level'});
 }
 resetRandom(draws=0){const random=rng(this.seed+this.level*97+this.phase*541);this.randomDraws=0;this.random=()=>{this.randomDraws++;return random();};for(let i=0;i<draws;i++)this.random();}
 addBall(held=false,x=this.paddle.x,y=LIMIT.paddleY+.58,vx=3,vy=14){const b={id:++this.uid,x,y,vx,vy,r:.23,held,holdOffset:held?x-this.paddle.x:0,holdHeight:y-LIMIT.paddleY,portal:0,hits:new Set()};this.balls.push(b);return b;}
 speed(){return Math.min(21,(13.5+this.level*.6+this.hits*.065)*(this.level>=2&&this.level<=5?1.05:1));}
 freshLaunchAngle(){
   // Separate from drop randomness; the daily challenge has a shared launch sequence.
   let seed=this.seed|0;
   if(this.mode!=='daily')for(const char of String(this.runId))seed=Math.imul(seed^char.charCodeAt(0),16777619);
   const random=rng(seed^Math.imul(++this.launchCount,0x9e3779b9)^this.level*97^this.phase*541);
   return (random()<.5?-1:1)*(8+random()*10)*Math.PI/180;
 }
 releaseBall(b){
   b.held=false;const speed=this.speed();
   if(Number.isFinite(b.holdVX)&&Number.isFinite(b.holdVY)){
     const vx=b.holdVX,vy=Math.abs(b.holdVY),length=Math.hypot(vx,vy)||1;b.vx=vx/length*speed;b.vy=vy/length*speed;
   }else{const angle=this.freshLaunchAngle();b.vx=Math.sin(angle)*speed;b.vy=Math.cos(angle)*speed;}
   delete b.holdVX;delete b.holdVY;
 }
 launch(){if(this.state==='ready')this.state='playing';if(this.state!=='playing')return;let released=false;for(const b of this.balls)if(b.held){this.releaseBall(b);released=true;}if(released)this.emit({type:'launch'});}
 syncHeldBalls(shrunk=false){let released=false;for(const b of this.balls)if(b.held){b.x=this.paddle.x+(b.holdOffset||0);b.y=LIMIT.paddleY+(b.holdHeight??.58);if(shrunk&&Math.abs(b.holdOffset||0)>this.paddle.w/2){this.releaseBall(b);released=true;}}if(released){if(this.state==='ready')this.state='playing';this.emit({type:'launch',automatic:true});}}
 syncPaddleWidth(){const previous=this.paddle.w;this.paddle.w=this.effects.wide>0?4.9:3.3;const edge=10-this.paddle.w/2;this.paddle.x=Math.max(-edge,Math.min(edge,this.paddle.x));this.move(this.target);this.syncHeldBalls(this.paddle.w<previous);}
 move(x){this.target=Math.max(-10+this.paddle.w/2,Math.min(10-this.paddle.w/2,x));}
 power(kind,collected=false){
   const p=POWERS[kind];if(!p)return;
   const points=collected?PICKUP_POINTS:0;if(points){this.bonusTotals.pickups+=points;this.award(points);}
   if(p.duration)this.effects[kind]=Math.min(p.duration*1.5,(this.effects[kind]||0)+p.duration);
   // Paddle width stacks with sticky/laser; sticky and laser remain alternatives.
   if(kind==='sticky')this.effects.laser=0;
   if(kind==='laser')this.effects.sticky=0;
   this.syncPaddleWidth();
   if(kind==='multi'){
     const src=this.balls.find(b=>!b.held)||this.balls[0];
     if(src)for(const direction of [-1,1])if(this.balls.length<6){const a=Math.atan2(src.vx,Math.abs(src.vy))+direction*.38;this.addBall(false,src.x,src.y,Math.sin(a)*this.speed(),Math.cos(a)*this.speed());}
   }
   if(kind==='shield')this.shield=true;
   if(kind==='life')this.lives=Math.min(9,this.lives+1);
   this.emit({type:'power',kind,points});
 }
 award(n){this.score+=n;while(this.score>=this.nextLife){this.nextLife+=12000;this.lives=Math.min(9,this.lives+1);this.emit({type:'power',kind:'life'});}}
 damage(brick,chain=false){
   if(brick.hp<=0||!this.behaviors.strike(this,brick,chain))return;brick.hp--;this.hits++;
   this.events.dispatchEvent(new CustomEvent('brickdamage',{detail:{game:this,brick,chain}}));
   if(brick.hp>0){this.emit({type:'hit',x:brick.x,y:brick.y,color:brick.color});return;}
   this.combo++;this.award(100*Math.min(5,1+Math.floor(this.combo/6)));
   this.emit({type:'break',x:brick.x,y:brick.y,color:brick.color,kind:brick.kind});
   this.behaviors.broken(this,brick,chain);
   if(!chain&&(this.random()<.19||this.hits===4)){
     const kind=this.random()<.025?'life':DROP_KINDS[Math.floor(this.random()*DROP_KINDS.length)];
     this.drops.push({id:++this.uid,x:brick.x,y:brick.y,kind});
   }
 }
 reflectBox(b,o,oldX,oldY){
   if(Math.abs(b.x-o.x)>o.w/2+b.r||Math.abs(b.y-o.y)>o.h/2+b.r)return false;
   const left=o.x-o.w/2-b.r,right=o.x+o.w/2+b.r,top=o.y+o.h/2+b.r,bottom=o.y-o.h/2-b.r;
   if(oldY>=top){b.y=top+.002;b.vy=Math.abs(b.vy);}else if(oldY<=bottom){b.y=bottom-.002;b.vy=-Math.abs(b.vy);}
   else if(oldX<=left){b.x=left-.002;b.vx=-Math.abs(b.vx);}else if(oldX>=right){b.x=right+.002;b.vx=Math.abs(b.vx);}
   else{b.vy=-b.vy;b.y=b.vy>0?top+.002:bottom-.002;}
   return true;
 }
 tick(dt){
   if(this.state!=='playing'&&this.state!=='ready')return;
   this.time+=dt;if(this.state==='playing'){this.elapsed+=dt;this.boardElapsed+=dt;for(const key in this.effects)this.effects[key]=Math.max(0,this.effects[key]-dt);}this.syncPaddleWidth();
   const oldPaddleX=this.paddle.x;
   this.move(this.target);this.paddle.x+=(this.target-this.paddle.x)*Math.min(1,dt*25);
   for(const b of this.bricks)if(b.moving)b.x=b.baseX+Math.sin(this.time*.7+b.row)*.28;
   for(const o of this.barriers)if(o.moving)o.x=Math.sin(this.time*(this.level===4?.88:.8)+o.id)*5.7;
   this.syncHeldBalls();
   if(this.state==='ready')return;
   if(this.effects.laser>0&&this.time-this.lastShot>.36){this.lastShot=this.time;for(const offset of [-1,1])this.shots.push({id:++this.uid,x:this.paddle.x+offset*this.paddle.w*.4,y:LIMIT.paddleY+.5});this.emit({type:'laser'});}
   for(const shot of this.shots){shot.y+=dt*28;for(const brick of this.bricks)if(brick.hp>0&&Math.abs(shot.x-brick.x)<brick.w/2&&Math.abs(shot.y-brick.y)<brick.h/2+.35){this.damage(brick);shot.y=99;break;}}
   retainBetween(this.shots,-Infinity,12);
   for(const drop of this.drops){drop.y-=dt*4.6;if(Math.abs(drop.y-LIMIT.paddleY)<.48&&Math.abs(drop.x-this.paddle.x)<this.paddle.w/2+.35){this.power(drop.kind,true);drop.y=-99;}}
   retainBetween(this.drops,-13,Infinity);
   for(const b of this.balls){
     if(b.held)continue;
     const scale=this.effects.slow>0?.67:1, oldX=b.x,oldY=b.y,speed=this.speed();
     const magnitude=Math.hypot(b.vx,b.vy)||1;b.vx=b.vx/magnitude*speed;b.vy=b.vy/magnitude*speed;
     if(Math.abs(b.vy)<speed*.22)b.vy=Math.sign(b.vy||1)*speed*.28;
     b.x+=b.vx*dt*scale;b.y+=b.vy*dt*scale;b.portal=Math.max(0,b.portal-dt);
     if(b.x<-10+b.r){b.x=-10+b.r;b.vx=Math.abs(b.vx);this.emit({type:'wall'});}
     if(b.x>10-b.r){b.x=10-b.r;b.vx=-Math.abs(b.vx);this.emit({type:'wall'});}
     if(b.y>12-b.r){b.y=12-b.r;b.vy=-Math.abs(b.vy);this.emit({type:'wall'});}
     const surface=LIMIT.paddleY+PADDLE_HALF_HEIGHT+b.r;
     const contact=paddleImpact(b,oldX,oldY,this.paddle,oldPaddleX);
     if(contact!==null){
        const impactPaddleX=oldPaddleX+(this.paddle.x-oldPaddleX)*contact;
        b.x=oldX+(b.x-oldX)*contact;const catchOffset=b.x-impactPaddleX,offset=Math.max(-1,Math.min(1,catchOffset/(this.paddle.w/2)));
        const angle=offset*1.05;b.vx=Math.sin(angle)*speed;b.vy=Math.cos(angle)*speed;b.y=surface+.005;
        this.combo=0;if(this.effects.sticky>0){b.held=true;b.holdOffset=catchOffset;b.holdHeight=b.y-LIMIT.paddleY;b.holdVX=b.vx;b.holdVY=b.vy;b.x=this.paddle.x+catchOffset;}this.emit({type:'paddle',x:b.x,y:b.y});if(b.held)continue;
     }
     if(this.shield&&b.y<-11.9&&b.vy<0){this.shield=false;b.y=-11.9;b.vy=Math.abs(b.vy);this.emit({type:'save'});}
     for(const o of this.barriers)this.reflectBox(b,o,oldX,oldY);
     for(const brick of this.bricks){
       if(brick.hp<=0)continue;
       const touching=Math.abs(b.x-brick.x)<brick.w/2+b.r&&Math.abs(b.y-brick.y)<brick.h/2+b.r;
       if(!touching){b.hits.delete(brick.id);continue;}
       if(b.hits.has(brick.id))continue;b.hits.add(brick.id);
       if(!this.effects.pierce)this.reflectBox(b,brick,oldX,oldY);
       this.damage(brick);if(!this.effects.pierce)break;
     }
     if(b.portal<=0)for(let i=0;i<this.portals.length;i++){const p=this.portals[i];if(Math.hypot(b.x-p.x,b.y-p.y)<.7){const dest=this.portals[1-i];b.x=dest.x;b.y=dest.y;b.portal=1;this.emit({type:'portal',x:b.x,y:b.y});break;}}
   }
   retainBetween(this.balls,-13.5,Infinity);
   if(!this.bricks.some(b=>b.hp>0)){
     const speedPoints=speedBonus(this.boardElapsed),clearPoints=this.phase<this.world.formations.length-1?500:750+this.lives*150;
     this.lastClear={seconds:Math.floor(this.boardElapsed),speedPoints,clearPoints};this.bonusTotals.speed+=speedPoints;this.bonusTotals.clear+=clearPoints;this.award(speedPoints+clearPoints);
     if(this.phase<this.world.formations.length-1){this.phase++;this.loadLevel();this.emit({type:'phase',phase:this.phase,speedPoints,clearPoints});}
     else{this.state='cleared';this.emit({type:'clear',speedPoints,clearPoints});}return;
   }
   if(!this.balls.length){this.lives--;this.effects={};this.drops=[];this.shots=[];this.combo=0;this.shield=false;
     if(this.lives<=0){this.state='over';this.emit({type:'over'});}else{this.addBall(true);this.state='ready';this.emit({type:'life'});}}
 }
 next(){if(this.level===LAST_WORLD||this.mode!=='campaign'){this.state='won';return false;}this.level++;this.phase=0;this.loadLevel();return true;}
 snapshot(){return structuredClone({version:2,worldId:this.world.id,worldRevision:this.world.revision||WORLDS[this.level].revision,ruleset:RULESET_REVISION,definition:this.world,mode:this.mode,seed:this.seed,level:this.level,phase:this.phase,score:this.score,lives:this.lives,nextLife:this.nextLife,elapsed:this.elapsed,boardElapsed:this.boardElapsed,bonusTotals:{...this.bonusTotals},lastClear:this.lastClear,runId:this.runId,launchCount:this.launchCount,randomDraws:this.randomDraws,bricks:this.bricks,barriers:this.barriers,time:this.time,hits:this.hits});}
 restore(s){if(!isValidSnapshot(s))return false;s={...s,level:checkpointLevel(s)};
   this.start(s.mode,s.level,s.seed);for(const k of ['phase','score','lives','nextLife','elapsed','runId','time','hits'])if(s[k]!==undefined)this[k]=s[k];this.nextLife=s.nextLife??(Math.floor(this.score/12000)+1)*12000;this.bricks=structuredClone(s.bricks);this.barriers=structuredClone(s.barriers??[]);this.total=this.bricks.length;this.pinnedWorld=s.version===2?structuredClone(s.definition):structuredClone(WORLDS[this.level]);this.world=this.pinnedWorld;this.portals=structuredClone(this.world.formations[this.phase].portals);this.behaviors.configure(this.world.types);
   this.resetRandom(Number.isSafeInteger(s.randomDraws)&&s.randomDraws>=0&&s.randomDraws<=10000?s.randomDraws:0);
   this.boardElapsed=Number.isFinite(s.boardElapsed)&&s.boardElapsed>=0?s.boardElapsed:Math.max(0,Number(s.time)||0);
   this.launchCount=Number.isSafeInteger(s.launchCount)&&s.launchCount>=0?s.launchCount:0;
   for(const key of ['speed','pickups','clear'])this.bonusTotals[key]=Number.isFinite(s.bonusTotals?.[key])&&s.bonusTotals[key]>=0?s.bonusTotals[key]:0;
   this.lastClear=s.lastClear||null;this.state='ready';return true;}
}
