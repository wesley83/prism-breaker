import test from 'node:test';import assert from 'node:assert/strict';
import * as T from '../public/vendor/three.module.min.js';
import {Game} from '../public/engine.js';import {makeLevel} from '../public/levels.js';import {Stage} from '../public/scene.js';
import {brickMark,updateBrickMarker,BRICK_GUIDE,brickMarkerSVG,STAR_PATH,DIAMOND_PATH} from '../public/brick-labels.js';
function stageForMarkers(){const stage=Object.create(Stage.prototype),textures=new Map();stage.dynamic=new T.Group();stage.syncToken=0;stage.brickMarkerTexture=mark=>{if(!textures.has(mark))textures.set(mark,new T.Texture());return textures.get(mark);};return stage;}
test('every generated world and Citadel formation labels its actual brick kind and hit count',()=>{
 const kinds=new Set();for(let level=0;level<8;level++)for(let phase=0;phase<(level===7?3:1);phase++)for(const brick of makeLevel(level,phase).bricks){kinds.add(brick.kind);assert.equal(brickMark(brick),brick.kind==='armor'?String(brick.hp):brick.kind==='explode'?'★':brick.kind==='switch'?'◇':null);}
 assert.deepEqual([...kinds].sort(),['armor','explode','normal','switch']);
});
test('three-hit armor counts down after actual damage, then its rendered marker is removed',()=>{
 const game=new Game();game.start('practice',7);game.phase=2;game.loadLevel();const brick=game.bricks.find(b=>b.kind==='armor'),stage=stageForMarkers(),map=new Map();
 const render=()=>stage.syncMap(map,[brick],b=>{const group=new T.Group();group.userData.brickMarker=stage.makeBrickMarker(b);group.add(group.userData.brickMarker);return group;},(group,b)=>updateBrickMarker(group.userData.brickMarker,b,mark=>stage.brickMarkerTexture(mark)),true);
 for(const count of [3,2,1]){render();const marker=map.get(brick.id).userData.brickMarker;assert.equal(marker.userData.brickMark,String(count));assert.equal(marker.material.map,stage.brickMarkerTexture(String(count)));game.damage(brick);}
 render();assert.equal(brick.hp,0);assert.equal(map.size,0);assert.equal(stage.dynamic.children.length,0);
});
test('damaging one armored brick does not change another brick sharing its original texture',()=>{
 const stage=stageForMarkers(),brick={kind:'armor',hp:2},a=stage.makeBrickMarker(brick),b=stage.makeBrickMarker(brick);assert.notEqual(a.material,b.material);assert.equal(a.material.map,b.material.map);
 brick.hp=1;let lookups=0;const get=mark=>{lookups++;return stage.brickMarkerTexture(mark);};updateBrickMarker(a,brick,get);for(let i=0;i<20;i++)updateBrickMarker(a,brick,get);
 assert.equal(lookups,1);assert.equal(a.userData.brickMark,'1');assert.equal(b.userData.brickMark,'2');assert.notEqual(a.material.map,b.material.map);assert.equal(a.material.fog,false);assert.equal(a.material.toneMapped,false);
});
test('How to play uses the renderer’s star and outlined diamond artwork',()=>{
 assert.equal(brickMarkerSVG(null),'');const star=BRICK_GUIDE.find(b=>b.kind==='explode'),diamond=BRICK_GUIDE.find(b=>b.kind==='switch');
 assert.ok(brickMarkerSVG(star.mark).includes(STAR_PATH));assert.ok(brickMarkerSVG(diamond.mark).includes(DIAMOND_PATH));assert.ok(brickMarkerSVG(diamond.mark).includes('fill="none"'));assert.equal(brickMark({kind:'armor',hp:0}),null);
});
