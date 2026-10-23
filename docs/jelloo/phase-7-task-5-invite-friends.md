# Phase 7 Task 5 — Invite Friends & Earn

Date: 2026-10-23. Branch: `feature/jelloo-phase-7`. HEAD: `91e4e97f588dfd2147eae8c467284a7d053f982e`.

**Production-readiness verdict: PARTIAL.** Implementation and local verification are complete. No production migration, commit, push, merge or deployment was performed. Live Supabase, true multi-connection concurrency and complete browser qualification remain unverified. Dependency advisories and absent approved cosmetic assets also prevent an unconditional production PASS.

## Scope and architecture

The existing Next.js route-handler and Supabase stack was retained. Referral storage is additive and independent of quiz tables and local adventure saves. The working tree already contained Phase 7 Task 4 corrections and Multi-Jelly files; those changes were preserved. Original tutorial definitions, approved artwork, quiz code, unlock thresholds and Multi-Jelly mechanics were not changed by Task 5.

`docs/jelloo/JELLOO-HANDOFF.md` and a file named the approved complete development plan were not present in this checkout. Scope was taken from the owner's supplied Phase 7 Task 5 request and restrictions; no later-phase mechanics were introduced.

An ordinary local Level 10 flag is not evidence. The invite screen therefore supplies an explicit, separate **verified original Levels 1–10 journey**. It uses the existing Bunny board UI, rotations, Undo, Restart, automatic traversal and move limits, with an immutable copy of the actual ten tutorial boards. The server validates each level in order before issuing the next challenge. Normal local adventure progress is neither rewritten nor accepted as proof. Existing players must complete this verified journey to qualify an invite. This distinction is stated in the UI.

### Identity, attribution and recovery

- Anonymous identity: 256-bit random bearer, stored in an HttpOnly cookie; only its domain-separated SHA-256 hash is stored in the database. Production cookie is Secure, SameSite=Strict, `__Host-` prefixed, Path=/, with one-year lifetime.
- Recovery code: the bearer is shown once on creation, never put in the share URL or localStorage. Restoring requires possession of that secret. It restores the same server-backed entitlements and checkpoints. Losing both cookie and code cannot be recovered; stealing/sharing the code grants identity access. There is no claim of account-level identity assurance or stolen-code revocation.
- Public link: independent random 128-bit code, expires after 30 days. Renewal invalidates the previous link without changing existing attribution. No name, email or device fingerprint is collected.
- Attribution: first accepted inviter is immutable per guest identity. Self-attribution with the same identity is rejected. A guest has one edge and can qualify it once.
- Qualification session: server UUID, rotating nonce, board revision, current level and 24-hour expiry. Each accepted level survives refresh. An unfinished attempt deliberately restarts after refresh. Expired or unsupported sessions must explicitly restart from the invite link; no board is silently reinterpreted.

### Server verification and abuse boundaries

`verify.ts` independently replays the frozen tutorial protocol. It does not trust browser state, move counts, completion flags, animation ticks, supplied boards or the evolving adventure generator. Every editable 90-degree clockwise turn costs one move; Undo never refunds moves; Restart begins a new attempt. Terminal Go must be the final action, within the move limit, with reciprocal connected tile ports from start to home. BFS work is bounded by the small frozen boards. Invalid types/indices, fixed tiles, extra keys, impossible moves, wrong revision and unfinished paths fail closed.

The board snapshot plus protocol identifier is hashed into the revision. Future tutorial/protocol revisions must preserve this verifier/snapshot for active sessions or explicitly ask players to restart; replacing JSON in place without revising the protocol is not a supported migration.

Limits: 16 KiB streamed request body even with forged Content-Length, at most 256 proof actions, 40 requests per actor/minute and 120 per trusted IP bucket/minute. Only keyed HMAC IP buckets are persisted, not raw IP addresses. Existing trusted-proxy extraction is reused; arbitrary forwarding headers are not accepted. Unknown proxy environments use a conservative shared bucket, which can throttle unrelated users. Set up trusted ingress correctly before launch.

Same-origin JSON POST and same-origin Fetch Metadata checks defend browser CSRF; they are not bot authentication. Responses are no-store with no-referrer and nosniff. Database calls time out after eight seconds; the route has a 15-second platform maximum. Client requests time out after twelve seconds and keep a winning transcript available for retry. No credentials, proof transcripts or raw IPs are logged by this feature.

**Residual anonymous abuse:** a determined user/bot can mint identities, use multiple browsers/IPs, copy legal solutions and qualify several anonymous sessions. Static tutorial actions are reproducible. Nonces prevent session replay, not automated solving. This proves a legal puzzle sequence, not a unique human, attention, residence or a genuine friendship. Origin checks can also be forged outside a browser. Rewards are cosmetic only; no cash or competitive advantage is attached.

## Database migration and transaction guarantees

Migration: `supabase/migrations/20261023000001_jelloo_referrals.sql`. It was applied twice to an isolated PGlite PostgreSQL engine and reapplied after earning a reward; records were retained. It has **not** been run against Supabase.

Five private tables: `jelloo_referral_people`, `jelloo_referral_edges`, `jelloo_referral_sessions`, `jelloo_referral_rewards`, `jelloo_referral_limits`. Constraints cover identity/code shape, guest uniqueness, non-self attribution, reward uniqueness and threshold set, nonnegative counters and level bounds. Indexes support inviter status and expired rate-bucket cleanup.

RLS is enabled on every table; there are no anonymous/authenticated policies. Table privileges are revoked from PUBLIC, anon, authenticated and service_role. Only service_role receives EXECUTE on the security-definer RPC, which has an explicit search path and qualified table names. Browser clients never receive service credentials.

`jelloo_referral_rpc` serializes a guest using an advisory transaction lock. Advancement checks actor-bound session ID, nonce, revision, expected level and expiry. Level 10 advancement, conditional qualification, inviter counter increment and threshold inserts are one transaction. The inviter row update serializes different guests; unique reward keys prevent duplicate grants. A deliberate reward-insert failure was injected in tests: qualification, counter and nonce all rolled back; retry then awarded once.

An exact retry of the most recent accepted nonce and transcript digest returns current status. A different transcript with that nonce or an older replaced nonce is rejected. A simulated successful commit with lost HTTP response was retried without duplicate credit. After session expiry, status/recovery still exposes durable earned rewards even though an old submit is rejected.

PGlite executes real PostgreSQL SQL and privileges, but its single connection serializes SQL queries. Concurrent API promises and duplicate final submissions were tested; this does **not** establish lock behavior under overlapping independent production database transactions. Staging multi-connection tests remain required.

## API contract

Endpoint: `POST /api/jelloo/referrals`, JSON, same-origin credentials. Exact input keys are enforced.

| Operation | Input beyond `op` | Effect |
|---|---|---|
| `register` | None | Creates anonymous identity or returns existing identity; newly created recovery code returned once |
| `status` | None | Reads current identity's counters, entitlements and checkpoint |
| `renew` | None | Rotates public invite code and extends link expiry |
| `restore` | `recovery` (64 lowercase hex) | Restores identity cookie if the secret resolves to an existing identity |
| `start` | `code` (32 lowercase hex) | Binds first inviter; creates/resumes or explicitly restarts an expired session |
| `submit` | `id`, `nonce`, `revision`, `level`, `actions` | Replays legal tutorial actions and atomically advances the server checkpoint |

Success: `{status, recovery?}`. Status has exactly `code`, `linkExpires`, `qualified`, `pending`, `rewards`, `referred`, `challenge`; challenge is null or exactly `{id, nonce, revision, level, expires}`. Output validation rejects corrupted counts, rewards, challenge shape and unexpected fields. It never silently invents a reward from local state.

Error: `{error}` with 400 malformed input/link, 401 missing/unknown identity, 403 origin, 409 conflicting attribution/revision/session/replay, 410 expired session, 413 oversized body, 415 content type, 422 illegal puzzle proof, 429 rate limit with Retry-After, or 503 configuration/storage/output failure. Error responses do not expose private database details or another identity's status.

## UI and reward status

`/jelloo` links to `/jelloo/invite`. Invite UI includes recovery, public-link copy/native share, pending/qualified counters, threshold progress, explicit error/rejection messages, session expiry, checkpoint resume, and server-verified win continuation. Busy guards prevent duplicate UI submissions. Labels, live status text, focus outlines, fluid width and minimum 44px buttons/inputs are implemented. Verified journey respects reduced motion; audio is honestly labelled off. Closing the victory dialog still leaves a verification action available.

- 1 qualified friend: Golden Clover entitlement persists. **Approved asset unavailable; not applied.**
- 3 qualified friends: Rainbow Trail entitlement persists. **Approved asset unavailable; not applied.**
- 5 qualified friends: text-based Jelloo Ambassador badge displayed on the invite screen. No invented character art or soundtrack.

## Verification evidence

| Check | Actual result |
|---|---|
| Focused referral tests | **18 total, 18 pass, 0 fail, 0 skipped** |
| `npm test` | **221 total, 216 pass, 0 fail, 5 skipped**; duration 104524.2951 ms |
| `npm run typecheck` | Exit 0, zero errors |
| `npx eslint app/jelloo app/api/jelloo lib/jelloo tests/jelloo*.test.ts` | Exit 0, zero errors/warnings |
| `npm run build` | Exit 0; invite page and API present in route output |
| Build-wide lint | Existing unrelated `app/quiz/play/[id]/page.tsx:116` unused `event` warning; not changed |
| `npm audit --json` | Exit 1: **8 advisories, 1 critical and 7 high**; see dependency limitation below |

The previous Task 4 baseline was 203 tests (198 pass, 5 skipped). The additional 18 referral tests account for the new 221 total. The five existing integration skips were not represented as passes. Initial sandbox EPERM worker failures were rerun with allowed local worker execution; the final logs above are actual completed runs.

Focused coverage includes: all ten frozen boards equal current original tutorials; all ten proofs win in both server replay and game reducer; genuine sequential qualification; premature/fabricated Level 10 flags; fixed/off-grid/extra-key moves; over-budget actions; Undo/Restart semantics; wrong revision; identity/session substitution; nonce mutation and replay; self-referral; immutable attribution; duplicate starts; expiry/restart; renewal; recovery and cookie flags; concurrent duplicate qualifications; five simultaneous guests and all three thresholds; SQL rollback; commit-response loss; oversized streamed payloads; CSRF/content type/prototype-key inputs; actor/IP quotas; corrupt DB output; constraints/RLS/grants; service-role RPC execution; migration reruns; invalid configuration.

Logs: `docs/jelloo/task5-evidence/task5-{focused,tests,typecheck,lint,build,dependencies}.log`.

### Browser evidence and limitations

Real IAB browser, local production server `http://127.0.0.1:3011`, viewport **1280 × 720**. Referral configuration was deliberately disabled in that server process to guarantee no production database access.

- Opened `/jelloo/invite?ref=invalid`: malformed-link message, unavailable-service message and disabled invalid recovery submit confirmed.
- Clicked Create identity with unavailable service: safe error remained, no reward/identity success claimed.
- Measured visible buttons: approximately 45.33px high; document scroll width 1265px, below 1280px viewport.
- Followed adventure link, played original Level 1 (deterministic tutorial, no random seed input), rotated row 4 column 2 once; won with one move and three stars. Closed dialog and followed the new invite entry successfully.
- Screenshots: `docs/jelloo/task5-invite-unavailable.png` and `docs/jelloo/task5-evidence/original-tutorial-win.png`.

**NOT TESTED in browser:** successful identity creation, the full verified journey, earned reward rendering with real server records, recovery on a second device, clipboard/native OS sharing, real offline transport, narrow mobile viewports/orientation, Safari/Android/iOS, or full keyboard/screen-reader audit. API/SQL tests cover the corresponding server flows, not these browser/device claims.

## Exact Task 5 source files

New:

- `app/api/jelloo/referrals/route.ts`
- `app/jelloo/invite/page.tsx`
- `app/jelloo/invite/Invite.tsx`
- `app/jelloo/invite/ReferralPlay.tsx`
- `app/jelloo/invite/client.ts`
- `app/jelloo/invite/invite.module.css`
- `lib/jelloo/referrals/protocol.ts`
- `lib/jelloo/referrals/verify.ts`
- `lib/jelloo/referrals/server.ts`
- `data/jelloo/referrals/tutorials-v1.json`
- `supabase/migrations/20261023000001_jelloo_referrals.sql`
- `tests/jelloo-referrals.test.ts`

Modified: `app/jelloo/GameView.tsx` (optional verification presentation and invite navigation only in this task), `package.json`, `package-lock.json` (PGlite dev/test dependency). This report and the evidence files listed above were added. Pre-existing Task 4 files are not claimed as new Task 5 changes.

## Operations required before release / owner approval

1. Review the additive SQL and apply it first to a disposable **staging** Supabase project, under the migration owner. Confirm PostgREST function visibility and service-role EXECUTE access, anon/authenticated denial, RLS and concurrent independent-connection rollback/retry behavior. No migration was applied remotely here.
2. Set server-only `SUPABASE_URL` (or existing `NEXT_PUBLIC_SUPABASE_URL` URL fallback), `SUPABASE_SERVICE_ROLE_KEY`, `JELLOO_REFERRAL_ORIGIN` (exact HTTPS origin, no trailing path/slash), and `JELLOO_REFERRAL_SECRET` (fresh random secret, at least 32 characters). Never expose either secret with a NEXT_PUBLIC prefix. Missing/invalid configuration deliberately leaves referrals unavailable while the normal game remains playable.
3. Configure trusted reverse-proxy IP extraction and outer request/time limits. Monitor 429/503 rates and abuse; shared NAT/proxy users may hit conservative limits. The rate limiter bounds individual sources, not a distributed botnet or total database size.
4. Schedule privileged cleanup of rate buckets older than one day (`jelloo_referral_limits.started`) and define retention for abandoned identities/pending sessions. Do not prune earned identities/rewards or qualified edges; those are the durable recovery and anti-duplicate ledger. No cleanup job or production data deletion was executed.
5. Resolve dependency advisories before production approval. npm audit flagged existing Next.js 15.5.27 as critical (GHSA-2464-fhr4-w9xw, image optimization SVG RCE) and high (GHSA-p3m5-59mp-jv5r, Server Actions DoS), plus tooling advisories in eslint/tailwind transitive packages. This report records registry findings, not a reproduced exploit or confirmed exploitability of this site's configuration. No broad framework upgrade or `npm audit fix --force` was made within this feature task. PGlite was not among the reported vulnerable packages.
6. Supply/review the approved Golden Clover and Rainbow Trail assets before enabling their visual application. Existing entitlements can be honored later without re-qualifying referrals. The Ambassador badge is available now on the invite screen.
7. Complete staging browser flows and narrow-screen/device/accessibility checks above. Then obtain owner approval for any production migration or deployment separately.

## Readiness decision

| Area | Verdict |
|---|---|
| Legal action verification and immutable tutorial binding | PASS locally |
| Attribution, recovery, counters and reward transactions | PASS in deterministic SQL/API tests; live concurrency PARTIAL |
| RLS/private RPC and server-only credentials | PASS locally; live Supabase PARTIAL |
| Original tutorials/quiz regression | PASS automated; Level 1 browser smoke PASS |
| Invite UI integration/error handling | PASS desktop smoke; full/mobile flows PARTIAL |
| Reward delivery | PARTIAL: two approved assets unavailable; entitlements and badge implemented |
| Unique-human/friendship fraud prevention | Not guaranteed by anonymous design |
| Production readiness | **PARTIAL — owner approval and operational gates still required** |

Stopped after Phase 7 Task 5. No Phase 8 work, artwork replacement, quiz edits, production writes, push, merge or deployment.
