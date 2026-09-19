# Next session — wear the Barnacle Skin from the Coral Spire

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/NEXT-SESSION.md`, the S123 entry only. It has the measurements.
- `docs/prompts/LEDGER.md`'s "Settled at S123" section.
- `tools/playthrough-route.mjs`'s `d2 0,3,4` leg — the comment there names the
  room this task is about and calls it optional.
- `src/game/scrimshaw.js`'s roster, down to the MID case.

## Why this, now
The run's deepest trough is ONE quarter-heart, inside Nereth's fight, and five
rooms of the last dungeon are unplayable because of it. `barnacleSkin` is one
free hit per room, it is a MID charm, and it is in a chest one screen off the
route in the Coral Spire behind a door the route's own switch puzzle already
opens. The harness can now both fetch it and wear it. What it costs is a
re-tune: a free hit changes knockback and invulnerability windows, so every
fight after the slot reshuffles, and the measured casualty is Gloomtide.

## The task
Get the Barnacle Skin into the Cistern Cell detour and into the MID case, and
re-tune `tools/playthrough-route.mjs` forward from there until
`check-playthrough` is green again. Expect the work to be Gloomtide's fight in
the Bogwater Sanctum and whatever follows it; the tools for that fight are
`tools/measure-boss-combat.mjs d3` and the `clearAdds` option the route already
passes it. Do not re-tune by adding health or by weakening anything — the
charm makes the run STRONGER, so a leg that now fails is a leg whose timing
moved, not one that got harder.

## Done means
- `node tools/check-playthrough.mjs` green, ending in `d6/1,3,1` with six
  Essences, and its deepest trough deeper than one quarter-heart.
- `barnacleSkin` in the audit's `slotted` line under `mid`.
- `node tools/check-drift.mjs`, `node tools/test.mjs`, `node tools/replay.mjs`,
  `node tools/check-trade.mjs`, `node tools/check-charms.mjs`,
  `node tools/check-bosses.mjs`, `node tools/check-hearts.mjs`.
- `npm run build` with `dist/oracle-of-tides.html` committed.
- A person reads the room table and sees a bigger number at the bottom of it.

## Out of scope
- Floor 1 of the Abyssal Keep's wings. They cost nine quarter-hearts and the
  run has one; come back to them once the margin is real.
- Weakening Nereth, Gloomtide, the Brinehulk or any enemy's contact damage.
- Another fairy, another heart piece, or any other way of adding health. The
  point of this task is that the run takes less damage, not that it has more.
- Making `dFight` or `dBoss` cleverer. A fight that regresses here regressed
  because its timing moved.
- Re-measuring the Colonnade round trip or the coast trade. Settled at S123.
