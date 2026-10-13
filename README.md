# Prism Breaker

![Prism Breaker](public/assets/og-prism-breaker.jpg)

A colorful Three.js brick-breaker game built on Pagelove. Eight 3D worlds, glowing powerups, cinematic endings, original synthesized music and shared high scores.

**[Play the game](https://sane-guild-8399.onpagelove.com/)**

## Features

- Eight themed worlds, moving formations, armored and explosive bricks, switches, barriers, portals and a three-stage finale.
- Campaign, individual-world practice and a deterministic Daily Challenge shared by UTC date.
- Wide, multiball, sticky, laser, piercing, slow motion, shield and extra-life powerups.
- Sticky balls hold their impact positions while the paddle moves. Wide stacks with sticky or laser; when wide expires, unsupported held balls launch automatically.
- Cinematic world transitions, a dedicated daily completion scene, and distinct Adventure and Daily Challenge top-score celebrations.
- Eight synthesized level soundtracks and two victory arrangements, with separate music/effects controls and mute.
- Mouse, keyboard and touch input; fullscreen, pause, reduced motion/effects and light/dark/system interface themes.
- Local campaign checkpoints and personal bests. Shared Pagelove leaderboards display the leading player's name and score during play.
- Daily rankings roll over at 00:00 UTC and show score ages in minutes. Previous daily scores stay outside the active board.
- Favicon variants, touch icons, Open Graph/Twitter metadata and landscape/square share artwork.

All runtime assets are bundled locally. The game calls its Pagelove host for structured world definitions and shared scores; it uses no external runtime service or CDN.

## Run locally

Use Node.js 20.9 or newer:

```sh
git clone https://github.com/wesley83/prism-breaker.git
cd prism-breaker
node tools/serve.mjs
```

Open **http://127.0.0.1:4173**. No dependency install or build is needed to play: `public/` contains the complete deployable site and vendored Three.js.

The preview serves files locally; shared-score submission requires a Pagelove host. `public/scores.html` is an empty score template with platform rules, not a copy of the live leaderboard.

## Controls

| Action | Keyboard | Mouse / touch |
| --- | --- | --- |
| Move paddle | Left/right arrows or A/D | Move mouse or drag |
| Launch held balls | Space | Click/tap arena |
| Pause | P or Escape | Pause button |
| Skip a cinematic | Space or Enter | Continue/claim button |

## Project layout

| Directory | Contents |
| --- | --- |
| `public/` | Game, physics, Three.js scenes, sound synthesis, UI, metadata and hosted assets |
| `public/vendor/` | Three.js runtime and license |
| `public/worlds.html` | Pagelove structured world definitions |
| `public/scores.html` | Pagelove score schema, shape constraints, authorization and validation trigger |
| `artwork/` | Original generated poster images, prompts and export notes |
| `tools/` | Local server, asset builders, preview fixtures and Pagelove publisher |
| `tests/` | Existing engine, music-data and camera checks |

## Development

Optional asset rebuilds use Bun:

```sh
bun install
node tools/build-icons.mjs
node tools/build-fx.mjs
node tools/build-share-assets.mjs
```

`BUN_BIN` can point to a Bun executable outside PATH. `PRISM_IMAGE_MODULES` can select a different directory containing `package.json` and Sharp in `node_modules`. These variables are only used by development tools.

To regenerate the bundled world catalog and empty score template:

```sh
node tools/build-data.mjs
```

**Do not upload that empty score template over an existing live board.**

Existing checks can be run with:

```sh
node --test tests/*.test.mjs
```

Local-only preview controls can be generated with `node tools/make-qa.mjs`, then extended with `node tools/media-qa.mjs` or `node tools/record-preview.mjs` and `node tools/gameplay-preview.mjs`. Generated fixtures live under ignored `test-results/` and are never deployed.

## Pagelove hosting

The deployed game uses `https://sane-guild-8399.onpagelove.com/`. `tools/remote.mjs` pins this host and its corresponding WebDAV authoring endpoint. Publishing requires the host owner's credential, which is not included in this repository.

The publisher accepts JSON through hidden stdin, holds the key in process memory, verifies the authoring host and reads deployed files back. Normal deployment excludes `scores.html`, preserving live scores. The entry page uploads last. Backups, credentials, local previews and deployment receipts are excluded from Git.

To adapt the game to another Pagelove host, update the host URLs in the publisher, entry-page social metadata, score record/schema type and score rules. Accountless scores are public and self-reported; the leaderboard is not an authoritative anti-cheat service. Daily dates use UTC. Older scores without recorded submission times display an em dash for age.

## World scene previews

The world chooser uses still images captured from the game's Three.js scenes, with neutral card borders and a Current badge for the active world. All eight previews together are approximately 183 KiB and load when the chooser is opened.

To refresh them, copy `tools/world-preview.html` to `test-results/fixture/world-preview.html`, run `node tools/serve.mjs`, and open `http://127.0.0.1:4173/__qa/world-preview.html`. Select each world and capture only its 800-by-420 canvas as `public/assets/world-preview-01.png` through `world-preview-08.png`. The capture page uses a fixed seed and reduced motion for reproducible scenery. It is a development tool and is not deployed.

## Credits

- [Three.js](https://threejs.org/) — [MIT license](public/vendor/THREE-LICENSE.txt).
- Space Grotesk — [font license](public/assets/FONT-LICENSE.txt).
- [Tabler icons](https://tabler.io/icons) — [MIT license](public/assets/ICON-LICENSE.txt).
- Social artwork was made with built-in imagegen. Original images and prompts are in [artwork/README.md](artwork/README.md); the favicon is editable native SVG.
