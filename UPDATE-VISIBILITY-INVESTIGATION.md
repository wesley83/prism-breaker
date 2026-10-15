# Why the update button was easy to miss

Investigation started October 15, 2026 UTC following Wesley's report that the client had never shown an update button.

## Confirmed findings

The existing button worked when a newer release was downloaded, but its placement and automatic checking were incomplete.

On the actual live site, a newly opened tab loaded older cached release `ee6a8edb8f4578dd9b0b`, detected the newer published worker and displayed **Update game**. At a 1280×720 viewport, the button extended from y=699.67 to y=741.67, leaving its bottom outside the screen. It appeared only in the offline status section below the arena. Phone/fullscreen gameplay explicitly hides that entire section through `.game-focus .offline-bar { display:none }`. Settings and the pause menu had no update information.

Automatic checks also depended on startup, reconnect or a visibility change. An app left open and visible had no periodic check; there was no manual **Check for updates** control. A recent foreground check could be skipped by the one-minute throttle.

This reproduces two genuine gaps: discoverability and checks during a long-lived session. It does not establish the service-worker state of Wesley's separate Android installation.

## Corrections

- An available update produces a sticky notice **above the arena on the start screen**, with an immediately usable Update game button. It stays visible while scrolling.
- **Settings → Game updates** always offers Check for updates, with checking, current, downloading, available and failed-check feedback. Its update control shares the same activation safeguards as the original button.
- The pause menu announces a downloaded update and directs the player to the start screen.
- Visible, connected pages check every minute, and focus/reconnect/foreground events check as appropriate. Automatic network checks remain throttled; explicit manual checks bypass the throttle. Hidden pages skip automatic checks.
- Returning to the start screen rechecks pending state and performs an update check when due. Updates still require the player's action and cannot interrupt an active run.

## When no update button is expected

The button appears when an older open page has a newer downloaded release available. If every game window is closed, the browser may activate a downloaded worker before the next page starts. That next launch is already current and needs no update action. This is normal service-worker lifecycle behavior; installation does not guarantee that a button will appear for every release. See [the service-worker lifecycle](https://web.dev/articles/service-worker-lifecycle).

The new placement becomes available after the older client loads this correction. A client still showing the old interface can use the original button by returning to the start screen and scrolling below the arena. After that update, future notices appear above the game and controls are also available in Settings.

## Verification and release status

Four new regression tests initially failed for missing periodic checks, missing synchronized notices, and missing manual-check controls. They pass after correction. An existing timing test was adjusted to let a simulated in-flight check finish before advancing its clock by another minute; concurrent checks are intentionally deduplicated.

The complete suite passes **130 tests across 13 files**. A fifth new regression ensures a failed update download cannot be reported as “up to date.” Browser automatic detection, phone/desktop placement, update application and publication results are recorded in [the dated audit](audit/2026-10-15-update-visibility.md). Before-state screenshot: [clipped live control](audit/2026-10-15-update-before.png). This investigation does not claim physical Android installation testing.

The correction was pushed as source commit `8de366c` and deployed as release **`db427e1e556915bdbc21`**. Public verification at `2026-10-15T01:25:08.174Z` passed for all 70 inventory assets; worker bytes match the local build. The original live cached client upgraded from ee6a8edb8f4578dd9b0b through its footer button, then the revised Settings control successfully reported “You’re up to date.” See [public verification](audit/2026-10-15-update-live-receipt.json), [live browser evidence](audit/2026-10-15-update-live-browser.json), [Settings screenshot](audit/2026-10-15-update-live-settings.png) and [phone notice screenshot](audit/2026-10-15-update-phone.png).
