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
S30 | objective | gave zol a deathFrame (6th, after gel/keese/octorok/urchin/crab) — hp2, and its onDie SPLITS INTO TWO GELS, the first deathFrame target with a real onDie effect beyond a loot roll. Checked sheet's "Zol & Gel" plate: exactly 2 frames, both used, nothing to extract. Hand-drew zol_death following gel_death's own "wide flat puddle" template scaled up (thematically apt since zol splits into gel), eyes dropped entirely (already outline-colored, same as octorok/stalfos). Confirmed no z field. Verified in-engine INCLUDING split timing: probe confirmed zero gels exist during the full 16-frame dying stall, then exactly 2 appear the instant it ends at x=died_x±ENEMY_GRID_STEP (frozen position), both carrying split:true (no recursive splitting) — directly confirming S29's theorized "deathFrame defers onDie" mechanism with real evidence (Enemy.die() sets dying=true and returns before super.die/onDie run). Found and FIXED a real regression this session's own zol_death change caused: tools/test.mjs's "enemies can be killed" check killed a zol and only waited frames(6) before checking progress.kills incremented — insufficient now that kills++ (in Entity.die, called from onEnemyDefeated) is deferred behind the same stall. Bumped to frames(20) with an explanatory comment; 83/83 green again. check-drift reads zol: walk,death. check-rippers 17/17, check-build OK. **ESCALATED FINDING (still not chased, no detour token spent)**: check-playthrough's stop point moved AGAIN and got WORSE — confirmed by stash A/B (crab-only state stays at S29's "20 passed/1 failed"; adding zol crashes). Now crashes EARLIER than ever recorded: frame ~33017 in D1 room 0,3,6 (not D2), "equip: anchor is not in the item list" — the actor's ['loot',600] step right before equipping D1's Anchor (tools/playthrough-route.mjs ~line267/293) didn't actually pick it up in time. Same class of bug as S29's missing essence (a fixed-frame-budget route step that used to just barely succeed no longer does, once ANY upstream enemy kill takes longer). TWO independent deathFrame additions (crab, zol) have now EACH shifted check-playthrough's outcome in a different, unpredictable direction — this is a confirmed systemic pattern, not a one-off, and is flagged prominently to the user this session rather than silently continuing. Full writeup in docs/NEXT-SESSION.md. DETOUR TOKENS still 1, unspent
S31 | detour | closed the escalated finding S29+S30 flagged and did NOT chase. Both check-playthrough failures reproduced exactly; BOTH diagnoses were wrong. The frame-budget-drift theory is disproved: dLoot returns immediately on an empty floor, so its frame number is a CAP not a wait and no loot step was ever short of budget; openChest grants chest.item outright via giveItem, so the loot step by the Anchor chest was never load-bearing. Real fault 1: Essence has no isDrop and dLoot can NEVER collect it at any budget — it needs an explicit ['goto',4,3,N]; D2's boss had one, D1's did not. Real fault 2: the anchor-equip crash was a DEATH ~28000 frames upstream — hearts hit 0 at step 35 in d1 0,3,5, respawn at the dungeon mouth, and every later directive addressed a room Link wasn't in. Frame-by-frame A/B (with/without zol_death) showed the runs identical to frame 4654 and diverging the frame the zol dies: dFight retreats whenever dist < NEAR, fence strips that direction at a room edge, so a chaser in contact pins the actor and it backs into the wall without ever swinging. Now swings when the retreat is actually blocked. Also found a REAL GAME BUG on the way, unrelated to the crash: dying (not yet dead) enemies dealt full contact damage for their whole defeat pose — 72 frames for a boss explosion — proved against a live-enemy control (alive 16/16 hits, dying 16/16, now 0/16); same omission let the Dredge Line snag a corpse. replay.mjs was ALREADY RED on main (49/51) and nobody noticed; re-recorded d1-descent, 51/51. check-playthrough 21/21 for the first time ever, with every deathFrame intact — nothing skipped, disabled or granted. DETOUR TOKENS 1 -> 0
S32 | objective | gave leever a deathFrame (7th, after gel/keese/octorok/urchin/crab/zol) — hp2, deathFrame-only. Checked the sheet's "Leever" plate first, specifically for a death pose distinct from a hurt one: 4 frames total — buried mound (unused, engine hides the sprite outright), two fully-emerged claws-raised poses (leever_0/1, already used), and a THIRD, previously-unmapped frame (box137) between them: claws only partway up, body still low, same palette as the other two. Real extraction, not hand-drawn — added leever_death:(137,0.5,1.0,False) to rip-enemies.py's FRAMES and re-emitted (59 sprites now), check-rippers stayed 17/17. Reads as the creature sinking back down rather than standing fully risen — its own burrowing nature doubling as its defeat pose. Confirmed no z field. Verified BOTH halves of the submerge() interaction in-engine, not just re-derived from S20's hurtFrame-era finding: pinned _subState='down'/hidden=true/invuln=9999 and confirmed a lethal hit does NOT connect at all (hurt() returns false, hp/dying untouched); pinned _subState='up' and confirmed a lethal hit DOES connect, dying=true, spriteName() returns leever_death, holds the full ~16-frame stall, then dead=true. check-drift reads leever: walk,death. validate/test(83/83)/check-rippers(17/17)/check-build all green. Per this session's own instructions, check-playthrough and replay were expected GREEN going in (S31 fixed both) rather than a known-bad baseline — ran both after the change: replay.mjs 51/51 unchanged, check-playthrough.mjs 21/21 unchanged, confirming this session's own deathFrame did not reopen the timing issue S31 closed. dist rebuilt, pushed to branch + fast-forwarded main
