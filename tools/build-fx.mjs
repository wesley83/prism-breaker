import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const result=spawnSync(process.env.BUN_BIN||'bun',['build','tools/postprocessing-entry.mjs','--target','browser','--minify','--external','three','--outfile','public/postprocessing.js'],{stdio:'inherit'});
if(result.status!==0)process.exit(result.status||1);
const code=await fs.readFile('public/postprocessing.js','utf8');
await fs.writeFile('public/postprocessing.js',code.replace(/from\s*["']three["']/g,'from "./vendor/three.module.min.js"'));
console.log('Local Three.js postprocessing bundle ready.');
