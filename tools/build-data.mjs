import fs from 'node:fs/promises';
import {WORLDS,makeLevel} from '../public/levels.js';
const origin='https://sane-guild-8399.onpagelove.com';
const props=[['runKey','Text'],['player','Text'],['score','Integer'],['level','Integer'],['mode','Text'],['day','Text'],['seconds','Integer'],['submittedAt','DateTime']];
const scorePattern='^<li itemscope itemtype="https://sane-guild-8399[.]onpagelove[.]com/Run"><meta itemprop="runKey" content="[a-f0-9-]{36}"><meta itemprop="player" content="[A-Za-z0-9 _-]{2,16}"><meta itemprop="score" content="(0|[1-9][0-9]{0,4}|[1-4][0-9]{5}|500000)"><meta itemprop="level" content="[1-8]"><meta itemprop="mode" content="(campaign|daily)"><meta itemprop="day" content="(all|[0-9]{4}-[0-9]{2}-[0-9]{2})"><meta itemprop="seconds" content="[1-9][0-9]{0,4}">(<meta itemprop="submittedAt" content="[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}[.][0-9]{3}Z">)?</li>$';
const rules=`<div hidden itemscope itemtype="https://pagelove.org/AuthorizationRule"><meta itemprop="actor" content="*"><meta itemprop="resource" content="/scores.html"><meta itemprop="method" content="POST"><meta itemprop="selector" content="#scores"><meta itemprop="action" content="Allow"></div>
<div hidden itemscope itemtype="https://pagelove.org/ShapeConstraint"><meta itemprop="resource" content="/scores.html"><meta itemprop="selector" content="#scores"><code itemprop="permit">ul[id="scores"]</code><code itemprop="permit">li[itemscope][itemtype="${origin}/Run"]</code><code itemprop="permit">meta[itemprop][content]</code></div>
<div hidden itemscope itemtype="https://pagelove.org/Schema"><meta itemprop="type" content="${origin}/Run">${props.map(([name,type])=>`<div itemprop="property" itemscope itemtype="https://pagelove.org/Property"><meta itemprop="name" content="${name}"><meta itemprop="type" content="https://schema.host/${type}"><meta itemprop="cardinality" content="${name==='submittedAt'?'0..1':'1..1'}">${name==='runKey'?'<meta itemprop="unique" content="true">':''}</div>`).join('')}</div>
<div hidden itemscope itemtype="https://pagelove.org/Trigger"><meta itemprop="resource" content="/scores.html"><meta itemprop="method" content="POST"><meta itemprop="selector" content="#scores"><div itemprop="action" itemscope itemtype="https://pagelove.org/Sessel"><script itemprop="source" type="text/sessel">
@schema Context url("https://pagelove.org/Context");
@schema HTTPResponse url("https://pagelove.org/HTTPResponse");
if (!Context.request.body.matches(${JSON.stringify(scorePattern)})) {
 throw new HTTPResponse {status: 422, message: "<p>Submit one valid Prism Breaker run.</p>"}
}
</script></div></div>`;
if(!process.argv.includes('--worlds-only'))await fs.writeFile('public/scores.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Prism Breaker shared scores</title></head><body><h1>Prism Breaker scores</h1><p>Community scores are self-reported. <a href="/">Play Prism Breaker</a>.</p><ul id="scores"></ul>${rules}</body></html>`);
let content='';for(let i=0;i<8;i++)for(let phase=0;phase<(i===7?3:1);phase++){
const data=makeLevel(i,phase);content+=`<section data-world="${i}" data-phase="${phase}"><h2>${WORLDS[i].name}</h2><p>${WORLDS[i].note}</p>`+data.bricks.map(b=>'<code data-brick>'+JSON.stringify(b)+'</code>').join('')+'</section>';}
await fs.writeFile('public/worlds.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Prism Breaker world definitions</title></head><body><main id="worlds">${content}</main></body></html>`);
console.log(process.argv.includes('--worlds-only')?'Generated structured world definitions.':'Generated structured world definitions and score rules.');
