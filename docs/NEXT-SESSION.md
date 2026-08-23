This file is the forward-looking punch list: what a fresh session should do
next, and just enough context to do it without re-deriving what's already
known. It is **not** the project's history — that split is deliberate and
existed before this cleanup, it just wasn't being honoured:

- **`docs/DUNGEON-STATUS.md`** is the authority on which dungeons are built
  and done, with the commit each landed in. Read it before touching a
  dungeon.
- **`docs/HANDOFF.md`**'s hard-won-lessons section is the permanent home for
  a bug/trap worth not rediscovering. If a session's writeup belongs
  anywhere forever, it belongs there, not here.
- **`docs/EXECUTION-PLAN.md`** is the phase plan (P1–P9, PT) with each
  phase's brief and current status.
- **git log** is the full session-by-session narrative. Nothing is lost by
  not repeating it here — `git log --oneline` and the commit bodies tell the
  story in full, and this file used to duplicate large chunks of it. That
  duplication is what made it 3700+ lines; it has been cut back to current
  state and open work only. If you need the archaeology, the commits have
  it.

Update this file before a session ends — but "update" means keep it
accurate and short, not append another multi-hundred-line session log to the
top. Fold a finished item into "Current state," move real lessons to
`docs/HANDOFF.md`, and let git keep the rest.

---

## Player feedback — five items, one fixed this session (2026-08-22/23)

The player played the game and reported five things. One was root-caused and
fixed in-engine, verified by screenshot; the other four are diagnosed enough
to hand to a session but were not attempted here — each needs either
pixel-art/ripper work, a specific repro, music composition, or an overworld
design decision, none of which fit alongside the others in one pass.

### FIXED: the lifted/carried object floated far above Link's head

Root cause, the fix, and how it was verified are written up in full in
`docs/HANDOFF.md` under "A carried object's height had two owners, and they
both wrote to it" — read that before touching lift/carry code again. Short
version: `Player.updateMovement`'s `carrying.y = this.y - CARRY_HEIGHT` and
`Entity.draw`'s `y - z` were BOTH applying a height offset to a lifted rock
(`Game.liftTile` set the new `ThrownObject`'s `z` to 13, the same value as
`CARRY_HEIGHT`), so the combined lift was 26px, not 13. Fixed by zeroing the
object's `z` in `liftTile` (`src/game/game.js`) — `CARRY_HEIGHT` is now the
sole owner of held height, matching how entity-liftables (pots/bombs already
placed as entities) already worked. `node tools/test.mjs` is 59/59 after.
Commit `2cb9fb2`.

**Left open:** even at the corrected 13px, a screenshot still shows a visible
gap between Link's head and the held object — `CARRY_HEIGHT` is marked
`guessed` in `src/data/feel.js` and was not retuned further, per CLAUDE.md's
rule that `guessed` only becomes `measured` by frame-stepping a real
reference. Worth a look with actual Oracle-series footage of the lift pose.

### NOT FIXED: the sword swing and spin attack don't show a blade

Root-caused, screenshotted, not fixed. `Player.spriteName()` (`src/game/
player.js`) returns `link_sword_<dir>` while swinging and `link_spin_<0-3>`
while spinning; both pull from `tools/rip-link.py`'s `ACT_Y` band
(`link_sword_down/up/side` at `(1086/1103/1069, 69)`, `link_spin_0..3` reusing
the same four coordinates) at a plain 16x16 crop. Screenshotted both in-engine
(forced `player.swinging`/`.spinning`, `#screen.screenshot()`): Link's body
shows a crouched pose with **no blade at all** in either state, confirmed by
eye, not just by reading the crop code.

The engine does layer a separate directional slash arc (`fx_slash_down/up/
side_0/1`, drawn in `Player.draw` at `src/game/player.js:1258-1269`) on top
during `swinging` — but it did not read as a sword in the screenshot either
(the "thin frame" variant is only a few pixels of arc). **There is no
equivalent overlay for `spinning` at all** — spin has nothing drawn but the
bare body pose, which is the more clear-cut half of this bug.

Compare to `link_hold_*` (the charge-up pose), which got the correct
treatment: `sprite-manifest.js`'s `expectedSize` gives it a non-16x16 crop
(`[16,30]`/`[16,28]`/`[28,16]`) specifically because — per that file's own
comment — "the source game draws the extended sword past the edge of his
cell, and cropping it back to 16x16 would remove the sword." `link_sword_*`
and `link_spin_*` never got that treatment; whether the sheet's `ACT_Y` band
actually contains a fuller swing frame outside the current 16x16 crop (the
same way the `hold` band's blade runs past its cell) has not been checked —
that is the first thing to look at with `python3 tools/rip-link.py --dump`
against a wider crop, before assuming new art is needed. If the sheet has it,
extract it per CLAUDE.md's hard rule; only draw a blade by hand if the sheet
genuinely doesn't have one at this pose.

One more concrete lead, found running `node tools/validate.mjs` while
diagnosing this: it warns `sprite 'fx_slash_d0'/'fx_slash_d1' is registered
but not in the manifest`. Those two back the radial (non-directional) slash
`game.spawnEffect('slashD', ...)` fires on every single swing
(`startSwing`, `src/game/player.js:659` — the comment there, "replaced
per-direction below", suggests this call is vestigial next to the directional
`fx_slash_<dir>` draw already in `Player.draw`). `sprites-link.js`'s own
comment on `fx_slash_d0` says this exact gap used to make the effect draw as
a placeholder box before someone added the sprite data without registering it
in `sprite-manifest.js`. Worth checking whether this stray unregistered
effect is still firing, and whether it's worth deleting now that the
per-direction arc exists, as part of the same pass.

### NOT DIAGNOSED: some enemies can't be hit / have no collision box

Reported by the player, not yet reproduced. No specific enemy type or room
was named, so this needs a repro before it can be root-caused — a general
sweep of `src/data/enemies.js`/`bosses.js` didn't turn up an obvious
systemic bug (most entries either declare an explicit `hb` or fall back to
`Enemy`'s default in `src/game/enemy.js`). One real lead worth checking
first: `Player.swordBox()`/`updateSwing()` build the hit rect from `this.cx/
cy` (ground position) with no `z` term, so a flying/hovering enemy whose
sprite draws elevated (`Entity.draw`'s `y - z`) could have its collision
`rect()` sitting somewhere the blade's box doesn't reach even though the
sprite looks adjacent on screen — worth checking against `flying`-tagged
enemies specifically. Next session: get the specific enemy name(s)/room from
the player, or sweep `check-motion.mjs`'s enemy roster against a live sword
swing for each type.

### NOT ATTEMPTED: the overworld has one music track

`grep -c "music: 'overworld'"` across `src/data/overworld.js` and `story.js`
turns up every overworld room and every music-setting story beat pointing at
the same single track. This is a straightforward "needs more tracks and a
per-region assignment" job (`src/data/audio.js` owns the track data; rooms
already carry `legend: 'cliffs'/'wood'/'dunes'/'coast'/'town'/...`, which is
a ready-made axis to key a second or third overworld theme off of) —
composition work, not a bug, and out of scope for this pass.

### NOT ATTEMPTED: no dungeon is gated behind another — progression reads non-linear

`node tools/check-progression.mjs`'s own printed acquisition order shows
**D1, D2 and D5 are all reachable at zero items, from a brand new game** —
three of six dungeon doors are open with nothing but the starting sword and
conch, and D3/D4 open with items from those first three in no particular
forced order either. That is current, working, intentional-per-the-checker
behaviour (Oracle-series games are semi-open too), but it reads to a player
as "nothing is gated," which is what was reported. This is a design
question, not a bug: whether the game wants a firmer critical path (à la the
original Zelda dungeon numbering) or is fine staying semi-open needs a
decision before anyone touches `check-overworld.mjs`'s `GATES` table or
`docs/GAME-PLAN.md`'s progression section — don't regate blind.

---

## Current state (verified 2026-08-23, not just read off old notes)

- **P8 (all six dungeons) is complete.** `docs/DUNGEON-STATUS.md` names a
  commit for each. Nobody has played one to completion in-engine — see
  "the only proof that matters" below.
- **PT (towns): steps 1–4 done, step 5 (the terrain backlog) is what's
  left**, per `docs/EXECUTION-PLAN.md`'s own current status line. The
  `cliff` family is the head of that backlog — the Oracles build a cliff out
  of several tiles and this game spends one tile on all of it. Water
  animation is genuinely blocked: no terrain sheet in the repo has a second
  frame.
- **P9 (overworld re-gating/difficulty): step 3 (health economy) is done** —
  cap is 15 hearts from 24 pieces + 6 Containers, `tools/check-hearts.mjs`
  pins it. **Steps 1, 2 and 4 (region re-gating) are still outstanding** —
  confirmed current via `docs/EXECUTION-PLAN.md`'s own "still outstanding"
  line, not inferred. The one circular-dependency bug in the region gates
  (D4/D6 each behind the other's item) was found and fixed separately —
  `check-overworld.mjs`'s `GATES` table now has four working gates (`bombs`,
  `rod`, `keep`, `dredge`) — but that fix is narrower than P9's own steps 1/2/4
  brief ("the overworld has eight regions gated on items that no longer
  exist... re-gate for six dungeons... re-tune to match the source games")
  and does not close it.
- **The derived damage ladder (heavy 3→4qh, miniboss 3→6qh, boss 4→8qh) is
  recorded but not applied** — confirmed: `src/data/feel.js` has no
  `HEAVY_DAMAGE`/`MINIBOSS_DAMAGE`/`BOSS_CONTACT_DAMAGE`-shaped constants for
  it. It was deliberately held back because every enemy it touches sits past
  where the playthrough harness can currently reach — applying it blind
  would re-open an economy question nobody could measure. See
  `docs/FEEL-SPEC.md`, "The cap and the damage ladder."
- **`docs/GUIDE.md` is stale — confirmed, `node tools/check-guide.mjs` is
  1/4 passing right now**: it doesn't know `tradeStart`/`tradeMid`/`tradeEnd`
  (the Coastwise Chain), is missing three heart-piece placements
  (`cave1/0,0,0`, `cave2/0,0,0`, `d4/0,4,1`), and numbers pieces 1–18 instead
  of 1–24. It must be **regenerated from data**, not hand-patched — see the
  generator's own header.
- **Landed and closed, nothing open**: the Kilnshell (fire/torches item),
  the title screen art, the Coastwise Chain trading sequence, the
  checker-collision-model consolidation (`tools/lib/collision.mjs`), and
  iPad/PWA publishing (`.github/workflows/deploy-pages.yml`, home-screen
  manifest, gesture kills, `storageAvailable()`/export-import save codes).
  Detail on each is in its own commit and, where it mattered, in
  `docs/HANDOFF.md`.
- **53 branches sit unmerged on the remote and none of them should be
  merged** (`git ls-remote --heads origin` to see the live list) — each is
  either superseded work already on `main` or a rival attempt at something
  `main` already has a different, landed answer for. A previous session
  found branch deletion 403s through the proxy; whoever has real push rights
  should just delete the lot after a skim (only `claude/link-sprite-
  progression-issues-rq48b6`, the branch this file is committed on, and
  `main` should survive the cull).

### The only proof that matters, and where it stops

`node tools/check-playthrough.mjs` is the one tool that plays the game
end-to-end with no items granted and no warps — every other checker is a
model. It currently drives **18 of 144 dungeon rooms**, all in D1, and stops
having crossed the Iron Pipe with the Anchor. `tools/actor-runtime.mjs`'s
`dBoss` verb exists, finds a boss, holds the arena and lands real hits
(confirmed still true by reading its own status comment) — **and it does not
yet win**. Nothing else in the repo proves the game is finishable; the rest
prove a part.

---

## What's left, in priority order

1. **A boss-fight verb that wins.** `dBoss` (`tools/actor-runtime.mjs`)
   fights but loses — it's missing per-boss positioning (the slam radius and
   safe side), not timing (`weakOpen` already tells it when to strike).
   Prove it on Gohmaraq (D1's boss) at three hearts, which is what a real
   player brings to D1.
2. **A Boss Key / locked-door pass** for D1's third key behind the Clawcrab
   door, closing D1 end to end under the harness — the template to prove
   before scaling to the other five dungeons.
3. **Route the other five dungeons** through `playthrough-route.mjs`, ~24
   rooms each. Route authoring is the cost, not engine work; expect at least
   one room per dungeon where the checker's named placement doesn't actually
   cross the room (see the Iron Pipe precedent in `docs/HANDOFF.md`).
4. **Regenerate `docs/GUIDE.md`** from data once the route work above
   stabilizes what it needs to describe, and get `check-guide.mjs` green.
5. **P9 steps 1, 2, 4 — the region re-gating**, per `docs/EXECUTION-PLAN.md`.
   Five gates should be tile-flag-shaped so `check-overworld.mjs` can prove
   them both directions; the Brineglass Lens must never be a region gate
   (informational only at that scope).
6. **Apply the derived damage ladder** once job 1–3 make D1's second half
   (and the other five dungeons) measurable, then re-record all replays
   against it.
7. **The four open player-feedback items above** (sword/spin blade art,
   enemy-hitbox repro, overworld music variety, dungeon-gating design
   decision) — each is its own session, see that section for what's already
   known.
8. **PT step 5, the terrain backlog** — ranked in `docs/ART-BACKLOG.md`; the
   `cliff` family is the biggest piece and is a content decision (the
   Oracles spend several tiles on a cliff; this game spends one), not a
   simple swap.
9. Smaller, none blocking:
   - `d3/0,2,2` Bogmaw Hall's miniboss fight pays out one sentence and
     nothing else — give it a real reward, matching every other miniboss
     room.
   - `ANCHOR_RADIUS_TILES`/`NEAP_GRACE_FRAMES` are design constants nobody
     has tuned by playing them — both have debug keys or are one edit away.
   - Charm balance/placement: thirty charms work, none has been compared to
     another, only one is placed in the world by hand.
   - The Lens's ghosted overlay separates shallow/deep/pit water by only
     4–6 RGB units — three candidate fixes are written up in
     `docs/ART-BACKLOG.md`; wants a person holding the button, not another
     table.
   - iPad/PWA items that only a real device can confirm: standalone
     home-screen mode and the apple-touch-icon actually rendering; the
     gesture-kill JS (pinch/double-tap/pull-to-refresh/rubber-band/
     long-press) actually stopping each gesture; `window.prompt`/`alert`
     (used for save export/import codes) behaving inside a fullscreen
     home-screen app; audio resuming after real backgrounding, not just a
     `visibilitychange` event firing; the actual GitHub Pages URL once Pages
     is enabled in repo settings.

---

## Traps that pass every validator

These are in `docs/HANDOFF.md` in full. The short list, because each one
cost a session:

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
- **A carried object's height has exactly one owner, `CARRY_HEIGHT` via `y`.**
  Giving it a second one via the entity's own `z` field doubles the offset
  silently — no error, the object just floats twice as high. See
  `docs/HANDOFF.md`, "A carried object's height had two owners."

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
- Several browser-based checkers (`replay.mjs`, `walk-dungeons.mjs`,
  `solve-switches.mjs`, `check-gates.mjs`, `check-playthrough.mjs`) can fail
  to launch a browser in a sandboxed environment where the installed
  Playwright package doesn't match the installed browser build.
  `test.mjs`/`check-build.mjs` already fall back to
  `/opt/pw-browsers/chromium`; the others may need the same fallback added
  temporarily to run in such an environment.
