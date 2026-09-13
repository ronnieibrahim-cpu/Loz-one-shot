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
    new frames go through the ripper, or a NEW hand-authored file if none
  src/data/sprites-enemies-hurt.js (hand-drawn hurtFrame/deathFrame art the
    sheet lacks — new keys need only sprite-manifest.js)
  src/data/enemies.js (wire hurtFrame/deathFrame/attackFrame on a
    defineEnemy call, S12/S13/S43; attackFrame set via shoot()/shootRing())
  src/data/feel.js — new constant needs a unit + provenance comment,
    check-feel.mjs must stay green (ENEMY_ATTACK_FRAMES, S43)
  src/game/enemy.js — spriteName priority dying>hurtFrame>attackFrame>walk
  tools/check-drift.mjs — "hurt"/"death"/"attack" read the real spec field,
    no naming proxy left (S14/S43)
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
S46 | objective | hand-drew wisp_atk, the SECOND genuinely new attack pose (after octorok_atk, S45). Confirmed wisp's real spec first (hp3, pal:'magic', frames:['wisp_0','wisp_1'], z:8, shootRing()). Re-confirmed nothing extractable a second time (Spark's plate has exactly 2 frames, both already spent on the ordinary lit/unlit flicker); ran rip-enemies.py unmodified first, byte-identical. Considered and REJECTED reusing wisp_1 (the inverted-colour flicker frame) as the attack pose the way moblin reused an unused walk frame at S43 — rejected because wisp_1 is not a materially different pose, only the same silhouette a player already sees every other tick during ordinary idle flicker, unlike moblin_d1's genuinely distinct "spear raised" art; freezing on it would not read as a telegraph. Hand-drew instead, rendering wisp_0/wisp_1/wisp_hurt/wisp_death from their real runtime 'magic' palette to a PNG first (same technique S90 used) rather than reading grids blind. Found wisp_hurt already shrinks the wide grin down to a small wince (existing art) — so wisp_atk goes the OTHER direction: the same grin widened further (4 pixels: 2 corner-teeth at row10 extended inward, row11's centre span widened to match), reading as the mouth opening wide right before it unleashes the ring of orbs. Spiky halo and both eyes untouched. Wired attackFrame:'wisp_atk' (plain string — wisp's frames is a flat array, no facings). Verified in-engine (scratch Playwright probe): wisp_atk shows immediately, holds the full 16-frame ENEMY_ATTACK_FRAMES window, reverts correctly to wisp_0; z stays 8 throughout (no height complication); a mid-attack non-lethal hit correctly interrupts to wisp_hurt (wisp HAS hurtFrame, unlike octorok) confirming spriteName()'s dying>hurtFrame>attackFrame ordering holds on this side of the case too. check-drift now reads wisp: walk,attack,hurt,death — 3 of 22 complete, up from 2. validate/test(83/83)/check-feel all green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged, check-rippers 17/17 (hand-drawn only). check-build OK, dist rebuilt. wizzrobe and siren remain, each needing its own new pose. Next session: hand-draw wizzrobe_atk — wizzrobe's one spare sheet frame was already spent on deathFrame (S83), so this is hand-drawn same as wisp/octorok
S47 | objective | hand-drew wizzrobe_atk, the THIRD genuinely new attack pose (after octorok_atk S45, wisp_atk S46). Confirmed spec (hp3, dmg3, pal:'enemyp', frames:['wizzrobe_0','wizzrobe_1'], submerge()+shoot() in whileUp). Re-confirmed nothing extractable (3rd sheet frame already spent on deathFrame at S83); ran rip-enemies.py unmodified first, byte-identical. Rendered wizzrobe_0/_1/_death/_hurt from the real runtime enemyp palette to PNGs (S90/S91's technique) — found wizzrobe_hurt already claims the right cheek with palette index 2 (a bruise mark), and wisp_atk (S91) already owns the "mouth widens" grammar, so used a different, untouched feature: the two narrow 1-column eye slits (rows7-8, cols6&9 on wizzrobe_0's grid). Widened each one column inward (cols5&10 added at both rows, 4 pixels total) so each eye reads as a wider, rounder "eyes going wide as the orb charges" rather than the idle frame's thin half-lidded slits. Hat/hood/collar/mouth all byte-identical to wizzrobe_0. Wired attackFrame:'wizzrobe_atk' (plain string, flat frames array). Verified in-engine (scratch Playwright probe): shows immediately on attackTime, holds the full 16-frame window, reverts correctly to the ordinary cycle; mid-attack hit correctly interrupts to wizzrobe_hurt (has hurtFrame); also checked the submerge()/hidden edge case directly rather than assuming it's fine — spriteName() itself does NOT gate on e.hidden, so a shot fired near the end of the up-phase could in theory leave attackTime still counting when submerge() flips hidden=true, but confirmed the draw loop (game.js:1772, `if (e.hidden) continue`) skips e.draw() (and therefore spriteName()) entirely for any hidden entity regardless of which pose field is active — so nothing wrong is ever actually drawn, a stronger guarantee than wizzrobe_hurt's own invuln-forced-9999 approach and one that covers attackFrame automatically for every enemy. check-drift now reads wizzrobe: walk,attack,hurt,death — 4 of 22 complete, up from 3. validate/test(83/83)/check-feel all green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged, check-rippers 17/17 (hand-drawn only). check-build OK, dist rebuilt. Only siren remains of the 5 hand-draw-needed enemies from S44's survey. Next session: hand-draw siren_atk — the LAST of the 5, closing that whole sub-thread
S48 | objective | closed the shoot()/shootRing() attackFrame sub-thread (running since S43) by finding siren didn't need hand-drawn art at all — a real zero-new-art win S89's survey missed. S89 tested all 7 remaining candidates only for an UNUSED third sheet frame (correctly finding none for siren); it never asked the DIFFERENT question that qualified moblin at S43: does an ALREADY-used second frame show a genuinely distinct pose. siren_1 ("open singing ring-shot pose", per siren_hurt's own existing comment) is a real shape change from siren_0 (fanged mouth shut vs. wide round mouth open) — confirmed by rendering both from the real runtime enemyb palette, not a mere recolour the way wisp_1 was correctly rejected at S91. Wired attackFrame:'siren_1' directly, no new art, no sprite-manifest.js change (already registered), documented the reasoning inline in enemies.js including why this differs from the wisp_1 rejection. Verified in-engine: siren_1 shows immediately on attackTime, decrements correctly when isolated from siren's own periodic shootRing() re-fire (probe artifact, not a bug — every() uses a per-entity hashed phase offset so re-fire timing varies), mid-attack hit correctly interrupts to siren_hurt, siren_1 still appears normally in the ordinary 2-frame cycle. check-drift now reads siren: walk,attack,hurt,death — 5 of 22 complete, up from 4. validate/test(83/83)/check-feel all green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged (no new replay divergence — siren's death-stall replay fix already landed at S86), check-rippers 17/17 (sprites-enemies.js untouched). check-build OK, dist rebuilt. **ALL 8 shoot()/shootRing() users now have attackFrame** (moblin/beamos/barnacle S43-44, octorok/octorokSea S45, wisp S46, wizzrobe S47, siren S48) — the entire sub-thread from S88 is closed. Found the next real candidate while closing this one: charge()'s own `tell` parameter (src/game/enemy.js) already freezes a charging enemy via `e.stun` for a windup period before the lunge — beetle/darknut/anglerfry all use it (tell:16/22/26) and all three already have hurtFrame+deathFrame, missing only attack. This is structurally the same "there's already a windup moment, it just doesn't swap the sprite yet" situation shoot() was in before S43, but needs charge() itself to set e.attackTime (variable duration = tell, not the fixed ENEMY_ATTACK_FRAMES) rather than reusing shoot()'s existing wiring untouched. Next session: build that, survey beetle/darknut/anglerfry for reusable vs. hand-drawn art the same way S89 surveyed the shoot() users
