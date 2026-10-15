# Remaining implementation work

## RW-01 — User request and implementation plan

- UTC: 2026-10-15T15:41:50.010Z
- Actor: Codex; user request: implement all changes in the updated What needs to change assessment.
- Baseline: main 7384e313238d8489f208f6cc55b3be4049b326bf; deployed runtime last independently verified d2fa444df7cfd477dcf9. Current live state requires fresh reads. Honcho tool discovery again unavailable.
- Scope/constraints: Native Pagelove and browser features only; no external retention/validation service, no anonymous world-write expansion. Support-confirmed DAV authoring bypass remains expected behavior. Preserve real scores/world documents, compatible saves and existing gameplay unless a separately documented ruleset decision is necessary.
- Plan phase 1: Research official native scheduling/TTL, authenticated application mutations and policy activation capabilities using live official references; inspect source and existing diagnostics. Record supported mechanisms versus absent/unverified guarantees. Do not invent a timer or claim traffic-driven cleanup is unattended.
- Plan phase 2: Implement immutable versioned game assets and coherent entry/publication, stage/verify dependencies before switching entry/worker, preserve rollback and old clients, and extend release/check tooling. Revise any tests only if user-authorized review execution requires it; existing required CI remains active.
- Plan phase 3: Implement supported native retention and validated world publishing only if a supported safe mechanism is established. Investigate and contain fresh public-policy exposure without relying on repeated passing probes as a propagation guarantee. Use uniquely scoped disposable resources for justified provider checks and record cleanup/readback; preserve production records.
- Plan phase 4: Add a concrete physical Android/iOS/native receiver and independent human review procedure with machine-readable evidence/acceptance records; run available desktop/keyboard/responsive checks. Ask for actual hardware/reviewer availability asynchronously. Do not substitute automation for human or phone evidence.
- Plan phase 5: Address optional leaderboard trust architecture if required by the user scope, preserving existing casual records and avoiding unsupported anti-cheat guarantees. Clarify migration/product choices before dependent changes.
- Finalization: Update assessment/README/architecture, audit batches/failures/exceptions and reviewable diff/SHA-256 evidence. Reconcile authoring mirror against baseline. Commit on codex branch, pass exact required CI and publisher gate; publish authorized coherent runtime and verify public inventory/update flow. Keep blocked hardware/platform requirements open with exact reasons and ready next steps, not falsely complete.
- Initial research status: Web search returned no indexed results; web open of official all/reference URLs failed through the web tool. Direct official HTTP read and existing local documentation are next fallbacks. No implementation changes yet.

## RW-02 — Research results and confirmed scope

- UTC: 2026-10-15T15:47:07.288Z
- Actor: Codex; reference RW-01.
- User decisions: No devices or independent reviewer available; retain owner DAV publishing only; retain current casual leaderboard. Therefore no authenticated application-write grant or verified-run board is to be created. World-publishing trust and optional leaderboard redesign are resolved product choices, not remaining implementation promises.
- Research: Direct official HTTP reads succeeded for the complete /all/ index and all relevant data, execution, permission, request and reaction sections. Search/open tool failures were access/index limitations, not absence of documentation. Native server JavaScript explicitly lacks setTimeout/setInterval and fetch; request triggers/processors require requests. No supported shared-record unattended scheduler/TTL was identified. Sessel p:ttl examples concern transient/session data and cannot be assumed to implement a shared persistent leaderboard. Unattended deletion remains blocked pending a native platform facility or explicit requirement revision; no external service added.
- Permissions evidence: Native authenticated application writers and verified-email actors exist, but are outside the user's selected owner-DAV scope. Public request policies and DAV authoring remain distinct. Do not activate the old world candidate or keep probing for authoring enforcement.
- Implementation revision: Generate an ignored, content-identified immutable package; root game entry references only its own package for runtime assets. Stage and read back immutable files before switching entries, retaining root legacy assets for old clients. Worker downloads package URLs but retains logical cache keys and client pins; recognizes release-prefixed requests without splicing other versions. Editor composition includes its same-release template. Add rollback using an already verified local package, conditional root entry writes and deployment checkpoints.
- Safety boundary: Current score rules remain preserved during game publication. Fresh public-policy discovery timing lacks a guaranteed activation barrier; do not add or widen public DELETE rules. Prepare a native capability/support specification and a gated rule-change procedure rather than claiming a cache-warming probe proves safety.
- Affected upcoming files: tools/immutable-release.mjs, tools/build-pwa.mjs, tools/service-worker.template.js, tools/remote.mjs, tools/serve.mjs, read-only release verification and associated regression/review tooling; source-generated worker/module/entry and documentation. Verification pending implementation.

## RW-03 — Immutable graph, policy guard and acceptance tooling

- UTC: 2026-10-15T16:01:26.768Z
- Actor: Codex; references RW-01/02.
- Changed: Immutable packager/publisher, package-aware worker and local preview, rollback worker retention, exact ETag entry promotion, preserved legacy root modules and prior packages. Candidate world activation permanently refuses the selected DAV contract. Native score migration rejects changed policies; game deploy cannot initialize/replace scores. Added 14 semantic HTML acceptance checks and a private record/status validator; review sources now included in source identity/scanning.
- Review corrections: Immutable snapshots initially included root-only schema-bearing HTML, risking duplicate native schema discovery; now only cached assets plus the schema-free editor template are staged, while root-only documents remain local promotion inputs. Extra template sources participate in release identity. Exact-version immutable network fallback permits coherent online recovery after eviction without reusing root aliases or falsely reporting offline readiness.
- Failed attempts: First targeted suite had 30 pass/1 fail because plaintext existing HTML yielded a null documentElement during comparison; corrected to a distinct raw identity. An initial repair patch referenced an absent test context, was rejected and changed no files; a scoped patch succeeded.
- Verification: Subsequent targeted suite 29 pass/0 fail; full suite at that stage 168 pass/0 fail across 21 files. Local actual Chromium updated d2fa444df7cfd477dcf9 to interim c27c6272afcf8cc2f916, reached offline-ready, retained fixture personal best, loaded bootstrap from its immutable directory, enabled Adventure and showed no captured errors. Later safety edits require rebuild/recheck; not claimed covered by that browser result.
- Native retention research update: Official transient reference explicitly describes session-only writes, fixed 30-day expiry and ignored per-element TTL values. This is not shared five-day TTL. User's no-device/no-reviewer status recorded in the private initialized record (14 not-run); no false human/hardware pass. Physical/native receiver and strict unattended deletion remain blocked.
- Pending: Final browser/automated validation, current assessment/docs, file hashes/mirror, exact-source commit/CI, live publication/readback. No new production score, world or policy mutations performed.

## RW-04 — Final implementation review and verification

- UTC: 2026-10-15T16:13:26.614Z
- Actor: Codex; references RW-01/02/03 and confirmed user decisions.
- Final candidate: d77abd4a8738088292f7, 72 cached assets, 2423935 bytes. Source physics/ruleset/official formations unchanged. Full local suite: 170 pass, zero fail, 21 files; saved output. Repository checks: 30 root documents, 222 local links, 310 scanned files before final receipts.
- Final review fixes: Immutable package verification checks every local input before provider access. Worker/inventory identity validated before promotion. Root readback requires ETags only where conditional replacement needs them; immutable assets rely on create-only writes and content verification. Live verifier now fails wrong home/manifest/dependency identity even when every cached asset succeeds, correcting the previous asset-only pass boolean. Added damaged-package and mixed-entry/manifest refusals.
- Browser verification: Actual final d77abd4a8738088292f7 update retained resume and offline readiness while older 31591d6326d6abfc91b3 tab kept its own script identity. Fresh-origin 31591 stopped-server reload started Adventure. Compiled final editor and 3D preview loaded without captured errors. Evidence is scoped to Chromium desktop; hardware/human records remain 14 not-run.
- Documentation: Added publication/rollback contract, native platform dependency/support specification, implementation status and semantic acceptance procedures. Updated current README/architecture/assessment and project instructions for selected owner-DAV/casual boundaries. No global preference or public write grant changed.
- Pending finalization: Review complete affected diff and baseline-safe authoring mirror, save final SHA-256/patch evidence, commit, exact-source gate, required CI, then live immutable staging/conditional promotion and readback. Neither platform capability nor unavailable hardware/human outcomes is claimed implemented.

## RW-05 — Source publication preparation

- UTC: 2026-10-15T16:14:36.243Z
- Actor: Codex; reference RW-04.
- Plan: Baseline-safe mirror preflight over the complete affected Git file list, preserving private runtime and context-specific authoring ignores. Stage only that reviewed list, save the complete staged non-audit patch and affected SHA-256 receipt, copy/check mirror equality, and reject any staged diff or repository-integrity failure before commit. Final source gate and exact hosted CI must pass before main integration/deploy.
- Verification already completed: 170 tests/21 files pass; final candidate d77abd4a8738088292f7 remains unchanged. Root/local-link checks pass (30 documents, 224 links, 313 scanned files before new baseline receipt/artifacts). User-selected trust decisions retained; all 14 human/device checks are still not-run. No native timer, TTL or policy readiness guarantee is claimed.
- Publication operation: Authenticated immutable dependency staging and conditional self-contained root entry promotion only; scores, rules, definitions and legacy root modules preserved. If live normalized HTML or conditional writes fail, stop before proceeding, preserve failure/checkpoint, repair and rerun gate/CI as required; never bypass evidence to force release.

## RW-06 — Mirror and affected-source evidence reconciled

- UTC: 2026-10-15T16:15:19.960Z
- Actor: Codex; reference RW-05.
- Verification: Complete affected-file mirror preflight passed against baseline/current content. 33 source/doc/review/evidence files are copied with byte-equality checks. Private runtime and the separate authoring ignore file are unchanged. The staged non-audit patch includes new modules/tests/documents, not just previously tracked edits; final hashes cover affected working bytes and exclude the hash receipt itself.
- Status: All final source/doc edits reviewed. Commit, fresh exact-source gate, hosted CI and live publication/readback follow this entry; no successful publication is preclaimed.

## RW-07 — Evidence line-ending correction before commit

- UTC: 2026-10-15T16:16:12.578Z
- Actor: Codex; reference RW-06.
- Failed attempt: Staged diff check rejected the Windows CRLF test-output copy as trailing whitespace. Branch/staging and mirror copy completed, but the dependent commit did not execute. No push or deployment occurred. Tests themselves passed.
- Correction: Normalize only the new audit text copy to LF; preserve the raw ignored capture (SHA-256 160adafcb79335c515bac3021fd8b3495392b997e12a2d20b5136d1b9487fcf1). Regenerate the uncommitted hash receipt and recheck mirror/staging. All existing historical audit files remain untouched.
