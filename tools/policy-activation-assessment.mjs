// Observational diagnostics only. Never use this result as a publication gate.
export const OBSERVATION = Object.freeze({intervalMs:10000, stableMs:120000, deadlineMs:300000, minimumRounds:7, maximumGapMs:30000});

export function assessRound({revision,grant,deleted=false,before,after,reads,writes,options}) {
  const problems=[];
  const rowKey=row=>JSON.stringify([row.id,row.revision]);
  const expected=new Map(before.map(row=>[rowKey(row),1]));
  if(expected.size!==before.length)problems.push('Duplicate pre-existing synthetic rows');
  for(const read of reads){
    if(read.error)problems.push('Read transport failure');
    else if(deleted ? read.status!==200 || read.marker!==null || !read.baseDocument : read.status!==418 || read.marker!==`activation-revision-${revision}`)problems.push('Read executed an unexpected revision');
  }
  if(options.error || options.status<200 || options.status>=300)problems.push('OPTIONS failed');
  else if(/\bPOST\b/i.test(options.headers?.allow||'')!==grant)problems.push('OPTIONS grant differs from expected');
  for(const write of writes){
    const accepted=write.status>=200&&write.status<300;
    if(accepted){const key=rowKey({id:write.id,revision:write.revision});expected.set(key,(expected.get(key)||0)+1);}
    if(write.error)problems.push('Write transport failure; outcome unknown');
    else if(!grant){if(![401,403].includes(write.status))problems.push('Write not denied after revocation');}
    else if(write.revision===revision){if(!accepted)problems.push('New-only payload was not accepted');}
    else if(write.status!==422||write.marker!==`activation-reject-${revision}`)problems.push('Old-only payload was not rejected by the intended revision');
  }
  const actual=new Map();
  for(const row of after){const key=rowKey(row);actual.set(key,(actual.get(key)||0)+1);}
  if(actual.size!==expected.size||[...expected].some(([key,count])=>actual.get(key)!==count))problems.push('Stored records differ from acknowledged writes or prior records');
  return {matches:problems.length===0,problems:[...new Set(problems)],requestCount:reads.length+writes.length+1};
}

export function assessWindow(rounds,policy=OBSERVATION){
  let streak=[],firstMatchMs=null,regression=false,previousEnd=null;
  let matchedBefore=false;
  for(const round of rounds){
    const gap=previousEnd!==null&&round.startedMs-previousEnd>policy.maximumGapMs;
    if(!round.matches||gap){if(matchedBefore)regression=true;streak=[];}
    if(round.matches){
      if(firstMatchMs===null)firstMatchMs=round.endedMs;
      matchedBefore=true;streak.push(round);
    }
    previousEnd=round.endedMs;
  }
  // Count from completion of the first matching round, not its request start.
  const observedMs=streak.length?streak.at(-1).endedMs-streak[0].endedMs:0;
  const consistentWindowObserved=streak.length>=policy.minimumRounds&&observedMs>=policy.stableMs;
  const mismatchingRounds=rounds.filter(r=>!r.matches).length;
  return {status:consistentWindowObserved&&!mismatchingRounds&&!regression?'new policy consistently observed':'not confirmed',consistentWindowObserved,firstMatchMs,observedMs,consecutiveMatchingRounds:streak.length,mismatchingRounds,regression,rounds:rounds.length,publicRequests:rounds.reduce((n,r)=>n+r.requestCount,0),globalReadinessGuaranteed:false};
}
