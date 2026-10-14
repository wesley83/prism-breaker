# Document-first release publication receipt

- Identifier: DF-10; UTC: 2026-10-14T17:12:52.5780145Z; actor: Codex.
- Reference: DF-01 through DF-09 in 2026-10-14-document-first-implementation.md and the user's explicit probe/release approval.
- Implementation commit: fc415617fca69e7cd9e0409ac77ff557c2ce7771.
- GitHub push: main advanced from ebd6d2f to fc41561. A subsequent remote ref read matched the full implementation commit. An unauthenticated GitHub API read confirmed wesley83/prism-breaker is public and its default branch is main.
- Live release: ee6a8edb8f4578dd9b0b at https://sane-guild-8399.onpagelove.com/. Public release module and the updated browser document matched. Update game completed with all sixteen worlds ready offline.
- Verification: 98 tests pass, zero failures; build and release check pass. Source diff whitespace check is clean. The binary audit patch intentionally preserves Git context lines containing a single space; including that patch in a whitespace check flags those patch-format context lines, not source defects. Preserve the patch bytes and their recorded hash.
- Failed publication attempt: elevated Git rejected the sandbox-owned checkout as dubious ownership. Retried with a command-scoped safe.directory value for this exact verified checkout; no global Git configuration was changed. The retry and remote verification succeeded.
- Evidence: release receipt, local/live screenshots, binary implementation patch and SHA-256 manifest are committed. The manifest captures working-tree bytes at its stated timestamp; this later publication receipt is outside that snapshot and is version-controlled separately.
- Synchronization: exactly the 62 implementation/evidence files were copied into the authoring directory; this receipt is copied separately. Unrelated root-project changes were not staged or committed.
- Remaining limitation: no production world-write policy was activated. The DAV probe accepted invalid/unconditional writes; public owner-key writes returned 401. The candidate stays outside public assets. Owner access, client validation, ETags, readback, existing score records and hosted worlds remain preserved. Full document-first persistence compliance still requires a supported server-enforced owner mutation path.
- Final receipt publication: this documentation-only receipt will be committed and pushed after capture; the final remote ref is checked by the agent after that push.
