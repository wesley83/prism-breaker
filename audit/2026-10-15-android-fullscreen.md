# Android installed fullscreen investigation

## AF-01 — Plan

- UTC: 2026-10-15T19:40:43.3012735Z
- Actor: Codex.
- Request: Wesley reports that the installed Android PWA does not open fullscreen.
- Plan: Inspect manifest and gesture/fullscreen controller, compare the public manifest and active release references, consult current primary browser documentation, and identify visible browser/system controls and installation browser from the user's device evidence. Correct a demonstrated application issue if established; do not claim physical-device verification from source inspection.
- Boundaries: Public read-only requests; preserve scores and policies. No deployment or reinstall/storage reset. No game tests requested in this turn, so do not run/add tests. Record findings and unresolved device details.
- Retrospective inspection: Initial source/doc reads occurred before this audit file was created; no implementation changed. PowerShell wildcard rg paths and an assumed main.js path failed; explicit directory searches/source filenames replaced them. Honcho tools unavailable.
- Files: This audit, sanitized live receipt, any scoped correction and assessment documentation if supported by findings; review patch and hashes.
- Verification: Pending; device screenshot/browser details requested asynchronously.

## AF-02 — Live configuration confirmed; device diagnosis pending

- UTC: 2026-10-15T19:41:57.8751169Z
- Actor: Codex; reference AF-01.
- Clarification: Wesley can enter fullscreen with the button but wants fullscreen immediately when opening the installed Android app. This is a reported failure of automatic launch behavior, not a passing hardware check. Browser/version, exact visible chrome and installed metadata are still unknown.
- Live evidence: Public root and manifest each returned 200. Root links to /manifest.webmanifest and release d77abd4a8738088292f7. The manifest has display=fullscreen, id=/, scope=/, start_url=/?source=installed and application/manifest+json content type. Receipt: audit/2026-10-15-android-fullscreen-live.json. No live mutation performed.
- Source inspection: display.js requests native fullscreen from phone start taps and manually from its button, with navigationUI=hide. It skips the API when display-mode reports fullscreen, and its phoneFocus flag also represents CSS-only expansion. These are possible follow-up areas for button behavior, but do not establish the cause of this reported installed-launch failure. No source correction is justified solely by the report yet.
- Primary references: https://web.dev/articles/manifest-updates documents Android WebAPK metadata refresh separately from service-worker updates and lists display as a triggering field. Its documented diagnostic is about://webapks. https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/display distinguishes manifest display from the Fullscreen API and permits browser overrides. https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen requires transient user activation. Sources read October 15, 2026.
- Conclusion: Manifest already requests fullscreen. A startup API call cannot reliably replace installed display-mode behavior. Stale installed metadata or browser handling is a hypothesis, not a confirmed diagnosis. Need installation browser and device evidence before choosing a fix. Do not advise uninstalling or clearing game data as the first diagnostic step.
- Changes: Audit and sanitized public receipt only; no runtime, manifest, test, score or policy changes. No tests run, no deployment or push. Prior investigation files retained. This entry records the clarified remaining work rather than claiming resolution.
- Lookup correction: Additional guessed worker paths/wildcards were unavailable; pwa.js and the existing public/sw.js supplied the relevant source references. No remote side effects.

## AF-03 — Installation browser identified

- UTC: 2026-10-15T19:43:22.9746787Z
- Actor: Codex; reference AF-01/AF-02.
- User clarification: Installed using Edge on Android.
- Plan continuation: Research Edge-specific documentation before prescribing browser-internal update steps. Obtain Edge version, Android version and a screenshot before manual fullscreen to distinguish browser chrome from Android system bars or game layout. No reinstall/data removal required for this evidence.
- Research: Microsoft PWA overview https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/ and mobile FAQ https://support.microsoft.com/en-us/microsoft-edge/microsoft-edge-for-mobile-faqs-29296eab-b76f-4a87-ac9c-9835da53465d were surfaced by web search. Reviewed search evidence did not establish a supported Edge-Android-specific fullscreen repair or confirm this as an Edge defect. Chrome's WebAPK update procedure from AF-02 must not be presented as verified for Edge.
- Assessment: Live manifest fullscreen configuration remains confirmed by the prior public receipt. Installed launch failure is user-reported; cause remains unknown. Need device screenshot and versions to distinguish installed metadata, browser handling and application layout. Do not claim a code fix or successful native verification.
- Changes: Audit/evidence packaging only. No runtime changes, tests, deployment or remote mutations. Earlier evidence preserved.

## AF-04 — Screenshot and Edge version evidence

- UTC: 2026-10-15T19:47:29.1073370Z
- Actor: Codex; continuation of AF-01 investigation.
- User evidence: Edge 155.0.4283.48 and Screenshot_20261015-154457.png. Screenshot shows the opening screen, no visible address bar or browser toolbar, and a large uniform dark-gray strip above the game background. It does not expose runtime display-mode or prove which layer owns the strip. Screenshot remains outside the public repository.
- Source inspection: Opening-screen body margin is zero; shell has horizontal padding and no corresponding top spacer. Viewport already declares viewport-fit=cover. Fullscreen display remains in the manifest. No matching deliberate page gap was found. A browser/Android window or camera-cutout exclusion is a plausible explanation, not confirmed.
- Research: Chromium's current display-cutout architecture describes browser/Android handling of viewport-fit and fullscreen window flags: https://chromium.googlesource.com/chromium/src/+/HEAD/docs/ui/android/display_cutout.md . A firsthand 2023 Microsoft Q&A report describes similar Edge Android notch gaps, but its response could not reproduce them; it is not confirmation of an Edge 155 defect: https://learn.microsoft.com/en-us/answers/questions/1181335/why-viewport-fit-cover-in-my-pwa-webapp-do-not-str . No supported current Edge-specific fix established.
- Next evidence: Compare the same start screen after the fullscreen button, and identify phone model/Android version. This distinguishes disappearance of the excluded area from a change in the game's layout. No reinstall/cache clearing prescribed; no blind CSS offset or startup API request added.
- Change batch: Audit and evidence hashes/patch only. No runtime change, test, deployment or remote mutation. Missing guessed CSS paths in the first search were corrected by enumerating actual CSS files; explicit style.css extraction supplied the layout evidence.

## AF-05 — Plan: record the paired device evidence

- UTC: 2026-10-15T19:50:54.5652821Z
- Actor: Codex; references AF-01 through AF-04.
- New evidence: Wesley identifies Pixel 11 Pro, Android 17, with Edge 155.0.4283.48 already supplied. The follow-up screenshot is supplied in response to the request for an after-fullscreen image.
- Plan: Compare the visible strip before/after; add a scoped open issue to BUG-LOG.md and correct the remaining-work assessment from no devices available to partial user-supplied evidence. Preserve original audit entries and do not claim the fourteen formal procedures are complete. No runtime workaround without a demonstrated mechanism.
- Verification plan: Review document diff and evidence boundaries; package hashes and safe mirror copies. No automated or physical-device tests run in this change batch.

## AF-06 — Device finding logged; acceptance scope corrected

- UTC: 2026-10-15T19:51:22.2970192Z
- Actor: Codex; reference AF-05.
- Changes: Added PB-003 to BUG-LOG.md with reported hardware/browser, reproduction from paired screenshots, expected behavior, uncertainty and next comparison. Updated REMAINING-WORK-IMPLEMENTATION.md to acknowledge partial Android evidence instead of stating no device is available. Formal acceptance procedures remain uncompleted.
- Result: The top gray strip persists at approximately the same relative size in both supplied images. Page presentation changes do not prove native fullscreen state or strip ownership. Do not claim the fullscreen button fixes the excluded area. Next useful isolation is a separate Chrome installation on the same phone, preserving Edge and its data, or direct runtime geometry capture.
- Verification: Reviewed text against screenshots, prior public manifest receipt and source inspection; no automated tests run. Mirror preflight baseline hashes match. Task patch and SHA-256 evidence refreshed, with mirror equality checked. Runtime/deployment unchanged. Issue remains open; no support message sent.
