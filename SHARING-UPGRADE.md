# Platform-aware sharing

## Player actions

Share leaderboard opens an invitation preview for the currently selected board. Copy link remains available directly on the board. Results add Share my score, with the player's score, world, active time and earned speed/pickup bonuses.

The preview offers:

- Share invitation when the browser supports sharing the title, text and URL.
- Copy invitation, including the complete message and selected-board URL.
- Share scorecard only when the browser reports support for the prepared PNG file.
- Save scorecard on mobile or Download scorecard on desktop.
- A selectable invitation if clipboard access is unavailable.

Native sharing is an explicit button action. The game does not choose a destination or send a message automatically. Cancellation leaves the preview open with copy/download options. Only one native sharing request can be active at a time.

## Platform presentation

| Platform | Presentation |
|---|---|
| iPhone / iPad | iOS share-sheet instructions; portrait scorecard; Save scorecard. Desktop-mode iPads are detected through their Mac platform and touch capability. |
| Android phones / tablets | Android share-menu instructions; portrait scorecard; Save scorecard. |
| Windows | Windows share-menu instructions when sharing is available; landscape scorecard; Download scorecard; phone QR code. |
| Mac | AirDrop/Messages/Mail guidance when sharing is available; landscape scorecard; Download scorecard; phone QR code. |
| ChromeOS / other desktop | Available share-menu guidance, landscape scorecard, download and phone QR code. |
| Browsers without native sharing | Copy invitation becomes the primary action. Download and manual copying remain available. |

Operating-system detection affects presentation. Actual link and file-sharing capabilities are checked independently; an OS name does not enable unsupported actions.

## Scorecard generation

Canvas creates 1200×630 landscape and 1080×1350 portrait PNGs using bundled game artwork and fonts. Every image embeds a QR code and the public game hostname. Leaderboard cards use the displayed leader's score, world, duration and rank. Empty boards invite a first record. Personal cards claim a leaderboard rank only when that run appears in the loaded board; Practice cards are labeled Practice.

Daily invitations and cards include their UTC date. Daily links open the current day's board, preserving existing rollover behavior. Preview content is a snapshot of the displayed record/result when opened.

The QR encoder is qrcode-generator 2.0.4, bundled at `public/vendor/qr.js` with its MIT notice at `public/assets/QR-LICENSE.txt`. Run `node tools/build-qr.mjs` after installing dependencies to rebuild it. No external QR, image-rendering or sharing backend is used. Blob previews/downloads are generated locally, and preview blob URLs are released on close.

The CSP allows locally generated blob images. Deployment sends assets/modules before the app and entry page. Older cached entry markup can still copy leaderboard links while the new entry page is released.

## Review evidence and limits

Manual browser review covered the desktop invitation, complete-message copying, PNG downloading, portrait personal-result preview at 390px, portrait PNG dimensions and download, and platform-specific labels. PNGs were visually inspected at full resolution. Local preview records were not submitted to the public leaderboard. Platform presentation previews use the desktop browser's real capability checks; they do not establish behavior in every physical OS share picker. Available destinations remain controlled by the browser, OS and installed apps.

## Android invitation compatibility and readable dates

Android invitation sharing now supplies the message and link together in one text body, without a separate URL field. Copy invitation uses the same complete message. Scorecard shares include the invitation text and link, and capability checks use the complete file-and-text payload.

Daily leaderboard invitations, personal score invitations and PNG scorecards format the UTC challenge date with a full month name, such as October 13, 2026 (UTC). Raw challenge keys remain ISO dates. Leaderboard invitations use “Daily Challenge for [date]” rather than a trailing numeric timestamp.

Reviewed the local share preview and published preview. A physical Android-to-Slack handoff is unavailable in this workspace; receiving apps still control how they display the shared payload. Automated suites were not run.
