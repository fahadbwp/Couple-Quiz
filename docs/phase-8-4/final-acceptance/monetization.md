# Monetization activation checklist — nothing enabled

The $1,000/month net target is a business objective, not a forecast guarantee. Existing local economics calculator correctly separates opportunities, filled impressions and net operating profit. Its base assumptions produce$315 operating revenue,$60 costs,$255 net; approximately16,826daily active browsers at those assumptions would be needed for$1,000net. These are synthetic assumptions, not PlayNudge audience numbers or provider CPM quotes. Acquisition quality, geography, seasonality, fees, invalid traffic and actual provider reports must replace estimates before financial decisions.

## Existing live integration — unresolved risk, unchanged

`components/ads/AdsterraFooter.tsx` still injects its existing third-party footer widget on quiz pages, including input/PIN/gameplay contexts. Script,placement,ID and production policy are unchanged. Earlier QA reported adult/dating/gambling creatives; this task did not request live creatives to reproduce them. Local QA blocked external scripts using a harness-only CSP. Analytics opt-in does **not** control that widget.

Account category settings, their effectiveness for this widget, frequency/geo behavior, consent/legal treatment and domain approval are not verified. Owner must review adult/dating/gambling/deceptive download exclusions with provider support and test approved inventory. If adequate controls cannot be established, owner must authorize removing/restricting/replacing the exact integration. No claim of family-safe inventory or legal compliance is made. See existing [advertising analysis](../ads-android-and-origin.md).

## Before Google display activation

- [ ] Confirm publisher account/site ownership and target hostname. AdSense requires [site ownership](https://support.google.com/adsense/answer/91205?hl=en) and [site review/Ready status](https://support.google.com/adsense/answer/12131223?hl=en); deploying on Netlify is not approval. Verify any provider-specific domain authorization for the new host.
- [ ] Add only provider-issued verification/IDs under explicit authorization; no invented IDs. Check root ads.txt against actual account instructions and [official guidance](https://support.google.com/adsense/answer/12171244?hl=en). No ads.txt placeholder submitted here.
- [ ] Decide audience honestly; review category exclusions and inventory. Cute artwork alone neither establishes a child audience nor ensures safe ads. Review privacy disclosures, vendor data, retention, rights and regional requirements with appropriate expertise.
- [ ] Evaluate a compliant ad consent setup. For personalized advertising inEEA/UK/Switzerland, Google describes a [certified CMP/TCF requirement](https://support.google.com/adsense/answer/13554116?hl=en). The development-only analytics consent switch is not that CMP.
- [ ] Review [AdSense placement rules](https://support.google.com/adsense/answer/1346295?hl=en). Homepage after discovery and All Games after list only if approved, separated from navigation/touch targets; reserve measured space, limit density/frequency. No ads in quiz answers/PIN/submitting or active Jelloo rotations/movement.
- [ ] Any Jelloo ad appears only at a permitted natural result transition, clearly marked and easy to dismiss. Never fabricate gameplay records or encourage accidental clicks. No automatic refresh, inflated impressions or artificial traffic. Current future-slot code stays disabled/unmounted.
- [ ] Measure only genuinely served provider impressions and publisher revenue, deduplicate analytics separately, reconcile fees/hosting/acquisition costs. Never treat a slot render or ad opportunity as paid impression or guaranteed income.
- [ ] Obtain owner release authorization after provider/account/privacy checks. `ADS_ENABLED=false` and no new provider SDK/script activation remain in force now.

## Games ads and Android

Google [H5 Games Ads application](https://support.google.com/adsense/answer/1705831?hl=en) is a separate eligibility/review path requiring an approved AdSense account. A browser puzzle does not establish acceptance. Apply only with owner approval; integrate eligible natural-break/rewarded placements only under the provider's current game policies. No H5 SDK or application submitted.

Android/AdMob is future work: choose PWA/TWA/native deliberately, preserve origin save/export compatibility, verify package/signing/domain association, store policy/audience/Data Safety/privacy and approved SDK inventory. A TWA/WebView is not automatic Play or AdMob approval. Review [Google Play Families policy](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en) for the chosen audience. No Android build, ads/payment integration or Phase8.5 work was started.

**Activation blocked pending owner/account/provider review.** No revenue, traffic, retention, entitlement or approval figures were invented.
