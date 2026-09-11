# Prompt ledger — settled ground

This file holds everything already decided: what has landed, what was tried
and rejected, and what is known and deliberately left alone. **Read only the
section for the area you are about to touch, never end to end.** It is not a
briefing document and it is not meant to be read in order.

If anything here contradicts `docs/NEXT-SESSION.md` or `docs/ART-BACKLOG.md`,
those two win — they are the authoritative, continuously-updated record and
this file is assembled from them. A new negation belongs here, appended to
the relevant section, not folded into `docs/prompts/NEXT-PROMPT.md`.

---

## Landed — do not rebuild

| Thing | Session | Where the account is |
|---|---|---|
| Dungeon mouths widened; `check-exits.mjs` proves every interior can be walked out of | S33 | `docs/NEXT-SESSION.md` S33; `docs/DUNGEON-STATUS.md` "ALL SIX MOUTHS WERE WIDENED IN S33" |
| D1 and D2 played end to end in the real engine, not modelled | S19 (D1), S41 (D2) | `docs/DUNGEON-STATUS.md` "D1 AND D2 ARE PLAYED, NOT MODELLED"; `docs/NEXT-SESSION.md` S28, S40, S41 |
| Land/land ground fringes — every land/land pair interlocks along a composited edge instead of a hard pixel cut | S39 | `docs/ART-BACKLOG.md` item 1; `docs/prompts/NEXT-PROMPT.md`'s old item 4 (now retired) |
| `check-dungeon-strands.mjs` — the dungeon equivalent of `check-strands.mjs`, sharing `tools/lib/dungeon-flood.mjs` with `walk-dungeons.mjs` | S42 | `docs/NEXT-SESSION.md` S42 |
| `ending` wired to `Game.claimEssence` — nothing had ever called `startCutscene('ending')` before this | S43 | `docs/NEXT-SESSION.md` S43; `tools/shoot-cutscene.mjs --ending` |
| Item art extraction: rupees, bomb drop, heart/heart piece, fairy, six Essence bells; `tools/check-rippers.mjs` added to enforce "never hand-edit a generated file" | S34-S36 | `docs/ART-BACKLOG.md`; `docs/NEXT-SESSION.md` S34-S36 |
| Boss-fairness sweep measured fresh: D1/D3/D4 confirmed fair (D3 and D4 newly so), D2's floor-number death explained as expected, Nereth's old "wins at 11 hearts" root-caused as no longer reproducing, Rootmaw flagged as a new open question | S45 | `docs/NEXT-SESSION.md` S45; `docs/DUNGEON-STATUS.md` "Boss winnability, measured" |
| Tideshade Hall (D6) widened to the game's first `2x2` room | S46 | `docs/NEXT-SESSION.md` S46; `docs/DUNGEON-STATUS.md` D6 section |
| `dTravel`'s non-anchor-cell gap fixed in `tools/actor-runtime.mjs` (`window.__roomKeyAt` + a same-room short-circuit) — proven with a scratch harness showing the old code walked into the WRONG room (923 frames) and the fix lands correctly (5 frames). **Now spliced into the committed `playthrough-route.mjs` (S48)** — Reefguard Hall's return leg and Spire Ascent's exit leg both use a single `travel` call in place of their old manual `goto`/`exit` workaround. Anemos's fight timing DID shift (the route is 721 frames shorter) and was re-swept against the real route, per S40/S41's own method: the old `wait: 220` happened to still pass but sat on an isolated single-frame win with losses on both neighbours; `wait: 212` was found instead, in the middle of a 7-frame stable band (207-213) with a comfortable 13/20 quarter-heart margin | S47 (fix), S48 (spliced in) | `docs/NEXT-SESSION.md` S47, S48 |
| `dBoss`'s retreat-branch bug (Nereth and Rootmaw losing to the harness actor) fixed for Nereth — a `safeWhenOpen: true` spec field on `anemos` and `nereth` in `src/data/bosses.js`, read by `dBoss` instead of blindly relaxing the `b.stun > 0` check for every boss (S49's attempt did that and regressed D1). Zero regressions: D1/D3/D4/D5 measured byte-identical to before, D2 flips from a loss to a clean win, D6 (Nereth) goes from 6 of 80 damage dealt to 78 of 80 (very close, not yet a win). Anemos's `wait` re-swept again (`dBoss` itself changed, which moves a frame-phase tune the same way a route change does) — `wait: 216`, an 8-frame unbroken winning streak (213-220), 14/24 quarter-heart margin. Rootmaw (D5) is untouched by this fix on purpose — it doesn't have `safeWhenOpen` and its own failure is a different, still-undiagnosed mechanism (S45) | S49 (tried, reverted), S50 (landed) | `docs/NEXT-SESSION.md` S49, S50 |
| Rootmaw (D5) diagnosed AND fixed in the same session. Diagnosis: S51's `evade`/`noContact` hypothesis disproved (Rootmaw never reaches his mobile phase in the losing fights; `evade`'s swap rate against him is statistically level with its rate against a boss the actor wins cleanly). Real mechanism: his own 'drink' attack forces the tide to HIGH, and unlike every other shelled boss he has no reopen channel independent of the tide field, so the first successful drink is a one-way lock only the conch undoes. Fix, two spec fields on `rootmaw` in `src/data/bosses.js`, both read by `dBoss`: `tideEscape: LOW` (press the conch once the boss has sat locked shut long enough, only when the next conch cycle actually lands on LOW) breaks the lock; `safeWhenOpen: true` (withheld from him at S50 on a premise this session found false) stops the actor oscillating short of sword range against his continuous fire once reopened. Measured: seed sweep 0 of 6 winning -> 4 of 6 (one photo finish, one still-losing seed traced to a pre-existing, unrelated `gel`-contact bug, not this fix). Zero regression: D1/D2/D3/D4/D6 byte-identical to the pre-S52 baseline, `check-bosses.mjs` 19/19, `check-playthrough.mjs` 21/21, `replay.mjs` 51/51, `test.mjs` 83/83 | S52 | `docs/NEXT-SESSION.md` S52 |
| `tideEscape` generalized to a FUNCTION form for Nereth (D6), closing S52's own "still open" item — `nerethPin` now records its own `level` argument onto `e._pinLevel` every time it runs (cleared in `onPhase` for phase 4, which has no pin), and `nereth`'s spec reads `tideEscape: (e) => e._pinLevel`. `dBoss` (`tools/actor-runtime.mjs`) dispatches on `typeof spec.tideEscape`: a constant (Rootmaw, unchanged) still checks "does the next cycle step land ON the target"; a function (Nereth) checks "does the next cycle step land OFF the level it currently returns" — a materially different comparison, per the prompt's own warning, not a copy-paste. **Measured result: inert, on purpose, and that is the finding.** The naive version (no extra gating) DID fire — but only ever during each fight's first shut window, before Nereth's own first attack had even landed a shot, and it was pure RNG-cascade noise from the 46-frame conch freeze: seed-swept, it flipped 3 losing seeds to wins and one clean win (seed 1, 80/80) to a loss (66/80) in the same run, with no causal safety story behind either direction. Rather than land noise, two real gates were added to `dBoss`: `hasOpened` (the function form may only fire after the boss has been seen open at least once — a boss that has never opened has not necessarily locked, it may just not have reached its first attack yet) and a `FUNCTION_ESCAPE_RANGE` (72px) distance requirement scoped to the function form only (the constant form does NOT get this gate — Rootmaw's mobile final phase never lets `evade` open a 72px gap on its own, measured directly at 282 frames sitting "ready" between 14-54px, so requiring distance there reproduces his exact S52 loss by simply never firing; Nereth's press is pre-emptive against a lock that clears itself on a timer regardless of the player, so there is no equivalent cost to waiting for safety). With both gates: **D6 is measured BYTE-IDENTICAL to the pre-fix baseline across the full seed sweep** (default 78/80 32qh loss; seeds 1/2/3/4/5 matching exactly) — the escape verb never fires under real play because Nereth's own attack-triggered reopen already covers every case it exists to rescue, confirming S52's own prediction ("very likely why Nereth already measures at 78 of 80 without any conch verb at all") rather than disproving it. Zero regression: D1-D4 byte-identical, **D5 (Rootmaw) reproduces S52's exact documented numbers seed-for-seed** (1/4/5 clean wins, seed 2 a 52/52 photo finish, seed 3 still loses to the pre-existing `gel`-contact bug), `check-bosses.mjs` 19/19, `check-playthrough.mjs` 21/21, `replay.mjs` 51/51, `test.mjs` 83/83 | S53 | `docs/NEXT-SESSION.md` S53 |
| D5 Rootmaw's `gel`-loop (S52's own "still open" item, and the subject of S54-S56's three reverted attempts at a `hazards()`/`evade()` shared-machinery fix) closed with a boss-specific spec field, `rootmaw.spec.breakDeadlock`, the same shape as his existing `tideEscape`/`safeWhenOpen`. **The real mechanism, found by tracing positions frame by frame rather than reusing S54's velocity hypothesis**: Rootmaw's arena has exactly one exit (a single floor tile in an otherwise solid wall), and a `gel` parked there turns `evade`'s eight-candidate swap into a genuine deadlock — every candidate is either wall-blocked or hazard-vetoed, so the actor freezes at the EXACT SAME PIXEL for 400+ consecutive frames taking chip damage, measured directly. `dBoss` now tracks how long the player's position has gone unchanged and, past a 30-frame window, lets the move through the arena fence without `evade`'s hazard veto — contained entirely inside `dBoss`, gated by a spec field only `rootmaw` declares, so it cannot reach any other boss's fight by construction. **The named freeze is genuinely gone** (verified: no more static-pixel stretches; seed 3's contact-hit count drops from 23 of 24 hits to 14 of 20) but **seed 3 still loses overall** — the fight now runs longer and Rootmaw's own `zol` summons accumulate faster than the actor closes distance, a separate, undiagnosed problem. Full 6-seed sweep: 4 of 6 winning, UNCHANGED in aggregate (default/seed2/seed4/seed5 byte-identical to the pre-fix baseline via direct `git stash` comparison; seed1 within 1 quarter-heart; seed3 still a loss but a different, less concentrated one). Landed anyway on the project's own `noContact` precedent — closes a real, previously-named bug at zero cost elsewhere, even without flipping the aggregate count. Zero regression: `check-bosses.mjs` 19/19, D1/D2/D3/D4/D6 byte-identical at default seed, `check-playthrough.mjs` 21/21 (D5 isn't on its route), `replay.mjs` 51/51, `test.mjs` 83/83. `dist/` rebuilt and `check-build.mjs` reconfirmed | S57 | `docs/NEXT-SESSION.md` S57 |
| D5 seed 3's remaining loss (S57's own "still open" item) root-caused AND closed: Rootmaw's own `zol` summons split into two `gel`s apiece on death (`src/data/enemies.js`), and the resulting swarm gives `evade` a hazard to dodge on nearly every frame without ever repeating an exact pixel — S57's `stuckFrames` check legitimately never trips, but the actor still made zero progress (boss `hp` flat for 1540 consecutive frames). Confirmed by direct experiment, not inference: a scratch harness that drops `zol`/`gel` spawns the instant they're created turns the same seed into a clean 1120-frame win. Fix extends the SAME `breakDeadlock`-gated block in `dBoss` (`tools/actor-runtime.mjs`) with a second counter, `stallFrames`: tracks the best (lowest) Manhattan distance to the boss seen while actively closing (`target.weakOpen && !retreat` only — never during a deliberate retreat or a shelled wait), and past 60 frames without real (>2px) improvement, lets the move through the fence without `evade`'s veto — the same escape `stuckFrames` already used, reached by a more general road, no new spec field. Full 6-seed sweep: 4 of 6 -> 6 of 6 (seeds 2 and 3 both flip to clean wins). Widened sample (seeds 6-10): 2 of 5 -> 3 of 5 (seeds 9/10 still lose, but 40->48 and 28->52 of 52 boss damage dealt — named as a genuinely separate, undiagnosed remainder, not chased further this session). Zero regression: `git stash` A/B on the full D1-D4/D6 x 6-seed grid (30 fights) matched every outcome; direct byte diff on D1's default seed and D3's seed 3 both identical. `check-bosses.mjs` 19/19, `check-playthrough.mjs` 21/21, `replay.mjs` 51/51, `test.mjs` 83/83. `npm run build` re-run; `dist/` did NOT change (the whole fix is in the test harness, not `src/`) and was correctly left uncommitted | S58 | `docs/NEXT-SESSION.md` S58 |
| D4 Wyverna's apparent "5 of 6 seeds, plus one that never finishes" was a measurement-tool artifact, not a fairness gap. Seed 3 timed out at `measure-boss-combat.mjs`'s old 9000-frame default with an EMPTY damage log (zero hits taken the whole run) — a slow, perfectly safe fight, not a stuck or losing one. Re-run at `--budget=20000`: clean win, 44 of 44, frame 13220, 14 of 24 quarter-hearts spent. Tool default raised 9000 -> 18000 (comfortable margin); re-swept all six dungeons at the new default and every other seed's outcome and frame count is unchanged (all finish well under 9000 already). `measure-boss-combat.mjs` is explicitly not a checker (own header: "asserts nothing and always exits 0", not in CLAUDE.md's verification table), so this cannot loosen any gate — it only stops the tool misreporting a slow win as unresolved. **D4 is 6 of 6 on the standard sample, same as D1 and D5.** Full roster re-measured fresh in the same session (all six bosses, standard 6 seeds): D1 6/6, D2 3/6, D3 1/6, D4 6/6, D5 6/6, D6 1/6 | S59 | `docs/NEXT-SESSION.md` S59 |
| D6 (Nereth)'s wall-freeze CLOSED, at the fifth attempt, by fixing the room instead of the actor. Four prior sessions (S62-S65, see "Measured and rejected" below) tried to fix the retreat AI itself and all failed for the same underlying reason: the arena genuinely did not have enough floor for a straight-line retreat to clear before hitting a wall, so no movement-layer fix could win without trading one seed for another. S66 measured that every one of the standard 6 seeds — wins included — freezes at the identical local pixel (139,105, flush against the room's own east wall) starting at frame 480, before any seed's RNG has diverged, confirming the room itself as the actual constraint. Fix: widened Nereth's room (`'1,3,1'`, `src/data/dungeons-b.js`) from a single 10x8 screen to `size:[2,1]` (20x8) — door left byte-identical at local columns 4-5 so Keep Gate's own matching gap still lines up, new east half fully walled (and doubly safe against Crossed Shafts below it, whose own north wall is already solid regardless), tide-pool decoration mirrored onto the new wall, Nereth's spawn recentred from `(4,2)` to `(9,2)`, the death heart-container pickup recentred from pixel `(80,40)` to `(160,40)`. **This makes Nereth's the only boss room in the game bigger than one screen** — a deliberate, user-confirmed trade against the "every boss fight is one static screen" convention every other fight (and the source games) keep, made because four movement-layer attempts had already failed for a structural reason no fifth variant could address. Measured: D6 1 of 6 -> 3 of 6 winning (default and seed5 flip losses to wins, seed1 stays a win, seed2/3/4 stay losses), **zero seeds that were winning flip to losing** — the first attempt at this specific mechanism to clear this project's own per-seed bar in five tries. Full validation: `validate.mjs`, `walk-dungeons.mjs` (still 26 rooms), `check-dungeon-strands.mjs` (no new stranded region), `check-placement.mjs`, `check-ground.mjs`, `check-wide-rooms.mjs` (10 wide rooms now), `check-camera.mjs` (10 rooms bigger than the view now, follows correctly), `check-bosses.mjs` 19/19, `check-motion.mjs`, `check-overworld.mjs`, `check-gates.mjs`, `solve-switches.mjs`, `test.mjs` 83/83, `replay.mjs` 51/51, `check-playthrough.mjs` 21/21 (D6 isn't on the route — confirms zero effect on D1/D2), D1-D5's full 6-seed sweep re-measured and matching the documented roster exactly. `npm run build` + `check-build.mjs` reconfirmed OK. **Still open: D6 is 3/6, not 6/6** — seed2/3/4 still lose to a presumably RNG-dependent cause this session did not trace | S66 | `docs/NEXT-SESSION.md` S66 |
| `Enemy.spriteName()` (`src/game/enemy.js`) reads `spec.hurtFrame` while `flicker > 0`, the same mechanism `Boss.spriteName` already used — an ordinary enemy can now show a real flinch pose. **A `hp: 1` enemy can never show one in real play**, and this is the reusable part: `Entity.hurt()` sets `flicker` and calls `die()` in the same synchronous call when a hit is lethal, `die()` sets `remove = true`, and `game.js`'s update loop filters removed entities out before the next draw — so `gel`/`keese` (both `hp: 1`, and the base sword already deals 2) die on the exact hit that would have shown their flinch. The three `hp: 999` "unkillable" enemies (`bubble`/`beamos`/`barnacle`) are worse, not better: their `shield: 'all'` makes `Enemy.hurt()` return `false` before ever calling `super.hurt()`, so `flicker` is never set at all — nothing they take is a "hit" the engine can flinch from. A `hurtFrame` is only ever reachable on a species with `hp >= 3` (survives one base-sword hit) and no all-directions shield; `wisp` (`hp: 3`) is the first and, as of this session, only one wired, verified with a real `e.hurt()` call in a live page rather than by inspecting the code alone. Landed alongside `src/data/sprites-enemy-hurt.js`, a NEW hand-authored file (never touch generated `sprites-enemies.js`) for the one sprite this needed (`wisp_hurt`) — the enemy sheet's 344 detected boxes were surveyed and none is a second pose for any of the 22 species; only bosses ever got a drawn recoil frame in the source games, ordinary enemies rely on the invincibility flicker alone. Wired through `src/data/index.js` (`SPRITE_PACKS.enemyHurt`, `installEnemyHurtSprites()` after `installEnemySprites()`), `src/data/sprite-manifest.js` (`REQUIRED_SPRITES.enemyHurt`), and `tools/shoot-sprites.mjs`'s `SPRITE_FILES` list, the same three places every other hand-authored sprite pack in this repo is wired. `check-drift.mjs`'s enemy-roster metric (reads `hurtFrame:` directly out of the `defineEnemy` spec block, independent of which file supplies the art) now reads `wisp walk,hurt`. Zero regression: `validate.mjs`, `test.mjs` 83/83, `check-rippers.mjs` 17/17, `check-motion.mjs` 8/8, `replay.mjs` 51/51, `check-playthrough.mjs` 21/21, `check-build.mjs` OK. **File renamed in S77 (below) to `sprites-enemy-states.js` / `ENEMY_STATE_ART` / `installEnemyStateSprites`, and the pack renamed `enemyStates`, once it held a death pose too — every name in this paragraph ending in `Hurt` or `-hurt.js` is the pre-S77 name.** | S76 | `docs/NEXT-SESSION.md` S76 |
| `Enemy.die()` (`src/game/enemy.js`) now supports `spec.deathFrame` the same way `Boss.beginDeath` holds a boss on a pose before it actually dies, but with a narrower, safer shape found only after the obvious one regressed a replay. **The obvious shape — defer the whole `Entity.die()` call, mirroring `Boss.beginDeath` exactly — measurably broke `tools/replay.mjs`:** `d1-descent`'s baseline diverged at frame 1200 because deferring `onDie` deferred the RNG draw `game.rollDrop` makes to pick a loot table entry, pushing that one draw past a recorded checkpoint frame with nothing about the actual fight changed. **Landed shape instead:** `super.die(game)` runs immediately and unconditionally — `dead`, the loot roll, the 'puff' effect, the kill count via `game.onEnemyDefeated`, all at the frame the kill actually happened, byte-for-byte what every enemy without a `deathFrame` still does — and only `this.remove` is set back to `false` afterward for a species with `deathFrame`, holding it in `game.entities` (but already `.dead`, which is what every actual gameplay check — `src/game/player.js`'s sword/spin/contact/interact checks, `src/game/entity.js`'s solid-collision check, `src/game/game.js`'s two room-clear checks — reads, never array presence) for `ENEMY_DEATH_FRAMES` before `update()` finally sets `remove = true` directly. **The general lesson, not just this one bug:** when copying a "hold before really dying" pattern from `Boss`, the question is not "does this look like Boss's shape" but "which of `die()`'s side effects are ORDER/TIMING-sensitive against a replay tape" — here that was exactly one flag (`remove`) out of five things `die()` does, and the other four had to fire on schedule. Landed on `gel` (`hp: 1`) — chosen BECAUSE every hit is lethal, the mirror image of `hurtFrame`'s own `hp >= 3` requirement (S76, above) — with a squashed-splat `gel_death` sprite in the file S76 created (renamed `sprites-enemy-states.js` in this same session). `check-drift.mjs`'s own death-detection was changed from sprite-key naming (which could never see a hand-authored file's key) to reading `deathFrame:` from the spec, mirroring how `hurt` already worked; now reads `gel walk,death`. Verified with a real `e.hurt()` call in a live page: `dead`/`dying` both true and `remove` false one frame after a lethal hit, entity confirmed actually gone 20 frames later. Zero regression once the fix above landed: `validate.mjs`, `test.mjs` 83/83, `check-rippers.mjs` 17/17, `check-motion.mjs` 8/8, `replay.mjs` 51/51 (`d1-descent` re-recorded, diff read in full first — all 115 checkpoints matched except the one predicted transient), `check-playthrough.mjs` 21/21, `check-bosses.mjs` 19/19 including D5 Rootmaw's `zol`/`gel` swarm fight (S57/S58), `check-build.mjs` OK | S77 | `docs/NEXT-SESSION.md` S77 |

---

## The gear sheet is spent

The 37-cell gear-sheet survey is complete and there is nothing left to
extract from it:

- All 37 cells are named in the table at the top of `docs/ART-BACKLOG.md`.
- Of the 29 unextracted cells, 28 are Oracle items this game does not have
  by design (feathers, capes, boomerangs, hooks, flutes, rings, bracelets).
- The one cell that looked shared, r5c5, was extracted, rendered against the
  hand-drawn bottle, and **rejected**. Do not redo it.
- The held-item and projectile strips were called "the largest extraction
  target in the repo" by an earlier note. Surveyed in S37 and found spent:
  the held sword poses are already extracted (`link_hold_*`, `rip-link.py`),
  the coloured bars are enemy-only sword-beam projectiles this game's player
  never fires, the boomerangs/slingshots/seeds are items we do not have by
  design, and the hookshot head and chain are the Dredge Line's, already
  extracted. There is nothing left on that sheet to take.
- The Maku Tree (`oracle-seasons-maku-tree.png`) is not a simple art swap.
  It is ~169x96px drawn into its screen's tilemap; `npc_maku` is a 16x16 NPC.
  Treating it as an extraction job undersells it — it is a screen redesign.
- The second, white-plate icon set (the pause-menu presentation of the same
  icons) is genuinely unexamined but low priority — worth a look only if the
  menu's own plate style ever changes.

---

## Measured and rejected

- **Giving `hazards()` (`tools/actor-runtime.mjs`) real velocity for chasing
  (non-projectile) enemies instead of the `vx:0, vy:0` it always handed
  them** — S54's original idea for D5 seed 3's `gel`-loop, and S55/S56's two
  follow-on attempts to salvage it (route-wide, then scoped to `dBoss`
  alone). **All three tried and reverted; do not re-attempt either shape.**
  Applied unconditionally it breaks `check-playthrough.mjs` outright (a
  route-wide frame-phase drift that eventually kills the scripted actor in
  an ordinary D2 room, S55/S56); scoped to `dBoss` alone it protects the
  route but regresses D1's own boss fight from a 6/6 win rate to 3/6 (S56).
  The mechanism in both cases: giving `hazards()` real velocity for even one
  secondary entity shifts the exact frame sequence of whatever it touches,
  which collides with absolute-frame-based attack/AI timers elsewhere in
  the engine — a coin flip, not a monotonic improvement, wherever it reaches.
  **The bug this was chasing (D5 seed 3's `gel`-loop) is landed anyway, by a
  completely different, boss-scoped mechanism — see the "Landed" table
  above (S57).** Full account: `docs/NEXT-SESSION.md` S54 (the fix), S55
  (the route-wide drift), S56 (the scoped attempt and the D1 regression),
  S57 (the actual landed fix and why `hazards()`/`evade()` turned out not
  to be the right place for it at all).
- **Giving Nereth (D6) `rootmaw.spec.breakDeadlock` directly, unchanged, on
  the theory his phase-4 near-miss loss (boss `hp` stuck at 2 of 80 for 400+
  frames while the player dies to accumulated chip damage) is the same
  "swarm defeats `evade`'s hazard veto" shape S58 just fixed for Rootmaw**
  (S59). It is not a free transplant: Rootmaw is stationary in the phases
  that matter; Nereth actively `chase`s the player the entire final phase.
  Measured, full 6-seed sweep: default 78->66 of 80 (worse), seed1 flips a
  clean WIN to a loss (72/80), seed2/4/5 unchanged, seed3 flips a loss to a
  win (80/80). Net: one win gained, one win lost, two fights measurably
  worse — fails this project's own zero-regression bar (turning any prior
  win into a loss is disqualifying on its own). Reverted in full; `src/
  data/bosses.js` unchanged. **Do not retry this exact transplant** — a
  fix proven safe against a boss that never moves is not proven safe against
  one that closes distance on its own; it needs a materially different
  safety condition (e.g. checking the bypassed direction doesn't walk the
  player into whatever is chasing them) before it is worth measuring again.
- **The pause menu's item grid being covered by the description panel.** Not
  real: only 14 items are `equippable`, the grid is five columns, so it is
  never more than three rows and never reaches the panel at y=106. Verified
  with every item granted.
- **A "regular pitch" checker for terrain art.** Period 8 is universal and
  correct (a 16x16 tile is four 8x8 hardware tiles); at sub-8 the old ladder
  `waterS` and the perfectly good `waterD` both score 50%. It cannot
  discriminate. The real difference is contrast and whether the repeat forms
  a continuous line.
- **Replacing `waterD`.** Every dark-blue seamless water on both overworld
  sheets is more banded than ours. The hand-drawn tile beats the source here.
- **Depth-discontinuity checks.** Dry adjacent to deep is 2,095 cells at high
  tide and is simply what a coast is without a beach.
- **The `rip-terrain.py` hue-blind quantiser.** Still unfixed, but it now
  changes only `bankCornerSE` and its three rotations, which nothing draws.
  Moot; if it ever matters again, re-examine the `GROUND_MERGE` overrides in
  the same pass (one was a workaround for this exact bug).
- **The 8 bank tiledefs in `validate`'s unreachable list.** Correct and
  deliberate — that warning is for "a vocabulary waiting for a place", its
  own words. Do not delete them to clear it.
- **The sword's swing arc as a uniform rotation.** `SWING_START_DIR`/
  `SWING_END_DIR` in `src/game/player.js` are deliberately not one: facing
  left is the mirror of facing right, so both go over the shoulder and
  finish at the ground. Rotating them uniformly makes Link scoop upward
  facing right. This was tried and photographed.
- **The title screen.** It says THE LEGEND OF ZELDA — ORACLE OF TIDES in the
  Oracle series' own layout, on purpose. A previous session stripped it by
  misreading Goal 2 as a rule about names rather than about design. Do not
  "fix" it — see CLAUDE.md's own warning on this.
- **A wall-aware `dBoss` retreat fix for D6 (Nereth)'s "shelled: wait out the
  tell" freeze — four separate shapes across S62-S65, all rejected.**
  **Eventually closed anyway in S66, from the ROOM side instead of the
  movement layer — see the "Landed" table above.** Widening Nereth's arena
  removed the precondition (not enough floor for a straight-line retreat to
  clear before hitting a wall) instead of patching the symptom, and landed
  clean (1/6 -> 3/6, zero regressions) on the first attempt at that angle.
  The four rejections below are still the correct reason NOT to try a fifth
  `dBoss`/`fence`/`evade` variant — that lever really is exhausted — but do
  not read this entry as "D6's freeze is unsolved": it isn't, anymore. The
  freeze itself: Nereth's arena has a genuine interior corner, the retreat
  direction is computed once from pure geometry and never checked against
  real wall collision, and once a hazard exists `evade`'s own cost search can
  freely re-select the wall-blocked direction anyway (it has no concept of
  walls) — this diagnosis is SOLID and not in question. Every attempt to fix
  it: (1) S62, an ungated per-frame `canOccupy` override on the retreat
  branch — flipped D1's clean win to a death and made D6 uniformly worse.
  (2) S63, the same check gated behind a 30-frame accumulated-stall counter
  and handed to `evade` as a pre-chosen base directive — zero regression, but
  measured completely INERT (`evade`'s own hazard search silently swapped
  back onto the wall the instant a real hazard existed). (3) S64, folding the
  wall check into `fence` itself so `evade`'s hazard search can only ever
  land on a wall-real candidate — genuinely changes the fight for the first
  time (seed3 flips a loss to a win), but seed1 flips a clean win to a loss;
  net aggregate unchanged, and turning any winning seed into a loss is
  disqualifying on its own regardless of what else improves. (4) S65,
  independent rebuild of S64's exact shape, confirming the same win/loss
  pattern and then tracing seed1's flip to ground: at the exact frame the
  fix's wall-check activates, it correctly eliminates the one dishonest
  "cheap" candidate (moving into the wall) and leaves three genuinely
  walkable options that score IDENTICALLY under `moveCost`'s own arithmetic
  — `evade`'s existing keep-based tie-break (shared by every boss) picks the
  same direction the UNFIXED freeze eventually stumbles into anyway, just
  about 70 frames sooner, and that timing shift alone (not a wrong choice)
  is what reshuffles the rest of the fight. **There is no narrow fix here —
  the divergence is the fix correctly doing its job, not a defect in it.**
  The only remaining lever is `evade`'s shared cost/tie-break function
  itself, which is NOT boss-scoped (every boss fight runs through it) and
  would need the full 36-seed zero-regression bar `docs/prompts/
  NEXT-PROMPT.md` already sets aside as a separate, larger undertaking — not
  a fifth variant of this same movement-layer idea. **Do not re-attempt a
  `dBoss`/`fence`/`evade` movement-layer fix for this specific freeze** — the
  room-level fix (S66) already closed it, so there is nothing left in
  `actor-runtime.mjs` for this exact bug to fix. Full account:
  `docs/NEXT-SESSION.md` S61 (diagnosis), S62, S63, S64, S65 (all four
  rejected movement-layer attempts), S66 (the room-level fix that landed).
- **S43's four story questions.** Does Nereth's motivation in `nerethIntro`
  pay off in `ending`? Yes, loosely — the ending's "boring, isn't it" line
  about the tamed sea echoes Nereth's own "the sea was told what to do...
  never once asked". Do the six Essence title cards name six distinct ideas
  matching their own dungeons? Yes — Shallow/Coral/Bog/Cliff/Drowned/
  Drowned King's Bell map 1:1 onto Grotto/Spire/Sanctum/Cistern/Shrine/Keep,
  each a different kind of story beat. Do townspeople's two-state lines
  track world progress coherently? Yes, and better than coherent — a real
  thread ("restoring the tide to order is not unambiguously good news")
  runs through `reefFisherAfter`, `fisher1After`, `salterElderAfter` and the
  `ending` cutscene itself. Is the Coastwise Chain a story or a fetch quest
  with a proof attached? A story — all eleven links have writing specific to
  who each trader is, not generic hand-offs. None of the four found a bug;
  full accounts are in `docs/NEXT-SESSION.md` S43.

---

## Known and deliberately unfixed

- **Two S27 shore edges remain unfixed**, if a session is in there anyway: a
  water cell one tile wide with land on both opposite sides shows the rim on
  only one of its two facing edges (`tileEdgeArt`'s "opposite pair" degrade
  — would need `up+down`/`left+right` in `EDGE_ART_KEYS`); and salt flats,
  ice floors and reef/abyss water were never audited for whether they want a
  rim of their own.
- **Nereth (D6) is 3 of 6, not 6 of 6 — see the Landed table's S66 row for
  the wall-freeze fix (closed) and `docs/NEXT-SESSION.md` S67 for the three
  remaining losses (traced, not fixed: seed3 is RNG variance in engagement
  efficiency, seed2 takes contact damage during one of Nereth's own
  designed extended-open windows, seed4 loses by 8 of 80 boss-hp in the
  phase-4 finale — three different shapes, no shared cause and no safe
  narrow fix identified yet).** `docs/prompts/NEXT-PROMPT.md` names the
  best-scoped next step.
- **The replay baselines predate `beaten`/`heartPieces`.** Eleven files live
  in `tools/replays/`; only some carry those fields, and `diffState` only
  walks keys a baseline HAS, so the rest go unchecked. Re-record
  deliberately on a known-good tree, reading each diff — a wholesale
  re-record is how a regression gets blessed.
- **Three unused dungeon sheets** (`dancing-dragon`, `explorers-crypt`,
  `poison-moths-lair`). Read `assets/sheets/README.md` first: every sheet is
  two halves, the LCD half is the lighter/less saturated one, and picking
  from the wrong half gives art that will not sit with anything else.

---

## Doc rot found, not yet fixed

Verified against the current tree while writing this ledger. Fold these into
the next overworld/gates session rather than opening a dedicated one.

**All four items below were resolved in S60** — three fixed, one found to be
a false alarm. Kept here (rather than deleted) as the record of what was
checked and why; see `docs/NEXT-SESSION.md` S60 for the full account.

- ~~`src/data/overworld.js` lines 9-18 still name Roc's Feather, Power
  Bracelet, Zora's Flippers, Bombs, Hookshot and Magnetic Gloves as region
  gates~~ — **fixed, S60.** Rewritten to the real current gate table (Bombs,
  Resonance Rod, Dredge Line, the Maku Tree's story flag), mirroring
  `tools/check-overworld.mjs`'s own already-accurate header.
- ~~`GAP_HOP_MAX_SPAN` (`src/data/feel.js:1127`) ... the documented "Coral
  Reef: 1-tile deep gaps -> Roc's Feather" gate in `overworld.js` gates
  nothing~~ — **fixed, S60**, folded into the same `overworld.js` edit
  above. Confirmed by reading `Player.tryGapHop` directly: it checks only
  `jumping`/`z`/`inDeep`/`underwater`/`carrying`/`bellowsOpen`/
  `hookPulling`, no item flag at all.
- ~~`tools/check-gates.mjs`'s header (lines 11-12, 20-21) still claims plain
  boomerang vs. Magic Boomerang assertions~~ — **fixed, S60.** Header
  rewritten to describe what the body actually asserts (the Resonance Rod,
  always at `level: 1`, gated by RANGE and tide rather than by item level).
- **`F.HEAVY` (`src/world/tileset.js:91`) is set on `boulder`
  (`src/data/tiles-core.js:2180`) — checked in S60 and found NOT to be dead
  code, contrary to this ledger's own earlier claim.** The earlier claim
  only grepped `src/`; `F.HEAVY` is read by FOUR checker tools
  (`tools/check-strands.mjs`, `tools/check-overworld.mjs`,
  `tools/check-ground.mjs`, `tools/check-progression.mjs`) as the marker
  flag that tells a checker "gated on the Dredge Line" versus "just
  unreachable" — the same deliberate pattern as `F.RING`/`F.BOMBABLE`/
  `F.VANE`, documented in `tiles-core.js`'s own comment above the boulder
  tiledef. **Do not remove it** — doing so would break four working
  checkers. The boulder's actual passability still comes from `F.SOLID` +
  `liftLevel: 2` + the `dredge` tile action, as this entry originally said;
  only the "read by nothing" half of the claim was wrong.
