# Next session — fight the route's arena, not an empty one

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/prompts/LEDGER.md`'s "Settled at S131" section.
- `docs/NEXT-SESSION.md`, the S131 entry only.
- `tools/measure-boss-combat.mjs`'s `FIGHTS` table and its `enter:` setup.
- `tools/playthrough-route.mjs`'s D3 boss leg and the two steps above it.

## Why this, now
S131 swept Gloomtide at five seeds, found the whole spread was one wall, fixed
it in `dBoss` behind `openRetreat`, and could not land it: five wins in five in
the harness, a loss in the real run at MORE health. The harness drops the
player into an EMPTY arena at 72,80; the route arrives through a door with a
zol still alive in the room. Those are different fights, and until the harness
fights the route's one, no sweep of it can decide anything about the run.

## The task
Make `tools/measure-boss-combat.mjs` set up the fight the route actually
plays, for D3 first. Two differences, both in its `enter:` setup: the arena's
own entities are alive (the route does not clear the boss room before the
boss step), and the player arrives at the door, not the middle — `--at=` can
already say the second. Add the first, default it ON for D3, and re-sweep the
same five seeds both with and without `--open-retreat`. Then, and only if the
swept numbers say so, switch `openRetreat` on in the route's D3 boss step and
run the whole playthrough.

## Done means
- Gloomtide's five-seed spread in `docs/NEXT-SESSION.md`, in the route's own
  arena, with and without the option — next to S131's empty-arena numbers.
- `node tools/check-playthrough.mjs` green, ending in `d6/1,3,1` with six
  Essences and no deaths.
- `node tools/check-bosses.mjs`, `node tools/check-drift.mjs`,
  `node tools/test.mjs`, `node tools/replay.mjs`.
- `npm run build` with `dist/oracle-of-tides.html` committed.
- A person reads the two spreads side by side and sees whether the practice
  arena was ever telling the truth.

## Out of scope
- Landing `openRetreat` on any fight other than D3. It is measured as a loss
  on Nereth and that is settled; do not re-sweep him.
- The Clawcrab patch. Still three lines in the S130 entry, still waiting on a
  run that can absorb it, and this session does not make that true.
- Any enemy's or boss's contact `damage`. `check-hearts` asserts the ladder.
- Adding health anywhere, or moving a fairy. The fault is measurement, not
  budget.
- Re-deriving what killed the run in the marsh after D3. That was the desync
  downstream of a lost boss fight, and `dBoss`'s arena guard already stops it
  at the boss.
