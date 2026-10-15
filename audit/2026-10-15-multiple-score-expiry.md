# Multiple score expiry verification

## ME-01 — Plan

- UTC: 2026-10-15T18:33:03Z
- Actor: Codex.
- User request: "Can you do those steps?" referring to several expired test scores, unexpired controls, a normal leaderboard read, stored-record verification and repeat safety.
- Plan: Clone the live score document's policies to a unique disposable resource with a unique schema type. Use owner DAV only to seed synthetic timestamps and inspect storage without triggering application cleanup. Exercise the public GET processor alone, then the same GET and browser fallback DELETE sequence used by the game. Check visible standings using the production expiry filter, inspect physical removal separately, repeat requests, and compare active controls exactly. Remove the disposable resource and verify its absence. Read production score policy identity before and after; never write the real score resource.
- Why: Existing single-expired-row evidence does not establish bulk deletion on one leaderboard access.
- Files: tools/multiple-score-expiry-check.mjs, sanitized audit receipt/report, current assessment and related audit evidence. Mirror only this change batch after reconciliation.
- Boundaries: Credential only in hidden process stdin; no credentials/player payloads in files or logs. Disposable route rules never target /scores.html. Fresh-policy observations do not prove a platform-wide activation guarantee. No production policy migration or release.
- Verification: Pending. Prior source read shows a single selector DELETE per cleanup call; live cardinality and asynchronous processor timing need measurement. Scripted request checks are not an actual browser UI pass.

## ME-02 — Network retry

- UTC: 2026-10-15T18:35:08.6812634Z
- Actor: Codex; reference ME-01.
- Attempt: The initial restricted process failed with ECONNREFUSED at the identity request before any resource was created. Saved attempt-1 receipt.
- Next: Retry the same isolated test with network-capable execution. No change to scope, credentials handling or production-write boundary.


## ME-03 — Isolated read returned 503

- UTC: 2026-10-15T18:36:33.8761099Z
- Actor: Codex; reference ME-01/02.
- Result: Empty discovery and three active-only GETs succeeded, preserving all seven controls. First GET after seeding four expired and three active records returned 503. Original runner did not retain that error body. Fixture removed (204, then DAV 404); production resource and policy hashes unchanged.
- Revision: Preserve attempt-2 receipt. Add bounded GET retries with fixture-only response diagnostics and record each failure separately. Re-run against a new isolated resource; later success will not erase the 503 observation or prove general policy readiness.


## ME-04 — Retry coverage corrected

- UTC: 2026-10-15T18:37:39.5252164Z
- Actor: Codex; reference ME-03.
- Result: The second network-capable run returned 503 on the first active-only read after seeding. All seven controls were unchanged. The runner's combined status/control assertion emitted the misleading label 'Active control changed'; the stored-row evidence proves no control changed. Fixture removed and production hashes unchanged.
- Correction: Apply bounded, logged GET retry diagnostics to discovery/control reads as well as expiry reads; distinguish HTTP failure from preservation failure. Preserve attempt-3 evidence and this correction.


## ME-05 — Verification completed; separate availability concern retained

- UTC: 2026-10-15T18:42:03.3597952Z
- Actor: Codex; references ME-01 through ME-04.
- Live result: Final fixture run completed at 18:38:30.758Z. GET-only cleanup physically removed four expired scores by the second non-triggering DAV observation (about 2.2 seconds); GET plus fallback removed all four by the first observation (about 1.1 seconds after the successful sequence). Three interleaved active controls retained every field. Two subsequent reads per case were safe. Production activeScores filtered all expired fixtures.
- Availability: Captured 503 responses at 18:38:14.109Z and 18:38:23.797Z reported memory-budget exhaustion (33,553,172 allocated/consumed bytes). Retries succeeded; root cause remains unestablished. Earlier failures and the misleading runner assertion are preserved and corrected above.
- Preservation: Each network-capable attempt removed its disposable resource and verified DAV 404. Full production score document and policy identities matched before/after each run. All credential-bearing processes exited.
- Browser: A new temporary live-game tab opened the normal Leaderboard control and refreshed Adventure successfully: 25 rows, completed status and five-day notice, no captured warnings/errors. Synthetic deletion was tested separately through request/storage checks, not by inserting fixtures in the production UI. Temporary tab closed.
- Changed: Added reusable isolated runner, sanitized receipts and SCORE-EXPIRY-VERIFICATION.md; updated PLATFORM-REQUIREMENTS.md and REMAINING-WORK-IMPLEMENTATION.md to close bulk-cleanup verification and retain memory-budget investigation as open.
- Verification: Repository check passed (31 documents, 243 local links, 339 scanned files before final artifacts; secret scan limited to high-confidence patterns). Tracked diff whitespace check passed. No production runtime or policy changed, so no build/deployment is required. Evidence patch and SHA-256 manifest accompany this audit. Mirror preflight matched the preceding decision's recorded hashes.
- Status: Completed locally; changes remain uncommitted and unpushed. No support message sent.
