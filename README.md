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
- **Full paddle contacts:** swept collisions include the lower solid body and raised endcaps. The [paddle follow-up](PADDLE-COLLISION-FOLLOWUP.md) documents two reproduced misses, independent geometry checks and the local before/after replay.
- **Fresh-ball variation:** new balls launch 8–18° left or right of vertical. Checkpoints preserve sequence progress, while sticky catches retain their rebound direction.
- **Cinematics:** sixteen distinct procedural sets with establishing, activation and reveal shots, local reflections, layered atmosphere, bloom, and readable captions. Daily completion, the daily crown and Adventure champion have separate sequences. Reduced-motion compositions and lower-cost rendering remain available.
- **Procedural audio:** sixteen original synthesized level soundtracks, two victory arrangements and sound effects, with separate volume controls and mute.
- **Score display and shared records:** the current player's score is centered in larger, bold type, with readable thousands separators. The board leader's name and score appear on the left; lives and pause stay on the right. Adventure and Daily Challenge have separate top-25 rankings; the daily board displays minutes since submission. Adventure rows have a full green outline through 48 hours, yellow over 48–96 hours, and red over 96 hours. These age indicators update while the board stays open; both boards explain the five-day expiry.
- **Sharing:** leaderboard invitations and personal scorecards, native sharing where supported, complete-message copying, PNG downloads and QR codes. Android invitations combine message and link into one text body; daily dates use readable UTC labels.
- **Presentation and access:** responsive keyboard/mouse/touch controls, fullscreen launch for installed apps where supported, automatic phone fullscreen from start/resume taps, pause-menu settings, reduced motion/effects, light/dark/system interface themes and readable cinematic captions. Phone gameplay fills the available viewport when native fullscreen is unavailable, with space for notches and gesture areas.
- **Progress:** campaign checkpoints, personal best, preferences and the last entered nickname persist in browser storage.
- **Offline play and installation:** install the game or keep playing in a browser tab after its complete download. All worlds, music, cinematics and scorecards work offline; saved scores queue for reconnection.
- **Safe updates:** complete releases download before becoming available. Players apply updates from the start screen; open games retain their existing assets.
- **Performance:** active play targets 60 FPS independently of the 120 Hz physics step. Crystal bodies, edges, count/crack artwork, scenery and bounded particles use shared GPU batches; resolution adapts to sustained load. Low effects uses simpler crystal lighting, gameplay uses glow sprites, and cinematic bloom stays in the cut scenes. Shaders/textures prepare before play, hidden pages stop rendering, and muted music stops scheduling new voices. See [rendering performance](RENDER-PERFORMANCE.md) for limits and reproducible measurements.
- **Social artwork:** SVG/ICO/PNG favicons, touch icons, and landscape/square Open Graph and Twitter card images.

## Mastery and engagement

The new engagement implementation adds four independent medals per world, personal world records and next-goal feedback; paired power choices and three strategies; an earned aimed Precision catch for slow board endings; Citadel, Thunder Spire and Nexus core encounters; reachable score comparisons and shared official Practice challenges; authored barrier/music recovery periods; and cosmetic finishes, trails, restored artwork and soundtrack rewards. The proposed short-session mode is excluded.

Goals, encounters, pacing and unlocks are authored in [engagement.html](public/engagement.html) and validated into an offline runtime projection. Old checkpoints retain their original rules; changed gameplay gets its own score revision. Progress can be exported/imported, while optional bounded play notes remain local. See [ENGAGEMENT.md](ENGAGEMENT.md) for controls, tuning, privacy, compatibility and validation limits. This source implementation has not yet been deployed or given new release acceptance evidence.

## Document-first architecture

World metadata and formations are authoritative HTML documents. The catalog provides permanent IDs, campaign order and legacy mappings; the build produces the complete offline runtime snapshot without depending on its previous output. Practice reads the same model, including edited instructions, narratives, colors and scene/music presets.

- [Architecture and all 23 standards](DOCUMENT-FIRST-ARCHITECTURE.md): ownership, events, versioning, recovery, offline state and justified runtime exceptions.
- [Reusable development rule](DOCUMENT-FIRST-DEVELOPMENT.md): the governing project philosophy.
- [Complete game-development handbook](GAME-DEVELOPMENT-BEST-PRACTICES.md): reusable architecture, gameplay, balance, leaderboards, artwork, accessibility, PWA, review and release practices, including the complete parent document-first rule and lessons from the audit history.
- [Implementation audit](audit/2026-10-14-document-first-implementation.md): exact verification and deployment status. Local completion does not establish live enforcement.

Checkpoint v2 stores stable world identity, definition and ruleset revisions, and a complete definition including portals. Compatible legacy saves migrate; incompatible saves remain recoverable. Scores carry an optional ruleset fingerprint, and rankings compare compatible rulesets. Existing unversioned scores use a frozen legacy mapping.

The editor validates world writes with the shared schema, uses owner-only DAV access, sends an ETag condition and confirms the saved document by reading it back. **Support confirmed that WebDAV intentionally bypasses all schema validation and triggers; it is only an authoring mechanism.** This is expected behavior, not a platform enforcement bug. The generated trigger candidate stays inactive outside deployed assets in policy-candidates/ and cannot enforce DAV authoring. Wesley chose to retain owner DAV publishing only; no application-write grant is added. No anonymous world-write grant was added. See the [resolved report](DAV-TRIGGER-BUG-REPORT.md) and [architecture boundary](DOCUMENT-FIRST-ARCHITECTURE.md#persistence-boundary).

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
| Bun **1.4.3** | Development runtime for dependency installation, local preview, publishing, asset utilities, postprocessing builds and the test suite |
| Sharp **0.35.5** | Development-time poster conversion and favicon exports |
| Linkedom **0.18.12** | Development-time HTML parsing to validate world documents and generate the official offline formations |
| Pagelove HTML resources and Sessel | Shared score persistence, schemas, shape rules, authorization and request validation |

Bun runs the development tools and tests; a separate Node.js installation is not required. Existing `node:*` imports, including `node:test`, use [Bun’s Node.js compatibility layer](https://bun.sh/docs/runtime/nodejs-compat). The deployed game runs in the browser and Pagelove.

All browser runtime code, fonts, icons, images, QR encoding and postprocessing files are included in `public/`. Installing development dependencies is optional when playing or serving the committed site.

## Pagelove features used

Pagelove supplies the shared data store, request rules, server composition and owner authoring endpoint. The following capabilities are implemented in this repository; the source links show where each one is configured or called.

| Pagelove capability | How Prism Breaker uses it | Implementation |
| --- | --- | --- |
| Site and asset hosting | Serves the game, libraries, fonts, icons, world previews and social artwork from the game host, with every runtime asset bundled locally. | [Entry page](public/index.html), [publisher](tools/remote.mjs) |
| Selector-based HTTP reads | `GET /scores.html` with `Range: selector=#scores` returns the shared leaderboard fragment. The client reads its microdata to build the Adventure and Daily rankings. | [Score client](public/app.js) |
| Mutable HTML resources and selector-scoped POST | Posting one run to the same selector appends it to the persistent HTML score document. Players share one board without a separate database service. | [Score store and rules](public/scores.html), [score client](public/app.js) |
| HTML microdata as structured data | Score records carry typed properties such as player, score, mode, day and expiry. World documents contain nested formations, rows, bricks, custom types, barriers and portals. HTML microdata is a web standard that Pagelove can store, compose and process. | [Score schema generator](tools/build-data.mjs), [example world](public/worlds/prism-garden/definition.html), [world parser](public/world-format.js) |
| Parameterized routes | The stored route `/editor/:worldname` serves addresses such as `/editor/prism-garden`. Pagelove exposes the captured slug through `Context.request.params.worldname`. | [Editor route](public/editor-route.html), [route builder](tools/build-editor.mjs) |
| Reusable templates and native fragment composition | `p:include` selects `#editor-shell` from a shared template and `#world` from the chosen world document. The world catalog composes all sixteen world fragments. | [Editor shell](public/editor-template.html), [world catalog](public/worlds.html) |
| Schema methods and server-side JavaScript | The `urn:PrismBreaker:EditorTemplate` schema defines a `world` method. Its JavaScript implementation checks the route slug against the sixteen supported worlds and returns that world's native include. | [Editor route](public/editor-route.html) |
| Declarative authorization | Anonymous visitors may append scores only within `#scores`. Publishing site files and shared world edits requires the owner's credential; that credential is never embedded in the released assets. | [Authorization rules](public/scores.html), [editor publisher](public/editor.js) |
| Shape constraints | The score container accepts only the configured list, run and property markup. This constrains the HTML structure accepted by the shared resource. | [Shape rules](tools/build-data.mjs) |
| Typed schemas, cardinality and uniqueness | Required properties have declared types and counts. A unique `runKey` supports retrying an interrupted submission without creating a second accepted run. `submittedAt` remains optional for compatibility with older records. | [Score schema](tools/build-data.mjs), [submission queue](public/offline.js) |
| Request triggers with Sessel | A POST trigger checks the exact one-run payload grammar, nickname format, mode and numeric bounds; rejected submissions receive HTTP 422. | [Sessel trigger](tools/build-data.mjs) |
| Computed server defaults | Pagelove supplies `expiresAt` as server time plus five days. The POST grammar does not accept a client-chosen expiry, so changing the submitted payload cannot extend that deadline. | [Expiry property](tools/retention-rules.mjs) |
| Guarded selector DELETE | A DELETE trigger permits only the exact expired-row selector and rejects cutoffs later than server time. The client can request cleanup without gaining permission to delete arbitrary scores. | [Retention rules](tools/retention-rules.mjs), [cleanup client](public/app.js) |
| Response processors and native HTTP actions | A GET processor detects expired score rows and schedules a native HTTP DELETE to the same game's score resource. Cleanup uses the same guarded selector as the client fallback. | [Processor and HTTP action](tools/retention-rules.mjs) |
| WebDAV authoring | The publisher uses owner-authenticated WebDAV operations to create directories and upload files. The workshop publishes complete world HTML through the pinned DAV endpoint. Normal site releases preserve score records and edited worlds. | [Publisher](tools/remote.mjs), [workshop publishing](public/editor.js) |
| World validation boundary | The shared schema validates editor/build/import data; owner DAV publishing uses ETags and readback. The server trigger candidate is **not deployed**: DAV intentionally bypasses schemas/triggers as trusted authoring, confirmed by support. | [Policy candidate and limitation](DOCUMENT-FIRST-ARCHITECTURE.md#persistence-boundary), [schema](public/world-schema.js) |
| ETags and conditional writes | World publishing reads the current document and ETag, then sends `If-Match` to reject concurrent changes. Missing-world initialization uses `If-None-Match: *`; score-rule migrations also use ETags. Successful owner writes are read back. | [Editor publisher](public/editor.js), [initialization and migration](tools/remote.mjs) |

The 3D renderer, physics, music, CSS brick styling, DOM strike/damage events, PWA installation, offline cache and sharing run through ordinary browser APIs and bundled JavaScript. Pagelove stores and composes the HTML that those features consume. There is no external runtime API, database, CDN or scheduling service in this design.

### World editor flow

1. A visitor opens [the workshop](https://sane-guild-8399.onpagelove.com/editor/prism-garden). Pagelove resolves `/editor/:worldname`, executes its schema method and composes the shared shell with `/worlds/prism-garden/definition.html`'s `#world` fragment.
2. Browser code validates that HTML and exposes visual editing, local drafts, undo/redo and a Three.js preview. Bricks retain their microdata types, so CSS selectors such as `[itemtype~="urn:Brick:Moving"]` can style specializations and application code can handle their strike events.
3. An owner can publish through the editor using the existing host key. The editor checks the current document and ETag, writes with `If-Match`, and verifies the result. The key is cleared from the input and is not saved in drafts, exports or browser storage.
4. Practice loads the published world. Adventure and Daily Challenge use the official offline snapshot generated from the checked-in HTML definitions, so a live edit does not change an ongoing ranked challenge. Normal deployments exclude mutable world documents.

Opening the native editor requires a connection. The type builder combines supported behavior recipes; arbitrary new physics or rendering still requires trusted application code. See [WORLD-EDITOR.md](WORLD-EDITOR.md) for the data format, event API and publishing details.

### Leaderboard flow

1. The browser loads `public/index.html` and its same-origin modules/assets.
2. Official play uses a validated, revisioned offline snapshot of complete world definitions generated from the catalog and checked-in HTML worlds. Practice fetches the selected shared world document, or uses a cached published world, saved draft, or original release when the network is unavailable.
3. Gameplay, collisions, music and score calculation happen in the browser.
4. When a player chooses **Save score**, the client commits the run to its IndexedDB queue, then attempts to post one HTML record to the score selector. Pagelove applies the authorization, shape, schema and trigger rules.
5. A successful submission leaves a local receipt. Interrupted requests retry with the same unique run key; an already accepted run is recognized through a fresh leaderboard read.
6. The client reads the shared records, filters out expired entries and other modes/challenge days, and ranks the top 25. Native cleanup removes expired stored rows; the client provides a guarded fallback. It saves a snapshot for offline display.

Leaderboards refresh at run start, after submission, on focus/visibility changes, through the Refresh button, and periodically during visible play. Updates use HTTP requests; the game does not use a WebSocket or server-event subscription.

Five-day expiry removes an entry from eligible rankings as soon as its deadline passes. Physical deletion is request-driven: the native GET processor and guarded client fallback remove expired rows when the online board is accessed. There is no background timer that deletes stored rows while the site receives no traffic. Daily rollover is a separate browser rule that selects the new UTC challenge date; it does not reset the whole stored score document at midnight.

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

Open the game while connected and wait for **Ready to play offline**. The service worker downloads all sixteen worlds' code and artwork, fonts, music code, cinematics and sharing assets: currently **73 cached files, approximately 2.43 MB** before browser storage overhead. Installation is optional; a prepared browser tab also works offline. The authoring catalog remains online; its generated runtime representation is included in the offline world bundle.

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

An activation failure offers another **Update game** attempt. If play starts while activation is finishing, the requested reload waits until the start screen. The reproducible browser lab (`bun tools/update-lab.mjs`, loopback port 4174) can switch between two local releases and simulate failed asset downloads or unavailable game network routes without writing production scores. It creates disposable files under `.private/update-lab` and uses that local origin's browser storage. The [October 14 review](audit/2026-10-14-paddle-update.md) records the collision fix and update verification.

Updates also appear in a sticky notice above the start-screen arena and in **Settings → Game updates**, which offers **Check for updates**. Visible connected pages check every minute; the pause menu announces a downloaded update. A closed app may activate an update before its next launch, so an already-current launch has no update button. See [the update visibility investigation](UPDATE-VISIBILITY-INVESTIGATION.md) for the discovered placement and detection gaps and their corrections.

Browser storage can be cleared or evicted under storage pressure. The install action requests persistent storage where supported, but the browser decides whether to grant it. A new browser or cleared installation must download the game again; unsent scores and local progress are lost if their storage is removed. Sync runs while the game is open; it does not depend on, or promise, background submission after the app closes.

See [PWA-UPGRADE.md](PWA-UPGRADE.md) for release integrity, queue behavior, optimization details and validation limits.

The [PWA robustness review](PWA-ROBUSTNESS-REVIEW.md) records the October 15 cache-loss, update, installation and queue audit, primary browser guidance, 125 passing automated tests and isolated browser evidence. Readiness now checks the asset inventory; release pins survive asset eviction; network downloads have deadlines; stale repair replies cannot replace newer state; and explicit retries use actual network results. The review records the subsequent verified publication and lists physical-device checks still needed.

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

Use Bun 1.4.3 or newer (1.4.3 was verified for this tooling):

```sh
git clone https://github.com/wesley83/prism-breaker.git
cd prism-breaker
bun tools/serve.mjs
```

Open **http://127.0.0.1:4173**. No dependency install or build is required to serve the committed release. After changing runtime files, rebuild the offline release with `bun tools/build-pwa.mjs` before reviewing it in a controlled browser tab.

The preview supports `GET`/`HEAD` and serves the committed site and local preview fixtures. Loopback permits service-worker development. It does not emulate Pagelove's score writes or rule enforcement. `public/scores.html` is an empty template, so local play has no live community scores. Fixtures under `/__qa/` do not register the game service worker.

### Controls

| Action | Keyboard | Mouse / touch |
| --- | --- | --- |
| Move paddle | Left/right arrows or A/D | Move mouse or drag |
| Launch held balls | Space | Launch ball button or click/tap arena |
| Pause | P or Escape | Pause button |
| Continue from a cinematic | Space or Enter with the story heading focused | Next world / See your score / Save your name button |
| Pause or resume a cinematic | P or Escape with the story heading focused | — |

Audio starts after a player interaction. World, Daily Challenge and record endings keep their text visible and wait for explicit continuation. Animation stops on its final composition; the keyboard pause shortcut also pauses scene music. Cinematics have no separate pause-animation buttons. Story headings receive focus and describe the associated text. Keyboard actions ignore repeated key events. A checkpoint restores the remaining board with a held ball; pending completed-world cinematics play before progression. Resuming from the last gameplay dialog restores focus to the arena.

## Source map

| Path | Responsibility |
| --- | --- |
| `public/app.js` | UI, game loop, checkpoints, score reads/submission, UTC rollover and share message models |
| `public/display.js`, `public/display.css` | Gesture-triggered fullscreen, phone viewport layout, safe-area spacing and accessible exit controls |
| `public/engine.js`, `public/levels.js`, `public/bundled-worlds.js` | Physics, points, powers, seeded randomness and the official snapshot generated from HTML worlds |
| `public/brick-labels.js` | Remaining-hit labels and shared symbol artwork for the arena and How to play |
| `public/crystal-bricks.js`, `public/assets/prism-wordmark.svg` | Faceted translucent bricks, cached fracture artwork, local reflections and OG-inspired vector lettering |
| `public/brick-batch.js`, `public/particle-batch.js`, `public/scenery-batch.js`, `public/render-budget.js` | Derived GPU batches, bounded particles, frame scheduling, adaptive resolution and local diagnostics |
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
bun tools/build-icons.mjs
bun tools/build-fx.mjs
bun tools/build-qr.mjs
bun tools/build-share-assets.mjs
```

`BUN_BIN` can select a Bun executable outside PATH. `PRISM_IMAGE_MODULES` can select a directory containing a `package.json` and Sharp installation for image exports. Asset builds use local dependencies; they do not add a runtime CDN dependency.

Regenerate just the world catalog with:

```sh
bun tools/build-data.mjs --worlds-only
```

Running that tool without `--worlds-only` also regenerates an **empty score template**. Never replace an existing live leaderboard with it.

The world workshop is available locally at `/editor/prism-garden`; local preview reads seed HTML and does not emulate native template composition or owner writes. [WORLD-EDITOR.md](WORLD-EDITOR.md) describes publishing and the event API.

For local manual previews, generate `bun tools/make-qa.mjs`, start the local server, and open `/__qa/index.html`. Other tools extend that fixture with music, cinematic, record, paddle or typography preview controls. Read the relevant upgrade notes below for their required order. Generated files stay under ignored `test-results/` and are outside the deployed `public/` tree.

Automatic cinematic playback is a required browser release check. Generate `bun tools/handbook-browser-fixture.mjs`, then run both acceptance controls at `/__qa/handbook.html`. The playback check observes rendered pixel changes while the real application clock runs through all sixteen world stories, both record endings, Daily completion and the three reward tiers, with full and low effects. It also checks the medal-to-story transition and interrupted playback. Rendering selected timestamps manually remains useful for visual inspection, but cannot establish that playback works. Retain the exact browser receipt in `review/evidence/handbook-browser.json`; changed source, fixture or requirements invalidate it.

Cinematics deliberately hold their final readable frame until the player continues, with a **Replay scene** action. Reduced motion shows a still composition with an explicit **Play animation** option for that scene only; this does not change the saved accessibility preference. These states are labeled so a deliberate still does not look like unexplained stalled playback. Physical-device failures still require reproduction on the affected browser/device.

For world thumbnails, copy `tools/world-preview.html` into `test-results/fixture/`, open `/__qa/world-preview.html`, select a world and capture its 800×420 canvas into `public/assets/world-preview-01.png` through `world-preview-16.png`. The preview uses a fixed seed and reduced motion for consistent scenery.

### Existing checks

After `bun install --frozen-lockfile`, run the existing suites with:

```sh
bun test ./tests
```

They cover seeded randomness, core collisions, powers, progression, checkpoint validation, synthesized arrangements, camera frames, offline queue recovery and service-worker release behavior. Queue and worker tests use controlled storage/network adapters; browser checks complement them. The collision bot replenishes lives while checking world completion, so it does not establish human difficulty balance. Release-time results and remaining device checks are recorded in [PWA-UPGRADE.md](PWA-UPGRADE.md).

## Deployment and maintenance

The publisher in `tools/remote.mjs` pins:

- Public game: `https://sane-guild-8399.onpagelove.com/`
- Owner authoring endpoint: `https://dav-sane-guild-8399.onpagelove.com/`

Publishing requires the host owner's credential. Start `bun tools/remote.mjs` in an interactive terminal and wait for **Ready for hidden JSON input**. Authenticate through the publisher's hidden stdin `auth` operation. Keep the key out of command arguments, environment variables, files, source control and browser code. The publisher keeps it in process memory and checks that the authorized console identifies the expected DAV host.

After all runtime and asset edits, generate and check the offline release:

```sh
bun run build
bun tools/build-pwa.mjs --check
```

Commit the exact source, then run `bun run release:check` before publishing. This runs the behavioral suite, PWA consistency, maintained document links, local module imports and a limited credential-pattern check. Its ignored evidence names the source commit, content digest and runtime release and lasts 24 hours. The publisher rejects missing/stale evidence and dirty release inputs; it checks again before uploading the worker. Recheck after source/documentation edits or a new commit. This gate does not certify physical devices or unresolved platform contracts.

Run publishing checks from the actual Git checkout of `wesley83/prism-breaker`. A separate authoring mirror or a folder inside an unrelated parent repository cannot issue release approval. It can still build, run tests and preview the game.

The pinned [Quality workflow](.github/workflows/quality.yml) installs frozen Bun dependencies, regenerates artifacts, rejects generated drift and runs the gate on pushes and pull requests. See [review results](FOLLOW-UP-REVIEW-RESULTS.md) for actual hosted-check/branch-protection status. Run repository checks separately with `bun run check:repository`.

The builder derives a release identity from runtime assets, composition inputs, the worker and packaging code. It generates the source marker/module/worker and an ignored immutable package under `test-results/release-package/<release-id>/`. Published HTML references that package, while native worlds and scores retain their original resources. See [immutable publication and rollback](RELEASE-PUBLICATION.md).

After authentication, normal publishing uses `{"op":"deploy"}`; exit with `{"op":"quit"}`. Normal deployment:

1. Stages and verifies create-only files under `/releases/<release-id>/`, then conditionally promotes self-contained entry documents, with root `sw.js` last. Legacy root scripts/styles remain unchanged for older visitors.
2. **Excludes `scores.html` and all `worlds/*/definition.html` data**, preserving community scores, rules and edited worlds. Native editor routes are stored at `/editor/:worldname`; `seedWorlds` creates only missing world resources.
3. Verifies binary/text bytes and normalized HTML structure, refusing collisions or concurrent entry edits. The worker downloads immutable URLs into logical release caches.
4. Writes a non-secret release receipt to ignored `deployment.json`.

Game publication rejects `initializeScores` and never writes score policies or records. `migrateScoreRules` permits record-preserving maintenance only when native policy identity is unchanged; changed rules are refused until a supported safe activation procedure is established. Fresh-host policy setup requires a separate reviewed procedure. The known propagation issue is not declared solved by warming a few requests. See [native platform requirements](PLATFORM-REQUIREMENTS.md).

When switching hosts, update the publisher, the pinned absolute-asset origin in `tools/immutable-release.mjs`, entry-page canonical/social URLs, score type/schema, score grammar and `tools/build-data.mjs` together. Vocabulary IRIs such as `https://pagelove.org/Schema` identify platform rule types; they are separate from the game host and Pagelove website link.

Private backups, credentials, live score exports, generated preview files and deployment receipts are excluded from Git. The public score template stays empty. Keep import/entry-page version parameters current for browsers without an active worker, then regenerate the offline release. A complete release cache resolves runtime URLs by path so query variants use the same release's asset.

### Operational limits

- Gameplay requires WebGL 2 support. Reduced effects lowers rendering cost, but smoothness and audio behavior vary across hardware and browser settings.
- Native share destinations and their handling of text/files are controlled by the browser, OS and receiving app. Copy invitation and download remain fallbacks. Physical Android-to-Slack delivery is not established by desktop preview review.
- Progress and preferences use browser storage; clearing that storage removes them. The game has no accounts or cloud progress synchronization.
- Fresh score reads and publishing queued scores require the Pagelove host. Offline standings remain a dated snapshot; queued scores sync when connectivity returns and the game is open.
- Physical Android installation, airplane-mode relaunch, and updates between two installed production releases still require device verification. Local browser checks do not establish those results.

## Codex skills and development tools

Codex helped build and refine the game using the skills and tools below. This account is based on the project's design notes and audit records; it is not a complete log of every historical skill invocation.

| Skill or guidance | Contribution | Project record |
| --- | --- | --- |
| [Taste](https://github.com/Leonxlnx/taste-skill), installed with Bun as `design-taste-frontend` | Guided the interface review and improvements to typography, spacing, navigation, menus, light/dark themes, accessibility and responsive layouts. Its redesign guidance was adapted to the game's existing HTML/CSS/Three.js interface. | [Design review and implementation plan](DESIGN-REVIEW.md) |
| HyperFrames animation guidance | Informed the cinematic upgrade with staged camera shots, reveals, depth, atmosphere, animation timing and reduced-motion handling. These techniques were applied within the interactive Three.js renderer; the game does not depend on the HyperFrames video runtime. | [Sixteen-world cinematic audit](audit/2026-10-14-sixteen-worlds.md) |

Codex also used these development tools:

- **Image generation:** created the landscape and square Open Graph posters. The [artwork notes](artwork/README.md) confirm use of the built-in image generation tool, but do not establish whether the separate `imagegen` skill was loaded. The favicon was authored as SVG.
- **Browser automation:** inspected layouts and exercised gameplay, settings, installed-game updates and the world editor. Browser checks complement the automated checks and retain the device limitations documented in the release notes.
- **Terminal and file-editing tools:** implemented the game, ran checks, published files to Pagelove and maintained the public GitHub repository.

Three.js, Web Audio and Pagelove are the game's technologies. The project records do not identify a dedicated Pagelove skill used during development.

## Further documentation

- [FOLLOW-UP-REVIEW-RESULTS.md](FOLLOW-UP-REVIEW-RESULTS.md) — executed reviews, corrected defects, remaining acceptance gaps and the updated “What needs to change” assessment.
- [RETROSPECTIVE.md](RETROSPECTIVE.md) — missed issues, root causes, verification limits and prevention controls.
- [FOLLOW-UP-REVIEW-PLAN.md](FOLLOW-UP-REVIEW-PLAN.md) — prioritized reviews, ownership proposals, acceptance criteria and explicit pending status.
- [WORLD-EDITOR.md](WORLD-EDITOR.md) — native Pagelove routing/templates, HTML world definitions, brick events, custom types and owner publishing.
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

## Current acceptance and remaining work

See [remaining-work implementation](REMAINING-WORK-IMPLEMENTATION.md) for current outcomes. Owner DAV publishing and the casual leaderboard are explicit choices. Five-day exclusion with physical cleanup on online board access is the accepted retention contract; no unattended scheduler is required. A guaranteed public-policy activation barrier still needs a supported platform mechanism. [Fourteen device and human checks](review/acceptance-plan.html) are prepared but not run because no devices or independent reviewer are available.

Run `bun tools/acceptance-status.mjs init` to create a private release-specific record and `bun tools/acceptance-status.mjs report` to validate/report it. Existing records are never overwritten by initialization. A submitted human record is not a hardware attestation; synthetic results cannot be relabeled as observed phone tests. No private evidence is uploaded automatically.

## Handbook 2.8 implementation

The tracked Web Game Development Handbook now matches the identified authoring edition. The workshop uses a semantic DOM working root, immutable command snapshots and revision-checked IndexedDB drafts. Save failures retain recoverable work before navigation; checkpoint text reflects actual storage outcomes. Paddle input has explicit contact ownership; duplicate score recovery checks all canonical fields; restore commits a prepared candidate.

[Release requirements](review/requirements.html) independently enumerate required exports, behavioral contracts and exact-runtime browser evidence. The release gate rejects missing, failed or stale required receipts. Browser fixtures cover save failure followed by ordinary actions, DOM editing/preview isolation, layout/text enlargement and controlled/sustained rendering. Evidence is scoped to its recorded engine and conditions. See [public data and recovery operations](PUBLIC-DATA-OPERATIONS.md) and the [implementation audit](audit/2026-10-17-handbook-implementation.md).

Local diagnostic tools include a bounded checkpoint/input trace with compatibility checks and first-divergence replay; traces do not establish score authenticity or upload themselves. The original physical-device/human procedures remain separate and uncompleted where no evidence exists.
