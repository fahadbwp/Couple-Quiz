# Advertising, Android and saved-origin safety

## Existing advertising — preserved risk

`components/ads/AdsterraFooter.tsx` already injects a third-party footer script on quiz pages, including form/PIN contexts. Prior browser QA observed adult/dating/gambling creatives. This phase does not claim those creatives recur on every visit and does not request live ads to reproduce them. Existing script, ID, placements and production CSP are unchanged. New analytics consent does **not** control that widget. A family-friendly release needs separate owner approval to change/remove/restrict the existing integration and address its consent/creative risks.

Adsterra's [official monetization FAQ](https://adsterra.com/monetize-traffic/) publicly states that publishers have category-level content controls and may report problematic creatives through account live chat. This establishes a provider claim of supported category blocking, **not** verification of the categories selected or enforced for PlayNudge's current widget. Its [Social Bar page](https://adsterra.com/social-bar-ad/) also describes excluding less relevant advertising; neither source guarantees a family-safe feed for this account. [Publisher security claims](https://adsterra.com/publishers/) concern broader ad safety, not proof of child-appropriate creative.

Granular category choices, site-specific applicability, advertiser/domain blocks, availability for this exact placement and fallback behavior are **NOT VERIFIED**: owner must inspect the publisher account and obtain written support confirmation. Request adult, dating, gambling and deceptive-download exclusion; verify frequency controls, reporting/escalation and geographic behavior. Adsterra's public [whitelist/blacklist guide](https://adsterra.com/blog/whitelist-vs-blacklist-in-digital-marketing/) describes **advertisers excluding publisher placement IDs**; that is not evidence of a publisher-side creative/domain blocker. If adequate publisher controls cannot be demonstrated, replacement/removal is an approval decision. Never promise absolute filtering. No account configuration or support message was sent.

## IMPLEMENTED: future placement boundary (disabled)

`ADS_ENABLED=false`; `FutureAdSlot` has no network, script, ID or provider. Not mounted on live pages. It reserves space only if a future approved adapter satisfies all gates. Placement IDs:

| Slot | Allowed phase / policy |
|---|---|
| home-after-discovery | Idle; below game discovery, outside hero |
| games-after-list | Idle; limited display slot after list |
| quiz-after-result | Result only; never PIN/forms/answers/submission |
| jelloo-after-result | Result transition only; never board/rotation/movement |

Consent + family approval + release flag + non-internal route + matching phase are required. Real provider integration, spacing/frequency, route provenance and consent must be reviewed before use; typed context alone is not an authorization boundary. No overlays, deceptive game-like creatives, ads beside touch controls, auto-refresh or artificial impressions. Future interstitials need natural transitions/provider approval. Future rewarded ads must be voluntary and cosmetic-only. No rewarded-ad implementation is included. Debug/internal pages are ineligible. New layer introduces no CLS while disabled. Existing third-party widget remains a separate unresolved risk.

## Android architecture — documentation only

| Option | Benefits | Work / limitations |
|---|---|---|
| PWA | Reuse web app, installable experience | Current app is not proven offline; add versioned app-shell/assets caching, update recovery and device QA separately |
| Trusted Web Activity | Browser-rendered approved web experience | Requires controlled HTTPS domain, stable package identity and Digital Asset Links tied to signing certificate; browser-owned storage and domain changes still matter |
| Native/hybrid | Native storage, billing/ad SDK and device integration options | Largest engineering/testing surface; secure bridge, offline assets, migration, permissions and lifecycle work |

Official [Android TWA overview](https://developer.android.com/develop/ui/views/layout/webapps/trusted-web-activities) explains verified app/site association. A WebView/TWA wrapper is not automatic Play acceptance. Choose audience honestly; cute artwork alone does not settle classification. [Google Play Families requirements](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en) impose additional data/advertising constraints for children and mixed audiences, including appropriate SDK/ad treatment. Confirm current policy at release, complete Data Safety/privacy/store listing/content-rating declarations, and audit any ad/analytics SDK. Web Adsterra and native AdMob are different integrations; no AdMob exists here.

Offline must bundle approved atlases, sounds, level logic and version compatibility; Daily UTC rules, referral/server verification and quiz API cannot simply become offline authority. Test interrupted updates, stale assets and storage quotas. Uninstall/browser clearing may erase saves; restoration requires an approved export/import or authenticated sync, not a promise. Establish package name, owner-controlled signing/release keys, Android App Bundle and app/site certificate association. Prepare approved screenshots/icon/store description and privacy URL. Device matrix: low-memory Android, rotation, lifecycle suspend/resume, offline/reconnect, back navigation, touch/audio/haptics, accessibility. Crash reporting needs separate privacy/provider approval. **No Android build or submission in this phase.**

## Vercel → Netlify: proposed save migration, not implemented

Current canonical origin remains `https://friend-quiz-game.vercel.app/`. `https://playnudge.netlify.app/` is a different origin: localStorage, cookies and service workers do not automatically transfer. Nothing here changes production domains, Netlify stopped-build settings, canonicals, existing saves or referral cookies.

Future approved migration sequence:

1. Implement explicit export on old origin; validate and package Adventure revision, board snapshot, completed/best, Daily/Zen/Trials where supported, Favourite and new cosmetic preferences. Never include quiz PINs, referral recovery tokens or analytics by default. Keep local copy; show revision and completed/star summary.
2. On new origin, explicit file import with strict byte/schema/bounds/historical-generator checks. Preview differences, preserve original destination save, confirm conflict resolution; never silently overwrite higher progress or reinterpret in-progress boards. Round-trip/rollback tests before launch.
3. If cross-origin handoff is later chosen, require verified exact origins, explicit user confirmation, nonce/expiry and narrowly validated postMessage payload. Never put credentials/saves in query strings. File export/import is simpler and must tolerate offline transfer.
4. Referral HttpOnly recovery identity remains on old origin. Separately approved server flow can restore with existing recovery proof into a new secure cookie; public invite code is not proof. Avoid URLs/logs/analytics, explain stolen-token risk. Links/canonical-origin validation and expirations need separate review. No automatic cookie migration.
5. Preserve old-origin access long enough for voluntary export/recovery, retain verified backups under owner policy, test fresh/legacy/corrupt/conflicting saves and both domains. Do not promise automatic carry-over.

## BLOCKED / REQUIRES OWNER APPROVAL

Ad account controls and changes, audience/legal review, provider contracts, app identity/signing/store launch, offline/PWA work and any domain/save/recovery migration. No production operations performed.
