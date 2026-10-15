import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {createHash, webcrypto} from 'node:crypto';
import {buildPwa} from '../tools/build-pwa.mjs';

const template = await fs.readFile(new URL('../tools/service-worker.template.js', import.meta.url), 'utf8');
const origin = 'https://prism.example';
const versionA = 'a'.repeat(20), versionB = 'b'.repeat(20);
const cachePrefix = 'prism-breaker-release-';
const sha256 = body => createHash('sha256').update(body).digest('hex');
const key = request => typeof request === 'string' ? request : request.url;

class MemoryCache {
  entries = new Map();
  async put(request, response) { this.entries.set(key(request), response.clone()); }
  async match(request) { return this.entries.get(key(request))?.clone(); }
  async keys() { return [...this.entries.keys()].map(url => new Request(url)); }
  async delete(request) { return this.entries.delete(key(request)); }
}
class MemoryCacheStorage {
  entries = new Map();
  async open(name) { if (!this.entries.has(name)) this.entries.set(name, new MemoryCache()); return this.entries.get(name); }
  async match(request, {cacheName}) { return this.entries.get(cacheName)?.match(request); }
  async keys() { return [...this.entries.keys()]; }
  async delete(name) { return this.entries.delete(name); }
}

function worker({version = versionA, caches = new MemoryCacheStorage(), missing = '', broken = '', windows = [], removedLazy = false, hanging = ''} = {}) {
  const index = '<!doctype html><html><head><meta name="prism-release" content="' + version + '"></head></html>';
  const resources = new Map([['/index.html', index], ['/app.js', 'export const release = "' + version + '";'], ...(removedLazy ? [] : [['/lazy.js', 'export const lazy = "' + version + '";']])]);
  const assets = [...resources].map(([path, body]) => ({path, sha256: sha256(body)}));
  const listeners = new Map(), fetched = [], timers = new Map(); let timerId = 0;
  let skipped = 0, claimed = 0;
  const self = {location: {origin}, addEventListener: (type, callback) => listeners.set(type, callback), skipWaiting: async () => { skipped++; }, clients: {get: async id => windows.find(client => client.id === id), matchAll: async () => windows, claim: async () => { claimed++; }}};
  const fetch = async (request, options = {}) => {
    const pathname = new URL(typeof request === 'string' ? request : request.url).pathname; fetched.push(pathname);
    if (pathname === missing) throw new TypeError('Offline');
    if (pathname === hanging) return new Promise((resolve, reject) => { if (options.signal?.aborted) reject(options.signal.reason); else options.signal?.addEventListener('abort', () => reject(options.signal.reason), {once:true}); });
    const resource = pathname === '/' ? '/index.html' : pathname;
    const body = pathname === broken ? 'wrong deployment bytes' : resources.get(resource);
    return new Response(body ?? 'Missing', {status: resources.has(resource) ? 200 : 404, headers: {'Content-Type': resource.endsWith('.html') ? 'text/html; charset=utf-8' : 'text/javascript'}});
  };
  class Channel { constructor() { this.port1 = {close(){}, onmessage:null}; this.port2 = {postMessage:data => this.port1.onmessage?.({data})}; } }
  vm.runInNewContext(template.replace('// __PWA_CONSTANTS__', 'const VERSION = ' + JSON.stringify(version) + '; const PRECACHE = ' + JSON.stringify(assets) + ';'), {self, caches, fetch, crypto: webcrypto, URL, Response, Uint8Array, console, AbortController, MessageChannel:Channel, setTimeout:(fn,ms)=>{const id=++timerId;timers.set(id,{fn,ms});return id;}, clearTimeout:id=>timers.delete(id)});
  return {
    caches, fetched, resources, get skipped() { return skipped; }, get claimed() { return claimed; },
    timeout(ms) { for(const [id,timer] of [...timers]) if(timer.ms===ms){timers.delete(id);timer.fn();} },
    async dispatch(type, props = {}) {
      const waits = []; let response;
      listeners.get(type)({...props, waitUntil: promise => waits.push(promise), respondWith: promise => { response = promise; }});
      await Promise.all(waits);
      return response ? await response : undefined;
    },
    async message(type, {id = 'tab-a', version: clientVersion = version} = {}) {
      let reply;
      await this.dispatch('message', {data: {type, version: clientVersion}, source: {id}, ports: [{postMessage: data => { reply = data; }}]});
      return reply;
    },
    async request(pathname, {id = 'tab-a', navigation = false, resultingClientId = '', method = 'GET', headers = {}} = {}) {
      return this.dispatch('fetch', {request: {url: origin + pathname, method, headers: new Headers(headers), mode: navigation ? 'navigate' : 'cors'}, clientId: id, resultingClientId});
    }
  };
}

test('an incomplete or mismatched download never becomes offline-ready and leaves the previous release intact', async () => {
  const old = worker(); await old.dispatch('install');
  for (const failure of [{missing: '/lazy.js'}, {broken: '/app.js'}, {broken: '/index.html'}]) {
    const next = worker({version: versionB, caches: old.caches, ...failure});
    await assert.rejects(next.dispatch('install'));
    assert.ok((await old.caches.keys()).includes(cachePrefix + versionA));
    assert.ok(!(await old.caches.keys()).includes(cachePrefix + versionB));
    assert.equal(next.skipped, 0);
  }
});

test('offline deep-link navigation and versioned/unversioned lazy imports come from the complete release', async () => {
  const instance = worker(); await instance.dispatch('install');
  const downloads = instance.fetched.length;
  const page = await instance.request('/?leaderboard=daily', {navigation: true, resultingClientId: 'daily-tab'});
  assert.match(await page.text(), new RegExp(versionA));
  assert.equal(await (await instance.request('/lazy.js?v=99', {id: 'daily-tab'})).text(), instance.resources.get('/lazy.js'));
  assert.equal(await (await instance.request('/lazy.js', {id: 'daily-tab'})).text(), instance.resources.get('/lazy.js'));
  assert.equal(instance.fetched.length, downloads);
  assert.equal((await instance.message('GET_STATUS', {id: 'daily-tab'})).ready, true);
});

test('selector requests, score reads, writes and cross-origin requests never enter the static cache handler', async () => {
  const instance = worker(); await instance.dispatch('install');
  for (const [pathname, options] of [['/scores.html?cb=1', {}], ['/worlds.html?v=2', {}], ['/worlds/prism-garden/definition.html', {}], ['/editor/prism-garden', {}], ['/app.js', {headers: {Range: 'selector=#scores'}}], ['/scores.html', {method: 'POST'}], ['/app.js', {method: 'POST'}]]) {
    assert.equal(await instance.request(pathname, options), undefined);
  }
  assert.equal(await instance.dispatch('fetch', {request: {url: 'https://other.example/app.js', method: 'GET', headers: new Headers(), mode: 'cors'}}), undefined);
});
test('a live workshop can opt its own client into network assets without unpinning an active game',async()=>{
 const instance=worker();await instance.dispatch('install');await instance.message('CLIENT_VERSION',{id:'active-game'});
 instance.resources.set('/editor.js','new editor');instance.resources.set('/app.js','new game on network');
 assert.equal((await instance.request('/editor.js',{id:'workshop'})).status,503);
 assert.equal((await instance.message('CLIENT_VERSION',{id:'workshop',version:'network'})).ready,true);
 assert.equal(await(await instance.request('/editor.js',{id:'workshop'})).text(),'new editor');
 assert.match(await(await instance.request('/app.js',{id:'active-game'})).text(),new RegExp(versionA));
});

test('updates wait for explicit consent, then retain old client assets across worker restarts', async () => {
  const first = worker(); await first.dispatch('install'); await first.message('CLIENT_VERSION');
  const second = worker({version: versionB, caches: first.caches, windows: [{id: 'tab-a'}], removedLazy: true});
  await second.dispatch('install'); assert.equal(second.skipped, 0);
  await second.message('SKIP_WAITING'); assert.equal(second.skipped, 1);
  await second.dispatch('activate'); assert.equal(second.claimed, 1);
  assert.match(await (await second.request('/app.js')).text(), new RegExp(versionA));
  assert.match(await (await second.request('/lazy.js')).text(), new RegExp(versionA));
  const restarted = worker({version: versionB, caches: first.caches, removedLazy: true});
  assert.match(await (await restarted.request('/app.js')).text(), new RegExp(versionA));
  await restarted.request('/', {navigation: true, resultingClientId: 'tab-b'});
  assert.match(await (await restarted.request('/app.js', {id: 'tab-b'})).text(), new RegExp(versionB));
});

test('missing cached modules fail without mixing a newer network module into a running game', async () => {
  const instance = worker(); await instance.dispatch('install');
  const cache = await instance.caches.open(cachePrefix + versionA);
  await cache.delete(origin + '/lazy.js');
  const downloads = instance.fetched.length;
  assert.equal((await instance.request('/lazy.js')).status, 503);
  assert.equal(instance.fetched.length, downloads);
});

test('storage eviction permits a fresh online navigation and repairs the unchanged worker release', async () => {
  const instance = worker(); await instance.dispatch('install'); await instance.message('CLIENT_VERSION');
  await instance.caches.delete(cachePrefix + versionA);
  assert.equal((await instance.request('/app.js')).status, 503);
  assert.equal((await instance.request('/', {navigation: true, resultingClientId: 'fresh-tab'})).status, 200);
  assert.equal((await instance.message('GET_STATUS', {id: 'fresh-tab'})).ready, false);
  assert.match(await (await instance.request('/app.js', {id: 'fresh-tab'})).text(), new RegExp(versionA));
  assert.equal((await instance.message('REPAIR_CACHE', {id: 'fresh-tab'})).ready, true);
  const downloads = instance.fetched.length;
  assert.match(await (await instance.request('/lazy.js', {id: 'fresh-tab'})).text(), new RegExp(versionA));
  assert.equal(instance.fetched.length, downloads);
});

test('concurrent repair requests share one complete download', async () => {
  const instance = worker(); await instance.dispatch('install');
  await instance.caches.delete(cachePrefix + versionA);
  const downloads = instance.fetched.length;
  const results = await Promise.all([instance.message('REPAIR_CACHE', {id: 'a'}), instance.message('REPAIR_CACHE', {id: 'b'})]);
  assert.ok(results.every(result => result.ready));
  assert.equal(instance.fetched.length - downloads, instance.resources.size);
});

test('readiness checks the asset inventory even if the completion marker survived eviction', async () => {
  const instance=worker();await instance.dispatch('install');
  await (await instance.caches.open(cachePrefix+versionA)).delete(origin+'/lazy.js');
  assert.equal((await instance.message('CLIENT_VERSION')).ready,false);
  assert.equal((await instance.message('REPAIR_CACHE')).ready,true);
  assert.ok(await instance.caches.match(origin+'/lazy.js',{cacheName:cachePrefix+versionA}));
});

test('a restarted newer worker never repins an old tab whose entire release was evicted', async () => {
  const old=worker();await old.dispatch('install');await old.message('CLIENT_VERSION');
  const next=worker({version:versionB,caches:old.caches});await next.dispatch('install');
  await old.caches.delete(cachePrefix+versionA);
  const restarted=worker({version:versionB,caches:old.caches});
  assert.equal((await restarted.request('/app.js')).status,503);
  assert.equal((await restarted.message('GET_STATUS')).clientVersion,versionA);
});

test('unknown client identity fails closed; a responsive page can restore its exact release pin',async()=>{
  const old=worker();await old.dispatch('install');
  const next=worker({version:versionB,caches:old.caches,windows:[{id:'old-tab',postMessage(message,ports){ports[0].postMessage({version:versionA});}}]});
  await next.dispatch('install');
  assert.equal((await next.request('/app.js',{id:'unknown'})).status,503);
  assert.match(await(await next.request('/app.js',{id:'old-tab'})).text(),new RegExp(versionA));
});

test('a partial entry cache uses fresh network navigation rather than booting a broken release',async()=>{
  const instance=worker();await instance.dispatch('install');
  await(await instance.caches.open(cachePrefix+versionA)).delete(origin+'/app.js');
  const count=instance.fetched.length;
  assert.equal((await instance.request('/',{navigation:true,resultingClientId:'fresh'})).status,200);
  assert.equal(instance.fetched.length,count+1);
  assert.equal((await instance.message('GET_STATUS',{id:'fresh'})).clientVersion,'network');
});

test('malformed pin and completion metadata cannot prevent worker activation or report readiness',async()=>{
  const instance=worker({windows:[{id:'tab-a'}]});await instance.dispatch('install');
  await(await instance.caches.open('prism-breaker-client-pins-v1')).put(origin+'/__prism_pwa_client__/tab-a',new Response('{broken'));
  await(await instance.caches.open(cachePrefix+versionA)).put(origin+'/__prism_pwa_complete__',new Response('{broken'));
  await instance.dispatch('activate');assert.equal(instance.claimed,1);
  assert.equal((await instance.message('CLIENT_VERSION')).ready,false);
});

test('cache storage failure still permits online navigation without claiming offline readiness',async()=>{
  const caches={async match(){throw Error('Storage unavailable');},async open(){throw Error('Storage unavailable');},async keys(){throw Error('Storage unavailable');}};
  const instance=worker({caches});await instance.dispatch('activate');assert.equal(instance.claimed,1);
  assert.equal((await instance.request('/',{navigation:true,resultingClientId:'online'})).status,200);
  assert.equal((await instance.message('GET_STATUS',{id:'online'})).ready,false);
  assert.equal((await instance.request('/app.js',{id:'online'})).status,200);
});

test('a stalled asset aborts the download and removes the incomplete cache',async()=>{
  const instance=worker({hanging:'/lazy.js'});
  const install=instance.dispatch('install');const rejection=assert.rejects(install,/timed out/i);
  for(let i=0;i<100&&!instance.fetched.includes('/lazy.js');i++)await new Promise(resolve=>setTimeout(resolve,1));
  instance.timeout(20000);await rejection;
  assert.ok(!(await instance.caches.keys()).includes(cachePrefix+versionA));
});

test('fresh network pages keep loading network modules until repair is complete',async()=>{
  const instance=worker();await instance.dispatch('install');await instance.caches.delete(cachePrefix+versionA);
  await instance.request('/',{navigation:true,resultingClientId:'fresh'});
  assert.equal((await instance.message('CLIENT_VERSION',{id:'fresh'})).ready,false);
  assert.equal((await instance.request('/app.js',{id:'fresh'})).status,200);
  await instance.message('REPAIR_CACHE',{id:'fresh'});
  assert.equal((await instance.message('GET_STATUS',{id:'fresh'})).clientVersion,versionA);
});

test('activation repairs a waiting release that lost an asset, but refuses it if repair fails',async()=>{
  const instance=worker();await instance.dispatch('install');
  await(await instance.caches.open(cachePrefix+versionA)).delete(origin+'/lazy.js');
  await instance.message('SKIP_WAITING');assert.equal(instance.skipped,1);
  await(await instance.caches.open(cachePrefix+versionA)).delete(origin+'/lazy.js');instance.resources.delete('/lazy.js');
  await instance.message('SKIP_WAITING');assert.equal(instance.skipped,1);
});

test('cleanup retains live and previous releases and never touches unrelated caches',async()=>{
  const first=worker();await first.dispatch('install');await first.message('CLIENT_VERSION',{id:'playing'});
  const second=worker({version:versionB,caches:first.caches});await second.dispatch('install');
  const third=worker({version:'c'.repeat(20),caches:first.caches,windows:[{id:'playing'}]});await third.dispatch('install');
  await first.caches.open('unrelated-app');await third.dispatch('activate');
  assert.ok((await first.caches.keys()).includes(cachePrefix+versionA));
  assert.ok((await first.caches.keys()).includes('unrelated-app'));
  const fourth=worker({version:'d'.repeat(20),caches:first.caches});await fourth.dispatch('install');await fourth.dispatch('activate');
  assert.equal((await first.caches.keys()).filter(name=>name.startsWith(cachePrefix)).length,2);
  assert.ok((await first.caches.keys()).includes('unrelated-app'));
});

test('an unknown optional static request cannot invalidate a complete game cache',async()=>{
  const instance=worker();await instance.dispatch('install');await instance.message('CLIENT_VERSION');
  assert.equal((await instance.request('/optional-icon.png')).status,503);
  assert.equal((await instance.message('GET_STATUS')).ready,true);
});

test('quota failure cannot leave a new ready marker or delete a previous release',async()=>{
  const old=worker();await old.dispatch('install');const cache=await old.caches.open(cachePrefix+versionB);
  cache.put=async()=>{throw Error('QuotaExceededError');};
  const next=worker({version:versionB,caches:old.caches});await assert.rejects(next.dispatch('install'),/Quota/);
  assert.equal((await old.message('GET_STATUS',{id:''})).ready,true);
  assert.ok(!(await old.caches.keys()).includes(cachePrefix+versionB));
});

test('legacy count-only completion markers still detect lost assets',async()=>{
  const old=worker();await old.dispatch('install');await old.message('CLIENT_VERSION');
  const cache=await old.caches.open(cachePrefix+versionA),marker=await(await cache.match(origin+'/__prism_pwa_complete__')).json();delete marker.paths;
  await cache.put(origin+'/__prism_pwa_complete__',new Response(JSON.stringify(marker)));
  const next=worker({version:versionB,caches:old.caches});assert.equal((await next.message('GET_STATUS')).ready,true);
  await cache.delete(origin+'/lazy.js');assert.equal((await next.message('GET_STATUS')).ready,false);
});

test('builds are deterministic and deployment validation catches edits made after the build', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'prism-pwa-'));
  try {
    await fs.mkdir(path.join(root, 'public')); await fs.mkdir(path.join(root, 'tools'));
    await fs.writeFile(path.join(root, 'tools/service-worker.template.js'), template);
    await fs.writeFile(path.join(root, 'public/index.html'), '<!doctype html><html><head><title>Prism</title></head></html>');
    await fs.writeFile(path.join(root, 'public/app.js'), 'export const score = 1;');
    const first = await buildPwa({root}); const next = await buildPwa({root});
    assert.equal(first.version, next.version);
    assert.equal((await buildPwa({root, check: true})).version, first.version);
    await fs.writeFile(path.join(root, 'public/app.js'), 'export const score = 2;');
    await assert.rejects(buildPwa({root, check: true}), /Stale PWA build/);
    assert.notEqual((await buildPwa({root})).version, first.version);
  } finally {
    if (path.dirname(path.resolve(root)) !== path.resolve(os.tmpdir()) || !path.basename(root).startsWith('prism-pwa-')) throw new Error('Refusing to delete outside the test temporary directory');
    await fs.rm(root, {recursive: true, force: true});
  }
});
