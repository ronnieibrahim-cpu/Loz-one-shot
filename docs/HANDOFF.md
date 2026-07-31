# Handoff — Oracle of Tides

State of the project as of this handoff, and what a fresh session needs to know.

## Where things stand

Branch: `claude/zelda-boss-behavior-jgbfwo` (everything committed and pushed).
It branches from `claude/zelda-style-game-piqt8v` and contains all of that
branch's history plus the boss, art and story passes. `piqt8v` is unchanged and
can be fast-forwarded onto this one.

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
| Boss/miniboss art (49) | **Poor** — script-generated blobs, needs redraw |
| Music | 6 tracks, needs about 14 |

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

Sheets present but not yet used: non-human races, trading characters, dungeon
backgrounds, and a fan-made Oracle-style overworld tileset.

## What is left, highest value first

1. **Boss and miniboss art redraw** (`src/data/sprites-bosses.js`, brief
   section C). 49 names: `BOSS_ART` 33 at **32x32**, `MINIBOSS_ART` 16 at
   **24x24**. They currently exist as script-generated blobs, which is why
   `validate` passes and the screen still looks wrong. This is the single
   biggest remaining visual problem — these are the set pieces, and every one
   of them now has a real fight attached to it that the player will be staring
   at for a minute at a time. `docs/ART-DIRECTION.md` is binding; the failure
   mode it describes is exactly the one in this file today.
2. **Music** (`src/data/audio.js`, brief section I). 6 tracks exist, about 14
   are wanted. **Keep the entire `SFX` object as it is** — only extend or
   replace `TRACKS`. The tracker format is defined in the top comment of
   `src/core/audio.js`. Track names referenced by map data that do not exist
   play nothing silently, so the names in the brief matter.
3. **Optional polish**, in rough order of payoff:
   - `i_compass` is the one item icon that still does not read well.
   - Dungeon room interiors are correct and solvable but plain (see below).
   - The three overworld region gates that do not match GAME-PLAN.md.

## Known soft spots in what has been done

- Three overworld region gates do not match GAME-PLAN.md, because no overworld
  tile carries `F.BOMBABLE` and nothing can be gated on the Boomerang or the
  Magnetic Gloves. The Marsh is gated on the tide instead of Bombs, and the Salt
  Pans and Abyssal approach on earlier items. The file header names all three.
  Adding a cracked-cliff tile to `tiles-core.js` plus a `bomb` transform would
  let the Marsh gate match the plan.
- Each of dungeons 5-8 carries one Small Key more than it has locked doors.
- Dungeon room interiors are honest but plain — corridors of pots and tide
  tiles. They are correct and solvable; they are not yet *interesting*. Adding
  `puzzle` blocks and one-way ledges to the middle rooms is cheap now that the
  structure is proved.
