export const WORLDS = [
 {name:'Prism Garden',tag:'Where the light begins',colors:['#b5ff6c','#4de3bc','#ffbd82','#f475a2'],sky:'#092c29',accent:'#b5ff6c',shape:'garden',note:'Aim with the edge of your paddle. Catch falling power-ups.',story:'A sleeping prism wakes. Follow its light above the clouds.',mechanic:'Find your rhythm',root:48},
 {name:'Cloud Carnival',tag:'A little above ordinary',colors:['#f9a8df','#a9bfff','#ffdc99','#98edf1'],sky:'#24203f',accent:'#f9a8df',shape:'cloud',note:'Drifting formations and armored bricks enter the arena.',story:'The carnival lights flicker. A city below needs your spark.',mechanic:'Moving formations',root:53},
 {name:'Electric City',tag:'Light up the night',colors:['#bc86ff','#59e8ff','#ff6cbd','#ffeb8c'],sky:'#170d38',accent:'#be91ff',shape:'city',note:'Hit diamond switches to remove the glowing barriers.',story:'Power returns to the skyline. A hidden passage opens beneath it.',mechanic:'Switches & gates',root:50},
 {name:'Crystal Caverns',tag:'Beautiful chain reactions',colors:['#61e3fb','#a796ff','#fa92da','#73ffc7'],sky:'#101a38',accent:'#69e5ff',shape:'crystal',note:'Star-marked explosive bricks break their neighbors.',story:'The cavern opens in a shower of crystals. Warmth waits beyond.',mechanic:'Explosive clusters',root:55},
 {name:'Ember Foundry',tag:'Forged under pressure',colors:['#ff9961','#ff5579','#ffd881','#db79ba'],sky:'#351414',accent:'#ffa568',shape:'forge',note:'Read the moving barriers. Find the gaps between them.',story:'The forge releases its last ember. The world turns to ice.',mechanic:'Moving barriers',root:45},
 {name:'Frost Observatory',tag:'A different point of view',colors:['#b5ebff','#f1d6ff','#7a9dff','#7bf6eb'],sky:'#11243e',accent:'#b4e9ff',shape:'ice',note:'Paired portals send your ball across the arena.',story:'The telescope finds a signal. An ocean of stars answers.',mechanic:'Portal paths',root:57},
 {name:'Cosmic Reef',tag:'Drift into the extraordinary',colors:['#6fffd3','#f07bff','#8f9aff','#ffe39d'],sky:'#092a36',accent:'#6fffd3',shape:'reef',note:'Portals, moving bricks and explosions work together.',story:'The fragments become a bridge. The last prism is within reach.',mechanic:'Everything connects',root:52},
 {name:'Prism Citadel',tag:'Bring every color home',colors:['#faff94','#ff9ebc','#b19aff','#70efe2'],sky:'#242031',accent:'#edffa0',shape:'citadel',note:'Break three formations to restore the heart of the prism.',story:'Every world shines again. You brought the color home.',mechanic:'Three-stage finale',root:60}
];
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
export function makeLevel(index,phase=0){
 const bricks=[];let id=0;
 for(let row=0;row<6;row++)for(let col=0;col<9;col++){
   let include=true;
   if(index===0)include=!(row<2&&(col===0||col===8))&&!(row===5&&col%2===0);
   if(index===1)include=(row+col)%5!==0;
   if(index===2)include=row>=3||col%2===0;
   if(index===3)include=Math.abs(col-4)+Math.abs(row-2.5)<6;
   if(index===4)include=row%2===0||col%3!==1;
   if(index===5)include=!(row===2&&col%2===1);
   if(index===6)include=(row+col)%4!==0;
   if(index===7)include=phase===0?Math.abs(col-4)<row+1:phase===1?(row+col)%3!==0:Math.abs(col-4)+Math.abs(row-2.5)<5;
   if(!include)continue;
   let kind='normal';
   if(index>=1&&(row+col)%7===0)kind='armor';
   if(index>=3&&(row*9+col)%11===3)kind='explode';
   if(index===2&&(row===3&&(col===2||col===6)))kind='switch';
   if(index===7&&phase===2&&row<3)kind='armor';
   if([2,3,5].includes(index)&&kind==='normal'&&(row===1||row===4)&&col===4)kind='armor';
   const hp=kind==='armor'?2+(index===7&&phase===2?1:0):1;
   bricks.push({id:id++,x:(col-4)*1.93,y:9-row*1.05,w:1.7,h:.72,kind,hp,maxHp:hp,color:WORLDS[index].colors[row%4],baseX:(col-4)*1.93,moving:(index===1||index===6)&&row%2===0,row});
 }
 const barriers=[];
 if(index===2)barriers.push({id:500,x:-4.6,y:.9,w:5.4,h:.5,gate:true},{id:501,x:4.6,y:.9,w:5.4,h:.5,gate:true});
 if(index===4)barriers.push({id:502,x:0,y:1,w:4.3,h:.5,moving:true},{id:503,x:0,y:-2,w:3.3,h:.5,moving:true});
 const portals=index===5||index===6?[{x:-7.8,y:.2},{x:7.8,y:3.4}]:[];
 return {bricks,barriers,portals};
}
