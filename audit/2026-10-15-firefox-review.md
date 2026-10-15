# Firefox Android compatibility review

## FF-01 — Plan

- UTC: 2026-10-15T19:53:32.4903668Z
- Actor: Codex.
- User request: Explore mobile Firefox and identify whether the installed game/fullscreen should work or adjustments are needed.
- Plan: Review primary Mozilla installation, manifest/fullscreen and browser-compatibility sources; inspect the game's install help, fullscreen controller, offline handling and browser feature fallbacks. Separate platform support from proof on Pixel 11 Pro/Android 17. Record concrete recommendations without claiming emulator/desktop results verify Android behavior.
- Scope: Investigation and documentation; no app implementation/deployment requested in this turn. No automated tests run or added. No device/browser data changes. Source reads and initial search before this plan were read-only.
- Files: This audit; findings in existing fullscreen documentation and any scoped bug-log correction if appropriate; hashes and review patch. Preserve earlier uncommitted investigation records.
- Constraints: Honcho tools not available. Only primary sources inform technical conclusions; search results from discussion aggregators are not used as support. Device execution remains unavailable to this agent.

## FF-02 — Findings and recommendations recorded

- UTC: 2026-10-15T19:55:50.8796114Z
- Actor: Codex; reference FF-01.
- Findings: Official Mozilla support documents Android web-app installation. Current MDN BCD records fullscreen manifest support on Firefox Android, standard fullscreen API support, unsupported navigationUI hint, and absent beforeinstallprompt/appinstalled events. Core service-worker, cache and WebGL2 APIs are supported. Current manifest and fallback architecture need no browser-specific replacement.
- Source findings: Existing install button falls back safely to generic help; clearer Firefox wording recommended. display.js conflates phoneFocus (CSS layout) with native fullscreen, so declined requests can show an exit label and consume the next click as layout exit. Its installedFullscreen guard also suppresses manual API requests. Recommend separate state/labels and deliberate retry while respecting user exits. These are not demonstrated fixes for the Edge screenshot issue.
- Changes: FULLSCREEN-UPGRADE.md expanded with compatibility table-equivalent findings, exact recommendations, primary links and device verification limits. Saved sanitized selected BCD records in audit/2026-10-15-firefox-compatibility.json. No runtime, manifest, policy or deployment changes.
- Failed lookups/limits: Initial search results were largely irrelevant discussion links, excluded from technical conclusions. Legacy manifests/webapp.json returned 404; GitHub directory discovery found current per-member files. A guessed custom-property compatibility path was unavailable and is irrelevant to conclusions; guessed share filenames were replaced by actual sharing.js after enumeration. No device/browser execution or automated tests performed.
- Verification: Findings reviewed against inspected source and primary compatibility data; direct source excerpts retain URL/status and mirror entries, with Firefox Android mirror values interpreted from their Firefox counterpart. Final evidence hashes and mirror reconciliation pending.

## FF-03 — Evidence packaging

- UTC: 2026-10-15T19:56:16.9630911Z
- Actor: Codex; reference FF-02.
- Review: Documentation describes recommendations only and preserves historical verification limits. Outer fullscreen document matches the pre-change Git baseline; no mirror edits will be overwritten. Local receipt and audit links exist. Task patch and SHA-256 manifest generated; copied files require matching hashes. No test execution, implementation, commit, push or deployment in this review.

