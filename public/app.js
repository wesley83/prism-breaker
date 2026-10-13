import {WORLDS,POWERS,daySeed} from './levels.js';
import {Game} from './engine.js?v=2';
import {Sound} from './audio.js?v=4';
import {TRACKS} from './music.js';
import {CINEMATICS,cameraFrame} from './cinematic-score.js';
import {utcDay,rankedScores,scoreAge,topFinish} from './leaderboard.js?v=2';
import {dailyFrame,DAILY_DURATION,DAILY_RECORD_DURATION} from './daily-score.js';
import {VICTORY_TRACKS} from './victory-music.js';
const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
const storage={get(key,fallback=null){try{return JSON.parse(localStorage.getItem('prism.'+key))??fallback;}catch{return fallback;}},set(key,value){try{localStorage.setItem('prism.'+key,JSON.stringify(value));}catch{}},remove(key){try{localStorage.removeItem('prism.'+key);}catch{}}};
const settings={music:.35,effects:.7,muted:false,interfaceTheme:'system',reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,lowEffects:matchMedia('(pointer:coarse)').matches,...storage.get('settings',{})};
const icon=name=>'<svg class="icon" aria-hidden="true"><use href="/assets/icons.svg?v=2#'+name+'"/></svg>';
const powerIcons={wide:'arrows-horizontal',multi:'circles',sticky:'magnet',laser:'bolt',pierce:'diamond',slow:'clock',shield:'shield',life:'heart'};
const powerDescriptions={wide:'A wider paddle for 18 seconds. Works with sticky or laser.',multi:'Three balls. Keep one in play.',sticky:'Holds each ball where it lands for 16 seconds. Launch with space or a tap.',laser:'Fire automatically for 14 seconds.',pierce:'Cut through bricks for 12 seconds.',slow:'Slower balls for 14 seconds.',shield:'Saves one ball at the bottom.',life:'One extra life, up to nine.'};
function applyTheme(){document.documentElement.dataset.theme=settings.interfaceTheme;document.documentElement.dataset.reducedMotion=String(settings.reducedMotion);}
applyTheme();
const sound=new Sound(settings);let game=new Game(),stage,view='home',accumulator=0,cutTime=0,toastUntil=0,modalResume=null,lastHud='',leaderMode='campaign',scoreLoading=false,runDay='',endResult=null;
const keys=new Set();let best=storage.get('best',0),highest=storage.get('highest',0);$('#best').textContent=best?best.toLocaleString():'-';
let sharedScores=null,scoresRequest=null,scoresUnavailable=false;
let boardDate=utcDay(),rolloverTimer,clockOffset=0;
const boardNow=()=>Date.now()+clockOffset;
const currentDay=()=>utcDay(boardNow());
async function initializeStage(){try{const {Stage}=await import('./scene.js?v=5');stage=new Stage($('#game-canvas'),settings);all('#play,#resume,#daily,.world-card').forEach(button=>button.disabled=false);$('#arena-status').hidden=true;$('#stage').setAttribute('aria-busy','false');}catch(error){$('#arena-status').hidden=true;$('#stage').setAttribute('aria-busy','false');$('#error').hidden=false;$('#error-text').textContent='The 3D arena could not load. Check your connection, enable hardware acceleration, or try a current Chrome, Edge, Firefox or Safari browser.';console.error('WebGL initialization failed:',error);}}
game.emit=handleEvent;
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');toastUntil=performance.now()+2600;}
function updateWorld(){
 const w=WORLDS[game.level];document.documentElement.style.setProperty('--accent',w.accent);document.documentElement.style.setProperty('--accent-dark','#'+w.accent.slice(1).match(/../g).map(v=>Math.round(parseInt(v,16)*.35).toString(16).padStart(2,'0')).join(''));$('#world-overline').textContent='WORLD '+String(game.level+1).padStart(2,'0');$('#world-title').textContent=w.name;$('#world-tag').textContent=w.tag;$('#journey-count').textContent=String(game.level+1).padStart(2,'0')+' / 08';$('#level-tip').textContent=w.note;$('#arena-world').textContent='World '+(game.level+1)+' of 8';$('#music-credit').textContent=TRACKS[game.level].title+' · '+TRACKS[game.level].style;
 $('#world-list').replaceChildren();WORLDS.forEach((world,i)=>{const current=i===game.level,row=document.createElement('div');row.className='world-row'+(current?' active':'');if(current)row.setAttribute('aria-current','step');row.style.setProperty('--world-color',world.accent);row.innerHTML='<span class="num">'+String(i+1).padStart(2,'0')+'</span><i class="dot"></i><span class="world-name">'+world.name+'</span><span class="row-end'+(current?' current-badge':'')+'">'+(current?'Current':i<highest?'✓':'')+'</span>';$('#world-list').append(row);});
 if(view!=='home')$('#stage-label').textContent=w.name.toUpperCase()+(game.level===7?' · PHASE '+(game.phase+1):'');
}
function hud(){
 const remaining=game.bricks.filter(b=>b.hp>0).length,complete=Math.round((1-remaining/game.bricks.length)*100);
 const signature=[game.score,game.lives,game.combo,remaining,game.state,Object.entries(game.effects).map(([k,v])=>k+Math.ceil(v)).join(),game.shield].join('|');
 if(signature===lastHud)return;lastHud=signature;
 $('#score').textContent=String(game.score).padStart(6,'0');$('#combo').textContent='×'+Math.min(5,1+Math.floor(game.combo/6));$('#lives').innerHTML=game.lives<=3?icon('heart').repeat(Math.max(0,game.lives)):icon('heart')+'<span>×'+game.lives+'</span>';$('#lives').setAttribute('aria-label',game.lives+' lives');updateChase();
 $('#progress-label').textContent=view==='home'?'Your adventure awaits':remaining+' bricks to go';$('#progress-count').textContent=complete+'%';$('#progress-bar').style.width='100%';$('#progress-bar').style.transform='scaleX('+complete/100+')';$('#world-progress-meter').setAttribute('aria-valuenow',String(complete));$('#arena-bricks').textContent=remaining+' bricks left';
 $('#launch').hidden=!(view==='game'&&['ready','playing'].includes(game.state)&&game.balls.some(b=>b.held));
 $('#effects').replaceChildren();for(const [key,value]of Object.entries(game.effects))if(value>0){const el=document.createElement('span');el.className='effect';el.style.color=POWERS[key].color;el.innerHTML=icon(powerIcons[key])+POWERS[key].name+' · '+Math.ceil(value)+'s';$('#effects').append(el);}if(game.shield){const el=document.createElement('span');el.className='effect';el.innerHTML=icon('shield')+'Safety shield ready';$('#effects').append(el);}
}
function persist(pendingNext=false){if(game.mode==='campaign'&&game.lives>0)storage.set('save',{pendingNext,game:game.snapshot()});}
function updateBest(){if(game.mode==='practice')return;if(game.score>best){best=game.score;storage.set('best',best);$('#best').textContent=best.toLocaleString();}}
function handleEvent(e){
 sound.event(e);stage?.event(e);
 if(e.type==='level'){stage?.reset();updateWorld();lastHud='';}
 if(e.type==='power')toast(POWERS[e.kind].name);
 if(e.type==='gate')toast('Gate open. Find your angle.');
 if(e.type==='save')toast('Saved by the shield!');
 if(e.type==='life'){toast(game.lives+' lives left. You’ve got this.');persist();}
 if(e.type==='phase'){toast('Citadel · Formation '+(e.phase+1));persist();}
 if(e.type==='clear'){
   updateBest();if(game.mode==='campaign'){highest=Math.max(highest,game.level+1);storage.set('highest',highest);if(game.level<7)persist(true);else storage.remove('save');}
   beginCut();
 }
 if(e.type==='over')finish(false);
}
function closeDialogs(){all('dialog[open]').forEach(d=>d.close());modalResume=null;}
function begin(mode='campaign',level=0){
 if(!stage)return;sound.unlock();closeDialogs();view='game';runDay=currentDay();let seed=mode==='daily'?daySeed(runDay):8399;
 if(mode==='daily')level=seed%8;game.start(mode,level,seed);showGame();persist();toast(WORLDS[level].note);
}
function showGame(){
 $('#record-celebration').hidden=true;$('#home').hidden=true;$('#stage').classList.remove('home-mode','cinematic-mode');$('#hud').hidden=false;$('#arena-progress').hidden=false;$('#cutscene').hidden=true;$('#mode-label').textContent=game.mode==='daily'?runDay+' · UTC':game.mode==='practice'?'PRACTICE':'ADVENTURE';updateWorld();hud();updateTopScore();refreshTopScore();$('#game-canvas').focus({preventScroll:true});
}
function home(){closeDialogs();$('#record-celebration').hidden=true;$('#stage').classList.remove('cinematic-mode');view='home';game.start('campaign',0,8399);$('#home').hidden=false;$('#stage').classList.add('home-mode');$('#hud').hidden=true;$('#arena-progress').hidden=true;$('#launch').hidden=true;$('#cutscene').hidden=true;$('#effects').replaceChildren();$('#stage-label').textContent='Eight worlds to break through';$('#mode-label').textContent='3D ARCADE';const saved=storage.get('save');$('#resume').hidden=!saved;$('#play').classList.toggle('primary',!saved);$('#play').classList.toggle('secondary',!!saved);if(saved)$('#resume-detail').textContent=(WORLDS[saved.game.level]?.name||'Adventure')+' · '+Number(saved.game.score||0).toLocaleString()+' points';const day=currentDay();$('#daily-detail').textContent=WORLDS[daySeed(day)%8].name+' · '+day+' UTC';updateWorld();lastHud='';hud();}
function beginCut(){
 view='cut';cutTime=0;lastHud='';hud();$('#stage').classList.add('cinematic-mode');$('#cutscene').style.setProperty('--story-opacity',settings.reducedMotion?'1':'0');$('#launch').hidden=true;$('#effects').replaceChildren();$('#hud').hidden=true;$('#arena-progress').hidden=true;$('#cutscene').hidden=false;
 $('#cut-kicker').textContent=game.level===7?'THE PRISM IS WHOLE':'WORLD '+String(game.level+1).padStart(2,'0')+' · RESTORED';
 $('#cut-title').textContent=game.level===7?'Every color. Home.':WORLDS[game.level].name+' restored.';$('#cut-story').textContent=WORLDS[game.level].story;const hasNext=game.mode==='campaign'&&game.level<7;$('#cut-next').textContent=hasNext?'Next: '+WORLDS[game.level+1].name:'';$('#skip-cut').textContent=hasNext?'Next world':'See your score';
 if(game.mode==='daily'){$('#cut-kicker').textContent='DAILY CHALLENGE · '+runDay+' UTC';$('#cut-title').textContent='You owned the day.';$('#cut-story').textContent='One shared challenge. One brilliant finish. The daily prism is restored.';$('#cut-next').textContent='Your score: '+game.score.toLocaleString();}
}
function finishCut(){if(view!=='cut')return;$('#stage').classList.remove('cinematic-mode');$('#cutscene').hidden=true;if(game.next()){view='game';showGame();persist();toast(WORLDS[game.level].note);}else finish(true);}
function finish(won){
 view='result';game.state=won?'won':'over';updateBest();if(game.mode==='campaign')storage.remove('save');$('#launch').hidden=true;$('#cutscene').hidden=true;$('#arena-progress').hidden=true;
 endResult={id:game.runId,won,score:game.score,level:game.level+1,mode:game.mode,day:game.mode==='daily'?runDay:'all',seconds:Math.max(1,Math.round(game.elapsed))};
 $('#result-kicker').textContent=won?'WORLD COMPLETE':'RUN COMPLETE';$('#result-title').textContent=won?(game.mode==='campaign'?'You broke through.':'World complete.'):'One more try?';$('#result-description').textContent=(won?'Beautifully played. ':'You reached '+WORLDS[game.level].name+'. ')+(game.mode==='practice'?'Try another world or start an adventure.':'Save your score to join the shared leaderboard.');$('#result-score').textContent=game.score.toLocaleString();$('#score-form').hidden=game.mode==='practice';$('#player-name').value=storage.get('name','');$('#submit-score').disabled=false;$('#submit-score').textContent='Save score';$('#submit-status').textContent='2-16 letters, numbers, spaces, dashes or underscores.';$('#result-dialog').showModal();
 $('#result-dialog').classList.remove('record-result');$('#record-badge').hidden=true;
 if(game.mode==='daily'&&runDay!==currentDay())$('#result-description').textContent='This run belongs to '+runDay+' UTC. You can save it, but the current Daily Challenge board has reset for '+currentDay()+'.';
 if(game.mode!=='practice')checkTopFinish(endResult);
}
async function checkTopFinish(result){
 try{const scores=await fetchScores();if(endResult!==result||view!=='result'||!$('#result-dialog').open||all('dialog[open]').length!==1||!topFinish(result,scores,currentDay()))return;
  result.record=true;result.tied=scores.some(r=>r.mode===result.mode&&(r.mode!=='daily'||r.day===result.day)&&Number(r.score)===result.score);
  $('#result-dialog').close();view='champion';cutTime=0;$('#stage').classList.add('cinematic-mode');$('#hud').hidden=true;$('#record-celebration').hidden=false;
  $('#record-overline').textContent=result.mode==='daily'?'DAILY CHALLENGE CHAMPION':'THE HIGH-SCORE CLUB';$('#record-heading').textContent=result.mode==='daily'?(result.tied?'Daily top score reached.':'The crown of the day.'):(result.tied?'Top score reached.':'A new champion.');$('#record-total').textContent=result.score.toLocaleString();$('#record-message').textContent=(result.mode==='daily'?'Daily Challenge · '+result.day+' UTC':result.won?'Adventure complete':'Adventure record')+' · Save your name to claim your place.';
  const victory=VICTORY_TRACKS[result.mode];$('#music-credit').textContent=victory.title+' · '+victory.style;
  sound.event({type:'champion'});setRecordResult(result);$('#claim-record').focus({preventScroll:true});
 }catch{/* A result is still available when the shared board cannot be checked. */}
}
function setRecordResult(result){
 $('#result-dialog').classList.add('record-result');$('#record-badge').hidden=false;$('#record-badge').textContent=result.tied?'TOP SCORE TIED':'NEW HIGH SCORE';$('#result-kicker').textContent=result.mode==='daily'?'DAILY CHALLENGE CHAMPION':'THE HIGH-SCORE CLUB';$('#result-title').textContent=result.tied?'You reached the top.':result.mode==='daily'?'You won the daily crown.':'You took the crown.';$('#result-description').textContent=(result.won?(result.mode==='daily'?'Daily Challenge complete. ':'Adventure complete. '):'Record run. ')+result.score.toLocaleString()+' points at the top of the '+(result.mode==='daily'?'Daily Challenge':'Adventure')+' board. Save your name to claim your place.';
}
function finishCelebration(){if(view!=='champion')return;view='result';$('#record-celebration').hidden=true;$('#stage').classList.remove('cinematic-mode');$('#result-dialog').showModal();}
$('#claim-record').onclick=finishCelebration;
function openDialog(id){
 if(id==='#pause-dialog'){$('#pause-description').textContent=game.mode==='campaign'?WORLDS[game.level].name+' · '+game.score.toLocaleString()+' points. Your checkpoint is saved on this device.':'This '+(game.mode==='daily'?'daily challenge':'practice run')+' is paused. Return to the arcade to end it.';$('#quit').textContent=game.mode==='campaign'?'Save & return home':'End run & return home';}
 if(view==='game'&&['playing','ready'].includes(game.state)){modalResume=game.state;game.state='paused';persist();$('#launch').hidden=true;}
 sound.update(false,game.level);
 $(id).showModal();
}
all('dialog').forEach(d=>{const title=d.querySelector('h2');if(title&&!d.hasAttribute('aria-labelledby')){if(!title.id)title.id=d.id+'-title';d.setAttribute('aria-labelledby',title.id);}d.addEventListener('close',()=>{if(modalResume&&view==='game'){game.state=modalResume;modalResume=null;lastHud='';hud();}});d.addEventListener('click',e=>{if(e.target===d&&d.id!=='result-dialog'){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});});
$('#result-dialog').addEventListener('cancel',e=>{e.preventDefault();home();});all('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
$('#play').onclick=()=>{const saved=storage.get('save');if(saved){$('#new-run-detail').textContent='Your checkpoint in '+(WORLDS[saved.game.level]?.name||'Adventure')+' will be replaced when the new run starts.';openDialog('#new-run-dialog');}else begin();};$('#confirm-new-run').onclick=()=>begin();$('#daily').onclick=()=>begin('daily');$('#resume').onclick=()=>{const saved=storage.get('save');if(!saved||!game.restore(saved.game)){storage.remove('save');toast('That save could not be restored. Start a new adventure.');home();return;}sound.unlock();view='game';if(saved.pendingNext)game.next();showGame();stage?.reset();};
$('#launch').onclick=()=>{sound.unlock();game.launch();lastHud='';hud();};$('#pause').onclick=()=>openDialog('#pause-dialog');$('#unpause').onclick=()=>$('#pause-dialog').close();$('#quit').onclick=()=>{persist();home();};$('#skip-cut').onclick=finishCut;
$('#play-again').onclick=()=>begin(endResult.mode,endResult.mode==='practice'?endResult.level-1:0);$('#result-home').onclick=home;
$('#settings-open').onclick=()=>openDialog('#settings-dialog');$('#help-open').onclick=()=>openDialog('#help-dialog');$('#worlds-open').onclick=()=>openDialog('#worlds-dialog');$('#worlds-menu').onclick=()=>openDialog('#worlds-dialog');
Object.entries(POWERS).forEach(([key,power])=>{const item=document.createElement('div');item.innerHTML='<span class="power-symbol" style="color:'+power.color+'">'+icon(powerIcons[key])+'</span><div><strong>'+power.name+'</strong><p>'+powerDescriptions[key]+'</p></div>';$('#power-guide').append(item);});
WORLDS.forEach((w,i)=>{const card=document.createElement('button');card.className='world-card';card.style.setProperty('--world-color',w.accent);card.style.setProperty('--world-bg',w.sky);card.innerHTML='<small>WORLD '+String(i+1).padStart(2,'0')+'</small><strong>'+w.name+'</strong><span>'+w.mechanic+'</span>';card.onclick=()=>begin('practice',i);$('#world-grid').append(card);});
function saveSettings(){storage.set('settings',settings);applyTheme();$('#sound-toggle').innerHTML=icon(settings.muted?'volume-off':'volume');$('#sound-toggle').setAttribute('aria-label',settings.muted?'Unmute sound':'Mute sound');$('#sound-toggle').title=settings.muted?'Unmute sound':'Mute sound';}
$('#interface-theme').value=settings.interfaceTheme;$('#interface-theme').onchange=e=>{settings.interfaceTheme=e.target.value;saveSettings();};
$('#sound-toggle').onclick=()=>{settings.muted=!settings.muted;sound.unlock();saveSettings();};for(const [id,key]of [['music-volume','music'],['effects-volume','effects']]){$('#'+id).value=settings[key]*100;$('#'+id).oninput=e=>{settings[key]=Number(e.target.value)/100;sound.unlock();saveSettings();};}
for(const [id,key]of [['reduced-motion','reducedMotion'],['low-effects','lowEffects']]){$('#'+id).checked=settings[key];$('#'+id).onchange=e=>{settings[key]=e.target.checked;saveSettings();if(stage){stage.renderer.setPixelRatio(Math.min(devicePixelRatio,settings.lowEffects?1:1.8));stage.resize();}};}
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#stage').requestFullscreen();}catch{toast('Fullscreen is unavailable in this browser.');}};$('#reload').onclick=()=>location.reload();
const canvas=$('#game-canvas');let dragging=false;
canvas.addEventListener('pointerdown',e=>{if(view!=='game'||all('dialog[open]').length)return;dragging=true;canvas.setPointerCapture(e.pointerId);game.move(stage.screenX(e.clientX,e.clientY));sound.unlock();game.launch();});
canvas.addEventListener('pointermove',e=>{if(view==='game'&&(e.pointerType==='mouse'||dragging))game.move(stage.screenX(e.clientX,e.clientY));});canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select,button,a')||all('dialog[open]').length)return;if((view==='cut'||view==='champion')&&(e.code==='Space'||e.code==='Enter')){e.preventDefault();if(view==='champion')finishCelebration();else finishCut();return;}if(view!=='game')return;if(['ArrowLeft','ArrowRight','Space','KeyA','KeyD','KeyP','Escape'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.code==='Space'&&!e.repeat){sound.unlock();game.launch();}if((e.code==='KeyP'||e.code==='Escape')&&!e.repeat)openDialog('#pause-dialog');});document.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>keys.clear());
document.addEventListener('visibilitychange',()=>{keys.clear();if(document.hidden&&view==='game'&&['playing','ready'].includes(game.state))openDialog('#pause-dialog');});window.addEventListener('pagehide',()=>{if(view==='game')persist();});
const ro=new ResizeObserver(()=>stage?.resize());ro.observe($('#stage'));
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function scoreHTML(r,name){const props={runKey:r.id,player:name,score:r.score,level:r.level,mode:r.mode,day:r.day,seconds:r.seconds,submittedAt:r.submittedAt};return '<li itemscope itemtype="https://sane-guild-8399.onpagelove.com/Run">'+Object.entries(props).map(([key,value])=>'<meta itemprop="'+key+'" content="'+escapeHTML(value)+'">').join('')+'</li>';}
$('#score-form').addEventListener('submit',async e=>{
 e.preventDefault();if(!endResult)return;const submittedRun=endResult,name=$('#player-name').value.trim();if(!/^[A-Za-z0-9 _-]{2,16}$/.test(name)){$('#submit-status').textContent='Use 2-16 letters, numbers, spaces, dashes or underscores.';return;}
 $('#submit-score').disabled=true;$('#submit-status').textContent='Saving your place…';storage.set('name',name);submittedRun.submittedAt=new Date(boardNow()).toISOString();
 try{const r=await fetch('/scores.html',{method:'POST',headers:{'Content-Type':'text/html',Range:'selector=#scores'},body:scoreHTML(submittedRun,name),signal:AbortSignal.timeout(12000)});
   if(!r.ok){if(r.status===422){const existing=await fetchScores();if(existing.some(x=>x.runKey===submittedRun.id)){if(endResult===submittedRun){$('#submit-status').textContent='This run is already on the board.';$('#submit-score').textContent='Saved';}return;}}throw Error('The score board returned '+r.status+'.');}
   if(endResult===submittedRun){$('#submit-status').textContent='Your score is saved. See where you placed on the leaderboard.';$('#submit-score').textContent='Saved';}if(scoresRequest)await scoresRequest.catch(()=>{});const saved=await fetchScores().catch(()=>null);if(saved&&endResult===submittedRun){const leader=rankedScores(saved,submittedRun.mode,currentDay())[0];if(submittedRun.record&&leader?.runKey===submittedRun.id){$('#result-title').textContent='You’re #1, '+name+'.';$('#record-badge').textContent='RECORD SAVED';$('#result-description').textContent='Your '+submittedRun.score.toLocaleString()+'-point finish is now leading the '+(submittedRun.mode==='daily'?'Daily Challenge':'Adventure')+' board.';}}
 }catch(err){if(endResult===submittedRun){$('#submit-status').textContent='Could not save yet. Your result is still here. Try again.';$('#submit-score').disabled=false;}}
});
async function fetchScores(){
 if(scoresRequest)return scoresRequest;
 scoresRequest=(async()=>{const r=await fetch('/scores.html?cb='+Date.now(),{headers:{Range:'selector=#scores'},cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Score board unavailable');
 const serverDate=Date.parse(r.headers.get('Date'));if(Number.isFinite(serverDate)){clockOffset=serverDate-Date.now();armDayRollover();}
 const doc=new DOMParser().parseFromString(await r.text(),'text/html');sharedScores=[...doc.querySelectorAll('li[itemtype$="/Run"]')].map(li=>{const v={};li.querySelectorAll('meta[itemprop]').forEach(m=>v[m.getAttribute('itemprop')]=m.getAttribute('content'));return v;}).filter(r=>r.player&&Number.isFinite(Number(r.score)));scoresUnavailable=false;rolloverDay();updateTopScore();return sharedScores;
 })();try{return await scoresRequest;}catch(error){scoresUnavailable=true;updateTopScore();throw error;}finally{scoresRequest=null;}
}
function leaderboardDay(){return currentDay();}
function updateTopScore(){
 const mode=game.mode==='daily'?'daily':'campaign',leader=sharedScores&&rankedScores(sharedScores,mode,currentDay())[0];
 $('#top-score-label').textContent=mode==='daily'?'Daily top':'Top score';$('#top-score').textContent=leader?Number(leader.score).toLocaleString():'-';
 $('#top-player').textContent=leader?leader.player:scoresUnavailable?'Unavailable':sharedScores?'Be the first':'Loading…';
 const description=leader?leader.player+' · '+Number(leader.score).toLocaleString()+' points':$('#top-player').textContent;
 $('#top-score-open').setAttribute('aria-label','Open '+(mode==='daily'?'daily':'adventure')+' leaderboard. '+description);$('#top-score-open').title=description+(scoresUnavailable&&leader?' (last loaded score)':'')+' · View leaderboard';$('#record-status').hidden=!(scoresUnavailable&&leader);updateChase();
}
function updateChase(){const leader=sharedScores&&rankedScores(sharedScores,game.mode==='daily'?'daily':'campaign',currentDay())[0];$('#score-chase').textContent=game.mode==='practice'?'Practice run':game.mode==='daily'&&runDay!==currentDay()?'Previous day’s challenge':leader?(game.score>Number(leader.score)?'Record beaten!':(Number(leader.score)-game.score+1).toLocaleString()+' to take the lead'):sharedScores?'Set the first score':'Chase the record';}
async function refreshTopScore(){try{await fetchScores();}catch{/* The score display reports unavailable; gameplay continues. */}}
function renderScores(rows){const daily=leaderMode==='daily';$('#score-detail-heading').textContent=daily?'AGE (MIN)':'WORLD';$('#score-caption').textContent=daily?'Daily Challenge leaderboard. Age is minutes since the score was submitted.':'Adventure leaderboard ranked by score, world reached, then time';$('#score-rows').replaceChildren();$('#leader-summary').hidden=!rows.length;if(rows.length){$('#leader-name').textContent=rows[0].player;$('#leader-points').textContent=Number(rows[0].score).toLocaleString();}rows.forEach((r,i)=>{const tr=document.createElement('tr');if(i===0)tr.className='leading';const age=scoreAge(r,boardNow());[String(i+1).padStart(2,'0'),r.player,daily?(age===null?'—':age.toLocaleString()):String(r.level).padStart(2,'0'),Number(r.score).toLocaleString()].forEach((t,col)=>{const td=document.createElement('td');td.textContent=t;if(daily&&col===2){td.dataset.scoreTime=r.submittedAt||'';td.title=age===null?'Submission time was not recorded for this older score.':'Minutes since submission';}tr.append(td);});$('#score-rows').append(tr);});}
async function loadScores(){if(scoreLoading)return;scoreLoading=true;const mode=leaderMode,day=leaderboardDay(),status=$('#score-status');status.classList.remove('state-panel');status.textContent=sharedScores?'Refreshing shared scores…':'Loading shared scores…';$('#scores-dialog').setAttribute('aria-busy','true');$('#refresh-scores').disabled=true;$('#score-skeleton').hidden=!!sharedScores;renderScores(sharedScores?rankedScores(sharedScores,mode,day):[]);
 try{const rows=rankedScores(await fetchScores(),mode,day);if(leaderMode!==mode||day!==leaderboardDay())return;renderScores(rows);status.classList.toggle('state-panel',!rows.length);status.textContent=(mode==='daily'?'Challenge date: '+day+' UTC · Resets at 00:00 UTC. ':'')+(rows.length?(mode==='daily'?'Age is minutes since submission.':'Top 25 adventure runs'):'No scores yet. Finish a run and save your name to set the first record.');
 }catch{if(leaderMode!==mode||day!==leaderboardDay())return;const rows=sharedScores?rankedScores(sharedScores,mode,day):[];status.classList.toggle('state-panel',!rows.length);status.textContent=rows.length?'Unable to refresh. Showing the last loaded scores. Try Refresh again.':'The shared board could not load. Use Refresh to try again. Your game can continue.';}
 finally{scoreLoading=false;$('#score-skeleton').hidden=true;$('#refresh-scores').disabled=false;$('#scores-dialog').setAttribute('aria-busy','false');if(leaderMode!==mode||day!==leaderboardDay())loadScores();}}
function armDayRollover(){clearTimeout(rolloverTimer);const now=boardNow(),next=Date.parse(currentDay()+'T00:00:00Z')+86400000;rolloverTimer=setTimeout(()=>{rolloverDay();armDayRollover();},Math.max(50,next-now+50));}
function rolloverDay(){const day=currentDay();if(boardDate===day)return;boardDate=day;$('#daily-detail').textContent=WORLDS[daySeed(day)%8].name+' · '+day+' UTC';updateTopScore();if(game.mode==='daily'&&runDay&&runDay!==day&&view!=='home')toast('A new UTC challenge day has started. This run belongs to '+runDay+'.');if($('#scores-dialog').open&&leaderMode==='daily'){renderScores(sharedScores?rankedScores(sharedScores,'daily',day):[]);$('#score-status').textContent='Challenge date: '+day+' UTC · A fresh daily board.';queueMicrotask(loadScores);}armDayRollover();}
document.addEventListener('visibilitychange',()=>{if(!document.hidden){rolloverDay();armDayRollover();if($('#scores-dialog').open)loadScores();else refreshTopScore();}});
window.addEventListener('focus',()=>{rolloverDay();armDayRollover();});
function openLeaderboard(){leaderMode=view!=='home'&&game.mode==='daily'?'daily':'campaign';$('#tab-campaign').setAttribute('aria-pressed',String(leaderMode==='campaign'));$('#tab-daily').setAttribute('aria-pressed',String(leaderMode==='daily'));openDialog('#scores-dialog');loadScores();}
$('#scores-open').onclick=openLeaderboard;$('#top-score-open').onclick=openLeaderboard;$('#result-scores').onclick=openLeaderboard;$('#refresh-scores').onclick=loadScores;for(const mode of ['campaign','daily'])$('#tab-'+mode).onclick=()=>{leaderMode=mode;$('#tab-campaign').setAttribute('aria-pressed',String(mode==='campaign'));$('#tab-daily').setAttribute('aria-pressed',String(mode==='daily'));loadScores();};
async function loadCatalog(){try{const r=await fetch('/worlds.html',{headers:{Range:'selector=#worlds'}});if(!r.ok)return;const doc=new DOMParser().parseFromString(await r.text(),'text/html');const catalog=new Map();for(const section of doc.querySelectorAll('[data-world][data-phase]')){
 const bricks=[...section.querySelectorAll('[data-brick]')].map(el=>{const b=JSON.parse(el.textContent);if(!Number.isFinite(b.x)||!Number.isFinite(b.y)||b.x<-9||b.x>9||b.y<-8||b.y>11||b.hp<1||b.hp>3)throw Error('Invalid level data');return b;});if(bricks.length>0&&bricks.length<=80)catalog.set(section.dataset.world+':'+section.dataset.phase,bricks);
 }game.catalog=catalog;}catch{/* Bundled level definitions keep the game playable. */}}
saveSettings();home();loadCatalog();refreshTopScore();all('#play,#resume,#daily,.world-card').forEach(button=>button.disabled=true);$('#stage').setAttribute('aria-busy','true');requestAnimationFrame(()=>requestAnimationFrame(initializeStage));if(matchMedia('(pointer:coarse)').matches)$('#launch-hint').textContent='TAP';
setInterval(()=>{if(document.hidden)return;rolloverDay();if(leaderMode==='daily'&&$('#scores-dialog').open)all('td[data-score-time]').forEach(td=>{const age=scoreAge({submittedAt:td.dataset.scoreTime},boardNow());td.textContent=age===null?'—':age.toLocaleString();});},1000);
armDayRollover();setInterval(()=>{if(document.hidden)return;rolloverDay();if($('#scores-dialog').open)loadScores();else if(view==='game')refreshTopScore();},60000);
let last=performance.now(),saveTimer=0,lastScenePaint=0,sceneDelta=0;
function frame(now){const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;if(stage){
 if(view==='game'&&!document.hidden){if(keys.has('ArrowLeft')||keys.has('KeyA'))game.move(game.target-dt*22);if(keys.has('ArrowRight')||keys.has('KeyD'))game.move(game.target+dt*22);accumulator+=dt;while(accumulator>=1/120){game.tick(1/120);accumulator-=1/120;}saveTimer+=dt;if(saveTimer>10&&view==='game'){saveTimer=0;persist();}hud();}
 if(view==='home'){game.time+=dt;game.paddle.x=settings.reducedMotion?0:Math.sin(now*.0006)*3.3;game.balls[0].x=game.paddle.x;game.balls[0].y=-9.5+(settings.reducedMotion?0:Math.sin(now*.0007)*.2);}
 if(view==='cut'&&!document.hidden&&!$('dialog[open]')){cutTime+=dt;const daily=game.mode==='daily',duration=settings.reducedMotion?4:daily?DAILY_DURATION:CINEMATICS[game.level].duration;$('#cut-progress-bar').style.transform='scaleX('+Math.min(1,cutTime/duration)+')';const frame=daily?dailyFrame(cutTime,stage.camera.aspect,settings.reducedMotion):cameraFrame(game.level,cutTime,stage.camera.aspect,settings.reducedMotion);$('#cutscene').style.setProperty('--story-opacity',String(frame.titleAlpha));$('#cutscene').style.setProperty('--story-shift',(1-frame.titleAlpha)*12+'px');if(cutTime>=duration)finishCut();}
 if(view==='champion'&&!document.hidden&&!$('dialog[open]')){cutTime+=dt;if(cutTime>=(settings.reducedMotion?4:game.mode==='daily'?DAILY_RECORD_DURATION:9))finishCelebration();}
 const victory=endResult?.record&&['champion','result'].includes(view)?endResult.mode:null,dialogs=all('dialog[open]'),musicActive=!document.hidden&&((!dialogs.length&&['game','cut','champion'].includes(view)&&game.state!=='paused')||(view==='result'&&victory&&dialogs.length===1&&$('#result-dialog').open));
 sound.update(musicActive,game.level,view==='cut'||view==='champion',victory);sceneDelta+=dt;const renderInterval=view==='home'||settings.lowEffects?1000/30:1000/60;if(!document.hidden&&now-lastScenePaint>=renderInterval){stage.render(game,sceneDelta,now/1000,view,cutTime);lastScenePaint=now;sceneDelta=0;}
 }if(now>toastUntil)$('#toast').classList.remove('visible');requestAnimationFrame(frame);}
requestAnimationFrame(frame);
