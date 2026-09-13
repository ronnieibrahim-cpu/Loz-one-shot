# Next session — wire tektite's attackFrame, then start a real design gap

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s S96 entry (the newest) — built `attackFrame`
  support into `hop()` itself and piloted it on `zol` (a zero-new-art
  reuse of `zol_1`). The plumbing already exists — `tektite` just needs
  the same survey-and-wire treatment `zol` got.

## Why this, now
`tektite` (`src/data/enemies.js`, `hop()` with `wait: 34`) is the other
`hop()` user; `zol`'s own `deathFrame` comment (`sprites-enemies-hurt.js`)
already refers to `tektite_1` in passing as "the hop-apex tuck" —
language from a session that looked at `tektite`'s frames for a DIFFERENT
purpose (finding `zol_death`'s own inspiration) but never wired it as an
attack telegraph. That is a strong hint this is another `zol_1`-shaped
reuse, not a hand-draw, but confirm it rather than assume it from one
passing phrase.

## The task
1. Confirm `tektite`'s real spec directly (`hp`, `pal`, `frames`, the
   `hop()` call's `wait`/`dist`/`height`/`frames` values) from
   `src/data/enemies.js`.
2. Render `tektite_0` and `tektite_1` from `tektite`'s real runtime
   palette (`src/gfx/palettes.js`) to PNGs before judging — the
   technique every session since S90 has used. Confirm `tektite_1` is a
   genuine shape change (a "hop-apex tuck") and not a recolour, the same
   test that separated `siren_1`/`beetle_s0`/`zol_1` (real reuses) from
   `wisp_1` (correctly rejected).
3. If it qualifies, wire `attackFrame: 'tektite_1'` on `tektite`'s
   `defineEnemy` call, documenting the reuse reasoning inline the way
   `zol`'s own entry does. If it doesn't qualify for some reason this
   file didn't anticipate, hand-draw instead, following `CLAUDE.md`'s
   art rules and checking what `tektite_death` (already hand-drawn,
   `sprites-enemies-hurt.js`) has already claimed on the sprite.
4. Verify in-engine with a scratch Playwright probe (not committed),
   following S96's own pattern exactly: clear a room to plain ground
   (`check-motion.mjs`'s boot pattern) so `hop()`'s `beginStep()` can
   actually succeed, then drive `tektite` through at least two full hop
   cycles, tracing `_hopState`/`_hopWait`/`attackTime` every frame.
   Confirm the attack pose window is exactly the last `ENEMY_ATTACK_FRAMES`
   of the 34-frame wait, and — the one thing S96 got wrong on its FIRST
   attempt and only caught by tracing — confirm the pose's last active
   frame is immediately before the `_hopState` transition to `'air'`,
   with no 1-frame overlap. `tektite` has no `hurtFrame` (hp 2, always
   lethal), so also confirm a lethal hit mid-windup still shows
   `tektite_death`, not the attack pose frozen in place.
5. Run the full regression sweep: `validate.mjs`, `test.mjs` (83/83),
   `check-feel.mjs`, `check-motion.mjs` (8/8 — this touches `hop()`-
   adjacent territory even if `hop()` itself isn't touched again),
   `check-playthrough.mjs` (21/21), `replay.mjs` (51/51) — re-record
   anything that diverges — `check-rippers.mjs` (17/17 if untouched) —
   `check-build.mjs`.
6. **Once `tektite` is wired, this session has TIME AND SCOPE LEFT — use
   it to actually START one of the two real remaining gaps**, rather
   than stopping at the last easy wiring win:
   - Survey the 7 pure-contact enemies (`crab`, `zol`\* is now handled,
     `gel`, `keese`, `leever`, `urchin`, `jellyfish`, `pincer`) for
     whether any has an existing pause-then-strike moment hiding in its
     own AI the way `hop()`'s wait and `charge()`'s tell both turned out
     to have — read each one's `ai()` function fully, not just its name.
     `keese`'s own `_dash`/`_rest` counters (`src/data/enemies.js`) are
     the most promising lead, since a dash-then-rest cycle is
     structurally similar to `charge()`'s own shape.
   - OR scope what an `idle` field would actually need from the engine:
     read `docs/ENEMIES.md`'s own header for what's already been said
     about it, and write a concrete, honest assessment of what's
     missing (a new `spec.idleFrame`? a timer for "how long standing
     still before idle shows"? which enemies even have a natural idle
     vs. constant motion?) rather than leaving it as an un-investigated
     one-line mention for the 5th session in a row.
   Pick ONE, not both — write up the other as a clearly-scoped
   candidate for the session after, the same way S95/S96 each left a
   clean handoff.

## Done means
- `tektite: walk,attack,death` in `check-drift.mjs`'s output (or
  `walk,attack,hurt,death` if it turns out to have a `hurtFrame` — check
  rather than assume).
- All regression tools pass (see above).
- `npm run build`, `dist/oracle-of-tides.html` committed.
- Real, documented progress on ONE of the two remaining gaps (a survey
  finding, or a design scope) beyond just wiring `tektite` — this session
  should not end at "one more enemy done" if there's time left in it.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- Hand-drawing new art for any of the 7 pure-contact enemies in THIS
  session, even if the survey finds a good candidate — survey and scope
  only; wiring is the next session's job, same cadence as every roster
  survey before it.
- `idle` states implementation — scoping only if that's the branch
  chosen, not building it yet.
- Any change to `hop()`'s own height, distance, wait or speed values —
  art and wiring only, not balance.
