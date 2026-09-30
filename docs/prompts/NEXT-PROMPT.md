# Next session (S160) — build the three optional dungeons

## Read first
- CLAUDE.md, all of it.
- `docs/NEXT-SESSION.md`, the S159 entry: the human APPROVED the plan below,
  and the boss art is already done.
- `docs/DUNGEON-STATUS.md`, section "The optional dungeons (S159 plan)".

## State
- Main is at 8bb1e34. Branch claude/oracle-tides-optional-content-sokhsn
  (off S158's claude/oracle-tides-countryside-y6ejle) holds S158 (new
  opening, get-item fix, town themes) and S159 (boss art, picture guide).
  NEITHER is on main: ask the human before moving it.
- check-playthrough 44/44, THE END, never died. `test.mjs` fails only its
  frame-rate check in the cloud sandbox (fps 18-25), and it failed the same
  way on the untouched base commit: that is the machine, not the game.
- Thalassor, Gustharpy and the Saltwraith have their art (S159) but no room.

## The task
Build the approved plan, in this order, one commit per dungeon, the whole
checker table green before each:
1. THE SALT PAN VAULT'S LOWER VAULT (small, about 6 Oracle-size rooms), under
   the existing Salt Pan Vault cave (`cave3`, Vault Approach 0,9,1): a stair
   down. Theme: the KILNSHELL, "fire the sea puts out" (carry and set down the
   flame through salt halls where the tide decides whether it survives; light
   braziers, burn drift-tangle). Saltwraith miniboss. Prize: a Piece of Heart.
2. THE GULLWIND EYRIE (small, about 6 rooms), a NEW cave mouth in the north
   cliff of Kell Corner (0,3,2; mock-up in S159: row 1 `#15##C#Gg#`). Theme:
   the FERRYMAN'S COIN, "the tide change is how you move" (throw it where you
   can't walk, sound the conch, swap). Gustharpy miniboss. Prize: a Piece of
   Heart.
3. THE SUNKEN PALACE (big, 16-18 rooms on two floors), under the Palace Porch
   cave (`cave4`, Palace Mouth 0,15,1). Theme: WHIRLPOOLS, "the sea's height
   decides which floor you're on" (a NEW tile; the human approved building it;
   add it to the dungeon flood in the same commit, CLAUDE.md trap). Opens after
   D5. Thalassor boss. Prizes: two Pieces of Heart inside, and a new charm,
   "Coilbone" (fits any case: a moment's safety each time the tide changes).
Hearts: 4 new pieces -> 28 -> cap 16 (inside the 14-16 window). Update
check-hearts' expectations and the guide's heart list (docs/guide) as each
lands. `check-side` must prove each prize can be won AND is refused without
its item. Each dungeon needs its own prover of its theme, written first (the
DUNGEON-STATUS checklist).

The three dungeons are OPTIONAL: none may gate the main route, and
check-progression/check-playthrough must not change what they prove. Most
tools enumerate `m.dungeon` maps and read `dungeon.index` as "what the player
owns by now"; decide early how an optional dungeon declares that (e.g. an
`optional: true` flag with no essence), and teach the tools in one commit.

## Done means
- Whole table green; check-playthrough 44/44 or more, THE END, never died.
- Show the human pictures of each finished dungeon (Seasons beside it).
- `npm run build`, dist/ committed, NEXT-SESSION.md and this file updated,
  pushed; ask before moving main.

## Out of scope
- Enemy damage and health (S150). A camera that frames bosses (S153).
- The pixel-art intro cutscene (tabled by the human for its own session).
