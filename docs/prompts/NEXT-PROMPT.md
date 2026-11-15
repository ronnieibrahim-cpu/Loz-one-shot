# Next session (S249) — back on the rotation: (g) dungeons, the rest of pass 1

## Read first
- CLAUDE.md, all of it (the Ages rule: Oracle of Ages' code and assets are a
  reference for ALL work).
- docs/AUDIT-S247.md, both parts (the human's whole-game audit, S247-S248).
- docs/NEXT-SESSION.md S248 and S247, docs/DUNGEON-STATUS.md (the board,
  "S203: THE SIX COMPARED"), docs/HANDOFF.md lessons (top ten).
- docs/prompts/STATE.md (the rotation) and QUEUE.md stub (g).

## Standing permission (the human, S231)
- Oracle of Ages is a full reference for ALL work: read its code and rip its
  assets exactly as Seasons'. If Seasons has no answer, check Ages before
  drawing or guessing.

## State (S248, merged to main)
- The audit is done, both parts. S248: 25 signs reworded; the cartridges'
  opening theme under the shipwreck; the marsh's enemies climb past the
  reef's; the Drowned Wood has a stake game (Drowned Ring) and a puzzle cave
  (the Root Cellar, the Hollow Den's Piece of Heart moved there); the shop
  sells ten bombs and a Hagstone from three Essences.
- The human said KEEP / LEAVE (do not re-ask): everything in S240-S247's lists;
  S248: the two puzzle signs are fine, opening theme B, the Wood "both",
  late stock. D2's channel stays `=` blocks; Wyverna over the north wall
  stays (S153).
- The human asked for the cheaper model for self-contained jobs: use Sonnet
  helpers in worktrees for art and room data, review every picture yourself,
  never let one touch tools/playthrough-route.mjs. Add nothing under
  .claude/worktrees/ to git (it is ignored now).
- No iPad play notes yet. Ask for them first; if there are some, they come
  before everything below (rotation (i) is the human's notes).

## The task
Finish rotation (g) dungeons, pass 1 (STATE.md: S203 compared the six and
did half). Left, in order:
1. ANEMOS (D2's boss) is the hardest fight in the game for its place and
   WYVERNA (D4's) the gentlest (DUNGEON-STATUS S203). Read both fights off
   the real run (`HITS=d2` / `HITS=d4` with tools/route-prefix.mjs) and in
   practice (tools/film-bosses.mjs); propose to the human a change to each
   that keeps Seasons' damage numbers (S150) — what the fight asks, not what
   it costs — and build only what they pick.
2. D5 -> D6 (the robot takes 32 quarter-hearts in D5, 112 in D6): ASK the
   human whether they have played it and whether it is a wall. Change
   nothing unasked.
3. The dunes and the marsh are the thinnest regions left (one Piece of Heart
   each; AUDIT part two). Propose side content for them to the human
   (rotation f) — heart pieces move in fours or are moved, never added.
- Pictures beside the original, sounds as files, ask before bigger changes.
- Anything that changes a room on the route moves the clock for every fight
  after it: list the route's rooms first (`ROOMS=overworld node
  tools/route-prefix.mjs 99999` prints every screen the run stands in),
  prefer rooms it never enters, and if one it enters must change, sweep the
  next boss's entry wait with route-prefix PATCH (HANDOFF S247). Keep
  beetles, bubbles and darknuts out of the robot's `fight` rooms.

## Done means
- Whole table green; check-playthrough 49/49 or more, THE END, never died;
  npm run build, dist/ committed; DUNGEON-STATUS ticked; NEXT-SESSION.md,
  STATE.md (rotation position) and this file updated; pushed; merged to main
  when done.

## Out of scope
- Enemy damage and health copied from Seasons (S150). A camera that frames
  bosses (S153). A jump button. Rewriting the main story.
