# Next session (S242)

## Read first
- CLAUDE.md, all of it (the Ages rule: Oracle of Ages' code and assets are a
  reference for ALL work).
- docs/briefs/SIDE-VIEW.md — the agreed side-view design and its stages.
- docs/NEXT-SESSION.md S241 and S240; docs/HANDOFF.md lessons (top ten).

## Standing permission (the human, S231)
- Oracle of Ages is a full reference for ALL work: read its code
  (oracles-disasm's ages.s, object_code/ages/, scripts/ages/, the ROM_AGES
  side of shared files) and rip its assets exactly as Seasons'. Compare
  against both cartridges; if Seasons has no answer, check Ages before
  drawing or guessing.

## State
- S241: the Reefseed pillar's wall at MID is Ages' undersea coral sprig (the
  human's pick). The urchin keeps its shield (the human: keep). Side-view
  passages, stage 1: the engine (src/game/sideview.js, a room with
  `side: true`), the Bogwater Sanctum's side-view kit (Seasons' layout $32 in
  the Poison Moth's Lair's colours, legend `sideBog`, the waterline as tide
  tiles), Link's own side-view swim frames, and a filmed mock
  (docs/briefs/s241/side-view-mock.gif). NOTHING IS PLACED IN THE WORLD YET.
- The human said KEEP / LEAVE (do not re-ask): everything in S240's list
  (text box, place-name label, Sandpiper Cottage, S216-S239 looks), plus
  S241: the urchin's shield. (The pillar's LOW pink rock and HIGH pink water
  were left as they were when the human picked Ages' coral for MID.)

## The task
Side-view passages, stages 2 and 3 of docs/briefs/SIDE-VIEW.md:
1. Teach the dungeon flood (tools/lib/dungeon-flood.mjs) the side-view
   verbs — walk on support, fall, ladders, swim at each sea with the Cleats,
   sink in floor mode — and write `check-sideview.mjs` (each passage's claim
   of what is reached at which sea, in the real engine; nothing strands
   Link). Same commit as the first passage placed.
2. Place the first real passage: OPTIONAL, in the Bogwater Sanctum (D3), a
   stair in a top-down room down into it, its ladder out coming up in
   another room, a prize only one sea reaches. Not on the robot's route.
   Mock it first with tools/oneshot/film-side-mock.mjs and show the human
   (pictures beside the originals' side-view rooms) before building it in.
3. Ask the human before deciding: enemies in passages (ours, not ports),
   and whether the conch's pose needs a side-view look.
- Pictures beside the original, sounds as files, ask before bigger changes.
- Anything that changes a fight or a pickup on the route: compare
  route-prefix traces against a worktree of ORIGIN/main; if a boss's start
  moved by N frames, add N to the wait before it first (HANDOFF S235), else
  sweep with PATCH and run winners to THE END.

## Done means
- Whole table green (plus the new checker); check-playthrough 49/49 or
  more, THE END, never died; npm run build, dist/ committed; NEXT-SESSION.md
  and this file updated; pushed; merged to main when done.

## Out of scope
- Enemy damage and health (S150). A camera that frames bosses (S153).
- A jump button (the side-view design has none, by the human's choice).
