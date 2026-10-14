# Prism Breaker

![Prism Breaker](public/assets/og-prism-breaker.jpg)

A colorful brick-breaker game built with Three.js on [Pagelove](https://pagelove.com). Explore sixteen 3D worlds, catch glowing power-ups, watch cinematic transitions, and chase shared high scores.

**[Play the game](https://sane-guild-8399.onpagelove.com/)** · **[Public source](https://github.com/wesley83/prism-breaker)**

The browser runs the gameplay and creates the music and scorecards. Native Pagelove routes and composed templates power the world editor; editable worlds are stored as HTML microdata. Pagelove hosts the complete site and stores and validates shared scores through HTML resources. No separate application server, external runtime API, or CDN is required.

## Game features

- **Adventure:** sixteen themed worlds and twenty formations. Prism Citadel is a three-formation midpoint; Dawn Nexus is the three-formation finale. Existing checkpoints can continue into the second half.
- **Daily Challenge:** one world selected from a UTC-date seed, with shared launch and power-up random sequences. Its active leaderboard rolls over at 00:00 UTC.
- **Practice:** play individual worlds, including shared edited HTML layouts and custom brick recipes. Practice scores stay out of the shared boards and personal best.
- **World workshop:** native `/editor/<worldname>` routes, inspectable HTML microdata, visual brick editing, undo/redo, local drafts, import/export, custom types and a Three.js play preview. Owner publishing uses ETags and preserves concurrent edits. See [WORLD-EDITOR.md](WORLD-EDITOR.md).
- **Brick mechanics:** armored, moving, explosive and switch bricks, gates, moving barriers and paired portals. Worlds 3–6 have a modest difficulty increase.
- **Brick labels:** armored bricks show their remaining hit count in distinct colors: cyan 3, gold 2, coral 1. Explosives use a filled star and switches an outlined diamond. How to play explains each type with matching visual examples.
- **Crystal artwork:** the stacked vector wordmark follows the OG lettering. Bricks have beveled gemstone geometry, translucent colored faces and local studio reflections. Armored bricks accumulate branching cracks after each surviving hit.
- **OG-style paddle:** a dark inset face, polished beveled frame and glowing cyan/pink end brackets. Wide Paddle extends the body while preserving the cap proportions; Sticky adds an amber rail and Laser adds a red rail and visible emitters.
- **Classic mode:** an optional saved setting restores the original opaque rectangular bricks and pale paddle with its colored stripe. Colored hit counts remain available. Switching styles preserves the current run and its power-ups; the brick legend follows the selected appearance.
- **Eight power-ups:** wide paddle, multiball, sticky paddle, laser, piercing ball, slow motion, safety shield and extra life. Sticky catches hold at the impact position; a shrinking wide paddle releases catches beyond its new edge.
- **Fresh-ball variation:** new balls launch 8–18° left or right of vertical. Checkpoints preserve sequence progress, while sticky catches retain their rebound direction.
- **Cinematics:** sixteen distinct procedural sets with establishing, activation and reveal shots, local reflections, layered atmosphere, bloom, and readable captions. Daily completion, the daily crown and Adventure champion have separate sequences. Reduced-motion compositions and lower-cost rendering remain available.
- **Procedural audio:** sixteen original synthesized level soundtracks, two victory arrangements and sound effects, with separate volume controls and mute.
- **Score display and shared records:** the current player's score is centered in larger, bold type, with readable thousands separators. The board leader's name and score appear on the left; lives and pause stay on the right. Adventure and Daily Challenge have separate top-25 rankings; the daily board displays minutes since submission. Adventure rows have a full green outline through 48 hours, yellow over 48–96 hours, and red over 96 hours. These age indicators update while the board stays open; both boards explain the five-day expiry.
- **Sharing:** leaderboard invitations and personal scorecards, native sharing where supported, complete-message copying, PNG downloads and QR codes. Android invitations combine message and link into one text body; daily dates use readable UTC labels.
- **Presentation and access:** responsive keyboard/mouse/touch controls, fullscreen launch for installed apps where supported, automatic phone fullscreen from start/resume taps, pause-menu settings, reduced motion/effects, light/dark/system interface themes and readable cinematic captions. Phone gameplay fills the available viewport when native fullscreen is unavailable, with space for notches and gesture areas.
- **Progress:** campaign checkpoints, personal best, preferences and the last entered nickname persist in browser storage.
- **Offline play and installation:** install the game or keep playing in a browser tab after its complete download. All worlds, music, cinematics and scorecards work offline; saved scores queue for reconnection.
- **Safe updates:** complete releases download before becoming available. Players apply updates from the start screen; open games retain their existing assets.
- **Performance:** shaders and textures prepare before play, power-ups and particles reuse objects, hidden pages stop rendering, and muted music stops scheduling new voices.
- **Social artwork:** SVG/ICO/PNG favicons, touch icons, and landscape/square Open Graph and Twitter card images.

## The sixteen worlds

| World | Mechanic | Music |
| --- | --- | --- |
| 1. Prism Garden | Find your rhythm | Glasswing |
| 2. Cloud Carnival | Moving formations | Cloud Waltz |
| 3. Electric City | Switches & gates | Afterimage Avenue |
| 4. Crystal Caverns | Explosive clusters | Beneath the Glass |
| 5. Ember Foundry | Moving barriers | Molten Engine |
| 6. Frost Observatory | Portal paths | Northern Lens |
| 7. Cosmic Reef | Everything connects | Tidal Orbit |
| 8. Prism Citadel | Three-stage gateway | Heart of the Prism |
| 9. Sunken Archive | Floodgates & portals | Letters from the Deep |
| 10. Aurora Passage | Armored ribbons | Ribbon of the North |
| 11. Clockwork Canopy | Synchronized barriers | Branches of Time |
| 12. Mirage Dunes | Portal chain reactions | Glass over Sand |
| 13. Thunder Spire | Storm gates & armor | Eye of the Storm |
| 14. Lunar Harbor | Moving docks & portals | Departure from Selene |
| 15. Event Horizon | The collapsing core | The Last Orbit |
| 16. Dawn Nexus | Three-stage grand finale | All the Light Returns |

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
| Web app manifest, service worker and Cache Storage | Installation, complete offline releases, asset integrity checks and updates between runs |
| IndexedDB | Durable pending scores, recent submission receipts and the last downloaded leaderboard with its refresh time |
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
| CSS-selector resource reads | Reads the score container with `Range: selector=#scores`; native world composition selects each `#world` fragment |
| Mutable HTML resources / selector-scoped POST | Appends one structured run to `/scores.html` inside `#scores`, giving every visitor the same persistent leaderboard |
| HTML microdata | Structured world/formation/row/brick/type/obstacle records, plus score runs with player, score, world, mode, day, duration and expiry fields |
| Parameterized routes and reusable templates | `/editor/:worldname` selects a world through a reusable native editor template |
| Native fragment composition | Includes the shared editor shell and its specific world; the catalog includes all sixteen world documents |
| JavaScript schema methods | An allowlisted route parameter produces the native world include |
| Declarative authorization | Grants anonymous `POST` access specifically to the score container; no publishing credential is shipped to the browser |
| Shape constraints | Restricts score markup to the permitted `ul`, run `li`, and property `meta` structure |
| Typed schemas, cardinality and uniqueness | Defines required run properties, their types and a unique `runKey`; `submittedAt` is optional for compatibility with older records |
| Server-side defaults | Assigns an immutable five-day `expiresAt` deadline using the server clock; the submission grammar rejects client-supplied expiry values |
| Guarded selector DELETE | Deletes only rows whose stored deadline is before a cutoff no later than server time; broader selectors and future cutoffs are rejected |
| Processors and native outbound HTTP | An expired-row read queues a same-host cleanup request. No external scheduler or service is used |
| Request triggers with Sessel | Rejects submissions that fail the exact payload grammar, nickname format or numeric limits with HTTP 422 |
| WebDAV authoring | Publishes owner-managed site files through the pinned DAV host; normal releases preserve scores and editable world resources |
| ETags and conditional writes | Editor publishing and score-rule migration use `If-Match`; world initialization uses `If-None-Match` and preserves existing documents |

Pagelove supplies persistent shared scores, composed editor routes and authorable HTML worlds without a separate application server.

### Data flow

1. The browser loads `public/index.html` and its same-origin modules/assets.
2. Official play uses a validated offline snapshot generated from the checked-in HTML worlds. Practice fetches the selected shared world document, or uses a saved draft/original layout when offline.
3. Gameplay, collisions, music and score calculation happen in the browser.
4. When a player chooses **Save score**, the client commits the run to its IndexedDB queue, then attempts to post one HTML record to the score selector. Pagelove applies the authorization, shape, schema and trigger rules.
5. A successful submission leaves a local receipt. Interrupted requests retry with the same unique run key; an already accepted run is recognized through a fresh leaderboard read.
6. The client reads the shared records, filters out expired entries and other modes/challenge days, and ranks the top 25. Native cleanup removes expired stored rows; the client provides a guarded fallback. It saves a snapshot for offline display.

Leaderboards refresh at run start, after submission, on focus/visibility changes, through the Refresh button, and periodically during visible play. Updates use HTTP requests; the game does not use a WebSocket or server-event subscription.

### Daily Challenge and score records

- A daily seed comes from the UTC date at run start. All players for that challenge get the same world and the same fresh-launch sequence. Power-up randomness uses a separate seeded generator.
- The client schedules a midnight rollover and checks the date when returning to the game. The host's HTTP `Date` header helps align its clock.
- **Rollover filters the active board to the new date.** Both Adventure and Daily entries have a maximum five-day ranking lifetime and are automatically removed from storage on online access after expiry.
- A run crossing midnight keeps its original challenge day. It can be saved under that day, but does not appear on the new day's active board.
- Offline submissions also retain that original day. The server-generated expiry deadline starts the five-day window on submission, so an offline run receives its full window when it first reaches the server.
- Daily share links open the current daily leaderboard. Invitation text and PNG cards capture the record/date shown when the share preview opens.
- Scores and elapsed play time are supplied by the client. Nicknames are public, accountless labels. Current board age is derived from the server expiry deadline; client timestamps cannot extend retention.
- Rules accept scores from **0 to 1,000,000**, worlds **1–16**, durations **1–99,999 seconds**, and nicknames of **2–16 ASCII letters, numbers, spaces, dashes or underscores**. Practice submissions are excluded.
- Ranking orders by score descending, world reached descending, then elapsed active time ascending. A tied top score can qualify for a record celebration.

These rules validate record structure and ranges. Scores are self-reported; there is no authoritative replay verification or account identity. The client currently reads the full score container and applies the top-25 limit locally. Pagination and additional anti-abuse measures would require further work as the board grows.

### Five-day retention

- The schema assigns expiresAt = server time + 432,000,000 ms once. The exact POST grammar excludes that field, so players cannot choose a later deadline. Later submissions do not refresh existing rows.
- Rankings, high-score qualification, HUD leaders and share previews exclude expired records. Cached offline standings use the same rule and the last learned server clock offset.
- A native GET processor sees expired rows in its response and queues an anonymous, same-host DELETE. The server permits only the exact expiry selector and rejects a cutoff later than server time. A client fallback requests the same guarded cleanup.
- There is no idle timer: expired rows become ineligible immediately, but physical deletion happens on the next online read/open, or periodic refresh while a client remains open. A completely unvisited host can retain expired storage until that access.
- Migration preserves dated runs' original deadlines. Twelve legacy rows had no timestamp; those receive a five-day window from this migration instead of being discarded without evidence of their age. Future records always have a server deadline.
- Existing Daily Challenge selection is preserved through October 14, 2026 UTC; the sixteen-world daily pool begins October 15 at 00:00 UTC so a challenge does not change during its day.

## Install and play offline

Open the game while connected and wait for **Ready to play offline**. The service worker downloads all sixteen worlds' code and artwork, fonts, music code, cinematics and sharing assets: currently **68 cached files, approximately 2.40 MB** before browser storage overhead. Installation is optional; a prepared browser tab also works offline.

- **Android:** use **Install game** or the browser's **Install app / Add to Home screen** command.
- **iPhone and iPad:** use the browser's Share menu, then **Add to Home Screen**.
- **Desktop:** use the browser's install control when available. The game shows installation instructions if a native prompt is unavailable.

| Feature | Offline behavior |
| --- | --- |
| Adventure, Practice and Daily Challenge | Fully playable; the daily world uses the UTC date and the most recently learned server clock offset |
| Music, power-ups, cinematics and scorecards | Available from the downloaded game; no separate media service |
| Campaign progress and preferences | Saved as usual; checkpoint validation rejects damaged or incompatible records |
| Leaderboards | Show the last downloaded standings and refresh time; a fresh server read is required to confirm a top-score celebration |
| Save score | Durably queues the run; sends when the game is open and a connection returns |
| Rejected submissions | Remain visible with Retry and Remove controls; temporary failures retry with backoff |

An update downloads into a separate release cache and becomes available only after the full asset set passes its checks. **Update game** becomes usable on the start screen. It reloads into the new release while retaining progress, preferences and pending scores. Open tabs keep their release's assets, including modules loaded later. Pagelove selector responses and score writes bypass the static asset cache.

An activation failure offers another **Update game** attempt. If play starts while activation is finishing, the requested reload waits until the start screen. The reproducible browser lab (`node tools/update-lab.mjs`, loopback port 4174) can switch between two local releases and simulate failed asset downloads or unavailable game network routes without writing production scores. It creates disposable files under `.private/update-lab` and uses that local origin's browser storage. The [October 14 review](audit/2026-10-14-paddle-update.md) records the collision fix and update verification.

Browser storage can be cleared or evicted under storage pressure. The install action requests persistent storage where supported, but the browser decides whether to grant it. A new browser or cleared installation must download the game again; unsent scores and local progress are lost if their storage is removed. Sync runs while the game is open; it does not depend on, or promise, background submission after the app closes.

See [PWA-UPGRADE.md](PWA-UPGRADE.md) for release integrity, queue behavior, optimization details and validation limits.

## Scoring

| Award | Calculation |
| --- | --- |
| Destroyed brick | `100 × min(5, 1 + floor(combo / 6))`; combo increments before the award |
| Collected falling power-up | 150 points, independent of the combo |
| Normal board clear | `750 + 150 × lives remaining` |
| First two Citadel / Nexus formations | 500 clear points each |
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

Open **http://127.0.0.1:4173**. No dependency install or build is required to serve the committed release. After changing runtime files, rebuild the offline release with `node tools/build-pwa.mjs` before reviewing it in a controlled browser tab.

The preview supports `GET`/`HEAD` and serves the committed site and local preview fixtures. Loopback permits service-worker development. It does not emulate Pagelove's score writes or rule enforcement. `public/scores.html` is an empty template, so local play has no live community scores. Fixtures under `/__qa/` do not register the game service worker.

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
| `public/display.js`, `public/display.css` | Gesture-triggered fullscreen, phone viewport layout, safe-area spacing and accessible exit controls |
| `public/engine.js`, `public/levels.js`, `public/bundled-worlds.js` | Physics, points, powers, seeded randomness and the official snapshot generated from HTML worlds |
| `public/brick-labels.js` | Remaining-hit labels and shared symbol artwork for the arena and How to play |
| `public/crystal-bricks.js`, `public/assets/prism-wordmark.svg` | Faceted translucent bricks, cached fracture artwork, local reflections and OG-inspired vector lettering |
| `public/paddle-art.js` | Beveled OG-style paddle, fixed-size end caps, shared reflections and power-up indicators; artwork is created before play |
| `public/scene.js`, `public/postprocessing.js` | Three.js rendering, power-up preparation/pooling and effects |
| `public/cinematics.js`, `public/cinematic-score.js` | World transition geometry and camera timing |
| `public/champion.js`, `public/daily-ending.js`, `public/daily-score.js` | Adventure record and Daily Challenge endings |
| `public/audio.js`, `public/music.js`, `public/victory-music.js` | Synthesized music and sound effects |
| `public/leaderboard.js`, `public/sharing.js` | Ranking, record eligibility, date formatting, share payloads, PNGs and QR codes |
| `public/offline.js` | IndexedDB leaderboard snapshot, durable score queue, cross-tab send leases, retries and receipts |
| `public/pwa.js`, `public/manifest.webmanifest` | Installation help, offline readiness and update controls |
| `public/sw.js`, `public/pwa-release.js` | Generated offline worker, asset inventory and release identity |
| `public/worlds.html`, `public/worlds/*/definition.html` | Native included world catalog and editable microdata world documents |
| `public/world-format.js`, `public/brick-events.js` | Validated HTML conversion, bounded custom types and strike/damage events |
| `public/editor.*`, `public/editor-template.html`, `public/editor-route.html` | Visual workshop, native route template, owner publishing and Practice preview |
| `public/scores.html` | Score store template with Pagelove rules |
| `public/vendor/`, `public/assets/` | Bundled libraries, licenses, font, icons and artwork |
| `artwork/` | Original generated poster images, prompts and export notes |
| `tools/retention-rules.mjs` | Server expiry defaults, exact DELETE guard and native cleanup processor |
| `tools/` | Publisher, local server, asset builders and manual preview generators |
| `tools/build-pwa.mjs`, `tools/service-worker.template.js` | Deterministic release generation, stale-build checks and editable worker source |
| `tests/` | Engine, checkpoint, audio, cinematic, offline-queue and service-worker checks |
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

The world workshop is available locally at `/editor/prism-garden`; local preview reads seed HTML and does not emulate native template composition or owner writes. [WORLD-EDITOR.md](WORLD-EDITOR.md) describes publishing and the event API.

For local manual previews, generate `node tools/make-qa.mjs`, start the local server, and open `/__qa/index.html`. Other tools extend that fixture with music, cinematic, record, paddle or typography preview controls. Read the relevant upgrade notes below for their required order. Generated files stay under ignored `test-results/` and are outside the deployed `public/` tree.

For world thumbnails, copy `tools/world-preview.html` into `test-results/fixture/`, open `/__qa/world-preview.html`, select a world and capture its 800×420 canvas into `public/assets/world-preview-01.png` through `world-preview-16.png`. The preview uses a fixed seed and reduced motion for consistent scenery.

### Existing checks

When validating changes, the existing suites can be run with:

```sh
node --test tests/*.test.mjs
```

They cover seeded randomness, core collisions, powers, progression, checkpoint validation, synthesized arrangements, camera frames, offline queue recovery and service-worker release behavior. Queue and worker tests use controlled storage/network adapters; browser checks complement them. The collision bot replenishes lives while checking world completion, so it does not establish human difficulty balance. Release-time results and remaining device checks are recorded in [PWA-UPGRADE.md](PWA-UPGRADE.md).

## Deployment and maintenance

The publisher in `tools/remote.mjs` pins:

- Public game: `https://sane-guild-8399.onpagelove.com/`
- Owner authoring endpoint: `https://dav-sane-guild-8399.onpagelove.com/`

Publishing requires the host owner's credential. Start `node tools/remote.mjs` in an interactive terminal and wait for **Ready for hidden JSON input**. Authenticate through the publisher's hidden stdin `auth` operation. Keep the key out of command arguments, environment variables, files, source control and browser code. The publisher keeps it in process memory and checks that the authorized console identifies the expected DAV host.

After all runtime and asset edits, generate and check the offline release:

```sh
node tools/build-worlds.mjs
node tools/build-bundled-worlds.mjs
node tools/build-editor.mjs
node tools/build-pwa.mjs
node tools/build-pwa.mjs --check
```

The builder derives a release identity from the assets and worker template, updates the entry-page marker, and generates `public/pwa-release.js` and `public/sw.js`. Edit worker behavior in `tools/service-worker.template.js`; regenerate after any runtime change. The publisher refuses a stale build and checks it again before uploading the worker.

After authentication, normal publishing uses `{"op":"deploy"}`; exit with `{"op":"quit"}`. Normal deployment:

1. Uploads runtime modules/assets, then `app.js`, then `index.html`, and **`sw.js` last**.
2. **Excludes `scores.html` and all `worlds/*/definition.html` data**, preserving community scores, rules and edited worlds. Native editor routes are stored at `/editor/:worldname`; `seedWorlds` creates only missing world resources.
3. Reads uploaded files back and compares non-HTML bytes. Pagelove may normalize HTML.
4. Writes a non-secret release receipt to ignored `deployment.json`.

A fresh host needs its score template installed once. Only use the publisher's `initializeScores` option for deliberate initial setup on an empty host. On an existing host, score-rule updates need a record-preserving migration; the included `migrateScoreRules` helper backs up the live resource and uses its ETag with `If-Match` before replacement.

When switching hosts, update the publisher, entry-page canonical/social URLs, score type/schema, score grammar and `tools/build-data.mjs` together. Vocabulary IRIs such as `https://pagelove.org/Schema` identify platform rule types; they are separate from the game host and Pagelove website link.

Private backups, credentials, live score exports, generated preview files and deployment receipts are excluded from Git. The public score template stays empty. Keep import/entry-page version parameters current for browsers without an active worker, then regenerate the offline release. A complete release cache resolves runtime URLs by path so query variants use the same release's asset.

### Operational limits

- Gameplay requires WebGL 2 support. Reduced effects lowers rendering cost, but smoothness and audio behavior vary across hardware and browser settings.
- Native share destinations and their handling of text/files are controlled by the browser, OS and receiving app. Copy invitation and download remain fallbacks. Physical Android-to-Slack delivery is not established by desktop preview review.
- Progress and preferences use browser storage; clearing that storage removes them. The game has no accounts or cloud progress synchronization.
- Fresh score reads and publishing queued scores require the Pagelove host. Offline standings remain a dated snapshot; queued scores sync when connectivity returns and the game is open.
- Physical Android installation, airplane-mode relaunch, and updates between two installed production releases still require device verification. Local browser checks do not establish those results.

## Further documentation

- [SCORING.md](SCORING.md) — current point formulas, timing, combos, powers and ranking.
- [PWA-UPGRADE.md](PWA-UPGRADE.md) — installation, offline releases, queued scores, updates and performance changes.
- [FULLSCREEN-UPGRADE.md](FULLSCREEN-UPGRADE.md) — phone fullscreen defaults, safe-area layout, pause controls and browser/device limits.
- [BRICK-LABELS.md](BRICK-LABELS.md) — dynamic armor counts, readable explosive/switch symbols and the brick legend.
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
