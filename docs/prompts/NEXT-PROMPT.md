# Next session — give jellyfish a real deathFrame

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s S78 entry (`tektite_death`, the newest) — its
  handoff note: `tektite` looked plain but actually drove `hop()`'s live
  `fz` accumulator, and killing it mid-hop froze the death pose elevated
  for the whole stall. `jellyfish` has no such AI-driven height (it uses
  `bounceDiag`/`driftWithTide`, not `hop`) — confirm that from `ai()`
  directly rather than assuming from this prompt's own framing, the same
  check S78 said was worth repeating.

## Why this, now
S26-S33 (STATE.md's own numbering) gave `deathFrame` to `gel`, `keese`,
`octorok`, `urchin`, `crab`, `zol`, `leever`, `tektite` — eight enemies now.
`jellyfish` (hp 2, `terrain: 'water'`, `src/data/enemies.js`) is the next
hp <= 2 enemy without one, and currently has no `hurtFrame` either, so this
will be its first hit-feedback pose of any kind. `bubble`/`beamos`/
`barnacle` stay out of scope (hp 999, effectively unkillable).

## The task
1. Check `assets/sheets/oracle-seasons-enemies.png`'s own source plate for
   `jellyfish_0`/`jellyfish_1` (boxes 12/13 per `tools/rip-enemies.py`,
   labelled "Bari" on the sheet — confirm the label yourself, don't take
   this prompt's word for it) for a collapse pose distinct from what's
   already used. `pip install pillow` first if it isn't already installed,
   and run `python3 tools/rip-enemies.py` once unmodified to confirm it
   still reproduces byte-identically before changing anything.
2. If a real third frame exists: add it to `FRAMES` in `tools/rip-enemies.py`
   and re-emit. Never hand-add a key to `sprites-enemies.js`.
3. If nothing extractable exists: add `jellyfish_death` to `ENEMY_HURT_ART`
   (`sprites-enemies-hurt.js`, no new file), following the same
   "reuse/squash the live frames, invent nothing" discipline `octorok_death`/
   `tektite_death` used rather than drawing a new shape from scratch.
4. Add the new sprite name to `sprite-manifest.js`'s `enemies` list.
5. Wire `deathFrame: 'jellyfish_death'` onto `jellyfish`'s `defineEnemy` call.
6. Verify in-engine: read `jellyfish`'s `ai()` (`bounceDiag` + `driftWithTide`)
   and confirm it has no `z` field and no hop/submerge height state before
   deciding the pose needs no special height handling — confirm, don't
   assume from this prompt. Lethal hit (hp 2 -> 0), confirm `spriteName()`
   returns `jellyfish_death` while `dying`, held for `ENEMY_DEATH_FRAMES`,
   then `dead = true`.
7. Run `node tools/check-playthrough.mjs` and `node tools/replay.mjs` after
   everything else is green. `tektite_death` (S78) shifted `d1-descent`'s
   entity-count checkpoint and needed a re-record
   (`node tools/replay.mjs --record d1-descent`) — expect the same
   possibility here if `jellyfish` appears anywhere in a recorded replay,
   and re-record whichever plan actually diverges rather than treating a
   failure as a known-bad baseline to route around.

## Done means
- `jellyfish` shows a real collapse pose on the hit that kills it, proven
  by an in-engine probe, not by reading the code.
- `node tools/check-drift.mjs` shows `jellyfish: walk,death`.
- `node tools/validate.mjs`, `node tools/test.mjs` pass (83/83). If
  `sprites-enemies.js` changed, `node tools/check-rippers.mjs` is 17/17.
- `node tools/check-playthrough.mjs` is 21/21 and `node tools/replay.mjs`
  is 51/51 after this session's change, both confirmed by actually
  running them. A divergence is this session's own fault to fix
  (re-record the affected plan), not a known-bad baseline.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- Any OTHER enemy's `deathFrame` — one enemy per session, same cadence
  this thread has kept for eight sessions straight.
- `bubble`, `beamos`, `barnacle` — all hp 999, effectively unkillable.
- Re-investigating why `tektite`'s hop froze the death pose elevated —
  that's recorded as an accepted quirk in S78, not an open question.
- `attackFrame` or any engine field for it — still the separate, bigger
  redesign question (see `docs/prompts/LEDGER.md`).
