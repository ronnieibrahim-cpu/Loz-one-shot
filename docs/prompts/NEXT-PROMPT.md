# Next session (S159) — optional side dungeons for the three unused bosses

## Read first
- CLAUDE.md, all of it.
- `docs/NEXT-SESSION.md`, the S158 entry (the human's decisions are there).
- `docs/DUNGEON-STATUS.md` — this is dungeon work.

## State
- Main is at 8bb1e34 (countryside + Sandpiper lanes). The new opening, the
  get-item fix and the town themes are on claude/oracle-tides-countryside-y6ejle
  and NOT on main: ask the human before moving it.
- The game opens washed up on the Fishing Stones; sword from the Shipwright's
  Hollow, conch from Farore on Tern Point. check-playthrough is 44/44.

## The task
1. OPTIONAL CONTENT FOR THE UNUSED BOSSES. The human chose BOTH: small side
   dungeons AND one bigger optional dungeon, "more fleshed out", rewarding a
   Piece of Heart or an optional scrimshaw charm. Bosses/minibosses already
   defined in src/data/bosses.js with no room: Thalassor (eel, boss, pull
   scales with the water), Gustharpy and Saltwraith (minibosses). Propose a
   plan to the human FIRST (with a picture of where each entrance goes):
   e.g. two small side dungeons (Gustharpy in the Salt Pans' new columns,
   Saltwraith under the reef) each ending in a Piece of Heart, and one larger
   optional dungeon with Thalassor as its boss paying a charm. Each must lean
   on a tide consequence no main dungeon already states (CLAUDE.md design
   rules) and reuse items the player owns. Mind check-hearts (24 pieces ->
   cap window 14-16): new pieces change the count; adjust with the human.
2. BOSS ART: the three have no Seasons art yet. As S152 did for Anemos,
   build candidates from the cartridge's own boss sprites (tools/rip-bosses.py,
   assets/bosses/; clone Stewmath/oracles-disasm for more gfx) and let the
   human choose from pictures.
3. THE PICTURE GUIDE: merge it (the human said yes). See NEXT-SESSION S158,
   decision 3, for why it is a copy + recapture, not a git merge.
4. Tabled by the human for its own later session: a pixel-art intro cutscene.

## Done means
- Every checker in CLAUDE.md's table green; check-playthrough 44/44, THE END,
  never died (the side dungeons are optional; check-side should prove each
  prize can be won).
- `npm run build`, dist/ committed, NEXT-SESSION.md and this file updated,
  pushed; main only with the human's go-ahead.

## Out of scope
- Enemy damage and health (S150). A camera that frames bosses (S153).
