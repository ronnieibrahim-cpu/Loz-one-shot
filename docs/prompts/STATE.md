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
S26 | objective | gave keese a deathFrame (2nd deathFrame target after gel, S16) — the hurtFrame thread closed at S25 (every hp>2 enemy has one now, and hp<=2 enemies can never take a non-lethal hit since swordDamage()=2), so this moves to the deathFrame branch, which has no hp constraint. Checked the sheet's "Keese" plate: exactly 2 frames (wings-spread, wings-folded), both already used as keese_0/1 — nothing to extract, hand-drew instead. First draft shifted the shape down to sit low in the cell (the stalfos_death/gel_death pattern) but that's WRONG for keese specifically: keese has z:8 (airborne offset) and Enemy.update()'s dying branch never touches z, so the whole death stall renders 8px up from the ground — confirmed in-engine (z stayed 8 throughout every sampled frame of the stall). wisp (also z:8, terrain:'air', already has deathFrame since S17) is the precedent: wisp_death stays CENTRED in the cell rather than dropping low, reading as "fizzling in place" not "landing" — checked that shape before drawing this one. Redrew keese_death from keese_1 (wings-folded) instead, centred the same way: both eye-dots closed (recoloured to outline), right foot-point removed and left one extended one row further down — an asymmetric droop reading as gone limp. 6 pixels changed. Verified in-engine: lethal hit (hp1->0) set dying=true, spriteName() returned keese_death, z held at 8 for the full ~16-frame stall, then dead=true after ENEMY_DEATH_FRAMES elapsed. check-drift reads keese: walk,death. sprites-enemies.js untouched, check-rippers 17/17, check-playthrough's stop unchanged. validate/test(83/83)/check-build all green, dist rebuilt
S27 | objective | gave octorok (land) a deathFrame (3rd, after gel/keese) — hp2 means swordDamage()(2) always kills in one hit, so deathFrame is its only possible feedback. Re-checked the sheet's "Octorok" plate with death specifically in mind (not just trusting S24's hurt-pose survey): still only 4 frames + the same unrelated shell icon S24 already ruled out. Nothing to extract, hand-drew instead. Confirmed octorok(land) has no z field at all (unlike keese) — read Entity's own fz default (0) before drawing, so a "collapsed low in cell" pose is safe here, no keese-style height trap. octorok_d0's own grid squashed (every other row, 0/2/4/6/8/10/12 of 16, compressing 15 rows into 7) and shifted to sit at the very bottom of the cell — same "flatten into a puddle" move gel_death used, not a redraw. Verified in-engine: lethal hit (hp2->0) set dying=true, spriteName() returned octorok_death, z held at 0 throughout the ~16-frame stall, then dead=true after ENEMY_DEATH_FRAMES. check-drift reads octorok: walk,death. sprites-enemies.js untouched, check-rippers 17/17, check-playthrough's stop unchanged. validate/test(83/83)/check-build all green, dist rebuilt. Pushed this session's branch AND fast-forwarded main to it per user request (branch was a clean ancestor, no conflicts)
S28 | objective | gave urchin a deathFrame (4th, after gel/keese/octorok) — hp2, deathFrame-only like octorok. Checked the sheet's "Spiny Beetle" plate (urchin's substitution source) with death in mind: found a genuine EXTRACTED pose this time (first since pincer, S23) — box295, directly below the two already-used spiky frames (292/293), same light-grey shell colour but spikes fully retracted into a smooth dome, red/tan legs still visible beneath. Confirmed via palette match (shares #c0c0c0 with 292/293, differs only in the spike/shadow tone) and the sheet's own "Spiny Beetle" label spanning all 5 boxes in that block. Added urchin_death:(295,0.5,0.5,False) to rip-enemies.py's FRAMES and re-emitted — sprites-enemies.js DID change (58 sprites), check-rippers stayed 17/17. Confirmed urchin has no z field (ground-level) and its "harmless until tide covers it" comment describes AI movement gating only, NOT the entity's own `harmless` flag (stayed false in both tide states, verified directly rather than assumed) — ran TWO in-engine lethal-hit probes, tide 0 and tide>=1, both produced identical results (dying/deathFrame/z/frame-count all matched). check-drift reads urchin: walk,death. validate/test(83/83)/check-rippers(17/17)/check-build all green, dist rebuilt. Pushed branch + fast-forwarded main again
