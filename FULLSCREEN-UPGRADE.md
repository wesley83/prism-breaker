# Phone fullscreen

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
