# Next session — Oracle of Tides

Repo `ronnieibrahim-cpu/Loz-one-shot`. Branch from the CURRENT tip of `main` —
`git log -1 origin/main` for the real commit. One prompt = one session = one
branch. Do not open a pull request unless asked.

## Task: your choice — D5 seeds 9/10's remaining loss, or the next item on the project's own backlog

S58 closed D5 seed 3 for good: the standard 6-seed sample is now **6 of 6
winning** (read `docs/NEXT-SESSION.md` S58 before touching this area again —
it root-caused the loss to Rootmaw's own `zol`->`gel` split swarming the
actor, and generalized S57's `breakDeadlock` stall detector to fix it, no new
spec field). Widening the sample past the standard 6 (seeds 6-10) found two
that still lose — 9 and 10 — but both moved a long way in the right direction
under the same fix (seed 9: 40 -> 48 of 52 boss damage dealt; seed 10: 28 ->
52 of 52, the boss actually reaching 0 hp in the same 20-frame sample window
the player's own health does — a near photo finish the harness still counts
as a loss). **This is a real, open, bounded question, but D5 is no longer the
only thing worth doing** — the standard sample is clean, and this prompt is
deliberately not narrowing to just the widened-sample remainder.

**Read `docs/DUNGEON-STATUS.md` and `docs/prompts/QUEUE.md` before deciding**
— between them they name several other independently-scoped, ready-to-pick-up
items (region-art systematic diffs, the narrower `dTravel` gap, wide-room
follow-ups, cross-dungeon item reuse, frame-stepped `feel.js`). Pick whichever
is best-scoped for a single session; do not feel obligated to continue the
boss-combat thread just because it was the most recent session's focus.

## If you pick up D5 seeds 9/10

1. Read `docs/NEXT-SESSION.md` S57 and S58 in full first — both used the same
   trace method (log player/boss/hazard positions every 20 frames via a
   scratch harness, watch for what's actually happening rather than guessing)
   and both found a mechanism that was NOT what the previous session
   expected going in. Reuse the method; do not assume the cause.
2. **Do not assume seeds 9/10 are "more of the same swarm problem" without
   checking.** S58 explicitly declined to chase them without a fresh trace —
   the stall-detector fix already closed the swarm-drift mechanism it found;
   whatever is left in 9/10 might be that same mechanism at a harder
   parameter (a bigger swarm, worse luck on spawn positions) or it might be
   something else entirely (a `zol`/`gel` positioned to block a doorway the
   way the ORIGINAL S57 bug did, a timing interaction with `forceTide`, etc).
   Trace first.
3. If a fix is needed, the same discipline S52-S58 have all used applies: a
   boss-specific spec field if at all possible (not a `hazards()`/`evade()`
   shared-machinery change — four sessions now have shown that road
   expensive), a full sweep (the standard 6 seeds AND seeds 6-10, since
   that's the sample this fix would be measured against), and a check that
   D1-D4/D6 stay byte-identical.
4. If it doesn't close cleanly, the same honesty rule applies: a precise
   account of what was tried and measured is a fine outcome. D5 winning 6 of
   6 on the standard sample (9 of 11 on the widened one) is already a real
   result worth having banked, even if the widened sample's two stragglers
   stay open.

## Done means (whichever task is picked)

- Working code changes validated per the relevant tools in CLAUDE.md's own
  table for the area touched.
- `docs/NEXT-SESSION.md` updated losslessly (new entry, do not renumber or
  edit past ones).
- `docs/DUNGEON-STATUS.md` and/or `docs/prompts/LEDGER.md` and/or
  `docs/prompts/QUEUE.md` updated to reflect whatever changed, so the next
  session doesn't re-discover the same state.
- `npm run build` re-run; commit `dist/oracle-of-tides.html` only if `src/`
  changed — confirm rather than assume either way. (S57 and S58 both landed
  entirely inside `tools/actor-runtime.mjs`, the test harness's own scripted
  player-actor, not `src/` — so neither changed the shipped build. A fix to
  the ACTUAL boss AI would live in `src/data/bosses.js` and WOULD need a
  rebuild; know which kind of change you're making before skipping this.)

## Explicit out of scope

- **Do not touch `hazards()` or `evade()`'s shared swap-cost machinery.**
  Four sessions (S54-S58) have all found a boss-scoped, opt-in spec field
  (read only by `dBoss`) sufficient, and three of those four sessions tried
  touching shared machinery first and reverted it. Reuse or extend
  `rootmaw.spec.breakDeadlock`'s pattern if a similar problem shows up on
  another boss.
- **Routing D3 onward** (needs the Coastwise Chain first) and **Nereth's D6
  `tideEscape`** (S53, landed and correctly inert) remain untouched.

## Habits worth carrying in

- **Trace before diagnosing, every time — S57 AND S58 both found a mechanism
  different from what the session before them expected.** S54 assumed
  "needs velocity" and was wrong; S57 traced and found a positional
  deadlock; S57 (reasonably) expected the residual seed-3 loss to be "the
  actor isn't efficient enough," and S58 traced and found a specific,
  fixable swarm mechanism instead. The scratch-harness method (log state
  every N frames via `window.__rp.pump`, look at the raw numbers — extend
  it to log nearby entity types/positions, not just the player and boss, if
  the question involves a third party like a summon) is cheap and has now
  paid off on every single boss-combat session that used it.
- **A fix that closes a named bug without flipping the aggregate number all
  the way is still worth landing, per this project's own `noContact`
  precedent** — but check whether THIS TIME it actually does flip the
  aggregate before assuming it won't; S58 generalized S57's own pattern by
  one step and turned "4 of 6, seed 3 still open" into "6 of 6, nothing
  standard-sample open." Don't stop measuring at the first plausible
  explanation for why a fix "probably only closes one thing."
- **When a session's fix might be a real structural improvement (not a
  seed-3-specific patch), widen the sample past whatever the standing
  convention is before calling it done** — S58's 6-seed sweep alone would
  have read as "fully closed"; the seeds 6-10 sample found it wasn't quite.
  Widening cost five extra fight measurements and found real, useful signal.
