# Prompt queue

Four stubs, in order. **A stub must be expanded into a full
`docs/prompts/NEXT-PROMPT.md` before anyone works from it** — none of these
are ready to hand to a session as written. Expanding one means doing what
`NEXT-PROMPT.md` did for the `2x2` room: read the current state of the
relevant area, verify any numbers stated here against the current tree, name
a done-condition, and scope explicitly.

---

## 1. Wide rooms, continued

Fix `dTravel`'s non-anchor-cell gap once — a sized room's exits that are not
on its anchor cell cannot currently be pathed by `dTravel` at all, which is
the constraint that pinned this session's `2x2` room to the anchor cell in
the first place (see `docs/prompts/LEDGER.md`). Fix it before any future
routing session (D3 and onward) meets a sized room and has to route around
the same gap a second time.

Then: one `2x2` room per dungeon, in the order D5, D6, D3, D1, D2 — leaving
D1 and D2 for last because both are baselined by `check-playthrough.mjs` and
a geometry change there is the most expensive one to get wrong. Then
consider whether a `3x1` room is worth doing anywhere.

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
