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
    got: 'The shopkeeper\'s ledger, soaked through! Every page says somebody owes him.',
  },
  kite: {
    name: 'Kite', icon: 'i_e_kite', flag: 'foundKite',
    got: 'A patched cloth kite! A night up a tree hasn\'t hurt it.',
  },
  bogwater: {
    name: 'Jar of Bog Water', icon: 'i_e_jar', flag: 'foundBogWater',
    got: 'A jar left filling at the bog spring. The water\'s as brown as tea!',
  },
  // THE DARK LIGHTHOUSE (S200): the three parts of the lamp on the Drowned
  // Shore, which the sea took the night it went strange. The keeper there
  // asks for all three (`need` is a list); each is found by a different item
  // at a different sea, and the lamp is then lit with the Kilnshell.
  lens: {
    name: 'Great Lens', icon: 'i_e_lens', flag: 'foundLens',
    got: 'The lighthouse lens, in one piece! The sea has only polished it.',
  },
  mirror: {
    name: 'Brass Reflector', icon: 'i_e_mirror', flag: 'foundMirror',
    got: 'The lamp\'s brass reflector! It\'s still bright under all that kelp.',
  },
  oil: {
    name: 'Lamp Oil', icon: 'i_e_oil', flag: 'foundOil',
    got: 'A corked flask of lamp oil! The HIGH tide left it here in the salt.',
  },
};

// The dunes' five sand dollars (S249): one flag each, set by the sand dollar
// lying at that place (PICKUPS.sandDollar); the beachcomber's errand needs all
// five. Here, with the errands, so the room data can name them without
// importing the engine.
export const SAND_DOLLAR_FLAGS = ['sandDollar1', 'sandDollar2', 'sandDollar3', 'sandDollar4', 'sandDollar5'];

// LETTERS IN BOTTLES (S255, the human's pick). Four sealed bottles the sea
// leaves out at LOW tide, one on each of four beaches, each addressed to
// somebody in Tidewatch or Sandpiper Row (PICKUPS.letterBottle). Handing one
// over is its reader's errand; whoever gets the last of the four pays a blank
// charm instead of rupees (NPC.errandTalk `last`).
export const LETTERS = {
  letter1: { to: 'the little boy in Village East', done: 'letter1Done' },
  letter2: { to: 'the villager in Tidewatch Square', done: 'letter2Done' },
  letter3: { to: 'the Salter by the well', done: 'letter3Done' },
  letter4: { to: 'the old man in Sandpiper Cottage', done: 'letter4Done' },
};
export const LETTER_DONE_FLAGS = Object.values(LETTERS).map(l => l.done);
