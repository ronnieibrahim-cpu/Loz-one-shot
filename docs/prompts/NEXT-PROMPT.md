# Next session — prototype an attackFrame wind-up on one shooter

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md` S76 AND S77 (top of file, in that order) — the
  `hurtFrame`/`deathFrame` proofs this rotation already landed, and, at
  each one's end, why `attackFrame` was deliberately deferred twice: S76
  found no enemy `ai()` has a shared "about to attack" moment; S77 found
  that copying `Boss`'s own timing pattern wholesale (rather than isolating
  exactly which side effects are order-sensitive) silently broke a replay
  baseline — read that lesson before touching any shared timing path again.
- `src/data/enemies.js`, the `octorok` block (search `defineEnemy('octorok'`)
  — the concrete candidate this prompt scopes around, and the shot-timer
  shape most of the roster's ranged attackers share (`beamos`, `barnacle`,
  `wisp`, `moblin`, `wizzrobe`, `octorokSea` all call `shoot()`/`shootRing()`
  off a bare `every(e, N)` frame count, no wind-up state of their own).

## Why this, now
Both sibling engine paths this rotation needed are now proven on one enemy
each: `hurtFrame` (S76, `wisp`) and `deathFrame` (S77, `gel`). `attackFrame`
is the one remaining gap in enemy-roster's own done-condition
(`idle/walk/attack/hurt/death` for all 22), and it has been deferred twice
rather than attempted carelessly — correctly, per S77's own finding that a
change to a shared timing path is never as small as it looks. With two
proof cycles' worth of hard-won pattern now on record (what `Boss` already
does, and specifically where copying it wholesale went wrong), this is the
first session with enough context to attempt `attackFrame` without
repeating either mistake.

**This is a harder prototype than S76/S77 were — treat it as such.**
Neither hurt nor death needed a NEW trigger condition: a hit and a
zero-hp check already exist everywhere. An attack wind-up needs a trigger
that does not exist yet: something has to decide "I am about to shoot"
some number of frames BEFORE `shoot()` actually fires, which today happens
in the same `every(e, N)` check that fires the shot itself, with no gap
between deciding and acting.

## The task
Prototype on `octorok` specifically (search `defineEnemy('octorok'` in
`src/data/enemies.js`) — the simplest shooter, no submerge/charge/hop
state to interact with:
1. Design the minimal wind-up shape. A plausible one: a new AI-toolkit
   helper in `src/game/enemy.js` (near `shoot`/`shootRing`), e.g.
   `telegraphShoot(e, g, opts)`, that holds `spec.attackFrame` for
   `opts.windup` frames once its own condition is met, THEN calls the real
   `shoot(e, g, opts)` — replacing octorok's own
   `if (every(...) && aligned...) shoot(...)` line with a call to this
   helper. Do not assume this shape is right without checking it against
   `every()`'s own frame-hashing (`src/game/enemy.js`) — a wind-up state
   that isn't derived the same replay-safe way `every()` already is would
   reintroduce exactly S77's own class of bug.
2. Add whatever `feel.js` constant the wind-up duration needs, tagged
   `guessed` with a one-line reason.
3. Check `assets/sheets/oracle-seasons-enemies.png` for an unused Octorok
   pose that reads as "about to throw" before drawing one by hand (S76/S77
   both surveyed for hurt/death poses on this sheet and found neither —
   an attack wind-up is a different pose family and has not been
   specifically checked). Draw in `src/data/sprites-enemy-states.js`
   (S77's rename) if nothing is there — never hand-edit generated
   `sprites-enemies.js`.
4. Wire `attackFrame: 'octorok_attack'` (or your chosen name) into
   `octorok`'s `defineEnemy` spec.
5. Do NOT roll this out to any other enemy this session — one prototype,
   same discipline as S76/S77.

## Done means
- Octorok visibly winds up (a distinct pose, held briefly) before its rock
  actually fires, provable with a scratch Playwright proof in the same
  shape S76/S77 used: force the AI condition, step frames, confirm
  `e.spriteName()` reports the wind-up pose before the shot spawns, and
  screenshot it.
- `node tools/check-drift.mjs`'s enemy-roster table reads `octorok`
  with `attack` — decide whether that still comes from sprite-key naming
  (`octorok_atk`/`octorok_attack`) or should now read `attackFrame:` from
  the spec (S77 made exactly this change for `death`, for exactly this
  reason: naming-based detection can't see a hand-authored file's key).
  If you change the detector, update its own comment — don't leave it
  describing a contract that no longer matches, the same rule S77 followed.
- `node tools/validate.mjs`, `node tools/test.mjs`, `node tools/check-
  rippers.mjs` (only if a generated file changed — it shouldn't),
  `node tools/check-motion.mjs`, `node tools/replay.mjs`, `node tools/
  check-playthrough.mjs`, `node tools/check-bosses.mjs` all pass. Treat any
  baseline drift the way S77 did: root-cause it before re-recording, read
  the FULL diff, and never accept a re-record you have not read line by
  line — a rock-shot's own timing shift is exactly the kind of thing that
  could shift a route frame count if octorok is anywhere on the D1/D2 path
  `check-playthrough.mjs` walks.
- `npm run build` re-run, `dist/oracle-of-tides.html` committed only if
  `src/` changed.
- STATE.md gets one new session-log row. `docs/NEXT-SESSION.md` gets a
  clear account of the wind-up shape chosen and why, for whoever rolls
  `attackFrame` out to the other ranged attackers next.

## Out of scope
- All 22 enemies this session — one prototype, same as S76/S77.
- Melee-style "attacks" for `leever`/`stalfos` (no ranged shot to hang a
  wind-up on) — a different shape, a later session's problem.
- Rewriting `docs/ENEMIES.md`'s lessons to fit new art.
- The enemy-HP-vs-source-games question in `docs/prompts/QUEUE.md` item 5
  — a separate, explicitly deferred concern; do not fold it in here.
