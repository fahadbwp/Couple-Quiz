# Jelloo — Phase 4: animation, scoring and puzzle quality

Implemented locally on 2026-10-21. Not pushed or deployed.

## Gameplay quality

The previous repeating easy/medium/hard cycle was replaced with four advancing difficulty bands. A route solver enumerates all possible simple paths through rotatable tiles, including shortcuts through decoys. Budget exhaustion cannot be accepted as evidence that a puzzle meets the quality gate.

| Levels | Minimum solution rotations | Minimum route cells | Minimum bends | Three-star move allowance |
| --- | ---: | ---: | ---: | --- |
| 11–20 | 6 | 8 | 3 | Best all-collectible route + 5 |
| 21–30 | 11 | 10 | 4 | Best all-collectible route + 4 |
| 31–40 | 16 | 12 | 5 | Best all-collectible route + 3 |
| 41+ | 21 | 14 | 6 | Best all-collectible route + 2 |

From level 21, every third level requires an actual tradeoff: collecting every golden star takes more rotations than the cheapest route home. Other levels mix route layouts and distractions. A bounded search falls back to a separately validated branching board if needed. The fallback gets two spare moves.

The 400-puzzle audit sampled 100 seeds/levels in each band. Average minimum rotations: **16.33, 16.60, 21.54, 25.69**; average shortest paths: **11.96, 12.72, 15.52, 17.32**; average minimum bends: **6.57, 7.06, 8.90, 10.05**. The pre-existing 1,500-puzzle test confirms more than 1,400 distinct solved boards, reproducibility, solvability and unsolved starts.

A separate 300-level sample (seed 123) had 100 boards with multiple routes, 99 with a costlier all-star route, and one fallback. These are objective complexity/variety checks, not proof of human enjoyment. Finite boards can repeat eventually. Difficulty varies within a band and stays at Expert after level 41; future powers/worlds are needed for additional mechanics rather than arbitrarily increasing taps forever.

## Scoring and presentation

- 1 star: reach home. 2 stars: reach home within the displayed move target. 3 stars: meet that target and collect every golden star.
- Collectibles are awarded when Bunny reaches their cells, never on Go alone. Undo does not refund moves. Reset starts a fresh attempt.
- Inline win screen: earned-star reveal, score breakdown, retry, Next Level. Keyboard focus moves to the result heading and returns to the board on retry/next. No modal focus trap is needed.
- Best ratings and sound preference persist. Best-score storage is bounded to the highest 200 level IDs; sequential completion remains separate. Replays cannot reduce a saved best.
- Existing phase-3 saves retain their current board under legacy rules; entering a different level uses rules 2. Unsupported future/corrupt saves remain protected from overwrite.

## Animation and sound

- Existing Bunny texture only: body squash/stretch, ear bounce via CSS clipping/transforms, hop/takeoff/landing, confused tilt, victory dance and blink. No image regeneration or reference changes.
- Quiet synthesized Web Audio cues for rotation, hops, collection, confusion and victory. One context is unlocked by a player gesture. Rapid rotation sounds are throttled, simultaneous voices capped, scheduled voices stopped on mute/reset/navigation/hiding, and context closed on unmount.
- Saved mute toggle; no autoplay audio on reload. Audio API failure does not prevent play.
- Motion toggle and OS reduced-motion preference disable cosmetic animation/transitions. Reduced-motion traversal uses shorter logical steps. Hidden documents pause travel; stale run callbacks are ignored.
- Next endless board is generated in a Web Worker to keep its solver off the interaction thread. Duplicate requests are guarded, controls show preparation state, and errors allow retry. Browsers lacking Worker support use the bounded main-thread fallback; initial save reconstruction also runs on the main thread.

## Verification

- **22/22 tests passed**: all existing 13 plus 9 new tests for quality gates, bounded fallback, 1/2/3 scoring with a real optional detour, exactly-once feedback, rapid taps/stale callbacks, reduced-motion timing, save migration, best/mute persistence, unavailable audio and mocked audio scheduling/throttling/cleanup.
- TypeScript and targeted ESLint passed; whitespace check passed.
- Browser playtest on a separate local origin: completed tutorials 1–10 through actual controls, loaded worker-generated level 11, completed it with 3 stars, reloaded and verified saved result, best rating and mute preference. Existing localhost player progress was kept separate from this full playthrough.
- Earlier localhost replay verified animated victory and a three-star result. No browser console errors observed. Synthesizer events are tested, but speaker playback quality was not independently listened to.
- Responsive checks: 320px, 390px and 1440px layouts; 320px five-column board buttons measured **47.06px** wide with no horizontal overflow. Saved mobile and desktop screenshots are alongside this file.
- Desktop generation timing sample: p95 approximately 41ms and maximum 111ms while other checks ran, motivating the Worker. These are not phone FPS measurements. Physical iOS/Android, OS-level reduced-motion emulation and production build were not tested this phase.

Approved reference SHA256: `96C67B207D4D58EE8EFA6A0C404E86DD982016CF7EE4E33DD64A0CC3E000F5B6`.
Unchanged Bunny texture SHA256: `304112EEF8583C71245612B45E39A42EAA38F9F221E66ABB44C8FEE0D002425A`.
