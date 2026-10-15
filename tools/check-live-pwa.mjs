// Read-only verification of the public release. Never reads credentials or writes to the host.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const origin='https://sane-guild-8399.onpagelove.com';
const hash=body=>createHash('sha256').update(body).digest('hex');
async function read(path){
 const response=await fetch(origin+path,{cache:'no-store',signal:AbortSignal.timeout(20000)});
 const body=Buffer.from(await response.arrayBuffer());
 return {path,status:response.status,redirected:response.redirected,body,headers:Object.fromEntries(['content-type','cache-control','etag','service-worker-allowed','content-security-policy','x-content-type-options'].map(name=>[name,response.headers.get(name)]))};
}
const worker=await read('/sw.js'),source=worker.body.toString();
if(worker.status!==200)throw Error('Worker unavailable: '+worker.status);
const version=JSON.parse(source.match(/const VERSION = ("[a-f0-9]{20}");/)?.[1]??'null');
const assets=JSON.parse(source.match(/const PRECACHE = (\[[\s\S]*?\]);/)?.[1]??'null');
if(!version||!Array.isArray(assets))throw Error('Worker inventory not recognized');
const records=[];
for(let offset=0;offset<assets.length;offset+=6){
 records.push(...await Promise.all(assets.slice(offset,offset+6).map(async asset=>{
  try{const result=await read(asset.path),sha256=hash(result.body);const match=asset.path==='/index.html'?result.body.toString().includes('content="'+version+'"'):sha256===asset.sha256;
   return {path:asset.path,status:result.status,redirected:result.redirected,headers:result.headers,bytes:result.body.length,sha256,valid:result.status===200&&!result.redirected&&match};
  }catch(error){return {path:asset.path,valid:false,error:error.message};}
 })));
}
const manifest=await read('/manifest.webmanifest'),home=await read('/');
const receipt={at:new Date().toISOString(),origin,version,worker:{status:worker.status,sha256:hash(worker.body),headers:worker.headers},manifest:JSON.parse(manifest.body),home:{status:home.status,headers:home.headers,manifestLinked:/rel="manifest"[^>]*href="\/manifest.webmanifest"/.test(home.body.toString()),releaseMarker:home.body.toString().includes('content="'+version+'"')},assets:records,passed:records.every(record=>record.valid)};
await fs.writeFile('audit/2026-10-15-pwa-live-receipt.json',JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({at:receipt.at,version,assets:records.length,passed:receipt.passed,workerHeaders:receipt.worker.headers,display:receipt.manifest.display,home:receipt.home}));
if(!receipt.passed)process.exitCode=1;
