# Next session — give one enemy a real hurt frame, proving the engine path

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/ENEMIES.md` — the one-line lesson per enemy this objective's
  documentation half already wrote (S11). Read it to know which enemy this
  session's art should belong to, if you're picking one not named below.
- `src/game/enemy.js` around line 419 (`this.spec.hurtFrame`) — the ONLY
  animation-state field the engine currently reads beyond `frames` (the
  walk cycle), and it is wired for BOSSES only (`hurtFrame: 'boss_..._hurt'`
  is a real, working example — see any `defineBoss` call in
  `src/data/bosses.js`). There is no `attackFrame` or `deathFrame` concept
  anywhere in the engine for an ordinary enemy. This is the actual gap:
  `check-drift.mjs`'s enemy-roster metric reads sprite-key NAMING
  (`<name>_atk`/`_attack`, `<name>_death`/`_die`) rather than a spec field
  specifically so it would notice the day this exists — it doesn't exist
  yet.

## Why this, now
STATE.md's objective of record is #4, enemy-roster: every enemy needs
idle/walk/attack/hurt/death states, `check-drift.mjs` reports 0 of 22
complete. The documentation half (`docs/ENEMIES.md`) is done. The art half
is not a documentation task — it needs an ENGINE change (a `hurtFrame`
path for ordinary enemies, matching what bosses already have, plus new
concepts for attack/death) before any new art has anywhere to plug in. 22
enemies × up to 3 new states each is a large undertaking; this session's
job is to prove the path on ONE enemy rather than attempt all 22.

## The task
Pick ONE enemy (a simple one — `gel` or `keese`, both `light: true` with a
small 2-frame walk cycle already, are good candidates; check
`docs/ENEMIES.md` first so the choice doesn't contradict that enemy's own
written lesson). Give it a real `hurtFrame`:
1. Check `assets/sheets/oracle-seasons-enemies.png` for an unused cell
   that IS this enemy flinching — `rip-enemies.py`'s own comment says the
   sheet has more content than the 56 sprites currently pulled ("344
   sprite boxes found"). If one exists, extract it the way every other
   enemy frame is extracted (through the ripper, never hand-edited).
2. If nothing on the sheet is a flinch pose for this creature, hand-draw
   one flinch frame to `docs/ART-DIRECTION.md`'s register, in a NEW
   hand-authored file (do not touch the generated `sprites-enemies.js`) —
   same "extract first, draw only if genuinely blocked" discipline every
   other objective in this rotation has used.
3. Wire `hurtFrame` into this enemy's `defineEnemy` call in
   `src/data/enemies.js`, following the boss precedent in
   `src/game/enemy.js`.
4. Do NOT attempt `attackFrame`/`deathFrame` this session — those need
   their own engine design (what triggers an attack pose? most enemies
   here attack via `shoot()`, not a melee swing) and are a different,
   larger question than the hurt-frame path this session is proving.

## Done means
- One enemy has a real, in-engine hurt flinch, visible in `tools/shoot-
  sprites.mjs`'s contact sheet and (ideally) screenshotted taking a hit.
- `node tools/check-drift.mjs`'s enemy-roster table shows that one enemy
  with `hurt: true` (it won't show "complete" yet — attack/death are
  still missing — and that's expected, not a bug to chase this session).
- `node tools/validate.mjs`, `node tools/test.mjs` pass.
- If `sprites-enemies.js` changed, `node tools/check-rippers.mjs` passes
  (17/17) — regenerate via the ripper, never hand-edit.
- `npm run build` re-run, `dist/oracle-of-tides.html` committed only if
  `src/` changed.
- STATE.md gets one new session-log row, and a short note in
  `docs/NEXT-SESSION.md` on whether `attackFrame`/`deathFrame` look like a
  clean engine addition or a bigger redesign, for whoever picks this up
  next — this is exactly the kind of finding that shapes the next 21
  enemies' worth of work, so it is worth writing down precisely.

## Out of scope
- All 22 enemies this session — one proves the path, the rest is real
  content-creation work for later sessions.
- `attackFrame`/`deathFrame` — a different, harder engine question.
- Boss art (`sprites-bosses.js`) — rotation #3 is closed; do not reopen it.
- Rewriting `docs/ENEMIES.md`'s lessons to fit new art — the lessons
  describe existing behavior and shouldn't change because a sprite was
  added.
