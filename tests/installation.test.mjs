import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {installationBase,authoringOrigin} from '../public/installation.js';
import {releaseBytes} from '../tools/immutable-release.mjs';
const base='/onboarding/after/demos/product-ready-20261106/prism/',origin='https://kayak-draw-9549.onpagelove.com',version='a'.repeat(20),target={base,origin};
test('all installation entry points resolve the same mount and the owner destination is host-bound',()=>{
 for(const suffix of ['installation.js','releases/'+version+'/installation.js'])assert.equal(installationBase(origin+base+suffix),base);
 assert.equal(authoringOrigin(origin),'https://dav-kayak-draw-9549.onpagelove.com');
 assert.throws(()=>authoringOrigin('https://evil.example'));assert.throws(()=>authoringOrigin('http://kayak-draw-9549.onpagelove.com'));
});
test('mounted install identity, launch, shortcuts and icons stay inside the exact installation',async()=>{
 const source=await fs.readFile(new URL('../public/manifest.webmanifest',import.meta.url));
 const m=JSON.parse(releaseBytes(source,'manifest.webmanifest',version,[],target));
 assert.equal(m.id,base);assert.equal(m.scope,base);assert.equal(m.start_url,base+'?source=installed');
 assert.ok(m.shortcuts.every(s=>s.url.startsWith(base+'?leaderboard=')));
 assert.ok(m.icons.every(i=>i.src.startsWith(base+'releases/'+version+'/assets/')));
});
test('mounted metadata, workshop CSP, manifest and static references never escape or double-prefix',()=>{
 const html='<link rel="canonical" href="https://sane-guild-8399.onpagelove.com/"><meta property="og:url" content="https://sane-guild-8399.onpagelove.com/"><meta property="og:image" content="https://sane-guild-8399.onpagelove.com/assets/og.jpg"><link rel="manifest" href="/manifest.webmanifest"><a href="/editor.html?world=prism-garden">Edit</a><meta content="connect-src https://dav-sane-guild-8399.onpagelove.com"><script src="/app.js"></script>';
 const out=releaseBytes(Buffer.from(html),'index.html',version,['app.js'],target).toString();
 assert.ok(out.includes('href="'+origin+base+'"'));assert.ok(out.includes('content="'+origin+base+'"'));
 assert.ok(out.includes(origin+base+'releases/'+version+'/assets/og.jpg'));
 assert.ok(out.includes('href="'+base+'manifest.webmanifest"'));assert.ok(out.includes('href="'+base+'editor.html?world=prism-garden"'));
 assert.ok(out.includes('https://dav-kayak-draw-9549.onpagelove.com'));assert.ok(out.includes('src="'+base+'releases/'+version+'/app.js"'));
 assert.ok(!out.includes(base+base));assert.ok(!out.includes('sane-guild'));
});


test('packaged world identity still recognizes standalone editor query routes',async()=>{
 const source=await fs.readFile(new URL('../public/world-identity.js',import.meta.url));
 const packaged=releaseBytes(source,'world-identity.js',version,['editor.html','editor-template.html','index.html'],target).toString();
 const parse=new Function('WORLDS','RULESET_REVISION',packaged.replace(/^import[^;]+;/,'').replaceAll('export ','')+';return editorSlug;')([{slug:'prism-garden'}],'test');
 assert.equal(parse('/editor.html','?world=thunder-spire'),'thunder-spire');
 assert.equal(parse('/editor/prism-garden'),'prism-garden');
 assert.equal(parse('/editor/index.html','?world=dawn-nexus'),'dawn-nexus');
});
