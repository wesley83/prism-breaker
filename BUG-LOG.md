# Prism Breaker bug log

## PB-001 — Intermittent HTTP 503 on a constant JavaScript processor condition

| Field | Value |
| --- | --- |
| Status | Open — reproduced; awaiting provider investigation |
| Logged | October 15, 2026 UTC |
| Area | Pagelove public GET processing / JavaScript processor condition |
| Impact observed | Intermittent failure to read disposable documents; production leaderboard controls succeeded |
| Cause | Unconfirmed; suspected platform execution or memory-budget accounting issue |
| Support submission | Prepared; not sent |
| Fix / workaround | None verified |

### Summary

A 660-byte document with an empty list and a JavaScript processor condition that only returns `false` intermittently returned **HTTP 503: memory budget exceeded**. It contained no scores, custom schema, expiry parsing or deletion action. The harmless Sessel action should be skipped by the false condition.

The platform reported allocated and consumed memory as **33,554,432 bytes (32 MiB)**. These are reported budget values, not independently measured allocations by the function.

### Environment

- Public host: `https://sane-guild-8399.onpagelove.com`
- Authoring host: `https://dav-sane-guild-8399.onpagelove.com`
- Client: Bun 1.4.3, sequential HTTPS requests; no browser or service worker involved.
- Example capture: **2026-10-15T18:51:05.615Z**; response Date: **Thu, 15 Oct 2026 18:51:02 GMT**.
- Exact failing fixture and response: [recorded evidence](audit/2026-10-15-memory-budget-2026-10-15T18-50-30-790Z.json), variant `zero-js-sessel`, round `6`.

### Reproduction steps

1. Choose a new disposable filename, for example `/_processor-memory-repro-UNIQUE.html`. Replace `UNIQUE` with a fresh identifier in the filename, HTML and request script below.
2. Upload this HTML to that path through the authorized host's DAV authoring endpoint. Use a create-only condition (`If-None-Match: *`) to avoid replacing an existing resource. Do not upload to `/scores.html`.

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

3. Make 12 sequential **public** GETs, alternating full-document and selector requests. Save this as a local `.mjs` file and run it with Bun after replacing `UNIQUE`. The loop is bounded, uses no credentials and does not create concurrent load.

```js
const url = 'https://sane-guild-8399.onpagelove.com/_processor-memory-repro-UNIQUE.html';
for (let i = 0; i < 12; i++) {
  const selector = i % 2 === 0;
  const response = await fetch(`${url}?cb=${Date.now()}-${i}`, {
    headers: selector ? { Range: 'selector=#scores' } : {},
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(20000),
  });
  const body = await response.text();
  console.log(JSON.stringify({
    utc: new Date().toISOString(),
    selector,
    status: response.status,
    serverDate: response.headers.get('date'),
    errorBody: response.ok ? null : body,
  }));
  await Bun.sleep(300);
}
```

4. Preserve all statuses, UTC timestamps and error bodies. The issue is intermittent; 12 successful requests do not disprove it. For the controlled comparisons already performed, use [the investigation runner](tools/memory-budget-probe.mjs) and [detailed procedure](PAGELOVE-MEMORY-BUDGET-REPORT.md).
5. On separate unique paths, compare plain HTML without a processor and the same processor with a Sessel `false` condition instead of the JavaScript module. Update each resource path to match its own filename.
6. Remove each disposable fixture through DAV and confirm a subsequent DAV GET returns 404. Keep credentials out of saved evidence. No real player records are needed.

The formatted HTML is equivalent to the recorded 660-byte minified fixture; its byte count differs. DAV is used only to author the fixture. The failure occurs on a public GET, so this is separate from the previously resolved, intentional DAV validation bypass.

### Expected result

Each request returns the document (200) or selected empty list (206). The false condition skips the action.

### Actual result

Some requests return:

```text
503 Service Unavailable - Budget Exceeded
The request exceeded the allocated memory budget.
resourceType: memory
allocated: 33554432
consumed: 33554432
```

Other requests to the same unchanged document succeed. The recorded minimal failure completed in 112 ms. The checked response headers contained no request or trace identifier.

### Findings and limits

- Four controlled experiments made **240 public GETs**, capturing **11 memory-budget failures** across variants. This is not a production failure-rate estimate.
- The 660-byte empty-document variant failed **1 of 12** requests in its recorded comparison.
- All **12 established production leaderboard control reads succeeded**.
- A final sample after leaving fixtures unchanged for 65 seconds succeeded. Waiting is **not a verified fix**; an earlier immediate sample also succeeded before a later equivalent fixture failed.
- Rewriting the expiry predicate to avoid building a match array still produced failures. The minimal reproduction does not need expiry code at all.
- All 19 investigation fixtures were removed. Real leaderboard document and native-policy identities were unchanged in every run.
- No production fix, budget increase or policy change has been applied. Provider logs are needed to establish the cause and whether newly authored processor handling contributes.

### Next action and closure criteria

Submit [the detailed support report](PAGELOVE-MEMORY-BUDGET-REPORT.md) and its linked receipts to Pagelove support. Ask which operation consumes or reserves the budget for this constant condition and whether worker initialization, module compilation, context marshaling or accounting is responsible.

Close PB-001 only after a provider explanation or correction is recorded and the minimal and original expiry cases are rechecked across fresh and previously read fixtures, with full/selector requests and active-record preservation. One successful retry, a larger budget or a short error-free sample is insufficient to establish a fix.

### History

| UTC date | Event |
| --- | --- |
| 2026-10-15 | Expiry verification captured intermittent memory-budget 503s. |
| 2026-10-15 | Four controlled comparisons reduced the failure to an empty document with a constant-false JavaScript processor condition. |
| 2026-10-15 | Logged PB-001 as open; support-ready reproduction prepared, not submitted. |

Full investigation: [PAGELOVE-MEMORY-BUDGET-REPORT.md](PAGELOVE-MEMORY-BUDGET-REPORT.md). Audit: [memory-budget investigation](audit/2026-10-15-memory-budget-investigation.md).

## PB-002 — Public rule activation lacks a verified safe publication contract

| Field | Value |
| --- | --- |
| Status | Open — delayed execution reproduced; provider contract clarification needed |
| Logged | October 15, 2026 UTC |
| Area | AuthorizationRule and Trigger activation after DAV authoring |
| Classification | Observed platform behavior; not yet established as a violation of a documented guarantee |
| Application impact | A successful source upload and OPTIONS response cannot establish that new write validation is active |
| Current safeguard | Normal game publishing preserves native score rules; policy migration refuses changed rules |
| Support submission | Prepared; not sent |

### Reproduction and evidence

Use the [isolated procedure and runner](POLICY-ACTIVATION-VERIFICATION.md). Create a disposable writable list and a separate revision-marker document. Publish policy A accepting only A, confirm A succeeds and B is rejected, then conditionally publish policy B accepting only B. Sample public marker GETs, OPTIONS and both POST payloads while inspecting the stored synthetic rows through DAV.

In the corrected run, source B was verified stored at **2026-10-15T19:17:49.729Z**. The sample completed **41.560 seconds** later still returned the A marker, accepted A and rejected B. The sample completed **67.092 seconds** later returned B, rejected A and accepted B. OPTIONS advertised POST throughout. These are sampling times, not exact activation times or guaranteed maximum delays.

Removing the POST grant denied writes by the first sample completed at 0.699 seconds, while its GET trigger still reported the older revision through 40.768 seconds. After policy deletion and DAV 404 confirmation, samples included a 200 GET followed by another GET executing the deleted C trigger; C remained observable through the sample completed at 40.714 seconds. All disposable documents were removed. The corrected run's production document and policy hashes were unchanged; the first run's full-document hash differed for an undetermined reason, with its policy unchanged. See the report for that limitation and the first fixture's diagnostic interaction.

### Expected capability and next action

The application needs a supported way to keep writes denied until their intended validation is effective on every serving worker. The reviewed documentation did not establish such a barrier for these rule types. Ask support for activation, revocation, deletion and rollback guarantees; whether grants and validation can be published atomically; and a documented revision/readiness mechanism or safe deployment sequence.

Close this item after that contract is recorded and its prescribed sequence is checked on isolated resources. Do not close it after a successful retry or introduce an arbitrary sleep as a guarantee. The first experiment's same-target GET-418 marker confounded its write results; use the corrected separate-marker run for mutation conclusions. No production rule change was made.

## PB-003 — Android installed app retains a blank strip above its content

| Field | Value |
| --- | --- |
| Status | Open — user-supplied device evidence; cause unconfirmed |
| Environment | Pixel 11 Pro, Android 17, Edge 155.0.4283.48, as reported by Wesley |
| Expected | Installed launch uses the available screen without requiring a fullscreen button |
| Observed | Large gray strip above the start screen; strip persists in the follow-up screenshot supplied after the fullscreen-button request |
| Scope | Installed window/display behavior; not attributed to Pagelove server processing |
| Fix | None verified; no runtime change applied |

### Reproduction from user evidence

1. Open the Edge-installed Prism Breaker app from its Android icon.
2. Observe the blank gray area above the game's start screen. No address bar or browser toolbar is visible in the supplied image.
3. Press the game's fullscreen button and compare the same upper screen boundary. The supplied follow-up image retains the strip at approximately the same proportion of image width, despite different screenshot dimensions and page presentation.

Evidence supplied October 15, 2026: Screenshot_20261015-154457.png and codex-clipboard-4238e931-9076-4740-8bf5-40aab9944a25.png. Images remain outside this public repository. No physical-device execution was performed by Codex. The images do not expose display-mode, fullscreenElement, viewport geometry, scroll position or installed manifest metadata; they cannot establish which layer owns the strip.

### Findings and next diagnostic

The live entry and manifest previously returned 200, with display=fullscreen and the correct manifest MIME type. Source declares viewport-fit=cover, body margin zero and no matching opening-screen top spacer. The native fullscreen API is distinct from manifest display mode and requires user activation. A browser/Android window or cutout restriction is plausible, but no current Edge defect or root cause is confirmed. The persistent strip means the button has not been demonstrated to resolve the reported screen-area problem.

Next compare a separate Chrome installation on the same phone while retaining the Edge installation and data. A difference would narrow the issue toward browser/installation handling, not by itself prove an Edge defect. If needed, capture runtime display-mode, fullscreenElement, viewport/screen dimensions and computed safe-area values before/after on the affected device. Do not use negative CSS margins, reinstall/data deletion or an automatic page-load fullscreen call as an unverified fix.

Close only after the affected installed launch is checked on this device and the result is documented. [Investigation audit](audit/2026-10-15-android-fullscreen.md).
