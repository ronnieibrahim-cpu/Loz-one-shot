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
S47 | objective | hand-drew wizzrobe_atk, the THIRD genuinely new attack pose (after octorok_atk S45, wisp_atk S46). Confirmed spec (hp3, dmg3, pal:'enemyp', frames:['wizzrobe_0','wizzrobe_1'], submerge()+shoot() in whileUp). Re-confirmed nothing extractable (3rd sheet frame already spent on deathFrame at S83); ran rip-enemies.py unmodified first, byte-identical. Rendered wizzrobe_0/_1/_death/_hurt from the real runtime enemyp palette to PNGs (S90/S91's technique) — found wizzrobe_hurt already claims the right cheek with palette index 2 (a bruise mark), and wisp_atk (S91) already owns the "mouth widens" grammar, so used a different, untouched feature: the two narrow 1-column eye slits (rows7-8, cols6&9 on wizzrobe_0's grid). Widened each one column inward (cols5&10 added at both rows, 4 pixels total) so each eye reads as a wider, rounder "eyes going wide as the orb charges" rather than the idle frame's thin half-lidded slits. Hat/hood/collar/mouth all byte-identical to wizzrobe_0. Wired attackFrame:'wizzrobe_atk' (plain string, flat frames array). Verified in-engine (scratch Playwright probe): shows immediately on attackTime, holds the full 16-frame window, reverts correctly to the ordinary cycle; mid-attack hit correctly interrupts to wizzrobe_hurt (has hurtFrame); also checked the submerge()/hidden edge case directly rather than assuming it's fine — spriteName() itself does NOT gate on e.hidden, so a shot fired near the end of the up-phase could in theory leave attackTime still counting when submerge() flips hidden=true, but confirmed the draw loop (game.js:1772, `if (e.hidden) continue`) skips e.draw() (and therefore spriteName()) entirely for any hidden entity regardless of which pose field is active — so nothing wrong is ever actually drawn, a stronger guarantee than wizzrobe_hurt's own invuln-forced-9999 approach and one that covers attackFrame automatically for every enemy. check-drift now reads wizzrobe: walk,attack,hurt,death — 4 of 22 complete, up from 3. validate/test(83/83)/check-feel all green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged, check-rippers 17/17 (hand-drawn only). check-build OK, dist rebuilt. Only siren remains of the 5 hand-draw-needed enemies from S44's survey. Next session: hand-draw siren_atk — the LAST of the 5, closing that whole sub-thread
S48 | objective | closed the shoot()/shootRing() attackFrame sub-thread (running since S43) by finding siren didn't need hand-drawn art at all — a real zero-new-art win S89's survey missed. S89 tested all 7 remaining candidates only for an UNUSED third sheet frame (correctly finding none for siren); it never asked the DIFFERENT question that qualified moblin at S43: does an ALREADY-used second frame show a genuinely distinct pose. siren_1 ("open singing ring-shot pose", per siren_hurt's own existing comment) is a real shape change from siren_0 (fanged mouth shut vs. wide round mouth open) — confirmed by rendering both from the real runtime enemyb palette, not a mere recolour the way wisp_1 was correctly rejected at S91. Wired attackFrame:'siren_1' directly, no new art, no sprite-manifest.js change (already registered), documented the reasoning inline in enemies.js including why this differs from the wisp_1 rejection. Verified in-engine: siren_1 shows immediately on attackTime, decrements correctly when isolated from siren's own periodic shootRing() re-fire (probe artifact, not a bug — every() uses a per-entity hashed phase offset so re-fire timing varies), mid-attack hit correctly interrupts to siren_hurt, siren_1 still appears normally in the ordinary 2-frame cycle. check-drift now reads siren: walk,attack,hurt,death — 5 of 22 complete, up from 4. validate/test(83/83)/check-feel all green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged (no new replay divergence — siren's death-stall replay fix already landed at S86), check-rippers 17/17 (sprites-enemies.js untouched). check-build OK, dist rebuilt. **ALL 8 shoot()/shootRing() users now have attackFrame** (moblin/beamos/barnacle S43-44, octorok/octorokSea S45, wisp S46, wizzrobe S47, siren S48) — the entire sub-thread from S88 is closed. Found the next real candidate while closing this one: charge()'s own `tell` parameter (src/game/enemy.js) already freezes a charging enemy via `e.stun` for a windup period before the lunge — beetle/darknut/anglerfry all use it (tell:16/22/26) and all three already have hurtFrame+deathFrame, missing only attack. This is structurally the same "there's already a windup moment, it just doesn't swap the sprite yet" situation shoot() was in before S43, but needs charge() itself to set e.attackTime (variable duration = tell, not the fixed ENEMY_ATTACK_FRAMES) rather than reusing shoot()'s existing wiring untouched. Next session: build that, survey beetle/darknut/anglerfry for reusable vs. hand-drawn art the same way S89 surveyed the shoot() users
S49 | objective | built attackFrame support for charge() (src/game/enemy.js) — the melee-lunge counterpart to shoot()/shootRing()'s S43 mechanism — and piloted it on beetle, a SECOND zero-new-art reuse in a row (after siren S48). charge()'s own `tell` parameter already freezes an enemy via e.stun before it lunges (update()'s `if(stun>0){stun--;return}` skips ai() for that many frames); added `if (o.tell) e.attackTime = o.tell;` alongside the existing stun write, using the caller's own tell value (beetle 16, darknut 22, anglerfry 26) rather than the fixed ENEMY_ATTACK_FRAMES shoot() uses, since the pose should last exactly as long as the freeze does. Checked beetle for a reuse before drawing: beetle_hurt's own existing comment already names beetle_s0/s1 as "two balled-charge frames" distinct from the upright beetle_d0/d1 pair; rendered both from the real runtime enemyk palette and confirmed a genuine shape change (curled ball with a target pattern vs. upright bug with spread legs/antennae) — not a recolour, passing the same test S91 used to reject wisp_1. Wired attackFrame:'beetle_s0' (plain string, non-directional like octorok_atk, since beetle only has a second pose for the SIDE facing — a charge starting while facing down/up would otherwise show nothing). Verified in-engine with a real ai()-driven trigger (not forced by hand): charge() fires, stun and attackTime count down together for the full 16-frame window while the enemy stays frozen showing beetle_s0 throughout, both hit 0 on the same tick and the sprite correctly reverts to the ordinary cycle; a mid-windup hit correctly interrupts to beetle_hurt. check-drift now reads beetle: walk,attack,hurt,death — 6 of 22 complete, up from 5. validate/test(83/83)/check-feel all green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged (the engine change to charge() didn't move any recorded plan). check-rippers 17/17 (sprites-enemies.js untouched — reuse, not new art). check-build OK, dist rebuilt. darknut (tell:22) and anglerfry (tell:26) remain — both already have hurtFrame+deathFrame, both use the same charge() primitive now carrying attackFrame support, so this is a straight survey-and-wire session same as S89's shoot() survey. Next session: check both for a beetle_s0-style reuse before assuming either needs hand-drawn art
