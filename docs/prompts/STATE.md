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
S55 | objective | Per NEXT-PROMPT.md's own instruction, judged whether any of the 8 remaining idle candidates (beamos, barnacle, wizzrobe, siren, keese, zol, tektite, pincer) deserve the same hand-drawn treatment urchin got in S54 — NOT just re-checking for spare art, but asking urchin's real question: does a distinct idle pose teach the player something new. Found NONE of them clear that bar: beamos/barnacle have no safe/dangerous sub-state at all (always capable of firing when aligned, and attackFrame already marks the one moment that differs); wizzrobe/siren's whileUp callbacks fire on a bare frame counter with NO range/distance check at all (confirmed by rereading their ai() blocks directly, not assumed) so the entire surfaced window is uniformly dangerous, unlike urchin's real tide split; keese/zol/tektite's stillness already reads as "safe" through ordinary movement (motionless = not closing distance), making a separate pose redundant with what the player already reads; pincer's whole lesson is its measured snap-and-return reach, which comes from watching the head's stop point, not from a resting pose. Zero code changes this session — wrote the full per-enemy reasoning into docs/ENEMIES.md's idle section and tightened the docs/prompts/LEDGER.md negation to say the bar failed, not just "no spare art," so a future session doesn't reopen this by re-running the art search alone. Also found, while re-checking urchin's own "harmless" claim for this comparison, a genuine gap: Player.updateContactDamage (src/game/player.js) skips contact damage via e.harmless (also via e.dormant, which urchin doesn't use — it declares no spec.tideOnly), and nothing had ever set e.harmless for urchin, so a "dozing" urchin at LOW tide still dealt its full contact damage on touch; only its movement was actually tide-gated. Recorded in docs/NEXT-SESSION.md (S99) per the charter's own rule 5 first, then — since the fix turned out to be one line reusing an existing, already-read engine flag (the same one submerge()'s down/up cycle already toggles) rather than a new mechanism — fixed it in this same session rather than deferring: urchin's ai() now sets e.harmless from the same g.tide.level < 1 condition e.idle already uses. Verified in-engine with a scratch probe placing the player directly on an urchin at each tide level: LOW takes zero damage, HIGH takes the normal 2 quarter-hearts; sword damage TO the enemy confirmed unaffected either way. docs/ENEMIES.md and docs/prompts/LEDGER.md updated to record the fix, not just the finding. validate/test(83/83)/check-feel/check-motion(8/8)/check-playthrough(21/21)/replay(51/51)/check-rippers(17/17) all green and unchanged (urchin doesn't appear on the playthrough route or replay tapes). check-build OK, dist rebuilt
S56 | objective | AUDITED all 22 docs/ENEMIES.md lessons against the real code in src/data/enemies.js/src/game/enemy.js, per NEXT-PROMPT.md's own instruction following S99's accidental urchin find. Confirmed each with a scratch probe (check-motion.mjs's headless boot pattern), not by reasoning alone. Two real code bugs found and fixed: beamos claimed "only fires along its own facing axis" but had aim:true with no aligned() check, firing an aimed shot at any range <80 regardless of alignment — probe confirmed a hit 40px off both axes; fixed to match octorok's own shape (aligned(e,g,14) gates the shot, no aim passed), reprobed at 0 off-axis hits. leever claimed to spend "most of its time buried" but its submerge(down:70,up:110) had it surfaced the LONGER half of every cycle — probe measured 38.5% hidden; swapped to down:110,up:70 (same 180f total), reprobed at 60.5% hidden. Neither is on check-playthrough's route or a replay tape, so no timing-drift risk. One doc-only fix: anglerfry's "sits still like part of the scenery" line was wrong, not the code — its idle wander(speed:0.35) genuinely drifts (~82px/600f measured), and this file's own "Why this ordering" section already correctly lists it as "never meaningfully still," contradicting the roster table's own line; reworded the line rather than nerf a deliberate behavior (code comment: "Drifts on its lure"). Other 18 lessons read and checked out true, including every shield:'front' claim traced through Enemy.hurt()'s opposite[dir]===this.dir check against both a projectile's travel dir and a sword swing's this.dir (player's own facing) — consistent for both. Full regression: validate/test(83/83)/check-feel/check-motion(8/8) all green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged, check-rippers 17/17 (no generated sprite file touched). check-build OK, dist rebuilt. docs/ENEMIES.md and docs/prompts/LEDGER.md updated with the full account; no findings deferred to docs/NEXT-SESSION.md since every real mismatch found was small enough to fix in this same session
S57 | objective | Per NEXT-PROMPT.md's own instruction, made the written decision on idle's remaining 8 candidates rather than leaving it open again. Ran a genuine WHOLE-SHEET re-audit (all 344 boxes on oracle-seasons-enemies.png via find_boxes/strip_plates, not S53's near-the-block scoping) for beamos/barnacle/wizzrobe/siren/keese/zol/tektite/pincer: built each candidate's quantised palette, flagged every unclaimed box anywhere on the sheet sharing >60% of it (42-189 hits per candidate — the signal is weak since the sheet's colour vocabulary is small), then rendered the strongest hits at 6x and looked at them directly. Every hit is a different creature sharing only a colour family (a helmet enemy for wizzrobe's green, an eyeball-spike and a sword prop for beamos/siren, a coiled shell for keese, unrelated red enemies for zol/pincer) — never a second pose of the actual target. Zero unclaimed frames exist anywhere on the sheet for any of the 8, not just near their own block, closing the "maybe S53 missed a spot" question for good. Combined with S55's independent design-merit finding (none of the 8 clear urchin's own dormant/awake bar), the decision is written into docs/ENEMIES.md's Idle section and docs/prompts/LEDGER.md's negations: urchin is the only enemy this roster's idleFrame lands on; objective #4's literal "every enemy has idle/.../death" done-condition cannot be met for idle without hand-drawing new art for all 8 from scratch, which is flagged to the user as a call for them, not defaulted into. Zero code changes this session (rip-enemies.py/sprites-enemies.js untouched, confirmed via check-rippers 17/17 before and after). Full regression unchanged: validate/test(83/83)/check-feel/check-motion(8/8)/check-playthrough(21/21)/replay(51/51)/check-rippers(17/17)/check-build all green
