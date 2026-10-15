# Native platform requirements still needing a supported mechanism

October 15, 2026. This is an implementation dependency/request specification, not a claim that Pagelove is defective or that no undocumented capability exists. [Research receipt](audit/2026-10-15-native-capability-research.json).

## Shared scores: accepted cleanup on leaderboard access

Wesley accepted this behavior on October 15, 2026: scores expire from the displayed rankings after five days; physical deletion occurs on subsequent online leaderboard access. Records may remain stored during periods with no requests. An unattended scheduler is no longer a requirement for this game.

Expiry filtering, a GET cleanup processor and a browser cleanup request already exist in the source. Isolated live verification on October 15, 2026 removed four expired records while preserving three interleaved active controls, both with a public GET alone and with the game's GET-plus-fallback request sequence. Two subsequent reads per case preserved the remaining controls. DAV storage reads confirmed physical removal. Offline views can filter saved standings but cannot perform server cleanup. [Results and limits](SCORE-EXPIRY-VERIFICATION.md).

### Historical requirement and research: deletion without traffic

The requested behavior is a maximum five-day lifetime for persistent shared leaderboard records. A server-assigned `expiresAt`, ranking filters and access-driven cleanup exist. They do not execute a physical deletion when all clients are closed and no requests arrive.

Fresh official reference reads established:

- [Server JavaScript](https://docs.pagelove.com/all/languages/javascript/) has no `setTimeout`, `setInterval` or network `fetch`.
- [Triggers/processors](https://docs.pagelove.com/all/reference/reacting-to-changes/) run in the request lifecycle; outbound HTTP work is dispatched from that lifecycle.
- [Transient elements](https://docs.pagelove.com/all/reference/composing-pages/) are session-scoped, use a fixed 30-day lifetime, and currently ignore per-element TTL values. Moving public standings into session data would change their meaning and would not meet five-day retention.

No supported native shared-record TTL or unattended scheduler was identified in the inspected reference. No external scheduler, background browser timer or self-request loop is introduced. Browser periodic sync is not an execution guarantee when the app/OS is closed.

### Historical questions for platform support (no longer a release dependency)

1. Is there a native persistent-record expiry or scheduled-task facility that executes without incoming HTTP traffic? What is its documented schema and supported deployment procedure?
2. What maximum deletion delay, clock basis, restart/retry behavior and authorization identity does it guarantee? Can it preserve all records whose server expiry is still in the future?
3. How can we observe stored records without a read-triggered cleanup producing an apparent pass? Is there native task execution evidence or a non-triggering inspection path?
4. If no facility exists, is one planned? The application must then either retain this requirement as blocked or obtain an explicit requirement change. This implementation does not silently relax it.

### Historical acceptance procedure if unattended deletion is requested again

Use disposable records with independently assigned short expiries and active controls. Observe the native job/TTL without any client request during the expiry interval. Verify physical removal via a non-triggering path and native execution evidence. Test exact cutoffs, skew, restart/retry, concurrency and duplicate execution; retain active records. Only then implement the five-day configuration on the real board while preserving existing records and provenance.

## Safe public-policy activation

Earlier isolated probes observed stale policies, post-deletion execution and a newly published DELETE rule allowing an unexpired control to be removed before its rejection behavior settled. The precise contract/root cause remains unestablished. The documented delay for transition rules is not proof of every general policy's activation semantics.

Ask support for a supported atomic policy/authorization publication mechanism or revision/readiness barrier that covers every worker serving mutations. Determine behavior during updates, deletion, failure and rollback, including a fail-closed method. Consecutive successful warm-up requests are not a guarantee about all future requests.

Until that exists, normal game releases preserve score rules and records. The migration command refuses a changed native policy. This prevents the normal release path from introducing a fresh-policy window; it does not retroactively prove a platform-wide activation barrier or prevent the owner from authoring directly.

The October 15 follow-up separated a diagnostic read-marker document from its synthetic write target. After conditional source publication of revision B, the sample completed at 41.6 seconds still executed A and accepted A-only writes; the sample completed at 67.1 seconds executed B, rejected A and accepted B. OPTIONS advertised POST in both cases. This confirms stored source and allowed-method discovery are insufficient readiness evidence. It does not establish a guaranteed wait duration or disagreement between workers. [Investigation, reproduction and support questions](POLICY-ACTIVATION-VERIFICATION.md).

## World publishing and ranking trust: resolved product choices

Wesley chose to retain **owner DAV publishing only** and the **casual leaderboard**. DAV intentionally bypasses all schema validation and triggers, as [support confirmed](DAV-TRIGGER-BUG-REPORT.md). The editor/build still validate content; authoring uses ETag conditions and readback. World-policy activation is disabled, and no authenticated application grant or verified-run board is introduced. These are explicit trust boundaries, not open promises to add another architecture.

## Additional native-editor availability observation

A direct public GET of `/editor/prism-garden` returned 500 at 2026-10-15T16:29:23.962Z after the immutable release. The first failed verification retained status metadata but not its body. Subsequent shell/template/route reads and three additional cache-busted composition reads returned 200, and the actual browser editor/3D preview worked. No source change occurred between failure and recovery. Preserve this observation for provider tracing; do not label its cause as confirmed or describe it as an application fix. [Receipt](audit/2026-10-15-remaining-native-editor.json).

## Isolated score-read memory-budget failures

During the multiple-record expiry check, intermittent public GETs of a disposable seven-row score resource returned HTTP 503. Responses captured at 2026-10-15T18:38:14.109Z and 2026-10-15T18:38:23.797Z explicitly reported an exceeded memory budget, with allocated and consumed values both 33,553,172 bytes. Bounded retries succeeded; active controls remained unchanged. Earlier attempts also returned 503 but did not retain the response bodies. The cause and applicability to the established production route are not determined. These failures do not establish the cause of the separate editor 500.

Provider follow-up: explain the memory-budget failure on this small isolated resource, identify what contributes to that budget, and determine whether a supported application change or platform correction is needed. Native policy activation remains a separate question. [Detailed results](SCORE-EXPIRY-VERIFICATION.md), [captured responses](audit/2026-10-15-multiple-score-expiry.json).

Follow-up investigation reduced this to a **660-byte empty document** with a constant-false JavaScript GET processor condition and a harmless Sessel action. Across four bounded comparisons, 240 public GETs produced 11 memory-budget failures; all 12 established-leaderboard controls succeeded. All 19 disposable resources were removed and production identities remained unchanged. A final sample after 65 seconds without fixture access also succeeded; this does not establish a safe wait time or rule out intermittent failures. Evidence points toward platform JavaScript processor execution/budget accounting, with newly authored rule handling a possible contributor; internal cause requires provider logs. [Support-ready report and reproduction](PAGELOVE-MEMORY-BUDGET-REPORT.md). No production mitigation or budget increase was applied.
