# Next session — a key for every dungeon, then side content

## Read first
- CLAUDE.md, all of it.
- `docs/NEXT-SESSION.md`, the S153 entry: the human's decisions are there.
- `docs/GAME-PLAN.md` (overworld gates table), `docs/DUNGEON-STATUS.md`,
  `docs/TRADING.md`.

## Why this, now
S153 filmed every boss (the human leaves the camera crop as Seasons has it),
gave the spin attack its sword and Seasons' own sound, and turned the title
green. The human then chose: one key item per dungeon, Seasons' way, so the
six dungeons are played in story order; then minigames, townsfolk quests and
secret caves.

## The task
1. Propose the six dungeon keys in plain words: who gives each, when, what
   it looks like, where its lock sits. D1's comes from the Maku Tree on first
   meeting (the Gnarled Key's role); each later one from a story beat after
   the dungeon before; D6's seal joins the same scheme. Ours in design,
   Seasons in look (keyhole doors, key icons from the sheets where they
   exist). Get a yes before building.
2. Build them one key per commit. After each: the robot's route learns it,
   and check-progression, check-overworld, check-gates, check-exits,
   check-items, check-playthrough (42/42 or more, to THE END, never died).
3. Propose the side content: one or two tide minigames, townsfolk quests
   paying heart pieces or rupees, secret caves with prizes. Yes first, then
   one piece per commit, the robot or a checker proving each is reachable.
4. The trading chain: ask whether they want clearer hints, distinct trader
   sprites, or a plainer guide section.

## Done means
- Every checker in CLAUDE.md's table green; `check-rippers` green.
- `npm run build`, `dist/` committed, NEXT-SESSION.md and this file updated.

## Out of scope
- Enemy damage and health (the human said no in S150).
- A camera that frames bosses (the human said leave it, S153).
