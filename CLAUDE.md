# Oracle of Tides

A personal, unpublished GBC-style Zelda. Two goals, in order:

1. **It must feel like Oracle of Seasons / Ages.** Feel is the product. A
   feature that works but feels wrong is a regression.
2. **Its design must be original.** Mechanics, items, dungeons and story are
   ours. Only the genre grammar is borrowed.

Where these conflict, feel wins. We are not trying to be different for its own
sake; we are trying to build something that plays like the Oracles and isn't a
retread of them.

---

## Hard rules

**Never call `Math.random()` in `src/`.** All randomness comes from
`src/core/rng.js` — one global stream seeded from the save, plus a per-room
derived stream so a room replays identically. `tools/test.mjs` greps for
violations and fails.

**Every timing and speed constant lives in `src/data/feel.js`.** No
module-level `const WALK_SPEED = …` anywhere else. Each export carries a unit
and a provenance comment: `measured`, `derived`, or `guessed`. Never silently
upgrade a `guessed` to `measured` — that word means someone actually
frame-stepped a reference and wrote down the number.

**Positions are 8.8 fixed-point.** An integer subpixel accumulator plus a
derived integer pixel position. Rendering reads the integer. Do not reintroduce
float positions; do not use `| 0` to floor a coordinate (it truncates toward
zero and misrounds across x=0, which happens on every room transition).

**Diagonal movement is not normalised.** Full speed on both axes. Diagonal is
faster than cardinal. This is deliberate and it is a signature of the source
games.

**No assets from any commercial game enter this repo.** The sprite sheets under
`assets/sheets/` are grandfathered reference for the existing extractions only.
Nothing new is extracted from them. New art is drawn.

---

## Traps that have already cost a session each

- **A solid tile can strand a room and still pass validation.** Anything
  carrying `F.SOLID` — new terrain, a misplaced ledge — can sever a room's
  connectivity while rendering fine and validating clean. Run
  `node tools/walk-dungeons.mjs` and `node tools/check-overworld.mjs` after any
  tile placement, not at the end of a batch.
- **A ledge is solid from three sides.** A ledge run dropped across a corridor
  makes rooms unreachable. Use `node tools/find-ledges.mjs` to pick placements;
  do not place by eye.
- **Digits 0–9 in a room grid are always tide tiles.** See
  `src/data/legends.js`. Never reuse a digit for anything else.
- **Compositing two source tiles into one game tile is authoring, not
  extraction.** It needs an in-game screenshot across several regions before it
  is believed. `tools/preview.mjs` renders one palette and cannot show it.
- **A test that fails intermittently is a real bug, not load flakiness.** If a
  seeded, deterministic run varies, the non-determinism is in initialisation
  order. Find it. Never add a retry.

---

## Verification — what proves what

| Command | Proves |
|---|---|
| `node tools/validate.mjs` | Room grids are well-formed |
| `node tools/walk-dungeons.mjs` | Every dungeon is completable; no room is stranded |
| `node tools/check-overworld.mjs` | Region gates seal and open correctly |
| `node tools/check-gates.mjs` | Gates hold in-engine with a live player |
| `node tools/solve-switches.mjs` | Every switch puzzle has a solution |
| `node tools/replay.mjs` | Movement and combat are frame-identical to a recorded baseline |
| `node tools/test.mjs` | Everything else |

Run the cheap deterministic checkers instead of reasoning about correctness.
They are faster than you are and they do not rationalise.

---

## Art rules

Measured across the existing cast, and binding for everything new:

- Three colours plus transparency. Index 3 is the outline; 0–2 carry the form.
- A hard 1px black outline all the way round. No exceptions.
- No anti-aliasing, no gradients, no dithering on characters. Light dithering
  on terrain only.
- Fill roughly two thirds of the 16×16 cell, feet near the bottom.
- Two-frame cycles, and the frames must differ by at least three pixels.
- `_d` faces the viewer, `_u` faces away, `_s` faces **right**. The engine
  mirrors `_s`; never draw a left-facing frame.
- Draw the silhouette first. If it isn't identifiable in pure black, interior
  shading won't save it.

New art must be indistinguishable in register from the art sitting next to it
on screen. A screen mixing an old sprite and a new one should not betray which
is which.

---

## Design rules

**The tide is a field, not a global.** `tide.levelAt(tx, ty)`. `tide.level` is
the base level and only music, HUD and save should read it.

**Every item needs three verbs** — one for movement, one for combat, one for
puzzles. An item with fewer than two is a key wearing a costume.

**No item may be a straight port of an Oracle item.** If the design reduces to
"it's the hookshot but wet," it isn't done.

**Every dungeon leans on a different consequence of the tide.** If two
dungeons' themes can be stated in the same sentence, one of them is wrong.

---

## Workflow

- `main` is trunk. Branch from it. One prompt = one session = one branch.
- Update `docs/NEXT-SESSION.md` before the session ends, losslessly. A future
  session that reads only that file must be able to continue.
- Record surprises in `docs/HANDOFF.md` under the hard-won-lessons section.
  Cost that was paid once should not be paid twice.
- Commit messages describe what changed in the game, not what changed in the
  code.
