# Bun development tooling migration

## PB-BUN-01 — Plan before implementation

- UTC: 2026-10-14T14:24:32Z; actor: Codex.
- User request: replace Node.js with Bun for the local preview, publisher, asset utilities and tests described in the README.
- Plan: validate the installed Bun 1.4.3 against the existing scripts and test suite; make Bun the documented/default development runtime; update package commands and active developer instructions; resolve compatibility issues found in the scoped tooling. Preserve historical audit/release records and Node-compatible standard-library imports where Bun supports them. Inspect the asset builder's hardcoded executable path for portability.
- Expected files: README.md, package.json, relevant tools/test imports if needed, current maintenance guides and this audit with reviewable diff/hash evidence. Preserve the publication manifest's existing Sharp dependency. No browser runtime changes or site deployment are expected.
- Verification planned: run the existing suite with Bun, check the PWA build, exercise local HTTP preview and publisher input/exit without production mutations, and run asset/build utilities in an ignored disposable copy to avoid changing published output merely due to a runtime migration. Record failures and any resulting plan revision. Commit/push scoped changes to the public repository after reconciliation.
- Baseline: publication checkout clean at e1c6d589a843602ef2927f83213ce760ce931104; Bun 1.4.3 installed. This is development tooling; the game itself runs in the browser.

## PB-BUN-02 — Initial findings and implementation refinement

- UTC: 2026-10-14T14:26:00Z (approximate work interval); actor: Codex; reference PB-BUN-01.
- Initial Bun run: 81 passed, one failed. The offline persistence test enqueued using the real clock but reopened using fixed 2026-10-14T09:00:00Z; after that date the saved nextAttemptAt is in its simulated future. Fix the test by giving the first queue an explicit earlier clock, retaining all assertions. No production queue change is needed.
- Bun supports the retained node:test/node:* APIs through its compatibility layer (official reference: https://bun.sh/docs/runtime/nodejs-compat). Use bun test ./tests and Bun script execution; no test import rewrite is required.
- The authoring asset builders have older personal absolute-path defaults; the public checkout already resolves Sharp locally and Bun from PATH. Make the touched FX builder use the running Bun executable with the existing BUN_BIN override and PATH fallback. Preserve the public Sharp resolver and manifest dependency. Validate exports in a disposable copy of the public checkout.
- Update active command examples in maintenance guides; preserve historical audit records and release results. Verification is pending the fixes, disposable builds, preview and publisher smoke checks.

## PB-BUN-03 — Implemented and verified

- UTC: 2026-10-14T14:28:40Z; actor: Codex; reference PB-BUN-01/02.
- Changed the development runtime row and executable examples to Bun; package scripts now use Bun for test, serve and check, with packageManager bun@1.4.3 and the tested minimum engine. Retained node:* imports supported by Bun. Fixed the offline test's mixed clocks and made the postprocessing builder select the running Bun executable or BUN_BIN/PATH and report spawn errors.
- Verification: bun run test passed all 82 tests across ten files. bun run check preserved release 28088acf54c782449c8b (68 assets, 2,394,237 bytes). Frozen/offline dependency installation completed without lockfile changes. Seventeen disposable-copy checks passed: icon, postprocessing, QR and Sharp exports; world/snapshot/editor/PWA builders; PWA consistency; fixture generation; six local preview GET/HEAD/rejection checks; and update-lab HTTP startup. No generated assets were copied into the release.
- Publisher verification: Bun interactive hidden input initialized and quit cleanly. Its first public read was refused by the restricted network environment; rerunning with approved network access returned HTTP 200 and the current public release marker. No authentication, upload, world edit or leaderboard mutation was performed for this migration; an owner-authenticated full deployment was not repeated.
- Scope reconciliation caught older authoring-only content being copied into artwork/README.md. Restored the public variant's existing local Sharp instructions and omitted its previously absent historical release paragraph; the intended public change is only node-to-bun in that document. A trailing blank line found by diff checking is removed in final evidence preparation. The publication package retains Sharp, and its artwork guide intentionally differs from the authoring copy; both variations are recorded in the hash evidence.
- Affected files: README.md, package.json, WORLD-EDITOR.md, PWA-UPGRADE.md, FULLSCREEN-UPGRADE.md, SCENE-TYPOGRAPHY-REVIEW.md, SHARING-UPGRADE.md, SCORING-UPGRADE.md, artwork/README.md, tests/offline.test.mjs, tools/build-fx.mjs, tools/build-pwa.mjs and this audit/evidence. Reviewable patch and SHA-256 inventory will accompany the commit. Runtime assets and live site need no deployment. Final commit/push verification follows this pre-commit record.
