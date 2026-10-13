# Prism Breaker

![Prism Breaker](public/assets/og-prism-breaker.jpg)

A colorful brick-breaker game built with Three.js on [Pagelove](https://pagelove.com). Explore eight 3D worlds, catch glowing power-ups, watch cinematic transitions, and chase shared high scores.

**[Play the game](https://sane-guild-8399.onpagelove.com/)** · **[Public source](https://github.com/wesley83/prism-breaker)**

The browser runs the gameplay and creates the music and scorecards. Pagelove hosts the complete site and stores and validates shared scores through HTML resources. No separate application server, external runtime API, or CDN is required.

## Game features

- **Adventure:** eight themed worlds—Prism Garden, Cloud Carnival, Electric City, Crystal Caverns, Ember Foundry, Frost Observatory, Cosmic Reef and Prism Citadel—with a three-formation finale.
- **Daily Challenge:** one world selected from a UTC-date seed, with shared launch and power-up random sequences. Its active leaderboard rolls over at 00:00 UTC.
- **Practice:** play individual worlds. Practice scores stay out of the shared boards and personal best.
- **Brick mechanics:** armored, moving, explosive and switch bricks, gates, moving barriers and paired portals. Worlds 3–6 have a modest difficulty increase.
- **Eight power-ups:** wide paddle, multiball, sticky paddle, laser, piercing ball, slow motion, safety shield and extra life. Sticky catches hold at the impact position; a shrinking wide paddle releases catches beyond its new edge.
- **Fresh-ball variation:** new balls launch 8–18° left or right of vertical. Checkpoints preserve sequence progress, while sticky catches retain their rebound direction.
- **Cinematics:** unique scenes for each world, a dedicated Daily Challenge completion, and separate Adventure and Daily Challenge top-score celebrations and victory music.
- **Procedural audio:** eight original synthesized level soundtracks, two victory arrangements and sound effects, with separate volume controls and mute.
- **Shared records:** the current board leader's name and score appear during play. Adventure and Daily Challenge have separate top-25 rankings; the daily board displays minutes since submission.
- **Sharing:** leaderboard invitations and personal scorecards, native sharing where supported, complete-message copying, PNG downloads and QR codes. Android invitations combine message and link into one text body; daily dates use readable UTC labels.
- **Presentation and access:** responsive keyboard/mouse/touch controls, fullscreen, pause, reduced motion/effects, light/dark/system interface themes and readable cinematic captions.
- **Progress:** campaign checkpoints, personal best, preferences and the last entered nickname persist in browser storage.
- **Performance preparation:** power-up shaders, textures and glow effects prepare before play. Power-up objects are pooled and symbol textures reused.
- **Social artwork:** SVG/ICO/PNG favicons, touch icons, and landscape/square Open Graph and Twitter card images.

## Technology

Versions below come from the repository's dependency manifest and Bun lockfile.

| Technology | Use |
| --- | --- |
| HTML, CSS and vanilla JavaScript ES modules | Interface, dialogs, game state and responsive styling |
| Three.js **0.180.0** | WebGL 2 rendering of the 3D arena, physical materials, lights, particles, camera flights and world scenery |
| Three.js postprocessing | Bundled `EffectComposer`, `RenderPass`, `UnrealBloomPass`, `ShaderPass` and `OutputPass`; bloom, vignette, fades and cinematic color separation |
| Custom JavaScript physics | Ball/paddle/brick collisions in the arena’s 2D plane, power-ups and scoring; a fixed 120 Hz simulation driven by `requestAnimationFrame` |
| Web Audio API | Oscillators, envelopes, synthesized percussion, reverb and scheduled music; no downloaded music files |
| Canvas 2D and Blob/File APIs | Runtime scorecard images, glow/symbol textures and local PNG downloads |
| Web Share and Clipboard APIs | Native invitations and scorecards, copying, and manual fallbacks |
| qrcode-generator **2.0.4** | Locally bundled QR encoding for scorecards and desktop share previews |
| Space Grotesk and Tabler icons **3.49.0** | Bundled font and SVG icon sprite |
| Browser platform APIs | Pointer input, fullscreen, resize observation, preferences and local storage |
| Node.js | Local preview, publishing, asset utilities and existing `node:test` checks |
| Bun | Dependency installation and rebuilding the postprocessing bundle |
| Sharp **0.35.5** | Development-time poster conversion and favicon exports |
| Pagelove HTML resources and Sessel | Shared score persistence, schemas, shape rules, authorization and request validation |

All browser runtime code, fonts, icons, images, QR encoding and postprocessing files are included in `public/`. Installing development dependencies is optional when playing or serving the committed site.

## Pagelove features used

These are the platform capabilities wired into this game. The source for the score rules is [public/scores.html](public/scores.html); the client integration is in [public/app.js](public/app.js).

| Pagelove capability | Game feature / implementation |
| --- | --- |
| Site and asset hosting | Serves the game, vendored libraries, fonts, icons, world previews and social artwork from one host |
| CSS-selector resource reads | Reads the world catalog with `Range: selector=#worlds` and the score container with `Range: selector=#scores` |
| Mutable HTML resources / selector-scoped POST | Appends one structured run to `/scores.html` inside `#scores`, giving every visitor the same persistent leaderboard |
| HTML microdata | Represents each run as an `itemscope` record with `itemprop` fields for player, score, world, mode, challenge day, duration and submission time |
| Declarative authorization | Grants anonymous `POST` access specifically to the score container; no publishing credential is shipped to the browser |
| Shape constraints | Restricts score markup to the permitted `ul`, run `li`, and property `meta` structure |
| Typed schemas, cardinality and uniqueness | Defines required run properties, their types and a unique `runKey`; `submittedAt` is optional for compatibility with older records |
| Request triggers with Sessel | Rejects submissions that fail the exact payload grammar, nickname format or numeric limits with HTTP 422 |
| WebDAV authoring | Publishes owner-managed site files through the pinned DAV host; normal releases preserve the live score resource |
| ETags and conditional writes | The score-rule migration helper uses `If-Match` to update rules while preserving existing runs and avoiding stale overwrites |

A regular static file server can render the arena and its animations. Pagelove's persistent score appends and server-side validation provide the shared state used by this game.

### Data flow

1. The browser loads `public/index.html` and its same-origin modules/assets.
2. It requests the structured world catalog. Bundled level definitions remain available if that read fails.
3. Gameplay, collisions, music and score calculation happen in the browser.
4. When a player chooses **Save score**, the client posts one HTML run record to the score selector. Pagelove applies the authorization, shape, schema and trigger rules.
5. The client reads the shared records, filters by mode and UTC challenge day, and ranks the top 25.

Leaderboards refresh at run start, after submission, on focus/visibility changes, through the Refresh button, and periodically during visible play. Updates use HTTP requests; the game does not use a WebSocket or server-event subscription.

### Daily Challenge and score records

- A daily seed comes from the UTC date at run start. All players for that challenge get the same world and the same fresh-launch sequence. Power-up randomness uses a separate seeded generator.
- The client schedules a midnight rollover and checks the date when returning to the game. The host's HTTP `Date` header helps align its clock.
- **Rollover filters the active board to the new date.** Earlier daily entries remain in the score resource; no background cleanup job deletes them.
- A run crossing midnight keeps its original challenge day. It can be saved under that day, but does not appear on the new day's active board.
- Daily share links open the current daily leaderboard. Invitation text and PNG cards capture the record/date shown when the share preview opens.
- Scores, elapsed play time and `submittedAt` are supplied by the client. Nicknames are public, accountless labels. Older rows without submission time show an em dash for age.
- Rules accept scores from **0 to 500,000**, worlds **1–8**, durations **1–99,999 seconds**, and nicknames of **2–16 ASCII letters, numbers, spaces, dashes or underscores**. Practice submissions are excluded.
- Ranking orders by score descending, world reached descending, then elapsed active time ascending. A tied top score can qualify for a record celebration.

These rules validate record structure and ranges. Scores are self-reported; there is no authoritative replay verification or account identity. The client currently reads the full score container and applies the top-25 limit locally. Pagination, retention and additional anti-abuse measures would require further work as the board grows.

## Scoring

| Award | Calculation |
| --- | --- |
| Destroyed brick | `100 × min(5, 1 + floor(combo / 6))`; combo increments before the award |
| Collected falling power-up | 150 points, independent of the combo |
| Normal board clear | `750 + 150 × lives remaining` |
| First two Citadel formations | 500 clear points each |
| Speed bonus per cleared board / formation | `max(0, 2,000 − 10 × floor(active board seconds))` |
| Milestone extra life | Every 12,000 points, up to nine lives; no pickup points |

Any ball contacting the paddle resets the shared combo. Ready-to-launch time, pauses and cutscenes are excluded from active time; holding a sticky ball during play counts. Life loss preserves the board timer. Personal best combines Adventure and Daily Challenge; saving a named shared score is a separate action.

See [SCORING.md](SCORING.md) for streak examples, power-up durations, timing rules and difficulty changes.

## Run locally

Use Node.js 20.9 or newer:

```sh
git clone https://github.com/wesley83/prism-breaker.git
cd prism-breaker
node tools/serve.mjs
```

Open **http://127.0.0.1:4173**. No dependency install or build is required.

The preview supports `GET`/`HEAD` and serves the committed site and local preview fixtures. It does not emulate Pagelove's score writes or rule enforcement. `public/scores.html` is an empty template, so local play has no live community scores.

### Controls

| Action | Keyboard | Mouse / touch |
| --- | --- | --- |
| Move paddle | Left/right arrows or A/D | Move mouse or drag |
| Launch held balls | Space | Launch ball button or click/tap arena |
| Pause | P or Escape | Pause button |
| Skip a cinematic | Space or Enter | Next world / See your score button |

Audio starts after a player interaction. Cinematic keyboard skipping ignores repeated key events and has a short grace period. A checkpoint restores the remaining board with a held ball; pending completed-world cinematics play before progression.

## Source map

| Path | Responsibility |
| --- | --- |
| `public/app.js` | UI, game loop, checkpoints, score reads/submission, UTC rollover and share message models |
| `public/engine.js`, `public/levels.js` | Physics, points, powers, seeded randomness and eight world definitions |
| `public/scene.js`, `public/postprocessing.js` | Three.js rendering, power-up preparation/pooling and effects |
| `public/cinematics.js`, `public/cinematic-score.js` | World transition geometry and camera timing |
| `public/champion.js`, `public/daily-ending.js`, `public/daily-score.js` | Adventure record and Daily Challenge endings |
| `public/audio.js`, `public/music.js`, `public/victory-music.js` | Synthesized music and sound effects |
| `public/leaderboard.js`, `public/sharing.js` | Ranking, record eligibility, date formatting, share payloads, PNGs and QR codes |
| `public/worlds.html`, `public/scores.html` | Hosted world catalog and score store template with Pagelove rules |
| `public/vendor/`, `public/assets/` | Bundled libraries, licenses, font, icons and artwork |
| `artwork/` | Original generated poster images, prompts and export notes |
| `tools/` | Publisher, local server, asset builders and manual preview generators |
| `tests/` | Existing engine, music and cinematic camera checks |
| `AGENTS.md` | Interface conventions for future changes |

## Asset rebuilds and preview tools

Optional rebuilds in the public repository use Bun and the committed lockfile:

```sh
bun install --frozen-lockfile
node tools/build-icons.mjs
node tools/build-fx.mjs
node tools/build-qr.mjs
node tools/build-share-assets.mjs
```

`BUN_BIN` can select a Bun executable outside PATH. `PRISM_IMAGE_MODULES` can select a directory containing a `package.json` and Sharp installation for image exports. Asset builds use local dependencies; they do not add a runtime CDN dependency.

Regenerate just the world catalog with:

```sh
node tools/build-data.mjs --worlds-only
```

Running that tool without `--worlds-only` also regenerates an **empty score template**. Never replace an existing live leaderboard with it.

For local manual previews, generate `node tools/make-qa.mjs`, start the local server, and open `/__qa/index.html`. Other tools extend that fixture with music, cinematic, record, paddle or typography preview controls. Read the relevant upgrade notes below for their required order. Generated files stay under ignored `test-results/` and are outside the deployed `public/` tree.

For world thumbnails, copy `tools/world-preview.html` into `test-results/fixture/`, open `/__qa/world-preview.html`, select a world and capture its 800×420 canvas into `public/assets/world-preview-01.png` through `world-preview-08.png`. The preview uses a fixed seed and reduced motion for consistent scenery.

### Existing checks

When validating changes, the existing suites can be run with:

```sh
node --test tests/*.test.mjs
```

They cover seeded random generation, core collisions, multiball/lives, powers, gates/explosions, checkpoints, progression, synthesized arrangements and camera frames. The collision bot replenishes lives while checking world completion; it does not establish human difficulty balance. Test files do not provide exhaustive coverage of every later feature. This README update was based on source review; suites were not run for the documentation change.

## Deployment and maintenance

The publisher in `tools/remote.mjs` pins:

- Public game: `https://sane-guild-8399.onpagelove.com/`
- Owner authoring endpoint: `https://dav-sane-guild-8399.onpagelove.com/`

Publishing requires the host owner's credential. Start `node tools/remote.mjs` in an interactive terminal and wait for **Ready for hidden JSON input**. Authenticate through the publisher's hidden stdin `auth` operation. Keep the key out of command arguments, environment variables, files, source control and browser code. The publisher keeps it in process memory and checks that the authorized console identifies the expected DAV host.

After authentication, normal publishing uses `{"op":"deploy"}`; exit with `{"op":"quit"}`. Normal deployment:

1. Uploads runtime modules/assets, then `app.js`, then `index.html`.
2. **Excludes `scores.html`**, preserving community entries and their rules.
3. Reads uploaded files back and compares non-HTML bytes. Pagelove may normalize HTML.
4. Writes a non-secret release receipt to ignored `deployment.json`.

A fresh host needs its score template installed once. Only use the publisher's `initializeScores` option for deliberate initial setup on an empty host. On an existing host, score-rule updates need a record-preserving migration; the included `migrateScoreRules` helper backs up the live resource and uses its ETag with `If-Match` before replacement.

When switching hosts, update the publisher, entry-page canonical/social URLs, score type/schema, score grammar and `tools/build-data.mjs` together. Vocabulary IRIs such as `https://pagelove.org/Schema` identify platform rule types; they are separate from the game host and Pagelove website link.

Private backups, credentials, live score exports, generated preview files and deployment receipts are excluded from Git. The public score template stays empty. Source changes that affect cached runtime modules need version bumps at their importing modules and the entry page.

### Operational limits

- Gameplay requires WebGL 2 support. Reduced effects lowers rendering cost, but smoothness and audio behavior vary across hardware and browser settings.
- Native share destinations and their handling of text/files are controlled by the browser, OS and receiving app. Copy invitation and download remain fallbacks. Physical Android-to-Slack delivery is not established by desktop preview review.
- Progress and preferences use browser storage; clearing that storage removes them. The game has no accounts or cloud progress synchronization.
- Live score reads/submissions require the Pagelove host. Failed reads show recoverable UI states while gameplay can continue.

## Further documentation

- [SCORING.md](SCORING.md) — current point formulas, timing, combos, powers and ranking.
- [SHARING-UPGRADE.md](SHARING-UPGRADE.md) — platform-specific sharing, generated scorecards and readable dates.
- [LAUNCH-VARIATION.md](LAUNCH-VARIATION.md) — launch angles, seeded fairness and checkpoint behavior.
- [UI-PERFORMANCE-UPGRADE.md](UI-PERFORMANCE-UPGRADE.md) — cinematic alignment, scene progression and effect preparation.
- [CINEMATIC-UPGRADE.md](CINEMATIC-UPGRADE.md), [RECORD-UPGRADE.md](RECORD-UPGRADE.md), [PADDLE-DAILY-UPGRADE.md](PADDLE-DAILY-UPGRADE.md) — scene, music and paddle implementation notes.
- [DESIGN-REVIEW.md](DESIGN-REVIEW.md), [SCENE-TYPOGRAPHY-REVIEW.md](SCENE-TYPOGRAPHY-REVIEW.md) — design rationale and caption readability.
- [artwork/README.md](artwork/README.md) — poster generation, favicon sources and export dimensions.

Upgrade notes describe their release-time observations; they are not a current certification of every browser, device or leaderboard entry.

## Credits and licenses

- Three.js — [MIT license](public/vendor/THREE-LICENSE.txt).
- qrcode-generator — [MIT license](public/assets/QR-LICENSE.txt).
- Tabler icons — [MIT license](public/assets/ICON-LICENSE.txt).
- Space Grotesk — [SIL Open Font License](public/assets/FONT-LICENSE.txt).
- Poster artwork was created with built-in image generation; original images and prompts are in `artwork/`. The favicon is editable native SVG. Music and effects are synthesized by the game.

The repository currently has no top-level license declaration for the game source. Bundled third-party components retain the license notices linked above.
