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
S21 | objective | gave siren a hurtFrame (7th, after wisp/beetle/wisp/darknut/moblin/wizzrobe) — checked the sheet's "River Zora" plate first: exactly two frames exist (siren_0 fanged-mouth-shut, siren_1 open singing ring-shot), both already used; every neighbouring box belongs to unrelated creatures (Pols Voice, two coral/flower icons), nothing to extract. Reused S20's fallback rather than the darknut/moblin eye-shut trick, since siren_0's face reads as a fanged mask with no clear pupil-in-iris eyes: hand-drew siren_hurt (sprites-enemies-hurt.js) reusing siren_0's grid pixel-for-pixel, 3 pixels on the flat tan chin (row 14) turned to the sprite's otherwise-unused THIRD colour (index 2, distinct in the runtime enemyb palette) as a graze mark. siren shares wizzrobe's submerge() primitive, so S20's "can only be hit while surfaced" finding applies unchanged — confirmed rather than re-derived. Verified in-engine with the same pinned-_subState probe: non-lethal hit (hp 4->3) held siren_hurt for the full 24-frame flicker window with hidden false throughout, reverted to siren_1 on schedule. check-drift now reads siren: walk,hurt. sprites-enemies.js untouched. validate/test(83/83)/check-build all green, dist rebuilt
S22 | objective | gave anglerfry a hurtFrame (8th, after wisp/beetle/wisp/darknut/moblin/wizzrobe/siren) — checked the sheet's "Cheep-Cheep" plate (its own substitution source) first: exactly two frames, both already used as anglerfry_0/1, nothing else nearby belongs to it, fourth session in a row finding an empty plate. Unlike wizzrobe/siren, this face DOES have clean two-dot eyes (two short black bars, rows5-6, cols3 and 5, on the light tan face), so the darknut/moblin eye-shut trick applies directly (just inverted in tone — dark marks on light, not light marks on dark): the single tan pixel between the two eye-dots (col4, both rows) turned black too, merging separate dots into one solid squeezed-shut bar. 2 pixels total, silhouette untouched. Confirmed anglerfry's `light: true` flag is unrelated to rendering (only lets the Bellows push it, per enemy.js's own comment) so it has no bearing on the hurtFrame. Verified in-engine: non-lethal hit (hp 3->2) held anglerfry_hurt for the full 24-frame flicker window, reverted to anglerfry_0 on schedule. check-drift now reads anglerfry: walk,hurt. sprites-enemies.js untouched. validate/test(83/83)/check-build all green, dist rebuilt
S23 | objective | gave pincer a hurtFrame (9th, after wisp/beetle/wisp/darknut/moblin/wizzrobe/siren/anglerfry) — first EXTRACTED rather than hand-drawn since S18: the sheet's "Pincer" plate actually has three frames, not two — pincer_0 (box233, head lunging) and pincer_1 (box234, coiled back) were already mapped, but box235 sits on the same plate (same palette, no gap from 234, a real 14px gap before the next plate/Piranha's different palette), confirmed with a raw unquantised crop. Box235 reads as a tighter, off-centre dazed coil, distinct from 234's calm idle. Added pincer_hurt: (235,0.5,0.5,False) to rip-enemies.py's FRAMES and re-emitted — sprites-enemies.js DID change (57 sprites), check-rippers.mjs stayed 17/17. Confirmed (not assumed) pincer has no submerge/hidden state — terrain 'any', no `hidden` prop on the live entity. Verified in-engine: non-lethal hit (hp3->2) held pincer_hurt for the full 24-frame flicker window, hidden absent throughout, reverted to pincer_0 on schedule. check-drift reads pincer: walk,hurt. Confirmed check-playthrough's existing stop (boss: nothing to fight in d2 0,4,5) reproduces identically with this session's changes stashed out — pre-existing, not a regression. validate/test(83/83)/check-rippers(17/17)/check-build all green, dist rebuilt
