# Next session — a second Lens fork, in D3, D4 or D5

## Read first
- `docs/prompts/STATE.md` — the rotation's item 7, including the LENS
  AMENDMENT, and the file allowlist, which now names three `tools/` files.
- `docs/prompts/LEDGER.md`, "Known and deliberately unfixed", the entry
  beginning "Rotation item 7 (item-reuse) has no task left" — read the S104
  paragraph at its end FIRST; the four paragraphs above it describe the
  Anchor, Bellows and Reefseed, which are still blocked and not yours.
- `docs/NEXT-SESSION.md`, the S104 entry only.
- `tools/check-lens.mjs`'s header block, "THE DECLARATION" and "WHAT IS
  PROVED" — the six claims a fork has to satisfy.
- `src/data/dungeons-b.js`, the room keyed `1,5,4` (The Two Arches) — the
  worked example, and the only fork outside D2.

## Why this, now
The Lens is at 1 of 5 dungeons. Its overworld half is void by design, so one
more fork in a dungeon other than D2 and D6 finishes rotation item 7's Lens
half outright. The prover already accepts a fork in any dungeon from D2 on and
already floods with the capabilities the player holds there, so this is room
authoring, not tool work. The Anchor, Bellows and Reefseed remain blocked and
each needs a separate human decision — do not touch their checkers.

## The task
Author ONE Lens fork room in D3 (Bogwater Sanctum), D4 (Tidewright Cistern) or
D5 (Drowned Wood Shrine), in `src/data/dungeons-a.js` or
`src/data/dungeons-b.js`, and declare its `lensRoom`.

The Two Arches works because the Abyssal Keep owns `7`/`dLintel`
(`['dWallAbyss', 'dWallAbyss', 'dWaterD']`) — masonry that stands until the
flood covers it — so at MID a real arch and a plain wall draw the SAME tile,
and one tide up one of them is water a Cleat-wearing player swims. The other
dungeons have no lintel. Two ways to get the same shape there, in this order:

1. Find a pair already in that dungeon's vocabulary that resolves to one tile
   at the pinned level and two at the revealed one. `src/data/legends.js`'s
   dungeon digit list and `src/data/tiles-core.js`'s `tide:` chains are the
   whole search space; it is small enough to read.
2. Failing that, add a region-palette lintel for that theme in
   `src/data/tiles-core.js` — its own wall, its own floor, the same tide
   shape. That is a palette variant and is on the allowlist. Do not invent a
   new tide shape, a new flag, or a new mechanic.

Pin the tide with `tideForce`, put every `valve` INSIDE the chambers past the
one-way ledges so the water cannot be moved before committing, and give every
losing branch a stair out.

## Done means
- `node tools/check-lens.mjs` — the new room passes all eleven of its claims,
  and D2's two forks and The Two Arches still pass theirs.
- `node tools/validate.mjs`, `node tools/walk-dungeons.mjs`,
  `node tools/check-dungeon-strands.mjs`, `node tools/check-placement.mjs`,
  `node tools/check-ground.mjs`, `node tools/check-camera.mjs`,
  `node tools/check-text.mjs`, `node tools/test.mjs`,
  `node tools/check-drift.mjs`, `node tools/check-playthrough.mjs`.
- `node tools/check-drift.mjs` reads `lens ... dungeons: 2 of 5`.
- `npm run build`, with `dist/oracle-of-tides.html` committed.
- A person looks at `node tools/shoot-rooms.mjs --tide=<pin> <spec>` and
  cannot tell the two branches apart in the shot. If they can, the room is a
  memory test, not a Lens room.

## Out of scope
- `tools/check-anchor.mjs`, `tools/check-bellows.mjs`,
  `tools/check-reefseed.mjs` — each is blocked for its own reason and each
  needs its own human call. S104's widening was for the Lens alone.
- A Lens fork on an overworld screen. `docs/ITEMS.md`: the Lens is never a
  gate at region scope, and `check-lens.mjs` now enforces exactly that.
- Weakening any of `check-lens.mjs`'s six claims to make a room fit. The
  claim that every branch draws the same tile where the player decides is the
  one that will look negotiable, and it is the whole item.
- The `--lens` screenshot gap logged in `docs/NEXT-SESSION.md` under S104 —
  real, worth a session, and not this one. It needs a detour token.
- `check-hearts.mjs`, red on `main` before S104 and unrelated to the Lens.
