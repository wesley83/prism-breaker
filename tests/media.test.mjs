import test from 'node:test';import assert from 'node:assert/strict';
import {TRACKS,musicEvents} from '../public/music.js';import {CINEMATICS,cameraFrame} from '../public/cinematic-score.js';
import {Sound} from '../public/audio.js';
test('muting or setting music volume to zero stops synthesis until audible again',()=>{
 const settings={music:.35,effects:.7,muted:false},sound=new Sound(settings);sound.ctx={state:'running',currentTime:1};let scheduled=0,stopped=0;
 sound.syncGain=()=>{};sound.scheduleStep=()=>scheduled++;sound.stopMusic=()=>stopped++;
 sound.update(true,0);assert.ok(scheduled>0);const before=scheduled,firstStops=stopped;
 settings.muted=true;sound.update(true,0);assert.equal(scheduled,before);assert.equal(stopped,firstStops+1);assert.equal(sound.next,0);
 settings.muted=false;settings.music=0;sound.update(true,0);assert.equal(scheduled,before);
 settings.music=.35;sound.update(true,0);assert.ok(scheduled>before);
});
test('eight musical arrangements differ in melody, rhythm and instrumentation',()=>{assert.equal(TRACKS.length,8);assert.equal(new Set(TRACKS.map(t=>t.title)).size,8);assert.equal(new Set(TRACKS.map(t=>JSON.stringify([t.melody,t.rhythm,t.lead]))).size,8);for(let level=0;level<8;level++)for(let step=0;step<128;step++)for(const event of musicEvents(level,step,true)){assert(Number.isFinite(event.note));assert(event.duration>0&&event.volume>0&&event.volume<.2);assert(Math.abs(event.pan)<=1);assert(event.delay>=0);}});
test('cinematic cameras remain finite at every sampled moment and reset safely',()=>{assert.equal(CINEMATICS.length,8);assert.equal(new Set(CINEMATICS.map(c=>JSON.stringify(c.points))).size,8);for(let level=0;level<8;level++)for(const aspect of [.4,1,2])for(let t=0;t<=CINEMATICS[level].duration+.5;t+=.05){const f=cameraFrame(level,t,aspect);assert([...f.position,...f.target,f.fov,f.roll].every(Number.isFinite));assert(f.position[2]>8);assert(f.fov>=30&&f.fov<=55);assert(f.titleAlpha>=0&&f.titleAlpha<=1);assert(f.fade>=0&&f.fade<=1);}});
test('reduced motion uses a fixed cinematic composition and visible story',()=>{for(let level=0;level<8;level++){assert.deepEqual(cameraFrame(level,0,.5,true),cameraFrame(level,10,.5,true));assert.equal(cameraFrame(level,0,1,true).titleAlpha,1);}});
