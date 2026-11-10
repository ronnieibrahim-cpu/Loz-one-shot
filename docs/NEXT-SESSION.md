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

### Verified
Whole table green; test.mjs 159; check-rippers 45/45.
check-playthrough 49/49, THE END, never died, low-water 5 (Wyverna).
Bosses end: Gloomtide 6/28, Wyverna 5/32, Rootmaw 16/40, Nereth 24/44.

### Next
- docs/AUDIT-S247.md "Still open" under each heading.

