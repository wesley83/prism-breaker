import fs from 'node:fs/promises';
import * as T from '../public/vendor/three.module.min.js';
import {Cinematic} from '../public/cinematics.js';
import {Champion} from '../public/champion.js';
import {DailyEnding} from '../public/daily-ending.js';
import {WORLDS} from '../public/levels.js';
const rows=[],pose=o=>JSON.stringify([o.position.toArray(),o.rotation.toArray(),o.scale.toArray()]);
for(const lowEffects of [true,false]){
 const settings={lowEffects,reducedMotion:false},scene=new T.Scene(),halo=new T.Texture(),cinematic=new Cinematic(scene,halo,null),champion=new Champion(scene,halo,null),daily=new DailyEnding(scene,halo,null);
 for(let index=0;index<19;index++){
  const render=(t,aspect=1)=>index<16?cinematic.render(index,t,aspect,settings,WORLDS[index]):index===17?champion.render(t,aspect,settings):daily.render(t,aspect,settings,index===18,8399),group=()=>index<16?cinematic.group:index===17?champion.group:daily.group;
  let samples=0,finite=true;for(const aspect of [.4,1,2])for(let t=0;t<=21;t+=.1){const frame=render(t,aspect);finite&&=[...frame.position,...frame.target,frame.fov,frame.roll,frame.fade].every(Number.isFinite);group().traverse(o=>{finite&&=[...o.position,...o.scale,o.rotation.x,o.rotation.y,o.rotation.z].every(Number.isFinite);});samples++;}
  render(10);const initial=index<16?cinematic.nodes.map(n=>pose(n.mesh)):[],kinds={};render(11);
  if(index<16)for(const [i,n]of cinematic.nodes.entries()){(kinds[n.kind]??={total:0,moving:0}).total++;if(initial[i]!==pose(n.mesh))kinds[n.kind].moving++;}
  const counts=()=>{let objects=0,geometries=new Set();group().traverse(o=>{objects++;if(o.geometry)geometries.add(o.geometry);});return {objects,geometries:geometries.size};},before=counts();
  settings.reducedMotion=true;render(1);const reduced=[];group().traverse(o=>reduced.push(pose(o)));render(15);const reducedLater=[];group().traverse(o=>reducedLater.push(pose(o)));settings.reducedMotion=false;
  const after=counts();rows.push({index,name:index<16?WORLDS[index].name:index===16?'Daily completion':index===17?'Adventure record':'Daily record',lowEffects,samples,finite,lateMotion:kinds,reducedStable:JSON.stringify(reduced)===JSON.stringify(reducedLater),resourcesStable:JSON.stringify(before)===JSON.stringify(after),resources:after});
 }
}
await fs.writeFile('audit/2026-10-17-cutscene-motion-after.json',JSON.stringify({at:new Date().toISOString(),scope:'Renderer-object and camera observations, without a WebGL context or device certification',rows},null,2));
console.log(JSON.stringify({cases:rows.length,issues:rows.filter(r=>!r.finite||!r.reducedStable||!r.resourcesStable),reported:rows.filter(r=>[12,13].includes(r.index))}));
