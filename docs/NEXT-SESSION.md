## Boss verb: body-contact damage eliminated, survival ~3x (this session)

**Not a win yet, but a real, measured fix with the actual killer identified.**
Two earlier sessions assumed Gohmaraq's ranged spray was what killed a
3-heart player and spent their time on a reactive per-shot dodge, which
measured net negative and was reverted (full story in
`docs/HANDOFF.md`'s hard-won-lessons, top entry). This session instrumented
`Player.takeDamage`'s own `source` argument directly instead of only
watching hearts drop, in a real (no god-mode) 12-quarter-heart Gohmaraq
fight, seed 20260806 — and the two costliest hits (4 of 24 max hp each,
two-thirds of all damage the player took) were **body contact with the
boss itself**, landed *while `dBoss` was still approaching to swing*, not
from any ranged attack.

**Root cause: `dBoss`'s "close the distance" check used raw manhattan
distance (`adx+ady <= NEAR+6`, NEAR=18) as its stop-and-swing threshold,
and manhattan distance is not a safe proxy for real AABB overlap against
Gohmaraq's asymmetric 26x20 hitbox** — a diagonal approach can already be
touching while manhattan distance still reads 27-30, six-plus pixels past
where the old threshold thought it was safe. The sword's own reach
(`SWORD_REACH+SWORD_GAP`, ~16px from center) never needed the player to get
that close. Fix: raised `NEAR` to 26 in `tools/actor-runtime.mjs`'s `dBoss`.
Measured result, same fight: still 5 melee hits landed (boss 24 -> 14 hp),
**zero body-contact damage** (down from 8 of 12 total qh lost), player
survives to frame 2512 instead of dying at frame 796.
`tools/check-bosses.mjs` unaffected (still 13/13, identical damage numbers —
godmode's unlimited invuln already made contact free either way, which is
why this bug was invisible to that checker for two sessions). `tools/test.mjs`
59/59. Full mechanism written into the code comment above `dBoss` and into
HANDOFF's hard-won-lessons — read the HANDOFF entry before tuning any other
boss's engagement distance, since the fix is measured against Gohmaraq's
specific hitbox, not derived from a general formula.

**Still not a win, and the new bottleneck is now clearly a different
problem than either earlier session chased.** Once Gohmaraq drops below
~62% hp (phase 2), it starts charging almost continuously — a 2000+ frame
trace of the same fight shows `b.charging` true on the large majority of
samples, boss-to-player distance swinging 50-140px as it dashes corner to
corner. `dBoss`'s charge-dodge is unconditionally correct (sidesteps every
charge, no more contact taken), but it never gets an opening to close in
either, so no further melee hits land after the phase-2 transition and the
fight becomes a long war of attrition that the player's own residual
ranged chip damage (the spray, still ~2qh per unblocked hit) eventually
wins. **Next session's job, in order:**

1. **Solve the phase-2/3 near-perpetual-charging problem.** This is the
   actual remaining barrier to a 3-heart win, not ranged chip damage and
   not body contact (both now handled). Options worth measuring before
   picking one: extend the "eye stays open" window logic so an opening
   between charges is actually usable before the next charge starts; check
   whether the charge's own cooldown/range in `charge()`
   (`src/game/enemy.js`) is simply too aggressive for a room this boss's
   size, which would be a design tuning question, not an actor-verb one;
   or accept that phase 2/3 wants a different tactic than phase 1's
   "approach and swing" (e.g. bait a charge into a wall for the dazed
   window the phase-2 comment already promises, then punish that instead
   of chasing).
2. Once Gohmaraq is a measured win at 3 hearts, wire `dBoss` into
   `tools/playthrough-route.mjs` past `d1/0,3,2`, then look at the other
   five bosses — Gloomtide's swimming-blocks-swinging finding in particular
   needs a real tactic (sink with the Cleats first), not this generic verb.
3. The Boss Key / third-key pass behind the Clawcrab door and the other
   five dungeons' routes (see "Where 1.0 actually is" below) are both
   still undone and both still blocked on job 1 actually finishing.
4. **The remote has ~60 stale `claude/*` branches** (`git ls-remote --heads
   origin`), none of them outstanding work — every one here that matters is
   already on `main`. Branch deletion has 403'd from the proxy every time
   it's been tried; if a session gets write access to prune them, it's
   pure janitorial work, not a design decision, but don't spend a session
   chasing the 403 itself.

---

## iPad publishing (recent)

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

1. **A boss-fight verb THAT WINS.** `dBoss` exists in `tools/actor-runtime.mjs`.
   As of this session it lands real hits on Gohmaraq with **zero body-contact
   damage** and survives to frame 2512 of a real 3-heart fight (up from 796) —
   see the top of this file for the fix and the new bottleneck (phase-2/3
   near-continuous charging). It is deliberately NOT wired into the route
   until a fresh-game 3-heart fight actually reaches 0 hp. See
   docs/HANDOFF.md for the false-victory trap it already closed.
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

## Where the rest of the project stands

**P8 (all six dungeons) and PT steps 1-4 (town kit, four town screens) are
done** — see `docs/DUNGEON-STATUS.md`, the authoritative board for dungeon
work, and its own "what no dungeon has yet" section (nobody has played one,
no dungeon balanced against another — same shape as the boss-verb gap above).
The detailed session-by-session history that used to live in this file (P1
through P9.5: feel spec, fixed-point movement, the item roster, scrimshaw,
the eight dungeon themes, the trading sequence, the health-economy cap fix,
title-screen art, the checker collision-model consolidation, the circular
progression-lock fix, three merge audits) is in `git log` on `main` and in
`docs/HANDOFF.md`'s hard-won-lessons — it was pruned from here because it
was pure history nothing still points to, not because it stopped mattering.
If you need the story behind a specific decision, `git log --all --oneline
-- <path>` on the relevant file finds the commit faster than this file's old
prose did.

Still open, carried forward because nothing above has closed it:

- **Nobody has played any of it.** Not a dungeon, not a town, not the
  boss-verb fights past Gohmaraq's phase 1. Every claim in this repo is a
  checker's or a replay's.
- **PT step 5 — the terrain backlog**, ranked in `docs/ART-BACKLOG.md`. The
  `cliff` family is the head of it (the Oracles build a cliff from several
  tiles; this game spends one). Water is genuinely blocked — no sheet in the
  repo has a second animation frame.
- **PT step 4 — populate the towns.** Buildings and doors work; the people
  don't. `assets/sheets/oracle-seasons-nonhuman-races.png` has never been
  extracted from and carries the Maku Tree, the Great Fairy and townsfolk.
- **P9 — overworld re-gating and difficulty.** Inputs satisfied, deliberately
  not started yet (`docs/EXECUTION-PLAN.md` Part 4 puts PT before P9).
- **Charm balance.** Thirty charms work; none has been compared to another,
  and only one is placed in the world by hand.
- **`ANCHOR_RADIUS_TILES` and `NEAP_GRACE_FRAMES`** are design constants with
  nothing to measure them against yet — both are a debug key or one edit
  away from being played and settled.

---

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
- **Manhattan distance is not a safe proxy for AABB overlap** against an
  asymmetric hitbox — a boss-fight verb that "closes to distance N, then
  swings" can walk straight through body-contact range before N is reached.
  See this file's top entry and HANDOFF's hard-won-lessons.

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
- **Health lives on `game.progress.hearts`/`maxHearts`, not on `game.player`.**
  The player entity has no `hearts` field of its own — `takeDamage` reads and
  writes `game.progress.hearts` directly. A harness that watches
  `game.player.hearts` for damage will watch `undefined` forever.
- **`source.isBoss` on the third argument to `Player.takeDamage`** is the
  cheapest way to tell body-contact damage from a projectile's or a hazard's
  when instrumenting a fight — see this file's top entry.
