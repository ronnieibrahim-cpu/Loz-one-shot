# Next session — Oracle of Tides: keep improving

Repo `ronnieibrahim-cpu/Loz-one-shot`. Branch from `main` (currently
`d05424e`); one prompt = one session = one branch. Do not open a pull request
unless asked.

**Read first, in this order:** `CLAUDE.md` — its hard rules and its
verification table govern everything below — then the top four entries of
`docs/NEXT-SESSION.md` (§S32, §S31, §S30, §S29), the new entries at the top of
`docs/HANDOFF.md`'s hard-won-lessons section, `docs/ART-BACKLOG.md`, and
`docs/DUNGEON-STATUS.md` (the board) if you touch a dungeon.

Before designing anything, run `git ls-remote --heads origin` and look for a
branch that has already done it. A finished dungeon was once very nearly built
twice, and 70-odd stale branches are still on the remote; `main` is a content
SUPERSET of all of them and merging one would delete tens of thousands of
lines. Do not merge old branches to "recover" work — it is already in `main`.

## Where things stand

`main` is green on everything in CLAUDE.md's table: `test.mjs` 83/83,
`replay.mjs` 51/51, `check-playthrough` 21/21, `check-respawn` 64/64,
`check-items` 91/91, `check-hearts` 114/114, plus `check-tilesets`,
`check-strands`, `watch-cutscenes` and `check-build`. **Re-run the suite
yourself rather than trusting that. If anything is red, that is the job.**

The last session was driven by a PERSON PLAYING, and that is the important
context for this one. In a single sitting they found three real faults that a
suite of several hundred assertions was green through:

  - the sword appeared fully extended on the frame the button went down and
    never travelled, so a press did not read as a swing (fixed, S30);
  - every item description in the pause menu was cut at 33 characters with an
    ellipsis, losing the second half of nine of them — including every "press
    again to recall it" clause, the only place the game says how to get a
    thrown item back (fixed, S31);
  - a death after pressing Continue put the player back in the room the save
    was made in rather than at the dungeon mouth, because loading a save
    counted as arriving somewhere new and restamped the respawn point (fixed,
    S32).

The third one needed the player to QUIT AND COME BACK, a verb the harness had
never had. **Assume there are more of these, and assume looking will find them
faster than reasoning will.** When you fix one, add the assertion that would
have caught it, and prove the assertion goes red against the old code.

## The work, in priority order

Pick the first one or two that fit the session. Finish them properly and leave
the rest better described than you found them.

### 1. YOU CANNOT WALK OUT OF A DUNGEON UNLESS YOU ARE LINED UP ON ONE TILE

Reported by a person stuck inside Tidewash Grotto who could not find the way
out at all. Every dungeon mouth room in `src/data/dungeons-a.js` and
`dungeons-b.js` ends in `'####/#####'`: a single `dStairs` tile at x=4 of the
bottom wall row, with a `warps` entry pointing back to the overworld. Link's
collision rect is 10px wide, so the door only admits him from roughly x=56..68
of a 16px tile.

Measured in the live engine in `d1/0,3,7` (Grotto Mouth), holding DOWN:

    start x = 60, 64, 68  ->  exits to the overworld
    start x = 72, 76, 80  ->  stops dead at y=97 against the wall, never leaves

The room's own north opening is TWO tiles wide, so a player walking down the
middle of the room — which is where that opening puts him — meets blank blue
brick beside the stairs. All six dungeons share this grid (Grotto, Spire,
Sanctum, Shrine and the rest).

Two things are wrong and both want fixing:

  (a) **It does not read as a door.** Look at how the source games draw a
      dungeon entrance: an arch two tiles wide, framed, reading as an opening
      in the wall rather than a tile laid into it. `docs/ART-DIRECTION.md` and
      `assets/sheets/` FIRST — if the Seasons dungeon sheet has a mouth or
      arch tile, extract it via `tools/rip-dungeon-themes.py` per CLAUDE.md's
      extraction rule rather than drawing one.
  (b) **A one-tile warp the player must be aligned on is a movement problem
      regardless of art.** Decide whether the answer is a wider door, a wider
      warp trigger, or a doorway that pulls the player to its centre the way
      the source games do at a stairwell — and whichever it is, it must be ONE
      RULE applied at every dungeon mouth, not six edits.

Then close the checker gap that let this live: **nothing proves a dungeon can
be LEFT.** `walk-dungeons.mjs` floods rooms, `check-towns.mjs` proves town
doorways round-trip ON FOOT, and no tool asks the same question of a dungeon.
Write the assertion (extend `walk-dungeons` or add a tool — your call, but say
which in its header and add it to CLAUDE.md's table): for every dungeon,
entering from the overworld and walking the entrance room's reachable floor
must reach a tile that warps back out, driven in the real engine with a real
player, not modelled. **Prove it goes RED against today's one-tile door before
you widen it.** Check caves and house interiors for the same shape while you
are there.

### 2. Five of the six dungeons have never been PLAYED

`docs/DUNGEON-STATUS.md` is blunt: D1 is played, and it is one dungeon of six.
D2-D6 are "authored, flooded, and proved by models", and CLAUDE.md is explicit
that a model does not fight a boss, spend a key or press a button — which is
how seven hundred green assertions once described a world that could not be
finished. Extending `tools/playthrough-route.mjs` to walk D2 (Coral Spire,
Brineglass Lens) end to end is the highest-confidence correctness work
available. Expect it to find something.

**Read `docs/NEXT-SESSION.md` §S28 before attempting this.** A previous session
got a live-engine route all the way through Coral Spire's boss door — every
required room, both Small Keys, the Lens, the Bombs, a heart piece, the Boss
Key — in a scratch harness that was never committed. S28 names exactly which
rooms are solid and saves re-deriving the switch puzzle, the locked-door
positions and both `lensRoom` fork sequences from scratch. It also names a real
general gap in `dTravel`: it cannot path through a `size:[w,h]` room's
non-anchor exits, which hits both Reefguard Hall and Spire Ascent. And it
records the trap that cost that session most of its time: `['equip','lens','B']`
silently displaces the sword, so every scripted swing afterwards presses the
Lens button and the fight lands no damage for a reason that looks like room
geometry.

### 3. Nobody knows whether the bosses are FAIR

`check-bosses.mjs` runs in GOD MODE and says so in its own output: it proves
each boss spawns in its declared room and that its weak point opens at its
design tide. It does not prove a player can win. Two specific worries already
on the record:

  - Nereth needs about 11 hearts of survivability against an in-order floor of
    8. The 24 heart pieces cover it, but only if the player finds 12 of them.
  - D3's evade result is open.

`§4.2` applies: a robot beating a boss is not a player beating a boss. If you
take this, `tools/measure-boss-combat.mjs` is the starting point, and the
honest deliverable is a measurement plus a judgement, not a green tick.

### 4. Land meets land as a hard pixel edge, everywhere

The water's edge was fixed in S27 and looks right — `waterS` carries a 1px dark
scalloped rim derived in `rip-terrain.py`, and `Room.animArtAt` was the engine
change that made `edgeArt` on an animated tile work at all. Grass against sand,
sand against mud, mud against stone are all still abrupt. This is
`ART-BACKLOG` item 1: it needs per-ordered-pair art and its own palette per
pair. Read S21's `tileEdgeArt` notes in `src/world/tileset.js` first, and note
S26's lesson may apply here too — **check what the source actually does at a
land/land join before assuming a transition tile exists at all.** S21 assumed
one for the shore and was wrong in the opposite direction.

Two known, screenshotted, unfixed edges of the shore work, if you are in there
anyway: a water cell one tile wide with land on both opposite sides shows the
rim on only one of its two facing edges (`tileEdgeArt`'s "opposite pair"
degrade — would need `up+down`/`left+right` in `EDGE_ART_KEYS`); and salt
flats, ice floors and reef/abyss water were never audited for whether they want
a rim of their own.

### 5. Whole regions have never been READ AS PICTURES

Dunes, cliffs, salt, reef, coral and abyss have been checked for connectivity
and for one specific fault, never looked at as compositions. The one time
somebody did that for the woods they found a motif repeated 160 times that
every tool in the table was green through. `node tools/shoot-rooms.mjs
--tide=0|1|2 <room>`; judge against `assets/sheets/` and
`docs/ART-DIRECTION.md`. Where a sheet has the tile, EXTRACT it — do not
hand-draw what `assets/sheets/` already provides.

### 6. The story is the least-audited thing in the project

No `check-story.mjs` exists and it is not obvious one can. These are answerable
by reading and watching:

  - Does Nereth's motivation in `nerethIntro` pay off in `ending`?
    `node tools/watch-cutscenes.mjs --strips` (~10 minutes).
  - Do the six Essence title cards name six DISTINCT ideas, each matching its
    own dungeon? That text is young — `check-text` caught six of them reading
    "I ? the Shallow Bell" for the project's whole life.
  - Do townspeople's two-state lines track world progress coherently, or just
    toggle? `check-dialogue` proves both states are REACHABLE, never that the
    second makes sense after the first.
  - Is the Coastwise Chain a story, or a fetch quest with a proof attached?

Goal 2 territory: mechanics, items, dungeons and story are OURS. And **do not
"fix" the title screen** — it says THE LEGEND OF ZELDA — ORACLE OF TIDES in the
Oracle series' own layout on purpose. A previous session stripped it by
misreading Goal 2 as a rule about names. It is a rule about design.

### 7. Smaller, fully scoped

- **Extend `check-strands.mjs` to the dungeons.** It floods the overworld only;
  `walk-dungeons` has the same room-keyed blind spot by construction — a room
  reduced to a four-tile doorway reads as fully walkable.
- **Replay baselines predating `beaten`/`heartPieces`.** Eleven files live in
  `tools/replays/` (the 51 in the output is assertions, not files); only some
  carry those fields, and `diffState` only walks keys a baseline HAS, so the
  rest go unchecked. Re-record deliberately on a known-good tree, reading each
  diff — a wholesale re-record is how a regression gets blessed.
- **Three unused dungeon sheets** (`dancing-dragon`, `explorers-crypt`,
  `poison-moths-lair`). Read `assets/sheets/README.md` first: every sheet is
  two halves, the LCD half is the lighter/less saturated one, and picking from
  the wrong half gives art that will not sit with anything else.

## Do NOT redo these — measured and rejected

- **The pause menu's item grid being covered by the description panel.** A
  previous handoff listed this as a priority. It is NOT REAL: only 14 items are
  `equippable`, the grid is five columns, so it is never more than three rows
  and never reaches the panel at y=106. Verified with every item granted.
- **A "regular pitch" checker for terrain art.** Period 8 is universal and
  correct (a 16x16 tile is four 8x8 hardware tiles); at sub-8 the old ladder
  `waterS` and the perfectly good `waterD` BOTH score 50%. It cannot
  discriminate. The real difference is contrast and whether the repeat forms a
  continuous line.
- **Replacing `waterD`.** Every dark-blue seamless water on both overworld
  sheets is MORE banded than ours. The hand-drawn tile beats the source here.
- **Depth-discontinuity checks.** Dry adjacent to deep is 2,095 cells at high
  tide and is simply what a coast is without a beach.
- **The `rip-terrain.py` hue-blind quantiser.** Still unfixed there, but it now
  changes ONLY `bankCornerSE` and its three rotations, which nothing draws.
  Moot; if it ever matters again, re-examine the `GROUND_MERGE` overrides in
  the same pass (one was a workaround for this exact bug).
- **The 8 bank tiledefs in `validate`'s unreachable list.** Correct and
  deliberate — that warning is for "a vocabulary waiting for a place", its own
  words. Do not delete them to clear it.
- **The sword's swing arc as a uniform rotation.** `SWING_START_DIR`/
  `SWING_END_DIR` in `src/game/player.js` are deliberately NOT one: facing left
  is the MIRROR of facing right, so both go over the shoulder and finish at the
  ground. Rotating them uniformly makes Link scoop upward facing right. This
  was tried and photographed.

## House rules

`main` is trunk. Update `docs/NEXT-SESSION.md` losslessly before you finish,
add anything expensive you learn to `docs/HANDOFF.md`, tick
`docs/DUNGEON-STATUS.md` if you touched a dungeon, run `npm run build` and
commit `dist/oracle-of-tides.html`, and **do not end green without
`check-playthrough.mjs`**. Commit messages describe what changed in the game,
not what changed in the code.

Three habits worth copying from the last several sessions:

  - **When a checker and your eyes disagree, screenshot it.** Every real win
    came from looking. The established way to photograph an exact frame is
    `window.__harness.takeOver()`, set the state you want, `step`, then
    `game.draw()` and screenshot the canvas — deterministic, and it does not
    race the render loop the way pressing keys and waiting does.
  - **When an art change fails a replay, prove it is art before re-recording:**
    same frame count, same room changes, EVERY CHECKPOINT matching, only
    `probePix` moved.
  - **A five-line change to the movement path is never a five-line change**,
    because every recorded baseline is downstream of it. Budget for the
    re-record and read the diff rather than blessing it.
