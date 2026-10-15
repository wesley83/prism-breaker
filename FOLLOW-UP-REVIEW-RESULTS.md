# Follow-up review results and updated assessment

Reviewed October 15, 2026 UTC by Codex, following the [retrospective](RETROSPECTIVE.md) and [14-review plan](FOLLOW-UP-REVIEW-PLAN.md). Initial source: `86860052cabadcc01419faaeb30d6f5a5d9d5404`. Initial live runtime freshly verified as `a998edcd3009a53d6733`.

## Result

All fourteen areas received review work. **Their full acceptance conditions are not all satisfied.** Further application defects were reproduced, corrected and given regression coverage. Physical devices, native share receivers, human balance/accessibility judgments and unresolved platform guarantees remain explicit gaps.

The latest full local suite passes **159 tests across 19 files**, with zero failures, compared with the fresh 136-test baseline. Deployed runtime **`d2fa444df7cfd477dcf9`** contains 72 cached assets / 2,422,345 bytes. Independent public readback verified all 72 assets after publication. Exact-source Linux CI also passes; details and boundaries are recorded below.

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
| R01: Release gates | Local gate/negative demonstrations and clean Linux CI pass; publisher accepted exact committed source | Required check now enabled after explicit approval, including administrators; no human approval required and no independent human signoff implied |
| R02: Physics | Independent wall/solid geometry cases, exact 120 Hz reproduction and power regressions pass after correction | Physical input timing and original user session unknown |
| R03: PWA lifecycle | Chromium old release→A→B, failed B asset, activation with network 503, retained saves/settings/queue pass; worker/client fault suites pass | Partial: installed Android/iOS, OS termination/airplane mode/storage pressure and Firefox/WebKit remain unverified |
| R04: Enforcement/freshness | Immediate and settled owner/public probes, timed policy updates/deletion and actual persistence readback performed | DAV bypass resolved as intentional trusted authoring; Wesley chose owner DAV only. Public-policy freshness remains unresolved |
| R05: Retention | Fresh isolated delete-protection/expiry checks, controlled display boundary and GET cleanup readback performed | Blocked for unattended physical deletion. Fresh-policy unsafe deletion reproduced; cleanup still needs access |
| R06: Queue/saves | Real IndexedDB abort/outage/reopen/two-connection race; original Daily identity retained; controlled lease/retry/migration suites pass | OS process death, destructive eviction and every clock/suspension combination not established |
| R07: Scoring/fairness | Independently calculated streak/pickup/speed/clear totals and UTC/expiry/tie/ruleset checks pass; top-score/source trust model reviewed | Client-reported scores are not anti-cheat proof; actual concurrent-host celebration races not exhaustively established |
| R08: Editor/security | Adversarial parser/schema cases, canonical/identity/event suites and actual local editor/3D preview pass | Partial: candidate cannot enforce trusted DAV authoring by design; every real owner-publish/conflict/readback UI sequence was not repeated |
| R09: Rendering/audio | Actual context loss/restoration, three all-world/all-power resource passes, scheduler/source checks performed | Partial: cold/thermal phone frame times and subjective audio quality unmeasured |
| R10: Interface/accessibility | Current app at 390×844 and 844×390 fullscreen; dialog scrolling/focus return and launch geometry checked; copy corrected | Partial: physical keyboards, screen-reader speech, zoom/large text and every animated reading state not fully exercised |
| R11: Sharing | Complete Android text+link, native file payload, other platforms, touch iPad and readable-date regressions pass; fallback source reviewed | Partial: actual received Android→Slack/iOS messages remain unverified; no message sent |
| R12: Campaign | Fresh accelerated 16-world/20-formation browser traversal; complete ordinary-lives collision bot passes without replenishment/damage shortcuts | Partial: not a human playthrough or full real-time watch of every cinematic |
| R13: Rollout/rollback | Broken B preserves A; B applies offline; rollback retains another B tab's B modules; missing-module recovery added | Partial: sequential uploading still permits an uncontrolled mixed network graph; immutable/atomic publication remains open |
| R14: Traceability | Four historical documents restored; link/import checks, encoding and source/evidence reconciliation performed | Clean Linux build/no generated drift passes; source and final documentation hashes/mirror reconciled; context-specific authoring .gitignore exception preserved |

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

Current official [reacting-to-changes reference](https://docs.pagelove.com/all/reference/reacting-to-changes/) explicitly documents WebDAV bypass for **transition constraints/handlers** and delayed discovery for DAV-edited transition rules. The [protocol reference](https://docs.pagelove.com/all/reference/protocol/) describes the authoring path. Some bypass behavior is therefore intentional. Support subsequently confirmed, in correspondence relayed by Wesley on October 15, that **all schema validation and triggers are intentionally bypassed by WebDAV**, which is only an authoring mechanism. This settles the DAV contract: bypass is expected behavior, not a platform bug. It does not resolve the separate public-policy timing or expiry observations. See the [resolved report](DAV-TRIGGER-BUG-REPORT.md).

No native unattended TTL/scheduling guarantee was found in the inspected sections. That is a research limit, not proof of platform absence. No scheduler/external service was introduced. No production world, score record or policy was mutated by these review probes. A fresh isolated copy of the live score rules accepted a valid POST with 206, rejected its duplicate with 422 and retained exactly one run. Independently keyed negative-score and client-expiry payloads each returned 422. The disposable board was deleted/read 404. Live source mismatches in that receipt are expected: it compares the still-deployed baseline with these local corrections.

## Ruleset decision

These fixes restore the intended solid-contact behavior; scoring formulas, official formation geometry, Daily randomness and content order remain unchanged. Preserve the current declared ruleset, historical scores and compatible saves. Schema rejection and UTF-8 fixes do not change valid official gameplay definitions.

Future intentional physics/scoring/timing/geometry/randomness changes need an explicit compatibility decision. When comparisons or saves cease to be compatible, change the catalog ruleset declaration, rebuild and verify migration while retaining queued-run provenance. Engine edits alone do not automatically change the generated ruleset identity.

Scores remain client-reported. Bounds, unique IDs, schemas and revision labels protect particular data contracts; they do not establish an authentic human run. Trusted competition would need separate validation architecture. The UI disclaimer Wesley asked to remove is not restored.

## Updated “What needs to change” assessment

The subsequent implementation and user decisions are recorded in [REMAINING-WORK-IMPLEMENTATION.md](REMAINING-WORK-IMPLEMENTATION.md). The publication section below preserves the earlier corrective release's evidence.

1. **Native unattended retention remains blocked.** Shared five-day physical deletion without traffic needs a supported native TTL/scheduler. Session transient TTL does not meet this requirement; no external service or silent requirement change is introduced.
2. **Physical devices and independent people remain unavailable.** Fourteen concrete [acceptance checks](review/acceptance-plan.html) and release-specific private records are prepared; every hardware/human outcome remains not run.
3. **Public-policy activation guarantees remain unresolved.** Routine game releases now preserve rules, and policy-changing migrations are refused. These controls avoid introducing a policy change during normal deployment; they do not prove a native activation barrier.
4. **Mixed game-file exposure has an implementation.** Entries now reference immutable dependencies, staged and verified before conditional promotion, with retained versions and rollback. New package/worker failure tests pass; current browser/live evidence is in the implementation report.
5. **World and ranking trust choices are settled.** Retain owner DAV publishing and the casual leaderboard. The historical world guard is disabled; no application-write grant or verified-run board is being added.
6. **CI enforcement is complete.** Main requires the passing GitHub Actions check for administrators too, without a human-approval requirement. Evidence remains scoped; CI cannot certify missing hardware, people or platform guarantees.

## Publication and final checks

- Source `80a5ffc7d8a10afd444f4b3fe804e7337be49769` was pushed to GitHub main and deployed at **2026-10-15T14:31:57.287Z**. The publisher accepted its clean exact-source approval, including 159 passing local tests. Subsequent report/evidence commits do not change deployed runtime bytes.
- [Clean Linux CI run](https://github.com/wesley83/prism-breaker/actions/runs/38751151464) passes for that exact source: frozen Bun install, dependency audit, regeneration with no drift and release integrity. [CI receipt](audit/2026-10-15-review-ci-proof.json).
- Independent public verification at **2026-10-15T14:35:46.309Z** passes **72/72 assets**, release `d2fa444df7cfd477dcf9`, matching entry marker and linked fullscreen manifest. [Live inventory](audit/2026-10-15-review-live-final.json), [deployment receipt](audit/2026-10-15-review-deployment.json).
- The actual live browser offered **Update game**; applying it loaded the new marker, enabled Adventure/Daily controls and reached **Ready to play offline**, retaining visible checkpoint/personal best. This was a Chromium in-app session, not an installed phone or a new OS-airplane-mode test. The only error returned by its retained log was the earlier pre-fix localhost shader failure, not a new live error.
- Source/mirror reconciliation and affected hashes are archived; the outer authoring .gitignore remains intentionally distinct. Final documentation/evidence changes receive their own hashes and commit. The audit preserves the earlier premature-local-commit exception and its correction.
- Wesley subsequently **approved** main-branch CI enforcement and the exact sixteen-world description. Both settings are applied and independently read back: required GitHub Actions check, strict up-to-date checks, administrators included, no human approval requirement. The rejected [original proposal](audit/2026-10-15-review-protection-proposal.json) remains historical; the [support/configuration audit](audit/2026-10-15-support-clarification.md) records the correction and live receipt.
- Shared scores and individual world definitions were preserved. The candidate world-write guard remains inactive. No independent human signoff, physical-device certification, atomic publication or unattended score-deletion guarantee is implied.

## Evidence

- [Execution audit](audit/2026-10-15-follow-up-reviews.md) and [fresh live baseline](audit/2026-10-15-review-live-baseline.json)
- [Immediate DAV](audit/2026-10-15-review-dav-immediate.json), [settled DAV](audit/2026-10-15-dav-diagnostic-b9c0da97-3fa5-4a46-87f1-9ff8e2085982.json), [freshness](audit/2026-10-15-review-policy-freshness.json), [expiry](audit/2026-10-15-review-expiry.json), [isolated submission](audit/2026-10-15-review-submission.json), [expanded investigation](DAV-INVESTIGATION-FINDINGS.md)
- [Independent review regressions](tests/follow-up-review.test.mjs), [graphics lifecycle](tests/graphics-recovery.test.mjs), [release refusals](tests/release-gate.test.mjs), [sharing](tests/sharing-review.test.mjs), [startup](tests/startup-review.test.mjs)
- [Repository checks](tools/repository-check.mjs), [publisher gate](tools/release-gate.mjs), [CI](.github/workflows/quality.yml)
- [Browser review fixture](tools/review-browser-fixture.mjs), [startup lab](tools/startup-lab.mjs), [two-release lab](tools/update-lab.mjs)
