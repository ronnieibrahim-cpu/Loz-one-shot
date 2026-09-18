# Next session — build the Reefseed's optional early room

## Read first
- `docs/prompts/STATE.md` — item 7 and the file allowlist.
- `docs/NEXT-SESSION.md`, the S107 entry only.
- `tools/check-reefseed.mjs`'s header, "WHAT IS PROVED, per room declaring" —
  all ten clauses, and clause 6 twice.
- `tools/check-reefseed.mjs`'s "WHERE A REEFSEED ROOM MAY STAND" block — the
  two clauses your new room has to satisfy on top of the ten.
- `src/data/dungeons-b.js`, `d5 0,4,2` The Shrine Ford — the worked fixture:
  two stakes, two seas, a drowned bole between them.

## Why this, now
The Reefseed's "ceiling" of one dungeon turned out to be the filter, not the
game (S107). The filter now permits a room below D5 if it declares
`optional: true` and is not standing in front of anything the dungeon needs.
Nothing has used that yet, so `check-drift` still reads `reefseed ... dungeons:
1 of 5`. One optional early room takes it to 2 and finishes the Reefseed's
share of item 7. The Dredge Line already has this exact shape in D1, D2 and D3,
so there is precedent to copy rather than a pattern to invent.

## The task
Author ONE optional `reefseedRoom` in D1, D2, D3 or D4, in
`src/data/dungeons-a.js`, declaring `optional: true` and giving only rupees, a
heart piece is NOT allowed (`check-hearts.mjs` counts them and is already red).

Two things the Shrine Ford gets for free that you will not:

- **A drowned bole to throw over.** `dSnag` is `dungeonWood`'s. Clause 6 — no
  other sea will do — is what the bole buys, and without something solid below
  HIGH in the seed's path, "stand on the bank and throw" answers the room at
  every sea and clause 6 fails. Check the chosen dungeon's legend first; if it
  has no tile with `dSnag`'s tide shape, add a region-palette one in
  `src/data/tiles-core.js` (its own wall or timber, the same tide shape) and
  give it a character in that theme's legend, the way `Y`/`dBole` was added for
  the Shrine in S105. Palette variant only — never a new tide shape or flag.
- **Somewhere the room cannot be reached from on the way through.** The room
  must be OFF the dungeon's critical path. Hang it off an existing room by a
  stair, the way `d6 1,5,4` and `d5 0,6,4` are hung, rather than opening a wall
  into the through-route.

## Done means
- `node tools/check-reefseed.mjs` — the new room passes all ten per-room
  clauses plus both placement clauses, and D5's and D6's rooms still pass.
- `node tools/check-drift.mjs` reads `reefseed ... dungeons: 2 of 5`.
- `node tools/validate.mjs`, `node tools/walk-dungeons.mjs`,
  `node tools/check-dungeon-strands.mjs`, `node tools/check-placement.mjs`,
  `node tools/check-ground.mjs`, `node tools/check-text.mjs`,
  `node tools/check-items.mjs`, `node tools/test.mjs`,
  `node tools/check-playthrough.mjs`.
- `npm run build`, with `dist/oracle-of-tides.html` committed.
- A person looks at `node tools/shoot-rooms.mjs` of the room at both of its
  seas and can see what it is asking for.

## Out of scope
- Weakening clause 6 to make a room fit. It is named in the tool's own header
  as the load-bearing one, and dropping it makes every Reefseed room answerable
  by standing on the bank.
- Putting the room on the dungeon's critical path, or letting it give a key, a
  boss key, an item or an essence. The filter now fails on that and it is the
  deadlock the old blanket ban existed to prevent.
- The Bellows. Its overworld half turns on whether the cone's line of sight
  should be stopped by `F.PIT`, which is a mechanic question and needs a human
  call. It is the last of the four still waiting on one.
- The Anchor. Proved at its ceiling in S106; the only avenue left redefines
  what "requires the Anchor" means and needs its own call.
- The `--lens` screenshot gap logged under S104. It needs a detour token.
