# Next session — spend the detour token: reefseed overworld filter

## Read first
- `docs/prompts/STATE.md` — DETOUR TOKENS is 1 (regenerated after S96+S97,
  two consecutive `objective` sessions). This session may spend it.
- `docs/prompts/LEDGER.md`, "Known and deliberately unfixed": the S95
  entry (`check-bellows.mjs`'s identical filter bug, fixed, then a real
  structural block found underneath) and the new S96/S97-referenced entry
  right after it (Anchor's ceiling, and the outdoor-tile argument for why
  Reefseed might be different from Bellows).
- `docs/NEXT-SESSION.md` S97 (this session's own scoping) and S95 (the
  worked example to copy the shape of, including its own caution: fixing
  the filter does not guarantee the deeper structure works).

## Why this, now
`check-reefseed.mjs` computes `index: (m.dungeon && m.dungeon.index) | 0`
for every room with a `reefseedRoom`. An overworld screen has no
`m.dungeon`, so it always computes `index: 0`, which the tool's own
`early = rooms.filter(r => r.index < 5)` then rejects as "before the
Reefseed" — the identical bug shape S91 found in `check-anchor.mjs` and
S95 found and fixed in `check-bellows.mjs`. Nobody has actually tried
declaring an outdoor `reefseedRoom` yet, so this has never been hit.

Unlike Bellows' overworld half (confirmed S95 structurally impossible —
no outdoor tile has `dPit`'s exact flag combination), the Reefseed's two
load-bearing tiles both have real outdoor candidates already in the `base`
legend (`src/data/legends.js`): `drownWall` (digit `9`, solid at LOW/MID,
swimmable at HIGH — the same tide shape as `dSnag`) for the bole, and
`waterD` (`=`, fixed, always deep — the same role `dWaterD`/`W` plays
indoors) for the stake. This is a real possibility, not a hunch to chase
on faith — but it is NOT proven; treat it as a hypothesis the checker will
settle, not a plan to force through.

## The task
1. Fix the filter bug in `tools/check-reefseed.mjs`: change
   `rooms.filter(r => r.index < 5)` to also exempt the overworld, the same
   shape as `check-bellows.mjs`'s own fix (`r.mapId !== 'overworld' &&
   r.index < 5`). Confirm the existing 5 D5 rooms plus D6's `0,4,2` still
   pass unchanged (102/102) before touching anything else.
2. Try ONE outdoor placement: pick a real overworld screen (a coastal spot
   where `drownWall` and open sea already make sense visually — check
   `docs/ART-DIRECTION.md`/existing coastal rooms in `src/data/overworld.js`
   for where this reads naturally, don't force it onto a screen it doesn't
   fit), and declare a `reefseedRoom` there using `drownWall` for the bole
   position and `waterD` for the stake, mirroring D5/D6's exact fixture
   shape (bank, bole, stake, snarl in a line). Run `check-reefseed.mjs`
   after this one attempt.
3. If it passes: run the full regression suite (below) and land it — this
   would be `reefseed overworld screens: 1 of 3`.
   If it fails on something structural (not a small coordinate error):
   STOP, do not iterate indefinitely. Revert the room, keep the filter
   fix (it's correct regardless), write up exactly what blocked it in
   `docs/prompts/LEDGER.md`'s "Known and deliberately unfixed" (same
   section, same style as the Bellows/Anchor/Lens entries there), and end
   the session there. A confirmed "no" is as valid a result as a "yes" —
   S92 and S95 both ended sessions this way and both were real progress.

## Done means
- `tools/check-reefseed.mjs`'s filter bug is fixed either way (this part
  is not optional and not the risky part).
- Either `check-drift.mjs` reads `reefseed overworld screens: 1 of 3` with
  a landed room and full regression green, OR the LEDGER has a new entry
  explaining precisely why it can't work, mirroring the Bellows entry's
  level of specificity (which flag, which tile, why no substitute exists).
- `docs/prompts/STATE.md` logs this session as `detour` (it touches
  `tools/`, outside item-reuse's own file allowlist) either way.
- Full regression if a room landed: `walk-dungeons.mjs` is NOT relevant to
  an overworld room — use `check-overworld.mjs`, `check-strands.mjs`,
  `check-placement.mjs`, `check-ground.mjs`, `test.mjs`, `npm run build`.

## Out of scope
- The Anchor's and Lens's ceilings — both need a swim-model change to the
  respective tool, a bigger job than one detour token, not this session.
- Chasing the outdoor Reefseed placement past one real, honest attempt —
  if it's structurally blocked, write it up like Bellows was and stop.
- Any change to `src/data/dungeons-a.js`/`dungeons-b.js` — this session's
  token is spent on the tool and, at most, one overworld screen.
