import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {buildPwa} from '../tools/build-pwa.mjs';
import {runReleaseGate,assertReleaseGate,validateReceipt} from '../tools/release-gate.mjs';
import {checkRepository} from '../tools/repository-check.mjs';
async function fixture(t){
 const base=new URL('../test-results/',import.meta.url);await fs.mkdir(base,{recursive:true});const root=await fs.mkdtemp(path.join(fileURLToPath(base),'gate-review-'));
 // Preserve fixtures as ignored evidence; no recursive deletion or shared Git mutation.
 for(const dir of ['public','tools','tests'])await fs.mkdir(path.join(root,dir));
 await fs.mkdir(path.join(root,'review'));await fs.writeFile(path.join(root,'review/requirements.html'),'<main id="requirements" data-version="1"><article id="fixture-suite" itemscope itemtype="urn:PrismBreaker:Requirement" data-kind="suite"></article></main>');
 for(const [name,body]of [['public/index.html','<!doctype html><html><head></head><body>Fixture</body></html>'],['public/app.js','export const fixture=true;'],['tools/service-worker.template.js','// __PWA_CONSTANTS__'],['package.json','{"type":"module"}'],['bun.lock','{}'],['README.md','# Fixture\n']])await fs.writeFile(path.join(root,name),body);
 const init=spawnSync('git',['init'],{cwd:root});assert.equal(init.status,0);
 // Empty tree commit gives the fixture a stable source identity without changing this repo.
 const commit=spawnSync('git',['-c','user.name=Review fixture','-c','user.email=fixture@example.invalid','commit','--allow-empty','-m','fixture'],{cwd:root});assert.equal(commit.status,0,commit.stderr?.toString());
 await buildPwa({root});spawnSync('git',['add','.'],{cwd:root});const saved=spawnSync('git',['-c','user.name=Review fixture','-c','user.email=fixture@example.invalid','commit','-m','source'],{cwd:root});assert.equal(saved.status,0);return root;
}
test('R01 a failing suite invalidates an existing approval and blocks the publisher gate',async t=>{
 const root=await fixture(t);await runReleaseGate({root,runSuite:async()=>({status:0})});await assertReleaseGate({root});
 await assert.rejects(runReleaseGate({root,runSuite:async()=>({status:1,stderr:'deliberate failure'})}),/suite failed/);
 await assert.rejects(assertReleaseGate({root}),/stale release evidence/);
});
test('R01 stale generated assets and post-check source changes independently block release',async t=>{
 const root=await fixture(t);await runReleaseGate({root,runSuite:async()=>({status:0})});
 await fs.appendFile(path.join(root,'public/app.js'),'\n// edit');await assert.rejects(runReleaseGate({root,runSuite:async()=>({status:0})}),/Stale PWA/);
 await buildPwa({root});spawnSync('git',['add','.'],{cwd:root});spawnSync('git',['-c','user.name=Review fixture','-c','user.email=fixture@example.invalid','commit','-m','updated source'],{cwd:root});await runReleaseGate({root,runSuite:async()=>({status:0})});await assertReleaseGate({root});
 await fs.appendFile(path.join(root,'tools/service-worker.template.js'),'\n// worker edit');await assert.rejects(assertReleaseGate({root}),/Stale PWA/);
});
test('R01 receipt rejects wrong commits, digests, release identities, missing checks and expired approval',()=>{
 const now=Date.now(),identity={commit:'a',digest:'b'},receipt={schema:1,passed:true,identity,release:'c',completedAt:new Date(now).toISOString(),checks:{suite:true,pwa:true,repository:true,requirements:true}};
 assert.equal(validateReceipt(receipt,{identity,release:'c',now}),true);
 for(const value of [{...receipt,identity:{...identity,commit:'wrong'}},{...receipt,identity:{...identity,digest:'wrong'}},{...receipt,release:'wrong'},{...receipt,checks:{}},{...receipt,completedAt:new Date(now-86400001).toISOString()}])assert.throws(()=>validateReceipt(value,{identity,release:'c',now}));
});
test('R01 local link/module failures and credential patterns fail without exposing the value',async t=>{
 const root=await fixture(t);await fs.writeFile(path.join(root,'README.md'),'[Missing](missing.md)');await assert.rejects(checkRepository({root}),/missing missing.md/);
 await fs.writeFile(path.join(root,'README.md'),'# Safe');await fs.writeFile(path.join(root,'public/app.js'),"import './missing.js';");await assert.rejects(checkRepository({root}),/missing module/);
 await fs.writeFile(path.join(root,'public/app.js'),'const secret="'+'pk_'+'a'.repeat(40)+'";');await assert.rejects(checkRepository({root}),e=>e.message.includes('value suppressed')&&!e.message.includes('a'.repeat(40)));
});
test('R01 an actual failing Bun test cannot create approval, and dirty documents block deployment',async t=>{
 const root=await fixture(t);await fs.writeFile(path.join(root,'tests/deliberate.test.mjs'),"import {test} from 'bun:test'; test('deliberate release refusal',()=>{throw Error('intentional fixture failure');});");
 spawnSync('git',['add','.'],{cwd:root});spawnSync('git',['-c','user.name=Review fixture','-c','user.email=fixture@example.invalid','commit','-m','negative suite'],{cwd:root});
 await assert.rejects(runReleaseGate({root}),/suite failed/);await assert.rejects(assertReleaseGate({root}),/stale release evidence/);
 const clean=await fixture(t);await runReleaseGate({root:clean,runSuite:async()=>({status:0})});await fs.appendFile(path.join(clean,'README.md'),'\nChanged after review');await assert.rejects(assertReleaseGate({root:clean}),/Commit release inputs/);
});
