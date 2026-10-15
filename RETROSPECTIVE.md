# Prism Breaker retrospective: missed issues and verification failures

Prepared October 15, 2026 UTC for Wesley, by Codex. Evidence baseline: source commit `c77f34164ac6c0d1171c36c96eca5e3d23dcfd8a`. The most recent recorded deployed runtime is `a998edcd3009a53d6733`.

## What happened

The game received substantial implementation and testing, but the verification repeatedly covered less than the confidence expressed about it. Tests established that particular paths worked. They did not establish that the surrounding states, physical devices, visible controls, server enforcement and release transitions worked together. Some earlier checks also encoded incorrect assumptions.

I should have challenged those assumptions, made the missing evidence more prominent, and avoided broad assurances that could reasonably be understood as covering the complete product. The detailed later reports often state their limits correctly. That qualification must also govern the short answer and the release decision; it cannot be buried beneath a reassuring test count.

The clearest example is the paddle: the first fix added a motion sweep, but retained a rule that rejected a ball below the paddle's center even when it still touched the solid paddle. An existing regression test explicitly required that contact to miss. Passing the test reinforced the defect. A separately changed visual endcap was also taller than the collision envelope. These were real application bugs, subsequently reproduced and corrected.

The overall causes were:

1. **Acceptance criteria were not independent enough of the implementation.** Internal state, helper results and test fixtures sometimes stood in for what a player could see or do.
2. **Verification was divided by component rather than player journey.** A worker could update, yet its button was hidden. A validator could reject a document, yet the real write path could persist it. A campaign harness could finish, yet ordinary human play was not established.
3. **Lifecycle and failure combinations received coverage late.** Cache eviction, worker restarts, multiple releases, delayed responses, storage errors and long-lived sessions exposed weaknesses that a clean startup did not.
4. **Desktop evidence was insufficient for mobile integration claims.** Responsive previews did not establish native sharing, installed app relaunch, OS termination, mobile GPU performance or iOS behavior.
5. **Release checks were manual and incomplete.** There is no GitHub Actions workflow. The publisher checks generated assets and upload readback, but does not require the behavioral suite or a signed-off acceptance matrix.
6. **Requirements and unresolved exceptions were not consistently treated as completion gates.** Five-day physical deletion and world-write enforcement remain incomplete even though related client behavior works.

Rapid growth from an eight-world game into sixteen worlds, an editor, ranked modes, offline storage and a PWA enlarged the interaction space. That explains the need for stronger controls; it does not excuse missing them or place responsibility on the feature requests.

## Scope and confidence

This retrospective reconciles Git history, source, tests, release tooling, audit records, bug reports and available authoring notes. It includes a new read-only check of GitHub's workflow inventory and README document links. It does **not** rerun the game, constitute a new security audit, test physical phones, or prove the absence of further bugs.

The most recent recorded suite result is **136 passing tests across 13 files**, from the paddle follow-up. Earlier counts of 71, 101, 125 and 130 describe particular milestones. They are not percentages of product coverage or measures of certainty.

Early authoring notes are less complete than later version-controlled audits. The four historical notes discussed below exist in the local authoring tree but were absent from this Git checkout. Their observations are retrospective source material, not a complete historical execution log. Where the evidence does not identify the original cause or a user's exact device/build, this report says so. There is no basis for inventing the reasoning behind every earlier decision.

## Timeline of the important escapes

| Milestone | What the evidence established | What it did not establish |
| --- | --- | --- |
| Early design, sharing and cinematic upgrades | Layout previews, selected browser flows, artwork and scene changes; some releases explicitly recorded that no suite was run | Physical Android share delivery, cold mobile rendering, all scene/input combinations |
| First paddle and update correction, `df4e395` | Relative paddle motion and selected upper/side contacts; an actual browser update; 71 tests at that stage | Full solid paddle contact, renderer/physics agreement, automatic update discovery |
| Sixteen worlds and document-first work | More worlds; semantic HTML, generated official content, editor and migration contracts | Ordinary three-life human completion; server enforcement on the actual owner write path |
| Final acceptance, `ba313b4` | 101 tests; hosted score persistence; controlled rollover/expiry; accelerated sixteen-world traversal | Exact-time background deletion; physical phones; a normal complete human campaign |
| PWA robustness, `dbb5c63` | Cache/lifecycle fault corrections; 125 tests; real Chromium update/offline lab | Natural discovery of the update control in all layouts; Android/iOS installed lifecycle |
| Update visibility, `8de366c` | Hidden/clipped controls and missing periodic/manual checks corrected; 130 tests | The state of Wesley's separate Android installation or every OS lifecycle |
| Second paddle correction, `cdd2286` | Lower-body and endcap misses reproduced; independent geometry checks; 136 tests | Exact reconstruction of the reporting player's session or every possible collision |

The [final acceptance report](FINAL-ACCEPTANCE-REPORT.md) already calls itself a scoped result. That was appropriate. The corrective lesson is to apply its boundaries consistently to every readiness statement, rather than treating the word “final” or the passing suite as broader certification.

## Issue register

“Corrected” below means the cited implementation and its stated checks are recorded as completed. It does not mean every device has been verified. Review IDs point to the [follow-up plan](FOLLOW-UP-REVIEW-PLAN.md).

### Gameplay, presentation and input

| ID | What happened | Why the earlier approach missed it | Recorded outcome / further review |
| --- | --- | --- | --- |
| G01 | A moving paddle could miss a descending ball because checking its destination alone missed contact during motion | Discrete position checks did not describe relative motion through the step | First swept-contact fix implemented. Its scope was still incomplete. R02 |
| G02 | A descending ball overlapping the lower half of the paddle was rejected | The “below paddle center means missed” assumption was encoded in both code and a regression assertion | Full-body sweep now distinguishes overlap from a ball entirely clear below. Independent distance oracle and sampled cases added. R02 |
| G03 | Raised crystal paddle endcaps extended beyond the physics surface | Art changes were reviewed visually without an executable agreement check against the solid collider | Physics half-height changed from 0.17 to 0.21 to cover measured solid bounds of about 0.208. Glow remains decorative. R02 |
| G04 | Sticky originally centralized the held ball; Wide expiry could remove its support | A power was considered alone instead of together with landing position, multiple held balls and width changes | Offset retention and unsupported-ball release were implemented. The early authoring note records browser checks but no suite run for that patch. Later tests cover Sticky/Wide. R02/R06 |
| G05 | A first power-up brick could cause a rendering stutter | Warm desktop play did not expose first-use texture, material and graphics pipeline costs | Pools and prewarming added, including preparation after graphics changes. Physical cold-start frame pacing remains unverified. R09 |
| G06 | World 7 could appear to have no completion scene | Scene existence was checked without sustained/repeated launch input and interrupted transition recovery | The dedicated Cosmic Reef scene already existed. Repeat-key suppression, an initial skip grace period and transition resume handling were added. This was not proof that the scene asset was absent. R12 |
| G07 | Launch instructions covered the paddle; result bonuses were visually off-center; Daily start was understated | A control's presence or correct text was accepted without reviewing hierarchy and actual placement in context | Layout changes recorded. Short screens, landscape, fullscreen and virtual keyboard remain part of R10 |
| G08 | Cinematic text was small or difficult to read against bright scenes; brick symbols and HP were unclear | Static appearance and one background were insufficient checks for animated contrast, reading time, state changes and phone sizes | Dark caption backing, larger text, score emphasis, HP colors, dynamic counts and a legend implemented. Review all sixteen worlds and motion settings under R10/R12 |
| G09 | Resume/replacement messaging, progress labels and some mode descriptions could mislead | Happy-path previews did not systematically compare copy with saved state and actual capabilities | Recorded design corrections include clearer save/replacement behavior. One known cosmetic defect, “1 lives,” remained in final acceptance. R10 |

Sources: [paddle follow-up](PADDLE-COLLISION-FOLLOWUP.md), [first collision audit](audit/2026-10-14-paddle-update.md), [UI/performance upgrade](UI-PERFORMANCE-UPGRADE.md), [brick labels](BRICK-LABELS.md), [scene typography](SCENE-TYPOGRAPHY-REVIEW.md), and Git history. Sticky's initial implementation details also appear in the authoring-only `PADDLE-DAILY-UPGRADE.md`.

### PWA, offline behavior and update delivery

| ID | What happened | Why it escaped | Recorded outcome / further review |
| --- | --- | --- | --- |
| P01 | A cache completion marker could survive loss of a required asset; cached HTML could start with missing modules | Install success was treated as persistent readiness | Complete inventory checks and safer navigation/recovery implemented. Download hashes and readiness checks have different purposes. R03 |
| P02 | An old tab could silently receive a newer release after cache loss/worker restart; unknown clients could be guessed current | Tests emphasized a fresh page with intact pins/caches | Independent persisted release pins, client identification and explicit failure replace silent mixing. R03/R13 |
| P03 | Broken metadata, unavailable storage, quota failure or unbounded fetch/body reads could stall recovery | Storage and networking were effectively assumed available or promptly failing | Defensive metadata handling, error recovery and request/download deadlines implemented. Browser storage operations themselves are not Fetch-abortable. R03/R06 |
| P04 | A waiting update's cache could disappear; late repair/controller responses could overwrite newer state | “Installed,” “ready,” and “still valid when activated” were treated too similarly; response ordering was underspecified | Activation inventory recheck/repair and generation/controller guards implemented. R03 |
| P05 | Missing releases could stay “Preparing”; install controls could reappear; false online hints could block explicit retry; stale database close events could clear a new connection | Event sequences and failure recovery were less tested than normal transitions | Specific regressions and client/database fixes implemented. R03/R06 |
| P06 | Fresh HTML and a cached release module could disagree; an authoring catalog in the precache failed its hash after host HTML normalization | Local build integrity did not model provider serialization or ordinary HTTP caching | HTML marker precedence, entry version updates and catalog exclusion from offline assets implemented. Generated official definitions remain bundled. R13 |
| P07 | Update game worked but was clipped below the arena or hidden during phone/fullscreen play | Browser tests deliberately activated update detection and found the control, bypassing normal discovery; CSS state was outside the worker tests | Sticky start-screen notice, Settings check/status and pause hint added. R03/R10 |
| P08 | A visible app left open had no periodic check and no manual check | Startup/reconnect/visibility paths were mistaken for complete update detection coverage | Periodic visible-page checks and manual checks added. A failed download also received a regression against false “up to date” feedback. R03 |
| P09 | An older controlled client initially blocked new workshop modules | Editor navigation and release isolation were individually plausible but not tested together | Workshop bootstrap explicitly selects network assets; game release pins remain protected. R08/R13 |

Sources: [PWA robustness review](PWA-ROBUSTNESS-REVIEW.md), [update visibility investigation](UPDATE-VISIBILITY-INVESTIGATION.md), [document-first implementation audit](audit/2026-10-14-document-first-implementation.md), and their linked evidence.

A missing update button is **not always a bug**. A waiting worker can activate after all windows close, so the next launch is already current. Likewise, fullscreen is a platform preference with fallbacks, not a guarantee that ordinary phone browser navigation can force an OS display mode. The bugs were hidden controls, insufficient checking and incorrect recovery states—not those browser lifecycle rules. Physical installed-device verification is still outstanding.

### Data, platform contracts and document-first architecture

| ID | What happened | Why it escaped | Recorded outcome / further review |
| --- | --- | --- | --- |
| D01 | World/editor metadata had parallel authorities, lossy type/property handling, identity and route fallback risks | Structured HTML was treated as sufficient evidence of document-first behavior without testing round-trip, authority and failure contracts | Shared schema/catalog, stable IDs, lossless supported model, cold builds and fail-closed editor implemented. R08 |
| D02 | Draft baseline, revision-aware checkpoint content and ambiguous write outcomes needed stronger handling | Typical saves succeeded; conflict, migration, edits during save and lost responses received less attention | Baseline comparisons, conditional writes, readback/reconciliation and full-definition checkpoint recovery implemented. R06/R08 |
| D03 | Extension ordering, cancellation and failure behavior were not fully defined | Extensibility was demonstrated by examples rather than a complete behavior contract | Synchronous trusted registry, ordering, cancellation/error contracts and tests added. Documents select bounded recipes, not arbitrary executable code. R08 |
| D04 | Owner-DAV writes could persist documents that a proposed server validator rejected | Executing a validator through a readable trigger was not proof that the actual mutation path enforced it | Minimal owner-write reproduction recorded; candidate guard remains inactive. Stale ETags still rejected; no anonymous world-write grant was added. Requires platform resolution. R04 |
| D05 | Newly changed policies could execute stale behavior; an early isolated unrestricted DELETE removed an unexpired control | Successful later checks were insufficient evidence of immediate policy propagation or safe activation | Failed observation preserved; later settled checks passed. Exact backend cause is unconfirmed. Do not turn repeated successful responses into a propagation guarantee. R04 |
| D06 | Scores stop ranking at five days, but may remain stored beyond five days without access | Display expiry and on-access cleanup were allowed to stand in for the explicit auto-deletion requirement | Ranking boundary works in recorded tests; strict background physical deletion remains **unimplemented**. R05 |
| D07 | Manifest text still described eight worlds; other evolving release metadata risked becoming stale | Feature expansion was not paired with a complete metadata/compatibility checklist | Manifest description corrected. Ruleset identity, checkpoints, queues, docs and rollout need joint review. R07/R13/R14 |

Sources: [document-first architecture](DOCUMENT-FIRST-ARCHITECTURE.md), [implementation audit](audit/2026-10-14-document-first-implementation.md), [DAV bug report](DAV-TRIGGER-BUG-REPORT.md), [additional investigation](DAV-INVESTIGATION-FINDINGS.md), and [final acceptance](FINAL-ACCEPTANCE-REPORT.md).

D04/D05 are observed platform-path failures or unresolved platform contracts. Their exact internal cause is not established. Neither the initial DOM parser hypothesis nor a presumed administrative bypass should be reported as a proven explanation. Follow-up probes established that server parsing/validation itself could run; the missing guarantee concerned real persistence and policy freshness. Owner authorization still exists. This is not evidence of an anonymous write exploit.

### Native sharing and review infrastructure

| ID | What happened | Why it escaped | Recorded outcome / further review |
| --- | --- | --- | --- |
| S01 | Android sharing to Slack delivered a link without the expected message | Creating an apparently valid Web Share payload was treated as enough; actual receiver behavior was not verified | A complete message including the link is now supplied in the text field rather than split between text and URL. Human-readable Daily dates also added. Actual Android-to-Slack delivery after correction remains unverified. R11 |
| Q01 | Broad confidence could exceed narrow checks | A passing suite, browser preview, hash receipt or accelerated campaign was allowed to imply product-wide coverage | This report defines scoped claims and a proposed release evidence gate. It is not yet enforced by CI. R01 |
| Q02 | No automatic behavioral CI gate exists | Tooling validates output consistency and publication, while test execution/signoff is separate and manual | GitHub reported zero Actions workflows during this retrospective. Publisher does not run the suite. R01 |
| Q03 | Four README-linked historical documents were missing from the Git repo while existing in the authoring tree | Two trees and selective publication lacked an automated documentation reconciliation check | Newly recorded link audit; restoration/reconciliation remains queued. R14 |

Sources: [sharing upgrade](SHARING-UPGRADE.md), [publisher](tools/remote.mjs), [package scripts](package.json), [README link audit](audit/2026-10-15-retro-document-links.json), and the [retrospective evidence receipt](audit/2026-10-15-retro-evidence.json).

## Why repeated reviews still missed important defects

### The test oracle sometimes agreed with the wrong assumption

An oracle is how a test decides what should happen. If it repeats the implementation's center-line rule, it cannot expose that rule as wrong. More examples using the same assumption add confidence without adding independence.

The latest paddle review improved this by comparing actual solid Three.js bounds and an independent circle-to-rectangle distance calculation with the engine's result. It added a 192-configuration matrix and 4,000 seeded diagonal trajectories. The straight-line oracle deliberately excludes steps containing a wall bounce. That boundary must remain explicit; it still calls for a separate multi-contact review.

A newly written mesh regression briefly produced a false pass because a render group retained its world offset and the assertion inspected a replacement ball after the original was lost. Those fixture errors were caught and corrected before release. They are evidence that even a new test needs validation: retain the original object, align coordinates, make the old build fail, and show the revised build pass for the intended reason.

### End-to-end labels hid important test seams

The sixteen-world bot uses real collisions but replenishes lives. The browser campaign uses the production application but accelerates damage. The local acceptance fixture intercepts scores and disables worker registration. A separate live browser run did persist a score, and separate hosted probes checked deletion rules. These are useful complementary checks; they are not one ordinary, unmodified, sixteen-world, three-life, installed-phone playthrough.

Likewise, a Chromium lab that calls Check for updates proves a different path from leaving an app open and expecting an obvious prompt. A phone-sized viewport proves a different path from an installed Android process being terminated and relaunched in airplane mode. The review process needs names and claims that preserve those distinctions.

### Verification stopped too early at system boundaries

For native sharing, the meaningful endpoint is the received message. For persistence, it is the stored record under the real write authorization. For expiry, it is whether the record still exists after the promised period with no visitors. For update delivery, it is an older player's visible, safe path to the new game. Checking an upstream API call or internal flag is necessary but insufficient.

The same principle applies to document-first development. Semantic HTML, shared parsers and generated runtime data are architectural strengths. They do not by themselves establish server-side write enforcement, safe migrations, publication consistency or extensibility without data loss. Those are separate contracts requiring separate proof.

### Release evidence was available but not an enforced gate

The publisher's deterministic build check, upload ordering and byte readback are valuable. They establish which bytes were published and protect live score/world data from routine replacement. They do not decide whether those bytes implement the right behavior.

GitHub's workflow API returned `total_count: 0`. Branch protection was **not inspected**, so this report does not claim that it is absent. The current fact is that there is no Actions workflow supplying the proposed behavioral/build checks. A manual command and a markdown report can be skipped, become stale or apply to a different source revision unless the release process checks their identity.

The same agent often implemented the change, wrote tests and summarized readiness. That makes a separate challenge to assumptions especially valuable for physics, persistence, updates and compatibility. Another automated pass is useful only if its method or oracle is genuinely independent.

## New findings from this retrospective

1. **Missing CI/release gate:** source inspection and a live GitHub read confirm Q02. Existing build/readback checks should remain, with behavioral evidence added rather than confused with them.
2. **Broken documentation provenance:** README links reference `DESIGN-REVIEW.md`, `CINEMATIC-UPGRADE.md`, `RECORD-UPGRADE.md` and `PADDLE-DAILY-UPGRADE.md`, absent from Git but present in the authoring copy. These are four unique missing documents, not five; the design note is linked twice. This is a documentation defect, not proof that game assets failed to deploy. The new link receipt covers README local Markdown links only.
3. **Ruleset policy needs clarification:** the catalog still declares `prism-physics-1`. The generated ruleset identity fingerprints that declaration and gameplay definitions, not engine source automatically. Recent collision fixes retained the declaration. This is a compatibility/fairness review question, not a finding that all historical scores are invalid. Define which bug fixes preserve compatibility and which physics/scoring changes must split rulesets. Do not indiscriminately delete scores or invalidate saves.

## What should not be counted as an escaped bug

Several requests established new preferences or expanded the product: removing northeast arrows and accent rails, changing logo/crystal art/paddle style, moving the player's score to the center, adding Classic mode, more worlds, launch variation, bonus scoring, richer scenes and Bun tooling. Those requests are not by themselves evidence that an earlier implementation violated a known requirement.

Once a preference or contract is adopted, later violations become review failures. The interface conventions now record the standing preferences. The review should distinguish discoverability/accessibility defects from a legitimate change in visual direction.

Expected browser behavior also needs accurate wording: an already-current installed app needs no update button; a browser can deny fullscreen or native sharing; storage can be evicted. The app remains responsible for safe recovery and truthful feedback around those limits. No app can restore an unsent score after the browser has irreversibly deleted its only copy.

## Prevention: present controls and missing controls

| Control | Actual status at this report | Needed change |
| --- | --- | --- |
| Independent paddle contact/solid geometry checks | Added in latest correction; local regression suite | Expand to multi-contact/time/input interactions and validate rendered behavior under real input. R02 |
| Worker/queue failure-injection tests | Present, including recent lifecycle regressions | Extend across real engines and installed devices; preserve source-specific receipts. R03/R06 |
| Release inventories, hashes and old-release isolation | Present | Review partial deployment and rollback; do not label sequential upload atomic. R13 |
| Active-run update protection and visible/manual update controls | Implemented and Chromium-checked | Installed-device upgrade/kill/relaunch evidence still needed. R03 |
| Shared document schema, stable identities, conditional writes/readback | Implemented in application/editor | Real owner-write enforcement remains blocked. R04/R08 |
| Version-controlled plans, change evidence and known limits | Present in later audits; early record incomplete | Require an unresolved-requirement ledger and documentation reconciliation. R01/R14 |
| Automated CI and publisher linkage to passing behavioral evidence | **Absent** | Implement required checks tied to exact source and generated release. R01 |
| Physical-device release matrix | **Not completed** | Android and iOS owners/receipts; desktop simulation must stay labeled. R03/R09/R11 |
| Independent critical-change review | Not an enforced release control | Require a second reviewer or a demonstrably independent oracle for high-risk changes. R01 |
| Strict unattended five-day deletion | **Not implemented** | Establish a supported native platform mechanism and verify it without reads. R05 |

This documentation update does not implement CI, repair platform behavior, add a deletion scheduler or complete those reviews. It makes the gaps reviewable and defines acceptance criteria in the companion plan.

### Proposed release discipline

For each change, identify its observable contract, affected states and risk class before implementation. Record a regression that fails for the intended reason where a bug is reproducible. Require an independent oracle for critical geometry, persistence, identity and time behavior. Verify actual boundaries as well as helpers.

For physics changes, require relative motion, visual/collider agreement, genuine misses, powers and checkpoint interactions. For PWA changes, require two distinct releases and lifecycle/fault transitions, with installed-device coverage when making platform claims. For shared data changes, require actual provider writes/readback, valid positive controls, rejected mutations with unchanged-data checks, and concurrency/time behavior on isolated resources.

Before release, link evidence to the exact source commit and generated release; list passed, failed, blocked and not-run cases separately. A passing count cannot override an open required contract. Upload readback verifies publication after these checks; it does not replace them. Preserve old data, a known recoverable release and explicit rollback instructions.

After release, compare the live release and critical assets, exercise a safe old-client upgrade, and record results. Keep physical-device checks explicit. Do not silently make production score writes or destructive probes to satisfy a checklist; use isolated resources and the existing authorization boundary.

Readiness language should follow this form: **“Checked [behavior] on [release/environment] using [method]; [result]. [Specific limits] remain unverified or blocked.”** Avoid “exhaustive,” “all fixed,” or an unconditional “production ready” unless a declared acceptance scope and its required gates are actually complete. No finite test matrix proves the absence of every defect.

## Current unresolved position

The evidence supports a working game with numerous verified corrections. It does not support closing all requirements or claiming every mobile/offline path is production-verified. The important unresolved items are strict background score deletion, actual owner-write policy enforcement/freshness, physical installed-device behavior, the missing automated release gate and the documented integration reviews.

The [follow-up review plan](FOLLOW-UP-REVIEW-PLAN.md) orders that work and states what would count as completion. These risks do not independently establish that the live game must be taken offline. They do require scoped claims and honest treatment of unfinished contracts before another broad readiness assurance.

## Evidence index

- [Latest collision reproduction, correction and publication](PADDLE-COLLISION-FOLLOWUP.md)
- [Earlier paddle/update plan and results](audit/2026-10-14-paddle-update.md)
- [PWA robustness findings and verification limits](PWA-ROBUSTNESS-REVIEW.md)
- [Update discovery and visibility investigation](UPDATE-VISIBILITY-INVESTIGATION.md)
- [Hosted submission, rollover, expiry and campaign acceptance](FINAL-ACCEPTANCE-REPORT.md)
- [Document-first contracts and blocked enforcement](DOCUMENT-FIRST-ARCHITECTURE.md)
- [World editor implementation](WORLD-EDITOR.md)
- [DAV minimal reproduction](DAV-TRIGGER-BUG-REPORT.md) and [additional findings](DAV-INVESTIGATION-FINDINGS.md)
- [UI/performance](UI-PERFORMANCE-UPGRADE.md), [sharing](SHARING-UPGRADE.md), [fullscreen](FULLSCREEN-UPGRADE.md), [labels](BRICK-LABELS.md), [typography](SCENE-TYPOGRAPHY-REVIEW.md)
- [New retrospective observations and source provenance](audit/2026-10-15-retro-evidence.json), [README link receipt](audit/2026-10-15-retro-document-links.json), [audit](audit/2026-10-15-retrospective.md)
