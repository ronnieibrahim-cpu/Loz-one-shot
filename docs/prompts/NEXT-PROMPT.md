# Next session — make the Clawcrab pay its own way

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/prompts/LEDGER.md`'s "Settled at S129" section. It names three things
  already tried and measured, so they are not tried again.
- `docs/NEXT-SESSION.md`, the S129 entry only — D1's bill, room by room.
- `src/data/bosses.js`, the `clawcrab` definition.
- `src/data/dungeons-a.js`, D1's `0,5,3` Clawcrab Den.

## Why this, now
D1's bill was read at S129 and eleven of its rooms cost nothing. One of the
three that do is now fixed. The Clawcrab Den is the next one and it is the only
fight in the dungeon that costs health and returns none: eight quarter-hearts
of twelve, against a `rich` table that is ONE roll at 28% heart and 10% fairy.
The run enters it at the cap, so nothing in the route can help — that was
measured three ways at S129 and all three are negated in the ledger. The
dungeon's longest stretch with no heal in it, 5270 frames, has this fight in
the middle.

## The task
Make the Clawcrab Den survivable on something better than a coin flip, in
`src/data/bosses.js` or `src/data/dungeons-a.js`. Measure first: extend
`tools/measure-boss-combat.mjs` to take a miniboss by name, sweep at least five
seeds at 12 quarter-hearts, and write the spread down before changing anything.
Then make ONE change and sweep the same five seeds again. `hp: 14` and the
spread's `damage: 2` projectiles are both fair game; `damage: 3` is contact and
`check-hearts` asserts the ladder, so it is not.

## Done means
- The five-seed spread written into `docs/NEXT-SESSION.md`, before and after.
- `node tools/check-playthrough.mjs` green, ending in `d6/1,3,1` with six
  Essences and no deaths.
- `node tools/check-bosses.mjs`, `node tools/check-hearts.mjs`,
  `node tools/check-drift.mjs`, `node tools/test.mjs`, `node tools/replay.mjs`,
  `node tools/walk-dungeons.mjs`.
- `npm run build` with `dist/oracle-of-tides.html` committed.
- A person reads the spread and sees the fight stopped being a coin flip.

## Out of scope
- The Abyssal Keep, and its trough in particular. A single seed's trough
  downstream of a change is not a measurement — S129 moved it from 13 to 8 on
  one room's reroll while total damage across 412 rooms moved by seven. Do not
  gate anything on it and do not go and fix it.
- Another fairy, heart or heart piece anywhere in D1, the Clawcrab Den
  included. The fight is the thing being changed, not the budget around it.
- Any enemy's contact damage, the Clawcrab's `damage: 3` included.
- Re-routing the D1 leg around the den. Negated three ways at S129; the run
  enters on 12 of 12 and there is no larger number.
- Auditing the 460-frame fuse on every placed pickup. Still written down, still
  not this.
