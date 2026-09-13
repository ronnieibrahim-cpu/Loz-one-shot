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
S43 | objective | BUILT the actual attackFrame engine mechanism (mirroring hurtFrame/deathFrame's S12/S13 plumbing) and landed it on moblin, the first genuinely new engine feature in this whole objective rather than another enemy's death pose. Added spec.attackFrame (same shape as spec.frames — a plain string OR one entry per facing — but a single held pose, not a cycled array) and e.attackTime (src/game/enemy.js), set unconditionally inside shoot()/shootRing() (the shared funnel every ranged enemy attack passes through, mirroring Entity.hurt()'s own hitstop reasoning) so it's harmless for the many enemies with no attackFrame declared. spriteName() priority: dying > flicker/hurtFrame > attackTime/attackFrame > ordinary walk cycle — a hit correctly interrupts an in-progress attack pose, verified directly rather than assumed. Added ENEMY_ATTACK_FRAMES to feel.js (guessed, 16f); check-feel.mjs still passes with the new constant tagged. Wired moblin's existing moblin_d1/u1/s1 ("spear raised", already extracted, previously just an alternate walk-cycle frame per rip-enemies.py's own FRAMES comment) as attackFrame:{down,up,side} — deliberately LEFT those keys in the ordinary walk cycle too rather than removed, since moblin has no other second walk frame and pulling them out would make it look static; documented that choice inline. Verified in-engine across all three facings: shoot() immediately shows the correct facing's attack pose, attackTime counts down 16->0 precisely, then correctly falls through to the ordinary cycle; a non-lethal hit mid-attack immediately shows hurtFrame instead (interruption confirmed, not assumed); the ordinary walk cycle is untouched when no attack is firing. Updated check-drift.mjs's "attack" column from sprite-key-naming (the deliberately-temporary proxy S14 documented) to the real /\battackFrame\s*:/ regex, the exact fix S14 already made for "death" — removed the now-dead enemySpriteKeys block entirely rather than leaving it unused. check-drift now reads moblin: walk,attack,hurt,death — 1 of 22 complete, the FIRST enemy ever to hit that mark. validate/test(83/83)/check-feel all green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged. check-build OK, dist rebuilt. sprites-enemies.js untouched (no new art, pure engine + reuse of existing extracted frames) so check-rippers not re-run. Found 7 more shoot()/shootRing() users that could plausibly get the same treatment (octorok, octorokSea, beamos, wisp, wizzrobe, barnacle, siren) — not surveyed yet for whether any has moblin's same lucky already-extracted-unused-pose situation. Next session: survey those 7 and wire whichever clearly qualify without new art, same discipline moblin's own check used
S44 | objective | surveyed all 7 remaining shoot()/shootRing() users for a zero-new-art attackFrame opportunity, following moblin's own S43 precedent. Honest verdicts, not a guaranteed rollout: octorok/octorokSea (share frames, only 4 total + an icon already ruled out at S24), wisp (Spark's own plate has exactly 2 frames, both used), wizzrobe (3rd frame already spent on deathFrame at S83), and siren (River Zora has exactly 2 real frames, S86 already rejected its one neighbour) are ALL ineligible without hand-drawing new art — checked each properly rather than assuming any direction. beamos and barnacle BOTH qualified: beamos's sheet has 8 eye-sweep frames, only 2 used — box20 (right after beamos_1) is a genuine 9th, same palette, pupil fully dilated/solid vs beamos_1's open ring, confirmed by quantising both. barnacle's "Like Like" gape cycle has 5 frames, only 2 used — box144 (right after barnacle_1) is squashed flatter/wider, reading as the mouth stretched to its fullest right before it spits. Added beamos_atk:(20,0.5,0.5,False) and barnacle_atk:(144,0.5,0.5,False) to rip-enemies.py's FRAMES and re-emitted (65 sprites now, up from 63); check-rippers stayed 17/17. Wired attackFrame:'beamos_atk' and attackFrame:'barnacle_atk' (both plain strings — neither enemy has per-facing frames). Verified both in-engine: shoot() immediately shows the attack pose, holds 16 frames, correctly reverts; both are shield:'all' + hp999 (can never show hurtFrame/dying), confirmed a hit is blocked outright regardless, harmless either way. check-drift reads beamos: walk,attack and barnacle: walk,attack. validate/test(83/83)/check-feel all green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged. check-build OK, dist rebuilt. THE 7-ENEMY SURVEY IS NOW COMPLETE: 3 of 8 shoot()/shootRing() users have attackFrame (moblin, beamos, barnacle); 5 (octorok, octorokSea, wisp, wizzrobe, siren) would need genuinely new hand-drawn art, not just reuse — a compositionally harder ask than a deathFrame squash, since a throwing/casting gesture can't just be a collapsed silhouette. Next session: hand-draw octorok_atk (its own throwing pose) and decide, on purpose, whether octorokSea reuses it (mirroring the octorok_death reuse precedent, S80) or needs its own
S45 | objective | hand-drew octorok_atk, the FIRST genuinely new attack pose in the roster (S44's survey found nothing extractable). Re-confirmed a third time nothing extractable exists (same 4 frames + already-ruled-out shell icon); ran rip-enemies.py unmodified first, byte-identical. Rendered octorok_d0's ASCII grid to a PNG (pip install pillow) to read it visually rather than blind — found its face is a big tan centre with two solid-black eye notches, and a SEPARATE small red-and-tan mouth patch two rows below across a black collar band. Widened that patch's tan opening from 4 pixels to its full 8-pixel width (2 red "lip" pixels -> tan on each side), same "mouth stretched to its fullest" grammar barnacle_atk's own comment used, done as a pixel edit since octorok has no spare frame to reuse. 4 pixels changed, silhouette otherwise identical. Decided explicitly to make it ONE non-directional pose (beamos_atk/barnacle_atk shape) rather than per-facing like moblin: octorok_u0 (back view) has no face to open a mouth on, so a per-facing set needs a second new pose anyway, and an unset "up" would only show this same front pose via spriteName()'s own a.up||a.down fallback — no better than the one accepted simplification. Decided octorokSea reuses octorok_atk outright, same reasoning as its own S80 deathFrame reuse: shares octorok's exact living frames, so already the same creature alive. Checked octorokSea's own shoot() uses shot_bubble not shot_rock — a real difference, but the pose only shows the mouth opening, not the projectile, so it doesn't argue for a second pose. Documented both decisions inline in enemies.js. Verified in-engine (scratch Playwright probe): octorok_atk shows across all 4 facings, holds the full 16-frame ENEMY_ATTACK_FRAMES window, reverts correctly; mid-attack hit on octorokSea (has hurtFrame) correctly interrupts to octorokSea_hurt, same hit on octorok (no hurtFrame) does NOT interrupt — both are the existing spriteName() ordering working as designed, confirmed rather than assumed since this was the first attackFrame proof on an enemy without hurtFrame. Confirmed neither has a z field. check-drift now reads octorok: walk,attack,death and octorokSea: walk,attack,hurt,death — 2 of 22 complete, up from 1. validate/test(83/83)/check-feel all green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged, check-rippers 17/17 (hand-drawn only). check-build OK, dist rebuilt. 2 of the 5 hand-draw-needed enemies from S44 are now done (octorok/octorokSea share the pose); wisp, wizzrobe, siren remain, each needing its own new pose since none shares frames with another. Next session: hand-draw wisp_atk — wisp already has both hurtFrame and deathFrame hand-drawn in the same file, so its established grammar is the reference to extend
