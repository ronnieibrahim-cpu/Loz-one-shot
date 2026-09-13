# Next session — hand-draw and wire urchin's dormant pose

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/ENEMIES.md`'s new "Idle states: scoped, and found not to fit yet"
  section (this session's full finding: which enemies have a genuine
  standing-still state, and why every one of them has zero free sheet art).
- `tools/check-drift.mjs` lines ~241-291 — the enemy-roster metric and its
  own existing comment, which already said the engine "has no separate
  idle art" before this session's survey confirmed it in detail.

## Why this, now
S53 read all 22 `ai()` functions and found 9 enemies with a real
standing-still state, but confirmed zero unclaimed sheet frames for any of
them — every spare frame `rip-enemies.py`'s own comments name is already
spent on that enemy's `hurtFrame`/`attackFrame`/`deathFrame`. CLAUDE.md's
art rules allow hand-drawing when no sheet has a pose — exactly how
`beetle_hurt`/`darknut_hurt`/`gel_death`/`stalfos_death` already got their
art — so the blocker is a decision, not a hard wall. `urchin` is the
strongest candidate: no `attackFrame` competing for its 2 live frames, and
"dormant below tide level 1, awake at or above it" is a real design split,
not a mechanical pause.

## The task
1. Hand-draw a new pose in `src/data/sprites-enemies-hurt.js` (e.g.
   `urchin_idle`) reading as spikes pulled in / hunched low — distinct from
   `urchin_0`/`urchin_1`'s spiky-ball walk cycle — following the 3-colour +
   hard outline + silhouette-first rules in CLAUDE.md's Art rules section.
   Do NOT reuse `urchin_death`'s already-claimed retracted-dome pose; that
   must keep meaning "defeated" only.
2. Add `spec.idleFrame` support to `Enemy.spriteName()`
   (`src/game/enemy.js`): a single held pose, the same shape
   `spec.attackFrame` already takes, checked between `attackFrame` and the
   plain walk-cycle fallback (`dying > hurtFrame > attackFrame > idle >
   walk`).
3. Wire it on `urchin` only (`src/data/enemies.js`): its own `ai()` sets an
   explicit flag from the tide condition it already reads
   (`g.tide.level < 1`) — do not build a generic "hasn't moved in N
   frames" timer; S53 already ruled that out, since it would misfire on
   every walker's ordinary pause between lattice-step decisions.
4. Verify in-engine (screenshot or a scratch Playwright probe): the pose
   shows only while the tide is below level 1, clears the instant the tide
   reaches 1 and `urchin` starts wandering, and a hit or death still
   correctly overrides it (the `hurtFrame`/`deathFrame` priority order is
   unchanged by adding `idle` below `attackFrame`).
5. Update `tools/check-drift.mjs`'s enemy-roster section: read
   `idleFrame` the same regex-on-the-real-field way `hurtFrame`/
   `attackFrame`/`deathFrame` already are, and correct its own comment
   (~lines 246-261), which currently claims the engine has no idle
   concept — that stops being true once this lands.
6. Run the full regression sweep: `validate.mjs`, `test.mjs` (83/83),
   `check-feel.mjs`, `check-motion.mjs`, `check-playthrough.mjs` (21/21),
   `replay.mjs` (51/51), `check-rippers.mjs`, `check-build.mjs`.

## Done means
- `node tools/check-drift.mjs` reports `urchin` with `idle` in its set, and
  its own header comment no longer says the engine has no idle concept.
- In-engine proof the pose triggers and clears on the tide threshold
  specifically — not a generic movement timer.
- Every checker in step 6 passes; `dist/oracle-of-tides.html` rebuilt and
  committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- Any enemy other than `urchin` this session — a single-enemy pilot, the
  same cadence `attackFrame` used before its own roster-wide survey.
- Reopening the attack-state question for `crab`/`gel`/`leever`/
  `jellyfish` — already closed and explicitly not to be re-litigated here.
- Deciding whether `idle` belongs in objective #4's done-condition at all.
  That tension — this engine, like its source games, may genuinely not
  want separate idle art — was raised to the user directly after S53; this
  task exists to produce one real, checkable example either way, not to
  settle the policy question.
- Any change to enemy movement speed, damage, tide thresholds, or AI
  decision logic beyond what showing the pose requires.
