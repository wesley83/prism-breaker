# Mastery, strategy and encounters

This implementation covers engagement recommendations 1, 2, 3, 5, 6, 7 and 8. Adventure, Daily Challenge and Practice remain the game modes. The proposed short-session / three-world mode is deliberately excluded.

## Authoring and build

[`public/engagement.html`](public/engagement.html) is the authoritative document. Its microdata contains the sixteen world goals, power choices, pacing periods, core/generator references, portal prerequisites and cosmetic unlock criteria. [`tools/build-engagement.mjs`](tools/build-engagement.mjs) checks them against the world catalog and actual formations and generates `engagement-data.js`. Do not edit that projection.

World geometry remains in the existing world HTML. The workshop's imported/edited worlds and previews do not inherit official encounters: a changed layout could remove a required generator or portal. Official Practice in the mastery collection uses the same bundled definitions as Adventure and Daily. The original World chooser retains shared workshop Practice.

Run `bun run build` after authoring. The official ruleset fingerprint includes the engagement document revision, so scores created with changed rules stay out of incompatible rankings. The same source build supplies all offline assets. No external service, new account or privileged application-write grant is involved.

## Implemented features

| Recommendation | Behavior |
| --- | --- |
| 1: mastery goals | Restored, Swift, Flawless and Skilled are four independent medals per world. World results suggest an attainable next objective and retain personal clear-time and score records. |
| 2: power strategies | Each formation can offer one paired drop choice after eight bricks are destroyed, while at least seven remain. Collecting one removes the other. Wide + Sticky supports aimed returns; Multiball + Pierce deals a second armor hit; Laser extends explosive pulses from 2.65 to 3.5 units. |
| 3: board endings | With at most three bricks left, twelve active seconds without a destruction earn one Precision catch. Arm it, catch a ball on the paddle, choose its launch direction and release. This never automatically removes bricks or bypasses core prerequisites. Combo milestones use restrained sound, existing bounded particles and readable text. |
| 5: encounters | Citadel's final formation has two generators protecting a core. Thunder Spire requires its two switches, then exposes the core for four seconds in each nine-second cycle, with a two-second warning. Nexus's three formations progress from switches to switches plus portal journeys. Gold rings mark generators; protected core rings are neutral, exposed core rings mint. |
| 6: reachable competition | The score chase selects the next higher loaded top-25 entry, retaining the overall leader display. Local world records provide closer goals. Result sharing can encode an official world, seed, ruleset, score target and clear time into a Practice challenge link. Invalid or outdated rules are explained instead of silently loading a different challenge. |
| 7: pacing | Authored peak/recovery periods slow moving barriers to half clock rate during recovery and use the quieter music arrangement. Ball speed is unchanged by these periods. Optional local observations record clear/tail time, entry lives and life losses; they support later balance decisions without changing extra-life thresholds prematurely. |
| 8: cosmetic rewards | Earn Aurora Alloy at six medals, Solar Gold at 24, Midnight Alloy at sixteen restored worlds, Comet Wake at four Swift medals and Golden Wake at forty medals. Restoring a world reveals its artwork and soundtrack in the collection. |

## Controls and presentation

- Sticky and Precision catches retain their original landing position. A direction slider and a five-unit guide show the chosen launch direction; Q/E adjusts it in five-degree steps. Space, the existing Launch button or an arena tap releases the held ball. The existing wide-paddle shrink rule still releases catches outside the new paddle edge.
- Strategy and encounter instructions sit outside the ordinary arena. Phone/fullscreen layouts reserve separate space for them and the aiming controls. No animation-pause buttons or decorative northeast arrows were added.
- Cosmetic paddle finishes preserve dimensions and physics. Classic mode retains its original paddle artwork. Every ball keeps a white center; trails use a fixed pool of eighteen faint sprites for one ball and disappear with reduced motion or fewer effects.
- Encounter rings are bounded to eight instances. The aiming helper uses one two-point line. Existing particle budgets remain in force; core effects do not add an unbounded particle emitter or per-brick bloom pass.

## Progress and compatibility

`prism.mastery` stores medals, revision-specific world records and optional recent observations. Cosmetic achievements survive later authored tuning; old timing/score records are not compared as current records after a document revision. Mastery export/import merges achievements without replacing newer earned medals. Storage failure is reported and an export remains available.

Old Adventure checkpoints continue with the previous rules and retain their original scoring revision. They do not acquire new power choices, encounter protections or mastery rewards midway through the run. No leaderboard records are deleted by this change; incompatible revisions are filtered as before, and the existing five-day expiry remains unchanged.

Shared world challenges use existing official Practice. A link contains `challenge`, `seed`, `ruleset`, optional `target` and `seconds`. The launcher validates these before offering play. New official runs use a reproducible launch sequence and seeded drop sequence; launch angles still vary from ball to ball. Practice scores are never submitted to the ranked boards. Challenge links do not grant publishing authority or include an owner key.

## Balance observations and limits

The Swift thresholds, skill objectives, encounter openings and recovery periods are initial authored tuning, not results from human playtests. They should be revised after observing actual beginners and experienced players. No retention or enjoyment increase is claimed from implementation alone.

Save local play notes is opt-in and defaults off. At most sixty world observations are retained. Explicit result feedback retains at most thirty choices (Satisfying, Too difficult, Slow ending). Export play notes includes these observations and feedback without player names, external analytics IDs or network delivery. Closing a collection stops its soundtrack preview.

Automated behavioral tests, sustained performance acceptance, physical phone checks, enjoyment studies and a production deployment are separate from this implementation's generation/parse/source review. The previous release's browser receipt does not validate these changed runtime files.
