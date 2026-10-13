import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const modules=process.env.PRISM_IMAGE_MODULES||process.cwd();
const require=createRequire(path.join(modules,'package.json')),sharp=require('sharp');
// Only format conversion and size exports; artwork composition is generated.
for(const [source,target,width,height]of [['artwork/og-landscape-source.png','public/assets/og-prism-breaker.jpg',1200,630],['artwork/og-square-source.png','public/assets/og-prism-breaker-square.jpg',1200,1200]]){
 await sharp(source).resize(width,height,{fit:'fill'}).flatten({background:'#111d20'}).jpeg({quality:90,chromaSubsampling:'4:4:4',mozjpeg:true}).toFile(target);
}
const svg=await fs.readFile('public/favicon.svg');
for(const [size,file]of [[32,'public/assets/favicon-32.png'],[180,'public/apple-touch-icon.png'],[192,'public/assets/prism-icon-192.png'],[512,'public/assets/prism-icon-512.png']])await sharp(svg,{density:384}).resize(size,size).png().toFile(file);
const sizes=[16,32,48],images=await Promise.all(sizes.map(size=>sharp(svg,{density:384}).resize(size,size).png().toBuffer()));
const header=Buffer.alloc(6+16*sizes.length);header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);let offset=header.length;
for(let i=0;i<sizes.length;i++){const at=6+i*16;header[at]=sizes[i];header[at+1]=sizes[i];header.writeUInt16LE(1,at+4);header.writeUInt16LE(32,at+6);header.writeUInt32LE(images[i].length,at+8);header.writeUInt32LE(offset,at+12);offset+=images[i].length;}
await fs.writeFile('public/favicon.ico',Buffer.concat([header,...images]));
for(const file of ['public/assets/og-prism-breaker.jpg','public/assets/og-prism-breaker-square.jpg','public/assets/favicon-32.png','public/apple-touch-icon.png']){const m=await sharp(file).metadata();console.log(path.basename(file)+' · '+m.width+' × '+m.height+' · '+(await fs.stat(file)).size+' bytes');}
