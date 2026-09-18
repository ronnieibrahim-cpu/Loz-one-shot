# Next session — put a heal on the chain's road

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/NEXT-SESSION.md`, the S118 entry only. It has the measured cost of the
  tour, the three answers that were tried and are worse, and the three seams
  the route names by hand.
- `docs/prompts/LEDGER.md`'s "Settled at S118" section.
- `tools/playthrough-route.mjs`'s `GOAL` block, for what the run now holds and
  where it stops.
- `tools/check-hearts.mjs`'s own output, for where the world's uncollected
  heart pieces are. It has two standing failures; they are not yours to fix.

## Why this, now
The run reaches the Abyssal Keep's arch on six of forty-four quarter-hearts.
Every item is in hand, the Resonance Rod included, and the Keep's gate is
open — but Nereth takes four quarter-hearts a hit and the Keep is two floors
deep. The route cannot answer this: fighting the tour is worse than walking
it, the short way out of the Shrine is worse than the long one, and the one
fairy in the world is six screens off the road and costs more to reach than
it gives. The world has no heal on a fifty-screen walk, and that is a design
gap rather than a harness gap. Until it is closed the sixth dungeon cannot be
routed at all, so it comes first.

## The task
Put a healing point on the Coastwise Chain's own road, in
`src/data/overworld.js`, and prove the run arrives at `d6/0,3,7` with at least
half its hearts. Pick ONE of these and do it properly rather than sprinkling
hearts about:

- a fairy on a screen the tour already crosses twice, placed where a player
  walking the chain would find it and not where a player crossing to D4 would;
- or a second shop, or a heal at the existing one that is not once-per-save,
  paid for in rupees the tour itself drops;
- or a Piece of Heart the chain's own route passes, completing the fourth
  Heart Container — `addHeartContainer` refills to the new maximum, and the
  cap is fourteen hearts against the run's eleven.

Then extend `tools/playthrough-route.mjs` to collect it, and raise the
health assertion in `tools/check-playthrough.mjs` so the arrival number is
asserted rather than merely printed.

## Done means
- `node tools/check-playthrough.mjs` green, ending in `d6/0,3,7`, arriving on
  22 of 44 quarter-hearts or better, with the new assertion naming that floor.
- `node tools/check-drift.mjs`, `node tools/test.mjs`, `node tools/replay.mjs`,
  `node tools/check-overworld.mjs`, `node tools/check-progression.mjs`,
  `node tools/check-strands.mjs`, `node tools/check-placement.mjs`,
  `node tools/check-ground.mjs`, `node tools/check-towns.mjs`,
  `node tools/check-hearts.mjs` no worse than its two standing failures.
- `npm run build` with `dist/oracle-of-tides.html` committed.
- A person reads the health table and sees the chain's long walk stop being a
  slow bleed with nothing at the end of it.

## Out of scope
- The Abyssal Keep's interior, its two floors, its Dredge Line and Nereth.
  That is the session after this one and it needs the hearts this one buys.
- Retuning any enemy's contact damage, or the damage ladder. The ladder is
  `check-hearts`'s and it is green on that half.
- Teaching `dFight` to beat a shielded enemy, or to fight within a radius.
  Five enemies and five sessions, still written down, still re-sweeps every
  recorded frame in the repo.
- Making `travel` clever about the three named seams. They are named by hand
  in the route and that is where they stay.
- `check-hearts`'s two failures — 23 pieces, and D5 holding one not two.
  Still not on the allowlist.
