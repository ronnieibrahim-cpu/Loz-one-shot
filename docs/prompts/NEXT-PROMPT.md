# Next session — survey darknut and anglerfry for a charge() attackFrame

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s S94 entry (the newest) — built `attackFrame`
  support into `charge()` itself (`if (o.tell) e.attackTime = o.tell;`,
  `src/game/enemy.js`) and piloted it on `beetle`, which turned out to
  be a zero-new-art reuse (`beetle_s0`, already labelled a "balled-
  charge frame" in `beetle_hurt`'s own comment). The plumbing already
  exists — this session is survey-and-wire, not engine work.

## Why this, now
`darknut` (`tell: 22`) and `anglerfry` (`tell: 26`) are the other two
`charge()` users (`src/data/enemies.js`); both already have `hurtFrame`
and `deathFrame`, missing only `attack`. `charge()` now sets
`e.attackTime = o.tell` automatically whenever a `tell` is passed, so
the ONLY work left per enemy is finding the right pose (reused or
hand-drawn) and wiring `attackFrame` on its `defineEnemy` call — no
further engine changes needed. This mirrors S89's `shoot()`-roster
survey exactly, just for the two remaining `charge()` users.

## The task
1. Confirm both specs directly from `src/data/enemies.js` rather than
   trusting this file's summary: `darknut`'s `frames` is per-facing
   (`down`/`up`/`side`, like `beetle`), `anglerfry`'s is a flat 2-entry
   array (like `wisp`/`wizzrobe`/`siren` — check this yourself, since it
   changes whether a facing question even applies).
2. For EACH enemy, check for a `beetle_s0`-style reuse BEFORE assuming
   a hand-draw is needed: does the enemy's own `frames` array contain a
   second pose that is a genuinely different SHAPE from the first (not
   a recolour — the test S91 used to reject `wisp_1`, and S93/S94 used
   to accept `siren_1`/`beetle_s0`)? Render every candidate frame from
   the enemy's real runtime `pal` (`src/gfx/palettes.js`) to a PNG
   before judging by eye on the raw digit grid — the technique every
   session since S90 has found essential. Also check existing comments
   in `sprites-enemies-hurt.js` near each enemy's `_hurt`/`_death` entry
   — a prior session may have already described a candidate frame in
   passing (the way `beetle_hurt`'s own comment named "balled-charge
   frames" before anyone had wired them as one).
3. Re-confirm nothing NEW is extractable either, the same "run the
   ripper unmodified first" discipline every prior session used —
   `python3 tools/rip-enemies.py` once, confirm byte-identical, before
   concluding a sheet has nothing left.
4. For whichever enemy(ies) need a hand-drawn pose: read `CLAUDE.md`'s
   art rules first (three colours plus transparency, hard 1px outline,
   no anti-aliasing/gradients/dithering, silhouette-first, not a
   collapse). Check what `_hurt`'s own edit already claimed on that
   sprite (S92's `wizzrobe_atk` used the eyes specifically because
   `wizzrobe_hurt` had already claimed the cheek) so the new pose uses a
   different part of the face/body.
5. Wire `attackFrame` on whichever `defineEnemy` call(s) qualify. If a
   `frames` array is per-facing (like `darknut`) and only ONE facing has
   a genuinely distinct second pose, decide explicitly (and document
   inline, the way `octorok_atk`/`beetle_s0` both did) whether to apply
   it as one non-directional pose or leave a gap for the other facings
   — do not default silently either way.
6. Verify in-engine with a scratch Playwright probe (not committed):
   drive the REAL `ai()` to trigger `charge()` (place the player and
   enemy aligned and in range, then call `e.update(g)` in a loop until
   `e.charging` flips true — the technique S94 used, stronger than
   forcing `attackTime` by hand since it also proves the trigger path
   itself). Confirm `stun` and `attackTime` count down together for the
   enemy's own `tell` duration, the enemy stays frozen throughout, the
   pose shows the whole time, and both expire together with a correct
   reversion. Test the interrupt case: both enemies have `hurtFrame`, so
   a mid-windup non-lethal hit should show that instead.
7. Run the full regression sweep: `validate.mjs`, `test.mjs` (83/83),
   `check-feel.mjs`, `check-playthrough.mjs` (21/21), `replay.mjs`
   (51/51) — re-record anything that diverges — `check-rippers.mjs`
   (17/17 if no new extraction, updated if one was made) —
   `check-build.mjs`.

## Done means
- Both `darknut` and `anglerfry` show a real, distinct pose during their
  charge windup, proven by an in-engine probe driven through the real
  AI trigger, not by reading the code.
- `node tools/check-drift.mjs` shows `darknut: walk,attack,hurt,death`
  and `anglerfry: walk,attack,hurt,death` (8 of 22 complete, up from 6)
  — or, if either genuinely cannot get a good pose this session, a
  clearly stated reason why, not a silent skip.
- `node tools/validate.mjs`, `node tools/test.mjs` (83/83),
  `node tools/check-feel.mjs`, `node tools/check-playthrough.mjs`
  (21/21), `node tools/replay.mjs` (51/51), `node tools/check-rippers.mjs`
  all pass.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- The remaining pure-contact enemies with no `shoot()`/`shootRing()`/
  `charge()` at all (`crab`, `zol`, `gel`, `keese`, `leever`, `tektite`,
  `urchin`, `jellyfish`, `pincer`) — whether any of these can
  meaningfully get an `attack` state is a real open question for a
  FUTURE session to design, not something to improvise here by stretching
  `charge()` or `attackFrame` onto a mechanic that doesn't have one.
- `idle` states — still the separate, much larger undertaking noted in
  `docs/ENEMIES.md`'s own header.
- Any change to `charge()`'s own speed, range, tell values or damage —
  art and wiring only, not balance.
