# Next session — item-reuse has no reachable task; needs a human call

## Read first
- `docs/prompts/LEDGER.md`, "Known and deliberately unfixed", the entry
  starting "Rotation item 7 (item-reuse) has no task left that fits
  inside its own file allowlist" — the full per-item picture, checked
  directly this session, not inherited from an old note.
- `docs/prompts/STATE.md`'s rotation table, item 7's wording.
- Do NOT re-read S90-S98 in `docs/NEXT-SESSION.md` individually — the
  LEDGER entry above already consolidates what each one found. Re-reading
  them one at a time is exactly the repeated-rediscovery this entry exists
  to prevent.

## Why this, now
Reefseed's overworld half closed this session (S102: 3 of 3). Scoping the
next task — a second dungeon Reefseed room — found `check-reefseed.mjs`
would reject it outright: it can only ever be required in D6, and that
slot is already spent. Checking the other three items the same way before
drafting anything found each is ALSO either met at its true ceiling
(Bellows' dungeon half) or blocked by an unconditional assertion in its
own checker (Anchor's dungeon half and overworld half; Lens's dungeon AND
overworld half, both by one filter) or by an engine question the tiles
alone can't answer (Bellows' overworld half, `solidAt`'s treatment of
`F.PIT`). Every remaining path needs a change outside `src/data/*` — the
file allowlist a plain data session is scoped to. This is not a shortfall
to grind on; it is the actual ceiling.

## The task
There is no `src/data/*`-only task left under item-reuse. Do not attempt
another placement to test this again — four items, both halves each,
were all checked directly this session and the LEDGER entry names the
exact line in each tool that blocks it. Instead:

1. Confirm nothing has changed: run `node tools/check-drift.mjs` and
   confirm it still reads `anchor`/`lens` overworld screens 0, `bellows`
   overworld screens 0, `reefseed` dungeons 1. If any of those numbers
   moved, someone else's work landed — read what changed before doing
   anything else.
2. If a human has NOT given new direction: stop here. Do not touch
   `tools/` or `src/game/*` or `src/world/*` on your own judgement —
   every prior session that found this wall declined to cross it without
   that direction, and this session's LEDGER entry says why explicitly:
   "This is the charter's own judgement call, not a session's to make."
   Say so in your first message and end the session without touching
   game files.
3. If a human HAS given direction (e.g. "widen the allowlist, fix
   `check-anchor.mjs`'s swim model" or "accept item 7 as done given its
   real ceiling"), follow that instruction instead of this file — it
   supersedes this prompt.

## Done means
- `check-drift.mjs`'s numbers confirmed unchanged from this session's
  own final run (see `docs/prompts/STATE.md`'s S102 row).
- No `src/` file touched if no new human direction exists.
- `docs/prompts/STATE.md` gets a new session-log row either way, even if
  the row says "confirmed nothing new to do, waiting on a decision."

## Out of scope
- Any `tools/` or `src/game/*` or `src/world/*` edit without explicit new
  human direction — this is the one thing every prior session on this
  objective (S91, S92, S94's detour, S96, S97) declined to do alone, for
  the same reason each time.
- A fifth attempt at an Anchor or Lens overworld/dungeon placement, or a
  third Reefseed dungeon room — all three are proven blocked by reading
  the checker's own filter, not by trying and failing again.
- Advancing `OBJECTIVE OF RECORD` to rotation item 8 on your own — only a
  met done-condition or a human decision moves the rotation, and item 7's
  is not met.
