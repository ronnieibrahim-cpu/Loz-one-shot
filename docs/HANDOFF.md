# Handoff — Oracle of Tides

State of the project as of this handoff, and what a fresh session needs to know.

## Where things stand

Branch: `claude/zelda-style-game-piqt8v` (everything committed and pushed).

**The engine is complete and verified.** `node tools/test.mjs` boots the game in
headless Chromium and passes 35 assertions covering boot, movement, sword
combat, contact damage, the tide, room transitions, cave warps, the pause menu,
save/load round-tripping, death and respawn. Keep it green.

| Area | State |
|---|---|
| Engine, renderer, audio, save, menus, cutscene runner | Done |
| Tide system and tide-variant tiles | Done |
| Player, combat, items, enemy framework, boss framework | Done |
| Link sprites | Done — extracted from the Oracle of Ages sheet |
| NPC sprites (9 of 11) | Done — extracted from the Oracle of Seasons sheet |
| Terrain tiles, HUD | Done — hand-drawn |
| Enemy sprites (56) | **Not done** — placeholder boxes |
| Effects + item icons (83) | **Not done** — placeholder boxes |
| Boss/miniboss art (49) | **Poor** — script-generated blobs, needs redraw |
| Overworld | **6 screens of 120** |
| Dungeons 1-8 | **Not started** |
| Boss/miniboss behaviour (16) | **Not started** — `src/data/bosses.js` is a stub |
| Story and dialogue | **Intro only** |
| Music | 6 tracks, needs about 14 |

`node tools/validate.mjs --strict` lists every missing sprite by name. Missing
art renders as a coloured placeholder box rather than vanishing, so gaps are
always visible on screen and countable.

## The two documents that matter

- **`docs/GAME-PLAN.md`** — authoritative. Region layout on the 12x10 overworld
  grid, all eight dungeons with their map ids, items, bosses, minibosses,
  overworld entrance screens and tide themes, the item progression table, and
  the damage/HP numbers. Content that disagrees with this is wrong.
- **`docs/ART-DIRECTION.md`** — binding for anything visual. Declares
  `assets/sheets/` the canonical art reference, gives the style rules measured
  from those sheets, and sets the rule: extract when a sheet has it, draw to
  match when it does not. New assets are held to the same standard as extracted
  ones.
- **`docs/briefs/AGENTS.md`** — a complete authoring spec per work area,
  sections A through J. Each section names the one file to edit and how to
  verify. Section J documents the sprite-sheet extraction workflow.

## Tooling

```sh
npm run dev                          # play it at localhost:8080
node tools/validate.mjs              # structural checks, no browser
node tools/validate.mjs --strict     # also fail on unauthored sprites
node tools/validate.mjs --pack=enemies   # scope the sprite-coverage check
node tools/test.mjs --shots          # 35 assertions + screenshots
node tools/preview.mjs enemies --scale=6  # contact sheet of a sprite pack
```

`test.mjs` and `preview.mjs` take `--shot-dir=` and pick a random port, so
several can run at once.

## Hard-won lessons — do not rediscover these

**Sprite-sheet extraction** (`tools/ripkit.py`, worked examples in
`tools/rip-link.py` and `tools/rip-npcs.py`):

1. Sheets **do not use a uniform row pitch**. Assuming 16px steps cuts every
   sprite in half. `find_cells` measures each sprite's own bounding box.
2. Full-colour sprites need **per-sprite palettes bound to the art** via the
   `{ art, pal }` form. Registering palettes without binding them makes
   everything render in the wrong colours.
3. Packed sheets **leak neighbouring pixels** into a cell; `_trim_slivers`
   drops edge columns disconnected from the sprite body.
4. Always `preview.mjs` the pack and **look at the PNG**. Dimensional validity
   says nothing about whether a sprite reads as the creature it names.

**Engine gotchas already fixed, worth not reintroducing:**

- Input latches key presses, so a tap shorter than one frame still registers.
- Room-exit detection needs a margin wider than one movement step, or exits
  never trigger.
- Warping sets `_warpLock` so arriving on a warp tile does not bounce straight
  back through it.
- The validator rejects a space between two drawn pixels: it is legal in the
  grammar but punches a transparent hole through a sprite.

## Source sprite sheets are in the repo

The reference sheets live in `assets/sheets/` and are committed, so extractions
are reproducible in any checkout — nothing depends on a session's upload
directory. Both extractors resolve their paths relative to the repo root:

```sh
python3 tools/rip-link.py --emit    # regenerates src/data/sprites-player.js
python3 tools/rip-npcs.py           # regenerates src/data/sprites-npcs.js
```

Both currently produce byte-identical output to what is committed. See
`assets/sheets/README.md` for what each sheet contains, who ripped it, and the
copyright position.

Sheets present but not yet used: enemies, non-human races, trading characters,
dungeon backgrounds, and a fan-made Oracle-style overworld tileset.

## Ordering advice

Content packs are independent — each owns one file in `src/data/` and
`src/data/index.js` already wires all of them. Highest value first:

1. **Enemy sprites** — 56 placeholders, all with working AI behind them. The
   enemy sheet is labelled and maps almost directly. Biggest visual jump.
2. **Overworld** — 114 missing screens; the game currently has nowhere to go.
3. **Dungeons 1-4, then 5-8** — the actual game.
4. **Boss behaviour**, then **boss art redraw**.
5. **Story**, **music**, **effects and item icons**.

Note that five enemy names are original to this game and have no sheet
equivalent — `anglerfry`, `barnacle`, `jellyfish`, `siren`, `urchin` —
substitute the nearest real creature and say so in a comment.

## A note on scope

This was attempted as a single-shot build and the engine got there; the content
did not. Sessions repeatedly hit usage limits mid-flight, which is why the specs
are written down so precisely — the work is resumable by anyone, in any order,
with mechanical verification at every step.
