// HAND-DRAWN, not extracted (S177). Two capitals the dungeon name box needs
// that no box on either cartridge has: K (the Abyssal Keep) and V (the Lower
// Vault). Drawn to match the letters tools/rip-map.py cuts off the boxes —
// two-column strokes, ink with its shadow to the right, a light pixel where
// a stroke turns — K after the box's own R leg and k, V after its U and v.
// In the boxes' palette 3 (PALH_09): ink, shadow, light.

const PAL = ['#100800', '#524a00', '#847b00'];

export const MAP_DRAWN = {
  // K
  bl_75: { w: 7, h: 7, ay: 6, pal: PAL,
    rows: [
      '00...00',
      '01..01.',
      '01.01..',
      '0101...',
      '01.10..',
      '01..10.',
      '01...10',
    ] },
  // V
  bl_86: { w: 7, h: 7, ay: 6, pal: PAL,
    rows: [
      '00...00',
      '01...01',
      '01...01',
      '201.201',
      '.01.01.',
      '.20112.',
      '..011..',
    ] },
};
