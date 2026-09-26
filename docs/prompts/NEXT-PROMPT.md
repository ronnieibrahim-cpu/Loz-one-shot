# Next session (S158) — build the 42 new countryside screens

## Read first
- CLAUDE.md, all of it (note the trap "The overworld is 17 screens across").
- `docs/NEXT-SESSION.md`, the S157 entry (the human's decisions are there).

## The human's decisions (S157)
- Towns: Tidewatch is Horon's size (5x2), Sandpiper Row 3 screens — done.
- New countryside screens are QUIET EXTENSIONS of their region: continue it,
  paths lined up with both neighbours, a few enemies, Seasons' own tiles.
  Secrets can come later.
- Horon's own trees in the towns only; the countryside keeps its oaks.
- Trading chain: leave as is.
- Main: only moved with the human's explicit go-ahead. aa8bd8d is live; the
  widening (fba32ea and after) is not, because of the placeholders.

## The task
One commit per region row; the whole checker table before each commit.
1. Replace the 42 `placeholder: true` screens in src/data/overworld.js:
   columns 6-8 rows 0-6 and 9, columns 13-14 rows 0-7 and 9. Compose each
   row's new cells as one canvas (the way S157's town.py did Tidewatch):
   left edge = the west neighbour's column 9, right edge = the east
   neighbour's column 0, tide digits carried exactly, trees as 2x2 blocks
   that never straddle a seam, both sides of every seam agreeing.
   Keep north-south links between new cells closed unless check-progression
   and check-overworld prove no gate is bypassed.
2. After each row: check-overworld, check-strands, check-ground,
   check-placement, check-progression, validate. Show the human the row
   (shoot-region) beside its neighbours.
3. Sandpiper Row: revisit once its neighbours are real (it is a thin street).
4. Re-run check-playthrough (travel budgets on the wider map); keep 43/43,
   to THE END, never died. Then ask the human to move main.
5. Ask: boss art for Thalassor, Gustharpy, Saltwraith (and whether to place
   them); approval to merge claude/oracle-tides-guide-hb01hp (its town
   pages describe the old four-screen village).

## Done means
- Every checker in CLAUDE.md's table green, check-playthrough 43/43.
- `npm run build`, dist/ committed, NEXT-SESSION.md and this file updated,
  pushed to the session branch; main only with the human's go-ahead.

## Out of scope
- Enemy damage and health (S150). A camera that frames bosses (S153).
