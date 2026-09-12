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
    sheet lacks; S12 wisp_hurt, S13 stalfos_death — new keys in an EXISTING
    entry need only a sprite-manifest.js edit, not index.js)
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
S13 | objective | gave stalfos its first real deathFrame, proving the second engine path: Enemy.die() (src/game/enemy.js) now stalls remove=true behind a dying/deathTime countdown (ENEMY_DEATH_FRAMES=16, feel.js) when spec.deathFrame is set, spriteName() checks it before hurtFrame, update() holds during the stall; hand-drew stalfos_death (sprites-enemies-hurt.js, a skull-on-a-bone-mound in enemyk's palette — the sheet has no collapse pose) and wired it on stalfos. Unlike hurtFrame, no hp constraint — die() only runs on the killing hit regardless of hp, verified in-engine (killed with one hit, forced flicker off, screenshotted: stalfos_death drew for the whole stall while still in game.entities, then removed on schedule). check-drift's "death" column is unchanged (stalfos still reads walk-only) because it greps sprites-enemies.js sprite-key names, not the new spec field — a known-stale metric now, noted in docs/NEXT-SESSION.md rather than changed (not on this session's allowlist). attackFrame re-assessed and still ruled a separate, bigger question — no single engine-owned "attack begins" moment the way die()/hp==0 gave deathFrame one. validate/check-rippers(17/17)/test(83/83)/check-motion/check-build all green
S14 | objective | fixed check-drift's stale "death" column: it used to grep sprites-enemies.js for a `<name>_death`/`_die` sprite KEY (a naming convention from before spec.deathFrame existed), so it could never see stalfos_death, which correctly lives in the hand-authored sprites-enemies-hurt.js instead. Changed to `/\bdeathFrame\s*:/.test(block)`, the same shape "hurt" already used — stalfos now reads walk,death, wisp still walk,hurt, complete count unchanged at 0 of 22 (as predicted, since nothing has all four yet). "attack" left alone (still sprite-key naming; no engine field exists for it, on purpose, so the metric notices art before code). enemySpriteKeys kept — attack still reads it. Tool-only change, no src/ touched, no build needed. validate/test(83/83) green
