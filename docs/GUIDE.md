# Oracle of Tides — Complete Walkthrough

A full, spoiler-inclusive walkthrough of *The Legend of Zelda: Oracle of Tides*,
written in the style of a printed game guide: a straight line from the title
screen to the Drowned King, with every dungeon walked room by room, every boss
given a pattern-by-pattern strategy, and every optional thing in the world —
24 Heart Pieces, 6 Heart Containers, the eleven-link Coastwise Chain, the four
caves, the charm cases, the two extra sword tiers — listed where you will
actually pass it, and again in a checklist at the back.

**Everything here is read out of the game's own data** (`src/data/`,
`src/game/`) as it exists in this build, not out of the design documents. Room
keys are given the way the engine names them — `mapId/floor,x,y`, x running
east and y running south, so `overworld/0,4,7` is Tidewatch Village and
`d1/0,3,2` is the Sluicegate. Inside a room, tile coordinates are `(x, y)` with
x running 0–9 left to right and y running 0–7 top to bottom. Anything in this
guide can be cross-checked against the source with those keys, and
`node tools/check-guide.mjs` proves every one of them resolves.

**On a phone?** `docs/GUIDE.html` is the same guide built for a small screen —
sticky chapter bar, a contents drawer, and tickable checklists for the 24 Heart
Pieces, the Coastwise Chain and the hand-placed charms that remember what you
have collected. Open it from a `file://` URL or publish it; it needs no server.

**Spoilers.** Part I is safe. Everything from Part II on describes dungeon
layouts, item locations, puzzle solutions and boss patterns in full.

---

## Table of contents

**Part I — Before you start**
- [Controls](#controls)
- [The tide, and why it is not a switch](#the-tide-and-why-it-is-not-a-switch)
- [Health, damage and money](#health-damage-and-money)
- [Charms, in one paragraph](#charms-in-one-paragraph)
- [The route at a glance](#the-route-at-a-glance)

**Part II — The walkthrough**
1. [Tidewatch Village](#1-tidewatch-village)
2. [The Shallows, and the road to the Grotto](#2-the-shallows-and-the-road-to-the-grotto)
3. [Dungeon 1: Tidewash Grotto](#3-dungeon-1-tidewash-grotto)
4. [Interlude: the Maku Tree, the shop, the Chain begins](#4-interlude-the-maku-tree-the-shop-the-chain-begins)
5. [The Coral Reef](#5-the-coral-reef)
6. [Dungeon 2: Coral Spire](#6-dungeon-2-coral-spire)
7. [Interlude: bombs open two regions](#7-interlude-bombs-open-two-regions)
8. [Dungeon 3: Bogwater Sanctum](#8-dungeon-3-bogwater-sanctum)
9. [The Cliffs of Kell](#9-the-cliffs-of-kell)
10. [Dungeon 4: Cliffside Cistern](#10-dungeon-4-cliffside-cistern)
11. [The Drowned Wood](#11-the-drowned-wood)
12. [Dungeon 5: Drowned Wood Shrine](#12-dungeon-5-drowned-wood-shrine)
13. [Interlude: the Coastwise Chain, end to end](#13-interlude-the-coastwise-chain-end-to-end)
14. [The Salt Pans and the Reef Palace](#14-the-salt-pans-and-the-reef-palace)
15. [The Maku Tree opens the road](#15-the-maku-tree-opens-the-road)
16. [Dungeon 6: the Abyssal Keep](#16-dungeon-6-the-abyssal-keep)
17. [Nereth, the Drowned King](#17-nereth-the-drowned-king)
18. [Mopping up: the Abyssal approach](#18-mopping-up-the-abyssal-approach)

**Part III — 100% completion**
- [All 24 Heart Pieces](#all-24-heart-pieces)
- [The Coastwise Chain](#the-coastwise-chain)
- [Every item, and where it is](#every-item-and-where-it-is)
- [Charms and the scrimshander](#charms-and-the-scrimshander)
- [Caves, shops and secrets](#caves-shops-and-secrets)
- [Region gates](#region-gates)

**Part IV — Appendices**
- [Enemy list](#enemy-list)
- [Boss and miniboss list](#boss-and-miniboss-list)
- [Tide tile reference](#tide-tile-reference)
- [How this guide was verified, and what it cannot promise](#how-this-guide-was-verified-and-what-it-cannot-promise)

---

# Part I — Before you start

## Controls

| Input | Does |
|---|---|
| Arrow keys / D-pad | Move. Diagonals are **faster** than cardinals — that is deliberate. |
| `X` or `K` | **A** button |
| `Z` or `J` | **B** button |
| `Enter` | Start — pause menu, item screen, quest screen |
| `Shift` or `Tab` | Select — save and quit |

A and B are **assignable slots**, not fixed roles. Whatever you pick up first
goes to B, the second to A, and you rearrange them from the pause menu. A fresh
game therefore starts with the Moon Conch on B and the sword on A.

Two verbs are not items and never will be:

- **The hop.** Walk into a one-tile gap and Link hops it automatically. There is
  no feather in this game; a one-tile chasm stops nobody. A gap two tiles wide
  or more is a wall.
- **Lifting.** On the A button, context-first. Standing next to a pot with an
  item bound to A means the pot comes up rather than the item firing — the same
  way talking to a villager overrides A.

## The tide, and why it is not a switch

Sound the Moon Conch (`conch`) and the tide cycles **LOW → MID → HIGH → LOW**.
Two presses reach any level from any other. That is the whole interface, and
almost everything else in the game is about the fact that the tide is a
**field**, not a global:

- The base level is what the conch sets and what the HUD gauge shows.
- The level that actually matters is **the one under whatever you are asking
  about** — your own feet, an enemy's feet, a tile's. Once you own the
  Tidewright's Anchor (`anchor`) you can hold one patch of a room at the level
  it had while the rest of the room moves. Everything in the game reads the
  field, including your charms.

| Level | What the world does |
|---|---|
| **LOW** | Sandbars, reef flats and seafloor exposed; sunken cave mouths open; channels wadeable; drains become open pits; water wheels stop. |
| **MID** | The default. Wells are over your head, sluices are ankle deep. |
| **HIGH** | Shallows become deep water; low walls drown and can be swum over; rafts float up to high ledges; drowned boles vanish. |

In a room's text grid the digits **0–9 are always tide tiles**. Anything that is
not a digit does not move with the water. This is why a screen's tide behaviour
is readable at a glance, and it is a rule with no exceptions anywhere in the
game.

## Health, damage and money

You start with **3 hearts**. Health is counted in quarter-hearts, four to a
heart. The damage ladder is fixed and every enemy sits on a rung of it:

| Tier | Damage | At 3 hearts |
|---|---|---|
| Chip (2 types) | ¼ heart | 12 hits |
| Ordinary (13 types) | ½ heart | 6 hits |
| Heavy (7 types) | ¾ heart | 4 hits |
| Miniboss (8) | ¾ heart | 4 hits |
| Boss (8) | 1 heart | 3 hits |

There are **24 Heart Pieces** in the world, four to a container, and **six Heart
Containers** — one per dungeon boss. Collect everything and you finish on **15
hearts**.

Rupees come from enemies, grass, pots, chests and the four `rupee20` caches on
the overworld. You need, at minimum: 30 for the shield, 60 per carving at the
scrimshander, 80 for the Ballast Heart charm, 20 a time for bombs and 40 for a
Bottled Tide refill.

## Charms, in one paragraph

Charms are carved bone, and they are slotted **by tide level**. You carry three
cases — LOW, MID and HIGH — and a charm only works while the water under your
feet is at its case's level. You start with the MID case only. The LOW case cuts
itself at **2 Essences**, the HIGH case at **4**, and at **6** every case holds
two charms instead of one. Seven charms are placed by hand in the world; the
other twenty-three come from the scrimshander in Tidewatch, who takes a blank
and 60 rupees and gives you back whichever charm the bone wanted to be.

## The route at a glance

The dungeons are numbered 1–6 and the recommended order is the numbered one:
each boss is meaningfully harder than the last (24 → 30 → 36 → 44 → 52 → 80 HP)
and each dungeon's puzzle grammar assumes the last one's item.

Three things are worth knowing before you plan a route:

- **The Drowned Wood Shrine's door is open from the first minute.** Nothing
  gates it. You can walk in with three hearts and a wooden sword; Rootmaw has
  52 HP and will punish you for it.
- **Dungeons 3 and 4 both need bombs**, which come out of Dungeon 2. The Sunken
  Marsh has two entrances and both are cracked cliff; the Cliffs of Kell are
  behind a cracked boulder in the Deep Cut.
- **The shop will take your rupees for ammunition it cannot give you.** Bombs
  and Bottled Tide are both counted pickups that clamp to a capacity, and that
  capacity starts at zero. The shop refuses the sale outright until you own the
  bag (Dungeon 2's Bomb Vault) or the case (the Salt Pan Vault) — it says so
  rather than taking your money for nothing, but there is no point walking in
  early hoping to stock up.

| # | Dungeon | Where | Item | Boss |
|---|---|---|---|---|
| 1 | Tidewash Grotto | `overworld/0,8,8` | Tidewright's Anchor | `gohmaraq` |
| 2 | Coral Spire | `overworld/0,10,5` | Brineglass Lens (+ `bombs`) | `anemos` |
| 3 | Bogwater Sanctum | `overworld/0,1,8` | Kelp-Soled Cleats | `gloomtide` |
| 4 | Cliffside Cistern | `overworld/0,1,3` | Squall Bellows | `wyverna` |
| 5 | Drowned Wood Shrine | `overworld/0,5,4` | Reefseed | `rootmaw` |
| 6 | Abyssal Keep | `overworld/0,1,0` | Dredge Line (+ Mermaid Suit) | `nereth` |

---

# Part II — The walkthrough

## 1. Tidewatch Village

The `intro` cutscene puts you on the shore in Tidewatch Village
(`overworld/0,4,7`). Farore, the Oracle of Secrets, explains that Nereth the
Drowned King has broken the Tide Bell into six Essences and hidden them in the
drowned places of Thalassia, hands you the **Moon Conch** — a shard of the Bell
itself — and then the **Wooden Sword**, and tells you to go east to the
Shallows.

Do not go east yet. The village is four buildings and a square and there is a
lot in it.

**The square** (`overworld/0,4,7`). Three doors and two people who matter:

- **The Maku Tree** — the door at the top of the screen, tile (4,1), leading to
  `houseMaku/0,0,0`. She is asleep. She will say `makuWait`: bring one Essence
  and something of the Bell's. Farore is in here too, at (7,4), and will tell
  you what the Bell actually is.
- **The shop** — tile (6,4), leading to `houseShop/0,0,0`. Stock is listed under
  [Caves, shops and secrets](#caves-shops-and-secrets). **Buy the shield for 30
  rupees the moment you can afford it**; it blocks frontal shots and the first
  dungeon opens with a room full of them. Do not bother with the bomb or
  Bottled Tide stock yet — both are refused until you own the bag they fill,
  and the shopkeeper says so rather than taking your money.
- **A village house** — tile (2,4), leading to `houseHearth/0,0,0`. A small
  rupee pickup on the floor at (2,4) and two people who explain the tide better
  than the sign does.
- **The scrimshander**, at (2,6). She carves blanks into charms. You have no
  blanks yet; the first one is in Dungeon 1.
- **The village digger**, at (8,2). He wants **3 Essences** and will then hand
  over the **Ferryman's Coin** (`coin`). Remember him.

**Village Shore** (`overworld/0,4,8`), one screen south. The net-mender's house
is at tile (3,5) — `houseNets/0,0,0`. Inside is **Ossa**, and talking to her
starts the **Coastwise Chain**, the eleven-link trading sequence that ends in
the Resonance Rod. She hands you a Cracked Float for nothing. Take it. The
chain is walked in full in [chapter 13](#13-interlude-the-coastwise-chain-end-to-end),
but the first four links are all within two screens of here and there is no
reason not to run them now:

1. **Ossa**, `houseNets/0,0,0` — gives the Cracked Float.
2. **Pell**, `overworld/0,4,8` at (3,2) — Float → Crab Claw.
3. **Hulla**, `overworld/0,5,8` at (6,3) — Claw → Salt Brick.
4. **Mirren**, `overworld/0,5,7` at (6,4) — Brick → Smoked Eel.

**West Bluff** (`overworld/0,3,7`), one screen west of the square. A cave mouth
at tile (3,2) leads to `cave1/0,0,0`, the **Bluff Grotto**. Inside:

- A chest with 30 rupees at (4,3) — this is your shield money.
- **Heart Piece 1** at (2,2), sitting in the open.
- A big chest at (7,2) holding the **Noble Sword** (`sword` level 2), which will
  not open until you hold **four Essences**. The inscription says so. Come back.

## 2. The Shallows, and the road to the Grotto

From the square, east to Village East (`overworld/0,5,7`), then south to
Driftwood Strand (`overworld/0,5,8`) and east along the strand: East Strand
(`0,6,8`), Dune Crossing (`0,7,8`), **Grotto Mouth** (`0,8,8`). That is Dungeon
1's door, at tile (4,1).

Detours worth taking first, all of them reachable with nothing but the conch:

- **Sunken Reef** (`overworld/0,6,7`), reached east from Village East. A cave
  mouth at tile (4,3) leads to `cave2/0,0,0`, the **Reef Hollow** — go there
  now, not later. See below.
- **Sandpiper Row** (`overworld/0,9,8`), east again past the Grotto. Two houses,
  one shut. `houseSandpiper/0,0,0` is the open one — a small rupee pickup
  inside. Sennit is the chain's sixth link and lives out here.
- **Shell Flats** (`overworld/0,10,8`), one screen east of Sandpiper Row.
  **Heart Piece 3** is sitting in the open at (6,4), guarded by an `urchin`.
  Urchins are harmless until the tide covers them, so take it at LOW.
- **Dune Corner** (`overworld/0,11,8`) has a buried `rupee20` — note it and come
  back with the Dredge Line.
- **Wrecked Hull** (`overworld/0,8,9`), south of Dune Crossing, holds **Dov**,
  the chain's fifth link. Hand him the Smoked Eel for a Sounding Lead, then
  carry it to Sennit on Sandpiper Row for the Ringing Whelk. That is the chain
  as far as it goes until you can reach the Coral Reef.

### The Reef Hollow — the Kilnshell

A dry column of sand runs up to the cave mouth on Sunken Reef from the south,
so you can reach the mouth at any tide; the reef flats around it are sandbar —
dry at LOW, wadeable at MID, deep at HIGH — so drop the water first if you want
to explore the rest of that screen rather than walk straight in.

Inside `cave2/0,0,0`:

- A `rupee20` at (3,3), inside the seafloor patch — walkable only at
  **LOW tide**. A readable at (8,3), across the room, is the whole puzzle:
  *"When the sea withdraws, walk where fish swam."*
- **Heart Piece 2** at (2,2), deeper in the same patch. Same requirement: you
  cannot reach it except at **LOW tide**.
- A big chest at (7,5), in the open, no requirements — the **Kilnshell**.
- A second `rupee20` at (7,1), in a niche walled off by two tiles of
  **drift-tangle** (the tangled weed at 7,2 and 8,2) — nothing else in the game
  opens it. This is where the item's movement verb is taught, for the cost of
  twenty rupees rather than a dungeon.
- A readable at (1,5), low on the wall by the room's tide pool: *"Lime drinks
  the sea and spits fire. Drown it and it sulks."*

**How the Kilnshell works.** Press the button and it sets one down, already
lit, on the tile you're facing. Press the button again, from anywhere, to take
it back. It burns everything it touches — torches, drift-tangle, and any
enemy standing over it, a little damage per tick rather than one big hit,
because it is a trap you place and the tide springs rather than a weapon you
swing. Set it down beside a torch (not on top of one — torches are solid) and
it catches on its own.

The one thing the sea still has a say in: **carry it into deep water and it
goes out.** It has to be set down and struck again — the single note this item
keeps from the rest of the roster, all of which negotiate with the tide one way
or another. You can also pick it up the ordinary way, like a pot or a rock (the
context-button lift from Part I), and carry it further before throwing it back
down; that is how you get a lit shell somewhere the placement range alone
would not reach.

It has to live here rather than in a dungeon. Fire is the one verb nothing
else in the game can perform, and the Coral Spire's own Torch Cell — the first
puzzle that needs it — is the sixth room of the second dungeon; every later
fire source would have arrived after the puzzle that wanted it.

## 3. Dungeon 1: Tidewash Grotto

**Entrance:** `overworld/0,8,8`, tile (4,1).
**Item:** Tidewright's Anchor (`anchor`).
**Small Keys:** 3. **Boss:** `gohmaraq`, in `d1/0,3,1`.
**Tide theme:** two levels in one room.

The Grotto is a sluice. A **well** is wadeable only when the sea is down; a
**drain** is a hole in the floor until the sea fills it; and the dungeon lays
the two end to end with no dry footing between them. No single setting of the
conch crosses that. The Anchor is the answer, and this is the dungeon that
teaches it.

### The southern half — no Anchor yet

**Grotto Mouth** (`d1/0,3,7`). A plaque: *"The sea keeps this floor. Take it
back."* Two pots. North.

**The Drinking Floor** (`d1/0,3,6`). Four rows of well fill the middle of the
room and there is no walking round them. **Sound the conch to LOW** and the
whole floor is ankle deep. Two `crab` and a `keese`; crabs are shielded from the
front, so hit them from the side or behind. These three drop generously — this
is the first fight in the game and the game knows it.

**Bone Cell** (`d1/0,2,6`), west. A **blank** on the floor at (4,3) and a
`keese`. That blank is the scrimshander's raw material; you now have one charm
commission banked. Back east, then north.

**Sunken Hall** (`d1/0,3,5`) — the hub. Two floor switches at (1,2) and (8,2),
two push blocks at (1,3) and (8,3), sitting directly beneath them. Push each
block up one tile onto its switch. A **fairy** rises out of the water. A push
block in this game moves **exactly one tile, ever**, so if you shove one the
wrong way it is gone — but every block in the game is seated adjacent to the
switch it is meant to cover, so "push it one square toward the switch" is always
the answer.

- **West:** Map Alcove (`d1/0,2,5`) — the **Dungeon Map**.
- **East:** Chartstone Alcove (`d1/0,4,5`) — a chest with the **Chartstone**,
  which marks on the map which rooms change with the tide, and at which level.
  It is this game's Compass and it is worth more than one.

**Tide Gallery** (`d1/0,3,4`), north of the hub. A locked door. You have no key
yet; the two rooms either side hold both.

**Crab Pit** (`d1/0,2,4`), west. Three crabs, all of them shielded frontally.
Clear the room and **Small Key 1** clatters onto the stone.

**Switch Room** (`d1/0,4,4`), east. Two switches at (2,2) and (7,2), two blocks
directly below them at (2,3) and (7,3). Push both up. **Small Key 2** and a
heart drop.

Take the locked door in the Tide Gallery north.

**The Locked Stair** (`d1/0,3,3`). Two `zol` — they split into `gel` when struck,
so kill the halves too. Another locked door north; spend Small Key 2.

**Weeping Wall** (`d1/0,2,3`), west. A chest at (4,3) holds the **Split Fang**
charm (`splitFang`) — a wider sword arc, and a MID charm, which is the only case
you have. Slot it. Clearing the room's `keese` and `zol` also shakes a `rupee20`
out of the wall.

### The Sluicegate — the Anchor

**The Sluicegate** (`d1/0,3,2`). The big chest at (4,4) is the **Tidewright's
Anchor**. The plate reads: *"Iron remembers. Sink it where you want the sea to
stay."*

**How it works.** Throw it and it sinks: within roughly eight tiles the tide
**stays at whatever level it was when the iron landed**, while the rest of the
room obeys the conch. Press the button again to recall it. The chain sweeps for
damage on both the throw and the recall. Two things follow that are not obvious:

- The held patch is **five tiles across**. That is why the gate rooms below are
  built the width they are.
- **Your charms read the field too.** Standing inside a held patch keeps that
  patch's charms awake while the rest of the room has moved on.

The boss door is directly above you, in this same room. It needs the Boss Key,
which is in the west wing.

### The gate primitive

Three rooms in this dungeon are built from one shape. Written along a row from
the side you arrive on:

```
 .   3 3 3 3   4 4 4   .
 ^   near band  far band  far side
stand
```

`3` is a **well**: wadeable at LOW, over your head above it.
`4` is a **drain**: an open pit at LOW, water above it.

Nothing between the two bands is walkable at both levels, and the hop clears
two whole tiles, so neither band is in its range. The answer is always the same
shape and the order decides which way round you do it:

- **Wells near you:** sound **LOW**, sink the iron in the well so it stays
  drained, sound the conch to **MID**, and the drain ahead of you fills while
  your well stays walkable.
- **Drains near you:** sound **MID**, sink the iron in the drain so it keeps its
  water, sound the conch to **LOW**, and the well ahead empties while your drain
  stays full.

### The east wing

**The Iron Pipe** (`d1/0,4,2`). Entered from the west at (0,3). Wells near,
drains far. LOW, sink the iron in the well, conch to MID, walk across.

**The Drowned Chamber** (`d1/0,5,2`). Not a gate — a fight, and the tide is the
weapon. The pool is drain, so at MID it is shallow water two `anglerfry` hunt
in, and at LOW it is a floor of holes with the fish flopping on it. A beached
aquatic enemy dies. There is a dry ring round the edge, so the room is optional
and you can simply walk it.

**The Long Race** (`d1/0,5,1`). Entered from the east at (9,3), crossed
westward. Wells near again — same solution, mirrored.

**The Keyvault** (`d1/0,4,1`). A chest with **Small Key 3**.

**Clawcrab Den** (`d1/0,5,3`) — two screens wide, behind the last locked door.

> **Miniboss: Clawcrab** (14 HP). A Gohmaraq that never grew a shell. It patrols
> across the room and snips a spread of rock at you; below half health it starts
> **charging** with a short tell. Dry ground suits it — at LOW it patrols and
> charges noticeably faster, so **fight it at MID or HIGH**. Stand off its
> patrol line, punish the recovery after each snip, and sidestep the charges.
> Kill it and **Heart Piece 4** rises at (14,4).

**The Two Gauges** (`d1/0,4,3`). The other kind of Anchor room. A door at (4,5)
opens only while the well at **(2,2) reads drained** and the well at **(7,2)
reads drowned** — at the same instant. They are five tiles apart and the held
patch is five across, so it cannot cover both: one gauge is the base level and
the other is under the iron.

The solution: sound the conch to **HIGH** so both wells are drowned. Stand near
the east well and throw the iron so the patch covers (7,2) and not (2,2). Now
sound the conch to **LOW**. The west well drains with the room; the east well
keeps its water inside the patch. The door gives.

Behind it, at (2,6), is **Heart Piece 5**, and a one-way staircase at (7,6) back
down to the Tide Gallery. That staircase is not a courtesy — an anchor recalled
from the far side of a gate cannot be re-sunk from that side, so the stairs are
what stop a wrong crossing being a soft lock.

### The west wing

**The Long Sluice** (`d1/0,2,2`). Entered from the east at (9,3). **Drains near**
this time: MID, sink the iron in the drain, conch to LOW, walk out over the
emptied well.

**Cistern Turn** (`d1/0,1,2`) — a `zol` and a `crab`, nothing else.

**Weeping Cistern** (`d1/0,1,3`). Two switches at (1,1) and (8,1), blocks below
them at (1,2) and (8,2). Push both up for a `rupee20`.

**The Drip Vault** (`d1/0,1,1`). The second gauge room, arranged vertically: the
door at (8,3) wants the **upper well at (4,1) drained** and the **lower well at
(4,6) drowned**. Same trick, same five-tile patch, one axis rotated.

**Bosskey Vault** (`d1/0,2,1`). A chest with the **Boss Key**, and a one-way
staircase at (5,5) back to the Locked Stair.

Take the Boss Key back to the Sluicegate and open the door above the chest.

### Boss: Gohmaraq, the Tidewash Claw

**24 HP. Arena `d1/0,3,1`. The conch works in here — the room unlocks the tide
the moment the intro ends.**

A crab that keeps its one eye behind a claw the size of a door. **The claw has
to come down to attack, and while it is buried in the floor the eye is exposed.
That window is the only way in.**

**Drain the grotto.** At **LOW tide** the shell dries out, cracks, and the claw
**sticks in the floor for twice as long** after every slam. That single fact
roughly halves the fight. Sound the conch to LOW before the intro is over.

- **Phase 1 (above 62%).** It scuttles the width of the arena and slams when you
  line up with it. The slam has a long frozen wind-up and throws three rocks
  outward on landing. Stand off the line, let the slam land, then get on the eye.
- **Phase 2 (62–30%).** Faster, and it now **charges the length of the room**. A
  charge that ends in a wall leaves it dazed with the eye open — bait it into a
  wall on purpose and you get a free window on top of the slam windows. Slams
  now throw five rocks.
- **Phase 3 (below 30%).** Constant slams, plus a **ring of eight bubbles fired
  in every direction** on a slower timer. Two `crab` are summoned when the phase
  starts; kill them or they will hem you into the ring. Keep moving in a circle
  rather than backing into a corner.

Kill it and the **Heart Container** drops in the middle of the room, then the
**Essence of the Tide I — the Shallow Bell** rises. Farore tells you to go and
see the Maku Tree, and she is right.

## 4. Interlude: the Maku Tree, the shop, the Chain begins

**Go to `houseMaku/0,0,0`.** With one Essence in hand the Maku Tree is awake
enough to work — but she wants *something of the Bell's* as well, and that is
the **Bell-Rope** at the end of the Coastwise Chain. Until you bring it she says
`makuBlocked`. This is the one thing in the game that will quietly cost you an
item if you skip it: **the Resonance Rod is the Chain's reward, and the Rod is
what opens the Salt Pans.** You cannot finish the game without going into the
Pans — the Bottled Tide case, two Heart Pieces and the Reef Palace are all in
there — so run the Chain.

At this point you can also:

- **Buy the shield** (30 rupees) if you have not.
- **Commission a charm.** The scrimshander takes your blank and 60 rupees and
  starts carving. It is ready after **three turns of the tide** — sound the
  conch three times and go back. Which charm you get is rolled from every charm
  you do not already own; you cannot choose.
- **Buy bombs** (20 rupees for four) — but you have nothing to carry them in
  yet. The bomb *capacity* comes out of Dungeon 2. Wait.

## 5. The Coral Reef

From Tidewatch: east to Village East (`overworld/0,5,7`), east to Sunken Reef
(`0,6,7`), east through Shallows Gate (`0,7,7`), Grotto Approach (`0,8,7`), Dune
Bowl (`0,9,7`), then **north** to Sandbar Run (`0,9,6`), east to Feather Gap
(`0,10,6`), and north to **Spire Mouth** (`overworld/0,10,5`). Dungeon 2's door
is at tile (4,1).

The dune screens between are laced with one-tile chasms. Walk into them; the hop
is automatic. The four-tile bands along the reef's southern edge are walls and
always will be.

On the way:

- **Coral Foot** (`overworld/0,11,5`) then north to **Outer Coral**
  (`overworld/0,11,4`): **Heart Piece 6** in the open at (5,5), sitting on reef
  flat that is exposed at LOW, wadeable at MID and underwater at HIGH — take it
  at either of the first two.
- **Reef Edge** (`overworld/0,11,3`) has a fairy sitting in the open — a free
  full heal, worth remembering as a checkpoint.
- **Coral Hollow** (`overworld/0,9,5`), one screen west of Spire Mouth, holds
  **Corriwig**, the Chain's seventh link. Give him the Ringing Whelk for the
  **Slackwater Pearl**.
- **Reef Market** (`overworld/0,9,2`) and the northern reef are behind the Salt
  Pans' vane gate. Later.

## 6. Dungeon 2: Coral Spire

**Entrance:** `overworld/0,10,5`, tile (4,1).
**Items:** Brineglass Lens (`lens`) **and** Bombs (`bombs`).
**Small Keys:** 2 required for 2 locked doors, plus a bonus third.
**Boss:** `anemos`, in `d2/1,3,1`.
**Tide theme:** commit-blind becomes plan-first.

The Spire is a tower of dry shafts, and a dry shaft tells you nothing. When the
water comes in, one is wadeable, one is over your head, and one is still a hole
— and by the time it arrives you have already chosen which one you are standing
over. The Lens is the only thing in the game that draws a room **as it will be**.

### Ground floor

**Spire Mouth** (`d2/0,3,7`). *"What rises, carries. What falls, reveals. Look
before you fall."*

**Coral Landing** (`d2/0,3,6`). An `urchin` and a `crab`; clear them for a fairy.

**Bone Cell** (`d2/0,2,6`), west. A **blank** at (2,1). Second charm banked.

**Tide Gallery** (`d2/0,3,5`). A `jellyfish` and a `crab`. Jellyfish drift with
the water and sting on contact; they are easier to deal with at LOW, when there
is less water for them to drift in.

**Map Nook** (`d2/0,2,5`), west — the **Dungeon Map**.

**Torch Cell** (`d2/0,4,5`), east. Three torches, at (1,1), (8,1) and (4,6),
and a `keese`. Light all three with the **Kilnshell** — set it down beside each
in turn — and a Small Key drops. **Optional.** Nothing later in the dungeon
needs this key; walk past it without the Kilnshell and come back for it once
you own one, or skip it outright.

**Rising Chamber** (`d2/0,3,4`). Two switches at (1,5) and (8,6) with blocks
beside them at (2,5) and (7,6), plus a `barnacle` at (4,6) that opens to spit
and is shielded while shut. Push both blocks onto their switches; the door at
(4,1) lifts, and **the mandatory Small Key 1** rattles loose with it — this is
the room the Spire's route actually runs through, not the Torch Cell. The plate
says it plainly: *"The floor of this room is a door. Shut the sea out and it is
only a hole."*

**Cistern Cell** (`d2/0,3,3`), through that door. A chest at (2,1) holds
**Barnacle Skin** (`barnacleSkin`) — one free hit per room, and it cracks until
you leave the room. Another MID charm; if you already carved something for the
MID case you now have a choice to make until 6 Essences opens the second slot.

**Stair Coil** (`d2/0,2,4`). Locked — spend Small Key 1. The stairs at (2,2) go
up to floor 1.

### Upper floor: the Lens

**Upper Landing** (`d2/1,2,4`) → **Anemone Cell** (`d2/1,2,5`) for a fairy →
back and east to **Spire Concourse** (`d2/1,3,4`) → east again to **Sealed Cell**
(`d2/1,4,4`).

The big chest at (2,1) is the **Brineglass Lens**. The pane of green glass in the
wall shows the room standing a hand deeper in water than it actually is — which
is exactly what the item does.

**How it works.** *Hold* the button and the room re-renders as a ghosted overlay
at the **next** tide level: terrain, platforms, currents, and the enemies that
only exist there. Release and it snaps back. It has no movement verb and that is
deliberate — **the Lens is never required to make a room passable**, only to make
it survivable first time.

**Glass Cell** (`d2/1,4,5`), south. Two `keese` in here are **phase-shifted**:
they are neither drawn nor hittable unless the Lens is up. Hold the Lens, kill
them, and take **Heart Piece 7** at (4,2). The plaque — *"Nothing here. The salt
on the floor says otherwise"* — is the tutorial.

### The forks

**The First Fork** (`d2/1,4,3`). The teaching one.

The room **pins the tide to LOW and refuses the conch**. The only thing that
moves water in here is the coral sluice at the bottom of each alcove — and by
the time you can put a hand on one you have already taken a one-way ledge you
cannot climb back up. Read the shelf at (4,5), then commit.

At LOW **all three kinds of shaft draw the same tile**. That is the point. Hold
the Lens on the shelf and you see the room one level up:

- **West shaft** (x=1) is a **drain** — at MID it is wading depth. **This is the
  way on.**
- **East shaft** (x=8) is a **pit** — it is a hole at every level, forever.

Take the west ledge down to (1,5), hit the sluice at (2,6) to step the water up,
and wade up the shaft and out the top at (1,0). If you took the east side, the
stair at (7,4) puts you back down the spire with the walk to do again — being
wrong is a **cost**, not a lock.

**Reefguard Hall** (`d2/1,4,2`) — two screens wide, north of the fork.

> **Miniboss: Reefguard** (16 HP). A coral plate that has to lift to strike, and
> that is the whole fight. It closes on you and periodically winds up: the plate
> opens, three orbs come out, and it stays open for a while afterwards. **At HIGH
> tide it stays open far longer** (about 130 frames against 80), so **flood the
> room before you start**. Below half health it charges and fires rings of six
> instead. Kill it for **Small Key 2**.

**Bomb Vault** (`d2/1,5,3`), east of the fork. A big chest with **Bombs**. This
is the bomb *pouch* — from here on bombs refill from grass, pots, drops and the
shop, and, far more importantly, **the Sunken Marsh and the Cliffs of Kell are
now open**.

**Whelk Cell** (`d2/1,5,4`), south of the Bomb Vault. A `rupee20` at (3,3),
**Heart Piece 8** at (4,4), and another phased `keese` — Lens up.

**Spire Ascent** (`d2/1,3,2`) — the inner stair, one screen wide and two tall,
with a `jellyfish`, a `crab` and a `keese` spread up it. The **boss door** is in
this room, and so is the last locked door. Spend Small Key 2 to go west.

**Drowned Cell** (`d2/1,2,3`) — an `urchin` and a `rupee20`.

**The Sounding Fork** (`d2/1,2,2`). The same primitive with a third answer, and
it is the one the first fork could not teach: a shaft that fills **over your
head**. Three throats, at x=1, x=4 and x=7. The shelf is at (4,6); the marks
read *"One wades. One waits. One keeps you."*

Hold the Lens. One level up:

- **West throat** (x=1) is a **drain** — wading depth. **Take this one.**
- **Middle throat** (x=4) is a **pit** — it waits, and it will keep waiting.
- **East throat** (x=7) is a **sump** — it fills over your head. That is the one
  that keeps you.

Down the west ledge to (1,4), sluice at (2,3), up and out at (1,0).

**Bosskey Cell** (`d2/1,2,1`). A chest with the **Boss Key**, and a `jellyfish`.
Back to Spire Ascent, open the boss door.

### Boss: Anemos, the Crowned Column

**30 HP. Arena `d2/1,3,1`. The conch works in here.**

Rooted to the spire floor, so this is a fight about position rather than
pursuit. It fills the room with shots and lashes anything that stands next to
it.

**Flood the spire.** Anemos has to **unfurl to feed**, and it feeds on what the
water brings. Its open window is **40 frames at LOW, 80 at MID and 160 at HIGH**
— four times as long with the water up. **Fight it at HIGH tide.** The feed
cycle runs every 250 frames regardless, so at HIGH you are getting roughly two
and a half seconds of open target every four seconds.

- **Phase 1 (above 62%).** It sways on its stalk and puffs rings of six
  spore-bubbles. Walk the gaps in the ring — they are evenly spaced and slow.
  Stand within about 44 pixels and it **lashes**: a wind-up, then five fast
  spines. Do not linger in melee outside a feed window.
- **Phase 2 (62–32%).** Adds a **rotating sweep** — three coral orbs fired every
  26 frames, each volley rotated slightly from the last, so the pattern sweeps
  the room like a lighthouse. Walk *with* the rotation rather than across it.
  Lash range widens.
- **Phase 3 (below 32%).** Aimed five-shot volleys between wider ten-shot rings,
  and it feeds constantly, which means it is open constantly. Two `jellyfish`
  are summoned at phase 2 and two `urchin` at phase 3; clear them or they will
  clip you while you are dodging rings.

Heart Container, then **Essence II — the Coral Bell**. Nereth notices you for
the first time. **Two Essences also cuts your LOW charm case**, so go and slot
something in it.

## 7. Interlude: bombs open two regions

Bombs are the key to two doors and both matter.

**The Sunken Marsh** has exactly two entrances and both are sealed by cracked
cliff:

- **Bog Causeway** (`overworld/0,2,7`) — walk west from West Bluff. The causeway
  itself only wades at LOW, as the sign says. Bomb the cracked cliff.
- **Bog Stair** (`overworld/0,1,6`) — the back door, down from the Cliffs. Also
  bombed.

Sealing only one would have gated nothing, since both reach the same screens.

**The Cliffs of Kell** are behind **The Deep Cut** (`overworld/0,3,4`), a
rockfall with one already-split boulder in it. Bomb it. That single boulder is
the only way into the Cliffs, and therefore the only way to everything north of
them — the Salt Pans and the Abyssal approach included.

The Deep Cut also has a raft on it at (3,3) and a sign explaining the three ways
across the cut: *"Swim it, blow the raft, or grow a bridge."* All three work,
once you own the things.

Now head into the Marsh. From Tidewatch: west to West Bluff (`overworld/0,3,7`),
west to Bog Causeway (`0,2,7`), west to Sanctum Path (`0,1,7`) — a `rupee20` in
the open at (2,2) — and south to **Sanctum Mouth** (`overworld/0,1,8`). Dungeon
3's door is at tile (4,1).

One screen further south is **Witch's Hollow** (`overworld/0,1,9`), with
**Yarrow**, the Chain's ninth link, and a buried Heart Piece you cannot reach
yet.

## 8. Dungeon 3: Bogwater Sanctum

**Entrance:** `overworld/0,1,8`, tile (4,1).
**Item:** Kelp-Soled Cleats (`cleats`).
**Small Keys:** 3. **Boss:** `gloomtide`, in `d3/0,3,1`.
**Tide theme:** surface route versus seafloor route.

The Grotto held the water still; the Spire made you bet on it. The Sanctum
floods and **stays** flooded. What you choose here is not a tide level but which
**layer** of the water you travel in.

### Before the Cleats

**Sanctum Mouth** (`d3/0,3,7`). *"The water has two floors. Only one of them
drowns you."*

**Drowned Nave** (`d3/0,3,6`). A `jellyfish` and a `crab`; clear them for a
fairy.

**Bell Cell** (`d3/0,4,6`), east. A chest at (4,2) with **Wrecker's Eye**
(`wreckersEye`) — chests and buried secrets glimmer through the terrain — and a
**blank** at (6,4). Wrecker's Eye is a **LOW** charm, and the LOW case opened on
the essence you carried out of the Spire, so this is the first thing you can put
in it. Slot it and leave it there; it makes every buried cache in the back half
of the game visible.

**Bog Hub** (`d3/0,3,5`) → **Map Cell** (`d3/0,2,5`) west for the **Dungeon
Map** → **Sluice Cell** (`d3/0,4,5`) east: switches at (2,2) and (7,2), blocks
at (2,3) and (7,3), push both up, **Small Key 1**.

**The Weir** (`d3/0,3,4`). Locked; spend Small Key 1.

**Silt Cell** (`d3/0,2,4`), west — a chest with the **Chartstone**.

**Reed Cell** (`d3/0,4,4`), east. Clear the `jellyfish` and the `crab` and
**Heart Piece 9** rises out of the reeds at (4,6).

**The Cistern Floor** (`d3/0,3,3`). The item room, and the chest stands on the
only dry island in it — the first thing the Cleats are used for is getting off
the rock you opened them on. The big chest holds the **Kelp-Soled Cleats**.

**How they work.** Two modes on one button:

- **Swim** — surface movement over deep water. Fast, and exposed to everything
  that swims.
- **Sink** — press again and you walk on the **floor beneath** the water. Slow,
  no hop, **no sword**, immune to knockback and immune to currents, and you can
  carry heavy things down there. You run on a fixed amount of **breath**.

### The torrent

Three rooms are built on one tile. Written along a row from the shelf you arrive
on:

```
 .  T T T T T T T T  .
 ^   the channel, running back the way you came   the way on
stand
```

A **torrent** is deep at every tide level and pushes harder than you can swim.
Not slightly harder — the arithmetic is the wrong side of zero, so on the
surface you make **no headway at all** and get carried back to the shelf you
left. A torrent is not a tide tile, so no setting of the conch touches it.

On the floor, nothing pushes you. A tile's current is only applied while you are
in deep water and **not** underwater, and weighted soles are exactly what the
Cleats are. **Sink and walk.**

**The Undertow** (`d3/0,2,3`). West of the item room. Enter at (9,3), sink, walk
the floor west to (0,3). Bare on purpose — there is nowhere to stand in a
torrent room, which is the point.

**Sunken Vestry** (`d3/0,1,3`). Switches at (2,2) and (7,2), blocks below them.
**Small Key 2**.

**Silt Vault** (`d3/0,1,4`), south — a `rupee20`.

**Bogmaw Hall** (`d3/0,2,2`), north. No lock on this one.

> **Miniboss: Bogmaw** (15 HP). A mouth in the floor. It **submerges and
> resurfaces beside you**, chasing while it is up and spitting three ink shots
> on a timer. **It rides the sanctum's current, which only runs at MID** — at
> MID it chases at 0.85, off MID at 0.5. **Take the tide off MID** and it
> wallows. Below half health it stops hiding entirely and fires six-shot rings;
> that is the phase to burn it down in, since it is permanently on the surface.

**Drain Gallery** (`d3/0,1,2`), west of Bogmaw Hall. The chest at (7,3) with the
**Boss Key** is on the side you arrive on — take it before you do anything else.
The room's **locked door at (5,4)** is the one that separates the chest's half
from the western half and the way back down to the Sunken Vestry; spend **Small
Key 2** on it, or walk back the way you came.

**Vestry Roof** (`d3/0,2,1`), north of Bogmaw Hall. **Heart Piece 10** at (4,4).

### The east wing

Back to The Cistern Floor and east.

**The Bogwater Drain** (`d3/0,4,3`). Torrent room 2, and **the current runs the
other way** — a player who learned "swim east" in the Undertow learns nothing
here. Enter at (0,3), sink, walk east to (9,3). There is an alcove under the
channel that only opens off the **seafloor**; the surface route never sees it,
and there is a fairy in it at (4,6). Nothing in it is required. That is the
trade the whole dungeon is about: the slow layer is the one that finds things.

**Eel Hall** (`d3/0,5,3`) — an `urchin` and a `crab`, and a **locked door at
(4,2)** across the middle of the room. Behind it is the north exit, and the north
exit is the Kelp Locks. You need the third key first, and it is one room south.

**Eel Vault** (`d3/0,5,4`), south. A `barnacle` at (4,4) and a `keese`. Clear
them for **Small Key 3**, then go back up to Eel Hall and spend it.

**The Kelp Locks** (`d3/0,4,2`). Two screens wide, and the only room in the
dungeon where your breath is not decorative: **eighteen tiles of seafloor in one
dive**, with no shelf in the middle to surface on. Enter at (14,7), sink
immediately, and walk west to (0,3) without stopping. If you have carved the
**Gillcarve** charm (`gillcarve`, HIGH case, unlimited seafloor breath) this room
is free — but you cannot have it yet; it is in Dungeon 5. Go straight across.

**The Lock Gallery** (`d3/0,3,2`), at the western end of the Kelp Locks. No lock
on this one despite the name — the boss door is here, and the Boss Key is
already in your pocket.

### Boss: Gloomtide, the Bogwater Maw

**36 HP. Arena `d3/0,3,1`. The conch works in here — and this fight is a tug of
war over it.**

A dripping mass with two lantern eyes that sinks into the bog to close distance
and comes up somewhere behind you.

**Take the tide off MID and keep it there.** The sanctum's current only runs at
MID; riding it makes Gloomtide **1.7× its speed** and drags it along toward you.
Off MID it is a sack of water at **0.65×**. From phase 2 onward it **keeps
shoving the tide back to MID** on a timer — every 420 frames in phase 2, every
360 in phase 3 — and you have to keep sounding the conch back off it. That is
the fight.

- **Phase 1 (above 62%).** It wallows toward you and spits three-shot spreads of
  bog water after a wind-up. Straightforward. Do your damage here.
- **Phase 2 (62–32%).** It **submerges**, down for about 70 frames, up for 130,
  and **sheds a `gel` most times it surfaces**. While up it chases and fires
  five-shot spreads. Watch for the surfacing tell and be somewhere else. Clear
  the gels — they are cheap and they add up.
- **Phase 3 (below 32%).** It stops hiding. Faster, heavier, and it throws
  **eight-way ink rings**. Two `zol` are summoned at the phase change. Keep the
  tide off MID, keep circling, and hit it between rings.

Heart Container, then **Essence III — the Bog Bell**. The marsh drains a finger's
width and stays there.

## 9. The Cliffs of Kell

From Tidewatch: east to Village East (`overworld/0,5,7`), north to The Wading
(`0,5,6`), west to South Wood (`0,4,6`), north through Bog Trees (`0,4,5`) and
Shrine Path (`0,4,4`) to **The Deep Cut** (`overworld/0,3,4`) — the bombed
rockfall. Then north to Cliff Face (`0,3,3`) and west to **Kell Ledges**
(`overworld/0,2,3`), where **Heart Piece 11** is sitting in the open at (6,2).
West again is **Cistern Mouth** (`overworld/0,1,3`); Dungeon 4's door is at tile
(4,1).

Alternatively from the Deep Cut go west to Kell Basin (`0,2,4`) and north to Kell
Ledges — same place, and the Basin is full of `tektite` which hop across water
and are worth the practice.

The Cliffs are a high stone shelf over deep water. The sign on Upper Kell
(`overworld/0,2,2`) tells you the rule the whole region runs on: *"The low walls
drown at HIGH tide. Swim what you cannot climb."* The iron seal above that screen
is the Keep's, and nothing you carry opens it.

**Marsh Stair** (`overworld/0,1,5`), south of the cliffs, is a run of four
boulders. Those are **Dredge Line** work — the Line drags them clear one at a
time. They hold the Marsh's two northern screens and nothing on the critical
path, so leave them for the endgame.

## 10. Dungeon 4: Cliffside Cistern

**Entrance:** `overworld/0,1,3`, tile (4,1).
**Item:** Squall Bellows (`bellows`).
**Small Keys:** 3 — but only two are dropped by puzzles; the third comes out of
a wheel. **Boss:** `wyverna`, in `d4/0,3,1`.
**Tide theme:** the sea in two states at the same instant.

The whole dungeon after the Bellows is one sentence built five different ways:

> **A drowned wheel does not turn, and the only thing that takes the water off
> one is the gust that turns it.**

You own the Cleats now, so deep water is a road. Every wheel in here therefore
sits behind a trench of **pit**, which neither Cleat mode crosses.

### Before the Bellows

**Cistern Head** (`d4/0,3,7`). *"This cistern is worked from the far bank.
Nothing here is meant to be reached."*

**Rainwater Landing** (`d4/0,3,6`) → **Overflow Sluice** (`d4/0,2,6`) west for
the **Dungeon Map** → **Cracked Basin** (`d4/0,4,6`) east: a `stalfos`, a
`tektite` and a `keese`. Stalfos are skittish and hop away from your sword —
corner them or wait for the hop and meet them where they land. Clear the room for
**Small Key 1**.

**The Weir** (`d4/0,3,5`). The sump band, taught before it is ever load-bearing:
at LOW those four squares have **no floor at all**, and at MID they are over your
head. Locked door at (4,2); spend Small Key 1.

**Drowned Stair** (`d4/0,2,5`), west — a chest with the **Chartstone**.

**Rung Gallery** (`d4/0,4,5`), east — **Heart Piece 12** at (3,3), inside a
drown-wall box with one square of floor in it. The walls are stone at LOW and MID
and deep at HIGH: **sound the conch to HIGH and swim in over them**.

**Cliffside Cell** (`d4/0,5,5`), east again. A chest at (4,2) with **Bosun's
Whistle** (`bosunsWhistle`) — the conch sounds faster. A MID charm, and in a
dungeon that will have you sounding the conch between every wheel and every
shelf, it is worth wearing for the rest of the game.

**The Cistern Floor** (`d4/0,4,4`). Two screens wide. Switches at (3,1) and
(16,6), one block at (4,1). Push the block onto the near switch and **stand on
the far one yourself** — where a room has fewer blocks than switches, you are the
second weight. **Small Key 2**.

**Barnacle Cell** (`d4/0,3,4`) → **Winch Room** (`d4/0,2,4`). *"The wheels are
set where no hand goes. Bring wind."* Locked door at (2,3); spend Small Key 2.

**Bellows Vault** (`d4/0,1,4`). The big chest holds the **Squall Bellows**.

**How they work.** *Hold* the button to blow. Three things happen at once and
only while the button is down:

- A directional gust that **pushes light enemies** — into pits, into hazards.
- It **spins wheels**.
- **The water inside the cone falls one level** below the rest of the room.

And you cannot move while you pump. That is the design: the cone is a thing you
open for something *else*, because the moment you walk into it, it closes. The
gust does not blow through stone, which is what lets a wheel sit in an alcove
with one mouth.

### The six sills

Every sill in the Cistern is one of two shapes, and each one is a place to stand
plus a wheel to blow at. The declared solution for each is exact.

**Sill 1 — Squall Loft** (`d4/0,1,3`). Wheel at (1,1). **Stand at (4,1), face
left, at MID tide.** Opens the door at (8,3).

**Sill 2 — The Drowned Sill** (`d4/0,2,3`). Wheel at (8,6). **Stand at (5,6),
face right, at HIGH tide.** Opens the door at (4,1).

**Sill 3 — Cistern Gauge** (`d4/0,2,2`). Wheel at (1,3). **Stand at (4,3), face
left, at MID tide.** This one pays out **Small Key 3** rather than a door. *Pick
the key up before you leave the room* — it is released by the wheel and the wheel
has already done its work.

**Sill 4 — The Long Race** (`d4/0,4,3`). Wheel at (2,1). **Stand at (2,4), face
up, at HIGH tide.** Opens the grating at (8,6). There is a `darknut` in this room
— armoured, and only vulnerable from behind.

**Sills 5 and 6 — The Crossed Sluices** (`d4/0,4,2`). One of each shape, in one
room, with the **Boss Key** behind both. West wheel at (1,1): **stand at (1,4),
face up, at MID**. East wheel at (8,1): **stand at (8,4), face up, at HIGH**. You
cannot hold two seas, so work one side, walk out of the alcove, sound the conch,
and work the other. The east wheel gives the **Boss Key**.

Why those tide levels, if you want to understand rather than follow:

- **The sump shelf, worked at MID.** The shelf is cut off by sump — an open pit
  at LOW that nothing crosses, deep water at MID and above that the Cleats cross.
  The wheel stands on a well: shallow at LOW, drowned at MID and HIGH. So the
  shelf is standable only from MID up and the cone frees the wheel only from MID
  down. They meet at MID and nowhere else.
- **The drown-wall shelf, worked at HIGH.** The shelf is ringed by drown-wall —
  stone at LOW and MID, deep at HIGH. The wheel stands on sluice: dry at LOW,
  wading at MID, drowned at HIGH. The shelf is reachable only at HIGH and the
  wheel is smothered only at HIGH, and one level of cone is exactly the
  difference.

### The rest of the wing

**West Overlook** (`d4/0,2,1`), north of Cistern Gauge — a fairy.

**Winding Stair** (`d4/0,3,3`) → **The Long Race** (`d4/0,4,3`) → **Ironknight
Gallery** (`d4/0,5,3`), two screens wide.

> **Miniboss: Ironknight** (18 HP). A darknut with a cistern's worth of armour.
> The shield holds against everything until **a charge ends in a wall**, and then
> it is wide open for about 90 frames. Bait the charge — it has a 20-frame tell —
> and step aside so it eats the wall. Below half health it charges harder and
> faster and adds three-spear throws.
>
> **Flood the cistern and all that plate seizes.** At HIGH tide the Ironknight is
> **permanently open**, bubbles coming off the joints. That is by far the easier
> fight; the charge-into-wall route is what you use if the water is somewhere
> else and you do not want to spend the conch.
>
> Killing it grinds open the door at (4,1).

**Cliff Walk** (`d4/0,5,2`). Four pits and three `keese` over them — the one room
in the dungeon where the Bellows are a weapon. Blow the keese into the pits;
nothing here is required. Locked door at (1,6); spend Small Key 3.

Through The Crossed Sluices for the Boss Key, then **East Overlook**
(`d4/0,4,1`): a `rupee20` at (4,2), a `stalfos`, and **Heart Piece 13** at (2,6).

**Cistern Gate** (`d4/0,3,2`) holds the boss door.

### Boss: Wyverna, the Sea Wyvern

**44 HP. Arena `d4/0,3,1`. The conch works in here — and she will fight you for
it.**

A winged serpent who owns the air while the cistern is full.

**Drain the cistern.** The water level sets her altitude, her speed and how much
of her you can reach:

| Tide | Altitude | Speed | Weak point |
|---|---|---|---|
| LOW | on the floor | 0.5 | **permanently open** |
| MID | low | 0.95 | open in bursts |
| HIGH | ceiling | 1.35 | closed except during dives |

At LOW she is beached, slow, kicking up dust and **open the whole time**. She
knows it, and **from phase 2 she refloods the cistern on a timer** — every 400
frames in phase 2, every 320 in phase 3. So the fight is about **spending the
conch faster than she does**: sound it back to LOW every time she takes it to
HIGH, and hit her while she is on the floor.

- **Phase 1 (above 62%).** She wheels around the ceiling on a diagonal bounce and
  **stoops** at you every 170 frames. The stoop has a 24-frame hang-and-flash
  tell, then a straight-line dive — and **she is open for the whole dive**. Even
  at HIGH tide, the dive is a window. Sidestep and swing as she passes.
- **Phase 2 (62–32%).** Adds a **breath**: a 20-frame wind-up, then three beams
  raked across the room. Dives come faster. The flood timer starts.
- **Phase 3 (below 32%).** Dives every 100 frames in a rhythm, plus an
  **eight-beam ring** every 200 frames to punish standing still. Two `keese` are
  summoned. Keep moving, keep the water down.

Heart Container, then **Essence IV — the Cliff Bell**. Half the Bell. Nereth
invites you to the Keep, which is not the compliment it sounds like.

**Four Essences also cuts your HIGH charm case**, and — more usefully right now —
**opens the Noble Sword**. Go back to `cave1/0,0,0` under West Bluff and open the
big chest at (7,2). Double the sword you have been using since the intro.

## 11. The Drowned Wood

From Tidewatch: east to Village East (`overworld/0,5,7`), north to The Wading
(`overworld/0,5,6`) — *"Only a swimmer goes north from here,"* which is true at
MID and not at LOW — then north to **Wood Heart** (`overworld/0,5,5`) and north
again to **Shrine Mouth** (`overworld/0,5,4`). Dungeon 5's door is at tile (4,1).

On the way and around it:

- **Wood Heart** (`overworld/0,5,5`) holds **Wick**, the Chain's eighth link.
  Give him the Slackwater Pearl for the **Bogwood Cup**.
- **Log Drift** (`overworld/0,6,4`), east of Shrine Mouth via Wood Foot
  (`0,6,6`) and Sunken Glade (`0,6,5`): **Heart Piece 14** in the open at (2,5),
  with an `anglerfry` in the water beside it. Anglerfry hang in deep water and
  lunge; take this at LOW when the water is not theirs.
- **Wood Foot** (`overworld/0,6,6`) has a `rupee20` in the open at (6,4).
- **The Gyre** (`overworld/0,7,3`) is a ring current — *"Swimmers go round.
  Walkers go through."* Sink or wait for LOW.

## 12. Dungeon 5: Drowned Wood Shrine

**Entrance:** `overworld/0,5,4`, tile (4,1).
**Item:** Reefseed (`reefseed`).
**Small Keys:** 3. **Boss:** `rootmaw`, in `d5/0,3,1`.
**Tide theme:** the sea in two states **in order**, and the order cannot be
reversed.

Everything after the Reefseed is one sentence built five different ways:

> **You cannot plant a stake from the water, and a stake is only ground at LOW.**

### Before the Reefseed

**Shrine Mouth** (`d5/0,3,7`). *"The wood was here before the water. Stand on
what you plant, and plant while you can stand."*

**Rootwater Landing** (`d5/0,3,6`) → **Silt Gallery** (`d5/0,2,6`) west for the
**Dungeon Map** → **Bracken Cell** (`d5/0,4,6`) east: a `stalfos`, a `tektite`
and a `keese`; clear them for **Small Key 1**.

**The Standing Grove** (`d5/0,3,5`). *"At high water the wood is not there.
Everything else in this shrine follows from that."* Locked; spend Small Key 1.

**Chartstone Nave** (`d5/0,2,5`), west — a chest with the **Chartstone**.

**Drowned Cloister** (`d5/0,1,5`), west again — **Heart Piece 15** in the open at
(3,3).

**Thicket Cell** (`d5/0,4,5`), east. A chest at (4,2) with **Gillcarve**
(`gillcarve`) — **your breath never runs out on the seafloor**. This is a HIGH
charm and your HIGH case opened on the fourth Essence. If you came here after
Dungeon 4, slot it now; it retroactively trivialises the Kelp Locks and makes
every dredging room in Dungeon 6 comfortable.

**Bower Cell** (`d5/0,5,5`), east again — a `rupee20` at (7,2) and **Heart Piece
16** at (5,1).

**Coppice Cell** (`d5/0,5,4`) → **Sunken Bracken** (`d5/0,4,4`): switches at
(2,1) and (7,6), blocks beside them at (3,1) and (6,6). Push each one square onto
its switch. **Small Key 2**.

**Rootbound Hall** (`d5/0,3,4`) → **Warden's Sill** (`d5/0,2,4`). *"Past this
door the floor is a thing you bring with you."* Locked; spend Small Key 2.

**Reefseed Vault** (`d5/0,1,4`). The big chest holds the **Reefseed**.

**How it works.** Throw it; a coral pillar grows where it lands after about two
seconds. What it *becomes* depends on the tide **when it finishes growing**, not
when you threw it:

| Tide at the pillar | What it is |
|---|---|
| LOW | A climbable block — a step |
| MID | A wall — solid, and it blocks line of fire |
| HIGH | Submerged — swim over it |

Three hard rules that are the whole geometry of the dungeon:

1. **A seed carries exactly two tiles.** Range means something.
2. **You cannot throw one while in deep water or on the seafloor.** A stake is
   driven, not dropped. So the first thing you build in any Shrine room is
   somewhere to stand.
3. **A pillar can only go where you could already stand or already swim.** It
   refuses solid, pit and void at every level. The item cannot open a path; it
   can only put ground where there was sea.

Seeds are a counted consumable and refill from grass, pots and drops. The
**Quartermaster's Mark** charm (`quartermaster`, MID) carries two more.

### The five stake groves

Each grove is the same fixture: a perch ringed by drowned boles on the sides it
must not be reachable from, a dry islet with a push block on it, a crossing
stake, and a plate the block has to end on. **A drowned bole stands at LOW and
MID and is open water at HIGH** — a seed thrown at one stops dead at its foot,
and at HIGH the same throw sails over it. That is why every perch is planted at
HIGH and everything thrown *from* the perch is thrown after the sea has gone back
down. Neither half can be bought at the other's sea.

The declared solution for each grove is exact. In each case: stand where it says,
sound the conch to the sea it says, face the direction it says, and throw.

**Grove 1 — The First Stake** (`d5/0,1,3`). Enter at (4,7). **Stand at (4,4),
face right, at HIGH tide**, and throw. The stake lands at (6,4). Drop to LOW and
the pillar is ground; the snarl at (7,4) is cut from (6,4).

**Grove 2 — The Bole Walk** (`d5/0,2,3`). Enter at (0,4). **Stand at (4,5), face
up, at HIGH**; stake at (4,3). Snarl at (4,2), cut from (4,3).

**Grove 3 — The Sunken Nave** (`d5/0,2,2`). Enter at (4,7). **Stand at (5,4),
face left, at HIGH**; stake at (3,4). Snarl at (2,4), cut from (3,4). There is a
chest at (1,2) in this room with **Small Key 3**, plus a `jellyfish` and a
`keese`.

**Silt Cell** (`d5/0,1,2`), west of the Nave — a `rupee20`.

**Grove Crossing** (`d5/0,3,3`). Locked; spend Small Key 3.

**Grove 4 — The Long Ford** (`d5/0,4,3`). Enter at (0,2). **Stand at (4,1), face
down, at HIGH**; stake at (4,3). Snarl at (4,4), cut from (4,3).

**Thornvine** (`d5/0,5,3`), east.

> **Miniboss: Thornvine** (16 HP). Rooted, and it fills the room with thorns. It
> orbits a fixed point and fires six-shot rings at a random rotation. Below half
> health it orbits wider and faster and adds a three-spear aimed volley to each
> ring.
>
> **Drop the water and the vine wilts.** At LOW tide its ring timer stretches
> from 130 frames to 190 (and from 100 to 150 in phase 2) — a third longer
> between every volley. Fight it at LOW. Killing it makes the thorns let go of
> the north arch.

**Grove 5 — The Shrine Ford** (`d5/0,4,2`). Two screens wide, and the only grove
that needs **two stakes at two different seas** — the shrine board says so:
*"Twice over. The first while the wood is under, the second while it is not."*

1. Enter at (14,7). **Stand at (15,4), face left, at HIGH tide.** Stake lands at
   (13,4).
2. Sound the conch to **LOW** so that pillar becomes ground, walk onto it, and
   from **(13,4), facing left, at LOW**, throw the second stake. It lands at
   (11,4).
3. The snarl at (10,4) is cut from (11,4).

The **Boss Key** is in a chest at (4,3) in the western screen.

**Rootmaw Arch** (`d5/0,3,2`) holds the boss door.

### Boss: Rootmaw, the Drowned Wood

**52 HP. Arena `d5/0,3,1`. The conch works in here.**

A flooded tree whose trunk splits open into a mouth. Its roots are in the water.

**Drain the shrine and keep it drained.**

| Tide | What Rootmaw does |
|---|---|
| HIGH | Bark **shut** — untouchable — and it **heals 1 HP every 110 frames** |
| MID | Breathes open for about 80 frames every 220 |
| LOW | Roots bare and soft: **the mouth cannot close** |

The heal is capped so it can never win a stalemate outright, but it can undo a
great deal of work, and **from phase 2 it drinks — forcing the tide back to HIGH
every 380 frames, and every 300 in phase 3**. Same tug of war as Wyverna, higher
stakes.

- **Phase 1 (above 62%).** Rooted. A 20-frame wind-up, then four wooden spears
  fired outward on a slow cycle. Get in, hit the open mouth, get out.
- **Phase 2 (62–32%).** **Seed clusters**: a five-shot spread *and* a slow
  eight-shot ring on the same wind-up, which means the fast shots arrive while
  you are still walking out of the slow ones. Saplings (`zol`) come up around it,
  capped at three. Two `zol` are summoned at the phase change.
- **Phase 3 (below 32%).** It **tears itself out of the floor and walks**, mouth
  open, still spitting — seven spears in a wide spread every 105 frames. It is
  slow (0.38) so you can outpace it, but the arena is not large. Keep the water
  down; the mouth cannot shut while the roots are bare, so every frame at LOW is
  a frame you can hit it.

Heart Container, then **Essence V — the Drowned Bell**. Farore tells you to go
and see the Maku Tree. Do the Chain first — it is one screen out of your way and
the Rod is what makes the rest of the map exist.

## 13. Interlude: the Coastwise Chain, end to end

Eleven links, eleven objects, one reward. There is **exactly one live deal in the
world at any moment**: a trader two links ahead has nothing to say to you yet
even if you are already holding what they will eventually want. Everyone keeps a
flavour line for when it is not their turn, so the coast sounds the same to a
player who never starts it.

The only item gate on the whole chain is **bombs**, because Yarrow is in the
Marsh. You have had bombs since Dungeon 2.

| # | Who | Where | Takes | Gives |
|---|---|---|---|---|
| 1 | Ossa, the net-mender | `houseNets/0,0,0` (off `overworld/0,4,8`) | — | Cracked Float |
| 2 | Pell | `overworld/0,4,8` (3,2) | Cracked Float | Crab Claw |
| 3 | Hulla, a Salter | `overworld/0,5,8` (6,3) | Crab Claw | Salt Brick |
| 4 | Mirren, a fisher | `overworld/0,5,7` (6,4) | Salt Brick | Smoked Eel |
| 5 | Dov, off the wreck | `overworld/0,8,9` (2,2) | Smoked Eel | Sounding Lead |
| 6 | Sennit | `overworld/0,9,8` (4,6) | Sounding Lead | Ringing Whelk |
| 7 | Corriwig, a diver | `overworld/0,9,5` (4,2) | Ringing Whelk | Slackwater Pearl |
| 8 | Wick, a Kelper | `overworld/0,5,5` (2,2) | Slackwater Pearl | Bogwood Cup |
| 9 | Yarrow, the bog witch | `overworld/0,1,9` (5,2) | Bogwood Cup | Jar of Brine-Jelly |
| 10 | Teel, off the stones | `overworld/0,4,9` (2,2) | Jar of Brine-Jelly | **Cold Kettle** |
| 11 | Ossa again | `houseNets/0,0,0` | Cold Kettle | **Bell-Rope** |
| 12 | The Maku Tree | `houseMaku/0,0,0` | Bell-Rope **and one Essence** | **Resonance Rod** |

You are carrying one trade object at a time and the **Quest screen** is the only
place to look up which. It is never in your item grid — putting it there would
offer to equip it.

Take the Bell-Rope to the Maku Tree (`makuTree`) and she hands over the
**Resonance Rod** (`rod`).

**How it works.** Strike it and **every metal and crystal thing in earshot
answers at once**: grates retract, submerged bells chime and lean toward what
they are tuned to, and armoured enemies — `darknut`, `ironknight` — lock rigid
for about 90 frames. **Its range roughly doubles at HIGH tide**, because water
carries the note. It is the one item in the game whose own power is
tide-dependent, and that is why it is the trading reward rather than a dungeon
item: it sends you back to rooms you had written off, at a level you never tried
them at.

## 14. The Salt Pans and the Reef Palace

The Rod's overworld verb is the **salt vane**, and it is the only gate in the
game whose key is the core mechanic. Vanes seal the Salt Pans, and because the
Reef Palace's own approach can only be entered through the Pans, they seal that
too — 27 screens behind four vane tiles.

Route from Tidewatch: east to Village East (`overworld/0,5,7`), north to The
Wading (`0,5,6`), east to Wood Foot (`0,6,6`), north through Sunken Glade
(`0,6,5`), Log Drift (`0,6,4`) and Wood Gate (`0,6,3`) to **Vault Steps**
(`overworld/0,6,2`). Ring the Rod at the vanes. From there:

**North into the Pans:**

- **Vault Approach** (`overworld/0,6,1`). A cave mouth at tile (3,2) leads to
  `cave3/0,0,0`, the **Salt Pan Vault** — the ruined mouth of what used to be a
  whole dungeon. The big chest holds the **Bottled Tide** case (`bottle`). This
  is the item that lets you carry Bottled Tide at all; refills are 40 rupees at
  the Tidewatch shop.

  **What a Bottled Tide does:** forces **one tide step** in a room where the
  conch is suppressed, and it flatly refuses to work anywhere the conch already
  works. That means boss rooms and the Black Causeway, and nothing else. Carry
  at least one into the Keep.
- **Boiling Pan** (`overworld/0,6,0`) then west to **Salt Terraces**
  (`overworld/0,5,0`) — **Heart Piece 17** in the open at (6,4), with a `beetle`
  patrolling. Beetles charge in straight lines; stand off the line.
- **Salters Rest** (`overworld/0,5,1`) has a Salter elder who will tell you
  about salt and water being old enemies.

**East to the Palace:**

- From Vault Steps east to Pan Corner (`0,7,2`), north to **Windward Pan**
  (`overworld/0,7,1`) — more vanes; ring the Rod — then east through Reefway
  (`0,8,1`) and Hooked Channel (`0,9,1`) to **Palace Mouth**
  (`overworld/0,10,1`).
- **Palace Mouth** has a cave mouth at tile (4,1) leading to `cave4/0,0,0`, the
  **Palace Porch**: **Heart Piece 18** at (4,1), and a notice from someone who
  gave up halfway — *"The rest of it is under. Do not go and look."*
- North from Reefway is **Coral Gate** (`overworld/0,8,0`), and east of that
  **Palace Wall** (`overworld/0,9,0`) — **Heart Piece 19** in the open at (2,5),
  with an `octorokSea` in the water.

Also worth doing now, with the Rod in hand: **the village digger**
(`overworld/0,4,7`, tile (8,2)) has been waiting for **3 Essences** and you have
five. He hands over the **Ferryman's Coin** (`coin`).

**How it works.** Throw it down; **on the next tide change, you and the coin
swap places.** One coin, and you can recall it. It is a teleport on a delay you
control but do not own: you choose where the coin goes and when you sound the
conch, but the coin is somewhere else in the meantime, and so is your escape
route. Its real use is getting the coin somewhere you cannot walk to and then
changing the tide.

## 15. The Maku Tree opens the road

Go back to `houseMaku/0,0,0` holding **five Essences**. The `makuMaster` scene
runs:

- The Maku Tree tells you the roots under Tidewatch go all the way down to the
  Keep, and that she has been growing them for a century waiting for a reason.
- She hands you the **Master Sword** (`sword` level 3). There is no level 2 from
  her; the Noble Sword was the chest in the Bluff Grotto.
- She sets the flag that **splits the Keep's seal**. This is the one story gate in
  the world: the iron on Upper Kell (`overworld/0,2,2`) and the plugs on the
  Abyss Stair (`overworld/0,2,1`) open together, and **nothing you carry opens
  either of them**.

**The road to the Keep.** From The Deep Cut (`overworld/0,3,4`): north to Cliff
Face (`0,3,3`), west to Kell Ledges (`0,2,3`), north to **Upper Kell**
(`overworld/0,2,2`) — now passable — north to **Abyss Stair**
(`overworld/0,2,1`), west to The Long Drop (`0,1,1`), north to **Gate of the
Keep** (`overworld/0,1,0`). Dungeon 6's door is at tile (4,1).

Two things on that road:

- **The Black Causeway** (`overworld/0,2,0`) is the one screen on the map where
  the conch does not reach. The Keep holds the water there, so the causeway is
  whatever it was when you arrived — and a **Bottled Tide** is the only thing
  that moves it. It is a shortcut, never a gate; the rows either side of each
  drowned wall run the full width of the screen at every level.
- **Iron Watch** (`overworld/0,3,1`) and the abyss screens are patrolled by
  `darknut` and `wizzrobe`. Darknuts are only vulnerable from behind, or rigid
  for 90 frames if you ring the Rod at them. Wizzrobes blink in, fire, blink out
  — hit them in the window between.

## 16. Dungeon 6: the Abyssal Keep

**Entrance:** `overworld/0,1,0`, tile (4,1).
**Items:** Dredge Line (`dredge`) **and** the Mermaid Suit (`cleats` level 2).
**Small Keys:** 4 — and the fourth is **buried**. **Boss:** `nereth`, in
`d6/1,3,1`.
**Tide theme:** the only one of the six that wants the water **on**.

The Keep is the last dungeon and its problem is what you already own. Since the
Bogwater Sanctum, deep water has been a road — both Cleat modes cross it and no
sea level is a wall. So a barrier here has to be a **pit**, the one thing neither
mode crosses and no conch fills, and every crossing in the second half of this
dungeon is a shaft.

### Ground floor

**Keep Door** (`d6/0,3,7`). *"Everything the sea takes, it keeps. Everything it
keeps, it puts down."*

**Keep Landing** (`d6/0,3,6`). A `darknut` and a `keese`; clear them for a heart.

**Map Crypt** (`d6/0,2,6`), west — the **Dungeon Map**, and a `stalfos`.

**Bone Cell** (`d6/0,4,6`), east. Two `stalfos` and a `darknut`. Ring the Rod to
lock the darknut and go round behind it. Clear the room for **Small Key 1**.

**Drowned Hall** (`d6/0,3,5`) — the hub. A `wizzrobe`, a `darknut`, a `siren`,
and three torches at (1,1), (8,1) and (1,6). Set the **Kilnshell** beside each
and light all three for a `rupee20` — money only, so it costs you nothing to
skip. The mooring plate on the wall is the dungeon's thesis: *"The rings in this
house were for hauling. They will haul anything that takes hold."*

**Chartstone Crypt** (`d6/0,2,5`), west — a chest with the **Chartstone**.

**Drain Court** (`d6/0,4,5`), east. Switches at (2,2) and (7,5), one block at
(2,3), and a `beamos` at (6,2) that fires whenever you line up with it. Push the
block onto the near switch and stand on the far one. **Small Key 2**.

**Three Heights** (`d6/0,3,4`). *"Three heights. One way through."* Locked —
spend a key here.

**The Keep's key economy, stated once**, because it is the only dungeon with
four of each and one of the keys is hidden: **four Small Keys, four locked
doors, in a fixed order.**

| Key | Where | Opens |
|---|---|---|
| 1 | Bone Cell `d6/0,4,6` — clear the room | Three Heights `d6/0,3,4` |
| 2 | Drain Court `d6/0,4,5` — one block, one switch you stand on | Keep Lock `d6/0,3,3` |
| 3 | Black Kiln `d6/0,4,4` — four torches | Keep Crossing `d6/1,3,3`, the door at (7,5), **east** to The Drowned Sill |
| 4 | **Buried** in The Drowned Sill `d6/1,4,3` — dredge it up | Keep Crossing `d6/1,3,3`, the door at (4,2), **north** to the boss door |

The west way out of Keep Crossing, toward the Sunken Bar, is **not** locked — go
that way freely. And note the dependency in rows 3 and 4: the key behind the east
door is the key to the north door, so there is no point standing at the boss door
wondering what you missed.

**West Crypt** (`d6/0,2,4`), west — a fairy and a `stalfos`.

**Black Kiln** (`d6/0,4,4`), east. Four torches, at (2,2), (7,2), (2,5) and
(7,5), with a `darknut` in the middle. Set the **Kilnshell** beside each in turn
and light all four for **Small Key 3** — and unlike the Torch Cell, this one is
not optional: the Keep needs all four of its keys for all four of its doors.
Bring the Kilnshell into the Abyssal Keep with you.

**Keep Lock** (`d6/0,3,3`). Locked. A `darknut` and a `wizzrobe` behind it.

**Dredge Vault** (`d6/0,4,3`). The big chest holds the **Dredge Line**.

**How it works.** *Cast* it into deep water and drag. Three separate behaviours,
and all three matter:

- **A fixed snag pulls you.** Cast at a mooring post and the Line hauls **you**
  to it, over anything — a pit included. This is the crossing verb.
- **The floor is searchable.** Dragged back across silted ground it brings up
  what the floor is holding: chests, keys, carryables, rupees, hearts — and
  **blanks are common in dredged loot and rare everywhere else**, which is how
  you supply the scrimshander rather than a way you might happen to.
- **It drags aquatic enemies onto land**, where they flop and are helpless.

Two guards define its geometry:

1. **You cannot cast while swimming or on the seafloor.** A weighted line is
   thrown from your heels. So the ground you brace on is a puzzle constraint.
2. **The cast stops dead on solid tiles.** A lintel of the Keep's own masonry
   standing across a shaft blocks the line until the sea covers it.

And the rule that makes the Keep the Keep: **the floor gives up what it is
holding only while the sea is on it.** A silted cache is searchable only at the
level where its tile reads wet. Dry crust is dragged straight over. Every other
item in this game asks you to take the water off something; the last one asks you
to put it back.

**The Slack Water** (`d6/0,5,3`), east — the teaching room. A dredger's tally on
the wall: *"Dry pan, dry line. We only ever worked it with the water in."* There
is a bell at (8,6): ring the Rod and it leans toward (4,4). Stand at **(4,6),
face up, at MID tide**, and cast. **Heart Piece 20** comes up out of the pan.

**Keep Stair** (`d6/0,2,3`), west of Keep Lock. The stairs at (8,1) go up.

### Upper floor

**Upper Keep** (`d6/1,3,5`) → **Shade Cell** (`d6/1,2,5`) west: a `wizzrobe`, a
`darknut` and a `keese`; clear them for a heart.

**Colonnade of the Drowned** (`d6/1,2,4`), north. Four **grates** seal an alcove
in this room, and the only thing in the game that retracts metal is the
**Resonance Rod** — so this alcove is the one place in the Keep that asks whether
you went and walked the Coastwise Chain. Ring the Rod and they go up. Inside, a
chest at (4,2) holds **Coilrope** (`coilrope`) — the Dredge Line reaches one tile
further. A MID charm, and at 6 Essences you will have two MID slots. A `beamos`
watches the room from (2,5). The chandler's note beside it is a warning worth
reading before you rely on the extra tile: *"More rope is more room. It is not
more sea."*

**Tideshade Hall** (`d6/1,4,5`), east of Upper Keep. Two screens wide.

> **Miniboss: Tideshade** (20 HP). Nereth's shadow, thrown ahead of him, and it
> is a preview of the boss's own trick. Phase 1: it chases at 0.7 and casts
> three-shot ink spreads after an 18-frame wind-up. **Below 55% it thins out and
> reappears**, down 50 frames, up 130, chasing at 0.95 while up and firing ink
> rings.
>
> **Fight it below HIGH.** Its rings are **eight shots at HIGH and six otherwise**
> — a third more shots to walk through for nothing. Killing it opens the door
> above.

**Mermaid Vault** (`d6/1,4,4`). The big chest holds the **Mermaid Suit**
(`cleats` level 2): **unlimited breath in sink mode, and you can push blocks
underwater**. Everything you avoided doing on the seafloor is now free.

### The crossings

Four rooms, and each is a crossing at one sea and a cache at another. The order
cannot be reversed: the stand drowns when you raise the sea to fish, and the bar
comes back down when you lower it. Each solution below is exact — the tile to
brace on, the direction to face, and the tide to do it at.

**The Drowned Stand** (`d6/1,3,4`). Enter at (4,7). The coping reads *"Stand
while you can stand. The ledge is only a ledge at low water."*

- **Cross:** stand at **(5,6), face up, at LOW tide**, and cast at the post at
  (5,2). The Line hauls you to land at (5,3).
- **Come back:** from **(6,3), face down, at LOW**, cast at the post at (6,7) and
  land at (6,6).
- **Cache:** from **(7,3), face up, at MID tide**, cast at (7,1). A `rupee20` is
  buried there.

**Keep Crossing** (`d6/1,3,3`). A `darknut` and a `keese`, and the dungeon's
last two locked doors — at (4,2) going north to the boss, and at (7,5) going
east. **West, at (0,3), is open**: go there first.

**The Sunken Bar** (`d6/1,2,3`). The Drowned Stand inside out — this one crosses
at **HIGH**, because the bar of masonry across the shaft is stone until HIGH
covers it. The tide board says so: *"The bar is down at slack and up at flood."*

- **Cross:** stand at **(7,4), face left, at HIGH tide**, cast at the post at
  (3,4), land at (4,4).
- **Come back:** from **(4,4), face right, at HIGH**, cast at (8,4), land at
  (7,4).
- **Caches:** from **(2,2), face up, at MID**, cast at (2,1) — **Heart Piece
  21**. From **(3,2), face up, at MID**, cast at (3,1) — a `rupee20`.

**The Drowned Sill** (`d6/1,4,3`). Back to a LOW crossing.

- **Cross:** stand at **(2,4), face right, at LOW**, cast at (6,4), land at
  (5,4).
- **Come back:** from **(5,4), face left, at LOW**, cast at (1,4), land at (2,4).
- **Cache:** from **(8,4), face up, at MID**, cast at (8,2) — **Small Key 4**,
  buried. This is the key that is easiest to walk past; Wrecker's Eye makes it
  glimmer.

There is a `siren` in this room at (7,5) — it surfaces to sing a shot and
submerges to dodge, so hit it while it is up or drag it out with the Line.

**Keep Gate** (`d6/1,3,2`). The boss door, and a `wizzrobe`.

**The Crossed Shafts** (`d6/1,4,2`). Two screens wide, two crossings at two
different seas, and the Boss Key at the end of them. The king's own inscription
is on the wall, and it is the only signed one in the Keep: *"You cannot hold two
seas. Nereth."*

1. Enter at (0,4). **Stand at (4,2), face right, at HIGH tide**, cast at the post
   at (8,2), land at (7,2).
2. From (7,2), sound the conch down to **LOW**. **Stand at (11,5), face right, at
   LOW**, cast at (15,5), land at (14,5).
3. To come back: **(14,5) face left at LOW** returns you to (11,5); **(7,2) face
   left at HIGH** returns you to (4,2).

A `beamos` covers the first shaft from (9,1) and a `keese` the second. The chest
at (17,3) holds the **Boss Key** — and it is guarded.

> **Guardian: Brinehulk, the Salt Colossus** (60 HP), at (17,4). A golem of
> packed salt, and the single hardest thing in the game that is not Nereth. Water
> dissolves it, and that cuts both ways:
>
> | Tide | Crust | Speed |
> |---|---|---|
> | HIGH | **soft and hittable the whole time** | ×1.55 — furious |
> | MID | flakes open for 70 frames every 240 | ×1.0 |
> | LOW | **re-crystallised into armour** | ×0.8 |
>
> It **keeps draining the vault to set itself again** — forcing LOW every 400
> frames in phase 2 and every 320 in phase 3.
>
> - **Phase 1 (above 62%).** Walks you down and **pounds the floor**: a 26-frame
>   two-armed tell, then a ring of eight salt shards along the ground. The shards
>   are slow and live a long time; walk the gaps rather than outrunning them.
> - **Phase 2 (62–32%).** **Hurls** three boulders at range and **charges** when
>   you line up, with a 22-frame tell.
> - **Phase 3 (below 32%).** Cracked apart: pounds every 110 frames with a
>   twelve-shard ring, and summons two `beetle`.
>
> **The choice is real.** At HIGH you get a permanently open target and a golem
> half again as fast; at LOW you get a slow golem you cannot hurt. **MID is the
> honest answer** for most players — a 70-frame window every four seconds against
> an enemy moving at its base speed. Go HIGH only if you have the health to trade.

Take the Boss Key back to Keep Gate.

## 17. Nereth, the Drowned King

**80 HP. Arena `d6/1,3,1`.** The `nerethIntro` scene runs first: Nereth explains
that he did not break the Bell to be cruel, but because the sea was told what to
do for a thousand years and never once asked.

**The fight is about the conch, entirely.** Each of the first three phases,
Nereth **pins the tide to one level, and while it sits where he put it he is
sealed inside his own water and nothing touches him.** Sound the conch off his
level and he is **open until he can shove it back** — on a timer you can hear
coming, since the re-pin has a 26-frame wind-up.

He is never *only* breakable by the conch: **every attack in his first three
phases ends with a recovery window** of about 55 frames. So you can fight him
badly and still win, slowly. Fight him with the conch and you win three times as
fast.

**Bring Bottled Tides.** The arena suppresses the conch in the usual way for a
boss room — the fight's own opening beat unlocks it — but he is the one thing in the game
that will fight you for the tide continuously, and a bottle is a free step when
he has just re-pinned and you are out of position.

- **Phase 1 (above 75%). Pinned to MID.** He chases at 0.5 and throws
  **three-trident spreads** every 130 frames after a 22-frame wind-up. Sound the
  conch to LOW or HIGH and he opens; hit him until he re-pins, then break it
  again. If you are stuck in the pin, punish the trident recovery.
- **Phase 2 (75–50%). Pinned to HIGH.** He **floods the keep and swims it**, fast
  (1.05), ringing the room with **ten-bubble rings** every 150 frames. A
  `wizzrobe` is summoned at the phase change and he tops them up to two. Break
  the pin **down** — LOW is further from HIGH in cycle terms than MID, so think
  about which single press you actually want.
- **Phase 3 (50–25%). Pinned to LOW.** He drains the keep to bare rock, plants
  the trident, and **sweeps beams continuously** — three beams every 22 frames,
  each volley rotated, so the whole room is being raked. He barely moves. The
  sweep never stops, so the opening here is when he **re-seats the trident**
  every 190 frames, which has a 20-frame tell. Two `stalfos` at the phase change,
  topped up to three.
- **Phase 4 (below 25%). No more pinning.** He works the sea through all three
  states **himself**, cycling it every 200 frames — and **the moment the water is
  moving, so is he: he is open for 150 frames after every cycle.** He also throws
  five-trident spreads every 100 frames, twelve-bubble rings every 170, and
  summons `keese` in pairs up to four. This is the phase that kills people. The
  windows are enormous; the ordnance in the air is enormous too. Stay at range,
  walk the ring gaps, and go in hard every time the sea turns over.

Kill him and the **Heart Container** drops, then the last shard comes away from
his crown: **Essence VI — the Drowned King's Bell**. The six find each other in
your hands and the Tide Bell is whole. *It is much smaller than the stories, and
much heavier.*

**Six Essences also upgrades every charm case to hold two.** If you are
completing the game rather than finishing it, this is the moment to go back and
rebuild all three loadouts.

## 18. Mopping up: the Abyssal approach

The Dredge Line reopens the whole map. Four things are left, and all of them are
buried or boulder-locked.

**Drowned Shore** (`overworld/0,0,0`), west of Gate of the Keep. There is a bell
at (1,5): **ring the Resonance Rod** and it leans toward the near hole. That is
(3,3), and **Heart Piece 22** is buried in it. A second hole at (6,3) has a
`rupee20`. The holes are deep at every tide level and nothing on this shore could
ever reach into them before. Note also that the Rod's note **carries twice as far
at HIGH tide**, which is what makes this shore worth revisiting rather than
solving from the doorway.

**Rustfall** (`overworld/0,3,0`), reached east from Abyss Stair via Iron Watch
(`0,3,1`). **Heart Piece 23** is sitting in the open at (2,5), with a `darknut`
patrolling.

**Witch's Hollow** (`overworld/0,1,9`), back in the Marsh. **Heart Piece 24** is
buried at (3,4), a few steps from Yarrow.

**Marsh Stair** (`overworld/0,1,5`). Four boulders. Drag them clear with the
Dredge Line — one at a time, and only the one directly in front of you — to open
the Marsh's two northern screens, Bog Stair (`0,1,6`) and Bog Head (`0,0,6`).
This is optional content by design: nothing on the critical path hangs off the
last dungeon's item.

And the remaining buried rupee caches, all of them Dredge Line work:

| Where | What |
|---|---|
| `overworld/0,3,6` Bluff Hollow (3,4) | `rupee20` — the sign says someone has been digging |
| `overworld/0,3,9` South Bluff (3,4) | `rupee20` |
| `overworld/0,11,8` Dune Corner (2,2) | `rupee20` |
| `d6/1,3,4` The Drowned Stand (7,1) | `rupee20` |

---

# Part III — 100% completion

## All 24 Heart Pieces

Four to a container; six containers from the six bosses; three hearts to start.
**24 pieces + 6 containers + 3 = 15 hearts.**

Numbered in the order this walkthrough passes them.

1. **Heart Piece 1** — `cave1/0,0,0`, Bluff Grotto, tile (2,2). Cave mouth on
   West Bluff `overworld/0,3,7` at (3,2). No requirements.
2. **Heart Piece 2** — `cave2/0,0,0`, Reef Hollow, tile (2,2). Cave mouth on
   Sunken Reef `overworld/0,6,7` at (4,3), no requirements — but the piece
   itself sits in the seafloor patch and needs **LOW tide** to reach.
3. **Heart Piece 3** — `overworld/0,10,8`, Shell Flats, tile (6,4). In the open.
4. **Heart Piece 4** — `d1/0,4,3`, The Two Gauges, tile (2,6). Behind the
   gauge door: **Anchor** puzzle, one gauge drained and one drowned at once.
5. **Heart Piece 5** — `d1/0,5,3`, Clawcrab Den. Puzzle reward — kill the
   `clawcrab`.
6. **Heart Piece 6** — `overworld/0,11,4`, Outer Coral, tile (5,5). In the
   open, on reef flat: needs **LOW or MID** tide, underwater at HIGH.
7. **Heart Piece 7** — `d2/1,4,5`, Glass Cell, tile (4,2). The room's `keese`
   are phased; hold the **Lens** to see and hit them.
8. **Heart Piece 8** — `d2/1,5,4`, Whelk Cell, tile (4,4). Behind Fork 1, east
   branch off the Bomb Vault.
9. **Heart Piece 9** — `d3/0,4,4`, Reed Cell, tile (4,6). Puzzle reward — clear
   the room.
10. **Heart Piece 10** — `d3/0,2,1`, Vestry Roof, tile (4,4). North of Bogmaw
    Hall.
11. **Heart Piece 11** — `overworld/0,2,3`, Kell Ledges, tile (6,2). Needs
    **bombs** for the Deep Cut.
12. **Heart Piece 12** — `d4/0,4,5`, Rung Gallery, tile (3,3). Inside a
    drown-wall box: **swim in at HIGH tide**.
13. **Heart Piece 13** — `d4/0,4,1`, East Overlook, tile (2,6).
14. **Heart Piece 14** — `overworld/0,6,4`, Log Drift, tile (2,5). In the open.
15. **Heart Piece 15** — `d5/0,1,5`, Drowned Cloister, tile (3,3).
16. **Heart Piece 16** — `d5/0,5,5`, Bower Cell, tile (5,1).
17. **Heart Piece 17** — `overworld/0,5,0`, Salt Terraces, tile (6,4). Behind
    the **Resonance Rod** vane gate.
18. **Heart Piece 18** — `cave4/0,0,0`, Palace Porch, tile (4,1). Cave mouth on
    Palace Mouth `overworld/0,10,1` at (4,1), behind the same vane gate.
19. **Heart Piece 19** — `overworld/0,9,0`, Palace Wall, tile (2,5). Behind the
    vane gate.
20. **Heart Piece 20** — `d6/0,5,3`, The Slack Water, buried at (4,4). **Dredge
    Line**, cast from (4,6) facing up at **MID**.
21. **Heart Piece 21** — `d6/1,2,3`, The Sunken Bar, buried at (2,1). **Dredge
    Line**, cast from (2,2) facing up at **MID**.
22. **Heart Piece 22** — `overworld/0,0,0`, Drowned Shore, buried at (3,3).
    **Dredge Line**. Ring the Rod at the bell to be pointed at it.
23. **Heart Piece 23** — `overworld/0,3,0`, Rustfall, tile (2,5). Behind the
    Maku Tree's five-Essence seal.
24. **Heart Piece 24** — `overworld/0,1,9`, Witch's Hollow, buried at (3,4).
    **Dredge Line**.

**Heart Containers**, one from each boss: `gohmaraq` in `d1/0,3,1`, `anemos` in
`d2/1,3,1`, `gloomtide` in `d3/0,3,1`, `wyverna` in `d4/0,3,1`, `rootmaw` in
`d5/0,3,1`, `nereth` in `d6/1,3,1`.

## The Coastwise Chain

See [chapter 13](#13-interlude-the-coastwise-chain-end-to-end) for the full
table. The short version, as a checklist:

- [ ] Talk to Ossa in `houseNets/0,0,0` to start it.
- [ ] Run links 2–6 along the coast between `overworld/0,4,8` and
      `overworld/0,9,8`.
- [ ] Link 7 needs the Coral Reef (`overworld/0,9,5`).
- [ ] Link 8 needs the Drowned Wood (`overworld/0,5,5`).
- [ ] Link 9 needs **bombs** for the Marsh (`overworld/0,1,9`).
- [ ] Link 10 is back at `overworld/0,4,9`, link 11 back at Ossa's.
- [ ] Link 12 is the Maku Tree, and needs **at least one Essence**.

A spent link cannot be run twice, and a link whose turn has not come trades
nothing but still speaks.

## Every item, and where it is

| Item | id | Where | Movement verb | Combat verb | Puzzle verb |
|---|---|---|---|---|---|
| Wooden / Noble / Master Sword | `sword` | L1: `intro`. L2: big chest in `cave1/0,0,0`, needs 4 Essences. L3: Maku Tree at 5 Essences (`makuMaster`) | — | The base weapon | — |
| Wooden Shield | `shield` | Village shop, 30 rupees | — | Blocks frontal shots | — |
| Moon Conch | `conch` | `intro` | Opens and closes routes as the sea moves | — | Cycles the tide field |
| Tidewright's Anchor | `anchor` | `d1/0,3,2`, big chest | Freeze a sandbar underfoot while the room floods | Chain sweeps on throw and on recall | Choose *where* the tide holds, not only when |
| Brineglass Lens | `lens` | `d2/1,4,4`, big chest | *(deliberately absent)* | Phased enemies become hittable while held | Preview the next tide level before committing |
| Bombs | `bombs` | `d2/1,5,3`, big chest | Blasts the Marsh and Cliffs gates open | Radius damage | Opens cracked walls |
| Kilnshell | `kilnshell` | `cave2/0,0,0`, big chest | Burns drift-tangle — the one obstacle nothing else touches | Sets a doorway alight; a little damage per tick to anything standing on it | Lights torches; deep water puts it out, so route around it |
| Kelp-Soled Cleats / Mermaid Suit | `cleats` | L1: `d3/0,3,3`. L2: `d6/1,4,4` | Swim the surface, or sink and walk the floor | Sink mode takes no knockback and ignores currents | Carry heavy things under surface-only barriers; L2 pushes blocks underwater |
| Squall Bellows | `bellows` | `d4/0,1,4`, big chest | Drives rafts and floating platforms | Shoves light enemies into pits and hazards | Spins wheels; holds the tide back one level in a held cone |
| Reefseed | `reefseed` | `d5/0,1,4`, big chest | A LOW pillar is a step | Wall off a charging enemy; grow one under a flier | What it becomes depends on the tide when it *finishes growing* |
| Dredge Line / Deepline | `dredge` | `d6/0,4,3`, big chest | A fixed snag hauls you across a pit | Drags an aquatic enemy onto land, helpless | The seafloor — and buried land — is searchable |
| Resonance Rod | `rod` | Maku Tree, end of the Coastwise Chain, 1 Essence | Retracts grates; bells point the way | Locks armoured enemies rigid ~90 frames | Rings all metal and crystal at once; range doubles at HIGH |
| Ferryman's Coin | `coin` | Village digger, `overworld/0,4,7`, 3 Essences | Teleport-swap with the thrown coin, priced in one tide change | An escape from a corner, or a boss re-entry | Get the coin somewhere you cannot walk, then change the tide |
| Bottled Tide | `bottle` | Case: `cave3/0,0,0`. Refills: shop, 40 rupees | Opens a route where the conch is suppressed | Changes a boss arena mid-fight | The single step is the resource |
| Chartstone | `chartstone` | One per dungeon | — | — | Marks which rooms change, and at which level |
| Dungeon Map | `map` | One per dungeon | — | — | Reveals the layout |

**Chartstone locations:** `d1/0,4,5`, `d2/0,4,4`, `d3/0,2,4`, `d4/0,2,5`,
`d5/0,2,5`, `d6/0,2,5`.
**Dungeon Map locations:** `d1/0,2,5`, `d2/0,2,5`, `d3/0,2,5`, `d4/0,2,6`,
`d5/0,2,6`, `d6/0,2,6`.

## Charms and the scrimshander

Thirty charms exist. Seven are placed by hand; the other twenty-three come out of
the scrimshander's bench.

**How to get one carved.** Bring her a **blank** — raw bone, shell, anything the
sea has finished with — and 60 rupees. She chooses what it becomes. It is ready
after **three turns of the tide**: sound the conch three times and come back.

**Where blanks come from.** Three are placed in the world, in `d1/0,2,6`,
`d2/0,2,6` and `d3/0,4,6`. After that they are a rare drop from tougher enemies —
and a **common** one in dredged loot, which is what the Dredge Line is really for
if you want all thirty charms.

**The seven hand-placed charms:**

| Charm | Case | Where |
|---|---|---|
| `splitFang` — a wider sword arc | MID | `d1/0,2,3` Weeping Wall |
| `barnacleSkin` — one free hit per room | MID | `d2/0,3,3` Cistern Cell |
| `wreckersEye` — chests and buried things glimmer | LOW | `d3/0,4,6` Bell Cell |
| `bosunsWhistle` — the conch sounds faster | MID | `d4/0,5,5` Cliffside Cell |
| `gillcarve` — unlimited seafloor breath | HIGH | `d5/0,4,5` Thicket Cell |
| `coilrope` — the Dredge Line reaches one tile further | MID | `d6/1,2,4` Colonnade of the Drowned |
| `ballastHeart` — knockback halved | MID | Village shop, 80 rupees |

**Case unlocks**, on total Essences held — not on visiting the scrimshander:

| Essences | What opens |
|---|---|
| 2 | The **LOW** case |
| 4 | The **HIGH** case |
| 6 | Every case holds **two** charms |

**The full roster.**

*LOW case — dry ground and exposed floor:* `dunerunner` (sand and salt no longer
slow you), `wreckersEye`, `saltEtched` (+1 sword damage while any part of the
room is dry), `beachcomber` (double rupee drops), `strandwalker` (slow regen on
dry ground), `dryKindling` (bombs blast wider), `gullsTally` (dropped pickups
last twice as long), `chandlersEye` (shops charge a quarter less).

*MID case — general:* `splitFang`, `ballastHeart`, `barnacleSkin`,
`quartermaster` (+2 Reefseed capacity), `lamplighter` (dark rooms less dark),
`bosunsWhistle`, `potHauler` (carrying no longer slows you), `coilrope`.

*HIGH case — submerged:* `gillcarve`, `riptideFin` (swim half again as fast),
`anemonesGift` (contact damage from sea creatures halved), `drownedLantern`
(dark rooms less dark), `pressureScar` (diving and surfacing take half as long),
`kelpBraid` (currents push half as hard), `brineSkin` (hazard damage halved),
`ballastLung` (draw the sword on the seafloor).

*Any case — the interesting ones:* `wrackbone` (double sword damage, double
damage taken), `neapCharm` (charms linger three seconds after the tide leaves
them), `fishermansRegret` (the case one level below the tide stays awake too),
`deadweight` (no current can move you, and you are slower everywhere),
`hagstone` (one hit in four passes straight through you), `seawolfsTooth` (your
sword knocks enemies twice as far).

**Two worth building a loadout around.** `fishermansRegret` effectively doubles
your live charms at MID and HIGH. `neapCharm` covers the three seconds after you
sound the conch, which is exactly the window in which most tide puzzles get you
hit.

## Caves, shops and secrets

| Place | Entrance | Holds |
|---|---|---|
| `cave1/0,0,0` Bluff Grotto | `overworld/0,3,7` (3,2) | Chest with 30 rupees; **Heart Piece 1**; big chest with the **Noble Sword** at 4 Essences |
| `cave2/0,0,0` Reef Hollow | `overworld/0,6,7` (4,3) | Big chest with the **Kilnshell**; a `rupee20` behind drift-tangle; a `rupee20` and **Heart Piece 2**, both needing **LOW tide** to reach |
| `cave3/0,0,0` Salt Pan Vault | `overworld/0,6,1` (3,2), behind the vanes | Big chest with the **Bottled Tide** case |
| `cave4/0,0,0` Palace Porch | `overworld/0,10,1` (4,1), behind the vanes | **Heart Piece 18** |

The Salt Pan Vault and the Palace Porch are the one-room ruins of what used to be
two more dungeons. Each kept the item its dungeon used to hand over. The notices
inside both are the only explanation you get.

**The Tidewatch Shop** (`houseShop/0,0,0`, from `overworld/0,4,7` at (6,4)):

| Stock | Price | Notes |
|---|---|---|
| Wooden Shield (`shield`) | 30 | One time only |
| Bombs, 4 | 20 | **Refused** until you own the bag from `d2/1,5,3` |
| Heart | 10 | |
| Bottled Tide | 40 | **Refused** until you own the case from `cave3/0,0,0` |
| `ballastHeart` charm | 80 | One time only |

The **Chandler's Eye** charm (`chandlersEye`, LOW case) takes a quarter off every
one of those prices, including the scrimshander's 60.

**Other interior rooms:** `houseHearth/0,0,0` (a small rupee pickup and two
villagers), `houseSandpiper/0,0,0` (a small rupee pickup), `houseMaku/0,0,0` (the
Maku Tree and Farore), `houseNets/0,0,0` (Ossa).

## Region gates

Six regions, four real gates, and one of them is not an item at all.

| Region | Sealed by | Opened by | Where |
|---|---|---|---|
| Sunken Marsh | Cracked cliff | **`bombs`** | `overworld/0,2,7` and `overworld/0,1,6` — both entrances |
| Cliffs of Kell, and everything north | Cracked boulder | **`bombs`** | `overworld/0,3,4` The Deep Cut |
| Salt Pans, and the Reef Palace behind them | Salt vanes | **`rod`** | `overworld/0,6,2`, `overworld/0,7,1` |
| Abyssal approach | The Keep's iron seal | **The Maku Tree at 5 Essences.** No item touches it | `overworld/0,2,2` Upper Kell, `overworld/0,2,1` Abyss Stair |
| Bog Stair, two northern Marsh screens | Boulders | **`dredge`** | `overworld/0,1,5` Marsh Stair |
| Coral Reef | *(nothing)* | — | The hop is base moveset; a one-tile chasm stops nobody |
| Drowned Wood | *(nothing by tile)* | — | Level design only |

The Keep's road being a **story** gate rather than an item gate is not
decoration. It used to be a Dredge Line gate, and the Dredge Line is inside the
Keep — the road was locked by the thing that unlocked it. The Dredge Line keeps a
real overworld verb on the Marsh Stair boulders and on every buried cache, and
nothing on the critical path hangs off it.

---

# Part IV — Appendices

## Enemy list

| id | Behaviour, and how to deal with it |
|---|---|
| `octorok` | Wanders and spits rocks along its facing axis. Approach off-axis. |
| `octorokSea` | The aquatic cousin; only present at higher tides. Drop the water. |
| `crab` | Scuttles sideways, **shielded from the front**. Hit it from the side or behind. |
| `zol` | A slime that **splits** into `gel` when struck. Kill both halves. |
| `gel` | The small half. Fast, fragile. |
| `keese` | Erratic flier; ignores terrain. Wait for it to come to you. |
| `leever` | Burrows and surfaces near you. Keep moving. |
| `bubble` | **Invulnerable** drifting hazard. Go round it. |
| `beamos` | Static; fires whenever you are in line with it. Never cross its axis. |
| `beetle` | Charges in straight lines. Stand off the line. |
| `tektite` | Hops at you across water. |
| `wisp` | Circles a point and shoots rings. |
| `urchin` | Harmless until the tide covers it, then it drifts. Deal with it at LOW. |
| `moblin` | Throws spears; retreats when you close. Close anyway. |
| `stalfos` | Skittish skeleton — **hops away from your sword**. Corner it. |
| `darknut` | Armoured knight, **only vulnerable from behind**. Or ring the `rod`. |
| `wizzrobe` | Blinks in, fires, blinks out. Hit it in the window. |
| `anglerfry` | Hangs in deep water; lunges when you swim near. Drain, or dredge it out. |
| `barnacle` | Fixed; opens to spit, shielded while shut. |
| `jellyfish` | Drifts with the tide, stings on contact. Less water, less drift. |
| `siren` | Surfaces to sing a shot, submerges to dodge. |
| `pincer` | An eel head on a tether, lunging out of its burrow. |

## Boss and miniboss list

| Boss | id | HP | Dungeon | Tide hook |
|---|---|---|---|---|
| Gohmaraq, the Tidewash Claw | `gohmaraq` | 24 | D1 | **LOW** dries the shell — the eye stays open twice as long |
| Anemos, the Crowned Column | `anemos` | 30 | D2 | **HIGH** — it feeds four times as long as at LOW |
| Gloomtide, the Bogwater Maw | `gloomtide` | 36 | D3 | **Off MID** — the current only runs at MID and it rides it. It keeps forcing MID back |
| Wyverna, the Sea Wyvern | `wyverna` | 44 | D4 | **LOW** — beached and permanently open. She refloods on a timer |
| Rootmaw, the Drowned Wood | `rootmaw` | 52 | D5 | **LOW** — roots bare and the mouth cannot shut. At HIGH it heals |
| Brinehulk, the Salt Colossus | `brinehulk` | 60 | D6, guarding the Boss Key | **HIGH** softens the crust but enrages it; MID is the honest answer |
| Nereth, the Drowned King | `nereth` | 80 | D6 | **Break his pin.** Three phases, three pins; phase 4 he cycles the sea himself |

| Miniboss | id | HP | Dungeon | Tide hook |
|---|---|---|---|---|
| Clawcrab | `clawcrab` | 14 | D1 | Faster at LOW — fight it wet |
| Reefguard | `reefguard` | 16 | D2 | **HIGH** holds its plate open far longer |
| Bogmaw | `bogmaw` | 15 | D3 | **Off MID** and it wallows |
| Ironknight | `ironknight` | 18 | D4 | **HIGH** seizes its joints — permanently open |
| Thornvine | `thornvine` | 16 | D5 | **LOW** wilts it; a third longer between volleys |
| Tideshade | `tideshade` | 20 | D6 | Below HIGH — its rings are eight shots at HIGH, six otherwise |

Three more are defined in the data and **placed in no room**: `thalassor`, the
Palace Eel, and the minibosses `saltwraith` and `gustharpy`. They are the
leftovers of the eight-dungeon layout this game was consolidated down from — the
Reef Palace and the Salt Pan Vault, which survive as the one-room ruins
`cave4/0,0,0` and `cave3/0,0,0`. You cannot fight them, and nothing in the game
asks you to.

## Tide tile reference

Outdoors, digits in a room grid mean:

| Char | Tile | LOW | MID | HIGH |
|---|---|---|---|---|
| 1 | sandbar | dry | wadeable | deep |
| 2 | tide pool | wet sand | wadeable | deep |
| 3 | shoal | dry | dry | covered |
| 4 | seafloor | walkable | — | — |
| 5 | channel | wadeable | — | — |
| 6 | reef flat | exposed | — | — |
| 7 | reef deep | wadeable | deep | deep |
| 8 | tide rock | stone | stone | drowned |
| 9 | drown wall | wall | wall | **swim over it** |
| 0 | tide grass | meadow | meadow | flooded |

Indoors:

| Char | Tile | LOW | MID | HIGH |
|---|---|---|---|---|
| 0 | sump | **open pit** | over your head | over your head |
| 1 | sluice | dry | shallow | deep |
| 2 | basin | dry | damp | shallow |
| 3 | well | shallow | deep | deep |
| 4 | drain | **open pit** | water | water |
| 5 | drowned channel | wadeable | — | — |
| 6/7 | race | wadeable | current | current |
| 8 | tide rock | stone | stone | drowned |
| 9 | drown wall | wall | wall | swim over |

Two indoor tiles are **not** digits, and that is the point of them:

- **Torrent** — deep at every level, running harder than you can swim. The only
  answer is the Cleats' floor mode.
- **Drowned bole** — a tree that stands at LOW and MID and is open water at
  HIGH. A thrown Reefseed stops at its foot and sails over it respectively.

## How this guide was verified, and what it cannot promise

Everything above is read out of the shipped data. The room keys, chest contents,
enemy placements, key counts, puzzle coordinates, boss HP totals, phase
thresholds, attack timers and tide hooks are all taken from `src/data/` and
`src/game/`, not from the design documents, and `node tools/check-guide.mjs`
proves that every room reference, item id and charm id named here resolves
against the live registry and that no Heart Piece in the data is missing from
the list.

The route claims are backed by the repo's own checkers:
`check-progression.mjs` floods the overworld in acquisition order and reaches
120/120 screens with 6/6 dungeons cleared; `check-overworld.mjs` proves each gate
seals its region and opens with its key; `check-anchor.mjs`, `check-lens.mjs`,
`check-cleats.mjs`, `check-bellows.mjs`, `check-reefseed.mjs` and
`check-dredge.mjs` each prove that the puzzle rooms in their dungeon cannot be
crossed without that dungeon's item and can be with it — which is where the exact
stand-here, face-this-way, at-this-tide solutions in Parts 8 through 16 come
from; `check-hearts.mjs` counts the pieces and the cap; `check-trade.mjs` plays
the Coastwise Chain end to end in-engine and then rings the Colonnade's grate
with the Rod that comes out of it; `check-torches.mjs` confirms something in the
engine actually emits the fire action the Kilnshell relies on, and that no
torch-gated key is ever the only key standing between a player and the room it
opens — the Coral Spire's Torch Cell key is deliberately redundant with Rising
Chamber's for exactly that reason.

### Two honest caveats, because a guide that overclaims is worse than a short one

1. **No automated run has yet played this game from the title screen to Nereth.**
   `check-playthrough.mjs` is the only tool in the project that plays rather than
   models, and it currently drives 18 of the game's 144 dungeon rooms, all in
   Dungeon 1, ending in `d1/0,5,2` after crossing the Iron Pipe with the Anchor.
   Every model says the world is completable and none of them fights a boss or
   spends a key. The walkthrough above is therefore *derived correctly from the
   data* and, past that point, not yet *walked* — treat it as a confident route,
   not as a claim that anyone has taken it end to end.
2. **The ending cutscene is written and is not wired up.** `ending` exists in
   `src/data/story.js` in full — the Bell rings, the sea goes back where it
   belongs, Farore signs off, the credits roll — and nothing in `src/` starts it.
   What actually happens when Nereth dies is the Heart Container, then the
   `essence6` scene, and then you are standing in the arena with a whole Tide
   Bell and no curtain.

Neither is a fault in the *world* this guide describes — the rooms, the items,
the puzzles and the bosses are all there and all consistent, structurally
verified end to end. They are things you should know before you set out to see
the end of it.
