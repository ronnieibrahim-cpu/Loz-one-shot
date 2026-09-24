# Prompt queue

Four stubs, in order. **A stub must be expanded into a full
`docs/prompts/NEXT-PROMPT.md` before anyone works from it** — none of these
are ready to hand to a session as written. Expanding one means doing what
`NEXT-PROMPT.md` did for the `2x2` room: read the current state of the
relevant area, verify any numbers stated here against the current tree, name
a done-condition, and scope explicitly.

---

---

## POLISH ROTATION (objective 11, named by the human after S145)

One area per session, in order a..i, then round again (STATE.md). Each stub
below is expanded into NEXT-PROMPT.md when its turn comes: verify every
number here against the current tree first, name a target, scope it.

**(a) enemies.** Pass 1 — art: every one of the 22 enemies shows a hurt
flash and a death pose (drift's table: 10 have hurt, 19 have death). Extract
from `oracle-seasons-enemies.png` through `rip-enemies.py`; draw to match
only what no sheet holds. Idle/attack stay where ENEMIES.md scoped them (13
never stand still). Pass 2 — placement: a table of every dungeon room's
enemies against its ENEMIES.md role (one tide consequence each, no room of
three of a kind by accident, no enemy parked on a pit edge or a doorway);
fix the worst, check-placement/ground/playthrough green.

**(b) legible.** The player cannot see several things the puzzles depend
on (ART-BACKLOG.md): a torrent is still water that animates a little faster
(its own entry calls it the highest-value job in the file — directional foam,
never a different blue); a drowned wheel looks like a working one; the Lens's
fork is three near-identical blues; no room shows how high the sea is (the
tide-gauge fixture); the Keep's mooring ring reads as a block. Pass 1: the
torrents and the wheel. Every change is shown to a person, who says whether
the room now reads without being swept out of it once.

**(c) fidelity.** Hand-drawn art that a sheet already holds, which CLAUDE.md
calls the largest remaining violation of its first art rule: the usable
item icons (the HUD sheet has 29 — ART-BACKLOG "THE USABLE ITEMS ARE
HAND-DRAWN"), and the Maku Tree and Great Fairy, drawn 16x16 beside a whole
`oracle-seasons-maku-tree.png` and the races sheet (use `expectedSize`, as
`link_hold_*` does). Extract through a ripper; check-rippers green. Also
count drift's 196 untagged sprite-provenance entries down.

**(d) feel.** Walk, sword (three verbs), knockback, hit-stop, pickup and
chest timing, text speed, door and room-scroll timing, against FEEL-SPEC.md
and a person's hands. `measured` is BLOCKED without an emulator capture —
ask the human for one at the start of the session; without it, changes are
`derived`/`guessed` and every one goes to a person to play. replay.mjs will
move: re-record deliberately, never to make a test pass.

**(e) music.** List every place the game can be (six regions, the village,
six dungeons, caves, houses, every boss, title, ending) against the track it
plays; find shared or missing tracks; write the missing ones in the Game Boy
register (check-music's frequency and channel rules). Each track loops
without a seam. check-sfx: every verb makes a sound. A person listens.

**(f) side content.** Count what exists (heart pieces, charms, the Coastwise
Chain, optional rooms, secret caves) per region; find the regions with
nothing to find. Design at least one ORIGINAL mini-game (tide-themed, not a
port of an Oracle game) and one side quest — PROPOSE BOTH TO THE HUMAN
BEFORE BUILDING. Every new reward is proved by check-items/check-hearts.

**(g) dungeons.** Every checker proves the six dungeons can be finished;
none says whether they are good (DUNGEON-STATUS "What no dungeon has yet").
Compare them in one table: screens, keys, fights, damage taken on the run,
time to clear, optional rewards. Does difficulty rise D1..D6? Fix the
outliers. Make the two rooms whose signs may not explain them (the Ebb Cell,
the Two Weights, S143) clear, and a person plays each one cold.

**(h) fairness.** The thinnest fight left (the Brinehulk, 10/13 at S144),
by the S145 method: read the losses, route and opt-in robot habits first,
damage only with 13 seeds either side.

**(i) play pass.** The human plays a stretch and writes notes; the session
fixes them in order. If there are no notes, ask for them — do not invent a
pass.


## 1. Wide rooms, continued

**The `dTravel` non-anchor-cell gap is fixed (S47)** — `tools/actor-runtime.mjs`
now short-circuits `dTravel` when the target screen coordinate resolves (via
the new `window.__roomKeyAt`) to the room the actor is already standing in,
rather than only comparing against the room's own anchor `rx`/`ry`. Proven
with a scratch harness: the old code, asked to travel to Reefguard Hall's own
second cell while standing in the room, walked the actor into a completely
different, wrong room in 923 frames; the fix lands correctly in 5. Full
account in `docs/NEXT-SESSION.md` S47.

**This fixes ROUTING, not COLLISION — they are different problems, and the
second one is still mostly closed.** `docs/prompts/LEDGER.md`'s S46 entry
found that a `2x1`/`1x2` room can only grow to `2x2` if its down-right
neighbour cells (per its own anchor key) are vacant — most aren't. Checked
every sized room in the game: only D6's Tideshade Hall had a free block
(converted, S46). D4's Cistern Floor and Ironknight Gallery, D5's Shrine
Ford, and D6's Crossed Shafts are ALL boxed in by real neighbouring rooms —
the original "one `2x2` room per dungeon D5, D6, D3, D1, D2" plan this stub
used to state is not achievable by widening alone for D5 (Shrine Ford is
boxed; D6 is already done via Tideshade Hall, not Crossed Shafts). A future
`2x2` for D4 or D5 needs either a real redesign that deletes/merges a
neighbouring room (a bigger job than "widen one room" — treat it as its own
scoped task, not a queue stub) or accepting D3/D1/D2 as the only remaining
candidates with free growth cells, which the room-size session's own
selection rule excludes (D1/D2 baselined by `check-playthrough`, D3 reserved
for routing). Read `docs/HANDOFF.md`'s hard-won-lessons entry on the
down-right-growth constraint before proposing a target.

**DONE (S48):** `tools/playthrough-route.mjs`'s manual `goto`/`exit`
workarounds for Reefguard Hall's and Spire Ascent's own non-anchor cells are
now single `travel` calls. Landing it shortened the route by 721 frames and
did shift Anemos's fight entry frame enough that the old `wait: 220` had to
be re-swept against `beginPlaythrough` with the real `ROUTE` prefix (not a
fresh `boot()`), per S40/S41's method — `wait: 212` replaces it, sitting in
the middle of a 7-frame stable band rather than the isolated single-frame win
`220` turned out to be. Full account in `docs/NEXT-SESSION.md` S48.

A narrower version of the same `dTravel` gap remains open, and is still not
scoped: `bfsScreens` always plans from a wide room's own ANCHOR coordinates,
never the player's actual physical cell, so a `travel` call FROM a wide
room's anchor TO a target beyond its own non-anchor cell still has to cross
a phantom "edge" that does not correspond to a real wall, and that leg does
not resolve. Neither of D2's two legs needed this — a future dungeon with a
wide room whose non-anchor cell is itself a through-route to a third room
would.

## 2. Region art / overworld polish

S44 sampled roughly 20 of the ~90 overworld rooms across all six regions
(dunes, cliffs, salt, reef, coral, abyss) and found nothing — that is a real
result on the sample, not a clearance of the region. The one time somebody
looked at a whole region systematically (the woods), the fault needed 97 of
120 screens to surface; a ~20-room sample would not have found it.

Write this prompt around a **systematic diff of room grids within a region**,
not more sampling — that is how the tree-crown fault was found to
generalize once someone looked for it that way. Where `assets/sheets/` has
the tile, extract it; do not hand-draw what the sheets already provide.

**The four doc-rot fixes this item used to ask a future session to fold in
are done (S60)**, on their own rather than bundled with the diff below —
`docs/prompts/LEDGER.md`'s "doc rot found, not yet fixed" section has the
full account, including the one item (`F.HEAVY`) that turned out not to be
rot at all. The systematic region diff itself is still untouched and still
this item's real, unclaimed work.

## 3. Cross-dungeon item reuse

Every dungeon item is currently used in its own dungeon and nowhere else.
Named-reference count, by dungeon item, across the codebase at the time this
was written: Tidewright's Anchor 7 (D1); Brineglass Lens 4 (D2); Kelp-Soled
Cleats 2 in D3, 1 in D6; Squall Bellows 8 (D4); Reefseed 8 (D5); Dredge Line
9 (D6); zero named references to any dungeon item in `overworld.js`.

**Carry this caveat into the expanded prompt, and make it the session's
first job:** those counts are named references only. Real gating also
happens at the tile-flag level without naming the item — deep water needs
the Cleats without a `cleats` string appearing anywhere near the tile;
`F.SNAG` posts and the boulder's `dredge` tile action need the Dredge Line
the same way. So the session's first job is to re-measure reuse by
*capability* (what a tile flag or transform actually requires), not by
grepping for an item's name, before authoring anything new.

Then state a numeric target — e.g. every dungeon item required in at least
one room of two later dungeons, and on three overworld screens — because
"more reuse" by itself is not a done-condition a session can finish against.

## 4. Frame-step `feel.js`

Nothing in `src/data/feel.js` currently carries the provenance `measured`,
per `docs/FEEL-SPEC.md`. An emulator and a frame-steppable ROM are now
available, which was the blocker before.

Run a **measure-only session first**: tags and comments only, behaviour-
neutral, the full suite (`node tools/test.mjs` and friends) stays green
throughout. Only after that lands, change one constant family per session,
starting with `WALK_SPEED` and whatever derives from it.

**Never upgrade a `guessed` provenance to `measured` because the game feels
fine.** `measured` means someone actually frame-stepped a reference and
wrote down the number — CLAUDE.md is explicit that inflating that word
destroys the file's value permanently.

---

## 5. The Abyssal Keep, and the sixth Essence

The other half of the task S117 split. Once the route stands in `d6/0,3,7`
holding the Resonance Rod, the remaining work is the Keep itself: two floors,
the Dredge Line out of its own chest, the Colonnade of the Drowned's `dGrate`
retracted with the Rod, the Crossed Shafts, and Nereth.

Known before anyone starts:

- **Nereth has never been beaten on this run's seed.** `measure-boss-combat`
  reads 3 wins in 10 on its own points, and those points assume `sword: 3` and
  `cleats: 2`. The route currently earns `sword: 2`; where the third blade
  comes from, and whether the run can hold it by then, is the first thing to
  settle — the D5 leg found the same gap one tier down and answered it by
  walking back to the Bluff Grotto.
- **`travel` cannot change floors.** No directive in the actor models a stair,
  so every floor change in the Keep is a `goto` onto the warp tile by hand,
  the way the Kelp Locks already are.
- **`nerethIntro` and `ending` both fire from `Game.claimEssence`.** S43 wired
  them and `shoot-cutscene.mjs --ending` proves the chain; a run that takes the
  sixth Essence will play them for real, and the trace has to be read for a
  cutscene that hangs rather than assumed.
