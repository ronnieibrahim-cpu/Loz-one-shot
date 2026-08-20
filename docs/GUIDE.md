# Oracle of Tides — Player's Guide

This guide is generated from `src/data/` as it actually exists in this build,
not from `docs/GAME-PLAN.md` or `docs/ITEMS.md`. Where those two documents
disagree with the data, the data is what is described here, and every such
disagreement is listed at the end. Room references are given in backticks as
`mapId/floor,x,y` — the same key the engine itself uses (`d1/0,3,2`,
`overworld/0,8,8`) — so you can cross-check anything here against the source.

Everything past the spoiler-free opening describes dungeon layouts, item
locations and boss patterns in full. Stop reading after Part 1 if you don't
want that.

---

## Part 1 — Before you start

**The premise.** Link washes ashore in Thalassia. Nereth, the Drowned King,
has shattered the Tide Bell into six Essences of the Tide and hidden them in
six drowned places. Farore, Oracle of Secrets, gives you a shard of the Bell —
the Moon Conch — so you can command the tide yourself while you go and take
the Essences back. (`src/data/story.js`, the `intro` cutscene.)

**Controls.** Arrow keys or a D-pad move; `X`/`K` is the **A** button, `Z`/`J`
is **B**; `Enter` is Start, `Shift`/`Tab` is Select. (`src/core/input.js`.) A
and B are assignable item slots, not fixed roles — whatever you pick up first
fills B, the second fills A, and you can rearrange them from the pause menu
afterward. In a fresh game that means **the Moon Conch starts on B and the
sword on A** (`src/game/game.js`, `src/game/progress.js`).

**The Moon Conch.** Press its button to cycle the tide LOW → MID → HIGH → LOW.
Two presses reach any level from any other. (`src/data/story.js`: "Sound it
and the tide will answer: LOW, then MID, then HIGH, and around again.")

**How the tide actually works.** It is not a single on/off switch — it is a
*field*. `game.tide.level` is the base value the conch sets, the one the HUD
gauge and the save file show; almost everything else in the world — collision,
which tiles are solid, what an enemy does, whether a raft floats — asks
`tide.levelAt(tx, ty)` instead, which resolves per-tile and can differ from the
base wherever something (starting with the Tidewright's Anchor, D1's item) has
locally overridden it. In practice: sounding the conch changes the *whole
room* at once unless you are standing near an Anchor's held patch, in which
case that patch stays where it was. (`src/game/tide.js`.)

| Level | What changes |
|---|---|
| LOW | Sandbars and seafloor exposed; sunken cave mouths open; channels wadeable; water wheels stop. |
| MID | The default state of the world. |
| HIGH | Shallows become deep water; low walls submerge; rafts float up to high ledges. |

In every room's text grid, **the digits 0–9 are always tide tiles** — never
anything else (`src/data/legends.js`). Each dungeon is built around a
different consequence of the tide; Part 2 says which for each one.

You start with 3 hearts (`HEART_UNITS = 4` per heart, `src/data/feel.js`) and
the sword and shield you're handed in Tidewatch Village. Health is quarter-
hearts. Ordinary enemy contact costs half a heart, tougher enemies three
quarters, boss contact a full heart.

---

## Part 2 — The six dungeons

There are **six dungeons**, not eight. `essenceCount()` in `src/world/maps.js`
— the one place in the engine that counts them — returns **6**, and only `d1`
through `d6` are registered as dungeon maps with an essence. (Two more
dungeons, the pre-consolidation Salt Pan Vault and Reef Palace, still exist as
one-room ruins on the overworld; see "Optional items, caves and secrets"
below.)

Every dungeon's intended room order below is copied from the comment written
directly above its `registerMap()` call in `src/data/dungeons-a.js` /
`dungeons-b.js` — the dungeon author's own route, not a guess. Room names and
chest/pickup contents are read from the live room registry
(`installData()` + `MAPS`), not retyped by hand. The one place this guide
diverges from those comments is D1, where `node tools/check-playthrough.mjs`
— the only tool in this project that proves a route by actually playing it,
headless, with no items granted and no warps — has *walked* the dungeon for
real up to the point the harness's scripted actor runs out of verbs. Its
trace is quoted directly.

**A caveat, worth stating up front because no other document in this repo
does:** only D1's opening is proven by an actual played run. D2 through D6 are
proven *completable* by their own item-specific checkers
(`check-anchor`/`check-lens`/`check-cleats`/`check-bellows`/`check-reefseed`/
`check-dredge`) and by `node tools/walk-dungeons.mjs`'s room-graph flood, which
are both models of the game, not the game — see `docs/DUNGEON-STATUS.md`,
"What no dungeon has yet: nobody has played one." The room orders below for
D2–D6 are the dungeons' own stated intent, not a played confirmation.

### D1 — Tidewash Grotto (`d1`)

- **Entrance:** `overworld/0,8,8`, the Shallows region. No item required to
  enter — it's the first dungeon.
- **Item:** the **Tidewright's Anchor** (`anchor`), big chest in the
  Sluicegate, `d1/0,3,2`.
- **Tide theme:** freezing one disc of the room at whatever level the tide was
  when you threw the Anchor, while the rest of the room keeps obeying the
  conch — so a room can be dry under your feet and flooded three tiles away.
- **Boss:** Gohmaraq, the Tidewash Claw, `d1/0,3,1`.
- **Miniboss:** Clawcrab, Clawcrab Den `d1/0,5,3`.

**The actually-played route** (`node tools/check-playthrough.mjs`, run against
seed `20260806`, 8729 frames, currently green):

1. `d1/0,3,7` Grotto Mouth (the cave entrance from `overworld/0,8,8`)
2. Sound the conch to LOW here, before going anywhere — the room north is a
   floor of wells with no way around it dry.
3. `d1/0,3,6` The Drinking Floor, waded at LOW — two crabs and a keese.
4. `d1/0,3,5` Sunken Hall (the hub) — a zol and a crab, then a push-block
   puzzle: two `hold` switches, one block each, pushed onto both at once
   (either order) opens a **fairy** — the only free heal the dungeon offers.
5. `d1/0,2,5` Map Alcove — Dungeon Map.
6. `d1/0,4,5` Chartstone Alcove — Chartstone, in a chest.
7. `d1/0,3,4` Tide Gallery — a locked door blocks north; two Small Keys stand
   between here and the Anchor.
8. `d1/0,2,4` Crab Pit (west) — three shielded crabs; clearing the room earns
   **Small Key 1**.
9. `d1/0,4,4` Switch Room (east) — the same push-both-blocks puzzle as the
   Sunken Hall earns **Small Key 2**.
10. Back at the Tide Gallery, spend Small Key 1 on the north door.
11. `d1/0,3,3` The Locked Stair — two zols, then spend Small Key 2 on the
    second locked door.
12. `d1/0,3,2` **The Sluicegate** — no enemies, just the big chest: the
    **Tidewright's Anchor**.

This is where the harness's route stops — not a game blocker. Everything past
the Sluicegate is gated by the Anchor's *own* verb (sink it on a chosen tile,
walk away, recall it), which the current playthrough actor has no directive
for. The rest of D1, per the dungeon's own route comment, continues from the
Sluicegate:

- **West wing:** `d1/0,2,2` gate → `d1/0,1,2` → `d1/0,1,3` (a second push-
  block switch puzzle) → `d1/0,1,1` (an Anchor gauge room — the door opens only
  while one well reads drained and another reads drowned) → `d1/0,2,1`
  **Bosskey Vault** (Boss Key chest) → boss door → `d1/0,3,1` **Gohmaraq**.
- **East wing:** `d1/0,4,2` gate → `d1/0,5,2` The Drowned Chamber → `d1/0,5,1`
  gate → `d1/0,4,1` **The Keyvault** (Small Key 3, in a chest) → `d1/0,5,3`
  Clawcrab Den (locked with key 3; the miniboss) → `d1/0,4,3` **The Two
  Gauges** — a second Anchor-gauge door, and **Heart Piece 11** (see Part 3).
- `d1/0,2,3` Weeping Wall: the **Split Fang** charm, hand-placed in a chest —
  the first charm in the game you can actually slot (MID case).
- `d1/0,2,6` Bone Cell: a **blank** for the scrimshander (see Part 6).

Both wings end in a one-way return staircase: an Anchor sunk in a gate can be
walked back over, but one *recalled* from the far side can't be re-sunk from
there, so the stairs are the shortcut back rather than a soft lock.

### D2 — Coral Spire (`d2`)

- **Entrance:** `overworld/0,10,5`, Coral Reef. No overworld gate protects
  this region — the old Roc's Feather gate was removed on purpose (the hop is
  base moveset now); see the Disagreements section.
- **Item:** the **Brineglass Lens** (`lens`), big chest, Sealed Cell
  `d2/1,4,4`.
- **Tide theme:** the Spire's forking shafts pin the tide (`tideForce: 0`,
  refusing the conch) so you choose a branch blind unless you have the Lens to
  preview the next tide level's layout before committing.
- **Boss:** Anemos, the Crowned Column, `d2/1,3,1`.
- **Miniboss:** Reefguard, Reefguard Hall `d2/1,4,2`.

Intended route (24 rooms; the Lens is room 14 of 24):

`d2/0,3,7` mouth → `d2/0,3,6` landing → `d2/0,2,6` Bone Cell (a blank) →
`d2/0,3,5` Tide Gallery → `d2/0,2,5` Map Nook (Dungeon Map) → `d2/0,4,5`
Torch Cell (**Small Key 1**) → `d2/0,3,4` Rising Chamber → `d2/0,3,3`
Cistern Cell (**Barnacle Skin** charm, in a chest) → `d2/0,2,4` Stair Coil
(locked, key 1) → upstairs: `d2/1,2,4` Upper Landing → `d2/1,2,5` Anemone
Cell (a **fairy**) → `d2/1,3,4` Spire Concourse → `d2/1,4,4` **THE BRINEGLASS
LENS** → `d2/1,4,5` Glass Cell (phased enemies — **Heart Piece 12**) →
`d2/1,4,3` The First Fork → `d2/1,4,2` Reefguard Hall (miniboss, **Small Key
2**) → `d2/1,5,3` Bomb Vault (big chest: **Bombs**) → `d2/1,5,4` Whelk Cell →
`d2/1,3,2` Spire Ascent (boss door) → `d2/1,2,3` Drowned Cell (locked, key 2)
→ `d2/1,2,2` The Sounding Fork → `d2/1,2,1` Bosskey Cell (Boss Key) → boss
door → `d2/1,3,1` **Anemos**.

Every room after the Lens is behind a fork or needs the Lens in its own right
(the boss room, `d2/1,3,1`, is the one stated exception).

### D3 — Bogwater Sanctum (`d3`)

- **Entrance:** `overworld/0,1,8`, Sunken Marsh. Gated by `F.BOMBABLE`
  (`cliffCracked` tiles at both Marsh entrances) — you need **Bombs**, D2's
  item, to reach D3.
- **Item:** **Kelp-Soled Cleats** (`cleats`), big chest, The Cistern Floor
  `d3/0,3,3`.
- **Tide theme:** every deep room has two route layers — swim the surface, or
  sink and walk the seafloor. The Cleats make deep water a second layer of the
  level rather than a wall, and torrents (fast current, `push` applied only
  while swimming) are crossable on the floor and not on the surface.
- **Boss:** Gloomtide, the Bogwater Maw, `d3/0,3,1`.
- **Miniboss:** Bogmaw, Bogmaw Hall `d3/0,2,2`.

Intended route (24 rooms; the Cleats are room 11 of 24):

`d3/0,3,7` mouth → `d3/0,3,6` the Drowned Nave → `d3/0,4,6` Bell Cell
(**Wrecker's Eye** charm — the first LOW-case charm you can own — plus a
**blank**) → `d3/0,3,5` Bog Hub → `d3/0,2,5` Map Cell (Dungeon Map) →
`d3/0,4,5` Sluice Cell (**Small Key 1**) → `d3/0,3,4` The Weir (locked, key 1)
→ `d3/0,2,4` Silt Cell (Chartstone, in a chest) → `d3/0,4,4` Reed Cell (clear
the room's enemies for **Heart Piece 13**) → `d3/0,3,3` **THE KELP-SOLED
CLEATS**.
West wing: `d3/0,2,3` The Undertow (torrent) → `d3/0,1,3` Sunken Vestry
(**Small Key 2**) → `d3/0,1,4` Silt Vault → `d3/0,2,2` Bogmaw Hall (locked,
key 2; the miniboss) → `d3/0,1,2` Drain Gallery (Boss Key, in a chest).
East wing: `d3/0,4,3` The Bogwater Drain (torrent; a **fairy** on the surface
route) → `d3/0,5,3` Eel Hall → `d3/0,5,4` Eel Vault (**Small Key 3**) →
`d3/0,4,2` The Kelp Locks (torrent, two screens wide — 18 tiles of seafloor in
one breath) → `d3/0,3,2` The Lock Gallery (locked, key 3) → boss door →
`d3/0,3,1` **Gloomtide**.
`d3/0,2,1` Vestry Roof holds **Heart Piece 14**.

### D4 — Cliffside Cistern (`d4`)

- **Entrance:** `overworld/0,1,3`, Cliffs of Kell. See "A progression gap the
  data actually has" under Disagreements — as currently gated, this region's
  overworld screens cannot be reached without an item this dungeon does not
  contain.
- **Item:** the **Squall Bellows** (`bellows`), big chest, Bellows Vault
  `d4/0,1,4`.
- **Tide theme:** the sea has to be in two states at once. A paddle wheel
  drowned under deep water won't catch the wind; the Bellows' held cone takes
  the water off exactly one tile while you stand still and hold it, which is
  the only thing that frees a wheel sealed behind its own moat.
- **Boss:** Wyverna, the Sea Wyvern, `d4/0,3,1`.
- **Miniboss:** Ironknight, Ironknight Gallery `d4/0,5,3`.

Intended route (24 rooms; the Bellows at room 12):

`d4/0,3,7` entrance → `d4/0,3,6` landing → `d4/0,2,6` Overflow Sluice (Dungeon
Map) / `d4/0,4,6` Cracked Basin (**Small Key 1**) → `d4/0,3,5` The Weir
(locked, lock 1) → `d4/0,2,5` Drowned Stair (Chartstone) / `d4/0,4,5` Rung
Gallery (**Heart Piece 15**) / `d4/0,5,5` Cliffside Cell (**Bosun's Whistle**
charm) → `d4/0,4,4` The Cistern Floor (**Small Key 2**) → `d4/0,3,4` →
`d4/0,2,4` Winch Room (locked, lock 2) → `d4/0,1,4` **THE SQUALL BELLOWS** →
`d4/0,1,3` Squall Loft (sill 1) → `d4/0,2,3` The Drowned Sill (sill 2) →
`d4/0,2,2` Cistern Gauge (sill 3, **Small Key 3**) → back east: `d4/0,3,3` →
`d4/0,4,3` The Long Race (sill 4) → `d4/0,5,3` Ironknight (miniboss) →
`d4/0,5,2` Cliff Walk (locked, lock 3) → `d4/0,4,2` The Crossed Sluices
(sills 5 and 6, Boss Key) → `d4/0,2,2` → `d4/0,3,2` boss door → `d4/0,3,1`
**Wyverna**.

### D5 — Drowned Wood Shrine (`d5`)

- **Entrance:** `overworld/0,5,4`, Drowned Wood. No tile-flag gate protects
  this region — it's enforced by level design only, per `docs/ITEMS.md`.
- **Item:** the **Reefseed** (`reefseed`), big chest, Reefseed Vault
  `d5/0,1,4`.
- **Tide theme:** the sea has to move through two states *in order*, and the
  order isn't reversible — what you grow at one tide level is what you stand
  on at the next. A Reefseed pillar is a climbable step at LOW, a wall at MID,
  and submerged at HIGH; you can't plant one from the water, so the first
  thing every grove needs is somewhere dry to stand.
- **Boss:** Rootmaw, the Drowned Wood, `d5/0,3,1`.
- **Miniboss:** Thornvine, `d5/0,5,3`.

Intended route (24 rooms; the Reefseed at room 14):

`d5/0,3,7` entrance → `d5/0,3,6` landing → `d5/0,2,6` Silt Gallery (Dungeon
Map) / `d5/0,4,6` Bracken Cell (**Small Key 1**) → `d5/0,3,5` The Standing
Grove (locked, lock 1) → `d5/0,2,5` Chartstone Nave (Chartstone) →
`d5/0,1,5` Drowned Cloister (**Heart Piece 16**) → `d5/0,4,5` Thicket Cell
(**Gillcarve** charm) → `d5/0,5,5` Bower Cell → `d5/0,5,4` Coppice Cell →
`d5/0,4,4` Sunken Bracken (**Small Key 2**) → `d5/0,3,4` Rootbound Hall →
`d5/0,2,4` Warden's Sill (locked, lock 2) → `d5/0,1,4` **THE REEFSEED** →
`d5/0,1,3` The First Stake (grove 1) → `d5/0,2,3` The Bole Walk (grove 2) →
`d5/0,2,2` The Sunken Nave (grove 3, **Small Key 3**, in a chest) →
`d5/0,1,2` Silt Cell → `d5/0,3,3` Grove Crossing (locked, lock 3) →
`d5/0,4,3` The Long Ford (grove 4) → `d5/0,5,3` Thornvine (miniboss) →
`d5/0,4,2` The Shrine Ford (grove 5, two screens wide, Boss Key) →
`d5/0,3,2` boss door → `d5/0,3,1` **Rootmaw**.

### D6 — Abyssal Keep (`d6`)

- **Entrance:** `overworld/0,1,0`, the Abyssal approach. See the same
  progression-gap note as D4 — this screen is also gated by `F.MAGNETIC` /
  `F.HEAVY`, both opened only by the Dredge Line, which this dungeon is where
  you find it.
- **Item:** the **Dredge Line** (`dredge`), big chest, Dredge Vault
  `d6/0,4,3`.
- **Second item found here:** **Kelp-Soled Cleats L2** (the Mermaid Suit),
  Mermaid Vault `d6/1,4,4` — unlimited breath in sink mode and underwater
  block-pushing.
- **Tide theme:** the only dungeon in the game that wants the water put
  *back on* something. A crossing needs a pit uncovered by the sea (a drowned
  shelf you can only stand on at LOW, or a submerged lintel post you can only
  cast at once HIGH covers it); a cache needs the opposite — the floor gives
  up a silted chest only while the sea is over it.
- **Boss:** Nereth, the Drowned King, `d6/1,3,1`.
- **Miniboss:** Tideshade, Tideshade Hall `d6/1,4,5`.

Intended route (26 rooms, two floors; the Dredge Line at room 13):

`d6/0,3,7` entrance → `d6/0,3,6` landing → `d6/0,2,6` Map Crypt (Dungeon Map) /
`d6/0,4,6` Bone Cell (**Small Key 1**) → `d6/0,3,5` Drowned Hall (hub) →
`d6/0,2,5` Chartstone Crypt (Chartstone) / `d6/0,4,5` Drain Court (**Small Key
2**) → `d6/0,3,4` Three Heights (locked, lock 1) → `d6/0,2,4` West Crypt (a
**fairy**) / `d6/0,4,4` Black Kiln (**Small Key 3**) → `d6/0,3,3` Keep Lock
(locked, lock 2) → `d6/0,4,3` **THE DREDGE LINE** → `d6/0,5,3` The Slack Water
(**Heart Piece 17**, buried; teaches the dredge without needing anything from
it) → `d6/0,2,3` stair up →

Upper floor: `d6/1,3,5` Upper Keep → `d6/1,2,5` Shade Cell → `d6/1,2,4`
Colonnade of the Drowned (**Coilrope** charm — the Dredge Line reaches one
tile further) → `d6/1,4,5` Tideshade Hall (miniboss) → `d6/1,4,4` **THE
MERMAID VAULT** (Kelp-Soled Cleats L2) → `d6/1,3,4` The Drowned Stand →
`d6/1,3,3` Keep Crossing → `d6/1,2,3` The Sunken Bar (locked, lock 3;
**Heart Piece 18**, buried) → `d6/1,4,3` The Drowned Sill (**Small Key 4**) →
`d6/1,3,2` (locked, lock 4) → `d6/1,4,2` The Crossed Shafts (Boss Key, in a
chest guarded by the relocated Brinehulk enemy — see Appendix C) →
`d6/1,3,1` boss door → **Nereth**.

---

## Part 3 — Every Heart Piece

`src/data/` holds **18** Heart Piece placements, not 19 — found by scanning
every `{ kind: 'heartPiece' }` pickup, every `buried: [...]` entry, and one
puzzle-reward spawn across `src/data/dungeons-a.js`, `dungeons-b.js`,
`overworld.js` and `caves.js`. (`src/data/audio.js` also defines a jingle
named `heartPiece` — that is a sound cue, not a pickup, and does not count.)
Eighteen pieces is four heart containers and two spare quarter-hearts of
health, on top of 3 starting hearts and six dungeon Heart Containers (one per
boss, spawned from each boss room's `onEvent('bossDead')`) — see
Disagreements for how this compares to `docs/GAME-PLAN.md`'s claim.

Numbered in roughly the order a player following the main route would meet
them:

1. **Heart Piece 1** — `d1/0,4,3` The Two Gauges, Tidewash Grotto (D1). Past
   the second Anchor gauge-gate, east wing.
2. **Heart Piece 2** — `d2/1,4,5` Glass Cell, Coral Spire (D2). Behind the
   Brineglass Lens fork; the room's enemies are phased and only hittable with
   the Lens up.
3. **Heart Piece 3** — `d3/0,2,1` Vestry Roof, Bogwater Sanctum (D3). North of
   the Boss Key room.
4. **Heart Piece 4** — `d3/0,4,4` Reed Cell, Bogwater Sanctum (D3). A puzzle
   reward (`puzzle.reward.spawn`): clear the room's enemies and it rises out
   of the reeds.
5. **Heart Piece 5** — `d4/0,4,5` Rung Gallery, Cliffside Cistern (D4).
6. **Heart Piece 6** — `d5/0,1,5` Drowned Cloister, Drowned Wood Shrine (D5).
7. **Heart Piece 7** — `d6/0,5,3` The Slack Water, Abyssal Keep (D6). Buried;
   needs the Dredge Line to dredge it up (it's east of the Dredge Vault, so
   you'll have the item already).
8. **Heart Piece 8** — `d6/1,2,3` The Sunken Bar, Abyssal Keep (D6). Buried,
   upper floor, behind lock 3.
9. **Heart Piece 9** — `overworld/0,0,0` Drowned Shore, the Abyssal approach.
   Buried — the Dredge Line reads the same `buried` list on the overworld as
   underground, so this is late-game.
10. **Heart Piece 10** — `overworld/0,3,0` Rustfall, the Abyssal approach.
    Sitting in the open.
11. **Heart Piece 11** — `overworld/0,5,0` Salt Terraces, Salt Pans. Sitting
    in the open — needs the Resonance Rod (the Salt Pans' gate item) to reach.
12. **Heart Piece 12** — `overworld/0,9,0` Palace Wall, Reef Palace approach.
13. **Heart Piece 13** — `overworld/0,2,3` Kell Ledges, Cliffs of Kell.
14. **Heart Piece 14** — `overworld/0,6,4` Log Drift, Drowned Wood.
15. **Heart Piece 15** — `overworld/0,11,4` Outer Coral, Coral Reef.
16. **Heart Piece 16** — `overworld/0,10,8` Shell Flats, the Shallows.
17. **Heart Piece 17** — `overworld/0,1,9` Witchs Hollow, Sunken Marsh.
    Buried, needs the Dredge Line.
18. **Heart Piece 18** — `cave4/0,0,0` Palace Porch. The ruined Reef Palace
    mouth on the overworld (`overworld/0,10,1`) — one room, sitting in the
    open next to the notice that the rest of the Palace is under water.

---

## Part 4 — The trading sequence

**There isn't one, currently.** `src/data/story.js` defines exactly one
trade-sidequest cutscene, `tradeKettle` — flavor text about a kettle full of
seawater ("Someone further along the coast will want it more than you do")
— and it is not referenced from any NPC, item, dialogue trigger or map entity
anywhere in `src/`. The three trade-sidequest dialogue lines in
`src/data/story.js` (`tradeStart`, `tradeMid`, `tradeEnd`) are similarly
unreferenced by any entity. There is no chain of NPCs to walk, no sequence of
items to hand off, and nothing that gates on completing one.

The two `giver` entities that actually exist in the game are single-step, not
a chain:

- **The Maku Tree** (`overworld/houseMaku`, `0,0,0`) hands over the
  **Resonance Rod** (`rod`) once you have 1 Essence, and the **Master Sword**
  (`sword` level 3) once you have 5 — see the intro cutscene chain
  `makuWait` → `makuTree`/`makuSatchel` → `makuAfter` → `makuMaster` in
  `src/data/story.js`.
- **The village digger** (`overworld/0,4,7`, Tidewatch Village square) hands
  over the **Ferryman's Coin** (`coin`) once you have 3 Essences — dialogue
  chain `diggerWait` → `digger` → `diggerAfter`.

Neither is a trade — both are essence-gated gifts from a fixed NPC, with no
item changing hands in exchange. See Disagreements for what `docs/ITEMS.md`
and `docs/GAME-PLAN.md` each claim instead.

---

## Part 5 — Optional items, caves and secrets

Everything here sits off the six-dungeon critical path.

- **`cave1`, Bluff Grotto** (`overworld/0,3,7` → warp) — a chest with 30
  rupees. Nothing else in the room.
- **`cave2`, Reef Hollow** (`overworld/0,6,7` → warp) — a rupee pickup and a
  carved hint about low tide exposing new ground. No item gate.
- **`cave3`, Salt Pan Vault** (`overworld/0,6,1` → warp) — the ruined mouth
  the pre-consolidation Salt Pans dungeon left behind. Holds the **Bottled
  Tide case** (`bottle` level 1, big chest) — the item that lets you carry
  Bottled Tide charges at all; refills are bought at the Tidewatch Village
  shop for 40 rupees once you own the case. Behind the Salt Pans' Resonance
  Rod gate.
- **`cave4`, Palace Porch** (`overworld/0,10,1` → warp) — the ruined mouth the
  pre-consolidation Reef Palace dungeon left behind. Holds **Heart Piece 18**
  and a notice that "the rest of it is under. Do not go and look." Behind the
  same Resonance Rod gate (it covers the Reef Palace approach too, since the
  Palace's old item is now inside D6).
- **The Tidewatch Village shop** (`overworld/houseShop`) sells: Shield L1 (30
  rupees, one-time), a 4-pack of Bombs (20), a Heart refill (10), a Bottled
  Tide refill (40, needs the case from `cave3` first), and the **Ballast
  Heart** charm (80 rupees, one-time — halves knockback taken).
- **9 of the 18 Heart Pieces sit on the open overworld**, listed in Part 3;
  none of them are on any dungeon's critical path.
- **Two overworld Heart Pieces and both of D6's are `buried`**, meaning they
  need the Dredge Line to dig up, on land exactly as underwater — the Dredge
  Line's `use()` reads the same `buried` list the old shovel design used to
  (`src/game/items.js`, and the comment on `overworld.js` line 76).

---

## Part 6 — Scrimshaw: every charm

Charms are carved bone, slotted **by tide level**, not worn all the time —
you carry three loadouts (LOW/MID/HIGH cases), and a charm in one case is
dead while the water is at a different level. `src/game/scrimshaw.js` is the
live system; the roster below is `CHARMS` read directly out of it. Thirty
charms exist; `tools/check-charms.mjs` proves every one is read somewhere in
the engine (no orphans).

**How you get them.** The scrimshander (Tidewatch Village square) carves a
**blank** into a charm. Which charm you get is rolled, off the deterministic
RNG stream, from every charm you don't already own — you can't choose. Seven
charms are placed by hand, in a chest, matched to a case the player already
has open at that point in the game (see each dungeon's writeup in Part 2 for
where):

| Charm | Slot | Source |
|---|---|---|
| `splitFang` (Split Fang — wider sword arc) | MID | D1, Weeping Wall |
| `barnacleSkin` (one free hit per room) | MID | D2, Cistern Cell |
| `wreckersEye` (chests and buried things glimmer) | LOW | D3, Bell Cell |
| `bosunsWhistle` (the conch sounds faster) | MID | D4, Cliffside Cell |
| `gillcarve` (unlimited seafloor breath) | HIGH | D5, Thicket Cell |
| `coilrope` (Dredge Line reaches one tile further) | MID | D6, Colonnade of the Drowned |
| `ballastHeart` (halved knockback) | MID | Tidewatch Village shop, 80 rupees |

Blanks — the raw, uncarved bone — are found as ordinary pickups in three
dungeons: `d1/0,2,6` Bone Cell, `d2/0,2,6` Bone Cell, `d3/0,4,6` Bell Cell.

**Case unlocks**, tracked by total Essences owned, not by talking to the
scrimshander (`openCharmCases` in `scrimshaw.js`):

| Essences | What opens |
|---|---|
| 2 | The LOW case |
| 4 | The HIGH case |
| 6 | Every case now holds two charms instead of one |

The full roster:

**LOW case** (dry ground, exposed floor): `dunerunner` (sand/salt no longer
slow you), `wreckersEye` (chests and buried secrets glimmer), `saltEtched`
(+1 sword damage while any part of the room is dry), `beachcomber` (double
rupee drops), `strandwalker` (slow regen on dry ground), `dryKindling`
(bombs blast wider), `gullsTally` (dropped pickups last twice as long),
`chandlersEye` (shops charge a quarter less).

**MID case** (general): `splitFang` (wider sword arc), `ballastHeart` (half
knockback), `barnacleSkin` (one free hit per room), `quartermaster` (+2
Reefseed capacity), `lamplighter` (dark rooms less dark), `bosunsWhistle`
(conch sounds faster), `potHauler` (carrying no longer slows you), `coilrope`
(Dredge Line +1 tile).

**HIGH case** (submerged): `gillcarve` (unlimited seafloor breath),
`riptideFin` (swim 50% faster), `anemonesGift` (half contact damage from sea
creatures), `drownedLantern` (dark rooms less dark), `pressureScar` (dive/
surface twice as fast), `kelpBraid` (currents push half as hard), `brineSkin`
(half damage from spikes/lava/hazards), `ballastLung` (draw the sword on the
seafloor).

**Any case** (cross-slot): `wrackbone` (double sword damage, double damage
taken), `neapCharm` (charms linger 3 seconds after the tide leaves them),
`fishermansRegret` (the case one level below the tide stays awake too),
`deadweight` (immune to currents, slower everywhere), `hagstone` (1 hit in 4
passes through you), `seawolfsTooth` (double knockback dealt).

---

## Part 7 — Appendix

### A. Items and their three verbs

Every item in the live registry (`src/game/items.js`, `ITEMS`), with the
verbs from `docs/ITEMS.md` cross-checked against the actual `use()`
implementation.

| Item | id | Source | Movement | Combat | Puzzle |
|---|---|---|---|---|---|
| Sword | `sword` | Intro cutscene (L1); Maku Tree at 5 Essences (L3 — **L2 is never granted**, see Disagreements) | — | The base weapon | — |
| Shield | `shield` | Village shop, 30 rupees | — | Blocks frontal shots | — |
| Moon Conch | `conch` | Intro cutscene | Opens/closes routes as the tide moves | — | Cycles the tide field |
| Bombs | `bombs` | D2, Bomb Vault | Blasts cracked cliffs (the Marsh gate) | Damages enemies and bosses in a radius | Opens `F.BOMBABLE` walls |
| Tidewright's Anchor | `anchor` | D1, the Sluicegate | Freeze a sandbar underfoot while the room floods | Chain sweeps on throw and recall | Choose *where* the tide holds, not just *when* |
| Brineglass Lens | `lens` | D2, Sealed Cell | *(deliberately absent — see docs/ITEMS.md)* | Phase-shifted enemies become hittable while held | Preview the next tide level's terrain before committing |
| Kelp-Soled Cleats | `cleats` | D3 (L1), D6 Mermaid Vault (L2) | Swim the surface or sink and walk the floor — two route layers per deep room | Sink mode takes no knockback, ignores currents | Carry heavy things along the floor under surface-only barriers |
| Squall Bellows | `bellows` | D4, Bellows Vault | Drives a raft; shoves floating platforms | Pushes light enemies into hazards | Spins wheels; holds the tide back one level in a held cone |
| Reefseed | `reefseed` | D5, Reefseed Vault | A LOW pillar is a climbable step | Wall off a charging enemy; grow one under a flier | What it becomes depends on the tide *when it finishes growing*, not when thrown |
| Dredge Line | `dredge` | D6, Dredge Vault | A fixed snag pulls you across a pit | Drags an aquatic enemy onto land, helpless | The seafloor (and buried land) is searchable |
| Resonance Rod | `rod` | Maku Tree, 1 Essence | Retracts grates | Locks armoured enemies rigid ~90 frames | Rings all metal/crystal at once; range doubles at HIGH tide |
| Ferryman's Coin | `coin` | Village digger, 3 Essences | Teleport-swap with the thrown coin, priced in one tide change | An escape from a corner or a boss re-entry | Get the coin somewhere you can't walk, then change the tide |
| Chartstone | `chartstone` | One per dungeon | — | — | Marks which rooms change, and at which tide level (map item, not equipped) |
| Bottled Tide | `bottle` | Case: `cave3`; refills: shop, 40 rupees | Opens a route in a `noTide` room | Changes a boss arena mid-fight, at the cost of a bottle | The single tide step is the resource |
| Dungeon Map | `map` | One per dungeon | — | — | Reveals the dungeon layout (passive) |

### B. Enemies

Every enemy type registered in `src/data/enemies.js`, with the one-line note
from its own source comment:

| id | Note |
|---|---|
| `octorok` | Wanders and spits rocks along its facing axis. |
| `octorokSea` | The aquatic cousin — only present at higher tides. |
| `crab` | Scuttles sideways; shielded from the front, so approach from the side or back. |
| `zol` | A slime that splits when struck. |
| `gel` | The small slime `zol` splits into. |
| `keese` | Erratic flier; ignores terrain. |
| `leever` | Burrows and surfaces near you. |
| `bubble` | Invulnerable drifting hazard — go around it. |
| `beamos` | Static; fires when you're in line with it. |
| `beetle` | Charges in straight lines. |
| `tektite` | Hops at you across water. |
| `wisp` | Circles a point and shoots rings. |
| `urchin` | Harmless until the tide covers it, then it drifts. |
| `moblin` | Throws spears; retreats when you close the distance. |
| `stalfos` | Skittish skeleton — hops away from your sword. |
| `darknut` | Armoured knight; only vulnerable from behind. |
| `wizzrobe` | Blinks in, fires, blinks out. |
| `anglerfry` | Hangs in deep water; lunges when you swim near. |
| `barnacle` | Fixed in place; opens to spit, shielded while shut. |
| `jellyfish` | Drifts with the tide; stings on contact. |
| `siren` | Surfaces to sing a shot at you, submerges to dodge. |
| `pincer` | An eel head on a tether, lunging out of its burrow. |

Bosses and minibosses use the same `defineBoss` machinery but clear `isBoss`
on init, so a miniboss kill doesn't flag the whole dungeon beaten
(`src/data/bosses.js`). Registered but **not currently placed on any map**
after the six-dungeon consolidation: `thalassor` (boss), `saltwraith` and
`gustharpy` (minibosses) — see `docs/DUNGEON-STATUS.md`. `brinehulk` was
repurposed rather than cut: it now guards the Boss Key in D6's Crossed Shafts
(`d6/1,4,2`) as a placed enemy rather than a dungeon boss.

| Boss | id | HP | Dungeon | Tide hook |
|---|---|---|---|---|
| Gohmaraq, the Tidewash Claw | `gohmaraq` | 24 | D1 | Drains the grotto (LOW); its shell holds the eye open longer when open at LOW. |
| Anemos, the Crowned Column | `anemos` | 30 | D2 | Rooted; unfurls to feed for 4x as long at HIGH as at LOW — the tide sets how long it's hittable. |
| Gloomtide, the Bogwater Maw | `gloomtide` | 36 | D3 | Rides the sanctum's current, which only runs at MID, and keeps shoving the tide back to MID. |
| Wyverna, the Sea Wyvern | `wyverna` | 44 | D4 | Flies at HIGH; beached and permanently open on the floor at LOW. Refloods the cistern on a timer. |
| Rootmaw, the Drowned Wood | `rootmaw` | 52 | D5 | Drinks and heals at HIGH; roots bare and soft at LOW. |
| Nereth, the Drowned King | `nereth` | 80 | D6 | Pins the tide to one level per phase and is sealed while it holds; break the pin (or catch the opening after his own attacks) to hurt him. Phase 4 drops the pin — he cycles the tide himself. |

| Miniboss | id | HP | Dungeon |
|---|---|---|---|
| Clawcrab | `clawcrab` | 14 | D1 |
| Reefguard | `reefguard` | 16 | D2 |
| Bogmaw | `bogmaw` | 15 | D3 |
| Ironknight | `ironknight` | 18 | D4 |
| Thornvine | `thornvine` | 16 | D5 |
| Tideshade | `tideshade` | 20 | D6 |

### C. Regions and their gates

Read from `tools/check-overworld.mjs`'s live `GATES` table, which is proved
in both directions (sealed without the item, open with it) by that tool, and
in-engine with a live player by `node tools/check-gates.mjs` for three of the
four:

| Region | Gate flag | Opened by | Proof |
|---|---|---|---|
| Sunken Marsh (D3) | `F.BOMBABLE` (`cliffCracked`, both entrances) | `bombs` | `check-overworld.mjs`, `check-gates.mjs` |
| Salt Pans (and the Reef Palace approach behind it) | `F.VANE` (`saltVane`) | `rod` (Resonance Rod) — the only gate in the game whose key is the tide mechanic itself; its range doubles at HIGH | `check-overworld.mjs`, `check-gates.mjs` |
| Abyssal approach (D6) | `F.MAGNETIC` (the old `abyssPlug`) | `dredge` (Dredge Line) | `check-overworld.mjs` |
| Cliffs of Kell (D4), plus the rest of the Abyssal approach and part of the Marsh | `F.HEAVY` (a boulder) | `dredge` (Dredge Line) | `check-overworld.mjs`, `check-gates.mjs` |
| Coral Reef (D2) | *(none)* | — | The old Roc's Feather gate was removed; the hop is base moveset and a one-tile chasm no longer stops anyone. |
| Drowned Wood (D5) | *(none, by tile flag)* | — | Enforced by level design only, per `docs/ITEMS.md`. |

---

## Disagreements between docs and data

Everywhere `docs/GAME-PLAN.md` or `docs/ITEMS.md` says something the live
data in `src/data/` (and `src/game/`) contradicts or doesn't support, this
guide followed the data. Listed here in full, because CLAUDE.md calls this
out as close to the point of the exercise.

1. **Six dungeons, not eight — with different items, bosses and tide themes
   for four of the six.** `docs/GAME-PLAN.md`'s dungeon table (D1–D8) lists
   items `feather`/`bombs`/`bracelet`/`flippers`/`boomerang`/`hookshot`/
   `magnet`/`flippers L2`, bosses `gohmaraq`/`anemos`/`gloomtide`/`wyverna`/
   `rootmaw`/`brinehulk`/`thalassor`/`nereth`, and puts Nereth in D8. The
   live registry (`essenceCount() === 6`, `MAPS` holding exactly `d1`–`d6`
   as dungeons) matches `docs/ITEMS.md`'s roster instead: items `anchor`/
   `lens`/`cleats`/`bellows`/`reefseed`/`dredge`, and **Nereth is D6's
   boss**, not D8's. `docs/DUNGEON-STATUS.md` documents this as a deliberate,
   already-settled consolidation ("The six-versus-eight fold is done"); it's
   `docs/GAME-PLAN.md` that is stale, not the data.
2. **None of `feather`, `bracelet`, `flippers`, `boomerang`, `hookshot`,
   `magnet`, `shovel`, `slingshot` or `ringbox` exist as items.**
   `src/game/items.js`'s `ITEMS` registry holds exactly: `sword`, `shield`,
   `lens`, `conch`, `bellows`, `bottle`, `coin`, `rod`, `dredge`, `reefseed`,
   `bombs`, `cleats`, `anchor`, `map`, `chartstone` — the `docs/ITEMS.md`
   roster, not `docs/GAME-PLAN.md`'s. The hop and lifting are base moveset
   verbs, not items, matching `docs/ITEMS.md`'s "What is base moveset now"
   section.
3. **A progression gap the data actually has, that no document mentions.**
   `docs/GAME-PLAN.md` and `docs/DUNGEON-STATUS.md` both imply the six
   dungeons can be played in order. Run live: `node tools/check-overworld.mjs`
   with **no items held** floods only 59 of 120 screens, and neither D4's
   entrance (`overworld/0,1,3`) nor D6's (`overworld/0,1,0`) is reachable —
   both sit behind `F.HEAVY`/`F.MAGNETIC` tiles that only the `dredge` item
   opens (`src/world/tileset.js`: "boulder: only the Dredge Line drags it
   clear"). But the Dredge Line **is D6's own item**, found inside D6's
   Dredge Vault (`d6/0,4,3`) — so the only door into the dungeon that hands
   it over is gated by the thing it hands over. A `makuOpenedKeep` flag is
   set by the `makuMaster` cutscene (5 Essences) but nothing anywhere reads
   it, so it doesn't open an alternate route either. As currently gated on
   the overworld, D4 and D6 cannot be reached through the front door by any
   sequence of the other four dungeons' items. No existing checker catches
   this: `check-overworld.mjs` proves each gate opens with *its own* item in
   isolation, never that the item is obtainable before you need to cross the
   gate it opens, and `check-playthrough.mjs` (the only tool that plays
   rather than models) doesn't get far enough to hit it. This is a genuine
   finding from this session, not a restatement of anything in
   `docs/HANDOFF.md` or `docs/DUNGEON-STATUS.md`.
4. **18 Heart Pieces, not 19.** See Part 3. `HEART_UNITS = 4`, 3 starting
   hearts, six dungeon Heart Containers and 18 pieces put the practical
   maximum at 3 + 6 + 18/4 = **13.5 hearts**, not the "about 16 hearts" `docs/
   GAME-PLAN.md`'s "Health and difficulty" section claims for "eight Heart
   Containers plus heart pieces" (that line is also still counting eight
   dungeons).
5. **There is no trading sequence.** `docs/GAME-PLAN.md`'s item table lists
   `slingshot` as a "Trading sidequest" reward; `docs/ITEMS.md` calls the
   Resonance Rod a "Trading-sequence reward" in its item-7 prose, immediately
   above a "Where each item comes from" table that (correctly, per the data)
   says "The Maku Tree, one Essence." Neither a slingshot nor a multi-step
   trade chain exists anywhere in `src/`: the sole trade-flavoured cutscene,
   `tradeKettle`, and the three trade dialogue lines (`tradeStart`/
   `tradeMid`/`tradeEnd`) in `src/data/story.js` are not referenced by any
   entity. See Part 4.
6. **The sword never reaches level 2, and level 3 arrives after 5 Essences,
   not 8.** `docs/GAME-PLAN.md`'s item table lists `sword` L2 from "a secret
   cave, needs four Essences" and L3 from "Maku Tree, after all eight
   Essences." No sword-level-2 grant exists anywhere in `src/data/` — the
   only sword grants in the whole game are the intro's L1
   (`src/data/story.js`, `intro`) and the `makuMaster` cutscene's direct jump
   to L3, which fires off the Maku Tree's 5-Essence giver, not 8 (matching
   the six-dungeon essence count in finding 1).
7. **There is no shovel.** `docs/GAME-PLAN.md` lists `shovel` as an item
   from "Village digger, after two Essences." The village digger's `giver`
   entity (`overworld/0,4,7`) hands over the Ferryman's Coin (`coin`) at 3
   Essences, per `docs/ITEMS.md`'s own table — `docs/ITEMS.md`'s "Removed"
   section already documents that the shovel was folded into the Dredge
   Line's `buried` search, so this is `docs/GAME-PLAN.md` being stale rather
   than a new finding, but it's worth restating because `docs/GAME-PLAN.md`
   is still checked into the repo as "the single source of truth for content
   authoring" at the top of the file.
8. **Region gates no longer match `docs/GAME-PLAN.md`'s table** for three of
   five tile-expressible gates. Coral Reef's Roc's Feather gate is gone
   entirely (the hop absorbed it). Cliffs of Kell's Power Bracelet gate and
   the Abyssal approach's Magnetic Gloves gate are both now opened by the
   Dredge Line instead (see Appendix C) — `docs/ITEMS.md`'s "What the gates
   look like now" table already documents this change and is consistent with
   the data; `docs/GAME-PLAN.md`'s "Overworld layout" table is what's stale.
