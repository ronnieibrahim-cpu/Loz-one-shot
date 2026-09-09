# Prompt queue

Four stubs, in order. **A stub must be expanded into a full
`docs/prompts/NEXT-PROMPT.md` before anyone works from it** — none of these
are ready to hand to a session as written. Expanding one means doing what
`NEXT-PROMPT.md` did for the `2x2` room: read the current state of the
relevant area, verify any numbers stated here against the current tree, name
a done-condition, and scope explicitly.

---

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

Fold in the four doc-rot fixes from `docs/prompts/LEDGER.md`'s "doc rot
found, not yet fixed" section — they all sit in overworld/gate code this
session will already be touching:

- `src/data/overworld.js` lines 9-18's stale region-gate comment (still
  names Roc's Feather, Power Bracelet, Zora's Flippers, Hookshot and
  Magnetic Gloves as gates that no longer exist).
- `GAP_HOP_MAX_SPAN` being unconditional, so the documented "Coral Reef:
  1-tile deep gaps -> Roc's Feather" gate gates nothing.
- `tools/check-gates.mjs`'s header still claiming plain-boomerang vs.
  Magic-Boomerang assertions when the body tests the Resonance Rod.
- `F.HEAVY` being set on `boulder` and read by nothing, when the real gate
  is `liftLevel: 2` plus the `dredge` tile action.

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
