# Next session — score a miniboss by its room flag

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/prompts/LEDGER.md`'s "Settled at S136" and "Settled at S135" sections.
- `docs/NEXT-SESSION.md`, the S136 entry only.
- `tools/measure-boss-combat.mjs`'s `MINIS` table and the comment above it,
  and the block that decides a fight's outcome.

## Why this, now
Every fight in the game is now set up the way the run arrives at it, and the
miniboss half of that cannot be scored. The rig's ground truth for a miniboss
is the room's own puzzle flag, and the route's `boss` directive names one
target and does not clear the room — so a dead Reefguard with a live urchin
beside it reports "still alive after 18000 frames". S136's six miniboss spreads
had to be read off `boss damage dealt` by hand. That is a fine number and it is
not a result the tool states.

## The task
Make `tools/measure-boss-combat.mjs` decide a miniboss fight correctly: the
named target being dead is a WIN, whatever else is still standing, and the room
flag is reported alongside rather than instead. Say in the summary which of the
two happened, so a fight that kills its miniboss and leaves the room uncleared
is legible as exactly that. Then re-run the six minibosses at the five seeds
`20260806 1 2 3 4`, in both arenas, and confirm the tool now prints by itself
the table S136 had to assemble by hand.

## Done means
- The six spreads, printed by the tool, matching S136's table in
  `docs/NEXT-SESSION.md`, with any disagreement explained.
- `node tools/check-bosses.mjs` green — it shares this file's fight table.
- `node tools/check-playthrough.mjs` green, ending in `d6/1,3,1` with six
  Essences and no deaths.
- `node tools/check-drift.mjs`, `node tools/test.mjs`, `node tools/replay.mjs`.
- `npm run build` with `dist/oracle-of-tides.html` committed.

## Out of scope
- Changing any fight, enemy damage, boss hp or boss option. This is scoring.
- The Brinehulk's one-in-five and the Clawcrab's nought-in-five. They are real
  readings and they are the session after the scoring works.
- Any route change. The trace is the input, not the output.
- Re-transcribing the twelve arena rows. They are settled at S135 and S136.
- The 460-frame pickup fuse, still unaudited outside the Abyssal Keep.
