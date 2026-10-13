# Offline play, installation and performance

Release work reviewed on October 13, 2026. Prism Breaker now downloads a complete playable release, offers installation, and retains score submissions until they can reach Pagelove. All runtime assets stay on the game host; the upgrade adds no external service.

## Player experience

1. Open the game while connected and wait for **Ready to play offline**. The current package contains 53 cached files, approximately 1.94 MB before browser storage overhead.
2. Use **Install game**, the browser's install command, or **Share → Add to Home Screen** on iPhone/iPad. Playing offline in a prepared browser tab also works.
3. Adventure, Practice, Daily Challenge, power-ups, music, cinematics and generated scorecards remain available without a connection.
4. Save a score normally. The game confirms it is queued only after its storage transaction commits. It submits when the game is open and connectivity returns.
5. Apply a downloaded update from the start screen. Progress, preferences and queued scores survive the update.

Installation prompts depend on the browser. The game shows platform-specific instructions when a native prompt is unavailable, hides installation controls in standalone and fullscreen modes, and explains when offline play is unsupported.

## Complete releases and safe updates

`tools/build-pwa.mjs` inventories the runtime files and derives a release ID from their contents and `tools/service-worker.template.js`. It writes the HTML release marker, `public/pwa-release.js`, and `public/sw.js`.

The service worker downloads assets in bounded batches into a separate cache for that release. It checks successful, non-redirected responses and SHA-256 asset hashes. Pagelove normalizes HTML, so the entry page is checked using its content type and release marker. A completion marker is written only after the entire download succeeds; a failed installation removes its incomplete cache.

The manifest supplies the app name, fullscreen launch preference, colors and regular/maskable icons. Browsers that cannot provide fullscreen fall back to standalone or another supported display mode. The full download includes modules that load later, world previews, the font and scorecard artwork. Procedural music and sound effects need no audio downloads. The world catalog has bundled level definitions as its offline fallback.

New workers wait until the player chooses **Update game** from the start screen. Each open tab identifies its release, and the worker retains the corresponding cache so a later module request cannot mix code from different releases. Release pins survive worker restarts. Cleanup retains caches used by open tabs and a previous complete release. Missing files are not filled with arbitrary newer modules; incomplete downloads can be retried or repaired while connected.

The worker serves the game's entry routes and static runtime assets. It leaves `/scores.html`, `/worlds.html`, selector `Range` requests, and every non-GET request to the network. Shared score writes never enter the static cache.

## Scores and offline state

`public/offline.js` uses IndexedDB for two types of data:

| Data | Behavior |
| --- | --- |
| Leaderboard snapshot | Stores downloaded rows, refresh time and server clock offset; an older snapshot cannot replace a newer one |
| Submission queue | Stores the original run ID, player name, score, world, mode, challenge date and elapsed time before attempting a send |

Queued records use the same unique `runKey` on every attempt. Transactional send leases coordinate tabs; a tab whose lease expired cannot overwrite a later tab's result. Active submissions cannot be removed until their lease ends. A duplicate response is accepted only after a fresh leaderboard read finds the existing run.

Temporary failures retry with exponential backoff, starting at five seconds and capped at five minutes. Reopening or returning to the game and regaining connectivity also trigger syncing. Confirmed validation rejections remain visible with their error, Retry and Remove controls. Storage failures are reported without claiming that an unsaved result is queued. Recent successful receipts prevent accidental repeat sends; receipt cleanup retains at most 100 entries for up to 30 days. Pending or rejected scores are not removed by that cleanup.

An offline Daily Challenge run always keeps its original UTC challenge date, even if submitted on a later day. `submittedAt` is assigned when sending. If an earlier attempt already reached Pagelove, the game uses that existing record's timestamp. Daily board age therefore reflects submission time, while the run stays on its original day's board.

Offline leaderboards display saved standings and their last refresh time. Saved standings can guide the score display, but confirming a top-score celebration requires a fresh server read. When a queued run syncs while its result screen is still open, a confirmed top finish can play its victory scene; syncing old scores does not interrupt another run. The current daily board still rolls over at 00:00 UTC; older entries remain stored on Pagelove.

There is no closed-app background-sync promise. Open the game after reconnecting to send queued scores. Clearing browser storage removes local progress, cached assets and unsent scores; browsers may also evict storage. The install action requests persistent storage where supported, but that request can be denied. A cleared installation must download the game again.

## Optimization and correctness changes

| Area | Change |
| --- | --- |
| Particles and power-ups | Prepare reusable fragments before play, pool materials/objects, reuse textures and recycle finished particles instead of continually rebuilding them |
| Scene synchronization | Mark live objects while iterating, avoiding repeated temporary membership collections and filtered brick lists |
| Physics hot paths | Compact small moving-object arrays in place, reducing allocations during the fixed 120 Hz simulation |
| Rendering | Limit the home scene and reduced-effects mode to 30 frames per second; cap normal rendering at 60 and stop drawing hidden pages while retaining the simulation's fixed step |
| Audio | Reuse a noise buffer, change gain automation only when needed, stop scheduling inaudible music, and disconnect completed voices |
| Checkpoints | Validate saved structures and numeric ranges before changing the running game; reject damaged records gracefully |
| Seeded power-up drops | Save and restore the generator's draw count, preserving the remaining drop sequence after a checkpoint resume |

These changes reduce avoidable allocation and background work. They do not establish a fixed frame rate on every phone, GPU or browser. Existing fresh-ball variation, sticky-paddle behavior, scoring and power-up rules remain part of the game.

## Build and deployment

After completing runtime or asset edits:

```sh
node tools/build-pwa.mjs
node tools/build-pwa.mjs --check
node --test tests/*.test.mjs
```

The check rejects generated files that no longer match the source. Edit the worker template rather than generated `public/sw.js`. Run the builder again after any later runtime change.

The existing publisher checks the generated release before deployment and again before uploading the worker. Its order is assets/modules, `app.js`, `index.html`, then **`sw.js` last**. It serves the manifest with `application/manifest+json` and JavaScript with its proper content type. Normal deployment continues to exclude the live `scores.html` resource and verifies uploaded files by readback.

Keep runtime import/entry-page version parameters current for visitors without a controlling worker. Controlled pages resolve query variants against their complete release cache. The local server supports the manifest MIME type, and loopback supports service-worker development. `/__qa/` fixtures do not register the production-scope worker.

## Validation recorded during implementation

| Check | Evidence and limit |
| --- | --- |
| Automated suites | 36 tests passed in the full suite at this review point, covering the engine, media, queue and worker; later changes should rerun the relevant checks |
| Queue policy and storage acknowledgement | Targeted tests cover concurrent tabs, expired leases, duplicates, retries, validation failures, unavailable storage and transaction commit/abort handling |
| Browser offline launch | After the complete local download, stopping the local server and reloading still opened the game; a cached Daily Challenge started successfully |
| Real browser IndexedDB | A local harness queued an October 12 run, preserved it through a page reload, then used a mock send on October 13; the original challenge day remained intact, `submittedAt` reflected October 13, and repeated sync sent once |
| PWA build | The generated inventory/check reported 48 cached files and approximately 1.92 MB; the builder output is authoritative after subsequent asset changes |

The IndexedDB harness did not write a score to the real Pagelove leaderboard. Automated worker tests use controlled cache/network adapters. Physical Android installation, airplane-mode relaunch, device performance and updates between two installed production releases remain unverified. The existing physical Android-to-Slack receiving-app behavior is also outside these offline checks.
