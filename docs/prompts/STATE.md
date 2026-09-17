OBJECTIVE OF RECORD: 7 item-reuse

FLAGGED FOR HUMAN DECISION (S98, changing nothing per charter rule):
item-reuse's `>=3 overworld` bar is unreachable for all 4 items — no
tool models any item's gate outdoors (LEDGER's final "Known and
deliberately unfixed" entry). Needs a `tools/` change bigger than one
token. Awaiting: descope, a dedicated session, or advance the rotation.

ROTATION (fixed, do not reorder):
  1 wide-rooms      — 3 of 6 dungeons have a 2x2 or 3x1
  2 art-provenance  — every sprite in src/data/sprites-*.js carries a
                      provenance tag in its comment: `extracted` (sheet +
                      cell recorded), `derived` (recoloured/recomposed
                      from extracted pixels), or `drawn` (invented, WITH a
                      written reason extraction was impossible). Plus
                      tools/shoot-sprites.mjs exists: one contact-sheet
                      PNG of every sprite, every enemy animation state,
                      and every NPC, at 1x and 3x.
  3 boss-art        — for each boss, either a rip-bosses.py extraction
                      path exists, or the writeup says per boss why the
                      source sheets can't supply it. sprites-bosses.js is
                      ~1568 lines and there is no rip script for it today.
  4 enemy-roster    — every enemy has idle/walk/attack/hurt/death states
                      and a one-line behavior spec in docs/ENEMIES.md
                      saying what the player learns from fighting it; no
                      two enemies teach the same lesson.
  5 npc-detail      — every NPC has a unique sprite and >=2 dialogue
                      states.
  6 region-art      — done when 90 of ~90 overworld rooms are in
                      docs/AUDITED-ROOMS.md with a verdict
  7 item-reuse      — only the Anchor, Lens, Bellows and Reefseed are
                      single-use (Cleats 5/5, Dredge Line 3/5 already
                      pass). Done when those four are each required in
                      >=2 later dungeons and >=3 overworld screens.
  8 feel-measure    — done when >=40 feel.js constants are tagged
                      `measured` against the emulator

FILE ALLOWLIST for the current objective (7 item-reuse):
  src/data/dungeons-a.js, src/data/dungeons-b.js — dungeon room data;
    where a new Anchor/Lens/Bellows/Reefseed-gated obstacle gets added
  src/data/overworld.js — where a new overworld screen gets an
    Anchor/Lens/Bellows/Reefseed requirement
  docs/ITEMS.md — read-only reference for each item's three verbs; only
    edit if a session finds the doc itself wrong
  docs/DUNGEON-STATUS.md — read before touching a dungeon marked done;
    tick/update if a change affects its checklist
  dist/oracle-of-tides.html
  docs/NEXT-SESSION.md
  docs/prompts/LEDGER.md

Note (keep): #2 done S9/S74. #3 done S75 (ART-BACKLOG.md, 8 bosses
hand-drawn, reasoned). #4 done S59 (human decision, no further idle art).
#5 done S63 (human decision, no further hand-drawn NPC art; wrong on any
-> revert). #6 done S89 (120/120 audited, fixes landed S76-S81 ledges).

DETOUR TOKENS: 0 (spent S98)

SESSION LOG: one row per session — `S## | objective|detour | one line`
S98 | detour | Spent the regenerated token: fixed check-reefseed.mjs's overworld filter bug (same shape as S91/S95's fixes), confirmed 102/102 unchanged — lands regardless of the rest. Then found (correcting my own first-pass "design-fit" conclusion after one more check): check-strands.mjs/check-overworld.mjs have NO puzzle-door model for ANY of the four items' gates (grep for reefseedRoom/anchorGate/anchorGauges/bellowsRoom/lensRoom in both returns nothing), unlike dungeon-flood.mjs which explicitly treats a snarl as passable. So any cell gated by any of the four items outdoors reads as a new stranded region and fails check-strands.mjs, regardless of tile choice or screen. Reefseed's (and by the same argument, the Lens's) overworld half is structurally blocked, same class as the Anchor's/Bellows' — likely the SAME shared root cause behind all three, not three separate ones. Full writeup: docs/prompts/LEDGER.md "Known and deliberately unfixed", docs/NEXT-SESSION.md S98. No game file changed.
