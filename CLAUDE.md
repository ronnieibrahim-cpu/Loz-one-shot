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

**Goal 2 is about design, not branding.** This is an openly-labelled personal
fan game: it stars Link, it is built on sprite sheets ripped from the
cartridges, and the title screen says THE LEGEND OF ZELDA — ORACLE OF TIDES
in the Oracle series' own layout, with the Moon Conch set as its marquee item
the way the source cards set the Rod of Seasons and the Rod of Ages. That is
deliberate and it is not a Goal 2 violation. **Do not "fix" it.** A session
once stripped the series line from the title screen reading Goal 2 as a rule
about names; it is a rule about *mechanics, items, dungeons and story*, and
those stay ours.

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

**A checker may never define its own collision, passability or push logic; it
calls the engine's.** `Room.solidAt`/`tileDefSolid` (src/world/room.js,
src/world/tileset.js) and `canOccupy`/`moveEntity` (src/game/entity.js) are the
only place a "can something stand here" formula may live. `tools/lib/
collision.mjs` is the one shim allowed to know which raw tile flags mean
"solid" — it composes the engine's own functions with an explicit `avoid` flag
mask or `caps` object, the same way `canOccupy` already composes `solidAt`
with an enemy's `avoidFlags`, and every other tool imports it (or, inside a
Playwright page, calls `canOccupy`/`room.solidAt` live) rather than
re-deriving the rule. `tools/test.mjs` fails if a tool combines three or more
collision-shaped flags in a bitwise mask outside that file. This is not a
style preference: 550 assertions were once green while no block in the game
could actually be pushed, because `solve-switches.mjs` and
`walk-dungeons.mjs` each modelled movement with a private copy of the rule
instead of asking the engine, and a private model does not fail when the real
rule changes under it — it just quietly starts being wrong.

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
| `src/data/sprites-races.js` | `tools/rip-races.py` |
| `src/data/sprites-enemies.js` | `tools/rip-enemies.py` |
| `src/data/sprites-hud.js` | `tools/rip-hud.py` |
| `src/data/tiles-terrain.js` | `tools/rip-terrain.py` |
| `src/data/tiles-dungeon-themes.js` | `tools/rip-dungeon-themes.py` |

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
- **A checker's flood only knows the movement verbs somebody taught it.**
  `walk-dungeons.mjs` treated a one-way ledge as a wall for the whole life of
  the project, which was harmless until D2 made a ledge the only way into
  anywhere and eight rooms read as stranded in a dungeon that walks fine. If you
  give the player a new way to move, add it to the flood in the same commit.
- **Digits 0–9 in a room grid are always tide tiles.** See
  `src/data/legends.js`. Never reuse a digit for anything else.
- **A building is not a tile, and a town screen has one corridor.** The town
  kit's buildings are 3x3 BLOCKS: one legend character drawn as the building's
  footprint, expanded by `Room.expandBlocks`, throwing if the rectangle is not
  exactly the block's size. What no throw catches is that a 10x8 screen holding
  two 3x3 buildings has exactly one row left that crosses it, so ANY object
  three tiles wide dropped into that row severs the screen — usually only at
  HIGH, where the tide has already taken the other way round. Four separate
  layouts died of this before `check-towns.mjs` existed, and its flood is
  deliberately ON FOOT: granting swimming hides the failure entirely.
- **Compositing two source tiles into one game tile is authoring, not
  extraction.** It needs an in-game screenshot across several regions before it
  is believed. `tools/preview.mjs` renders one palette and cannot show it.
- **A SOLID ENTITY IS SOLID NOW — this trap is CLOSED, and the note is kept
  because the shape of it recurs.** `canOccupy` reads `Entity.solid`
  (src/game/entity.js), so push blocks, chests, torches and signposts block the
  player, `Player.tryPush` fires on the movement hit, and blocks push. It landed
  in `0b68e6b` ("Push blocks, chests, torches and signposts are solid to the
  player") and `solve-switches.mjs` now reports all nine switch rooms solvable
  by real pushing rather than by a model of one. **D1 is finishable**: its
  Switch Room key can be answered by two blocks on two `hold` switches.
  The cost was exactly as predicted — every replay wanted re-recording — which
  is the reusable part: **a five-line change to the movement path is never a
  five-line change**, because the recorded baselines are downstream of it.
  What is still open is not the engine but the ROUTE: `tools/playthrough-route.mjs`
  drives the actor, and the actor has no directive for placing the Tidewright's
  Anchor, so `check-playthrough.mjs` stops partway through D1 at `d1/0,3,2` and
  says so in its own output. That is a harness gap, not a game blocker — but
  until it is closed, NOTHING HAS PLAYED THIS GAME TO THE END, and the rule
  below still stands: every other tool proves a part.
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
- **A counted item used to arrive with an empty pouch.** The rule that a
  Reefseed, a bomb or a bottle comes with something in it lived inside
  `Game.openChest` and nowhere else, so every other way of granting one — a
  giver, a cutscene, a harness — produced a working inventory entry attached to
  zero ammunition, and the B button denied for ever. It now lives in
  `progress.giveItem`, with the grant. If you add a counted item, put its
  capacity there.

---

## Verification — what proves what

| Command | Proves |
|---|---|
| `node tools/validate.mjs` | Room grids are well-formed |
| `node tools/walk-dungeons.mjs` | Every dungeon is completable; no room is stranded |
| `node tools/check-overworld.mjs` | Region gates seal and open correctly |
| `node tools/check-progression.mjs` | The world can be finished IN ORDER — flood the overworld from a new game holding nothing, add exactly what each dungeon grants as its door is reached, and prove every dungeon's door is reachable while its own item is still inside it. The only tool that can see a gate CYCLE; check-overworld drops one gate at a time while holding the others, and a cycle survives every such run |
| `node tools/check-gates.mjs` | Gates hold in-engine with a live player |
| `node tools/solve-switches.mjs` | Every switch puzzle has a solution |
| `node tools/check-anchor.mjs` | A room that claims to need the Tidewright's Anchor cannot be crossed with the conch alone, and can be with one anchor placement |
| `node tools/check-cleats.mjs` | Every room that claims to need the Cleats' floor mode cannot be reached on foot, cannot be reached on the surface against the current, can be reached on the seafloor, and the crossing fits in one breath |
| `node tools/check-lens.mjs` | Every room that claims to need the Brineglass Lens pins its tide, commits the player one way, cannot be answered at the level it is chosen at, and draws every branch as the same tile there |
| `node tools/check-bellows.mjs` | Every room that claims to need the Squall Bellows has a wheel no hand reaches, drowned at the sea the room is played at, freed by one level of cone and by nothing else, from a place you can only stand while it is still drowned |
| `node tools/check-reefseed.mjs` | Every room that claims to need the Reefseed grows its stakes on open water no seed can reach at LOW, opens on a snarl no blade but a stake's reaches, and cannot be sealed shut by a pillar the player grew in the wrong place |
| `node tools/check-dredge.mjs` | Every room that claims to need the Dredge Line puts its far side across a pit nothing walks, its mooring in reach of one sea and no other, and its cache in a floor that only gives up what the sea is covering — each closure clause proved twice, once at the line's reach and once at the Coilrope's |
| `node tools/check-trade.mjs` | The Coastwise Chain is one total order with no gap, fork or cycle; every object in it exists and is passed exactly once; every link can be reached with bombs and without the Rod the chain itself pays out — and, in-engine, the whole chain plays end to end and the Rod that comes out of it still retracts the Abyssal Keep's grate |
| `node tools/check-towns.mjs` | Every town screen's ways in and doors all reach each other ON FOOT at all three tide levels, every doorway warps somewhere that warps back, no building is standing on an NPC, and no townsperson is standing on the one tile that severs the screen |
| `node tools/check-motion.mjs` | Ground enemies stay on the 8px lattice; fliers and swimmers stay off it |
| `node tools/check-items.mjs` | Every item does the verb `docs/ITEMS.md` claims for it, and nothing hands out an item that no longer exists |
| `node tools/check-hearts.mjs` | Every heart piece in the world is counted and reachable by some verb, the six Heart Containers land the cap inside P9's 14-16 window with no piece left over, and every enemy's contact damage still sits on the rung of the damage ladder it was put on |
| `node tools/check-music.mjs` | Every track's order references only patterns that exist, no melodic channel holds a note that was never struck, every note is inside the Game Boy's real frequency range for its channel, and the noise channel carries only percussion |
| `node tools/replay.mjs` | Movement and combat are frame-identical to a recorded baseline |
| `node tools/check-build.mjs` | The shipped single-file build boots and plays from a `file://` URL |
| `node tools/check-playthrough.mjs` | A new game, driven in the real engine with no items granted, no warps and no flags set from outside, gets as far through the world as the world allows — and the thing currently stopping it is still the thing that was stopping it |
| `node tools/test.mjs` | Everything else |

Run the cheap deterministic checkers instead of reasoning about correctness.
They are faster than you are and they do not rationalise.

**Every one of those tools proves a PART. `check-playthrough.mjs` is the only
one that plays the game, and it is the only one that proves the game is
finishable — no session ends green without it.** The rest are models, and a
model does not fight a boss, spend a key or press a button — which is how
seven hundred green assertions once described a world that could not be
finished. On its first run the playthrough harness found that the world
cannot be finished NOW, for a different reason, and neither the room flood
nor the switch solver could see it. See "a solid entity is not solid" below.

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
- **A dungeon session starts and ends at `docs/DUNGEON-STATUS.md`.** It is the
  board: which dungeons are done, which commit each landed in, the checklist
  that defines "done", and every outstanding one as a to-do with the problem it
  has to solve written out. Read it before designing anything and tick it before
  you finish. A dungeon is done when that table says so and names a commit —
  **and one session's work is invisible to the next until it is merged**, which
  is how D2 came within a hair of being built twice. Before starting one, run
  `git ls-remote --heads origin` and look for a branch that has already done it.
- Record surprises in `docs/HANDOFF.md` under the hard-won-lessons section.
  Cost that was paid once should not be paid twice.
- Commit messages describe what changed in the game, not what changed in the
  code.
- Every session ends by running `npm run build` and committing
  `dist/oracle-of-tides.html`. That file is the playable game — one
  self-contained HTML document that runs from a `file://` URL with no server
  and no network, on a phone as well as a desktop. A commit that changes `src/`
  and leaves the build stale ships a game that is not the game.
