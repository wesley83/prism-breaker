import * as T from './vendor/three.module.min.js';

// A cut gemstone, with a broad table, eight bevel facets and a translucent body.
// Opacity provides real see-through surfaces without a full-screen refraction pass.
const ring=(x,y,cut,z)=>[[-x+cut,-y,z],[x-cut,-y,z],[x,-y+cut,z],[x,y-cut,z],[x-cut,y,z],[-x+cut,y,z],[-x,y-cut,z],[-x,-y+cut,z]];
export function crystalGeometry(){
 const positions=[],colors=[],tri=(a,b,c,tint)=>{for(const p of [a,b,c]){positions.push(...p);colors.push(tint,tint,tint);}};
 const outer=ring(.5,.5,.10,.09),table=ring(.40,.32,.07,.39),back=ring(.46,.44,.09,-.27);
 const shades=[.53,.86,.69,1.0,1.32,1.08,.65,.82];
 for(let i=0;i<8;i++){
  const j=(i+1)%8;
  tri(outer[i],outer[j],table[j],shades[i]);tri(outer[i],table[j],table[i],shades[i]);
  tri(back[i],back[j],outer[j],.68);tri(back[i],outer[j],outer[i],.68);
  tri([0,0,-.27],back[j],back[i],.55);
  // Irregular table triangles catch the light rather than reading as a flat panel.
  tri([-.08,.03,.39],table[i],table[j],[.91,1.0,.86,1.08,1.04,.94,1.0,.83][i]);
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();return geometry;
}
export function crystalEdges(){
 const positions=[],outer=ring(.5,.5,.10,.09),table=ring(.40,.32,.07,.392);
 for(let i=0;i<8;i++){const j=(i+1)%8;positions.push(...outer[i],...outer[j],...table[i],...table[j],...outer[i],...table[i]);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));return geometry;
}
export function crystalDamage(brick){return brick.hp>0?Math.min(3,Math.max(0,brick.maxHp-brick.hp)):0;}
export function drawCrystalCracks(ctx,damage,variant=0){
 ctx.clearRect(0,0,256,128);if(!damage)return;
 // Each later stage retains every earlier fissure; three patterns avoid identical scars.
 const paths=[[[20,105],[53,89],[65,65],[85,54],[93,25],[107,12]],[[65,65],[46,53],[39,30]],[[85,54],[119,62],[141,48]],[[53,89],[82,101],[113,110]]];
 if(damage>=2)paths.push([[93,25],[133,33],[159,22],[184,9]],[[141,48],[156,73],[178,83],[192,108]],[[156,73],[130,87],[124,116]],[[39,30],[24,18]],[[178,83],[209,68],[231,69]]);
 if(damage>=3)paths.push([[141,48],[183,39],[211,18]],[[209,68],[222,100],[246,114]],[[46,53],[19,62],[8,48]]);
 const line=()=>{ctx.beginPath();for(const path of paths){path.forEach(([x,y],i)=>{if(variant===1)x=256-x;if(variant===2){x=256-x;y=128-y;}i?ctx.lineTo(x,y):ctx.moveTo(x,y);});}ctx.stroke();};
 ctx.lineJoin=ctx.lineCap='round';ctx.strokeStyle='rgba(3,22,32,.82)';ctx.lineWidth=damage>=2?9:7;line();
 ctx.strokeStyle='rgba(221,255,255,.98)';ctx.lineWidth=damage>=2?4.2:3.2;ctx.translate(-1,-1);line();ctx.resetTransform();
}
function crystalEnvironment(){
 // Small local studio reflections give flat facets a polished sheen. No image download.
 const faces=Array.from({length:6},(_,i)=>{
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d'),base=ctx.createLinearGradient(0,0,128,128);
  base.addColorStop(0,'#233b45');base.addColorStop(.5,'#0c1d26');base.addColorStop(1,'#54707a');ctx.fillStyle=base;ctx.fillRect(0,0,128,128);
  ctx.fillStyle=i===2?'#eafaff':'#a7c4d0';ctx.beginPath();ctx.moveTo(0,18);ctx.lineTo(128,64);ctx.lineTo(128,77);ctx.lineTo(0,31);ctx.closePath();ctx.fill();
  if(i!==3){ctx.fillStyle='#f5ffff';ctx.fillRect(90,0,8,128);}return canvas;
 });const texture=new T.CubeTexture(faces);texture.colorSpace=T.SRGBColorSpace;texture.needsUpdate=true;return texture;
}
export function crystalResources(){
 const textures=new Map();for(let damage=1;damage<=3;damage++)for(let variant=0;variant<3;variant++){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;drawCrystalCracks(canvas.getContext('2d'),damage,variant);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;textures.set(damage+':'+variant,texture);
 }
 const environment=crystalEnvironment();return {body:crystalGeometry(),edges:crystalEdges(),crackPlane:new T.PlaneGeometry(1,1),textures,environment,
  bodyMaterial:new T.MeshPhysicalMaterial({vertexColors:true,transparent:true,opacity:.64,depthWrite:false,roughness:.13,metalness:.06,clearcoat:.9,clearcoatRoughness:.1,flatShading:true,emissiveIntensity:.06,envMap:environment,envMapIntensity:1.2}),
  lowBodyMaterial:new T.MeshStandardMaterial({vertexColors:true,transparent:true,opacity:.64,depthWrite:false,roughness:.33,metalness:.06,flatShading:true,emissiveIntensity:.08}),
  edgeMaterial:new T.LineBasicMaterial({transparent:true,opacity:.46,depthWrite:false,toneMapped:false}),
  crackMaterial:new T.MeshBasicMaterial({map:textures.get('1:0'),transparent:true,depthWrite:false,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1})};
}
export function makeCrystalBrick(brick,resources){
 const group=new T.Group(),color=new T.Color(brick.color),hsl={};color.getHSL(hsl);color.setHSL(hsl.h,Math.min(.98,Math.max(.65,hsl.s*1.35)),Math.min(.53,hsl.l));
 const material=resources.bodyMaterial.clone();material.color.copy(color);material.emissive.copy(color);
 const body=new T.Mesh(resources.body,material);body.scale.set(brick.w,brick.h,1);body.renderOrder=1;group.add(body);
 const edges=new T.LineSegments(resources.edges,resources.edgeMaterial.clone());edges.material.color.copy(color).lerp(new T.Color('#efffff'),.65);edges.scale.copy(body.scale);edges.renderOrder=2;group.add(edges);
 if(brick.maxHp>1){
  const cracks=new T.Mesh(resources.crackPlane,resources.crackMaterial.clone());cracks.scale.set(brick.w*.90,brick.h*.82,1);cracks.position.z=.403;cracks.renderOrder=2;cracks.visible=false;
  group.add(cracks);group.userData.cracks=cracks;group.userData.crackVariant=Math.abs(brick.id)%3;group.userData.damage=-1;
 }
 updateCrystalBrick(group,brick,resources);return group;
}
export function updateCrystalBrick(group,brick,resources){
 group.position.set(brick.x,brick.y,0);const damage=crystalDamage(brick),cracks=group.userData.cracks;
 if(cracks&&group.userData.damage!==damage){cracks.visible=damage>0;if(damage)cracks.material.map=resources.textures.get(damage+':'+group.userData.crackVariant);group.userData.damage=damage;}
}
