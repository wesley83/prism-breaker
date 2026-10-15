# PWA robustness review

Reviewed October 15, 2026 UTC by Codex, at Wesley's request. This review combines source inspection, primary browser documentation, failure-injection tests, a real Chromium browser lab, and read-only checks of the deployed Pagelove release.

## Result and release boundary

The PWA already had a sound foundation: separate release caches, verified downloads, explicit update activation, durable score submissions, and protection for active games. This review found and corrected failure paths involving lost caches, release identity, recovery messages, installation state and connectivity hints.

**125 automated tests pass across 13 files, including 24 added tests.** The generated production package is **`5408c3b2c91090457ef8`**, with 70 assets and 2,412,780 bytes before storage overhead. The builder's consistency check passes.

**These corrections are local, not deployed or pushed by this review.** A live read at `2026-10-15T00:33:28.140Z` verified all 70 assets of the currently deployed release, `ee6a8edb8f4578dd9b0b`. No production scores, world documents, policies or registrations were changed. Local browser fixtures have different release IDs because they include a diagnostic panel.

## Confirmed findings and corrections

| Area | Failure or gap | Correction |
| --- | --- | --- |
| Offline readiness | A completion marker could survive a missing asset and incorrectly report readiness. | Readiness checks the complete path inventory. Older count-only markers remain compatible, with count and entry-page checks. |
| Startup after partial eviction | A cached entry document could start even though required modules were missing. | Navigation uses the cached entry only when its release inventory is complete; a fresh online navigation can recover through the network. |
| Release isolation | After a worker restart, an old tab with an evicted cache could silently switch to the newest release. | A client's release pin survives independently of asset availability. Missing modules fail explicitly instead of being replaced by another release. |
| Lost client pins | Unknown clients defaulted to the latest release. | The worker asks the existing page to identify its release, with a 1.5-second deadline. An unidentified tab fails safely; it is never guessed to be current. |
| Cache repair transition | Fresh network pages must keep loading network modules while their complete cache is being repaired. | Network identity is retained until the verified release is available. |
| Storage and metadata failures | Broken JSON or unavailable CacheStorage could abort activation or online recovery. | Metadata parsing is defensive; optional pruning cannot block activation; fresh online navigation works even when persistent cache access fails. |
| Download hangs | Fetches and response-body reads had no application deadline. | Asset downloads abort after 20 seconds; the release download has a 75-second overall deadline. Failed downloads cannot publish a completion marker. Browser storage operations themselves are not abortable by Fetch. |
| Waiting-release loss | Cached assets can disappear after an update reaches the waiting state. | Explicit activation rechecks the inventory and attempts repair first. Failed repair leaves the previous worker active. |
| Repair races | A late repair response could overwrite the readiness state of a newer controller. | Inspection generations and worker-specific repair promises prevent stale results from updating the interface. |
| Recovery feedback | A missing older release could stay on “Preparing offline play”; reconnect checks did not recheck cache completeness. | Missing releases show an actionable unavailable/update state. Foreground and reconnect events inspect readiness and repair the current release when possible. Hidden tabs do not initiate those checks. |
| Install controls | The install button could reappear after `appinstalled` and a later render. | Installation confirmation is retained for that page session, alongside installed-display detection. |
| Connectivity hints | Explicit score retry and offline-download retry could be blocked by a false `navigator.onLine` value. | Explicit retries attempt the bounded request. Automatic queue retries still use the hint and backoff. Leaderboard reads use actual request results, including duplicate-submission confirmation. |
| IndexedDB connection lifecycle | A delayed close event from an old connection could discard a newer connection promise. | Close/version-change handlers clear only their own connection identity. |
| HTML/module identity | A separately HTTP-cached release module could identify a new HTML page as an old release. | The validated HTML release marker takes precedence. Updated entry-module query versions also avoid reusing changed bootstrap code from HTTP cache. |
| Manifest metadata | The description still advertised eight worlds. | It now says sixteen. Fullscreen, stable app identity, scope and installed start URL are retained. |

Additional regression coverage protects against quota failures, damaged entry-page downloads, optional unknown asset requests invalidating an otherwise complete cache, and cache cleanup touching another application's caches.

## What was inspected and verified

| Area | Evidence |
| --- | --- |
| Install integrity | Failed fetch, mismatched asset hash, wrong HTML release, quota failure and stalled download tests; new release remains unusable while previous release survives. |
| Update lifecycle | Explicit activation, active-run guards, repeated clicks, failure/timeout recovery, late activation, preparation races, and one reload per user-approved update. |
| Multi-tab behavior | Atomic queue leases and stale-lease protection; old static assets retained under a new controller; persisted pins and missing-pin recovery. |
| Cache ownership | Cleanup retains open clients' releases and recent releases, preserves unknown clients conservatively, and only deletes this app's cache namespace. |
| Network boundaries | Score reads/writes, non-GET requests, selector Range requests, world documents, editor routes, QA routes and cross-origin requests bypass static caching. The workshop's inline bootstrap explicitly requests network assets. |
| Offline content | Generated inventory covers literal local module imports, world bundle, textures, previews, font, scorecard assets and procedural audio code. Authoring documents remain online resources. |
| Queue durability | Commit-before-acknowledgement, transaction abort, unavailable storage, receipt-write failure, duplicate run identity, original Daily Challenge date, backoff, manual retry, permanent rejection and safe removal. |
| Manifest/install | Stable `/` app ID and scope, fullscreen display preference, `/?source=installed`, in-scope shortcuts, valid declared PNG dimensions, separate maskable icon and Apple web-app metadata. |
| Phone display | Existing six tests verify synchronous start-gesture fullscreen requests, denied-request fallback, installed-fullscreen handling, system exit and home navigation. |
| Build/deployment | Deterministic inventory and release ID; stale-output check; publisher checks before upload and again before `sw.js`, which is uploaded last. Ordinary publication excludes shared score records and separately handles world documents. |
| Wider regression | All sixteen worlds, physics, checkpoints, document parsing, ruleset isolation, daily rollover and score expiry tests still pass. This is automated coverage, not another manual playthrough of every world. |

### Real-browser scenarios

The isolated lab used `http://127.0.0.1:4174/`; it rejects production-style score writes and stores its data on that separate origin.

1. A previously cached eight-world lab release updated to the revised sixteen-world release. A checkpoint, Classic Mode and one existing disposable queued score survived.
2. With a required asset returning 503, installing release B failed. Release A remained ready and the interface offered **Retry download**.
3. Restoring the route and retrying produced a waiting update. Applying the already downloaded update with network routes returning 503 succeeded.
4. A second tab stayed on release A under B's active worker. Its module probe returned A's version; that tab did not reload unexpectedly.
5. Removing a scene asset changed worker readiness to false. The reconnect handler repaired the download and restored readiness.
6. After the local server process was stopped entirely, reloading the game still worked and the cached Daily Challenge opened world 13, Thunder Spire. Shared standings correctly became unavailable.
7. Final-source update and offline smoke checks are recorded in the appended browser evidence.

The server-503 scenario leaves `navigator.onLine` true; it tests actual request failure rather than OS airplane mode. The separate stopped-server scenario verifies connection refusal and cached page reload. Automated tests exercise both values of the connectivity hint.

Evidence: [browser observations](audit/2026-10-15-pwa-browser-evidence.json), [offline screenshot](audit/2026-10-15-pwa-offline-proof.png), [test output](audit/2026-10-15-pwa-tests.txt), [live release receipt](audit/2026-10-15-pwa-live-receipt.json), and [audit trail](audit/2026-10-15-pwa-robustness.md).

## Current web guidance applied

- **Protect pages across worker updates.** A new worker can control an old page, so release compatibility must be deliberate. Prism Breaker keeps explicit user activation and pins each page's assets instead of replacing files underneath active play. [web.dev: Service worker lifecycle](https://web.dev/articles/service-worker-lifecycle), [web.dev: Updating a PWA](https://web.dev/learn/pwa/update).
- **Treat storage as fallible.** Cache and IndexedDB writes can fail, and browser-managed storage can be evicted. The game now checks inventory presence, handles cache failures and requests persistence where available; it cannot guarantee that unsent data survives a user clearing storage. [MDN: Storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria), [web.dev: Persistent storage](https://web.dev/articles/persistent-storage).
- **Use connectivity information as a hint.** A browser's online flag is not an authoritative reachability test. Explicit retry now attempts the request and uses its result. [MDN: Navigator.onLine](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine).
- **Bound downloads and handle database lifecycle events.** Fetch abortion covers requests and response bodies; IndexedDB connections need orderly version-change handling and transaction completion acknowledgements. [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController), [MDN: Using IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB).
- **Keep installation and background behavior platform-aware.** Display modes can fall back, and background capabilities vary across browsers. The implementation retains fullscreen as a preference and makes no closed-app score-sync promise. [MDN: Manifest display](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/display), [MDN: Offline and background operation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation).

## Remaining limits and follow-up verification

**Physical-device checks remain necessary.** This review did not install and launch the app on an Android phone or iPhone, kill/restart an installed process, simulate OS storage pressure, or validate native share-sheet receivers. Before calling those paths verified, check Android Chrome and iOS Home Screen launch, airplane-mode relaunch, update from the previous production version, OS background termination, and restoration of a queued score after reconnecting. Safari and Firefox runtime behavior were not exercised by the Chromium lab.

Storage eviction can still remove assets, checkpoints and unsent scores. Persistence is a browser decision. The app detects recoverable cache loss, but cannot reconstruct deleted personal data. Readiness validates presence, not a fresh cryptographic scan on every fetch; download hashes protect installation integrity without adding repeated hashing to play.

Scores synchronize while the app is open. No external sync service or mandatory browser-specific background API was added. The review did not repeat live score insertion/deletion; earlier final acceptance covers the real provider write path, while this review checks queue behavior locally.

The live worker is served with `Cache-Control: public, max-age=300`; registration already uses `updateViaCache: 'none'`. Root placement needs no broader `Service-Worker-Allowed` header. The live response lacked `X-Content-Type-Options`; serving `nosniff` would be useful host-level hardening, but correct JavaScript/manifest MIME types were verified. CSP is supplied by the game document's meta policy; this review did not modify Pagelove header policy.

Public assets are uploaded sequentially, not as an atomic server-side release. Hash/HTML checks prevent a mixed download from becoming offline-ready, and entry-module version bumps reduce ordinary HTTP-cache mismatch. A first uncontrolled visitor can still arrive during the publication window. Fully eliminating that window would require immutable release URLs or an atomic platform publish mechanism. No claim of atomic deployment is made.

The previously documented DAV trigger/policy propagation limitation is a separate Pagelove server issue. These client PWA corrections do not fix or conceal it. Five-day score expiry remains the established model: expired rows are hidden at the boundary and physical cleanup occurs on access; this review adds no scheduler.

## Reproduce the checks

```sh
bun tools/build-pwa.mjs --check
bun test ./tests
bun tools/update-lab.mjs
# Open http://127.0.0.1:4174/ and use the visible diagnostic controls.

# Optional read-only public-host check; writes a local audit receipt only:
bun tools/check-live-pwa.mjs
```

The lab is intentionally excluded from the published game. Its added cache-loss controls operate only on its loopback origin. Browser caches from prior lab runs are retained, allowing realistic migration tests. Stop the server to reproduce cached navigation without any network response.
