# Gameplay, cinematics/audio and accessibility review

Reviewed October 15, 2026 UTC by Codex. Source baseline: `75b5af4ad24b4f0a00341a698eb085b7034d4cfc`; runtime identity: `fae02ab6c0bf2e26a92a`.

## Assessment

**Implementation update, October 15:** ER-01 through ER-04 are corrected in the subsequent [fix audit](audit/2026-10-15-experience-fixes.md). The original findings below remain as historical evidence. The fixes restore gameplay focus, animate all sixteen champion gems, make every ending explicitly advanced with persistent text and pause controls, and generalize brick guidance. Browser regression covered all sixteen transitions, record/Daily holds, nested modal focus and narrow layout. Release verification is recorded in that audit. Human/device acceptance remains separate.

The agent review is complete. It found **four actionable issues**, including two reproducible implementation bugs. Fix the keyboard-resume issue first, then the incomplete Adventure victory animation. Improve story pacing/accessibility and update the brick guide next.

This is a separate review pass by the coding agent, **not an independent human review**. Human campaign difficulty, perceived audio quality, motion comfort, large-text behavior and screen-reader acceptance remain open. No gameplay code or production content was changed during this review. No score was submitted to the production leaderboard.

## Findings

### ER-01 — P1: Resuming through the Pause button leaves keyboard play blocked

**Reproduce:** Start or continue Adventure; activate the visible **Pause game** button; activate **Back to the game**; press Space. The pause menu opens again instead of launching the held ball. Focus remains on `#pause`. With an active ball, gameplay resumes while keyboard steering is ignored until focus is moved away from the button.

**Cause:** The dialog close handler resumes the game without focusing its canvas. The keyboard handler deliberately ignores events from buttons and links. Native dialog focus restoration therefore returns the player to a control that consumes Space. Sources: [app.js](public/app.js), lines 167, 170 and 193. Starting a game correctly focuses the canvas at line 121; the missing step is the resume path.

**Recommended fix:** When the last gameplay modal closes, restore focus to the arena before resuming. Preserve normal focus return for home dialogs and nested pause/settings dialogs. Add regression coverage for mouse and keyboard activation, held and moving balls, Space, arrow keys and A/D. Confirm nested Settings returns to the pause menu before the final resume moves focus to the arena.

**Evidence:** [Observed focus sequence](audit/experience-review-2026-10-15/keyboard-focus.json), [reopened pause menu](audit/experience-review-2026-10-15/keyboard-pause-reopened.png). Pausing with P from the canvas and closing with Escape worked in the separate keyboard path.

### ER-02 — P2: Adventure record animation positions only eight of sixteen world gems

**Reproduce:** Preview the Adventure top-score ending. Inspect its gem positions after animation starts. Worlds 9–16 remain at the scene origin instead of joining the animated formation.

**Cause:** [champion.js](public/champion.js), line 16 creates `WORLDS.length` gems, but line 37 animates only `i < 8`. Angles are already divided by the sixteen-world count, leaving only half the intended ring positioned. CPU Three.js object-state inspection confirmed that the last eight positions remain `[0,0,0]`.

**Recommended fix:** Iterate the actual gem collection and use its count consistently for spacing and associated orbits. Check all sixteen positions in normal and reduced-motion states and visually inspect the completed ring at narrow and wide aspect ratios.

**Evidence:** [Object-state receipt](audit/experience-review-2026-10-15/scene-state.json), [Adventure record frame](audit/experience-review-2026-10-15/ending-record.png).

### ER-03 — P2: Story text advances automatically with a short reading window

Most transitions run 16.5 seconds, but their story panel becomes fully opaque only after 68% of the scene. That leaves approximately five seconds before automatic advancement, with an additional end fade. World 8 and World 16 have slightly longer windows; reduced-motion transitions show static text immediately for nine seconds.

The transition does not explicitly focus its heading or announce the new story. In the inspected flow, focus remains on the gameplay canvas. Space/Enter skip the scene; P/Escape do not pause it. Opening Settings indirectly suspends the timer, but that is not an understandable reading control.

Sources: [cinematic-score.js](public/cinematic-score.js), lines 7 and 17; [app.js](public/app.js), lines 125–132, 193 and 373. This is a readability and accessibility finding, not a blanket WCAG conformance ruling.

**Recommended fix:** Let the animation finish while retaining the story until an explicit Continue action, or provide a clearly labeled hold/continue preference and visible pause control. Announce a concise transition once or move focus appropriately; do not announce animation frames. Make the same behavior available for Daily and record endings. Test keyboard focus and reading flow with a screen reader.

**Evidence:** [Scene typography and bounds](audit/experience-review-2026-10-15/desktop-scenes.json), [320 CSS-pixel bounds](audit/experience-review-2026-10-15/narrow-scenes.json). These held-frame inspections verify layout, not reading speed or continuous motion comfort.

### ER-04 — P3: Brick help still describes the original world set

[brick-labels.js](public/brick-labels.js), lines 7 and 9 describe three-hit armor using the Citadel's final formation and switches as opening Electric City's gates. The expanded campaign also uses switches in Sunken Archive, Thunder Spire and Dawn Nexus, and three-hit armor in Lunar Harbor and Dawn Nexus. The symbols and numeric progression are meaningful, but the descriptions are unnecessarily world-specific and incomplete.

**Recommended fix:** Describe the general behavior: numbers indicate hits remaining; breaking a diamond opens the formation's gates. If examples are useful, derive them from the current world definitions rather than maintaining an original-world list in prose.

## Coverage and results

| Area | Completed evidence | What it establishes and does not establish |
| --- | --- | --- |
| Individual worlds | 16 worlds × 3 seeded simulations; **48/48 cleared**, no losses or timeouts | A deterministic tracking bot can complete every formation with normal life rules. This does not measure human difficulty |
| Full campaign | Three seeded campaigns; **3/3 won**, no life losses; about **20.9–22.1 minutes** active simulated play | Progression works through all sixteen worlds; cinematics were skipped. Ideal tracking does not measure fatigue or reaction demands |
| World cinematics | Sixteen desktop frames and sixteen narrow-layout bounds checks | Distinct scenes and legible centered story panels in the sampled frames; World 7's scene exists |
| Endings | Daily completion, Adventure record and Daily record inspected | Distinct ending compositions exist; Adventure record has ER-02 |
| Reduced motion | Nineteen compositions compared at two times | All sixteen world scenes and three ending compositions kept object/camera states fixed. This is not a photosensitivity or vestibular assessment |
| Audio synthesis | Eighteen tracks × two scenarios, **36 complete offline renders**, 24 seconds each | No clipped or nonfinite samples in the tested mixes. No human listening judgment or hardware-output guarantee |
| Existing media tests | **4 passed, 0 failed** | Mute/zero-volume behavior, distinct arrangements, finite camera samples and reduced-motion story visibility |
| Keyboard/dialogs | Start focus, pause paths, Settings/Escape and nested dialogs inspected | Several paths work; button-based resume fails as described in ER-01 |
| Narrow reading layout | Story bounds and help dialog at 320 CSS pixels | Sampled story panels fit; help dialog had no horizontal overflow. This does not replace text-resize or browser-zoom testing |

### Balance observations requiring human playtesting

Worlds 8 and 16 have substantially larger workloads: 166 and 253 total hit points across their formations, versus 42–68 in most other worlds. Individual bot clear times ranged from 180–264 seconds for World 8 and 196–322 seconds for World 16. These are boss-style peaks, not proof of unfair difficulty.

All three campaign simulations reached the nine-life cap and reported 14–16 life awards, including awards at the cap. A perfect tracking bot makes this unsurprising. Human reviewers should evaluate whether extra lives make the middle campaign too forgiving and whether the two long worlds become tiring. Do not change tuning solely from these bot results.

[World simulation data](audit/2026-10-15-experience-balance.json), [campaign simulation data](audit/experience-review-2026-10-15/campaign-bot.json).

### Cinematic and audio observations

The sampled scenes have distinct environments, consistent centered typography and a dark story backing. Desktop story headings measured 52px and body copy 16px; the narrow samples used 28px and 15px. The scene designs and story placement are coherent; pacing and the incomplete record formation are the actionable problems.

The audio review used the actual synthesis engine: sixteen world tracks and two victory tracks. Each was rendered with default music volume, then with maximum cinematic music/effect volume plus a simultaneous effect burst. The largest sampled absolute amplitude was **0.25703**, with **zero clipped and zero nonfinite samples**. These short renders do not establish long-session fatigue, loop quality, perceptual loudness matching, device latency, or speaker/headphone balance.

[Sixteen-scene contact sheet](audit/experience-review-2026-10-15/world-contact-sheet.png), [audio measurements](audit/experience-review-2026-10-15/audio-waveforms.json), [media test output](audit/experience-review-2026-10-15/media-tests.txt).

### Accessibility strengths and remaining scope

All nine dialogs receive heading-based accessible names. Starting play moves focus to the arena. Settings supports Escape and returns focus to its opener; nested Settings returns to its parent pause menu. Reduced-motion scene state is static, and visible brick counts supplement color coding.

The canvas label provides instructions, but it does not convey the ball, paddle and obstacle positions continuously. Hidden semantic world definitions and status toasts do not by themselves make this visual action game playable without sight. Accessible menu operation and a fully nonvisual gameplay mode are different acceptance targets; decide the latter explicitly instead of claiming screen-reader playability.

Still needed from people/devices: novice and experienced full-campaign playtests; headphones and phone-speaker listening; motion-comfort review; actual screen-reader navigation and game-state understanding; 200% text resizing and 400% browser zoom; real touch and installed-phone checks. None of the fourteen formal human/device procedures was marked passed by this review.

Review criteria: W3C guidance on [keyboard operation](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html), [adjustable timing](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html), [reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), and [modal dialog focus](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/). These informed the review; they are not a certification.

## Method and evidence limits

The browser used a local-only preview with mocked scores, disabled service-worker registration, and explicit diagnostic controls to select worlds/endings and hold scene time. Production source supplied the game, scenes, styles and audio engine. Simulation used fixed seeds and 120Hz updates with automated paddle tracking, normal lives and no injected life refills. Screenshots intentionally held scenes for inspection rather than demonstrating uninterrupted timing.

[Captured browser logs](audit/experience-review-2026-10-15/browser-logs.json) contain no desktop/audio errors and one unattributed MutationObserver error during narrow-iframe inspection. Its origin was not established; the report does not claim a clean console across all contexts. All sixteen narrow scene inspections completed afterward.

The image `reduced-toggle-result.png` shows the result dialog after changing reduced motion while a diagnostic scene was held beyond the shorter reduced duration. It is not a reduced-motion cinematic capture or evidence of a production defect. Static reduced-motion evidence comes from the object-state receipt and media checks.

No deployment, policy activation, live-score writes or release approval was performed. Existing uncommitted policy-checker work was preserved. See the [review audit](audit/2026-10-15-experience-review.md) for attempt history and the [file manifest](audit/2026-10-15-experience-review-hashes.json) for evidence hashes.
