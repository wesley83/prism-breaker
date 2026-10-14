# Final game acceptance checks — 2026-10-14

## E2E-01 — Plan

- UTC: 2026-10-14T20:55:47.3796108Z
- Actor: Codex
- Request: Final end-to-end check of all 16 worlds, score submission, daily rollover, and five-day score expiry.
- Plan: Inspect current tests and production code; run existing checks; verify live asset/world availability; exercise all world progression and endings in an isolated browser fixture; check score submission through disposable Pagelove resources using the production schema/rules; test UTC rollover and expiry boundaries with controlled inputs, including public server deletion and readback where possible. Record exact coverage and limits. Preserve player records. No production gameplay changes or deployment are planned.
- Affected files: new acceptance tests/fixture tooling and audit evidence/report as needed; prior DAV findings document remains pending.
- Verification: Pending. A browser fixture may accelerate gameplay; distinguish accelerated engine/scene coverage from manual playthrough and real elapsed-day observation.

## E2E-02 — Baseline and live score checks

- UTC: 2026-10-14T21:01:32.5750340Z
- Actor: Codex
- Reference: E2E-01.
- Changes: Added three lifecycle boundary tests, a local browser harness, and a live acceptance script. Network was refused inside the sandbox; reran the scoped script with approved network access. No gameplay source changes.
- Verification: Original 98 tests and PWA integrity pass. Three new boundary tests pass. Seven live modules match local hashes. All 16 live world documents validate. Actual public score POST returned 206 and persisted once; duplicate returned 422. Cleanup preserved 68 other runs. Disposable validation rejected malformed submissions and arbitrary expiry; unsafe deletion returned 403. All temporary resources removed (404 readback).
- Limitation/plan revision: An intermediate owner GET may itself trigger cleanup, so the initial expiry sequence does not isolate public DELETE behavior (it returned 416 after the expired row was already gone). Add a separate expiry probe with fresh reseeding immediately before DELETE, and a separate GET-driven cleanup sequence. No repeat production submission needed.
- Files: tests/acceptance-lifecycle.test.mjs; tools/final-live-check.mjs; tools/final-browser-fixture.mjs; audit/2026-10-14-final-live-check.json; upcoming tools/final-expiry-check.mjs and receipt.

## E2E-03 — Browser coverage and expiry probe revision

- UTC: 2026-10-14T21:04:10.2992040Z
- Actor: Codex; reference E2E-01/E2E-02.
- Browser: 16 world endings and all 20 formations traversed with accelerated direct damage, using real application progression/cutscene preparation/rendering. Campaign result and browser IndexedDB save completed against local fixture responses. No captured errors. Controlled UTC midnight swapped the daily board and preserved the old run day; that run saved successfully without appearing on the new-day board. A visible expired entry disappeared and triggered cleanup while the board stayed open.
- Failed/inconclusive attempt: The additional newly installed expiry probe initially accepted an unrestricted DELETE (204), then rejected future cutoff (403); explicit expiry DELETE returned 403 and a later seed conflicted (412). Temporary document removed and 404 confirmed. This cannot be reported as a pass. Fresh-policy propagation is a previously measured platform issue; the probe also used workstation time instead of the game's server-adjusted cutoff.
- Revised plan: Preserve initial receipt, use the server Date header for seeding/cutoffs, retry conditional fixture seeding on concurrent cleanup, and measure rejection readiness before probing actual expiry. Record warmup anomalies explicitly. Production player records remain untouched by these boundary probes.
- Affected files: tools/final-expiry-check.mjs and audit receipts. No production code edits.

## E2E-04 — Probe correction

- UTC: 2026-10-14T21:05:21.6698703Z; actor: Codex; reference E2E-03.
- Finding: Server Date was approximately 3.6 seconds behind the workstation during the second probe. A raw Date.now cutoff can therefore be rejected as a future cutoff; the real game already uses server-adjusted time.
- Failed check: Readiness on an empty container returned 416 because no selected rows existed, so it did not exercise the guard. All temporary resources were removed (404 confirmed).
- Revision: Seed unexpired controls before readiness checks. Preserve every readiness result and stop claiming success if any active control is removed. A fresh policy observation will be described separately from the long-lived production policy.
- Files: tools/final-expiry-check.mjs; audit/2026-10-14-final-expiry-empty-readiness.json.

## E2E-05 — Completed acceptance and documentation

- UTC: 2026-10-14T21:09:55.3070040Z; actor: Codex; reference E2E-01 through E2E-04 and user final-check request.
- Result: 101 tests pass across 12 files. PWA integrity remains release ee6a8edb8f4578dd9b0b (70 assets, 2,411,852 bytes). Browser campaign traversed 16 worlds/20 formations with accelerated damage; collision bots independently pass. Controlled UI midnight and expiry checks pass.
- Live browser: Normal Daily play ended at 300 points. Save transitioned Queued to Saved; leaderboard displayed QA-E2E-14B at rank 7. Conditional cleanup removed that exact run and preserved all 68 other records; refreshed UI confirmed absence. Browser error log empty.
- Isolated expiry: Final populated readiness controls returned 403 three times. Unsafe/future deletion rejected with both active controls retained. Server-clock expiry DELETE returned 204 and preserved active control. Independent GET cleanup removed expired row on subsequent read. Disposable document deletion/readback 204/404. Initial unsafe fresh-policy observation remains unresolved and documented; empty-selection and workstation-clock probe limitations are explicit.
- Findings: Activity-driven physical deletion, fresh-policy propagation risk, and cosmetic singular-life wording. No gameplay fix or deployment performed. Saved FINAL-ACCEPTANCE-REPORT.md and the previously requested DAV-INVESTIGATION-FINDINGS.md; linked follow-up from the original report.
- Files/evidence: Final acceptance report; three new lifecycle tests; four acceptance/cleanup tools; final-* JSON/TXT/PNG evidence; investigation addendum and prior diagnostic receipts/tool. Review patch and SHA-256 manifest accompany this log. No keys or private payloads recorded.
- Limits: No real five-day wait, midnight wait, or new mobile-device matrix. Browser campaign accelerated, collision tests replenish lives. Real browser live score was a normal losing Daily run. Test browser retains QA display-name preference and sent receipt. See report for full boundaries.
- Final reconciliation: Pending staged-diff review, hash manifest, authoring-copy sync, and local audit commit. No GitHub push requested.

## E2E-06 — Final diff reconciliation

- UTC: 2026-10-14T21:10:24.6596027Z; actor: Codex; reference E2E-05.
- Reviewed staged scope: 31 documentation/test/tool/evidence files, no production runtime assets or configuration. Staged whitespace check passed. All 101 tests and PWA integrity checks passed as recorded. All live QA records/resources have confirmed cleanup. No outstanding remote process remains.
- Evidence: audit/2026-10-14-final-changes.patch records the reviewed staged content; audit/2026-10-14-final-hashes.json records SHA-256 hashes of those files and the patch, excluding the hash manifest itself to avoid self-reference. Exact scoped files are synchronized to the authoring copy and hash-compared before the local commit.
- Completion: Acceptance review and requested investigation Markdown are complete. Remaining platform behaviors and exact deletion scheduling limitation are documented rather than claimed fixed. This is a local audit commit, not a release or remote push.

## E2E-07 — Evidence packaging note

- UTC: 2026-10-14T21:10:43.4465236Z; actor: Codex; reference E2E-06.
- Review: Including the review patch itself in git diff --check reports two expected single-space blank context lines embedded in that patch. Preserve the valid patch syntax; check the actual changes excluding the patch. Regenerate patch/hash evidence after this explanatory entry and repeat authoring-copy hash comparison. No source or test behavior changed.
