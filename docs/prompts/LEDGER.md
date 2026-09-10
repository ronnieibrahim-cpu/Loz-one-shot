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
- **Nereth (D6) does not fix entirely but comes very close — see S49
  (tried, reverted) and S50 (landed); Rootmaw (D5) was the same class of bug
  and is now fixed, see the Landed table's S52 row.** S50 landed
  `safeWhenOpen: true` on `anemos` and `nereth` only, read by `dBoss`
  alongside `b.stun`: **D6 goes from 6 of 80 damage dealt to 78 of 80** (a
  real fight now, not a wall — not yet a full win). Nereth still needs the
  same contextual conch-press idea S52 built for Rootmaw (`tideEscape`), but
  NOT the same value — `nerethPin`'s target level changes per phase (MID,
  then HIGH, then a drained level), so he needs a dynamic form ("away from
  whichever level `nerethPin` currently wants"), not a single constant.
  Named and left for a future session in `docs/NEXT-SESSION.md` S52's "still
  open" list — building it is out of scope until a session is asked to chase
  Nereth specifically, since 78/80 was not this session's job.
  **Caveat that still applies:** a robot losing (or not quite winning) does
  not by itself prove a boss is unfair if the robot is missing a verb the
  fight assumes a player has. Nereth's own fight is explicitly designed
  around the conch (`nerethPin`) and the actor still cannot press it
  contextually — 78 of 80 without that verb at all is a strong result, not
  a ceiling on the fight's real fairness. The honest deliverable is a
  measurement plus a judgement, not a green tick.
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

- `src/data/overworld.js` lines 9-18 still name Roc's Feather, Power
  Bracelet, Zora's Flippers, Bombs, Hookshot and Magnetic Gloves as region
  gates, while `feel.js` and `tiles-core.js` state the Feather and Bracelet
  are gone and hop/lift are base moveset (see `LIFT_STRENGTH` in
  `src/data/feel.js` and `boulder`'s `liftLevel: 2` comment in
  `src/data/tiles-core.js`).
- `GAP_HOP_MAX_SPAN` (`src/data/feel.js:1127`) is 2 and `Player.tryHop`
  (`src/game/player.js` around line 535) gates the hop on nothing but
  `carrying`/`bellowsOpen`/`hookPulling` — it is unconditional, so the
  documented "Coral Reef: 1-tile deep gaps -> Roc's Feather" gate in
  `overworld.js` gates nothing.
- `tools/check-gates.mjs`'s header (lines 11-12, 20-21) still claims plain
  boomerang vs. Magic Boomerang assertions; the body actually tests the
  Resonance Rod (see its own in-body comments: "the Magic Boomerang that
  used to turn it is gone — the Resonance Rod rings it").
- `F.HEAVY` (`src/world/tileset.js:91`) is set on `boulder`
  (`src/data/tiles-core.js:2180`) and read by nothing — no call site tests
  `& F.HEAVY` anywhere in `src/`. The real gate on the boulder is
  `liftLevel: 2` (past bare hands, since the Power Bracelet is gone) plus
  the `dredge` tile action the Dredge Line uses to drag it clear.
