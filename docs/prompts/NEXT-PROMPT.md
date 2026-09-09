# Next session — Oracle of Tides

Repo `ronnieibrahim-cpu/Loz-one-shot`. Branch from the CURRENT tip of `main` —
`git log -1 origin/main` for the real commit. One prompt = one session = one
branch. Do not open a pull request unless asked.

## Task: author the first 2x2 room in the game

`ROOM_SIZES` in `src/world/room.js` allows `1x1`, `2x1`, `1x2`, `2x2`, `3x1`.
Across the 144 dungeon rooms in the game, `2x1` is used eight times and `1x2`
once; `2x2` and `3x1` are used zero times. (Verify this count yourself before
trusting it — it was checked by counting room keys under each dungeon's
`rooms:` object in `src/data/dungeons-a.js` and `src/data/dungeons-b.js` at
the time this file was written, and drift is possible.)

Per-dungeon table, room count and which rooms are sized:

| D | Rooms | Sized rooms |
|---|---|---|
| D1 Tidewash Grotto | 24 | Clawcrab Den — 2x1 |
| D2 Coral Spire | 24 | Reefguard Hall — 2x1; Spire Ascent — 1x2 |
| D3 Bogwater Sanctum | 22 | The Kelp Locks — 2x1 |
| D4 Cliffside Cistern | 24 | The Cistern Floor — 2x1; Ironknight Gallery — 2x1 |
| D5 Drowned Wood Shrine | 24 | The Shrine Ford — 2x1 |
| D6 Abyssal Keep | 26 | Tideshade Hall — 2x1; The Crossed Shafts — 2x1 |

24+24+22+24+24+26 = 144.

## Read first, in this order

1. `CLAUDE.md` — its hard rules and verification table govern everything below.
2. `docs/prompts/LEDGER.md` — settled ground and known-unfixed items. Read
   only for the area you're touching (room sizing / dungeon geometry), not
   end to end.
3. `docs/DUNGEON-STATUS.md` — the board. Read the whole thing before
   designing anything; it names which dungeons are baselined and why that
   matters to the room you pick.
4. `src/world/room.js` lines 44-70 — the `ROOM_SIZES` contract and its
   rationale (why the set is closed, why a wide room's internal seam is not
   a boundary).
5. `tools/check-wide-rooms.mjs`'s header — what it proves about a sized room
   and the specific failure each assertion guards against.
6. `git ls-remote --heads origin` — before designing anything, check for a
   branch that has already done this. A finished dungeon was once very
   nearly built twice; `main` is a content superset of every stale branch.

## The room

Convert **The Cistern Floor** (`d4`, room key `0,4,4`, currently `size: [2, 1]`
in `src/data/dungeons-a.js`) to `size: [2, 2]`.

If that does not work out, fall back to **The Crossed Shafts** (`d6`, room
key `1,4,2` in `src/data/dungeons-b.js`), and write down in the room's own
comment and in `docs/NEXT-SESSION.md` exactly why the first choice was
abandoned.

**The selection rule, stated so a future session can reapply it without
re-deriving it:**

- Not D1 or D2 — both are baselined end to end by `check-playthrough.mjs`
  (49,516 frames, no death, no warp, no flag set from outside). A change to
  either dungeon's geometry risks re-recording that baseline for a benefit
  this session isn't asking for.
- Not D3 — it is the next dungeon `tools/playthrough-route.mjs` routing work
  should target (see `docs/prompts/QUEUE.md` item 1's sibling in dungeon
  work), and a geometry change there would collide with that.
- Prefer widening an existing sized room (already `2x1` or `1x2`) over
  authoring new geometry from a `1x1` room. A sized room already has both
  screens' worth of tile budget accounted for in its dungeon's room count
  and connectivity graph; growing it to `2x2` is a smaller, more contained
  change than turning a `1x1` room into a `2x2` one.

## Authoring constraints

- **20 columns x 16 rows.** A `2x2` room's `map` is 16 rows of 20 characters
  — one grid, not four 10x8 screens laid side by side. A row one character
  short becomes a column of void down the seam; a missing row becomes a void
  band across the bottom. Neither throws (see `check-wide-rooms.mjs`'s own
  header, point 1).
- **The seam must be crossable by some verb.** Use `everPassable` in
  `tools/lib/collision.mjs` — it carries the list of movement verbs the
  flood knows about. If you give the player a way across the seam that
  `everPassable` doesn't model, add it there in the same commit (this is the
  same class of trap CLAUDE.md's "a checker's flood only knows the movement
  verbs somebody taught it" warns about).
- **Keep exits on the anchor cell.** `dTravel` cannot path a sized room's
  non-anchor-cell exits (a known, open gap — see `docs/prompts/LEDGER.md`).
  If the layout forces an exit off the anchor cell, say so loudly in the
  room's comment and in `docs/NEXT-SESSION.md` rather than trying to fix
  `dTravel` as part of this session — that is explicitly out of scope below.
- **The space must do something.** State the reason in one sentence in the
  room's own comment: a fight with room to circle, a tide puzzle whose two
  halves can't both be on screen at once, or a descent where you see the
  bottom from the top. A `2x2` room that could have been four `1x1` rooms is
  not a `2x2` room, it's a missed cut.
- **`tide.levelAt(tx, ty, room)`, never `tide.level`.** Per CLAUDE.md's
  design rules: the tide is a field, not a global, and a call site that
  means "the water here" and reads `tide.level` is wrong the moment an
  anchor lands near it.

## Look at it

`node tools/shoot-rooms.mjs` at all three tide levels. Judge the camera, not
just the tiles — `tools/check-camera.mjs`'s own header notes that a room
bigger than the default view is one of the 9 rooms in the game where the
camera actually has to follow, and a `2x2` room is four times the default
view's area.

## Done means

All of the following green, and each one actually re-run this session, not
assumed from a prior green:

- `node tools/check-wide-rooms.mjs`
- `node tools/validate.mjs`
- `node tools/walk-dungeons.mjs`
- `node tools/check-exits.mjs`
- `node tools/solve-switches.mjs`
- `node tools/check-dungeon-strands.mjs`
- `node tools/check-camera.mjs`
- `node tools/test.mjs`
- `node tools/replay.mjs`
- `node tools/check-playthrough.mjs`
- `npm run build`, with `dist/oracle-of-tides.html` committed

Plus:

- Three screenshots (one per tide level) actually looked at, with
  conclusions written down — not just captured.
- `docs/DUNGEON-STATUS.md` ticked for whichever dungeon the room lives in.
- `docs/NEXT-SESSION.md` updated losslessly.
- `docs/HANDOFF.md` appended if anything expensive was learned.

**If a checker goes red and you can't make it green, revert the room and
write up why** — in `docs/NEXT-SESSION.md` and, if it's a generalizable
lesson, in `docs/prompts/LEDGER.md`'s "known and deliberately unfixed"
section. A reverted attempt with a clear writeup is worth more to the next
session than a room that shipped broken.

## Explicit out of scope

- Fixing `dTravel`'s non-anchor-cell gap. Note it if you hit it; don't fix it
  here.
- A second `2x2` (or `3x1`) room. One room, this session.
- Any change to `src/data/feel.js`.
- Item art, overworld art, boss balance, story.

## Habits worth carrying in

- **When a checker and your eyes disagree, screenshot it.** The established
  way to photograph an exact frame is `window.__harness.takeOver()`, set the
  state you want, `step`, then `game.draw()` and screenshot the canvas —
  deterministic, and it does not race the render loop the way pressing keys
  and waiting does.
- **When you fix something a checker missed, add the assertion that would
  have caught it, and prove it goes red against the old code.** A fix
  without a red-then-green proof is a fix nobody can trust stays fixed.
