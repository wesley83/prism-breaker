# DAV trigger investigation

## DI-01 — Diagnostic plan

- UTC: 2026-10-14T19:54:23Z; actor: Codex.
- User request: Troubleshoot the suspected DAV trigger failure as much as possible. Prior explicit authorization covers isolated resources on sane-guild-8399 and their cleanup; production worlds remain outside these probes.
- Plan: establish minimal unconditional rejection on GET and PUT with one external policy; compare DAV and public endpoints without granting anonymous mutation; test embedded versus external discovery and alternate trigger language if useful; inspect server JavaScript parsing capabilities through non-sensitive diagnostics; examine documented pipeline behavior and available platform source; correct the report and candidate implementation where evidence warrants it.
- Changes planned: reusable diagnostic tooling, sanitized result evidence, bug-report clarification and any demonstrated local fixes. Do not activate the production policy without a passing validation probe. Do not submit external issues or change platform infrastructure.
- Verification: each disposable write uses unique paths and cleanup; read back after every write to distinguish status from actual storage; retain fresh ETags between independent cases; record exact statuses and sanitized diagnostic messages. Source changes and evidence will have a reviewable diff and SHA-256 manifest.
- Status: investigation pending. No live resources changed in this diagnostic session.

## DI-02 — Minimal rejection reproduced; isolate policy cache effects

- UTC: 2026-10-14T19:57:25.8155386Z; actor: Codex; reference DI-01.
- First fresh external JavaScript trigger, configured for GET and PUT, returned 422 on public GET. DAV conditional PUT returned 200 and immediate DAV readback contained the new unique marker. This isolates write-trigger behavior from world parsing and confirms storage changed.
- Later cases reused the same policy resource with different module source. Runtime introspection unexpectedly returned the earlier disposable-put-denied response. Those cases are inconclusive due to possible compiled-module or discovery-cache reuse. Preserve the raw receipt; do not interpret them as runtime capability evidence.
- Revision: give every diagnostic case unique target and policy URLs, including runtime and full-validator probes; repeat language, placement and filter checks independently. Both original probe resources were deleted and read back as 404.
- Files: tools/diagnose-dav-triggers.mjs, audit diagnostic receipt, this log. Verification of revised probes pending.

## DI-03 — Fresh URLs confirm DAV writes; public action results vary

- UTC: 2026-10-14T20:06:08.5682820Z; actor: Codex; reference DI-02.
- Fresh per-case probes: JavaScript GET+PUT and unfiltered triggers rejected public GET (422), but all five DAV PUT cases returned 200 and persisted their unique markers. Independent fresh readbacks eliminate the original ETag/readback ambiguity. All fourteen resources were deleted and returned 404.
- Public Sessel, embedded JavaScript, runtime introspection and full validator checks returned ordinary documents; therefore runtime compatibility remains unproven. Fresh URLs did not resolve all public discovery/execution inconsistencies. Do not attribute these exclusively to module cache.
- Official current DOM documentation explicitly lists DOMParser, static iterable children, and read-only trigger document support. The candidate API is documented, but actual host behavior still needs verification.
- Revision: inspect stored policy source for exact preservation; repeat several controlled GET actions with literal/JSON/DOM access and deliberate failures, with bounded repeated reads and cache revalidation. Probe schema-level persistence validation if trigger execution remains unavailable, without changing production configuration.

## DI-04 — Source preservation verified; investigate schema discovery freshness

- UTC: 2026-10-14T20:08:22.7581988Z; actor: Codex; reference DI-03.
- Stored module text matched submitted source hashes for all runtime cases. The first literal-action returned 418 on all three reads. Later JSON, DOM, runtime-error and malformed-source actions returned normal pages, even with cache revalidation and repeated reads. These results do not establish unsupported DOM APIs; discovery/execution freshness remains a confounder. All resources cleaned up.
- Plan revision: install every runtime policy before the first public read, then query each target. This avoids invalidating the host policy set between reads. The original candidate will also be evaluated in that prepared set.

## DI-05 — Runtime compatible; prepared policies execute correctly

- UTC: 2026-10-14T20:10:53.8333956Z; actor: Codex; reference DI-04.
- Installing all policies before the first public read yielded the expected actions: JSON and literal replies 418, DOMParser typeof function, parsed text parsed, intentional runtime/syntax errors 500, and full candidate valid-world result true. Stored source hashes matched. All fourteen resources returned 404 after cleanup.
- This removes missing DOMParser as an explanation. Sequential live policy updates/additions had remained invisible after public reads; prepared set behavior strongly suggests host schema/policy cache freshness. No blanket claim about unsupported JavaScript or swallowed errors is warranted.
- Plan refinement: prepare the language/placement matrix before reads, exercise the real candidate's invalid contracts in a public diagnostic wrapper, check schema-level rejection on DAV, and measure a small policy update/addition/removal sequence using literal actions. Update the bug report to distinguish DAV enforcement and cache invalidation findings.

## DI-06 — Prepared method/language matrix confirms enforcement gap

- UTC: 2026-10-14T20:13:40.6965806Z; actor: Codex; reference DI-05.
- Prepared JavaScript GET+PUT, no-method-filter, Sessel GET+PUT and embedded JavaScript each returned 422 on public GET. Every corresponding DAV conditional PUT returned 200 and immediate readback contained its new marker. PUT-only did not affect public GET, as expected. This confirms the gap across language and policy placement.
- A native schema-level always-reject diagnostic also accepted a DAV write, but that schema has not yet had a separate execution-positive control, so treat it as additional observation, not established schema bypass.
- Follow-up: measure update/addition/deletion cache freshness for up to 91 seconds on two disposable GET-only policies. Run the prepared full-validator contract cases after that measurement. Runtime diagnostics added after a warmed policy cache remain explicitly inconclusive; they are retained in the raw receipt.

## DI-07 — Policy freshness failure measured

- UTC: 2026-10-14T20:16:10.6111179Z; actor: Codex; reference DI-06.
- Cache baseline GET returned policy-A. Conditional DAV update returned 200 and owner readback showed policy-B. Immediate public read still returned A; at 1 second B appeared; at 5 seconds A returned again; 15/31/61/91-second samples returned B. New policy C was initially absent, then visible from 1 second onward.
- DAV deletion returned success and owner readback 404; immediate public GET still executed B. Exact source code line/root cause remains unverified; this is consistent with cache invalidation/worker freshness, and the observed reversion is stronger than a single propagation delay.
- All four disposable resources were deleted and returned 404 via owner reads. No production policy was activated.
- Follow-up plan: independently confirm schema discovery/execution before interpreting its DAV result; finish the prepared invalid-input candidate contract; prepare two reports and an evidence index.

## DI-08 — Native schema positive control confirms discovery

- UTC: 2026-10-14T20:18:52.5628751Z; actor: Codex; reference DI-07.
- Native schema definition source was preserved. JavaScript imported and constructed the declared type (418 success). Sessel construction invoked its schema-level JavaScript validator and returned TriggerError/validation failed/disposable-schema-denied (500), positively confirming that the schema and validator were discovered and operational.
- DAV PUT then accepted three typed payloads (200): always-rejected valid integer, missing required hp, and invalid integer hp. Each unique marker persisted on immediate readback. All six resources cleaned up and returned 404.
- Interpretation: whole-document owner DAV writes bypass the tested trigger and schema rejection paths. Whether this is intentional administrator-authoring behavior or a platform defect requires confirmation against the supported product contract; no anonymous vulnerability is claimed.
- Final changes planned: strengthen the existing report with minimal tested rejection and native-schema evidence; create a separate policy-cache report; add an investigation/evidence index; reconcile diagnostic tool modes, hashes and local source commit. No production guard activation or external issue submission.

## DI-09 — Full server contract verified; documentation plan finalized

- UTC: 2026-10-14T20:31:12.8641899Z; actor: Codex; reference DI-08 and user requests for additional findings in Markdown.
- Prepared server wrapper accepted the valid production-format world and rejected invalid HP (422), injected markup (422), missing condition (428), mismatched identity (422), and deletion (405). Results repeated twice; normalized script-source hashes matched; all sixteen resources cleaned up and returned 404.
- Confirmed: candidate JavaScript/DOM compatibility and validation logic work when invoked. The outstanding whole-document DAV behavior remains the persistence-path issue. Runtime wrapper calls validate a supplied virtual request and do not establish actual public PUT authorization or mutation enforcement.
- Documentation revision: save the additional findings in DAV-INVESTIGATION-FINDINGS.md, including self-contained minimal rejection and cache repro details, positive controls, limitations, and evidence links. Link this addendum from the preserved initial report. Remove obsolete inconclusive post-warm runtime reads from the reusable matrix mode; keep their historical receipts. Commit only investigation source/docs/audit locally; no production release or external issue submission requested.

## DI-10 — Findings addendum saved

- UTC: 2026-10-14T21:09:55.3070040Z; actor: Codex; reference DI-09 and user's request to put additional findings in Markdown.
- Changes: Saved DAV-INVESTIGATION-FINDINGS.md with minimal rejection repro, server-runtime positive controls, native schema results, policy update/addition/deletion timings, test limits, evidence links, and maintainer questions. Linked from preserved original report. Added the later disposable public DELETE observation from final game acceptance without claiming a backend root cause.
- Verification: Cross-checked key receipts and final acceptance results. No production world policy activated, no external issue filed. Diagnostic credentials remain hidden input only. Local audit source/evidence reconciliation follows with the final acceptance commit.
