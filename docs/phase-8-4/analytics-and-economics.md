# Analytics, measurement and economics — Phase 8.4

## IMPLEMENTED

One typed, dependency-free interface across both games (`lib/analytics`, `components/analytics`). Production has no ingestion endpoint, SDK, server database, network adapter or identifiers. `ANALYTICS_ENABLED=false`; the local adapter additionally requires a development build, explicit opt-in, and no DNT/GPC. Changing that constant alone does not launch collection. The internal page requires development **and** `PLAYNUDGE_LOCAL_INSIGHTS=1`; production must return 404 even with that variable set. This is a development tool, not authenticated internet staging. Do not expose a development server publicly.

### Taxonomy v1

| Events | Trigger and context |
|---|---|
| page_view, level_map_open | Normalized allowed route; once per browser session and route |
| game_card_click | Click of either known game card; game enum only |
| game_start | First start of a mode in a session |
| adventure_level_start, adventure_level_complete, adventure_level_retry | Session/board start, logical board win, explicit restart; game/mode/level and outcome |
| daily_start, daily_complete | Session/date/board start and logical win |
| zen_start | Session/board start; no completion claim |
| power_trial_start, power_trial_complete | Session/pal/trial start and logical win |
| favourite_pal_equipped | Explicit equip action; pal enum |
| quiz_create_start, quiz_create_complete | Creator page and successful API response |
| quiz_share_action | Successful copy/native handoff or share-window action; not confirmed recipient delivery |
| quiz_participant_start, quiz_participant_complete | Started quiz and successful attempt API response |
| quiz_results_view | Valid restored/fetched result shown |

Properties allow only game, mode, level, outcome, pal, normalized page enums. Context is limited to 256 JSON characters. Records have exact v1 fields, safe millisecond timestamps, random browser/session UUIDs and a SHA-256 deduplication key. Private quiz IDs used as local dedupe input are never stored as raw properties. Hashes are not permission to add sensitive properties. No names, answers, PINs, email, phone, raw IP, URLs, query strings, recovery codes, advertising IDs or fingerprinting. No animation-frame events. Analytics catches storage/hash errors and never awaits collection from gameplay.

### Consent, identity and deletion

Local opt-in is explicit in `/internal/growth`; revocation deletes analytics identity/events/session, preserving all game storage. Browser identity expires after 30 days, inactivity starts a new session after 30 minutes, tabs have independent sessions. Log retains at most 3,000 records/30 days and validates on reads. Age-based purge is lazy on read/write, not a background disk eraser; revoke performs actual deletion. Export is manual and private; imports are memory-only, bounded 2 MB/3,000 strict records. Imports are untrusted datasets, not verified production metrics.

Browser IDs are pseudonymous devices/profiles, **not unique people**. Storage deletion, privacy modes, tabs and devices affect counts. Consent denial is unobserved usage. Concurrent tabs can overwrite a local log; this is a developer sampler, not durable centralized measurement. Session/route dedupe deliberately suppresses refresh/history repeats and therefore undercounts repeat visits. Logical win dedupe suppresses replay wins of the same board across sessions. No claim of exactly-once distributed ingestion.

## Reporting methodology

UTC calendar DAU/WAU/MAU count distinct observed browser IDs, not pageviews. Local data only samples this browser. Sessions, normalized visits, actions and events are separately labeled. New/returning uses firstSeen. Level funnels require the same browser completing both milestone levels; matched browser+level completion rate is not a generator-seed conversion or causal attribution. Quiz funnel is a sequence of **aggregate counts**, not attributable creator-to-participant conversion: private link IDs are not collected. Mean observed session span is timestamp range, not foreground attention or engaged play time. Imported duplicate visitor/digest pairs count once.

Empty/unsupported metrics say **Insufficient data**. D1/D7 are withheld in the UI because continuous coverage is unproven. Pure report code can calculate mature firstSeen cohorts only with an explicit continuous-coverage assertion; this is tested using synthetic data. Never turn that assertion on for an incomplete local dataset. A future reviewed ingestion release needs an actual consent/market/legal decision, authentication/rate limits, server timestamps, trusted dataset provenance, deletion/access procedures, abuse handling and retention enforcement before platform reporting.

## Development workflow

Run the standalone credential-cleared `scripts/playnudge-phase84-qa.ts` only on loopback; it blocks external ad scripts via local-only CSP. For quiz flow, run the existing `scripts/platform-api-qa.ts` with `tests/setup.mjs`; its database is an in-memory mock. Visit local `/internal/growth`, opt in, play, refresh local events, and inspect/export the strict log. Revoke and verify the log clears while Adventure survives. Production route 404 and collection disabled are separate release checks.

## Editable financial model

The internal page exposes every assumption and sensitivity, using `lib/platform/forecast.ts`. Values below are illustrative balance inputs, **not current traffic, measured provider rates or forecasts guaranteed to occur**.

| Scenario | DAU | DAU/MAU | Opportunities/DAU/day | Fill | Publisher-net eCPM USD | Monthly costs USD | Revenue USD | Net USD |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Conservative | 1,000 | .20 | 2 | .50 | .30 | 30 | 9 | -21 |
| Base | 5,000 | .20 | 3 | .70 | 1.00 | 60 | 315 | 255 |
| Optimistic | 15,000 | .25 | 4 | .85 | 3.00 | 240 | 4,590 | 4,350 |

30 days/month assumed. Costs split into hosting/infrastructure, tools/monitoring, optional marketing and other recurring expenses. eCPM is after provider share, before those operating expenses. Gross advertising revenue here means operating revenue before expenses. Zero fill/eCPM/opportunities makes the target unreachable rather than dividing by zero.

`opportunities = DAU × days × opportunities/day`; `served impressions = opportunities × fill`; `revenue = served × eCPM / 1000`; `net = revenue − costs`; `MAU = DAU / assumed active share`; `target impressions = (1000 + costs) × 1000 / eCPM`. DAU requirements divide that target by days, opportunities/day and fill. Base delivery/cost assumptions need approximately 56,085 / 16,826 / 5,609 DAU at $0.30 / $1 / $3 net eCPM respectively. Rates, countries, eligibility, invalid-traffic deductions and real retention can change results substantially. No auto-refresh, synthetic impressions or Android/AdMob earnings are assumed.

## NOT TESTED / REQUIRES OWNER APPROVAL

Real production ingestion, market-specific consent/legal review, representative retention, audited revenue, provider account rates and deletion infrastructure. No financial target is promised.
