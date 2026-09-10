# Next session — Oracle of Tides

Repo `ronnieibrahim-cpu/Loz-one-shot`. Branch from the CURRENT tip of `main` —
`git log -1 origin/main` for the real commit. One prompt = one session = one
branch. Do not open a pull request unless asked.

## Task: your choice — D5 seed 3's remaining loss, or the next item on the project's own backlog

S57 landed a real fix for D5 Rootmaw's `gel`-loop (the positional deadlock
in his arena's one-tile exit is genuinely gone — read `docs/NEXT-SESSION.md`
S57 before touching anything in this area again), but seed 3 of the
standard 6-seed sample still loses, for a different, undiagnosed reason:
the fight now runs longer without freezing, and Rootmaw's own `zol` summons
appear to accumulate faster than the actor can clear ground toward him.
This is a real, open, bounded question — but it is NOT the only thing
worth doing next, and this prompt is deliberately not narrowing to just
that.

**Read `docs/DUNGEON-STATUS.md` and `docs/prompts/QUEUE.md` before deciding**
— between them they name several other independently-scoped, ready-to-pick-up
items (region-art systematic diffs, the narrower `dTravel` gap, wide-room
follow-ups). Pick whichever is best-scoped for a single session; do not
feel obligated to continue the boss-combat thread just because it was the
most recent session's focus.

## If you pick up D5 seed 3

1. Read `docs/NEXT-SESSION.md` S52 and S57 in full first — S57 has the exact
   trace method (log player/boss/hazard positions every 20 frames, watch for
   a genuinely unchanged pixel) that found the LAST mechanism; reuse it
   rather than re-deriving from scratch.
2. Trace the current (post-S57) seed 3 fight the same way, but look for
   what's different this time: does the `zol` count actually grow past what
   `dBoss` can clear (`countType(g,'zol')` is checked directly in
   `src/data/bosses.js`'s `rootmaw` phases), or is there a second, different
   positional problem? Confirm before designing a fix — S54's own mistake
   was fixing the FIRST plausible mechanism without checking it was the
   whole story.
3. Any fix needs the same discipline S52-S57 have all used: a boss-specific
   spec field if at all possible (not a `hazards()`/`evade()` change — three
   sessions have shown that road is expensive), a full 6-seed sweep, and a
   check that D1-D4/D6 stay byte-identical.
4. If it doesn't close cleanly, the same honesty rule applies: a precise
   account of what was tried and measured is a fine outcome. Seed 3 staying
   a loss with a well-understood cause is not a crisis — D5 is currently 4
   of 6 winning, which is the number this project has shipped worse odds
   than before (D1 was 1/36 for a long time).

## Done means (whichever task is picked)

- Working code changes validated per the relevant tools in CLAUDE.md's own
  table for the area touched.
- `docs/NEXT-SESSION.md` updated losslessly (new entry, do not renumber or
  edit past ones).
- `docs/DUNGEON-STATUS.md` and/or `docs/prompts/LEDGER.md` and/or
  `docs/prompts/QUEUE.md` updated to reflect whatever changed, so the next
  session doesn't re-discover the same state.
- `npm run build` re-run; commit `dist/oracle-of-tides.html` only if `src/`
  changed — confirm rather than assume either way.

## Explicit out of scope

- **Do not touch `hazards()` or `evade()`'s shared swap-cost machinery.**
  Three sessions (S54-S56) measured that road expensive for the whole actor
  harness. S57's `breakDeadlock` pattern (boss-scoped, opt-in, tracked
  entirely inside `dBoss`) is the model to reuse if a similar problem shows
  up on another boss.
- **Routing D3 onward** (needs the Coastwise Chain first) and **Nereth's D6
  `tideEscape`** (S53, landed and correctly inert) remain untouched.

## Habits worth carrying in

- **A fix that closes a named bug without flipping the aggregate number is
  still worth landing, per this project's own `noContact` precedent** — S57
  is the clearest recent example: the freeze is gone, seed 3 still loses,
  and it shipped anyway because it cost nothing and fixed something real.
  Don't hold a good, scoped fix hostage to a bigger number it was never
  going to move on its own.
- **Trace before diagnosing.** S57's whole finding came from watching actual
  positions frame by frame rather than reusing S54's plausible-sounding
  "give it velocity" hypothesis. The scratch-harness method (log state every
  N frames via `window.__rp.pump`, look at the raw numbers) is cheap and
  has now paid off twice in this exact area.
