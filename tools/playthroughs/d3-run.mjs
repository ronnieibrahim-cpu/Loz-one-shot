// THE BOGWATER SANCTUM, DOOR TO BOSS, as actor directives (S182).
//
// tools/check-side.mjs plays it from a stated world (a sword, the conch, the
// Anchor and the Kilnshell, 200 hearts) as the proof that the whole dungeon
// can be finished in one run; the robot's own route (tools/playthrough-
// route.mjs) walks the same rooms in the same order, with its fights.
export const D3_RUN = [
  // P1: the Nave's hole at LOW
  ['travel', 3, 6, 2000], ['goto', 7, 3, 600], ['hold', ['down'], 30], ['wait', 150],
  // the Landing -> the Pens' corridor and back -> the stair up, off the dais
  ['travel', 3, 5, 2000], ['travel', 3, 6, 2000],
  ['goto', 1, 2, 900], ['hold', ['up'], 30], ['wait', 90], ['hold', ['down'], 40],
  // P2: the Hub's south-east hole, the key pen, off its ledge
  ['travel', 3, 5, 2000], ['goto', 11, 6, 900], ['hold', ['down'], 30], ['wait', 150],
  ['goto', 11, 8, 600], ['hold', ['right'], 6], ['tap', 'a', 40], ['dialogue', 400], ['loot', 900],
  ['goto', 11, 7, 600], ['hold', ['up'], 40],
  ['travel', 3, 6, 2000], ['goto', 1, 2, 900], ['hold', ['up'], 30], ['wait', 90], ['hold', ['down'], 40],
  // the first key, the Hub's east door
  ['travel', 3, 5, 2000], ['goto', 13, 5, 900], ['hold', ['right'], 20], ['tap', 'a', 30],
  // P3: the Anchor at LOW beside the shaft, MID, in
  ['travel', 4, 5, 2000], ['equip', 'anchor', 'A', 400], ['anchor', 7, 6, 1600],
  ['tide', 1, 140, 900], ['goto', 7, 7, 400], ['hold', ['up'], 60], ['wait', 150],
  // the Drain Weir: the second key; the shutter opens west
  ['goto', 11, 8, 900], ['hold', ['right'], 6], ['tap', 'a', 40], ['dialogue', 400], ['loot', 900],
  ['wait', 60], ['unanchor', 120], ['equip', 'sword', 'A', 400], ['tide', 0, 140, 900],
  ['travel', 3, 5, 2000], ['travel', 3, 6, 2000],
  ['goto', 1, 2, 900], ['hold', ['up'], 30], ['wait', 90], ['hold', ['down'], 40],
  // the second key, the Weir's north door
  ['travel', 3, 5, 2000], ['travel', 3, 4, 2000], ['goto', 7, 1, 900], ['hold', ['up'], 20], ['tap', 'a', 30],
  // P4: the Silt Cell's crack; the Chartstone on the Root Cellar's raised
  // corner, off its ledge; the Silt Stair up onto the Map Cell's dais
  ['travel', 2, 4, 2000], ['goto', 2, 2, 900], ['wait', 220],
  ['hold', ['right'], 6], ['tap', 'a', 40], ['dialogue', 400], ['loot', 900],
  ['goto', 2, 3, 300], ['hold', ['down'], 40],
  ['travel', 2, 5, 2000], ['goto', 12, 9, 900], ['hold', ['up'], 30], ['wait', 90],
  ['goto', 13, 8, 300], ['hold', ['up'], 40], ['wait', 30],

  // P6: the Weir's crack at LOW -> the Reliquary, with nothing to light
  ['travel', 3, 5, 2000], ['travel', 3, 4, 2000], ['goto', 7, 7, 600], ['wait', 220],
  // up its stair into the Weir's alcove, off the alcove's ledge
  ['goto', 13, 2, 900], ['hold', ['up'], 30], ['wait', 90], ['hold', ['down'], 40],
  // a shell struck facing the open hole falls down it; Link after it
  ['equip', 'kilnshell', 'B', 400], ['goto', 7, 6, 600], ['hold', ['down'], 2], ['use', 'kilnshell', 1, 40],
  ['hold', ['down'], 30], ['wait', 150],
  // thrown beside the west torch, then beside the east one
  ['lift', 600], ['goto', 6, 6, 600], ['hold', ['up'], 2], ['tap', 'a', 60],
  ['lift', 600], ['goto', 8, 6, 600], ['hold', ['up'], 2], ['tap', 'a', 60],
  ['dialogue', 400], ['wait', 30],
  ['goto', 7, 4, 600], ['hold', ['up'], 6], ['tap', 'a', 40], ['dialogue', 400], ['loot', 900],
  // out by the stair, off the ledge
  ['goto', 13, 2, 900], ['hold', ['up'], 30], ['wait', 90], ['hold', ['down'], 40],

  // THE CLEATS: through the Weir's open key door, up the causeway
  ['equip', 'conch', 'B', 400],
  ['goto', 7, 1, 900], ['hold', ['up'], 40], ['wait', 60],
  ['goto', 7, 5, 900], ['hold', ['up'], 6], ['tap', 'a', 40], ['dialogue', 600], ['loot', 900],
  // P5: at MID, sink into the well from the island's north edge
  ['tide', 1, 140, 900], ['equip', 'cleats', 'B', 400],
  ['goto', 7, 3, 600], ['soles', 'sink', 240], ['hold', ['up'], 60], ['wait', 120],
  // the Sump's bottom: the plate; up, across on the surface, out by the shutter
  ['goto', 24, 5, 1500], ['wait', 20], ['dialogue', 300],
  ['soles', 'swim', 240], ['goto', 2, 5, 1500], ['exit', 'left', 300], ['wait', 60],
  // the Undertow Cellar's fight; the Root Cellar; the Silt Stair up; the Weir,
  // and the sea back to LOW for the Vestry's blocks
  ['fight', 3000, 1200],
  ['travel', 2, 4, 2000], ['travel', 2, 5, 2000], ['goto', 12, 9, 900], ['hold', ['up'], 30], ['wait', 90],
  ['goto', 13, 8, 300], ['hold', ['up'], 40], ['wait', 30],
  ['travel', 3, 5, 2000], ['travel', 3, 4, 2000],
  ['equip', 'conch', 'B', 400], ['tide', 0, 140, 900],
  ['goto', 7, 1, 900], ['hold', ['up'], 40], ['wait', 60],
  // west on the Cistern's and the Undertow's bottom, through the open door
  ['equip', 'cleats', 'B', 400],
  ['goto', 5, 5, 600], ['soles', 'sink', 240], ['hold', ['left'], 200], ['wait', 60],
  ['soles', 'sink', 240], ['hold', ['left'], 420], ['wait', 90],
  // the Sunken Vestry's blocks: the third key
  ['goto', 12, 2, 900], ['hold', ['left'], 40], ['goto', 2, 2, 900], ['hold', ['right'], 40],
  ['dialogue', 300], ['goto', 7, 3, 600], ['hold', ['up'], 30], ['loot', 900],
  // the third key in the Drain Gallery's door; the fourth key in its chest
  ['goto', 7, 1, 900], ['hold', ['up'], 20], ['tap', 'a', 30], ['hold', ['up'], 60], ['wait', 60],
  ['goto', 7, 5, 900], ['hold', ['up'], 6], ['tap', 'a', 40], ['dialogue', 400], ['loot', 900],
  // Bogmaw Hall, and back
  ['travel', 2, 2, 2000], ['fight', 6000, 6000], ['wait', 120], ['dialogue', 400], ['loot', 900],
  ['travel', 1, 2, 2000], ['travel', 1, 3, 2000],
  // east on the Undertow's current, across the Cistern, the Drain's bottom
  ['travel', 2, 3, 2000], ['hold', ['right'], 300], ['wait', 60],
  ['hold', ['right'], 120], ['goto', 9, 5, 900], ['soles', 'sink', 240], ['hold', ['right'], 200], ['wait', 60],
  ['soles', 'sink', 240], ['hold', ['down', 'right'], 90], ['hold', ['right'], 60], ['wait', 30],
  ['soles', 'sink', 240], ['hold', ['up', 'right'], 80], ['hold', ['right'], 300],
  // the fourth key in the Eel Hall's west door
  ['goto', 13, 5, 300], ['hold', ['right'], 20], ['tap', 'a', 30], ['exit', 'right', 300], ['wait', 60],
  // the Eel Hall's crab; the Eel Vault, cleared, opens the Sounding wing
  ['goto', 6, 7, 900], ['hold', ['down'], 3],
  ['tap', 'a', 16], ['tap', 'a', 16], ['tap', 'a', 16], ['tap', 'a', 16], ['tap', 'a', 16], ['tap', 'a', 16],
  ['goto', 7, 9, 900], ['hold', ['down'], 30], ['wait', 60], ['fight', 3000, 1200],
  ['goto', 7, 4, 900], ['hold', ['down'], 3],
  ['tap', 'a', 16], ['tap', 'a', 16], ['tap', 'a', 16], ['tap', 'a', 16], ['tap', 'a', 16], ['tap', 'a', 16],
  ['tap', 'a', 16], ['tap', 'a', 16], ['tap', 'a', 16], ['tap', 'a', 16], ['tap', 'a', 16], ['tap', 'a', 16],
  ['fight', 3000, 1200], ['wait', 120], ['dialogue', 400], ['wait', 120], ['loot', 1500],
  // the Sounding Pool's plate; the Two Weights: the fifth key
  ['goto', 13, 5, 900], ['exit', 'right', 300], ['wait', 60], ['fight', 3000, 1200],
  ['goto', 8, 5, 900], ['soles', 'sink', 240], ['goto', 14, 5, 900], ['wait', 20], ['dialogue', 300],
  ['goto', 8, 5, 900], ['goto', 22, 9, 1500], ['exit', 'down', 300], ['wait', 60],
  ['equip', 'conch', 'B', 400], ['tide', 0, 140, 600], ['goto', 8, 5, 1500], ['hold', ['left'], 40],
  ['equip', 'cleats', 'B', 400], ['goto', 15, 6, 1500], ['soles', 'sink', 240], ['goto', 21, 6, 900],
  ['wait', 20], ['dialogue', 300], ['goto', 15, 6, 900], ['goto', 11, 3, 1500], ['loot', 600],
  ['goto', 22, 1, 1500], ['exit', 'up', 300], ['wait', 60], ['goto', 1, 5, 1500], ['exit', 'left', 300], ['wait', 60],
  // the fifth key in the Eel Hall's north door; the Kelp Locks, both layers
  ['goto', 7, 1, 900], ['hold', ['up'], 30], ['wait', 60],
  ['goto', 7, 1, 900], ['hold', ['up'], 20], ['tap', 'a', 30], ['hold', ['up'], 60], ['wait', 90],
  ['goto', 26, 9, 900], ['hold', ['right'], 40], ['hold', ['up', 'right'], 200], ['hold', ['left'], 260],
  ['soles', 'sink', 240], ['hold', ['down'], 110], ['goto', 1, 5, 400], ['exit', 'left', 300], ['wait', 90],
  // the Lock Gallery's shortcut plate; the Boss Key in the boss door
  ['goto', 2, 5, 900], ['dialogue', 300], ['equip', 'conch', 'B', 400], ['tide', 0, 140, 600],
  ['goto', 7, 1, 900], ['hold', ['up'], 20], ['tap', 'a', 30], ['hold', ['up'], 40], ['wait', 60],
];
