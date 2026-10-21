# Jelloo — reference gameplay update

Implemented locally from the user's supplied Jelly Pals.html interaction reference. No deployment.

- Compact single-column pastel pipe board; approved Bunny texture and cottage preserved. Clear SVG paths replace textured path tiles for readable green connection feedback.
- Connected tiles are recalculated after each rotation, including dead-end branches. A complete route auto-starts after a 250ms settle interval; no Go button. Timers are cancelled on edits/navigation/hiding and the reducer rejects stale, incomplete or duplicate auto-starts.
- T-junctions start in new tutorial 4. New endless boards attempt a validated junction upgrade; if it would violate existing difficulty/solvability gates, the original board remains. With junctions, Bunny follows the deterministic shortest connected route (breadth-first search); collectibles must lie on that route. Loops terminate safely.
- New-board rules are version 3. Existing rules 1/2 saves reconstruct their exact boards. Moving to a different level uses new rules; no saved progress reset.
- Victory dance precedes a compact native dialog. Close/Escape return focus to the board; explicit forward/reverse Tab containment covers the popup buttons. Result can be reopened. Restart, Undo, sound, stars, best scores and reduced-motion support remain.
- Level buttons and collapsed help/settings keep the main screen focused on play.

Validation: all **25 tests passed** (22 existing, with migration assertion advanced to current rules, plus 3 new connection/auto-start/junction/save-compatibility tests). TypeScript and targeted ESLint passed. Browser verified auto-start without Go, a three-star T-junction tutorial, live green feedback, popup forward/reverse keyboard boundaries, Escape and focus restoration. 390px layout had no horizontal overflow. Screenshots: compact-gameplay.png and compact-result.png.

Unchanged limitations: local/browser saves, finite puzzle configurations, difficulty capped at the Expert band; no production deployment/build or physical-phone performance validation in this update.
