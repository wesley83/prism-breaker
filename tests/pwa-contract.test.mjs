import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {buildPwa} from '../tools/build-pwa.mjs';
const root=new URL('../public/',import.meta.url);
const manifest=JSON.parse(await fs.readFile(new URL('manifest.webmanifest',root),'utf8'));
test('installed identity, fullscreen launch and shortcuts remain in the root game scope',async()=>{
 assert.equal(manifest.id,'/');assert.equal(manifest.scope,'/');assert.equal(manifest.display,'fullscreen');
 assert.equal(manifest.start_url,'/?source=installed');assert.match(manifest.description,/sixteen/i);
 for(const shortcut of manifest.shortcuts){const url=new URL(shortcut.url,'https://prism.example');assert.equal(url.origin,'https://prism.example');assert.equal(url.pathname,'/');assert.ok(['daily','campaign'].includes(url.searchParams.get('leaderboard')));}
 const html=await fs.readFile(new URL('index.html',root),'utf8');assert.match(html,/rel="manifest" href="\/manifest.webmanifest"/);assert.match(html,/name="apple-mobile-web-app-capable" content="yes"/);
});
test('manifest icons exist as PNGs with their declared dimensions, including a separate maskable icon',async()=>{
 assert.ok(manifest.icons.some(icon=>icon.purpose==='maskable'));
 for(const icon of manifest.icons){const data=await fs.readFile(new URL(icon.src.slice(1),root));assert.equal(data.subarray(1,4).toString(),'PNG');assert.equal(data.readUInt32BE(16)+'x'+data.readUInt32BE(20),icon.sizes);assert.equal(icon.type,'image/png');}
});
test('generated inventory covers every literal local JS module import in cached modules',async()=>{
 await buildPwa({check:true});
 const worker=await fs.readFile(new URL('sw.js',root),'utf8'),assets=JSON.parse(worker.match(/const PRECACHE = (\[[\s\S]*?\]);/)[1]),paths=new Set(assets.map(asset=>asset.path));
 for(const asset of assets.filter(asset=>asset.path.endsWith('.js'))){
  const source=await fs.readFile(new URL(asset.path.slice(1),root),'utf8');
  for(const match of source.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)['"]([^'"]+)['"]/g)){
   const specifier=match[1];if(!specifier.startsWith('.')&&!specifier.startsWith('/'))continue;
   const dependency=new URL(specifier,'https://prism.example'+asset.path);assert.ok(paths.has(dependency.pathname),asset.path+' imports uncached '+dependency.pathname);
  }
 }
});
