# Prism Breaker scoring

These are the current rules in `public/engine.js` and `public/leaderboard.js`. Adventure, Daily Challenge and Practice use the same point calculation. Practice scores are not submitted or included in personal bests.

## Brick points and combos

Only destroying a brick awards points. The destruction increments the combo before its points are calculated:

`brick points = 100 × min(5, 1 + floor(combo / 6))`

| Brick destroyed since the last paddle contact | Multiplier | Points per brick |
|---|---|---|
| 1–5 | ×1 | 100 |
| 6–11 | ×2 | 200 |
| 12–17 | ×3 | 300 |
| 18–23 | ×4 | 400 |
| 24 onward | ×5 | 500 |

The combo is shared by all balls, laser shots and explosion chains. Any ball contacting the paddle resets it, including a Sticky paddle catch. Losing the last ball, starting a new world or starting another Citadel formation also resets it. Walls, barriers, portals and Safety shield bounces do not reset it.

Armored bricks award no points for damage before destruction. Their final hit earns the normal combo award. An explosion applies one hit to each nearby brick; every brick actually destroyed earns its normal combo points. Destroying a switch earns normal brick points; opening its gate adds no points.

For example, a 12-brick streak earns `5 × 100 + 6 × 200 + 1 × 300 = 2,000` points. Twelve separate one-brick streaks earn `12 × 100 = 1,200` points.

## Clearing a board

`clear bonus = 750 + 150 × lives remaining`

| Lives remaining when the bonus is calculated | Clear bonus |
|---|---|
| 1 | 900 |
| 2 | 1,050 |
| 3 | 1,200 |
| 4 | 1,350 |
| 9 (maximum) | 2,100 |

Prism Citadel has three formations. The first two award 500 points each when cleared. Its final formation awards the normal clear bonus. There is no additional whole-adventure completion bonus. Clear bonuses are not multiplied by the combo.

Every 12,000 points awards an extra life, up to nine lives. Each Extra life pickup also adds one life up to that limit. Lives awarded by the clear bonus itself do not retroactively increase that bonus. Losing a life does not deduct points, but fewer lives reduce later clear bonuses.

## Power-ups

Collecting any power-up awards **zero points**. Power-ups affect score indirectly through brick destruction, combos or retained lives; none introduces a separate score multiplier.

| Power-up | Effect | How it can affect scoring |
|---|---|---|
| Wide paddle | 18 seconds; width increases from 3.3 to 4.9 units | Helps retain lives and their clear bonus. |
| Multiball | Adds two balls, up to six total | All balls build the same combo, but any paddle contact resets it. No life is lost until all balls are lost. |
| Sticky paddle | 16 seconds; holds the ball at its catch position for relaunch | Helps aim the next streak. Each catch resets the combo. |
| Laser paddle | 14 seconds; automatically fires pairs of shots | Destroyed bricks earn the same combo points as ball hits. |
| Piercing ball | 12 seconds; passes through bricks | Can destroy several bricks before another paddle contact, building the combo. |
| Slow motion | 14 seconds; ball movement slows to 67% | Helps retain lives. It does not change points per brick. |
| Safety shield | Bounces one missed ball back into play | Can preserve both a life and the current combo. |
| Extra life | Adds one life, up to nine | Each additional life retained at a normal board clear adds 150 to the clear bonus. |

Repeated timed pickups extend the remaining duration up to 1.5 times the base duration. Sticky and Laser replace one another; Wide can work alongside either. Timed effects count down during active play, including while Sticky holds a ball, and stop while paused. They are cleared on a new board or life loss.

## Speed and leaderboard ranking

**There is no time bonus.** Clearing a board in 40 seconds instead of 100 seconds awards the same points if brick streaks and lives remaining are identical. Faster destruction can help exploit a timed power-up, but elapsed time does not enter the point formula.

The leaderboard sorts by:

1. Highest score.
2. Furthest world reached, if scores tie.
3. Shortest active play time, if score and world both tie.

Time is measured across the run, rounded to whole seconds with a minimum of one second. Ready-to-launch time, pauses and cutscenes are excluded; holding a ball with Sticky during active play is included. Daily and Adventure have separate boards. The Daily board includes only its current UTC date.

## Personal best versus the shared leaderboard

“Your personal best … On this device” is one combined Adventure/Daily best saved under `prism.best` in this browser's local storage. It is independent of the leaderboard nickname, is not synced across browsers or devices, and is removed if that site's browser data is cleared. Saving a score to the shared Pagelove leaderboard is a separate operation.
