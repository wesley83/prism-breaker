import fs from 'node:fs/promises';
import {worldPolicy} from './world-policy.mjs';
await fs.mkdir('policy-candidates',{recursive:true});
await fs.writeFile('policy-candidates/world-policy.html',(await worldPolicy()).html);
console.log('Generated historical validation candidate; DAV intentionally bypasses it and activation is disabled.');
