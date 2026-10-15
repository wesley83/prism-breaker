import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export const releasePrefix = version => {
  if (!/^[a-f0-9]{20}$/.test(version)) throw Error('Invalid immutable release identity');
  return '/releases/' + version;
};
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Rewrite asset references, never application routes, leaderboard URLs or world sources.
export function releaseBytes(bytes, name, version, names) {
  if (!/\.(?:html|js|css|webmanifest)$/.test(name)) return bytes;
  const prefix = releasePrefix(version);
  let text = bytes.toString('utf8').replace(/(["'(])\/(assets|vendor)\//g, '$1' + prefix + '/$2/');
  text = text.replace(/https:\/\/sane-guild-8399\.onpagelove\.com\/(assets|vendor)\//g, 'https://sane-guild-8399.onpagelove.com' + prefix + '/$1/');
  const files = names.filter(n => !n.includes('/') && n !== 'manifest.webmanifest');
  if (files.length) text = text.replace(new RegExp('(["\'(])\\/(' + files.map(escape).join('|') + ')(?=[?#["\')]|$)', 'g'), '$1' + prefix + '/$2');
  if (name.endsWith('.html')) {
    // Editor startup is inline and protected by an exact CSP hash.
    const inline = text.match(/<script id="editor-bootstrap">([\s\S]*?)<\/script>/)?.[1];
    if (inline) text = text.replace(/script-src 'self' 'sha256-[^']+';/, "script-src 'self' 'sha256-" + createHash('sha256').update(inline).digest('base64') + "';");
  }
  return Buffer.from(text);
}

export async function writeReleasePackage({root, version, entries, stagedNames}) {
  const prefix = releasePrefix(version), directory = path.join(root, 'test-results/release-package', version);
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
  const manifest = {schema: 1, version, files: records};
  await fs.writeFile(path.join(directory, 'release.json'), JSON.stringify(manifest, null, 2) + '\n');
  return {directory, manifest};
}
