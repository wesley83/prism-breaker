# Phone fullscreen

## Touch ownership � November 16, 2026

Phone gameplay now uses a fixed, non-scrolling stage independently of API fullscreen. Declined requests and explicit fullscreen exits retain that layout; an exit still pauses play and suppresses automatic re-entry. The former standard-layout toggle is no longer offered during phone play because it could restore page scrolling. Back to start screen restores the ordinary document layout.

The entire non-control stage, including HUD and lower margins, accepts one steering contact. Buttons, inputs and dialogs keep their own actions. Browser toolbar/viewport resize does not release pointer capture. Unexpected capture loss, pointer cancellation, focus loss or orientation change during an active drag releases it and opens Pause. Normal release and intentional menu opening do not create a second pause. Layout-triggered drawing-buffer resizes run immediately before a render to avoid clearing the canvas between rendered frames. No global zoom restriction was added: dialogs and cinematic text keep native scrolling/zoom.

Regression coverage and browser measurements: [touch surface audit](audit/2026-11-16-touch-surface.md). Physical Android browser/PWA finger gestures still need confirmation. This supersedes the standard-layout option described in the historical October 15 entry below.

## Button gestures — October 31, 2026

On phones and in installed app windows, ordinary button actions also request API fullscreen, including navigation, settings, leaderboard and dynamically created world controls. The delegated handler runs after the button's action in the same trusted click task. It does not cancel, delay or replay that action. Keyboard activation of a button qualifies; synthetic clicks and ordinary desktop browser tabs do not.

An installed `display-mode: fullscreen` window can still request API fullscreen from a button gesture. The manifest mode alone does not establish that the operating system hides every system area. Browser refusal remains possible; automatic failures are silent and a later button gesture can retry. This is a gesture-based fallback, not a promise of fullscreen before the first interaction.

Native share, copy, scorecard download and installation buttons declare `data-fullscreen-skip` to reserve their gesture for those APIs. Fullscreen and layout controls handle themselves. A button-entered fullscreen session stays open when returning to the start screen. Explicit or system fullscreen exit suppresses incidental button-driven re-entry until a new play action or explicit fullscreen request; this supersedes the older return-home behavior below for button-entered sessions.

Behavioral coverage includes home navigation, installed fullscreen and standalone windows, desktop exclusion, dynamic controls, synthetic/canceled/disabled clicks, reserved gestures, explicit/system exits, rejection retries and unavailable APIs. Real phone/installed-OS behavior still requires device validation.

Installed apps now prefer fullscreen through the manifest. The browser uses its supported fallback when this display mode is unavailable. The operating system may retain status or gesture areas, especially on iPhone; JavaScript cannot force those away.

On phones, Start adventure, Daily Challenge, Continue adventure, Play again and Practice request fullscreen synchronously from the player's tap. Desktop starts retain their normal page layout. The request targets the document root so settings, leaderboards, result forms and sharing dialogs remain in the fullscreen tree.

The game fills the available phone viewport even when the native request is declined. Gameplay reserves space above the canvas for its score display and below it for progress and Launch ball. Portrait and landscape use separate spacing. Notches and gesture areas use `env(safe-area-inset-*)`, and the renderer measures the actual canvas after layout or orientation changes.

Pause includes Settings and a fullscreen toggle. Closing settings returns to the existing pause menu. The arena's fullscreen control remains accessible during cinematics; its placement changes to avoid the Skip control and captions. Exiting fullscreen pauses an active ball game and is respected until the player explicitly re-enters or starts another run. Returning to the start screen exits browser fullscreen owned by the game. An installed app can retain the operating system's fullscreen window while returning to the ordinary start layout.

Verification recorded October 13, 2026:

- Six controller regressions cover synchronous root requests, declined requests, desktop starts, installed fullscreen, system exit and returning home.
- Browser review exercised real fullscreen entry, pause, nested settings, closing settings back to pause and fullscreen exit.
- An authored local fixture with native fullscreen disabled exercised the viewport fallback at 390×844 and 844×390. Progress and launch controls did not overlap after the spacing adjustment; browser logs showed no rendering errors.
- Physical Android/iPhone launches and device-specific notch values remain unverified. Manifest changes for an already-installed app can require a later browser-managed manifest refresh; the start-tap request still provides supported fullscreen gameplay.

Runtime edits require rebuilding the complete offline package with `bun tools/build-pwa.mjs` before publishing. Normal deployment preserves the live leaderboard.

## Firefox for Android review — October 15, 2026

Scope: documentation and source inspection, not a physical Firefox run. The reported Edge issue is on Pixel 11 Pro / Android 17 / Edge 155.0.4283.48. No Firefox result has yet been supplied for that device. This review does not certify the full game or establish that Firefox eliminates the gray strip.

### Supported path

Mozilla documents installation from the browser menu: visit the game, open the three-dot menu, choose **Install**, then add the icon to the home screen. Menu wording can vary by version. Use the installed icon for the launch comparison. [Mozilla installation instructions](https://support.mozilla.org/en-US/kb/use-web-apps-firefox-android).

Current MDN browser-compatibility data records Firefox Android support for manifest `display: fullscreen` from version 47. This differs from desktop Firefox's manifest support; a desktop Firefox check cannot establish installed Android behavior. Our existing manifest requests fullscreen and needs no Firefox-specific replacement. `display_override` is not supported there, so adding it is not a Firefox fullscreen fix. [Manifest compatibility data](https://github.com/mdn/browser-compat-data/blob/main/manifests/webapp/display.json), [override compatibility](https://github.com/mdn/browser-compat-data/blob/main/manifests/webapp/display_override.json).

The standard `requestFullscreen()` API and its Promise return are supported. The `navigationUI` option is not supported in Firefox according to the reviewed data; it must be treated as an optional hint, not a guarantee that Android system areas disappear. Retaining the option for browsers that support it is reasonable. Unsupported dictionary options do not, by themselves, establish that the fullscreen call fails. Fullscreen still requires a user gesture; a page-load request is not a reliable workaround. [API compatibility](https://github.com/mdn/browser-compat-data/blob/main/api/Element.json), [API requirements](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen).

The reviewed data also lists support for ServiceWorkerContainer, CacheStorage and WebGL2RenderingContext. The source uses these standard capabilities for offline play and rendering. Their availability supports an expectation of compatibility, not proof of successful gameplay, cache retention, graphics-driver behavior or update handling on a particular phone. [Saved compatibility excerpts](audit/2026-10-15-firefox-compatibility.json).

### Adjustments recommended

1. **Make installation help specific to Firefox Android.** Firefox does not implement `beforeinstallprompt` or `appinstalled` in the reviewed compatibility data. The existing game safely falls back to installation instructions, so installation is not blocked. Improve the button/help wording to say **How to install** and direct Firefox users to its browser menu when no native prompt is available. Preserve capability-based handling and avoid implying that every missing prompt identifies Firefox. [Event compatibility](https://github.com/mdn/browser-compat-data/blob/main/api/Window.json).
2. **Separate actual fullscreen state from the phone layout fallback.** In `public/display.js`, `phoneFocus` is set before the fullscreen request resolves, and `refresh()` treats it as expanded even if the request is rejected. The button then says **Exit fullscreen view**, and its next click turns off the layout rather than retrying native fullscreen. Model native fullscreen, installed display mode and viewport-filling layout separately. When native fullscreen is unavailable, label the layout action accurately and keep an explicit fullscreen retry available when supported. This is a general controller issue, not a Firefox-only defect or an established explanation of the Edge gray strip.
3. **Keep an explicit manual request available.** The request helper currently returns immediately when the display-mode query says fullscreen. That can prevent a manual attempt to enter API fullscreen independently of the installed window mode. Keep automatic requests conservative, but permit a deliberate user request when `document.fullscreenElement` is absent and the API is available. Do not automatically re-enter after the user exits. This is a resilience improvement; it is not a verified cutout workaround.

No runtime adjustment has been implemented or deployed as part of this review. Keep the existing `display: fullscreen`, `viewport-fit=cover`, safe-area layout and gesture-triggered API path. Do not apply negative top offsets to hide the gray strip.

### Remaining device check

Install the game separately through Firefox while retaining Edge and its data. Compare icon launch before any tap, the fullscreen button, Start adventure, portrait/landscape, return from background, and an offline reopen after **Ready to play offline**. Record the Firefox version and whether the upper strip persists. If it does, collect actual display-mode, fullscreenElement, viewport/screen dimensions and safe-area values to distinguish browser-window handling from page layout. A different result narrows the cause; it does not alone prove an Edge defect.

Audit: [Firefox review](audit/2026-10-15-firefox-review.md). The fourteen formal hardware/human procedures remain uncompleted.

## Implemented follow-up — October 15, 2026

The three recommendations above are now implemented in source. Installation buttons say **How to install** until a native prompt is available, and Firefox Android receives its own browser-menu instructions. Capability detection still controls native prompting; browser identification only selects help text.

Fullscreen button labels now reflect API fullscreen, with **Opening fullscreen…** while a request is pending and **Fullscreen unavailable** when the API cannot be used. A failed automatic request retains the phone layout but does not show an exit-fullscreen label. The pause menu has a separate **Use standard layout / Use screen-filling layout** action when phone gameplay is outside API fullscreen. The fullscreen button retries native entry on a deliberate tap, including in an installed fullscreen window. Automatic starts continue to skip redundant installed-mode requests, and leaving fullscreen does not trigger automatic re-entry. Returning home invalidates an outstanding entry request and exits it if it completes late.

The optional navigationUI hint remains for browsers that honor it; no promise of hidden Android system areas is added. The existing controller fixture and declined-request expectation were adjusted for the separate layout control, but no tests were added or run for this implementation request. The offline package was rebuilt; physical Firefox/Edge verification and deployment remain pending. These changes do not establish a fix for PB-003's gray strip.

Implementation audit: [fullscreen improvements](audit/2026-10-15-fullscreen-implementation.md).
