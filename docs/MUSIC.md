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

| Place | Track | Status |
|---|---|---|
| Title screen | `title` | Seasons' own |
| File select | `fileSelect` | Seasons' own |
| Intro cutscene | none, then `village` / `overworld` (story.js steps) | own |
| Coast: Tidewatch Village, dunes, strands, Grotto approach (overworld screens) | `overworld` | Seasons' own; shared with the Kell cliffs and the Drowned Wood |
| The Kell cliffs (Kell Head .. Cistern Mouth) | `overworld` | shared |
| The Drowned Wood (Wood Edge .. Shrine Mouth) | `overworld` | shared |
| The Reef (24 screens, Coral Gate .. Spire Mouth) | `reef` | own |
| The Marsh (12 screens, Bog Head .. Sanctum Mouth) | `marsh` | own |
| The Salt Pans (12 screens) | `salt` | own |
| The Abyss shore (8 screens, Drowned Shore .. Gate of the Keep) | `abyss` | own |
| Village houses: the Maku Tree, a village house, the Net-mender's, Sandpiper Cottage | `village` | shared by the four houses |
| Tidewatch Shop | `shop` | own |
| Caves: Bluff Grotto, Reef Hollow, Salt Pan Vault, Palace Porch | `cave` | shared by the four caves |
| D1 Tidewash Grotto (and the Clawcrab) | `dungeon` | own |
| D2 Coral Spire (and the Reefguard) | `dungeon2` | own |
| D3 Bogwater Sanctum (and Bogmaw) | `dungeon3` | own — new S150 (was `dungeon`, shared with D1 and D5) |
| D4 Cliffside Cistern (and the Iron Knight) | `dungeon4` | own — new S150 (was `dungeon2`, shared with D2 and D6) |
| D5 Drowned Wood Shrine (and Thornvine) | `dungeon5` | own — new S150 (was `dungeon`) |
| D6 Abyssal Keep (Tideshade, the Brinehulk) | `dungeon6` | own — new S150 (was `dungeon2`) |
| Bosses D1-D5: Gohmaraq, Anemos, Gloomtide, Wyverna, Rootmaw | `boss` | shared by five bosses |
| Nereth (D6 throne room) | `finalBoss` | own |
| Ending | `ending` | own |
| Jingles: item get, fanfare, essence, boss clear, game over, secret, heart piece | `itemGet`, `fanfare`, `fanfareShort`, `essence`, `bossClear`, `gameOver`, `secret`, `heartPiece` | own |

No place is silent by accident: the intro's and the ending's `music: null`
steps are authored silences.

## Still shared (candidates for later passes, fewest first)

1. `boss` — five bosses share one fight theme. Seasons shares one boss theme
   across its dungeons too, so this is faithful rather than wrong; a per-boss
   theme is a design choice for the human.
2. `cave` — four caves. Seasons plays one cave theme everywhere as well.
3. `village` — four houses, as Seasons' houses share Horon's.
4. `overworld` — the coast, the Kell cliffs and the Drowned Wood. Seasons
   plays Holodrum across most of its overworld; the cliffs and the wood are
   the regions that could want their own.

Target met: no dungeon shares a track with another dungeon.
