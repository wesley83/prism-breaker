import * as T from './vendor/three.module.min.js';
// One reusable scene: fixed instance counts, elapsed-time choreography, no timers.
export class MasteryCeremony{
 constructor(scene,halo,environment){
  this.group=new T.Group();scene.add(this.group);this.group.visible=false;
  const gold=new T.MeshStandardMaterial({color:0xffdb87,metalness:.8,roughness:.22,envMap:environment,emissive:0x926018,emissiveIntensity:.28});
  this.crest=new T.Group();this.group.add(this.crest);this.medals=[];
  const disc=new T.CylinderGeometry(1.7,1.7,.35,12),gem=new T.OctahedronGeometry(.85),ring=new T.TorusGeometry(1.52,.055,6,48);
  for(const [i,color]of [0xb6ff72,0x7be8ff,0xd4adff,0xffc77c].entries()){
   const medal=new T.Group(),body=new T.Mesh(disc,gold);body.rotation.x=Math.PI/2;medal.add(body);
   const face=new T.Mesh(gem,new T.MeshStandardMaterial({color,metalness:.3,roughness:.15,emissive:color,emissiveIntensity:.4,envMap:environment}));face.position.z=.6;medal.add(face);
   const rim=new T.Mesh(ring,new T.MeshBasicMaterial({color:0xffefbb}));rim.position.z=.3;medal.add(rim);this.crest.add(medal);this.medals.push(medal);
  }
  this.prism=new T.Mesh(new T.OctahedronGeometry(1.9),new T.MeshStandardMaterial({color:0xedffbf,metalness:.5,roughness:.12,emissive:0xbaff76,emissiveIntensity:.45,envMap:environment}));this.crest.add(this.prism);
  const crown=new T.Shape();crown.moveTo(-2,0);for(const [x,y]of [[-2.6,2.4],[-1,1.3],[0,3],[1,1.3],[2.6,2.4],[2,0],[-2,0]])crown.lineTo(x,y);
  this.crown=new T.Mesh(new T.ExtrudeGeometry(crown,{depth:.35,bevelEnabled:true,bevelSize:.1,bevelThickness:.1,bevelSegments:1,steps:1}),gold);this.crown.position.set(0,3,-.3);this.crest.add(this.crown);
  this.halo=new T.Sprite(new T.SpriteMaterial({map:halo,color:0xffd778,transparent:true,opacity:.22,depthWrite:false,blending:T.AdditiveBlending}));this.halo.scale.set(17,17,1);this.halo.position.z=-1;this.crest.add(this.halo);
  this.rings=[];const orbit=new T.TorusGeometry(6,.025,6,80);
  for(let i=0;i<3;i++){const mesh=new T.Mesh(orbit,new T.MeshBasicMaterial({color:i===1?0x91e9cf:0xffda83,transparent:true,opacity:.35}));this.crest.add(mesh);this.rings.push(mesh);}
  this.shards=new T.InstancedMesh(new T.OctahedronGeometry(.12),new T.MeshBasicMaterial({color:0xffe9b2}),128);this.shards.instanceMatrix.setUsage(T.DynamicDrawUsage);this.shards.frustumCulled=false;this.group.add(this.shards);this.matrix=new T.Object3D();
 }
 render(elapsed,aspect,settings,tier='medal',kind='restored'){
  const reduced=settings.reducedMotion,t=reduced?7:Math.min(elapsed,10),settle=Math.min(1,t/1.1),ease=1-Math.pow(1-settle,3),complete=tier!=='medal',count=settings.lowEffects?40:128;
  this.group.visible=true;this.crest.position.set(0,4,0);this.crest.scale.setScalar(reduced?1:.25+.75*ease);
  this.crest.rotation.y=reduced?0:Math.sin(t*.65)*.16;this.prism.rotation.set(.25,reduced?.35:t*.45,.15);this.prism.visible=tier==='collection';this.crown.visible=tier==='collection';
  const color={restored:0xb6ff72,swift:0x7be8ff,flawless:0xd4adff,skill:0xffc77c}[kind]||0xb6ff72;this.medals[0].children[1].material.color.set(complete?0xb6ff72:color);this.medals[0].children[1].material.emissive.set(complete?0xb6ff72:color);
  for(let i=0;i<4;i++){const m=this.medals[i];m.visible=complete||i===0;const a=i*Math.PI/2+Math.PI/4;m.position.set(complete?Math.cos(a)*3.1:0,complete?Math.sin(a)*2.2:0,0);m.rotation.y=reduced?0:(1-ease)*Math.PI*2+Math.sin(t*.8+i)*.12;m.scale.setScalar(complete?.85:1.7);}
  this.rings.forEach((m,i)=>{m.rotation.set(.5+i*.65,.2+i*.4,(reduced?0:t*.12)*(i%2?-1:1));m.scale.setScalar(tier==='collection'?1.15:1);});
  this.shards.count=count;for(let i=0;i<count;i++){const a=i*2.399963,r=5+(i%13)*.5,flight=reduced?.6:Math.min(1,Math.max(0,(t-.7)/3));this.matrix.position.set(Math.cos(a)*r*flight,4+Math.sin(a)*r*flight-(reduced?0:Math.max(0,t-2)*.35),-2+(i%7)*.35);this.matrix.rotation.set(a,t+i,a);this.matrix.scale.setScalar((i%3+1)*.45*(reduced?1:Math.min(1,t)));this.matrix.updateMatrix();this.shards.setMatrixAt(i,this.matrix.matrix);}this.shards.instanceMatrix.needsUpdate=true;this.shards.visible=!reduced;
  return {position:[0,3,Math.max(30,15/aspect)],target:[0,1,0],fov:42,roll:0,fade:0};
 }
}
