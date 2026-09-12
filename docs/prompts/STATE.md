OBJECTIVE OF RECORD: 4 enemy-roster

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

FILE ALLOWLIST for the current objective (4 enemy-roster):
  docs/ENEMIES.md (one-line behavior spec per enemy; no two share a lesson)
  src/data/sprites-enemies.js — GENERATED (rip-enemies.py). Never hand-edit;
    new frames go through the ripper, or a NEW hand-authored file if the
    sheet has nothing to extract
  src/data/sprites-enemies-hurt.js (hand-drawn hurtFrame/deathFrame art the
    sheet lacks; S12 wisp_hurt, S13 stalfos_death, S15 beetle_hurt, S16
    gel_death, S17 wisp_death — new keys need only sprite-manifest.js)
  src/data/enemies.js (wire hurtFrame — hp > swordDamage(), S12 — or
    deathFrame — no hp constraint, S13 — on a defineEnemy call)
  src/game/enemy.js (spriteName/update/die carry both mechanisms, S12/S13)
  tools/check-drift.mjs ("hurt"/"death" both read the real spec field now,
    S14; "attack" still reads sprite-key naming — no engine field for it)
  dist/oracle-of-tides.html
  docs/NEXT-SESSION.md
  docs/prompts/LEDGER.md

Note (keep): art-provenance (#2) is done per S9/S74 — every real sprite
carries a tag; check-drift's "untagged" (175) is only the shared regex
matching non-sprite palette/layout data, documented S70-S74. boss-art (#3)
is done per S75 (docs/ART-BACKLOG.md): all 8 bosses stay hand-drawn,
reasoned per-boss. If either is wrong, revert OBJECTIVE OF RECORD to it.

DETOUR TOKENS: 1

SESSION LOG: one row per session — `S## | objective|detour | one line`
S16 | objective | gave gel (hp 1) its first real deathFrame, the sharp test of the "deathFrame has no hp constraint" claim (LEDGER): gel was ruled OUT for hurtFrame in S12 (1-hp, removed same frame as its only hit), so a deathFrame surviving the identical hp-1 case proves the two mechanisms really differ, not just that death happened to be tried on enemies above the cutoff. Sheet's Color-Changing Gel strip is only colour variants of the same round blob, no squash pose, so hand-drew gel_death (sprites-enemies-hurt.js) — shape changed on purpose (S13's own _death exception): the compact round blob (gel_0, rows 4-9) flattened into a wide puddle low in the cell with two splash flecks. Wired deathFrame + sprite-manifest.js entry. Verified in-engine: killed with one hit (hp 1 -> -4), gel_death held for the full ENEMY_DEATH_FRAMES stall while still in game.entities and remove still false, then removed on schedule — screenshotted, teal puddle visible. check-drift now reads gel: walk,death. validate/test(83/83)/check-motion/check-build all green, dist rebuilt
S17 | objective | gave wisp a deathFrame too (it already had hurtFrame from S12) — the first enemy in the roster with BOTH fields, testing the thing no single-field proof could: whether Enemy.spriteName()'s "dying checked before hurtFrame" ordering (src/game/enemy.js) actually holds when both flicker and dying are true at once (they are, on every killing blow — hurt() sets flicker even on the hit that kills). Hand-drew wisp_death (sprites-enemies-hurt.js): the full spiky halo collapsed to a small dim ember, shape changed on purpose since it's a _death frame. Verified in-engine on ONE instance across two hits: a non-lethal hit showed wisp_hurt for its whole flicker window and reverted; the killing hit (flicker freshly set to 24 again) showed wisp_death, never wisp_hurt, for the whole dying stall, with flicker independently confirmed nonzero throughout — the ordering holds, no code fix needed. check-drift now reads wisp: walk,hurt,death — the first enemy with two states. validate/test(83/83)/check-motion/check-build all green, dist rebuilt
