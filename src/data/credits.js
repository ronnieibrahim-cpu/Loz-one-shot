// The staff roll (S213): what the credits show, in order. The shape is
// Seasons' (endgameCutscenes.s) — a place of the world, a roll of names, a
// place, a roll — and the places and the names are ours. The human's choices
// (S213): our places instead of Seasons' four story cards, credited as
// RONNIE with Claude, the ending's own tune playing on through it.
//
// A `scene` is two overworld screens side by side, panned from the first to
// the second, with the bottom of the screens above them showing over the top
// 16 px where the HUD would be. A `names` roll is lines in Seasons' credits
// lettering (A-Z . · - ~ and the drawn digits), 20 to a line at most; `c` is
// the cyan ink Seasons gives a heading, `w` the white of a name, and an empty
// line is a gap. The last roll runs over the sky as it scrolls to the forest.
//
// A scene's `cast` is who is about the place (S214, the human's choice: "yes,
// walking about"), as Seasons' credits scenes load a list of people of their
// own for each place (endgameCutscenes.s stage1, getEntryFromObjectTable1)
// rather than the room's usual ones. Each is [screen, tx, ty, who, opts]:
// `screen` 0 or 1 of the pair, the tile on that screen, and `who` either one of
// Seasons' walking townsfolk (`walk:<name>`, src/data/sprites-npcs.js
// npc_walk_*) or the sprite of one of our own peoples as their room has them.
// `opts` are an NPC's own: `wander`, `dir`, `frames`.
//
// Eight places from the village out to the Keep (S214: "add more"), the
// names split into shorter rolls between them; the lines are S213's.

// The frames our own peoples walk in, as their rooms give them.
const SALTER = { down: ['npc_salter_d'], up: ['npc_salter_u'], side: ['npc_salter_s'] };
const BRINE = { down: ['npc_brine_d'], up: ['npc_brine_u'] };
const REEFKIN = { down: ['npc_reefkin_d'], up: ['npc_reefkin_u'], side: ['npc_reefkin_r'] };

export const CREDITS_ROLL = [
  { scene: [0, 4, 7], cast: [         // Tidewatch Village
    [0, 8, 4, 'npc_salter_d', { frames: SALTER }],
    [0, 3, 6, 'walk:boy', { wander: true }],
    [1, 2, 5, 'walk:lad', { wander: true, dir: 'left' }],
    [1, 6, 5, 'walk:mayor', { wander: true }],
  ] },
  { names: [
    ['c', 'ORACLE OF TIDES'],
  ] },
  { scene: [0, 6, 7], cast: [         // Tidewatch Square
    [0, 6, 6, 'npc_brine_d', { frames: BRINE, wander: true }],
    [0, 3, 5, 'walk:holly', { wander: true }],
    [1, 3, 5, 'walk:oldman', { wander: true, dir: 'left' }],
    [1, 7, 5, 'walk:hunter', { wander: true }],
  ] },
  { names: [
    ['c', 'MADE BY'], ['w', 'RONNIE'],
  ] },
  { scene: [0, 4, 9], cast: [         // the Fishing Stones
    [0, 2, 2, 'npc_fisher', {}],
    [1, 4, 2, 'walk:boy', { wander: true }],
  ] },
  { names: [
    ['c', 'WITH'], ['w', 'CLAUDE'],
  ] },
  { scene: [0, 4, 5], cast: [         // Bog Trees and the Wood Heart
    [1, 2, 2, 'npc_hood_blue', {}],
    [1, 5, 4, 'walk:oldman', { wander: true }],
  ] },
  { names: [
    ['c', 'GRAPHICS RIPPED BY'], ['w', 'MISTER MIKE'], ['w', 'TRAILSDEGAMER'], ['w', 'TAILS585'],
  ] },
  { scene: [0, 12, 5], cast: [        // Coral Hollow
    [0, 4, 3, 'npc_reefkin_d', { frames: REEFKIN }],
    [1, 4, 3, 'npc_reefkin_d', { frames: REEFKIN, wander: true }],
  ] },
  { names: [
    ['c', 'FOUND AT THE'], ['w', 'SPRITERS RESOURCE'],
  ] },
  { scene: [0, 12, 8], cast: [        // Sandpiper Row
    [0, 5, 5, 'npc_fisher', { wander: true }],
    [0, 5, 3, 'walk:lad', { wander: true }],
    [1, 8, 3, 'npc_hood_blue', {}],
    [1, 3, 5, 'walk:holly', { wander: true, dir: 'left' }],
  ] },
  { names: [
    ['c', 'THE CARTRIDGES'], ['c', 'TAKEN APART BY'], ['w', 'STEWMATH'],
  ] },
  { scene: [0, 15, 9], cast: [        // Sunken Cove
    [0, 8, 2, 'npc_fisher', {}],
    [1, 4, 3, 'walk:hunter', { wander: true }],
  ] },
  { names: [
    ['w', 'AND THE'], ['w', 'ORACLES-DISASM'], ['w', 'CONTRIBUTORS'],
  ] },
  { scene: [0, 1, 0] },               // the Gate of the Keep
  { names: [
    ['c', 'AFTER'], ['w', 'THE LEGEND OF ZELDA'], ['w', 'ORACLE OF SEASONS'], ['w', 'ORACLE OF AGES'], [],
    ['c', 'BY'], ['w', 'NINTENDO'], ['w', 'CAPCOM'], [], [],
    ['w', 'THANKS FOR PLAYING'],
  ], sky: true },
];
