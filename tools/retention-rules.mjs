// Native Pagelove rules. The request grammar never accepts client-provided expiresAt.
export const RETENTION_MS=5*24*60*60*1000;
export function expiryProperty(){return `<div itemprop="property" itemscope itemtype="https://pagelove.org/Property"><meta itemprop="name" content="expiresAt"><meta itemprop="type" content="https://schema.host/Integer"><meta itemprop="cardinality" content="1..1"><div itemprop="default" itemscope itemtype="https://pagelove.org/JavaScript/Module"><script itemprop="source" type="module">export default () => Date.now() + ${RETENTION_MS};</script></div></div>`;}
export function retentionRules(resource='/scores.html',origin='https://sane-guild-8399.onpagelove.com'){
 const guard=String.raw`export default function(ctx) {
 const headers=ctx.request.headers,range=headers.Range ?? headers.range ?? headers.get?.('Range') ?? headers.get?.('range') ?? '';
 const match=/^selector=#scores > li:has\(meta\[itemprop="expiresAt"\]:value-less-than\("([0-9]{13})"\)\)$/.exec(range);
 if(!match || Number(match[1])>Date.now())throw {schema_url:'https://pagelove.org/HTTPResponse',status:403,body:'<p>Only expired scores can be deleted.</p>'};
 return true;
}`;
 return `<div hidden itemscope itemtype="https://pagelove.org/AuthorizationRule"><meta itemprop="actor" content="*"><meta itemprop="resource" content="${resource}"><meta itemprop="method" content="DELETE"><meta itemprop="selector" content="#scores > li"><meta itemprop="action" content="Allow"></div>
<div hidden itemscope itemtype="https://pagelove.org/Trigger"><meta itemprop="resource" content="${resource}"><meta itemprop="method" content="DELETE"><div itemprop="action" itemscope itemtype="https://pagelove.org/JavaScript/Module"><script itemprop="source" type="module">${guard}</script></div></div>
<div hidden itemscope itemtype="https://pagelove.org/Processor"><meta itemprop="resource" content="${resource}"><meta itemprop="method" content="GET"><div itemprop="when" itemscope itemtype="https://pagelove.org/JavaScript/Module"><script itemprop="source" type="module">export default ctx => [...String(ctx.response.body).matchAll(/itemprop="expiresAt" content="([0-9]{13})"/g)].some(m=>Number(m[1])<Date.now());</script></div><div itemprop="action" itemscope itemtype="https://pagelove.org/HttpRequest"><meta itemprop="url" content="${origin+resource}"><meta itemprop="method" content="DELETE"><meta itemprop="retry" content="1"><div itemprop="header" itemscope itemtype="https://pagelove.org/Pair"><meta itemprop="key" content="Range"><div itemprop="value" itemscope itemtype="https://pagelove.org/JavaScript/Module"><script itemprop="source" type="module">export default () => 'selector=#scores > li:has(meta[itemprop="expiresAt"]:value-less-than("'+Date.now()+'"))';</script></div></div></div></div>`;
}


