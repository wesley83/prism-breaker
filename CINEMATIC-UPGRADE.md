> Historical record: Restored from the authoring copy on October 15, 2026 UTC. Statements below describe that earlier release and its original verification limits; later changes supersede behavior, world counts and retention. See [RETROSPECTIVE.md](RETROSPECTIVE.md) and [FOLLOW-UP-REVIEW-RESULTS.md](FOLLOW-UP-REVIEW-RESULTS.md) for subsequent findings. Original evidence is retained as recorded.

# Cinematic, music and powerup upgrade

## Implemented

Each world now has a 13–17 second camera sequence with its own path, field-of-view changes and architecture. Story captions appear after the visual reveal; the next/skip control remains available throughout.

| World | Cinematic setting | Soundtrack |
| --- | --- | --- |
| Prism Garden | Trees and a nested prism portal | Glasswing — bright plucked synths |
| Cloud Carnival | Cloud clusters and carousel rings | Cloud Waltz — carousel bells in three |
| Electric City | Neon towers and light lanes | Afterimage Avenue — driving neon electro |
| Crystal Caverns | A corridor of glowing crystal formations | Beneath the Glass — echoing crystal bells |
| Ember Foundry | Rotating forge gears and molten channels | Molten Engine — industrial pulse and metal |
| Frost Observatory | An astrolabe and crystalline pillars | Northern Lens — slow celestial ambience |
| Cosmic Reef | Coral rings and a curved cosmic tunnel | Tidal Orbit — shuffled cosmic marimba |
| Prism Citadel | Towers and eight assembling satellites | Heart of the Prism — layered cinematic finale |

Physical prism materials use clearcoat and iridescence. Bloom, soft light beams, orbiting fragments, dust, a vignette and subtle chromatic separation add depth. All camera and cinematic movement comes from elapsed scene time.

The eight powerups use distinct faceted geometry, bright inner cores, animated orbit rings, transparent halos and short trails. Symbols remain camera-facing for readability.

Music uses Web Audio synthesis: distinct melodies, harmony, rhythm and instrument combinations per world, stereo placement, reverb and a limiter. Playback starts after a user gesture. Music and effects retain independent controls, and music pauses when the game pauses, a dialog opens or the tab is hidden. No external music service, asset CDN or runtime dependency was added.

Reduced motion uses a static camera/composition with a four-second transition and immediate captions. Fewer visual effects reduces particles/trails and bypasses bloom. Portrait framing adjusts the camera distance and lateral travel.

## Checks

- Twelve automated checks pass: nine existing engine checks plus soundtrack uniqueness/event bounds, eight camera-path validity checks at several aspect ratios, and stable reduced-motion framing.
- All eight cinematic worlds rendered in the browser without warnings or errors.
- Each soundtrack rendered through the actual Web Audio graph into a 14-second stereo offline preview. Measured peaks were 0.118–0.159; none clipped.
- A 390-pixel-wide iframe rendered the portrait cinematic with matching document/scroll widths of 390. Settings and the cinematic skip/result transition worked at that width.
- Powerup preview verified faceted bodies and halos both with bloom and with fewer effects enabled.
- QA controls and audio preview pages are outside the deployable public directory. Deployment preserves the live score resource.

Physical-phone GPU performance and subjective listening on speakers/headphones remain unmeasured.

## Release evidence

Published October 13, 2026 at 12:01:49 UTC to the supplied Pagelove host. All 20 deployed files passed authenticated read-back; binary and JavaScript/CSS files matched their local bytes. The existing score resource was excluded from deployment and remained readable afterward. The live game loaded without browser warnings/errors; Settings displayed Glasswing in Prism Garden and Molten Engine after entering Ember Foundry practice. See `deployment.json` for the receipt and hashes. Local cinematic screenshots are under ignored `test-results/`.
