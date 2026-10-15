# Additional Pagelove DAV and policy findings

Observed October 14, 2026 on `sane-guild-8399.onpagelove.com` and its paired DAV host. This supplements [the initial report](DAV-TRIGGER-BUG-REPORT.md). These findings were collected after that report was written; the record is retrospective. Server version and backend source implementation remain unknown.

## 1. The candidate validator runs correctly on the server

Prepared diagnostic policies confirmed that `DOMParser` is available, parsing/query selectors/text content work, and JSON response generation works. Intentional runtime and syntax errors produced HTTP 500 TriggerError responses. It is no longer accurate to list unsupported DOMParser or JavaScript compatibility as an equally plausible explanation for the observed owner-write behavior.

The full candidate world validator was invoked on the server with supplied request contexts, twice per case:

| Supplied request | Result |
| --- | --- |
| Valid canonical world and revision condition | Accepted |
| Invalid hit points | Rejected, 422 |
| Injected script markup | Rejected, 422 |
| Missing revision condition | Rejected, 428 |
| World identity mismatching path | Rejected, 422 |
| Deletion | Rejected, 405 |

Stored module source matched the normalized uploaded source hashes. These wrapper calls prove that the validator logic and runtime work when invoked. They do **not** prove enforcement on actual public PUT or DAV mutation requests.

Evidence: [prepared runtime](audit/2026-10-14-dav-diagnostic-7321285f-76c2-478f-8928-875ce95715e9.json), [full contract](audit/2026-10-14-dav-diagnostic-97edb0b3-ee85-4863-9d6d-b35ab6396cca.json).

## 2. Minimal rejection policies also fail to reject owner DAV writes

The behavior reproduces without the world parser. An always-reject trigger returned 422 on a public GET, confirming discovery and execution. A conditional owner DAV PUT to the same target then returned 200 and persisted a new unique marker. Immediate owner readback confirmed the mutation.

The prepared matrix covered external JavaScript, external JavaScript without a method filter, external Sessel, and embedded JavaScript. The tested public GETs rejected while the DAV writes succeeded. A stale ETag was rejected with 412 in the original investigation, so conditional-write handling itself was observable.

Minimal action:

```javascript
export default function () {
  throw {
    schema_url: 'https://pagelove.org/HTTPResponse',
    status: 422,
    body: 'disposable-put-denied'
  };
}
```

Reproduction procedure:

1. Create a uniquely named disposable HTML target with an identifiable marker through owner DAV.
2. Install a `https://pagelove.org/Trigger` targeting that exact path, with GET and PUT methods and the JavaScript action above.
3. Confirm public GET returns 422. Allow for the policy freshness behavior described below; do not assume a successful upload means every request sees the new policy.
4. Read the target's ETag through DAV.
5. PUT new HTML containing a different marker through owner DAV with `If-Match` set to that ETag.
6. Read the document through DAV and inspect the marker. Observed: PUT 200 and the new marker persisted despite the rejecting trigger.
7. Remove only the disposable target and policy and confirm owner reads return 404.

Evidence: [prepared language/placement matrix](audit/2026-10-14-dav-diagnostic-459b2714-f961-478a-b1b6-de79f00e9e5a.json). The receipt also retains later runtime reads affected by discovery timing; those later reads are not evidence of unsupported JavaScript.

## 3. Native schema constraints show the same owner-write gap

A separate schema required an integer `hp` property and had an always-rejecting schema-level JavaScript validator. Sessel construction of the type produced a validation failure containing the deliberate rejection message, confirming the schema and validator were discovered and operational.

Owner DAV PUT nevertheless returned 200 and persisted three typed documents: one with valid integer syntax that the custom validator rejects, one missing required `hp`, and one with invalid integer content. Each contained a unique marker confirmed on readback.

This strengthens the evidence that complete owner DAV document writes bypass the tested persistence constraints. Whether that is an intentional administrator-authoring capability or a defect needs an explicit platform contract answer. No anonymous world-write vulnerability was established. A public PUT using the owner key returned 401 in the tested configuration; no public world-write authorization was introduced.

Evidence: [native schema controls and writes](audit/2026-10-14-dav-diagnostic-789bb6e1-3863-44e5-b09d-6c1562bcd447.json).

## 4. Policy changes are not immediately or consistently visible

A disposable public GET trigger initially returned marker A with status 418. Its policy was conditionally updated to return B; owner readback confirmed B was stored. A second newly added policy returned C. Requests used cache-busting URLs and no-cache headers through Bun, independent of browser and service-worker caches.

| Seconds after change | Updated policy | Newly added policy |
| --- | --- | --- |
| 0 | A, 418 | Normal page, 200 |
| 1 | B, 418 | C, 418 |
| 5 | A, 418 again | C, 418 |
| 15, 31, 61, 91 | B, 418 | C, 418 |

After successful policy deletion and owner readback 404, an immediate public GET still executed B. How long that post-deletion state lasted was not measured.

The reappearance of A after B suggests inconsistent policy freshness across requests. Per-worker caches or invalidation timing are possible explanations, but no backend trace establishes the cause.

To reproduce, prepare a unique target and a GET-only constant-response trigger, establish A, update to B with an ETag, and sample public requests immediately and at the intervals above. Include independent owner source readbacks, then delete the policy and sample again. Store status and marker, not credentials.

Evidence: [cache timing receipt](audit/2026-10-14-dav-diagnostic-2df11f10-81fd-4c20-84aa-d75285735918.json).

## 5. Later game acceptance checks add a mutation-policy observation

The final game check found that a newly created disposable score policy initially permitted an unrestricted public DELETE (204), removing an unexpired control. Subsequent unsafe requests rejected. After a separate populated-control readiness sequence returned 403 three consecutive times, unsafe deletion rejected and legitimate expired-only deletion passed. This is additional evidence to investigate around fresh policy publication; the exact root cause is unconfirmed.

An empty-container DELETE returned 416 and was not a valid guard-positive control. A cleanup probe using workstation time was also misleading because the server Date was roughly three seconds behind. The real game already adjusts its clock from server responses. These probe limitations are preserved rather than presented as game failures.

Public production score submission, duplicate rejection, normal browser saving, five-day assignment, and settled isolated expiry cleanup passed. This does not resolve the owner DAV or fresh-policy findings. See the [final acceptance report](FINAL-ACCEPTANCE-REPORT.md) for evidence and precise limits.

## Scope and remaining platform questions

All diagnostic resources were uniquely named and removed, with 404 owner readbacks. Production worlds were not modified. No permanent world guard was activated, no external issue was filed, and credentials are absent from the saved evidence.

Platform maintainers should confirm:

1. Whether owner DAV complete-document PUT intentionally bypasses Trigger, native property, and schema validator enforcement.
2. Which supported write route can guarantee canonical world validation and conditional writes together.
3. Whether policy publication has a documented propagation delay and a reliable readiness signal.
4. Why an older policy can reappear after the new version has executed, and why a deleted policy can still execute.
5. Whether authorization and rejecting mutation triggers can become visible at different times during fresh publication.

The reusable diagnostic runner is [tools/diagnose-dav-triggers.mjs](tools/diagnose-dav-triggers.mjs). Its matrix, runtime, schema, and cache modes use hidden stdin credentials and disposable resources. The [investigation log](audit/2026-10-14-dav-investigation.md) preserves earlier inconclusive interpretations and their corrections.

## October 15, 2026: Fresh review evidence and interpretation

The follow-up review repeated isolated probes rather than assuming the earlier host behavior persisted. The [immediate matrix](audit/2026-10-15-review-dav-immediate.json) accepted DAV writes, but its public reject controls were not active yet; it does not independently prove bypass. The [65-second settled matrix](audit/2026-10-15-dav-diagnostic-b9c0da97-3fa5-4a46-87f1-9ff8e2085982.json) then observed public GET rejection with 422 for JavaScript, Sessel and embedded reject triggers while corresponding owner-DAV PUTs returned 200 and persisted their marker. A PUT-only trigger correctly did not reject GET. The public host still rejected the owner key's PUT with 401. All twelve disposable resources were deleted and read back as 404.

The [freshness run](audit/2026-10-15-review-policy-freshness.json) observed old policy A at 0, 1, 5, 15 and 31 seconds after storing B. Updated B and newly added C were observed at 61 seconds. One updated-target request returned 502 at 91 seconds; this is retained as a failure observation. Immediately after owner deletion/readback 404, the public path still executed B. Four disposable paths were cleaned.

Current official documentation explicitly describes WebDAV as a raw authoring/repair path and documents bypass of transition constraints/handlers, with DAV-edited transition rules taking effect within 60 seconds. See [Protocol/WebDAV](https://docs.pagelove.com/all/reference/protocol/) and [Transitions](https://docs.pagelove.com/all/reference/reacting-to-changes/). Those statements concern transitions; they do not alone settle the intended contract for every general Trigger or schema guard. The correct platform question is which enforcement/freshness guarantees apply to the actual mutation path. Do not describe an intentional authoring bypass as a confirmed backend implementation bug.

The [new expiry probe](audit/2026-10-15-review-expiry.json) again saw an unexpired synthetic record removed during fresh policy propagation, followed by settled rejection of unsafe deletion and successful expired-only cleanup. Client filtering and access-driven deletion still do not establish unattended TTL. No production rules, world documents or score records were changed in these probes. The world guard remains inactive. No external issue or message was submitted.
