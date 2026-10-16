# Handbook and cinematic control release

## Release plan

- Actor: Codex.
- Request: Commit, merge and deploy the completed handbook and Pause Animation button removal.
- Scope: Include both pending change batches and their evidence. Preserve the game data, world documents and established server policies.
- Procedure: Rebuild generated assets, commit on a codex branch, satisfy the existing exact-source release gate and required hosted CI, merge normally into main, deploy using the pinned-host publisher, and verify live assets plus the existing-client update flow. Record final evidence separately.
- Baseline: main and origin/main match 54a24854bc47e4fd540e3749aa55b52ec4636f07. Candidate 61be83b456ccebaee354; 73 assets; unchanged scoring ruleset. Full build produced only the expected generated changes.
- Access: Initial sandbox GitHub CLI configuration read was denied; approved elevated access succeeded. Honcho tools unavailable.
- Status: Publication pending. No production writes yet.
- Plan recorded UTC: 2026-10-16T00:07:20.1583750Z

## Pre-commit evidence handling

- UTC: 2026-10-16T00:07:34.5957289Z.
- The first staged whitespace check stopped on blank context lines inside preserved audit patch files. These are patch-format context markers, not source whitespace defects. No commit or dependent release gate ran. Retain the evidence bytes/hashes and rerun whitespace checking on source and documentation with only the two historical patch artifacts excluded.
