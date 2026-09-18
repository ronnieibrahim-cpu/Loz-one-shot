# Next session — route the run through Dungeon 4

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/NEXT-SESSION.md`, the S115 entry only. It has the `soles` verb's
  contract, the two new trace columns, and the two findings below.
- `docs/DUNGEON-STATUS.md`'s D4 row and its intended-route list, for what the
  Cliffside Cistern contains and which room holds the Bellows.
- `tools/playthrough-route.mjs`'s tail — the D3 section and the `GOAL` block.
- `tools/check-bellows.mjs`'s header, for what a sill actually requires.

## Why this, now
The route reaches `d3/0,3,1` with three Essences of six, on 28 of 32
quarter-hearts and no death. Of the three fights left, Wyverna is the one
that already measures 10 wins in 10 seeds on `measure-boss-combat`, so the
boss is not the variable this time; the Bellows is. It is the first item in
the run whose verb is a BUTTON HELD rather than a button pressed, and the
actor has no directive for holding one while standing still.

## The task
Extend `tools/playthrough-route.mjs` from the Bogwater Sanctum's Essence to
the Cliffside Cistern's. Walk out of D3, cross to the Cistern's mouth, take
its three keys and the Squall Bellows, work its sills, and claim the fourth
Essence. Then raise `GOAL.essences` to `[1, 2, 3, 4]`, `GOAL.room` to the
Cistern's boss room and `GOAL.keysNeeded`/`keysObtainable` to what the run
actually spends, and re-record with `node tools/check-playthrough.mjs
--record`.

A sill wants the sea at two levels at once: the cone holds the water inside
it one level lower than the room while the button is DOWN. If that needs a
new verb in `tools/actor-runtime.mjs`, name the state it reaches the way
`tide` and `soles` do — never a count of presses.

## Done means
- `node tools/check-playthrough.mjs` green with four Essences taken, and its
  own output naming the Cistern's boss room as where the run now ends.
- `node tools/check-drift.mjs`, `node tools/test.mjs`, `node tools/replay.mjs`,
  `node tools/walk-dungeons.mjs`, `node tools/check-dungeon-strands.mjs`,
  `node tools/check-bellows.mjs`.
- `npm run build` with `dist/oracle-of-tides.html` committed.
- A person reads the trace and sees the run enter the Cistern, come out with
  the Bellows, turn a drowned wheel, and finish the fight with hearts left.

## Out of scope
- Fixing `dFight` so it can kill a patrolling crab. It is a real finding and
  it is written down; this route answers each one by hand, as S40's did, and
  a change to the verb every fight shares re-sweeps every recorded frame.
- Turning `clearAdds` on for Wyverna. Measured across all six it wins one
  fight and loses four, and D4's is one of the ten-in-ten it does not help.
- Retuning any boss's health, speed or tide grab.
- Bog Causeway's diagonal-only lane, and any other art or terrain finding the
  crossing turned up. Three lines in `docs/NEXT-SESSION.md` and keep going.
- `check-hearts`'s two failures, still not on the allowlist.
