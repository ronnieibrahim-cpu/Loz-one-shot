# Next session — clear the Shade Cell instead of crossing it twice

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/prompts/LEDGER.md`'s "Settled at S127" and "Settled at S126" sections.
- `docs/NEXT-SESSION.md`, the S127 entry only.
- `tools/playthrough-route.mjs`'s Colonnade leg, and the comment in it that
  says the cell is crossed and not cleared.
- `src/data/dungeons-b.js`, the Shade Cell (`1,2,5`).

## Why this, now
The run dips to FIVE quarter-hearts in Keep Crossing, one room short of the
Keep Gate's fairy, and everything after that is comfortable. The five is the
west wing: the Shade Cell is crossed twice and never cleared, which cost ten
quarter-hearts this run against six the last one, and the room's own puzzle is
sitting on a heart nobody collects. A room outlives the visit, so clearing it
once leaves it clear for the walk back.

## The task
Clear the Shade Cell on the way in and see what it costs. It is a darknut, a
wizzrobe and a keese; the Rod is already on B for the Colonnade's grate, so the
ring is available, and `['fight', N, P, { ring: true }]` is the directive.
**Issue the fight TWICE with a wait between** — a wizzrobe spends part of its
cycle `hidden`, the swordsman's foe list drops a hidden enemy, and a fight
whose last live thing blinks out returns reporting a clear room, so the puzzle
never fires and the heart never spawns. If the clear costs more than the two
crossings it replaces, say so with the numbers and leave the route alone.

## Done means
- `node tools/check-playthrough.mjs` green, ending in `d6/1,3,1` with six
  Essences, and the run's lowest point inside the Abyssal Keep ABOVE five.
- The number the clear actually cost, in `docs/NEXT-SESSION.md`. "It cost more"
  is a real and reportable answer.
- `node tools/check-drift.mjs`, `node tools/test.mjs`, `node tools/replay.mjs`,
  `node tools/check-bosses.mjs`, `node tools/check-hearts.mjs`,
  `node tools/check-charms.mjs`.
- `npm run build` with `dist/oracle-of-tides.html` committed.
- A person reads the room table and sees a bigger number in Keep Crossing.

## Out of scope
- Another fairy, heart or heart piece anywhere. The Keep has two heals.
- Weakening the darknut, the wizzrobe or any contact damage.
- Turning `breakContact` on for anything but the tideshade. It loses Anemos.
- Re-auditing the fight directives for an unarmed sword. All 86 were run at
  S127 and the verbs refuse now.
- Auditing the 460-frame fuse on every placed pickup. Written down, not this.
