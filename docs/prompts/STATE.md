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
S22 | objective | gave anglerfry a hurtFrame (8th, after wisp/beetle/wisp/darknut/moblin/wizzrobe/siren) — checked the sheet's "Cheep-Cheep" plate (its own substitution source) first: exactly two frames, both already used as anglerfry_0/1, nothing else nearby belongs to it, fourth session in a row finding an empty plate. Unlike wizzrobe/siren, this face DOES have clean two-dot eyes (two short black bars, rows5-6, cols3 and 5, on the light tan face), so the darknut/moblin eye-shut trick applies directly (just inverted in tone — dark marks on light, not light marks on dark): the single tan pixel between the two eye-dots (col4, both rows) turned black too, merging separate dots into one solid squeezed-shut bar. 2 pixels total, silhouette untouched. Confirmed anglerfry's `light: true` flag is unrelated to rendering (only lets the Bellows push it, per enemy.js's own comment) so it has no bearing on the hurtFrame. Verified in-engine: non-lethal hit (hp 3->2) held anglerfry_hurt for the full 24-frame flicker window, reverted to anglerfry_0 on schedule. check-drift now reads anglerfry: walk,hurt. sprites-enemies.js untouched. validate/test(83/83)/check-build all green, dist rebuilt
S23 | objective | gave pincer a hurtFrame (9th, after wisp/beetle/wisp/darknut/moblin/wizzrobe/siren/anglerfry) — first EXTRACTED rather than hand-drawn since S18: the sheet's "Pincer" plate actually has three frames, not two — pincer_0 (box233, head lunging) and pincer_1 (box234, coiled back) were already mapped, but box235 sits on the same plate (same palette, no gap from 234, a real 14px gap before the next plate/Piranha's different palette), confirmed with a raw unquantised crop. Box235 reads as a tighter, off-centre dazed coil, distinct from 234's calm idle. Added pincer_hurt: (235,0.5,0.5,False) to rip-enemies.py's FRAMES and re-emitted — sprites-enemies.js DID change (57 sprites), check-rippers.mjs stayed 17/17. Confirmed (not assumed) pincer has no submerge/hidden state — terrain 'any', no `hidden` prop on the live entity. Verified in-engine: non-lethal hit (hp3->2) held pincer_hurt for the full 24-frame flicker window, hidden absent throughout, reverted to pincer_0 on schedule. check-drift reads pincer: walk,hurt. Confirmed check-playthrough's existing stop (boss: nothing to fight in d2 0,4,5) reproduces identically with this session's changes stashed out — pre-existing, not a regression. validate/test(83/83)/check-rippers(17/17)/check-build all green, dist rebuilt
S24 | objective | gave octorokSea a hurtFrame (10th, after wisp/beetle/wisp/darknut/moblin/wizzrobe/siren/anglerfry/pincer) — last hp>2 target besides stalfos's reverse-order case. Checked the sheet's "Octorok" plate first: exactly 4 frames (front x2, side x2), all already mapped as octorok_d0/d1/s0/s1; a 5th box sitting right after at matching pitch turned out to be a shell/pickup icon in a visibly different orange palette, confirmed against the sheet's own "Octorok" label spanning only the first 4 boxes — nothing to extract, hand-drew instead. octorok_d0's face has two black eye-squares (already the outline's own colour, so the darknut/moblin "recolour to outline" trick doesn't apply — nothing lighter left to shut) separated by a tan gap that narrows to 2px at its middle row (row7, cols7-8): reused anglerfry_hurt's "merge two dark eye-shapes by filling the gap" trick instead, only at that one row so the eyes read as squeezed shut without turning the whole nose bridge black. 2 pixels total, silhouette untouched. octorokSea_hurt added to ENEMY_HURT_ART (sprites-enemies-hurt.js); land octorok (hp2) shares the same frames but doesn't qualify, hence the enemy-id-scoped key. Confirmed no submerge/hidden state (plain wander+shoot ai). Verified in-engine including a direction-cycling probe (down/up/left/right each frame) proving hurtFrame overrides every direction the same way darknut/moblin already established: non-lethal hit (hp3->2) held octorokSea_hurt for the full 24-frame flicker window regardless of dir, then reverted to the correct directional frame (octorok_d0/u0/s0) on schedule. check-drift reads octorokSea: walk,hurt. sprites-enemies.js untouched (hand-drawn path, not the ripper), check-rippers.mjs still 17/17. check-playthrough's stop (boss: nothing to fight in d2 0,4,5) unchanged. validate/test(83/83)/check-build all green, dist rebuilt
