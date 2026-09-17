# Next session — give the Anchor its second reuse dungeon

## Read first
- `docs/prompts/STATE.md` — DETOUR TOKENS is 0. This session must be
  `objective`, the second in a row, for a token to regenerate.
- `docs/prompts/LEDGER.md`, the Reefseed and Lens entries (end of "Known
  and deliberately unfixed") — both items are now at a PERMANENT ceiling
  under their checkers' current filters. The Anchor is not: it already
  has a second dungeon's worth of room to grow before it needs a filter
  changed.
- `src/data/dungeons-a.js`, D1's `anchorGate`/`anchorGauges` rooms (lines
  ~444-740) and D2's single `anchorGate` (~line 955) as the two worked
  examples.

## Why this, now
`check-drift.mjs` reads `anchor dungeons: 1 of 5` (D2, landed before this
rotation started). The rotation's own bar is `>=2 later dungeons`, and
`tools/check-anchor.mjs`'s own `late` filter — `r.mapId !== 'overworld'
&& !['d1', 'd2'].includes(r.mapId)` — already treats D3, D4, D5 and D6 as
legal anchor-gate dungeons; nothing in that filter needs fixing first,
unlike the Reefseed and Lens. This session is the direct sequel to S93/S94
(Bellows: D4 home, D5 then D6 built to close its own dungeon-side bar) and
S96 (Reefseed: found its dungeon-side ceiling is 1, permanently, because
its home dungeon eats the only slot `index < 5` allows) — the Anchor has
no such ceiling; D2 was one pick among four legal dungeons, not the only
one.

**Do not touch `tools/`.** Every remaining overworld half (Anchor's own,
the Lens', the Bellows') needs a real tool or tile change per LEDGER — out
of scope for an `objective` session with 0 detour tokens.

## The task
Read `docs/ITEMS.md`'s Anchor section and `tools/check-anchor.mjs`'s own
file header in full before writing any room. Read D1's two `anchorGate`
rooms and two `anchorGauges` rooms as the worked examples of both
fixture shapes the item supports (a plain in/out gate, and a two-gauge
puzzle). Pick ONE of D3 (`src/data/dungeons-a.js`, `id: 'd3'`), D4
(`id: 'd4'`), D5 or D6 (`src/data/dungeons-b.js`) and find or build ONE
room there where the Anchor is the answer — same approach S96 used for
the Reefseed: survey the target dungeon's existing plain rooms first
(`docs/DUNGEON-STATUS.md` has each one's own section) for a spot with no
existing lock/puzzle/reward to disturb, before reaching for a brand-new
room. If a new room is genuinely needed, `game.js`'s `checkRoomExit`
resolves neighbours purely by grid coordinate (`hasRoom`), so a dead-end
off an existing room needs only one new door opened in that room's own
wall plus the new room itself — S96's `docs/NEXT-SESSION.md` entry has
the worked mechanics.

Budget real iteration time: `check-anchor.mjs` proves the gate/gauge holds
at every relevant tide with a live conch. Run it after every change.

## Done means
- `node tools/check-anchor.mjs` passes with a new `anchorGate` or
  `anchorGauges` room in the chosen dungeon.
- `node tools/check-drift.mjs` reads `anchor dungeons: 2 of 5`, up from 1
  — the rotation's own bar for this item, closing its dungeon half.
- Full regression: `walk-dungeons.mjs`, `check-dungeon-strands.mjs`,
  `check-progression.mjs`, `check-placement.mjs`, `check-ground.mjs`,
  `check-playthrough.mjs`, `test.mjs`, `npm run build`.
- `docs/prompts/STATE.md` logs this session as `objective` — the second
  in a row, which regenerates the detour token per its own rule.

## Out of scope
- The Anchor's, the Lens' and the Bellows' overworld halves, and pushing
  the Reefseed past its dungeon-side ceiling of 1 — all four need a real
  tool or tile change no detour token exists to cover this session (see
  LEDGER's "Known and deliberately unfixed").
- Any change to `tools/` or to a shared tile/legend file outside the
  chosen dungeon's own `dungeonX` legend override — data in the target
  dungeon's room file only, same boundary S96 kept.
- Trying more than one dungeon this session — one new anchor room closes
  the bar; a second is not needed and not this session's job.
