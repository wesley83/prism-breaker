// Isolated, visible acceptance controls. Never part of the published asset graph.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {filesUnder,ROOT} from './repository-check.mjs';
import {writeQaBootstrap} from './qa-bootstrap.mjs';
const dir='test-results/fixture';await fs.mkdir(dir,{recursive:true});await writeQaBootstrap(dir);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
await fs.copyFile('tools/visual-audit.mjs',dir+'/visual-audit.js');
const inputs=await Promise.all((await filesUnder(ROOT,'public')).map(async file=>[file,sha(await fs.readFile(file))]));
await fs.writeFile(dir+'/handbook-identity.json',JSON.stringify({runtimeDigest:sha(JSON.stringify(inputs)),inputs,fixtureSha256:sha(Buffer.concat([await fs.readFile(import.meta.filename),await fs.readFile('tools/visual-audit.mjs')])),planSha256:sha(await fs.readFile('review/requirements.html'))}));
const prefix=String.raw`
import {readMastery as hiReadMastery} from '/mastery.js';
// Styles requested before the network-client handshake can have been refused by
// an existing worker. Reload them after the handshake before inspecting layout.
await Promise.all([...document.querySelectorAll('link[rel="stylesheet"]')].map(link=>new Promise((resolve,reject)=>{const retry=link.cloneNode();retry.href=link.href+(link.href.includes('?')?'&':'?')+'fixture='+Date.now();retry.onload=resolve;retry.onerror=()=>reject(Error('Fixture stylesheet failed: '+retry.href));link.replaceWith(retry);})));
const hiSleep=ms=>new Promise(r=>setTimeout(r,ms));
const hiWait=async test=>{for(let n=0;n<400;n++){if(test())return;await hiSleep(25);}throw Error('Timed out waiting for the ordinary UI');};
const hiAssert=(condition,message)=>{if(!condition)throw Error(message);};
const hiErrors=[];addEventListener('error',e=>hiErrors.push(e.message));addEventListener('unhandledrejection',e=>hiErrors.push(String(e.reason)));
`;
let app=await fs.readFile('public/app.js','utf8');
app=app.replaceAll("from './","from '/").replaceAll("import('./","import('/").replace(/import \{setupOfflinePlay\} from '[^']+';/,"const setupOfflinePlay=()=>({refresh(){}});");
await fs.writeFile(dir+'/handbook-app.js',prefix+String.raw`
const hiFetch=globalThis.fetch.bind(globalThis);globalThis.fetch=(url,options)=>String(url).startsWith('/scores.html')?Promise.resolve(new Response('<ul id="scores"></ul>',{headers:{Date:new Date().toUTCString()}})):hiFetch(url,options);
`+app+String.raw`
globalThis.hi={
 ready:()=>!!stage,
 home,begin,openDialog,
 async reward(tier='world',intent=true,reduced=false,failSave=false,mode='practice',focus){
  home();settings.reducedMotion=reduced;applyTheme();await begin(mode,0,{official:true,mastery:intent,seed:8399});if(focus!==undefined)document.documentElement.classList.toggle('game-focus',focus);
  const worlds={};if(tier==='collection')for(const w of WORLDS)worlds[w.id]={medals:{restored:true,swift:true,flawless:true,skill:true}};
  worlds[game.world.id]={medals:{restored:true,swift:false,flawless:tier!=='medal',skill:true}};engagementUI.progress=hiReadMastery({version:1,worlds});
  game.engagement.report={id:game.world.id,seconds:10,score:5000,livesLost:tier==='medal'?1:0,peakCombo:99,precision:99,portals:99,chains:99};game.score=5000;game.state='cleared';
  const save=storage.set;try{if(failSave)storage.set=(key,value)=>key==='mastery'?false:save(key,value);handleEvent({type:'clear'});}finally{storage.set=save;}
  await hiWait(()=>view==='award'&&cutReady);cutTime=7;updateAward(7);stage.render(game,0,0,'award',7);await hiSleep(750);
  return {tier:engagementUI.celebration.tier,intent:engagementUI.masteryIntent};
 },
 async rewards(){
  home();$('#mastery-open').click();$('#mastery-grid .button').click();await hiWait(()=>view==='game'&&game.state==='ready');hiAssert(engagementUI.masteryIntent&&game.officialPractice,'collection entry lost mastery intent');
  await this.reward('world',true);hiAssert($('#award-title').textContent==='World mastered!','world-set title missing');hiAssert($('#award-medals').children.length===4,'missing award medals');$('#award-continue').click();hiAssert(view==='result'&&$('#result-collection').hidden===false,'mastery continuation hid collection');$('#mastery-retry').click();await hiWait(()=>view==='game');hiAssert(engagementUI.masteryIntent&&game.officialPractice&&!engagementUI.lastMedals,'retry lost intent or kept stale awards');
  await this.reward('collection',true);hiAssert($('#award-count').textContent.includes('64 OF 64'),'final collection count absent');$('#award-continue').click();$('#result-collection').click();hiAssert($('#mastery-dialog').open&&!$('#collection-complete').hidden,'full cabinet trophy absent');
  await this.reward('medal',false,false,false,'campaign');$('#award-continue').click();hiAssert(view==='cut','ordinary play skipped its world ending');$('#skip-cut').click();hiAssert(view==='game'&&game.level===1&&!engagementUI.lastMedals,'next world kept stale award data');
  await this.reward('medal',true,true,true);hiAssert(!$('#award-save-retry').hidden&&$('#award-save-status').textContent.includes('unavailable'),'award save failure hidden');$('#award-save-retry').click();hiAssert($('#award-save-retry').hidden,'award save retry failed');
  home();settings.reducedMotion=false;applyTheme();return {masteryEntry:true,worldSet:true,collectionFinale:true,retryIntent:true,collectionReturn:true,ordinaryStory:true,failedSaveRetry:true};
 },
 async engagement(){
  home();$('#mastery-open').click();hiAssert($('#mastery-dialog').open,'mastery collection did not open');hiAssert($('#mastery-grid').children.length===16,'collection omitted worlds');
  const play=$('#mastery-grid .button');play.click();await hiWait(()=>view==='game'&&game.officialPractice&&game.state==='ready');engagementUI.renderLive();
  hiAssert(!$('#engagement-strip').hidden,'official instructions missing');game.launch();game.power('sticky');const ball=game.balls[0];Object.assign(ball,{x:game.paddle.x,y:-10.05,vx:0,vy:-20});game.tick(1/60);lastHud='';hud();engagementUI.renderLive();
  hiAssert(ball.held&&$('#aim-controls').hidden&&!ball.aimable,'Sticky exposed angle selection');const stickyVelocity=[ball.holdVX,ball.holdVY];game.engagement.aim(-60);hiAssert(ball.holdVX===stickyVelocity[0]&&ball.holdVY===stickyVelocity[1],'Sticky direction was editable');$('#launch').click();hiAssert(!ball.held,'Sticky launch left ball held');
  game.effects.sticky=0;game.engagement.finisher='ready';game.engagement.arm();Object.assign(ball,{x:game.paddle.x,y:-10.05,vx:0,vy:-20});game.tick(1/60);lastHud='';hud();engagementUI.renderLive();hiAssert(ball.held&&!$('#aim-controls').hidden,'earned Precision aiming controls missing');
  $('#aim-angle').value='35';$('#aim-angle').dispatchEvent(new Event('input',{bubbles:true}));hiAssert($('#aim-value').textContent==='35°','aim label did not follow input');
  const angle=Math.atan2(game.balls[0].holdVX,game.balls[0].holdVY)*180/Math.PI;hiAssert(Math.abs(angle-35)<.01,'aim input did not alter the held ball');
  $('#launch').click();hiAssert(!game.balls[0].held,'ordinary launch left ball held');
  home();await begin('practice',12,{official:true,seed:8399});engagementUI.renderLive();hiAssert($('#encounter-live').textContent.includes('Storm'),'Thunder encounter instruction missing');
  home();return {collectionHasSixteenWorlds:true,officialPracticeStarts:true,stickyHasNoAngleSelection:true,precisionAimControlsAndLaunch:true,thunderInstructions:true};
 },
 async header(focus,scale){
  for(const [el,size]of this.headerFonts||[])el.style.fontSize=size;this.headerFonts=[];
  home();await begin('practice',12,{official:true,seed:8399});game.score=999999;game.lives=9;for(const kind of ['wide','multi','sticky','laser','pierce','slow','shield'])game.power(kind);game.balls.forEach(b=>b.held=false);game.state='paused';game.engagement.finisher='ready';lastHud='';hud();
  document.documentElement.classList.toggle('game-focus',focus);toast('Precision rig · Wide + Sticky: wider catches, released from the catch point.');toastUntil=Infinity;
  if(scale!==1){const nodes=$('#play-header').querySelectorAll('span,strong,small,p,button');this.headerFonts=[...nodes].map(el=>[el,el.style.fontSize]);const sizes=[...nodes].map(el=>parseFloat(getComputedStyle(el).fontSize)*scale+'px');[...nodes].forEach((el,i)=>el.style.fontSize=sizes[i]);}
  await hiSleep(150);
 },
 async headerTransitions(){
  const samples=[],measure=label=>{const r=canvas.getBoundingClientRect();samples.push({label,x:r.x,y:r.y,width:r.width,height:r.height,scrollY,rendererWidth:stage.width,rendererHeight:stage.height});};
  const update=async label=>{lastHud='';hud();await hiSleep(100);measure(label);};
  game.effects={};game.engagement.finisher='waiting';toastUntil=0;$('#toast').classList.remove('visible');await update('quiet');
  toast('Wide paddle');toastUntil=Infinity;await update('short notification');
  toast('Precision rig · Wide + Sticky: wider catches, released from the catch point.');toastUntil=Infinity;await update('wrapped notification');
  for(const kind of ['wide','sticky','laser','pierce','slow','shield'])game.power(kind);toastUntil=Infinity;await update('multiple powers');
  game.engagement.finisher='ready';await update('precision ready');
  game.score=1000000;game.lives=9;game.combo=12;await update('score wraps and combo');
  for(const kind of Object.keys(game.effects))game.effects[kind]=0;await update('powers expire');
  toastUntil=performance.now()-1;frame(performance.now());await update('notification expires');
  hiAssert(!$('#toast').classList.contains('visible'),'toast expiry path did not run');
  return samples;
 },
 async headerPointer(){
  await this.header(false,1);home();await begin('practice',0,{official:true});toastUntil=0;$('#toast').classList.remove('visible');await hiSleep(150);const capture=canvas.setPointerCapture,before=canvas.getBoundingClientRect().height;
  try{canvas.setPointerCapture=()=>{};canvas.dispatchEvent(new PointerEvent('pointerdown',{pointerId:91,pointerType:'touch',button:0,buttons:1,clientX:100,clientY:250,bubbles:true}));hiAssert(paddleInput.owner===91,'fixture did not acquire paddle input');toast('A longer notification must leave the arena stationary while your finger keeps steering the paddle.');await hiSleep(150);hiAssert(canvas.getBoundingClientRect().height===before,'notification resized arena');hiAssert(paddleInput.owner===91,'notification cancelled paddle steering');}
  finally{canvas.dispatchEvent(new PointerEvent('pointerup',{pointerId:91,pointerType:'touch',button:0,bubbles:true}));canvas.setPointerCapture=capture;home();}return {notificationKeepsArenaAndPointerStable:true,syntheticCaptureStub:true};
 },
 theme(value){settings.interfaceTheme=value;applyTheme();},
 async scene(index){closeDialogs();game.start(index===16?'daily':'practice',index===16?0:index);runDay=currentDay();beginCut();await hiWait(()=>cutReady);},
 async record(mode){closeDialogs();game.start(mode,mode==='campaign'?LAST_WORLD:0);runDay=currentDay();game.score=12345;finish(true);await hiWait(()=>view==='champion');},
 result(){closeDialogs();game.start('practice',0);game.score=12345;finish(false);},
 async storage(){
  await begin('campaign');game.score=1234;const old=Storage.prototype.setItem;
  try{Storage.prototype.setItem=function(k,v){if(k==='prism.save')throw Error('Injected quota refusal');return old.call(this,k,v);};
   openDialog('#pause-dialog');hiAssert(!checkpointSaved,'failed checkpoint claimed saved');hiAssert($('#pause-description').textContent.includes('could not be saved'),'missing checkpoint error');
   $('#quit').click();await hiWait(()=>$('#save-recovery-dialog').open);$('#save-recovery-dialog [data-recovery=stay]').click();await hiSleep(30);hiAssert(view==='game'&&game.score===1234,'failed save navigation replaced run');
  }finally{Storage.prototype.setItem=old;}
  $('#quit').click();await hiWait(()=>view==='home');hiAssert(storage.get('save').game.score===1234,'retry failed to preserve checkpoint');
  const name='handbook-score-'+crypto.randomUUID(),store=new offlineStore.constructor({name}),queue=new ScoreOutbox({store,send:async()=>{}}),run={id:crypto.randomUUID(),score:100,level:1,seconds:5,mode:'campaign',day:'all'};let conflict=false;
  try{await queue.enqueue(run,'QA');try{await queue.enqueue({...run,score:200},'QA');}catch(error){conflict=error.code==='score-conflict';}hiAssert(conflict,'IndexedDB did not retain the payload conflict');hiAssert((await queue.get(run.id)).run.score===100,'conflicting payload changed stored run');}finally{queue.dispose();const db=await store.open();db.close();indexedDB.deleteDatabase(name);}
  await begin('campaign');game.score=2345;$('#launch').click();hiAssert(document.activeElement===$('#game-canvas'),'game launch retained button focus');const steer=new KeyboardEvent('keydown',{key:'ArrowRight',code:'ArrowRight',bubbles:true,cancelable:true});$('#fullscreen').dispatchEvent(steer);hiAssert(steer.defaultPrevented&&keys.has('ArrowRight'),'button focus blocked game steering');$('#fullscreen').dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowRight',code:'ArrowRight',bubbles:true}));
  const render=stage.render;try{stage.render=()=>{throw Error('Injected frame failure');};await hiWait(()=>appLoop.failed);hiAssert(game.state==='paused'&&!$('#error').hidden,'frame failure did not expose paused recovery');hiAssert(storage.get('save').game.score===2345,'frame failure lost checkpoint');}finally{stage.render=render;appLoop.resume();last=performance.now();accumulator=0;$('#error').hidden=true;$('#unpause').disabled=false;home();}
  return {failedWriteUnconfirmed:true,stayPreservesRun:true,retryThenLeave:true,actualIDBPayloadConflict:true,gameKeyboardAfterButton:true,actualFrameFailurePausedAndSaved:true};
 },
 inspect:()=>({view,state:game.state,errors:hiErrors}),
};
`);
const appHTML=(await fs.readFile('public/index.html','utf8')).replace(/src="\/(?:app|bootstrap)\.js[^\"]*"/,'src="/__qa/network-bootstrap.js" data-qa-entry="/__qa/handbook-app.js"');
await fs.writeFile(dir+'/handbook-app.html',appHTML);
await fs.writeFile(dir+'/header-preview.html','<!doctype html><html lang="en"><meta charset="utf-8"><title>Gameplay header preview</title><style>body{margin:0;background:#111d20;color:#eef5e9;font:14px system-ui}p{margin:8px}iframe{display:block;width:390px;height:640px;border:0;max-width:100%}</style><p id="status">Preparing a 390px screen-filling gameplay sample…</p><iframe id="preview" src="/__qa/handbook-app.html" title="Busy gameplay header"></iframe><script type="module" src="/__qa/header-preview.js"></script></html>');
await fs.writeFile(dir+'/header-preview.js',`const f=document.querySelector('#preview');for(let i=0;i<600&&!f.contentWindow.hi?.ready();i++)await new Promise(r=>setTimeout(r,25));await f.contentWindow.hi.header(true,1);document.querySelector('#status').textContent='390px gameplay sample · multiple powers + encounter + notification';`);
await fs.writeFile(dir+'/reward-preview.html','<!doctype html><meta charset="utf-8"><title>Mastery celebration preview</title><style>body{background:#07131a;color:white;font:14px system-ui;margin:0}nav{padding:8px}iframe{border:0;width:390px;height:844px;display:block}</style><nav><label>Celebration <select id="tier"><option value="medal">New medal</option><option value="world" selected>World mastered</option><option value="collection">Prism Master</option></select></label> <button id="show">Show celebration</button><span id="status">Preparing</span></nav><iframe id="preview" src="/__qa/handbook-app.html"></iframe><script type="module" src="/__qa/reward-preview.js"></script>');
await fs.writeFile(dir+'/reward-preview.js',`const f=document.querySelector('#preview');async function show(){for(let i=0;i<600&&!f.contentWindow.hi?.ready();i++)await new Promise(r=>setTimeout(r,25));await f.contentWindow.hi.reward(document.querySelector('#tier').value,true);document.querySelector('#status').textContent='390 × 844 CSS viewport preview';}document.querySelector('#show').onclick=show;await show();`);
let editor=await fs.readFile('public/editor.js','utf8');editor=editor.replaceAll("from './","from '/").replaceAll("import('./","import('/").replace('editorSlug(location.pathname,location.search)',"editorSlug('/editor.html',location.search)");
await fs.writeFile(dir+'/handbook-editor.js',prefix+editor+String.raw`
globalThis.hi={ready:()=>!!world,inspect:()=>({name:world?.name,unsaved,errors:hiErrors}),async exercise(){
 await hiWait(()=>!!world);const before=working.serialize(),brick=world.formations[0].bricks[0],id=brick.id,node=working.root.querySelector('#f0-brick-'+id);
 choose(id);changeProperty('maxHp',3);await draftWrites;hiAssert(working.root.querySelector('#f0-brick-'+id)===node,'brick node identity changed');hiAssert(working.read().formations[0].bricks[0].maxHp===3,'live DOM lost form edit');
 const originalWrite=editorDrafts.write;try{editorDrafts.write=async()=>{throw Error('Injected transaction refusal');};changeProperty('maxHp',2);await draftWrites;hiAssert(unsaved,'failed draft confirmed');
  const leaving=preserveDraft();await hiWait(()=>$('#save-recovery-dialog').open);$('#save-recovery-dialog [data-recovery=stay]').click();hiAssert(await leaving===false,'failed draft allowed leave');hiAssert(working.read().formations[0].bricks[0].maxHp===2,'draft vanished after failure');
 }finally{editorDrafts.write=originalWrite;}
 hiAssert(await saveDraft(),'retry failed');
 const generation=working.generation,serialized=working.serialize();choose(null);hiAssert(working.generation===generation&&working.serialize()===serialized,'selection persisted as content');choose(id);
 const preview=$('#preview').onclick();await hiWait(()=>previewReady);const close=$('#preview-dialog [data-close]'),space=new KeyboardEvent('keydown',{key:' ',code:'Space',bubbles:true,cancelable:true});close.dispatchEvent(space);hiAssert(!space.defaultPrevented,'preview stole Space from Close');const steer=new KeyboardEvent('keydown',{key:'a',code:'KeyA',bubbles:true,cancelable:true});close.dispatchEvent(steer);hiAssert(steer.defaultPrevented&&keys.has('KeyA'),'focused control disabled preview steering');close.dispatchEvent(new KeyboardEvent('keyup',{key:'a',code:'KeyA',bubbles:true}));$('#preview-launch').click();hiAssert(document.activeElement===$('#preview-canvas'),'launch left focus on button');for(let i=0;i<120;i++)previewGame.tick(1/120);$('#preview-dialog').close();await preview;hiAssert(working.serialize()===serialized,'preview changed authored data');hiAssert(selection.has(id),'preview lost selection');
 const first=await editorDrafts.read(world.slug),other=await editorDrafts.write(world.slug,{html:first.html,baseHTML:first.baseHTML},first.revision);hiAssert(other.saved,'second client write failed');
 const stale=await editorDrafts.write(world.slug,{html:before,baseHTML:''},first.revision);hiAssert(stale.conflict&&!stale.saved,'stale draft overwrote newer snapshot');draftRevision=other.revision;
 const oldName=$('#world-name').value;$('#world-name').value=oldName+' revised';$('#world-details').dispatchEvent(new Event('input',{bubbles:true}));$('#show-html').click();hiAssert($('#html-dialog').open&&$('#html-source').value.includes(oldName+' revised'),'HTML omitted current details');$('#html-dialog').close();await draftWrites;hiAssert(working.read().name.endsWith(' revised'),'export used a default instead of current input');
 if(baseHTML){$('#world-name').value=oldName+' publish';$('#world-details').dispatchEvent(new Event('input',{bubbles:true}));$('#publish').click();hiAssert($('#publish-dialog').open&&working.read().name===oldName+' publish','publish omitted current details');$('#publish-dialog').close();await draftWrites;}
 working.restore(before);world=working.project();detailsDirty=false;render();await saveDraft();
 const url='/__qa/import-must-not-fetch.png',hostile=worldDocument(world).replace('</article>','<img src="'+url+'"><iframe src="'+url+'"></iframe></article>');parseWorld(hostile);await hiSleep(80);hiAssert(!performance.getEntriesByName(location.origin+url).length,'import fetched a resource');
 return {liveValues:true,identityPreserved:true,selectionNotPersisted:true,failedDraftRetained:true,retry:true,transactionConflict:true,previewIsolation:true,previewKeyboardOwnership:true,dirtyDetailsInHTMLAndPublish:true,importNetworkIsolation:true,errors:hiErrors};
}};
`);
const editorHTML=(await fs.readFile('public/editor.html','utf8')).replace(/<script id="editor-bootstrap">[\s\S]*?<\/script>/,'<link rel="stylesheet" href="/editor.css"><script type="module" src="/__qa/network-bootstrap.js" data-qa-entry="/__qa/handbook-editor.js"></script>');
// The local workshop route identifies the requested world through its query adapter.
await fs.writeFile(dir+'/handbook-editor.html',editorHTML);
await fs.writeFile(dir+'/handbook.html','<!doctype html><html lang="en"><meta charset="utf-8"><title>Handbook acceptance lab</title><style>body{font:16px/1.5 system-ui;background:#102025;color:#eef3ed;margin:20px}button{font:inherit;padding:12px}iframe{display:block;border:1px solid #afc0bb;margin-top:15px;width:1100px;height:800px;max-width:100%}pre{white-space:pre-wrap;max-height:45vh;overflow:auto}</style><h1>Handbook acceptance lab</h1><button id="run">Run recovery, editor and layout checks</button> <button id="performance">Run controlled and sustained performance checks</button><p id="status" role="status">Ready</p><pre id="results"></pre><div id="frames"></div><script type="module" src="/__qa/network-bootstrap.js" data-qa-entry="/__qa/handbook-lab.js"></script></html>');
await fs.writeFile(dir+'/handbook-lab.js',String.raw`
import {Game} from '/engine.js';import {Stage} from '/scene.js';import {rng} from '/levels.js';import {flashDelta,flashSummary} from '/__qa/visual-audit.js';
const $=s=>document.querySelector(s),sleep=ms=>new Promise(r=>setTimeout(r,ms)),assert=(v,m)=>{if(!v)throw Error(m);};const receipt={schema:1,utc:new Date().toISOString(),environment:navigator.userAgent,cases:{},limits:['Local Chromium iframe sizes are CSS viewport fixtures, not physical phone/OS or trusted touch evidence.','Synthetic form/click dispatch checks application paths, not native fullscreen/share activation.','Accessibility observations are scoped; no blanket WCAG or nonvisual gameplay claim.']};
const identity=await fetch('/__qa/handbook-identity.json').then(r=>r.json());Object.assign(receipt,identity);
const download=document.createElement('button');download.textContent='Download evidence';download.id='download-evidence';$('#results').before(download);download.onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(receipt,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='handbook-browser.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};
const show=()=>$('#results').textContent=JSON.stringify(receipt,null,2);
async function frame(url,width=1100,height=800){const f=document.createElement('iframe');f.style.width=width+'px';f.style.height=height+'px';f.src=url;$('#frames').replaceChildren(f);await new Promise((r,j)=>{f.onload=r;f.onerror=j;});for(let n=0;n<600;n++){if(f.contentWindow.hi?.ready())return f;await sleep(25);}throw Error('Frame did not become ready');}
const bounds=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),luma=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
function contrast(element,background){const style=getComputedStyle(element),fg=luma(rgb(style.color)),bg=luma(rgb(getComputedStyle(background).backgroundColor));return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05);}
function textContrast(element,win){let background=[255,255,255];const chain=[];for(let node=element;node;node=node.parentElement)chain.push(node);for(const node of chain.reverse()){const c=rgb(win.getComputedStyle(node).backgroundColor),alpha=c[3]??1;background=background.map((v,i)=>(c[i]??0)*alpha+v*(1-alpha));}const fg=rgb(win.getComputedStyle(element).color),alpha=fg[3]??1,color=background.map((v,i)=>(fg[i]??0)*alpha+v*(1-alpha)),a=luma(color),b=luma(background);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);}
$('#run').onclick=async()=>{for(const b of document.querySelectorAll('button'))b.disabled=true;try{
 $('#status').textContent='Checking actual save-failure and editor paths…';let f=await frame('/__qa/handbook-app.html');receipt.cases.storage={passed:true,...await f.contentWindow.hi.storage()};
 receipt.cases.engagement={passed:true,...await f.contentWindow.hi.engagement()};
 receipt.cases.rewards={passed:true,...await f.contentWindow.hi.rewards()};
 f=await frame('/__qa/handbook-editor.html?world=prism-garden');const edited=await f.contentWindow.hi.exercise();assert(!edited.errors.length,'Editor errors: '+edited.errors.join(';'));receipt.cases.editor={passed:true,...edited};
 $('#status').textContent='Checking viewport, text enlargement, contrast and dialog states…';f=await frame('/__qa/handbook-app.html');const w=f.contentWindow,d=f.contentDocument,observations=[];
 for(const [width,height]of [[320,640],[390,844],[844,390],[1100,800]]){f.style.width=width+'px';f.style.height=height+'px';await sleep(100);
  for(const theme of ['dark','light'])for(const selector of ['#help-dialog','#settings-dialog','#scores-dialog','#result-dialog','#mastery-dialog']){
   w.hi.theme(theme);if(selector==='#result-dialog')w.hi.result();else{w.hi.home();w.hi.openDialog(selector);}await sleep(40);const dialog=d.querySelector(selector);for(const detail of dialog.querySelectorAll('details'))detail.open=true;const size=bounds(dialog);assert(size.width<=width+1,selector+' exceeds '+width);
   const heading=dialog.querySelector('h2'),ratio=contrast(heading,dialog);assert(ratio>=4.5,selector+' heading contrast '+ratio);
   assert(dialog.hasAttribute('aria-labelledby'),selector+' missing accessible name');if(dialog.scrollWidth>dialog.clientWidth+2)receipt.layoutDiagnostic={width,panel:size,client:dialog.clientWidth,scroll:dialog.scrollWidth,overflow:[...dialog.querySelectorAll('*')].map(el=>({tag:el.tagName,id:el.id,class:el.className,...bounds(el),text:el.textContent.slice(0,40)})).filter(el=>el.x+el.width>size.x+size.width-10).slice(0,12)};assert(dialog.scrollWidth<=dialog.clientWidth+2,selector+' horizontal overflow at '+width);
   const enlarged=[...dialog.querySelectorAll('h2,h3,p,label,button,input,select,td,th,span,strong,small,kbd,code')].map(el=>[el,el.style.fontSize,parseFloat(w.getComputedStyle(el).fontSize)*2+'px']);for(const [el,,size]of enlarged)el.style.fontSize=size;
   await sleep(30);const overflow=dialog.scrollWidth-dialog.clientWidth;assert(overflow<=2,selector+' 200% text overflow at '+width+': '+overflow);
   const controls=[...dialog.querySelectorAll('button,input,select')].filter(el=>el.getClientRects().length&&!el.disabled);for(const el of controls){el.focus();el.scrollIntoView({block:'nearest'});const r=bounds(el),panel=bounds(dialog);assert(r.y+r.height>panel.y&&r.y<panel.y+panel.height,'focus completely obscured: '+selector+' '+width+' '+el.id+' '+el.textContent.slice(0,45)+' '+JSON.stringify({r,panel}));}
   let minimum=Infinity,textNodes=0;const walker=d.createTreeWalker(dialog,4);while(walker.nextNode()){const el=walker.currentNode.parentElement;if(!walker.currentNode.textContent.trim()||!el.getClientRects().length||el.closest('button:disabled')||el.closest('svg'))continue;const style=w.getComputedStyle(el),large=parseFloat(style.fontSize)>=24||parseFloat(style.fontSize)>=18.66&&Number(style.fontWeight)>=700,ratio=textContrast(el,w);minimum=Math.min(minimum,ratio);textNodes++;assert(ratio>=(large?3:4.5),'Low text contrast '+ratio.toFixed(2)+' in '+selector+' ('+walker.currentNode.textContent.slice(0,25)+')');}
   observations.push({width,height,theme,dialog:selector,headingContrast:+ratio.toFixed(2),minimumTextContrast:+minimum.toFixed(2),textNodes,textEnlargement:2,horizontalOverflow:overflow,controls:controls.length});for(const [el,font]of enlarged)el.style.fontSize=font;
  }
 }
 const headers=[];for(const [width,height]of [[320,640],[390,844],[844,390],[1100,800]])for(const focus of [false,true])for(const scale of [1,2]){f.style.width=width+'px';f.style.height=height+'px';await sleep(60);await w.hi.header(focus,scale);const header=d.querySelector('#play-header'),r=bounds(header),canvas=bounds(d.querySelector('#game-canvas')),rows=[...header.children].filter(el=>el.getClientRects().length).map(bounds);assert(header.scrollWidth<=header.clientWidth+2,'Gameplay header horizontal overflow '+width+' '+focus+' '+scale);for(let i=1;i<rows.length;i++)assert(rows[i].y>=rows[i-1].y+rows[i-1].height-1,'Gameplay text rows overlap '+width+' '+focus+' '+scale);assert(canvas.y>=r.y+r.height+5&&canvas.height>=bounds(d.querySelector('#stage')).height*.35,'Header intrudes into arena '+width+' '+focus+' '+scale+' '+JSON.stringify({r,canvas}));const columns=[...d.querySelector('#hud').children].map(bounds);for(let i=1;i<columns.length;i++)assert(columns[i].x>=columns[i-1].x+columns[i-1].width-1,'HUD columns overlap');const transitions=await w.hi.headerTransitions(),baseline=transitions[0];for(const sample of transitions)for(const key of ['x','y','width','height','scrollY','rendererWidth','rendererHeight'])assert(Math.abs(sample[key]-baseline[key])<.1,'Notification moved arena '+width+' '+focus+' '+scale+' '+sample.label+' '+key+': '+baseline[key]+' to '+sample[key]);headers.push({width,height,focus,textScale:scale,header:r,canvas,scrollable:header.scrollHeight>header.clientHeight+1,transitions});}const headerPointer=await w.hi.headerPointer();w.hi.home();
 const rewardLayouts=[];for(const [width,height]of [[320,640],[390,844],[844,390],[1100,800]])for(const tier of ['medal','world','collection'])for(const scale of [1,2]){f.style.width=width+'px';f.style.height=height+'px';await sleep(50);await w.hi.reward(tier,true,scale===2,false,'practice',width<1000);const panel=d.querySelector('#mastery-celebration'),nodes=[...panel.querySelectorAll('h2,p,span,strong,small,button')],original=nodes.map(n=>n.style.fontSize),sizes=nodes.map(n=>parseFloat(w.getComputedStyle(n).fontSize)*scale+'px');nodes.forEach((n,i)=>n.style.fontSize=sizes[i]);await sleep(30);assert(panel.scrollWidth<=panel.clientWidth+2,'Reward horizontal overflow '+width+' '+tier+' '+scale);const heading=d.querySelector('#award-title'),button=d.querySelector('#award-continue');assert(textContrast(heading,w)>=4.5,'Reward title contrast');button.focus();button.scrollIntoView({block:'nearest'});const b=bounds(button),p=bounds(panel);assert(b.y>=p.y-1&&b.y+b.height<=p.y+p.height+1,'Reward action unreachable');rewardLayouts.push({width,height,tier,scale,reducedMotion:scale===2,panel:p,button:b});nodes.forEach((n,i)=>n.style.fontSize=original[i]);}receipt.cases.rewards.layouts=rewardLayouts;w.hi.home();
 const stories=[];for(const [width,height]of [[320,640],[844,390]]){f.style.width=width+'px';f.style.height=height+'px';await sleep(100);for(let index=0;index<17;index++){await w.hi.scene(index);await sleep(15);const title=d.querySelector('#cut-title'),story=d.querySelector('#cut-story'),button=d.querySelector('#skip-cut'),original=[title,story,button].map(el=>el.style.fontSize);for(const el of [title,story,button])el.style.fontSize=parseFloat(w.getComputedStyle(el).fontSize)*2+'px';await sleep(15);const panel=title.parentElement;assert(panel.scrollWidth<=panel.clientWidth+2,'Enlarged story overflows '+index+' at '+width);const r=bounds(button);assert(r.width>0&&r.x+r.width<=width+1,'Story action clipped');stories.push({index,width,height,heading:bounds(title),story:bounds(story),action:r});[title,story,button].forEach((el,i)=>el.style.fontSize=original[i]);}
  for(const mode of ['campaign','daily']){await w.hi.record(mode);const button=d.querySelector('#claim-record');button.focus();button.scrollIntoView({block:'nearest'});assert(bounds(button).width>0,'Record action missing');stories.push({ending:mode,width,height,action:bounds(button)});}
 }
 w.hi.home();assert(!w.hi.inspect().errors.length,'Game errors: '+w.hi.inspect().errors.join('; '));receipt.cases.layout={passed:true,observations,headers,headerPointer,stories,limits:['Virtual keyboards/browser bars/safe insets are separate from iframe resizing.','Gameplay focus class is a CSS fixture, not native fullscreen authorization.','Contrast checks cover sampled opaque dialog headings; other text/graphics require their own scoped analysis.']};
 $('#status').textContent='Recovery, editor and layout checks passed';
 }catch(error){receipt.failure=String(error.stack||error);$('#status').textContent='Check failed: '+error.message;}finally{show();for(const b of document.querySelectorAll('button'))b.disabled=false;}};
const stats=values=>{const sorted=[...values].sort((a,b)=>a-b);return {count:values.length,mean:values.reduce((a,b)=>a+b,0)/values.length,p95:sorted[Math.ceil(sorted.length*.95)-1],p99:sorted[Math.ceil(sorted.length*.99)-1],max:sorted.at(-1)};};
$('#performance').onclick=async()=>{for(const b of document.querySelectorAll('button'))b.disabled=true;try{
 $('#frames').replaceChildren();const {Stage:Before}=await import('/__qa/performance-baseline/scene.js');const settings={lowEffects:false,classicMode:false,reducedMotion:false},runs=[];
 for(const version of ['before','after','after','before']){
  const canvas=document.createElement('canvas');canvas.style.width='900px';canvas.style.height='560px';$('#frames').replaceChildren(canvas);const game=new Game();game.start('practice',15,8399);const stage=new (version==='before'?Before:Stage)(canvas,settings);await stage.prepare(game);
  // Controlled body/edge batching attribution: same crystals, 46 scenery objects,
  // no particles/drops, same physical material tier, direct output and ratio 1.
  stage.renderer.setPixelRatio(1);stage.renderer.setSize(900,560,false);for(const pass of stage.composer?.passes??[])pass.dispose?.();stage.composer?.dispose();stage.composer=null;stage.renderer.info.autoReset=false;const cpu=[],calls=[],gaps=[];let last=0;
  for(let i=0;i<330;i++){await new Promise(r=>requestAnimationFrame(r));const now=performance.now();if(document.hidden)throw Error('Keep lab foreground for measurement');stage.renderer.info.reset();const start=performance.now();stage.render(game,1/60,i/60,'game');if(i>=30){cpu.push(performance.now()-start);calls.push(stage.renderer.info.render.calls);gaps.push(now-last);}last=now;}
  runs.push({version,cpuMS:stats(cpu),draws:stats(calls),frameMS:stats(gaps),drawingBuffer:[canvas.width,canvas.height]});stage.renderer.dispose();stage.renderer.forceContextLoss();$('#status').textContent='Controlled comparison '+runs.length+'/4';
 }
 const canvas=document.createElement('canvas');canvas.style.width='900px';canvas.style.height='560px';$('#frames').replaceChildren(canvas);const game=new Game();game.start('practice',15,8399);const stage=new Stage(canvas,settings);await stage.prepare(game);const gaps=[],cpu=[],memory=[],random=rng(991);let last=performance.now();
 for(let i=0;i<3600;i++){const now=await new Promise(r=>requestAnimationFrame(r));if(document.hidden)throw Error('Sustained check interrupted by hidden page');const delta=now-last;last=now;
  if(i%120===0){game.start('practice',Math.floor(i/120)%16);stage.reset();memory.push({...stage.renderer.info.memory});}
  if(i%3===0)stage.particle((random()-.5)*12,4,'#79e6ff',26);const start=performance.now();stage.render(game,1/60,i/60,'game');stage.observeFrame(delta,true);cpu.push(performance.now()-start);gaps.push(delta);
  if(i%120===0)$('#status').textContent='Sustained renderer '+Math.round(i/60)+'/60 seconds';
 }
 const sustained={frameMS:stats(gaps),cpuMS:stats(cpu),resourceSamples:memory,particleCount:stage.particleBatch.count,rawFrameMS:gaps};assert(sustained.particleCount<=192,'particle capacity exceeded');assert(cpu.every(Number.isFinite),'nonfinite render timing');
 const before=runs.filter(r=>r.version==='before').reduce((s,r)=>s+r.draws.mean,0)/2,after=runs.filter(r=>r.version==='after').reduce((s,r)=>s+r.draws.mean,0)/2;assert(after<before*.6,'Controlled batching failed drawing budget');assert(sustained.frameMS.p95<=25&&sustained.frameMS.max<=250&&sustained.cpuMS.p95<=12,'Sustained desktop frame budget exceeded');
 const screen=document.createElement('canvas');screen.width=160;screen.height=100;const context=screen.getContext('2d',{willReadFrequently:true}),flashes=[];
 for(let index=0;index<22;index++){const mode=index>=19?'award':index<16||index===17?'cut':'champion';game.start(index>=17&&index<19?'daily':'campaign',index<16?index:index===16?15:0);stage.awardTier=['medal','world','collection'][index-19];stage.reset();await stage.prepareCut(game,mode);let previous=null;const changes=[];for(let i=0;i<180;i++){stage.render(game,1/60,i/60,mode,(index>=19?0:5)+i/60);context.drawImage(canvas,0,0,160,100);const pixels=context.getImageData(0,0,160,100).data;if(previous)changes.push(flashDelta(previous,pixels));previous=pixels;}const summary=flashSummary(changes);flashes.push({index,...summary});assert(!summary.flagged,'Large-area flashing flagged in scene '+index);$('#status').textContent='Conservative scene flash screen '+(index+1)+'/22';await sleep(0);}
 stage.renderer.dispose();
 receipt.cases.performance={passed:true,controlled:runs,sustained,flashes,limits:['One local Chromium GPU/context; CPU submission is not GPU timing.','No energy, thermal or physical-device inference; 3600 frames are a bounded sustained sample.','Controlled comparison isolates a quiet scene; effect policies are assessed separately.','Flash screen samples three seconds per scene at a declared downsampled resolution and is not full WCAG certification.']};$('#status').textContent='Performance checks complete';
 }catch(error){receipt.performanceFailure=String(error.stack||error);$('#status').textContent='Performance check failed: '+error.message;}finally{show();for(const b of document.querySelectorAll('button'))b.disabled=false;}};
`);
console.log('Handbook lab: http://127.0.0.1:4173/__qa/handbook.html');
