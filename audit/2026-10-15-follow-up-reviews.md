# Follow-up review execution audit

## FR-01 — Execution plan

- UTC: 2026-10-15T13:08:27.421Z
- Actor: Codex.
- Request: Carry out the 14 reviews in FOLLOW-UP-REVIEW-PLAN.md.
- Baseline: main 86860052cabadcc01419faaeb30d6f5a5d9d5404; clean Git tree at start; last recorded live runtime a998edcd3009a53d6733, not freshly verified yet.
- Plan: Establish fresh baseline tests/build and inspect GitHub workflow/rule configuration. Review each R01–R14 using source inspection, independently derived cases, fault injection and supported real-browser flows. Implement reproducible application/tooling/documentation fixes, demonstrate failures before fixes when possible, and rerun affected and full checks. Add CI and exact-source release gate with negative demonstrations, restore reviewed missing docs, inspect actual host capabilities/read state and use only isolated resources for authorized provider probes. Preserve shared scores/world definitions and do not activate the blocked world guard. Keep physical devices/native receivers, human difficulty and unresolved platform contracts explicitly partial/blocked. No external messages, new services or automatic broad protection changes. Document actual executions separately from historical evidence and proposals.
- Planned files: relevant public modules/templates and generated assets if fixes needed; tests and local QA tools; .github/workflows; release tooling/evidence contracts; missing reviewed docs; FOLLOW-UP-REVIEW-RESULTS.md and review-plan status links; dated receipts, patches, hashes and audit.
- Verification: Pending. Honcho tools unavailable. Root MCP-SERVERS.md read; an initial lookup in the game repo correctly found no local copy and was corrected to the workspace root. No personal infrastructure access. No subagents spawned.

## FR-02 — Baseline and confirmed review targets

- UTC: 2026-10-15T13:14:21.762Z
- Actor: Codex; reference FR-01. User additionally requested a new What needs to change assessment after the reviews; include it in the final results.
- Fresh results: 136 tests pass, zero fail; PWA check a998edcd3009a53d6733 / 70 assets / 2416776 bytes. GitHub main is unprotected, protection disabled, no rulesets; official action tags resolved to checkout v4 11d5960a326750d5838078e36cf38b85af677262 and setup-bun v2 0c5077e51419868618aeaa5fe8019c62421857d6. Bun dependency audit returned empty JSON, exit 0.
- Reproduction: World import accepts a designerNote meta property and worldHTML silently discards it. Plan: reject unsupported direct structured metadata at each supported scope and reject unsupported structured child nodes while continuing to rebuild safe markup; add round-trip/adversarial regressions first. Source also lacks app/editor context-loss pause/recovery; verify through isolated UI and add shared lifecycle guards if reproduced.
- Plan batch: Implement repository integrity/limited secret-pattern checks, pinned read-only CI and a publisher gate tied to source commit/content and fresh successful suite/build/check evidence. Negative fixture demonstrations must prove failing tests/stale output cannot produce deployment approval. Restore the four reviewed authoring notes with historical provenance; do not rewrite their old eight-world observations as current. No branch protection changes until named checks demonstrably work.
- Tool limits/attempts: First local browser open preceded server startup and refused connection; its error-page tab could not be selected under URL policy. New local fixture tab opened successfully after starting the server. Web search returned irrelevant results and web open could not reach official docs; direct HTTPS reads succeeded for docs index/Trigger, while llms.txt and sitemap returned 404. Irrelevant search results are not evidence. No real-phone/browser installation exists in available surfaces.
- Files: tests/follow-up-review.test.mjs, tests/release-gate.test.mjs, tools/repository-check.mjs, tools/release-gate.mjs, tools/remote.mjs, .github/workflows/quality.yml, public/world-schema.js, graphics lifecycle helper/app/editor as needed, missing docs and reports; generated editor/policy/PWA files later. Verification pending fixes.

## FR-03 — New defects independently reproduced

- UTC: 2026-10-15T13:22:04.321Z
- Actor: Codex; reference FR-01/02.
- Physics: New independent two-segment wall oracle failed old engine at seeded case 167 (50ms stress step), then a separate fixed-step probe failed at case 1128 with dt=1/240. Start x=9.746397232338786, y=-10.650728908495513, wide paddle x=7.056439482606947 moving left, vx=15.862878344996556, vy=-13.761144233378243. Clamping at the wall discarded reflected inward travel. Correction retains reflected distance and separately sweeps both segments against the moving paddle. 6000-case oracle and existing geometry/engine checks now pass (37 targeted tests total). Probe's first run had an incorrect relative import; corrected before treating its output as evidence.
- Import: New regression failed before strict supported-property/child validation; now rejects unsupported fields rather than silently losing them. Hostile decorative markup still parses inertly and canonical reserialization contains no executable nodes.
- Graphics: Real Chromium WEBGL_lose_context fault through local UI left game playing, elapsed advanced 0.716666666666666 seconds and no error/recovery state appeared. Later snapshot had lost a life while rendering was unavailable. Plan: shared context-loss guard, pause simulation/audio, block premature resume, warm/resize on restoration, leave user in control of resuming; apply to game and workshop.
- Tooling: First multi-file patch failed atomically on an unmatched remote.mjs line; confirmed no partial files, retried scoped patch successfully. First integrity-test attempt missed side-effect imports; regex extended and negative case now passes. Gate tests demonstrate stale output, failed suite, identity/age/check omissions and credential/link failures block approval. No publisher network operation performed by gate demonstrations.
- Browser: Fresh accelerated 16-world/20-formation campaign reached 402100-point Adventure result; all 16 named endings and next-world text, including World 7→8 and 8→9, reported zero errors. This was accelerated damage, not human three-life completion. Existing fixture intercepts scores and disables worker registration; real PWA checks remain separate.
- Files: engine.js, world-schema.js, follow-up/release-gate tests, repository/release tools and pinned workflow; reviewed historical docs restored with provenance; graphics helper/tests added before app integration. Build regeneration and full verification pending.

## FR-04 — Recovery integration, build portability and platform probe

- UTC: 2026-10-15T13:30:27.783Z
- Actor: Codex; reference FR-01 through FR-03.
- Graphics: First restored-context browser check exposed Three.js compileAsync polling throwing isReady after renderer properties were reset. It left preparation unresolved. Replaced both preparation calls with synchronous compile while controls/simulation are paused; reused warm power pools to avoid discarding objects on rewarm. Final actual loss/restoration reports paused state, zero elapsed delta, recovery overlay shown then hidden, blocked true then false, no errors; resume remains explicit. Added same guard to workshop. Three new helper lifecycle tests cover failed/stale restoration and disposal.
- Verification fixture: An existing local service worker correctly pinned old modules and refused the new graphics helper, preventing updated QA bootstrap. Added an explicit network-client handshake to the isolated review fixture, matching the workshop strategy; this is a fixture correction, not a weakening of gameplay release pinning.
- Build: Full generation plus 148 tests passed; 71 cached assets. Repository checks currently pass 27 docs / 161 local links / 175 scanned files using a deliberately limited credential-pattern scan. Reports currently contain an in-progress placeholder; final results required before publication.
- Portability finding/plan: Existing Windows CRLF source working bytes differ from Git's LF checkout; byte-derived PWA inventory must be reproducible on Linux CI. Add .gitattributes for LF text, normalize only build/source/maintained-doc inputs (not historical audit evidence), rebuild and compare clean-checkout artifacts.
- Provider: First owner probe lacked network escalation and failed before authentication/creation; retried with network access. Fresh matrix accepted all tested owner DAV mutations and rejected public owner-key PUT with 401; all 12 isolated resources removed/read 404. Its immediate public GET controls returned 200, so this run alone does not prove an active reject trigger was bypassed. Follow-up freshness probe must establish positive controls after propagation. No production data, policy or authorization was changed.
- Platform documentation: Official linked reference sections retrieved by direct HTTPS because web reader failed. Current docs explicitly say transition constraints/handlers bypass WebDAV by design and DAV-edited transition rules take effect within 60 seconds. This narrows interpretation; do not extrapolate every general Trigger observation into a confirmed bug without the exact platform contract. No native TTL/scheduler guarantee found in inspected sections; absence from a search is not proof of platform absence.

## FR-05 — Further runtime/provider checks and scope correction

- UTC: 2026-10-15T13:47:41.809Z
- Actor: Codex; reference FR-01–04.
- Physics: Explicit 120 Hz replay against HEAD's old engine reproduces the wall miss at seeded case 1128. Added that exact case plus a complete ordinary-lives campaign collision bot as regressions. The unmodified-lives bot clears all 16 worlds/20 formations, reaches 174440 points in about 1370 simulated seconds, and earns its extra lives normally. No human difficulty claim.
- Storage: Real browser IndexedDB, two independent connections: queued after outage, one send on competing retries, durable sent receipt, original Daily day retained and aborted metadata transaction left no row. Temporary database closed and deleted.
- Rendering: Three complete passes over 16 worlds and every power-up leave renderer.info.memory at 34 geometries / 30 textures on each pass. Desktop resource counts, not physical mobile performance. Actual corrected context loss/restoration has no errors and leaves simulation paused.
- PWA lab: Older cached ebb648f339435f994a1c automatically offered A 1b5bccba9d380881f02e. A installed with checkpoint, Classic and one queued synthetic score preserved. Deliberately missing B engine asset kept A active/ready; restoring network and a manual check made B 269befd6252bcf6a2007 available; B activated and reloaded with all server requests returning 503, preserving state. No airplane-mode/OS kill claim. Rollback/old-tab check still running.
- Provider: Immediate probe had no positive reject control. A second matrix waited 65 seconds: JS and Sessel public GET reject controls returned 422, while owner DAV writes returned 200 and marker readback confirmed persistence. Public owner-key PUT returned 401; 12 disposable paths cleaned/read 404. Separate freshness probe retained policy A at 0/1/5/15/31 seconds, B and new C appeared at 61 seconds; one 91-second request returned 502. A deleted policy still executed B immediately after owner 404. All four paths cleaned. Current docs document transition-only DAV bypass/freshness; generic Trigger/DAV semantics still need platform clarification.
- Expiry: Fresh isolated policy sequence 403,204,403,500,403,403,403 included removal of an unexpired synthetic control. Settled unsafe/future deletion returned 403 and retained controls; explicit expired deletion returned 204 and preserved active row; GET-driven cleanup returned expired row first and removed it by next read. Strict unattended TTL remains absent. Synthetic resource cleaned by existing tool; production records untouched.
- Interface: Current release 519c9b4bb63a611f70b1 measured at 390x844: no horizontal overflow, Settings scrolls within viewport and focus returns to Settings. Launch top 748.375 is below canvas bottom 748. At 844x390 fullscreen, launch top 336 is below canvas bottom 326. Viewport change caused system fullscreen exit and paused as intended; explicit pause-menu fullscreen restored compact layout. Screenshot scaling in this emulated backend was inconsistent with DOM geometry; do not treat the tiny scaled screenshot as physical-device proof.
- Correction to FR-04: .gitattributes already specified LF before this work. The problem was CRLF working-copy drift, not an absent LF policy. Preserve its binary macros, normalize current source inputs, add JPEG and opaque historical-audit handling. Existing historical audit files were not normalized.
- Verification tooling: Limited import check now includes side-effect imports. A real deliberately failing Bun test in a disposable Git fixture blocks approval; edited post-check documentation also blocks publisher approval. Unit receipt validation covers identities, expiry and missing checks. No runtime review result has been inferred from test counts alone.

## FR-06 — Startup, content validation and remaining provider verification

- UTC: 2026-10-15T13:59:45.195Z
- Actor: Codex; reference FR-01–05.
- New first-visit reproduction: Fresh localhost:4174 origin with engine.js returning 503 left static Start controls inert and arena preparing without recovery. Added an independent bootstrap module that catches failed app imports, disables unavailable actions, exposes an announced error and binds Reload directly. Real isolated 4175 lab showed the error on failure, then Reload loaded the application after restoring assets. Worker registration intentionally fails in this startup-only lab; no offline readiness inferred. Two new regressions pass.
- Adversarial document review: Constructor inherited keys were accepted as custom bases and brick kinds; stationary barriers and moving origins could extend outside the arena. Each invalid case was accepted before correction. Replaced inherited lookup with own-key checks, bounded movement envelope/stationary barriers and added regression cases. Imported structured unknown fields reject explicitly. Current official worlds remain valid and their gameplay ruleset unchanged. Also corrected actual UTF-8 mojibake in world titles/validation copy and all 16 source-document title lines, with regression.
- Latest full local run: 158 tests pass across 18 files, zero failures. Candidate d2fa444df7cfd477dcf9 / 72 assets / 2422345 bytes. Final exact-source gate and CI still pending.
- R13: Rollback A became available automatically while B stayed open; applying A left a second B tab pinned to B. Its probe returned B's module under A's active worker, with checkpoint/Classic/queue retained. Partial upload remains non-atomic even with startup recovery; a successfully loaded mixed network graph is not ruled out.
- Provider review addition: Add --isolated-only and explicit receipt path to existing acceptance tool; wait for fresh policy discovery, verify actual valid POST/duplicate uniqueness and independently keyed invalid score/expiry rejection on a disposable copy. This avoids production score insertion and avoids false rejection passes caused by reusing an already accepted run ID. Existing expiry checks are separate. No branch protection or live runtime change yet.

## FR-07 — Final review evidence and release-gate rollout plan

- UTC: 2026-10-15T14:08:24.646Z
- Actor: Codex; reference FR-01–06.
- Score provider: Isolated-only acceptance verified all 16 live world identities/20 formations read correctly, valid synthetic score POST 206, duplicate 422 with one stored run, independently keyed negative score/client-expiry 422, and disposable cleanup 204/read 404. No production score added. Live/local asset mismatches are expected before publishing these fixes.
- Reports: Wrote per-review execution results, actual limits and seven-point updated What needs to change assessment; linked from README/original plan and added the latest provider interpretation to DAV findings. A first report patch failed atomically because delete/add targeted one path; retried as a normal update. Earlier records remain intact.
- Verification improvement: The observed 174440-point normal-lives bot run used a fresh UUID launch identity. Preserve that observed result; make the regression's runId a fixed valid UUID so its future launch trajectory is reproducible. Do not claim its exact score is reproduced without remeasurement.
- Finalization plan: Recheck full build/suite, document links/limited credential scan and fixture integrity. Reconcile and hash the exact diff. Commit on a codex/ review branch, run the exact-source gate, push and inspect real Linux CI. After a successful named check, enable only that required status check on main (preserve no-review/no-access-expansion scope), then integrate the verified source. Record any provider refusal rather than pretending configuration succeeded. No new external human reviewer requested.
- Runtime release: Confirmed fixes may be published under the continuing game-maintenance authorization after the new gate passes, preserving live scores/world documents and leaving guard inactive; verification must name exact release. Physical device/human/platform exceptions remain open and must not be bypassed by the automated gate.

## FR-08 — Prepared exact-source publication

- UTC: 2026-10-15T14:13:32.339Z
- Actor: Codex; reference FR-07.
- Scope: Final runtime fixes, UTF-8 source title corrections, shared QA network bootstrap and its executable generation contract, read-only CI including dependency advisories, repository checks covering public/tools/tests/docs/audit text, exact-source publisher gating and review documentation. No new functionality beyond confirmed review findings/recovery.
- Verification: Full local suite passes 159 tests across 19 files; saved complete output. Existing LF attribute was retained and extended for JPEG/opaque audits. Preview fixture paths now use fileURLToPath, including spaces. Standard QA and acceptance pages opt into current network assets before imports, so older installed workers cannot silently invalidate new previews.
- Evidence: Dated browser summary, live baseline, settled/immediate/freshness/expiry/submission receipts, pre-fix failures and observed normal-lives campaign. Candidate d2fa444df7cfd477dcf9 / 72 assets / 2422345 bytes. All provider disposable cleanup confirmed. Historical evidence remains separate from fresh results.
- Remaining before integration: Scoped staging, patch/hash/mirror reconciliation, commit, fresh exact-source gate, hosted CI, named main-branch check activation and live publication/readback if approved by automatic review. Continue preserving scores/world definitions and inactive policy.

## FR-09 — Finalization exception and correction

- UTC: 2026-10-15T14:18:07.192Z
- Actor: Codex; reference FR-08.
- Failure: Mirror preflight stopped before copying because authoring .gitignore intentionally has only its three local ignores, while the distribution repo has additional private-artifact exclusions. The next separately orchestrated shell cell nevertheless continued after a failed git add and created local commit f72eb14 before the planned patch/hash/mirror finalization. No push or live deployment occurred. This is a procedural failure; do not describe that commit as having completed the planned reconciliation.
- Correction: Preserve the authoring .gitignore as a documented context-specific exception, compare remaining mirror files against original 8686005 baseline/current source, finish byte-equality/hash/patch evidence in a follow-up commit before pushing, and gate every dependent shell mutation on a successful exit code. Preserve the failed attempt and local commit in history.
- Verification: Exact-source automated gate for f72eb14 did pass 159 tests/build/repository checks with clean release inputs, digest 1fcc5e57b44cb34f777ba097d0ddcac93d717f3ec3b8614dc3c77f4fa175596a and runtime d2fa444df7cfd477dcf9. That does not retroactively satisfy the omitted mirror/evidence procedure. Recheck after finalization commit.

## FR-10 — Additional preflight divergence resolved

- UTC: 2026-10-15T14:21:25.327Z
- Actor: Codex; reference FR-09.
- Preflight correctly stopped again on an old authoring bun.lock; this time dependent mutations did stop. A complete divergence scan identified only that lock and tools/build-share-assets.mjs beyond the intentional .gitignore difference. Authoring package.json matched the original baseline exactly, including sharp; its lock omitted sharp. Asset helper used an absolute machine runtime default where Git already used process.cwd().
- Correction: Preserve private backups of those two non-secret old authoring files, copy the already-versioned portable helper/current lock and record old/new hashes. Keep PRISM_IMAGE_MODULES override supported. Retain authoring .gitignore. Add an explicit Git-root check and README instruction so a parent workspace repository cannot issue release evidence for the outer mirror. Full evidence reconciliation and new finalization commit still pending; nothing pushed yet.

## FR-11 — Mirror/evidence reconciliation completed

- UTC: 2026-10-15T14:22:30.937Z
- Actor: Codex; reference FR-09/10 corrections.
- Verification: 196 source/build/doc/affected-evidence files copied with exact byte equality after baseline/current preflight. Four restored notes retain original content plus provenance; known lock/portable-helper drift resolved separately. Outer authoring .gitignore intentionally preserved; no claim of equality for that context-specific metadata. Private runtime untouched.
- Evidence: Zero-context full source diff against original 8686005 excludes audit duplication. Affected working-byte hashes exclude the hash receipt itself. Final audit, patch and hashes copied and checked separately. Nothing pushed or deployed yet. Next commit and exact-source gate must succeed before publication.

## FR-12 — Hosted CI passes; configuration approval pending

- UTC: 2026-10-15T14:29:35.363Z
- Actor: Codex; reference FR-07/08/11.
- Hosted verification: Exact source 80a5ffc7d8a10afd444f4b3fe804e7337be49769 completed Quality run 38751151464 successfully (started 14:24:46Z, updated 14:25:01Z), GitHub Actions check Bun tests and release integrity from app 15368. This includes frozen Bun 1.4.3 installation, advisory audit, clean Linux generation/no drift and the release gate. Official Bun release availability was verified. Authoring frozen install also succeeded and installed declared sharp with no lock edit.
- Automatic approval rejection: Attempt to enable main required checks/admin enforcement and change public repository description was rejected before process execution because those specific external mutations were not authorized. No settings/metadata changed. Saved concrete proposal and asked the user for separate specific approvals; do not retry dependent mutations without an answer. Continue unaffected source publication.
- Tool correction: First gh run list used Git discovery and failed on ownership; explicit --repo avoids any global safe.directory change. An initial list was empty while a direct exact-commit check-run read subsequently proved successful execution. A first attempt to request approval through nested tools used an unavailable method; corrected to the native asynchronous question tool.
- Current facts: Repository remains public; fresh pre-mutation read showed main unprotected at 8686005 and stale eight-world description. Branch controls/description remain pending user response, not falsely marked enforced. Local exact-source gate passed at 14:23:20Z, digest f0025a045d7e44be7c650ca180e0f2498238c5347576e8c2cb739c52f3b3b4ad.

## FR-13 — Corrective release and final evidence plan

- UTC: 2026-10-15T14:36:30Z
- Actor: Codex; references FR-08/11/12 and user request for the updated assessment.
- Completed mutation: Source 80a5ffc was pushed to main and the publisher completed at 2026-10-15T14:31:57.287Z, using the fresh exact-source approval for runtime d2fa444df7cfd477dcf9. Authenticated publisher session closed. No branch protection or description mutation attempted after rejection; approval remains pending.
- Finalization plan: Independently read every public precache asset, archive sanitized deployment/CI receipts, revise the report from actual results, reconcile final mirror/diff/hashes, commit and run the exact-source gate, publish documentation and verify remote main. Close owned browser fixtures and preview servers. Preserve the distinction between runtime deployment source and subsequent documentation commits.
- Verification: Publisher receipt exists with source digest f0025a045d7e44be7c650ca180e0f2498238c5347576e8c2cb739c52f3b3b4ad; independent live readback and final documentation checks pending. Shared score/world definitions and inactive world guard are preserved by the selected release operation.


## FR-14 — Independent live verification and assessment finalized

- UTC: 2026-10-15T14:37:08.918Z
- Actor: Codex; reference FR-13.
- Timestamp correction: FR-13 was written during the 14:35 UTC minute; its manually entered 14:36:30Z timestamp was inaccurate. Deployment time and independent live receipt times are machine-generated and unaffected. This entry preserves and corrects that clerical error.
- Changed: Updated FOLLOW-UP-REVIEW-RESULTS.md with actual Linux CI/public inventory/live-browser update results and explicit remaining requirements; archived sanitized deployment, CI and proposed configuration evidence. No runtime change after 80a5ffc.
- Verification: Public 72/72 cached assets pass, matching runtime d2fa444df7cfd477dcf9, homepage marker and fullscreen manifest. Actual live Update game completed, controls enabled, checkpoint/best retained, Ready to play offline. Retained browser error log contains only earlier pre-fix localhost failure. Existing 159-test and clean Linux results remain scoped to their exact source.
- Pending: Final documentation link/diff/hash/mirror check and commit/gate; owned fixture cleanup. GitHub configuration/description approval unanswered; do not mutate. Device, human, platform enforcement/retention and atomic publication limits remain open.


## FR-15 — Final evidence and cleanup reconciliation

- UTC: 2026-10-15T14:37:56.346Z
- Actor: Codex; references FR-13/14.
- Changed: Final report, exact-source Linux CI proof, 78-file publisher receipt, 72-asset independent live verification and non-executed GitHub configuration proposal. Final SHA-256 receipt covers these working bytes; a separate final patch preserves the documentation diff. Runtime remains the deployed d2fa444df7cfd477dcf9.
- Verification: Repository checks pass (27 root documents, 194 local links, 290 scanned files before final artifacts); source has no further runtime edit. Mirror preflight passes against 80a5ffc/current contents. Auth publisher exited, owned successful fixture tabs closed and temporary viewport reset; user tabs retained. Three owned preview sessions interrupted and exited. Earlier failed error-page tab cannot be rebound under browser policy and is left for normal temporary-tab cleanup.
- Publication status: Final report/evidence commit, exact-source rerun and final remote SHA readback follow this entry; outcomes are not preclaimed. Required GitHub branch check and metadata changes still await explicit approval. Remaining device/platform/human checks stay open.


## FR-16 — Final diff check correction

- UTC: 2026-10-15T14:38:23.465Z
- Actor: Codex; reference FR-15.
- Failed attempt: git diff --check rejected a CRLF line introduced by PowerShell Add-Content in FR-13. Dependent staging/commit correctly did not execute.
- Correction: Normalize this active audit file to its existing LF policy, preserve all entry text, regenerate the final documentation patch/hashes and mirror. Re-run checks before staging. Historical audit files remain untouched.
