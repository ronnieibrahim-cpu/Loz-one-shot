# Next session — give the Squall Bellows a room in D5 or D6

## Read first
- `docs/prompts/STATE.md` — DETOUR TOKENS is 0. This session must be
  `objective`, and so must the one after it, before a token regenerates.
- `docs/prompts/LEDGER.md`, "Known and deliberately unfixed", the S92 entry
  on `check-lens.mjs`/`check-bellows.mjs`/`check-reefseed.mjs` — it is why
  Bellows and not Lens or Reefseed is this session's target.
- `docs/NEXT-SESSION.md` S92 for the full comparison if the LEDGER summary
  needs more detail.

## Why this, now
S92 found the Lens task blocked by an unconditional `mapId !== 'd2'`
assertion inside `check-lens.mjs` itself (a scope decision, not a bug —
fixing it needs a tool change no detour token exists to cover). While
comparing the four gate checkers it also found `check-bellows.mjs` has NO
such block: its own filter is `r.index < HOME.dungeon.index` (blocks only
dungeons BEFORE D4), so a `bellowsRoom` declared in D5 (`dungeons-b.js`,
`id: 'd5'`, index 5) or D6 (`id: 'd6'`, index 6) is legal by the tool's own
rules today. Bellows is 0 of 5 dungeons and 0 overworld screens reused
(`check-drift.mjs`), and reaching D5 **and** D6 both is exactly the
rotation's ">=2 later dungeons" bar — the ceiling and the target are the
same number, so this is the one item-reuse task that closes in one clean
move with zero tool changes needed.

## The task
Read `docs/ITEMS.md`'s Squall Bellows section and `tools/check-bellows.mjs`'s
own file header (it documents exactly what a `bellowsRoom` declaration must
prove: the wheel is drowned at the room's sea, no hand reaches it, the cone
alone frees it, and the door it opens actually separates the room). Find or
build ONE room in D5 (`src/data/dungeons-b.js`, `id: 'd5'`) or D6 (`id: 'd6'`)
where turning a drowned gust wheel with the cone is the answer, the same way
S90 gave the Anchor a second home in D2's Bone Cell. Remember the model's own
edges from the header: the player of dungeon four onward owns the Cleats, so
deep water is floor in two different ways — the wheel has to sit somewhere a
swimmer still can't reach by hand, not just a walker. Prove it with
`node tools/check-bellows.mjs`.

If D5 and D6 both take a room this session, even better — that alone clears
the ">=2 dungeons" bar for Bellows in one session. If only one fits cleanly,
land that one and leave the other as next session's task; do not force a
second room in in a hurry to hit the number.

## Done means
- `node tools/check-bellows.mjs` passes with at least one new room in D5 or
  D6 declaring a `bellowsRoom`.
- `node tools/check-drift.mjs` reads `bellows dungeons: 1 of 5` (or `2 of
  5` if both landed), up from 0.
- Full regression: `walk-dungeons.mjs`, `check-dungeon-strands.mjs`,
  `check-progression.mjs`, `check-placement.mjs`, `check-ground.mjs`,
  `check-playthrough.mjs`, `npm run build` with `dist/` committed.
- `docs/prompts/STATE.md` logs this session as `objective` (the second
  consecutive one — DETOUR TOKENS should read 1 after this, per its own
  regen rule).

## Out of scope
- The Lens or the overworld Anchor gate — both need a tool change (see
  Read first) that no detour token exists to cover this session.
- The Reefseed — `check-reefseed.mjs`'s own index filter caps it at 1
  eligible dungeon (D6 only), one short of the ">=2" bar, so a second
  Reefseed room cannot close this rotation item without a tool change
  either. Worth a future detour, not this session.
- Any change to `tools/` — no detour token exists this session.
- Do not force a second Bellows room if only one fits without contorting
  the room's design; one clean room this session is still real progress.
