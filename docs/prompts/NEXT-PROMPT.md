# Next session (S157) — bigger towns by widening the map, faster text, throwing that flies

## Read first
- CLAUDE.md, all of it.
- `docs/NEXT-SESSION.md`, the S156 entry and its "Later the same session"
  (the human's decisions are there).

## The human's decisions (S156, end of session)
- TOWNS: **option 3** — make room on the overworld itself so towns can be
  Horon-sized (Horon Village is about five screens by two: dirt paths, a
  plaza with a fountain and benches, one building a screen, fences, gardens,
  lawns). Tidewatch today is four crowded screens with ~12 townsfolk; Sandpiper
  Row is one screen. The human wants them to "breathe", with the Oracle games
  as reference and inspiration (assets/sheets/oracle-seasons-overworld-spring.png,
  Horon at roughly x 780-1620, y 1700-2070).
- TEXT: dialogue should scroll faster.
- THROWING: in Seasons a lifted pot or rock is thrown across the floor and
  hits enemies as a weapon; here a thrown object seems to vanish with no
  travel. Fix it to behave like Seasons.

## The task, one commit per piece, whole checker table before each commit
1. THROWING (small; do first). ThrownObject (src/game/items.js) lands after
   ~14 frames at THROW_SPEED 2.5 px/f (all three throw constants in feel.js
   are `guessed`), and shatters on the first wall/enemy overlap. Reproduce
   in-engine first (try-room / shoot-steps: lift a pot in open ground, throw,
   log its position each frame) — suspect an immediate `hitX/hitY` from the
   spawn point (player.js throw, `this.x + dx*4`) or a collision with a solid
   entity, rather than the arc. Then take Seasons' own throw from
   oracles-disasm (the thrown-object code and its speed/gravity tables; tag
   `derived` with file and table): how far it flies, its arc, the damage it
   does, and that it breaks on landing. Add a check (extend check-items or a
   new tool) that a thrown pot travels its Seasons distance and hurts an
   enemy in its path. Film before/after for the human.
2. TEXT SPEED (small). TEXT_FRAMES_PER_CHAR is 4, derived from Seasons'
   default text speed 3 (code/textbox.s textSpeedData). Seasons offers
   faster speeds; propose the faster cartridge value(s) (speed 4 or 5) to the
   human with a side-by-side, change the constant (keep it `derived`, cite
   the table row), re-record anything downstream (replay, watch-cutscenes).
3. TOWNS, option 3 (large; the rest of the session and likely the next).
   Plan first and SHOW the human a drawn plan (map sketch + Horon beside it)
   before moving anything:
   - Insert new overworld columns/rows so Tidewatch can grow to Horon's size
     (and Sandpiper Row to 2-3 screens) without eating existing places.
     Every screen key east/south of the insertion shifts: room data, warps,
     gates, story/beat/errand references, the Coastwise Chain, check-towns'
     TOWNS list, strands baselines, the playthrough ROUTE and its actor
     directives, route-prefix numbers, guide references. Find a single place
     to do the shift (a script) rather than by hand, and grep for every
     hard-coded `0,x,y` key.
   - Lay the towns out in Horon's grammar with the town kit (3x3 building
     blocks; one corridor rule — read the CLAUDE.md trap), dirt paths, a
     plaza, fences, flower beds; spread the townsfolk out.
   - check-towns, check-overworld, check-strands (re-baseline only with a
     reason), check-progression, check-placement, check-ground, check-side,
     check-trade, check-respawn, then re-route the playthrough and get it
     back to 43/43, to THE END, never died.
4. Still owed from S156: the Coastwise Chain question (hints / distinct
   traders / nothing); boss art for Thalassor, Gustharpy, Saltwraith (ask if
   they should also be placed); approval to merge the illustrated-guide
   branch claude/oracle-tides-guide-hb01hp (the merge was blocked by the
   permission check; ask the human to approve it explicitly).

## Done means
- Every checker in CLAUDE.md's table green, check-playthrough 43/43 or more,
  to THE END, never died; check-rippers green.
- `npm run build`, `dist/` committed, NEXT-SESSION.md and this file updated.
- Push to the session branch; the human wants finished work on main too
  (main is live on GitHub Pages), so fast-forward main when green.

## Out of scope
- Enemy damage and health (the human said no in S150).
- A camera that frames bosses (the human said leave it, S153).
