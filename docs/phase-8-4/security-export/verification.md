# Security/export verification ledger

Local Node24.21.0 / Next15.5.28; branch `feature/playnudge-phase-8-4`. Starting HEAD `2d0db17`; main/origin-main both `4d28eb33e22db3edb788199c711b9579a799767c`. No previous commits rewritten.

| Gate | Executed result | Evidence |
|---|---|---|
| Focused security/transfer | 26 total,26 pass,0 fail,0 skipped | `evidence/focused.txt` |
| Full npm test | 323 total,318 pass,0 fail,5 skipped,0 cancelled;84625.014ms | `evidence/full-tests.txt` |
| TypeScript | Exit0,zero errors | `evidence/typecheck.txt` |
| ESLint | Exit0,zero errors,15 pre-existing warnings | `evidence/eslint.txt` |
| Production build | Exit0,Next15.5.28 production output successful | `evidence/build.txt`, `evidence/gate-exits.txt` |
| Production HTTP assertions | 9 passed;QA/internal404,transfer200/noindex,quiz/map200,sitemapVercel200,legacy307,referrals503/no-store | `evidence/production-http.txt` |
| Public client bundle heuristic | Zero Netlify context-store,service-secret name,common private-key/token matches | `evidence/public-bundle-scan.txt` |

All four full-gate exit codes are0. Production browser/guard evidence is local, not a managed Netlify execution. Actual production-build `/jelloo/transfer` rendered and its button safely refused the empty isolated profile with “A valid Adventure save is required. Nothing has been changed.” Screenshot:`evidence/production-transfer.jpg`. No owner's real progress or production origin was opened. This browser check proves production UI/error usability; it is not a new full transfer round-trip or a Netlify ingress test. Public bundle scan is a heuristic, not a historical secret audit.

The previous baseline316/311/5 increases by exactly seven cases: five SDK context tests, one local PIN-limit isolation test and one nonmutating transfer test. Existing spoof/unknown tests still assert failure without real SDK context; no assertion was weakened to call an environment marker trusted. Unit tests populate the real SDK AsyncLocalStorage in test memory; no claim of platform ingress verification. Local rate-limit regression explicitly requires no configured database and retains five failures/600-second logic unchanged. Managed Supabase integration remains the five skipped tests, not a pass.

Pinned production dependency `@netlify/functions`5.3.0, transitive `@netlify/types`2.8.0; only two new packages. Registry implementation inspected before final pin. No automatic package audit fixes, framework upgrades or lockfile refresh of unrelated packages. Runtime package6.0.3 was only a preliminary reviewed candidate; its higher Node floor was rejected before final gates. Current install/lock use5.3.0.

Known remote URL/service/test aliases, Upstash/referral secrets were explicitly emptied for full gates/local production server. No production data read/write or staging resource created. No private owner save was read/copied; prior browser fixtures remain synthetic. No local save reset. Source comparison against starting HEAD confirmed app/jelloo, lib/jelloo, app/quiz, quiz route handlers, artwork/ad widget, canonical and next.config unchanged. Security helper and dependency lock are the intentional backend changes.

StageA is **GO for owner review / NO execution without approval**, with complete tested branch surface explicitly disclosed. StageB is **NO-GO** until real adapter SDK-context propagation, independent-client tests, cookies/functions, durable quiz configuration, hooks/publish controls/rollback, private source-origin backup and existing-ad compliance are verified. Owner-supplied stopped-build/credit facts are accepted without repeated account inspection. No credits spent by this preparation.
