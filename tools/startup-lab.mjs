// Disposable first-visit module failure lab. No writes to any production service.
import http from 'node:http';import fs from 'node:fs/promises';import path from 'node:path';
let fail=true;const root=path.resolve('public');
const control="document.querySelector('#restore-local-assets').onclick=async()=>{await fetch('/__qa/restore',{method:'POST'});document.querySelector('#startup-lab-status').textContent='Assets restored. Use Reload game to retry.';};";
http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://127.0.0.1:4175');
 if(req.method==='POST'&&url.pathname==='/__qa/restore'){if(req.headers.origin!=='http://127.0.0.1:4175'){res.writeHead(403).end();return;}fail=false;res.writeHead(200).end();return;}
 if(req.method!=='GET'){res.writeHead(405).end();return;}
 if(url.pathname==='/sw.js'||(fail&&url.pathname==='/engine.js')){res.writeHead(503).end('Intentional isolated failure');return;}
 if(url.pathname==='/__qa/startup-controls.js'){res.writeHead(200,{'Content-Type':'text/javascript'}).end(control);return;}
 const name=url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname),file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 let body=await fs.readFile(file);if(name==='/index.html')body=Buffer.from(body.toString().replace('</body>','<aside style="padding:20px"><button id="restore-local-assets">Restore local assets</button><p id="startup-lab-status">Isolated engine failure; worker registration disabled.</p></aside><script src="/__qa/startup-controls.js"></script></body>'));
 const type={'.js':'text/javascript','.html':'text/html','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream';res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'}).end(body);
 }catch{res.writeHead(404).end();}}).listen(4175,'127.0.0.1',()=>console.log('Startup fault lab http://127.0.0.1:4175/'));
