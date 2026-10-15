import {editorSlug} from './world-identity.js';
import {THEMES} from './world-schema.js';
import {WORLDS} from './levels.js';
import {WORLD_SLUGS,originalWorld,normalizeWorld,parseWorld,worldHTML,worldDocument,formationCatalog} from './world-format.js';
import {Game} from './engine.js?v=9';
import {attachBrickDOM} from './brick-events.js';

const $=s=>document.querySelector(s),clone=v=>structuredClone(v);
let world,phase=0,selected=null,tool='select',baseHTML='',history=[],future=[],drag=null,stage,previewGame,detachDOM,previewReady=false,previewClock=0;
const keys=new Set();const draftKey=slug=>'prism.world-draft.'+slug;
const message=text=>$('#editor-status').textContent=text;
const safeStorage={get(key){try{return JSON.parse(localStorage.getItem(key));}catch{return null;}},set(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}};
const current=()=>world.formations[phase];
const selectedBrick=()=>current().bricks.find(b=>b.id===selected);
const slugFromPath=editorSlug(location.pathname,location.search);
const index=WORLD_SLUGS.indexOf(slugFromPath);
WORLDS.forEach((w,i)=>$('#edit-world').add(new Option(w.name,WORLD_SLUGS[i])));
if(index<0){const missing=new Option('Choose a world','');missing.disabled=true;$('#edit-world').add(missing,0);}$('#edit-world').value=index>=0?slugFromPath:'';
$('#edit-world').onchange=()=>{location.href='/editor/'+$('#edit-world').value;};

function saveDraft(){if(!world)return;
 const saved=safeStorage.set(draftKey(world.slug),{world,baseHTML,savedAt:Date.now()});
 message(saved?(baseHTML?'Draft saved':'Offline draft saved; reload published before publishing')+' · '+world.name+' · Formation '+(phase+1):'Draft storage is full. Download your world to keep it.');
}
function remember(){history.push(clone(world));if(history.length>50)history.shift();future=[];}
function commit(change){if(!world)return false;const previous=clone(world);try{change();world=normalizeWorld(world);phase=Math.min(phase,world.formations.length-1);populatePhases();history.push(previous);if(history.length>50)history.shift();future=[];render();saveDraft();return true;}catch(error){world=previous;message(error.message);return false;}}
function syncTypes(){
 const value=$('#brick-type').value;$('#brick-type').replaceChildren();
 for(const [key,label]of [['normal','Regular'],['armor','Armored'],['explode','Explosive'],['switch','Switch']])$('#brick-type').add(new Option(label,key));
 for(const t of world.types)$('#brick-type').add(new Option(t.name,t.type));
 $('#brick-type').value=[...$('#brick-type').options].some(o=>o.value===value)?value:'normal';
}
function fillInspector(){
 const b=world?selectedBrick():null;$('#inspector-title').textContent=b?'Brick '+b.id:'Your brush';$('#delete-brick').hidden=!b;$('#apply-brick').textContent=b?'Apply changes':'Set brush';
 if(b){$('#brick-type').value=b.customType||b.kind;$('#brick-hp').value=String(b.maxHp);$('#brick-color').value=b.color;$('#brick-x').value=b.x;$('#brick-y').value=b.y;$('#brick-moving').checked=b.moving;}
}
const left=x=>(x+10)/20*100,top=y=>(11-y)/20*100;
function place(node,b){node.style.left=left(b.x-b.w/2)+'%';node.style.top=top(b.y+b.h/2)+'%';node.style.width=b.w/20*100+'%';node.style.height=b.h/20*100+'%';}
function render(){
 $('#publish').disabled=!baseHTML;for(const key of ['name','note','tag','story','mechanic','shape','music','sky','accent'])$('#world-'+key).value=world[key];$('#world-colors').value=world.colors.join(' ');
 $('#undo').disabled=!history.length;$('#redo').disabled=!future.length;syncTypes();
 const root=new DOMParser().parseFromString(worldHTML(world),'text/html').querySelector('#world');
 for(const section of root.querySelectorAll('[itemtype="urn:Formation"]'))section.hidden=Number(section.querySelector('meta[itemprop="phase"]').content)!==phase;
 const section=root.querySelector('#formation-'+phase);
 for(const b of current().bricks){
  const node=section.querySelector('#f'+phase+'-brick-'+b.id);place(node,b);node.style.setProperty('--brick-color',b.color);node.setAttribute('role','button');node.tabIndex=0;node.dataset.brickId=String(b.id);node.classList.toggle('selected',b.id===selected);
  const custom=world.types.find(t=>t.type===b.customType);node.setAttribute('aria-label',(custom?.name||b.kind)+' brick '+b.id+', '+b.maxHp+' hit'+(b.maxHp>1?'s':'')+', x '+b.x+', y '+b.y);node.setAttribute('aria-pressed',String(b.id===selected));
  const rgb=b.color.slice(1).match(/../g).map(v=>parseInt(v,16));node.style.color=rgb[0]*.299+rgb[1]*.587+rgb[2]*.114>130?'#102025':'#f3f7fa';
  const label=document.createElement('span');label.textContent=b.kind==='armor'||b.maxHp>1?String(b.maxHp):b.kind==='explode'?'★':b.kind==='switch'?'◇':custom?custom.name.slice(0,1).toUpperCase():'';label.setAttribute('aria-hidden','true');node.append(label);
 }
 [...section.querySelectorAll('[itemtype="urn:Barrier"]')].forEach((node,i)=>place(node,current().barriers[i]));
 [...section.querySelectorAll('[itemtype="urn:Portal"]')].forEach((node,i)=>{node.style.left=left(current().portals[i].x)+'%';node.style.top=top(current().portals[i].y)+'%';});
 $('#edit-board').replaceChildren(root);$('#brick-count').textContent=current().bricks.length+' / 80 bricks';fillInspector();
}
function brush(){const value=$('#brick-type').value,type=world.types.find(t=>t.type===value);return {kind:type?.base||value,...(type?{customType:type.type}:{}),maxHp:Number($('#brick-hp').value),color:$('#brick-color').value,moving:$('#brick-moving').checked};}
function choose(id){selected=id;for(const node of $('#edit-board').querySelectorAll('[data-brick-id]')){const on=Number(node.dataset.brickId)===id;node.classList.toggle('selected',on);node.setAttribute('aria-pressed',String(on));}fillInspector();}
function position(event){const r=$('#edit-board').getBoundingClientRect(),x=(event.clientX-r.left)/r.width*20-10,y=11-(event.clientY-r.top)/r.height*20;const col=Math.max(-4,Math.min(4,Math.round(x/1.93))),row=Math.max(0,Math.min(15,Math.round((9-y)/1.05)));return {x:Math.round(col*1.93*100)/100,y:Math.round((9-row*1.05)*100)/100,row};}
function paint(event){const p=position(event),f=current();if(f.bricks.length>=80)throw Error('A formation supports at most 80 bricks');if(f.bricks.some(b=>Math.abs(b.x-p.x)<.4&&Math.abs(b.y-p.y)<.3))return false;const b=brush();f.bricks.push({id:f.nextBrickId++,...p,w:1.7,h:.72,baseX:p.x,...b,hp:b.maxHp});return true;}
for(const name of ['select','paint','erase'])$('#tool-'+name).onclick=()=>{tool=name;for(const n of ['select','paint','erase'])$('#tool-'+n).setAttribute('aria-pressed',String(n===name));if(name==='paint'){selected=null;fillInspector();}message(name==='paint'?'Click or drag on empty grid cells to add bricks.':name==='erase'?'Click a brick to erase it.':'Select a brick to inspect or move it.');};
$('#edit-board').onpointerdown=event=>{
 if(!world||event.button!==0)return;const node=event.target.closest('[data-brick-id]');
 if(tool==='erase'){if(node)commit(()=>{current().bricks=current().bricks.filter(b=>b.id!==Number(node.dataset.brickId));selected=null;});return;}
 if(tool==='select'&&!node){choose(null);return;}
 if(node&&tool==='select')choose(Number(node.dataset.brickId));
 drag={before:clone(world),changed:false,id:selected,pointer:event.pointerId};$('#edit-board').setPointerCapture(event.pointerId);
 if(tool==='paint')try{drag.changed=paint(event);if(drag.changed)render();}catch(e){message(e.message);}
};
$('#edit-board').onpointermove=event=>{
 if(!drag||drag.pointer!==event.pointerId)return;
 if(tool==='paint'){try{if(paint(event)){drag.changed=true;render();}}catch(e){message(e.message);}return;}
 const b=selectedBrick(),p=position(event);if(!b||b.x===p.x&&b.y===p.y)return;Object.assign(b,p,{baseX:p.x});drag.changed=true;render();
};
function endDrag(){if(!drag)return;const before=drag.before,changed=drag.changed;drag=null;if(!changed)return;try{world=normalizeWorld(world);history.push(before);future=[];render();saveDraft();}catch(e){world=before;render();message(e.message);}}
$('#edit-board').onpointerup=endDrag;$('#edit-board').onpointercancel=endDrag;
$('#edit-board').onclick=event=>{const node=event.target.closest('[data-brick-id]');if(tool==='select'&&node)choose(Number(node.dataset.brickId));};
$('#edit-board').onkeydown=event=>{
 if(event.key==='Enter'||event.key===' '){const node=event.target.closest('[data-brick-id]');if(node){event.preventDefault();choose(Number(node.dataset.brickId));}return;}
 if(event.key==='Delete'||event.key==='Backspace'){if(selectedBrick()){event.preventDefault();$('#delete-brick').click();}return;}
 const delta={ArrowLeft:[-.1,0],ArrowRight:[.1,0],ArrowUp:[0,.1],ArrowDown:[0,-.1]}[event.key];if(!delta||!selectedBrick())return;
 event.preventDefault();const id=selected;commit(()=>{const b=selectedBrick();b.x=Math.round((b.x+delta[0])*100)/100;b.y=Math.round((b.y+delta[1])*100)/100;b.baseX=b.x;});$('#edit-board [data-brick-id="'+id+'"]').focus();
};
$('#brick-form').onsubmit=event=>{event.preventDefault();if(!selectedBrick()){message('Brush ready. Choose Add bricks to paint.');return;}commit(()=>{const b=selectedBrick(),settings=brush();delete b.customType;Object.assign(b,settings,{hp:settings.maxHp,x:Number($('#brick-x').value),y:Number($('#brick-y').value)});b.baseX=b.x;});};
$('#brick-type').onchange=()=>{const t=world.types.find(t=>t.type===$('#brick-type').value);$('#brick-hp').value=(t?.base||$('#brick-type').value)==='armor'?'2':'1';};
$('#delete-brick').onclick=()=>commit(()=>{current().bricks=current().bricks.filter(b=>b.id!==selected);selected=null;});
$('#undo').onclick=()=>{if(!history.length)return;future.push(clone(world));world=history.pop();selected=null;render();saveDraft();};
$('#redo').onclick=()=>{if(!future.length)return;history.push(clone(world));world=future.pop();selected=null;render();saveDraft();};
$('#edit-phase').onchange=()=>{phase=Number($('#edit-phase').value);selected=null;render();};

function typeOptions(){const effect=$('#type-effect').value;for(const [name,shown]of [['points','bonus'],['radius','pulse'],['duration','slow-ball'],['power','power-up']]){const input=$('#type-'+name);input.hidden=effect!==shown;document.querySelector('label[for="type-'+name+'"]').hidden=effect!==shown;}}
$('#type-effect').onchange=typeOptions;typeOptions();
$('#type-form').onsubmit=event=>{event.preventDefault();const name=$('#type-name').value.trim();let slug=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');if(!/^[a-z]/.test(slug))slug='brick-'+slug;slug=slug.slice(0,40);const type='urn:Brick:Custom:'+slug;
 const created=commit(()=>world.types.push({type,name,base:$('#type-base').value,effect:$('#type-effect').value,points:Number($('#type-points').value),radius:Number($('#type-radius').value),duration:Number($('#type-duration').value),power:$('#type-power').value}));
 if(created){$('#brick-type').value=type;$('#brick-type').onchange();selected=null;fillInspector();message(name+' created. Choose Add bricks to place it.');}
};
$('#show-html').onclick=()=>{$('#html-source').value=worldDocument(world).replaceAll('><','>\n<');$('#html-status').textContent='';$('#html-dialog').showModal();};
$('#copy-html').onclick=async()=>{try{await navigator.clipboard.writeText($('#html-source').value);$('#html-status').textContent='HTML copied.';}catch{$('#html-source').select();$('#html-status').textContent='Select and copy the HTML above.';}};
$('#export').onclick=()=>{const url=URL.createObjectURL(new Blob([worldDocument(world)],{type:'text/html'})),a=document.createElement('a');a.href=url;a.download=world.slug+'.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};
$('#import').onclick=()=>$('#import-file').click();
$('#import-file').onchange=async()=>{const file=$('#import-file').files[0];$('#import-file').value='';if(!file)return;try{if(file.size>1000000)throw Error('World file is too large');const imported=parseWorld(await file.text(),{expectedSlug:world.slug});commit(()=>{world=imported;selected=null;});}catch(e){message(e.message);}};
$('#restore').onclick=()=>commit(()=>{world=originalWorld(world.index);selected=null;});
async function published(slug){const response=await fetch('/worlds/'+slug+'/definition.html?cb='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('Could not load the published world ('+response.status+').');const fresh=parseWorld(await response.text(),{expectedSlug:slug});safeStorage.set('prism.world-published.'+slug,{world:fresh,savedAt:Date.now()});return fresh;}
$('#reload').onclick=async()=>{try{const fresh=await published(slugFromPath);baseHTML=worldHTML(fresh);commit(()=>{world=fresh;selected=null;phase=0;});populatePhases();saveDraft();}catch(e){message(e.message);}};

$('#publish').onclick=()=>{if(!world||!baseHTML)return;$('#publish-status').textContent='';$('#owner-key').value='';$('#publish-dialog').showModal();};
$('#publish-form').onsubmit=async event=>{
 event.preventDefault();const key=$('#owner-key').value.trim();$('#owner-key').value='';const button=$('#confirm-publish');button.disabled=true;$('#publish-status').textContent='Checking the latest shared world…';
 try{
  if(!world||!baseHTML)throw Error('Load the published world before publishing.');
  const snapshot=normalizeWorld(world),path='/worlds/'+snapshot.slug+'/definition.html',url='https://dav-sane-guild-8399.onpagelove.com'+path;
  const read=await fetch(url,{headers:{Authorization:'Bearer '+key},cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!read.ok)throw Error(read.status===401||read.status===403?'This key cannot publish to this host.':'Could not read the shared world ('+read.status+').');
  const etag=read.headers.get('ETag');if(!etag)throw Error('The host did not expose an ETag. Download your world and publish it with the owner tool.');
  const latest=parseWorld(await read.text(),{expectedSlug:snapshot.slug});if(worldHTML(latest)!==baseHTML)throw Error('The published world changed since you opened it. Download your draft, then Reload published to review the latest version.');
  const write=await fetch(url,{method:'PUT',headers:{Authorization:'Bearer '+key,'Content-Type':'text/html; charset=utf-8','If-Match':etag},body:worldDocument(snapshot),signal:AbortSignal.timeout(15000)});
  if(write.status===412)throw Error('Someone changed this world while it was saving. Download your draft, then Reload published.');
  if(!write.ok)throw Error('Publish failed ('+write.status+'). Your draft is saved.');
  const check=await fetch(url,{headers:{Authorization:'Bearer '+key},cache:'no-store',signal:AbortSignal.timeout(15000)});if(!check.ok||worldHTML(parseWorld(await check.text(),{expectedSlug:snapshot.slug}))!==worldHTML(snapshot))throw Error('The save was sent, but its readback could not be confirmed. Reload published before retrying.');
  baseHTML=worldHTML(snapshot);saveDraft();$('#publish-status').textContent=worldHTML(world)===worldHTML(snapshot)?'Published. This world is now available in shared Practice.':'Snapshot published. Your newer changes remain a draft.';
 }catch(e){$('#publish-status').textContent=e.message;}finally{button.disabled=false;}
};

function startPreview(){
 detachDOM?.();previewGame=new Game(e=>{stage?.event(e);if(e.type==='phase'){previewGame.state='cleared';previewGame.bricks=[];previewGame.barriers=[];}if(e.type==='phase'||e.type==='clear')$('#preview-status').textContent='Formation cleared. Try another idea, or play again.';if(e.type==='over')$('#preview-status').textContent='Run finished. Restart to try again.';});
 previewGame.catalog=formationCatalog(world);previewGame.start('practice',world.index,8399);previewGame.phase=phase;previewGame.loadLevel();stage?.reset();
 detachDOM=attachBrickDOM(previewGame,$('#edit-board #world'));$('#strike-events').replaceChildren();
 previewGame.events.addEventListener('strike',event=>{const b=event.detail.brick,li=document.createElement('li');li.textContent='strike · brick '+b.id+' · '+(b.customType||b.kind)+' · '+b.hp+' hit'+(b.hp===1?'':'s')+' before impact';$('#strike-events').prepend(li);while($('#strike-events').children.length>6)$('#strike-events').lastElementChild.remove();});
 $('#preview-title').textContent=world.name+' · Formation '+(phase+1);$('#preview-status').textContent='Practice preview. Move with the pointer or arrows; Space launches.';$('#preview-launch').hidden=false;
}
$('#preview').onclick=async()=>{
 try{normalizeWorld(world);$('#preview-dialog').showModal();previewReady=false;startPreview();if(!stage){const {Stage}=await import('./scene.js?v=14');stage=new Stage($('#preview-canvas'),{lowEffects:matchMedia('(pointer:coarse)').matches,reducedMotion:matchMedia('(prefers-reduced-motion:reduce)').matches,classicMode:false});}stage.resize();await stage.prepare(previewGame);previewReady=true;$('#preview-canvas').focus();}catch(e){$('#preview-status').textContent='The 3D preview could not start: '+e.message;}
};
$('#restart-preview').onclick=()=>{startPreview();previewReady=true;$('#preview-canvas').focus();};
$('#preview-launch').onclick=()=>previewGame?.launch();
$('#preview-canvas').onpointermove=event=>{if(previewGame&&stage)previewGame.move(stage.screenX(event.clientX,event.clientY));};
$('#preview-canvas').onpointerdown=event=>{event.preventDefault();$('#preview-canvas').focus();previewGame?.launch();};
document.addEventListener('keydown',event=>{if(!$('#preview-dialog').open||/INPUT|SELECT|TEXTAREA/.test(event.target.tagName))return;if(['ArrowLeft','ArrowRight',' ','a','d'].includes(event.key)){event.preventDefault();keys.add(event.key);if(event.key===' ')previewGame?.launch();}});
document.addEventListener('keyup',event=>keys.delete(event.key));window.addEventListener('blur',()=>keys.clear());
$('#preview-dialog').addEventListener('close',()=>{keys.clear();previewReady=false;detachDOM?.();render();});
for(const button of document.querySelectorAll('[data-close]'))button.onclick=()=>$('#'+button.dataset.close).close();
window.addEventListener('resize',()=>{if($('#preview-dialog').open)stage?.resize();});
let last=performance.now(),accumulator=0;
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;if($('#preview-dialog').open&&previewReady&&!document.hidden){previewClock+=dt;if(keys.has('ArrowLeft')||keys.has('a'))previewGame.move(previewGame.target-22*dt);if(keys.has('ArrowRight')||keys.has('d'))previewGame.move(previewGame.target+22*dt);accumulator+=dt;while(accumulator>=1/120){previewGame.tick(1/120);accumulator-=1/120;}stage.render(previewGame,dt,previewClock,'game');$('#preview-score').textContent='Score '+previewGame.score.toLocaleString()+' · Lives '+previewGame.lives;$('#preview-launch').hidden=!previewGame.balls.some(b=>b.held)||previewGame.state==='over'||previewGame.state==='cleared';}requestAnimationFrame(frame);}requestAnimationFrame(frame);

function setEditing(enabled){
 for(const selector of ['.editor-layout','.workshop-actions'])$(selector).inert=!enabled;
 $('#edit-phase').disabled=!enabled;$('#publish').disabled=!enabled||!baseHTML;
}
function populatePhases(){ $('#edit-phase').replaceChildren();world.formations.forEach((_,i)=>$('#edit-phase').add(new Option('Formation '+(i+1),String(i))));phase=Math.min(phase,world.formations.length-1);$('#edit-phase').value=String(phase);}
function openWorld(value,status){world=normalizeWorld(value);phase=0;selected=null;populatePhases();$('#brick-color').value=world.accent;setEditing(true);render();message(status);}
for(const key of ['shape','music'])for(const theme of THEMES)$('#world-'+key).add(new Option(theme,theme));
$('#world-details').onsubmit=event=>{event.preventDefault();commit(()=>{for(const key of ['name','note','tag','story','mechanic','shape','music','sky','accent'])world[key]=$('#world-'+key).value.trim();world.colors=$('#world-colors').value.trim().split(/\s+/);});};
$('#retry-world').onclick=initialize;
$('#use-original').onclick=()=>{baseHTML='';openWorld(originalWorld(index),'Original release opened as an offline draft. Reload published before publishing.');};
$('#use-draft').onclick=()=>{try{const draft=safeStorage.get(draftKey(slugFromPath));if(!draft||draft.world.slug!==slugFromPath)throw Error('No valid draft for this world');baseHTML='';openWorld(draft.world,'Your offline draft is open. Reload published before publishing; download your draft first to keep both versions.');}catch(e){message(e.message);}};
async function initialize(){
 setEditing(false);$('#world-recovery').hidden=true;
 if(index<0){message('Unknown world. Choose a world from the menu.');$('#edit-world').focus();return;}
 try{
  const routed=$('#routed-world #world');const fresh=routed?parseWorld(routed,{expectedSlug:slugFromPath}):await published(slugFromPath);routed?.remove();baseHTML=worldHTML(fresh);
  const draft=safeStorage.get(draftKey(slugFromPath));let restored;
  if(draft?.world?.slug===slugFromPath)try{restored=normalizeWorld(draft.world);baseHTML=draft.baseHTML?worldHTML(parseWorld(draft.baseHTML,{expectedSlug:slugFromPath})):'';}catch{restored=null;}
  openWorld(restored||fresh,restored?(baseHTML?'Your saved draft is restored. Publishing checks for changes to the shared world.':'Offline draft restored. Download it, then reload published before publishing.'):'Ready · '+fresh.name+' · Changes save as a draft.');
 }catch(error){world=null;baseHTML='';$('#world-recovery').hidden=false;$('#use-draft').hidden=!safeStorage.get(draftKey(slugFromPath));message(error.message+' Choose Retry, your saved draft, or the original release.');}
}
initialize();
