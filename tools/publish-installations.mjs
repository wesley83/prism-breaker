import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {DOMParser} from 'linkedom';
import {buildPwa} from './build-pwa.mjs';
import {assertReleaseGate} from './release-gate.mjs';
import {publishRelease,htmlIdentity} from './publish-release.mjs';
import {sha256} from './immutable-release.mjs';
import {WORLD_SLUGS} from '../public/world-format.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export async function verifyInstallation({origin,base,version,packageDirectory}){
 const manifest=JSON.parse(await fs.readFile(path.join(packageDirectory,'release.json'),'utf8')),records=[];
 const read=async resource=>{const r=await fetch(origin+resource,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(30000)});return{status:r.status,bytes:Buffer.from(await r.arrayBuffer())};};
 for(let i=0;i<manifest.files.length;i+=6)records.push(...await Promise.all(manifest.files.slice(i,i+6).filter(f=>f.stage!==false).map(async f=>{
  const actual=await read(f.url),expected=await fs.readFile(path.join(packageDirectory,f.path.slice(1)));
  // Public HTML has a host attribution; release identity is separately checked.
  const valid=actual.status===200&&(f.path.endsWith('.html')?new DOMParser().parseFromString(actual.bytes.toString(),'text/html').querySelector(f.path==='/index.html'?'meta[name="prism-release"]':'#editor-shell')!==null:sha256(actual.bytes)===f.sha256);
  return{path:f.url,status:actual.status,sha256:sha256(actual.bytes),valid};
 })));
 const [entry,install,worker,editor]=await Promise.all([read(base),read(base+'manifest.webmanifest'),read(base+'sw.js'),read(base+'editor.html')]);
 const doc=new DOMParser().parseFromString(entry.bytes.toString(),'text/html'),installed=JSON.parse(install.bytes.toString()),workshop=new DOMParser().parseFromString(editor.bytes.toString(),'text/html');
 const checks={assets:records.every(r=>r.valid),entry:entry.status===200&&doc.querySelector('meta[name="prism-release"]')?.content===version,canonical:doc.querySelector('link[rel="canonical"]')?.href===origin+base,manifestLink:doc.querySelector('link[rel="manifest"]')?.href===base+'manifest.webmanifest',install:install.status===200&&installed.id===base&&installed.scope===base&&installed.start_url===base+'?source=installed'&&installed.shortcuts.every(s=>s.url.startsWith(base+'?leaderboard=')),worker:worker.status===200&&sha256(worker.bytes)===manifest.worker.sha256,editor:editor.status===200&&workshop.querySelector('#editor-bootstrap')?.getAttribute('src')===base+'releases/'+version+'/editor-bootstrap.js'};
 return{utc:new Date().toISOString(),origin,base,version,checks,passed:Object.values(checks).every(Boolean),records};
}
async function main(){
 const mode=process.argv[2],credentialFile=process.argv[3],targets=JSON.parse(await fs.readFile(path.join(root,'deployments.json'),'utf8'));
 if(!['publish','verify'].includes(mode))throw Error('Use publish <private credential file> or verify.');
 const directory=path.join(root,'test-results/aligned-release');await fs.mkdir(directory,{recursive:true});
 let headers;
 if(mode==='publish'){
  await assertReleaseGate({root});
  if(!credentialFile)throw Error('Provide the existing private credential file path. Never pass a token in arguments.');
  const config=await fs.readFile(credentialFile,'utf8'),key=config.match(/^\s*pagelove_api_token\s*=\s*(.+)\s*$/mi)?.[1].trim().replace(/^['"]|['"]$/g,'');if(!key)throw Error('Named owner credential missing');headers={Authorization:'Bearer '+key};
  const response=await fetch('https://config.onpagelove.com/console/index.html',{headers,redirect:'error',signal:AbortSignal.timeout(25000)}),html=await response.text();
  if(!response.ok||Object.values(targets).some(t=>!html.includes(t.origin.replace('https://','https://dav-'))))throw Error('Owner host identity mismatch');
 }
 for(const [name,installation]of Object.entries(targets)){
  const built=await buildPwa({root,installation,emit:false}),{origin,base}=installation,dav=origin.replace('https://','https://dav-');
  const protectedPaths=['scores.html',...WORLD_SLUGS.map(slug=>'worlds/'+slug+'/definition.html')];
  const snapshot=async()=>Object.fromEntries(await Promise.all(protectedPaths.map(async name=>{const r=await fetch(dav+base+name,{headers,redirect:'error',signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error('Protected resource unavailable '+name);return[name,sha256(Buffer.from(await r.arrayBuffer()))];})));
  let receipt={utc:new Date().toISOString(),name,installation,version:built.version};
  if(mode==='publish'){
   const before=await snapshot();
   receipt.approval=await assertReleaseGate({root});
   receipt.publication=await publishRelease({root,version:built.version,packageDirectory:built.package,dav,headers,beforePromote:async()=>{await assertReleaseGate({root});},progress:e=>console.log(name+' '+JSON.stringify(e)),onCheckpoint:async checkpoint=>fs.writeFile(path.join(directory,name+'-checkpoint.json'),JSON.stringify(checkpoint,null,2))});
   const after=await snapshot();receipt.protectedResources={before,after,unchanged:Object.keys(before).every(p=>before[p]===after[p])};
  }
  receipt.public=await verifyInstallation({origin,base,version:built.version,packageDirectory:built.package});
  await fs.writeFile(path.join(directory,name+'.json'),JSON.stringify(receipt,null,2)+'\n');
  console.log(JSON.stringify({name,version:built.version,passed:receipt.public.passed,protectedUnchanged:receipt.protectedResources?.unchanged}));
  if(!receipt.public.passed||receipt.protectedResources?.unchanged===false)throw Error('Installation verification requires investigation: '+name);
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
