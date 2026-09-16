# Next session — give the Anchor its first reuse

## Read first
- `docs/prompts/STATE.md` — objective #7 and its allowlist. This is the
  first session on this objective; the region-art rotation (#6) that
  came before it is fully done and closed out (S64-S89).
- `docs/ITEMS.md`'s "1. Tidewright's Anchor" section — its three verbs
  (freeze a local patch of tide, the recall-chain sweep, choosing WHERE
  as well as WHEN) and its `tide.levelAt(tx, ty)` field mechanic.
- `tools/check-anchor.mjs`'s own header comment — it proves, for every
  room declaring `anchorGate`/`anchorGauges`, that the room is
  impossible with the conch alone AND solvable with exactly one anchor
  placement. That is the room-authoring contract this session has to
  meet, not just "place a gauge and hope".
- `docs/DUNGEON-STATUS.md` — all six dungeons are marked DONE. Read the
  section for whichever dungeon you pick a room in before touching it;
  a "done" dungeon still has to stay done (`check-playthrough.mjs`,
  `check-progression.mjs`) after this session's edit.

## Why this, now
check-drift currently reads `anchor dungeons: 0 of 5, overworld screens: 0`
— the Anchor (D1's own item) is never required anywhere outside D1. Of
the four items this objective tracks (Anchor, Lens, Bellows, Reefseed —
Cleats and Dredge Line already pass), the Anchor is the natural one to
start with: it's called "the keystone" in ITEMS.md, and unlike the other
three its mechanic (a LOCAL frozen tide patch) is the easiest to picture
dropped into an existing room without redesigning the room around it.
The done-condition is `>=2 later dungeons and >=3 overworld screens` —
this session only needs to move the count off zero in both categories
with ONE solid, verified example each. That's 8+ sessions of runway
left on the Anchor alone; don't try to hit the whole done-condition now.

## The task
1. Survey D2-D6 (`src/data/dungeons-a.js`, `src/data/dungeons-b.js`) for
   one room with an existing two-sided tide obstacle (a corridor, gap or
   platform where the room's water is on one side at one tide level and
   the other at another) that a frozen local patch could plausibly turn
   into a real puzzle, the same shape D1's own `anchorGate` rooms already
   use — read a couple of D1's for the pattern first.
2. Add `anchorGate` (or `anchorGauges`, whichever fits the room's shape)
   to ONE room in ONE other dungeon. Run `node tools/check-anchor.mjs`
   until it proves both directions for that room specifically.
3. Do the same for ONE overworld screen in `src/data/overworld.js` — the
   Anchor is already a field item (`tide.levelAt`), so the same
   `anchorGate` declaration works there; check-drift's own code confirms
   it scans overworld room defs too. Pick a screen where a `sandbar` or
   `channel` tide tile already creates a two-sided crossing.
4. Full regression on both changes together: `check-anchor.mjs`,
   `check-progression.mjs` (the dungeon and its item still open in the
   right order), `check-playthrough.mjs`, `check-strands.mjs` and
   `check-overworld.mjs` if the overworld screen's terrain changed,
   `npm run build`.

## Done means
- `node tools/check-drift.mjs` reads `anchor dungeons: 1 of 5` (or more)
  and `overworld screens: 1` (or more) — up from 0 and 0.
- `node tools/check-anchor.mjs` proves both new rooms (impossible with
  conch alone, solvable with one anchor placement).
- `node tools/check-progression.mjs` and `node tools/check-playthrough.mjs`
  both still pass — the new gate doesn't break completion order.
- STATE.md gets one new session-log row.

## Out of scope
- The Lens, Bellows or Reefseed — one item, done properly, beats four
  items done thin. Pick them up in a later session.
- Hitting the objective's full done-condition (>=2 dungeons, >=3
  overworld screens) in one session — one of each, verified, is enough.
- Touching a "done" dungeon's boss room, key count, or Piece of Heart
  placement — the new gate is an ADDITION to an existing room's
  traversal, not a redesign of the dungeon's economy.
- Reopening region-art (#6) or any earlier rotation item.
