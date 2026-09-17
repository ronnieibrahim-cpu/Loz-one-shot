OBJECTIVE OF RECORD: 7 item-reuse

S98's FLAGGED DECISION IS WITHDRAWN (S99): its premise was grep-deep and
false. check-overworld keys `reached` on the ROOM so it cannot see an
in-screen pocket, and check-strands is a BASELINE with `--record`, already
holding a 10-cell region. The overworld half is UNTESTED, not blocked.
Nothing awaits a call; next session builds one and runs the suite. See LEDGER.

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
S99 | objective | AUDIT of S96-S98, and both things it checked were wrong. (1) S96's D6 grove borrowed D5's `dSnag`/`dSnarl`, which are drawn in an oak ramp with a brown trunk and sit on the Wood's own floor — the Keep shipped with a green forest tree and shrub in a black stone hall, green on `main`, caught by the one tool nobody ran (shoot-rooms). Fixed with no new art: snarl -> new `dSnarlAbyss` (reef ramp, `dPostAbyss`'s precedent), bole -> `7`/`dLintel`, which the Keep already owned and which has `dSnag`'s exact tide shape; `5` override deleted; room renamed The Drowned Garden. check-reefseed still 102/102, full suite + replay 51/51 + build green, screenshotted at LOW and HIGH. (2) S98's "overworld is structurally blocked" was grep-deep and false — check-overworld keys `reached` on the ROOM, check-strands is a baseline with `--record` already holding a 10-cell region. Claim withdrawn, its flagged decision withdrawn, S91/S95's own findings un-merged. Pre-existing, NOT ours: check-hearts fails 2/112 at 406e785 too. Full writeup: LEDGER "Known and deliberately unfixed" (2 entries), docs/NEXT-SESSION.md S99.
