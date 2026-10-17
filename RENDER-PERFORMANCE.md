# Rendering performance

Active gameplay and the editor's play preview target 60 rendered frames per second in both effects modes. Physics still runs at 120 fixed updates per second. The start screen, paused play and modal backgrounds retain a 30 FPS drawing budget. Graphics quality no longer imposes a 30 FPS ceiling on touch devices.

## Derived GPU batches

World HTML and the live game model keep their existing authority. GPU slots are disposable addresses assigned to persistent brick IDs. Rendering never changes HP, scoring, physics, world documents, native brick events or saved-run identities.

- Crystal bodies share an instanced mesh, with individual dimensions and colors. Static matrices are uploaded only when positions, geometry, damage or appearance change.
- Facet edges share one instanced line draw. Numbers, explosive/switch symbols and progressive cracks use a padded 512×512 local atlas and two instanced quad batches. Numbers retain the shared legend artwork and distinct count colors. Destroyed bricks are hidden and their slots are reusable. Classic bodies/faces share instances too.
- The eighty-brick capacity follows the world validator. Empty, replaced and restored formations reset all render counts. Moving bricks update their own slots.
- Particles use one instanced draw and a preallocated pool: at most 192 active fragments, or 48 with fewer effects. Excess cosmetic fragments are omitted. Gameplay randomness and scoring remain separate.
- Gameplay scenery uses at most two geometry batches, with 46 objects in full effects or 24 in fewer effects. Reduced motion freezes scenery uploads.

The warmup prepares the actual instanced shader variants and the shared atlas. It avoids uploading the superseded individual marker/crack textures to the GPU. Power-up pools and their glowing sprites remain in use.

## Effects and resolution

Regular gameplay renders directly. Power-ups keep their local halo sprites, bright cores and rings. Full bloom, lens processing and cinematic fades run during cut scenes and their preparation; they no longer run throughout ordinary play. The fewer-effects crystal material uses standard lighting without clearcoat or environment sampling. Full effects retains the physical crystal material.

The initial scene pixel ratio is capped at 1.25 for full effects or 1 for fewer effects, and never exceeds the device ratio. The old full-effects pipeline rendered the scene through a postprocessing buffer capped at 1.15 and then presented it to a potentially larger canvas; comparing only the old canvas ratio overstates its scene resolution. Cinematic buffers now cap at 1 and follow adaptive reductions.

`RenderBudget` observes rendered-frame intervals and CPU submission time during active play. Sustained slow frames reduce resolution after a two-second window. Eight seconds of headroom permit a small increase. Quality never exceeds its selected ceiling; minimum ratios are 0.75 for full effects and 0.65 for fewer effects, bounded by the device ratio. Paused/hidden play and long interruptions do not count as evidence of GPU load. The controller accommodates the normal alternating 11/22 ms cadence when targeting 60 FPS on a 90 Hz screen.

Changing resolution resizes both scene and cinematic buffers while keeping CSS geometry, camera aspect and pointer coordinates consistent. GPU context recovery rewarms retained CPU data. The application HUD polls at most ten times per second during play and rebuilds life/effect markup only when those fields change. Launch and start-screen actions still call the HUD directly.

## Measurement and reproduction

From the Git checkout, run `bun tools/performance-lab.mjs`, `bun run build`, then `bun run serve`. Open `http://127.0.0.1:4173/__qa/performance.html`. The tool defaults to historical baseline `f06a58d81be1a0d4027a6b68ac82a07b9c7169b4`; `--baseline-ref <ref>` selects another reviewed revision. It derives a local baseline and visible comparison controls under ignored `test-results/fixture/`. It does not publish anything or submit scores.

Each comparison prepares its renderer, runs thirty warm frames, and measures 120 frames at the same 900×560 CSS canvas. Workloads include Dawn Nexus, twelve balls, eight power-ups and repeatable particle emission. The fewer-effects workload intentionally applies its smaller particle/scenery budgets. The lab renders once per browser animation callback to isolate rendering cost; it does not apply the old production phone FPS limiter. The actual application with visible diagnostics is available at `/__qa/performance-app.html`.

Initial desktop in-app-browser observations:

| Workload | Previous mean draws | Batched mean draws | Previous CPU mean | Batched CPU mean |
| --- | ---: | ---: | ---: | ---: |
| Crystals and scenery | 234 | 29 | 1.89 ms | 0.88 ms |
| Multiball, drops and fragments | 526.88 | 116 | 3.54 ms | 1.47 ms |
| Same emission workload, fewer effects | 448.13 | 84 | 2.85 ms | 1.17 ms |
| Same workload, classic artwork | 494.12 | 105 | 3.39 ms | 1.37 ms |

Both renderers reached approximately 59.9 FPS on that desktop. These short measurements demonstrate less draw submission work and more rendering headroom, not a measured phone FPS improvement. CPU submission time is not a GPU timer. The baseline and candidate have different effects/resolution policies by design. Do not generalize these values to all hardware, battery/thermal states, worlds or browser versions.

A subsequent desktop rerun measured 234 → 29 draws and 2.07 → 0.77 ms CPU mean for the quiet scene, and 525.09 → 116 draws and 3.44 → 1.37 ms for the full workload. The actual application, including its frame scheduler and physics, reported approximately 59.9 FPS with fewer effects enabled. Graphics context loss/restoration also completed successfully with full effects. These checks establish that the former software cap is removed on the checked desktop; physical phone acceptance remains separate. The final preparation also uploads the actual particle/atlas instance buffers before play, so a separate warmup mesh is not mistaken for warming the real buffers.

The lab also reviews all twenty official formations in both artwork styles and effects settings: eighty combinations. It renders initial geometry, an armor impact and complete removal, then checks for stale batches. Unit checks cover identity/position retention, damage, full-capacity replacement, unchanged static buffers, particle limits, scenery, frame scheduling and coordinated buffer sizing. Browser shader checks and visible artwork inspection supplement these checks; neither substitutes for physical phone acceptance.

Production exposes a local `Stage.performanceInfo()` snapshot for developer diagnostics. There is no performance telemetry service. See [the dated audit](audit/2026-10-17-render-performance.md), [benchmark observations](audit/2026-10-17-render-benchmarks.json), and [formation review](audit/2026-10-17-render-formations.json).
