# Next session — ask what replaces the exhausted rotation

## Read first
- `docs/prompts/STATE.md` — the whole file. It is short and it is the point.
- `docs/NEXT-SESSION.md`, the S111 entry only.
- `docs/prompts/LEDGER.md`, "Measured and rejected", the first three entries.
- `docs/FEEL-SPEC.md`, the provenance table — what `measured` is allowed to
  mean, if the answer to the question below turns out to be yes after all.
- `tools/check-hearts.mjs`'s header, only if the human picks the hearts.

## Why this, now
Objective 1 met at S111 was the last item the rotation could reach. Seven of
its eight are met and the eighth needs an emulator capture the human said at
S111 does not exist. There is no next item. A session that opens this prompt
and starts guessing at work is the failure mode the charter exists to stop.

## The task
Put ONE question to the human and wait: **the rotation is exhausted — what
replaces it?** Offer the two standing defects by name, because they are the
only candidates the repo already argues for:

  1. `tools/playthrough-route.mjs` stops at `d2/1,3,1`. Nothing has played
     this game past dungeon 2, and `check-playthrough.mjs` is the only tool
     that proves the game is finishable. Driving the route through D3 is the
     single largest open claim in the repo.
  2. `check-hearts` has 2 failures: 23 heart pieces where the tool wants a
     multiple of four, and D5 holds 1 heart piece where the design says 2.

Change nothing until they answer. Whatever they choose, rewrite
`docs/prompts/STATE.md`'s OBJECTIVE OF RECORD and its file allowlist to match
before doing any of it, and log the session against the new objective.

## Done means
- `docs/prompts/STATE.md` names an objective the human chose, with an
  allowlist that fits it and a done-condition a tool can check.
- `node tools/check-drift.mjs` — self-checks green.
- If any game file changed: the checkers CLAUDE.md's table names for what was
  touched, plus `node tools/check-playthrough.mjs`, `node tools/replay.mjs`,
  `node tools/test.mjs`, and `npm run build` with `dist/` committed.
- A person reads STATE.md and knows what the next five sessions are for.

## Out of scope
- Picking the next objective yourself. The charter reserves that call, and an
  exhausted rotation is exactly the case it was reserved for.
- Re-opening objective 8 without an emulator capture in hand, or relabelling
  a `guessed` constant to make the count move.
- A fifth wide room, or a fourth fixture for any of the six dungeon items.
  Objectives 1 and 7 are both closed and the LEDGER says so.
- Starting the hearts fix and the playthrough route in the same session.
  Either one is a session; both is a mess.
