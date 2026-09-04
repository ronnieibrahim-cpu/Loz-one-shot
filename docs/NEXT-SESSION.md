## S28 — D2 routed to its Boss Key in the live engine; a self-correction mid-session

Priority 2 from `docs/prompts/NEXT-PROMPT.md`: extend `tools/playthrough-route.mjs`
past D1. **Not landed in the repo this session** — it lives only in this
entry, verified against the live engine in a scratch harness, because the
final leg (getting back to the boss door and fighting Anemos) was not
finished. `main`'s `check-playthrough.mjs`/`playthrough-route.mjs` are
UNCHANGED and still D1-only, 21/21, exactly as S27 left them.

**This entry SUPERSEDES an earlier version of itself written mid-session.**
That version reported the Reefguard miniboss as unwinnable from the route's
own arrival state and pinned the cause on `dBoss`/`tools/actor-runtime.mjs`
being untested against a wide, shelled-boss room. That diagnosis was WRONG,
and pushed to `main` before the mistake was found — recorded here rather than
quietly rewritten, because the actual bug is a real hazard worth naming
precisely: **`['equip', 'lens', 'B', 400]`, called once the Lens is picked up,
silently displaces the sword** (it was only ever bound to B) — every `'boss'`/
`'fight'` swing after that presses the LENS button, not a sword swing, so the
fight was never landing a hit for a reason that had nothing to do with room
geometry or the actor's combat AI. Removing that one `equip` call — or
equipping the Lens to A instead, since a scripted route that already knows a
fork's answer never needs to press the Lens button at all — fixes the fight
outright, costing ~2-7qh depending on approach, same order as Clawcrab. **Do
NOT equip the Lens onto a button that is already carrying the sword or
conch** unless the step immediately re-equips what it displaced before the
next fight. `dBoss`/`evade` need no changes; the "wide shelled room" theory,
the four repositioning attempts, and the wall-drift measurements described in
the superseded text were all real observations of the SAME symptom (zero
damage landing) with the wrong cause attached — a lesson in not stopping at
the first plausible-sounding explanation for "zero progress across a long
budget", which is exactly the diagnostic instinct CLAUDE.md's bosses.js
`open()` comment warns has a real failure mode (`fires into its own window`)
and this was a reminder that there is at least one more failure mode shaped
exactly like it (an unrelated button held) that produces the identical
symptom.

### What is VERIFIED working, room by room, in the live engine

Built and driven with a scratch dev harness (`window.__rp.beginRecord`, the
same driver `tools/replay.mjs` and the other playthrough tools use, just
booted directly into `d2` with granted items rather than from a title screen —
a shortcut that is fine for THIS kind of route-development probing, the same
way `tools/measure-boss-combat.mjs` and the replay plans already do it, and
is NOT what the final `check-playthrough.mjs` run may do). Seed 20260806
throughout.

1. **Spire Mouth (0,3,7) -> Rising Chamber (0,3,4)**: `['travel', 3, 4, 2000]`
   crosses Coral Landing and Tide Gallery on its own (BFS pathing across the
   room graph, no manual `goto`+`exit` needed for a plain corridor room —
   this generalises past D1, which never happened to lean on it this hard).
2. **Rising Chamber's switch puzzle.** `barnacle` at (4,6) has `hp: 999,
   shield: 'all'` — it is a stationary hazard (shoots ink every 96f within
   100px), NOT a combat objective; `puzzle.enemies` is not set on this room,
   `puzzle.switches: 'all'` is. Do **not** send `['fight', ...]` at it — the
   first attempt did, on 20 max hearts, and died in 1200 frames without
   landing a hit (the SAME "zero damage, long budget" symptom as the Reefguard
   misdiagnosis above, this time correctly attributed on the first try: it is
   a `hp:999,shield:'all'` fixture, not an enemy). Solve instead: block (2,5)
   -> switch (1,5) by `['goto',3,5],['hold',['left'],40]`; block (7,6) ->
   switch (8,6) by `['goto',6,6],['hold',['right'],40]`. Both down spawns the
   key at (4,2) and opens door (4,1) (the Cistern Cell/charm detour — skipped
   this session, optional). Cost ~6qh from the barnacle's ink while working
   the blocks.
3. **Stair Coil's locked door.** The room's key doors are WITHIN the room,
   not on its edges (`travel` reaches the room key `0,2,4` without needing
   the key at all — the west edge of Rising Chamber opens straight into
   Stair Coil's east half; the locked door at local (5,3) only gates the
   STAIRS beyond it). `['goto',6,3],['hold',['left'],20],['tap','a',40]`
   spends the key and opens it, same as any D1 locked door — walking into it
   is not enough, it needs the interact tap.
4. **Floor 1: Upper Landing -> Anemone Cell -> Spire Concourse -> Sealed
   Cell**, all plain `travel` hops. Anemone Cell drops a fairy pickup that
   `loot` grabs — free full heal, worth routing through even though it is not
   on the shortest path.
5. **Sealed Cell's big chest (the Lens).** THE CHEST IS A SOLID ENTITY
   (`0b68e6b`, CLAUDE.md's own closed trap) — `goto` onto its own tile (2,1)
   silently fails (0 movement, `canOccupy` correctly refuses it). Goto the
   tile BESIDE it instead: (1,1) is plain floor at every tide; (2,2) below it
   is `dWell` (deep at MID/HIGH, avoid). `['goto',1,1],['hold',['right'],20],
   ['tap','a',40]` opens it and grants `lens`. **Do not then equip it to B** —
   see the correction above.
6. **The First Fork (1,4,3), west branch — correct ("the west one fills").**
   Mirrors `tools/replay-plans.mjs`'s `d2-fork-wrong` (which deliberately
   takes the WRONG/east branch and proves the shaft stays a hole) reflected
   onto the west side: `goto(3,5)` onto the shelf, `hold left 60` to auto-hop
   the one-way ledge at (2,5) landing at (1,5), `goto(1,6)` down to the west
   valve, `hold right` to face it, `tap a` to fire `TideValve.interact` ->
   `game.forceTideStep()` (tide 0 -> 1, the room's OWN sluice, since
   `tideForce: 0` refuses the conch), then `hold up 80` walks the actor all
   the way up the now-wadeable shaft (`dDrain` floods at MID) to (1,1),
   `goto(1,0)` + `hold up` crosses into Reefguard Hall. Confirms the room's
   `lensRoom` data against the live engine, not just against
   `check-lens.mjs`'s model of it.
7. **Reefguard Hall (1,4,2), the miniboss for key 2.** `['boss', 6000,
   'reefguard']` wins cleanly once the sword is actually on a button (see the
   correction above) — no positioning trick needed, plain engagement from the
   shaft's own arrival point works. `puzzle.enemies: true` needs BOTH
   Reefguard AND the urchin at local (15,4) dead, and the urchin sits on
   `dWell` — deep at MID, unreachable without swimming — so sound the conch to
   LOW first (`['use','conch',2,140]`), THEN `goto(14,4)` and `['fight',...]`
   to clear it, or the puzzle flag/key never fires. The reward key at local
   (4,1) sits flush against the room's own north wall — `dLoot`'s usual
   "lean one tile north" recovery presses into solid wall there and gains
   nothing (row 0 is unbroken `dWall` the whole width); approach it from
   BELOW instead (`goto(4,3)` then `hold up`) and it collects normally.
8. **Bomb Vault (1,5,3), Whelk Cell (1,5,4).** Reefguard Hall is `size:[2,1]`
   — `travel` cannot path to Bomb Vault: `dTravel`'s cross-room BFS treats the
   WHOLE multi-cell room as one graph node keyed to its registered rx,ry (4),
   with no edge modelled for the room's SECOND cell's own south exit
   (5,2)->(5,3); it silently wandered off to an unrelated room rather than
   failing loudly. **This is a real, general `dTravel` limitation, not just a
   Reefguard-Hall quirk — any `size:[w,h]>1x1` room's non-anchor-cell exits
   are invisible to it.** Walk it by hand: `goto(14,7)` (the east chamber's
   own south opening) then `exit('down')`. The chest (bombs) and the heart
   piece are both plain, undramatic pickups once there.
9. **Spire Ascent (1,3,2)/(1,3,3), also `size:[1,2]`, same `travel` gap.**
   Its WEST edge (rows 3-4 of the upper cell) connects to Reefguard Hall's own
   corridor — `travel(3,2)` from Reefguard Hall happens to work because that
   IS an edge from the room's anchor cell. Its locked-door crossing to Drowned
   Cell is at LOCAL (1,11) (the lower cell, i.e. row 11 of the room's full
   16-row grid) — `goto(4,6)` (into the lower cell generally) then
   `goto(2,11)`, `hold left`, `tap a` spends key 2, then `goto(0,11)` +
   `exit('left')` reaches Drowned Cell (1,2,3).
10. **The Sounding Fork (1,2,2), FORK 2 — three throats, west correct again**
   ("one wades" is the design's own line for it). Same primitive as the First
   Fork, one more branch: `travel(2,2)` from Drowned Cell works (plain edge).
   Cross exactly like the First Fork — shelf (4,6) -> ledge at (1,6) [`hold
   up`] -> valve at (2,3), approached from (1,3) [`hold right`, `tap a`] ->
   shaft up to (1,0) -> `exit up` into **Bosskey Cell (1,2,1)**, where the
   chest at (4,2) (approached from (4,1), `hold down`) gives the Boss Key.

That is **10 of the dungeon's ~14 required rooms**, fully driven and verified
against the live engine, holding the Lens, the Bombs, both Small Keys spent,
one heart piece, and the Boss Key. hp was 12/20 (3 hearts) on reaching
Bosskey Cell on this run — tight but not yet desperate; the Glass Cell heart
piece (skipped this session) is sitting right off the First Fork's approach
and is the obvious top-up if health is short later.

### THE OPEN PROBLEM: getting back from Bosskey Cell to the boss door

Bosskey Cell has exactly one exit (south, back into the Sounding Fork) —
confirmed by reading its full map, no side openings anywhere. The room's own
comment names the intended way past a fork once you're on the far side of its
one-way ledge: **"a stair back out <- the cost of being wrong"** — all three
of Sounding Fork's stairs (2,4)/(5,4)/(8,4) warp to the SAME destination,
`{map:'d2', floor:1, rx:3, ry:3, px:64, py:208}` — Spire Ascent's LOWER cell,
directly, which is exactly where the boss door route needs to go.

**Reaching that stair from Bosskey Cell's south exit was not solved this
session.** Landing back in Sounding Fork puts the actor at row 0 (north of
the shaft, on the far/committed side of the ledge) — and `tideForce: 0`
RE-PINS THE ROOM TO LOW ON THIS FRESH ENTRY, same as every entry; the valve's
own `open` flag persisted (it is a `saveKey`-backed toggle) but the WATER
LEVEL did not, so the shaft between row 0 and the stairs (row 4) is a bare
`dPit` again. Walking down through it did not read as "falls in, takes
damage, tries again" the way a plain hazard normally would: `goto`/`hold
down` both went completely static (zero net movement across 200+ frames at
15-frame polling resolution, health UNCHANGED the whole time — no pit-fall
damage was ever taken) and then, after enough stuck time, the actor was
thrown back through the NORTH edge into a freshly-repopulated Bosskey Cell.

**Fully diagnosed, frame-by-frame, and it may be a genuine completability
gap in the dungeon rather than a routing mistake.** Queried the engine
directly first (`room.tile(1,1,tide).flags`, `room.solidAt(...)`) — the
shaft tile is `dPit`, `F.PIT` only, and `solidAt` returns `false`: it is not
solid, so this was never a `canOccupy`/pathfinding refusal. Then polled
`player.falling`/`player.lastSafe`/`player.x,y`/`progress.hearts` on EVERY
frame (not every 15) through an isolated, full-health repro
(`enter:['d2',1,2,2,16,3,'up']`, tide 0, `['hold',['down'],200]`) and the
mechanism is now completely accounted for:

- Stepping onto the pit calls `Player.beginFall` (`src/game/player.js`),
  which sets `falling = FALL_FRAMES` (34) and ignores movement input for
  that whole window — the "frozen, not merely blocked" symptom the coarser
  15-frame polling read as a stuck pathfind.
- After 34 frames, `updateFalling` relocates to `findSafeTile(...) ||
  lastSafe` and deals `PIT_DAMAGE` (2qh) — confirmed directly: hearts went
  20 -> 18 on the first fall, exactly as `player.js` says it should. (The
  EARLIER coarse trace showing hearts unchanged for 200+ frames was reading
  a run that was already critically low on health from the rest of the
  route — see below, not a sign the damage wasn't firing.)
- **The relocation lands EXACTLY back at the same tile in row 0 every time —
  zero net progress.** `lastSafe` only updates while standing on safe ground,
  so once the actor is in the shaft it is frozen at the row-0 entry point;
  `findSafeTile`'s own search apparently finds nothing better within its
  radius (rows 1-2 are the whole 2-tile shaft, hazardous both cells, with
  walls on both sides at that column). So `hold down` from row 0 does not
  inch forward and fail — it repeats an EXACT, zero-progress 34-frame cycle,
  costing 2qh every time, forever, until health runs out.
- **That is very likely what produced the "ended up back in Bosskey Cell"
  observation in the earlier (in-route) attempts**: by the time this segment
  ran, health was already down to single digits from the rest of the route,
  a fall cycle or two finished it off, and the game's own death/respawn
  system (`docs/DUNGEON-STATUS.md`/CLAUDE.md's `check-respawn.mjs` row) put
  the actor back at whatever checkpoint it had — which read, in the trace, as
  an ordinary room transition back to Bosskey Cell. Not confirmed with a
  `mode:'gameover'` frame captured directly, but it is the only account that
  fits every observation, including the fine-grained repro (no route
  preamble, full health, same fall-loop, same landing tile, never once a
  room change — because it never ran long enough to die).

**So: there is no evidence of any way to safely re-cross this shaft at LOW
tide once tideForce has reset it, and the valve that would fix that is on
the FAR side of the very hazard that blocks reaching it.** Whether that
means: (a) a genuinely missing exit or shortcut in Bosskey Cell / Spire
Ascent's design, (b) the Boss Key is supposed to be fetched by a completely
different path this session did not find, or (c) accepting several 2qh
fall-cycles really is the intended "cost" and the room is simply meant to be
crossed on a health budget that assumes it (which the design's own "one
wades, one waits, one keeps you" framing does not obviously support, since
wading was supposed to be the SAFE answer) — **is not settled, and is the
single highest-value thing to resolve before touching this room again.**
Bosskey Cell has exactly one exit (confirmed by reading its full map), so
"another way back to Bosskey Cell" is not the question — the actor does not
need to return there once the key is in hand. The real question is how to
get from Sounding Fork's row 0 (where leaving Bosskey Cell always lands you,
in the WEST column specifically, since that is the only column ever safely
flooded) onward to the stairs/Spire Ascent, and this session did not find a
way that is not a lossy dead loop.

**The most concrete lead for next time**: the valve's `open` state
DOES persist across room re-entry (`saveKey`-backed, confirmed —
`d2:1,2,2:0` was still in `progress.flags` on the return trip), but
`tideForce: 0` unconditionally resets `game.tide.level` to LOW "on entry"
regardless of that flag, and nothing re-applies a remembered-open valve's
effect (another `forceTideStep`) automatically on room load. If the design
intent was "a valve you have already thrown stays thrown, and the room
remembers to start flooded," that reconciliation is simply not wired up
anywhere — worth checking `Game.applyStoryGates`/room-entry code (the same
place `tideForce` itself is applied, per its own comment in
`src/data/dungeons-a.js`) for whether it was meant to and doesn't, versus
whether re-entry is supposed to force a fresh LOW every time and the
crossing is expected to work some other way entirely.

### For the next session

The 10-room segment above (rooms 1-10, all update notes inline) is ready to
paste into `tools/playthrough-route.mjs` almost verbatim once the return leg
is solved — it will also need the overworld-walk-in preamble D1's route used,
from wherever D1's Essence leaves the player to Coral Spire's mouth at
`overworld,10,5` (not attempted this session). What is NOT reached: the
return to Spire Ascent's boss door, and Anemos itself.

1. **Solve the return leg first.** Start from the `tideForce`-vs-persisted-
   valve lead above — check whether room re-entry was ever supposed to
   re-apply an already-thrown valve's tide bump and simply doesn't, before
   assuming a repeated 2qh pit-fall cycle (measured: zero net progress, not
   just expensive) is the intended crossing.
2. **`dTravel` cannot path through any `size:[w,h]` multi-cell room's
   non-anchor exits** (item 8/9 above) — worth a real fix in
   `tools/actor-runtime.mjs` at some point (teach `bfsScreens` the room's full
   footprint, not just its rx,ry), since it will bite every future route that
   touches Reefguard Hall or Spire Ascent again. Not attempted this session;
   flagged as a genuine, general gap rather than routed around silently.
3. Anemos itself (1,3,1) has never been fought by this route or measured
   fresh this session — `docs/DUNGEON-STATUS.md`'s S5 table says it wins at 4
   hearts with zero pieces counted; this run was carrying 3 (12qh) at Bosskey
   Cell, before the Glass Cell piece, before whatever the return leg costs.

`docs/DUNGEON-STATUS.md`'s "D1 is played" framing still needs revising once
D2 actually lands — this session's progress is recorded there too, corrected
to match this entry.

---

## S27 — the shoreline rim landed

Priority 1 from `docs/prompts/NEXT-PROMPT.md`, fully specified going in, and it
turned out to be exactly as specified: an engine bug (animated tiles never
consulted `artAt`) plus a derivation, not an extraction.

### 1. The engine fix — `Room.animArtAt`, `src/world/room.js`

`Room.render`'s animated branch used to push `{x, y, def: d}` into
`animCells` and `drawAnim` painted every one of them with
`tileArt(c.def, frame)` — the cell's OWN tiledef, full stop. `artAt`'s edge
substitution (the thing that gives `cliffTop` its lip) was only ever called
on the STATIC path. Water is animated, so an `edgeArt` entry on `waterS`
was silently dead code before this session — wiring the art without finding
this first would have looked exactly like "the art didn't work".

New method `Room.animArtAt(d, x, y, tide)` calls `artAt` (same as the static
path) and resolves the result against the SUBSTITUTED art's own tiledef,
not the cell's: if `artAt` names a tile that itself declares `anim` (the rim
pieces do, three frames each, matching water's own cycle), `tileArt` walks
ITS frames; if it names a plain substitution with no `anim` (`bankEdgeS`,
still parked), `tileArt` falls back to that tile's `name` and draws it
static — identical to the old un-animated `artAt` behaviour. `render`,
`renderAt` (the Brineglass Lens preview — fixed too, or the Lens's still
would have shown a hard-edged coast next to the real view's rimmed one) and
`drawAnim` all route through it. Called once per cache rebuild, never per
frame — same cost as the static path already pays.

Verified this is a true no-op before any tiledef used it: `test.mjs` 83/83
with the engine change alone, before Part 2 below touched any data.

### 2. The art — derived, not picked, in `tools/rip-terrain.py`

Cropped the natural pond on the Seasons spring map at ~1827,1066 and read
its pixels directly (not just eyeballed): land is untouched right up to the
water, and the boundary is a dark line sitting hard against the water fill,
wobbling in and out by a pixel rather than running straight — "scalloped" is
accurate. There is no clean 16x16 rectangle to extract from a hand-painted
coastline that isn't tile-aligned, the same reason `waterS1`/`waterS2` are a
SHIFT of `waterS0` rather than a second sheet crop.

So `build_water_rim()` derives 24 grids (4 edges + 4 outer corners x 3 anim
frames) from water's own already-extracted sparkle: it overwrites the
border row/column facing land with a 2-on/1-off tooth mask in palette index
3 — the `water` palette's own darkest tone (`#10305c`), which the extracted
sparkle never uses, so the rim costs no new colour or palette. Phase-shifted
a third per animation frame so the teeth crawl gently along the shore in
step with water's own three-frame cycle. This is NOT the interior-ladder
fault the negative-results section below (and S26's) warns a "regular
pitch" checker can't discriminate — that trap is a texture repeating across
a whole tiled field; this is a boundary, drawn once per edge cell, the same
kind of feature `cliffTop`'s solid rim row already is.

### 3. Wiring — `src/data/tiles-core.js`

`family: 'shore'` on `grass`, `grassDark`, `grassBog`, `sand`, `sandWet`,
`sandRipple`, `mud` — the land tiles a natural coast is built from.
`waterS` gets `edgeAgainst: 'shore'` and `edgeArt: WATER_RIM_ART` (the 8
direction names, mirroring `BANK_EDGE_ART`'s shape exactly, inverted onto
water instead of onto land).

**Only `waterS`, deliberately not `waterD` or `openSea` too.** The rim
pieces bind `pal: 'water'`; `waterD` draws in `pal: 'deep'`, a visibly
darker ramp, and `Room.palFor` looks up a substituted art's OWN palette
rather than the cell's — so a deep-water rim would ring every drop-off in
the shallow palette's colours, a seam worse than the hard edge it replaced.
A coast in this game is always land -> shallow -> deep, so the land/water
join is always against `waterS` in practice; a direct land/`waterD` join
(a cliff dropping straight into deep water) keeps its hard edge, unchanged
from before this session.

### Verified

Screenshotted `overworld,5,8` and `overworld,3,8` (Shell Beach) at all three
tides — the rim renders exactly as the pond reference showed: dark teeth on
the water side, land untouched. `test.mjs` 83/83, `check-overworld` 17/17,
`check-strands` OK (no new stranded region), `check-tilesets` 7/7 (ripper
still re-emits byte-identically), `walk-dungeons` 23/23, `check-ground` 7/7,
`check-placement` 2/2, `check-camera` OK, `replay.mjs` **51/51 with zero
re-recording** — no baseline's probe pixel happened to land on a
rim-affected cell — `check-playthrough` 21/21 (unchanged: still D1-only,
see Priority 2 below), `npm run build` + `check-build` OK.

### One real limitation, found by screenshot and not a regression

A water cell exactly ONE TILE WIDE with land on both opposite sides (a
narrow channel, e.g. Shell Beach `0,3,8`'s row-0 channel cell) gets rim art
on only ONE of its two facing edges, not both. This is `tileEdgeArt`'s own
documented "opposite pair" degrade — `up+down` or `left+right` both
differing has no dedicated two-sided art, so it falls back to whichever
single edge comes first in `EDGE_DIRS` order (`up`, then `down`, then
`left`, then `right`). This is PRE-EXISTING engine behaviour, the same
degrade `cliffTop` and the old `bankEdge*` always had — not introduced by
this session, and not worth a special case for the rim alone. A future
session wanting to close it would add `up+down`/`left+right` "channel" art
to `EDGE_ART_KEYS` in `src/world/tileset.js` and to whichever tiles want it;
out of scope here.

### What is NOT done

- **Salt flats, ice floors and reef/abyss shorelines were not audited.**
  `family: 'shore'` was added only to the plain grass/sand/mud coastal
  grounds the pond reference actually showed. Whether Frostbound's ice or
  the salt-flat region's coastline should also grow a rim is an open
  question for whoever reads those regions next (Priority 3 in the prompt).
- **The two-sided "channel" degrade above.** Known, screenshotted, not
  fixed — see the limitation note.
- Priority 2 (route D2 through `check-playthrough`) and everything below it
  in `docs/prompts/NEXT-PROMPT.md` is untouched this session.

---

## S26 — the water was a ladder and so was every shoreline

THE JOB, in the user's words: "random interspersed water tiles of varying
height that don't make sense" and "ladder tiles used as ground terrain which
looks ugly." Both were real. Neither was what it first looked like.

### 1. `waterS` was drawn as a ladder, by hand

`waterS0/1/2` in tiles-core.js were hand-drawn: a flat field with a row of
dashes on rows 2, 6, 10 and 14. That is a PERFECTLY REGULAR four-row pitch, so
tiled across a lake it is not a ripple, it is RUNGS. It is the identical fault
`rip-terrain.py`'s own `grass` note describes ("about fourteen dark speckles in
a fixed constellation... the eye locks onto sparse marks that recur on a
16-pixel pitch") and the identical fix: extract the source's own water, which
is a fine, dense, IRREGULAR sparkle with no mark big enough to line up on.

`('waterS0', AG, 1376, 168)` — Ages, not Seasons, because Seasons' overworld
water on these sheets is drawn in horizontal wave BANDS, which is the very
thing being removed.

**The other two frames are DERIVED and the ripper says so.** The sheets are
stitched maps, so every lake is captured in ONE animation phase — 1376,168 and
1680,200 look like two frames and are provably the same tile at two crop
offsets (one is a cyclic shift of the other). So `waterS1`/`waterS2` are the
extracted tile shifted 1,1 and 2,2 via a new `SHIFT` op in `TRANSFORMS`. That
is legitimate for THIS tile and would not be for most: the pick has no feature
large enough to track, so a small shift reads as shimmer rather than as the
lake sliding. `TERRAIN_ART` spreads over `HAND_ART` in tiles-core.js, so the
extraction overrides the hand-drawn frames with no rewiring.

### 2. THE SHORELINE WAS A BRICK WALL — 8,536 cells, all 120 screens

This is the "ladder tiles used as ground terrain", and the phrase is exact: the
bank tiles ARE ground (plain walkable, they replace grass at the edge cell) and
they ARE drawn as a ladder.

`bankEdgeS` was extracted from Ages 545,1226, which S21 believed was "a garden
pool's shore". **It is not. It is the brick RETAINING WALL of an ornamental
walled pool** — brown courses with dark mortar lines and a white stone coping
above the water. Rotated into `bankEdgeE`/`bankEdgeW` those courses stand on
end, and every shoreline in the game drew as a wooden ladder laid on the ground.

The irony is on the record: S21 rejected the 1400,1900 crop for being exactly
this ("Ambi's moat, a lock-puzzle canal... its bank is walled masonry") and then
picked a second walled pool 1,300 pixels away. **A built wall is what an Oracle
sheet mostly SHOWS at a water's edge**, because ornamental pools are where the
artists drew a deliberate edge; a natural lake in these games generally has no
bank tile at all — the grass simply meets the water.

So the bank is OFF: `family`/`edgeAgainst`/`edgeArt` are removed from `grass`,
`sand` and `sandRipple`. Bank cells drawn went 8,536 -> 0. **The machinery and
the tiledefs are LEFT IN PLACE and are correct** — `cliffTop` still uses them,
and its 3,111 cells of cliff lip are untouched and still right. Restoring the
bank is adding three properties back, once a genuine natural shore has been
found AND screenshotted. `docs/ART-BACKLOG.md`'s straight-edge entry is open
again, and that is the honest state: the cure was worse than the disease.

### 3. The "random interspersed water" is mostly real design, and one cell was not

Asked of the engine (wet at any tide, no wet 4-neighbour, seams crossed):
**8 stray water cells**, of which 6 are the deliberate paired `abyssHole`s in
Drowned Shore and Sunless Flat. Of the remaining two plus one fixed:

- **Kell Spur `0,3,5` 1,4 was `5` (channel) — FIXED to rockFloor.** `channel`
  is water at EVERY tide, so this was a permanent hole in the middle of a dry
  stone shelf with nothing feeding it. Unambiguously wrong.
- Wood Edge `0,4,3` 2,2 (`0`, tideGrass) and Coral Foot `0,11,5` 2,4 (`6`,
  reefFlat) are LEFT. Both are dry at most tides and read as meadow and reef
  rather than as water, and Coral Foot's has a mirrored partner at 7,4 that is
  not stray — breaking the pair would be imposing taste on a motif.

**The wider pattern is level design, not a bug, and was deliberately not
touched.** Rows like South Wood's `Tg1000011g` mix `1` (sandbar) and `0`
(tideGrass), which flood at different levels, so at mid tide the row reads
water/grass/grass/grass/grass/water. That IS "water of varying height
interspersed" — but the tide is this game's whole subject, and redesigning
tidal terrain is a design decision for a person, not a cleanup. Flagged here
rather than acted on. Most of the ugliness people were reading off those rows
was the ladder texture, which is gone.

### Verified

Everything in CLAUDE.md's table plus `check-tilesets` and `check-strands`,
green. `test.mjs` 83/83, `check-playthrough` 21/21, `replay.mjs` 51/51 — two
baselines (`d1-sluicegate`, `tide-steps-split`, both water rooms) needed
re-recording, and were confirmed ART-ONLY first: same frame count, same room
changes, EVERY CHECKPOINT matching, only `probePix` moved. Both picked up
`beaten`/`heartPieces`, closing part of the S24 coverage gap. All three rippers
re-emit byte-identically. `npm run build` + `check-build` OK.

### Two measurements that came back NEGATIVE — do not redo them

Both were prototyped, calibrated against known-good and known-bad art, and
rejected. They are written down because each looks like an obvious good idea.

**A "regular pitch" checker for terrain art does not work.** The idea: the
ladder fault has now been paid for three times (grass's fixed constellation,
the cobble that read as boulders, water's dashes), so detect a tile whose rows
or columns repeat at a sub-tile pitch. It does not discriminate. Period 8 is
UNIVERSAL and correct — a 16x16 game tile is four 8x8 hardware tiles — so only
periods 1, 2 and 4 are candidates, and there the old ladder `waterS` scores
50% and the perfectly good `waterD` scores 50% TOO. The difference between
them is not repetition, it is CONTRAST and whether the repeating feature forms
a continuous straight line across the cell. A checker that fires on correct art
and misses the fault is worse than none, so none was shipped.

**`waterD` is correct as it is; leave it alone.** It scores the same 50% as the
old ladder, which is what prompted the check. But rendered, it is a soft
LOW-CONTRAST field of broken dashes, and — decisively — the only dark-blue
seamless water on either overworld sheet is MORE banded than ours: AG 1504,24
and 1544,24 are purple horizontal bands with black dashes, and AG 1128,2480 is
strong light/dark banding. Extracting any of them would make deep water worse.
The hand-drawn tile beats the source here, which is rare enough to record.

**Depth discontinuity is not a defect either.** "Water of varying height that
doesn't make sense" suggested checking for a dry cell orthogonally adjacent to
a DEEP one — a cliff in the water. There are 159 at low tide, 375 at mid and
2,095 at high, and that is simply what a coastline is in these games: land
meets deep sea directly wherever there is no beach. Not actionable.

### What is NOT done

- **A real natural shore HAS now been found, and it is an engine task.** See
  `docs/ART-BACKLOG.md`'s top entry, rewritten: the source draws no bank at
  all, it draws a 1px dark scalloped rim on the WATER side, and `edgeArt` on
  water is silently ignored today because animated cells skip `artAt`
  entirely (`Room.render`: `if (d.anim) { animCells.push(...); continue; }`).
  That entry now specifies the work rather than describing a hope.
- **The 8 bank tiledefs are PARKED, not dead.** `validate.mjs` lists them under
  "no grid, block, transform or tiledef can reach", which is correct and is
  what that warning is for ("a vocabulary waiting for a place" — its own
  words). It was deliberately NOT silenced. Do not delete them to clear the
  warning; the long comment above `grass` in tiles-core.js says why.
- (The "find a natural shore" item above is now ANSWERED — see the
  ART-BACKLOG entry and the negative-results section. `waterD` is likewise
  settled: leave it.)
- Everything S24/S25 left open still stands.

---

## S25 — somebody finally LOOKED at the screens

THE JOB: show the changes on screen and keep iterating. Looking at them turned
out to be the work, which is what S23 and S24 both said it would be.

### The batch corner fix had put a masonry block beside every doorway

S22 solved a real problem — a corner tree's canopy overhung the first cell of
every doorway, narrowing all 158 of them — by replacing the corner TREE with a
non-quad solid, the region's own `#` cliff. Nothing was wrong with the
reasoning and every checker agreed. But `#` in the wood and marsh legends is
`cliffDk`, which is a CLIFF FACE: a flat grey slab with a lit top edge. One
cell of it, alone, in the middle of a green wood, does not read as a boulder.
It reads as a block of cut masonry somebody left there.

**It was on 97 of the 120 screens, 160 rows.** That made it the single most
repeated motif on the overworld map, and no tool in CLAUDE.md's table can see
it, because it is not a fact about the world — it is a fact about what the
world looks like, and every one of them was right.

The fix is the base legend's `o` (`rock`), which every region inherits and no
region in question overrides — a rounded natural boulder with `underArt`, so it
sits ON the ground rather than replacing it.

**IT IS AN ART FIX AND IT CHANGES NO PASSABILITY AT ALL, which is the whole
reason it was safe to do at this scale.** `tileset.js` reads
`if (f & F.ROCK) return true` — a rock is solid unconditionally, exactly like
`cliffDk`, and neither is a quad. `bush` was the obvious alternative and is
WRONG here: it carries `F.BUSH`, which `tileDefSolid` clears for a cutting
player, while every flood in the table runs `cutting: false`. A bush would
have been a hole the checkers could not model, next to a region gate, which is
the exact shape of the Dredge Line near-miss S23 spent its session on.

**The rule is deliberately conservative: a corner becomes a rock only when the
cell BESIDE it is a tree.** That is what distinguishes a stray block standing
in a treeline from a genuine 3-wide cliff run, and the 88 rows that are
`###gggg###` — real cliff bands, correct as they are — were left untouched.
155 cells across 56 screens changed; nothing else did.

Screenshotted before and after at `overworld,4,6` (South Wood) and
`overworld,7,4` (Drowned Hollow): grey slabs before, boulders nestled against
the treeline after.

### What was looked at and left alone

- **The Gyre's stone band.** S23 made its two bottom corner blocks cliff to free
  row 6. On screen that is a stone quay along the bottom of a tidal ring, and it
  matches the `###gggg###` cliff-band vocabulary the other 88 rows already use.
  Consistent, so kept.
- **Reedbank's sealed south border** reads as an honest solid treeline with no
  teasing gap. S23's judgement call looks right on screen as well as in the flood.

### Verified

Everything in CLAUDE.md's table plus `check-tilesets` and `check-strands`, all
green — `check-ground` included, which is the one that would have caught a rock
bringing its own lawn onto a screen that has none. `test.mjs` 83/83,
`replay.mjs` **51/51 with no re-recording** (no recorded route samples a changed
corner), `check-playthrough` 21/21. `npm run build` + `check-build` OK.

### What is NOT done

- **The other regions have not been looked at with the same eye.** This pass
  fixed one motif that repeated 160 times. Dunes, cliffs, salt, reef, coral and
  abyss screens were checked for THIS fault and for connectivity, not read as
  compositions.
- Everything S24 left open still stands: the `rip-terrain.py` hue-blind
  quantiser (four bank corners, measured), the replay baselines that predate
  `beaten`/`heartPieces`, and three unused dungeon sheets.

---

## S24 — the dungeon sheets land, and d4's walls stop being scribble

THE JOB: bring in the four per-dungeon Oracle of Seasons background sheets that
were sitting unmerged on `claude/oracle-build-script-coklp7`, use them, and keep
iterating.

### The sheets

Four added under the repo's naming convention, credited in
`assets/sheets/README.md`: `oracle-seasons-dungeon-ancient-ruins.png`,
`-dancing-dragon.png`, `-explorers-crypt.png`, `-poison-moths-lair.png`. A fifth
file on that branch was a byte-identical duplicate of Explorer's Crypt and was
dropped.

`tools/rip-dungeon-themes.py` can now read more than one sheet: a pick may carry
an optional 5th element naming a key in `SHEETS`. The refactor was proved
behaviour-preserving by re-emitting and diffing BEFORE any pick was added —
byte-identical, as CLAUDE.md requires.

**WHICH HALF OF A SHEET YOU ARE LOOKING AT IS MEASURABLE, AND YOU MUST MEASURE
IT.** Every one of these sheets is two halves side by side, "GBC LCD Colors" and
"True Colors", and neither is labelled in the pixels. The LCD half is the
LIGHTER, LESS SATURATED one: on ancient-ruins the left half runs mean luminance
124 / saturation 0.54 against the right half's 92 / 0.73. This is not academic —
the tile `laceWall` is a VIOLET lattice at x=1280, and its LCD twin near x=68
reads as pale BONE. Judged by eye they are two different pieces of art, and the
bone one is the wrong one. Recorded in the sheets README.

Finding a wall was done by searching for 16x16 blocks whose own neighbour in
BOTH axes is itself. That is what "tiles in both axes" means, and asking it of
the SOURCE makes it a fact rather than a judgement — the ripper's own wall note
records `hatchWall` and `forgeWall` being picked off a single-cell contact sheet
and coming out in game as picket fencing.

### What the sheets fixed: the Salt Pan Vault's wall was its own push block

`vaultBlock` and `coralWall` QUANTISE TO BYTE-IDENTICAL ART — they are both
bevelled block grids lifted from different rooms, and nothing said so. The Salt
theme drew `dWallSalt` and `dBlockSalt` with that one grid in that one `marble`
palette, so a block you can PUSH was pixel-for-pixel a wall you cannot. No
palette swap could have separated them; only different art could, and an ornate
lattice is different art at any tint. `dWallSalt` is `laceWall` now.

**Scope, stated plainly: the Salt and Palace themes are NOT LIVE.** The six
dungeons use Grotto, Coral, Bog, Cistern, Wood and Abyss; Salt and Palace are
left from the eight-dungeon plan that `docs/DUNGEON-STATUS.md` records as
FOLDED IN. So this fixed a real defect in a theme held in reserve, not one a
player can currently see. It is guarded now either way.

`tools/check-tilesets.mjs` gained the assertion: no dungeon may draw two of its
six themed roles with the same art AND the same palette. Palette is part of the
comparison because a swap is the house mechanism for reusing one art (d4 and d7
share `studWall` and differ by tint, which is fine). Verified by restoring the
old wall — it fails and names the dungeon.

### What going through the sheets found, which IS live: d4's walls were scribble

`studWall` is d4 Cliffside Cistern's wall and the only pick in this ripper with
more than four source colours. The quantiser's remap picked the nearest kept
colour BY LUMINANCE ALONE, which is hue-blind, and on a tile that spends its
four slots across two hues the dropped colours cross over:

    #5c8eb0  mid BLUE   lum 131  ->  #856b2b  GOLD  (lum 108)
    #dbb969  light GOLD lum 186  ->  #abcfe6  BLUE  (lum 199)

The two hues swapped, the black separators between the courses dissolved, and a
wall of clean vertical stud columns drew as gold tracery scribbled over blue.
The remap is squared RGB distance now, with the same tie-break on the colour
tuple that made the old one deterministic — so it is still reproducible, which
is the property the luminance version was chosen for. **Only tiles with more
than four colours can move**: at four or fewer, every colour remaps to itself
under any metric. Exactly one tile changed, `studWall`, and the room was
screenshotted (`node tools/shoot-rooms.mjs d4,0,2,2`) before and after.

### And the replay comparator could not compare an object at all

Re-recording d4's baseline (its wall art legitimately changed, so its pixel
probe had to move — behaviour was proved unchanged first: same frame count,
same room changes, and EVERY CHECKPOINT still matching, with only one of the
two pixel probes different) surfaced a latent bug in `tools/replay.mjs`.

`diffState` read:

    const same = Array.isArray(a) ? JSON.stringify(a) === JSON.stringify(b) : a === b;

An array was compared structurally; a plain OBJECT fell through to `a === b` —
reference equality between a value parsed out of the baseline file and a value
built inside the page, which is false every single time. It had never fired
because no baseline held an object-valued field. The recorder now captures
`beaten` (the set of dungeons cleared), so the moment a baseline was
re-recorded that replay could never pass again, reporting the uniquely useless
`beaten: expected {}, got {}`.

Objects are compared by value now, through a `canon` that sorts keys all the
way down — the two sides come from different serialisers and nothing makes them
agree on key order, so raw `JSON.stringify` would have swapped one false alarm
for another. Proved by editing the baseline to claim d4 was beaten: it fails
and says so.

**A live coverage gap this leaves:** the other baselines predate `beaten`
and `heartPieces` and therefore still do not check them — `diffState` only
walks the keys the baseline HAS. (S26 correction: there are ELEVEN baseline
FILES in tools/replays/, not fifty — the 51 in `replay.mjs`'s output is the
count of ASSERTIONS across them. Three now carry the fields.) Re-recording them all would close that, and
would also be exactly the kind of wholesale re-record that hides a regression,
so it wants doing deliberately on a tree already known good, one at a time,
reading each diff.

### The same bug is still in `rip-terrain.py`, and it is scoped

`tools/rip-terrain.py` carries its own copy of `quantise` with the same
luminance-only remap, and it has three lossy picks: `cliffTop`, `bankEdgeS`,
`bankCornerSE`. S21 already hit this and worked around it rather than fixing it
— its note reads "bankEdgeS needed an explicit GROUND_MERGE override (gold
masonry highlight and light-blue rim collide IN LUMINANCE)". That is this bug,
named, and patched per-tile.

Applying the same one-line fix there was MEASURED and then reverted, so the
follow-up is concrete: it changes exactly four tiles — `bankCornerSE` and its
three rotations/mirrors `bankCornerSW/NE/NW`. `cliffTop` and `bankEdgeS` do not
move (their overrides already settle them). Four bank corners is a small blast
radius but it is live art on the shore of every region, and S21 is explicit that
the bank is judged by screenshot (`node tools/shoot-rooms.mjs --tide=0|1|2
overworld,5,8`, Driftwood Strand). **Do it with eyes on, not blind.** The
GROUND_MERGE overrides should be re-examined at the same time: one of them may
become unnecessary, and a workaround left on top of a fixed metric is how a
tile ends up wrong in a new way.

### Verified

Every tool in CLAUDE.md's table plus `check-tilesets` and `check-strands`, all
green; `rip-dungeon-themes.py` and `rip-terrain.py` and `rip-dungeon-maps.py`
all re-emit byte-identically. `npm run build` + `check-build` OK.

### What is NOT done

- **Three of the four new sheets are unused** (`dancing-dragon`,
  `explorers-crypt`, `poison-moths-lair`), and honestly recorded as such in the
  README. They are per-dungeon rooms at full size and are the obvious place to
  look for the land/land fringe art and for any theme that wants its own floor.
- The `rip-terrain.py` remap fix above.
- S23's item stands: **nobody has LOOKED at the reshaped overworld screens.**

---

## S23 — the tree-crown fix audited, and the corridor it quietly took (this session)

THE JOB: audit S22's `quadCanopySolid` work — the Dredge gate, the Reedbank
judgement call, the playability of the rooms the fix shrank, and the two
`tools/test.mjs` edits — then continue the polish.

S22's own verification was **honest and reproduced exactly**. Every tool in
CLAUDE.md's table is green on its tree, including `replay.mjs` 51/51 to the
pixel and `check-playthrough` 21/21. `watch-cutscenes.mjs`, the one thing S22
could not get a clean read on, was run to completion here: **13 scenes, 0
scene-level faults.** Nothing it changed touched cutscenes.

But the audit found one thing every tool in the table was blind to, and the
tool written to catch it is the durable part of this session.

### The Gyre lost its southern half, and nothing could see it

`check-overworld` floods TILE by tile but keys `reached` on the ROOM. A screen
counts as reached the moment ONE of its cells is. S22 already knew this — its
notes say "print reached CELLS" — and used it to find the Bog Stair. It is the
same blindness that hid this.

Flooding on foot and diffing reached CELLS against `471752e` (the pristine
pre-change tree) shows the Dredge gate is **exactly preserved**: same three
screens sealed (`0,0,6`, `0,1,6`'s interior, `0,2,6`), same four reachable
doorway cells `3,7 4,7 5,7 6,7` in the Bog Stair, in both trees. Item 1 of the
audit is answered and the gate is real — the ONLY difference between a flood
that reaches the Marsh's north and one that does not is `F.HEAVY` in the mask.
No leak was moved. S22's `dredge: seals 2` is right.

The same diff also showed **29 cells that were walkable-and-reachable before
and were not after**, in ten screens. Fifteen of them were one connected
region spanning a seam: **The Gyre (`0,7,3`) rows 6 and 7, and Drowned
Hollow's (`0,7,4`) row 0** — the whole north-south corridor between the two
screens, severed on foot.

The Gyre is `TTTTTTTTTT` at row 0 and had `T` corners at rows 6-7; rows 2-5 of
its middle are riptide. So row 6's only links upward were `1,6` and `8,6`, and
both are canopy-covered by the corner trees. Row 6 went solid at both ends and
the whole southern lobe fell off the map.

**What was on the lost cells: the sign at `4,6`.** Its text is
*"The water here runs in a ring. Swimmers go round. Walkers go through."* —
the screen that TEACHES the Kelp-Soled Cleats. `player.caps.swim` is
`this._cleats > 0`, so swimming is the Cleats and nothing else. The sign
explaining the item had become readable only by a player who already had it.

Green while this was true: `check-overworld` 120/120 screens,
`check-progression` 120/120 with 6/6 dungeons, walk-dungeons, gates, towns,
placement, ground, respawn, hearts, items, bosses, replay and playthrough. All
of them. A room can lose half its floor and every one of them still passes.

**Fixed** by making the Gyre's two bottom corner BLOCKS cliff rather than tree,
so no quad sits in them and row 6's ends are free again:

    row 6  'Tgggff1ggT' -> '#gggff1gg#'
    row 7  'TT#gggg#TT' -> '###gggg###'

Both rows and the doorway are reachable again and the sign is back. Note it is
the whole 2x2 BLOCK that has to be cleared, not the one cell: `quadCanopySolid`
scans all four cells of `bx = x & ~1, by = y & ~1` for a quad, so leaving a
tree at `0,7` keeps `1,6` solid no matter what `0,6` becomes.

### `tools/check-strands.mjs` — new, and it is the point of the session

Floods on foot from Tidewatch Village with all four gates held OPEN (this tool
is about TERRAIN; a gate is proved in `check-overworld`, one drop at a time),
collects every foot-passable cell the flood never reaches, groups them into
connected regions **across seams** (the severed corridor was one region
spanning two screens and per-room grouping would have reported it as two
harmless pockets), and diffs against `tools/strands-baseline.json`.

It is a BASELINE, not a zero-assertion, because two kinds of stranded cell are
legitimate and both are in the recorded 24:

- **Water.** The flood walks. The Gyre's 10-cell riptide ring is meant to be
  unreachable on foot — that is the screen's argument, and it is stranded in
  the pristine tree too.
- **One-cell root pockets, 14 of them.** A border treeline is two rows deep;
  `quadCanopySolid` solidifies the canopy (even) row and leaves the root (odd)
  row walkable on purpose. Where a one-tile verge ran up alongside such a line,
  its odd rows survive as isolated single cells. They RENDER AS TREE ROOTS
  inside the treeline, they hold no entity (checked), and being unreachable is
  correct. Left alone deliberately.

A region that GROWS or APPEARS with more than one cell fails. Verified by
reintroducing the Gyre regression: it reports the 14-cell region by name across
both screens and exits 1. `--record` re-records, `--verbose` lists.

### Audit answers

1. **The Dredge gate is real.** Proved above, cell by cell, against pristine.
2. **Sealing Reedbank's south border was right — keep it.** The pristine state
   was a DEAD-END VESTIBULE: Reedbank's row-7 gap led into four cells of Bog
   Causeway's row 0 that had a solid tree wall (`TfTTTTTTgT`) behind them and
   went nowhere. S22's `TTTTTTTTTT` removes the tease from the Reedbank side,
   and the Bog Causeway side is sealed **by the canopy rule itself** — row 0 is
   an even row and row 1's tree wall is in its blocks, so the drawn gap is
   crown. Coherent. A second gate tile here would be redundant: the Dredge gate
   is the `M` boulders in the Bog Stair and the flood proves they are its sole
   cause. **The landmine to write down:** thinning Bog Causeway's row-1 tree
   wall silently unseals the region. It IS caught — but by `check-overworld`'s
   SEAM assertion, not by its dredge count, which still reported `seals 2` with
   the wall thinned. Do not read the gate counts alone.
3. **Playability of the shrunk rooms.** The Gyre was not a readability
   complaint, it was a severed corridor, and it is fixed. Of the rest, nothing
   larger than a single decorative cell moved. `0,4,6` South Wood losing row 6
   is correct and reads fine — it is the bottom border treeline. This item is
   now closed as far as connectivity and cell-level reachability go; what is
   still NOT done is a human looking at the screens.
4. **The `test.mjs` edits are correct and the assertions are not weakened.**
   Both still require `progress.hearts` to fall. Clearing `hurtTime`/`knockTime`
   alongside `invuln` makes the test exercise the path it names rather than
   passing by accident, and the enemy is force-teleported onto the player
   (`e.x = g.player.x`), so the hit is never incidental. Moving the entry from
   `72,56` to `72,24` moves it off the zol's spawn tile, which was also the
   recorded respawn point.

### Verified

Every tool in CLAUDE.md's table, plus the new one: validate, walk-dungeons,
check-overworld 17/17, check-progression 19/19, check-gates 26/26,
**check-strands (15 regions, 24 cells)**, solve-switches, check-towns 67/67,
check-placement, check-ground 7/7, check-camera, check-wide-rooms,
check-respawn 60/60, check-hearts 114/114, check-items 91/91, the six item
checkers, check-trade, check-motion, check-torches, check-bosses 19/19,
check-dialogue, check-sfx, check-music, check-audio-render, check-feel,
check-text, **watch-cutscenes 13/13 scenes 0 faults**, `test.mjs` 83/83,
`replay.mjs` **51/51 to the pixel, no re-recording**, and
**`check-playthrough` 21/21**. `npm run build` + `check-build` OK.

### What is NOT done

- **Nobody has LOOKED at the reshaped screens.** Connectivity and cell-level
  reachability are now both proved; register and composition are not. The
  batch corner fix put a `#` cliff corner into ~158 screens and two stone
  corners into the Gyre, and no tool can tell you whether a stone corner reads
  right in a wood screen. `node tools/shoot-rooms.mjs --tide=0|1|2 overworld,7,3`.
- The 14 one-cell root pockets are left as decor. If a future session wants
  them gone, the fix is to make the pocket solid, not to reopen the canopy.
- S21 Phase 2 blob work is still a slice. `docs/ART-BACKLOG.md`'s top entry
  stands.

---

## S22 — Link cannot stand on a tree any more (this session)

THE JOB, in the user's words: audit S21's work for out-of-place tile styles,
tilesets and clashing themes against the Oracle source overworld; and "Link
should not be able to walk on top of tree tiles."

The audit part is small and done: one real defect, the `bank` tile's rim had
lost the cream highlight the source draws on it (`471752e`). Screens across
marsh, wood, coast, dunes, cliffs, salt, coral, abyss, reef and town were
read against the sheets and nothing else was out of register.

The tree part is the session. **It is finished and everything is green,
including `check-playthrough`** — but read the rest of this before touching
`quadCanopySolid`, because the shape of what it broke is the interesting part.

### What the bug actually was

41% of this world's trees are placed ONE ROW THICK. A tree is a 32x32 quad on
a fixed 2x2 lattice (`bx = x & ~1`, `by = y & ~1`), so a one-row tree gets the
other half of its sprite drawn onto the neighbouring cell by `quadMayCover` —
and that cell keeps its own tiledef, plain grass or plain sand, carrying none
of the tree's flags. So the game drew a full leafy crown, seen from above,
over ground you could walk out onto and stand on.

The first attempt changed `quadMayCover` — i.e. stopped drawing the overhang.
That is wrong and `check-ground` says so out loud (427 quadrant failures: "no
32x32 object is cut short by plain ground"). Rendering was never the problem.

The fix is `Room.quadCanopySolid` (`src/world/room.js`), called from `solidAt`
BEFORE `tileDefSolid`. Read its comment; the two decisions worth keeping are:

- **Only the canopy (even-`y`) half is solid.** The root half stays walkable
  on purpose — a root mound is a ground-level decal, and roots over a verge is
  how the source draws a tree standing beside a path.
- **Water keeps its overhang passable at every tide the cell is EVER wet**,
  not just the level being asked about. A branch over a stream is something you
  swim under; and a `mudflat`/`sandbar` is dry at some levels and wet at
  others, so solidifying one only at its dry levels silently seals routing the
  tide field already proved open.

### What it broke, and why the repair is spread over 60-odd screens

The border template. Nearly every screen is framed `TTTggggTTT` — three-wide
tree corner, four-tile gap, three more trees — and the corner's inner tree
shares a 2x2 block with the gap's first cell. Making crowns solid therefore
narrowed EVERY doorway on the map by one tile at each end: 158 screens at
once. The repair is to make that corner cell a non-quad solid instead (`#`,
the region's own cliff), so the block holds no tree and nothing overhangs.

Then a second, structurally different class: `y & ~1` is absolute, so row 0 is
ALWAYS the canopy half and row 7 is ALWAYS the root half. Every north-south
seam therefore pairs a blockable row against an exempt one — a room's top
border can be sealed by trees in the row behind it, and its bottom border can
never be sealed by anything. There is no fixing that from the root side. You
either clear the interior trees (open it) or close both sides with real solid
tiles. `TgggTTgggT` — a decorative pair of trees mid-doorway — is the motif
that triggers it; 12 instances, all cleared.

`Village Shore` is the town case CLAUDE.md warns about: two 3x3 buildings
leave exactly one lane across the screen, and the crowns of the corner trees
took it. Its bottom corners are stone now.

### The Dredge Line nearly got deleted, and this is the part to be careful of

Mechanically applying "fix the seam by opening it" removed a region gate that
no gate-shaped tile was implementing. The Bog Causeway draws the usual
four-tile gap on its north border and has a SOLID LINE OF TREES immediately
behind it — so nothing has ever reached that opening from inside the room.
That unreachable gap is the entire reason the Marsh's northern screens sat
behind the Dredge Line's boulders. Clearing those trees to "match the
neighbour" opened a road straight into them and `dredge: seals 0`.

It is now closed on both sides (Bog Causeway's tree wall restored, Reedbank's
south border fully sealed), plus the Bog Stair's ledge shelf ends in rock
again — its side lanes had been held shut by the crowns of the very corner
trees the batch fix replaced. `dredge: seals 2`, matching the pristine
baseline exactly.

**Two debugging notes that cost real time.** `check-overworld`'s `reached` set
is keyed on the ROOM, not the cell — a screen whose only reachable cells are
one doorway counts as reached and never shows up as sealed, which is why the
Bog Stair looked fine while its interior was unreachable. Print reached CELLS.
And `cliffCracked`/`cliffCrackedDk` (the `X` in the marsh legend) is
`F.BOMBABLE`, not `F.HEAVY` — it is a bombs gate, not the dredge gate; the
dredge gate is `M` (`boulder`).

### Two harness fixes, both real

`tools/test.mjs` cleared `player.invuln` to force a contact hit but not
`hurtTime` — and `update` returns early for the whole knockback, so contact
damage never got a look in. It passed before only because the room's zol used
to wander off the tile the test spawns Link on; with the tree line now walled
it stays put and hits him on arrival. The same tile was the recorded respawn
point, so the death test respawned him onto the zol. Both entry points moved
two tiles clear.

### Verified

Everything in CLAUDE.md's table, all green: `check-overworld` 17/17 with all
four gates sealing their own regions, `walk-dungeons` 23/23, `check-progression`
19/19, `check-gates` 26/26, `check-towns` 67/67, `check-placement`,
`check-ground` 7/7, `check-camera`, `check-wide-rooms`, `check-respawn` 60/60,
`check-hearts` 114/114, `check-items` 91/91, the six item checkers,
`solve-switches` (9 rooms, all solvable by real pushing), `check-bosses` 19/19,
`test.mjs` 83/83, **`replay.mjs` 51/51 to the pixel with no re-recording**, and
**`check-playthrough` 21/21**. `npm run build` + `check-build` OK.

### What is NOT done

- The S21 Phase 2 blob work is still a slice. `docs/ART-BACKLOG.md`'s top
  entry and S21's own section below are still the right brief for it.
- `quadCanopySolid` walls a whole row wherever a room has a full-width tree
  line one row above open ground (`0,4,6` South Wood loses row 6 entirely).
  That is CORRECT — those cells are drawn as crown — but it shrinks some
  rooms noticeably and nobody has looked at them with an eye to whether the
  rooms still play well. Connectivity is proved; playability is not.

---

## S21 — the shore is a bank now, and the mud clearings started losing their corners (this session)

THE JOB was three phases from `docs/ART-BACKLOG.md`'s top entry and
CLAUDE.md's overworld-design prompt, in order: (1) a real 4-neighbour mask
autotiler plus one land/water pair end to end, (2) the regional SHAPE of the
ground (organic blobs, not rectangles), (3) a tile-integration overlap pass.
Phase 1 is DONE and thorough. Phase 2 is a verified SLICE, not the whole
job — it was never going to fit one session; ART-BACKLOG says so and it was
right. Phase 3 found nothing to fix.

### Phase 1 — done, and worth reading `src/world/tileset.js`'s `tileEdgeArt` before touching it again

`tileEdgeArt` now reads all 4 neighbours and classifies: 0 differ → plain,
1 differs → a straight edge, 2 ADJACENT differ (e.g. up+left) → an OUTER
corner, 2 OPPOSITE differ (a 1-tile-wide strip) → degrades to a single edge
(no art for this, on purpose — see ART-BACKLOG), 3 differ → an INNER corner
(no art exists for this yet either), 4 differ → degrades the same way as the
opposite-pair case. A tiledef opts a neighbour comparison IN with `family` +
optionally `edgeAgainst` (a family name or array) — `edgeAgainst` narrows
"draw an edge" to "draw an edge only against THIS family", which cliff does
not use (it wants a lip against anything) and grass/sand DO use (`'water'`
only, so grass next to sand/mud stays the hard rectangle that is still
correct there).

The actual bank art: `bankEdgeS`/`bankCornerSE` are real extractions off
`oracle-ages-overworld.png @ 50,1200` (a garden pool's shore — NOT the
1400,1900 crop the S19 ART-BACKLOG note pointed at; that turned out to be
Ambi's moat, a lock-puzzle canal, and its "bank" is walled masonry with a
reflection-sparkle rim that quantises badly). The other 6 orientations
(`bankEdgeN/E/W`, `bankCornerSW/NE/NW`) are ROTATIONS and MIRRORS of those
two — `tools/rip-terrain.py`'s `TRANSFORMS` — not separate crops, and not
authorship: the source's own lighting (pale rim toward land, dark earth
toward water) is rotationally consistent, so a rotated real capture and a
mirrored one are the same pixels a second real capture at that angle would
have. `bankEdgeS` needed an explicit `GROUND_MERGE` override in the ripper
(gold masonry highlight and light-blue rim collide in luminance, see
HANDOFF) — the same fix pattern `TOWN_MERGE` already used.

**A real, previously-invisible engine bug was found and fixed along the
way**, and it is worth its own read in `src/world/room.js`: `palFor`.
`Room.render`/`renderAt` drew every `artAt` substitution (an `edgeArt` or
`variants` swap) in the ORIGINAL cell's palette, not the substituted tile's
own. Invisible for the whole life of `edgeArt` because `cliffTop` and every
grass variant happen to share a palette with what calls them; the bank tiles
do not (blue/brown against grass's green) and rendered as a green stripe
shaped like a bank until this was traced down. Side effect: every regional
cliff (`cliffSand`/`cliffRust`/`cliffCoral`/`cliffMarble`/`cliffAbyss`) now
draws its lip in `cliffTop`'s own `stone`, not the body's tint — screenshotted
at `overworld,1,7` (marsh, `cliffDk`) and it reads as an overhang, not a
regression; nowhere else was screenshotted for this specifically, so a
session with time to spare should look at a `cliffSand`/`cliffRust`/
`cliffCoral`/`cliffMarble`/`cliffAbyss` screen and confirm the same.

`family: 'water'` is on `waterS`/`waterD`/`openSea` only — deliberately NOT
on `waterSReef`/`waterDReef`/`waterAbyss`/the riptides, so reef and abyss
keep their current look and no room silently changed near them. Extending
the bank (or a reef-specific edge) to those is future work, named in
ART-BACKLOG.

**Judge by screenshot**: `node tools/shoot-rooms.mjs --tide=0|1|2
overworld,5,8` (Driftwood Strand) is the clearest single room — a channel
banked on all 4 sides plus two corners, at all three tides. `overworld,6,7`
(Sunken Reef) shows grass-bank and sand-bank together, and shows the reef
water NOT banked (deliberate, see above).

### Phase 2 — a verified slice: 15 of ~27 wood/marsh screens, and a survey of the rest of the map

`tools/oneshot/find-ground-specks.mjs` is NOT the tool for this job — it
finds 1-2 tile flecks touching a void/prop/pit (a room's own geometry, not a
misplaced patch), and triaging its 84 hits found effectively zero genuine
"stray tile in an open field" cases. The actual rectangle problem (grass vs
mud drawn as a hard-edged block) has to be found by eye, room by room, the
way ART-BACKLOG's own crop comparison does it.

**Done, verified, screenshotted — 8 of the wood region's 15 screens:**
`0,5,3` Rotting Grove (the room CLAUDE.md's prompt names), `0,6,6` Wood Foot,
`0,4,6` South Wood, `0,4,5` Bog Trees, `0,4,4` Shrine Path, `0,6,5` Sunken
Glade, `0,4,3` Wood Edge, `0,6,3` Wood Gate. **And 7 of the marsh region's
12:** `0,0,6` Bog Head, `0,0,7` Mire, `0,1,7` Sanctum Path, `0,2,8` Sunken
Reeds, `0,2,7` Bog Causeway, `0,1,6` Bog Stair, `0,2,6` Reedbank.

The shape and the technique are the same across all 15: a mud clearing
(wood) or grassDark/mud mix (marsh), usually framed by trees, with the
mud/grass boundary staggered by ONE cell on one or two rows (a row's
leftmost or rightmost mud cell → the surrounding material), turning a
straight edge into a shape with at least one notch. Never touches: tide
digits, mudflat (`!`), channel (`5`)/drownWall (`9`) tiles, ledges, rocks
(`o`), signs, entities, dungeon-gate blocks, or the framing trees themselves
— every edit is a single legend character, chosen to land on a cell that is
plain `.`/`,` mud in the room's OWN legend, with the room's actual entity
list checked first so nothing moved onto or off of a spawn point.

**Left alone, and why — this is a real boundary, not just "not done yet":**
- **7 wood screens**: the closed riptide ring (`'0,7,3' The Gyre` — explicit
  comment in the source says its circulation is load-bearing), a channel
  room, the D5 gate room (`portalD5`), a ledge-bounded room, and three rooms
  whose ground is almost entirely deep water/tide digits with only 1-2 loose
  mud cells left — not a rectangle to soften.
- **5 marsh screens**: all sit on the ocean rim, where most of the room grid
  is `*` (open sea) rather than land, so there is no clearing shape to work
  with.
- **Every other region — untouched, unsurveyed beyond a dump-and-read
  pass this session**: `cliffs` (16 screens) and `dunes` (19) are the
  Cliffs-of-Kell/dune-flats puzzle areas — boulders, cracked walls, drownWall
  tide gates, liftable rocks in specific positions — and what LOOKS like a
  ground rectangle there is usually a puzzle room's playing field, not a
  meadow; reshaping it by eye is a materially different and riskier job than
  the wood/marsh clearings. `reef` (16), `coral` (8), `salt` (12) and `abyss`
  (8) mostly pair a ground material with its OWN palette variant (`sand`/
  `sandRipple`, `rockFloor`/`rockFloorDk`) rather than two different
  materials, which is a scatter-variant question (`tileVariant`, already
  solved) more than a rectangle-boundary one. `coast` (10 explicit screens)
  was dumped and read; none of the 10 has a static grass/sand/mud rectangle
  — what sand there is comes from tide digits, already tide-reactive.
- **Verify after EVERY room, not every batch of three** if the next session
  wants to move faster than this one did — `validate.mjs` catches a malformed
  grid instantly and is nearly free; the full battery
  (`walk-dungeons`/`check-overworld`/`check-progression`/`check-towns`) is
  what actually proves nothing strands, and it is cheap enough (a few seconds
  each) to run after every 2-3 rooms rather than saving it for the end.

### Phase 3 — checked, nothing to fix

`node tools/check-ground.mjs` reports zero in every category (stuck props,
covered doorways, flickering overhangs, cut-short trees, incomplete tree
lines, shaded triple-props, people in overhangs) — all its conditional
report blocks printed nothing, meaning their arrays are empty. Also checked
directly: zero props render standing on a `bankEdge*`/`bankCorner*` tile
(the new bank art didn't create a new overlap class). No new assertion was
needed because nothing new was found broken.

### What was NOT verified, and exactly where to look

- **The cliffTop-palette fix was screenshotted in 5 regions**
  (`overworld,1,7` marsh/`cliffDk`, `overworld,4,0` salt/`cliffMarble`,
  `overworld,8,4` coral/`cliffCoral`, `overworld,8,7` dunes/`cliffSand`,
  `overworld,0,0` abyss/`cliffAbyss`) and all five read fine — no clashing
  lip anywhere. Not exhaustive (it touches every cliff cell in the game), but
  no longer a one-sample check.
- **The land/land fringe (grass-sand-mud-stone meeting each other) is
  entirely unstarted.** Every screenshot in the judging list still shows a
  hard rectangular edge wherever two LAND materials meet each other; only
  land-meeting-WATER has a bank now.
- **Reef and abyss shorelines were not looked at with fresh eyes.** They kept
  their pre-existing rockFloor-meets-water look; whether that already reads
  right or wants its own bank treatment was not evaluated this session.
- Stand in `dist/oracle-of-tides.html` at Driftwood Strand (walk east from
  the start, it is a short walk) at all three tide levels — press the conch
  item and use it — to see Phase 1 at its clearest. Rotting Grove is the wood
  region, reachable from the village; the notched mud clearing is Phase 2.

---

## S20 — the game has been played to the end of a dungeon (this session)

`node tools/check-playthrough.mjs` drives a new game from the title screen with
nothing granted, no warps and no flags set from outside, and it comes out of
Tidewash Grotto **holding the Essence**. 24,630 frames, 197 directives, no
death. Three Small Keys, the Boss Key, four Pieces of Heart, the Heart
Container they make, both anchor gates in each wing, both pairs of gauges, and
Gohmaraq killed in real combat.

For the whole life of this harness the assertion at the top of
`check-playthrough.mjs` has been a STOPPING POINT — first the Sluicegate,
because the actor could not place the Anchor; then the Iron Pipe's far side,
because it could not fight a boss. It is an Essence now, plus the kill and the
Container.

### The boss verb learned one thing and it is not a dodge

Two sessions answered this fight's chip damage with a DODGE — a movement made
*instead of* fighting, keyed off a boss's state — and both measured worse than
doing nothing and were reverted. `evade` (tools/actor-runtime.mjs) is the other
half of that idea: **it never adds a move**. It takes the mask the fight
already chose and, only on a frame where that mask walks the player into
something about to occupy the same pixels, swaps it for the nearest mask that
does not. A dodge changes WHEN the player re-enters range and the shift
cascades; this fires only on frames a hit was coming, so what comes out is the
same fight minus those hits.

Swept, because one seed is one sample and this repo has mistaken a seed's swing
for a fix twice. `measure-boss-combat.mjs <d> --seed=N` is new for exactly
that. Wins out of four seeds, in-order health, no god mode:

|        | d1  | d2  | d3  | d4  | d5  | d6  |
|--------|-----|-----|-----|-----|-----|-----|
| old    | 0/4 | 1/4 | 2/4 | 4/4 | 3/4 | 0/4 |
| this   | 4/4 | 0/4 | 1/4 | 4/4 | 1/4 | 0/4 |

D1 is the one this session needed and the one the old verb could not win on ANY
seed — 0 of 6 tried, never better than 24 hp down to 18. This wins it **12 of
12** seeds. **D2, D3 and D5 are a real cost and are not dressed up**: all three
were already coin-flips, and reshuffling a knife-edge reshuffles which side it
lands on. `--no-evade` reproduces the old row exactly, so the trade stays
measurable rather than becoming folklore.

The horizon (`SHOT_HORIZON = 30`) was swept 24/30/36/40/45/50/55 over five
seeds: 24, 30 and 36 win all five and 40 up start dropping them. **30 is the
middle of a plateau, not a spike** — which is the whole difference between this
and the two reverted attempts. Above ~60 something is always a threat, the
actor never closes, and every seed deals exactly 18/24.

Three things had to be true for it to hold, each found by losing a fight:

* **The target is not in its own hazard list.** Counting the boss makes every
  approach look unsafe and the actor circles it forever. What the boss gets
  instead is a veto on RETREAT masks only: an escape may not be toward it.
  Applying that veto to an approach pushed the actor away from every opening.
* **Standing still is not an option for a walker.** `dGoto` passes `noStay`. A
  stationary enemy in a doorway makes every direction cost something and makes
  standing still cost least, so the actor stopped dead in front of it, `dGoto`
  replanned onto the same path for two thousand frames, and the thing it was
  standing next to ate eight quarter-hearts.
* **Frames guarded by `p.invuln` are immune, so avoiding hazards in them is
  pure disruption.** Those branches keep plain `fence`.

### Three faults the long route found, none of them in the boss

* **A goto was addressed to one room and did not know it.** `dFight` has had
  that guard since P3; `dGoto` did not, which matters the moment a goto's
  TARGET is a warp tile. Walking onto the return stair out of the Two Gauges
  warped the player into the Tide Gallery and the same goto carried straight on
  toward tile 7,6 of THAT room, through its tektite and its crab: sixteen
  quarter-hearts to nothing in 596 frames, with the next directive still
  patiently waiting to be a `wait`.
* **A drain at LOW is an open pit, and a pit is not solid.** `canOccupy` said
  yes and `dAnchor` — which walks to tiles chosen from geometry rather than
  from a path — fell into two of them in the Iron Pipe, at two quarter-hearts
  each. `standAt` in `src/game/entity.js` is the engine's own "somewhere to put
  your feet" rule now: `canOccupy` plus the flags that hurt. `findSafeTile` was
  the only thing that had it and it had it inline.
* **The Bluff Grotto's Piece of Heart misses a tile-centred player by ONE
  PIXEL.** It sits on row 2 with rows 0 and 1 solid wall, and it settles at
  y=27 — box 31..41 against a player's 41..48 — so `dLoot`'s existing "try one
  tile north" retry had nowhere to go. Leaning on the wall puts him at y=24 and
  picks it up. Two of the four Pieces this route needs were uncollectable
  without it.

### The route is a player's route, and the comments say why at every turn

* **The sea goes DOWN to cross the Drowned Chamber.** Walked at MID it cost six
  quarter-hearts a crossing, twice, and killed the run on the way back; fought,
  nine of twelve. At LOW the pool is a floor of holes, an aquatic enemy out of
  water is asleep before it can flop, and the dry ring round the edge is
  walkable at every level. Free both ways, and it lands the sea exactly where
  the Long Race wants it.
* **Bite 7,3, not 8,3, in the Long Race and the Long Sluice.** The wells (or
  drains) are columns 5-8 and the held patch is a radius-2 square, so 7 covers
  5..9 and 8 leaves column 5 on the wrong side. Same correction as the Iron
  Pipe's 2,3, from the same cause: `check-anchor.mjs` is right about REACH and
  silent about the crossing.
* **The Sluicegate's floor is DEEP at HIGH and its south doorway opens into
  it.** Walk up out of the Locked Stair at HIGH and you are in water over your
  head with the room you want on the far side. Two soundings first.
* **The stair out of the Two Gauges lands the player ON TOP of the Tide
  Gallery's tektite** — the warp's exit tile is 4,3 and the tektite's spawn is
  4,3, with a crab in the next column. The first cut walked straight through
  and was dead 120 frames later with no directive noticing.
* **The Clawcrab is fought, and it is a miniboss, so it is not `g.boss`.**
  `defineBoss` builds it and its `init` clears `isBoss`, because
  `progress.beaten` is keyed off the MAP and a miniboss counted as a boss would
  mark the whole dungeon beaten. The directive names what it is fighting:
  `['boss', 6000, 'clawcrab']`. `dFight` cannot take it — it died in 480 frames
  from a full twelve.

### Health is the route, and the Container is the whole budget

Gohmaraq walked in at 12 quarter-hearts loses; at 16 he is killed with 4 to
spare. So the route collects four Pieces of Heart — the Bluff Grotto's, the
Reef Hollow's, the Clawcrab's, and the one behind the Clawcrab door — and the
Container completes on the fourth, two rooms before the boss door, refilling to
the new maximum. **That ordering is the health budget for the whole run and it
is not an accident.**

Shell Flats (0,10,8) has a fifth piece and the route does NOT go for it: the
round trip costs about ten of twelve quarter-hearts, Sandpiper Row is crossed
twice, and the run died there. Recorded so it is not retried blind.

### And a death takes what was on top of the game with it

`respawn` sets `mode = 'play'` unconditionally, which is a claim about what the
game is doing, and nothing else was torn down with it. A text box (which
returns out of `update` before the player moves — a respawn room nobody can
walk in), its queue, a cutscene, a pending fade callback and the item and room
banners all survived a death and landed on the room the player was put back in.
`Dialogue.reset` is new and is not `close`: closing a box is a box being READ,
it fires `onClose` and pulls the next page up, and nothing was read. Six of
`check-respawn`'s new assertions go red with the teardown removed.

It had also never met a boss. Dying to Gohmaraq in a fight that is actually
running is asserted end to end now: the continue lands at the dungeon MOUTH,
the boss handle is let go (it used to dangle and the HUD drew a bar for a
ghost), the dungeon is not marked beaten, and the claw is still standing at
full health when the player walks back in. 60 assertions.

**The whirlpool is gone.** `Game.enterWhirlpool` fired off `F.WHIRL`, no
tiledef ever carried that flag, and no room ever defined a `whirlpool`
destination — so the path was unreachable and its only live branch sent the
player to his last respawn point, which reads as a death he did not die.
Deleted rather than given a destination: inventing a screen to make an
unreachable branch reachable is the tail wagging the dog. Bit `1 << 20` is
free. Its SOUND was not wasted — `whirl` had sat in the audio table unplayed,
and Thalassor's whirlpool, the one mechanic that fight is built on, dragged the
player's feet in silence. It has the ripple's beat now.

### Art: a pot with a rim, and six bells

See `docs/ART-BACKLOG.md`. The `pot` is extracted (Seasons' dungeon
backgrounds at 900,42 — NOT the Subrosia tileset, which is where two sessions
looked), and the six Essences are six different bells instead of one orb six
times.

**Ground boundaries are still a straight pixel edge and were deliberately not
half-fixed.** The investigation is in `ART-BACKLOG.md` and one of its findings
overturns a claim that entry has carried since S3: **the shore is not blocked
by the sheets.** S3 reasoned from FOAM, which is drawn on the water side and
animates; the source's own answer is a BANK on the LAND side, and it is as
static as `cliffTop`. What blocks it is the engine — `tileEdgeArt` takes the
first direction that matches and stops, there are no corner pieces, and a
transition cell holds both materials' tones so each ordered pair wants its own
palette.

### feel.js untouched

240 constants, 0 measured / 17 derived / 223 guessed, exactly as it was.
Nothing was relabelled, because nothing was frame-stepped.

### Verified

```
check-playthrough 21/0   test           83/0    replay          51/0
check-respawn     60/0   check-bosses   19/0    check-items     91/0
walk-dungeons     23/0   check-overworld 17/0   check-progression 19/0
check-anchor      14/0   check-gates    26/0    check-hearts   114/114
check-placement    2/0   check-ground    7/0    check-tilesets   6/0
check-guide        4/0   check-text     OK      check-sfx       OK
solve-switches    OK     validate       OK      check-build     OK
```

`tools/rip-terrain.py` was run before anything was changed and reproduced
`src/data/tiles-terrain.js` byte-identically, per CLAUDE.md.

### Boss combat sweep, 36 seeds a side: D1's win is real, D2/D5 were noise, D3 is real and still open

The four-seed table above was not enough to believe, and it lied about two
bosses. Swept `measure-boss-combat.mjs <d> --seed=N` (and `--no-evade`) to 36
seeds a side. Wins out of 36, in-order health, no god mode:

```
       d1     d2     d3     d4     d5     d6
old    1/36   4/36  25/36  36/36  10/36   0/36
now   31/36   5/36  15/36  36/36  13/36   0/36
```

**D2 and D5 come out level** (Fisher's exact p=1.00 and p=0.61) — the 4-seed
table's "real cost" on both was the seed sample, not the boss. D5's damage log
confirms it independently: it is almost entirely projectile and summoned-zol
contact, never `rootmaw` itself. **D1 is confirmed real and is now the biggest
number in the table** (1/36 to 31/36 — the 4-seed "0/4" undersold it, not
oversold it). **D3 is a real, significant regression** (p=0.032 at 36, p=0.0089
against `--no-evade`) and stayed real at every sample size this session tried.

D3's damage log names the mechanism: `hazards()` (tools/actor-runtime.mjs)
deliberately excludes the boss the player is fighting — counting it makes
every approach look unsafe and the actor circles forever, which cost D1 the
win outright when tried — so a swap chosen to dodge a summoned zol's shot had
nothing telling it Gloomtide's own body was standing in one of the eight
candidate cells. Seed 20260806 took three separate 4-quarter-heart
`gloomtide` contact hits while a zol was on screen, all from the
shot-avoidance swap relanding the player on the boss.

Built and shipped `noContact`/`noContactVel` on `evade`: a candidate whose
projected one-frame box would overlap the boss — using the boss's own
estimated velocity, not just its current position — is vetoed, narrower than
the existing `avoid` retreat veto (which forbids any direction with a
component toward the target and was already measured to push the actor away
from every opening when tried on an approach). It fixed exactly the bug it
was built for: seed 20260806 went from three `gloomtide` hits to one, and
from a loss to a win. **It did not move D3's aggregate row** — 15/36 before
it, 15/36 after, two seeds flipped each way — and cost nothing on any of the
other five bosses at 36 seeds. Shipped anyway, on its own merits (a swap
landing on the entity it was built to route around is a bug regardless of
whether it's the dominant cause of D3's losses), not on a claim that it fixes
D3. The full reasoning and the sweep numbers live in the comment above
`evade` in `tools/actor-runtime.mjs`.

**What is very likely the rest of D3's gap, not attempted this session:**
`hazards()` gives every non-projectile enemy `vx:0, vy:0` — a summoned zol or
gel closing on the player is exactly as invisible to `moveCost` as the boss
itself used to be, and D3's damage log is mostly small `gel`/`zol` contact
hits, not boss hits. That is a `hazards()` fix (give walking enemies a real
one-frame velocity estimate, the same trick `noContactVel` uses for the
boss), not an `evade` one, and it touches every caller of `evade` —
`dFight`'s room-clearing included — so it needs its own sweep across d1-d6
AND a `check-playthrough`/`replay` pass before it ships, not just a D3 number.

### Hand it back — what was NOT verified

* **Nobody has looked at the six Essence bells in the quest MENU at 1x.** The
  title cards were screenshotted and are right; the menu row draws them 18
  pixels apart at native size and has not been seen. Open the map/quest screen
  with an Essence taken.
* **D3's regression is real and still open.** `noContact`/`noContactVel`
  fixed the bug they targeted without moving D3's win rate — see above. The
  `hazards()` static-velocity theory is a hypothesis from one damage log, not
  a measured fix.
* **The playthrough is ONE seed.** It is a tape and it replays to the pixel,
  which is the point, but it does not say the route is robust — only that this
  run happened.

---

## S19 — dying stopped costing an hour (this session)

`progress.respawn` was set once, by `newProgress`, and NOTHING in the game ever
wrote it again. Every death anywhere — the Abyssal Keep's boss room, a cave on
the far rim, the seafloor of D6 — put the player back on the tile outside the
Maku Tree in Tidewatch Village. Nothing was lost except the walk, and the walk
is the part the player has already done.

`Game.markRespawn` now takes the point:

* **outdoors**, on every screen, re-taken at every seam and every warp;
* **inside anything** — a dungeon, a cave, a shop, a house — ONCE, on the way
  in. Stairs between a dungeon's floors do not move it, so dying on D2's floor
  1 puts you at D2's mouth rather than back in the room that killed you.

The point carries the SEA it was taken at, because `respawn()` used to force
MID and MID is not a level you can stand at in a seafloor room. It is clamped
into its room, because `entryPos` legitimately hands a player crossing a seam
an x of -3. And `respawn()` writes the slot, so a player who dies and closes
the tab on the game-over screen does not lose the run.

**What was NOT broken and is not changed:** the run's state. Items, keys, boss
keys, dungeon maps, opened doors, opened chests, flags, Essences, rupees and
heart containers were always preserved through a death — `resetRooms()` is a
new game, not a death — and `check-respawn.mjs` now asserts each of them so it
stays that way.

`tools/check-respawn.mjs` is new and is in CLAUDE.md's table. 42 assertions; 16
of them go red with the recording disabled, which was checked by disabling it.

---

## S18 — the village became two screens (this session)

Continues S17. Everything below is on `main` at `e96efbb`.

### Tidewatch Village is two screens now

The village was ONE 10x8 screen carrying two 3x3 buildings, the Maku hollow and
six people, which is the town kit's own trap: two 3x3 blocks on a 10x8 screen
leave exactly one row that crosses it. It is also why four townsfolk stood in
the roots of the treeline — there was nowhere else to put them.

A town cannot be one big ROOM. `registerMap` throws on an overworld room that
declares a `size` ("the overworld is a grid of 1x1 screens"), so a bigger town
is several ADJACENT screens, the way Horon Village is several screens in the
source. Village East (`0,5,7`), which was a coast screen with a ledge nothing
needed, is the other half of the town: it carries the shop, a well, the tide
pool and Mirren, it is in the `town` legend, and it is DECLARED in
`tools/check-towns.mjs` — the sweep at the bottom of that file fails on a screen
that uses a town legend and is not in `TOWNS`, so the second screen cannot
quietly stop being held to a village's standard.

The pool stops one column short of the north and south lanes on purpose: at
HIGH those two rows of dry grass are the only way round it on foot, and
check-towns floods towns ON FOOT at all three seas.

Back in the square: the nine tiles the shop stood on are a lawn with a stump
table, the digger works at the table (5,4), the scrimshander works beside the
noticeboard (7,4), and the three tiles of grass BEHIND the shop are a treeline
rather than a pocket. That pocket had two wandering villagers in it and was
reachable only through the tile the digger was standing on. Nobody could get
in; neither of them could get out. It had been like that for the life of the
project and no tile checker could see it — check-towns' pinch test asks whether
removing a tile strands a WAY IN or a DOOR, and those three tiles were neither.

`houseShop`'s return warp now lands on `0,5,7` at 72,88. `village-shop-door`
and `village-walk` were re-recorded, and so were `d1-descent` and
`tide-steps-split`, which move with any change to entity allocation order.

`check-ground` reports NOBODY standing in a tree overhang, which it has never
been able to say before.

### Three ways to put a townsperson in the wrong place, none of them visible

1. A solid giver at `3,5` failed `test.mjs`'s "walking west changed room". The
   player's box straddles two rows, so he leaves a screen along row 5 whatever
   row he set off in.
2. Moved to `8,5` it passed that and walled the east end instead:
   `village-walk`'s `goto 8,3` spent all 400 frames shouldering against it and
   the recording ended two screens west being shot by an octorok. **A `goto`
   paths over TILES and then walks into ENTITIES, and a failed goto does not
   fail — it runs out.**
3. The sealed pocket above.

### A doorway is one tile wide and the player is not

The player's hitbox is `x+3` by ten, so standing centred on a column overlaps
the column to its right. Walking into a building's doorway from below has to be
done at `x = tx*16`, not at the tile's middle — at the middle the box catches
the solid shopfront beside the door and the walk stops dead one tile short,
silently. And the warp reads the FEET tile, `floor((y + 12) / 16)`, so the
player must walk twelve pixels PAST the door tile's centre before it fires.
`village-shop-door` records both as a run that never changes room.

### The sand cross in two village lawns

Village Shore and Driftwood Strand each had a plus-shaped patch of sand laid
across a grass screen: `.` is sand in the coast legend and `g` is grass, and the
two had been mixed as though they were one ground. Both are lawns now with the
tide channel the only thing in them that is not grass.

### A beach on the cliffs, and another in the drowned wood

The same fault, systematic. Every regional legend overrides `g`, `G` and `f`
and most stop there, so `.` fell through to the base legend's seaside `sand`:
191 tiles of beach on a high stone shelf in the cliffs, 170 under the trees in
the wood, each with a hard straight edge because there is no transition tile
between two grounds. `.` and `,` are `rockFloorDk` in the cliffs now and `mud`
in the wood.

`tools/oneshot/find-ground-specks.mjs` is how it was found: it asks the engine
what it will PAINT in every cell of every screen, groups the answers into
connected patches BY PALETTE, and reports patches too small to read as a place.
86 before the legend fixes, 84 after — and of those 84, all but two are SHORES,
sand meeting water, which is the one place two grounds are meant to meet.
`tools/oneshot/despeckle-ground.mjs` re-lettered the two.

### What was looked at and what was not

Screenshotted and judged by eye: `0,4,7`, `0,5,7` (LOW and HIGH), `0,4,8`,
`0,5,8`, `0,9,8`, `0,2,2`, `0,2,3`, `0,5,3`, `0,11,0`, `0,6,7`. NOT looked at:
the other ~260 screens, including every cliffs and wood screen the legend change
touched other than the three above. The change is uniform and the three that
were checked came out right, but a screen whose author MEANT the sand — a
beach at the foot of a cliff, say — would now be stone and nothing would say so.

### Still open, carried from S17

* Six... none. The people are all out of the overhangs.
* The `pot` tile is a hand-drawn brown sphere with no rim (21 placements).
* No transition tiles between two grounds, which is why every boundary in this
  session's screenshots is a straight pixel edge. In `docs/ART-BACKLOG.md`.
* All six Essences share one orb sprite; the source draws a different icon per
  Essence.
* Sandpiper Row is still one screen and stays that way — its own sign calls it
  "two houses, one boat, no harbour", and the alley between its two houses is
  what the source games do. Widening it by moving the east house one column
  over put the house's wall against the screen's east seam and stranded four
  border tiles at all three tides; check-towns said so immediately. Reverted.

---

## S17 — rows of four, and the trees that changed size (this session)

Three faults, all reported by a person looking at the game.

### Link was walking on a field of rocks

Sixteen screens had their rocks laid out as `oooo` — four identical boulders in
a straight line — and five of those had a SECOND such row with an `o..o`
between, which is a hollow rectangle of boulders standing in open ground with
the player walking about inside it. Six more screens did it with bushes and
seven with posts: 32 straight runs. `tools/oneshot/thin-props.mjs` broke every
one of them by REMOVAL — 46 cells, nothing moved, nothing added — choosing the
cell that breaks the most runs at once, tie-broken by `hash32` so the answer is
deterministic and is not the middle every time.

### The woods grew and shrank with the tide

`Room.quadMayCover` refuses to overhang an ANIMATED cell, which is right: the
canopy is painted into the static layer and the animated cells go over it
afterwards. But a tide tile is animated at some levels and not at others, so 66
cells were overhung at LOW and bare at HIGH — sound the conch and the trees
change size. It reads the tile's own NAME now (`isTideSensitive`), so the answer
cannot move with the sea.

### And the creeks were cut alongside the trees

A tree's root mound fills the bottom of its own cell and overhangs its
neighbours, so water in the next cell cuts a hard edge through the roots. S16's
carve had put 122 such cells into the world; `carve-water.mjs` keeps one cell of
clearance from any tree now, and the whole overworld was re-carved from main's
data with the rule in place. Interior water 4.1% / 16.1% / 18.1% across the
tide, down about 1.4 points from the version that ran through the woods. The 57
tree-adjacent tide tiles that remain are S13's rim strand, where a beach running
up to a treeline is a wood on a shore.

`tools/check-ground.mjs` grew two assertions for the first two; both negative
tests go red (66 cells, and the run it was given).

### And 146 of 536 tree blocks were drawn incomplete

A quadrant `quadMayCover` refuses is simply not drawn, so the tree ends in a
dead straight edge — the fault the 32x32 tree system exists to avoid, from the
other side. 53 blocks were cut to avoid painting over a FLOWER (a flagless prop
is decoration; anything with a flag is something the player must read), 18 at
the rim to avoid painting over `openSea` (solid and DRY is a wall, solid and wet
is the edge of the world), and 60 because a tide tile is animated at some levels
— those quadrants go on `animQuads` and are laid down by `drawAnim` straight
after the water. 26 remain, every one of them beside a rock, a cliff, a
drownWall, a town crate or the Maku hollow, which is where a tree should stop.

### And things were standing in the roots of the trees

A treeline is two tiles deep on screen and one in the data — the canopy in the
tree's own row, the root mound in the row below. Twenty-one placed entities
stood in one. The four that are OBJECTS (three signposts and a pickup) were
moved out; the six that are PEOPLE were not, and are printed by check-ground
every run instead. That is not laziness: "the nearest cell that is not overhung"
put the scrimshander in the middle of Tidewatch Village's only straight route
west, and test.mjs reported that walking west no longer left the screen.
check-towns passed it and was right to — the screen is not severed, row 6 goes
round — so a solid entity in a thoroughfare is legal for a flood and still wrong
for a person walking. **The six villagers want a hand, not a tool.**

### What was NOT verified

Nobody has played it. Six screens were photographed out of the 21 the thinning
touched and the 81 the re-carve rewrote. The thinning is a machine's answer to a
composition question: several screens came out with the same pattern in two
rows (`..oo..` twice, with a clear row between), which is a cluster rather than
a fence and is better, but it is still symmetric. A person should look at the
Boulder Run (0,1,4), the Kell Ledges (0,2,3) and Pan Corner (0,7,2) and decide
whether they want a hand.

## S16 — the ground you stand on (this session)

Two faults, both reported by a person looking at the game and both invisible to
every checker in the table, because both are pictures rather than facts.

### Link was walking on a boulder field

`rockFloor` is the walkable ground of the cliffs, the reef and the abyss — 39
overworld screens by dominant-ground count — and it was ripped from a fan-sheet
window the ripper's note calls "cobbled paving". A quarter of its pixels are the
darkest index, drawn as an outline round every cobble, and every palette the
family wears has a near-black darkest tone, so each cobble rendered as a rounded
LUMP. The Gate of the Keep, the Sunken Reef and the Coral Hollow were heaps of
stones with the player standing on top of them.

Subrosia's own floor replaces it (`rip-terrain.py`, SB 8,440): one mid tone over
72% of the cell, 5% darkest, three colours, so the near-black index goes unused
and nothing gets outlined. **`tools/oneshot/find-floor-tile.py` is how it was
found** — it scores every phased, seamless, four-colour window on a sheet by its
dark fraction, which turns "find me a floor" into a sort rather than an
afternoon of squinting.

### Every prop was standing on ground the tile table chose, not the room

`Room.underGround` existed to stop a rock bringing a lawn onto a beach, and it
did nothing in the two arrangements this world is mostly made of: a tree in a
treeline has trees either side and trees never vote, and one disagreeing
neighbour returned the declaration on the spot. 274 cells drew a ground their
screen did not have. The vote now falls through to a screen-wide palette test
and, when it substitutes, takes a NEIGHBOUR'S ground rather than the screen's
commonest — the Bog Causeway's tree line is `grassDark` on the outside and the
screen's commonest ground is the `mud` band through its middle.

`tools/check-ground.mjs` is new and in the table; its negative test goes red on
849 cells. It also asserts that no room warp sits on a tile a 32x32 object may
overhang — a room's `warps` list is a doorway that need not carry `F.WARP`, so
`quadMayCover` says yes to it and a canopy would swallow the way in. None do
today; 48 of 48 are protected, and breaking `quadMayCover` reports all 48.

### And an overworld gap was a hole in the tilemap

`chasm` drew the dungeon pit's art in the abyss palette — 90% of one near-black
tone, right for a pit in a brick floor and a rendering failure in a dune. Four
dune screens had flat black rectangles on golden sand. It has its own `pit`
palette and body art now, with a far lip through the same `family` + `edgeArt`
autotiler the cliffs use, so a vertical run of four gets one lip and the
horizontal runs (one tile tall) are all lip. **The body carries no shading**: a
single darker row per cell read as depth in the art string and rendered as a
rung every sixteen pixels.

### What was NOT verified

Nobody has played it. Eight screens were photographed out of the ~120 the floor
change touches. The new floor is a fine two-tone speckle, which is right at 1x
and busy at 4x — a person should decide whether it wants to be sparser. And the
cliffs and reef read PLAINER now than they did as boulder fields: the lumps were
wrong but they were visual interest, and those regions may now want real scatter
(rocks, tufts, cracks) placed deliberately rather than smuggled in by the floor
tile. Stand at the Gate of the Keep (0,1,0), the Sunken Reef (0,9,0) and the
Coral Hollow (0,9,4).

## S15 — placement, the cutscenes watched, and the interior sea

TWO SESSIONS RAN THIS PROMPT IN PARALLEL AND BOTH DID JOB 1. `b09c0e6` landed
on main first and its version of the placement work is the one that survives;
this branch's was reconciled onto it at the merge, and the only thing kept from
the losing copy is `--suggest`'s printed shortlist. **That is the pile lesson in
HANDOFF happening again, live: one session at a time, merged before the next
starts.** Everything below Job 1 is unique to this branch.

### Job 1 — nothing is standing inside anything (merged from b09c0e6)

`tools/check-placement.mjs` is new: it builds all 273 rooms in the real engine
and asks the engine's own pair — `canOccupy` AND `terrainOk`, with no caps
passed, so each entity's own nature answers — whether every one of the 529
placed entities can be where the room data put it, at any tide. Wiring it in
found three things, in ascending order of how badly they wanted finding.

**A signpost inside a tree, a trader inside a bush, forty-odd things inside
rocks, posts and ledges.** All moved, mostly one tile down. Two of the tool's
suggestions were overridden by hand: an octorok it put into the lane the
playthrough actor travels, and a zol it put behind a post row in a room whose
encounter is two zols in the open. The suggestion is a legal tile, not a good
one, which is why the tool has no `--fix`.

**The final boss was standing on a one-way ledge.** Nereth's throne room had a
three-tile run of `>` down its middle, splitting the arena, with him on top of
it. Removed.

**And the sea had nothing living in it.** `moveEntity` reads `e.caps`;
`canOccupy` read `e.swimming`; the player sets the first and NOTHING in the
game ever set the second. The two functions disagreed and the one every bare
call reaches said no, so every anglerfry, sea octorok and siren was welded to
its spawn tile — 0 subpixels in 240 frames, measured, then thousands with the
fix. Jellyfish moved only because `driftWithTide` writes their position
directly, which walked them onto dry land where they despawned. An aquatic
enemy gets `caps` in the `Enemy` constructor now and `canOccupy` falls back to
`e.caps`, so there is one mechanism rather than two. A raft floats, too.

Freeing things that were stuck has a cost and it was paid rather than hidden:
d1-descent's actor died on a route it had always walked, because the Locked
Stair now has the two zols it was always written to have. Its heart headroom
went 20 -> 30 with the reason written next to the existing paragraph that says
the headroom is the recorder's handicap and not the room's difficulty. Three
replays re-recorded.

**What was NOT verified.** Nobody has played any of it. The sea's enemies move
now and nothing has judged whether they move WELL — whether a freed anglerfry
is a fight or a nuisance, whether the Locked Stair is now too hard for a real
player rather than for a scripted one, and whether the forty moved entities
still read as deliberately placed. Stand in d1's Locked Stair, in any reef
screen with a jellyfish, and in Nereth's throne room.


### Job 2 — the thirteen cutscenes, watched

Three faults, none visible to any assertion:

* **The ending's last image had never been on screen.** `{ fade: 'out' }` in a
  cutscene faded straight back in by itself (right for a room transition, whose
  callback puts a new room up; wrong for a scene that means the black), AND the
  fade was drawn on top of the cutscene overlay. Two independent reasons for
  one dead beat. Both fixed in `Game.fadeOut`/`updateFade` and `Game.draw`.
* **Farore was not in the room.** She lives behind a five-Essence gate in the
  Maku hollow, so the game's 66-second opening was a voice with no body. She
  gets the `show` beat `nerethIntro` already uses.
* **The Rod and the master sword were handed over with nothing to look at.**
  Only the intro's conch was ever held up.

Pacing, judged rather than asserted: **CUTSCENE_READ_CPS = 14 is not too
generous.** A/B skips a caption and START collapses a scene, so it costs a fast
reader one press and saves a slow one the line. The Essence scenes are a 3.5s
card and 2-4 player-advanced boxes; they do not outstay their welcome at the
fifth. **What IS wrong with them: all six share one orb sprite** where the
source games draw a different icon per Essence. That is an art job nobody has
done and it is the best remaining cutscene work.

### Job 3 — the interior sea

Interior water was 2.2% / 5.7% / 7.7% across the tide against the rim's
22.6% / 40.4% / 41.9%, with 16 interior screens holding none at any level. It
is now **4.3% / 17.5% / 19.5%**, and three screens are dry (the village, its
neighbour, and one bog screen with no route to the sea through open ground).

`tools/oneshot/carve-water.mjs` does it in three passes — a SANDBAR shoreline
round every pool already inland, a CHANNEL creek from each landlocked screen
down to existing water across screen seams, then a second shoreline pass to
give the creeks banks — and reconciles every screen seam against the engine's
own walkability until both sides agree at all three levels. Nothing is painted
on a ledge or beside one, on a doorway, on an entity, or in a town.

**It moved nothing.** All 51 replays and check-playthrough passed unrecorded,
which is the argument for a tide tile over open water: `check-overworld`'s
field flood models the conch honestly, so a crossing that is dry at LOW and
deep at HIGH is still a crossing.

### Job 4 — feel.js is still blocked, and nothing was relabelled

`assets/` still holds sprite sheets and one title-screen GIF, and that GIF is
still a SINGLE FRAME — checked by counting its graphic-control extensions, not
assumed. The census stands at **0 measured / 17 derived / 223 guessed**.

### What was NOT verified

Nobody has played any of this. The three jobs were proved by checkers and
judged from screenshots and filmstrips. Specifically:

* **The interior water at screen scale, region by region.** Eight screens were
  looked at out of the 77 that changed. Stand in the Salt Pans (0,7,2 and
  0,5,1), the Cliffs of Kell (0,3,5) and the Marsh Stair (0,1,5), and sound
  the conch through all three levels in each: a creek is deep at MID and HIGH
  and the shoreline beside it is the only dry footing.
* **The moved entities in the rooms nobody shot.** Six were photographed;
  42 were not. `check-placement` proves they CAN be where they are, not that
  they look right there.
* **The cutscenes as a player meets them.** The three changed scenes were
  re-watched as filmstrips, not played. Nereth's arena still has a one-way
  ledge column down the middle of it, which is worth a second opinion.
* **Aquatic enemies actually swimming.** They can occupy deep water now; how
  a jellyfish READS crossing a deep tile has not been watched.

## S14 — every NPC was two half-people


Follow-on from S13's prompt leftovers, then the NPC sprite pass the same
prompt asked for "like the tree tiles". It was the same fault and it was worse.

**`find_cells` assumes a pitch.** It splits a band of sheet content into runs
and cuts each run every 16 pixels. The Oracle of Seasons NPC sheet's
townspeople sit about 17 to 18 apart, so the cut drifted a pixel per sprite and
by the middle of a row the window held the right half of one villager and the
left half of the next. Every villager, child, elder, shopkeeper, fisher and
oracle in the game was two half-people. Nothing could see it: a sprite that
exists and draws is all any checker can ask.

`ripkit.find_sprites` finds each sprite as its own eight-connected blob and
centres a cell on it, feet-anchored. Migrating renumbers every index, so all
nine frames were re-picked off a contact sheet by eye — which is the half of
this that is not mechanical, the sheet having soldiers, Zoras and Subrosians in
it as well as townsfolk.

**And a 16-wide cell around a 13-wide person has columns that belong to whoever
is standing in them.** `quantise(own=True)` keeps only the window's biggest
blob. Opt-in, because a frame drawn in two pieces is legitimate. Where the
neighbour TOUCHES the sprite the rule cannot help: Farore is drawn in a doorway
whose post joins her outline, so her two frames carry an explicit nudge.

The races sheet had one hard fault of the same kind — `npc_brine_u`'s window
was three pixels left of its seafarer, taking a stripe of sheet green and
leaving three columns of his back outside the cell — plus neighbour bleed that
the same blob rule clears.

Also from the prompt's list: the boulder's grit column (rip-terrain, the same
blob rule), the dead `speaker` and `glide` fields, three unreachable tiles, and
the live bug hiding behind two of them — `REEFSEED_PLANT_BLOCK` names F.SWITCHF
and the only tile carrying it was unplaceable, so nothing stopped a coral pillar
being grown on a floor switch. A plate says `noPlant` now.

**`claude/p7-6-camera` was NOT deleted.** The remote refuses ref deletion
through this environment's git proxy (`send-pack: unexpected disconnect`) and
no delete-branch API tool is available here. It is at `e00b6c5`, an unrelated
history with no merge base to main, and its two checkers were rewritten onto
main in S11. One command from a normal checkout:
`git push origin --delete claude/p7-6-camera`.

**What was NOT verified.** Nobody has played any of this. The NPCs were judged
from stills at 1x and at 8x; how they read while WALKING (the wander animation
swaps frames) has not been looked at, and Farore's green recolour makes her
face very pale — that is a palette call a person should make. Stand in
Tidewatch Village and in Sandpiper Row.

## S13 — the sea, and the cutscenes get watched (this session)

Picked up the three jobs of the S12 prompt after the follow-up art work.

### Job 1 — the overworld had no sea, and now it has one

The count in the prompt was right about the symptom and slightly off on the
numbers: with `F.WATER|F.DEEP` rather than `F.WATER` alone it was 1.8% at LOW
and 8.1% at HIGH, and the drop the prompt reads at HIGH is shallow water
becoming deep, not water disappearing. The cause was one thing and it was not
subtle: **the whole rim of the world was cliff, and so was the wall round each
of the 120 screens.**

`openSea` — deep water that is also SOLID, so it stops a swimmer as well as a
walker, which is what the edge of the world has to do. The rim (396 tiles)
becomes it, then floods 3 tiles inward through the rock it touches (292 more),
so the coast follows the stone already there. Both passes turn solid into
solid and cannot move the world's connectivity. The third pass is the one the
player feels: plain ground touching the sea becomes SANDBAR — dry at LOW,
deep at HIGH — 372 tiles of shoreline that actually floods, and a tide tile
rather than water is what keeps it safe, since every flood in the checkers
counts a tile passable if it is walkable at ANY level.

Water now runs 9.0% -> 19.1% across the tide, and the part you can stand in
1.8% -> 11.9%. The map screen shows a coastline because the terrain has one.

Two rules found by the checkers, not by reasoning: a ledge must land dry at
every tide (so the strand goes round ledges), and that rule then broke a seam
(so a converted tile whose partner across a seam did not convert goes back).

### Job 2 — all 13 cutscenes played end to end

`tools/watch-cutscenes.mjs` is new. It plays each scene at 60fps in the real
engine, turning each dialogue PAGE after a human reading time rather than
calling `dialogue.close()` (which skips pages two and three and clocks a scene
at a third of its length), and writes a beat-by-beat timeline plus a filmstrip.
It measures in GAME frames, not rAF callbacks, or a card held 180 frames reads
as 178 and a one-frame slack fails at random.

Two things it found, and only one of them was a duration:

**Every caption in the game was gone before its words could be read.** The
intro's opening paragraph is 97 characters and was on screen for 3.7 seconds.
`runCutscene` now holds a caption for `max(the frames the scene asked for, the
time its text needs)` — `CUTSCENE_READ_CPS` in feel.js — so a scene can dwell
as long as it likes and can never ask for less than legible. A step holding a
picture AND a card holds both for the same time, or the orb blinked out from
under its own title card.

**The one that only watching could find: every multi-page speech ended in a
stub.** `paginate` filled each page to the brim and let the last take what was
left, so a four-line speech was a full box followed by a box reading "one
eye.". It deals the lines out evenly now. Nothing could see this — the text is
all there, every id resolves, check-dialogue and check-text were green.

### Job 3 — feel.js is still blocked, and nothing was relabelled

`assets/` holds sprite sheets and one title-screen GIF that is a single static
frame. There is no gameplay footage in the repo to frame-step, so 0 measured /
17 derived / 221 guessed stands. Add Oracle gameplay video and this unblocks.

### What was NOT done, and where to stand to judge it

**Nobody has watched the cutscenes in motion.** The timeline and the filmstrips
are stills and numbers; whether the intro's 64 seconds FEEL right, whether a
25-second Essence scene outstays its welcome the fifth time, and whether the
new caption holds are now too generous are all things only a person can say.
Start a new game in `dist/oracle-of-tides.html` for the intro, and take an
Essence for the card. For the sea, walk to any edge of the map and sound the
conch: the strand at (5,9), (11,9), (0,5) and (3,0) is where the tide is now
visible. The interior screens are unchanged — the sea is at the world's edge,
not yet in its middle.

## S12 — Cave mouths get their rock, trees stop being sliced (this session)

Two visual faults, both reported by a person playing, both green in every
checker before and after — `T53` again, twice in one session.

**Cave mouths.** All eleven overworld mouths were a dark arch pasted on open
ground: sand, grass, a tree canopy in Tidewatch, and open water at the Sunken
Reef. The extracted tile is only the hole; the rock is the neighbours' job and
nobody had ever done it. Each mouth now stands at the foot of a two-tile rock
face in its region's own cliff, with `caveMouthSand` / `caveMouthCoral` /
`caveMouthAbyss` so the arch is not grey inside a sand or coral one. The Reef
Palace's porch is one column east of the rest — see HANDOFF for why. Tidewatch's
Maku hollow is `treeHollow` now, the same silhouette on the dead-oak ramp,
because the room data has always called it a gap in the tree line. The Sunken
Reef grotto moved out of the middle of its pool to a shelf at the head of the
reef road, which is the first time reaching it actually costs a low tide.
`tide-steps-split` was re-recorded, not loosened: same end tile, same hearts,
same probes.

**Trees and palms.** Quadrants were being chosen per cell, so any tree mass that
was not an even 2x2 came out sliced — the dune palms worst of all. `drawQuads`
now lays whole 32x32 trees on a fixed lattice, after the ground, overhanging
where the mass runs out and stopping at anything the player must see. The Lens's
second copy of the room learned the same pass; it had been drawing 16x16
lollipops over the real trees for as long as the trees have been 32x32. Props
now look at what they are standing on, and the dig spot is two spade marks
instead of a flat tan tile.

**The six dungeons get doors.** Every dungeon was entered through the same
cave arch as a grotto, so nothing on the overworld said which six holes in the
rock the game is actually about. Each now has a carved gate: a 32x32 block in
the source's own grammar — a crown that breaks the top line, an overhanging
cornice, a frieze with one plaque, two pillars either side of a black arch —
drawn rather than extracted, because no sheet has doors for six dungeons the
source games never had. What is on each plaque is that dungeon's own argument
with the tide, out of `docs/DUNGEON-STATUS.md`, and each wears its region's
rock with a near-black at index 3 so the doorway is a hole. `D` in a room grid
is a dungeon gate and `C` is a cave; one character serves all six because each
region holds exactly one dungeon. `check-towns` swept only the declared towns
when it asserted every registered block is placed, so the gates read as six
unplaced buildings the moment they landed — it sweeps every room now.

**The oaks and palms were also mis-ripped**, which is a different fault from
the one above and was reported separately: both extraction windows were a
couple of pixels off their objects' real bounding boxes, so every oak lost its
right outline column and every palm the tips of its top fronds. Moving the palm
window also drops four stray trunk pixels out of its upper half, so its frond
half is three colours now and the slots moved with it.

**What was NOT done, and where to stand to judge it.** The three jobs in the S12
prompt — the empty sea (0.9% water at LOW), the thirteen cutscenes' pacing, and
the `feel.js` debt — are untouched; this session was the follow-up request only.
Nobody has WATCHED any of this in motion: every judgement here is from stills.
In `dist/oracle-of-tides.html`, walk south out of Tidewatch to the Grotto Mouth
(8,8) for the first dungeon gate, stand in the Rotting Grove (5,3) and the
dunes (8,7) for the trees and palms, and hold the Lens up in a wood. The other
five gates are at (10,5), (1,8), (1,3), (5,4) and (1,0); nothing has judged
them beside each other in play, only in stills.

## S11 — Orphaned checkers recovered; the feel.js debt is NOT paid (this session)

**Run per `docs/SESSION-PROMPTS.md` S11, on top of S10.** Job 1 is done in full.
**Job 2 was not attempted and nothing was relabelled** — read why below before
assuming it was skipped out of laziness.

### Job 1 — the two orphaned checkers, rewritten from scratch

Both were written on `claude/p7-6-camera`, never merged, and that branch is ~90
commits behind, so these are rewrites against the current engine, not ports
(`T56`). Both are wired into `V16`.

**`tools/check-camera.mjs` (`V26`)** drives the real `Camera` against all 273
real rooms and checks six promises: pinned at 0,0 in every room no bigger than
the view (264 of them), never outside the room, never more than `CAM_MAX_SPEED`
in a frame, always whole-pixel, unmoved by a player inside the deadzone, and it
actually reaches the far edge in the 9 rooms that are wider than the view.

**`tools/check-wide-rooms.mjs` (`V27`)** checks that a room declaring a size
fills its authored grid (a row one character short silently becomes a column of
void), fits on its map, shares no cell with another room, resolves every covered
cell back to itself, is crossable at every internal seam, and never neighbours
itself.

**Both were proved to fail before being trusted.** Four deliberate breaks:
walling off a seam, shortening a map row, letting the camera exceed
`CAM_MAX_SPEED`, and dropping its clamp — all went red with readable messages.

Two things the negative tests taught, both now traps:

- **`T84`** — the first cut of the camera checker asked `cam.maxX(room)` for the
  limits and then judged the camera by them. A broken `maxX` passed cleanly. The
  expectation must come from the data (`room.pw - VIEW_W`); the engine's answer
  is then one of the things being checked.
- **`T85`** — the first cut of the seam check asked bare-foot solidity and
  flagged two perfectly good rooms. The Kelp Locks' seam is a torrent (Cleats);
  the Shrine Ford's is a snarl you cut and then swim. `everPassable` in
  `tools/lib/collision.mjs` now owns the capability list and the transform
  lookup — **one place to update when the player gets a new verb.**

A fifth break — deleting the camera's one-screen early return — changed nothing,
because the clamp below it already forces the same answer. Defence in depth
nobody had written down.

### Job 2 — NOT DONE, and deliberately not faked

**There is no gameplay reference in this repository to frame-step.** `assets/`
holds sprite sheets and one title-screen GIF, and that GIF is a **single static
frame with no timing data** — checked with Pillow, not assumed. Walk speed,
sword duration, knockback, invulnerability frames, room transitions and text
speed cannot be measured from anything present.

`A1` is confirmed: **0 measured, 17 derived, 220 guessed.** (An earlier count in
this session said 9 measured; that was a bad regex catching the word `measured`
in prose — `WALK_SPEED` says "derived from the 8.8 grid" and `LENS_GHOST_ALPHA`
says "guessed, but MEASURED AGAINST A ROOM". Neither is a measured claim.)

**What was added instead: `tools/check-feel.mjs` (`V25`)**, which makes S11's own
stated failure condition mechanical. Every constant must have a comment with a
unit and a provenance word, and **anything claiming `measured` must carry a
`reference:` note naming what was frame-stepped**. It reads a claim as
`measured` only when the comment does not also say `guessed` or `derived`, which
correctly exempts the two prose cases above. Negative-tested three ways.

It also found three constants with no comment — which turned out to be a
convention the checker did not know (`px, f —` comments covering an
amplitude/duration pair), so the checker was fixed, not the file (`T86`).

**To actually pay this debt, someone has to put gameplay video of Oracle of
Seasons/Ages in the repo.** Then the constants can be stepped one at a time,
each with its `reference:` line. Until then the honest state is `guessed`.

### Verified

`V16` **83/83** · `V11` replay 51/51 · `V13` playthrough 19/19 · check-camera
273 rooms · check-wide-rooms 9 rooms / 9 seams · check-feel 237 constants ·
build OK.

### What is left after this

`docs/ROADMAP.md`'s series is now complete (S1-S11). The open items:

1. **The overworld is 0.9% water at LOW tide** (S8's finding) — the biggest
   thing on the board, in a game about tides.
2. **The feel.js measurement debt** — blocked on reference footage, as above.
3. `speaker:` is a dead field in the cutscene engine; `glide` is a dead field in
   the audio engine. Both harmless, both still there.
4. `claude/p7-6-camera` can be deleted — its two checkers now exist on `main`.

---

## S10 — Cutscenes draw pictures, and Nereth gets an entrance (this session)

**Run per `docs/SESSION-PROMPTS.md` S10, on top of S9.** `cutscene.js` gained
exactly one drawing step, `nerethIntro` fires for the first time, and two bugs
that only a screenshot could find were fixed.

### The vocabulary: one step, not two

**`{ show: ... }`** — hold a sprite (or a two-frame cycle) over the scene.
`{ show: 'name' }` or `{ show: { art, frames, scale, x, y, rise, dim, pal } }`.
A step may carry both `show` and `text`; it ends when the longer finishes.

**The prompt's first suggestion — a camera pan — was NOT built, deliberately.**
`Camera.update` pins x/y to 0 when a room is no bigger than the view, and **all
six boss rooms are exactly 160x128**. The nine rooms in the game a camera can
move in are all mid-dungeon and none runs a cutscene. A pan step would have had
zero call sites. See `T81` before reviving it.

Layout is **computed, not hand-tuned**: when a sprite is up the caption drops to
the bottom and the sprite centres in the band between the HUD and the card. The
first cut centred the sprite and lost two thirds of it behind the caption
(`T83`).

Timings are in `feel.js` (`R3`): `CUTSCENE_SHOW_FRAMES` 110f,
`CUTSCENE_SHOW_ANIM_FRAMES` 10f, `CUTSCENE_SHOW_RISE_PX` 6px, all `guessed`.

### Where it is used

Ten scenes now hold a picture: the six Essence cards and `essenceGeneric` show
the shard (`p_essence0`/`p_essence1`), the opening shows the conch as Farore
hands it over, `nerethIntro` holds Nereth in his own `abyss` palette, and the
ending holds the Bell whole at scale 4.

### `nerethIntro` fires — and `finalBoss` had been unreachable TWICE

The scene had no trigger anywhere in `src/`. It now runs from nereth's
`onIntro`, at the end of the held entrance pose, guarded by a `heardNereth`
progress flag so a death and retry does not replay it.

That alone was not enough. **`updateMusic()` recomputes the track from
`dungeon.bossMusic || 'boss'` the moment a cutscene ends, and NO dungeon had
ever set `bossMusic`** — a field the engine has always read. So every boss in
the game fought to the generic `boss` track and `finalBoss` (whose intro S7
wrote) had never been heard. Fixed both ways:

- d6 sets `bossMusic: 'finalBoss'`.
- `enemy.js` calls `game.updateMusic()` at the half-way point of the entrance
  pose instead of naming `'boss'` itself, so one source of truth decides.

`shoot-cutscene.mjs --nereth` asserts `track === 'finalBoss'` both during and
after the scene.

### The em-dash bug — the best `T53` example in the repo

`decode` ends `GLYPHS[ch] || GLYPHS['?']`, so a character with no glyph prints a
QUESTION MARK. The em-dash (U+2014) has never had a glyph and appears 13 times,
so six Essence title cards have read **"I ? the Shallow Bell"** since the day
they were written, with every assertion passing. Fixed by adding the glyph
(5px of ink against the hyphen's 3 — they are different marks, and the writing
was right). `tools/check-text.mjs` (`V23`) now scans every displayable string —
dialogue, cutscene captions and says, map and room names, item, charm and trade
names — and fails on any character the font cannot draw. Negative-tested.

### New tools

- **`tools/shoot-cutscene.mjs` (`V24`)** — photographs each scene on a frame
  where its picture is actually up. It advances by CLOSING dialogue boxes, not
  by pressing A, because A dismisses a held sprite by design. `--nereth`
  reaches the throne room and proves the scene fires.
- **`tools/check-text.mjs` (`V23`)** — above. Wired into `V16`.
- `cutscene.js` exposes `shownArt()` purely as a seam for the shot tool, the
  same way `Audio.init` takes a context override. Nothing in the game reads it.

### Verified

`V2` 23/23 · `V4` 19/19 · `V11` replay 51/51 · `V12` bosses 19/19 · `V13`
playthrough 19/19 · `V16` **80/80** · `V10` music OK · check-text 497 strings /
17740 chars / 0 missing · build OK. All ten picture scenes shot and looked at.

### What S10 did NOT do

- **Pacing is not assertable** (`§4.2`). The scenes have been photographed, not
  watched end to end. Hold durations are `guessed`.
- `speaker:` is still a dead engine field — all 13 scenes inline `"Name: "` into
  the say text. Left alone: converting them is churn on writing that works.
- Signs are still literal-only; the S8 water finding still stands.

### Where to stand

`dist/oracle-of-tides.html`. The opening now holds the conch up when Farore
gives it. Any Essence get shows the shard over a dimmed world with its title
card beneath. **The one to judge is Nereth**: reach the Abyssal Keep throne
room and he now speaks before he fights, in his own palette, and the fight runs
to a theme no player has ever heard. Watch all 13 end to end for pacing — that
is the half no checker can do.

---

## S9 — Townspeople react to the plot (this session)

**Run per `docs/SESSION-PROMPTS.md` S9, on top of S8.** Twelve townspeople now
have a second line keyed to a story beat, the six orphan ids are resolved, and
`tools/check-dialogue.mjs` closes `T47`. **Two of `A6`'s claims were wrong and
are corrected in `SESSION-HANDOFF.md`.**

### The two corrections (read these before trusting A6 again)

1. **`npc` and `sign` did NOT accept `waiting`/`after`.** `NPC` read only
   `o.dialogue`; `Sign` reads only `o.text` and still does. The two-state
   contract lived on `Giver`/`Trader` alone, so engine work WAS needed. `A6`'s
   COUNTS were right and re-verified (57 written / 51 referenced / 6 orphaned).
2. **The gap was 12 townspeople, not ~21.** Nine of the listed names are
   `trader` waiting lines that already flipped to an `after` as the Coastwise
   Chain advanced.

### The engine change — deliberately not a third system

`needEssences`, `needFlag`, `ready()` and `afterText` were lifted out of `Giver`
into `NPC`, which `Giver` already extends. A townsperson's second state is now
spelled exactly the way a quest-giver's already was; `Giver` inherits them
instead of declaring its own. `Trader` keeps its own `waitingText` because its
fallback differs (`o.waiting || o.dialogue`).

`NPC` also gained `conditional()`, separate from `ready()`. `ready()` is
vacuously true when nothing is declared — right for a `Giver` with nothing to
wait for, and catastrophic for choosing a line, because an unconditional
`after` would become the only line the NPC ever said and the first line would be
unreachable. See `T80`.

**Two states only.** A third would want a real condition table and nothing has
needed one yet.

### The twelve, and their beats

Spread 1..5 on purpose — a whole town turning over at once reads as a switch.

| NPC | after | at |
|---|---|---|
| reefFisher | reefFisherAfter | 1 |
| villageChild | child1 | 2 |
| hearthChild | hearthChildAfter | 2 |
| sandpiper | netMender | 2 |
| fisher1 | fisher1After | 2 |
| villager2 | villager2After | 3 |
| shopkeeper | shopkeeper2 | 3 |
| hearthWife | hearthWifeAfter | 3 |
| shoreSalter | shoreSalterAfter | 3 |
| villager1 | elder1 | 4 |
| salterElder | salterElderAfter | 4 |
| faroreHome | faroreHomeAfter | 5 |

**No existing line was rewritten.** Nobody explains the plot; they notice the
weather and complain about it.

### The six orphans, decided

- **Placed as later lines** of villagers who exist (`T49` — do not add NPCs to
  hang lines on): `child1`, `elder1`, `netMender`, `shopkeeper2`.
- **Deleted, with evidence**: `signCoast` duplicated text already inlined on the
  real sign at `overworld/0,4,7` 8,4 — and `Sign` says `o.text` literally, so an
  id-table entry for a sign is unreachable by construction (`T78`).
  `villager3` explained how the conch works, which the intro cutscene already
  does; a townsperson explaining a mechanic is the wrong register.

### `tools/check-dialogue.mjs` (`V22`), wired into `V16`

- Every referenced id is defined (`T47` — a miss is a silent EMPTY BOX).
- Every defined id is referenced.
- **Each two-state NPC is constructed and its real `interact` driven** either
  side of its threshold, so a second line that is wired but unreachable fails.
  Also fails an `after` with no condition, and a threshold above the six
  Essences that exist.
- It walks `trader.deals[].text` and `makuTree.sceneAfter`; a first cut that
  read only top-level fields reported 20 orphans against the true 6 (`T79`).
- All four failure modes were induced and each went red.

### Verified

`check-dialogue` 63/63/0 + 12 proved · `V7` towns 58/58 · `V8` items 91/91 ·
`check-trade` 43/43 (`T48`) · `V16` **79/79** · `V11` replay 51/51 · `V13`
playthrough 19/19 · build OK.

### What S9 did NOT do

- **Whether the new lines are in voice is not verified and cannot be** (`§4.2`).
  Twelve of them are new prose. The register they are aiming at is the existing
  one: complain, notice, never explain.
- Signs are still literal-only. Nothing was changed there.
- The `S8` finding stands untouched and is still the biggest thing on the board:
  **the overworld is 0.9% water at LOW tide** in a game about tides.

### Where to stand

`dist/oracle-of-tides.html`. Talk to everyone in Tidewatch Village and the two
houses, then again after 3 Essences, then after 5. The turn-over should feel
staggered, not switched. `faroreHome` is the last to change, at 5.

---

## S8 — The overworld map becomes a picture (this session)

**Run per `docs/SESSION-PROMPTS.md` S8, on top of S7.** The map screen's two
maps are now two routines, the overworld one draws Thalassia as a picture, and
a new shot tool exists because the session's own failure condition could not
otherwise be checked. **It also produced a measurement that matters more than
the screen it came from — see "The finding" below.**

### What was built

- **`Menu.drawMap` now dispatches**: `drawDungeonMap` (the old loop, untouched)
  and `drawWorldMap` (new). The title line is drawn once by the dispatcher.
- **`drawWorldMap` draws the world at ONE PIXEL PER TILE.** Thalassia is 12x10
  screens of 10x8 tiles = 120x80 tiles, and the space under the title is 160x88
  px. The map is not a diagram of the world, it IS the world at 1:1, so its
  coastline is the actual coastline. Region `legend` is deliberately NOT what
  gets drawn — the legends are nine ruler-straight rectangles, so colouring by
  region gives a quilt.
- **Colours are derived from the terrain art**, never hand-picked: a tile's map
  pixel is the mean tone of that tile's own 16x16 art, snapped back to the
  nearest of that tile's own four palette colours. A hand-written name->colour
  table would be a second source of truth that drifts the first time a terrain
  tile is re-extracted.
- **It is tide-aware.** The cache is keyed on `tide.stamp`, the same way Room's
  render cache is and for the same reason (a key made of the LEVEL alone would
  miss an anchor moving the field under one screen). The answer to the prompt's
  open question — which tide does the map show — is **the one you are standing
  in**, so the map is a live document that redraws as the conch turns.
- **Dungeon doors are landmarks**, read off each room DEFINITION's `warps`: a
  warp into a map whose `kind` is `dungeon` gets a 3x3 gold-on-black mark at the
  exact tile it stands on. Nothing is a hand-kept list; move an entrance and the
  mark moves. Six are on the overworld (d1 d2 d3 d4 d5 d6).
- **The player marker alternates between two high-contrast colours** rather than
  blinking on and off — the source blinks it so it is findable over any terrain,
  and a marker absent half the time is not more findable, just harder to see.
- **`tools/shoot-map.mjs` (`V21`)** — screenshots the MAP tab in a named state.
  Nothing in `tools/` could photograph the pause menu.

### The finding — read this before the next session

**The overworld is 0.9% water at LOW tide.** Counted with the engine's own
flags across all 9600 overworld tiles: LOW 88 water tiles (0.9%), MID 391
(4.1%), HIGH 116 (1.2%). Solid is a flat ~32% at every level.

S8 set out to draw a coastline and there is essentially no sea to draw one
against. **The old map hid this perfectly** — every screen was one blue
rectangle whether it was open ocean or solid rock. This is not a map bug and
must not be fixed in the map; a map that invents water the world does not have
is a lie. It is a terrain problem, in a game whose entire premise is the tide,
and it is almost certainly the highest-value thing on the board now.

Two companion measurements:

- The nine region blocks are **ruler-straight rectangles** on a 4-screen grid.
- **116 of the 120 screens are structurally distinct** (strict region-blind
  test), so the world is NOT one stencil — an earlier draft of this note said it
  was, from three samples that all happened to be cave-entrance screens, and the
  test corrected it. But nearly every screen is a decorated border ring around a
  small central patch, so at map scale they still read as wallpaper.

### What was verified

- **The dungeon map is pixel-identical.** `shoot-map.mjs` took the BEFORE shots
  before a line of `menu.js` changed; `d1:0:map`, `d1:0:chart` and `d2:0:chart`
  all diff to zero after the split. That was the session's stated failure
  condition.
- `V11` replay 51/51, `V13` playthrough 19/19, `V16` test 78/78, `check-build`
  OK.
- **Cost, measured because `T75` says to**: instantiating all 120 overworld
  rooms is **3ms, once per run** (they are cached); re-walking 9600 tiles on a
  tide change is **2ms**. Frame budget is 16.7ms.

### What S8 did NOT do

- **The map is honest but it does not read as Holodrum**, and it cannot until
  the terrain does. Nobody has judged it in motion (`§4.2`).
- The overworld Chartstone is still a dead feature (`progress.charts` is keyed
  per map, an overworld Chartstone would set it, no pip would draw). Left alone:
  with 0.9% water there is almost nothing for tide pips to mark, which is a
  symptom of the finding above, not an oversight.
- Caves and house doors get no landmark — only dungeons do. Town screens read as
  town-coloured terrain already.
- `tools/shots-map-*/` are gitignored; re-shoot rather than expecting them.

### Where to stand to see it

In `dist/oracle-of-tides.html`: press START, then SELECT to the MAP tab.

- **From a new game**, the map is one lit screen in a dark frame — check the
  "you are here" mark is findable immediately.
- **Walk five or six screens and reopen it**: the explored blob should have a
  shape, and the gold dungeon mark for d6 (north-west) or d1 (south-east)
  should appear as you reach them.
- **Turn the tide with the conch and reopen it.** The picture redraws. This is
  the thing to judge hardest and it is the one nobody has seen: does the world
  visibly change, or is 0.9%-to-4.1% too little water to notice? If it is too
  little to notice, that is the finding above, confirmed by eye.
- **Open a dungeon map (D1) and confirm it looks exactly as it always did.**

---

## S7 — Music: intros, loop length, and the S6 techniques in use (this session)

**Run per `docs/SESSION-PROMPTS.md` S7, on top of S6.** The music engine grew
the one structural thing it lacked, ten tracks were extended or reworked to use
it and the S6 techniques, and `check-music.mjs` grew to cover both. Nothing
outside `src/core/audio.js`, `src/data/audio.js` and the two music checkers was
touched.

### 1. The engine: `intro`

A track may now declare `intro: ['I']` — a list of patterns played ONCE as a
non-looping lead-in, before `order` begins, and never returned to.

- `Audio._sequence()` is the whole mechanism: it returns `intro.concat(order)`
  until the first wrap and the track's own `order` array from then on. The
  no-intro path returns `order` untouched and allocates nothing, which is what
  keeps every pre-S7 track byte-identical.
- `_introDone` is set at the wrap, AFTER the length test — that ordering is
  what makes the intro count toward the first wrap and no other. Both ways of
  getting it wrong are covered by a checker (see below); do not "simplify" it.
- `_releaseAll()` clears it, so every track boundary owes the next playback its
  intro back. A restart, and a resume after a jingle, both replay the lead-in,
  because both are a fresh playback.
- `loop: false` (jingles) plus `intro` is rejected: a one-shot has no loop for a
  lead-in to lead into.

### 2. Where intros went, and where they deliberately did not

**Nine tracks have one**: `title`, `overworld`, `village`, `dungeon`,
`dungeon2`, `boss`, `finalBoss`, `abyss`, `ending`.

**Not `cave`, `reef`, `marsh`, `salt`, `shop`, or any jingle — and that is a
decision, not an omission.** `Audio.play()` restarts the track whenever the
name changes, so a track you re-enter constantly would re-play its lead-in
constantly. Crossing a region border back and forth, or walking in and out of
the shop, would fire a fanfare every time. Intros went only to tracks you
arrive at, not tracks you pass through. If you add an intro to a region theme,
that is the thing that will be wrong with it.

One that fell out for free: `enemy.js:314` starts the `boss` track halfway
through a boss's held-pose entrance, so the new boss stinger now runs under the
pose and lands the loop about when the fight starts. Nothing was wired to make
that happen.

### 3. Loop length — the four long-heard tracks

| Track | Was | Now | Added |
|---|---|---|---|
| `overworld` | 5 patterns, ~18s | intro + 7, ~29s | E, F |
| `village` | 4 patterns, ~17s | intro + 6, ~30s | D, E |
| `dungeon` | 4 patterns, ~15s | intro + 6, ~27s | D, E |
| `dungeon2` | 4 patterns, ~17s | intro + 5, ~26s | D |

Every new pattern was held to the prompt's bar: one sentence saying what it
does that no existing pattern in that track does.

- **`overworld`/E** — hands the tune to the WAVE channel and parks both pulses
  on a held chord above it, so the melody arrives from underneath. A-D all use
  the wave channel as a bass ostinato; this is the only place it sings.
- **`overworld`/F** — A's opening contour moved down a third through the same
  scale, which lands it in the relative minor. Placed immediately before D so
  the call-to-adventure fanfare arrives out of the minor.
- **`village`/D** — the theme's only call and response: p1 states a phrase and
  stops dead, p2 answers into the hole. In A/B/C both pulses always sound
  together.
- **`village`/E** — the only pattern in the town theme with a kick in it; the
  pulses drop to offbeat stabs and the kit carries the two bars.
- **`dungeon`/D** — call and response across octaves: p1 asks up top, p2 gives
  it back a full octave down in the silence after it.
- **`dungeon`/E** — the one pattern where the wave channel stops walking the
  bass and holds an arpeggiated chord instead, with the kit alone under it for
  a bar.
- **`dungeon2`/D** — the only pattern in the game where the delay IS the melody:
  the lead states half a bar and leaves a five-row hole, and the echo fills it.

### 4. The S6 techniques, now actually in use

- **Vibrato** — on `p1` of `title`, `overworld`, `village`, `dungeon`,
  `dungeon2`, `cave`, `boss`, `finalBoss`, `abyss`, `ending`, all at the
  `feel.js` default depth (0.18 semitones). It is self-limiting: it only
  reaches a note held past `VIBRATO_DELAY_FRAMES` (10f), which in every one of
  these tracks means the held note at the end of a phrase and nothing else. No
  per-track depth was invented — the default is the guess we have.
- **Echo** — `cave` and `dungeon2`. Both had a `p2` that was doing thin
  doubling work; both now have no authored `p2` at all and get the lead back a
  beat later at 0.4/0.42 volume instead. **This is the change most likely to be
  wrong to a listener**: it thins `dungeon2`'s harmony (its p2 was carrying
  chord roots an octave above the bass) in exchange for making it audibly the
  echoing dungeon rather than a transposed `dungeon`. Judge it before building
  on it. Note the hard constraint that shapes both: echo is a channel config,
  so a single authored `p2` string ANYWHERE in the track silently switches the
  effect off for that pattern — `check-music.mjs` rejects a track carrying
  both.
- **Arpeggio** — the wave channel in eight of the nine intros, plus
  `dungeon`/E. Every use is the same situation: a place where the harmony
  wants a whole chord and there is no channel free to spell it.

### 5. `check-music.mjs` (V10) now covers intros

Four static rules (intro is a non-empty list of patterns that exist; shares no
pattern with `order`; absent from `loop:false` tracks; and every pattern a
track defines is reached by one or the other) — plus, importantly, **a live
engine check**: each intro'd track is driven through `Audio._scheduleRow` for
two full loops against the mock context, and the patterns it actually
schedules must be exactly `intro` once then `order` twice. It asks the engine
which pattern it played rather than modelling where the wrap falls, for the
same reason a collision checker calls `solidAt`.

All six new failure modes were deliberately induced and each went red; see
`docs/HANDOFF.md`'s hard-won-lessons section for the two engine sabotages, and
for why the ENGINE change was proved inert against the OLD render baseline
before any track data was touched.

`tools/lib/mock-audio-ctx.mjs` is new: the mock AudioContext, moved verbatim
out of `check-audio-render.mjs` so both music checkers trace one engine rather
than two slightly different copies of one.

### 6. One pre-existing bug fixed in passing

`village`/B's `p2` was 31 tokens against the pattern's 32 for the whole life of
the track, so its last note rang into the next pattern's downbeat instead of
releasing with `p1`. Fixed by appending the missing rest — **no note moved**,
because which token was originally dropped is not recoverable from the data and
guessing would have recomposed the bar. If the phrase sounds a row out of place
to you, that is the thing to look at.

### What S7 did NOT do

- **Nobody has heard any of this.** Every claim above is structural. See the
  listening notes at the end of this section.
- `glide` is still declared in `DEFAULT_CFG` and read by nothing. Still not
  removed; still out of scope.
- `engineDemo` is still present. S6 said S7 may delete it once the techniques
  are in real use — they now are, but it is still the only place to hear the
  three in isolation, so it stays until someone has A/B'd the real tracks.
- `reef`, `marsh`, `salt`, `shop` were not extended or given techniques at all.
  They are the obvious next music session.

### Where to stand to hear a full loop

In `dist/oracle-of-tides.html`:

- **`overworld`** — leave the first town and stand still on the overworld.
  Intro ~3.6s, then a ~29s loop. The two new things to listen for are the
  melody dropping into the bass register (pattern E, about 18s in) and the
  minor turn immediately before the fanfare (F, about 22s in).
- **`village`** — stand in the town square, out of the shop. Intro ~4.3s, then
  ~30s. New: the two pulses trading phrases instead of stacking (D), then the
  only bar of town music with a kick drum (E).
- **`dungeon`** — enter D1 and stand in the first room. Intro ~3.9s (a crash
  and a descent — the door closing), then ~27s. New: the octave call-and-
  response (D) and the bar where the bass stops walking (E).
- **`dungeon2`** — enter D2. This is the one to judge hardest: the second pulse
  is now pure echo everywhere. Listen for whether the corridor reads as space
  or as mud, and specifically for pattern D, where the lead stops and the echo
  answers alone.
- **Compare** `dungeon` against `dungeon2` back to back. They are supposed to
  be two different dungeons now, not one theme in two keys.

---

## S6 — Music engine: vibrato, echo, arpeggio (this session)

**Run per `docs/SESSION-PROMPTS.md` S6, on top of S4.** `src/core/audio.js`
grew the three channel techniques the source games lean on constantly.
Nothing in `dBoss`, `bosses.js`, room data or item logic was touched — this is
purely the audio engine plus `feel.js` constants plus two checkers.

### What was built

- **Vibrato** — `cfg.<channel>.vibrato = { delayFrames, stepFrames, depth }`.
  A held note's pitch steps up/down by `depth` semitones on a `stepFrames`
  grid via repeated `osc.frequency.setValueAtTime` calls (never a ramp —
  that was the session's stated failure condition), starting only once
  `delayFrames` have passed since the note's own onset. Defaults
  (`VIBRATO_DELAY_FRAMES` 10f, `VIBRATO_STEP_FRAMES` 4f,
  `VIBRATO_DEPTH_SEMITONES` 0.18) are in `feel.js`, all `guessed`.
- **Echo** — `cfg.<channel>.echo = { of: 'p1', rows, volMul }`. A CHANNEL
  CONFIG, not hand-copied pattern text: the echoing channel must omit its own
  pattern text for that pattern entirely, and the engine replays whatever the
  source channel actually did `rows` rows earlier (default 2), at the echo
  channel's own configured volume times `volMul` (default 0.45). It reads a
  small `_rowLog` of what already happened rather than re-deriving anything.
- **Arpeggio** — a chord token written `'C4+E4+G4'` in ANY pattern string
  cycles through those notes on that one channel at `ARPEGGIO_STEP_FRAMES`
  (3f, `feel.js`, `guessed`). This is the one PER-NOTE technique: a plain
  note on the same channel is unaffected, only a token with `+` arpeggiates.
- **`check-music.mjs`** now also validates a vibrato-configured note's SWUNG
  extreme (not just its written pitch) against the channel's real frequency
  range, and validates every note inside a `+` chord token the same way a
  plain note is checked.
- **`check-audio-render.mjs` (new, `V20`)** proves the shared scheduling path
  is unchanged: it traces the exact sequence of Web Audio calls
  (`setValueAtTime`/`start`/`stop`) a track schedules, against a recorded
  baseline (`tools/audio-render-baseline.json`), using a tiny mock
  `AudioContext` in plain Node — no browser. `Audio.init()` now takes an
  optional context override for exactly this. **Why not just render real
  audio and hash the samples:** that was tried first and failed even for two
  runs of identical code — real `OfflineAudioContext` rendering is not
  bit-reproducible across separate script/page contexts in the same browser.
  See `T71` and `docs/HANDOFF.md`. This tool is wired into `tools/test.mjs`
  (`V16`) the same way `check-sfx.mjs` is.
- A new in-browser test block in `tools/test.mjs` (`--- music engine: vibrato,
  echo, arpeggio ---`) builds three tiny synthetic tracks (one per technique)
  and asserts the actual scheduled frequencies/timings/gains are correct —
  not just "unchanged", but "does what it says": no wobble before the delay,
  alternating up/down steps at the exact configured depth and frame spacing,
  the echo channel repeating the lead's exact pitches at the exact delay and
  a quieter (but present) gain peak, and the arpeggio cycling the chord in
  order on the exact frame grid.
- **None of the 22 pre-S6 tracks were touched.** A 23rd track, `engineDemo`,
  was added purely to audition the three techniques — it is NOT wired to any
  room or map and does not count as "the game's music"; S7 (composition)
  should feel free to delete or repurpose it once real tracks use these
  techniques.

### Cross-check performed this session (not a permanent tool, just a proof)

Checked out commit `64a6561` (pre-S6) into a git worktree and traced all 22
pre-S6 tracks with the SAME mock-context instruction-tracer against both the
old and new `src/core/audio.js`. **Every one matched byte-for-byte.** The
naive sample-hash approach, tried first, reported all 22 as "different" —
which is exactly the false-positive `T71` describes, not a real difference
(confirmed by the instruction trace matching exactly).

### What to listen for (`§4.2` — this is your call, not a checker's)

Build is committed. Open `dist/oracle-of-tides.html`, open the browser dev
console, and run:

```js
__game.audio.init();
__game.audio.play('engineDemo');
```

It loops a ~4-second phrase. Listen for:

1. **The lead (p1, a held triangle-ish pulse tone)** — does the wobble that
   kicks in partway through each note read as a Game Boy vibrato (a stepped,
   slightly buzzy waver) or as a smooth synth-pad LFO? If it sounds smooth,
   `VIBRATO_STEP_FRAMES` (4f) is too fast relative to the ear's ability to
   hear the steps — try doubling it first.
2. **The echoed voice (p2)**, which should sound like a quieter, slightly
   delayed shadow of the lead, not a separate harmony line.
3. **The bass (wav channel)** holding a chord — does the arpeggio read as one
   chord, or as an audibly separate scale run? If the latter,
   `ARPEGGIO_STEP_FRAMES` (3f) needs to come down.

Also worth a quick sanity pass through the actual game (any town, any
dungeon, the title screen) to confirm nothing sounds different there — it
shouldn't, and `check-audio-render.mjs` says it doesn't, but your ear is the
`§4.2` check a tool can't do.

### Verification run this session

`node tools/check-music.mjs` (23 tracks, 59 sfx, OK), `node
tools/check-audio-render.mjs` (23 tracks traced, OK — and shown FAILING
against a deliberately broken build first), `node tools/test.mjs` (78
passed, 0 failed, including six new music-engine assertions), `node
tools/replay.mjs` (51/51, **zero re-recording needed** — this change is
audio-only and never touched simulation timing), `node
tools/check-playthrough.mjs` (19/19), `node tools/check-build.mjs` (OK).

## S5 — Bosses: winnable by design, not by AI (this session)

**Run per `docs/SESSION-PROMPTS.md` S5, on top of S4.** `dBoss` was not touched
(`T34`). Every change is a number or a gate in `src/data/bosses.js`, plus one
number in `enemy.js` and two harness bugs.

### All six bosses are winnable now. `T33` is closed.

| D | boss | in-order | before | after | wins at |
|---|---|---|---|---|---|
| 1 | Gohmaraq | 3 hearts | 16/24 died | **20/24** died | **4 hearts** |
| 2 | Anemos | 4 hearts | 12/30 died | **KILLED**, 1 qh left | **4 hearts** |
| 3 | Gloomtide | 5 hearts | 28/36 died | **KILLED**, 8 qh left | **5 hearts** |
| 4 | Wyverna | 6 hearts | *"40/44 died"* | **KILLED, UNHURT** | **6 hearts** |
| 5 | Rootmaw | 7 hearts | *"24/52 died"* | **KILLED**, 15 qh left | **7 hearts** |
| 6 | Nereth | 8 hearts | 0/80 died | **42/80** died | **11 hearts** |

"In-order" counts **no heart pieces** — 3 hearts plus one Container per boss
already beaten. **Four of six win at that floor.** D1 wants one heart's worth of
pieces (4 of the 24 in the world) and D6 three hearts' worth (12 of 24); 9 sit
in the overworld and 3 in the caves before any dungeon is counted, so both are
comfortably inside the route.

### The structural ceiling was one missing number

`charge()` had a maximum range and **no minimum**. Gohmaraq's phase-2 range is
130px over an arena barely larger, so its melee-vulnerable range was a strict
subset of its charge-trigger range: walking into sword reach *was* the retrigger,
and charges chained with no idle frames. That is `T33`, and it is why an
unlimited-health run stuck at 14 hp across 60,000 frames.

**A charge is a gap-CLOSER.** `ENEMY_CHARGE_MIN_RANGE = 40` (feel.js, `guessed`,
outside sword reach) stops it firing at a player who has already closed. The
god-mode run that used to stall forever now **kills in 820 frames**. Real
combat: 16/24 → 20/24 at three hearts, and a win at four.

It is not trivial: at 14 qh the actor deals 24/24 and *still dies* — a mutual
kill, one quarter-heart either side of the line. The close-range punish did not
need adding; every charging boss here already runs a timed slam that sprays
regardless of distance.

### Two bosses were already won and the harness said they were not

`measure-boss-combat.mjs` sampled `g.boss.dead` — but `g.boss` goes **null** when
the entity is removed, so a kill reported as `still alive after 9000 frames
(never finished)` with `? of 44` damage. **Wyverna kills flawlessly at six
hearts taking zero damage**, and Rootmaw at seven. The rows quoted in `A8` for
both were never real.

`T38` had already named the answer for the opposite symptom — `progress.beaten`
is ground truth — and this is `T39` inverted: there, "the enemy is gone" was
wrongly read as a victory; here it was wrongly read as a failure. Now `T68`.
**Had I trusted the table, I would have spent the session "fixing" two fights
that were already right.**

### Gloomtide needed no code change — the harness was fighting it wrong

`check-bosses.mjs`'s FIGHTS table fought it at MID, because "the sanctum current
runs at MID and carries it". That is a description of the boss being **strong**:
`gloomCurrent` returns **1.7x** speed at MID and **0.65x** everywhere else.
Every other row in that table names the level that makes its boss *vulnerable*
("its drying shell holds the eye open", "beached and defenceless at LOW").

Corrected to LOW in both tools. **It is won at the in-order five hearts, with no
change to the boss at all**, the moment the player does the obvious thing and
drains the sanctum. `T69`. A shell-less boss has no "tide its weak point opens
at", so that column means something different for it.

### Nereth: 0/80 → winnable at 11 hearts, from two separate faults

1. **The volley and the opening fired on the same frame.** Every one of his
   first three phases ended its `windUp` callback with `spread(...)` *and*
   `nerethOpening()` — three damage-3 spears leaving at speed 2.0 in the instant
   the 55-frame window began. The invitation and the punishment for accepting it
   were the same event. `nerethOpening` now delays by `NERETH_OPENING_DELAY`
   (34f, enough to carry the volley ~68px past a player standing at 40).
   **0/80 → 42/80 on its own.**
2. **He summoned across four phases and cleared nothing.** A wizzrobe, up to
   three stalfos, a darknut and up to four keese, all still alive in phase 4 —
   the endgame was a nine-body brawl he happened to be standing in. The damage
   log for the stalled 600 frames is *stalfos, darknut, stalfos*, not Nereth.
   `dismissSummons` on every phase change. **60/80 → 78/80 at ten hearts.**

He also stopped firing into his own window (below). Wins at 11 hearts finishing
on **3 quarter-hearts** — a knife-edge, which is right for a final boss.

### Anemos: the longest fight in the game, at position two

30 hp against a **level-1 sword's 2 damage** is **fifteen connected hits** —
more than Nereth's fourteen, more than Gohmaraq's twelve, and the sword upgrade
does not arrive until after this dungeon. The hit count is meant to rise across
the game and this was a spike at the second boss with the weakest weapon. Now 24
hp = twelve hits, level with D1; the fight is already harder than D1 in every
other way (rooted, so it cannot be kited; rings and a rotating sweep that ignore
position; two summon waves).

Its lash also got `ANEMOS_LASH_MIN_RANGE` (32px), mirroring the charge fix — it
triggered on `dist < 44/48/52`, which includes the 24-30px a player stands at to
swing, so attacking was the trigger for five damage-3 spears in a 40° fan with
no gap to step into at that range. Honest accounting: this was worth the least
of the three changes (12→14) and is kept for consistency of the rule.

### The rule both final phases broke — and why it is not a checker

**A boss does not fire into its own window.** Nereth's phase 4 and Anemos's
phase 3 both ran their attacks on independent timers regardless of the weak
point, so the window each advertises existed on paper and never in play. The
signature is unmistakable once seen: **the fight plateaus at a fixed hp that no
amount of player health moves** — Nereth at 60/80 from 10 to 14 hearts, Anemos
at 20/24. Gating each on `!e.weakOpen` moved both immediately. No attack
changed: same projectiles, same counts, same damage.

**I wrote a source-level checker for this and removed it.** It fires on
Gohmaraq, Wyverna and Rootmaw — all three of which are won at in-order health.
Gating their fire would have been changing balanced fights to satisfy a tool.
The rule is a **diagnostic for a plateau**, not an invariant, and it is written
down as such above `closeTick`. `T70`.

### `T42` fixed, and a harness that can now ask the right questions

`Boss.update` clears `charging` (and any part-finished step) on every phase
transition. It was set true by `charge()` and cleared only inside `charge()`'s
own branch on a later call, so Gohmaraq's final phase — which never calls
`charge()` — left it stuck true for the rest of the fight.

`measure-boss-combat.mjs` gained three things it needed and lacked:
`--qh=N` plus an **in-order default per dungeon** (fighting D6 at 12 qh asks a
question no player is ever in), `--tide=N` (how the Gloomtide finding was
made), and the `beaten` ground truth above.

### Verified

```
check-bosses      19/0 (GOD MODE — see below)   test            71/0
replay            51/0 (untouched)              check-playthrough 19/0
check-hearts   114/114                          walk-dungeons   23/0
check-progression 19/0                          check-overworld 17/0
check-gates       26/0                          check-towns     58/0
check-items       91/0                          check-trade     43/0
check-motion       8/0                          check-sfx       OK
check-guide        4/0                          validate        OK
check-build       OK — boots from file://
```

**`check-bosses` runs in GOD MODE and proves only that every boss spawns and
every shell opens** (`T37`). The winnability numbers above come from `V17`, and
`V17` is a robot.

### Hand it back: per `§4.2`, whether these fights are FAIR is yours

**A robot beating a boss is not a player beating a boss, and a boss the actor
cannot beat may be perfectly fair.** Every number here is one fixed approach.

1. **Gohmaraq (D1)** — the one to check hardest. `ENEMY_CHARGE_MIN_RANGE` is a
   global: it changed *every* charging enemy in the game, not just this boss.
   **Does the charge still read as dangerous?** If it now feels safe to stand
   next to anything that charges, that number is too high.
2. **Anemos (D2)** — I cut its health by a fifth. **Does it still feel like a
   step up from D1?** The hit-count argument says yes; only playing it settles
   it.
3. **Nereth (D6)** — fight to phase 4 and see whether clearing his summons on
   each phase change reads as him losing his grip, or as the game helping you.
   That is the change I am least sure of.
4. **Gloomtide (D3)** — blow the conch to LOW and confirm the fight transforms.
   If it does not, the tide correction is wrong and the old MID row was right.
5. **Wyverna (D4)** — she is killed *without taking a hit*. That may now be too
   easy; nothing was changed for her, so if she is boring the cause is S1's
   hitstop.

---

## S4 — Sound: close the silent gaps (this session)

**Run per `docs/SESSION-PROMPTS.md` S4, on top of S3.** Bugs first, as the
prompt insisted. The checker found more than the handoff knew about.

### There were SIX silent no-ops, not four

`A4` listed four. The checker found six, and the two extras are exactly the two
a hand-audit structurally cannot see:

- **`sfx: 'rumble'` at `tiles-core.js:1680`** — in DATA, not code. It is the
  `boulder` transform, the tile the Dredge Line hauls out of the way, and the
  call site is `if (tr.sfx) this.audio.sfx(tr.sfx)`. No grep of `src/game/` can
  see that name. **This is why the checker's second pass reads the data tables**
  rather than only scanning call sites; without it the tool would have looked
  thorough and missed a real bug.
- **The second `sfx('hookshot')`** at `items.js:1091`. The handoff did list both
  line numbers, but a fix driven by the prose rather than the tool would have
  taken the first.

### Two of the three were also MISNAMED, which is a bigger finding than missing

- **`sfx('swim')` at `player.js:883` is not swimming.** It is the **Squall
  Bellows** puffing while the button is held. There has never been a `swim`
  sound and there did not need to be one — the name was wrong twice over. Now
  `gust`: breathy, quiet, low-pitched, because it fires every few frames for as
  long as the button is down and anything with a pitch in it becomes a drone.
- **`sfx('hookshot')` is the Tidewright's Anchor's chain reeling in.** Named
  after the Oracle item this one exists specifically not to be (`R11`). Now
  `reel` — a chain hauling itself in, not a spring.
- **`sfx('secret')` is `T44` exactly**: `secret` is a JINGLE, and `jingle()` and
  `sfx()` read different tables. The fix is NOT to call the jingle. `secret` is
  the discovery fanfare and is already used correctly in three places; a
  resonance bell that rings every time something is in earshot needs its own
  voice, not the reward flourish. Now `chime`.

### Four dead definitions, not three — and one of them was the opposite bug

`dig`, `shoot` and `pegasus` were **removed**: this game has no shovel, no
player projectile, and a Pegasus Seed would be a straight Oracle port (`R11`). A
sound with no verb is not harmless — it reads as a verb somebody forgot to wire,
and the next session spends its time deciding that again.

**`seed` was the reverse.** The verb existed and had been given the wrong sound:
the Reefseed's `plant()` played the generic `place`. The sound and the verb had
both been in the tree the whole time and had never met.

### The coverage audit: five gaps, none of them findable by any checker

These are calls that do not exist, not calls that fail. **`§4.2` territory** —
the only way to find them is to walk the verbs.

| Gap | Was | Now |
|---|---|---|
| **The tide sweep** | `src/game/tide.js` had **zero audio calls of any kind**. The game's one mechanic reshaped the world in silence | `tideSweep`, on a real sweep only — `instant: true` is a save restore or a boss pinning the tide, neither of which is the sea crossing the screen |
| **Leaving the water** | entering played `splash`, leaving spawned the effect and no sound — the sea sounded like something you could only fall into | `splash`, pitched up |
| **Taking a ledge** | silent off the edge, `land` on arrival: a thump with no push behind it | `jump` pitched down, at **both** launch paths |
| **Low health** | did not exist at all | `lowHeart`, every `LOW_HEART_EVERY` frames at or below `LOW_HEART_THRESHOLD` |
| **A boss phase change** | played `charged` — the wind-up before EVERY heavy attack | `bossPhase` |

**The boss one is the finding worth keeping.** It was never a no-op, so nothing
in the verification table could ever have flagged it: a *wrong* sound is still a
sound. That is now `T66`. And the ledge hop is `T67` — half of a symmetric verb
is where a missing sound hides, and it has **two** launch paths, only one of
which is findable by grepping the obvious function name.

`LOW_HEART_THRESHOLD` (8 qh) and `LOW_HEART_EVERY` (40 f) are in `feel.js` with
units and `guessed` provenance, per `R3`. The threshold is set against **this
game's** damage ladder rather than the source's: a boss's heavy hit is 3-4 qh
here, so 8 is "one more mistake".

### The checker, and the proof it earns its place

`tools/check-sfx.mjs` — `V19`, wired into `V16`, row added to `CLAUDE.md` and to
`§4.1`. Three passes:

1. **Literals**, resolved through ternaries and `||` fallbacks, so
   `sfx(lv >= 3 ? 'sword3' : 'sword2')` and `sfx(o.sfx || 'charge')` are both
   covered. Those are the six the handoff warns "look dead to a naive grep" —
   the tool sees all of them and does not false-positive on one.
2. **Data tables**, for the names a static scan cannot reach (`tr.sfx`,
   `reward.sfx`, `step.sfx`, `w.sfx`). **This pass is what found the sixth bug.**
3. **Dead definitions**, as a warning rather than a failure — a sound nobody
   plays is not something a player can hear, but it is nearly always a verb that
   lost its sound.

It deliberately does **not** compare against track names: `play()`/`jingle()`
read a different table (`T44`), and `boss`/`title` are tracks. When an sfx name
collides with a track name it says so, which is how the `secret` bug reports.

**Proved red before green**, as the prompt demanded — this exact checker, run
against `main`:

```
check-sfx: 55 sfx defined, 55 referenced (18 of them from data tables)
  warn: 'dig' / 'seed' / 'shoot' / 'pegasus' defined and never played
  FAIL src/game/items.js:516   sfx('hookshot') is not defined
  FAIL src/game/items.js:664   sfx('rumble') is not defined
  FAIL src/game/items.js:1091  sfx('hookshot') is not defined
  FAIL src/game/objects.js:1200 sfx('secret') is not defined
       — 'secret' IS a music track; jingle()/play() read a different table (T44)
  FAIL src/game/player.js:883  sfx('swim') is not defined
  FAIL src/data/tiles-core.js:1680  data field sfx: 'rumble' is not defined
check-sfx: 6 silent no-op(s)                                       exit=1
```

and now: `59 sfx defined, 59 referenced` — **no silent call, no dead
definition**, exit 0.

### Verified

```
check-sfx           OK (59/59)      check-music       OK
test                71 passed, 0    replay            51/0
validate            OK              walk-dungeons     23/0
check-overworld     17/0            check-progression 19/0
check-towns         58/0            check-gates       26/0
check-items         91/0            check-charms      63/0
check-trade         43/0            check-hearts   114/114
check-motion         8/0            check-torches      5/0
check-playthrough   19/0            check-bosses      18/0 (god mode)
check-guide          4/0            solve-switches    all 9 solvable
check-build         OK — boots from file://
```

`V11` green with no re-recording: sound does not touch the simulation.

### Hand it back: how to hear each one

Per `§4.2` a checker proves a sound exists, not that it is right. **Eight new
sounds, all unjudged.** In `dist/oracle-of-tides.html`:

1. **`tideSweep`** — press the conch anywhere outdoors. This is the most
   important one to get right: it plays on every tide change for the whole game.
   **Does it sit under the conch or fight it?**
2. **`lowHeart`** — take damage down to two hearts or fewer and stand still.
   It repeats forever while you are in danger, so **if it nags, it is wrong**;
   `LOW_HEART_EVERY` in `feel.js` is the first number to move.
3. **`gust`** — hold the Squall Bellows. It fires every few frames; listen for
   whether it becomes a drone.
4. **`reel`** — throw the Tidewright's Anchor and press B again to recall it.
5. **`rumble`** — plant a Reefseed on open water (pillar erupting), and haul a
   boulder with the Dredge Line on the Cliffs of Kell.
6. **`chime`** — ring a resonance bell with the Rod. Compare against the
   `secret` fanfare, which it used to try to play: **it should not sound like a
   reward.**
7. **`seed`** — throw a Reefseed and let it land.
8. **`bossPhase`** — fight Gohmaraq in D1 to its second phase. **Compare it
   against the wind-up before a charge**, which is what it used to be; the two
   must not be confusable.

Plus two moved sounds: **leaving deep water**, and **dropping off a ledge**.

---

## S3 — Terrain extraction, pass 2: edges, cliffs and town fronts (this session)

**Run per `docs/SESSION-PROMPTS.md` S3, on top of S2.** Two of the four jobs
landed, one was already done, and one is blocked by the sheets themselves. All
four are written up; nothing was left silently undone.

### The cliffs were not a drawing problem, they were a MISSING PIECE problem

`cliffTop` was registered, had art, and was **placed zero times in the whole
overworld** — 1,307 cells of `#` and not one `^`. So every cliff in the game was
a solid mass of body tile with no edge anywhere. Swapping the art alone would
have produced a better-drawn wall of bricks; the reason cliffs never read as
cliffs is that the game had ONE PIECE where the source has a set. This is now
`T65`, and `foamN` is in exactly the same state today.

**So the fix is an autotiler, and it needs no room data at all.** A tiledef may
now declare:

- **`family`** — tiles that are the same MASS. Every palette-swap of a cliff
  (`cliffDk`, `cliffSand`, `cliffCoral`, `cliffMarble`, `cliffAbyss`,
  `cliffRust`, `cliffCracked`) declares `family: 'cliff'`, so a region seam
  where `cliffDk` meets `cliff` is one hillside in two lights and does not grow
  a lip down the middle of it.
- **`edgeArt`** — `{ up: 'cliffTop' }`: the art to draw instead of this tile's
  own when the neighbour that way is a different family.

`Room.artAt` does the neighbour lookup, because the room owns the grid — the
same reason `solidAt` lives there (`R4`). **Off the edge of the screen counts as
the SAME mass**, and that is the decision that makes the feature usable: a cliff
running along the top row of a screen continues into the screen above it in
every source game, and the room cannot see that room's grid, so the other choice
draws a lip along the top of every screen in the game. Proved: flipping it to
`null` fails two assertions and reports `6 of 6 top-row cliff cells drew a lip`.

`cliffCracked` joins the family but keeps its own art at the top row — the crack
IS the tell, and a lip drawn over it would hide the one thing the player has to
see.

### The art, and the tool that unblocked picking it

`cliff` and `cliffTop` come off Seasons' own terraced cliffs
(`oracle-seasons-overworld-spring.png @ 1224,742` and `@ 1224,726`). `cliffTop`
is the overhang lip — a light band with a hard dark line under it, over the
first masonry course. `cliff` is two more courses and is **vertically seamless
with itself**, which is what lets a cliff mass be any depth.

**Neither could be found by the seamless scan, and that is structural.** A cliff
face is one or two cells tall on a sheet, so it never repeats at +16 in y, which
the scan requires. Ground can be found without knowing the sheet's grid phase —
a window repeating at +16 in both axes is correctly phased by construction — but
a cliff, a shoreline or a building front can only be read off the grid, so the
grid has to be found first. `rip-terrain.py --phase <sheet> X0 Y0 X1 Y1` is
committed for it.

**Measure the phase LOCALLY** (`T64`). These sheets are assembled maps with large
non-map margins: the Seasons spring sheet reports phase (0, 12) whole-sheet and
**(8, 6) over its cliffs**, and only the second produces cells containing whole
tiles. Three attempts at picking cliff cells failed on the whole-sheet figure
before this was noticed.

### Town fronts (job 4): audited, and there was no gap

All **51** `TOWN_ART` cells and all **10** `TOWN_BLOCKS` are already extracted
from the Subrosia tileset; none of them is in `HAND_ART`. The job is complete
and nothing was changed. Screenshots of all four town screens at all three tide
levels are in `tools/shots/` (`4,7` Tidewatch Village, `4,8` Village Shore,
`5,8` Driftwood Strand, `9,8` Sandpiper Row) — `check-towns` is 58/0, so no
screen is severed at any level (`T13`).

### Water edges (job 2): blocked by the sheets, and the mechanism is ready

**The autotiler fits this job exactly.** `Room.artAt` resolves the tide before it
compares families, so a derived shoreline would be correct at all three tide
levels automatically — which is the property the job demands, and the reason
`foamN` has never been placed in a single legend: a foam tile placed by hand is
wrong at two levels out of three.

**The blocker is that water is ANIMATED and every sheet here is a static map.**
`rip-terrain.py`'s header has said so since it was written: "The sheets are
static maps and hold no second frame, so water stays hand-drawn." Foam for four
directions at three frames each cannot be extracted from them. That is `R5`'s
second branch — draw it to match — and it wants a person. **A one-sided foam
edge must not be shipped**: 50 of the overworld's 52 static water cells touch
land, and foam on the north side only is the same "reads wrong immediately"
failure the prompt warns about for cliffs without inside corners.

### Tree borders (job 3): the premise does not survive checking the source

The job is to "break the period", so the first thing done was to look at whether
the source has one. **It does.** Crops of Seasons' own forests show every tree
**identical and repeating** — see `tree1.png` in this session's scratch, or crop
`oracle-seasons-overworld-spring.png` at (1600,1200). Giving our trees varied
crowns would be a deviation from the source, and `R9` says fidelity wins, so it
was not done.

What IS different is real but is not an extraction problem: **our rooms pack
identical trees shoulder to shoulder into an unbroken wall, and the source
spaces them across the ground and mixes other objects in.** That is a room-data
change across 1,000+ cells carrying the full `T10` stranding risk, and it wants
its own session with `V2`/`V3` after every batch. Backlogged with that framing.

Also found: **the `quad` field the ripper's header describes does not exist in
the engine.** `QUADS = []`, `registerTiles` never named `quad`, and `Room` has
no quad logic — `T15` again, in documentation rather than in data. The 32x32
constraint it was written for is real and confirmed (every tree on every sheet
is 32x32; 643 of this game's vertical tree runs are one row tall, so a quad tree
cannot serve them). Either implement it or delete the comment.

### Verified

```
validate            OK              test              70 passed, 0 (+5 cliff edge)
replay              51/0  <-- unchanged, no re-recording
walk-dungeons       23/0            check-overworld   17/0
check-progression   19/0            check-gates       26/0
check-towns         58/0            check-items       91/0
check-charms        63/0            check-trade       43/0
check-hearts     114/114            check-motion       8/0
check-torches        5/0            check-playthrough 19/0
check-bosses        18/0 (god)      check-guide        4/0
solve-switches      all 9 solvable
check-build         OK — boots from file://
```

**`V11` green again with no re-recording**, which is the same proof S2 relied on:
the cliffs look different and the game plays identically. The five new
`--- cliff edges ---` assertions were proved to fail against a deliberately
wrong boundary rule before being believed.

### Hand it back: what to look at

Per `§4.2` the read is yours.

1. **The cliff A/B.** `overworld,1,1` (The Long Drop) and `overworld,5,2`
   (Cracked Basin) — the two rooms where the most cliff cells have open ground
   above them. `git stash` and re-shoot to see the old ones. **Compare the top
   row of each cliff mass**: that is where the lip now is.
2. **Every town at all three tides** — the twelve shots listed above.
3. **`overworld,2,2` (Upper Kell) and `overworld,3,1` (Iron Watch)** for cliffs
   in the stone and sand palettes.
4. **The thing I could not judge: does the lip read as an overhang or as a
   highlight?** `cliffTop` had six colours on the sheet and was merged down to
   four, which is where a lip would lose its shape. If it reads flat, the pick
   is `oracle-seasons-overworld-spring.png @ 1224,726` and neighbours at
   ±16 are alternatives.
5. **Whether cliffs now want their sides too.** `tileEdgeArt` already takes
   `left`/`right`/`down`; what stops it is the corner piece, which is written up
   in `docs/ART-BACKLOG.md`.

---

## S2 — Terrain extraction, pass 1: the ground you stand on (this session)

**Run per `docs/SESSION-PROMPTS.md` S2, on top of S1.** Scope held: the ground
only. Cliffs, water edges and town fronts are S3 and were not started.

### `T19` first: the ripper reproduces byte-identically

Run before anything was changed, per the prompt. `md5sum` of
`src/data/tiles-terrain.js` was identical before and after
`python3 tools/rip-terrain.py`, so the generated file had **not** been
hand-edited and the extraction path was safe to build on.

### The grid was one hand-drawn tile, and it is extracted now

`A2` said "there is exactly one `grass` tile... that is the visible grid," and
that was exactly right. The hand-drawn `grass` was a flat field of one tone with
about fourteen dark speckles in a FIXED constellation. Rendered as a whole 10x8
room it is a regular lattice of dots on a 16-pixel pitch — you can count the
pitch. The speckle density was the problem: sparse enough that each mark is a
landmark, regular enough that the eye lines them up.

`grass` is now **Seasons' own field grass**
(`oracle-seasons-overworld-spring.png @ 1095,420`) — a fine, dense, irregular
speckle of the light tone over the mid one, at a density where no single mark is
a landmark, so there is nothing to line up. **The hand-drawn original was
deleted from `tiles-core.js`**, per the prompt's job 4 and `R5`: an extracted
tile and the hand-drawn tile it replaced, left side by side, is how the two
slowly diverge.

A second tuft cell, `grassClump` (`custom-oracle-style-overworld.png @
2367,847`), was extracted to give `grass` something to scatter that is not the
tile an author places deliberately with `G`.

### Ground variants: a hash, and a SCATTER rather than a mix

A tiledef may now declare `variants` (other art names it may be drawn as) and
`variantOdds`. `tileVariant` in `src/world/tileset.js` picks:

```js
if (hash32('tilevar', roomKey, tx, ty) % def.variantOdds !== 0) return def.name;
return v[hash32('tilepick', roomKey, tx, ty) % v.length];
```

Two independent hashes, not one divided — deriving the pick from the quotient of
the gate correlates them. The room key is in the hash so the same coordinates in
two rooms do not choose alike, which would put identical tufts in the same place
on every screen: a subtler grid than the one being removed. Per `T2` it is a
pure hash and consumes nothing, so `Room.render` running at display rate cannot
desync a replay or make the ground flicker.

**`variants` had to be named in `registerTiles`** or it would have been silently
discarded, exactly as `liftLevel` was for the life of the project.

`grass`, `grassDark` and `grassBog` scatter `grassClump` and `grassTuft` at
**one cell in seven**.

### The rate was measured, not guessed — and the obvious design is wrong

**An even mix of variants is WORSE than the grid.** Four good grass candidates
mixed at equal weight, rendered as a full room, read as a **chessboard**:
`rip-terrain.py` quantises each tile against its own four colours, so two tiles
that look alike on a sheet land on different palette indices and their shared
edge becomes a hard tonal seam. This is now `T61`, and it is why the rate was
settled by rendering whole rooms:

| rate | reads as |
|---|---|
| every cell (even mix) | a chessboard — worse than the grid |
| 1 in 4 | busy; starts to read as a pattern |
| **1 in 7** | **a meadow** |
| 1 in 12 | accidental; the tufts look like mistakes |
| base only | clean, no grid, but dead |

The companion rule is `T62`: a candidate's palette-index distribution must match
its base's, or the variant reads as a patch rather than as variation. Our
`grass` is index-1 dominant (78/17/3 for `grassTuft`, and `grassClump` matches
it to three significant figures). The pale grasses on the sheets are 81/13/5 and
the dark ones are 5/45/49 — those are whole different grasses, not variants of
ours, and they are written up for S3 rather than forced in here.

### A negative result worth more than the tiles: the source has no supercells

`--scan` only finds windows that repeat at +16 in both axes, so a field built
from a 2x2 set of alternating cells is invisible to it — and that is exactly
where multi-cell ground variation would live. **So the scan was written.**
`python3 tools/rip-terrain.py --supercells <sheet> [N]` is committed, and the
answer across every sheet is:

| sheet | 32x32 supercell windows |
|---|---|
| `custom-oracle-style-overworld` | 758 *(against 4,129 at 16x16 in ONE grass region)* |
| `oracle-seasons-overworld-spring` | 9 |
| `oracle-ages-overworld` | **0** |
| `oracle-seasons-tileset-subrosia` | **0** |

**Oracle's ground fields are genuinely single-cell repeats.** Their variety comes
from a person placing detail cells by hand, which is precisely what our hash
scatter approximates. This is `T63` and it is committed as a tool so nobody
spends another session asking.

### `dFloor` got a variant, and it was reverted

`oracle-seasons-dungeon-backgrounds.png @ 258,42` profiles at 34/50/14 against
`dFloor`'s 27/53/18 — the closest tonal partner on any sheet. It was extracted,
wired at one-in-nine, screenshotted, and **backed out**: `dFloor` is a scallop
and 258,42 is a diagonal streak, so scattered through a floor it read as random
patches, not masonry. Removing it meant deleting its entry from the ripper's
`PICKS` and re-emitting, not deleting lines from the output (`T19` cuts both
ways). Its coordinates are in `docs/ART-BACKLOG.md` so the next session does not
re-hunt it.

### `rockFloor` is the biggest piece of grid left, and no sheet can fix it

It is `g` in the reef, cliffs and abyss legends — a large-area ground — and its
cobble motif repeats visibly at room scale. It is a full four-tone tile
(23/26/24/25) and **nothing on any sheet shares that profile**; every floor
candidate found is three-tone. That is `R5`'s "if no sheet has it, draw it to
match" branch, which wants a person's eye. Backlogged.

Sand, `sandWet`, `sandRipple` and `mud` were rendered at room scale, found
fine-grained enough that no lattice appears, and **deliberately left alone**.

### The invariant is asserted, not trusted

`validateTiles` now rejects a variant whose flags, solid mask or `over` differ
from its base, a variant that is animated, a variant that nests variants, and a
tide tile that declares variants at all. **A variant that changed passability
would make a patch of a field solid in a pattern nobody authored and no room
grid shows — it would render perfectly and be nearly impossible to trace from
the symptom.** Proved by giving `grassClump` `F.SOLID`: `validate.mjs` reports
`grass: variant 'grassClump' has different flags` for all three bases.

### Verified

```
validate            OK                replay            51/0   <-- see below
test                65 passed, 0      walk-dungeons     23/0
check-overworld     17/0              check-progression 19/0
check-gates         26/0              check-towns       58/0
check-items         91/0              check-charms      63/0
check-trade         43/0              check-hearts   114/114
check-motion         8/0              check-torches      5/0
check-playthrough   19/0              check-bosses      18/0 (god mode)
check-guide          4/0              solve-switches    all 9 solvable
check-build         OK — boots from file://
```

**`V11` stayed green and that is the point.** The prompt said a terrain change
should NOT move a replay, and that if it does the variant choice is leaking into
simulation. All 51 replay assertions passed untouched — no re-recording, no
churn. Combined with the `validateTiles` invariant, the variant mechanism is
provably draw-only.

### Hand it back: what to look at

Screenshots in `tools/shots/`. Per `§4.2`, **whether the grid is actually gone
is your call, not mine.**

1. **The A/B that matters.** `room-overworld_4_6-tide1-px80.png` (South Wood)
   and `room-overworld_5_6-tide1-px80.png` (The Wading). To see the old ground,
   `git stash` this branch's changes and re-run
   `node tools/shoot-rooms.mjs overworld,4,6 overworld,5,6`. **Compare the
   grass in the corners of the screen** — that is where the lattice was easiest
   to count.
2. **Is 1 in 7 right?** `src/data/tiles-core.js`, the `variantOdds: 7` on
   `grass`. One line, then `npm run build`. Try 5 and 10.
3. **Every region at once.** `overworld,4,3` (wood), `3,6` (coast), `7,6`
   (dunes), `4,0` (salt), `8,4` (coral), `3,1` (cliffs), `0,6` (marsh). Only
   the grass regions should have changed.
4. **Does the new grass hurt sprite legibility?** It is busier than the flat
   field it replaced. Look at Link and an Octorok standing on it in
   `overworld,4,6` — this is the one way the change could be a regression, and
   a still frame is a fair test of it.
5. **`rockFloor` in `overworld,3,1`** — this is the grid that is still there,
   and it is the S3 question.

---

## S1 — Impact: hitstop, shake weight, and the missing feel constants (this session)

**Run per `docs/SESSION-PROMPTS.md` S1.** Branched from
`claude/roadmap-branch-reconcile-0o24l8` rather than `main`, because
`SESSION-PROMPTS.md`, `SESSION-HANDOFF.md` and `ROADMAP.md` — the three
documents S1 is defined by — exist only on that branch and are not yet merged.
`R0` says one session at a time merged before the next starts; that branch is
still unmerged, so **this session's work sits on top of it and both need to go
to `main` together.**

### Oracle of Tides now freezes on a hit

There was no hitstop anywhere in `src/` — not mistuned, absent. There is now.

`Game.freeze(frames)` raises `Game.hitstop` (longest wins, like `shake`, so a
bomb catching four enemies is one impact rather than four), and `Game.update`
returns early on it. **Where that return sits is the entire feature.** It is
below `frame++`, `input.update()`, `audio.update()`, `progress.frames++`,
`updateTimers()`, `updateFade()`, the shake countdown, `tide.update()`,
`scrim.update()` and the banner/itemShow/lure timers — and above
`updatePhaseShift()`, `player.update`, the entity loop, `camera.update` and the
room-exit/warp/puzzle checks. So the entity simulation stops and the music, the
HUD, the animated water, the tide sweep and the shake keep running. **A hitstop
that stopped the audio pump would stutter the music on every sword swing and is
the documented way to ship this feature broken; it is now `T58`, and
`tools/test.mjs` asserts both halves of it.**

Three weights, all `guessed`, all in `feel.js`:

| constant | frames | fires at |
|---|---|---|
| `HITSTOP_HIT_FRAMES` | 3 | `Entity.hurt` (every damage source funnels here) and `Boss.hurt` |
| `HITSTOP_HURT_FRAMES` | 6 | `Player.takeDamage`, past every shield, charm and invuln check |
| `HITSTOP_BOSS_DEATH_FRAMES` | 18 | `Boss.beginDeath`, under the same beat that cuts the music |

`Boss.hurt` needed its own call because it **overrides** `Entity.hurt` rather
than extending it — the shell block and the invuln early-return are the reason
the override exists, and neither should freeze anything. A boss taking a
non-lethal hit would otherwise have been the only hit in the game with no
weight. `setRoom` clears `hitstop` (`T59`).

### The six shake constants were re-tuned, and fourteen bare literals came home

The six were tuned with nothing in front of them, so a shake had to carry the
whole impact alone and had grown long doing it. With a freeze in front, the
shake's job is only to release the freeze. **Amplitudes held; durations came
down:** `SHAKE_SMALL_FRAMES` 8→6, `SHAKE_MEDIUM_FRAMES` 10→8,
`SHAKE_LARGE_FRAMES` **40→24** (two thirds of a second of continuous wobble read
as a rumble, not a blow; 18 frames of freeze plus 24 of shake is still shorter
than the old 40 alone).

Re-tuning them was going to be **cosmetic for every boss in the game**, because
`src/data/bosses.js` spelled its shakes out as fourteen bare literals — a live
`R3` violation, and the reason the six named constants described the shake of
everything except the bosses. Four constants were added to give those literals
honest names (`SHAKE_RUMBLE`/`_FRAMES` 2/12 for the tide being forced,
`SHAKE_BOSS_SLAM`/`_FRAMES` 4/14 for a landing, pound or summon,
`SHAKE_BOSS_BREAK`/`_FRAMES` 5/16 for armour shattering) and all fourteen call
sites now use them. Shake is a draw-time offset from a hash of `frame`, so none
of this moves a replay.

### Text cadence is in feel.js, and the text blip was not a rhythm

`dialogue.js:33` hardcoded `this.speed = 1.6` and line 86 hardcoded `fast ? 3 : 1`
— `R3` violations on the timing constant a player meets more often than any
except walking. Both are now `TEXT_SPEED` and `TEXT_FAST_SCALE`.

**`TEXT_SPEED` deliberately keeps its historical 1.6 ch/f.** Both source games
look closer to one character every other frame (≈0.5 here, three times slower),
but that is an impression and `R3`/`T4` do not let an unmeasured number move the
whole game's dialogue pacing. The suspicion is **written down in the constant's
own comment and left unapplied**, which is what S11's Job 2 is for. It is now a
one-line experiment for whoever steps a reference.

The blip did change. `Math.floor(this.chars) % 3 === 0` tested the *running
total*, not the characters revealed, so at a non-integer speed it fired on an
irregular beat that changed with the speed — the click was an artefact, not a
cadence. It now counts revealed characters (`TEXT_BEEP_EVERY`), which makes it a
rhythm at any speed. `beeped` resets everywhere `chars` does, or page two is
silent.

### Death poof: right already, changed nothing

Per the prompt's instruction not to rewrite things to look busy. `puff` is 4
frames at `rate: 4` = **16 frames**, which is the source's enemy-death poof, and
`Effect.spriteName` holds the last frame rather than looping. Left alone.

### Item-get pose: measurably wrong, and now derived

`ITEM_PRESENT_FRAMES` was 90. The `itemGet` jingle it exists to sit under is
20 rows at bpm 132 / rowsPerBeat 4 = 6.82 f/row, and its last struck note stops
ringing at row 17 — **116 frames**. Link put every new item in the game down 26
frames before his own fanfare finished. Now 116, and marked `derived` (from the
jingle's own tempo, which is checkable in `src/data/audio.js`) rather than
`measured`, which would be a lie.

### Replay churn: expected, deliberate, and diagnosed before re-recording

`T5` landed exactly as written: 9 of 51 assertions failed. **The diagnosis came
before the re-record** — every failure was in a replay that lands a hit, and
every replay that never fights (`village-walk`, `village-shop-door`,
`tide-steps-split`, `d5-overthrow`, `d1-sluicegate`, `d3-undertow`,
`d6-mooring`) passed untouched. That pattern is what makes it churn rather than
breakage.

Re-recorded with `--record-all`; 51/51 green. Outcomes compared old vs new:

| replay | outcome change |
|---|---|
| `d1-sluicegate`, `d3-undertow`, `d5-overthrow`, `d6-mooring`, `tide-steps-split`, `village-shop-door`, `village-walk` | **identical** |
| `d1-clawcrab-den-wide` | +17 frames, same end state |
| `d2-fork-wrong` | +3 frames, same end state |
| `d4-drowned-sill` | ends 8px further up the same room |
| `d1-descent` | 19→16 kills, 12→10 hearts, same frame budget |

`d1-descent` is the only one worth a sentence: the recording actor is a fixed
robot on a frame budget, and freezing it 3 frames per hit it lands and 6 per hit
it takes costs it about three kills' worth of time. That is the freeze being
real, not the actor getting worse.

### Hitstop is a small NET GAIN in real combat, not a tax

Measured with `V17` (`measure-boss-combat.mjs d1`, real combat, no god mode,
3 hearts, seed 20260806), before vs after:

| | boss damage dealt | player damage taken |
|---|---|---|
| before | 12 of 24 | 12 qh in 6 hits (5 projectile, **1 contact**) |
| after | **16 of 24** | 12 qh in 6 hits (6 projectile, **0 contact**) |

Both runs still end PLAYER DIED at 3 hearts, which is the known open problem the
previous session left (win threshold 8–10 hearts, see below). But the freeze on
a landed hit gives the player 3 frames of separation at the moment of contact,
and the one `boss-contact` hit is gone. **Nothing about the boss fights got
worse; do not spend S5's budget re-litigating this.**

### Three checkers could not run at all, and now do (`T60`)

`check-items` (V8) threw a Playwright install banner instead of running, in a
container where `test.mjs` and `solve-switches.mjs` were fine: five tools
(`check-items`, `check-charms`, `check-trade`, `find-ledges`, `preview`) called
`chromium.launch()` without the system-Chromium `.catch` fallback the others
already had. All five now carry it. **A checker that cannot launch is not a
passing checker** — V8, the tool that proves every item does the verb
`docs/ITEMS.md` claims, had been silently unrunnable here.

### What was verified, and what was NOT

Everything cited by the prompt, plus the full battery:

```
test.mjs            65 passed, 0 failed      (was 59; +6 hitstop)
replay.mjs          51 passed, 0 failed      (re-recorded)
check-playthrough   19 passed, 0 failed
check-bosses        18 passed, 0 failed      (god mode, says so itself)
validate            OK          walk-dungeons     23/0
check-overworld     17/0        check-progression 19/0
check-gates         26/0        check-towns       58/0
check-motion         8/0        check-torches      5/0
check-hearts     114/114        check-music       OK
check-items         91/0        check-charms      63/0
check-trade         43/0        check-guide        4/0
check-anchor        14/0        check-cleats      15/0
check-lens          24/0        check-bellows     60/0
check-reefseed      87/0        check-dredge     103/0
solve-switches      all 9 switch rooms solvable by pushing
check-build         OK — boots from file://
```

The six new hitstop assertions were **proved to fail in both directions** before
being believed: with `freeze()` stubbed to a no-op, three fail (including "the
player or the enemy moved while frozen"); with the hitstop return moved above
`frame++` — the exact frame-halt bug the prompt names as the failure condition —
the other two fail. Neither half is vacuous.

**NOT verified, and per `§4.2` not verifiable by any checker here: whether any
of it FEELS right.** Three frames may be too few to register or enough to read
as a hitch; 18 frames on a boss death may be a beat or a stall; 24 frames of
large shake may now be too short. Those are the point of the session and they
are the user's call. See the hand-off below.

### Hand it back: what to compare in `dist/oracle-of-tides.html`

1. **The sword hit.** New game, walk out of Tidewatch Village to the **overworld
   room at (4,6)** — `test.mjs`'s own combat room, which spawns enemies on
   arrival. Swing at an Octorok and watch the moment of contact. Compare against
   the same swing with `HITSTOP_HIT_FRAMES` set to 0 in `src/data/feel.js` (one
   line, then `npm run build`). **The two things to compare are the moment of
   contact and the frame the enemy starts moving again.**
2. **Taking a hit.** Same room, let one touch you. `HITSTOP_HURT_FRAMES` is 6 —
   twice the sword's. **Compare how hard the knockback reads out of the freeze**
   against 0.
3. **A boss dying.** D1's Gohmaraq. 18 frames of freeze land under the music
   cut. **Compare the death against `SHAKE_LARGE_FRAMES` at the old 40 with the
   freeze at 0** — that is the old feel, and it is the A/B that matters most.
4. **The text.** Any signpost. The blip is a rhythm now rather than an
   artefact. **And say whether 1.6 ch/f is too fast** — the 0.5 experiment is
   one line, documented in the constant, and deliberately left for you.
5. **The item-get pose.** Open any chest. Link should now hold the item until
   the fanfare actually finishes rather than 26 frames early.

---

## START HERE (session of 2026-08-29 — reconcile, roadmap, prompt series)

**Three documents drive the work from here. Read them in this order:**

| File | What it is |
|---|---|
| **`docs/SESSION-PROMPTS.md`** | **Eleven paste-ready session prompts, S1–S11.** Pick one, paste it, run it. Start with S1. |
| **`docs/SESSION-HANDOFF.md`** | **The reference every prompt cites by id** — verified state (`§1`,`§2`/`A…`), 57 numbered traps (`§3`/`T…`), the verification protocol (`§4`/`V…`), house rules (`§5`/`R…`), close-out checklist. |
| **`docs/ROADMAP.md`** | The sequencing reasoning, the audit, and what is argued against doing at all. |

**Each session must leave `SESSION-HANDOFF.md` true**: update `§1`/`§2` if a fact
changed, append new traps to `§3` with the next free number. Eleven prompts point
at it, so a stale handoff is worse than none.

**This session wrote no game code.** It reconciled 72 branches and produced
`docs/ROADMAP.md`: eleven sequenced sessions, each with a goal, the one thing
that would make it a failure, a model choice, dependencies, a paste-ready
prompt, and an explicit statement of what no checker can settle.

**The roadmap is void if its sessions are run in parallel.** One at a time,
merged to `main` before the next starts. The reconcile found sixteen
`next-session-iteration-*` branches from a three-day window; five independently
fixed the same `Boss.phase`/`Entity.phase` collision and eight independently
swept and reverted the same dodge variants. That pile is what parallelism costs.

**What landed on `main` this session:**

1. `docs/HANDOFF.md` gains **"Negative results — the boss-verb corpus"**. Read it
   before touching a boss. It holds the god-mode ceiling measurement (an
   *unlimited-health* Gohmaraq run still sticks at 14 hp forever, because its
   melee-vulnerable range is a strict subset of its 130px charge-trigger range),
   the eight ruled-out dodge strategies, the charge-lock diagnosis, the 67%
   stall trace, the first real-combat measurement of all six bosses, the
   heart-piece arithmetic behind the Wyverna estimate, and the direct diagnoses
   of Nereth's trident volley and Anemos's lash range.
2. **Two live bugs are written down with their fixes, unlanded**: `e.charging`
   sticks true forever once a phase stops calling `charge()` (assigned to S5),
   and two races in `walk-dungeons.mjs`'s ledge probes (recorded verbatim).
3. `docs/GUIDE.md` + `docs/GUIDE.html` recovered from an unmerged branch.
   **`check-guide.mjs` was failing 3/4 on `main`** — the guide had drifted six
   heart pieces behind the world and never mentioned the Kilnshell. Now 4/4.

**The audit's headline findings, all verified against the data, not the docs:**

- **There is no hitstop anywhere in `src/`.** The concept does not exist. This
  is S1 and it is the session to run if you run only one.
- **The base terrain is hand-drawn, not extracted** — `tiles-core.js` is 1,683
  lines of authored ASCII art, only 13 terrain tiles are ripped, and there is
  **exactly one grass tile**. That is the visible grid. Violates CLAUDE.md's own
  extraction rule. S2/S3.
- **The overworld map screen is a grid of coloured rectangles** (`menu.js:270`),
  sharing its loop with the dungeon map. The dungeon map is genuinely good and
  must not regress. S8.
- **Four sfx call sites are silent no-ops**: `swim`, `hookshot` (x2), `rumble`,
  and `secret` (which is a wrong-function bug — the jingle exists). Three
  defined sfx are dead. There are **55** sfx, not 77. S4.
- **`Dialogue.speed = 1.6` is hardcoded** at `dialogue.js:33` — a violation of
  the rule that every timing constant lives in `feel.js`. S1 moves it.
- **`check-camera.mjs` and `check-wide-rooms.mjs` were written and never
  merged.** Multi-screen rooms shipped without their checkers. S11 rewrites
  them; `claude/p7-6-camera` is kept alive until then as the only branch holding
  unrecovered code.

**Two things are closer to done than the brief assumed, and the roadmap argues
against spending full sessions on them:** NPC dialogue coverage is 51 of 57 ids
wired across 43 talkables with the reactive machinery already built and used by
every quest-giver (the real gap is ~21 townspeople with one static line — half a
session, S9); and the music already has bridges, so the genuine gap is intros
plus the missing channel techniques, not structure (S6/S7).

**Branch deletion could not be executed here** — this environment's git proxy
refuses delete refspecs with 403. The command is in ROADMAP's appendix.

---

## Branch consolidation: a real-AABB contact fix cut Gohmaraq's win threshold from ~50 hearts to ~9 (this session, continued)

**Many parallel sessions converged on the same discovery.** After the phase-
collision fix below landed on `main`, a branch audit found roughly forty
unmerged branches, several of which — independently, working from the same
fork point — had found and fixed the exact same `Boss.phase`/`Entity.phase`
collision, in some cases with nearly identical reasoning and even similar
prose. Raw-merging all of them was not viable: they all touch the same lines
of `updatePhaseShift`/`dBoss` with slightly different, overlapping
implementations of the same ideas, which is conflict hell, not consolidation.
Instead, each candidate branch was diffed against the shared fork point
(`cf56059`) to isolate what it added BEYOND the now-merged core fix, and only
genuinely new, verified value was pulled forward.

**One clean win pulled in this pass:** `claude/next-session-iteration-xxmx25`
found that `dBoss`'s old "keep closing until Manhattan distance <= NEAR+6"
approach check was not the same question as "am I about to touch the boss."
Gohmaraq's hitbox (26x20 inside a 32x32 sprite) is close enough to the whole
sprite that a DIAGONAL approach (full speed both axes, correctly per
CLAUDE.md) could walk the player's own AABB into contact — both axes already
inside the boss's real hitbox — while the Manhattan SUM of the two axis
distances was still comfortably above the old threshold. Two of the four
hits in the documented real-combat baseline were exactly this: a `boss-
contact` hit (4qh) landed mid-approach, not from a shot the player had no way
to see coming. Fixed with `gapTo`/`nearContact`, which ask the entities' own
`rect()` — the same AABB `Entity.overlaps`/`updateContactDamage` already use
— instead of re-deriving a box from `cx`/`cy` and a guessed offset. The same
branch also noticed Gohmaraq's charge ends in a 24-frame recovery stun
(`ENEMY_CHARGE_RECOVER_FRAMES`) with the eye already open and the boss unable
to move or attack — a guaranteed-safe window the old verb spent retreating
from a boss that could not follow, then had to re-close the gap from
scratch. Both fixes applied cleanly to `tools/actor-runtime.mjs` on top of
the merged phase fix (verified: the file was byte-identical to the shared
fork point before applying, so this was a pure additive patch, not a manual
reconciliation).

**Measured, real combat, seed 20260806, this session's instrumented
`Boss.hurt`/`Player.takeDamage` hooks — before (phase fix alone) vs after
(+ this fix), win threshold in hearts:**

| hearts (qh) | boss dmg dealt, phase fix alone | boss dmg dealt, + contact fix |
|---|---|---|
| 3 (12) | 10/24 | 12/24 (6 hits landed, all remaining damage taken was ranged — the melee free-hit problem is gone) |
| 8 (32) | — | 20/24 (dies with the boss nearly dead) |
| 10 (40) | — | **24/24 — KILLED, 8 qh (2 hearts) to spare** |
| 12 (48) | 16/24 | **24/24 — KILLED, 16 qh (4 hearts) to spare** |
| 50 (200) | **24/24 — KILLED** (this was the previous session's win threshold) | KILLED, comfortably |

**The win threshold dropped from ~50 hearts to somewhere between 8 and 10** —
a real, verified, order-of-magnitude improvement, and the fight is no longer
losing free melee hits to its own approach geometry. It is still short of
the 3-heart target a real player brings to D1. `check-bosses.mjs` (god mode)
unaffected: still 18/18, same five kills.

**What was deliberately NOT pulled forward, and why:** the other ~35
branches. Most contain either (a) the same core phase fix, now redundant, or
(b) further reactive-dodge experiments on Gohmaraq's remaining chip damage
that were measured and reverted in their own branch (matching this repo's
own prior two reverted attempts) — pulling those forward would mean
re-litigating already-settled negative results. A few branches (`x60p79`,
`i9v66l`, `t0pdp7`, `hw3pr3`, `sx8679`, `w0iomi`, and others) contain
extensive `docs/NEXT-SESSION.md` write-ups of further dead ends on the
charge-lock/recovery-window problem specifically — worth reading before
attempting another reactive-movement fix on Gohmaraq, since several converge
on "the charge-chain in phase 1 is the wall now, not chip damage," which
lines up with this session's own remaining gap (8 vs 10 hearts). These
branches are now safe to delete: their unique value (the phase fix, the
contact fix) is on `main`; what's left in them is either redundant or
already-negative results.

**Two more pulled in from the same audit, and one more tried and reverted:**

- **`tools/measure-boss-combat.mjs` is now committed**, from
  `x60p79`: the real-combat (no god mode, 3 hearts, seed 20260806) boss
  harness that this session and at least two before it had each rebuilt by
  hand in a scratchpad and never checked in — `node
  tools/measure-boss-combat.mjs [dungeonId] [--god] [--budget=N]`.
- **`x60p79`'s wall-aware `fence()` (a retreat command dropping a component
  that would step into a solid tile) was tried on top of the contact fix
  above and MEASURED AS A REGRESSION when stacked** — boss damage dropped
  from a reliable 12/24 (three consecutive runs) to 14/24 remaining, not
  noise. The source branch measured it as a wash against a different, less
  refined contact fix in isolation; combined with this session's more
  complete version it is a net negative. Not shipped. If revisited, measure
  it against the CURRENT committed `dBoss`, not in isolation.
- **This session's own attempt: running WITH the charge's own direction
  during the dodge (not just perpendicular to it), to close the gap before
  the recovery-stun window per `x60p79`'s "chase along the dash" lead
  below — tried, and measured WORSE**: contact hits came back (0 -> 2),
  boss damage dropped to 10/24, and the player died in 900 frames instead
  of 1300+. Reverted. The naive "add an along-axis component to the
  existing perpendicular dodge" shape does not work; whatever `x60p79`
  actually implemented (their own diff for this specific idea was not
  isolated and re-tried here — only their general description was) may
  differ in a load-bearing detail. Read their branch's own commits
  (`ac2ab5c`, `0b498bb`) directly before trying this shape a third time,
  rather than reimplementing from the prose description.

**Also pulled in, unrelated to the boss verb:** a real visual bug from
`link-sprite-progression-issues-rq48b6` — a lifted rock/pot rendered ~26px
above Link's head instead of 13, because `Game.liftTile` set the object's
own `z` on top of the y-offset `Player.updateMovement` already applies via
`CARRY_HEIGHT`. Fixed by zeroing the object's `z` at lift time (throw time
already resets it via `Player.throwCarried`). That branch also logged, root-
caused but NOT fixed, three more issues worth a look next session (not
independently re-verified this session, so treat as a lead, not a confirmed
bug): the sword swing and spin attack may draw no visible blade
(`link_sword_*`/`link_spin_*` never got the oversized `expectedSize` crop
`link_hold_*` has in `src/data/sprite-manifest.js` — worth a screenshot
check), a report of enemies with no working hitbox (no repro yet), and the
overworld running on a single music track regardless of region.

**Next session, in order:**

1. **Read the charge-lock/recovery-window analyses in the branches named
   above before attempting a new fix** — several sessions in parallel spent
   real effort narrowing this down and their negative results are worth
   inheriting rather than re-discovering. In particular, read `x60p79`'s
   own diff for "chase along the dash" (commits `ac2ab5c`/`0b498bb`) rather
   than this session's reimplementation-from-prose, which measured worse.
2. Bisect the exact win threshold between 8 and 10 hearts precisely (this
   session stopped at a coarse bisection), and decide whether closing the
   last 5-7 hearts of gap is an AI problem or a design one (3 hearts may
   still be short even with a further-improved verb).
3. Screenshot-check the sword-blade claim above; it would be a real fidelity
   bug (Goal 1) if true and nobody has looked since it was logged.
4. Delete the now-superseded branches (`git push origin --delete <branch>`)
   once a maintainer confirms — this session did not delete anything,
   only merged forward what had unique value.
5. Once Gohmaraq wins at 3 hearts, wire `dBoss` into `playthrough-route.mjs`
   and look at whether the other five bosses are winnable in REAL combat
   (not just god mode) at their own dungeons' starting health.

---

## THE REAL BLOCKER WAS AN ENGINE BUG, NOT THE BOSS VERB — every boss's damage plateau explained and fixed (previous session)

**This changes the framing of every "boss verb" session before it.** The
previous board's whole narrative — "the melee trade is close to breakeven,
chip damage is what kills a 3-heart player, two reactive-dodge mechanisms
were tried and reverted as noise-sensitive" — was analysis of a SYMPTOM. The
actual reason Gohmaraq's godmode damage plateaued at exactly 10/24 hp in
EVERY prior measurement in this repo's history, and the reason Anemos,
Gloomtide, Wyverna, Rootmaw and Nereth all plateaued too (`check-bosses.mjs`
never asserted the kill itself, so nobody had looked), was a single engine
bug: **`Boss.phase` (that class's own combat-phase index, 0/1/2 as a fight
escalates) collides with `Entity.phase`**, an unrelated field the Brineglass
Lens's phased-enemy mechanic uses (`{phase: 0}` on a `keese`/`leever` spawn,
meaning "this enemy only exists at tide level 0"). `Game.updatePhaseShift`
(`src/game/game.js`) only checked `e.phase == null` to decide an entity was
Lens-phased — and phase indices happen to alias the tide enum (LOW=0/MID=1/
HIGH=2) closely enough that nothing ever threw. The instant any boss's fight
advanced to a phase index that didn't equal the room's own tide level — which
is EVERY fight, past its first phase, unless that phase's index happens to
match its own design tide by coincidence — this loop treated the boss as
phased out: hidden, harmless, and, critically, **`invuln` re-armed to at
least 2 every single frame, one frame before `Boss.update`'s own decrement
could ever reach 0.** That pins `Boss.hurt`'s `if (this.invuln > 0) return
false` open forever. Every boss in the game became permanently unkillable the
moment its second combat phase began, silently, in god mode and real combat
alike, for the whole life of this project.

**Found by refusing to accept "AI limitation" as an answer twice.** This
session started by re-measuring Gohmaraq's chip-damage problem with fresh
instrumentation (direct `Boss.hurt`/`Player.takeDamage` hooks, not inferred
from outside behaviour — worth keeping as the pattern for next time, no
committed script does this yet). Then, instead of trying another AI tweak,
it asked a different question: does the CURRENT, UNMODIFIED `dBoss` verb win
if given more health margin? At 12 qh (3 hearts) the trade plateaued at
10/24 exactly as documented. At 48 qh it should have gone further — and
instead it hit the SAME wall at 14/24 and then sat there, `Boss.hurt`
returning false on every subsequent landed swing, for the rest of a
60,000-frame budget, while chip damage from ranged shots (unaffected by the
bug) kept draining the player until it eventually died anyway despite having
24 hearts of margin. That "stuck exactly at 14, forever, regardless of how
much health the player has" shape is not what an AI-timing problem looks
like. Tracing `boss.invuln` frame by frame found it pinned at 1 forever,
which is what led to `updatePhaseShift`.

**The fix (`src/game/game.js`, `src/game/enemy.js`):** `updatePhaseShift`'s
loop now also skips any entity carrying `_bossClass`, a permanent marker set
once in the `Boss` constructor — not `isBoss`, which minibosses deliberately
clear (see `gridLocked`'s comment for the same class-vs-flag distinction),
and not an `instanceof Boss` check, which would need importing the class into
`game.js` and turned out to have its own cost (see the walk-dungeons.mjs
section below — not a correctness bug, but reason enough to prefer the
marker).

**Measured, before -> after, real combat, 12 qh, seed 20260806 (unmodified
`dBoss`, no AI changes):** identical — the fix only bites once a fight
reaches its second phase, and Gohmaraq's own chip-damage problem still kills
a 3-heart player before that ever matters. The fix's effect only shows with
health margin to spare:

| hearts (qh) | boss dmg dealt, BEFORE | boss dmg dealt, AFTER |
|---|---|---|
| 3 (12) | 10/24 | 10/24 (dies too soon to matter) |
| 12 (48) | 10/24 (stuck forever) | 16/24 |
| 25 (100) | 10/24 (stuck forever) | 22/24 |
| 50 (200) | 10/24 (stuck forever) | **24/24 — KILLED, `beaten: true`** |

**The same unmodified `dBoss` verb wins the fight outright, given room.** No
AI change. The engine was the wall the whole time.

**`check-bosses.mjs` (god mode) confirms it at scale — five of six bosses now
die completely within budget, not just Gohmaraq's partial improvement:**
Anemos 30/30, Gloomtide 36/36, Wyverna 44/44, Rootmaw 52/52, Nereth 80/80 —
all **KILLED**. Only Gohmaraq doesn't finish in god mode's 9000-frame budget
(still 10/24, an unrelated, already-tracked AI-verb limitation — see below).
Before this fix, EVERY one of those five plateaued at a fixed low number
exactly like Gohmaraq still does, and the checker's own comment blamed
per-boss tactics for it — specifically, a claim that **Gloomtide's weak point
opened and still took no damage because a swimming Link cannot swing.
That claim was wrong.** Gloomtide dies in ~300 frames flat once the bug is
gone. The checker's comment now says so; do not resurrect the swimming
theory without re-measuring it first.

**A second, narrower bug the fix's own verification surfaced in the
checker itself, fixed alongside it:** `check-bosses.mjs` proved "the weak
point opens" by polling `boss.weakOpen` once per 400-frame pump. That was
safe only because no fight had ever finished fast enough to slip between two
polls — Gloomtide now dies in ~300 frames, well inside one poll interval, so
the boss was dead and cleared from the room before the first sample ever
ran, and the checker reported "never opened, 0 samples" for a shell that
plainly opened. Fixed by instrumenting the actual state change (a
`Boss.prototype.weakOpen` accessor that latches a global flag on any `true`
write) instead of inferring it from a poll — see the checker's own comment
for why sampling is fundamentally the wrong tool once a fight can finish
between two samples. Also added: two real assertions the file's own header
had claimed since its first version but never checked — that killing a boss
marks the dungeon beaten and grants its essence — now proven for every fight
that actually reaches 0 this run (5 of 6), rather than hard-coded.

**`d1-clawcrab-den-wide` (the one replay this session had to re-record, and
why that's correct, not a regression):** the Clawcrab Den miniboss shares
`Boss`, so it was ALSO permanently phased-out (hidden AND harmless) for the
old recorded baseline's entire fight — invisible and unable to shove the
player, contradicting the room comment's own stated intent ("The route uses
`goto` rather than a held direction because the Clawcrab is in the way and
shoves"). Traced and confirmed directly: old engine, this room, `crabHarmless:
true` from frame 90 onward, permanently; new engine, `false` throughout, as
designed. The old baseline was recording a bug as if it were correct
behaviour. Re-recorded; all 51 replays pass. If anyone else needs to
re-verify: `git stash` the two `src/game/*.js` files, re-run
`tools/replay.mjs`, diff against the fixed engine's run — the position/hp
divergence at frame 720 is the crab's contact shove firing for the first
time in the game's history.

**Two pre-existing, unrelated bugs in `tools/walk-dungeons.mjs`'s own
ledge-hop harness, found only because this session's fix perturbed the
timing enough to expose them — both fixed, both real, neither caused by the
engine fix itself:**

1. **No seed was ever pinned for this file's "New Game" boot.** Unlike every
   other tool in this repo (`SEED = 20260806` is the standing convention),
   `walk-dungeons.mjs` pressed through the title screen with no `?seed=`
   query param, so `newProgress()` fell back to `Date.now()` — a different
   random world, and different enemy placements relative to every probe's
   fixed spawn point, on every single run. Fixed: pinned `SEED = 20260806`
   in the `page.goto` URL, matching the convention. This alone makes the
   file's ledge tests reproducible for the first time; previously a failure
   here would have read as one-off flakiness because it usually was.
2. **The ledge-probe harness left a landed enemy's knockback on the player
   when repositioning it for the next probe.** `place()` (in the ledge-hop
   test) resets `z`/`vz`/`jumping`/`ledgeHop` when it teleports the player to
   a fixed spawn point, but not `knockTime`/`knockX`/`knockY` — and the
   entity filter that strips every enemy but the player out of the room runs
   AFTER an initial 3-frame settle, during which a room's own enemy (a keese,
   in the one case this cost a session) can still land a contact hit on a
   player parked at a fixed point. The resulting knockback silently
   overrode the probe's own scripted key press for however many frames of it
   were still in flight. Fixed: explicit `knockTime = 0; knockX = 0; knockY
   = 0;` alongside the existing resets.
3. **`place()`'s own `g.tide.setLevel(1)` call was missing `{instant:
   true}`** — every other tide-setting call in every harness in this repo
   passes it, because a scripted probe never wants the real sweep-transition
   animation a conch press triggers. Without it, `tide.busy` stayed true for
   the probe's entire duration whenever the tide wasn't already at MID when
   the probe began, and — the actual, deep symptom this produced — the
   overworld's `0,0,0` ledge tile's OWN resolved `ledge` facing read
   differently between two `Room.tile(5,5,g.tide)` calls made moments apart
   during that stuck-busy window: `'down'` (correct) from one call site,
   `'up'` from another, inside the same handful of frames. That is very
   likely the render/tile-resolution-during-a-live-sweep hazard CLAUDE.md's
   own hard-won-lessons section already warns about for a DIFFERENT reason
   ("a room's render cache is keyed on the field's stamp") — this session
   did not chase it further than confirming `{instant: true}` makes it
   disappear, and whether `Room.tile()`'s tide-branch resolution can
   genuinely return two different answers for the same tile while
   `tide.busy` is true is worth a dedicated look if it recurs anywhere else.

None of these three bugs are new; all three were latent in this file before
this session touched anything. What changed is that fixing the phase/tide
collision altered enough incidental timing elsewhere in the same long-running
browser session (more boss AI now actually running its update methods
instead of being frozen) to tip an already-marginal, already-broken test from
"passes by luck" to "fails reliably" — and reliably failing is what let it
get root-caused instead of shrugged off. `walk-dungeons.mjs` is 23/23 again,
now for real reasons rather than accidental ones.

**Full verification this session, all green:** `test.mjs` 59/59,
`check-bosses.mjs` 18/18 (13 structural + 5 new kill-grants-essence
assertions), `replay.mjs` 51/51 (one re-recorded, for the reason above),
`check-motion.mjs` 8/8 (plus its own missing `CHROMIUM_PATH` fallback added
— same pattern as `test.mjs`'s, a "good first job" gap from an older board,
closed in passing), `check-gates.mjs` 26/26, `solve-switches.mjs` 9/9,
`walk-dungeons.mjs` 23/23, `check-playthrough.mjs` 19/19 (byte-identical —
nothing about the recorded route touches a boss's second phase), `npm run
build` + `check-build.mjs` clean.

**What is still open, unchanged by this fix, and now the honest state of the
board:**

1. **Gohmaraq (D1) still doesn't win at 3 hearts, and the reason is now
   isolated for real: chip damage, not an engine bug and not (as far as this
   session found) a fixable-by-tuning AI problem** — see the archived board
   below for the two reactive-dodge attempts already tried and reverted.
   Whether 3 hearts is simply short for this fight, given the melee trade is
   now KNOWN to be capable of a full kill with room to spare, is a sharper
   question than it was — worth revisiting with fresh eyes rather than a
   third reactive-movement attempt.
2. **`dBoss` still is not referenced by `tools/playthrough-route.mjs`.** Five
   of six bosses can now be killed by the unmodified verb in god mode; that
   is progress toward "provably winnable," but the route still needs a real
   3-heart Gohmaraq win before wiring anything in, per the standing rule.
3. **Whether the OTHER five bosses are winnable in REAL combat (not god
   mode) is still unmeasured.** God mode proves the fix unblocks them
   structurally; it says nothing about whether their own chip-damage
   economics are fair at a real starting heart count. That is the next
   natural measurement, and it is now possible for the first time.
4. **The `_bossClass` marker is new public-ish surface on `Boss` instances.**
   If a future session adds a second class that also needs `updatePhaseShift`
   to leave it alone (a new boss-like set piece that is not literally a
   `Boss` subclass), it needs the same marker, not a copy of the exclusion
   logic.
5. The Boss Key / third-key pass and the other five dungeons' routes remain
   undone, per every prior board.

---

## Opening-edge grace tried and reverted — same instability, new mechanism (previous session)

**Still not a win, and nothing shipped.** This session tested the first item
on the previous board — "reduce chip damage without the disruption cost" —
from a different angle than the reverted per-shot dodge, and found the same
instability under a different name.

**The idea.** `open()` and a windUp attack's own shot spread fire out of the
same pending callback (`gohmaraqSlam`, `src/data/bosses.js`): the eye reads
open on the exact frame the rock spray leaves the claw. `dBoss`'s "no invuln
banked: close the distance" branch reads `weakOpen` and immediately beelines
toward the boss — which, on the frame the eye just opened, can walk the
player straight back through a shot that is still in flight and aimed at
wherever they were standing a frame earlier. The fix tried: hold clear
(retreat) for `OPEN_GRACE` frames on the RISING EDGE of `weakOpen` only (not
the whole open window — that would just give up hits), tracked generically
off `weakOpen`'s own transition rather than any one boss's attack, matching
the file's stated rule against per-boss scripting.

**Measured, swept over `OPEN_GRACE` on the one seed this repo can currently
measure (20260806, 12 quarter-hearts, no god mode):**

| `OPEN_GRACE` | boss dmg dealt | frame of death |
|---|---|---|
| 0 (baseline, unchanged) | 10/24 | 796 |
| 10 | **4/24** | 636 |
| 20 | 10/24 | 1475 |
| 30 | 10/24 | 727 |
| 40 | **8/24** | 624 |

Only `20` ties the baseline's offensive output; `10`, `30` and `40` all deal
*less* damage AND die faster than doing nothing. This is the same shape the
previous session's `PROJ_SAFE` sweep (12/16/24) already found and reverted
for (1-4 hits landed against a plain-retreat baseline of 5) — a small,
deterministic combat sim where adding any reactive movement reshuffles the
whole fight's timing, so one parameter value scoring best among five samples
on a single seed is the sweep finding its own noise, not a real fix.
**Picking 20 because it happened to win here would be exactly the mistake
CLAUDE.md's own damage-ladder section warns against** ("shipping a 'safety'
feature that measurably lands fewer hits is worse than not having it" — true
here even though 20 *ties* rather than loses, because 10/30/40 show the
mechanism itself is not reliably safe). Reverted; `tools/actor-runtime.mjs`
is byte-identical to before this session (verified with `git diff`), and
`check-bosses.mjs` is still 13/13 with unchanged numbers.

**What this rules out, so it doesn't get retried blind:** any *generic*
reactive hold/dodge keyed off a boss-state transition (`charging` worked
because it's a clean latched boolean with nothing else touching it in the
same frame; `weakOpen`'s rising edge is not clean the same way — it shares a
frame with a shot spawn whose own trajectory is fixed at fire time, so
"holding clear" changes WHEN the player re-enters range more than WHETHER
they get hit, and the fight's determinism means that shift cascades). The
next lever, if anyone returns to chip damage specifically, is probably not a
movement change at all — see item 1 below for what's left unexplored.

**Also confirmed while instrumenting:** direct `Boss.hurt`/`Player.
takeDamage` hooks (rather than reading `g.progress.hearts`/`g.boss.hp` from
outside) reproduce the documented baseline exactly — 5 sword hits, 24→14 hp,
death to a ranged graze — which is worth keeping as the instrumentation
pattern for whoever measures this fight next; it was rebuilt from scratch
this session because no committed script does it (the previous session's
numbers were produced by a scratch file, same as this session's).

**Next session, in order — mostly unchanged, item 1 narrowed:**

1. The melee trade is close to breakeven (10 hp dealt for 12 qh taken); two
   generic reactive fixes (per-shot dodge, opening-edge grace) have now both
   failed the same way — noise-sensitive, not a reliable win. Worth trying
   instead: something that isn't a movement change at all, e.g. banking
   MORE invuln margin specifically after taking a hit (chain fewer swings,
   retreat further) rather than reacting to the boss's state pre-emptively;
   or accept the melee trade as-is and look at whether 3 hearts is simply
   short of what this fight needs (a design question CLAUDE.md's damage
   ladder section already flags as coupled to this).
2. The same-speed patrol problem (phase 3 speed 1.0 == WALK_SPEED) is STILL
   unmeasured in real combat — every real-combat run so far (this session
   included, boss dealt at most 10/24 = 42%) dies before reaching phase 3
   (below 30% hp), so there has never been a real-combat sample of it. It
   remains visible only in god mode's unlimited-aggression run.
3. Once Gohmaraq is a measured win at 3 hearts, wire `dBoss` into
   `playthrough-route.mjs` past `d1/0,3,2`, and only then look at the other
   five bosses — Gloomtide's swimming-blocks-swinging finding in particular
   needs a real tactic (sink with the Cleats first), not this generic verb.
4. The Boss Key / third-key pass behind the Clawcrab door and the other five
   dungeons' routes are both still undone and both still blocked on job 1
   actually finishing.

---

## Charge dodge lands, ranged dodge doesn't — the boss verb, continued (previous session)

**Still not a win.** Gohmaraq measured in real combat (12 quarter-hearts, no
god mode, seed 20260806): five hits landed (24 -> 14 hp), same as last
session, surviving 25 frames longer before the same fatal graze. One small
positive change shipped; one larger one was tried, measured, and reverted —
both are worth reading before touching this verb again.

**Shipped: dodge a charge.** `charge()` (`src/game/enemy.js`) commits Gohmaraq
to a straight dash at 1.9 px/f down whichever axis it last saw the player
on — far outrunning everything else in this verb (1.0 px/f walking, ~1.4
diagonal). `dBoss` now reads `b.charging` at the top of every frame and steps
off that axis, latching the side for the dash's duration the same way the
invuln-chase latches its retreat (a side re-read every frame off a position
that's crossing the charge's own line is exactly the noise that broke the
attempt below). It is unconditional — highest priority, above the weakOpen/
shelled state machine — because a charge is the one attack in this fight
that can out-run a normal retreat. `check-bosses.mjs` is unaffected (13/13,
identical numbers: god mode never needs to dodge anything).

**Tried and reverted: dodge the ranged spray.** The obvious next lever — read
`game.entities` for live projectiles each frame and sidestep their line
before they arrive — was built, and building it surfaced two real
implementation bugs worth knowing about if anyone tries this again:

1. **A direction is not a distance.** The first cut reused `towardDiag`
   (built for the chase, with a 3px deadzone so it doesn't twitch over a
   couple of stray pixels) to turn a dodge vector into button bits. Every
   shot's velocity in this game is ~0.5-2 px/f — smaller than the deadzone —
   so `towardDiag` silently returned 0 every single time. The dodge branch
   ran, computed a real threat, and pressed nothing. Caught by instrumenting
   `Player.takeDamage`/`Boss.hurt` directly rather than trusting the outside
   behavior — the damage log was BYTE-IDENTICAL before and after the change,
   which is what gave it away.
2. **"Which side am I already on" is unstable exactly when it matters.**
   Gohmaraq's spray (`spread()`, `src/data/bosses.js`) is aimed AT the
   player's exact position the frame it fires, so at spawn the player sits
   almost exactly ON the shot's line — the cross-product sign that was
   supposed to pick a dodge side is reading sub-pixel noise right when the
   signal is most needed. Recomputed fresh every frame, it flipped sign on
   roughly half the frames of a single approaching shot, so the "dodge"
   cancelled itself frame over frame and the player gained no real
   separation. A latch (pick the side once per threat, hold it) fixed the
   oscillation but exposed a THIRD problem: the arena has walls, and the
   latched side can dead-end into one mid-dodge, pinning the player against
   the fence with only one axis of the dodge still live — not enough
   separation to clear a shot whose line isn't aligned with that wall. A
   fence-openness tiebreak on the initial pick did not fix this, because the
   pick is only checked ONCE, not continuously as the player is walked
   toward the wall over the following ~15 frames.

None of that is disqualifying on its own, but the net measured result across
several parameter attempts (`PROJ_SAFE` 12, 16, 24) was 1-4 melee hits landed
against a plain-retreat baseline of 5 — the dodge was disrupting the chase
more than it was preventing damage, on the one seed this repo can currently
measure. **Shipping a "safety" feature that measurably lands fewer hits is
worse than not having it**, so it was reverted rather than kept as an
unproven complication. If someone picks this back up: the wall-cornering
problem is the one still open, and the fix likely needs to track separation
continuously (not just at the moment a threat is first detected), or pick a
dodge target relative to the room's open space rather than purely
perpendicular to the shot.

**Next session, in order — unchanged in substance from last time:**

1. The melee trade itself is close to breakeven (10 hp dealt for ~10 qh
   taken over the course of the fight); what's still open is REDUCING chip
   damage without the disruption cost the reverted attempt paid. Also worth
   trying: is there a cheaper win in NOT engaging every eye-open window —
   Gohmaraq's eye stays open almost the whole fight at LOW tide, so the verb
   doesn't have to press every opening if a fresh one is coming anyway.
2. The same-speed patrol problem (phase 3 speed 1.0 == WALK_SPEED, so a
   patrol that isn't reversing is never caught) is still unmeasured in real
   combat — only seen in godmode's unlimited-aggression run, which may not
   be the same failure a 3-heart fight ever reaches.
3. Once Gohmaraq is a measured win at 3 hearts, wire `dBoss` into
   `playthrough-route.mjs` past `d1/0,3,2`, and only then look at the other
   five bosses — Gloomtide's swimming-blocks-swinging finding in particular
   needs a real tactic (sink with the Cleats first), not this generic verb.
4. The Boss Key / third-key pass behind the Clawcrab door and the other five
   dungeons' routes are both still undone and both still blocked on job 1
   actually finishing.

---

## The boss verb now chains hits and actually lands them — Gohmaraq measured at 10/24, real combat, not god mode (previous session)

**Job 1 from the board below** was "a boss-fight verb that WINS... prove it on
Gohmaraq at THREE hearts." It does not win yet. What changed is measured, not
estimated, and the measurement is real: a fresh `d1` boss fight, sword L1,
**12 quarter-hearts of real health (3 hearts), no god mode**, went from
landing one sword hit (2 of 24 hp) before dying to landing **five hits — 10 of
24 hp — and surviving to the last half-heart** before a final graze killed it.
Reproducible: seed 20260806, deterministic, same result on repeat runs.

**What was wrong, found by instrumenting every `hurt()` call rather than
guessing from the outside.** `dBoss` (`tools/actor-runtime.mjs`) had two bugs,
both invisible from god-mode testing because god mode makes them harmless:

1. **The eye-open "if far, back off" check pinned the verb against a wall for
   an entire fight.** Gohmaraq's phase-1 tell is a stationary spray, not a
   pursuit — there is nothing to back away from — but the verb treated "the
   eye is open and the boss is far" as a reason to retreat regardless, and
   because the boss patrols the room while the player retreats toward a
   corner, the two conditions can hold simultaneously forever. Measured
   directly: an entire recorded fight with the player standing still at a
   room-edge clamp, taking periodic ranged chip damage, landing zero hits.
2. **A landed hit's invulnerability window (`PLAYER_INVULN_FRAMES`, 46f, minus
   the 12f knockback lock that opens it — 34f usable) was spent on one swing
   and a mandatory 30-frame retreat.** The touch that bought the window is the
   same cost either way, so ending it with 20+ frames unspent is a discount
   the boss doesn't offer twice. `dBoss` now chains swings for as long as
   invuln lasts, holding back `RETREAT_MARGIN` (20f) as a reserve to clear
   contact range before it lapses — measured empirically: spending the whole
   window (`RETREAT_MARGIN` near 0) walks the player back into contact the
   instant invuln expires, a free hit for the boss; too large a margin
   (tried 26) gives up hits without buying more safety. 20 is measured, not
   derived — a different boss's geometry may want a different number.
3. **Diagonal movement was left on the table mid-chase.** CLAUDE.md is
   explicit that diagonal is full speed on both axes, not normalised, but the
   chase-and-retreat code picked a single dominant axis per frame. Closing a
   knockback-opened gap on one axis at a time measured at roughly half the
   rate a diagonal close does — the difference, directly, between reaching
   swing range inside the invuln window and not. `towardDiag` fixes this for
   both the openers-first approach and the invuln-chase.

**This is a generic engine-level fix, not a Gohmaraq special case** — deliberately, matching the file's own stated philosophy ("this does NOT encode
any single boss's timings"). It changes nothing about god mode's own
numbers (`check-bosses.mjs` is still 13/13, and every boss's godmode damage
tally is byte-identical to before this session's edit — godmode's bottleneck
turns out to be a different thing entirely, see below) — it only changes what
happens when contact damage is real.

**What is STILL open, measured rather than assumed:**

- The final death was a ranged graze at 0.5 hearts remaining, not a melee
  error — at that health total, literally any unavoidable chip damage is
  lethal, and Gohmaraq's periodic spray is not currently dodged at all, only
  out-ranged by luck of position.
- Even with unlimited aggression (god mode pins `p.invuln` at 600 every
  frame, so the checker's godmode run is ALWAYS in the free-chase branch,
  never retreating), Gohmaraq only takes 10/24 hp in a 9000-frame (150s)
  budget — identical to the real-combat tally, which says the godmode
  ceiling isn't contact-avoidance at all, it's **catching a patrolling boss
  whose phase-3 speed (1.0 px/f) matches the player's own WALK_SPEED**: once
  aligned on one axis, a same-speed target that isn't turning back toward you
  is never caught, only waited out. That's a distinct problem from the one
  this session fixed and is worth its own measurement before assuming a fix.
- Only Gohmaraq (D1) was measured in real combat. `check-bosses.mjs`'s godmode
  numbers for D4 Wyverna (20/44) and D5 Rootmaw (20/52) are unchanged by this
  session's edit — same reasoning: the retreat-margin/diagonal fixes only
  bite when contact is costly, and godmode never lets contact cost anything.
  D2, D3, D6 still take 0 damage even in godmode — D3's is the already-diagnosed
  swimming-blocks-swinging finding (see `check-bosses.mjs`'s own comment); D2
  and D6 are unmeasured.
- **`dBoss` is still not referenced by `tools/playthrough-route.mjs`.** A
  route step that cannot reliably finish is worse than a missing one, and it
  still cannot reliably finish — five hits of twenty-four is progress, not a
  win. Do not wire it in until a fresh-game 3-heart Gohmaraq fight actually
  reaches 0 hp.

**Also fixed, unrelated but found on the way and blocking verification:**
`replay.mjs`, `walk-dungeons.mjs`, `solve-switches.mjs`, `check-gates.mjs` and
`check-playthrough.mjs` were missing the `CHROMIUM_PATH` fallback that
`test.mjs`/`check-bosses.mjs`/`check-build.mjs` already carry, and died on
launch in this sandbox before loading a line of game code — flagged as "a
good first job" two boards down and left undone until now. All five now carry
the same fallback (copied verbatim from `test.mjs`'s pattern) and all five run
green in this environment: `replay` 51/51, `walk-dungeons` 23/23,
`solve-switches` 9/9 rooms, `check-gates` 26/26, `check-playthrough` 19/19 —
all unchanged from their last recorded numbers, confirming this session's
`dBoss` edit touches nothing any of them exercise.

**Next session, in order:**

1. **Dodge the periodic ranged attacks.** The melee trade is now close to
   breakeven (10 hp dealt for 10 qh taken, in a fight that needs 12 hits for
   24 hp); the thing that actually kills a 3-heart player is chip damage
   nobody is trying to avoid. A shot has a position and a velocity readable
   the same frame it spawns — a dodge verb that reads `game.entities` for
   live projectiles and sidesteps their line, rather than reacting only to
   the boss's own position, is the next lever.
2. **Solve the same-speed patrol problem** (phase 3 speed 1.0 == WALK_SPEED)
   separately from the contact problem this session fixed — waiting for a
   patrol reversal rather than a straight chase may be the honest answer, and
   it wants its own measurement before it's assumed.
3. Once Gohmaraq is a measured win at 3 hearts, wire `dBoss` into
   `playthrough-route.mjs` past `d1/0,3,2`, and only then look at the other
   five bosses — Gloomtide's swimming-blocks-swinging finding in particular
   needs a real tactic (sink with the Cleats first), not this generic fix.
4. The Boss Key / third-key pass behind the Clawcrab door (job 2 on the older
   board below) and the other five dungeons' routes are both still undone and
   both still blocked on job 1 actually finishing.

---

## iPad publishing (previous session)

Shipped: `.github/workflows/deploy-pages.yml` (builds, runs
`check-build.mjs` as a hard gate, publishes `dist/oracle-of-tides.html` as
`index.html` on GitHub Pages on every push to `main` — Pages must be enabled
once in repo Settings → Pages → Source: GitHub Actions); home-screen app
meta/manifest/apple-touch-icon (`tools/gen-app-icon.mjs`, procedural, no
external asset, folded into `index.html` as data: URIs between
`<!-- APP-ICON:BEGIN/END -->` markers — re-run the script, don't hand-edit
between them); integer-device-pixel canvas scaling in `src/core/screen.js`
(see HANDOFF.md's hard-won-lessons for why CSS-pixel integers weren't
enough); iOS gesture kills (rubber-band, pinch, double-tap-zoom, long-press
callout) in `index.html`; `storageAvailable()` + `exportCode`/`importCode` in
`src/game/progress.js` with a UI on the title file-select screen (SELECT on a
slot); AudioContext suspend/resume on `visibilitychange` in `src/main.js`.

**Not verifiable without a real iPad** — check these by hand:
- Whether iOS Safari actually offers/behaves as a home-screen app (standalone
  mode, status bar style, the apple-touch-icon rendering) — Playwright/Chromium
  has no iOS Safari engine to test this against.
- Whether the gesture-kill JS (pinch, double-tap, pull-to-refresh,
  rubber-band, long-press callout) actually stops each gesture on real iOS
  Safari; the CSS/JS is the standard pattern for this but Chromium doesn't
  reproduce Safari's overscroll/zoom behavior to test against.
- Whether `window.prompt()`/`window.alert()` (used for the save export/import
  codes) behave acceptably on iOS Safari inside a fullscreen home-screen app —
  some standalone-mode contexts restrict or style these differently.
- Real-device audio resume after backgrounding — the visibilitychange handler
  is straightforward WebAudio API usage, but only a real device backgrounding
  cycle proves the context actually comes back audible.
- Actual GitHub Pages URL behavior once Pages is enabled for the repo (the
  workflow itself was proven by running its two gating steps,
  `npm run build` and `node tools/check-build.mjs`, locally — not by an actual
  Pages deploy, since that requires the repo's Pages setting and a push to
  `main`).

---

# Prompt for the next session

Paste the fenced block below into a fresh Claude Code session on this repo. It
is written to be self-contained: it names the branch, the remaining jobs, the
traps that are already paid for, and how to prove the work rather than assert
it.

Keep this file updated as work lands — it is the cheapest thing in the repo to
maintain and the most expensive thing to not have.

---

## THE KILNSHELL — the game's fire, and why it is not a bomb

Torches could not be lit at all: `Torch.ignite` is reachable only from
`checkTileAction(rect, 'fire')` and nothing in `src/` ever passed `'fire'`. That
deadlocked the Coral Spire and, through it, D3, D4 and the road to the Keep.

The first fix made bomb blasts emit fire. **It was reverted** — the Oracle games
never light a torch with a bomb, and it put the Spire's own Bombs on the far
side of the door their key opens.

**The 16th item: the Kilnshell** (`docs/ITEMS.md` §1a). A cockle burnt to lime.
Press to set one down ALREADY ALIGHT; it burns torches, drift-tangle and
anything standing over it. A first cut made the sea light it and the sea put it
out — three tide states, no button that makes fire — and it was simplified on
purpose: fire was the one verb the game could not perform at all, and the fix
for a missing verb is an item that performs it, not a puzzle standing between
the player and their own item. The tide keeps one word: DEEP WATER PUTS IT OUT.

  * **Home:** a chest in the Reef Hollow (`cave2`), two screens east of the
    village, on foot, with nothing. It has to be outside a dungeon and early,
    because the Torch Cell is the sixth room of the second dungeon.
  * **Movement verb:** `driftTangle`, a new tile that burns and ONLY burns — no
    cut, no bomb, no lift. The Reef Hollow walls a rupee niche with it, which is
    where the verb is taught.
  * **Tide states matter:** `tidePool` is dry/shallow/deep across LOW/MID/HIGH,
    but a dungeon `dBasin` is dry at LOW *and* MID and shallow only at HIGH. The
    Torch Cell is a dBasin room, so it is solved by taking the sea all the way
    up. Check `resolveTile` at all three levels before designing a fire puzzle.

**Bombs now come only from the bomb bag.** The shop sold twenty-rupee bombs to a
player with no bag and delivered zero, because counted pickups clamp to a
capacity that starts at zero; the bottle refill did the same. The shop refuses
the sale and says why.

**D2's floor-0 Small Key stays in the switch room** even though the Torch Cell's
key is now obtainable. It is defence in depth: `check-torches.mjs` asserts a
torch-gated key is never the only key on its floor, so if a later session moves
the Kilnshell the deadlock cannot come back silently.

Proved end to end in-engine: shell set down dry, sea to HIGH, it catches, all
three torches lit, `d2_torches` set, the key spawns. `check-items.mjs` is 92/92
with ten new Kilnshell assertions; `check-torches.mjs` is 5/5 and now also
asserts the emitter is NOT the bomb.

---

## WHERE 1.0 ACTUALLY IS — measured, not estimated

The playthrough harness now drives **18 of 144 dungeon rooms**, all in D1, and
ends in `d1/0,5,2` having crossed the Iron Pipe with the Anchor's own verb. Two
actor verbs landed to get there (`equip`, `anchor`); the missing capability is
no longer placement.

**The game is not shippable as 1.0 yet, and the gap is the PROOF, not the
game.** Every model says the world is completable — `check-progression` reaches
120/120 screens and 6/6 dungeons, `walk-dungeons` strands nothing,
`solve-switches` solves all nine switch rooms by real pushing. But CLAUDE.md's
own rule is that a model does not fight a boss or spend a key, and the run has
never done either. What 1.0 needs, in dependency order:

1. **A boss-fight verb THAT WINS.** `dBoss` now exists in
   `tools/actor-runtime.mjs` and is the next session's first job. It finds the
   boss, holds the arena, waits out the shell and lands real hits (Gohmaraq
   24 hp -> 18) — and it loses, at about one damage per five quarter-hearts,
   measured at 3 and 6 hearts. It is deliberately NOT wired into the route.
   What it is missing is positioning, not timing: `weakOpen` tells every boss
   when to strike, but the slam radius and the safe side are per-boss. Prove it
   on Gohmaraq at THREE hearts — that is what a real player brings to D1.
   See docs/HANDOFF.md for the false-victory trap it already closed.
2. **A Boss Key / locked-door pass** for the third key behind the Clawcrab door,
   then D1's west wing and `3,1`. That closes ONE dungeon end to end and is the
   right place to prove the pattern before scaling it.
3. **The other five dungeons**, at roughly 24 rooms each. Route authoring is the
   cost, not engine work — and the Iron Pipe is the warning about what that
   costs: its correct solution was a different tile from the one the checker
   named, and only a real run found out.
4. **Regenerate `docs/GUIDE.md`** and get `check-guide.mjs` green.

Only when `check-playthrough.mjs` runs from the title screen to Nereth is the
claim "this game is beatable" one this repo is allowed to make. Until then the
honest statement is: **nothing has played it to the end, and the parts that have
been played work.**

### The Iron Pipe, and why it is the template for the rest

`check-anchor.mjs` names a placement for that room that does not cross it. It is
right about reach and wrong about the patch, and the difference is an open pit
the engine happily walks a player into. See docs/HANDOFF.md. Expect one of these
per anchor/lens/bellows room, and budget for it: a route step that "should" work
from reading the checker is the thing to distrust.

---

## MERGED TO MAIN — and the branch list is now DELETE-ONLY

`claude/merge-three-features-conflicts-6ipqpz` is merged into `main`
(`bbb43e3`) and pushed. Main is green on the full checker table except
`check-guide.mjs`, which is the deliberate staleness described below.

**Sixteen branches remain unmerged and NOT ONE of them should be merged.**
Fourteen are on the branch-audit session's STALE/SUPERSEDED list further down
this file. The two that are not — `playthrough-route-to-end-kxpd28` and
`fix-playthrough-blocker-e72n4s` — both fork from `aa96491`, the commit
immediately before main's old head, and both do the same job as
`claude/health-economy-instrument-s5s5b8`, which won and is already on main.
They are a third and fourth rival attempt at retuning the D1 route, not
outstanding work. The whole list is a deletion job, not a merge job.

`fix-playthrough-blocker-e72n4s` is the one worth READING before deleting: it
mentions `anchor` three times in `tools/playthrough-route.mjs` against main's
two, so it may already contain the anchor-placement directive the route is
missing. Cannibalise it; do not merge it.

**CLAUDE.md's solid-entity trap has been corrected** (`013aa97`). It claimed no
push block had ever been pushed and D1 could not be finished; both stopped
being true in `0b68e6b`, which was already on main when this session started.
A session reading the old text would have gone looking for a bug that no longer
exists.

---

## THE BOARD NOW — three parallel branches merged onto main, and one document
## left deliberately broken

`claude/merge-three-features-conflicts-6ipqpz` merged three branches onto main,
`--no-ff`, in this order: `claude/merge-four-features-53ql03` (13 commits),
`claude/circular-progression-lock-rff8nx` (1), `claude/player-walkthrough-guide-74mtr5`
(1). All three forked from the same main commit (`64af325`) and none had been
merged. The first went in clean. The third collided only in these docs.

The second needed four decisions, all of them written into the code at the
point of decision rather than only here:

1. **`src/data/caves.js` — the Bluff Grotto holds both prizes.** The Noble
   Sword keeps tile 7,2; the Piece of Heart moved to 2,2, the mirror tile.
   **`check-hearts.mjs` was NOT repinned**, and that is the decision, not an
   oversight: it pins the piece COUNT (24 -> cap 15), the divide-by-four, and
   the two-to-a-dungeon split. A piece that moves within one cave changes none
   of the three. Nothing was edited to make a number agree.
2. **`src/data/overworld.js` — the Maku Tree is both her selves.** She is the
   Coastwise Chain's last link (takes the bellrope, gives the Rod, sets
   `gotRod`) AND the two-beat tree whose `makuMaster` scene at five Essences
   grants sword L3 and sets `makuOpenedKeep`. `MakuTree` therefore extends
   `Trader` rather than `Giver` (`src/game/objects.js`), and its "first beat
   first" guard is the chain's `spent()` rather than the Giver's `giveFlag`.
3. **`src/game/objects.js` — both classes kept, whole.** They had merely landed
   textually adjacent; `Trader` and `MakuTree` are now both present in full.
4. **`tools/check-overworld.mjs` — neither side kept whole.** It is the shared
   collision lib's implementation carrying the story gate's `openFlag` clause.

**Two things the merge broke that NOTHING flagged, both in
`tools/check-progression.mjs`.** It is a new file on one side, so git had no
conflict to report:

  * It arrived carrying its own private collision formula — the tenth copy, cut
    from a branch where the other nine still existed. It now calls
    `tools/lib/collision.mjs`. This changed no verdict (exactly as the
    consolidation found for the other nine) but was required by `test.mjs`.
  * It read grants from `o.item`, and making the Maku Tree a trader moved the
    Rod into `o.deals[].item`. It therefore never granted the Rod and reported
    the **Salt Pans unreachable by a finished game**. It now reads deals, and
    treats the chain as an offer needing EVERY link's screen reachable
    (`whereAll`), not just the payout's doorstep. 120/120 screens, 6/6 dungeons.

This is the same shape the four-branch merge hit with `check-hearts.mjs` and
`check-trade.mjs`, two sections below. It has now happened twice. **When one
branch adds a tool and another changes the rules all tools obey, the merge must
re-audit the new tool by hand — every automatic signal is silent.**

### `docs/GUIDE.md` IS STALE ON PURPOSE AND `check-guide.mjs` FAILS 3 OF 4

This is not a regression and must not be "fixed" by editing the guide. The
guide is GENERATED FROM DATA, and it was generated against main before the
trading chain, the Noble Sword, the story gating and the 15-heart cap existed.
It fails exactly here:

  * `every backticked ... id in the guide is real` — `tradeStart`, `tradeMid`,
    `tradeEnd`. The guide's own line 654 describes those story.js lines as
    "not referenced by any" — the Coastwise Chain now references them.
  * `every heartPiece in src/data/ is referenced` — missing `cave1/0,0,0`
    (the Bluff Grotto piece, moved by decision 1 above), `cave2/0,0,0` and
    `d4/0,4,1`.
  * `the guide numbers heart pieces 1..24` — it numbers 18. The cap branch
    raised the count from 18 to 24.

**Session 5's job is to REGENERATE it**, not to patch it. A guide hand-edited
until the checker agrees is a guide written by nobody from the data, which is
the one thing this document is not allowed to be.

### Verified state at the end of this session

Full CLAUDE.md checker table plus the three branch-added checkers, all green
except the one above. Counts that moved from main's baseline, and why:

  * `check-gates` 15 -> 20: the progression branch rewrote it for the story gate.
  * `check-progression` 19: new tool, +1 assertion for the chain offer.
  * `check-hearts` 114, `check-trade` 43: new tools from the four-branch merge.
  * `test` 58 -> 59: the four-branch merge added the private-collision guard.
  * `check-build` colours 16 -> 27: the drawn title screen.
  * Everything else identical to main, `replay` included — all 51 tapes pass
    unchanged, so no entity id moved and nothing re-phased.

The two-beat Maku Tree was additionally driven in a LIVE ENGINE, not just
modelled: beat two refuses to fire before the chain completes, beat one grants
the Rod at stage 12, and beat two then plays `makuMaster`, sets
`makuOpenedKeep` and grants sword L3. `check-gates.mjs` only ever set that flag
by hand, so nothing in the suite proves the tree sets it — that gap is still
open and is worth a real assertion.

---

## THE BOARD, UPDATED AGAIN — title screen art, P9's health economy, P9.5's trading sequence, and the checker collision-model consolidation all landed

Four branches merged into this board at once: the title screen is drawn art
now (`claude/title-screen-art-j2lyg9`), P9's health-economy audit found and
fixed a wrong maximum-health cap (`claude/p9-heart-health-economy-crpqyb`),
the Coastwise Chain trading sequence now exists and pays out the Resonance
Rod (`claude/p9-5-trading-sequence-ama7n7`), and every `tools/*.mjs` checker
that used to carry its own private copy of tile passability now asks the
engine's own `Room.solidAt`/`canOccupy` via `tools/lib/collision.mjs`
(`claude/consolidate-movement-models-f1bqez`). Full detail for each follows
as its own section below.

**The merge itself found one gap the consolidation's own inventory couldn't
see:** `check-hearts.mjs` and `check-trade.mjs` didn't exist yet on the branch
the consolidation was cut from, so neither was converted, and both tripped
`tools/test.mjs`'s new `checkNoPrivateCollisionLogic` guard the moment all
four branches landed together (`check-hearts.mjs:210` masked
`PIT|HAZARD|DEEP`, `check-trade.mjs:160` masked seven flags). Both now call
`defWalkable`/`ROUTE_AVOID` from `tools/lib/collision.mjs` instead; no
assertion moved in either (114/114, 43/43). Every other `tools/*.mjs` file
was swept by hand for the same pattern and each remaining raw-flag site is a
narrow, verb-specific test already documented as intentionally out of scope
(gap-hop tracing, cast/dredge stop rules, throw-flight stops) — none
reimplements general passability.

**Also found, not fixed, not blocking:** `node tools/scan-sprites.mjs
--strict` reports 82 hard findings, all in `title_splash` (holes and
outdents in the mottled backdrop/rings). This predates the trading and
consolidation merges — confirmed identical right after the title-screen
merge alone — and is a pixel-art quality question about the title
backdrop, not a manifest-resolution problem: `scan-sprites` reports all 308
sprite names resolved (both the `title` and `trade` packs installed and
readable, nothing missing). Worth a look next session; not touched here
since it isn't a merge conflict and this session was scoped to not write
new game content.

### Title screen is drawn art now — branch `claude/title-screen-art-j2lyg9`

`src/game/title.js` used to draw the game's name as system-font text over a
procedural sea, with a comment saying it was drawn that way "so the title
needs no art" — a placeholder that had survived to be the first screen
anyone sees. It is now a real title card, built to the Oracle-series title
grammar (that card was the reference held up for it):

| piece | what it is |
|---|---|
| `title_caption` | "THE LEGEND OF", small caps, flat fill + outline |
| `title_wordmark` | "ZELDA", 99x28, ornate display serif, bevelled |
| `title_sub` | "ORACLE OF", small caps |
| `title_pill` | "TIDES" in a stadium: pale ring, deep fill, pale letters |
| `title_conch` | the Moon Conch emblem, 32x35 |
| `title_splash` | the mottled backdrop the text sits on |
| `title_press` | "PRESS START", drawn rather than system text |

Read top to bottom that is **THE LEGEND OF ZELDA / ORACLE OF TIDES**, which
is the source cards' exact four-tier structure.

**`src/data/sprites-title.js`** holds all of it. No sheet has this game's
name on it, so per ART-DIRECTION rule 2 this is drawn-to-match, and it is
hand-authored source — NOT a ripper output, so the generated-file rule does
not apply and there is nothing to re-emit.

The important structural point for whoever edits it next: **the letterforms
are hand-drawn silhouettes**, literal `#`/`.` tables, one per display glyph,
drawn stem by stem with 4px stems, 3px bars and flared serif feet. What is
computed is only the shading — a bevel pass (index 0 on every top/left edge,
index 2 on every bottom/right, index 1 inside) and an outline dilation
(index 3). The first version of this file generated the letters by upscaling
a 5x7 sans font, and it read as exactly what it was; no amount of palette
work fixes letterforms. If you need a new display glyph, draw it into
`DISPLAY` at 20 rows and let the passes shade it. `setType` bottom-aligns on
a common baseline and sizes the block to its tallest glyph, which is what
lets the 26-row `Z` rise above the 20-row `ELDA` the way the source's does —
that one oversized leading letter is most of the logo's silhouette.

Design points worth not re-litigating:

- **The series line is deliberate and must not be "fixed".** Mid-session a
  pass replaced "THE LEGEND OF ZELDA" with an invented line, reading Goal 2
  as a rule about names. It is not — it is a rule about mechanics, items,
  dungeons and story. This is an openly-labelled personal fan game that
  stars Link and runs on ripped sheets; the series line belongs on it. The
  owner reverted that call explicitly and CLAUDE.md now says so at the top.
  **Do not strip it again.**
- **`ZELDA` is the hero word, `ORACLE OF` is the subtitle line, `TIDES` is
  in the pill** — the source's exact split, where the full game title reads
  across the small line and the pill together.
- **The Moon Conch is the marquee-item emblem**, overlapping the wordmark's
  lower right where the source cards put the Rod of Seasons and the Rod of
  Ages. It fills the same role in this game (it is what moves the tide), and
  unlike the branding it IS ours, so it is the worked example of where the
  line actually falls. Its shape follows the 16x16 `i_conch` icon so emblem
  and inventory icon read as one object. If you redraw it: the stepped left
  edge is doing the work — a smooth taper read as a striped leaf, and the
  whorl sutures are what make it a shell.
- **The tide waterline is the one piece of scenery** (item 3 of the brief;
  a moon was the alternative). It crosses the full screen width, not just
  the logo — a waterline that stopped at the logo's edges read as a
  highlight on the logo rather than as a sea level. It sits at the pill's
  ankles: an earlier pass ran it through the middle of the hero word and cut
  it in half like a scanline.
- **All three stages (logo, file select, erase) share the gold frame** and
  the same sea behind them. File-select and erase kept their exact existing
  layout, per the brief — only the border and background changed.

All seven sprite names are registered in `src/data/sprite-manifest.js`
(`REQUIRED_SPRITES.title` and `expectedSize`), with the sizes stated by hand
rather than imported from the module that makes them, so a glyph-table edit
that changes an assembled size is a `validate.mjs --strict` failure instead
of a silent stretch.

**Verified by looking at it, which is the only thing that proves a title
screen.** All three stages were screenshotted in the real palette and read
correctly; `preview.mjs` is explicitly not enough here and could not have
caught any of the four problems that took a pass each to find (halo eating
the backdrop, backdrop reading as TV static, waterline bisecting the hero
word, pill letters washing out). Shots went to a throwaway dir and are not
checked in — `node tools/test.mjs --shots` gets the logo and file-select;
the erase stage needs a one-off script that sets
`window.__game.title.cursor = 3` before the second Enter, and the logo needs
`title.t` parked on an even 16-frame boundary or PRESS START is caught
mid-blink.

Not touched, per the brief: save-file logic, input handling, the intro
sequence.

### Two environment notes for the next session

1. **`replay.mjs`, `walk-dungeons.mjs`, `solve-switches.mjs` and
   `check-gates.mjs` cannot launch a browser in this sandbox.** The
   installed playwright package does not match the installed browser build.
   `test.mjs` and `check-build.mjs` already carry a fallback to
   `/opt/pw-browsers/chromium` for exactly this; the other four do not, and
   die on launch before loading a line of game code. All four were verified
   green this session by patching that same fallback in temporarily and
   reverting it — 50/51 replays, 22 walk-dungeons, 14 check-gates, all 9
   switch rooms. **Giving those four the fallback their siblings already
   have is a real five-line fix and a good first job**; it was left out of
   this commit only because a title-screen diff is the wrong place for it.
2. **Every browser-based checker reports one failure, "no page errors — 404
   Failed to load resource".** It is pre-existing and unrelated — confirmed
   by stashing this session's work and re-running. Do not chase it as a
   regression, but it is worth ten minutes to find and delete the dead
   reference.

### P9's health economy: the cap was 13 and nothing could see it

**P9 step 3 is done. Steps 1, 2 and 4 — the region re-gating — are NOT, and are
the next session's job.** See `docs/EXECUTION-PLAN.md`'s P9 block, which now
says which of its four steps landed.

**The headline: maximum health is a SUM, no file contains it, and it was
wrong.** `tools/check-hearts.mjs` (new, in CLAUDE.md's verification table)
computes it from the loaded data. Its first run read:

```
  start                3 hearts
  Heart Containers     6   (one per dungeon boss)
  heart pieces         18  = 4 containers + 2 ORPHANED
  CAP                  13 hearts
```

Thirteen, against a brief asking for 14-16 — and **two of the eighteen pieces
could never complete a container**. Collectable, jingle, counter ticks, paid
nothing, for ever. (The starting prompt for this session said 19 pieces; the
real count was 18 — 14 `entities` pickups, 4 `buried`, and one of those
"placed" is a `puzzle.reward.spawn` in d3. The discrepancy did not change the
direction of the work, since either number is short.)

**Now 24 pieces, cap 15** — the middle of the window, and a shape worth keeping:
six containers from the six bosses, six more from exploration, plus the three
you start with. Half the maximum is fought for, half is searched for. The six
added:

| Where | Why there |
|---|---|
| `d1/0,5,3` Clawcrab Den | its `puzzle.reward` paid out a **sentence and nothing else** — the only fight in D1 that cost health and returned none |
| `d2/1,5,4` Whelk Cell | the Spire's far-east cul-de-sac |
| `d4/0,4,1` East Overlook | corner furthest from the door |
| `d5/0,5,5` Bower Cell | the Shrine's south-east dead end |
| `cave1` Bluff Grotto | had only a rupee chest |
| `cave2` Reef Hollow | on the seafloor patch — LOW tide only; the room's own carving ("walk where fish swam") is the puzzle |

**None of the six sits on a recorded route.** All 51 replays and
`check-playthrough.mjs`'s 19 checks were unchanged, which is the proof they are
rewards for leaving the path rather than things handed to a passer-by. The
instrumented D1 health table is byte-identical to the one in the archived board
below.

**`d3/0,2,2` Bogmaw Hall has the same empty-reward bug as the Clawcrab Den did**
— miniboss killed, one sentence, nothing dropped. It was left alone only because
d3 is already at its two-piece quota. It should get *something*.

**The distribution is now pinned by the checker: every dungeon carries exactly
two.** This is the guard against the way it broke in the first place — a heart
piece is placed while thinking about a room, and the total it moves lives
nowhere. A future session that wants a different split has to edit
`PER_DUNGEON`, which is the point.

**The damage half was re-derived in the same pass, and deliberately not
applied.** Raising the cap is a difficulty change even when no damage value
moves, which is exactly why the two could not be tuned in separate sessions. The
ladder is now pinned in `check-hearts.mjs` — every enemy on a named rung, a new
enemy fails the checker until someone puts it on one:

```
  tier      dmg  in hearts  at start    at cap
  chip       1 qh  0.25 hearts    12        60   2 types
  ordinary   2 qh  0.5 hearts      6        30   13 types   <- P9's anchor, already correct
  heavy      3 qh  0.75 hearts     4        20   7 types
  miniboss   3 qh  0.75 hearts     4        20   8 types
  boss       4 qh  1 heart         3        15   8 types
```

A miniboss hits for exactly what a jellyfish hits for, and at the new cap the
final boss needs fifteen connections to kill a maxed player. The derived fix, on
the half-heart grid the source games deal on: **heavy 3 -> 4 qh, miniboss 3 -> 6
qh, boss 4 -> 8 qh.**

**Why it was not landed — measurement, not caution.** Every enemy it touches in
the only instrumented dungeon (D1's two anglerfry at `0,5,2`, the Clawcrab at
`0,5,3`, Gohmaraq at `0,3,1`) sits *past the Sluicegate*, in the half of D1 the
route cannot reach. The instrumented run would have shown **no change at all**
while the numbers went in looking proven, it would re-open the D1 economy the
previous session closed by measurement, and it would cost a re-record of all 51
replays. **Its prerequisite is job 1 below.** Full reasoning in
`docs/FEEL-SPEC.md`, "The cap and the damage ladder", and in the checker's own
comment.

Two things the checker found on the way that were NOT bugs, and cost a red each
before the data was checked by hand — the same lesson `walk-dungeons.mjs` learned
about one-way ledges: **a buried piece is dredged, not stood on** (the Drowned
Shore's is under an `abyssHole`, deep water, with a bell NPC leaning at it), and
**a piece on a liftable rock is reached by lifting the rock** (three independent
placements use that idiom). The checker was wrong; the data was right.

**Also found and fixed on the way:** two enemies, `brinehulk` (the Abyssal
Keep's second fight, standing in front of Nereth) and `thalassor` (built,
placed nowhere at all), are bosses in every respect but are declared by no
dungeon — so any tool that infers "boss" from `map.dungeon.boss` mis-classifies
them. `check-hearts.mjs` pins bosses by name and cross-checks the declarations
against that list rather than deriving it from them.

**Next session's job, in order:**

1. **Teach the actor an anchor-placement verb** (sink at a chosen tile, walk
   away, recall) and extend `playthrough-route.mjs` past the Sluicegate —
   unchanged from the previous board, and now blocking the damage ladder as
   well as D1's second-half health reading.
2. **P9 steps 1, 2 and 4: the region re-gating.** Eight regions gated on items
   that no longer exist; five gates should be tile-flag-shaped so
   `check-overworld.mjs` can prove them both ways; the Brineglass Lens must
   never be a region gate.
3. Apply the derived damage ladder once job 1 makes it measurable, and
   re-record the replays against it.
4. Give `d3/0,2,2` Bogmaw Hall a real reward.
5. The 32 stale branches are still undeleted (see the archived board below);
   branch deletion still 403s from the proxy.

### The trading sequence exists, and it pays out the Rod — P9.5

**The fourth gap in the content audit below is closed.** The trading sequence
was `progress.trade = {stage, item}` declared, saved, and read by nothing, with
three orphan dialogue lines and no `trader` entity type. It is now the
**Coastwise Chain**: eleven traders, eleven objects, twelve links, ending at the
Maku Tree, who takes the Tide Bell's own rope and one Essence and hands back the
**Resonance Rod**. Full writeup in `docs/TRADING.md`; the short version:

- **One new entity type, `trader`, holding a list of DEALS.** A deal is live
  when `p.trade.stage === stage - 1`, so exactly one deal in the whole world is
  live at a time — a trader further along has nothing to say to you yet even
  while you are holding what they will eventually ask for. Deals live on the
  trader rather than one-per-NPC, which is the only reason the chain can be a
  circle: **Ossa the net-mender is stage 1 and stage 11**, handing over the
  cracked float on the first visit and taking her kettle back on the eleventh.
- **Ten of the eleven traders were already-placed NPCs that changed type in
  place.** No entity id moved, nothing re-phased, and all 51 replays passed
  unchanged on the first run. Each keeps its old flavour line as the trader's
  `waiting` text, so a player who never starts the chain hears the same coast.
- **The Maku Tree still sets `gotRod`**, at the same moment it always did, so
  the Abyssal Keep's Colonnade grate — the one thing in the game that asks
  whether the player went and did the trade — is untouched. `check-trade.mjs`
  proves it in-engine anyway: it takes the Rod the chain paid out down to
  `d6/1,2,4` and rings the grate open.
- **The Rod now costs the chain AND one Essence.** It used to cost the Essence
  alone. That is a real gate — the Rod opens the Salt Pans' vanes — which is
  why `check-trade.mjs` floods the overworld from the village with **bombs
  only** and asserts every link can be stood next to without it. Bombs (from
  the un-gated Coral Spire) are the chain's one item gate: Yarrow is in the
  Marsh.
- **Eleven hand-drawn 16x16 icons** in `src/data/sprites-trade.js`, and they are
  hand-drawn on purpose: `assets/sheets/oracle-seasons-trading-characters.png`
  carries Seasons' own trade items and every one of them is a thing that game
  is about. The people are extracted; the objects are ours.
- **A trade item is not an inventory item.** It never enters `progress.items`,
  is not in `docs/ITEMS.md`'s roster (which `check-items.mjs` asserts the
  registry matches exactly), and the **Quest screen** is the only place to look
  up what you are carrying.

**Everything green after it**: validate, walk-dungeons 23, check-overworld 17,
check-gates 15, solve-switches, check-motion 8, check-music, check-charms 63,
check-towns 58, check-items 82, anchor 14, cleats 15, lens 24, bellows 60,
reefseed 87, dredge 103, replay 51, test 58, check-playthrough 19, and
check-trade 43.

**One thing a future session should know**: the Maku Tree is a `trader` now, not
a `giver`. Gap 2 below — `makuMaster` never plays, so the level-3 sword is
unobtainable and `makuOpenedKeep` is written by a scene that never runs — is
still open, and whoever wires it up should hang it off a second deal or a
cutscene trigger on that same entity rather than adding a second Maku.

### Checkers no longer define their own collision/passability/push logic — `claude/consolidate-movement-models-f1bqez`

**The trigger:** a prior session found that 550 assertions were once green
while no block in the game could actually be pushed, because
`solve-switches.mjs` and `walk-dungeons.mjs` each modelled movement with a
private copy of the collision rule instead of asking the engine. This session
was scoped to find and eliminate EVERY such private model in `tools/`, not
just those two.

**Inventory (found by grepping for the `F.VOID | F.SOLID | F.PIT | F.DEEP |
F.LEDGE | F.HAZARD`-shaped fingerprint and its variants across `tools/*.mjs`,
then verifying each hit by eye):**

- `tools/walk-dungeons.mjs` — its dungeon-reachability flood (`walkableAt`),
  the tide-locked-room flood, and the locked-door-separates-its-room check
  each re-derived walkability from raw tile flags instead of asking a real
  `Room` (via `getRoom`, already imported in the page) for `solidAt`.
- `tools/check-overworld.mjs` — same shape, plain Node, already building real
  `Room` objects via `getRoom` for tile *names* but not asking them for
  *solidity*.
- `tools/solve-switches.mjs` — already called the engine's real
  `game.tryPushBlock` for the push itself (good), but its `notStandable`
  check (can the player stand behind the block to push it) re-derived
  standability from raw flags instead of calling `canOccupy`.
- `tools/find-ledges.mjs` — its `plain()` placement filter re-derived
  walkability from raw flags on top of legitimate placement-only curation
  (no warp/door/stairs/bombable-wall as a lip).
- `tools/check-anchor.mjs`, `check-bellows.mjs`, `check-cleats.mjs`,
  `check-dredge.mjs`, `check-lens.mjs`, `check-reefseed.mjs`,
  `find-crossings.mjs`, `check-towns.mjs` — every one of these carried its own
  `walkableDef`/`occupiable`/`walkable` function reimplementing the exact
  formula `Room.solidAt` already computes, several of them byte-for-byte
  identical copies of each other (a mode-aware `occupiable(d, mode)` appears
  nearly verbatim in four separate files). `check-reefseed.mjs` additionally
  carried a full second copy of `solidAt`'s body in a `Board.solid` method,
  and a copy of `Reefseed.canPlant`'s terrain-block mask.

**What was NOT touched, and why:** a handful of sites combine exactly
`F.SOLID | F.VOID` to ask "does this stop a flying/thrown thing" — the Dredge
Line's cast-stop rule, a hop's mid-flight clearance check, an Anchor throw's
flight. That is a genuinely different, narrower, irreducible question from a
walking body's passability (a projectile crosses DEEP/PIT/HAZARD/LEDGE freely
and only a wall stops it), it cannot be expressed by composing
`tileWalkable`'s `caps`/`avoid` parameters, and every instance already matches
the real engine formula it mirrors (`DredgeLine.update` in
`src/game/items.js`) — verified by reading the source, not assumed. These are
left as direct, narrow, single-purpose flag tests. `tools/test.mjs`'s new
guard (below) is deliberately tuned to leave them alone: it only fires on a
mask naming three or more collision-shaped flags, and `F.SOLID | F.VOID` is
two.

**What changed:**

1. New `tools/lib/collision.mjs` — the one place outside `src/` allowed to
   name a raw tile flag as "solid". It composes `Room.solidAt` (via
   `tileWalkable`/`tileSolid`) and a small extracted engine function,
   `tileDefSolid` (new export in `src/world/tileset.js` — the exact body that
   used to live only inside `Room.solidAt`, pulled out so a checker with a
   resolved `TileDef` in hand, not a pixel to sample, can ask the SAME
   function rather than a copy of it; `Room.solidAt` now calls it too). An
   `avoid` flag mask parameter is how a checker expresses "and also treat
   this as a wall for route-planning" (F.PIT/F.HAZARD, exported as
   `ROUTE_AVOID`) — the same composition pattern `canOccupy` already uses for
   an enemy's `avoidFlags`, not a new rule. `capsForMode('foot'|'swim'|'sink')`
   gives the Cleats' two modes a name instead of writing the capability object
   out at every call site.
2. Every file in the inventory above now calls into `tools/lib/collision.mjs`
   (or, for `walk-dungeons.mjs`/`find-ledges.mjs`/`solve-switches.mjs`, the
   real engine's `canOccupy`/`room.solidAt`/`getRoom`, live in the page —
   these already boot a real headless-Chromium instance of the game and can
   `await import('/src/game/entity.js')` etc.). `check-reefseed.mjs`'s
   `plantableTerrain` now imports a new export, `REEFSEED_PLANT_BLOCK`, from
   `src/game/items.js` (the exact mask `Reefseed.canPlant` uses) instead of
   retyping it — this checker has no live `game` to call `canPlant` on
   directly, so importing the same constant is the strongest link available
   short of running it inside a browser.
3. `tools/test.mjs` gained a guard, `checkNoPrivateCollisionLogic`: it fails
   if any `tools/*.mjs` file outside `tools/lib/collision.mjs` combines three
   or more collision-shaped flags (`SOLID, VOID, PIT, DEEP, LEDGE, HAZARD,
   JUMPABLE, BUSH, ROCK`) in a bitwise-OR mask. Verified against the
   pre-refactor tree (via `git show HEAD:...`) that it actually catches the
   originals, and confirmed silent on the consolidated tree.

**Results, before vs. after — nothing that asserts moved. Two things that
only REPORT a number did, and both are real, both are explained, and both
make the checker MORE correct, not less:**

- `check-overworld.mjs`: 17/17 passed, unchanged. Reported tile/state counts
  rose slightly (2928→2941 tiles in the unheld flood; states similarly) because
  the private formula treated every `F.SOLID`-flagged tile as fully blocking
  regardless of `mask`, while `Room.solidAt` correctly reads `mask: 0` (a
  doorway/cave-mouth cut into a nominally-solid tile) as open. The old
  checker was silently refusing to walk the flood onto cave mouths and town
  doors; no screen's reachability verdict depended on it, so no `check()`
  moved, but the flood's own node count was quietly wrong for the whole life
  of the checker.
- `find-ledges.mjs`: reporter only, no assertions. Candidate count dropped
  942→810 (overworld alone: 322→190) because the private `plain()` filter
  never excluded `F.BUSH`/`F.ROCK` tiles, so it was offering bush and
  liftable-rock tiles as valid ledge-lip placements — tiles a player cannot
  actually stand on as "plain floor" without first clearing them. Confirmed
  by direct count: the data has 87 BUSH-tide-instances and 414 ROCK-tide-
  instances across all rooms. This is a bug the private model was hiding,
  now caught.
- Every other checker touched (`walk-dungeons.mjs`, `solve-switches.mjs`,
  `check-anchor.mjs`, `check-bellows.mjs`, `check-cleats.mjs`,
  `check-dredge.mjs`, `check-lens.mjs`, `check-reefseed.mjs`,
  `find-crossings.mjs`, `check-towns.mjs`) produced BYTE-IDENTICAL output to
  its pre-refactor baseline (diffed directly, not eyeballed). `check-gates.mjs`,
  `check-items.mjs`, `check-motion.mjs` and `check-playthrough.mjs` (19/19,
  matching the board's documented current state) were re-run as a sanity check
  on the `src/world/room.js`/`tileset.js` refactor and are also unchanged.
  `tools/test.mjs` is 59/59 including the new guard.

**Left for later, deliberately not chased this session (out of scope: these
are verb-specific tile-flag tests, not passability):** `castStops`/`snagAt`
in `walk-dungeons.mjs` and `check-dredge.mjs`, `hoppableDef`/throw-flight
stops in `check-anchor.mjs`, `check-items.mjs`'s single `f & 1` scan to find
a fixture tile. Each was read against its real engine counterpart and
confirmed to already match it exactly; none reimplements walkability.

**Not in this session's inventory, because they did not exist yet on the
branch this was cut from: `check-hearts.mjs` and `check-trade.mjs`** (both
landed by the other two branches merged into this same board). Whether either
carries its own private collision/push model, unconverted, needs checking the
next time either is touched.

## THE BOARD, UPDATED AGAIN — the circular progression lock is fixed, and there is now a checker that can see that class of bug

**The world could not be finished, and every checker in the CLAUDE.md table
was green.** D4's entrance (`0,1,3`) and D6's (`0,1,0`) were both sealed
behind tiles that only the Dredge Line opened, and the Dredge Line is the item
inside D6 — the Cliffs of Kell's boulders and the Abyss Stair's iron plug. A
real player floods **59 of 120 screens**, clears D1, D2, D5 and D3, and stops
with four Essences and nowhere to go.

`check-overworld.mjs` could not see it and still cannot: it drops ONE gate
while holding all the others, which is the right question for "is this gate a
gate" and blind to a CYCLE — gate A opened by an item behind gate B and vice
versa survives every single-drop run. That is now written down in
`docs/HANDOFF.md` under hard-won lessons, at length, because it cost a session.

### What changed, in the world

1. **The road to the Keep is a STORY gate now, not an item gate.** `abyssPlug`
   became `keepSeal`: same art, `F.SOLID` only, and a new tiledef field
   `openFlag: 'makuOpenedKeep'`. The Maku Tree sets that flag at five Essences
   and nothing the player carries opens the tile. Upper Kell's four boulders
   (`0,2,2` row 1) are the seal's second course — the plugs alone were never
   enough, since nothing lies between the two runs and opening one buys a
   single screen of dead end.
2. **`makuMaster` finally has a trigger.** The cutscene — the tree opening the
   road and handing over the level-3 sword — had sat complete in
   `src/data/story.js` since it was written with NOTHING referencing it. New
   entity `makuTree` (`src/game/objects.js`), a `Giver` with a second beat:
   the Rod at one Essence as before, then `makuMaster` at five. Because the
   L3 sword was granted only there, **a real player's sword never left level
   1** until this commit.
3. **The Noble Sword (L2) is placed rather than collapsed.** It is in the
   Bluff Grotto (`cave1`), in a big chest that refuses below four Essences —
   exactly where `docs/GAME-PLAN.md` had said it was all along. Collapsing to
   two tiers would have thrown away a damage tier, three HUD icons and three
   swing sounds that all already exist, and the Oracles ship three. `Chest`
   grew `needEssences` / `needText` for it, mirroring `giver`.
4. **The Cliffs of Kell open on Bombs (D2), not the Dredge Line.** The gate is
   the Deep Cut's east-bank rockfall (`0,3,4`, col 8, rows 2-5), now four
   `boulderCracked` tiles — a new tile, `boulder`'s art with a fault line
   through it, `F.SOLID | F.BOMBABLE` and nothing else.
   - **Bombs, not the Cleats**, and the reason is not the verb table: a Cleats
     gate has to be a DEEP channel at least three tiles wide, because a jumping
     player crosses `DEEP` as well as `JUMPABLE`, so a narrower one is not a
     gate at all (`check-gates.mjs` exists because of that class of mistake).
     Widening the cut to three tiles rewrites the screen's east bank and its
     seam with the Wood. The order argument for the Cleats — that D3 before D4
     keeps the essence-numbered cutscenes in sequence — does not survive
     contact with the data either: **D5's entrance is reachable at zero
     items**, so the world already permits out-of-order play.
   - **All four boulders are cracked, not one.** Leaving three carrying
     `F.HEAVY` gives the gate two keys, and `check-overworld` then reports
     "without Bombs the Cliffs are sealed" as ten screens (the Marsh only).
   - The other boulders — the Marsh Stair's four at `0,1,5` — stay on the
     Dredge Line, so the Line keeps a real overworld verb. It seals two
     screens (the Bog Stair) and that is optional content on purpose: nothing
     on the critical path may hang off the last dungeon's item.

### `tools/check-progression.mjs` — new, 19 assertions, in CLAUDE.md's table

It floods the overworld in ACQUISITION ORDER: a new game holding what the
intro gives (`conch L1`, `sword L1`), then whatever dungeon doors that reaches,
then EXACTLY the items those dungeons grant — read out of each dungeon's own
chests, so D2's Bomb Vault and D6's Mermaid Vault are not missed — and floods
again, to a fixpoint. It asserts every dungeon's door is reachable while its
own item is still inside it, at the LEVEL it grants (D6 hands over Cleats L2
while D3's L1 is held, which is not self-gating and an id-only check calls a
failure). It also reads a `makuTree`'s scene for its grants and flags, so the
Master Sword and `makuOpenedKeep` are proved collectable.

The order it derives now:

```
  a new game holds: conch L1, sword L1
    round 1: D1 Tidewash Grotto at 0,8,8 -> anchor L1
    round 1: D2 Coral Spire at 0,10,5 -> lens L1, bombs L1
    round 1: D5 Drowned Wood Shrine at 0,5,4 -> reefseed L1
    round 2: Thalassia: coin L1 at 3 Essence(s)
    round 2: The Maku Tree: rod L1 at 1 Essence(s)
    round 3: D3 Bogwater Sanctum at 0,1,8 -> cleats L1
    round 3: D4 Cliffside Cistern at 0,1,3 -> bellows L1
    round 4: The Maku Tree: makuMaster at 5 Essence(s) -> sword L3 + 'makuOpenedKeep'
    round 4: Bluff Grotto: sword L2 at 4 Essence(s)
    round 5: D6 Abyssal Keep at 0,1,0 -> dredge L1, cleats L2
  reached 120/120 screens with 6/6 dungeons cleared
```

**It was run against the commit before the fix** (a throwaway `git worktree` at
`HEAD`) and reports 4/6 dungeons, 95/120 screens, and four failures naming D4
and D6. That is the proof it does what no existing checker does — do not take
it on trust if you change it; re-run it against a broken tree.

What it does NOT prove: it floods the overworld's tiles, so it says a
dungeon's DOOR is reachable, not that the dungeon behind it is beatable.
`walk-dungeons.mjs` owns the inside and `check-playthrough.mjs` plays it.

### Everything else that moved

- `check-overworld.mjs`: `GATES` rewritten — `bombs` (34 screens), `rod` (27),
  `keep` (8, a story gate keyed on `openFlag` rather than a tile flag),
  `dredge` (2). `dredgePlug` is gone. The flood understands story gates now.
- `check-gates.mjs`: 15 -> 20 assertions. The plug probe became the Keep's
  seal (shut, refuses the Dredge Line, says why, then opens on the flag alone
  across BOTH courses); the Upper Kell boulder probe moved to the Marsh Stair,
  since Upper Kell's boulders are the seal now; new probe bombs the Deep Cut
  rockfall, which is the critical path and the one gate a player cannot route
  around.
- `F.MAGNETIC` is deleted. Nothing carried it once the plug became the seal.
- `docs/GAME-PLAN.md`: the Overworld layout table is REWRITTEN from the data —
  it named seven gates on six items this game does not have. The Dungeons and
  Item progression tables below it are stale in the same pre-P8 way and now
  carry a banner saying so; rewriting them from the data is its own session.

**Next session's job, in order:** unchanged from the board below — the actor's
anchor-placement verb and extending `playthrough-route.mjs` past the
Sluicegate is still job 1, and the 32 stale branches are still undeleted. Add
to it: `check-playthrough.mjs`'s recorded route stops inside D1 and therefore
never exercised any of this; a route that reaches D2's bombs and walks to the
Cliffs would put the fix under the harness that actually plays the game.

## THE BOARD, UPDATED AGAIN — a player's guide, generated from data, and the progression gap it found

**This session wrote `docs/GUIDE.md`**, a full player's walkthrough (premise
and controls, all six dungeons room-by-room, every Heart Piece, the trading
sequence, optional secrets, every charm, and an appendix of items/enemies/
gates) generated by reading `src/data/` directly — installing the real
registries in plain Node and cross-checking every claim against them, not
against `docs/GAME-PLAN.md` or `docs/ITEMS.md` from memory. It also wrote
`tools/check-guide.mjs`, a plain-Node checker (no browser) that parses the
guide for every backticked room/item/charm/enemy/boss/map reference and
proves each one resolves against the live data, and separately proves every
`heartPiece` placement `src/data/` holds is mentioned in the guide's
numbered list. Both directions are green as of this session's commit.

**The single most important thing this session found: the game is not
completable end to end, for a reason nobody had written down.**
`node tools/check-overworld.mjs` with **zero items held** floods only 59 of
120 overworld screens — and neither D4's entrance (`overworld/0,1,3`, Cliffs
of Kell) nor D6's (`overworld/0,1,0`, the Abyssal approach) is reachable.
Both sit behind `F.HEAVY`/`F.MAGNETIC` tiles that only the **Dredge Line**
opens (`src/world/tileset.js`: "boulder: only the Dredge Line drags it
clear") — and the Dredge Line **is D6's own item**, sitting in D6's own
Dredge Vault (`d6/0,4,3`). The only door into the dungeon that hands the item
over is gated by the thing it hands over. A `makuOpenedKeep` flag gets set by
the `makuMaster` cutscene (5 Essences) but nothing anywhere reads it, so
there is no alternate route hiding behind it either. **No existing checker
catches this** — `check-overworld.mjs` proves each gate opens with *its own*
item in isolation, never that the item is obtainable before you need to
cross the gate it opens; `check-playthrough.mjs`, the only tool that plays
rather than models, doesn't get far enough to hit it (its route stops inside
D1, at the Anchor chest, per the actor's missing anchor-placement verb —
still true, see the board below this one). This is not the D1 push-block
class of bug (that one is fixed, see below); it's a new, distinct,
unresolved gap, discovered empirically by running the checker with no items
rather than by reading data. **Next session: either give D4/D6 a second
entrance the existing four dungeons' items can open, or move the Dredge Line
gate off the Cliffs of Kell (it's the odd one out — D4's own tide theme has
nothing to do with the Dredge Line) so the four early items chain to it
honestly.** Full detail, plus every other place `docs/GAME-PLAN.md` and
`docs/ITEMS.md` disagree with the live data (the item roster, the six-vs-
eight dungeon count, the missing trading sequence, the actual Heart Piece
count), is in `docs/GUIDE.md`'s closing "Disagreements between docs and
data" section — read it before touching `docs/GAME-PLAN.md`, which is still
stale on all of those points and is still marked authoritative at its own
top.

**The actual Heart Piece count is 18, not 19.** Found by grepping
`heartPiece` across `src/data/` and checking each hit is a real placement —
one hit (`src/data/audio.js`) is a jingle name, not a pickup, and does not
count. 18 pieces, six dungeon Heart Containers (one per boss) and 3 starting
hearts put the practical maximum at **13.5 hearts**, not the "about 16" that
`docs/GAME-PLAN.md`'s stale eight-dungeon health table claims.

**A quirk of `check-playthrough.mjs` worth knowing before extending its
route:** it only proves D1's own route, and only as far as the Anchor chest
(`d1/0,3,2`) — the harness's scripted actor has no directive for "place an
item at a chosen tile, walk away, recall it," which is what every room past
the Sluicegate needs. D2 through D6's room orders in `docs/GUIDE.md` are
therefore each dungeon's own *stated* intended route (the comment written
above its `registerMap()` call in `src/data/dungeons-a.js`/`dungeons-b.js`),
not a played confirmation — the guide says so explicitly, twice, so a future
reader doesn't mistake "the dungeon's own author's route" for "a played
route" the way it would be easy to.

Checkers run clean this session: `node tools/validate.mjs`,
`node tools/test.mjs` (58/58), `node tools/check-overworld.mjs`,
`node tools/check-guide.mjs` (new), `node tools/check-build.mjs`, and
`npm run build` (`dist/oracle-of-tides.html` committed). Nothing in `src/`
changed — this was a documentation and tooling session only.

---

## THE BOARD, UPDATED AGAIN — the route retuned past the push-block blocker, D1's health economy instrumented and fixed

**`tools/playthrough-route.mjs` was stale in exactly the way the previous
board's first job said it was**, and this session did that job: the route now
drives past both locked doors and the Sluicegate to the Anchor chest
(`d1/0,3,2`), using `travel` for room-to-room movement instead of hand-picked
`goto` waypoints (which is what broke — a `goto` aimed at a tile a push block
now solidly occupies fails to path at all, and the whole rest of the old
route quietly played out inside the wrong room). `GOAL.blocked` is gone;
`GOAL.needsVerb` replaces it, naming the real remaining gap honestly: past
the Sluicegate every room is gated by the Anchor's OWN placement verb (sink
on a tile, walk, recall), and `actor-runtime.mjs` has no directive for that —
`dUse` presses whichever button an item is on, which is right for the conch
and wrong for placing something at a chosen tile. That is real dungeon
engineering (the Iron Pipe / Long Race gate pair, two anchor-gauge rooms) and
is the next session's dungeon job, not a bug to route around.

**Two real bugs in the shared actor (`tools/actor-runtime.mjs`) were found
and fixed getting there, both in `dLoot`, both proven behaviour-preserving
(all 51 replays still pass unchanged — a well-behaved pickup is still
collected on the first attempt, so neither fix's code path is exercised by
any existing recorded tape):**

1. A puzzle-reward pickup spawned mid-sweep (mid-`grabDelay`) read as
   "nothing here" and was abandoned for good. The Sunken Hall's fairy — D1's
   only unconditional heal, only reachable at all now that push blocks
   work — sat uncollected on the floor for the rest of every run this way.
2. A reward pickup that pops and settles one tile above its logical spawn
   tile (documented in `dungeons-a.js`'s own comment on the Crab Pit's key —
   "the player can only just touch it") was approached at the WRONG tile
   (its centre-Y, one tile too low) and never collected. `dLoot` now retries
   one tile further north before giving up.

**Health at every room boundary is now instrumented, not guessed.**
`tools/check-playthrough.mjs` prints a table (room, frame span, hearts
in/out, trough, damage, healing) plus the three worst stretches computed
from it. Full writeup, including exactly which enemies' drop odds moved and
why the trough needed a GUARANTEED heal rather than a probability bump, is
in `docs/FEEL-SPEC.md` under "Health economy — D1, instrumented rather than
guessed". The short version:

**Before** (route fixed, looter fixed, no balance changes — seed `20260806`):

```
   room                    frames      in   out   min   dmg  heal
   d1/0,3,6 Drinking Floor  1938-2970  12    10     6     6     4
   d1/0,3,5 Sunken Hall     2970-3954  10    12    10     0     2   <- the fairy, now collectable post-dLoot-fix
   d1/0,2,4 Crab Pit        5477-6050  10    10     6     4     4
   d1/0,3,4 Tide Gallery(3) 6763-7298   8     4     4     4     0
   d1/0,3,3 Locked Stair    7298-8658   4     4     4     0     0
   d1/0,3,2 Sluicegate      8658-8900   4     4     4     0     0
worst stretches: 2850-frame drought (Switch Room -> Sluicegate, no heal at
all); deepest trough 4/12 qh (1 heart) at the Tide Gallery's third pass;
spikes >1/3 max at the Drinking Floor (6qh), Crab Pit (4qh) and Tide
Gallery (4qh).
```

**After** (`drops: 'good'` on the Drinking Floor / Tide Gallery / Locked
Stair enemies, plus one GUARANTEED heart pickup added to the Switch Room's
puzzle reward, both in `src/data/dungeons-a.js`):

```
   room                    frames      in   out   min   dmg  heal
   d1/0,3,6 Drinking Floor  1938-2970  12     6     6     6     0
   d1/0,3,5 Sunken Hall     2970-3954   6    12     6     0     6
   d1/0,2,4 Crab Pit        5477-6050  10    10     6     4     4
   d1/0,4,4 Switch Room     6256-6771   8    12     8     0     4   <- the guaranteed heal
   d1/0,3,4 Tide Gallery(3) 6771-7127  12    12    12     0     0
   d1/0,3,3 Locked Stair    7127-8487  12    12    12     0     0
   d1/0,3,2 Sluicegate      8487-8729  12    12    12     0     0
worst stretches: deepest trough now 6/12 qh (half a heart's worth of max —
i.e. exactly half, at the Drinking Floor, the first fight in the game) and
the run reaches the Sluicegate at FULL health.
```

The Drinking Floor's own trough (half health, first fight) was left alone on
purpose: it is the game's very first combat, the room's odds were already
raised to `good` and simply did not draw a heart on this seed, and a second
guaranteed heal there would push the run's floor above half — which the
brief explicitly ruled out ("a run that never drops below half is as wrong
as one that dies"). Three hits of half-heart contact damage in the tutorial
fight of a three-heart-start game is inside P9's curve, not a violation of
it.

`node tools/check-playthrough.mjs` is 19/19. Every other checker in the
CLAUDE.md table was re-run after the `dungeons-a.js` edits and is unchanged:
`validate.mjs` OK, `test.mjs` 58/58, `replay.mjs` 51/51 (unchanged — proof
the `dLoot` fix is behaviour-preserving), `walk-dungeons.mjs` 23/23,
`check-overworld.mjs` 17/17, `check-gates.mjs` 15/15, `check-anchor.mjs`
14/14, `check-items.mjs` 82/82, `solve-switches.mjs` 9/9.

**Next session's job, in order:**

1. **Teach the actor an anchor-placement verb** (sink at a chosen tile, walk
   away, recall) and extend `playthrough-route.mjs` past the Sluicegate —
   the Iron Pipe/Long Race gate pair, the two anchor-gauge rooms, the
   Clawcrab Den miniboss, the Boss Key, and finally Gohmaraq. `GOAL.room`
   moves to `d1/0,3,1` (or the essence pickup) once it does.
2. Once the route reaches the boss and beyond, the health-economy
   instrumentation should be re-read for D1's SECOND half (the Anchor
   gate rooms, the Clawcrab Den, the boss fight) — nothing here says
   anything about whether THAT stretch is thin, only about the stretch a
   route could actually reach.
3. The 32 stale branches from the branch-audit session are still
   undeleted (see the archived board section below) — branch deletion was
   still 403ing from this session's outbound proxy too; try again.

---

## THE BOARD, UPDATED AGAIN — three branches merged, 32 stale branches classified

**A branch-audit session merged the three branches carrying real unmerged
work, in order: `claude/entity-solid-collision-pdxrhy` (the solid-entity
fix), `claude/playthrough-route-end-714gkr` (docs, declined to extend the
route), `claude/audio-track-structure-mhglzh` (music bridges, adds
`tools/check-music.mjs` to the CLAUDE.md table). All three are `--no-ff`
merge commits on `main`, not squashed. Every checker in the CLAUDE.md
verification table was run after each merge; counts were unchanged
throughout except where the merges' own content changed them (51/51 replays
stayed 51/51 — the branch's own re-recording already covered it; 82 items,
58 unit tests, 24 legends/310 tiles/273 rooms all held).

**`check-playthrough.mjs` moved, and this was expected, not a surprise.**
The `entity-solid-collision-pdxrhy` merge is a real behavior change (push
blocks can be pushed now), so the run gets further than before — it now ends
at `d1/0,2,5` instead of dying earlier — but `check-playthrough.mjs`'s
assertions (and `tools/playthrough-route.mjs`'s `GOAL`/`ROUTE` data) still
describe the pre-fix world, so 5 of its 20 checks now FAIL: `no push block
ever moved`, `keys in hand`, `doors opened`, `chests`, and the stop-room
assertion. This is exactly the retuning job the merged branch itself flagged
(see the archived board section below, "solid entities land, and the route
data is now stale") — **not fixed in this session**, per this session's own
scope (branch consolidation only, no game-code changes beyond what the
merges brought). This is the next session's first job; see below.

**32 other `claude/*` branches were classified and none were merged/deleted
in git** (branch deletion — both `git push --delete` and the GitHub REST API
`DELETE /git/refs/...` — returned HTTP 403 from this session's outbound
proxy: "Write access to this GitHub API path is not permitted through this
proxy." This is an infrastructure restriction, not a judgment call — the
classification itself is done and is safe to act on):

*MERGED (ahead 0 — safe to delete, no unique commits)*: `audit-consolidate-branches-5knfli`,
`dungeon-5-iteration-polish-o6gpys`, `dungeon-6-p8-polish-9vwxpy`,
`dungeon-p8-d4-iteration-1n9lfb`, `enemy-grid-aligned-movement-n2xv16`,
`engine-feel-determinism-lel1me`, `gbc-zelda-movement-sword-r1vxqv`,
`next-session-iteration-o1zrx7`, `oracle-tides-continued-ebfuit`,
`oracle-tides-polish-aqche8`, `oracle-tides-polish-grjnhj`,
`p7-6-multi-screen-rooms-s3m1ms`, `p8-dungeon-generation-muve1i`,
`p8-execution-dungeon-audit-ruwmru`, `playthrough-test-harness-jq9z5o`,
`project-iteration-p7-n3k9cq`, `spatial-tide-level-t2d9kv`,
`tide-levels-test-flakiness-73jc39`, `tidewright-items-impl-nrpd3y`,
`towns-construction-b67b20`.

*SUPERSEDED (ahead >0, but the work reached main another way — safe to
delete)*: `coral-spire-reauth-s93w9t` (1 ahead — superseded by `0a3776f`/
`2980fe4`, the Coral Spire rebuilt around the Brineglass Lens, merged as
P8/D2) · `next-session-iteration-6cyssw` (2 ahead — superseded by `25c3111`/
`d197078`, Thalassia's towns given faces, merged as PT) ·
`next-session-iteration-b2tuo7` (5 ahead) and `next-session-iteration-erdixn`
(10 ahead) — both superseded by `ade9153`, the PT step-5 cliff survey merge
· `oracle-build-script-coklp7` (2 ahead — superseded, per this session's
starting brief) · `p7-6-camera` (7 ahead — superseded by
`p7-6-multi-screen-rooms-s3m1ms`, already merged into trunk) ·
`p8-dungeon-generation-faqood` (1 ahead — superseded by `0a3776f`, identical
commit message, redone on trunk) · `p8-execution-plan-jh6exl` (2 ahead —
superseded by `b235a10`, Tidewash Grotto rebuilt around the Anchor, merged as
P8/D1) · `oracle-tides-boss-music-4c24tm` (32 ahead), `oracle-tides-polish-nphkj0`
(7 ahead), `zelda-boss-behavior-jgbfwo` (28 ahead), `zelda-style-game-piqt8v`
(28 ahead) — all four are the pre-`docs/BRANCHING.md` lineage (the original
engine/sprite/dungeon/boss/HUD/music build, before trunk consolidation was
written down); every deliverable they carry (engine core, extracted sprites,
all dungeons, bosses, HUD, story, music tracks) already exists on `main` in
evolved form via the post-consolidation trunk workflow.

No branch was classified UNCLEAR.

**Next session's first job: retune `tools/playthrough-route.mjs` and
`check-playthrough.mjs`'s stale assertions** now that push blocks work — see
the archived board section immediately below for the full diagnosis (why it
stops at `d1/0,2,5`, what `GOAL.blocked` gets wrong, what needs to change).
**Second job: delete the 32 branches listed above** (`git push origin
--delete claude/<name>` for each) once branch-deletion access is available
again — nothing further needs auditing, only the deletion itself.

---

## THE BOARD, UPDATED — solid entities land, and the route data is now stale

**`Entity.solid` is read now.** `canOccupy` (`src/game/entity.js`) rejects any
position whose hitbox overlaps a non-dead entity with `solid` set, skipping
the check while airborne (`e.flying || e.z > 2`), and an entity never collides
with itself. Verified in-engine before touching any replay: a player stood one
tile south of a spawned block, held `up` for 120 frames, and the block moved
one tile north with the player following flush behind it — the one assertion
550 existing green checks could not make. **Push blocks can be pushed now.
Chests, torches and signposts block the player too.**

**All 51 replays re-verified; 4 changed, and each is explained, not
adjusted-to-match:**

- `d1-descent` and `d2-fork-wrong` diverge a pixel or two within the first few
  hundred to few thousand frames — the actor is now genuinely colliding with
  solid objects it used to walk through, so its path bends slightly. Both
  re-recorded runs complete further than the old (buggy) baselines: d1-descent
  now reaches d1 0,3,3 (the Locked Stair) instead of dying on the overworld,
  which is exactly the room `check-playthrough.mjs`'s stale `GOAL` names as
  the historic blocker.
- `village-walk` diverges ~10px around frame 240: the actor's pathfinder now
  routes slightly differently around the three wandering NPCs, who are real
  obstacles for the first time. No assert on this plan; it still completes the
  same route.
- `village-shop-door` is the one that needed a real look, not just a
  re-record. Its synthetic spawn point (`enter: [...,96,88,'down']`) sat 8px
  from the wandering villager's home tile (6,6 → pixel 96,96); the two
  hitboxes clipped by 2px. That used to be invisible. Now `canOccupy` fails at
  that spawn point, `reconcileWithTide` (called on every `enterMap`, written
  for tide safety but generic in what it checks) invokes `findSafeTile`, and
  the player is relocated flush against the shop's solid wall *before a single
  button is read* — stranding the scripted `hold up` for the rest of the run.
  This is not a bug in the fix; it is a real, if tiny, coincidence in test
  data (the replay's own synthetic start position, not anything in
  `src/data/`). Fixed by moving that one replay's `enter` y from 88 to 80 in
  `tools/replay-plans.mjs`, 8px clear of the villager's hitbox, with the
  reasoning written inline. The scenario is unchanged; it now completes
  (`roomChanges: 2`) as originally intended.
- **This is worth generalising, not just patching once**: any door's
  return-warp coordinate that happens to land within a stationary or
  home-tile NPC's hitbox will now silently relocate the player via
  `reconcileWithTide`/`findSafeTile` on room entry. No checker currently
  looks for this across the whole map. `check-towns.mjs` proves stationary
  NPCs don't sever a screen's connectivity; it does not check whether a
  warp's *landing pixel* clips one. Worth a pass before trusting other towns'
  return warps.

**Every checker in the CLAUDE.md table re-run and green, with the numbers
UNCHANGED except where noted:**
`validate.mjs` OK · `test.mjs` 58/58 · `replay.mjs` 51/51 · `walk-dungeons.mjs`
23/23 (unchanged — it's a separate model that already simulated pushing
abstractly) · `check-overworld.mjs` 17/17 · `check-gates.mjs` 15/15 ·
`check-towns.mjs` 58/58 · `check-items.mjs` 82/82 · `check-charms.mjs` 63/63 ·
`check-anchor.mjs` 14/14 · `check-lens.mjs` 24/24 · `check-cleats.mjs` 15/15 ·
`check-bellows.mjs` 60/60 · `check-reefseed.mjs` 87/87 · `check-dredge.mjs`
103/103 · `check-motion.mjs` 8/8 · `solve-switches.mjs` 9/9 (unchanged — same
reason as walk-dungeons) · `scan-sprites.mjs --strict` 0/0 · all four rippers
reproduce byte-identical · `npm run build` + `check-build.mjs` OK.
**`solve-switches` and `walk-dungeons` did NOT move**, which the prompt that
started this session flagged as something to report either way: both are pure
models of the world that already assumed a push resolves the way `PushBlock`
data says it does, so making the real engine agree with that model changed
nothing they can see.

### `check-playthrough.mjs`: it does NOT yet pass the Locked Stair, and here is why

Push blocks genuinely move in a full playthrough now — the run's own block
audit shows `blocksMoved > 0` (the printed count, e.g. "2955 of 4", is a
pre-existing display bug in `actor-runtime.mjs`'s `_audit_tick`: once
`_blockHome` records a block as `' moved'`, every later frame's position
string differs from that sentinel too, so `blocksMoved` increments once per
frame rather than once per block — cosmetic only, not touched here since it's
outside this session's scope).

But the run does not reach d1 0,3,3 the way `check-playthrough.mjs` still
narrates. **`tools/playthrough-route.mjs`'s `GOAL.blocked` block is stale
data** — it unconditionally prints "THE GAME CANNOT BE FINISHED... stops at
d1/0,3,3" whenever `GOAL.blocked` is set, regardless of what the run actually
did (see `check-playthrough.mjs` lines ~217-222). The run's *actual* new
`ended` room is **d1/0,2,5**, short of 0,3,3, not past it: the `ROUTE` array's
`goto`/`travel`/`use` directives were tuned against the old walk-through
physics, and at least one of them now runs into real collision (a solid
object it used to pass through, most likely inside a room the route
pathfinds through with a fixed frame budget) and the run ends there — cleanly,
no death, no console errors, just short of where the route data expects it to
get.

**This is exactly the follow-up job NEXT-SESSION.md already named**: delete
`GOAL.blocked`, retune `ROUTE`'s directives for the now-real collision (most
likely the `goto`/`travel` legs need either more frames or an explicit path
around whatever it's snagging on), extend the route through the Switch Room
and Crab Pit block puzzles now that pushing works, and past the Sluicegate.
Also fix `check-playthrough.mjs`'s `GOAL.blocked` message to be conditional on
what the run actually hit, not printed unconditionally — it actively misled
this session's first read of the output. **Not done here**, deliberately: it
is real design/tuning work (retracing 83 directives against genuine collision)
and this session's commit is scoped to the one-line fix plus the re-baseline
it required.

### What this session did NOT touch, on purpose

The health economy, the equip order (conch on B / sword on A from a new
game), `check-playthrough.mjs`'s stale `GOAL.blocked` message, and
`playthrough-route.mjs`'s route data are all unchanged. All are real, all are
next.

---

## THE BOARD — read this, not the archive below

**Somebody has now played it, and the game cannot be finished.**
`tools/check-playthrough.mjs` is new: it drives a new game from the title screen
with real button presses, grants nothing, warps nowhere, sets no flag, and plays
on the three hearts a new game actually starts with. It reaches **d1 0,3,3, the
Locked Stair**, and stops, because the world stops there.

### The blocker, and it is one line that was never written

> `Entity.solid` is never read by anything in the movement path. `canOccupy`
> samples TILES only; `moveEntity` asks nothing else.

The player walks through every push block, chest, torch and signpost in the
game. `Player.tryPush` only fires on a movement HIT, so **no block has ever been
pushed, or can be.** Proved in-engine: a player stood one tile south of a block,
holding `up` for 120 frames, ends up NORTH of it with the block still on its
spawn tile.

**D1 therefore cannot be completed.** Two locked doors stand between a new game
and the Tidewright's Anchor; the two keys that open them are the Crab Pit's and
the Switch Room's, and the Switch Room wants both blocks on both `hold` switches
at once. The hub's fairy — the dungeon's only heal — is behind an identical
pair.

`solve-switches.mjs` reports all nine switch rooms "solvable by pushing" and
`walk-dungeons.mjs` counts the key as available, because **both model a push the
engine cannot perform.** That is the gap between a model and a game, and it is
exactly what no flood in this repo could ever have closed.

### THE NEXT SESSION'S FIRST JOB — make the blocks solid

Five lines in `src/game/entity.js`: after `canOccupy`'s tile loop, reject a
position overlapping a non-dead entity with `solid` set (skip when `airborne`).
**It was tried on this branch and reverted, and the reason matters:** the
recorded baseline MOVES. `d1-descent` diverges at frame 1620 and ends dead on
the overworld; `d2-fork-wrong` diverges at frame 240 and never leaves its first
room. So the job is the fix PLUS re-recording all 51 replays PLUS re-verifying
every checker — and it is worth doing on its own, with nothing else in the
commit, because the playthrough harness's determinism proof rests on that
baseline.

When it is done: delete `GOAL.blocked` from `tools/playthrough-route.mjs`, point
`GOAL.room` at the boss room, and extend the route past the Sluicegate. The
Essence assertions in `check-playthrough.mjs` go live on their own.

### What the harness is, so it is not rebuilt

| File | What it is |
|---|---|
| `tools/check-playthrough.mjs` | The beatability test. 20 assertions. Runs the route, then replays its tape blind and compares to the pixel |
| `tools/playthrough-route.mjs` | The route as data, plus `GOAL` — the furthest point the world allows and the blocker stopping it |
| `tools/actor-runtime.mjs` | The page-side actor, EXTRACTED UNCHANGED from replay.mjs so both share one pathfinder and one swordsman. All 51 replays passing to the pixel is the proof the move was behaviour-preserving |
| `tools/playthroughs/playthrough-d1.json` | The recorded tape. NOT in `tools/replays/` — replay.mjs boots everything in there through `beginReplay(doc.setup, …)` and a playthrough tape has no `setup` |

Four directives are new and are playthrough-only: `newgame` (title screen and
intro, real presses), `use` (press whichever button an ITEM is on), `travel`
(screen-level BFS with learned blocked edges — the route planner), and `loot`
(walk over what the fight dropped).

### Two smaller findings from the same run

- **A new game puts the CONCH on B and the SWORD on A.** The intro gives the
  conch first and `autoEquip` fills B before A. Every replay pins
  `equipB: 'sword'`, so the actor's hardcoded `BIT.b` was always right and would
  have sounded the conch at the first enemy of a real run. Fixed in the actor
  (it reads the slot). Whether the DEFAULT is right is an unanswered design
  question — it is the opposite of the convention the source games set.
- **The health economy is thin.** With drops collected the run reaches the
  Locked Stair on 4 of 12 quarter-hearts. Without collecting them it dies in the
  Tide Gallery. The optional Weeping Wall, one room off the route, kills it.
  Some of that is the actor being a worse player than a human; not all of it.

### THE CONTENT AUDIT — what is actually built, and the four gaps

Done after the harness, by reading the data rather than the notes. Several
things the old prompts list as missing are in fact built; several things nobody
listed as missing are not.

**Built and wired:** all six dungeons (item, essence, boss, boss room,
entrance); all six bosses including Nereth with his tide-pinning phases; the
scrimshaw carving quest and seven placed charms; 17 Pieces of Heart and a
container from every boss; the shop's five lines of stock; the Ferryman's Coin;
the Bottled Tide (a big chest in the Salt Pan Vault, and buyable); 22 talking
NPCs and 29 signs. **The Resonance Rod IS obtainable** — the Maku Tree gives it
at `needEssences: 1`, so the old "nothing states where the Rod is found" note is
stale, as is the one about `boulder` and `abyssPlug` being unplaced.

**Every music track content asks for exists**: abyss, cave, dungeon, dungeon2,
ending, finalBoss, marsh, overworld, reef, salt, shop, village, plus title, boss
and eight jingles.

The four gaps, in the order they cost the player something:

1. **THERE IS NO ABYSSAL SEAL.** The story says five Essences open the road to
   Nereth. There is no essence gate anywhere in the data — no seal tile, no
   five-essence check. The Keep's gate screen (`0,1,0`) is ordinary floor with a
   signpost. Worse, `check-overworld` reports the northern region sealed by
   `dredge`/`dredgePlug` and `0,1,0` is in that set — **the Keep may sit behind
   the Dredge Line, which is found inside it.** That would be a second circular
   gate. NOTHING ON TRUNK CAN SETTLE THIS: the flood is an optimistic upper
   bound and answers no ordering question, and `check-progression.mjs` — named
   in the old prompts' baseline — does not exist. Settle it before extending the
   playthrough past D1.
2. **`makuMaster` never plays.** It is the Maku Tree's five-essence beat, and it
   does two jobs: it grants the **level-3 sword**, which is otherwise
   unobtainable, and it sets `flag: 'makuOpenedKeep'`, which **nothing reads**.
   So the sword never leaves level 1 and the flag meant to open the Keep is
   written by a scene that never runs.
3. **`nerethIntro` never plays.** The final boss has a written introduction and
   it is never triggered. You walk in and fight.
4. ~~**The trading sequence is dead data.**~~ **DONE — P9.5.** It is the
   Coastwise Chain now: eleven traders, eleven objects, terminating at the Maku
   Tree, who takes the Tide Bell's own rope plus one Essence and hands back the
   Resonance Rod. `progress.trade` is read and advanced, there is a `trader`
   entity type, and `tools/check-trade.mjs` plays the whole thing in-engine.
   See `docs/TRADING.md` and the P9.5 section at the top of this file. (The
   `tradeKettle` cutscene is the one piece NOT used — the kettle is handed over
   by a trader like everything else, and a cutscene for it would stop the game
   dead in the middle of a conversation.)

**Three sounds are silently missing.** `Audio.sfx` is `if (!d) return;`, so an
unknown name is a no-op with no error and no warning — which is why nothing has
ever caught these. `swim` (player.js, every time you swim), `hookshot`
(items.js, the Dredge Line's cast) and `rumble` (items.js plus two tile
transforms, hauling a boulder or an abyss plug) are all called and none is
defined in `src/data/audio.js`. Five spare dialogue lines (`child1`, `elder1`,
`shopkeeper2`, `signCoast`, `villager3`) are unreferenced ON PURPOSE — story.js
labels them spares — and are not bugs.

**There is no deployment.** No CI, no GitHub Actions workflow, no Pages setup.
The playable artefact is `dist/oracle-of-tides.html`, committed, which runs from
a `file://` URL. "Live" does not exist yet.

### What this did NOT do

Jobs 2, 3 and 4 from the prompt (the three unplaced enemies, the ART-BACKLOG
legibility findings, the ledge families) are untouched. PT step 5 is untouched.
So is extending the playthrough to D2-D6 — there is no point until a new game
can leave D1.

**Note on the prompt that started this session:** it described a baseline that
does not match trunk. `tools/check-progression.mjs` does not exist; P9 is not
done; `walk-dungeons.mjs` is 23/23, not 29/29. The archive below is accurate and
the board above is the state.

---

## What this session did (music track structure, not the D1 blocker)

**This session did NOT touch the solid-entity blocker above.** It worked
`src/data/audio.js` only: `boss`, `village`, `cave`, `title`, `dungeon`,
`shop` and `salt` were single- or double-pattern loops (a 3.2s-25s loop on
tracks that play under the longest fights and in the most-revisited room).
Each now has a new `B` and/or bridge `C` pattern and plays `['A','B','A','C']`,
every new pattern using all four channels (p1/p2/wav/noi), even where the
bridge thins the texture on purpose. `overworld`, `dungeon2`, `finalBoss`,
`reef`, `marsh`, `salt`(was 2, now 3), `abyss`, `ending` already had 3+
patterns and were **not** touched. The six-note jingles (`fanfare`,
`fanfareShort`, `essence`, `bossClear`, `gameOver`, `itemGet`, `secret`,
`heartPiece` — the file actually has eight `loop: false` one-shots, not six;
worth checking which the prompt meant if it matters) were **not** touched.

`finalBoss` was named as a priority target in the prompt but already had
`order: ['A','A','B','A','C']` with three patterns — it already meets the
A-B-A-C-with-bridge bar, so nothing was changed there. Worth a human
double-check that this wasn't supposed to mean something else (a fourth
section? a longer bridge?).

New: `tools/check-music.mjs`, added to the CLAUDE.md verification table. It
proves every track's `order` resolves, every melodic hold (`-`) follows an
actual sounding note (the closest a monophonic per-row format has to
"overlapping notes"), every note's frequency is inside real Game Boy hardware
range for its channel (pulse floor 64 Hz, wave floor 32 Hz — this is *not*
`measured` against a reference, it is derived from the documented GB APU
frequency-register formula, `131072/(2048-x)` for pulse and half that for
wave), and the noise channel never carries a pitched note. All 22 tracks and
55 SFX defs pass.

**Also fixed, incidentally:** `tools/test.mjs` had no Chromium
executablePath fallback for a Playwright/browser-build version mismatch that
`check-build.mjs` already handled; without it `test.mjs` could not launch at
all in this environment. Same fallback pattern, copied over. `test.mjs` now
passes 57/58 — the one "failure" is the browser's own automatic
`/favicon.ico` request 404ing against the dev server, confirmed pre-existing
and unrelated to this change (reproduces on `main` too, once the fallback
lets the harness run at all).

**What was not verified: whether any of this sounds good.** Nothing in this
repo can hear. `check-music.mjs` proves structure, not taste — listen to the
new patterns (files sent alongside this commit) before trusting them.

**Follow-up in the same session: asked to make an overworld theme literally
the Hyrule/Oracle theme.** Refused the literal transcription — reproducing
the actual Oracle of Seasons/Ages overworld theme (itself built on Koji
Kondo's copyrighted Zelda material) note-for-note is reproducing someone
else's copyrighted composition, not a stylistic reference, and that holds
regardless of what CLAUDE.md says this project can override for itself.
Landed a compromise the user accepted: `overworld` gained a new pattern
**D**, a "call to adventure" fanfare flourish with **original pitches** that
borrows only the genre-standard GESTURE (repeated call, upward leap, scalar
run to a held high tonic) rather than any specific copyrighted melody.
`order` is now `['A','A','B','C','D']`. If a future session is asked for
this again, the same answer applies — don't transcribe the real Nintendo
theme even "briefly"; a gesture-homage in original pitches is the ceiling.

---

## Where the towns stand (PT), in one line

**PT steps 1-4 are DONE: the block machinery exists, the Subrosia town kit is
extracted, four screens are settlements with three working doors, and the people
standing in them come off the races sheet.** Step 5, the terrain backlog and the
`cliff` family, is untouched and is the whole of what PT has left.

### What the last session did (PT step 4, the peoples of Thalassia)

**`oracle-seasons-nonhuman-races.png` had never been touched and now supplies
fourteen frames** through `tools/rip-races.py` -> `src/data/sprites-races.js`.
The sheet's geometry is not the one any other ripper here uses: the sprite area
is a grid of 16x16 frames on WHITE cell backings laid over the sheet's own
green, at a pitch of 17, so a frame carries **two** background colours and
neither can be sniffed from a corner. Both are flooded inward from the frame's
border — the same argument `quantise_prop` makes in `rip-terrain.py`, and the
reason a colour the sprite encloses survives. The side frames on that sheet face
LEFT and are flipped on the way out.

**Four peoples, and the design is ours.** The sheet supplies four silhouettes;
one hood in four colours is four peoples, which is the source games' own
palette-swap trick and the reason a town on that cartridge is full of faces
without being full of drawings.

| People | Where | Art |
|---|---|---|
| **Salters** | the pans and the working shore | the hood in orange, front/back/side |
| **Kelpers** | the Drowned Wood and the Bogwater | the same hood in green, front/back/side |
| **Brinekin** | Tidewatch and the fishing hamlets | blue-capped seafarers, front/back |
| **Reefkin** | the Coral Reef | speckled and web-footed, three poses |

**The scrimshander and the digger no longer share a face.** That was the named
weakness: `Scrimshander`'s class default was `npc_elder` and so was the digger's
sprite, two characters standing on one screen with one head between them. She is
Brinekin (`npc_brinewife`) and he is a Salter. The Salt Pans elder, the bog
witch and both reef NPCs also moved onto their own peoples, and four new lines
in `story.js` let them complain about each other, which is how a people gets
said out loud without a lore dump.

**`NPC.frames` had never been used by anything.** The directional table has been
in `game/objects.js` since the entity was written, and every townsperson in the
game faced the camera whichever way they walked. The hooded peoples declare
`down`/`up`/`side`; the Brinekin declare only the two the sheet actually draws,
because a missing direction falls back to `down` and inventing the third would
be drawing, not extracting.

**`check-towns.mjs` grew a sixth clause and it earned itself immediately.** An
NPC is SOLID, and the geometry rule that cost four layouts never cared what was
standing in the corridor. The new pass takes each walkable tile out, re-floods,
and calls it a CUT TILE if a way in or a door goes unreachable — then fails a
stationary entity standing on one. On its first run it failed against content
that had already shipped: **the coast child on Village Shore stood on 5,2, the
only row that crosses that screen, at all three tide levels**, and the Sandpiper
Row signpost stood in its top corridor. Both were moved. A wanderer cannot be
proved this way and is not pretended to be — it is printed as a note, and
`PINCH=1 node tools/check-towns.mjs` prints every town's cut tiles for whoever
is placing the next townsperson.

**The trap that decided how Tidewatch got its Brinekin.** `nextId` in
`src/game/entity.js` is one global counter and `every(e, n)` phases an entity off
its id, so **an entity added to the STARTING room re-phases every enemy in the
game.** One extra villager in Tidewatch made the `d1-descent` actor walk into a
hit it used to dodge, die three rooms later and finish the run on the overworld.
So Tidewatch's Brinekin is a RE-DRESSED villager, not a new one — the entity
count of the starting room is unchanged, and all 51 replays pass untouched. The
three towns no replay walks through did get new people.

**Seen on screen.** `tools/shots/room-overworld_{4_7,4_8,5_8,9_8}-tide1-px80.png`.
The square now has a blue-capped Brinekin, an orange Salter digging by the trees
and the red-kerchiefed scrimshander in the corner, and no two of them are the
same drawing.

### What is weak about the peoples

- **Nobody walks two frames.** Every direction is ONE frame; the sheet's second
  walk frames were not identified confidently enough to take, so a townsperson
  turns but does not stride. The frames are on the sheet — a later session that
  wants them should re-run the component dump described in the ripper's header.
- **The Brinekin have no side view**, so they face the camera when they walk
  east or west. That is the sheet's limit, and inventing one would be drawing.
- **The Maku Tree and the Great Fairy are still hand-drawn** while that sheet
  carries both of them at full size. `npc_maku` is a 16x16 impression of a
  32x32 object, which is the exact complaint the tree had.
- **Nobody has talked to any of them.** The new lines are proved by `validate`
  and by nothing else.

### What the last session did (PT, towns and buildings)

**A BUILDING IS NOT A TILE, and now the engine agrees.** `registerBlocks` in
`src/world/tileset.js` plus `Room.expandBlocks` in `src/world/room.js`: a block
is registered once as its grid of cell tiles, and a room grid places it as a
RECTANGLE OF ONE LEGEND CHARACTER —

```
'gjjjgHHHgg'     one house and one shop, not eighteen tiles that
'gjjjgHHHgg'     happen to line up
'gjjjgHHHgg'
```

The expansion claims each rectangle top-left-first, so six H's in a row are two
shops rather than an ambiguity, and a footprint that is not exactly the block's
size THROWS with the room's key. Nothing downstream knows blocks exist: the
cells are ordinary tiles with ordinary flags, so collision, the tide field and
every checker are untouched. **The tree's `quad:` machinery that the brief said
to generalise was never on trunk** — `QUADS` in the ripper is empty and no
engine code reads a `quad` field. Blocks replace it and cover the 2x2 tree case
if a session ever wants it.

**The kit is extracted whole off `oracle-seasons-tileset-subrosia.png`** by the
`TOWN` table in `tools/rip-terrain.py`: the blue SHOP, a green house, a red
house, a shuttered house, the 2x2 well, the 3x2 stump, the paling fence,
barrels and two crate stacks. 10 blocks, 51 cells, in two ground variants each.
Three things about the extraction a later session will need:

- **It installs its palettes**, unlike every other pick in that tool. Those
  keep the palette their tiledef already binds because the game has been
  drawing grass for its whole life; a roof has never been drawn at all, so
  there is no palette to preserve and the cartridge's colours are the point.
  Six palettes, and cells within one building name different ones — a roof is
  roof-coloured and a front is timber, which is how the source draws them.
- **Transparency is flooded from the BLOCK's border, not the cell's.** A roof's
  rounded corner has to show the region's own grass, and on the green house the
  roof's yellow trim is the same yellow as the dirt behind it — so colour
  equality would punch holes in the trim and a per-cell flood would let the sky
  in between two roofs.
- **Two coordinates in `assets/sheets/README.md` were wrong** and are corrected
  there: the stump is 3 cells at c7-c9 r10-r11, and the spring band's fence is
  the wooden paling at c11 r11-r12 (the r32 picket is the winter band's).

**Four screens are towns**, all in `src/data/overworld.js`, all proved by
`tools/check-towns.mjs` (54 assertions):

| Screen | What is on it |
|---|---|
| `0,4,7` Tidewatch Village | The square: the SHOP, a house you can enter, the Maku Tree's hollow in the treeline, crates and barrels. Three doors |
| `0,4,8` Village Shore | The net-mender's cottage, the well, the tide pool that was already there |
| `0,5,8` Driftwood Strand | The timber yard: the chopping stump and a fence. No doors — a settlement is not only its houses |
| `0,9,8` Sandpiper Row | The Shallows' fishing hamlet, on SAND variants: one cottage open, one shuttered |

Three new one-room interiors (`houseHearth`, `houseNets`, `houseSandpiper`)
with people in them, and the shop's and Maku's return warps moved to the doors'
new positions.

**`tools/check-towns.mjs` earned itself on its first run, nine failures deep**,
and the load-bearing one is that **its flood is ON FOOT**. Written with the
overworld checker's flood — which grants swimming, because the player
eventually owns the Cleats — three of the four towns passed while being severed
at HIGH by a tide pool. Adding `F.DEEP` to the impassable mask turned them all
red. It also proves each door is a warp and each warp is a door, that every
interior warps back onto ground that is not the doorway itself, and that no
entity is standing inside a building.

**The geometry rule that cost four layouts:** a 10x8 screen holding two 3x3
buildings has exactly ONE row left that crosses it. A 2x2 well or a 3x2 stump
dropped in that row severs the screen — usually only at HIGH, where the tide
has already closed the other way round. Only 1x1 dressing goes in the road; the
well and the stump live on screens with one building. Village East (`0,5,7`) was
reverted for the same reason: its one-way ledge run leaves it a single corridor,
and nothing three tiles wide fits in it.

**Two things outside the towns had to change:**

- **`check-overworld.mjs` reads tile NAMES now, not legend characters.** A
  character used to be enough — one character, one tile, anywhere. Nine H's are
  nine different tiles, and `getTileDef('block:bShop')` returns the empty tile
  whose flags are 0, so the flood walked straight through the shop and reported
  17/17. It builds every screen and reads `room.baseName`. **Any tool that
  resolves `def.map[y][x]` through a legend has the same hole.**
- **A new game started in an alley.** `progress.pos` was 72,64, which the
  rebuilt square turned into the gap between two buildings; three movement
  probes in `test.mjs` failed honestly. The start is 72,72 now — the middle of
  the square, facing the shopfront — and the probes moved with it.

**Seen on screen, and for once it is all good news.** `tools/shots/room-
overworld_{4_7,4_8,5_8,9_8}-tide1-px80.png`, and 4,7 at all three levels. The
village reads as a village at a glance: a red house and a blue SHOP either side
of a square, a dark doorway in each front, the Maku hollow as one opening in
the treeline (three framed cave mouths in a row read as holes in the grass —
that was the first cut). The well, the stump and the paling fence all read as
what they are.

**`village-shop-door`** is a new replay: stand in the square, walk north into
the middle cell of the shopfront, come out again. `roomChanges: 2` is the
assertion with teeth — the door fires once each way and the return does not
bounce back through it. `village-walk` was re-recorded for the rebuilt square
(704 frames); its counts are not comparable with the pre-town recording,
because the world moved rather than the movement.

### What is weak about the towns

- **Tidewatch does not answer the tide.** There is no tide tile in the square,
  so the village looks identical at LOW, MID and HIGH. The Shore has the pool
  and Sandpiper has its bars; the village itself is a dry screen in a game
  about water, and a slipway or a flooding gutter along one edge is the obvious
  fix. It was left out because every candidate placement severed the square.
- **Nobody has walked a town.** The door is proved in-engine by one replay; the
  other two doors, the fence, the stump and every route are a checker's word.
- **Four buildings, one plan.** The green, red and shuttered houses are the
  same 3x3 with a different roof colour and a different middle cell. That is
  what the sheet gives, and it means a town is legible but not varied.
- **Step 4 is done** — see the session above. What is left of that sheet is the
  Maku Tree, the Great Fairy, the Gorons and several more Zora and Tokay poses.
- **Five ground variants are registered and unplaced** (`bShopSand`,
  `bHouseGreenSand`, `bHouseShut`, `bWellSand`, `bStumpSand`).
  `check-towns.mjs` prints them as a note rather than failing: a variant is a
  ground, not a building, and requiring a sandy shop before there is a sandy
  town that wants one is a checker commissioning content.
- **The town legends are `town` and `townDunes` only.** A marsh, cliff or salt
  settlement needs a third ground variant and a third legend; the pattern is
  two lines in `tiles-core.js` (`TOWN_GROUNDS`) and two in `legends.js`.

---

## The prompt to paste — PT step 5, the terrain backlog

This is the next session. PT steps 1-4 are done and written up above; step 5 is
all that is left of PT, and P9 is what PT was blocking. The general-purpose
block further down this file is still accurate for anything else.

**Step 5 is started, and the expensive half of the cliff job is already paid
for.** `caveMouth` is extracted (the Subrosia tileset at 176,1632 — the
hand-drawn one was a frame with a hole in it, which is why Tidewatch's first
layout read as holes in the grass). The CLIFF SURVEY is done and written up in
`docs/ART-BACKLOG.md`: the source is `oracle-ages-overworld.png` at phase
(2, 8), every piece of a complete family has its cell coordinates listed, and
the one thing left is a DESIGN decision the survey cannot make — the Ages cliff
is a plateau edge seen from above and this game's cliff is a wall seen from the
front. The backlog recommends autotiling the tiles the game already has, because
it changes no flags and re-authors no screens. **Read that entry before opening
a sheet.** `palm` is surveyed too and is 32x32 like every Oracle tree, so it is
a block-and-re-author job rather than a swap.

```
Finish PT step 5, the terrain backlog. The `cliff` family is the whole of the
difficulty and THE SURVEY FOR IT IS ALREADY DONE — docs/ART-BACKLOG.md has the
sheet, the phase, the cell coordinates of a complete family, and the design
decision that is all that is left. Read that entry first; do not re-survey a
sheet somebody already read.

`main` is trunk. Branch from it. One prompt = one session = one branch.
Run `git ls-remote --heads origin` before you start and look for a branch that
has already done this.

READ, IN THIS ORDER:
  CLAUDE.md               the hard rules, including "if a sheet has it, extract
                          it" and the traps list. They are hard rules.
  docs/ART-DIRECTION.md   binding for anything visual. Rule 1 is EXTRACT, NOT
                          DRAW.
  docs/ART-BACKLOG.md     the ranked list. "Carried over from NEXT-SESSION" at
                          the bottom is step 5's actual scope.
  docs/briefs/AGENTS.md   section J is the extraction workflow.
  assets/sheets/README.md which sheet has what, and which are still untouched.
  docs/HANDOFF.md         environment setup FIRST, then the hard-won lessons.

ENVIRONMENT, BEFORE ANYTHING ELSE. Playwright asks for a browser revision the
pre-installed Chromium does not match, so every headless harness dies with
"Executable doesn't exist" until you shim it. Exact commands are in HANDOFF
under "Environment setup a fresh container needs". `pip install pillow` before
any rip-*.py tool will run.

WHY THE CLIFF IS NOT A SWAP, and this is the whole job. The Oracles build a
cliff out of SEVERAL tiles — a face, a top edge, two outside corners, two
inside corners, and the stair — and this game spends ONE tile on all of it. So
extracting a cliff face is not enough: every screen that currently draws a
cliff has to be re-authored to say which PART of a cliff each of its tiles is,
or the new art will look worse than the impression it replaces. Decide the tile
vocabulary FIRST, on paper, then extract to it. `node tools/preview.mjs --tiles
--scale=2` shows what the game currently has.

THE ORDER docs/ART-BACKLOG.md ranks it in:
  1. the `cliff` family — one extraction covers eight tiles, cliffs are on most
     screens, and it is a content decision rather than a swap;
  2. the `ledge` families — four directions, nine palette variants each;
  3. `palm`, `pot`, `sign`, `dBlock`, `dStairs`, `spikes`, `caveMouth`;
  4. water is BLOCKED and should not be attempted — every terrain sheet in the
     repo is an assembled static map, so there is no second animation frame to
     extract. It needs a sheet that has one.

CONSTRAINTS, and the first has cost a session before.
  - A CLIFF IS SOLID AND SOLID TILES SEVER SCREENS. Run node tools/validate.mjs,
    node tools/check-overworld.mjs and node tools/check-towns.mjs after EVERY
    screen you re-author, not at the end of a batch.
  - EXTRACTION LANDS IN A GENERATED FILE. Add the cell to the ripper's
    coordinate map and re-emit. Removing something means removing its entry and
    re-emitting, not deleting lines from the output. Run every ripper once
    before you change anything to confirm each still reproduces byte-identically.
  - A TILEDEF FIELD THE REGISTRAR DOES NOT NAME IS DISCARDED. `registerTiles`
    in src/world/tileset.js copies field by field.
  - DO NOT ADD AN ENTITY TO A ROOM A REPLAY WALKS THROUGH. `nextId` is one
    global counter and `every(e, n)` phases enemies off it, so one new NPC in
    the starting room re-phases every enemy in the game. Re-dress an existing
    one instead. See HANDOFF, hard-won lessons.
  - SCREENSHOT EVERY SCREEN YOU FINISH AND LOOK AT IT.
    `node tools/shoot-rooms.mjs --tide=1 --px=80 overworld,4,7` writes a real
    in-game frame in the real palette; `tools/preview.mjs` renders one palette
    and proves silhouette only. Every terrain fault this project has hit
    validated clean and previewed fine.

BASELINE — confirm it before changing anything and keep every line green.
THE CHECKERS TAKE A WHILE. Run them; do not reason about correctness instead.

  node tools/validate.mjs           clean (two expected fx_slash warnings)
  node tools/test.mjs               58/58
  node tools/replay.mjs             51/51, eleven replays to the pixel
  node tools/walk-dungeons.mjs      23/23 over six dungeons
  node tools/check-overworld.mjs    17/17
  node tools/check-gates.mjs        15/15
  node tools/check-towns.mjs        58/58   <- PINCH=1 prints each town's cuts
  node tools/check-items.mjs        82/82
  node tools/check-charms.mjs       63/63
  node tools/check-anchor.mjs       14/14
  node tools/check-lens.mjs         24/24
  node tools/check-cleats.mjs       15/15
  node tools/check-bellows.mjs      60/60
  node tools/check-reefseed.mjs     87/87
  node tools/check-dredge.mjs       103/103
  node tools/check-motion.mjs       8/8
  node tools/solve-switches.mjs     9 switch rooms, one push per block
  node tools/scan-sprites.mjs --strict   0 hard findings
  python3 tools/rip-terrain.py      regenerates tiles-terrain.js BYTE-IDENTICAL.
                                    Same for rip-hud.py, rip-dungeon-themes.py
                                    and rip-races.py. If one does not, someone
                                    hand-edited a generated file.
  npm run build && node tools/check-build.mjs

EVERY SESSION ENDS BY RUNNING `npm run build` AND COMMITTING
dist/oracle-of-tides.html. That file is the playable game. A commit that changes
src/ and leaves the build stale ships a game that is not the game.

Update docs/NEXT-SESSION.md losslessly before you finish, and record any
surprise in docs/HANDOFF.md under hard-won lessons.

Do the work yourself rather than spawning subagents — past sessions hit usage
limits that way and lost the work.

Tell me plainly what is done, what is weak, and what you skipped.
```

---

## Where P8 stands, in one line

**P8 IS COMPLETE. All six dungeons are done and compliant, the six-versus-eight
consolidation is done, and P9 may start.** Do not re-author a finished dungeon.

### What P9 inherits, and the four things it should look at first

1. **NOBODY HAS PLAYED ANY OF IT.** Six dungeons, six different fixtures, and
   every claim on the board is a checker's. No session has compared them, so
   nobody knows whether the difficulty curve across the six goes the right way,
   or at all. This is the largest open item in the project and it is the one
   thing no tool in the repo can close.
2. **Three enemies are registered and unplaced** after the fold: `thalassor`,
   `saltwraith` and `gustharpy`. Hand-drawn art sitting in the shipped build
   that nothing in the world draws. Either place them or take them out with
   their sprites — and if you take them out, remove the cell from the ripper's
   map and re-emit rather than editing the generated file.
3. **The overworld is still gated for eight dungeons.** P9's own brief is the
   re-gate; the fold means the Salt Pans and the Reef Palace are now one-room
   ruins rather than dungeon approaches, so the routing through those two
   regions wants a second look.
4. **`docs/ART-BACKLOG.md` has four legibility findings** from D2, D3 and D4,
   all the same shape: the mechanic is legible when it works and silent when it
   does not. D5's bole and D6's lintel are the two that got this right and they
   are the argument for how to fix the others — when the answer wants to be a
   shade of water, reach for a whole tile of art instead.

### What the last session did (P8/D6, the Abyssal Keep and the Dredge Line)

**D6 is re-authored around the Dredge Line, it is the last dungeon, and the same
session did the consolidation.** 26 rooms over two floors, the line at room 13,
three crossings, three caches, `tools/check-dredge.mjs` (103 assertions) and the
`d6-mooring` replay. The dungeon's header comment in `src/data/dungeons-b.js`
states the primitive once and builds the rooms out of it.

**The finding that decided the design, and it is the one the whole game had been
building toward.** The player of the sixth dungeon owns the Cleats, so deep
water is a road and no sea level is a wall. A barrier in the Keep has to be a
PIT — the only thing left that neither Cleat mode crosses and no conch fills. So
every crossing here is a shaft, and what gets you over one is a mooring ring the
line hauls you to.

> THE LINE CROSSES WHAT THE SEA UNCOVERS, AND THE FLOOR GIVES UP ONLY WHAT THE
> SEA COVERS.

**One engine change carries the whole dungeon.** `ITEMS.dredge.use` refuses
while `inDeep || underwater`, on exactly the grounds the Bellows and the
Reefseed refuse — a weighted line is thrown from your heels. Without it the
answer to every mooring is to swim into the middle of the shaft and cast from
there, and no arrangement of ground can be made to matter.

**Two crossing shapes, so three rooms are not one idea three times.** The
DROWNED STAND is worked at LOW (`3`/`dWell` is wading depth at LOW and over your
head above it, so the ground you brace on is the tide decision). The SUNKEN BAR
is worked at HIGH (`7`/`dLintel` is new: the Keep's own masonry across a shaft,
stone until HIGH covers it, and a cast stops dead on `F.SOLID`). They are exact
opposites, and **the Crossed Shafts** — 2x1, the Boss Key — is the only room
holding both: in at HIGH, on at LOW, and you cannot hold two seas.

**The tide theme, and it is the only one of the six that wants the water ON.**
`DredgeLine.dragBack` searches a tile the weight passed over only if that tile
carries `F.WET | F.SLOW` at the level it resolves at. `6`/`dSilt` is new — one
extracted art in two palettes, bleached on the dry pan and blue once the sea is
over it — so **the floor gives up what it is holding only while the sea is on
it.** Every room past the item is therefore a crossing at one sea and a cache at
another, and the order cannot be reversed.

**`tools/check-dredge.mjs` proves eleven things and it earned itself**, unlike
`check-lens.mjs`, failing four on its first run. The load-bearing clause is "no
other sea crosses it", and getting it right took two attempts — see HANDOFF.
Every closure clause is proved TWICE, once at the line's reach and once at the
Coilrope's, because the charm that lengthens the line is hand-placed in this
dungeon and the second pass is what caught a cache one tile inside it.

**Seen on screen, and it is good news for the second dungeon running.**
`tools/shots/room-d6_1_2_3-tide1-px80.png` and `-tide2-` are the same room one
conch apart: at MID a slab of grey masonry stands in the shaft, at HIGH it is a
square of open water, and nothing else in the room has moved. A whole tile of
art appearing and disappearing, the way D5's bole does. That is the first time a
CROSSING mechanic in this project has been legible in a still frame.

**Four things changed outside D6:**

- **`walk-dungeons.mjs` can cast**, from the dungeon that hands the line over.
  A post within reach with nothing solid in front of it makes the tile before it
  passable. Without it the Keep's whole upper floor reads as stranded.
- **`walk-dungeons.mjs` counts a `buried` key.** `room.buried` was invisible to
  every sweep in that file and the Keep's fourth Small Key lives in it, so the
  dungeon was walked believing it had three keys for four locks.
- **`essenceCount()` is new in `src/world/maps.js`.** The HUD, the quest screen
  and the save slots all hard-coded `/8` against a plan that has always said
  six.
- **`dPostAbyss`** puts the shared mooring post over the Keep's own floor. The
  shared `dPost` names the BRICK floor in its `underArt`, so every post in an
  abyss room had been drawing another dungeon's flagstones round its own feet.

### The consolidation, and how it was settled

`docs/ITEMS.md`'s primary roster gives D6 as the Abyssal Keep holding the Dredge
Line, and CLAUDE.md says content disagreeing with that file is wrong. So `d6` IS
the Abyssal Keep. `d7` and `d8` are gone from the data; the Reef Palace and the
Salt Pan Vault are one-room ruins on the overworld, each keeping the item its
dungeon used to hand over — the Bottled Tide case in the Vault, and the Mermaid
Suit moved into the Keep behind its miniboss. The Brinehulk was given a new home
keeping the Boss Key. The story counts to six now instead of eight. Full table
in `docs/DUNGEON-STATUS.md`.

### What is weak about D6

- **Three crossings, two shapes.** Two shelf crossings on different axes and one
  lintel, with the Crossed Shafts composing both. One shape more than D5 had and
  still not four.
- **The cache marker reads better dry than wet.** The ring is visible at both
  seas, which is right, but it is clearer at the sea where it does nothing. What
  actually tells the player is the whole pan turning blue.
- **Nothing makes the player walk into the teaching room.** The Slack Water is
  one room east of the vault and holds only a Piece of Heart.
- **Nobody has played it.** One crossing and one cache are proved in-engine by
  the replay. The rest are a checker's word.

**`docs/DUNGEON-STATUS.md` is the board and it is what a dungeon session opens
first.** Every dungeon with its status and the commit it landed in, the
checklist that defines "done", and each outstanding dungeon written out as a
to-do with the problem it has to solve. Tick it before you finish — a dungeon
session that leaves that file unchanged has not reported its work. It also
carries the reason it exists: D2 was finished on a branch that was never merged,
so trunk said "outstanding" for a dungeon that was done and it was nearly built
twice. **Run `git ls-remote --heads origin` before you start.**

### What the session before that did (P8/D5, the Drowned Wood Shrine and the Reefseed)

**D5 is re-authored around the Reefseed, and the hard part was that the item
cannot open a path at all.** 24 rooms, one floor, the Reefseed at room 14, five
groves, `tools/check-reefseed.mjs` (87 assertions) and the `d5-overthrow`
replay. The dungeon's header comment in `src/data/dungeons-b.js` states the
primitive once and builds five rooms out of it.

**The finding that decided the whole design, and it took most of the session.**
`Reefseed.canPlant` refuses SOLID, PIT and VOID at EVERY tide level, not merely
the current one. So a pillar may only be grown where the player could already
stand or already swim: the item can never make a route, only close one or dry
one. What is left are the two things nothing else in the game does —

> A PILLAR IS GROUND AT LOW AND AT LOW ALONE, AND YOU CANNOT PLANT A STAKE FROM
> THE WATER.

The second half is one new guard in `ITEMS.reefseed.use`, refusing while
`inDeep || underwater` on the same grounds the Squall Bellows refuse. It is what
makes throwing range mean anything: a seed carries **exactly two tiles**, so a
stake more than two tiles from dry footing can only be planted from another
stake.

**The fixture, and it is a straight line.** `bank — bole — STAKE — snarl`.
`dSnag` is a drowned tree: solid at LOW and MID, open water at HIGH, and
`room.solidAt` refuses a SOLID tile to a thrown seed exactly as it does to a
walking body — so the throw only clears it at HIGH, and the pillar it leaves is
only ground at LOW. `dSnarl` is a kelp snarl whose ONLY transform is `cut`;
`Player.startSwing` returns early while `inDeep`, so a swimmer beside one cannot
touch it and a bomb finds nothing to break. The stake is the only dry square
next to it.

**Why the line matters, and this is the geometry a later session will break.**
A bole or a snarl two tiles from a standable tile does not block a seed, it
CATCHES one — the seed flies over the square between and is stopped by the
solid, planting on the square between. So the two solids must be opposite each
other across the stake, with water on one perpendicular side (how you reach the
stake at LOW) and a `0` sump on the other (neither standable nor plantable, so a
stray seed can do nothing with it). Any other arrangement gives the room a
second answer, and `check-reefseed.mjs`'s closure clause is what says so.

**A structural dead end, so nobody spends a session on it twice.** The groves
were first designed as push-block crossings — a block cannot enter deep water,
so a pillar is the only road across, and the tide decides whether the road is
there. It cannot be made to work. The player pushing a block INTO a stake is
always standing exactly two tiles from that stake with a non-solid square (the
block's own tile) between them, so they can always throw the seed from the same
square they push from and the room falls to a fixed LOW. There is no arrangement
that fixes it.

**`tools/check-reefseed.mjs` proves ten things**, and two of them are new in
kind. The load-bearing one is that **LOW does not build the room**: fix the sea
at LOW, plant every seed that can be thrown from dry footing the player can
reach, do it again with those pillars in place, and keep going up to
`REEFSEED_CAPACITY` — every landing, not only the declared stakes, because a
pillar on an ordinary square of water is somewhere new to stand and can be the
solid a later seed is caught against. The other is that **nothing the player can
build can brick the room**: a pillar is permanent and SOLID at MID, so for every
tile a seed can come to rest on, a pillar there must leave the room's doorways
joined at SOME sea. That is CLAUDE.md's "a solid tile can strand a room" trap
with the player holding the trowel, and no other tool in the repo can see it.

**Three things changed outside D5:**

- **`progress.giveItem` now stocks a counted item.** The rule that a Reefseed, a
  bomb or a bottle arrives with something in it lived inside `Game.openChest`
  and nowhere else, so a giver, a cutscene or a harness handed over a working
  inventory entry attached to an empty pouch. The replay is what found it: a run
  that threw a seed which did not exist, recorded perfectly deterministically,
  with every checker green.
- **`walk-dungeons.mjs` knows a snarl is a door**, the same exemption a puzzle
  door and a wheel door already had. Without it two thirds of d5 is stranded.
- **`replay.mjs` spans carry `probeNames`** — what the probe TILES currently
  are. `d5-overthrow` exists to check the prover's reproduction of the seed's
  flight against the engine's own, and the only evidence that settles it is the
  name of the tile the seed came down on. It reads `coralPillar|dSnarl`.

**Seen on screen, and for once it is good news.** The bole is a whole tile of
art that appears and disappears: a tree at LOW and MID, open water at HIGH, and
in the Standing Grove at 3,5 there are two 2x2 stands of them doing it before
anything depends on it. Unmissable in a still frame, which is the first time in
four dungeons that the mechanic has been legible at all — D2's three blues, D3's
invisible torrents and D4's silent failing drain were all the same complaint.
The argument to carry into D6: when the answer wants to be a shade of water,
reach for a whole tile instead.

### What is weak about D5

- **Five groves, one fixture.** Four orientations of the line and one double,
  and the geometry above is why. Honest, and still repetitive.
- **The snarl is a bush** — the extracted bush in the dark-oak palette. It reads
  correctly as "cut this" and identically to every bush a bomb DOES open.
- **The replay does not cut a snarl.** A replay's equipment is fixed in its
  setup and the grove wants the Reefseed, the conch and the sword in two slots.
  It proves the throw and the sea; `check-items.mjs` owns the swing.
- **Nobody has played it.** One grove is proved in-engine. Four are a checker's.

### What the last session did (P8/D4, the Cliffside Cistern and the Squall Bellows)

**D4 is re-authored around the Bellows, and the hard part was that the item
takes your feet.** 24 rooms, one floor, the Bellows at room 12, five sill rooms
holding six wheels, `tools/check-bellows.mjs` (60 assertions) and the
`d4-drowned-sill` replay. The constraint table is in `docs/EXECUTION-PLAN.md`
under "P8 status", and the dungeon's header comment in `src/data/dungeons-a.js`
states the primitive once and builds five rooms out of it.

**The problem, because D5 and D6 will each have their own version of it.** The
Anchor did not FIT. The Lens could not be REQUIRED. The Cleats gated nothing.
The Bellows' problem is that the cone lasts exactly as long as the button is
down and `Player.updateBellows` returns before the mover runs — so a room you
cross by holding the button and walking is not a Bellows room. What the cone
opens has to be used by something that is not you:

> a drowned wheel does not turn, and the only thing that takes the water off one
> is the gust that has to turn it.

`GustWheel.drowned` is four new lines: a wheel standing in deep water loses its
turns rather than banking them, so pumping at it under water for long enough
cannot open it. The cone's `delta: -1` is what un-drowns it, and the cone is
also what turns it, and you cannot walk into it to check.

**Two shapes, so that five sills are not one idea five times.** The SUMP SHELF
is worked at MID (`0` is a pit at LOW and deep above; `3` is shallow at LOW and
drowned above), the DROWN-WALL SHELF at HIGH (`9` is stone until HIGH covers it;
`1` is dry, wading, drowned). Every wheel sits across a trench of `O` — pits,
not water, because the player of this dungeon owns the Cleats and a moat is a
road. The Crossed Sluices (`0,4,2`) holds one of each and the Boss Key behind
both, so the room is the dungeon's idea said out loud: you cannot hold two seas.

**`tools/check-bellows.mjs` proves seven things per sill**, and reads the cone's
reach out of feel.js: no hand reaches the wheel at any level in any mode; it is
drowned at the sea the room is played at; one level down it is not; **no sea
level frees it anywhere you could stand and pump** (the load-bearing one — drop
it and the answer is "sound the conch to LOW and blow"); the declared stand is
reachable, dry, and has the wheel in its cone; the stand is unreachable at every
level where the wheel is already clear; and every door a wheel opens is a shut
door that separates its room at all three levels. It also sweeps the game for a
wheel outside a declared room.

**One soft lock found by asking what happens if you walk away.** The Gauge's
key and the Boss Key are spawned by room scripts, and a wheel fires once and is
open forever after — so leaving either room without collecting lost the reward
with nothing left that could release another. Both rooms now put it back in
`onEnter`, guarded by a `saveKey` so a collected reward does not return, and
`check-bellows.mjs` fails any sill that `gives` something without an `onEnter`.
Verified live in all four directions.

**Four things changed outside D4:**

- **`Tide.blows` — the cone no longer blows through stone.** `covers` was pure
  geometry, so a sealed wheel could be turned through two walls. Line of sight
  resolves at the BASE level, never through the field, or the call does not
  terminate.
- **`GustWheel` restores its open state from the save.** The flag was written
  from day one and never read.
- **`walk-dungeons.mjs` knows a wheel door (`bellowsRoom.opens`) is passable and
  a wheel payout (`bellowsRoom.gives`) is countable.** A script spawn is
  invisible to every sweep in that tool.
- **`shoot-rooms.mjs --bellows --dir=`** holds the item down through a real key
  event so a cone can be photographed. Setting `player.bellowsHeld` from outside
  survives zero frames — `handleInput` clears it at the top of every frame.

**Seen on screen, and it is half good news.** At MID with the cone open the
wheel's tile goes (38,76,140) -> (70,133,175) while the undrained shaft three
tiles away stays deep: two water levels in one room in one frame, unmissable. At
HIGH the cone is working just as hard and the tile does not change at all,
because `dWell` draws the same tile at MID and HIGH — so pumping at the wrong
sea looks exactly like pumping out of range. The wheel's sprite never says it is
drowned either. Top entry in `docs/ART-BACKLOG.md`.

### What is weak about D4

- **The failing case is invisible.** See above. It is the third dungeon in a row
  whose mechanic is legible when it works and silent when it does not.
- **Six wheels, two shapes.** The Loft and the Gauge are the same sump shelf
  with a different approach; the Sill and the Long Race are the same drown-wall
  shelf on different axes. The Crossed Sluices is the only room that composes
  them, and it is the last one.
- **The Cliff Walk is decoration.** Light enemies over pits is the gust's combat
  verb and nothing in the room requires it, so a player who never blows anything
  into a hole loses nothing.
- **Nobody has played it.** The replay proves the engine agrees with the model
  at one sill. The other five are a checker's word.
- **The trench is always two pits and the stand is always one tile.** That is
  the geometry the cone's reach of 3 forces in a 10-tile room, and it means
  every sill looks like the same fixture. A 2x1 sill room would buy a different
  shape and none of the five is one.

### What the last session did (P8/D3, the Bogwater Sanctum and the Cleats)

**D3 is re-authored around the Cleats' two modes, and the hard part was that
the item gates nothing.** 22 rooms, one floor, the Cleats at room 11, three
torrent rooms, `tools/check-cleats.mjs` (15 assertions) and the `d3-undertow`
replay. The constraint table is in `docs/EXECUTION-PLAN.md` under "P8 status",
and the dungeon's header comment in `src/data/dungeons-a.js` states the torrent
primitive once and builds three rooms out of it.

**The problem, because D4-D6 will each have their own version of it.** The
Anchor did not FIT in a room. The Lens could not be REQUIRED by terrain at all.
The Cleats are required by every deep tile in the game the moment they exist —
so proving "this room needs the Cleats" proves nothing. What is worth proving is
the axis inside the item:

> the surface route does not get there, and the floor route does.

That is provable because the difference between the modes is data:
`Player.updateTerrain` applies a tile's `push` only while `inDeep &&
!underwater`, so comparing the push to `SWIM_SPEED` settles it in arithmetic.
`TORRENT_PUSH` (new, in feel.js, `derived`) is deliberately GREATER than swim
speed; an ordinary riptide at 0.55 px/f is less, which is why the riptides that
already existed could not carry this dungeon — they are a tax on the surface
route, not a barrier. check-cleats asserts that inequality globally before it
looks at a single room.

**`tools/check-cleats.mjs` proves four things per declared room**, and reads
every number out of feel.js: no route without the item; no route on the surface
at any tide level; a route on the floor; and the longest unbroken dive fits
inside `CLEATS_BREATH_FRAMES` at `SINK_SPEED`, printed as a margin (the Kelp
Locks is 14 tiles, 359f of 800, 55%). It also sweeps every room in the game for
a torrent outside a declared room — a current nothing proves a way past.

**Three things changed outside D3:**

- **`walk-dungeons.mjs` can swim** in any dungeon of index 3 or higher, because
  by then the player owns the Cleats. Off for d1/d2, so nothing already proved
  about those two moved. Without it every room past the Sanctum's item read as
  stranded.
- **`Player.updateTerrain` dives on entry** when the soles are already set to
  sink. `cleatMode` had been a flag that `toggleCleats` set, that the item's own
  dialogue promised, and that nothing ever read again.
- **`dTorrentN/S/E/W`** are new tiles built from existing art, and `T`/`t`/`V`/
  `A` are new characters in the shared dungeon legend. They are LETTERS, not
  digits: a digit means a tide tile, and a torrent is deep at every level, which
  is the whole reason no conch answers one.

**Seen on screen, and it is not good news.** `tools/shots/room-d3_0_2_3-tide1-
px80.png`: the Undertow reads as a handsome flooded drain and gives no hint
whatever that the water in it is moving. A torrent is drawn as ordinary deep
water — same art, same palette, same blue — and the only difference is a faster
ripple. In a still it is invisible; in motion it is nearly so; which way it runs
is not signalled at all. **The dungeon's whole mechanic is currently learned by
being swept out of a room once.** Written up as the top entry in
`docs/ART-BACKLOG.md` with what to draw and in what order to try it.

### What is weak about D3

- **The torrent rooms are bare corridors**, for the same reason D1's anchor
  gates were: a niche in the wall of a torrent room is somewhere to stand, and
  somewhere to stand is somewhere the current is not. Lion masks in the walls
  are the whole of the decoration.
- **The three torrent rooms are one idea three times.** Two horizontal channels
  running opposite ways and one long one. The Bogwater Drain's alcove — a thing
  only the floor route ever sees — is the only variation, and it is optional
  content rather than a second idea.
- **Sink mode's other costs are unused.** No sword, no jump, no knockback and
  carrying-things-underwater are all real differences and D3 builds on none of
  them. The carry verb in particular (`dropCarried` fires on the surface and not
  on the floor) is a whole puzzle mechanic nobody has used.
- **The replay proves the surface half hard and the floor half softly.** The
  swim phase is pinned at x=136 by the current, which is the assertion with
  teeth; the sink phase crosses and leaves the room, asserted as
  `roomChanges: 1`.
- **`TORRENT_PUSH` is `derived`, not `measured`.** It is derived from
  SWIM_SPEED, which is itself derived from WALK_SPEED, which is a guess.

## What the last session did (P8/D2, the Coral Spire and the Brineglass Lens)

**D2 is re-authored around the Lens, and the hard part was making an
informational item required at all.** 24 rooms over two floors, the Lens at room
14 of 24, and `tools/check-lens.mjs` is new and proves both forks in five
directions. The constraint-by-constraint table is in `docs/EXECUTION-PLAN.md`
under "P8 status: D2 done", and the dungeon's own header comment in
`src/data/dungeons-a.js` states the fork primitive once and builds two rooms out
of it.

### The problem D2 had to solve, because D3-D6 will each have their own version

The Anchor's problem was geometry. The Lens's problem is that **no arrangement
of terrain is passable with it and impassable without it.** It shows you things;
it cannot move you. So a Lens room is not a gate and must not be built like one
(P9 forbids it, and `docs/ITEMS.md` says so).

What makes it required is that the player has to **commit before the answer
exists**, and three engine features that were sitting unused turned out to be
exactly what that needs:

- **`tideForce: 0`** pins the room to LOW and REFUSES the conch. No room in the
  game had ever declared it. **This is the load-bearing assertion and the one a
  later session will want to drop:** without the pin the player sounds the conch,
  looks at the room one level up with their own eyes, sounds it back, and the
  Lens is a shortcut rather than the answer.
- **A one-way ledge** (`F.LEDGE`, solid from three sides) is the commitment.
- **A TideValve plus `game.forceTideStep()`**, at the BOTTOM of each branch —
  past the point of no return, so turning it can only confirm a choice already
  made. `TideValve` existed; nothing had ever wired its `roomEvent('valve')` to
  anything.

### The primitive, and why it is provable rather than asserted

Three shafts, and at LOW all three are **the same tile** — not three tiles that
resemble each other. `dDrain`'s LOW form, the new `dSump`'s LOW form and a plain
`dPit` all resolve to the tile `dPit`. One level up they are wading depth, a
hole and deep water. `check-lens.mjs` can therefore compare tile NAMES rather
than pixels, and a screenshot confirmed it: all three throats sample to exactly
(14, 15, 34) at LOW.

`src/data/tiles-core.js` gained one tiledef, `dSump: ['dPit','dWaterD','dWaterD']`
— a shaft that fills over your head — and `legends.js` gained the digit `0` for
it. No new art: it composes tiles that already exist.

### `tools/check-lens.mjs` is new, 24 assertions, and it passed first run

Modelled on `check-anchor.mjs`: pure Node, no browser, reaches out of `feel.js`
(`LEDGE_MAX_SPAN`, `GAP_HOP_MAX_SPAN`) rather than written down. Per declared
room it proves the pin; that `reveals` is exactly what a level-1 Lens draws; that
every branch is takeable from the decision tile and NONE leads back to it or
across to another at ANY level; that no branch pays off at the pinned level;
that at least one pays off one level up and at least one does not; that every
branch is the same tile where the player decides and the winner differs from
every loser one level up; and that every losing branch has a way out, so being
wrong is a walk back rather than a soft lock. It also fails if nothing declares
a fork, and if a fork is declared outside D2.

**It did not earn itself the way `check-anchor.mjs` did.** check-anchor failed
all three D1 gates on its first run; this passed 24/24 on its first. That is not
evidence the tool is weak — it was written before the rooms, which is exactly
what the brief asked for, so the rooms were authored against it.

### The two forks

- **`1,4,3` The First Fork** — two shafts, `4` dDrain (fills) and `O` dPit
  (never). The teaching one.
- **`1,2,2` The Sounding Fork** — three, adding `0` dSump: wading depth, a hole,
  and drowning. Guards the Boss Key.

Both are 1x1 **on purpose, and the reasoning is the answer to a question the
brief asked to be decided deliberately**: the whole of the choice is that every
branch is in front of you and none can be told apart, so a fork spread across
two screens would need the Lens because half of it was off camera — the right
requirement for the wrong reason. The two large rooms in D2 are the Reefguard
Hall (`1,4,2`, 2x1) and the Spire Ascent (`1,3,2`, 1x2), where size is the point
and nothing is hidden. The 1x2 is also the first room in the game whose camera
moves on the vertical axis.

### Seen on screen, and the finding is bad news

**The Lens draws three dark blues.** `dWaterS`, `dWaterD` and `dPit` are the
three answers a fork has, and through the ghosted overlay they come out 4-6 RGB
units apart. Measured at three opacities; `LENS_GHOST_ALPHA` went 0.55 -> 0.80,
which is a real improvement and is not the fix — opacity cannot separate three
colours that are already the same colour. The numbers, the command that
reproduces them, and three candidate fixes are in `docs/ART-BACKLOG.md` under
"The Lens shows three dark blues", and the table is repeated beside the constant
in `feel.js`.

Honest state: **water vs no water reads. Shallow vs deep reads weakly**, and
that is exactly the read the Sounding Fork turns on. What genuinely separates
them on screen is texture and motion (ripple lines at rate 11, speckle at 13,
and a pit that does not animate at all), and a screenshot throws all of that
away. **This one wants a person holding the button.** `shoot-rooms.mjs` grew
`--lens` for it.

### The charm-case decision, which could not slip, and did not

`CHARM_LOW_ESSENCES` is 2 and D2 is the second essence, and `checkUnlocks` was
called from `Scrimshander.interact` and nowhere else — so shipping D2 unchanged
meant a real save in which the player owns charms they can never switch on,
having no reason to walk back to Tidewatch. **Settled: the shard opens the
case.** `openCharmCases(progress)` is new in `scrimshaw.js` and is called from
`Game.claimEssence`; the line is held until the essence cutscene lets go. The
scrimshander keeps her line and says it the first time you see her afterwards,
gated on the new `progress.charmTold`. She is the acknowledgement now, not the
gate.

D2 hand-places one charm — **Barnacle Skin in `0,3,3`**, a MID charm, because MID
is the only case the player owns for the whole of this dungeon.
`check-charms.mjs` prints all three hand-placed charms.

### `walk-dungeons.mjs` learned to hop a ledge

Its flood treated `F.LEDGE` as a wall, which was harmless for as long as no
ledge was the only way into anywhere — true of every dungeon until this one. It
reported eight of D2's rooms stranded in a dungeon that walks fine in the
engine. It now models `Player.tryLedgeHop` exactly: into the FACE of the ledge
only, clearing the run behind it, landing on a standable tile. Directional, so
it adds no route back. **If you add a movement verb to the player, add it to the
flood in the same commit.**

### The replay

**`d2-fork-wrong`** (679 frames) takes the WRONG shaft on purpose and proves the
four things a checker cannot: the setup asks for `tide: 1` and the first
checkpoint reads LOW, so the pin holds; the actor hops the east ledge and the
shelf is gone; one press of A on the sluice takes the sea to MID and nothing
else does; and after 80 frames of holding `up` into the shaft it has moved seven
pixels and stopped, because the hole is still a hole. Then it takes the stair,
and `roomChanges: 1` asserts it left the room exactly once and by that route.

### What is weak about it

- **Shallow-vs-deep through the Lens.** See above. It is the weakest thing in
  the dungeon and it is the read the second fork depends on.
- **Both forks are the same primitive**, the way D1's three gates were. The
  second adds a third answer and higher stakes and that is all it adds. D3 will
  need more than "the same idea with an extra branch".
- **`check-lens.mjs` passed first run**, so unlike `check-anchor.mjs` it has
  never caught anything. Its model is only as good as its movement verbs, and it
  has no swimming in it — it asserts every declared fork is in D2, which is what
  will catch the first D3 room that tries.
- **Nobody has played a fork.** The cost of being wrong is a stair back to the
  Upper Landing (fork 1) or to the Spire Ascent (fork 2) — three rooms and two
  rooms of walking. Those are guesses about how much a wrong guess should hurt,
  and nobody has felt either of them.
- **The miniboss is at 71% and the Lens at 58%**, both a shade later than D1's.
  Stated rather than rounded.
- **`walk-dungeons.mjs` does not model `tideForce`.** Its flood grants any tide
  level, so a pinned room reads as freely crossable. That is sound here — the
  valve really does supply MID — but it means the walker cannot tell a pinned
  room that is solvable from one that is not, and `check-lens.mjs` is the only
  thing that can.
- **D2 dropped a switch room.** `solve-switches.mjs` reports 16 rooms, not 17;
  the old `1,4,5` block puzzle is gone with the rooms it lived in.
- **The two removed dungeons are still in the data.** Eight dungeons, six in the
  plan. Neither D1 nor D2 needed the consolidation; D7/D8 folding is still owed.

## What the last session did (P7.6, multi-screen dungeon rooms)

**A dungeon room may now be bigger than one screen, and one room in the game
is.** All seven steps of `docs/briefs/P7.6-PLAN.md` plus both additions from
`docs/briefs/P7.6-PROMPT.md`. Sizes are `1x1`, `2x1`, `1x2`, `2x2`, `3x1`;
anything else throws at construction.

**The single most important thing for a future session is not in this file.**
`docs/EXECUTION-PLAN.md` now has a section in P8 called "ROOM SIZE — everything
a dungeon session needs, in one place": the grid width each size implies, the
anchor-gate arithmetic restated as a sizing rule (what fits in 10 tiles, what
fits in 20, what a 2x2 buys that a 2x1 does not), the pacing number, and the
worked example. A D2-D6 session should read that and nothing else about room
size.

### What actually changed in the engine

- **`Room` gained `sw`/`sh` (screens) and the four derived extents `tw`/`th`
  (tiles) and `pw`/`ph` (pixels).** Every one of the 30 `ROOM_W`/`ROOM_H`/
  `VIEW_W`/`VIEW_H` uses the P7.6 survey found was one of three things, and they
  were separated: the room's tile extent, the room's pixel extent, and the size
  of the window on screen. `VIEW_W`/`VIEW_H` now mean only the third.
- **`src/game/camera.js` is new.** Deadzone, not centring: a box in view space,
  and the camera moves only when Link leaves it, capped at `CAM_MAX_SPEED`. It
  clamps to `[0, room.pw - VIEW_W]`, which is an empty range in a 1x1 room, so
  it is provably a no-op in all 23 of D1's other rooms and in every overworld
  screen. It is never part of the render cache key and never calls
  `invalidate()`. **KeyI** draws the deadzone box, the camera's window position
  in the room, and the room's size.
- **The room render cache is now `pw x ph`** and `drawScene` blits the camera
  window out of it. `cacheKeyFor` is untouched, exactly as P5 left it.
- **`registerMap` throws on a `size` in an overworld room**, and
  `validate.mjs` reports it. Structural, not a comment. `check-overworld.mjs`
  needed no edit at all, which is itself the assertion that the overworld path
  did not move.
- **Cell lookups resolve through an occupancy index** (`roomKeyAt`). A
  multi-screen room owns every cell it spans and only the top-left one has a
  `roomDef`; `validate.mjs` fails if another room is keyed inside the footprint.
- **The minimap draws a multi-screen room as one cell spanning `sw x sh`**, and
  skips the covered cells.
- **`check-anchor.mjs`, `walk-dungeons.mjs` and `find-ledges.mjs` learned
  `room.tw`/`room.th`.** check-anchor still passes 14/14 on the unchanged D1
  rooms. `solve-switches.mjs` needed no change — it works through live `Room`
  objects rather than raw grids.

### The one converted room, and the replay that proves it

**`d1` `0,5,3`, the Clawcrab Den, is 2x1** — eight rows of twenty characters,
owning cells `5,3` and `6,3`. Picked with the tools, not by eye: it is the
dungeon's set piece (the miniboss), it is NOT an anchor gate so nothing
`check-anchor.mjs` proves had to be re-proved, and the cell it grows into has no
neighbours at all, so no facing wall in any other room moved. The reasoning is
in the room's own header comment.

**`d1-clawcrab-den-wide`** (893 frames) walks in from the Two Gauges, crosses to
the far wall and back, and asserts `roomChanges: 1`, `camMaxX: 160`,
`camEndX: 0`, `camMaxY: 0`. The first of those is the real claim: the internal
screen seam is crossed twice and fires nothing, so the one transition in the run
is the actual room boundary. Note that D1 is `scroll: false`, so a transition
there is a warp and a fade rather than a sliding `game.transition` — the harness
counts room-key changes, which is true of both kinds.

`tools/replay.mjs` now records a `span` (transitions fired, camera extremes) and
a plan may carry an `assert` block against it. Existing replays are unaffected:
`diffState` iterates the STORED keys, so new fields in the observed state are
ignored.

### Seen on screen

Shot at both camera clamps and at MID and HIGH with
`tools/shoot-rooms.mjs --px=N --tide=N`, and driven live with the KeyI overlay.
At `cam=0` the west lobe reads as an ordinary room; at `cam=160` the east lobe
is fully drawn with no torn edge; at `cam=88` the window straddles the internal
seam with no artefact at all — no gap, no doubled column. Holding `right` from
the west end, Link crosses the deadzone, the box gives way, and he stays pinned
on its right edge until the camera hits 160 and he walks off the boundary to the
wall. The deadzone at 96x64 felt right rather than merely working; it is still
`guessed` and stays that way. `shoot-rooms.mjs` grew `--px`/`--py`/`--cam` for
this, and its settle went from 8 frames to 30 because a wide room's tide wipe
takes the full `TIDE_SWEEP_FRAMES` to cross the ROOM.

### What is weak about it

- **The deadzone numbers have been watched by nobody but the session that chose
  them.** 96x64 and a 2px cap are one person's taste on one room. `KeyI` exists
  so the next person can argue.
- **Only one room in the game is multi-screen**, so 1x2, 2x2 and 3x1 are proved
  by the constructor and the validator and by nothing that has been walked. The
  vertical camera axis in particular has never moved in a running game — the one
  wide room is one screen tall.
- **A transition between rooms of DIFFERENT sizes has never happened.** The
  entry-position clamp and the global-coordinate seam arithmetic that exist for
  it are reasoned, and reduce provably to the old code when sizes match, but no
  test walks them. The first 1x2 room next to a 1x1 is where that gets exercised.
- **The scroll transition path is untested at width.** Every dungeon is
  `scroll: false`, and the overworld cannot have a wide room, so the
  camera-aware slide in `drawTransition` has no room in the game that can reach
  it.
- **Enlarging the miniboss arena is a balance change nobody has played.** The
  Clawcrab now has twenty tiles to fight in and sits at the far end.
- **The east lobe's floor is bare** and has to stay that way: the theme's floor
  variant is a water-coloured tile in this dungeon (see below). Twenty tiles of
  one floor tile is the thing a wide room invites and there is currently no
  answer to it in the Grotto, Cistern or Salt themes.

### Two bugs found by walking the room, and both are fixed

Neither was findable by reading, and each was hiding the other.

**D1's Clawcrab Den had a locked door that locked nothing.** Row 2 ran clear
past the door in the room's west wall, so Small Key 3 bought nothing and the
Piece of Heart behind it was free. True of the original 1x1 grid too — verified
against the pre-conversion data, so the widening did not cause it, it only put
someone in the room. Columns 0-1 of rows 2 and 5 are now wall and the door is
the only way between the den and the west antechamber, at all three tide levels.

**Sealing it then failed `walk-dungeons.mjs`** with `0,4,3` unreachable: D1 has
three locks and the walker could only count two keys, because the third is a
`{ pickup: 'key' }` chest and the counter knew only `{ item: 'key' }`. Both are
real forms — `openChest` grants one and spawns the other. The undercount was
harmless for exactly as long as one lock was bypassable.

**`walk-dungeons.mjs` now asserts every locked door separates its room**, on one
axis, at all three tide levels — 35 doors, all passing. The three-levels clause
is the part with teeth: a door that separates at LOW and not at HIGH is a locked
door plus a conch, and the player always has the conch. If you place a locked
door in D2-D6, wall the four tiles round it.

### The P7.5 theme tiles, and one that cannot be used here

D1 already wears the Grotto theme from P7.5 step 8 — its floor, wall, bombable
wall and block are all extracted tiles, so "use the P7.5 tilesets" was already
true of this room. The one thing left to add was `,`, the theme's floor variant,
laid as a scoured track to break up twenty tiles of identical floor. It went in,
was screenshotted, and came straight back out: **`dFloorGrottoAlt` is registered
in the `stonef` palette, which is the palette of `dFloorWet` — the MID form of
the `dBasin` tide tile this room is dotted with.** The decoration read as
standing water in a room whose only other grey tiles are the damp patches that
are meant to.

**Grotto, Cistern and Salt all have this collision; Coral, Bog, Wood, Palace and
Abyss are clear.** `validate.mjs` asserts a theme never changes a tile's flags,
which is the right check and is precisely blind to a theme changing what a tile
appears to say. In a tide game the floor palette is vocabulary.

Pulling that thread found a bigger one: **in six of the eight themes `,` is not
a second tile at all, it is the same art recoloured.** Only Wood and Palace have
a genuinely different alt floor. So "break the floor up with the variant" is not
available in most of the game, and it wants a new pick rather than a workaround.

### Extracted art that no room could name, and it had always been so

`lionHead` and `urn` were extracted in P7.5, given tiledefs, and commented in the
file "Themed scenery, for P8 to place" — and never given a legend character. A
room grid can only name a tile through its legend, so both shipped in every
`dist/` drawable by nothing, for the whole life of the feature, with every
checker green. Extraction is a four-link chain — sheet, ripper, tiledef, legend
— and everything checked links 1 to 3.

Both are wired now. `M` is a lion mask to set INTO a wall; `U` is an urn to stand
against one. The urn needed more than wiring: its cell carries 64 pixels of the
source room's floor, so it drew a rectangle of one dungeon's flagstones into
every other dungeon's. The ripper now keys the border-connected background out
to transparency and each theme has its own urn naming its own floor as
`underArt` — `underArt` is a fixed tile name, which is why there are eight urns
and not one. That made the urn the SIXTH themed character, so the "adding a
seventh" path in `legends.js` is worked rather than warned about.

`validate.mjs` now fails on extracted theme art no tiledef draws, and on a
tiledef built on extracted art that no legend, tide variant or transform can
reach. Both were verified by breaking them — removing the new legend characters
reproduces the original bug as a named failure. Two picks are exempt with the
reason and a screenshot: `hatchWall` and `forgeWall` are wall RUNS and read as
railings repeated (`tools/shots/wallruns.png`).

`d1` `0,5,3`'s east lobe is the first use, and "DUNGEON LOOK" in
`docs/EXECUTION-PLAN.md` is what a dungeon session reads: what a theme gives you,
what it does not, and the seven steps for adding a themed tile.

## What the session before that did (P8, dungeon 1: Tidewash Grotto)

**D1 is re-authored around the Tidewright's Anchor, and the claim is proved
rather than asserted.** 24 rooms, one floor, the Anchor at room 12 of 24, and
every room after it behind an anchor gate. The full constraint-by-constraint
table is in `docs/EXECUTION-PLAN.md` under "P8 status", and the dungeon's own
header comment in `src/data/dungeons-a.js` states the gate primitive once and
then builds five rooms out of it. Also there: the P7 audit and how D1 fits the
charm gating, which is the other half of what the session was asked for.

### `tools/check-anchor.mjs` is new, and it is the point

Pure Node, no browser, 14 assertions. For every room declaring `anchorGate` or
`anchorGauges` it proves BOTH directions: that no sequence of walking, hopping
and sounding the conch crosses it, and that one anchor placement does. It reads
the patch radius, the throw arc and the hop reach out of `feel.js` rather than
writing them down, so retuning `WALK_SPEED` or `ANCHOR_RADIUS_TILES` re-proves
every gate instead of quietly breaking one. It prints the solution it found for
each room, so the tool output is the record of each room's intended answer.

**It earned itself on its first run by failing all three gates.** Each had a
forgiving tile of `dSluice` between its two bands, put there so the five-tile
held patch would spill onto something harmless — and since `dSluice` is dry at
LOW and shallow at MID, it was somewhere to STAND, and the conch can be sounded
anywhere you can stand. All three gates fell to one button press while reading
as anchor rooms in the data. That is exactly the failure the dungeon walker
cannot see, because its flood grants every tile whichever level suits it.

### The Anchor does not fit in a 10x8 room, and that is a P7.6 argument

The patch is 5x5 and the throw carries two tiles, so one gate needs
`stand + 4 + 3 + far side` — a whole room row, with the rest of the room walled
off so the player cannot walk round it. Hence three bare corridors, and no room
holding two gates or a gate and anything else. A 2x1 room is 20 tiles wide and
turns anchor geometry from a fit problem into a design space. Weigh that into
P7.6's value: D3 onwards will keep hitting it.

### Things that changed outside D1

- **`openChest` grew a `charm` branch.** `Chest` accepted `{ charm: ... }` in
  room data and `openChest` fell through to "Nothing but sand." — an opened
  chest, a saved flag, no charm. `check-charms.mjs` now proves the branch grants
  in-engine, sweeps every room in the game for a `charm:` that names a charm not
  in `CHARMS`, and prints the hand-placed list (2: the shop's Ballast Heart and
  D1's Split Fang).
- **`walk-dungeons.mjs` understands puzzle-opened doors.** A tile named in any
  room's `puzzle.reward.openDoors` is passable to the flood. Without it the Boss
  Key room behind D1's gauge puzzle read as stranded.
- **A fourth replay, `d1-sluicegate`**, crosses a real gate in the engine: throw,
  conch, hold `right`, and the probes read LOW at (2,3) and MID at (7,3) in the
  same frame while the player ends at x=112 on 12/12 hearts — no wash, no fall.
  462 frames. `d1-descent` was rewritten for the new layout and re-recorded
  (6365 frames); its frame counts are not comparable with the pre-P8 recording,
  because the world changed rather than the movement.
- **The Compass-on-a-pot bug is gone in D1** — the Chartstone chest has floor
  above it and `d1-descent` collects it. The engine defect behind it is
  untouched and five dungeons are unaudited for it.

### Seen on screen, for once

Four rooms were screenshot at LOW and MID with `tools/shoot-rooms.mjs` and
looked at: the gates read (shallow water one side, black pits the other), the
drinking floor at MID is unmistakably a chamber you have to drain, and the gauge
room shows its door, its heart piece and its return stairs from the doorway. The
gauges themselves are the weak part — see the new entry in `docs/ART-BACKLOG.md`
for the fixture they want.

### What is weak about it

- **The three gates are the same primitive twice over.** Two orderings (wells
  near, drains near) and three instances. The gauge rooms are the only other
  anchor idea in the dungeon, and they are also duplicated (side by side, then
  stacked). D1 is a tutorial dungeon so repetition is defensible; D3 will need
  more than this, and P7.6 is what buys it.
- **The gate corridors are visually bare** — two open rows in a room of wall,
  because anything else in the room is either a way round the gate or a place to
  stand and sound the conch. Decorating them safely needs care: a niche off the
  corridor broke the gate in the first cut.
- **Nothing in the post-item half has been played by a human**, only proved. The
  gauge rooms in particular ask the player to infer a rule from a plaque.
- **`0,5,2` and the boss room do not require the Anchor**, only being reached
  through a gate does. Stated as an exception rather than papered over.
- **check-anchor's model has no swimming in it**, so it is only sound before the
  Cleats. It asserts that no declared anchor room is in a later dungeon, which
  is what will catch the first D3 room that tries.
- **The two removed dungeons are still in the data.** Eight dungeons, six in the
  plan. D1 did not need the consolidation; D7/D8 folding is still owed.

## What the session before that did (P7: scrimshaw, plus P7.5 and P7.6)

### P7 — the ring system is gone and scrimshaw replaced it

`src/game/scrimshaw.js` is new; `src/game/rings.js` is deleted along with the
ring shop stock, the menu's ring tab, `hasRing`, and the extracted `i_ring`
icon — whose cell was removed from `tools/rip-hud.py` and the file re-emitted,
not hand-edited.

**The rule.** Thirty charms slot into three cases named for the tide levels, and
a charm only works while the water is at its level. One case (MID) at the
start; LOW and HIGH are cut by the scrimshander at 2 and 4 essences, and at 6
every case takes two charms.

**The load-bearing decision, which a future session will want to "fix":** the
level that decides is `tideAt(game, player)` — the level under the player's own
FEET — not `tide.level`. So standing inside the Tidewright's Anchor's held
patch keeps that patch's charms alive while the rest of the room has moved on.
That is deliberate, it gives the Anchor a second use, and it is the reading a
player assumes the first time they try it.

**The two transition charms** are the design payoff and both work: the Neap
Charm holds a case awake for `NEAP_GRACE_FRAMES` after the tide leaves it
(resolved off the PREVIOUS frame's live set, so a charm that has already gone
dark cannot be what keeps itself alive), and the Fisherman's Regret wakes the
case one level below the water.

**The scrimshander** works the west side of Tidewatch square. A blank plus
`CARVE_PRICE` rupees, and she carves what the bone wants to be — the charm is
chosen AT COMMISSION off the global stream, not on collection, so reloading
before collecting is not a re-roll button. It is finished by `CARVE_TIDE_TURNS`
changes of the tide, counted in `onTideChanged`, so a player who never sounds
the conch never gets one. Blanks come off the seafloor via the Dredge Line (the
new `dredged` drop table, where they are common) and off the `good` and `rich`
enemy tables, where they are not.

**`tools/check-charms.mjs` is new, 60 assertions, and its last one is the
interesting part.** A charm is pure data and nothing forces a system to read
it, so an entry in `CHARMS` with no reader gives you a charm that carves,
slots, highlights, saves and does nothing — with every other checker green. So
the harness sweeps `src/` and fails on any charm not named outside
`scrimshaw.js`. Two charms act on the slotting rule itself and are named as
explicit exemptions rather than left as a hole. Verified by deleting one
charm's implementation and watching both the effect assertion and the orphan
sweep fire.

### P7.5 — the tool is built; the decision it opens with is BLOCKED

`tools/rip-dungeon-maps.py` turns a stitched full-floor map into a
deduplicated 16x16 tileset plus a JSON manifest carrying each tile's occurrence
count and one map coordinate. Frequency is the point: on a map it is the only
signal that separates a wall from a decoration without a human looking.

Proven on `oracle-seasons-dungeon-backgrounds.png` — 24389 cells, 18 bands, 157
blocks, **2181 unique**, byte-identical on re-emission, asserted by
`tools/check-tilesets.mjs` (6/6).

**The four maps the brief was written against — Ancient Ruins, Explorer's
Crypt, Poison Moth's Lair, Dancing Dragon Dungeon — are NOT in the repo.** So
steps 1-3 (which colour register the sheets came from) cannot be done: the test
is to compare a tile appearing in both an existing sheet and a new map, and
there is no new map. The evidence that CAN be gathered without them is
tabulated with numbers in `docs/ART-DIRECTION.md` and is genuinely
inconclusive — the terrain sheets carry the raw ROM register's signature
(channels in multiples of 8), the sprite sheets do not, and the two groups have
not been shown to agree. **Do not pick a register from that table.** The brief
says an inconsistency is the user's call, and it is.

Step 8 (tiledefs) is blocked with it. Step 9 said to author no rooms anyway.

### P7.5 step 8 — the eight dungeons no longer look the same

The tile pack got used. `tools/rip-dungeon-themes.py` extracts 21 themed tiles
off the Seasons dungeon map into `src/data/tiles-dungeon-themes.js`
(GENERATED — edit the tool's PICKS and re-emit), each citing its map coordinate
and occurrence count. Eight themes are wired up, one per dungeon, and every one
is identifiable from a single screenshot.

**A theme is a legend, not a room edit.** `registerLegend(name, overrides,
'dungeon')` repoints five characters and inherits the rest, so a dungeon
changes its look with one `legend:` field and no room grid moves.
`validate.mjs` asserts each themed tile carries exactly the flags of the shared
tile it replaces — a theme may change the look, never the rules. Verified by
adding F.SLOW to a themed floor and watching it fail.

Unlike `rip-terrain.py`, this ripper INSTALLS its palettes: those tiles are new
and have no game palette to preserve, and the cartridge's own colours are what
make one dungeon look unlike another. Where a theme names a palette from
palettes.js instead, that is a deliberate swap into a colour the game already
uses.

### P7.6 — planned, deliberately not built

The brief says "use plan mode and show me the plan before you touch code", so
this session wrote `docs/briefs/P7.6-PLAN.md` and stopped. (It was approved and
executed later; see the top of this file.)

The survey finding that makes it tractable: `ROOM_W`/`ROOM_H`/`VIEW_W`/`VIEW_H`
appear 30 times across six files, and every use means one of three separable
things — the room's size in tiles, the room's size in pixels, or the size of
the window on screen. The engine already treats "the room's extent" as one
concept and has just been spelling it with the viewport constant. The work is
separating those meanings, not inventing a camera.

### What is weak about all of it

- **Nobody has watched any of it in motion.** Every claim above is from
  checkers. The CHARM menu screen, the Wrecker's Eye glimmer, the lantern
  charms' lit radius and the scrimshander's dialogue are all things whose point
  is how they look, and none has been seen on screen by a person.
- **Every scrimshaw constant is `guessed` and cannot be otherwise** — no Oracle
  system slots a passive by world state. `NEAP_GRACE_FRAMES` is the one to
  settle first, because it is the width of the whole transition window the
  design payoff depends on.
- **Charm BALANCE is unexamined.** Thirty charms exist and each does what its
  line says; no two have been compared for value. The Hagstone (a quarter of
  hits ignored) is probably the strongest thing in the game and cost nothing to
  write.
- **Only one charm is placed in the world.** The shop sells the Ballast Heart.
  Everything else comes from the scrimshander's random carve, so a run cannot
  seek a specific charm. That is arguably right for a bone carver and it means
  the whole roster is un-designed as PLACEMENT — P8 should hand-place some.
- **The scrimshander reuses `npc_elder`'s sprite**, which the digger also uses.
  Two different characters share a face.
- **The case unlocks are keyed on essence count only.** They fire on talking to
  her, so a player who never returns to Tidewatch never opens the LOW or HIGH
  case and never learns the system has more to it.
- **The three replays were re-recorded** because adding one NPC re-phased every
  enemy in the game (see HANDOFF). They pass to the pixel, but they are not
  comparable across this commit.

## What the session before that did (P4: grid-locked enemy motion)

P4 was written against the pre-P3 engine and merged onto it afterwards, so the
lattice is stated in the 8.8 subpixel arithmetic P3 introduced rather than in
floats. **P2 is still outstanding** — the flaky tide assertion has not been
root-caused.

- **The 8px lattice.** A ground enemy no longer has a velocity. It stands on a
  lattice point, decides, and takes a whole `ENEMY_GRID_STEP` step which runs to
  its end; nothing turns it mid-step and nothing draws from the room's stream
  mid-step. `wander` now commits to `ENEMY_DECIDE_STEPS` (3) whole steps and
  then draws a direction — a fixed cadence, not a per-frame coin flip.
  `chase`, `flee` and `patrol` remake their choice at lattice points and
  nowhere else. `hop` is a lattice step with a parabola fitted between its two
  endpoints, so the landing pixel and the landing frame are both known when the
  hop starts (it used to integrate a velocity against a gravity constant and
  land wherever that came out).
- **`bounceDiag`, `orbit` and `charge` are untouched and continuous**, as the
  brief asked. So are bosses, minibosses, fliers and aquatic enemies —
  `gridLocked()` says who is on the lattice and why.
- **Knockback is a scripted displacement.** Fixed distance, fixed frame count,
  constant speed, no decay, for the player, enemies and bosses alike. The
  `KNOCK_*` constants changed **units**: px/f before, total px now. Both
  numbers for all three cases are tabulated in `docs/FEEL-SPEC.md`.
- **`tools/check-motion.mjs`** — spawns one of every enemy in an emptied room
  (one pass dry, one wet), runs 600 deterministic frames, and asserts every
  lattice enemy is 8px-aligned on every frame it is not mid-step, mid-charge,
  mid-knockback or submerged. It also asserts the converse, that fliers and
  swimmers *do* leave the lattice, so a change that quietly grid-locks
  everything fails too. 8/8.
- Three call-site fixes the lattice exposed: the pincer's lunge was reeled home
  by a proportional lerp that never quite arrived (it is two lattice steps out
  and two back now), a split zol spawned its gels 9px apart onto a shifted
  lattice, and a resurfacing leever came up wherever the angle put it.

Both replays were re-recorded and pass to the pixel. Every other checker is
green.

### What it cost, and what is weak

The lattice makes enemies harder to juke — a committed step cannot be
deflected. That is the design, and a human handles it by reading the
commitment. `replay.mjs`'s recording actor cannot read anything, so it takes
substantially more contact damage through Tidewash Grotto and, on three hearts,
dies in the Crab Pit. `d1-descent`'s plan now starts it on five hearts with a
comment saying why. **That is a statement about the actor, not a difficulty
decision** — if P9 re-tunes difficulty, do not treat the five hearts as
evidence of anything.

Three actor fixes were needed, all written up in HANDOFF. The one that
mattered: the swordsman attacked `shield: 'front'` enemies from the front and
swung into the shield forever, which made the Crab Pit unclearable and lost the
Small Key. It now prefers the axis that is not looking back at it. `dExit` also
stopped pressing while the player was still on the room seam, so the next
directive bounced straight back through it.

And one engine defect the re-recording exposed, which is NOT from P4: a dropped
pickup pops about five pixels upward and never comes back down, so a reward key
comes to rest straddling the tile above the one it was spawned on. Full write-up
in HANDOFF. It is worth fixing on its own — it moves every drop in the game and
re-baselines both replays.

Not done, and worth knowing: nobody has watched this in motion. Every claim
above is from checkers. The lattice is the kind of change whose whole point is
how it *looks*, and `ENEMY_DECIDE_STEPS = 3` in particular is a taste number
that has never been seen on screen.

---
## And before that (P5: the tide became a field, and the Anchor)

All four parts of the P5 brief landed, plus the sprite and documentation work
asked for alongside it. Reasoning is in `docs/FEEL-SPEC.md` (new section: "The
Anchor's radius is settled by play") and every mistake it cost is in
`docs/HANDOFF.md` under "The tide field (P5), and the four things it cost".

1. **`tide.levelAt(tx, ty, room)` is the field.** `tide.level` stays as the
   base. An override is `{mapId, roomKey, tx, ty, r, shape, level, src}` and is
   ROOM-SCOPED, which is what makes a room-slide transition correct for free:
   each room resolves against its own overrides in the same frame. Overlapping
   overrides are last-placed-wins, defined rather than accidental.
   `Room.tile/flagsAt/solidAt/render` all take EITHER a plain 0/1/2 or the field
   — the number is kept working on purpose, because "what would this room be at
   HIGH everywhere" is a question the checkers need to ask.
2. **65 call sites audited.** ~12 genuinely want the base (HUD gauge, save,
   music, the conch's own plumbing, cutscene steps). The rest read the field.
   `tideAt(game, e)` in `entity.js` is the level under an entity's own feet and
   is what the 24 boss reads and the raft now use. `puzzle.tide` still reads the
   base — a room-level clause has no tile to ask about — and gains an optional
   `tideAt: [tx, ty]` for puzzles that want the local level.
3. **The Tidewright's Anchor.** Throw it, it bites where it lands and holds its
   patch at the level the water was on at that moment. Press again from anywhere
   in the world to recall. The chain damages along its whole line on both throw
   and recall. It cannot strand you — `findSafeTile` searches the FIELD now, and
   a placement with nowhere to stand is refused rather than survived. A placed
   anchor survives leaving the room (the override is the truth, the entity is
   its picture, and `Game.respawnAnchor` redraws it); one still in the air when
   the room changes simply returns.
4. **The checkers reason over the field**, and the interesting part is that the
   old model was optimistic in a way nobody could see before: "walkable at ANY
   tide level" grants a different level on every tile at once, which no conch
   can do. `check-overworld` now also floods properly — a state is a screen, a
   tile and a level, and you may only change level where you are standing on
   ground that survives the change. It reaches 120/120 that way too.
   `walk-dungeons` gained the check that only the field could express: the seven
   `noTide` rooms (the boss rooms) must work at all three levels independently,
   because the conch is refused in them.
5. **A replay proving one room at two levels at once**, `tide-steps-split`.
   Nine consecutive checkpoints read MID at one probe and HIGH at another in the
   same frame, with different rendered pixels. See the weakness note below.
6. **`flowers` re-picked, `bush` extracted at last**, and the publication
   restrictions removed from the docs.

### What is weak about it

- **`ANCHOR_RADIUS_TILES = 2` and `ANCHOR_SHAPE = 'square'` are guesses about
  design, not about the source games, and there is nothing to measure them
  against** — no Oracle item holds part of the world at one state. KeyU cycles
  the radius 1-4 in game, KeyY swaps square for disc, both re-apply to an anchor
  already down, and KeyO outlines the patch. **This is the one thing in the
  session that wants a human**: throw it in Tide Steps (overworld 0,10,0) at
  each setting and pick. FEEL-SPEC says why 3 and 4 are already ruled out.
- **The Anchor is not obtainable in play.** It has an ITEMS entry, art, an
  icon and a manifest entry, but no chest anywhere grants it — D1 is re-authored
  in P8 and that is where it belongs. Today only a harness or a `giveItem` call
  puts it in your hands.
- **There is no in-world signal for where the held patch ends.** The debug key
  outlines it; normal play has only the water itself, and at a boundary between
  two shallow tiles the edge is genuinely hard to see. That is an art job — a
  tide line, foam, something — and it should probably happen before the radius
  is settled, since it changes what "legible" means.
- **The anchor's throw distance is not tuned.** It reuses the pot-throwing arc,
  which puts it about three tiles out. That is a number nobody chose.
- **The chain sweep damages on a straight line from Link to the anchor**, which
  is right while it flies and a lie while it is held — the chain would slacken.
  Nothing draws a slack chain and nothing damages on one.
- **The overworld field flood is 2.9M states and takes ~30s.** Fine now; it will
  not survive being asked for two anchors.
- **The new `flowers` is darker and busier than the grass around it**, so
  walkable scenery is now more visually prominent than the cuttable bush beside
  it. That hierarchy is backwards and a lighter re-pick may be wanted; the
  blocking problem (flowers and bush being the same rosette) is fixed either way.

## What the session before that did (P3: fixed-point movement and the sword-hold)

All five parts of the P3 brief landed. Full reasoning is in `docs/FEEL-SPEC.md`
(new sections: "Positions are 8.8 fixed-point", "Diagonals", "The sword is
three verbs") and the cost of each mistake is in `docs/HANDOFF.md` under
"Fixed-point movement, and the four things it cost".

1. **8.8 fixed-point positions.** New `src/core/fixed.js`. Every entity has
   integer subpixel accumulators `fx`/`fy`/`fz`; `x`/`y`/`z` are accessors
   returning derived integer pixels via `>> 8`. `moveEntity` takes
   **subpixels**. `art.js`'s `x | 0` is gone — it truncated toward zero, so it
   misdrew every entity at negative x, which is every entity on every room
   transition.
2. **Diagonals are no longer normalised.** `DIAGONAL_FACTOR` is deleted, not
   set to 1 — a scale factor sitting there is an invitation to tune it back.
3. **`WALK_SPEED` re-derived to 256 sp/f** (exactly 1 px/f, 16 frames to the
   tile). `ROOM_EXIT_MARGIN` is 1 and the hack comment is gone. The constraint
   is tighter than it looks: a speed must be exact in 8.8 *and* divide 16px,
   so it must be a power of two in subpixels — 256 is the only candidate that
   is not a crawl or a dash.
4. **The sword-hold.** Holding the button after a swing keeps the blade out:
   its own pose, reduced walk speed, contact damage, cutting, and a clink off
   walls. Charge-to-spin still runs underneath. The pose is
   `link_hold_down/up/side`, **extracted** from the sheet's Charge band by
   `tools/rip-link.py` — in the Oracles, holding the button is the charge, so
   those are the frames the source game draws for this exact state. They are
   the only Link sprites that are not 16x16 (16x30, 16x28, 28x16), because the
   blade runs past the edge of the cell; `Player.draw` derives the anchor from
   the sprite's own size. Note the CLAUDE.md rule changed with this: Link's
   frames may be extracted, everything else is still drawn.
5. **Both replays re-recorded** and passing; `tools/shots-link-baseline/`
   diffed and refreshed.

### What is weak about it

- **`tools/replay.mjs`'s swordsman was retuned to survive the new speed.** At
  1 px/f, backing out of contact range on one axis is too slow, and the actor
  died in the D1 crab room. It now backs off diagonally and is fenced against
  walking out of the room. That is a legitimate change — a player would route
  diagonally too — but it does mean the actor's competence moved in the same
  commit as the movement model, so the two cannot be compared across it.
- **`d1-descent` ends holding one foe alive** in `0,3,3` and gives up on two
  in `0,3,5` (a stale-count bail, same as the previous recording did). It
  still spends the Small Key, takes the Dungeon Map, opens the Compass chest
  and ends in the north half on 8/12 quarter-hearts.
- **Nothing is tuned around diagonals being the fast direction.** Cardinal
  movement got 26% slower and diagonal got 4% faster. No enemy, gap or dodge
  window has been re-examined against that, and it is a real balance lever.
- **`SWORD_HOLD_DAMAGE`, `KNOCK_HOLD`, `SWORD_HOLD_SPEED` and the two hold
  timings are all `guessed`.** The hold's *existence* and its *art* are the
  fidelity claims; its numbers are not.
- **A non-16x16 player sprite is new ground.** Three of them exist now and only
  `Player.draw` knows how to anchor them. Anything else that draws Link — a
  cutscene, a future menu portrait — will place them wrong. There is no guard
  against that beyond `expectedSize` asserting the dimensions.
- **Enemy knockback still decays exponentially** and enemies still turn on a
  per-frame probability. Both are P4, untouched here beyond making the
  arithmetic integer. **P4 does both** — see the section above.

---
## What the session before that did (P2: root-cause the intermittent test)

`tools/test.mjs` intermittently failed "all three tide levels reachable".
HANDOFF blamed load flakiness because it passed on re-run and the failing
commits touched only sprite and audio data. That was wrong, and the paragraph
saying it has been deleted.

**What was actually happening.** `hold(key, n)` did not hold a key for n game
frames. It dispatched keydown, waited for n frames to elapse, then dispatched
keyup — while `main.js`'s wall-clock loop kept stepping the game throughout
every CDP round trip in between. So the real hold was n frames *plus* however
long the machine took to answer, and on a busy box Link walked roughly twice
as far as the test intended. He ended up standing on the village child (`npc_child`,
Tidewatch Village tile 8,4) instead of back in the middle of the square. A is
the context button before it is the item button, so `x` talked to the child
instead of sounding the conch; `Game.update` then returns early for as long as
a text box is up, so the press produced no tide change and later presses only
fed the box. `seen.size` came out 2. Which asset file the commit touched was
coincidence — `newProgress()` seeds from `Date.now()`, so *every* run was
already playing a different world.

Reproduced by modelling the round-trip latency against the fixed-step driver:
at 30 seeds x 61 latencies, 63 runs opened a text box during the conch section
and 2 came out with `size=2, tides=[1,1,1,2,2]` — the observed failure exactly.

**What changed.**

- `tools/test.mjs` takes the clock with `window.__harness.takeOver()` and steps
  with `step(n)`, the same driver `replay.mjs` uses. Real Playwright key events
  are kept — `keyboard.down` resolves once the event is in the page and nothing
  steps until the test says so — so every hold and tap now lasts exactly the
  number of updates it says on any machine.
- The save seed is pinned. `?seed=N` sets `Game.seedOverride`, which `newGame`
  falls back to; `test.mjs` passes `--seed=` (default 20260806). Play is
  unaffected and still seeds from the clock.
- The conch section stands Link somewhere known first, and two new assertions
  name the failure if a villager ever eats the press again.
- The gap between conch presses went from 64 frames to 80. The real lock-out is
  69 (the sweep, during which the player's own timers stall, plus
  `CONCH_FRAMES`), so the old gap sat *inside* it and half those presses were
  being swallowed even on an idle machine.

**A game bug found on the way.** `Game.update` called `this.tide.update()`
twice on every frame of a sweep — once at the top of play mode and again inside
the `if (this.tide.busy)` guard. The wave front therefore crossed in 23 frames
while `TIDE_SWEEP_FRAMES` said 44, so the constant described nothing. The
second call is gone and the constant is 23, which is what the game has always
looked like: the number moved to match the screen, not the other way round.
Both replays — including `d1-descent`, which cycles the conch — still pass to
the pixel, which is the proof that the wipe is unchanged.

**Verified**: the assertion 200/200 under six-way CPU load, one single distinct
outcome; `test.mjs` 38/38; `replay.mjs` 8/8 to the pixel; every other checker
green; the build rebuilt and `check-build` clean.

No retry was added anywhere.

## And the one before that (P1: feel spec, seeded RNG, replay harness)

Landed in full:

- **`src/data/feel.js`** — every timing and speed constant in the game, each
  with a unit and a provenance tag. The module-level constants are gone from
  `player.js`, `entity.js`, `game.js`, the enemy toolkit, `tide.js`,
  `projectile.js`, `objects.js` and `effects.js`; they all import now.
  **Nothing is tagged `measured`.** Everything carried over from the old code
  is `guessed`, and says so.
- **`docs/FEEL-SPEC.md`** — why the file exists, what the three provenance
  tags mean, how to earn a `measured`, and the three constants that are known
  wrong on purpose (`DIAGONAL_FACTOR`, the two knockback decays,
  `ENEMY_TURN_CHANCE`) with the prompt that fixes each.
- **`src/core/rng.js`** — mulberry32. One global stream seeded from
  `progress.seed`, plus `game.rng`, a per-room stream derived from the save
  seed and the room's identity and rebuilt on every room entry, so a room
  replays identically. All 23 `Math.random` call sites under `src/` are gone —
  the brief said 20; the count in the tree was 23, across seven files.
- **`tools/test.mjs`** — greps `src/` for `Math.random` and fails. Runs before
  the browser starts, strips comments first so it does not flag its own
  documentation. Verified by injecting a `Math.random` and watching it fire.
- **`tools/replay.mjs` + `tools/replays/`** — records a seed plus a flat list
  of per-frame button masks to JSON, replays it headlessly, and asserts the
  final position by **exact float equality** plus a checkpoint every 60 frames
  that names the first frame of any divergence. Two replays are committed.
  Verified by injecting a `Math.random` into NPC wander and watching the draw
  count diverge at frame 120 while the position still matched — which is
  precisely why the draw counters are asserted.

Both replays pass. So do all six pre-existing checkers.

### What P1 did NOT land, and what it would take

**The second replay is `d1-descent`, not a full D1 clear.** It is a real run:
eleven room entries, 21 kills, a chest opened, the Dungeon Map taken, a Small
Key earned by clearing the crab room and spent on a locked door, the conch
cycled all the way round, ending on 5 of 12 quarter-hearts in room `0,3,3`.
4036 frames. It stops at the locked door in `3,3`'s north wall.

(P4 re-recorded it: same route, same ending room, 4218 frames, and it now
starts on 20 quarter-hearts rather than 12 — see the P4 section above for why.
Everything below is unchanged.)

It stops there because the recording actor has three verbs — walk, open, swing
— and everything past that door needs more:

1. **A `push` directive.** The second Small Key is in `0,4,4`, whose puzzle is
   push-blocks onto floor switches. `tryPushBlock` needs the player to lean on
   a block for `PUSH_DELAY_FRAMES`, and a block moves exactly one tile ever
   (see the traps list). This is the single highest-value addition: it unlocks
   the rest of the spine.
2. **A miniboss and a boss routine.** The Clawcrab is in `0,5,2`; Gohmaraq has
   `shell: true` and is only vulnerable during its `open` windows, so the
   standoff swordsman in `replay.mjs` will swing into a blocked shell forever.
   It needs to read `e.weakOpen`.
3. **Roc's Feather.** The Boss Key in `0,3,2` is behind a feather gap, so the
   actor needs a jump verb and the big chest in `0,4,2` first.

Do **not** shortcut this by granting keys, the feather and the Boss Key in the
replay's `setup` block. The setup block states a world state, which is fine,
but a "full D1 clear" that skipped every puzzle would be a replay that proves
determinism while lying about what it is. Either teach the actor the verbs or
keep the honest name.

### A content bug found on the way

`d1` room `0,4,5`'s Compass is uncollectable. `Game.openChest` spawns the
pickup one tile above the chest with no check that the tile is standable, and
that tile is a pot. Measured, written up in `docs/HANDOFF.md`. Left unfixed —
it is dungeon content and P8 re-authors D1.

---

```
Continue building "Oracle of Tides", a GBC-style Zelda fan game.

`main` is trunk. Branch from it. One prompt = one session = one branch.

Read, in this order:
  CLAUDE.md              - the hard rules. They are hard rules.
  docs/EXECUTION-PLAN.md - the roadmap. P0-P8 are DONE. P9 (overworld
                           re-gating and difficulty) is next; read "P8 status"
                           and the P7 audit in it before touching either. P7.6 is DONE — if you are
                           authoring rooms, read "ROOM SIZE — everything a
                           dungeon session needs, in one place" in the P8
                           section and nothing else about room size. P7.5 is
                           BLOCKED on four missing dungeon map rips (see
                           ART-BACKLOG.md). PT (towns) is independent and can be
                           taken whenever a session wants content.
  docs/ITEMS.md          - the item roster. Authoritative. tools/check-items.mjs
                           asserts the registry is exactly this document.
  src/game/scrimshaw.js  - the charm roster and the slotting rule. Each charm's
                           one-line desc IS its specification, and
                           tools/check-charms.mjs proves each in-engine and
                           fails on any charm nothing reads.
  docs/ART-BACKLOG.md    - identified, scoped, not done, and what blocks each.
  docs/EXECUTION-PLAN.md - the roadmap. P0, P1, P3 and P5 are done. P6 (the
                           item roster) is now unblocked and is the big one —
                           P5 existed to unblock it. PT (towns and buildings)
                           is a stated top design priority and is independent
                           of the systems spine, so it can be taken whenever a
                           session wants content. P2 (the intermittent test)
                           and P4 (grid-lock enemy motion) are still open.
  docs/FEEL-SPEC.md      - what every timing constant means and how sure we are
  docs/HANDOFF.md        - current state, environment setup, and every trap
                           already paid for. Read the environment section
                           FIRST: Playwright needs a symlink shim before any
                           headless harness will run, and `pip install pillow`
                           before any rip-*.py tool will.
  docs/GAME-PLAN.md      - regions, dungeons, items, bosses
  docs/ART-DIRECTION.md  - binding for anything visual. Rule 1 is EXTRACT, NOT
                           DRAW: fidelity to the source games is the product,
                           so if a sheet in assets/sheets/ has the thing, take
                           it from the sheet via the tools/rip-*.py workflow
                           (AGENTS.md section J) instead of hand-drawing an
                           approximation. Extractions are GENERATED files —
                           edit the ripper's coordinate map and re-emit, never
                           the output. Hand-draw only what no sheet contains,
                           and match the extracted art next to it.
  docs/briefs/AGENTS.md  - authoring spec per work area, sections A-J

ENVIRONMENT, before anything else. Playwright asks for a browser revision the
pre-installed Chromium does not match, so every headless harness dies with
"Executable doesn't exist" until you shim it. The exact commands are in
HANDOFF under "Environment setup a fresh container needs" — check the revision
number in the error message. It has been 1234 every time so far, and the
installed one has been 1194.

Confirm the baseline before changing anything, and keep every line below green:
  node tools/validate.mjs                      clean (two expected warnings
                                               about fx_slash_d0/fx_slash_d1);
                                               also asserts no dungeon theme
                                               changes a tile's flags
  python3 tools/rip-dungeon-themes.py          regenerates tiles-dungeon-themes.js
                                               BYTE-IDENTICAL. --sheet writes a
                                               contact sheet of every pick.
  node tools/test.mjs                          58/58
  node tools/replay.mjs                        46/46, all TEN replays to the
                                               pixel. Six of them also assert a
                                               `span` — transitions fired, the
                                               camera's extremes, and what the
                                               probe TILES became.
  node tools/walk-dungeons.mjs                 23/23 over SIX dungeons (d1, d2,
                                               d4 and d5 are 24 rooms each, d3
                                               is 22, d6 is 26; the dungeon list
                                               is read out of the map registry
                                               rather than written down). The
                                               flood hops one-way ledges, swims
                                               from d3 on, CASTS A DREDGE LINE
                                               AT A MOORING from d6 on, and
                                               treats a door a gust wheel or a
                                               kelp snarl opens the way it
                                               treats a puzzle-opened one. One
                                               check asserts every locked door
                                               actually separates its room.
  node tools/check-lens.mjs                    24/24, every Lens fork proved
                                               pinned, one-way, unanswerable at
                                               the level it is chosen at, and
                                               drawn as ONE tile there
  node tools/check-cleats.mjs                  15/15, every torrent room proved
                                               unreachable on foot and on the
                                               surface, reachable on the floor,
                                               and inside one breath
  node tools/check-bellows.mjs                 60/60, every Cistern sill proved
                                               out of reach by hand, drowned at
                                               the sea it is played at, freed by
                                               one level of cone and by nothing
                                               else, and stood in only while it
                                               is still drowned
  node tools/check-overworld.mjs               17/17 (the field flood is ~30s
                                               of its runtime)
  node tools/check-gates.mjs                   15/15 (pins ?seed= and owns the
                                               clock since the flake below)
  node tools/check-items.mjs                   82/82
  node tools/check-reefseed.mjs                87/87, every grove proved
                                               unbuildable at LOW and unbrickable
                                               by a stray pillar
  node tools/check-dredge.mjs                  103/103, every Keep crossing
                                               proved across a pit nothing walks,
                                               reachable at one sea and no other,
                                               and every cache proved to give up
                                               nothing on a dry pan. Each closure
                                               clause runs TWICE — once at the
                                               line's reach and once at the
                                               Coilrope's.
  node tools/check-anchor.mjs                  14/14, every room that claims to
                                               need the Anchor proved impassable
                                               with the conch alone and passable
                                               with one placement
  node tools/check-charms.mjs                  63/63, every charm proved
                                               in-engine, no charm orphaned, and
                                               no room handing over a charm that
                                               does not exist
  node tools/check-motion.mjs                   8/8
  node tools/solve-switches.mjs                9 switch rooms, one push per
                                               block
  node tools/check-tilesets.mjs                 6/6 (needs Pillow; it SKIPS
                                               with exit 2 rather than passing
                                               quietly if Pillow is missing)
  python3 tools/rip-terrain.py                 regenerates tiles-terrain.js
                                               BYTE-IDENTICAL; if it does not,
                                               someone hand-edited a generated
                                               file. Same for rip-hud.py and
                                               `rip-dungeon-maps.py --verify`.
  node tools/scan-sprites.mjs --strict         0 hard findings
  npm run build                                51 modules -> one HTML file
  node tools/check-build.mjs                   the built file boots from file://

THE CHECKERS TAKE A WHILE. check-overworld, check-items and check-charms are
minutes each. Run them; do not reason about correctness instead.

EVERY SESSION ENDS BY RUNNING `npm run build` AND COMMITTING
dist/oracle-of-tides.html. That file is the playable game — one self-contained
HTML document that runs from a file:// URL with no server and no network, on a
phone as well as a desktop. A commit that changes src/ and leaves the build
stale ships a game that is not the game. See CLAUDE.md, Workflow.

THE BUILD - what it assumes, and what breaks it
  tools/build.mjs is a bundler, so it hard-fails rather than guessing:
  - It refuses to build if the game ever starts loading something at runtime
    (fetch, XMLHttpRequest, new Image/Audio, createImageBitmap, WebSocket, an
    .png/.wav/.json reference, an <img>/<audio>/<link src=>). The whole
    single-file trick rests on the game being procedural sprites plus WebAudio
    synthesis. If you add a real asset, the build tells you instead of shipping
    a file that 404s from file://. Teach it to embed the asset as a data: URI;
    do not delete the guard. It scans code with comments and string literals
    blanked out, so provenance comments naming .png sheets and room-grid
    strings that happen to spell "ogg" do not trip it, and `new Audio()` is
    allowed in src/core/audio.js because that module declares its own
    `class Audio`.
  - It understands exactly one import form, `import { … } from './x.js'`, and
    the export forms already in use (`export const/let/var/function/class` and
    `export { A as B }`). No default export, no `export *`, no re-export, no
    dynamic import, no multi-declarator `export const A = 1, B = 2`. Any of
    those is a build error naming the file and line. THIS BINDS src/data/feel.js
    IN PARTICULAR: it is a long list of single-declarator `export const`s and
    must stay that way — collapsing two constants onto one line would publish
    only half of them, silently.
  - IT REFUSES IMPORT CYCLES. Imports become destructuring from an eagerly
    evaluated module, so a cycle would snapshot `undefined`. src/core/rng.js
    and src/data/feel.js import nothing, which is deliberate — they sit at the
    bottom of the graph precisely because everything else imports them.
  - src/data/sprite-manifest.js is not reachable from main.js, so it is not
    bundled and the build says so. That is correct — it is tooling data.
  - The output must stay a CLASSIC script. A `<script type="module">`, even
    inline with no imports, is fetched with an opaque origin and blocked by
    file:// in every browser. That constraint is the reason for the whole
    module-registry design; do not "simplify" it back to a module.

DETERMINISM IS NOW LOAD-BEARING. Two rules, both easy to break by accident:

  - Never call Math.random() in src/. One global stream seeded from the save
    plus a per-room derived stream, both in src/core/rng.js. test.mjs greps
    for violations and fails.
  - Nothing in a DRAW path may consume randomness. draw() runs at display
    rate, update() runs at a fixed 60 Hz step, so a draw-time draw from a
    stream advances it a different number of times on a slow machine and the
    run silently desyncs. Use noise1/noise2 from rng.js — pure hashes that
    consume no state. The screen shake is the worked example.

EVERY TIMING AND SPEED CONSTANT LIVES IN src/data/feel.js. No module-level
`const WALK_SPEED = ...` anywhere else. Each export carries a unit and a
provenance comment: measured, derived, or guessed. NOTHING is `measured`. Most
values are guesses carried over from the old code; P3 made a handful `derived`,
which means computed from a stated constraint with the arithmetic in the
comment, NOT checked against a reference. Never upgrade a tag because the game
feels fine; `measured` means someone frame-stepped a recording.

POSITIONS ARE 8.8 FIXED-POINT (src/core/fixed.js). Four things about it:

  - `fx`/`fy`/`fz` are integer subpixel accumulators, 256 to the pixel.
    `x`/`y`/`z` are ACCESSORS returning derived integer pixels via `>> 8`.
    `e.x = 40` works and is right. `e.x += 0.5` does NOT — the read gives whole
    pixels, so a sub-pixel step rounds away every frame and the entity freezes
    in place with no error. Add to `fx`, or go through `moveEntity`.
  - `moveEntity(game, e, sdx, sdy)` takes SUBPIXELS. Enemy and projectile data
    still says `speed: 0.45` in px/f; the conversion happens at named edges —
    `moveDir`, the `Projectile` constructor, `hop`'s `power`, `driftWithTide`'s
    `perLevel`, `Entity.hurt`'s `knock`. If you change a constant's unit, grep
    src/data/ for anyone overriding it, or the override arrives in the wrong
    unit and silently does nothing.
  - NEVER floor a coordinate with `| 0`. It truncates toward zero, so it is a
    pixel wrong for every negative coordinate — and the player is at negative x
    on every room transition. Use `toPx`/`>> 8`.
  - Nothing in a draw path may round. Every draw coordinate is already whole.

A JUMP'S REACH IS A FUNCTION OF WALK_SPEED, not of the jump:
`reach = 2 * JUMP_POWER / JUMP_GRAVITY * WALK_SPEED`. Change the walk speed and
you change the length of every gap in the game. Only check-gates.mjs catches
it — it is the only harness that jumps, and both replays stayed green while
Roc's Feather stopped clearing the Coral Reef chasm. Re-derive the three jump
constants in the same commit.

FOR ANYTHING AT ALL: `npm run build && node tools/check-build.mjs`, then
commit the rebuilt dist/oracle-of-tides.html. A green src/ with a stale build
is a red session.

AFTER ANY CHANGE TO A FEEL CONSTANT OR TO MOVEMENT/COMBAT:
  node tools/replay.mjs                 expect it to FAIL
  node tools/replay.mjs --record-all    re-baseline
  ...and commit the new replays in the same change as the constant. A feel
  change that leaves stale replays behind is one nobody can review.
  If a movement constant changes and every replay still passes, either the
  constant is dead code or the replays do not exercise it. Both matter.

TEST HARNESSES OWN THE CLOCK. main.js steps the game a variable number of
times per animation frame, so a harness that fires a key and then counts frames
holds that key for as long as its own round trips take. test.mjs and replay.mjs
both call window.__harness.takeOver() and step(n) instead, and test.mjs pins the
save seed with ?seed=. If you write a new harness, do both — otherwise it is
measuring the machine, not the game. test.mjs is no longer load-flaky; a
failure there is now yours.

P8 IS COMPLETE. All six dungeons are authored against the constraint list, each
has a prover written before its rooms, each has a replay walking its own idea
in-engine, and the six-versus-eight consolidation is done — the Reef Palace and
the Salt Pan Vault are one-room ruins now and `d7`/`d8` are gone from the data.
docs/DUNGEON-STATUS.md is the board and it names the commit each landed in. DO
NOT RE-AUTHOR A FINISHED DUNGEON.

NEXT UP, and pick ONE. **Note the plan's own ordering before you pick P9:**
EXECUTION-PLAN Part 4 puts PT (towns) at step 8 and P9 at step 16, and says so
deliberately — "a gate is a tile flag dropped into a finished screen; a town is
the screen itself", so re-gating a finished village is a small edit and
re-towning a gated screen is not. P9 is UNBLOCKED (its gates were P6 and P8,
both done) but PT is the step the plan wants first, and PT has never been
started.

  - PT, towns and buildings. Step 8 of the order, still open, gates P9, and a
    stated top design priority. The world has villages that are a name on a
    signpost and a few doors cut into a cliff. It needs no decision from anybody
    and it is the only remaining item the plan puts before P9.
  - P9, overworld re-gating and difficulty. Unblocked, and the fold above
    changed its inputs: two regions that used to be dungeon approaches are now
    ruins, so the routing through the Salt Pans and the Reef Palace wants a
    second look before anything is gated. Taking this before PT means re-gating
    screens PT will then rebuild.
  - PLAY THE GAME. This is the largest open item in the project and no tool in
    the repo can close it. Six dungeons, six different fixtures — a held patch,
    a blind fork, a torrent, a drowned wheel, a bole and a snarl, a mooring and
    a drowned cache — and no session has ever compared two of them. Nobody knows
    whether the difficulty curve across the six goes the right way, or at all.
  - THREE ENEMIES ARE REGISTERED AND UNPLACED after the fold: thalassor,
    saltwraith and gustharpy. Hand-drawn art shipping in dist/ that nothing in
    the world draws. Place them or remove them with their sprites — and if you
    remove them, take the cell out of the ripper's map and re-emit rather than
    editing the generated file.
  - (superseded, kept for the reasoning) P8 for D5, the Drowned Wood Shrine and
    the Reefseed.
  - (superseded, kept for the reasoning) P8 for D4, the Cliffside Cistern and
    the Squall Bellows.
  - (superseded, kept for the reasoning) P8 for D3, the Bogwater Sanctum and
    the Kelp-Soled Cleats, and then D4-D6.
    D1 and D2 are DONE and each solved a different shape of problem: D1's item
    did not FIT in a room (geometry), D2's item could not be REQUIRED by terrain
    at all (it only shows you things). Read both "P8 status" tables in
    EXECUTION-PLAN before designing, and read the header comment at the top of
    d2 in src/data/dungeons-a.js for how an item that cannot gate is made
    necessary anyway. D3's item introduces SWIMMING, which is the thing both
    check-anchor.mjs and check-lens.mjs say in their own headers they cannot
    model — teaching one of them to swim is part of that session, not an extra.
  - A room that claims to need its dungeon's item should DECLARE that in its
    room data and be proved by a checker, both ways. There are SIX worked
    examples now — check-anchor, check-lens, check-cleats, check-bellows,
    check-reefseed and check-dredge — and they are different shapes on purpose: the anchor's
    is a state-space flood over (tile, level), the Lens's is a fixed-level
    flood plus a tile-identity claim, the Cleats' is an arithmetic comparison
    of two speeds, the Bellows' is a reachability claim crossed with a cone
    footprint, the Reefseed's is a fixed-point closure over everything the
    player could build, and the Dredge Line's is a simulated cast crossed with
    a flood from where it drops you. Write the checker BEFORE the rooms.
    AND ASK WHICH CHARM CHANGES THE ANSWER: check-dredge proves every closure
    clause twice, once at the line's reach and once at the Coilrope's, and the
    second pass failed on its first run. AND DO NOT COPY ANOTHER
    PROVER'S FLOOD WITHOUT READING IT: check-cleats hops anything that is not
    solid, which is wrong for pits, and copying it cost D4 three false
    failures.
  - P7.5's remainder is BLOCKED: it needs four dungeon map rips that are not
    in this repo. Do not start it by inventing the colour-register decision.

P7 IS CLOSED. There is no P7 follow-up session. What scrimshaw still owes is
assigned per dungeon in EXECUTION-PLAN under "P7 is CLOSED" — read that table
before starting any P8 session, and do the charm-gating audit it asks for.

THE CHARM CASES NOW OPEN ON THE ESSENCE, settled by D2. `openCharmCases` in
scrimshaw.js is called from Game.claimEssence, and the scrimshander says her
line the first time you see her afterwards (progress.charmTold). Before this
the unlock fired only from Scrimshander.interact, so a player who never walked
back to Tidewatch owned charms they could never switch on — with every checker
green, because the system worked and simply was not on.

ONE MORE THING D1 SURFACED AND LEFT ALONE: at one essence the MID case is the
only case open, and D1's design is "take the sea down to LOW", so the player's
one charm is dark for most of the first dungeon. Leave it, open LOW at one
essence, or place the Neap Charm early — the argument for each is in the same
section. It is a taste call and it wants play, not analysis.

SCRIMSHAW IS IN AND THE RING SYSTEM IS GONE. `game.charm(id)` replaced
`hasRing`. A charm is live only while the tide UNDER THE PLAYER'S FEET matches
its case — `tideAt(game, player)`, never `tide.level` — so an anchored patch
keeps its charms alive. If you add a charm, something in src/ outside
scrimshaw.js must READ it, or check-charms fails you. A charm PLACED in a
dungeon must fit a case the player has open at that point in the game: at one
essence that is MID and nothing else, so a LOW charm in D1 is a reward nobody
can switch on for two dungeons. check-charms prints every hand-placed charm.

AN INFORMATIONAL ITEM CAN ONLY BE REQUIRED WHERE THE INFORMATION CANNOT BE
BOUGHT SOME OTHER WAY. D2's forks work because the room declares `tideForce`,
which pins the tide and REFUSES the conch — otherwise the player sounds it,
looks at the room one level up with their own eyes, sounds it back, and the
Lens is a convenience. The pin, a one-way ledge, and a TideValve at the BOTTOM
of each branch (past the point of no return) are the three parts, and
check-lens.mjs asserts all of them. Do not unpin a fork room.

A DUNGEON ROOM MAY BE BIGGER THAN ONE SCREEN. Sizes are 1x1 (the default and
still most rooms), 2x1, 1x2, 2x2 and 3x1, declared as `size: [2, 1]` in the room
def. The `map` is ONE grid — a 2x1 room is eight rows of TWENTY characters — and
a multi-screen room OWNS every map cell it spans, so nothing else may be keyed
inside its footprint. validate.mjs fails on both mistakes. The overworld may not
declare a size at all and registerMap throws if it does. Everything else — the
camera, the render cache, the minimap, the seam arithmetic — is done and every
checker reasons over room.tw/room.th. `d1` `0,5,3` is the worked example; the
sizing rule and the pacing number are in EXECUTION-PLAN under "ROOM SIZE".

A LOCKED DOOR MUST WALL OFF WHAT IT LOCKS. walk-dungeons.mjs now asserts every
dDoorLocked/dDoorBoss tile separates its room on one axis at ALL THREE tide
levels. D1 shipped one that did not — you could step round it along the next row
— and nothing caught it, because the dungeon flood spends a key on any lock it
can reach and then only asks whether every room came out reachable. Wall the
four tiles round a door when you place it.

A DUNGEON THEME'S FLOOR VARIANT `,` IS WATER-COLOURED IN THREE OF THE EIGHT
THEMES. Grotto, Cistern and Salt register their Alt floor in `stonef`, which is
the palette of dFloorWet — the MID form of the dBasin tide tile. Decorating a
floor with it in those dungeons says "there is water here". Coral, Bog, Wood,
Palace and Abyss are clear. validate.mjs checks that a theme never changes a
tile's FLAGS and is blind to it changing what a tile appears to SAY, so look at
the room.

AN ANCHOR GATE IS ONE RULE PLUS GEOMETRY. No tile between the two bands may be
walkable at BOTH levels — the conch can be sounded anywhere the player can
stand, so one forgiving tile in the middle turns the whole gate into a button
press. That mistake was made and caught by tools/check-anchor.mjs in the same
session, in all three gates at once. Bands are 4 near and 3 far because the hop
clears two whole tiles and the patch is five across; both numbers come out of
feel.js, not out of memory.

ANYTHING THAT TOUCHES POSITIONS TOUCHES THE LATTICE. `beginStep`/`advanceStep`
in src/game/enemy.js must go on landing exactly on multiples of
`ENEMY_GRID_STEP * FP_ONE` (8px = 2048 subpixels). They recompute progress from
the step's origin every frame and assign the exact destination on the last one,
rather than accumulating a velocity, precisely so nothing carries a remainder.
`node tools/check-motion.mjs` is what tells you if that survived, and it asserts
on `fx`/`fy` rather than `x`/`y` for the same reason.
THE TIDE IS A FIELD. `game.tide.level` is the BASE — the HUD gauge, the music,
the save file and the conch's own plumbing. Everything about the world reads
`game.tide.levelAt(tx, ty, room)`, or passes `game.tide` straight to a room
query, which resolves per tile. `tideAt(game, e)` in entity.js is the level
under an entity's own feet and is what an enemy, a boss or a raft wants. If you
add a call site that says `tide.level` and means "the water here", it will be
right until the first anchor lands near it and wrong forever after.

A DUNGEON ITEM'S GUARDS ARE PART OF ITS GEOMETRY. Three items now refuse to be
used while `inDeep || underwater` — the Squall Bellows, the Reefseed and the
Dredge Line — and in each case the guard is what makes range and footing mean
anything. Without it the answer to every mooring in the Abyssal Keep is to swim
into the middle of the shaft and cast from there, and no arrangement of ground
can be made to matter. If you add an item that is aimed from where you stand,
decide whether the water is somewhere you can stand, and write it down.

A PIT IS THE ONLY BARRIER LEFT AFTER D3. The Kelp-Soled Cleats make deep water a
road in both modes and no sea level fills a hole, so a late-game room that says
"you cannot get over there" has to mean `dPit`. The Cistern found it, the Keep is
built on it, and it is the first thing to check when a late room reads as
crossable and should not be.

THE ESSENCE COUNT IS COMPUTED, NOT WRITTEN DOWN. `essenceCount()` in
src/world/maps.js counts dungeons that grant one. The HUD, the quest screen and
the save slots all print `/8` until they ask it — which they had been doing for
the whole life of the project, against a plan that has always said six.

Do the work yourself rather than spawning subagents - past sessions hit usage
limits that way and lost the work.

Tell me plainly what is done, what is weak, and what you skipped.
```

---

## What is already done — do not redo any of this

- engine, renderer, tide system, save/load, menus, cutscene runner
- the 120-screen overworld and all SIX dungeons (the fold took the room count
  down; walk-dungeons reports the live figure and it is what to trust)
- 56 enemy sprites and a 22-type enemy roster
- all 16 boss and miniboss fights, verified beatable
- every effect, pickup, object, projectile and item icon
- the whole story: 20 dialogue ids, 15 cutscenes, all verified to terminate
- music: 22 tracks; one-way ledges in all four cardinals; the region gates
- **the single-file build.** `npm run build` flattens into
  `dist/oracle-of-tides.html`, playable from a `file://` URL. Rebuild and
  commit it at the end of EVERY session.
- **the feel spec, the seeded RNG and the replay harness (P1)**
- **a deterministic `test.mjs` (P2)**
- **8.8 fixed-point positions, un-normalised diagonals, the sword-hold (P3)**
- **grid-locked enemy motion and scripted knockback (P4)**
- **the tide as a field and the Tidewright's Anchor (P5)**
- **the item roster (P6)** — `docs/ITEMS.md` plus `tools/check-items.mjs`
- **scrimshaw (P7)** — thirty tide-slotted charms, the scrimshander, the CHARM
  menu screen, and `tools/check-charms.mjs`. The ring system is deleted.
- **`tools/rip-dungeon-maps.py` (P7.5, partial)** — stitched floor maps to
  deduplicated tilesets, byte-identical, checked by `check-tilesets.mjs`
- **D1 re-authored around the Anchor (P8, dungeon 1 of 6)** — 24 rooms, three
  gate corridors, two gauge rooms, the item at the halfway point, and
  `tools/check-anchor.mjs` proving each anchor room in both directions
- **the eight dungeon themes (P7.5 step 8)** — `tools/rip-dungeon-themes.py`
  plus a themed legend per dungeon. Every dungeon is now identifiable from one
  screenshot, and no room grid changed to do it.
- **D2 re-authored around the Brineglass Lens (P8, dungeon 2 of 6)** — 24
  rooms, two floors, two pinned Lens forks, `tools/check-lens.mjs` proving each
  in five directions, and the charm cases moved onto the essence
- **multi-screen dungeon rooms (P7.6)** — a room may declare `size` in screens;
  a camera with a deadzone follows Link inside one and clamps to zero in a 1x1
  room, which is why no existing room moved. `d1` `0,5,3` is the one converted
  room and `d1-clawcrab-den-wide` is its replay.

## What is left

**P8 IS COMPLETE and PT steps 1-4 are done.** Six dungeons, six provers, the
eight-into-six fold, and four town screens built out of extracted buildings.
Read `docs/DUNGEON-STATUS.md` before touching a dungeon and the PT section at
the top of this file before touching a town.

1. **PT step 5 — the terrain backlog, and it is the biggest art job left.**
   `docs/ART-BACKLOG.md` ranks it. The `cliff` family is the head of it: the
   Oracles build a cliff out of several tiles and this game spends ONE tile on
   all of it, so one extraction covers eight tiles and it is a content decision
   rather than a swap. Water is genuinely blocked (no sheet in the repo has a
   second animation frame).

2. **PT step 4 — populate the towns properly.** The buildings are extracted and
   the doors work; the people are not. `assets/sheets/oracle-seasons-nonhuman-races.png`
   has still never been extracted from and carries the Maku Tree, the Great
   Fairy and rows of townsfolk, and the scrimshander still shares a face with
   the digger. This is the half of PT that is one ripper away.

   Two town-shaped follow-ups worth doing in the same session: **Tidewatch does
   not answer the tide** (no tide tile in the square, so the village looks
   identical at all three levels — a slipway or a flooding gutter along one edge
   is the fix, and `check-towns.mjs` will say whether it severs the square), and
   **a third town legend** for a marsh, cliff or salt settlement, which is two
   lines in `TOWN_GROUNDS` and two in `legends.js`.

3. **P9 — overworld re-gating and difficulty.** Its inputs are satisfied and it
   CAN start. It is deliberately not first: `docs/EXECUTION-PLAN.md` Part 4 puts
   PT at step 8 and P9 at step 16, because a gate is a tile flag dropped into a
   finished screen and a town is the screen itself — re-gating a village is a
   small edit, re-towning a gated screen is not.

4. **NOBODY HAS PLAYED ANY OF IT.** Not a dungeon, not a town. Every claim in
   this repo is a checker's or a replay's. It is not a box on any checklist and
   it is the largest open item in the project.

5. **P7.5's remainder — BLOCKED ON ASSETS.** Four dungeon map rips are missing.
   See `docs/ART-BACKLOG.md`. The colour-register decision is explicitly yours,
   not a session's.

Carried over, and none of it blocking:

- **Settle `ANCHOR_RADIUS_TILES` and `NEAP_GRACE_FRAMES` by playing them.**
  Both are design constants with nothing to measure against, both have debug
  keys or are one edit away, and everything built on top assumes an answer.
- **Charm balance and charm placement.** Thirty charms work; none has been
  compared to another, and only one is placed in the world by hand.
- **The overworld terrain that is still hand-drawn.** Ranked in
  `docs/ART-BACKLOG.md`; the `cliff` family is the big one and is a content
  decision, not a swap.
- **Water is still hand-drawn** and genuinely blocked — every terrain sheet in
  the repo is a static map with no second animation frame.
- **A full-D1-clear replay.** The actor needs a push verb, a boss routine, and
  — new with P8 — a way to aim a throw at a named tile and then sound the conch
  in order, since every room past the Anchor needs that. `d1-sluicegate` is a
  hand-scripted stand-in for one gate.
- **A checker for chests whose pickup lands on a solid tile.** D1's instance is
  fixed by re-authoring; the engine defect and five dungeons are not.
- **A tide-gauge fixture** so the two gauge rooms signal their rule with
  something other than a plaque. See `docs/ART-BACKLOG.md`.
- **The Lens draws three dark blues.** Shallow water, deep water and a pit
  separate by 4-6 RGB units through the ghosted overlay, and D2's second fork
  turns on exactly that read. Measured at three opacities, written up in
  `docs/ART-BACKLOG.md` with three candidate fixes. Wants a person holding the
  button, not another table.

## Traps that pass every validator

These are in HANDOFF in full. The short list, because each one cost a session:

- A push block moves exactly one tile, ever (`once: true` by default).
- An open dialogue freezes every entity while `mode` is still 'play'. This is
  also what stalled the first D1 replay recording for 2000 frames; every
  waiting directive in `tools/replay.mjs` now taps through one.
- An explicit palette at a draw site overrides a sprite's own.
- A solid tile is never hit by a projectile's own rect.
- An entity dropped from `game.entities` must be marked `remove` first.
- A gate tile sits inside a screen, not on its boundary row.
- `>` and `<` ledge runs are COLUMNS, not rows. A lip is solid from three
  sides, so a run across a corridor strands rooms and still validates — use
  `find-ledges.mjs` rather than placing by eye.
- Digits 0–9 in a room grid are always tide tiles.
- A chest can hand over an item that does not exist, in total silence.
- A tiledef field `registerTiles` does not name is silently discarded.
- A floor drop that speaks freezes the fight that dropped it. Jingle, never
  `game.say`.
- Adding an entity to an EARLY room re-phases every enemy in the game — ids are
  global and `every()` hashes the id — so it re-baselines all three replays.
- A new pickup weight taken out of the `heart` entries is a difficulty change
  wearing a costume; take it from `null` or the small rupees.
- Deleting an entry from `ITEMS` by slicing between banner comments takes its
  neighbours with it. Match the whole entry, brace-counted.
- A counted item used to arrive with an empty pouch: the capacity rule lived in
  `Game.openChest` alone. It is in `progress.giveItem` now, with the grant.
- A solid tile two squares away does not block a thrown Reefseed, it CATCHES it
  onto the square between. Every grove in d5 is laid out around that fact.
- A pillar the player grew is a SOLID tile at MID that no room author placed.
  `check-reefseed.mjs` is the only thing in the repo that can see it strand a
  room, and it only knows about the rooms that declare a `reefseedRoom`.

## Engine-API details a harness gets wrong on the first try

- `main.js` publishes `window.__game` and `window.__harness`. Everything else
  a harness needs comes out of the live module graph with a dynamic import
  from inside the page; there are worked examples in every committed harness.
- `window.__harness.takeOver()` stops the wall-clock loop stepping the game;
  `step(n)` then advances exactly n fixed updates. That is how `replay.mjs`
  gets a deterministic clock. `release()` hands it back.
- `enterMap` is `(mapId, FLOOR, rx, ry, px, py, dir)` — floor is the second
  argument, and passing `rx` there silently lands you in the wrong room.
- MAPS is a Map keyed by map id, holding room definitions under `roomDefs`,
  whose grids are under `map`. Cutscenes export as `STORY_CUTSCENES`.
- Equipped items are `progress.equipB` / `progress.equipA`; `giveItem` comes
  from `src/game/progress.js`. `progress.seed` is the root of every random
  decision the run makes — `newProgress(name, seed)` pins it.
- After `room.setTile` you must call `room.invalidate()`.
- Keys are KeyZ = B and KeyX = A (`src/core/input.js`), Enter = START.
- `game.tryPushBlock(tx, ty, dx, dy)` takes the BLOCK's tile, not the player's.
- Reset `g.mode` to 'play' and refill hearts between probes, or the first room
  that kills a parked player drops the run into gameover.
- Park probes on CLEAR floor.
- `newGame` does NOT grant the sword — the intro cutscene does. A probe that
  clears the cutscene must `giveItem(g.progress, 'sword', 1)` itself, or every
  sword input is silently swallowed by `useEquipped` and the probe looks like a
  broken feature rather than a broken setup.
- Reading a feel constant from inside a harness: `await import('/src/data/feel.js')`
  in the page. Prefer that to writing the number down in the tool — a frame
  budget hard-coded against a constant rots the moment the constant moves, and
  `check-gates.mjs` had exactly that bug.
