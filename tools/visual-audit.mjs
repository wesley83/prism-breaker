export const luminance=rgb=>rgb.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
export function flashDelta(previous,next){
 if(previous.length!==next.length||next.length%4)throw Error('Incompatible frame buffers');let rise=0,fall=0,red=0;
 for(let i=0;i<next.length;i+=4){const a=luminance([previous[i],previous[i+1],previous[i+2]]),b=luminance([next[i],next[i+1],next[i+2]]);if(b-a>.1)rise++;if(a-b>.1)fall++;if(next[i]>180&&next[i]>next[i+1]*2&&next[i]>next[i+2]*2&&Math.abs(next[i]-previous[i])>80)red++;}
 const pixels=next.length/4;return {rise:rise/pixels,fall:fall/pixels,red:red/pixels};
}
export function flashSummary(samples,{fps=60,area=.25}={}){
 let direction=0;const pairs=[];let maxPairs=0;
 samples.forEach((sample,index)=>{const sign=sample.rise>=area?1:sample.fall>=area?-1:0;if(sign&&direction&&sign!==direction){pairs.push(index);direction=0;}else if(sign)direction=sign;
  while(pairs.length&&pairs[0]<=index-fps)pairs.shift();maxPairs=Math.max(maxPairs,pairs.length);
 });return {maxPairsInSecond:maxPairs,flagged:maxPairs>3,redAreaFrames:samples.filter(s=>s.red>=area).length,limits:'Conservative downsampled frame screen; not the complete WCAG general/red-flash area calculation.'};
}
