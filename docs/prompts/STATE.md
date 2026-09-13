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
S32 | objective | gave leever a deathFrame (7th, after gel/keese/octorok/urchin/crab/zol) — hp2, deathFrame-only. Checked the sheet's "Leever" plate first, specifically for a death pose distinct from a hurt one: 4 frames total — buried mound (unused, engine hides the sprite outright), two fully-emerged claws-raised poses (leever_0/1, already used), and a THIRD, previously-unmapped frame (box137) between them: claws only partway up, body still low, same palette as the other two. Real extraction, not hand-drawn — added leever_death:(137,0.5,1.0,False) to rip-enemies.py's FRAMES and re-emitted (59 sprites now), check-rippers stayed 17/17. Reads as the creature sinking back down rather than standing fully risen — its own burrowing nature doubling as its defeat pose. Confirmed no z field. Verified BOTH halves of the submerge() interaction in-engine, not just re-derived from S20's hurtFrame-era finding: pinned _subState='down'/hidden=true/invuln=9999 and confirmed a lethal hit does NOT connect at all (hurt() returns false, hp/dying untouched); pinned _subState='up' and confirmed a lethal hit DOES connect, dying=true, spriteName() returns leever_death, holds the full ~16-frame stall, then dead=true. check-drift reads leever: walk,death. validate/test(83/83)/check-rippers(17/17)/check-build all green. Per this session's own instructions, check-playthrough and replay were expected GREEN going in (S31 fixed both) rather than a known-bad baseline — ran both after the change: replay.mjs 51/51 unchanged, check-playthrough.mjs 21/21 unchanged, confirming this session's own deathFrame did not reopen the timing issue S31 closed. dist rebuilt, pushed to branch + fast-forwarded main
S33 | objective | gave tektite a deathFrame (8th, after gel/keese/octorok/urchin/crab/zol/leever) — hp2, deathFrame-only. Checked the sheet's own "Tektite" plate first: exactly 2 frames (legs-splayed rest pose, legs-tucked hop-apex pose), both already extracted as tektite_0/1, confirmed by cropping and viewing the plate directly (Stalfos/Thwomp either side, no third frame hiding). Nothing to extract; hand-drew tektite_death following octorok_death's own squash template — every other row of tektite_0's body (rows 5/7/9/11/13/15) kept pixel-for-pixel and compressed to the bottom of the cell, reusing only colours already in the live frames. Confirmed no spec z field. tektite DOES drive hop() (fz height accumulator, distinct from a spec z field) — checked properly rather than trusting the prompt's "plainer target" framing, and verified in-engine: killed grounded (fz=0) and mid-hop (fz=632 subpixels), both show dying=true immediately and spriteName()==tektite_death; the mid-hop fz stays frozen at 632 for the whole 20-frame stall (Enemy.update's dying branch skips ai()) rather than snapping to the ground, so the flat pose briefly draws elevated — noted as a real, accepted visual quirk, not a defect (same class zol's hop already normalised). check-drift reads tektite: walk,death. validate/test(83/83) green. check-playthrough 21/21 unchanged. replay.mjs found ONE real divergence (d1-descent, entity-count mismatch at frame 5940 — the death stall now outlives the checkpoint the old recording assumed instant removal at), same class S30/S31 already normalised; re-recorded d1-descent, 51/51 clean. check-build OK, dist rebuilt. sprites-enemies.js untouched so check-rippers not re-run (no ripper input changed). Next hp<=2, no-deathFrame-yet target per this thread's own cadence: jellyfish (hp2, water, walk-only)
S34 | objective | gave jellyfish a deathFrame (9th, after gel/keese/octorok/urchin/crab/zol/leever/tektite) — hp2, deathFrame-only, and the first hp<=2 enemy checked for one that ALSO had no hurtFrame at all yet. Checked the sheet's own "Bari & Biri" plate properly rather than assuming jellyfish_0/1's two boxes (12/13) were the whole story: it actually has FOUR tan "Bari" frames plus two separate blue "Biri" frames, confirmed by quantising and comparing palettes directly rather than eyeballing a resized crop — box14 shares jellyfish_0/1's exact tan/blue palette (#ffd68c/#1984ff), box15 is a genuinely different creature (all-blue #73adff/#0000ff electric variant). Box14, unused until now, sits right after the two live frames: body shifted down and slightly smaller (row0 empty, unlike 12/13), tentacle fringe ragged rather than the neat hanging skirt — a real extraction, not a hand-draw. Added jellyfish_death:(14,0.5,0.5,False) to rip-enemies.py's FRAMES and re-emitted (60 sprites now, up from 59); check-rippers stayed 17/17. Confirmed no z field, no hop/submerge state (ai is bounceDiag+driftWithTide, continuous movement, not lattice-locked) — jellyfish is the plainest deathFrame target verified so far, no height quirk to reconcile. Verified in-engine: lethal hit (hp2->0) in deep water sets dying=true immediately, spriteName()==jellyfish_death, holds the full 20-frame stall, then dead=true and removed. check-drift reads jellyfish: walk,death. validate/test(83/83) green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged (jellyfish isn't in any recorded route or replay plan, unlike tektite's S33 divergence) — so this session needed no re-recording. check-build OK, dist rebuilt. All hp<=2 non-hp999 enemies now have a deathFrame (octorok/crab/zol/gel/keese/leever/tektite/urchin/jellyfish) — that cadence is EXHAUSTED. Next targets are hp3+ enemies that already have hurtFrame but not deathFrame (deathFrame has no hp constraint, S13): octorokSea/beetle/wizzrobe/anglerfry/pincer all hp3, moblin hp4, siren hp4, darknut hp6. Picked octorokSea next: shares its live frames outright with land octorok (already octorok_death), worth deciding on purpose whether to reuse that key or draw a distinct aquatic one, not something this session decided
