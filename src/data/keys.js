// THE SIX DUNGEON KEYS (S154). One key item per dungeon, Oracle of Seasons'
// way: every dungeon's door is a keyhole, and each key is handed over by a
// story beat after the dungeon before, so the six are played in order.
//
// What a key IS in the save: two flags. `flag` says you hold the key (the
// quest screen draws it); `opened` says its keyhole has been turned, and is
// the `openFlag` of every keyhole tile that key answers (`keyFlag` on the
// tiledef, see src/world/tileset.js). The key is kept after it is used, as
// Seasons keeps the Gnarled Key.
//
// Who gives each is data on the giver itself (a `beat` on the NPC, see NPC in
// src/game/objects.js), and what each keyhole looks like is its tile. This
// table only names the keys, so the menu, the keyhole and the tools agree on
// one list.

export const DUNGEON_KEYS = [
  { map: 'd1', flag: 'keyD1', opened: 'openedD1', name: 'Barnacle Key', icon: 'i_key_d1',
    desc: 'It opens the Tidewash Grotto.' },
  { map: 'd2', flag: 'keyD2', opened: 'openedD2', name: 'Coral Key', icon: 'i_key_d2',
    desc: 'It opens the Coral Spire.' },
  { map: 'd3', flag: 'keyD3', opened: 'openedD3', name: 'Peat Key', icon: 'i_key_d3',
    desc: 'It opens the Bogwater Sanctum.' },
  { map: 'd4', flag: 'keyD4', opened: 'openedD4', name: 'Cistern Key', icon: 'i_key_d4',
    desc: 'It opens the Cliffside Cistern.' },
  { map: 'd5', flag: 'keyD5', opened: 'openedD5', name: 'Moss Key', icon: 'i_key_d5',
    desc: 'It opens the Drowned Wood Shrine.' },
  { map: 'd6', flag: 'keyD6', opened: 'openedD6', name: "Bell's Clapper", icon: 'i_key_d6',
    desc: 'It unseals the road to the Abyssal Keep.' },
];

/** The key for a dungeon's map id, or null. */
export function keyFor(map) {
  return DUNGEON_KEYS.find(k => k.map === map) || null;
}

/** The key a keyhole flag belongs to, or null. */
export function keyByFlag(flag) {
  return DUNGEON_KEYS.find(k => k.flag === flag) || null;
}

/**
 * A save made before the keys existed (S154) has been through doors that are
 * now locked. Every dungeon whose Essence it holds gets its key, already
 * turned — so nobody is locked out of a dungeon they have finished, and the
 * next key still comes from its own giver.
 */
export function migrateKeys(p) {
  DUNGEON_KEYS.forEach((k, i) => {
    if (!p.essences || !p.essences.includes(i + 1)) return;
    p.flags[k.flag] = true;
    p.flags[k.opened] = true;
  });
  if (p.flags.makuOpenedKeep) { p.flags.keyD6 = true; p.flags.openedD6 = true; }
}
