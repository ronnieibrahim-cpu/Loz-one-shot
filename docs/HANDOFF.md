# Handoff — Oracle of Tides

State of the project as of this handoff, and what a fresh session needs to know.

## Where things stand

Branch: **`claude/oracle-tides-polish-aqche8`** — the single canonical branch.
It continues `claude/oracle-tides-polish-grjnhj`, which is now behind it.
Everything is committed and pushed.

Earlier branches (`claude/zelda-style-game-piqt8v`,
`claude/zelda-boss-behavior-jgbfwo`, `claude/oracle-tides-boss-music-4c24tm`)
are the line this was built on and are all behind it, not parallel work.
`main` is an empty README.

**The engine is complete and verified.** `node tools/test.mjs` boots the game in
headless Chromium and passes 35 assertions covering boot, movement, sword
combat, contact damage, the tide, room transitions, cave warps, the pause menu,
save/load round-tripping, death and respawn. Keep it green.

**`node tools/validate.mjs` is clean** — no problems, only warnings for the
sprite packs still to be drawn.

| Area | State |
|---|---|
| Engine, renderer, audio, save, menus, cutscene runner | Done |
| Tide system and tide-variant tiles | Done |
| Player, combat, items, enemy framework, boss framework | Done |
| Link sprites | Done — extracted from the Oracle of Ages sheet |
| NPC sprites (9 of 11) | Done — extracted from the Oracle of Seasons sheet |
| Terrain tiles, HUD | Done — hand-drawn |
| **Enemy sprites (56)** | **Done** — extracted from the Oracle of Seasons enemy sheet |
| **Enemy roster (22 types)** | **Done** — `src/data/enemies.js` |
| **Overworld** | **Done — all 120 screens** |
| **Dungeons 1-8** | **Done — 179 rooms, all solvable** |
| **Effects + item icons (83)** | **Done** — hand-drawn |
| **Pickups, objects, projectiles (37)** | **Done** — hand-drawn |
| **Boss/miniboss behaviour (16)** | **Done** — `src/data/bosses.js` |
| **Story and dialogue** | **Done** — 20 ids, 15 cutscenes |
| **Boss/miniboss art (49)** | **Done** — redrawn by hand |
| **Music (22 tracks)** | **Done** — 14 looping + 8 jingles, two dungeon themes wired |
| **Dungeon room puzzles** | **Done** — every room now has something in it |
| **Small Key economy** | **Done** — keys equal locks in all eight dungeons |
| **Marsh gate on Bombs** | **Done** — `cliffCracked`, both entrances |
| **Terrain art (9 tiles)** | **Done** — extracted, `tools/rip-terrain.py` |
| **One-way ledges** | **Done** — 88 runs, all four cardinals, 36 tile variants |
| **Region gates (5 of 9)** | **Done** — Bombs, Boomerang, Gloves, Feather, Bracelet |
| **Terrain art (10 tiles)** | **Done** — 9 ground + `flowers`, `tools/rip-terrain.py` |
| **itemGet / secret / heartPiece** | **Done** — wired to their moments |
| **Single-file build** | **Done** — `npm run build` → `dist/oracle-of-tides.html`, runs from `file://` |

### Five region gates are now machine-checkable

`check-overworld.mjs` proves five of the nine GAME-PLAN gates in both
directions, and `check-gates.mjs` proves four of them in-engine with a live
player. Roc's Feather (`chasm`, Coral Reef) and the Power Bracelet (`boulder`,
Cliffs of Kell) were added this session.

**Zora's Flippers and the Hookshot were built and reverted.** Both are recorded
under "The two gates that cannot be tiles" below; neither is a placement
problem and neither should be retried without reading that section first.

### Region gates and ledges are done

All three tile-expressible region gates match GAME-PLAN.md, and one-way ledges
face all four cardinals with 88 runs placed. Two engine bugs surfaced doing it —
a projectile's rect never touching the solid tile it bounced off, and a dangling
`player.boomerang` that disabled the item for the rest of a run — both recorded
under "Hard-won lessons" and both now covered by `tools/check-gates.mjs`.

### The game is now completable end to end

The blocker is gone: all sixteen bosses and minibosses are implemented and
verified beatable. `node tools/test.mjs` reports **0 unauthored art names**,
down from 17. What is left is polish — boss art and music — not structure.

## The two documents that matter

- **`docs/GAME-PLAN.md`** — authoritative. Region layout on the 12x10 overworld
  grid, all eight dungeons with their map ids, items, bosses, minibosses,
  overworld entrance screens and tide themes, the item progression table, and
  the damage/HP numbers. Content that disagrees with this is wrong.
- **`docs/ART-DIRECTION.md`** — binding for anything visual. Declares
  `assets/sheets/` the canonical art reference, gives the style rules measured
  from those sheets, and sets the rule: extract when a sheet has it, draw to
  match when it does not. New assets are held to the same standard as extracted
  ones.
- **`docs/briefs/AGENTS.md`** — a complete authoring spec per work area,
  sections A through J. Each section names the one file to edit and how to
  verify. Section J documents the sprite-sheet extraction workflow.
- **`docs/NEXT-SESSION.md`** — a ready-to-paste prompt for a fresh session,
  naming the branch, the two remaining jobs and how to prove them. Start there
  if you are picking this up cold, and keep it current as work lands.

## Tooling

```sh
npm run dev                          # play it at localhost:8080
node tools/validate.mjs              # structural checks, no browser
node tools/validate.mjs --strict     # also fail on unauthored sprites
node tools/validate.mjs --pack=enemies   # scope the sprite-coverage check
node tools/test.mjs --shots          # 35 assertions + screenshots
node tools/preview.mjs enemies --scale=6  # contact sheet of a sprite pack
node tools/scan-sprites.mjs --skip-bosses # rows split or floating off the body
python3 tools/rip-enemies.py         # regenerate src/data/sprites-enemies.js
python3 tools/rip-terrain.py         # regenerate src/data/tiles-terrain.js
node tools/preview.mjs --tiles --scale=2  # contact sheet of every tile
node tools/walk-dungeons.mjs         # every dungeon room + every ledge
node tools/check-overworld.mjs       # seams, border, tile-by-tile flood
node tools/check-overworld.mjs --bombs   # ...and the Marsh gate
node tools/solve-switches.mjs        # one push per block, every switch room
node tools/check-gates.mjs           # the two item gates, in-engine
node tools/find-ledges.mjs           # where a ledge can go without walling a room
node tools/check-overworld.mjs --items=bombs,boomerang,magnet
```

`test.mjs` and `preview.mjs` take `--shot-dir=` and pick a random port, so
several can run at once.

**`test.mjs` is timing-flaky under CPU load, and always has been.** It counts
frames with `requestAnimationFrame` and drives the game with real keyboard
events, so when the machine is busy — immediately after a long harness run, or
two `test.mjs` runs back to back with no gap — rAF throttles, taps land in the
wrong game state, and you get a spurious 5-7 failures clustered in "contact
damage lands", "menu opens" and the save tab. It is not a regression and it is
not your change: give the box a few seconds and re-run, and confirm a red run
by reproducing it twice rather than once. This was verified against the
untouched baseline before any of this session's work.

### Environment setup a fresh container needs

1. `npm install`.
2. Playwright ships a browser revision the pre-installed Chromium does not
   match, so `tools/test.mjs` fails with "Executable doesn't exist". Point the
   expected path at the installed shell rather than downloading a browser:
   ```sh
   cd /opt/pw-browsers
   V=$(ls -d chromium_headless_shell-* | grep -v 1234 | head -1)
   mkdir -p chromium_headless_shell-1234/chrome-headless-shell-linux64
   for f in $V/chrome-linux/*; do
     ln -sf "/opt/pw-browsers/$f" "chromium_headless_shell-1234/chrome-headless-shell-linux64/$(basename $f)"
   done
   ln -sf /opt/pw-browsers/$V/chrome-linux/headless_shell \
     chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell
   touch chromium_headless_shell-1234/{INSTALLATION_COMPLETE,DEPENDENCIES_VALIDATED}
   ```
   (Check the revision `playwright` actually asks for in the error message; it
   was 1234 the first three times.) A headful `chromium.launch()` — which
   `check-build.mjs` uses, because a canvas assertion wants a real browser —
   needs the same shim for the full browser as well:
   ```sh
   mkdir -p /opt/pw-browsers/chromium-1234
   ln -sfn /opt/pw-browsers/chromium-1194/chrome-linux /opt/pw-browsers/chromium-1234/chrome-linux
   touch /opt/pw-browsers/chromium-1234/{INSTALLATION_COMPLETE,DEPENDENCIES_VALIDATED}
   ```
   `check-build.mjs` also falls back to `$CHROMIUM_PATH` or
   `/opt/pw-browsers/chromium` on its own if the launch throws, so it runs on an
   unshimmed container; the other harnesses do not, and still need the shim.
3. `pip install pillow` if you are going to run any of the `rip-*.py` tools.
   `rip-terrain.py` needs only Pillow; the scratch script that *finds* its
   source rectangles used numpy, but it is not committed and the tool does not
   import it.

## Hard-won lessons — do not rediscover these

**Sprite-sheet extraction** (`tools/ripkit.py`; worked examples in
`tools/rip-link.py`, `tools/rip-npcs.py` and `tools/rip-enemies.py`):

1. Sheets **do not use a uniform row pitch**. Assuming 16px steps cuts every
   sprite in half. `find_cells` measures each sprite's own bounding box.
2. `find_cells` assumes banded art. The **enemy sheet defeats it** — it is a
   mosaic of independently-placed white plates interleaved with label text.
   `rip-enemies.py` segments by flood-filling islands of non-background pixels
   instead and keeps the ones too big to be a glyph.
3. Sprites sit on **white plates**, and `background()` only reports the green
   around them, so the plate quantises as the sprite's lightest colour and every
   creature lands in a white box. Erase only white *reachable from the green* —
   white enclosed by a creature's own outline is artwork.
4. **Find the boxes before erasing the plates.** The plates are what make each
   frame one connected island; stripping first splits sprites apart and
   renumbers every index the frame map refers to.
5. `quantise` pads a short palette by repeating its last colour, which leaves a
   three-colour sprite writing its **outline at index 2**. That renders right in
   the sprite's own palette and wrong in every other, because the game's enemy
   palettes put a mid tone at 2 and the near-black at 3 — so the hard 1px
   outline washes out to grey the moment the roster asks for `enemyg`.
   `normalise_ramp` in `rip-enemies.py` re-slots the ramp.
6. Full-colour sprites need **per-sprite palettes bound to the art** via the
   `{ art, pal }` form. Registering palettes without binding them makes
   everything render in the wrong colours.
7. Packed sheets **leak neighbouring pixels** into a cell; `_trim_slivers`
   drops edge columns disconnected from the sprite body.
8. **`_trim_slivers` only caught one-pixel leaks** until it was rewritten. It
   blanked an edge line only when the very next line was empty, so a leak two
   or three columns wide with a gap between it and the sprite survived and
   rendered as a bar floating beside it. It now groups each axis into runs and
   drops detached edge runs small enough to be a leak.
9. **Quantisation punches pinholes.** A pixel inside the body that happens to
   match the sheet background goes transparent and you get a see-through slot
   across the sprite. `_fill_pinholes` in `ripkit.py` fills any transparent
   pixel with all four orthogonal neighbours drawn.
10. **A single-pass hole filler does not converge.** `seal_holes` in
   `rip-enemies.py` skipped a two-pixel gap on its horizontal test, filled one
   of the two vertically, and never revisited the one-pixel hole left behind
   the cursor. Both fillers now iterate to a fixed point.
11. **Both extractors reproduce byte-identically**, which is what makes it safe
   to change `ripkit.py` and re-run: run them once before touching anything,
   confirm an empty `git diff`, then change and read the diff.
12. Always `preview.mjs` the pack and **look at the PNG**. Dimensional validity
   says nothing about whether a sprite reads as the creature it names. Note
   that `preview.mjs` screenshots the canvas clipped to the 1400px viewport, so
   at `--scale=6` the rightmost column is cut off — use `--scale=2` to see a
   whole pack.

**Terrain extraction** (`tools/rip-terrain.py`) — the two terrain sheets are
assembled **maps**, not tile palettes, so none of the cell-finding in
`ripkit.py` applies. Each map block sits at its own origin and there is no
global 16px grid: a search over all 256 offsets scores them nearly equally,
because the base ground tile is mostly flat and matches itself at any phase.

What does work: a ground tile is the 16x16 window that repeats at **+16 in x
and +16 in y**. A window that passes is correctly phased and tiles seamlessly
by construction, which is exactly what ART-DIRECTION demands of terrain. Two
things to know if you rebuild that scan:

1. **Collapse the phase shifts.** A seamless tile stays seamless when rolled,
   so every hit appears at all 256 offsets and a frequency ranking is nothing
   but shifted copies of one tile. Key each hit on the smallest of its 256
   cyclic shifts. Do it *after* deduplicating exact bytes — canonicalising
   half a million raw hits does not finish.
2. **It only finds ground.** `cliff`, `tree`, `bush` and the rest are
   structured and directional; no single window supplies a top, a face and
   corners, and the scan returns nothing for a tree grove. Those have to be
   picked by eye from a region dump.

Two judgement calls in the tool that are deliberate:

- **The extracted art keeps the game's palettes**, and only the pixels change.
  Binding the source colours instead would have shifted every region's scheme
  under the extracted Seasons enemies, and broken the palette-swap variants
  (`grassDark`, `saltFlat`, `iceFloor`, `rockFloorRust`) that are how this game
  gives each region a look without redrawing every tile. `TERRAIN_SRC_PALETTES`
  records the source colours for reference.
- **…but a palette can need narrowing.** The source dungeon flagstone is three
  near-identical blues. Replayed through `brick`'s full light-to-dark spread it
  became loud blotches across all 179 rooms, and it took an in-game screenshot
  to see — `preview.mjs --tiles` renders every tile in one palette. `brickf`
  and `stonef` in `palettes.js` are narrow ramps added for exactly this.

A first pick can also be simply wrong for its job: the original `rockFloor`
source was brick courses, which reads as a **wall** in a top-down game. It was
swapped for cobbles after looking at a screenshot, not after validating.

**Boss and miniboss behaviour** (`src/data/bosses.js`) — four traps, all paid
for, all of which produce a boss that *validates* and is *unwinnable*:

1. **A miniboss must clear `isBoss` in its `init`.** `game.onEnemyDefeated`
   keys `progress.beaten` off the **map id**, not the entity, so a miniboss
   counted as a boss marks its whole dungeon beaten. That deletes the real boss
   when you walk into its room (`spawnRoomEntities` removes it) *and* spawns the
   dungeon's essence in the miniboss room. It also blocks the miniboss room's
   own `puzzle: { enemies: true }` reward, because `onEnemyDefeated` returns
   early for bosses and never sets `room.cleared`.
2. **`submerge()` is sticky.** It parks the entity `hidden`, `harmless` and on
   `invuln: 9999`. A later phase that does not call `submerge` inherits all
   three and you get an invisible, invulnerable, unkillable boss standing in the
   room. Every boss that submerges in *any* phase calls `surface(e)` on *every*
   phase change.
3. **`e.stun` makes `Boss.update` return before the AI runs**, so an attack
   cannot be executed inline after setting a wind-up. The `windUp`/`runPending`
   pair in `bosses.js` parks the attack on the entity and fires it on the next
   live frame. Every heavy attack goes through it, which is also what guarantees
   every attack has a tell.
4. **A tide gate must never be a boss's only vulnerability.** Nereth pins the
   tide to MID in phase 1 — which is the level the player walks in at — so an
   unconditional "sealed while the tide sits at my level" made him invulnerable
   from the first frame with no way to learn otherwise. Every boss now has a
   timed window that does not depend on the conch; the tide widens it.

Boss rooms are authored `noTide: true`, which only sets `tide.locked` and only
stops the *conch* — `tide.setLevel` still works. Each boss calls `unlockTide` on
its intro to hand tide control back for the fight, and the late bosses force it
back to the level that suits them.

**Art** (`sprites-link.js`, `sprites-world.js`):

- **`validate.mjs` cannot see a broken sprite, only a wrong-sized one.** A row
  split by a see-through slot, or shifted out past the rest of the body so it
  renders as a detached line, passes validation and looks wrong on screen.
  `tools/scan-sprites.mjs` is the check for that class; run it after any art
  work. It scans the **resolved** registry, which matters because 37 of the 40
  names in `LINK_ART` are shadowed by `PLAYER_ART` — scan the source packs and
  you get a list of defects in art nobody ever sees.

- **Transparency, not outline, is what separates two shapes.** Five icons
  (conch, cape, gloves, flippers, magnet) came out as solid blobs because the
  gap between prongs/fingers/wings was drawn with `3` instead of `.`. At 16x16
  an outline pixel is just another coloured pixel.
- `preview.mjs` renders a whole pack in **one** palette, so it shows silhouette
  and shape but not in-game colour. That is the right tool for "does it read as
  the thing it names"; use `test.mjs --shots` for colour.
- The engine's `slashD` effect (`src/game/effects.js`) wants `fx_slash_d0` and
  `fx_slash_d1`, and `player.js` spawns it on **every sword swing** — but
  neither name is in `sprite-manifest.js`, so nothing flagged them and the
  most-seen effect in the game drew as a placeholder box for the whole project.
  If you add an effect to the engine, add its frames to the manifest.

**A ledge is solid from three sides, so it partitions the room it is in.**
Placing one is the same class of hazard as a mis-stamped doorway. The 38 runs
placed were chosen by a script that, for every candidate run, re-floods the room
at all three tide levels and rejects the run unless every tile reachable before
is still reachable after — walking only, no hop. Three further rules, each of
which a hand placement would get wrong:

- **The tile below the run must be dry at all three tide levels.** A ledge that
  drops you into water that is only shallow at LOW is a trap you cannot see in
  the grid.
- **Never in a switch, door, transition or boss room.** A solid lip in a switch
  room is a new way to make a one-tile push unreachable.
- **Ledges now face all four cardinals.** `_` south, `"` north, `>` east, `<`
  west, in every legend that declares `_`. Two things follow that a harness or
  a placement script gets wrong first try: **`>` and `<` runs are COLUMNS, not
  rows** — scanning every direction as if it were a row silently reports zero
  east/west ledges while they sit in the data — and a lip is **solid from three
  sides**, so a run dropped across a corridor makes rooms unreachable while
  still validating and still rendering. Use `tools/find-ledges.mjs`, which
  refuses any candidate without two plain tiles continuing past each end.

**A SOLID tile is never hit by a projectile's own rect.** The boomerang
ricochets off a solid tile *before* its rect ever overlaps it, so
`checkTileAction(this.rect(), ...)` finds nothing and a solid gate tile reads as
ordinary rock. `Boomerang.strikeTile` probes the tile just past the leading edge
instead, the way the hookshot probes ahead for a latch. Any future
"projectile opens a solid tile" mechanic needs the same probe — the rect test
that works fine for bushes silently does nothing here.

**An entity dropped from `game.entities` must be marked `remove` first.** The
player holds direct references to some of its own projectiles — `player.boomerang`
is the one that bit — and the guard in the item's `use` reads `.remove` to decide
whether the item is still in flight. `spawnRoomEntities` filtered the list
without setting the flag, so throwing the boomerang and then changing rooms left
a dangling reference that looked live forever: **you could never throw the
boomerang again for the rest of the run.** Nothing validated it, nothing errored,
the item just quietly stopped working. It now marks the dropped entities first,
which covers the whole class rather than the one case.

**A gate tile must sit INSIDE a screen, not on its boundary row.** The seam
check asserts both sides of a screen boundary agree about passability, and a
solid gate on the boundary makes them disagree. This is why the Marsh's cracked
cliff is one tile in, and the first placement of the salt vanes — directly on
the seam the scan reported — failed the seam check immediately.

**A push block moves exactly one tile, ever.** `PushBlock` takes `once: true`
by default and sets `moved` the moment its single slide lands, so a block placed
two tiles from the switch it is meant to cover can never reach it. Every switch
room in the game was authored that way, and each rewards a Small Key, so seven
dungeons silently had a key that could not be earned — and neither `validate.mjs`
nor the dungeon walker can see it, because both count keys statically from the
data. Blocks now sit orthogonally **adjacent** to their switch with plain floor
behind them to push from. If you add a switch puzzle, either do the same or pass
`{ once: false }`.

**An active dialogue freezes every entity while `mode` is still `'play'`.**
This is called out under the boss harness below, but it bites any harness that
visits several rooms in a row: a `puzzle.reward.say` from one room leaves a text
box open, and in the *next* room nothing updates — switches never press, blocks
never slide, and the room looks broken. Clear `game.dialogue.active` between
rooms before concluding anything.

**Data contracts drift from engine contracts, and nothing checks it.** Both
`giver` entities in `overworld.js` passed `giveFlag`, `waitingText`, `afterText`
and a `ready` function; `Giver` in `src/game/objects.js` reads `flag`,
`waiting`, `after` and `needEssences`. Every option was silently dropped, so the
Maku Tree and the digger handed over the Seed Satchel and the Shovel on first
contact with no Essence requirement and repeated it on every later talk. The
validator cannot see this. When wiring a data entity, read the class.

**Map authoring:**

- Rooms whose edges must line up are **not** worth hand-checking. Both the
  overworld and the dungeons were authored as 6x8 *interiors* with the border
  ring stamped on from a single shared seam table, which makes "walkable east
  edge implies walkable west edge on the neighbour" true by construction. The
  generators were throwaway scaffolding; the emitted files are the artifact and
  should be edited directly from here on.
- **A doorway needs floor behind it.** An interior authored with its own wall
  run will happily put a wall directly behind a stamped doorway, and the door
  then opens onto stone. Twelve of d2's twenty rooms were unreachable for
  exactly this reason. Carve one tile inward at every doorway.
- **…but that carve must not overwrite a door tile**, or a lock wall sitting on
  the first row behind a doorway is silently punched open.
- **Locked doors go inside rooms, never on a seam.** The engine places an
  arriving player just past the room edge, so a locked tile on a seam drops them
  inside solid stone from the far side. An interior wall with an `L` in it
  splits a room cleanly.
- Room grids are **exactly 8 rows of exactly 10 characters**, and digits 0-9 are
  always tide tiles.

**Extracted icons carry their own palette, so draw sites must not pass one.**
This is trap 6 under sprite-sheet extraction in a new place. `art.js` `bake()`
resolves `palName || d.pal`, so an explicit palette at the draw site silently
overrides the sprite's extracted colours and renders it in the wrong ramp. The
items in `src/game/items.js` whose icons come from `sprites-hud.js` therefore
have **no** `pal` field, and the draw sites in `hud.js`, `menu.js`, `game.js`
and `title.js` no longer fall back to `'ui'`. If you extract more icons, drop
the item's `pal` at the same time; if you add an item using hand-drawn art,
give it one.

**Plate colour enclosed by a sprite's own outline is ARTWORK.** This is trap 3
above, and `tools/rip-hud.py` hit it again from the other side: the Seed Satchel,
ring box and Power Gloves all use the plate tone as a highlight *inside* the
outline, so treating every plate pixel as transparent punched holes straight
through them. `quantise_exact` flood-fills the plate from the cell border and
only erases what is reachable from outside. When that first went in it filled the
empty heart's middle too — a part-filled heart is an outline with the bar showing
through, not a heart with a tan centre — so `HOLLOW` opts those four out. If a
new extraction shows see-through slots, this is the first thing to check; an
allowlist in `scan-sprites.mjs` would have hidden a real bug rather than fixed it.

**`ripkit.quantise` is not deterministic when it pads a short palette.** It pads
to four by repeating the last colour, then picks each pixel's index by scanning
for the smallest squared distance — with duplicate entries several indices tie at
zero and the winner is not pinned down, so the same cell emits different indices
from run to run. `rip-hud.py` was three pixels unstable across runs before
`quantise_exact` replaced the search with a direct lookup keyed on a total order
(`-luminance`, then the RGB tuple). Every cell on that sheet has at most four
colours so nothing needs snapping. **`rip-enemies.py`, `rip-link.py` and
`rip-npcs.py` still use `ripkit.quantise`** — they reproduce byte-identically
today, but if one ever starts drifting, this is why.

**The status bar is modelled on the Oracle of Seasons / Ages bar** — a parchment
panel, `B[icon]`/`A[icon]` in tall drawn brackets, the rupee icon stacked over
its three digits, hearts right-aligned in two rows of seven. Two things there
are deliberate and look like bugs if you do not know:

- **The panel is a warm tan (`#f0e0b0`), not the text box's near-white.** Most
  item icons use palette `ui`, whose lightest index is `#f8f8e8`; on a near-white
  bar a sword or a conch washes out to nothing. The tan is what makes them read.
- **`drawHud` suspends the room tint around itself.** `applyTint` sets the tint
  on the whole *sprite atlas*, so hearts and item icons would otherwise dim with
  the room — invisible on the old black bar, but on a light panel it reads as a
  rendering fault. It is safe to toggle without `flush()` because `bake` keys its
  cache on `tintKey`, so tinted and untinted bakes coexist rather than thrashing.

**Engine gotchas already fixed, worth not reintroducing:**

- Input latches key presses, so a tap shorter than one frame still registers.
- Room-exit detection needs a margin wider than one movement step, or exits
  never trigger.
- Warping sets `_warpLock` so arriving on a warp tile does not bounce straight
  back through it.
- The validator rejects a space between two drawn pixels: it is legal in the
  grammar but punches a transparent hole through a sprite.
- Rooms draw a tile by its **tile** name while art is keyed by **art** name, so
  every palette-swap tile (`grassDark` reusing `ART.grass`, and so on) rendered
  as a placeholder box until `installCoreTiles` started aliasing tile names to
  the art they declare. If you add a tile that reuses another's art, that alias
  loop already covers it.

**The single-file build** (`tools/build.mjs`, checked by `tools/check-build.mjs`).
`npm run build` flattens `index.html` and the 46 modules reachable from
`src/main.js` into `dist/oracle-of-tides.html`, which runs from a `file://` URL
with no server and no network. Five things that were not obvious:

1. **It has to be a classic `<script>`, not an inline module.** A
   `<script type="module">` is fetched with an opaque origin under `file://` and
   blocked by CORS in every browser — even inline, even with every import
   already resolved away. That single fact is the reason the build flattens the
   module graph into a tiny synchronous registry instead of just concatenating
   the modules and keeping `type="module"`. Anyone "simplifying" it back will
   produce a file that is blank on double-click and fine over `npm run dev`.
2. **The no-runtime-assets claim is real, and the build now enforces it.** There
   is no `fetch`, no `XMLHttpRequest`, no `new Image`, no `<img>`/`<audio>`
   anywhere: sprites are procedural JS, audio is WebAudio synthesis. The build
   greps for all of it and refuses rather than emitting a file that 404s. If a
   real asset ever lands, embed it as a `data:` URI — do not remove the guard.
3. **That grep must run over comment- and string-stripped code.** The naive
   version fired twice on innocent lines: `tiles-terrain.js` provenance comments
   name `.png` sheets, and the overworld room grid `'Tg.....ogg'` is tile
   letters that happen to spell an audio extension. `stripCommentsAndStrings`
   in build.mjs exists for exactly this.
4. **`new Audio()` in `src/core/audio.js` is not the DOM `Audio`.** That module
   declares its own `class Audio` — the synth. The asset scan skips a global
   that the module shadows with its own declaration, which is why the pattern
   table carries a `shadow` column.
5. **Imports become destructuring, so an import cycle would break silently.**
   Every export in `src/` is a `const`, `function` or `class` — nothing is
   reassigned — so snapshotting a binding is safe *provided* the dependency has
   already evaluated. The build therefore topologically sorts and hard-fails on
   a cycle, naming the loop. It also rejects the forms it cannot express
   (default exports, `export *`, re-exports, dynamic `import()`, and
   multi-declarator `export const A = 1, B = 2`, which the transform would
   publish only half of). Extend build.mjs rather than working around it.

Also: `dist/` is in `.gitignore`, which silently swallowed the built file the
first time. It is now `dist/*` plus `!dist/oracle-of-tides.html`, so the build
output is committed and nothing else in `dist/` is.

And: `check-build.mjs` is only worth anything if it fails. It was verified by
sabotaging the bundle's last line with a thrown error and confirming it went
red on six separate assertions at once. `window.__game.frame` is the frame
counter — there is no `tick` or `frameCount`, and a check that reads a field
which does not exist passes forever.

## The two gates that cannot be tiles

Roc's Feather and the Power Bracelet became real tile gates this session. The
other two were implemented, measured, and taken back out. The measurements are
the point — do not redo them:

**Roc's Feather travels 2.27 tiles while airborne** (28 airborne frames,
36.4px), measured by driving a real jump and sampling `player.z` and `player.x`
every frame. Everything below follows from that number.

**`Room.solidAt` lets a JUMPING player through `F.DEEP` as well as
`F.JUMPABLE`.** So deep water is not, by itself, a Flippers gate: any channel
the Feather can clear is crossed without Flippers, and the player has the
Feather from D1. A Flippers channel therefore has to be **at least 3 tiles
wide**, and so does anything meant to stop the Feather.

- **Zora's Flippers / Drowned Wood — sealed 68 of 120 screens.** At 3 tiles
  wide, gating the Wood's five crossings cuts the map in half, because the
  Drowned Wood sits in the middle of the 12x10 grid and nearly every route
  crosses it. This is a level-design fact, not a tuning problem: the Wood is a
  thoroughfare. Making it a hard gate needs the region moved or a second route
  around it, which is a map change, not a tile change.
- **Hookshot / Reef Palace — the post is always out of reach.** A span has to
  be 3 wide to stop the Feather. The player fires from the tile before the
  span, must land on solid ground, and the post has to be one tile beyond that
  landing — so the post sits 5 tiles (80px) from the player. `Hookshot.maxLen`
  is **64px at level 1** (104 at level 2). The arithmetic never closes at L1.
  A 2-wide span reaches, but the Feather crosses a 2-wide span — verified: on
  the 3-wide span a jumping player reached the second tile and no further.
  This needs an engine decision (a longer L1 hookshot) or a different mechanic.

**A gate whose action nothing fires is the failure mode to watch.** The first
Reef Palace span had no post to latch onto at all. It flooded correctly in
`check-overworld.mjs` and was impassable in play — exactly the gap the two
checkers exist to close, caught by the in-engine half.

## Verification harnesses

**Five of these are now committed**, and that is a deliberate reversal. The
old note here said none was committed because "rewriting is better than trusting
a read-through". In practice rebuilding them from this prose reproduced five
separate harness bugs in one session — every one of which reads as a *game*
failure rather than a harness failure, which is the expensive kind. A working
harness beats an accurate description of one:

```sh
node tools/find-crossings.mjs    # every tile-level way into a region (reporter)
node tools/shoot-rooms.mjs       # screenshot named rooms in their real palettes
node tools/walk-dungeons.mjs     # every dungeon room, every ledge, all 4 faces
node tools/check-overworld.mjs   # seams, border, flood, all three item gates
node tools/solve-switches.mjs    # one push per block
node tools/check-gates.mjs       # the two item gates, in-engine, with real items
node tools/find-ledges.mjs       # reports where a ledge may go (not a check)
node tools/check-build.mjs       # the shipped single-file build boots from file://
```

Run the room checkers after touching any room data, and check-build.mjs after
touching anything at all — it is the only thing that proves the file the game
actually ships as still runs.

**`check-overworld.mjs` and `check-gates.mjs` are deliberately redundant, and
both are needed.** check-overworld proves the MAP side — the region is
unreachable without its item and reachable with it — but it never runs the
game, so a vane whose transform names an action nothing fires floods correctly
there and is still impassable in play. check-gates proves the ITEM side with a
live player. That gap is exactly where the two boomerang bugs below lived. The rest below are still
uncommitted and still worth rebuilding; all copy the boot pattern in
`tools/test.mjs`.

Two of them need engine internals that `main.js` does not publish. It only sets
`window.__game`; pull the rest out of the live module graph from inside the
page, which returns the same instances:

```js
await page.evaluate(async () => {
  const m = await import('/src/game/entity.js');
  window.__spawn = m.spawnEntity;              // and MAPS, getText, CUTSCENES
});
```

- **Boss harness** (brief section G) — for each of the 16 types: spawn it into
  its real arena, run ~1200 frames with the player attacking and ~1200 idle,
  and assert it moves or attacks, takes sword damage, opens a weak point if
  `shell`, reaches a later phase, damages an idle player, and dies. 264
  assertions. Three things this harness taught the hard way, which you will
  otherwise mis-attribute to the AI:
  - **Spawn minibosses on their real tile.** Bosses sit at `(4,2)`; minibosses
    at `(4,3)` or `(4,4)` depending on the dungeon. Dropping a miniboss at
    `(4,2)` puts it inside a wall, where it cannot move and looks inert.
  - **Keep the player alive between samples.** A boss that kills them drops the
    game into `gameover`, where nothing updates and *every later subject in the
    run* looks inert.
  - **Reset the game between subjects.** A boss's death drops an essence; the
    parked player collects it, which opens a text box and then an essence
    cutscene. An active dialogue freezes every entity **while `mode` stays
    `'play'`**, which is a genuinely confusing way to fail.
- **Tide probe** — hold the tide at each level for 600 frames per boss and
  record open-window percentage, distance travelled, `z` and self-healing.
  Proves the eight hooks actually differ instead of taking the comments' word
  for it. A companion probe pins the boss in place and measures how far the
  *player* is dragged, which is the only way to see Thalassor's whirlpool and
  Gustharpy's downdraught.
- **Story harness** (brief section H) — walk `MAPS` collecting every
  `dialogue`/`waiting`/`after` id any room entity references, assert each
  resolves via `getText`, then run every cutscene in `CUTSCENES` via
  `startCutscene`, pressing A/START until it completes, asserting each ends
  within 3000 frames. A cutscene that never ends soft-locks the game.

The two below predate this session and are still worth rebuilding.

- **Overworld checker** (`tools/check-overworld.mjs`) — imports
  `src/data/index.js` in plain Node (no browser), asserts all 120 screens exist, that every seam's walkable edge tiles
  agree at all three tide levels, that the world border is solid, and that a
  *tile-by-tile* flood from Tidewatch Village reaches every screen. Tile-by-tile
  matters: a screen-level flood misses an interior wall stranding an exit.
  Give it a `--bombs` mode that makes `F.BOMBABLE` passable and it also proves
  the Marsh gate: without Bombs 10 of the 12 marsh screens are unreachable, with
  Bombs all 120 are. The two boundary screens still count as reached either way,
  because the doorway pocket you stand in is inside them. Note the flood must
  treat a tile as passable if it is walkable at **any** tide level — the player
  controls the tide — which is also why this checker cannot prove the
  swim/feather gates, only the bombable one.

- **Music harness** — plays every track and asserts the scheduler advanced.
  `audio.update()` schedules against `ctx.currentTime`, so a synchronous loop of
  600 `update()` calls advances **nothing** and reports a false failure on every
  looping track; real frames have to elapse via the game's own rAF loop, and the
  context needs a keypress to unlock. Then assert every `music:` name in room,
  map and cutscene data resolves. Cutscenes are exported as **`STORY_CUTSCENES`**
  from `src/data/story.js`, not `CUTSCENES`; get that wrong and `finalBoss` and
  `ending` silently look unreferenced.

- **Ledge harness** — now best run over the *placed* ledges rather than painted
  ones: collect every `_` run out of `MAPS`, park the player on the tile above
  its middle, hold Down, and assert the landing tile is past the lip with
  `z === 0`; then park below and hold Up and assert it is refused. Four things
  that make this read as "the hop does not fire" when the hop is fine:
  **clear `game.dialogue.active` LAST**, after the room has settled, because a
  room script can reopen the box during the settle and an open dialogue freezes
  everything while `mode` is still `'play'`; **reset `mode` to `'play'` and
  refill hearts each probe**, or the first room that kills the parked player
  drops the run into `gameover` and every later probe looks inert; **hold the
  key ~22 frames, not 40**, or the player walks out of the room and arrives at
  the top of the next one, which is indistinguishable from never having moved;
  and **wait for `player.ledgeHop` to clear before measuring**, because the hop
  drives `z` along a scripted arc and mid-arc reads as a failure.
- **The dungeon walker must model Roc's Feather.** `solidAt` lets a jumping
  player through `F.DEEP` and `F.JUMPABLE` alike, and half of d4 is a one-tile
  drown-wall band — a wall at LOW and MID, deep water at HIGH — whose intended
  crossing is to raise the sea and jump it. A flood that cannot jump reports 15
  of d4's 18 rooms stranded and the dungeon unbeatable. It is not.
  The walker must also **follow warps**: floors are joined by stairs, not by
  seams, so an edge-only flood never leaves floor 0 and reports every upper
  room stranded. And the Boss Key is authored `['chest', x, y, { pickup:
  'bossKey' }]` — look for `pickup`, not `item` or `kind`.
- **Ledge harness (painting variant)** — paint a run of `ledgeS` into a live room with
  `room.setTile` and walk the player at it from each side: downhill clears it
  and lands with `z === 0`, uphill is blocked, along the lip is blocked, and a
  ledge with `cliff` behind it refuses the hop. `room.invalidate()` after
  setting tiles or the room draws from its cached bake.
- **Audio harness** — `audio.jingle(name)` sets `trackName` to
  `'$jingle:' + name`, which is what to assert on; the scheduler only advances
  over real frames. Wrapping `game.audio.jingle` and calling `presentItem` or
  `applyReward` is how to prove a moment plays the track it should.
- **Switch-puzzle solver** (`tools/solve-switches.mjs`) — the classes are
  `PushBlock` and `FloorSwitch` in `src/game/objects.js`, the switch's flag is
  `.pressed`, and `game.tryPushBlock(tx, ty, dx, dy)` takes the **block's** tile
  rather than the player's. Satisfy the puzzle's other clauses (`pz.tide`,
  `pz.enemies`) first or a switch room that also wants the room cleared reads as
  an unsolvable switch puzzle. For every room with a `switches` puzzle, call the
  engine's own `game.tryPushBlock` exactly **once** per block, park the player on
  any switch still unpressed, and assert `room._puzzleDone`. One push per block
  is the whole point: teleporting blocks onto switches passes even when the
  puzzle is unsolvable, which is how the one-tile bug above survived.
- **Dungeon walker** (`tools/walk-dungeons.mjs`) — boots headless, `enterMap`s into every room of every
  dungeon, and checks: no page errors, the room renders, no tile falls through
  to `void`, every entity type in the room resolves, every seam has a doorway
  facing its doorway, and a flood from the entrance — treating locked doors as
  walls until a key is spent, and the boss door until the Boss Key is found —
  reaches every room and the boss room. Deduplicate lock tiles when collecting
  them, or the walk spends several keys on the same door.

## Source sprite sheets are in the repo

The reference sheets live in `assets/sheets/` and are committed, so extractions
are reproducible in any checkout. All three extractors resolve their paths
relative to the repo root and produce byte-identical output to what is
committed. See `assets/sheets/README.md` for what each sheet contains, who
ripped it, and the copyright position.

Sheets present but not yet used: non-human races and trading characters. The
HUD/Gear sheet is used by `tools/rip-hud.py`; the icons Seasons does not have
(Flippers, Mermaid Suit, Hookshot, Moon Conch, Map, Compass) stay hand-drawn.
The dungeon-background and fan-made overworld sheets are used by
`tools/rip-terrain.py` for nine ground and wall tiles.

## What is left, highest value first

Art, music, dungeon interiors, the key economy and the Marsh gate are all done.
What remains, in rough order of payoff:

0. **The overworld sheet's props are 2x2 game tiles, not 1x1.** This is the
   finding that closes most of the terrain question. Measured this session:
   the bush at 1693,1307 is ~30x31, the ringed stump at 1802,1565 is ~30x28,
   and the tree was already known to be 16x32. The game's tiles are 16x16, so
   none of them extracts — compositing a 2x2 source prop down to one game tile
   is authoring, not extraction. **`flowers` was the only prop on the sheet
   that fits a single cell** (2061,1469, a 14x14 leafy rosette) and it is now
   extracted and planted. Do not go looking for the others again.

1. **More terrain.** Ten tiles are extracted; `cliff`, `cliffTop`, `tree`,
   `bush`, `rock`, `stump` and `palm` are still hand-drawn. They are
   harder than the nine that landed because they are *structured* — a cliff
   needs a top, a face and corners, and no single 16x16 window supplies that —
   and because they carry transparency and an `underArt`. The seamless-window
   trick in `tools/rip-terrain.py`'s header does not find them; they have to be
   picked by eye from a region dump.

   **Three things a session was spent establishing, so do not redo them:**

   - There is a scan that *does* find structured terrain, and it is a one-line
     change from the ground scan: a band (cliff face, wall run, hedge) is the
     16x16 window that repeats at **+16 in x and NOT at +16 in y**. Collapse
     only the 16 *horizontal* phase shifts — vertical position is real
     information there, it is what tells a cliff top from a cliff face — and
     dedup on exact bytes before canonicalising, same as the ground scan.
     Ranked by frequency on the overworld sheet this returns desert dune
     shelves, roof tiles, plastered building walls and one grey brick wall.
   - **It returns no natural cliff face.** The overworld sheet is a fan-made
     assembled map that is mostly town and desert; its closest analogue to
     `cliff` is a sandy plateau edge, which is a corner piece, not a repeating
     face. `cliff` and `cliffTop` are the two tiles least likely to come off
     this sheet, not the most.
   - **The sheet's tree is 16 wide by 32 tall** — a canopy tile over a separate
     root/base tile — while the game's `tree` is one 16x16 with canopy *and*
     trunk. `x1760,y1400` on the overworld sheet is a clean grove to work from
     (stumps and grass tufts are in the same crop), but a straight 16x16
     extraction gives a canopy with no trunk. Compositing two source tiles into
     one game tile is authoring, not extraction, and needs an in-game
     screenshot across several regions before it is believed — `preview.mjs`
     renders a pack in one palette and cannot show it.
2. **Water is still hand-drawn** and stays that way until someone finds a
   second animation frame: both terrain sheets are static maps.
3. **More ledges, if wanted.** 88 runs are placed across all four cardinals and
   `node tools/find-ledges.mjs` reports ~660 more tiles that would take one
   without walling a room off. That is a taste ceiling now, not a technical
   one. Run the finder rather than placing by eye: a lip is SOLID from three
   sides, so a run dropped across a corridor makes rooms unreachable and still
   validates, still renders, and is only caught by a flood pass long after you
   have placed forty of them.

## Known soft spots in what has been done
- **Four legend characters were declared and never used.** `f` (flowers), `^`
  (cliffTop), `Y` (treeSand) and `P` (palm) appeared in 0 of 303 room grids, so
  their art was never rendered anywhere in the game. `f` is now placed (127
  tiles across the 40 grass screens). The other three are still dead, and all
  three are SOLID, which is the dangerous class to place — a solid tile can
  strand a room and still validate.
- **`chasm` uses the dungeon pit art**, which on open sand reads as a hard-edged
  dark rectangle with no lip. It is legible as a gap but it is the weakest new
  tile; a proper overworld chasm wants a lit rim the way `ledgeS` has one.
- **`f` resolves per region** (`flowersDark` in marsh and wood, each region's
  own ground in salt, abyss, coral and reef) rather than meaning grass-flowers
  everywhere. If you add a region legend, give it an `f`.
- **`test.mjs` also goes flaky on "all three tide levels reachable"**, not only
  on the assertions listed under Tooling above. It failed on that one twice
  during this session — once after the boss-art commit and once after the
  music commit — and passed on an immediate re-run both times, on changes that
  touch only `src/data/sprites-bosses.js` and `src/data/audio.js` and so cannot
  affect the tide. Treat it as part of the same load-related flakiness.

- **All three tile-expressible region gates now match GAME-PLAN.md**:
  Bombs/`cliffCracked` (Marsh), Magic Boomerang/`saltVane` (Salt Pans) and
  Magnetic Gloves/`abyssPlug` (Abyssal approach). The remaining plan gates —
  Feather, Bracelet, Flippers, Hookshot — are terrain-shaped rather than
  tile-shaped, so no checker can prove them; they are asserted by level design
  only. **The Salt Pans gate also holds the Reef Palace shut**, because the
  Palace's own gate is the Hookshot and the Hookshot is in D6 inside the Pans.
  That is intended and `check-overworld.mjs` encodes it in `GATES.boomerang.covers`;
  if you move a gate, move the `covers` rectangle with it.
- **Every placed ledge is a shortcut, never a route.** The selector rejected
  any run that changed the room's walking connectivity at any tide level, so no
  ledge is load-bearing and none can strand a room. That is deliberately
  conservative: it also means a ledge saves at most a ten-tile detour, because
  a room is only 10x8. Ledges here are verticality and texture first.
- **`underArt` under a ledge is one fixed tile per variant**, so where a region
  mixes grounds — sand beside salt crust, say — the two transparent rows at the
  top and foot of the drop show the variant's ground rather than the neighbouring
  tile. It is two pixels of mismatch and reads fine; matching exactly would need
  the tile to know what is beside it.
- **`itemGet`, `secret` and `heartPiece` exist in `TRACKS` but nothing plays
  them.** The engine reaches for `fanfare`/`fanfareShort` at each of those
  moments (`src/game/objects.js`, `src/game/game.js`). Wiring them up is an
  engine change, not a data one.
- The overworld's remaining item gates (Feather, Bracelet, Flippers, Hookshot)
  are terrain-shaped, so `check-overworld.mjs` cannot prove them the way it
  proves the three flag-shaped ones.
- **North-facing ledges are drawn shallower than the other three on purpose.**
  A drop facing away from the camera shows almost no face, and the nine-row
  wall that sells `ledgeS` reads as a dark stripe painted across the floor.
  `ledgeN`'s face is six rows. East and west are straight quarter-turn
  rotations of the south lip, which keeps the speckle and face weight identical.
- **`ledgeN`/`dLedgeN` sit close to a dungeon wall in silhouette**, because both
  take `stonedk` and a dungeon wall is also a dark horizontal band. The lit
  bottom lip is what separates them, and it does read in game — but if a future
  dungeon palette narrows that contrast, this is the tile that breaks first.
