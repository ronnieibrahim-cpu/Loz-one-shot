# P8 / D2 — Coral Spire and the Brineglass Lens

Paste the fenced block below into a fresh Claude Code session on this repo.

It is the P8 dungeon prompt from `docs/EXECUTION-PLAN.md`, specialised to D2 and
carrying the four things that are specific to this dungeon and would otherwise
have to be rediscovered: the Lens cannot be a gate and needs a different kind of
proof; the charm-case decision has a deadline and this is it; multi-screen rooms
exist now and there is a rule for using them; and three traps landed in the P7.6
session that a room author will walk straight into.

---

```
Re-author dungeon 2, the Coral Spire, around the Brineglass Lens.

`main` is trunk. Branch from it. One prompt = one session = one branch.

Read, in this order:
  CLAUDE.md                  - the hard rules. They are hard rules.
  docs/EXECUTION-PLAN.md     - read, in this order: "P8 — Dungeon re-authoring"
                               for the constraint list; "P8 status" for how D1
                               was checked against it; "D2 decision: the Lens is
                               required INSIDE its own dungeon, and nowhere
                               else", which is YOUR section and settles the
                               contradiction you would otherwise resolve wrongly;
                               "ROOM SIZE — everything a dungeon session needs,
                               in one place"; and "P7 is CLOSED" for what this
                               session owes scrimshaw.
  docs/ITEMS.md              - authoritative. The Lens's three verbs are stated
                               there and tools/check-items.mjs proves each one.
  src/data/dungeons-a.js     - the d1 header comment. Not to copy the anchor
                               gate, which is the wrong shape for this item, but
                               because it is the worked example of stating a
                               dungeon's primitive ONCE and building rooms out
                               of it. Then read `0,5,3` for room size.
  docs/HANDOFF.md            - the environment section FIRST (Playwright needs a
                               symlink shim before any headless harness runs),
                               then the hard-won lessons from the top down. The
                               first two entries are P7.6's and both bite room
                               authors directly.
  src/game/scrimshaw.js      - the charm roster and the slotting rule.
  docs/FEEL-SPEC.md          - what every timing constant means and how sure we
                               are.

WHERE D2 STANDS TODAY. `d2` is the Coral Spire: 20 rooms over two floors, boss
`anemos` in `1,3,1`, entrance from overworld `0,10,5`, and the Lens in a chest
in `0,4,4`. It is PRE-P8 content — it was authored before the item roster meant
anything and it is not built around the Lens. Treat it the way D1 was treated:
re-author it, do not decorate it.

It already wears the `dungeonCoral` theme, so its floor, walls, block and urn
are extracted tiles and you do not have to choose a look. What that gives you
and what it does NOT is in "DUNGEON LOOK" in EXECUTION-PLAN — read it, because
a theme repoints six characters and every other tile in the room is shared with
the other seven dungeons. Coral is one of the six themes where `,` is the same
floor tile recoloured rather than a second tile, so it is weak variation but it
is safe; it is not one of the three where `,` reads as standing water.

THE HARD PART, AND IT IS THE WHOLE SESSION.

The Lens shows you the room at the NEXT tide level. It cannot make a tile
passable, so a Lens room CANNOT be built like an anchor gate — there is no
arrangement of terrain the Lens gets you through and the conch does not. A
session that does not solve this properly will quietly make the Lens a gate,
and P9 forbids that. EXECUTION-PLAN has already settled the scope question:
inside D2 the rooms after the Lens DO require it; nowhere in the world is the
Lens ever a gate. Both stand. Do not relitigate it.

The verb the Lens introduces is KNOWING BEFORE YOU COMMIT. So the room has to
make you commit:

  A room offers a choice that cannot be taken back - a one-way ledge, a drop
  through a hole, a current that only runs one way - and the branch you want
  depends on what the room will be at the NEXT tide level, which is exactly
  what is invisible while you are standing at this one. Choose blind and you
  land somewhere that costs you the walk back. Look first and you choose right.

THE TRAP, stated in advance because D1 fell into the same shape of trap: a Lens
room with a way to scout the branch safely is not a Lens room. If the player
can peek down the ledge, walk back round, or die cheaply and retry from the same
side, the information is a convenience and the requirement is decoration. The
cost of guessing wrong has to be real and it has to be paid before the answer is
known. D1's version of this was a single forgiving tile in the middle of a gate,
which turned three anchor rooms into two button presses while they still read as
anchor rooms in the data. Assume yours is in there and go looking for it.

WRITE tools/check-lens.mjs, AND WRITE IT BEFORE YOU FINISH THE ROOMS, not after.
That is the actual lesson of check-anchor.mjs: it failed all three D1 gates on
its first run, and every one of those gates had been designed carefully by
someone who believed they worked. Model it on check-anchor.mjs — same
state-space flood, same both-directions discipline, same rule that its reaches
come out of feel.js rather than being written down in the tool.

A room declaring `lensRoom: { decide: [x, y], branches: [...] }` must satisfy
all three of:
  1. the decision tile is one-way - nothing leads back from at least one branch;
  2. at least one branch is a dead end, or a loss, at the level it resolves to;
  3. which branch is which is NOT determinable from the tiles visible at the
     level the player decides at.
Assert also that the tool found at least one such room, the way check-anchor.mjs
does - a prover with nothing to prove passes vacuously and says nothing.

Number 3 is the one with teeth and the one you will be tempted to weaken. It is
the difference between a room that rewards the Lens and a room that rewards
remembering.

THE DECISION THAT CANNOT SLIP, and this session is the deadline.

The charm cases open when the player TALKS TO THE SCRIMSHANDER - `checkUnlocks`
is called from `Scrimshander.interact` and nowhere else. `CHARM_LOW_ESSENCES` is
2, and D2 is the second essence. So ship D2 without deciding and there is a real
save in which the player owns charms they can never switch on, having no reason
to walk back to Tidewatch. Either open the case when the essence lands and let
her line be the acknowledgement, or keep the visit as the beat and signpost it
somewhere the player will actually meet. Either is fine. Leaving it is not.

While you are there: the player walks INTO D2 holding one essence, so the MID
case is the only one open for the whole dungeon and it holds one charm. Place a
charm in this dungeon, and audit it the way D1 was audited - which cases are
open here, does this dungeon's tide theme leave them awake or dark, and is the
charm you placed one the player can actually switch on. `check-charms.mjs`
prints the running list of hand-placed charms. A LOW or HIGH charm placed here
is a reward nobody can use, unless your answer to the paragraph above makes it
one.

ROOM SIZE. Rooms may now be 1x1, 2x1, 1x2, 2x2 or 3x1. Read "ROOM SIZE" in
EXECUTION-PLAN and follow it; the short version is:

  - `size: [2, 1]` in the room def, and the `map` is ONE grid - a 2x1 room is
    eight rows of TWENTY characters, not two screens side by side.
  - A multi-screen room OWNS every map cell it spans, so nothing else may be
    keyed inside its footprint. validate.mjs fails on both mistakes.
  - Pacing: AT MOST ONE ROOM IN SIX larger than 1x1, and at most one room in the
    dungeon larger than 2x1. In a 24-room dungeon that is four large rooms.
  - The worked example is `d1` `0,5,3`; its header comment says why that room
    and what had to be true before it could be converted.

A Lens room is a good candidate for a large room and you should think about it
rather than assume it: the whole point of the room is that the player can see
the branch he is choosing between. Two branches that both fit on one screen may
not need the Lens at all, and two branches on separate screens may make the Lens
mandatory for the wrong reason - because they are off-camera, not because they
are at another tide level. Decide that deliberately and write down which it is.

THREE TRAPS FROM THE P7.6 SESSION, all of which land on room authors.

  1. A LOCKED DOOR MUST WALL OFF WHAT IT LOCKS. `walk-dungeons.mjs` now asserts
     every dDoorLocked/dDoorBoss tile separates its room, on one axis, at ALL
     THREE tide levels. D1 shipped one you could step round along the next row;
     the key it charged for bought nothing and nothing caught it, because the
     dungeon flood spends a key on any lock it can reach and then only asks
     whether every room came out reachable. Wall the four tiles round a door
     when you place it. The three-levels clause is the part with teeth: a door
     that separates at LOW and not at HIGH is a locked door plus a conch, and
     the player always has the conch.

  2. A chest hands over a key in TWO shapes - `{ item: 'key' }` grants it,
     `{ pickup: 'key' }` drops it on the floor. Both are real. The dungeon
     walker now counts both; it did not, and D1 was walked for months believing
     it had two keys for three locks.

  3. EXTRACTED ART IS ONLY WORTH HAVING IF A ROOM CAN NAME IT. `lionHead` and
     `urn` were extracted in P7.5, given tiledefs, commented "for P8 to place" -
     and never given a legend character, so for the whole life of that feature
     no room grid could reference them and the art shipped in the build
     unreachable. They are wired now: `M` is a lion mask to set INTO a wall and
     `U` is an urn to stand against one, themed per dungeon, and `d1` `0,5,3`'s
     east lobe is the worked example. validate.mjs now fails on extracted art
     that no tiledef draws and on a tiledef no legend can reach, so it cannot
     recur - but if you ADD a themed tile, follow all seven steps in "DUNGEON
     LOOK". The last one (teaching validate.mjs the new pair) is what stops a
     theme silently changing where the player can walk.

  And one that does NOT apply to you, stated so you can use the tile freely:
  three of the eight dungeon themes register their alt floor `,` in the `stonef`
  palette, which is the palette of dFloorWet - so in Grotto, Cistern and Salt a
  decorative `,` reads as standing water. CORAL IS NOT ONE OF THEM. `,` is
  `dFloorCoralAlt` in the `coral` palette and you can use it to break up a floor.

THE CONSTRAINT LIST, from EXECUTION-PLAN, unchanged:
  - 22-32 rooms across 1-3 floors. D2 has 20 today, so it grows.
  - The Lens is found roughly halfway through, and every room after it requires
    the verb it introduced - in the sense settled above, not as a gate.
  - The tide theme in the table is the constraint, not a suggestion. D2's is
    "commit-blind becomes plan-first". If a room's puzzle would still work at a
    fixed tide level, it is the wrong puzzle.
  - Chartstone and 2-4 small keys plus a boss key. One miniboss two thirds
    through. One Heart Container from the boss room's onEvent('bossDead').
  - Essence index equals the dungeon number: 2.
  - Any room that claims to need the Lens should DECLARE that in its room data
    and be proved by check-lens.mjs, both ways.

NOT YOUR JOB, so that you do not get pulled into it: the plan says six dungeons
and the data still holds eight (`d7` Reef Palace, `d8` Abyssal Keep), and the
item table's D6 is the Abyssal Keep while `d6` in the data is the Salt Pan
Vault. That consolidation is owed and it is not D2's. Leave d3-d8 alone.

VERIFY. Every line below green, and run them rather than reasoning about them:
  node tools/validate.mjs           clean (two expected fx_slash warnings)
  node tools/walk-dungeons.mjs      29/29
  node tools/solve-switches.mjs     17 rooms (more if you add switch rooms)
  node tools/check-anchor.mjs       14/14
  node tools/check-lens.mjs         NEW - yours, and it must find rooms
  node tools/check-overworld.mjs    17/17
  node tools/check-gates.mjs        15/15
  node tools/check-items.mjs        78/78
  node tools/check-charms.mjs       63/63
  node tools/check-motion.mjs       8/8
  node tools/test.mjs               58/58
  node tools/replay.mjs             21/21
  node tools/scan-sprites.mjs --strict   0 hard findings
  npm run build && node tools/check-build.mjs

Run validate.mjs, walk-dungeons.mjs and solve-switches.mjs AFTER EVERY ROOM YOU
CHANGE, not at the end of a batch. A solid tile can strand a room and still pass
validation; walk-dungeons is what catches it, and finding out which of fifteen
edits did it is a different job from finding out that one did.

ADD A REPLAY that walks a Lens room and commits to the wrong branch, or the
right one. check-lens.mjs proves the room against a model; a replay proves the
game agrees with the model. `d1-sluicegate` is the worked example of that pairing.

AND LOOK AT IT. `node tools/shoot-rooms.mjs d2,0,4,4` and friends, at more than
one tide level. The Lens is a drawing - a ghosted overlay of a room that is not
there - and it is the one item in the game whose entire value is how legible it
is on a 160x144 screen. Nobody has ever looked at it. If it is not readable, say
so plainly; that is a more useful outcome than a green checker.

Update docs/NEXT-SESSION.md losslessly and add anything surprising to the
hard-won-lessons section of docs/HANDOFF.md. Commit the rebuilt
dist/oracle-of-tides.html in the same change as the source.

Do the work yourself rather than spawning subagents — past sessions hit usage
limits that way and lost the work.

Tell me plainly what is done, what is weak, and what you skipped.
```

---

## Why these four things and not a longer prompt

The generic P8 prompt in `docs/EXECUTION-PLAN.md` already covers the constraint
list, and repeating it verbatim would bury what is special about D2. What a D2
session cannot derive for itself:

1. **The Lens is not a gate, and the session will make it one.** The P8
   constraint ("every room after the item requires its verb") and the P9 rule
   ("the Lens is never a gate") read as a contradiction. A session left alone
   with them resolves it by making the Lens a gate, because that is the only
   shape it has seen — D1's. The prompt hands it the resolution and the room
   shape that replaces the gate.
2. **`check-lens.mjs` must be written before the rooms, not after.**
   `check-anchor.mjs` failed all three of D1's gates on its first run, after
   they had been designed carefully by someone who believed they worked. That
   is the single strongest argument in the repo for writing the prover first,
   and it is not obvious from the outside.
3. **The charm-case deadline is arbitrary from inside D2** and only makes sense
   from the roadmap: `CHARM_LOW_ESSENCES` is 2, D2 is the second essence, and
   the unlock fires on an NPC conversation the player has no reason to have.
4. **Multi-screen rooms are new**, and the three traps behind them — bypassable
   locks, the water-coloured alt floor, and extracted art no room could name —
   are all things a room author trips over rather than reads about.
