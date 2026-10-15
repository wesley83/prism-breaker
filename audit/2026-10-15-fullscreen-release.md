# Mobile fullscreen release

## FR-01 — Commit, push and deployment plan

- UTC: 2026-10-15T20:09:34.9934404Z
- Actor: Codex.
- User request: Commit push deploy.
- Plan: Include the accumulated Prism Breaker investigation documents/receipts and diagnostic tools plus the requested fullscreen implementation, after repository secret/link review. Build the full generated package; commit on a codex release branch. Use the existing mandatory local release gate and required hosted Bun tests and release integrity check as prerequisites of this requested deployment, without adding tests. Integrate checked commits to protected main without bypassing controls. Authenticate the established pinned-host publisher through hidden stdin, stage immutable assets and conditionally promote entries, then verify public release inventory and actual browser startup/update where tools allow. Save sanitized receipts and commit/push final evidence.
- Scope: Runtime candidate fae02ab6c0bf2e26a92a; no score-policy, world-definition or real-score mutations. Existing publisher preserves those resources. Public authoring-domain key stays in process memory only. Prior historical evidence remains intact; private artifacts and credentials excluded by explicit staging/repository scan. No PR or external communication required unless branch policy requires it.
- Verification: Required release checks are part of the requested publish operation. Physical Android/Firefox behavior and PB-003 gray strip remain unverified; do not imply this deployment closes them.
- Initial inspection: Correct workflow is .github/workflows/quality.yml, not guessed ci.yml. GitHub CLI authenticated as wesley83. Honcho unavailable. Existing main HEAD ebcc03cd4a73b4fe8006caabc74a3d5ec2f1ef33; remote state to be checked before integration.

## FR-02 — Source integration and required checks

- UTC: 2026-10-15T20:16:22.784Z
- Actor: Codex. Request/plan: user commit/push/deploy; FR-01.
- Changed: Committed 55 accumulated runtime, diagnostic and documentation files as 08f836627d8a5539f095f7eb132cc30ccc6d8a88 on codex/mobile-fullscreen-release-20261015; fast-forwarded protected main after required CI passed. Full build reproduced fae02ab6c0bf2e26a92a, 72 assets, 2,425,515 bytes.
- Why: Publish the approved fullscreen/Firefox adjustments with their supporting investigation records.
- Verification: Mandatory local release gate passed 170 tests across 21 files; repository check passed 34 documents, 270 local links, 374 scanned files. GitHub required Bun tests and release integrity passed at https://github.com/wesley83/prism-breaker/actions/runs/38799805415 on that exact commit. Branch protection retained strict required CI including administrators.
- Exception: Initial staged diff whitespace check reported historical audit patch/CRLF whitespace; the command batch continued and the commit was made. Historical evidence retains original bytes under audit/** -text and was not normalized. A separate diff whitespace check of current public, tools, tests and affected root documentation passed. This is not a claim that all historical evidence passes whitespace lint.

## FR-03 — Live publication and acceptance evidence

- UTC: 2026-10-15T20:16:22.784Z
- Actor: Codex. Request/plan: FR-01.
- Changed: Published release fae02ab6c0bf2e26a92a from source commit 08f836627d8a5539f095f7eb132cc30ccc6d8a88 to the approved sane-guild host. Immutable files were staged and verified before conditional entry promotion; 81 publication records. Authenticated publisher exited after completion.
- Affected resources: Versioned runtime, manifest, editor entry routes, game entry, root service worker; see deployment receipt for paths and hashes. Score document and policies were byte-for-byte unchanged in private before/after backups; no individual world writes.
- Verification: Public inventory check passed all 72 asset hashes and fullscreen manifest. Existing desktop IAB session displayed Update game; clicking it reloaded the new release, retained Continue adventure and personal-best display, reached Ready to play offline, and displayed How to install. Native fullscreen button changed Enter to Exit and back through actual clicks. Browser captured no warning/error logs. Screenshot and sanitized receipts retained beside this log.
- Limits: Desktop IAB evidence does not validate native Firefox/Edge Android installation or OS cutout behavior. PB-003 gray strip remains unresolved on physical hardware.
- Finalization plan: Commit and push this audit-only evidence through required CI, then fast-forward main. That evidence commit changes no deployed runtime bytes and requires no second runtime deployment. Hash inventory records evidence files; this log is excluded from its own hash chain.
