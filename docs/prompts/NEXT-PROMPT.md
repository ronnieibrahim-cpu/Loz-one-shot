# Next session — get the idle-art call, or say why not

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session, in
  particular "THE ONE JUDGEMENT CALL" at the bottom.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/ENEMIES.md`'s "Idle states" section — the full case for and
  against hand-drawing the remaining 8 idle poses, and the whole-sheet
  search (S57) that ruled out reusing existing art for any of them.

## Why this, now
Every other thread under objective #4 is now closed and verified: `hurt`
(S25, every hp>2 enemy), `death` (S41, every killable enemy),
`attack` (S58, the last unenumerated case — `stalfos` — confirmed
structurally blocked like the other 5), and `idle` (S57, `urchin` only,
whole-sheet search found nothing further). `check-drift.mjs` will keep
reporting well under 22 of 22 forever unless someone hand-draws new idle
art for `beamos`/`barnacle`/`wizzrobe`/`siren`/`keese`/`zol`/`tektite`/
`pincer` — a real undertaking (8 enemies, each needing the same
`docs/ART-DIRECTION.md` rules and in-engine verification `urchin`'s pilot
got), not something a session should default into per CLAUDE.md's
extraction-first rule. This is the "one judgement call" the charter
reserves for the person running these sessions, not for a session to
decide alone.

## The task
Before doing any more objective #4 work, get an explicit answer on the
idle-art question (or read the answer if it's already been given outside
this file). Two outcomes:
1. **Yes, hand-draw it** — pilot exactly ONE candidate (pick the closest
   analog to `urchin`'s own bar, argued in writing first) the same way
   `urchin` was piloted at S54: hand-drawn art meeting `docs/ART-
   DIRECTION.md`, wired through `spec.idleFrame`, verified in-engine with
   a scratch probe, full regression sweep.
2. **No, or not yet answered** — there is no further code work available
   under objective #4's current allowlist (every thread is closed; see
   above). Say so plainly in this session's final message rather than
   inventing busywork, and do not touch `OBJECTIVE OF RECORD` — only the
   person running these sessions advances the rotation.

## Done means
- Either a verified, landed idle pilot (checks as in outcome 1), or an
  honest, explicit statement that objective #4 has no further open work
  pending that answer — not a third re-scoping of the same 8 candidates.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines) either way.

## Out of scope
- Re-running the idle design-merit judgement (S55) or the whole-sheet art
  search (S57) a third time without a new stated reason.
- Re-opening `attack`/`hurt`/`death` for any enemy — all three threads are
  fully closed roster-wide (see "Why this, now").
- Advancing `OBJECTIVE OF RECORD` on a session's own initiative.
- Any hand-drawing done without the explicit go-ahead outcome 1 requires.
