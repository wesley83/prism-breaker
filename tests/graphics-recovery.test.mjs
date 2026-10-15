import test from 'node:test';
import assert from 'node:assert/strict';
import {setupGraphicsRecovery} from '../public/graphics-recovery.js';
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
test('R09 actual context-loss event blocks simulation synchronously and recovery never auto-resumes play',async()=>{
 const canvas=new EventTarget(),states=[];let playing=true,restores=0;
 const guard=setupGraphicsRecovery(canvas,{pause:()=>playing=false,restore:async()=>restores++,onStatus:s=>states.push(s)});
 const loss=new Event('webglcontextlost',{cancelable:true});canvas.dispatchEvent(loss);assert.equal(loss.defaultPrevented,true);assert.equal(guard.blocked,true);assert.equal(playing,false);
 canvas.dispatchEvent(new Event('webglcontextrestored'));await flush();assert.equal(guard.blocked,false);assert.equal(playing,false);assert.equal(restores,1);assert.deepEqual(states,['lost','recovering','ready']);guard.dispose();
});
test('R09 failed restoration stays blocked and a later restoration can recover',async()=>{
 const canvas=new EventTarget(),states=[];let fail=true;const guard=setupGraphicsRecovery(canvas,{restore:async()=>{if(fail)throw Error('compile failed');},onStatus:s=>states.push(s)});
 canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true}));canvas.dispatchEvent(new Event('webglcontextrestored'));await flush();assert.equal(guard.blocked,true);assert.equal(states.at(-1),'failed');
 fail=false;canvas.dispatchEvent(new Event('webglcontextrestored'));await flush();assert.equal(guard.blocked,false);guard.dispose();
});
test('R09 a late restore cannot unfreeze a newer context loss or a disposed view',async()=>{
 const canvas=new EventTarget(),waiting=[];const guard=setupGraphicsRecovery(canvas,{restore:()=>new Promise(resolve=>waiting.push(resolve))});
 canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true}));canvas.dispatchEvent(new Event('webglcontextrestored'));
 canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true}));waiting.shift()();await flush();assert.equal(guard.blocked,true);
 canvas.dispatchEvent(new Event('webglcontextrestored'));guard.dispose();waiting.shift()();await flush();assert.equal(guard.blocked,true);
});
