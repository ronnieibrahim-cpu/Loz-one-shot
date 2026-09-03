# Next session — Oracle of Tides: keep improving

Repo `ronnieibrahim-cpu/Loz-one-shot`. Branch from `main`; one prompt = one
session = one branch. Do not open a pull request unless asked.

**Read first, in this order:** `CLAUDE.md` — its hard rules and its verification
table govern everything below — then `docs/NEXT-SESSION.md` §S26, §S25 and §S24
at the top of the file, the new entries at the top of `docs/HANDOFF.md`'s
hard-won-lessons section, `docs/ART-BACKLOG.md`'s top entry, and
`docs/DUNGEON-STATUS.md` (the board) if you touch a dungeon.

Before designing anything, run `git ls-remote --heads origin` and look for a
branch that has already done it. A finished dungeon was once very nearly built
twice, and 72 stale branches are still on the remote; `main` is a content
SUPERSET of all of them and merging one would delete tens of thousands of
lines. Do not merge old branches to "recover" work — it is already in `main`.

## Where things stand

`main` is green on everything in CLAUDE.md's table plus `check-tilesets` and
`check-strands`: `test.mjs` 83/83, `replay.mjs` 51/51, `check-playthrough`
21/21, `watch-cutscenes` 13 scenes / 0 faults, build + `check-build` OK.

Recent sessions fixed: a severed room lobe that hid the sign teaching the
Cleats (S23, and `check-strands.mjs` now catches that class); d4's walls, which
drew as gold scribble because the ripper's colour reduction was hue-blind
(S24); 155 doorway corners that were masonry slabs standing in treelines (S25);
and shallow water plus every shoreline in the game, both of which were drawn as
ladders (S26).

**Re-run the suite yourself rather than trusting that. If anything is red, that
is the job.**

## The work, in priority order

Pick the first one or two that fit the session. Finish them properly and leave
the rest better described than you found them.

### 1. The shoreline rim — the one visible thing that is fully specified

S26 removed the shore bank because the art was a brick retaining wall lifted
from an ornamental pool, and it laid a wooden ladder along every water's edge
in the world. The boundary is now a hard colour seam, which is honest but is
`ART-BACKLOG`'s original complaint.

**The answer is known.** A natural pond on the Seasons spring map (~1827,1066 —
crop the region and look at 4x) shows there is NO bank tile: the water meets the
sand directly and the whole transition is a ONE-PIXEL DARK SCALLOPED RIM on the
WATER cell. The land is untouched. S21 had it backwards.

**The blocker is an engine change, not art.** `Room.render` does
`if (d.anim) { this.animCells.push(...); continue; }` — an animated tile skips
the static path, and `drawAnim` paints it with `tileArt(c.def, frame)`, which
never consults `artAt`. Water is animated, so `edgeArt` on water is silently
ignored today. Wire it up without knowing that and it looks like the art failed.

So: teach the animated path to resolve `artAt` per cell (decide the per-frame
cost and how it interacts with the render cache — `artAt` is currently only
called while filling the static canvas); then produce 4 edges + 4 outer corners,
remembering water has THREE animation frames, so up to 24 grids. The rim is a
1px dark outline and deriving it from the water frames in `rip-terrain.py` is
plausible — that is not the hard part. Screenshot `overworld,5,8` at all three
tides before believing it.

### 2. Route a second dungeon through `check-playthrough`

`docs/DUNGEON-STATUS.md` is blunt: **D1 is played, and it is one dungeon of
six.** D2-D6 are "authored, flooded, and proved by models", and CLAUDE.md is
explicit that a model does not fight a boss, spend a key or press a button —
which is how seven hundred green assertions once described a world that could
not be finished. Extending `tools/playthrough-route.mjs` to walk D2 (Coral
Spire, Brineglass Lens) end to end is the highest-confidence correctness work
available. Expect it to find something.

### 3. Read the remaining regions as compositions

S25 fixed one motif that repeated 160 times, and found it only by LOOKING —
no tool in the table can see "this reads wrong". Dunes, cliffs, salt, reef,
coral and abyss have been checked for connectivity and for that one fault, not
read as pictures. `node tools/shoot-rooms.mjs --tide=0|1|2 <room>`; judge
against `assets/sheets/` and `docs/ART-DIRECTION.md`. Where a sheet has the
tile, EXTRACT it — do not hand-draw what `assets/sheets/` already provides.

### 4. Land/land fringe art — `ART-BACKLOG` item 1

Grass vs sand vs mud vs stone is still a hard pixel edge everywhere. Needs
per-ordered-pair art and its own palette per pair. Read S21's `tileEdgeArt`
notes in `src/world/tileset.js` first. Note the S26 finding above may apply
here too: check what the source actually does at a land/land join before
assuming a transition tile exists.

### 5. Plot and character cohesion

Least-audited area. No `check-story.mjs` exists and it is not obvious one can,
but these are answerable by reading and watching:

- Does Nereth's motivation in `nerethIntro` pay off in `ending`?
  `node tools/watch-cutscenes.mjs --strips` (~10 minutes).
- Do the six Essence title cards name six distinct ideas, each matching its
  dungeon? The text is young — `check-text` caught six of them reading
  "I ? the Shallow Bell" for the project's whole life.
- Do townspeople's two-state lines track world progress coherently, or just
  toggle? `check-dialogue` proves both states are REACHABLE, never that the
  second makes sense after the first.
- Is the Coastwise Chain a story, or a fetch quest with a proof attached?

Goal 2 territory: mechanics, items, dungeons and story are OURS. And do not
"fix" the title screen — it says THE LEGEND OF ZELDA — ORACLE OF TIDES in the
Oracle series' own layout on purpose. A previous session stripped it by
misreading Goal 2 as a rule about names. It is a rule about design.

### 6. Smaller, fully scoped

- **Extend `check-strands.mjs` to the dungeons.** It floods the overworld only;
  `walk-dungeons` has the same room-keyed blind spot by construction.
- **Replay baselines predating `beaten`/`heartPieces`.** ELEVEN files live in
  `tools/replays/` (the 51 in the output is assertions, not files); 3 now carry
  those fields. `diffState` only walks keys a baseline HAS, so the rest go
  unchecked. Re-record deliberately on a known-good tree, reading each diff — a
  wholesale re-record is how a regression gets blessed.
- **Three unused dungeon sheets** (`dancing-dragon`, `explorers-crypt`,
  `poison-moths-lair`). Read the sheets README first: every sheet is two halves,
  the LCD half is the lighter/less saturated one, and picking from the wrong
  half gives art that will not sit with anything else.
- **D3 and D6 boss fairness.** Nereth needs 11 hearts against an in-order floor
  of 8 (the 24 heart pieces cover it, but only if the player finds 12). D3's
  evade result is open. `§4.2` applies: a robot beating a boss is not a player
  beating a boss.

## Do NOT redo these — measured and rejected

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
  changes ONLY `bankCornerSE` and its three rotations — which nothing draws
  while the bank is off. Moot until the shore returns; fix it then, in the same
  pass, and re-examine the `GROUND_MERGE` overrides (one was a workaround for
  this exact bug).
- **The 8 bank tiledefs in `validate`'s unreachable list.** Correct and
  deliberate — that warning is for "a vocabulary waiting for a place", its own
  words. Do not delete them to clear it.

## House rules

`main` is trunk. Update `docs/NEXT-SESSION.md` losslessly before you finish,
add anything expensive you learn to `docs/HANDOFF.md`, tick
`docs/DUNGEON-STATUS.md` if you touched a dungeon, run `npm run build` and
commit `dist/oracle-of-tides.html`, and **do not end green without
`check-playthrough.mjs`**. Commit messages describe what changed in the game,
not what changed in the code.

Two habits worth copying from the last four sessions: when a checker and your
eyes disagree, screenshot it — every real win came from looking. And when an
art change fails a replay, prove it is art before re-recording: same frame
count, same room changes, EVERY CHECKPOINT matching, only `probePix` moved.
