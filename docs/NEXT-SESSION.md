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

### Verified
Whole table green; test.mjs 170 after the second part (159 after the first); check-rippers 45/45.
check-playthrough 49/49, THE END, never died, low-water 5 (Wyverna).
Bosses end: Gloomtide 6/28, Wyverna 5/32, Rootmaw 16/40, Nereth 24/44.

### Next
- docs/AUDIT-S247.md "Still open" under each heading.

