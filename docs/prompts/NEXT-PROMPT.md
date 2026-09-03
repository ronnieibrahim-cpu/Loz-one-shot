# Next session — Oracle of Tides: polish pass across map, art, story and dungeons

Repo `ronnieibrahim-cpu/Loz-one-shot`. Branch from `main`; one prompt = one
session = one branch.

**Read first, in this order:** `CLAUDE.md` (its hard rules and its verification
table govern everything below), `docs/NEXT-SESSION.md` §S23 and §S22 at the top
of the file, the new entries at the top of `docs/HANDOFF.md`'s hard-won-lessons
section, `docs/DUNGEON-STATUS.md` (the board), and `docs/ART-BACKLOG.md`'s top
entry. Before designing anything, run `git ls-remote --heads origin` and look
for a branch that has already done it — a finished dungeon was very nearly
built twice.

## Where things stand

The tree-crown collision fix (`Room.quadCanopySolid`) and its ~230-line
overworld repair are landed and audited. The Dredge Line region gate was
independently re-proved cell by cell against the pristine pre-change tree and
is intact. `tools/check-strands.mjs` is new and is now in CLAUDE.md's table: it
catches a room quietly losing part of its own floor, which every other tool in
that table is blind to. Everything in the table is green, including
`replay.mjs` 51/51 to the pixel, `check-playthrough` 21/21, and
`watch-cutscenes` 13 scenes / 0 faults.

Since then (S24) the four per-dungeon Oracle of Seasons background sheets are in
`assets/sheets/` and credited; `rip-dungeon-themes.py` reads more than one sheet;
d4 Cliffside Cistern's walls were drawing as gold scribble and now draw as the
source's stud columns (the quantiser was remapping dropped colours by luminance,
which is hue-blind, and swapped blue for gold); `check-tilesets.mjs` now asserts
no dungeon draws two of its themed roles identically; and `replay.mjs`'s
`diffState` could not compare an object field at all.

**Re-run the suite yourself rather than trusting that list. If anything is red,
that is the job.**

## The work, in priority order

Do not attempt all of these. Pick the first one or two that fit the session,
finish them properly, and leave the rest better described than you found them.

### 1. Look at the reshaped screens. (Highest value; blocked on nothing.)

This is the only outstanding item from S23 and it is the one no tool can do.
The batch corner fix put a `#` cliff corner into roughly 158 screens, and S23
put two stone corners into The Gyre (`overworld,7,3`). Connectivity and
cell-level reachability are both proved. **Register and composition are not.**
Nobody has asked whether a stone corner reads right at the bottom of a wood
screen, or whether the treelines still frame the way the Oracle games frame.

`node tools/shoot-rooms.mjs --tide=0|1|2 overworld,7,3` — start at The Gyre,
then sample a wood screen, a marsh screen and a dune screen with the new
corners. Judge against `assets/sheets/` and `docs/ART-DIRECTION.md`. Goal 1 is
fidelity: if a corner reads as "someone patched a collision bug", fix the art,
not the collision. Where a sheet has the tile you need, **extract it** — do not
hand-draw what `assets/sheets/` already provides.

Note the 14 one-cell root pockets recorded in `tools/strands-baseline.json` are
deliberate and correct (they render as tree roots inside a two-row treeline and
hold no entity). If one ever needs removing, make the pocket SOLID — do not
reopen the canopy to reach it.

### 2. Route a second dungeon in `check-playthrough`.

`docs/DUNGEON-STATUS.md` is blunt about this: **D1 is played, and it is one
dungeon of six.** D2-D6 are "authored, flooded, and proved by models", and
CLAUDE.md is explicit that a model does not fight a boss, spend a key or press
a button — which is how seven hundred green assertions once described a world
that could not be finished. Extending `tools/playthrough-route.mjs` to walk D2
(Coral Spire, Brineglass Lens) end to end is the single highest-confidence
thing anyone can do to the project's correctness. Expect it to find something.

### 2b. Two small, fully-scoped jobs left ready to pick up.

Both are measured, both have their blast radius written down in
`docs/NEXT-SESSION.md` §S24, and neither is a research task:

- **`tools/rip-terrain.py` still has the hue-blind quantiser** that was fixed in
  `rip-dungeon-themes.py`. Applying the same one-line change was measured and
  reverted: it moves exactly four tiles, `bankCornerSE` and its three
  rotations/mirrors. That is live shore art in every region, so do it with eyes
  on — `node tools/shoot-rooms.mjs --tide=0|1|2 overworld,5,8` — and re-examine
  the `GROUND_MERGE` overrides at the same time, since one of them was a
  workaround for this exact bug and may now be making things worse.
- **50 replay baselines predate `beaten`/`heartPieces`** and `diffState` only
  walks the keys a baseline HAS, so those fields go unchecked there. Re-record
  deliberately, on a tree already known good, reading each diff — a wholesale
  re-record is how a regression gets blessed.

### 3. Land/land fringe art — `docs/ART-BACKLOG.md` item 1.

The land/water bank is done (S21). Grass-vs-sand-vs-mud-vs-stone is still a
hard pixel edge everywhere, and it is the most visible remaining break from the
source's look. It needs per-ordered-pair art and its own palette per pair.
This is the biggest genuine ART job left. Read S21's `tileEdgeArt` notes in
`src/world/tileset.js` before touching the autotiler.

### 4. Plot and character cohesion.

Least-audited area of the project. There is no `check-story.mjs` and it is not
obvious one can exist, but these are answerable by reading:

- Does Nereth's motivation as stated in `nerethIntro` actually pay off in
  `ending`? Watch both: `node tools/watch-cutscenes.mjs --strips`.
- Do the six Essence title cards name six distinct ideas, and does each match
  the dungeon it comes out of? (`check-text` caught these reading "I ? the
  Shallow Bell" for the project's whole life — the text is young.)
- Do the townspeople's two-state lines track world progress coherently, or do
  they just toggle? `check-dialogue` proves both states are *reachable*, never
  that the second one makes sense after the first.
- The Coastwise Chain (`check-trade`) is proved as a total order. Is it a
  STORY, or a fetch quest with a proof attached?

Anything you change here is Goal 2 territory: mechanics, items, dungeons and
story are **ours**. Do not borrow. And do not "fix" the title screen — it says
THE LEGEND OF ZELDA — ORACLE OF TIDES in the Oracle series' own layout on
purpose, and a previous session stripped it by misreading Goal 2 as a rule
about names. It is a rule about design.

### 5. Dungeon polish — D3 and D6.

`measure-boss-combat.mjs`: Nereth (D6) needs 11 hearts against an in-order
floor of 8, which the 24 heart pieces cover but only if the player finds 12 of
them. D3's evade result is still open per the last boss sweep. Neither is a
blocker; both are fairness questions, and `§4.2` applies — a robot beating a
boss is not a player beating a boss.

## Suggestions for later iteration (not this session)

- **Extend `check-strands` to the dungeons.** It only floods the overworld.
  `walk-dungeons` has the same room-keyed blind spot by construction.
- **A cell-level assertion inside `check-overworld` itself**, so the room-keyed
  `reached` set stops being a trap for a third time.
- **Three of the four new dungeon sheets are unused** (`dancing-dragon`,
  `explorers-crypt`, `poison-moths-lair`). They are full-size per-dungeon rooms
  and are the obvious place to look for the land/land fringe art above, or for a
  theme that wants its own floor. Read the sheets README first: every one is two
  halves, the LCD half is the lighter/less saturated one, and picking from the
  wrong half gives you art that will not sit with anything else in the project.
- **Inner-corner edge art** (`ART-BACKLOG` item 3) — the mask supports it,
  nothing defines it, and it currently degrades to a straight edge.
- **Reef and abyss water are deliberately unbanked** (`ART-BACKLOG` item 2);
  decide whether they want the earthen bank or a rock-specific one.
- **Nothing has played the game to the END.** When D2-D6 are routed, the
  playthrough harness becomes the thing CLAUDE.md says it should be.

## House rules

`main` is trunk. Update `docs/NEXT-SESSION.md` losslessly before you finish,
add anything expensive you learn to `docs/HANDOFF.md`, tick
`docs/DUNGEON-STATUS.md` if you touched a dungeon, run `npm run build` and
commit `dist/oracle-of-tides.html`, and **do not end green without
`check-playthrough.mjs`**. Commit messages describe what changed in the game,
not what changed in the code. Do not open a pull request unless asked.
