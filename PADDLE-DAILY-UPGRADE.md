> Historical record: Restored from the authoring copy on October 15, 2026 UTC. Statements below describe that earlier release and its original verification limits; later changes supersede behavior, world counts and retention. See [RETROSPECTIVE.md](RETROSPECTIVE.md) and [FOLLOW-UP-REVIEW-RESULTS.md](FOLLOW-UP-REVIEW-RESULTS.md) for subsequent findings. Original evidence is retained as recorded.

# Sticky catches, Daily Challenge endings and victory music

## Paddle behavior

- Each sticky catch records the ball's local horizontal offset, contact height and upward rebound direction. Holding follows paddle movement without centering the ball; manual launch preserves the catch position and direction.
- Wide now stacks with sticky or laser. Sticky and laser remain alternatives.
- Effect expiry is applied before calculating the paddle width. A held ball outside the reduced half-width launches automatically; supported held balls remain attached. This applies independently to each ball, including catches on either edge. Pausing still freezes effect timers.
- Paddle width changes clamp the paddle to the arena bounds. Paddle collision positions use the crossing point at the top surface rather than the final position of the simulation step.

## Daily endings

- Every completed Daily Challenge uses a twelve-second orbital-clock sequence, with 24 illuminated hour markers, a moving hand, a central prism, a star field and the UTC challenge date. It replaces the level's Adventure cinematic in daily mode.
- A Daily Challenge top score receives a separate eleven-second golden solar-crown sequence. It uses its own geometry, palette and copy, independently of the Adventure trophy scene.
- Camera movement, particles and reveal timing use elapsed scene time. Reduced motion uses static compositions and four-second scenes; fewer effects reduces particles and bypasses bloom.

## Victory soundtracks

- Adventure: **Every Color, A Crown** — a major-key anthem with brass-like synthesized tones, choir and drums.
- Daily Challenge: **Crown of the Day** — bells, bright synths and celebratory beats.
- Confirming a top finish switches the scheduler to the appropriate victory arrangement, stopping the level track and resetting the musical sequence. Music continues on the record result/score form. Other dialogs and hidden tabs pause it; existing music volume and mute controls still apply. Starting another run returns to that level's track.
- Positive top scores in completed or ended runs qualify, including ties. Practice and previous-day Daily Challenge scores do not qualify for the current board. Shared rankings are fetched before awarding the celebration.

## Browser review

The local preview exercised actual engine collisions with three sticky catches at offsets +1.05, +2.10 and -2.10 on a 4.90-wide paddle. Moving the paddle preserved those offsets. Expiring wide reduced it to 3.30, leaving the +1.05 ball held and launching both outer balls. The normal daily clock and daily record crown rendered separately without browser warnings/errors. The record music scheduler showed victory:daily; Adventure Settings showed its distinct victory track. Preview code and sample records are outside public/.

No automated tests were added or run for this release. Speaker/headphone listening and physical-phone performance remain unmeasured.

A 390-pixel iframe also displayed the Daily Challenge record scene and its reduced-motion/fewer-effects variant, with matching document and scroll widths of 390. The existing powerup assertion was updated to reflect independent width; the suite was not run.

Published October 13, 2026 at 12:49:37 UTC. All 25 public files passed authenticated read-back (HTML normalization allowed). The live game loaded without browser warnings/errors and its help panel displayed the new sticky positioning and compatible wide behavior. Live scores were excluded from this deployment. See deployment.json for the hashes and .private/backup/pre-paddle-daily-* for prior source snapshots.
