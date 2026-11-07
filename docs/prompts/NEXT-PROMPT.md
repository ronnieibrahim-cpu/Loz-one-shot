# Next session (S243)

## Read first
- CLAUDE.md, all of it (the Ages rule: Oracle of Ages' code and assets are a
  reference for ALL work).
- docs/briefs/SIDE-VIEW.md — the agreed side-view design and its stages.
- docs/NEXT-SESSION.md S242 and S241; docs/HANDOFF.md lessons (top ten).

## Standing permission (the human, S231)
- Oracle of Ages is a full reference for ALL work: read its code
  (oracles-disasm's ages.s, object_code/ages/, scripts/ages/, the ROM_AGES
  side of shared files) and rip its assets exactly as Seasons'. Compare
  against both cartridges; if Seasons has no answer, check Ages before
  drawing or guessing.

## State
- S242: the first side-view passage is in the game — the Sounding Way under
  the Bogwater Sanctum's Bell Cell (d3 0,4,6), its ladder out in the Current
  Garden; LOW walks the floor, MID reaches the way out, HIGH the 100 rupees.
  The dungeon flood walks passages (tools/lib/side-flood.mjs) and
  tools/check-sideview.mjs proves them. Drowned in a passage, Link goes back
  to where he came in.
- The human said KEEP / LEAVE (do not re-ask): everything in S240's and
  S241's lists, plus S242: the passage as built, its 100-rupee prize, no
  enemies in it, the conch's side-view look (faces out, as everywhere).

## The task
Side-view passages, stage 4 of docs/briefs/SIDE-VIEW.md:
1. A second passage, in another dungeon from D4 on, asking the waterline a
   DIFFERENT question from the Sounding Way's "the sea is the lift" (e.g. a
   way only LOW leaves dry, a ladder the sea must come down off). Rip its
   dungeon's side-view colours the way `svBog*` was ripped (Seasons $59 for
   the Cistern's Dancing Dragon kit; $5b/$5c the Sword & Shield Maze's).
2. Mock it first (tools/oneshot/film-side-mock.mjs) and show the human beside
   the originals before building; declare `sideRoom` and keep it off the
   robot's route; check-sideview's engine plans are per passage.
3. Ask the human whether to design an enemy of our own for passages (show a
   sketch first; never a port of the cartridges' fish or podoboos).
- Pictures beside the original, sounds as files, ask before bigger changes.
- Anything that changes a fight or a pickup on the route: compare
  route-prefix traces against a worktree of ORIGIN/main; if a boss's start
  moved by N frames, add N to the wait before it first (HANDOFF S235), else
  sweep with PATCH and run winners to THE END.

## Done means
- Whole table green (check-sideview included); check-playthrough 49/49 or
  more, THE END, never died; npm run build, dist/ committed; NEXT-SESSION.md
  and this file updated; pushed; merged to main when done.

## Out of scope
- Enemy damage and health (S150). A camera that frames bosses (S153).
- A jump button (the side-view design has none, by the human's choice).
