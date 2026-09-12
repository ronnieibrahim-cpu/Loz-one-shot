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
