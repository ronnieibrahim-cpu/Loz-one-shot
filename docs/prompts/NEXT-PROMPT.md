# Next session — side content, the trading chain, items held overhead

## Read first
- CLAUDE.md, all of it.
- `docs/NEXT-SESSION.md`, the S154 entry: the human's decisions are there.
- `docs/GAME-PLAN.md` ("Dungeon keys" table), `docs/TRADING.md`.

## Why this, now
S154 locked every dungeon behind its own key, Seasons' way, handed over by a
story beat after the dungeon before (Maku Tree, Sandpiper fisherman, the old
man in the square, the shore Salter, the digger, the Maku Tree again). The six
are now played strictly in order. The human's standing list continues.

## The task
1. SIDE CONTENT (the human said yes in S153; not yet proposed in detail):
   one or two tide minigames, townsfolk quests, secret caves (bombable walls,
   tide-only openings). HUMAN'S S154 RULE: the heart-piece prizes are EXISTING
   heart pieces moved off the map into this content, not new ones (the cap
   window 14-16 is full at 24 pieces). Candidates the robot never collects,
   so moving them costs its health budget nothing: Rustfall 0,3,0, Salt
   Terraces 0,5,0, Palace Wall 0,9,0, Kell Ledges 0,2,3, Log Drift 0,6,4, and
   the Palace cave (cave4). Propose in plain words, get a yes, then one piece
   per commit, with check-hearts proving the count still lands and a checker
   or the robot proving each prize reachable.
2. ITEMS HELD OVERHEAD (human, S154: "fix item sprites when Link is carrying
   them over his head"). Compare ours to Seasons (footage + disasm) for both
   cases — an item held up when it is got (chests, givers, the new keys), and
   a pot/rock lifted and carried — and fix what differs: position, which
   frame Link uses, the item's size. Show before/after beside Seasons.
3. Ask whether the trading chain needs clearer hints, distinct trader
   sprites, or a plainer guide section (carried over from S153, not yet asked).

## Done means
- Every checker in CLAUDE.md's table green, check-playthrough 43/43 or more,
  to THE END, never died; `check-rippers` green.
- `npm run build`, `dist/` committed, NEXT-SESSION.md and this file updated.

## Out of scope
- Enemy damage and health (the human said no in S150).
- A camera that frames bosses (the human said leave it, S153).
