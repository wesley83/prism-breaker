# Scoring, sharing and difficulty update

## Point rules

- A collected falling power-up adds 150 points, without a combo multiplier. Automatic milestone lives do not award pickup points.
- Each cleared board adds `max(0, 2000 - 10 * floor(active board seconds))` speed points, plus its existing clear bonus. Each Citadel formation earns its own speed award.
- Ready-to-launch time, pauses and cinematics are excluded. Sticky holding time is included. Losing a life does not reset the board timer.
- Checkpoints preserve board time and bonus totals. Existing checkpoints use saved board time when the new field is absent; existing scores are not recalculated.
- The arena displays the available speed award, pickup messages show +150, completion captions show clear/speed awards, and results show speed/pickup totals. `SCORING.md` and How to play describe the same rules.

## Sharing

The leaderboard provides Share leaderboard and Copy link actions. It uses the browser's native share API when available, clipboard copying, and a selectable URL when copying is unavailable. No external sharing service is called by the game. Links use `?leaderboard=campaign` or `?leaderboard=daily` and open that board directly. Daily links open the current UTC day's board.

## Worlds 3–6

| World | Small difficulty increase |
|---|---|
| Electric City | Two additional armored bricks; gates widen from 5 to 5.4 units. |
| Crystal Caverns | Two additional armored bricks. |
| Ember Foundry | Moving barriers widen from 4/3 to 4.3/3.3 units and move 10% faster. |
| Frost Observatory | Two additional armored bricks. |

All four worlds use 5% faster ball movement before the existing 21-unit speed cap. Other worlds keep their prior settings. Structured Pagelove level data is regenerated with `bun tools/build-data.mjs --worlds-only`, which leaves the score template untouched. Normal deployment excludes the live score resource.

## Interface copy

Personal-best, journey, checkpoint and preference copy omits device/storage qualifiers. Personal-best storage behavior remains unchanged.
