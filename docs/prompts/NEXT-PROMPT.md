# Next session — audit stalfos's missing attack state

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/ENEMIES.md`'s "Idle states" and "Audit" sections — idle is now
  closed (`urchin` only, decided S57); do not reopen it.

## Why this, now
S52/S97 named `crab`, `gel`, `leever`, `urchin`, `jellyfish` as a
"confirmed structural wall" for `attack`: none of their `ai()` functions
has a discrete pause-then-strike moment to hang an `attackFrame` on, only
continuous `chase`/`flee`/`wander`. `stalfos` (`src/data/enemies.js`) has
the exact same shape — `ai(e,g) { if (distToPlayer(e,g)<26) flee(...); else
chase(...); }`, no `shoot`/`charge`/`hop` call anywhere — but it was never
named in that sweep and `check-drift.mjs` still reports it as
`walk,hurt,death` (missing `attack`). This is either a sixth genuinely
structural case that simply wasn't enumerated, or something the earlier
sweep actually missed. Nobody has looked at `stalfos` specifically for
this yet.

## The task
Decide `stalfos`'s `attack` state the same rigorous way S97 did the other
five: read its `ai()` and every function it calls (`flee`/`chase`,
`src/game/enemy.js`) in full, not just its one-line lesson. If it turns
out to have the same "no discrete windup" shape as the other five, record
that in `docs/ENEMIES.md`'s audit section and `docs/prompts/LEDGER.md`
(add `stalfos` to the named structural-wall list) — a negative result IS
the finished task, not a placeholder for more work. If it turns out
`stalfos` actually has a real pause moment nobody noticed (e.g. inside
`flee`'s own logic), wire `attackFrame` for it the same way the `hop()`/
`charge()` sessions did, with full in-engine verification.

## Done means
- A written, evidenced answer exists for `stalfos`'s `attack` state in
  `docs/ENEMIES.md` and `docs/prompts/LEDGER.md` — either "structurally
  blocked, joining the other 5" or a landed `attackFrame` verified
  in-engine.
- If code changed, the full regression sweep passes: `validate.mjs`,
  `test.mjs` (83/83), `check-feel.mjs`, `check-motion.mjs` (8/8),
  `check-playthrough.mjs` (21/21), `replay.mjs` (51/51),
  `check-rippers.mjs` (17/17), `check-build.mjs`.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- Reopening `idle` for the 8 already-closed candidates (S53-S57) —
  closed, do not re-litigate without a new stated reason.
- `beamos`/`barnacle`/`bubble` hurt/death — these three are unkillable by
  design (`docs/ENEMIES.md` line 45), not an open gap.
- `octorok`/`zol`/`keese`/`tektite` hurt — all hp <= `swordDamage()`
  level 1 (2), blocked by the S12 rule in `docs/prompts/LEDGER.md`.
- Any fix that requires inventing a new engine mechanism without a stated
  reason the existing four (`shoot`/`charge`/`hop`/one-off) don't cover.
