# Follow-up review results and updated assessment

Reviewed October 15, 2026 UTC by Codex, following the [retrospective](RETROSPECTIVE.md) and [14-review plan](FOLLOW-UP-REVIEW-PLAN.md). Initial source: `86860052cabadcc01419faaeb30d6f5a5d9d5404`. Initial live runtime freshly verified as `a998edcd3009a53d6733`.

## Result

All fourteen areas received review work. **Their full acceptance conditions are not all satisfied.** Further application defects were reproduced, corrected and given regression coverage. Physical devices, native share receivers, human balance/accessibility judgments and unresolved platform guarantees remain explicit gaps.

The latest full local suite passes **159 tests across 19 files**, with zero failures, compared with the fresh 136-test baseline. Candidate **`d2fa444df7cfd477dcf9`** contains 72 cached assets / 2,422,345 bytes. A generated candidate is not deployment evidence. Final hosted CI/publication results are recorded below and in the execution audit.

## Newly found defects and corrections

| Finding | Reproduction and correction |
| --- | --- |
| Another paddle miss beside a wall | The old engine clamped the ball at the wall and discarded its inward travel. An independent two-segment oracle failed; an explicit replay also failed at the actual 1/120-second game step. Preserve reflected distance and sweep each segment against the moving paddle. The exact case and 6,000 sampled wall trajectories now pass alongside the earlier geometry/power checks |
| Invisible gameplay during graphics loss | Actual Chromium context loss left state playing, advanced the clock about 0.717 seconds and later lost a life while drawing was unavailable. The game/workshop now pause through a shared guard, clear input, expose recovery and block premature resume |
| Restoration preparation hung | The first recovery check exposed Three.js asynchronous shader polling throwing after renderer properties were reset. Preparation now compiles while play is paused; power pools are reused. The repeated real loss/restoration reports zero errors and leaves the player in control of resuming. Physical preparation cost remains unmeasured |
| Unsupported metadata disappeared | Imported unsupported properties were accepted and silently omitted on export. Reject unsupported structured properties/children explicitly at each scope. Supported records still round-trip; imported decorative markup is reconstructed into safe output |
| Invalid brick types/geometry passed validation | Inherited names such as constructor passed base/kind lookup, and some barriers/moving origins extended outside the arena. Each case was accepted before correction. Own-key checks and complete motion/stationary bounds now reject them; all official formations remain valid |
| Startup could remain Preparing forever | A document whose engine import failed had inert Start controls and no working recovery. An independent bootstrap now catches app-import failure, explains it, disables unavailable controls and binds Reload directly. Real browser failure→asset restoration→Reload enabled the game |
| Repository/release controls were missing | Added pinned read-only CI, link/import checks, a limited credential-pattern scan and a publisher gate tied to source commit/content/release. Actual failing Bun tests, stale generated files, changed documents and expired/wrong receipts refuse approval. Dirty release inputs cannot deploy |
| Documentation/encoding gaps | Restored four historical README-linked documents with provenance. Reconciled source bytes with the existing LF policy, preserved historical audits, and corrected actual mojibake in titles/validation copy. Also corrected singular-life visible/accessibility wording |

The collision fix retains the intended existing contact contract; it is not a reconstruction of the original reporting player's device/session. Neither sampled tests nor a working recovery flow prove every possible defect is eliminated.

## Review-by-review disposition

Passes below apply to the stated method. Partial means useful checks passed while named acceptance conditions remain unverified. Blocked means the required guarantee remains unresolved.

| Review | Executed work / result | Remaining boundary |
| --- | --- | --- |
| R01: Release gates | Local gate/negative demonstrations pass; live branch/workflow configuration inspected; CI prepared | Hosted execution/configuration recorded during publication below; no independent human signoff implied |
| R02: Physics | Independent wall/solid geometry cases, exact 120 Hz reproduction and power regressions pass after correction | Physical input timing and original user session unknown |
| R03: PWA lifecycle | Chromium old release→A→B, failed B asset, activation with network 503, retained saves/settings/queue pass; worker/client fault suites pass | Partial: installed Android/iOS, OS termination/airplane mode/storage pressure and Firefox/WebKit remain unverified |
| R04: Enforcement/freshness | Immediate and settled owner/public probes, timed policy updates/deletion and actual persistence readback performed | Blocked: public reject controls execute while owner DAV persists writes; exact generic Trigger contract needs platform clarification |
| R05: Retention | Fresh isolated delete-protection/expiry checks, controlled display boundary and GET cleanup readback performed | Blocked for unattended physical deletion. Fresh-policy unsafe deletion reproduced; cleanup still needs access |
| R06: Queue/saves | Real IndexedDB abort/outage/reopen/two-connection race; original Daily identity retained; controlled lease/retry/migration suites pass | OS process death, destructive eviction and every clock/suspension combination not established |
| R07: Scoring/fairness | Independently calculated streak/pickup/speed/clear totals and UTC/expiry/tie/ruleset checks pass; top-score/source trust model reviewed | Client-reported scores are not anti-cheat proof; actual concurrent-host celebration races not exhaustively established |
| R08: Editor/security | Adversarial parser/schema cases, canonical/identity/event suites and actual local editor/3D preview pass | Partial: server guard remains blocked; every real owner-publish/conflict/readback UI sequence was not repeated |
| R09: Rendering/audio | Actual context loss/restoration, three all-world/all-power resource passes, scheduler/source checks performed | Partial: cold/thermal phone frame times and subjective audio quality unmeasured |
| R10: Interface/accessibility | Current app at 390×844 and 844×390 fullscreen; dialog scrolling/focus return and launch geometry checked; copy corrected | Partial: physical keyboards, screen-reader speech, zoom/large text and every animated reading state not fully exercised |
| R11: Sharing | Complete Android text+link, native file payload, other platforms, touch iPad and readable-date regressions pass; fallback source reviewed | Partial: actual received Android→Slack/iOS messages remain unverified; no message sent |
| R12: Campaign | Fresh accelerated 16-world/20-formation browser traversal; complete ordinary-lives collision bot passes without replenishment/damage shortcuts | Partial: not a human playthrough or full real-time watch of every cinematic |
| R13: Rollout/rollback | Broken B preserves A; B applies offline; rollback retains another B tab's B modules; missing-module recovery added | Partial: sequential uploading still permits an uncontrolled mixed network graph; immutable/atomic publication remains open |
| R14: Traceability | Four historical documents restored; link/import checks, encoding and source/evidence reconciliation performed | Clean Linux build and final hashes/mirror/publication results follow below |

## Browser evidence

- Graphics: before correction, playing with elapsed delta about `0.716666666666666` and no recovery state. After correction, paused with delta `0`, blocked during loss; restored with error hidden and blocked false, still paused, no errors. Closing the pause dialog while lost did not resume play.
- Resource passes: each of three cycles across sixteen worlds and all powers ended at **34 geometries / 30 textures**. This establishes stability in that sequence, not a complete memory-leak or mobile-performance proof.
- Actual IndexedDB: queued after outage; competing connections sent once; durable sent receipt retained original `2026-10-14` Daily identity; aborted metadata transaction left no row. Temporary database was closed/deleted. Sending used a controlled adapter, not a production score write.
- PWA lab: cached `ebb648f339435f994a1c` automatically offered A `1b5bccba9d380881f02e`. A retained checkpoint, Classic and one synthetic queued score. B `269befd6252bcf6a2007` initially failed on its engine asset, then applied with network requests returning 503. Rollback A became available without a forced manual check. A second open B tab returned B's module under A's worker. Lab hashes differ from production because of instrumentation.
- Layout: at 390×844, canvas bottom `748` and launch top `748.375`; at 844×390 fullscreen, canvas bottom `326` and launch top `336`. Settings scrolled within the viewport and closing it returned focus to its opener. Backend screenshot scaling was inconsistent with emulated DOM dimensions; it is not physical-device evidence.
- Campaign: accelerated browser traversal reached the final Adventure record result with zero captured errors. A separate ordinary-lives bot finished all twenty formations at **174,440 points** in about **1,370 simulated seconds**. It moved algorithmically and auto-launched, but used no forced damage, invulnerability or life replenishment. Earned lives/powers remained normal.
- Workshop: actual local editor loaded the semantic world and launched its Three.js preview. Browser/fixture clocks and share payloads are not substitutes for physical-device/native-receiver outcomes.

Browser summaries are transcribed from visible diagnostic output; they are not raw telemetry or a recording of every frame. Isolated tools preserve reproducibility. Temporary fixtures/test output remain under ignored `test-results/`.

## Provider evidence and interpretation

The immediate DAV matrix lacked active public rejection controls, so it alone did not prove bypass. A separate 65-second settled matrix observed public 422 rejection for JavaScript, Sessel and embedded guards while corresponding owner-DAV PUTs returned 200 and persisted their marker. Public owner-key PUT returned 401. All twelve disposable paths were deleted and read back as 404.

Freshness: policy A remained at 0/1/5/15/31 seconds after storing B; B and newly added C appeared at 61 seconds. One updated-target request returned 502 at 91 seconds and is preserved. Immediately after policy deletion/owner 404, the public path still executed B. Four disposable paths were cleaned.

Expiry: readiness statuses were `403,204,403,500,403,403,403`, including removal of an unexpired synthetic control. Settled unsafe/future deletion returned 403 and retained controls; expired-only deletion returned 204 and kept the active row. GET cleanup returned the expired row on its triggering read and removed it by the next read. Later passes do not erase unsafe observations or prove a propagation guarantee.

Current official [reacting-to-changes reference](https://docs.pagelove.com/all/reference/reacting-to-changes/) explicitly documents WebDAV bypass for **transition constraints/handlers** and delayed discovery for DAV-edited transition rules. The [protocol reference](https://docs.pagelove.com/all/reference/protocol/) describes the authoring path. Some bypass behavior is therefore intentional. Those transition statements do not settle every general Trigger/schema guarantee; obtain the exact platform contract before labeling all observations backend bugs or enabling the world guard.

No native unattended TTL/scheduling guarantee was found in the inspected sections. That is a research limit, not proof of platform absence. No scheduler/external service was introduced. No production world, score record or policy was mutated by these review probes. A fresh isolated copy of the live score rules accepted a valid POST with 206, rejected its duplicate with 422 and retained exactly one run. Independently keyed negative-score and client-expiry payloads each returned 422. The disposable board was deleted/read 404. Live source mismatches in that receipt are expected: it compares the still-deployed baseline with these local corrections.

## Ruleset decision

These fixes restore the intended solid-contact behavior; scoring formulas, official formation geometry, Daily randomness and content order remain unchanged. Preserve the current declared ruleset, historical scores and compatible saves. Schema rejection and UTF-8 fixes do not change valid official gameplay definitions.

Future intentional physics/scoring/timing/geometry/randomness changes need an explicit compatibility decision. When comparisons or saves cease to be compatible, change the catalog ruleset declaration, rebuild and verify migration while retaining queued-run provenance. Engine edits alone do not automatically change the generated ruleset identity.

Scores remain client-reported. Bounds, unique IDs, schemas and revision labels protect particular data contracts; they do not establish an authentic human run. Trusted competition would need separate validation architecture. The UI disclaimer Wesley asked to remove is not restored.

## Updated “What needs to change” assessment

1. **Resolve the persistence contract.** Identify a supported authenticated mutation path that actually enforces world validation, and a reliable policy activation/deletion guarantee. Keep the candidate guard inactive. The fresh unsafe-delete window needs platform support, not repeated successful probes treated as certainty.
2. **Implement native unattended retention or explicitly revise the requirement.** Five-day ranking filtering and on-access cleanup work in checked cases. Physical deletion without traffic still is not implemented. Do not silently add an external scheduler.
3. **Complete physical-device and receiver checks.** Actual Android/iOS installation, two-release updates, process termination, airplane mode, storage pressure, keyboards and received share messages remain necessary. Available surfaces provided Chromium desktop; no connected phone or Firefox/WebKit session was available.
4. **Obtain independent human play/accessibility review.** Ordinary-lives bot completion strengthens progression evidence; human difficulty, cinematic reading time, screen-reader speech and listening quality still require observers. This agent's additional checks are not another person's signoff.
5. **Reduce sequential-publication exposure.** Startup failures now have recovery, and controlled clients retain coherent releases. Immutable assets or native atomic publication would further protect uncontrolled visitors from successfully loaded mixed files. Retain the limitation and verified rollback procedure until then.
6. **Keep release checks enforced and evidence scoped.** Require the named CI check after its first hosted run is confirmed; run the publisher gate against committed exact source. Maintain explicit device/platform exceptions. Passing automation cannot close those exceptions.
7. **Decide the ranking trust level.** Casual client-reported standings are supported. Tamper-resistant competition is additional architecture with separate acceptance criteria.

The game can receive a scoped corrective release while those limits remain open. Such a release must not be described as universally production-verified or used to close unfinished requirements.

## Publication and final checks

At this report revision, corrections/CI are local. Hosted CI, branch-check configuration, exact-source gate, clean-checkout verification, mirror/hash reconciliation and publication remain pending finalization. No new game deployment is claimed here. This section will be updated from actual results; the dated audit retains the sequence and failures.

## Evidence

- [Execution audit](audit/2026-10-15-follow-up-reviews.md) and [fresh live baseline](audit/2026-10-15-review-live-baseline.json)
- [Immediate DAV](audit/2026-10-15-review-dav-immediate.json), [settled DAV](audit/2026-10-15-dav-diagnostic-b9c0da97-3fa5-4a46-87f1-9ff8e2085982.json), [freshness](audit/2026-10-15-review-policy-freshness.json), [expiry](audit/2026-10-15-review-expiry.json), [isolated submission](audit/2026-10-15-review-submission.json), [expanded investigation](DAV-INVESTIGATION-FINDINGS.md)
- [Independent review regressions](tests/follow-up-review.test.mjs), [graphics lifecycle](tests/graphics-recovery.test.mjs), [release refusals](tests/release-gate.test.mjs), [sharing](tests/sharing-review.test.mjs), [startup](tests/startup-review.test.mjs)
- [Repository checks](tools/repository-check.mjs), [publisher gate](tools/release-gate.mjs), [CI](.github/workflows/quality.yml)
- [Browser review fixture](tools/review-browser-fixture.mjs), [startup lab](tools/startup-lab.mjs), [two-release lab](tools/update-lab.mjs)
