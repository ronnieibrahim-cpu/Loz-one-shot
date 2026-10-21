// The townsfolk's errands (S155 side content): three things that went missing
// off the village, and what each of them is.
//
// An errand is three pieces, and only the first lives here:
//   * the OBJECT, found lying somewhere and picked up like any pickup — its
//     PICKUPS kind is `e_<id>` (src/game/objects.js builds them from this
//     table), and picking it up sets `flag`;
//   * the PERSON who asked, an `npc` carrying `errand: { need, prize, flag,
//     ask, thanks }` — `need` is this table's `flag`, and `prize` is a PICKUPS
//     kind handed over when the object comes home (NPC.interact);
//   * the proof, in tools/check-side.mjs.
//
// Like a trade item, an errand object is NOT an inventory item: it never
// enters `progress.items` and is not in docs/ITEMS.md's roster. It is a flag.
// Unlike a trade item there is no counter and no order — the three errands are
// independent, and can be done in any order or not at all.

export const ERRANDS = {
  ledger: {
    name: 'Shop Ledger', icon: 'i_e_ledger', flag: 'foundLedger',
    got: 'The shopkeeper\'s ledger, fat with seawater.\nEvery page says somebody owes him.',
  },
  kite: {
    name: 'Kite', icon: 'i_e_kite', flag: 'foundKite',
    got: 'A patched cloth kite, none the worse\nfor a night in a tree.',
  },
  bogwater: {
    name: 'Jar of Bog Water', icon: 'i_e_jar', flag: 'foundBogWater',
    got: 'A jar left filling at the bog spring.\nThe water in it is the colour of tea.',
  },
  // THE DARK LIGHTHOUSE (S200): the three parts of the lamp on the Drowned
  // Shore, which the sea took the night it went strange. The keeper there
  // asks for all three (`need` is a list); each is found by a different item
  // at a different sea, and the lamp is then lit with the Kilnshell.
  lens: {
    name: 'Great Lens', icon: 'i_e_lens', flag: 'foundLens',
    got: 'The lighthouse lens, whole! The sea\nhas only polished it.',
  },
  mirror: {
    name: 'Brass Reflector', icon: 'i_e_mirror', flag: 'foundMirror',
    got: 'The lamp\'s reflector, cut out of the\nkelp. Still bright under the green.',
  },
  oil: {
    name: 'Lamp Oil', icon: 'i_e_oil', flag: 'foundOil',
    got: 'A stoppered flask of lamp oil. The\nhigh sea set it down in the salt.',
  },
};
