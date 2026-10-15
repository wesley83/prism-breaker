import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import {assertUnchangedScorePolicy} from '../tools/policy-publication.mjs';
import {acceptancePlan,reviewStatus} from '../tools/acceptance-status.mjs';
test('native policy edits are blocked independently of preserved score records',async()=>{
 const original=await fs.readFile('public/scores.html','utf8');assert.equal(assertUnchangedScorePolicy(original,original).unchanged,true);
 assert.equal(assertUnchangedScorePolicy(original.replace('<ul id="scores"></ul>','<ul id="scores"><li>Record</li></ul>'),original).unchanged,true);
 assert.throws(()=>assertUnchangedScorePolicy(original,original.replace('content="Allow"','content="Deny"')),/Publication is blocked/);
 assert.throws(()=>assertUnchangedScorePolicy('<html><body>No policy</body></html>',original),/Missing native score policy/);
});
test('pending acceptance remains incomplete and fabricated automatic device passes are rejected',async()=>{
 const plan=await acceptancePlan(),release='a'.repeat(20),record={schema:1,planSha256:plan.sha256,release,checks:plan.checks.map(c=>({id:c.id,status:'not-run'}))};
 assert.equal(reviewStatus(plan,record,release).complete,false);assert.equal(reviewStatus(plan,record,release).counts['not-run'],14);
 record.checks[0]={...record.checks[0],status:'pass',actor:'Codex automation'};assert.throws(()=>reviewStatus(plan,record,release),/Observed human/);
 assert.throws(()=>reviewStatus(plan,record,'b'.repeat(20)),/different plan/);
});
