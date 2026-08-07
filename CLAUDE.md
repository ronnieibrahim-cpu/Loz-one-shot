# Oracle of Tides

A personal, unpublished GBC-style Zelda. Two goals, in order:

1. **It must look and feel like Oracle of Seasons / Ages.** Fidelity is the
   product. Aim for the closeness of a ROM hack: a screen of this game should
   be hard to tell from a screen of the originals until you notice that the
   items, dungeons, terrain and enemies on it are ones the originals never had.
   A feature that works but feels wrong is a regression, and so is art that
   reads as someone's impression of the source rather than the source.
2. **Its design must be original.** Mechanics, items, dungeons and story are
   ours. Only the genre grammar is borrowed.

These are not in tension as often as they look. Goal 1 governs the *surface* —
sprites, tiles, timing, motion — and there the answer is almost always to take
what the source games already drew. Goal 2 governs *what the game is about*,
and there nothing is borrowed. Where they do conflict, fidelity wins; we are
not being different for its own sake.

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

**If a sheet has it, extract it.** Fidelity to the source games is the whole
product, and extraction is the only way to get it exactly — it is reproducible,
free of drift, and it cannot slowly wander into someone's own style the way
hand-drawing does. Do not redraw by hand something `assets/sheets/` already
provides. `docs/ART-DIRECTION.md` is the authority; `docs/briefs/AGENTS.md`
section J is the workflow.

**If no sheet has it, draw it to match.** Everything original to this game —
the bosses, Nereth, the Essence orb, the tide valve, the Moon Conch, the
tide-variant terrain — has to be indistinguishable in register from the
extracted art next to it on screen. A screen mixing an extracted Octorok and a
hand-drawn boss must not betray which is which.

**Extraction lands in a generated file. Never hand-edit one.** Add the frame to
the ripper's coordinate map and re-emit, so the next regeneration does not
silently throw your edit away. Every generated module records its sheet and its
ripper credit in the header. The current set:

| Generated file | Tool |
|---|---|
| `src/data/sprites-player.js` | `tools/rip-link.py` |
| `src/data/sprites-npcs.js` | `tools/rip-npcs.py` |
| `src/data/sprites-enemies.js` | `tools/rip-enemies.py` |
| `src/data/sprites-hud.js` | `tools/rip-hud.py` |
| `src/data/tiles-terrain.js` | `tools/rip-terrain.py` |

This cuts both ways: **removing** an extracted icon means removing its entry
from the ripper's coordinate map and re-emitting, not deleting lines from the
output. `pip install pillow` first, and run the ripper once before you change
anything to confirm it reproduces byte-identically.

**This binds the art, not the design.** Goal 2 is unchanged and is not
negotiable by this rule: mechanics, items, dungeons and story are ours. We
borrow how the source games *look and move*, never what they are about.

**Keep the ripper credits** in `assets/sheets/README.md` and in every generated
file's header. They name the people who pulled this art off the cartridge, and
they are also how a future session finds which sheet a tile came from.

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
- **A chest can hand over an item that does not exist, silently.** `giveItem`
  records any id; `itemName` returns the raw id and `itemIcon` falls back to
  `i_unknown`. The chest opens, the jingle plays, the save records it, and the
  player gets nothing. `tools/check-items.mjs` is what catches it.
- **A tiledef field the registrar does not name is discarded.** `registerTiles`
  copies field by field rather than spreading, so `liftLevel` sat in the data
  and `liftTile` read it and the two never met — for the whole life of the
  project. Adding a tiledef field means adding it in `src/world/tileset.js` too.
- **Animated tiles are not in the room's render cache.** Water, lava and
  torches are pushed to `animCells` and drawn separately, so sampling
  `room.render()` alone reads them as transparent. Composite `render` +
  `drawAnim` + `drawOver` the way `drawScene` does, and hash a whole 16x16 tile
  rather than one pixel — shallow and deep reef water share their colour at the
  tile's centre.
- **Rebuilding an options object field by field drops what you forget.**
  `addOverride` did exactly that and silently discarded the tag the Anchor used
  to find its own override. Everything worked except the one thing.

---

## Verification — what proves what

| Command | Proves |
|---|---|
| `node tools/validate.mjs` | Room grids are well-formed |
| `node tools/walk-dungeons.mjs` | Every dungeon is completable; no room is stranded |
| `node tools/check-overworld.mjs` | Region gates seal and open correctly |
| `node tools/check-gates.mjs` | Gates hold in-engine with a live player |
| `node tools/solve-switches.mjs` | Every switch puzzle has a solution |
| `node tools/check-motion.mjs` | Ground enemies stay on the 8px lattice; fliers and swimmers stay off it |
| `node tools/check-items.mjs` | Every item does the verb `docs/ITEMS.md` claims for it, and nothing hands out an item that no longer exists |
| `node tools/replay.mjs` | Movement and combat are frame-identical to a recorded baseline |
| `node tools/check-build.mjs` | The shipped single-file build boots and plays from a `file://` URL |
| `node tools/test.mjs` | Everything else |

Run the cheap deterministic checkers instead of reasoning about correctness.
They are faster than you are and they do not rationalise.

---

## Art rules

**These are not a licence to hand-draw.** They describe the source games' own
grammar, measured across the existing cast, and extracted art satisfies every
one of them by construction — which is the argument for extracting rather than
the argument for drawing carefully. They exist for the art no sheet can supply:
the bosses, the tide-variant terrain, the items that are ours. Reach for them
only after `assets/sheets/` has been checked and come up empty.

Terrain and scenery are covered by this too. Rocks, trees, bushes, stumps,
cliffs and ground textures are exactly the things the sheets are richest in and
exactly the things most likely to betray a hand doing an impression of the
source. Extract them.

When you do have to draw:

- Three colours plus transparency. Index 3 is the outline; 0–2 carry the form.
- A hard 1px black outline all the way round. No exceptions.
- No anti-aliasing, no gradients, no dithering on characters. Light dithering
  on terrain only.
- Fill roughly two thirds of the 16×16 cell, feet near the bottom. A cell is
  16×16 unless `expectedSize` in `src/data/sprite-manifest.js` says otherwise —
  a few extracted frames are larger because the source draws past the cell, and
  `link_hold_*` is the worked example of anchoring one.
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

**The tide is a field, not a global.** `tide.levelAt(tx, ty, room)`, or pass
`game.tide` straight to a room query and it resolves per tile. `tide.level` is
the BASE and only the HUD gauge, the music, the save and the conch's own
plumbing should read it. Inside the world, `tideAt(game, e)` is the level under
an entity's own feet — that is what an enemy, a boss or a raft means by "the
tide". A new call site that says `tide.level` and means "the water here" is
right until the first anchor lands near it and wrong forever after.

**A room's render cache is keyed on the field's stamp, not on a level.** The
stamp is monotonic and is never reset — not by `clearOverrides`, not by a new
game. Rooms outlive a new game, so a stamp that went backwards could collide
with a key a cached canvas still holds, and the room would draw the wrong water
while every collision query answered correctly.

**Every item needs three verbs** — one for movement, one for combat, one for
puzzles. An item with fewer than two is a key wearing a costume. The roster and
each item's verbs are in `docs/ITEMS.md`; `tools/check-items.mjs` proves each
verb in-engine, and asserts the registry is exactly that document's roster.

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
- Every session ends by running `npm run build` and committing
  `dist/oracle-of-tides.html`. That file is the playable game — one
  self-contained HTML document that runs from a `file://` URL with no server
  and no network, on a phone as well as a desktop. A commit that changes `src/`
  and leaves the build stale ships a game that is not the game.
