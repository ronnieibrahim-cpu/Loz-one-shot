# Handoff — Oracle of Tides

State of the project as of this handoff, and what a fresh session needs to know.

## Where things stand

Branch: **`claude/oracle-tides-polish-aqche8`** — the single canonical branch.
It continues `claude/oracle-tides-polish-grjnhj`, which is now behind it.
Everything is committed and pushed.

Earlier branches (`claude/zelda-style-game-piqt8v`,
`claude/zelda-boss-behavior-jgbfwo`, `claude/oracle-tides-boss-music-4c24tm`)
are the line this was built on and are all behind it, not parallel work.
`main` is an empty README.

**The engine is complete and verified.** `node tools/test.mjs` boots the game in
headless Chromium and passes 35 assertions covering boot, movement, sword
combat, contact damage, the tide, room transitions, cave warps, the pause menu,
save/load round-tripping, death and respawn. Keep it green.

**`node tools/validate.mjs` is clean** — no problems, only warnings for the
sprite packs still to be drawn.

| Area | State |
|---|---|
| Engine, renderer, audio, save, menus, cutscene runner | Done |
| Tide system and tide-variant tiles | Done |
| Player, combat, items, enemy framework, boss framework | Done |
| Link sprites | Done — extracted from the Oracle of Ages sheet |
| NPC sprites (9 of 11) | Done — extracted from the Oracle of Seasons sheet |
| **The four peoples (14 frames)** | **Done** — `tools/rip-races.py`, off the non-human races sheet |
| Terrain tiles, HUD | Done — hand-drawn |
| **Enemy sprites (56)** | **Done** — extracted from the Oracle of Seasons enemy sheet |
| **Enemy roster (22 types)** | **Done** — `src/data/enemies.js` |
| **Overworld** | **Done — all 120 screens** |
| **Dungeons 1-8** | **Done — 179 rooms, all solvable** |
| **Effects + item icons (83)** | **Done** — hand-drawn |
| **Pickups, objects, projectiles (37)** | **Done** — hand-drawn |
| **Boss/miniboss behaviour (16)** | **Done** — `src/data/bosses.js` |
| **Story and dialogue** | **Done** — 20 ids, 15 cutscenes |
| **Boss/miniboss art (49)** | **Done** — redrawn by hand |
| **Music (22 tracks)** | **Done** — 14 looping + 8 jingles, two dungeon themes wired |
| **Dungeon room puzzles** | **Done** — every room now has something in it |
| **Small Key economy** | **Done** — keys equal locks in all eight dungeons |
| **Marsh gate on Bombs** | **Done** — `cliffCracked`, both entrances |
| **Terrain art (9 tiles)** | **Done** — extracted, `tools/rip-terrain.py` |
| **One-way ledges** | **Done** — 88 runs, all four cardinals, 36 tile variants |
| **Region gates (5 of 9)** | **Done** — Bombs, Boomerang, Gloves, Feather, Bracelet |
| **Terrain art (10 tiles)** | **Done** — 9 ground + `flowers`, `tools/rip-terrain.py` |
| **itemGet / secret / heartPiece** | **Done** — wired to their moments |
| **Single-file build** | **Done** — `npm run build` → `dist/oracle-of-tides.html`, runs from `file://` |

### Five region gates are now machine-checkable

`check-overworld.mjs` proves five of the nine GAME-PLAN gates in both
directions, and `check-gates.mjs` proves four of them in-engine with a live
player. Roc's Feather (`chasm`, Coral Reef) and the Power Bracelet (`boulder`,
Cliffs of Kell) were added this session.

**Zora's Flippers and the Hookshot were built and reverted.** Both are recorded
under "The two gates that cannot be tiles" below; neither is a placement
problem and neither should be retried without reading that section first.

### Region gates and ledges are done

All three tile-expressible region gates match GAME-PLAN.md, and one-way ledges
face all four cardinals with 88 runs placed. Two engine bugs surfaced doing it —
a projectile's rect never touching the solid tile it bounced off, and a dangling
`player.boomerang` that disabled the item for the rest of a run — both recorded
under "Hard-won lessons" and both now covered by `tools/check-gates.mjs`.

### The game is now completable end to end

The blocker is gone: all sixteen bosses and minibosses are implemented and
verified beatable. `node tools/test.mjs` reports **0 unauthored art names**,
down from 17. What is left is polish — boss art and music — not structure.

## The two documents that matter

- **`docs/GAME-PLAN.md`** — authoritative. Region layout on the 12x10 overworld
  grid, all eight dungeons with their map ids, items, bosses, minibosses,
  overworld entrance screens and tide themes, the item progression table, and
  the damage/HP numbers. Content that disagrees with this is wrong.
- **`docs/ART-DIRECTION.md`** — binding for anything visual. Declares
  `assets/sheets/` the canonical art reference, gives the style rules measured
  from those sheets, and sets the rule: extract when a sheet has it, draw to
  match when it does not. New assets are held to the same standard as extracted
  ones.
- **`docs/briefs/AGENTS.md`** — a complete authoring spec per work area,
  sections A through J. Each section names the one file to edit and how to
  verify. Section J documents the sprite-sheet extraction workflow.
- **`docs/NEXT-SESSION.md`** — a ready-to-paste prompt for a fresh session,
  naming the branch, the two remaining jobs and how to prove them. Start there
  if you are picking this up cold, and keep it current as work lands.

## Tooling

```sh
npm run dev                          # play it at localhost:8080
node tools/validate.mjs              # structural checks, no browser
node tools/validate.mjs --strict     # also fail on unauthored sprites
node tools/validate.mjs --pack=enemies   # scope the sprite-coverage check
node tools/test.mjs --shots          # 35 assertions + screenshots
node tools/preview.mjs enemies --scale=6  # contact sheet of a sprite pack
node tools/scan-sprites.mjs --skip-bosses # rows split or floating off the body
python3 tools/rip-enemies.py         # regenerate src/data/sprites-enemies.js
python3 tools/rip-terrain.py         # regenerate src/data/tiles-terrain.js
python3 tools/rip-races.py           # regenerate src/data/sprites-races.js
node tools/check-towns.mjs           # towns walk on foot at all three tides
PINCH=1 node tools/check-towns.mjs   # ...and print each town's cut tiles
node tools/preview.mjs --tiles --scale=2  # contact sheet of every tile
node tools/walk-dungeons.mjs         # every dungeon room + every ledge
node tools/check-overworld.mjs       # seams, border, tile-by-tile flood
node tools/check-overworld.mjs --bombs   # ...and the Marsh gate
node tools/solve-switches.mjs        # one push per block, every switch room
node tools/check-gates.mjs           # the two item gates, in-engine
node tools/find-ledges.mjs           # where a ledge can go without walling a room
node tools/check-overworld.mjs --items=bombs,boomerang,magnet
node tools/replay.mjs                # both committed replays, to the pixel
node tools/replay.mjs --record-all   # re-baseline them after a feel change
node tools/replay.mjs --shots        # ...and screenshot the final frame
```

`test.mjs` and `preview.mjs` take `--shot-dir=` and pick a random port, so
several can run at once.

**`test.mjs` used to be timing-flaky under CPU load. It is not any more, and a
failure is now yours.** It used to count frames with `requestAnimationFrame`
while `main.js`'s wall-clock loop kept stepping the game underneath, so
`hold(key, 30)` held the key for 30 frames *plus* every CDP round trip in
between; on a busy box Link walked roughly twice as far as the test thought,
and taps landed in whatever state that put him in. That produced the familiar
spurious cluster in "contact damage lands", "menu opens" and the save tab.

It now takes the clock off the loop with `window.__harness.takeOver()` — the
same fixed-step driver `tools/replay.mjs` uses — and pins the save seed with
`?seed=`, so every hold and tap lasts exactly the number of updates it says and
every run plays the same world. Do not go back to re-running it until it
passes; if it fails twice, it failed once.

### Environment setup a fresh container needs

1. `npm install`.
2. Playwright ships a browser revision the pre-installed Chromium does not
   match, so `tools/test.mjs` fails with "Executable doesn't exist". Point the
   expected path at the installed shell rather than downloading a browser:
   ```sh
   cd /opt/pw-browsers
   V=$(ls -d chromium_headless_shell-* | grep -v 1234 | head -1)
   mkdir -p chromium_headless_shell-1234/chrome-headless-shell-linux64
   for f in $V/chrome-linux/*; do
     ln -sf "/opt/pw-browsers/$f" "chromium_headless_shell-1234/chrome-headless-shell-linux64/$(basename $f)"
   done
   ln -sf /opt/pw-browsers/$V/chrome-linux/headless_shell \
     chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell
   touch chromium_headless_shell-1234/{INSTALLATION_COMPLETE,DEPENDENCIES_VALIDATED}
   ```
   (Check the revision `playwright` actually asks for in the error message; it
   was 1234 the first three times.) A headful `chromium.launch()` — which
   `check-build.mjs` uses, because a canvas assertion wants a real browser —
   needs the same shim for the full browser as well:
   ```sh
   mkdir -p /opt/pw-browsers/chromium-1234
   ln -sfn /opt/pw-browsers/chromium-1194/chrome-linux /opt/pw-browsers/chromium-1234/chrome-linux
   touch /opt/pw-browsers/chromium-1234/{INSTALLATION_COMPLETE,DEPENDENCIES_VALIDATED}
   ```
   `check-build.mjs` also falls back to `$CHROMIUM_PATH` or
   `/opt/pw-browsers/chromium` on its own if the launch throws, so it runs on an
   unshimmed container; the other harnesses do not, and still need the shim.
3. `pip install pillow` if you are going to run any of the `rip-*.py` tools.
   `rip-terrain.py` needs only Pillow; the scratch script that *finds* its
   source rectangles used numpy, but it is not committed and the tool does not
   import it.

## Determinism, feel constants and replays

`src/data/feel.js` is the single source of every timing and speed constant, and
`src/core/rng.js` is the single source of randomness. `docs/FEEL-SPEC.md` is
the why. Three things about them that are cheap to get wrong:

**Nothing in `feel.js` is `measured`.** Most values are guesses carried over
from the code as it stood and are labelled `guessed`. P3 turned a handful
`derived` — the walk speed and everything hanging off it, the room exit margin,
the jump arc — which means *computed from a stated constraint, with the
arithmetic in the comment*, not *checked against a reference*. `measured` means
someone frame-stepped a recording. It is not a synonym for "we like it". Do not
upgrade a tag because the game feels fine.

**Positions are 8.8 fixed-point** (`src/core/fixed.js`). `fx`/`fy`/`fz` are
integer subpixel accumulators; `x`/`y`/`z` are derived integer pixels. Assigning
`e.x = 40` is fine and goes through the accessor. `e.x += 0.5` is not — it
reads whole pixels, so a sub-pixel step rounds to nothing every frame and the
entity never moves. Add to `fx` or go through `moveEntity`, which takes
**subpixels**. Data-facing helpers convert px/f at their edge; see FEEL-SPEC.

**Nothing in a draw path may consume randomness.** `Game.draw` runs at display
rate; `Game.update` runs at a fixed 60 Hz step. A stream drawn from inside
`draw` advances a different number of times on a slow machine and the run
silently desyncs — no error, no warning, just two runs that disagree. The
screen shake was exactly this and now uses `noise1`, a pure hash of the frame
counter that consumes nothing. Any future draw-time jitter must do the same.

**`every(e, n)` hashes the entity id; it does not draw from a stream.** An
enemy asked both `every(e, 30)` and `every(e, 90)` would otherwise take its
phase from whichever call happened to run first, which depends on AI branch
order and is not stable. Same reasoning applies to anything else that wants a
stable per-entity constant.

**A new game seeds itself from `Date.now()`.** `newProgress()` defaults its
seed to the wall clock, which is right for play and useless for any tool that
needs the same world twice — P1's determinism stops at the front door unless
something pins it. `?seed=N` in the URL now does; `Game.seedOverride` carries
it, and `tools/test.mjs` passes it on every run. If you write a new harness,
pass the seed or you are testing a different game each time.

**A browser harness must own the clock, not count frames.** `main.js` steps the
game a variable number of times per animation frame, so a harness that fires a
key and then waits n frames holds that key for n frames *plus* however long its
own round trips took. That is a hidden multiplier on every movement in the
test, and it scales with how busy the machine is. `window.__harness.takeOver()`
exists for exactly this and both `replay.mjs` and `test.mjs` now use it. Real
Playwright key events are still fine — `keyboard.down` resolves once the event
is in the page, and nothing steps until you say so.

## Negative results — the boss-verb corpus, consolidated (2026-08-29)

**Read this section before touching `dBoss` in `tools/actor-runtime.mjs` or any
boss AI in `src/game/enemy.js`.** Between 2026-08-22 and 2026-08-28 SIXTEEN
parallel sessions branched from `main`, never merged, and re-ran each other's
experiments. Five independently found and fixed the same `Boss.phase` /
`Entity.phase` collision. Eight independently swept and reverted the same
dodge variants. Everything below was PAID FOR — in most cases three or more
times over. It is consolidated here so it is bought once.

The reconcile that produced this section deleted those branches. Their code is
either already on `main` or recorded verbatim below; nothing else on them was
unique. **The lesson of the pile itself: sessions branching from `main` in
parallel and never merging do not add up, they repeat. One session at a time,
merged before the next starts.**

### The ceiling is structural, not tactical — measured in god mode

**A 60,000-frame (1,000s of game time) UNLIMITED-HEALTH run of Gohmaraq still
sticks at 14 hp forever.** That is the finding that ends the dodge-tuning
programme: if infinite health does not win the fight, no dodge, no backoff and
no health buffer will, because survival was never the binding constraint.

The mechanism: `charge()` (`src/game/enemy.js`) fires the instant
`aligned() && distToPlayer() < range` holds, every frame the boss is not already
frozen. Gohmaraq's phase-2 `range` is **130px, which covers nearly the whole
arena**. So reaching melee distance — necessarily far inside 130px, and
necessarily aligned, because you walked at it — *also* satisfies the charge
trigger, which fires first. **The boss's melee-vulnerable range is a strict
subset of its charge-trigger range.** Once phase 2 begins, one charge's full
cycle chains straight into the next with zero idle frames between (traced
directly), so a "close in, wait for an opening, swing" verb never gets a window
longer than a couple of frames.

The one real gap is the charge's own **18-frame tell**, during which
`Enemy.update` does not run `spec.ai` at all, so the boss is 100% inert. It is
not enough on its own: measured charges triggered from **60–130px** out, and 18
frames of closing covers only **~25px**.

Supporting measurement (`next-session-cleanup-wtwg3g`), from a temporary
`window.__dbossTrace` bucketed after the fact and reverted before commit: of the
1,373 frames in the stall window (f720–f2093), **917 (67%) are spent in the
`b.charging` dodge branch**. Only 389 (28%) are in the approach-and-swing
branch, and those never landed a hit. **This is not swings whiffing — it is the
approach almost never getting to finish.**

### Eight dodge/approach strategies, ruled out by measurement

Every one of these was implemented, measured against a real-combat baseline, and
reverted. Do not re-derive them.

| # | Strategy | Result |
|---|---|---|
| 1 | Reactive ranged dodge (dodge when a shot is inbound) | A wash — no better than the plain chase |
| 2 | Two further ranged-dodge triggers | Neither beats the plain chase |
| 3 | `BACKOFF` distance sweep | Best value is a **mirage** — noise, not signal |
| 4 | Chaining a second sword swing per opening | **Net negative** — fewer hits than doing nothing |
| 5 | Opening-edge grace (widen the window's start) | Same instability as the dodge; reverted |
| 6 | Eye-open gating (swing only while the weak point is open) | Dead end — the eye is *already* open 69–100% of the fight |
| 7 | Free swing during a fresh charge tell / closing during the tell | No movement on the needle (the ~25px problem above) |
| 8 | Chase-then-wait-for-recovery after a dash | Gets to **7 frames short** of landing a hit, and no closer |

**Seven attempts now converge on the same ceiling.** Treat a ninth variant of
"dodge better" as disproven unless it changes the *shape* of the approach.

### Three traps inside those attempts, each a real engine finding

**Attacking roots the player, so a swing structurally cannot connect against a
target still moving fast.** `Player.updateMovement` freezes the player for the
whole swing animation ("attacking roots you in place, as in the GBC games").
Chasing a dash's own direction *does* close real distance — confirmed with the
true per-axis gap, both axes solidly negative, for a dozen consecutive frames
while the dash was live — and a swing gated on that really does fire: **~2,822
attempts over 8,000 frames, none landed.** The instant `startSwing` runs
(`src/game/player.js:358`) the player stops dead while Gohmaraq's dash keeps
covering 1.9px/f clean through the fixed sword hitbox before its active frames
arrive. **Any future verb must either lead the swing well before the target
arrives, or wait for a moment the target is ALSO stationary (a tell, a
wall-stop). "Get close mid-motion and swing" is not a strategy against anything
that outruns the player.**

**"Lead the target toward where it's headed" is a trap for a CHARGING boss.**
The same-speed-patrol theory was checked and ruled out first — a frame trace
showed Gohmaraq never reaches phase 3 (the same-speed phase) before the player
dies; it stalls in phase 2, where idle patrol is 0.85, *slower* than the player.
A fix built on the theory anyway (`chaseTarget`: read the boss's `_pdir`, head
for the wall it patrols toward) is actively harmful: **the wall the boss patrols
toward is the same wall its `charge()` dashes toward**, so the player ends up
standing exactly where the charge lands — which is `charge()`'s own retrigger
condition. Traced: `_pdir` froze at one value and distance locked to 13–14px for
*thousands* of frames. Charge, recover, instantly realign, charge, forever.

**A "retreat" command can point straight into a wall.** `dBoss`'s `fence()` on
`main` only clips against the *arena edge*. It does not know about solid tiles,
so a blocked retreat presses into stone repeatedly instead of sliding along it.
The branch fix ran every retreat direction through `passable()` (the engine's
own `canOccupy`, already used for pathing in that same file) and dropped any
component stepping onto a solid tile. **Measured neutral against the charge
ceiling, but generically correct and NOT currently on `main`** — worth
reapplying with any real `dBoss` work.

### Two boss-fight bugs still live on `main`

**`e.charging` can stick `true` forever.** `charge()` sets `e.charging = true`
when a dash starts and clears it only inside its own `if (e.charging)` branch,
on a *later* call, once `moveDir` reports the dash hit something. Nothing else
in `src/game/enemy.js` ever sets it false. **A phase that stops calling
`charge()` leaves the flag stuck true permanently** — Gohmaraq's final phase
never calls `charge()` (only the phase before it does). Any verb branching on
`b.charging` will dodge a charge that is not happening, for the rest of the
fight.

**`tools/walk-dungeons.mjs` has two harness races, both diagnosed and fixed on
deleted branches, neither on `main`.** Recorded verbatim so they are not
re-diagnosed:

1. *The ledge-hop prober can drop the player.* The probe waits exactly 3
   `g.frame` ticks after `enterMap()`, then filters `g.entities` down to the
   player — but room entry respawns entities on its own schedule and is
   occasionally still in flight at tick 3, leaving `g.player` momentarily absent
   from `g.entities`. The filter then yields an **empty array with the player
   filtered out too**, and nothing adds it back; every held-key frame after
   reads as a dropped input. Fix: after the 3-frame wait, also
   `await new Promise(r => { let n = 0; const t = () => (g.entities.includes(g.player) || ++n > 30) ? r() : requestAnimationFrame(t); t(); });`
   Reproduced 5/6 before, 5/5 clean after, same seed and room.

2. *`game.frame`'s absolute value drifts with machine load.* Parts 1 and 2 call
   `page.evaluate` once per dungeon with no frame-waiting between, while the
   page's own `requestAnimationFrame` loop keeps ticking `game.frame` for
   however many real milliseconds each round trip takes. A change that makes
   boss code do *strictly more drawing* shifted that cost enough to land the
   ledge probes on a different absolute frame (91 vs 92, printed directly) and
   fail one specific overworld ledge 100% reproducibly, **in a room containing
   no boss, no phased entity, and no code path that was touched**. The fix is
   NOT a bigger margin on the tuned `frames(22)` constant — it is removing the
   drift: `await page.evaluate(() => window.__harness.takeOver());` right after
   the intro-skip, and `window.__harness.release()` (which zeroes `acc` and
   restamps `last`) immediately before the first real keypress. Stable across
   three repeated full runs. **If a `walk-dungeons.mjs` ledge failure looks
   unrelated to what you just changed, suspect this before the ledge data.**

### The first real-combat measurement of all six bosses

Before the `Boss.phase` fix nothing but Gohmaraq could be hit at all, so this
table had never existed. Measured with `godMode: false`, unmodified `dBoss`,
seed 20260806, at the health a player clearing dungeons **in order** actually
carries (3 starting hearts + 1 Heart Container per prior boss, deliberately
counting **no heart pieces** — a conservative floor):

```
        boss        hearts        hits   damage    player dies   boss hp left
  d1  gohmaraq    3 (12 qh)         5    10/24        f900           14
  d2  anemos      4 (16 qh)         2     4/30        f900           26
  d3  gloomtide   5 (20 qh)         3    12/32        f360           20
  d4  wyverna     6 (24 qh)        10    40/44        f1800            4   <- one hit short
  d5  rootmaw     7 (28 qh)         6    24/52        f1440           31
  d6  nereth      8 (32 qh)         0     0/80        f1860           80
```

**Wyverna is the one that is nearly winnable right now, with zero code
changes.** Binary-searched by hand, same seed, no verb changes: **loses at 28 qh**
(boss at 4/44 — one hit short), **wins at 32 qh (8 hearts) with exactly one
quarter-heart to spare**, wins comfortably at 36 qh. The heart-piece arithmetic
says a real player is above that line: `check-hearts.mjs` pins `PER_DUNGEON = 2`,
so D1–D3 hold **6 pieces**, plus **2 in the overworld caves** (`cave1`, `cave2`,
needing no items) — **8 pieces = exactly +2 hearts** (4 per heart) on top of the
6-heart floor. **A route-driven D1→D4 run should reach Wyverna at ~8 hearts and
kill her.** That is the cheapest boss win available and it is worth confirming
before any AI work.

Why Wyverna is different: her first 660 frames are *flawless* — 8 clean hits,
**zero** damage taken (she is `terrain: 'air'` and `wyvernaAltitude` correctly
beaches her at LOW, exactly as designed). Her final phase (hp < 0.32) starts and
hits slow to one per 150–250 frames instead of one per 70. Probed directly with
`entity.canOccupy`: at one sampled moment she sat in **room row 0, which is
entirely solid** — the room's own north wall. Being `terrain: 'air'` she occupies
it fine; a grounded player cannot stand next to it. `dBoss` has no notion of
"wait for the dive that brings her to you" — it walks toward wherever she is,
including into a wall. **The fight does not stall the way Gohmaraq's does, which
is exactly why more health closes the gap.**

### Nereth and Anemos — diagnosed directly, not guessed

**Nereth does NOT need a conch verb. That hypothesis is WRONG — do not chase
it.** `nerethPin`'s own comment already says the conch only *widens* the window
("he must never be *only* breakable by the conch"). Every attack in phases 1–3
ends in a real ~55-frame `nerethOpening()` regardless of tide. The actual reason
`dBoss` lands **zero** hits in 1,860 frames, caught with `p.invuln`/`hearts` in
the trace: the trident throw (`spread(..., damage: 3)`) that *opens* the window
fires **from the same `windUp` callback as the opening itself**. So the instant a
window starts, the player — who has been closing during the closed phase — walks
into the volley at ~40px, way outside sword range, takes a graze, and the
resulting `p.invuln > 0` branch retreats for the rest of the window. Every
opening, all 1,860 frames, without exception. **This is the same "shots fired the
instant the window opens" pattern already reverted three times for Gohmaraq —
just severe enough here to eat the entire window.**

**Anemos's proximity counterattack is designed, not a bug.** `anemosLash` fires
on `distToPlayer(e, g) < range`, with range 44/48/52 across its three phases —
the function's own comment is "anything that stands next to it gets whipped."
That range is **larger** than the ~24px `dBoss` must reach to swing, so every
approach risks a 3-damage lash roughly every 70 frames before a swing is even
thrown. `anemosFeed`'s window is generous at HIGH (160 of every 250 frames) —
**vulnerability is not the bottleneck, the melee trade ratio is.** This is a
legitimate risk/reward the boss was designed around, not a defect.

### Two process lessons from the pile

**Every boss's dramatic reveal rendered as an EMPTY ROOM** — a health bar and no
boss — for the whole life of the project, because the `Boss.phase` collision set
`hidden = true` whenever the Lens was not up, which is every first encounter a
player will ever have. **Headless assertions proved the boss EXISTED the entire
time this shipped; nothing proved it was VISIBLE.** No checker in the CLAUDE.md
table can see this class of bug. It is the same argument that file already makes
about compositing tiles needing a screenshot — **"is it on screen" needs an eye,
not an assertion.**

**A `git checkout -- <file>` mid-session to isolate a change is a real revert.**
While bisecting, a `git checkout -- tools/actor-runtime.mjs` used to isolate an
`enemy.js` change silently discarded that file's own unrelated good fixes for
the rest of the session. **Save a patch (`git diff <file> > /tmp/x.patch`)
BEFORE checking a file out for isolation, not after.**

## Hard-won lessons — do not rediscover these

**A 32x32 OBJECT DRAWN FROM EVERY 16px TILE IS DRAWN AT DOUBLE DENSITY.** The
first cut of the tree work anchored the whole tree on one tile and let it
overhang, reasoning that this is what the source does with a 32x32 object. It is
— but the source places that object every 32px. Here every tile is a tree, so
each one half-covered its neighbour and a treeline read as overlapping circles
with hard black seams. Worse, a tree on a screen's TOP ROW drew its canopy above
the canvas, where nothing can see it, leaving a bare root mound with a torn
outline — and every screen in this world is bordered with trees along its top
row. **A person playing spotted it in seconds; every checker was green.**

**...AND CHOOSING THE QUADRANT PER CELL SLICES THE TREE.** The fix for the
double-density bug above was to pick each cell's quadrant from its neighbours:

    qy = (no tree above) or (tree below) -> canopy, else roots
    qx = start of a run -> L, end -> R, otherwise alternate by parity

That is a rule about CELLS, and a tree is not a cell. Wherever a mass was not a
neat even 2x2 it cut the object up. A canopy with open sand under it drew no
trunks at all, so it ended in a dead-straight horizontal line — every dune palm
in the game was a band of fronds guillotined along a tile boundary. A root row
one tile shorter than its canopy drew half a mound with a hard vertical edge,
and because the two rows voted separately it was sometimes the LEFT half under
the RIGHT half of the canopy. **A person playing reported this too, and every
checker was green for it as well.**

The working shape is a FIXED 2x2 LATTICE over the room (`Room.drawQuads`). Any
block holding at least one tree cell draws all four quadrants of one whole tree.
That is the density the first cut got wrong — one object per 32px, not per 16px,
because the lattice is what spaces them — and it is the consistency the second
cut got wrong, because two cells of one tree can no longer disagree about which
half of it they are. Ragged edges become OVERHANG, which is what the source does
with a 32x32 object and why every tree in Holodrum has roots.

Two things that fall out of it, both of which cost time:

  * **The tree pass has to run after every ground cell.** Drawn in step with the
    grid, the ground of the next cell along scrubs the overhang off again —
    silently, and only at the edges.
  * **Overhang must stop at anything the player has to SEE.** The Maku Tree's
    hollow sits in Tidewatch's tree line, and the block holding it drew an oak
    straight over the doorway: art covering a warp. Nothing in the checker table
    can see that — the tile is still there and it still warps.

`renderAt` — the Lens's second copy of the room — needs the same pass, and did
not have it for as long as the trees have been 32x32. It fell back to the 16x16
`art` the tiledef keeps for the map screen's colour sampler, so holding the Lens
up in a wood put a row of lollipops on sticks over the real trees.

**A TILEDEF WHOSE NAME COLLIDES WITH AN ART NAME CAN NEVER CHANGE ITS ART.**
`tileSheet.add(ART)` keys the sheet by ART name, and `Room` draws a tile by its
TILE name; the alias pass at the end of `installCoreTiles` bridges the two, but
it is guarded `!(name in ART)`. So repointing `digSpot.art` at a new art did
exactly nothing and the tile went on drawing the art it shares its name with. No
warning, no missing entry, no failing assertion — the old pixels, for as long as
you care to stare at them. Rename the ART, not the tiledef.

**NOTHING IN THE GAME EVER SET `e.caps` OR `e.swimming` ON AN ENEMY, SO THE SEA
HAD NOTHING LIVING IN IT.** `moveEntity` reads `e.caps`; `canOccupy` read
`e.swimming`; the player sets the first and nothing set the second. So the two
functions disagreed about the same question and the one every bare call reaches
said no: every anglerfry, sea octorok and siren in the world was welded to its
spawn tile, and the jellyfish only moved because `driftWithTide` writes their
position directly — which walked them onto dry land, where they despawned.
MEASURED: 0 subpixels in 240 frames, before; thousands, after. Nothing could
see it. They spawn, update, draw, animate and hurt you on contact, and
check-motion's "swimmers stay off the 8px lattice" is satisfied perfectly by
never moving. An aquatic enemy now gets `caps` in the `Enemy` constructor and
`canOccupy` falls back to `e.caps`, so there is one mechanism instead of two.

**AND WHEN YOU FREE SOMETHING THAT WAS STUCK, THE SCRIPTED RUNS MEET IT.** The
Locked Stair is written as "two zols" and one of them stood inside a dungeon
post for the life of the project. Freed, it fights — and d1-descent's actor,
which lines up and stands still to swing, died on a route it had always walked.
Two of the moves check-placement suggested had to be overridden by hand for the
same reason (an octorok into the lane the playthrough travels, a zol behind a
post row). The tool's suggestion is a legal tile; whether it is a good one is a
judgement, which is why it has no `--fix`.

**A SPRITE SHEET'S PITCH IS NOT 16 JUST BECAUSE ITS SPRITES ARE.** `find_cells`
splits a band of content into runs and cuts each run every 16 pixels. The
Oracle of Seasons NPC sheet's townspeople sit about 17 to 18 apart, so the cut
drifted a pixel per sprite and by the middle of a row the window held the right
half of one villager and the left half of the next. EVERY NPC IN THE GAME was
two half-people, visible from across the room, and every checker was green for
it — a sprite that exists and draws is all any of them can see. `find_sprites`
finds each sprite as its own eight-connected blob and centres a cell on it,
which is the same lesson the trees taught: measure the object, never assume the
pitch. Migrating a ripper to it renumbers every index, so the frames have to be
re-picked off a contact sheet by eye.

**AND A 16-WIDE CELL AROUND A 13-WIDE SPRITE HAS COLUMNS THAT BELONG TO
SOMEBODY ELSE.** Three separate extractions hit this: the boulder took a dotted
column of its neighbour's dirt, Farore came out with two of a doorway's posts,
and `npc_brine_u` took a stripe of the sheet's green. Keep only the window's
biggest connected blob — `quantise(own=True)`, `_own_blob` in rip-races.py,
`_detached` in rip-terrain.py. It is opt-in in each: a frame drawn in two
pieces (a held item away from the hand) is legitimate, and this must not eat
half of one. Where a neighbour TOUCHES the sprite the blob rule cannot help and
the window has to be nudged by hand — Farore is the worked example.

**AN EXTRACTION WINDOW HAS TO BE THE OBJECT'S BOUNDING BOX TO THE PIXEL, AND
ON A RENDERED MAP YOU CANNOT FIND THAT BY LOOKING FOR BACKGROUND.** The oak and
the palm were both a couple of pixels off theirs from the day they were ripped.
The oak's outline-to-outline width is 32 starting two right of where its window
started, so its RIGHT outline column fell outside and every oak in the game ran
off its own edge in bare lit green — obvious next to the fully outlined left
edge, and reported by a person playing. The palm was one row low and lost the
tips of its top fronds. On these sheets the trees TOUCH their neighbours on
every side, so there is no background to bound them with: walk each row to its
outline columns and take the extremes. **And re-check the slots after moving a
window** — the palm's old box caught four stray trunk pixels in its upper half,
so that half had four colours instead of three, and the slot list left alone
painted every frond edge trunk-brown.

**A CAVE MOUTH IS A HOLE, AND THE ROCK ROUND IT IS THE TILES NEXT TO IT.** The
extracted mouth is a dark arch and a one-pixel lip and nothing else — on the
Subrosia sheet the rock it is cut into is supplied by its neighbours, and the
source does every cave in Holodrum and Labrynna the same way. Nobody supplied it
here, so eleven overworld screens had a black rectangle pasted on open sand,
open grass, a tree canopy and (at the Sunken Reef) open water. Each mouth now
sits at the foot of a two-tile rock face. Two things this costs, both paid:

  * The seam. Solid rock above a mouth on a screen's top row means the same two
    cells are solid on the screen ABOVE, or `check-overworld` fails the seam. If
    a replay stands in those cells it is displaced on entry and the run is not
    the run any more — which is why the Reef Palace's porch is a column east of
    every other mouth, keeping clear of the lane `tide-steps-split` throws its
    anchor down.
  * A prop with the wrong ground under it is the same fault one scale down: a
    boulder declaring grass on a beach is a hard green square. `Room.underGround`
    lets the room outvote the declaration, but only on two or more agreeing
    neighbours — a one-vote rule walked the Drowned Wood's snarl out of its
    channel and onto the floorboards, and only a replay's probe hash caught it.

**A HARNESS THAT CLOSES A DIALOGUE BOX IS NOT WATCHING THE SCENE.**
`dialogue.close()` closes the whole box, skipping every page after the current
one, so a cutscene harness that uses it clocks a three-page speech at one page
and reports the intro at 11 seconds when it is 64. Turn the PAGE — press A once
the page has finished typing itself out and been up long enough to read — or
the timeline is fiction. And count in GAME frames, not rAF callbacks: the fixed
step can tick twice between two animation frames, so a card the engine holds
for 180 reads as 178 and any check with a one-frame slack fails at random.

**PACING FAULTS ARE NOT ALL DURATIONS.** Two were found by playing the 13
scenes end to end, and the one that mattered was not a number in feel.js at
all: `paginate` filled each page to the brim and let the last page take the
remainder, so every four-line speech in the game was a full box followed by a
box containing "one eye." Nothing could see it — the text is all there, every
id resolves, check-dialogue and check-text were green, and shoot-cutscene
photographs ONE frame. The other was a duration and is now impossible: a
caption is held for `max(what the scene asked for, what its text needs to be
read)`, so the floor cannot be violated by editing the text.

**A CHECKER'S SWEEP IS AS WIDE AS THE THING THAT EXISTED WHEN IT WAS WRITTEN.**
`check-towns` asserted every registered block is placed, and swept the declared
TOWNS to prove it, because the town kit was the only thing making blocks. The
six dungeon gates are blocks on ordinary overworld screens, and the moment they
landed they read as six unplaced buildings. The assertion was right and its
scope was not; it sweeps every room of every map now. Worth asking of any
checker before adding a second user of the thing it checks.

**"LONE" IS A PROPERTY OF THE TREE, NOT OF ONE CELL OF IT.** The overhang case
above was first decided per cell. A one-wide column's canopy had a horizontal
neighbour and its roots did not, so the leaves came out 16px wide and the base
32px, and the base stuck out past the tree. The other row of the same tree has
to get a vote.

**THE SAME COLOUR CAN BE BACKGROUND IN ONE PLACE AND ART IN ANOTHER, SO HOW
BACKGROUND IS DECIDED IS PER-OBJECT.** The oak's pale cream is both the halo the
map draws where grass meets tree and the highlight inside its roots. Clearing it
by colour punched holes through the roots; the fix is to FLOOD inward from the
border, which keeps anything the tree's own outline walls in. The palm needs the
exact opposite: its background is dune sand, which appears nowhere in the palm,
and the gaps between its fronds are ground showing through even though the
fronds enclose them — flooding would have given it a solid sand-coloured middle.
`rip-terrain.py` carries a `flood` flag per object for this reason. Compute the
mask on the WHOLE object and slice afterwards, or the same pixel is art in one
quadrant and background in its neighbour.


**A PALM IS NOT AN OAK RECOLOURED.** The dunes are a third of every tree in the
game (510 of 1559 tiles), and the cheap move — reuse the oak's art under a beige
palette, the way `treeDark` and `treeDead` legitimately do — would have given
the desert broadleaf woodland in sand colours. It was found the same way the oak
was: scan the reference map for isolated foliage whose SURROUNDING RING is sand
rather than grass, which turns "find me a palm" into six lines of arithmetic
instead of an afternoon of squinting at a 2577x2735 image. Every tree hunt in
this repo should start there.

Unlike the oak, the palm needs only ONE palette: its fronds and its base share a
colour set small enough to fit four slots between them (fronds 4, base 3). It is
still emitted as a PAIR of 32x16 halves, because that is the mechanism `big`
speaks and a one-off 32x32 palm would need its own draw path for no gain.


**THE 32x32 TREE NOTE IN `rip-terrain.py` WAS RIGHT ABOUT THE PROBLEM AND WRONG
ABOUT THE ANSWER.** It correctly says every tree in every Oracle sheet is 32x32,
that no 16x16 tree exists to find, and that the hand-drawn lollipop was a 16x16
impression of a 32x32 object. Its proposed fix — cut the tree into four
quadrants and let a 2x2 patch of tree tiles reassemble it — does not survive
contact with this game's own world data:

    tree tiles placed in the world        1559
    inside a full 2x2 block of trees       280   (18%)
    with no tree above or below            639   (41%)

**This world uses trees as a ONE-TILE-THICK border around screens**, so a
quadrant scheme would have rendered four fifths of the game's trees as fragments
— worse than what it replaced. Count the placements before building the scheme.

The answer that does work: the tree stays WHOLE, and one tile draws all 32x32 of
it, overhanging its neighbours — which is what the source does with a 32x32
object anyway. Roots on the cell, canopy hanging into the row above; row-major
draw order then makes a lower tree overlap a higher one, which is the correct
depth order for free. **No world data changed, and the one isolated tree in the
game still draws a whole tree.**

**A CANOPY AND ITS ROOTS DO NOT FIT IN ONE FOUR-COLOUR PALETTE.** Measured on
the extracted tree: the canopy is 3 colours, the roots are 4, and together 6-8.
That is not a quantisation failure to work around, it is why the hardware draws
a tree as several tiles with SEPARATE palettes. So the art is a PAIR of 32x16
halves with a palette each — the smallest split that reproduces what the source
actually does, and still a straight extraction with nothing composited. The
dark and dead woods are palette swaps of that same pair, so a re-rip changes
every wood in the game at once.

**A TILE WAS 16x16 WITHOUT EXCEPTION, AND `expectedSize` ONLY APPLIED TO
SPRITES.** `validate.mjs` passed `sizeFor: expectedSize` for sprite packs and
hardcoded 16x16 for tile packs, so the manifest could declare a tile's size and
the validator would still reject it — two sources of truth for the same fact.
Tiles consult the manifest now.


**THE SWORD SWING HAD NO SWORD IN IT, AND NOTHING COULD SEE THAT.** `link_sword_*`
comes from the sheet's "Slash/Use item" band, and every frame in that band is a
BODY POSE with no blade — on real hardware the sword is a separate sprite laid
over Link, and the sheet keeps it separate too. So Link swung his empty hands
with only a white arc for company, for the life of the project. Every assertion
passed: the sprite existed, resolved, and drew. It was simply not a picture of a
man holding a sword. The blade is now `fx_blade_up/down/side`, taken from the
Spin Attack band where each cardinal thrust is drawn as TWO 16x16 cells — one of
Link, one of blade — so the blade cell is a clean extraction with nothing to
composite and nothing to align.

**`link_push_down` AND `link_push_up` WERE SWAPPED.** Pushing while facing the
viewer drew Link's back; pushing away drew his face. Digging inherited the same
mistake, because the dig frames were deliberately aliased to the push pair. Read
off the sheet's Push band left to right, 1192/1209 are the front-facing pair and
1226/1243 the back-facing one; the map had them the other way round. **A wrong
sprite is the hardest class of bug in this project to catch** — it is not a
crash, not a gap, not a missing asset, and `check-items`/`test.mjs`/the art
coverage count are all perfectly happy. `tools/shoot-player.mjs` exists now for
exactly this: it photographs Link in each state facing each way, and a person
looks.

**THE 32x32 TREE SYSTEM IS BUILT ON ONE SIDE ONLY — DO NOT ASSUME IT WORKS.**
`tools/rip-terrain.py` carries a long, correct explanation of why a faithful
tree cannot be 16x16 (every tree in every Oracle sheet is 32x32), a working
`quantise_quad`, and an emitter that writes `name_<qx><qy>` quadrants. But
**`QUADS = []` is empty and the ENGINE HAS NO `quad` SUPPORT AT ALL** — grep
`src/world/` and there is nothing. The four tree tiles are one hand-drawn 16x16
lollipop reused under four palettes. So the comment reads like a finished
feature and describes a plan. Before building on it: the engine needs `quad`
carried through `registerTiles` (remember a tiledef field the registrar does not
name is silently DISCARDED) and honoured in `Room.artAt`, and every isolated
single tree tile in the world needs finding, because a 2x2 system draws a lone
tile as one quarter of a tree.


**A CHECKER THAT ASKS THE THING UNDER TEST FOR ITS OWN LIMITS PROVES NOTHING.**
`check-camera.mjs` first computed `mx = cam.maxX(room)` and then judged the
camera against `mx`. Breaking `maxX` on purpose — returning 8 instead of 0 for a
one-screen room — passed cleanly, because "is this room pinned" was being
answered by the very function under test. The fix is to derive the expectation
from the DATA (`room.pw - VIEW_W`) and check the engine's answer against it.
**This is the sibling of the collision rule (`R4`) and it points the other way**:
call the engine for BEHAVIOUR, never for the STANDARD you are holding it to.

**A STRUCTURAL CHECKER MUST KNOW EVERY VERB OR IT WILL CONDEMN GOOD ROOMS.**
`check-wide-rooms.mjs` asked bare-foot solidity across each internal seam and
immediately reported two hand-authored rooms as broken. Both were right and the
checker was wrong: the Kelp Locks' seam is a torrent you cross with the Cleats,
and the Shrine Ford's is a snarl you cut and then swim. This is the ledge lesson
(`T52`) in a new place, and it will keep happening — the fix is that
`everPassable` in `tools/lib/collision.mjs` now owns both the capability list
and the tile-transform lookup, so there is ONE place to update when the player
gets a new way to move.

**NEGATIVE-TEST EVERY CHECKER, AND EXPECT ONE OF THE TESTS TO SURPRISE YOU.**
Four deliberate breaks were tried against the two new checkers. Three failed
loudly as intended. The fourth — deleting the camera's `if (mx === 0 && my === 0)`
early return — changed nothing at all, because the clamp below it already forces
the same result. That is not a checker gap; it is defence in depth that nobody
had written down. **A negative test that does not go red is information**: either
the assertion is weak, or the code is more robust than it looks. Find out which
before moving on.

**THERE IS NOTHING IN THIS REPO TO FRAME-STEP.** S11's second half was to convert
`feel.js` constants from `guessed` to `measured`. It was not attempted and
nothing was relabelled. `assets/` contains sprite sheets and one title-screen
GIF, and that GIF is a SINGLE STATIC FRAME with no timing information — checked,
not assumed. Measuring walk speed, sword duration, knockback, invulnerability
frames, room transitions or text speed needs gameplay video of the source games,
which a session can only have if somebody puts it in the repo. **The census
stands at 0 measured / 17 derived / 220 guessed**, and `check-feel.mjs` now
makes the honest version enforceable: a `measured` claim must name the reference
it was stepped from, so the failure the S11 prompt feared — quietly inflating
that word — is now a red build rather than a matter of trust.


**COUNT BEFORE YOU BUILD THE STEP THE PROMPT ASKED FOR.** S10's prompt listed a
camera pan/hold/return as the first thing to add — "the source uses this
constantly". In THIS game it would have been dead code on delivery:
`Camera.update` pins x and y to 0 when a room is no bigger than the view, and
**all six boss rooms are exactly 160x128**. Nine rooms in the whole game can
pan and not one of them runs a cutscene. Five minutes of counting replaced a
day of building a feature with zero call sites. The same prompt said to read
the thirteen scenes and let them tell you what is missing — that instruction is
what licensed dropping its own suggestion, and prompts should be written that
way for exactly this reason.

**A MISSING GLYPH IS A QUESTION MARK, NOT A GAP.** `decode` in
`src/gfx/font.js` ends `GLYPHS[ch] || GLYPHS['?']`. So a character the font
cannot draw does not crash, does not warn, and does not leave a hole — it
prints `?`, which reads as authored punctuation. The em-dash has never had a
glyph, and appears 13 times, so six Essence title cards have read

    Essence of the Tide
    I ? the Shallow Bell

since the day they were written. Every assertion in the table passed the whole
time. **It took a screenshot.** This is `T53` in its purest form and it is the
best argument in the repo for shooting anything whose bug would be visual.
`check-text.mjs` closes it.

**ONE FEATURE, TWO INDEPENDENT REASONS IT WAS UNREACHABLE.** The `finalBoss`
track had never been heard. Reason one: its only player is the last step of
`nerethIntro`, a cutscene with no trigger anywhere in `src/`. Reason two: even
once fired, `updateMusic()` recomputes the track from
`dungeon.bossMusic || 'boss'` as soon as the scene ends — and **no dungeon has
ever set `bossMusic`**, a field the engine has always read. Fixing either alone
would have proved nothing and looked like success. **When a feature is dead,
keep looking after you find the reason** — the second one is what makes the fix
hold, and the harness that asserted `track === 'finalBoss'` after the scene is
what caught it.

**THE CAPTION BOX IS CENTRED, SO A PICTURE AT THE CENTRE IS BEHIND IT.** The
first cut of the `show` step drew the Essence orb at screen centre, where the
caption's own scrim covers it; two thirds of every orb was invisible and the
shot tool still reported success, because the sprite WAS being drawn and
`shownArt()` WAS returning its name. A tool that asks "did it draw" cannot
answer "was it visible". Layout is computed now — the card drops to the bottom
whenever a sprite is up — but the lesson is the assertion gap, not the pixels.


**A HANDOFF NOTE THAT NAMES A MECHANISM IS STILL A CLAIM ABOUT THE TREE.** `A6`
said `npc`, `sign` and `giver` "each accept `dialogue`, `waiting` and `after`",
and the S9 prompt built on it: no engine work needed, just write lines. `NPC`
read only `o.dialogue`. `Sign` read only `o.text`. The two-state contract lived
on `Giver` and `Trader` alone, so the twelve entities the session was about had
no mechanism for a second line at all. **The note was specific, plausible, and
wrong**, and it would have been believed for another session if the first thing
done had been writing dialogue instead of opening `objects.js`. Its COUNTS
(57 written / 51 referenced / 6 orphaned) re-verified exactly — so the failure
was not sloppiness, it was that counting is checkable and "this class accepts
that field" was never checked by anything. Now it is: `check-dialogue.mjs`
constructs each NPC and drives the real `interact`.

**AND THE SIZE OF THE GAP WAS WRONG IN THE SAME NOTE, IN THE OPPOSITE
DIRECTION.** `A6` listed ~21 single-state townspeople. Nine of them were
`trader` **waiting** lines that had always flipped to an `after` line as the
Coastwise Chain advanced. The real number was 12. **Before writing to a list in
a doc, print the same list out of the data** — it took one script and it moved
the session's scope by 43%.

**REUSE THE UNPLACED LINES INSTEAD OF ADDING NPCS TO SAY THEM.** Four of the six
orphans (`child1`, `elder1`, `netMender`, `shopkeeper2`) were written for
villagers nobody ever placed. They became the LATER lines of villagers who are
placed, which resolves the orphan, honours `T49` (adding an NPC is not free),
and costs no new entity. The other two were deletions with evidence rather than
taste: `signCoast` duplicated text already inlined on a real sign — `Sign` says
`o.text` literally and never consults the id table, so an entry there is
unreachable by construction — and `villager3` explained how the conch works,
which the intro cutscene already does.

**THE ORPHAN CHECK NEEDS TO WALK NESTED DATA OR IT INVENTS ORPHANS.** A first
cut of `check-dialogue.mjs` read only top-level entity fields and reported 20
orphans against the true 6. Ten of the eleven trade lines live in
`trader.deals[].text`, and `makuTree` hides two more behind `sceneAfter` and its
own deal. A checker that is wrong in the *safe* direction is still wrong: it
would have had this session delete fourteen lines that a player reads.

**PROVE THE SECOND STATE IS REACHABLE, NOT MERELY WIRED.** Every id can be
defined, every reference can resolve, and a townsperson can still have a line no
player will ever hear — a threshold above the six Essences that exist, or an
`after` with no condition at all (which silently makes the *first* line the
unreachable one, because `ready()` is vacuously true with nothing to wait for).
Both were induced and both go red. This is the dialogue-shaped instance of
`T53`: existence is not appearance.


**THE OVERWORLD IS 1% WATER, IN A GAME ABOUT TIDES.** Counted across all 120
overworld screens (9600 tiles) using the engine's own flags: at LOW tide **88
tiles carry `F.WATER` — 0.9%**; at MID 391 (4.1%); at HIGH 116 (1.2%). Solid is
a flat ~32% at every level. S8 set out to draw Thalassia as a picture with a
coastline and discovered there is essentially no sea on the overworld to draw a
coast against. **The grid of coloured rectangles hid this completely** — every
screen was one blue square whether it was open ocean or solid rock, so the map
screen actively concealed the single biggest fidelity problem in the world.
This is not a map bug and must not be "fixed" in the map: a map that invents
water the world does not have is a lie. It is a TERRAIN problem and it is
probably the most valuable thing on the board.

Two more measurements from the same pass, both of which the old map also hid:

- **The nine region blocks are ruler-straight rectangles.** The 12x10 legend
  grid is `abyss`/`salt`/`reef` across the top in 4-wide columns, then
  `cliffs`/`wood`/`coral`, then `marsh`/`coast`/`dunes` — every boundary is a
  straight line on a 4-screen grid. Drawn honestly it reads as a quilt.
- **The screens are individually varied but idiomatically identical.** A strict
  test (relabel each screen's tile names by order of first appearance, which is
  region-blind) says **116 distinct structural layouts out of 120** — so it is
  NOT a stencil, and an earlier draft of this note claiming it was a stencil was
  wrong and was corrected by running the test. What IS true is that nearly every
  screen is a decorated border ring around a small central water patch, so at
  map scale they read as repeating wallpaper anyway. **Structural variety and
  visual variety are not the same measurement — test the one you mean.**

**A MAP OF A PLACE CANNOT BE BETTER THAN THE PLACE.** The corollary, paid for
in S8: when a "make this screen look good" session finds the screen already
draws its input faithfully, the deliverable is the machinery plus the
measurement of why it still does not look good — not a prettier lie. S8 shipped
the picture (derived colours, tide-awareness, landmarks, the seen mask) and the
three numbers above, because the numbers are what the next session needs.

**DERIVE A MAP PIXEL FROM THE ART, AND TAKE THE MEAN, NOT THE MODE.** Two
mistakes in a row here, both of which produced plausible-looking wrong output:
1. **The palette is on the tile DEFINITION (`d.pal`), not on the art entry.**
   `Room.render` draws every tile with `{ pal: d.pal }`; the art's own `pal` is
   only the registration-time default and is `stone` for most terrain. Reading
   the wrong one rendered the entire world in grey — which looked exactly like
   plausible terrain noise, not like a bug.
2. **One pixel per tile is a downsample, so it wants the MEAN tone, not the
   most common colour.** Terrain art carries heavy dark detail (tufts, speckle,
   outlines), so the modal index lands on the detail colour often enough that
   the whole map reads as stipple. Take the mean RGB and then SNAP IT BACK to
   the nearest of that tile's own four palette colours — a raw mean puts
   colours on screen that exist in no palette in the game.

**INSTANTIATING ALL 120 OVERWORLD ROOMS COSTS 3ms, ONCE.** Measured, not
assumed, because `T75` says decide deliberately and measure if you instantiate:
3ms to build all 120 `Room` objects cold (once per run — they are cached), and
2ms to re-walk all 9600 tiles, which is what a tide change costs. Frame budget
is 16.7ms. The alternative — decoding legend characters outside the engine —
would have meant re-deriving `expandBlocks`, tide-tile resolution and overrides,
which is exactly what `R4` exists to prevent.

**A BEFORE/AFTER PICTURE NEEDS THE BEFORE TAKEN FIRST, AND THERE WAS NO TOOL.**
S8's stated failure condition was regressing the dungeon map, which shares the
code path. Nothing in `tools/` could screenshot the pause menu — every shot tool
points at the world — so the proof was impossible until `tools/shoot-map.mjs`
existed. It was written and the BEFORE shots taken **before a line of `menu.js`
changed**; the three dungeon-map shots then came back pixel-identical after the
split. Same shape as the audio-render baseline: the proof only exists in the
window before you change the thing.


**PROVE AN ENGINE CHANGE INERT BEFORE YOU CHANGE THE DATA THAT WOULD MASK IT.**
`tools/check-audio-render.mjs` compares every track's Web Audio instruction
trace against a recorded baseline, and its own failure message tells you to
re-record when a divergence is intended. S7 added `intro` support to the music
engine AND rewrote ten tracks. Doing both and then re-recording would have
proved nothing at all — a real regression in the shared scheduling path would
have been baked straight into the new baseline, invisibly, because ten tracks
were expected to move anyway. The order that keeps the proof alive:

1. Make the ENGINE change alone. Run the checker against the OLD baseline. It
   must pass — that is the proof the new code path is inert for everything
   that does not opt into it, and it is only available in this one window.
2. Then change the data. Re-record.
3. Then DIFF the two baselines by track and confirm that exactly the tracks you
   edited moved. S7's read: 10 changed (the ten edited), 13 byte-identical.

Step 3 is the part that is easy to skip and the part that catches you having
touched a track you did not mean to. A re-recorded baseline is worth exactly
as much as the run you did before re-recording it.

**A CHECKER YOU HAVE NEVER SEEN GO RED IS NOT A CHECKER.** S7's new intro rules
were written, run, and printed OK on the first try — which proves nothing,
because a rule with a typo in its condition also prints OK. Every one of the
six new failure modes was then deliberately induced (an intro naming a
pattern that does not exist; an intro pattern also in `order`; an intro on a
`loop:false` jingle; an orphan pattern; and TWO one-line engine sabotages —
dropping the `_introDone = true` so the lead-in replays every loop, and an
off-by-one at the wrap that eats a bar of the body). The four data rules and
the two engine rules each went red with a readable message. The two engine
ones are the point: no amount of reading the track data can see a wrap
off-by-one, which is why `check-music.mjs` now DRIVES `Audio._scheduleRow`
against a mock context and asks the engine which pattern it played, instead of
modelling where the wrap ought to fall. Same rule as a collision checker
calling `solidAt` — a private model does not fail when the real rule moves.

**A SHORT CHANNEL HOLDS, IT DOES NOT REST — AND THE FORMAT COMMENT SAYS
OTHERWISE.** `src/core/audio.js`'s MUSIC FORMAT header says a channel "shorter
than the pattern's longest channel ... is silent for the remainder". It is not:
`resolveEvent` returns `off` only on row 0 and `hold` on every later row, so a
channel that runs out of tokens leaves its last note RINGING into the next
pattern. `village`/B's `p2` was one token short of 32 for the whole life of the
track and nobody noticed, because the symptom is a note that releases a
sixteenth late rather than a note that vanishes. Ragged channel lengths are
legal by design (an omitted channel is a real authoring tool), so a checker
rule would be wrong — but if you author a pattern, count your tokens.


**WEB AUDIO'S OWN RENDERING IS NOT BIT-REPRODUCIBLE ACROSS SCRIPT CONTEXTS —
HASH THE INSTRUCTIONS, NOT THE SAMPLES.** S6 needed to prove that a track using
none of the new vibrato/echo/arpeggio options renders byte-identically after
the engine change. The obvious approach — render real PCM through an
`OfflineAudioContext` in headless Chromium and hash the samples — FAILED even
for two runs of the exact same unmodified code: the same track hashed
differently between two separate `browser.newPage()` calls in the same
browser process, while a coarser "sum of absolute sample values" stayed stable
to about six significant digits. The browser's own DSP internals (float
rounding order inside oscillator/periodic-wave synthesis) are not specified to
be reproducible across page/script contexts, so a sample hash flags a false
regression on completely unrelated code — a checker that cries wolf on
unrelated commits gets ignored, which is worse than not having it. The fix:
`Audio.init()` now takes an optional `ctxOverride`, so a checker can hand it a
tiny **mock** context (createGain/createOscillator/etc. return objects that
just record what was called on them) and run entirely in plain Node — no
browser, no DSP, pure deterministic arithmetic. Comparing the SEQUENCE of
`setValueAtTime`/`start`/`stop` calls a track schedules is what actually
determines the sound; the browser's contribution from there on was never what
changed. See `tools/check-audio-render.mjs`. Cross-checked once by hand against
the pre-S6 commit: with this instruction-trace method, all 22 pre-S6 tracks
matched byte-for-byte; with the sample-hash method, every single one of them
falsely "differed", including tracks with zero relevant code changes.

**A `git checkout -- <file>` MID-SESSION IS A REAL REVERT, EVEN WHEN YOU MEANT
TO UNDO ONE LINE.** `T54` already says this and S6 paid for it again: a
one-line `sed` edit was made to `src/core/audio.js` to verify the new
render-trace checker actually detects a regression, and `git checkout --
src/core/audio.js` was used to "undo" it — which discarded the ENTIRE file back
to its pre-session state, silently deleting every S6 engine change (vibrato,
echo, arpeggio, the whole `_scheduleRow` restructuring) along with the one
line that was actually meant to go. It was recoverable only because the full
file content had just been read into context moments earlier and could be
reconstructed exactly. **Save a patch or just re-apply the one line with Edit;
never reach for `git checkout` to undo a change smaller than the whole file.**

**A MEASUREMENT TOOL THAT MISREPORTS A WIN AS A LOSS COSTS MORE THAN NO TOOL.**
S5 opened by re-measuring all six bosses and found that **two of them were
already being won** while `measure-boss-combat.mjs` reported
`still alive after 9000 frames (never finished)` with `? of 44` damage dealt.
The cause is one line: it sampled `g.boss.dead`, and `g.boss` goes NULL the
moment the entity is removed, so a kill reads as `dead: null` and falls through
to the "unfinished" branch. Wyverna kills flawlessly at six hearts taking zero
damage; the table in the handoff said she died with 4 hp left. **Had that table
been trusted, the session would have spent itself "fixing" two fights that were
already right.** `T38` had already named the answer — `progress.beaten` is
ground truth — for the *opposite* symptom (`T39`: a harness that walks out of
the arena reporting a flawless victory). Both directions of the same mistake,
two sessions apart. **Assert the positive fact.**

**MEASURING A BOSS AT THE TIDE IT WANTS MEASURES THE WRONG FIGHT.**
`check-bosses.mjs`'s FIGHTS table fought Gloomtide at MID with the note "the
sanctum current runs at MID and carries it" — a description of the boss being
*strong*: it moves at 1.7x there and 0.65x everywhere else. Every other row in
the table names the level that makes its boss *vulnerable*. At LOW, the fight is
won at the in-order five hearts with **no change to the boss at all**. The
general shape: a shell-less boss has no "tide its weak point opens at", so a
column that means "design tide" for the armoured ones means something else for
it, and nothing in the table's structure catches the difference.

**A RULE EARNED FROM TWO CASES IS A DIAGNOSTIC, NOT AN INVARIANT — AND WRITING
THE CHECKER IS HOW YOU FIND OUT.** "A boss does not fire into its own window"
explained two fights that plateaued at a fixed hp no player health could move
(Nereth at 60/80 from ten hearts to fourteen, Anemos at 20/24). It is a good
rule and it fixed both. So a source-level checker was written to enforce it on
every shelled boss — and it immediately fired on three more, **all of which are
won at in-order health**. Gating their fire would have been changing balanced
fights to satisfy a tool. The checker was deleted and the rule written down as
what it is: the thing to reach for when a fight plateaus. **The cheapest way to
discover that a rule is narrower than it feels is to try to enforce it.**

**A PLATEAU IS A STRUCTURAL BUG; A SLOPE IS A DIFFICULTY SETTING.** The single
most useful diagnostic in S5 was sweeping player health and watching the damage
dealt. A fight whose damage rises with health is merely hard and the balance
knobs work on it. A fight that returns *the same number* at ten hearts and at
fourteen has a wall in it, and no amount of health, dodging or verb tuning will
move it — that is what `T33`'s unlimited-health Gohmaraq run proved once, at
great expense, and the same signature identified Nereth's phase 4 and Anemos's
phase 3 in minutes. **Sweep the health before theorising.**

**THE HIT COUNT IS A DESIGN NUMBER AND NOBODY WAS LOOKING AT IT.** Anemos had 30
hp and is fought with the level-1 sword, which deals 2 — **fifteen connected
hits, the longest fight in the game, at the second boss**, against Nereth's
fourteen with a level-3 sword. The health values had been chosen one boss at a
time and never compared as a series. Divide each boss's hp by the damage of the
sword the player actually holds there, and the progression is legible in one
line; it was not monotonic and one entry was an outlier by 25%.

**A CHECKER THAT ONLY READS CODE WILL MISS THE BUG THAT LIVES IN DATA.** S4's
brief listed four silent sound calls; the checker found six. One of the two
extras was `sfx: 'rumble'` sitting in a tile transform — the `boulder` the
Dredge Line hauls — reached at runtime through `if (tr.sfx) audio.sfx(tr.sfx)`.
No grep of `src/game/` can see that name, and neither could six sessions of
people looking. **Whenever a call site takes its argument from a table, the
table is part of the surface being checked**, and a tool that scans only call
sites will look thorough while missing exactly the cases nobody could find by
hand. The same shape applies to `reward.sfx`, `step.sfx` and `w.sfx`.

**A MISSING THING HAS A TWIN THAT NO CHECKER CAN FIND: A WRONG ONE.** S4 closed
the class where `sfx()` is handed a name that does not exist. It cannot see a
call that plays a *defined* sound which is the wrong one — and the worst bug of
the session was exactly that: a boss turning over into its next phase played
`charged`, the wind-up before every heavy attack, so the one moment meaning
"this fight has changed" was indistinguishable from the twenty meaning "dodge".
Two of the six "missing" sounds also turned out to be **misnamed** rather than
missing (`swim` was the Squall Bellows; `hookshot` was the Anchor's chain, named
after the Oracle item it exists not to be). **Write the checker, then audit by
VERB anyway** — walk what the player and the world can do and ask what each one
sounds like. The checker buys you the floor, not the ceiling.

**A DEAD DEFINITION IS USUALLY A VERB THAT LOST ITS SOUND, NOT A SOUND NOBODY
WANTED.** Four sfx were defined and played by nothing. Three (`dig`, `shoot`,
`pegasus`) were genuinely orphaned by design decisions — no shovel, no player
projectile, no Pegasus Seed — and deleting them is right, because a sound with
no verb reads as a wiring job somebody forgot and costs the next session the
same ten minutes. But the fourth, `seed`, was the **opposite** bug: the
Reefseed's own plant verb existed and was playing the generic `place`. The sound
and the verb had both been in the tree the whole time and had never met. **Check
which kind you have before deleting.**

**PROVE A NEW CHECKER RED BEFORE YOU TRUST IT GREEN — AGAINST THE REAL TREE, NOT
A MUTATION.** S4's prompt demanded the checker be shown failing on `main` before
the fix, and it is the cheapest possible validation: stash the fix, copy the
tool back in, run it, read the six failures. A checker written after the bugs
are already fixed has never been red about anything, and there is no way to tell
it apart from one that passes because its matcher is broken. (Watch the
mechanics: the tool is an untracked file, so `git stash` will not carry it and a
careless `rm` after the run deletes it.)

**BEFORE BLAMING A TILE'S ART, COUNT HOW MANY TIMES IT IS PLACED.** S3 was
briefed to extract better cliffs because the hand-drawn ones betray a hand. They
do — but the reason cliffs never read as cliffs is that `cliffTop` was placed
**zero times in the whole overworld**: 1,307 cells of `#` and not one `^`. Every
cliff in the game was a solid mass of body tile with no edge anywhere, so
swapping the art would have produced a better-drawn wall of bricks and nothing
else. The game had ONE PIECE where the source has a set. `foamN` is registered,
drawn, and in no legend at all today, and 50 of the overworld's 52 static water
cells touch land with no foam on them — same shape, still open. **A grep for how
often a tile appears in the room data is a thirty-second check that reframed a
whole session.**

**A JOB'S PREMISE IS WORTH CHECKING AGAINST THE SOURCE BEFORE DOING THE JOB.**
S3's tree job was "the tree borders repeat on a visible period — extract
variants and break the period." The period is real. But cropping Seasons' own
forests shows **every tree identical and repeating**, so breaking the period
would be a deviation from the source, and `R9` says fidelity wins. What is
actually different is that our rooms pack trees shoulder to shoulder into a wall
where the source spaces them — a room-data question, not an extraction one, with
full `T10` stranding risk. **Fifteen minutes of looking at the reference turned
a wrong job into a correctly-scoped different one.** The same instinct is what
found the supercell answer in S2.

**GROUND CAN BE FOUND WITHOUT THE SHEET'S GRID; NOTHING ELSE CAN.** The seamless
scan works on ground because a window that repeats at +16 in both axes is
correctly phased by construction — the test finds the phase as a side effect. A
cliff face, a shoreline or a building front is one or two cells tall and never
repeats, so it can only be read off the grid, and the grid has to be found
first. **And the phase must be measured LOCALLY**: these sheets are assembled
maps with large non-map margins, and the Seasons spring sheet reports (0, 12)
whole-sheet against (8, 6) over its cliffs. Three attempts at picking cliff
cells were thrown away on the whole-sheet figure before this was noticed.
`rip-terrain.py --phase` is committed for it.

**AN AUTOTILER IS THE CHEAPEST WAY TO ADD A TILE GRAMMAR, BECAUSE IT TOUCHES NO
ROOM DATA.** Giving every cliff mass a top lip could have been done by editing
1,307 cells across a hundred rooms — which is exactly the change `T10` and `T13`
warn about, where a misplaced solid strands a screen and nothing fails. Deriving
the edge from the neighbours at draw time instead changed zero room grids,
zero replays, and could not affect passability by construction. **When a
fidelity problem looks like a data-entry problem, check whether the renderer can
work it out instead.** The one decision that needed care was what an
out-of-bounds neighbour counts as; getting it wrong draws a lip along the top of
every screen in the game, so it is asserted in `tools/test.mjs` in both
directions.

**THE OBVIOUS IMPLEMENTATION OF "MIX SOME VARIANTS IN" MAKES THE PROBLEM
WORSE.** S2's job was to stop a grass field reading as one repeated cell. The
natural move — extract four good grass tiles and pick among them evenly — was
built, rendered as a whole room, and is a **chessboard**. `rip-terrain.py`
quantises every tile against its OWN four colours, so two tiles that look alike
on a sheet can land on different palette indices, and every edge where two of
them meet becomes a hard tonal seam. A regular grid of dots is subtle next to a
quilt. What works is a SCATTER: one cell in seven, on tiles whose palette-index
distribution already matches the base's. **Neither the failure nor the rate is
visible in a single tile, or in a 3x3 swatch. Render a whole room.**

**MATCHING TONE IS NECESSARY AND NOT SUFFICIENT — THE MOTIF HAS TO MATCH TOO,
AND NO NUMBER CATCHES IT.** Having learned the tone rule above, S2 applied it to
the dungeon floor and found `dg 258,42` at 34/50/14 against `dFloor`'s 27/53/18
— the closest partner on any sheet, by the metric that had just been validated.
It was extracted, wired, screenshotted and reverted: `dFloor` is a **scallop**
and 258,42 is a **diagonal streak**, so scattered through a floor it read as
random patches rather than as masonry. A metric that worked once is not a
substitute for looking at the two tiles side by side in the palette the game
will actually use.

**A NEGATIVE RESULT THAT COST AN HOUR SHOULD BE COMMITTED AS A TOOL, NOT
WRITTEN UP AS PROSE.** `rip-terrain.py --scan` finds 16x16 windows that repeat
at +16, which structurally cannot see a field built from a 2x2 set of
alternating cells — exactly where multi-cell ground variation would live. The
only way to know whether the source games do that is to write the supercell scan
and run it, which S2 did: 758 windows on the whole overworld sheet against 4,129
at 16x16 in one grass region, 9 on the Seasons spring sheet, **zero on the Ages
sheet**. The source's ground fields are single-cell repeats and their variety is
hand-placed. That answer is now `--supercells`, a committed subcommand with the
measurements in its docstring, for the same reason `--scan` itself was committed
one session earlier: **the header of that function already said "the scratch
script that does it is not committed", and recovering it was a session's work
for something that fits on a screen.**

**AN ART CHANGE THAT MOVES A REPLAY IS AN ART CHANGE THAT IS NOT AN ART
CHANGE.** S2's prompt named this as its own test — `V11` must stay green, and if
it does not, the variant choice is leaking into simulation. It stayed green,
across all 51 assertions, with no re-recording at all. That is worth
generalising: for any change that claims to be draw-only, the replay suite is
not a formality to re-record afterwards, it is the assertion that the claim is
true. Pair it with a structural invariant — `validateTiles` now rejects a
variant whose flags, mask or `over` differ from its base — so the property is
checked at boot as well as at replay time. **A variant that quietly made a patch
of grass solid would render perfectly and be nearly impossible to trace from the
symptom.**

**A CONSTANT THAT ISN'T IN `feel.js` MAKES RETUNING THE ONES THAT ARE A
COSMETIC EXERCISE.** S1 set out to retune the six screen-shake constants around
the new hitstop and found that `src/data/bosses.js` spelled its own shakes out
as **fourteen bare literals** — `g.shake(4, 24)`, `g2.shake(5, 20)` and so on.
So the six named constants in `feel.js` had, for the whole life of the project,
described the shake of everything in the game *except the eight bosses*, which
is to say except every moment the shake exists for. The same session found the
same shape twice more in an hour: `dialogue.js` hardcoded the text speed and the
fast-forward multiplier, and those are the timing constants a player is exposed
to more often than any except walking. **The `R3` rule is not bookkeeping.** Its
value is that a number in `feel.js` can be changed once and be believed; a
number outside it silently exempts whatever it governs from every retune that
follows, and nothing fails.

**A NEGATIVE RESULT THAT IS WRITTEN DOWN AND NOT APPLIED IS WORTH MORE THAN A
BLIND CHANGE.** S1's prompt said to tune the text cadence against the source.
Both source games look nearer one character every other frame, which would be
about a third of this game's 1.6 ch/f — a three-times change to the pacing of
every line of dialogue in the game, made on an impression, by a session with no
reference to frame-step. That is exactly the "silently upgrade a `guessed`"
failure in a different costume. The value was preserved, the suspicion was
written into the constant's own comment as explicitly not applied, and the
experiment is now one line for whoever does step a reference. **"I believe this
is wrong and here is why I did not change it" is a legitimate and often the
correct deliverable.**

**REPLAY CHURN IS DIAGNOSED BEFORE IT IS RE-RECORDED, NOT AFTER.** `T5`
promises that a movement/combat change moves all 51 replays, and the temptation
on seeing 9 failures is to reach straight for `--record-all`, which would make a
real regression indistinguishable from expected churn. What made it safe was
cheap and took one look: **every failure was in a replay that lands a hit, and
every replay that never fights passed untouched.** That pattern is a prediction
the change makes about itself. Afterwards, comparing each recording's *outcome*
old vs new (7 of 11 byte-identical in end state, two longer by exactly a few
frames) confirmed it a second time. Re-record after the diagnosis, never as one.

**A CHECKER THAT CANNOT LAUNCH IS NOT A PASSING CHECKER.** `check-items` — the
tool that proves every item does the verb `docs/ITEMS.md` claims for it — did
not fail in a clean container. It threw a Playwright install banner, which reads
like an environment problem rather than a result, and the natural response is to
skip it and move on. Five tools were in this state (`check-items`,
`check-charms`, `check-trade`, `find-ledges`, `preview`), all missing the
system-Chromium `.catch` fallback that `test.mjs` and `solve-switches.mjs`
already carried. Once added, the three that assert produced 91, 63 and 43
passing assertions — none of which anything had been running. **Read a
checker's exit, not its last line, and treat "could not start" as red.**

**PROVE A NEW ASSERTION FAILS BEFORE BELIEVING IT PASSES — IN BOTH
DIRECTIONS.** S1's failure condition was a hitstop that freezes the whole game
rather than the entity simulation, which is inaudible in a screenshot and
invisible to every other checker. Six assertions were written for it, and then
the feature was deliberately broken twice: `freeze()` stubbed to a no-op (three
assertions failed, including "the player or the enemy moved while frozen"), and
the hitstop return moved above `frame++` — the exact frame-halt bug (the other
two failed). Neither half is vacuous, and that is now known rather than hoped.
A one-directional test would have passed happily against a game that stuttered
its music on every sword swing.

**A TILE'S NAME IS NOT ITS TIDE BEHAVIOUR — READ `room.flagsAt`, NOT THE
LEGEND COMMENT.** The write-up that shipped alongside the Kilnshell claimed the
Torch Cell needed HIGH tide to solve, on the reasoning that its floor is
`dBasin` and `dBasin` is "dry at LOW and MID, shallow only at HIGH" — true of
the tile in the abstract, and irrelevant to whether the room is passable,
because none of `dBasin`'s three states ever carries `F.DEEP`. Regenerating
`docs/GUIDE.md` against this fix meant checking `getRoom('d2', 0, 4, 5)
.flagsAt(x, y, t)` directly for all three tide levels rather than trusting the
prose, and the room turned out to have **no tide requirement at all** — the
shell survives the walk to all three torches at any level. The claim was
corrected in `docs/NEXT-SESSION.md` rather than repeated in the guide. **A tide
comment describes what the tile usually implies, not what it does in this
room**; the only source of truth for "can this be crossed, and does anything
here go out" is the flag, asked of the room the checker or the guide is
actually about.

**A CHECKER'S "NOTE" IS A TODO WITH NO OWNER, AND IT WILL SIT THERE UNTIL
SOMEONE READS THE VERBOSE OUTPUT AGAIN.** `check-hearts.mjs --verbose` has
printed, since before the first `docs/GUIDE.md` rewrite, a short list of Heart
Pieces reachable at only some tide levels — `cave2/0,0,0`@2,2 (LOW only) and
`overworld/0,11,4`@5,5 (LOW/MID) among them. They are logged as "Notes (not
failures)" on purpose, because a heart piece needing a specific tide is a
design choice, not a bug, and the tool has nothing useful to assert about it.
But a note nobody is obligated to act on is a note nobody acts on: the first
guide rewrite listed both pieces as "in the open" / "no requirements" and
`check-guide.mjs` had no way to catch it, because it checks that references
resolve, not that prose about them is accurate. Caught only by rereading the
verbose census by hand against the guide's own claims. **A checker's
informational output is exactly as easy to leave stale as a comment is** —
if it is worth printing, it is worth a line item in whatever document reads it.

**Two unrelated concepts sharing a field name on the same class hierarchy
made every boss in the game unkillable past its first phase, for the whole
life of the project, and nothing caught it because nothing had ever asserted
a boss's actual death.** `Boss.phase` (`src/game/enemy.js`) is that class's
own combat-phase index — 0, 1, 2 as a fight escalates through its tell/attack
patterns. `Entity.phase` (`src/game/entity.js`) is a completely different
thing: an option on a normal enemy's spawn (`{ phase: 0 }` on a `keese` or
`leever`) meaning "this enemy belongs to one tide level and doesn't exist at
the others" — the Brineglass Lens's phased-enemy mechanic.
`Game.updatePhaseShift` (`src/game/game.js`) decides whether an entity is
Lens-phased by checking only `e.phase == null` — and since a `Boss`'s own
phase index and the tide-level enum (LOW=0/MID=1/HIGH=2) both live in the
same tiny integer range, nothing ever threw a type error to flag the
collision. The instant any boss's fight-phase stopped numerically matching
its room's own tide level — which is every fight, past its first phase,
unless that phase's index happens to equal its own design tide by luck —
`updatePhaseShift` decided the boss was phased out: hidden, harmless, and
with `invuln` re-armed to at least 2 every single frame, one frame before
`Boss.update`'s own decrement could ever bring it to 0. That permanently pins
`hurt()`'s `if (this.invuln > 0) return false` open. Every boss's godmode
damage total in this repo's history — and every miniboss's, `Boss` being
their shared base too — plateaued at whatever it happened to deal during its
FIRST phase alone, and every session that measured a fight read that
plateau as an AI-tuning problem (chip damage, positioning, "swimming Link
cannot swing") because nothing had ever checked whether the boss actually
reached 0 hp. Two sessions' worth of reactive-movement tuning attempts on
Gohmaraq (a per-shot dodge, a hold-on-the-opening-edge delay — both tried,
measured, and correctly reverted as noise-sensitive) were tuning a symptom of
this. **The generalizable lesson: when a subclass reuses a field name its
base class's OWN generic systems already read for a different purpose, and
the two domains' value ranges overlap, the collision is invisible until
something asserts the actual end state (a kill, not "did damage go down"),
and it will look exactly like a difficulty or AI problem from the outside.**
Fixed by excluding `Boss` instances from `updatePhaseShift` via a permanent
constructor-set marker (`_bossClass`) rather than the existing `isBoss` flag,
which minibosses deliberately clear (see the "miniboss is not `isBoss`"
lesson below — same class-vs-flag distinction, independently rediscovered
here). Full writeup, the before/after damage table, and what it does and
does not fix: `docs/NEXT-SESSION.md`'s top entry.

**A checker that samples periodic state stops proving anything the instant
the thing it's watching gets fast enough to finish between two samples.**
`check-bosses.mjs` proved a boss's weak point opens by polling `boss.
weakOpen` once every 400 simulated frames — safe for years because no fight
had ever been able to finish that quickly, so there was always at least one
sample mid-fight. Fixing the bug above let Gloomtide die in about 300 frames,
comfortably inside one poll interval: the boss was dead and cleared from the
room before the first sample ever ran, and the checker reported "the weak
point never opened, 0 samples" for a shell that plainly had opened — a false
negative caused directly by the fix making the game MORE correct. The fix is
to instrument the actual state transition (a `Boss.prototype.weakOpen`
accessor that latches a global flag on any write of `true`) rather than
infer it from a poll, whenever the polled thing's own duration is not
bounded well below the poll interval by construction.

**A recorded replay can enshrine a bug as the expected baseline, and the fix
that corrects the bug reads as the replay "regressing."** `d1-clawcrab-den-
wide` recorded a walk past the Clawcrab Den miniboss with the crab
permanently hidden and harmless — a direct casualty of the bug above, since
minibosses share `Boss`. The room's own dev comment already said the crab is
supposed to shove the player ("The route uses `goto` rather than a held
direction because the Clawcrab is in the way and shoves"); the old recording
just never exercised that, because the bug had silently turned the crab
off. When a replay fails after a genuine engine fix, the right first
question is not "how do I restore the old numbers" but "does the old
recording describe the bug or the feature" — checked here by `git stash`-ing
the engine files and re-running the failing replay against the OLD code to
see whether the divergence traces to the bug being fixed, before
re-recording anything.

**Fixing one thing can perturb the timing of a totally unrelated,
already-broken test just enough to flip it from "passes by luck" to "fails
reliably" — and that is a gift, not a new problem, if the newly-reliable
failure gets root-caused instead of reverted around.** This session's engine
fix (above) made more boss AI actually run instead of sitting frozen, which
shifted incidental timing enough in `tools/walk-dungeons.mjs`'s very long,
single-continuous-session ledge-hop harness to turn one specific overworld
ledge probe from an intermittent pass into a reliable fail. Chasing it found
three real, independent, pre-existing bugs in that one harness function that
had nothing to do with the engine fix itself:
1. The file's own "New Game" boot never pinned `?seed=`, unlike every other
   tool's `SEED = 20260806` convention, so it played out a different random
   world — and put enemies in different places relative to every fixed probe
   spawn point — on every single run.
2. The probe resets a repositioned player's `z`/`vz`/`jumping`/`ledgeHop` but
   not `knockTime`/`knockX`/`knockY`, and filters every other entity out of
   the room only AFTER an initial 3-frame settle during which a room's own
   enemy can still land a contact hit — so a stray knockback could silently
   override the probe's own scripted key press for whatever frames of it
   were still counting down.
3. The probe's own `g.tide.setLevel(1)` call was missing `{instant: true}`,
   the one option every OTHER tide-setting call in every harness in this
   repo passes for exactly this reason — without it, `tide.busy` stayed true
   for the whole probe, and the SAME tile's resolved `ledge` direction read
   two different answers (`'down'` then `'up'`) from two `Room.tile()` calls
   made moments apart while the sweep was in that state.
None of the three would have been found by reverting the engine fix and
calling the test flaky again — they were found by treating "this now fails
every time" as strictly more informative than "this failed once," tracing
frame-by-frame with direct instrumentation (`console.log` inside the actual
refusal branches of `Player.tryLedgeHop`, not guessed from outside behaviour)
until the exact mismatched value was caught in the act, and only then asking
which upstream call was responsible. **A test whose determinism depends on
being lucky about unrelated timing is already broken; a change that removes
the luck is doing you a favour.**

**This container's Playwright package and its pre-installed Chromium are off
by one revision, and only some tools have a fallback for it.** `node_modules`
expects browser revision 1234; `/opt/pw-browsers/` only has 1194 installed.
`check-build.mjs` and `check-bosses.mjs` already catch the launch failure and
retry with an explicit `executablePath`; `walk-dungeons.mjs`, `check-gates.mjs`,
`solve-switches.mjs`, `check-trade.mjs`, `check-motion.mjs`, `check-items.mjs`,
`find-ledges.mjs`, `preview.mjs` and `check-charms.mjs` do not, and die with
Playwright's "please run playwright install" message before printing a single
assertion. The fix that got the full checker table green in this container
without touching any of those tool files: symlink the mismatched revision
directory into existence, pointing at what's actually installed —
```
mkdir -p /opt/pw-browsers/chromium_headless_shell-1234/chrome-headless-shell-linux64
ln -sf /opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell \
       /opt/pw-browsers/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell
touch /opt/pw-browsers/chromium_headless_shell-1234/{DEPENDENCIES_VALIDATED,INSTALLATION_COMPLETE}
```
That's an environment fix, not a repo one — it doesn't survive a fresh
container, and a future session hitting the same "please run playwright
install" wall on one of the tools above should reach for this rather than
assume the game itself is broken. The more durable fix would be teaching
every tool the same `chromium.launch().catch(() => chromium.launch({
executablePath: ... }))` fallback `check-build.mjs` already has, in one
shared `tools/lib/launch.mjs` — not done here, to keep this session's diff to
what the iPad-publishing task actually asked for.

**`window.innerWidth`/`innerHeight` are CSS pixels; an "integer scale" counted
in them is not necessarily an integer number of physical pixels.** `screen.js`
used to floor `window.innerWidth / SCREEN_W` and call that the scale — which
*is* an integer in CSS pixels, but the canvas's 160x144 backing store still
gets resampled onto the device's actual pixel grid, and CSS pixels only equal
device pixels at `devicePixelRatio === 1`. The fix multiplies by `dpr` first,
floors *that*, then divides back down for the CSS size (`this.scale = devScale
/ dpr`) — so the ratio between the 160x144 buffer and the physical screen is
always a whole number, regardless of what `dpr` itself is, and
`image-rendering: pixelated` has an exact grid to snap to instead of one it
has to guess at. Proved with `tools/shoot-rooms.mjs --vw= --vh= --dpr=`
(flags added this session) rather than by eye at the one desktop size the
tool defaulted to.

**Canvas 2D anti-aliases every path fill, and there is no flag to stop it —
so a procedural background drawn with `beginPath`/`lineTo`/`fill` is a
fidelity break this project's own checker measures.** The title screen's sea
was drawn as concentric wobbled rings, one filled path per ring, painted
largest-first. It looked right in a screenshot and it took the screen from 28
colours to **231**, because every ring arrived with a soft anti-aliased edge
and every edge invented blends. `check-build.mjs` prints that colour count on
every run, which is the only reason it was caught; nothing else in the suite
looks at it, and by eye a 231-colour swirl and a 3-colour swirl are hard to
tell apart at 160x144. The same applies to `rgba()` washes: an alpha fill over
a varied background invents one new colour per underlying colour, so the
"translucent water over the logo" idea was itself worth ~40 entries. Fixes,
both of which are what the hardware would have done anyway: write the field
into `ImageData` per pixel so every pixel lands on exactly one of three tones
(and bake the phases to offscreen canvases, since per-pixel trig on 23,040
pixels every frame is real work), and replace the alpha wash with a 2x2
dither tile of ONE colour, using a sparser tile to fade its bottom edge out.
Final count: 24. **Watch `check-build.mjs`'s colour number when you touch
anything that draws procedurally** — it is the cheapest fidelity check in the
repo and the only one that would have noticed.

**A pixel-art outline dilated on an un-padded grid silently loses its edge
outline on whichever side touches the array boundary.** Building the title
wordmark (`src/data/sprites-title.js`) meant computing a 1px black outline
programmatically: walk every transparent cell, paint it index 3 if any of its
8 neighbours is filled. Done on a grid sized exactly to the assembled
silhouette's bounding box, a glyph pixel sitting on the array's own edge (true
of nearly every line, since centering a shorter line inside a longer one does
not guarantee margin on the longer one) has no cell beyond the edge to paint,
so it silently loses its outline on that side only — not a crash, not a
missing sprite, just a wordmark that is subtly wrong on one edge.
`tools/validate.mjs --strict` caught the *symptom* (emitted art 2px smaller
than the manifest's declared `expectedSize`) but the mismatch alone doesn't
tell you why; that took reading the compositor. Fix: pad the index grid with
1px of transparency on every side before placing glyphs, so the dilation pass
always has somewhere to paint. Any pixel art that computes its own outline via
dilation needs the same margin — `outline()` in sprites-title.js now does it
for everything that goes through it.

**Display letterforms cannot be generated by upscaling a small font, and no
amount of palette work rescues them.** The first title wordmark took the 5x7
caps used for menu text, scaled it 2x, and shaded it. It validated, it had a
correct hard outline, it had a sensible gold ramp — and it read as a
placeholder, because at 2x a 5x7 sans is a 10x14 sans with chunkier pixels and
the source's title art is an *ornate serif*: 4px stems against 3px bars,
flared two-row serif feet, counters cut so round letters carry more weight on
their sides than across their top and bottom. Those proportions do not exist
in the small font to be scaled up. The fix was to hand-draw each display glyph
as a literal silhouette table at final size and let only the *shading* be
computed (bevel + outline dilation). That split is the reusable lesson: hand
authorship buys you the letterform, and computation buys you the consistent
1px edges — do not try to make computation buy you both. The three shading
passes in that file (`shade`, `outline`, and the backdrop's mottle) are worth
reusing; `setType` over a hand-drawn glyph table is the pattern.

**Procedural texture needs a wavelength longer than one pixel or it reads as
TV snow.** The title backdrop's mottle started as `lowFreqField*0.6 +
hash(x,y)*0.4`, which at 40% per-pixel hash is static, and static at 160x144
looks like a broken sprite rather than paint. Two low-frequency fields at
different scales carrying 88% of the signal, with the hash down at 12% doing
nothing but breaking up the banding, reads as a painted mass. Same file, same
`buildSplash`. Related: the pale halo around the wordmark was dilated by 2 and
that closed every letter counter and the gap between lines, turning the whole
backdrop into a featureless slab with the texture visible only around its rim.
At 1 it is a fringe on the letters, which is what it is for.

**The health cap is a SUM, so nothing in the project could see it, and it had
been wrong for six dungeon builds.** Maximum health is three hearts of start
plus one container per boss plus one container per four heart pieces — and that
last term is spread across two dungeon files, the overworld and the caves, in
three different syntaxes (an `entities` pickup, a `buried` triple, a
`puzzle.reward.spawn`). No file contains the total. P9 went looking for it and
found **18 pieces: four containers' worth plus two that could never become
anything.** A player could collect those two, hear the jingle, watch the counter
tick to 1/4 and 2/4, and be paid nothing, for ever. The cap was 13 against a
brief asking for 14-16.

The lesson generalises past hearts: **any quantity that is a sum over scattered
placements needs a tool that computes it, or it is not a designed number, it is
whatever the last six sessions happened to leave behind.** `check-hearts.mjs`
now computes it, and pins the distribution (every dungeon exactly two) so the
next dungeon session cannot move the game's maximum health while thinking about
a room.

**A reachability checker that only knows how to WALK will call correct data
broken.** `check-hearts.mjs`'s first cut asserted every piece sat on a standable
tile and immediately failed two long-standing, correct placements: one buried
under an `abyssHole` (deep water — it is not stood on, it is dredged up, and the
room has a bell NPC leaning at the tile) and one on a liftable rock (three
independent placements use that idiom). Both were the checker's fault. This is
the same lesson `walk-dungeons.mjs` learned about one-way ledges, arriving from a
different direction: **the verbs a checker knows are the verbs somebody typed
into it, and the data is usually right.** Check the data by hand before
believing a new checker's first red.

**Raising the health cap is a difficulty change even when no damage value
moves**, which is why P9's cap work and its damage re-derivation had to happen
in one pass. Do not tune the supply side and the damage side in separate
sessions; the second one will be tuning against a curve the first one moved.

**A derivation you cannot measure should be written down and left unapplied.**
P9 derived a corrected damage ladder (heavies to one heart, minibosses to a
heart and a half, bosses to two) and did not land it, because every enemy it
touches in the only instrumented dungeon sits past the Sluicegate — the point
`check-playthrough.mjs` cannot reach for want of an anchor-placement verb in the
actor. The instrumented run would have shown no change at all while the numbers
went in looking proven. It is recorded in `check-hearts.mjs`'s own comment and
in FEEL-SPEC.md, waiting on the route.

**A quest whose reward opens a region can be placed behind its own gate, and
nothing in the repo would have said so.** The Coastwise Chain (P9.5,
`docs/TRADING.md`) pays out the Resonance Rod, and the Rod is the key to the
Salt Pans' vanes. Any one of its eleven links dropped on a Pans screen would
have been a gate holding its own key — and `check-overworld` would still have
been green, because its flood proves the WORLD is connected given the items,
never that a quest's own steps are reachable before the quest's own reward.
The general shape: every checker in this repo proves a part, and a quest is a
part nobody had written a checker for, so a new one that hands out a gate item
brings its own reachability proof or it has none. `check-trade.mjs` floods
from the village with bombs only and asserts every link can be stood next to.

**A trading sequence is a stage counter, not a set of wants — and the
difference only shows up on the links you are not standing in front of.** The
obvious build is "this trader takes item X"; it is wrong, because the player
holds exactly one trade item and several traders down the line would happily
take it, skipping half the chain in one conversation. `trader` deals are keyed
on `p.trade.stage === stage - 1`, so exactly one deal in the whole world is
live at any moment, and `wants` is asserted against what is in hand rather
than consulted — a disagreement between the two is a data error that refuses
the trade and warns, instead of quietly paying out the wrong link.

**Deals live on the trader, which is the only reason the chain can be a
circle.** Ossa is stage 1 and stage 11 — she hands over the float and takes the
kettle back — and that is one entity holding two deals, not two NPCs on one
tile. Anything that models a trading chain as one-NPC-one-trade cannot express
the shape the whole quest is built on.

**Converting an existing NPC into a trader is free; adding one is not.** All
ten coast traders were already-placed `npc` entities that changed type in
place, so no entity id moved, no enemy re-phased, and all 51 replays passed
unchanged on the first run. Adding an eleventh villager anywhere ahead of them
in load order would have cost a re-record of every tape (see the warning in
`overworld.js` on the starting room). Each one also keeps its old flavour line
as the trader's `waiting` text, so the coast sounds identical to a player who
never starts the chain.

**A checker's private collision model does not fail when the real rule
changes under it — it just quietly starts being wrong, and it can be wrong
for the WHOLE LIFE of the checker before anything notices.** Nine tools
(`walk-dungeons.mjs`, `check-overworld.mjs`, `solve-switches.mjs`,
`find-ledges.mjs`, `check-anchor.mjs`, `check-bellows.mjs`, `check-cleats.mjs`,
`check-dredge.mjs`, `check-lens.mjs`, `check-reefseed.mjs`,
`find-crossings.mjs`, `check-towns.mjs`) each carried their own copy of "is
this tile solid", several of them byte-identical to each other. Consolidating
them onto the engine's own `Room.solidAt`/`canOccupy` (via a new
`tools/lib/collision.mjs`, plus a `tileDefSolid` extracted out of `solidAt`
itself so there is only ever one copy of the formula) changed no check's
pass/fail verdict, but it silently fixed two real, previously invisible bugs:
`check-overworld.mjs`'s flood was refusing to walk onto any `mask: 0` doorway
or cave mouth (its private formula ignored `mask` and treated every
`F.SOLID`-flagged tile as fully blocking, when the real engine reads `mask: 0`
as "the flags say wall, the mask says open" — exactly the case a doorway is),
and `find-ledges.mjs` was offering bush and liftable-rock tiles as valid
ledge-lip placements (its private formula never excluded `F.BUSH`/`F.ROCK`,
which nothing stands on as "plain floor" without clearing it first — 87 and
414 tide-instances of those flags exist in the data). Neither bug tripped a
single assertion in years of this checker existing, because neither happened
to matter to any DECLARED room's reachability — which is exactly the failure
mode of a duplicate model: it is not wrong in a way anything is watching for.
`tools/test.mjs` now fails if a tool outside `tools/lib/collision.mjs`
combines three or more collision-shaped flags in a bitwise mask, which is the
guard that would have caught all nine on day one.

**A world can be provably unfinishable while every checker is green, and the
shape that does it is a CYCLE OF TWO GATES.** `check-overworld.mjs` proves each
gate twice — the region is sealed without its item, and open with it — by
dropping ONE gate and holding all the others. That is the right question for
"is this gate a gate" and it is blind to the only arrangement that actually
breaks a playthrough: gate A opened by an item behind gate B, gate B opened by
an item behind gate A. Every single-drop run walks through the other one, so
both look fine. The world shipped in exactly that state. The Cliffs of Kell
(holding D4's door) and the road to the Keep (holding D6's door) were both
sealed by tiles only the Dredge Line opened, and the Dredge Line is the item
inside D6 — so a real player floods 59 of 120 screens, clears four dungeons and
stops. Seventeen green assertions, `walk-dungeons` green, `check-gates` green,
`check-playthrough` green (its recorded route never gets that far).

The fix is not just the data. `tools/check-progression.mjs` floods in
ACQUISITION ORDER — a new game holding what the intro gives, then exactly what
each dungeon grants as its door comes into reach, read out of the dungeon's own
chests rather than written down — and asserts every dungeon's door is reachable
while its own item is still inside it. Run it against the commit before the fix
and it reports 4/6 dungeons and 95/120 screens. **If you move a gate, that is
the tool that has to stay green**; the per-gate ones cannot see this class of
bug at all, and one of them being green is what made this cost a session.

**A gate that two items open is not a gate on either of them.** The first cut
of the fix cracked ONE boulder of the Deep Cut's four-tile rockfall, leaving
three carrying `F.HEAVY`. The Dredge Line drags those three and the player is
through, so `check-overworld` reported "without Bombs the Cliffs are sealed" as
seals-10-screens — the Marsh only — and the Cliffs quietly had two keys. Same
rule one level down: `boulderCracked` carries neither `F.ROCK` nor `F.HEAVY`,
because a boulder you can also lift or also drag is gated on whichever of the
three you happen to be holding.

**BOMBS DO NOT LIGHT TORCHES, AND MAKING THEM DO IT WAS A FIDELITY BREAK, NOT A
FIX.** The first answer to the dead torch action was to have the blast emit
`'fire'`. It worked, every checker went green, and it was wrong twice over. The
Oracle games light torches with the Lamp and with Ember Seeds and never with a
bomb, so Goal 1 rules it out on its own; and it put the answer to the Coral
Spire's floor-0 puzzle inside the Coral Spire's floor 1, behind the very door
that puzzle's key opens. **When a missing mechanic has no obvious owner, the
shape of the fix is a new item, not a new power bolted to an old one** — and the
tell that you are bolting is that the item you are extending is one the player
gets LATER than the puzzle you are unblocking.

**F.WET IS F.WATER|F.DEEP, AND AN ITEM THAT CARES ABOUT WATER ALMOST CERTAINLY
CARES WHICH.** The Kilnshell lights in shallow water and drowns in deep. Written
against `F.WET` it lit itself and doused itself in the same puddle on
consecutive frames, and read from outside as "the tide does nothing to it". The
three-state version — dry, shallow, deep — is also what makes the item belong to
this game rather than to any game with a lamp in it: one tidePool tile is where
you set the shell down, where you light it, and where you must not leave it.
Check the tide table of the tile you are designing against (`resolveTile` at all
three levels) BEFORE writing the rule; `dBasin` is dry at LOW *and* MID and only
shallow at HIGH, and a puzzle built on the wrong assumption is unsolvable in a
way that looks like a broken item.

**AMMUNITION WITH NO CONTAINER IS SOLD HAPPILY AND DELIVERS NOTHING.** Every
counted pickup clamps to its capacity and every capacity starts at zero, so the
shop's twenty-rupee bombs took the money and added zero bombs to a player with
no bag — and the bottle refill did the same, denying only AFTER the sale. The
shop now refuses the sale and says why. Bombs come from the bag, which is a
dungeon's to give; a shop restocks a container, it does not replace one.

**A VERB THE TILE SYSTEM UNDERSTANDS AND NOTHING EVER EMITS IS INVISIBLE TO
EVERY CHECKER IN THE REPO.** `Torch.ignite` is reachable only from
`checkTileAction(rect, 'fire', …)`. The tile system knew the action, effects.js
had a flame, a charm called Dry Kindling was painted fire-coloured — and no call
site in `src/` ever passed `'fire'`. Every torch in the game was scenery, and
three puzzle rooms were dead.

One of them deadlocked the game. The Coral Spire has two keys and two locked
doors; the torch key's door is the Stair Coil, the ONLY way to floor 1. So the
Lens, the Bombs, the Boss Key and Anemos sat behind a key that needed a fire
nothing could make — and the Bombs gate the Sunken Marsh and the Cliffs of Kell,
so D3, D4 and the Maku Tree's road to the Keep fell with them. A brand new game
could reach the second dungeon's entrance hall and stop for ever.

Why nothing saw it: `walk-dungeons.mjs` counts a puzzle-reward key as available
once its ROOM is reachable — deliberately, because proving puzzles solvable is
another tool's job — and `solve-switches.mjs` covers only the nine push-block
rooms. The torch equivalent had never been written. **Every puzzle TYPE needs a
tool that proves it solvable, or the type is unwatched**, and an unwatched type
is not a missing test, it is a room that silently cannot be finished.

The fix was three lines and one key: the blast now emits `'fire'` (a bomb is the
one thing the player carries that is already fire), and D2's floor-0 Small Key
moved to the switch room that was already there, so the Torch Cell becomes a
room you find early, cannot answer, and come back to — which is the shape it
always had. `tools/check-torches.mjs` now watches both halves.

**AND THE CHECKER'S OWN FIRST DRAFT WAS FOOLED BY A COMMENT.** It grepped `src/`
for a call passing `'fire'` and passed happily against a build whose only
emitter was `// game.checkTileAction(this.rect(), 'fire');`. Found by deleting
the emitter on purpose and watching the tool stay green. **Test a new checker by
reintroducing the bug it was written for**; one that has never failed has proved
nothing, and a source-grepping tool must strip comments before it believes what
it reads.

**A HARNESS THAT WALKS OUT OF A BOSS ARENA REPORTS A FLAWLESS VICTORY.** The
first cut of `dBoss` strafed on a fixed up/down cycle whenever the boss was
shelled. A boss room has exits, and leaving one wipes every non-player entity in
the room — so `g.boss` went null with the player at full health, and the obvious
test ("no boss, nobody died, therefore killed") reported **six flawless kills
against six bosses it had never touched**, at 88 frames each. The tell was the
frame count: 88 frames is a second and a half, and Gohmaraq has 24 hp.

Two things follow. First, every combat directive has to run its mask through
`dFight`'s `fence`, which strips whatever direction would leave the room; that
is why the fence exists and it is not optional for bosses. Second, and general:
**"the enemy is gone" is not "the enemy is dead."** Assert the positive fact —
`progress.beaten[mapId]`, or the essence spawning — never the absence of an
entity, because absence is also what leaving the room looks like.

**A GENERIC BOSS AI LOSES, AND THE NUMBER SAYS SO.** Once fenced, the verb
fights properly: it waits out the shell, takes the opening and lands real hits
(Gohmaraq 24 hp -> 18). It still loses, and not narrowly — measured at about
**one point of damage dealt per five quarter-hearts taken**, tested at both 3
and 6 hearts. Bosses run 24 to 80 hp, so that trade needs roughly thirty hearts
against the first boss of the game. Tuning it the other way (evade until a safe
opening) survives twice as long and deals ZERO damage: it never commits.

The lesson is the scoping one. Every boss is built on one shared rule
(`shell`/`weakOpen`), and that rule is enough to know WHEN to attack and not
enough to know HOW: the slam radius, which side is safe, and how long the walk
in costs are per-boss facts. A generic verb gets the timing gate for free and
has to earn the positioning. Budget a session for it, and prove it on Gohmaraq
at three hearts, because that is what a real player brings to D1.

**`check-anchor.mjs` PROVES REACH AND CALLS IT A CROSSING, and for the Iron
Pipe the two are different tiles.** It reports "d1 0,4,2: one anchor placement
crosses it — stand 0,3 at LOW, bite 1,3". The throw really does carry two
tiles, so 1,3 is reachable and that half is right. But the bite holds a
RADIUS-2 PATCH, and where the patch lands decides the room. Probed in the live
engine at MID, walkable row then PIT flags:

    bite 1,3 -> walk ....#.....   pit ----------    x=4 is a WALL
    bite 2,3 -> walk ..........   pit ----------    the only clean crossing
    bite 3,3 -> walk ..........   pit -----P----    an open pit at x=5
    bite 4,3 -> walk .#........   pit -----PP---    a wall and two pits

The tool's own named solution does not cross the room. Two lessons, and the
second is the expensive one. First: a patch-shaped verb has to be proved by
where the PATCH falls, not by where the throw reaches. Second, and general —
**F.PIT is not solid, so "walkable" is not "safe".** `canOccupy` answers true
for a pit because the engine lets the player walk in and then punishes him;
that is why `tools/lib/collision.mjs` carries ROUTE_AVOID at all. A checker
that asks only "can something stand here" will happily route a player through
a hole. The playthrough found this by LOSING SIX QUARTER-HEARTS and spending
2,139 frames in a corridor it never left, which is exactly the kind of thing no
model reports and a run cannot hide.

**A CHECKER THAT ARRIVES ON A BRANCH IS AS STALE AS THE BRANCH IT ARRIVED ON,
and git will not say so, because a new file conflicts with nothing.** Merging
the progression branch after the collision-consolidation branch landed
`check-progression.mjs` carrying the TENTH private copy of "is this tile solid"
— the ninth had just been deleted. Nothing in the merge flagged it: the file is
new on one side, so there is no conflict to resolve. It surfaced as two
unrelated-looking reds, `tools/test.mjs`'s new guard naming a file the guard's
own author had never seen, and a reachability failure. The lesson is not about
collision: **when a branch adds a tool and another branch changes the RULES all
tools obey, the merge has to re-audit the new tool against the new rules by
hand, because every automatic signal you have is silent.**

**Changing what an NPC IS can move an item out of the field a checker reads,
and the checker stays green while the world breaks.** Making the Maku Tree a
trader moved the Resonance Rod out of `o.item` and into `o.deals[].item`.
`check-trade.mjs` was green (it reads deals), `check-overworld.mjs` was green
(it is told which items exist), and `check-progression.mjs` — the one tool
whose whole job is "can a real player get this" — silently stopped granting the
Rod and reported the Salt Pans unreachable by a FINISHED game. A grant that
changes its shape has to be re-found in every tool that reads grants; grep for
the field name, not for the item's name.

**Story data that describes a design is not the design being wired.** The
`makuMaster` cutscene — the Maku Tree opening the road to the Keep and handing
over the level-3 sword — sat complete in `src/data/story.js` for the whole life
of the project with NOTHING TRIGGERING IT: no entity referenced it, no flag
read `makuOpenedKeep`, and the only `giver` on that screen stopped at the Rod.
So the sword had three damage tiers, three HUD icons and three swing sounds,
and a real player's sword never left level 1. Grep for a cutscene id before
believing a scene happens; `check-progression.mjs` now reads a `makuTree`
entity's scene and asserts the grant is collectable.

**Writing `docs/GUIDE.md` (a data-generated player's walkthrough) found that
D4 and D6 cannot be reached from the rest of the map, and no existing
checker says so.** `node tools/check-overworld.mjs` with no items held
floods only 59/120 overworld screens; the unreached set includes both D4's
entrance (`overworld/0,1,3`) and D6's (`overworld/0,1,0`), both sealed by
`F.HEAVY`/`F.MAGNETIC` tiles that only the `dredge` item opens — and the
Dredge Line is D6's OWN item, found inside D6's Dredge Vault
(`d6/0,4,3`). The door in is gated by what's behind it. Every other gate in
this game is provably openable by an item from an earlier, reachable
dungeon; this one is a cycle. **Why nothing caught it:**
`check-overworld.mjs`'s per-gate assertions each prove "sealed without ITEM,
open with ITEM" in isolation — never "and ITEM is obtainable before you have
to cross this gate to get it" — so a gate whose own key is locked behind
itself passes every existing assertion cleanly. `check-playthrough.mjs`, the
one tool that plays rather than models, doesn't reach far enough to notice
either (its route is still D1-only; see below). Found by chasing the guide's
"main route" section: writing down a route in prose and then trying to prove
each dungeon's entrance was reachable in order is what surfaced it — a check
that models each gate independently, the way `check-overworld.mjs` already
does well, will not surface an END-TO-END ordering problem no matter how
many gates it proves individually. If a future session adds a
"checks the whole progression graph, not just one gate" tool, this is the
bug it should catch on its first run. Not yet fixed; see
`docs/NEXT-SESSION.md`'s board for the two candidate fixes.

**The actual Heart Piece count, read out of `src/data/`, is 18 — not the 19
a task description or a stale doc might assume, and not derivable by
`grep -c heartPiece` alone.** `src/data/audio.js` defines a jingle literally
named `heartPiece`; it is not a pickup and grep cannot tell the difference by
itself. And one of the 18 real placements does not live in a room's
`entities` array at all — D3's Reed Cell (`d3/0,4,4`) hands its Heart Piece
over from `puzzle.reward.spawn`, which fires after the room's enemies are
cleared, a shape none of the other 17 placements use. A script that only
scans `entities` and `buried` will silently undercount by exactly one and
have no way to notice.

**A health-economy reading is only as honest as the looter taking it, and
`dLoot` had two bugs that silently starved every run for two sessions.**
Instrumenting D1's room-by-room health economy (see FEEL-SPEC.md) found the
Sunken Hall's fairy — reachable at all only since push blocks became solid —
sitting on the floor uncollected at the end of every run. Root cause: (1)
`dLoot` samples the moment it's called, filters on `grabDelay <= 0`, and gave
up FOR GOOD the instant nothing passed that filter — right for "nothing is
here" and wrong for "something just spawned and has `PICKUP_GRAB_DELAY` (8f)
left to count down," which is exactly the state a puzzle reward is in the
frame `dLoot` is called right after it. (2) A reward pickup that pops and
settles can rest visibly ONE TILE ABOVE the tile its centre-Y resolves to —
`dungeons-a.js` already documented this on the Crab Pit's key ("the player
can only just touch it") as a fact about the ROOM, but nobody had noticed it
was also a fact the actor's approach math got wrong, walking to the tile
below where the sprite actually sits and standing there forever. Both fixed
in `tools/actor-runtime.mjs`'s `dLoot`; both proven behaviour-preserving by
all 51 replays passing unchanged, because a well-behaved pickup is still
collected on the first attempt and neither new code path fires for one. The
general lesson: a shared actor-runtime bug does not fail loudly — it reads as
"the game is stingy" when the game handed over the item and the SCRIPT
walked past it.

**A probabilistic drop-table bump cannot be proven against one deterministic
seed.** Raising three rooms' drop odds from `common` to `good` (see
FEEL-SPEC.md) measurably helped the run's total health picture but did NOT
fix the specific worst trough, because the one roll that mattered on seed
`20260806` still drew nothing — better odds are not a guarantee, and this
whole project's checkers are single-seed by design. The fix that actually
closed the trough was a GUARANTEED pickup (a `heart` added to an existing
puzzle reward's `spawn` list, deterministic and free of any RNG draw), placed
at the one room upstream of the drought that mattered. When a specific,
provable trough needs fixing — as opposed to a general "the odds feel thin"
— reach for a fixed placement, not a probability, or the fix cannot be shown
to have worked on the very seed everything else in this repo is proven
against.

**The wave channel's floor is not the pulse channels' floor.** Writing
`check-music.mjs`'s frequency-range check surfaced that a track's bass line
routinely uses octave-1 notes (`D1`≈36.7Hz, `C1`≈32.7Hz) that sit *below* the
real Game Boy pulse channel's 64Hz hardware floor. That is not a bug in the
existing tracks: the wave channel (`wav`) runs its frequency timer at half
the rate pulse channels do, so its floor is 32Hz, not 64Hz. Check it
per-channel (`ch === 'wav' ? 32 : 64`), not with one constant, or every
existing bass line in the game fails a checker that is actually correct.

**A GB tracker format that plays one token per row cannot literally
"overlap" a note.** Asked to check "no channel has overlapping notes" against
a format where each channel is monophonic and one row plays exactly one
token, the only real analogue is a dangling hold: a `-` token with no
sounding note before it in that pattern (nothing to hold over). Implemented
that way in `check-music.mjs`, with the reasoning in the file's own header
comment so the next reader doesn't wonder why it isn't checking something
that structurally cannot happen.

**A track's `order` array is not required to use every pattern once.**
`finalBoss` plays `['A','A','B','A','C']` — `A` three times, `B` once,
`C` once — and that is a legitimate "A-B-A-C shape with a bridge" already. If
a future session is told to bring a track "under three patterns" up to that
shape, check `Object.keys(t.patterns).length`, not just eyeball `order`: a
track can already have three-plus patterns and a repeating order and still
read, at a glance, like it needs work.

**`tools/test.mjs` was missing a Chromium fallback that `check-build.mjs`
already had.** Both call `chromium.launch()`; only `check-build.mjs` caught
the case where the installed `playwright` package (resolved by semver caret
to a newer minor than whoever wrote the browser-provisioning step expected)
wants a browser build the pre-provisioned `/opt/pw-browsers` doesn't have,
and fell back to `executablePath: '/opt/pw-browsers/chromium'`. Without that
fallback `test.mjs` cannot launch at all — not "some tests fail", the whole
harness throws before the first assertion. The fix is the same four lines in
both files now. If another `tools/*.mjs` grows its own `chromium.launch()`
call independent of `loadPlaywright()`'s shared helper, it will hit the same
wall the same way.

**THE FIRST THING ANYBODY PLAYED, and what playing it found.**

`tools/check-playthrough.mjs` drives a new game from the title screen with real
button presses and nothing granted. On its first complete run it found that
**the game cannot be finished**, and the cause is one line that was never
written:

> `Entity.solid` is never read by anything in the movement path. `canOccupy`
> samples TILES only; `moveEntity` asks nothing else.

So the player walks through every push block, chest, torch and signpost in the
game. And because `Player.tryPush` only fires on a movement HIT, **no block in
this game has ever been pushed, or can be.** Three things follow, and they are
all invisible to the rest of the suite:

1. **D1 is unbeatable.** Two locked doors stand between a new game and the
   Tidewright's Anchor. The two Small Keys that open them are the Crab Pit's and
   the Switch Room's, and the Switch Room wants both its blocks on both its
   `hold` switches simultaneously — one body cannot press two. The dungeon's
   only heal, the hub's fairy, is behind an identical pair.
2. **`solve-switches.mjs` and `walk-dungeons.mjs` are green because they model
   the push.** Both are correct about the geometry and both are describing a
   verb the engine does not have. This is the exact gap the playthrough harness
   was written to close: a flood is a model, and the model does not press a
   button.
3. **`check-towns.mjs`'s cut-tile clause is proving a rule nothing enforces.**
   The lesson immediately below says "an NPC is a solid tile that nobody
   checks". It is truer than it was meant to be — an NPC is not solid to the
   player at all, so a townsperson in the one crossing row does not sever the
   screen. The clause is still worth keeping (it will be right the moment the
   engine is fixed), but it is currently insurance, not a proof.

**Do not fix it casually.** Teaching `canOccupy` about solid entities is about
five lines. It was tried on `claude/playthrough-test-harness-jq9z5o` and the
recorded baseline moves: `d1-descent` diverges at frame 1620 and ends dead on
the overworld, `d2-fork-wrong` diverges at frame 240 and never leaves its first
room. All 51 replays want re-recording and every checker wants re-verifying
afterwards, and the playthrough harness's own determinism proof rests on that
baseline. It is a session, not an edit.

**A session was asked to extend the route past D1 to the final boss room, and
stopped without touching `tools/playthrough-route.mjs`.** The prompt assumed
the block-pushing fix above was already in — it is not; nothing on this branch
had changed since the run described above. The Switch Room at `d1 0,4,4` (see
`src/data/dungeons-a.js`) still needs both blocks on both `hold` switches at
once, `Entity.solid` is still unread in `canOccupy`/`moveEntity`, and
`node tools/check-playthrough.mjs` still stops at `d1/0,3,3` with the same 20
assertions green. There is nothing past that point to route to yet. Extending
the route is still exactly one prerequisite away: land the fix above (as its
own session, replays re-recorded), then delete `GOAL.blocked` and point
`GOAL.room` at the final boss room.

**Two smaller things the same run turned up.**

- **A new game puts the CONCH on B and the SWORD on A.** The intro cutscene
  gives the conch first, `Game.autoEquip` fills B before A, and nothing ever
  swaps them. Every replay plan pins `equipB: 'sword'` in its setup, so for the
  whole life of the actor "swing" was spelled `BIT.b` and it was always right —
  and would have pressed the conch at the first enemy of a real run. The actor
  reads the slot out of progress now. Whether the DEFAULT is right is a design
  question nobody has answered: it is the opposite of the convention the source
  games set.
- **An actor that does not pick up drops dies.** `dFight` returns the instant
  the last enemy falls, leaving every heart it dropped on the floor. On the
  three hearts a new game actually starts with, that is the difference between
  reaching the Locked Stair on four quarter-hearts and bleeding out in the Tide
  Gallery six rooms in. `dLoot` is not the harness cheating; it is the actor
  learning to play. The health economy is still thin enough that the optional
  Weeping Wall one room off the route kills the run.

**THE FIX LANDED, and it was still a session, not an edit — exactly as warned
above.** `canOccupy` (`src/game/entity.js`) now rejects a position overlapping
a non-dead `solid` entity, skipping the check while airborne. Verified by hand
before touching a single replay: spawn a block, stand south of it, hold `up`
120 frames — the block moves one tile north and the player stops flush behind
it. Then all 51 replays re-verified; 4 changed (`d1-descent`, `d2-fork-wrong`,
`village-walk`, `village-shop-door`), each for an explainable reason (see
NEXT-SESSION.md's board), and every checker in the CLAUDE.md table re-run
green with the counts unchanged except where explained. Two new things this
pass found that the warning above did not anticipate:

- **`reconcileWithTide` runs on every `enterMap`, and it was written for
  tide safety but is generic in what `canOccupy` tells it.** It now also
  catches "the player spawned inside a solid entity" and rescues them via
  `findSafeTile` — which is correct in general, but on `village-shop-door`'s
  synthetic test spawn it rescued the player to a tile flush against a solid
  wall, 8px from the door, stranding a canned `hold up` script that used to
  walk straight through the 2px of accidental hitbox overlap with a
  stationary NPC. **Any door's return-warp landing pixel that clips a
  stationary or home-tile NPC's hitbox will now silently relocate the player
  on entry.** No checker sweeps the whole map for this — `check-towns.mjs`
  proves an NPC doesn't sever a screen's flood, not that a warp's landing
  pixel avoids one. Worth a dedicated pass before trusting the other three
  towns' return warps.
- **`actor-runtime.mjs`'s block-move counter has always been wrong, just
  never visible before.** `_audit_tick` marks a moved block's `_blockHome`
  entry with a sentinel string, then compares every later frame's position
  against that same sentinel — which never matches again, so `blocksMoved`
  increments once per frame after the first move, not once per block. Cosmetic
  (the pass/fail check is `blocksMoved === 0`, still correct), not fixed here.

**What did NOT move, and why that is informative rather than suspicious.**
`solve-switches.mjs` and `walk-dungeons.mjs` both stayed at their exact prior
counts (9/9, 23/23). Both are pure models of the world that already assumed a
push resolves the way `PushBlock`'s own logic says it does — making the real
engine agree with a correct model does not change what the model can see. If
either had moved, that would have meant the model was silently wrong about
something the flood could reach; it wasn't.

**`check-playthrough.mjs` still does not pass the Locked Stair, and the reason
is data, not the fix.** The playthrough's own audit shows blocks genuinely
moving in a full run now. But `tools/playthrough-route.mjs`'s 83 scripted
directives were tuned against the old walk-through physics, and the run now
ends early — d1 0,2,5, short of the historic blocker at 0,3,3 — because a
`goto`/`travel` leg runs into a real obstacle it used to pass through. Compare
this to the two replays above: those diverged and still finished, because
their goal was a fixed final state a slightly different path still reaches.
The playthrough's ROUTE is closer to a replay's canned button-holds than to a
`goto`'s live pathfinder in the legs that broke, so it has no way to route
around a new obstacle on its own. Retuning it, deleting `GOAL.blocked`, and
extending the route past the now-pushable Switch Room and Crab Pit puzzles is
next-session work — it is real design/tuning across 83 directives, not part
of this fix.

**The peoples (PT step 4), and the two things they cost.**

1. **AN NPC IS A SOLID TILE THAT NOBODY CHECKS.** The "one corridor" rule below
   is about wells and stumps, and it turns out it never cared what was standing
   in the row. `check-towns.mjs` grew a cut-tile pass — take each walkable tile
   out, re-flood, and see whether a way in or a door goes unreachable — and it
   failed on its first run against content that had shipped: **the coast child
   on Village Shore stood on 5,2, the only row that crosses that screen, at all
   three tide levels**, and the Sandpiper Row signpost stood in its top
   corridor. Both had passed every checker in the repo, because every checker in
   the repo reads tiles and an NPC is not a tile. A wanderer cannot be proved
   this way — it walks the whole region and can stand on a cut tile for a few
   seconds — so those are printed as a note instead, and `PINCH=1` prints every
   town's cut tiles for whoever is deciding where the next townsperson stands.

2. **ADDING ONE NPC RE-PHASES EVERY ENEMY IN THE GAME.** `nextId` in
   `src/game/entity.js` is a single global counter, and `every(e, n)` phases an
   entity off its id rather than off a stream. So an entity added to the
   STARTING room shifts every id allocated afterwards, every enemy's cycle moves
   with it, and a replay recorded somewhere else entirely diverges. One extra
   villager in Tidewatch made the `d1-descent` actor walk into a hit it used to
   dodge, take two hearts, die three rooms later and finish the run on the
   overworld — reported as `playerId: expected 1, got 201`, which is the
   respawn, not a bug in the id. It is deterministic and it is not a desync: the
   run is simply a different run. **Re-dress an existing NPC rather than adding
   one to a room a replay walks through**, which is what Tidewatch's Brinekin
   is; re-recording is the wrong fix when the re-recorded run dies.

**The towns (PT), and the five things they cost.**

1. **A CHECKER THAT GRANTS SWIMMING CANNOT SEE A TOWN BREAK.** `check-towns.mjs`
   was written with the overworld checker's flood, which treats deep water as
   passable because the player eventually owns the Cleats. Under it, three of
   the four town screens passed. They were all severed at HIGH: the tide pool
   closes the middle of a screen and the buildings close the rest, and the only
   remaining route was a swim the player of that hour cannot make. One line —
   adding `F.DEEP` to the impassable mask — turned every one of them red. A
   town is walked, not swum, and the flood has to say so.

2. **A 10x8 SCREEN WITH TWO 3x3 BUILDINGS HAS EXACTLY ONE CORRIDOR.** Four
   layouts of Tidewatch died before this was believed. Buildings at rows 2-4
   leave the west seam column reachable only along row 5; put a 2x2 well or a
   3x2 stump in row 5-6 and the west half of the village is a pocket, or the
   east half is, or the door is. Nothing renders wrong. The rule that fell out
   of it: **the row the buildings do not occupy belongs to the road**, and only
   1x1 dressing goes in it.

3. **A DOORWAY IS `F.SOLID` WITH `mask: 0`, and a checker that reads the flag
   calls it a wall.** That is the pattern `caveMouth` has carried since the
   first cave — solid so nothing spawns in it or is thrown through it, mask 0 so
   the player's feet may enter — and every flood in the repo tests
   `flags & F.SOLID`. Read the mask, or every town reports a shop nobody can
   enter in a village that plays perfectly.

4. **CHECKERS THAT READ A ROOM AS CHARACTERS GO BLIND THE DAY A BLOCK LANDS.**
   `check-overworld.mjs` resolved a legend character to a tile: one character,
   one tile, anywhere. A block breaks that — nine H's are nine different tiles —
   and `getTileDef('block:bShop')` returns the empty tile, whose flags are 0, so
   the flood walked straight through the shop and reported 17/17. It now builds
   every screen and reads `room.baseName`, which is the engine's own answer. Any
   tool that reads `def.map[y][x]` through a legend has the same hole.

5. **AN NPC IS NOT MOVED BY MOVING THE GROUND.** Rebuilding the village put the
   scrimshander inside a house, the digger inside the shop and a crab inside a
   well, and all of it validated. `check-towns.mjs` asserts every entity in a
   town screen stands somewhere it could stand at some tide level. The same pass
   found a rupee that had been sitting inside a post on Driftwood Strand since
   long before this session.

   And the same class of thing bit the harness: `progress.pos` put a new game at
   72,64, which the rebuilt village turned into the alley between two buildings,
   so three movement tests in `test.mjs` failed for the honest reason that the
   world had moved under their probes. The start position is 72,72 now — the
   middle of the square, facing the shopfront — and the probes were moved to
   match, not the buildings.
**The Abyssal Keep (P8/D6), and the five things it cost.**

1. **A CHARM CAN ANSWER A PUZZLE THE ROOM WAS BUILT TO KEEP YOU OUT OF, AND
   NOTHING IN THE TREE WOULD HAVE ASKED.** The Coilrope adds `COILROPE_RANGE` to
   every Dredge Line cast the moment it is slotted, and the player of the sixth
   dungeon has all three charm cases open. So every closure clause in
   `check-dredge.mjs` is proved twice, once at each reach — and the second pass
   failed on its first run, on a cache sitting exactly one tile inside the longer
   reach of the near bank. The room was airtight, provably, for a player who had
   not put on the bone the same dungeon hands out. **If you add a room whose
   answer is a distance, find the charm that changes that distance and prove the
   room at both.** `scrimshaw.js` is the list; the reach-changing ones today are
   Coilrope (Dredge Line), Quartermaster's Mark (Reefseed capacity) and Kelp
   Braid (current strength).

2. **DECORATIVE SCENERY CAN BE A TRAVERSAL VERB.** `q` is `dPost`, it carries
   `F.SNAG`, and a snag is a crossing — the Dredge Line hauls the PLAYER to it.
   The pre-P8 Keep used `q` as colonnade decoration in four rooms, so the moment
   the dungeon's item became the Dredge Line those were four unproved crossings
   sitting in the data. `check-dredge.mjs` sweeps the whole dungeon for a SNAG
   tile no room declares, which is what found them. The general shape: a tile
   placed as ornament before an item existed becomes that item's vocabulary
   afterwards, silently.

3. **A CROSSING IS ONE-WAY BY CONSTRUCTION.** The pull is aimed, so the far bank
   of a shaft has no way back unless somebody put a second ring there. Nothing in
   the repo could see it: `walk-dungeons.mjs` floods, and a flood does not care
   which direction an edge runs, so a room the player can be walked into and not
   out of reads as perfectly connected. `dredgeRoom.returns` is what says the way
   home exists, and it is asserted as the mirror of a mooring — the cast works
   from the far bank and lands you on the NEAR side, the one thing a mooring must
   never do.

4. **"NO OTHER SEA CROSSES IT" IS THE WRONG QUESTION IF YOU ASK IT ABOUT CASTS.**
   The first cut of the closure clause counted any cast that snagged something
   and put the player somewhere new. In a room with a mooring on both banks that
   is most casts, and the Crossed Shafts' second crossing failed against the
   first crossing's return ring. The question that is actually being asked is
   "can the player get to the FAR SIDE at this sea" — so take every cast that
   moves them and flood from where it drops them.

5. **`room.buried` was invisible to every sweep in the tree.** It is the Dredge
   Line's own list, it is where the Keep's fourth Small Key lives, and
   `walk-dungeons.mjs` counted keys from pickups, chests, puzzle rewards and
   gust wheels and not from it — so the dungeon was walked believing it had three
   keys for four locks. Same class as the `{ pickup: 'key' }` chest D1 hid a lock
   behind: **every new way to hand out a key needs adding to that counter in the
   same commit.**

**The Drowned Wood Shrine (P8/D5), and the four things it cost.**

1. **A COUNTED ITEM ARRIVED WITH AN EMPTY POUCH, AND EVERY CHECKER STAYED
   GREEN.** The rule that a Reefseed, a bomb or a bottle comes with something in
   it lived inside `Game.openChest` and nowhere else. `progress.giveItem` — the
   function a giver NPC, a cutscene, a debug grant and every test harness calls
   — recorded the item and left `maxReefseeds` at 0, so the inventory showed a
   perfectly good Reefseed and the B button played the deny sound for ever.
   `check-items.mjs` never saw it because its Reefseed section sets the counts by
   hand on the way past, which is exactly the shape of workaround that hides a
   bug for the life of a project. What found it was a REPLAY: a recorded run in
   which Link threw a seed that did not exist, swam past the tile he was meant to
   have built, and replayed deterministically and identically for ever. The rule
   is in `giveItem` now. **If you add a counted item, put its capacity there.**

2. **A SOLID TILE TWO SQUARES AWAY DOES NOT BLOCK A THROW, IT CATCHES IT.** The
   drowned bole was placed to stop a seed reaching a stake, which it does from
   distance 1. From distance 2 it does the opposite: the seed flies over the
   square between, is stopped by the bole, and plants on that square — which was
   the stake. Every grove in the Shrine is laid out around this. The rule is that
   the two solids (the bole and the snarl) must be OPPOSITE each other across
   the stake, with water on one perpendicular side and a `0` sump on the other,
   and any other arrangement gives the room a second answer.

3. **THE PLAYER CAN PUT A SOLID TILE WHERE NO AUTHOR PUT ONE.** A coral pillar
   is permanent and is `coralWall` at MID. So CLAUDE.md's "a solid tile can
   strand a room" trap has a version of itself that no amount of care in a room
   grid prevents, because the trowel is in the player's hands. `check-reefseed.mjs`
   enumerates every tile a seed can come to rest on and asserts that a pillar
   there still leaves the room's doorways joined at SOME sea — some, not all,
   because the conch is always available and a room that is walled at MID and
   open at LOW has cost a button press rather than a save.

4. **A WHOLE SESSION'S DESIGN CAN BE STRUCTURALLY IMPOSSIBLE, AND THE PROOF IS
   TWO SENTENCES.** The groves were first built as push-block crossings: a block
   cannot enter deep water (`PushBlock.push` asks `canOccupy` with
   `swim: false`), so a pillar is the only road across, and the pillar is only
   floor at LOW. It cannot be made tide-bound. The player pushing a block INTO a
   stake is always standing exactly two tiles from that stake with a non-solid
   square — the block's own tile — between them, so the seed can always be thrown
   from the square the push is made from and the room falls to a fixed LOW. No
   geometry fixes it. Write the two-sentence argument out before drawing rooms.

**The Cliffside Cistern (P8/D4), and the six things it cost.**

1. **A FOOTPRINT IS NOT A LINE OF SIGHT.** `Tide.covers` was pure geometry, so
   the Bellows' cone reached through walls: a wheel sealed in an alcove could
   be turned by a player standing on the far side of two walls facing roughly at
   it, and the drained wedge was drawn inside masonry. Nothing failed — the room
   simply had a second answer nobody had authored. `Tide.blows` is the fix, and
   the thing to know if you touch it is that **the line-of-sight walk must
   resolve tiles at the BASE level, never through the field**, because the field
   is what the call is in the middle of computing and asking it again does not
   terminate.

2. **A CHECKER THAT IS MORE CAPABLE THAN THE PLAYER FAILS HONEST ROOMS.** The
   first cut of `check-bellows.mjs` modelled the hop as "clear anything that is
   not solid", which is what `check-cleats.mjs` does. `Player.tryGapHop` clears
   `F.JUMPABLE` and nothing else, and `dPit` is not JUMPABLE — so the harness
   hopped the pit trenches that every sill in the dungeon is built on, and three
   rooms failed for a reason that was entirely in the tool. Copying a flood from
   another prover copies its approximations with it.

3. **A ROOM SCRIPT'S REWARD IS INVISIBLE TO EVERY SWEEP IN `walk-dungeons.mjs`.**
   It counts keys from entity tuples and from `puzzle.reward.spawn`, and a key
   spawned by `script.onEvent` is none of those. Declare it (`bellowsRoom.gives`)
   and teach the counter, or the dungeon is walked believing it has two keys for
   three locks — and the failure surfaces as an unrelated room reading stranded.

4. **A PUSHED BLOCK MOVES ONE TILE, EVER.** `solve-switches.mjs` says so in its
   header and it is easy to design past: a puzzle whose block needs three shoves
   to reach its plate is unsolvable in the engine and the tool is right to fail
   it. Seat every block one tile from the plate it is meant to hold down.

5. **A SCRIPT-SPAWNED REWARD EXISTS ONLY IN THE FRAME IT WAS RELEASED IN.** A
   room script that spawns a key when its wheel comes round has released that
   key exactly once, forever: the wheel is open afterwards, so the event never
   fires again, and walking out without picking it up loses the key with
   nothing left that can produce another. Every checker in the repo calls that
   a solved dungeon, because they all reason about a room rather than about
   leaving one. `checkPuzzle` already handles the puzzle-reward version of this
   — it re-applies the reward silently when it sees the flag on entry — and a
   script has to do the same thing by hand, in `onEnter`, guarded by a
   `saveKey` on the pickup so a collected reward does not come back. Verified
   live for both of D4's, in all four directions (spawns, survives leaving,
   does not duplicate, does not return once taken); `check-bellows.mjs` now
   fails any sill that `gives` something without an `onEnter`.

6. **A VALVE WROTE ITS SAVE FLAG AND NOTHING EVER READ IT.** `TideValve.interact`
   has set `progress.flags[saveKey]` since the day it was written, and no code
   path restored it — so a wheel you turned was shut again when you re-entered
   the room, while the door it opened stayed open because a persisted TILE is a
   different mechanism. The room was solved and the fixture in it was lying
   about how. Same shape as `liftLevel` and the Anchor's dropped `src`: the
   write end of a pair of features shipped and the read end never did.

**The Bogwater Sanctum (P8/D3), and the four things it cost.**

1. **AN ITEM WHOSE POSSESSION IS THE GATE CANNOT BE PROVED BY REACHABILITY.**
   The Cleats make every deep tile in the game passable, so "this room requires
   the Cleats" is true of any room with water in it and worth nothing. Two days
   of dungeon design can be spent before that lands. The way out is to find the
   axis INSIDE the item — here the two modes — and prove that: *the surface
   route does not get there and the floor route does.* It is provable only
   because the difference is DATA (`push` is applied while swimming and not
   while sunk), which is worth checking for D4-D6 before designing a room.

2. **ONE TILE OF ANYTHING IS NOT A BARRIER.** The base moveset hops 2.29 tiles,
   so a single pit, a single gap and a single ledge are all crossable — a
   one-tile drain in a torrent's sill was the first version of D2's fork trap
   and `check-lens.mjs` failed it immediately. Three tiles is the first width
   that holds. This is now true in two dungeons and will be true in the next
   four.

3. **`cleatMode` WAS A DEAD FLAG.** `toggleCleats` on dry land set it, said
   "you will walk under the next water you meet", and nothing ever read it
   again: entering deep water always started you swimming. Every deep room
   before D3 plays the same either way, which is why it survived. A dungeon
   about choosing your layer before you commit is where a promise the engine
   does not keep starts costing hearts. `Player.updateTerrain` now dives on
   entry when the soles are set.

4. **A REPLAY THAT DRIVES AN ITEM MUST KNOW WHETHER THE ITEM SPEAKS.**
   `toggleCleats` on land opens a text box; in deep water it does not. An open
   box freezes every entity while `mode` is still `'play'`, so the first cut of
   `d3-undertow` held LEFT for two hundred and sixty frames with the player
   standing still behind a dialogue, and read exactly like "the current is
   stronger than sink mode". Toggling in the water instead avoids the box
   entirely, and that is what the committed plan does.

**A FINISHED DUNGEON CAN SIT ON AN UNMERGED BRANCH AND BE BUILT A SECOND TIME.**
This one cost most of a session and it cost it twice over. D2 was re-authored
around the Lens, proved by a new checker, replayed, documented and committed —
on `claude/p8-dungeon-generation-faqood`, which was never merged. `main` still
carried the pre-P8 Coral Spire, and `NEXT-SESSION.md` and `EXECUTION-PLAN.md` on
`main` still said "D2 outstanding", because the session that finished D2 updated
them on its own branch. A later session read `main`, believed it, and rebuilt
the whole dungeon from scratch with a different primitive before anyone noticed.

Nothing was broken. Both dungeons worked and both were proved. The defect is
that **the record of what exists lived in a branch nobody thought to look at**,
and every document in the repo is written on the assumption that the last
session's work is on trunk.

Three things came out of it, and all three are cheap:

- `docs/DUNGEON-STATUS.md` is the board, and a dungeon is done only when that
  table says so AND NAMES THE COMMIT. A status sentence with no commit behind it
  is a claim, not a record.
- `git ls-remote --heads origin` before starting a dungeon. Branch names in this
  repo carry the work (`p8-dungeon-generation-*`), so the duplicate was visible
  in one command from the start.
- When two branches hold the same work, take the more complete one wholesale —
  `git revert` your own, then cherry-pick theirs — rather than merging two
  rewrites of the same rooms. Both versions of D2 replaced the entire dungeon;
  a merge would have produced a conflict in every room and a dungeon that was
  neither design.

**The Lens forks (P8/D2), and the four things they cost.**

1. **A CHECKER'S FLOOD IS ONLY AS GOOD AS ITS MOVEMENT VERBS, AND
   `walk-dungeons.mjs` DID NOT HAVE LEDGE HOPS.** Its flood knows how to walk,
   how to clear a one-tile gap, how to spend a key and how to take a warp — and
   treated `F.LEDGE` as a wall, because until D2 no ledge in the game was the
   ONLY way into anywhere. D2's forks are entered by dropping off a lip you
   cannot climb back up, and eight rooms came out "stranded" in a dungeon that
   walks perfectly in the engine. The fix is thirty lines and it is the same
   model `Player.tryLedgeHop` uses (into the FACE of the ledge only, clearing
   the run behind it, landing on a standable tile), which is the point: a
   checker that models the engine's moves catches things, and one that models a
   subset of them invents failures. **If you add a movement verb to the player,
   add it to the flood in the same commit.**

2. **`tideForce` HAD NEVER BEEN USED, and it is the reason the Lens can be
   required at all.** It has been in `Tide.applyRoomRules` and in
   `docs/briefs/AGENTS.md` from the beginning and no room had ever declared it.
   Without it there is no way to build a room the Lens is needed in: the player
   sounds the conch, looks at the room at the next level with their own eyes,
   sounds it back, and walks in knowing. **An informational item can only be
   required in a room where the information cannot be bought some other way**,
   and in this engine that means a room that refuses the conch. A later session
   that finds a pinned room heavy-handed and unpins it will make both of D2's
   forks decorative and no checker except `check-lens.mjs` will notice.

3. **THREE TILES THAT ARE THE SAME TILE BEAT THREE TILES THAT LOOK ALIKE.** The
   forks work because `dDrain` at LOW, `dSump` at LOW and `dPit` at every level
   all resolve to the SAME tile name — `dPit` — rather than to three similar
   ones. That is what lets `check-lens.mjs` assert indistinguishability by
   comparing tile names instead of comparing pixels, and it is what makes the
   claim true rather than approximately true. A screenshot confirmed it: all
   three throats sample to exactly (14, 15, 34).

4. **AND THEN THE PREVIEW OF THEM IS ALSO THREE DARK BLUES.** The same property
   that makes the fork provable makes it hard to read: `dWaterS`, `dWaterD` and
   `dPit` are three dark blues, so the Lens's ghost separates them by 4-6 RGB
   units. Raising `LENS_GHOST_ALPHA` from 0.55 to 0.80 helped and did not solve
   it. **The lesson is the order of operations**: the room was proved by a
   checker and then LOOKED AT, and the looking is what found the real problem.
   The full measurement and three candidate fixes are in `docs/ART-BACKLOG.md`.

**The charm cases used to open on a conversation nobody had to have.**
`checkUnlocks` was called from `Scrimshander.interact` and nowhere else, so
`CHARM_LOW_ESSENCES = 2` — the Coral Spire's own essence — landed on a player
with no reason to walk back to Tidewatch. Every checker was green the whole
time, because the charm system worked perfectly and simply was not switched on.
`openCharmCases` now fires from `Game.claimEssence` and the scrimshander is the
acknowledgement rather than the gate. **A progression flag that only a
conversation can set is a progression flag some saves will never get.**


**Multi-screen rooms (P7.6), and the five things they cost.**

1. **A ROOM'S KEY IS ITS TOP-LEFT CELL, AND THE CELLS IT SPANS HAVE NO
   `roomDef`.** This is the thing the plan did not anticipate and it is
   structural, not cosmetic. `hasRoom(mapId, f, x, y)` used to be
   `!!roomDefs['f,x,y']`, and with a 2x1 room at `0,5,3` the cell `0,6,3` is
   part of that room and has no def of its own. Every cell lookup — a seam, a
   warp destination, the minimap — has to resolve through an OCCUPANCY index
   (`roomKeyAt` in `world/maps.js`) or a player walking west into the far half
   of a wide room finds a hole and nothing at all happens. `getRoom` and
   `hasRoom` now both go through it, so the fix is invisible to callers, and
   `validate.mjs` fails if a room is keyed inside another room's footprint.

2. **THE SEAM ARITHMETIC IS `rx + sw`, NOT `rx + 1`, AND THE PERPENDICULAR AXIS
   IS A GLOBAL COORDINATE.** `checkRoomExit` computed the neighbour as
   `room.rx + d[0]`; a 2x1 room's east neighbour is two cells over, and which
   room is NORTH of it depends on which of its two screens the player is
   standing in. Likewise `entryPos` preserved `p.y` across a transition, which
   is only right when both rooms are keyed to the same row. Both now work in the
   map's global screen grid (`rx * VIEW_W + p.x`), which reduces to the old
   expression exactly when the two rooms share a cell — every transition the
   game has today, which is why no replay moved.

3. **THE TRANSITION SLIDE IS IN SCREEN SPACE AND NEEDS BOTH CAMERAS UP FRONT.**
   The outgoing room is snapshotted as a screen window with its camera offset
   baked in; the incoming room is a whole-room canvas that has to be blitted back
   by the camera it will ARRIVE under. So `camTo` is computed when the transition
   is created, not discovered when it lands, and the player's room-space target
   absorbs `camFrom - camTo` because he is drawn relative to the outgoing window
   for the whole slide. Get one of those three terms wrong and the player jumps a
   screen's width on the last frame of every transition — in a 1x1 room all three
   are 0, so nothing catches it until the first wide room.

4. **THE TIDE SWEEP'S SNAPSHOT IS ROOM-SIZED, NOT SCREEN-SIZED.** `Tide.setLevel`
   captured the room into a 160x128 offscreen and `drawSweep` ran the wave front
   across `VIEW_W`. In a 320px room that crops the snapshot at the halfway point
   and the wipe stops halfway. Both are now `room.pw`/`room.ph`, which is
   byte-identical at 1x1. A side effect worth knowing: the front crosses the
   whole ROOM in `TIDE_SWEEP_FRAMES`, so in a wide room it moves across the
   screen faster. That is the right behaviour — the wipe is an event in the
   room — but it means a screenshot tool has to settle for 23 frames, not 8.

5. **A LOCKED DOOR THAT NEVER LOCKED ANYTHING, AND THE SECOND FAULT THAT WAS
   HIDING BEHIND IT.** This is the one to read twice, because two bugs each
   concealed the other and the pair survived every checker in the repo.

   `0,5,3`'s door at `(2,3)` could be walked round via row 2 — in the original
   1x1 grid as much as in the 2x1 one, verified against the pre-conversion data.
   So Small Key 3 bought nothing and the Piece of Heart behind the door was
   free. `walk-dungeons.mjs` structurally cannot see that: it spends a key on
   any lock it can reach and then asks only whether every room came out
   reachable, so **a lock with a way round it is indistinguishable from a lock
   that got opened.**

   Sealing the door then failed the dungeon walker with `0,4,3` unreachable —
   because D1 has three locks and the walker could only count TWO keys. The
   third is a `{ pickup: 'key' }` chest, and the counter knew only
   `{ item: 'key' }`. Both are real forms: `Game.openChest` grants `item:` and
   spawns `pickup:`. The undercount had been harmless for as long as one of the
   three locks was bypassable, so the flood never asked for the key it could not
   count.

   **The lesson is about the shape of the failure, not the room.** Two defects
   in different files, each of which made the other invisible, in a dungeon that
   was green on ten checkers. Neither is findable by reading; the first was
   found by walking the room with a camera, and the second by fixing the first.

   Both are now closed, and `walk-dungeons.mjs` has a new assertion —
   **every `dDoorLocked`/`dDoorBoss` tile must separate its room, on one axis,
   at all three tide levels.** All 35 doors in the game pass. The three-levels
   clause matters: a door that separates at LOW and not at HIGH is not a locked
   door, it is a locked door and a conch, and the player always has the conch.
   **If you place a locked door, wall the four tiles round it**; the checker
   will tell you if you did not.

6. **THREE OF THE EIGHT DUNGEON THEMES HAVE AN ALT FLOOR THAT LOOKS LIKE
   WATER.** `,` is the theme's floor variant and the obvious way to break up a
   wide room's floor. In Grotto, Cistern and Salt it is registered in the
   `stonef` palette — which is the palette of `dFloorWet`, the MID form of the
   `dBasin` tide tile. So a decorative scour laid in the Clawcrab Den read as
   standing water in a room whose only other grey tiles are the damp patches
   that are supposed to. It was laid in, screenshotted, and taken straight back
   out. Coral, Bog, Wood, Palace and Abyss are clear.

   `validate.mjs` cannot catch this: it asserts a theme never changes a tile's
   FLAGS, which is the right check and is exactly blind to a theme changing what
   a tile appears to SAY. In a tide game the floor palette is vocabulary. Look at
   the room before you trust a variant tile.

   Looking further while writing that down: **in six of the eight themes `,` is
   not a second tile at all, it is the SAME art recoloured.** Only Wood and
   Palace have a genuinely different alt floor. So "break the floor up with the
   variant" is not available in most of the game, and a wide room has nothing to
   put on twenty tiles of floor. That is a real gap and it wants a new pick, not
   a workaround.

7. **EXTRACTED ART THAT NO ROOM COULD NAME, FOR THE WHOLE LIFE OF THE FEATURE.**
   `lionHead` and `urn` were extracted by `rip-dungeon-themes.py` in P7.5, given
   tiledefs in `tiles-core.js`, and commented — in the file — "Themed scenery,
   for P8 to place". No legend ever got a character for them. A room grid can
   only name a tile through its legend, so the art sat in the build, in every
   shipped `dist/`, drawable by nothing.

   **Every checker was green and none of them was asking the question.**
   `validate` proved themed tiles carry the right flags; `test.mjs` counts
   unauthored sprite names; `check-tilesets` proves the ripper re-emits
   byte-identically. Extraction has a four-link chain — sheet, ripper, tiledef,
   legend — and everything checked links 1-3.

   `validate.mjs` now fails on extracted theme art that no tiledef draws, and on
   a tiledef built on extracted art that no legend, tide variant or transform
   can reach. Both new checks were verified by breaking them: removing the
   legend characters reproduces the original bug as a named failure.

8. **A SCENERY TILE CUT FROM A ROOM CARRIES THE ROOM'S FLOOR.** Wiring `urn` up
   was not enough — its 16x16 cell has 64 pixels of the source room's floor
   around the object, so it drew a rectangle of one dungeon's flagstones into
   every other dungeon's floor. The ripper now keys the border-connected
   background out to transparency (`KEY_BACKGROUND`), border-connected rather
   than by colour so a highlight in the floor's own colour survives, and the
   tiledef names an `underArt` so the floor is drawn under it.

   **`underArt` is a fixed tile name, which is why there is one urn per theme
   and not one urn.** That was also the sixth themed character, so the "add a
   seventh" path in `legends.js` is now worked rather than warned about — and
   the step that matters is the last one: add the pair to `SHARED` in
   `validate.mjs`, or a themed tile is free to carry different flags from the
   tile it stands in for and it surfaces as a stranded room in a dungeon nobody
   edited.

   `panelFloor` in the ripper's own PICKS documents the same hazard from the
   other direction (a floor tile that caught a room's frame). ALWAYS look at the
   contact sheet, and for an object, look at it standing on a floor that is not
   the one it was cut from.

**Re-authoring D1 for the Anchor (P8), and the five things it cost.**

1. **A FORGIVING TILE IN THE MIDDLE OF A GATE IS THE GATE.** Every anchor gate
   in the first cut of D1 had one tile of `dSluice` between the LOW-only band
   and the MID-only band, put there so the five-tile held patch would spill onto
   something harmless. `dSluice` is dry at LOW and shallow at MID — which makes
   it somewhere to STAND, and the conch can be sounded anywhere you can stand.
   So all three gates were crossable by walking to the middle at LOW, pressing
   the conch once, and walking out at MID: the anchor was decorative and the
   rooms read as anchor rooms in the data. `tools/check-anchor.mjs` caught all
   three on its first run, which is the entire argument for writing it.
   **The rule the gate rests on is: no tile between the two bands may be
   walkable at both levels.** Everything else is geometry.
2. **The Anchor barely fits in a 10x8 room, and that is a P7.6 argument.** The
   patch is 5x5 (`ANCHOR_RADIUS_TILES` 2) and the throw carries about two tiles,
   so a gate needs `stand + 4 + 3 + far side` = the full width of a room row,
   with the rest of the room walled off. That is why D1's three gates are bare
   corridors and why a room cannot hold two of them, or hold one and anything
   else. A 2x1 room (20 tiles wide) is what makes anchor geometry a design space
   instead of a fit problem. Anyone estimating P7.6's value should read that as
   part of it.
3. **Band widths come out of the hop, not out of taste.** The hop clears two
   whole tiles, so a two-tile band of anything is not a barrier — it is a hop.
   Three is the minimum for the far band and four is the minimum for the near
   band, because the patch has to cover the near band without reaching the far
   one. `check-anchor.mjs` reads both reaches out of `feel.js` rather than
   hard-coding them, so retuning `WALK_SPEED` re-proves every gate.
4. **A door a puzzle opens is a wall to the dungeon walker.** `walk-dungeons`
   floods the tile grid and knows about locked doors and boss doors, not about
   `puzzle.reward.openDoors` — so the Boss Key room behind D1's gauge puzzle
   read as stranded and the dungeon looked broken. It now treats a tile named in
   any room's `openDoors` as passable, and proving the puzzle is actually
   solvable is left to the tool that can: `solve-switches.mjs` for switch rooms,
   `check-anchor.mjs` for the gauge rooms.
5. **`openChest` had no branch for a charm.** `Chest` accepted `{ charm: ... }`
   in room data and `openChest` fell through to "Nothing but sand." — an opened
   chest, a saved flag, and no charm, which is the same silent shape as the
   chest granting a deleted item. The branch exists now, `check-charms.mjs`
   proves it grants in-engine, and it also sweeps every room in the game for a
   `charm:` naming a charm that is not in `CHARMS`.

**The tide field (P5), and the four things it cost.**

1. **A dropped field on an options object is invisible.** `Tide.addOverride`
   destructured `{mapId, roomKey, tx, ty, r, level, shape}` and rebuilt the
   object from those names — so the `src: 'anchor'` the caller passed was
   silently thrown away. Everything worked: the anchor landed, the field split,
   the room rendered correctly, every flag query answered right. The only thing
   that failed was the item finding its own override again, so the anchor could
   be thrown and never recalled. Rebuilding an object field-by-field drops
   whatever you forget, and nothing type-checks it.

2. **A render cache keyed on a scalar silently survives a field.** `Room` cached
   its tile layer against the tide *level*. With a field the key has to be the
   field's version stamp, because the level no longer identifies the picture.
   Get this wrong and collision is right while the pixels are stale — the room
   draws yesterday's water and every test still passes. The stamp is monotonic
   and **must never be reset**, including by `clearOverrides` or a new game:
   Room objects outlive a new game, so a stamp that went back to zero could
   collide with a key a cached canvas is still holding.

3. **A single-pixel probe is not a pixel test.** The first version of the render
   assertion sampled one pixel at the centre of each band and passed on nothing,
   twice, for two different reasons. First: animated tiles — which is every kind
   of water — are pushed to `animCells` and deliberately left OUT of the cached
   canvas, so both bands read as transparent. Composite `render` + `drawAnim` +
   `drawOver` the way `drawScene` does. Second: shallow and deep reef water
   happen to share their colour at the tile's centre pixel, so even composited,
   one pixel reported them identical. Hash the whole 16x16 tile.

4. **`levelAt`'s default room is wrong in exactly one place.** It defaults to
   `game.room`, which is right for game logic and wrong during a room-slide
   transition, where two rooms are on screen and one of them is not `game.room`.
   Everything going through `room.tile`/`flagsAt`/`solidAt`/`render` is safe
   because `Room` passes itself; the rule binds direct callers in draw paths.

**A replay that walks somewhere proves less than it looks.** The two-level
replay would have passed just as well in a room held uniformly at one level —
the walk succeeds either way. What makes it a proof is the probe tiles either
side of the held patch, recorded at every checkpoint, in two independent senses:
what the engine believes the level is, and a hash of how the tile is actually
drawn. Also: use held directions, not `goto`. A pathfinder routes around the
interesting part of the room by the boring columns at its edge.

**The radius had to be checked against a real room before the replay was built.**
At radius 3 the held patch reaches from the reef flat into the tide-rock band
three rows away, both bands freeze together, and the replay walks a uniformly
MID room while claiming to prove a split. The margin between the probes is the
reason the radius is 2.

**`flowers` and `bush` were the same rosette, and that is why `bush` could not
be extracted.** Two sessions recorded "bush stays hand-drawn" as a constraint
when it was a consequence: the Ages shrub at AG 450,920 is authentic, but the
`flowers` tile was a leafy rosette from the fan-made map and the two cells are
indistinguishable. The fix was upstream — re-pick `flowers` from Seasons'
**spring** overworld (a sheet nothing had ever read from; spring is when
Holodrum is in bloom), and the shrub becomes available immediately. When a
extraction is blocked by "it would look like X", check whether X is the thing
that should move.


**Sprite-sheet extraction** (`tools/ripkit.py`; worked examples in
`tools/rip-link.py`, `tools/rip-npcs.py` and `tools/rip-enemies.py`):

1. Sheets **do not use a uniform row pitch**. Assuming 16px steps cuts every
   sprite in half. `find_cells` measures each sprite's own bounding box.
2. `find_cells` assumes banded art. The **enemy sheet defeats it** — it is a
   mosaic of independently-placed white plates interleaved with label text.
   `rip-enemies.py` segments by flood-filling islands of non-background pixels
   instead and keeps the ones too big to be a glyph.
3. Sprites sit on **white plates**, and `background()` only reports the green
   around them, so the plate quantises as the sprite's lightest colour and every
   creature lands in a white box. Erase only white *reachable from the green* —
   white enclosed by a creature's own outline is artwork.
4. **Find the boxes before erasing the plates.** The plates are what make each
   frame one connected island; stripping first splits sprites apart and
   renumbers every index the frame map refers to.
5. `quantise` pads a short palette by repeating its last colour, which leaves a
   three-colour sprite writing its **outline at index 2**. That renders right in
   the sprite's own palette and wrong in every other, because the game's enemy
   palettes put a mid tone at 2 and the near-black at 3 — so the hard 1px
   outline washes out to grey the moment the roster asks for `enemyg`.
   `normalise_ramp` in `rip-enemies.py` re-slots the ramp.
6. Full-colour sprites need **per-sprite palettes bound to the art** via the
   `{ art, pal }` form. Registering palettes without binding them makes
   everything render in the wrong colours.
7. Packed sheets **leak neighbouring pixels** into a cell; `_trim_slivers`
   drops edge columns disconnected from the sprite body.
8. **`_trim_slivers` only caught one-pixel leaks** until it was rewritten. It
   blanked an edge line only when the very next line was empty, so a leak two
   or three columns wide with a gap between it and the sprite survived and
   rendered as a bar floating beside it. It now groups each axis into runs and
   drops detached edge runs small enough to be a leak.
9. **Quantisation punches pinholes.** A pixel inside the body that happens to
   match the sheet background goes transparent and you get a see-through slot
   across the sprite. `_fill_pinholes` in `ripkit.py` fills any transparent
   pixel with all four orthogonal neighbours drawn.
10. **A single-pass hole filler does not converge.** `seal_holes` in
   `rip-enemies.py` skipped a two-pixel gap on its horizontal test, filled one
   of the two vertically, and never revisited the one-pixel hole left behind
   the cursor. Both fillers now iterate to a fixed point.
11. **Both extractors reproduce byte-identically**, which is what makes it safe
   to change `ripkit.py` and re-run: run them once before touching anything,
   confirm an empty `git diff`, then change and read the diff.
12. Always `preview.mjs` the pack and **look at the PNG**. Dimensional validity
   says nothing about whether a sprite reads as the creature it names. Note
   that `preview.mjs` screenshots the canvas clipped to the 1400px viewport, so
   at `--scale=6` the rightmost column is cut off — use `--scale=2` to see a
   whole pack.

**Terrain extraction** (`tools/rip-terrain.py`) — the two terrain sheets are
assembled **maps**, not tile palettes, so none of the cell-finding in
`ripkit.py` applies. Each map block sits at its own origin and there is no
global 16px grid: a search over all 256 offsets scores them nearly equally,
because the base ground tile is mostly flat and matches itself at any phase.

What does work: a ground tile is the 16x16 window that repeats at **+16 in x
and +16 in y**. A window that passes is correctly phased and tiles seamlessly
by construction, which is exactly what ART-DIRECTION demands of terrain. Two
things to know if you rebuild that scan:

1. **Collapse the phase shifts.** A seamless tile stays seamless when rolled,
   so every hit appears at all 256 offsets and a frequency ranking is nothing
   but shifted copies of one tile. Key each hit on the smallest of its 256
   cyclic shifts. Do it *after* deduplicating exact bytes — canonicalising
   half a million raw hits does not finish.
2. **It only finds ground.** `cliff`, `tree`, `bush` and the rest are
   structured and directional; no single window supplies a top, a face and
   corners, and the scan returns nothing for a tree grove. Those have to be
   picked by eye from a region dump.

Two judgement calls in the tool that are deliberate:

- **The extracted art keeps the game's palettes**, and only the pixels change.
  Binding the source colours instead would have shifted every region's scheme
  under the extracted Seasons enemies, and broken the palette-swap variants
  (`grassDark`, `saltFlat`, `iceFloor`, `rockFloorRust`) that are how this game
  gives each region a look without redrawing every tile. `TERRAIN_SRC_PALETTES`
  records the source colours for reference.
- **…but a palette can need narrowing.** The source dungeon flagstone is three
  near-identical blues. Replayed through `brick`'s full light-to-dark spread it
  became loud blotches across all 179 rooms, and it took an in-game screenshot
  to see — `preview.mjs --tiles` renders every tile in one palette. `brickf`
  and `stonef` in `palettes.js` are narrow ramps added for exactly this.

A first pick can also be simply wrong for its job: the original `rockFloor`
source was brick courses, which reads as a **wall** in a top-down game. It was
swapped for cobbles after looking at a screenshot, not after validating.

**Boss and miniboss behaviour** (`src/data/bosses.js`) — four traps, all paid
for, all of which produce a boss that *validates* and is *unwinnable*:

1. **A miniboss must clear `isBoss` in its `init`.** `game.onEnemyDefeated`
   keys `progress.beaten` off the **map id**, not the entity, so a miniboss
   counted as a boss marks its whole dungeon beaten. That deletes the real boss
   when you walk into its room (`spawnRoomEntities` removes it) *and* spawns the
   dungeon's essence in the miniboss room. It also blocks the miniboss room's
   own `puzzle: { enemies: true }` reward, because `onEnemyDefeated` returns
   early for bosses and never sets `room.cleared`.
2. **`submerge()` is sticky.** It parks the entity `hidden`, `harmless` and on
   `invuln: 9999`. A later phase that does not call `submerge` inherits all
   three and you get an invisible, invulnerable, unkillable boss standing in the
   room. Every boss that submerges in *any* phase calls `surface(e)` on *every*
   phase change.
3. **`e.stun` makes `Boss.update` return before the AI runs**, so an attack
   cannot be executed inline after setting a wind-up. The `windUp`/`runPending`
   pair in `bosses.js` parks the attack on the entity and fires it on the next
   live frame. Every heavy attack goes through it, which is also what guarantees
   every attack has a tell.
4. **A tide gate must never be a boss's only vulnerability.** Nereth pins the
   tide to MID in phase 1 — which is the level the player walks in at — so an
   unconditional "sealed while the tide sits at my level" made him invulnerable
   from the first frame with no way to learn otherwise. Every boss now has a
   timed window that does not depend on the conch; the tide widens it.

Boss rooms are authored `noTide: true`, which only sets `tide.locked` and only
stops the *conch* — `tide.setLevel` still works. Each boss calls `unlockTide` on
its intro to hand tide control back for the fight, and the late bosses force it
back to the level that suits them.

**Art** (`sprites-link.js`, `sprites-world.js`):

- **`validate.mjs` cannot see a broken sprite, only a wrong-sized one.** A row
  split by a see-through slot, or shifted out past the rest of the body so it
  renders as a detached line, passes validation and looks wrong on screen.
  `tools/scan-sprites.mjs` is the check for that class; run it after any art
  work. It scans the **resolved** registry, which matters because 37 of the 40
  names in `LINK_ART` are shadowed by `PLAYER_ART` — scan the source packs and
  you get a list of defects in art nobody ever sees.

- **Transparency, not outline, is what separates two shapes.** Five icons
  (conch, cape, gloves, flippers, magnet) came out as solid blobs because the
  gap between prongs/fingers/wings was drawn with `3` instead of `.`. At 16x16
  an outline pixel is just another coloured pixel.
- `preview.mjs` renders a whole pack in **one** palette, so it shows silhouette
  and shape but not in-game colour. That is the right tool for "does it read as
  the thing it names"; use `test.mjs --shots` for colour.
- The engine's `slashD` effect (`src/game/effects.js`) wants `fx_slash_d0` and
  `fx_slash_d1`, and `player.js` spawns it on **every sword swing** — but
  neither name is in `sprite-manifest.js`, so nothing flagged them and the
  most-seen effect in the game drew as a placeholder box for the whole project.
  If you add an effect to the engine, add its frames to the manifest.

**A ledge is solid from three sides, so it partitions the room it is in.**
Placing one is the same class of hazard as a mis-stamped doorway. The 38 runs
placed were chosen by a script that, for every candidate run, re-floods the room
at all three tide levels and rejects the run unless every tile reachable before
is still reachable after — walking only, no hop. Three further rules, each of
which a hand placement would get wrong:

- **The tile below the run must be dry at all three tide levels.** A ledge that
  drops you into water that is only shallow at LOW is a trap you cannot see in
  the grid.
- **Never in a switch, door, transition or boss room.** A solid lip in a switch
  room is a new way to make a one-tile push unreachable.
- **Ledges now face all four cardinals.** `_` south, `"` north, `>` east, `<`
  west, in every legend that declares `_`. Two things follow that a harness or
  a placement script gets wrong first try: **`>` and `<` runs are COLUMNS, not
  rows** — scanning every direction as if it were a row silently reports zero
  east/west ledges while they sit in the data — and a lip is **solid from three
  sides**, so a run dropped across a corridor makes rooms unreachable while
  still validating and still rendering. Use `tools/find-ledges.mjs`, which
  refuses any candidate without two plain tiles continuing past each end.

**A SOLID tile is never hit by a projectile's own rect.** The boomerang
ricochets off a solid tile *before* its rect ever overlaps it, so
`checkTileAction(this.rect(), ...)` finds nothing and a solid gate tile reads as
ordinary rock. `Boomerang.strikeTile` probes the tile just past the leading edge
instead, the way the hookshot probes ahead for a latch. Any future
"projectile opens a solid tile" mechanic needs the same probe — the rect test
that works fine for bushes silently does nothing here.

**An entity dropped from `game.entities` must be marked `remove` first.** The
player holds direct references to some of its own projectiles — `player.boomerang`
is the one that bit — and the guard in the item's `use` reads `.remove` to decide
whether the item is still in flight. `spawnRoomEntities` filtered the list
without setting the flag, so throwing the boomerang and then changing rooms left
a dangling reference that looked live forever: **you could never throw the
boomerang again for the rest of the run.** Nothing validated it, nothing errored,
the item just quietly stopped working. It now marks the dropped entities first,
which covers the whole class rather than the one case.

**A gate tile must sit INSIDE a screen, not on its boundary row.** The seam
check asserts both sides of a screen boundary agree about passability, and a
solid gate on the boundary makes them disagree. This is why the Marsh's cracked
cliff is one tile in, and the first placement of the salt vanes — directly on
the seam the scan reported — failed the seam check immediately.

**A push block moves exactly one tile, ever.** `PushBlock` takes `once: true`
by default and sets `moved` the moment its single slide lands, so a block placed
two tiles from the switch it is meant to cover can never reach it. Every switch
room in the game was authored that way, and each rewards a Small Key, so seven
dungeons silently had a key that could not be earned — and neither `validate.mjs`
nor the dungeon walker can see it, because both count keys statically from the
data. Blocks now sit orthogonally **adjacent** to their switch with plain floor
behind them to push from. If you add a switch puzzle, either do the same or pass
`{ once: false }`.

**An active dialogue freezes every entity while `mode` is still `'play'`.**
This is called out under the boss harness below, but it bites any harness that
visits several rooms in a row: a `puzzle.reward.say` from one room leaves a text
box open, and in the *next* room nothing updates — switches never press, blocks
never slide, and the room looks broken. Clear `game.dialogue.active` between
rooms before concluding anything.

**Data contracts drift from engine contracts, and nothing checks it.** Both
`giver` entities in `overworld.js` passed `giveFlag`, `waitingText`, `afterText`
and a `ready` function; `Giver` in `src/game/objects.js` reads `flag`,
`waiting`, `after` and `needEssences`. Every option was silently dropped, so the
Maku Tree and the digger handed over the Seed Satchel and the Shovel on first
contact with no Essence requirement and repeated it on every later talk. The
validator cannot see this. When wiring a data entity, read the class.

**Map authoring:**

- Rooms whose edges must line up are **not** worth hand-checking. Both the
  overworld and the dungeons were authored as 6x8 *interiors* with the border
  ring stamped on from a single shared seam table, which makes "walkable east
  edge implies walkable west edge on the neighbour" true by construction. The
  generators were throwaway scaffolding; the emitted files are the artifact and
  should be edited directly from here on.
- **A doorway needs floor behind it.** An interior authored with its own wall
  run will happily put a wall directly behind a stamped doorway, and the door
  then opens onto stone. Twelve of d2's twenty rooms were unreachable for
  exactly this reason. Carve one tile inward at every doorway.
- **…but that carve must not overwrite a door tile**, or a lock wall sitting on
  the first row behind a doorway is silently punched open.
- **Locked doors go inside rooms, never on a seam.** The engine places an
  arriving player just past the room edge, so a locked tile on a seam drops them
  inside solid stone from the far side. An interior wall with an `L` in it
  splits a room cleanly.
- Room grids are **exactly 8 rows of exactly 10 characters**, and digits 0-9 are
  always tide tiles.

**Extracted icons carry their own palette, so draw sites must not pass one.**
This is trap 6 under sprite-sheet extraction in a new place. `art.js` `bake()`
resolves `palName || d.pal`, so an explicit palette at the draw site silently
overrides the sprite's extracted colours and renders it in the wrong ramp. The
items in `src/game/items.js` whose icons come from `sprites-hud.js` therefore
have **no** `pal` field, and the draw sites in `hud.js`, `menu.js`, `game.js`
and `title.js` no longer fall back to `'ui'`. If you extract more icons, drop
the item's `pal` at the same time; if you add an item using hand-drawn art,
give it one.

**Plate colour enclosed by a sprite's own outline is ARTWORK.** This is trap 3
above, and `tools/rip-hud.py` hit it again from the other side: the Seed Satchel,
ring box and Power Gloves all use the plate tone as a highlight *inside* the
outline, so treating every plate pixel as transparent punched holes straight
through them. `quantise_exact` flood-fills the plate from the cell border and
only erases what is reachable from outside. When that first went in it filled the
empty heart's middle too — a part-filled heart is an outline with the bar showing
through, not a heart with a tan centre — so `HOLLOW` opts those four out. If a
new extraction shows see-through slots, this is the first thing to check; an
allowlist in `scan-sprites.mjs` would have hidden a real bug rather than fixed it.

**`ripkit.quantise` is not deterministic when it pads a short palette.** It pads
to four by repeating the last colour, then picks each pixel's index by scanning
for the smallest squared distance — with duplicate entries several indices tie at
zero and the winner is not pinned down, so the same cell emits different indices
from run to run. `rip-hud.py` was three pixels unstable across runs before
`quantise_exact` replaced the search with a direct lookup keyed on a total order
(`-luminance`, then the RGB tuple). Every cell on that sheet has at most four
colours so nothing needs snapping. **`rip-enemies.py`, `rip-link.py` and
`rip-npcs.py` still use `ripkit.quantise`** — they reproduce byte-identically
today, but if one ever starts drifting, this is why.

**The status bar is modelled on the Oracle of Seasons / Ages bar** — a parchment
panel, `B[icon]`/`A[icon]` in tall drawn brackets, the rupee icon stacked over
its three digits, hearts right-aligned in two rows of seven. Two things there
are deliberate and look like bugs if you do not know:

- **The panel is a warm tan (`#f0e0b0`), not the text box's near-white.** Most
  item icons use palette `ui`, whose lightest index is `#f8f8e8`; on a near-white
  bar a sword or a conch washes out to nothing. The tan is what makes them read.
- **`drawHud` suspends the room tint around itself.** `applyTint` sets the tint
  on the whole *sprite atlas*, so hearts and item icons would otherwise dim with
  the room — invisible on the old black bar, but on a light panel it reads as a
  rendering fault. It is safe to toggle without `flush()` because `bake` keys its
  cache on `tintKey`, so tinted and untinted bakes coexist rather than thrashing.

**Engine gotchas already fixed, worth not reintroducing:**

- Input latches key presses, so a tap shorter than one frame still registers.
- Room-exit detection needs a margin wider than one movement step, or exits
  never trigger.
- Warping sets `_warpLock` so arriving on a warp tile does not bounce straight
  back through it.
- The validator rejects a space between two drawn pixels: it is legal in the
  grammar but punches a transparent hole through a sprite.
- Rooms draw a tile by its **tile** name while art is keyed by **art** name, so
  every palette-swap tile (`grassDark` reusing `ART.grass`, and so on) rendered
  as a placeholder box until `installCoreTiles` started aliasing tile names to
  the art they declare. If you add a tile that reuses another's art, that alias
  loop already covers it.

**The single-file build** (`tools/build.mjs`, checked by `tools/check-build.mjs`).
`npm run build` flattens `index.html` and the 46 modules reachable from
`src/main.js` into `dist/oracle-of-tides.html`, which runs from a `file://` URL
with no server and no network. Five things that were not obvious:

1. **It has to be a classic `<script>`, not an inline module.** A
   `<script type="module">` is fetched with an opaque origin under `file://` and
   blocked by CORS in every browser — even inline, even with every import
   already resolved away. That single fact is the reason the build flattens the
   module graph into a tiny synchronous registry instead of just concatenating
   the modules and keeping `type="module"`. Anyone "simplifying" it back will
   produce a file that is blank on double-click and fine over `npm run dev`.
2. **The no-runtime-assets claim is real, and the build now enforces it.** There
   is no `fetch`, no `XMLHttpRequest`, no `new Image`, no `<img>`/`<audio>`
   anywhere: sprites are procedural JS, audio is WebAudio synthesis. The build
   greps for all of it and refuses rather than emitting a file that 404s. If a
   real asset ever lands, embed it as a `data:` URI — do not remove the guard.
3. **That grep must run over comment- and string-stripped code.** The naive
   version fired twice on innocent lines: `tiles-terrain.js` provenance comments
   name `.png` sheets, and the overworld room grid `'Tg.....ogg'` is tile
   letters that happen to spell an audio extension. `stripCommentsAndStrings`
   in build.mjs exists for exactly this.
4. **`new Audio()` in `src/core/audio.js` is not the DOM `Audio`.** That module
   declares its own `class Audio` — the synth. The asset scan skips a global
   that the module shadows with its own declaration, which is why the pattern
   table carries a `shadow` column.
5. **Imports become destructuring, so an import cycle would break silently.**
   Every export in `src/` is a `const`, `function` or `class` — nothing is
   reassigned — so snapshotting a binding is safe *provided* the dependency has
   already evaluated. The build therefore topologically sorts and hard-fails on
   a cycle, naming the loop. It also rejects the forms it cannot express
   (default exports, `export *`, re-exports, dynamic `import()`, and
   multi-declarator `export const A = 1, B = 2`, which the transform would
   publish only half of). Extend build.mjs rather than working around it.

Also: `dist/` is in `.gitignore`, which silently swallowed the built file the
first time. It is now `dist/*` plus `!dist/oracle-of-tides.html`, so the build
output is committed and nothing else in `dist/` is.

And: `check-build.mjs` is only worth anything if it fails. It was verified by
sabotaging the bundle's last line with a thrown error and confirming it went
red on six separate assertions at once. `window.__game.frame` is the frame
counter — there is no `tick` or `frameCount`, and a check that reads a field
which does not exist passes forever.

### Scrimshaw (P7), and the three things it cost

**A pickup that opens a text box freezes the fight that dropped it.** The blank
had a friendly first-time hint on collection. An open dialogue freezes every
entity while the mode is still `play` (this is already in the traps list), so
the hint stopped the game dead in the middle of whatever had just died to drop
it — and `tools/replay.mjs` showed it as the d1-descent actor standing still
and then dying. There is now a comment on the pickup saying why it is silent.
The rule generalises: **a floor drop may play a jingle and must not speak.**

**Adding one NPC to an early room re-phased every enemy in the game.** Entity
ids are a global counter, `every(e, n)` in `enemy.js` derives an enemy's cycle
offset from `hash32('phase', e.id, n)`, and the scrimshander spawns in
Tidewatch — which `newGame` enters before anything else. So every entity
created afterwards, for the whole run, got a different id and therefore a
different attack phase. All three replays diverged in rooms the change never
touched. This is correct behaviour and re-recording is the right answer, but
budget for it: **any new entity in an early room re-baselines every replay.**

**A new drop must not be a difficulty change.** The blank's weight first came
out of the `heart` entries in the `good` and `rich` tables, because that is
where there was room. The d1-descent actor promptly starved and died in a room
it had always cleared. The weight now comes out of `null` and the small rupees,
the heart weights are untouched, and there is a comment on the table saying so.

**Also worth knowing.** `game.charm(id)` is the successor to `hasRing` and is a
pure read of a set recomputed once per frame, so it is safe from a draw path —
`drawDarkness` and the Wrecker's Eye glimmer both call it at display rate. The
live case is decided by `tideAt(game, player)`, the level under the player's
own feet, NOT `tide.level`, so standing in the Anchor's held patch keeps that
patch's charms alive. That is deliberate and it is the interaction most likely
to be "fixed" by a future session that has not read this paragraph.

### check-gates was unseeded, and failed on an IDLE machine

`tools/check-gates.mjs` intermittently failed its two Resonance Rod vane
assertions — roughly twice in ten runs. The tell was backwards from the usual
one: it failed on an IDLE machine and PASSED under six-way CPU load, and adding
a single `console.log` between the setup and the press made it pass every time.

**The cause was that it never pinned the save seed.** `newProgress` falls back
to `Date.now()`, so every run of the harness played a different world. This is
the SAME defect P2 root-caused in `test.mjs`, in the one harness P2 never
reached — and the paragraph P2 wrote about it applies verbatim: which file a
commit touched was coincidence, because every run was already a different game.
`?seed=20260806` fixes it: 18 idle runs and 5 under load, no failures, against
a baseline of about two per ten.

**A diagnosis that was wrong, recorded so nobody repeats it.** The obvious
suspect was `page.keyboard.press()` firing keydown and keyup inside one game
frame and the edge-triggered `pressed()` swallowing it. That cannot happen:
`src/core/input.js` keeps a `_latch` precisely so a key that goes down and up
between two updates is still seen for exactly one frame. Read the latch before
blaming the press.

The harness was ALSO wall-clock driven — it polled `requestAnimationFrame`
against `game.frame` while `main.js` kept stepping — and it now calls
`takeOver()` and `step(n)` like `test.mjs` and `replay.mjs`. That is the
documented standard for a harness in this repo and it makes every hold exact
rather than approximate, but it is not what fixed the flake; the seed was.

### Dungeon themes, and the four things they cost

**A wall tile must tile with itself in BOTH axes, and a contact sheet cannot
tell you that.** Four dungeons were themed off single-cell previews with
`hatchWall` and `forgeWall`, which are wall RUNS — directional art meant for
the top course of a room. Repeated down a two-tile border they read as a picket
fence. Render a 4x4 tiling of a candidate and LOOK at it; the tiles that
survive that test are bevelled block grids and brick courses.

**`registerPalettes` silently ignores any palette that is not exactly four
colours.** A flat tile can quantise to two or three, so its palette registered
nothing, its tiledef named a palette that did not exist, and the tile drew in
the fallback. `validate.mjs` was the only thing that caught it. The ripper pads
to four now — and note `rip-terrain.py` emits the same short arrays and has
never noticed, because it does not install its palettes. If a future session
makes it install them, pad there too.

**A tile sitting on a room boundary in a stitched map carries the boundary.**
Both copies of one flagstone have a stripe of the stitcher's frame in the right
edge. The deduplicator cannot know that is not art — different pixels means a
different tile, and it dedupes to itself perfectly.

**Floor and wall must stay legible before a theme is allowed to be
atmospheric.** d5's floor and wall were both brick courses and the room read as
one texture with no line between walkable and not.

**The shape of the solution is worth reusing.** A theme is
`registerLegend(name, {five characters}, 'dungeon')` — it inherits the shared
legend and overrides floor, cracked floor, wall, bombable wall and block. No
room grid changed; a dungeon picks its look with one `legend:` field.
`validate.mjs` asserts every themed tile carries exactly the flags of the tile
it stands in for, so a theme can never move a wall.

### P7.5 is blocked on assets; P7.6 is built

The four Oracle of Seasons dungeon map rips P7.5 is written against are not in
`assets/sheets/`. The tool it asks for exists and works
(`tools/rip-dungeon-maps.py`, proven on the one stitched floor map that IS
here, byte-identical, checked by `tools/check-tilesets.mjs`), but the
colour-register decision that governs everything after it cannot be made
without them — the evidence that CAN be gathered is tabulated in
`docs/ART-DIRECTION.md` and is not conclusive. See `docs/ART-BACKLOG.md`.

**The alignment trap in that tool cost the most time and will recur:** gridding
a stitched sheet from the image's global content edge instead of from each
block's own corner turns one wall tile into a family of sixteen, and reports a
dedup ratio that looks like success. 4936 unique before, 2181 after.

P7.6 (multi-screen dungeon rooms) is **BUILT**. It was planned in
`docs/briefs/P7.6-PLAN.md` and executed against that plan. The survey finding
that made it tractable held up exactly: `ROOM_W/ROOM_H/VIEW_W/VIEW_H` appeared
30 times across six files and every use meant the room's tile extent
(`room.tw`/`room.th`), the room's pixel extent (`room.pw`/`room.ph`), or the
size of the window on screen (still `VIEW_W`/`VIEW_H`) — separating those three
was most of the work, and the camera was the small part. What a dungeon session
needs to know is in `docs/EXECUTION-PLAN.md` under "ROOM SIZE — everything a
dungeon session needs, in one place"; what it cost is at the top of the
hard-won-lessons section above.

### Fixed-point movement, and the four things it cost (P3)

All five are things that passed at least one green checker on the way through.

**1. A jump's reach is a function of the WALK speed, not the jump.** The player
keeps walking while airborne, so `reach = 2*power/gravity * WALK_SPEED`.
Re-deriving `WALK_SPEED` from 1.35 to 1.0 px/f cut Roc's Feather from 2.3 tiles
to 1.7 and made the Coral Reef chasm — a real region gate — uncrossable.
`validate`, `test`, `walk-dungeons`, `check-overworld` and **both replays** were
green; only `check-gates.mjs` caught it, because it is the only harness that
jumps. If you touch `WALK_SPEED`, re-derive the three jump constants in the same
commit. The formula is in `feel.js` above `JUMP_POWER`.

**2. A frame budget calibrated against a constant rots when the constant
moves.** `check-gates.mjs` held a direction for a flat 22 frames, which was 2.1
tiles at the old walk speed and 1.5 at the new one — so the Feather check
failed on a chasm the Feather still clears. The fix was not a bigger number: it
now reads `WALK_SPEED` out of the page and derives the budget. Any harness that
writes down "n frames" to mean "far enough" has this bug latent in it.

**3. Converting a constant's unit breaks any DATA that overrides it.**
`ENEMY_HOP_POWER` went from px/f to sp/f, and the zol's `power: 1.7` was then
read as 1.7 *subpixels* — the slime hopped a 150th of a pixel and nothing
errored. Same shape for `driftWithTide`'s `perLevel` and `Pickup`'s `vy`. When
you change a constant's unit, grep `src/data/` for anyone passing an override,
and make the fallback and the override explicitly different units at the edge.

**4. `e.x += 0.5` silently stops working.** `x` is now an accessor over an
integer accumulator, so a read gives whole pixels and a sub-pixel increment
rounds away to nothing every frame. Every `+=` on a position had to become an
add to `fx`/`fy`/`fz`. The ones that bit were `Effect.update`, `Pickup`'s pop,
the boomerang's return, the hookshot's retract and the pincer's reel-home —
all of which would have just frozen in place.

**5. An actor that retreats can retreat out of the room.** Teaching
`replay.mjs`'s swordsman to disengage diagonally (which it needs, now that
diagonals are the fast direction) made it back out through doorways mid-fight.
A `fight` directive that ends in a different room than it started in does not
fail — it records perfectly, and every directive after it is addressed to a
room the player is not in, so the rest of the route becomes fiction while still
producing a green replay. `dFight` now fences every mask it yields against the
room edges. Cost two recordings to find because the trace looks plausible.

Also worth knowing: the old replay baselines recorded final positions like
`x: 63.015805675746414`. They are integers now, which is what "asserts to the
pixel" was always supposed to mean.

### A sprite that does not fit its cell, and the two ways to get it wrong

The held-blade poses are the game's first non-16x16 player sprites. Two traps
came out of adding them:

**`parseArt` strips WHITESPACE-only rows, not transparent ones.** A row of
`................` is not blank — dots are not whitespace — so it survives the
parse and counts toward the sprite's height. A first attempt trimmed all-dot
rows in the ripper "to match", which silently shrank a dozen existing frames
(`link_swim_up_0` went 16x16 -> 16x13) and moved the anchor of the new ones.
`validate.mjs` caught it, because `expectedSize` asserts every sprite's
dimensions. Emit exactly what was cut.

**Derive the draw anchor from the sprite, not from a constant.** These frames
are anchored so Link's *body* lands where a 16x16 frame would put it, which
means offsetting by the overhang — 12px up for the up-facing frame, 12px left
when the side frame is mirrored. `Player.draw` reads `sprites.size(name)` and
computes it, so re-cutting the frames in `rip-link.py` cannot leave a stale
offset behind. Writing the numbers down would have been three lines shorter and
one silent bug away.

And the flip is about the sprite's own canvas, not the world: mirroring a
28-wide side frame carries the body to the far end of the canvas, so the offset
belongs to `flipX`, not to `dir === 'left'`.

### `tools/shots-link-baseline/` was three weeks stale

P3's brief said to diff it. Doing so showed 47–96% of pixels differing on most
shots, which looks like catastrophe and is not: the baseline was captured on
2026-07-31 mid-way through the art pass, when 38 sprites were still unauthored
placeholders and the HUD was not drawn. It had not been refreshed since, so it
had been silently useless through P1 and P2.

The honest P3 diff needs a *pre-change* capture, not that baseline:

```
git worktree add /tmp/pre HEAD
cd /tmp/pre && node tools/test.mjs --shots --shot-dir=shots-pre
```

Against that, P3 moves 0–5.7% of pixels, all accounted for: Link is a tile
behind at the same scripted frame count because he walks slower, and the
file-select screen's animated water is at a different phase. The baseline is
refreshed as of this session. Nothing in the repo compares against it
automatically, so it will go stale again unless someone refreshes it when the
art or the movement changes.

### A chest's pickup can land on a solid tile and be uncollectable

Found while recording the D1 replay, and it passes every existing checker.

`Game.openChest` spawns a `chest.pickup` at `chest.y - 12`, one tile above the
chest, with no check that the tile there is standable. In `d1` room `0,4,5` the
Compass chest sits at (4,3) with a **pot** at (4,2). The pickup settles at
y≈32.2, its rect is y 36.2–46.2, and no legally standable tile in the room
overlaps it — measured, not inferred. The chest opens, the jingle plays, the
save records the chest as opened, and the Compass is never collected. The pot
is liftable, so it becomes reachable once the player has the bracelet from a
later dungeon; on the intended first visit it is not.

Two things follow. Any chest with a solid tile directly above it has this bug,
so it is worth a checker rather than a one-room fix. And `openChest` spawning
into an unvalidated tile is the actual defect — `findSafeTile` already exists
for exactly this shape of problem.

Not fixed here: it is dungeon content, and P8 re-authors D1 anyway. The D1
replay opens the chest deliberately (an opened chest is persisted save state
worth asserting on) and its plan comment says the Compass is not collected.

**Update (P8, D1).** That room is re-authored: `0,4,5` holds the Chartstone in a
chest at (5,3) with plain floor at (5,2), and `d1-descent` now collects it. THE
ENGINE DEFECT IS UNTOUCHED — `openChest` still spawns into an unvalidated tile,
and five other dungeons are unaudited for it. The checker is still owed.

### A dropped pickup pops upward and never comes back down

Found while re-recording `d1-descent` after the P3/P4 merge, and it silently
loses a Small Key.

`Pickup.update` runs `fy += vy; vy += PICKUP_GRAVITY` for `PICKUP_SETTLE_FRAMES`
frames and then stops. With the current numbers that sums to about **five
pixels of net rise**, and nothing brings it back down — the settle window ends
while the pickup is still travelling upward. So a pickup spawned at tile
`(4, 3)` comes to rest straddling the tile above it, and a player standing on
`(4, 3)` overlaps its rect by about one pixel.

That was always true — the pre-P3 float constants netted ~3.8px — but P3's
snap to the subpixel grid took it to ~4.7px, which was enough to turn a
marginal overlap into a miss. The D1 Crab Pit's reward key stopped being
collectable, and **the failure is invisible**: the route walks on, the locked
door two rooms later simply never opens, every directive after it addresses a
room the player never reached, and the recording is still perfectly valid. It
was only caught because `expect.doorsChanged` came back 0.

Two things follow. `tools/replay.mjs`'s per-step trace now prints `keys=` and
`doors=`, because "the route continued without the thing it needed" is not
visible in a position. And the pop itself is a real defect worth fixing
properly — a drop should come to rest where it was dropped. Fixing it moves
every drop in the game by a few pixels and re-baselines both replays, so it
wants its own change rather than riding along with someone else's.

### A miniboss is not `isBoss`, and motion has to test the class

Cost a failing `check-motion.mjs` run and a confusing table. Minibosses are
built with `defineBoss` — they want its phases, intro hold and staged death —
and then **clear `isBoss` in their `init`**, because `onEnemyDefeated` keys
"dungeon beaten" off that flag and a miniboss counted as a boss marks its whole
dungeon complete. That is documented at the top of `src/data/bosses.js` and it
is correct.

The trap is that `e.isBoss` therefore answers a *progress bookkeeping*
question, not a "what kind of thing is this" question. `gridLocked()` in
`enemy.js` asked it and put all eight minibosses on the 8px lattice, which is
exactly what a set piece must not be on. It tests `instanceof Boss` now. Any
future code that wants to know whether something is a set piece has the same
choice to make, and the flag is the wrong side of it.

### Grid-locked enemies cost the replay actor about 60% more health

Not a bug, but it will look like one. The recording actor in `tools/replay.mjs`
lines up on one axis, swings, and stands still for the length of the swing. It
is tuned against enemies that drift continuously and can be nudged. An enemy on
the lattice commits to a whole 8px step and cannot be deflected mid-step —
which is the entire point of the design, and which a human handles by reading
the commitment and stepping out of it.

The actor cannot read anything. On three hearts it now dies in the Crab Pit.
`d1-descent`'s plan gives it five hearts, with a comment saying why. Two other
actor fixes were needed at the same time and are worth keeping in mind if a
route starts behaving oddly:

- **`dFight` chased the last foe out through a doorway** and carried on
  fighting in the next room, on whatever health was left. It now bails when the
  room changes: a `fight` directive means "clear *this* room".
- **`dExit` stopped pressing the moment the room changed**, which leaves the
  player one or two pixels inside the new room, still on the seam. The next
  directive's first step back toward it re-triggered the transition. It now
  keeps walking for ten frames after the change.

Both were latent before P4; the lattice is only what made them bite. P3 had
independently fixed the first of them with a `fence` that strips any direction
that would carry the player out of the room — that is the better mechanism and
it is what survived the merge; the room-change bail is kept as a backstop.

The one that actually mattered on the merged engine is different and worth
stating on its own: **the swordsman attacked shielded enemies from the front
and swung into the shield forever.** A `shield: 'front'` enemy blocks whatever
arrives at its facing side, and the nearest axis is very often exactly that
side. Three shielded crabs in the D1 Crab Pit is where it shows, and an
unclearable Crab Pit means no Small Key. `dFight` now prefers whichever axis is
*not* looking back at it, which is what a player does without thinking: a crab
patrols along x, so its facing is left or right nearly every frame, and coming
at it from above makes the shield irrelevant.

Two things that were tried first and were worse, so do not re-try them:
widening the standoff band to one full enemy step (16..24) — standing further
out means walking further in, and the extra approach frames cost more health
than the extra swings win — and raising the patience, which only made the actor
spend longer failing the same way.

### Merging P5 into P6, and the four things THAT cost

Both sessions ran in parallel against the same base and both were green alone.
Fifteen textual conflicts across six files, all of them "keep both". The
expensive part was, as HANDOFF has said twice now, **what merged cleanly**.

**1. The two branches disagreed about who owns the clock, and the merge hung.**
P5 branched from a commit BELOW the P2 merge, so its `test.mjs` had no
`takeOver()` and its new field section waited on `g.frame` from inside a
`page.evaluate`. Merged into a `test.mjs` that does own the clock, nothing ever
steps the game, so those waits never return: the run hung with **no output at
all** and no error, which reads as a broken browser rather than a broken test.
Every wait in that section is `window.__harness.step(n)` now. If you merge a
branch that predates P2, grep it for `requestAnimationFrame` and `g.frame`
before you trust a green run.

**2. A stand-in built to be deleted still has to be deleted carefully.**
`src/game/tidelocal.js` existed only so the Squall Bellows could hold water
back before P5 landed, and its header said exactly how to remove it. Following
that header was right, but it named five call sites and the real number was
nine — four more had appeared in `items.js` (the Dredge Line's drag, the
Resonance Rod's range and radius) after the header was written. A header that
lists call sites goes stale the moment someone adds one. `git grep tideAt` is
what actually finds them.

**3. The two items compose, and the naive merge would have made them lie.**
The Brineglass Lens draws the room at the next tide level. Rendering that from
a bare number is correct until a Tidewright's Anchor is down — and then the
preview shows the held patch changing, when the held patch is the one part of
the room that will not. `Tide.viewAt(base)` is a read-only view of the field
with a different base, so the Lens previews the FIELD. Neither branch could
have found this alone; it only exists in the merge.

**4. A parallel render cache has to be keyed the way the real one is.**
`Room.renderAt` was an array indexed by tide level, which is fine when the
argument is a number. P5's `render` takes the field too, keyed on
`tide.stamp`. Left alone, `renderAt(field)` would have cached under
`"[object Object]"` forever and drawn water that stopped being true several
anchors ago — silently, because a stale canvas throws nothing. It uses
`cacheKeyFor` now, the same function `render` uses.

**What the collapse actually looked like**, for the next person who has to do
one: the Bellows' cone became an ordinary entry in `tide.overrides` with two
small extensions to P5's structure — a `'cone'` footprint in `Tide.covers`, and
a `delta` alternative to the absolute `level` in `Tide.levelAt`. The delta is
the interesting half: the Anchor is absolute because it is holding out against
the conch, and the Bellows is relative because it holds the water back one step
from wherever the conch currently has it. One number could not have served
both, and collapsing them would have made one item quietly wrong.

Because the cone is a real override, `Room.render` draws the drained wedge
through the field and the field's stamp invalidates the cache — so
`Game.drawTideHolds`, the whole second draw path, deleted.

### The item roster (P6), and the six things it cost

Nine items in, ten out. `docs/ITEMS.md` is the roster and `tools/check-items.mjs`
is the proof. Six lessons, every one of which produced code that passed every
checker that existed at the time.

**1. A chest can hand over an item that does not exist, in total silence.**
`giveItem` records any id you give it. `itemName` returns the raw id and
`itemIcon` falls back to `i_unknown`. So a chest granting a DELETED item opens,
plays the item-get jingle, freezes Link in the pose, writes to the save and
hands over nothing — no error, no warning, no failing test. This happened: the
Tidewash Grotto went on granting Roc's Feather after the feather was deleted,
and `validate`, `walk-dungeons`, `test` and both replays stayed green through
it. `check-items.mjs` now walks every chest, giver, puzzle reward, cutscene
gift and dungeon declaration and asserts each names a real entry. It was
verified by re-running it against the broken data.

**2. A tiledef field the registrar does not name is discarded.**
`registerTiles` in `src/world/tileset.js` copies field by field rather than
spreading, so `liftLevel` and `liftSprite` had never reached a single tile —
`boulder` declared one, `Game.liftTile` read one, and the two had never met for
the whole life of the project. Nothing showed it because the boulder was ALSO
behind an item the player did not have yet, so the symptom had no way to
appear. Same class as the `giver` options above: data contracts drift from
engine contracts and nothing checks it. **If you add a field to a tiledef, add
it to `registerTiles` in the same commit.**

**3. Deleting an item from `ITEMS` by slicing between two banner comments will
take its neighbours with it.** Twice. The first slice ran from `feather:` to
`bombs:` and deleted five items that had been inserted between them; the second
ran from the "Seeds" banner to the "Resonance Rod" banner and took the
Ferryman's Coin, which sat between the two. Both compiled. Both passed
`validate`. `check-items.mjs` caught both within seconds, because it presses
each item's button. Delete by matching the whole entry, brace-counted, not by
slicing a range.

**4. A harness assertion that expects "nothing happened" cannot tell you why.**
`check-gates` asserted `tx === 0` for "the chasm cannot be walked across" —
which is also exactly what a key press that never arrives produces. It had been
passing for the wrong reason: `setup` left `player.carrying` dangling from the
previous probe (a direct reference that survives filtering the entity list, the
same shape as the old `player.boomerang` bug), and a carrying player refuses to
hop. Prefer assertions that expect a POSITIVE result; when you must assert a
negative, assert something else positive in the same probe.

**5. `setup` in a gate harness has to reset three things, not one.** A gate
transform with `persist: true` writes into `progress.secrets` AND into the
Room's own `override` grid, and rooms are memoised in `maps.js` — so re-entering
the room undoes neither, and a gate opened by one probe is still open for the
next. And `tide.setLevel(level)` without `{ instant: true }` starts a 23-frame
sweep during which `Game.update` returns early, so a probe that presses a
button immediately afterwards spends its whole frame budget inside the wipe and
reports a working item as broken. All three were harmless until an item in this
session moved the tide.

**6. Removing an EXTRACTED icon means editing the ripper, not the output.**
`src/data/sprites-hud.js` is generated by `tools/rip-hud.py`; deleting entries
from the generated file works right up until someone re-runs the ripper. Take
the name out of `GRID`/`RECTS` and re-emit. `pip install pillow` first, and run
the ripper once BEFORE changing anything to confirm it reproduces
byte-identically — it does, which is what makes the edit safe to read as a diff.

### The tide is still a scalar, and P6 was written not to fight P5 over it

P5 (`tide.levelAt(tx, ty)`) was being implemented in a parallel session while
this one ran, and `docs/HANDOFF.md` already records what building the same
mechanic twice costs. So P6 did **not** refactor the tide.

One item genuinely needs a local override — the Squall Bellows holds the water
back inside a cone — so `src/game/tidelocal.js` exists, and its header is
addressed to whoever merges P5. The shape is deliberately minimal:

- `game.tideAt(tx, ty)` is a one-line method on `Game`. Everything that asks
  "what is the water doing HERE" goes through it; everything that asks "what is
  the water doing" still reads `tide.level` and is right to.
- Six call sites are spatial today, all listed in that file's header.
- The Bellows' cone is an entry in `game.tideHolds`, which is a stand-in for
  P5's override list and **must not survive alongside it**.

Merging P5 should be: delete `tideLevelAt`'s body, forward to
`tide.levelAt(tx, ty)`, keep `Game.tideAt`, drop `game.tideHolds`. One function.

### Two verbs came out from behind items, and A got busier

Roc's Feather and the Power Bracelet are gone, and the hop and the lift are base
moveset. Both are genre grammar and this game gates on the tide, so a jump or a
lift behind an item was a lock wearing a costume.

The hop is **not on a button**: walking into a one-tile gap hops it, reusing
`ledgeHop` whole — one arc, one set of constants. `GAP_HOP_MAX_SPAN` is what
decides how wide a gap may be, and `check-overworld`'s flood reads that constant
rather than writing the number down, so the Coral Reef's four-tile decorative
chasm bands are still walls while its one-tile chasm is now free.

The lift is on the **context button**, which is where the Oracles put it once
you have the bracelet. The consequence is worth knowing before it looks like a
bug: **A is context-first, so standing next to a pot with an item bound to A
means the pot comes up instead.** That was already true of talking to a
villager — `tools/test.mjs` had to turn Link around before the conch section,
because the tile he was facing is one of the village rocks and it ate the press.

## The two gates that cannot be tiles

Roc's Feather and the Power Bracelet became real tile gates this session. The
other two were implemented, measured, and taken back out. The measurements are
the point — do not redo them:

**Roc's Feather travels 2.27 tiles while airborne** (28 airborne frames,
36.4px), measured by driving a real jump and sampling `player.z` and `player.x`
every frame. Everything below follows from that number.

**`Room.solidAt` lets a JUMPING player through `F.DEEP` as well as
`F.JUMPABLE`.** So deep water is not, by itself, a Flippers gate: any channel
the Feather can clear is crossed without Flippers, and the player has the
Feather from D1. A Flippers channel therefore has to be **at least 3 tiles
wide**, and so does anything meant to stop the Feather.

- **Zora's Flippers / Drowned Wood — sealed 68 of 120 screens.** At 3 tiles
  wide, gating the Wood's five crossings cuts the map in half, because the
  Drowned Wood sits in the middle of the 12x10 grid and nearly every route
  crosses it. This is a level-design fact, not a tuning problem: the Wood is a
  thoroughfare. Making it a hard gate needs the region moved or a second route
  around it, which is a map change, not a tile change.
- **Hookshot / Reef Palace — the post is always out of reach.** A span has to
  be 3 wide to stop the Feather. The player fires from the tile before the
  span, must land on solid ground, and the post has to be one tile beyond that
  landing — so the post sits 5 tiles (80px) from the player. `Hookshot.maxLen`
  is **64px at level 1** (104 at level 2). The arithmetic never closes at L1.
  A 2-wide span reaches, but the Feather crosses a 2-wide span — verified: on
  the 3-wide span a jumping player reached the second tile and no further.
  This needs an engine decision (a longer L1 hookshot) or a different mechanic.

**A gate whose action nothing fires is the failure mode to watch.** The first
Reef Palace span had no post to latch onto at all. It flooded correctly in
`check-overworld.mjs` and was impassable in play — exactly the gap the two
checkers exist to close, caught by the in-engine half.

### The two tile-finding scans are committed tools now

```
python3 tools/rip-terrain.py --scan  <ow|dg|ag> <x0> <y0> <x1> <y1>
python3 tools/rip-terrain.py --props <ow|dg|ag> <px> <py> <x0> <y0> <x1> <y1> [out.png]
```

`--props` is the counterpart to `--scan`, and it exists because **the seamless
scan cannot find a prop by construction**: a prop is exactly the thing that
does not repeat. It walks the tile grid at the phase you give it, works out the
ground colour dominating each cell's 3x3 neighbourhood, and keeps the cells
that are 25-80% ground — an object with ground showing round it, rather than
bare ground or a solid block of something else. It writes a numbered contact
sheet; read it and pick by eye, per `docs/briefs/AGENTS.md` section J.

You need the grid phase first, and the cheapest way to get it is `--scan`: any
ground tile it reports gives it to you as `(x % 16, y % 16)`. On the Ages
overworld sheet that is (2, 8).

This file used to describe the scan in prose and note that the script was not
committed, which meant the next person to need it had to rewrite it from the
paragraph. It is in the ripper now. A ground tile is the 16x16 window that
repeats at +16 in x **and** +16 in y; passing that test proves the window is
correctly phased and tiles seamlessly, which is the property terrain has to
have. It prints each distinct tile with a real origin you can paste into
`PICKS`, ranked by how much of the region it covers.

The one implementation note worth keeping: **deduplicate hits on raw bytes
before canonicalising them.** Every hit has 256 cyclic phase shifts that are
the same tile, and canonicalising every hit instead of every distinct hit is
the difference between seconds and not finishing.

What it found when it was run across the overworld sheet's green regions,
so nobody repeats the search: the sheet has exactly two seamless grass
textures worth having and **both are already extracted** — `tallgrass`
(886,1049) and `grassTuft` (1611,307). The dense herringbone at 1305,1194 that
looks like a promising base grass is `tallgrass` again at a different phase.
Base `grass` stays hand-drawn not because nobody tried but because the sheet's
only alternatives are a banded field (508,1549), a dither field (532,1500) and
a third tuft pattern (2287,670), none of which is better than the flat field
already there, and one of which would make `grass` and `tallgrass` read the
same — which matters, because `tallgrass` is the cuttable one.

### P4 was written pre-P3 and had to be redone on fixed-point, not merged

This section used to say the P4 branch could not be merged. It was right about
the reason and the reason has since been dealt with; both halves are worth
keeping, because the trap is a general one.

`claude/enemy-grid-aligned-movement-n2xv16` was written from the same base as
P2 — that is, **before P3** — and the two prompts disagreed about what a
position *is*:

```
P4:  e.x = x; e.y = y;                 // writes a float field
     if (!Number.isInteger(e.x) ...)   // guards against drift off the lattice
P3:  get x() { return toPx(this.fx); } // an accessor over integer subpixels
```

Under P3 every `e.x` is an integer by construction, so P4's realign guard would
have been **always true and quietly dead**. A textual merge would have
compiled, passed most checks, and silently dropped the one guarantee the prompt
exists to make. That is the worst outcome available, and it is why "there were
only eleven conflicts and they all resolved" is not evidence a merge is sound.

**What was actually done:** the lattice was rewritten on the subpixel grid
rather than merged onto it, which is what the objection asked for. It got
simpler, as predicted:

- a lattice point is a whole multiple of `ENEMY_GRID_STEP * FP_ONE` = **2048
  subpixels**, and `onLattice(e)` is `e.fx % 2048 === 0 && e.fy % 2048 === 0` —
  an exact integer test, which is what replaced the dead `Number.isInteger`
  guard
- `beginStep`/`advanceStep` work entirely in subpixels. Progress is recomputed
  from the step's origin every frame as `round(span * f / n)` rather than
  accumulated, and the final frame is an assignment, so no remainder can exist
- `tools/check-motion.mjs` asserts on `fx`/`fy`, never on `x`/`y`. A
  pixel-level check would pass an enemy sitting up to 255 subpixels off a
  lattice point — precisely the drift an accumulating step would produce, and
  precisely what the checker exists to catch

The knockback numbers, the lattice design and `check-motion.mjs` carried over
unchanged; only the arithmetic moved.

**The general lesson.** When two branches disagree about a representation
rather than about lines of text, the conflict markers understate the problem by
a lot: the dangerous case is the code that merges cleanly and stops meaning
anything. Before merging across a representation change, find the invariants
one side asserts and check each one is still expressible on the other side's
terms. If an assertion becomes trivially true, it has not survived the merge —
it has been deleted.

### P4 was then built a second time, in parallel, and the duplicate was binned

The note above ended with "redo P4 on fixed-point". **Two sessions read that
note and both did it**, neither aware of the other, and the second one finished
against a `main` that already had the first. Both were complete: a lattice, a
per-step turn cadence, scripted knockback, a `check-motion.mjs`, both replays
re-recorded, every checker green. The convergence was almost total — same 8px
step, same `round(span * f / n)` interpolation, same `instanceof Boss` test,
and both independently discovered that the D1 Crab Pit crabs carry
`shield: 'front'` and stall the replay actor.

The duplicate was **discarded whole**, not merged, and that was not a close
call. Two implementations of one mechanic do not combine into a better one;
they combine into a mechanic nobody can reason about. The comparison that
settled it took about ten minutes and was decided on three points where the
version already on trunk was simply better:

- it splits `PLAYER_HURT_FRAMES` from `PLAYER_KNOCK_FRAMES`, so the stun and
  the shove are separate durations rather than one number doing two jobs
- `beginStep` probes the destination before anything moves and `advanceStep`
  rewinds to the step's origin if the way closes mid-step, so a step is atomic
  and an interrupted enemy is still on the lattice
- its shield handling generalises (`shield: 'all'` as well as `'front'`, and it
  only switches axis if the perpendicular one is actually unshielded)

**How to not pay this again.** Before starting a numbered prompt, `git fetch`
and check whether `main` already contains it — the phase sections in
NEXT-SESSION.md and the "already done" list are the index, and they are only
worth anything if they are read first and written last. A stale "P4 is next"
line survived in this file's reading list even after P4 landed elsewhere in the
same file, which is exactly the kind of contradiction that starts a second
implementation. **When two statements in these docs disagree about what is
done, stop and check the repository rather than picking one.**

## Verification harnesses

**Five of these are now committed**, and that is a deliberate reversal. The
old note here said none was committed because "rewriting is better than trusting
a read-through". In practice rebuilding them from this prose reproduced five
separate harness bugs in one session — every one of which reads as a *game*
failure rather than a harness failure, which is the expensive kind. A working
harness beats an accurate description of one:

```sh
node tools/find-crossings.mjs    # every tile-level way into a region (reporter)
node tools/shoot-rooms.mjs       # screenshot named rooms in their real palettes
node tools/walk-dungeons.mjs     # every dungeon room, every ledge, all 4 faces
node tools/check-overworld.mjs   # seams, border, flood, all three item gates
node tools/solve-switches.mjs    # one push per block
node tools/check-gates.mjs       # the two item gates, in-engine, with real items
node tools/check-motion.mjs      # ground enemies on the 8px lattice, fliers off it
node tools/find-ledges.mjs       # reports where a ledge may go (not a check)
node tools/check-build.mjs       # the shipped single-file build boots from file://
node tools/check-music.mjs       # track order resolves, note range, noise-only percussion
```

Run the room checkers after touching any room data, and check-build.mjs after
touching anything at all — it is the only thing that proves the file the game
actually ships as still runs.

**`check-overworld.mjs` and `check-gates.mjs` are deliberately redundant, and
both are needed.** check-overworld proves the MAP side — the region is
unreachable without its item and reachable with it — but it never runs the
game, so a vane whose transform names an action nothing fires floods correctly
there and is still impassable in play. check-gates proves the ITEM side with a
live player. That gap is exactly where the two boomerang bugs below lived. The rest below are still
uncommitted and still worth rebuilding; all copy the boot pattern in
`tools/test.mjs`.

Two of them need engine internals that `main.js` does not publish. It only sets
`window.__game`; pull the rest out of the live module graph from inside the
page, which returns the same instances:

```js
await page.evaluate(async () => {
  const m = await import('/src/game/entity.js');
  window.__spawn = m.spawnEntity;              // and MAPS, getText, CUTSCENES
});
```

- **Boss harness** (brief section G) — for each of the 16 types: spawn it into
  its real arena, run ~1200 frames with the player attacking and ~1200 idle,
  and assert it moves or attacks, takes sword damage, opens a weak point if
  `shell`, reaches a later phase, damages an idle player, and dies. 264
  assertions. Three things this harness taught the hard way, which you will
  otherwise mis-attribute to the AI:
  - **Spawn minibosses on their real tile.** Bosses sit at `(4,2)`; minibosses
    at `(4,3)` or `(4,4)` depending on the dungeon. Dropping a miniboss at
    `(4,2)` puts it inside a wall, where it cannot move and looks inert.
  - **Keep the player alive between samples.** A boss that kills them drops the
    game into `gameover`, where nothing updates and *every later subject in the
    run* looks inert.
  - **Reset the game between subjects.** A boss's death drops an essence; the
    parked player collects it, which opens a text box and then an essence
    cutscene. An active dialogue freezes every entity **while `mode` stays
    `'play'`**, which is a genuinely confusing way to fail.
- **Tide probe** — hold the tide at each level for 600 frames per boss and
  record open-window percentage, distance travelled, `z` and self-healing.
  Proves the eight hooks actually differ instead of taking the comments' word
  for it. A companion probe pins the boss in place and measures how far the
  *player* is dragged, which is the only way to see Thalassor's whirlpool and
  Gustharpy's downdraught.
- **Story harness** (brief section H) — walk `MAPS` collecting every
  `dialogue`/`waiting`/`after` id any room entity references, assert each
  resolves via `getText`, then run every cutscene in `CUTSCENES` via
  `startCutscene`, pressing A/START until it completes, asserting each ends
  within 3000 frames. A cutscene that never ends soft-locks the game.

The two below predate this session and are still worth rebuilding.

- **Overworld checker** (`tools/check-overworld.mjs`) — imports
  `src/data/index.js` in plain Node (no browser), asserts all 120 screens exist, that every seam's walkable edge tiles
  agree at all three tide levels, that the world border is solid, and that a
  *tile-by-tile* flood from Tidewatch Village reaches every screen. Tile-by-tile
  matters: a screen-level flood misses an interior wall stranding an exit.
  Give it a `--bombs` mode that makes `F.BOMBABLE` passable and it also proves
  the Marsh gate: without Bombs 10 of the 12 marsh screens are unreachable, with
  Bombs all 120 are. The two boundary screens still count as reached either way,
  because the doorway pocket you stand in is inside them. Note the flood must
  treat a tile as passable if it is walkable at **any** tide level — the player
  controls the tide — which is also why this checker cannot prove the
  swim/feather gates, only the bombable one.

- **Music harness** — plays every track and asserts the scheduler advanced.
  `audio.update()` schedules against `ctx.currentTime`, so a synchronous loop of
  600 `update()` calls advances **nothing** and reports a false failure on every
  looping track; real frames have to elapse via the game's own rAF loop, and the
  context needs a keypress to unlock. Then assert every `music:` name in room,
  map and cutscene data resolves. Cutscenes are exported as **`STORY_CUTSCENES`**
  from `src/data/story.js`, not `CUTSCENES`; get that wrong and `finalBoss` and
  `ending` silently look unreferenced.

- **Ledge harness** — now best run over the *placed* ledges rather than painted
  ones: collect every `_` run out of `MAPS`, park the player on the tile above
  its middle, hold Down, and assert the landing tile is past the lip with
  `z === 0`; then park below and hold Up and assert it is refused. Four things
  that make this read as "the hop does not fire" when the hop is fine:
  **clear `game.dialogue.active` LAST**, after the room has settled, because a
  room script can reopen the box during the settle and an open dialogue freezes
  everything while `mode` is still `'play'`; **reset `mode` to `'play'` and
  refill hearts each probe**, or the first room that kills the parked player
  drops the run into `gameover` and every later probe looks inert; **hold the
  key ~22 frames, not 40**, or the player walks out of the room and arrives at
  the top of the next one, which is indistinguishable from never having moved;
  and **wait for `player.ledgeHop` to clear before measuring**, because the hop
  drives `z` along a scripted arc and mid-arc reads as a failure.
- **The dungeon walker must model Roc's Feather.** `solidAt` lets a jumping
  player through `F.DEEP` and `F.JUMPABLE` alike, and half of d4 is a one-tile
  drown-wall band — a wall at LOW and MID, deep water at HIGH — whose intended
  crossing is to raise the sea and jump it. A flood that cannot jump reports 15
  of d4's 18 rooms stranded and the dungeon unbeatable. It is not.
  The walker must also **follow warps**: floors are joined by stairs, not by
  seams, so an edge-only flood never leaves floor 0 and reports every upper
  room stranded. And the Boss Key is authored `['chest', x, y, { pickup:
  'bossKey' }]` — look for `pickup`, not `item` or `kind`.
- **Ledge harness (painting variant)** — paint a run of `ledgeS` into a live room with
  `room.setTile` and walk the player at it from each side: downhill clears it
  and lands with `z === 0`, uphill is blocked, along the lip is blocked, and a
  ledge with `cliff` behind it refuses the hop. `room.invalidate()` after
  setting tiles or the room draws from its cached bake.
- **Audio harness** — `audio.jingle(name)` sets `trackName` to
  `'$jingle:' + name`, which is what to assert on; the scheduler only advances
  over real frames. Wrapping `game.audio.jingle` and calling `presentItem` or
  `applyReward` is how to prove a moment plays the track it should.
- **Switch-puzzle solver** (`tools/solve-switches.mjs`) — the classes are
  `PushBlock` and `FloorSwitch` in `src/game/objects.js`, the switch's flag is
  `.pressed`, and `game.tryPushBlock(tx, ty, dx, dy)` takes the **block's** tile
  rather than the player's. Satisfy the puzzle's other clauses (`pz.tide`,
  `pz.enemies`) first or a switch room that also wants the room cleared reads as
  an unsolvable switch puzzle. For every room with a `switches` puzzle, call the
  engine's own `game.tryPushBlock` exactly **once** per block, park the player on
  any switch still unpressed, and assert `room._puzzleDone`. One push per block
  is the whole point: teleporting blocks onto switches passes even when the
  puzzle is unsolvable, which is how the one-tile bug above survived.
- **Dungeon walker** (`tools/walk-dungeons.mjs`) — boots headless, `enterMap`s into every room of every
  dungeon, and checks: no page errors, the room renders, no tile falls through
  to `void`, every entity type in the room resolves, every seam has a doorway
  facing its doorway, and a flood from the entrance — treating locked doors as
  walls until a key is spent, and the boss door until the Boss Key is found —
  reaches every room and the boss room. Deduplicate lock tiles when collecting
  them, or the walk spends several keys on the same door.

## Source sprite sheets are in the repo

The reference sheets live in `assets/sheets/` and are committed, so extractions
are reproducible in any checkout. All three extractors resolve their paths
relative to the repo root and produce byte-identical output to what is
committed. See `assets/sheets/README.md` for what each sheet contains, who
ripped it.

Sheets present but not yet used: non-human races and trading characters. The
HUD/Gear sheet is used by `tools/rip-hud.py`; the icons Seasons does not have
(Flippers, Mermaid Suit, Hookshot, Moon Conch, Map, Compass, and now the
Tidewright's Anchor) stay hand-drawn. The dungeon-background, fan-made
overworld, Ages overworld, Subrosia tileset and Seasons SPRING overworld sheets
are used by `tools/rip-terrain.py` for ten ground tiles and two props.

## What is left, highest value first

Art, music, dungeon interiors, the key economy and the Marsh gate are all done.
What remains, in rough order of payoff:

0. **The overworld sheet's props are 2x2 game tiles, not 1x1.** This is the
   finding that closes most of the terrain question. Measured this session:
   the bush at 1693,1307 is ~30x31, the ringed stump at 1802,1565 is ~30x28,
   and the tree was already known to be 16x32. The game's tiles are 16x16, so
   none of them extracts *into a single tile* — compositing a 2x2 source prop
   down to one game tile is authoring, not extraction. **`flowers` was the only
   prop on the sheet that fits a single cell** (2061,1469, a 14x14 leafy
   rosette) and it is now extracted and planted. Do not go looking for a
   one-cell version of the others again; the measurements above are final.

   **A correction, made after actually looking.** An earlier revision of this
   file suggested the fix was to spend two tiles on a tree and extract the
   canopy and trunk halves separately, on the reasoning that the source games
   draw a tree that way. That is true of the source games and false of *this
   sheet*. `custom-oracle-style-overworld.png` is a fan-made assembled map, and
   its trees are not standalone objects at all — they are a **connected forest
   mass**, canopies merged into each other with a root strip along the bottom
   edge of the run. There is no 16x16 or 16x32 window anywhere in it that is
   one tree. Rendered with a 16px grid over the forest at 1760,1390 this is
   obvious in one look; do that before theorising again.

   The same holds for `bush`, `rock` and `cliff`. What the sheet has are
   *masses*: a tiling foliage texture (645,1516), a tiling boulder-field
   texture (1949,1823), and no natural cliff face at all. Those tile into
   areas; they are not props you can stand next to.

   **That asset arrived.** `assets/sheets/oracle-ages-overworld.png` is the
   Labrynna Present outdoor background, and it is everything the fan-made map
   is not: real Oracle art, standalone props, on a strict 16px grid at phase
   **(2, 8)**. Everything below was found on it. Prefer it for anything
   overworld from now on.

### What the Ages overworld sheet actually yields

Found with `--props` (see below) and checked cell by cell, so nobody repeats it:

- **`rock` — extracted, AG 418,936.** A clean four-colour boulder. Slotted
  `(1, 2, 3)` rather than `(0, 2, 3)`: index 0 of `stone` is near-white and
  blew the highlight out: the boulder read as a snowball. Index 1 is only
  forbidden for *ground* palettes, where it is the field tone; `rock` sits on
  grass via `underArt` and uses `stone`, so it is free.
- **`bush` — found and deliberately NOT extracted, AG 450,920.** It is the
  sheet's real cuttable bush and it is authentic. It is also the same four-leaf
  rosette as `flowers`, so shipping it made a tile the player must cut look
  identical to one that is pure scenery — verified by rendering both in the
  `tree` palette side by side, where they are near-indistinguishable. Gameplay
  legibility beat provenance. The clean fix is to re-pick `flowers` as
  something actually floral and then take 450,920 for `bush`; the coordinates
  are here so that is a ten-minute job.
- **`grass` — checked and left alone.** The Ages base grass is a *flat* field
  with sprig decorations placed as separate tiles, so the hand-drawn flat field
  already in the game is not a worse approximation of it — it is the same idea.
  The dense weave at AG 162,952 that the seamless scan ranks first is the sheet's
  scrub, i.e. the `tallgrass` role, which is already filled.
- **`tree` — fixed, but NOT by extraction, and the failed attempt is the
  lesson.** Every tree in every Oracle sheet is 32x32. The obvious move is to
  cut one into four quadrants and let each tile draw its quarter, so a 2x2 patch
  of tree tiles becomes one whole source tree. That was built, and it looked
  broken in play: trees offset from tile to tile, half-canopies butting into
  each other.

  **Measure the data before designing against it.** The overworld's tree tiles
  are not authored in 2x2 blocks and never were:

  | shape | count |
  |---|---|
  | vertical tree runs 1 tile tall | 643 |
  | vertical runs 2 tall | 248 |
  | horizontal runs 1 wide | 341 |
  | horizontal runs 3 wide | 186 |
  | horizontal runs starting on an ODD column | 266 of 639 |

  A 32x32 object cannot be assembled out of runs that are one tile tall and
  three tiles wide. Two thirds of the tree tiles in the game had no partner to
  form a tree with, and every run starting on an odd column drew its halves in
  the wrong order — which is exactly what "offset from tile to tile" looked
  like. Column parity, neighbour-joining, run-relative indexing: none of them
  fix it, because the information needed is not in the map.

  So `tree` is a whole tree in ONE cell, drawn to match rather than extracted —
  rule 2 of `docs/ART-DIRECTION.md`, which is the correct rule when no sheet
  supplies the thing at the size needed. It carries the source's silhouette: a
  light crown, a scalloped foliage line, a flared trunk. The quadrant machinery
  (`tileFace`, `def.quad`, `QUADS`) was removed rather than left dormant,
  because leaving it invites the same wrong turn again.

  The one piece of that work worth keeping is the palettes. Trees need a
  **trunk**, and all three tree ramps were pure green because the hand-drawn
  tree they were built for had none. `treeoak`, `treeoakdk` and `treeoakdd` are
  those ramps with index 2 swapped for wood; the originals are untouched
  because `bush`, `bushSand` and `palm` still use them.

  If the overworld is ever re-authored to place trees as 2x2 blocks, the
  quadrant approach becomes right and the source coordinates are SB 224,32.
  Re-check the table above first.

- **`cliff` / `cliffTop` — the sheet's cliffs are low ledges,** one cell of
  banded rock over sand (AG 82,136 and its neighbours), not the tall faces the
  game builds plateaus from. Not obviously better than what is there.

1. **More terrain.** Ten tiles are extracted; `cliff`, `cliffTop`, `tree`,
   `bush`, `rock`, `stump` and `palm` are still hand-drawn. They are
   harder than the nine that landed because they are *structured* — a cliff
   needs a top, a face and corners, and no single 16x16 window supplies that —
   and because they carry transparency and an `underArt`. The seamless-window
   trick in `tools/rip-terrain.py`'s header does not find them; they have to be
   picked by eye from a region dump.

   **Three things a session was spent establishing, so do not redo them:**

   - There is a scan that *does* find structured terrain, and it is a one-line
     change from the ground scan: a band (cliff face, wall run, hedge) is the
     16x16 window that repeats at **+16 in x and NOT at +16 in y**. Collapse
     only the 16 *horizontal* phase shifts — vertical position is real
     information there, it is what tells a cliff top from a cliff face — and
     dedup on exact bytes before canonicalising, same as the ground scan.
     Ranked by frequency on the overworld sheet this returns desert dune
     shelves, roof tiles, plastered building walls and one grey brick wall.
   - **It returns no natural cliff face.** The overworld sheet is a fan-made
     assembled map that is mostly town and desert; its closest analogue to
     `cliff` is a sandy plateau edge, which is a corner piece, not a repeating
     face. `cliff` and `cliffTop` are the two tiles least likely to come off
     this sheet, not the most.
   - **The sheet's tree is 16 wide by 32 tall** — a canopy tile over a separate
     root/base tile — while the game's `tree` is one 16x16 with canopy *and*
     trunk. `x1760,y1400` on the overworld sheet is a clean grove to work from
     (stumps and grass tufts are in the same crop), but a straight 16x16
     extraction gives a canopy with no trunk. Compositing two source tiles into
     one game tile is authoring, not extraction, and needs an in-game
     screenshot across several regions before it is believed — `preview.mjs`
     renders a pack in one palette and cannot show it.
2. **Water is still hand-drawn** and stays that way until someone finds a
   second animation frame: both terrain sheets are static maps.
3. **More ledges, if wanted.** 88 runs are placed across all four cardinals and
   `node tools/find-ledges.mjs` reports ~660 more tiles that would take one
   without walling a room off. That is a taste ceiling now, not a technical
   one. Run the finder rather than placing by eye: a lip is SOLID from three
   sides, so a run dropped across a corridor makes rooms unreachable and still
   validates, still renders, and is only caught by a flood pass long after you
   have placed forty of them.

## Known soft spots in what has been done
- **Four legend characters were declared and never used.** `f` (flowers), `^`
  (cliffTop), `Y` (treeSand) and `P` (palm) appeared in 0 of 303 room grids, so
  their art was never rendered anywhere in the game. `f` is now placed (127
  tiles across the 40 grass screens). The other three are still dead, and all
  three are SOLID, which is the dangerous class to place — a solid tile can
  strand a room and still validate.
- **`chasm` uses the dungeon pit art**, which on open sand reads as a hard-edged
  dark rectangle with no lip. It is legible as a gap but it is the weakest new
  tile; a proper overworld chasm wants a lit rim the way `ledgeS` has one.
- **`f` resolves per region** (`flowersDark` in marsh and wood, each region's
  own ground in salt, abyss, coral and reef) rather than meaning grass-flowers
  everywhere. If you add a region legend, give it an `f`.
- **All three tile-expressible region gates now match GAME-PLAN.md**:
  Bombs/`cliffCracked` (Marsh), Magic Boomerang/`saltVane` (Salt Pans) and
  Magnetic Gloves/`abyssPlug` (Abyssal approach). The remaining plan gates —
  Feather, Bracelet, Flippers, Hookshot — are terrain-shaped rather than
  tile-shaped, so no checker can prove them; they are asserted by level design
  only. **The Salt Pans gate also holds the Reef Palace shut**, because the
  Palace's own gate is the Hookshot and the Hookshot is in D6 inside the Pans.
  That is intended and `check-overworld.mjs` encodes it in `GATES.boomerang.covers`;
  if you move a gate, move the `covers` rectangle with it.
- **Every placed ledge is a shortcut, never a route.** The selector rejected
  any run that changed the room's walking connectivity at any tide level, so no
  ledge is load-bearing and none can strand a room. That is deliberately
  conservative: it also means a ledge saves at most a ten-tile detour, because
  a room is only 10x8. Ledges here are verticality and texture first.
- **`underArt` under a ledge is one fixed tile per variant**, so where a region
  mixes grounds — sand beside salt crust, say — the two transparent rows at the
  top and foot of the drop show the variant's ground rather than the neighbouring
  tile. It is two pixels of mismatch and reads fine; matching exactly would need
  the tile to know what is beside it.
- **`itemGet`, `secret` and `heartPiece` exist in `TRACKS` but nothing plays
  them.** The engine reaches for `fanfare`/`fanfareShort` at each of those
  moments (`src/game/objects.js`, `src/game/game.js`). Wiring them up is an
  engine change, not a data one.
- The overworld's remaining item gates (Feather, Bracelet, Flippers, Hookshot)
  are terrain-shaped, so `check-overworld.mjs` cannot prove them the way it
  proves the three flag-shaped ones.
- **North-facing ledges are drawn shallower than the other three on purpose.**
  A drop facing away from the camera shows almost no face, and the nine-row
  wall that sells `ledgeS` reads as a dark stripe painted across the floor.
  `ledgeN`'s face is six rows. East and west are straight quarter-turn
  rotations of the south lip, which keeps the speckle and face weight identical.
- **`ledgeN`/`dLedgeN` sit close to a dungeon wall in silhouette**, because both
  take `stonedk` and a dungeon wall is also a dark horizontal band. The lit
  bottom lip is what separates them, and it does read in game — but if a future
  dungeon palette narrows that contrast, this is the tile that breaks first.
