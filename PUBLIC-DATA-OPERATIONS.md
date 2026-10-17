# Public data and recovery contract

Updated October 17, 2026. Owner DAV publishing and the casual leaderboard remain the approved trust model. This document describes implemented controls and operational limits; it grants no new server permissions.

## Authority and exposed operations

| Boundary | Authority and controls | Limit / response |
| --- | --- | --- |
| Official worlds | Reviewed HTML in Git; shared schema; clean generated bundle and rules fingerprint | Official ranked layouts remain separate from hosted Practice edits |
| Shared Practice worlds | Owner-authenticated pinned DAV destination, complete validated documents, strong conditional writes and readback | DAV intentionally bypasses application validation/triggers. Arbitrary owner clients are trusted authoring; no public world write grant |
| Leaderboard submissions | Native existing POST grammar, unique run key and server expiry; client additionally validates finite ranges, valid dates and canonical duplicate payloads | Scores are client-reported. No anti-cheat or provider-wide rate-limit/moderation guarantee is claimed |
| Pending results | IndexedDB transaction completion, bounded exponential backoff with jitter, Retry-After up to 24 hours, per-entry lease and payload checks | Synchronization runs while open. Storage denial preserves the visible result and never reports it queued |
| Editor drafts | Semantic working DOM; immutable pending HTML snapshot; IndexedDB revision compare/write in one transaction; serialized same-tab writes | Conflict does not overwrite either version. Download working HTML and reopen to reconcile. Legacy localStorage drafts remain recoverable |
| Imported levels | One-million-character/file-byte cap, inert template parsing, declared-field/type validation and reconstructed output | No imported executable capabilities; hidden resource URLs are not mounted. Failed import retains current document |

## Data inventory

| Data | Purpose/audience | Location and lifecycle |
| --- | --- | --- |
| Player alias, score, mode, world, duration, challenge date, rules revision, anonymous run key | Public standings, ordering and duplicate reconciliation | Existing score resource; ranking eligibility ends at server expiry, five days after acceptance. Physical deletion occurs on subsequent online board access |
| Server expiry; optional submitted time | Retention and age display | Same score resource. Do not reinterpret a client clock as server-owned acceptance time |
| Pending result and last submission error | Retry/recovery for the original anonymous run | IndexedDB. Player can remove an entry when it has no active lease; acknowledged receipts retain at most 100 entries and 30 days |
| Last successful board snapshot | Stale/offline display | IndexedDB; overwritten by a newer confirmed read. Expired/incompatible rows are excluded before ranking/display |
| Adventure checkpoint, best, name and preferences | Continuation and convenience | Browser storage until replaced/reset/cleared/evicted. Checkpoint failures are unconfirmed and offer recovery download before application navigation |
| Working world and undo | Authoring | Live semantic HTML plus bounded historical snapshots, lost on deliberate discard/reload unless a draft/export was confirmed |
| Draft snapshot and revision | Authoring recovery and conflict refusal | IndexedDB metadata, one current snapshot per world/origin; retained until replaced/cleared/evicted. Legacy draft keys are not destructively removed during migration |
| Owner key | One owner publication operation | Handler-local memory, cleared from the field; excluded from drafts, traces, logs and exports |
| Diagnostics | Reproduce a bounded local failure | Opt-in/local fixture records, no alias, key, external telemetry or automatic upload. Record source/rules identity and limits |

## Abuse and moderation response

The existing endpoint bounds individual fields and enforces unique keys; this is not evidence of a total request-rate or aggregate resource quota. Clients limit retry work, but a modified client can bypass those limits. No new native policy is published while effective activation remains unresolved. Before expanding public-user-content features or claiming authoritative abuse protection, obtain a supported server rate/quota/moderation contract and verify it on isolated resources.

Aliases have an explicit 2–16 ASCII-letter/digit/space/dash/underscore policy and are rendered as text. This prevents markup execution; it does not prevent offensive names. There is no live human moderation promise or anonymous reporting endpoint. Owner removal is the available administration boundary: identify the exact run key, preserve a private minimal incident record, read the current resource/strong ETag, conditionally remove only that record and read back. Preserve every unrelated record and the established policy. Do not add attacker-supplied markup, credentials or raw private request payloads to an incident record. Public reporting/quarantine requires a separately reviewed supported native mechanism, not a client-only claim.

## Deletion, backups and restore

Run-key uniqueness is enforced while its server record exists; acknowledged local receipts last at most 30 days. Deleting an expired server record does not create a permanent anti-replay tombstone. Delayed uploads retain their original run/mode/challenge payload and receive a server lifetime on acceptance. This casual board does not promise permanent duplicate recognition after deletion or authoritative prevention of replay by modified clients. Never describe the local lease or a UUID as that guarantee.

Ordinary game releases preserve all score/policy/world resources. Never seed over populated records. Runtime rollback uses complete retained immutable packages; it is separate from data restoration. The publisher's scoped entry backups do not authorize restoring a stale score resource. There is no automatic score-backup restore operation.

If an owner explicitly requests data recovery: use synthetic fixtures first, inventory the candidate backup, remove expired records against server time, apply any private removal/tombstone ledger, validate the remainder, compare current live records, require conditional writes and verify the accepted result. A backup must not resurrect an expired/removed score or older policy. Provider snapshots outside this application's control have no asserted retention/deletion guarantee; clarify those separately before making backup-wide deletion claims.

## Provider boundaries

The constant-condition 503 and effective-policy activation issues remain provider-dependent. Normal publication cannot change native policies. A stored ETag and successful samples do not establish an all-worker readiness guarantee. Existing failure states and bounded retries contain availability errors; they do not establish a provider fix. Five-day access-driven cleanup is the user-approved lifecycle and requires no unattended scheduler.
