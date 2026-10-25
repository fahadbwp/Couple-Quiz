# User-operated origin save transfer

Implemented locally at `/jelloo/transfer`; **not yet deployed on Vercel or Netlify**. A separately approved source-origin release is required before the owner's existing93/100 Vercel save can use this page. Keep the old site accessible and never clear its storage as part of migration.

1. On the original website and original browser/profile, close other Jelloo tabs. Open Transfer progress and select **Download progress file**. Keep this file private. Export refuses corrupt/unsupported slots rather than silently replacing them with defaults.
2. On the approved new website, preferably in a fresh browser profile, open the same page and choose the downloaded JSON. Nothing is uploaded or applied by choosing a file.
3. Check the preview: expected93 completed, Level94, your saved stars and generator revisions. The source origin is an informational label, not an authenticated signature. A file does not prove server achievements.
4. Any different existing meaningful destination slot blocks import, even if its progress is lower. Do not clear that progress to force import: export both and keep separate profiles. Missing optional source slots never delete existing destination slots.
5. Confirm the checkbox only after closing other game tabs, then select **Back up & import progress**. A verified pre-import backup and recovery journal are written before any game save. Prior different backups are not overwritten; use a new profile instead.
6. Open Adventure Map, check completions/stars, resume current board and refresh. Check Daily, Zen, Trials, Favourite and cosmetics where exported. Keep the old-origin save/file until satisfied. Cookies, accounts, quiz PINs/answers, analytics and referral recovery secrets never transfer.

## Format and safety boundaries

`playnudge-save-transfer`,version1,64KB limit; exact envelope and six allowed raw string slots. Adventure validation uses the existing historical decoder and preserves raw bytes including generator/rules/multiRevision, rotations, moves and Jelly specifications. Daily/Zen validate version, dates/bounds/board lengths; Trial, Favourite and cosmetics use their own validators. Unknown fields, private-key additions and invalid optional slots reject the file. No board re-generation upgrade is written during transfer. Legacy rules1/revision0 round-trip is tested.

Slot allowlist: `jelloo.progress.v1`, `jelloo.daily.v1`, `jelloo.zen.v1`, `jelloo.pals.v1`, `jelloo.favouritePal.v1`, `jelloo.cosmetics.v1`. Identity/referral cookies are deliberately excluded. Local cosmetic achievements remain editable and cannot attest referral qualifications.

Import compares destination state against preview and before each slot write, verifies each readback and retains `jelloo.transfer.backup.v1`. Browser storage is **not a cross-tab transaction**: closing other game tabs remains required; narrow unavoidable concurrent-write races are not claimed impossible. An interrupted import can use **Recover interrupted import**. Recovery restores only slots still equal to the attempted imported value; other-tab edits are preserved and reported. Quota failure before backup changes no game slots; mid-write failures attempt rollback and retain backup/journal on unresolved errors.

**Download pre-import backup** is a separate local recovery format, not a normal transfer file and not a one-click successful-import Undo. Never edit files to bypass a conflict or promise automated cloud recovery. Unsupported/oversized history must be reviewed without deleting originals.

## Verified evidence

Fourteen unit cases and actual browser transfer between127.0.0.1:3032 and3033, using a synthetic93-completion Level94 seed42 save with279stars and one saved move. Preview, explicit application, refresh restoration and different-board conflict refusal verified. All six optional slots and legacy revisions covered in automated tests; actual production-origin transfer remains **NOT TESTED / not deployed**. Owner real save was never read, changed or copied.
