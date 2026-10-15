# Prism Breaker follow-up review and prevention plan

Prepared October 15, 2026 UTC. Companion to the [retrospective](RETROSPECTIVE.md). Baseline: `c77f341`; last recorded runtime `a998edcd3009a53d6733`.

## Status and ordering

This is a proposed execution backlog and acceptance contract. It is **not a record that the reviews below have been completed**. Existing evidence is a starting point, with its original limits. No runtime tests, device sweep, deployment or new workflow installation were performed while writing this plan.

- **P0:** Resolve before closing the affected requirement or making a broad production-readiness claim. This priority does not imply every item is a currently exploitable outage.
- **P1:** Complete before the next release that materially changes that area; schedule the existing gaps into the next hardening milestone.
- Owners below are proposed responsibilities, not assignments accepted by another person. “Maintainer” means the person implementing the next change; “independent reviewer” means someone challenging its assumptions using separate evidence.
- Use isolated origins/documents and synthetic scores. Preserve real records. Actual external messages, production mutations and new services require the applicable authorization; this plan does not authorize them.

## R01 — Enforced release evidence and independent review

**Priority:** P0. **Owner:** Maintainer + independent reviewer. **Status:** Gap confirmed; implementation not started.

GitHub reported zero Actions workflows. Inspect branch protection/rules before describing it; that state was not checked in the retrospective. Add CI using pinned/frozen Bun dependencies, the existing suite, deterministic generation, stale-output checks, import/local-link integrity and a suitably configured secret scan. Fail when generated files differ unexpectedly. Keep credentials and private score exports out of artifacts.

Tie a release evidence record to the exact source SHA, runtime release ID, affected requirement IDs, tests, browser/device matrix and explicit exceptions. Have the publisher require successful applicable evidence, rather than assuming an operator ran tests. Separate documentation-only changes from runtime releases. Document an emergency exception with an owner, reason, bounded verification and follow-up; never silently bypass.

**Pass condition:** A deliberately failing behavioral test and deliberately stale generated output independently block a disposable release; corrected exact-source checks allow it. Required repository checks/rules are inspected and configured with evidence. A second review challenges a critical assumption rather than merely rereading the same test. Record source/release identity and successful/failed gate demonstrations. No claim that CI alone verifies phones.

## R02 — Independent physics and rendered-contact review

**Priority:** P0. **Owner:** Gameplay maintainer + independent reviewer. **Status:** Lower-body/endcap fix verified in recorded tests; broader review pending.

Start from the real Three.js solid bounds and independent geometry, not the engine helper. Review continuous relative motion and event ordering for: maximum/clamped frame intervals, frame stalls, paddle direction reversals, near-wall/corner and multiple contacts within a step, high-speed/Slow balls, Sticky catches at both ends, Wide expiry with held balls, multiball, Shield, pause/resume and restored checkpoints. Cover both visual styles and realistic mouse/touch input timing. Preserve genuinely missed and upward-moving balls.

Validate the fixture itself: keep original ball references, check coordinate transforms, and show each new regression failing on the relevant old implementation. Extend the independent oracle beyond the current straight-line cases that exclude wall bounces. Seed and retain generated failures so they are reproducible.

**Pass condition:** No sampled solid contact passes through; no already-clear miss is rescued; no duplicate bounce, life loss or Sticky attachment occurs. Engine traces and rendered replays agree, with an explicit tolerance/forgiving-corner contract. Record seed, initial state, inputs, timestep, old/new result and relevant mesh bounds. A normal physical-phone session supplements rather than replaces deterministic cases. Exact original player trajectory remains unknown unless supplied.

## R03 — Installed PWA lifecycle across releases and engines

**Priority:** P0 for mobile/offline readiness claims. **Owner:** PWA maintainer + device reviewer. **Status:** Chromium lab evidence exists; installed Android/iOS sweep pending.

Use distinct releases A and B with a saved run, settings and queued synthetic score. Test actual Android Chrome installation and iOS Safari/Home Screen installation, recording OS/browser versions. Also exercise Firefox and WebKit engine behavior where supported; a phone-sized Chromium viewport does not substitute for either.

Cover fresh install, normal launch, all windows closed, process termination, OS relaunch, airplane-mode relaunch, partial asset loss, denied storage, damaged metadata, quota pressure, old tab under new worker, multiple windows, failed/interrupted B download, delayed messages, lost waiting cache and foreground/reconnect recovery. Leave the app visible to test natural periodic detection without forcing it through DevTools. Test manual check success/failure, available notice placement, active-run refusal, pause guidance and a single approved reload. Distinguish an already-current relaunch from a missing prompt.

**Pass condition:** A never loads B modules; incomplete B never replaces working A; no active game is interrupted; readiness/update copy reflects actual state; a ready update is discoverable on supported layouts. Saved state and durable queued scores survive supported updates/termination. Irrecoverable cleared data is reported truthfully. Capture release markers, worker/controller state, cache contents, visible UI and device steps. Do not promise data survival after destructive OS storage clearing.

## R04 — Actual Pagelove enforcement and policy freshness

**Priority:** P0 for enabling world guard or asserting protected mutation behavior. **Owner:** Platform maintainer + application maintainer. **Status:** Observed failures documented; platform cause/contract unresolved.

Use disposable resources under the approved host and minimal policies. For the actual owner-DAV path, verify valid conditional writes succeed and invalid geometry/HP, executable markup, missing conditions, stale ETags and forbidden operations are rejected **without changing stored bytes**. Keep public/owner authorization identities separate. Include positive controls: rejecting everything is not valid enforcement.

Reproduce policy A→B changes and deletion/recreation, reading the actual stored policy and recording which behavior executes over time. Include unsafe deletion of unexpired synthetic controls because one early isolated attempt succeeded. Test actual POST/PUT/PATCH/DELETE paths as applicable, not only a GET executing a validator. Ask the platform maintainer to state whether owner writes intentionally bypass validation and what freshness/activation guarantee exists. Keep exact backend cause labeled unknown until established.

**Pass condition:** Supported write-path enforcement and policy activation semantics are documented and meet the required contract; isolated valid/invalid tests demonstrate persistence outcomes. Mere consecutive rejection responses are not a propagation guarantee. Keep the candidate inactive until its exact hash passes the real path. If the platform cannot support it, explicitly redesign the authenticated mutation flow or mark the requirement blocked; do not broaden anonymous access or add an external service silently. Prepare an updated bug report; submitting it is a separate action.

## R05 — Strict five-day score retention

**Priority:** P0 for the auto-delete requirement. **Owner:** Platform/application maintainers. **Status:** Display filtering and access-driven cleanup checked; strict background deletion absent. **Dependency:** R04 for policy assurance.

Decide whether Pagelove provides a native expiry/TTL or scheduled execution guarantee compatible with the no-external-services requirement. Specify the server clock, age origin, deletion guarantee and operational tolerance. Daily rollover is a different rule from five-day retention; verify both independently.

Create synthetic short-lived records on isolated resources. Prove physical deletion after the deadline **without any GET, open leaderboard or client cleanup request during the wait**. Ensure the first verification read does not itself create the apparent pass; use a supported non-triggering inspection or provider execution evidence. Then check exact-boundary rank removal, first-response behavior, active-record preservation, clock skew, browser sleep and resumed UI.

**Pass condition:** Evidence establishes unattended deletion within the declared contract and correct rankings. If the platform cannot provide this natively, report that limitation and obtain a requirement decision instead of claiming on-access deletion is equivalent. Do not promise millisecond-exact browser timers.

## R06 — Durable scores, saves, concurrency and migration

**Priority:** P1. **Owner:** Storage/application maintainer. **Status:** Extensive controlled-adapter coverage exists; combined lifecycle review pending.

Review database upgrade/close races, commit-before-acknowledgement, transaction abort/quota failures, two tabs leasing the same queue, stale leases after suspension, clock changes, permanent rejection, explicit retry with a false online hint, and network timeout after a server commit. Keep original run identity, ruleset and Daily date through updates and retries. Test data migrations against actual historical fixtures, including recovery/export when a checkpoint is incompatible. Check that assertions retain the original objects rather than replacements.

**Pass condition:** Acknowledged durable work really commits; retry cannot create a duplicate; a lost response can be reconciled; old tabs cannot corrupt new storage; incompatible saves are not silently overwritten. Accepted scores get a durable receipt or an actionable unresolved state. Record authoritative readback and transaction evidence. Test storage-clearing losses as a truthful limit, not an impossible recovery promise.

## R07 — Ranking, score calculation, identity and fairness

**Priority:** P1. **Owner:** Gameplay/data maintainer + independent reviewer. **Status:** Local ruleset/rollover checks exist; policy review pending.

Reconcile displayed scoring explanations with brick HP/combo/break effects, collected powers, clear/speed bonuses, remaining lives, pause/suspension and board transitions. Verify UTC day boundaries, runs spanning midnight, ties, simultaneous record submissions, expired leaders and separate Adventure/Daily record scenes/music. Check saved/queued scores across physics/scoring changes.

Decide which bug fixes remain in `prism-physics-1` and which changes require a new declared ruleset. The generated identity does not fingerprint engine code automatically. Document migration and coexistence; do not invalidate historical scores by guesswork. Review the public submission trust model: shape bounds, unique run IDs and revision labels do not prove a genuine human playthrough. There is no requirement to restore the UI disclaimer Wesley asked to remove.

**Pass condition:** Independently calculated scenarios match totals and score explanations; mode/date/ruleset eligibility is consistent in saving, display, sharing and celebration. A top-score celebration uses the defined freshness/tie contract, with uncertainty handled explicitly. Compatibility policy and security limits are documented; any unimplemented anti-cheat feature is not claimed.

## R08 — Document-first editor, extensions and content security

**Priority:** P1; server-enforcement claims depend on R04. **Owner:** Editor maintainer + security/document-model reviewer. **Status:** Shared-schema/identity fixes implemented; adversarial integration review pending.

Exercise canonical parse→edit→serialize→publish→reload with supported metadata, rows, moving/armored/custom bricks, custom properties, undo and stable IDs. Reject ambiguous/unknown unsafe content explicitly; avoid silent data loss. Review unknown routes, failed reads, missing baseline, conflicts, lost write responses and edits made during a save. Verify official ranked definitions remain separate from shared Practice edits.

Test imported HTML for script/URL injection and unsafe selectors; confirm credentials stay on the pinned owner endpoint and out of drafts, exports and logs. Review trusted behavior registration, event ordering, cancellation, exceptions, duplicate hits and asynchronous handler violations. Test editor navigation under an old worker and cold generation without an existing bundle. Separate safe client feedback from actual server enforcement.

**Pass condition:** Supported documents round-trip without unintended loss; rejected mutations leave published data unchanged; drafts remain recoverable; stable IDs are not reused; no imported executable content runs. Extension event traces match the documented contract. Capture canonical diffs, actual readback and credential-handling inspection without secrets.

## R09 — Cold performance and resource lifecycle

**Priority:** P1. **Owner:** Rendering/audio maintainer + physical-device reviewer. **Status:** Prewarming implemented; representative hardware profiling pending.

Profile the first launch/brick/power for every power and graphics mode, every world's first cinematic/music entry, repeated restarts, long sessions, graphics switching and transitions. Use a representative midrange phone and at least one weaker supported device; state the hardware. Inspect frame-time distributions, shader/texture work, memory growth, geometry/material disposal, context loss/restore, page suspension, audio unlock/resume and Web Audio scheduling after long sleep.

**Pass condition:** Define a device-specific frame-time budget before measuring; retain cold/warm traces and worst-frame causes. No unbounded resource growth or broken rendering/audio after supported recovery. A local Lighthouse score and a warm desktop run are not substitutes, and “smooth all the time” is not an evidence-based universal guarantee.

## R10 — Usability, accessibility and screen-state review

**Priority:** P1. **Owner:** Interface/accessibility reviewer. **Status:** Several desktop/phone-size reviews exist; complete state matrix pending.

Inspect start, playing, launch, pause, Settings, offline/update notices, leaderboard, name entry, Worlds and endings on short/tall portrait, landscape, fullscreen and with the keyboard open. Include safe areas, zoom/large text, keyboard navigation, focus return, screen-reader status/labels, color contrast, non-color identification, reduced motion and sufficient reading time. Review all sixteen scene palettes and score variants. Fix the known “1 lives” copy. Preserve standing interface preferences, including no northeast arrows or decorative colored card rails; the explicitly requested leaderboard age outlines have a meaningful status role.

**Pass condition:** Essential controls are visible/reachable; launch prompts never cover the paddle; update controls remain discoverable; dialogs and focus work; animated captions remain readable; symbols convey meaning without color alone. Keep screenshots/state descriptions and accessibility observations, not only source string assertions.

## R11 — Native sharing received-message verification

**Priority:** P1 before calling Android-to-Slack fixed on hardware. **Owner:** Mobile reviewer. **Status:** Payload revised; receiving-app proof pending.

Check Android→Slack and iOS/native destinations available to the reviewer, plus desktop fallbacks. Verify the actual received full message, human-readable Daily date, mode, score/name and working link. Cover text-only and supported scorecard files, unsupported `canShare`, cancellation, denied clipboard and maintained user activation. Use a private self/test destination chosen by the user; sending externally requires explicit authorization. Do not auto-message another person for QA.

**Pass condition:** Each claimed platform/destination has a redacted received-message receipt. If a receiver discards fields, the UI provides a reliable copy/download alternative. Browser payload inspection alone is not a pass for delivery.

## R12 — Ordinary campaign and Daily playthroughs

**Priority:** P1. **Owner:** Human gameplay reviewer. **Status:** Bot/accelerated coverage exists; complete ordinary human run pending.

Play all sixteen worlds with normal controls and ordinary lives, without damage shortcuts, invulnerability or life replenishment. Review all twenty formations, difficulty ramp, powers, intentional misses, pause/resume and checkpoints. Watch every completion scene at normal timing, including held/repeated launch input, World 7→8, World 8→9, final Adventure, Daily completion and each record variant. Exercise reduced motion separately. Use isolated scoring for injected record conditions; retain the distinction between injected and naturally earned records.

**Pass condition:** No progression lock, missing/repeated scene, unreadable result or incorrect mode ending. Record difficulty/balance observations separately from functional correctness. If no reviewer completes an ordinary run, report that limit rather than relabeling bot completion as human evidence. Capture build/device, world-by-world results and reproducible failures.

## R13 — Publication window, old clients and rollback

**Priority:** P1 before changing deployment architecture or release assets. **Owner:** Release/PWA maintainer. **Status:** Upload readback and preserved old caches exist; atomicity/rollback review pending.

On a disposable host/fixture, interrupt publication at each meaningful upload stage and introduce a fresh uncontrolled visitor, an A-controlled visitor and an updating visitor. Include provider-normalized HTML, stale HTTP-cached entry modules, missing new modules and worker install failure. Review immutable release URLs or native atomic publication if available. Establish how to roll back a bad-but-integrity-valid B without overwriting player data or trapping installed clients.

**Pass condition:** An incomplete release cannot become offline-ready; old clients retain a coherent supported version; new visitors receive either a coherent release or actionable recovery. Demonstrate rollback and forward recovery with checkpoints/queue intact. Document residual non-atomic upload risk if unchanged. Hash equality proves byte identity, not correct behavior.

## R14 — Repository, documentation and traceability reconciliation

**Priority:** P1. **Owner:** Repository maintainer. **Status:** Four missing README-linked files confirmed; reconciliation pending.

Review the authoring-only `DESIGN-REVIEW.md`, `CINEMATIC-UPGRADE.md`, `RECORD-UPGRADE.md` and `PADDLE-DAILY-UPGRADE.md` for public suitability and historical accuracy, then deliberately restore them or replace their links with a maintained account. Preserve historical limitations rather than rewriting old results as current. Reconcile the authoring tree, Git and runtime release inventory; consider one authoritative checkout to eliminate manual mirroring.

Add local-link/import checks to R01. Verify README tech/features/world count, architecture, ruleset instructions, installation/update guidance, known gaps and release receipts agree. Keep private exports/credentials outside Git and separate public source changes from mutable live scores/world edits. Run a clean-checkout generation to find hidden local-file dependencies.

**Pass condition:** All maintained local links resolve from a clean clone; generated output is reproducible there; missing documents have explicit provenance; all changed files are intentionally committed; deployment claims name the verified runtime, not the entire authoring folder. Record hashes and the final diff. Do not silently publish unrelated local files.

## Completion record for each review

Use an entry containing: review/requirement IDs; actor and UTC time; source SHA/release; device/browser/provider identity; exact method and fixtures; independent expected behavior; result; preserved failure reproduction; links to evidence; cleanup/readback; and remaining limits. Label each case **pass**, **fail**, **blocked**, or **not run**. A reviewed plan or a newly added test is not a successful execution result.

Suggested milestones:

1. Establish R01 and scope the next release against R02–R05. Keep unresolved platform/retention requirements visibly open.
2. Complete physical installed-device and native integration checks before making corresponding mobile/offline/share claims.
3. Complete the remaining interaction reviews and reconcile findings into regression coverage and the requirement ledger.

No dates, external assignments, scheduled automations or completed outcomes are implied by this ordering.
