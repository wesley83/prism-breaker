// One symbol definition feeds the 3D arena and its How to play legend.
export const STAR_PATH='M64 14 79 46 114 50 88 75 94 110 64 93 34 110 40 75 14 50 49 46Z';
export const DIAMOND_PATH='M64 18 110 64 64 110 18 64Z';
export const BRICK_COUNT_COLORS=Object.freeze({'1':'#ff9c96','2':'#ffd36e','3':'#79e6ff'});
export const BRICK_GUIDE=Object.freeze([
 {kind:'normal',name:'Regular',mark:null,description:'No symbol. Breaks with one hit.'},
 {kind:'armor',name:'Armored',mark:'3',description:'The number and its color show hits remaining: cyan 3, gold 2, coral 1. Cracks spread after each hit. Most start at 2; armored bricks in the Citadel’s final formation start at 3.'},
 {kind:'explode',name:'Explosive',mark:'★',description:'Break the star to deal one hit to nearby bricks. Explosives can trigger chain reactions; armored neighbors may survive.'},
 {kind:'switch',name:'Switch',mark:'◇',description:'Break the outlined diamond to open Electric City’s glowing gates.'}
]);
export function brickMark(brick){
 if(!brick||!Number.isInteger(brick.hp)||brick.hp<=0)return null;
 if(brick.kind==='armor')return String(brick.hp);
 return brick.kind==='explode'?'★':brick.kind==='switch'?'◇':null;
}
export function updateBrickMarker(sprite,brick,textureFor){
 const mark=brickMark(brick);sprite.visible=mark!==null;
 if(mark!==null&&sprite.userData.brickMark!==mark){sprite.material.map=textureFor(mark);sprite.userData.brickMark=mark;}
}
const numberFont=mark=>mark.length===1?96:Math.round(140/mark.length);
export function brickMarkerSVG(mark){
 if(mark===null)return '';
 const shape=mark==='★'?'<path d="'+STAR_PATH+'" fill="#fff"/>':mark==='◇'?'<path d="'+DIAMOND_PATH+'" fill="none" stroke="#fff" stroke-width="12" stroke-linejoin="round"/>':/^\d+$/.test(mark)?'<text x="64" y="69" fill="'+(BRICK_COUNT_COLORS[mark]||'#fff')+'" text-anchor="middle" dominant-baseline="central" font-family="Arial,sans-serif" font-size="'+numberFont(mark)+'" font-weight="700">'+mark+'</text>':'';
 return '<svg viewBox="0 0 128 128" aria-hidden="true"><rect x="10" y="10" width="108" height="108" rx="20" fill="#102229"/>'+shape+'</svg>';
}
export function drawBrickMarker(ctx,mark){
 ctx.clearRect(0,0,128,128);ctx.fillStyle='#102229';ctx.beginPath();ctx.roundRect(10,10,108,108,20);ctx.fill();
 ctx.fillStyle=BRICK_COUNT_COLORS[mark]||'#fff';ctx.strokeStyle='#fff';ctx.lineWidth=12;ctx.lineJoin='round';
 if(mark==='★')ctx.fill(new Path2D(STAR_PATH));
 else if(mark==='◇')ctx.stroke(new Path2D(DIAMOND_PATH));
 else{ctx.font='700 '+numberFont(mark)+'px Arial,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(mark,64,69);}
}
