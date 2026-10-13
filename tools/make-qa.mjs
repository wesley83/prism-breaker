import fs from 'node:fs/promises';
await fs.mkdir('test-results/fixture',{recursive:true});
const html=await fs.readFile('public/index.html','utf8');
await fs.writeFile('test-results/fixture/index.html',html.replace(/\/app\.js\?v=\d+/,'/__qa/app.js').replace('</body>','<div id="qa" style="position:fixed;bottom:0;left:0;z-index:999;background:#243749;padding:8px;display:flex;flex-wrap:wrap;max-width:100%;gap:5px"><button id="qa-clear">QA clear level</button><button id="qa-power">QA multiball</button><button id="qa-shield">QA shield</button><button id="qa-over">QA finish run</button></div></body>'));
const app=(await fs.readFile('public/app.js','utf8')).replaceAll("from './","from '/").replaceAll("import('./","import('/").replace("fetch('/scores.html?cb='","fetch('/__qa/scores.html?cb='");
const day=new Date().toISOString().slice(0,10);
const runs=[{player:'Runner Two',score:42500,level:3,seconds:150,mode:'campaign',day:'all'},{player:'PrismChampion-01',score:42500,level:4,seconds:90,mode:'campaign',day:'all'},{player:'Daily Star',score:18500,level:2,seconds:65,mode:'daily',day},{player:'Old Daily',score:99999,level:8,seconds:30,mode:'daily',day:'2020-01-01'},{player:'Practice',score:500000,level:8,seconds:1,mode:'practice',day:'all'}];
await fs.writeFile('test-results/fixture/scores.html','<!doctype html><ul id="scores">'+runs.map(r=>'<li itemscope itemtype="https://sane-guild-8399.onpagelove.com/Run">'+Object.entries(r).map(([key,value])=>'<meta itemprop="'+key+'" content="'+value+'">').join('')+'</li>').join('')+'</ul>');
await fs.writeFile('test-results/fixture/app.js',app+`\n$('#qa-clear').onclick=()=>{if(view==='home')begin();game.bricks.forEach(b=>b.hp=0);game.state='playing';game.tick(1/120);};$('#qa-power').onclick=()=>game.power('multi');$('#qa-shield').onclick=()=>game.power('shield');$('#qa-over').onclick=()=>{game.score=1250;game.elapsed=90;game.lives=0;finish(false);};\n`);
console.log('Local-only browser fixture generated.');
const fixtureHtml=await fs.readFile('test-results/fixture/index.html','utf8');
await fs.writeFile('test-results/fixture/empty-scores.html','<!doctype html><ul id="scores"></ul>');
for(const [name,endpoint]of [['empty','empty-scores.html'],['offline','missing-scores.html']]){await fs.writeFile('test-results/fixture/'+name+'.html',fixtureHtml.replace('/__qa/app.js','/__qa/app-'+name+'.js'));await fs.writeFile('test-results/fixture/app-'+name+'.js',(await fs.readFile('test-results/fixture/app.js','utf8')).replace('/__qa/scores.html?cb=','/__qa/'+endpoint+'?cb='));}
