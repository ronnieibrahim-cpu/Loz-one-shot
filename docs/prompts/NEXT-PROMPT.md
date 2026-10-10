# Next session (S181) — build D3's two floors

## Read first
- CLAUDE.md, all of it.
- docs/briefs/DUNGEON-DESIGN-LANGUAGE.md (S180: how Ages builds a dungeon).
- docs/briefs/D3-BOGWATER-SANCTUM.md and its pictures in docs/briefs/d3-mock/.
- docs/NEXT-SESSION.md S180, then S179; docs/HANDOFF.md lessons.

## State
- S180 is on claude/tides-dungeon-design-language-k6kssf (merge into main
  only at the human's word). No game change in S180; the table was green
  at S179 (check-playthrough 44/44, THE END, never died).
- The human has seen the D3 mock and answered (or will answer) the brief's
  three open questions. BUILD WHAT THEY CHOSE; ask before anything bigger.

## The task
Build the Bogwater Sanctum's Undercroft and the six puzzles per the brief:
1. Rip the shaft (Moth's Lair warp hole $48-$4b) and cracked floor ($4d)
   from tileset $39; never hand-draw them.
2. Engine: the shaft (LOW drop to the same spot one floor down, a drop onto
   a pit is a pit fall upstairs; sinking at MID/HIGH goes down it), the crack
   (32 frames standing -> shaft, persisted, SND_RUMBLE), timings in feel.js
   with provenance.
3. Teach tools/lib/dungeon-flood.mjs both verbs IN THE SAME COMMIT; write
   check-shafts.mjs; room claims for P2-P6 proved both ways.
4. Renumber d3 to two floors (Bog = 1, Undercroft = 0); rooms per the plan,
   each with interior geometry; keys per the brief's table.
5. check-side whole-dungeon scenario; re-route the robot; re-shoot the guide.

## Done means
- Whole table green; check-playthrough 44/44 or more, THE END, never died.
- npm run build, dist/ committed, NEXT-SESSION.md and this file updated,
  pushed; ask before moving main.

## Out of scope
- Enemy damage and health (S150). A camera that frames bosses (S153).
- D4-D6: one a session after D3, each harder.
