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

## RW-08 — Exact-source CI passes and live release begins

- UTC: 2026-10-15T16:18:42.289Z
- Actor: Codex; references RW-05/06/07.
- Verification: Commit 95a49cec3d7d44195fc0df8366e52a2e21c32838 passed exact-source local gate at 16:16:49.733Z, source digest 27f4c73933646562ed5d01bec28c364c46ddcc923b536fdf1bd3950754fa735a, runtime d77abd4a8738088292f7. Hosted Linux Quality run 38767672162 passed frozen dependencies, advisory audit, build/no drift and release checks. Protected main accepted that checked commit.
- Live baseline: Independent public inventory still d2fa444df7cfd477dcf9 / 72 assets, all valid, with fullscreen manifest and matching home. Publisher auth confirmed expected console host (200) and authoring DAV (207); credential retained only in process memory.
- Authorized next mutation: Stage immutable d77 dependencies with create-only conditions and readback; revalidate source gate; conditionally promote same-release root entries and worker. Save private entry backups and sanitized checkpoint/receipt. Preserve scores, score policies, world definitions, root legacy modules and old releases. No candidate policy activation or public permission change. Results pending actual operation.

## RW-09 — Immutable HTML staging refusal; entries preserved

- UTC: 2026-10-15T16:20:12.008Z
- Actor: Codex; reference RW-08.
- Failed attempt: Live dependency staging created/read back the early immutable assets, then refused editor-template.html on structural comparison. No root entry promotion was reached; index/worker/score policies/world definitions remain untouched by this attempt. Credential session remains in memory for scoped investigation.
- Plan: Save only the public template readback privately, compare normalized DOM structures against the exact staged source and identify the difference. If harmless storage normalization is confirmed, narrowly correct the canonical comparison with regression coverage; otherwise repair the source. Do not skip HTML verification or overwrite immutable files. Commit/rerun source gate and hosted CI before retry. Existing staged assets may be reused only after content validation.

## RW-10 — Entity serialization isolated and comparison corrected

- UTC: 2026-10-15T16:21:05.660Z
- Actor: Codex; reference RW-09.
- Evidence: The staged template text Select & move was serialized with an escaped ampersand, which the local parser exposed as three adjacent text nodes instead of one. Attributes and remaining structure matched. The comparison trimmed each node separately, causing a false mismatch.
- Correction: DOM normalize merges adjacent text nodes before canonical whitespace processing. Verified equality on the actual saved provider readback; added a regression for raw/encoded ampersands while retaining rejection of changed executable references. No template bytes, runtime version or asset inventory changed; existing immutable files can be revalidated without overwrite.
- Pending: Fresh full suite/gate and hosted exact-source CI for this publisher-only correction, then retry staged release. No root entries promoted by the failed attempt.

## RW-11 — Publisher correction reconciliation

- UTC: 2026-10-15T16:21:53.486Z
- Actor: Codex; references RW-09/10.
- Verification: Actual readback matches after adjacent-node normalization; targeted immutable/publication suite passes 8 tests. The old authenticated process was closed so its cached publisher module cannot be reused after source correction. Complete affected mirror preflight passes against 95a49ce/current bytes. Patch/hash evidence for the correction is separate from the original implementation receipt.
- Next: Commit correction, rerun exact-source full gate and required hosted CI, restart publisher and revalidate/reuse staged immutable files. Root entries remain on the previously verified live release until successful promotion.

## RW-12 — Retry read optimization

- UTC: 2026-10-15T16:22:49.411Z
- Actor: Codex; reference RW-11.
- Changed: Existing immutable files reuse the validated GET response for comparison; newly written or concurrently created files still receive post-write readback. This avoids duplicate GETs during staged retries while retaining collision refusal. No runtime/package version changes. Regenerate correction patch/hashes and mirror before commit; exact-source full gate/CI remain required.

## RW-13 — Corrected publisher cleared for retry

- UTC: 2026-10-15T16:25:01.826Z
- Actor: Codex; references RW-10/11/12.
- Verification: Source 7489058a2743229466e1227f315892ffcf6d704a passed the full exact-source gate (170 tests, source digest 44ad38baf4ad524530f21a2581de5704108c63a70d933450de9f21fc5ab0e9b3), hosted Linux run 38768593148 succeeded, protected main accepted the checked source. Runtime stays d77abd4a8738088292f7.
- Retry: New authenticated process uses the corrected module. Revalidate existing immutable content and continue staging; retain create-only conditions and root ETags. No policy/world/score data migration. Outcome pending actual retry.

## RW-14 — Game release verified; native editor route failure found

- UTC: 2026-10-15T16:30:23.385Z
- Actor: Codex; reference RW-13.
- Completed: Immutable release d77abd4a8738088292f7 staged and promoted with source 7489058, 81 file records. Independent live check passes 72/72 assets and entry/fullscreen manifest. All 70 legacy root cache assets match pre-release hashes. Owner readbacks confirm full score resource and policy identity unchanged. Auth publisher closed.
- Browser: Actual public d2fa client offered Update game; applying it reached d77 immutable bootstrap, enabled controls, retained Continue adventure and offline-ready status, with zero captured errors.
- New failure: A separate direct public read of native /editor/prism-garden returned 500 after the game release. Local compiled editor passed, so local static success did not cover native include semantics. Do not close editor acceptance. Preserve provider error privately, isolate direct shell/template versus parameterized composition, correct the cause or safely restore a coherent route, and rerun source/CI gates before any fix publication. Core game remains verified; world data/policies must be preserved.

## RW-15 — Live verification and remaining limits finalized

- UTC: 2026-10-15T16:33:55.083Z
- Actor: Codex; reference RW-14.
- Actual publication: 2026-10-15T16:25:27.417Z, runtime d77abd4a8738088292f7, 81 staged/promoted file records, source 7489058a2743229466e1227f315892ffcf6d704a. Independent 72-asset inventory plus root entry/manifest checks pass. Entire score source/policy unchanged; all 70 legacy root cache assets unchanged. Publisher credential process exited.
- Editor investigation: The first direct request's status 500 is preserved with missing-body limitation. Later direct shell/template/route reads and three cache-busted native composition reads returned 200 with embedded world/shell/immutable bootstrap. Actual browser restored draft and launched preview without captured errors. No code edit was necessary for recovery; cause remains unknown, not claimed fixed. Added scoped provider observation to platform requirements.
- Game browser: Actual public d2fa update reached d77 immutable bootstrap, ready-to-play-offline and enabled play, retaining Continue adventure with zero captured errors. Separate prior desktop server-stopped reload and two-tab version checks remain scoped to their recorded interim/final releases.
- Changed records: Final implementation report, sanitized live browser/deployment/native-route/preservation/CI receipts. No private scores, native message bodies or credentials published. Full unattended retention, public activation guarantee, physical phone and independent human criteria remain open; owner DAV/casual board choices remain selected.
- Finalization plan: Baseline-safe mirror/hash/diff reconciliation of report/evidence, commit, exact-source gate and required CI, then main integration and remote SHA/clean-tree verification. Stop owned fixture servers/tabs. No further runtime release is necessary for these documentation-only edits.

## RW-16 — Final evidence reconciliation and cleanup

- UTC: 2026-10-15T16:36:47.078Z
- Actor: Codex; reference RW-15.
- Verification: Final report/native dependency clarification and sanitized provider/browser/CI/preservation receipts reconciled against 7489058/current authoring bytes. Repository checks pass (30 documents, 232 local links, 327 scanned files before final artifacts). Final patch/hashes cover these documentation/evidence edits; deployed runtime stays d77abd4a8738088292f7.
- Cleanup: Auth publisher exited, all six owned implementation/review tabs closed, user tabs retained. Both remaining owned preview servers interrupted and exited; the earlier offline-test server had already been stopped. No external messages, extra services, score-policy migrations or world-data mutations.
- Final source status: Documentation/evidence commit, exact-source gate, required CI and main/remote SHA verification follow this entry. Runtime publication/readback already verified separately; no further asset upload needed for these records. Hardware/human and platform dependencies remain open.
