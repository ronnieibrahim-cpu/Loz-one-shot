## S254 — fairness pass 2: Gohmaraq and Reefguard read; nothing changed

Same branch, after S253's merge (abff0e7). "Continue iterating", no new picks.

### Found (13 entry waits each on the real run)
- REEFGUARD (D2 miniboss, wait 31): 10/13, wins 0..49 on 15-20 qh, losses at
  55-67 only. The route sits mid-band. Fair; left.
- GOHMARAQ (D1 boss, wait 244, 16 qh bar): 8/13 (172-208 on 5, 244 on 12,
  256 on 4, 280/292 on 2-3; losses 220, 232, 268, 304, 316, all deaths).
  Losses: Link against the TOP WALL (y 8) with Gohmaraq patrolling the same
  row (y 6) — the robot backs off along the wall while swinging and the
  patrol catches it every stop (three 4-qh touches in 80 frames); or slow
  attrition by spit plus the phase-3 crabs. A robot habit: a person steps
  off its row.
- Robot options, all WORSE: openRetreat+cornerSwing 3, +waitInvuln 3,
  wallRetreat 4 4, breakPin boss+clearAdds 4.
- A fight draft (Gloomtide's draw-back after a touch) was tried and REVERTED,
  never shown: in every phase 4/13 (a boss that backs away is harder to
  catch; the cancelled charge also skipped its open window); charge phase
  only (opening its shell as the charge ends) changed nothing to the
  quarter-heart — no loss is a charge touch.
- Next, if anyone: a robot option that retreats PERPENDICULAR to a
  patrolling boss's axis (off its row) instead of along it.
- D5's approach to Rootmaw (40 -> 21 qh on S253's run): spread over seven
  rooms, 2-6 qh each (1,4,2 the most: a shot and two crab touches). No one
  room to fix.

## S253 — rotation (h) fairness pass 2 continued, the music the human picked, loose ends

Branch claude/oracle-tides-continue-odpb1p, off main at 56dc209. The choices
page: https://claude.ai/artifact/JA1mFbHYpS1vSfzU5JXiTB (version 2; every clip
and picture is also in docs/briefs/s253/).

### The human's choices this session (do not re-ask)
- No play notes yet (PLAY-D5-TO-D6.md still unplayed).
- MUSIC: the Tidewatch seam fix YES; cartridge themes for the HOUSES (+ Farore's
  Shrine, the lighthouse, and the shop: "indoor theme", asked separately) and
  the MAKU GROVE only. Caves, bosses + credits and dungeons keep ours.
- GLOOMTIDE: keep the draw-back after a bite (offered with a clip).
- MOORING POST: keep the post (offered: Ages' bollard, Ages' ring in stone,
  Seasons' pilings — no sheet has a true ring or cleat).
- CLIFFS: keep ours (offered: Ages' autotiled lips/faces/ends, mocked on four
  screens, docs/briefs/s253/cliffs/).
- PENSTOCK ICE: keep the Keep's block (neither cartridge has another ice
  block; recolours in the Cistern's palettes were offered).
- WATERFALL: all three spots (Rustfall 0,3,0; Cliff Face 0,3,3; Cistern Path
  0,0,3).
- MAKU SMILE: at her gifts and on her "Hoo hoo!" lines.
- BATS in D4/D5 puzzle rooms: URCHINS (offered: fewer; leave).

### Built
- Rootmaw (fight unchanged): the route's boss options gain diagRetreat,
  openRetreat, cornerSwing. Read on the real run, 13 entry waits: was 1/13
  (every loss the last phase pinning Link in the SW corner by the door);
  with them 13/13 at the old arrival (31 qh). pushThrough no longer matters.
  After this session's other changes the run arrives on 21 qh and it reads
  9/14; wait 138 -> 96. Clips docs/briefs/s253/bosses/rootmaw-*.
- Gloomtide: onTouchLink sets e._recoil = GLOOMTIDE_RECOIL_FRAMES (40,
  guessed) and every phase's chase becomes a flee at GLOOMTIDE_RECOIL_SPEED
  (0.55) while it lasts. Damage and health unchanged. Real run 11/13 (left
  1..21, route's own wait on 2) -> 13/13 (left 5..22, route's wait on 12).
  Robot alternatives tried first and no better: walking out to the side
  before the fight (7/13), and S251's set.
- Ironknight: NOT unfair — all 7 of its 13 "losses" end with Link on a full
  bar (the knight charges end to end of its 2x1 hall and the robot trails a
  row off its line); wins leave 16..32. Options tried: diag set 0/13,
  pushThrough+breakContact 6/13. Left alone; a robot fix is optional.
- Music: rip-music.py TRACKS += indoors, makuTree; audio.js shop/house ->
  { seasons: 'indoors' }, maku -> { seasons: 'makuTree' } (ours in git
  history). tidewatch pattern C's last row holds instead of resting (RMS
  round the 24 s loop flat). check-sfx's channel test plays 'tidewatch' (the
  indoor theme has no noise channel). audio-render baseline re-recorded.
  Clips docs/briefs/s253/music/.
- Waterfalls: tiles fallTopDk/fallDk/fallTopAbyss/fallAbyss (tide: cliff at
  LOW, the fall at MID and HIGH — the water above them drains at LOW), legend
  F/I in `cliffs` and `abyss`. Solid for solid: no path changed.
  docs/briefs/s253/built/waterfalls.png.
- Maku smile: MakuTree.faceNow returns face+'_happy' while game.itemShow
  (a gift held up) and on a fully typed page starting "Hoo hoo!".
  docs/briefs/s253/built/maku-smile.png.
- Urchins: the lone keese in the 17 puzzle rooms (D4: Spike Basin, Weir,
  Squall Loft, Drowned Sill, Cistern Gauge, Long Race, Ebb Cell, Intake, Wind
  Loft; D5: Standing Grove, Sunken Bracken x2, Knotted Pool, First Stake, Bole
  Walk, Sunken Nave, Long Ford, Shrine Ford), same squares. D4 keese 11 -> 2,
  D5 14 -> 5. None hits the run.
- film-bosses.mjs: PATCH, END and ONLY (film one fight before/after a route
  change without the whole run).

### Found
- Helper branches (local, not merged): the cliff mock found Ages' cliff cells
  at grid phase (2,2), not (2,8) as ART-BACKLOG said; the ice-recolour ripper
  commit (o_iceblock_cistern_grey/_blue) was NOT taken.
- The Maku text box sits over her face only if Link stands low in the grove;
  where the route stands him it does not.

### Next
- Rootmaw reads 9/14 now only because the run arrives poorer (D5 costs 19 qh
  on this RNG: Shrine Ford crabs, the S252 darknut and wisp). At 31 it is
  13/13. Either make D5's approach cheaper or leave.
- Gohmaraq and Reefguard (9/13 each) not yet read.

## S252 — non-boss polish pass 2: enemies, Ages' water, the Maku Tree's face, proposals

Branch claude/oracle-tides-polish-uxh3wb, off main at 1e6c8d6. The proposals
page the human chose from: https://claude.ai/artifact/JA1mFbHYpS1vSfzU5JXiTB
(pictures and clips also in docs/briefs/s252/).

### The human's choices this session (do not re-ask)
- BATS: "swap half" in the rooms the route walks (offered: add to empty side
  rooms; leave). Every keese left in D4/D5 was already in a route room.
- D1 OCTOROK on the main path: yes, the Drinking Floor's far bank. (D1 has
  had two in side rooms since S247 — the S247 audit's "none" was stale.)
- AGES' WATER: the pool water and the waterfall; NOT the fall-foot as surf.
- THE WIND'S WARP goes to white.
- Asked again later (skipping music): D2 THE MIRROR CELL and D4 THE PENSTOCK
  (offered: the Painted Floor; the Weir Walk; neither). A non-TAS recording:
  "not now".
- MUSIC (the swaps and the Tidewatch seam fix) is UNDECIDED: the human
  skipped that question twice. Clips are on the proposals page.

### Built
- Maku Tree (Sonnet helper, reviewed): rip-maku.py FACES — talk (panel 3,1),
  open (6,1), happy (4,1, emitted, unused), each grass+bark+face sprites;
  MakuTree.faceNow alternates talk/open every MAKU_TALK_FRAMES (8, guessed:
  the disasm copies hold no Maku interaction script) while text types, open
  while the box waits. docs/briefs/s252/maku/.
- Ages' pool water (helper, reviewed): rip-terrain.py waterP0..3 from the
  Ages strip row y=2903; waterS/waterSReef/dWaterS use it, 4 steps at 13 f;
  the shore edge rebuilt over it. Ages' waterfall `waterfall`/`waterfallTop`
  (y=2920 and y=2852 x179) added, placed nowhere yet (validate warns
  unreachable). Old waterS0..2 picks still in the ripper, unused.
  docs/briefs/s252/water/ (surf_* pictures show the declined surf).
- Enemies (room data, same squares): D1 0,3,6 keese -> octorok. D4: 0,3,6
  stalfos, 0,4,4 bubble, 0,3,3 stalfos, 0,5,2 wizzrobe + stalfos, 0,0,3
  bubble (keese 17 -> 11). D5: 0,3,6 wisp, 1,3,4 darknut, 1,4,3 moblin, 1,4,2
  wisp (keese 18 -> 14). TRIED AND PUT BACK (the run died or was knocked
  down a shaft): D4 Cistern Gauge 0,2,2 bubble (took the sword mid-cube),
  Ebb Cell 0,0,4 stalfos, Wind Loft 2,4,2 wizzrobe; D5 0,4,4 moblin, 0,3,4
  wisp, 0,0,2 darknut, 0,1,3 wisp, 0,3,3 moblin (D5 cost 40 -> 7 hp and a
  death). Lesson: a tough enemy in a room where the robot is busy with a
  puzzle (cube, wheels, sowing) costs far more than in a plain room.
- game.js startGaleWarp: `white: true`.
- THE MIRROR CELL (helper, reviewed): d2 0,1,5 west of the Map Nook, a
  `statueRoom` (LOW: three pushes walk the statue onto its plate; MID holds
  it for the fourth). The Spire's own armos `o_statue_coral` ripped
  (rip-objects.py, Explorer's Crypt metatile $25). Two rupee20.
- THE PENSTOCK (helper, reviewed): d4 0,1,6 west of the Overflow Sluice, an
  `iceRoom` behind a cell door a drowned wheel opens (the Bellows at MID);
  LOW a well catches the block, MID it floats over the sumps to the plate.
  Wears the Keep's ice block. check-iceblocks learned `iceRoom.open`: doors
  another puzzle opened, floor to the model, opened first in the engine.
- dungeon-strands baseline re-recorded: the statue's strip (13 cells) and
  the Penstock's wheel tile (1) are sealed by design.
- Replays re-recorded: d1-descent, d1-sluicegate, d5-overthrow,
  tide-steps-split (the octorok, a wisp, the new water's pixels).
- docs/briefs/s252/PLAY-D5-TO-D6.md: the human's play guide, with save codes
  at the D5 and D6 doors cut from the robot's real run (route steps 1218 and
  1851; title -> empty slot -> SELECT -> paste). Both verified to load.

### Found (for the next round)
- FEEL: stairs (STAIRS_FADE), doors (DOOR_FADE + reveal) and the chest's
  36-frame text delay were ALREADY Seasons' (S150-S151); QUEUE (d) was stale.
  Only the wind warp was black (now white) and cutscene fades.
- MUSIC: every place has a track; shared are boss (D1-D5), cave (20), house
  (5 interiors incl. Farore's Shrine and the lighthouse), overworld (home
  coast). Loop joins measured (tools: render each, RMS round the loop point):
  only `tidewatch` dips (pattern C ends on a rest in every channel; holding
  it fixes it — a clip of the fix is on the page). The cartridges' place
  themes render through RIP_ALL_MUSIC; the page pairs every place with the
  closest one (D2-D6 and the Palace with the dungeon whose walls they wear).
  check-sfx: every sound exists; 'fairy' unused is faithful (SND_NONE).
- The low-water mark is now 2, at Gloomtide (D3, untouched): the new enemies
  shift the run's RNG and Gloomtide was already the narrowest fight (S251).
- D2 mocks (Mirror Cell 0,1,5 statue; Painted Floor 0,5,5 tide floor) and
  D4 mocks (Penstock 0,1,6 ice block; Weir Walk 0,5,1 held bridge) are in
  docs/briefs/s252/d2-mock and d4-mock (specs, renders, plain READMEs, the
  checkers' --mock output); each proved by its checker's --mock. Option B of
  D2 needs six legend letters; B of D4 needs Cistern-coloured planks ripped. The pictures are on the proposals page.

### Verified
Whole table green; check-playthrough 49/49, THE END, never died (low-water 2,
Gloomtide); replay 51/51; test 182.

## S251 — rotation (h) fairness pass 2: every fight re-read; Gloomtide

Same branch, after S250's merge (365bf23). Clip:
docs/briefs/s250/gloomtide-last-phase-now-vs-gentler.gif.

### The human's choices this session (do not re-ask)
- No play notes; "other bosses": re-check every fight, find the thinnest.
- Gloomtide: the gentler last phase AND work on Bogmaw (robot first; any
  change to Bogmaw's fight itself goes back to them).
- A fairy under Gloomtide's door (offered: hearts in pots; no healing).

### Found: the real run, 13 entry waits (0..144 by 12) per fight
Clawcrab 11, Gohmaraq 9, Reefguard 9, Anemos 13, Bogmaw 11 (but it costs
16 qh), Gloomtide 0 (the run lived at its one hand-picked wait), Ironknight
6, Wyverna 13 (left 7/32), Thornvine 13, Rootmaw 1 (same: one hand-picked
wait), Tideshade 13, Brinehulk 22/26 (S250), Nereth 13. The rig rows were
stale everywhere (d3's: qh 24 vs the real 16, half the route's options).
Method: tools/route-prefix.mjs with PATCH of the wait before the boss
(INSERT one where there is none); a boss line in the trace is a win.

### Built
- bosses.js Gloomtide last phase: chase 0.72 -> 0.55, ink ring every 150 ->
  240 frames. Damage and health unchanged.
- dungeons-a.js d3 1,3,2 the Lock Gallery: a fairy at 7,2 under the boss
  door (`life: 1e9`). Route: `['loot', 600]` before the walk to the door;
  Gloomtide met on 28/28.
- Route Gloomtide: `breakContact` off (on a full bar it walked Link into
  the corners), wait 56 -> 60. Real run 8/13 (left 1..16); rig 4/13.
- actor-runtime: `leaveTide: L` (sound the conch off a sea the boss wants,
  from leaveRange away), `wallRetreat: px` (a back-off that would end
  against something solid goes sideways), `breakPin: 'boss'` (the boss's
  own touch opens the walk-to-the-middle window). All opt-in, none used by
  the route: NEGATED for Gloomtide (8, 3, 1 of 13 against the 8 without).
- measure-boss-combat: d3 rows re-read; `--opts=JSON` replaces a row's
  options outright.
- Bogmaw: breakContact 0/13, wallRetreat 4, openRetreat 10, both 4 — none
  beat the route's own 11/13. Its cost is corner pins (three touches 34
  frames apart at 14,145 or 13,9). Left as is; the fairy pays it back.

### Verified
Whole table green; check-playthrough 49/49, THE END, never died.

### Next
- ROOTMAW is now the thinnest: 1/13 on the real run (wait 138 alone wins;
  arrival 32/40). Read its losses the same way.
- Ironknight 6/13; Gloomtide 8/13 (margins 1-2 qh); Gohmaraq, Reefguard 9.

## S250 — rotation (h) fairness pass 1: the Brinehulk

Branch claude/oracle-tides-brinehulk-fairness-b4pran, off main at cc2c44e.
Clips: docs/briefs/s250/ (the nook trap in the fight; the trap now vs fixed;
the colossus jammed vs walking).

### The human's choices this session (do not re-ask)
- No iPad play notes (they said so; do not ask this session's way again
  unless the rotation reaches (i)).
- PIT FALLS: Link comes back where he stood (offered: Seasons' rule, back to
  where he entered the room — declined for 2x1 rooms; leave it).
- THE COLOSSUS WALKS ROUND THE POST (offered: leave it jammed).
- IT SLEEPS UNTIL LINK IS ON ITS ISLAND (offered: awake all along, which
  camped the landing; or back to jammed).

### Found
- The rig row was stale: 2/13 as committed; 7/13 re-read off the S249 trace
  (304,95, 42/44, settle 294+78) with the route's options. The real run only
  won at the hand-picked wait 294 (S235 swept ~100 waits for 2 winners).
- Losses: pit falls on the island's west lip (dBoss's fence had no pit rule;
  shards knock him in too); and the plate nooks (15,1 and 23,1): a fall into
  the hole in front of one set Link down inside it (findSafeTile from the
  hole), sealed by that hole — trapped till dead. A scan found ~a dozen such
  pockets in d1/d2/d4/d5/d6/palace/vault/cave19.
- The colossus shivered in place against the mooring post at 20,6: chase's
  side-step toward Link changed sign each frame once level.

### Built
- player.js updateFalling (pit branch): findSafeTile searched from
  `lastSafe` first (where he last stood), the hole as fallback.
- enemy.js chase `{ detour: true }`: keep a side while the main axis is
  blocked. defineBoss/Enemy pass spawn opts to `spec.init` (third arg).
- bosses.js Brinehulk: three chase calls `detour: true`; `brinehulkAsleep`
  (spawn opt `wakeFrom`, a tile column; wakes with a slam and SHAKE when
  Link's cx passes it and he is not falling). dungeons-b.js 2,4,2:
  `['brinehulk', 25, 5, { wakeFrom: 19 }]`.
- actor-runtime dBoss `pitFence: N` (opt-in): fence N px short of a pit.
  Route: Brinehulk `pitFence: 12`, wait 294 -> 96.
- measure-boss-combat: Brinehulk row re-read, carries the route options;
  `--pit-fence[=N]`; `--film=DIR [--film-every=N]` writes the canvas and
  track.json while a fight runs (changes nothing it measures).
- d1 Tide Gallery block `once: false` (the puzzle pushes it 7 tiles; it was
  one-push, and the chest was only reachable by falling in). check-bridges
  walks the planks (`hold`) instead of the route walker, which cut across
  the hole. check-holes +1: every hole beside floor, at every sea, puts Link
  back on the tile he stepped from (2873 steps; red on the old rule).

### Verified
Rig 11/13 (left 5..40). Real stream, waits 0..300 by 12: 22/26. Whole table
green; check-playthrough 49/49, THE END, never died (low-water 5).

### Next
- (i) play pass: ask for notes; none, go round to (a) pass 2.
- (h) pass 2: every other rig row is probably as stale as this one was —
  re-read each off the trace before ranking the fights.

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

