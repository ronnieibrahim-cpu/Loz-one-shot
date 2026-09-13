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
S49 | objective | built attackFrame support for charge() (src/game/enemy.js) — the melee-lunge counterpart to shoot()/shootRing()'s S43 mechanism — and piloted it on beetle, a SECOND zero-new-art reuse in a row (after siren S48). charge()'s own `tell` parameter already freezes an enemy via e.stun before it lunges (update()'s `if(stun>0){stun--;return}` skips ai() for that many frames); added `if (o.tell) e.attackTime = o.tell;` alongside the existing stun write, using the caller's own tell value (beetle 16, darknut 22, anglerfry 26) rather than the fixed ENEMY_ATTACK_FRAMES shoot() uses, since the pose should last exactly as long as the freeze does. Checked beetle for a reuse before drawing: beetle_hurt's own existing comment already names beetle_s0/s1 as "two balled-charge frames" distinct from the upright beetle_d0/d1 pair; rendered both from the real runtime enemyk palette and confirmed a genuine shape change (curled ball with a target pattern vs. upright bug with spread legs/antennae) — not a recolour, passing the same test S91 used to reject wisp_1. Wired attackFrame:'beetle_s0' (plain string, non-directional like octorok_atk, since beetle only has a second pose for the SIDE facing — a charge starting while facing down/up would otherwise show nothing). Verified in-engine with a real ai()-driven trigger (not forced by hand): charge() fires, stun and attackTime count down together for the full 16-frame window while the enemy stays frozen showing beetle_s0 throughout, both hit 0 on the same tick and the sprite correctly reverts to the ordinary cycle; a mid-windup hit correctly interrupts to beetle_hurt. check-drift now reads beetle: walk,attack,hurt,death — 6 of 22 complete, up from 5. validate/test(83/83)/check-feel all green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged (the engine change to charge() didn't move any recorded plan). check-rippers 17/17 (sprites-enemies.js untouched — reuse, not new art). check-build OK, dist rebuilt. darknut (tell:22) and anglerfry (tell:26) remain — both already have hurtFrame+deathFrame, both use the same charge() primitive now carrying attackFrame support, so this is a straight survey-and-wire session same as S89's shoot() survey. Next session: check both for a beetle_s0-style reuse before assuming either needs hand-drawn art
S50 | objective | wired attackFrame on the last 2 charge() users, closing that whole sub-thread too (mechanism built S49, piloted on beetle). Checked both for a beetle_s0-style reuse first: neither qualified. anglerfry_0/1 differ only in a subtle lure-bob/mouth-chomp idle cycle (42/256 px differ but concentrated in ambient animation, not a distinct "about to lunge" shape) — rendered both from the real enemyb palette to confirm rather than assume. darknut raised a real investigation: darknut_hurt's own existing comment already named "a raised-sword windup, four side-lunge poses" as present on the sheet (from S18's flinch-pose check) — re-examined those same boxes (found via a scratch contact-sheet script reusing rip-enemies.py's own find_boxes/strip_plates) with an attack pose in mind. Inconclusive: the boxes directly below darknut's 4 main frames (same region darknut_d1 already sources its top half from) are oddly-tall merged boxes showing what looks like a raised tan arm repeated identically under all 4, more consistent with flood-fill bleed from an unrelated neighbouring sprite than 4 genuine lunge poses — not confident enough to extract (CLAUDE.md: composited/guessed content needs to be believed, not assumed). Also noted this game's own darknut charges shield-first, not sword-first (ai() is a shield lunge, src/data/enemies.js), so a sword-raise pose would show the wrong weapon regardless. Hand-drew both instead: darknut_atk widens darknut_d0's own shield band (row12, 4 px, red span 4->8 wide) reading as braced/thrust forward; anglerfry_atk widens anglerfry_0's own fang row (rows13-14, 4 px) reading as the jaw opened wider than either idle frame. Wired both as attackFrame (darknut: one non-directional pose like octorok_atk/beetle_s0, since only a front variant was drawn). Verified in-engine with the real AI actually triggering charge() on fresh instances: both show their pose immediately, hold for their own tell (22/26 frames respectively) with stun/attackTime in lockstep, revert correctly on expiry; both interrupt correctly to their hurtFrame on a mid-windup hit. check-drift now reads darknut: walk,attack,hurt,death and anglerfry: walk,attack,hurt,death — 8 of 22 complete, up from 6. validate/test(83/83)/check-feel all green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged, check-rippers 17/17 (sprites-enemies.js confirmed byte-identical, untouched — hand-drawn only). check-build OK, dist rebuilt. **ALL 3 charge() users now have attackFrame, closing that sub-thread alongside the shoot()/shootRing() one** — every ranged AND melee-lunge enemy in the roster now telegraphs its attack. Remaining gap for objective #4: 9 pure-contact enemies (crab, zol, gel, keese, leever, tektite, urchin, jellyfish, pincer) have no shoot()/shootRing()/charge() at all, so "attack" has no natural hook for them yet — a genuine open design question, not a wiring task. Also: idle states are still completely unaddressed roster-wide. Next session should tackle one of these two real gaps rather than looking for a 4th telegraph mechanism that doesn't exist
S51 | objective | built attackFrame support for hop() (src/game/enemy.js) — the THIRD telegraph mechanism found already sitting in the engine (after shoot()/shootRing() S88, charge() S94) — and piloted it on zol. hop() has its own '_hopState' wait/air machine; unlike charge()'s tell (a short window that IS the whole pre-lunge freeze), hop()'s wait is the enemy's ENTIRE rest between hops (34-52f), so showing an attack pose for all of it would read as "always attacking". Windowed it to only the last ENEMY_ATTACK_FRAMES (reused, no new constant — both current wait values comfortably exceed it) of the wait. Found and FIXED a genuine 1-frame phase lag by measuring rather than assuming: triggering the crossover at the same _hopWait value update() decrements attackTime at left the pose showing one tick into the actual jump, since attackTime's own decrement happens at the top of update() (before ai()/hop() runs) while hopWait's trigger decrement happens later in the same frame call — caught with a scratch probe tracing hopState/attackTime frame-by-frame across two full hop cycles, fixed by triggering one tick earlier (+1), reverified the pose now clears on the EXACT frame the state flips to 'air', not one frame late. Piloted on zol: reused zol_1 (no hand-drawn art) — rip-enemies.py's own FRAMES comment already described it as "round at rest, stretched tall mid-hop", a real shape change from zol_0, not a recolour; the windup now guarantees that stretch shows before every hop instead of only sometimes via ordinary tick-based cycling. zol has no hurtFrame (hp2, always lethal) so no interrupt-with-hurtFrame case applies, but confirmed a lethal mid-windup hit still correctly shows zol_death (dying beats attackFrame). check-drift reads zol: walk,attack,death. validate/test(83/83)/check-feel/check-motion (8/8, the lattice checker hop() itself is covered by) all green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged, check-rippers 17/17 (sprites-enemies.js untouched — reuse, not new art). check-build OK, dist rebuilt. tektite (the other hop() user, hp2 also — no hurtFrame either) remains for a follow-up survey session, same cadence as the shoot()/charge() rosters. Beyond that, this thread (giving existing engine windups a sprite) may be exhausted: no 4th movement primitive with an unused pause is known — the true remaining gaps are the 7 pure-contact enemies with NO windup-shaped primitive at all (crab/gel/keese/leever/urchin/jellyfish/pincer) and idle states roster-wide, both real design questions, not more wiring
