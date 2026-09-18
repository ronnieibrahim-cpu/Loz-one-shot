# Next session — item 7 needs one human call to continue

## Read first
- `docs/prompts/STATE.md` — item 7 and its LENS AMENDMENT, and the file
  allowlist, which now names three `tools/` files widened for the Lens alone.
- `docs/prompts/LEDGER.md`, "Known and deliberately unfixed", the entry
  beginning "Rotation item 7 (item-reuse) has no task left" — the Anchor,
  Bellows and Reefseed paragraphs, and the S104 paragraph at the end that
  records how the Lens's was settled.
- `docs/NEXT-SESSION.md`, the S105 entry only.
- `tools/check-lens.mjs`'s header, "THE MODEL, and where its edges are" — the
  worked example of answering a checker's refusal instead of deleting it.

## Why this, now
The Lens is finished: two forks outside D2 (`d6 1,5,4`, `d5 0,6,4`), its
overworld half void by design. That leaves the Anchor, the Bellows and the
Reefseed, and each is blocked in a different place that is outside a data
session's reach. The Lens was unblocked by a human widening the allowlist for
one item; the same call has not been made for any of the other three, and four
prior sessions each declined to make it alone.

## The task
1. Run `node tools/check-drift.mjs` and confirm it still reads
   `lens ... dungeons: 2 of 5`, `anchor ... 1 of 5 / 0`, `bellows ... 2 of 5 /
   0`, `reefseed ... 1 of 5 / 3`. If any moved, read what landed first.
2. If a human has named ONE of the three below, do that one, and do it the way
   the Lens was done: answer the checker's stated reason with a real model,
   never by deleting the assertion, and land a room that proves it.
   - **Reefseed** — `check-reefseed.mjs`'s `early` filter rejects a
     `reefseedRoom` in any dungeon below 5, so D6 is its only legal slot and
     it is spent. Needs the filter re-derived, or the rotation's bar for this
     item amended the way the Lens's was.
   - **Anchor** — `check-anchor.mjs`'s `late` filter is a hard `['d1','d2']`
     whitelist; its own header says opening D3+ needs the swim/no-swim model
     relaxed first, which is now exactly what `check-lens.mjs` does and can be
     copied from.
   - **Bellows** — the overworld half needs an outdoor tile impassable in
     every mode at every sea while not `F.SOLID`, AND a decision about whether
     the cone's `solidAt` line of sight should treat `F.PIT` as blocking. The
     second half is engine code and is a mechanic question, not a tool one.
3. If no human has named one: change nothing, say so in one paragraph, and
   end. Do not pick for yourself — the rotation's own judgement-call rule.

## Done means
- The named item's checker passes with a real room declared in a real dungeon,
  and every other item's checker still passes untouched.
- `node tools/validate.mjs`, `node tools/walk-dungeons.mjs`,
  `node tools/check-dungeon-strands.mjs`, `node tools/check-placement.mjs`,
  `node tools/check-ground.mjs`, `node tools/check-text.mjs`,
  `node tools/test.mjs`, `node tools/check-drift.mjs`,
  `node tools/check-playthrough.mjs`.
- `npm run build`, with `dist/oracle-of-tides.html` committed.
- A person looks at a shot of the new room and can see what it is asking.

## Out of scope
- Picking one of the three yourself, or widening the allowlist on your own
  judgement. S104's widening was granted for the Lens and is spent.
- Touching the other two items' checkers while working the named one. Each of
  the three is a separate call and a separate session.
- Any Lens work. It is done, and its two forks are proved; re-opening them to
  "improve" a room is not this objective.
- The `--lens` screenshot gap logged under S104 in `docs/NEXT-SESSION.md`.
  Real, and it needs a detour token.
- `check-hearts.mjs`, red on `main` since before S104 and unrelated.
