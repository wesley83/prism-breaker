export const VICTORY_TRACKS={campaign:{title:'Every Color, A Crown',style:'Adventure victory · brass, choir and drums',bpm:116},daily:{title:'Crown of the Day',style:'Daily victory · bells, bright synths and celebratory beats',bpm:140}};
export function victoryEvents(mode,step){
 const daily=mode==='daily',root=daily?60:50,t=VICTORY_TRACKS[daily?'daily':'campaign'],tick=60/t.bpm/4,slot=step%16,bar=Math.floor(step/16)%8,chord=[0,5,7,0,9,5,7,0][bar],melody=daily?[12,16,19,24,19,16,14,19,17,21,24,26,24,21,19,24]:[12,12,16,19,24,24,23,19,17,17,21,24,26,24,19,24],events=[];
 const add=(instrument,note,duration,volume,pan=0,delay=0)=>events.push({instrument,note,duration,volume,pan,delay});
 if(slot%(daily?2:4)===0){const note=root+melody[(bar*4+Math.floor(slot/(daily?2:4)))%melody.length];add(daily?'bell':'anthem',note,daily?.32:.6,daily?.072:.075,.15);}
 if(slot===0){for(const interval of [0,4,7])add(daily?'pad':'choir',root+chord+interval+12,tick*15,.022,interval===4?-.25:.25);}
 if(slot%4===0){add('kick',36,.18,.09);add('marimba',root+chord,tick*2.6,.075,-.15);}
 if(slot===4||slot===12)add('snare',0,.15,.04,-.2);
 if(slot%2===0)add('hat',0,.035,.022,.35);
 if(daily&&slot%4===2)add('glass',root+chord+19,.25,.035,-.45);
 if(!daily&&(slot===6||slot===14))add('metal',root+chord+24,.45,.025,.45);
 return events;
}
