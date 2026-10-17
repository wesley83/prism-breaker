import * as T from './vendor/three.module.min.js';
import {rng} from './levels.js';
export class SceneryBatch{
 constructor(index,world,{box,sphere,octa},low=false){
  this.group=new T.Group();this.batches=[];this.records=[];this.owned=[];this.lastReduced=null;this.rotate=!['city','forge'].includes(world.shape);
  const cone=new T.ConeGeometry(.8,2.8,5),torus=new T.TorusGeometry(1,index===6?.2:.12,8,index===6?16:24);this.owned.push(cone,torus);
  const geometries={box,sphere,octa,cone,torus},groups=new Map(),random=rng(338+index);
  for(let i=0;i<46;i++){
   let key='octa',scale=.6+random()*1.4;
   if(index===0)key=i%3===0?'sphere':'cone';if(index===1)key='sphere';if([2,4,7].includes(index))key='box';
   if(index>=8)key=[9,10,14].includes(index)?'torus':[8,12,13].includes(index)?'box':'octa';if(index===6)key=i%2?'torus':'sphere';
   const object=new T.Object3D(),side=i%2?-1:1;object.position.set(side*(12+random()*13),-17+random()*36,-3-random()*11);object.scale.setScalar(scale);
   if([2,4,7].includes(index))object.scale.set(scale*.8,scale*(2+random()*4),scale);if(index===1)object.scale.set(scale*2,scale*.8,scale);if(index===3||index===5)object.scale.y*=2.5;
   object.rotation.set(random()*.3,random(),random()*.3);const record={object,baseY:object.position.y,phase:random()*6.28,color:world.colors[i%4]};
   if(low&&i>=24)continue;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(record);
  }
  for(const [key,records]of groups){
   const material=new T.MeshStandardMaterial({color:'#fff',roughness:.48,metalness:.1,emissive:'#fff',emissiveIntensity:.13,transparent:true,opacity:.65,depthWrite:false});
   material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance*=vColor.rgb;');};material.customProgramCacheKey=()=> 'scenery-emission-v1';
   const mesh=new T.InstancedMesh(geometries[key],material,records.length);mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;
   records.forEach((record,slot)=>{record.mesh=mesh;record.slot=slot;record.object.updateMatrix();mesh.setMatrixAt(slot,record.object.matrix);mesh.setColorAt(slot,new T.Color(record.color));this.records.push(record);});
   this.batches.push(mesh);this.group.add(mesh);
  }
 }
 update(dt,time,reduced){
  if(reduced&&this.lastReduced===reduced)return;
  for(const {object,baseY,phase,mesh,slot}of this.records){object.position.y=reduced?baseY:baseY+Math.sin(time*.35+phase)*.35;if(!reduced&&this.rotate)object.rotation.y+=dt*.1;object.updateMatrix();mesh.setMatrixAt(slot,object.matrix);}
  for(const mesh of this.batches)mesh.instanceMatrix.needsUpdate=true;this.lastReduced=reduced;
 }
 dispose(){for(const mesh of this.batches){mesh.dispose();mesh.material.dispose();}for(const geometry of this.owned)geometry.dispose();this.group.clear();}
}
