import * as T from './vendor/three.module.min.js';
import {WORLDS,rng} from './levels.js';
// A reusable, elapsed-time-driven coronation. No external models or textures.
export class Champion{
 constructor(scene,halo){this.group=new T.Group();scene.add(this.group);this.halo=halo;this.low=null;}
 build(low){
  this.group.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});this.group.clear();this.low=low;const rand=rng(7621),colors=WORLDS.map(w=>w.accent);this.orbits=[];this.gems=[];
  const gold=new T.MeshPhysicalMaterial({color:'#ffe3a0',metalness:.72,roughness:.2,clearcoat:low?0:1,emissive:'#b98523',emissiveIntensity:.2});
  this.trophy=new T.Group();this.trophy.position.y=3.4;this.group.add(this.trophy);
  const add=(g,m,pos,scale=[1,1,1])=>{const mesh=new T.Mesh(g,m);mesh.position.set(...pos);mesh.scale.set(...scale);this.trophy.add(mesh);return mesh;};
  add(new T.CylinderGeometry(2.7,3.5,1,8),gold,[0,-3.5,0]);add(new T.CylinderGeometry(.65,1.1,2.6,8),gold,[0,-1.7,0]);add(new T.CylinderGeometry(2.6,.6,2.4,8,1,true),gold,[0,.4,0]);
  for(const side of [-1,1]){const handle=add(new T.TorusGeometry(1.25,.18,8,40,Math.PI*1.45),gold,[side*2.4,.6,0]);handle.rotation.z=side>0?-Math.PI*.72:Math.PI*.28;}
  this.prism=add(new T.OctahedronGeometry(1.45),new T.MeshPhysicalMaterial({color:'#deffb0',metalness:.2,roughness:.12,clearcoat:1,iridescence:.8,emissive:'#b5ff6c',emissiveIntensity:.6}),[0,2.65,0]);
  const glow=new T.Sprite(new T.SpriteMaterial({map:this.halo,color:'#ffe3a0',transparent:true,opacity:.35,depthWrite:false,blending:T.AdditiveBlending}));glow.scale.setScalar(13);glow.position.y=2;this.trophy.add(glow);
  for(let i=0;i<8;i++){
   const material=new T.MeshBasicMaterial({color:new T.Color(colors[i]).multiplyScalar(2.2)}),ring=new T.Mesh(new T.TorusGeometry(4.6+i*.28,.025,6,64),material);ring.position.y=.4;ring.rotation.set(1.1+i*.13,.2*i,i*.25);this.group.add(ring);this.orbits.push(ring);
   const gem=new T.Mesh(new T.OctahedronGeometry(.32),new T.MeshStandardMaterial({color:colors[i],emissive:colors[i],emissiveIntensity:.65,metalness:.2,roughness:.2}));this.group.add(gem);this.gems.push(gem);
  }
  this.fireworks=[];
  for(let burst=0;burst<(low?4:8);burst++){
   const count=low?28:90,base=new Float32Array(count*3),positions=new Float32Array(count*3);
   for(let i=0;i<count;i++){const z=rand()*2-1,a=rand()*Math.PI*2,r=Math.sqrt(1-z*z),speed=2+rand()*3; base.set([Math.cos(a)*r*speed,Math.sin(a)*r*speed,z*speed],i*3);}
   const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));const dots=new T.Points(geometry,new T.PointsMaterial({color:colors[burst],size:low?.12:.09,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending}));dots.position.set((burst%2?-1:1)*(6+rand()*3),3+rand()*6,-5-rand()*6);this.group.add(dots);this.fireworks.push({dots,base,delay:.7+burst*.7});
  }
  const key=new T.PointLight('#ffe5aa',75,65,1.5);key.position.set(0,7,10);this.group.add(key);const rim=new T.PointLight('#96eaff',60,65,1.5);rim.position.set(-7,4,-3);this.group.add(rim);
 }
 render(seconds,aspect,settings){
  if(this.low!==settings.lowEffects)this.build(settings.lowEffects);const t=settings.reducedMotion?3:seconds,ease=1-Math.pow(1-Math.min(1,t/2),3);
  this.trophy.scale.setScalar(.65+ease*.35);this.trophy.rotation.y=settings.reducedMotion?.3:Math.sin(t*.28)*.18;this.prism.rotation.y=settings.reducedMotion?.3:t*.45;
  for(let i=0;i<8;i++){const a=i*Math.PI/4+t*.2;this.gems[i].position.set(Math.cos(a)*6,4.4+Math.sin(a*2)*1.4,Math.sin(a)*5);this.gems[i].rotation.set(t*.4,i+t*.6,0);this.orbits[i].position.y=3.8;this.orbits[i].rotation.z=i*.25+t*.035*(i%2?1:-1);}
  for(const {dots,base,delay}of this.fireworks){const age=t-delay;dots.visible=!settings.reducedMotion&&age>0&&age<2.4;dots.material.opacity=Math.max(0,1-age/2.4);if(dots.visible){const attr=dots.geometry.attributes.position;for(let i=0;i<base.length;i+=3){attr.array[i]=base[i]*age;attr.array[i+1]=base[i+1]*age-age*age*.65;attr.array[i+2]=base[i+2]*age;}attr.needsUpdate=true;}}
  const z=(aspect<.85?22/aspect:26)+(1-ease)*9,angle=settings.reducedMotion?.15:Math.sin(t*.2)*.18;
  return {position:[Math.sin(angle)*z,5,z*Math.cos(angle)],target:[0,2,0],fov:42,roll:0,fade:0};
 }
}
