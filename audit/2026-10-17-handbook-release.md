# Handbook improvements: authorized release

## HB-RELEASE-PLAN — 2026-10-17T21:01:54Z

- Actor: Codex, acting on Wesley's request: "commit, push, deploy".
- Inputs: the completed handbook implementation and its existing audit, hashes, browser receipt and change evidence; candidate runtime `61ed4fec441fef26f87e`.
- Plan: commit the reviewed source on a `codex/` branch; run the committed-source release gate; push and integrate through the required GitHub CI check; run the gate on the merged commit; publish the immutable package to the pinned sane-guild host; verify public hashes and the actual update/offline flow; record sanitized release evidence and reconcile the authoring mirror.
- Scope: game runtime, editor, recovery and evidence changes already requested. Preserve hosted world documents, leaderboard records, native policies and old immutable releases. No policy activation or new access grants.
- Verification before this release request: 193 tests passed; seven required evidence rows passed; final browser and packaged-editor checks are recorded in the implementation audit. These do not certify physical phones, native share receivers, comprehensive accessibility or provider policy propagation.
- Status: implementation complete; commit, CI integration, publication and public verification pending.
- Operational note: sandboxed GitHub CLI could not read its existing user config; request normal scoped execution for repository authentication and network operations. No credentials are copied to this audit.
