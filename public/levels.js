import {BUNDLED_FORMATIONS} from './bundled-worlds.js';
export const WORLDS = [
 {name:'Prism Garden',tag:'Where the light begins',colors:['#b5ff6c','#4de3bc','#ffbd82','#f475a2'],sky:'#092c29',accent:'#b5ff6c',shape:'garden',note:'Aim with the edge of your paddle. Catch falling power-ups.',story:'A sleeping prism wakes. Follow its light above the clouds.',mechanic:'Find your rhythm',root:48},
 {name:'Cloud Carnival',tag:'A little above ordinary',colors:['#f9a8df','#a9bfff','#ffdc99','#98edf1'],sky:'#24203f',accent:'#f9a8df',shape:'cloud',note:'Drifting formations and armored bricks enter the arena.',story:'The carnival lights flicker. A city below needs your spark.',mechanic:'Moving formations',root:53},
 {name:'Electric City',tag:'Light up the night',colors:['#bc86ff','#59e8ff','#ff6cbd','#ffeb8c'],sky:'#170d38',accent:'#be91ff',shape:'city',note:'Hit diamond switches to remove the glowing barriers.',story:'Power returns to the skyline. A hidden passage opens beneath it.',mechanic:'Switches & gates',root:50},
 {name:'Crystal Caverns',tag:'Beautiful chain reactions',colors:['#61e3fb','#a796ff','#fa92da','#73ffc7'],sky:'#101a38',accent:'#69e5ff',shape:'crystal',note:'Star-marked explosive bricks break their neighbors.',story:'The cavern opens in a shower of crystals. Warmth waits beyond.',mechanic:'Explosive clusters',root:55},
 {name:'Ember Foundry',tag:'Forged under pressure',colors:['#ff9961','#ff5579','#ffd881','#db79ba'],sky:'#351414',accent:'#ffa568',shape:'forge',note:'Read the moving barriers. Find the gaps between them.',story:'The forge releases its last ember. The world turns to ice.',mechanic:'Moving barriers',root:45},
 {name:'Frost Observatory',tag:'A different point of view',colors:['#b5ebff','#f1d6ff','#7a9dff','#7bf6eb'],sky:'#11243e',accent:'#b4e9ff',shape:'ice',note:'Paired portals send your ball across the arena.',story:'The telescope finds a signal. An ocean of stars answers.',mechanic:'Portal paths',root:57},
 {name:'Cosmic Reef',tag:'Drift into the extraordinary',colors:['#6fffd3','#f07bff','#8f9aff','#ffe39d'],sky:'#092a36',accent:'#6fffd3',shape:'reef',note:'Portals, moving bricks and explosions work together.',story:'A river of stars carries the fragments to the citadel.',mechanic:'Everything connects',root:52},
 {name:'Prism Citadel',tag:'Beyond the first horizon',colors:['#faff94','#ff9ebc','#b19aff','#70efe2'],sky:'#242031',accent:'#edffa0',shape:'citadel',note:'Clear three formations to open the passage beyond the prism.',story:'The prism opens. Eight forgotten worlds answer its call.',mechanic:'Three-stage gateway',root:60},
 {name:'Sunken Archive',tag:'Stories beneath the surface',colors:['#5ce6d0','#62bdf5','#d6b889','#b1f9e6'],sky:'#061f2b',accent:'#71eadb',shape:'archive',note:'Open the diamond gates, then follow the portals into the archive.',story:'Lost constellations rise from the deep. Their light points north.',mechanic:'Floodgates & portals',root:46},
 {name:'Aurora Passage',tag:'Follow the living sky',colors:['#97ffa1','#7bdef9','#cf9aff','#ffc4e0'],sky:'#0c2035',accent:'#a7ffc5',shape:'aurora',note:'Drifting armored ribbons leave narrow routes through the sky.',story:'The aurora folds into a bridge. A forest of turning gears awaits.',mechanic:'Armored ribbons',root:59},
 {name:'Clockwork Canopy',tag:'A forest keeping time',colors:['#f3cd7a','#97dcb2','#ec9969','#86bfe1'],sky:'#162725',accent:'#f0d088',shape:'clockwork',note:'Time the moving barriers. Explosive stars open the canopy.',story:'A thousand mechanisms turn as one. Sand begins to shine.',mechanic:'Synchronized barriers',root:51},
 {name:'Mirage Dunes',tag:'Nothing stands still',colors:['#ffc085','#e89dcc','#c3a0ff','#ffe5a3'],sky:'#342035',accent:'#ffd09b',shape:'dunes',note:'Portals cross the dunes. Use explosion chains to break the armored ridges.',story:'The mirage becomes a doorway. Thunder gathers on the other side.',mechanic:'Portal chain reactions',root:49},
 {name:'Thunder Spire',tag:'Catch the storm',colors:['#b5acff','#70daff','#ffe891','#ff98bc'],sky:'#161d38',accent:'#b8caff',shape:'storm',note:'Break the diamond switches to release the storm gates.',story:'The storm splits. A quiet moon rises above the harbor.',mechanic:'Storm gates & armor',root:44},
 {name:'Lunar Harbor',tag:'A moment beyond gravity',colors:['#c9eaff','#e1c4ff','#82e3df','#d0d5ff'],sky:'#101b32',accent:'#d0e8ff',shape:'harbor',note:'Bounce through paired portals and moving dock formations.',story:'The last ship leaves its mooring. Beyond it, a star falls inward.',mechanic:'Moving docks & portals',root:56},
 {name:'Event Horizon',tag:'Through the impossible',colors:['#b393ff','#ff91d7','#ffba7b','#93e8ff'],sky:'#120d27',accent:'#c6a2ff',shape:'horizon',note:'Read the moving barrier and use explosions to reach the armored core.',story:'You cross the darkness. On the far side, every color is waiting.',mechanic:'The collapsing core',root:43},
 {name:'Dawn Nexus',tag:'Let every world shine',colors:['#fff4ac','#ffaec6','#a3c9ff','#96ffe0'],sky:'#192634',accent:'#fff0ac',shape:'nexus',note:'Clear three final formations. Restore all sixteen worlds.',story:'Sixteen worlds. One unbroken light. You brought the dawn.',mechanic:'Three-stage grand finale',root:60}
];
export const WORLD_COUNT=WORLDS.length,LAST_WORLD=WORLD_COUNT-1;
export const formationCount=index=>index===7||index===LAST_WORLD?3:1;
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
