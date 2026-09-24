# Next session — the water, from the source's frames

## Read first
- `docs/prompts/STATE.md` — objective 11 polish, area (c) fidelity, pass 1.
- `docs/prompts/QUEUE.md`'s "POLISH ROTATION", stub (c).
- `docs/ART-DIRECTION.md`, and `docs/briefs/AGENTS.md` section J.
- `tools/rip-terrain.py`'s header, the `waterS0` PICK and the S146
  current-tile PICKs (the same strip this task reads).
- `docs/NEXT-SESSION.md`, the S146 entry only.

## Why this, now
(a) and (b) had their first pass at S146. The water the game draws on
nearly every screen — `waterD0/1/2`, `openSea`, the `foam*` edges — is
hand-drawn, and rip-terrain's note that the sheets hold "no second
phase" of water is wrong: `oracle-ages-overworld.png`'s loose-tile strip
(bottom-left, from y 2852, 17 px pitch, 4 frames a row) holds the
source's animated water with every frame. S146 took the currents from it.

## The task
Replace the hand-drawn deep water with the strip's own frames.
1. Run `python3 tools/rip-terrain.py` once; confirm byte-identical.
2. Crop and name every row of the strip's first two blocks (x 0..160):
   which is deep water, which shallow, which foam/shore, which whirlpool.
3. Add the deep-water row as `waterD0..3` PICKs; bind the `deep` tiles in
   `src/data/tiles-core.js` (`waterD`, `openSea`, the riptides' still
   neighbours) to the four frames in order, keeping `pal: 'deep'`.
4. If the strip's shallow water is a better four-frame set than the
   shifted `waterS0`, do the same for `waterS`, and drop the SHIFT
   transforms. Correct the ripper's "no second phase" notes.
Target: no hand-drawn water tile left where the strip has one.

## Done means
- `node tools/check-rippers.mjs`, `node tools/check-ground.mjs`,
  `node tools/test.mjs` green.
- `node tools/replay.mjs` green, or re-recorded only for the water
  pixels, with the reason in the commit.
- `node tools/check-playthrough.mjs` green to THE END.
- `node tools/check-drift.mjs` OK; `npm run build` with `dist/` committed.
- Shots of a sea screen, a lake screen and a dungeon pool at LOW, MID
  and HIGH, before and after, sent to the human.

## Out of scope
- The Maku Tree and Great Fairy — pass 2 of (c).
- The item icons: surveyed S36-38 and settled.
- Changing what water DOES (depth, flags, which tide floods what).
- A different blue for any water (ART-DIRECTION).
- The keese's weak hit flash noted at S146 — (b) pass 2.
