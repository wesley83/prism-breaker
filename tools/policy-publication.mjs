import {DOMParser} from 'linkedom';
import {htmlIdentity} from './publish-release.mjs';

export function scorePolicyIdentity(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const policies = [...doc.querySelectorAll('body > [itemscope]')].filter(n=>n.getAttribute('itemtype')?.startsWith('https://pagelove.org/'));
  if (!policies.length) throw Error('Missing native score policy');
  return htmlIdentity(Buffer.from('<html><head></head><body>'+policies.map(n=>n.outerHTML).join('')+'</body></html>'));
}
export function assertUnchangedScorePolicy(live, candidate) {
  const before=scorePolicyIdentity(live),after=scorePolicyIdentity(candidate);
  if(before!==after)throw Error('Native score rules changed. Publication is blocked until a supported safe activation/readiness procedure is established; successful warm-up requests are not an activation guarantee.');
  return {unchanged:true,sha256:before};
}
