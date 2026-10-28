import {ENGAGEMENT} from './engagement-data.js';
export const profileFor=id=>ENGAGEMENT.profiles[id];
// Mutable session observations belong to the run; authored goals remain HTML data.
export class EngagementRun{
 constructor(game,enabled=true){this.game=game;this.enabled=enabled;this.stats=null;this.report=null;}
 load(){
  const g=this.game;this.profile=this.enabled&&(g.mode!=='practice'||g.officialPractice)?profileFor(g.world.id):null;
  if(!this.profile)return;
  if(!this.stats||this.stats.id!==g.world.id){this.report=null;this.stats={id:g.world.id,seconds:0,tailSeconds:0,livesLost:0,peakCombo:0,portals:0,chains:0,precision:0,pickups:0,scoreStart:g.score,livesAtEntry:g.lives};}
  this.encounter=this.profile.encounters.find(e=>e.phase===g.phase);this.phasePortals=0;this.finisher='locked';this.choiceDone=false;this.lastDamage=0;this.barrierClock=0;this.tailSeconds=0;this.encounterState='';this.lastSynergy='';
  for(const b of g.bricks){b.encounterRole=this.encounter?.cores.includes(b.id)?'core':this.encounter?.generators.includes(b.id)?'generator':null;}
  this.updateEncounter();
 }
 get recovery(){const p=this.profile;return !!p&&this.game.boardElapsed%(p.peakSeconds+p.recoverySeconds)>=p.peakSeconds;}
 get synergy(){const g=this.game;if(!this.profile)return '';return g.effects.wide>0&&g.effects.sticky>0?'precision':g.effects.pierce>0&&g.balls.length>=3?'storm':g.effects.laser>0&&g.bricks.some(b=>b.hp>0&&b.kind==='explode')?'fuse':'';}
 locked(brick){
  const e=this.encounter,g=this.game;if(!e||!e.cores.includes(brick.id))return false;
  if(e.generators.some(id=>g.bricks.some(b=>b.id===id&&b.hp>0))||this.phasePortals<e.portalUses)return true;
  return e.kind==='storm'&&g.boardElapsed%e.period<e.period-e.opening;
 }
 updateEncounter(){
  if(!this.encounter)return;const e=this.encounter,g=this.game,alive=e.cores.some(id=>g.bricks.some(b=>b.id===id&&b.hp>0));
  for(const b of g.bricks)b.protected=b.hp>0&&this.locked(b);
  const generators=e.generators.filter(id=>g.bricks.some(b=>b.id===id&&b.hp>0)).length;
  this.encounterState=!alive?'Core restored':generators?'Generators remaining: '+generators:this.phasePortals<e.portalUses?'Portal journeys: '+this.phasePortals+' / '+e.portalUses:e.kind==='storm'&&this.locked(g.bricks.find(b=>e.cores.includes(b.id)))?(g.boardElapsed%e.period>=e.period-e.opening-2?'Storm warning · core opens next':'Core shielded · wait for the storm opening'):'Core exposed · strike now';
 }
 tick(dt){
  if(!this.profile)return;const g=this.game;this.stats.seconds+=dt;this.barrierClock+=dt*(this.recovery?.5:1);this.updateEncounter();
  let remaining=0;for(const b of g.bricks)if(b.hp>0)remaining++;
  if(remaining>0&&remaining<=3){this.tailSeconds+=dt;this.stats.tailSeconds+=dt;}
  if(this.finisher==='locked'&&remaining>0&&remaining<=3&&g.boardElapsed-this.lastDamage>=12&&!g.bricks.some(b=>b.hp>0&&this.locked(b))){this.finisher='ready';g.emit({type:'precision-ready'});}
  const synergy=this.synergy;if(synergy&&synergy!==this.lastSynergy)g.emit({type:'synergy',kind:synergy});this.lastSynergy=synergy;
 }
 arm(){if(this.finisher!=='ready'||this.game.state!=='playing')return false;this.finisher='armed';return true;}
 catchBall(){if(this.finisher!=='armed')return false;this.finisher='used';this.game.emit({type:'precision-catch'});return true;}
 aim(degrees){
  if(!this.profile||!Number.isFinite(degrees)||!['ready','playing'].includes(this.game.state))return;
  const angle=Math.max(-60,Math.min(60,degrees))*Math.PI/180,speed=this.game.speed();
  for(const ball of this.game.balls)if(ball.held&&ball.aimable){ball.holdVX=Math.sin(angle)*speed;ball.holdVY=Math.cos(angle)*speed;}
 }
 broken(brick,chain){
  if(!this.profile)return;const g=this.game;this.lastDamage=g.boardElapsed;this.stats.peakCombo=Math.max(this.stats.peakCombo,g.combo);if(chain)this.stats.chains++;
  if([6,12,18,24].includes(g.combo))g.emit({type:'combo',count:g.combo,multiplier:Math.min(5,1+Math.floor(g.combo/6)),x:brick.x,y:brick.y,color:brick.color});
  const destroyed=g.bricks.filter(b=>b.hp===0).length;
  if(!chain&&!this.choiceDone&&destroyed>=8&&g.bricks.length-destroyed>6){
   this.choiceDone=true;const group=++g.uid;
   this.profile.choice.forEach((kind,i)=>g.drops.push({id:++g.uid,x:Math.max(-8.7,Math.min(8.7,brick.x+(i?1.4:-1.4))),y:brick.y,kind,choice:group}));g.emit({type:'power-choice',kinds:this.profile.choice});
  }
 }
 portal(){if(this.profile){this.stats.portals++;this.phasePortals++;this.updateEncounter();}}
 paddle(offset){if(this.profile&&Math.abs(offset)>=.65)this.stats.precision++;}
 life(){if(this.profile)this.stats.livesLost++;}
 complete(){if(this.profile)this.report={...this.stats,score:this.game.score-this.stats.scoreStart,seconds:Math.round(this.stats.seconds*10)/10};return this.report;}
 snapshot(){return this.profile?{stats:this.stats,phasePortals:this.phasePortals,finisher:this.finisher,choiceDone:this.choiceDone,lastDamage:this.lastDamage,barrierClock:this.barrierClock,report:this.report}:null;}
 restore(value){
  if(!this.profile||!value?.stats||value.stats.id!==this.game.world.id)return;
  const keys=['seconds','tailSeconds','livesLost','peakCombo','portals','chains','precision','pickups','scoreStart','livesAtEntry'];
  if(keys.some(k=>!Number.isFinite(value.stats[k])||value.stats[k]<0||value.stats[k]>10000000))return;
  this.stats={id:this.game.world.id,...Object.fromEntries(keys.map(k=>[k,value.stats[k]]))};
  this.phasePortals=Number.isSafeInteger(value.phasePortals)&&value.phasePortals>=0?Math.min(100000,value.phasePortals):0;
  this.finisher=['locked','ready','armed','used'].includes(value.finisher)?value.finisher:'locked';this.choiceDone=value.choiceDone===true;
  this.lastDamage=Number.isFinite(value.lastDamage)?Math.max(0,Math.min(this.game.boardElapsed,value.lastDamage)):this.game.boardElapsed;
  this.barrierClock=Number.isFinite(value.barrierClock)?Math.max(0,value.barrierClock):0;this.report=null;this.updateEncounter();
 }
}
