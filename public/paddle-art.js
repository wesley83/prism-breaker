import * as T from './vendor/three.module.min.js';

function beveledPlate(width,height,depth,bevel){
 const x=width/2-bevel,y=height/2-bevel,cut=Math.min(y*.45,.055),shape=new T.Shape();
 shape.moveTo(-x+cut,-y);for(const [px,py] of [[x-cut,-y],[x,-y+cut],[x,y-cut],[x-cut,y],[-x+cut,y],[-x,y-cut],[-x,-y+cut]])shape.lineTo(px,py);shape.closePath();
 const geometry=new T.ExtrudeGeometry(shape,{depth:depth-2*bevel,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:1,steps:1});geometry.center();return geometry;
}
function endBracket(){
 const shape=new T.Shape();shape.moveTo(-.12,.20);
 for(const [x,y] of [[.02,.20],[.14,.10],[.14,-.10],[.02,-.20],[-.12,-.20],[-.12,-.13],[-.01,-.13],[.06,-.065],[.06,.065],[-.01,.13],[-.12,.13]])shape.lineTo(x,y);shape.closePath();
 return new T.ExtrudeGeometry(shape,{depth:.06,bevelEnabled:true,bevelThickness:.008,bevelSize:.008,bevelSegments:1,steps:1});
}
function highlightRail(){
 const geometry=new T.BoxGeometry(1,.025,.028,16,1,1),position=geometry.attributes.position,colors=[];
 const stops=[new T.Color('#63dbff'),new T.Color('#ecfaff'),new T.Color('#ffe3ad'),new T.Color('#ff8fdd')];
 for(let i=0;i<position.count;i++){const t=(position.getX(i)+.5)*3,j=Math.min(2,Math.floor(t));stops[j].clone().lerp(stops[j+1],t-j).toArray(colors,i*3);}
 geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));return geometry;
}
export function makePaddle(haloTexture,environment){
 const group=new T.Group(),metal=new T.MeshPhysicalMaterial({color:'#536575',metalness:.82,roughness:.18,clearcoat:.8,clearcoatRoughness:.12,envMap:environment,envMapIntensity:1.2});
 const body=new T.Mesh(beveledPlate(1,.34,.50,.025),metal);group.add(body);
 const face=new T.Mesh(beveledPlate(1,.22,.075,.012),new T.MeshPhysicalMaterial({color:'#08131d',metalness:.45,roughness:.24,clearcoat:1,envMap:environment,envMapIntensity:.55}));face.position.z=.26;group.add(face);
 const rail=new T.Mesh(highlightRail(),new T.MeshBasicMaterial({vertexColors:true,toneMapped:false}));rail.position.set(0,.145,.285);group.add(rail);
 const status=new T.Mesh(new T.BoxGeometry(1,.022,.025),new T.MeshBasicMaterial({color:'#759cab',toneMapped:false,fog:false}));status.position.set(0,-.145,.285);group.add(status);
 const capGeometry=endBracket(),guardGeometry=beveledPlate(.30,.40,.50,.03),curve=new T.CatmullRomCurve3([[-.09,.163,.335],[.012,.163,.335],[.10,.082,.335],[.10,-.082,.335],[.012,-.163,.335],[-.09,-.163,.335]].map(p=>new T.Vector3(...p))),coreGeometry=new T.TubeGeometry(curve,24,.013,5,false),ends=[];
 for(const [side,color] of [[-1,'#26dfff'],[1,'#ff60d2']]){
  const end=new T.Group(),guard=new T.Mesh(guardGeometry,metal),lens=new T.Mesh(capGeometry,new T.MeshBasicMaterial({color:new T.Color(color).multiplyScalar(2),toneMapped:false,fog:false})),core=new T.Mesh(coreGeometry,new T.MeshBasicMaterial({color:new T.Color('#e5ffff').multiplyScalar(1.6),toneMapped:false,fog:false}));
  lens.position.z=.255;end.add(guard,lens,core);end.scale.x=side;group.add(end);
  const glow=new T.Sprite(new T.SpriteMaterial({map:haloTexture,color,transparent:true,opacity:.26,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,fog:false}));glow.scale.set(.85,.80,1);glow.position.z=.34;group.add(glow);ends.push({side,end,glow});
 }
 const nozzles=[];for(const side of [-1,1]){const nozzle=new T.Mesh(new T.BoxGeometry(.10,.065,.04),new T.MeshBasicMaterial({color:new T.Color('#ff718a').multiplyScalar(2),toneMapped:false,fog:false}));nozzle.position.set(0,.16,.31);nozzle.visible=false;group.add(nozzle);nozzles.push({side,mesh:nozzle});}
 group.userData.art={body,face,rail,status,ends,nozzles,width:null,mode:null};updatePaddle(group,{x:0,w:3.3},{},false);return group;
}
export function updatePaddle(group,paddle,effects,lowEffects){
 const art=group.userData.art;group.position.set(paddle.x,-10.6,.1);
 if(art.width!==paddle.w){
  art.body.scale.x=paddle.w;art.face.scale.x=paddle.w-.34;art.rail.scale.x=paddle.w-.32;art.status.scale.x=paddle.w-.32;
  for(const {side,end,glow} of art.ends){end.position.x=side*(paddle.w/2-.15);glow.position.x=end.position.x;}
  for(const {side,mesh} of art.nozzles)mesh.position.x=side*paddle.w*.4;art.width=paddle.w;
 }
 const mode=effects.laser>0?'laser':effects.sticky>0?'sticky':'normal';
 if(art.mode!==mode){
  art.status.material.color.set(mode==='laser'?'#ff718a':mode==='sticky'?'#ffd77c':'#759cab').multiplyScalar(mode==='normal'?1:1.8);
  art.face.material.color.set(mode==='laser'?'#25131e':mode==='sticky'?'#282217':'#08131d');for(const {mesh} of art.nozzles)mesh.visible=mode==='laser';art.mode=mode;
 }
 for(const {glow} of art.ends)glow.material.opacity=lowEffects?.13:.26;
}
