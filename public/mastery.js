import {ENGAGEMENT,ENGAGEMENT_REVISION} from './engagement-data.js';
const labels={restored:'Restored',swift:'Swift',flawless:'Flawless',skill:'Skilled'};
const empty=()=>({version:1,worlds:{},observations:[]});
export function readMastery(raw){
 const result=empty();if(raw?.version!==1||!raw.worlds||typeof raw.worlds!=='object')return result;
 for(const id of Object.keys(ENGAGEMENT.profiles)){const r=raw.worlds[id];if(!r||typeof r!=='object')continue;
  const medals=Object.fromEntries(Object.keys(labels).map(k=>[k,r.medals?.[k]===true]));
  const current=r.revision===ENGAGEMENT_REVISION;result.worlds[id]={revision:ENGAGEMENT_REVISION,medals,bestTime:current&&Number.isFinite(r.bestTime)&&r.bestTime>0?r.bestTime:null,bestScore:current&&Number.isSafeInteger(r.bestScore)&&r.bestScore>=0?r.bestScore:0};
 }
 if(Array.isArray(raw.observations))result.observations=raw.observations.slice(-60).filter(r=>r&&typeof r.world==='string'&&ENGAGEMENT.profiles[r.world]&&Number.isFinite(r.seconds)&&r.seconds>=0).map(r=>({world:r.world,seconds:r.seconds,tailSeconds:Number(r.tailSeconds)||0,livesAtEntry:Number(r.livesAtEntry)||0,livesLost:Number(r.livesLost)||0,completed:r.completed===true}));
 return result;
}
export function counts(progress){const total={medals:0,swift:0,restored:0};for(const r of Object.values(progress.worlds)){for(const v of Object.values(r.medals))if(v)total.medals++;if(r.medals.swift)total.swift++;if(r.medals.restored)total.restored++;}return total;}
export function unlockedCosmetics(progress){const c=counts(progress);return ENGAGEMENT.cosmetics.filter(item=>c[item.requirement]>=item.count);}
export function awardMastery(progress,report){
 const p=ENGAGEMENT.profiles[report?.id];if(!p||!Number.isFinite(report.seconds)||report.seconds<=0)return null;
 const before=counts(progress),beforeRewards=new Set(unlockedCosmetics(progress).map(c=>c.id));
 const old=progress.worlds[report.id]||{revision:ENGAGEMENT_REVISION,medals:{},bestTime:null,bestScore:0};
 const earned={restored:true,swift:report.seconds<=p.swift,flawless:report.livesLost===0,skill:report[p.skillMetric]>=p.skillTarget},newMedals=Object.keys(earned).filter(k=>earned[k]&&!old.medals[k]);
 const next={revision:ENGAGEMENT_REVISION,medals:Object.fromEntries(Object.keys(labels).map(k=>[k,!!old.medals[k]||earned[k]])),bestTime:old.bestTime===null?report.seconds:Math.min(old.bestTime,report.seconds),bestScore:Math.max(old.bestScore,report.score)};
 progress.worlds[report.id]=next;const total=counts(progress),worldComplete=Object.keys(labels).every(k=>next.medals[k]),worldCompleted=worldComplete&&!Object.keys(labels).every(k=>old.medals[k]),collectionCompleted=before.medals<64&&total.medals===64;
 return {newMedals,newBestTime:old.bestTime!==null&&report.seconds<old.bestTime,record:next,goal:nextGoal(progress,report.id,report),worldComplete,worldCompleted,collectionCompleted,total:total.medals,unlocked:unlockedCosmetics(progress).filter(c=>!beforeRewards.has(c.id))};
}
export function masteryCelebration(award){
 if(!award?.newMedals?.length)return null;
 const tier=award.collectionCompleted?'collection':award.worldCompleted?'world':'medal';
 return {tier,title:tier==='collection'?'You mastered the prism.':tier==='world'?'World mastered!':award.newMedals.length===1?labels[award.newMedals[0]]+' medal earned!':award.newMedals.length+' new medals!',medals:tier==='medal'?award.newMedals:Object.keys(labels),newMedals:award.newMedals,total:award.total,unlocked:award.unlocked};
}
export function nextGoal(progress,id,report){
 const p=ENGAGEMENT.profiles[id],r=progress.worlds[id],m=r?.medals||{};if(!p)return '';
 if(!m.restored)return 'Restore this world to earn your first medal.';
 if(!m.swift)return report?.seconds>p.swift?'Finish '+Math.ceil(report.seconds-p.swift)+' seconds quicker for Swift.':'Clear in '+p.swift+' seconds for Swift.';
 if(!m.flawless)return 'Clear without losing a life for Flawless.';
 if(!m.skill)return p.skillLabel+' for Skilled.';
 return 'All four medals earned. Improve your personal time or challenge a friend.';
}
export const medalNames=medals=>medals.map(k=>labels[k]).join(' · ');
export function observeRun(progress,game,completed){
 const s=game.engagement?.stats;if(!s||!game.engagement.profile)return;
 progress.observations.push({world:s.id,seconds:Math.round(s.seconds),tailSeconds:Math.round(s.tailSeconds||0),livesAtEntry:s.livesAtEntry,livesLost:s.livesLost,completed});progress.observations=progress.observations.slice(-60);
}
