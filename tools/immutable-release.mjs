import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export const releasePrefix = (version, base='/') => {
  if (!/^[a-f0-9]{20}$/.test(version)) throw Error('Invalid immutable release identity');
  if(!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base))throw Error('Invalid installation base');
  return base + 'releases/' + version;
};
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Rewrite asset references, never application routes, leaderboard URLs or world sources.
export function releaseBytes(bytes, name, version, names, installation={base:'/',origin:'https://sane-guild-8399.onpagelove.com'}) {
  if (!/\.(?:html|js|css|webmanifest)$/.test(name)) return bytes;
  const prefix = releasePrefix(version);
  let text = bytes.toString('utf8').replace(/(["'(])\/(assets|vendor)\//g, '$1' + prefix + '/$2/');
  text = text.replace(/https:\/\/sane-guild-8399\.onpagelove\.com\/(assets|vendor)\//g, 'https://sane-guild-8399.onpagelove.com' + prefix + '/$1/');
  const files = names.filter(n => !n.includes('/') && !['manifest.webmanifest','index.html','editor.html','editor-route.html','worlds.html','world-catalog.html'].includes(n));
  if (files.length) text = text.replace(new RegExp('(["\'(])\\/(' + files.map(escape).join('|') + ')(?=[?#["\')]|$)', 'g'), '$1' + prefix + '/$2');
  const {base,origin}=installation;
  if(name.endsWith('.html'))text=text.replaceAll('https://dav-sane-guild-8399.onpagelove.com',origin.replace('https://','https://dav-'));
  if(base!=='/')text=text.replaceAll(prefix+'/',releasePrefix(version,base)+'/');
  if(name==='manifest.webmanifest'){
    const manifest=JSON.parse(text);manifest.id=base;manifest.scope=base;manifest.start_url=base+'?source=installed';
    for(const shortcut of manifest.shortcuts||[])shortcut.url=base+shortcut.url.replace(/^\//,'');
    text=JSON.stringify(manifest,null,2)+'\n';
  }
  if(name.endsWith('.html')){
    // Application navigation is mounted, while immutable assets stay pinned.
    text=text.replace(/(href|resource)="\/(?!releases\/)([^"#]*)"/g,(all,key,value)=>{
      if(value.startsWith(base.slice(1))&&base!=='/')return all;
      return key+'="'+base+value+'"';
    });
    text=text.replace(/https:\/\/sane-guild-8399\.onpagelove\.com(?=\/(?:releases\/|onboarding\/|$|["']))/g,origin);
    text=text.replace(/((?:rel="canonical" href|property="og:url" content)=")https:\/\/[^" ]+\//g,(all,start)=>start+origin+base);
  }
  if (name.endsWith('.html')) {
    // Editor startup is inline and protected by an exact CSP hash.
    const inline = text.match(/<script id="editor-bootstrap">([\s\S]*?)<\/script>/)?.[1];
    if (inline) text = text.replace(/script-src 'self' 'sha256-[^']+';/, "script-src 'self' 'sha256-" + createHash('sha256').update(inline).digest('base64') + "';");
  }
  return Buffer.from(text);
}

export async function writeReleasePackage({root, version, entries, stagedNames, installation}) {
  const prefix = releasePrefix(version,installation?.base), directory = path.join(root, 'test-results/release-package', version);
  const records = [];
  for (const [name, bytes] of entries) {
    if (!name || name.includes('..') || name.startsWith('/') || name.includes('\\')) throw Error('Unsafe release path');
    const file = path.join(directory, name);
    await fs.mkdir(path.dirname(file), {recursive: true});
    let old;
    try { old = await fs.readFile(file); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    if (old && !old.equals(bytes)) throw Error('Immutable package collision: ' + name);
    if (!old) await fs.writeFile(file, bytes);
    records.push({path: '/' + name, url: prefix + '/' + name, sha256: sha256(bytes), bytes: bytes.length,stage:stagedNames?stagedNames.has(name):true});
  }
  const manifest = {schema: 1, version, installation, files: records};
  await fs.writeFile(path.join(directory, 'release.json'), JSON.stringify(manifest, null, 2) + '\n');
  return {directory, manifest};
}
