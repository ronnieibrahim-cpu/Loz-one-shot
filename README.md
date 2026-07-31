# The Legend of Zelda: Oracle of Tides

A Game Boy Color style action-adventure in the mould of *Oracle of Seasons* and
*Oracle of Ages*, built to run in a browser with no dependencies.

Where Seasons gave you the Rod of Seasons and Ages gave you the Harp of Ages,
this one gives you the **Moon Conch**: a shard of the shattered Tide Bell that
raises and lowers the sea across the entire world.

## The tide

One global variable with three states, cycled LOW → MID → HIGH → LOW by sounding
the conch. Every tide-sensitive tile in the world resolves differently at each
level, so a single button press reshapes the map:

| Level | What changes |
|---|---|
| **LOW** | Sandbars and seafloor exposed. Sunken cave mouths open. Channels become wadeable. |
| **MID** | The world's default state. |
| **HIGH** | Shallows become deep water. Low walls submerge so you can swim over them. Rafts float up to high ledges. |

In room data this is expressed directly: **digits 0-9 in a room's text grid are
always tide tiles**, so a screen's tide behaviour is readable at a glance.

## Playing it

```sh
npm run dev      # serves on http://localhost:8080
```

Then open the URL. ES modules need HTTP, so opening `index.html` from disk will
not work.

| Input | Action |
|---|---|
| Arrows / WASD | Move |
| Z / J / N | B item |
| X / K / Space | A item, talk, read, open |
| Enter | Start (pause menu, and fast-forwards cutscenes) |
| Tab / Shift | Select (cycles menu tabs) |
| P | Mute |
| O | Debug overlay |

Gamepads work, and on-screen controls appear on touch devices.

## Project layout

```
src/core/     screen, input, audio (4-channel GBC synth)
src/gfx/      art pipeline, palettes, bitmap font
src/world/    tile registry with tide variants, rooms, maps
src/game/     player, enemies, bosses, items, objects, HUD, menus, cutscenes
src/data/     all content: tiles, sprites, maps, dungeons, enemies, story, music
tools/        validator, headless play-test harness, sprite preview
assets/sheets/ source sprite sheets: the canonical art reference
docs/         GAME-PLAN.md (content contract), ART-DIRECTION.md (art rules),
              HANDOFF.md (project state), briefs/AGENTS.md (authoring specs)
```

Content is data, not code. `src/data/index.js` installs every pack into the
engine registries, and both the game and the offline validator go through it, so
whatever validates is exactly what the game loads.

## Tooling

```sh
node tools/validate.mjs            # structural checks, no browser needed
node tools/validate.mjs --strict   # also fail on unauthored sprites
node tools/test.mjs --shots        # drive the game in headless Chromium
node tools/preview.mjs link        # render a sprite pack to a contact sheet
```

`validate.mjs` checks art dimensions and legal characters, tile and tide-variant
integrity, that every room grid is 8 rows of 10 characters, that every legend
character resolves to a registered tile, and that every warp points at a room
that exists.

`test.mjs` boots the game in Chromium and asserts on live state across 35 checks
covering boot, movement, sword combat, contact damage, the tide (including that
a sandbar really is walkable at LOW and deep at HIGH), room transitions, cave
warps, the menu, save/load round-tripping, death and respawn.

## Current state

The engine is complete and verified: all 35 assertions pass.

| Area | State |
|---|---|
| Engine, renderer, audio, save system | Done |
| Tide system and tide-variant tiles | Done |
| Player, combat, items, enemies framework | Done |
| Boss framework (phases, tells, weak points) | Done |
| Link sprite | Extracted from the Oracle of Ages sheet, on-model |
| HUD and terrain art | Done |
| Boss and miniboss art | Placeholder quality, needs a redraw |
| Enemy, NPC, object, effect and item-icon art | Not yet drawn |
| Overworld (120 screens) | 6 screens of 120 |
| Dungeons 1-8 | Not yet authored |
| Boss and miniboss behaviour | Not yet implemented |
| Story, dialogue, cutscenes | Intro only |
| Music | 6 tracks, needs the full set |

Unauthored sprites render as coloured placeholder boxes rather than vanishing,
and `validate.mjs --strict` reports exactly which names are missing, so the gap
is always visible and countable.

The remaining work is content authoring against contracts that are already
fixed and machine-checked: `docs/GAME-PLAN.md` pins the region layout, dungeon
and item assignments and progression gates, and `docs/briefs/AGENTS.md` carries
a complete spec for each remaining pack.

## A note on names and art

This is a fan work. It uses Nintendo's character and world names directly
(Link, Zelda, Farore, the Maku Tree, Rupees, Octoroks), and Link's sprites are
extracted from a rip of *Oracle of Ages* (ripped by Mister Mike, via
spriters-resource.com) — that artwork is Nintendo's. The engine, the tide
mechanic, the land of Thalassia, its bosses and its music are original.

Fine as a personal project. Publishing or hosting it would be both a trademark
and a copyright problem, and the extracted sprites make that unambiguous.

`tools/rip-link.py` holds the extraction: point it at the sheet and it
regenerates `src/data/sprites-player.js`. Swapping in original art means
replacing that one file.
