// Isolated browser update lab. Never serves or writes to the production host.
// Run from the game root; visit http://127.0.0.1:4174/. All data is disposable.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {buildPwa} from './build-pwa.mjs';
const root=path.resolve('.private/update-lab'),releases={};
const script=`import {PWA_RELEASE} from '/pwa-release.js';
import {offlineStore,ScoreOutbox} from '/offline.js';
const out=document.querySelector('#lab-state');let assetProbe='';
async function inspect(){const r=await navigator.serviceWorker.getRegistration();let info={};if(navigator.serviceWorker.controller){const channel=new MessageChannel();info=await new Promise(resolve=>{const timer=setTimeout(()=>resolve({timeout:true}),2000);channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();resolve(e.data);};navigator.serviceWorker.controller.postMessage({type:'GET_STATUS'},[channel.port2]);});}out.textContent=JSON.stringify({page:PWA_RELEASE,worker:info.version,pinned:info.clientVersion,ready:info.ready,assetProbe,waiting:r?.waiting?.state||null,checkpoint:!!localStorage.getItem('prism.save'),classic:JSON.parse(localStorage.getItem('prism.settings')||'{}').classicMode,queued:(await offlineStore.all()).length},null,2);}
for(const button of document.querySelectorAll('[data-lab]'))button.onclick=async()=>{try{const action=button.dataset.lab;if(action==='inspect')return inspect();if(action==='check'){const r=await navigator.serviceWorker.getRegistration();await r.update();}else if(action==='evict'){const cache=await caches.open('prism-breaker-release-'+PWA_RELEASE);await cache.delete('/scene.js');}else if(action==='recover'){window.dispatchEvent(new Event('online'));}else if(action==='probe'){const response=await fetch('/pwa-release.js?lab-probe=1');assetProbe=response.status+' '+await response.text();}else if(action==='seed'){const q=new ScoreOutbox({store:offlineStore,isOnline:()=>false,send:async()=>{throw Error('Local test only');}});await q.enqueue({id:'11111111-1111-4111-8111-111111111111',mode:'campaign',day:'all',score:100,level:1,seconds:20},'Update QA');q.dispose();}else await fetch('/__qa/control',{method:'POST',body:action});await inspect();}catch(error){out.textContent=String(error);}};
navigator.serviceWorker.addEventListener('controllerchange',inspect);setInterval(inspect,2000);inspect();`;
const panel=`<aside id="update-lab" style="position:relative;z-index:20;padding:16px;background:#182b32;color:white;font:14px sans-serif"><strong>Local update verification only</strong><div>${[['b','Serve release B'],['a','Serve release A'],['broken','Break asset download'],['offline','Network unavailable'],['online','Restore network'],['check','Check for update'],['seed','Seed queued score'],['inspect','Inspect release and storage'],['evict','Evict one local asset'],['recover','Recover offline cache'],['probe','Probe pinned module']].map(([id,label])=>'<button type="button" data-lab="'+id+'" style="margin:6px;padding:8px">'+label+'</button>').join('')}</div><pre id="lab-state" style="white-space:pre-wrap"></pre></aside><script type="module" src="/lab-diagnostics.js"></script>`;
for(const release of ['a','b']){
 const dir=path.join(root,release);await fs.mkdir(path.join(dir,'public'),{recursive:true});await fs.mkdir(path.join(dir,'tools'),{recursive:true});
 await fs.cp(path.resolve('public'),path.join(dir,'public'),{recursive:true});
 await fs.copyFile('tools/service-worker.template.js',path.join(dir,'tools/service-worker.template.js'));
 const html=await fs.readFile(path.join(dir,'public/index.html'),'utf8');
 await fs.writeFile(path.join(dir,'public/index.html'),html.replace(/<body([^>]*)>/,'<body$1><!-- Lab release '+release+' -->'+panel));
 await fs.writeFile(path.join(dir,'public/lab-diagnostics.js'),script);
 releases[release]=await buildPwa({root:dir});
}
let release='a',failure='';
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json','.woff2':'font/woff2','.ico':'image/vnd.microsoft.icon'};
http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://127.0.0.1:4174');
 if(url.pathname==='/__qa/control'&&req.method==='POST'){
  if(req.headers.origin&&req.headers.origin!=='http://127.0.0.1:4174'){res.writeHead(403).end();return;}
  let command='';for await(const chunk of req){command+=chunk;if(command.length>32)throw Error('Invalid command');}
  if(command==='a'||command==='b')release=command;else if(command==='online')failure='';else if(['offline','broken'].includes(command))failure=command;
  console.log(JSON.stringify({time:new Date().toISOString(),release,failure}));res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify({release,failure}));return;
 }
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(503).end('Local test: score writes unavailable');return;}
 if(failure==='offline'||(failure==='broken'&&url.pathname==='/engine.js')){res.writeHead(503).end('Intentional test network failure');return;}
 const pathname=url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname),base=path.join(root,release,'public'),file=path.resolve(base,'.'+pathname);
 if(!file.startsWith(base+path.sep)){res.writeHead(403).end();return;}
 const body=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(req.method==='HEAD'?undefined:body);
 }catch{res.writeHead(404).end('Not found');}
}).listen(4174,'127.0.0.1',()=>console.log(JSON.stringify({url:'http://127.0.0.1:4174/',releases})));
