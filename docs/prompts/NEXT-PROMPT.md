# Next session — route the run through Dungeon 3

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/NEXT-SESSION.md`, the S114 entry only. It has the boss table and the
  `clearAdds` / `tide` verb contracts; re-deriving them costs a session.
- `docs/DUNGEON-STATUS.md`'s D3 row, for what the Bogwater Sanctum contains.
- `tools/playthrough-route.mjs`'s tail — the D2 section and the `GOAL` block.
- `tools/actor-runtime.mjs`'s `dBoss` header, for the directive's four arguments.

## Why this, now
The route ends at `d2/1,3,1` with two Essences of six, and the reason it
stopped there was that nothing could get the harness through Gloomtide. That
is closed: the fight measures 7 wins in 10 seeds at its own tide, up from 0.
S112 already walked the Sanctum and fixed the three things that made it
unfinishable. The dungeon and the boss are both ready; the route is not
written.

## The task
Extend `tools/playthrough-route.mjs` from the Coral Spire's Essence to the
Bogwater Sanctum's. Walk in, take its keys and its Cleats, reach the boss, and
claim the third Essence. The boss step is
`['boss', N, null, { clearAdds: true }]` — without the option the fight is the
0-in-10 it used to be.

Put the sea at LOW before that fight with `['tide', 0, 140, 600]`, not with a
counted `use`: MID is the current's own level and the boss is designed to be
nearly twice as fast there.

Then raise `GOAL.essences` to `[1, 2, 3]` and `GOAL.room` to the Sanctum's
boss room, and re-record the tape with `node tools/check-playthrough.mjs
--record`.

## Done means
- `node tools/check-playthrough.mjs` green with three Essences taken, and its
  own output naming the Sanctum's boss room as where the run now ends.
- `node tools/check-drift.mjs`, `node tools/test.mjs`, `node tools/replay.mjs`,
  `node tools/walk-dungeons.mjs`, `node tools/check-dungeon-strands.mjs`.
- `npm run build` with `dist/oracle-of-tides.html` committed.
- A person reads the trace and sees the run enter the Sanctum, come out with
  the Cleats, and finish the fight with hearts left.

## Out of scope
- Turning `clearAdds` on for any other fight. Measured across all six: it wins
  one and loses four, and the four are in S114's entry with their numbers.
- Retuning Gloomtide's health, speed or tide grab. S113 measured that road to
  its end and this session showed the boss was never the variable.
- Making the actor better at Anemos, Rootmaw or Nereth. They are at their
  baselines and none of them blocks this route.
- Converting the route's other counted conch presses to `tide`. Only do the
  ones this extension needs; the rest are recorded against a passing tape.
- `check-hearts`'s two failures, still not on the allowlist.
