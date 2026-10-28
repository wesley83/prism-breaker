import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {DOMParser} from 'linkedom';
import {readWorldCatalog} from './read-world-catalog.mjs';
import {parseWorld} from '../public/world-schema.js';
const source=await fs.readFile('public/engagement.html','utf8'),doc=new DOMParser().parseFromString(source,'text/html'),root=doc.querySelector('#engagement[itemtype="urn:PrismEngagement"]');
const fields={PrismEngagement:['version'],WorldMastery:['id','swift','skillMetric','skillTarget','skillLabel','choiceLeft','choiceRight','recoverySeconds','peakSeconds'],PrismEncounter:['phase','kind','title','instruction','cores','generators','portalUses','period','opening'],PrismCosmetic:['id','kind','name','color','requirement','count']};
const props=node=>{const keys=fields[node?.getAttribute('itemtype')?.replace('urn:','')];if(!keys)throw Error('Unknown engagement document type');const result=Object.create(null);for(const n of node.children){if(n.tagName!=='META')continue;const key=n.getAttribute('itemprop');if(!keys.includes(key)||Object.hasOwn(result,key))throw Error('Unsupported or duplicate engagement field');result[key]=n.getAttribute('content');}return result;};
if(!root||props(root).version!=='1')throw Error('Unsupported engagement document');
const {entries}=await readWorldCatalog(),profiles={},cosmetics=[];
const bounded=(value,min,max,label)=>{const n=Number(value);if(!Number.isFinite(n)||n<min||n>max)throw Error('Invalid engagement '+label);return n;};
for(const node of root.querySelectorAll('[itemprop="world"]')){
 const p=props(node),entry=entries.find(e=>e.id===p.id);if(!entry||profiles[p.id])throw Error('Unknown or duplicate mastery world');
 const world=parseWorld(await fs.readFile('public/worlds/'+entry.slug+'/definition.html','utf8'),{Parser:DOMParser}),encounters=[];
 for(const n of node.querySelectorAll('[itemprop="encounter"]')){
  const e=props(n),phase=bounded(e.phase,0,world.formations.length-1,'encounter phase'),formation=world.formations[phase];if(!Number.isInteger(phase)||encounters.some(v=>v.phase===phase))throw Error('Invalid or duplicate encounter phase');
  const ids=key=>e[key]?e[key].split(' ').map(v=>{const id=bounded(v,0,100000,key);if(!Number.isInteger(id))throw Error('Invalid encounter brick identity');return id;}):[];
  const cores=ids('cores'),generators=ids('generators');
  if(!cores.length||[...cores,...generators].some(id=>!formation.bricks.some(b=>b.id===id))||cores.some(id=>generators.includes(id))||new Set([...cores,...generators]).size!==cores.length+generators.length)throw Error('Invalid encounter targets');
  if(!['generators','storm','nexus'].includes(e.kind)||!e.title||e.title.length>80||!e.instruction||e.instruction.length>200)throw Error('Invalid encounter description');
  const portals=bounded(e.portalUses??0,0,4,'portal requirement');if(portals&&!formation.portals.length)throw Error('Encounter needs authored portals');
  encounters.push({phase,kind:e.kind,title:e.title,instruction:e.instruction,cores,generators,portalUses:portals,period:bounded(e.period??9,6,15,'storm period'),opening:bounded(e.opening??4,2,6,'storm opening')});
 }
 const metric=p.skillMetric;if(!['peakCombo','portals','chains','precision'].includes(metric)||!p.skillLabel||p.skillLabel.length>100)throw Error('Invalid skill objective');
 if(metric==='portals'&&!world.formations.some(f=>f.portals.length)||metric==='chains'&&!world.formations.some(f=>f.bricks.some(b=>b.kind==='explode')))throw Error('Skill objective needs its authored mechanic');
 if(!['wide','sticky','laser','multi','pierce','slow','shield'].includes(p.choiceLeft)||!['wide','sticky','laser','multi','pierce','slow','shield'].includes(p.choiceRight)||p.choiceLeft===p.choiceRight)throw Error('Invalid power choice');
 profiles[p.id]={id:p.id,swift:bounded(p.swift,30,900,'swift time'),skillMetric:metric,skillTarget:bounded(p.skillTarget,1,40,'skill target'),skillLabel:p.skillLabel,choice:[p.choiceLeft,p.choiceRight],recoverySeconds:bounded(p.recoverySeconds,2,10,'recovery'),peakSeconds:bounded(p.peakSeconds,8,30,'peak'),encounters};
}
if(Object.keys(profiles).length!==entries.length)throw Error('Every world needs mastery/pacing definitions');
for(const node of root.querySelectorAll('[itemprop="cosmetic"]')){const p=props(node);if(!/^[a-z][a-z0-9-]{1,30}$/.test(p.id)||cosmetics.some(c=>c.id===p.id)||!['finish','trail'].includes(p.kind)||!['medals','swift','restored'].includes(p.requirement)||!/^#[0-9a-f]{6}$/i.test(p.color)||!p.name)throw Error('Invalid cosmetic');cosmetics.push({...p,count:bounded(p.count,0,64,'unlock count')});}
const model={version:1,profiles,cosmetics},revision=createHash('sha256').update(JSON.stringify(model)).digest('hex');
await fs.writeFile('public/engagement-data.js','// Generated from engagement.html. Edit that document, then build.\nexport const ENGAGEMENT_REVISION='+JSON.stringify(revision)+';\nexport const ENGAGEMENT='+JSON.stringify(model)+';\n');
console.log('Built engagement goals, encounters and rewards for '+entries.length+' worlds.');
