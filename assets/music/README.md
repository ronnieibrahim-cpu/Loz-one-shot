# Source music data

`oracles-disasm/` holds files copied verbatim from Stewmath's Oracle of
Seasons / Ages disassembly, **github.com/Stewmath/oracles-disasm**
(commit 7584d8723afcf8861c5c1c46fb07d747a12bc655). Credit to that project and
its contributors, who took the cartridge's sound engine and music apart; the
music itself is Nintendo's and Capcom's.

| File | From | Used for |
|---|---|---|
| `mus/titlescreen.s` | `audio/common/mus/` | the `title` track |
| `mus/fileSelect.s` | `audio/common/mus/` | the `fileSelect` track |
| `mus/overworld.s` | `audio/common/mus/` | the `overworld` track (Holodrum) |
| `mus/intro1.s`, `mus/intro2.s` | `audio/common/mus/` | ripped, not yet played — the Seasons opening, kept to match recordings against |
| `sfx/getItem.s` | `audio/common/sfx/` | the `itemGet` jingle |
| `waveforms.s` | `audio/common/` | the wave channel's waveforms |
| `noise.s` | `audio/common/` | the noise channel's drum table |
| `audio-tables.s` | `code/audio.s`, lines 1811-1929 | frequency, envelope-wait and vibrato tables |

`tools/rip-music.py` reads these and writes `src/data/music-seasons.js`;
`src/core/gbsound.js` plays it. `tools/check-rippers.mjs` proves the rip
reproduces byte for byte, and `tools/check-music.mjs` checks the tracks.
