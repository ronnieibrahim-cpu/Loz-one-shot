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

Rule for every session below: one prompt, one branch off main, one PR. Never two prompts in one session. Never two sessions in parallel on room data.

#	Phase	Effort	Gates
P5	Tide field + Anchor	high	P6, P8
P6	Item roster	high	P8, P9
P7	Scrimshaw	medium	—
P8.1–8.6	Dungeons 1–6	high	P9
P9	Overworld gates + difficulty	high	P10, P11
P10	Audio fidelity	medium	—
P11	Pixel-level terrain polish	medium	—

P10 and P11 are polish and come after content is complete. Polishing assets you later delete is the most expensive mistake available here.

P6 — The item roster

Effort: high. This is the session most likely to sprawl: nine items land while eleven are removed, against 303 rooms that reference them.

Read CLAUDE.md and docs/EXECUTION-PLAN.md first. Branch off main.

Write docs/ITEMS.md from the roster in the plan, then implement it.

ADD, in this order. The Tidewright's Anchor is already done in P5.
  1. Brineglass Lens    — hold to render the room as a ghosted overlay at the
                          NEXT tide level: terrain, platforms, currents, and
                          the enemies that only exist there. Release to snap
                          back. Combat verb: reveals phase-shifted enemies and
                          makes them hittable. Never a gate.
  2. Kelp-Soled Cleats  — replaces Zora's Flippers entirely. Two modes on one
                          item button. Swim: surface movement over DEEP, as
                          flippers now. Sink: walk the floor beneath the water
                          — slow, no jump, no sword, immune to currents and
                          knockback, can carry heavy objects. Mermaid Suit
                          becomes Cleats L2: unlimited breath in sink mode and
                          underwater block pushing.
  3. Squall Bellows     — directional gust. Pushes light enemies, spins wheels,
                          drives a raft. While HELD, holds the tide back one
                          level in a cone ahead of Link; releases when you stop.
                          Costs your movement while active.
  4. Reefseed           — thrown at floor or wall; a coral pillar grows after
                          about 2 seconds. LOW: climbable block. MID: wall.
                          HIGH: submerged, swimmable-over and Rod-ringable.
                          The delay is the design.
  5. Dredge Line        — cast into deep water and drag. Pulls up chests, keys,
                          carryables, or an enemy (which flops on land,
                          vulnerable). A fixed snag pulls Link instead.
                          Absorbs the shovel and the magnetic gloves.
  6. Resonance Rod      — trading-sequence reward, replaces the slingshot.
                          Rings all metal and crystal in the room: grates
                          retract, submerged bells chime and point, armoured
                          enemies lock rigid ~90 frames. Range roughly doubles
                          at HIGH tide — the one item whose own power is
                          tide-dependent.
  7. Ferryman's Coin    — secret cave, 3 essences. Throw it; on the next tide
                          change Link and the coin swap places. One coin,
                          recallable.
  8. Chartstone         — replaces the Compass. Marks which rooms change at
                          which tide level.
  9. Bottled Tide       — consumable. Forces one tide step in a room carrying
                          noTide.

REMOVE: feather (fold the hop into the base moveset), bracelet, boomerang,
hookshot, magnet, shovel, satchel and all five seeds, slingshot, flippers
(absorbed into Cleats), ringbox (P7 replaces it).

KEEP: sword, shield.

Each new item needs: an entry in src/game/items.js; sprites in
sprites-gear.js drawn to the register in that file's header; a HUD icon; a
desc; constants in feel.js tagged `guessed` with units; at least one overworld
use and one dungeon use.

Every item must have at least two of the three verbs — movement, combat,
puzzle. If you cannot name them for an item, say so rather than shipping it.

PROCESS, and this is the part that decides whether the session survives: after
EACH item — added or removed — run node tools/validate.mjs and
node tools/walk-dungeons.mjs and fix the room data before moving to the next
item. Commit after each. Do not batch. If room data is broken in more than
about 30 rooms by a single removal, stop and tell me rather than fixing it
blind.

Both existing replays must still pass. Then npm run build, commit dist/,
update docs/NEXT-SESSION.md losslessly, and log surprises in HANDOFF.md.
P7 — Scrimshaw

Effort: medium. Mostly additive, and it touches no room data.

Read CLAUDE.md and docs/EXECUTION-PLAN.md first. Branch off main.

Replace the ring system with scrimshaw.

The mechanic: passive charms slotted BY TIDE LEVEL. A charm in the LOW slot
only works at LOW tide. Link starts with one slot (MID); the LOW and HIGH slots
unlock over the game; a late case upgrade gives a second charm per level. The
point is that changing the tide also changes what Link is good at.

1. src/game/scrimshaw.js replacing rings.js. Slot contents are save state.
2. Implement these 16, then add enough more to reach 30. Each must be
   original, tide-flavoured, and stateable in one line.
     LOW:  Dunerunner (no slowdown on sand or salt crust); Wrecker's Eye
           (buried items and chests glimmer through terrain); Salt-Etched
           (sword +1 while any part of the room is dry); Beachcomber (double
           rupee drops)
     MID:  Split Fang (wider sword arc); Ballast Heart (knockback taken
           halved); Barnacle Skin (one free hit per room, then cracks until
           you leave); Quartermaster's Mark (carry two more Reefseeds)
     HIGH: Gillcarve (unlimited breath in sink mode); Riptide Fin (swim speed
           +40%); Anemone's Gift (aquatic contact damage halved); Drowned
           Lantern (see in flooded dark rooms)
     CROSS: Wrackbone (double sword damage, double damage taken); Neap Charm
           (your charms stay active 3 seconds after the tide leaves their
           slot); Fisherman's Regret (the charm one slot BELOW the current
           tide stays active too); Deadweight (immune to all currents, 15%
           slower everywhere)
   Neap Charm and Fisherman's Regret are the design payoff — they make the
   player think about the transition between tide states. Get those exactly
   right even if others are rough.
3. A scrimshander NPC in Tidewatch: hand over a blank plus rupees, get a
   carved charm after one tide cycle. Blanks drop from the Dredge Line,
   digging, and enemies.
4. Menu screen: three slots stacked as tide levels, active one highlighted.
   It must be legible at 160x144 with the existing font. Verify with
   tools/test.mjs --shots and LOOK at the PNG.
5. Delete src/game/rings.js and every reference.

All effect magnitudes go in feel.js tagged `guessed`. Every checker green.
npm run build, commit dist/, update NEXT-SESSION.md and HANDOFF.md.
P8 — Dungeons, one session each

Effort: high, every time. Six sessions. Never two dungeons in one session, never two dungeon sessions in parallel.

Read CLAUDE.md, docs/EXECUTION-PLAN.md and docs/ITEMS.md first. Branch off
main. This session re-authors DUNGEON N ONLY.

The game is six dungeons now, not eight. Fold the two removed dungeons' best
rooms into their neighbours rather than deleting them outright.

  D1 Tidewash Grotto     — Tidewright's Anchor  — two tide levels in one room
  D2 Coral Spire         — Brineglass Lens      — commit-blind becomes plan-first
  D3 Bogwater Sanctum    — Kelp-Soled Cleats    — surface route vs seafloor route
  D4 Cliffside Cistern   — Squall Bellows       — tide held back by hand
  D5 Drowned Wood Shrine — Reefseed             — build now, use after the change
  D6 Abyssal Keep        — Dredge Line          — the floor of the world opens up

Constraints:
- 22-32 rooms across 1-3 floors.
- The dungeon's item is found roughly halfway through, and EVERY room after it
  requires the verb that item introduced.
- The tide theme is the constraint, not a suggestion. If a room's puzzle would
  still work at a fixed tide level, it is the wrong puzzle. Say so and replace
  it rather than shipping it.
- Chartstone, 2-4 small keys, a boss key. One miniboss two thirds through.
  One Heart Container from the boss room's onEvent('bossDead').
- Essence index equals the dungeon number.
- The boss must use the tide. A boss that ignores it is a boss from a
  different game.

Run node tools/validate.mjs, node tools/walk-dungeons.mjs and
node tools/solve-switches.mjs after EVERY room you change, not at the end.
A solid tile can sever connectivity while rendering fine and validating clean.

Finish with tools/test.mjs --shots and describe what each screenshot shows.
Then npm run build, commit dist/, update NEXT-SESSION.md and HANDOFF.md.

Do not touch any other dungeon.

After each of these six, download dist/oracle-of-tides.html and play the dungeon. The checkers prove it is completable. They cannot tell you room three is boring. That judgement does not exist anywhere but in your hands.

P9 — Overworld gates and difficulty

Effort: high. Touches every region and the whole damage model.

Read CLAUDE.md and docs/EXECUTION-PLAN.md first. Branch off main.

The overworld has eight regions gated on items that no longer exist.

1. Re-gate for six dungeons. At least five gates must be tile-flag-shaped so
   check-overworld.mjs can prove them in both directions. A terrain-shaped
   gate is a last resort and must be documented in the file as unprovable.
2. The Brineglass Lens is informational and must NEVER be a gate.
3. No anchor placement may open any gate. check-overworld.mjs already asserts
   this from P5 — keep it green as you move gates.
4. Re-tune to match the source games: 3 hearts at start; half-heart contact
   damage from ordinary enemies; six Heart Containers plus heart pieces
   landing the cap at 14-16 hearts. Heart pieces need to scale up from the
   eight-dungeon assumption — recount them.
5. Enemy damage values were set against an eight-dungeon curve. Re-derive them
   for six and record the new numbers in FEEL-SPEC.md as `derived`, with the
   reasoning.

Every checker green, both replays unchanged. npm run build, commit dist/,
update NEXT-SESSION.md and HANDOFF.md.
P10 — Audio fidelity from source MIDI

Effort: medium. Do this after P9. The engine is already the best code in the repo — this is a data pipeline on top of it, not a rewrite.

Read CLAUDE.md and docs/EXECUTION-PLAN.md first. Branch off main.

I have MIDI transcriptions of the source games' soundtracks. They are in
assets/midi/ (I will upload them before this session; if the directory is
empty, stop and tell me rather than proceeding).

src/core/audio.js is a four-channel Game Boy synth — two pulse channels with
duty cycles, one wave channel, one noise channel — and src/data/music.js holds
song data in its own format. The goal is to use the MIDIs as an accurate
source for note and timing data rather than continuing to hand-author melodies
by ear.

1. Write tools/midi-to-song.mjs. Parse standard MIDI files with no new
   dependency beyond what package.json has — a minimal SMF parser is a few
   hundred lines and avoids adding a package for one tool. Emit song data in
   the exact format src/data/music.js already uses.

2. The hard part is REDUCTION, and it is where a naive conversion will sound
   wrong. A MIDI has arbitrarily many tracks; the Game Boy has four voices and
   one note each. Implement and document the reduction:
   - Melody (highest sustained line) -> pulse 1
   - Counter-melody or harmony -> pulse 2
   - Bass -> wave channel
   - Percussion (channel 10) -> noise, mapped to a small kit
   - Where more than one note lands on one channel at one instant, keep the
     one the reduction rule prefers and LOG the dropped note with its time and
     track, so I can see what the conversion threw away.
   Write the rules to docs/AUDIO.md with the reasoning, not just the code.

3. Duty cycles carry most of the character. Map each source instrument to a
   duty value and put the table in docs/AUDIO.md as an editable mapping, not
   buried in the converter.

4. Commit both the source MIDI and the generated song data. Regeneration must
   be byte-identical on a second run — assert that in a checker.

5. What you CANNOT verify: whether it sounds right. Do not claim it does.
   What you CAN verify, and should, in tools/check-music.mjs: no channel has
   overlapping notes; every song's duration matches its MIDI within one tick;
   no note falls outside the Game Boy's frequency range; the noise channel
   only carries percussion. Add it to the CLAUDE.md verification table.

6. Convert the overworld theme first and STOP. Tell me it is ready and let me
   listen before you convert anything else. If the reduction is wrong, I want
   to find out on one song, not thirty.

npm run build, commit dist/, update NEXT-SESSION.md and HANDOFF.md.
P11 — Pixel-level terrain polish

Effort: medium. After P9, and after P10 if you want the two polish passes separated cleanly.

Read CLAUDE.md, docs/ART-DIRECTION.md and docs/EXECUTION-PLAN.md first.
Branch off main.

Terrain and props are a mix of extracted tiles and hand-drawn ones. On screen
together they do not read as one game: outline weight, dither density and
palette discipline drift between them. Close that gap.

1. Build tools/contact-sheet.mjs: for every terrain tile and prop, emit a PNG
   putting the game's tile beside the closest source-sheet equivalent at 4x,
   labelled. One sheet per region. This is a LOOKING tool — its output is for
   me and for you to look at, not to assert on.

2. Go through them and fix, in this order of importance:
   - Outline: hard 1px pure black all the way round, no gaps, no soft edges.
   - Colour count: three plus transparency. A tile using four is wrong even
     if it looks fine in isolation.
   - Dither: light on terrain only, never on characters, and matching the
     source's dither PERIOD, not merely its density.
   - The drop-shadow convention: apply it consistently to every prop that
     sits on ground, or to none.
   - Silhouette: a tree that is not identifiable in pure black is not fixed
     by shading it.

3. Where a source sheet supplies a tile cleanly as a single cell or a clean
   2x2 quad, extract it through the existing PICKS/PROPS/QUADS machinery
   rather than redrawing. Where it does not, redraw against the measured
   register. LOG rather than attempt anything needing two source tiles
   composited into one game tile — CLAUDE.md classes that as authoring, and
   it needs in-game screenshots across several regions before it is believed.

4. STOP RULE so this does not eat the session: fix at most 25 tiles. Order
   them by how often the tile actually appears in room data, so the pass hits
   what I will actually be looking at. Log the rest in docs/ART-BACKLOG.md
   with what is wrong with each.

5. Water stays hand-drawn and stays logged as blocked: both terrain sheets
   are static maps with no second animation frame to extract.

6. Refresh tools/shots-link-baseline/ and run tools/test.mjs --shots. For
   each region screenshot, tell me specifically what changed and what still
   looks wrong. "Looks good" is not a report.

node tools/scan-sprites.mjs --strict must show 0 hard findings. Every other
checker green. npm run build, commit dist/, update NEXT-SESSION.md and
HANDOFF.md.
Reminders that keep costing sessions
Run walk-dungeons and check-overworld after each tile placement, not at the end of a batch. A solid tile can sever a room and still validate clean.
A ledge is solid from three sides. Use find-ledges.mjs; never place by eye.
A green src/ with a stale dist/ is a red session.
An intermittently failing test is a real bug. Never add a retry.
Screenshots are for looking at. An assertion on a PNG proves nothing about whether it looks right.
