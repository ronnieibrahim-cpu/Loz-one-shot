# Next session — put a frame-stepped number in feel.js

## Read first
- `docs/prompts/STATE.md` — objective 8, the warning above the rotation, and
  the file allowlist.
- `docs/NEXT-SESSION.md`, the S110 entry only.
- `docs/FEEL-SPEC.md`, the provenance table and the paragraph under it — what
  each of the three words is allowed to mean.
- `tools/check-feel.mjs`'s header — what a `measured` tag has to name before
  the tool will accept it.
- `docs/prompts/LEDGER.md`, "Measured and rejected", the first three entries —
  objective 7 is closed and nothing in it is to be reopened.

## Why this, now
Objective 7 closed at S110 and the rotation advances to 8. Of 249 constants in
`feel.js`, 0 are `measured`, 18 are `derived` and 231 are `guessed`. The
done-condition is 40 `measured`. `check-feel.mjs` already refuses a `measured`
tag that does not name what was frame-stepped, so the tag cannot be inflated
by accident — only on purpose, and that would destroy the file permanently.

## The task
FIRST, put one question to the human and wait: **is a frame-stepped reference
capture of Oracle of Seasons or Ages available to this session, and if so how
is it reached?** Objective 8 cannot be started without one, and no substitute
counts — an emulator is the whole of what `measured` means.

If the answer is no, that is the answer: change no tag, say so in one line,
and ask whether the rotation should move to 1 (wide-rooms, 3 of 6 dungeons
have a 2x2 or 3x1, done at 4).

If the answer is yes: measure Link's walk first — `WALK_SPEED` in
`src/data/feel.js` — because the largest block of `guessed` constants in the
file are speeds and reaches stated in its units, and one real number at the
root moves more than forty careful ones at the leaves. Retag only what was
actually stepped, and write into each comment what was stepped and how.

## Done means
- `node tools/check-feel.mjs` — every retagged constant names its reference.
- `node tools/check-drift.mjs` reads a non-zero `measured` count, or the table
  is unchanged and the session's one line says why.
- `node tools/replay.mjs`, `node tools/check-playthrough.mjs`,
  `node tools/test.mjs`, `node tools/check-anchor.mjs`,
  `node tools/check-gates.mjs`, `node tools/check-motion.mjs`,
  `node tools/check-camera.mjs`.
- `npm run build`, with `dist/oracle-of-tides.html` committed.
- A person reads the retagged comments and can repeat the measurement from
  what is written there alone.

## Out of scope
- Changing a constant's VALUE. This objective is about where the numbers came
  from, not what they are. A value change re-records every replay baseline —
  see the trap in CLAUDE.md about a five-line change to the movement path.
- Relabelling a `guessed` as `measured` without an emulator, or a `derived` as
  `measured` because its ancestor is now measured. A derived value stays
  derived.
- A fourth anchor, Bellows, Lens or Reefseed fixture. Objective 7 is closed
  and the LEDGER says so.
- `check-hearts`' two standing failures (23 heart pieces; D5 holds 1, not 2),
  and the outdoor wheels all paying the same gold rupee. Both predate this
  objective and need a detour token.
- The charm economy: S110 doubled the world's scrimshander blanks from 3 to 6.
  Noted in `docs/NEXT-SESSION.md`, not this session's job.
