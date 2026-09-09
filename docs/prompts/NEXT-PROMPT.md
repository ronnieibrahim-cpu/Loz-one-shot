# Next session — Oracle of Tides

Repo `ronnieibrahim-cpu/Loz-one-shot`. Branch from the CURRENT tip of `main` —
`git log -1 origin/main` for the real commit. One prompt = one session = one
branch. Do not open a pull request unless asked.

## Task: use the fixed `dTravel` in the real playthrough route, and prove it's still safe

The previous session fixed a real bug in `tools/actor-runtime.mjs`'s
`dTravel`: it could not path to a `size:[w,h]>1` room's own non-anchor cell
(it would silently walk into the WRONG room instead of stopping — see
`docs/prompts/LEDGER.md`'s S47 entry and `docs/NEXT-SESSION.md` S47 for the
full mechanism and proof). It deliberately did **not** splice that fix into
the live, committed route in `tools/playthrough-route.mjs` — Reefguard Hall
and Spire Ascent (both in D2) still use a manual `goto`/`exit` workaround
there, because Anemos's boss fight is frame-phase-sensitive and changing how
many frames those legs take risks shifting the fight's timing.

This session's job: replace those two workarounds with `travel` now that it
works, and correctly handle the frame-phase risk rather than hoping it's
fine.

## Read first, in this order

1. `CLAUDE.md` — its hard rules and verification table.
2. `docs/prompts/LEDGER.md`'s S47 row (dTravel fix) and its "Known and
   deliberately unfixed" section.
3. `docs/NEXT-SESSION.md` S47 (the fix and why it wasn't spliced in), then
   S40 and S41 in full — S40 found that a frame-phase-dependent `wait` tuned
   against an isolated scratch boot does not transfer to the real route
   because boss attack timers are keyed to absolute `g.frame`, not to when a
   scripted run's own steps began; S41 is the worked example of re-sweeping
   it correctly the next session, with nothing about the underlying fix
   changing, only the sweep target.
4. `tools/actor-runtime.mjs`'s `dTravel`, `bfsScreens` and `edgeTiles`
   functions (search `function* dTravel`) — read the fix's own comment.
5. `tools/playthrough-route.mjs` lines 805-849 (Reefguard Hall's workaround,
   labelled `d2 1,4,2` / `d2 1,5,3`) and lines 851-914 (Spire Ascent's,
   labelled `d2 1,3,2`, both cells) — read the comments explaining exactly
   which moves exist only because `travel` couldn't be used.
6. The GOAL comment block at the end of `tools/playthrough-route.mjs`
   (search `A REAL, GENERAL GAP`) — update it once the gap is closed here.
7. `git ls-remote --heads origin` before starting, in case another session
   already did this.

## What to change

Both workarounds are in D2's route, walking Reefguard Hall (`1,4,2`,
`size:[2,1]`) and Spire Ascent (`1,3,2`, `size:[1,2]`). For each one, replace
the manual `goto`/`exit` pair that exists only to reach the room's own
non-anchor screen with a single `['travel', rx, ry, budget]` call to that
screen. Do not touch anything else in the route — not the boss fight
sequencing, not the item pickups, not any other leg.

**Change ONE workaround at a time, not both together**, and re-run
`node tools/check-playthrough.mjs` after each change before touching the
other. That isolates which change (if either) disturbs Anemos's timing,
rather than debugging two changes at once.

## If `check-playthrough.mjs` goes red after a change

Almost certainly Anemos's fight (`['wait', 220]` right before `['boss', 9000]`,
near the end of the D2 section) — his attack timers are absolute-frame-based,
so a route that reaches his door a different number of frames later than
before can land the fight in a different, less favourable phase window.

Per S40/S41's own method: do not just try random `wait` values in an
isolated scratch boot. Sweep the `wait` against `beginPlaythrough` **with
the real `ROUTE` prefix** (the actual driven route up to that point, not a
fresh `boot()`), because that is the only thing that reproduces the frame
Anemos's room is actually entered at. Confirm the new value is robust
(wins across the same margin S40/S41 established — full account in those
two entries), not just barely passing once.

If you cannot find a `wait` that reliably wins after a reasonable sweep,
**revert that one leg's `travel` change and keep the manual workaround for
it** — a smaller win (one leg simplified) is better than a route that only
sometimes beats Anemos. Write up what was tried either way.

## Done means

- `node tools/check-playthrough.mjs` — 21/21, same completion claims as
  before (both essences taken, both bosses beaten in real combat, health
  never zero, tape replays deterministically). The frame count is EXPECTED
  to change if `travel` is faster or slower than the manual steps it
  replaced — that alone is not a failure, only a changed number that
  should end up smaller if fewer redundant menu/positioning frames survive.
- `node tools/replay.mjs` — 51/51, unchanged (these replays don't touch
  `playthrough-route.mjs`, so this just confirms no accidental collateral
  damage).
- `node tools/test.mjs` — 83/83.
- The GOAL comment block in `tools/playthrough-route.mjs` updated: remove
  the "A REAL, GENERAL GAP THE NEXT EXTENSION WILL HIT AGAIN" note for
  whichever leg(s) got simplified; keep it (rewritten to say so) for any
  leg where the workaround had to stay.
- `docs/prompts/LEDGER.md`'s S47 row updated to say the fix IS now used in
  the live route (or partially, naming which leg), instead of "not yet
  spliced in."
- `docs/prompts/QUEUE.md` item 1's "separately, now that dTravel itself is
  fixed" paragraph updated or removed to match what actually happened.
- `docs/NEXT-SESSION.md` updated losslessly (new entry, do not renumber or
  edit past ones); `docs/HANDOFF.md` appended if anything expensive was
  learned (e.g. the actual `wait` value that turned out robust, and why).
- `npm run build` re-run — likely a no-op on `dist/oracle-of-tides.html`
  since `tools/` is not bundled into the shipped game, but run and check it
  anyway per house rules; commit it only if it actually changed.

## Explicit out of scope

- Fixing `bfsScreens`' own graph model for a wide room's cells as pass-through
  waypoints to a THIRD room (a separate, more general gap noted in
  `docs/HANDOFF.md`'s hard-won-lessons entry on this fix — neither of D2's
  two legs needs it, so it wasn't built or tested).
- Any dungeon room geometry change (no `2x2`/`3x1` work this session).
- Boss balance, item art, overworld art, story.
- Extending `playthrough-route.mjs` past D2 (that's D3 routing, a separate,
  much larger piece of work — see `docs/prompts/LEDGER.md`).

## Habits worth carrying in

- **A five-line change to the movement path is never a five-line change**,
  because every recorded baseline and every frame-phase tune downstream of
  it moves too. Budget time for the re-sweep; don't assume the first attempt
  is done because it happened to pass once.
- **When a checker and your eyes disagree, screenshot it** — `window.__harness.takeOver()`,
  set state, `step`, `game.draw()`, screenshot the canvas.
- **When you fix something a checker missed, add the assertion that would
  have caught it, and prove it goes red against the old code.** The previous
  session did this with a scratch Playwright script proving the dTravel bug
  concretely (923 frames into the wrong room) before trusting the fix — the
  same discipline applies to proving Anemos's timing is actually robust, not
  just lucky once.
