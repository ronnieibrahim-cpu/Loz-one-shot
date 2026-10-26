# Next session (S212) — the Keep's slate slots

## Read first
- CLAUDE.md, all of it.
- docs/briefs/PUZZLE-PASS.md (step 9), docs/NEXT-SESSION.md S211 and S209
  (the Hold), docs/HANDOFF.md lessons (top ten); docs/DUNGEON-STATUS.md "S211".

## State
- S204-S210: every planned kind built. S211: signs second pass (13 hint
  now); the Coral Spire's Eye Hall (eye statues that turn with the tide,
  check-eyes) and the Grotto's held bridge (check-bridges) built.
- Slates approved and mocked, NOT built: docs/briefs/puzzle-pass/
  s211-slates.png, spec s211-slates-mock.json, tools/check-slates.mjs (model).
- Whole table green; check-playthrough 49/49, THE END, never died.

## The task
- Build the slates (the human's choices, S211): a slot room before the King
  in the Abyssal Keep, slots at three heights (dry LOW, wading MID, swimming
  HIGH; the mock's N high, E low, S mid, W high), four slates lying in the
  Hold and brought up with the Dredge Line, all four open the stair on.
  Engine: slate as a counted item, lean SLATE_PUSH_FRAMES (Ages slateSlot.s
  var3f $0a, derived), wrong sea says why. Finish check-slates' engine
  clauses first. Re-route the robot; sweep Nereth's and the Keep bosses'
  waits. Show the human the room in the game beside Ages' $58a.

## Done means
- Whole table green; check-playthrough 49/49 or more, THE END, never died;
  npm run build, dist/ committed; NEXT-SESSION.md and this file updated;
  pushed; merged to main when done.

## Out of scope
- Enemy damage and health (S150). A camera that frames bosses (S153).
