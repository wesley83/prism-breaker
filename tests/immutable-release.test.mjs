import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildPwa} from '../tools/build-pwa.mjs';
import {releaseBytes,sha256} from '../tools/immutable-release.mjs';
import {publishRelease,sameFile} from '../tools/publish-release.mjs';
import {liveEntryIssues} from '../tools/live-release-contract.mjs';

async function fixture(){
 const base=fileURLToPath(new URL('../test-results/',import.meta.url));await fs.mkdir(base,{recursive:true});const root=await fs.mkdtemp(path.join(base,'immutable-review-'));
 await fs.mkdir(path.join(root,'tools'));await fs.mkdir(path.join(root,'public/assets'),{recursive:true});
 await fs.copyFile(new URL('../tools/service-worker.template.js',import.meta.url),path.join(root,'tools/service-worker.template.js'));
 for(const [name,body]of [['index.html','<!doctype html><html><head><link rel="stylesheet" href="/style.css"><link rel="manifest" href="/manifest.webmanifest"><script type="module" src="/app.js"></script></head><body>Fixture</body></html>'],['app.js',"import './lazy.js'; export const image='/assets/preview.png'; export const scores='/scores.html';"],['lazy.js','export const value=1;'],['style.css',"@font-face{src:url('/assets/font.woff2')}"],['assets/preview.png','pixels'],['assets/font.woff2','font'],['manifest.webmanifest','{"id":"/","scope":"/","start_url":"/","icons":[{"src":"/assets/preview.png"}]}']])await fs.writeFile(path.join(root,'public',name),body);
 return {root,...await buildPwa({root})};
}
function dav(){
 const files=new Map(),events=[];let revision=0,fail='',concurrent=null;
 const put=(name,bytes)=>files.set(name,{bytes:Buffer.from(bytes),etag:'"'+(++revision)+'"'});
 const fetch=async(url,options={})=>{const name=new URL(url).pathname,method=options.method||'GET',headers=new Headers(options.headers);events.push({name,method});if(name===fail&&method==='PUT')return new Response('deliberate failure',{status:503});if(method==='MKCOL')return new Response(null,{status:201});if(method==='GET'){const old=files.get(name);return old?new Response(old.bytes,{headers:{etag:old.etag}}):new Response(null,{status:404});}if(method==='PUT'){const old=files.get(name);if(headers.get('If-None-Match')==='*'&&old||headers.has('If-Match')&&headers.get('If-Match')!==old?.etag)return new Response(null,{status:412});put(name,options.body);return new Response(null,{status:old?200:201});}throw Error('Unexpected '+method);};
 return {files,events,fetch,put,set fail(v){fail=v;}};
}
const publish=(f,server,extra={})=>publishRelease({root:f.root,packageDirectory:f.package,version:f.version,dav:'https://dav.example',headers:{},fetch:server.fetch,...extra});

test('immutable package isolates every runtime reference while preserving live routes and installed identity',async()=>{
 const f=await fixture(),html=await fs.readFile(path.join(f.package,'index.html'),'utf8'),app=await fs.readFile(path.join(f.package,'app.js'),'utf8');
 assert.match(html,new RegExp('/releases/'+f.version+'/app.js'));assert.match(html,/href="\/manifest.webmanifest"/);
 assert.match(app,/import '.\/lazy.js'/);assert.match(app,new RegExp('/releases/'+f.version+'/assets/preview.png'));assert.match(app,/'\/scores.html'/);
 const manifest=JSON.parse(await fs.readFile(path.join(f.package,'manifest.webmanifest'),'utf8'));assert.equal(manifest.start_url,'/');assert.equal(manifest.scope,'/');assert.equal(manifest.icons[0].src,'/releases/'+f.version+'/assets/preview.png');
 const inventory=JSON.parse((await fs.readFile(path.join(f.root,'public/sw.js'),'utf8')).match(/const PRECACHE = (\[[\s\S]*?\]);/)[1]);
 for(const a of inventory){assert.equal(a.url,'/releases/'+f.version+a.path);assert.equal(sha256(await fs.readFile(path.join(f.package,a.path.slice(1)))),a.sha256);}
});
test('editor immutable composition updates its CSP hash and preserves mutable world includes',()=>{
 const version='a'.repeat(20),source=Buffer.from(`<html><head><meta content="script-src 'self' 'sha256-old';"><script id="editor-bootstrap">import('/editor.js');</script></head><body><p:include resource="/editor-template.html"></p:include><p:include resource="/worlds/prism-garden/definition.html"></p:include></body></html>`);
 const output=releaseBytes(source,'editor-route.html',version,['editor.js','editor-template.html']).toString();assert.match(output,/releases\/a{20}\/editor-template.html/);assert.match(output,/resource="\/worlds\/prism-garden\/definition.html"/);assert.doesNotMatch(output,/sha256-old/);
});
test('failed immutable staging never promotes entries and never writes live scores/worlds/legacy scripts',async()=>{
 const f=await fixture(),s=dav();s.put('/index.html','old index');s.put('/app.js','old module');s.put('/scores.html','real records');s.fail='/releases/'+f.version+'/lazy.js';
 await assert.rejects(publish(f,s),/Immutable upload/);assert.equal(s.files.get('/index.html').bytes.toString(),'old index');assert.equal(s.files.get('/app.js').bytes.toString(),'old module');assert.equal(s.files.get('/scores.html').bytes.toString(),'real records');assert.ok(!s.events.some(e=>e.method==='PUT'&&!e.name.startsWith('/releases/')));
});
test('successful promotion retains prior immutable graph and can roll back using its own saved worker',async()=>{
 const a=await fixture(),s=dav();s.put('/app.js','legacy');await publish(a,s);const old=await fs.readFile(path.join(a.package,'app.js'),'utf8');await fs.appendFile(path.join(a.root,'public/lazy.js'),'\n// release B');const b={root:a.root,...await buildPwa({root:a.root})};assert.notEqual(a.version,b.version);
 await publish(b,s,{beforePromote:async()=>{assert.match(s.files.get('/index.html').bytes.toString(),new RegExp(a.version));assert.equal(s.files.get('/releases/'+a.version+'/app.js').bytes.toString(),old);}});
 assert.match(s.files.get('/index.html').bytes.toString(),new RegExp(b.version));assert.equal(s.files.get('/app.js').bytes.toString(),'legacy');await publish(a,s);assert.match(s.files.get('/sw.js').bytes.toString(),new RegExp('const VERSION = "'+a.version+'"'));assert.match(s.files.get('/index.html').bytes.toString(),new RegExp(a.version));
});
test('immutable collisions and concurrent root publication refuse overwrite',async()=>{
 const f=await fixture(),s=dav();s.put('/releases/'+f.version+'/app.js','foreign bytes');await assert.rejects(publish(f,s),/readback mismatch/);assert.equal(s.files.get('/releases/'+f.version+'/app.js').bytes.toString(),'foreign bytes');
 const clean=dav();clean.put('/index.html','baseline');await assert.rejects(publish(f,clean,{beforePromote:async()=>clean.put('/index.html','another release')}),/Concurrent publication/);assert.equal(clean.files.get('/index.html').bytes.toString(),'another release');
});
test('HTML readback tolerates harmless serialization but rejects changed executable sources',()=>{
 assert.equal(sameFile('/index.html',Buffer.from('<html><head></head><body><p id="a" class="b">Hello</p></body></html>'),Buffer.from('<html><head></head><body>\n<p class="b" id="a">Hello</p>\n</body></html>')),true);
 assert.equal(sameFile('/index.html',Buffer.from('<script src="/releases/a/app.js"></script>'),Buffer.from('<script src="/releases/b/app.js"></script>')),false);
 assert.equal(sameFile('/editor-template.html',Buffer.from('<html><body><button>Select & move</button></body></html>'),Buffer.from('<html><body><button>Select &amp; move</button></body></html>')),true);
});
test('live verification fails mixed entries and stale root manifest even when immutable assets are valid',async()=>{
 const f=await fixture(),html=await fs.readFile(path.join(f.package,'index.html'),'utf8'),manifestBytes=await fs.readFile(path.join(f.package,'manifest.webmanifest'));
 const assets=JSON.parse((await fs.readFile(path.join(f.root,'public/sw.js'),'utf8')).match(/const PRECACHE = (\[[\s\S]*?\]);/)[1]);
 const manifest=JSON.parse(manifestBytes);manifest.display='fullscreen';const bytes=Buffer.from(JSON.stringify(manifest));assets.find(a=>a.path==='/manifest.webmanifest').sha256=sha256(bytes);
 const valid={html,manifestBytes:bytes,version:f.version,assets,homeStatus:200,manifestStatus:200};assert.deepEqual(liveEntryIssues(valid),[]);
 assert.ok(liveEntryIssues({...valid,html:html.replace('/releases/'+f.version+'/app.js','/app.js')}).includes('Mixed entry dependencies'));
 assert.ok(liveEntryIssues({...valid,manifestBytes:Buffer.from(JSON.stringify({...manifest,name:'stale'}))}).includes('Root manifest differs from release'));
 assert.ok(liveEntryIssues({...valid,homeStatus:503}).includes('Home unavailable'));
});
test('a damaged local package is refused before any provider requests',async()=>{
 const f=await fixture(),s=dav();await fs.appendFile(path.join(f.package,'index.html'),'<!-- unreviewed change -->');
 await assert.rejects(publish(f,s),/Package changed after build/);assert.equal(s.events.length,0);
});
