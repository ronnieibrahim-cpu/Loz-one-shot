# Oracle of Tides — execution plan

Supersedes `oracle-of-tides-rework.md`. Work from this file.

Locked decisions: **6 dungeons**, no linked-game system, single campaign,
difficulty matched to the source games, repo permanently private and personal.

Baseline: `origin/claude/oracle-tides-continued-ebfuit` @ `3d15ae4`.

---

## Part 1 — Final item roster

### Design constraints

The Moon Conch is a global three-state toggle bound to a button — mechanically
the Rod of Seasons. A global toggle is a *lock*, not a *tool*: the player never
combines it with anything, so every puzzle reduces to stand-somewhere,
press-button, walk.

Every item below exists to make the tide **local, deferred, or partial**, so the
player composes with it instead of flipping it.

Rule: every item needs a movement verb, a combat verb, and a puzzle verb. Two
minimum. An item with one is a key wearing a costume.

### The six dungeon items

| D | Dungeon | Item | Tide consequence it opens up |
|---|---|---|---|
| 1 | Tidewash Grotto | **Tidewright's Anchor** | Two tide levels in one room |
| 2 | Coral Spire | **Brineglass Lens** | Commit-blind becomes plan-first |
| 3 | Bogwater Sanctum | **Kelp-Soled Cleats** | Surface route vs. seafloor route |
| 4 | Cliffside Cistern | **Squall Bellows** | Tide you hold back by hand |
| 5 | Drowned Wood Shrine | **Reefseed** | Build now, use after the change |
| 6 | Abyssal Keep | **Dredge Line** | The floor of the world opens up |

#### 1. Tidewright's Anchor — the keystone

Throw it; it sinks and holds. Within ~8 tiles the tide **stays at whatever level
it was when the anchor landed**, while the rest of the room obeys the Conch.
Recall with the same button.

This converts the game's one global variable into a two-value field. A room can
be dry here and flooded there; a current can run in one half and not the other.
The player chooses *where* to freeze as well as *when*. Everything downstream —
dungeons, bosses, overworld shortcuts — gets a second axis for free.

Requires `tide.level` → `tide.levelAt(tx, ty)`. Do this refactor before any
content depends on the old signature.

Combat verb: the chain sweeps on throw and recall, damaging along its line.

#### 2. Brineglass Lens

Hold to re-render the room as a ghosted overlay at the *next* tide level —
terrain, platforms, currents, and the enemies that only exist there. Release
and it snaps back.

Not a convenience item. Right now the player toggles blind and finds out
afterwards whether they drowned themselves. Seasons never needed this because a
season change was visible across the whole screen; a tide change is not. The
Lens is what makes the core mechanic a puzzle rather than a coin flip.

Combat verb: reveals phase-shifted enemies (tideshade and its kin) and lets you
hit them.

#### 3. Kelp-Soled Cleats

**Replaces Zora's Flippers entirely.** Two modes on one item, toggled with the
item button:

- *Swim* — surface movement over `DEEP`, as flippers now.
- *Sink* — you walk on the floor beneath the water. Slow, no jump, no sword,
  immune to currents and to knockback, and you can carry heavy things down
  there.

Every deep room now has two solutions that fail differently. The Mermaid Suit
becomes Cleats L2: sink mode gains unlimited breath and lets you push blocks
underwater.

#### 4. Squall Bellows

A directional gust. Pushes light enemies, spins wheels, drives a raft — and,
the real verb, **while held it holds the tide back one level in a cone in front
of you**. Stop pumping and the water comes back.

Sustained, directional, and it costs your movement while active. Better tension
than any seed.

#### 5. Reefseed

Throw at floor or wall; ~2 seconds later a coral pillar grows. At LOW it is a
climbable block, at MID a wall, at HIGH a submerged thing you swim over or ring
with the Rod.

The delay is the design: place it, change the tide, use what it became. No Zelda
item is a time-delayed terrain placement. Combat verb: wall off a charging
enemy, or grow one underneath a flyer.

#### 6. Dredge Line

Cast into deep water and drag. Pulls up chests, keys, carryables, or an enemy —
which flops on land, vulnerable. If the snag is fixed, it pulls *you*.

Absorbs the shovel and the magnetic gloves, both of which currently do almost
nothing. The world is water; its floor should be searchable. Landing this in D6
means the final act re-opens all five earlier regions, which is what the
Oracles do with the last item.

### Non-dungeon items

| Item | Source | What it does |
|---|---|---|
| **Resonance Rod** | Trading sequence | Rings all metal/crystal in the room: grates retract, submerged bells chime and point, armoured enemies lock rigid ~90 frames. **Range roughly doubles at HIGH tide** — the one item whose own power is tide-dependent. Replaces the slingshot. |
| **Ferryman's Coin** | Secret cave, 3 essences | Throw it; on the next tide change you and the coin swap places. One coin, recallable. A teleport on a delay you control but don't own. |
| **Chartstone** | One per dungeon | Replaces the Compass. Marks which rooms *change* at which tide level — information the game already computes and currently throws away. |
| **Bottled Tide** | Shops, drops | Consumable. Forces one tide step in a room where the Conch is suppressed. Lets boss rooms use the mechanic selectively instead of switching it off wholesale. |

### Removed

`feather` (fold the hop into the base moveset), `bracelet`, `boomerang`,
`hookshot`, `magnet`, `shovel`, `satchel` and all five seeds, `slingshot`,
`flippers` (absorbed into Cleats), `ringbox` (replaced — see Part 2).

### Kept

Sword, shield, the jump. These are grammar, not vocabulary. Replacing them makes
it not a Zelda game.

---

## Part 2 — Scrimshaw (replaces rings)

### The system

A **scrimshander** in Tidewatch Village carves raw bone and shell into
**scrimshaw** — small passive charms. Blanks are dredged from the seafloor, dug
up, and dropped by enemies; carving costs rupees and takes a tide cycle.

The mechanic that makes it ours rather than Vasu's:

> **Scrimshaw is slotted by tide level. A charm in the LOW slot only works at
> LOW tide.**

You start with one slot (MID). The LOW and HIGH slots unlock over the game, and
a late-game case upgrade gives a second charm per level. So your loadout is
three builds, not one — and changing the tide now also changes what you're good
at. That is the whole point: the passive system stops sitting beside the core
mechanic and starts feeding it.

### Starting set — target 30–40 total, these are the anchors

**LOW slot — exposed floor, dry ground**

| Name | Effect |
|---|---|
| Dunerunner | No slowdown on sand or salt crust |
| Wrecker's Eye | Buried items and chests glimmer through terrain |
| Salt-Etched | Sword +1 damage while any part of the room is dry |
| Beachcomber | Enemies drop double rupees |

**MID slot — general**

| Name | Effect |
|---|---|
| Split Fang | Wider sword arc |
| Ballast Heart | Knockback taken halved |
| Barnacle Skin | One free hit per room; cracks until you leave |
| Quartermaster's Mark | Carry two more Reefseeds |

**HIGH slot — submerged**

| Name | Effect |
|---|---|
| Gillcarve | Unlimited breath in sink mode |
| Riptide Fin | Swim speed +40% |
| Anemone's Gift | Aquatic contact damage halved |
| Drowned Lantern | See in flooded dark rooms |

**Cross-slot — the interesting ones**

| Name | Effect |
|---|---|
| Wrackbone | Double sword damage, double damage taken |
| Neap Charm | Your charms stay active 3 seconds after the tide leaves their slot |
| Fisherman's Regret | The charm one slot *below* the current tide also stays active |
| Deadweight | Immune to all currents, 15% slower everywhere |

`Neap Charm` and `Fisherman's Regret` are the design payoff — they make the
player think about the *transition* between tide states rather than the states
themselves.

---

## Part 3 — The prompts

One prompt = one session = one branch = one `/clear` afterward. Do not chain.

### P0 — Establish a trunk (done)

```
This repo has an empty `main` (14-byte README) and seven divergent `claude/*`
branches, two of which are byte-identical. All real work is on
`claude/oracle-tides-continued-ebfuit`. Any session starting from `main`
starts from nothing.

Do this and nothing else:
1. Diff every `claude/*` branch tip against
   `claude/oracle-tides-continued-ebfuit`. Report a table: files only on that
   branch, files that differ, and whether the difference is work that would
   be lost.
2. Merge anything unique and worth keeping onto the continued branch. Do not
   squash.
3. Fast-forward `main` to the result; make it the default branch.
4. Delete branches that are now strictly ancestors.
5. Add docs/BRANCHING.md: `main` is trunk, sessions branch from it.

The repo is private and permanently personal. Do not add a LICENSE, a public
README, or any publication scaffolding. Do not touch game code.
```

### P1 — Feel spec, seeded RNG, replay harness (done)

```
The engine has no ground truth for how it should feel, so every constant is
someone's guess. Build the missing layer.

1. Create docs/FEEL-SPEC.md and src/data/feel.js. feel.js is the single source
   of every timing and speed constant: walk speed, swim speed, sword swing
   frames, active-hitbox window, invulnerability frames, knockback distance
   and duration, ledge hop duration and height, room transition frames, enemy
   turn cadence, projectile speeds. Each export gets a unit and a provenance
   comment: measured, derived, or guessed. Everything currently in the
   codebase is `guessed` until proven otherwise — say so.
   Delete the module-level constants from src/game/player.js, entity.js,
   game.js and the enemy toolkit; import from feel.js instead.
2. Replace all 20 Math.random() call sites with a seeded PRNG (src/core/rng.js,
   mulberry32). One global stream seeded from the save, plus a per-room derived
   stream so a room replays identically. Add a check to tools/test.mjs that
   greps src/ for Math.random and fails.
3. Add tools/replay.mjs: record an input sequence plus seed to JSON, replay it
   headlessly, assert final player position and health match to the pixel.
   Commit two replays — a walk across the village, and a full D1 clear.

Determinism is the prerequisite for every fidelity claim after this.
```

P1 landed `src/data/feel.js`, `docs/FEEL-SPEC.md`, `src/core/rng.js`,
`tools/replay.mjs` and two committed replays. One thing it did **not** land:
the second replay is `d1-descent`, a real run through Tidewash Grotto that
stops at the north-half locked door, not a full clear. Finishing it needs a
push directive, a boss routine that reads `weakOpen`, and a jump verb — see
`docs/NEXT-SESSION.md`. Do not fake it by granting keys in the replay's setup.

### P2 — Root-cause the intermittent test (done)

```
docs/HANDOFF.md says tools/test.mjs intermittently fails "all three tide levels
reachable" and attributes it to load-related flakiness, because it passes on
re-run and the failing commits touched only sprite and audio data.

That reasoning is backwards. A test whose result depends on which asset file
changed has a real ordering or async-initialisation dependency, and passing on
re-run is the signature of one.

1. Run the assertion 200 times with the seeded RNG from P1 and a fixed seed.
   If it still varies, instrument the initialisation order of
   registerPalettes, sprite baking, installEnemies and the first setRoom.
2. Fix the cause. Do not add a retry.
3. Delete the paragraph in HANDOFF.md that rationalises it.
```

It was neither load flakiness nor an initialisation order: `hold(key, n)` in
`tools/test.mjs` did not hold a key for n game frames. The wall-clock loop kept
stepping the game through every CDP round trip, so a busy machine walked Link
about twice as far, onto the village child — and A is the context button before
it is the item button, so `x` opened a text box instead of sounding the conch.
`test.mjs` now takes the clock with `window.__harness.takeOver()` and pins the
save seed with `?seed=`. Full write-up in `docs/NEXT-SESSION.md`.

### P3 — Fixed-point movement and the sword-hold

```
src/game/player.js uses floating-point positions (WALK_SPEED = 1.35) and
normalises diagonals by Math.SQRT1_2. Both are wrong for a GBC Zelda and both
are load-bearing.

1. Move all entity positions to 8.8 fixed-point: integer subpixel accumulator
   plus derived integer pixel position. Speeds become subpixel steps per frame.
   Rendering reads the integer, so src/gfx/art.js's `x | 0` goes away — note it
   currently truncates toward zero and misrounds by a pixel whenever an entity
   crosses x=0, which happens on every room transition.
2. Remove the diagonal normalisation. The GB Zeldas apply full speed on both
   axes, making diagonal measurably faster than cardinal. That asymmetry is a
   signature of how the source games feel. Record it in FEEL-SPEC.md.
3. Re-derive WALK_SPEED. 1.35 px/frame is not representable as a clean subpixel
   step, which is why checkRoomExit needs an M = 3 margin to fire at all — the
   player can never land on a tile boundary. Pick a value that divides the 16px
   tile evenly at 60fps, drop the exit margin to 1, delete the hack comment.
4. Add the missing sword-hold state. In the Oracles, holding the sword button
   keeps the blade extended and you walk with it out: contact damage, a clink
   off walls, a distinct pose. Currently holding only charges a spin, so the
   most-used verb in the game has a third of its behaviour missing.
5. Re-record the P1 replays and diff tools/shots-link-baseline/.
```

### P4 — Grid-lock enemy motion

```
Enemies in src/data/enemies.js move on floating-point velocities and turn on
per-frame random rolls. In the GB Zeldas most ground enemies move in fixed
increments and only change direction when aligned to the grid. That alignment
is why an Octorok's shot is dodgeable and why a room of them reads as patterned
rather than noisy.

1. Rewrite wander, patrol, chase and hop in src/game/enemy.js so a direction
   change can only occur at an 8px boundary, and so the decision draws from the
   seeded per-room RNG on a fixed cadence rather than a per-frame probability.
2. bounceDiag, orbit and charge keep continuous motion — they should feel
   different.
3. Knockback in Entity.hurt decays exponentially (*= 0.84). The GB Zeldas use a
   fixed distance over a fixed frame count. Replace it; put both numbers in
   FEEL-SPEC.md.
4. Add tools/check-motion.mjs: spawn one of each enemy in an empty room, run
   600 deterministic frames, assert every ground enemy is 8px-aligned on every
   frame it is not mid-step.
```

### P5 — The tide becomes a field

```
game.tide.level is a single global integer read from about forty call sites.
The new item roster needs it to be spatial. Use plan mode; show me the plan
before executing.

1. Change the tide to a field: tide.levelAt(tx, ty) returning 0-2, as a base
   level plus a list of active local overrides. tide.level stays as the base;
   audit every call site — most want levelAt at the entity's tile, only music,
   HUD and save genuinely want the base.
2. Implement the Tidewright's Anchor: a thrown entity registering an override
   of radius 8 tiles at the level current when it lands, deregistering on
   recall. It must survive a cancelled room transition and must never strand
   the player (reuse findSafeTile).
3. Update tools/check-overworld.mjs, walk-dungeons.mjs and solve-switches.mjs
   to reason over the field rather than the scalar.
4. Add a replay proving a room simultaneously LOW in one half and HIGH in the
   other, walked end to end.

Do this before any other new item.
```

### P6 — The item roster

```
Write docs/ITEMS.md from the roster in the execution plan, then implement it.

Order: Brineglass Lens, Kelp-Soled Cleats, Squall Bellows, Reefseed, Dredge
Line, Resonance Rod, Ferryman's Coin, Chartstone, Bottled Tide. The
Tidewright's Anchor is already done in P5.

Each needs: an entry in src/game/items.js, a sprite in sprites-gear.js, an
icon, a desc, and at least one overworld use and one dungeon use.

Remove: feather (fold the hop into the base moveset), bracelet, boomerang,
hookshot, magnet, shovel, satchel and all five seeds, slingshot, flippers
(absorbed into Cleats), ringbox. Keep sword, shield.

Every removal breaks room data. Run node tools/validate.mjs and
node tools/walk-dungeons.mjs after each item and fix grids as you go. Do not
batch nine items and then untangle 303 rooms at once.
```

### PT — Towns, buildings and terrain polish

**This is a top design priority, not a cosmetic pass.** The world currently has
villages that are a name on a signpost and a few doors cut into a cliff. The
Oracles' towns read as places people live — roofs, shopfronts, wells, fences,
crates, washing, NPCs standing around them — and that is most of what makes
their overworld feel like a world rather than a level. We own the tileset that
does it and have taken exactly one thing off it.

```
Give Thalassia towns that look lived in.

THE RESOURCE IS ALREADY IN THE REPO and is the only true tileset we have:
assets/sheets/oracle-seasons-tileset-subrosia.png — 16 cells wide, 163 rows,
phase 0. Everything else in assets/sheets/ is an assembled map you have to find
a grid phase in. The town kit on it is inventoried with cell coordinates in
assets/sheets/README.md under "The town kit on that tileset": three roof
colours, a signed SHOP front, doors, an enterable dark doorway, windows,
crates, barrels, a stone well, a picket fence run, stumps — repeated per season
down the sheet, which for us is a palette resource rather than a season one.

1. A BUILDING IS NOT A TILE. They are 3 wide and 2-3 tall. This is the same
   problem the 32x32 trees had, and `quad:` in src/world/tileset.js plus QUADS
   in tools/rip-terrain.py is the solved half of it — generalise that to an
   arbitrary w x h block rather than cutting a building into nine unrelated
   tiles that authors have to reassemble by hand and can place wrong. The tree
   is the worked example to read first.

2. Extract the kit through tools/rip-terrain.py, into src/data/tiles-terrain.js
   like everything else. Never hand-edit the generated file. The dark doorway
   at c8,r9 is the enterable one and wants F.WARP; the rest of a building is
   SOLID.

3. Re-author the villages. Tidewatch Village (overworld 0,4,7) and its
   neighbours first, then every settlement named in docs/GAME-PLAN.md. A
   village screen should have: buildings with fronts you can walk up to, at
   least one enterable door wired to an interior room, and dressing — a well,
   crates, a fence, a stump — placed as if someone put them there for a reason.
   Interiors already exist as a legend (`house`); wire the doors to them.

4. Populate them. assets/sheets/oracle-seasons-nonhuman-races.png has not been
   extracted from at all and carries the Maku Tree, the Great Fairy and rows of
   NPC races. Original townsfolk are ours to design; their SPRITES should come
   off that sheet where it has something that fits, per the extract-first rule.

5. Then the terrain backlog, in the order docs/NEXT-SESSION.md ranks it. The
   `cliff` family is the big one — one extraction covers eight tiles — and it
   is a content decision, not a swap: the Oracles build a cliff from several
   tiles and this game spends one tile on all of it.

CONSTRAINTS
- A building is SOLID and a town is a maze of them. Run node tools/validate.mjs,
  node tools/walk-dungeons.mjs and node tools/check-overworld.mjs after EVERY
  screen you re-author, not at the end — a solid tile can strand a screen while
  rendering perfectly and validating clean. See CLAUDE.md, traps.
- Seams are checked at all three tide levels. A building placed on a screen
  edge changes what the neighbouring screen must have facing it.
- Do not let a town swallow a region gate. check-overworld proves the gates in
  both directions; keep it green.
- Screenshot every town you finish (node tools/test.mjs --shots) and LOOK at
  it. A village that validates and reads as scattered furniture is not done.
```

### P7 — Scrimshaw

```
Replace the ring system with scrimshaw, per Part 2 of the execution plan.

Passive charms slotted by tide level: a charm in the LOW slot only works at LOW
tide. One slot (MID) at the start; LOW and HIGH unlock over the game; a late
case upgrade gives a second charm per level.

1. src/game/scrimshaw.js replacing rings.js. Slots are part of save state.
2. Implement the 16 named charms from the plan. Add enough more to reach 30 —
   original, tide-flavoured, and each stated in one line.
3. A scrimshander NPC in Tidewatch: hand over a blank plus rupees, get a carved
   charm after one tide cycle. Blanks drop from the Dredge Line, digging, and
   enemies.
4. Menu screen showing three slots stacked as tide levels, with the active one
   highlighted. It must be legible at 160x144 with the existing font.
5. Delete src/game/rings.js and every reference.
```

#### P7 is CLOSED. Its leftovers are P8's, one per dungeon session

Decided after the D1 audit below: P7 is done and there will be no P7 follow-up
session. Everything still owed on scrimshaw is work that only makes sense with a
dungeon in front of it, so each item is assigned to the P8 session that reaches
it. **One has a deadline: the case-unlock question must be settled in the D2
session**, because the LOW case opens at two essences and D2 is the second one.
Ship D2 without deciding and there is a real save state in which the player owns
charms they can never switch on.

| Owed | Whose session | Why there |
|---|---|---|
| Decide whether the cases open on the essence or on talking to the scrimshander | **D2 — cannot slip** | Two essences is where the second case is meant to appear |
| Place a charm per dungeon, in a case that dungeon's player has open | every session | D1 did it (Split Fang, `0,2,3`); `check-charms.mjs` prints the running list |
| Look at the CHARM screen, the carve dialogue and one charm's effect on a real screen | first session that boots the game to play it | It needs eyes, not a harness |
| Compare charms for value | D4 or later, once the roster has been met in play | Balancing thirty passives against no play data is guessing |
| Settle `NEAP_GRACE_FRAMES` | whichever session plays the tide transitions | It is the width of the transition window the two cross-slot charms live in |

Add to every remaining P8 prompt: **audit the dungeon against the charm gating
the way D1 was.** Which cases does the player have open here, does this
dungeon's tide theme leave them awake or dark, and is the charm you placed one
they can actually use? That is a five-minute check and it is the thing that
keeps scrimshaw a system rather than a menu.

#### P7 audit (done during P8/D1) — what is built, and what was still missing

Against the five numbered items of the brief, P7 is **functionally complete**,
and each claim below has a checker behind it rather than a reading of the code:

1. `src/game/scrimshaw.js` exists, `rings.js` is gone, and the slots are save
   state — `progress.charmSlots/charmOpen/charmCase`, carried through `migrate`.
2. Thirty charms, every one proved in-engine and none orphaned:
   `check-charms.mjs`, 63 assertions.
3. The scrimshander stands in Tidewatch (`overworld 0,4,7`, asserted), takes a
   blank plus `CARVE_PRICE`, and finishes after `CARVE_TIDE_TURNS` turns of the
   tide counted in `onTideChanged`.
4. The CHARM menu screen exists and draws three cases stacked as tide levels.
5. No reference to a ring survives; `i_ring` came out of `rip-hud.py`'s map.

Three things stand between that and complete **as a played system**, and none of
them is a code gap:

- **The cases open on TALKING to her, not on the essence.** `checkUnlocks` is
  called from `Scrimshander.interact` and nowhere else, so a player who never
  walks back into Tidewatch finishes the game with one case and never learns the
  system had three. This is the only one of the three that is arguably a defect
  rather than a missing session, and it is a design call: open the case when the
  essence lands and let her line be the acknowledgement, or leave the visit as
  the beat and signpost it somewhere.
- **Nobody has watched the CHARM screen, the carve dialogue or a single charm's
  effect on a real screen.** Everything is checker truth.
- **No two charms have been compared for value.** The Hagstone (one hit in four
  ignored) is almost certainly the strongest thing in the game.

And one that P8 is closing dungeon by dungeon: **placement**. Before D1 exactly
one charm was placed by hand in the whole world (the shop's Ballast Heart). D1
now places Split Fang in `0,2,3`, and `check-charms.mjs` prints the list of
hand-placed charms every run so the number is visible rather than assumed.

#### How D1 fits the P7 gating, and the one thing that does not

At D1 the player holds 0 essences on the way in and 1 on the way out, so
`CHARM_LOW_ESSENCES = 2` means **the MID case is the only case open for the whole
of the first dungeon, and it holds one charm.** Two consequences:

- A charm placed in D1 must be a MID charm. A LOW or HIGH one would be a reward
  the player cannot switch on until after D2 — which is why D1's chest holds
  Split Fang and not, say, the Wrecker's Eye. `'any'` does not help: a cross-slot
  charm is only live in the case it is sitting in.
- **A charm is dark for most of D1, and D1 is the reason.** A charm is live only
  while the water under the player's feet matches its case, and this dungeon's
  whole design is "take the sea down to LOW and walk it". So the player's one
  passive switches itself off at exactly the moments the dungeon is teaching.
  Nothing breaks — it is the rule working as written — but it means the charm
  system reads as unreliable on first contact.

  Three ways out, and it is a decision, not a bug fix: (a) leave it, and let the
  first dungeon teach that charms are tide-shaped; (b) open the LOW case on the
  first essence instead of the second, which re-paces the whole game; (c) hand
  the player the Neap Charm early, since its whole job is holding a case awake
  across the turn of the tide. (c) is the cheapest and the most in keeping, and
  it wants `NEAP_GRACE_FRAMES` settled by play first.

  The one place the rule pays off inside D1 is worth knowing: gate `0,2,2` is
  crossed by holding a patch at MID and dropping the base to LOW, and a player
  standing in that patch keeps their MID charm awake while the rest of the room
  is drained. That is the Anchor's second use working exactly as P7 intended.
P7.5 — Dungeon tilesets from the map rips

Effort: medium. Mechanical extraction with one judgement call.

Read CLAUDE.md, docs/ART-DIRECTION.md and docs/EXECUTION-PLAN.md first.
Branch off main.

I have uploaded four Oracle of Seasons dungeon map rips to assets/sheets/:
Ancient Ruins, Explorer's Crypt, Poison Moth's Lair, and Dancing Dragon
Dungeon. These are stitched FULL-FLOOR MAPS, not tilesheets — every 16x16
cell in them appears many times over. The existing rip tooling expects a
tilesheet, so it does not apply unchanged.

FIRST, a decision that governs everything after it, and getting it wrong
poisons every dungeon: each of these images contains the SAME map twice,
side by side. The left half is labelled "GBC LCD Colors" and the right half
"True Colors". They are different palettes — the left is corrected to
simulate how the physical GBC screen displayed the game, the right is the raw
palette from the ROM.

  1. Determine which register the sheets ALREADY in assets/sheets/ came from,
     by sampling a tile that appears in both an existing sheet and one of
     these maps and comparing RGB. Report what you find with the numbers.
  2. Take the matching half of every new map. Never mix. If the existing
     sheets turn out to be inconsistent with each other, STOP and tell me —
     that is a decision for me, not for you.
  3. Record the choice and the evidence in docs/ART-DIRECTION.md so no future
     session has to re-derive it.

THEN build tools/rip-dungeon-maps.py alongside the existing rip tooling:

  4. Crop to the chosen half. The maps have a green (0,255,0)-style
     background between rooms — detect and exclude it rather than
     hardcoding coordinates.
  5. Grid the map into 16x16 cells and deduplicate them, hashing on exact
     pixel content. Emit one deduplicated tileset PNG per dungeon plus a
     JSON manifest recording, for each unique tile, how many times it
     occurred and one map coordinate where it appears — frequency is how I
     will tell a wall from a one-off decoration.
  6. Discard the appendix strips at the bottom of each map (minimap panels,
     item icons, enemy sprites) — those are not terrain. Detect them by
     their position below the last room row, and log what you discarded so I
     can check nothing useful went with it.
  7. Byte-identical on a second run, asserted in a checker.

THEN integrate:

  8. For each dungeon tileset, map the recurring tiles into the game's
     legend/tiledef system with flags — floor, wall, pit, water, block,
     stairs, door. Do NOT guess a flag from appearance alone where the
     source map shows the tile in use; cite the map coordinate you inferred
     it from in the tiledef comment.
  9. Do NOT author any room with these yet. This session produces tilesets
     and tiledefs only. P8 uses them.

Frequency-order the work and STOP after the 60 most common tiles per
dungeon. Log the rest in docs/ART-BACKLOG.md.

Every checker green. npm run build, commit dist/, update NEXT-SESSION.md and
HANDOFF.md.
P7.6 — Multi-screen dungeon rooms

**DONE.** All seven steps, plus the two additions in `docs/briefs/P7.6-PROMPT.md`.
The brief below is kept as the record of what was asked for; what was built is
described in "ROOM SIZE — everything a dungeon session needs, in one place" in
the P8 section, and that is the section to read, not this one.

Effort: high. Use plan mode. Show me the plan before executing.

Read CLAUDE.md and docs/EXECUTION-PLAN.md first. Branch off main. Use plan
mode and show me the plan before you touch code.

CONTEXT, and the boundary matters more than the feature:

The GBC Zeldas use 16x16 tiles with a 10x8-tile screen, and the OVERWORLD is
a grid of exactly those screens with a scroll transition on each seam. That
is what this engine already does and it is correct. Do not change it.

DUNGEONS are different. Flagship designed many Oracle dungeon rooms LARGER
than the 160x144 screen, with the camera following Link inside the room and a
transition firing only at a room boundary — the wide multi-screen halls in
Poison Moth's Lair and the long lower corridors of Ancient Ruins are the
clearest examples, and both are in the map rips in assets/sheets/. This
engine cannot express them: every room is hard-coded to 10x8 and every seam
is a transition. That is the fidelity gap this session closes.

SCOPE:

  1. A dungeon room gains a size in screens: {sw, sh}, defaulting to 1x1.
     Support 1x1, 2x1, 1x2, 2x2 and 3x1. Do not support arbitrary sizes —
     an unbounded room size is a different game and a much larger change.
     Overworld rooms remain 1x1 and the code path must make that structural,
     not conventional.

  2. Camera. Inside a multi-screen room the camera follows Link and clamps to
     the room's bounds. Match the source's behaviour: the camera should not
     be centred on Link at all times — it should hold still until he
     approaches an edge, then move. Put the deadzone dimensions in feel.js
     tagged `guessed` and add a debug key to visualise the deadzone box, for
     the same reason the anchor radius got one: this is settled by play.

  3. Rendering. The room render cache is currently one screen-sized canvas.
     A 3x1 room is 480x128 — cache the whole room and blit the camera
     window, rather than re-rendering per frame. Keep the existing cache-key
     discipline exactly as P5 left it; the tide field and the camera must not
     both be able to invalidate it incorrectly.

  4. Transitions. checkRoomExit fires only at the ROOM boundary, not at an
     internal screen seam. Verify by walking a 2x1 room end to end and
     asserting exactly one transition fires. This is the single most likely
     bug in the session.

  5. Every checker must reason over rooms of arbitrary screen size:
     validate.mjs, walk-dungeons.mjs, solve-switches.mjs, find-ledges.mjs,
     and the P5 anchor strand-and-gate checks. The anchor's frozen disc does
     not change size — a radius that split a 10x8 room will split a 20x8
     room differently, and that is a design consequence I want, not a bug to
     correct.

  6. Chartstone and the dungeon minimap must render a multi-screen room as
     one room occupying the right number of grid cells, the way the source's
     dungeon maps do.

  7. Convert exactly ONE existing room to 2x1 as proof, and add a replay that
     walks it end to end asserting a single transition. Do not convert any
     other room — P8 does that with design intent.

CONSTRAINTS:

  - Both existing replays must pass unchanged. Nothing here may alter a
    single pixel in a 1x1 room.
  - Room grid data format must stay backward compatible: an existing 10x8
    grid with no size declared is a 1x1 room.
  - Overworld behaviour is byte-identical before and after.

npm run build, commit dist/, update NEXT-SESSION.md and HANDOFF.md.
Amendment to P8

Add to each dungeon session prompt:

Rooms may now be 1x1, 2x1, 1x2, 2x2 or 3x1 screens. Use the larger sizes
deliberately, not decoratively: a multi-screen room should exist because the
puzzle or the fight needs the space, and a dungeon where every room is 2x2
reads as flat as one where every room is 1x1. Reference the map rips in
assets/sheets/ for how Seasons paces this — most rooms are one screen, and
the large ones land on set pieces.

Use the tilesets from P7.5 for this dungeon's visual identity. Each of the
six dungeons should be identifiable from a single screenshot.
### P8 — Dungeon re-authoring (six sessions, one per dungeon)

```
Re-author dungeon N against docs/ITEMS.md and the dungeon table in the
execution plan. The game is six dungeons now, not eight — fold the two removed
dungeons' best rooms into their neighbours rather than deleting them outright.

Constraints:
- 22-32 rooms across 1-3 floors.
- The dungeon's item is found roughly halfway through, and every room after it
  requires the verb that item introduced.
- The tide theme in the table is the constraint, not a suggestion. If a room's
  puzzle would still work at a fixed tide level, it is the wrong puzzle.
- Chartstone and 2-4 small keys plus a boss key. One miniboss two thirds
  through. One Heart Container from the boss room's onEvent('bossDead').
- Essence index equals the dungeon number.

Rooms may now be 1x1, 2x1, 1x2, 2x2 or 3x1 screens. Read "ROOM SIZE —
everything a dungeon session needs, in one place" below before authoring one:
it has the grid width each size implies, the anchor-gate arithmetic restated
as a sizing rule, the pacing number (at most one room in six larger than 1x1,
at most one per dungeon larger than 2x1), and the worked example to copy.

Use the tilesets from P7.5 for this dungeon's visual identity. Each of the
six dungeons should be identifiable from a single screenshot.

Audit the dungeon against the charm gating, the way D1 was: which cases does
the player have open at this point in the game, does this dungeon's tide theme
leave them awake or dark, and is the charm you placed in it one they can
actually slot? See "P7 is CLOSED" above for what each session owes.

Any room that claims to need the dungeon's item should DECLARE that in its room
data and be proved by a checker, both ways — impossible without the item,
possible with it. tools/check-anchor.mjs is the worked example.

Run validate.mjs, walk-dungeons.mjs and solve-switches.mjs after every room you
change, not at the end.
```

#### P8 status: D1 done (D2's table is the section after ROOM SIZE)

**D1, Tidewash Grotto — DONE.** 24 rooms, one floor, re-authored around the
Tidewright's Anchor. Against the constraint list above:

| Constraint | D1 |
|---|---|
| 22-32 rooms, 1-3 floors | 24 rooms, 1 floor |
| item roughly halfway | the Anchor is room 12 of 24, in `0,3,2` |
| every room after it requires the item's verb | every post-item room is behind at least one anchor gate; 5 of them are anchor rooms in their own right. Two exceptions are stated below |
| tide theme is the constraint | three gate corridors and two gauge rooms, all proved impassable at every fixed level by `tools/check-anchor.mjs` |
| Chartstone, 2-4 small keys, boss key | Chartstone in `0,4,5`; 3 keys, 3 locks; Boss Key in `0,2,1` |
| miniboss two thirds through | Clawcrab in `0,5,3`, room 17 of 24 (71%) |
| Heart Container from `bossDead` | unchanged, `0,3,1` |
| essence index = dungeon number | 1 |
| multi-screen rooms | one: the Clawcrab Den `0,5,3` is 2x1 (converted by P7.6 as the worked example). The other 23 are 1x1 |

Two honest exceptions to "every room after it requires the verb": `0,5,2` (the
anglerfry pool) is a fight the tide is a weapon in, crossable by its dry ring
with no iron at all; and `0,3,1` is the boss room. Both are *reached* only
through a gate, so no post-item room can be entered without the Anchor.

**What D1 taught about the item.** The held patch is 5x5 and the throw carries
two tiles, so one gate consumes a whole room row and the rest of the room has to
be walled off to stop the player walking round it. That is why D1's gates are
bare corridors and why no room holds two of them. The Anchor did not have room
to be interesting in a 10x8 screen. **P7.6 is now built**, and the section below
is the only thing a D2-D6 session needs to read about room size.

#### P8 status: D1-D4 done, D5 and D6 outstanding

**The live board is `docs/DUNGEON-STATUS.md`** — statuses, the commit each
finished dungeon landed in, the "done" checklist, and every outstanding dungeon
as a to-do. This section is the reasoning behind the ones that are finished;
that file is the state, and it is the one to update.

Every finished dungeon was checked against the constraint list by counting the
live map data, not by reading these tables back, and every checker in CLAUDE.md
was re-run green afterwards. **D5, the Drowned Wood Shrine and the Reefseed, is
the next action item.** None of D1-D4 wants re-authoring; each solved a
different shape of problem and the write-ups below are what a D5-D6 session
reads instead of rediscovering them.

**D4, Cliffside Cistern — DONE.** 24 rooms, one floor, re-authored around the
Squall Bellows. Against the constraint list above:

| Constraint | D4 |
|---|---|
| 22-32 rooms, 1-3 floors | 24 rooms, 1 floor |
| item roughly halfway | the Bellows are room 12 of 24, in `0,1,4` |
| every room after it requires the item's verb | five rooms hold sills and every other post-item room sits behind one — no room in the second half is enterable without turning a wheel |
| tide theme is the constraint | every sill needs the sea at one level to be stood in and one level lower to be worked, and the conch can only say one of those. `tools/check-bellows.mjs` proves per sill that no fixed level solves it |
| Chartstone, 2-4 small keys, boss key | Chartstone in `0,2,5`; 3 keys, 3 locks; Boss Key from the two wheels in `0,4,2` |
| miniboss two thirds through | the Ironknight in `0,5,3`, room 17 of 24 (71%) |
| Heart Container from `bossDead` | `0,3,1` |
| essence index = dungeon number | 4 |
| multi-screen rooms | two: the Cistern Floor `0,4,4` and the Ironknight Gallery `0,5,3`, both 2x1 — one room in twelve. The other 22 are 1x1 |

**What D4 taught about the item, and it is the Anchor's problem inverted.** The
Anchor's held patch persists and can be walked away from. The Bellows' cone
lasts exactly as long as the button is down and it costs you your feet, so
anything it opens has to be used by something that is not you. The Cistern's
answer is a paddle wheel that is DROWNED — it does not catch wind under deep
water — so the one held breath has to blow it and take the water off it at the
same time, three tiles away.

That is buildable in two shapes and the dungeon uses both, which is what keeps
five sills from being one idea five times:

* **The sump shelf, worked at MID.** `0` (dSump) is a pit at LOW and deep above
  it, so the shelf is standable only from MID up; `3` (dWell) is shallow at LOW
  and drowned above it, so the cone frees the wheel only from MID down.
* **The drown-wall shelf, worked at HIGH.** `9` is stone until HIGH covers it;
  `1` (dSluice) is dry, then wading, then drowned. The shelf opens at HIGH and
  the wheel smothers at HIGH, and one level of cone is exactly the difference.

**The reusable lesson for D5-D6: a held item's room is a room you are not in.**
Ask what acts while the player stands still, and build the room around that
rather than around the player's own route.

**And two engine facts D4 needed.** `Tide.blows` stops the cone at anything
solid — wind does not blow through stone, and without it every wheel needs a
three-tile exclusion zone in four directions rather than a mouth. And
`GustWheel` now restores its own open state from the save; it wrote the flag
from the first day and never read it back, so a wheel you turned was shut again
when you came back to the room while the door it opened stayed open.

**D3, Bogwater Sanctum — DONE.** 22 rooms, one floor, re-authored around the
Kelp-Soled Cleats. Against the constraint list above:

| Constraint | D3 |
|---|---|
| 22-32 rooms, 1-3 floors | 22 rooms, 1 floor |
| item roughly halfway | the Cleats are room 11 of 22, in `0,3,3` |
| every room after it requires the item's verb | every post-item room is behind a torrent, and three are torrent rooms in their own right. No exceptions |
| tide theme is the constraint | the Sanctum is flooded and stays flooded: a torrent is not a tide tile, so no setting of the conch touches one. The choice is which LAYER of the water you travel in |
| Chartstone, 2-4 small keys, boss key | Chartstone in `0,2,4`; 3 keys, 3 locks; Boss Key in `0,1,2` behind the second |
| miniboss two thirds through | Bogmaw in `0,2,2`, room 15 of 22 (68%) |
| Heart Container from `bossDead` | `0,3,1` |
| essence index = dungeon number | 3 |
| multi-screen rooms | one: the Kelp Locks `0,4,2` is 2x1, and it is 2x1 for a reason rather than for room — eighteen tiles of channel with no shelf to surface on is what makes the breath number mean something. The other 21 are 1x1 |

**What D3 taught about the item, and it is the opposite of what D2 taught.** The
Lens could not be required by terrain at all. The Cleats are required by *every
deep tile in the game* the moment they exist — so "this room needs the Cleats"
is free, and a dungeon built on it would prove nothing. The claim worth proving
is about the two MODES rather than the item:

> the surface route does not get there, and the floor route does.

That is provable because the difference between the modes is DATA. A tile's
`push` is applied in `Player.updateTerrain` only while `inDeep && !underwater`,
so a current moves a swimmer and never a walker, and comparing the push to
`SWIM_SPEED` settles the question in arithmetic. An ordinary riptide is 0.55
px/f against a swimmer's 0.75 — a tax, not a barrier — which is why D3 needed
`TORRENT_PUSH`, derived to sit on the other side of that line.

**The reusable lesson for D4-D6: when an item's mere possession is the gate,
find the axis INSIDE the item and prove that instead.**

**D2, Coral Spire — DONE.** 24 rooms, two floors, re-authored around the
Brineglass Lens. Against the constraint list above:

| Constraint | D2 |
|---|---|
| 22-32 rooms, 1-3 floors | 24 rooms, 2 floors |
| item roughly halfway | the Lens is room 14 of 24, in `1,4,4` |
| every room after it requires the item's verb | every post-Lens room is behind a Lens fork or needs the Lens in its own right (the two phase-shifted cells). One exception is stated below |
| tide theme is the constraint | two forks, both pinned so the conch cannot answer them, both proved in five directions by `tools/check-lens.mjs` |
| Chartstone, 2-4 small keys, boss key | Chartstone in `0,4,4`; 2 keys, 2 locks; Boss Key in `1,2,1` |
| miniboss two thirds through | the Reefguard in `1,4,2`, room 17 of 24 (71%) |
| Heart Container from `bossDead` | unchanged, `1,3,1` |
| essence index = dungeon number | 2 |
| multi-screen rooms | two: the Reefguard Hall `1,4,2` is 2x1 and the Spire Ascent `1,3,2` is 1x2 — one room in twelve, and neither is a fork. The other 22 are 1x1 |

The one honest exception to "every room after it requires the verb" is `1,3,1`,
the boss room. It is *reached* only through a fork, so no post-Lens room can be
entered without the Lens.

**What D2 taught about the item, and it is not what D1 taught.** The Anchor's
problem was geometry — the patch did not fit in ten tiles. The Lens's problem is
that **it cannot be required by terrain at all.** No arrangement of tiles is
passable with the Lens and impassable without it, so a Lens room is not a gate
and cannot be built like one. What makes it required is that the player has to
COMMIT before the answer exists, and the three things that make the commitment
real are all engine features that were sitting unused:

* **`tideForce`** pins a room to a level and refuses the conch. Without it the
  player previews for free by sounding the conch, looking, and sounding it back,
  and the Lens is a shortcut rather than the answer. It had never been used by
  any room in the game.
* **A one-way ledge** is the commitment. `F.LEDGE` is solid from three sides, so
  once you have taken it the choice cannot be retaken.
* **The TideValve plus `game.forceTideStep()`** is the only thing that moves the
  water inside a pinned room, and it lives at the bottom of each branch — past
  the point of no return, so turning it can only ever confirm a choice already
  made.

`tools/check-lens.mjs` asserts all of that, and the assertion with the most
teeth is the pin. **A later session will be tempted to drop it** — a room that
refuses the conch feels heavy-handed until you notice it is the only reason the
Lens is worth carrying.

**And one thing D2 could not solve: the Lens draws three dark blues.** Shallow
water, deep water and a dungeon pit are the three answers a fork has, and
through a ghosted overlay they come out within six RGB units of each other. The
opacity was measured and raised; the underlying problem is a colour problem and
is written up in `docs/ART-BACKLOG.md`. Shallow-vs-deep is the read D2's second
fork turns on and it is the weakest thing in the dungeon.

**The charm cases now open on the essence, not on the visit.** `CHARM_LOW_ESSENCES`
is 2 and D2 is the second essence, so the old behaviour — the case opening only
when the player next TALKED to the scrimshander — shipped a real save in which
you own charms you can never switch on. `openCharmCases` in `scrimshaw.js` is
called from `Game.claimEssence`; the scrimshander keeps her line and says it the
first time you see her afterwards (`progress.charmTold`). D2 hand-places one
charm, Barnacle Skin in `0,3,3`, and it is a MID charm because MID is the only
case the player owns for the whole of this dungeon.

#### ROOM SIZE — everything a dungeon session needs, in one place

P7.6 is built and shipped. A dungeon room may be larger than one screen. Nothing
else in the engine changed: a room with no `size` is 1x1 and behaves exactly as
it always did, and the overworld is refused a size outright (`registerMap`
throws, and `validate.mjs` reports it — it is a check, not a convention).

**The five sizes, and the grid each one implies.** The size is in SCREENS, and
the room's `map` is ONE grid, not several screens laid side by side:

| `size` | tiles | `map` shape | pixels | map cells owned |
|---|---|---|---|---|
| omitted / `[1,1]` | 10 x 8 | 8 rows of 10 chars | 160 x 128 | 1 |
| `[2,1]` | 20 x 8 | **8 rows of 20 chars** | 320 x 128 | `rx..rx+1` |
| `[1,2]` | 10 x 16 | **16 rows of 10 chars** | 160 x 256 | `ry..ry+1` |
| `[2,2]` | 20 x 16 | **16 rows of 20 chars** | 320 x 256 | a 2x2 block |
| `[3,1]` | 30 x 8 | **8 rows of 30 chars** | 480 x 128 | `rx..rx+2` |

Anything outside that set throws at construction. Two consequences that bite:

* A multi-screen room **owns** every cell it spans. Its key is its top-left
  cell, and no other room may be keyed inside its footprint — `validate.mjs`
  fails on it. A 2x1 room at `0,4,4` therefore means `0,5,4` does not exist and
  the room's east neighbour is `0,6,4`.
* Authoring a 2x1 room as two 10-wide grids gives sixteen rows and fails
  `validate.mjs` immediately. That is deliberate; it is the mistake the parser
  exists to catch.

**The sizing rule, stated as anchor-gate arithmetic.** This is the reason the
feature exists, and it generalises to any spatial item — D3's Kelp-Soled Cleats
and D4's Bellows will hit exactly the same wall:

* The Anchor holds a 5x5 patch and its throw carries about two tiles. So ONE
  gate needs a stand tile, a four-tile near band, a three-tile far band and a
  far side: **ten tiles, the full width of a 1x1 room row.**
* **What fits in 10 tiles:** exactly one gate, and nothing else. Every other
  route round it has to be walled off — any route round the gate skips it, and
  any forgiving tile in the middle of it is somewhere to stand and sound the
  conch. D1's three gates are therefore bare two-row corridors holding one idea
  each.
* **What fits in 20 tiles (2x1):** two gates back to back, or one gate plus the
  room that makes it a decision — a fork, a fight, a reason to have brought the
  iron here rather than there. The player can be made to choose WHERE to sink
  the anchor, which a 10-tile row cannot express because there is only one place
  it fits.
* **What a 2x2 buys that a 2x1 does not:** a second axis. A 2x1 is a wider
  corridor and its puzzles are still read left to right. A 2x2 lets a gate on
  one axis interact with a gate on the other — one patch that must serve two
  crossings at right angles, which is a different puzzle and not a longer one.
  Reach for 2x2 only when the answer genuinely needs two directions; otherwise
  it is a 2x1 with wasted floor.
* **The patch does NOT grow with the room.** 5x5 is 5x5 in a 30-tile room. A
  radius that split a 10x8 room splits a 20x8 room differently, and that is the
  design consequence the feature was asked for, not a bug to compensate for.

**The pacing rule, with a number attached.** Most rooms are one screen and the
large ones land on set pieces — a boss, a miniboss, the item, the one puzzle the
dungeon is named after. The number to check yourself against:

> **At most one room in six is larger than 1x1, and at most one room per dungeon
> is larger than 2x1.** In a 24-room dungeon that is four large rooms and one of
> them may be a 2x2 or a 3x1.

A dungeon that overshoots that reads as flat as one where every room is 1x1 —
which is the failure the P8 amendment is warning about, restated as something a
session can count.

**The worked example: `0,5,3`, the Clawcrab Den in D1.** It is the only
multi-screen room in the game and it is there to be copied. Read its header
comment in `src/data/dungeons-a.js`: it states its size, its grid width, why
that room and not another, and the three checks that had to hold before it could
be converted (it is not an anchor gate, so nothing `check-anchor.mjs` proves had
to be re-proved; the cell it grows into has no neighbours, so no facing wall in
any other room moved; all of its doorways are in its western screen and are
untouched).

`tools/replays/d1-clawcrab-den-wide.json` is its proof, and the assertion is the
part worth copying too: crossing the internal screen seam fires NO transition
(`roomChanges: 1` for the whole run, the one at the real room boundary), and the
camera reaches both of its clamps (`camMaxX: 160`, `camEndX: 0`) and never moves
on the axis the room is one screen tall on (`camMaxY: 0`).

**Two things a wide room will make you want, and one of them is a trap.**

* **Breaking up the floor.** Twenty tiles of one floor tile is the failure mode
  a large room invites. The theme's own variant `,` is the obvious answer and it
  is NOT available in every dungeon: Grotto, Cistern and Salt register their Alt
  floor in the `stonef` palette, which is the palette of `dFloorWet` — the MID
  form of the `dBasin` tide tile. In those three, `,` reads as standing water.
  Coral, Bog, Wood, Palace and Abyss are clear. `validate.mjs` proves a theme
  never changes a tile's FLAGS and is exactly blind to this, so look at the room.
* **Locked doors.** A large room has more ways round a door in it. Wall the four
  tiles round any `L` you place; `walk-dungeons.mjs` now asserts every locked
  and boss door separates its room on one axis at all three tide levels.

#### DUNGEON LOOK — what your theme gives you, and what it does not

The companion to ROOM SIZE, and read for the same reason: a session that only
sees "use the tilesets from P7.5" concludes the work is already done, because
`legend: 'dungeonCoral'` is already on the map. That is true and it is not the
whole of it.

**A theme repoints SIX characters** of the shared `dungeon` legend. Everything
else in a room is the same tile in all eight dungeons:

| char | tile | themed? |
|---|---|---|
| `.` | floor | **yes** |
| `,` | alt floor | **yes** — but read the warning below |
| `#` | wall | **yes** |
| `X` | bombable wall | **yes** |
| `=` | block | **yes** |
| `U` | urn | **yes** |
| `M` | lion mask | no — one gilded mask, reads on any masonry |
| doors, stairs, pits, spikes, pots, grates, ledges, water, every tide digit | | **no** |

So a screenshot is identifiable by its floor, its walls and its scenery, and by
nothing else. If your dungeon needs a look the other tiles are fighting, say so
rather than working round it — the answer is a new themed character, and the
path for adding one now exists and is worked (the urn was the sixth).

**`,` IS NOT A SECOND FLOOR TILE IN MOST DUNGEONS.** In six of the eight themes
the "alt" floor is the SAME ART recoloured, and in three of those the recolour
is `stonef` — the palette of `dFloorWet`, the MID form of the `dBasin` tide
tile. Decorating a floor with `,` in those three says "there is water here".

| theme | `,` is |
|---|---|
| Grotto, Cistern, Salt | the same tile in **wet-stone grey** — do not use as decoration |
| Coral, Bog, Abyss | the same tile in another colour — weak variation, safe |
| Wood, Palace | **a genuinely different tile** — use it freely |

`validate.mjs` proves a theme never changes a tile's FLAGS, which is the right
check and is exactly blind to a theme changing what a tile appears to SAY. In a
tide game the floor palette is vocabulary. Look at the room.

**Scenery: `U` and `M`.** Both are SOLID — read the traps list in CLAUDE.md and
run `walk-dungeons.mjs` after placing one. Place masks INTO a wall and urns
standing against one, which is where the source puts them; `d1` `0,5,3`'s east
lobe is the worked example. The urn's cell is an object, so the ripper keys the
source's floor out from behind it and each theme's urn names its own floor as
`underArt` — that is why there is one urn per theme rather than one urn.

**Adding a themed tile**, end to end, because every step has a checker and
missing one fails silently:

1. Find the pick. `assets/tilesets/seasons-dungeons.json` records every distinct
   tile on the Seasons dungeon map with its occurrence count and one coordinate.
   Frequency is what separates a wall from a decoration without a human looking.
2. Add it to `PICKS` in `tools/rip-dungeon-themes.py`, citing the coordinate and
   the count. If it is an OBJECT rather than a floor or a wall, add its name to
   `KEY_BACKGROUND` too, or it will draw the source room's floor behind it.
3. `python3 tools/rip-dungeon-themes.py --sheet` and **look at the contact
   sheet**, then re-emit. Run the ripper once BEFORE you change it to confirm it
   reproduces byte-identically. Never hand-edit the generated file.
4. A wall must tile with itself in BOTH axes. Render a 4x4 of it. Wall RUNS are
   directional and read as a picket fence repeated — `hatchWall` and `forgeWall`
   are both in the file, both unused, and `tools/shots/wallruns.png` is why.
5. Add the tiledef in `tiles-core.js`, one per theme if it needs an `underArt`.
6. Add the legend character: `theme()` in `legends.js` for a themed tile, the
   shared `dungeon` legend for one that is not.
7. Add the pair to `SHARED` in `tools/validate.mjs`. **Miss this step and a
   theme is free to change the rules** — a themed tile whose flags differ from
   its shared counterpart moves where the player can walk, and it surfaces as a
   stranded room in a dungeon nobody edited.

`validate.mjs` now fails on extracted art no tiledef draws, and on a tiledef no
legend, tide variant or transform can reach. Both of those were true of the
scenery for the whole life of P7.5 step 8 and nothing noticed.

**What you do not have to think about.** The camera, the render cache, the
minimap and the seam arithmetic are all done. The camera clamps to
`[0, room.pw - VIEW_W]`, which is empty in a 1x1 room, so it is provably a no-op
there; its three constants (`CAM_DEADZONE_W`, `CAM_DEADZONE_H`, `CAM_MAX_SPEED`)
are all `guessed` and `KeyI` draws the deadzone box in game if you want to argue
with them. Every checker reasons over `room.tw`/`room.th`, including
`check-anchor.mjs`.

#### D2 decision: the Lens is required INSIDE its own dungeon, and nowhere else

**SETTLED AND BUILT.** This section is kept as the reasoning; what D2 actually
did with it, and the three engine features it turned out to need, are in "P8
status: D2 done" above.

P8 says every room after the item requires the item's verb. P9 says the
Brineglass Lens is informational and must never be a gate. Those read as a
contradiction and a session left alone with them would resolve it by quietly
making the Lens a gate, which is the thing P9 rules out. Settled: **both stand,
because they are about different scopes.**

- **Inside D2, after the Lens is found, the rooms require it.** That is a
  dungeon-local design requirement and it is what makes the item's introduction
  mean something.
- **Nowhere in the world is the Lens a gate.** No region boundary, no locked
  route, no `check-overworld` gate keys on it. P9's rule is untouched, and a
  player who somehow reaches a later region without the Lens is never sealed
  out of anything by its absence.

**What "requires" means for an item that only shows you things.** The Lens
cannot make a tile passable, so a Lens room cannot be built like an anchor gate.
The verb it introduces is *knowing before you commit*, so the room has to make
you commit. The shape that makes it real:

> A room offers a choice that cannot be taken back — a one-way ledge, a drop
> through a hole, a current that only runs one way — and the branch you want
> depends on what the room will be at the NEXT tide level, which is exactly what
> is invisible while you are standing at this one. Choose blind and you land
> somewhere that costs you the walk back. Look first and you choose right.

That is provable, and it is provable statically the way the anchor gates are.
A room declaring `lensRoom: { decide: [x, y], branches: [...] }` should be
asserted to satisfy all three of: the decision tile is one-way (nothing leads
back from at least one branch); at least one branch is a dead end or a loss at
the level it resolves to; and which branch is which is NOT determinable from the
tiles visible at the level the player decides at. Write `tools/check-lens.mjs`
for it, modelled on `check-anchor.mjs` — same state-space flood, same
both-directions discipline, and the same rule that its reaches come out of
`feel.js`.

**The trap to expect**, stated in advance because it is the same trap D1 fell
into: a Lens room with a way to scout the branch safely is not a Lens room. If
the player can peek down a ledge, walk back round, or die cheaply and retry from
the same side, the information is a convenience and the requirement is a
decoration. The cost of guessing wrong has to be real and it has to be paid
before the answer is known.

**Also note for D2-D6:** the game is still eight dungeons in the data. The
six-dungeon consolidation in the prompt above has not happened, and D1 did not
need it (D1's item and theme already match the table). Folding d7 and d8 into
their neighbours is still owed and belongs to whichever session takes those.

### P9 — Overworld re-gating and difficulty

```
The overworld has eight regions gated on items that no longer exist.

1. Re-gate for six dungeons. Five gates should be tile-flag-shaped so
   check-overworld.mjs can prove them in both directions; terrain-shaped gates
   are a last resort and must be documented as unprovable.
2. The Brineglass Lens is informational and must never be a gate. (Region
   scope only. Inside D2 the rooms after it DO require it — see the D2 decision
   under P8 for why both rules stand and what "require" means for an item that
   only shows you things.)
3. Re-tune to match the source games: 3 hearts at start, half-heart contact
   damage from ordinary enemies. Six Heart Containers plus heart pieces should
   land the cap at 14-16 hearts, so heart pieces need to scale up from the
   eight-dungeon assumption.
4. Re-run every checker and both replays.
```

### PB — Single-file build (done)

Landed on `claude/oracle-build-script-coklp7`. Kept here because the
constraints are the interesting part and will bind every future change to the
build.

```
package.json declares a `build` script pointing at tools/build.mjs, which does
not exist. Write it.

It must bundle index.html plus every ES module under src/ into ONE
self-contained HTML file at dist/oracle-of-tides.html, with all JavaScript
inlined as a single classic <script> (not type="module"), so the file opens
and runs correctly from a file:// URL with no web server and no network
access.

This is possible because the game loads no runtime assets: all sprite data is
procedural JS and all audio is WebAudio synthesis. Verify that claim yourself
before relying on it — grep for fetch, XMLHttpRequest, new Image, and any
reference to an image or audio file under src/ and index.html. If you find a
runtime asset load, stop and tell me rather than working around it.

Requirements:
- The touch control layer already in index.html must survive the bundle, so
  the file is playable on a phone browser as well as a desktop one.
- No build-time dependency beyond what package.json already has. Plain Node,
  no bundler package.
- Running `npm run build` must produce the file and exit zero.

Then:
1. Run the build and commit dist/oracle-of-tides.html.
2. Open the built file in Playwright from a file:// URL, let it run for a few
   seconds, and assert the canvas is rendering and no console errors were
   thrown. Save that as tools/check-build.mjs and add it to the verification
   table in CLAUDE.md.
3. Add a line to CLAUDE.md under Workflow: every session ends by running
   `npm run build` and committing dist/oracle-of-tides.html.
4. Add this build prompt to docs/EXECUTION-PLAN.md so it's preserved.

Finally: update docs/NEXT-SESSION.md losslessly, and add anything surprising
to the hard-won-lessons section of docs/HANDOFF.md.
```

---

## Part 4 — Order of execution

| # | Prompt | Gates |
|---|---|---|
| 1 | P0 trunk | everything |
| 2 | P1 feel spec + RNG + replay | P2, P3, P4 |
| 3 | P2 flaky test | — |
| 4 | P3 fixed-point movement | — |
| 5 | P4 enemy grid-lock | — |
| 6 | P5 tide field + Anchor | P6, P8 |
| 7 | P6 item roster | P8, P9 |
| 8 | **PT towns, buildings, terrain polish** | P9 |
| 9 | P7 scrimshaw | — |
| 10–15 | P8 dungeons 1–6 | P9 |
| 16 | P9 overworld + difficulty | — |

PT sits before P9 deliberately. A gate is a tile flag dropped into a finished
screen; a town is the screen itself. Re-gating a finished village is a small
edit, re-towning a gated screen is not — so build the world, then decide where
it locks. PT is also independent of P7 and P8 and can be taken whenever a
session wants content rather than systems.

Use plan mode for P5 and P3. Both touch dozens of call sites and a wrong split
costs a session.
