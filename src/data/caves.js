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
}
