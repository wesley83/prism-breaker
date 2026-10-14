# Sixteen worlds, cinematic overhaul and five-day scores

## PB-16-01 — Implementation plan

- UTC: 2026-10-14T01:53:32.104Z (session clock reading).
- Actor: Codex; request: add eight Adventure levels, substantially upgrade every cutscene, automatically delete leaderboard scores after at most five days.
- Plan: expand the existing world model to 16 distinct worlds, each with its own formation, theme, music and cinematic; preserve the current Citadel as a three-formation midpoint and introduce a new final world. Replace hard-coded progression, validation, daily selection and score limits with shared constants. Keep existing checkpoints readable.
- Cinematic direction: staged establishing, activation and reveal shots; world-specific landmarks, layered depth, reflective surfaces, atmospheric particles, controlled bloom and readable late-stage titles. Upgrade ordinary Daily endings and both record celebrations as well. Keep deterministic elapsed-time animation, reduced-motion compositions and lower-cost phone rendering. Apply the HyperFrames animation craft/Three.js guidance within the existing interactive renderer; no rendered-video framework migration.
- Retention: investigate supported native Pagelove scheduling/expiry and server-time functions before implementation. Enforce a five-day maximum in leaderboard reads/rankings, and actually remove expired stored rows through a guarded native provider mechanism. Preserve recent rows and use ETags for schema migration; no anonymous blanket delete authority. If native timers are unavailable, record the exact platform limitation and implement the strongest safe provider-supported cleanup without introducing an external service or claiming an idle-site timer exists.
- Verification plan: build checks and browser visual inspection of all scene families, completion/finale paths, mobile/reduced-motion layouts, and a separate disposable provider retention probe. Existing tests may be updated for new model limits; broad test execution is not requested in this turn and will not be run unless needed by an applicable instruction or further user request.
- Expected files: levels/engine/app/music/audio/scene/cinematics/cinematic-score/daily-ending/daily-score/champion/leaderboard/offline/sharing/index/style/PWA runtime; data builder and publisher migration tooling; new local preview art; docs and audit evidence. Final list and SHA-256 inventory will be reconciled with the Git diff.
- Current findings: current game, share previews and validators assume eight worlds. The current leaderboard has no retention job. Public documentation retrieval through web tooling failed; will inspect official documentation by another read path and local verified build reference. No implementation has begun.

## PB-16-02 — World model and cinematic implementation

- UTC: 2026-10-14T02:15:00Z (approximate work interval; exact release receipt follows).
- Actor: Codex; reference PB-16-01 and the user's sixteen-world/cinematic request.
- Changed: added worlds 9–16 with new formations, mixed mechanisms and eight synthesized musical arrangements; centralized world count/finale and phase counts; updated saved-game validation, restored portal phases, journey labels, offline/share coverage and data generation. Existing Citadel remains a three-phase midpoint.
- Changed: replaced all Adventure cinematic sets with distinct procedural landmarks and three editorial shots; added reflective local materials, instanced terrain, layered atmosphere, activation animation and late readable titles. Expanded champion geometry to sixteen gems, curved trophy, laurel branches and deeper staging; expanded daily clock and separate solar crown. Added asynchronous cinematic shader preparation and low-effects fades.
- Files: public/levels.js, engine.js, app.js, offline.js, sharing.js, music.js, index.html, pwa.js, manifest.webmanifest, cinematics.js, cinematic-score.js, champion.js, daily-ending.js, daily-score.js, scene.js, worlds.html, scores.html; tools/build-data.mjs.
- Verification pending: browser composition review and final build consistency. No broad automated suite run.
- Provider investigation: native transient expiry is session-scoped and fixed at 30 days, so it cannot implement shared five-day scores. A disposable, isolated expiry resource successfully removed a 2020 timestamp row (204) and rejected a 2099 row (403), using server Temporal.Now and stored-row lookup. First attempt failed closed (500) because Instant.subtract requires Temporal.Duration.from("PT120H"), corrected before retry. Direct shared-score rules have not changed yet.
- Implementation tooling correction: an initial multi-file patch was rejected atomically because delete/add targeted the same file in one patch; split into sequential deletion and creation, with no live effect.

## PB-16-03 — Retention refinement and visual review

- UTC: 2026-10-14T02:31:00Z (work interval).
- Actor: Codex; reference PB-16-01.
- Confirmed native JavaScript schema defaults assign a server timestamp once and preserve a pre-existing timestamp across later POSTs. Use an integer expiresAt default equal to server Date.now() + 432000000; clients cannot provide that field in the accepted submission grammar.
- Plan refinement: expire leaderboard results from the authoritative deadline in live rankings, cached/offline standings, high-score qualification and sharing. Clean expired rows using an exact, guarded anonymous DELETE selector; reject broader selectors and future cutoffs. Make cleanup automatic on fetch and while open, with retries through subsequent refreshes. Native idle timers are unavailable; physically stored rows can remain until an online visitor returns.
- Provider attempts: direct Sessel PUT accepts Instance/Map rather than constructed Element; direct DELETE requires Instance/path rather than Element; path queries are not interpreted as selector operations. A native read processor/outbound cleanup attempt exceeded the provider request budget and was removed from the implementation. Numeric meta comparisons require :value-less-than rather than :less-than. Continue validating the final guard on an isolated resource before production migration.
- Visual review: rendered all sixteen world scenes in the local Three.js fixture and regenerated their 800×420 previews. Reviewed Garden, Archive, Citadel, Caverns, Dunes, Nexus and both record scenes in screenshots. Simplified champion orbit rings to keep the trophy readable. Initial localhost preview inherited the previous task's service-worker cache; moved this preview to a fresh loopback port. No production state was affected.
- Compatibility: repaired a missing switch layout in Nexus phase one; preserve the release-day Daily world choice, enabling the expanded daily pool at 2026-10-15 00:00 UTC. Update existing test bounds/scene paths to the expanded model without running a broad suite.
- Files: tools/retention-rules.mjs, tools/build-data.mjs, tools/remote.mjs, public/leaderboard.js, app.js, levels.js, champion.js, scores.html, worlds.html, public/assets/world-preview-01.png through -16.png; existing engine/media/brick-label test sources. Final hashes and diff reconciliation pending.

## PB-16-04 — Final provider and release checks

- UTC: 2026-10-14T02:45:54Z; actor Codex; reference PB-16-01.
- Supersedes the failed processor attempt in PB-16-03: the native GET processor plus same-host HttpRequest DELETE now works. First read returned an artificial expired row; the next read contained only the fresh row, without a client DELETE. Quoted numeric arguments are required by the selector parser. Future-cutoff and blanket-delete attempts returned 403.
- The isolated final production-rule copy accepted a 1,000,000-point world-16 run (206), assigned its server expiry once, and rejected a client-provided expiry (422). No artificial entry was posted to the real leaderboard.
- Manual browser review confirmed Citadel advances to Sunken Archive and Nexus ends Adventure with the separate champion celebration and results. All sixteen scene previews were captured, and phone/reduced-motion typography was reviewed. Syntax checks and deterministic PWA consistency passed. No broad automated test suite was run for this expansion.
- Release candidate: 27244bdbe305705f99d6; 62 cached assets; 2,233,626 bytes. New assets remain local and offline-capable. Documentation corrections cover sixteen music tracks, both multi-formation worlds and all preview assets.
- Next: migrate existing scores with If-Match and row-ID preservation, publish static assets/worker, remove disposable provider resources, reconcile Git source hashes and reviewable patch, and verify live release.

## PB-16-05 — Published release and reconciliation

- UTC: 2026-10-14T02:49:37.887Z (evidence generation timestamp); actor Codex; reference PB-16-01.
- Published release 27244bdbe305705f99d6: 64 static files uploaded and read back; 62 offline assets, 2,233,626 bytes. The publisher excluded the live score store and uploaded the service worker last.
- Score migration: 63 previous run IDs preserved, 63 rows with expiry deadlines; 12 undated legacy rows received the documented migration window. Verified against owner-side before/after backups. Initial local inventory accidentally matched the validation grammar's literal li tag; scoping the comparison to the score container resolved that reporting error (no provider change).
- Removed all six disposable provider probe resources (204 each). Production scores contain no probe submissions.
- Live browser: Update game moved an existing eight-world release to the sixteen-world release, retained the saved Adventure and personal best, and displayed Ready to play offline / all sixteen worlds saved. World selection lists all sixteen worlds with their new scene artwork. Screenshot: ignored test-results/sixteen-worlds-live.png.
- Reconciliation: only scoped game files copied to the publication checkout; package manifest/lock and unrelated workspace changes retained. Reviewable source patch and SHA-256 inventory accompany this entry. Git whitespace review reports only two harmless added trailing blank lines (champion module and existing engine test source); no runtime effect. No full automated suite was executed.
- Retention limit remains explicit: ranking lifetime is at most five days; native physical cleanup runs on subsequent online access, not an idle-site timer. Existing dated rows retain their original submission-based deadlines.
