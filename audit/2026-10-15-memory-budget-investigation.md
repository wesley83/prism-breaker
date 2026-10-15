# HTTP 503 memory-budget investigation

## MB-01 — Plan

- UTC: 2026-10-15T18:43:34Z
- Actor: Codex.
- User request: "investigate the 503".
- Plan: Use bounded sequential reads of isolated fixtures to compare plain seven-row HTML, native schema/rules without a GET processor, a constant-false JavaScript processor, the existing expiry predicate, and a lower-allocation equivalent predicate. Include a minimal JavaScript trigger and limited reads of the established leaderboard as controls. Interleave fixture reads to reduce time/order bias; compare full-document and selector reads where results justify it. Preserve error response details and request identifiers when available. Fresh-read official execution documentation for memory/budget semantics.
- Safety: Only newly generated disposable paths may receive authoring writes/deletes; policies target those paths exactly and use unique schema types. All rows remain unexpired during the primary experiment, so cleanup actions should not execute. No deliberate high-memory workload or load test. Owner credentials stay in hidden TTY input; no production score payloads are retained. Read real-score hashes and native-policy identities before/after. Remove all fixtures and verify absence.
- Deliverables: Reproducible investigation tool, sanitized receipts, findings/support-ready reproduction and updated assessment. Preserve existing uncommitted work. No production rule changes or deployment are part of this investigation.
- Verification: Pending. Prior evidence shows intermittent 503 with a roughly 32 MiB memory budget, including active-only fixtures; it does not yet identify the component responsible.
- Research limitation: The web tool could not open the official /all/ JavaScript or reacting-to-changes references. Use direct HTTPS reads of those exact known pages; do not treat a tool-access failure as platform evidence.

## MB-02 — First comparison isolates a simpler failure

- UTC: 2026-10-15T18:48:38.8023216Z
- Actor: Codex; reference MB-01.
- Result: 75 bounded sequential requests. Plain, rules without GET, original expiry and constant-true trigger each had 0/12 errors; constant-false JavaScript processor and streaming predicate each had 3/12 memory-budget 503s. Established leaderboard had 0/3. All controls unchanged, six fixtures removed, real document/policy unchanged. Receipt: 2026-10-15-memory-budget-2026-10-15T18-46-55-848Z.json.
- Interpretation: The score array/regex is not necessary to reproduce; a constant-false JavaScript processor is enough in this sample. This does not establish the internal root cause or absence of issues in variants with zero observed failures.
- Next plan: Remove all score rows/schema and compare minimal JavaScript false/true gates, a Sessel false gate, and plain HTML. Keep the action a harmless Sessel expression. Capture exact minimal fixtures for a support reproduction; no production changes.


## MB-03 — Minimal controls did not reproduce

- UTC: 2026-10-15T18:50:27.1498964Z
- Actor: Codex; reference MB-02.
- Result: Zero-row plain, JavaScript true/false gates with harmless Sessel action, and Sessel true/false gates each passed 12 requests (63 including production controls). All fixtures removed; production identities unchanged. Receipt: 2026-10-15-memory-budget-2026-10-15T18-48-44-599Z.json.
- Interpretation: A single constant JavaScript condition with a Sessel action did not reproduce in this bounded sample. It differs from the failing first-run constant processor in both row count and action language.
- Revised experiment: Interleave zero/seven-row fixtures with JavaScript false gate and JavaScript/Sessel actions, plus Sessel false gate and JavaScript action. Harmless actions only; no deletion or outbound action. This isolates the differences without raising the server budget.


## MB-04 — Empty 660-byte reproduction found

- UTC: 2026-10-15T18:52:10.6527776Z
- Actor: Codex; reference MB-03.
- Result: Action/row matrix: zero JS gate/Sessel action 1/12 memory 503; seven JS gate/JS action 3/12; seven JS gate/Sessel action 1/12; zero JS/JS and zero Sessel/JS each 0/12. Production control 0/3. At 18:51:05.615Z an empty 660-byte fixture with constant-false JS when and harmless Sessel action failed. No score/schema/expiry implementation is needed to reproduce. All fixture cleanup and production-preservation checks passed.
- Evidence: 2026-10-15-memory-budget-2026-10-15T18-50-30-790Z.json includes exact fixture source and captured memory errors. The second run's zero observed failures did not establish reliability; this subsequent equivalent small case failed.
- Final discriminating check: Create empty plain, JS-false and Sessel-false controls; allow at least 65 seconds without fixture writes before a bounded interleaved read series. This distinguishes failures limited to immediate publication from later observations, without claiming a universal activation guarantee.


## MB-05 — Investigation complete within available provider access

- UTC: 2026-10-15T18:55:12.1093896Z
- Actor: Codex; references MB-01 through MB-04.
- Final comparison: Empty plain, JS-false/Sessel-action and Sessel-false/Sessel-action fixtures were untouched for at least 65 seconds, then each passed 12 GETs; production controls passed 3/3. Receipt: 2026-10-15-memory-budget-2026-10-15T18-52-14-966Z.json. This is not an activation guarantee or proof that waiting fixes the intermittent failure.
- Aggregate evidence: Four experiments, 240 sequential public GETs, 11 memory-budget errors, 12/12 successful production control reads. A constant-false JS condition on a 660-byte document reproduced the failure with no scores/schema/deletion. All 19 fixtures were removed and authoring reads returned 404. Every run preserved the real score document and native-policy hashes. Authenticated processes exited.
- Conclusion: Suspected platform JavaScript processor execution/budget-accounting issue; newly authored rule handling remains a possible contributor. No available provider logs establish the internal cause. The initial speculation about score-array allocation is insufficient, and a streaming rewrite also failed.
- Changed: Reproducible four-mode runner, four sanitized receipts, PAGELOVE-MEMORY-BUDGET-REPORT.md and current platform/assessment/expiry-report links. No production runtime, rule, budget or score changes. Support report prepared but not sent.
- Remaining verification: Repository checks, diff/hash evidence and baseline-safe mirror reconciliation pending. No gameplay or PWA regression suite needed for investigation tooling/documentation only.


## MB-06 — Final evidence reconciliation

- UTC: 2026-10-15T18:56:06.5087469Z
- Actor: Codex; reference MB-05.
- Verification: Receipt reconciliation confirms four completed runs, 240 public reads, 11 memory-budget 503s, 12 successful production controls and 19 verified fixture removals. All active controls and production hashes matched. Repository check passed (32 documents, 252 links, 348 files before final artifacts); tracked whitespace check passed. Secret scan covers limited high-confidence patterns.
- Evidence: Reviewable change patch and SHA-256 manifest saved alongside this audit. Outer mirror preflight matched the preceding multiple-expiry manifest; synchronize only this investigation's changed files. Earlier decisions, receipts and failures remain preserved.
- Status: Investigation complete locally; provider root-cause analysis remains required. Changes are uncommitted/unpushed; no deployment or support message.

