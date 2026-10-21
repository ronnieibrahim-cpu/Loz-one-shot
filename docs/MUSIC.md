# Music — every place and the track it plays

Read from the data, not from memory (S150): a room's `music:` wins, else its
map's `music:`, else `overworld`; while a real boss (`g.boss`) is alive the
dungeon's `bossMusic` plays, else `boss` (`Game.updateMusic`). Minibosses are
not `g.boss`, so they keep the dungeon's own track. Tracks live in
`src/data/audio.js`; `check-music`, `check-sfx` and `check-audio-render` guard
them.

FOUR ARE ORACLE OF SEASONS' OWN (S151, at the human's request, with the
soundtrack recordings they sent to check against): `title` (the title screen;
the soundtrack's "Title Screen" and "Main Menu" are its two halves),
`fileSelect`, `overworld` (Holodrum; S148's transcription by ear is retired)
and the `itemGet` jingle. They are not transcriptions: tools/rip-music.py rips
the cartridge's channel scripts from Stewmath's oracles-disasm (copied into
assets/music/oracles-disasm/) into src/data/music-seasons.js, and
src/core/gbsound.js plays them the way the cartridge's sound engine and the
Game Boy's sound hardware do, looped at the cartridge's own loop points.
Checked against the recordings by pitch-class match: overworld 0.93, file
select 0.89, title 0.85, each lined up from its first note. The "Get Item"
recording opens with the same four rising notes as sfx/getItem.s but runs two
further steps and lands on a different chord, so it may be a different
edition's jingle — the cartridge's is what plays. Every other track is ours.

## Places

Re-read from the data at S199 (the music pass, rotation (e) pass 1).

| Place | Track | Status |
|---|---|---|
| Title screen | `title` | Seasons' own |
| File select | `fileSelect` | Seasons' own |
| Intro cutscene | none, then `overworld` (story.js steps) | authored silences, then Seasons' |
| The coast round Tidewatch: col 3 rows 6-9, col 9 rows 7-9, row 9 (19 screens) | `overworld` | Seasons' own (Holodrum) |
| Tidewatch Village (10 screens) | `tidewatch` | own (S158) |
| Sandpiper Row (3 screens) | `sandpiper` | own (S158) |
| The Kell cliffs, 0..3 x 2..5 (16 screens) | `kell` | own — new S199 (was `overworld`) |
| The Drowned Wood, 4..10 x 3..5 and 4..9 x 6 (27 screens) | `wood` | own — new S199 (was `overworld`) |
| The Dunes, 10..16 x 6..7 and 10,11,15,16 x 8 (18 screens) | `dunes` | own — new S199 (was `overworld`) |
| The Reef (36 screens) | `reef` | own |
| The Marsh (12 screens) | `marsh` | own |
| The Salt Pans (21 screens) | `salt` | own |
| The Abyss shore (8 screens) | `abyss` | own |
| The Maku Tree's grove | `maku` | own — new S199 (was `village`) |
| Houses: a village house, the Net-mender's, Sandpiper Cottage, Farore's Shrine | `house` | own — new S199 (was `village`, retired) |
| Tidewatch Shop | `shop` | own |
| Caves (all 18) | `cave` | shared, as Seasons' caves share one |
| D1 Tidewash Grotto | `dungeon` | own |
| D2 Coral Spire | `dungeon2` | own |
| D3 Bogwater Sanctum | `dungeon3` | own |
| D4 Cliffside Cistern | `dungeon4` | own |
| D5 Drowned Wood Shrine | `dungeon5` | own |
| D6 Abyssal Keep | `dungeon6` | own |
| The Lower Vault (Salt Pans) | `vault` | own — new S199 (was `dungeon`) |
| Gullwind Eyrie | `eyrie` | own — new S199 (was `dungeon`) |
| The Sunken Palace | `palace` | own — new S199 (was `dungeon`) |
| Every miniboss while it lives | `miniboss` | own — new S199 (was the dungeon's own) |
| Bosses D1-D5 | `boss` | shared, as Seasons shares one |
| Nereth | `finalBoss` | own |
| Ending | `ending` | own |
| Jingles | `itemGet`, `fanfare`, `essence`, `bossClear`, `gameOver`, `secret`, `heartPiece` | Seasons' own |

A miniboss is a `Boss` that clears `isBoss`, so it never sets `g.boss`;
`Game.updateMusic` asks whether one is alive in the room (or waiting in
`pendingAdd` on the way in) and `onEnemyDefeated` asks again once it is gone.
test.mjs drives it.

No place is silent by accident: the intro's and the ending's `music: null`
steps are authored silences.

## Still shared (faithful to Seasons, not gaps)

1. `boss` — five bosses share one fight theme, as Seasons' do.
2. `cave` — every cave, as in Seasons.
3. `house` — every house and Farore's shrine, as Seasons' houses share one.
4. `overworld` — only the coast round Tidewatch now.

Target met: no dungeon, optional or not, shares a track with another.
