// Generate a local-only, visible before/after GPU workload. No score or authoring requests.
import fs from 'node:fs/promises';import path from 'node:path';import {spawnSync} from 'node:child_process';import {ROOT} from './repository-check.mjs';
const argument=process.argv.indexOf('--baseline-ref'),baseline=argument>=0?process.argv[argument+1]:'f06a58d81be1a0d4027a6b68ac82a07b9c7169b4';
if(!/^[a-zA-Z0-9][a-zA-Z0-9/._-]*$/.test(baseline||''))throw Error('Supply a valid baseline Git ref');
const git=args=>{const p=spawnSync('git',['-c','safe.directory='+ROOT.replaceAll('\\','/'),...args],{cwd:ROOT,maxBuffer:16*1024*1024});if(p.status!==0)throw Error('Cannot read baseline Git source');return p.stdout;};
const dir=path.join(ROOT,'test-results/fixture'),base=path.join(dir,'performance-baseline');await fs.mkdir(base,{recursive:true});
for(const file of git(['ls-tree','-r','--name-only',baseline,'--','public']).toString().trim().split('\n')){if(!file.startsWith('public/'))throw Error('Unexpected baseline path');const dest=path.join(base,file.slice(7));await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,git(['show',baseline+':'+file]));}
await fs.writeFile(path.join(dir,'performance.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Prism render performance lab</title><style>body{background:#102025;color:#edf8ef;font:14px/1.5 system-ui;margin:20px}main{max-width:1000px;margin:auto}button,select{font:inherit;padding:10px;margin:4px;background:#203b40;color:inherit;border:1px solid #71898c;border-radius:4px}button:disabled{opacity:.5}canvas{display:block;width:min(900px,100%);height:560px;background:#07191c}pre{white-space:pre-wrap;font-size:12px}#status{min-height:24px}details{margin:12px 0}</style><main><h1>Prism render performance lab</h1><p>Identical deterministic render workload, separate browser refresh timing and CPU submission measurements. Desktop results do not represent a phone GPU. Physics is not benchmarked here. Baseline: ${baseline}.</p><label>Workload <select id="scenario"><option value="quiet">Dawn Nexus, crystals</option><option value="stress">Dawn Nexus, multiball + eight power-ups + fragments</option><option value="low">Same stress workload, fewer effects</option><option value="classic">Same stress workload, classic artwork</option></select></label><button id="baseline">Measure previous renderer</button><button id="candidate">Measure optimized renderer</button><button id="both">Measure both</button><p id="status" role="status">Ready.</p><div id="canvas-host"></div><p id="diagnostic"></p><details open><summary>Visual correctness controls</summary><button id="damage">Damage armor</button><button id="remove">Remove a brick</button><button id="restore">Restore formation</button><button id="classic">Switch classic artwork</button><button id="quality">Switch effects quality</button><button id="cut">Show cinematic</button><button id="game">Return to game</button><button id="phase">Next formation</button></details><pre id="results">[]</pre><script type="module" src="/__qa/performance.js"></script></main></html>`);
await fs.writeFile(path.join(dir,'performance.js'),String.raw`
import {Stage as Before} from './performance-baseline/scene.js';import {Stage as After} from '/scene.js';import {Game} from '/engine.js';import {POWERS,rng} from '/levels.js';
const $=s=>document.querySelector(s),reports=[];let stage,game,settings,mode='game',time=0,random,recording=false;
 function cleanup(){if(!stage)return;const geometries=new Set(),materials=new Set();stage.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);if(o.isInstancedMesh)o.dispose();});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();stage.composer?.dispose();stage.renderer.dispose();stage.renderer.forceContextLoss();stage=null;}
function diagnostic(){const info=stage.performanceInfo?.()||{drawCalls:stage.renderer.info.render.calls,particles:stage.particles.length,pixelRatio:stage.renderer.getPixelRatio()};$('#diagnostic').textContent=JSON.stringify(info);}
function paint(){stage.renderer.info.reset();stage.render(game,0,time,mode,7);diagnostic();}
async function run(version){
 recording=true;for(const b of document.querySelectorAll('button'))b.disabled=true;const scenario=$('#scenario').value;$('#status').textContent='Preparing '+version+' · '+scenario;cleanup();
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-label','Performance workload arena');$('#canvas-host').replaceChildren(canvas);settings={lowEffects:scenario==='low',classicMode:scenario==='classic',reducedMotion:false};
 game=new Game();game.start('practice',15,8399);stage=new (version==='previous'?Before:After)(canvas,settings);stage.renderer.info.autoReset=false;mode='game';random=rng(338);await stage.prepare(game);
 for(const b of game.bricks)if(b.maxHp>1)b.hp=1;
 if(scenario!=='quiet'){const ball=game.balls[0];game.balls=Array.from({length:12},(_,id)=>({...ball,id:id+100,held:false}));game.drops=Object.keys(POWERS).map((kind,id)=>({id:id+200,kind,x:(id%4-1.5)*4,y:3-Math.floor(id/4)*4}));}
 const samples=[],calls=[],gaps=[],counts=[],triangles=[];let index=0,last=0;time=0;
 await new Promise((resolve,reject)=>{function frame(now){try{if(document.hidden)throw Error('Keep the lab active while measuring.');const delta=last?now-last:0;last=now;time=index/60;
  for(const b of game.bricks)if(b.moving)b.x=b.baseX+Math.sin(time*.7+b.row)*.28;
  game.balls.forEach((b,i)=>{b.x=Math.sin(time+i)*8;b.y=-6+Math.sin(time*.7+i)*3;});
  if(scenario!=='quiet'){stage.particle((random()-.5)*12,3,'#79e6ff',4);if(index%30===0)stage.particle(0,5,'#ffbd82',26);}
  stage.renderer.info.reset();const start=performance.now();stage.render(game,1/60,time,'game');const cpu=performance.now()-start;
  if(index>=30){samples.push(cpu);calls.push(stage.renderer.info.render.calls);triangles.push(stage.renderer.info.render.triangles);gaps.push(delta);counts.push(stage.particleBatch?.count??stage.particles.length);}
  if(++index<150){$('#status').textContent='Measuring '+version+' · '+scenario+' · '+Math.max(0,index-30)+'/120';requestAnimationFrame(frame);}else resolve();
 }catch(e){reject(e);}}requestAnimationFrame(frame);});
 const mean=a=>a.reduce((s,n)=>s+n,0)/a.length,percentile=(a,p)=>[...a].sort((x,y)=>x-y)[Math.floor((a.length-1)*p)],rounded=n=>Math.round(n*100)/100;
 const result={version,scenario,frames:samples.length,canvas:[canvas.clientWidth,canvas.clientHeight],pixelRatio:stage.renderer.getPixelRatio(),cpuMeanMS:rounded(mean(samples)),cpuP95MS:rounded(percentile(samples,.95)),refreshFPS:rounded(1000/mean(gaps)),slowFrames:gaps.filter(n=>n>22).length,meanDrawCalls:rounded(mean(calls)),meanTriangles:rounded(mean(triangles)),peakParticles:Math.max(...counts)};
 reports.push(result);$('#results').textContent=JSON.stringify(reports,null,2);$('#status').textContent='Complete · '+version+' · '+scenario;diagnostic();recording=false;for(const b of document.querySelectorAll('button'))b.disabled=false;return result;
}
function safe(action){return async()=>{try{await action();}catch(e){recording=false;$('#status').textContent='FAILED: '+e.message;console.error(e);for(const b of document.querySelectorAll('button'))b.disabled=false;}};}
$('#baseline').onclick=safe(()=>run('previous'));$('#candidate').onclick=safe(()=>run('optimized'));$('#both').onclick=safe(async()=>{await run('previous');await run('optimized');});
$('#damage').onclick=()=>{const b=game.bricks.find(b=>b.hp>1);if(b)game.damage(b);paint();};$('#remove').onclick=()=>{const b=game.bricks.find(b=>b.hp>0);if(b)b.hp=0;paint();};$('#restore').onclick=()=>{game.loadLevel();stage.reset();paint();};
$('#classic').onclick=()=>{settings.classicMode=!settings.classicMode;paint();};$('#quality').onclick=safe(async()=>{settings.lowEffects=!settings.lowEffects;stage.configureQuality?.();await stage.prepare(game);paint();});
$('#cut').onclick=safe(async()=>{mode='cut';await stage.prepareCut(game);paint();});$('#game').onclick=()=>{mode='game';paint();};$('#phase').onclick=()=>{game.phase=(game.phase+1)%3;game.loadLevel();stage.reset();paint();};
`);
console.log('Open /__qa/performance.html on the local preview server. Baseline '+baseline);
await fs.appendFile(path.join(dir,'performance.js'),String.raw`
const reviewButton=document.createElement('button');reviewButton.id='review-all';reviewButton.textContent='Review all formations and artwork modes';$('#results').before(reviewButton);
const reviewResult=document.createElement('pre');reviewResult.id='review-results';reviewButton.after(reviewResult);
reviewButton.onclick=safe(async()=>{
 if(!stage||!stage.brickBatch)throw Error('Measure the optimized renderer first.');for(const b of document.querySelectorAll('button'))b.disabled=true;const reviewed=[];
 for(const low of [false,true])for(const classic of [false,true]){
  settings.lowEffects=low;settings.classicMode=classic;stage.configureQuality();
  for(let level=0;level<16;level++){
   game.start('practice',level,8399);let phase=0;
   do{game.phase=phase;game.loadLevel();stage.reset();mode='game';paint();await stage.prepare(game);paint();const initial=stage.brickBatch.records.size;
    const armor=game.bricks.find(b=>b.hp>1);if(armor){game.damage(armor);paint();}
    for(const b of game.bricks)b.hp=0;paint();if(stage.brickBatch.body.count!==0||stage.brickBatch.markers.count!==0||stage.brickBatch.edges.geometry.instanceCount!==0)throw Error('Stale cleared geometry');
    reviewed.push({level:level+1,phase:phase+1,low,classic,initial,cleared:true});$('#status').textContent='Reviewing '+reviewed.length+' formations';await new Promise(requestAnimationFrame);phase++;
   }while(phase<(level===7||level===15?3:1));
  }
 }
 settings.lowEffects=false;settings.classicMode=false;stage.configureQuality();game.start('practice',15,8399);stage.reset();paint();
 $('#review-results').textContent=JSON.stringify(reviewed,null,2);$('#status').textContent='Review complete: '+reviewed.length+' formation/style combinations';for(const b of document.querySelectorAll('button'))b.disabled=false;
});
`);
await import('./make-qa.mjs');
const gameHtml=(await fs.readFile(path.join(dir,'index.html'),'utf8')).replace('/__qa/app.js','/__qa/performance-app.js');
const gameApp=await fs.readFile(path.join(dir,'app.js'),'utf8');
await fs.writeFile(path.join(dir,'performance-app.html'),gameHtml);
await fs.writeFile(path.join(dir,'performance-app.js'),gameApp+String.raw`
const renderMetrics=document.createElement('output');renderMetrics.id='render-metrics';renderMetrics.setAttribute('aria-label','Local rendering metrics');renderMetrics.style.cssText='display:block;padding:12px;background:#102025;color:white;font:12px monospace';document.querySelector('main').after(renderMetrics);
setInterval(()=>{if(stage)renderMetrics.textContent=JSON.stringify(stage.performanceInfo());},500);
const recoverGraphics=document.createElement('button');recoverGraphics.id='qa-graphics';recoverGraphics.textContent='Check graphics recovery';document.querySelector('#qa').append(recoverGraphics);
recoverGraphics.onclick=()=>{if(!stage)return;stage.renderer.forceContextLoss();setTimeout(()=>stage.renderer.forceContextRestore(),700);};
`);
