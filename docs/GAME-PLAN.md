# Oracle of Tides — game plan

The single source of truth for content authoring. Every content pack must agree
with this document. If something here conflicts with your brief, this wins.

## Premise

Link washes ashore in **Thalassia**. **Nereth, the Drowned King** has shattered
the **Tide Bell** into eight **Essences of the Tide** and hidden them in the
drowned places of the land. Without the Bell the sea rises and falls at his whim.
**Farore, Oracle of Secrets**, gives Link the **Moon Conch** — a shard of the
Bell that lets him command the tide himself. The **Maku Tree** in Tidewatch
Village grows stronger with each Essence and finally opens the way to the
Abyssal Keep.

## The fundamental mechanic: the tide

A single global variable with three states, cycled LOW -> MID -> HIGH -> LOW by
the Moon Conch (A or B button).

| Level | Name | Effect |
|---|---|---|
| 0 | LOW | Sandbars and seafloor exposed. Sunken cave mouths open. Channels wadeable. Water wheels stop. |
| 1 | MID | The default world. |
| 2 | HIGH | Shallows become deep. Low walls submerge so you can swim over them. Rafts float up to high ledges. Some enemies only appear. |

In room text grids **digits 0-9 are always tide tiles**. See `src/data/legends.js`
for what each digit means. Every dungeon must use the tide in its puzzles, and
each one should lean on a different consequence of it (see the table below).

## Overworld layout

12 wide x 10 tall grid of screens, keys `'0,x,y'` (x 0-11 left to right,
y 0-9 top to bottom). Tidewatch Village is at `0,4,7`.

| Region | Grid area | Legend | Gate to enter |
|---|---|---|---|
| Tidewatch Coast (start, village) | x3-6, y7-9 | `coast` | — |
| The Shallows (dunes, D1) | x7-11, y6-9 | `dunes` | — |
| Coral Reef (D2) | x8-11, y4-6 | `coral` | Roc's Feather (`chasm`) |
| Sunken Marsh (D3) | x0-2, y6-9 | `marsh` | Bombs (`cliffCracked`) |
| Cliffs of Kell (D4) | x0-3, y2-5 | `cliffs` | Power Bracelet (`boulder`) |
| Drowned Wood (D5) | x4-7, y3-6 | `wood` | Zora's Flippers |
| Salt Pans (D6) | x4-7, y0-2 | `salt` | Magic Boomerang (`saltVane`) |
| Reef Palace approach (D7) | x8-11, y0-3 | `reef` | Hookshot |
| Abyssal approach (D8) | x0-3, y0-1 | `abyss` | Magnetic Gloves (`abyssPlug`) |

Every screen in the 12x10 grid must exist so the overworld never has holes.

**Five** of these gates are expressed as a tile carrying a flag, named in the
table above, and `node tools/check-overworld.mjs` proves each one in both
directions — sealed without the item, open with it, and sealing nothing outside
its own branch. Four of the five are also proved in-engine with a live player
and the real item by `node tools/check-gates.mjs`.

The remaining two — **Zora's Flippers** (Drowned Wood) and the **Hookshot**
(Reef Palace) — are enforced by level design only. Both were implemented as
tiles and reverted: the Wood is the map's central thoroughfare and gating it
seals 68 of 120 screens, and a Hookshot span wide enough to stop Roc's Feather
puts the post it must latch beyond the level-1 Hookshot's 64px reach. The
measurements behind both are in `docs/HANDOFF.md` under "The two gates that
cannot be tiles"; neither is a placement problem.

Note the Salt Pans gate also holds the Reef Palace shut, since the Palace's
Hookshot is in D6 inside the Pans.

## Dungeons

| # | Map id | Name | Region | Overworld entrance screen | Item | Boss | Miniboss | Tide theme |
|---|---|---|---|---|---|---|---|---|
| 1 | `d1` | Tidewash Grotto | Shallows | `0,8,8` | `feather` L1 | `gohmaraq` | `clawcrab` | Draining a flooded floor to walk it |
| 2 | `d2` | Coral Spire | Coral Reef | `0,10,5` | `bombs` | `anemos` | `reefguard` | Rising water lifts you between floors |
| 3 | `d3` | Bogwater Sanctum | Marsh | `0,1,8` | `bracelet` L1 | `gloomtide` | `bogmaw` | Currents that only run at one level |
| 4 | `d4` | Cliffside Cistern | Cliffs of Kell | `0,1,3` | `flippers` L1 | `wyverna` | `ironknight` | Swimming over submerged walls |
| 5 | `d5` | Drowned Wood Shrine | Drowned Wood | `0,5,4` | `boomerang` L2 | `rootmaw` | `thornvine` | Floating platforms and drifting logs |
| 6 | `d6` | Salt Pan Vault | Salt Pans | `0,6,1` | `hookshot` L1 | `brinehulk` | `saltwraith` | Water douses fire; low tide relights it |
| 7 | `d7` | Reef Palace | Reef Palace | `0,10,1` | `magnet` L1 | `thalassor` | `gustharpy` | Whirlpools and one-way currents |
| 8 | `d8` | Abyssal Keep | Abyssal approach | `0,1,0` | `flippers` L2 | `nereth` | `tideshade` | All three levels required in one room |

Each dungeon must contain:

- 18-30 rooms across 1-3 floors
- Dungeon Map and Compass pickups
- 2-4 Small Keys and locked doors (`L` in the legend), plus one Boss Key (`B` door)
- One miniboss room roughly two thirds through
- The dungeon item in a big chest before the boss
- A boss room with `noTide: true` unless the fight needs the tide
- One Heart Container: spawn it via the boss room's `script.onEvent` on
  `'bossDead'`, alongside the essence the engine spawns automatically
- Essence index equal to the dungeon number

## Item progression

| Item | Level | Source |
|---|---|---|
| `sword` | 1 | Intro cutscene |
| `conch` | 1 | Intro cutscene (Farore) |
| `shield` | 1 | Tidewatch Village shop, 30 rupees |
| `satchel` | 1 | Maku Tree, after the first Essence |
| `feather` | 1 | D1 |
| `bombs` | 1 | D2 |
| `bracelet` | 1 | D3 |
| `flippers` | 1 | D4 |
| `boomerang` | 2 | D5 |
| `hookshot` | 1 | D6 |
| `magnet` | 1 | D7 |
| `flippers` | 2 | D8 (Mermaid Suit) |
| `slingshot` | 1 | Trading sidequest |
| `shovel` | 1 | Village digger, after two Essences |
| `sword` | 2 | Secret cave, needs four Essences |
| `sword` | 3 | Maku Tree, after all eight Essences |
| `shield` | 2/3 | Shops and secrets |
| `ringbox` | 1 | Village |

## Health and difficulty

Health is in quarter-hearts, `HEART_UNITS = 4`. Link starts with 3 hearts (12
units). Eight Heart Containers plus heart pieces take him to about 16 hearts.

- Ordinary enemy contact: `damage: 2` (half a heart)
- Tougher enemy: `damage: 3`
- Boss contact: `damage: 4`
- Sword damage dealt: L1 `2`, L2 `4`, L3 `6`; spin attack adds 1
- Boss HP: D1 around 24, rising to about 80 for Nereth

## Names to use

Zelda names are used directly: Link, Zelda, Farore, the Maku Tree, Rupees, Heart
Containers, Octoroks, Moblins, Stalfos, Zol, Gel, Keese, Leever, Tektite,
Beamos, Darknut, Wizzrobe. Original to this game: Thalassia, Tidewatch Village,
Nereth the Drowned King, the Tide Bell, the Moon Conch, the Essences of the Tide,
and the eight boss names in the table above.

## Hard rules for every content pack

1. Room grids are **exactly 8 rows of exactly 10 characters**.
2. Only use legend characters that exist in the legend the room declares.
3. `node tools/validate.mjs` must exit 0.
4. Never edit engine files (`src/core`, `src/gfx`, `src/world`, `src/game`) or
   `src/data/index.js`. Only your own data file.
5. Rooms that connect must connect on both sides: if room A has walkable floor
   on its east edge and room B exists to the east, B needs walkable floor on its
   west edge at the same rows.
