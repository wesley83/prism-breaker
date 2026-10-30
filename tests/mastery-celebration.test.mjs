import test from 'node:test';
import assert from 'node:assert/strict';
import {readMastery,awardMastery,masteryCelebration,counts} from '../public/mastery.js';
import {ENGAGEMENT} from '../public/engagement-data.js';
import {Sound} from '../public/audio.js';
import {VICTORY_TRACKS,victoryEvents} from '../public/victory-music.js';
import {MasteryCeremony} from '../public/mastery-ceremony.js';
import * as T from '../public/vendor/three.module.min.js';
const ids=Object.keys(ENGAGEMENT.profiles),report=(id=ids[0],extra={})=>({id,seconds:10,score:5000,livesLost:0,peakCombo:99,precision:99,portals:99,chains:99,...extra});
test('a set can be completed across runs and celebrates only newly acquired medals',()=>{
 const p=readMastery(null);let a=awardMastery(p,report(ids[0],{seconds:1000,livesLost:1,peakCombo:0}));assert.deepEqual(a.newMedals,['restored']);assert.equal(masteryCelebration(a).tier,'medal');
 a=awardMastery(p,report());assert.deepEqual(a.newMedals,['swift','flawless','skill']);assert.equal(a.worldCompleted,true);assert.equal(masteryCelebration(a).tier,'world');assert.equal(masteryCelebration(a).medals.length,4);
 a=awardMastery(p,report(ids[0],{seconds:9}));assert.equal(a.newBestTime,true);assert.equal(a.worldCompleted,false);assert.equal(masteryCelebration(a),null);assert.equal(counts(p).medals,4);
});
test('the final medal earns the collection finale; restored worlds alone do not',()=>{
 const p=readMastery(null);for(const id of ids)awardMastery(p,report(id,{seconds:1000,livesLost:1,peakCombo:0,precision:0,portals:0,chains:0}));assert.equal(counts(p).restored,16);assert.equal(counts(p).medals,16);
 for(const id of ids.slice(1))awardMastery(p,report(id));awardMastery(p,report(ids[0],{seconds:1000}));assert.equal(counts(p).medals,63);
 const a=awardMastery(p,report());assert.equal(a.collectionCompleted,true);assert.equal(a.worldCompleted,true);assert.equal(masteryCelebration(a).tier,'collection');assert.equal(a.total,64);
 const loaded=readMastery(p);assert.equal(masteryCelebration(awardMastery(loaded,report())),null);assert.equal(counts(loaded).medals,64);
});
test('new cosmetics accompany the earning run and are not re-announced',()=>{
 const p=readMastery(null);awardMastery(p,report());const a=awardMastery(p,report(ids[1]));assert.ok(a.unlocked.some(c=>c.count===6));assert.deepEqual(awardMastery(p,report(ids[1])).unlocked,[]);assert.equal(masteryCelebration(null),null);
});
test('ceremony resources stay bounded and reduced motion is stationary',()=>{
 const scene=new T.Scene(),c=new MasteryCeremony(scene,new T.Texture(),null),settings={lowEffects:true,reducedMotion:false};const children=c.group.children.length;
 for(let i=0;i<100;i++)for(const tier of ['medal','world','collection']){const frame=c.render(i/10,.45,settings,tier);assert.ok(frame.position.every(Number.isFinite));assert.equal(c.group.children.length,children);assert.equal(c.shards.count,40);}
 c.render(0,.45,{...settings,reducedMotion:true},'collection');const first=c.crest.rotation.toArray();c.render(8,.45,{...settings,reducedMotion:true},'collection');assert.deepEqual(c.crest.rotation.toArray(),first);assert.equal(c.shards.visible,false);
});
test('medal fanfare honors mute/effect volume and the mastery music is separate',()=>{
 const settings={muted:false,effects:.7},s=new Sound(settings),notes=[];s.tone=(...n)=>notes.push(n);s.event({type:'medal',index:3,complete:true});assert.equal(notes.length,6);settings.muted=true;s.event({type:'medal'});assert.equal(notes.length,6);settings.muted=false;settings.effects=0;s.event({type:'medal'});assert.equal(notes.length,6);
 assert.equal(VICTORY_TRACKS.mastery.bpm,132);assert.notDeepEqual(victoryEvents('mastery',0),victoryEvents('daily',0));
});
