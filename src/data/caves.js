// Small standalone maps: caves, grottos, house interiors.
// Each is a one-room (or few-room) map warped into from the overworld.

import { registerMap } from '../world/maps.js';

export function installCaves() {
  registerMap({
    id: 'cave1',
    kind: 'cave',
    name: 'Bluff Grotto',
    w: 1, h: 1, floors: 1,
    legend: 'cave',
    music: 'cave',
    tint: 'cave',
    scroll: false,
    rooms: {
      '0,0,0': {
        map: [
          '##########',
          '##########',
          '#........#',
          '#..o..o..#',
          '#........#',
          '#..p..p..#',
          '#....C...#',
          '##########',
        ],
        entities: [
          ['chest', 4, 3, { rupees: 30 }],
        ],
        warps: [{ x: 5, y: 6, to: { map: 'overworld', floor: 0, rx: 3, ry: 7, px: 48, py: 48, dir: 'down' } }],
      },
    },
  });

  registerMap({
    id: 'cave2',
    kind: 'cave',
    name: 'Reef Hollow',
    w: 1, h: 1, floors: 1,
    legend: 'cave',
    music: 'cave',
    tint: 'cave',
    scroll: false,
    rooms: {
      '0,0,0': {
        map: [
          '##########',
          '#........#',
          '#.4444...#',
          '#.4444.o.#',
          '#.4444...#',
          '#........#',
          '#....C...#',
          '##########',
        ],
        entities: [
          ['pickup', 3, 3, { kind: 'rupee20' }],
        ],
        readable: [[7, 3, 'Scratched into the rock: "When the sea withdraws, walk where fish swam."']],
        warps: [{ x: 5, y: 6, to: { map: 'overworld', floor: 0, rx: 6, ry: 7, px: 64, py: 64, dir: 'down' } }],
      },
    },
  });

  // The two rooms the six-dungeon consolidation left behind.
  //
  // `docs/EXECUTION-PLAN.md` plans six dungeons and the data carried eight: the
  // Salt Pan Vault and the Reef Palace were pre-P8 dungeons whose items the
  // roster gives to other places. Their best rooms folded into the Abyssal Keep
  // — the Keep's Three Heights is the Vault's tide-vocabulary room and its
  // Tideshade Hall is the Palace's phased fight — and the two mouths on the
  // overworld stayed where they were, because a region with a sealed door on it
  // is a place and a region with a door to nowhere is a bug.
  //
  // Each one keeps the thing its dungeon used to hand over, so nothing in
  // docs/ITEMS.md lost its home in the fold.
  registerMap({
    id: 'cave3',
    kind: 'cave',
    name: 'Salt Pan Vault',
    w: 1, h: 1, floors: 1,
    legend: 'cave',
    music: 'cave',
    tint: 'cave',
    scroll: false,
    rooms: {
      '0,0,0': {
        map: [
          '##########',
          '#........#',
          '#.2222...#',
          '#.2222.o.#',
          '#.2222...#',
          '#........#',
          '#....C...#',
          '##########',
        ],
        entities: [
          // The Bottled Tide's CASE. The bottle forces one tide step in a room
          // carrying `noTide`, so what the case buys is the right to argue with
          // a boss arena — and a salt pan that has been drinking the sea for a
          // thousand years is where a swallow of it would be kept.
          ['chest', 4, 3, { big: true, item: 'bottle', level: 1 }],
        ],
        readable: [[7, 3, 'Salt-etched: "One swallow of the sea, kept where the sea cannot follow it."']],
        warps: [{ x: 5, y: 6, to: { map: 'overworld', floor: 0, rx: 6, ry: 1, px: 48, py: 48, dir: 'down' } }],
      },
    },
  });

  registerMap({
    id: 'cave4',
    kind: 'cave',
    name: 'Palace Porch',
    w: 1, h: 1, floors: 1,
    legend: 'cave',
    music: 'cave',
    tint: 'cave',
    scroll: false,
    rooms: {
      '0,0,0': {
        map: [
          '##########',
          '#..q..q..#',
          '#.5555...#',
          '#.5555.p.#',
          '#.5555...#',
          '#..q..q..#',
          '#....C...#',
          '##########',
        ],
        entities: [
          ['pickup', 4, 1, { kind: 'heartPiece' }],
        ],
        readable: [[7, 2, 'A palace notice, in a hand that gave up halfway: "The rest of it is under. Do not go and look."']],
        warps: [{ x: 5, y: 6, to: { map: 'overworld', floor: 0, rx: 10, ry: 1, px: 64, py: 32, dir: 'down' } }],
      },
    },
  });
}
