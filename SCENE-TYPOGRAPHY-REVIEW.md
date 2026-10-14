# Scene typography review

Reviewed October 13, 2026.

## Findings and changes

- Story text was 12–13px and victory messages fell to 11px on phones. They are now 16px on desktop and 15px on phones, with comfortable line spacing.
- Captions could cross bright prisms, beams and particles. All cinematic text now sits on a consistent dark backing, independent of the interface theme and world colors.
- Titles now use the existing locally hosted Space Grotesk font at weight 700: up to 52px for world captions and 46px for victory headings, scaling to about 29px at a 390px phone width.
- Victory scores use gold, tabular figures, a separate points label, and sizes up to 76px on desktop and 64px on phones.
- Next-world and save actions have clearer labels and larger type. Record result dialogs also use larger descriptions, headings and score figures.
- World captions become fully visible at 40% of the scene rather than 66%; daily completion captions become visible at 32% rather than 44%. Reduced-motion cut scenes and victories allow nine seconds of reading time rather than four; players can still continue sooner.

## Reviewed states

Each of these fourteen scene states was viewed at desktop and 390px phone layouts, including the bright full-effects backgrounds. Caption boxes stayed inside the arena and had no horizontal overflow.

| Scene | Desktop | Phone |
|---|---|---|
| Prism Garden completion | Reviewed | Reviewed |
| Cloud Carnival completion | Reviewed | Reviewed |
| Electric City completion | Reviewed | Reviewed |
| Crystal Caverns completion | Reviewed | Reviewed |
| Ember Foundry completion | Reviewed | Reviewed |
| Frost Observatory completion | Reviewed | Reviewed |
| Cosmic Reef completion | Reviewed | Reviewed |
| Prism Citadel completion | Reviewed | Reviewed |
| Daily Challenge completion | Reviewed | Reviewed |
| Adventure top score | Reviewed | Reviewed |
| Adventure tied top score | Reviewed | Reviewed |
| Adventure record before completion | Reviewed | Reviewed |
| Daily top score | Reviewed | Reviewed |
| Daily tied top score | Reviewed | Reviewed |

The record result dialog was also reviewed on desktop and phones. Scene styles remain dark and readable when the surrounding interface uses its light theme.

Calculated contrast at full caption opacity, even over a pure white rendered pixel: body text approximately 15:1, titles 17:1, and gold scores 14:1. The save button's text is approximately 12.7:1 against its gold background. These are color calculations, not a claim about every intermediate fade frame.

## Reproduce the visual review

Run `bun tools/make-qa.mjs`, then `bun tools/scene-type-preview.mjs`, then `bun tools/serve.mjs`. Open `http://127.0.0.1:4173/__qa/scene-type.html` or `/__qa/scene-type-mobile.html`. The visible selectors freeze the production scenes for review, including tie and victory outcomes. Generated pages and screenshots stay under ignored `test-results/`; synthetic scores are not posted to the live leaderboard.
