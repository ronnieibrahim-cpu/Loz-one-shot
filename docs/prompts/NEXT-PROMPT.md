# Next session (S189) — build D6's first half (the Hold)

## Read first
- CLAUDE.md, all of it.
- docs/briefs/D6-ABYSSAL-KEEP.md (S188's design, and the human's answers
  to its six questions — written at its end once given); its pictures in
  docs/briefs/d6-mock/.
- docs/NEXT-SESSION.md S188, S181 (D3's floor move under the Bog), S185
  (falling into a hole); docs/HANDOFF.md lessons (top five).
- docs/DUNGEON-STATUS.md (D6's row).

## State
- S188 is on claude/d6-abyssal-keep-design-l2n7mz: the brief and mock only,
  nothing in src/ changed. Whole table green; check-playthrough 47/47.

## The task
(First building session, if the human said yes.)
1. Rip Seasons' ice half (tileset $41) and the grabbable ice chunk; ice
   underfoot (link.s slippery movement, feel.js derived).
2. The chunk entity; the Keep's shaft tile (1F [hole, water, water], 2F
   [hole, hole, water]); DredgeLine.dragBack hauling up through a flooded
   shaft; set down at a stair (read the cartridge first).
3. The floor move (d6Floors migration, test.mjs proves an old save moves).
4. The Hold (B1 5,2 5,3 6,3 7,2-3) and K1-K4 with check-hold.mjs; the robot
   re-routed through them.
Ask before anything the brief does not say.

## Done means
- Whole table green; check-playthrough 47/47 or more, THE END, never died;
  npm run build, dist/ committed; NEXT-SESSION.md and this file updated;
  pushed; merged to main when done.

## Out of scope
- Enemy damage and health (S150). A camera that frames bosses (S153).
