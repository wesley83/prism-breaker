import fs from 'node:fs/promises';
const names=['layout-grid','trophy','volume','volume-off','settings','player-pause','maximize','x','help-circle','arrow-right','refresh','heart','keyboard','hand-finger','sparkles','chevron-right','shield','arrows-horizontal','circles','magnet','bolt','diamond','clock','share'];
const symbols=[];
for(const name of names){const svg=await fs.readFile('node_modules/@tabler/icons/icons/outline/'+name+'.svg','utf8');symbols.push('<symbol id="'+name+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">'+svg.replace(/^[\s\S]*?<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'')+'</symbol>');}
await fs.writeFile('public/assets/icons.svg','<svg xmlns="http://www.w3.org/2000/svg">'+symbols.join('')+'</svg>');
await fs.copyFile('node_modules/@tabler/icons/LICENSE','public/assets/ICON-LICENSE.txt');
console.log('Bundled '+names.length+' Tabler icons.');
