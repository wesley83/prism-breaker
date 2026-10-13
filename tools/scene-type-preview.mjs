import fs from 'node:fs/promises';
// Local-only controls for reviewing the production scene text and camera frames.
const dir='test-results/fixture';
const scenes=[...Array.from({length:8},(_,i)=>['world-'+i,'World '+(i+1)]),['daily','Daily completion'],['adventure-record','Adventure top score'],['adventure-tie','Adventure tied score'],['adventure-partial','Adventure record before completion'],['daily-record','Daily top score'],['daily-tie','Daily tied score']];
let html=await fs.readFile(dir+'/index.html','utf8');
html=html.replace('</head>','<style>#qa select{max-width:160px}#qa-clear,#qa-power,#qa-shield,#qa-over{display:none}</style></head>').replace('<button id="qa-clear">','<select id="qa-scene" aria-label="Scene">'+scenes.map(([value,label])=>'<option value="'+value+'">'+label+'</option>').join('')+'</select><label>Scene progress <input id="qa-progress" type="number" min="0" max=".95" step=".1" value=".72" style="width:65px"></label><button id="qa-preview">Show scene</button><button id="qa-clear">');
await fs.writeFile(dir+'/scene-type.html',html.replace('/__qa/app.js','/__qa/scene-type.js'));
let app=await fs.readFile(dir+'/app.js','utf8');
app=app.replaceAll('cutTime+=dt;','if(!qaSceneHold)cutTime+=dt;').replace('if(cutTime>=duration)finishCut();','if(!qaSceneHold&&cutTime>=duration)finishCut();').replace('if(cutTime>=(settings.reducedMotion?','if(!qaSceneHold&&cutTime>=(settings.reducedMotion?').replace("view='champion';cutTime=0;","view='champion';cutTime=qaSceneHold?3.4:0;");
app+=`\nlet qaSceneHold=false;
$('#qa-preview').onclick=()=>{
 qaSceneHold=true;closeDialogs();$('#record-celebration').hidden=true;
 const selected=$('#qa-scene').value,daily=selected.startsWith('daily'),world=selected.startsWith('world-')?Number(selected.slice(6)):daily?daySeed(currentDay())%8:7;
 view='game';runDay=currentDay();game.start(daily?'daily':'campaign',world,daily?daySeed(runDay):8399);showGame();
 if(selected.startsWith('world-')||selected==='daily'){game.state='cleared';beginCut();cutTime=Number($('#qa-progress').value)*(daily?DAILY_DURATION:CINEMATICS[world].duration);}
 else{game.score=selected.endsWith('tie')?(daily?18500:42500):99900;game.elapsed=300;finish(selected!=='adventure-partial');}
};
$('#qa-progress').oninput=()=>{if(view==='cut')cutTime=Number($('#qa-progress').value)*(game.mode==='daily'?DAILY_DURATION:CINEMATICS[game.level].duration);};\n`;
await fs.writeFile(dir+'/scene-type.js',app);
await fs.writeFile(dir+'/scene-type-mobile.html','<!doctype html><body style="margin:0;background:#101c20;display:flex;justify-content:center"><iframe title="390-pixel scene review" src="/__qa/scene-type.html" width="390" height="844" style="border:0;flex:none"></iframe>');
console.log('Local-only scene typography preview generated.');
