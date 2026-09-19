# Next session — give the run's boss fights margin

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/prompts/LEDGER.md`'s "Settled at S130" and "Settled at S129" sections.
- `docs/NEXT-SESSION.md`, the S130 entry only.
- `tools/measure-boss-combat.mjs`'s header, and its `MINIS` table.
- `tools/playthrough-route.mjs`'s D3 boss leg (`d3/0,3,1`, Gloomtide).

## Why this, now
S130 measured a real fault in D1's Clawcrab — it out-shoots the boss it
rehearses, and the actor loses to it on every seed — fixed it in three lines,
and could not land it. Putting it in re-rolls Gloomtide a hundred and twenty
thousand frames later, from 12 damage to 24, and the run desyncs and dies at
the Keep. Nothing about D3 changed. **The playthrough is one sample, and no
combat tuning anywhere in the game can land while that is true.** This is the
blocker under everything else, and it is now the objective.

## The task
Make the run's boss fights survive being re-rolled. Measure first, in
`tools/measure-boss-combat.mjs`: sweep Gloomtide at five seeds at 20
quarter-hearts and write down the spread. If it is wide, the fragility is in
`dBoss` and the fix is there — `tools/actor-runtime.mjs`, the verb, not the
boss. If it is narrow, the fragility is the route's approach to that one fight
and the fix is its D3 leg in `tools/playthrough-route.mjs`. Make ONE change,
re-sweep the same five seeds, then re-run the whole playthrough.

## Done means
- Gloomtide's five-seed spread in `docs/NEXT-SESSION.md`, before and after.
- `node tools/check-playthrough.mjs` green, ending in `d6/1,3,1` with six
  Essences and no deaths.
- `node tools/check-bosses.mjs`, `node tools/check-drift.mjs`,
  `node tools/test.mjs`, `node tools/replay.mjs`.
- `npm run build` with `dist/oracle-of-tides.html` committed.
- A person reads the spread and sees the fight stopped depending on one seed.

## Out of scope
- Landing the Clawcrab patch. It is three lines in the S130 entry and it waits
  until the run can absorb it. Putting it in is next session's first act, not
  this one's.
- Re-sweeping the Clawcrab. Nothing in that fight is random; five seeds gave
  byte-identical results and a sixth will too.
- Any enemy's or boss's contact `damage`. `check-hearts` asserts the ladder.
- The Abyssal Keep, and its trough in particular. A single seed's trough
  downstream of a change is not a measurement. Do not gate on it.
- Adding health anywhere. The fault is variance, not budget.
