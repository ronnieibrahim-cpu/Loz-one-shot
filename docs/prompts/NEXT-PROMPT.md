# Next session — Oracle of Tides

Repo `ronnieibrahim-cpu/Loz-one-shot`. Branch from the CURRENT tip of `main` —
`git log -1 origin/main` for the real commit. One prompt = one session = one
branch. Do not open a pull request unless asked.

## Task: diagnose and, if tractable, fix Rootmaw (D5) losing to the harness actor

S50 landed a fix for Nereth (D6) — `dBoss` now has a per-boss
`safeWhenOpen` signal instead of blindly trusting `b.stun` — and confirmed
directly that it does NOT apply to Rootmaw: Rootmaw is explicitly one of
the three bosses (`src/data/bosses.js`'s own "A BOSS DOES NOT FIRE INTO ITS
OWN WINDOW" comment names Gohmaraq, Wyverna and Rootmaw) that keeps
attacking through its own `weakOpen` window by design, so flagging it
`safeWhenOpen` would be wrong, not just untried. Rootmaw's failure is a
**different mechanism** from the one S49/S50 fixed, first flagged in S45 as
"a new, undiagnosed finding" and still undiagnosed. This session's job is to
actually diagnose it, the way S45 diagnosed Nereth's (frame-by-frame
instrumentation, not guessing), and fix it if the diagnosis turns out
tractable in one session.

## A real lead, found by auditing the repo's pre-reset history (S51)

`git log --format=%H origin/main | tail -1` vs. the same for `git ls-remote
--heads origin`'s other ~90 branches shows this repo has exactly TWO root
commits: `main`'s own 15-branch lineage, and one 77-branch lineage that
shares NO history with it at all (`git merge-base` returns nothing) —
almost certainly a repo reset around 2026-09-02, the day the old
lineage's last commit and `main`'s first commit both fall on. **This is
not live parallel work to worry about** — every branch in the old lineage
predates `main`'s entire history and none has been touched since. But one
commit in it is directly relevant here: `claude/session-prompts-iterate-
wqudrq`'s tip, `64a6561` ("Every boss in the game can now be beaten, and
two of them always could") — fetch it with `git fetch origin
claude/session-prompts-iterate-wqudrq` if it's not already local, it is
NOT reachable from `main`. Read `git show 64a6561 --format=%B -s` in full.

**Everything valuable in it is already ported to `main`** — checked
directly, not assumed: `NERETH_OPENING_DELAY`/`NERETH_OPEN_FRAMES`/
`NERETH_FINAL_OPEN_FRAMES`/`ANEMOS_LASH_MIN_RANGE` all exist in
`src/data/feel.js`, `dismissSummons` and the `!e.weakOpen` gating exist in
`src/data/bosses.js`, and the ground-truth `beaten` check that fixed a
false-negative in the measuring tool (`g.boss` going `null` on a kill,
misread as "still alive") is already in `tools/measure-boss-combat.mjs`.
None of this needs redoing.

**One real discrepancy is worth chasing, and it points straight at
Rootmaw.** That old commit's own table reports Rootmaw ALREADY WINNABLE at
the bare in-order floor (7 hearts) with **15 of 28 quarter-hearts to
spare** — using a `dBoss` verb that, diffed directly against the current
one (`git show 64a6561:tools/actor-runtime.mjs` vs. `tools/actor-runtime.mjs`,
both define `dBoss` — compare them), has NO `evade`/`noContact`/velocity-
prediction system at all. Every movement yield in the old verb was a plain
`fence(m)`; the current verb wraps the same calls in `safe(m, retreat)`,
which adds `evade(...)` with a `noContact` box and an estimated boss
velocity (`bvel`, built from the boss's position one frame ago) — added
later, for a documented and different reason (stopping Gloomtide's D3
fight from landing hits on a target that had already moved past a stale
static collision box). **This system did not exist when Rootmaw last
measured as an easy win**, and Rootmaw's own current failure signature —
S45's "steadily growing distance" retreat pattern — is exactly the shape
an over-cautious `noContact` veto against a CONTINUOUSLY MOBILE boss would
produce: Rootmaw's final phase runs `chase(e, g, { speed: 0.38 })`
unconditionally, and if `evade`'s veto keeps rejecting approach candidates
because the predicted boss position is inside the `noContact` box, the
actor could plausibly back off a little further on every attempt without
ever closing the distance back down — a slow net retreat, not a stuck
loop. **This is a hypothesis, not a diagnosis — verify it before touching
anything.** Instrument `evade`'s own veto decisions during a Rootmaw fight
(does it reject an approach candidate more often, and increasingly so,
compared to a boss the actor wins against?) rather than assuming this
account is the whole story and patching blind.

## Read first, in this order

1. `docs/prompts/LEDGER.md`'s "Known and deliberately unfixed" section, the
   Rootmaw bullet (rewritten this session — read the CURRENT version, not an
   older cached one) — includes a pointer to the pre-reset-history lead
   above; read that section before this list's item 2 if you skipped it.
1b. `git show 64a6561:tools/actor-runtime.mjs` (needs `git fetch origin
   claude/session-prompts-iterate-wqudrq` first) diffed against the current
   `dBoss` in `tools/actor-runtime.mjs` — the `evade`/`noContact`/`bvel`
   system named above is the whole diff beyond cosmetic renames and the
   miniboss/`safeWhenOpen` additions S48-S50 made. Confirm this yourself
   rather than trusting the summary above; a hypothesis written by a
   previous session is still a hypothesis.
2. `docs/NEXT-SESSION.md` S45 — the original measurement: Rootmaw died at
   the in-order 7 hearts, 26 of 52 damage dealt, 14 hits taken, "all
   seven-plus at `weakOpen:false` and at STEADILY GROWING distance (78, 85,
   108, 98, 74, 92, 104, 116, 132px), unlike Nereth's fixed-distance
   pattern." Read this literally — the growing-distance number sequence is
   the actual clue, not decoration.
3. `docs/NEXT-SESSION.md` S49 and S50 — not because the fix applies, but
   because the METHOD does: S45's frame-by-frame `weakOpen` instrumentation
   (a scratch harness, not committed — the steps are written out in S45's
   own entry) is exactly the technique to adapt here, and S49/S50 show the
   discipline a change to `dBoss` needs (measure all six bosses before and
   after, sweep seeds, don't trust one green run).
4. `src/data/bosses.js`'s `rootmaw` entry (search `defineBoss('rootmaw'`)
   and `rootmawTide` immediately below it. Read this BEFORE hypothesising —
   it already changes the shape of the problem from what S45's own
   distance-based framing suggests:
   - Rootmaw's `weakOpen` is NOT a periodic window like Anemos's or
     Nereth's. `rootmawTide` calls `open(e, g, 30)` EVERY FRAME the tide is
     LOW (no timer gate), so at LOW tide Rootmaw is CONTINUOUSLY open, not
     periodically — a structurally different shape from the boss this
     session's fix was built for.
   - None of Rootmaw's three phases gate fire on `!weakOpen` (confirmed:
     `!e.weakOpen` appears exactly twice in the whole file, in `anemos` and
     `nereth` only) — he keeps spitting seed volleys and rings the entire
     time he is open. `safeWhenOpen` would be actively wrong for him, not
     just untested.
   - Phase 3 (`above: 0.00`) has him tear free and `chase(e, g, { speed:
     0.38 })` — a MOBILE boss, unlike Gohmaraq/Anemos/Nereth's mostly
     stationary or scripted-movement fights. S45's growing-distance numbers
     might be this: the actor's retreat-and-reapproach cycle (the "no
     invuln banked" branch and the RETREAT_MARGIN branch in `dBoss`) may be
     tuned against a boss that holds still or orbits in place, and simply
     lose ground against one that walks toward the player at a sustained
     speed during the exact window the actor is backing off.
5. `tools/actor-runtime.mjs`'s `dBoss`, the whole `b.weakOpen` branch (the
   comment S50 left names exactly what was tried and why) AND the
   `!b.weakOpen` ("Shelled: nothing to hit") branch just past it — Rootmaw
   spends real time in the shelled/not-open state too (at MID/HIGH tide,
   `rootmawTide` only opens on an 80-220 frame cycle, not continuously), so
   the growing-distance pattern could originate in EITHER branch depending
   on which tide level the fight is at when it happens.
6. `tools/measure-boss-combat.mjs`'s header — `--seed=`, `--qh=`, `--tide=`,
   why a single seed is never trusted.

## What to build

**Start with measurement, not a fix.** Reproduce S45's baseline first
(`node tools/measure-boss-combat.mjs d5` — confirm it still dies at 26 of 52,
28qh lost, matching S45/S49/S50's own repeated confirmations that nothing
has drifted). Then instrument frame-by-frame the way S45 did for Nereth: log
`weakOpen`, `stun`, `charging` (if set), tide level, and distance-to-player
at every damage event AND at some regular sampling interval in between, not
just at hits — S45's own distance sequence for Rootmaw came from hit events
only, and a fuller trace between hits may show the actual retreat pattern
more clearly than the hit log alone does.

**Once the mechanism is named, judge whether it is a `dBoss` bug or a real
difficulty wall**, the same caveat every boss-fairness entry in this project
carries: a robot losing does not by itself prove a boss unfair if the robot
is missing a verb a real player has. Rootmaw at LOW tide is permanently
open and permanently dangerous at the same time — a real player's answer to
that is presumably "hit it anyway, eat some risk, don't camp the retreat
forever," which is a genuinely different calculus from Gohmaraq's
charge-recovery-stun or Nereth's counter-gated final phase. It is possible
the honest finding here is "Rootmaw needs the actor to accept some
unavoidable chip damage during a continuously-open window, and the current
verb doesn't have a notion of that" rather than a discrete bug to patch.

**If a fix is found, validate it exactly the way S49/S50 did:**
`measure-boss-combat.mjs` on all six dungeons (zero regression on D1-D4, D2,
D6 unchanged or better), a seed sweep (`--seed=1` through at least `--seed=5`)
on whichever boss the fix touches, `check-playthrough.mjs` 21/21,
`replay.mjs` 51/51, `test.mjs` 83/83. If the fix touches shared `dBoss`
logic (likely, since Rootmaw's mobile phase-3 chase pattern may share code
paths with other bosses' approach logic), re-measure literally all six, not
just D5 — S49's own mistake was trusting a fix without doing this.

## Done means

- Either: a landed fix, validated per the bar above, with
  `docs/prompts/LEDGER.md`'s Rootmaw bullet updated to say what changed and
  by how much (measured numbers, not "should be better now").
- Or: a precise diagnosis written up the way S45's and S49's were — the
  actual mechanism, why it resisted a same-session fix, and what a fix would
  need — so a THIRD session does not have to re-instrument from scratch.
  A measurement plus a judgement is an acceptable outcome; a guess dressed
  as a fix is not.
- `docs/NEXT-SESSION.md` updated losslessly (new entry, do not renumber or
  edit past ones).
- `npm run build` re-run; commit `dist/oracle-of-tides.html` only if it
  changed (it will if `src/data/bosses.js` or `src/game/enemy.js` changes,
  per S50's own note that `src/` — unlike `tools/` — is bundled).

## Explicit out of scope

- Nereth (D6) — S50 already measured it close (78 of 80) and named what a
  further push would need (a conch-press verb, a dodge verb); neither is
  this session's job unless Rootmaw's diagnosis turns out to need the SAME
  missing verb, in which case name that overlap rather than building it
  twice.
- D3/D4 routing (needs the Coastwise Chain first, see `docs/NEXT-SESSION.md`
  S49's closing note) or D5 routing (blocked on Rootmaw either way) — not
  this session's job even if Rootmaw gets fixed; routing is its own,
  separate, much larger task.
- Any change to `rootmawTide`'s own design (the continuously-open-at-LOW
  mechanic is presumably intentional — it is not named anywhere as a bug).
  This session's job is the ACTOR's response to it, not the boss's design.

## Habits worth carrying in

- **Read the boss's own code before hypothesising from the distance
  numbers alone.** S45's framing ("growing-distance retreat pattern") is a
  real clue but not the mechanism — this prompt already found one
  structural difference (continuous vs. periodic `weakOpen`) just from
  reading `rootmawTide`, before running anything. Read further before
  assuming that's the whole story.
- **A boss fight losing to the robot is not automatically a bug.** Every
  entry in this project's boss-fairness history says so explicitly. Land a
  measurement and a judgement even if the judgement is "not fixable this
  session, here is why."
- **`dBoss` is shared by all six boss fights `check-playthrough.mjs`
  depends on.** Any change to it needs the full six-boss re-measurement,
  not just the one dungeon that motivated the change — S49 found this out
  the expensive way so a third session does not have to.
