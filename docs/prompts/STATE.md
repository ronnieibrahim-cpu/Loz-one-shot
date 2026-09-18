OBJECTIVE OF RECORD: 8 feel-measure

S110: OBJECTIVE 7 IS CLOSED. The human amended the Anchor the way the Lens
was amended at S104 — 1 dungeon plus 3 overworld screens — and the three
screens landed (Deep Bar, Reef Pocket, Bog Foot). All four single-use items
now meet their done-conditions. The rotation advances to 8.

8 NEEDS SOMETHING THIS SESSION CANNOT SUPPLY: `measured` means a person
frame-stepped a reference, and `check-feel.mjs` fails anything claiming it
without naming what was stepped. 0 of 249 constants are tagged `measured`
today. If no emulator capture is coming, say so and the rotation should go
to 1 (wide-rooms, 3 of 6, needs 4) instead. That is the human's call.

ROTATION (fixed, do not reorder):
  1 wide-rooms      — 3 of 6 dungeons have a 2x2 or 3x1; done at 4
  2 art-provenance  — every sprite tagged, plus the contact sheets
  3 boss-art        — per boss, a ripper path or a written reason
  4 enemy-roster    — full frame set + a docs/ENEMIES.md spec per enemy
  5 npc-detail      — a unique sprite and >=2 dialogue states per NPC
  6 region-art      — 90 of ~90 overworld rooms audited with a verdict
  7 item-reuse      — MET S110. See docs/prompts/LEDGER.md, "Measured and
                      rejected", for the four amendments and why the
                      Anchor's dungeon half cannot move.
  8 feel-measure    — done when >=40 feel.js constants are tagged
                      `measured` against the emulator

FILE ALLOWLIST for the current objective (8 feel-measure):
  src/data/feel.js — the constants and their provenance comments. A
    `measured` tag MUST name the reference it was frame-stepped from;
    check-feel.mjs fails it otherwise, and inflating the word destroys
    the file permanently
  docs/FEEL-SPEC.md — the written account of what each number means
  tools/check-feel.mjs — only if the tag grammar itself needs widening
  dist/oracle-of-tides.html
  docs/NEXT-SESSION.md
  docs/prompts/LEDGER.md

Note (keep): #2 done S9/S74. #3 done S75 (ART-BACKLOG.md). #4 done S59
and #5 done S63 (both human decisions). #6 done S89 (120/120 audited).
#7 done S110.
DETOUR TOKENS: 1 (unspent)

SESSION LOG: one row per session — `S## | objective|detour | one line`
S109 | objective | Took the Squall Bellows out of doors. Three coastal screens now hold a wheel you cannot reach and a shelf you can only stand on while the sea is up, so the gust has to take the water off the wheel and hold you in place at the same time.
S110 | objective | Took the Tidewright's Anchor out of doors. Three shore screens now run a bar out to a spit: half of it is only dry when the sea is out, the other half is a row of sinkholes that are only crossable once the sea is in, so the iron has to hold one half still while the conch moves the other.
