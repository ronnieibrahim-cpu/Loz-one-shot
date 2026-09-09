# Next session — Oracle of Tides

Repo `ronnieibrahim-cpu/Loz-one-shot`. Branch from the CURRENT tip of `main` —
`git log -1 origin/main` for the real commit. One prompt = one session = one
branch. Do not open a pull request unless asked.

## Task: give `dBoss` a real per-boss "is `weakOpen` alone safe to press" signal

S49 tried the narrow fix S45 named for why Nereth (D6) and Rootmaw (D5) lose
to the harness actor's `dBoss` verb, measured it against all six bosses, and
found it is not a pure win — full account in `docs/NEXT-SESSION.md` S49 and
`docs/prompts/LEDGER.md`'s "Known and deliberately unfixed" section. Read
both before touching anything.

**The short version.** `dBoss`'s `p.invuln` 1-20 sub-branch used to require
`b.stun > 0` before pressing an attack, else it retreated. Dropping that
requirement (pressing whenever `!b.charging`, regardless of stun) flips D2
from a loss to a clean win and brings D5/D6 dramatically closer (Nereth: 6 of
80 damage dealt before, 78 of 80 after) — but flips D1 from a clean win to a
**deterministic** loss (same result across `--seed=1` through `--seed=5`).
Root cause: `weakOpen` does not universally mean "the boss cannot act" —
`src/data/bosses.js`'s own comment (search "A BOSS DOES NOT FIRE INTO ITS OWN
WINDOW") says a checker requiring exactly that was written and removed
because it false-positived on Gohmaraq, Wyverna and Rootmaw, all three
already won without it. Only Nereth's and Anemos's FINAL phases actually gate
their own fire on `!weakOpen`; Gohmaraq's does not, so `b.stun` was the only
real safety signal his fight ever had, and dropping it blindly presses into
live fire — confirmed directly in the damage log, every post-fix D1 hit lands
with `weakOpen:true, stun:0, charging:false`, exactly the newly-permitted
state.

## Read first, in this order

1. `docs/prompts/LEDGER.md`'s "Known and deliberately unfixed" section, the
   Nereth/Rootmaw bullet.
2. `docs/NEXT-SESSION.md` S49 in full — the exact before/after table for all
   six bosses, the damage-log evidence for D1's regression, and the two
   untried directions named at the end (read them before picking one; this
   prompt expands the first).
3. `docs/NEXT-SESSION.md` S45 — the original diagnosis of Nereth's mechanism
   frame by frame, and its own caveat that a robot losing does not by itself
   prove a boss unfair.
4. `src/data/bosses.js` — the `open`/`shut`/`closeTick` helpers and the "A
   BOSS DOES NOT FIRE INTO ITS OWN WINDOW" comment block above them, then the
   two `!e.weakOpen`-gated call sites (Nereth's and Anemos's final phases).
5. `tools/actor-runtime.mjs`'s `dBoss`, the `b.weakOpen` branch — read the
   comment S49 left on the `p.invuln > 0` sub-branch; it documents exactly
   what was tried and reverted, in place, so you are not rediscovering it
   from a diff.
6. `tools/measure-boss-combat.mjs`'s own header — the `--seed=`, `--qh=`,
   `--tide=` flags, and why a single seed is never trusted.
7. `git ls-remote --heads origin` before starting, in case another session
   already attempted this.

## What to build

**Direction 1 from S49 (recommended first): an explicit per-boss spec field.**
Add something like `safeWhenOpen: true` to Nereth's and Anemos's
`defineBoss(...)` calls in `src/data/bosses.js` — the two bosses whose final
phase already gates its own fire on `!weakOpen`, i.e. the two for which
`weakOpen` genuinely does mean "cannot act." Read it in `dBoss` off `b.spec`
(or wherever the boss's own definition is reachable from the fight entity)
and use it, not `b.stun`, to decide whether the `p.invuln` 1-20 sub-branch
presses or retreats: press when `(b.stun > 0 || b.spec.safeWhenOpen) &&
!b.charging`, retreat otherwise. This keeps Gohmaraq/Wyverna/Rootmaw on the
stun-gated behaviour that already wins those three fights, while giving
Nereth and Anemos the aggressive behaviour that S49 already measured working
for Anemos (D2) and getting Nereth (D6) to 78 of 80.

Direction 2 (a learned-at-runtime signal, no `bosses.js` change) is named in
S49's own entry as a fallback if direction 1 turns out to need per-boss data
plumbing that is more invasive than it looks from here — do not start there
unless direction 1 proves genuinely blocked, since a runtime-learned
heuristic has its own failure modes (named in S49) and is harder to verify.

## Done means

- `node tools/measure-boss-combat.mjs d1` through `d6` (default seed) — D1,
  D3, D4 still WIN at their current margins or better (no regression); D2
  still wins; D5 and D6 measurably improve over the S49 baseline (6/80 and
  26/52 respectively) — an outright win on one or both is the real goal, but
  a judgement call, not a checker, decides if a large improvement short of a
  win is worth landing this session vs. continuing next time.
- The same six measurements repeated at `--seed=1` through `--seed=5` (or
  more) for D1 specifically — S49's regression was deterministic across five
  seeds, so a fix that only helps at the default seed is not trusted; sweep
  before believing a result, per the file's own header comment.
- `node tools/check-playthrough.mjs` — 21/21, unchanged (D1/D2 only; this
  proves the change doesn't destabilize the one real end-to-end run that
  exists).
- `node tools/replay.mjs` — 51/51, unchanged.
- `node tools/test.mjs` — 83/83.
- `docs/prompts/LEDGER.md`'s Nereth/Rootmaw bullet updated to say what
  landed (or, if this session also has to revert, updated the same way S49's
  did — a precise negative result is worth exactly as much as a positive
  one here).
- `docs/NEXT-SESSION.md` updated losslessly (new entry).
- `npm run build` re-run; commit `dist/oracle-of-tides.html` only if it
  changed (a `bosses.js`/`actor-runtime.mjs` change does not touch anything
  bundled from `tools/`, but boss balance data IS bundled — check, don't
  assume, since this session's change (if any) touches `src/`).

## Explicit out of scope

- Teaching `dBoss` to dodge a telegraphed attack, or to press the conch
  contextually (Nereth's tide-pin mechanic) — both named in S45 as real
  capability gaps the actor has, neither is this session's job. If Nereth
  still doesn't win after direction 1 lands cleanly for D2, that is a
  legitimate stopping point, not a reason to scope-creep into a dodge verb.
- D3, D4 routing, or any extension of `tools/playthrough-route.mjs` past D2 —
  separate work; see the note below.
- Rootmaw's own attack pattern (growing-distance retreat, per S45) beyond
  what falls out of this fix naturally — a separate undiagnosed mechanism if
  D5 still doesn't win afterward.

## For whoever picks D3/D4/D5 routing after this lands

Not this session's job, but recorded here so it isn't rediscovered: **D3 and
D4 are NOT simply "next after D2."** `node tools/check-progression.mjs`'s own
flood shows D1, D2 and D5 are all reachable in round 1 (no prerequisite
beyond the starting sword+conch), while D3's and D4's overworld doors only
become reachable in round 3 — after round 2's offers (Thalassia's coin and
the Coastwise Chain's Rod, the latter needing the full 12-stage trade
sequence completed) are granted. Routing D3 or D4 for `check-playthrough.mjs`
therefore means routing a meaningful slice of the Coastwise Chain trading
sequence FIRST, not just walking from the Coral Spire to Bogwater Sanctum —
a substantially bigger task than D1->D2 was. D5 (Drowned Wood Shrine) has no
such prerequisite and would route more directly after D1+D2 — but its boss,
Rootmaw, is one of the two this prompt's own task is trying to fix, so it is
blocked on this session's outcome either way.
