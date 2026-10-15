# Paddle collision follow-up

Reviewed October 15, 2026 UTC after another player reported a ball passing through the paddle.

## What the earlier fix missed

Two real failures were reproduced in the existing engine:

1. **The lower half was excluded.** The previous sweep immediately rejected a descending ball whose center was below the paddle's center. A ball has a radius, and the paddle has thickness: they can still visibly overlap in that position. Moving the paddle into the ball's lower-side path could therefore pass through it without a bounce. An earlier regression test explicitly expected this contact to miss, preserving the faulty assumption.
2. **The endcaps were taller than the collision surface.** Physics used a half-height of 0.17. The solid Three.js endcap geometry reaches approximately 0.208. A ball touching a raised endcap could be missed when the paddle moved away before the ball reached the lower physics plane.

The reporting player's exact device, game release and trajectory were not available, so these reproductions establish matching defects rather than the precise history of that session. An installed copy retaining the older engine can continue to show the old behavior until updated.

## Correction

The relative-motion sweep now covers the paddle's full solid height, expanded by the ball radius. A shared physics half-height of 0.21 conservatively covers the existing solid endcaps; both classic and crystal appearances use the same gameplay envelope. Decorative glow is not treated as physical paddle area.

Descending side contacts are returned above the paddle, consistent with the existing arcade bounce. Upward-moving balls remain unaffected. A ball already entirely below the paddle and its radius is still a miss. The conservative rectangular collision envelope is intentionally forgiving near corners; this is not an exact curved-surface simulation.

Sticky keeps the impact offset, including a lower-side catch. Wide expiry still launches a held ball whose support disappears. Input smoothing, rendering, the fixed 120 Hz simulation, saved-score rules and world definitions were not redesigned for this fix.

The engine import version was bumped in both the game and workshop; the workshop bootstrap and PWA assets were regenerated so prepared clients can receive the correction through Update game.

## Evidence

- Four new regression groups failed against the old implementation, including measured Three.js mesh bounds and an independent circle-to-rectangle distance calculation. All pass after correction.
- The existing below-center test was corrected to require a miss only after the ball is clear of the entire paddle. Genuine misses, upward balls, both movement directions, high speeds, Slow, multiball and prior Sticky/Wide behavior remain covered.
- Additional coverage samples **4,000 seeded diagonal trajectories**, plus a 192-configuration matrix across paddle widths, Slow, movement directions, vertical positions and time steps. These independently verify sampled solid contacts and preserve fully departed misses. The straight-line oracle deliberately excludes trajectories that hit a side wall during that step; existing wall/corner tests remain applicable.
- A browser fixture loads the actual pre-fix engine from commit `43d543f` and the revised engine with identical inputs. Both lower-side and endcap cases show **MISSED before / CAUGHT after**. The drawing is a flat diagnostic view; solid Three.js bounds are checked separately by the automated suite.
- The complete suite passes **136 tests across 13 files**, including all sixteen worlds and the collision bot. PWA build and diff checks pass. Production-source release: `a998edcd3009a53d6733`, 70 cached assets / 2,416,776 bytes.

Run the local reproduction with:

```sh
bun tools/paddle-replay.mjs
# Open http://127.0.0.1:4176/; no scores or production resources are written.
```

See [the lower-side comparison](audit/2026-10-15-paddle-lower-replay.png), [endcap comparison](audit/2026-10-15-paddle-endcap-replay.png), [browser observations](audit/2026-10-15-paddle-browser.json), [test output](audit/2026-10-15-paddle-tests.txt) and [audit/release record](audit/2026-10-15-paddle-followup.md). Physical phone testing and the reporting player's exact case remain unverified. This review does not claim every possible collision defect has been eliminated.
