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

### P0 — Establish a trunk

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

### P1 — Feel spec, seeded RNG, replay harness

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

### P2 — Root-cause the intermittent test

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

Run validate.mjs, walk-dungeons.mjs and solve-switches.mjs after every room you
change, not at the end.
```

### P9 — Overworld re-gating and difficulty

```
The overworld has eight regions gated on items that no longer exist.

1. Re-gate for six dungeons. Five gates should be tile-flag-shaped so
   check-overworld.mjs can prove them in both directions; terrain-shaped gates
   are a last resort and must be documented as unprovable.
2. The Brineglass Lens is informational and must never be a gate.
3. Re-tune to match the source games: 3 hearts at start, half-heart contact
   damage from ordinary enemies. Six Heart Containers plus heart pieces should
   land the cap at 14-16 hearts, so heart pieces need to scale up from the
   eight-dungeon assumption.
4. Re-run every checker and both replays.
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
| 8 | P7 scrimshaw | — |
| 9–14 | P8 dungeons 1–6 | P9 |
| 15 | P9 overworld + difficulty | — |

Use plan mode for P5 and P3. Both touch dozens of call sites and a wrong split
costs a session.
