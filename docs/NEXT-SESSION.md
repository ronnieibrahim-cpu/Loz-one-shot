## S249 — rotation (g) dungeons pass 1 finished; the dunes' and marsh's side content

Branch claude/oracle-tides-rotation-dungeons-8804ec, off main at 6a7fe60.
Pictures: docs/briefs/s249/.

### The human's choices this session (do not re-ask)
- No iPad play notes yet.
- D5 -> D6: "haven't played it" — nothing changed; still waits for their play.
- Bosses: NOT re-proposed. S246 already levelled both by pattern on the
  human's pick (Anemos holds his fire while he feeds; Wyverna floods from her
  first phase; DUNGEON-STATUS "S246"). The S249 prompt was stale on this.
- The dunes: the SAND DOLLAR HUNT (offered: a tide cave; a Bellows
  come-back-later secret).
- The marsh: the SINKING STEPS mini-game (offered: a sunken chest walk with
  the Cleats; the witch's bog lilies).
- Hearts from: the two village errands (the ledger now pays 100 Rupees, the
  kite a blank charm). Total stays 28 pieces, cap 16.

### Built
- SAND DOLLARS: PICKUPS.sandDollar (objects.js), `lowOnly` — not drawn or
  taken unless `tideAt` is LOW; each placement names its own `flag`
  (`sandDollar1..5`, SAND_DOLLAR_FLAGS). Placed off the route: Dune Head
  0,10,6 (5,5), North Dunes 0,11,6 (6,5), Leever Bowl 0,13,7 (5,4; two `5`
  cells there became `4` seafloor, a sandbank), Channel Dunes 0,14,7 (3,4;
  one `5` -> `4`), World's Edge 0,16,9 (7,2). The beachcomber (walk 'oldman')
  is INSIDE Sandpiper Cottage (houseSandpiper 8,3): an errand whose `need` is
  the five flags, `partial` counts them (story.js sandDollar*). Drawn sprite
  p_sanddollar (sprites-errands.js; no sheet has one).
- SINKING STEPS: Reedbank 0,2,6 (off the route, a dead end), legend
  `bogSteps` (marsh + digits 5-8 -> tide tiles sinkStone [LOW], sinkPillar
  [LOW, MID], sinkRaft [MID, HIGH; a pit at LOW], sinkGap [pit at LOW, deep
  above]), mud islet at 5,4. Par 3 (solver in the session; check-side plays
  the solution): LOW short stones to the tall one, MID, rafts to the islet,
  HIGH, LOW, short stone to the bank. objects.js StepKeeper: asks at LOW only,
  counts tide changes, fails (unhurt, back to `start`) on a fall, a swim or a
  drowned stone, or an Anchor/Bottled Tide override in the room; the far bank
  always poles you back (no strand). Prize heartPiece, again rupee20, flag
  stepsWon. Art (a Sonnet helper, drawn: neither cartridge has stepping
  stones or rafts as tiles): tiles-stepstones.js stepStoneLow, stepStoneTall,
  stepStoneTallWet (over the deep water's frames, S249 here), stepRaft (over
  them too). Lines steps* (story.js).
- Game.presentPrize says a prize's `line` when it has one (a blank charm).
- TOOLS: actor-runtime `['steps', maxF]` starts a round; `loot` skips
  `lowOnly` pickups; check-hearts and check-guide count a stepKeeper prize;
  check-dialogue knows drain/splash/trick/over/fetch; check-side +9 (four
  sand dollar, five steps) and the ledger/kite expectations changed.
- Guide: GUIDE.md Heart Pieces 11 and 17 and the errand list;
  tools/guide/guide.html (ids hp-kite/hp-ledger kept, pictures replaced).

### Verified
Whole table green; check-playthrough 49/49, THE END, never died. The route is
unchanged frame for frame (Anemos 9/24 as on main) once both new things were
off it — see HANDOFF S249 for why they had to be.

### Next
- Rotation (h) fairness: the thinnest fight to 11/13 (STATE.md).
- D5 -> D6 still waits for the human's play.

## S248 — the audit, part two: signs, the opening's music, the overworld, the shop

Branch claude/nifty-pasteur-xiauob, off main at 8d626a8. The write-up is
docs/AUDIT-S247.md "Part two". Pictures and sounds: docs/briefs/s248/.

### The human's choices this session (do not re-ask)
- No iPad play notes yet.
- The two reworded puzzle signs (D3 Two Weights, D4 Ebb Cell): "both are fine".
- Opening music: B, the cartridges' opening theme (offered: silence; Seasons'
  storm theme under the storm only). Ages has no separate intro: mus/intro1.s
  is shared.
- The Drowned Wood: "both" — a puzzle cave with a moved heart piece AND a
  seed-throwing mini-game (offered: either, or leave it).
- The shop: "late stock after 3 Essences" (offered: leave prices alone).

### Built
- SIGNS: 25 of 122 signs/carvings reworded (overworld.js, dungeons-a/b.js,
  dungeons-optional.js); the Kell post says North/South. Scan:
  `node` over MAPS roomDefs `entities` 'sign' and `readable` (a 12-line script;
  tools/oneshot/shoot-signs.mjs photographs one read for real, every page).
- OPENING MUSIC: audio.js `openingTheme: { seasons: 'intro1' }`; story.js
  `intro` plays it and its `do` step calls `audio.fadeOut(TITLE_MUSIC_FADE_MASK,
  'overworld')`. core/audio.js: `fadeOut(mask, then)` starts `then` when the
  fade runs out; play(then) meanwhile is ignored; a sound that ends the fade
  early starts `then` at once; stop() forgets it. check-music TAIL_ENDS lets
  intro1's noise channel end while the others loop. test.mjs +3.
- MARSH ENEMIES (off the route): 0,1,6 leever->moblin; 0,0,7 ->beetle; 0,0,8
  ->beetle + moblin; 0,0,9 ->moblin. The pincer (defined, never placed) was
  tried: it has no hole to hide in on open ground (invisible). Not placed.
- SHOP: houseShop (overworld.js): bomb4, heart and the Bottled Tide at 7 carry
  `until: 3`; from 3 Essences `bomb10` (40, objects.js PICKUPS + CAPACITY_FOR)
  at 5, a Hagstone (150) at 7 and the Bottled Tide at 3. A three-figure tag is
  wider than a tile, so the Hagstone needs its west neighbour empty.
  `stockAt`/`until` are spawn conditions in Game.spawnSpec (Essences held).
  shopkeeper2 announces it. test.mjs +4.
- THE STAKE GAME (0,7,4 Drowned Ring): a Kelper `racer` with race 'pool',
  `needItem: 'reefseed'`, `needSeeds: 3`, `need` line; three `stakeMark`s
  (objects.js StakeMark, the o_buoy float) at 3,4 / 5,3 / 6,5, thrown onto
  from 3,2 down / 7,3 left / 8,5 left. Won when every mark's tile is
  coralPillar; Game.startRace calls `onRaceStart`, which puts the marks' water
  back. RACE_POOL_FRAMES 1200 (guessed). Prize `blank`, again rupee20, flag
  poolWon, best time in raceBest.pool. Lines poolNeed..poolLose (story.js);
  check-dialogue knows `need`. test.mjs +5.
- THE ROOT CELLAR (cave19, a Sonnet helper in a worktree, reviewed here):
  bomb the crack at 0,8,4 Rootwater (3,3); a `blockRoom` (check-blocks 6):
  push the block over the seafloor at LOW, then over the sinkhole at MID onto
  the plate; pays the Piece of Heart that was the Hollow Den's (cave5 now
  holds a rupee100). legends.js cave `$` = seaDrain. check-side and the guide
  (tools/guide) follow it.
- TOOLS: route-prefix.mjs `ROOMS=<map regex>` lists every room the run stands
  in with rupees held/earned/spent on arrival; shoot-region.mjs keeps its
  parked player alive (a HIGH stitch drew GAME OVER into later screens);
  tools/oneshot/shoot-eval.mjs and eval-game.mjs run a snippet in the live
  game and save the canvas / print the result; render-seasons-wav.mjs renders
  any ripped script (RIP_ALL_MUSIC=1 python3 tools/rip-music.py first, then
  `git checkout src/data/music-seasons.js`).
- .gitignore: .claude/worktrees/ (a helper's worktree was committed once as a
  bare pointer and taken out again).

### Looked at and left
- Overworld art at LOW/MID/HIGH: nothing wrong (a helper and here).
- The economy: the robot arrives at D1-D6 with 21/39/95/125/182/239 Rupees
  and never spends; the early prices stand.
- Menus, quest page, map, save: still the cartridge's own (S167-S177);
  docs/briefs/s248/menus-vs-seasons.png.
- D5 -> D6: waits for the human to play it (do not change it unasked).

### Verified
Whole table green; test.mjs 182; replay 51; check-playthrough 49/49, THE
END, never died (run before the cave merged and again after).

### Next
- AUDIT part two "Still open": the dunes and marsh are thin (one piece each);
  D5 -> D6 needs the human's play.

## S247 — the audit: an enemy ladder, puzzles that chime, mini-games that ask

Branch claude/oracles-third-installment-audit-dv9u55, off main at 1b12f14.
The write-up is docs/AUDIT-S247.md. Read it first.

### The human's choices this session (do not re-ask)
- ENEMIES: "grade them" — tougher kinds down the dungeon ladder, on the main
  path too (offered: side rooms only; leave them).
- PUZZLE TEXT: keep only the far-away ones (offered: remove all; keep all).
- MINI-GAMES: ask first and play the cartridges' mini-game theme; NO fee
  (offered: a 10-Rupee replay fee; leave them).
- No play notes yet from the iPad.

### Built
- THE LADDER (room data only, same squares): D2 octorok x3 (0,2,6 / 0,4,4 /
  1,5,5); D3 beetle 1,3,4 / 1,4,6 / 1,5,6 and zol 0,2,3 / 0,2,5 / 1,1,2 /
  1,2,1; D4 wizzrobe 0,4,5 / 0,3,3 / 0,2,1 / 0,6,2 / 0,0,1 and bubble 0,2,6 /
  0,3,4 / 0,6,5; D5 moblin 0,3,6 / 0,0,2 / 0,1,3 / 1,3,4 / 0,7,4 / 0,7,6,
  darknut 0,3,4 / 0,5,4 / 0,6,3, wisp 0,2,6 / 0,1,5 / 0,1,2 / 1,3,5.
- 71 `puzzle.reward.say` lines removed (dungeons-a/b/optional, overworld).
  Kept: D3 The Sump. A `reward: {}` still plays the short chime.
- Racer and BuoyKeeper ask Yes/No (`Game.askDialogue`; `go`/`decline` ids:
  raceGo, raceNo, buoyNo). `Game.updateMusic` plays `minigame` while
  `game.race` is set or an entity's `gameOn` is true.
- rip-music.py TRACKS + `minigame` (Seasons' mus/minigame.s); audio.js
  `minigame: { seasons: 'minigame' }`.
- About sixty hard-coded lines reworded (game.js, items.js, objects.js,
  scrimshaw.js, trade.js, errands.js, caves.js).
- Checks: test.mjs +17 (the mini-games, the ladder); check-text reads
  `got`, `needText`, entity `say`, `reward.say`; check-buoys answers the
  sailor's choice; check-dialogue knows `go` and `decline`.
- The route: Gloomtide's entry wait 49 -> 56. Replays d1-descent and
  d5-overthrow re-recorded (a text box gone; a moblin where a tektite was).

- Pictures: docs/briefs/s247/ (tools/oneshot/shoot-s247.mjs).

### Then, the same session: cut-off sprites (the human: "some of the sprites are still cut off - npcs and rocks")
- Found by a detector over every sprite and prop, then by eye; done by a
  Sonnet subagent at the human's word (cheaper), reviewed here.
- ROCK (`rock` and the four that share its art): rip-terrain.py's source x
  418 -> 419; the boulder's right edge was sliced flat.
- NPCs: `npc_child` is 16x28 and `npc_zelda` 16x23 on the sheet;
  rip-npcs.py frames can carry a height, `NPC.drawOffset` draws a taller
  frame feet-down, expectedSize says so.
- ENEMIES (rip-enemies.py TALL): `moblin_d1` 16x25, `moblin_u1` 16x26 (its
  spear), `stalfos_s0/s1` 26 wide (its blade), `urchin_0/1/death` 16x20.
  Draw offsets only in enemies.js; no hitbox touched, no replay re-recorded.
  `darknut_d1` is an unused 16x16 crop, left.
- Pictures: docs/briefs/s247/cutoff-*.png.

### Then: "merge and act on all" (the human) — merged to main at 96ac524, then:
Two Sonnet subagents in worktrees (the human asked for the cheaper model),
reviewed and merged here.
- THE LADDER, off the route only: D1 octorok 0,2,3 and 0,2,6; D4 stalfos 0,4,5 / 0,0,1 / 0,6,5, wizzrobe 0,6,5; D5 stalfos 0,0,4 /
  0,0,6 / 0,7,6 / 0,5,6, wisp 0,7,4 / 0,6,3, moblin 0,5,6. D4 keese 21 -> 17,
  D5 22 -> 18 (still ~30%: the rest are in rooms the route enters).
- THREE NEW PUZZLE ROOMS, all off the route, each proved by its kind's own
  checker, paying rupees or a fairy (no key, no heart):
  D2 Chartstone Alcove 0,4,4 `blockRoom` (a block down a walled channel:
  over the well at LOW, over the drain at MID);
  D2 Cistern Cell 0,3,3 `tidePlates` (three pools, the wading one is right);
  D4 Cliffside Cell 0,5,5 `statueRoom`, D4's first (a gutter dry at LOW,
  wading at MID holds the statue while the block goes back). The Cistern has
  no statue art of its own: it wears the Shrine's (`o_statue_wood`).
  tools/dungeon-strands-baseline.json re-recorded for the statue's run.
- THE RACE REMEMBERS A BEST TIME (`progress.raceBest`, tenths; raceAskBest,
  raceRecord are function lines); DOV ASKS (errand `confirm`/`decline`:
  diveConfirm, diveNo). test.mjs +11.
- A choice no longer runs into a third line of text (dialogue.js, +3 px).
- BOSSES checked for cut-off art: none. Wyverna's head leaves the top of
  the screen along the north wall: the S153 camera question, left.
- LOOKED AT AND LEFT: D6's cost is three bosses plus pits and spikes at the
  cartridge's own -4 (HITS=d6); Gloomtide wins only at entry waits 55-59
  (swept 0-300), which is the robot arriving on 16/28, not the fight.
- Pictures: docs/briefs/s247/puzzle-*.png, race-best-*.png, dive-ask.png,
  boss-contact-sheet.png.

### Then: "act on all" again, and "the Octorok side sprites look janky"
(the helpers hit their usage limit; done here)
- THE OCTOROK: the sheet draws its side view facing LEFT and rip-enemies.py
  took it as right (flip False), so it walked tail first and spat from its
  back; now flipped. And two pixels of the sheet's white plate sat enclosed
  between a tentacle and the body in octorok_s0 (sheet 932,309 and 933,310),
  which made that frame four colours and slid its ramp a step: under enemyg /
  enemyb every other step of the walk was a shade darker. rip-enemies.py
  PINHOLES erases them. Pictures: docs/briefs/s247/octorok-walk-*.png.
- THE GEL: gel_1 (eyes shut) has no black, so normalise_ramp put its red on
  slot 3 and under `slime` every other frame was a near-black blob.
  rip-enemies.py RAMP_LIKE maps it onto gel_0's slots. Scanned every enemy
  for frames whose palettes disagree: the rest are real (bubble and wisp
  cycle colours; leever_rise0 is sand; jellyfish hurt/death are poses).
- D4's STATUE: rip-objects.py cuts `o_statue_cistern` (the armos $25 from
  the Dancing Dragon tileset $3a), picked by `themed`; the Cliffside Cell's
  `sprite:` option is gone. Pictures: statue-d4-*.png.
- D2's CHANNEL WALL: tried the crypt's urns (`U`); check-ground refuses a
  row of three props (it reads as a fence), and `#` was a flat slab, so the
  `=` blocks stay. Seasons draws fixed and pushable blocks alike.
- Wyverna over the north wall: still left (S153's camera question).

### Then: "what happened to the intro? It's just a black screen with text"
- The shipwreck opening (S168, src/game/intro.js) played only at power-on,
  before the logo, and the START that passes the card skipped it; a new game
  then showed the `intro` cutscene's two lines on black. The `intro` scene
  now plays the Opening itself (cutscene step `opening: { caption }`): the
  ship, the storm, the white, the shore; the line about Thalassia goes up once
  the sea has drawn back off Link (INTRO_ASHORE_AT), A puts it away, START
  skips the whole thing; it ends on white and the beach fades in from white.
  The title card "The Legend of Zelda / Oracle of Tides" on black is gone
  (the logo has just said it). The robot's newgame taps START in a cutscene
  as well as A. check-text reads the caption. Picture:
  docs/briefs/s247/newgame-opening.png. Playthrough 49/49 unchanged.

### Verified
Whole table green; test.mjs 170 after the second part (159 after the first); check-rippers 45/45.
check-playthrough 49/49, THE END, never died, low-water 5 (Wyverna).
Bosses end: Gloomtide 6/28, Wyverna 5/32, Rootmaw 16/40, Nereth 24/44.

### Next
- docs/AUDIT-S247.md "Still open" under each heading.

