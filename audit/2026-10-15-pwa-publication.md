# PWA fixes publication

## PWA-P01 — Authorized release plan

- UTC: 2026-10-15T01:07:55Z
- Actor: Codex
- User request: "push and deploy", following the completed PWA robustness review.
- Plan: Verify the clean source state and generated release 5408c3b2c91090457ef8; publish the reviewed commits to wesley83/prism-breaker; authenticate and confirm the sane-guild-8399 Pagelove host; deploy runtime assets with the entry document near the end and service worker last; read back the public release and all 70 inventory assets; record publication receipts, hashes and updated release status; mirror scoped evidence and push the final audit commit.
- Scope: PWA runtime publication and its documentation/evidence. Shared score records and world documents are excluded by the normal publisher; no score-rule migration, world-policy activation or infrastructure changes planned.
- Initial state: HEAD dbb5c63, clean working tree. Prior review passed 125 tests; no runtime edits planned. Live release verification and publication pending. Honcho tools unavailable in the current tool inventory.
- Files: deployment.json, new dated audit/receipt files, release-status addendum in PWA-ROBUSTNESS-REVIEW.md; verification helper only if needed to preserve historical receipts.

## PWA-P02 — Source pushed and runtime deployed

- UTC: 2026-10-15T01:10:23Z
- Actor: Codex; reference PWA-P01.
- Source: Normal push advanced main from 090cf6e to 49fb2164699bbeb034c365aa81ba38356a0ef2f6, including reviewed runtime commit dbb5c63 and prior fullscreen audit 28bcc65. Fresh git ls-remote confirmed 49fb216.
- Helper change: check-live-pwa.mjs accepts an optional output filename so post-publication verification preserves the earlier pre-publication receipt. Runtime unchanged; deterministic build check passed.
- Host validation: Authenticated console returned 200 and matched dav-sane-guild-8399.onpagelove.com; DAV inventory returned 207. Authentication supplied through hidden stdin, not saved to files. Session closed after publication.
- Deployment: Existing publisher uploaded and read back 76 public files; app.js, index.html and sw.js were last in that order. Recorded PWA release 5408c3b2c91090457ef8, 70 cached assets / 2,412,780 bytes. Normal deployment excluded scores.html and individual worlds/ documents. No world-policy file exists in public; no policy activation or migration ran.
- Public verification: At 2026-10-15T01:10:23.918Z, all 70 release assets passed, home returned 200 with the matching release marker and manifest link, manifest retained fullscreen, worker MIME was text/javascript. See deployment.json and the new published-receipt.json. Local worker-byte equality, evidence hashes, mirror reconciliation and final audit push follow below/in the publication hash receipt.
- User follow-up: Asked why earlier issues were missed. Explained that previous coverage omitted failure combinations and included the completion-marker assumption, and that earlier readiness claims should have been more qualified. Current regression coverage addresses reproduced failures; physical Android/iOS lifecycle validation remains pending.
- Documentation: Added current publication status while preserving historical review results. No new gameplay changes or production score tests were needed for this release.

## PWA-P03 — Receipt packaging and final source publication

- UTC: 2026-10-15T01:13:00Z (approximate minute, recorded during finalization)
- Actor: Codex; reference PWA-P02.
- Result: Verified publication documentation and public asset receipt pushed as 1c4add9 after the implementation/plan push. No deployment errors occurred.
- Packaging exception: deployment.json is intentionally ignored by the repository, so ordinary git add excluded that operational receipt. Preserved the ignore rule, copied its non-secret contents to audit/2026-10-15-pwa-deployment-receipt.json for versioned evidence, and synchronized the operational receipt into the authoring mirror. This corrects the receipt packaging omission without repeating deployment.
- Evidence: The first publication hash manifest describes the files at commit 1c4add9; a separate finalization hash receipt records this appended audit and the newly versioned deployment receipt. Both preserve historical records. Final remote/local SHA equality and clean-tree checks are performed after the evidence push.
