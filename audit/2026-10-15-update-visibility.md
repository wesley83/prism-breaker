# Update button visibility investigation

## UV-01 — Investigation plan

- UTC: 2026-10-15T01:14:00Z
- Actor: Codex
- Request: Investigate why the client has never displayed the promised update button.
- Plan: Trace version detection, worker lifecycle events, update controls and phone/fullscreen layout. Inspect the deployed page and reproduce an old-to-new release with ordinary browser use, including foreground timing and installed layout. Establish which absence is expected and which behavior is defective. Correct confirmed detection/discoverability gaps with focused regression coverage, retain active-run protection, regenerate the PWA, and document evidence. Deployment/push authorization from the immediately preceding release remains available for necessary scoped corrections.
- Files planned: public/pwa.js, index.html, style/display CSS, app integration as needed, matching tests and isolated update lab; generated PWA files and dated evidence/report.
- Initial state: Clean HEAD aea82e2; published release 5408c3b2c91090457ef8. Prior update tests demonstrate an explicit manual lab check can surface the button; automatic detection and user-visible placement require investigation. No conclusion about the user's physical Android app yet. Honcho context tools are unavailable.
- Verification: Pending; source tracing begun, no runtime edits yet.

## UV-02 — Confirmed causes and correction plan

- UTC: 2026-10-15T01:17:00Z (approximate minute)
- Actor: Codex; reference UV-01.
- Live reproduction: Newly opened production tab served cached page ee6a8edb8f4578dd9b0b. Its automatic update detection found the deployed newer release and showed the existing button. At viewport 1280×720, the button occupied y=699.67–741.67: its bottom was outside the visible screen. Settings offered no update controls. This demonstrates successful detection with poor discoverability on an actual older client; it does not establish the state of the user's separate Android installation.
- Source causes: Update control exists only in the below-arena offline bar; display.css hides that bar completely during phone/fullscreen game-focus. Checks run at startup, online and visibility events, with a one-minute throttle; there is no periodic check while the app remains open, no focus check and no manual check control.
- Expected lifecycle: A fully closed app can receive the new worker before the next page starts, so an update button is not guaranteed on every release. The button is for an older open page with a downloaded waiting/newer release. This expected case must be distinguished from the confirmed layout/detection gaps.
- Implementation plan: Add a conspicuous sticky update notice above the arena on the start screen; add Check for updates and synchronized update controls/status in Settings, plus a pause-menu notice. Add visible-tab periodic and focus checks, retain throttling and active-run activation protection, and check again on return to the start screen. Verify detection without using the lab's manual Check button, notice geometry at phone/desktop sizes, manual-check outcomes, and safe update application. Record before/after screenshots and regenerate/release scoped runtime changes after verification.

## UV-03 — Implemented and verified

- UTC: 2026-10-15T01:22:32Z
- Actor: Codex; reference UV-01/02.
- Changes: Added sticky start-screen update notice, synchronized Settings update controls and manual check/status, pause notice, periodic visible-page checks and focus/return-home checks. Retained one-minute automatic throttling and explicit safe-screen activation. Updated bootstrap query versions, regenerated PWA files, documented expected closed-app activation behavior and the older-client one-time update path.
- Tests: Four new tests failed first, then passed. One prior test initially failed because it advanced fake time while a check was still in flight; awaited completion before the second minute, preserving deduplication. An additional failed-download feedback test then reproduced an incorrect “up to date” label; added failed-download status precedence. Final suite 130 pass / 0 fail across 13 files; build and diff checks pass. Final production-source release db427e1e556915bdbc21, 70 assets / 2,416,597 bytes.
- Browser: Lab A c7e59653a2b252bf96b7 automatically detected B ebb648f339435f994a1c after server switch, without using either manual check. Notice visible on start screen. At 390×844, notice remained y=8 after scrolling; button bottom y=73.67. Settings and pause announced update; Settings activation disabled during an adventure. Returning home and clicking the new notice applied B, preserving checkpoint/preferences/queue. Manual check reported current version and an actionable error with server 503. Browser evidence covers initial source 695c52b85df113fdb1ba; the final additional failed-download-label branch is covered by its regression test, with final live integration check planned after deployment.
- Tool/reproduction exceptions: An initial wait for automatic detection expired before a qualifying periodic cycle; the next observation showed the notice without manual intervention. A missing browser variable was corrected by acquiring the existing browser-2 handle. A Settings locator matched both header and pause controls; used the observed pause-settings ID. These were harness timing/selection issues, not hidden production fixes.
- Evidence: update-before.png, update-phone.png, update-browser.json and update-tests.txt under this dated audit prefix. Temporary viewport reset, local server stopped; browser tabs will be closed after live verification. No score/world-policy mutation.
- Release plan: Commit and push reviewed source plus this evidence, publish using the existing score/world-preserving publisher with sw.js last, verify all public inventory files and the new live Settings controls, then archive deployment/verification receipts and mirror scoped files.
