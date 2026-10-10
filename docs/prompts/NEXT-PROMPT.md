# Next session (S180) — learn Ages' dungeon language, then grow D3

## Read first
- CLAUDE.md, all of it. Oracle of Ages is a full reference alongside
  Seasons, assets and all.
- `docs/NEXT-SESSION.md`, the S179 entry, then S178.
- `docs/HANDOFF.md` hard-won lessons (newest at the top).

## State
- S179 is on claude/ecstatic-thompson-p9mc72 (merged into main if the human
  said so); branch from main.
- Whole table green; check-playthrough 44/44, THE END, never died.
- New in S179: START alone skips the opening, the card and the logo (A does
  not, as in Seasons); the map's grey stone is Ages' lighter map grey; the
  guide's menu labels sit under their slots; every Dungeon Map and
  Chartstone is in a chest and rises out of it as in Seasons; the sword
  swings as fast as it is tapped and its blade picks up drops (Seasons'
  rules); the online guide republished. Leftovers in NEXT-SESSION.md S179.

## The task
Grow D3-D6 into dungeons whose PUZZLES stand beside the Capcom Oracles', D3
(the Bogwater Sanctum) first. Two phases; do not skip the first.

### Phase 1 — learn the design language (Oracle of Ages above all)
Ages is the puzzle entry of the pair; study it until you can say WHY its
rooms work, not just what is in them. Clone oracles-disasm into the
scratchpad and read, dungeon by dungeon (Ages D1-D8, then Seasons D1-D8 for
contrast): the floor layouts (data/ages/dungeonLayouts.s), every room's
objects (objects/ages/mainData.s) and the puzzle interactions' own code in
object_code/ (INTERAC_COLORED_CUBE and its flame, TOGGLE_FLOOR,
FLOOR_COLOR_CHANGER, PUSHBLOCK_SYNCHRONIZER, MINECART_GATE, LEVER and
LEVER_LAVA_FILLER, TILE_FILLER, EXTENDABLE_BRIDGE, TRIGGER_TRANSLATOR,
MISC_PUZZLES, D5_4_CHEST_PUZZLE, D7_4_ARMOS_BUTTON_PUZZLE,
D8_ARMOS_PATTERN_PUZZLE...), the raisable floor and whirlpool tiles, Jabu-
Jabu's water levels, the Ages past/present split; render rooms
(tools/shoot-dungeon.mjs for ours; the large room files + tilesets for
theirs) and walk the critical path of each. tools/oneshot/oracle-dungeon-
stats.py gives the counts. Write what you learn to
docs/briefs/DUNGEON-DESIGN-LANGUAGE.md: how a dungeon introduces its item
(safe room, then a twist, then a combination), how puzzles escalate within a
dungeon and across the game, multi-room and cross-floor puzzles (a switch
here changes a room there; a hole drops you into the other half of a floor),
state puzzles (colour cubes, toggling floors, block synchronisation, minecart
routing), the "aha" of re-reading a room you already passed, key economy and
backtracking loops, how the map is shaped round a hub, and how much of it is
optional. Name the rooms that exemplify each.

### Phase 2 — design, then build, D3
With that language, design D3 as an Ages-calibre dungeon of OUR mechanics:
toward ~40 screens on 2 floors (a cellar under the bog) per
docs/DUNGEON-STATUS.md "S179", with drop-through holes (at HIGH a flooded
shaft you swim down) and cracked floors, AND genuinely complex, novel puzzles
that combine the tide, the Anchor, the Lens, the Cleats and the new terrain
across rooms and floors — puzzles a player solves by understanding, the way
Ages' are, not by trying things. Every mechanic stays ours (CLAUDE.md Goal
2): borrow the grammar, never port a puzzle. Write the design as a short
brief with a map and each puzzle's intended "aha", and SHOW THE HUMAN A MOCK
(Seasons'/Ages' comparable room beside ours) BEFORE building. Each puzzle
needs a checker that proves it can't be skipped and can be solved (the
check-anchor / check-lens pattern). Then re-route the robot and re-shoot the
guide. D4, D5, D6 follow, one a session, each harder than the last.

## Done means
- Whatever the human chose, with the whole table green and check-playthrough
  44/44 or more, to THE END, never died.
- `npm run build`, dist/ committed, NEXT-SESSION.md and this file updated,
  pushed; ask before moving main.

## Out of scope
- Enemy damage and health (S150). A camera that frames bosses (S153).
