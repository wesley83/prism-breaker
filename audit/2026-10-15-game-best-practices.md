# Reusable game development guide

## GP-01 Plan

- UTC: 2026-10-15T22:38:30.3780178Z
- Actor: Codex.
- User request: Analyze the conversation history and audit log and create a comprehensive reusable best-practices document for future games, including leaderboards, balance, engagement, favicons, OG artwork, PWA/platform behavior and responsive screens.
- Plan: Inventory all repository documentation and audit records; trace lessons through early design notes, regressions, corrections, final evidence and current code. Read chronological audit narrative and inspect relevant receipts. Verify changeable web-platform guidance against primary documentation. Synthesize a generic guide with concrete examples, architecture boundaries, failure modes, acceptance criteria, reusable project/release checklists and a source index. Preserve the distinction between historical findings, later corrections, unresolved platform behavior and human acceptance.
- Deliverable: GAME-DEVELOPMENT-BEST-PRACTICES.md in the game repository and user-facing mirror; README discovery link; audit inventory, source/evidence hashes and documentation validation. Use established repository Markdown, not a cloud Page. No runtime changes, test-suite execution, production writes, commit/push/deployment or new automation required.
- Evidence boundary: The supplied conversation contains user requests and recent assistant/tool records; older assistant turns are not all visible. Repository audit narratives and available receipts supply recorded outcomes. Early design notes may be retrospective; no claim that unrecorded events were reconstructed. Honcho tools unavailable.
- Scope: Generalize beyond brick breakers to puzzles, strategy, action, narrative, rhythm and cooperative/multiplayer possibilities without claiming this game proves all genres or native real-time networking capabilities. Keep durable user interface conventions and platform ownership decisions explicit.
- Status: Planned; collection and synthesis in progress.

## GP-02 Superset and evidence plan refinement

- UTC: 2026-10-15T23:07:00Z (planning timestamp; exact write time will be recorded by the final evidence receipt).
- Actor: Codex; reference GP-01 and the user's additional superset requirement.
- Baseline: The exact parent DOCUMENT-FIRST-DEVELOPMENT.md, 29,189 bytes, SHA-256 c18dadce85e2b419e4a3b24f35c36fb9cdbb9fb20b60b8f8ed8bb5ad2b0a2ac6. It includes the relational-integrity subsection. Do not substitute the repository's older copy or alter the parent document.
- Plan: Preserve the entire parent baseline verbatim as Appendix A, with an explicit 23-rule crosswalk and extensive game-development chapters. Validate exact embedded bytes before delivery. Explain the support-confirmed trusted DAV authoring exception alongside the baseline's persistence-boundary principle.
- Research: Reviewed root project reports, source excerpts and chronological audit headings/findings/outcomes; distinguish extracted audit coverage from a line-by-line reading of every raw receipt. Index and hash the available historical corpus; inspect relevant receipts through their reports. Older assistant turns and unrecorded human/device results cannot be reconstructed.
- Source limits: Official browser references retrieved through web tools. The web.dev lifecycle page and three official Pagelove reference pages returned tool Internal Error; use the successfully retrieved MDN lifecycle reference and dated repository provider research, clearly identified as historical evidence. No new provider behavior is asserted.
- Changes next: New guide, source inventory, README link and task evidence only. Retain known open hardware/human/provider questions and later requirement changes; no runtime or production mutation.
- Verification pending: Exact baseline inclusion, all 23 rules represented, local links, current-source facts, limited credential-pattern scan, scoped diff and safe mirror equality.

## GP-03 Timestamp correction

- UTC: 2026-10-15T22:44:56Z.
- Actor: Codex; reference GP-02.
- Correction: GP-02 used an incorrect estimated time, later than the actual clock. This entry records the observed tool clock immediately after that write. The plan and baseline hash are unchanged; no guide implementation has occurred yet. Preserve GP-02 as an explicitly corrected record and use measured times for subsequent entries.

## GP-04 Guide completed and documentation verified

- UTC: 2026-10-15T22:56:49.149Z.
- Actor: Codex; references GP-01 through GP-03 and the user's superset requirement.
- Changes: Created GAME-DEVELOPMENT-BEST-PRACTICES.md with 26 handbook sections, reusable project/release/bug templates, source map and exact parent baseline appendix. Added README discovery link and source/validation receipts. Covers document ownership/relations/editor contracts, gameplay/state/physics, balance/scoring/effects, shared scores/daily/expiry, responsive access, scenes/audio/performance, branding/favicon/OG/sharing, PWA/platforms, release/CI and incident learning. Preserves user choices and unresolved human/device/provider acceptance. No runtime or policy files changed.
- Evidence reviewed: Available user-request history, root project reports, chronological audit headings/findings/results, selected current implementation and primary browser references. Inventory contains 304 files: 35 root Markdown inputs, 36 audit narratives and 252 total historical audit artifacts, plus selected source/artwork/tool inputs. Inventory hashes establish corpus identity, not a claim of manually reading or replaying every raw artifact.
- Verification: Documentation validator confirms all 29,189 original baseline bytes embedded exactly, all 23 numbered principles mapped, 27 internal navigation anchors resolve, code fences balanced, no extension trailing whitespace and all 304 source inventory hashes match. Repository check passed: 36 root documents, 344 local links and 416 scanned files at that point; credential scan is limited to known high-confidence patterns. Tracked diff whitespace check passed. Source facts for score calculation, age bands, ranking and fullscreen boundaries rechecked.
- Final scope: Guide has 17,507 whitespace-delimited words including the preserved baseline. This is a documentation-only synthesis, not another gameplay audit or production-readiness certification. No gameplay suite, live provider probe, hardware review, commit, push or deployment performed. Honcho unavailable.
- Reconciliation: Canonical checkout 54a24854bc47e4fd540e3749aa55b52ec4636f07; mirror preflight confirmed no independent changed content in target files (README matches known Git baseline after line-ending normalization). Final full additions/README diff and working-byte SHA-256 manifest are generated separately, excluding self-reference. Copies and byte equality are checked by the finalizer; any failure stops with an error. Historical evidence and the parent baseline are unchanged. Git may normalize Markdown line endings on future commits; this exact-byte claim describes the saved working-file snapshot.
