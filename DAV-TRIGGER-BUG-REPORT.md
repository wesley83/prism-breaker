# Suspected DAV PUT trigger enforcement issue: invalid world writes accepted despite an installed validation trigger

## Summary

On a Pagelove-hosted application, owner-authenticated DAV `PUT` requests returned success for payloads that an installed JavaScript trigger was intended to reject.

A separate diagnostic confirmed that a simple JavaScript trigger executes on public `GET` requests, including when the trigger is defined in another document.

It is not yet clear whether this is:

- A DAV trigger-execution bug.
- An intentional difference between the DAV and public request pipelines.
- A compatibility problem in the validator's server-side JavaScript execution.

## Environment

- **Observed:** October 14, 2026
- **Public host:** `https://sane-guild-8399.onpagelove.com`
- **DAV host:** `https://dav-sane-guild-8399.onpagelove.com`
- **Authentication:** Owner credential sent as a Bearer token to DAV
- **Application:** [Prism Breaker](https://github.com/wesley83/prism-breaker)
- **Reproduction source commit:** `e3254d3208631466be1de7aa00d71165c73762e3`
- **Pagelove server version:** Unknown
- **Probe runtime:** Bun 1.4.3

## Intended behavior

The application's world editor publishes complete HTML world documents.

A separate policy document defines a `https://pagelove.org/Trigger` scoped to the target resource and mutation methods. Its JavaScript action should reject:

- Invalid world data, including brick hit points outside the permitted range.
- Writes without the required revision condition.
- Partial writes and unexpected executable markup.

The guard throws an object using this response shape:

```javascript
throw {
  schema_url: "https://pagelove.org/HTTPResponse",
  status: 422,
  body: "Invalid world definition."
};
```

## Reproduction steps

The repository contains the exact disposable-resource probe used during investigation.

### 1. Prepare the reproduction

```sh
git clone https://github.com/wesley83/prism-breaker.git
cd prism-breaker
git checkout e3254d3208631466be1de7aa00d71165c73762e3
bun install
bun run build
bun tools/remote.mjs
```

**Important:** This tool is pinned to the hosts listed above. Running its probes requires authorization to use that host.

### 2. Authenticate through the tool's hidden input

When it displays `Ready for hidden JSON input.`, enter:

```json
{"op":"auth","key":"<HOST_OWNER_KEY>"}
```

Do not include the actual key in the bug report or captured logs.

Wait for authentication to confirm the host matches.

### 3. Run the world-policy probe

```json
{"op":"probeWorldPolicy"}
```

The probe:

1. Creates a uniquely named policy document scoped to a uniquely named disposable world resource.
2. Creates a valid world using DAV `PUT` with `If-None-Match: *`.
3. Reads its ETag.
4. Submits a world with brick hit points changed from `1` to `99`, using that ETag.
5. Exercises additional invalid and conditional-write cases.
6. Deletes both disposable resources in a `finally` cleanup block.

### 4. Optionally run the trigger-discovery diagnostic

```json
{"op":"probeTriggerDiscovery"}
```

This creates a simple public `GET` trigger that always throws status `418`. It checks the trigger both in a separate policy document and embedded in the target document, then cleans up.

### 5. Exit

```json
{"op":"quit"}
```

## Observed results

| Case | Expected | Observed |
| --- | --- | --- |
| Valid world creation | Success | `201` |
| Invalid hit points (`99`) with a revision condition | `422` from the guard | **`200`** |
| World write without a revision condition | `428` from the guard | **`200`** |
| Write with a deliberately stale ETag | `412` | `412` |
| Public GET with separate always-reject trigger | `418` | `418` |
| Public GET with embedded always-reject trigger | `418` | `418` |

The probe reported failure and cleaned up its resources.

**Evidence limitation:** The invalid-hit-points result establishes an unexpected successful HTTP response. The probe did not immediately read back that individual write before proceeding to subsequent cases.

The executable-markup case returned `412` after the preceding write had changed the document. That result should **not** be treated as evidence that executable markup validation worked.

## Expected result

If DAV mutations participate in this trigger pipeline, the invalid and unconditional writes should be rejected before storage.

If DAV intentionally bypasses application triggers, please clarify that boundary and identify the supported way to enforce validation for owner-authenticated world publishing.

## Further isolation needed

A minimal **DAV PUT trigger that unconditionally throws `422`**, without calling the world parser, would distinguish pipeline behavior from validator compatibility.

That specific reduced test has **not yet been performed**.

The full validator uses `DOMParser`; its availability in Pagelove's server JavaScript runtime has not been established. If unsupported, clarification is needed on the supported parsing API and how such execution failures should surface.

## Impact and containment

The application cannot currently rely on this trigger to enforce world-document integrity through its owner DAV publishing path.

- Publishing still requires owner credentials.
- Stale ETag protection worked.
- No anonymous write vulnerability was established.
- Production worlds were not modified by these probes.
- The candidate policy was not activated for production worlds.

## Relevant sources

- [Probe implementation](https://github.com/wesley83/prism-breaker/blob/e3254d3208631466be1de7aa00d71165c73762e3/tools/remote.mjs)
- [Policy generator](https://github.com/wesley83/prism-breaker/blob/e3254d3208631466be1de7aa00d71165c73762e3/tools/world-policy.mjs)
- [Shared world schema and parser](https://github.com/wesley83/prism-breaker/blob/e3254d3208631466be1de7aa00d71165c73762e3/public/world-schema.js)
- [Pagelove trigger documentation](https://docs.pagelove.com/reference/reacting-to-changes/Trigger/)
- [Pagelove WebDAV documentation](https://docs.pagelove.com/reference/protocol/WebDAV/)
