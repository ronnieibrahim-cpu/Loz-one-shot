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
S28 | objective | gave urchin a deathFrame (4th, after gel/keese/octorok) — hp2, deathFrame-only like octorok. Checked the sheet's "Spiny Beetle" plate (urchin's substitution source) with death in mind: found a genuine EXTRACTED pose this time (first since pincer, S23) — box295, directly below the two already-used spiky frames (292/293), same light-grey shell colour but spikes fully retracted into a smooth dome, red/tan legs still visible beneath. Confirmed via palette match (shares #c0c0c0 with 292/293, differs only in the spike/shadow tone) and the sheet's own "Spiny Beetle" label spanning all 5 boxes in that block. Added urchin_death:(295,0.5,0.5,False) to rip-enemies.py's FRAMES and re-emitted — sprites-enemies.js DID change (58 sprites), check-rippers stayed 17/17. Confirmed urchin has no z field (ground-level) and its "harmless until tide covers it" comment describes AI movement gating only, NOT the entity's own `harmless` flag (stayed false in both tide states, verified directly rather than assumed) — ran TWO in-engine lethal-hit probes, tide 0 and tide>=1, both produced identical results (dying/deathFrame/z/frame-count all matched). check-drift reads urchin: walk,death. validate/test(83/83)/check-rippers(17/17)/check-build all green, dist rebuilt. Pushed branch + fast-forwarded main again
S29 | objective | gave crab a deathFrame (5th, after gel/keese/octorok/urchin) — hp2, deathFrame-only. Checked the sheet's "Sand Crab" plate: exactly 2 frames, both used, nothing to extract. Two hand-draw approaches failed on inspection before landing one: the octorok-style "every other row" squash breaks apart crab's two claw columns (real gap between them, unlike octorok's continuous hood); a full vertical flip pushes the shape to the TOP of the cell, not low. What worked: crab_0's own LOWER half (rows7-14, the legs/underside below where the claws split off) reused pixel-for-pixel and shifted to the bottom — claws dropped from the frame entirely rather than redrawn, reading as "flipped, claws tucked, only legs/belly showing." Confirmed no z field. Verified in-engine: lethal hit (hp2->0) set dying=true, spriteName() returned crab_death, z held at 0, dead=true after the stall. check-drift reads crab: walk,death. validate/test(83/83)/check-rippers(17/17)/check-build all green, dist rebuilt. **SIGNIFICANT UNPLANNED FINDING, not chased (no detour token spent, per charter rule 5)**: check-playthrough.mjs's long-standing stop point ("boss: nothing to fight in d2 0,4,5", byte-identical since S23) CHANGED after this session's cumulative deathFrame work — the run now completes without crashing (20 passed, 1 failed) instead of throwing. Root cause not confirmed but a strong lead exists: deathFrame'd enemies now stall ~16 frames before removal instead of vanishing instantly, which shifts the whole run's frame timing once the route kills one of them — crab is placed extremely widely across every dungeon (dozens of dungeons-a.js placements), far more than keese/octorok/urchin combined, plausibly explaining why THIS session is what tipped it. The run now gets through both D1 and D2 bosses in real combat (`s.beaten.d1 && s.beaten.d2` both true) but FAILS "THE ESSENCES OF TIDEWASH GROTTO AND THE CORAL SPIRE ARE BOTH TAKEN" — `s.essences` is `[2]` only, missing D1's essence (index 1) despite Gohmaraq being beaten. Full details and a concrete starting point (playthrough-route.mjs line ~572's `['loot', 900]` step right after D1's boss fight, and whether the `loot` verb in actor-runtime.mjs actually walks onto/collects an `Essence`-type entity at all) are in docs/NEXT-SESSION.md. This is now the ACTUAL "thing currently stopping" full completion, replacing the old boss-room crash. DETOUR TOKENS still 1, unspent — this session stayed on-task per the charter's own rule that a correctness bug is not an automatic exception
S30 | objective | gave zol a deathFrame (6th, after gel/keese/octorok/urchin/crab) — hp2, and its onDie SPLITS INTO TWO GELS, the first deathFrame target with a real onDie effect beyond a loot roll. Checked sheet's "Zol & Gel" plate: exactly 2 frames, both used, nothing to extract. Hand-drew zol_death following gel_death's own "wide flat puddle" template scaled up (thematically apt since zol splits into gel), eyes dropped entirely (already outline-colored, same as octorok/stalfos). Confirmed no z field. Verified in-engine INCLUDING split timing: probe confirmed zero gels exist during the full 16-frame dying stall, then exactly 2 appear the instant it ends at x=died_x±ENEMY_GRID_STEP (frozen position), both carrying split:true (no recursive splitting) — directly confirming S29's theorized "deathFrame defers onDie" mechanism with real evidence (Enemy.die() sets dying=true and returns before super.die/onDie run). Found and FIXED a real regression this session's own zol_death change caused: tools/test.mjs's "enemies can be killed" check killed a zol and only waited frames(6) before checking progress.kills incremented — insufficient now that kills++ (in Entity.die, called from onEnemyDefeated) is deferred behind the same stall. Bumped to frames(20) with an explanatory comment; 83/83 green again. check-drift reads zol: walk,death. check-rippers 17/17, check-build OK. **ESCALATED FINDING (still not chased, no detour token spent)**: check-playthrough's stop point moved AGAIN and got WORSE — confirmed by stash A/B (crab-only state stays at S29's "20 passed/1 failed"; adding zol crashes). Now crashes EARLIER than ever recorded: frame ~33017 in D1 room 0,3,6 (not D2), "equip: anchor is not in the item list" — the actor's ['loot',600] step right before equipping D1's Anchor (tools/playthrough-route.mjs ~line267/293) didn't actually pick it up in time. Same class of bug as S29's missing essence (a fixed-frame-budget route step that used to just barely succeed no longer does, once ANY upstream enemy kill takes longer). TWO independent deathFrame additions (crab, zol) have now EACH shifted check-playthrough's outcome in a different, unpredictable direction — this is a confirmed systemic pattern, not a one-off, and is flagged prominently to the user this session rather than silently continuing. Full writeup in docs/NEXT-SESSION.md. DETOUR TOKENS still 1, unspent
