# Score expiry verification — October 15, 2026

The accepted behavior passed the isolated live cleanup checks: expired scores are excluded from rankings, and an online leaderboard read initiates physical cleanup. An intermittent HTTP 503 issue remains open separately.

## What was checked

The test copied the live score policies to a unique disposable resource on the same Pagelove host, using a unique schema type. Owner DAV seeded synthetic timestamps and read storage without invoking application cleanup. No test scores were added to the real leaderboard and its document was never written.

Each expiry case contained four expired scores interleaved with three active controls. Controls were compared field-for-field against their seed readback. The production `activeScores` function checked which synthetic rows would be displayed.

| Check | Observed result |
| --- | --- |
| Seven active-only controls | Successful reads preserved every field of every control |
| Public GET processor alone | Four expired rows were absent from stored data by the second DAV observation, about 2.2 seconds after the successful GET; all three active controls remained unchanged |
| Game GET plus browser fallback DELETE sequence | Four expired rows were absent at the first DAV observation, about 1.1 seconds after the successful request sequence; all three active controls remained unchanged |
| Ranking filter | Only the three active controls appeared in filtered results |
| Two additional reads after each completed cleanup | No expired rows reappeared; active records were unchanged |
| Disposable resource removal | Authoring DELETE returned 204; subsequent authoring GET returned 404 |
| Real leaderboard preservation | Full document and native-policy SHA-256 identities matched before and after each network-capable fixture run |

The successful final fixture run completed at **2026-10-15T18:38:30.758Z**. These are observed completion times, not guaranteed cleanup latency. Four expired rows establish this case; they do not establish arbitrary-volume performance.

## Browser check

Separately, a fresh temporary browser tab opened the live game, clicked the normal Leaderboard control, and refreshed the Adventure board. Both loads completed with `Top 25 adventure runs`, 25 rendered rows and the five-day expiry notice. The captured console contained no warnings or errors. The temporary tab was closed.

The synthetic cleanup test exercised the public request sequence and production filtering function through the test runner. It did not inject synthetic records into the production browser UI. The separate browser check confirms normal opening/refresh behavior; storage deletion is established by the fixture's DAV observations.

## Availability finding still open

Several isolated public reads returned **503 Service Unavailable**. In the final run, two captured responses stated **Budget Exceeded: The request exceeded the allocated memory budget**, reporting allocated and consumed memory as **33,553,172 bytes**. They occurred at 18:38:14.109Z with active-only records and at 18:38:23.797Z before the game-sequence expiry check. Bounded retries succeeded.

The first restricted attempt failed to connect before creating any resource. The next two attempts encountered 503 responses and removed their fixtures safely. Their initial runner did not retain error bodies. One runner assertion incorrectly labeled an HTTP failure as an active-control change; the saved record comparison showed that all controls were unchanged. The audit preserves that correction and each attempt.

These responses identify the reported failure category, not its underlying cause. They do not prove that a small score list alone consumed the budget, that the established production leaderboard has the same issue, or that policy propagation caused it. No production change was made to address it. The separate native-editor 500 remains unexplained.

Subsequent investigation reproduced the same error with a 660-byte empty document and constant-false JavaScript processor condition. It no longer requires score data or expiry logic to reproduce. Internal cause remains unconfirmed; see the [dedicated investigation and support reproduction](PAGELOVE-MEMORY-BUDGET-REPORT.md).

## Evidence

- [Final live request/storage receipt](audit/2026-10-15-multiple-score-expiry.json)
- [Network-limited attempt](audit/2026-10-15-multiple-score-expiry-attempt-1.json)
- [First isolated 503 attempt](audit/2026-10-15-multiple-score-expiry-attempt-2.json)
- [Second isolated 503 attempt](audit/2026-10-15-multiple-score-expiry-attempt-3.json)
- [Plan, failures and corrections](audit/2026-10-15-multiple-score-expiry.md)
- [Reproducible runner](tools/multiple-score-expiry-check.mjs)

The runner uses the owner credential only in hidden TTY input. Saved receipts contain fixture records and aggregate identities, not credentials or production player records. Re-running requires preserving prior receipts and uses a newly generated disposable path.
