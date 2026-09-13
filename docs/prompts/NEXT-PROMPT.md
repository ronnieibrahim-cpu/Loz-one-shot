# Next session — hand-draw octorok's attackFrame

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s S89 entry (the attackFrame survey, the newest)
  — it closed out the "zero-new-art" phase: 3 of 8 `shoot()`/
  `shootRing()` users have `attackFrame` (`moblin`, `beamos`, `barnacle`);
  the other 5 need genuinely new art. This session draws the first one.

## Why this, now
`octorok` (hp 2, `src/data/enemies.js`, throws a rock in a straight line
when aligned) is the plainest of the 5 remaining candidates and raises a
real design question worth answering on purpose: `octorokSea` shares
`octorok`'s exact living frames and already reuses `octorok_death`
outright (S80's own reasoned decision) rather than getting a separate
death pose. Drawing `octorok_atk` raises the same question for
`attackFrame` — should `octorokSea` reuse it too, or does its own
aquatic attack (a bubble shot, not a rock) deserve something different?
Decide it explicitly, the same way S80 did, rather than defaulting either
way.

## The task
1. Re-confirm nothing extractable exists for `octorok` before drawing —
   S89 already checked this (4 live frames + one icon already ruled out
   at S24), but confirm it yourself from the actual sheet rather than
   trusting a summary. `pip install pillow` first if needed, `python3
   tools/rip-enemies.py` once unmodified to confirm byte-identical
   reproduction.
2. Read `CLAUDE.md`'s art rules section before drawing anything: three
   colours plus transparency, a hard 1px black outline, no
   anti-aliasing/gradients/dithering, fill roughly two-thirds of the
   16x16 cell, feet near the bottom, silhouette-first. A `_death` pose
   is allowed to change the silhouette (collapsed); an ATTACK pose is
   NOT a collapse — it needs to read as "winding up to throw" while
   still being recognisably the same creature as `octorok_d0`, closer to
   how `hurtFrame` poses stay silhouette-close to their idle frame (see
   `sprites-enemies-hurt.js`'s own header on this distinction).
3. Look at `octorok_d0`'s actual grid (`sprites-enemies.js`) for what to
   modify: a raised arm/tentacle holding the rock, or the mouth/hood
   posture changed to suggest the throw. Change only what's needed to
   read as "about to throw," not a full redraw.
4. Add `octorok_atk` to `ENEMY_HURT_ART` in `sprites-enemies-hurt.js`
   (the existing hand-drawn file — no new file needed) and to
   `sprite-manifest.js`'s `enemies` list.
5. Decide the `octorokSea` question from step 0 above and write the
   reasoning inline in `enemies.js`, the same way S80 documented the
   `deathFrame` reuse decision. Wire `attackFrame: 'octorok_atk'` on
   `octorok`'s `defineEnemy` call, and either the same key or a new one
   on `octorokSea`, per your decision.
6. Verify in-engine: `shoot()` immediately shows the attack pose, holds
   for `ENEMY_ATTACK_FRAMES`, then reverts to the ordinary cycle. Confirm
   no `z` field complication (there is none, per prior sessions, but
   confirm rather than assume).
7. Run the full regression sweep: `validate.mjs`, `test.mjs` (83/83),
   `check-feel.mjs`, `check-playthrough.mjs` (21/21), `replay.mjs`
   (51/51) — re-record anything that diverges — `check-build.mjs`.

## Done means
- `octorok` shows a real attack pose while actually throwing its rock,
  proven by an in-engine probe, not by reading the code.
- `node tools/check-drift.mjs` shows `octorok: walk,attack,death` (and
  `octorokSea`'s own line reflects whatever the reuse decision was).
- `node tools/validate.mjs`, `node tools/test.mjs` (83/83),
  `node tools/check-feel.mjs`, `node tools/check-playthrough.mjs`
  (21/21), `node tools/replay.mjs` (51/51) all pass.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines), stating the reuse-vs-new-art decision for `octorokSea` and why.

## Out of scope
- `wisp`, `wizzrobe`, `siren` — the other 3 enemies needing new attack
  art. One enemy per session, same cadence this whole objective has kept.
- `idle` states — still the separate, much larger undertaking noted in
  `docs/ENEMIES.md`'s own header.
- Redrawing anything already extracted or already hand-drawn for a
  different purpose (`hurtFrame`/`deathFrame` poses stay as they are).
