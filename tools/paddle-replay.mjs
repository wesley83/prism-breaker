// Isolated, read-only before/after physics reproduction. Not published with the game.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const baseline=Bun.spawnSync(['git','show','43d543f:public/engine.js'],{stdout:'pipe',stderr:'pipe'});
if(baseline.exitCode)throw Error('Cannot read recorded pre-fix engine');
const before=baseline.stdout.toString().replaceAll("from './","from '/");
const script=`import {Game as Before,LIMIT} from '/before-engine.js';import {Game as After} from '/engine.js';
const engines={before:Before,after:After};
function replay(kind){for(const [id,Engine]of Object.entries(engines)){
 const game=new Engine();game.launch();let hits=0;game.emit=e=>{if(e.type==='paddle')hits++;};
 const ball=game.balls[0];Object.assign(ball,{x:kind==='lower'?2:1.6,y:LIMIT.paddleY+(kind==='lower'?-.12:.43),vx:0,vy:-18});game.move(kind==='lower'?8:-8);
 const start={x:ball.x,y:ball.y};game.tick(1/120);
 const canvas=document.querySelector('#'+id),ctx=canvas.getContext('2d'),px=x=>canvas.width/2+x*65,py=y=>canvas.height/2-(y-LIMIT.paddleY)*65;
 ctx.fillStyle='#0c2025';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='#677d83';ctx.lineWidth=1;ctx.strokeRect(px(-1.65),py(LIMIT.paddleY+.17),3.3*65,.34*65);
 ctx.fillStyle='#c8ece2';ctx.fillRect(px(game.paddle.x-game.paddle.w/2),py(LIMIT.paddleY+.17),game.paddle.w*65,.34*65);
 // Solid raised endcaps are 0.416 tall; decorative glow is not collision geometry.
 for(const side of [-1,1]){ctx.fillStyle=side<0?'#55d6ef':'#ec8ac7';ctx.fillRect(px(game.paddle.x+side*(game.paddle.w/2-.15)-.15),py(LIMIT.paddleY+.208),.3*65,.416*65);}
 ctx.strokeStyle='#6f8389';ctx.beginPath();ctx.arc(px(start.x),py(start.y),ball.r*65,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(px(ball.x),py(ball.y),ball.r*65,0,Math.PI*2);ctx.fill();
 document.querySelector('#'+id+'-result').textContent=(hits?'CAUGHT':'MISSED')+' · vertical speed '+ball.vy.toFixed(2)+' · ball center '+(ball.y-LIMIT.paddleY).toFixed(3)+' from paddle center';
 document.querySelector('#'+id+'-result').dataset.caught=String(hits>0);
 }document.querySelector('#case').textContent=kind==='lower'?'Descending ball beside the lower half; paddle moves right.':'Ball touching a raised endcap; paddle moves left.';
}
for(const button of document.querySelectorAll('[data-case]'))button.onclick=()=>replay(button.dataset.case);replay('lower');`;
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Paddle collision reproduction</title><style>body{margin:0;padding:28px;background:#0a171b;color:#e9f4f2;font:16px/1.5 system-ui,sans-serif}main{max-width:1100px;margin:auto}h1{font-size:30px;margin:0 0 8px}p{color:#bdcccf}button{padding:12px 16px;margin:8px 8px 12px 0;background:#d4e9e6;color:#12282c;border:0;border-radius:6px;font:inherit;cursor:pointer}.comparison{display:grid;grid-template-columns:1fr 1fr;gap:24px}canvas{width:100%;border:1px solid #42565c;border-radius:8px}output{display:block;font-size:14px}small{display:block;color:#b8cacc;margin-top:16px}@media(max-width:650px){.comparison{grid-template-columns:1fr}}</style><main><h1>Paddle collision reproduction</h1><p>One physics step, identical input. Outline: starting positions. Filled shapes: positions after the step.</p><button data-case="lower">Replay lower-side contact</button><button data-case="cap">Replay raised-endcap contact</button><p id="case"></p><div class="comparison"><section><h2>Before</h2><canvas id="before" width="520" height="220"></canvas><output id="before-result"></output></section><section><h2>After</h2><canvas id="after" width="520" height="220"></canvas><output id="after-result"></output></section></div><small>Local diagnostic only. Uses the actual old and revised game engines with a flat drawing of their solid paddle geometry; not a full Three.js gameplay recording. No scores are submitted.</small></main><script type="module" src="/replay.js"></script></html>`;
const root=path.resolve('public'),types={'.js':'text/javascript','.html':'text/html'};
http.createServer(async(req,res)=>{try{
 if(req.method!=='GET'){res.writeHead(405).end();return;}
 const url=new URL(req.url,'http://127.0.0.1:4176');
 if(url.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'}).end(html);return;}
 if(url.pathname==='/replay.js'||url.pathname==='/before-engine.js'){res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'}).end(url.pathname==='/replay.js'?script:before);return;}
 const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(await fs.readFile(file));
 }catch{res.writeHead(404).end();}
}).listen(4176,'127.0.0.1',()=>console.log('Paddle reproduction: http://127.0.0.1:4176/'));
