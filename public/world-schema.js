// Independent document contract: no generated bundle or game imports.
export const THEMES=['garden','cloud','city','crystal','forge','ice','reef','citadel','archive','aurora','clockwork','dunes','storm','harbor','horizon','nexus'];
export const BASE_TYPES={normal:'urn:Brick:Normal',armor:'urn:Brick:Armor',explode:'urn:Brick:Explosive',switch:'urn:Brick:Switch'};
export const EFFECTS=['none','bonus','pulse','open-gates','slow-ball','power-up'];
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const meta=(name,value)=>'<meta itemprop="'+name+'" content="'+escape(value)+'">';
const range=(v,min,max,label,integer=false)=>{if(!Number.isFinite(v)||v<min||v>max||(integer&&!Number.isSafeInteger(v)))throw Error('Invalid '+label);return v;};
const color=v=>{if(!/^#[a-f0-9]{6}$/i.test(v))throw Error('Use a six-digit hex color');return v;};
const text=(v,max,label)=>{if(typeof v!=='string'||!v.trim()||v.length>max)throw Error('Invalid '+label);return v;};
const props=element=>{const result=Object.create(null);for(const el of element.children){if(el.tagName.toLowerCase()!=='meta'||!el.hasAttribute('itemprop'))continue;const key=el.getAttribute('itemprop');if(Object.hasOwn(result,key))throw Error('Duplicate property: '+key);result[key]=el.getAttribute('content');}return result;};
const children=(element,prop)=>[...element.children].filter(el=>el.getAttribute('itemprop')===prop&&el.hasAttribute('itemscope'));
const number=(p,key,fallback)=>p[key]===undefined?fallback:Number(p[key]);
const bool=(p,key)=>{if(p[key]!==undefined&&!['true','false'].includes(p[key]))throw Error('Invalid '+key);return p[key]==='true';};
const propertyScopes={world:['schemaVersion','id','slug','name','note','tag','story','mechanic','shape','music','sky','accent','colors'],brickType:['type','name','base','effect','points','radius','duration','power'],formation:['phase','nextBrickId'],row:['index','x','y'],brick:['id','row','x','y','width','height','hitpoints','color','baseX'],barrier:['id','x','y','width','height','moving','gate'],portal:['x','y']};
function checkStructuredFields(element,scope){
 const childScopes=scope==='world'?['brickType','formation']:scope==='formation'?['row','brick','barrier','portal']:[];
 for(const node of element.children){const name=node.getAttribute('itemprop');if(name===null)continue;
  if(node.tagName.toLowerCase()==='meta'){if(!propertyScopes[scope].includes(name))throw Error('Unsupported property '+name+' in '+scope);}
  else if(node.hasAttribute('itemscope')&&childScopes.includes(name))checkStructuredFields(node,name);
  else throw Error('Unsupported structured child '+name+' in '+scope);
 }
}

export function validateWorld(world){
 if(world.schemaVersion!==2)throw Error('Unsupported world schema version');
 if(!/^[a-z][a-z0-9-]{0,63}$/.test(world.slug)||world.id!==world.slug)throw Error('Invalid stable world identity');
 if(world.index!==undefined)range(world.index,0,999,'catalog position',true);
 for(const key of ['tag','story','mechanic'])text(world[key],key==='story'?500:120,key);
 if(!THEMES.includes(world.shape)||!THEMES.includes(world.music))throw Error('Unsupported theme or music preset');
 color(world.sky);color(world.accent);if(!Array.isArray(world.colors)||world.colors.length!==4)throw Error('A palette needs four colors');world.colors.forEach(color);
 text(world.name,60,'world name');text(world.note,200,'world description');
 if(!Array.isArray(world.types)||world.types.length>16)throw Error('Maximum 16 custom brick types');
 const types=new Map();
 for(const type of world.types){
  if(!/^urn:Brick:Custom:[a-z][a-z0-9-]{0,39}$/.test(type.type)||types.has(type.type))throw Error('Invalid or duplicate brick type');
  text(type.name,40,'brick type name');if(!Object.hasOwn(BASE_TYPES,type.base)||!EFFECTS.includes(type.effect))throw Error('Invalid brick behavior');
  range(type.points??150,0,1000,'bonus points',true);range(type.radius??2.65,.5,4,'pulse radius');
  range(type.duration??5,1,15,'slow duration');if(type.power!==undefined&&!['wide','multi','sticky','laser','pierce','slow','shield','life'].includes(type.power))throw Error('Invalid power-up');
  types.set(type.type,type);
 }
 if(!Array.isArray(world.formations)||world.formations.length<1||world.formations.length>8)throw Error('Incorrect formation count');
 world.formations.forEach((f,phase)=>{
  if(f.phase!==phase||!Array.isArray(f.bricks)||f.bricks.length<1||f.bricks.length>80)throw Error('A formation needs 1–80 bricks');
  const ids=new Set();
  for(const b of f.bricks){
   range(b.id,0,100000,'brick ID',true);if(ids.has(b.id))throw Error('Duplicate brick ID');ids.add(b.id);
   range(b.w,.3,3,'brick width');range(b.h,.3,1.5,'brick height');range(b.x,-9,9,'brick x');range(b.y,-7.5,10.5,'brick y');
   if(Math.abs(b.x)+b.w/2>=10)throw Error('Brick extends outside the arena');
   range(b.maxHp,1,3,'hit points',true);if(b.hp!==b.maxHp)throw Error('World bricks must start undamaged');color(b.color);
   if(!Object.hasOwn(BASE_TYPES,b.kind)||typeof b.moving!=='boolean')throw Error('Invalid brick type');
   range(b.row,0,79,'row',true);range(b.baseX,-9,9,'movement origin');
   if(b.moving&&Math.abs(b.baseX)+.28+b.w/2>=10)throw Error('Moving brick extends outside the arena');
   if(b.customType){const type=types.get(b.customType);if(!type||type.base!==b.kind)throw Error('Undefined brick type');}
  }
  range(f.nextBrickId,Math.max(...ids)+1,100001,'next brick identity',true);
  if(!Array.isArray(f.barriers)||f.barriers.length>16||!Array.isArray(f.portals)||![0,2].includes(f.portals.length))throw Error('Invalid obstacles');
  const obstacleIds=new Set();for(const b of f.barriers){range(b.id,0,100000,'barrier ID',true);if(obstacleIds.has(b.id))throw Error('Duplicate barrier ID');obstacleIds.add(b.id);range(b.x,-9,9,'barrier x');range(b.y,-7.5,10.5,'barrier y');range(b.w,.3,8,'barrier width');range(b.h,.2,1.5,'barrier height');if(typeof b.moving!=='boolean'||typeof b.gate!=='boolean')throw Error('Invalid barrier behavior');}
  for(const b of f.barriers)if(!b.moving&&Math.abs(b.x)+b.w/2>=10)throw Error('Barrier extends outside the arena');
  for(const p of f.portals){range(p.x,-8.5,8.5,'portal x');range(p.y,-7.5,10.5,'portal y');}
 });
 return world;
}

export function normalizeWorld(world){
 const copy=JSON.parse(JSON.stringify(world));
 for(const f of copy.formations){f.nextBrickId??=Math.max(...f.bricks.map(b=>b.id))+1;for(const b of f.bricks){b.row??=0;b.baseX??=b.x;b.moving=!!b.moving;}for(const b of f.barriers){b.moving=!!b.moving;b.gate=!!b.gate;}}
 return validateWorld(copy);
}

export function worldHTML(input){
 const world=normalizeWorld(input);
 let html='<article id="world" itemscope itemtype="urn:world">'+['schemaVersion','id','slug','name','note','tag','story','mechanic','shape','music','sky','accent'].map(key=>meta(key,world[key])).join('')+meta('colors',world.colors.join(' '))+'<h1>'+escape(world.name)+'</h1><p>'+escape(world.note)+'</p>';
 for(const t of world.types)html+='<div itemprop="brickType" itemscope itemtype="urn:BrickType">'+meta('type',t.type)+meta('name',t.name)+meta('base',t.base)+meta('effect',t.effect)+meta('points',t.points??150)+meta('radius',t.radius??2.65)+meta('duration',t.duration??5)+meta('power',t.power??'wide')+'</div>';
 for(const f of world.formations){
  html+='<section id="formation-'+f.phase+'" itemprop="formation" itemscope itemtype="urn:Formation">'+meta('phase',f.phase)+meta('nextBrickId',f.nextBrickId);
  const rows=[...new Set(f.bricks.map(b=>b.row))];
  for(const row of rows){const bricks=f.bricks.filter(b=>b.row===row),first=bricks[0];html+='<div id="f'+f.phase+'-row-'+row+'" itemprop="row" itemscope itemtype="urn:Row">'+meta('index',row)+meta('y',first.y)+meta('x',first.x)+'</div>';}
  for(const b of f.bricks){const types=['urn:Brick',BASE_TYPES[b.kind],...(b.moving?['urn:Brick:Moving']:[]),...(b.customType?[b.customType]:[])];html+='<div id="f'+f.phase+'-brick-'+b.id+'" itemprop="brick" itemscope itemtype="'+types.join(' ')+'">'+meta('id',b.id)+meta('row','f'+f.phase+'-row-'+b.row)+meta('x',b.x)+meta('y',b.y)+meta('width',b.w)+meta('height',b.h)+meta('hitpoints',b.maxHp)+meta('color',b.color)+meta('baseX',b.baseX)+'</div>';}
  for(const b of f.barriers)html+='<div itemprop="barrier" itemscope itemtype="urn:Barrier">'+Object.entries({id:b.id,x:b.x,y:b.y,width:b.w,height:b.h,moving:b.moving,gate:b.gate}).map(([k,v])=>meta(k,v)).join('')+'</div>';
  for(const p of f.portals)html+='<div itemprop="portal" itemscope itemtype="urn:Portal">'+meta('x',p.x)+meta('y',p.y)+'</div>';
  html+='</section>';
 }
 return html+'</article>';
}
export function worldDocument(world){return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>'+escape(world.name)+' · World definition</title><link rel="stylesheet" href="/world-data.css"></head><body>'+worldHTML(world)+'</body></html>';}

export function parseWorld(input,{expectedSlug,Parser=globalThis.DOMParser}={}){
 const root=typeof input==='string'?new Parser().parseFromString(input,'text/html').querySelector('#world[itemtype="urn:world"]'):input;
 if(typeof input==='string'&&input.length>1000000)throw Error('World file is too large');
 if(!root||root.getAttribute('itemtype')!=='urn:world')throw Error('No structured world found');
 checkStructuredFields(root,'world');
 const p=props(root),world={schemaVersion:Number(p.schemaVersion),id:p.id,slug:p.slug,name:p.name,note:p.note,tag:p.tag,story:p.story,mechanic:p.mechanic,shape:p.shape,music:p.music,sky:p.sky,accent:p.accent,colors:p.colors?.split(/\s+/),types:[],formations:[]};
 if(expectedSlug&&world.slug!==expectedSlug)throw Error('This file belongs to another world');
 world.types=children(root,'brickType').map(el=>{const t=props(el);return {type:t.type,name:t.name,base:t.base,effect:t.effect,points:number(t,'points',150),radius:number(t,'radius',2.65),duration:number(t,'duration',5),power:t.power??'wide'};});
 world.formations=children(root,'formation').map(el=>{
  const phase=Number(props(el).phase),rowElements=children(el,'row'),rows=new Map(rowElements.map(row=>[row.id,props(row)]));if(rows.size!==rowElements.length||rowElements.some(row=>!row.id))throw Error('Duplicate or missing row ID');
  const bricks=children(el,'brick').map(node=>{const b=props(node),row=rows.get(b.row);if(!row)throw Error('Brick refers to a missing row');const types=node.getAttribute('itemtype')?.split(/\s+/)||[],specializations=Object.keys(BASE_TYPES).filter(k=>types.includes(BASE_TYPES[k])),kind=specializations[0]||(Number(b.hitpoints)>1?'armor':'normal');if(specializations.length>1||!types.some(t=>t==='urn:Brick'||t==='urn:Brick:Moving'||Object.values(BASE_TYPES).includes(t))||types.some(t=>t!=='urn:Brick'&&t!=='urn:Brick:Moving'&&!Object.values(BASE_TYPES).includes(t)&&!world.types.some(c=>c.type===t)))throw Error('Unrecognized brick specialization');if(types.filter(t=>t.startsWith('urn:Brick:Custom:')).length>1)throw Error('A brick supports one custom recipe; multiple custom types would lose behavior');const hp=Number(b.hitpoints),x=number(b,'x',Number(row.x));return {id:Number(b.id),row:Number(row.index),x,y:number(b,'y',Number(row.y)),w:number(b,'width',1.7),h:number(b,'height',.72),hp,maxHp:hp,color:b.color,baseX:number(b,'baseX',x),moving:types.includes('urn:Brick:Moving'),kind,...(types.find(t=>t.startsWith('urn:Brick:Custom:'))?{customType:types.find(t=>t.startsWith('urn:Brick:Custom:'))}:{})};});
  const barriers=children(el,'barrier').map(node=>{const b=props(node);return {id:Number(b.id),x:Number(b.x),y:Number(b.y),w:Number(b.width),h:Number(b.height),moving:bool(b,'moving'),gate:bool(b,'gate')};});
  const portals=children(el,'portal').map(node=>{const b=props(node);return {x:Number(b.x),y:Number(b.y)};});
  return {phase,nextBrickId:number(props(el),'nextBrickId',Math.max(...bricks.map(b=>b.id))+1),bricks,barriers,portals};
 });
 return validateWorld(world);
}
