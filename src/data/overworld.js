// The overworld of Thalassia: a 12x10 grid of screens.
// Rooms are keyed 'floor,x,y'. See world/room.js for the room contract and
// data/legends.js for the character vocabulary (digits are always tide tiles).

import { registerMap } from '../world/maps.js';

export const OVERWORLD_W = 12;
export const OVERWORLD_H = 10;

const rooms = {
  // --- Tidewatch Village and its approaches -------------------------------
  '0,4,7': {
    name: 'Tidewatch Village',
    legend: 'coast', music: 'village',
    map: [
      'TTTTggTTTT',
      'TggggggggT',
      'TggfffgggT',
      'gggggggggg',
      'gggggggggg',
      'TggbggoggT',
      'TggggggggT',
      'TTTTggTTTT',
    ],
    entities: [
      ['sign', 2, 4, { text: 'TIDEWATCH VILLAGE\nEast: the Shallows. Mind the tide.' }],
      ['npc', 6, 2, {
        sprite: 'npc_villager', pal: 'npc', wander: true,
        dialogue: 'villager1',
      }],
    ],
  },

  '0,4,6': {
    name: 'Village Path',
    legend: 'coast',
    map: [
      'TTTTggTTTT',
      'TggggggggT',
      'TgGggggGgT',
      'TggggggggT',
      'TggvvvgggT',
      'TggggggggT',
      'TggggggggT',
      'TTTTggTTTT',
    ],
    entities: [
      ['octorok', 3, 3],
      ['octorok', 6, 5],
    ],
  },

  '0,3,7': {
    name: 'West Bluff',
    legend: 'coast',
    map: [
      '##########',
      '##########',
      '###Cgg####',
      'gggggggggg',
      'gggggggggg',
      'TggggggggT',
      'TggbbbggoT',
      'TTTTTTTTTT',
    ],
    warps: [{ x: 3, y: 2, to: { map: 'cave1', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } }],
    entities: [
      ['sign', 5, 3, { text: 'A grotto in the bluff. Something glitters within.' }],
    ],
  },

  // --- The Shallows: the first tide lesson --------------------------------
  '0,5,7': {
    name: 'The Shallows',
    legend: 'coast', music: 'overworld',
    map: [
      'gggg......',
      'ggg.......',
      'gg....1111',
      'g....11111',
      'g....11111',
      'gg....1111',
      'ggg.......',
      'gggg......',
    ],
    entities: [
      ['sign', 3, 1, { text: 'THE SHALLOWS\nAt LOW tide the sandbar walks you east.' }],
      ['crab', 7, 2],
      ['crab', 6, 5],
    ],
  },

  '0,6,7': {
    name: 'Sunken Reef',
    legend: 'coast',
    map: [
      '==========',
      '===4444===',
      '==444444==',
      '444.C..44=',
      '444....44=',
      '==444444==',
      '===4444===',
      '==========',
    ],
    warps: [{ x: 4, y: 3, to: { map: 'cave2', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } }],
    entities: [
      ['pickup', 6, 4, { kind: 'heartPiece' }],
      ['zol', 3, 4],
    ],
  },
};

export function installOverworld() {
  registerMap({
    id: 'overworld',
    kind: 'overworld',
    name: 'Thalassia',
    w: OVERWORLD_W, h: OVERWORLD_H, floors: 1,
    legend: 'coast',
    music: 'overworld',
    scroll: true,
    rooms,
  });
}

export { rooms as OVERWORLD_ROOMS };
