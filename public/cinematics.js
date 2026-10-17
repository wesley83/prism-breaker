import * as T from './vendor/three.module.min.js';
import {WORLDS,rng} from './levels.js';
import {cameraFrame,smooth} from './cinematic-score.js';
// Sets are built once; frames only move objects and uniforms. Shared geometry bounds phone cost.
export class Cinematic{
 constructor(scene,halo,environment){this.scene=scene;this.halo=halo;this.environment=environment;this.group=new T.Group();scene.add(this.group);this.current=-1;this.geometries=new Set();this.materials=new Set();this.nodes=[];}
 geometry(g){this.geometries.add(g);return g;}
 material(color,glow=false){const m=glow?new T.MeshBasicMaterial({color:new T.Color(color).multiplyScalar(1.7),transparent:true,opacity:1}):new T.MeshPhysicalMaterial({color,roughness:.22,metalness:.48,clearcoat:1,envMap:this.environment,envMapIntensity:.7,emissive:color,emissiveIntensity:.07});this.materials.add(m);return m;}
 mesh(g,m,p=[0,0,0],s=[1,1,1],parent=this.group){const o=new T.Mesh(g,m);o.position.set(...p);o.scale.set(...s);parent.add(o);return o;}
 groupAt(p=[0,0,0],parent=this.group){const g=new T.Group();g.position.set(...p);parent.add(g);return g;}
 ring(r,m,p=[0,0,0],tube=.06,parent=this.group){return this.mesh(this.geometry(new T.TorusGeometry(r,tube,8,this.low?48:96)),m,p,[1,1,1],parent);}
 haloAt(color,size,p,parent=this.group){const m=new T.SpriteMaterial({map:this.halo,color,transparent:true,opacity:.18,depthWrite:false,blending:T.AdditiveBlending});this.materials.add(m);const o=new T.Sprite(m);o.position.set(...p);o.scale.setScalar(size);parent.add(o);return o;}
 animate(mesh,kind,phase=0){this.nodes.push({mesh,kind,phase,position:mesh.position.clone(),scale:mesh.scale.clone(),rotation:mesh.rotation.clone()});return mesh;}
 clear(){this.group.clear();for(const g of this.geometries)g.dispose();for(const m of this.materials)m.dispose();this.geometries.clear();this.materials.clear();this.nodes=[];}
 build(index,low=false,definition=WORLDS[index]){
  this.clear();this.currentDefinition=definition;this.current=index;this.lowEffects=this.low=low;const w=definition,rand=rng(19381+index),TAU=Math.PI*2;
  const box=this.geometry(new T.BoxGeometry(1,1,1)),gem=this.geometry(new T.OctahedronGeometry(1)),sphere=this.geometry(new T.SphereGeometry(1,low?20:40,low?12:24)),pillar=this.geometry(new T.CylinderGeometry(.65,.9,1,8));
  const colors=w.colors.map(c=>this.material(c)),light=w.colors.map(c=>this.material(c,true)),stone=this.material('#142631'),gold=this.material('#dcc390');
  const M=(g,m,p,s,parent=this.group)=>this.mesh(g,m,p,s,parent),R=(r,m,p,t=.06,parent=this.group)=>this.ring(r,m,p,t,parent);
  const terrain=new T.InstancedMesh(gem,stone,low?42:100),dummy=new T.Object3D();
  for(let i=0;i<terrain.count;i++){const a=rand()*TAU,r=15+rand()*24;dummy.position.set(Math.cos(a)*r,-6-rand()*4,Math.sin(a)*r);dummy.scale.set(1+rand()*3,2+rand()*7,1+rand()*3);dummy.rotation.set(rand(),rand()*TAU,rand());dummy.updateMatrix();terrain.setMatrixAt(i,dummy.matrix);}this.group.add(terrain);
  M(this.geometry(new T.CylinderGeometry(10,12,.55,64)),stone,[0,-4.4,0]);R(10,light[0],[0,-4.08,0],.025).rotation.x=Math.PI/2;
  for(let i=0;i<3;i++)R(10.4+i*.35,colors[2],[0,-4.2-i*.18,0],.07).rotation.x=Math.PI/2;
  const positions=[],tints=[];for(let i=0;i<(low?250:1100);i++){positions.push((rand()-.5)*72,(rand()-.3)*44,(rand()-.5)*65);const c=new T.Color(w.colors[i%4]);tints.push(c.r,c.g,c.b);}
  const dust=this.geometry(new T.BufferGeometry());dust.setAttribute('position',new T.Float32BufferAttribute(positions,3));dust.setAttribute('color',new T.Float32BufferAttribute(tints,3));const dm=new T.PointsMaterial({map:this.halo,size:.11,vertexColors:true,transparent:true,opacity:.65,depthWrite:false,blending:T.AdditiveBlending});this.materials.add(dm);this.dust=new T.Points(dust,dm);this.group.add(this.dust);
  this.key=new T.PointLight(w.accent,95,60,1.5);this.key.position.set(3,9,9);this.group.add(this.key);const rim=new T.PointLight(w.colors[2],85,65,1.5);rim.position.set(-9,6,-8);this.group.add(rim);this.glow=this.haloAt(w.accent,24,[0,4,-5]);
  const beamMaterial=new T.ShaderMaterial({uniforms:{tint:{value:new T.Color(w.accent)},power:{value:0}},transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 v;uniform vec3 tint;uniform float power;void main(){float edge=pow(sin(v.x*3.1415926),4.);float ends=pow(sin(v.y*3.1415926),2.);gl_FragColor=vec4(tint*1.8,edge*ends*power*.075);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'});this.materials.add(beamMaterial);this.beamMaterial=beamMaterial;
  for(let i=0;i<5;i++){const b=M(this.geometry(new T.PlaneGeometry(4,35)),beamMaterial,[(i-2)*7,10,-14-i]);b.rotation.z=(i-2)*-.14;}
  const crystal=(p,s,color=0,parent=this.group)=>this.animate(M(gem,colors[color%4],p,s,parent),'rise',rand()*2);
  const gear=(radius,p,color=2)=>{const g=this.groupAt(p);R(radius,colors[color],undefined,.22,g);const count=low?12:20;for(let i=0;i<count;i++){const a=i/count*TAU;M(box,gold,[Math.sin(a)*radius,Math.cos(a)*radius,0],[.45,.8,.5],g).rotation.z=-a;}for(let i=0;i<4;i++)M(box,stone,[0,0,0],[radius*1.8,.18,.25],g).rotation.z=i*Math.PI/4;this.animate(g,'spin',p[0]>0?1:-1);return g;};
  const arch=(p,scale=1)=>{const g=this.groupAt(p);g.scale.setScalar(scale);R(3,gold,[0,2,0],.16,g);M(pillar,stone,[-3,-1,0],[1,6,1],g);M(pillar,stone,[3,-1,0],[1,6,1],g);return g;};
  if(index===0){
   this.animate(M(this.geometry(new T.CylinderGeometry(.3,1,8,7)),gold,[0,0,0]),'grow');
   for(let i=0;i<(low?14:26);i++){const a=i*2.4,y=1+i*.22,r=1.6+Math.sin(i*.45)*1.3;M(box,gold,[Math.cos(a)*r*.45,y-.3,Math.sin(a)*r*.45],[r*1.15,.13,.16]).rotation.set(0,-a,.35);crystal([Math.cos(a)*r,y+1,Math.sin(a)*r],[.7,1.4,.65],i);}
   for(let i=0;i<16;i++){const a=i/16*TAU,r=6+rand()*3;crystal([Math.cos(a)*r,-3.1,Math.sin(a)*r],[.4,.8+rand(),.4],i);}
  }else if(index===1){
   const wheel=this.groupAt([0,4,0]);R(5,gold,undefined,.17,wheel);R(4.6,light[0],undefined,.045,wheel);
   for(let i=0;i<12;i++){const a=i/12*TAU;M(box,gold,[Math.sin(a)*2.5,Math.cos(a)*2.5,0],[.065,5,.08],wheel).rotation.z=-a;crystal([Math.sin(a)*5,Math.cos(a)*5,0],[.55,.8,.55],i,wheel);}this.animate(wheel,'spin',.35);
   for(const x of [-2,2])M(box,stone,[x,-.5,0],[.3,8,.6]).rotation.z=x*.11;
   for(let i=0;i<(low?9:18);i++){const a=i*2.4,r=8+rand()*8,cloud=this.groupAt([Math.cos(a)*r,-3+rand()*3,Math.sin(a)*r-3]);for(let j=0;j<3;j++)M(sphere,colors[i%4],[(j-1)*1.8,Math.sin(j)*.5,0],[2,1,1.4],cloud);this.animate(cloud,'float',i);}
  }else if(index===2){
   for(let i=0;i<34;i++){const x=(i%2?1:-1)*(4+rand()*11),z=(rand()-.5)*26,h=4+rand()*13;M(box,stone,[x,h/2-4,z],[1.7,h,1.7]);this.animate(M(box,light[i%4],[x,h/2-4,z+1],[.045,h,.06]),'grow',i*.05);for(let j=0;j<3;j++)M(box,colors[i%4],[x-.45+j*.45,h-4.1,z+1],[.18,.25,.04]);}
   this.animate(arch([0,1,-7],1.35),'rise');for(let i=0;i<12;i++)M(box,light[i%4],[0,-3.98,-20+i*3],[.12,.025,1.7]);
  }else if(index===3){
   for(let i=0;i<24;i++){const a=i/24*TAU,r=6+rand()*5;crystal([Math.cos(a)*r,rand()*3,Math.sin(a)*r],[.65+rand()*.6,3+rand()*4,.65+rand()*.6],i);}
   for(let i=0;i<7;i++){const a=i/7*TAU;crystal([Math.cos(a)*2.4,4,Math.sin(a)*2.4],[.9,3.3,.9],i);}for(let i=0;i<4;i++)arch([0,1,-8-i*4],1+i*.12);
  }else if(index===4){
   gear(3.5,[-6,3,-3],0);gear(2.8,[6,1,-2],2);gear(2.2,[4,7,-5],0);M(this.geometry(new T.CylinderGeometry(3.3,1.8,3,12,1,true)),gold,[0,-1,0]);this.animate(M(sphere,light[0],[0,3.5,0],[1.5,1.5,1.5]),'pulse');
   for(let i=0;i<7;i++){const r=R(2.5+i*.35,light[i%2],[0,3.5,0],.055);r.rotation.x=i*.4;this.animate(r,'orbit',i);}this.haloAt('#ff7b37',18,[0,3,-2]);
  }else if(index===5){
   const telescope=this.groupAt([0,3,0]);for(let i=0;i<5;i++){const r=R(3+i*.48,i%2?gold:colors[0],undefined,.12,telescope);r.rotation.set(i*.42,i*.6,0);this.animate(r,'orbit',i);}
   M(this.geometry(new T.CylinderGeometry(2.1,1.2,6,24,1,true)),stone,[0,0,0],[1,1,1],telescope).rotation.x=Math.PI/2;M(sphere,colors[1],[0,0,3],[2,2,.15],telescope);this.animate(telescope,'float');
   for(let i=0;i<12;i++){const a=i/12*TAU;crystal([Math.cos(a)*9,-1,Math.sin(a)*9],[.7,3,.7],i);}this.haloAt('#bdedff',16,[0,5,-15]);
  }else if(index===6){
   for(let i=0;i<(low?6:11);i++){const a=i*2.4,r=i?5+rand()*7:0,jelly=this.groupAt([Math.cos(a)*r,3+rand()*5,Math.sin(a)*r]);M(this.geometry(new T.SphereGeometry(1.7,24,12,0,TAU,0,Math.PI*.55)),colors[i%4],[0,0,0],[1,1,1],jelly);R(1.67,light[i%4],[0,-.2,0],.03,jelly).rotation.x=Math.PI/2;for(let j=0;j<6;j++){const pts=[];for(let k=0;k<8;k++)pts.push(new T.Vector3(Math.cos(j)*(.7+Math.sin(k)*.18),-k*.6,Math.sin(j)*(.7+Math.cos(k)*.18)));M(this.geometry(new T.TubeGeometry(new T.CatmullRomCurve3(pts),22,.025,4)),light[i%4],[0,0,0],[1,1,1],jelly);}this.animate(jelly,'float',i);}
  }else if(index===7){
   for(let i=0;i<8;i++){const a=i/8*TAU;crystal([Math.cos(a)*8,1.5,Math.sin(a)*8],[1.15,6,1.15],i);}arch([0,1,0],1.5);for(const side of [-1,1])this.animate(M(box,colors[0],[side*1.5,3,0],[2.8,7,.6]),'door',side);for(let i=0;i<8;i++)this.animate(R(3.9,light[i%4],[0,3,-2-i*1.8],.045),'portal',i);
  }else if(index===8){
   for(let i=0;i<7;i++){const a=i/7*TAU;arch([Math.cos(a)*8,0,Math.sin(a)*8],.85).rotation.y=-a+Math.PI/2;}
   for(const side of [-1,1]){const book=this.groupAt([0,0,1]);book.rotation.z=side*-.2;M(box,gold,[side*1.8,0,0],[3.6,.22,4.8],book);for(let j=0;j<6;j++)M(box,colors[3],[side*1.7,.15+j*.06,0],[3.25,.035,4.4],book);this.animate(book,'float',side);}
   for(let i=0;i<12;i++){const a=i*2.4;crystal([Math.cos(a)*(2+i*.17),3+i*.3,Math.sin(a)*3],[.17,.3,.17],i);}for(let i=0;i<3;i++)R(3.4+i*.55,light[0],[0,5,-1],.02).rotation.y=i*.5;
  }else if(index===9){
   for(let j=0;j<6;j++){const pos=[],idx=[];for(let i=0;i<=70;i++){const x=(i/70-.5)*28,y=5+Math.sin(i*.07+j*.7)*3,z=-j*2+Math.cos(i*.1)*2;pos.push(x,y,z,x,y+3.2,z);if(i<70){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}}const g=this.geometry(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();const mat=new T.MeshBasicMaterial({color:w.colors[j%4],transparent:true,opacity:.18,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending});this.materials.add(mat);this.animate(M(g,mat),'ribbon',j);}
   for(let i=0;i<12;i++)crystal([(i-5.5)*1.6,-3,Math.sin(i)*3],[.5,1.2,.5],i);arch([0,0,-2]);
  }else if(index===10){
   for(let i=0;i<(low?5:9);i++){const a=i*2.4,r=i?7+rand()*4:0,x=Math.cos(a)*r,z=Math.sin(a)*r;M(pillar,gold,[x,0,z],[1,8,1]);gear(i?1.8:3.4,[x,4,z],i%4).rotation.x=.3;for(let j=0;j<4;j++)crystal([x+Math.cos(j*1.57)*2,5,z+Math.sin(j*1.57)*2],[.7,1,.7],1);}R(5,light[2],[0,4,-2],.035);
  }else if(index===11){
   const pyramid=this.geometry(new T.ConeGeometry(1,1.4,4));for(let i=0;i<17;i++){const a=i*2.4,r=7+rand()*15,h=2+rand()*5;M(pyramid,colors[i%4],[Math.cos(a)*r,-3,Math.sin(a)*r],[h,h,h]).rotation.y=Math.PI/4;}
   const main=M(pyramid,gold,[0,1,0],[4.5,5,4.5]);main.rotation.y=Math.PI/4;this.animate(main,'rise');this.animate(R(3.1,light[1],[0,3,3],.075),'portal');M(sphere,light[2],[0,9,-15],[3.6,3.6,3.6]);this.haloAt(w.colors[2],24,[0,9,-16]);
  }else if(index===12){
   for(let i=0;i<5;i++)M(box,stone,[0,-2+i*2.1,0],[5-i*.65,1.8,5-i*.65]);crystal([0,8,0],[.65,2,.65],0);
   for(let i=0;i<9;i++){const a=i/9*TAU,pts=[];for(let j=0;j<11;j++)pts.push(new T.Vector3(Math.cos(a)*(2+j*.9)+Math.sin(j*9+i)*.35,9-j*.6+Math.cos(j*5)*.4,Math.sin(a)*(2+j*.9)));this.animate(M(this.geometry(new T.TubeGeometry(new T.CatmullRomCurve3(pts),45,.04,4)),light[i%3]),'lightning',i);}
   for(let i=0;i<4;i++){const r=R(5+i*.7,colors[0],[0,7-i*.5,-2],.2);r.rotation.x=1.25;this.animate(r,'orbit',i);}
  }else if(index===13){
   M(sphere,colors[0],[-7,9,-14],[5,5,5]);R(6,light[1],[-7,9,-14],.035).rotation.y=.6;for(let i=0;i<5;i++){M(box,stone,[(i-2)*4,-3,0],[2,.6,13]);M(box,light[2],[(i-2)*4,-2.65,0],[.05,.04,13]);}
   const ship=this.groupAt([0,3,0]);M(gem,colors[0],[0,0,0],[1.15,1,5],ship);for(const side of [-1,1]){M(gem,gold,[side*2.5,-.2,1],[2.5,.25,2.3],ship);this.haloAt('#8ef9ff',3,[side*.5,0,4],ship);}this.animate(ship,'depart');
  }else if(index===14){
   const black=new T.MeshBasicMaterial({color:'#010106'});this.materials.add(black);M(sphere,black,[0,4,0],[3,3,3]);for(let i=0;i<18;i++){const r=R(3.2+i*.22,light[i%3],[0,4,0],i%3===0?.08:.025);r.rotation.set(1.1,.25,0);this.animate(r,'accretion',i);}this.animate(R(3.12,light[2],[0,4,.2],.11),'pulse');for(let i=0;i<7;i++){const a=i*2.4;crystal([Math.cos(a)*10,4+Math.sin(a)*6,-5],[.35,.8,.35],i);}
  }else{
   for(let i=0;i<16;i++){const a=i/16*TAU,color=this.material(WORLDS[i].accent);this.animate(M(gem,color,[Math.cos(a)*8,1,Math.sin(a)*8],[.7,4.5,.7]),'rise',i*.08);this.animate(M(box,light[i%4],[Math.cos(a)*8,8,Math.sin(a)*8],[.035,17,.035]),'grow',i*.07);}for(let i=0;i<3;i++)this.animate(arch([0,0,-i*3],1.4+i*.2),'rise',i*.25);
   this.animate(M(this.geometry(new T.IcosahedronGeometry(2.5,1)),colors[0],[0,5,0]),'pulse');for(let i=0;i<6;i++){const r=R(3.1+i*.42,light[i%4],[0,5,0],.04);r.rotation.set(i*.45,i*.6,0);this.animate(r,'orbit',i);}this.haloAt('#fff2b3',26,[0,5,-3]);
  }
  this.fragments=[];for(let i=0;i<(low?18:44);i++){const o=M(gem,light[i%4],[0,0,0],[.08,.18,.08]);o.userData={a:rand()*TAU,r:7+rand()*10,y:rand()*13};this.fragments.push(o);}
 }
 render(level,seconds,aspect,settings,definition=WORLDS[level]){
  if(this.current!==level||this.currentDefinition!==definition||this.lowEffects!==settings.lowEffects)this.build(level,settings.lowEffects,definition);
  const frame=cameraFrame(level,seconds,aspect,settings.reducedMotion),p=frame.progress,t=settings.reducedMotion?12:seconds,activation=smooth((p-.12)/.43);
  this.group.visible=true;this.key.intensity=65+activation*50;this.glow.material.opacity=.1+activation*.12;this.beamMaterial.uniforms.power.value=activation;this.dust.rotation.y=t*.012;
  for(const n of this.nodes){const o=n.mesh,a=n.phase;o.position.copy(n.position);o.rotation.copy(n.rotation);o.scale.copy(n.scale);
   if(n.kind==='rise'){const v=smooth((p-.08-a*.025)/.42);o.position.y-=(1-v)*4;o.scale.multiplyScalar(.6+v*.4);}
   if(n.kind==='grow')o.scale.y=n.scale.y*(.05+.95*smooth((p-.08-a*.04)/.4));
   if(n.kind==='float')o.position.y+=Math.sin(t*.45+a)*.35;
   if(n.kind==='spin')o.rotation.z+=t*.13*(a||1);
   if(n.kind==='orbit'){o.rotation.y+=t*.09*(a%2?1:-1);o.rotation.z+=t*.07;}
   if(n.kind==='door'){o.position.x+=a*activation*2.4;o.rotation.y=a*activation*.45;}
   if(n.kind==='portal'){o.scale.multiplyScalar(.75+activation*.25);o.rotation.z+=t*.025;}
   if(n.kind==='pulse'){o.scale.multiplyScalar(.94+activation*.08+Math.sin(t*1.1)*.015);o.rotation.y+=t*.1;}
   if(n.kind==='ribbon'){o.position.y+=Math.sin(t*.35+a)*.5;o.rotation.y=Math.sin(t*.2+a)*.06;o.material.opacity=.08+activation*.15;}
   // Keep the storm moving after its reveal; slow deformation avoids strobing and extra draws.
   if(n.kind==='lightning'){o.scale.x=n.scale.x*(1+Math.sin(t*.8+a)*activation*.12);o.scale.y=n.scale.y*(.8+activation*(.2+Math.sin(t*.9+a)*.035));o.scale.z=n.scale.z*(1+Math.cos(t*.65+a)*activation*.1);o.rotation.y+=Math.sin(t*.6+a)*activation*.06;}
   // Departure occupies all three shots, ending at the explicit final-frame hold.
   if(n.kind==='depart'){const departure=smooth((p-.12)/.82);o.position.x+=Math.sin(departure*Math.PI)*1.1;o.position.y+=departure*2.5;o.position.z-=departure*7;o.rotation.y=-.35*departure;o.rotation.z+=Math.sin(departure*Math.PI)*.05;}
   if(n.kind==='accretion'){o.rotation.z+=t*.08*(a%2?1:-1);o.scale.multiplyScalar(1+Math.sin(t*.5+a)*.015);}
  }
  for(const o of this.fragments){const u=o.userData,a=u.a+t*.08;o.position.set(Math.cos(a)*u.r,-3+(u.y+t*.45)%17,Math.sin(a)*u.r);o.rotation.set(t*.2,a,0);o.visible=activation>.1;}return frame;
 }
}
