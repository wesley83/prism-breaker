import {editorSlug} from './world-identity.js';
import {RenderClock} from './render-budget.js';
import {THEMES} from './world-schema.js';
import {WORLDS} from './levels.js';
import {WORLD_SLUGS,originalWorld,normalizeWorld,parseWorld,worldHTML,worldDocument,formationCatalog} from './world-format.js';
import {Game} from './engine.js?v=10';
import {attachBrickDOM} from './brick-events.js';
import {setupGraphicsRecovery} from './graphics-recovery.js';
import {writeJSON,downloadRecovery,createSaveRecovery} from './save-recovery.js';
import {WorldWorkingDocument} from './world-working-document.js';
import {setupPaddleInput} from './pointer-input.js';
import {editorDrafts} from './editor-drafts.js';
import {publishWorld} from './publish-world.js';
import {ownsKeyboard} from './keyboard-input.js';
import {startFrameLoop} from './frame-loop.js';

const $=s=>document.querySelector(s),clone=v=>structuredClone(v);
let world,phase=0,tool='select',baseHTML='',history=[],future=[],drag=null,stage,previewGame,detachDOM,previewReady=false,previewClock=0;
let working,unsaved=false,detailsDirty=false,loadGeneration=0,leaving=false,publishing=false;
let draftRevision=null,draftWrites=Promise.resolve();
const recoverSave=createSaveRecovery();
const keys=new Set();const draftKey=slug=>'prism.world-draft.'+slug;
const previewGraphics=setupGraphicsRecovery(document.querySelector('#preview-canvas'),{
 pause(){keys.clear();previewReady=false;if(previewGame)previewGame.state='paused';},
 async restore(){if(!stage||!previewGame)throw Error('Preview unavailable');stage.preparedModes?.clear();await stage.prepare(previewGame);stage.resize();last=performance.now();accumulator=0;previewLoop.resume();},
 onStatus(status){const ready=status==='ready';previewReady=ready;$('#restart-preview').disabled=!ready;$('#preview-launch').disabled=!ready;
  if(ready&&previewGame){previewGame.state='ready';$('#preview-launch').textContent='Resume preview';}
  $('#preview-status').textContent=ready?'Arena restored. Resume the preview when ready.':status==='failed'?'The arena could not recover. Close the preview and reload the workshop. Your saved draft is retained.':'Graphics interrupted. Preview paused while the arena recovers.';
 }
});
const message=text=>$('#editor-status').textContent=text;
const safeStorage={get(key){try{return JSON.parse(localStorage.getItem(key));}catch{return null;}},set(key,value){try{return writeJSON(localStorage,key,value).saved;}catch{return false;}}};
const current=()=>world.formations[phase];
const slugFromPath=editorSlug(location.pathname,location.search);
const index=WORLD_SLUGS.indexOf(slugFromPath);
WORLDS.forEach((w,i)=>$('#edit-world').add(new Option(w.name,WORLD_SLUGS[i])));
if(index<0){const missing=new Option('Choose a world','');missing.disabled=true;$('#edit-world').add(missing,0);}$('#edit-world').value=index>=0?slugFromPath:'';
$('#edit-world').onchange=async()=>{const target=$('#edit-world').value;$('#edit-world').value=slugFromPath;if(await preserveDraft()){leaving=true;location.href='/editor/'+target;}};

const GRID_X=1.93,GRID_Y=1.05;
const selection=new Set(),nodes=new Map();
let brushState={kind:'normal',maxHp:1,color:'#b5ff6c',moving:false},colorEdit=null;
const round=n=>Math.round(n*100)/100;
const selectionBricks=()=>current().bricks.filter(b=>selection.has(b.id));
const snapshot=()=>({html:working.serialize(),phase,selection:[...selection]});
function restoreSnapshot(s){world=working.restore(s.html);phase=s.phase;selection.clear();for(const id of s.selection)selection.add(id);}
// Mutable objects exist only inside a synchronous command. All resting views are frozen DOM projections.
function editDocument(change){world=working.read();try{const result=change();working.replace(world);return result;}finally{world=working.project();}}
function remember(s){history.push(s);if(history.length>50)history.shift();future=[];}
function saveDraft(){
 if(!world)return Promise.resolve(true);
 const slug=world.slug,html=working.serialize(),baseline=baseHTML;unsaved=true;$('#draft-status').textContent='Saving draft…';
 const pending=draftWrites.catch(()=>{}).then(async()=>{
  let result;try{result=await editorDrafts.write(slug,{html,baseHTML:baseline},draftRevision);}catch{result={saved:false};}
  if(result.saved)draftRevision=result.revision;
  if(world?.slug!==slug)return false;
  const current=working.serialize()===html&&baseHTML===baseline;
  unsaved=!result.saved||!current;
  $('#draft-status').textContent=result.saved?(current?'Draft saved':'Newer changes waiting to save'):result.conflict?'Draft conflict':'Draft not saved';
  if(!result.saved)message(result.conflict?'Another workshop saved this draft. Download your working copy, then reopen the workshop to review that version.':'Draft storage is unavailable. Download your world to keep your changes.');
  return result.saved&&current;
 });draftWrites=pending;return pending;
}
function finishDetails(){if(!detailsDirty)return true;if(!$('#world-details').reportValidity())return false;$('#world-details').requestSubmit();return !detailsDirty;}
async function preserveDraft(){
 finishColorEdit();cancelDrag();if(!finishDetails())return recoverSave({save:()=>finishDetails()&&saveDraft(),download:()=>downloadRecovery({html:working.serialize(),form:Object.fromEntries([...$('#world-details').elements].filter(el=>el.id).map(el=>[el.id,el.value]))},world.slug+'-form-recovery.json')});
 if(!unsaved||await saveDraft())return true;
 return recoverSave({save:saveDraft,download:()=>downloadRecovery(worldDocument(working.read()),world.slug+'.html','text/html')});
}
function statusAfterSave(label){const generation=working.generation;saveDraft().then(saved=>{if(saved&&generation===working.generation)message(label);});}
function commit(change,label='Change saved.'){if(!world||drag)return false;
 finishColorEdit();const before=snapshot();
 try{editDocument(change);phase=Math.min(phase,world.formations.length-1);
  if(before.html===working.serialize()){render();return false;}
  remember(before);render();statusAfterSave(label);return true;
 }catch(error){restoreSnapshot(before);render();message(error.message);return false;}
}
function undo(){finishColorEdit();cancelDrag();if(!history.length)return;future.push(snapshot());restoreSnapshot(history.pop());render();statusAfterSave('Undone.');}
function redo(){finishColorEdit();cancelDrag();if(!future.length)return;history.push(snapshot());restoreSnapshot(future.pop());render();statusAfterSave('Redone.');}
const typeName=value=>world.types.find(t=>t.type===value)?.name||({normal:'Regular',armor:'Armored',explode:'Explosive',switch:'Switch'}[value]||value);
const typeValue=b=>b.customType||b.kind;
function applyType(b,value){const custom=world.types.find(t=>t.type===value);delete b.customType;b.kind=custom?.base||value;if(custom)b.customType=value;b.maxHp=b.kind==='armor'?2:1;b.hp=b.maxHp;}
function brush(){return clone(brushState);}
function chooseBrush(value){finishColorEdit();selection.clear();applyType(brushState,value);setTool('paint');}
function syncTypes(){
 const types=[['normal','Regular'],['armor','Armored'],['explode','Explosive'],['switch','Switch'],...world.types.map(t=>[t.type,t.name])];
 $('#brick-type').replaceChildren(new Option('Mixed',''),...types.map(([value,label])=>new Option(label,value)));
 const palette=$('#brick-palette');palette.replaceChildren();
 for(const [value,label]of types){const button=document.createElement('button');button.type='button';button.dataset.type=value;button.setAttribute('aria-pressed',String(tool==='paint'&&typeValue(brushState)===value));
  const brick=document.createElement('span');brick.className='palette-brick';brick.style.setProperty('--brick-color',brushState.color);const kind=world.types.find(t=>t.type===value)?.base||value;
  brick.textContent=kind==='armor'?'2':kind==='explode'?'★':kind==='switch'?'◇':'';brick.setAttribute('aria-hidden','true');
  const name=document.createElement('span');name.textContent=label;button.append(brick,name);palette.append(button);
 }
}
function fillInspector(){
 const bricks=selectionBricks(),count=bricks.length,values=count?bricks:[brushState];
 $('#brick-inspector').classList.toggle('has-selection',count>0);
 const same=fn=>values.every(b=>fn(b)===fn(values[0])),first=values[0];
 $('#inspector-title').textContent=count===1?'Selected brick':count?count+' selected bricks':'Your paintbrush';
 $('#inspector-state').textContent=count?'Selection':'Brush';
 $('#inspector-hint').textContent=count?'Changes apply immediately. Undo is always available.':typeName(typeValue(brushState))+' · '+brushState.maxHp+' hit'+(brushState.maxHp===1?'':'s')+' · ready to paint.';
 $('#selection-type').hidden=!count;
 $('#brick-type').value=same(typeValue)?typeValue(first):'';
 $('#brick-hp').value=same(b=>b.maxHp)?String(first.maxHp):'';
 $('#brick-color').value=first.color;$('#mixed-color').hidden=same(b=>b.color);
 $('#brick-moving').checked=first.moving;$('#brick-moving').indeterminate=!same(b=>b.moving);$('#mixed-moving').hidden=same(b=>b.moving);
 $('#position-details').hidden=count!==1;
 $('#brick-x').value=count===1?first.x:'';$('#brick-y').value=count===1?first.y:'';
 $('#selection-count').textContent=count?count+' selected':'No selection';
 for(const id of ['duplicate-bricks','delete-brick','mirror-bricks'])$('#'+id).disabled=!count;
 $('#sample-brick').disabled=count!==1;
 const swatches=$('#color-swatches');swatches.replaceChildren();
 for(const color of [...new Set(world.colors)]){const button=document.createElement('button');button.type='button';button.dataset.color=color;button.style.setProperty('--swatch',color);button.setAttribute('aria-label','Use color '+color);button.title=color;button.setAttribute('aria-pressed',String(same(b=>b.color)&&first.color.toLowerCase()===color.toLowerCase()));swatches.append(button);}
}
const left=x=>(x+10)/20*100,top=y=>(11-y)/20*100;
function place(node,b){node.style.left=left(b.x-b.w/2)+'%';node.style.top=top(b.y+b.h/2)+'%';node.style.width=b.w/20*100+'%';node.style.height=b.h/20*100+'%';}
function decorate(node,b){
 place(node,b);node.style.setProperty('--brick-color',b.color);node.setAttribute('role','button');node.tabIndex=0;node.dataset.brickId=String(b.id);
 node.classList.toggle('selected',selection.has(b.id));node.setAttribute('aria-pressed',String(selection.has(b.id)));
 node.setAttribute('aria-label',typeName(typeValue(b))+' brick '+b.id+', '+b.maxHp+' hit'+(b.maxHp>1?'s':'')+', x '+b.x+', y '+b.y);
 const rgb=b.color.slice(1).match(/../g).map(v=>parseInt(v,16));node.style.color=rgb[0]*.299+rgb[1]*.587+rgb[2]*.114>130?'#102025':'#f3f7fa';
 let label=node.querySelector('span');if(!label){label=document.createElement('span');label.setAttribute('aria-hidden','true');node.append(label);}label.textContent=b.maxHp>1||b.kind==='armor'?String(b.maxHp):b.kind==='explode'?'★':b.kind==='switch'?'◇':b.customType?typeName(b.customType).slice(0,1):'';
}
function refreshBoard(){
 const root=$('#edit-board #formation-'+phase);if(!root)return;
 const ids=new Set(current().bricks.map(b=>b.id));for(const [id,node]of nodes)if(!ids.has(id)){node.remove();nodes.delete(id);}
 for(const b of current().bricks){const node=nodes.get(b.id)||root.querySelector('#f'+phase+'-brick-'+b.id);if(!node)throw Error('A brick is missing from its working document');nodes.set(b.id,node);decorate(node,b);}
 $('#brick-count').textContent=current().bricks.length+' / 80 bricks';
}
function refreshSelection(){
 for(const [id,node]of nodes){node.classList.toggle('selected',selection.has(id));node.setAttribute('aria-pressed',String(selection.has(id)));}
 const layer=$('#motion-guides');layer?.replaceChildren();
 for(const b of selectionBricks().filter(b=>b.moving)){const guide=document.createElement('div');guide.className='motion-guide';place(guide,{...b,x:b.baseX,w:b.w+.56});layer?.append(guide);}
 fillInspector();
}
function render(){
 if(!world)return;
 if(brushState.customType&&!world.types.some(t=>t.type===brushState.customType))applyType(brushState,brushState.kind);
 for(const id of selection)if(!current().bricks.some(b=>b.id===id))selection.delete(id);
 $('#publish').disabled=!baseHTML;populatePhases();
 if(!detailsDirty){for(const key of ['name','note','tag','story','mechanic','shape','music','sky','accent'])$('#world-'+key).value=world[key];$('#world-colors').value=world.colors.join(' ');}
 $('#undo').disabled=!history.length;$('#redo').disabled=!future.length;syncTypes();
 const root=working.root;
 for(const section of root.querySelectorAll('[itemtype="urn:Formation"]'))section.hidden=Number(section.querySelector('meta[itemprop="phase"]').content)!==phase;
 const section=root.querySelector('#formation-'+phase);nodes.clear();
 for(const b of current().bricks){const node=section.querySelector('#f'+phase+'-brick-'+b.id);decorate(node,b);nodes.set(b.id,node);}
 [...section.querySelectorAll('[itemtype="urn:Barrier"]')].forEach((node,i)=>place(node,current().barriers[i]));
 [...section.querySelectorAll('[itemtype="urn:Portal"]')].forEach((node,i)=>{node.style.left=left(current().portals[i].x)+'%';node.style.top=top(current().portals[i].y)+'%';});
 for(const node of $('#edit-board').querySelectorAll(':scope > [data-editor-decoration]'))node.remove();
 for(const id of ['motion-guides','brush-ghost','selection-box']){const node=document.createElement('div');node.id=id;node.dataset.editorDecoration='';node.setAttribute('aria-hidden','true');if(id!=='motion-guides')node.hidden=true;$('#edit-board').append(node);}
 $('#brick-count').textContent=current().bricks.length+' / 80 bricks';refreshSelection();
}
function setTool(value){if(drag)cancelDrag();finishColorEdit();tool=value;if(value!=='select')selection.clear();
 for(const name of ['select','paint','erase'])$('#tool-'+name).setAttribute('aria-pressed',String(name===tool));
 $('#edit-board').dataset.tool=tool;
 $('#board-help').textContent=tool==='paint'?'Drag to paint. Empty cells only. Hold Alt over a brick to sample it.':tool==='erase'?'Drag across bricks to erase. One stroke is one Undo. Keep at least one brick.':'Drag empty space to select a group. Shift-click adds to a selection. Drag a brick to move it.';
 if(world){syncTypes();refreshSelection();}$('#brush-ghost')?.setAttribute('hidden','');
}
function choose(id,add=false){finishColorEdit();if(!add)selection.clear();if(id!==null){if(add&&selection.has(id))selection.delete(id);else selection.add(id);}refreshSelection();}
function position(event,snap=true){const r=$('#edit-board').getBoundingClientRect(),x=(event.clientX-r.left)/r.width*20-10,y=11-(event.clientY-r.top)/r.height*20;
 if(!snap)return {x,y};const col=Math.max(-4,Math.min(4,Math.round(x/GRID_X))),row=Math.max(0,Math.min(15,Math.round((9-y)/GRID_Y)));return {x:round(col*GRID_X),y:round(9-row*GRID_Y),row};}
function overlaps(a,b){return Math.abs(a.x-b.x)<(a.w+b.w)/2-.02&&Math.abs(a.y-b.y)<(a.h+b.h)/2-.02;}
function inBounds(b){return b.x>=-9&&b.x<=9&&b.y>=-7.5&&b.y<=10.5&&Math.abs(b.x)+b.w/2+(b.moving ? .28 : 0)<10;}
function canPlace(b,ignore=new Set()){return inBounds(b)&&!current().bricks.some(other=>!ignore.has(other.id)&&overlaps(b,other));}
function hit(point){return [...current().bricks].reverse().find(b=>Math.abs(point.x-b.x)<=b.w/2&&Math.abs(point.y-b.y)<=b.h/2);}
function ghost(event){const node=$('#brush-ghost');if(!node||tool!=='paint'||drag?.kind==='box')return;const p=position(event),b={...brush(),...p,w:1.7,h:.72};place(node,b);node.style.setProperty('--brick-color',b.color);node.classList.toggle('invalid',!canPlace(b)||current().bricks.length>=80);node.hidden=false;}
function stamp(p){if(current().bricks.length>=80){message('The formation is full: 80 bricks maximum.');return false;}const b={...brush(),...p,w:1.7,h:.72,baseX:p.x};if(!canPlace(b))return false;b.id=current().nextBrickId++;b.hp=b.maxHp;current().bricks.push(b);return true;}
function eraseAt(p){const b=hit(p);if(!b)return false;if(current().bricks.length===1){message('Keep at least one brick in the formation.');return false;}current().bricks=current().bricks.filter(other=>other.id!==b.id);selection.delete(b.id);return true;}
function stroke(from,to,kind){const steps=Math.max(1,Math.ceil(Math.max(Math.abs(to.x-from.x)/.35,Math.abs(to.y-from.y)/.2)));let changed=false;
 for(let i=0;i<=steps;i++){const p={x:from.x+(to.x-from.x)*i/steps,y:from.y+(to.y-from.y)*i/steps};if(kind==='paint'){p.row=Math.max(0,Math.min(15,Math.round((9-p.y)/GRID_Y)));p.x=round(Math.max(-4,Math.min(4,Math.round(p.x/GRID_X)))*GRID_X);p.y=round(9-p.row*GRID_Y);changed=stamp(p)||changed;}else changed=eraseAt(p)||changed;}
 return changed;
}
function sample(){const b=selectionBricks()[0];if(!b)return;brushState={kind:b.kind,maxHp:b.maxHp,color:b.color,moving:b.moving,...(b.customType?{customType:b.customType}:{})};setTool('paint');message(typeName(typeValue(b))+' sampled. Paint matching bricks.');}
function moveGroup(originals,dx,dy){
 const proposed=originals.map(b=>dx===0&&dy===0?clone(b):({...b,x:round(b.x+dx),y:round(b.y+dy),baseX:round(b.baseX+dx),row:Math.max(0,Math.min(79,Math.round((9-(b.y+dy))/GRID_Y)))}));
 if(proposed.some(b=>!canPlace(b,selection)))return false;
 for(const value of proposed)Object.assign(current().bricks.find(b=>b.id===value.id),value);return true;
}
function duplicate(){const selected=selectionBricks();if(!selected.length)return;if(current().bricks.length+selected.length>80){message('Not enough room in the 80-brick limit to duplicate this selection.');return;}
 for(let distance=1;distance<=16;distance++)for(const [dx,dy]of [[0,-GRID_Y*distance],[GRID_X*distance,0],[-GRID_X*distance,0],[0,GRID_Y*distance]]){
  const copies=selected.map(b=>({...b,x:round(b.x+dx),y:round(b.y+dy),baseX:round(b.baseX+dx),row:Math.max(0,Math.min(79,Math.round((9-b.y-dy)/GRID_Y)))}));
  if(copies.every(b=>canPlace(b))){commit(()=>{selection.clear();for(const b of copies){b.id=current().nextBrickId++;current().bricks.push(b);selection.add(b.id);}},'Selection duplicated. Drag it into place.');return;}
 }message('No free space fits this selection. Move or erase some bricks first.');
}
function deleteSelection(){if(!selection.size)return;if(selection.size>=current().bricks.length){message('Keep at least one brick. Deselect a brick before deleting.');return;}commit(()=>{current().bricks=current().bricks.filter(b=>!selection.has(b.id));selection.clear();},'Selection deleted.');}
function cancelDrag(){if(!drag)return;const prior=drag;drag=null;restoreSnapshot(prior.before);render();$('#edit-board').classList.remove('blocked-move');if($('#edit-board').hasPointerCapture(prior.pointer))$('#edit-board').releasePointerCapture(prior.pointer);message('Gesture canceled.');}
function endDrag(){if(!drag)return;const prior=drag;drag=null;
 if(prior.kind==='box'){refreshSelection();$('#selection-box').hidden=true;return;}
 if(!prior.changed){refreshSelection();return;}
 try{if(working.serialize()!==prior.before.html){remember(prior.before);statusAfterSave(prior.kind==='paint'?'Stroke painted.':prior.kind==='erase'?'Stroke erased.':'Selection moved.');}render();}
 catch(error){restoreSnapshot(prior.before);render();message(error.message);}
}
$('#edit-board').onpointerdown=event=>{
 if(!world||event.button!==0||drag)return;finishColorEdit();const point=position(event,false),brick=hit(point);$('#edit-board').focus({preventScroll:true});
 if(event.altKey&&brick){choose(brick.id);sample();return;}
 if(tool==='select'&&brick&&event.shiftKey){choose(brick.id,true);return;}
 const before=snapshot();if(tool==='select'&&brick&&!selection.has(brick.id))choose(brick.id);
 if(tool==='select'&&!brick&&!event.shiftKey)selection.clear();
 drag={before,pointer:event.pointerId,start:point,last:point,changed:false,kind:tool==='select'?(brick?'move':'box'):tool,originals:clone(selectionBricks()),add:event.shiftKey};
 $('#edit-board').setPointerCapture(event.pointerId);
 if(tool==='paint'||tool==='erase'){drag.changed=editDocument(()=>stroke(point,point,tool));refreshBoard();}
 refreshSelection();
};
$('#edit-board').onpointermove=event=>{
 ghost(event);if(!drag||drag.pointer!==event.pointerId)return;const point=position(event,false);
 if(drag.kind==='paint'||drag.kind==='erase'){drag.changed=editDocument(()=>stroke(drag.last,point,drag.kind))||drag.changed;drag.last=point;refreshBoard();return;}
 if(drag.kind==='box'){const x1=Math.min(point.x,drag.start.x),x2=Math.max(point.x,drag.start.x),y1=Math.min(point.y,drag.start.y),y2=Math.max(point.y,drag.start.y);selection.clear();if(drag.add)for(const id of drag.before.selection)selection.add(id);for(const b of current().bricks)if(b.x+b.w/2>=x1&&b.x-b.w/2<=x2&&b.y+b.h/2>=y1&&b.y-b.h/2<=y2)selection.add(b.id);const box=$('#selection-box');place(box,{x:(x1+x2)/2,y:(y1+y2)/2,w:x2-x1,h:y2-y1});box.hidden=false;refreshSelection();return;}
 const dx=round(Math.round((point.x-drag.start.x)/GRID_X)*GRID_X),dy=round(Math.round((point.y-drag.start.y)/GRID_Y)*GRID_Y);
 if(editDocument(()=>moveGroup(drag.originals,dx,dy))){drag.changed=dx!==0||dy!==0;$('#edit-board').classList.remove('blocked-move');refreshBoard();}else $('#edit-board').classList.add('blocked-move');
};
$('#edit-board').onpointerup=event=>{if(!drag||drag.pointer!==event.pointerId)return;endDrag();if(event.pointerType==='touch'&&tool==='select'&&selection.size)inspectorSheet(true);$('#edit-board').classList.remove('blocked-move');};
$('#edit-board').onpointercancel=event=>{if(drag?.pointer===event.pointerId)cancelDrag();};
$('#edit-board').onlostpointercapture=event=>{if(drag?.pointer===event.pointerId)cancelDrag();};
$('#edit-board').onpointerleave=()=>{$('#brush-ghost')?.setAttribute('hidden','');};
$('#edit-board').onclick=event=>{if(event.detail!==0)return;const node=event.target.closest('[data-brick-id]');if(node)choose(Number(node.dataset.brickId),event.shiftKey);};
for(const name of ['select','paint','erase'])$('#tool-'+name).onclick=()=>setTool(name);
$('#brick-palette').onclick=event=>{const button=event.target.closest('[data-type]');if(button)chooseBrush(button.dataset.type);};
$('#brick-form').onsubmit=event=>event.preventDefault();
function changeProperty(key,value){if(!world)return;
 const apply=b=>{if(key==='type')applyType(b,value);else{b[key]=value;if(key==='maxHp'){b.hp=value;if(!b.customType&&b.kind==='normal'&&value>1)b.kind='armor';}if(key==='x')b.baseX=value;if(key==='y')b.row=Math.max(0,Math.min(79,Math.round((9-value)/GRID_Y)));}};
 if(selection.size)commit(()=>{for(const b of selectionBricks())apply(b);},'Selection updated.');else{apply(brushState);syncTypes();fillInspector();}
}
$('#brick-type').onchange=event=>{if(event.target.value)changeProperty('type',event.target.value);};
$('#brick-hp').onchange=event=>{if(event.target.value)changeProperty('maxHp',Number(event.target.value));};
$('#brick-moving').onchange=event=>changeProperty('moving',event.target.checked);
for(const key of ['x','y'])$('#brick-'+key).onchange=event=>{if(event.target.value!==''&&event.target.checkValidity())changeProperty(key,Number(event.target.value));else{message('Enter a valid position inside the board.');fillInspector();}};
$('#brick-color').oninput=event=>{if(!selection.size){brushState.color=event.target.value;syncTypes();return;}colorEdit??=snapshot();editDocument(()=>{for(const b of selectionBricks())b.color=event.target.value;});refreshBoard();$('#mixed-color').hidden=true;};
function finishColorEdit(){if(!colorEdit)return;const before=colorEdit;colorEdit=null;try{if(before.html!==working.serialize()){remember(before);saveDraft();}render();}catch(e){restoreSnapshot(before);render();message(e.message);}}
$('#brick-color').onchange=()=>{finishColorEdit();syncTypes();fillInspector();};
$('#brick-color').onblur=finishColorEdit;
$('#color-swatches').onclick=event=>{const button=event.target.closest('[data-color]');if(button)changeProperty('color',button.dataset.color);};
$('#select-all').onclick=()=>{setTool('select');for(const b of current().bricks)selection.add(b.id);refreshSelection();};
$('#duplicate-bricks').onclick=duplicate;$('#delete-brick').onclick=deleteSelection;$('#sample-brick').onclick=sample;
$('#mirror-bricks').onclick=()=>{const mirrored=selectionBricks().map(b=>({...b,x:-b.x,baseX:-b.baseX}));if(mirrored.some(b=>!canPlace(b,selection))){message('The mirrored selection would overlap another brick.');return;}commit(()=>{for(const b of mirrored)Object.assign(current().bricks.find(v=>v.id===b.id),b);},'Selection mirrored.');};
$('#undo').onclick=undo;$('#redo').onclick=redo;
$('#edit-phase').onchange=event=>{finishColorEdit();cancelDrag();phase=Number(event.target.value);selection.clear();render();};
document.addEventListener('keydown',event=>{
 if(!world||$('.editor-layout').inert||$('dialog[open]')||event.target.closest('input,textarea,select,[contenteditable=true]'))return;
 const key=event.key.toLowerCase(),mod=event.ctrlKey||event.metaKey;
 if(event.key==='Escape'){event.preventDefault();if(drag)cancelDrag();else if($('#brick-inspector').classList.contains('sheet-open')){inspectorSheet(false);$('#edit-board').focus({preventScroll:true});}else{selection.clear();setTool('select');}return;}
 if(drag)return;
 const actions=mod?{z:event.shiftKey?redo:undo,y:redo,a:()=>$('#select-all').click(),d:duplicate}:{v:()=>setTool('select'),b:()=>setTool('paint'),e:()=>setTool('erase'),i:sample,p:()=>$('#preview').click(),delete:deleteSelection,backspace:deleteSelection};
 if(actions[key]){event.preventDefault();if(!event.repeat)actions[key]();return;}
 const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]}[event.key];
 if(delta&&selection.size){event.preventDefault();const originals=clone(selectionBricks()),dx=delta[0]*(event.shiftKey?GRID_X:.1),dy=delta[1]*(event.shiftKey?GRID_Y:.1);commit(()=>{if(!moveGroup(originals,dx,dy))throw Error('That move would overlap a brick or leave the board.');},'Selection moved.');$('#edit-board').focus({preventScroll:true});}
});
window.addEventListener('blur',()=>{cancelDrag();finishColorEdit();});

function typeOptions(){const effect=$('#type-effect').value;for(const [name,shown]of [['points','bonus'],['radius','pulse'],['duration','slow-ball'],['power','power-up']]){const input=$('#type-'+name);input.hidden=effect!==shown;document.querySelector('label[for="type-'+name+'"]').hidden=effect!==shown;}}
$('#type-effect').onchange=typeOptions;typeOptions();
$('#type-form').onsubmit=event=>{event.preventDefault();const name=$('#type-name').value.trim();let slug=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');if(!/^[a-z]/.test(slug))slug='brick-'+slug;slug=slug.slice(0,40);const type='urn:Brick:Custom:'+slug;
 const created=commit(()=>world.types.push({type,name,base:$('#type-base').value,effect:$('#type-effect').value,points:Number($('#type-points').value),radius:Number($('#type-radius').value),duration:Number($('#type-duration').value),power:$('#type-power').value}));
 if(created){chooseBrush(type);$('#type-form').reset();typeOptions();message(name+' is ready. Paint it on the board.');}
};
$('#show-html').onclick=()=>{finishColorEdit();cancelDrag();if(!finishDetails())return;$('#html-source').value=worldDocument(world).replaceAll('><','>\n<');$('#html-status').textContent='';$('#html-dialog').showModal();};
$('#copy-html').onclick=async()=>{try{await navigator.clipboard.writeText($('#html-source').value);$('#html-status').textContent='HTML copied.';}catch{$('#html-source').select();$('#html-status').textContent='Select and copy the HTML above.';}};
$('#export').onclick=()=>{finishColorEdit();if(finishDetails())downloadRecovery(worldDocument(working.read()),world.slug+'.html','text/html');};
$('#import').onclick=()=>$('#import-file').click();
$('#import-file').onchange=async()=>{const file=$('#import-file').files[0];$('#import-file').value='';if(!file)return;const generation=working?.generation;try{if(file.size>1000000)throw Error('World file is too large');const imported=parseWorld(await file.text(),{expectedSlug:world.slug});if(generation!==working.generation)throw Error('The world changed while importing. Choose the file again.');if(await preserveDraft())commit(()=>{world=imported;selection.clear();});}catch(e){message(e.message);}};
$('#restore').onclick=()=>commit(()=>{world=originalWorld(world.index);selection.clear();});
async function published(slug){const response=await fetch('/worlds/'+slug+'/definition.html?cb='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('Could not load the published world ('+response.status+').');const fresh=parseWorld(await response.text(),{expectedSlug:slug});safeStorage.set('prism.world-published.'+slug,{world:fresh,savedAt:Date.now()});return fresh;}
$('#reload').onclick=async()=>{if(!await preserveDraft())return;const generation=working.generation;try{const fresh=await published(slugFromPath);if(generation!==working.generation||detailsDirty)throw Error('Your world changed while loading. Reload published again when ready.');const html=worldHTML(fresh);if(working.serialize()!==html)commit(()=>{world=fresh;selection.clear();phase=0;});if(working.serialize()!==html)throw Error('The shared world could not be opened. Your draft is retained.');baseHTML=html;populatePhases();await saveDraft();}catch(e){message(e.message);}};

$('#publish').onclick=()=>{if(!world||!baseHTML||publishing)return;finishColorEdit();cancelDrag();if(!finishDetails())return;$('#publish-status').textContent='';$('#owner-key').value='';$('#publish-dialog').showModal();};
$('#publish-form').onsubmit=async event=>{
 event.preventDefault();if(publishing)return;finishColorEdit();cancelDrag();if(!finishDetails())return;publishing=true;const key=$('#owner-key').value.trim();$('#owner-key').value='';const button=$('#confirm-publish');button.disabled=true;$('#publish-status').textContent='Checking the latest shared world…';
 try{
  if(!world||!baseHTML)throw Error('Load the published world before publishing.');
  const html=await publishWorld({world,baseline:baseHTML,currentBaseline:()=>baseHTML,key});
  baseHTML=html;await saveDraft();$('#publish-status').textContent=(worldHTML(world)===html&&!detailsDirty?'Published. This world is now available in shared Practice.':'Snapshot published. Your newer changes remain a draft.')+(unsaved?' Download your working copy: its draft could not be confirmed.':'');
 }catch(e){$('#publish-status').textContent=e.message;}finally{publishing=false;button.disabled=false;}
};

let previewGeneration=0,preparation=Promise.resolve();
function startPreview(){
 keys.clear();accumulator=0;previewClock=0;previewRenderClock.reset();previewSceneDelta=0;
 detachDOM?.();previewGame=new Game(e=>{stage?.event(e);if(e.type==='phase'){previewGame.state='cleared';previewGame.bricks=[];previewGame.barriers=[];}if(e.type==='phase'||e.type==='clear')$('#preview-status').textContent='Formation cleared. Try another idea, or play again.';if(e.type==='over')$('#preview-status').textContent='Run finished. Restart to try again.';});
 previewGame.catalog=formationCatalog(world);previewGame.start('practice',world.index,8399);previewGame.phase=phase;previewGame.loadLevel();stage?.reset();
 detachDOM=attachBrickDOM(previewGame,working.root.cloneNode(true));$('#strike-events').replaceChildren();
 previewGame.events.addEventListener('strike',event=>{const b=event.detail.brick,li=document.createElement('li');li.textContent='strike · brick '+b.id+' · '+(b.customType||b.kind)+' · '+b.hp+' hit'+(b.hp===1?'':'s')+' before impact';$('#strike-events').prepend(li);while($('#strike-events').children.length>6)$('#strike-events').lastElementChild.remove();});
 $('#preview-title').textContent=world.name+' · Formation '+(phase+1);$('#preview-status').textContent='Practice preview. Move with the pointer or arrows; Space launches.';$('#preview-launch').hidden=false;$('#preview-launch').textContent='Launch ball';
}
$('#preview').onclick=async()=>{
 const generation=++previewGeneration,active=()=>generation===previewGeneration&&$('#preview-dialog').open;
 try{
  finishColorEdit();if(!finishDetails())return;normalizeWorld(world);$('#preview-dialog').showModal();previewReady=false;$('#restart-preview').disabled=true;$('#preview-launch').disabled=true;
  await preparation.catch(()=>{});if(!active())return;startPreview();
  if(!stage){const {Stage}=await import('./scene.js?v=15');if(!active())return;stage=new Stage($('#preview-canvas'),{lowEffects:matchMedia('(pointer:coarse)').matches,reducedMotion:matchMedia('(prefers-reduced-motion:reduce)').matches,classicMode:false});}
  stage.resize();preparation=stage.prepare(previewGame);await preparation;if(!active())return;
  previewLoop.resume();last=performance.now();previewReady=true;$('#restart-preview').disabled=false;$('#preview-launch').disabled=false;$('#preview-canvas').focus();
 }catch(e){if(active())$('#preview-status').textContent='The 3D preview could not start: '+e.message;}
};
$('#restart-preview').onclick=()=>{startPreview();previewReady=true;$('#preview-canvas').focus();};
$('#preview-launch').onclick=()=>{if(previewReady){previewGame?.launch();$('#preview-canvas').focus();}};
const previewInput=setupPaddleInput($('#preview-canvas'),{enabled:()=>$('#preview-dialog').open&&previewReady&&!previewGraphics.blocked&&!!stage,move:event=>previewGame.move(stage.screenX(event.clientX,event.clientY)),launch:()=>{$('#preview-canvas').focus();previewGame.launch();},neutral:()=>{if(previewGame)previewGame.target=previewGame.paddle.x;}});
document.addEventListener('keydown',event=>{if(!$('#preview-dialog').open||!previewReady||ownsKeyboard(event.target,event.code))return;if(['ArrowLeft','ArrowRight','Space','KeyA','KeyD'].includes(event.code)){event.preventDefault();keys.add(event.code);if(event.code==='Space'&&!event.repeat)previewGame?.launch();}});
document.addEventListener('keyup',event=>keys.delete(event.code));window.addEventListener('blur',()=>keys.clear());
$('#preview-dialog').addEventListener('close',()=>{previewGeneration++;keys.clear();previewInput.cancel();previewReady=false;detachDOM?.();render();$('#edit-board').focus({preventScroll:true});});
for(const button of document.querySelectorAll('[data-close]'))button.onclick=()=>$('#'+button.dataset.close).close();
window.addEventListener('resize',()=>{if($('#preview-dialog').open)stage?.resize();});
const previewRenderClock=new RenderClock();let last=performance.now(),accumulator=0,previewSceneDelta=0,previewHud='';
function frame(now){
 const dt=Math.min(.05,(now-last)/1000);last=now;
 if($('#preview-dialog').open&&previewReady&&!document.hidden&&!previewGraphics.blocked){
  previewClock+=dt;previewSceneDelta+=dt;if(keys.has('ArrowLeft')||keys.has('KeyA'))previewGame.move(previewGame.target-22*dt);if(keys.has('ArrowRight')||keys.has('KeyD'))previewGame.move(previewGame.target+22*dt);
  accumulator+=dt;while(accumulator>=1/120){previewGame.tick(1/120);accumulator-=1/120;}
  if(previewRenderClock.due(now,60)){stage.render(previewGame,previewSceneDelta,previewClock,'game');stage.observeFrame(previewRenderClock.elapsed,previewGame.state==='playing');previewSceneDelta=0;
   const text='Score '+previewGame.score.toLocaleString()+' · Lives '+previewGame.lives;if(text!==previewHud){$('#preview-score').textContent=text;previewHud=text;}
   $('#preview-launch').hidden=(previewGame.state!=='ready'&&!previewGame.balls.some(b=>b.held))||previewGame.state==='over'||previewGame.state==='cleared';
  }
 }else{previewRenderClock.reset();previewSceneDelta=0;}
}
const previewLoop=startFrameLoop(frame,{onError(error){keys.clear();previewInput.cancel();previewReady=false;accumulator=0;if(previewGame)previewGame.state='paused';$('#preview-launch').disabled=true;$('#restart-preview').disabled=true;$('#preview-status').textContent='The preview stopped unexpectedly. Close it and try Preview again. Your working world is retained.';console.error('Preview frame failed:',error);}});

function setEditing(enabled){
 for(const selector of ['.editor-layout','.workshop-actions'])$(selector).inert=!enabled;
 $('#edit-phase').disabled=!enabled;$('#publish').disabled=!enabled||!baseHTML;
}
function populatePhases(){ $('#edit-phase').replaceChildren();world.formations.forEach((_,i)=>$('#edit-phase').add(new Option((i+1)+' of '+world.formations.length,String(i))));phase=Math.min(phase,world.formations.length-1);$('#edit-phase').value=String(phase);}
function openWorld(value,status){if(!working)working=new WorldWorkingDocument($('#edit-board'));world=working.replace(value);detailsDirty=false;unsaved=false;phase=0;selection.clear();populatePhases();brushState.color=world.accent;history=[];future=[];setEditing(true);render();setTool('select');$('#draft-status').textContent=status.includes('restor')?'Draft restored':'World loaded';message(status);}
for(const key of ['shape','music'])for(const theme of THEMES)$('#world-'+key).add(new Option(theme,theme));
$('#world-details').oninput=()=>{detailsDirty=true;};
$('#world-details').onsubmit=event=>{event.preventDefault();const applied=commit(()=>{for(const key of ['name','note','tag','story','mechanic','shape','music','sky','accent'])world[key]=$('#world-'+key).value.trim();world.colors=$('#world-colors').value.trim().split(/\s+/);});if(applied||['name','note','tag','story','mechanic','shape','music','sky','accent'].every(key=>world[key]===$('#world-'+key).value.trim())&&world.colors.join(' ')===$('#world-colors').value.trim())detailsDirty=false;};
$('#retry-world').onclick=initialize;
$('#use-original').onclick=()=>{baseHTML='';openWorld(originalWorld(index),'Original release opened as an offline draft. Reload published before publishing.');};
$('#use-draft').onclick=async()=>{try{const durable=await editorDrafts.read(slugFromPath).catch(()=>null),draft=durable||safeStorage.get(draftKey(slugFromPath));if(!draft)throw Error('No valid draft for this world');const recovered=durable?parseWorld(draft.html,{expectedSlug:slugFromPath}):normalizeWorld(draft.world);if(recovered.slug!==slugFromPath)throw Error('Draft identity mismatch');draftRevision=durable?.revision??null;baseHTML='';openWorld(recovered,'Your offline draft is open. Reload published before publishing; download your draft first to keep both versions.');}catch(e){message(e.message);}};
async function initialize(){
 const generation=++loadGeneration;
 setEditing(false);$('#world-recovery').hidden=true;
 if(index<0){message('Unknown world. Choose a world from the menu.');$('#edit-world').focus();return;}
 try{
  const routed=$('#routed-world #world');const fresh=routed?parseWorld(routed,{expectedSlug:slugFromPath}):await published(slugFromPath);
  let durable;try{durable=await editorDrafts.read(slugFromPath);}catch{}
  if(generation!==loadGeneration)return;
  routed?.remove();baseHTML=worldHTML(fresh);
  const draft=durable||safeStorage.get(draftKey(slugFromPath));let restored;draftRevision=durable?.revision??null;
  if(draft)try{restored=durable?parseWorld(durable.html,{expectedSlug:slugFromPath}):normalizeWorld(draft.world);baseHTML=draft.baseHTML?worldHTML(parseWorld(draft.baseHTML,{expectedSlug:slugFromPath})):'';}catch{restored=null;}
  openWorld(restored||fresh,restored?(baseHTML?'Your saved draft is restored. Publishing checks for changes to the shared world.':'Offline draft restored. Download it, then reload published before publishing.'):'Ready · '+fresh.name+' · Changes save as a draft.');
 }catch(error){let durable;try{durable=await editorDrafts.read(slugFromPath);}catch{}if(generation!==loadGeneration)return;world=null;baseHTML='';$('#world-recovery').hidden=false;$('#use-draft').hidden=!durable&&!safeStorage.get(draftKey(slugFromPath));message(error.message+' Choose Retry, your saved draft, or the original release.');}
}
initialize();
window.addEventListener('beforeunload',event=>{if(leaving)return;finishColorEdit();if(drag)cancelDrag();if(detailsDirty||unsaved){event.preventDefault();event.returnValue='';}});
document.addEventListener('click',async event=>{const link=event.target.closest('a[href]');if(!link||link.target==='_blank'||link.hasAttribute('download')||event.defaultPrevented||event.ctrlKey||event.metaKey||event.shiftKey)return;event.preventDefault();if(await preserveDraft()){leaving=true;location.href=link.href;}});

function inspectorSheet(open){$('#brick-inspector').classList.toggle('sheet-open',open);$('#mobile-inspector').setAttribute('aria-expanded',String(open));}
$('#mobile-inspector').onclick=()=>inspectorSheet(!$('#brick-inspector').classList.contains('sheet-open'));
$('#close-inspector').onclick=()=>{inspectorSheet(false);$('#edit-board').focus({preventScroll:true});};
$('#edit-board').addEventListener('keydown',event=>{const node=event.target.closest('[data-brick-id]');if(node&&['Enter',' '].includes(event.key)){event.preventDefault();setTool('select');choose(Number(node.dataset.brickId),event.shiftKey);}});
new ResizeObserver(entries=>{const r=entries[0].contentRect;$('#edit-board').style.backgroundPosition=(r.width*.06575)+'px '+(r.height*.07375)+'px';}).observe($('#edit-board'));
