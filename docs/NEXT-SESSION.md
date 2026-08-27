# Next session

This file is a CONTINUATION doc, not an archive: what a session that reads
only this file needs to pick the work back up. Full history lives in `git
log`; durable lessons live in `docs/HANDOFF.md`'s hard-won-lessons section;
the dungeon board lives in `docs/DUNGEON-STATUS.md`; the phase plan lives in
`docs/EXECUTION-PLAN.md`. This file used to duplicate all of that inline and
grew to 3800 lines of superseded session narrative — it was pruned back to
current state only. If you're hunting for how a past decision was made, `git
log --oneline` and the docs above are the source of truth, not this file's
own history.

---

## Boss verb: contact damage fixed, ranged chip damage is what's left (this session)

**Not a win yet, but a real bug found and fixed, measured in real 3-heart
combat (seed 20260806, no god mode).** Re-ran the exact fight the last two
sessions measured (Gohmaraq, D1, `d1/0,3,1`) and reproduced their numbers
first (5 sword hits landed, boss 24->14, player dies) before changing
anything — confirms the harness is faithful to what's documented below.

**The bug: `dBoss`'s "keep approaching vs. stop and swing" gate used a
Manhattan-sum distance (`adx+ady > NEAR+6`), which is the wrong shape for a
boss with a non-square hurtbox.** Gohmaraq's hb is 26x20 inside a 32x32
sprite; the player's hb is 10x7. A diagonal approach can have `adx=17,
ady=11` — already overlapping on BOTH axes (real reach is ~18 on x, ~13.5 on
y) — while the sum (28) still reads comfortably "far" by the old gate (>24),
so the verb kept closing distance straight into contact. Instrumented every
`Player.takeDamage`/`Boss.hurt` call directly (not sampled) to find this: in
the reproduced baseline fight, 2 of the fight's 4 player-damage events were
boss CONTACT hits (4 quarter-hearts each — 8 of the 12 total) landed while
the verb was still in its "closing" branch, not its "swing" branch.

**The fix (`tools/actor-runtime.mjs`, `dBoss`): replaced the Manhattan-sum
gate with `inSwingRange(dx, dy)`, which reads `b.hb`/`p.hb` live and checks
each axis against the real combined half-extents plus a safety margin.**
Generic, not Gohmaraq-specific — it asks the live entities' own hitboxes
rather than encoding a boss-shaped number, matching the file's stated
philosophy. One trap paid down while building it, worth not re-hitting: the
first cut *subtracted* the margin from the reach (`rx - SAFE`), which
shrinks the safe box and made the verb walk deeper into contact before
switching to swing — a worse regression, caught immediately by the same
harness (measure before believing). The margin has to be *added* to the
reach so the gate fires before the hitboxes touch, not after.

**Re-measured after the fix, same seed, same fight: ZERO contact hits.**
Every remaining point of damage is the ranged rock-spray (`shot_rock`, from
`gohmaraqSlam`'s `spread()`). The fight now runs far longer (player dies at
frame ~2093 vs. ~513-796 before) landing the same 5 sword hits (boss still
only reaches 14/24 hp — the melee side didn't change, contact damage was
just removed from the total), then eventually loses to six 2-damage ranged
hits over the long fight. This is now a CLEAN measurement: the only thing
left killing a 3-heart player is the ranged spray, exactly as earlier
sessions suspected but couldn't isolate because contact damage was muddying
the numbers.

**Verified no regression:** `tools/check-bosses.mjs` still 13/13, all six
bosses' god-mode damage tallies byte-identical to before (Gohmaraq 24->14,
Wyverna 44->24, Rootmaw 52->32, etc. — god mode never spends contact damage
either way, so this fix shouldn't move those numbers, and it didn't).
`tools/test.mjs` still 59/59.

**Do NOT re-attempt a reactive per-projectile dodge without reading this
first.** A previous session tried exactly that (read live `game.entities`
for projectiles, sidestep their line) and it measured NET NEGATIVE — fewer
melee hits landed, no reliable safety gained. Three concrete failure modes,
each worth knowing before trying again:

1. `towardDiag`'s 3px deadzone (built for the chase) silently ate every
   dodge vector, because a shot's velocity (~0.5-2 px/f) is smaller than the
   deadzone — the dodge branch ran and pressed nothing, and this was only
   caught by instrumenting `takeDamage`/`hurt` directly (outside behavior
   was byte-identical with the "fix" in place).
2. The cross-product sign used to pick a dodge side is unstable exactly when
   it matters: Gohmaraq's spray aims AT the player's exact position the
   frame it fires, so the player starts almost exactly ON the shot's line,
   and the sign flips roughly every other frame — the dodge cancelled
   itself. Latching the side once per threat fixed the oscillation but
   exposed a third problem:
3. A latched dodge side can dead-end into the arena's own wall mid-dodge,
   pinning the player with only one axis of the dodge still live — not
   enough separation to clear a shot whose line isn't aligned with that
   wall. A fence-openness tiebreak on the initial pick didn't fix this
   because the pick is checked once, not continuously as the player is
   walked toward the wall over the following ~15 frames.

If picking this up again: the wall-cornering problem is the one still open,
and the fix likely needs continuous separation-tracking (not a one-shot pick
at first threat) or a dodge target chosen relative to the room's open space
rather than purely perpendicular to the shot. Given `windUp`/`spread`'s
shape (a frozen 22-frame tell via `e.stun`, then an instantaneous fire aimed
at the player's position at that exact frame), reading the boss's OWN telegraph
state (`b.stun > 0` before a slam) may be a more robust signal than reading
live projectiles — untried this session, flagged for next time.

**Next, in order:**

1. **Try the telegraph-based approach to the ranged spray** (react to
   `b.stun`/windUp rather than live projectiles) if picking the dodge back
   up, or look for a cheaper win first: Gohmaraq's eye stays open almost the
   entire fight at LOW tide, so the verb doesn't have to press every single
   opening if a fresh one is coming anyway — unexplored this session.
2. **The same-speed patrol problem is still unmeasured in real combat.**
   Phase 3's patrol speed (1.0 px/f) equals the player's own `WALK_SPEED`, so
   a patrol that isn't reversing is never caught by a straight chase. Only
   ever seen in godmode's unlimited-aggression run (which may not be the
   failure a real 3-heart fight reaches) — worth its own measurement.
3. **Once Gohmaraq is a measured WIN at 3 hearts** (0 hp reached, player
   still alive), wire `dBoss` into `tools/playthrough-route.mjs` past
   `d1/0,3,2` — the actor has no directive for placing the Tidewright's
   Anchor either, so `check-playthrough.mjs` also needs an anchor-placement
   verb before the route can pass this point. Until then, `check-playthrough`
   stops at `d1/0,3,2` and NOTHING HAS PLAYED THIS GAME TO THE END.
4. **The Boss Key / third-key pass** behind the Clawcrab door (D1's west
   wing and `3,1`) and **the other five dungeons' routes** are both still
   undone and both blocked on job 3 above actually finishing.

To reproduce the measurement above: it's not a committed tool (deliberately
scratch — see `check-bosses.mjs`'s own note that the kill itself is not
asserted there). Pattern: copy `check-bosses.mjs`'s `beginRecord` setup for
the `d1`/`gohmaraq` fight, set `godMode: false, maxHearts: 12, hearts: 12`,
and monkeypatch `Player.prototype.takeDamage` / `Boss.prototype.hurt` before
the fight starts to log every real damage event with the live frame counter
— sampling `boss.hp` on a timer misses multiple hits inside one window and
can't tell contact from ranged.

---

## Where things stand — everything below this line is DONE, not open work

- **Engine, renderer, tide system, save/load, menus, cutscenes, single-file
  build.** `npm run build` -> `dist/oracle-of-tides.html`, playable from a
  `file://` URL, committed at the end of every session.
- **All six dungeons (P8), all six items, all sixteen boss/miniboss fights
  structurally verified** (spawn + shell opens; the KILL is proven for none
  except by the boss-verb work above). Detail and per-dungeon design notes:
  `docs/DUNGEON-STATUS.md`.
- **PT (towns) steps 1-4**: block machinery, extracted town kit, four town
  screens, `tools/check-towns.mjs`. Step 5 (terrain backlog) and populating
  the towns with people are still open — see "What's left" below.
- **P9 step 3 (heart economy)**: cap raised from a broken 13 to 15 (24
  pieces, six Heart Containers), `tools/check-hearts.mjs` pins it and the
  damage ladder. **P9 steps 1, 2, 4 (region re-gating) are still open** —
  eight overworld regions gated on items that no longer exist. Full spec:
  `docs/EXECUTION-PLAN.md`, "P9 — Overworld re-gating and difficulty".
  **The Brineglass Lens must never be a region gate** (informational item;
  it IS required inside D2's own rooms, a different, narrower rule — see the
  D2 decision in EXECUTION-PLAN for why both stand).
- **The trading sequence (P9.5)**: the Coastwise Chain, eleven traders,
  pays out the Resonance Rod. `docs/TRADING.md`, `tools/check-trade.mjs`.
- **Title screen is drawn art**, matched to the Oracle series' title-card
  grammar. The series line ("THE LEGEND OF ZELDA") is deliberate — see
  CLAUDE.md's top section — do not strip it again.
- **The Kilnshell** (`docs/ITEMS.md` §1a): the 16th item, a lit cockle that
  burns torches/drift-tangle. Home: a chest in the Reef Hollow (`cave2`).
  Fixed the deadlock where nothing in `src/` could ever emit the `'fire'`
  tile action, which had sealed off the Coral Spire, D3, D4 and the road to
  the Keep. `tools/check-torches.mjs` proves it end to end; also asserts a
  torch-gated key is never the only key on its floor (defence in depth).
- **iPad / home-screen publishing**: GitHub Pages deploy workflow
  (`.github/workflows/deploy-pages.yml`, gated on `check-build.mjs`), app
  icon/manifest, integer-device-pixel canvas scaling, iOS gesture kills,
  save export/import codes, AudioContext suspend/resume. **Still needs a
  real iPad to verify** — Playwright/Chromium can't reproduce iOS Safari's
  standalone-mode behavior, overscroll/zoom gestures, `window.prompt` inside
  a home-screen app, or a real backgrounding/audio-resume cycle. Check these
  by hand before calling iPad support done.

## What's left, roughly in priority order

1. **The boss-verb work above** — the only thing standing between "every
   model says the game is completable" and an actual proof. See that
   section for the immediate next step.
2. **PT step 5 — the terrain backlog**, ranked in `docs/ART-BACKLOG.md`. The
   `cliff` family is the head of it (the Oracle games build a cliff out of
   several tiles; this game spends one tile on all of it — a content
   decision, not a swap). Water animation is genuinely blocked: no terrain
   sheet in the repo has a second frame.
3. **PT step 4 — populate the towns.**
   `assets/sheets/oracle-seasons-nonhuman-races.png` has never been
   extracted from and holds the Maku Tree, the Great Fairy and townsfolk;
   the scrimshander currently shares a face with the digger. Two small
   town-shaped follow-ups worth doing alongside it: Tidewatch doesn't answer
   the tide visually (looks identical at all three levels), and there's no
   third town legend (marsh/cliff/salt) yet — both are ART-BACKLOG.md items.
4. **P9 steps 1, 2, 4** — the region re-gating (see "Where things stand"
   above). Can start any time; deliberately not first because re-gating a
   finished screen is a small edit and re-towning a gated one is not.
5. **Apply the derived damage ladder** once the boss-verb work makes it
   measurable in a real fight (raising the heart cap was a difficulty change
   even though no enemy damage value moved yet — see `docs/FEEL-SPEC.md`,
   "The cap and the damage ladder"), then re-record the replays against it.
6. Give `d3/0,2,2` Bogmaw Hall a real reward (miniboss currently pays out a
   sentence and nothing else — same bug the Clawcrab Den had, already fixed
   there).
7. **58 stale branches remain on `origin`, none of them should be merged**
   (all superseded by work already on `main` — see `git ls-remote --heads
   origin` for the live list). Branch deletion was blocked by a proxy 403 in
   at least one prior session; worth a five-minute retry, not worth a whole
   session.
8. Known soft spots that are real but not urgent: charm balance (30 charms
   exist, none compared to another), `ANCHOR_RADIUS_TILES`/
   `NEAP_GRACE_FRAMES` need someone to actually play them rather than guess,
   and the art-legibility findings recorded per-dungeon in
   `docs/DUNGEON-STATUS.md` (a successful drain/crossing/lever reads clearly
   on screen; several failure states don't, yet).

## Traps that pass every validator

Full detail and the reasoning behind each is in `docs/HANDOFF.md`'s
hard-won-lessons section. Short list, because each one cost a session:

- A push block moves exactly one tile, ever (`once: true` by default).
- An open dialogue freezes every entity while `mode` is still `'play'`.
- An explicit palette at a draw site overrides a sprite's own.
- A solid tile is never hit by a projectile's own rect.
- An entity dropped from `game.entities` must be marked `remove` first.
- A gate tile sits inside a screen, not on its boundary row.
- `>`/`<` ledge runs are COLUMNS, not rows, and a ledge is solid from three
  sides — a run across a corridor strands rooms and still validates. Use
  `tools/find-ledges.mjs`, never place by eye.
- Digits 0-9 in a room grid are always tide tiles (`src/data/legends.js`).
- A chest can hand over an item that doesn't exist, in total silence —
  `tools/check-items.mjs` is what catches it.
- A tiledef field `registerTiles` doesn't name is silently discarded.
- Adding an entity to an early room re-phases every enemy in the game (ids
  are global, `every()` hashes the id) — re-baselines every replay.
- A counted item used to arrive with an empty pouch; the capacity rule lives
  in `progress.giveItem` now, with the grant — not in any one caller.
- A solid tile two squares away doesn't block a thrown Reefseed, it CATCHES
  it onto the square between.
- **CLOSED, shape kept because it recurs:** a solid entity is solid now
  (`canOccupy` reads `Entity.solid`) — push blocks, chests, torches and
  signposts block the player and can be pushed. Landed in `0b68e6b`.

## Engine-API details a harness gets wrong on the first try

- `main.js` publishes `window.__game` and `window.__harness`. Everything
  else comes from a dynamic import of the live module graph from inside the
  page — every committed harness in `tools/` has worked examples.
- `window.__harness.takeOver()` stops the wall-clock loop; `step(n)`
  advances exactly n fixed updates (how `replay.mjs` gets a deterministic
  clock); `release()` hands it back.
- `enterMap` is `(mapId, FLOOR, rx, ry, px, py, dir)` — floor is the SECOND
  argument; passing `rx` there silently lands you in the wrong room.
- `MAPS` is keyed by map id, room defs under `roomDefs`, grids under `map`.
  Cutscenes export as `STORY_CUTSCENES`.
- Equipped items: `progress.equipB`/`equipA`. `giveItem` is in
  `src/game/progress.js`. `progress.seed` roots every random decision —
  `newProgress(name, seed)` pins it.
- After `room.setTile` you must call `room.invalidate()`.
- Keys: KeyZ = B, KeyX = A (`src/core/input.js`), Enter = START.
- `game.tryPushBlock(tx, ty, dx, dy)` takes the BLOCK's tile, not the
  player's.
- Reset `g.mode` to `'play'` and refill hearts between probes, or the first
  room that kills a parked player drops the run into game over. Park probes
  on a CLEAR floor.
- `newGame` does NOT grant the sword — the intro cutscene does. A probe that
  skips the cutscene must `giveItem(g.progress, 'sword', 1)` itself.
- Reading a feel constant from inside a harness: `await
  import('/src/data/feel.js')` in the page, rather than writing the number
  down in the tool — a hard-coded copy rots the moment the constant moves
  (`check-gates.mjs` had exactly that bug once).
- In this sandbox, Playwright's installed package can mismatch the
  installed browser build; every browser-driving tool needs a fallback to
  `process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium'` on launch
  failure (`test.mjs`'s pattern — every committed `tools/*.mjs` that drives
  a browser now carries it).
