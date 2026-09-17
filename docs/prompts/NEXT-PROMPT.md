# Next session — decide item-reuse's overworld Anchor path forward

## Read first
- `docs/prompts/STATE.md` — DETOUR TOKENS is 0 (spent S91). This session
  must be `objective`, and the one after it too, before another detour.
- `docs/prompts/LEDGER.md`, "Known and deliberately unfixed", the entry
  starting "What is NOT fixed... no overworld `anchorGate` can actually
  be built" — the full mechanism and why it blocks the overworld half of
  item-reuse's Anchor task specifically.
- `docs/NEXT-SESSION.md` S91 — the empirical test (Kell Spur) that proved
  it, if the LEDGER summary needs more detail.

## Why this, now
S91 fixed `check-anchor.mjs`'s whitelist bug but found the overworld half
of the Anchor task is blocked by something a single detour token can't
reach: `check-strands.mjs`/`check-overworld.mjs`'s hop model never treats
`drownWall` (the only outdoor tile unwalkable at every tide level) as
crossable, so any placement that gives `check-anchor.mjs` a real gate
reads as a stranded region and fails outright. This is not a data
question `dungeons-a.js`/`overworld.js` can answer — DETOUR TOKENS is 0
regardless, so the fastest path is to work the Lens instead: Cleats and
Dredge Line already partly pass (5/5, 3/5), and the Lens is still
untouched (`dungeons: 0 of 5`, `overworld screens: 0`).

## The task
Read `docs/ITEMS.md`'s Brineglass Lens section (search "Lens") for its
three verbs, then find or build ONE dungeon room outside its home (D2)
where the Lens's own verb — pinning the tide so a branch stays the same
tile rather than switching — is the answer, the same way S90 gave the
Anchor a second home in D2's Bone Cell. Use `tools/check-lens.mjs` as the
proof tool (see CLAUDE.md's verification table for what it asserts) the
way S90 used `check-anchor.mjs`. Do NOT touch `tools/` this session —
DETOUR TOKENS is 0, so if `check-lens.mjs` has the same kind of gap
`check-anchor.mjs` had, write it up and stop; do not spend a token that
does not exist.

## Done means
- `node tools/check-lens.mjs` passes with the Lens required in a second
  dungeon (or the session ends with a written-up, unchased finding if the
  tool itself blocks it — same shape as S91).
- `node tools/check-drift.mjs` reads `lens dungeons: 1 of 5` (or more),
  up from 0, OR a clear LEDGER/NEXT-SESSION entry says why not.
- Full regression: `walk-dungeons.mjs`, `check-dungeon-strands.mjs`,
  `check-progression.mjs`, `check-playthrough.mjs`, `npm run build`.
- `docs/prompts/STATE.md` logs this session as `objective`.

## Out of scope
- The overworld Anchor gate — genuinely blocked until a future session
  can spend a detour token inside `tools/` on `check-strands.mjs`/
  `check-overworld.mjs`'s hop model, or on a baseline-recording mechanism
  for `check-strands.mjs`. Do not retry the drownWall trick; S91 already
  proved it fails.
- The Bellows or Reefseed. One item at a time.
- Any change to `tools/` — no detour token exists this session.
