# Paddle pass-through follow-up

## PF-01 — Investigation plan

- UTC: 2026-10-15T02:28:45Z
- Actor: Codex
- Request: A user reported the ball passing through the paddle again; investigate whether the previous fix missed a case.
- Plan: Review full physics order and rendered paddle/ball geometry, moving/edge/underside contacts, power-up transitions, input timing and fixed-step frame-delay handling. Reproduce missed contacts with independent geometric expectations and focused tests rather than assuming the earlier collision model is complete. Fix confirmed defects, verify regressions and browser integration, regenerate the release and publish necessary scoped corrections under the continuing game-fix authorization. Preserve existing score/world data.
- Initial state: Clean main at 43d543f; current deployed release db427e1e556915bdbc21. Earlier paddle sweep tests covered upper-half contacts and intentionally excluded lower-half contacts; determine whether that exclusion matches the visible paddle. No conclusion yet about the reporting user's specific device/session. Honcho context tools unavailable.
- Files planned: public/engine.js, scene/paddle modules or app integration if implicated, relevant tests, generated PWA artifacts, dated investigation/report and publication evidence.
- Verification: Pending; source inspection begun, no runtime changes yet.

## PF-02 — Reproduced missed geometry

- UTC: 2026-10-15T02:31:54Z
- Actor: Codex; reference PF-01.
- Findings: The earlier sweep explicitly rejects any descending ball starting below paddle center, even when its radius overlaps the solid paddle. A moving paddle can visibly sweep through that ball. Its top plane also uses half-height 0.17, while measured solid endcap artwork extends to 0.208. Moving-away endcap contact can be missed before the old top plane is reached.
- Reproduction: Four new regression groups fail on the original code: lower-half contacts in both directions; moving-away raised endcaps; independent sampled circle-to-solid-body contacts; actual Three.js mesh bounds. The earlier lower-center miss test encoded an overly restrictive assumption and will be revised to exclude only balls already clear of the full collider, while retaining upward-ball and genuine-miss protection.
- Test-fixture correction: Initial rendered-bounds test used the paddle group's existing world translation and inspected the replacement ball after a life loss; reset the artwork to local origin and retain the original ball reference. It then fails correctly at measured solid top 0.20800000429153442. This exposes a verification hazard rather than a successful reproduction in that first attempt.
- Correction plan: Keep swept relative motion, expand its vertical interval to the full visible solid paddle plus ball radius, use a conservative 0.21 half-height covering the raised endcaps, and retain descending-only response. Preserve Sticky impact offsets and Wide-expiry behavior. Validate geometry independently and genuine misses below the entire paddle. No rendering or input behavior change planned unless another reproduction requires it.
- Other checks: Rendered paddle x matches engine x; fixed physics runs at 120 Hz with frame elapsed capped at 50 ms. Official/editor obstacles stay well above the paddle, so post-paddle obstacle reflection does not explain this case. A malformed rg option beginning with '-' was corrected using '--'.

## PF-03 — Corrected and verified

- UTC: 2026-10-15T02:36:23Z
- Actor: Codex; reference PF-01/02.
- Changes: Full-height swept collision interval with half-height 0.21 covering measured solid endcaps. Retained descending-only response and expanded-radius miss cutoff. Revised the prior lower-center assumption, added independent geometry/artwork and seeded trajectory coverage, and verified lower-side Sticky/Wide expiry. Bumped engine imports in app/editor to v9, entry app to v31, regenerated workshop HTML/bootstrap hashes and PWA assets.
- Verification: 136 tests pass / 0 fail across 13 files; 16 focused paddle tests pass. Added six new tests, including a 192-configuration matrix and 4,000 seeded trajectories. Build check and git diff --check pass. Release a998edcd3009a53d6733 / 70 assets / 2,416,776 bytes.
- Browser: Actual old and revised engines compared in isolated loopback-4176 fixture. Lower-side case: old vy=-13.50 and MISSED, revised vy=6.72 and CAUGHT. Raised endcap: old vy=-13.50 and MISSED, revised vy=7.09 and CAUGHT. Screenshots and JSON saved. Fixture is a flat drawing of actual engine results, not a recording of full Three.js gameplay. No production score operation. Temporary tab closed and server stopped.
- Evidence: Added tools/paddle-replay.mjs and PADDLE-COLLISION-FOLLOWUP.md; dated browser JSON, screenshots and test output. Core engine diff remains small; rendered artwork itself unchanged. Full change hashes/patch and authoring mirror reconciliation follow before commit.
- Publication plan: Push reviewed source, deploy with the existing publisher preserving scores/world documents and service worker last, verify public inventory and exact engine/worker bytes, then archive dated release receipts and push the final audit. Explain the need to update older installed copies and retain the uncertainty about the reporting user's session.

## PF-04 — Released and verified

- UTC: 2026-10-15T02:39:30Z
- Actor: Codex; reference PF-03.
- Source: Pushed cdd2286 to main in wesley83/prism-breaker. Correct host authenticated with console 200 / matched DAV identity / PROPFIND 207; hidden-stdin authentication session closed after publishing. No credentials saved in evidence.
- Deployment: Uploaded and read back 76 public files, with app.js then index.html then sw.js last. Release a998edcd3009a53d6733 / 70 assets / 2,416,776 bytes. Shared scores and individual world definitions excluded; no policy migration or activation. Archived the ignored operational receipt in dated paddle-deployment.json.
- Public verification: Receipt at 2026-10-15T02:39:30.968Z verifies all 70 inventory assets, matching home release marker and fullscreen manifest. Explicit SHA-256 comparison confirms deployed engine.js and sw.js equal the tested local files. No new full-game playthrough or physical-phone verification claimed.
- Finalization: Update publication status in the follow-up report, preserve dated release receipts and hashes, mirror the scoped report/audit/receipt files plus operational deployment receipt, commit/push evidence and verify final main equality/clean tree. Runtime content unchanged after the 136-test run.
