# Handbook improvements: authorized release

## HB-RELEASE-PLAN — 2026-10-17T21:01:54Z

- Actor: Codex, acting on Wesley's request: "commit, push, deploy".
- Inputs: the completed handbook implementation and its existing audit, hashes, browser receipt and change evidence; candidate runtime `61ed4fec441fef26f87e`.
- Plan: commit the reviewed source on a `codex/` branch; run the committed-source release gate; push and integrate through the required GitHub CI check; run the gate on the merged commit; publish the immutable package to the pinned sane-guild host; verify public hashes and the actual update/offline flow; record sanitized release evidence and reconcile the authoring mirror.
- Scope: game runtime, editor, recovery and evidence changes already requested. Preserve hosted world documents, leaderboard records, native policies and old immutable releases. No policy activation or new access grants.
- Verification before this release request: 193 tests passed; seven required evidence rows passed; final browser and packaged-editor checks are recorded in the implementation audit. These do not certify physical phones, native share receivers, comprehensive accessibility or provider policy propagation.
- Status: implementation complete; commit, CI integration, publication and public verification pending.
- Operational note: sandboxed GitHub CLI could not read its existing user config; request normal scoped execution for repository authentication and network operations. No credentials are copied to this audit.

## HB-RELEASE-INTEGRATION — 2026-10-17T21:04:10Z

- Actor: Codex; reference: HB-RELEASE-PLAN.
- Committed implementation as `50ce1a8ab60af2393e6a06ab650bbcfdb5c14b50` (49 paths, including this release plan). Pushed `codex/handbook-recovery`; PR #9 passed both required CI runs and merged normally as `88c213b18944d7cf5fc1c6a9fd8ea634c0ad3760`. Main CI also passed. Required strict status checks and administrator enforcement remain enabled.
- Ran the exact-source gate on both the branch and merged commit. All checks passed: 193 tests, reproducible PWA integrity, repository checks and seven requirement rows. Runtime remains `61ed4fec441fef26f87e`; source digest `87b82b01feabe7b0375b6b8668f5e810c2d5c6fa978db46d4712fe0168e3a292`.
- Saved the merged gate and raw tests as dated audit evidence. Publication and live verification pending.
- Exception: the staged whitespace check reported the preserved historical patch's context lines and raw Windows test output as whitespace. These audit artifacts intentionally retain their original bytes under `audit/** -text`; runtime/source whitespace was already checked. The shell continued to commit; no source validation failure was bypassed. Future source-only whitespace checks exclude preserved audit artifacts.
- Browser baseline: existing client was on `be807e77f8a5dc2d2df7` with an already waiting update; applying that update returned to the current start screen with its checkpoint and 5,300 personal best retained. This prepares a real older-client update observation for the new publication.

## HB-RELEASE-LIVE — 2026-10-17T21:06:54Z

- Actor: Codex; reference: HB-RELEASE-PLAN.
- Authenticated the existing owner publisher through hidden stdin; pinned host identity returned console 200 and DAV 207. Published at `2026-10-17T21:05:14.112Z`, then cleared the publisher's in-memory credential by exiting. No credentials were saved in evidence.
- Published runtime `61ed4fec441fef26f87e` from merged commit `88c213b18944d7cf5fc1c6a9fd8ea634c0ad3760`: 82 cache assets, 2,483,558 bytes. Dependencies were staged and checked before ETag-conditional entry promotion. The publisher preserved hosted worlds, scores/policies, old packages and legacy root modules.
- Public verification at `2026-10-17T21:05:43.827Z` passed every one of 82 cached asset checks plus the entry graph, release marker and fullscreen manifest. Saved the public receipt and a sanitized publication receipt under this date's handbook audit files.
- Actual existing Chromium client: detected the new update while still on `f040e06f64812c205108`; the start-screen Update game button appeared. Clicking it loaded the new release marker and immutable bootstrap. Continue adventure, personal best and all observed settings survived. Offline status returned to "Ready to play offline" / "All sixteen worlds, music and cutscenes are saved." No game console errors were observed. This is the actual update flow and a complete-cache acknowledgement, not a new physical-device or network-disconnection test.
- Editor exception: its first `/editor/prism-garden` navigation returned HTTP 500 with `Composition failed: internal error: JS method 'world' failed: javascript/module binding exceeded memory budget`. Subsequent read-only requests to that route, `/editor.html`, and the known Cloud Carnival route returned 200; reloading the browser route fully opened the workshop with 16 choices, its saved draft and no editor console errors. The authored server method is checked against the prior commit in the release evidence; this isolated server failure is recorded, not claimed fixed or definitively diagnosed. No policy or world document was modified to work around it.
- Finalization plan: commit sanitized publication/live/browser receipts and hashes through a second normally checked PR, mirror these task-owned evidence files to the authoring directory, and leave the same deployed runtime in place. No runtime changes are required for evidence-only integration.

## HB-RELEASE-EVIDENCE — 2026-10-17T21:07:50Z

- Actor: Codex; reference: HB-RELEASE-PLAN.
- Saved sanitized publication/public-hash receipts, observed browser update/settings evidence, working editor and update screenshots, committed-source gate/test output, and SHA-256 hashes. Mirrored these task-owned evidence files to the authoring directory. The editor method matches the prior committed method exactly; provider memory-failure diagnosis remains open.
- Failed branch-name attempt: `codex/handbook-release-evidence` already existed. The shell continued and made the evidence commit on local main. Before any push, created a unique evidence branch preserving that commit and moved the local main pointer back to unchanged origin/main. No remote main push, protection bypass or worktree content deletion occurred. Subsequent Git command batches stop explicitly on nonzero native exit codes. Evidence will integrate through the ordinary PR/CI path.
- Runtime remains unchanged. The evidence commit's release gate passed; its final amended commit and required GitHub CI are checked before integration. Source/runtime whitespace checks exclude preserved raw audit artifacts.
