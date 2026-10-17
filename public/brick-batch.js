import * as T from './vendor/three.module.min.js';
import {brickMark,drawBrickMarker} from './brick-labels.js';
import {crystalDamage} from './crystal-bricks.js';

// Render slots are temporary GPU addresses. Persistent brick IDs belong to the document.
export const BRICK_CAPACITY=80;
const TILE=128,SIZE=512,PAD=2,MARKS=['1','2','3','★','◇'];
const ZERO=new T.Matrix4().makeScale(0,0,0);
export function brickAtlas(resources){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=SIZE;const ctx=canvas.getContext('2d');
 const tile=(image,index)=>ctx.drawImage(image,index%4*TILE+PAD,Math.floor(index/4)*TILE+PAD,TILE-PAD*2,TILE-PAD*2);
 for(let i=0;i<MARKS.length;i++){const c=document.createElement('canvas');c.width=c.height=128;drawBrickMarker(c.getContext('2d'),MARKS[i]);tile(c,i);}
 for(let damage=1;damage<=3;damage++)for(let variant=0;variant<3;variant++)tile(resources.textures.get(damage+':'+variant).image,5+(damage-1)*3+variant);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=texture.magFilter=T.LinearFilter;return texture;
}
function instances(geometry,material){const mesh=new T.InstancedMesh(geometry,material,BRICK_CAPACITY);mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;mesh.count=0;return mesh;}
function atlasMesh(atlas,billboard){
 const geometry=new T.PlaneGeometry(1,1),rect=new T.InstancedBufferAttribute(new Float32Array(BRICK_CAPACITY*4),4).setUsage(T.DynamicDrawUsage);geometry.setAttribute('atlasRect',rect);
 const material=new T.MeshBasicMaterial({map:atlas,transparent:true,depthWrite:false,depthTest:!billboard,toneMapped:false,fog:!billboard});
 material.onBeforeCompile=shader=>{
  shader.vertexShader='attribute vec4 atlasRect;\n'+shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nvMapUv=atlasRect.xy+vMapUv*atlasRect.zw;');
  // Match the old number sprites: face the camera while remaining at the brick center.
  if(billboard)shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','vec4 mvPosition=modelViewMatrix*vec4(instanceMatrix[3].xyz,1.0);\nmvPosition.xy+=position.xy*vec2(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz));\ngl_Position=projectionMatrix*mvPosition;');
 };
 material.customProgramCacheKey=()=>billboard?'brick-atlas-billboard-v1':'brick-atlas-crack-v1';
 const mesh=instances(geometry,material);mesh.renderOrder=billboard?3:2;return mesh;
}
function edgeBatch(resources){
 const geometry=new T.InstancedBufferGeometry();geometry.setAttribute('position',resources.edges.getAttribute('position'));
 geometry.setAttribute('placement',new T.InstancedBufferAttribute(new Float32Array(BRICK_CAPACITY*4),4).setUsage(T.DynamicDrawUsage));
 geometry.setAttribute('tint',new T.InstancedBufferAttribute(new Float32Array(BRICK_CAPACITY*3),3).setUsage(T.DynamicDrawUsage));geometry.instanceCount=0;
 const material=resources.edgeMaterial.clone();
 material.onBeforeCompile=shader=>{
  shader.vertexShader='attribute vec4 placement;attribute vec3 tint;varying vec3 vBatchTint;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.xy=transformed.xy*placement.zw+placement.xy;vBatchTint=tint;');
  shader.fragmentShader='varying vec3 vBatchTint;\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=vBatchTint;');
 };
 material.customProgramCacheKey=()=> 'brick-edges-v1';const line=new T.LineSegments(geometry,material);line.frustumCulled=false;line.renderOrder=2;return line;
}
function tintEmission(material){
 material.color.set('#ffffff');material.emissive.set('#ffffff');
 material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance*=vColor.rgb;');};
 material.customProgramCacheKey=()=> 'brick-emission-v1';return material;
}
export class BrickBatch{
 constructor(resources,{atlas=brickAtlas(resources)}={}){
  this.resources=resources;this.atlas=atlas;this.group=new T.Group();this.records=new Map();this.free=[];this.high=0;this.token=0;this.dummy=new T.Object3D();this.color=new T.Color();this.hsl={};this.white=new T.Color('#efffff');
  this.physical=tintEmission(resources.bodyMaterial.clone());this.simple=tintEmission(resources.lowBodyMaterial.clone());
  this.classicMaterial=tintEmission(new T.MeshStandardMaterial({emissiveIntensity:.25,roughness:.23,metalness:.25}));
  this.box=new T.BoxGeometry(1,1,1);this.body=instances(resources.body,this.physical);this.body.renderOrder=1;
  this.face=instances(this.box,new T.MeshBasicMaterial({toneMapped:false}));this.face.visible=false;this.face.renderOrder=2;
  this.edges=edgeBatch(resources);this.markers=atlasMesh(atlas,true);this.cracks=atlasMesh(atlas,false);
  this.group.add(this.body,this.face,this.edges,this.cracks,this.markers);this.clear();
 }
 clear(){
  this.records.clear();this.free.length=0;for(let i=BRICK_CAPACITY-1;i>=0;i--)this.free.push(i);this.high=0;this.items=null;
  for(const mesh of [this.body,this.face,this.markers,this.cracks]){for(let i=0;i<BRICK_CAPACITY;i++)mesh.setMatrixAt(i,ZERO);mesh.instanceMatrix.needsUpdate=true;mesh.count=0;}
  this.edges.geometry.instanceCount=0;
 }
 setAppearance(classic,low){
  if(classic===this.classic&&low===this.low)return;this.classic=classic;this.low=low;
  this.body.geometry=classic?this.box:this.resources.body;this.body.material=classic?this.classicMaterial:low?this.simple:this.physical;
  this.face.visible=classic;this.edges.visible=!classic;this.cracks.visible=!classic;for(const record of this.records.values())record.dirty=true;
 }
 matrix(mesh,slot,x,y,z,w,h,d=1){this.dummy.position.set(x,y,z);this.dummy.scale.set(w,h,d);this.dummy.rotation.set(0,0,0);this.dummy.updateMatrix();mesh.setMatrixAt(slot,this.dummy.matrix);mesh.instanceMatrix.needsUpdate=true;}
 rect(mesh,slot,tile){const x=tile%4,y=Math.floor(tile/4),rect=mesh.geometry.getAttribute('atlasRect');rect.setXYZW(slot,(x*TILE+PAD)/SIZE,1-((y+1)*TILE-PAD)/SIZE,(TILE-2*PAD)/SIZE,(TILE-2*PAD)/SIZE);rect.needsUpdate=true;}
 hide(slot){
  for(const mesh of [this.body,this.face,this.markers,this.cracks]){mesh.setMatrixAt(slot,ZERO);mesh.instanceMatrix.needsUpdate=true;}
  const p=this.edges.geometry.getAttribute('placement');p.setXYZW(slot,0,0,0,0);p.needsUpdate=true;
 }
 update(record,b){
  const slot=record.slot,dirty=record.dirty||record.hp!==b.hp||record.maxHp!==b.maxHp||record.color!==b.color||record.kind!==b.kind||record.w!==b.w||record.h!==b.h;
  const moved=dirty||record.x!==b.x||record.y!==b.y,damage=crystalDamage(b),mark=brickMark(b);
  if(dirty){
   this.color.set(b.color);
   if(!this.classic){this.color.getHSL(this.hsl);this.color.setHSL(this.hsl.h,Math.min(.98,Math.max(.65,this.hsl.s*1.35)),Math.min(.53,this.hsl.l));}
   else if(damage)this.color.multiplyScalar(.75);
   this.body.setColorAt(slot,this.color);this.body.instanceColor.needsUpdate=true;
   this.face.setColorAt(slot,new T.Color(b.color));this.face.instanceColor.needsUpdate=true;
   const tint=this.edges.geometry.getAttribute('tint');this.color.lerp(this.white,.65);tint.setXYZ(slot,this.color.r,this.color.g,this.color.b);tint.needsUpdate=true;
   if(mark!==null)this.rect(this.markers,slot,MARKS.indexOf(mark));
   if(damage)this.rect(this.cracks,slot,5+(damage-1)*3+Math.abs(b.id)%3);
  }
  if(moved){
   const shrink=this.classic&&damage ? .95 : 1;
   this.matrix(this.body,slot,b.x,b.y,0,b.w*shrink,b.h*shrink,this.classic ? .62*shrink : 1);
   if(this.classic)this.matrix(this.face,slot,b.x,b.y,.32*shrink,b.w*.94*shrink,b.h*.76*shrink,.02*shrink);
   const p=this.edges.geometry.getAttribute('placement');p.setXYZW(slot,b.x,b.y,b.w,b.h);p.needsUpdate=true;
   if(mark!==null)this.matrix(this.markers,slot,b.x,b.y,.48,.67,.67);else{this.markers.setMatrixAt(slot,ZERO);this.markers.instanceMatrix.needsUpdate=true;}
   if(damage)this.matrix(this.cracks,slot,b.x,b.y,.403,b.w*.90,b.h*.82);else{this.cracks.setMatrixAt(slot,ZERO);this.cracks.instanceMatrix.needsUpdate=true;}
  }
  record.x=b.x;record.y=b.y;record.w=b.w;record.h=b.h;record.hp=b.hp;record.maxHp=b.maxHp;record.color=b.color;record.kind=b.kind;record.dirty=false;
 }
 sync(items,classic=false,low=false){
  if(this.items!==items){this.clear();this.items=items;}this.setAppearance(classic,low);const token=++this.token;
  // Free absent/dead IDs before allocating replacements in a full formation.
  for(const b of items)if(b.hp>0){const record=this.records.get(b.id);if(record)record.token=token;}
  for(const record of this.records.values())if(record.token!==token){this.hide(record.slot);this.free.push(record.slot);this.records.delete(record.id);}
  for(const b of items){if(b.hp<=0)continue;let record=this.records.get(b.id);
   if(!record){if(!this.free.length)throw Error('Formation exceeds the validated render capacity');record={id:b.id,slot:this.free.pop(),dirty:true};this.records.set(b.id,record);}
   record.brick=b;record.token=token;this.update(record,b);
  }
  let high=0,marks=0,cracks=0;for(const record of this.records.values()){high=Math.max(high,record.slot+1);if(brickMark(record.brick)!==null)marks++;if(crystalDamage(record.brick))cracks++;}
  this.high=high;this.body.count=this.face.count=high;this.markers.count=marks?high:0;this.cracks.count=cracks?high:0;this.edges.geometry.instanceCount=high;
 }
 warm(parent){
  // Inactive slots have zero matrices. One degenerate instance warms the actual GPU buffers.
  this.markers.count=Math.max(1,this.markers.count);this.cracks.count=Math.max(1,this.cracks.count);
  const variants=[{geometry:this.resources.body,material:this.low?this.simple:this.physical,color:true},{geometry:this.box,material:this.classicMaterial,color:true},{geometry:this.face.geometry,material:this.face.material,color:true},this.markers,this.cracks];
  for(const mesh of variants){const sample=instances(mesh.geometry,mesh.material);sample.count=1;if(mesh.color)sample.setColorAt(0,this.white);this.matrix(sample,0,0,0,2,1,1);parent.add(sample);}
 }
}
