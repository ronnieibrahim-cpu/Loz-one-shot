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
| `deathFrame` built and proven, mirroring `hurtFrame`'s S12 landing. `Enemy.die()` (src/game/enemy.js) defers `remove=true` behind a `dying`/`deathTime` stall (`ENEMY_DEATH_FRAMES`, feel.js) when `spec.deathFrame` is set, then calls the real `Entity.die()` (loot/onDie/effects/`onEnemyDefeated` all still fire, just after the pose is seen); `spriteName()` checks `dying` before `hurtFrame`. Landed on `stalfos` — hand-drawn `stalfos_death` (a skull on a bone mound, `sprites-enemies-hurt.js`, `enemyk` palette) since the source sheet has no collapse pose. Verified in-engine: killed with one hit, `flicker` forced off to rule out the invuln blink hiding it, then stepped and screenshotted — `stalfos_death` drew for the whole stall while still in `game.entities` and not yet `remove`, then removed on schedule. Unlike `hurtFrame`, no hp-vs-`swordDamage()` constraint applies (see "Measured and rejected" below) — `die()` only ever runs on the hit that reaches hp 0, so even a 1-hp enemy is eligible. `check-drift.mjs`'s enemy-roster "death" column is UNCHANGED by this (still reads `stalfos` as `walk`-only) because it greps `sprites-enemies.js` sprite-key names rather than the enemy's own spec block the way its "hurt" column already does — a known-stale metric, not fixed here (`tools/check-drift.mjs` is not on this session's file allowlist; changing what a rotation objective measures is a bigger call than one task) | S13 | `docs/NEXT-SESSION.md` (deathFrame entry, immediately after S12's hurtFrame entry) |
| `check-drift.mjs`'s enemy-roster "death" column fixed (S13's own "still open" item, given its own session on purpose): changed from `enemySpriteKeys.has('${name}_death')`/`'_die'` (a sprite-KEY-naming guess from before `spec.deathFrame` existed, and blind to `stalfos_death` living in the hand-authored `sprites-enemies-hurt.js` rather than the ripped `sprites-enemies.js`) to `/\bdeathFrame\s*:/.test(block)`, the exact shape "hurt" already used. `stalfos` now reads `walk,death`; complete-set count unchanged at 0 of 22, as predicted (nothing has all four yet). "attack" deliberately left alone — no engine-level `attackFrame` field exists to read (see "Measured and rejected" below), so sprite-key naming stays its only signal on purpose, so the metric notices art before any engine field exists to consume it. Tool-only change, `enemySpriteKeys` kept (still used by `attack`), no `src/` touched | S14 | `docs/NEXT-SESSION.md` (check-drift death-column entry, after the attackFrame re-assessment) |
| `hurtFrame` given a third proof, on `beetle` (after `wisp`, S12). Sheet has no recoil pose for the Spiked Beetle, so `beetle_hurt` is hand-drawn (`sprites-enemies-hurt.js`): every outline/antenna/leg pixel of `beetle_d0` is unchanged, only a 7-pixel zigzag crack added down the shell's centre column — a spot checked beforehand to be a clean solid-fill run with nothing else drawn over it. `beetle` has `shield: 'front'`, and `hurtFrame` only ever shows on a hit that got past that shield, so "the armour cracks" fits the mechanic rather than contradicting it. Eligible under the S12 hp rule (hp 3 > `swordDamage()` 2). Verified in-engine: a non-lethal hit held `beetle_hurt` for the full 24-frame flicker window, then reverted to the walk cycle; screenshotted. `check-drift` reads `beetle: walk,hurt` | S15 | `docs/NEXT-SESSION.md` (beetle hurtFrame entry) |
| `deathFrame`'s "no hp constraint" claim (S13) actually TESTED at hp 1, not just asserted: `gel` (hp 1, ruled OUT for `hurtFrame` in S12 for that exact hp) given a `deathFrame` instead. Sheet's Color-Changing Gel strip is only colour recolours of the same round blob, no squash pose, so `gel_death` is hand-drawn (`sprites-enemies-hurt.js`) — the compact round `gel_0` blob (rows 4-9) flattened into a wide puddle low in the cell, shape changed on purpose per S13's own `_death` exception. Verified in-engine: one hit (hp 1 -> negative), `dying`/`gel_death` held for the full `ENEMY_DEATH_FRAMES` stall with `dead`/`remove` both still false throughout, then both flip together and the entity leaves `game.entities` on schedule — identical shape to `stalfos`'s proof, at the one hp value that would have broken `hurtFrame`. Confirms the two mechanisms are genuinely different rules, not one rule that simply hadn't been tried at hp 1 yet | S16 | `docs/NEXT-SESSION.md` (gel deathFrame entry) |
| `hurtFrame` + `deathFrame` COEXISTENCE proven on one enemy (`wisp`, the first in the roster with both). `Enemy.spriteName()`'s check order — `dying` before the `hurtFrame` flicker check — holds under the actual adversarial case: `hurt()` sets `flicker` on EVERY hit including the killing one, so on the frame an enemy dies, both `flicker > 0` and `dying === true` are true simultaneously, and nothing before this session had ever produced that state on a real enemy (every prior proof used a different enemy for each field). Verified on a SINGLE instance across two hits: hit 1 (non-lethal, hp survives) holds `wisp_hurt` for its full flicker window and reverts to the walk cycle on schedule; hit 2 (lethal) holds `wisp_death` — never `wisp_hurt` — for the whole `dying` stall, with `flicker` independently confirmed nonzero throughout that stall. No code change was needed; the existing check order was already correct. `wisp_death` (hand-drawn, `sprites-enemies-hurt.js`) is the halo collapsed to a small dim ember, not a recolour of `wisp_hurt`. This interaction is now settled — a second dual-field enemy would not tell us anything new about the ordering itself | S17 | `docs/NEXT-SESSION.md` (wisp deathFrame entry) |
| `darknut` given a `hurtFrame` (4th proof of S12's mechanism, after `wisp`, `beetle`, and `wisp` again for coexistence). This session actually LOOKED before drawing: cropped every box on the sheet's own "Darknut" plate (idle x2, side x2, two walk-leg frames, an overhead swing windup, four side-lunge attack poses, three loose weapon icons) and confirmed none of them is a flinch — every pose is mid-stride or mid-attack, nothing shows the knight caught off guard. `darknut_hurt` (`sprites-enemies-hurt.js`) reuses `darknut_d0`'s own grid character-for-character; the only edit is the two red visor eye-dots and the tan nose bridge between them turned black (3 pixels total) — eyes shut, the same "eyes shut or squinted" grammar this file's header borrows from `sprites-bosses.js`, body silhouette not touched at all (unlike the boss version of this grammar, which also shifts the whole body 1px — this file's own header says "body silhouette untouched", so the shift was deliberately not copied). Eligible under the S12 hp rule (`darknut` hp 6 > `swordDamage()` 2). Verified in-engine with a scratch Playwright probe (not committed, same shape as S12/S15/S17): a non-lethal hit (hp 6 -> 5) held `darknut_hurt` for the full 24-frame flicker window, screenshotted mid-flicker confirming the shut visor renders correctly under the invuln tint, then reverted to the walk cycle exactly on schedule. `check-drift` reads `darknut: walk,hurt`. `sprites-enemies.js` was untouched (confirmed byte-identical to the ripper's own re-emission both before and after this session, `check-rippers.mjs` 17/17) | S18 | `docs/NEXT-SESSION.md` (darknut hurtFrame entry) |
| `moblin` given a `hurtFrame` (5th proof of S12's mechanism, after `wisp`, `beetle`, `wisp` again, `darknut`), same sheet-first discipline S18 established. Checked every box on the sheet's own "Moblin & Goriya" plate (idle front/back, two side-holding-spear poses, a raised-spear windup both facing, four side-lunge throwing poses) and confirmed the same pattern as Darknut: neutral stances and active attacks only, nothing caught off guard. `moblin_hurt` (`sprites-enemies-hurt.js`) reuses `moblin_d0`'s own grid character-for-character; the two red eye-dots sitting just under the helmet brow (row 3, flanking the snout) turned black — the same "eyes shut" edit as `darknut_hurt` — plus one pixel at the centre of the flat tan snout (row 9) turned red, a wince/flush mark on the one part of the face with nothing else drawn over it (3 pixels total, silhouette untouched). Eligible under the S12 hp rule (`moblin` hp 4 > `swordDamage()` 2). Verified in-engine with a scratch Playwright probe (not committed, same shape as every prior proof): a non-lethal hit (hp 4 -> 3) held `moblin_hurt` for the full 24-frame flicker window, then reverted to the walk cycle exactly on schedule. `check-drift` reads `moblin: walk,hurt`. `sprites-enemies.js` untouched | S19 | `docs/NEXT-SESSION.md` (moblin hurtFrame entry) |
| `wizzrobe` given a `hurtFrame` (6th, after `wisp`, `beetle`, `wisp` again, `darknut`, `moblin`), same sheet-first discipline. Checked every box on the sheet's own "Wizzrobe" plate: the two used idle frames plus two hood-only teleport transition frames and one turned 3/4 view — the extras are its own `submerge()` appear/disappear cycle, already animated, not a flinch. **New finding this session: the "shut the eyes" edit `darknut_hurt`/`moblin_hurt` used does not generalise to every enemy.** `wizzrobe`'s eyes are the sprite's LIGHTEST colour sitting inside its DARKEST (a full-face visor/mask, not a lit face with a dark pupil), so recolouring them to the outline shade would make them the same colour as their surroundings and vanish instead of reading as a change. Used the sprite's otherwise-unused THIRD palette slot instead (index 2 — distinct from both index 0's light face and index 3's dark visor in the runtime `enemyp` ramp, `src/gfx/palettes.js`) for a 3-pixel bruise/wince mark on the cheek, guaranteed contrast regardless of which enemy palette is applied at runtime. **Also newly confirmed (not assumed): a `submerge()` enemy can never be hit while hidden.** Read `src/game/enemy.js`'s `submerge()` directly — the hidden ("down") branch sets `e.invuln = 9999`, and `Entity.hurt` early-returns whenever `invuln > 0` — so the flicker window this mechanism depends on can only ever start while the enemy is surfaced and visible, meaning no `hidden`/`dying` interaction needs guarding for any current or future submerge-cycle enemy (`leever`, `siren` use the same primitive). Verified in-engine with a probe that pins `_subState`/`_subT` so the cycle doesn't flip mid-test: a non-lethal hit (hp 3 -> 2) held `wizzrobe_hurt` for the full 24-frame flicker window with `hidden` staying false throughout, then reverted to `wizzrobe_0` on schedule. `check-drift` reads `wizzrobe: walk,hurt`. `sprites-enemies.js` untouched | S20 | `docs/NEXT-SESSION.md` (wizzrobe hurtFrame entry) |
| `siren` given a `hurtFrame` (7th, after `wisp`, `beetle`, `wisp` again, `darknut`, `moblin`, `wizzrobe`), confirming (not re-deriving) that S20's two findings both generalise beyond `wizzrobe` itself. Checked the sheet's own "River Zora" plate: exactly two frames exist for this creature (`siren_0` fanged-mouth-shut, `siren_1` open singing ring-shot pose), both already used, and every other box near them on the sheet belongs to unrelated creatures (Pols Voice, two coral/flower decoration icons) — nothing to extract, the third session in a row to find this. `siren_0`'s face reads as a fanged mask with no distinct pupil-in-iris eyes (closer to `wizzrobe`'s visor case than `darknut`/`moblin`'s), so `siren_hurt` (`sprites-enemies-hurt.js`) reuses S20's fallback rather than the eye-shut trick: `siren_0`'s own grid reused pixel-for-pixel, 3 pixels on the flat tan chin (row 14) turned to the sprite's otherwise-unused THIRD colour (index 2, distinct from both the light body and the outline in the runtime `enemyb` palette). `siren` shares `wizzrobe`'s `submerge()` primitive exactly, so S20's "can only ever be hit while surfaced" finding was confirmed to hold rather than assumed to carry over. Verified in-engine with the same pinned-`_subState`/`_subT` probe: a non-lethal hit (hp 4 -> 3) held `siren_hurt` for the full 24-frame flicker window with `hidden` staying false throughout, then reverted to `siren_1` on schedule. `check-drift` reads `siren: walk,hurt`. `sprites-enemies.js` untouched | S21 | `docs/NEXT-SESSION.md` (siren hurtFrame entry) |
| `anglerfry` given a `hurtFrame` (8th, after `wisp`, `beetle`, `wisp` again, `darknut`, `moblin`, `wizzrobe`, `siren`). Checked the sheet's own "Cheep-Cheep" plate (its documented substitution source — `anglerfry` has no direct Oracle equivalent): exactly two frames, both already used as `anglerfry_0`/`anglerfry_1`, nothing else nearby belongs to it — the fourth session in a row to find an exhausted plate. **Which trick applies is genuinely per-sprite, confirmed a third way this session**: `anglerfry_0`'s face DOES have distinct two-dot eyes (two short black bars, rows 5-6, columns 3 and 5, on a light tan face) — closer to `darknut`/`moblin`'s case than `wizzrobe`/`siren`'s masked-face case — so the eye-shut trick applies directly here, just in the opposite tone direction (dark marks on a light face, rather than light marks pulled into a dark visor): the single tan pixel separating the two eye-dots (column 4, both rows) turned black too, merging two separate dots into one solid squeezed-shut bar. 2 pixels total, silhouette untouched. Also confirmed `anglerfry`'s `light: true` flag (`src/data/enemies.js`) is unrelated to rendering — `src/game/enemy.js`'s own comment on the flag says it only lets the Squall Bellows push the entity — so it has no bearing on whether `hurtFrame` draws; checked rather than assumed given no prior `hurtFrame` target carried this flag. Verified in-engine: a non-lethal hit (hp 3 -> 2) held `anglerfry_hurt` for the full 24-frame flicker window, then reverted to `anglerfry_0` on schedule. `check-drift` reads `anglerfry: walk,hurt`. `sprites-enemies.js` untouched | S22 | `docs/NEXT-SESSION.md` (anglerfry hurtFrame entry) |
| `pincer` given a `hurtFrame` (9th, after `wisp`, `beetle`, `wisp` again, `darknut`, `moblin`, `wizzrobe`, `siren`, `anglerfry`) — the first of this run of sessions to find the sheet actually HAD the pose rather than needing one hand-drawn. The sheet's "Pincer" plate holds three frames, not two: box 233 (`pincer_0`, head lunging into view) and box 234 (`pincer_1`, body coiled back) were already mapped in `tools/rip-enemies.py`; a third box (235) sits on the same plate — same four-colour palette, no background gap from box 234, a genuine 14px gap before the next real plate (236, `Piranha`, a different palette) — confirmed with a raw unquantised crop showing the "Pincer" sheet label sitting directly above all three boxes. Box 235 is a tighter, off-centre coil read as a dazed stagger, distinct from box 234's calm idle coil, so it was added to `FRAMES` as `pincer_hurt` and re-emitted through the ripper rather than hand-drawn — `sprites-enemies.js` DID change this session (57 sprites now, was 56), and `check-rippers.mjs` stayed 17/17 (byte-identical re-emission confirmed both before and after the `FRAMES` edit). Confirmed (not assumed) `pincer` has no `submerge()`/hidden state: it never leaves `terrain: 'any'` and the live entity carries no `hidden` property at all. Verified in-engine: a non-lethal hit (hp 3 -> 2) held `pincer_hurt` for the full 24-frame flicker window, `hidden` absent throughout, then reverted to `pincer_0` on schedule. `check-drift` reads `pincer: walk,hurt`. `check-playthrough.mjs`'s existing stop (`boss: nothing to fight in d2 0,4,5`) reproduced identically with this session's changes stashed out, confirming it predates this work and isn't a regression from it | S23 | `docs/NEXT-SESSION.md` (pincer hurtFrame entry) |
| `octorokSea` given a `hurtFrame` (10th, after `wisp`, `beetle`, `wisp` again, `darknut`, `moblin`, `wizzrobe`, `siren`, `anglerfry`, `pincer`) — the last hp > 2 target besides `stalfos`'s reverse-order case, so **every hp > 2 enemy except `stalfos` now has a `hurtFrame`**. The sheet's "Octorok" plate has exactly four frames (front x2, side x2), all already mapped as `octorok_d0`/`d1`/`s0`/`s1`; a fifth box at matching pitch right after them turned out to be a shell/pickup icon in a visibly different orange palette, confirmed against the sheet's own "Octorok" label spanning only the first four boxes — nothing to extract, hand-drawn instead. `octorok_d0`'s two eye-squares are already the outline's own colour, so the `darknut`/`moblin` "recolour to outline" trick has nothing lighter left to shut; reused `anglerfry_hurt`'s "merge two dark eye-shapes by filling the gap between them" trick instead, applied only at the one row (row 7) where the gap narrows to 2 columns, leaving the wider gaps at rows 6/8 alone so the nose bridge doesn't become a solid bar. 2 pixels total, silhouette untouched. `octorokSea_hurt` lands in `ENEMY_HURT_ART` (`sprites-enemies-hurt.js`); the land `octorok` (hp 2) shares the identical frame set but doesn't qualify under the S12 hp rule, hence the enemy-id-scoped key. Confirmed (not assumed) no `submerge()`/hidden state — plain `wander()`+`shoot()` ai, `tideOnly` only gates spawning. **First directional-`frames` target verified since `darknut`/`moblin`**: an in-engine probe cycled `e.dir` through all four directions on every sampled frame during the flicker window, confirming `hurtFrame` overrides every direction the same way those two already proved, not re-derived from the mechanism alone. Non-lethal hit (hp 3 -> 2) held `octorokSea_hurt` for the full 24-frame window regardless of `dir`, then reverted to the direction-correct frame (`octorok_d0`/`u0`/`s0`) on schedule. `check-drift` reads `octorokSea: walk,hurt`. `sprites-enemies.js` untouched (hand-drawn path), `check-rippers.mjs` still 17/17, `check-playthrough.mjs`'s stop unchanged | S24 | `docs/NEXT-SESSION.md` (octorokSea hurtFrame entry) |
| `stalfos` given a `hurtFrame` (11th, after `wisp`, `beetle`, `wisp` again, `darknut`, `moblin`, `wizzrobe`, `siren`, `anglerfry`, `pincer`, `octorokSea`) — the reverse-order coexistence case, since `stalfos` already had `deathFrame` (S13). **Every hp > 2 enemy in the roster now has a `hurtFrame`.** `Enemy.spriteName()` checks `dying && deathFrame` before `flicker > 0 && hurtFrame`, so the two were never going to conflict by construction, but this is only the SECOND real enemy where both fields are live (after `wisp`, S17) — verified rather than assumed to carry over. Checked the sheet's "Stalfos, Sword Stalfos & Shrouded Stalfos" plate: the plain bone-white skeleton (blue trim, `stalfos_d0`/`d1`'s source) has exactly two frames, both used; every other frame on that plate belongs to green-hooded Sword Stalfos (already the `stalfos_s0`/`s1` side-view source) — nothing left to extract. `stalfos_d0`'s eye sockets are already solid black (the same "nothing lighter to shut" situation as `octorokSea`), but unlike `octorokSea` there's no 2-pixel gap between two separate dark shapes to merge — one continuous black area, not two dots — so this reused the `wizzrobe`/`siren` unused-palette-slot fallback instead: the grid never touches index 2, a genuinely distinct dark olive (`#565640`) in the runtime `enemyk` bone palette, so two pixels on the plain white forehead band (row 1, columns 8-9) turn to index 2, reading as a crack in the skull's own bone. 2 pixels total, silhouette untouched. **Verified both halves of the ordering in-engine**, not just the usual single case: a non-lethal hit (hp 3 -> 2) held `stalfos_hurt` for the full 24-frame window across all four cycled directions with `dying` false throughout, then reverted correctly; a separate lethal hit on a fresh spawn set `dying = true` and `spriteName()` returned `stalfos_death`, never `stalfos_hurt`. `check-drift` reads `stalfos: walk,hurt,death`. `sprites-enemies.js` untouched, `check-rippers.mjs` still 17/17, `check-playthrough.mjs`'s stop unchanged | S25 | `docs/NEXT-SESSION.md` (stalfos hurtFrame entry) |
| `keese` given a `deathFrame` (2nd, after `gel`, S16) — the `hurtFrame` thread closed at S25 (every hp > 2 enemy has one; hp <= 2 can never take a non-lethal hit since `swordDamage()` is 2), so this session opened the `deathFrame` branch instead, which carries no hp constraint. The sheet's "Keese" plate has exactly two frames (wings-spread, wings-folded), both already used as `keese_0`/`keese_1` — nothing to extract, hand-drawn instead. **A genuinely new finding, not a repeat of the hurtFrame lessons**: a first draft copied `stalfos_death`/`gel_death`'s "shift the shape down to sit low in the cell" pattern, but that's wrong for any enemy with a height offset — `keese` has `z: 8` and `Enemy.update()`'s `dying` branch (`src/game/enemy.js`) never touches `z`, so the whole death stall renders 8px up from the ground exactly where the kill landed, confirmed in-engine (z held at 8 across the entire stall). A "collapsed low in the cell" pose there reads as hovering, not fallen. `wisp` (also `z: 8`, `terrain: 'air'`, `deathFrame` since S17) is the existing precedent that gets this right: `wisp_death` stays CENTRED in the cell, reading as "fizzling out in place" — checked that shape before redrawing rather than assuming the ground-pose pattern generalises to every enemy. Redrew `keese_death` from `keese_1` (wings-folded) instead, centred the same way: both eye-dots closed (recoloured to the outline shade), the right foot-point removed and the left one extended one row further down — an asymmetric droop reading as gone limp, distinct from `keese_1`'s tidy rest pose. 6 pixels changed. Verified in-engine: lethal hit (hp 1 -> 0) set `dying = true`, `spriteName()` returned `keese_death`, `z` held at 8 for the full `ENEMY_DEATH_FRAMES` stall, then `dead = true` once it elapsed. `check-drift` reads `keese: walk,death`. `sprites-enemies.js` untouched, `check-rippers.mjs` still 17/17, `check-playthrough.mjs`'s stop unchanged. **Standing lesson for future `deathFrame` sessions**: check an enemy's `z`/height handling before choosing a "collapsed on the ground" vs. "fizzles in place" shape — it is a property of the enemy's movement (airborne vs. grounded), not of the hp rule that gates `hurtFrame` | S26 | `docs/NEXT-SESSION.md` (keese deathFrame entry) |
| `octorok` (land, hp 2 — distinct from `octorokSea`, hp 3, `hurtFrame` since S24) given a `deathFrame` (3rd, after `gel`, `keese`) — hp 2 means it can never show a `hurtFrame` (`swordDamage()` 2 always kills in one hit), so `deathFrame` is its only possible feedback. Re-checked the sheet's "Octorok" plate with a death pose specifically in mind rather than reusing S24's hurt-pose survey verbatim: same four frames, same already-ruled-out shell icon, nothing new to extract. Applied S26's lesson correctly on the first try this time: confirmed `octorok` (land) has no `z` field at all before drawing, so a "collapsed low in the cell" pose is safe here (unlike `keese`) — `octorok_d0`'s grid squashed by keeping every other row (0,2,4,6,8,10,12 of 16) and shifting the compressed 7-row result to the bottom of the cell, the same "flatten into a puddle" move `gel_death` used. Verified in-engine: lethal hit (hp 2 -> 0) set `dying = true`, `spriteName()` returned `octorok_death`, `z` held at 0 for the full stall, then `dead = true`. `check-drift` reads `octorok: walk,death`. `sprites-enemies.js` untouched, `check-rippers.mjs` still 17/17, `check-playthrough.mjs`'s stop unchanged. This session's branch was also fast-forwarded onto `main` directly (clean ancestor, no conflicts) per an explicit user request to keep pushing completed work to `main` as sessions land | S27 | `docs/NEXT-SESSION.md` (octorok deathFrame entry) |
| `urchin` given a `deathFrame` (4th, after `gel`, `keese`, `octorok`) — hp 2, `deathFrame`-only, same reasoning as `octorok`. **First genuine extraction find since `pincer` (S23)**: the sheet's own "Spiny Beetle" plate (`urchin`'s substitution source) has a real fifth frame (box 295) sitting directly below the two already-used spiky poses, sharing their palette but with spikes fully retracted into a smooth dome — confirmed against the sheet's own label spanning the whole block. Added to `FRAMES` in `tools/rip-enemies.py` and re-emitted (`sprites-enemies.js` now 58 sprites, `check-rippers.mjs` still 17/17). Confirmed `urchin` has no `z` field (ground-level, like `octorok`, no height trap). **Resolved an ambiguity the enemy's own code comment could have hidden**: "harmless until the tide covers it" describes only the `ai()`'s movement gate — the entity's own `harmless` flag is never set by `urchin`'s spec and measured `false` in both tide states, not assumed from the comment. Ran two in-engine lethal-hit probes (tide 0 and tide 1) that produced byte-identical results across `dying`, `spriteName()`, `z`, and stall frame count, confirming the death mechanism is indifferent to which state the enemy died in. `check-drift` reads `urchin: walk,death`. `check-rippers.mjs` 17/17, `check-playthrough.mjs`'s stop unchanged. Branch fast-forwarded onto `main` again, same as S27 | S28 | `docs/NEXT-SESSION.md` (urchin deathFrame entry) |
| `crab` given a `deathFrame` (5th, after `gel`, `keese`, `octorok`, `urchin`). The sheet's "Sand Crab" plate has exactly two frames, both used — nothing to extract. Took three attempts: `octorok_death`'s row-squash trick fails here because `crab_0`'s two claw columns have a real gap between them (unlike `octorok_d0`'s continuous hood), leaving them floating disconnected; a full vertical flip pushes the shape to the TOP of the cell instead of sitting low. What worked: `crab_0`'s own lower half (rows 7-14, the legs/underside below the claw split) reused pixel-for-pixel and shifted to the bottom, claws dropped entirely — reads as "flipped, claws tucked, legs/belly showing." Confirmed no `z` field. Verified in-engine same as every prior `deathFrame` target. `check-drift` reads `crab: walk,death`, `check-rippers.mjs` 17/17 | S29 | `docs/NEXT-SESSION.md` (crab deathFrame entry) |
| **UNRESOLVED, HIGH-VALUE FINDING (S29, not chased — see `docs/NEXT-SESSION.md`'s S29 entry for full detail)**: `check-playthrough.mjs`'s stop point changed for the first time since S23 — the long-standing crash (`boss: nothing to fight in d2 0,4,5`, byte-identical across five prior sessions' own stash-and-recompare checks) is gone. The run now completes (`20 passed, 1 failed`): both D1 and D2 bosses are beaten in real combat, further than this thread has ever measured, but `s.essences` is `[2]` only against a `GOAL.essences` of `[1, 2]` — D1's essence (Gohmaraq's) is missing despite the boss being beaten. Leading theory, not confirmed: the cumulative `dying`-stall time this whole `hurtFrame`/`deathFrame` thread has added (enemies now linger ~16 frames before removal instead of vanishing instantly) shifted the run's frame-exact timing enough to change which frame-budgeted route steps pass or fail; `crab` (S29) is placed far more densely across the dungeons than any prior `deathFrame` target, the best explanation for why S29 specifically is what tipped it. Concrete next steps are named in the S29 `docs/NEXT-SESSION.md` entry: check whether the `loot` verb (`tools/actor-runtime.mjs`) actually walks onto and collects an `Essence`-type entity at all, check whether the essence has even spawned by the time the route's `['loot', 900]` step runs after Gohmaraq's death sequence, and determine whether this is a genuine regression from the timing shift or a pre-existing gap that the run simply never reached before. Per the charter's own rule 5, this stayed unspent as a detour — `DETOUR TOKENS` is still 1 in `docs/prompts/STATE.md` as of S29 | S29 | `docs/NEXT-SESSION.md` (S29 entry, the "SIGNIFICANT UNPLANNED FINDING" paragraph) |
| `zol` given a `deathFrame` (6th, after `gel`, `keese`, `octorok`, `urchin`, `crab`) — the first target whose `onDie` does something beyond a loot roll (splits into two `gel`s). Sheet's "Zol & Gel" plate has exactly two frames, both used — hand-drew `zol_death` as a scaled-up `gel_death` puddle (thematically linked, since `zol` splits into `gel`). **Directly verified the deferred-`onDie` mechanism S29 only theorised about**: an in-engine probe (checking both `g.entities` and `g.pendingAdd` — `addEntity` queues into the latter, only `flushPending()` moves them) confirmed zero `gel`s exist during the full 16-frame `dying` stall and exactly two appear the instant it ends, at the correct frozen position, both correctly flagged `split: true`. **Found and fixed a real regression this session's own change caused**: `tools/test.mjs`'s "enemies can be killed" check kills a room's `zol` and only waited `frames(6)` before checking `progress.kills` incremented — insufficient now that the increment (`Game.onEnemyDefeated`, called from `Entity.die()`) is deferred behind the same stall `zol_death` just added. Fixed with `frames(20)` and a comment; `test.mjs` back to 83/83. | S30 | `docs/NEXT-SESSION.md` (zol deathFrame entry) |
| **ESCALATED, CONFIRMED-SYSTEMIC FINDING (S30, still not chased — full detail in `docs/NEXT-SESSION.md`'s S30 entry)**: a SECOND `deathFrame` addition in as many sessions has visibly moved `check-playthrough.mjs`'s own outcome, this time confirmed by direct stash A/B (the crab-only commit reproduces S29's exact `20 passed, 1 failed` state; adding `zol_death` on top crashes). The crash moved EARLIER than any previously recorded stopping point: `equip: anchor is not in the item list` at frame ~33017 in D1 room `0,3,6`, thrown right after `tools/playthrough-route.mjs`'s `['loot', 600]` step that is supposed to collect D1's Anchor from its chest before the very next step tries to equip it. Same shape of bug as S29's missing essence — a fixed-frame-budget route step that used to just barely finish no longer does, once ANY upstream enemy kill anywhere in the run takes longer than it used to. **The pattern is now systemic, not a one-off**: two independent `deathFrame` additions (`crab`, `zol`) have EACH reshuffled the run's outcome in a different, unpredictable direction (further-but-still-failing, then earlier-and-crashing). The whole route is written against fixed frame budgets that assume an enemy vanishes the instant it dies, an assumption this whole `hurtFrame`/`deathFrame` thread has been violating since S12 for `hurtFrame` (no removal-timing effect) and since S16 for `deathFrame` (a real, growing one). A future detour session on this area should treat the ROUTE'S OWN FRAGILITY to incidental timing drift as the actual target, not patch each individual step as it breaks — the next `deathFrame` addition will likely just move the failure again. `DETOUR TOKENS` remains 1, unspent, as of S30 | S30 | `docs/NEXT-SESSION.md` (S30 entry, the "ESCALATED FINDING" paragraph) |
| **CLOSED (S31/S76) — the S29/S30 finding above was real but BOTH its diagnoses were wrong; do not build on the "frame-budget drift" theory.** `dLoot` (`tools/actor-runtime.mjs`) returns immediately when nothing collectable is on the floor, so its frame number is a CAP, not a wait — no `loot` step was ever short of budget, at any `deathFrame` count. The two real faults: (1) `Essence` (`src/game/objects.js`) has no `isDrop`, so `dLoot` can never collect it at any budget regardless of timing — it needs an explicit `['goto', 4, 3, N]` walk-onto-the-tile step, which D2's boss aftermath already had and D1's never did; fixed by adding the same step to D1. (2) The anchor-equip crash was a DEATH ~28000 frames upstream (`d1 0,3,5`, hearts hit 0, respawn at the dungeon mouth, every later directive addressed a room Link wasn't in), not a budget shortfall at the crash site itself — root cause was `dFight`'s retreat band backing the actor into a room-edge wall it could not retreat past once a chaser was already in contact, fixed so it swings instead when retreat is blocked. A real, unrelated game bug was found alongside: a `dying` (not yet fully removed) enemy still dealt full contact damage for its entire defeat-pose stall, fixed by skipping contact damage on `dying`. `replay.mjs` was independently found ALREADY RED on `main` (49/51, unnoticed) and re-recorded. Result: `check-playthrough.mjs` 21/21 and `replay.mjs` 51/51, every `deathFrame` intact, nothing skipped/disabled/granted. **The lesson for whoever reads this next**: the plausible-sounding "cumulative timing drift" theory two sessions independently converged on was wrong both times — always measure the actual mechanism (frame-by-frame A/B, reading the actual verb implementation) rather than trusting a theory that merely fits the correlation | S31 (STATE.md numbering) / S76 (`docs/NEXT-SESSION.md` numbering) | `docs/NEXT-SESSION.md`'s S76 entry |
| `leever` given a `deathFrame` (7th, after `gel`, `keese`, `octorok`, `urchin`, `crab`, `zol`) — hp 2, `deathFrame`-only. First `deathFrame` extraction find since `urchin` (S28): the sheet's "Leever" plate has four frames, not two — the buried mound (unused) and the two fully-emerged poses already mapped as `leever_0`/`leever_1`, plus a THIRD, previously-unmapped frame (box 137) sitting between them — same palette, claws only partway up, body still low. Added `leever_death: (137, 0.5, 1.0, False)` to `FRAMES` in `tools/rip-enemies.py` and re-emitted (59 sprites, `check-rippers.mjs` still 17/17); reads as the creature sinking back into the sand, its own burrowing motion doing double duty as its defeat pose. Confirmed no `z` field. **Verified both halves of the `submerge()` interaction directly** rather than re-deriving from S20's older `hurtFrame`-era finding: pinned buried (`_subState: 'down'`, `hidden: true`, `invuln: 9999`) and confirmed a lethal hit does not connect at all (`hurt()` returns `false`, `hp`/`dying` untouched); pinned surfaced and confirmed a lethal hit connects normally, holding `leever_death` through the full stall before `dead = true`. **Confirmed S76's playthrough fix holds under a new `deathFrame`** rather than assuming it: `check-playthrough.mjs` 21/21 and `replay.mjs` 51/51, both unchanged from S76's own numbers, run AFTER this session's own change per its prompt's explicit instruction that a red result now would be this session's fault, not a known-bad baseline | S32 | `docs/NEXT-SESSION.md` (S77 entry) |
| `tektite` given a `deathFrame` (8th, after `gel`, `keese`, `octorok`, `urchin`, `crab`, `zol`, `leever`) — hp 2, `deathFrame`-only. Sheet's own "Tektite" plate confirmed to have exactly two frames (legs splayed / legs tucked), both already used — nothing to extract; hand-drew `tektite_death` as an `octorok_death`-style every-other-row squash of `tektite_0`'s body, reusing only colours already present. **First `deathFrame` target confirmed to drive a live height accumulator (`hop()`'s `fz`) despite having no static spec `z` field** — the handoff prompt called it "plainer" than `leever` and explicitly warned not to trust that framing, which was the right call: verified in-engine that a kill mid-hop freezes `fz` at its hit-instant value for the whole `ENEMY_DEATH_FRAMES` stall (`Enemy.update()`'s `dying` branch skips `ai()` entirely), so the flat death pose briefly draws elevated rather than snapping to the ground — the same class `zol`'s own hop already normalised (S30), recorded here as an accepted quirk rather than chased as a defect. **`replay.mjs` caught a real divergence this time** (`d1-descent`, entity-count mismatch at frame 5940 — the death stall now outlives a checkpoint the old recording assumed instant removal at), confirming CLAUDE.md's own warning that a five-line movement-path change is never really five lines; re-recorded and back to 51/51. `check-playthrough.mjs` stayed 21/21 unchanged | S33 | `docs/NEXT-SESSION.md` (S78 entry) |
| `jellyfish` given a `deathFrame` (9th, after `gel`, `keese`, `octorok`, `urchin`, `crab`, `zol`, `leever`, `tektite`) — hp 2, `deathFrame`-only, and the first target that had no `hurtFrame` at all before this session (hp 2 means `swordDamage()` always kills it in one hit). Checked the sheet's own "Bari & Biri" plate properly rather than trusting the two boxes already used were the whole story: it actually has four tan "Bari" frames plus two separate blue "Biri" frames, told apart by quantising and comparing PALETTES directly (`#ffd68c`/`#1984ff` tan vs. `#73adff`/`#0000ff` electric-blue) rather than eyeballing a resized crop. The previously-unmapped tan frame (box 14) reads as a real collapse — body smaller and shifted down, tentacle fringe ragged instead of the live frames' neat skirt — a genuine extraction, not a hand-draw. Added `jellyfish_death: (14, 0.5, 0.5, False)` to `FRAMES` in `tools/rip-enemies.py` and re-emitted (60 sprites now), `check-rippers.mjs` stayed 17/17. **The plainest `deathFrame` target verified so far**: `ai()` is `bounceDiag` + `driftWithTide` (continuous, not lattice-locked), no `hop()`, no `submerge()`, confirmed no spec `z` field — no height quirk to reconcile, unlike every recent predecessor. Verified in-engine in deep water: lethal hit sets `dying = true` immediately, `spriteName()` returns `jellyfish_death`, holds the full stall, then `dead = true` and fully removed. Neither `check-playthrough.mjs` (21/21) nor `replay.mjs` (51/51) moved — `jellyfish` is absent from both the scripted route and every recorded replay plan, so no re-recording was needed this time. **Closes out the "next hp<=2 enemy without one" cadence this thread followed since S26** — every non-hp-999 enemy at hp <= 2 now has a `deathFrame`; every remaining candidate is hp >= 3 and already has a `hurtFrame`, so the next session has to pick by some criterion other than lowest hp | S34 | `docs/NEXT-SESSION.md` (S79 entry) |
| `octorokSea` given a `deathFrame` (10th) by REUSING `octorok_death` rather than drawing new art — the first session in this thread to answer a reuse-vs-new-art question on purpose. `octorokSea`'s `frames:` block names the exact same sprite keys as land `octorok` (already `octorok_death` since S27), so the two are already the same creature on screen while alive; a distinct corpse would be the first point they diverged for no visible reason, and `octorok_death`'s flattened-squash shape doesn't actually assert dry land specifically. Wired `deathFrame: 'octorok_death'` directly, with the reasoning left as an inline comment in `enemies.js`. **First session in the whole `deathFrame` thread to touch zero art-pipeline files** (no `sprites-enemies.js`, `rip-enemies.py`, or `sprite-manifest.js` change — nothing new to add). **First real `hurtFrame`+`deathFrame` two-hit proof at hp 3** (every prior target was hp <= 2, where a single hit always kills, so `hurtFrame` could never actually fire on the way to death): probed one instance through both hits — a non-lethal hit shows `octorokSea_hurt` and reverts to the walk cycle once the flicker window ends, `dying` false throughout; the lethal follow-up shows `octorok_death`, never `octorokSea_hurt`, for the full stall. Confirmed no `z` field. `check-drift` reads `octorokSea: walk,hurt,death`; `check-playthrough.mjs`/`replay.mjs` both unchanged, no re-recording needed. Establishes that hp no longer orders which enemy is picked next — every remaining candidate is hp >= 3 with a `hurtFrame` already, so each future pick needs its own stated reason | S35 | `docs/NEXT-SESSION.md` (S80 entry) |
| `beetle` given a `deathFrame` (11th) — hp 3, `shield: 'front'` + `charge()` AI, picked specifically to close a real gap: `crab` (S29) also has `shield: 'front'` but nobody had explicitly tested a lethal hit against its shielded side. Sheet's own "Spiked Beetle" plate confirmed to have exactly four frames, all already used — hand-drew `beetle_death` as an `octorok_death`-style squash of the UPRIGHT resting pose (`beetle_d0`), chosen on purpose over uncurling the balled-up charge shape (`beetle_s0`/`s1`), which could read as "about to charge" instead of "collapsed." **First explicit proof in this thread that a `shield`-blocked hit stays blocked even at absurd lethal damage**: a hit at the shielded front with 99 damage is refused outright (`hurt()` returns `false`, `hp`/`dying` untouched), while a hit from an unshielded angle behaves exactly like every other two-hit proof — non-lethal shows `beetle_hurt` and reverts correctly, lethal follow-up shows `beetle_death` for the full stall. Confirmed no `z` field. `check-drift` reads `beetle: walk,hurt,death`; `check-playthrough.mjs`/`replay.mjs` both unchanged, no re-recording needed; `sprites-enemies.js` untouched (hand-drawn) so `check-rippers.mjs` not re-run | S36 | `docs/NEXT-SESSION.md` (S81 entry) |
| `darknut` given a `deathFrame` (12th) — hp 6, `shield: 'front'`, the first target needing THREE hits at `swordDamage()` 2 (6->4->2->0). **Real extraction find, not assumed exhausted**: the sheet's own "Darknut" plate has more poses than the four already used — box 57, sitting directly between `darknut_d0` and `darknut_s0`, same palette, unused, is a hunched-forward head-down posture with no shield or sword visible, visually distinct from every standing battle pose. Added `darknut_death: (57, 0.5, 0.5, False)` to `FRAMES` in `tools/rip-enemies.py` and re-emitted (61 sprites now), `check-rippers.mjs` stayed 17/17. **First proof in this thread that the whole hurt-hurt-death sequence holds across a THIRD hit, not just a second**: shielded-front hit blocked outright even at 99 damage; hit 1 (hp6->4) shows `darknut_hurt` and reverts correctly; hit 2 (hp4->2) shows `darknut_hurt` AGAIN — the new ground, confirming the flicker cycle genuinely repeats rather than firing once per lifetime; hit 3 (hp2->0) shows `darknut_death` for the full stall. Confirmed no `z` field. `check-drift` reads `darknut: walk,hurt,death`; `check-playthrough.mjs`/`replay.mjs` both unchanged | S37 | `docs/NEXT-SESSION.md` (S82 entry) |
| `wizzrobe` given a `deathFrame` (13th) — hp 3, `submerge()`-based appear/disappear. **Real extraction find with a genuine trap avoided**: the sheet's visually-adjacent frame to the left of the two already used is actually a DIFFERENT creature ("Whisp", red palette), caught by comparing quantised palettes directly rather than trusting adjacency; the real unused frame (box 338) sits one further along, sharing the live frames' exact green palette, and reads as a genuine mid-transition pose (hood on top, full robe on bottom). Added `wizzrobe_death: (338, 0.5, 0.5, False)` to `FRAMES` and re-emitted (62 sprites), `check-rippers.mjs` stayed 17/17. **First test of `submerge()`'s hidden/invuln mechanism (proven by `leever` S32) combined with `hurtFrame` on one enemy**: a hit while hidden is blocked outright, same as `leever`. **Found and confirmed a real but entirely benign quirk**: a non-lethal hit landing right before the `up` timer expires leaves `flicker` counting down obliviously through the `down` transition, and `spriteName()` still technically returns the hurt frame while `hidden = true` — but `game.js:1772`'s render loop skips any `hidden` entity unconditionally before that value is ever drawn, so nothing is player-visible. `invuln` is correctly overwritten to `9999` by the submerge transition regardless of whatever flicker-driven value preceded it. The ordinary two-hit sequence (no submerge interference) behaves exactly like every prior hp-3 proof. `check-drift` reads `wizzrobe: walk,hurt,death`; `check-playthrough.mjs`/`replay.mjs` both unchanged | S38 | `docs/NEXT-SESSION.md` (S83 entry) |
| `pincer` given a `deathFrame` (14th) — hp 3, `speed: 0`, tethered snap-out-and-reel AI (`e._pinch`: `'hole'`/`'out'`/`'back'`), no `shield` or `submerge()`. **Real extraction find in the other direction**: a genuine fourth frame (box 232) sits one box BEFORE `pincer_0`, same red/tan/black palette, confirmed by quantising directly — just two eyes centred, the whole body faded away. Reads as the creature receding back into its hole for good, apt for something that "never leaves its hole" by its own `ai()` comment. Added `pincer_death: (232, 0.5, 0.5, False)` and re-emitted (63 sprites), `check-rippers.mjs` stayed 17/17. Verified a lethal hit lands correctly regardless of which `_pinch` state the creature is in when killed (`'hole'`/`'out'`/`'back'`, all three tested), and the ordinary two-hit sequence behaves exactly like every other hp-3 target. Confirmed no `z` field and no `hidden`/`invuln` toggling — the first target in a few sessions to turn out exactly as plain as expected, unlike `tektite`/`darknut`/`wizzrobe`'s surprises. `check-drift` reads `pincer: walk,hurt,death`; `check-playthrough.mjs`/`replay.mjs` both unchanged | S39 | `docs/NEXT-SESSION.md` (S84 entry) |
| `moblin` given a `deathFrame` (15th) — hp 4, the first hp-4 target. **Two candidate frames on the sheet's own plate correctly REJECTED rather than used**: boxes 171/173 share the exact Moblin palette (confirmed directly, not confused with Goriya's separate blue icons nearby) but both are active spear-held-down stances, not a collapse — matching palette isn't enough, a candidate also has to actually read as defeated. Hand-drew `moblin_death` instead, an `octorok_death`-style squash of the front idle pose. **First proof that `ai()` is correctly skipped while `dying` on an enemy that was ACTIVELY fleeing at the moment of the killing blow**, not idle: position tracked frame-by-frame across the entire death stall shows zero drift. Confirmed no `z` field. `check-drift` reads `moblin: walk,hurt,death`; `check-playthrough.mjs`/`replay.mjs` both unchanged; `sprites-enemies.js` untouched (hand-drawn) so `check-rippers.mjs` not re-run | S40 | `docs/NEXT-SESSION.md` (S85 entry) |
| `siren` given a `deathFrame` (16th) — hp 4, water, `submerge()`-based like `leever`/`wizzrobe`. **Real sheet-adjacency trap caught again**: a spiral frame right before the two live Zora frames carries NO red at all (`#ffd68c`/`#000000` only vs. the live frames' `#ffd68c`/`#ff0829`/`#000000`) — a different creature/icon entirely, correctly rejected by comparing palettes rather than trusting position. Hand-drew `siren_death` instead, an `octorok_death`-style squash. **Third independent confirmation that `submerge()`'s hidden/invuln mechanism generalises** (after `leever` S32 and `wizzrobe` S83): a hit while hidden is blocked outright on this enemy too. Ordinary two-hit sequence behaves like every hp-4 proof. **`replay.mjs` caught a real divergence** (`tide-steps-split`, entity-count mismatch — `siren` appears in that plan's room and the new death stall outlives an old checkpoint), same class `tektite` (S78) hit; re-recorded, 51/51 clean. Confirmed no `z` field. `check-drift` reads `siren: walk,hurt,death`. **Only `anglerfry` remains** before every killable enemy (all but the three hp-999 unkillables) has a `deathFrame`, closing this sub-thread running since S26 | S41 | `docs/NEXT-SESSION.md` (S86 entry) |
| `anglerfry` given a `deathFrame` (17th and LAST) — hp 3, water, `tideOnly`. Sheet's own "Cheep-Cheep" plate confirmed to have exactly two frames, both used — hand-drew `anglerfry_death`, an `octorok_death`-style squash of `anglerfry_0`. Verified the two-hit sequence identically at both tide levels it exists at. **CLOSES THE ENTIRE `deathFrame` SUB-THREAD running since S26**: every killable enemy in the roster now has one; only `bubble`/`beamos`/`barnacle` (hp 999, unkillable by design) lack it. Confirmed `docs/ENEMIES.md` (the objective's documentation half) was already complete — all 22 enemies specced, with its own section arguing no two lessons overlap — nothing left there. **The remaining gap for objective #4 is the art half's `idle`/`attack` states**: no engine field for `attack` exists yet at all. Found a zero-new-art pilot: `moblin_d1`/`u1`/`s1` are already-extracted "spear raised" frames currently just alternating into the ordinary walk cycle rather than showing specifically during the actual spear-throw — a real `attackFrame` mechanism (mirroring `hurtFrame`/`deathFrame`'s own S12/S13 plumbing) could land on `moblin` with pure engine work, no drawing | S42 | `docs/NEXT-SESSION.md` (S87 entry) |
| `attackFrame` BUILT and proven, mirroring `hurtFrame`/`deathFrame`'s own S12/S13 plumbing but adapted for a different trigger: it fires from the enemy's own offensive action (`shoot()`/`shootRing()`), not from taking damage. `spec.attackFrame` takes the same shape `spec.frames` does (string, or one entry per facing) but holds a single pose, not a cycled array. `e.attackTime` is set unconditionally inside `shoot()`/`shootRing()` — the shared funnel every ranged attack passes through, mirroring `Entity.hurt()`'s own hitstop reasoning — so it is inert for any enemy without `spec.attackFrame`. `spriteName()` priority: `dying` > `flicker`/`hurtFrame` > `attackTime`/`attackFrame` > walk cycle — a hit interrupts an in-progress attack pose, verified directly. `ENEMY_ATTACK_FRAMES` (16f, guessed) added to `feel.js`. Landed on `moblin` using art that already existed: `moblin_d1`/`u1`/`s1` ("spear raised") were extracted long ago but only ever shown as an ordinary alternate walk-cycle frame; wired as `attackFrame: {down, up, side}` and DELIBERATELY LEFT in the walk cycle too (no other second walk frame exists for `moblin`, so removing them would make it look static) — reasoning documented inline so a future session doesn't "clean up" what looks like redundant art. Verified across all three facings in-engine. `check-drift.mjs`'s "attack" column moved from sprite-key-naming (S14's own documented temporary proxy) to the real `/\battackFrame\s*:/` regex, the same fix S14 made for "death"; the now-unused `enemySpriteKeys` block was removed rather than left dead. `moblin` reads `walk,attack,hurt,death` — first enemy ever to hit that mark. **7 more `shoot()`/`shootRing()` users not yet surveyed for the same zero-new-art opportunity**: `octorok`, `octorokSea`, `beamos`, `wisp`, `wizzrobe`, `barnacle`, `siren` | S43 | `docs/NEXT-SESSION.md` (S88 entry) |
| Surveyed all 7 remaining `shoot()`/`shootRing()` users for a zero-new-art `attackFrame` opportunity. FOUR ruled out cleanly with a stated reason each: `octorok`/`octorokSea` (only 4 frames + an icon already ruled out at S24), `wisp` (Spark's own plate has exactly 2 frames), `wizzrobe` (its one spare frame already spent on `deathFrame`, S83), `siren` (River Zora has exactly 2 real frames, its one neighbour already rejected at S86). TWO qualified as real extraction finds: `beamos`'s 8-frame eye-sweep plate had only 2 used — box 20 (right after `beamos_1`) has a solid dilated pupil vs. the ring `beamos_1` shows, confirmed by quantising, reading as "eye locked, about to fire." `barnacle`'s 5-frame "Like Like" gape cycle had only 2 used — box 144 (right after `barnacle_1`) is squashed flatter/wider, reading as the mouth stretched to its fullest right before it spits. Added `beamos_atk: (20, 0.5, 0.5, False)` and `barnacle_atk: (144, 0.5, 0.5, False)`, re-emitted (65 sprites). Both wired as plain-string `attackFrame`s (neither has per-facing frames); verified in-engine. Both are `shield: 'all'` + hp 999, so no interruption case applies — a hit is blocked outright either way. **THE 7-ENEMY SURVEY IS COMPLETE**: 3 of 8 `shoot()`/`shootRing()` users have `attackFrame` (`moblin`, `beamos`, `barnacle`); the other 5 need genuinely new hand-drawn art — a harder ask than a `deathFrame` squash, since a throw/cast gesture can't just be a flattened idle silhouette | S44 | `docs/NEXT-SESSION.md` (S89 entry) |
| `octorok_atk` HAND-DRAWN (first genuinely new attack pose in the roster — S44's survey found nothing left to extract for it). Re-checked the "Octorok" plate a third time with a throwing pose specifically in mind; same four-frame result as S24/S27. Rendered `octorok_d0`'s own ASCII grid to a PNG (`pip install pillow`) to read it visually rather than by eye on the raw digits — this is the technique the whole edit rests on. Found the real face structure: a big tan center face with two solid-black eye notches, and a SEPARATE small red-and-tan mouth patch two rows below it, across a black collar band. Widened that patch's tan opening from 4 pixels to its full 8-pixel width (2 red "lip" pixels recoloured to tan on each side) — same "mouth stretched to its fullest" grammar `barnacle_atk`'s own comment already used, applied as a pixel edit since `octorok` has no spare frame to reuse. 4 pixels changed, silhouette otherwise identical to `octorok_d0`. **Decided explicitly (not defaulted) to apply it as ONE non-directional pose**, the `beamos_atk`/`barnacle_atk` shape, not per-facing like `moblin`: `octorok_u0` (back view) has no face at all to open a mouth on, so a real per-facing set would need a second new pose anyway, and leaving "up" unset would just show this same front pose via `spriteName()`'s own fallback (`a.up || a.down`) — no better than accepting the one pose for all four facings, which is what got wired. **Also decided `octorokSea` reuses `octorok_atk` outright**, same reasoning as its S80 `deathFrame` reuse: it shares `octorok`'s exact living frames, so it already reads as the same creature while alive. `octorokSea`'s own projectile is `shot_bubble`, not `shot_rock` — checked, a real difference — but `octorok_atk` only depicts the mouth opening, not the projectile inside it, so the difference doesn't argue for a second pose. Verified in-engine (scratch Playwright probe, not committed): `octorok_atk` shows in all four facings, holds the full `ENEMY_ATTACK_FRAMES` window then correctly reverts to the ordinary cycle; a mid-attack hit on `octorokSea` (which has `hurtFrame`) correctly interrupts to `octorokSea_hurt`, while the same hit on `octorok` (no `hurtFrame` declared) does NOT interrupt the attack pose — both outcomes are the existing `spriteName()` ordering working as designed, not new behaviour. `check-drift` now reads `octorok: walk,attack,death` and `octorokSea: walk,attack,hurt,death` (2 of 22 complete, up from 1). validate/test(83/83)/check-feel all green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged, check-rippers 17/17 (hand-drawn only, `sprites-enemies.js` untouched). check-build OK, dist rebuilt. **2 of the 5 hand-draw-needed enemies from S44 are now done** (`octorok`/`octorokSea` share the one pose); `wisp`, `wizzrobe`, `siren` remain, each needing its own new pose since none shares frames with another | S45 | `docs/NEXT-SESSION.md` (S90 entry) |
| `wisp_atk` HAND-DRAWN (second genuinely new attack pose, after `octorok_atk` S45). Confirmed `wisp`'s real spec first (hp3, `pal: 'magic'`, `frames: ['wisp_0','wisp_1']`, `z: 8`, `shootRing()`). Re-confirmed nothing extractable a second time — Spark's own plate has exactly 2 frames, both already spent on the ordinary lit/unlit flicker cycle. **Considered and REJECTED reusing `wisp_1` (the inverted-colour flicker frame) as the attack pose**, the way `moblin_d1` got reused at S43: `wisp_1` is not a materially different pose, only the same silhouette a player already sees every other tick during ordinary idle flicker, unlike `moblin_d1`'s genuinely distinct "spear raised" art — freezing on it for the attack window would not read as a telegraph to a player who already sees it constantly. Hand-drawn instead, rendering `wisp_0`/`wisp_1`/`wisp_hurt`/`wisp_death` from their real runtime `magic` palette to a PNG first (same technique S90 used) rather than reading the grids blind. Found `wisp_hurt` already shrinks the wide grin down to a small wince, so `wisp_atk` goes the OTHER direction: the same grin widened further (4 pixels — two corner-teeth at row 10 extended one column inward on each side, row 11's centre dark span widened by one column on each side to match), reading as the mouth opening wide right before it unleashes its ring of orbs. Spiky halo (rows 0-5, 12-15) and both eye wedges untouched — still unmistakably the same creature mid-cast. Wired `attackFrame: 'wisp_atk'` (plain string, since `wisp`'s `frames` is a flat array with no facings). Verified in-engine (scratch Playwright probe, not committed): shows immediately, holds the full 16-frame `ENEMY_ATTACK_FRAMES` window, reverts correctly; `z` stays 8 throughout (no height-offset complication, since this isn't a death pose); a mid-attack non-lethal hit correctly interrupts to `wisp_hurt` — the first `attackFrame` proof on an enemy that DOES declare `hurtFrame` (S90's `octorok` case had none), confirming `spriteName()`'s `dying > hurtFrame > attackFrame > walk` ordering from the other side. `check-drift` now reads `wisp: walk,attack,hurt,death` (3 of 22 complete, up from 2). validate/test(83/83)/check-feel all green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged, check-rippers 17/17 (hand-drawn only). check-build OK, dist rebuilt. `wizzrobe` and `siren` remain, each needing its own new pose | S46 | `docs/NEXT-SESSION.md` (S91 entry) |
| `wizzrobe_atk` HAND-DRAWN (third genuinely new attack pose, after `octorok_atk` S45 and `wisp_atk` S46). Confirmed spec first: hp3, damage3, `pal: 'enemyp'`, `frames: ['wizzrobe_0','wizzrobe_1']`, fires a single aimed `shoot()` from inside `submerge()`'s own `whileUp` callback. Re-confirmed nothing extractable — the third sheet frame is already extracted and already spent on `deathFrame` (S83). Rendered `wizzrobe_0`/`_1`/`_death`/`_hurt` from the real runtime `enemyp` palette to PNGs first (S90/S91's own technique). This showed `wizzrobe_hurt` already claims the right cheek with the sprite's otherwise-unused palette index 2 (a bruise mark), and that `wisp_atk` (S91) already owns the "mouth widens" grammar for this roster — so this pose needed a genuinely different feature. Used the two narrow eye slits instead: `wizzrobe_0`'s own grid has each eye as a single light column (rows 7-8, columns 6 and 9), widened one column further inward at both rows (4 pixels total) so each reads as a wider, rounder eye — "eyes going wide as the orb charges" — rather than the idle frame's thin half-lidded look. Hat, hood, collar and mouth all byte-identical to `wizzrobe_0`. Wired `attackFrame: 'wizzrobe_atk'` (plain string, flat `frames` array, no facings). **Verified in-engine, including the one genuinely new edge case this enemy raises that neither `octorok` nor `wisp` could**: `wizzrobe` blinks in and out via `submerge()`, so a shot fired near the end of the "up" phase could in principle leave `attackTime` still counting down when `submerge()` flips `hidden = true`. Checked directly rather than assuming it's fine the way `wizzrobe_hurt`'s own comment assumed for `hurtFrame` (via `invuln` forced to 9999): `spriteName()` itself does NOT gate on `e.hidden` at all, but the draw loop (`src/game/game.js:1772`, `if (e.hidden) continue`) skips `e.draw()` — and therefore `spriteName()`'s result — entirely for any hidden entity, regardless of which pose field would have been active. This is a STRONGER, roster-wide guarantee than `wizzrobe_hurt`'s own per-field `invuln` reasoning: it means `attackFrame` (and any future pose field) is automatically safe to leave counting through a `hidden` transition on ANY enemy, not just this one. Also verified the ordinary cases: shows immediately, holds the full 16-frame `ENEMY_ATTACK_FRAMES` window, reverts correctly; a mid-attack non-lethal hit correctly interrupts to `wizzrobe_hurt`. `check-drift` now reads `wizzrobe: walk,attack,hurt,death` (4 of 22 complete, up from 3). validate/test(83/83)/check-feel all green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged, check-rippers 17/17 (hand-drawn only). check-build OK, dist rebuilt. **Only `siren` remains of the 5 hand-draw-needed enemies S89's survey found** | S47 | `docs/NEXT-SESSION.md` (S92 entry) |
| `siren` given `attackFrame: 'siren_1'` — a REUSE, not a hand-draw, closing the `shoot()`/`shootRing()` attackFrame sub-thread running since S43/S88 with one fewer hand-drawn pose than S89's survey expected. S89 tested all 7 remaining candidates only for an UNUSED third sheet frame (correctly finding none for `siren`) and never asked the different question that qualified `moblin` at S43: does an ALREADY-used second frame show a genuinely distinct pose, not just a recolour. `siren_1` — already described in `siren_hurt`'s own existing comment as the "open singing ring-shot pose" — is a real shape change from `siren_0` (fanged mouth shut vs. a wide round mouth open), confirmed by rendering both from the real runtime `enemyb` palette rather than trusting the comment. This is NOT the same situation as `wisp_1`, correctly rejected for reuse at S91: `wisp_1` is a pure colour inversion of the identical silhouette (no shape change at all), while `siren_1` and `moblin_d1` both show an actual different body/mouth position. Wired directly with no new art and no `sprite-manifest.js` change (`siren_1` already registered); documented both the reuse reasoning and the explicit contrast with the `wisp_1` rejection inline in `enemies.js`. Verified in-engine: shows immediately on `attackTime`, a mid-attack hit correctly interrupts to `siren_hurt`, `siren_1` still appears normally in the ordinary 2-frame cycle (kept there, same as `moblin_d1`). One probe artifact worth noting for future sessions, not a bug: isolating `attackTime`'s countdown from `siren`'s own AI required disabling `ai` on the test instance, because `every(e, 40)`'s per-entity hashed `_phase` offset can land a re-fire (which resets `attackTime`) inside a short observation window — expected engine behaviour, not a defect. `check-drift` now reads `siren: walk,attack,hurt,death` (5 of 22 complete, up from 4). validate/test(83/83)/check-feel all green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged (no new divergence — `siren`'s death-stall replay fix already landed at S86), check-rippers 17/17 (`sprites-enemies.js` untouched). check-build OK, dist rebuilt. **ALL 8 `shoot()`/`shootRing()` users now have `attackFrame`** (`moblin`/`beamos`/`barnacle` S43-44, `octorok`/`octorokSea` S45, `wisp` S46, `wizzrobe` S47, `siren` S48) — the entire sub-thread running since S88 is closed. **Found the next real candidate while closing this one**: `charge()`'s own `tell` parameter (`src/game/enemy.js`) already freezes a charging enemy via `e.stun` for a windup period before the lunge (`beetle`/`darknut`/`anglerfry` all use it, `tell: 16/22/26`) — structurally the same "there's already a windup moment, it just doesn't swap the sprite" situation `shoot()` was in before S43, except `charge()` itself needs to set `e.attackTime` to a VARIABLE duration (`tell`, not the fixed `ENEMY_ATTACK_FRAMES`) rather than just reusing the existing wiring untouched | S48 | `docs/NEXT-SESSION.md` (S93 entry) |
| `attackFrame` support added to `charge()` (`src/game/enemy.js`) — the melee-lunge counterpart to `shoot()`/`shootRing()`'s S43 mechanism, closing the gap S93 found while closing the shoot roster. `charge()`'s own `tell` parameter already freezes an enemy via `e.stun` before it lunges (`Enemy.update()`'s `if (this.stun > 0) { this.stun--; return; }` skips `ai()` for that many frames — a real windup that just didn't swap the sprite yet). Added `if (o.tell) e.attackTime = o.tell;` alongside the existing `e.stun = o.tell` write. Deliberately uses the CALLER's OWN `tell` value rather than the fixed `ENEMY_ATTACK_FRAMES` constant `shoot()`/`shootRing()` use unconditionally — `beetle`/`darknut`/`anglerfry` pass different tells (16/22/26) and the pose should last exactly as long as the freeze does, not a fixed 16 regardless of caller. Piloted on `beetle`, a SECOND zero-new-art reuse in a row (after `siren`, S93): `beetle_hurt`'s own existing comment already names `beetle_s0`/`s1` as "two balled-charge frames", distinct from the upright `beetle_d0`/`d1` pair — rendered both from the real runtime `enemyk` palette and confirmed a genuine shape change (a curled ball with a target-like pattern vs. an upright bug with legs and antennae spread to the sides), passing the same recolour-vs-real-shape-change test S91 used to reject `wisp_1`. Wired `attackFrame: 'beetle_s0'` as ONE non-directional pose (the `octorok_atk` shape, S90) rather than per-facing, since `beetle` only has a second pose for the SIDE facing — a charge triggered while facing down or up would otherwise show no telegraph at all. Left `beetle_s0` in the ordinary side-frames cycle too, same as `moblin_d1`/`siren_1`. **Verified in-engine with the AI actually triggering the charge** (player and enemy placed aligned and in range, not attackTime forced by hand) — the first `attackFrame` proof driven by the real AI decision rather than a manually-set field: `stun` and `attackTime` count down together for the full 16-frame window, the enemy stays frozen in place throughout (position unchanged) showing `beetle_s0` the entire time, both timers reach 0 on the same tick and the sprite correctly reverts to the ordinary walk cycle; a mid-windup non-lethal hit correctly interrupts to `beetle_hurt`. `check-drift` now reads `beetle: walk,attack,hurt,death` (6 of 22 complete, up from 5). validate/test(83/83)/check-feel all green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged — the `charge()` engine change didn't move any recorded plan. check-rippers 17/17 (`sprites-enemies.js` untouched — reuse, not new art). check-build OK, dist rebuilt. `darknut` (`tell: 22`) and `anglerfry` (`tell: 26`) remain, both already have `hurtFrame`+`deathFrame`, both now have `attackFrame` support available on the shared `charge()` primitive — next session surveys both for a `beetle_s0`-style reuse before assuming either needs hand-drawn art, the same discipline S89 used for the `shoot()` roster | S49 | `docs/NEXT-SESSION.md` (S94 entry) |
| `attackFrame` wired on the last 2 `charge()` users, `darknut` and `anglerfry`, closing that sub-thread entirely (mechanism built S94, piloted on `beetle`). Checked both for a `beetle_s0`-style reuse first, per the discipline S93/S94 established: neither qualified. `anglerfry_0`/`_1` differ only in a subtle lure-bob/mouth-chomp idle cycle (42 of 256 pixels, but concentrated in ambient breathing animation, not a distinct "about to lunge" shape) — rendered both from the real runtime `enemyb` palette to confirm rather than assume, the same test that correctly separated `siren_1` (a real reuse) from `wisp_1` (correctly rejected). `darknut` raised a genuine investigation, not just a quick check: `darknut_hurt`'s own existing comment (already committed ground, from S18's flinch-pose survey) names "a raised-sword windup, four side-lunge poses" as present on the sheet near this plate. Wrote a scratch script reusing `rip-enemies.py`'s own `find_boxes`/`strip_plates` functions to render a labelled contact sheet and re-examined those exact boxes with an ATTACK pose in mind rather than trusting S18's flinch-only conclusion to also settle this question. Result: INCONCLUSIVE, not a confirmed extraction — the boxes sitting directly below `darknut`'s 4 main frames (the same region `darknut_d1` already sources its own top half from, via an `ay: 0.0` window) are oddly-tall merged boxes, each showing what looks like a raised tan arm repeated near-identically under all four columns, which reads more like flood-fill bleed from an unrelated neighbouring sprite than four genuine distinct lunge poses of this knight. Declined to extract on that basis — CLAUDE.md is explicit that composited or guessed-at sheet content needs to be believed with real confidence, not assumed correct because a comment used the word "pose." Also noted, independent of the extraction question: this game's own `darknut` charges SHIELD-first (`ai()`'s own comment, `src/data/enemies.js`, says "advances with its shield up, then lunges"), not sword-first, so even a confidently-identified sword-raise pose would have shown the wrong weapon for this enemy's actual attack. Hand-drew both instead. `darknut_atk` widens `darknut_d0`'s own shield band (row 12 of its grid, `sprites-enemies.js`) from a 4-pixel red span to an 8-pixel span by recolouring the flanking black pixels to the shield's own red — reads as the shield braced wider and further forward, matching the actual charge rather than an invented sword-swing. `anglerfry_atk` widens `anglerfry_0`'s own fang row (rows 13-14) by the same 4-pixel technique, reading as the jaw opened wider than either existing idle frame ever shows. Wired `attackFrame: 'darknut_atk'` as ONE non-directional pose (the `octorok_atk`/`beetle_s0` shape) since only a front variant was drawn — `darknut_s0`/`s1` (side) have no equivalent — and `attackFrame: 'anglerfry_atk'` as a plain string (flat `frames` array, no facings). **Verified in-engine with the real AI actually triggering `charge()`** on fresh instances of both (the S94 technique, not `attackTime` forced by hand): both show their pose immediately, hold for their own `tell` (22 and 26 frames respectively, `stun` and `attackTime` in lockstep the whole time), and revert correctly on expiry; both correctly interrupt to their own `hurtFrame` on a mid-windup non-lethal hit. `check-drift` now reads `darknut: walk,attack,hurt,death` and `anglerfry: walk,attack,hurt,death` (8 of 22 complete, up from 6). validate/test(83/83)/check-feel all green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged, check-rippers 17/17 (`sprites-enemies.js` confirmed byte-identical — pure hand-drawn art and wiring, no extraction). check-build OK, dist rebuilt. **ALL 3 `charge()` users now have `attackFrame`, and combined with the `shoot()`/`shootRing()` roster (S88-S93), every ranged AND melee-lunge enemy in the game now telegraphs its attack.** The objective's remaining real gap is structural, not a missing wiring session: 9 pure-contact enemies (`crab`, `zol`, `gel`, `keese`, `leever`, `tektite`, `urchin`, `jellyfish`, `pincer`) have no `shoot()`/`shootRing()`/`charge()` at all, so there is no existing windup moment to hook `attackFrame` into — giving any of them a real "attack" state would mean inventing a new telegraph mechanism for whatever their contact-damage AI actually does, a design question, not a wiring one. `idle` states remain completely unaddressed roster-wide, the other still-open half of this objective's own done-condition | S50 | `docs/NEXT-SESSION.md` (S95 entry) |
| `attackFrame` support added to `hop()` (`src/game/enemy.js`) — a THIRD telegraph mechanism found already sitting in the engine, after `shoot()`/`shootRing()` (S88) and `charge()` (S94) — and piloted on `zol`. `hop()`'s own `_hopState` machine ('wait' then 'air') has a real pause before each jump, but unlike `charge()`'s `tell` (a short window that IS the entire pre-lunge freeze), `hop()`'s `wait` is the enemy's WHOLE rest period between hops (34-52 frames for the two current users, `zol`/`tektite`) — showing an attack pose for the entire wait would read as "always attacking" rather than a telegraph. Windowed the pose to only the LAST `ENEMY_ATTACK_FRAMES` of the wait (reused the existing constant rather than adding a new one — both current `wait` values comfortably exceed it, leaving a real rest beforehand). **Caught and fixed a genuine 1-frame phase lag by measuring, not assuming**: the first version triggered the pose at the same `_hopWait` value as the window length, but `Enemy.update()` decrements `attackTime` at the TOP of the frame (before `ai()`/`hop()` ever runs), while `_hopWait`'s own trigger decrement happens LATER in that same frame's `hop()` call — one tick out of phase. A scratch probe tracing `_hopState`/`attackTime` frame-by-frame across two full hop cycles caught the pose still showing for one frame after `_hopState` had already flipped to `'air'`. Fixed by triggering the window one tick earlier (`_hopWait === ENEMY_ATTACK_FRAMES + 1` rather than `=== ENEMY_ATTACK_FRAMES`) and reverified with the same probe: the pose now clears on the EXACT frame the transition to `'air'` fires, confirmed by comparing the last attack frame against the measured transition frame directly rather than trusting the arithmetic alone. Piloted on `zol`, a THIRD zero-new-art reuse (after `siren_1` S93, `beetle_s0` S94): `zol_1` is already described in `rip-enemies.py`'s own `FRAMES` comment as "round at rest, stretched tall mid-hop" — a real shape change from the wide, round `zol_0`, not a recolour. The windup now GUARANTEES that stretched pose shows before every hop, rather than it only appearing some of the time via ordinary tick-based cycling. `zol` has no `hurtFrame` (hp 2, always lethal under `swordDamage()`), so there was no hurt-interrupt case to test, but confirmed a LETHAL hit mid-windup still correctly shows `zol_death` (`dying` still beats `attackFrame` in `spriteName()`'s ordering) rather than freezing on the attack pose. `check-drift` reads `zol: walk,attack,death`. validate/test(83/83)/check-feel all green; `check-motion.mjs` (8/8, the lattice checker that specifically exercises ground-enemy stepping including hops) also green, run explicitly since this touched `hop()` itself. check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged. check-rippers 17/17 (`sprites-enemies.js` untouched — pure reuse and engine wiring). check-build OK, dist rebuilt. `tektite` (the other `hop()` user, also hp 2 with no `hurtFrame`) remains for a follow-up survey session. **This may be the last engine primitive with a free-standing unused windup** — no 4th movement mechanism with an unused pause is currently known. The real remaining gaps for objective #4 are the 7 pure-contact enemies with no windup-shaped primitive at all (`crab`, `gel`, `keese`, `leever`, `urchin`, `jellyfish`, `pincer`) and `idle` states roster-wide — both genuine design questions, not more wiring sessions | S51 | `docs/NEXT-SESSION.md` (S96 entry) |
| `tektite` wired (last `hop()` user, zero-new-art reuse of `tektite_1` — "the hop-apex tuck" per a passing mention in `zol_death`'s own comment, confirmed a real shape change: legs extended and dangling vs. `tektite_0`'s compact tucked stance), closing the `hop()` sub-thread entirely (all 3 windup mechanisms — `shoot()`/`shootRing()`, `charge()`, `hop()` — are now fully wired across every enemy that has one). **With real scope left in the session, read all 7 remaining pure-contact enemies' `ai()` FUNCTIONS in full** (not just their one-line descriptions) rather than stopping at "done for this prompt", and found TWO more windups already sitting in the engine, unrelated to any of the three named mechanisms. `keese`'s own rest/dash cycle is written directly in its `ai()` (not a shared primitive): it rests 60 frames then dashes 70. Added the same "telegraph only the last `ENEMY_ATTACK_FRAMES` of the pause" window `hop()` uses, INCLUDING the same `+1` phase correction `hop()` needed — measured again with a fresh scratch probe rather than assumed to carry over, and it did: any countdown decremented inside a function `ai()` calls, after `attackTime`'s own top-of-update decrement, apparently needs the same one-tick correction. Reused `keese_0` ("wings spread" vs. `keese_1` "wings folded", per `rip-enemies.py`'s own comment) — a fourth zero-new-art reuse. `pincer`'s `ai()` already sets `e.stun = 10` as an explicit windup immediately before it snaps out of its hole — a discrete ONE-TIME set, not a countdown loop, structurally `charge()`'s shape rather than `hop()`'s, so paired `e.attackTime = 10` alongside it with NO phase correction needed (and none applied) — confirmed both fields decrement in perfect natural lockstep since neither depends on a called function to advance, unlike `_hopWait`. Reused `pincer_1` (a genuinely curled/turned silhouette vs. `pincer_0`'s symmetric front-on stance). `pincer` already had BOTH `hurtFrame` and `deathFrame` extracted (`sprites-enemies.js`, not hand-drawn) from earlier sessions, so this one wiring instantly completed its full four-state set. **Verified all three in-engine with the real AI actually triggering each** (the S94-established technique): `tektite`/`keese` traced across multiple full cycles confirming exact 16-frame windows ending exactly on the state transition with zero overlap; `pincer` confirmed showing its natural lockstep. Interrupt cases: `tektite`/`keese` have no `hurtFrame` (hp 1/2, always lethal) — confirmed a lethal hit still shows the correct `deathFrame`, not a frozen attack pose; `pincer` DOES have `hurtFrame` — confirmed a mid-windup hit correctly shows `pincer_hurt`. `check-drift` now reads `tektite: walk,attack,death`, `keese: walk,attack,death`, `pincer: walk,attack,hurt,death` (COMPLETE) — 9 of 22 enemies with a full set, up from 6. validate/test(83/83)/check-feel/check-motion (8/8) all green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged, check-rippers 17/17 (`sprites-enemies.js` untouched — all three sessions' worth of work here was reuse and wiring, zero new art). check-build OK, dist rebuilt. **Also explicitly checked `leever` (`submerge()`+`chase()`, structurally like `wizzrobe`/`siren`) and RULED IT OUT** rather than leaving it an open lead: unlike `wizzrobe`/`siren` it never calls `shoot()`/`shootRing()` while surfaced, only `chase()`, so there is no existing `attackTime`-setting call to piggyback on. **Final honest tally for objective #4's remaining gap**: `crab`, `gel`, `leever` (checked, ruled out), `urchin`, `jellyfish` all genuinely have no discrete windup-shaped moment anywhere in their `ai()` — four mechanisms found and wired across this whole thread (`shoot()`/`shootRing()`, `charge()`, `hop()`, plus the two one-off `keese`/`pincer` patterns) and none apply to these 5. This is a confirmed structural wall, not an unchecked lead — giving any of them a real `attack` state means inventing a genuinely new pause-then-strike moment in one of their AIs on purpose, a design decision, or the objective should pivot to `idle` states instead | S52 | `docs/NEXT-SESSION.md` (S97 entry) |
| `spec.idleFrame` — the first `idle` sprite field in the roster — designed and piloted on `urchin`, following S53's scoping (see "Measured and rejected", below, for why the other 8 candidates stay blocked on art). `Enemy.spriteName()` (`src/game/enemy.js`) now checks `this.idle && this.spec.idleFrame` between `attackFrame` and the plain walk-cycle fallback — the same single-pose shape `attackFrame` already takes, gated on an explicit `this.idle` flag the enemy's own `ai()` sets directly each frame (never a generic "hasn't moved in N frames" timer, which S53 already ruled out: it would misfire on every walker's ordinary pause between lattice-step decisions). `urchin`'s `ai()` (`src/data/enemies.js`) sets `e.idle = g.tide.level < 1` — the exact condition that already decides whether it does anything at all. `urchin_idle` (`src/data/sprites-enemies-hurt.js`) is a real new pose, not a tiny edit: a first draft that only trimmed a couple of pixels off `urchin_0`'s crown rendered visually identical to it at actual size (caught by rendering both from the real palette side by side before committing, the same discipline every hand-drawn pose in this file uses) — the landed version blanks the crown's four tallest spike-tip rows outright, sitting visibly lower and flatter than `urchin_0`/`_1`'s full crown while keeping the notched shell texture distinct from `urchin_death`'s single smooth dome. Verified in-engine with a scratch probe forcing `game.tide.setLevel()` directly: LOW shows `urchin_idle` with `e.idle === true`; HIGH reverts to the ordinary walk cycle with `e.idle === false`; cycling back to LOW re-triggers it; a lethal hit taken while dormant still shows `urchin_death`, not the idle pose (the existing `dying`-before-everything ordering, unmodified). `tools/check-drift.mjs` updated to read `idleFrame` the same regex-on-the-real-field way it already reads `hurtFrame`/`attackFrame`/`deathFrame`, and its own header comment (which used to claim the engine "has no separate idle art") corrected — `urchin` now reports `walk,idle,death`. Zero regression: validate/test(83/83)/check-feel/check-motion(8/8)/check-items(91/91)/check-hearts(114/114) all green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged, check-rippers 17/17 (`sprites-enemies.js` untouched — the new art lives in the hand-drawn file, same as every other hurt/death/attack pose that needed one). check-build OK, dist rebuilt | S54 | `docs/prompts/STATE.md` session log, S54; `docs/ENEMIES.md`'s idle section |
| `urchin`'s "harmless on dry ground" claim (`docs/ENEMIES.md`) made literally true — found half-implemented while judging the other 8 idle candidates (S55) and fixed in the same session rather than deferred, since the fix turned out to be one line reusing an already-read engine flag. `Player.updateContactDamage` (`src/game/player.js`) skips a `harmless` enemy's contact damage, the same flag `submerge()`'s down/up cycle (`src/game/enemy.js`) already toggles for `leever`/`wizzrobe`/`siren` — nothing had ever set it for `urchin`, so a "dozing" one at LOW tide dealt its full contact damage on touch; only its movement (`wander`) was ever tide-gated. `urchin`'s `ai()` now sets `e.harmless` from the same `g.tide.level < 1` condition `e.idle` already uses — no new mechanism, no new field. Verified in-engine with a scratch probe placing the player directly on an `urchin` at each tide level: LOW takes zero damage, HIGH takes the normal 2 quarter-hearts; sword damage TO the enemy confirmed unaffected either way (`e.harmless` only gates the enemy's own contact damage OUTPUT). Zero regression: full sweep green and unchanged (`urchin` isn't on the playthrough route or any replay tape). check-build OK, dist rebuilt | S55 | `docs/prompts/STATE.md` session log, S55; `docs/NEXT-SESSION.md` S99; `docs/ENEMIES.md`'s idle section |
| **Full audit of all 22 `docs/ENEMIES.md` lessons against the real code**, following S99's accidental `urchin` find — read every lesson against `src/data/enemies.js`'s real `ai()`/`hurt()`/spec fields, checking each the way `urchin`'s was checked (actually enforced, not just plausible), confirmed with scratch probes (`tools/check-motion.mjs`'s own headless boot pattern) rather than reasoning alone. **Two real code bugs found and fixed**: `beamos` claimed "only fires straight along its own facing; step off its row or column and it's harmless" (a contrast this file's own "Why this ordering" section states explicitly against `barnacle`), but its `ai()` passed `aim: true` with no `aligned()` check at all — it fired a shot homing on the player's exact position at any range under 80px, on-axis or not. Confirmed with a probe: player 40px off both axes still took a hit. Fixed to match `octorok`'s own already-correct shape: `aligned(e, g, 14)` gates the shot (and sets `e.dir`), `shoot()` called with no `aim`. Reprobed: 0 off-axis hits, on-axis shot unaffected (`vy: 0`). `barnacle` checked too and is correct as shipped. `leever` claimed to spend "most of its time buried and untouchable," but its `submerge({ down: 70, up: 110, ... })` call had it surfaced (chasing, vulnerable) for the LONGER half of every cycle. A probe counting hidden-vs-up frames over ~11 cycles measured 38.5% hidden. Swapped to `down: 110, up: 70` (same 180-frame total) — reprobed at 60.5% hidden. `leever` is not on `check-playthrough.mjs`'s route or any `replay.mjs` tape (only named in a routing comment explaining why the route avoids it), so this carried none of the timing-drift risk flagged below under "Measured and rejected" for `deathFrame` additions. **One doc-only fix, the lesson was wrong, not the code**: `anglerfry`'s roster line claimed it "sits still like part of the scenery," but its actual idle behavior (`charge()`'s own `idle` callback, `wander(e, g, { speed: 0.35, turnChance: 0.02 })`) is genuine continuous movement — a probe measured ~82px of drift over 600 frames with no player nearby. Not a bug: the code's own comment already says "Drifts on its lure," and this file's OWN "Why this ordering" section already lists `anglerfry` among the enemies that are "never meaningfully still" — the roster table line contradicted this file's own later section, not just the code. Reworded the roster line to describe the actual, deliberate drift instead of nerfing movement to match an aspiration nothing else in the project shared. **The other 18 lessons read and checked out true**, including every `shield: 'front'` claim (`crab`/`beetle`/`darknut` — traced through `Enemy.hurt()`'s `opposite[dir] === this.dir` check against both a projectile's travel direction and a sword swing's `this.dir`, the player's own facing; both funnel into the same front-only block, confirmed consistent for both attack kinds) and every other aim-vs-axis claim (`octorok`, `octorokSea`, `moblin`, `wizzrobe`). Full regression: validate/test(83/83)/check-feel/check-motion(8/8) all green, check-playthrough 21/21 and replay.mjs 51/51 BOTH unchanged (neither enemy is on the route or a tape), check-rippers 17/17 (no generated sprite file touched — only `enemies.js` data and `ENEMIES.md` prose changed). check-build OK, dist rebuilt | S56 | `docs/prompts/STATE.md` session log, S56; `docs/ENEMIES.md`'s new "Audit" section |
| **Objective #4 (enemy-roster) CLOSED**, all four fields. `hurt`/`death`/`attack` are complete or hit a confirmed structural wall roster-wide (S25 hurt, S41 death, S52/S58 attack — `crab`/`gel`/`leever`/`urchin`/`jellyfish`/`stalfos` have no windup-shaped moment or, for `stalfos`, no attack at all by design). `idle`: S54 piloted `urchin` (the one candidate with a real dormant/awake design distinction); S55/S57 judged the other 8 against that same bar in two passes — a per-candidate design-merit read (S55, none clear it) and a genuine whole-sheet extraction re-audit (S57, 344 boxes on `oracle-seasons-enemies.png`, zero spare frames for any of the 8 anywhere on the sheet) — and both independently say no. S59 put the remaining question (hand-draw one anyway, despite neither test favouring it, or stop) directly to the person running these sessions rather than defaulting either way, per `docs/prompts/CHARTER.md`'s own "one judgement call" clause. **Answer: leave it alone, and mark the objective done.** `urchin` stays the only `idleFrame` in the roster. `OBJECTIVE OF RECORD` advanced to #5 (npc-detail) in the same session | S59 | `docs/prompts/STATE.md` session log, S59; `docs/ENEMIES.md`'s "Idle states" section |
| **Objective #5 (npc-detail)'s first measurement**: `tools/check-drift.mjs` given an npc-detail section reading `MAPS` directly (every `'npc'`/`'trader'` entity, overworld and interiors, identity = the field that actually names the character — `dialogue` for an npc, first `deals[].text` for a trader) and `docs/NPCS.md` written from the same data. Found the objective's two halves are NOT equally open: dialogue states are already done roster-wide (22 of 22 have >=2 — every ordinary villager already carries an Essence-gated second line, every trader already has waiting+trade+after). Sprite uniqueness is the real gap: 7 of 22 unique, 6 sprites shared across 15 identities. Of those 6 groups, 5 are generic-archetype reuse with no in-fiction reason (`npc_fisher` covering 4 separate people — Mirren/fisher1/Teel/Ossa — is the worst case) and one (`npc_salter_d`, `shoreSalter`/Hulla) spreads the same `FOLK.salter` preset on purpose, matching both characters' own dialogue lines identifying them as Salters — flagged as a possible deliberate clan uniform rather than defaulted into a fix. Also found, by diffing every name `rip-npcs.py`/`rip-races.py` emit against every placement in `overworld.js`: three sprites (`npc_elder`, `npc_zelda`, `npc_brinewife`) are already extracted and completely unused — a zero-art-cost fix for up to 3 of the 5 real gaps, left for the next session to actually wire in rather than done here (this session was the count, not the fix). Zero src/ changes outside the one metric addition. Full regression: check-drift self-checks OK, test.mjs 83/83, check-playthrough 21/21, npm run build (dist unchanged — `tools/` isn't bundled) | S60 | `docs/prompts/STATE.md` session log, S60; `docs/NPCS.md` |
| Three already-extracted, already-unused NPC sprites (`npc_elder`, `npc_zelda`, `npc_brinewife`) spent to break 3 of S60's 6 sprite-reuse groups, zero new art: `hearthWife` `npc_villager2`->`npc_brinewife` (also fully clears `villager2`'s old collision), Ossa `npc_fisher`->`npc_zelda` (also fixes her reading as a man despite her own lines identifying her as a woman; trims `npc_fisher`'s group 4->3), `sandpiper` `npc_villager`->`npc_elder` (also fully clears Dov's old collision, fits her `netMender` line addressing the player as "boy"). Each confirmed in-engine with `tools/shoot-rooms.mjs`, screenshotted, rendering correctly and visibly distinct from the sprite it replaced. `npc_salter_d` (`shoreSalter`/Hulla) deliberately left alone — both spread the same `FOLK.salter` preset and both characters' own dialogue lines self-identify as Salters, read as a likely-deliberate clan uniform rather than a mistake, flagged for the person running these sessions per the idle-art precedent rather than defaulted into a fix. `check-drift` reads 12 of 22 unique, up from 7. Full regression: check-drift self-checks OK, `test.mjs` 83/83, `validate.mjs` OK, `check-playthrough.mjs` 21/21, `check-rippers.mjs` 17/17, `npm run build` (dist changed) | S61 | `docs/prompts/STATE.md` session log, S61; `docs/NPCS.md`'s "Landed — S61" section |
| A genuinely new NPC extraction, `npc_fisher2` (`tools/rip-npcs.py`, sheet index 69 — found by rendering and looking at all 71 unclaimed blobs on `oracle-seasons-npcs.png`, not just the ones near `npc_fisher`'s own block, per `docs/ENEMIES.md`'s S57 whole-sheet lesson). A genuinely different silhouette (both arms low holding a basket) from `npc_fisher`'s arms-at-sides stance, not a recolour. Assigned to Mirren, whose own dialogue is about carrying catch to the reef — a thematic fit, not just a technical one. Confirmed in-engine (`tools/shoot-rooms.mjs overworld,5,7`, screenshotted). Two other candidates from the same pass (indices 9 and 16) were looked at closely and REJECTED — one an arm-raised action pose, one a possible helmeted/armoured face — rather than extracted on a guess, per CLAUDE.md's Goal 1 register concern. `oracle-seasons-nonhuman-races.png` (`npc_hood_blue`'s source) confirmed via `rip-races.py`'s own header to hold only the 4 canonical silhouettes, all already used — no extraction path exists for that group. `npc_fisher`'s group trims 3->2; `check-drift` reads 13 of 22 unique | S62 | `docs/prompts/STATE.md` session log, S62; `docs/NPCS.md`'s "Landed — S62" section |
| **Objective #5 (npc-detail) CLOSED.** Dialogue states complete roster-wide since S60. Sprite uniqueness reached 13 of 22 after S61 (3 free sprites) and S62 (1 new extraction, plus confirming both source sheets — the NPC sheet and the non-human-races sheet — hold nothing further usable). The remaining 9 identities (`npc_fisher` 2, `npc_child` 3, `npc_hood_blue` 2, `npc_salter_d` 2) would need genuinely hand-drawn art. Put to the person running these sessions directly (the same posture `docs/ENEMIES.md`'s idle-art question used, per `docs/prompts/CHARTER.md`'s "one judgement call" clause): leave them as they are. `OBJECTIVE OF RECORD` advanced to #6 (region-art) in the same session | S63 | `docs/prompts/STATE.md` session log, S63; `docs/NPCS.md`'s closure note |
| **Objective #6 (region-art)'s first real rows**: the four Tidewatch Village screens (`overworld` 0,4,7 / 0,5,7 / 0,4,8 / 0,5,8) audited against `docs/ART-DIRECTION.md` — screenshotted at all 3 tides, every ground-type boundary zoomed and checked for a composited edge rather than a hard pixel cut (all clean, consistent with the S39 "shore has a rim" landed fix), every sprite checked for register consistency. One ambiguous case resolved by zooming rather than judged from the thumbnail: Driftwood Strand's small dark-teal bush beside a tree crown is a genuinely different decoration class (bush vs. tree), not a palette mismatch. Zero defects found in any of the 4 rooms — 4 honest "checked, nothing wrong" verdicts written to `docs/AUDITED-ROOMS.md` rather than invented findings. Also fixed a stale "rotation objective #2" reference in that file's own header (region-art is #6 in the current rotation) while touching it. `check-drift` reads 4 of 120. Zero `src/` changes — no defect meant nothing to fix | S64 | `docs/prompts/STATE.md` session log, S64; `docs/AUDITED-ROOMS.md` |
| Six more region-art rows (the ring around Tidewatch Village: West Bluff, Sunken Reef, Shallows Gate, Shell Beach, East Strand, Dune Crossing). One real finding, correctly triaged as NOT a new defect: West Bluff's tide pool has a hard, rim-less edge against sand on two sides — checked against `docs/ART-BACKLOG.md`'s own "shore has a rim" entry and confirmed it matches the already-documented "narrow channel" degenerate case (a water cell one tile wide with land on both opposite sides shows the rim on only one edge), not a fresh regression. Every OTHER hard water edge in the batch confirmed to be deep water (`waterD`), which that same fix deliberately excludes. Palm trees (Shallows Gate, Dune Crossing) zoomed and checked against `docs/ART-DIRECTION.md`'s outline/shading rules — clean. `check-drift` reads 10 of 120. Zero `src/` changes | S65 | `docs/prompts/STATE.md` session log, S65; `docs/AUDITED-ROOMS.md` |
| Six more region-art rows, the first batch outside the village's coast palette: Bog Causeway/Sunken Reeds (`marsh` legend), Grotto Approach/Mouth (`dunes` legend), Fishing Stones/South Sands (`coast`, a control pair far from the village). Confirmed by zooming: `grassBog` is a genuinely distinct dark-olive reed texture, not grass recoloured, and correctly gets the composited shore rim against shallow water on both a horizontal and vertical edge. `dunes` turned out to share `coast`'s visual palette exactly (same sand-ripple/palm-corner look already seen) — checked closely and judged a deliberate shared desert aesthetic rather than a copy-paste mismatch, written into the verdict explicitly rather than left ambiguous. Every water edge in the batch matches the established shallow=rimmed/deep=hard pattern. `check-drift` reads 16 of 120 (12 Tidewatch Village / 2 Marsh / 2 Dunes). Zero `src/` changes | S66 | `docs/prompts/STATE.md` session log, S66; `docs/AUDITED-ROOMS.md` |
| Three already-extracted, already-unused NPC sprites (`npc_elder`, `npc_zelda`, `npc_brinewife`) spent to break 3 of S60's 6 sprite-reuse groups, zero new art. `hearthWife` (houseHearth) `npc_villager2`->`npc_brinewife`; Ossa (houseNets) `npc_fisher`->`npc_zelda` (also fixes her reading as a man despite her own lines identifying her as a woman); `sandpiper` (houseSandpiper) `npc_villager`->`npc_elder` (fits her `netMender` line addressing the player as "boy"). Each is a one-line `sprite:` edit in `src/data/overworld.js`, confirmed in-engine with `tools/shoot-rooms.mjs` afterward — screenshotted, rendering correctly and visibly distinct from the sprite it replaced. `npc_villager2` and `npc_villager`'s old collisions are now FULLY cleared (both other halves, `villager2` and Dov, are unique on their own). `npc_fisher`'s group trimmed 4 -> 3. Confirmed via `python3 tools/rip-npcs.py`/`rip-races.py` (byte-identical before touching anything, CLAUDE.md's own extraction discipline) that these three sprites really were sitting unused, not a misread. **One group deliberately left alone**: `npc_salter_d` (`shoreSalter`/Hulla) — both spread the same `FOLK.salter` preset and both characters' own dialogue lines self-identify as Salters, read as a likely-deliberate clan uniform rather than a mistake; flagged for the person running these sessions rather than defaulted into a fix, following the idle-art precedent (S59) without re-spending a question on it since the reasoning was already written down and the choice is low-stakes and reversible either way. An informal (not exhaustive) sheet scan for the remaining `npc_fisher`/`npc_child` gaps found mostly walk-cycle repeats plus unrelated soldier/Zora/Subrosian art on the same sheet — one unconfirmed recolour candidate flagged in `docs/NPCS.md` rather than extracted on a guess. `check-drift` now reads 12 of 22 unique sprites, up from 7. Full regression: check-drift self-checks OK, `test.mjs` 83/83 (0 unauthored art names), `validate.mjs` OK, `check-playthrough.mjs` 21/21, `check-rippers.mjs` 17/17 (no generated file hand-edited — both rippers re-run and re-verified byte-identical, this session's reassignments only ever changed which already-emitted name `overworld.js` points at). `npm run build` re-run, `dist/` changed this time (the sprite reassignments live in `src/data/overworld.js`, which IS bundled) | S61 | `docs/prompts/STATE.md` session log, S61; `docs/NPCS.md`'s "Landed — S61" section |
| **New CLAUDE.md rule, and the first sweep against it**: a ledge only belongs at a real elevation change (a cliff, terrace or bank) — never floating alone in the middle of flat, open ground, which the source games never do. The person running these sessions flagged this directly rather than a session finding it. A grep for "ledge legend char present, but zero cliff chars anywhere in the room's own grid" turned up exactly 4 rooms, all previously reviewed and all previously cleared as "reads clean" because that review only ever checked whether the LEDGE ART ITSELF was correctly drawn, never whether the room around it gave it a reason to exist: Wood Edge (`0,4,3`), Wood Heart (`0,5,5`), Dune Head (`0,7,6`), Dune Bowl (`0,9,7`). None of the four runs was load-bearing for connectivity — every room already had an open path around it — so each run was leveled to its own immediate neighbour's floor tile (mud, grassDark, sand, sandDeep respectively) rather than routed around with the tool. Confirmed in-engine with `tools/shoot-rooms.mjs`: all four now read as plain, continuous ground with no stray lip. `docs/AUDITED-ROOMS.md`'s four rows revised in place (dated, marked **Revised**, old verdict's blind spot named explicitly) rather than silently overwritten. Full regression: `validate.mjs`, `check-overworld.mjs` 17/17, `check-strands.mjs` (unchanged baseline — removing a one-way restriction can only add reachability, never remove it), `check-placement.mjs`, `check-ground.mjs`, `test.mjs` 83/83, `check-playthrough.mjs` 21/21, `check-drift.mjs` self-checks OK (audit count unchanged at 66 — four revisions, not four new rows), `npm run build` (dist changed) | direct request, 2026-09-16 | CLAUDE.md's "Traps" section, new bullet after "A ledge is solid from three sides"; `docs/AUDITED-ROOMS.md`'s four revised rows |
| **Objective #7 (item-reuse)'s first landed example: the Anchor's first reuse outside D1.** D2's Bone Cell (`0,2,6`, a side room off Coral Landing that `tools/playthrough-route.mjs` never visits) given the same `dWell`/`dDrain` pairing as Tidewash Grotto's Iron Pipe, each half widened to 3 tiles (a 2-tile-wide half is hoppable straight across — `HOP_TILES` is 2 — so the earlier 2+2 draft failed `check-anchor.mjs`'s own "conch alone does not cross it" assertion; 3+3 fixed it). The room's existing `blank` pickup moved behind the gate rather than a new item invented. `tools/check-anchor.mjs` proves both directions (16 of 16 now, up from 14). `check-drift.mjs` reads `anchor dungeons: 1 of 5` (up from 0). Full regression confirmed the room really is off the critical path: `check-progression.mjs` and `check-playthrough.mjs` both byte-identical to before this session (19/19, 21/21) | S90 | `docs/DUNGEON-STATUS.md`'s "D2's Bone Cell now reuses the Anchor (S90)" |
| **The Reefseed's first reuse outside D5**, and the real ceiling for it under the current tool. A new room, `0,4,2` "The Bole Cistern", added to D6 off Dredge Vault's own north wall (previously fully solid on both of its top two rows — the standard 2-row gap convention needs BOTH rows opened, not just the outer one, the bug the first `walk-dungeons.mjs` run caught). The fixture inside is the Drowned Wood Shrine's own, copied unchanged (bole/stake/snarl at the same relative coordinates as D5's own Grove 2, "The Bole Walk"): `dungeonAbyss` repoints `5`→`dSnag` and `k`→`dSnarl`, the same two characters D5's `dungeonWood` legend repoints, both confirmed free in every d6 room before this. `tools/check-reefseed.mjs` passes 102 of 102 on the new room's first run. `check-drift.mjs` reads `reefseed dungeons: 1 of 5` (up from 0) — and D6 is the only dungeon after D5, so 1 of 5 is this rotation item's real ceiling under `check-reefseed.mjs`'s own `r.index < 5` filter, not a shortfall. Full regression: `walk-dungeons.mjs` (27 rooms now, up from 26), `check-dungeon-strands.mjs` (two pre-existing 1-cell regions confirmed unrelated by an A/B `git stash` run, no new multi-cell region), `check-progression.mjs` 19/19, `check-placement.mjs`, `check-ground.mjs`, `check-playthrough.mjs` 21/21, `test.mjs` 83/83, `check-build.mjs` OK, `dist/` rebuilt | S96 | `docs/DUNGEON-STATUS.md`'s D6 section, "A 27th room..." |

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

- **OBJECTIVE 1 (wide-rooms) IS MET, S111.** D3 Eel Hall (`0,5,3`, 3x1), D4
  The Cistern Floor (3x1), D5 The Shrine Ford (3x1), D6 Tideshade Hall (2x2).
  D1 and D2 keep their 2x1s and are not owed one.
- **OBJECTIVE 8 (feel-measure) CANNOT BE STARTED — human, S111: there is no
  emulator capture available to these sessions.** `measured` means somebody
  frame-stepped a reference; `check-feel.mjs` refuses the tag without one, and
  relabelling to make a number go up would destroy the file permanently. Do
  not re-open 8 without a capture in hand.
- **A torrent may not stand in a room that does not declare a `cleatRoom`.**
  `check-cleats.mjs` enforces it, and it is right to: a current nothing proves
  a way past is a wall somebody forgot about.

- **OBJECTIVE 7 (item-reuse) IS CLOSED.** All four single-use items met their
  amended done-conditions: Lens S105 (2 dungeons; its overworld half is void
  by `docs/ITEMS.md`), Reefseed S108, Bellows S109, Anchor S110. Do not
  reopen it and do not build a fourth fixture for any of them.
- **The Anchor is DONE at 1 dungeon plus 3 overworld screens — a human
  amendment, S110, the same shape as the Lens's at S104.** Its dungeon half
  CANNOT move: from D3 on the player swims, base HIGH already reaches
  anywhere an anchor could, and `check-anchor.mjs` fails any such declaration
  by design over the engine's own tile table. D2 is the only dungeon in
  between and it already holds the one. The three overworld screens are
  `0,9,9` Deep Bar, `0,6,9` Reef Pocket and `0,0,9` Bog Foot.
- **An outdoor anchor gate needs `seaDrain` and there is no way round it.**
  Every other outdoor tide tile in the game is open on foot at LOW, so base
  LOW answers any run of them and the conch always wins. `seaDrain` (`$`) is
  `dDrain`'s outdoor twin — shut at LOW, wadeable at MID, deep above — and it
  is the only outdoor tile with that shape. An outdoor bar must also put its
  LOW-only run FIRST, beside where the player stands: the patch pins the
  level the sea was at BEFORE the bite, so the far arrangement is
  unanswerable however plausible it looks written down.

- **The Bellows' share of objective 7 is MET, and every outdoor Bellows
  fixture is an `at: 2` fixture.** S109 landed three overworld wheels —
  `0,3,3` Cliff Face, `0,3,0` Rustfall, `0,0,3` Cistern Path — so
  `check-drift` reads `bellows ... dungeons: 2 of 5, overworld screens: 3`.
  Do not rebuild them, and do not go looking for a MID or LOW outdoor
  fixture: "a shelf reachable at exactly one tide level" is expressible out
  of doors only with `drownWall`, the one tile that is solid at some levels
  and open at others, and it opens at HIGH alone. Rejected on the way:
  water as the outdoor barrier (the Cleats predate the Bellows, so deep
  water is floor); a one-tile chasm as the barrier (the Loft clears it).
  A chasm two tiles wide is the barrier, and **a pit does not stop the cone**
  — human call, S109, and already what `coneCovers` did, since it stops on
  `F.SOLID | F.VOID` and a chasm carries neither.

- **A sealed Bellows shelf belongs in the OVERWORLD strands baseline**, for
  the same reason S108's grove pocket belongs in the dungeon one. A chasm
  cell reads as foot-passable to `check-strands` (not SOLID, not `F.PIT`),
  so each fixture strands 4 cells: the shelf, the two fissure cells and the
  wheel bar. Recorded, not opened. Opening a second way in would break
  `check-bellows`' clause 6 — the stand is reachable only while the wheel is
  drowned — which is the whole fixture.

- **The Reefseed's share of objective 7 is MET, and a sealed Reefseed pocket
  belongs in the dungeon-strands baseline.** S108 landed D2's Whelk Hollow
  (`1,5,5`), the optional early grove S107's filter change made lawful, so
  `check-drift` reads `reefseed ... dungeons: 2 of 5, overworld screens: 3`.
  Do not build a second early grove to "make sure" — the done-condition is a
  number and it is met. Two things that were learned building it and should
  not be re-derived: a THEMED grove needs its own bar and its own kelp, and
  both come from the dungeon's OWN material by the Abyssal Keep's `dLintel`
  argument, never from the Drowned Wood's `dSnag`/`dSnarl` (those drag the
  Shrine's flagstones and a brown oak ramp into whatever room they land in);
  and a grove whose far pocket has no second exit is 7 cells
  `check-dungeon-strands` can never reach, because its flood does not model
  cutting a snarl from a grown pillar. That is a baseline entry, the same as
  the Abyssal Keep's grate strip, not a bug and not a reason to open a second
  way into the pocket — opening one fails the prover's "the snarl is the only
  way to the far side" clause.


- **An enemy with hp <= the player's current `swordDamage()` can never show
  a `hurtFrame`** — ruled out for `gel`/`keese` specifically (both hp 1),
  and for any future enemy at sword level 1 with hp <= 2. `Entity.hurt` sets
  `flicker` and, since `hp<=0`, calls `die()` (`remove=true`) in the SAME
  call; `Game.updatePlay`'s entity filter runs unconditionally at the end of
  that same frame (hitstop only skips FUTURE frames, not this one), so the
  entity is out of `game.entities` — and therefore never drawn again — before
  the flicker window gets a single frame to render on. Verified in-engine
  both ways in the same session: `wisp` (hp 3, `hurtFrame: 'wisp_hurt'`
  added S12) visibly shows the flinch pose for its whole 24-frame flicker
  window and survives; a `gel` given a test `hurtFrame` never draws it once
  — confirmed `remove: true` and absent from `game.entities` from the very
  frame `hurt()` ran. Do not add `hurtFrame` to any enemy without first
  checking hp against `swordDamage()` (`src/game/player.js`).
- **That hp constraint does NOT carry over to `deathFrame`** — checked and
  ruled out, not assumed. `hurtFrame` needs survival PAST the killing hit
  (the flicker window has to still be running on a later frame); `deathFrame`
  is read starting on the hit that brings hp to 0, and `Enemy.die()` defers
  removal itself rather than relying on the entity surviving on its own, so
  a 1-hit kill stalls exactly like a 3-hit one. `gel`/`keese` (hp 1, ruled
  out for `hurtFrame` above) are equally valid `deathFrame` candidates.
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
- **Hand-drawing `idleFrame` art for `beamos`, `barnacle`, `wizzrobe`,
  `siren`, `keese`, `zol`, `tektite`, `pincer`.** Ruled out on two
  independent grounds, neither art alone: none of the 8 clears `urchin`'s
  own bar of teaching a real dormant/awake distinction (their stillness is
  either uniformly dangerous or already read through ordinary movement —
  full reasoning in `docs/ENEMIES.md`'s "Idle states" section), AND a
  whole-sheet search of `oracle-seasons-enemies.png` (all 344 boxes, not
  just each candidate's own plate) found zero unclaimed frames for any of
  them — every same-palette box elsewhere on the sheet is visually a
  different creature entirely. `urchin` is the only enemy this roster's
  `idleFrame` lands on; objective #4's "every enemy has idle/.../death"
  done-condition cannot be met for `idle` without a from-scratch
  hand-drawing effort across all 8, which is a call for the person running
  these sessions, not a default. Do not re-run this search a third time
  without a stated reason the whole-sheet pass could have missed.
- **Giving `stalfos` an `attackFrame`.** It was never named in S52/S97's
  "confirmed structural wall" list for `attack` (`crab`, `gel`, `leever`,
  `urchin`, `jellyfish`, above) even though `check-drift.mjs` has shown it
  missing `attack` the whole time — an unenumerated case, checked and
  closed by a later session. `stalfos.ai()` is `flee` under 26px, `chase`
  otherwise (`src/data/enemies.js`) — both pure movement (`src/
  game/enemy.js`), no `shoot`/`charge`/`hop`, no `attackTime` set anywhere.
  Same shape as the other 5, and `docs/ENEMIES.md`'s own "Why this
  ordering" section already says so in plain language, predating this
  check: "`stalfos` retreats with no attack at all, purely to deny a
  swing." The structural-wall list for `attack` is now 6: `crab`, `gel`,
  `leever`, `urchin`, `jellyfish`, `stalfos`.
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
- **Wiring `idle` sprite states onto the 8 enemies OTHER than `urchin`
  right now** (`urchin` itself was piloted in a follow-up session — see
  "Landed", below) — scoped, not found unworkable in shape, but blocked
  on art. Read every one of the 22
  `ai()` functions in `src/data/enemies.js` and found 9 enemies with a
  genuine standing-still state distinct from walk/attack (`beamos`,
  `barnacle`, `wizzrobe`, `siren`, `keese`, `zol`, `tektite`, `pincer`,
  `urchin`) and 13 that are never meaningfully still. For every one of the
  9, re-checked `tools/rip-enemies.py`'s own coordinate-map comments for a
  spare sheet frame near that enemy's block — the exact method that found
  every `attackFrame`/`hurtFrame`/`deathFrame` reuse this objective has
  landed so far — and every candidate frame those comments already name
  (`beamos` box 20, `barnacle` box 144, `urchin` box 295, `wizzrobe` box
  338, `pincer` boxes 232/235) is already spent on that enemy's own
  `attackFrame`/`hurtFrame`/`deathFrame`; `keese`/`zol`/`tektite`/`siren`
  never had a third frame to begin with. Zero unclaimed art remains for any
  of the 9. A follow-up session then judged the 8 (all but `urchin`)
  against `urchin`'s own bar — does a distinct pose actually teach the
  player something, not just "is there a spare frame" — and found NONE of
  them clear it independent of the art question: `beamos`/`barnacle` have
  no safe/dangerous sub-state at all (always capable of firing when
  aligned); `wizzrobe`/`siren`'s surfaced window is uniformly dangerous on
  a plain timer with no range check; `keese`/`zol`/`tektite`'s stillness
  already reads as "safe" through ordinary movement, making a separate
  pose redundant; `pincer`'s lesson comes from watching its reach, not a
  resting pose. **Do not pilot `idle` on any of these 8 without either a
  sheet re-audit turning up new art AND a fresh design case, or a reason
  this per-enemy judgement got wrong — "there might be a spare frame" is
  not enough on its own anymore.** Full scope, the per-enemy art table,
  the `spec.idleFrame` shape actually landed on `urchin`, and this
  judgement pass are all in `docs/ENEMIES.md`'s "Idle states: scoped, then
  piloted on one enemy" section, not repeated here | `docs/prompts/
  STATE.md` session log, S53 (scoping), S54 (`urchin` pilot), S55 (this
  judgement pass) |

---

## Known and deliberately unfixed

- **Three region-art visual patterns that look like defects on a screenshot
  and are not, traced to source in S72 (`docs/prompts/STATE.md`) so a future
  audit doesn't re-spend time on them:** a grey blob under a flying enemy
  (`keese`, `wisp`, ...) is that enemy's own ground shadow (`this.shadow =
  this.flying`, `src/game/enemy.js`), not a stray prop; a decorative sprout
  appearing over a `grassDark` cell only at MID/HIGH tide is a randomised
  `grassTuft` variant the shore-`family` rendering picks once the cell's
  neighbour is actually wet, not a glitch; and an enemy standing in a `waterD`
  cell that visually overlaps the tree canopy from the row below is
  `Room.quadCanopySolid` (`src/world/room.js`) deliberately keeping a WET
  cell's overhang passable at every tide ("a canopy over a stream is a
  branch reaching over the water, and swimming under it is what the source
  draws") — the enemy is reachable, not stranded.
- **A cave mouth's ceiling drips a white splash particle onto the pool below it (Palace Mouth, S77)** — a transient animated effect, not a static art defect. Don't re-flag it.
- **S76's ledge-violation sweep ("zero cliff chars anywhere in the room") has a real blind spot, found and fixed in S77**: it misses a room whose only cliff chars are the map's own border wall, which is every room. Spire Shallows had a genuinely stranded ledge (open sand on both sides, no elevation change) that the grep didn't catch for exactly that reason. Judge each ledge by what's actually adjacent to it, not by whether the room contains a cliff char anywhere at all — Drowned Steps' ledge sits right below a `tideRock` shelf and is the correct, deliberate use of the same tile.
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
- **`tools/check-anchor.mjs`'s whitelist gap (S90) is fixed (S91):** the
  `late` filter now reads `r.mapId !== 'overworld' && !['d1',
  'd2'].includes(r.mapId)`, confirmed still 16/16 on the existing d1/d2
  rooms. This entry is closed.
- **What is NOT fixed, and cannot be inside `tools/lib/collision.mjs`'s
  current rule set: no overworld `anchorGate`/`anchorGauges` can actually
  be built, because `check-strands.mjs` and `check-overworld.mjs` will
  always call it a stranding.** Found S91 building a real test case
  (Kell Spur, `0,3,5`) and confirmed empirically, not just by reading code.
  Every dungeon `anchorGate` pairs a tile walkable ONLY at LOW with one
  that's a `dPit` (refused by `ROUTE_AVOID`) at LOW and walkable ONLY at
  MID — two disjoint walkable sets, so no global tide level crosses both.
  The outdoor `base` legend has no such pair: `sandbar`, `tidePool`,
  `shoal`, `seafloor`, `channel`, `reefFlat`, `reefDeep`, `tideRock` and
  `tideGrass` are ALL walkable at LOW (`F.PIT`/`F.HAZARD` exist on exactly
  two tiles in the whole game, both indoor — `spikes`, `dPit`), so any
  corridor built from them crosses at plain `base = LOW` with no anchor
  needed. The one outdoor tile that's never walkable on foot at any level
  is `drownWall` (solid at LOW/MID, deep at HIGH) — and `check-anchor.mjs`
  itself WOULD accept it (its hop model treats anything non-`VOID`/
  non-`SOLID` as hoppable, so `drownWall`-at-HIGH counts). But
  `check-strands.mjs`'s and `check-overworld.mjs`'s own hop model
  (`isGap`/`hoppable`) checks `F.JUMPABLE` specifically, a flag that
  exists on exactly the two `chasm` tiles in the game and never on water —
  so in THEIR model `drownWall` is a wall at every tide level with no
  exception, and anything sealed behind one reads as a newly stranded
  region and fails outright (verified: sealing Kell Spur's other approaches
  behind one `drownWall` tile with a `channel` beyond it produced exactly
  one new 8-cell `FAIL` in `check-strands.mjs`, reverted immediately after
  confirming it). This is why all eight existing overworld `drownWall`
  placements always leave a walkable margin around them instead of using
  them as the only crossing — the region's actual design (walk the margin,
  or swim at HIGH once the Cleats exist) already routes around exactly
  this limitation. A future session would need to either teach
  `check-strands.mjs`/`check-overworld.mjs`'s hop model about
  `drownWall`-at-HIGH specifically (not deep water generally — swimming
  already crosses deep water; this is the narrower "hoppable without
  swimming" case the anchor puzzle depends on), or give `check-strands.mjs`
  a baseline-recording mechanism like `tools/dungeon-strands-baseline.json`
  already has for its dungeon counterpart. Either is a real tool change
  outside item-reuse's file allowlist, and a bigger scope than a single
  detour token was meant to cover — this may be worth raising as a
  rotation-level question rather than another detour.
- **`check-lens.mjs` cannot prove a Lens fork outside D2, full stop — found
  S92, no test case needed, it is right there in the tool's own filter.**
  Unlike the Anchor's whitelist (a hardcoded array missing a case, fixed
  S91), this one is an unconditional assertion: `strays = rooms.filter(r =>
  r.mapId !== 'd2')` fails the run for ANY declared `lensRoom` whose map
  isn't `'d2'` — a dungeon room, an overworld screen, doesn't matter, and
  it doesn't matter whether the room's own reachability model would even
  need swimming or the Anchor. The tool's own header says this is
  deliberate ("The assertion that every declared lensRoom is in D2 is what
  will catch a later dungeon that needs this relaxed"), not an oversight —
  so unlike S91's fix this genuinely needs a scope decision plus a model
  change (the flood has "NO SWIMMING and NO ANCHOR" written into it, so a
  Lens room in D3+ would need those verbs added too), not a one-line
  unblock. Left untouched; no detour token existed to spend on it (0,
  per STATE.md). **Checked the other three gate checkers while here, since
  the fix (if any) is the same shape of tool change and it's worth knowing
  which items are actually reachable first:** `check-bellows.mjs` and
  `check-reefseed.mjs` use `r.index < HOME.dungeon.index` (or an
  equivalent), which blocks only EARLIER dungeons, not a hardcoded map —
  so a `bellowsRoom` in D5 or D6 (both index > D4's) is not structurally
  blocked the way a `lensRoom` outside D2 is. `check-cleats.mjs` has no
  index restriction at all, which is why Cleats already reused into D1/D2
  as backtrack content. Bellows can reach exactly the rotation's ">=2 later
  dungeons" bar (D5 and D6, its only two candidates) with no tool change.
  Reefseed cannot: home is D5, so `index < 5` leaves only D6 as a legal
  dungeon, one short of ">=2" — the same shape of ceiling as the Lens,
  just less immediately absolute. Full writeup: `docs/NEXT-SESSION.md` S92.
  **S93 acted on this:** built D5's Bower Cell as the Bellows' first room
  outside D4 (`check-bellows.mjs` 69/69 first run — same geometry as D4's
  Squall Loft, just relocated), so `bellows dungeons` is now 1 of 5, not
  0. D6 still needed for the rotation's ">=2" bar; its own remaining side
  rooms mostly belong to the Dredge Line's mooring fixture or hold
  required items, so the next one needs picking with more care than Bower
  Cell did. See `docs/NEXT-SESSION.md` S93.
  **S94 closed the dungeon half:** a second sill in D6's West Crypt
  (`check-bellows.mjs` 78/78 after one real iteration — the cone's
  diagonal reach at range 2 caught a stand two tiles off-axis at LOW,
  fixed by walling the shared line-of-sight midpoint), so `bellows
  dungeons` is 2 of 5 — the rotation's own bar. Bellows' overworld half
  (0 of the required 3) was still open, blocked at the filter level by a
  bug, not a design decision: `check-bellows.mjs` computed `index:
  (m.dungeon && m.dungeon.index) | 0` for every room, so an overworld
  screen (no `m.dungeon`) always computed `index: 0`, which its own `early
  = rooms.filter(r => r.index < 4)` clause then rejected as "before the
  Bellows" — the identical shape of gap S91 found and fixed in
  `check-anchor.mjs`. **S95 fixed this one-line bug**
  (`r.mapId !== 'overworld' && r.index < 4`, mirroring `check-anchor.mjs`'s
  `late` filter; confirmed 78/78 unchanged on the existing D4/D5/D6 rooms)
  **and then found the real blocker underneath it, which the filter fix
  does not touch:** every dungeon Bellows wheel is boxed by wall on three
  sides and `dPit` on the fourth, because `dPit` is the one tile in the
  game that is impassable in every mode (foot, swim, sink) at every tide
  level while NOT being `F.SOLID` — so a body can never stand there, but
  the cone's `solidAt` line-of-sight check still passes over it. Outdoors,
  nothing has that exact combination (confirmed by grep, not assumed):
  solid rock blocks the cone the same as it blocks a body; a `chasm`
  (`F.JUMPABLE`) is a gap the flood's own hop model crosses, so the far
  side becomes reachable by jump; deep water is impassable on foot but
  swimmable, and `reachable()` unions foot/swim/sink, so a swimmer floats
  up beside the wheel; `drownWall` itself turns swimmable at exactly the
  tide level a HIGH-drowned wheel needs its neighbour blocked at. The
  wheel tile and the gating tile both have real outdoor equivalents
  (`sandbar`/`tidePool` for the single-level drown, `drownWall` for the
  solid-then-swimmable gate) — only the "impassable buffer that isn't
  solid" piece has no outdoor tile at all. Needs either a new tile with
  `dPit`'s flag combination or a genuinely different "no hand reaches"
  model for outdoor rooms — not a filter change, and not something this
  token could also cover. See `docs/NEXT-SESSION.md` S95.
- **`check-anchor.mjs`'s dungeon reuse ceiling is ALSO 1 of 5 (D2 only),
  found S96 while scoping the session after it — before any room was
  built, not by a failed attempt.** S91's own fix reads `late = [...gates,
  ...gauges].filter(r => r.mapId !== 'overworld' && !['d1',
  'd2'].includes(r.mapId))` and fails the run for ANY declared
  `anchorGate`/`anchorGauges` outside that whitelist — d1, d2 or the
  overworld, nothing else. This was framed at the time as closing "a
  whitelist gap" (S90 had put a D2 room in, and the ORIGINAL whitelist
  simply hadn't included `'d2'` yet), but the fixed version is still an
  unconditional hardcoded array, not an index comparison — d3, d4, d5 and
  d6 were never actually opened up, they were never tried. The tool's own
  header says why, in plain language, right above the model: "NO SWIMMING.
  The Kelp-Soled Cleats are the D3 item, so in D1 deep water is a wall...
  A room in a later dungeon that declares an anchorGate would need this
  relaxed, and the assertion below about which dungeons are covered is
  what will catch that." So this is the same SHAPE of ceiling as
  `check-lens.mjs`'s D2-only block (an unconditional assertion, not an
  index-early clause like Bellows'/Reefseed's), just reached by ruling out
  the move BEFORE spending a session building a room that would fail —
  the way S92 checked all four tools in one pass rather than letting each
  ceiling be found by a separate failed attempt. **Anchor `dungeons: 1 of
  5` is very likely this rotation item's actual ceiling under the current
  toolset, same practical shape as the Lens (0 of 5) and the Reefseed (1
  of 5, D6 only, landed S96).** Unblocking it needs the same swim/no-swim
  model relaxation `check-lens.mjs`'s own header names for itself — a
  bigger change than a filter fix, and not attempted this session (no
  detour token; `tools/` is outside item-reuse's file allowlist regardless
  of token count). See `docs/NEXT-SESSION.md` S96/S97.
- **`check-reefseed.mjs`'s overworld filter bug (the identical shape to
  S91's `check-anchor.mjs` fix and S95's `check-bellows.mjs` fix) is fixed
  (S98): `early` now reads `r.mapId !== 'overworld' && r.index < 5`,
  confirmed 102/102 unchanged on the existing D5/D6 rooms — this part is
  correct and stays. The tile-level hypothesis also checked out sound:
  `drownWall` (`{ tide: ['cliff', 'cliff', 'waterD'] }`) is tile-for-tile
  `dSnag`'s shape, plain `waterD` (`{ flags: F.DEEP }`) is the same fixed
  role `dWaterD` plays as the stake, and `dSnarl`'s indoor `underArt:
  'dWaterD'` is exempted by `check-ground.mjs`'s own `F.WET` skip
  regardless of where it's placed.
  S98 then went on to claim, from a bare `grep`, that the overworld half
  is STRUCTURALLY BLOCKED for all four items, and raised that to the
  person running these sessions as a rotation-level decision.
  **THAT CLAIM IS WITHDRAWN. It was wrong, and S99 withdrew it by reading
  the two tools instead of grepping them.** What the grep got right is
  narrow and uninteresting: neither overworld tool NAMES a gate field. What
  it got wrong is everything that followed from that.
    * `check-overworld.mjs` cannot see an in-screen pocket AT ALL. Its
      `reached` set is keyed on the ROOM, not the cell
      (`new Set([...seen].map(k => k.split(':')[0]))`) — the very blind
      spot `check-strands.mjs`'s own header was written to describe. A
      gated pocket inside a screen the player can enter is invisible to
      it. It was never a blocker and could not have been.
    * `check-strands.mjs` is a BASELINE, not a zero-assertion, and
      `--record` is part of its documented workflow. Its own header names
      two kinds of legitimately unreachable cell already in the recorded
      set (water, one-cell root pockets), and `tools/strands-baseline.json`
      already carries a TEN-cell region. So "a new region fails outright,
      no recourse" is simply not how the tool works: a deliberate
      item-gated pocket is a third legitimate kind, recorded with its
      reason written down, exactly as the other two were.
  **So the honest status of the overworld half is UNTESTED, not blocked.**
  Nobody has yet built one and run the suite. The real cost to weigh is
  not impossibility, it is that baselining a pocket stops those cells
  being watched for future regressions — a genuine judgement call, and a
  smaller one than "teach both floods the cut/gate verbs", which remains
  the other option. Whoever picks this up should BUILD ONE AND RUN IT
  rather than argue it either way from the source.
  **Also withdrawn: S98's retroactive claim that this was "the same root
  cause" behind S91's Anchor finding and S95's Bellows finding.** Those two
  were each traced to something specific and different (the hop model's
  `F.JUMPABLE`-only reach; no outdoor tile carrying `dPit`'s flag
  combination), and folding them into one tidy story replaced earned
  precision with a guess. Their own entries above stand as written and were
  not re-verified by S98 or S99 — treat them as they were left, and note
  that the baseline argument above may well apply to S91's too.
  **The lesson, which is the part worth keeping:** a `grep` that finds no
  mention of X proves the file does not say "X". It does not prove the
  file would reject X. Both wrong conclusions in this thread — this one and
  the art one below — came from asserting a result instead of running the
  thing that would have produced it. See `docs/NEXT-SESSION.md` S98/S99.
- **A TILE BORROWED FROM ANOTHER DUNGEON CARRIES THAT DUNGEON'S PALETTE AND
  ITS FLOOR, AND NOT ONE CHECKER IN THE TABLE LOOKS AT COLOUR (S96, caught
  and fixed S99).** S96 built D6's Reefseed grove by pointing `dungeonAbyss`
  at the Drowned Wood Shrine's own `dSnag` and `dSnarl`, and wrote into
  `legends.js` that the two are "generic... so they sit in the Keep's own
  palette without looking borrowed." They do not. Both are drawn in
  `treeoakdk`, whose index 2 is a BROWN TRUNK, and `dBole` names
  `underArt: 'dFloorWood'` — the Wood's own flagstones — so the Abyssal
  Keep's black stone hall came out with a green forest tree and a green
  shrub standing in it, over a square of another dungeon's floor. It is
  obvious in one screenshot and invisible to everything else: `validate`,
  `walk-dungeons`, `check-dungeon-strands`, `check-placement`, `check-ground`
  and `check-reefseed` (102/102) were ALL green on it, and it shipped to
  `main`. `check-ground` is the one that looks closest and still cannot see
  it — it compares the ground under a PROP against the grounds its screen
  has, and skips any tile whose `underArt` is wet (`F.WET = F.WATER |
  F.DEEP`), which a pool fixture always is.
  **The fix was not new art.** `legends.js` already had the worked example
  three lines above where the bad line was added: `dPostAbyss` exists
  because the shared post named the BRICK floor. Same reasoning applied —
  the snarl became `dSnarlAbyss` (same bush art, the `reef` sea-plant ramp,
  same flags/`underArt`/`cut`), and the bole was dropped ENTIRELY in favour
  of `7`/`dLintel`, which the Keep already owned and which carries the
  identical tide shape (`['dWallAbyss', 'dWallAbyss', 'dWaterD']` against
  `dSnag`'s `['dBole', 'dBole', 'dWaterD']`). The room now says the same
  sentence in the Keep's own masonry, the `5` override is gone, and
  check-reefseed still passes 102/102 — a theme may change the look and
  never the rules.
  **Standing rule: a fixture copied between dungeons gets
  `tools/shoot-rooms.mjs` run on it before it is believed, and the first
  question asked of a borrowed tile is what `pal` and `underArt` it NAMES** —
  not whether its own name sounds theme-neutral. Goal 1 is the product, and
  nothing in the verification table defends it.
- **S98's "the overworld half of item-reuse is structurally blocked" is
  CONFIRMED WITHDRAWN — S100 built a real room and it passed.** South
  Shallows (`0,7,9`, overworld) declares a `reefseedRoom` — bank, bar,
  stake, snarl, the identical fixture the Drowned Wood Shrine's groves use
  — and `check-reefseed.mjs` proves it 117/117, `check-strands.mjs` finds
  no new region (the gated cells are deep water/solid in the static data,
  not foot-passable, so the flood never counted them as a stranding
  question at all), and the full suite plus `check-playthrough.mjs` and
  `npm run build` are all green on it. The other three single-use items
  (Anchor, Lens, Bellows) still have zero overworld screens and their own
  dungeon-side ceilings (above) are untouched by this — only the overworld
  HALF of the question is now settled, and only for the Reefseed.
  **Two build notes for whoever builds the next one.** First, the bar's
  reachability is not the throw axis: `dBole`/`dSnag`-style bars are solid
  at LOW same as everywhere else, so a grown pillar reachable ONLY through
  the bar is stranded the moment the tide drops — the fixture needs a
  swim-around, plain deep water flanking the stake (not the snarl) the way
  Grove2 already has, open to a Cleats-owning swimmer so the route to the
  pillar runs AROUND the bar rather than through it. Missing this failed
  `check-reefseed.mjs` outright ("nothing reaches the stake once it is
  grown") on the first run. Second, and the one screenshot caught that
  nothing else could:
  **`drownWall`'s LOW/MID state is `cliff`, `pal:'stone'`, and it had never
  once been placed in a region whose ground isn't already stone-coloured.**
  All eight prior outdoor placements are in `abyss`/`cliffs`, both regions
  whose OWN ground is grey rock, so the grey cliff blended by coincidence.
  Repointing it at `cliffSand` (a tile that already existed, already used
  by two other dunes rooms) changed nothing in the screenshot, because a
  one-row wall is nothing but its own top edge, and `cliffSand`'s
  `edgeArt.up` — like all six cliff palettes' — pointed at the ONE shared
  `cliffTop`, hardcoded `pal:'stone'` regardless of the body it caps
  (`tiles-core.js`, the `cliff`/`cliffTop` block: "`edgeArt` is what makes
  a cliff read as a cliff... the renderer now puts the lip on the top row
  of every mass by looking at the neighbours"). The two existing dunes
  `#`/`^` cells sit on a screen's own top ROW, where off-screen always
  counts as the same family and the edge never fires — so nobody had ever
  seen a `cliffSand` cell actually draw its own top before. Fixed with one
  new tile, `cliffSandTop` (`pal:'sand'`, same `ART.cliffTop` shape), and
  repointing only `cliffSand`'s own `edgeArt.up` at it — the other five
  cliff palettes (`cliff`, `cliffDk`, `cliffRust`, `cliffCoral`,
  `cliffMarble`, `cliffAbyss`) still share the grey `cliffTop` untouched,
  and both pre-existing dunes rooms are provably unaffected (their edge
  never fires). **Whoever gives a LATER dungeon's later-reused item an
  outdoor gate should expect the same shape of gap if the fixture crosses
  into a region whose ground colour hasn't been tested against `cliffTop`
  before** — check by screenshot, not by reading the tiledef.
  **S101 built a second one, Worlds Edge (`0,11,9`), same `dunes` region,
  and confirmed the fix generalises: zero new palette work, `check-reefseed`
  132/132 on the first run.** `reefseed overworld screens` is now 2 of the
  rotation's own >=3 bar. The still-open work is a THIRD grove in a region
  that has never carried a `drownWall` variant on non-grey ground before
  (`coast`, `marsh`, `wood`, `salt`, `reef`, `coral`) — that is where the
  `cliffTop` gap this entry describes is actually untested, and it is the
  next session's job to find out by screenshot, not to assume it again.
  **S102 built the third, Marsh Corner (`0,2,9`, `marsh`), and settled the
  question this entry left open — but not in the direction it expected.
  `reefseed overworld screens` is now 3, the rotation's own bar, and the
  right fix was `drownWallSand`, not a new `marsh` palette.** First attempt
  matched S100's pattern literally: gave `marsh` its own body colour
  (`cliffMarsh`, `pal:'stonedk'`, the same shade `marsh`'s real `#`/
  `cliffDk` walls wear) plus its own top. Screenshot showed the SAME flat
  grey box the sand case had, just a shade darker — because a coastal
  grove's bar never actually touches `marsh`'s own dark interior ground; it
  sits on the last row or two before open sea, and that row is `1`/
  `sandbar`, which resolves to plain `sand` in every region's legend alike
  (digits are never region-overridden — CLAUDE.md's own rule). `marsh`'s
  own wall colour was answering a question the room wasn't asking.
  `drownWallSand`/`cliffSandTop` — already built in S100 — turned out to be
  the correct bar here too, confirmed by a second screenshot, because it's
  a SHORE palette, not a `dunes`-only one: reused as-is, no new tiles.
  **This retires the "untested region" framing entirely.** Every region
  bordering open sea shares the same sand fringe at its coast, so
  `drownWallSand` is very likely already the right answer for `coast`,
  `wood`, `salt`, `reef` and `coral` too, for the same structural reason —
  not because their OWN `#` palettes (`cliff`, `cliffDk`, `cliffMarble`,
  `cliffCoral`) have been individually cleared. What is still genuinely
  untested is whether `cliffRust`/`cliffCoral`/`cliffMarble`/`cliffDk` need
  their own top when a wall sits against a region's ACTUAL interior ground
  — and the Reefseed's own fixture shape (bank/bar/stake/snarl running
  into open sea) structurally cannot test that, because it can only ever
  be built at a coastline. Proving THAT gap needs either a different
  item's outdoor fixture that doesn't require open water, or a dungeon
  room screenshot of an existing `cliffRust`/`cliffMarble`/`cliffCoral`
  wall with a visible top edge — not another Reefseed grove.
- **Rotation item 7 (item-reuse) has no task left that fits inside its own
  file allowlist. Checked directly rather than inherited (S102's own
  scoping pass, before any dungeon room was built), and it closes a
  question S90-S98 had each answered separately for one item at a time
  without ever stating the total.** The picture, item by item:
  - **Reefseed** (home D5): overworld screens now 3 of the rotation's own
    >=3 bar (S100-S102, above) — MET. **S107 OVERTURNED the dungeon half
    of this paragraph: the ceiling of 1 was an artefact of the filter,
    not a property of the game.** The clause forbade a `reefseedRoom` in
    any dungeon below D5, reasoning that the player cannot answer a room
    before they hold the item — which is true of the CRITICAL PATH and
    false of everything else. The Dredge Line already does exactly what
    that clause forbids, three times over: it is D6's item and D1's
    Sunken Hall, D2's Tide Gallery and D3's Bog Hub all carry tiles only
    the Line answers, which is why check-drift reads `dredge 3 of 5`
    rather than 0. Those are optional alcoves you come back for. The
    clause is now the rule it meant: a Reefseed room below its own
    dungeon must declare `optional: true` and must not be standing in
    front of a key, boss key, item or essence. The home index is derived
    from the map data rather than the hardcoded `5` it used to be. Both
    new clauses verified to go red against injected rooms. NO EARLY ROOM
    EXISTS YET — the door is open and nothing has walked through it; the
    fixture is a real build (stakes at two seas, a drowned bole, and D2's
    coral legend has no `dSnag`) and is the next session's task. The
    original text follows, and its `early` reading is superseded: `check-reefseed.mjs`'s own `early`
    filter (`r.mapId !== 'overworld' && r.index < 5`) rejects any
    `reefseedRoom` in a dungeon numbered below 5, on the stated reasoning
    that the player cannot hold an item before the dungeon that grants it
    — and D6 is the only dungeon numbered above 5. The rotation asks for
    `>=2 later dungeons`; the true ceiling here is 1. Confirmed again this
    session by reading the filter directly before drafting a task that
    would have asked for a `d3`/`d4` reefseed room — that room would fail
    `check-reefseed.mjs` outright, by design, not by bug.
  - **Anchor** (home D1): dungeon reuse is 1 of 5 (D2's Bone Cell, S90)
    and **S106 PROVED it is at its ceiling, for a reason that is the game
    and not the tool.** The filter was relaxed and the model taught to
    swim, exactly as the tool's own header had been asking for since it
    was written — and D3+ still did not open, because an anchor gate
    needs a route no single base level opens and one anchor placement
    does. The anchor pins a PATCH to a level the base could have been at
    anyway, so it adds reach only when no one base is best for the whole
    route. For a swimmer one always is: HIGH. `check-anchor.mjs` now
    asserts that over the engine's own tile table — every tide tile a
    swimmer can cross at any level can be crossed at HIGH — so flooding
    at base HIGH with no anchor already reaches everything an anchored
    flood could, and "the conch alone does not cross it" can never hold
    from D3 on. On FOOT thirteen tide tiles close as the water rises,
    which is why D1 and D2 hold gates at all. The assertion is a
    TRIPWIRE, not a comment: add a tile that shuts on a swimmer and the
    tool goes red and says to re-open the filter. Verified to have teeth
    by running it with foot caps, where it names all thirteen.
    The ONE avenue left is a gate in a later dungeon's pre-item half,
    where the player provably has no Cleats yet — but that redefines
    what this tool means by "requires the Anchor", from "no base level
    crosses it" to "no base level crosses it YET", and that is a human
    call, not a session's. Overworld
    screens is 0 of 3 and PROVEN blocked, not merely untried (S91): the
    one outdoor tile combination that could form a genuine two-level gate
    (`drownWall` at HIGH) was built as a real test room, and
    `check-strands.mjs`/`check-overworld.mjs`'s own hop models refuse to
    ever treat it as crossable (they gate hoppability on `F.JUMPABLE`,
    which deep water never carries), so the room read as a new stranded
    region and was reverted. Both halves need a `tools/` change.
  - **Lens** (home D2): dungeon reuse is 0 of 5, blocked the same shape as
    the Anchor's but with no partial credit, and by the SAME single
    assertion as the overworld half, not two separate gaps: `check-lens.mjs`
    filters `rooms.filter(r => r.mapId !== 'd2')` and fails if that set is
    non-empty (S92), so a declared `lensRoom` anywhere but `d2` — another
    dungeon or an overworld screen alike — is rejected outright, on sight,
    with no model even run against it. Re-checked directly this session
    (not inherited): this is stricter than the Anchor's own two filters,
    which at least distinguish "which dungeon" from "overworld or not."
    Both halves need the same `tools/` change: relaxing this one line to
    an index comparison plus a real model extension (the tool's own header
    says the D2 restriction stands in for "no swimming, no anchor," which
    would need re-deriving for any room outside D2).
  - **Bellows** (home D4): dungeon reuse is 2 of 5 (D5's Bower Cell S93,
    D6's West Crypt S94) — MET. Overworld screens is 0 of 3 and blocked
    for a third, different reason (S95): every dungeon Bellows wheel is
    boxed on its fourth side by `dPit`, the one tile in the game that is
    impassable in every mode at every tide while NOT `F.SOLID`, so a body
    can never stand there but the cone's own `solidAt` line-of-sight check
    still passes over it — no outdoor tile has that exact flag combination
    (checked by grep). Adding one is plain data (`tiles-core.js`, in this
    objective's own allowlist) — but whether a `solidAt`-based
    line-of-sight check ought to treat a plain `F.PIT` tile as blocking
    reach is a mechanic question, and today `solidAt` only reads `F.SOLID`
    (`src/world/room.js`/`tileset.js`), which is engine code, not data. A
    tile alone does not close this without also touching how the cone
    decides what it reaches.
  **So: two of the four items (Reefseed, Bellows) are each stuck one
  requirement short of the rotation's own bar, at a real structural
  ceiling under the current toolset and game rules — not a shortfall this
  objective failed to reach, but the actual maximum reachable without
  changing something outside `src/data/*`. The other two (Anchor, Lens)
  are stuck on both halves.** Every remaining path needs either a
  `tools/` checker change (the swim/no-swim model both `check-anchor.mjs`
  and `check-lens.mjs` name in their own headers as what would unblock
  them) or an engine change (`solidAt`'s line-of-sight treatment of
  `F.PIT`, for the Bellows) — both outside `item-reuse`'s file allowlist,
  which multiple sessions (S91, S94's detour, S96, S97) have each
  independently declined to spend a token on for the same reason: it is
  not a one-line unblock, and a wrong one would need re-proving across
  every existing gate room. **This is the charter's own judgement call,
  not a session's to make**: either the allowlist gets widened for a
  scoped follow-up (one item at a time, its own detour token, its own
  regression pass), or the rotation's own done-condition for item 7 is
  reconsidered given what is actually reachable. Flagged plainly at the
  top of S102's final message rather than guessed at.

  **S104 — SETTLED for the Lens, by human direction.** The decision above was
  put to the user, who chose "loosen one item's rule". The Lens's block was
  the weakest of the four and the only one that was purely a checker's
  refusal: `check-lens.mjs` filtered `r.mapId !== 'd2'` and failed on any
  survivor, so a fork in a later dungeon was never modelled at all. The
  refusal had a real reason — the flood was a walker, and a D3+ fork proved
  one-way against a walker is not proved one-way against a player wearing the
  Cleats — and that reason is now ANSWERED rather than asserted: the flood
  takes `capsForDungeonIndex` (moved into `tools/lib/collision.mjs` so
  `dungeon-flood.mjs` and this tool cannot drift apart), and every assertion
  is therefore stronger in a later dungeon, not weaker. The first fork
  outside the Coral Spire is `d6 1,5,4`, The Two Arches. The overworld half
  is NOT unblocked and must not be: docs/ITEMS.md's "the Lens is never a
  gate" is a statement about region scope, the tool now says so in its own
  words, and item 7's `>=3 overworld screens` bar is unreachable for the Lens
  BY DESIGN rather than by tooling. The Anchor, Bellows and Reefseed
  paragraphs above are unchanged and still open.

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

## Settled at S112 — proved by playing the Bogwater Sanctum

- **A dungeon flood that grants a dungeon's own item to that dungeon's own
  item room proves nothing about the item room.** `capsForDungeonIndex` gives
  swim to every room of D3. The Cleats chest sat on an island ringed by flat
  deep water and `walk-dungeons.mjs` was green about it for the life of the
  project. Negation: do not trust a dungeon flood about the room that hands
  the item over. Only the playthrough can answer that one.
- **`check-cleats.mjs` asks whether the seafloor route exists, not whether a
  player can get down to it.** All four of its clauses held on the Bogwater
  Drain while the room could not be entered at all. Negation: an EXISTS proof
  about a route is not a proof about the transition onto it.
- **`puzzle: { enemies: true }` means every enemy, including the ones with no
  answer.** A `barnacle` (hp 999, shield all) in such a room seals it for
  ever, and the reward table reads as earned to every checker. Only `barnacle`
  and `bubble` can do this; only the Eel Vault did.
- **`tools/measure-boss-combat.mjs`'s setup table is not in-order play.** It
  gives `sword: 2` from d3 on; the L2 sword is gated behind four Essences. Any
  "measured to need N quarter-hearts" figure for d3 and later describes a
  fight the player cannot bring. Not yet resolved — see NEXT-PROMPT.
- **The Bogwater Sanctum is PLAYED, not modelled (S115).** A new game reaches
  Gloomtide's arena with three Essences, eight Small Keys earned and spent,
  the Sunken Marsh opened with the Bombs and all three torrents crossed on
  the seafloor. Settled with it: D3 is finishable in order; the Cleats'
  floor mode works from a real playthrough, not just from `check-cleats`'s
  EXISTS proof; and the Bombs answer an overworld region gate under a real
  player.
- **A route may not count presses at a TOGGLE, and `soles` is the second
  proof of it.** `Player.surface` resets `cleatMode` to 'swim' every time the
  player comes up, so "press the Cleats once per crossing" is right until the
  first time it is wrong. Negation: `['use', item, n]` is only ever correct
  for a verb with no state. Name the state — `tide`, `soles`.
- **`toggleCleats` freezes the player for its own line of dialogue.** A
  `hold` on the next frame is spent entirely inside the freeze, and the
  symptom is an actor holding a direction at the mouth of a torrent for
  three hundred frames without moving one pixel, with the soles reading
  `sink` the whole time. Negation: "the mode is set" is not "the mode is
  usable". `dSoles` answers the box before it returns.
- **`dTravel` models an edge between any two adjacent rooms that exist.** It
  learns the blocked ones by trying them, which is enough on a floor and is
  not enough for three cases, all of them now paid for: it cannot change
  FLOORS; it walks straight through a dungeon doorway if one is on its path
  (Grotto Mouth, and sixty directives then play out inside D1 with the trace
  looking fine); and it cannot see a DIAGONAL-ONLY link, which Bog Causeway
  has. Negation: a `travel` call is not a substitute for knowing the map.
- **A `travel` cannot plan its way out of a room with one door.** Every
  dungeon arena is such a room, and `bfsScreens` models an edge into the room
  it is already standing in, so the call oscillates until its budget is gone.
  Negation: leaving a dungeon is not entering it backwards. Step out of the
  dead end by hand, then plan from a room that has somewhere else to be.
- **A route may not hold a button for a number that lives in room data, and
  `bellows` is the third proof of the same rule.** `needTurns` is 30 on one
  sill and 50 on another. Negation: "hold for N frames" is a private copy of
  the world. Name the thing that has to change — the wheel, and its own
  `open`.
- **A `fight` is a roam, and a roam moves scenery.** `dFight` crossed thirty
  tiles of the Cistern Floor chasing a jellyfish and shoved the puzzle's push
  block off the row it had to be on; the `goto` after it was a path into a
  tile the block was standing in, which plans as null, and every directive
  after that played out in the wrong room with the trace looking fine.
  Negation: a coordinate written before a fight is not a coordinate after
  one. Do the placement first, or re-derive it.
- **`dFight` cannot kill a shielded enemy that patrols along the axis its
  shield covers.** Sandpiper Row's crab (S40), the Eel Vault's (S115) and the
  Long Race's darknut (S116) are the same failure three times: the verb lines
  up on one axis and closes, and `Entity.hurt`'s `shield: 'front'` check only
  ever compares a horizontal attack direction against a horizontal facing, so
  a vertical swing is unconditionally unblockable and a horizontal one never
  lands. Negation: "the room would not clear" is not a budget problem. A
  `dFight` that preferred the axis PERPENDICULAR to such an enemy's own
  facing would close all three; until then they are answered by hand or
  walked past.

## Settled at S117 — proved by playing the Drowned Wood Shrine

**The Shrine is finishable, end to end, by a run that was handed nothing.**
`check-playthrough.mjs` walks it: three Small Keys earned and spent, the
Reefseed out of its own chest, all five groves grown at HIGH and stood on at
LOW, all five snarls cut, Thornvine beaten, the Boss Key out of the Shrine
Ford's west chamber, and Rootmaw beaten in real combat. Do not re-prove any of
it by hand.

**The Reefseed's geometry holds in the engine, not just in the checker.**
`check-reefseed.mjs` was written before the rooms were; this is the first time
anything has THROWN one. Every stake in the dungeon lands on the square its
room data names, from the standing tile the engine itself picks, at the sea the
room argues for. The bole really does stop a seed below HIGH and really does
let it through at HIGH.

**The Noble Sword's gate opens on schedule.** The Bluff Grotto's big chest
wants four Essences, and Wyverna's death is the first moment a player has them.
The route now goes back for it, and the chest gives it up. That was never
tested before and the item existed as a damage tier with no proven way to get
it.

**Rootmaw is not winnable with the level-1 blade** — 44 of 52 hit points taken,
28 quarter-hearts spent, dead, twice measured. Do not retune the boss for it:
the Noble Sword is the answer and it is in the world already.

**A dungeon's health budget is decided by whether it has a fairy, not by its
enemies.** D5 has none, so its two Pieces of Heart are load-bearing and have to
be taken before the first locked door. This is the third dungeon where the
route's health turned on one ordering decision; assume it will be the fourth.

**`dFight` loses to a barnacle the way it loses to a shielded crab and a
darknut** — it stands in front of the thing and keeps closing. Three enemies,
three sessions. Rootbound Hall is crossed rather than cleared, and the general
fix (prefer the axis perpendicular to a shielded enemy's facing) is still
unwritten because it re-sweeps every recorded frame in the repo.

**A `fight` inside a multi-screen room is a thirty-tile walk.** The Cistern
Floor wrote this down and the Shrine Ford repeated it. Wide rooms are crossed,
not cleared, until `dFight` learns a radius.

## Settled at S124 — the King's fight has a margin

**The run enters Nereth's hall on 35 of 44 and bottoms out at 3.** The deepest
trough in the game is 2/48 in D1, where it belongs. Do not re-derive this.

**The Crossed Shafts' far island holds a fairy, past the chest.** It is the
only place in the Keep a heal can go and still be spent. Do not move it.

**A PLACED PICKUP HAS A 460-FRAME FUSE.** `PICKUP_LIFE_FRAMES`, counted while
its room is on screen. Anything placed in a room with a real fight in it needs
an explicit `life` or it is gone before the fight ends. Unaudited everywhere
else in the game.

**NEVER give the Brinehulk `drops: 'rich'`.** It is the only miniboss paying
nothing and that is now deliberate: a drop table is rolled off the RNG, and
turning one on moved every roll after it and lost Nereth sixteen times running.

**The Barnacle Skin must not be worn into a fight.** A free hit takes no
hitstop and no knockback, so the swordsman is not shoved clear — strictly worse
than being hit against anything that keeps coming. Measured on Gloomtide and on
Nereth. Worn only for the walking it nets four quarter-hearts, because the Keep
Gate's fairy throws the rest away against the cap. Not worth a re-tune.

**`['charm', id, slot, maxF, 'off']` takes a charm out.** Same button as
putting one in.

## Settled at S123 — the scrimshaw is drivable, and the trader is not

**`['charm', id, slot, maxF]` exists and works.** It drives the menu the way a
player does and verifies the case afterwards. The run wears the Gillcarve in
the HIGH case. `check-playthrough` asserts a charm is worn; do not let that
assertion go back to zero.

**`dTrade` re-aims at a wandering trader.** It used to read the link's tile
once and then press A at an empty square for nine hundred frames. Do not
re-derive this; it is why the chain survives a frame shift at all.

**THE BARNACLE SKIN CANNOT BE WORN FROM D2 WITHOUT RE-TUNING THE WHOLE ROUTE.**
Measured: the run dies at Gloomtide. A free hit changes knockback, invuln
windows and therefore every frame after it. The charm is right and the fight is
right; the recorded route is 170k frames long. Budget a whole session.

**The Colonnade round trip costs NINE quarter-hearts** entering on twenty-six,
and the run's slack is one. Measured S123; do not re-measure by hand.

## Settled at S122 — the verification table is all green

**EVERY CHECKER IN CLAUDE.md'S TABLE PASSES.** No red anywhere. Do not go
looking for the two `check-hearts` failures or the `check-charms` one; they
are gone and neither was ever in the game.

**The Gillcarve was never broken.** The check stood on dry sand and set
`player.inDeep` by hand; `updateBreath` asks `touchingDeep` and does not read
that flag. A checker that sets a flag the engine does not read measures nothing.

**`check-charms` does not take the clock.** The game's own loop runs between
two `page.evaluate`s, so a player parked in open water is washed back to dry
land before the next call. Anything that has to be read while standing
somewhere the engine would not leave you happens in ONE evaluation.

**The world holds 24 heart pieces, which is exactly 6 containers.** The fourth
route to a piece is a drowned wheel's `gives`, and D5's Bower Cell is the one
that uses it. NEVER add a 25th: the cap would leave P9's window from the other
side.

## Settled at S121 — the game plays to the end

**THE GAME CAN BE FINISHED, AND IT HAS BEEN.** `check-playthrough.mjs` drives a
new game to the sixth Essence and the ending, 37 assertions, nothing granted.
Do not re-derive the Keep's floor-1 order; it is in the route beside each step.

**The Brinehulk is a MINIBOSS.** It was declared as a full boss, so killing it
marked the Keep beaten and claimed the sixth Essence two rooms short of Nereth.
`init: miniInit, onDie: miniDie`. Never re-house a boss without those two lines.

**Nereth is beaten at MID and at no other sea.** LOW and HIGH both kill the
player. The throne room is `noTide`, so the conch is spent at the Keep Gate.

**A PLACED PICKUP DOES NOT RESPAWN.** A room is built once and kept, entities
and all. Never budget health on a second helping of the same fairy.

**Floor 1's two wings are not affordable at the health the Keep leaves.** Both
are authored and proved in isolation (QUEUE.md) and both killed the real run.
Do not re-measure them by hand.

**The Sunken Bar costs nothing** — twenty in, twenty out — and is the Keep's
only HIGH crossing.

## Settled at S120 — the Abyssal Keep plays to the Keep Gate

**The Keep's first four keys and four locks are routed and proved.** Do not
re-derive the order; it is written out in `docs/NEXT-SESSION.md` S120 and in
the route file beside each step. Keep Crossing's EAST door is spent before its
north one, always.

**The answer to armour is the Resonance Rod, not a cleverer swordsman.** Five
sessions of "teach `dFight` to beat a shielded enemy" were the wrong question.
`['fight', n, p, { ring: true }]` is the answer and it is one button press.

**Anything the actor aims by FACING is turned in two frames, not ten.** Holding
a direction walks. This cost the Kilnshell and the Dredge Line one failure each.

**Floor 0 of the Keep is played at MID.** At LOW its `4` tiles are open pits
and two of its three keys cannot be won. The West Crypt cannot even be left.

**The Kilnshell exists and is now collected.** Reef Hollow, off `0,6,7`. It is
the only fire in the game and nothing had ever opened that chest.

## Settled at S119 — the chain's road has a heal on it

**The chain tour is survivable and the number is asserted.** Shell Beach
(`0,3,8`) holds the west coast's fairy, in the pocket beside the rock at 7,2.
The run arrives at the Abyssal Keep's arch on 30 of 44 quarter-hearts, and
`check-playthrough.mjs` now fails if it arrives on less than half of max. Do
not re-measure the tour's cost by hand and do not move that fairy.

**The heal needs no route directive and depends on one that is already there.**
A placed `pickup` sets `isDrop`, so `dLoot` collects it like any dropped heart.
The `['loot', 600]` after the `3,8` hop is load-bearing.

**The heal floor is half-of-max, deliberately, not 22.** The heart cap is still
growing and a fixed number would stop meaning "half".

**An overworld pickup needs BOTH `check-placement` and `check-ground`.** The
first says the tile can be stood on; only the second knows a treeline is two
tiles deep on screen and one in the data. 8,1 passed the first and failed the
second.

## Settled at S118 — proved by playing the Coastwise Chain

**The Coastwise Chain plays end to end in a real run.** All twelve links, in
stage order, across fifty screens and two interiors, with nothing granted and
no warp. `check-playthrough.mjs` walks it. Do not re-prove any of it by hand,
and do not re-derive the link order — it is in the route file, by screen.

**The one story gate in the world opens on schedule.** The Maku Tree's second
beat sets `makuOpenedKeep` at five Essences, and the keep seal across Upper
Kell and the Abyss Stair gives way to it. Nothing had ever set that flag in a
run before this one.

**The Maku Tree will not do both beats in one visit.** The trade comes first
by design, so the Rod and the level-3 blade are two conversations. This is
correct behaviour, not a bug; any harness that talks to her once gets the Rod
and thinks the road is shut.

**`travel` may not be handed a target more than one screen away on the east
coast or in the marsh.** It learns blocked edges by trying them, and on this
map trying them means swimming off the edge. Measured three separate deaths.

**Three overworld seams are not plannable and are named by hand in the route**
— Sandbar Run's chasm (no hop in `findPath`), Sunken Reef's cave mouth sitting
on the shortest path west, and Bog Causeway's southern lobe eastbound as well
as westbound. Do not try to make `travel` clever about them from the route.

**The chain tour is not survivable twice.** 36 of 44 quarter-hearts to walk it
once, nothing on it heals, and the run reaches the Keep on six. Fighting the
tour is worse, not better, measured two ways. The fix is a world change and
it has not been made.
