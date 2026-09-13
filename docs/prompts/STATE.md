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
S40 | objective | gave moblin a deathFrame (15th) — hp4, the first hp4 target and the last plain LAND enemy before only water/submerge repeats remain. Checked the sheet's own "Moblin & Goriya" plate properly: two unused frames exist (boxes171/173, confirmed same red/tan/black palette as the six live frames, NOT Goriya's separate blue boomerang icons sitting nearby) but both are active spear-held-down stances, not a collapse — checked and correctly rejected rather than grabbed just because they existed. Nothing usable to extract; hand-drew moblin_death as an octorok_death-style every-other-row squash of moblin_d0 (front idle), reusing only colours already present. Confirmed no z field. Verified the two-hit sequence (hp4->2->0) with the player kept close enough to trigger moblin's own flee() AI during both hits, rather than testing it idle: hit1 shows moblin_hurt and reverts correctly once the flicker window ends, lethal hit2 shows moblin_death for the full 20-frame stall with position frozen throughout (ai() correctly skipped while dying, confirmed by tracking x/y across the whole stall — no drift). check-drift reads moblin: walk,hurt,death. validate/test(83/83) green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged. check-build OK, dist rebuilt. sprites-enemies.js untouched (hand-drawn) so check-rippers not re-run. Two candidates remain: anglerfry (hp3, water/tideOnly, same shape octorokSea/jellyfish already covered) and siren (hp4, water, submerge() like wizzrobe/leever — would confirm that mechanism generalises to a SECOND submerge enemy rather than being wizzrobe-specific). Picked siren next for the more informative test
S41 | objective | gave siren a deathFrame (16th) — hp4, water, submerge()-based like leever/wizzrobe. Checked the sheet's own "River Zora" plate (siren's substitution source): a spiral-shaped frame sits right before the two already used, but quantising it showed NO red at all (#ffd68c/#000000 only, vs siren_0/1's #ffd68c/#ff0829/#000000) — a genuinely different creature/icon, correctly rejected rather than used just because it sits nearby, same discipline wizzrobe's box335 trap taught (S83). Nothing usable to extract; hand-drew siren_death as an octorok_death-style every-other-row squash of siren_0, reusing only colours already present. Confirmed no z field. SECOND test of submerge()'s hidden/invuln mechanism (leever S32, wizzrobe S83) — confirmed a hit while hidden is blocked outright on THIS enemy too rather than assumed to carry over: hurt() returns false, hp/dying untouched. Ordinary two-hit sequence while visible: hit1 (hp4->2) shows siren_hurt and reverts correctly, lethal hit2 shows siren_death for the full 20-frame stall. check-drift reads siren: walk,hurt,death. validate/test(83/83) green, check-playthrough 21/21 unchanged. replay.mjs found ONE real divergence this time (tide-steps-split, entity-count mismatch at frame120 — siren is present in that plan's room and the death stall now outlives a checkpoint the old recording assumed instant removal at, same class tektite S78 already hit); re-recorded tide-steps-split, 51/51 clean. check-build OK, dist rebuilt. sprites-enemies.js untouched (hand-drawn) so check-rippers not re-run. ONE candidate remains: anglerfry (hp3, water/tideOnly, charge() AI, same shape octorokSea/jellyfish already covered) — after it, EVERY killable enemy (everything except hp999 bubble/beamos/barnacle) will have a deathFrame, closing this thread's whole run since S26
S42 | objective | gave anglerfry a deathFrame (17th and LAST) — hp3, water/tideOnly, charge() AI. Checked the sheet's own "Cheep-Cheep" plate: exactly 2 frames, both already used, unrelated creatures on either side with a wide gap. Nothing to extract; hand-drew anglerfry_death as an octorok_death-style every-other-row squash of anglerfry_0, reusing only colours already present. Confirmed no z field. Verified the two-hit sequence identically at BOTH tide levels anglerfry actually exists at (tideOnly: [1,2]) — same check octorokSea (S80) made. check-drift now shows death on EVERY killable enemy: only bubble/beamos/barnacle (hp999) lack it, by design. validate/test(83/83) green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged. check-build OK, dist rebuilt. sprites-enemies.js untouched (hand-drawn) so check-rippers not re-run. **THE deathFrame SUB-THREAD RUNNING SINCE S26 IS NOW CLOSED.** Checked docs/ENEMIES.md (the objective's documentation half): already complete — all 22 enemies have a one-line spec, plus an explicit "why this ordering holds together" section arguing no two lessons overlap. The objective's remaining real gap is the art half's idle/attack states — check-drift's roster print has never shown either on any enemy, because no engine field for attack exists yet (idle is folded into the walk cycle everywhere). Found a concrete, minimal-risk PILOT: moblin_d1/u1/s1 ("the same angle with its spear raised", per rip-enemies.py's own FRAMES comment) are ALREADY extracted art sitting unused as ordinary alternate walk frames rather than a real attack pose — no new art needed to prototype attackFrame on moblin specifically. Next session: build the actual attackFrame engine mechanism (mirroring hurtFrame/deathFrame's S12/S13 plumbing) and land it on moblin first, before considering a roster-wide rollout
