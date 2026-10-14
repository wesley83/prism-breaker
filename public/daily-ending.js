import * as T from './vendor/three.module.min.js';
import {rng} from './levels.js';
import {dailyFrame,DAILY_DURATION,DAILY_RECORD_DURATION} from './daily-score.js';
// Daily completion: a 24-hour orbital clock. Daily record: a solar crown.
export class DailyEnding{
 constructor(scene,halo,environment){this.environment=environment;this.group=new T.Group();scene.add(this.group);this.halo=halo;this.key='';}
 clear(){const geometries=new Set(),materials=new Set();this.group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});this.group.clear();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();}
 build(record,low,seed){
  this.clear();this.crown=null;this.key=[record,low,seed].join(':');const rand=rng(seed+8101),color=record?'#ffe096':'#7cecff',secondary=record?'#d1fcff':'#b59fff';this.ticks=[];this.orbits=[];this.sparks=[];
  this.clock=new T.Group();this.clock.position.y=4;this.group.add(this.clock);
  const metal=new T.MeshStandardMaterial({color:'#173e50',metalness:.8,roughness:.2,envMap:this.environment,envMapIntensity:1}),bright=new T.MeshBasicMaterial({color:new T.Color(color).multiplyScalar(2)});
  const mesh=(g,m,pos,parent=this.clock)=>{const o=new T.Mesh(g,m);o.position.set(...pos);parent.add(o);return o;};
  const disc=mesh(new T.CylinderGeometry(4.05,4.05,.32,64),metal,[0,0,-.6]);disc.rotation.x=Math.PI/2;
  mesh(new T.TorusGeometry(4.2,.09,8,80),bright,[0,0,0]);mesh(new T.TorusGeometry(3.4,.025,6,80),new T.MeshBasicMaterial({color:secondary}),[0,0,.03]);
  const coreMaterial=new T.MeshPhysicalMaterial({color,metalness:.25,roughness:.12,clearcoat:low?0:1,envMap:this.environment,envMapIntensity:.8,iridescence:.65,emissive:color,emissiveIntensity:.35});
  this.prism=mesh(new T.IcosahedronGeometry(record?1.55:1.15,0),coreMaterial,[0,0,.6]);
  for(let i=0;i<24;i++){const a=i*Math.PI/12,mat=new T.MeshStandardMaterial({color:'#365465',emissive:color,emissiveIntensity:.03,metalness:.4,roughness:.22}),tick=mesh(record?new T.OctahedronGeometry(.32):new T.BoxGeometry(.14,i%6===0?.6:.35,.18),mat,[Math.sin(a)*3.8,Math.cos(a)*3.8,.12]);tick.rotation.z=-a;tick.userData.angle=a;this.ticks.push(tick);}
  this.hand=new T.Group();this.clock.add(this.hand);const pointer=mesh(new T.BoxGeometry(.075,2.8,.1),bright,[0,1.4,.2],this.hand);pointer.userData.pointer=true;
  for(let i=0;i<(record?4:2);i++){const orbit=mesh(new T.TorusGeometry(5+i*.6,.025,6,80),new T.MeshBasicMaterial({color:i%2?secondary:color,transparent:true,opacity:.65}),[0,0,-1]);orbit.rotation.set(.35+i*.42,i*.25,0);this.orbits.push(orbit);}
  const halo=new T.Sprite(new T.SpriteMaterial({map:this.halo,color,transparent:true,opacity:record?.28:.2,depthWrite:false,blending:T.AdditiveBlending}));halo.scale.setScalar(record?15:12);this.clock.add(halo);
  if(record){this.crown=new T.Group();this.crown.position.set(0,2.5,.7);this.clock.add(this.crown);const gold=new T.MeshPhysicalMaterial({color:'#ffe096',metalness:.65,roughness:.22,emissive:'#bc8b29',emissiveIntensity:.2});
   const band=mesh(new T.TorusGeometry(1.35,.17,8,48),gold,[0,0,0],this.crown);band.rotation.x=Math.PI/2;
   for(let i=0;i<7;i++){const a=i*Math.PI*2/7,spike=mesh(new T.ConeGeometry(.24,1.25,4),gold,[Math.cos(a)*1.35,.5,Math.sin(a)*1.35],this.crown);spike.rotation.z=-Math.cos(a)*.17;mesh(new T.OctahedronGeometry(.15),bright,[Math.cos(a)*1.35,1.12,Math.sin(a)*1.35],this.crown);}
  }
  // Layered clockwork drum, calendar orbit and a constellation backdrop.
  for(let i=0;i<5;i++){const drum=mesh(new T.TorusGeometry(4.35+i*.12,.1,8,80),metal,[0,0,-.8-i*.3]);this.orbits.push(drum);}
  for(let i=0;i<12;i++){const a=i*Math.PI/6,axis=mesh(new T.BoxGeometry(.07,2,.08),bright,[Math.sin(a)*5.9,Math.cos(a)*5.9,-1.6]);axis.rotation.z=-a;}
  this.solarRays=[];
  for(let i=0;i<(record?24:12);i++){const a=i*Math.PI*2/(record?24:12),ray=mesh(new T.OctahedronGeometry(1),coreMaterial,[Math.sin(a)*7,Math.cos(a)*7,-2]);ray.scale.set(.12,record?1.25:.55,.12);ray.rotation.z=-a;this.solarRays.push(ray);}
  const stage=mesh(new T.CylinderGeometry(7,8,.55,64),metal,[0,-7,0]);stage.rotation.x=.2;
  const count=low?100:record?600:350,positions=[];for(let i=0;i<count;i++)positions.push((rand()-.5)*45,(rand()-.2)*28,-4-rand()*24);const dust=new T.BufferGeometry();dust.setAttribute('position',new T.Float32BufferAttribute(positions,3));this.stars=new T.Points(dust,new T.PointsMaterial({color:secondary,size:record?.08:.05,transparent:true,opacity:.7,depthWrite:false}));this.group.add(this.stars);
  if(record)for(let i=0;i<(low?24:64);i++){const spark=new T.Sprite(new T.SpriteMaterial({map:this.halo,color:i%2?color:secondary,transparent:true,opacity:.5,depthWrite:false,blending:T.AdditiveBlending}));spark.scale.setScalar(.18+rand()*.2);spark.userData={angle:rand()*Math.PI*2,speed:1+rand()*2,phase:rand()*3};this.group.add(spark);this.sparks.push(spark);}
  const key=new T.PointLight(color,65,60,1.5);key.position.set(0,7,9);this.group.add(key);const rim=new T.PointLight(secondary,40,65,1.5);rim.position.set(-8,5,-3);this.group.add(rim);
 }
 render(seconds,aspect,settings,record=false,seed=8399){
  if(this.key!==[record,settings.lowEffects,seed].join(':'))this.build(record,settings.lowEffects,seed);
  const duration=record?DAILY_RECORD_DURATION:DAILY_DURATION,t=settings.reducedMotion?duration*.7:seconds,p=settings.reducedMotion?1:Math.min(1,t/duration),unfold=1-Math.pow(1-Math.min(1,t/3),3);
  this.clock.rotation.y=settings.reducedMotion?.08:Math.sin(t*.17)*.18;this.clock.scale.setScalar(.65+unfold*.35);this.prism.rotation.set(t*.1,t*.35,0);this.hand.rotation.z=-Math.PI*2*p;
  this.ticks.forEach((tick,i)=>{const lit=i/24<=p;tick.material.emissiveIntensity=lit?(record?1.25:.65):.03;tick.material.color.set(lit?(record?'#ffe096':'#93eaff'):'#365465');if(record)tick.position.z=.12+(lit?Math.sin(t*.6+i)*.15:0);});
  this.orbits.forEach((o,i)=>{o.rotation.z=t*.08*(i%2?1:-1);});if(this.crown){this.crown.rotation.y=t*.3;this.crown.position.y=1.8+unfold*.8;}
  this.solarRays.forEach((ray,i)=>{ray.scale.y=(record?1.25:.55)*(.1+.9*Math.max(0,Math.min(1,(p-.25-i*.005)/.35)));});
  this.stars.rotation.z=settings.reducedMotion?0:t*.008;
  for(const spark of this.sparks){spark.visible=!settings.reducedMotion;const {angle,speed,phase}=spark.userData,age=(t+phase)%3,r=3.8+age*speed;spark.position.set(Math.cos(angle)*r,4+Math.sin(angle)*r,1-age*.7);spark.material.opacity=(1-age/3)*.5;}
  return dailyFrame(seconds,aspect,settings.reducedMotion,record);
 }
}
