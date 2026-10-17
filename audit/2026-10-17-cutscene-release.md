# Cutscene correction release

## CUT-RELEASE-PLAN — 2026-10-17T21:55:23Z

- Actor: Codex; request: Wesley's "commit, push, deploy" after the all-cutscene investigation.
- Inputs: the four reviewed runtime/generated changes, saved 38-case scene review, primary motion observations, visual compositions and hash manifest. Candidate runtime `5d10bdab9808ae015b0b`; baseline main `f124f0310db50e3bd7182b7977ec2a8568b29330`.
- Plan: regenerate the existing handbook browser fixture and repeat its required recovery/editor/layout/performance evidence on the exact current public graph; commit source and evidence on a unique `codex/` branch; run the committed-source release gate; push and merge through required CI; recheck merged main; publish via the pinned sane-guild owner publisher; verify public hashes and actual old-client update/offline acknowledgement; commit sanitized release receipts through required CI and reconcile the authoring mirror.
- Preserve hosted worlds, scores, native policies, prior immutable releases and user motion preferences. No new access grants or score/world policy activation. Publication scope is the existing cutscene correction.
- Previous scene review: all 16 worlds and three endings in full/low effects; fixed the early stop in Thunder Spire's lightning and Lunar Harbor's ship; no other local rendering freeze reproduced. Physical-device-specific causes remain unverified.
- Status: refresh, commit, CI, publication and public/browser verification pending. Honcho tools are not available in this session.

## CUT-RELEASE-EVIDENCE — 2026-10-17T21:59:46Z

- Actor: Codex; reference: CUT-RELEASE-PLAN.
- Repeated the existing unmodified handbook fixture against the candidate public graph. All four required browser sections passed: storage, editor, layout and performance. Saved the visible page's complete JSON as both the adopted receipt and a dated audit copy. Seven requirement inventory rows pass; runtime digest `d878e214ed6d47168d0c134a5d433356b2b21c2a7fbf2ad9d76477a1689cadea`.
- Sustained 3600-frame sample: frame p95 17.1 ms, maximum 33.5 ms, CPU submission p95 1.4 ms. Controlled before/after comparison passed. All 19 conservative flash samples had no flags; scope remains sampled screening, not full WCAG certification or hardware certification.
- Several status reads timed out during synchronous flash-render batches. The fixture continued and completed successfully; no check was waived or failed receipt adopted. The complete result was read after completion.
- Source/runtime whitespace checks pass, excluding preserved historical raw audit artifacts. Existing main is synchronized with origin and strict required CI still covers administrators. Created unique branch `codex/cutscene-motion-20261017`; committed-source gate, CI integration and deployment are next.

## CUT-RELEASE-INTEGRATION — 2026-10-17T22:01:54Z

- Actor: Codex; reference: CUT-RELEASE-PLAN.
- Committed implementation/review as `ebed53e3f1d3ca7f23dc9d51e6085d70263f9fcf`. PR #11 passed both required CI runs and merged normally as `e0a3a45e48c22ed7877980cae68a20160ec8ffa7`; main CI passed too. No branch-protection bypass.
- Exact-source gate passed on both commits: 193 tests across 25 files; PWA/repository/seven-row requirements checks passed. Merged source digest `5a91e6faf91b553d99362392392ef82e1c64fe588ce1e5b7617a450a5c462b8a`, runtime `5d10bdab9808ae015b0b`. Saved merged gate/raw test output in dated audit evidence.
- Existing live browser is on `61ed4fec441fef26f87e`, with its saved adventure and personal best present and offline readiness acknowledged. The scoped local acceptance tab/server have been closed; the user's live tab remains open for update verification.
- Authenticated the pinned owner publisher through hidden stdin; host identity matched (console 200, DAV 207). Publishing/public verification next; native policies and mutable game data remain outside release scope.

## CUT-RELEASE-LIVE — 2026-10-17T22:03:56Z

- Actor: Codex; reference: CUT-RELEASE-PLAN.
- Published runtime `5d10bdab9808ae015b0b` at `2026-10-17T22:02:40.799Z` from merged commit `e0a3a45e48c22ed7877980cae68a20160ec8ffa7`; 82 cache assets, 2,484,006 bytes. Immutable dependency staging/readback preceded conditional entry promotion. Publisher receipt records preserved scores, world definitions, older releases and legacy root modules; no policy migration occurred. Exited the publisher to clear its in-memory credential.
- Public verification at `2026-10-17T22:03:03.037Z` passed all 82 cached asset hashes plus the coherent entry graph, root release marker and fullscreen manifest. Both `/editor/prism-garden` and `/editor.html` returned 200, contained the workshop shell and referenced this release. No transient server composition error occurred in these reads.
- Existing Chromium client started on `61ed4fec441fef26f87e`. Clicked Settings → Check for updates; the new update became available. The visible start-screen Update game action loaded this release's marker/bootstrap. Saved-run copy, personal best and all observed settings matched the prior values. Offline status returned to complete readiness; game error log was empty. Saved sanitized state-comparison evidence and before/after screenshots.
- These are local/browser and public-byte observations, not a physical-phone or original-user-device certification. Complete-cache acknowledgement is not a new offline-network-disconnection exercise. No production score or world edits were made for verification.
- Finalization: commit sanitized publication/live/gate/test receipts and hashes through an evidence-only PR with required CI; mirror the new adopted browser receipt and audit files after conflict checks; keep the deployed runtime unchanged. All runtime source changes are already merged and published.
