# Paddle collision and PWA update review

## PB-20261014-01 — Plan

- UTC: 2026-10-14T01:30:00Z (planning entry; exact execution times recorded in subsequent evidence).
- Actor: Codex, at Wesley's request to fix balls passing through the paddle and fully test Update game.
- Plan: reproduce moving-paddle misses; add continuous collision handling for the paddle's upper surface and sides without rescuing balls below the paddle. Preserve Sticky catch offsets and Wide expiry. Exercise the PWA client and worker through successful updates, failed downloads, retries, unsafe game states, activation races, offline activation, and multiple clients. Review real browser behavior using an isolated local release server, then deploy and verify the production update.
- Expected files: public/engine.js, public/pwa.js, tests/engine.test.mjs, new PWA client tests, worker tests if needed, generated release assets, documentation and this audit directory.
- Verification: pending. No implementation yet. Existing worker tests use a simulated Cache API; browser checks will separately cover actual service-worker lifecycle behavior. Physical Android/iOS installed-app checks may be unavailable and will be reported explicitly.
- Evidence: preserve baseline runtime files privately; record final source hashes and reviewable diff in the version-controlled audit directory. No credentials or leaderboard payloads will be recorded.

## PB-20261014-02 — Reproduction, fixes and interim checks

- UTC: 2026-10-14T01:33:41Z.
- Actor: Codex; reference PB-20261014-01 and the original user request.
- Timestamp correction: the first entry used a manually estimated 01:30 timestamp. It was written before the shell returned 01:25:59.540Z; 01:30 was not an observed clock reading. This correction preserves the original entry.
- Reproduced: four new paddle regressions failed against the original engine (moving paddle, upper side entry, pre-existing upper contact and Sticky side catch). The first moving-away test placed the ball just outside contact at the actual impact time; corrected x from -1.75 to -1.70 after calculating the trajectory. All intended regressions then passed with the fix; this was a test-fixture correction, not widened collision tolerances.
- Changed: public/engine.js now sweeps the ball relative to the paddle through its upper catching area, uses the paddle position at impact for rebound direction, and preserves the relative Sticky catch offset through the rest of the movement. Balls already below the paddle center are not rescued. The calculation avoids per-ball arrays/objects.
- Reproduced: five PWA client tests failed against the original client. Worker postMessage/callback errors escaped; activation timeout lacked an actionable message; a requested reload deferred by a newly started run did not resume at home; direct invocation of an unavailable action could reload unnecessarily.
- Changed: public/pwa.js catches activation/preparation errors, cleans timers, shows a retry message, blocks unavailable actions and duplicate reloads, rechecks safety after async preparation, finishes requested activation when safely back home, and ignores stale status replies. A late activation after an expired attempt still requires another explicit click. Failed downloads remain separate from activation errors.
- Affected tests: tests/paddle-collision.test.mjs, tests/pwa-client.test.mjs. Added tools/update-lab.mjs to exercise actual full-game releases in a loopback-only browser environment. The initial lab score seeder omitted the required send adapter; corrected and reloaded its baseline before gathering persistence evidence.
- Verification: initial complete suite passed 66/66; five additional boundary/race tests added afterward, pending final run. Existing eight-world collision bot passed. Browser verified release A ba8c9ed1787854bae74d to B 3ccaeb3395b8bb6d7a7e: failed asset download preserves A; retry produces a waiting B; active run disables Update game; another client activates B with all game network routes returning 503; old client remains pinned to A and playable; its own explicit update loads B. Checkpoint, Classic setting and one disposable IndexedDB score retained. This simulates unavailable network responses, not physical airplane mode.
- Release preparation: public/app.js import versions and public/index.html entry version bumped to avoid ordinary HTTP-cache reuse. Generated release build, final checks, deployment and live verification pending.

## PB-20261014-03 — Final verification and deployment

- UTC: 2026-10-14T01:37:00Z (entry records provider readback completed at 01:36:52.241Z and the subsequent live browser update).
- Actor: Codex; reference PB-20261014-01/02.
- Verification: final suite passed **71/71**, including 10 new paddle tests and 15 new client-update tests. Existing worker integrity, cache isolation, eviction recovery, score outbox and all-eight-world progression tests passed. `node tools/build-pwa.mjs --check` passed; final source diff reviewed and `git diff --check` clean.
- Release: **e9c440412d0198375444**, 54 cached assets, 1,953,287 bytes. Deployed 56 public files to the existing sane-guild-8399 Pagelove host at 2026-10-14T01:36:17.659Z, with the service worker last. Backed up the previous engine and PWA client privately. Existing leaderboard records were excluded from deployment.
- Provider readback: engine.js, pwa.js, app.js, pwa-release.js and sw.js returned HTTP 200 and matched local bytes exactly; the HTML contained the correct release marker and app.js?v=25. Publisher also read back every uploaded file. No host, credential, account, manifest scope or permission changes.
- Live browser: began at bada4b51a3eac99ff581, detected the waiting update, clicked **Update game**, and observed e9c440412d0198375444 in the loaded document. Start screen showed the existing Continue adventure checkpoint and 5,300 personal best. Offline readiness returned; no browser console warnings/errors. Screenshot saved privately as test-results/paddle-update-live.png; local two-release persistence screenshot is test-results/update-lab-storage.png.
- Limits: Chromium in-app browser and deterministic Node harnesses verified. Actual installed Android/iOS shells, physical airplane mode and touch-device performance were not available to verify. Local network-unavailable checks deliberately returned HTTP 503 for all game resources while retaining the lab control endpoint. No synthetic scores were written to production.
- Change evidence: source hashes in 2026-10-14-paddle-update-hashes.json; reviewable core code/test/tool patch in 2026-10-14-paddle-update.patch; full changes retained by the accompanying Git commit. Hash inventory excludes this append-only log and the evidence files themselves to avoid self-reference. Publication checkout reconciled with the authoring files; only the listed game changes are included.
- Publication: source ready to commit/push to wesley83/prism-breaker main; final GitHub readback recorded in a subsequent entry.

## PB-20261014-04 — Publication preparation correction

- UTC: 2026-10-14T01:38:06Z.
- Actor: Codex; reference PB-20261014-03.
- Failed attempt: invoked the private source-copy helper from the publication checkout instead of the authoring root; Node reported MODULE_NOT_FOUND. No source copy occurred. Git staging that followed contained the already-copied source and the earlier audit version. Re-ran the helper from the correct root, checked byte equality for all 11 changed source/document/test/tool files, refreshed the audit, and staged the corrected evidence before committing.
- Verification: generated SHA-256 inventory for all 11 files and a 28,974-byte review patch; staged diff whitespace check clean. Runtime release unchanged. No unrelated files or package/lockfile changes staged. Commit and remote verification pending.
