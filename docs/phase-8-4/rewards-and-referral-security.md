# Rewards and referral security

## IMPLEMENTED: cosmetic achievement path

| Numeric referral threshold | Previous label | New cosmetic | Adventure alternative |
|---:|---|---|---|
| 1 | Golden Clover | Royal Pal Crown | 20 completed levels |
| 3 | Rainbow Trail | Secret Dream Theme | 60 completed levels |
| 5 | Ambassador badge | Legendary Victory Celebration | 100 completed levels + 200 stars across Levels 1–100 |

These thresholds align early reward after Panda/second unlock milestone, mid reward before Level 71 teams, and late reward after all 100 levels with a two-star average. They are **proposed balance defaults implemented for review**, based on existing progression structure, not unavailable measured player/retention data. Existing character and Multi-Jelly unlock thresholds, scoring and progression are unchanged. No friends required. No rewarded ads, purchases or solving advantage.

`lib/jelloo/cosmetics.ts` is the entitlement abstraction. Existing numeric reward DB identifiers remain 1/3/5, so **no SQL migration needed**. Old earned numeric rows map to new presentation; the previous Ambassador badge remains in gated Invite UI. Old progress/favourite keys and schemas are unchanged. Separate strict `jelloo.cosmetics.v1` stores booleans; corrupt preferences are preserved and not overwritten. Unearned stored flags do not activate cosmetics. Server referral status is ignored while `REFERRALS_RELEASED=false`.

The Crown is a lightweight SVG accessory over original sprites, supported across the five pals; it changes no atlas. Dream changes panel/background/board accents without changing terrain, connectors or geometry. Legendary adds a noninteractive result banner, after a real win only, in single/Two/Three-Jelly; no fabricated stars/path/results. Reduced-motion media and existing game toggle disable animation. Favourite/required/multi identity selection remains untouched. Equipping is optional and reversible.

Adventure achievements are **client-only integrity**: valid local progress is not server attestation; a knowledgeable player can edit or copy saves. That is acceptable for local cosmetics, never for referral credit. Future launch must wire only authenticated authoritative RPC status to entitlements, refresh after qualification/recovery, and decide cache/revocation/offline behavior. Shape validation is not server authentication. Referral cosmetic path is not end-to-end live while gate is closed.

## Security review of existing referral implementation

The existing `20261023000001_jelloo_referrals.sql` remains unapplied remotely by this task. Five private RLS tables deny anon/authenticated access; only service_role may execute the private RPC; it cannot directly read those tables. Server RPC uses transaction-scoped identity/advisory locks, inviter row serialization, durable unique milestones, nonce/revision and frozen tutorials. Signed server actor hash derives from bearer recovery secret; public link is not recovery authority. Same-origin/content-type/body/rate controls exist. No production credentials requested or printed.

| Threat | Existing tested boundary | Residual risk |
|---|---|---|
| Self-referral | Same actor rejected | New identities can be manufactured |
| Multiple referrals in one browser / repeated registration | Current recovery cookie preserves identity; SQL/IP registration limits | Clearing cookies/multiple profiles/devices is not proof of different humans |
| Duplicate qualification/replay | Exact legal transcript + session nonce/revision; duplicate final idempotent | Real multi-connection contention not established by single PGlite |
| Concurrent milestones | Unique numeric reward rows, transactional counter/grants and retry tests | Require independent real PostgreSQL connections in approved staging |
| Forged completions | Frozen server levels 1–10, legal rotations/undo/reset, budget and winning replay | Automated solvers can still solve; this is not bot-proof identity |
| Malformed/expired links | Strict hex codes, active link/session expiry, immutable attribution | Distributed public traffic needs operational monitoring |
| Stolen/copied recovery | Public codes/hashes cannot recover; secure cookie and redacted UX | A stolen bearer recovery token grants that identity; same token across browsers shares identity, cannot prove a human |
| Endpoint abuse | Payload limits, origin/operation validation, durable rate records, sanitized errors | Proxy configuration, distributed/IP sharing and retention policy need staging/operational review |
| Partial transaction / response loss | Rollback and retry tests preserve qualification/nonce/grants | Managed platform configuration and incident recovery remain untested |

## TESTED vs BLOCKED

Existing 18 referral tests run real migration SQL in an isolated **single-connection PGlite** database: grants/RLS, legal ten-level proof, self-reference, eight duplicate finals, five guests, replay mutations, expiration/recovery, malformed requests, forged results, rate limits, storage failure, lost response, rollback, output corruption and invalid config. These tests are not a real Supabase penetration/concurrency audit. New Phase 8.4 tests cover mapping, ignored forged referral status, numeric compatibility and release boundaries; original tests are preserved.

**BLOCKED:** no owner-provided disposable Supabase staging project. Independent-connection 1→3→5 concurrent qualification, real PostgREST role/JWT/RLS, deployment cookie/proxy/rate behavior, managed rollback/retry and recovery need separately approved staging. No resource creation or remote SQL occurred. No claim that one browser means one person.

## Before any future referral release (OWNER APPROVAL)

Approve disposable staging, run the above independent-connection and adversarial cases; review secret storage, origins/proxy trust, abuse monitoring and personal-data retention/deletion; verify authenticated status-to-cosmetics wiring and recovery. Review production migration separately. Keep UI unavailable and API 503 until those steps and owner launch approval are complete. This phase does not enable referrals.
