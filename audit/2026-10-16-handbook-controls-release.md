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

## Release verified

- UTC: 2026-10-16T00:15:47.052Z.
- Actor: Codex; user authorized commit, merge and deployment.
- Source: 16d0af0291a5b7b086be37a670ea7b2d6a22d474 passed both branch and PR required checks. PR https://github.com/wesley83/prism-breaker/pull/3 merged normally at 2026-10-16T00:12:12Z into main df35f5c972f8322d64565188979f5f3fafeca6ca. Main Quality run 38828131625 also passed. No branch-control bypass.
- Exact-source gate: Merged main passed at 2026-10-16T00:12:27.706Z; 173 tests across 22 files, build and repository checks passed. Gate digest 4c222bee1567a0917bbad86d506e910f2cc36786dbd08eae0a9b94fc6742717e. Existing release requirements were executed as part of publication; no tests added.
- Deployment: Pinned console/host authentication passed (200/207), immutable dependency staging and conditional entry promotion completed at 2026-10-16T00:13:49.025Z; release 61be83b456ccebaee354, 82 published files and 73 precached assets. Existing score rules/data, world definitions and old runtime assets were preserved by the publisher. Credential remained in hidden process input; publisher exited after deployment.
- Live verification: Public readback passed all 73 asset checks and entry requirements at 2026-10-16T00:14:19.455Z; manifest remains fullscreen. Existing e5d8bccada0716d7b933 client used Settings > Check for updates > Update game and loaded the new release, Ready to play offline. DOM contains zero pause-scene buttons; world Continue and record Save your name remain. Help text is corrected; Continue adventure and the displayed personal best survived. No captured warning/error; no run started or score submitted. Browser receipt and screenshot retained. This is a desktop in-app-browser check, not a physical-device review.
- Evidence: Deployment, merged-source gate, live readback, browser observations and screenshot are versioned separately from runtime inputs. Final evidence-only merge requires no second game deployment. Current publication does not reopen outstanding human/device/provider limitations.
