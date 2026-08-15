# Items — Oracle of Tides

The authoritative item roster. Written from Part 1 of `docs/EXECUTION-PLAN.md`.
Content that disagrees with this file is wrong.

Two rules govern everything below, and they come from CLAUDE.md:

> **Every item needs three verbs** — one for movement, one for combat, one for
> puzzles. An item with fewer than two is a key wearing a costume.

> **No item may be a straight port of an Oracle item.** If the design reduces to
> "it's the hookshot but wet," it isn't done.

Each entry names its three verbs explicitly. Where an item has fewer than three,
this file says which one is missing and why that is acceptable rather than
quietly rounding up.

---

## Why the roster is what it is

The Moon Conch is a global three-state toggle bound to a button — mechanically
the Rod of Seasons. A global toggle is a *lock*, not a *tool*: the player never
combines it with anything, so every puzzle reduces to stand-somewhere,
press-button, walk.

Every item below exists to make the tide **local, deferred, or partial**, so the
player composes with it instead of flipping it. That is the axis the whole
roster is organised on:

| Item | How it bends the tide |
|---|---|
| Tidewright's Anchor | **local** — one disc of the room keeps the old level |
| Brineglass Lens | **previewed** — you see the next level before you commit |
| Kelp-Soled Cleats | **layered** — surface and seafloor are two different rooms |
| Squall Bellows | **held back** — one level, in a cone, while you stand there |
| Reefseed | **deferred** — placed now, becomes terrain after the change |
| Dredge Line | **beneath** — the floor under the water joins the playfield |
| Resonance Rod | **amplified** — the one item the tide makes stronger |
| Ferryman's Coin | **timed** — the tide change is the trigger, not the effect |
| Chartstone | **charted** — which rooms change, and at which level |
| Bottled Tide | **forced** — one step, where the conch is suppressed |

---

## The six dungeon items

| D | Dungeon | Item | Tide consequence it opens up |
|---|---|---|---|
| 1 | Tidewash Grotto | Tidewright's Anchor | Two tide levels in one room |
| 2 | Coral Spire | Brineglass Lens | Commit-blind becomes plan-first |
| 3 | Bogwater Sanctum | Kelp-Soled Cleats | Surface route vs. seafloor route |
| 4 | Cliffside Cistern | Squall Bellows | Tide you hold back by hand |
| 5 | Drowned Wood Shrine | Reefseed | Build now, use after the change |
| 6 | Abyssal Keep | Dredge Line | The floor of the world opens up |

The Keep's own reading of that last line, worked out when it was built: the line
is the only thing in the game that crosses a PIT, and a pit is the only barrier
left once the Cleats have made water a road — so a crossing is a question about
which of three tiles the tide has moved. And `DredgeLine.dragBack` searches a
tile only if it carries `F.WET | F.SLOW` at the level it resolves at, so **the
floor gives up what it is holding only while the sea is on it.** That is the
inverse of every other item here, all five of which want the water taken off
something, and it is why the Dredge Line is the last one.

---

### 1. Tidewright's Anchor — the keystone

**Owner: P5, not this document's session.** It is specified here because the
roster is one document, but it is implemented alongside the tide-field refactor
that it requires, and nothing in P6 defines it.

Throw it; it sinks and holds. Within roughly 8 tiles the tide **stays at
whatever level it was when the anchor landed**, while the rest of the room obeys
the Conch. Recall with the same button.

This converts the game's one global variable into a two-value field. A room can
be dry here and flooded there; a current can run in one half and not the other.

| Verb | What it is |
|---|---|
| Movement | Freeze a sandbar underfoot and walk it while the rest of the room floods |
| Combat | The chain sweeps on throw and on recall, damaging along its line |
| Puzzle | Choose *where* the tide is held as well as *when* |

Requires `tide.levelAt(tx, ty)`. Everything downstream reads the field, never
the scalar.

---

### 2. Brineglass Lens

**Hold** to re-render the room as a ghosted overlay at the *next* tide level —
terrain, platforms, currents, and the enemies that only exist there. **Release**
and it snaps back.

Not a convenience item. Without it the player toggles blind and finds out
afterwards whether they drowned themselves. Seasons never needed this because a
season change was visible across the whole screen; a tide change is not. The
Lens is what makes the core mechanic a puzzle rather than a coin flip.

| Verb | What it is |
|---|---|
| Movement | *Absent, deliberately.* See below. |
| Combat | Phase-shifted enemies — the tideshade and its kin — are drawn and become **hittable** while the Lens is up. Without it they are neither. |
| Puzzle | Read the next tide level's terrain before committing to it |

**The Lens is never a gate.** It is informational, and P9's brief says so
explicitly. No room may require it to be *passable*; a room may require it to be
*survivable on the first try*, which is a different thing. Its missing movement
verb is the price of that rule and is accepted, not overlooked: an item that
moved you would have to be gated on, and the moment it gates it stops being the
thing that de-risks the core mechanic.

**Level 2** widens the preview to the level *after* next (i.e. both other tide
levels, drawn in two tints).

- **Overworld use** — the Salt Pans: which pan floods at HIGH is invisible from
  the shore, and the crossing that works is not the one that looks shortest.
- **Dungeon use** — Coral Spire, its own dungeon: the Spire Well's platforms are
  authored so the LOW arrangement and the MID arrangement are both walkable and
  lead to *different* halves of the floor.

---

### 3. Kelp-Soled Cleats

**Replaces Zora's Flippers entirely.** Two modes on one item button:

- **Swim** — surface movement over `DEEP`, exactly as the flippers did.
- **Sink** — you walk on the floor *beneath* the water. Slow, no jump, no
  sword, immune to currents and to knockback, and you can carry heavy things
  down there.

Every deep room now has two solutions that fail differently. The surface route
is fast and exposed to everything that swims; the floor route is slow, safe from
currents, and blind.

| Verb | What it is |
|---|---|
| Movement | Swim the surface, or walk the seafloor — two route layers per deep room |
| Combat | Sink mode takes **no knockback** and ignores currents, so a current-swept room can be walked through under fire; the cost is that you cannot draw the sword until you surface |
| Puzzle | Carry heavy objects along the floor, under barriers that only block the surface |

**Level 2 is the Mermaid Suit**: unlimited breath in sink mode, and underwater
block pushing.

- **Overworld use** — the Drowned Wood crossings: the surface route is quickest,
  but the current sweeps you off it, and the floor route is the one that lands.
- **Dungeon use** — Bogwater Sanctum, its own dungeon: the drains are a floor
  route that only exists while the surface above them is deep.

---

### 4. Squall Bellows

A directional gust. Pushes light enemies, spins wheels, drives a raft — and,
the real verb, **while held it holds the tide back one level in a cone in front
of you**. Stop pumping and the water comes back.

Sustained, directional, and it **costs your movement while active**: you plant
your feet to use it. That tension is what a seed never had.

| Verb | What it is |
|---|---|
| Movement | Drives a raft, and shoves floating platforms into reach |
| Combat | Pushes light enemies — into pits, into hazards, off ledges |
| Puzzle | Spins wheels; holds the tide back one level in a cone, so a channel is crossable *only while you stand still and pump*, which means it cannot be the route you take yourself |

The last clause is the design: a held cone in front of you is a thing you open
for something *else* — a raft, a pushed block, a thrown Reefseed — because the
moment you walk into it, it closes.

- **Overworld use** — the Cliffs of Kell rafts: the raft only moves upwind of
  the gust, so the crossing is aimed rather than boarded.
- **Dungeon use** — Cliffside Cistern, its own dungeon: the cistern's wheels are
  the lock, and the held cone is how water is kept off a floor switch long
  enough to press it with a block.

---

### 5. Reefseed

Thrown at floor or wall; a coral pillar grows after about **two seconds**.

| Tide at the pillar | What it becomes |
|---|---|
| LOW | A climbable block — step up it |
| MID | A wall — solid, blocks movement and line of fire |
| HIGH | Submerged — swim over it, and the Resonance Rod can ring it |

**The delay is the design.** Place it, change the tide, use what it became. No
Zelda item is a time-delayed terrain placement, and the two-second wait is the
whole reason it composes with the Conch instead of replacing it.

| Verb | What it is |
|---|---|
| Movement | A LOW pillar is a climbable block, so it makes a step where there was none |
| Combat | Wall off a charging enemy mid-charge, or grow one underneath a flier |
| Puzzle | The delay: what it becomes depends on the tide two seconds from now, not the tide you threw it at |

Seeds are carried like bombs — a counted consumable that refills from grass,
pots and shops.

- **Overworld use** — the Sunken Marsh ledges: a pillar grown at LOW is the step
  up onto a shelf that has no other approach.
- **Dungeon use** — Drowned Wood Shrine, its own dungeon: rooms that require a
  pillar to be grown at one tide and used at another.

---

### 6. Dredge Line

Cast into deep water and drag. Pulls up chests, keys, carryables, or an enemy —
which flops on land, vulnerable. **If the snag is fixed, it pulls *you*.**

Absorbs the shovel and the magnetic gloves, both of which did almost nothing.
The world is water; its floor should be searchable. Landing this in the last
dungeon means the final act re-opens all five earlier regions, which is what the
Oracles do with their last item.

| Verb | What it is |
|---|---|
| Movement | A fixed snag pulls Link to it — the crossing verb, and the reason it absorbs the hookshot's job without being the hookshot. **It cannot be cast while swimming or on the seafloor**, on the same grounds the Bellows and the Reefseed refuse: a weighted line is thrown from your heels. Without that guard the item has no geometry at all |
| Combat | Drag an aquatic enemy onto land, where it flops and is helpless |
| Puzzle | The seafloor is searchable: chests, keys and carryables come up out of `DEEP` water |

The difference from a hookshot is the target class: a hookshot latches onto a
*post you can see*, a Dredge Line drags a *volume you cannot*. It is cast into
water, not at a thing.

- **Overworld use** — the Abyssal approach: the iron plug that used to want the
  Magnetic Gloves is hauled out of its socket instead.
- **Dungeon use** — Abyssal Keep, its own dungeon.

---

## Non-dungeon items

### 7. Resonance Rod — replaces the slingshot

Trading-sequence reward. Rings all metal and crystal in the room at once:
grates retract, submerged bells chime and point toward what they are tuned to,
and armoured enemies lock rigid for about 90 frames.

**Range roughly doubles at HIGH tide** — water carries the note. It is the one
item whose own power is tide-dependent, which is why it is the trading reward
rather than a dungeon item: it makes the player revisit rooms at a level they
had already written off.

| Verb | What it is |
|---|---|
| Movement | Grates retract, opening routes; submerged bells point the way |
| Combat | Armoured enemies lock rigid ~90 frames — the answer to armour, not to health |
| Puzzle | Everything metal and crystal in the room answers at once, and the radius depends on the tide |

- **Overworld use** — the Salt Pans' vanes, which used to want the Magic
  Boomerang.
- **Dungeon use** — every dungeon from the point it is acquired: grates.

### 8. Ferryman's Coin

Secret cave, three Essences. Throw it; **on the next tide change, Link and the
coin swap places.** One coin, recallable.

A teleport on a delay you control but do not own — you decide where the coin
goes and when you sound the conch, but the coin is somewhere else in the
meantime and so is your escape route.

| Verb | What it is |
|---|---|
| Movement | The swap — a teleport across anything, priced in one tide change |
| Combat | An escape from a corner, or a boss room re-entry, spent at the cost of the tide state you wanted |
| Puzzle | Get the coin somewhere you cannot walk to, then change the tide |

### 9. Chartstone — replaces the Compass

One per dungeon. Marks which rooms **change** at which tide level — information
the game already computes and currently throws away.

| Verb | What it is |
|---|---|
| Movement | — |
| Combat | — |
| Puzzle | Information only |

**This is one verb, and the three-verb rule does not apply to it.** The rule
exists for *tools* — things bound to a button that the player composes with
something else. The Chartstone is a map item: it sits beside the Dungeon Map,
is never equipped, and is read rather than used. Shipping it as a tool would be
the mistake; shipping it as what the Compass was is not. It is called out here
rather than papered over.

### 10. Bottled Tide

Consumable, from shops and drops. Forces **one tide step** in a room carrying
`noTide` — that is, a room where the conch is suppressed.

The point is boss rooms. Today a boss room switches the mechanic off wholesale
because a boss that can be trivialised by a tide change is a bad boss. With the
Bottled Tide a boss room can *keep* the mechanic and price it: one step, one
bottle, and you brought however many bottles you brought.

| Verb | What it is |
|---|---|
| Movement | Opens a route in a suppressed room — a flooded floor drains, a dry one floods |
| Combat | Changes a boss arena mid-fight, at a cost you had to carry in |
| Puzzle | The single step is the resource: a suppressed room has exactly as many tide changes as you paid for |

---

## Removed

| Item | Why |
|---|---|
| `feather` | The hop is **folded into the base moveset**. It is grammar, not vocabulary — the Oracles hand you a jump because they have to gate it, and this game gates on the tide instead. |
| `bracelet` | Lifting is **folded into the base moveset** on the context button, for the same reason. Sink mode's "carry heavy things" needs a carry verb that is not behind an item. |
| `boomerang` | Its stun is the Resonance Rod's, its fetch is the Dredge Line's |
| `hookshot` | Its pull is the Dredge Line's fixed-snag case |
| `magnet` | Absorbed by the Dredge Line |
| `shovel` | Absorbed by the Dredge Line — the floor is searchable by dredging it |
| `satchel` and all five seeds | Replaced wholesale by the Reefseed, which is one seed with a timer instead of five with none |
| `slingshot` | Replaced by the Resonance Rod |
| `flippers` | Absorbed into the Cleats; the Mermaid Suit is Cleats L2 |
| `ringbox` | P7 replaces rings with scrimshaw |

## Kept

`sword`, `shield`, `bombs`, `conch`, `map`. The sword and shield are grammar.
Bombs are the one consumable the genre cannot do without. The conch is the core
mechanic's button. The Dungeon Map is the Chartstone's sibling, not its rival.

---

## Where each item comes from

| Item | Source |
|---|---|
| Tidewright's Anchor | d1 Tidewash Grotto — **P5**. The big chest holds a Heart Piece in the meantime, so nothing is stubbed and the two sessions cannot both define it. |
| Brineglass Lens | d2 Coral Spire, Sealed Cell (bombs stay in the Bomb Vault) |
| Kelp-Soled Cleats L1 | d3 Bogwater Sanctum |
| Squall Bellows | d4 Cliffside Cistern, the Bellows Vault |
| Reefseed | d5 Drowned Wood Shrine, the Seedbed Vault |
| Bottled Tide (the case) | the Salt Pan Vault (`cave3`), off the Salt Pans — the case is what lets you carry any; refills come from shops and drops |
| Kelp-Soled Cleats L2 (Mermaid Suit) | d6 Abyssal Keep, the Mermaid Vault behind the Tideshade |
| Dredge Line | d6 Abyssal Keep, the Dredge Vault |
| Resonance Rod | The Maku Tree, one Essence |
| Ferryman's Coin | The village digger, three Essences |
| Chartstone | One per dungeon, where the Compass was |

`tools/check-items.mjs` asserts this registry is exactly the roster above —
adding or removing an item without moving this document is a test failure.

**The six-versus-eight fold is done and this table is what it settled.** The
plan has always named six dungeons and the data carried eight; the Reef Palace
and the Salt Pan Vault are one-room ruins on the overworld now, and each keeps
the item its dungeon used to hand over. The reasoning is in
`docs/DUNGEON-STATUS.md` under "The consolidation, and how it was settled".

P8 re-authored the dungeons and P9 re-gates the overworld; these placements are
the minimum that keeps every dungeon's key economy intact and P9 may still move
them.

---

## What the gates look like now

Removing three gate items would have cost the overworld three gates. Two were
repointed rather than lost, and one was deliberately given up:

**P9 re-gated this, and the reason is the most expensive bug the project has
shipped.** Two of the gates below were the Dredge Line's, which is the SIXTH
dungeon's item — and between them they held shut the Cliffs of Kell, where the
FOURTH dungeon is, and the Abyssal approach, where the sixth is. Both dungeons
were locked behind an item found inside them, so **the game could not be
finished**, and every checker in the repo was green. `tools/check-progression.mjs`
is the tool that asks the question none of them asked.

Five gates, each proved sealed-without and open-with by `check-overworld`, each
proved in-engine by `check-gates`, and the whole chain proved walkable in order
by `check-progression`:

| Gate | Key | Available after | Seals | Proof |
|---|---|---|---|---|
| Salt Pans (`saltVane`) | **Resonance Rod** | D1 — the Maku Tree gives it for one essence | the Pans and the Reef ruins | `check-gates` — and it asserts the Rod's range *doubles at HIGH*, so the same player in the same spot opens it at one tide level and not another. The only gate in the game whose key is the core mechanic. |
| Sunken Marsh (`cliffCrackedDk`) | **Bombs** | D2 — the Coral Spire's Bomb Vault | the Marsh, and the whole north-west branch above it | `check-overworld`, both directions |
| Cliffs of Kell (`seaChannel`) | **Kelp-Soled Cleats** | D3 — the Bogwater Sanctum | the Cliffs, and the Abyss above them | deep at every tide level, so no conch answers it. Was the Dredge Line's boulder, which is what made D4 unenterable. |
| Abyssal approach (`kellSluice`) | **Squall Bellows** | D4 — the Cliffside Cistern | the Keep's approach | `check-gates` proves the cone turns the wheel and a sword does not. Was a second `abyssPlug`, which is what made D6 unenterable. |
| the Keep's pocket and the bog dead ends (`abyssPlug`, `boulder`) | **Dredge Line** | D6 | pockets you come back for — **no dungeon mouth** | `check-gates`, both directions: bare hands do not lift the boulder, the line drags it clear |
| Coral Reef (`chasm`) | — | — | **nothing** | Given up on purpose. The hop is base moveset, so a one-tile chasm is crossed by everyone. `check-overworld`'s flood models the hop against `GAP_HOP_MAX_SPAN` rather than blanket-passing gaps, so the Reef's four-tile decorative chasm bands are still walls. The marker bit the chasm carried has been retired. |

**The rule the last row of that table is really about:** a gate whose key comes
from the dungeon behind it may hold a POCKET and must never hold a MOUTH. That
is the line `check-progression.mjs` draws, and it draws it by flooding the world
without each dungeon's own key and asserting that dungeon — and every dungeon
before it — is still reachable.

**One region is still ungated: the Drowned Wood (D5).** It borders the village,
the Cliffs, the dunes and the salt pans, so gating it is four seams of work;
`check-progression` prints it as a named exemption on every run rather than
hiding it. A player may walk into the fifth dungeon first, which is enterable
early and not finishable early, because the Shrine hands over the Reefseed its
own later rooms need.

## What is base moveset now, and why

Two verbs came out from behind items, and both for the same reason: they are
genre grammar, and this game gates on the tide.

- **The hop.** Walking into a one-tile gap hops it, along the same scripted arc
  the one-way ledge already used. It is not on a button, because in the source
  games the hop is what your legs do.
- **Lifting.** On the context button, which is where the Oracles put it once
  you have the bracelet. A thing already in your hands wins over everything,
  because putting it down has to be possible from any position. Note the
  consequence: A is context-first, so standing next to a pot with an item bound
  to A means the pot comes up. That was already true of talking to a villager.
