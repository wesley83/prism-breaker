# Score expiry acceptance decision

## SE-01 — Plan

- UTC: 2026-10-15T18:03:02Z
- Actor: Codex.
- User reference: Wesley accepted the recommendation to expire scores after five days and physically delete them on subsequent online leaderboard access ("Great.").
- Plan: Record the revised acceptance criterion in the current platform requirements and remaining-work assessment. Preserve the earlier unattended-deletion research as historical context. Keep verification of multiple expired-record deletion and preservation of active controls open.
- Why: An unattended scheduler is no longer a dependency for the accepted score-retention behavior.
- Affected files: PLATFORM-REQUIREMENTS.md, REMAINING-WORK-IMPLEMENTATION.md and this audit with separate patch/hash evidence; synchronize these records to the outer authoring mirror.
- Verification: Source inspection confirms expiry filtering, a GET cleanup processor and browser cleanup request exist. No new live behavior verification, implementation, policy change or deployment is authorized or claimed by this documentation update. Diff/hash reconciliation pending.

## SE-02 — Decision recorded

- UTC: 2026-10-15T18:05:33.7582513Z
- Actor: Codex; reference SE-01.
- Changed: Current requirements and assessment now accept five-day ranking expiry with physical cleanup on subsequent online leaderboard access. Prior no-traffic research is preserved as historical context. Multiple expired-record deletion and active-record preservation remain pending verification.
- Why: Record Wesley's explicit acceptance without claiming new implementation or live evidence.
- Verification: Reviewed the documentation diff; whitespace check passed. Source inspection confirmed the existing filtering and cleanup requests. No runtime tests were needed for these documentation edits. Patch and SHA-256 evidence are saved alongside this entry. Outer mirror preflight matched the baseline or current content; only this change batch is synchronized.
- Status: Documentation complete locally; not committed or pushed. No game deployment or policy change performed.
