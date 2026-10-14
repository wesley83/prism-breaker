# Document-first implementation

## DF-01 — Plan before implementation

- UTC: 2026-10-14T16:24:32Z; actor: Codex.
- Request: implement all review fixes and meet the document-first development standards.
- Baseline: clean main at ebd6d2fb13ddc5dbcd2058f032f3ac61339b1f09. Review: authoring audit 2026-10-14-document-first-review.md; governing rule: root DOCUMENT-FIRST-DEVELOPMENT.md.
- Plan: (1) separate a runtime-independent schema from compatibility helpers; introduce a document catalog, stable IDs, schema versions and content revisions; migrate checked-in metadata to HTML and generate all runtime world data without a previous bundle; (2) fail closed for unknown editor resources, preserve explicit recovery states, reject ambiguous/lossy imports, add metadata editing; (3) bind checkpoints to stable identity and complete definition revisions with legacy migration; (4) define deterministic trusted type/capability handlers and request/fact event contracts; (5) connect Practice presentation and offline provenance to the selected document; (6) document all 23 rule sections, ownership, server authority, migrations and exceptions; regenerate release assets and capture reviewable evidence.
- Compatibility: retain existing slugs and layouts, preserve hosted edits and shared scores, retain owner-only publishing and conditional writes. Do not broaden anonymous world writes. Preserve old checkpoint support where compatible; explicitly report incompatible saves.
- Expected files: public world documents/catalog/schema/runtime/editor/engine/events/app; relevant builders, documentation, audit/evidence, generated release assets. No unrelated workspace files.
- Verification: source/diff review and build integrity are required; focused contract/browser verification under rule section 20 is part of the requested standards assessment. Record exact results and remaining live-provider limits. Do not claim universal certification from a finite review.
- Release: synchronize the authoring copy and public source after implementation. Existing session authorization covers publishing completed game changes; preserve mutable resources and read back any deployed changes. If runtime deployment is unavailable, report that distinction explicitly.
- Status: implementation pending. No game files changed before this entry.

## DF-02 — Document model and runtime integration

- UTC: 2026-10-14T16:32:59Z; actor: Codex; reference DF-01.
- Changes: added independent world schema and document catalog; migrated sixteen checked-in definitions to schema 2 with names, instructions, narratives, palettes and theme/music selections; generated complete runtime definitions and revisions. Added stable identity and legacy compatibility adapters, revision-aware complete checkpoint definitions, guarded editor loading/recovery and world metadata controls, Practice metadata/scene/music consumption, published-cache provenance, deterministic trusted behavior registry and optional score ruleset provenance.
- Why: remove parallel metadata authorities and build cycles, prevent wrong-resource editing and lossy custom imports, preserve definition consistency and make extension contracts explicit.
- Affected files: public/world-schema.js, world-format.js, world-identity.js, world-catalog.html, worlds/*/definition.html, bundled-worlds.js, levels.js, editor.js/html/css/template/route, engine.js, app.js, scene.js, brick-events.js, leaderboard.js, offline.js, scores.html, world-data.css; tools/read-world-catalog.mjs and build-worlds/bundled-worlds/editor/data.mjs.
- Build evidence: all sixteen world sources and native composition generated successfully; baseline geometry ruleset is ea3ef3d4e217bb394db6f5e3d9e73dd49512b01091ab39ec40cc740a3a3089dd, frozen for pre-revision save/score compatibility. Geometry has not been intentionally changed.
- Failed attempts: initial combined apply_patch rejected duplicate delete/add target before any edits; Python command unavailable on PATH, then explicit bundled Python found; one utility used the Windows default encoding and stopped at levels.js after partial source migration. Completed the remaining migration with explicit UTF-8. First contract run had 52 passes and four module-load failures from a missing array bracket in the new behavior registry; corrected before continuing. No deployment attempted with these intermediate files.
- Verification plan refinement: the user's requirement to meet all document standards includes section 20's contract evidence. Add focused regression cases and run the existing suite for the changed contracts; inspect editor states in the browser. No unrelated test work.
- Platform research limit: official documentation could not be retrieved through the web tool. Do not invent new platform enforcement syntax. Preserve verified owner authorization, score schema/shape/request validation, conditional world writes and import validation. Any owner-level validation boundary must be documented accurately.
- Status: local integration complete; regression/browser/release checks pending. No live writes yet.

## DF-03 — Persistence-boundary plan refinement

- UTC: 2026-10-14T16:39:00Z; actor: Codex; reference DF-01/DF-02.
- New evidence: official Trigger and ShapeConstraint references were retrieved with an approved network-enabled shell read after sandbox connections failed. Trigger JavaScript receives the raw request, can throw HTTPResponse, and can be stored in a separate policy document. This supports a generated world-write guard using the same independent schema parser.
- Plan: generate a separately deployed world policy with a catalog-derived resource allowlist, canonical validation, whole-document conditional writes and no anonymous grant. Probe the guard on an isolated resource before enabling the production world scope. Preserve hosted v1 documents on reads; the next editor publish upgrades to v2. Normal deploys still exclude mutable worlds.
- Verification so far: 95 contract checks passed. An initial browser module fetch failure cleared on intentional reload. Unknown-route chooser, metadata edit, preview launch and restoration of the local review draft were observed. Bun bundling cannot resolve the existing query-string imports; Bun.Transpiler parsed all top-level browser modules successfully instead.
- References: https://docs.pagelove.com/reference/reacting-to-changes/Trigger/ and https://docs.pagelove.com/reference/modeling-data/ShapeConstraint/.
- Status: policy generation/probe pending; no live policy installed yet.

## DF-04 — Completed local implementation and release gate

- UTC: 2026-10-14T16:51:03Z; actor: Codex; reference DF-01 through DF-03.
- Changes: completed retained brick-ID counters, independent catalog-driven builders, Practice metadata/scene/music/cinematic integration, separate published/draft recovery, ambiguous-import rejection, checkpoint v2 and legacy compatibility, ruleset-aware score storage/ranking, deterministic behavior hooks and generated canonical world-write guard. Added a live-probe operation and a policy-hash/freshness gate to the publisher. Updated README/WORLD-EDITOR, copied the governing rule and added the architecture guide mapping all 23 standards.
- Meaningful follow-up fixes: reject v2 saves without a ruleset; preserve/download incompatible saved adventures; escape document-derived world labels; keep unknown-baseline offline drafts unpublishable after reload; distinguish a published snapshot from newer draft edits; exclude server policy from the offline asset cache; use current document metadata in cinematics and retain preset identity independently of campaign order.
- Affected files: source and generated files in public/, relevant tools/, tests/document-first.test.mjs, package.json, README.md, WORLD-EDITOR.md, DOCUMENT-FIRST-DEVELOPMENT.md, DOCUMENT-FIRST-ARCHITECTURE.md and this audit/evidence. Exact file set is recorded by the final staged patch and hash manifest.
- Automated verification: bun run build succeeded; 97 tests passed across 11 files, zero failures; bun run check succeeded; all top-level browser JavaScript parsed through Bun.Transpiler; git diff --check clean. Cold rebuild in an isolated directory without a generated bundle matched the official output. Local policy checks accepted valid canonical documents and rejected bad HP, injected markup, wrong identity, missing conditions, selector writes and deletion.
- Release built locally: 292ac27d13b7a4bfd63a, 71 offline assets, 2,416,780 bytes. The geometry/ruleset fingerprint remains the frozen legacy-compatible baseline.
- Browser evidence: unknown route leaves the world unselected and editing disabled; valid selection loads the correct world; edited name appears in real play preview; ball launches; local review draft restored to original. A deliberate local 503 shows explicit recovery; opening the original leaves Publish disabled. Local Update game replaced the older eight-world installation with the sixteen-world build and resumed the pre-existing Prism Citadel checkpoint. The final editor screenshot is recorded alongside this audit. These are local-browser observations, not live-host enforcement results.
- Failed/limited checks: an attempted Bun bundle check could not resolve pre-existing query-string imports; syntax parsing and actual browser loading were used instead. Two large patch wrapper submissions failed to parse before editing anything; subsequent patches succeeded. Official docs were reachable through the approved network-enabled shell, correcting the earlier web-tool availability limitation.
- Automatic approval review rejected starting the live probe/publisher. Its stated reason was that installing a production world-write policy and publishing would make consequential external changes and a persistent security-boundary change without sufficiently explicit authorization for that exact scope. No workaround or indirect live write was attempted.
- Pending: explicit approval for isolated host probe/cleanup, enabling the exact sixteen-world policy, conditional score-schema migration, publishing the reviewed release and public source, then live readback. No new live resources, score changes or production policy have been written during this turn.
- Reconciliation: preserve unrelated root changes. Commit the completed local source/audit and synchronize only this change set into the authoring copy. Capture its staged diff and SHA-256 hashes; exclude the manifest's own hash to avoid recursion. This audit is procedural evidence, not automatic observation of unrelated edits.

## DF-05 — Explicit probe and release authorization

- UTC: 2026-10-14T17:00:00Z; actor: Codex; reference DF-04 and user's approval reply.
- User explicitly approved the isolated policy probe and cleanup, enabling validation and conditional writes for the sixteen world documents, preserving records while migrating score rules, game deployment and pushing source to wesley83/prism-breaker.
- Plan: run the isolated probe first; proceed only on successful enforcement evidence, then migrate score rules, publish, read back live state, and reconcile source/audit evidence before commit and push.
- Status: authorization received; probe and release pending. This entry supersedes the permission gate in DF-04, not its historical record.

- Timestamp correction (2026-10-14T16:56:37Z): DF-05's 17:00:00Z was an estimated timestamp entered incorrectly. Approval and publisher startup occurred before this correction; this timestamp is the observed UTC time. No probe had run at correction time.

## DF-06 — Live probe finding and revised investigation

- UTC: 2026-10-14T16:57:55.2093057Z; actor: Codex; reference DF-05.
- DAV probe: valid create 201, invalid HP accepted 200, missing condition accepted 200; stale ETag rejected 412. This disproves the assumed DAV trigger enforcement. Probe resources were removed by the cleanup routine; no production policy installed.
- Plan revision: probe the normal host request pipeline separately. Do not enable production enforcement or claim it works until its actual write path passes. Preserve the live game and records throughout investigation.
- Affected files: tools/remote.mjs probe endpoint option and this audit; verification pending.

## DF-07 — Verified platform limit and safe release revision

- UTC: 2026-10-14T17:02:45.9398668Z; actor: Codex; reference DF-06.
- Public owner-key PUT returned 401. A separate disposable GET trigger returned 418 both from a separate policy document and embedded in its target, confirming discovery works. DAV mutation-trigger enforcement still failed. All probes cleaned up their resources.
- Plan revision: publish completed application fixes and conditional score-rule migration without activating or deploying the candidate world guard. Keep owner-only DAV authorization, client/shared-schema validation, ETag conflicts and readback. No anonymous write grant or new authentication flow will be introduced. Full server-authoritative world validation remains blocked by the available write pipeline; do not claim all standards are satisfied.
- Changes planned: move generated candidate policy outside public assets, keep activation gated by a passing DAV probe, correct documentation and release procedure, then run regression/build checks and deploy the unaffected authorized work.
- This is an evidence-driven release scope reduction after explicit authorization, not an approval bypass. Production worlds and score records remain preserved.

## DF-08 — First deployment and live offline-download correction

- UTC: 2026-10-14T17:07:40.3009017Z; actor: Codex; reference DF-07.
- Score migration succeeded (200), preserving all 68 run IDs, no missing timestamps. Deployment uploaded/read back 76 files; world definitions were excluded and /world-policy.html returned 404. Release 292ac27d13b7a4bfd63a was publicly readable; native editor composed and showed metadata controls.
- Browser observation: offline download briefly failed; retry displayed Ready, but source review and live catalog readback identified an actual integrity mismatch: Pagelove reserializes HTML while the new world-catalog.html had entered the byte-verified static cache. Existing game cache remained usable; this is not proof the new worker installed.
- Correction plan: exclude the authoring catalog from offline precache because the generated bundled catalog already supplies all official runtime data. Add regression coverage, rebuild, republish and verify Update game visibly reaches complete offline readiness.
- Files: tools/build-pwa.mjs, tests/document-first.test.mjs, generated release files, documentation counts and this audit. Pending final verification.

## DF-09 — Corrected release verified and source reconciliation

- UTC: 2026-10-14T17:11:08.4796443Z; actor: Codex; reference DF-08.
- Changes: excluded the authoring catalog from precache, added the HTML-cache regression, moved the policy candidate outside public assets, separated policy activation from ordinary deployment and retained a fresh DAV-proof/hash gate. Updated README and architecture coverage to disclose the server enforcement gap.
- Verification: 98 tests passed across 11 files, build and release check passed, staged diff check clean, credential-pattern scan clear. Final release ee6a8edb8f4578dd9b0b has 70 offline assets / 2,411,852 bytes. All 76 uploaded files were read back; publisher compares non-HTML bytes exactly. Public release read returned 200.
- Live browser: native /editor/prism-garden composes and exposes metadata controls. The corrected worker downloaded, Update game appeared, clicking it reloaded the app, DOM release meta matched ee6a8edb8f4578dd9b0b, and Ready to play offline / all sixteen worlds saved appeared. Screenshots saved beside this audit. No production world or test score was submitted.
- Data: score migration preserved 68 run IDs. Hosted world definitions were excluded from both deployments. Candidate policy is not deployed (/world-policy.html returned 404). Disposable policy/data and discovery resources were cleaned up.
- Remaining gap: server-authoritative world validation cannot be claimed on the tested DAV path; all-standards compliance is incomplete. Owner authorization and ETag conflict protection remain intact. Future policy activation requires actual passing DAV enforcement evidence.
- Reconciliation: stage only the nested project changes, capture the staged implementation patch and SHA-256 file manifest, synchronize exactly those files into the authoring copy, then commit and push the authorized public source. Publication result pending at this entry.
