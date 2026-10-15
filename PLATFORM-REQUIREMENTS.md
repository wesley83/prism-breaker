# Native platform requirements still needing a supported mechanism

October 15, 2026. This is an implementation dependency/request specification, not a claim that Pagelove is defective or that no undocumented capability exists. [Research receipt](audit/2026-10-15-native-capability-research.json).

## Shared scores: physical deletion without traffic

The requested behavior is a maximum five-day lifetime for persistent shared leaderboard records. A server-assigned `expiresAt`, ranking filters and access-driven cleanup exist. They do not execute a physical deletion when all clients are closed and no requests arrive.

Fresh official reference reads established:

- [Server JavaScript](https://docs.pagelove.com/all/languages/javascript/) has no `setTimeout`, `setInterval` or network `fetch`.
- [Triggers/processors](https://docs.pagelove.com/all/reference/reacting-to-changes/) run in the request lifecycle; outbound HTTP work is dispatched from that lifecycle.
- [Transient elements](https://docs.pagelove.com/all/reference/composing-pages/) are session-scoped, use a fixed 30-day lifetime, and currently ignore per-element TTL values. Moving public standings into session data would change their meaning and would not meet five-day retention.

No supported native shared-record TTL or unattended scheduler was identified in the inspected reference. No external scheduler, background browser timer or self-request loop is introduced. Browser periodic sync is not an execution guarantee when the app/OS is closed.

### Questions for platform support

1. Is there a native persistent-record expiry or scheduled-task facility that executes without incoming HTTP traffic? What is its documented schema and supported deployment procedure?
2. What maximum deletion delay, clock basis, restart/retry behavior and authorization identity does it guarantee? Can it preserve all records whose server expiry is still in the future?
3. How can we observe stored records without a read-triggered cleanup producing an apparent pass? Is there native task execution evidence or a non-triggering inspection path?
4. If no facility exists, is one planned? The application must then either retain this requirement as blocked or obtain an explicit requirement change. This implementation does not silently relax it.

### Acceptance procedure once available

Use disposable records with independently assigned short expiries and active controls. Observe the native job/TTL without any client request during the expiry interval. Verify physical removal via a non-triggering path and native execution evidence. Test exact cutoffs, skew, restart/retry, concurrency and duplicate execution; retain active records. Only then implement the five-day configuration on the real board while preserving existing records and provenance.

## Safe public-policy activation

Earlier isolated probes observed stale policies, post-deletion execution and a newly published DELETE rule allowing an unexpired control to be removed before its rejection behavior settled. The precise contract/root cause remains unestablished. The documented delay for transition rules is not proof of every general policy's activation semantics.

Ask support for a supported atomic policy/authorization publication mechanism or revision/readiness barrier that covers every worker serving mutations. Determine behavior during updates, deletion, failure and rollback, including a fail-closed method. Consecutive successful warm-up requests are not a guarantee about all future requests.

Until that exists, normal game releases preserve score rules and records. The migration command refuses a changed native policy. This prevents the normal release path from introducing a fresh-policy window; it does not retroactively prove a platform-wide activation barrier or prevent the owner from authoring directly.

## World publishing and ranking trust: resolved product choices

Wesley chose to retain **owner DAV publishing only** and the **casual leaderboard**. DAV intentionally bypasses all schema validation and triggers, as [support confirmed](DAV-TRIGGER-BUG-REPORT.md). The editor/build still validate content; authoring uses ETag conditions and readback. World-policy activation is disabled, and no authenticated application grant or verified-run board is introduced. These are explicit trust boundaries, not open promises to add another architecture.
