import {makeLevel,POWERS,rng} from './levels.js?v=2';
export const LIMIT={left:-10,right:10,top:12,bottom:-13,paddleY:-10.6};
export const PICKUP_POINTS=150;
export const speedBonus=seconds=>Math.max(0,2000-10*Math.floor(Math.max(0,seconds)));
export class Game {
 constructor(onEvent=()=>{}){this.emit=onEvent;this.uid=0;this.start('campaign',0,8399);}
 start(mode='campaign',level=0,seed=8399){this.mode=mode;this.seed=seed;this.level=level;this.score=0;this.lives=3;this.nextLife=12000;this.elapsed=0;this.phase=0;this.bonusTotals={speed:0,pickups:0,clear:0};this.runId=globalThis.crypto?.randomUUID?.()||String(Date.now());this.loadLevel();}
 loadLevel(){
   Object.assign(this,makeLevel(this.level,this.phase));
   const stored=this.catalog?.get(this.level+':'+this.phase);if(stored)this.bricks=structuredClone(stored);
   this.random=rng(this.seed+this.level*97+this.phase*541);
   this.paddle={x:0,w:3.3};this.target=0;this.balls=[];this.drops=[];this.shots=[];this.effects={};this.shield=false;this.combo=0;this.time=0;this.boardElapsed=0;this.lastClear=null;this.lastShot=0;this.hits=0;this.total=this.bricks.length;this.state='ready';this.addBall(true);this.emit({type:'level'});
 }
 addBall(held=false,x=this.paddle.x,y=LIMIT.paddleY+.58,vx=3,vy=14){const b={id:++this.uid,x,y,vx,vy,r:.23,held,holdOffset:held?x-this.paddle.x:0,holdHeight:y-LIMIT.paddleY,portal:0,hits:new Set()};this.balls.push(b);return b;}
 speed(){return Math.min(21,(13.5+this.level*.6+this.hits*.065)*(this.level>=2&&this.level<=5?1.05:1));}
 releaseBall(b){b.held=false;const vx=b.holdVX??3.2,vy=Math.abs(b.holdVY??this.speed()),length=Math.hypot(vx,vy)||1;b.vx=vx/length*this.speed();b.vy=vy/length*this.speed();delete b.holdVX;delete b.holdVY;}
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
   if(brick.hp<=0)return;brick.hp--;this.hits++;
   if(brick.hp>0){this.emit({type:'hit',x:brick.x,y:brick.y,color:brick.color});return;}
   this.combo++;this.award(100*Math.min(5,1+Math.floor(this.combo/6)));
   this.emit({type:'break',x:brick.x,y:brick.y,color:brick.color,kind:brick.kind});
   if(brick.kind==='switch'){this.barriers=this.barriers.filter(b=>!b.gate);this.emit({type:'gate'});}
   if(brick.kind==='explode')for(const other of this.bricks)if(other.hp>0&&Math.hypot(other.x-brick.x,other.y-brick.y)<2.65)this.damage(other,true);
   if(!chain&&(this.random()<.19||this.hits===4)){
     const kinds=['wide','multi','sticky','laser','pierce','slow','shield'];const kind=this.random()<.025?'life':kinds[Math.floor(this.random()*kinds.length)];
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
   if(!['playing','ready'].includes(this.state))return;
   this.time+=dt;if(this.state==='playing'){this.elapsed+=dt;this.boardElapsed+=dt;for(const key of Object.keys(this.effects))this.effects[key]=Math.max(0,this.effects[key]-dt);}this.syncPaddleWidth();
   this.move(this.target);this.paddle.x+=(this.target-this.paddle.x)*Math.min(1,dt*25);
   for(const b of this.bricks)if(b.moving)b.x=b.baseX+Math.sin(this.time*.7+b.row)*.28;
   for(const o of this.barriers)if(o.moving)o.x=Math.sin(this.time*(this.level===4?.88:.8)+o.id)*5.7;
   this.syncHeldBalls();
   if(this.state==='ready')return;
   if(this.effects.laser>0&&this.time-this.lastShot>.36){this.lastShot=this.time;for(const offset of [-1,1])this.shots.push({id:++this.uid,x:this.paddle.x+offset*this.paddle.w*.4,y:LIMIT.paddleY+.5});this.emit({type:'laser'});}
   for(const shot of this.shots){shot.y+=dt*28;for(const brick of this.bricks)if(brick.hp>0&&Math.abs(shot.x-brick.x)<brick.w/2&&Math.abs(shot.y-brick.y)<brick.h/2+.35){this.damage(brick);shot.y=99;break;}}
   this.shots=this.shots.filter(s=>s.y<12);
   for(const drop of this.drops){drop.y-=dt*4.6;if(Math.abs(drop.y-LIMIT.paddleY)<.48&&Math.abs(drop.x-this.paddle.x)<this.paddle.w/2+.35){this.power(drop.kind,true);drop.y=-99;}}
   this.drops=this.drops.filter(d=>d.y>-13);
   for(const b of this.balls){
     if(b.held)continue;
     const scale=this.effects.slow>0?.67:1, oldX=b.x,oldY=b.y;
     const magnitude=Math.hypot(b.vx,b.vy)||1;b.vx=b.vx/magnitude*this.speed();b.vy=b.vy/magnitude*this.speed();
     if(Math.abs(b.vy)<this.speed()*.22)b.vy=Math.sign(b.vy||1)*this.speed()*.28;
     b.x+=b.vx*dt*scale;b.y+=b.vy*dt*scale;b.portal=Math.max(0,b.portal-dt);
     if(b.x<-10+b.r){b.x=-10+b.r;b.vx=Math.abs(b.vx);this.emit({type:'wall'});}
     if(b.x>10-b.r){b.x=10-b.r;b.vx=-Math.abs(b.vx);this.emit({type:'wall'});}
     if(b.y>12-b.r){b.y=12-b.r;b.vy=-Math.abs(b.vy);this.emit({type:'wall'});}
     const surface=LIMIT.paddleY+.17+b.r;
     if(b.vy<0&&oldY>=surface&&b.y<=surface){
       const impactX=oldX+(b.x-oldX)*(oldY-surface)/(oldY-b.y);
       if(Math.abs(impactX-this.paddle.x)<this.paddle.w/2+b.r){
        b.x=impactX;const offset=Math.max(-1,Math.min(1,(b.x-this.paddle.x)/(this.paddle.w/2)));
        const angle=offset*1.05;b.vx=Math.sin(angle)*this.speed();b.vy=Math.cos(angle)*this.speed();b.y=surface+.005;
        this.combo=0;if(this.effects.sticky>0){b.held=true;b.holdOffset=b.x-this.paddle.x;b.holdHeight=b.y-LIMIT.paddleY;b.holdVX=b.vx;b.holdVY=b.vy;}this.emit({type:'paddle',x:b.x,y:b.y});if(b.held)continue;
       }
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
   this.balls=this.balls.filter(b=>b.y>-13.5);
   if(!this.bricks.some(b=>b.hp>0)){
     const speedPoints=speedBonus(this.boardElapsed),clearPoints=this.level===7&&this.phase<2?500:750+this.lives*150;
     this.lastClear={seconds:Math.floor(this.boardElapsed),speedPoints,clearPoints};this.bonusTotals.speed+=speedPoints;this.bonusTotals.clear+=clearPoints;this.award(speedPoints+clearPoints);
     if(this.level===7&&this.phase<2){this.phase++;this.loadLevel();this.emit({type:'phase',phase:this.phase,speedPoints,clearPoints});}
     else{this.state='cleared';this.emit({type:'clear',speedPoints,clearPoints});}return;
   }
   if(!this.balls.length){this.lives--;this.effects={};this.drops=[];this.shots=[];this.combo=0;this.shield=false;
     if(this.lives<=0){this.state='over';this.emit({type:'over'});}else{this.addBall(true);this.state='ready';this.emit({type:'life'});}}
 }
 next(){if(this.level===7||this.mode!=='campaign'){this.state='won';return false;}this.level++;this.phase=0;this.loadLevel();return true;}
 snapshot(){return {version:1,mode:this.mode,seed:this.seed,level:this.level,phase:this.phase,score:this.score,lives:this.lives,nextLife:this.nextLife,elapsed:this.elapsed,boardElapsed:this.boardElapsed,bonusTotals:{...this.bonusTotals},lastClear:this.lastClear,runId:this.runId,bricks:this.bricks,barriers:this.barriers,time:this.time,hits:this.hits};}
 restore(s){if(!s||s.version!==1||!Number.isInteger(s.level)||s.level<0||s.level>7||s.lives<1||s.lives>9||!Array.isArray(s.bricks)||s.bricks.length>80)return false;
   this.start(s.mode,s.level,s.seed);for(const k of ['phase','score','lives','nextLife','elapsed','runId','time','hits'])this[k]=s[k];this.bricks=s.bricks;this.barriers=s.barriers||[];
   this.boardElapsed=Number.isFinite(s.boardElapsed)&&s.boardElapsed>=0?s.boardElapsed:Math.max(0,Number(s.time)||0);
   for(const key of ['speed','pickups','clear'])this.bonusTotals[key]=Number.isFinite(s.bonusTotals?.[key])&&s.bonusTotals[key]>=0?s.bonusTotals[key]:0;
   this.lastClear=s.lastClear||null;this.state='ready';return true;}
}
