# Next session — give hop()'s own wait state a real attack pose

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s S95 entry (the newest) — closed the `charge()`
  `attackFrame` sub-thread (`darknut`, `anglerfry`) and named the two real
  remaining gaps: 9 pure-contact enemies with no natural attack hook, and
  `idle` states roster-wide. This session's task is the concrete first
  step into the first gap: `hop()` turns out to have its own windup,
  structurally the same shape `charge()`'s `tell` was before S94.

## Why this, now
`hop()` (`src/game/enemy.js`) — the AI primitive `zol` (`wait: 52`) and
`tektite` (`wait: 34`) both use — has an internal `_hopState` machine:
`'wait'` (counting down `_hopWait`, the enemy stands still) then `'air'`
(the actual jump arc). That `'wait'` phase is a real pause before a real
action, the same shape `charge()`'s `tell`/`stun` freeze was — except
`charge()`'s `tell` is a SHORT window immediately before the lunge
(16-26 frames), while `hop()`'s `wait` is the enemy's entire REST period
between hops (34-52 frames) — showing an attack pose for the whole thing
would read as "this creature is always attacking," not a telegraph. The
engineering task is narrower than `charge()`'s was: only the LAST few
frames of `_hopWait` (immediately before the jump begins) should count
as the windup, not the whole wait.

## The task
1. Read `hop()`'s full body (`src/game/enemy.js`, search `export
   function hop`) to confirm the `_hopState`/`_hopWait` mechanics
   yourself rather than trusting this summary — in particular confirm
   exactly which line transitions `_hopState` from `'wait'` to `'air'`
   and what `_hopWait` counts down from.
2. Decide and justify a windup WINDOW length (e.g., the last
   `ENEMY_ATTACK_FRAMES` worth of `_hopWait`, or a fraction of each
   enemy's own `wait` value) — do not just copy `charge()`'s "the whole
   tell counts" shape without checking whether it fits here; it likely
   doesn't, per the reasoning above. Add a `feel.js` constant if a new
   fixed window length is needed, with a unit and provenance comment
   (`check-feel.mjs` must stay green).
3. Wire `e.attackTime` inside `hop()` to start counting only once
   `_hopWait` drops to that window's length, not at the start of the
   whole wait — harmless for any `hop()` user with no `spec.attackFrame`
   declared, the same "set unconditionally, only read when the field
   exists" pattern `shoot()`/`shootRing()`/`charge()` all already use.
4. Pick ONE of `zol`/`tektite` to pilot on, following the established
   precedent (build the mechanism, land it on one enemy, survey the
   rest next). Check both first for a reuse candidate (a second frame
   in `frames` that's a genuinely different SHAPE, not a recolour — the
   test S91/S93/S94 all used) before assuming either needs a hand-drawn
   pose; render whichever frames exist from the enemy's real runtime
   `pal` before judging.
5. If nothing reusable, hand-draw the pose following `CLAUDE.md`'s art
   rules (three colours plus transparency, hard 1px outline, no
   anti-aliasing/gradients/dithering, silhouette-first, not a collapse),
   checking what the enemy's own `_hurt`/`_death` entries (if any) have
   already claimed so the new pose uses a different feature.
6. Verify in-engine with a scratch Playwright probe (not committed):
   drive the real `ai()` through several full hop cycles (not just one)
   to confirm the windup shows ONLY in the last stretch of each wait,
   not the whole 34-52 frame rest — this is the one property that
   distinguishes this session's design from a naive copy of `charge()`'s
   shape, so prove it explicitly. Confirm the pose clears the instant
   `_hopState` flips to `'air'`, and test the interrupt case if the
   enemy has `hurtFrame`.
7. Run the full regression sweep: `validate.mjs`, `test.mjs` (83/83),
   `check-feel.mjs`, `check-playthrough.mjs` (21/21), `replay.mjs`
   (51/51) — re-record anything that diverges — `check-rippers.mjs`
   (17/17 if untouched) — `check-build.mjs`. `hop()` is also used by
   fliers/other motion — check `tools/check-motion.mjs` still passes
   too, since it specifically asserts lattice behaviour around hops.

## Done means
- The piloted enemy shows a real, distinct pose ONLY in the last
  stretch before each hop, proven by an in-engine probe across multiple
  hop cycles, not by reading the code.
- `node tools/check-drift.mjs` shows the piloted enemy with `attack` in
  its set (9 of 22, up from 8, assuming it already has walk/hurt/death).
- `node tools/validate.mjs`, `node tools/test.mjs` (83/83),
  `node tools/check-feel.mjs`, `node tools/check-playthrough.mjs`
  (21/21), `node tools/replay.mjs` (51/51), `node tools/check-rippers.mjs`,
  `node tools/check-motion.mjs` all pass.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- The other `hop()` user (whichever of `zol`/`tektite` wasn't piloted) —
  a follow-up survey session picks it up, same cadence as the
  `shoot()`/`charge()` rosters.
- `crab`, `gel`, `keese`, `leever`, `urchin`, `jellyfish`, `pincer` — the
  remaining pure-contact enemies with no `hop()`/`charge()`/`shoot()` at
  all. Whether any of these has its own hidden windup (the way `hop()`
  and `charge()` both turned out to) is a real open question for a
  FUTURE survey, not something to improvise here.
- `idle` states — still the separate, much larger undertaking.
- Any change to `hop()`'s own height, distance or speed — art and
  wiring only, not balance.
