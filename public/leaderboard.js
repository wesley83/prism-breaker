export const utcDay=(now=Date.now())=>new Date(now).toISOString().slice(0,10);
export const SCORE_LIFETIME=5*24*60*60*1000;
export function scoreExpiry(row){const server=Number(row.expiresAt);return Number.isSafeInteger(server)&&server>0?server:Date.parse(row.submittedAt)+SCORE_LIFETIME;}
export const activeScores=(scores,now=Date.now())=>scores.filter(r=>scoreExpiry(r)>now);
export function rankedScores(scores,mode,day=utcDay(),now=Date.now()){
 return activeScores(scores,now).filter(r=>r.mode===mode&&(mode!=='daily'||r.day===day)).sort((a,b)=>Number(b.score)-Number(a.score)||Number(b.level)-Number(a.level)||Number(a.seconds)-Number(b.seconds)).slice(0,25);
}
export function scoreAge(row,now=Date.now()){
 const time=scoreExpiry(row)-SCORE_LIFETIME;return Number.isFinite(time)?Math.max(0,Math.floor((now-time)/60000)):null;
}
export function scoreAgeBand(row,now=Date.now()){
 const age=now-(scoreExpiry(row)-SCORE_LIFETIME);
 return !Number.isFinite(age)?null:age>96*3600000?'red':age>48*3600000?'yellow':'green';
}
export function topFinish(result,scores,day=utcDay(),now=Date.now()){
 if(result.score<=0||result.mode==='practice'||(result.mode==='daily'&&result.day!==day))return false;
 const leader=rankedScores(scores,result.mode,day,now).find(r=>r.runKey!==result.id);
 return !leader||result.score>=Number(leader.score);
}
