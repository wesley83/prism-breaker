import {WORLDS,RULESET_REVISION} from './levels.js';
// Frozen compatibility boundary for saves/scores produced before revision tracking.
export const LEGACY_RULESET_REVISION='ea3ef3d4e217bb394db6f5e3d9e73dd49512b01091ab39ec40cc740a3a3089dd';
export function checkpointLevel(snapshot){return WORLDS.findIndex(w=>snapshot?.version===2?w.id===snapshot.worldId:w.legacyIndex===snapshot?.level);}
export const compatibleRuleset=revision=>(revision||LEGACY_RULESET_REVISION)===RULESET_REVISION;
export function editorSlug(path,query=''){
 const matched=path.match(/^\/editor\/([a-z0-9-]+)\/?$/);
 if(matched)return matched[1];
 if(['/editor','/editor/','/editor.html','/editor/index.html'].includes(path))return new URLSearchParams(query).get('world')||WORLDS[0].slug;
 return null;
}
