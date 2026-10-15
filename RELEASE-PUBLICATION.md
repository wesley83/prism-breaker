# Immutable game releases and recovery

## Publication contract

The HTML world sources, catalog, shared Practice edits and leaderboard remain document resources. The renderer's scripts, styles, fonts and images are generated runtime representations. Each game entry now references a complete immutable representation under `/releases/<release-id>/`.

`bun run build` writes a reproducible package to the ignored `test-results/release-package/<release-id>/` directory. The identity includes runtime inputs, worker and packaging code, and the editor's composition inputs. The worker inventory retains logical cache keys and adds each asset's immutable network URL. This preserves old client pins and existing saves while isolating network files by release.

Only cache assets and the schema-free editor template are staged under immutable URLs. Root-only schema-bearing HTML is a promotion input, so a second copy cannot register duplicate native schema definitions. The editor route includes its own release's template. Mutable world definitions stay at their original paths.

## Publish

1. Build, review changes and evidence, then commit the exact inputs.
2. Run `bun run release:check`. Push the source and wait for the required GitHub check before integration. Main enforces the named check for administrators as well.
3. Start `bun tools/remote.mjs` and authenticate through hidden stdin on the pinned host. Do not save the credential in files, arguments or environment variables.
4. Send `{"op":"deploy"}`. The publisher backs up current entry documents privately, stages immutable files with create-only conditions, and verifies readback. A collision refuses overwrite. Score data, score policies, individual world documents, old release directories and legacy root scripts/styles are preserved.
5. After staging, the publisher checks the exact-source gate again. It replaces entry documents with ETag conditions; the game HTML switches before the root worker. Every game entry points to a coherent graph, so a failed later promotion need not mix modules. Concurrent root edits stop publication for reconciliation.
6. Run `bun tools/check-live-pwa.mjs audit/<dated-receipt>.json`. It verifies immutable asset URLs, hashes, the root entry marker and fullscreen manifest. Check the actual start/update flow as well.
7. Exit hidden stdin with `{"op":"quit"}`. Keep sanitized receipts in the audit and credentials outside Git.

The source `public/index.html` retains root references for authoring. The published entry is the package's rewritten HTML. Root game modules are intentionally no longer overwritten. Old uncontrolled pages can finish loading those legacy modules; newly published pages use their own release paths.

## Interrupted publication and rollback

`test-results/publication-checkpoint.json` records staging/promotion progress without credentials. Private entry backups use a unique directory per attempt. Do not blindly restore an old document over concurrent changes.

An existing local immutable package includes its own saved worker. With a passing current source gate, send `{"op":"rollbackRelease","version":"<20-character-release-id>"}`. The publisher verifies that package, stages/rechecks its immutable files and conditionally promotes its entries and saved worker. Source and deployed rollback version are recorded separately. The receipt reports the selected worker's actual cache inventory.

Rollback requires the package to exist locally. Preserve needed package directories or rebuild from the corresponding reviewed commit with its own tooling. The first pre-immutable release has no immutable package: recovering it requires explicit review of the private entry backups. Do not claim the new rollback operation can recreate an arbitrary missing historical package.

## Boundaries

- Entries are separate conditional document writes, not a claimed native transaction across the entire site. Old or new self-contained game entries can coexist during publication.
- Old immutable directories are retained on the host. Cache cleanup on a device is separate from host storage reclamation. Deleting releases requires its own retention policy and proof that active/rollback clients no longer need them.
- Exact immutable URLs may recover online after cache loss. Missing unversioned modules still fail rather than pulling another release into an old game. Online fallback does not mark a partial cache offline-ready.
- Owner DAV is trusted authoring. Create-only conditions prevent this publisher from overwriting a release; they do not revoke the owner's ability to modify files with another authoring tool.
- Runtime publication does not publish new score authorization/trigger rules. Changed native score policies are rejected by `migrateScoreRules` until a supported safe activation procedure is established. Low-level owner authoring remains an owner capability.
- Device and independent human acceptance remain separate from deterministic package and automation results. See the [acceptance procedure](review/acceptance-plan.html).
