# Public policy activation: timing, consistency and readiness

Investigation date: October 15, 2026 UTC. Actor: Codex. Scope: disposable resources on the Prism Breaker host. This is an observed-behavior report and request for a supported deployment contract; internal platform cause is not established.

## Questions

1. When does an authored permission or validation change begin executing?
2. Do requests observe one consistent policy revision during a change?
3. What can a publisher check before enabling writes?

## Documentation findings

Fresh direct HTTPS reads of the official references were retained privately; URL, content hashes and excerpts are in the experiment receipts. The web retrieval tool failed on these URLs, so direct retrieval supplied the evidence.

- [Permissions](https://docs.pagelove.com/all/reference/permissions/) define AuthorizationRule grants and denials. A grant answers whether a request may act on a resource/selector.
- [OPTIONS](https://docs.pagelove.com/all/reference/protocol/) discovers methods currently allowed on a resource or element. The reviewed documentation does not identify an executed rule revision or an all-worker readiness token in that response.
- [Transition rules](https://docs.pagelove.com/all/reference/reacting-to-changes/) document activation within 60 seconds for DAV edits. That statement concerns transition constraints; it does not establish the same contract for every Trigger and AuthorizationRule used here.
- DAV is trusted authoring and intentionally bypasses application validation and triggers. This investigation checks later **public requests**, not validation of the DAV upload.

Successful conditional DAV publication and source readback prove what is stored. They do not independently prove which rules subsequent public requests execute.

## Reproduction design

Run [tools/policy-activation-probe.mjs](tools/policy-activation-probe.mjs) using Bun in an interactive terminal. It accepts the approved owner's key as hidden JSON input; never put credentials in command arguments, source, reports or shared logs.

1. Verify the exact host identity. Read only the production leaderboard's document and policy identities for comparison.
2. Create unique data and read-marker documents through DAV using `If-None-Match: *`. The data document contains an empty `#records` list. Confirm public POST is denied before granting access.
3. Create a third policy document, scoped to those exact paths. Grant public POST only to the disposable list. A Sessel GET trigger on the separate marker document returns `activation-revision-A`; a Sessel POST trigger on the data document accepts only `<li>A</li>` and returns 422 for B.
4. At bounded offsets, issue marker GET, selector OPTIONS, POST A, POST B and marker GET. Read the stored rows through DAV before and after each sample. Save statuses, response markers, allowed methods and synthetic additions.
5. Conditionally replace the policy using its current ETag. Revision B accepts only B and rejects A. Verify stored source, then repeat observations through 90 seconds.
6. Publish revision C without the temporary POST grant. Observe revocation and marker timing through 65 seconds.
7. Delete the policy and confirm DAV 404, then observe public behavior through 65 seconds. Delete all remaining fixtures and verify DAV 404.

The runner guards mutations with an exact disposable-path allowlist. It does not write production scores or policies. Only synthetic A/B row contents are saved in receipts. Each sample comprises sequential requests, not an atomic snapshot; reported sample elapsed times are completion times. Sparse observations bound changes but do not measure their exact instant.

## First experiment and correction

[First receipt](audit/2026-10-15-policy-activation-3976e3c5-2fb6-4fe6-b361-7d28e6cf49bc.json).

The first fixture placed its diagnostic GET trigger on the mutation target itself. After activation, that GET returned 418. POSTs then returned 403 even while OPTIONS listed POST. Internal reads for selector authorization may have been affected by the diagnostic response. This is a possible test interaction, not a confirmed platform explanation. Its write outcomes cannot cleanly establish validation propagation behavior.

Its read observations remain evidence of delayed trigger changes: after storing B, samples through approximately 20.6 seconds still returned A; B appeared in the sample completed around 41 seconds. After deleting the policy, C still executed in the sample completed around 8.7 seconds; ordinary reads appeared by the sample completed around 21.1 seconds. These are observations from this run, not guaranteed propagation bounds.

The corrected experiment separates marker and mutation resources. Initial samples confirmed A was accepted, B returned 422 with the A rejection marker, and only A rows were appended. This removes the same-target diagnostic interaction from the second experiment.

### Production identity caveat

The first experiment's production policy identity was unchanged, but its full leaderboard document hash differed between the initial and final reads. No production mutations are permitted by the runner. No player-record snapshots were retained, so the reason for the difference is unknown. Do not interpret this run as proof that every real score remained unchanged, or overwrite current scores to restore an older hash.

## Corrected experiment

Receipt: [separate-marker run](audit/2026-10-15-policy-activation-c66eb3d1-8b2b-462a-b310-c2803cef3d86.json), completed at 19:21:34.340Z.

| Phase | Observed behavior |
| --- | --- |
| Initial A | First sample completed at 2.443 seconds: A marker, POST A accepted, POST B rejected with 422 and A marker. The same behavior continued through the sample completed at 67.110 seconds. |
| Stored B | Published at 19:17:49.729Z. Samples through 41.560 seconds still executed A, accepted A and rejected B. At 67.092 and 91.792 seconds they executed B, rejected A and accepted B. OPTIONS advertised POST throughout. |
| Revoked grant / stored C | First sample completed at 0.699 seconds: OPTIONS no longer advertised POST; both writes returned 401. Marker GETs still executed B through 40.768 seconds, with C observed by 65.903 seconds. No rows were appended after revocation. |
| Deleted policy | DAV deletion returned 204 and readback 404. Samples completed at 3.831 and 8.723 seconds each included an ordinary 200 GET followed later by a 418 C marker. C still appeared in the sample completed at 40.714 seconds. Both GETs in the final sample completed at 66.021 seconds returned ordinary 200. Writes remained denied. |

This demonstrates differing activation timing between authorization and trigger behavior, and inconsistent consecutive read outcomes during deletion. It does not identify which worker served a request or prove the internal cause. The checked response headers contained no native policy revision/readiness field.

Both runs completed 29 samples each. In the corrected run, 15 initial/update samples appended 15 synthetic records: 13 A and two B. All 14 revocation/deletion samples appended none. Every sample preserved the prior synthetic row prefix. All five disposable documents across the two runs were removed with 204 responses and DAV 404 confirmations, including policy deletion events recorded separately from final cleanup. The corrected run's full production leaderboard and native-policy identities were unchanged. The first run's full-document caveat above remains part of the evidence.

## Deployment decision

Until the supported readiness contract is established, keep the existing normal-publication guard that rejects changed native score policies. A few successful requests, OPTIONS advertising POST, an ETag or a fixed delay cannot establish that every future request will execute the intended validation revision. Ordinary game asset releases can continue under that guard; this dependency concerns changes to native policies.

## Questions for Pagelove support

1. What activation and invalidation guarantees apply separately to AuthorizationRule, Trigger, Processor and transition constraints authored through DAV?
2. Can an authorization grant and its validation policy become effective atomically? If not, what supported sequence keeps writes denied until validation is effective everywhere?
3. Is there a rule revision identifier, readiness endpoint or publication barrier covering every worker serving public requests? What precisely does its successful response guarantee?
4. How do cache invalidation, deletion, revocation, rollback and worker failure affect these guarantees? Can a stale grant or trigger execute after a confirmed source deletion?
5. Does selector authorization internally read the target through its GET pipeline, explaining the first fixture's GET-418/POST-403 interaction?

No support message has been sent. A provider answer plus targeted reproduction can establish the contract; client probes alone cannot prove a global guarantee.

Audit: [policy activation investigation](audit/2026-10-15-policy-activation.md).
