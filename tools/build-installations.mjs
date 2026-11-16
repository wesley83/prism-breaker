import fs from 'node:fs/promises';
import path from 'node:path';
import {buildPwa} from './build-pwa.mjs';
const targets=JSON.parse(await fs.readFile('deployments.json','utf8')),releases={};
for(const [name,installation]of Object.entries(targets)){
 const release=await buildPwa({installation,emit:name==='main'});
 const manifest=JSON.parse(await fs.readFile(path.join(release.package,'manifest.webmanifest'),'utf8'));
 if(manifest.id!==installation.base||manifest.scope!==installation.base||manifest.start_url!==installation.base+'?source=installed'||manifest.shortcuts.some(s=>!s.url.startsWith(installation.base+'?')))throw Error('Wrong install destination '+name);
 releases[name]={...release,installation};
}
await fs.writeFile('test-results/installations.json',JSON.stringify(releases,null,2)+'\n');
console.log(JSON.stringify(releases));
