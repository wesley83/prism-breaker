import * as T from './vendor/three.module.min.js';
export const PARTICLE_CAPACITY=192,LOW_PARTICLE_CAPACITY=48;
export class ParticleBatch{
 constructor(source){
  this.geometry=source.clone();this.alpha=new T.InstancedBufferAttribute(new Float32Array(PARTICLE_CAPACITY),1).setUsage(T.DynamicDrawUsage);this.geometry.setAttribute('fragmentAlpha',this.alpha);
  this.material=new T.MeshBasicMaterial({transparent:true,depthWrite:false});
  this.material.onBeforeCompile=shader=>{
   shader.vertexShader='attribute float fragmentAlpha;varying float vFragmentAlpha;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvFragmentAlpha=fragmentAlpha;');
   shader.fragmentShader='varying float vFragmentAlpha;\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=vFragmentAlpha;');
  };this.material.customProgramCacheKey=()=> 'fragment-batch-v1';
  this.mesh=new T.InstancedMesh(this.geometry,this.material,PARTICLE_CAPACITY);this.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);this.mesh.frustumCulled=false;this.mesh.count=0;
  this.mesh.setColorAt(0,new T.Color('#fff'));this.mesh.instanceColor.setUsage(T.DynamicDrawUsage);
  this.dummy=new T.Object3D();this.active=[];this.free=Array.from({length:PARTICLE_CAPACITY},()=>({color:new T.Color()}));this.limit=PARTICLE_CAPACITY;
 }
 get count(){return this.active.length;}
 setLow(low){this.limit=low?LOW_PARTICLE_CAPACITY:PARTICLE_CAPACITY;while(this.active.length>this.limit)this.free.push(this.active.pop());this.mesh.count=this.active.length;}
 emit(x,y,color,n,random=Math.random){
  n=Math.min(n,this.limit-this.active.length);for(let i=0;i<n;i++){
   const p=this.free.pop();p.x=x;p.y=y;p.z=.4;p.size=.04+random()*.13;p.vx=(random()-.5)*10;p.vy=(random()-.5)*10;p.vz=random()*5;p.life=.6+random()*.25;p.total=.85;p.rotation=0;p.color.set(color);this.active.push(p);
  }
 }
 clear(){while(this.active.length)this.free.push(this.active.pop());this.mesh.count=0;}
 update(dt){
  let kept=0;for(const p of this.active){
   p.life-=dt;if(p.life<=0){this.free.push(p);continue;}
   p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vz-=dt*8;p.rotation+=dt*5;
   this.dummy.position.set(p.x,p.y,p.z);this.dummy.rotation.set(p.rotation,0,0);this.dummy.scale.setScalar(p.size);this.dummy.updateMatrix();this.mesh.setMatrixAt(kept,this.dummy.matrix);this.mesh.setColorAt(kept,p.color);this.alpha.setX(kept,Math.max(0,p.life/p.total));this.active[kept++]=p;
  }this.active.length=kept;this.mesh.count=kept;
  if(kept){this.mesh.instanceMatrix.needsUpdate=true;this.mesh.instanceColor.needsUpdate=true;this.alpha.needsUpdate=true;}
 }
 warm(){
  // Upload the real buffers before the first impact, rather than warming a separate mesh.
  this.mesh.count=Math.max(1,this.active.length);this.mesh.setMatrixAt(0,new T.Matrix4().makeScale(.1,.1,.1));this.mesh.instanceMatrix.needsUpdate=true;this.mesh.instanceColor.needsUpdate=true;this.alpha.setX(0,.5);this.alpha.needsUpdate=true;
 }
}
