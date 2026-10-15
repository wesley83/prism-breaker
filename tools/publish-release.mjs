import fs from 'node:fs/promises';
import path from 'node:path';
import {DOMParser} from 'linkedom';
import {sha256, releasePrefix} from './immutable-release.mjs';

const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ico':'image/vnd.microsoft.icon','.woff2':'font/woff2','.webmanifest':'application/manifest+json','.json':'application/json'};
export function htmlIdentity(bytes) {
  const doc = new DOMParser().parseFromString(bytes.toString('utf8'), 'text/html');
  if (!doc.documentElement) return sha256('unparsed:' + bytes.toString('utf8'));
  function node(n) {
    if (n.nodeType === 3) {
      const text = n.textContent.replace(/\r\n/g, '\n');
      return /^(SCRIPT|STYLE|PRE)$/.test(n.parentNode?.nodeName) ? text.trim() : text.replace(/\s+/g, ' ').trim();
    }
    if (n.nodeType !== 1) return null;
    return [n.localName, [...n.attributes].filter(a => !/^xmlns(?::|$)/.test(a.name)).map(a => [a.name,a.value]).sort((a,b)=>a[0].localeCompare(b[0])), [...n.childNodes].map(node).filter(v => v !== null && v !== '')];
  }
  return sha256(JSON.stringify(node(doc.documentElement)));
}
export const sameFile = (name, expected, actual) => name.endsWith('.html') || name === '/editor/:worldname' ? htmlIdentity(expected) === htmlIdentity(actual) : expected.equals(actual);

// The caller supplies a pinned authoring endpoint and an in-memory owner header.
// No persistent score, policy, world source or legacy root script is written here.
export async function publishRelease({root, packageDirectory, version, dav, headers, fetch:request=globalThis.fetch, beforePromote=async()=>{}, progress=()=>{}, onCheckpoint=async()=>{}}) {
  const prefix = releasePrefix(version), manifest = JSON.parse(await fs.readFile(path.join(packageDirectory,'release.json'),'utf8'));
  if (manifest.version !== version || manifest.schema !== 1 || !Array.isArray(manifest.files) || !manifest.files.length) throw Error('Release package identity mismatch');
  for(const record of manifest.files){
    if(!/^\/[A-Za-z0-9_./-]+$/.test(record.path)||record.path.includes('..')||record.url!==prefix+record.path)throw Error('Unsafe package inventory');
    if(sha256(await fs.readFile(path.join(packageDirectory,record.path.slice(1))))!==record.sha256)throw Error('Package changed after build: '+record.path);
  }
  const entries = [
    ['manifest.webmanifest','/manifest.webmanifest'], ['worlds.html','/worlds.html'], ['world-catalog.html','/world-catalog.html'],
    ['editor.html','/editor.html'], ['editor.html','/editor/index.html'], ['editor-route.html','/editor/:worldname'],
    ['index.html','/index.html'], ['@worker','/sw.js']
  ].filter(([name])=>name==='@worker'||manifest.files.some(f=>f.path==='/'+name));
  const read = async (target, requireEtag=false) => {
    const response = await request(dav+target,{headers,cache:'no-store',signal:AbortSignal.timeout(20000)});
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!response.ok && response.status !== 404) throw Error('Publication read '+target+' '+response.status);
    if (requireEtag && response.ok && !response.headers.get('etag')) throw Error('Missing ETag for '+target);
    return {status:response.status,etag:response.headers.get('etag'),bytes};
  };
  // Save the exact pre-promotion state, allowing conditional retry/rollback decisions.
  const baselines = new Map();
  for (const [,target] of entries) baselines.set(target,await read(target,true));
  const folders = new Set(['/releases/',prefix+'/', '/editor/']);
  for (const record of manifest.files.filter(f=>f.stage!==false)) {
    if (!record.url.startsWith(prefix+'/') || record.path.includes('..') || record.url !== prefix+record.path) throw Error('Unsafe package inventory');
    let folder = path.posix.dirname(record.url);
    while (folder.startsWith(prefix+'/')) { folders.add(folder+'/');folder=path.posix.dirname(folder); }
  }
  for (const folder of [...folders].sort((a,b)=>a.length-b.length)) {
    const r = await request(dav+folder,{method:'MKCOL',headers,signal:AbortSignal.timeout(20000)});
    if (![201,405].includes(r.status)) throw Error('Release directory '+folder+' '+r.status);
  }
  const files=[];
  if(!manifest.worker||manifest.worker.url!==prefix+'/service-worker.js'||manifest.worker.path!=='/service-worker.js')throw Error('Missing rollback worker');
  const savedWorker=await fs.readFile(path.join(packageDirectory,'service-worker.js'),'utf8');
  if(!savedWorker.includes('const VERSION = '+JSON.stringify(version)+';')||sha256(savedWorker)!==manifest.worker.sha256)throw Error('Rollback worker identity mismatch');
  const inventory=JSON.parse(savedWorker.match(/const PRECACHE = (\[[\s\S]*?\]);/)?.[1]||'null');
  if(!Array.isArray(inventory)||!inventory.length||inventory.some(a=>!manifest.files.some(f=>f.stage!==false&&f.path===a.path&&f.url===a.url&&f.sha256===a.sha256)))throw Error('Invalid worker inventory');
  for (const record of [...manifest.files.filter(f=>f.stage!==false),manifest.worker,{path:'/release.json',url:prefix+'/release.json',sha256:sha256(await fs.readFile(path.join(packageDirectory,'release.json')))}]) {
    const bytes=await fs.readFile(path.join(packageDirectory,record.path.slice(1)));
    if (sha256(bytes)!==record.sha256) throw Error('Package changed after build: '+record.path);
    const existing=await read(record.url);
    let status=existing.status;
    if (existing.status===404) {
      const r=await request(dav+record.url,{method:'PUT',headers:{...headers,'If-None-Match':'*','Content-Type':types[path.extname(record.path)]||'application/octet-stream'},body:bytes,signal:AbortSignal.timeout(20000)});
      if (!r.ok && r.status!==412) throw Error('Immutable upload '+record.path+' '+r.status);
      status=r.status;
    }
    const check=await read(record.url);
    if(check.status!==200||!sameFile(record.path,bytes,check.bytes))throw Error('Immutable readback mismatch: '+record.path);
    files.push({path:record.url,status,sha256:sha256(check.bytes),bytes:check.bytes.length});progress({staged:record.url,status});
  }
  await beforePromote();
  await onCheckpoint({phase:'staged',version,files:files.length});
  // Every entry is self-contained. A failed later promotion leaves an old or new
  // coherent graph; shared root legacy modules remain untouched for old visitors.
  for(const [name,target]of entries){
    const bytes=await fs.readFile(path.join(packageDirectory,name==='@worker'?'service-worker.js':name)),baseline=baselines.get(target);
    const current=await read(target,true);
    if(current.status===200&&sameFile(target,bytes,current.bytes)){progress({preserved:target});continue;}
    if(current.status!==baseline.status||current.etag!==baseline.etag)throw Error('Concurrent publication changed '+target+'; reconcile before retrying');
    const conditional=baseline.status===404?{'If-None-Match':'*'}:{'If-Match':baseline.etag};
    const write=await request(dav+target,{method:'PUT',headers:{...headers,...conditional,'Content-Type':name==='@worker'?'text/javascript; charset=utf-8':types[path.extname(name)]||'text/html; charset=utf-8'},body:bytes,signal:AbortSignal.timeout(20000)});
    if(!write.ok)throw Error('Entry promotion '+target+' '+write.status);
    const check=await read(target,true);
    if(check.status!==200||!sameFile(target,bytes,check.bytes))throw Error('Entry readback mismatch: '+target);
    files.push({path:target,status:write.status,sha256:sha256(check.bytes),bytes:check.bytes.length});progress({promoted:target,status:write.status});
    await onCheckpoint({phase:'promoting',version,last:target,files:files.length});
  }
  return {version,files,cache:{assets:inventory.length,bytes:inventory.reduce((sum,a)=>sum+(a.bytes||0),0)},publication:'immutable dependencies before conditional entry promotion',preserved:['scores','world definitions','legacy root scripts/styles','older release directories']};
}
