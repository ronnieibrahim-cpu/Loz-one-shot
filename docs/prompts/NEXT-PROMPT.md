# Next session (S161) — build the Sunken Palace

## Read first
- CLAUDE.md, all of it (S160 added `check-kiln.mjs`, `check-coin.mjs` and
  `shoot-dungeon.mjs` to the table).
- `docs/NEXT-SESSION.md`, the S160 entry: how an optional dungeon declares
  itself and what the two finished ones taught.
- `docs/DUNGEON-STATUS.md`, "The optional dungeons (S159 plan)".
- `src/data/dungeons-optional.js`: the Lower Vault and the Gullwind Eyrie are
  the worked examples to copy.

## State
- Branch `claude/oracle-tides-optional-dungeons-c5eytd` (S160), NOT merged to
  main, BY THE HUMAN'S CHOICE: merge only once the Palace is done. Continue ON
  THAT BRANCH, and at the end ask the human before moving main.
- Two of three optional dungeons DONE: the Lower Vault (`vault`, 49529d1) and
  the Gullwind Eyrie (`eyrie`, 640b2f1). 26 heart pieces, cap 15; check-hearts
  counts the Palace's two as planned.
- Whole table green (47 tools) on 640b2f1; check-playthrough 44/44, THE END,
  never died. `test.mjs` passed in S160 (its fps check is sometimes red in the
  sandbox: stash and re-run before believing it).

## The task
Build THE SUNKEN PALACE, the approved plan's third dungeon, in one commit,
whole table green, then show the human pictures (Seasons' Unicorn's Cave
beside it: `docs/NEXT-SESSION.md` S160 says how the cartridge rooms render).
- 16-18 rooms on TWO floors, map id `palace` (OPTIONAL_PIECES in
  check-hearts already expects it, with 2 pieces), under the Palace Porch
  (`cave4`, Palace Mouth 0,15,1; its notice "The rest of it is under").
- ART FROM BOTH CARTRIDGES (the human, end of S160: "Can use Ages for
  inspiration also. Not just Seasons. 2 games worth of assets."). Ages is
  built on water — Jabu-Jabu's Belly, Mermaid's Cave, the Ancient Tomb — and
  its sea has real whirlpools, so look there FIRST for the Palace's kit and
  its whirlpool tile. The Ages disassembly (same commit 7584d87) has the same
  file layout as Seasons (tileset_layouts/ages/, gfx_compressible/ages/,
  data/ages/tilesets.s, rooms/ages/large/); S159's rip-bosses.py already reads
  both cartridges, and rip-objects.py's `Tileset` needs only an Ages source
  directory. Offer the human an Ages kit beside the ready Seasons one before
  building on either.
- Kit already extracted as a fallback: `dungeonPalace` legend (Unicorn's Cave,
  S160: ring, doors, `(C)` exit, pot, statue, block, button).
- Theme: WHIRLPOOLS, "the sea's height decides which floor you're on". A NEW
  whirlpool tile (the human approved it): extract it — Ages' sea whirlpool
  or Seasons' (TILEINDEX_WHIRLPOOL $e9 in an overworld tileset); fetch the
  files into assets/ as S160 did, and credit them. Teach the dungeon flood
  (tools/lib/dungeon-flood.mjs) the whirlpool in the SAME commit, and write the
  dungeon's own prover FIRST (check-kiln / check-coin are the pattern).
- Opens after D5. Suggested gate: a keyhole in cave4 keyed on `keyD6` (the
  Bell's Clapper the Maku Tree gives at five Essences), with its own
  `openFlag`; check-progression already reads a keyhole in a host cave and
  asserts the seal holds without its key. Declare `opensAt: 5`.
- Boss: `thalassor` — a REAL boss (isBoss), on the boss rung already; its
  pull reads `g.tide.level`. Add it to check-bosses' FIGHTS. It must NOT spawn
  a Heart Container (check-hearts: optional bosses pay pieces).
- Prizes: two Pieces of Heart inside (-> 28, cap 16) and the new charm
  "Coilbone", slot `any`: "a moment's safety each time the tide changes" —
  an invulnerability window on every tide change, its length a `guessed`
  constant in feel.js; read in the engine, proved in check-charms, given by a
  chest (`chest.charm`), added to docs/ITEMS or the charm docs as they list.
- `check-side`: the prizes can be won, and are refused without the thing they
  need. Update docs/GUIDE.md (pieces 27, 28; counts), and REGENERATE the
  illustrated guide's heart list for all three optional dungeons
  (docs/guide: tools/guide/*; S160 did not, to do it once).

## Done means
- Whole table green; check-playthrough 44/44 or more, THE END, never died.
- Pictures of the Palace shown to the human.
- `npm run build`, dist/ committed, NEXT-SESSION.md and this file updated,
  pushed; ask the human before moving main.

## Out of scope
- Enemy damage and health (S150). A camera that frames bosses (S153).
- The pixel-art intro cutscene (tabled by the human).
