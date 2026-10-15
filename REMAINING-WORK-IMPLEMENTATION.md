# Remaining-work implementation and acceptance

Updated October 15, 2026 UTC, by Codex. Request: implement the updated assessment. Baseline source 7384e313238d8489f208f6cc55b3be4049b326bf. Candidate runtime d77abd4a8738088292f7. [Execution audit](audit/2026-10-15-remaining-work.md).

## Implemented

- Immutable game dependencies and an exact inventory. Stage/verify the complete dependency set before switching entry documents with ETags. Preserve root legacy modules, prior immutable releases, shared scores/policies and individual world definitions. Compare HTML structurally to tolerate harmless server serialization while rejecting changed executable references.
- Same-release editor template composition without duplicating schema-bearing native documents. Packaging inputs affect release identity. Worker cache keys stay logical, while network URLs identify releases. Old and new tabs retain their own assets; exact immutable URLs can recover online after eviction without claiming offline readiness.
- Saved-worker rollback from a retained local package, conditional entry writes, uniquely named private backups and interruption checkpoints. [Procedure and limits](RELEASE-PUBLICATION.md).
- Normal game publication cannot initialize/replace scores. Native score migration rejects policy changes rather than assuming warm-up probes establish readiness. This contains the normal release path; a platform activation guarantee is still needed for future native rule changes.
- Historical world-policy activation is disabled. Wesley selected owner DAV publishing only and the casual leaderboard. These choices close the proposed application-write/verified-board redesign scope; no new write grants or external services are added.
- Fourteen semantic HTML device/human acceptance procedures and a release/plan-bound private record validator. Initialization never overwrites an existing record; observed outcomes require reviewer/environment/evidence metadata. The validator is a consistency check, not hardware or human attestation.

## Available verification

The final full local suite passes **170 tests across 21 files**, with zero failures. Required hosted CI results are recorded during publication below. Targeted staging/failure/collision/concurrent-publication/rollback and worker tests also passed. No scoring formula, formation or physics change is introduced, so the existing ruleset and compatible saves remain.

Actual Chromium browser checks: old d2fa444df7cfd477dcf9 updated to interim c27c6272afcf8cc2f916 and reached offline-ready with fixture best retained. A fresh origin loaded 31591d6326d6abfc91b3 with immutable bootstrap, enabled controls and zero captured errors. With its web server stopped, it reloaded from cache and started Adventure. This is server-unavailable desktop evidence, not OS airplane mode or installed-phone evidence. The final candidate d77abd4a8738088292f7 also applied successfully while an older 31591 tab remained open on its own immutable bootstrap, retaining Continue adventure. The compiled editor loaded its 45-brick formation and launched the 3D preview with zero captured errors. [Browser receipt](audit/2026-10-15-remaining-browser.json), [full local suite](audit/2026-10-15-remaining-tests.txt). Live publication evidence follows below.

## Accepted score-expiry behavior

On October 15, 2026, Wesley accepted five-day expiry from displayed rankings with physical cleanup on subsequent online leaderboard access. No unattended scheduler is required. Isolated live checks subsequently removed four expired records while preserving three active controls, using both GET-only and game GET-plus-fallback cleanup. Repeated reads were safe. The actual live leaderboard opened and refreshed normally in the browser. The fixture checks and production UI check were separate; synthetic records were never added to the real board. [Verification and limits](SCORE-EXPIRY-VERIFICATION.md), [decision and historical research](PLATFORM-REQUIREMENTS.md).

## What is still open

| Requirement | Status and next dependency |
| --- | --- |
| Intermittent memory-budget failures in public processor execution | Reproduced with a 660-byte empty document and constant-false JavaScript condition. Four comparisons captured 11 failures in 240 GETs; established leaderboard controls passed 12/12. Internal cause and any freshness effect remain open. [Support-ready report](PAGELOVE-MEMORY-BUDGET-REPORT.md) |
| Guaranteed safe public-policy activation | Isolated follow-up confirmed old validation still executed after new source was stored, while OPTIONS continued advertising POST. No all-worker readiness barrier established. Keep existing publication safeguards; [timing evidence and provider questions](POLICY-ACTIVATION-VERIFICATION.md) |
| Android/iOS installation, OS termination/airplane mode/storage pressure and actual native share receivers | Partial Android evidence now supplied: Pixel 11 Pro, Android 17, Edge 155.0.4283.48 retains a blank upper strip on installed launch and in the follow-up fullscreen screenshot. [PB-003](BUG-LOG.md). Formal device procedures and remaining cases are not completed |
| Independent campaign, cinematic/audio, keyboard/large-text and screen-reader review | Not run: Wesley confirmed no independent reviewer is available |

[Acceptance checklist](review/acceptance-plan.html). All fourteen formal human/device procedures remain uncompleted; the later user-supplied Android screenshots are partial evidence of an open issue, not a passing acceptance run. Automation and prepared procedures do not close them. No external scheduler or messages to reviewers/support/share recipients were sent.

## Publication and final checks

- Deployed **d77abd4a8738088292f7** at **2026-10-15T16:25:27.417Z**, using exact source **7489058a2743229466e1227f315892ffcf6d704a** and its successful local release gate. [Deployment receipt](audit/2026-10-15-remaining-deployment.json).
- [Required clean Linux CI](https://github.com/wesley83/prism-breaker/actions/runs/38768593148) passes for the deployed publisher/source. [CI proof](audit/2026-10-15-remaining-correction-ci.json). Subsequent evidence/documentation commits do not change runtime bytes.
- Independent public verification at **2026-10-15T16:26:30.860Z** passes **72/72 immutable assets**, matching root entry/dependencies and fullscreen manifest. [Live inventory](audit/2026-10-15-remaining-live-final.json).
- Actual live browser updated from d2fa444df7cfd477dcf9 to the new immutable bootstrap, reached offline-ready, enabled play and retained Continue adventure, with no captured errors. The native editor restored the available draft and launched the 3D preview without captured errors.
- **One direct native-editor request returned 500 at 2026-10-15T16:29:23.962Z.** No body was retained for that first failed verification. Later route/shell/template reads and three further cache-busted composition checks returned 200 with the routed world, shell and immutable bootstrap. No source change caused recovery. The cause remains unestablished; later success does not erase the availability observation or establish an activation guarantee. [Native route receipt](audit/2026-10-15-remaining-native-editor.json).
- Owner readbacks confirm the **full score resource and policy remained unchanged** across the release. All **70 legacy root cache assets** match their pre-release hashes. Individual world definitions were excluded from publisher writes. [Data preservation](audit/2026-10-15-remaining-data-preservation.json), [legacy assets](audit/2026-10-15-remaining-legacy-assets.json).
- Initial staging stopped on a harmless entity-node comparison mismatch before any entry promotion. The narrow correction was tested against actual provider readback, committed and passed gate/CI before retry. [Normalization evidence](audit/2026-10-15-remaining-html-normalization.json).
- The authenticated publisher exited. Final documentation/evidence reconciliation and its own commit/CI follow. At publication, hardware/human checks remained 14 not-run and native unattended retention/readiness dependencies were open. The later accepted score-expiry behavior above supersedes the unattended-retention requirement; the other verification gaps remain.
