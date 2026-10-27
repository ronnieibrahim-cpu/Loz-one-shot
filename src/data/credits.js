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

export const CREDITS_ROLL = [
  { scene: [0, 4, 7] },          // Tidewatch Village
  { names: [
    ['c', 'ORACLE OF TIDES'], [],
    ['c', 'MADE BY'], ['w', 'RONNIE'], [],
    ['c', 'WITH'], ['w', 'CLAUDE'],
  ] },
  { scene: [0, 4, 9] },          // the Fishing Stones
  { names: [
    ['c', 'GRAPHICS RIPPED BY'], ['w', 'MISTER MIKE'], ['w', 'TRAILSDEGAMER'], ['w', 'TAILS585'], [],
    ['c', 'FOUND AT THE'], ['w', 'SPRITERS RESOURCE'],
  ] },
  { scene: [0, 12, 8] },         // Sandpiper Row
  { names: [
    ['c', 'THE CARTRIDGES'], ['c', 'TAKEN APART BY'], ['w', 'STEWMATH'], ['w', 'AND THE'],
    ['w', 'ORACLES-DISASM'], ['w', 'CONTRIBUTORS'],
  ] },
  { scene: [0, 1, 0] },          // the Gate of the Keep
  { names: [
    ['c', 'AFTER'], ['w', 'THE LEGEND OF ZELDA'], ['w', 'ORACLE OF SEASONS'], ['w', 'ORACLE OF AGES'], [],
    ['c', 'BY'], ['w', 'NINTENDO'], ['w', 'CAPCOM'], [], [],
    ['w', 'THANKS FOR PLAYING'],
  ], sky: true },
];
