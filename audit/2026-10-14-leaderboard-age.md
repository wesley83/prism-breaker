# Adventure leaderboard age outlines

## PB-AGE-01 — Plan

- UTC: 2026-10-14T11:11:07Z; actor: Codex.
- Request: outline Adventure score rows green through 48 hours, yellow over 48 hours, and red over 96 hours; retain a five-day expiry footer; remove self-report and missing-submission-time wording.
- Plan: use the existing server expiry deadline to derive precise record age; apply a complete outline around each Adventure row and update its status while the leaderboard stays open. Add a concise color legend and accessible age description. Keep Daily rows unchanged. Simplify the footer and remove the obsolete missing-time tooltip. Regenerate the offline release, publish to the authorized Pagelove host, and push the scoped source changes to the existing public repository.
- Explicit preference exception: this user request authorizes functional green/yellow/red outlines on Adventure score rows. The general prohibition on decorative colored card borders remains in place elsewhere.
- Expected files: public/app.js, public/leaderboard.js, public/style.css, public/index.html, generated public/sw.js and public/pwa-release.js; README.md and this audit with hashes/reviewable diff.
- Verification: pending source review, syntax and offline build consistency, and visual browser review. No automated suite requested; none planned. No live score records or retention rules need modification.

## PB-AGE-02 — Implementation and local review

- UTC: 2026-10-14T11:16:00Z (work interval); actor Codex; reference PB-AGE-01.
- Changed public/leaderboard.js: exact millisecond thresholds keep 48 hours green and 96 hours yellow, with red only after 96 hours; age derives from the existing server expiry deadline.
- Changed public/app.js, public/style.css and public/index.html: full row outlines only on Adventure, theme-aware colors, visible legend, accessible age labels, live age-band refresh, and footer reading Scores expire after 5 days. Daily retains its neutral rows and UTC reset note. Removed the obsolete missing-time tooltip and self-reported footer text.
- Changed README.md to document the age outlines; regenerated public/sw.js and public/pwa-release.js for release 15b0961f51c7574e8e67 (62 cached assets; 2,236,711 bytes).
- Verification: module syntax and PWA consistency passed. Browser preview displayed three artificial local rows aged 12, 60 and 110 hours with green, yellow and red outlines; Daily view retained neutral rows and age minutes. Footer and accessible age descriptions present. No automated suite run and no production score writes.
- Operational correction: an initial read looked for MCP-SERVERS.md inside the game subdirectory; the file is at the workspace root and was read there. No provider fallback or configuration change occurred.
- Publication, live browser review and source/hash reconciliation pending.

## PB-AGE-03 — Timestamp correction

- UTC: 2026-10-14T11:14:04Z (clock reading immediately before PB-AGE-02 was written); actor Codex; reference PB-AGE-02.
- Correction: PB-AGE-02's approximate work-interval timestamp was mistakenly entered as 11:16:00Z. The actual clock reading for that entry was 11:14:04Z. Its implementation and verification statements are unchanged; the earlier entry is preserved.
- Affected file: audit/2026-10-14-leaderboard-age.md. Verification: reconciled with the clock tool response; no runtime or provider effect.


## PB-AGE-04 — Release and source reconciliation

- UTC: 2026-10-14T11:16:23.296Z; actor Codex; reference PB-AGE-01.
- Published release 15b0961f51c7574e8e67 to the approved host: 64 static files uploaded and read back, with the service worker last. The score resource and all score data were excluded from publishing.
- Live browser verification: applied Update game, confirmed the exact release marker, 25 green Adventure rows (current records are under 48 hours), the three age legend labels, and the footer Scores expire after 5 days. Saved the live screenshot under ignored test-results/leaderboard-age-live.png; local artificial rows demonstrate all three colors under test-results/leaderboard-age-preview.png.
- Source review and git diff --check completed without errors. Seven implementation/documentation files reconcile with the scoped diff; generated hashes and a reviewable patch accompany this audit. Public repository publication follows this reconciliation. No automated test suite was run.
- Affected files: README.md; public/app.js, leaderboard.js, style.css, index.html, sw.js, pwa-release.js; this audit and its hash/patch evidence.
