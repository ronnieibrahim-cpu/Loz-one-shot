# Next session — give charge()'s own windup a real attack pose

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s S93 entry (the newest) — closed the entire
  `shoot()`/`shootRing()` `attackFrame` sub-thread (`siren` turned out to
  be a reuse, not a hand-draw) and found the next candidate: `charge()`'s
  own `tell` parameter already freezes an enemy before it lunges, but
  doesn't swap the sprite yet.

## Why this, now
`charge()` (`src/game/enemy.js`) is the AI primitive `beetle`, `darknut`
and `anglerfry` all use for their lunge attacks, called with a `tell`
value (16/22/26 frames respectively). When the charge triggers, `charge()`
sets `e.charging = true` AND `e.stun = o.tell` in the same call —
`Enemy.update()`'s own `if (this.stun > 0) { this.stun--; return; }`
early-out then skips `ai()` entirely for that many frames, freezing the
enemy in place before the actual lunge motion begins next time `ai()`
runs. That freeze is a real windup moment sitting unused, exactly the
situation `shoot()` was in before S43/S88 built `attackFrame` for it.
All three `charge()` users already have `hurtFrame` and `deathFrame`;
`attack` is the only missing state on each.

## The task
1. Read `charge()`'s full body (`src/game/enemy.js`, search `export
   function charge`) to confirm the exact mechanics above yourself
   rather than trusting this summary — in particular confirm `e.stun`
   really does gate `ai()` (and therefore `charge()` itself) the way
   described, and confirm there is no existing `attackTime` write
   anywhere in `charge()` already.
2. Add `if (o.tell) e.attackTime = o.tell;` alongside the existing `if
   (o.tell) e.stun = o.tell;` line inside `charge()`. Unlike `shoot()`/
   `shootRing()` (which always set the fixed `ENEMY_ATTACK_FRAMES`),
   this uses the CALLER'S OWN `tell` value, since `beetle`/`darknut`/
   `anglerfry` each pass a different one (16/22/26) and the pose should
   last exactly as long as the freeze does — confirm this reasoning
   holds rather than defaulting to the fixed constant out of habit.
3. Pick ONE enemy to pilot on first, following the exact precedent S88
   set with `moblin` (build the mechanism, land it on one enemy, leave
   the rest for a follow-up survey session) rather than doing all three
   at once. `beetle` (`tell: 16`, shortest windup, already familiar from
   its own `hurtFrame`/`deathFrame` sessions) is the obvious pick unless
   you find a reason otherwise.
4. Re-confirm nothing extractable exists for `beetle`'s attack pose
   before drawing — check `beetle_hurt`'s own comment
   (`sprites-enemies-hurt.js`) for what was already ruled out on its
   sheet plate, and re-check with an attack telegraph specifically in
   mind rather than trusting the hurt-pose conclusion to carry over
   unchanged. `python3 tools/rip-enemies.py` once unmodified first to
   confirm byte-identical reproduction.
5. Also check for a `moblin_d1`/`siren_1`-style reuse first — does
   `beetle`'s own `frames` array already contain a second pose that is a
   genuinely different shape (not just a recolour, the test S91
   established for rejecting `wisp_1`) that could double as the charge
   telegraph with zero new art? Render both existing frames from
   `beetle`'s real runtime palette to check visually before concluding
   either way.
6. If nothing reusable, hand-draw `beetle_atk` (or whatever the reuse
   turns out to be) following `CLAUDE.md`'s art rules: three colours
   plus transparency, hard 1px outline, silhouette-first, not a collapse
   — reads as "about to lunge" while staying recognisably `beetle`, on
   a part of the sprite `beetle_hurt`'s own edit hasn't already claimed.
7. Wire it as `attackFrame` on `beetle`'s `defineEnemy` call.
8. Verify in-engine with a scratch Playwright probe (not committed, same
   shape as every prior `attackFrame` proof): triggering `charge()`
   sets `attackTime` to `beetle`'s own `tell` (16) and shows the pose
   immediately; the enemy stays frozen (not moving) for the whole
   windup, matching `e.stun`'s own countdown; once the charge itself
   begins (`e.charging` true, `e.stun` at 0), confirm what the sprite
   shows during the actual lunge motion — likely reverts to ordinary
   walk frames once `attackTime` also expires, but confirm the two
   timers (`stun` and `attackTime`, both seeded from the same `tell`)
   actually expire together rather than assuming it. Test the interrupt
   case: `beetle` has `hurtFrame`, so a mid-windup non-lethal hit should
   show `beetle_hurt` instead, per the existing `spriteName()` ordering.
9. Run the full regression sweep: `validate.mjs`, `test.mjs` (83/83),
   `check-feel.mjs`, `check-playthrough.mjs` (21/21), `replay.mjs`
   (51/51) — re-record anything that diverges — `check-rippers.mjs`
   (17/17 if untouched, or updated if a new frame was extracted) —
   `check-build.mjs`.

## Done means
- `beetle` shows a real, distinct pose during its charge windup, proven
  by an in-engine probe, not by reading the code.
- `node tools/check-drift.mjs` shows `beetle: walk,attack,hurt,death`
  (6 of 22 complete, up from 5).
- `node tools/validate.mjs`, `node tools/test.mjs` (83/83),
  `node tools/check-feel.mjs`, `node tools/check-playthrough.mjs`
  (21/21), `node tools/replay.mjs` (51/51), `node tools/check-rippers.mjs`
  all pass.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- `darknut`, `anglerfry` — the other 2 `charge()` users. One enemy per
  session, same cadence this whole objective has kept; a follow-up
  survey session (mirroring S89's own shoot()-roster survey) picks
  these up next.
- `idle` states — still the separate, much larger undertaking noted in
  `docs/ENEMIES.md`'s own header.
- The remaining pure-contact enemies with no `shoot()`/`shootRing()`/
  `charge()` at all (`crab`, `zol`, `gel`, `keese`, `leever`, `tektite`,
  `urchin`, `jellyfish`, `pincer`) — whether any of these can meaningfully
  get an `attack` state is an open question this session does not answer.
- Any change to `charge()`'s own speed, range or damage — this is an art
  and wiring task, not a balance one.
