import fs from 'node:fs/promises';
import {readEngagement} from './read-engagement.mjs';
const {model,revision}=await readEngagement();
await fs.writeFile('public/engagement-data.js','// Generated from engagement.html. Edit that document, then build.\nexport const ENGAGEMENT_REVISION='+JSON.stringify(revision)+';\nexport const ENGAGEMENT='+JSON.stringify(model)+';\n');
console.log('Built engagement goals, encounters and rewards for '+Object.keys(model.profiles).length+' worlds.');
