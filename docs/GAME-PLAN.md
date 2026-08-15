# Oracle of Tides — game plan

The world's design: the premise, the region layout, the health economy, the
naming rules and the hard rules every content pack must satisfy. If something
here conflicts with your brief, this wins.

**WITH TWO EXCEPTIONS, both of which are newer than this file.** The ITEM
ROSTER is `docs/ITEMS.md` — CLAUDE.md says so and `tools/check-items.mjs`
asserts the registry is exactly that document's list. The DUNGEON BOARD is
`docs/DUNGEON-STATUS.md`. Where this file names an item or a dungeon count that
those two do not, they win and this file is behind; the P9 pass corrected the
places that were known to be.

## Premise

Link washes ashore in **Thalassia**. **Nereth, the Drowned King** has shattered
the **Tide Bell** into six **Essences of the Tide** and hidden them in the
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

**THIS TABLE IS THE STATE AFTER P9, not the original plan.** The plan named
eight dungeons and gated them on a Zelda item roster that no longer exists —
Roc's Feather, the Power Bracelet, Zora's Flippers, the Hookshot, the Magnetic
Gloves. The six-versus-eight fold removed two dungeons and P6 replaced the
roster with the tide items, so the gates were re-cut in P9. The old column is
kept beside the new one because a later session will otherwise wonder what
happened to it.

| Region | Grid area | Legend | Gate to enter | The plan originally said |
|---|---|---|---|---|
| Tidewatch Coast (start, village) | x3-6, y7-9 | `coast` | — | — |
| The Shallows (dunes, D1) | x7-11, y6-9 | `dunes` | — | — |
| Coral Reef (D2) | x8-11, y4-6 | `coral` | — (the hop is base moveset) | Roc's Feather (`chasm`) |
| Sunken Marsh (D3) | x0-2, y6-9 | `marsh` | **Bombs**, from D2 (`cliffCracked`) | Bombs — unchanged |
| Cliffs of Kell (D4) | x0-3, y2-5 | `cliffs` | **Kelp-Soled Cleats**, from D3 (`tideChannel`) | Power Bracelet (`boulder`) |
| Drowned Wood (D5) | x4-7, y3-6 | `wood` | **Kelp-Soled Cleats**, from D3 (`tideChannel`) | Zora's Flippers |
| Salt Pans (now a one-room ruin) | x4-7, y0-2 | `salt` | **Resonance Rod** (`saltVane`) | Magic Boomerang |
| Reef Palace (now a one-room ruin) | x8-11, y0-3 | `reef` | — | Hookshot |
| Abyssal approach (D6, the Keep) | x0-3, y0-1 | `abyss` | **five Essences** (`abyssSeal`) — no item at all | Magnetic Gloves (`abyssPlug`) |

The tiers that table implies — nothing, Bombs, Cleats, Essences — are proved
screen by screen by `tools/check-progression.mjs`, which exists because before
P9 the Cliffs and the Abyssal approach were BOTH held by the Dredge Line, the
item the Abyssal Keep hands over. The game could not be finished.

Every screen in the 12x10 grid must exist so the overworld never has holes.

### Settlements

| Where | Screen | What is there |
|---|---|---|
| Tidewatch Village | `0,4,7` | The square: the shop, a house you can enter, the Maku Tree's hollow in the treeline, the scrimshander |
| Village Shore | `0,4,8` | The waterfront below it: the net-mender's cottage, the well, the tide pool |
| Driftwood Strand | `0,5,8` | The village's timber yard — the chopping stump and a paling fence. No doors |
| Sandpiper Row | `0,9,8` | The Shallows' fishing hamlet: one cottage open, one shuttered |

Sandpiper Row is new with PT and is the only settlement outside the starting
coast. Every one of them is proved by `node tools/check-towns.mjs`; a screen
that uses a town legend and is not in that tool's TOWNS list fails it.

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

**SUPERSEDED BY `docs/ITEMS.md`, WHICH IS THE AUTHORITY.** The table that used
to sit here was the pre-P6 Zelda roster — feather, bracelet, flippers,
boomerang, hookshot, magnet — and none of those items exists. CLAUDE.md makes
`docs/ITEMS.md` the roster of record and `tools/check-items.mjs` asserts the
registry is exactly that document's list. What is actually in the game:

| Item | Level | Source |
|---|---|---|
| `sword` | 1 | Intro cutscene (Farore) |
| `conch` | 1 | Intro cutscene (Farore) — the Moon Conch, the tide itself |
| `shield` | 1 | Tidewatch Village shop, 30 rupees |
| `anchor` | 1 | D1 Tidewash Grotto — the Tidewright's Anchor |
| `lens` | 1 | D2 Coral Spire — the Brineglass Lens |
| `bombs` | 1 | D2 Coral Spire, the Bomb Vault (a side room, not the dungeon's item) |
| `cleats` | 1 | D3 Bogwater Sanctum — the Kelp-Soled Cleats |
| `bellows` | 1 | D4 Cliffside Cistern — the Squall Bellows |
| `reefseed` | 1 | D5 Drowned Wood Shrine |
| `dredge` | 1 | D6 Abyssal Keep — the Dredge Line |
| `cleats` | 2 | D6 Abyssal Keep, behind the miniboss (the Mermaid Suit's old slot) |
| `rod` | 1 | Maku Tree, after the first Essence — the Resonance Rod |
| `coin` | 1 | The village digger — the Ferryman's Coin |
| `bottle` | 1 | A cave chest — the Bottled Tide |
| `chartstone` | — | A chest in each of several dungeons |
| `map` | — | Dungeon chests |

**The five Essences gate is not an item.** The Abyssal approach opens on the
Essence count and nothing else; see "What the gates look like now" in
`docs/ITEMS.md`.

## Health and difficulty

Health is in quarter-hearts, `HEART_UNITS = 4`. Link starts with 3 hearts (12
units). **Six** Heart Containers, one per dungeon, plus 24 Pieces of Heart at
four to a container, take him to **15**. P9 re-tuned that: the piece count was
still the eight-dungeon number, eighteen, which is not a multiple of four — so
two of them bought nothing and the cap sat at 13. `check-progression.mjs`
asserts both the divisibility and the cap.

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
and the six boss names in the table above.

## Hard rules for every content pack

1. Room grids are **exactly 8 rows of exactly 10 characters**.
2. Only use legend characters that exist in the legend the room declares.
3. `node tools/validate.mjs` must exit 0.
4. Never edit engine files (`src/core`, `src/gfx`, `src/world`, `src/game`) or
   `src/data/index.js`. Only your own data file.
5. Rooms that connect must connect on both sides: if room A has walkable floor
   on its east edge and room B exists to the east, B needs walkable floor on its
   west edge at the same rows.
