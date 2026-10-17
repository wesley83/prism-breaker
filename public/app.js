import {RenderClock} from './render-budget.js';
import {advanceScene} from './scene-playback.js';
import {checkpointLevel,compatibleRuleset,LEGACY_RULESET_REVISION} from './world-identity.js';
import {THEMES} from './world-schema.js';
import {WORLDS,RULESET_REVISION,POWERS,daySeed,dailyWorld,WORLD_COUNT,LAST_WORLD,formationCount} from './levels.js?v=3';
import {BRICK_GUIDE,brickMarkerSVG} from './brick-labels.js?v=2';
import {Game,speedBonus,isValidSnapshot} from './engine.js?v=10';
import {worldSlug,parseWorld,worldHTML,formationCatalog,normalizeWorld,originalWorld} from './world-format.js';
import {attachBrickDOM} from './brick-events.js';
import {SharePreview,formatShareDate} from './sharing.js?v=2';
import {Sound} from './audio.js?v=5';
import {TRACKS} from './music.js';
import {CINEMATICS} from './cinematic-score.js?v=3';
import {utcDay,rankedScores as rankScores,scoreAge,scoreAgeBand,topFinish,activeScores,scoreExpiry,SCORE_LIFETIME} from './leaderboard.js?v=4';
import {offlineStore,ScoreOutbox} from './offline.js?v=2';
import {setupOfflinePlay} from './pwa.js?v=4';
import {setupGameDisplay} from './display.js';
import {setupGraphicsRecovery} from './graphics-recovery.js';
import {DAILY_DURATION,DAILY_RECORD_DURATION} from './daily-score.js?v=3';
import {CHAMPION_DURATION} from './cinematic-score.js?v=3';
import {VICTORY_TRACKS} from './victory-music.js';
const elements=new Map(),$=s=>{if(!/^#[\w-]+$/.test(s))return document.querySelector(s);if(!elements.has(s))elements.set(s,document.querySelector(s));return elements.get(s);},all=s=>[...document.querySelectorAll(s)];
function rankedScores(scores,mode,day=utcDay()){return rankScores(scores,mode,day,boardNow());}
const storage={get(key,fallback=null){try{const value=JSON.parse(localStorage.getItem('prism.'+key))??fallback;if(key==='save'&&value){if(!isValidSnapshot(value.game))return fallback;return {...value,game:{...value.game,level:checkpointLevel(value.game)}};}return value;}catch{return fallback;}},set(key,value){try{localStorage.setItem('prism.'+key,JSON.stringify(value));}catch{}},remove(key){try{localStorage.removeItem('prism.'+key);}catch{}}};
const settings={music:.35,effects:.7,muted:false,interfaceTheme:'system',classicMode:false,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,lowEffects:matchMedia('(pointer:coarse)').matches,...storage.get('settings',{})};
const icon=name=>'<svg class="icon" aria-hidden="true"><use href="/assets/icons.svg?v=4#'+name+'"/></svg>';
const powerIcons={wide:'arrows-horizontal',multi:'circles',sticky:'magnet',laser:'bolt',pierce:'diamond',slow:'clock',shield:'shield',life:'heart'};
const powerDescriptions={wide:'A wider paddle for 18 seconds. Works with sticky or laser.',multi:'Three balls. Keep one in play.',sticky:'Holds each ball where it lands for 16 seconds. Launch with space or a tap.',laser:'Fire automatically for 14 seconds.',pierce:'Cut through bricks for 12 seconds.',slow:'Slower balls for 14 seconds.',shield:'Saves one ball at the bottom.',life:'One extra life, up to nine.'};
function brickDescription(brick){return settings.classicMode?brick.description.replace('Cracks spread after each hit.','Damaged bricks become dimmer.'):brick.description;}
function applyTheme(){document.documentElement.dataset.theme=settings.interfaceTheme;document.documentElement.dataset.reducedMotion=String(settings.reducedMotion);document.documentElement.dataset.classic=String(!!settings.classicMode);const armorCopy=$('#brick-guide')?.querySelector('[data-brick-kind="armor"] p');if(armorCopy)armorCopy.textContent=brickDescription(BRICK_GUIDE.find(brick=>brick.kind==='armor'));}
applyTheme();
const sound=new Sound(settings);let cutReady=true,cutGeneration=0;let game=new Game(),stage,view='home',accumulator=0,cutTime=0,scenePaused=false,toastUntil=0,modalResume=null,lastHud='',leaderMode='campaign',scoreLoading=false,runDay='',endResult=null;
const sharePreview=$('#share-dialog')?new SharePreview($('#share-dialog')):{open:()=>copyLeaderboardLink()};
const keys=new Set();let best=storage.get('best',0),highest=storage.get('highest',0);
let sharedScores=null,scoresRequest=null,scoresUnavailable=false,scoresFetchedAt=0;
let boardDate=utcDay(),rolloverTimer,clockOffset=0;
const boardNow=()=>Date.now()+clockOffset;
const currentDay=()=>utcDay(boardNow());
const gameDisplay=setupGameDisplay({isPlaying:()=>view!=='home',onExit:()=>{if(view==='game'&&['playing','ready'].includes(game.state)&&!$('dialog[open]'))openDialog('#pause-dialog');},onError:()=>toast('Fullscreen is unavailable. The game still fills the available phone screen.')});
const offlinePlay=setupOfflinePlay({isSafeToUpdate:()=>view==='home',openHelp:()=>openDialog('#install-dialog')});
const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const firefoxAndroid=/Android/i.test(navigator.userAgent)&&/Firefox\//i.test(navigator.userAgent);
$('#install-instructions').textContent=ios?'Open the browser’s Share menu, choose Add to Home Screen, then Add. Launch Prism Breaker from its new icon.':firefoxAndroid?'Open Firefox’s three-dot menu and choose Install or Add app to Home screen, then add the icon. Launch Prism Breaker from its new home-screen icon.':/Android/i.test(navigator.userAgent)?'Open your browser’s menu and choose Install app or Add to Home screen. Launch Prism Breaker from its new icon.':'Use the install icon in your browser’s address bar or the Install app command in its menu. If installation is unavailable, you can still play offline in this browser after the download completes.';
async function initializeStage(){try{const {Stage}=await import('./scene.js?v=15');const readyStage=new Stage($('#game-canvas'),settings);await readyStage.prepare(game);stage=readyStage;all('#play,#resume,#daily,.world-card').forEach(button=>button.disabled=false);$('#arena-status').hidden=true;$('#stage').setAttribute('aria-busy','false');}catch(error){$('#arena-status').hidden=true;$('#stage').setAttribute('aria-busy','false');$('#error').hidden=false;$('#error-text').textContent='The 3D arena could not load. Check your connection, enable hardware acceleration, or try a current Chrome, Edge, Firefox or Safari browser.';console.error('WebGL initialization failed:',error);}}
game.emit=handleEvent;
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');toastUntil=performance.now()+2600;}
function updateWorldCards(){
 const checkpoint=storage.get('save'),activeWorld=view==='home'?Math.min(LAST_WORLD,(checkpoint?.game.level??0)+(checkpoint?.pendingNext?1:0)):game.level;
 $('#world-editor-link').href='/editor/'+worldSlug(activeWorld);
 all('.world-card').forEach(card=>{const index=Number(card.dataset.world),current=index===activeWorld,completed=index<highest;card.classList.toggle('current',current);card.querySelector('.world-current').hidden=!current;card.querySelector('.world-completed').hidden=!completed||current;if(current)card.setAttribute('aria-current','step');else card.removeAttribute('aria-current');});
 $('#journey-summary').textContent=highest?'Adventure: '+highest+' of '+WORLD_COUNT+' worlds completed.':'Your adventure starts in Prism Garden. Completed worlds will be marked here.';
}
function updateWorld(){
 const w=game.world||WORLDS[game.level];document.documentElement.style.setProperty('--accent',w.accent);document.documentElement.style.setProperty('--accent-dark','#'+w.accent.slice(1).match(/../g).map(v=>Math.round(parseInt(v,16)*.35).toString(16).padStart(2,'0')).join(''));$('#arena-world').textContent='World '+(game.level+1)+' of '+WORLD_COUNT;$('#music-credit').textContent=TRACKS[THEMES.indexOf(game.world.music)].title+' · '+TRACKS[THEMES.indexOf(game.world.music)].style;
 updateWorldCards();
 if(view!=='home')$('#stage-label').textContent=w.name.toUpperCase()+(game.world.formations.length>1?' · PHASE '+(game.phase+1):'');
}
let hudLives=null,hudEffects='';
function hud(){
 let remaining=0,held=0,effects='';for(const b of game.bricks)if(b.hp>0)remaining++;for(const b of game.balls)if(b.held)held++;
 for(const key in game.effects)if(game.effects[key]>0)effects+=key+Math.ceil(game.effects[key])+',';
 const signature=[game.score,game.lives,game.combo,remaining,Math.floor(game.boardElapsed),game.state,held,game.balls.length,effects,game.shield].join('|');
 if(signature===lastHud)return;lastHud=signature;
 $('#score').textContent=game.score.toLocaleString();$('#combo').textContent='×'+Math.min(5,1+Math.floor(game.combo/6));if(hudLives!==game.lives){hudLives=game.lives;$('#lives').innerHTML=game.lives<=3?icon('heart').repeat(Math.max(0,game.lives)):icon('heart')+'<span>×'+game.lives+'</span>';$('#lives').setAttribute('aria-label',game.lives+' '+(game.lives===1?'life':'lives'));}updateChase();
 $('#arena-bricks').textContent=remaining+' bricks left';
 $('#arena-speed').textContent='Speed +'+speedBonus(game.boardElapsed).toLocaleString();
 $('#launch').hidden=!(view==='game'&&['ready','playing'].includes(game.state)&&game.balls.some(b=>b.held));
 updatePlayTip(held);
 const effectSignature=effects+game.shield;if(hudEffects!==effectSignature){hudEffects=effectSignature;$('#effects').replaceChildren();for(const key in game.effects){const value=game.effects[key];if(value>0){const el=document.createElement('span');el.className='effect';el.style.color=POWERS[key].color;el.innerHTML=icon(powerIcons[key])+POWERS[key].name+' · '+Math.ceil(value)+'s';$('#effects').append(el);}}if(game.shield){const el=document.createElement('span');el.className='effect';el.innerHTML=icon('shield')+'Safety shield ready';$('#effects').append(el);}}
}
function persist(pendingNext=false){if(game.mode==='campaign'&&game.lives>0){try{const old=JSON.parse(localStorage.getItem('prism.save')||'null');if(old&&!isValidSnapshot(old.game))localStorage.setItem('prism.save-recovery',JSON.stringify(old));}catch{}storage.set('save',{pendingNext,game:game.snapshot()});}}
function updatePersonalBest(){
 $('#best').textContent=best?best.toLocaleString():'No runs yet';
 $('#result-best').textContent='Your personal best: '+(best?best.toLocaleString():'No runs yet');
}
function updateBest(){if(game.mode==='practice')return;if(game.score>best){best=game.score;storage.set('best',best);}updatePersonalBest();}
function updatePlayTip(held){
 const tip=$('#play-tip');tip.hidden=$('#launch').hidden;
 if(tip.hidden)return;
 let text=game.world.note;
 if(game.effects.sticky>0)text=game.effects.wide>0?'Wide + sticky: catches beyond the normal paddle launch when it shrinks.':'Sticky paddle: move to aim, then launch from the catch point.';
 else if(game.effects.laser>0)text='Laser paddle: aim underneath bricks. The lasers fire automatically.';
 else if(game.effects.pierce>0)text='Piercing ball: launch through clusters while the power-up is active.';
 else if(game.effects.wide>0)text='Wide paddle: use the extra reach to set up your next shot.';
 else if(game.effects.slow>0)text='Slow motion: use the extra time to line up your paddle.';
 else if(game.shield)text='Safety shield: one missed ball will bounce back into play.';
 else if(game.balls.length>1)text='Multiball: keep at least one ball in play.';
 if(held>1)text+=' Launch releases all '+held+' held balls.';
 tip.textContent=text;
}
function handleEvent(e){
 sound.event(e);stage?.event(e);
 if(e.type==='level'){stage?.reset();updateWorld();lastHud='';}
 if(e.type==='power')toast(POWERS[e.kind].name+(e.points?' · +'+e.points+' points':''));
 if(e.type==='gate')toast('Gate open. Find your angle.');
 if(e.type==='save')toast('Saved by the shield!');
 if(e.type==='life'){toast(game.lives+' '+(game.lives===1?'life':'lives')+' left. You’ve got this.');persist();}
 if(e.type==='phase'){bindWorldDOM();toast('Formation cleared · +'+e.clearPoints+' clear · +'+e.speedPoints+' speed');persist();}
 if(e.type==='clear'){
   updateBest();if(game.mode==='campaign'){highest=Math.max(highest,game.level+1);storage.set('highest',highest);if(game.level<LAST_WORLD)persist(true);else storage.remove('save');}
   beginCut();
 }
 if(e.type==='over')finish(false);
}
function closeDialogs(){all('dialog[open]').forEach(d=>d.close());modalResume=null;}
let beginGeneration=0,detachWorldDOM,activePracticeWorld;
function bindWorldDOM(){
 detachWorldDOM?.();
 const source=game.world;
 const root=new DOMParser().parseFromString(worldHTML(source),'text/html').querySelector('#world');root.dataset.activePhase=String(game.phase);
 for(const brick of game.bricks){const node=root.querySelector('#f'+game.phase+'-brick-'+brick.id);if(node){node.dataset.remainingHitpoints=String(brick.hp);node.classList.toggle('destroyed',brick.hp===0);}}
 let model=$('#game-world-model');if(!model){model=document.createElement('div');model.id='game-world-model';model.hidden=true;document.body.append(model);}model.replaceChildren(root);
 detachWorldDOM=attachBrickDOM(game,root);
}
async function begin(mode='campaign',level=0){
 if(!stage||graphicsRecovery.blocked)return;closeDialogs();view=mode==='practice'?'loading':'game';gameDisplay.enterForPlay();sound.unlock();runDay=currentDay();let seed=mode==='daily'?daySeed(runDay):8399;
 const generation=++beginGeneration;detachWorldDOM?.();
 let practiceData;
 if(mode==='practice'){all('#play,#resume,#daily,.world-card').forEach(b=>b.disabled=true);toast('Loading the shared Practice world…');practiceData=await loadPracticeWorld(level);all('#play,#resume,#daily,.world-card').forEach(b=>b.disabled=false);if(generation!==beginGeneration)return;activePracticeWorld=practiceData?.world;game.catalog=practiceData?formationCatalog(practiceData.world):new Map();view='game';}
 stage.reset();
 if(mode==='daily')level=dailyWorld(runDay);game.start(mode,level,seed);accumulator=0;saveTimer=0;offlinePlay.refresh();showGame();persist();
}
function showGame(){
 bindWorldDOM();
 offlinePlay.refresh();gameDisplay.refresh();$('#record-celebration').hidden=true;$('#home').hidden=true;$('#stage').classList.remove('home-mode','cinematic-mode');$('#hud').hidden=false;$('#arena-progress').hidden=false;$('#cutscene').hidden=true;$('#mode-label').textContent=game.mode==='daily'?runDay+' · UTC':game.mode==='practice'?'PRACTICE':'ADVENTURE';updateWorld();hud();updateTopScore();refreshTopScore();$('#game-canvas').focus({preventScroll:true});
}
function home(){closeDialogs();$('#record-celebration').hidden=true;$('#stage').classList.remove('cinematic-mode');view='home';gameDisplay.leave();offlinePlay.refresh();updatePersonalBest();game.start('campaign',0,8399);$('#home').hidden=false;$('#stage').classList.add('home-mode');$('#hud').hidden=true;$('#arena-progress').hidden=true;$('#launch').hidden=true;$('#play-tip').hidden=true;$('#cutscene').hidden=true;$('#effects').replaceChildren();$('#stage-label').textContent='Sixteen worlds to break through';$('#mode-label').textContent='3D ARCADE';const saved=storage.get('save');$('#resume').hidden=!saved;for(const button of [$('#play'),$('#daily')]){button.classList.toggle('primary',!saved);button.classList.toggle('secondary',!!saved);}if(saved)$('#resume-detail').textContent=(WORLDS[saved.game.level]?.name||'Adventure')+' · '+Number(saved.game.score||0).toLocaleString()+' points';const day=currentDay();$('#daily-detail').textContent=WORLDS[dailyWorld(day)].name+' · '+day+' UTC';updateWorld();lastHud='';hud();}
function prepareCut(mode){const generation=++cutGeneration;cutReady=false;stage.prepareCut(game,mode).catch(error=>console.warn('Cinematic warmup:',error)).finally(()=>{if(generation===cutGeneration)cutReady=true;});}
function resetSceneControls(){scenePaused=false;}
function toggleScenePause(){scenePaused=!scenePaused;}
function beginCut(){
 resetSceneControls();
 prepareCut('cut');
 view='cut';cutTime=0;lastHud='';hud();$('#stage').classList.add('cinematic-mode');$('#launch').hidden=true;$('#effects').replaceChildren();hudEffects='';$('#hud').hidden=true;$('#arena-progress').hidden=true;$('#cutscene').hidden=false;
 $('#cut-kicker').textContent=game.level===LAST_WORLD?'SIXTEEN WORLDS · RESTORED':'WORLD '+String(game.level+1).padStart(2,'0')+' · RESTORED';
 $('#cut-title').textContent=game.level===LAST_WORLD?'You brought the dawn.':game.world.name+' restored.';$('#cut-story').textContent=game.world.story;const hasNext=game.mode==='campaign'&&game.level<LAST_WORLD;$('#cut-next').textContent=hasNext?'Next: '+WORLDS[game.level+1].name:'';$('#skip-cut').textContent=hasNext?'Next world':'See your score';
 $('#cut-bonus').textContent=game.lastClear?'Speed bonus +'+game.lastClear.speedPoints.toLocaleString()+' · Clear bonus +'+game.lastClear.clearPoints.toLocaleString():'';$('#cut-bonus').hidden=!game.lastClear;
 if(game.mode==='daily'){$('#cut-kicker').textContent='DAILY CHALLENGE · '+runDay+' UTC';$('#cut-title').textContent='You owned the day.';$('#cut-story').textContent='One shared challenge. One brilliant finish. The daily prism is restored.';$('#cut-next').textContent='Your score: '+game.score.toLocaleString();}
 $('#cut-title').focus({preventScroll:true});
}
function finishCut(){if(view!=='cut')return;$('#stage').classList.remove('cinematic-mode');$('#cutscene').hidden=true;if(game.next()){view='game';showGame();persist();}else finish(true);}
function finish(won){
 $('#player-name').disabled=false;
 view='result';$('#play-tip').hidden=true;game.state=won?'won':'over';updateBest();if(game.mode==='campaign')storage.remove('save');$('#launch').hidden=true;$('#cutscene').hidden=true;$('#arena-progress').hidden=true;
 endResult={id:game.runId,ruleset:RULESET_REVISION,won,score:game.score,level:game.level+1,mode:game.mode,day:game.mode==='daily'?runDay:'all',seconds:Math.max(1,Math.round(game.elapsed))};
 $('#result-kicker').textContent=won?'WORLD COMPLETE':'RUN COMPLETE';$('#result-title').textContent=won?(game.mode==='campaign'?'You broke through.':'World complete.'):'One more try?';$('#result-description').textContent=(won?'Beautifully played. ':'You reached '+game.world.name+'. ')+(game.mode==='practice'?'Try another world or start an adventure.':'Save your score to join the shared leaderboard.');$('#result-score').textContent=game.score.toLocaleString();$('#score-form').hidden=game.mode==='practice';$('#player-name').value=storage.get('name','');$('#submit-score').disabled=false;$('#submit-score').textContent='Save score';$('#submit-status').textContent='2-16 letters, numbers, spaces, dashes or underscores.';$('#result-dialog').showModal();
 $('#result-best').hidden=game.mode==='practice';$('#result-dialog').classList.remove('record-result');$('#record-badge').hidden=true;
 $('#result-bonuses').textContent='Speed bonuses +'+game.bonusTotals.speed.toLocaleString()+' · Power-ups +'+game.bonusTotals.pickups.toLocaleString();
 if(game.mode==='daily'&&runDay!==currentDay())$('#result-description').textContent='This run belongs to '+runDay+' UTC. You can save it, but the current Daily Challenge board has reset for '+currentDay()+'.';
 if(game.mode!=='practice')checkTopFinish(endResult);
}
async function checkTopFinish(result,confirmedScores){
 try{const scores=confirmedScores??await fetchScores();if(endResult!==result||view!=='result'||!$('#result-dialog').open||all('dialog[open]').length!==1||!topFinish(result,scores,currentDay(),boardNow()))return;
  result.record=true;result.tied=activeScores(scores,boardNow()).filter(r=>compatibleRuleset(r.ruleset)).some(r=>r.runKey!==result.id&&r.mode===result.mode&&(r.mode!=='daily'||r.day===result.day)&&Number(r.score)===result.score);
  $('#result-dialog').close();view='champion';cutTime=0;resetSceneControls();prepareCut('champion');$('#stage').classList.add('cinematic-mode');$('#hud').hidden=true;$('#record-celebration').hidden=false;
  $('#record-overline').textContent=result.mode==='daily'?'DAILY CHALLENGE CHAMPION':'THE HIGH-SCORE CLUB';$('#record-heading').textContent=result.mode==='daily'?(result.tied?'Daily top score reached.':'The crown of the day.'):(result.tied?'Top score reached.':'A new champion.');$('#record-total').textContent=result.score.toLocaleString();$('#record-message').textContent=(result.mode==='daily'?'Daily Challenge · '+result.day+' UTC':result.won?'Adventure complete':'Adventure record')+' · Save your name to claim your place.';
  const victory=VICTORY_TRACKS[result.mode];$('#music-credit').textContent=victory.title+' · '+victory.style;
  sound.event({type:'champion'});setRecordResult(result);$('#claim-record').textContent=result.savedPlayer?'View your score':'Save your name';if(result.savedPlayer)$('#record-message').textContent=(result.mode==='daily'?'Daily Challenge · '+formatShareDate(result.day):'Adventure record')+' · Your score is on the shared leaderboard.';$('#record-heading').focus({preventScroll:true});
 }catch{/* A result is still available when the shared board cannot be checked. */}
}
function setRecordResult(result){
 const board=result.mode==='daily'?'Daily Challenge':'Adventure';
 $('#result-dialog').classList.add('record-result');$('#record-badge').hidden=false;$('#record-badge').textContent=result.tied?'TOP SCORE TIED':'NEW HIGH SCORE';$('#result-kicker').textContent=result.mode==='daily'?'DAILY CHALLENGE CHAMPION':'THE HIGH-SCORE CLUB';$('#result-title').textContent=result.tied?'You reached the top.':result.mode==='daily'?'You won the daily crown.':'You took the crown.';$('#result-description').textContent=(result.tied?'You matched the top '+board+' score. ':result.won?board+' complete with a new top score. ':'New '+board+' top score. ')+'Save your name to join the leaderboard.';
 if(result.savedPlayer){$('#record-badge').textContent='TOP SCORE SAVED';$('#result-description').textContent='Your '+result.score.toLocaleString()+'-point finish is saved on the '+board+' leaderboard.';}
}
function finishCelebration(){if(view!=='champion')return;view='result';$('#record-celebration').hidden=true;$('#stage').classList.remove('cinematic-mode');$('#result-dialog').showModal();}
$('#claim-record').onclick=finishCelebration;
function openDialog(id){
 $('#play-tip').hidden=true;if(id==='#worlds-dialog')updateWorldCards();
 if(id==='#pause-dialog'){$('#pause-description').textContent=game.mode==='campaign'?game.world.name+' · '+game.score.toLocaleString()+' points. Your checkpoint is saved.':'This '+(game.mode==='daily'?'daily challenge':'practice run')+' is paused. Returning to the start screen ends this run.';$('#quit').textContent='Back to start screen';}
 if(view==='game'&&['playing','ready'].includes(game.state)){modalResume=game.state;game.state='paused';persist();$('#launch').hidden=true;}
 sound.update(false,THEMES.indexOf(game.world.music));
 $(id).showModal();
}
all('dialog').forEach(d=>{const title=d.querySelector('h2');if(title&&!d.hasAttribute('aria-labelledby')){if(!title.id)title.id=d.id+'-title';d.setAttribute('aria-labelledby',title.id);}d.addEventListener('close',()=>{if(modalResume&&view==='game'&&!all('dialog[open]').length&&!graphicsRecovery.blocked){game.state=modalResume;modalResume=null;keys.clear();lastHud='';hud();$('#game-canvas').focus({preventScroll:true});}});d.addEventListener('click',e=>{if(e.target===d&&d.id!=='result-dialog'){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});});
$('#result-dialog').addEventListener('cancel',e=>{e.preventDefault();home();});all('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
$('#play').onclick=()=>{const saved=storage.get('save');if(saved){$('#new-run-detail').textContent='Your checkpoint in '+(WORLDS[saved.game.level]?.name||'Adventure')+' will be replaced when the new run starts.';openDialog('#new-run-dialog');}else begin();};$('#confirm-new-run').onclick=()=>begin();$('#daily').onclick=()=>begin('daily');$('#resume').onclick=()=>{const saved=storage.get('save');if(!saved||!game.restore(saved.game)){toast('This checkpoint needs its original game version. It has been kept; you can start a new adventure.');home();return;}view='game';gameDisplay.enterForPlay();sound.unlock();showGame();stage?.reset();if(saved.pendingNext){game.state='cleared';beginCut();}};
$('#launch').onclick=()=>{sound.unlock();game.launch();lastHud='';hud();};$('#pause').onclick=()=>openDialog('#pause-dialog');$('#unpause').onclick=()=>$('#pause-dialog').close();$('#quit').onclick=()=>{persist();home();};$('#skip-cut').onclick=finishCut;
$('#play-again').onclick=()=>begin(endResult.mode,endResult.mode==='practice'?endResult.level-1:0);$('#result-home').onclick=home;
$('#settings-open').onclick=()=>openDialog('#settings-dialog');$('#pause-settings').onclick=()=>openDialog('#settings-dialog');$('#help-open').onclick=()=>openDialog('#help-dialog');$('#worlds-menu').onclick=()=>openDialog('#worlds-dialog');
Object.entries(POWERS).forEach(([key,power])=>{const item=document.createElement('div');item.innerHTML='<span class="power-symbol" style="color:'+power.color+'">'+icon(powerIcons[key])+'</span><div><strong>'+power.name+'</strong><p>'+powerDescriptions[key]+'</p></div>';$('#power-guide').append(item);});
BRICK_GUIDE.forEach(brick=>{const item=document.createElement('div'),counts=brick.kind==='armor'?'<div class="brick-hit-key">'+['3','2','1'].map(mark=>'<span>'+brickMarkerSVG(mark)+mark+' hit'+(mark==='1'?'':'s')+'</span>').join('')+'</div>':'';item.dataset.brickKind=brick.kind;item.innerHTML='<span class="brick-sample" aria-hidden="true">'+brickMarkerSVG(brick.mark)+'</span><div><strong>'+brick.name+'</strong><p>'+brickDescription(brick)+'</p>'+counts+'</div>';$('#brick-guide').append(item);});
WORLDS.forEach((w,i)=>{const number=String(i+1).padStart(2,'0'),card=document.createElement('button');card.className='world-card';card.dataset.world=i;card.innerHTML='<img class="world-preview" src="/assets/world-preview-'+number+'.png" alt="" aria-hidden="true" width="800" height="420" loading="lazy" decoding="async"><span class="world-card-copy"><span class="world-card-meta"><small>WORLD '+number+'</small><span class="world-current" hidden>Current</span><span class="world-completed" hidden>Completed</span></span><strong>'+escapeHTML(w.name)+'</strong><span class="world-mechanic">'+escapeHTML(w.mechanic)+'</span></span>';card.onclick=()=>begin('practice',i);$('#world-grid').append(card);});
updateWorldCards();
function saveSettings(){storage.set('settings',settings);applyTheme();$('#sound-toggle').innerHTML=icon(settings.muted?'volume-off':'volume');$('#sound-toggle').setAttribute('aria-label',settings.muted?'Unmute sound':'Mute sound');$('#sound-toggle').title=settings.muted?'Unmute sound':'Mute sound';}
$('#interface-theme').value=settings.interfaceTheme;$('#interface-theme').onchange=e=>{settings.interfaceTheme=e.target.value;saveSettings();};
$('#sound-toggle').onclick=()=>{settings.muted=!settings.muted;sound.unlock();saveSettings();};for(const [id,key]of [['music-volume','music'],['effects-volume','effects']]){$('#'+id).value=settings[key]*100;$('#'+id).oninput=e=>{settings[key]=Number(e.target.value)/100;sound.unlock();saveSettings();};}
for(const [id,key]of [['reduced-motion','reducedMotion'],['low-effects','lowEffects'],['classic-mode','classicMode']]){$('#'+id).checked=settings[key];$('#'+id).onchange=async e=>{settings[key]=e.target.checked;saveSettings();if(stage&&key==='lowEffects'){const input=e.target;input.disabled=true;stage.configureQuality();try{await stage.prepare(game);}finally{input.disabled=false;}}};}
$('#reload').onclick=()=>location.reload();
const canvas=$('#game-canvas');let dragging=false;
const graphicsRecovery=setupGraphicsRecovery(canvas,{
 pause(){keys.clear();dragging=false;accumulator=0;if(view==='game'&&['playing','ready'].includes(game.state))openDialog('#pause-dialog');sound.update(false,THEMES.indexOf(game.world.music));},
 async restore(){if(!stage)throw Error('Arena not initialized');stage.preparedModes?.clear();await stage.prepare(game);stage.resize();},
 onStatus(status){const ready=status==='ready';$('#error').hidden=ready;$('#unpause').disabled=!ready;
  if(ready){if(view==='game'&&game.state==='paused'&&!$('dialog[open]'))openDialog('#pause-dialog');if($('#pause-dialog').open)$('#pause-description').textContent='Arena restored. Resume when ready.';toast('Arena restored. Resume when ready.');}
  else {$('#error-text').textContent=status==='recovering'?'Restoring the 3D arena. Your game is paused.':status==='failed'?'The 3D arena could not recover. Reload the game to try again. An unfinished Daily Challenge or Practice run will end.':'Graphics were interrupted. Your game is paused while the arena recovers. Reload if it does not return; an unfinished Daily Challenge or Practice run will end.';if($('#pause-dialog').open)$('#pause-description').textContent=$('#error-text').textContent;}
 }
});
canvas.addEventListener('pointerdown',e=>{if(view!=='game'||all('dialog[open]').length)return;dragging=true;canvas.setPointerCapture(e.pointerId);game.move(stage.screenX(e.clientX,e.clientY));sound.unlock();game.launch();});
canvas.addEventListener('pointermove',e=>{if(view==='game'&&(e.pointerType==='mouse'||dragging))game.move(stage.screenX(e.clientX,e.clientY));});canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select,button,a')||all('dialog[open]').length)return;if(view==='cut'||view==='champion'){if(['Space','Enter','KeyP','Escape'].includes(e.code)){e.preventDefault();if(!e.repeat){if(e.code==='KeyP'||e.code==='Escape')toggleScenePause();else if(view==='champion')finishCelebration();else finishCut();}}return;}if(view!=='game')return;if(['ArrowLeft','ArrowRight','Space','KeyA','KeyD','KeyP','Escape'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.code==='Space'&&!e.repeat){sound.unlock();game.launch();}if((e.code==='KeyP'||e.code==='Escape')&&!e.repeat)openDialog('#pause-dialog');});document.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>keys.clear());
document.addEventListener('visibilitychange',()=>{keys.clear();if(document.hidden&&view==='game'&&['playing','ready'].includes(game.state))openDialog('#pause-dialog');});window.addEventListener('pagehide',()=>{if(view==='game')persist();});
const ro=new ResizeObserver(()=>stage?.resize());ro.observe($('#stage'));ro.observe(canvas);
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function scoreHTML(r,name){const props={runKey:r.id,player:name,score:r.score,level:r.level,mode:r.mode,day:r.day,seconds:r.seconds,submittedAt:r.submittedAt,ruleset:r.ruleset||LEGACY_RULESET_REVISION};return '<li itemscope itemtype="https://sane-guild-8399.onpagelove.com/Run">'+Object.entries(props).map(([key,value])=>'<meta itemprop="'+key+'" content="'+escapeHTML(value)+'">').join('')+'</li>';}
async function sendQueuedScore(run,player){
 const response=await fetch('/scores.html',{method:'POST',headers:{'Content-Type':'text/html',Range:'selector=#scores'},body:scoreHTML(run,player),signal:AbortSignal.timeout(12000)});
 if(response.ok)return {submittedAt:run.submittedAt};
 if(response.status===422){
  // A previous attempt may have arrived even if its response was lost.
  if(scoresRequest)await scoresRequest.catch(()=>{});
  const existing=(await fetchScores()).find(row=>row.runKey===run.id);
  if(existing)return {submittedAt:existing.submittedAt||run.submittedAt};
 }
 const error=Error(response.status===400||response.status===422?'The leaderboard could not accept this score. Remove it or retry.':'The leaderboard is temporarily unavailable. Your score will retry automatically.');
 error.permanent=response.status===400||response.status===422;throw error;
}
const outbox=new ScoreOutbox({send:sendQueuedScore,now:boardNow,onChange:change=>{
 renderPendingScores();updateSavedResult(change.entry);
 if(change.type==='sent'){confirmSavedResult(change.entry);if($('#scores-dialog').open)loadScores();}
},onError:()=>{}});
function updateSavedResult(entry){
 if(!entry||entry.id!==endResult?.id)return;
 if(!entry.status){$('#player-name').disabled=false;return;}
 $('#player-name').value=entry.player;$('#player-name').disabled=true;
 const sent=entry.status==='sent',failed=entry.status==='failed';
 $('#submit-score').disabled=!failed;$('#submit-score').textContent=sent?'Saved':failed?'Retry save':'Queued';
 $('#submit-status').textContent=sent?'Your score is on the shared leaderboard.':failed?entry.lastError:'Your score is saved and queued. It will join the leaderboard when a connection is available.';
}
async function confirmSavedResult(entry){
 try{if(scoresRequest)await scoresRequest.catch(()=>{});const scores=await fetchScores();if(endResult?.id!==entry.id)return;
  const result=endResult;result.savedPlayer=entry.player;if(!result.record)await checkTopFinish(result,scores);if(endResult!==result)return;
  const leader=rankedScores(scores,entry.run.mode,currentDay())[0];
  if(endResult.record&&leader?.runKey===entry.id){$('#result-title').textContent='You’re #1, '+entry.player+'.';$('#record-badge').textContent='RECORD SAVED';$('#result-description').textContent='Your '+entry.run.score.toLocaleString()+'-point finish is now leading the '+(entry.run.mode==='daily'?'Daily Challenge':'Adventure')+' board.';}
 }catch{/* A confirmed submission remains saved even if the following read fails. */}
}
async function renderPendingScores(){
 try{const entries=await outbox.list(),container=$('#pending-list');container.replaceChildren();$('#pending-scores').hidden=!entries.length;
  for(const entry of entries){const row=document.createElement('div');row.className='pending-score';const title=document.createElement('strong'),description=document.createElement('p'),actions=document.createElement('div');actions.className='pending-actions';title.textContent=entry.player+' · '+Number(entry.run.score).toLocaleString()+' points';description.textContent=(entry.run.mode==='daily'?'Daily Challenge · '+formatShareDate(entry.run.day):'Adventure')+' · '+(entry.status==='failed'?entry.lastError:entry.status==='sending'&&entry.leaseUntil>boardNow()?'Syncing…':navigator.onLine?'Waiting to sync':'Waiting for connection');
   for(const [label,action] of [['Retry',()=>outbox.retry(entry.id)],['Remove',()=>outbox.remove(entry.id)]]){const button=document.createElement('button');button.className='button secondary';button.textContent=label;button.disabled=entry.status==='sending'&&entry.leaseUntil>boardNow();button.onclick=async()=>{button.disabled=true;try{await action();await renderPendingScores();if(label==='Remove'&&endResult?.id===entry.id){$('#submit-score').disabled=false;$('#submit-score').textContent='Save score';$('#submit-status').textContent='Removed from the queue. You can save this result again.';}}catch{toast('Could not change the queued score. Try again.');button.disabled=false;}};actions.append(button);}
   row.append(title,description,actions);container.append(row);
  }
 }catch{/* The save action reports storage failures without claiming success. */}
}
$('#score-form').addEventListener('submit',async e=>{
 e.preventDefault();if(!endResult)return;const submittedRun=endResult,name=$('#player-name').value.trim();if(!/^[A-Za-z0-9 _-]{2,16}$/.test(name)){$('#submit-status').textContent='Use 2-16 letters, numbers, spaces, dashes or underscores.';return;}
 $('#submit-score').disabled=true;$('#submit-status').textContent='Saving your place…';storage.set('name',name);
 let entry;
 try{entry=await outbox.enqueue(submittedRun,name);updateSavedResult(entry);}
 catch(error){if(endResult===submittedRun){$('#submit-status').textContent=error.code==='storage-unavailable'?'This browser could not save the score for syncing. Keep this result open and try again.':'Could not save this score. Keep your result open and try again.';$('#submit-score').disabled=false;$('#submit-score').textContent='Save score';}return;}
 // Once committed, a failed sync must never tell the player their saved queue was lost.
 try{if(entry.status==='failed')await outbox.retry(entry.id);else await outbox.sync({force:true});}
 catch{if(endResult===submittedRun&&$('#submit-score').textContent!=='Saved')$('#submit-status').textContent='Your score remains queued. Reopen the game when connected to retry syncing.';}
});
function lastRefresh(){return scoresFetchedAt?new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(new Date(scoresFetchedAt)):'never';}
async function hydrateOfflineScores(){
 try{const snapshot=await offlineStore.readBoard();if(snapshot&&!scoresFetchedAt){sharedScores=snapshot.scores;scoresFetchedAt=snapshot.fetchedAt;clockOffset=snapshot.clockOffset||0;scoresUnavailable=true;rolloverDay();armDayRollover();updateTopScore();if($('#scores-dialog').open)loadScores();}}catch{/* Fresh reads and gameplay remain available without storage. */}
 renderPendingScores();outbox.sync().catch(()=>{});
}
function reconnectScores(){if(document.hidden)return;rolloverDay();armDayRollover();outbox.sync().catch(()=>{});renderPendingScores();if($('#scores-dialog').open)loadScores();else refreshTopScore();}
window.addEventListener('online',reconnectScores);window.addEventListener('focus',()=>outbox.sync().catch(()=>{}));
window.addEventListener('offline',()=>{scoresUnavailable=true;updateTopScore();renderPendingScores();if($('#scores-dialog').open)loadScores();});
let expiryCleanup=null;
function cleanExpiredScores(rows){
 if(expiryCleanup||!navigator.onLine||!rows.some(r=>Number.isSafeInteger(Number(r.expiresAt))&&Number(r.expiresAt)<=boardNow()))return;
 const range='selector=#scores > li:has(meta[itemprop="expiresAt"]:value-less-than("'+Math.floor(boardNow())+'"))';
 expiryCleanup=fetch('/scores.html',{method:'DELETE',headers:{Range:range},cache:'no-store',signal:AbortSignal.timeout(10000)}).catch(()=>{}).finally(()=>{expiryCleanup=null;});
}
async function fetchScores(){
 if(scoresRequest)return scoresRequest;
 // A browser connectivity hint can be false while Pagelove is reachable. The
 // bounded request is authoritative, including duplicate-score confirmation.
 scoresRequest=(async()=>{const r=await fetch('/scores.html?cb='+Date.now(),{headers:{Range:'selector=#scores'},cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Score board unavailable');
 const serverDate=Date.parse(r.headers.get('Date'));if(Number.isFinite(serverDate)){clockOffset=serverDate-Date.now();armDayRollover();}
 const doc=new DOMParser().parseFromString(await r.text(),'text/html');if(!doc.querySelector('#scores'))throw Error('Invalid leaderboard response');sharedScores=[...doc.querySelectorAll('li[itemtype$="/Run"]')].map(li=>{const v={};li.querySelectorAll('meta[itemprop]').forEach(m=>v[m.getAttribute('itemprop')]=m.getAttribute('content'));return v;}).filter(r=>r.player&&Number.isFinite(Number(r.score)));cleanExpiredScores(sharedScores);sharedScores=activeScores(sharedScores,boardNow());scoresUnavailable=false;scoresFetchedAt=Date.now();offlineStore.writeBoard({scores:sharedScores,fetchedAt:scoresFetchedAt,clockOffset}).catch(()=>{});rolloverDay();updateTopScore();return sharedScores;
 })();try{return await scoresRequest;}catch(error){scoresUnavailable=true;updateTopScore();throw error;}finally{scoresRequest=null;}
}
function leaderboardDay(){return currentDay();}
function updateTopScore(){
 const mode=game.mode==='daily'?'daily':'campaign',leader=sharedScores&&rankedScores(sharedScores,mode,currentDay())[0];$('#record-status').textContent=scoresUnavailable?'Last refreshed '+lastRefresh():'';
 $('#top-score-label').textContent=mode==='daily'?'Daily top':'Top score';$('#top-score').textContent=leader?Number(leader.score).toLocaleString():'-';
 $('#top-player').textContent=leader?leader.player:scoresUnavailable?'Unavailable':sharedScores?'Be the first':'Loading…';
 const description=leader?leader.player+' · '+Number(leader.score).toLocaleString()+' points':$('#top-player').textContent;
 $('#top-score-open').setAttribute('aria-label','Open '+(mode==='daily'?'daily':'adventure')+' leaderboard. '+description);$('#top-score-open').title=description+(scoresUnavailable&&leader?' (last loaded score)':'')+' · View leaderboard';$('#record-status').hidden=!(scoresUnavailable&&leader);updateChase();
}
function updateChase(){const leader=sharedScores&&rankedScores(sharedScores,game.mode==='daily'?'daily':'campaign',currentDay())[0];$('#score-chase').textContent=game.mode==='practice'?'Practice run':game.mode==='daily'&&runDay!==currentDay()?'Previous day’s challenge':leader?(game.score>Number(leader.score)?(scoresUnavailable?'Above saved top score':'Record beaten!'):(Number(leader.score)-game.score+1).toLocaleString()+' to take the lead'):sharedScores&&!scoresUnavailable?'Set the first score':'Chase the record';}
async function refreshTopScore(){try{await fetchScores();}catch{/* The score display reports unavailable; gameplay continues. */}}
const scoreAgeLabels={green:'0–48 hours old',yellow:'Over 48–96 hours old',red:'Over 96 hours old'};
function updateScoreOutlines(){
 const now=boardNow();
 for(const row of all('#score-rows tr[data-score-expiry]')){
  const band=scoreAgeBand({expiresAt:row.dataset.scoreExpiry},now);
  if(row.dataset.ageBand===(band||''))continue;
  row.dataset.ageBand=band||'';
  const label=band?scoreAgeLabels[band]:'';
  row.title=label;
  row.querySelector('[data-score-age-label]').textContent=label?' · '+label:'';
 }
}
function renderScores(rows){
 const daily=leaderMode==='daily';
 $('#score-table').classList.toggle('age-outlines',!daily);
 $('#score-age-legend').hidden=daily;
 $('#daily-reset-note').hidden=!daily;
 $('#score-detail-heading').textContent=daily?'AGE (MIN)':'WORLD';
 $('#score-caption').textContent=daily?'Daily Challenge leaderboard. Age is minutes since the score was submitted. Scores expire after 5 days.':'Adventure leaderboard ranked by score, world reached, then time. Green outlines: 0–48 hours old. Yellow: over 48–96 hours. Red: over 96 hours. Scores expire after 5 days.';
 $('#score-rows').replaceChildren();$('#leader-summary').hidden=!rows.length;
 if(rows.length){$('#leader-name').textContent=rows[0].player;$('#leader-points').textContent=Number(rows[0].score).toLocaleString();}
 rows.forEach((r,i)=>{
  const tr=document.createElement('tr');if(i===0)tr.className='leading';
  const age=scoreAge(r,boardNow()),expiry=scoreExpiry(r);
  if(!daily&&Number.isFinite(expiry))tr.dataset.scoreExpiry=String(expiry);
  [String(i+1).padStart(2,'0'),r.player,daily?(age===null?'—':age.toLocaleString()):String(r.level).padStart(2,'0'),Number(r.score).toLocaleString()].forEach((t,col)=>{
   const td=document.createElement('td');td.textContent=t;
   if(!daily&&col===1){const ageLabel=document.createElement('span');ageLabel.className='sr-only';ageLabel.dataset.scoreAgeLabel='';td.append(ageLabel);}
   if(daily&&col===2&&Number.isFinite(expiry)){td.dataset.scoreTime=new Date(expiry-SCORE_LIFETIME).toISOString();td.title='Minutes since submission';}
   tr.append(td);
  });$('#score-rows').append(tr);
 });
 if(!daily)updateScoreOutlines();
}
async function loadScores(){if(scoreLoading)return;scoreLoading=true;const mode=leaderMode,day=leaderboardDay(),status=$('#score-status');status.classList.remove('state-panel');status.textContent=sharedScores?'Refreshing shared scores…':'Loading shared scores…';$('#scores-dialog').setAttribute('aria-busy','true');$('#refresh-scores').disabled=true;$('#score-skeleton').hidden=!!sharedScores;renderScores(sharedScores?rankedScores(sharedScores,mode,day):[]);
 try{const rows=rankedScores(await fetchScores(),mode,day);if(leaderMode!==mode||day!==leaderboardDay())return;renderScores(rows);status.classList.toggle('state-panel',!rows.length);status.textContent=(mode==='daily'?'Challenge date: '+day+' UTC · Resets at 00:00 UTC. ':'')+(rows.length?(mode==='daily'?'Age is minutes since submission.':'Top 25 adventure runs'):'No scores yet. Finish a run and save your name to set the first record.');
 }catch{if(leaderMode!==mode||day!==leaderboardDay())return;const rows=sharedScores?rankedScores(sharedScores,mode,day):[];status.classList.toggle('state-panel',!rows.length);renderScores(rows);status.textContent=(navigator.onLine?'Unable to refresh. ':'Offline. ')+(sharedScores?'Showing saved standings. Last refreshed '+lastRefresh()+'.':'No saved standings yet. Play a run and save your score to sync later.');}
 finally{scoreLoading=false;$('#score-skeleton').hidden=true;$('#refresh-scores').disabled=false;$('#scores-dialog').setAttribute('aria-busy','false');if(leaderMode!==mode||day!==leaderboardDay())loadScores();}}
function armDayRollover(){clearTimeout(rolloverTimer);const now=boardNow(),next=Date.parse(currentDay()+'T00:00:00Z')+86400000;rolloverTimer=setTimeout(()=>{rolloverDay();armDayRollover();},Math.max(50,next-now+50));}
function rolloverDay(){const day=currentDay();if(boardDate===day)return;boardDate=day;$('#daily-detail').textContent=WORLDS[dailyWorld(day)].name+' · '+day+' UTC';updateTopScore();if(game.mode==='daily'&&runDay&&runDay!==day&&view!=='home')toast('A new UTC challenge day has started. This run belongs to '+runDay+'.');if($('#scores-dialog').open&&leaderMode==='daily'){renderScores(sharedScores?rankedScores(sharedScores,'daily',day):[]);$('#score-status').textContent='Challenge date: '+day+' UTC · A fresh daily board.';queueMicrotask(loadScores);}armDayRollover();}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)reconnectScores();});
window.addEventListener('focus',()=>{rolloverDay();armDayRollover();});
function resetSharing(){$('#share-status').textContent='';$('#share-link-fallback').hidden=true;}
function openLeaderboard(){leaderMode=view!=='home'&&game.mode==='daily'?'daily':'campaign';resetSharing();$('#tab-campaign').setAttribute('aria-pressed',String(leaderMode==='campaign'));$('#tab-daily').setAttribute('aria-pressed',String(leaderMode==='daily'));openDialog('#scores-dialog');renderPendingScores();loadScores();}
$('#scores-open').onclick=openLeaderboard;$('#top-score-open').onclick=openLeaderboard;$('#result-scores').onclick=openLeaderboard;$('#refresh-scores').onclick=loadScores;for(const mode of ['campaign','daily'])$('#tab-'+mode).onclick=()=>{leaderMode=mode;resetSharing();$('#tab-campaign').setAttribute('aria-pressed',String(mode==='campaign'));$('#tab-daily').setAttribute('aria-pressed',String(mode==='daily'));loadScores();};
function leaderboardShareData(){
 const board=leaderMode==='daily'?'Daily Challenge':'Adventure',leader=sharedScores&&rankedScores(sharedScores,leaderMode,currentDay())[0];
 const url=new URL(document.querySelector('link[rel="canonical"]').href);url.searchParams.set('leaderboard',leaderMode);
 const day=leaderMode==='daily'?currentDay():'all',date=day==='all'?'':' for '+formatShareDate(day);
 const challenge=leaderMode==='daily'?'in Prism Breaker’s Daily Challenge'+date:'on the Prism Breaker Adventure leaderboard';
 return {kind:'leaderboard',mode:leaderMode,title:'Prism Breaker · '+board+' leaderboard',text:leader?'Can you beat '+leader.player+'’s '+Number(leader.score).toLocaleString()+' points '+challenge+'?':leaderMode==='daily'?'Play Prism Breaker’s Daily Challenge'+date+'. Set the first score to beat!':'Join the Prism Breaker Adventure leaderboard.',url:url.href,boardLabel:board,day,player:leader?.player||'',score:leader?Number(leader.score):null,world:leader?Number(leader.level):0,seconds:leader?Number(leader.seconds):null,rank:leader?1:null,badge:leader?'THE SCORE TO BEAT':'SET THE FIRST RECORD'};
}
function personalShareData(){
 const result=endResult;if(!result)return null;const board=result.mode==='daily'?'Daily Challenge':result.mode==='practice'?'Practice':'Adventure',rows=sharedScores&&rankedScores(sharedScores,result.mode,result.day),index=rows?.findIndex(r=>r.runKey===result.id)??-1;
 const entered=$('#player-name').value.trim(),player=index>=0?rows[index].player:/^[A-Za-z0-9 _-]{2,16}$/.test(entered)?entered:'Your run',url=new URL(document.querySelector('link[rel="canonical"]').href);if(result.mode!=='practice')url.searchParams.set('leaderboard',result.mode);
 return {kind:'result',mode:result.mode,title:'Prism Breaker · My '+board+' score',text:'I scored '+result.score.toLocaleString()+' points in Prism Breaker’s '+board+(result.mode==='daily'?' for '+formatShareDate(result.day):'')+'. Can you beat my score?',url:url.href,boardLabel:board,day:result.day,player,score:result.score,world:result.level,seconds:result.seconds,rank:index>=0?index+1:null,badge:result.mode==='practice'?'PRACTICE RUN':index>=0?'YOUR SCORE · RANK #'+(index+1):'YOUR RESULT',speed:game.bonusTotals.speed,pickups:game.bonusTotals.pickups};
}
function showShareLink(message){$('#share-link').value=leaderboardShareData().url;$('#share-link-fallback').hidden=false;$('#share-status').textContent=message;}
async function copyLeaderboardLink(){
 const url=leaderboardShareData().url;
 try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(url);$('#share-status').textContent='Leaderboard link copied. Paste it wherever you want to share.';}
 catch{showShareLink('Select and copy this leaderboard link to share it.');$('#share-link').focus();$('#share-link').select();}
}
$('#share-leaderboard').onclick=()=>sharePreview.open(leaderboardShareData());
if($('#share-result'))$('#share-result').onclick=()=>{const data=personalShareData();if(data)sharePreview.open(data);};
$('#copy-leaderboard-link').onclick=copyLeaderboardLink;
async function loadPracticeWorld(level){
 const slug=worldSlug(level),key='prism.world-published.'+slug;
 try{
  if(!navigator.onLine)throw Error('Offline');
  const response=await fetch('/worlds/'+slug+'/definition.html?cb='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(6000)});if(!response.ok)throw Error('World unavailable');
  const world=parseWorld(await response.text(),{expectedSlug:slug});try{localStorage.setItem(key,JSON.stringify({world,savedAt:Date.now()}));}catch{}
  return {world};
 }catch{
  // Published snapshots and drafts have separate keys and visible provenance.
  for(const [cacheKey,label]of [[key,'Cached published world'],['prism.world-draft.'+slug,'Saved draft']])try{
   const saved=JSON.parse(localStorage.getItem(cacheKey)||'null');if(!saved)continue;const world=normalizeWorld(saved.world);if(world.slug!==slug)continue;
   toast(label+' · '+world.name);return {world};
  }catch{}
  toast('Shared world unavailable. Playing the original release.');return null;
 }
}

saveSettings();home();
try{const raw=JSON.parse(localStorage.getItem('prism.save')||'null');if(raw&&!isValidSnapshot(raw.game)){const box=document.createElement('div'),copy=document.createElement('p'),download=document.createElement('button');copy.textContent='Your saved adventure needs a different game version. Download it before starting a new adventure to keep a recovery copy.';download.className='button secondary';download.textContent='Download saved adventure';download.onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(raw,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='prism-adventure-recovery.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};box.append(copy,download);$('#home').append(box);}}catch{}
hydrateOfflineScores();refreshTopScore();all('#play,#resume,#daily,.world-card').forEach(button=>button.disabled=true);$('#stage').setAttribute('aria-busy','true');requestAnimationFrame(()=>requestAnimationFrame(initializeStage));if(matchMedia('(pointer:coarse)').matches)$('#launch-hint').textContent='TAP';
const sharedBoard=new URLSearchParams(location.search).get('leaderboard');if(['campaign','daily'].includes(sharedBoard)){leaderMode=sharedBoard;$('#tab-campaign').setAttribute('aria-pressed',String(leaderMode==='campaign'));$('#tab-daily').setAttribute('aria-pressed',String(leaderMode==='daily'));openDialog('#scores-dialog');loadScores();}
setInterval(()=>{if(document.hidden)return;rolloverDay();if(sharedScores){const current=activeScores(sharedScores,boardNow());if(current.length!==sharedScores.length){cleanExpiredScores(sharedScores);sharedScores=current;updateTopScore();if($('#scores-dialog').open)renderScores(rankedScores(current,leaderMode,currentDay()));}}if(leaderMode==='campaign'&&$('#scores-dialog').open)updateScoreOutlines();if(leaderMode==='daily'&&$('#scores-dialog').open)all('td[data-score-time]').forEach(td=>{const age=scoreAge({submittedAt:td.dataset.scoreTime},boardNow());td.textContent=age===null?'—':age.toLocaleString();});},1000);
armDayRollover();setInterval(()=>{if(document.hidden)return;rolloverDay();if($('#scores-dialog').open){renderPendingScores();loadScores();}else refreshTopScore();},60000);
const renderClock=new RenderClock();let last=performance.now(),saveTimer=0,sceneDelta=0,lastHudPoll=0;
function frame(now){const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;if(stage&&!stage.preparing&&!graphicsRecovery.blocked){
 if(view==='game'&&!document.hidden){if(keys.has('ArrowLeft')||keys.has('KeyA'))game.move(game.target-dt*22);if(keys.has('ArrowRight')||keys.has('KeyD'))game.move(game.target+dt*22);accumulator+=dt;while(accumulator>=1/120){game.tick(1/120);accumulator-=1/120;}saveTimer+=dt;if(saveTimer>10&&view==='game'){saveTimer=0;persist();}if(now-lastHudPoll>=100||lastHud===''){lastHudPoll=now;hud();}}
 if(view==='home'&&!document.hidden){game.time+=dt;game.paddle.x=settings.reducedMotion?0:Math.sin(now*.0006)*3.3;game.balls[0].x=game.paddle.x;game.balls[0].y=-9.5+(settings.reducedMotion?0:Math.sin(now*.0007)*.2);}
 if(view==='cut'&&cutReady&&!document.hidden&&!$('dialog[open]')){const duration=settings.reducedMotion?9:game.mode==='daily'?DAILY_DURATION:CINEMATICS[THEMES.indexOf(game.world.shape)].duration;cutTime=advanceScene(cutTime,dt,duration,scenePaused);$('#cut-progress-bar').style.transform='scaleX('+Math.min(1,cutTime/(duration*.94))+')';}
 if(view==='champion'&&cutReady&&!document.hidden&&!$('dialog[open]'))cutTime=advanceScene(cutTime,dt,settings.reducedMotion?9:game.mode==='daily'?DAILY_RECORD_DURATION:CHAMPION_DURATION,scenePaused);
 const victory=endResult?.record&&['champion','result'].includes(view)?endResult.mode:null,dialogs=all('dialog[open]'),musicActive=!document.hidden&&((!dialogs.length&&['game','cut','champion'].includes(view)&&game.state!=='paused')||(view==='result'&&victory&&dialogs.length===1&&$('#result-dialog').open));
 sound.update(musicActive&&!(['cut','champion'].includes(view)&&scenePaused),THEMES.indexOf(game.world.music),view==='cut'||view==='champion',victory);if(!document.hidden)sceneDelta+=dt;else sceneDelta=0;const renderFPS=view==='home'||dialogs.length||game.state==='paused'?30:60;if(document.hidden)renderClock.reset();else if(renderClock.due(now,renderFPS)){stage.render(game,sceneDelta,now/1000,view,cutTime);stage.observeFrame(renderClock.elapsed,view==='game'&&game.state==='playing'&&!dialogs.length);sceneDelta=0;}
 }if(toastUntil&&now>toastUntil){$('#toast').classList.remove('visible');toastUntil=0;}requestAnimationFrame(frame);}
requestAnimationFrame(frame);
