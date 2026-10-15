# Prism Breaker interface conventions

- Never use up-right or northeast arrow icons or glyphs in the interface, including decorative action indicators and external links.
- Never use colored accent borders or side rails on cards and boxes. Use neutral borders and world scene previews; show the selected world with a Current badge and subtle surface change.
- Use clear action text, a Current badge for the active world, a grid icon for world navigation, and a trophy icon for leaderboard actions.
- Label navigation back to the opening screen "Back to start screen"; explain checkpoint saving or ending the run in the pause description.
- Omit device/browser storage qualifiers from personal-best and saved-preference interface copy.
- Keep the external Pagelove attribution text-only and announce that it opens in a new tab through its accessible label.
- Keep the arena full width. Show personal bests beside start controls and on results, journey progress in the Worlds chooser, and contextual advice beside Launch ball.
- Keep cinematic text on a consistent dark backing, with bold white headings, story text of at least 15px on phones, and large gold score figures. Keep caption readability independent of the world's colors and the interface theme.

## Pagelove authoring contract — support clarification, October 15, 2026

Wesley relayed Pagelove support confirmation: WebDAV is only an authoring mechanism and intentionally bypasses all schema validation and triggers. Treat owner DAV as trusted authoring, not an application validation boundary; bypass is expected behavior, not a platform bug. ETag conditions/readback and client/build validation remain separate controls. Any server-authoritative application mutation requirement needs its own supported authenticated path. This clarification does not resolve public-policy propagation timing or unattended expiry. Provenance: support response supplied by Wesley; see the resolved DAV report in the Prism Breaker repository.
