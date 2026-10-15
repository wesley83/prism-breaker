# PWA robustness review

## PWA-R01 — Plan before implementation

- UTC: 2026-10-15T00:25:16Z
- Actor: Codex
- Request: Exhaustively check PWA code for robustness and search the web for best practices.
- Plan: Review service-worker install/activation, release isolation, cache integrity/eviction, offline routes, update UI, manifest/fullscreen/install behavior, IndexedDB queue durability and recovery, production response headers and deployment ordering. Consult primary browser guidance. Add regression tests for reproducible gaps, implement scoped corrections, regenerate assets, run all tests and isolated browser update/offline scenarios. Record limitations, source references, hashes and a reviewable patch; mirror scoped files to the authoring tree. Do not claim physical-device or production execution for local checks.
- Candidate problems to reproduce: marker-only readiness after partial eviction; old-client release fallback after cache loss; unbounded network download; malformed cache metadata interrupting activation; repair/controller races; reconnect readiness recovery; install button reappearing; manual retry blocked by the connectivity hint. Correct stale manifest world count and documentation where confirmed.
- Affected files (planned): tools/service-worker.template.js, public/pwa.js, public/offline.js, public/manifest.webmanifest, generated PWA files, corresponding tests, local update-lab tools if needed, README.md, PWA-UPGRADE.md, review report and audit evidence.
- Verification: Pending. Source inspection and web research only so far. No production mutation authorized by this plan; determine release status explicitly in the final report.
- Initial state: Local HEAD 28bcc65; working tree clean. Live release previously read as ee6a8edb8f4578dd9b0b; repeat live reads in this review. Honcho tools unavailable in current tool inventory.

## PWA-R02 — Reproduction and first correction batch

- UTC: 2026-10-15T00:33:00Z (recorded after the batch; approximate minute)
- Actor: Codex; reference PWA-R01.
- Reproductions: Seven new worker tests failed on the original implementation (including a stalled download timing out the test); four client tests failed; two queue/IndexedDB tests failed. Existing tests continued to pass. These failures establish partial-cache false readiness, unsafe release fallback, malformed metadata/storage activation failures, unbounded network waits, stale repair replies, missing reconnect recovery, install-state regression, manual retry blocked by onLine, and stale database-close invalidation.
- Changes: Inventory readiness, persistent release identity independent of cache presence, bounded page identity handshake, fresh-navigation network recovery, 20-second asset/75-second release abort deadlines, tolerant metadata cleanup, repair before explicit activation, generation-guarded UI repair, foreground/reconnect inspection, installed flag, manual forced score send despite connectivity hints, database connection identity guard, corrected sixteen-world manifest copy. Kept automatic queue retries subject to connectivity hints and backoff.
- Files: Worker template, public/pwa.js, offline.js, app.js, manifest.webmanifest, generated index/pwa-release/sw, three regression test files.
- Verification: 52 focused tests pass; complete suite 117 tests across 12 files passes. Initial regenerated release 7eb3e1d1a847c9078f3c (intermediate, not deployed). Additional tests cover waiting-cache loss and repair, fresh network module loading, and owned-cache retention.
- Exceptions: A Windows rg glob and a nonexistent storage.js read failed harmlessly; subsequent searches used directory + -g and app.js where storage actually resides. No external mutation.
- Next batch plan: Extend isolated update lab with visible cache-loss/recovery diagnostics; verify real browser update, failed install, multi-tab pinning, cached relaunch and durable queue/preferences. Read public production headers and manifests without changing live state. Final hashes, patch and report pending.

## PWA-R03 — Browser and live findings; startup identity plan refinement

- UTC: 2026-10-15T00:35:00Z (recorded after browser checks; approximate minute)
- Actor: Codex; reference PWA-R01/R02.
- Browser evidence: Migrated a previously cached eight-world lab release to the revised sixteen-world release. Failed B install preserved A and showed Retry download. Retrying downloaded B; explicit B activation succeeded with server responses forced to 503. A second tab remained pinned to A and fetched A's version module under B's controller. Partial scene-cache deletion reported ready=false; reconnect handler repaired it. With the local server process stopped entirely, page reload and Daily Challenge world 13 launch succeeded. Checkpoint, Classic Mode and one preexisting disposable queued score survived. Evidence saved in browser JSON and PNG.
- Live read: 70/70 public inventory assets verified; release ee6a8edb8f4578dd9b0b, fullscreen manifest, linked release-marked home, JavaScript MIME correct. Worker Cache-Control public/max-age=300, registration already uses updateViaCache:none. No live edits.
- Plan refinement: Prefer the HTML document's release marker to an independently HTTP-cached version module. New test reproduced an erroneous update offer/version handshake when the module is stale. Add this correction, manifest/asset contract checks, final documentation and rerun after regeneration.
- Tool exception: Python was absent from PATH; the attempted update-lab edit did not run. Stopped the just-started old lab server, applied the edit with Bun, and restarted. No install or environment change.

## PWA-R04 — Final verification and reconciliation

- UTC: 2026-10-15T00:40:20Z
- Actor: Codex; reference PWA-R01 through PWA-R03.
- Final corrections: HTML release-marker precedence; explicit download retry also ignores false onLine hints (new test failed first, then passed); unexpected optional static requests cannot invalidate a complete cache. Added quota, legacy-marker, icon/manifest and literal module-inventory contracts. Bumped changed entry import query versions. Updated README, PWA-UPGRADE and the detailed PWA-ROBUSTNESS-REVIEW report.
- Final verification: 125 tests pass across 13 files, zero failures, 24 tests added from the 101-test baseline. Build check passes for 5408c3b2c91090457ef8, 70 assets / 2,412,780 bytes. git diff --check passes. Browser final-source lab release 48a05177033cc02d79c9 activated, retained checkpoint/preferences/queue, reloaded with the server stopped and opened the Daily Challenge. Final captured browser error log was empty. Temporary test tabs were closed and the local server stopped.
- Evidence: pwa-tests.txt, browser-evidence.json, offline-proof.png, live-receipt.json under this dated audit prefix; implementation patch and SHA-256 manifest accompany the final file set. Runtime diff reviewed against the original plan; generated artifacts correspond to template/source changes. No credentials or production score payloads were used in this review.
- Publication boundary: Local corrections only. No deployment or push. The previously verified live release remains ee6a8edb8f4578dd9b0b. Physical Android/iOS, Safari/Firefox runtime testing and OS storage-pressure/termination scenarios remain unverified; sequential first-visit publication window and platform DAV limitations are documented separately.
- Finalization plan: Generate a reviewable source/docs/test patch, save hashes, copy only this review's changed files into the authoring mirror and verify byte equality, then commit locally. The hash receipt records the actual mirror result. Earlier audit-only commit 28bcc65 is preserved.

## PWA-R05 — Evidence packaging correction

- UTC: 2026-10-15T00:41:00Z (approximate minute, recorded immediately after packaging)
- Actor: Codex; reference PWA-R04.
- Result: All 23 change/evidence files were mirrored with byte equality and existing authoring files were checked against HEAD before replacement. The new receipt was also mirrored.
- Packaging exception: Git's whitespace check interpreted the saved patch's blank context lines (the standard single-space diff prefix) as trailing whitespace in the patch artifact. Source files passed. Regenerated the review patch with zero context, preserving its exact change records without those context-only lines; refreshed hashes and mirrored the corrected audit/evidence. No runtime change.
