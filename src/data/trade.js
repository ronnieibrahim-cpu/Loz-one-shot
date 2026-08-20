// The Coastwise Chain: the eleven things the coast passes hand to hand, and
// what each of them is.
//
// WHY THERE IS A CHAIN AT ALL. Thalassia's sea takes something off one person
// twice a day and puts it down in front of another, and nobody on this coast
// has ever got their own property back except by walking it round. The chain is
// that circulation done deliberately, by hand, once — which is why it starts
// and ends with the same woman and the same kettle, and why every object in it
// is a working tool that is useless to whoever the water left it with.
//
// THIS FILE IS NOT THE CHAIN'S ORDER. The order lives in the placed `trader`
// entities in src/data/overworld.js, one `stage` each, and
// tools/check-trade.mjs reconstructs the sequence from the placed data and
// proves it is a total order with no gap, no fork and no cycle. A duplicate
// ordering table here would be a second thing to keep true; a registry of what
// the objects ARE is not.
//
// A trade item is NOT an inventory item. It never enters `progress.items`, it
// has no level, no verbs and no B-button behaviour, and docs/ITEMS.md's roster
// — which tools/check-items.mjs asserts the item registry matches exactly —
// does not mention any of them. The player holds exactly one at a time, in
// `progress.trade.item`, and the Quest screen is where you look to see which.

export const TRADE_ITEMS = {
  float: {
    name: 'Cracked Float', icon: 'i_t_float',
    got: 'A glass net-float with a crack in it.\nIt holds air. It will not hold a net.',
  },
  claw: {
    name: 'Crab Claw', icon: 'i_t_claw',
    got: 'A crab claw the size of your hand.\nThe crab is not using it any more.',
  },
  brick: {
    name: 'Salt Brick', icon: 'i_t_brick',
    got: 'A brick of pan salt, cut and dried.\nHeavier than it looks, like all of it.',
  },
  eel: {
    name: 'Smoked Eel', icon: 'i_t_eel',
    got: 'A smoked eel, whole and curled.\nIt will keep for a week and smell for two.',
  },
  lead: {
    name: 'Sounding Lead', icon: 'i_t_lead',
    got: 'A plumb of iron on a knotted line.\nIt measures water. That is all it does.',
  },
  whelk: {
    name: 'Ringing Whelk', icon: 'i_t_whelk',
    got: 'A whelk shell that rings when it is wet\nand says nothing at all when it is dry.',
  },
  pearl: {
    name: 'Slackwater Pearl', icon: 'i_t_pearl',
    got: 'A pearl the reef only lets go of at slack\nwater, when the sea forgets to pull.',
  },
  cup: {
    name: 'Bogwood Cup', icon: 'i_t_cup',
    got: 'A cup cut from a tree that drinks.\nWater kept in it never goes stale.',
  },
  jar: {
    name: 'Jar of Brine-Jelly', icon: 'i_t_jar',
    got: 'A stoppered jar of something the bog\nmakes. The witch says it is bait.',
  },
  kettle: {
    name: 'Cold Kettle', icon: 'i_t_kettle',
    got: 'A kettle, full of sea.\nSomebody has been missing this.',
  },
  bellrope: {
    name: 'Bell-Rope', icon: 'i_t_rope',
    got: 'The rope off the old Tide Bell.\nForty years in a drawer, and still waiting.',
  },
};

export function tradeName(id) {
  return (TRADE_ITEMS[id] && TRADE_ITEMS[id].name) || id;
}

export function tradeIcon(id) {
  return (TRADE_ITEMS[id] && TRADE_ITEMS[id].icon) || 'i_unknown';
}
