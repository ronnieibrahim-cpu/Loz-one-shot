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
S34 | objective | gave jellyfish a deathFrame (9th, after gel/keese/octorok/urchin/crab/zol/leever/tektite) — hp2, deathFrame-only, and the first hp<=2 enemy checked for one that ALSO had no hurtFrame at all yet. Checked the sheet's own "Bari & Biri" plate properly rather than assuming jellyfish_0/1's two boxes (12/13) were the whole story: it actually has FOUR tan "Bari" frames plus two separate blue "Biri" frames, confirmed by quantising and comparing palettes directly rather than eyeballing a resized crop — box14 shares jellyfish_0/1's exact tan/blue palette (#ffd68c/#1984ff), box15 is a genuinely different creature (all-blue #73adff/#0000ff electric variant). Box14, unused until now, sits right after the two live frames: body shifted down and slightly smaller (row0 empty, unlike 12/13), tentacle fringe ragged rather than the neat hanging skirt — a real extraction, not a hand-draw. Added jellyfish_death:(14,0.5,0.5,False) to rip-enemies.py's FRAMES and re-emitted (60 sprites now, up from 59); check-rippers stayed 17/17. Confirmed no z field, no hop/submerge state (ai is bounceDiag+driftWithTide, continuous movement, not lattice-locked) — jellyfish is the plainest deathFrame target verified so far, no height quirk to reconcile. Verified in-engine: lethal hit (hp2->0) in deep water sets dying=true immediately, spriteName()==jellyfish_death, holds the full 20-frame stall, then dead=true and removed. check-drift reads jellyfish: walk,death. validate/test(83/83) green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged (jellyfish isn't in any recorded route or replay plan, unlike tektite's S33 divergence) — so this session needed no re-recording. check-build OK, dist rebuilt. All hp<=2 non-hp999 enemies now have a deathFrame (octorok/crab/zol/gel/keese/leever/tektite/urchin/jellyfish) — that cadence is EXHAUSTED. Next targets are hp3+ enemies that already have hurtFrame but not deathFrame (deathFrame has no hp constraint, S13): octorokSea/beetle/wizzrobe/anglerfry/pincer all hp3, moblin hp4, siren hp4, darknut hp6. Picked octorokSea next: shares its live frames outright with land octorok (already octorok_death), worth deciding on purpose whether to reuse that key or draw a distinct aquatic one, not something this session decided
S35 | objective | decided AND gave octorokSea a deathFrame (10th) — hp3, the first target picked after the hp<=2 cadence exhausted at S34. octorokSea's frames: block names the EXACT SAME sprite keys (octorok_d0/d1/u0/u1/s0/s1) as land octorok, already given octorok_death at S27 — so this session's real job was deciding reuse-vs-new-art on purpose rather than drawing a second pose by default. Decided to REUSE: wired deathFrame:'octorok_death' directly, no new art, no ripper change, no manifest change. Reasoning written inline in enemies.js: the two enemies are already the same creature on screen while alive, so a distinct corpse would be the first place they diverged for no visible reason, and a flattened squash silhouette doesn't actually claim dry land specifically. FIRST hurtFrame+deathFrame COEXISTENCE proof on a target that ALSO needed a genuine non-lethal hit first (hp3, swordDamage 2, so unlike octorok/crab/zol/urchin/tektite/jellyfish a single hit does NOT always kill) — probed both hits on one instance: hit1 (hp3->1) showed octorokSea_hurt, reverted to walk cycle after the flicker window with dying still false; hit2 (hp1->negative) showed octorok_death (never octorokSea_hurt) for the full 20-frame stall, then dead=true, removed. Confirmed no z field. check-drift reads octorokSea: walk,hurt,death. validate/test(83/83) green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged (no re-record needed). check-build OK, dist rebuilt. sprites-enemies.js/rip-enemies.py/sprite-manifest.js all untouched this session (pure reuse, no new art) — first deathFrame session with zero art-pipeline files touched. Next candidates all hp3 with hurtFrame already, no more hp-based ordering criterion: picked beetle next (shield:'front' + charge() — genuinely new quirks, shield-block interaction with hurt() not yet tested by this thread)
S36 | objective | gave beetle a deathFrame (11th) — hp3, shield:'front', charge() AI. Checked the sheet's own "Spiked Beetle" plate: exactly 4 frames (upright front x2, balled-up side x2), all already used, nothing to extract. Hand-drew beetle_death as an octorok_death-style every-other-row squash of beetle_d0 (the upright resting pose, not the charge-ball beetle_s0/s1) — deliberately chose the upright shape so the pose reads as collapsed rather than as mid-uncurl, which could read as about to charge instead. FIRST explicit test of a shield:'front' enemy against a LETHAL hit in this thread (crab, S29, has the same field but the interaction was never directly probed) — confirmed in-engine that a hit arriving at the shielded front is blocked outright even for 99 damage (hurt() returns false, hp/dying both untouched), and that a hit from an unshielded angle connects normally: a non-lethal hit (hp3->1) shows beetle_hurt and reverts to the walk cycle once the flicker window ends, the lethal follow-up shows beetle_death (never beetle_hurt) for the full 20-frame stall then dead=true, removed. Confirmed no z field. check-drift reads beetle: walk,hurt,death. validate/test(83/83) green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged (no re-record needed). check-build OK, dist rebuilt. sprites-enemies.js untouched (hand-drawn, not extracted) so check-rippers not re-run. Next: darknut (hp6, shield:'front', only vulnerable from behind) — first deathFrame target needing THREE hits at swordDamage 2 (6->4->2->0), a stronger repeat-hurtFrame proof than any prior two-hit case
