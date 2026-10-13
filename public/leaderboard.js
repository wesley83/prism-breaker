export const utcDay=(now=Date.now())=>new Date(now).toISOString().slice(0,10);
export function rankedScores(scores,mode,day=utcDay()){
 return scores.filter(r=>r.mode===mode&&(mode!=='daily'||r.day===day)).sort((a,b)=>Number(b.score)-Number(a.score)||Number(b.level)-Number(a.level)||Number(a.seconds)-Number(b.seconds)).slice(0,25);
}
export function scoreAge(row,now=Date.now()){
 const time=Date.parse(row.submittedAt);return Number.isFinite(time)?Math.max(0,Math.floor((now-time)/60000)):null;
}
export function topFinish(result,scores,day=utcDay()){
 if(result.score<=0||result.mode==='practice'||(result.mode==='daily'&&result.day!==day))return false;
 const leader=rankedScores(scores,result.mode,day).find(r=>r.runKey!==result.id);
 return !leader||result.score>=Number(leader.score);
}
