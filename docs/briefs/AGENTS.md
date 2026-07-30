# Content pack briefs

Each section is one agent's job. Read `docs/GAME-PLAN.md` first — it is
authoritative for names, layout, items, bosses and progression.

## Rules that apply to every brief

1. **Edit only the file(s) your section names.** Never touch `src/core`,
   `src/gfx`, `src/world`, `src/game`, or `src/data/index.js`. Other agents are
   working in other data files at the same time.
2. Room grids are **exactly 8 rows of exactly 10 characters**.
3. `node tools/validate.mjs` must report no problems attributable to your file.
4. Verification is part of the job, not an optional extra. Every section says
   how to verify. Do not report success without running it.
5. When running the play harness, pass your own shot dir so agents do not
   overwrite each other: `node tools/test.mjs --shots --shot-dir=shots-<yours>`.

## The pixel-art grammar (sections A, B, C)

Art is a template-literal string of rows, one character per pixel:

- `.` transparent
- `0` palette colour 0 (lightest)
- `1` palette colour 1 (mid)
- `2` palette colour 2 (dark)
- `3` palette colour 3 (outline / darkest)

Every row in one sprite must be the same length; the row count must equal the
height. Indentation is stripped, so indent art freely inside the file. Colours
are chosen by **index**, never by hex — the game supplies the palette at the
draw site. Design every sprite as a light-to-dark ramp so it works under any
palette in `src/gfx/palettes.js`.

Target look: **The Legend of Zelda: Oracle of Seasons / Ages on Game Boy Color.**
Chunky, high contrast, hard 1px dark outlines, no anti-aliasing, no dithering on
characters. Sprites fill most of their cell so they read against any terrain.

Directional naming: `_d` faces down (toward the viewer), `_u` faces up (away),
`_s`/`side` faces **RIGHT** — the engine mirrors it for left, so never draw a
left-facing version. Two-frame animations must differ by at least 3 pixels.

Worked example of the expected style:

```js
  o_pot: `
    ................
    .....333333.....
    ....31111113....
    ...3111111113...
    ..311110111123..
    ..311111111223..
    ..311111112223..
    ..311111122223..
    ..311111222223..
    ..311112222223..
    ..331122222233..
    ...3312222333...
    ....33333333....
    ................
    ................
    ................`,
```

Before drawing, read `src/gfx/art.js` (grammar), `src/gfx/palettes.js`,
`src/data/sprite-manifest.js` (the exact required names and sizes), and
`src/data/tiles-core.js` (existing art in the house style).

---

## Section A — Link, effects, HUD and item icons

**File: `src/data/sprites-link.js` only.**

Fill the four exported objects with the names in `REQUIRED_SPRITES` from
`src/data/sprite-manifest.js`:

- `LINK_ART` — 40 names, all 16x16
- `FX_ART` — 39 names, all 16x16
- `FX_BIG_ART` — 5 names, all **32x32**
- `UI_ART` — 45 names. `hud_heart0..4`, `i_seed_*`, `i_chain`, `i_hookhead` are
  **8x8**; the rest 16x16.

129 sprites. Do them all. Read the top comment of `src/game/player.js` — it
documents how each Link sprite is used.

Direction:

- Link uses palette `link` = [skin `0`, tunic `1`, tunic shadow `2`, outline `3`].
  Face and hands `0`, tunic body `1`, shading `2`, outline and eyes `3`. Pointed
  cap. Front view has two eyes; the `up` view shows cap and hair only, no face.
- He occupies about 12x15 inside the cell, feet near the bottom.
- Walk `_0`/`_1` differ clearly at the legs — move 2-3 pixels, not 1.
- `link_sword_*` is mid-swing with a short blade extended; the glowing arc is a
  separate sprite (`fx_slash_*`).
- `link_swim_*` is upper body and arms only, in rows 2-11 — the engine crops the
  lower rows and draws water over them.
- `link_carry_*` has both arms raised above the head.
- `link_conch_*` holds a conch shell to his lips, both hands up.
- `link_shield_*` is a small shield overlay drawn on top of Link: mostly
  transparent, just the shield on his facing side.
- `link_spin_0..3` are four rotation steps of the spin attack (sword right,
  down, left, up).
- `link_fall_0..2` shrink him as he drops down a pit.
- `shadow` is a flat ellipse about 12x5, `1` and `2` only, rest transparent.
- Effects are bright, simple and symmetric. `fx_puff` expands then thins.
  `fx_boom0..4` (32x32) is a fireball expanding to fill the cell then breaking up.
- `fx_slash_*_0/1` are crescent sword arcs, thin then wide; `_side_` points RIGHT.
- `hud_heart0..4` (8x8) is one heart at five fill levels, filling from the LEFT
  so quarter hearts read correctly. Palette `heart`.
- Item icons must be recognisable at 16x16: three sword tiers (longer/fancier
  each), three shield tiers, conch, feather, cape, bomb, lit bomb, bracelet,
  gauntlet, flippers, mermaid suit, boomerang (4 spin frames + magic version),
  hookshot, long hook, 8x8 chain link, 8x8 hook head, satchel, slingshot, hyper
  slingshot, shovel, magnet, ring box, ring, map, compass, `i_unknown` question
  mark, and five 8x8 seeds.

**Verify:** run `node tools/validate.mjs --strict --pack=link`, then the same
for `fx`, `fxBig`, `ui`. Fix every reported problem (ragged rows, wrong height,
illegal characters). Then `node tools/test.mjs --shots --shot-dir=shots-link`
and **Read `tools/shots-link/04-village.png` and look at it**. Link must read as
a small person in a tunic, not a blob. Iterate until it genuinely looks like a
GBC Zelda sprite.

---

## Section B — enemies, NPCs, pickups, objects, projectiles

**Files: `src/data/sprites-world.js` and `src/data/sprites-enemies.js` only.**

- `PICKUP_ART` 14 names 16x16, `OBJECT_ART` 16 names 16x16,
  `SHOT_ART` 7 names **8x8**, `NPC_ART` 11 names 16x16
- `ENEMY_ART` 56 names 16x16

104 sprites. Do them all. Read `src/data/enemies.js` to see which frames each
enemy uses and how it moves.

Enemies: `octorok` (d/u/s) squat octopus with a spitting snout; `crab` wide with
two claws and stalked eyes; `zol`/`gel` large and small blobs; `keese` bat, wings
up then down; `leever` burrowing ridged cone; `bubble` skull in a bubble;
`beamos` stone pillar with one eye; `beetle` (d/s) armoured with a spiked shell;
`tektite` round one-eyed spider on four legs; `wisp` floating flame with a face;
`urchin` spiky ball; `moblin` (d/u/s) snouted brute with a spear; `stalfos` (d/s)
skeleton with a small shield; `darknut` (d/s) armoured knight; `wizzrobe` hooded
sorcerer; `anglerfry` anglerfish with a lure; `barnacle` cluster that opens;
`jellyfish` bell with tentacles; `siren` mermaid-like singer; `pincer` lunging
eel head.

Objects and pickups: rupee/rupee5/rupee20 gems, heart, winged fairy, bomb pile,
seed pouch, small key, ornate boss key, quarter heart piece, full heart
container, `p_essence0`/`p_essence1` two frames of a glowing many-pointed star
(this is the dungeon reward — make it beautiful), `p_essence_dim` the same shape
flat and unlit; four chest states (big ones ornate), sign post, carved push
block, floor switch raised and pressed, torch and two lit frames, `o_raft`
(**left half only** — the engine mirrors it to make 32 wide), sluice wheel valve
open and closed, clay pot, liftable boulder. Projectiles are 8x8:
generic ball, rock, bubble, energy beam, spear (pointing RIGHT), magic orb, ink.

NPCs face the viewer: villager, second villager, fisher with hat and rod, small
child, stooped elder, shopkeeper, `npc_farore_0/1` the Oracle of Secrets as a
green-robed woman with long hair in a gentle two-frame idle, `npc_maku` the Maku
Tree with a friendly face, `npc_zelda` with crown and gown, `npc_nereth` the
Drowned King as a tall crowned figure of water and bone.

**Verify:** `node tools/validate.mjs --strict --pack=enemies`, then the same for
`pickups`, `objects`, `shots`, `npcs`. Then
`node tools/test.mjs --shots --shot-dir=shots-world` and **Read
`tools/shots-world/10-combat.png` and `04-village.png` and look at them**.
Enemies must read as creatures. Iterate.

---

## Section C — boss and miniboss art

**File: `src/data/sprites-bosses.js` only.**

- `BOSS_ART` — 33 names, all **32x32**
- `MINIBOSS_ART` — 16 names, all **24x24**

Names in `REQUIRED_SPRITES.bosses` / `.minibosses`. Each boss has frames
`_0.._2` (Nereth `_0.._3`) plus a `_hurt` frame used while flashing. The `_hurt`
frame should be the same pose recoiling, not a different creature.

The eight bosses, from `docs/GAME-PLAN.md`:

- `gohmaraq` giant crab with one huge armoured claw and a single exposed eye
- `anemos` sea anemone, a fleshy column crowned with waving tentacles
- `gloomtide` bog horror, a dripping mass with lantern eyes
- `wyverna` sea wyvern, winged and serpentine
- `rootmaw` drowned tree whose trunk splits into a mouth
- `brinehulk` salt golem, blocky crystalline limbs
- `thalassor` giant eel, coiled with a gaping jaw
- `nereth` the Drowned King, crowned skeletal figure wreathed in water — the
  final boss, and the most detailed thing in the game

Minibosses at 24x24: `clawcrab`, `reefguard`, `bogmaw`, `ironknight`,
`thornvine`, `saltwraith`, `gustharpy`, `tideshade`.

At 32x32 you have room for real detail — silhouette first, then a clear focal
point (the eye or mouth the player aims at), then shading. These are the set
pieces; spend the most care here.

**Verify:** `node tools/validate.mjs --strict --pack=bosses` and `--pack=minibosses`.
Then write a throwaway script in /tmp that boots the game headlessly (copy the
harness pattern in `tools/test.mjs`), spawns each boss into a room, screenshots
it, and Read the images to confirm each reads as its creature. Iterate.

---

## Section D — the overworld

**File: `src/data/overworld.js` only.**

Replace the `rooms` object with a complete 12x10 overworld: **all 120 screens
must exist** (`'0,x,y'` for every x 0..11, y 0..9). Keep the exported
`installOverworld`, `OVERWORLD_W`, `OVERWORLD_H`, `OVERWORLD_ROOMS` names.

Read `src/data/legends.js` (**digits 0-9 are tide tiles**), `src/world/room.js`,
`src/world/maps.js`, the six example rooms already in `overworld.js`,
`src/data/caves.js` for warps, and `src/data/enemies.js` for spawnable types.

- Use the region layout in GAME-PLAN.md; each room sets its region's `legend`.
- **Tide-gated routes are the point of the game.** At least 15 screens must have
  terrain where the tide meaningfully changes what you can do: sandbars (`1`)
  dry at LOW and deep at HIGH, channels (`5`) wadeable only at LOW, low walls
  (`9`) you swim over at HIGH, cave mouths only reachable at LOW, meadows (`0`)
  that flood.
- The 8 dungeon entrances go on exactly the screens in GAME-PLAN.md as a `C`
  tile warping to `d1`..`d8` with
  `to: { map: 'd1', floor: 0, rx: 3, ry: 7, px: 72, py: 96 }`. Those dungeon maps
  are being written concurrently, so validate will report their rooms as missing
  until they land — that is expected.
- Tidewatch Village at `0,4,7` should be a real village: houses
  (`caveMouthSolid` fronts, `caveMouth` + warp doors), a shop, NPCs, signs. Up
  to 5 house interiors as extra maps in your file via `registerMap`.
- Populate every region with era-appropriate enemies, signs with flavour text,
  chests, secrets behind bombable walls and dig spots (`x` = `digSpot`; rooms may
  declare `buried: [[tx, ty, 'heartPiece']]`), and 8 heart pieces total
  (`['pickup', x, y, { kind: 'heartPiece' }]`).
- **Edges must line up**: walkable east edge implies walkable west edge on the
  neighbour at the same rows. The world border must be solid.
- Difficulty ramps outward from the village.

**Verify:** `node tools/validate.mjs` — the only remaining problems may be
`warp targets missing room d1 ...` for the unwritten dungeons. Then
`node tools/test.mjs --shots --shot-dir=shots-ow`, all 35 assertions passing,
and Read a few PNGs to confirm the world reads as a coherent coastline. Finally
write a throwaway script in /tmp that walks the grid from `0,4,7` over shared
walkable edges and reports any unreachable screen.

---

## Section E — dungeons 1-4

**File: `src/data/dungeons-a.js` only.**

## Section F — dungeons 5-8

**File: `src/data/dungeons-b.js` only.**

Both sections follow the same spec; F is the late game and should be harder and
larger. Read `docs/GAME-PLAN.md` (names, ids, items, bosses, minibosses, tide
themes — authoritative), `src/data/legends.js` (the `dungeon` legend; digits are
tide tiles: `1` dSluice dry/shallow/deep, `2` dBasin dry/damp/shallow, `3` dWell
shallow/deep/deep, `4` dDrain pit at LOW then water, `8` tideRock, `9` drownWall
you swim over at HIGH), `src/world/room.js`, `src/world/maps.js`, the **top
comment of `src/game/game.js`** which defines the `puzzle` and `script` room
contracts, `src/data/caves.js`, and `src/data/enemies.js`.

Register each map with `kind: 'dungeon'`, the plan's name, `legend: 'dungeon'`,
`music: 'dungeon'`, `tint: 'cave'`, `scroll: false`, an 8x8 grid, 1-3 floors
(2-3 for section F). Each `dungeon` block is
`{ index, item, essence, boss, bossRoom, startRoom, entrance }` where `entrance`
is `{ map: 'overworld', floor: 0, rx, ry, px, py }` from the plan's entrance
screen, and `startRoom` is `'3,7'` for every dungeon (the overworld author points
warps at `rx: 3, ry: 7`).

Each dungeon needs:

- 18-30 rooms (22-30 for section F); entrance room warps back to the overworld
- Dungeon Map and Compass pickups (`{ kind: 'dungeonMap' }`, `{ kind: 'compass' }`)
- 2-4 Small Keys (3-5 for F) with `L` locked doors; one Boss Key and one `B` door
- A miniboss about two thirds through, by the plan's name. **Miniboss and boss
  entity types are being written concurrently** in `src/data/bosses.js` with
  exactly those names — spawn them by name and they resolve when that lands.
- The dungeon item in a big chest after the miniboss:
  `['chest', x, y, { big: true, item: 'feather', level: 1 }]`
- A boss room with the plan's boss, `noTide: true` unless the fight needs the
  tide. The engine spawns the essence on boss death; you spawn the Heart
  Container from the boss room script:
  ```js
  script: {
    onEvent(game, name) {
      if (name === 'bossDead') game.spawnPickup(80, 40, 'heartContainer', { grabDelay: 30 });
    },
  },
  ```
- **Tide puzzles carry each dungeon**, leaning on its assigned theme, escalating
  from teaching one idea to combining several. Use `puzzle` blocks for
  switch/torch/block/enemy gates, `tideForce`/`noTide` to pin the tide, and
  `valve` entities to gate tide control.
- Assume the player holds every earlier dungeon's item, and use the dungeon's own
  item inside itself after granting it, the way Zelda does.

**Solvability is a hard requirement.** Every key reachable before its door, every
room reachable from the entrance. Write the intended route as a comment at the
top of each dungeon.

**Verify:** `node tools/validate.mjs` with no problems naming your dungeons.
Then `node tools/test.mjs --shots --shot-dir=shots-<yours>` with all 35
assertions passing. Then a throwaway script in /tmp that boots headlessly (copy
the harness pattern in `tools/test.mjs`), warps into **every room** of each of
your dungeons via `window.__game.enterMap(...)`, and asserts no page errors and
that the room rendered. Report the results.

---

## Section G — bosses and minibosses

**File: `src/data/bosses.js` only.**

Read `docs/GAME-PLAN.md` (the eight bosses, their dungeons and tide themes, plus
HP/damage guidance), the whole of `src/game/enemy.js` (the `defineEnemy` and
`defineBoss` contracts, the `Boss` class with health-fraction `phases`, `intro`
hold, `shell`/`weakOpen`, `hurtFrame`, staged death, and the AI toolkit:
`wander chase flee patrol bounceDiag hop charge orbit submerge shoot shootRing
every timer aligned facePlayer distToPlayer moveDir driftWithTide`),
`src/game/entity.js`, `src/game/projectile.js` (`fire()` for custom patterns),
`src/data/enemies.js` (house style and minion names), and
`src/data/sprite-manifest.js` (frame names; bosses 32x32, minibosses 24x24).

Define eight bosses — `gohmaraq`, `anemos`, `gloomtide`, `wyverna`, `rootmaw`,
`brinehulk`, `thalassor`, `nereth` — and eight minibosses — `clawcrab`,
`reefguard`, `bogmaw`, `ironknight`, `thornvine`, `saltwraith`, `gustharpy`,
`tideshade`. Use `defineBoss` for minibosses too, with lower HP, `intro: 40`,
`w: 24, h: 24`.

Each boss needs:

- **2-3 phases** via `phases` keyed on `above` health fraction, each visibly
  different: new attack, faster, new minions, new vulnerability.
- **A clear tell before every big attack** — set `e.stun` briefly or flash
  `game.spawnEffect('spark', ...)`. A fight nobody can read is a bad fight.
- **A tide hook matching its dungeon's theme**, reading `game.tide.level`, and
  different for each of the eight. For example: only vulnerable at LOW when the
  water drains off its shell; fast at HIGH and beached at LOW; attacks that
  change with water level; lure it onto a drain then lower the tide.
- HP about 24 at D1 rising to about 80 for Nereth; contact `damage: 4`.
  Minibosses 12-20 HP, `damage: 3`.
- Nereth: 4 phases, the longest fight, escalating through tide states.
- `shell: true` plus setting `e.weakOpen` in the AI for armoured bosses.
- A short comment per definition saying what the fight is and how it is beaten.

**Verify:** `node tools/validate.mjs` clean of your problems. Then write a
throwaway harness in /tmp (copy the pattern in `tools/test.mjs`) that, for each
of the 16 types: boots the game, spawns it into the room, runs 1200 frames with
the player attacking and 1200 with the player idle, and asserts no page errors,
that `hp` drops when hit, that it moves or attacks rather than sitting inert,
that the player takes damage in the idle run, and that `hurt(g, 999, 'down', 0)`
triggers the death sequence. Any boss that is inert, invulnerable or harmless is
a bug — fix it. Then `node tools/test.mjs --shot-dir=shots-boss` with all 35
assertions passing.

---

## Section H — story, dialogue and cutscenes

**File: `src/data/story.js` only.**

Read `docs/GAME-PLAN.md` (premise, characters, dungeon order, item sources),
`src/game/cutscene.js` (**the step format is in the top comment** — follow it
exactly), `src/game/dialogue.js` (`registerTexts`), and the existing
`src/data/story.js` for the house style.

Write:

- A full `DIALOGUE` map of named texts for every NPC the overworld author places.
  They are writing `src/data/overworld.js` concurrently and referencing ids like
  `villager1`, `fisher1`, `shopkeeper`. Provide a generous set of plausible ids —
  villagers, fishers, children, elders, shopkeepers, the Maku Tree, Farore — and
  keep each to two or three sentences of characterful, dry, Zelda-flavoured prose.
- `intro` — the opening: shipwreck, Farore, the Tide Bell, the Moon Conch, the
  sword. Keep the existing `give` steps so the player is equipped.
- `essence1` through `essence8` — a distinct scene per Essence, each advancing
  the story: the Maku Tree stirring, Nereth noticing Link, the sea calming a
  little, and by the eighth a real sense of the endgame.
- `makuTree` scenes for the between-dungeon beats, including granting the Seed
  Satchel after the first Essence and the Master Sword after the eighth.
- `nerethIntro` before the final fight and `ending` after it — the Bell reforged,
  the tide settling, Farore's farewell, and a proper closing caption.
- Optional but wanted: a small trading sidequest chain of texts.

Keep prose tight; the text box shows three short lines at a time. Use `\n` for
deliberate breaks. Never write a line longer than about 34 characters without a
break opportunity.

**Verify:** `node tools/validate.mjs` clean. Then
`node tools/test.mjs --shots --shot-dir=shots-story` with all 35 assertions
passing — the harness clicks through the intro, so a broken cutscene will fail
it. Then write a throwaway script in /tmp that boots the game and runs every
cutscene in turn via `window.__game.startCutscene(id)`, stepping frames and
pressing A/START until it completes, asserting each one terminates within 3000
frames and produces no page errors. A cutscene that never ends soft-locks the
game, so this check is essential.

---

## Section I — music

**File: `src/data/audio.js` only. Keep the entire `SFX` object as it is** — only
extend or replace `TRACKS`.

Read the **top comment of `src/core/audio.js`**, which defines the tracker format
exactly: `bpm`, `rowsPerBeat`, `loop`, per-channel `cfg` (`p1`/`p2` pulse with
`duty`, `wav` triangle bass, `noi` noise percussion), named `patterns`, and an
`order` array. Note tokens: `C4`/`C#4`/`Db4` start a note, `-` holds, `.`
silences; noise uses `x` kick, `s` snare, `h` closed hat, `H` open hat, `c` crash.

Write real tunes — melody, counter-melody, bass and drums, several patterns each
with an `order` that gives an A/A/B/C structure, not one bar looped. Target the
Oracle games' sound: bright, memorable, slightly melancholy at the edges.

Tracks wanted: `title` (stately, oceanic), `overworld` (the main theme — the one
players will hum), `village`, `cave`, `shop`, `dungeon` (tense), `dungeon2` (a
second dungeon theme for variety), `boss`, `finalBoss`, `abyss`, `marsh`,
`reef`, `salt`, `ending` (long, triumphant then calm). Keep the existing jingles
(`fanfare`, `fanfareShort`, `essence`, `bossClear`, `gameOver`) and add
`itemGet`, `secret` and `heartPiece` jingles (`loop: false`).

Rooms and maps reference tracks by name; unknown names silently play nothing, so
the names above matter.

**Verify:** `node tools/validate.mjs` clean, then
`node tools/test.mjs --shot-dir=shots-music` with all 35 assertions passing.
Then write a throwaway script in /tmp that boots the game headlessly, and for
each track calls `window.__game.audio.play(name)` followed by ~600 update ticks,
asserting no page errors and that the scheduler advanced (`audio.track` set,
`_orderIdx`/`_row` moving). Silent or throwing tracks are bugs. Also assert every
track name above exists in `TRACKS`, and that every `music:` name referenced
anywhere in `src/data/*.js` resolves to a real track.

---

## Section J — extracting art from a ripped sprite sheet

Some art is lifted from the original games rather than drawn. `tools/ripkit.py`
does the work; `tools/rip-npcs.py` is a complete worked example, and
`tools/rip-link.py` is a second one using a hand-written coordinate map.

The workflow:

1. `load(path)` then `background(px, W, H)` — the background is whichever colour
   dominates the sheet border (green on most sheets, white on some).
2. `find_cells(px, W, H, bg, size=16, y1=...)` returns cell origins. Bound the
   scan with `x0/x1/y0/y1` to skip label text and credit blocks.
3. `contact_sheet(im, cells, 'tools/shots/<name>-index.png')` writes a numbered
   PNG. **Read that image** and write down which index is which creature.
4. Map index -> engine sprite name, then `quantise()` each cell and
   `emit_module()` the result.
5. Wire the new module into `src/data/index.js`, registering it **after** the
   placeholder pack so the extracted art wins.

Three traps that cost real time the first time round:

- **Sheets do not use a uniform row pitch.** Assuming 16px steps cuts every
  sprite in half. `find_cells` measures each sprite's own bounding box; do not
  replace that with a fixed grid.
- **Full-colour sprites need per-sprite palettes.** Link's sheet happened to use
  three colours, but most do not. `quantise` returns a palette per sprite,
  `emit_module` binds it via the `{ art, pal }` form, and `registerPalettes`
  installs it. If art renders in the wrong colours, the palette is not bound.
- **Packed sheets leak neighbours.** Adjacent sprites bleed a pixel or two into
  a cell; `_trim_slivers` drops edge columns that are disconnected from the body.

Sizes and names must match `src/data/sprite-manifest.js`. Directional sets use
`_d` (down), `_u` (up), `_s` (side facing RIGHT — mirror with `flip=True` if the
sheet faces left). Verify with `node tools/validate.mjs --strict --pack=<pack>`,
then `node tools/preview.mjs <pack> --scale=6` and **look at the PNG**.

Record the source and ripper credit in the generated module's header, as the
existing rip modules do.
