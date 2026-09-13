# Next session — scope what an idle state actually needs

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s S97 entry (the newest) — closed every known
  attack-telegraph mechanism (`shoot()`/`shootRing()`, `charge()`,
  `hop()`, plus two one-off patterns on `keese`/`pincer`) and confirmed
  the 5 enemies still missing `attack` (`crab`, `gel`, `leever`,
  `urchin`, `jellyfish`) have no discrete windup anywhere in their `ai()`
  — a real wall, not an unchecked lead. This session picks the OTHER
  named gap: `idle` states, unaddressed roster-wide since this objective
  began.

## Why this, now
`docs/ENEMIES.md`'s own header calls `idle`/`walk`/`attack`/`hurt`/
`death` completion "a separate, much larger undertaking" and has said so
since before this objective's `attackFrame` work even started — five-plus
sessions have named it as the other gap without any of them actually
opening `src/game/enemy.js` to see what it would take. That note is also
now stale in one concrete way: it cites `check-drift.mjs` as reporting
"0 of 22 complete," which was true when it was written but is now 9 of
22 (this objective's own `attackFrame` work moved that number) — a small
fix worth making in passing, not the point of the session.

## The task
This is a SCOPING session, not an implementation one — the objective is
too big and too undefined right now to wire in one sitting the way
`attackFrame` was. Produce a concrete, honest assessment, not another
one-line deferral.

1. Read `Enemy.spriteName()` (`src/game/enemy.js`) in full — the
   existing priority order is `dying > hurtFrame > attackFrame > walk
   cycle`. There is currently NO concept of "idle" anywhere in it: an
   enemy that isn't moving still shows whatever `spec.frames` gives via
   tick-based cycling, identical to when it IS moving. Confirm this
   directly rather than assuming.
2. For each of the 22 enemies, determine whether it has a genuine
   standing-still moment distinct from its ordinary walk/attack cycle —
   read every `ai()` function, the same full-read discipline S97 used
   for the contact-enemy survey. Some candidates worth checking first:
   `keese`'s own rest phase (already has `attackFrame` covering the last
   16 frames — does the FIRST 44 frames of its 60-frame rest need a
   different idle look, or does showing the ordinary walk cycle while
   standing still already read fine?), `wisp`/`beamos`/`barnacle`
   (stationary or near-stationary casters), anything using `patrol()`
   at its turn-around points. Many enemies (anything using `chase()`,
   `wander()`, `charge()`'s own `idle:` callback, `bounceDiag()`) are
   never actually still, and "idle" may not be a meaningful concept for
   them at all — say so plainly if that's what you find, rather than
   forcing an idle field onto every enemy for the metric's sake.
3. Decide and document what an `idle` FIELD would need, if any enemies
   genuinely qualify: a `spec.idleFrame` (single pose, like
   `attackFrame`) or `spec.idleFrames` (a cycle, like `frames`)? What
   triggers it — a timer since the last actual movement, or specific
   AI states named explicitly (the way `hurtFrame`/`deathFrame`/
   `attackFrame` are each triggered by a specific, named condition)?
   Whichever shape you land on, justify it against `spriteName()`'s
   existing pattern rather than inventing an unrelated one.
4. Pick ONE enemy to pilot on, if a clear, well-motivated candidate
   emerges — following this objective's own established precedent
   (`attackFrame` was built and proven on exactly one enemy, `moblin`,
   before any survey of the rest). Do not pilot on a shaky or borderline
   case just to have piloted on something.
5. If the investigation instead concludes idle doesn't cleanly fit this
   roster's actual AI shapes (most enemies here are closer to "always in
   motion" than "stands, occasionally acts," unlike the Oracle games'
   own more idle-heavy roster), say that plainly and explicitly, and
   treat it as a real finding — not a failure to complete the task. A
   correct "this doesn't fit, here's why" is worth more than a forced
   `idleFrame` on every enemy.
6. Fix `docs/ENEMIES.md`'s stale "0 of 22" line while you're in the
   area (now 9 of 22, or whatever `check-drift.mjs` reports at the time
   you run it) — a one-line fix, not a rewrite of the file.
7. Whatever you build (if anything), run the full regression sweep:
   `validate.mjs`, `test.mjs` (83/83), `check-feel.mjs`,
   `check-playthrough.mjs` (21/21), `replay.mjs` (51/51),
   `check-rippers.mjs`, `check-build.mjs`.

## Done means
- A concrete written scope for `idle` exists somewhere durable (this
  file's own successor, or a new section in `docs/ENEMIES.md` if that's
  the more natural home) — not just "still separate, much larger" for a
  sixth time.
- If a pilot enemy was wired: proven in-engine the same way every
  `attackFrame` proof has been, and all regression tools pass.
- If idle was found not to fit: that conclusion is written clearly
  enough that a future session doesn't re-open the same investigation
  from scratch.
- `docs/ENEMIES.md`'s stale enemy-count line is corrected.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- Wiring `idle` onto the full 22-enemy roster in one session, even if
  the scope turns out simple — one pilot enemy at most, same cadence
  `attackFrame` used.
- Reopening the `attack`-state question for `crab`/`gel`/`leever`/
  `urchin`/`jellyfish` — S97 already closed that investigation with a
  clear negative result; inventing a new mechanism for them is a
  separate, later design decision if the charter's rotation ever
  revisits it, not something to fold into this session.
- Any change to enemy movement speed, damage, or AI decision logic
  beyond what showing an idle pose requires.
