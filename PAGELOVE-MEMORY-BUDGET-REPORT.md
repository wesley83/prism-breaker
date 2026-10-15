# Intermittent HTTP 503 from a constant JavaScript processor condition

Investigation date: October 15, 2026 UTC. Status: reproduced on the named host; suspected platform execution/budget-accounting issue; internal cause requires provider investigation. This report has not been sent to support.

## Finding

A **660-byte HTML document with no score records, no custom schema and no cleanup action** intermittently returned HTTP 503 when its GET processor condition was only:

```js
export default () => false;
```

The action was a harmless Sessel expression, `true`, which should be skipped because the condition is false. The failure therefore does not require the game's expiry regex, score count, deletion request, Three.js, service worker or browser.

The response reported:

```text
503 Service Unavailable - Budget Exceeded
The request exceeded the allocated memory budget.
resourceType: memory
allocated: 33554432
consumed: 33554432
```

33,554,432 bytes is 32 MiB. These are the platform's reported budget values, not an independent measurement of memory allocated by the user function. No deliberate memory-consuming workload was used.

## Environment and exact observation

- Public host: `https://sane-guild-8399.onpagelove.com`
- Authoring host: `https://dav-sane-guild-8399.onpagelove.com`
- Requests: Bun 1.4.3 HTTPS client, sequential, anonymous public GET; owner DAV used only to create/read/remove isolated fixtures.
- Small failing fixture: `/_prism-memory-zero-js-sessel-74af68a5-1649-4164-997d-d15238dfcb05.html` (removed after the test).
- Client capture time: **2026-10-15T18:51:05.615Z**.
- Response Date header: **Thu, 15 Oct 2026 18:51:02 GMT**. Both times are retained; clock differences were not silently corrected.
- Request: GET with a unique `?cb=` query and `Range: selector=#scores`.
- Status 503; 112 ms observed request duration; 652-byte error response.
- No request/trace identifier appeared in the checked response headers (`x-request-id`, `request-id`, `x-correlation-id`, `traceparent`).
- The exact minified fixture source, its hash and error body are retained in the [action/row comparison receipt](audit/2026-10-15-memory-budget-2026-10-15T18-50-30-790Z.json).

## Reproduction

1. On an authorized test host, choose a new disposable path such as `/_processor-memory-repro-UNIQUE.html`. Replace `UNIQUE` in both the upload path and the resource metadata below. Never target the real leaderboard.
2. Author this HTML through DAV. That is intentional: DAV publishes documents and native definitions; the subsequent public GET is the application request under test. This is separate from the resolved, expected DAV validation bypass.
3. Issue sequential public GETs to the path, using a distinct cache-busting query for each. Try both a normal full GET and `Range: selector=#scores`. Space requests by at least 300 ms; no concurrent load is needed.
4. Retain every status/error body and timestamp. The failure is intermittent: a successful request or short successful series does not disprove it.
5. Compare a second unique fixture where the `when` module is replaced with the Sessel constant `false`. Also compare plain HTML without a processor. Keep all other data equivalent.
6. Remove all disposable resources through the authoring path and confirm 404 through that path.

```html
<!doctype html>
<html>
<head>
  <meta name="robots" content="noindex">
  <title>Isolated processor probe</title>
</head>
<body>
  <ul id="scores"></ul>
  <div itemscope itemtype="https://pagelove.org/Processor">
    <meta itemprop="resource" content="/_processor-memory-repro-UNIQUE.html">
    <meta itemprop="method" content="GET">
    <div itemprop="when" itemscope itemtype="https://pagelove.org/JavaScript/Module">
      <script itemprop="source" type="module">export default () => false;</script>
    </div>
    <div itemprop="action" itemscope itemtype="https://pagelove.org/Sessel">
      <script itemprop="source" type="text/sessel">true</script>
    </div>
  </div>
</body>
</html>
```

The formatted example has equivalent logic to the recorded minified fixture; its byte count differs. The Sessel comparison replaces only the `when` block with:

```html
<div itemprop="when" itemscope itemtype="https://pagelove.org/Sessel">
  <script itemprop="source" type="text/sessel">false</script>
</div>
```

Expected: the request returns the requested empty list (206 for the selector request) or document (200); the false condition skips its action. Actual: occasional 503 memory-budget responses, followed by successful requests without document changes.

## Controlled comparisons

Each row below had 12 requests, alternating full and selector GETs. Variants were interleaved and their order rotated. Counts are observations from small samples, not reliability estimates.

| Experiment | Variant | Memory-budget 503s |
| --- | --- | ---: |
| Seven-row comparison | Plain HTML | 0/12 |
| Seven-row comparison | Native score rules with GET processor removed | 0/12 |
| Seven-row comparison | Constant-false JavaScript gate, harmless JavaScript action | 3/12 |
| Seven-row comparison | Existing expiry predicate | 0/12 |
| Seven-row comparison | Streaming predicate without the match array | 3/12 |
| Seven-row comparison | Constant-true JavaScript GET trigger | 0/12 |
| Empty-page comparison | Plain HTML | 0/12 |
| Empty-page comparison | JavaScript false gate / Sessel action | 0/12 |
| Empty-page comparison | JavaScript true gate / Sessel action | 0/12 |
| Empty-page comparison | Sessel false gate / Sessel action | 0/12 |
| Empty-page comparison | Sessel true gate / Sessel action | 0/12 |
| Row/action comparison | Zero rows, JavaScript gate / JavaScript action | 0/12 |
| Row/action comparison | Zero rows, JavaScript gate / Sessel action | **1/12** |
| Row/action comparison | Seven rows, JavaScript gate / JavaScript action | 3/12 |
| Row/action comparison | Seven rows, JavaScript gate / Sessel action | 1/12 |
| Row/action comparison | Zero rows, Sessel gate / JavaScript action | 0/12 |

The earlier expiry verification also reproduced the original processor's failure. Its zero errors in this particular comparison do not contradict that earlier evidence. The streaming rewrite did not eliminate the error and has not been adopted.

The final comparison left three new fixtures unchanged and unread for at least 65 seconds before issuing requests. Empty plain HTML, JavaScript-false/Sessel-action and Sessel-false/Sessel-action each had **0/12 failures**. This does not establish that waiting 65 seconds is a fix or a supported activation barrier: the earlier immediate empty-page sample also had no failures, while the later equivalent 660-byte case failed. Freshness remains a possible contributor requiring provider tracing.

Across all four experiments: **240 public GETs, 11 captured memory-budget failures, 12/12 successful established-leaderboard control reads**. This was a bounded sequential functional comparison, not a load or reliability test. All 19 disposable resources were removed and verified absent; every run's production document/policy hashes were unchanged.

## Interpretation and remaining questions

The evidence supports escalation as a **suspected platform JavaScript processor execution or budget-accounting defect on this host**. A large score list or expensive expiry algorithm is not necessary to reproduce it. The observations do not establish the internal allocator, worker, cache or accounting cause, nor do they establish a failure on every Pagelove host.

Please investigate:

1. Which operation consumed or reserved the reported 32 MiB for a constant-false condition on an empty document?
2. Are JavaScript context initialization, context marshaling, module caching or processor discovery charged consistently across workers and requests?
3. Does a false `when` condition cause any action-language evaluation before the action is skipped?
4. What does equality of `allocated` and `consumed` mean in this error response: actual usage, a reservation, or a capped diagnostic?
5. Is a corrected runtime or supported configuration needed? Simply raising the budget is not yet a justified application fix.
6. Does newly published processor discovery or compilation contribute? All reproduced failures in this investigation were on recently authored disposable resources; the later aged sample succeeded. Please distinguish discovery/compilation behavior from steady-state execution using provider logs.

The [official JavaScript reference](https://docs.pagelove.com/all/languages/javascript/) says JavaScript and Sessel share a request budget derived from TransactionBudget metadata. The [processor reference](https://docs.pagelove.com/all/reference/reacting-to-changes/) describes falsy `when` conditions as skipping the action. Both pages were freshly fetched successfully; URL/status/hash evidence is in the receipts.

## Application impact and preservation

The established leaderboard's limited control reads succeeded during the comparisons. That does not guarantee it can never encounter this error. The existing game reports a failed refresh and can show previously loaded standings; its refresh button offers another attempt. No automatic-retry behavior was added by this investigation.

All test writes were restricted to unique disposable paths. Active fixture rows and real leaderboard document/policy identities were checked. Fixture cleanup and exact results are in each receipt. No production rule, transaction budget, runtime file or score was changed by the investigation; no deployment was performed.

Changing the condition language may be worth a separate mitigation experiment, but the controls do not establish a fully equivalent replacement for the expiry policy. The existing safe-policy-activation limitation also remains. This report does not recommend removing expiry validation or increasing budgets blindly.

## Evidence and runner

- [Seven-row component comparison](audit/2026-10-15-memory-budget-2026-10-15T18-46-55-848Z.json)
- [Empty-page comparison](audit/2026-10-15-memory-budget-2026-10-15T18-48-44-599Z.json)
- [Row/action comparison and exact minimal failing fixture](audit/2026-10-15-memory-budget-2026-10-15T18-50-30-790Z.json)
- [Comparison after at least 65 seconds without fixture access](audit/2026-10-15-memory-budget-2026-10-15T18-52-14-966Z.json)
- [Audit and experiment revisions](audit/2026-10-15-memory-budget-investigation.md)
- [Runner](tools/memory-budget-probe.mjs): default comparison, `--minimal`, `--action-matrix`, or `--aged-minimal`. Requires authorized hidden TTY credential input; creates a unique evidence filename per run.

Receipts contain synthetic fixture data, public error details and production hashes, not credentials or real player records.
