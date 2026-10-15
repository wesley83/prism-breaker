# Sustained policy activation checker

## AC-01 — Implementation plan

- Actor: Codex.
- User request: "sounds good", approving the proposed stronger diagnostic checker after asking for extra activation checks.
- Plan: Add a separate bounded checker alongside the preserved historical probe. Verify stored source structurally, exercise new-only and old-only payloads concurrently with unique request IDs, reconcile actual stored rows, and require sustained observations after first match. Record all inconsistencies and transport failures; never turn an intermittent result into an unqualified pass. Include grant revocation, deletion and conditional cleanup of owned disposable resources. Produce JSON and readable Markdown results with explicit limits and nonzero status for not-confirmed outcomes.
- Boundaries: Pinned approved host; hidden interactive credential input only; exact disposable mutation allowlist; no real score or policy writes, no publisher guard changes. Production readbacks contain hashes only. No new external services. A passing disposable check does not authorize production policy changes or prove global readiness.
- Verification plan: Review the code and exercise the assessment logic with synthetic in-memory observations under the user's extra-check request. Live checker execution is a separate operation; no live policy mutation is required to implement the tool. Record exact verification performed and any pending live run. Preserve earlier evidence unchanged. No game regression tests or deployment needed for diagnostic-only changes.
- Files: tools/policy-activation-check.mjs, tools/policy-activation-assessment.mjs, POLICY-ACTIVATION-VERIFICATION.md, this audit and evidence hashes; mirror completed files to the user-facing project directory.
- Memory: Honcho tools unavailable in this session; no memory write claimed.
- Plan UTC: 2026-10-15T20:39:04.3373785Z


## AC-02 — Implementation and local verification

- UTC: 2026-10-15T20:45:39.580Z
- Actor: Codex; request/plan: AC-01.
- Changed: Added a pinned-host checker with structural source readback, overlapping marker reads and unique A/B mutation pairs, order-independent stored-record reconciliation, 120-second observation windows, bounded phase deadlines, conservative summary/exit codes, hidden input, conditional ownership-checked cleanup and checkpointed JSON/Markdown reporting. Added a pure assessment module and documented invocation, limits and pending live execution. Historical reproduction, existing receipts and production publishing guard are unchanged.
- Why: Detect delayed execution, inconsistent revisions, unexpected acceptance, lost or duplicate acknowledged writes, transport failures and cleanup uncertainty without mistaking probes for a global guarantee.
- Review corrections: Added a run ownership marker before cleanup; retained request outcomes when owner readback fails; ensured disk checkpoint failure cannot skip remaining resource cleanup.
- Verification: Help entry point parsed successfully with Bun. Thirteen synthetic assertions passed at 2026-10-15T20:42:28.273Z: valid/reordered storage, rejected-write side effects, missing and duplicate additions, stale reads, transport failure, revocation, deletion, complete/short observation windows, earlier mismatch, regression and excessive observation gap. No network requests were made by these checks. Repository link and limited credential scan passed (34 documents, 272 local links, 382 files); tracked diff whitespace passed. Final evidence reconciliation follows in this entry.
- Pending: Live execution of this new checker, including its Sessel fixture and concurrent mutation behavior. No live policy changes, game regression suite, commit, push or deployment performed. Tool-only changes need no runtime release. Honcho was unavailable.
- Affected files: tools/policy-activation-check.mjs, tools/policy-activation-assessment.mjs, POLICY-ACTIVATION-VERIFICATION.md; this audit and evidence files.
