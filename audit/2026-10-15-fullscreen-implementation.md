# Fullscreen controls and Firefox installation improvements

## FI-01 — Implementation plan

- UTC: 2026-10-15T20:01:59.4680717Z
- Actor: Codex.
- Request: Implement the Firefox review recommendations.
- Plan: Distinguish native API fullscreen from the phone's viewport layout; keep a manual native retry available even when installed display-mode reports fullscreen; retain conservative automatic entry and respect user exits. Give the CSS layout its own accurately labeled pause control. Reflect pending/unsupported API state without false exit labels. Keep navigationUI as an optional hint, not a guarantee.
- Installation: When no native install prompt is available, label the action How to install. Provide Firefox Android menu instructions while retaining existing iOS/general fallback and capability-driven prompt handling.
- Files: public/display.js, public/pwa.js, public/app.js, public/index.html; generated offline package/public release files; existing fullscreen documentation; audit/evidence. Update the existing controller fixture/expectation only as needed to reflect the intentionally changed contract; no new tests or test execution because this request does not ask for testing.
- Review: Inspect changed control flows and generated release evidence, preserve prior uncommitted work, compare mirror baselines before copying. No physical-device verification or promise to remove the Android gray strip. No production mutation, commit/push or deployment requested in this turn.
- Memory: Honcho tools unavailable; no memory write claimed.

## FI-02 — Controls, guidance and offline build implemented

- UTC: 2026-10-15T20:04:05.0795945Z
- Actor: Codex; reference FI-01.
- Changes: Native fullscreen determines native control labels/icons; pending and unavailable states are explicit. Manual requests bypass only the installed-window suppression, while automatic requests remain conservative. A separate pause-layout control toggles the CSS phone layout. Outstanding requests are invalidated on returning home. navigationUI remains an optional hint. Installation action labels follow prompt availability, and Firefox Android gets menu-specific guidance.
- Files: public/display.js, public/pwa.js, public/app.js, public/index.html; tests/display.test.mjs existing fixture and rejected-request expectation updated for the new layout control, without adding tests; FULLSCREEN-UPGRADE.md records implementation and limits. Generated public/pwa-release.js and public/sw.js rebuilt with the index release marker.
- Build: bun tools/build-pwa.mjs completed successfully, candidate fae02ab6c0bf2e26a92a, 72 offline assets, 2425515 bytes, immutable package under test-results/release-package/fae02ab6c0bf2e26a92a. No deployment performed.
- Review: Inspected state transitions and diff, including rejection/unsupported API, manual requests in installed mode, pending-entry return-home handling, and user exits. No automated tests or physical-device checks run. PB-003's device gray strip remains unresolved.
- Remaining: Whitespace/review evidence and baseline-safe outer mirror reconciliation. Previous research/audit changes remain intact and uncommitted.

## FI-03 — Final diff and mirror reconciliation

- UTC: 2026-10-15T20:04:38.9501182Z
- Actor: Codex; reference FI-02.
- Verification: Build completed; git diff --check passed. Source diff reviewed with generated release changes. All runtime/test mirror files match their pre-change Git baseline; fullscreen documentation matches its prior Firefox-review hash. Task patch, build receipt and SHA-256 manifest saved, followed by mirror copies with hash equality checks. No independent mirror edits overwritten.
- Scope limits: Existing regression expectation updated but no tests run or added. Device verification, commit/push and production deployment remain pending. This implementation does not close the Android gray-strip issue.

