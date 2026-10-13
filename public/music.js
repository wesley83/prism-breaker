export const TRACKS=[
 {title:'Glasswing',style:'Bright plucked synths',bpm:106,meter:16,root:48,lead:'pluck',bass:'soft',pad:'pad',chords:[0,9,5,7],minor:false,melody:[12,16,19,24,19,16,14,19,12,null,16,19,21,19,16,14,12,19,24,28,26,24,19,16,17,21,24,21,19,16,14,7],rhythm:'garden',swing:0},
 {title:'Cloud Waltz',style:'Carousel bells in three',bpm:126,meter:12,root:53,lead:'bell',bass:'soft',pad:'pad',chords:[0,5,9,7],minor:false,melody:[12,16,19,24,null,19,16,14,12,null,7,11,12,17,21,24,21,17,16,14,12,null,11,7],rhythm:'waltz',swing:.06},
 {title:'Afterimage Avenue',style:'Driving neon electro',bpm:128,meter:16,root:50,lead:'chip',bass:'acid',pad:'pad',chords:[0,8,3,10],minor:true,melody:[0,12,7,15,12,19,7,22,0,12,10,15,12,19,22,19,3,15,10,19,15,22,10,27,3,15,12,19,17,15,10,7],rhythm:'electro',swing:0},
 {title:'Beneath the Glass',style:'Echoing crystal bells',bpm:84,meter:16,root:55,lead:'glass',bass:'soft',pad:'pad',chords:[0,5,8,3],minor:true,melody:[12,null,19,null,24,22,null,19,15,null,10,null,19,null,15,14,12,null,15,19,null,24,null,27,26,null,22,null,19,15,null,7],rhythm:'cavern',swing:.035},
 {title:'Molten Engine',style:'Industrial pulse and metal',bpm:112,meter:16,root:45,lead:'metal',bass:'acid',pad:'pad',chords:[0,5,1,7],minor:true,melody:[0,7,null,12,0,null,10,7,0,7,12,15,14,12,7,null,5,12,null,17,5,null,15,12,1,8,13,16,13,8,7,null],rhythm:'forge',swing:0},
 {title:'Northern Lens',style:'Slow celestial ambience',bpm:72,meter:16,root:57,lead:'glass',bass:'soft',pad:'air',chords:[0,7,2,5],minor:false,melody:[24,null,null,19,null,16,null,null,26,null,null,24,null,19,null,null,28,null,26,null,24,null,null,19,21,null,null,17,null,16,null,12],rhythm:'ice',swing:0},
 {title:'Tidal Orbit',style:'Shuffled cosmic marimba',bpm:96,meter:16,root:52,lead:'marimba',bass:'soft',pad:'air',chords:[0,5,10,7],minor:true,melody:[12,null,19,15,24,null,22,19,17,15,null,19,22,null,24,26,12,15,null,19,24,27,null,26,22,19,17,null,15,14,10,7],rhythm:'reef',swing:.16},
 {title:'Heart of the Prism',style:'Layered cinematic finale',bpm:118,meter:16,root:60,lead:'anthem',bass:'soft',pad:'choir',chords:[0,8,5,7],minor:true,melody:[12,12,19,24,22,19,15,19,12,null,15,19,24,27,26,24,20,20,27,32,31,27,24,27,17,19,22,24,26,24,19,12],rhythm:'finale',swing:0}
];
export const noteHz=note=>440*2**((note-69)/12);
// One sixteenth-note tick. Generated events drive both realtime and offline audio.
export function musicEvents(level,step,cinematic=false){
 const t=TRACKS[level],tick=60/t.bpm/4,slot=step%t.meter,bar=Math.floor(step/t.meter),chord=t.chords[bar%t.chords.length],events=[];
 const melody=t.melody[step%t.melody.length];
 const add=(instrument,note,duration,volume,pan=0,delay=0)=>events.push({instrument,note,duration,volume,pan,delay});
 if(melody!==null){add(t.lead,t.root+melody,tick*(t.lead==='glass'?5:1.8),cinematic?.075:.055,Math.sin(step*.7)*.28,slot%2?tick*t.swing:0);}
 if(slot===0){for(const [i,n]of [0,t.minor?3:4,7,14].entries())add(t.pad,t.root+chord+n,tick*t.meter*1.15,cinematic?.033:.021,(i-1.5)*.22);}
 const bassTick=t.rhythm==='waltz'?slot===0:slot%4===0;
 if(bassTick)add(t.bass,t.root-12+chord+(slot>=t.meter/2?7:0),tick*(t.rhythm==='ice'?12:3.5),.07,-.12);
 if(t.rhythm==='garden'){if(slot%8===0)add('kick',36,.18,.055);if(slot%4===2)add('hat',0,.035,.018,.35);}
 if(t.rhythm==='waltz'){if(slot===0)add('kick',36,.15,.045);if(slot===4||slot===8)add('brush',0,.12,.025,.35);}
 if(t.rhythm==='electro'||t.rhythm==='forge'||t.rhythm==='finale'){if(slot%4===0)add('kick',36,.22,.08);if(slot===4||slot===12)add(t.rhythm==='forge'?'clank':'snare',0,.13,.042);if(slot%2===0)add('hat',0,.035,.025,slot%4===0?.3:-.3);}
 if(t.rhythm==='cavern'){if(slot===0)add('kick',32,.26,.045);if(slot===8)add('brush',0,.15,.025);}
 if(t.rhythm==='ice'&&slot===12)add('bell',t.root+31,1.3,.02,.7);
 if(t.rhythm==='reef'){if(slot%8===0)add('kick',36,.2,.06);if(slot%4===2)add('brush',0,.065,.025,-.4);if(slot===7||slot===15)add('hat',0,.045,.022,.4);}
 if(cinematic&&slot===0)add('anthem',t.root+chord+12,tick*t.meter,.028,.1);
 return events;
}
