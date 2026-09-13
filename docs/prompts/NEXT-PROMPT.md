# Next session — pick one more idle pilot or pivot

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/ENEMIES.md`'s "Idle states: scoped, then piloted on one enemy"
  section — the full account of which 9 enemies have a genuine
  standing-still state, why `urchin` alone got a hand-drawn `idleFrame`,
  and why the other 8 are still blocked on art.

## Why this, now
`urchin` now has a real `spec.idleFrame`, verified in-engine (S54). The
other 8 candidates (`beamos`, `barnacle`, `wizzrobe`, `siren`, `keese`,
`zol`, `tektite`, `pincer`) are still blocked: every spare sheet frame
near them is already spent on that enemy's own `hurtFrame`/
`attackFrame`/`deathFrame`. Hand-drawing worked for `urchin` because its
design case was clean (a tide-gated dormant/awake split, no competing
`attackFrame`) — the remaining 8 are weaker cases (a mechanical rest
before an existing telegraph, not a distinct behavioral state), so this
session's job is to judge whether ANY of them deserves the same
hand-drawn treatment, not to grind through all 8.

## The task
1. Of the 8 remaining candidates, pick AT MOST ONE with a genuinely
   strong design case — read `docs/ENEMIES.md`'s existing one-line
   lessons for each (`beamos`, `barnacle`, etc.) and judge whether a
   distinct idle look would teach the player something, the way
   `urchin`'s dormant/awake split does. If none of the 8 clears that bar
   — most of them are "resting between actions," not "in a different
   behavioral state" — say so plainly and do NOT hand-draw one just to
   move the count. A correct "none of these are worth it" is a valid
   outcome.
2. If one clears the bar: hand-draw its `idleFrame` in
   `src/data/sprites-enemies-hurt.js`, following `urchin_idle`'s own
   precedent — render every draft from the real runtime palette
   side-by-side with its neighbours BEFORE wiring it in (a subtle edit
   can look identical to the walk cycle at actual size; `urchin_idle`'s
   own comment has the worked example of a rejected first draft). Wire
   `spec.idleFrame` and the flag its own `ai()` sets, matching
   `urchin`'s wiring in `src/data/enemies.js` exactly.
3. Verify in-engine with a scratch probe (same shape as `urchin`'s):
   trigger the condition, confirm the pose shows and clears correctly,
   and confirm a hit/death still overrides it.
4. Either way, update `docs/ENEMIES.md`'s idle section with the outcome
   (a landed pilot, or a reasoned "none of the remaining 8 clear the
   bar" verdict) so a future session doesn't re-open this investigation
   from scratch.
5. Run the full regression sweep: `validate.mjs`, `test.mjs` (83/83),
   `check-feel.mjs`, `check-motion.mjs`, `check-playthrough.mjs`
   (21/21), `replay.mjs` (51/51), `check-rippers.mjs`, `check-build.mjs`.

## Done means
- Either one more enemy has a verified, in-engine-proven `idleFrame`, or
  `docs/ENEMIES.md` explicitly records that none of the remaining 8 are
  worth hand-drawing right now, with reasoning.
- `node tools/check-drift.mjs`'s enemy-roster table reflects whatever
  changed (or confirms nothing did, if the verdict was "none").
- Every checker in step 5 passes; `dist/oracle-of-tides.html` rebuilt
  and committed if anything in `src/` changed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- Hand-drawing more than one new `idleFrame` this session, even if
  several of the 8 seem plausible — one pilot at most, same cadence
  every prior field in this objective used.
- Reopening the `attack`-state question for `crab`/`gel`/`leever`/
  `urchin`/`jellyfish` — already closed (S97/S52) and not to be
  re-litigated here.
- A full re-audit of the source sheets looking for previously-missed
  frames across the whole roster — that is a much larger undertaking
  than a single-session task; if it seems worth doing, name it as a
  candidate for a future NEXT-PROMPT.md rather than starting it here.
- Any change to enemy movement speed, damage, tide thresholds, or AI
  decision logic beyond what showing a pose requires.
