import {ENGAGEMENT} from './engagement-data.js';
import {readMastery,counts,unlockedCosmetics,awardMastery,nextGoal,medalNames,observeRun} from './mastery.js';
import {WORLDS,RULESET_REVISION} from './levels.js';
import {downloadRecovery} from './save-recovery.js';
export const SYNERGIES={precision:'Precision rig · Wide + Sticky: wider catches, released from the catch point.',storm:'Prism storm · Multiball + Pierce: surviving armor takes a second hit.',fuse:'Chain conductor · Laser + Explosives: explosions reach farther.'};
const seconds=n=>Math.floor(n/60)+'m '+String(Math.floor(n%60)).padStart(2,'0')+'s';
const text=(node,value)=>{if(node.textContent!==value)node.textContent=value;};
export function readChallenge(search){
 const q=new URLSearchParams(search),id=q.get('challenge');if(!id)return null;
 const world=WORLDS.findIndex(w=>w.id===id),seed=Number(q.get('seed')),score=Number(q.get('target')),time=Number(q.get('seconds'));
 if(world<0||!q.has('seed')||!Number.isSafeInteger(seed)||seed<0||seed>4294967295||q.get('ruleset')!==RULESET_REVISION)return {invalid:true};
 return {world,seed,score:Number.isSafeInteger(score)&&score>=0&&score<=1000000?score:0,seconds:Number.isFinite(time)&&time>0&&time<99999?time:0};
}
export class EngagementUI{
 constructor({storage,settings,game,open,practice,share,previewMusic}){
  Object.assign(this,{storage,settings,game,open,practice,share,previewMusic});this.$=s=>document.querySelector(s);this.progress=readMastery(storage.get('mastery'));this.lastMedals=null;this.challenge=readChallenge(location.search);
  const feedback=storage.get('play-feedback',[]);this.feedback=Array.isArray(feedback)?feedback.slice(-30).filter(r=>r&&ENGAGEMENT.profiles[r.world]&&['Satisfying','Too difficult','Slow ending'].includes(r.note)).map(r=>({world:r.world,note:r.note})):[];
  this.$('#mastery-open').onclick=()=>{this.renderCollection();open('#mastery-dialog');};
  this.$('#export-play-notes').onclick=()=>downloadRecovery({version:1,observations:this.progress.observations,feedback:this.feedback||[]},'prism-play-notes.json');
  this.$('#export-mastery').onclick=()=>downloadRecovery(this.progress,'prism-mastery.json');
  this.$('#import-mastery').onclick=()=>this.$('#import-mastery-file').click();
  this.$('#import-mastery-file').onchange=async()=>{const file=this.$('#import-mastery-file').files[0];this.$('#import-mastery-file').value='';if(!file)return;try{if(file.size>250000)throw Error('Mastery file is too large.');const raw=JSON.parse(await file.text());if(raw?.version!==1||!raw.worlds||typeof raw.worlds!=='object'||Array.isArray(raw.worlds))throw Error('Choose a Prism mastery export.');const imported=readMastery(raw);for(const [id,incoming]of Object.entries(imported.worlds)){const previous=this.progress.worlds[id];if(previous){for(const key of Object.keys(incoming.medals))incoming.medals[key]||=previous.medals[key];incoming.bestScore=Math.max(incoming.bestScore,previous.bestScore);incoming.bestTime=incoming.bestTime===null?previous.bestTime:previous.bestTime===null?incoming.bestTime:Math.min(incoming.bestTime,previous.bestTime);}this.progress.worlds[id]=incoming;}this.save();this.syncCosmetics();this.renderCollection();}catch(error){this.$('#mastery-save-status').textContent=error.message||'Could not import this mastery file.';}};
  this.$('#mastery-dialog').addEventListener('close',()=>previewMusic(null));
  this.$('#precision-catch').onclick=()=>{if(game().engagement.arm())this.renderLive();};
  this.$('#aim-angle').oninput=e=>{game().engagement.aim(Number(e.target.value));this.renderLive();};
  this.$('#mastery-retry').onclick=()=>practice(game().level,game().seed);
  this.$('#world-challenge-share').onclick=()=>share(this.challengeData());
  this.$('#play-shared-challenge').onclick=()=>{if(this.challenge&&!this.challenge.invalid)practice(this.challenge.world,this.challenge.seed);};
  for(const button of document.querySelectorAll('[data-play-feedback]'))button.onclick=()=>{this.feedback.push({world:game().world.id,note:button.dataset.playFeedback});this.feedback=this.feedback.slice(-30);const saved=storage.set('play-feedback',this.feedback);this.$('#feedback-status').textContent=saved?'Saved in your play notes.':'Saving is unavailable. Export your play notes to keep this feedback.';};
  this.$('#play-notes').checked=settings.playNotes===true;this.$('#play-notes').onchange=e=>{settings.playNotes=e.target.checked;storage.set('settings',settings);};
  if(this.challenge){this.$('#shared-challenge').hidden=false;this.$('#shared-challenge-copy').textContent=this.challenge.invalid?'This challenge uses a different or invalid ruleset. Start a fresh Adventure or choose a world.':WORLDS[this.challenge.world].name+' · '+(this.challenge.score?this.challenge.score.toLocaleString()+' points to beat':'A shared precision challenge')+(this.challenge.seconds?' · '+seconds(this.challenge.seconds):'');this.$('#play-shared-challenge').hidden=!!this.challenge.invalid;}
  this.syncCosmetics();this.renderCollection();
 }
 save(){const saved=this.storage.set('mastery',this.progress);this.$('#mastery-save-status').textContent=saved?'':'Progress saving is unavailable. Export your mastery to keep this session’s achievements.';return saved;}
 complete(){
  const g=this.game();if(!g.engagement.profile||!g.engagement.report)return;
  const before=new Set(unlockedCosmetics(this.progress).map(c=>c.id));this.lastMedals=awardMastery(this.progress,g.engagement.report);
  if(this.settings.playNotes)observeRun(this.progress,g,true);this.save();this.syncCosmetics();this.renderCollection();
  const unlocked=unlockedCosmetics(this.progress).filter(c=>!before.has(c.id));
  text(this.$('#cut-mastery'),(this.lastMedals.newMedals.length?'Medals earned: '+medalNames(this.lastMedals.newMedals)+'. ':'')+(this.lastMedals.newBestTime?'A new personal clear time. ':'')+this.lastMedals.goal+(unlocked.length?' Unlocked: '+unlocked.map(c=>c.name).join(', ')+'.':''));
 }
 observe(completed=false){if(!this.settings.playNotes)return;observeRun(this.progress,this.game(),completed);this.save();}
 renderLive(){
  const g=this.game(),e=g.engagement,p=e.profile,record=this.progress.worlds[g.world.id];
  this.$('#engagement-strip').hidden=!p;this.$('#engagement-strip').dataset.encounter=String(!!e.encounter);this.$('#aim-controls').hidden=!p||!g.balls.some(b=>b.held&&b.aimable);
  if(!p)return;
  const personal=record?.bestTime?' · Personal world best '+record.bestScore.toLocaleString()+' points / '+seconds(record.bestTime):'';
  text(this.$('#mastery-live'),nextGoal(this.progress,g.world.id)+personal);
  text(this.$('#encounter-live'),e.encounter?e.encounter.title+' · '+e.encounterState+(g.state==='ready'?'. '+e.encounter.instruction:''):(e.recovery?'Breathing space · moving barriers ease briefly.':p.skillLabel));
  text(this.$('#synergy-live'),SYNERGIES[e.synergy]||'Paired power-ups: catch one to choose your strategy.');
  this.$('#precision-catch').hidden=!['ready','armed'].includes(e.finisher)||g.balls.some(b=>b.held);this.$('#precision-catch').disabled=e.finisher!=='ready';text(this.$('#precision-catch'),e.finisher==='armed'?'Precision catch armed':'Use precision catch');
  const ball=g.balls.find(b=>b.held&&b.aimable);if(ball){const angle=Math.round(Math.atan2(ball.holdVX||0,Math.abs(ball.holdVY)||1)*180/Math.PI);if(document.activeElement!==this.$('#aim-angle'))this.$('#aim-angle').value=String(angle);text(this.$('#aim-value'),angle+'°');}
 }
 renderResult(){
  const g=this.game(),p=g.engagement.profile;this.$('#result-mastery').hidden=!p;this.$('#mastery-retry').hidden=!p;this.$('#world-challenge-share').hidden=!p;
  if(!p)return;
  const report=g.engagement.report,record=this.progress.worlds[g.world.id];
  const challenge=this.challenge&&!this.challenge.invalid&&this.challenge.world===g.level&&this.challenge.seed===(g.seed>>>0)?this.challenge:null;
  const comparison=challenge&&report?(report.score>challenge.score?' Shared score beaten!':report.score===challenge.score?' Shared score matched.':(challenge.score-report.score).toLocaleString()+' points from the shared target.')+(challenge.seconds?' '+(report.seconds<challenge.seconds?'Faster than the shared clear time.':Math.ceil(report.seconds-challenge.seconds)+' seconds from the shared clear time.'):''):'';
  text(this.$('#result-mastery'),(report?'World clear: '+seconds(report.seconds)+' · '+report.score.toLocaleString()+' points. ':'')+nextGoal(this.progress,g.world.id,report)+(record?.bestScore?' Personal world best: '+record.bestScore.toLocaleString()+'.':'')+comparison);
  this.$('#feedback-status').textContent='Optional feedback stays in your play notes. Export it from Mastery & rewards.';
 }
 syncCosmetics(){
  const unlocked=new Set(unlockedCosmetics(this.progress).map(c=>c.id));
  for(const [selector,key,kind,fallback]of [['#paddle-finish','paddleFinish','finish','original'],['#ball-trail','ballTrail','trail','none']]){
   const select=this.$(selector);select.replaceChildren();for(const item of ENGAGEMENT.cosmetics.filter(c=>c.kind===kind)){const option=new Option(item.name+(unlocked.has(item.id)?'':' · '+item.count+' '+item.requirement),item.id);option.disabled=!unlocked.has(item.id);select.add(option);}
   if(!unlocked.has(this.settings[key]))this.settings[key]=fallback;select.value=this.settings[key];select.disabled=kind==='finish'&&this.settings.classicMode;select.title=select.disabled?'Classic mode keeps the original paddle.':'';select.onchange=()=>{if(unlocked.has(select.value)){this.settings[key]=select.value;this.storage.set('settings',this.settings);}};
  }
 }
 renderCollection(){
  const c=counts(this.progress);text(this.$('#mastery-summary'),c.medals+' / 64 medals · '+c.restored+' / 16 worlds restored');
  const grid=this.$('#mastery-grid');grid.replaceChildren();
  for(const [index,w]of WORLDS.entries()){
   const p=ENGAGEMENT.profiles[w.id],record=this.progress.worlds[w.id],card=document.createElement('article'),title=document.createElement('h3'),badges=document.createElement('p'),goal=document.createElement('p'),play=document.createElement('button');card.className='mastery-world';title.textContent=String(index+1).padStart(2,'0')+' · '+w.name;
   badges.textContent=['restored','swift','flawless','skill'].map(k=>(record?.medals[k]?'✓ ':'○ ')+({restored:'Restored',swift:'Swift',flawless:'Flawless',skill:'Skilled'}[k])).join(' · ');goal.textContent='Swift: '+seconds(p.swift)+' · '+p.skillLabel+(record?.bestTime?' · Best '+seconds(record.bestTime):'');play.className='button secondary';play.textContent='Master this world';play.onclick=()=>this.practice(index,8399);card.append(title,badges,goal,play);
   if(record?.medals.restored){const details=document.createElement('details'),summary=document.createElement('summary'),image=document.createElement('img'),listen=document.createElement('button');summary.textContent='Restored artwork & soundtrack';image.src='/assets/world-preview-'+String(index+1).padStart(2,'0')+'.png';image.alt=w.name+' restored';image.loading='lazy';image.width=800;image.height=420;listen.className='button secondary';listen.textContent='Listen to '+w.name;listen.onclick=()=>{this.previewMusic(index);text(this.$('#collection-music-status'),'Playing '+w.name+'. Close this collection to stop.');};details.append(summary,image,listen);card.append(details);}
   grid.append(card);
  }
  const rewards=this.$('#reward-list');rewards.replaceChildren();const unlocked=new Set(unlockedCosmetics(this.progress).map(v=>v.id));for(const item of ENGAGEMENT.cosmetics){const li=document.createElement('li');li.textContent=item.name+' · '+(unlocked.has(item.id)?'Unlocked':item.count+' '+item.requirement+' needed');rewards.append(li);}
 }
 challengeData(){
  const g=this.game(),r=g.engagement.report,url=new URL(document.querySelector('link[rel="canonical"]').href),score=r?.score||0,time=r?.seconds||0;
  for(const [key,value]of Object.entries({challenge:g.world.id,seed:g.seed>>>0,ruleset:g.ruleset,target:score,seconds:Math.ceil(time)}))url.searchParams.set(key,String(value));
  return {kind:'challenge',mode:'practice',title:'Prism Breaker · '+g.world.name,text:'Try '+g.world.name+' on the same seed and rules.'+(score?' My world score: '+score.toLocaleString()+' points.':'')+(time?' Clear time: '+seconds(time)+'.':''),url:url.href,boardLabel:'Shared world challenge',day:'all',player:'A challenge for you',score:score||null,world:g.level+1,seconds:Math.ceil(time),rank:null,badge:'SAME WORLD · SAME SEED'};
 }
}
