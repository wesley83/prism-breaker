import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {DOMParser} from 'linkedom';
import {originalWorld,parseWorld,worldDocument,worldHTML,formationCatalog,worldSlug} from '../public/world-format.js';
import {WORLDS,RULESET_REVISION} from '../public/levels.js';
import {editorSlug,compatibleRuleset} from '../public/world-identity.js';
import {Game,isValidSnapshot} from '../public/engine.js';
import {rankedScores} from '../public/leaderboard.js';
import {worldPolicy} from '../tools/world-policy.mjs';
const parse=html=>parseWorld(html,{Parser:DOMParser});

test('display names do not change stable identity or world addresses',()=>{
 const w=originalWorld(0);w.name='A new garden name';const restored=parse(worldDocument(w));
 assert.equal(restored.name,w.name);assert.equal(restored.id,WORLDS[0].id);assert.equal(restored.slug,worldSlug(0));
});
test('multiple custom recipes are rejected instead of silently discarded',()=>{
 const w=originalWorld(0);w.types=['first','second'].map(name=>({type:'urn:Brick:Custom:'+name,name,base:'normal',effect:'none'}));
 w.formations[0].bricks[0].customType=w.types[0].type;
 const html=worldDocument(w).replace('urn:Brick urn:Brick:Normal urn:Brick:Custom:first','urn:Brick urn:Brick:Normal urn:Brick:Custom:first urn:Brick:Custom:second');
 assert.throws(()=>parse(html),/one custom recipe/);
});
test('ambiguous document properties and row identities are rejected',()=>{
 const html=worldDocument(originalWorld(0));
 assert.throws(()=>parse(html.replace('<h1>','<meta itemprop="name" content="Ambiguous"><h1>')),/Duplicate property/);
 assert.throws(()=>parse(html.replace('id="f0-row-1"','id="f0-row-0"')),/Duplicate or missing row ID/);
 assert.throws(()=>parse(html.replace('itemprop="schemaVersion" content="2"','itemprop="schemaVersion" content="999"')),/Unsupported/);
});
test('legacy HTML gets explicit compatible metadata without changing geometry',()=>{
 const w=originalWorld(0);let html=worldDocument(w);
 for(const key of ['schemaVersion','id','tag','story','mechanic','shape','music','root','sky','accent','colors'])html=html.replace(new RegExp('<meta itemprop="'+key+'" content="[^"]*">'),'');
 const restored=parse(html);assert.equal(restored.schemaVersion,2);assert.deepEqual(restored.formations,w.formations);assert.equal(restored.music,w.music);
});
test('unknown or malformed editor paths never default to a real world',()=>{
 assert.equal(editorSlug('/editor/does-not-exist'),'does-not-exist');assert.equal(WORLDS.findIndex(w=>w.slug===editorSlug('/editor/does-not-exist')),-1);
 assert.equal(editorSlug('/editor/../../other'),null);assert.equal(editorSlug('/editor/Bad'),null);assert.equal(editorSlug('/editor.html','?world=cosmic-reef'),'cosmic-reef');
});
test('Practice consumes the same document metadata and complete formation model',()=>{
 const w=originalWorld(0);w.name='Edited name';w.note='Edited instructions';w.shape='reef';w.music='ice';w.formations.push({...structuredClone(w.formations[0]),phase:1});
 const g=new Game();g.catalog=formationCatalog(w);g.start('practice',0);assert.equal(g.world.name,w.name);assert.equal(g.world.music,'ice');g.phase=1;g.loadLevel();assert.equal(g.world.formations.length,2);
 g.start('campaign',0);assert.equal(g.world.name,WORLDS[0].name);assert.equal(g.world.formations.length,1);
});
test('checkpoint v2 pins complete world definition and restores saved portals',()=>{
 const g=new Game();g.start('campaign',5);const snapshot=g.snapshot(),portals=structuredClone(snapshot.definition.formations[0].portals);
 snapshot.definition.name='Saved presentation';const restored=new Game();assert.equal(restored.restore(snapshot),true);assert.deepEqual(restored.portals,portals);assert.equal(restored.world.name,'Saved presentation');assert.equal(restored.world.id,snapshot.worldId);
 g.bricks[0].hp=0;assert.notEqual(snapshot.bricks[0].hp,0,'snapshot does not alias live arrays');
});
test('legacy checkpoints migrate, unknown versions and rulesets fail without mutation',()=>{
 const g=new Game(),legacy={...g.snapshot(),version:1};delete legacy.worldId;delete legacy.definition;delete legacy.ruleset;delete legacy.worldRevision;
 assert.equal(new Game().restore(legacy),true);assert.equal(compatibleRuleset(undefined),true);
 const bad={...g.snapshot(),ruleset:'a'.repeat(64)};assert.equal(isValidSnapshot(bad),false);const before=g.snapshot();assert.equal(g.restore(bad),false);assert.deepEqual(g.snapshot(),before);
 assert.equal(isValidSnapshot({...g.snapshot(),worldId:'missing'}),false);
 assert.equal(isValidSnapshot({...g.snapshot(),ruleset:undefined}),false);
});
test('trusted handlers dispatch base, specialization, movement and custom in order',()=>{
 const g=new Game(),b=g.bricks[0],seen=[];b.moving=true;b.customType='urn:Brick:Custom:sample';
 for(const type of ['urn:Brick','urn:Brick:Normal','urn:Brick:Moving','urn:Brick:Custom:sample'])g.behaviors.register(type,{onStrike:()=>seen.push(type)});
 g.damage(b);assert.deepEqual(seen,['urn:Brick','urn:Brick:Normal','urn:Brick:Moving','urn:Brick:Custom:sample']);
});
test('trusted request cancellation and unsubscribe do not remove other handlers',()=>{
 const g=new Game(),b=g.bricks[0];let calls=0;const off=g.behaviors.register('urn:Brick',{onStrike:()=>false});g.behaviors.register('urn:Brick',{onStrike:()=>calls++});g.damage(b);assert.equal(b.hp,1);assert.equal(calls,0);off();g.damage(b);assert.equal(b.hp,0);assert.equal(calls,1);
});
test('handler errors cancel a strike and report a structured failure',()=>{
 const g=new Game(),b=g.bricks[0];let error;g.events.addEventListener('brickbehaviorerror',e=>error=e.detail);g.behaviors.register('urn:Brick',{onStrike:()=>{throw Error('Example failure');}});g.damage(b);assert.equal(b.hp,1);assert.equal(error.hook,'onStrike');
});
test('rankings isolate incompatible rulesets and retain compatible legacy scores',()=>{
 const now=Date.now(),base={mode:'campaign',day:'all',seconds:10,level:1,submittedAt:new Date(now).toISOString()};
 const rows=rankedScores([{...base,score:20},{...base,score:30,ruleset:RULESET_REVISION},{...base,score:999,ruleset:'a'.repeat(64)}],'campaign','all',now);assert.deepEqual(rows.map(r=>r.score),[30,20]);
});
test('persisted brick identity counter survives deletion of the highest numbered brick',()=>{
 const w=originalWorld(0),f=w.formations[0],next=f.nextBrickId;f.bricks.pop();
 const restored=parse(worldDocument(w));assert.equal(restored.formations[0].nextBrickId,next);
});

test('offline precache excludes reserialized authoring documents and candidate policy',async()=>{
 const {buildPwa}=await import('../tools/build-pwa.mjs');await buildPwa({check:true});
 const worker=await fs.readFile('public/sw.js','utf8');
 const assets=JSON.parse(worker.match(/const PRECACHE = (\[[\s\S]*?\]);/)[1]);
 assert.deepEqual(assets.filter(a=>a.path.endsWith('.html')).map(a=>a.path),['/index.html']);
 assert.ok(assets.some(a=>a.path==='/bundled-worlds.js'));
});
test('generated server guard accepts canonical worlds and rejects invalid or unconditional writes',async()=>{
 const previous=globalThis.DOMParser;globalThis.DOMParser=DOMParser;
 try{
  const {guard}=await worldPolicy();const {default:validate}=await import('data:text/javascript;base64,'+Buffer.from(guard).toString('base64'));
  const body=worldDocument(originalWorld(0)),request={path:'/worlds/prism-garden/definition.html',method:'PUT',headers:{'If-Match':'"old-revision"'},body};
  assert.equal(validate({request}),true);
  for(const change of [
   {body:body.replace('itemprop="hitpoints" content="1"','itemprop="hitpoints" content="99"')},
   {body:body.replace('</body>','<script>alert(1)</script></body>')},
   {path:'/worlds/cloud-carnival/definition.html'},
   {headers:{}},
   {headers:{'If-Match':'"old-revision"',Range:'selector=#world'}},
   {method:'DELETE'}
  ])assert.throws(()=>validate({request:{...request,...change}}),e=>[405,422,428].includes(e.status));
 }finally{globalThis.DOMParser=previous;}
});
test('official bundle rebuilds from documents with no previous generated bundle',async()=>{
 const parent=path.resolve('.private');await fs.mkdir(parent,{recursive:true});const root=await fs.mkdtemp(path.join(parent,'document-cold-build-'));
 try{
  for(const dir of ['public','tools'])await fs.mkdir(path.join(root,dir));
  for(const file of ['tools/build-bundled-worlds.mjs','tools/read-world-catalog.mjs','public/world-schema.js','public/world-catalog.html'])await fs.copyFile(file,path.join(root,file));
  await fs.cp('public/worlds',path.join(root,'public/worlds'),{recursive:true});
  const output=execFileSync(process.execPath,['tools/build-bundled-worlds.mjs'],{cwd:root,encoding:'utf8'});assert.match(output,/Built 16 complete worlds/);
  assert.equal(await fs.readFile(path.join(root,'public/bundled-worlds.js'),'utf8'),await fs.readFile('public/bundled-worlds.js','utf8'));
 }finally{if(path.resolve(root).startsWith(parent+path.sep+'document-cold-build-'))await fs.rm(root,{recursive:true,force:true});}
});
