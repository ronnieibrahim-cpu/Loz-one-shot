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

### 1. The item art — mostly LANDED (S34-S36); read before restarting it

Asked for directly and largely done. Landed: the rupees derived from the
extracted HUD gem; the bomb drop pointed at the extracted bomb; the heart and
heart piece rebuilt from the extracted `hud_heart4`; the fairy EXTRACTED off
`oracle-seasons-fairies.png` with both wing frames; the six Essences made six
bells in six regional palettes. Plus `tools/check-rippers.mjs`, which is what
now enforces "never hand-edit a generated file".

**The gear grid is surveyed and there is nothing left on it.** All 37 cells are
named in a table at the top of `docs/ART-BACKLOG.md`. Of the 29 unextracted,
28 are Oracle items this game does not have — feathers, capes, boomerangs,
hooks, flutes, rings, bracelets — and our roster is ours by design. The one
that looked shared (r5c5, taken for a flask) was extracted, rendered against
the hand-drawn bottle and **rejected**; do not redo it.

What is genuinely left, in order:

  * **The held-item and projectile strips** on the gear sheet, below the grid:
    Link's hand holding a sword, hookshot, rod, boomerang, bombs and seeds,
    plus boomerang arcs and chain links. All hand-drawn here. This is now the
    largest extraction target in the repo. `tools/rip-fairies.py` is the worked
    example — a small, single-purpose ripper emitting its own generated module,
    installed after the hand-drawn pack so it takes the name.
  * **Craft, not extraction, on everything else.** What is still hand-drawn is
    what SHOULD be: the items original to this game. The job there is register —
    outlines, three tones, silhouette — measured against the extracted art
    beside it, not replaced by it.
  * **`oracle-seasons-maku-tree.png` is not the easy job** an earlier prompt
    implied. The Maku Tree is ~169x96 px drawn into its screen's tilemap;
    `npc_maku` is a 16x16 NPC. That is a screen redesign, not an art swap.

### 1b. YOU CANNOT WALK OUT OF A DUNGEON — **LANDED IN S33, do not redo**

The dungeon mouths were one 16px tile against a 10px hitbox: three of thirteen
start positions across the Grotto's entrance room could leave. Fixed by
`Game.doorwayPull` (one rule, every warp in the game, caves and houses
included) plus a two-tile `dMouth` arch at all six mouths, both halves warping.
`tools/check-exits.mjs` is the new checker — 192 assertions, in CLAUDE.md's
table, proved red (12 failures) against the old door. Full account in
`docs/NEXT-SESSION.md` S33.

The one thing still open from that entry — nothing floods a dungeon's interior
for STRANDED FLOOR the way `check-strands` does the overworld — is now closed;
see item 7.

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

  - ~~Does Nereth's motivation in `nerethIntro` pay off in `ending`?~~ Asking
    this question found something bigger, **fixed in S43**: `ending` was
    never wired to anything. Nothing in the whole game ever called
    `startCutscene('ending')` — a player who beat Nereth and collected the
    sixth Essence got the essence6 card and then just kept playing, with no
    THE END. `Game.claimEssence` now chains into it when the sixth Essence
    completes the set (`tools/shoot-cutscene.mjs --ending` proves the real
    handoff, not just that the scene plays in isolation). The THEMATIC
    question this bullet actually asked is answered in `docs/NEXT-SESSION.md`
    S43 too: yes, loosely — the ending's "boring, isn't it" line about the
    tamed sea directly echoes Nereth's own "the sea was told what to do...
    never once asked", played straight rather than examined. Still open:
    whether Nereth gets a death line at all (see S43's last section).
  - ~~Do the six Essence title cards name six DISTINCT ideas, each matching
    its own dungeon?~~ Read, S43: yes — Shallow/Coral/Bog/Cliff/Drowned/
    Drowned King's Bell map 1:1 onto Grotto/Spire/Sanctum/Cistern/Shrine/Keep,
    and each essence's body text is a different KIND of beat (awakening,
    villain noticing the hero, the world visibly stabilising, escalating
    threat, foreboding, completion) rather than the same sentence six times.
    No bug; nothing to fix.
  - ~~Do townspeople's two-state lines track world progress coherently, or
    just toggle?~~ Read against their `needEssences` gates, S43: yes, and
    better than "coherent" — there is a real thread. `reefFisherAfter`
    ("both ways now. That is worse"), `fisher1After` ("a punctual sea is no
    use to me at all"), `salterElderAfter` ("I would not call that good
    news") and the `ending` cutscene itself ("boring, isn't it") all make the
    SAME point from different mouths: restoring the tide to order is not
    unambiguously good news to the people who adapted to it broken. That is
    a deliberate, consistent piece of theme, not a toggle. The Farore thread
    also sequences correctly — villagers notice she has stopped coming down
    to the shrine at 3 essences (`villager2After`), and Farore's own second
    line at her private shrine, gated at 5, confirms why. No bug found; if a
    future session wants to extend this, the "restoration has a cost" thread
    is the one to write more of, not against.
  - ~~Is the Coastwise Chain a story, or a fetch quest with a proof
    attached?~~ Read all eleven links, S43: a story. Every trader's item and
    reply are specific to who they are (Sennit settling an argument with her
    mother about tide depth, Wick paying "the wood" that "takes payment and
    does not take promises", Yarrow's jar surviving "forty years of brine"),
    not generic hand-offs. `check-trade.mjs` already proves the mechanics;
    the writing independently holds up.

Goal 2 territory: mechanics, items, dungeons and story are OURS. And **do not
"fix" the title screen** — it says THE LEGEND OF ZELDA — ORACLE OF TIDES in the
Oracle series' own layout on purpose. A previous session stripped it by
misreading Goal 2 as a rule about names. It is a rule about design.

### 7. Smaller, fully scoped

- ~~Extend `check-strands.mjs` to the dungeons.~~ **DONE, S42.**
  `tools/check-dungeon-strands.mjs` (new), sharing its flood with
  `walk-dungeons.mjs` via `tools/lib/dungeon-flood.mjs` rather than
  re-deriving it a second time. Found 9 regions, 12 cells, all legitimate on
  first run — see `docs/NEXT-SESSION.md` S42.
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
