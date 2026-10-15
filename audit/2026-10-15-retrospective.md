# Retrospective audit

## RT-01 — Plan

- UTC: 2026-10-15T03:38:16Z
- Actor: Codex
- Request: Full retrospective of missed issues: what happened, how they were missed, prevention measures, and further reviews needed to find remaining issues.
- Plan: Reconcile repository history, authoring notes, user-reported issues, audits, bug reports, test fixtures, release tooling and readiness claims. Distinguish confirmed implementation defects, platform defects, expected behavior, usability/design feedback, requirement gaps and unverified cases. Create a comprehensive evidence-linked retrospective and prioritized follow-up review plan with concrete acceptance criteria and truthful statuses. Record actual prevention controls already present versus proposals. Check documentation/evidence discoverability and test/release infrastructure; do not claim a fresh runtime audit or physical device verification from this retrospective.
- Files planned: RETROSPECTIVE.md, FOLLOW-UP-REVIEW-PLAN.md, README documentation links, this audit and hash evidence. No gameplay edits, new tests, deployment, external messages or issue submission planned. Publish documentation only if within the existing repository-publication authorization, with explicit evidence and no secrets/private score payloads.
- Initial state: Clean main c77f341; last tested/deployed runtime a998edcd3009a53d6733; 136 tests in its recorded result. Honcho context tools unavailable. Early authoring material may be incomplete; preserve that evidence limit rather than reconstructing unrecorded tests as facts.

## RT-02 — Findings and documentation batch

- UTC: 2026-10-15T03:50:52.014Z
- Actor: Codex; reference RT-01.
- Changes: Added RETROSPECTIVE.md and FOLLOW-UP-REVIEW-PLAN.md; linked both from README. Reconciled missed gameplay, PWA, sharing, document-model and platform failures with existing audits; separated feature requests, expected behavior, confirmed defects, unresolved contracts and unverified device paths. Defined 14 prioritized reviews with owners proposed, pass conditions and explicit pending status.
- Findings: Earlier collision tests encoded the incorrect lower-center rule; visual solid endcaps and physics differed. Update checks bypassed natural discovery. Mobile/native integration and failure combinations were incompletely established. Actual world-write enforcement and policy freshness remain unresolved; five-day physical deletion remains access-driven. Live GitHub API returned zero Actions workflows; publisher invokes build/readback but no behavioral suite. Four unique README-linked documents exist only in the authoring tree. Physics ruleset evolution needs policy review, not automatic score invalidation.
- Evidence: audit/2026-10-15-retro-document-links.json and audit/2026-10-15-retro-evidence.json, including 17 baseline file hashes and four authoring-note hashes. Historical authoring notes are retrospective evidence, not complete transcripts. Branch protection and the original reporting device/session were not inspected. Honcho tools remain unavailable.
- Verification: All 39 local links in the two new documents resolve; git diff --check passes (README line-ending normalization notice only). No new runtime test, browser run, live runtime verification or deployment performed. The 136-test result is historical evidence from the latest correction, not a rerun. Existing broken README links are intentionally tracked for R14 rather than silently publishing unrelated notes.
- Remaining: Final diff/hash evidence, scoped authoring-mirror equality, commit and repository publication verification pending. Prevention infrastructure and follow-up reviews are proposed, not claimed implemented.

## RT-03 — Reconciled documentation evidence

- UTC: 2026-10-15T03:51:43.472Z
- Actor: Codex; reference RT-01/02.
- Verification: Reviewed the staged scope: two new reports, two README links and retrospective audit/evidence only. No public runtime, tests, tools, settings or infrastructure changed. Seven scoped files copied to the authoring mirror with exact byte equality, including zero-context review patch. Staged diff whitespace check passed. Existing four missing README-linked historical notes remain explicitly queued; all 39 links in the new reports resolve.
- Evidence: audit/2026-10-15-retro-changes.patch captures the complete reviewable report/README additions; audit/2026-10-15-retro-hashes.json records working-byte hashes, excluding itself to avoid self-reference. Git may normalize text line endings. Hash receipt and final audit mirror equality will be checked before commit.
- Publication: Documentation-only commit/push planned under the continuing personal-repository publication authorization. No game deployment needed or performed; latest runtime remains the last recorded release, not a new live verification. CI and the 14 review items remain pending as described.
