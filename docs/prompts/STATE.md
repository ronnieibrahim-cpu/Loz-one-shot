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
S53 | objective | SCOPING session on idle states (no wiring), per NEXT-PROMPT.md's own instruction after S52 named it the other real gap. Confirmed directly: Enemy.spriteName() (src/game/enemy.js) has no idle concept at all — priority is dying > hurtFrame > attackFrame > walk cycle, and a stationary enemy just shows its ordinary tick-cycled frames. Read all 22 ai() functions in src/data/enemies.js: 13 enemies (octorok, octorokSea, crab, gel, leever, bubble, beetle, moblin, stalfos, darknut, anglerfry, jellyfish, wisp) are never meaningfully still — chase/flee/wander/patrol/bounceDiag/orbit or charge()'s own idle: callback. 9 DO have a genuine standing-still state: beamos/barnacle (stationary their whole life), wizzrobe/siren (motionless between shots while surfaced), keese/zol/tektite (the wait before their existing attackFrame window), pincer (its 'hole' state), urchin (does nothing at all below tide level 1 — the strongest candidate, a real dormant/awake distinction). Then checked the actual blocker for those 9: art. Re-checked tools/rip-enemies.py's own coordinate-map comments (the same method every attackFrame/hurtFrame/deathFrame reuse this objective has used) for a spare frame near each of the 9 — every candidate those comments already name (beamos box 20, barnacle box 144, urchin box 295, wizzrobe box 338, pincer boxes 232/235) is ALREADY spent on that enemy's own attackFrame/hurtFrame/deathFrame; keese/zol/tektite/siren never had a third frame at all, both their only 2 frames already walk-cycle + attackFrame. Zero unclaimed art remains for any of the 9 — confirmed by table, not assumed. Did NOT pilot idle on any enemy: urchin was the strongest AI-shape candidate (no attackFrame competing for its 2 frames) but still has no free art. Wrote the full scope into docs/ENEMIES.md and the negation into docs/prompts/LEDGER.md, fixed a stale "0 of 22" line, left the hand-draw-or-not decision for urchin specifically to the next session rather than deciding it under scoping-session scope
S54 | objective | PILOTED idleFrame on urchin, following S53's own recommendation and CLAUDE.md's "if no sheet has it, draw it to match" rule (hand-drawing is not a shortcut here — S53 already proved the sheets are exhausted). Added spec.idleFrame to Enemy.spriteName() (src/game/enemy.js): same single-pose shape as attackFrame, checked between attackFrame and the plain walk cycle, gated on a new explicit this.idle flag the enemy's own ai() sets directly (never a generic movement timer — S53 already ruled that out). Wired on urchin (src/data/enemies.js): e.idle = g.tide.level < 1, the exact condition ai() already branches on. Hand-drew urchin_idle (src/data/sprites-enemies-hurt.js): iterated with an actual visual check before committing (rendered every candidate from the real palette via a scratch script, not just reasoned about the ASCII grid) — a first draft trimming only 2-3 edge pixels off urchin_0's crown looked IDENTICAL to it at real size once rendered, so it was discarded; the landed version blanks the crown's top 4 rows outright, sitting visibly lower/flatter than urchin_0/1's full spike crown while keeping the notched texture urchin_death's smooth dome fills in entirely — confirmed distinct from BOTH neighbours side by side before wiring it in. Verified in-engine with a scratch probe driving game.tide.setLevel() directly: LOW shows urchin_idle with e.idle true; HIGH reverts to the ordinary walk cycle with e.idle false; back to LOW re-triggers it; a lethal hit taken while dormant still shows urchin_death, not the idle pose (dying's priority over everything else, unmodified). Updated tools/check-drift.mjs to read idleFrame the same way as the other three fields and fixed its header comment (used to claim "no separate idle art" — no longer true); urchin now reports walk,idle,death. Updated docs/ENEMIES.md's idle section and docs/prompts/LEDGER.md to record the pilot as landed, distinct from the still-blocked other 8. Zero regression: validate/test(83/83)/check-feel/check-motion(8/8)/check-items(91/91)/check-hearts(114/114) all green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged, check-rippers 17/17 (sprites-enemies.js untouched — new art lives in the hand-drawn file only). check-build OK, dist rebuilt. Remaining for objective #4: 8 idle candidates still blocked on art (unchanged from S53), most of the roster still missing hurt/attack where hp or AI shape rules it out, and the ENEMIES.md lesson-uniqueness writeup (done since an earlier session, unaffected by this one)
S55 | objective | Per NEXT-PROMPT.md's own instruction, judged whether any of the 8 remaining idle candidates (beamos, barnacle, wizzrobe, siren, keese, zol, tektite, pincer) deserve the same hand-drawn treatment urchin got in S54 — NOT just re-checking for spare art, but asking urchin's real question: does a distinct idle pose teach the player something new. Found NONE of them clear that bar: beamos/barnacle have no safe/dangerous sub-state at all (always capable of firing when aligned, and attackFrame already marks the one moment that differs); wizzrobe/siren's whileUp callbacks fire on a bare frame counter with NO range/distance check at all (confirmed by rereading their ai() blocks directly, not assumed) so the entire surfaced window is uniformly dangerous, unlike urchin's real tide split; keese/zol/tektite's stillness already reads as "safe" through ordinary movement (motionless = not closing distance), making a separate pose redundant with what the player already reads; pincer's whole lesson is its measured snap-and-return reach, which comes from watching the head's stop point, not from a resting pose. Zero code changes this session — wrote the full per-enemy reasoning into docs/ENEMIES.md's idle section and tightened the docs/prompts/LEDGER.md negation to say the bar failed, not just "no spare art," so a future session doesn't reopen this by re-running the art search alone. Also found, while re-checking urchin's own "harmless" claim for this comparison, a genuine gap: Player.updateContactDamage (src/game/player.js) skips contact damage via e.harmless (also via e.dormant, which urchin doesn't use — it declares no spec.tideOnly), and nothing had ever set e.harmless for urchin, so a "dozing" urchin at LOW tide still dealt its full contact damage on touch; only its movement was actually tide-gated. Recorded in docs/NEXT-SESSION.md (S99) per the charter's own rule 5 first, then — since the fix turned out to be one line reusing an existing, already-read engine flag (the same one submerge()'s down/up cycle already toggles) rather than a new mechanism — fixed it in this same session rather than deferring: urchin's ai() now sets e.harmless from the same g.tide.level < 1 condition e.idle already uses. Verified in-engine with a scratch probe placing the player directly on an urchin at each tide level: LOW takes zero damage, HIGH takes the normal 2 quarter-hearts; sword damage TO the enemy confirmed unaffected either way. docs/ENEMIES.md and docs/prompts/LEDGER.md updated to record the fix, not just the finding. validate/test(83/83)/check-feel/check-motion(8/8)/check-playthrough(21/21)/replay(51/51)/check-rippers(17/17) all green and unchanged (urchin doesn't appear on the playthrough route or replay tapes). check-build OK, dist rebuilt
