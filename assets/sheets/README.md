# Source sprite sheets

**These sheets are the canonical reference for every visual in this project**,
including assets drawn from scratch — see `docs/ART-DIRECTION.md` for the rules
they impose.

Reference sheets the extraction tools in `tools/` read from. They are committed
so the extractions are reproducible in any checkout — `tools/rip-link.py` and
`tools/rip-npcs.py` resolve paths here relative to the repo root, and both
regenerate byte-identical output.

| File | Game | Ripped by | Used for |
|---|---|---|---|
| `oracle-ages-link.png` | Oracle of Ages | Mister Mike | `src/data/sprites-player.js` — all 40 Link frames |
| `oracle-seasons-npcs.png` | Oracle of Seasons | Trailsdegamer | `src/data/sprites-npcs.js` — 9 NPC sprites |
| `oracle-seasons-enemies.png` | Oracle of Seasons | Mister Mike | not yet used — intended for `sprites-enemies.js` |
| `oracle-seasons-nonhuman-races.png` | Oracle of Seasons | Mister Mike | not yet used |
| `oracle-seasons-trading-characters.png` | Oracle of Seasons | Mister Mike | not yet used |
| `oracle-seasons-dungeon-backgrounds.png` | Oracle of Seasons | Mister Mike | not yet used — dungeon tiles |
| `custom-oracle-style-overworld.png` | fan-made, Oracle style | community edit | not yet used — overworld tiles |
| `oracle-seasons-hud-gear.png` | Oracle of Seasons | Mister Mike | `tools/rip-hud.py` -> `src/data/sprites-hud.js` |

All obtained via spriters-resource.com. Most sheets carry two halves: "GBC LCD
Colors" simulates the handheld screen, "True Colors" is the raw palette. The
extraction tools read the True Colors half.

## Copyright

**The artwork in these files is Nintendo's.** The rips are redistributed here
under the ripper credits above, as those rippers request. This is a personal fan
project; the sheets and everything extracted from them would have to be removed
and replaced with original art before this could be published or hosted
anywhere.

Everything extracted lands in a generated file whose header records its source,
so the replacement path is: redraw the art, regenerate or hand-write that one
file, delete this directory.
