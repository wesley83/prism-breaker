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

## What is still blocked

| Requirement | Status and next dependency |
| --- | --- |
| Physical shared-score deletion at five days without traffic | No supported native shared TTL/scheduler identified. JavaScript timers are unavailable; transient/session expiry is fixed at 30 days and ignores per-element TTL. Obtain the supported native facility or explicitly revise the requirement. [Support specification](PLATFORM-REQUIREMENTS.md) |
| Guaranteed safe public-policy activation | No native revision/readiness barrier established. Normal release and policy-migration safeguards are implemented, but cannot establish a platform guarantee |
| Android/iOS installation, OS termination/airplane mode/storage pressure and actual native share receivers | Not run: Wesley confirmed no devices are available |
| Independent campaign, cinematic/audio, keyboard/large-text and screen-reader review | Not run: Wesley confirmed no independent reviewer is available |

[Acceptance checklist](review/acceptance-plan.html). All fourteen human/device checks remain not run. Automation and prepared procedures do not close them. No external scheduler or messages to reviewers/support/share recipients were sent.

## Publication and final checks

At this revision, publication is pending final source/evidence reconciliation, commit, exact-source gate, required hosted CI and live readback. No new live deployment is claimed yet. The following dated receipts/audit entries will record actual outcomes; earlier failures remain preserved.
