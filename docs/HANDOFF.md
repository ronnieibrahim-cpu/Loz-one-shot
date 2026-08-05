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
| **One-way ledges** | **Done** — 38 runs placed, 9 regional variants |
| **itemGet / secret / heartPiece** | **Done** — wired to their moments |

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
   was 1234 at the time of writing.)
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
- **Ledges are south-facing only.** `ledgeS` is the only direction the tileset
  declares, so a run must be approached from the north and land to the south.

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

## Verification harnesses

Four throwaway checkers have been written for this project. **None is
committed** — they are described well enough here to rewrite in a few minutes,
and rewriting is better than trusting a read-through. All four copy the boot
pattern in `tools/test.mjs`.

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

- **Overworld checker** — imports `src/data/index.js` in plain Node (no
  browser), asserts all 120 screens exist, that every seam's walkable edge tiles
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
- **Switch-puzzle solver** — for every room with a `switches` puzzle, call the
  engine's own `game.tryPushBlock` exactly **once** per block, park the player on
  any switch still unpressed, and assert `room._puzzleDone`. One push per block
  is the whole point: teleporting blocks onto switches passes even when the
  puzzle is unsolvable, which is how the one-tile bug above survived.
- **Dungeon walker** — boots headless, `enterMap`s into every room of every
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

1. **More terrain.** Nine tiles are extracted; `cliff`, `cliffTop`, `tree`,
   `bush`, `rock`, `flowers`, `stump` and `palm` are still hand-drawn. They are
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
2. **The Salt Pans and Abyssal approach gates** still do not match
   GAME-PLAN.md, and cannot until something can gate on the Boomerang and the
   Magnetic Gloves. See the soft spots below.
3. **Water is still hand-drawn** and stays that way until someone finds a
   second animation frame: both terrain sheets are static maps.
4. **More ledges.** 38 runs are placed and 169 more rooms take one safely; the
   38 were curated (at most three per dungeon, never adjacent, never in a
   switch, door, transition or boss room) rather than capped by what is
   possible. Ledges are also south-facing only — `ledgeS` is the only direction
   the tileset declares, and `tryLedgeHop` already handles all four.

## Known soft spots in what has been done
- **`test.mjs` also goes flaky on "all three tide levels reachable"**, not only
  on the assertions listed under Tooling above. It failed on that one twice
  during this session — once after the boss-art commit and once after the
  music commit — and passed on an immediate re-run both times, on changes that
  touch only `src/data/sprites-bosses.js` and `src/data/audio.js` and so cannot
  affect the tide. Treat it as part of the same load-related flakiness.

- **Two overworld region gates still do not match GAME-PLAN.md.** The Salt Pans
  are gated on Feather + Bracelet and the Abyssal approach on Flippers +
  Hookshot, where the plan calls for the Magic Boomerang and the Magnetic
  Gloves. Neither item gates terrain: nothing in the tileset can express "a gap
  only a boomerang can cross". Doing it properly needs either a new tile with
  its own flag and engine support, or accepting a different item. The Marsh
  gate now matches the plan — see `cliffCracked` in `tiles-core.js`.
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
- The overworld's item gates other than the Marsh are terrain-shaped, so the
  throwaway overworld checker below cannot prove them the way it proves Bombs.
