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
S36 | objective | gave beetle a deathFrame (11th) — hp3, shield:'front', charge() AI. Checked the sheet's own "Spiked Beetle" plate: exactly 4 frames (upright front x2, balled-up side x2), all already used, nothing to extract. Hand-drew beetle_death as an octorok_death-style every-other-row squash of beetle_d0 (the upright resting pose, not the charge-ball beetle_s0/s1) — deliberately chose the upright shape so the pose reads as collapsed rather than as mid-uncurl, which could read as about to charge instead. FIRST explicit test of a shield:'front' enemy against a LETHAL hit in this thread (crab, S29, has the same field but the interaction was never directly probed) — confirmed in-engine that a hit arriving at the shielded front is blocked outright even for 99 damage (hurt() returns false, hp/dying both untouched), and that a hit from an unshielded angle connects normally: a non-lethal hit (hp3->1) shows beetle_hurt and reverts to the walk cycle once the flicker window ends, the lethal follow-up shows beetle_death (never beetle_hurt) for the full 20-frame stall then dead=true, removed. Confirmed no z field. check-drift reads beetle: walk,hurt,death. validate/test(83/83) green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged (no re-record needed). check-build OK, dist rebuilt. sprites-enemies.js untouched (hand-drawn, not extracted) so check-rippers not re-run. Next: darknut (hp6, shield:'front', only vulnerable from behind) — first deathFrame target needing THREE hits at swordDamage 2 (6->4->2->0), a stronger repeat-hurtFrame proof than any prior two-hit case
S37 | objective | gave darknut a deathFrame (12th) — hp6, shield:'front', the first target needing THREE hits at swordDamage 2 (6->4->2->0). Checked the sheet's own "Darknut" plate properly rather than assuming the four boxes already used were the whole story: it actually has SIX+ poses — box57 (unused, between darknut_d0/56 and darknut_s0/58) is a genuine extraction find, a hunched-forward, head-down posture with no shield or sword visible, same red/tan/black palette as the live frames, confirmed by viewing it directly rather than assuming from adjacency. Added darknut_death:(57,0.5,0.5,False) to rip-enemies.py's FRAMES and re-emitted (61 sprites now, up from 60); check-rippers stayed 17/17. Verified the FULL three-hit sequence in-engine on one instance: shielded-front hit blocked outright even at 99 damage (hp/dying untouched, same mechanism beetle S81 confirmed); hit1 (hp6->4) shows darknut_hurt, reverts to walk cycle after the flicker window; hit2 (hp4->2) shows darknut_hurt AGAIN — the actual new ground this session covers, confirmed explicitly rather than assumed to generalise from one hit; hit3 (hp2->0) shows darknut_death (never darknut_hurt) for the full 20-frame stall, then dead=true, removed. Confirmed no z field. check-drift reads darknut: walk,hurt,death. validate/test(83/83) green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged (no re-record needed). check-build OK, dist rebuilt. Next: wizzrobe (hp3, submerge()-based appear/disappear like leever S32, but combined with hurtFrame for the first time — untested whether a hit during the hidden phase stays blocked and whether the flicker/hurt window survives a submerge cycle mid-way)
S38 | objective | gave wizzrobe a deathFrame (13th) — hp3, submerge()-based appear/disappear ('blinks in, fires, blinks out'). Checked the sheet's own "Wizzrobe" plate properly: it actually has THREE green-palette (#10ad42) frames, not two — box335 to the left is a DIFFERENT creature (red palette, belongs to "Whisp"), confirmed by comparing quantised palettes directly rather than trusting visual adjacency; box338, right after the two already used, is a genuine unused third frame: its top half matches wizzrobe_0's small hood, its bottom half matches wizzrobe_1's full robe — a real mid-transition pose. Added wizzrobe_death:(338,0.5,0.5,False) to rip-enemies.py's FRAMES and re-emitted (62 sprites now, up from 61); check-rippers stayed 17/17. FIRST test of submerge()'s hidden/invuln mechanism (already proven by leever S32) COMBINED with hurtFrame on the same enemy — confirmed a hit while hidden is blocked outright (hurt() returns false, hp/dying untouched), same as leever. FOUND A REAL, BENIGN QUIRK verifying the flicker-vs-submerge interaction directly: hitting wizzrobe non-lethally just before its 'up' timer expires does NOT cancel the flicker countdown when it flips to 'down' — flicker keeps counting from its own value, spriteName() still technically returns wizzrobe_hurt while hidden=true — but game.js:1772's render loop skips ANY entity with hidden=true unconditionally, so this is invisible to a player; confirmed by reading the actual render-skip line, not assumed. invuln is correctly overwritten to 9999 by the submerge transition regardless of the flicker-driven invuln already in progress. Separately verified the ordinary two-hit sequence with no submerge interference: hit1 (hp3->1) shows wizzrobe_hurt and reverts correctly, lethal hit2 shows wizzrobe_death for the full 20-frame stall. Confirmed no z field. check-drift reads wizzrobe: walk,hurt,death. validate/test(83/83) green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged. check-build OK, dist rebuilt. Next: pincer (hp3, speed:0, tethered snap-out-and-reel AI, no shield/submerge — a genuinely different movement shape from anything tested so far in this thread)
