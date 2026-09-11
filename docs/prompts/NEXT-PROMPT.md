# Next session — Oracle of Tides

Repo `ronnieibrahim-cpu/Loz-one-shot`. Branch from the CURRENT tip of `main` —
`git log -1 origin/main` for the real commit. One prompt = one session = one
branch. Do not open a pull request unless asked. Before starting, run
`git ls-remote --heads origin` and skim for anything boss/D6-related dated
AFTER this file's own session commit — this thread has twice found stale or
duplicate work sitting on an unmerged branch nobody checked for.

## Where D6 (Nereth) actually stands — read `docs/NEXT-SESSION.md` S67 in full first, S66 for background

Standard 6-seed sample, `tools/measure-boss-combat.mjs <d> --seed=N`, in-order
health, no god mode:

```
     d1    d2    d3    d4    d5    d6
     6/6   3/6   1/6   6/6   6/6   3/6
```

D6's seed-independent wall-freeze is closed (S66, room widened). S67 traced
the three remaining losses (seed2, seed3, seed4) separately and found three
different shapes, not one — full damage logs and per-seed writeups are in
`docs/NEXT-SESSION.md` S67:

- **Seed3**: pure sustained ranged-attrition. No anomaly, no contact damage,
  just the slowest kill pace of the six seeds. Reads as ordinary RNG variance
  in how the fight's timing lines up, not a bug.
- **Seed2**: takes 3 contact hits (one while still in hit-stun from the
  previous hit) during a 240-frame `weakOpen` window — Nereth's own designed
  "break the pin, get an extended window" mechanic, not a glitch. **Not yet
  known whether this is an avoidable actor mistake or just bad luck in an
  unusually long window** — S67 found the window and the hits but did not
  trace the exact positions inside it.
- **Seed4**: closest loss, 8 of 80 boss-hp short of a win. Mostly ordinary
  projectile damage plus two contact hits in the phase-4 finale (a summoned
  `darknut` plus Nereth). No obvious mechanism, just very close.

**All six seeds, wins included, also share a deterministic "opening tax":**
4 identical hits (3 projectile + 1 contact), 13 of 32 quarter-hearts (40.6%
of the whole health pool), gone before frame 903 on every single seed,
before any RNG diverges. Winning seeds finish with only 4-7 of 32 qh to
spare — this tax is the single biggest thing separating a win from a loss on
this boss, bigger than any one seed's own mechanism.

## Task: pick one, in priority order

**1. (Recommended) Trace seed2's specific 240-frame window frame by frame.**
This is the one lead from S67 with a concrete, answerable question: at the
exact frames of the three contact hits (`f=1445`, `f=1498`, `f=1550` — see
S67's full log), was there a wall-real, hazard-clearing candidate direction
available that the actor didn't take? Use the exact method S62-S65 used for
the wall-freeze: a temporary, gated trace (`globalThis.__TRACE_D6` or
similar — never touch the committed file for the trace itself), log the
candidate directions `evade` considered and their costs at each of those
three frames, and compare against what a player holding the sword would
actually do. Two outcomes, both are a legitimate session:
  - **A real, narrow miss found** (the actor had a clearly better option and
    didn't take it): fix it as tightly scoped as possible, then validate the
    FULL 6-seed x 6-dungeon sweep — zero tolerance for turning default,
    seed1, or seed5 into losses, the same bar every fix here has been held
    to since S52.
  - **No real miss** (all available options were genuinely comparable, the
    way S65 found for the wall-freeze): say so, revert any trace
    instrumentation (`git status` must be empty at the end), and write up
    why in `docs/NEXT-SESSION.md`. That is a complete, valuable session by
    this thread's own standard (see S61, S65, S67).

**2. Trace D2.** Still nobody has ever traced D2's own 3 losing seeds this
rigorously — every session in this whole boss-fairness thread has focused on
D3/D6. Don't assume it shares a mechanism with anything above; check.

**3. (If neither fits the session)** `docs/DUNGEON-STATUS.md` and
`docs/prompts/QUEUE.md` name other independently-scoped items.

## Explicit out of scope

- **Do not touch D6's wall-freeze fix (S66) or re-attempt a `dBoss`/`fence`
  movement-layer fix for it.** Closed, confirmed by five sessions
  (S62-S66). `docs/prompts/LEDGER.md`'s "Measured and rejected" section has
  the four rejected attempts if a differently-shaped freeze ever turns up
  elsewhere.
- **Do not widen Nereth's room further, or any other boss room, without a
  similarly strong, measured reason and a check-in with the user first** —
  S66's trade against the "every boss fight is one screen" convention was
  made once, deliberately, after four cheaper alternatives had failed.
- **Do not change the shared opening-tax timing (`NERETH_OPENING_DELAY`,
  trident/ring cadence) as a guess.** It's the single biggest lever on D6's
  win rate, which makes it also the highest-risk one to touch blind — it
  affects every seed including the three current wins. If a session wants
  to pursue it, that's a `bosses.js` tuning change needing the full 6-seed
  sweep and a check-in with the user (it trades fight difficulty, not just
  code), not a quick guess bolted onto tracing seed2 or D2.
- **Do not assume seed2, seed3, and seed4 share a cause.** S67 checked and
  they don't. Trace whichever one you pick on its own terms.
- **Zero tolerance for turning any of D1-D5's currently-passing seeds, or
  D6's default/seed1/seed5, into a loss**, on any change in this area.

## Done means

- `docs/NEXT-SESSION.md` updated losslessly (new entry, past ones untouched).
- `docs/DUNGEON-STATUS.md` and/or `docs/prompts/LEDGER.md` updated to match
  whatever changed.
- If `src/` changed: `npm run build`, commit `dist/oracle-of-tides.html`,
  and run the full relevant checker sweep for the area touched (see
  CLAUDE.md's verification table). A trace-only session with no code
  changes needs neither.
- Any temporary trace instrumentation removed before the session ends —
  `git status`/`git diff` empty except for the intended doc and (if
  applicable) code changes.
