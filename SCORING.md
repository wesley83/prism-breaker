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

Prism Citadel has three formations. The first two award 500 clear points each. Its final formation awards the normal clear bonus. Each formation also earns its own speed bonus. There is no additional whole-adventure completion bonus. Clear and speed bonuses are not multiplied by the combo.

Every 12,000 points awards an extra life, up to nine lives. Each Extra life pickup also adds one life up to that limit. Lives awarded by the clear bonus itself do not retroactively increase that bonus. Losing a life does not deduct points, but fewer lives reduce later clear bonuses.

## Power-ups

Collecting any falling power-up awards **150 points**, even if the effect or life count is already at its limit. Pickup points are added directly and are not multiplied by the combo. Power-ups also affect score through brick destruction, combos or retained lives; none introduces a separate score multiplier. An automatic extra life earned at a 12,000-point milestone is not a pickup and awards no additional points.

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

## Speed bonuses and leaderboard ranking

Each cleared board earns a speed bonus:

`speed bonus = max(0, 2,000 − 10 × floor(active board seconds))`

| Active board time | Speed bonus |
|---|---|
| 40 seconds | 1,600 |
| 60 seconds | 1,400 |
| 100 seconds | 1,000 |
| 150 seconds | 500 |
| 200 seconds or longer | 0 |

The bonus falls by 10 points per completed active second, cannot become negative and is awarded once when that board is cleared. Every Citadel formation starts a new board timer and earns its own bonus. Losing a life does not reset the timer. Pauses, cutscenes and ready-to-launch time do not count; holding a ball with Sticky during active play does count. Saving and resuming preserves the board timer. Older checkpoints without this timer use their saved board time as a conservative fallback.

For example, the same brick score and three-life clear at 40 seconds earns 600 more points than at 100 seconds. Three pickups add another 450 points. The normal clear bonus is calculated before clear/speed awards grant any milestone extra lives.

The leaderboard sorts by:

1. Highest score.
2. Furthest world reached, if scores tie.
3. Shortest active play time, if score and world both tie.

Time is measured across the run, rounded to whole seconds with a minimum of one second. Ready-to-launch time, pauses and cutscenes are excluded; holding a ball with Sticky during active play is included. Daily and Adventure have separate boards. The Daily board includes only its current UTC date.

## Difficulty adjustment for worlds 3–6

Worlds 3–6 use 5% faster ball movement before the existing speed cap. Electric City, Crystal Caverns and Frost Observatory each add two two-hit armored bricks. Electric City's gates grow from 5 to 5.4 units wide. Ember Foundry's two moving barriers grow from 4/3 to 4.3/3.3 units and move 10% faster. Other worlds retain their existing difficulty settings.

## Personal best versus the shared leaderboard

Your personal best is one combined Adventure/Daily best saved under `prism.best` in local storage. The interface omits device/storage qualifiers. Saving a score to the shared Pagelove leaderboard is a separate operation; existing scores retain their originally earned totals.
