// One installation boundary for root and nested deployments. Asset URLs remain
// release-pinned by the builder; application/data routes stay on this mount.
export function installationBase(url=import.meta.url){
 const pathname=new URL(url).pathname;
 const release=pathname.match(/^(.*\/)releases\/[a-f0-9]{20}\//);
 return release?release[1]:pathname.slice(0,pathname.lastIndexOf('/')+1);
}
export const APP_BASE=new URL(import.meta.url).protocol==='file:'?'/':installationBase();
export const appPath=path=>APP_BASE+String(path).replace(/^\//,'');
export const editorPath=slug=>appPath('editor.html?world='+encodeURIComponent(slug));
export function authoringOrigin(origin=globalThis.location?.origin||'https://sane-guild-8399.onpagelove.com'){
 const url=new URL(origin);
 if(url.protocol!=='https:'||!/^[-a-z0-9]+\.onpagelove\.com$/.test(url.hostname)||url.hostname.startsWith('dav-'))throw Error('World publishing requires this game’s Pagelove host.');
 return 'https://dav-'+url.hostname;
}
