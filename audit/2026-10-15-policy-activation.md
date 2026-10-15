# Public policy activation investigation

## PA-01 — Plan

- UTC: 2026-10-15T19:05:11Z
- Actor: Codex.
- User request: "Can you do those steps?" referring to timing, consistent rule versions and readiness before allowing writes.
- Plan: Fresh-read official permissions, triggers and protocol documentation; inspect available OPTIONS/version metadata. Create one uniquely named disposable data document and one policy document scoped only to that data path. Use Sessel GET revision markers and POST validation to distinguish revisions without relying on the separate JavaScript memory issue. Observe initial rule discovery, conditional A-to-B update, removal of the fixture's POST grant and policy deletion. Sample public GET/OPTIONS and bounded synthetic POSTs at measured offsets, including beyond 60 seconds, and inspect stored fixture rows through DAV. Record source ETags/readback separately from executed revision evidence.
- Boundaries: Production scores and rules are read only for identity/hash preservation. The only public grant is temporary POST access to the synthetic fixture's #records list. No production permissions expand. No secrets or real player payloads in receipts. Use hidden TTY owner input and exact host identity checks; remove both fixture documents and verify authoring 404 even on failure.
- Outcome standard: Report observed times, reversions, rejected/accepted writes and documentation limits. A finite sample, an ETag, OPTIONS or a few successful probes cannot by itself prove all workers use the new revision. Do not enable production policy migrations without a supported contract.
- Files: Reproducible diagnostic tool, sanitized receipt, findings and current assessment/bug-log updates if warranted, audit evidence and outer mirror copies.
- Verification: Pending. Prior evidence showed A after B and post-deletion execution; the DAV authoring bypass is already resolved as intentional and is not retested as a defect.
- Lookup correction: An initial history search ran from the parent workspace and missed game files; repeating it in the game checkout found the prior receipts. No remote operation occurred during that lookup.
- Research access: Web open could not retrieve the three known official /all/ URLs. Direct HTTPS reads of those same URLs will provide source evidence if available.

## PA-02 — Separate marker and mutation resources

- UTC: 2026-10-15T19:12:57.4635897Z
- Actor: Codex; reference PA-01.
- Observation during first run: Stored source A/B and later public GET markers demonstrate delayed execution changes. POST behavior becomes 403 while OPTIONS still lists POST. The diagnostic GET trigger returns 418 on the same document used for writes; that can interfere with internal document reads used for selector authorization. Do not treat those write failures as clean evidence of permission propagation or validator behavior.
- Revision: Preserve the first run and let its bounded cleanup finish. Repeat with a dedicated read-marker resource and a separate ordinary-readable write target, both covered by exact path filters in the same disposable policy document. This removes the read-response interference hypothesis. Retain conditional publication/readback, measured observation windows and production-preservation checks. Compact console summaries while retaining complete evidence in the receipt.

## PA-03 — First run completed; corrected run in progress

- UTC: 2026-10-15T19:17:15Z
- Actor: Codex; references PA-01 and PA-02.
- First receipt: audit/2026-10-15-policy-activation-3976e3c5-2fb6-4fe6-b361-7d28e6cf49bc.json. Policy deletion and target cleanup each returned 204, with DAV reads confirming 404. Read markers lagged stored updates; write conclusions remain confounded by the marker on the write target.
- Preservation exception: The production policy identity stayed identical, but the full production document hash changed between before/after reads. The runner's mutation allowlist excludes /scores.html. No record snapshots were retained, so the cause of that concurrent difference is undetermined; do not claim complete production document preservation for this run or restore its earlier contents.
- Corrected run: Started with separate read-marker and mutation resources. Initial A samples return 206 for A and 422 with activation-reject-A for B, with only A rows appended. This establishes that the corrected fixture can exercise actual validation. Later phases and cleanup pending.
- Files changed: This audit, tools/policy-activation-probe.mjs (PA-02), first receipt. Runtime and production policy source are unchanged by this investigation.

## PA-04 — Corrected experiment and assessment

- UTC: 2026-10-15T19:23:00Z
- Actor: Codex; references PA-01 through PA-03.
- Changes: Saved the separate-marker run; wrote POLICY-ACTIVATION-VERIFICATION.md with reproduction, timing limits and provider questions; added PB-002 to BUG-LOG.md as observed behavior requiring a contract clarification, not a confirmed violation; updated PLATFORM-REQUIREMENTS.md and REMAINING-WORK-IMPLEMENTATION.md. Existing publication guards remain unchanged.
- Why: Source B remained inactive in public validation through the sample completed at 41.560 seconds and was active by 67.092 seconds. Grant revocation was observed sooner than trigger revision change. After deletion, ordinary GETs were followed by execution of the deleted trigger. OPTIONS/ETag/readback cannot substitute for an all-worker activation barrier.
- Evidence: Corrected receipt c66eb3d1-8b2b-462a-b310-c2803cef3d86; initial receipt retained with its confound and production full-document identity exception. Both have 29 samples; all prior synthetic rows preserved; no additions after revocation. Corrected run appended 13 A and two B records. All five resources across both runs returned authoring 404 after deletion. Corrected run production document and policy identities stayed unchanged. No support message sent, runtime deployment or production policy mutation performed.
- Review corrections: Receipt reconciliation corrected the report's initial draft count from 14 to 15 accepted records and from 15 to 14 revocation/deletion samples before delivery. A PowerShell rg wildcard path failed with invalid filename; subsequent explicit-file parsing read the references successfully. Neither lookup changed remote state.
- Verification: Receipt structure/count/cleanup checks passed. Repository link/limited credential check and final whitespace/diff/mirror reconciliation pending below. No game regression suite run because only documentation and a diagnostic tool changed.


## PA-05 — Final verification and evidence packaging

- UTC: 2026-10-15T19:23:06.6096906Z
- Actor: Codex; reference PA-04.
- Verification: Repository check passed (34 root Markdown documents, 265 local links, 359 scanned files; limited credential-pattern scan). Tracked diff whitespace check passed. Both receipts reconciled with report counts and deletion evidence. Outer mirror baseline comparisons passed; no independent edits will be overwritten.
- Evidence package: Task-only review patch and SHA-256 manifest; canonical files mirrored to the user-facing project directory, with hash equality required. Prior unrelated working-tree changes retained. Source remains uncommitted; no push/deployment requested or performed in this investigation. Native readiness remains open pending a supported provider contract. Honcho tools were unavailable, so no persistent-memory write is claimed.

