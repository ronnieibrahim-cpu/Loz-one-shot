# Source sprite sheets

**These sheets are the canonical reference for every visual in this project**,
including assets drawn from scratch — see `docs/ART-DIRECTION.md` for the rules
they impose.

Reference sheets the extraction tools in `tools/` read from. They are committed
so the extractions are reproducible in any checkout — `tools/rip-link.py` and
`tools/rip-npcs.py` resolve paths here relative to the repo root, and both
regenerate byte-identical output.

| File | Game | Ripped by | Tool | Generates |
|---|---|---|---|---|
| `oracle-ages-link.png` | Oracle of Ages | Mister Mike | `tools/rip-link.py` | `src/data/sprites-player.js` — 40 Link frames |
| `oracle-seasons-npcs.png` | Oracle of Seasons | Trailsdegamer | `tools/rip-npcs.py` | `src/data/sprites-npcs.js` — 9 NPC sprites |
| `oracle-seasons-enemies.png` | Oracle of Seasons | Mister Mike | `tools/rip-enemies.py` | `src/data/sprites-enemies.js` — 56 enemy sprites |
| `oracle-seasons-hud-gear.png` | Oracle of Seasons | Mister Mike | `tools/rip-hud.py` | `src/data/sprites-hud.js` |
| `oracle-seasons-dungeon-backgrounds.png` | Oracle of Seasons | Mister Mike | `tools/rip-terrain.py` | `src/data/tiles-terrain.js` — dungeon ground |
| `custom-oracle-style-overworld.png` | fan-made, Oracle style | community edit | `tools/rip-terrain.py` | `src/data/tiles-terrain.js` — overworld ground |
| `oracle-ages-overworld.png` | Oracle of Ages | *unattributed — see below* | `tools/rip-terrain.py` | `src/data/tiles-terrain.js` — overworld props |
| `oracle-seasons-nonhuman-races.png` | Oracle of Seasons | Mister Mike | — | not yet extracted from |
| `oracle-seasons-trading-characters.png` | Oracle of Seasons | Mister Mike | — | not yet extracted from |

`oracle-ages-overworld.png` is the Labrynna Present outdoor background, True
Colors half, and it is **the real overworld reference** — the one to reach for
first. `custom-oracle-style-overworld.png` is a fan-made assembled map and its
props are merged into masses; the Ages sheet has standalone props on a strict
16px grid at phase (2, 8), which is what makes them extractable at all. It was
supplied without a ripper credit in its filename; it is from
spriters-resource.com like the others, and the credit should be filled in here
if anyone finds it rather than guessed at.

**Extract rather than redraw.** If one of these sheets has the thing you need,
take it from the sheet — fidelity to the source is the point of the project,
and an extraction is reproducible where a hand-drawing drifts. The two sheets
marked "not yet extracted from" are opportunities, not exclusions. See
`docs/ART-DIRECTION.md` for the rule and `docs/briefs/AGENTS.md` section J for
the workflow.

**Everything above is generated output.** Edit the tool's coordinate map and
re-run it; never hand-edit the file it writes.

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
