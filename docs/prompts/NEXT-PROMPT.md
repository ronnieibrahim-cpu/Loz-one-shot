# Next session — a second dungeon Reefseed pocket, D3 or D4

## Read first
- `docs/prompts/LEDGER.md`, "Known and deliberately unfixed", the S102
  addendum — the overworld half of Reefseed is now closed (3/3 screens);
  the open half is dungeon reuse (1/5: only D6's Bole Cistern).
- `src/data/dungeons-b.js`, D6's Bole Cistern room (search `reefseedRoom`)
  — the working example: a self-contained pocket off the Dredge Vault,
  nothing past it needed for anything else, same fixture shape as the
  overworld groves.
- `docs/DUNGEON-STATUS.md`, the D3 and D4 sections — both DONE; read
  before adding a room so the addition doesn't contradict what "done"
  already committed to for either.

## Why this, now
`node tools/check-drift.mjs` reads `reefseed home D5 dungeons: 1 of 5
overworld screens: 3`. The overworld sub-goal (>=3 screens) is met as of
S102. The dungeon sub-goal (>=2 OTHER dungeons) is not: D6's Bole Cistern
is the only one. Rotation item 7 (item-reuse) isn't done until Reefseed
(and Anchor, Lens, Bellows) clear BOTH halves — this session's job is
Reefseed's other half, the same kind of task D6 already proved works.

## The task
Add ONE new room to D3 (Bogwater Sanctum) OR D4 (Cliffside Cistern) —
pick whichever has a genuine unused pocket off an existing room, the same
way D6's Bole Cistern sits off the Dredge Vault — that needs the Reefseed
to reach something inside it (a Piece of Heart, rupees, a find). Copy the
Bole Cistern's shape: a stake thrown at HIGH onto a drowned bole/snag,
the pillar standing at LOW only, a snarl only that pillar's blade
reaches. **Nothing past this room may be required for anything else** —
same as the Bole Cistern and the overworld groves, so no ordering
question about whether the player has reefseed yet can even arise.
Update `docs/DUNGEON-STATUS.md`'s D3 or D4 section (whichever you use)
to note the addition, the same way S## additions elsewhere are noted
inline rather than by rewriting the "DONE" verdict.

## Done means
- `node tools/check-reefseed.mjs` passes with the new dungeon room
  declared, and `node tools/check-drift.mjs` reads `reefseed ... dungeons:
  2 of 5`.
- `node tools/shoot-rooms.mjs` on the new room at LOW and HIGH (dungeon
  spec is `d3,0,rx,ry` or `d4,0,rx,ry` — see the tool's own `--help`
  text), and the shot actually looked at.
- `node tools/walk-dungeons.mjs`, `node tools/check-dungeon-strands.mjs`,
  `node tools/check-placement.mjs`, `node tools/check-ground.mjs`,
  `node tools/check-progression.mjs`, `node tools/check-playthrough.mjs`,
  `node tools/test.mjs`, `npm run build` with `dist/` committed.
- If a run fails, fix it and re-run — do not hand a red assertion to the
  next session unexplained. If BOTH D3 and D4 turn out to have no clean
  unused pocket, say so plainly and leave the room count at 1 rather than
  forcing a placement that damages either dungeon's "done" state.

## Out of scope
- Anchor's, Lens's and Bellows' own dungeon-reuse and overworld-screen
  ceilings — each needs its own investigation, not a copy-paste of this
  session's shape. Untouched here.
- A second Reefseed room in D6 (already has one; the metric counts
  distinct dungeons, not room count) or a fourth overworld grove (that
  half is already met at 3/3).
- Redesigning any part of D3 or D4 that isn't the one new pocket — both
  are DONE dungeons; this adds to them, it doesn't revise them.
- Touching `check-reefseed.mjs` or any other tool — the mechanism already
  proved itself generic across D5 and D6; a third placement should not
  need a checker change.
