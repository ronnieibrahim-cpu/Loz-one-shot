# Next session (S248) — the audit, part two

## Read first
- CLAUDE.md, all of it (the Ages rule: Oracle of Ages' code and assets are a
  reference for ALL work).
- docs/AUDIT-S247.md (part one: what was measured, changed and left).
- docs/NEXT-SESSION.md S247 (four parts), docs/DUNGEON-STATUS.md (the board),
  docs/HANDOFF.md lessons (top ten, especially S247's two).

## Standing permission (the human, S231)
- Oracle of Ages is a full reference for ALL work: read its code and rip its
  assets exactly as Seasons'. If Seasons has no answer, check Ages before
  drawing or guessing.

## State (S247, merged to main at e06f5f5)
- Done: an enemy ladder D1-D5; puzzles chime instead of narrating; the race
  and the buoy game ask and play the mini-game theme; the race keeps a best
  time; the dive asks; ~60 stiff lines reworded; cut-off sprites drawn whole
  (rock, two townsfolk, moblin, stalfos, urchin); the octorok faces the way it
  walks and the gel stops flashing black; three side-room puzzles (D2 x2, D4's
  first statue room) and D4's own statue; a new game opens on the shipwreck.
- The human said KEEP / LEAVE (do not re-ask): everything in S240-S246's
  lists, S247's three choices (enemy ladder on the main path; keep only
  far-away puzzle lines; ask-first + Oracle tune, no fee), D2's channel stays
  `=` blocks, Wyverna over the north wall stays (S153).
- The human asked for the cheaper model for self-contained jobs: use Sonnet
  subagents in worktrees for art and room data, review every picture yourself,
  never let one touch tools/playthrough-route.mjs. They hit usage limits
  twice in S247: if one dies, finish the job yourself.

## The task
The human asked for a whole-game audit against "a third Capcom Oracle game",
weighted to puzzles, mini-games, dialogue and graded difficulty, with bugs
fixed. Part one covered dungeons, enemies, mini-games, hard-coded lines and
sprites. Part two is what part one did not reach. Ask the human first for
their iPad play notes and fix those before anything below; if none, work the
list in order, one area at a time, showing pictures as you go:

1. SIGNS AND PLAQUES. 36 overworld signs and every dungeon plaque have never
   had the S202 voice pass (`node` over MAPS roomDefs `sign.text`; the S247
   scan script is in NEXT-SESSION). Reword the stiff ones; keep every hint.
   The two reworded puzzle signs (D3 Two Weights, D4 Ebb Cell) still want a
   cold reading: show them to the human in their rooms.
2. A SOUND UNDER THE OPENING. The new-game opening is silent but for waves,
   wind and thunder. Seasons' and Ages' intros have music. Offer the human:
   Seasons' intro1/intro2 (already ripped), Ages' intro from mus-ages via
   rip-music.py, or silence; render each with render-track.mjs to WAV.
3. THE OVERWORLD AS A PLAYER WALKS IT. Region by region, the screens between
   dungeons: does each region have something to find (count heart pieces,
   charms, caves, errands, trades per region; S203's list), do its enemies
   climb with the dungeon order, and is anything on screen wrong (stitch each
   region with shoot-region.mjs at each sea and look). Fix what is wrong;
   propose new side content to the human before building it (rotation f).
4. THE ECONOMY. Prices in the shop and the scrimshander against what the run
   earns by each dungeon (check-playthrough's rupee totals): is there ever
   nothing to buy, or something you cannot afford for hours? Seasons' and
   Ages' shops are the reference.
5. THE MENUS AND HUD against the cartridges, screen by screen (items, quest
   page, map, save), with pictures beside the original: anything ours that
   the cartridge draws differently.
6. D5 -> D6. The robot takes 32 in D5 and 112 in D6, three bosses plus pits
   and spikes at the cartridge's own cost. Only a person can say if it is a
   wall: ask the human after they reach it; do not change it unasked.
- Pictures beside the original, sounds as files, ask before bigger changes.
- Anything that changes a room on the route moves the clock for every fight
  after it: list the route's rooms first (`node tools/route-prefix.mjs 0`),
  prefer rooms it never enters, and if one it enters must change, sweep the
  next boss's entry wait with route-prefix PATCH (HANDOFF S247). Keep beetles,
  bubbles and darknuts out of the robot's `fight` rooms.

## Done means
- Whole table green; check-playthrough 49/49 or more, THE END, never died;
  npm run build, dist/ committed; docs/AUDIT-S247.md gains a part-two section;
  NEXT-SESSION.md and this file updated; pushed; merged to main when done.

## Out of scope
- Enemy damage and health copied from Seasons (S150). A camera that frames
  bosses (S153). A jump button. Rewriting the main story.
