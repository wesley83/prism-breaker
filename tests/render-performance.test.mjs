import test from 'node:test';import assert from 'node:assert/strict';
import * as T from '../public/vendor/three.module.min.js';
import {BrickBatch,BRICK_CAPACITY} from '../public/brick-batch.js';
import {crystalGeometry,crystalEdges} from '../public/crystal-bricks.js';
import {ParticleBatch,PARTICLE_CAPACITY,LOW_PARTICLE_CAPACITY} from '../public/particle-batch.js';
import {SceneryBatch} from '../public/scenery-batch.js';
import {RenderClock,RenderBudget} from '../public/render-budget.js';
import {Stage} from '../public/scene.js';
import {Game} from '../public/engine.js';import {WORLDS,makeLevel,formationCount,rng} from '../public/levels.js';
const resources=()=>({body:crystalGeometry(),edges:crystalEdges(),bodyMaterial:new T.MeshPhysicalMaterial({vertexColors:true}),lowBodyMaterial:new T.MeshStandardMaterial({vertexColors:true}),edgeMaterial:new T.LineBasicMaterial()});
const batch=()=>new BrickBatch(resources(),{atlas:new T.Texture()}),close=(a,b)=>assert.ok(Math.abs(a-b)<.00001,`${a} differs from ${b}`);
test('batched rendering retains every live brick identity and position across all official formations',()=>{
 const b=batch(),matrix=new T.Matrix4();for(let world=0;world<WORLDS.length;world++)for(let phase=0;phase<formationCount(world);phase++){
  const {bricks}=makeLevel(world,phase);b.sync(bricks);assert.equal(b.records.size,bricks.length);
  for(const brick of bricks){const record=b.records.get(brick.id);b.body.getMatrixAt(record.slot,matrix);close(matrix.elements[12],brick.x);close(matrix.elements[13],brick.y);close(matrix.elements[0],brick.w);close(matrix.elements[5],brick.h);}
 }
});
test('actual armor impacts change only that brick count/cracks, then remove its GPU slot',()=>{
 const game=new Game();game.start('practice',7);game.phase=2;game.loadLevel();const b=batch(),brick=game.bricks.find(b=>b.kind==='armor'),other=game.bricks.find(b=>b.id!==brick.id);b.sync(game.bricks);
 const slot=b.records.get(brick.id).slot,otherSlot=b.records.get(other.id).slot,otherRect=Array.from(b.markers.geometry.getAttribute('atlasRect').array.slice(otherSlot*4,otherSlot*4+4));let previous=null;
 for(const hp of [3,2,1]){b.sync(game.bricks);assert.equal(brick.hp,hp);const rect=Array.from(b.markers.geometry.getAttribute('atlasRect').array.slice(slot*4,slot*4+4));if(previous)assert.notDeepEqual(rect,previous);previous=rect;
  const matrix=new T.Matrix4();b.cracks.getMatrixAt(slot,matrix);assert.equal(matrix.elements[0]===0,hp===3);assert.deepEqual(Array.from(b.markers.geometry.getAttribute('atlasRect').array.slice(otherSlot*4,otherSlot*4+4)),otherRect);game.damage(brick);
 }
 b.sync(game.bricks);assert.equal(b.records.has(brick.id),false);const matrix=new T.Matrix4();b.body.getMatrixAt(slot,matrix);assert.equal(matrix.elements[0],0);
});
test('full render capacity can replace IDs in-place and clear without leaving stale instances',()=>{
 const b=batch(),template=makeLevel(0).bricks[0],bricks=Array.from({length:BRICK_CAPACITY},(_,id)=>({...template,id}));b.sync(bricks);
 bricks.splice(0,1,{...template,id:999});b.sync(bricks);assert.equal(b.records.size,80);assert.equal(b.records.has(0),false);assert.ok(b.records.has(999));
 b.clear();assert.equal(b.body.count,0);assert.equal(b.markers.count,0);assert.equal(b.cracks.count,0);assert.equal(b.edges.geometry.instanceCount,0);assert.equal(b.free.length,80);
});
test('stationary bricks do not re-upload matrices; movement, damage and style changes still do',()=>{
 const b=batch(),bricks=makeLevel(0).bricks;b.sync(bricks);const version=b.body.instanceMatrix.version;b.warm(new T.Group());b.sync(bricks);assert.equal(b.markers.count,0);assert.equal(b.cracks.count,0);assert.equal(b.body.instanceMatrix.version,version);
 bricks[0].x+=.25;b.sync(bricks);assert.ok(b.body.instanceMatrix.version>version);b.sync(bricks,false,true);assert.equal(b.body.material,b.simple);assert.equal(b.body.material.clearcoat,undefined);
 b.sync(bricks,true,true);assert.equal(b.face.visible,true);assert.equal(b.edges.visible,false);b.sync(bricks,false,false);assert.equal(b.face.visible,false);assert.equal(b.body.material,b.physical);
});
test('particle storms use a bounded reusable pool and the low-effects budget takes effect immediately',()=>{
 const b=new ParticleBatch(new T.OctahedronGeometry(1)),random=rng(9);b.warm();b.update(0);assert.equal(b.mesh.count,0);assert.equal(b.free.length,PARTICLE_CAPACITY);b.emit(0,0,'#ffffff',999,random);assert.equal(b.count,PARTICLE_CAPACITY);assert.equal(b.free.length,0);b.update(1/60);assert.equal(b.mesh.count,PARTICLE_CAPACITY);
 b.setLow(true);assert.equal(b.count,LOW_PARTICLE_CAPACITY);b.emit(0,0,'#ff0000',999,random);assert.equal(b.count,LOW_PARTICLE_CAPACITY);b.update(1);assert.equal(b.count,0);assert.equal(b.free.length,PARTICLE_CAPACITY);
 b.setLow(false);b.emit(0,0,'#ff0000',192,random);assert.equal(b.count,192);b.clear();assert.equal(b.mesh.count,0);assert.equal(b.free.length,192);
});
test('every gameplay theme batches scenery into at most two draws and freezes reduced motion',()=>{
 const geometry={box:new T.BoxGeometry(1,1,1),sphere:new T.SphereGeometry(1),octa:new T.OctahedronGeometry(1)};
 for(let i=0;i<WORLDS.length;i++){const scenery=new SceneryBatch(i,WORLDS[i],geometry);assert.equal(scenery.records.length,46);assert.ok(scenery.batches.length<=2);scenery.update(.016,1,true);const versions=scenery.batches.map(m=>m.instanceMatrix.version);scenery.update(.016,2,true);assert.deepEqual(scenery.batches.map(m=>m.instanceMatrix.version),versions);scenery.dispose();}
});
test('60 FPS scheduling preserves refresh fractions on 60/90/120/144 Hz displays',()=>{
 for(const refresh of [60,90,120,144]){const clock=new RenderClock(),budget=new RenderBudget();let paints=0;for(let i=0;i<refresh*10;i++)if(clock.due(i*1000/refresh,60)){paints++;budget.sample(clock.elapsed,3);}assert.ok(paints>=599&&paints<=601,`${refresh} Hz produced ${paints} frames`);assert.equal(budget.scale,1,`${refresh} Hz unnecessarily reduced resolution`);}
 const clock=new RenderClock();assert.equal(clock.due(0,30),true);assert.equal(clock.due(16.66,30),false);assert.equal(clock.due(16.66,60),true);clock.reset();assert.equal(clock.due(100000,60),true);
});
test('adaptive resolution responds to sustained load, recovers slowly and ignores suspended play',()=>{
 const budget=new RenderBudget();for(let i=0;i<90;i++)budget.sample(33.333,12);assert.ok(budget.scale<1);const reduced=budget.scale;
 for(let i=0;i<120;i++)budget.sample(200,30,false);assert.equal(budget.scale,reduced);for(let i=0;i<600;i++)budget.sample(16.667,3);assert.ok(budget.scale>reduced&&budget.scale<=1);
 for(let i=0;i<1000;i++)budget.sample(33.333,12);assert.ok(budget.scale>=.6);assert.ok(budget.scale<=.61);budget.sample(60000,1);assert.equal(budget.frames,0);
});
test('resolution changes resize the scene and cinematic buffers together without changing CSS arena geometry',()=>{
 const previous=globalThis.devicePixelRatio;globalThis.devicePixelRatio=2;
 try{
  let ratio=1,sizeCalls=0,effectRatio=0;
  const stage=Object.create(Stage.prototype);Object.assign(stage,{settings:{lowEffects:false},budget:new RenderBudget(),canvas:{getBoundingClientRect:()=>({width:400,height:600})},camera:new T.PerspectiveCamera(),renderer:{getPixelRatio:()=>ratio,setPixelRatio:value=>ratio=value,setSize:()=>sizeCalls++},composer:{setPixelRatio:value=>effectRatio=value,setSize:()=>{}}});
  stage.resize();assert.equal(ratio,1.25);assert.equal(effectRatio,1);assert.equal(stage.camera.aspect,2/3);stage.resize();assert.equal(sizeCalls,1);
  stage.budget.scale=.64;stage.resize();assert.equal(ratio,.8);assert.equal(effectRatio,.8);assert.equal(stage.width,400);assert.equal(stage.height,600);assert.equal(stage.camera.aspect,2/3);
  stage.settings.lowEffects=true;stage.resize();assert.equal(ratio,.65);assert.equal(effectRatio,.65);
 }finally{if(previous===undefined)delete globalThis.devicePixelRatio;else globalThis.devicePixelRatio=previous;}
});
