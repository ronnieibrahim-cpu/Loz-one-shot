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
    got: 'A glass net-float with a crack in it. It won\'t hold up a net anymore!',
  },
  claw: {
    name: 'Crab Claw', icon: 'i_t_claw',
    got: 'A crab claw as big as your hand! The crab doesn\'t need it anymore.',
  },
  brick: {
    name: 'Salt Brick', icon: 'i_t_brick',
    got: 'A brick of salt from the pans. It\'s heavier than it looks!',
  },
  eel: {
    name: 'Smoked Eel', icon: 'i_t_eel',
    got: 'A whole smoked eel! It\'ll keep for a week, and smell for two.',
  },
  lead: {
    name: 'Sounding Lead', icon: 'i_t_lead',
    got: 'An iron weight on a knotted line. It tells you how deep the water is!',
  },
  whelk: {
    name: 'Ringing Whelk', icon: 'i_t_whelk',
    got: 'A whelk shell that rings like a bell, but only when it\'s wet!',
  },
  pearl: {
    name: 'Slackwater Pearl', icon: 'i_t_pearl',
    got: 'A pearl from the reef! It only lets them go when the sea stands still.',
  },
  cup: {
    name: 'Bogwood Cup', icon: 'i_t_cup',
    got: 'A cup carved from a tree that drinks. Nothing kept in it ever goes bad!',
  },
  jar: {
    name: 'Jar of Brine-Jelly', icon: 'i_t_jar',
    got: 'A jar of something the bog makes. The witch says it\'s bait. Keep the lid on!',
  },
  kettle: {
    name: 'Cold Kettle', icon: 'i_t_kettle',
    got: 'A kettle full of seawater! Somebody must be missing it.',
  },
  bellrope: {
    name: 'Bell-Rope', icon: 'i_t_rope',
    got: 'The rope from the old Tide Bell! It sat in a drawer for forty years.',
  },
};

export function tradeName(id) {
  return (TRADE_ITEMS[id] && TRADE_ITEMS[id].name) || id;
}

export function tradeIcon(id) {
  return (TRADE_ITEMS[id] && TRADE_ITEMS[id].icon) || 'i_unknown';
}
