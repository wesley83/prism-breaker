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

function worker({version = versionA, caches = new MemoryCacheStorage(), missing = '', broken = '', windows = [], removedLazy = false} = {}) {
  const index = '<!doctype html><html><head><meta name="prism-release" content="' + version + '"></head></html>';
  const resources = new Map([['/index.html', index], ['/app.js', 'export const release = "' + version + '";'], ...(removedLazy ? [] : [['/lazy.js', 'export const lazy = "' + version + '";']])]);
  const assets = [...resources].map(([path, body]) => ({path, sha256: sha256(body)}));
  const listeners = new Map(), fetched = [];
  let skipped = 0, claimed = 0;
  const self = {location: {origin}, addEventListener: (type, callback) => listeners.set(type, callback), skipWaiting: async () => { skipped++; }, clients: {matchAll: async () => windows, claim: async () => { claimed++; }}};
  const fetch = async request => {
    const pathname = new URL(typeof request === 'string' ? request : request.url).pathname; fetched.push(pathname);
    if (pathname === missing) throw new TypeError('Offline');
    const resource = pathname === '/' ? '/index.html' : pathname;
    const body = pathname === broken ? 'wrong deployment bytes' : resources.get(resource);
    return new Response(body ?? 'Missing', {status: resources.has(resource) ? 200 : 404, headers: {'Content-Type': resource.endsWith('.html') ? 'text/html; charset=utf-8' : 'text/javascript'}});
  };
  vm.runInNewContext(template.replace('// __PWA_CONSTANTS__', 'const VERSION = ' + JSON.stringify(version) + '; const PRECACHE = ' + JSON.stringify(assets) + ';'), {self, caches, fetch, crypto: webcrypto, URL, Response, Uint8Array, console});
  return {
    caches, fetched, resources, get skipped() { return skipped; }, get claimed() { return claimed; },
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
  for (const failure of [{missing: '/lazy.js'}, {broken: '/app.js'}]) {
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
  for (const [pathname, options] of [['/scores.html?cb=1', {}], ['/worlds.html?v=2', {}], ['/app.js', {headers: {Range: 'selector=#scores'}}], ['/scores.html', {method: 'POST'}], ['/app.js', {method: 'POST'}]]) {
    assert.equal(await instance.request(pathname, options), undefined);
  }
  assert.equal(await instance.dispatch('fetch', {request: {url: 'https://other.example/app.js', method: 'GET', headers: new Headers(), mode: 'cors'}}), undefined);
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
