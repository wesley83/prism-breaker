# Game rendering performance

## Scope and plan

The user requested applying the FPS recommendations. Preserve the 120 Hz game simulation, collision code, document world sources and gameplay rules. Improve frame pacing, batch brick bodies/edges/labels/cracks and particles, batch gameplay scenery, simplify low-effects lighting, restrict bloom to cinematics, adapt drawing resolution under sustained load and reduce repeated HUD work.

Use bounded render data derived from the validated world/game model. Keep semantic brick events and the authoring documents independent of render batches. Test disappearance, damage stages, moving bricks, appearance switching and restoration as well as raw draw counts. Measure a reproducible local workload against the saved previous renderer. Desktop browser results do not establish physical phone GPU performance.

Run targeted meaningful tests and the existing full release gate. Follow the established commit, protected GitHub CI/merge and pinned-host deployment workflow; verify the resulting public package. No score/world/policy writes are needed for this release.

## Implemented

- Removed the low-effects 30 FPS gameplay cap; deadline-based 60 FPS scheduling retains fractional refresh time. Physics remains fixed at 120 Hz in the game and editor preview.
- Batched crystal/classic bodies, facet edges, camera-facing markers and cracks. The 512×512 padded atlas reuses the shared count colors and symbol/crack artwork. GPU slots retain a separate mapping to persistent document IDs, including replacement and removal.
- Batched and bounded fragments (192 full / 48 low), with reusable CPU data and the actual instance buffers uploaded before the first impact. Batched 46/24 scenery objects into at most two draws. Static brick transforms and reduced-motion scenery avoid repeated uploads.
- Gameplay now bypasses postprocessing and retains power-up glow sprites. Cinematic bloom remains. Fewer effects uses a standard crystal material without clearcoat/environment sampling.
- Coordinated adaptive scene/cinematic resolution. The quality controller ignores idle/hidden play, reduces after sustained load and recovers slowly. A 90 Hz pacing regression check prevents its normal 11/22 ms cadence from reducing quality unnecessarily.
- HUD polling at ten updates per second during play, with separate dirty checks for life/effect markup. Diagnostics and baseline comparison controls remain local; no external telemetry or product UI was added.
- Updated README and RENDER-PERFORMANCE.md. Added nine meaningful render regressions and a reproducible local lab tool. No collision, scoring, world, server-policy or leaderboard source changed.

## Local evidence

- Initial four-workload comparison is retained in render-benchmarks.json beside this audit. A subsequent rerun recorded 234 → 29 draws, 2.07 → 0.77 ms CPU mean for quiet play; 525.09 → 116 draws, 3.44 → 1.37 ms CPU mean for twelve balls, eight power-ups and fragments. CPU submission time is not GPU time. Both desktop runs reached approximately 59.9 browser frames/sec; these short runs do not establish physical-phone FPS.
- Eighty browser formation/style/effects combinations rendered initial geometry, an armor impact and complete removal. Repeated after the final real-buffer warmup; no captured shader errors. The historical/current comparison lab imports two Three.js copies and emits its expected one-time multiple-import warning; the actual game and editor checks captured no warnings/errors.
- The actual application with fewer effects reported 59.892 FPS, zero slow frames, pixel ratio 1 and approximately 0.67 ms CPU mean. A full-effects graphics-context loss paused play, restored successfully and allowed explicit resume; the subsequent active window reported 59.883 FPS and pixel ratio 1.25. These are desktop loopback checks with local preview scores, not production submissions or physical-device tests.
- Editor Dawn Nexus formation three launched and returned with the selected brick and formation retained. Screenshot retained. Final warmup cleanup additionally verifies that temporarily warmed slots disappear before gameplay.
- Full suite passed: 182 tests across 23 files. Latest targeted render checks passed nine tests after the final warmup changes. Required exact-source release gate and hosted CI remain part of the release below.
- Candidate: f040e06f64812c205108, 77 cached assets, 2,465,173 bytes. Source uses LF line endings; the gameplay ruleset remains ea3ef3d4e217bb394db6f5e3d9e73dd49512b01091ab39ec40cc740a3a3089dd.
- Limits: no Android/iOS hardware, thermal/battery trial, GPU timer or universal 60 FPS guarantee. Adaptive resolution is a bounded fallback, not evidence that every device can meet the target.

## Release verified

- UTC: 2026-10-17T18:23:42.152Z. PR https://github.com/wesley83/prism-breaker/pull/7 passed branch/PR CI and merged normally at 2026-10-17T18:18:39Z into main 7477b124f3c765fdaeb57cfa55b80dfdfc2b3c32. Merged-main Quality run 39057529784 also passed.
- Exact merged-source gate passed at 2026-10-17T18:19:00.236Z: 182 tests, PWA integrity and repository checks; digest a48687e5f7215514e78dc1357a0a685b739ff05223d6a6f0d22f7df295c89787.
- Pinned-host publisher authenticated console/DAV 200/207, published 86 files at 2026-10-17T18:20:29.925Z, conditionally promoted entries and exited. Release f040e06f64812c205108; 77 cached assets; 2,465,173 bytes. Runtime publication preserved score policies/data, hosted world definitions and prior release assets.
- Public readback at 2026-10-17T18:20:49.076Z passed all 77 asset checks, root release identity and fullscreen manifest. An existing be807e77f8a5dc2d2df7 browser client used Check for updates and Update game, then loaded f040e06f64812c205108. Offline readiness, checkpoint summary, personal best and settings were retained; no captured warnings/errors. A helper initially counted duplicate readiness text in a hidden installation dialog; the final receipt reads the actual offline-status element. No production run or score submission was needed.
- Runtime/performance documentation and evidence were mirrored to the authoring directory. Independent root README edits about the handbook/license were preserved with a selective performance-section update; those unrelated edits were not imported into this release.
- Live screenshots, deployment/gate/readback/browser receipts and hashes are retained. This evidence-only follow-up changes no runtime input and needs no second deployment. Physical-device and platform acceptance limitations remain as stated above.
