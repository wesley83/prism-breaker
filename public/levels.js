import {BUNDLED_WORLDS,BUNDLED_FORMATIONS} from './bundled-worlds.js';
export {RULESET_REVISION} from './bundled-worlds.js';
export const WORLDS=BUNDLED_WORLDS;
export const WORLD_COUNT=WORLDS.length,LAST_WORLD=WORLD_COUNT-1;
export const formationCount=index=>WORLDS[index]?.formations.length||0;
export const POWERS={
 wide:{name:'Wide paddle',symbol:'↔',color:'#b5ff6c',duration:18},
 multi:{name:'Multiball',symbol:'●●',color:'#f39aff',duration:0},
 sticky:{name:'Sticky paddle',symbol:'∪',color:'#ffd983',duration:16},
 laser:{name:'Laser paddle',symbol:'↑↑',color:'#ff7b8f',duration:14},
 pierce:{name:'Piercing ball',symbol:'◆',color:'#b5a3ff',duration:12},
 slow:{name:'Slow motion',symbol:'◷',color:'#88dfff',duration:14},
 shield:{name:'Safety shield',symbol:'⌁',color:'#6af6d2',duration:0},
 life:{name:'Extra life',symbol:'♥',color:'#ffb3d2',duration:0}
};
export function rng(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
export function daySeed(day){let h=2166136261;for(const c of day)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
// Keep the release-day challenge identical for players still finishing the old build.
export const dailyWorld=day=>daySeed(day)%(day<'2026-10-15'?8:WORLD_COUNT);
export function makeLevel(index,phase=0){
 if(!Number.isInteger(index)||index<0||index>=WORLD_COUNT)throw new RangeError('Unknown world');
 if(!Number.isInteger(phase)||phase<0||phase>=formationCount(index))throw new RangeError('Unknown formation');
 return structuredClone(BUNDLED_FORMATIONS[index][phase]);
}
