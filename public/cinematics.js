import * as T from './vendor/three.module.min.js';
import {WORLDS,rng} from './levels.js';
import {cameraFrame,smooth,clamp01} from './cinematic-score.js';
export class Cinematic{
 constructor(scene,halo){this.scene=scene;this.halo=halo;this.group=new T.Group();this.scene.add(this.group);this.current=-1;this.nodes=[];this.geometries=new Set();this.materials=new Set();this.dummy=new T.Object3D();}
 geometry(g){this.geometries.add(g);return g;}
 material(color,glow=false){const m=glow?new T.MeshBasicMaterial({color:new T.Color(color).multiplyScalar(2.2),transparent:true,opacity:1}):new T.MeshStandardMaterial({color,roughness:.26,metalness:.6,emissive:color,emissiveIntensity:.2});this.materials.add(m);return m;}
 mesh(geometry,material,position=[0,0,0],scale=[1,1,1],parent=this.group){const m=new T.Mesh(geometry,material);m.position.set(...position);m.scale.set(...scale);parent.add(m);return m;}
 haloAt(color,size,position=[0,0,0],parent=this.group){const mat=new T.SpriteMaterial({map:this.halo,color,transparent:true,opacity:.3,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false});this.materials.add(mat);const m=new T.Sprite(mat);m.position.set(...position);m.scale.setScalar(size);parent.add(m);return m;}
 ring(radius,color,position=[0,3,0],thickness=.05){const g=this.geometry(new T.TorusGeometry(radius,thickness,8,64)),m=this.mesh(g,this.material(color,true),position);return m;}
 clear(){for(const child of [...this.group.children])this.group.remove(child);for(const g of this.geometries)g.dispose();for(const m of this.materials)m.dispose();this.geometries.clear();this.materials.clear();this.nodes=[];}
 build(index,lowEffects=false){
  this.clear();this.current=index;this.lowEffects=lowEffects;const w=WORLDS[index],rand=rng(8300+index),box=this.geometry(new T.BoxGeometry(1,1,1)),octa=this.geometry(new T.OctahedronGeometry(1)),sphere=this.geometry(new T.SphereGeometry(1,16,10)),cone=this.geometry(new T.ConeGeometry(1,3,6));
  const mats=w.colors.map(c=>this.material(c)),bright=w.colors.map(c=>this.material(c,true)),metal=this.material('#203b44');
  const physical=new T.MeshPhysicalMaterial({color:w.accent,metalness:.25,roughness:.13,clearcoat:1,clearcoatRoughness:.08,iridescence:.65,emissive:w.accent,emissiveIntensity:.55});this.materials.add(physical);
  this.hero=this.mesh(this.geometry(new T.OctahedronGeometry(2.15)),physical,[0,3.2,0]);this.heroOutline=this.mesh(this.geometry(new T.OctahedronGeometry(2.32)),new T.MeshBasicMaterial({color:new T.Color(w.accent).multiplyScalar(2.3),wireframe:true,transparent:true,opacity:.55}),[0,3.2,0]);this.materials.add(this.heroOutline.material);this.coreHalo=this.haloAt(w.accent,15,[0,3.2,0]);
  this.key=new T.PointLight(w.accent,50,65,1.5);this.key.position.set(0,6,8);this.group.add(this.key);const rim=new T.PointLight(w.colors[2],38,60,1.5);rim.position.set(-8,5,-5);this.group.add(rim);
  this.orbits=[];for(let i=0;i<3;i++){const ring=this.ring(3.1+i*.7,w.colors[i]);ring.rotation.set(i*.55,i*.65,0);this.orbits.push(ring);}
  const beamMat=new T.ShaderMaterial({uniforms:{color:{value:new T.Color(w.accent).multiplyScalar(1.6)}},transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,vertexShader:'varying vec2 vUv;varying vec3 vN;varying vec3 vView;void main(){vUv=uv;vec4 p=modelViewMatrix*vec4(position,1.0);vN=normalize(normalMatrix*normal);vView=-p.xyz;gl_Position=projectionMatrix*p;}',fragmentShader:'uniform vec3 color;varying vec2 vUv;varying vec3 vN;varying vec3 vView;void main(){float rim=pow(abs(dot(normalize(vN),normalize(vView))),2.0);float ends=pow(max(0.0,sin(vUv.y*3.14159)),0.8);gl_FragColor=vec4(color,0.065*rim*ends);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'});this.materials.add(beamMat);
  this.beams=[];for(let i=0;i<4;i++){const b=this.mesh(this.geometry(new T.CylinderGeometry(.2,5.5,28,24,1,true)),beamMat,[Math.sin(i*1.57)*4,2,-8], [1,1,1]);b.rotation.z=(i-1.5)*.22;this.beams.push(b);}
  const dustCount=lowEffects?220:850,positions=[],colors=[];for(let i=0;i<dustCount;i++){positions.push((rand()-.5)*64,(rand()-.25)*44,(rand()-.6)*60);const color=new T.Color(w.colors[i%4]);colors.push(color.r,color.g,color.b);}
  const dustGeo=this.geometry(new T.BufferGeometry());dustGeo.setAttribute('position',new T.Float32BufferAttribute(positions,3));dustGeo.setAttribute('color',new T.Float32BufferAttribute(colors,3));const dustMat=new T.PointsMaterial({size:.13,map:this.halo,vertexColors:true,transparent:true,opacity:.8,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false});this.materials.add(dustMat);this.dust=new T.Points(dustGeo,dustMat);this.group.add(this.dust);
  this.shards=[];for(let i=0;i<(lowEffects?20:48);i++){const m=this.mesh(octa,bright[i%4],[0,3,0],[.12,.38,.12]);m.userData={phase:rand()*Math.PI*2,radius:4+rand()*8,lift:rand()*10-3};this.shards.push(m);}
  this.horizon=this.ring(15,w.accent,[0,-4,0],.08);this.horizon.rotation.x=Math.PI/2;
  if(index===0){
   const ground=this.mesh(this.geometry(new T.CylinderGeometry(16,18,1,48)),metal,[0,-4.8,0]);this.nodes.push({kind:'ground',mesh:ground});
   for(let i=0;i<30;i++){const a=i/30*Math.PI*2,r=8+rand()*8;const tree=this.mesh(cone,mats[i%4],[Math.cos(a)*r,-1.6,Math.sin(a)*r],[.65+rand(),1.4+rand()*2,.65+rand()]);tree.userData.baseY=tree.position.y;this.nodes.push({kind:'tree',mesh:tree,phase:a});}
   for(let i=0;i<5;i++){const ring=this.ring(4.5+i*.8,w.colors[i%4],[0,4,-9-i*1.5],.055);this.nodes.push({kind:'gate',mesh:ring,phase:i});}
  }
  if(index===1){
   for(let i=0;i<22;i++){const cloud=new T.Group();cloud.position.set((rand()-.5)*38,-4+rand()*18,-17+rand()*18);this.group.add(cloud);for(let j=0;j<3;j++)this.mesh(sphere,mats[i%4],[j*1.4-1.4,Math.sin(j)*.4,0],[2.3,1.05,1.6],cloud);this.nodes.push({kind:'cloud',mesh:cloud,base:cloud.position.y,phase:i});}
   for(let i=0;i<8;i++){const hoop=this.ring(2.5+i*.18,w.colors[i%4],[Math.cos(i*.78)*9,4+Math.sin(i*.78)*7,-9],.09);this.nodes.push({kind:'wheel',mesh:hoop,phase:i});}
  }
  if(index===2){
   for(let i=0;i<48;i++){const side=i%2?1:-1,x=side*(7+rand()*12),z=-23+rand()*33,h=4+rand()*15;this.mesh(box,metal,[x,h/2-5,z],[1.4,h,1.5]);const edge=this.mesh(box,bright[i%4],[x,h/2-5,z+.8],[.07,h,.04]);this.nodes.push({kind:'city-light',mesh:edge,phase:i});}
   for(let i=0;i<10;i++)this.mesh(box,bright[i%4],[i%2?-3:3,-4.9,-20+i*4],[.05,.03,3]);
   const portal=this.ring(5.2,w.accent,[0,3,-8],.14);this.nodes.push({kind:'gate',mesh:portal,phase:1});
  }
  if(index===3){
   for(let i=0;i<42;i++){const a=i*.77,r=7+rand()*8;const crystal=this.mesh(octa,mats[i%4],[Math.cos(a)*r,-1+rand()*10,Math.sin(a)*r-5],[.6+rand(),2+rand()*4,.6+rand()]);crystal.rotation.z=(rand()-.5)*.6;this.nodes.push({kind:'crystal',mesh:crystal,phase:i});}
   for(let i=0;i<7;i++){const ring=this.ring(6-i*.25,w.colors[i%4],[0,3,-8-i*2.5],.045);ring.rotation.z=i*.2;this.nodes.push({kind:'gate',mesh:ring,phase:i});}
  }
  if(index===4){
   for(let i=0;i<5;i++){const gear=new T.Group();gear.position.set((i%2?1:-1)*(6+i),2+(i%3)*3,-5-i*2);gear.rotation.y=i*.25;this.group.add(gear);const ring=new T.Mesh(this.geometry(new T.TorusGeometry(3+i*.25,.35,12,48)),metal);gear.add(ring);for(let j=0;j<14;j++){const a=j/14*Math.PI*2;const tooth=this.mesh(box,mats[0],[Math.cos(a)*(3.3+i*.25),Math.sin(a)*(3.3+i*.25),0],[.48,.8,.7],gear);tooth.rotation.z=a;}this.nodes.push({kind:'gear',mesh:gear,phase:i});}
   for(let i=0;i<8;i++)this.mesh(box,bright[i%2],[i-3.5,-4.5,-2],[.18,.2,21]);
   this.haloAt('#ff7344',25,[0,-3,-7]);
  }
  if(index===5){
   for(let i=0;i<5;i++){const ring=this.ring(6+i*.65,w.colors[i%4],[0,3,-4],.1);ring.rotation.set(i*.55,i*.4,0);this.nodes.push({kind:'astrolabe',mesh:ring,phase:i});}
   for(let i=0;i<12;i++){const a=i/12*Math.PI*2;this.mesh(octa,mats[i%4],[Math.cos(a)*12,-1,Math.sin(a)*12-5],[.9,4+rand()*3,.9]);}
   this.haloAt('#8cbaff',25,[0,10,-15]);
  }
  if(index===6){
   for(let i=0;i<32;i++){const a=i*.7,r=7+rand()*10;const coral=this.ring(.6+rand()*1.3,w.colors[i%4],[Math.cos(a)*r,-3+rand()*5,Math.sin(a)*r-7],.11);coral.rotation.set(rand()*2,rand()*2,0);this.nodes.push({kind:'reef',mesh:coral,base:coral.position.y,phase:i});}
   const spiral=[];for(let i=0;i<200;i++){const a=i*.14,r=2+i*.055;spiral.push(new T.Vector3(Math.cos(a)*r,3+Math.sin(a)*r,-18-i*.035));}const trail=this.mesh(this.geometry(new T.TubeGeometry(new T.CatmullRomCurve3(spiral),280,.045,6,false)),bright[1]);this.nodes.push({kind:'spiral',mesh:trail,phase:0});
   for(let i=0;i<8;i++){const hoop=this.ring(3+i*.75,w.colors[i%4],[0,3,-8-i*2],.06);this.nodes.push({kind:'gate',mesh:hoop,phase:i});}
  }
  if(index===7){
   for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const tower=this.mesh(octa,mats[i%4],[Math.cos(a)*10,2,Math.sin(a)*10-3],[1.6,5.5,1.6]);this.nodes.push({kind:'citadel',mesh:tower,phase:a});const satellite=this.mesh(octa,bright[i%4],[Math.cos(a)*7,4,Math.sin(a)*7],[.6,.9,.6]);this.nodes.push({kind:'satellite',mesh:satellite,phase:a});}
   for(let i=0;i<6;i++)this.mesh(box,metal,[0,-4+i*.45,-3],[17-i*2,.45,17-i*2]);
   for(let i=0;i<8;i++){const ring=this.ring(5+i*.6,w.colors[i%4],[0,3,0],.07);ring.rotation.x=i*.24;this.nodes.push({kind:'final-ring',mesh:ring,phase:i});}
  }
 }
 render(level,seconds,aspect,settings){
  if(this.current!==level||this.lowEffects!==settings.lowEffects)this.build(level,settings.lowEffects);this.group.visible=true;
  const frame=cameraFrame(level,seconds,aspect,settings.reducedMotion),p=frame.progress,t=settings.reducedMotion?9:seconds,unfold=smooth((p-.08)/.35),assemble=level===7?smooth((p-.58)/.25):0;
  this.hero.rotation.set(t*.16,t*.38,t*.08);this.hero.scale.setScalar(.85+.32*unfold+.15*assemble);this.heroOutline.rotation.copy(this.hero.rotation);this.heroOutline.scale.copy(this.hero.scale);this.hero.material.emissiveIntensity=.25+unfold*.32+assemble*.5;
  this.coreHalo.material.opacity=.16+unfold*.1;this.coreHalo.scale.setScalar(12+unfold*4+assemble*4);this.key.intensity=45+unfold*25;this.dust.rotation.y=t*.013;
  this.orbits.forEach((m,i)=>{m.rotation.y=i*.6+t*(i%2?-.11:.13);m.rotation.z=t*.07;const scale=.7+unfold*.4;m.scale.setScalar(scale);});
  this.shards.forEach((m,i)=>{const u=m.userData,a=u.phase+t*(.12+i%3*.03),radius=u.radius*(1-assemble*.75);m.position.set(Math.cos(a)*radius,3+u.lift*(1-assemble)+Math.sin(a*2+t*.25)*.5,Math.sin(a)*radius);m.rotation.set(t*.3+i,a,t*.2);});
  for(const {kind,mesh:m,phase=0,base=0}of this.nodes){
   if(kind==='tree')m.scale.y=(1.4+phase%2)*(.7+unfold*.35);
   if(kind==='gate'){m.rotation.z=phase*.15+t*.08;m.scale.setScalar(.8+unfold*.2);}
   if(kind==='cloud')m.position.y=base+Math.sin(t*.2+phase)*.4;
   if(kind==='wheel')m.rotation.z=t*.1*(phase%2?1:-1);
   if(kind==='city-light')m.material.opacity=.45+smooth((p-phase*.004)/.2)*.55;
   if(kind==='crystal')m.rotation.y=t*.05+phase;
   if(kind==='gear')m.rotation.z=t*.14*(phase%2?1:-1);
   if(kind==='astrolabe'){m.rotation.y=phase*.4+t*.06;m.rotation.z=t*.09*(phase%2?1:-1);}
   if(kind==='reef')m.position.y=base+Math.sin(t*.35+phase)*.5;
   if(kind==='spiral')m.rotation.z=t*.06;
   if(kind==='citadel')m.position.y=2+smooth(p/.25)*.75;
   if(kind==='satellite'){const a=phase+t*.17,r=7*(1-assemble*.75);m.position.set(Math.cos(a)*r,4+Math.sin(a*2)*(1-assemble),Math.sin(a)*r);m.rotation.y=t*.4;}
   if(kind==='final-ring'){m.scale.setScalar(.65+unfold*.35+assemble*.45);m.rotation.z=t*.06*(phase%2?1:-1);}
  }
  return frame;
 }
}
