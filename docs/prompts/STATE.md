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

DETOUR TOKENS: 0

SESSION LOG: one row per session — `S## | objective|detour | one line`
S38 | objective | gave wizzrobe a deathFrame (13th) — hp3, submerge()-based appear/disappear ('blinks in, fires, blinks out'). Checked the sheet's own "Wizzrobe" plate properly: it actually has THREE green-palette (#10ad42) frames, not two — box335 to the left is a DIFFERENT creature (red palette, belongs to "Whisp"), confirmed by comparing quantised palettes directly rather than trusting visual adjacency; box338, right after the two already used, is a genuine unused third frame: its top half matches wizzrobe_0's small hood, its bottom half matches wizzrobe_1's full robe — a real mid-transition pose. Added wizzrobe_death:(338,0.5,0.5,False) to rip-enemies.py's FRAMES and re-emitted (62 sprites now, up from 61); check-rippers stayed 17/17. FIRST test of submerge()'s hidden/invuln mechanism (already proven by leever S32) COMBINED with hurtFrame on the same enemy — confirmed a hit while hidden is blocked outright (hurt() returns false, hp/dying untouched), same as leever. FOUND A REAL, BENIGN QUIRK verifying the flicker-vs-submerge interaction directly: hitting wizzrobe non-lethally just before its 'up' timer expires does NOT cancel the flicker countdown when it flips to 'down' — flicker keeps counting from its own value, spriteName() still technically returns wizzrobe_hurt while hidden=true — but game.js:1772's render loop skips ANY entity with hidden=true unconditionally, so this is invisible to a player; confirmed by reading the actual render-skip line, not assumed. invuln is correctly overwritten to 9999 by the submerge transition regardless of the flicker-driven invuln already in progress. Separately verified the ordinary two-hit sequence with no submerge interference: hit1 (hp3->1) shows wizzrobe_hurt and reverts correctly, lethal hit2 shows wizzrobe_death for the full 20-frame stall. Confirmed no z field. check-drift reads wizzrobe: walk,hurt,death. validate/test(83/83) green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged. check-build OK, dist rebuilt. Next: pincer (hp3, speed:0, tethered snap-out-and-reel AI, no shield/submerge — a genuinely different movement shape from anything tested so far in this thread)
S39 | objective | gave pincer a deathFrame (14th) — hp3, speed:0, tethered snap-out-and-reel AI (e._pinch: 'hole'/'out'/'back'), no shield/submerge. Checked the sheet's own "Pincer" plate properly: a genuine FOURTH frame (box232) sits one box BEFORE pincer_0, same red/tan/black palette, confirmed by quantising directly — just two eyes centred, the whole body faded to nothing else visible. Reads as the creature receding back into its hole for good, thematically apt for something that never leaves its hole by design. Added pincer_death:(232,0.5,0.5,False) to rip-enemies.py's FRAMES and re-emitted (63 sprites now, up from 62); check-rippers stayed 17/17. Verified a lethal hit lands correctly regardless of which _pinch state ('hole'/'out'/'back') the creature is in when killed — all three show dying=true and spriteName()==pincer_death identically, confirmed on three separate instances. Two-hit hurt->death sequence (hp3->1->negative) behaves exactly like every other hp3 target: hit1 shows pincer_hurt and reverts correctly, lethal hit2 shows pincer_death for the full 20-frame stall. Confirmed no z field, no hidden/invuln toggling anywhere in ai() (unlike leever/wizzrobe) — the plainest of the shield-less/submerge-less targets, as expected going in for once. check-drift reads pincer: walk,hurt,death. validate/test(83/83) green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged. check-build OK, dist rebuilt. Remaining candidates: moblin (hp4, land, throws spears, plain — no shield/submerge/hop), anglerfry (hp3, water/tideOnly, same shape octorokSea/jellyfish already covered), siren (hp4, water, ALSO uses submerge() like wizzrobe/leever — would confirm the mechanism generalises to a second enemy rather than being a one-off). Picked moblin next: last plain land enemy before only water/submerge repeats remain
S40 | objective | gave moblin a deathFrame (15th) — hp4, the first hp4 target and the last plain LAND enemy before only water/submerge repeats remain. Checked the sheet's own "Moblin & Goriya" plate properly: two unused frames exist (boxes171/173, confirmed same red/tan/black palette as the six live frames, NOT Goriya's separate blue boomerang icons sitting nearby) but both are active spear-held-down stances, not a collapse — checked and correctly rejected rather than grabbed just because they existed. Nothing usable to extract; hand-drew moblin_death as an octorok_death-style every-other-row squash of moblin_d0 (front idle), reusing only colours already present. Confirmed no z field. Verified the two-hit sequence (hp4->2->0) with the player kept close enough to trigger moblin's own flee() AI during both hits, rather than testing it idle: hit1 shows moblin_hurt and reverts correctly once the flicker window ends, lethal hit2 shows moblin_death for the full 20-frame stall with position frozen throughout (ai() correctly skipped while dying, confirmed by tracking x/y across the whole stall — no drift). check-drift reads moblin: walk,hurt,death. validate/test(83/83) green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged. check-build OK, dist rebuilt. sprites-enemies.js untouched (hand-drawn) so check-rippers not re-run. Two candidates remain: anglerfry (hp3, water/tideOnly, same shape octorokSea/jellyfish already covered) and siren (hp4, water, submerge() like wizzrobe/leever — would confirm that mechanism generalises to a SECOND submerge enemy rather than being wizzrobe-specific). Picked siren next for the more informative test
