// Local-only UI acceptance harness. Never deploy this fixture.
import fs from 'node:fs/promises';
await fs.mkdir('test-results/fixture',{recursive:true});
const html=await fs.readFile('public/index.html','utf8');
const controls='<aside id="qa-panel" style="position:fixed;z-index:9999;bottom:0;left:0;background:#16242b;color:white;padding:8px;max-width:100%;font:12px monospace"><button id="qa-worlds">Run 16-world acceptance</button> <button id="qa-rollover">Check daily midnight</button> <button id="qa-expiry">Check visible expiry</button><pre id="qa-result" style="max-height:160px;overflow:auto;white-space:pre-wrap"></pre></aside>';
await fs.writeFile('test-results/fixture/acceptance.html',html.replace(/src="\/app.js[^\"]*"/,'src="/__qa/acceptance-app.js"').replace('</body>',controls+'</body>'));
const prefix=`
const qaRealFetch=globalThis.fetch.bind(globalThis);let qaServerOffset=0,qaRows=[],qaRequests=[],qaErrors=[];
addEventListener('error',e=>qaErrors.push(e.message));addEventListener('unhandledrejection',e=>qaErrors.push(String(e.reason)));
globalThis.fetch=async(input,options={})=>{
 const url=String(input);
 if(url.startsWith('/scores.html')){
   const now=Date.now()+qaServerOffset;qaRequests.push({method:options.method||'GET',at:now});
   if(options.method==='DELETE'){qaRows=qaRows.filter(r=>Number(r.expiresAt)>=now);return new Response('',{status:200});}
   if(options.method==='POST'){const doc=new DOMParser().parseFromString(options.body,'text/html'),r={};doc.querySelectorAll('meta[itemprop]').forEach(m=>r[m.getAttribute('itemprop')]=m.getAttribute('content'));r.expiresAt=now+432000000;qaRows.push(r);return new Response('',{status:201});}
   return new Response('<ul id="scores">'+qaRows.map(r=>'<li itemscope itemtype="https://sane-guild-8399.onpagelove.com/Run">'+Object.entries(r).map(([k,v])=>'<meta itemprop="'+k+'" content="'+v+'">').join('')+'</li>').join('')+'</ul>',{status:200,headers:{Date:new Date(now).toUTCString()}});
 }
 return qaRealFetch(input,options);
};
`;
let app=await fs.readFile('public/app.js','utf8');
app=app.replaceAll("from './","from '/").replaceAll("import('./","import('/");
// Disable service-worker registration only in the local harness, keeping app/game code intact.
app=app.replace(/import \{setupOfflinePlay\} from '[^']+';/,"const setupOfflinePlay=()=>({refresh(){}});");
const harness=`
const qaSleep=ms=>new Promise(r=>setTimeout(r,ms));
const qaResults=[];const qaReport=value=>{qaResults.push(value);$('#qa-result').textContent=JSON.stringify(qaResults,null,2);};
const qaWait=async test=>{for(let n=0;n<300;n++){if(test())return;await qaSleep(50);}throw Error('Acceptance wait timed out');};
const qaRow=(name,extra={})=>({runKey:crypto.randomUUID(),player:name,score:100,level:1,seconds:60,mode:'campaign',day:'all',ruleset:RULESET_REVISION,expiresAt:Date.now()+qaServerOffset+432000000,...extra});
const qaClock=ms=>{qaServerOffset=ms-Date.now();clockOffset=qaServerOffset;boardDate=currentDay();armDayRollover();};
$('#qa-worlds').onclick=async()=>{try{
 await qaWait(()=>stage&&!stage.preparing);await begin('campaign');
 for(let index=0;index<WORLD_COUNT;index++){
   if(game.level!==index)throw Error('Wrong world progression');
   const phases=[];while(view==='game'){
     phases.push(game.phase);game.launch();
     for(const brick of game.bricks)while(brick.hp>0)game.damage(brick);
     game.state='playing';game.tick(1/120);await qaSleep(100);
   }
   await qaWait(()=>view==='cut'&&cutReady&&!stage.preparing);await qaSleep(1000);
   qaReport({world:index+1,name:game.world.name,phases,title:$('#cut-title').textContent,story:$('#cut-story').textContent,next:$('#cut-next').textContent,score:game.score,errors:[...qaErrors]});
   finishCut();await qaSleep(100);
 }
 await qaWait(()=>view==='result'||view==='champion');if(view==='champion'){await qaWait(()=>cutReady);await qaSleep(1500);finishCelebration();}
 qaReport({campaignComplete:game.state==='won',resultTitle:$('#result-title').textContent,level:endResult?.level,score:endResult?.score,errors:qaErrors});
}catch(error){qaReport({failure:error.message,errors:qaErrors});}};
$('#qa-rollover').onclick=async()=>{try{
 home();qaClock(Date.parse('2026-10-14T23:59:55Z'));
 qaRows=[qaRow('Before midnight',{mode:'daily',day:'2026-10-14'}),qaRow('New day',{mode:'daily',day:'2026-10-15'})];
 await begin('daily');openLeaderboard();await qaWait(()=>!scoreLoading);qaReport({beforeMidnight:$('#score-rows').textContent,runDay});
 await qaSleep(6200);await qaWait(()=>!scoreLoading);qaReport({afterMidnight:$('#score-rows').textContent,day:currentDay(),runDay,challenge:$('#daily-detail').textContent,status:$('#score-status').textContent});
 closeDialogs();finish(true);await qaSleep(100);qaReport({previousDayResult:$('#result-description').textContent,record:!!endResult.record,errors:qaErrors});
}catch(error){qaReport({failure:error.message});}};
$('#qa-expiry').onclick=async()=>{try{
 home();qaClock(Date.parse('2026-10-14T12:00:00Z'));
 qaRows=[qaRow('Expires soon',{expiresAt:Date.now()+qaServerOffset+3000,score:500}),qaRow('Keep active')];
 openLeaderboard();await qaWait(()=>!scoreLoading);qaReport({beforeExpiry:$('#score-rows').textContent});
 await qaSleep(4500);qaReport({afterExpiry:$('#score-rows').textContent,remaining:qaRows.map(r=>r.player),deletes:qaRequests.filter(r=>r.method==='DELETE').length,errors:qaErrors});
}catch(error){qaReport({failure:error.message});}};
`;
await fs.writeFile('test-results/fixture/acceptance-app.js',prefix+app+harness);
console.log('Local acceptance fixture ready at /__qa/acceptance.html');
