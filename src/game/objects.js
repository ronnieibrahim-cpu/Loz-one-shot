// World objects: pickups, chests, NPCs, signs, pushable blocks, switches,
// torches, rafts, essences. All are spawnable from room data via entity tuples.

import {
  Entity, defineEntity, moveEntity, canOccupy, groundFlags, tideAt, DIR_VEC, overHole, dropIntoHole,
} from './entity.js';
import { F } from '../world/tileset.js';
import { TILE } from '../core/screen.js';
import { FP_ONE, sp } from '../core/fixed.js';
import { sprites } from '../gfx/art.js';
import { drawText } from '../gfx/font.js';
import {
  addRupees, heal, addBombs, addReefseeds, addBottles, addKey, giveItem, addHeartContainer,
  addHeartPiece, HEART_UNITS, setFlag, flag, hasItem, reefseedBase,
} from './progress.js';
import { itemName, itemIcon, ITEMS } from './items.js';
import { CHARMS, giveCharm, openCharmCases } from './scrimshaw.js';
import { ERRANDS } from '../data/errands.js';
import { FLOAT_DIRS } from './float-path.js';
import {
  PICKUP_LIFE_FRAMES, PICKUP_POP_SPEED, PICKUP_GRAVITY, PICKUP_BOUNCE_MIN,
  PICKUP_BLINK_FRAMES, BLOCK_SLIDE_SPEED, FAIRY_LEG_SPEEDS, FAIRY_LEG_MIN, FAIRY_LEG_SPAN, FAIRY_FLAP_FRAMES,
  NPC_WANDER_PERIOD, NPC_WANDER_SPEED,
  ESSENCE_SPARKLE_EVERY, ESSENCE_SPARKLE_SPREAD,
  BELLOWS_PUSH, BELLOWS_RAFT_SCALE, BELLOWS_WHEEL_COAST, BELL_CHIME_FRAMES, WHEEL_SPIN_BEAT,
  CARVE_PRICE, CHARM_CASE_MAX, CHARM_LOW_ESSENCES, CHARM_HIGH_ESSENCES,
  CHARM_CASE_ESSENCES, RACE_SHORE_FRAMES, TORCH_FLAME_FRAMES, TORCH_BURN_FRAMES, KEY_FALL_FRAMES,
  LIGHTHOUSE_TURN_FRAMES,
  FLOAT_SPEED, FLOAT_FOOT_DY, BOMB_CAPACITY_BAG,
  BUOY_NOTE_FRAMES, BUOY_LIT_FRAMES, BUOY_LEAD_IN_FRAMES, BUOY_BOB_FRAMES,
} from '../data/feel.js';
import { OBJECT_THEMES, TORCH_FLAME_COUNT } from '../data/sprites-objects.js';

/** `base` in this map's own Seasons colours: a push block or floor button is
 *  a tile of the Seasons dungeon the map is built from (tools/rip-objects.py). */
function themed(base, game) {
  // A room may wear its own legend (S189: the Keep's Hold is the maze's ice
  // half under its fire half), and its block and button are that legend's.
  const legend = game && ((game.room && typeof game.room.def.legend === 'string' && game.room.def.legend)
    || (game.map && game.map.legend));
  const t = legend && OBJECT_THEMES[legend];
  return t ? base + '_' + t : base;
}

// --------------------------------------------------------------------------
// Pickups
// --------------------------------------------------------------------------

/**
 * `worth` is how many rupees the pickup is carrying. It is a FIELD rather than
 * a number baked into `get`, because the Beachcomber doubles what an enemy
 * drops and the doubling has to happen when the drop is rolled — a rupee
 * already lying on the floor was worth what it was worth when it fell.
 */
// EVERY PICKUP WITH AN ORACLE EQUIVALENT IS THE CARTRIDGE'S OWN SPRITE (S155):
// the rupees, hearts, Piece of Heart, Heart Container, keys, bombs and map are
// cut from Oracle of Seasons' graphics by tools/rip-treasures.py and carry
// their own colours, so `pal` is null for them — a palette here would repaint
// the cartridge's art. The same sprite is drawn on the floor, rising from a
// chest and held over Link's head, so none of the three can look different.
export const PICKUPS = {
  rupee1: { sprite: 'p_rupee', pal: null, worth: 1, get(g, e) { addRupees(g.progress, worthOf(e, 1)); g.audio.sfx('rupee'); } },
  rupee5: { sprite: 'p_rupee5', pal: null, worth: 5, get(g, e) { addRupees(g.progress, worthOf(e, 5)); g.audio.sfx('rupee'); } },
  rupee20: { sprite: 'p_rupee20', pal: null, worth: 20, get(g, e) { addRupees(g.progress, worthOf(e, 20)); g.audio.sfx('rupeeBig'); } },
  rupee100: { sprite: 'p_rupee100', pal: null, worth: 100, get(g, e) { addRupees(g.progress, worthOf(e, 100)); g.audio.sfx('rupeeBig'); } },
  heart: { sprite: 'p_heart', pal: null, get(g) { heal(g.progress, HEART_UNITS); g.audio.sfx('heart'); } },
  // EXTRACTED, and it flaps. Both frames come off the Oracle fairy sheet
  // (tools/rip-fairies.py); `pal: null` because each binds its own palette and
  // passing one would override the colours taken off the cartridge.
  fairy: {
    sprite: 'p_fairy', frames: ['p_fairy', 'p_fairy_1'], pal: null, float: true,
    get(g) { heal(g.progress, HEART_UNITS * 6); g.audio.sfx('fairy'); },
  },
  // THE PICKUP IS THE BOMB, not a picture of one. `p_bombs` was a hand-drawn
  // pair of flat-topped canisters — the bomb this game actually throws is
  // `i_bomb`, EXTRACTED off the Oracle gear sheet, round with a curling fuse.
  // So a bomb drop looked nothing like the bombs it gave you, with the right
  // art already in the build. `pal: null` because i_bomb binds its own palette
  // (see the header of sprites-gear.js); passing one would override it. Same
  // shape as `seeds5` below, which has always pointed at `i_reefseed`.
  //
  // S155: it is now the cartridge's own DROP, `p_bomb` (tools/rip-treasures.py,
  // item drop 4), which is what Seasons draws on the floor.
  bomb4: { sprite: 'p_bomb', pal: null, get(g) { addBombs(g.progress, 4); g.audio.sfx('rupee'); } },
  // THE QUARRYMAN'S BAG (S195): a bigger bomb bag, handed over in a cave in
  // the Cliffs of Kell. Not an inventory item — it raises the count the bombs
  // already in `progress.items` can reach, and fills it.
  bombBag: {
    sprite: 'i_bomb', pal: null,
    get(g) {
      const p = g.progress;
      p.maxBombs = Math.max(p.maxBombs, BOMB_CAPACITY_BAG);
      addBombs(p, p.maxBombs);
      g.audio.jingle('itemGet');
      g.say(`A bigger bomb bag! It holds ${p.maxBombs} bombs.`);
    },
  },
  // THE BUOY SAILOR'S BAG (S201): the bell-buoy echo's first prize. Like the
  // quarryman's bag it raises a ceiling rather than adding an item. It can be
  // won before the Reefseed is found, so the bag is a flag the grant reads
  // (progress.reefseedBase) and fills the satchel only if there is one.
  seedBag: {
    sprite: 'i_reefseed', pal: null,
    get(g) {
      const p = g.progress;
      setFlag(p, 'seedBag');
      g.audio.jingle('itemGet');
      if (p.maxReefseeds > 0) {
        p.maxReefseeds = Math.max(p.maxReefseeds, reefseedBase(p));
        addReefseeds(p, g.reefseedCap(), g.reefseedCap());
        g.say(`A bigger seed bag! It holds ${p.maxReefseeds} Reefseeds.`);
      } else {
        g.say(`A bigger seed bag! It will hold ${reefseedBase(p)} Reefseeds,\nonce you have some.`);
      }
    },
  },
  // NO TEXT BOX, deliberately. An open dialogue freezes every entity while the
  // mode is still 'play' (see CLAUDE.md, traps), so a first-time hint on a
  // FLOOR DROP stops the game dead in the middle of whatever fight dropped it.
  // The blank count is on the QUEST screen and the scrimshander explains
  // herself; a pickup jingle is the whole of what this needs to say.
  blank: {
    sprite: 'p_blank', pal: null,
    get(g) {
      g.progress.blanks = (g.progress.blanks || 0) + 1;
      g.audio.sfx('key');
    },
  },
  seeds5: {
    sprite: 'i_reefseed', pal: null,
    get(g) {
      if (g.progress.maxReefseeds <= 0) { g.audio.sfx('deny'); return; }
      addReefseeds(g.progress, 3, g.reefseedCap());
      g.audio.sfx('rupee');
    },
  },
  key: {
    sprite: 'p_key', pal: null, persistent: true,
    get(g) { addKey(g.progress, g.mapId); g.audio.sfx('key'); g.say('You found a Small Key!'); },
  },
  bossKey: {
    sprite: 'p_bosskey', pal: null, persistent: true,
    get(g) { g.progress.bossKeys[g.mapId] = true; g.audio.jingle('fanfareShort'); g.say('You found the Boss Key!'); },
  },
  dungeonMap: {
    // `pal: null` so the sprite's OWN palette wins, like the chartstone below.
    // This drew with `ui` — the menu's grey ramp — so the parchment came out
    // the colour of a dialogue box and the route drawn across it, the one thing
    // that says "map" rather than "card", came out grey on grey.
    sprite: 'i_map', pal: null, persistent: true,
    // In a chest, as Seasons keeps its map (TREASURE_MAP, spawn mode 1: the
    // chest's own treasure, SND_GETITEM). `grant` and `line` are what
    // Game.openChest hands over; `get` is the same thing picked up loose.
    grant(g) { g.progress.dungeonMaps[g.mapId] = true; },
    line: 'You found the Dungeon Map!',
    get(g) { this.grant(g); g.audio.sfx('key'); g.say(this.line); },
  },
  chartstone: {
    sprite: 'i_chart', pal: null, persistent: true,
    // In a chest, where Seasons keeps the compass it stands in for
    // (TREASURE_COMPASS, spawn mode 1, SND_GETITEM).
    grant(g) { g.progress.charts[g.mapId] = true; },
    line: 'You found the Chartstone!\nThe map will show what the tide moves.',
    get(g) { this.grant(g); g.audio.sfx('key'); g.say(this.line); },
  },
  heartPiece: {
    sprite: 'p_heartpiece', pal: null, persistent: true, hold: 2,
    get(g) {
      const done = addHeartPiece(g.progress);
      g.audio.jingle('heartPiece');
      g.say(done
        ? 'A Piece of Heart! The four pieces make a whole heart!'
        : `A Piece of Heart! You have ${g.progress.heartPieces} of 4.`);
    },
  },
  bottle: {
    sprite: 'i_bottle', pal: null,
    get(g) {
      if (g.progress.maxBottles <= 0) { g.audio.sfx('deny'); return; }
      const got = addBottles(g.progress, 1);
      g.audio.sfx(got ? 'rupee' : 'deny');
      if (!got) g.say('Your case is full.');
    },
  },
  heartContainer: {
    sprite: 'p_heartcontainer', pal: null, persistent: true, hold: 2,
    get(g) { addHeartContainer(g.progress); g.audio.jingle('fanfare'); g.say('You got a Heart Container!'); },
  },
};

// Blanks come off the `good` and `rich` tables only. A blank from every
// Octorok would make the scrimshander a vending machine; off the tougher
// roster it stays something you notice getting.
//
// THE HEART WEIGHTS ARE UNCHANGED, deliberately. The first cut of this took
// blanks out of `heart`, and tools/replay.mjs caught it immediately: the
// d1-descent actor ran out of healing and died in a room it had always
// cleared. A new pickup must not quietly become a difficulty change — the
// weight comes out of `null` and the small rupees instead. Both tables still
// total 100.
export const DROP_TABLES = {
  none: [],
  common: [[40, null], [26, 'rupee1'], [16, 'heart'], [10, 'rupee5'], [8, 'bomb4']],
  good: [[14, null], [24, 'rupee5'], [24, 'heart'], [18, 'rupee1'], [12, 'bomb4'], [4, 'bottle'], [4, 'blank']],
  rich: [[6, null], [26, 'rupee20'], [28, 'heart'], [18, 'rupee5'], [10, 'fairy'], [6, 'bottle'], [6, 'blank']],
  hearts: [[30, null], [70, 'heart']],
  // What the Dredge Line brings up off the seafloor. Blanks are COMMON here
  // and rare everywhere else, which is what makes dredging the way you supply
  // the scrimshander rather than a way you might happen to.
  dredged: [[20, null], [30, 'blank'], [24, 'rupee5'], [16, 'heart'], [10, 'rupee20']],
};

/**
 * Roll a drop. `stream` is the room's RNG (game.rng) and is required — a drop
 * table rolled off a global stream would make one enemy's loot depend on how
 * many other enemies died first, and the room would stop replaying.
 */
export function rollDropTable(name, stream) {
  const t = DROP_TABLES[name] || DROP_TABLES.none;
  let total = 0;
  for (const [w] of t) total += w;
  let r = stream.float() * total;
  for (const [w, item] of t) { r -= w; if (r <= 0) return item; }
  return null;
}

// The townsfolk's errands' objects (S155): one pickup kind each, `e_<id>`,
// found lying in the world. Picking one up sets the errand's flag and holds it
// overhead; the person who asked for it reads the flag (NPC.errand).
for (const [id, def] of Object.entries(ERRANDS)) {
  PICKUPS['e_' + id] = {
    sprite: def.icon, pal: null, persistent: true,
    get(g) { setFlag(g.progress, def.flag); g.presentErrand(id); },
  };
}

// A piece of the wreck's cargo (S155, the salvage dive). It lies on the floor
// of deep water and only a player WALKING THAT FLOOR picks it up (`floor`) —
// a swimmer passing over it does not. It is not recorded as taken
// (`fleeting`): the dive is all five in one breath, and pieces carried up
// short of five go back down (Game.salvage).
PICKUPS.salvage = {
  sprite: 'i_e_salvage', pal: null, persistent: true, floor: true, fleeting: true,
  get(g, e) { g.salvage(e); },
};

/** What this pickup is carrying, or the kind's face value if nothing set it. */
function worthOf(e, base) {
  return (e && e.worth != null) ? e.worth : base;
}

export class Pickup extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.kind = o.kind || 'rupee1';
    const spec = PICKUPS[this.kind] || PICKUPS.rupee1;
    this.spec = spec;
    this.w = 16; this.h = 16;
    this.hb = { x: 3, y: 4, w: 10, h: 10 };
    this.sprite = spec.sprite;
    this.pal = spec.pal;
    this.isDrop = true;
    this.harmless = true;
    this.shadow = false;
    this.life = spec.persistent ? Infinity : (o.life || PICKUP_LIFE_FRAMES);
    // Set by rollDrop when the Beachcomber is on. Null means face value.
    this.worth = o.worth != null ? o.worth : null;
    // A DROP POPS UP INTO THE AIR AND BOUNCES ONCE, as Seasons' PART_ITEM_DROP
    // does (itemDrop.s): its height `zs` (sp, negative is up) rises at
    // PICKUP_POP_SPEED under PICKUP_GRAVITY, comes down where it started, and
    // can be taken from the top of the pop on. Placed in a room by its data
    // it simply lies there (`pop` unset). `vy` is px/f when a caller names one.
    this.pop = !!o.pop || o.vy != null;
    this.zs = 0;
    this.vz = this.pop ? (o.vy != null ? sp(o.vy) : PICKUP_POP_SPEED) : 0;
    this.z = 0;
    this.settle = this.pop ? 1 : 0;
    this.grabDelay = o.grabDelay || 0;
    this.saveKey = o.saveKey || null;
    this.depth = -2;
  }

  update(game) {
    this.frame++;
    if (this.attached) return;
    if (this.settle > 0) {
      this.zs += this.vz;
      this.vz += PICKUP_GRAVITY;
      if (this.zs >= 0) {
        this.zs = 0;
        // objectNegateAndHalveSpeedZ: back up at half the speed, or stop.
        if (this.vz >= PICKUP_BOUNCE_MIN) this.vz = -Math.trunc(this.vz / 2);
        else { this.vz = 0; this.settle = 0; }
      }
      this.z = -(this.zs >> 8);
    }
    if (this.spec.float) {
      // A fairy flies straight legs, Seasons' way (itemDrop.s): a random one
      // of sixteen directions, one of four speeds, for 8 to 70 frames, then
      // picks again.
      if (!(this._leg > 0)) {
        this._leg = FAIRY_LEG_MIN + 2 * game.rng.int(FAIRY_LEG_SPAN);
        const v = FAIRY_LEG_SPEEDS[game.rng.int(FAIRY_LEG_SPEEDS.length)];
        const a = game.rng.int(16) * Math.PI / 8;     // 0 is up, clockwise
        this._fvx = Math.round(Math.sin(a) * v);
        this._fvy = Math.round(-Math.cos(a) * v);
      }
      this._leg--;
      moveEntity(game, this, this._fvx, this._fvy);
    }
    // A DROP THAT COMES TO REST ON A HOLE GOES DOWN IT (S185), as Seasons'
    // PART_ITEM_DROP does on landing (itemDrop_checkOnHazard). A treasure
    // that waits for you — a key, a heart piece — is not a drop and stays.
    if (this.isFallingDrop() && this.settle <= 0 && overHole(game, this)) {
      dropIntoHole(game, this); return;
    }
    if (this.grabDelay > 0) this.grabDelay--;
    // The clock starts when it has landed, as the cartridge's does.
    if (this.life !== Infinity && this.settle <= 0 && --this.life <= 0) { this.remove = true; return; }
    if (this.spec.floor && !(game.player && game.player.underwater)) return;
    // Not to be had on the way up (itemDrop_checkHitGround arms its collision
    // once speedZ stops being negative).
    if (this.settle > 0 && this.vz < 0) return;
    if (this.grabDelay <= 0 && game.player && this.overlaps(game.player)) this.collect(game);
  }

  /** A drop the floor can take: one of the fleeting PART_ITEM_DROPs, not a
   *  treasure, not a fairy (it flies). */
  isFallingDrop() {
    return !this.spec.persistent && !this.spec.float && !this.attached && this.life !== Infinity;
  }

  /** Can a blade take this one (S179)? Only a DROP — Seasons' PART_ITEM_DROP;
   *  a key, a Piece of Heart, a map or anything else that waits for you is a
   *  treasure the sword passes over — and only once it can be taken at all,
   *  by the same gates the hand has (armed, not on the way up, not in the
   *  seafloor). */
  bladeTakes(game) {
    if (this.remove || this.attached || this.spec.persistent || this.grabDelay > 0) return false;
    if (this.spec.floor && !(game.player && game.player.underwater)) return false;
    return !(this.settle > 0 && this.vz < 0);
  }

  collect(game) {
    this.remove = true;
    if (this.saveKey && !this.spec.fleeting) game.progress.secrets[this.saveKey] = true;
    // Picked up off the ground, a Piece of Heart or a Heart Container is held
    // up in both hands, as Seasons does (grab mode 2 in its treasure table).
    if (this.spec.hold && !game.itemShow) game.holdUp({ sprite: this.sprite, pal: this.pal }, this.spec.hold);
    this.spec.get(game, this);
    game.spawnEffect('sparkle', this.x, this.y, { life: 14 });
  }

  draw(ctx, game, ox, oy) {
    // Blink out as the timer runs down.
    if (this.life !== Infinity && this.life < PICKUP_BLINK_FRAMES && (this.life >> 1) % 2 === 0) return;
    const bob = this.spec.persistent ? Math.round(Math.sin(this.frame * 0.08) * 1.5) : 0;
    // A pickup with `frames` cycles them; everything else draws its one sprite.
    // `frame` already ticks in update(), so this costs no new state and no new
    // clock — which is what keeps it out of the recorded replays.
    const f = this.spec.frames;
    const art = f ? f[Math.floor(this.frame / FAIRY_FLAP_FRAMES) % f.length] : this.sprite;
    sprites.draw(ctx, art, ox + this.x, oy + this.y + bob - this.z, { pal: this.pal });
  }
}
defineEntity('pickup', (x, y, o) => new Pickup(x, y, o));

// --------------------------------------------------------------------------
// A thing stuck up a tree (S155 side content). It sits in the canopy, where no
// hand or blade reaches it; a gust of the Squall Bellows blows it down, and it
// lands as the pickup it names (`drops`). Leave before picking it up and it is
// back in the tree next time — it is only gone once the pickup's own flag is
// set, which the room data names as `hideFlag`.
//
//   ['treeSnag', 7, 1, { drops: 'e_kite', hideFlag: 'foundKite' }]
//
// `perched` is what check-placement.mjs reads to let it stand on a tree tile:
// it is not standing, and check-side.mjs proves the gust brings it down.
// --------------------------------------------------------------------------

export class TreeSnag extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.w = 16; this.h = 16;
    this.hb = { x: 2, y: 2, w: 12, h: 12 };
    this.drops = o.drops || 'e_kite';
    const spec = PICKUPS[this.drops] || PICKUPS.rupee1;
    this.sprite = spec.sprite;
    this.pal = spec.pal;
    this.harmless = true;
    this.shadow = false;
    this.perched = true;
    this.depth = 4;
  }

  onGust(game, dx, dy) {
    if (this.remove) return;
    this.remove = true;
    game.spawnPickup(this.x + dx * 4, this.y + TILE, this.drops, { grabDelay: 20, vy: -1 });
    game.spawnEffect('cut', this.x, this.y + 8);
    game.audio.sfx('cut');
  }

  draw(ctx, game, ox, oy) {
    // It stirs in the wind it is caught in: a pixel either way, off the frame
    // counter the entity already keeps.
    const sway = ((this.frame++ >> 4) & 1) ? 1 : 0;
    // Drawn up in the leaves, half a tile above the cell it is caught on: the
    // cell has to be the canopy's lowest row, next to open ground, because the
    // gust does not blow through a trunk (Tide.blows).
    sprites.draw(ctx, this.sprite, ox + this.x + sway, oy + this.y - 10, this.pal ? { pal: this.pal } : undefined);
  }
}
defineEntity('treeSnag', (x, y, o) => new TreeSnag(x, y, o));

// --------------------------------------------------------------------------
// Chest
// --------------------------------------------------------------------------

export class Chest extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.w = 16; this.h = 16;
    this.hb = { x: 1, y: 4, w: 14, h: 11 };
    // Seasons' own chest, in its own colours (tools/rip-objects.py).
    this.pal = null;
    this.solid = true;
    this.harmless = true;
    this.shadow = false;
    this.big = !!o.big;
    this.item = o.item || null;         // item id to grant
    this.level = o.level || 1;
    this.pickup = o.pickup || null;     // or a pickup kind
    this.charm = o.charm || null;       // or a carved charm, by CHARMS id
    this.rupees = o.rupees || 0;
    this.opened = false;
    this.saveKey = o.saveKey || null;
    this.needsBossKey = !!o.bossKey;
    // A chest the STORY holds shut, the way `giver` already had. Nothing else
    // in the game could say "this is here, and it is not yours yet" about a
    // chest: a boss key is a dungeon's own lock, and an item gate is a wall in
    // front of the room rather than a lock on the box.
    this.needEssences = o.needEssences || 0;
    this.needText = o.needText || 'The lid will not lift. Not yet.';
  }

  interact(game, player) {
    if (this.opened) { game.say('Empty.'); return; }
    if (this.needsBossKey && !game.progress.bossKeys[game.mapId]) {
      game.say('A great lock. You need the Boss Key.');
      game.audio.sfx('deny');
      return;
    }
    if (this.needEssences && game.progress.essences.length < this.needEssences) {
      game.say(this.needText);
      game.audio.sfx('deny');
      return;
    }
    this.opened = true;
    if (this.saveKey) game.progress.chests[this.saveKey] = true;
    game.audio.sfx('chest');
    game.openChest(this);
  }

  spriteName() { return this.big ? (this.opened ? 'o_chestbig_open' : 'o_chestbig') : (this.opened ? 'o_chest_open' : 'o_chest'); }
}
defineEntity('chest', (x, y, o) => new Chest(x, y, o));

// --------------------------------------------------------------------------
// NPC / sign
// --------------------------------------------------------------------------

export class NPC extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.w = 16; this.h = 16;
    this.hb = { x: 2, y: 5, w: 12, h: 10 };
    // No default palette: extracted NPC art carries its own colours, and only an
    // explicit `pal` in room data should override them.
    this.pal = o.pal || null;
    this.sprite = o.sprite || 'npc_villager';
    this.frames = o.frames || null;
    this.solid = true;
    this.harmless = true;
    this.shadow = false;
    // Never stands in a tree's roots, placed or wandering (`canOccupy`).
    this.avoidRoots = true;
    // Standing ON something solid rather than on the floor — Farore's book on
    // her desk (S168). Read only by check-placement, as for a TreeSnag.
    this.perched = !!o.perched;
    this.dialogue = o.dialogue || null;      // dialogue id
    // A SECOND STATE FOR AN ORDINARY TOWNSPERSON.
    //
    // `Giver` and `Trader` have always had a before/after line; a plain `npc`
    // had exactly one line for the whole game, with no mechanism for a second
    // — so a village that had just watched the player take an Essence said the
    // same things it said at the title screen. (Note for anyone reading the
    // handoff: `A6` claimed `npc` already accepted `waiting`/`after`. It did
    // not. It does now.)
    //
    // This is deliberately NOT a new system. `needEssences`/`needFlag`/`ready`
    // are lifted verbatim out of `Giver` — which extends this class — so a
    // townsperson's second state is spelled exactly the way a quest-giver's
    // already was, and `Giver` inherits them rather than declaring its own.
    // Two states only: a third would want a real condition table, and nothing
    // in this game has yet needed one.
    this.afterText = o.after || null;
    this.needEssences = o.needEssences || 0;
    this.needFlag = o.needFlag || null;
    // `afterFlag` (S200): the second line waits on a flag, like `needFlag`,
    // but the person is there from the start. `needFlag` on an entity also
    // means "not in the room until the flag is set" (Game.spawnSpec), which
    // is right for a reward and wrong for the lighthouse keeper.
    this.afterFlag = o.afterFlag || null;
    this.dir = o.dir || 'down';
    this.wander = !!o.wander;
    this.rate = o.rate || 22;
    this.faceOnTalk = o.faceOnTalk !== false;
    this.onTalk = o.onTalk || null;
    // A STORY BEAT (S154): a cutscene this person plays once, the first time
    // they are spoken to after `need` Essences — how each dungeon key is
    // handed over. `{ scene, need, flag }`: the scene is in src/data/story.js
    // and SETS `flag` itself, and the flag is also the guard, the same
    // contract as the Maku Tree's `sceneFlag`. Asked before anything else the
    // person would say, so a beat is never queued behind a trade or a gift.
    this.beat = o.beat || null;
    // AN ERRAND (S155): `{ need, prize, flag, ask, thanks, asked? }`. Until it is done
    // this person says `ask`; once `need` (an errand object's flag, see
    // src/data/errands.js) is set they say `thanks` and hand over `prize`, a
    // PICKUPS kind, held overhead; `flag` records it done and, from then on,
    // they say their ordinary lines again.
    this.errand = o.errand || null;
  }

  /** Speak for this person's errand if it is still open. True if it spoke. */
  errandTalk(game) {
    const e = this.errand, p = game.progress;
    if (!e || flag(p, e.flag)) return false;
    // `need` may be a LIST (S200, the lighthouse keeper's three lamp parts):
    // every flag in it, and `partial` is said once some but not all are in.
    const needs = Array.isArray(e.need) ? e.need : [e.need];
    const have = needs.filter(n => flag(p, n)).length;
    if (have < needs.length) {
      game.startDialogue(have && e.partial ? e.partial : e.ask, this);
      // `asked`: a flag the asking sets, for an errand whose object is only
      // there once somebody has said so (the salvage dive's cargo).
      if (e.asked && !flag(p, e.asked)) { setFlag(p, e.asked); game.spawnFlagged(e.asked); }
      return true;
    }
    const pay = () => { setFlag(p, e.flag); game.presentPrize(e.prize); };
    game.startDialogue(e.thanks, this);
    if (game.dialogue.active) game.dialogue.onClose = pay; else pay();
    return true;
  }

  /** Play this person's story beat if it is owed now. True if it started. */
  //
  // `needItem` / `unlessItem` / `needFlag` (S158, the opening): a beat can
  // also wait for something the player holds or has done, and a hint about
  // where the first blade is has no business playing to a player holding it.
  playBeat(game) {
    const b = this.beat, p = game.progress;
    if (!b || flag(p, b.flag) || p.essences.length < (b.need || 0)) return false;
    if (b.needItem && !hasItem(p, b.needItem)) return false;
    if (b.unlessItem && hasItem(p, b.unlessItem)) return false;
    if (b.needFlag && !flag(p, b.needFlag)) return false;
    return game.startCutscene(b.scene);
  }

  update(game) {
    this.frame++;
    if (this.wander && !game.dialogue.active) {
      if (this.frame % NPC_WANDER_PERIOD === 0) {
        this._wdir = game.rng.pick(['up', 'down', 'left', 'right', null]);
      }
      if (this._wdir) {
        const [dx, dy] = DIR_VEC[this._wdir];
        const r = moveEntity(game, this, dx * NPC_WANDER_SPEED, dy * NPC_WANDER_SPEED);
        // NPC_WANDER_SPEED is well under a pixel a frame; it only carries them
        // anywhere because the subpixel accumulator keeps the remainder.
        if (r.hitX || r.hitY) this._wdir = null;
        else this.dir = this._wdir;
      }
    }
  }

  /** Whether this entity's condition is met. `Giver` gates its handover on
   *  this; a plain NPC gates its second line on it. */
  ready(game) {
    const p = game.progress;
    if (p.essences.length < this.needEssences) return false;
    if (this.needFlag && !flag(p, this.needFlag)) return false;
    if (this.afterFlag && !flag(p, this.afterFlag)) return false;
    return true;
  }

  /** Whether a condition was declared at all. `ready()` is vacuously true for
   *  an entity with no condition — which is right for a `Giver` with nothing
   *  to wait for, and wrong for choosing a line, since it would make an
   *  unconditional `after` the only line the NPC ever said. */
  conditional() { return this.needEssences > 0 || !!this.needFlag || !!this.afterFlag; }

  interact(game, player) {
    if (this.faceOnTalk) {
      const dx = player.cx - this.cx, dy = player.cy - this.cy;
      this.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    }
    if (this.playBeat(game)) return;
    if (this.errandTalk(game)) return;
    if (this.onTalk) { if (this.onTalk(game, this, player) === false) return; }
    const line = (this.afterText && this.conditional() && this.ready(game))
      ? this.afterText : this.dialogue;
    if (line) game.startDialogue(line, this);
  }

  spriteName() {
    if (!this.frames) return this.sprite;
    const side = this.dir === 'left' || this.dir === 'right';
    this.flipX = this.dir === 'left';
    const key = side ? 'side' : this.dir;
    const list = this.frames[key] || this.frames.down || [this.sprite];
    return list[Math.floor(this.frame / this.rate) % list.length];
  }
}
defineEntity('npc', (x, y, o) => new NPC(x, y, o));

// --------------------------------------------------------------------------
// A race (S155 side content): a `racer` who starts the clock and a
// `raceGoal` who stops it, sharing a race `id`. The clock lives on the game
// (Game.startRace); the frames it allows live in feel.js, named here by id so
// room data never carries a timing constant.
//
//   ['racer', 1, 3, { race: 'shore', ask: 'raceAsk', busy: 'raceBusy',
//     win: 'raceWin', lose: 'raceLose', prize: 'heartPiece', again: 'rupee20',
//     flag: 'raceWon', sprite: 'npc_child' }]
//   ['raceGoal', 5, 5, { race: 'shore', dialogue: 'raceGoalWait', sprite: ... }]
// --------------------------------------------------------------------------

const RACE_FRAMES = { shore: RACE_SHORE_FRAMES };

export class Racer extends NPC {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.raceDef = {
      id: o.race, frames: RACE_FRAMES[o.race] || 0, prize: o.prize || 'rupee20',
      again: o.again || 'rupee20', flag: o.flag || null, win: o.win || null, lose: o.lose || null,
    };
    this.askText = o.ask || null;
    this.busyText = o.busy || null;
  }

  interact(game, player) {
    if (this.faceOnTalk) {
      const dx = player.cx - this.cx, dy = player.cy - this.cy;
      this.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    }
    if (game.race) { if (this.busyText) game.startDialogue(this.busyText, this); return; }
    const go = () => game.startRace(this.raceDef);
    game.startDialogue(this.askText, this);
    if (game.dialogue.active) game.dialogue.onClose = go; else go();
  }
}
defineEntity('racer', (x, y, o) => new Racer(x, y, o));

export class RaceGoal extends NPC {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.raceId = o.race || null;
  }

  update(game) {
    super.update(game);
    // The finish is reaching them, not talking to them: a race ends the frame
    // you arrive, the way a line is crossed.
    const p = game.player, r = game.race;
    if (!p || !r || r.id !== this.raceId) return;
    if (Math.abs(p.cx - this.cx) <= TILE + 4 && Math.abs(p.cy - this.cy) <= TILE + 4) game.finishRace();
  }
}
defineEntity('raceGoal', (x, y, o) => new RaceGoal(x, y, o));

// --------------------------------------------------------------------------
// The bell-buoy echo (S201 side content): a sailor plays a tune on the buoys
// moored in Sunken Cove, and the player rings it back with the Resonance Rod.
// The Rod rings EVERY bell in earshot (ringResonance), so the game is where
// you stand: a spot where only the right buoy hears you, and the tide decides
// which spots there are — a sandbar tip only at LOW, a sinkhole channel only
// waded at MID, and at HIGH the note carries twice as far, which rings the
// whole bay at once. Run state lives on the sailor, so leaving the screen
// drops a game in progress; only the first win is saved (`flag`).
//
//   ['buoy', 3, 2, { note: 2 }]                       note 1..5, low to high
//   ['buoyKeeper', 5, 1, { tunes: [[2, 4, 2], ...], prize: 'seedBag',
//     again: 'rupee20', flag: 'buoysWon', ask: ..., ... }]
//
// A tune is a list of notes; a note is a buoy number or a list of buoy
// numbers rung in the same stroke.
// --------------------------------------------------------------------------

// The chime is one voice played at five pitches: a major pentatonic, an
// octave under the sunken bell's, so the bay sounds like buoys and not a
// shrine bell.
const BUOY_PITCH = [0.5, 0.5625, 0.625, 0.75, 0.8333];

export class Buoy extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.w = 16; this.h = 16;
    this.hb = { x: 2, y: 4, w: 12, h: 11 };
    this.solid = true;
    this.harmless = true;
    this.shadow = false;
    // Moored in open water nobody walks: check-placement asks no ground of it.
    this.perched = true;
    this.note = o.note || 1;
    this.lit = 0;
    this.t = 0;
  }

  /** Sound this buoy's note and light it, whoever struck it. */
  sound(game) {
    this.lit = BUOY_LIT_FRAMES;
    game.audio.sfx('chime', { pitch: BUOY_PITCH[this.note - 1] || 1 });
    // The bell is two pixels wide: the sparkle is what a player watching the
    // sailor's tune actually sees, the sunken bell's own answer (SunkenBell).
    game.spawnEffect('sparkle', this.cx - 8, this.cy - 18, { life: BUOY_LIT_FRAMES, pal: 'gold' });
  }

  /** Called by ringResonance for every entity in earshot: one stroke may
   *  reach several buoys, and the sailor judges them together. */
  onRing(game) {
    this.sound(game);
    (game.buoyStrike = game.buoyStrike || []).push(this.note);
  }

  update() {
    this.t++;
    if (this.lit > 0) this.lit--;
  }

  interact(game) { game.say('A bell buoy, riding at its mooring.'); }

  spriteName() { return Math.floor(this.t / BUOY_BOB_FRAMES) % 2 ? 'o_buoy1' : 'o_buoy0'; }

  draw(ctx, game, ox, oy) {
    this.pal = this.lit > 0 ? 'o_buoyLit' : 'o_buoy';
    super.draw(ctx, game, ox, oy);
  }
}
defineEntity('buoy', (x, y, o) => new Buoy(x, y, o));

export class BuoyKeeper extends NPC {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.tunes = o.tunes || [];
    this.prize = o.prize || 'rupee20';
    this.again = o.again || 'rupee20';
    this.winFlag = o.flag || null;
    this.text = {
      ask: o.ask, noRod: o.noRod, turn: o.turn, sour: o.sour,
      next: o.next || [], win: o.win, winAgain: o.winAgain,
    };
    this.round = 0;       // which tune
    this.state = 'idle';  // idle | lead | play | listen
    this.timer = 0;
    this.step = 0;        // the note being played, or the note expected
  }

  buoys(game) { return game.entities.filter(e => e instanceof Buoy && !e.remove); }

  interact(game, player) {
    if (this.faceOnTalk) {
      const dx = player.cx - this.cx, dy = player.cy - this.cy;
      this.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    }
    if (!hasItem(game.progress, 'rod')) { game.startDialogue(this.text.noRod, this); return; }
    if (this.state === 'listen' || this.state === 'play') { game.startDialogue(this.text.turn, this); return; }
    const go = () => this.begin(game);
    game.startDialogue(this.round === 0 ? this.text.ask : this.text.next[this.round - 1], this);
    if (game.dialogue.active) game.dialogue.onClose = go; else go();
  }

  /** Play the current round's tune from the start. */
  begin(game) {
    this.state = 'lead';
    this.timer = BUOY_LEAD_IN_FRAMES;
    this.step = 0;
    game.buoyStrike = null;
  }

  noteSet(note) { return (Array.isArray(note) ? note : [note]).slice().sort((a, b) => a - b).join(','); }

  update(game) {
    super.update(game);
    const strike = game.buoyStrike;
    game.buoyStrike = null;
    if (this.state === 'lead' || this.state === 'play') {
      if (--this.timer > 0) return;
      const tune = this.tunes[this.round];
      if (this.state === 'play' && this.step >= tune.length) {
        this.state = 'listen';
        this.step = 0;
        return;
      }
      this.state = 'play';
      const want = new Set(Array.isArray(tune[this.step]) ? tune[this.step] : [tune[this.step]]);
      for (const b of this.buoys(game)) if (want.has(b.note)) b.sound(game);
      this.step++;
      this.timer = BUOY_NOTE_FRAMES;
      return;
    }
    if (this.state !== 'listen' || !strike) return;
    // Rung treading water or from the seafloor: the bay answers, the sailor
    // does not count it. The Dredge Line and the Reefseed want feet down too.
    const p = game.player;
    if (p && (p.inDeep || p.underwater)) return;
    const tune = this.tunes[this.round];
    if (this.noteSet(strike) !== this.noteSet(tune[this.step])) {
      this.state = 'idle';
      game.audio.sfx('deny');
      game.startDialogue(this.text.sour, this);
      return;
    }
    if (++this.step < tune.length) return;
    // The whole tune.
    this.state = 'idle';
    this.round++;
    if (this.round < this.tunes.length) {
      game.audio.jingle('secret');
      const go = () => this.begin(game);
      game.startDialogue(this.text.next[this.round - 1], this);
      if (game.dialogue.active) game.dialogue.onClose = go; else go();
      return;
    }
    this.round = 0;
    const first = !(this.winFlag && flag(game.progress, this.winFlag));
    if (this.winFlag) setFlag(game.progress, this.winFlag);
    game.startDialogue(first ? this.text.win : this.text.winAgain, this);
    const pay = () => game.presentPrize(first ? this.prize : this.again);
    if (game.dialogue.active) game.dialogue.onClose = pay; else pay();
  }
}
defineEntity('buoyKeeper', (x, y, o) => new BuoyKeeper(x, y, o));

export class Sign extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.w = 16; this.h = 16;
    this.hb = { x: 2, y: 4, w: 12, h: 11 };
    this.sprite = 'o_sign';
    this.pal = null;
    this.solid = true;
    this.harmless = true;
    this.shadow = false;
    this.text = o.text || '...';
  }
  interact(game) { game.say(this.text); }
}
defineEntity('sign', (x, y, o) => new Sign(x, y, o));

// --------------------------------------------------------------------------
// Shop item: an item on the floor with a price tag, bought by pressing A.
//
//   ['shopItem', 3, 3, { item: 'shield', level: 1, price: 30 }]
//   ['shopItem', 5, 3, { pickup: 'bomb4', price: 20, name: 'Bombs' }]
//   ['shopItem', 7, 3, { charm: 'ballastHeart', price: 80 }]
// --------------------------------------------------------------------------

// Which counted pickups need a container before they are worth anything, and
// what the shopkeeper says when you have not got one. Keyed on the PICKUP id
// because that is what the shop stocks; the capacity field is the one
// `progress.giveItem` fills when the carrying item is granted. Game.rollDrop
// reads it too: nothing drops what Link has nowhere to put.
export const CAPACITY_FOR = {
  bomb4: { field: 'maxBombs', deny: 'and nothing to carry them in.\nCome back with a bag.' },
  bottle: { field: 'maxBottles', deny: 'and nowhere to put it.\nCome back with a bottle.' },
};

export class ShopItem extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.w = 16; this.h = 16;
    this.hb = { x: 2, y: 2, w: 12, h: 12 };
    this.harmless = true;
    this.shadow = false;
    this.solid = false;
    this.price = o.price || 10;
    this.item = o.item || null;
    this.level = o.level || 1;
    this.pickup = o.pickup || null;
    this.charm = o.charm || null;
    this.label = o.name || null;
    this.saveKey = o.saveKey || null;
    this.once = o.once !== false;      // most stock is one-per-save
    this.sold = false;
    this.depth = -3;
  }

  get displayName() {
    if (this.label) return this.label;
    if (this.item) return itemName(this.item, this.level);
    if (this.charm) return (CHARMS[this.charm] || {}).name || 'a carved charm';
    return 'something';
  }

  get icon() {
    if (this.item) return itemIcon(this.item, this.level);
    if (this.charm) return 'i_charm';
    return (PICKUPS[this.pickup] || PICKUPS.rupee1).sprite;
  }

  interact(game) {
    if (this.sold) { game.say('Sold out, sorry.'); return; }
    const p = game.progress;
    // The Chandler's Eye is read here and nowhere else, so the price quoted,
    // the price checked and the price paid are all one number.
    // AMMUNITION NEEDS SOMETHING TO GO IN. A counted pickup clamps to its
    // capacity (`addBombs` -> `Math.min(p.maxBombs, …)`), and every capacity
    // starts at ZERO until the item that carries it is granted. So buying
    // bombs without the bomb bag took twenty rupees and handed over nothing at
    // all — the shop's own version of the empty-pouch trap in CLAUDE.md, and
    // silent, because nothing refuses a sale that pays out zero.
    //
    // Refused rather than fixed by granting a bag: bombs come from the BAG,
    // which is the Coral Spire's to give. The shop restocks it; it does not
    // replace it.
    const cap = this.pickup && CAPACITY_FOR[this.pickup];
    if (cap && !p[cap.field]) {
      game.audio.sfx('deny');
      game.say(`${this.displayName} — ${cap.deny}`);
      return;
    }
    const price = game.shopPrice(this.price);
    if (p.rupees < price) {
      game.audio.sfx('deny');
      game.say(`${this.displayName} — ${price} Rupees.\nYou cannot afford it.`);
      return;
    }
    game.ask(`${this.displayName} — ${price} Rupees.\nBuy it?`, ['Yes', 'No'], (pick) => {
      if (pick !== 0) return;
      addRupees(p, -price);
      game.audio.sfx('rupee');
      if (this.item) {
        giveItem(p, this.item, this.level);
        game.autoEquip(this.item);
        if (this.item === 'bombs' && !p.maxBombs) { p.maxBombs = 10; addBombs(p, 10); }
        game.presentItem(this.item, this.level);
      } else if (this.charm) {
        giveCharm(p, this.charm);
        game.audio.jingle('fanfareShort');
        game.say('A carved charm! Slot it on the CHARM screen.');
      } else if (this.pickup) {
        (PICKUPS[this.pickup] || PICKUPS.rupee1).get(game, null);
      }
      if (this.once) {
        this.sold = true;
        if (this.saveKey) p.secrets[this.saveKey] = true;
      }
    });
  }

  update(game) {
    this.frame++;
    if (!this._checked) {
      this._checked = true;
      if (this.saveKey && game.progress.secrets[this.saveKey]) this.sold = true;
    }
  }

  draw(ctx, game, ox, oy) {
    if (this.sold) return;
    const bob = Math.round(Math.sin(this.frame * 0.06) * 1);
    sprites.draw(ctx, this.icon, ox + this.x, oy + this.y + bob,
      { pal: (this.item && ITEMS[this.item] && ITEMS[this.item].pal) || 'ui' });
    // The tag shows what it will actually cost, so a charm that makes things
    // cheaper is visible from across the shop rather than at the till.
    drawText(ctx, String(game.shopPrice(this.price)),
      ox + this.x + 2, oy + this.y + 15, '#f8f8e8', '#181c18');
  }
}
defineEntity('shopItem', (x, y, o) => new ShopItem(x, y, o));

// --------------------------------------------------------------------------
// Giver: an NPC who hands over an item once a condition is met.
//
//   ['giver', 4, 3, {
//     sprite: 'npc_maku', pal: 'maku',
//     item: 'satchel', level: 1,
//     needEssences: 1,                 // or needFlag: 'someFlag'
//     flag: 'gotSatchel',              // set once given, so it happens once
//     dialogue: 'makuSatchel',         // said when the condition holds
//     waiting: 'makuWaiting',          // said when it does not
//     after: 'makuIdle',               // said on later visits
//   }]
// --------------------------------------------------------------------------

export class Giver extends NPC {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.item = o.item || null;
    this.level = o.level || 1;
    this.pickup = o.pickup || null;
    this.charm = o.charm || null;
    // `needEssences`, `needFlag`, `afterText` and `ready()` are inherited from
    // NPC now — they used to be declared here and were lifted up so a plain
    // townsperson could use the same contract.
    this.giveFlag = o.flag || null;
    this.waitingText = o.waiting || null;
  }

  interact(game, player) {
    const p = game.progress;
    if (this.faceOnTalk) {
      const dx = player.cx - this.cx, dy = player.cy - this.cy;
      this.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    }
    if (this.playBeat(game)) return;
    if (this.giveFlag && flag(p, this.giveFlag)) {
      if (this.afterText) game.startDialogue(this.afterText, this);
      else if (this.dialogue) game.startDialogue(this.dialogue, this);
      return;
    }
    if (!this.ready(game)) {
      if (this.waitingText) game.startDialogue(this.waitingText, this);
      else if (this.dialogue) game.startDialogue(this.dialogue, this);
      return;
    }
    if (this.giveFlag) setFlag(p, this.giveFlag);
    const grant = () => {
      if (this.item) {
        giveItem(p, this.item, this.level);
        game.autoEquip(this.item);
        if (this.item === 'bombs' && !p.maxBombs) { p.maxBombs = 10; addBombs(p, 10); }
        game.presentItem(this.item, this.level);
      } else if (this.charm) {
        giveCharm(p, this.charm);
        game.audio.jingle('fanfareShort');
        game.say('A carved charm!');
      } else if (this.pickup) {
        game.presentPrize(this.pickup);
      }
    };
    // Speak first, then hand the item over once the box is dismissed.
    if (this.dialogue) {
      game.startDialogue(this.dialogue, this);
      if (game.dialogue.active) { game.dialogue.onClose = grant; return; }
    }
    grant();
  }
}
defineEntity('giver', (x, y, o) => new Giver(x, y, o));

// --------------------------------------------------------------------------
// Trader: one link of the Coastwise Chain.
//
//   ['trader', 4, 2, {
//     sprite: 'npc_fisher', dialogue: 'ossaWait',   // said when it is not your turn
//     deals: [
//       { stage: 1, gives: 'float', text: 'ossaStart' },
//       { stage: 11, wants: 'kettle', gives: 'bellrope', text: 'ossaEnd',
//         after: 'ossaAfter' },
//     ],
//   }]
//
// A trader holds one or more DEALS, and a deal is live when the chain's stage
// counter is sitting exactly one short of it — `p.trade.stage === stage - 1`.
// That is what makes the chain a chain and not a set of independent errands:
// there is exactly one live deal in the whole world at any moment, so a trader
// two links ahead has nothing to say to you yet even though you are holding
// something they would love.
//
// `wants` is asserted rather than consulted. The stage counter already decides
// whether the deal is live, so `wants` exists to be WRONG loudly if the two
// ever disagree — a mis-stated want is a data error, and refusing the trade in
// the engine is what stops it becoming a silent one. tools/check-trade.mjs
// proves every `wants` against the previous stage's `gives` offline.
//
// A trader may ALSO hand over a real inventory item (`item`/`level`), which is
// how the chain ends: the Maku Tree takes the bell-rope and gives the
// Resonance Rod. Everything else in the chain hands over a trade item only.
// --------------------------------------------------------------------------

export class Trader extends NPC {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.deals = (o.deals || []).map(d => ({
      stage: d.stage, wants: d.wants || null, gives: d.gives || null,
      text: d.text || null, item: d.item || null, level: d.level || 1,
      flag: d.flag || null, needEssences: d.needEssences || 0,
      needFlag: d.needFlag || null, blocked: d.blocked || null,
      after: d.after || null,
    }));
    // What they say when no deal of theirs is live: before their turn comes
    // round, and again for ever after it has passed.
    this.waitingText = o.waiting || o.dialogue || null;
    this.afterText = o.after || null;
  }

  /** The deal whose turn it is, or null. At most one trader in the world has one. */
  liveDeal(game) {
    const st = game.progress.trade.stage || 0;
    return this.deals.find(d => d.stage === st + 1) || null;
  }

  /** Has every deal this trader holds already been done? */
  spent(game) {
    const st = game.progress.trade.stage || 0;
    return this.deals.length > 0 && this.deals.every(d => d.stage <= st);
  }

  interact(game, player) {
    const p = game.progress;
    if (this.faceOnTalk) {
      const dx = player.cx - this.cx, dy = player.cy - this.cy;
      this.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    }
    // A trader can also hold a story beat (S158: Teel on the Fishing Stones
    // is the first person a new game meets), asked before any deal.
    if (this.playBeat(game)) return;
    const deal = this.liveDeal(game);
    // Not this trader's turn. Either they are still waiting for the chain to
    // reach them, or it has gone past and they are done with it. A trader can
    // hold an errand too (S155: Dov's salvage dive), asked in between.
    if (!deal && this.errandTalk(game)) return;
    if (!deal) {
      const done = this.spent(game);
      const line = (done && this.afterText) || this.waitingText || this.afterText;
      if (line) game.startDialogue(line, this);
      return;
    }
    // The stage counter says yes; the stated want has to agree with what is
    // actually in the player's hand, or the data is lying and the trade is off.
    if ((deal.wants || null) !== (p.trade.item || null)) {
      console.warn('[trade] stage', deal.stage, 'wants', deal.wants, 'but holding', p.trade.item);
      if (this.waitingText) game.startDialogue(this.waitingText, this);
      return;
    }
    // Some links ask for something beyond the previous item — the Maku Tree
    // wants an Essence as well as the rope. A deal that is gated and not yet
    // open says the trader's waiting line, exactly as if its turn had not come.
    if (p.essences.length < deal.needEssences
        || (deal.needFlag && !flag(p, deal.needFlag))) {
      if (deal.blocked || this.waitingText) game.startDialogue(deal.blocked || this.waitingText, this);
      return;
    }

    const close = () => {
      p.trade.stage = deal.stage;
      p.trade.item = deal.gives || null;
      if (deal.flag) setFlag(p, deal.flag);
      if (deal.item) {
        giveItem(p, deal.item, deal.level);
        game.autoEquip(deal.item);
        game.presentItem(deal.item, deal.level);
      } else if (deal.gives) {
        game.presentTrade(deal.gives);
      }
    };
    // Speak first, hand over once the box is dismissed — the same order the
    // Giver uses, so a trade reads like every other gift in the game.
    if (deal.text) {
      game.startDialogue(deal.text, this);
      if (game.dialogue.active) { game.dialogue.onClose = close; return; }
    }
    close();
  }
}
defineEntity('trader', (x, y, o) => new Trader(x, y, o));

// --------------------------------------------------------------------------
// MERGE NOTE — why this class extends Trader and not Giver.
//
// Two branches each gave the Maku Tree a second life and they disagreed about
// what she IS. One made her the last link of the Coastwise Chain (a `trader`
// who takes the Tide Bell's rope and gives the Resonance Rod); the other made
// her a two-beat `giver` (the Rod at one Essence, then `makuMaster` at five,
// which opens the road to the Abyssal Keep and grants the level-3 sword).
//
// She is BOTH, and the two beats are not in competition: the chain is beat one,
// the Keep is beat two. So MakuTree keeps its second beat exactly as written
// and inherits its first from Trader instead of Giver. Nothing about the chain
// changes — the deal, its stage, and `gotRod` are the trader branch's, intact.
//
// The load-bearing part is `makuOpenedKeep`. The Keep's gate reads that flag
// and NOTHING ELSE sets it; a resolution that kept only the trader half would
// have left the game uncompletable while every trade checker stayed green.
// --------------------------------------------------------------------------
// The Maku Tree: a giver with a SECOND beat that is a cutscene rather than a
// handover.
//
//   ['makuTree', 4, 2, {
//     ...every `giver` option, which drives the first beat (the Rod),
//     scene: 'makuMaster',           // played once the second beat is earned
//     sceneNeed: 5,                  // Essences it waits for
//     sceneFlag: 'makuOpenedKeep',   // the flag the SCENE sets; also its guard
//     sceneAfter: 'makuOpened',      // said on later visits
//   }]
//
// `makuMaster` — the tree opening the road to the Keep and handing over the
// Master Sword — had been written in src/data/story.js for the whole life of
// the project with NOTHING ANYWHERE TRIGGERING IT. That is why the road to the
// Keep was sealed by a tile only the Dredge Line opened, and why a real
// player's sword never left level 1: the level-3 sword is granted here and
// only here.
//
// The scene sets its own flag and hands over its own item, which is why this
// class does neither. The flag is both the record and the guard: a scene that
// has run has set it, so the beat cannot fire twice.
// --------------------------------------------------------------------------

export class MakuTree extends Trader {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.scene = o.scene || null;
    this.sceneNeed = o.sceneNeed || 0;
    this.sceneFlag = o.sceneFlag || null;
    this.sceneAfter = o.sceneAfter || null;
    this.face = o.face || null;
    this.faceAt = o.faceAt || [0, 0];
  }

  /**
   * The grove's tree has no body to draw — the trunk is the room — only its
   * face, a sprite over the bark at `faceAt` (room pixels), which is how the
   * cartridge draws it too. A MakuTree without `face` draws as any NPC.
   */
  draw(ctx, game, ox, oy) {
    if (!this.face) return super.draw(ctx, game, ox, oy);
    sprites.draw(ctx, this.face, ox + this.faceAt[0], oy + this.faceAt[1], {});
  }

  /** Is the second beat owed right now? */
  sceneReady(game) {
    const p = game.progress;
    if (!this.scene || !this.sceneFlag) return false;
    if (flag(p, this.sceneFlag)) return false;
    if (p.essences.length < this.sceneNeed) return false;
    // The first beat comes first. A player who somehow arrives with five
    // Essences and no Rod gets the Rod on this visit and the road on the next,
    // rather than skipping a handover because they were late.
    // BEAT ONE IS NOW A TRADE, so the test for "the Rod has been handed over"
    // is the chain's, not the Giver's: `spent()` is true once the stage counter
    // has passed every deal this tree holds.
    //
    // The empty-deals clause is not decoration. `spent()` answers FALSE for a
    // trader holding no deals, so a MakuTree placed without any would wait for
    // a first beat that can never arrive and seal the road to the Keep for
    // ever. There is only one such tree today and it has its deal, but this is
    // exactly the class of bug this file has been bitten by before — a guard
    // that reads correctly and is unsatisfiable.
    if (this.deals.length === 0) return true;
    return this.spent(game);
  }

  interact(game, player) {
    const p = game.progress;
    if (this.playBeat(game)) return;
    if (this.sceneReady(game)) {
      if (this.faceOnTalk) this.dir = 'down';
      game.startCutscene(this.scene);
      return;
    }
    if (this.sceneFlag && flag(p, this.sceneFlag) && this.sceneAfter) {
      game.startDialogue(this.sceneAfter, this);
      return;
    }
    super.interact(game, player);
  }
}
defineEntity('makuTree', (x, y, o) => new MakuTree(x, y, o));

// --------------------------------------------------------------------------
// The scrimshander: hand over a blank plus rupees, come back a tide later for
// a carved charm.
//
//   ['scrimshander', 1, 2, { sprite: 'npc_brinewife' }]
//
// She also opens the LOW and HIGH cases, and later widens all three. Those are
// progression, so they are keyed on ESSENCES rather than on rupees — the cases
// open because the story moved, not because you shopped. Each opening is a
// one-shot flag so the line is said once and the state is saved.
// --------------------------------------------------------------------------

export class Scrimshander extends NPC {
  constructor(x, y, o = {}) {
    // Her own face. She used to default to `npc_elder`, which the village
    // digger also wore — two characters standing on one screen with one head
    // between them, which is the thing extracting from the races sheet was
    // for. She is Brinekin; the digger is a Salter.
    super(x, y, { sprite: 'npc_brinewife', ...o });
    this.faceOnTalk = true;
  }

  /**
   * She ACKNOWLEDGES the cases; she no longer gates them. `openCharmCases` is
   * called on the essence itself (Game.claimEssence), so by the time the
   * player gets here the case is already open and slotted-into — see the
   * write-up on that function for why the visit could not stay the trigger.
   *
   * The call is repeated here on purpose, for the one save that reaches her
   * with essences and an unopened case: a file saved before this change.
   * Returns a line, or null.
   */
  checkUnlocks(game) {
    const p = game.progress;
    openCharmCases(p);
    const owed = [
      ['low', 'I cut you that second case when the shard landed —\nfor the low water, when the seafloor is a road.'],
      ['high', 'And the third, for the high water. Bone keeps\nbetter wet than you would think.'],
      ['size', 'Every case takes two now. You have earned\nthe room.'],
    ];
    p.charmTold = p.charmTold || {};
    for (const [k, line] of owed) {
      const open = k === 'size' ? p.charmCase >= CHARM_CASE_MAX : !!p.charmOpen[k];
      if (open && !p.charmTold[k]) { p.charmTold[k] = true; return line; }
    }
    return null;
  }

  interact(game, player) {
    const p = game.progress;
    if (this.faceOnTalk) {
      const dx = player.cx - this.cx, dy = player.cy - this.cy;
      this.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    }

    const unlocked = this.checkUnlocks(game);
    if (unlocked) { game.audio.jingle('fanfareShort'); game.say(unlocked); return; }

    // A finished carving comes first: nothing else she says matters while
    // there is one sitting on the bench.
    if (p.carve && p.carve.turns <= 0) {
      const id = game.collectCarving();
      game.audio.jingle('fanfareShort');
      game.say(`Here. The bone wanted to be a ${CHARMS[id].name}.\n${CHARMS[id].desc}`);
      return;
    }
    if (p.carve) {
      game.say(`Not yet. ${p.carve.turns} more turn${p.carve.turns === 1 ? '' : 's'} of the tide.\nSound your conch if you are in a hurry.`);
      return;
    }
    if (!p.blanks) {
      game.say('Bring me a blank. Bone, shell, anything the sea\nhas finished with. Dredge the seafloor for it.');
      return;
    }
    const price = game.shopPrice(CARVE_PRICE);
    if (p.rupees < price) {
      game.say(`${price} Rupees and a blank, and I will carve you\nsomething. You are short.`);
      return;
    }
    game.ask(`A blank and ${price} Rupees. I choose what it\nbecomes — the bone does, really. Well?`,
      ['Yes', 'No'], (pick) => {
        if (pick !== 0) return;
        const id = game.commissionCarving();
        if (!id) { game.say('You have every charm I know. Go and use them.'); return; }
        p.blanks--;
        addRupees(p, -price);
        game.audio.sfx('confirm');
        game.say('Come back when the tide has turned all the way\nround. It will be ready.');
      });
  }
}
defineEntity('scrimshander', (x, y, o) => new Scrimshander(x, y, o));

// --------------------------------------------------------------------------
// Pushable block, floor switch, torch
// --------------------------------------------------------------------------

export class PushBlock extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.w = 16; this.h = 16;
    this.hb = { x: 0, y: 0, w: 16, h: 16 };
    // Seasons' own block, in the colours of the Seasons dungeon this one is
    // built from (OBJECT_THEMES); `spriteName` picks it per map.
    this.sprite = o.sprite || null;
    this.pal = o.pal || null;
    this.solid = true;
    this.harmless = true;
    this.shadow = false;
    this.once = o.once !== false;      // most blocks only move once
    this.moved = false;
    this.slide = null;
    this.axis = o.axis || null;        // 'x' | 'y' restriction
  }

  spriteName(game) { return this.sprite || themed('o_block', game); }

  push(game, dx, dy) {
    if (this.slide || (this.once && this.moved)) return false;
    if (this.axis === 'x' && dy !== 0) return false;
    if (this.axis === 'y' && dx !== 0) return false;
    const nx = this.x + dx * TILE, ny = this.y + dy * TILE;
    if (!canOccupy(game, this, nx, ny, { jumping: false, swim: false })) return false;
    for (const e of game.entities) {
      if (e !== this && e.solid && !e.dead
        && Math.abs(e.x - nx) < 12 && Math.abs(e.y - ny) < 12) return false;
    }
    this.slide = { fx: sp(nx), fy: sp(ny), dx, dy };
    game.audio.sfx('push');
    return true;
  }

  update(game) {
    if (!this.slide) return;
    const step = BLOCK_SLIDE_SPEED;   // Seasons' half a pixel a frame
    this.fx += Math.sign(this.slide.fx - this.fx) * step;
    this.fy += Math.sign(this.slide.fy - this.fy) * step;
    if (this.fx === this.slide.fx && this.fy === this.slide.fy) {
      this.slide = null;
      this.moved = true;
      // Pushed onto a hole, it goes down it (pushblock.s: on arriving,
      // objectReplaceWithAnimationIfOnHazard), and comes back with the room.
      if (overHole(game, this)) { dropIntoHole(game, this); return; }
      game.onBlockLanded(this);
    }
  }
}
defineEntity('block', (x, y, o) => new PushBlock(x, y, o));

export class FloorSwitch extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.w = 16; this.h = 16;
    this.hb = { x: 2, y: 2, w: 12, h: 12 };
    this.harmless = true;
    this.shadow = false;
    this.pal = null;
    this.pressed = false;
    this.hold = o.hold !== false;       // false = stays down once pressed
    this.group = o.group || 'default';
    this.depth = -8;
    // NOTHING MAY BE GROWN ON A PLATE. `REEFSEED_PLANT_BLOCK` carries
    // `F.SWITCHF` and the note in dungeons-b.js says that is what stops a
    // stray seed sealing a switch room — but a floor switch is an ENTITY, the
    // one tile that carries F.SWITCHF is named by no legend, and
    // `Reefseed.canPlant` only refuses entities that are solid, interactive or
    // pushable. A plate is none of those, so the guard has never fired: a seed
    // landed on a switch, the pillar came up, and `bloom` SHOVED THE PLATE OFF
    // ITS OWN TILE on the way. It came back on the next room entry, which is
    // the only reason this was a nuisance rather than a dead save.
    this.noPlant = !o.stake;
    // A PLATE THAT TAKES A STAKE (S186, the Drowned Wood Shrine): a coral
    // pillar grown on it holds it down for as long as the pillar stands —
    // which, for a stake dropped from the Canopy, is for good. Only such a
    // plate lets a seed grow on it; every other plate keeps `noPlant`.
    this.stake = !!o.stake;
  }

  /**
   * A PLATE UNDER DEEP WATER IS ON THE BOTTOM (S143). A swimmer floats over it
   * and a swimming thing never reaches it; only a body walking the seafloor —
   * the Cleats' floor mode — or something heavy resting on it presses it. The
   * level asked is the one at the plate's own tile, through the field.
   */
  sunk(game) {
    const room = game.room;
    if (!room) return false;
    const tx = Math.floor(this.cx / TILE), ty = Math.floor(this.cy / TILE);
    return !!(room.flagsAt(tx, ty, game.tide) & F.DEEP);
  }

  update(game) {
    let on = false;
    const sunk = this.sunk(game);
    const p = game.player;
    if (p && this.overlaps(p) && p.z <= 4 && (!sunk || p.underwater)) on = true;
    for (const e of game.entities) {
      if (e === this || e.isEffect || e.isDrop) continue;
      if (sunk && e.isEnemy) continue;
      // A chunk afloat over a drowned plate is on the surface, not on it.
      if (e.floating) continue;
      // A stake plate is the Canopy's: nothing that wanders onto it counts.
      if (this.stake && e.isEnemy) continue;
      // A FLIER IS NOT ON THE FLOOR (S190): a keese crossing the Crossed
      // Shafts' far nook held its plate for the frames it was over it, and
      // with a chunk on the other one that was enough to raise the Boss Key.
      if (e.isEnemy && e.flying) continue;
      if ((e.solid || e.isEnemy) && this.overlaps(e)) { on = true; break; }
    }
    if (!this.hold && this.pressed) on = true;
    if (this.stake && game.room && game.room.baseName(Math.floor(this.cx / TILE), Math.floor(this.cy / TILE)) === 'coralPillar') on = true;
    if (on !== this.pressed) {
      this.pressed = on;
      game.audio.sfx(on ? 'switchOn' : 'switchOff');
      game.onSwitchChanged(this);
    }
  }

  spriteName(game) { return themed(this.pressed ? 'o_switch_down' : 'o_switch_up', game); }
}
defineEntity('switch', (x, y, o) => new FloorSwitch(x, y, o));

export class Torch extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.w = 16; this.h = 16;
    this.hb = { x: 4, y: 6, w: 8, h: 9 };
    this.solid = true;
    this.harmless = true;
    this.shadow = false;
    this.pal = null;
    this.lit = !!o.lit;
    this.group = o.group || 'default';
    this.flammable = true;
    // A TORCH THAT BURNS OUT (S206): Seasons' PART_LIGHTABLE_TORCH subid 1,
    // lit for TORCH_BURN_FRAMES and then dark again. `burn: true` in the
    // room data; `left` counts down while it burns. A solved room's torches
    // stop counting (Game.checkPuzzle sets `burn` false).
    this.burn = !!o.burn;
    this.left = 0;
  }
  /**
   * THE SEA PUTS A TORCH OUT (S206). Standing on a tide tile, a torch is
   * dark while the water is over its foot, shallow or deep, and cannot be
   * lit there; the sea going out again does not light it. Asked of the tile
   * under the torch's middle at the level there (`tideAt`), so an Anchor
   * holding a pool low keeps its torch burning while the room's sea rises.
   */
  drowned(game) {
    const room = game.room;
    if (!room) return false;
    const tx = Math.floor(this.cx / TILE), ty = Math.floor(this.cy / TILE);
    if (!room.inBounds(tx, ty)) return false;
    return !!(room.flagsAt(tx, ty, tideAt(game, this)) & (F.WATER | F.DEEP));
  }
  ignite(game) {
    if (this.lit || this.drowned(game)) return false;
    this.lit = true;
    this.left = TORCH_BURN_FRAMES;
    game.audio.sfx('fire');
    game.onTorchLit(this);
    return true;
  }
  /** Gone dark: burnt out, or the sea reached it. */
  douse(game, wet) {
    this.lit = false;
    if (wet) {
      game.spawnEffect('splash', this.x, this.y - 4);
      game.audio.sfx('splash');
    }
  }
  spriteName() {
    if (!this.lit) return 'o_torch';
    return 'o_torch_lit' + (Math.floor(this.frame / TORCH_FLAME_FRAMES) % TORCH_FLAME_COUNT);
  }
  update(game) {
    this.frame++;
    if (!this.lit) return;
    if (this.drowned(game)) { this.douse(game, true); return; }
    if (this.burn && --this.left <= 0) this.douse(game, false);
  }
}
defineEntity('torch', (x, y, o) => new Torch(x, y, o));

// A KEY FROM ABOVE (S206, Seasons' Explorer's Crypt: explorersCryptScript_
// dropKeyDownAFloor). A puzzle's key drops from the ceiling onto a drop hole
// and goes on down: it is spawned in the room beneath, at the same cell, by
// that room's own entity (`needFlag` on the puzzle's flag), and this is only
// its picture on the way. Down an open hole it goes as Seasons sends a thing
// down one (INTERAC_FALLDOWNHOLE); into a flooded shaft it sinks with a
// splash, as Link does when he sinks with the Cleats. Nothing here can be
// picked up. A room reward `fallKey: [tx, ty]` spawns one
// (Game.applyReward); tools/check-keydrop.mjs proves every one.
export class FallingKey extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.w = 16; this.h = 16;
    this.hb = { x: 3, y: 4, w: 10, h: 10 };
    this.sprite = 'p_key';
    this.pal = null;
    this.harmless = true;
    this.shadow = true;
    this.t = 0;
    this.h0 = o.height || 96;
  }
  update(game) {
    this.t++;
    this.z = Math.round(this.h0 * Math.max(0, 1 - this.t / KEY_FALL_FRAMES));
    if (this.t < KEY_FALL_FRAMES) return;
    const room = game.room;
    const tx = Math.floor(this.cx / TILE), ty = Math.floor(this.cy / TILE);
    const f = room && room.inBounds(tx, ty) ? room.flagsAt(tx, ty, game.tide) : 0;
    if (f & F.PIT) { dropIntoHole(game, this); return; }
    this.remove = true;
    game.spawnEffect('splash', this.x, this.y - 4);
    game.audio.sfx('splash');
  }
}
defineEntity('fallingKey', (x, y, o) => new FallingKey(x, y, o));

// THE LIGHTHOUSE LAMP (S200): Seasons' own torch on the lamp-room floor, and
// a torch in every way but two. It takes fire only once the keeper has all
// three of its parts back (`ready`, a flag his errand sets), so a Kilnshell
// set beside it before then does nothing; and lighting it is for good — it
// sets `flag`, which the Drowned Shore reads for the beam and the cove, and
// which lights it again whenever the room is entered.
export class Lamp extends Torch {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.ready = o.ready || 'lampReady';
    this.litFlag = o.flag || 'lighthouseLit';
    this.litLine = o.dialogue || null;
    this.flammable = false;
  }
  update(game) {
    this.frame++;
    const p = game.progress;
    if (flag(p, this.litFlag)) this.lit = true;
    this.flammable = !this.lit && flag(p, this.ready);
  }
  ignite(game) {
    if (!super.ignite(game)) return false;
    setFlag(game.progress, this.litFlag);
    game.audio.jingle('secret');
    if (this.litLine) game.startDialogue(this.litLine);
    return true;
  }
}
defineEntity('lamp', (x, y, o) => new Lamp(x, y, o));

// THE LIGHTHOUSE BEAM (S200): placed on the tower's lamp-room cell and drawn
// only once `flag` (lighthouseLit) is set. Seen from the side, a turning lamp
// throws its beam out to one side, swings it round through the glass, where
// the glass flashes white, and out to the other. The beam is a CHECKERED
// wedge of lamplight rather than a solid one: the Game Boy had no
// transparency, and a checker over the ground is how its games drew light
// lying on something. It touches nothing; it is `perched` in the lamp room,
// so check-placement does not ask it to stand on the tower.
const BEAM_LIGHT = '#f8f0b0';
export class Beam extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.flag = o.flag || 'lighthouseLit';
    this.harmless = true; this.shadow = false; this.perched = true;
    this.grounded = false; this.flying = true;
    this.hb = { x: 0, y: 0, w: 0, h: 0 };
    this.depth = 40;
    // The middle of the lamp glass, from the block's top-left cell.
    this.ox = o.ox != null ? o.ox : 16; this.oy = o.oy != null ? o.oy : 18;
    this.reach = o.reach || 128;
    this.on = false;
  }
  update(game) {
    this.frame++;
    this.on = flag(game.progress, this.flag);
  }
  draw(ctx, game, ox, oy) {
    if (!this.on) return;
    const a = (this.frame % LIGHTHOUSE_TURN_FRAMES) / LIGHTHOUSE_TURN_FRAMES * Math.PI * 2;
    const s = Math.sin(a), c = Math.cos(a);
    const sx = ox + this.x + this.ox, sy = oy + this.y + this.oy;
    ctx.fillStyle = BEAM_LIGHT;
    // Facing the viewer, the whole glass flares.
    if (c > 0.92) ctx.fillRect(sx - 6, sy - 5, 13, 11);
    const len = Math.round(this.reach * Math.abs(s));
    const dir = s >= 0 ? 1 : -1;
    for (let i = 4; i < len; i++) {
      const half = 1 + Math.floor(i / 10);
      const px = sx + dir * i;
      for (let dy = -half; dy <= half; dy++) {
        const py = sy + dy;
        if (((px + py) & 1) === 0) ctx.fillRect(px, py, 1, 1);
      }
    }
  }
}
defineEntity('beam', (x, y, o) => new Beam(x, y, o));

// --------------------------------------------------------------------------
// Essence: the dungeon reward
// --------------------------------------------------------------------------

export class Essence extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.w = 16; this.h = 16;
    this.hb = { x: 3, y: 3, w: 10, h: 10 };
    this.harmless = true;
    this.shadow = false;
    this.index = o.index || 1;
    // EACH ESSENCE WEARS ITS OWN DUNGEON'S COLOUR. All six used to share the
    // one `essence` palette, which — with all six also sharing one silhouette —
    // made the quest screen six copies of the same object. See gfx/palettes.js.
    // Set after `index`, which is why this line moved below it.
    this.pal = 'essence' + this.index;
    this.taken = false;
    this.depth = 10;
  }
  update(game) {
    this.frame++;
    if (this.frame % ESSENCE_SPARKLE_EVERY === 0) {
      const s = ESSENCE_SPARKLE_SPREAD / 2;
      game.spawnEffect('sparkle',
        this.x + game.rng.range(-s, s), this.y + game.rng.range(-s, s), { life: 16 });
    }
    if (!this.taken && game.player && this.overlaps(game.player)) {
      this.taken = true;
      this.remove = true;
      game.claimEssence(this.index);
    }
  }
  // Its OWN bell, not the one bell. `index` is the dungeon's essence number
  // and it is already here — it is what `claimEssence` is called with.
  spriteName() { return 'p_essence' + this.index + '_' + (Math.floor(this.frame / 8) % 2); }
  draw(ctx, game, ox, oy) {
    const bob = Math.round(Math.sin(this.frame * 0.07) * 2);
    sprites.draw(ctx, this.spriteName(), ox + this.x, oy + this.y + bob, { pal: this.pal });
  }
}
defineEntity('essence', (x, y, o) => new Essence(x, y, o));

// --------------------------------------------------------------------------
// Raft: floats up with the tide to reach high ledges
// --------------------------------------------------------------------------

export class Raft extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.w = 32; this.h = 16;
    this.hb = { x: 0, y: 0, w: 32, h: 16 };
    // IT FLOATS. The raft moves by writing its own accumulators and never asks
    // `canOccupy`, so this changes nothing about how it sails — but `canOccupy`
    // is what anything ELSE asks about it (tools/check-placement.mjs, and any
    // future verb that wants to know whether the raft is somewhere legal), and
    // without it the one raft in the game reads as parked inside deep water.
    this.swimming = true;
    this.sprite = 'o_raft';
    this.pal = 'wood';
    this.harmless = true;
    this.shadow = false;
    this.depth = -9;
    // A RAFT FLOATS, and until this line nothing in the engine knew it. It
    // moves by writing its own `fx`/`fy` rather than through `moveEntity`, so
    // it worked — but anything that asks `canOccupy` where a raft is gets told
    // a raft cannot be there, which is how a raft sitting on the only deep
    // water it is for came out of check-placement.mjs as misplaced.
    this.caps = { jumping: false, swim: true, cutting: false };
    this.axis = o.axis || 'x';
    this.range = o.range || 48;
    this.speed = o.speed || 0.5;
    this.homeX = x; this.homeY = y;
    this.needTide = o.needTide != null ? o.needTide : 2;
    this.carrying = false;
    this.drift = 0;              // subpixels of gust-driven travel this frame
  }

  /**
   * A raft under the Squall Bellows travels where it is blown, carrying
   * whoever is aboard. It is heavier than an enemy, so it moves at a fraction
   * of the gust — the difference has to be legible or the item reads as a
   * generic push.
   */
  onGust(game, dx, dy) {
    const step = Math.round(BELLOWS_PUSH * BELLOWS_RAFT_SCALE);
    this.gustX = dx * step; this.gustY = dy * step;
    this.gusted = 2;
  }

  update(game) {
    this.frame++;
    // The water under the RAFT, not the room's base: an anchor holding this
    // corner at HIGH floats it while the rest of the room is dry.
    const active = tideAt(game, this) >= this.needTide;
    if (!active) return;
    if (this.gusted > 0) {
      // A gusted raft ignores its patrol for as long as the wind holds it, and
      // carries its passenger by the same subpixel delta the patrol uses.
      this.gusted--;
      const p0 = game.player;
      const aboard = p0 && p0.z <= 2 && p0.cx > this.x && p0.cx < this.x + this.w
        && p0.cy > this.y - 2 && p0.cy < this.y + this.h + 4;
      this.fx += this.gustX; this.fy += this.gustY;
      if (aboard) { p0.fx += this.gustX; p0.fy += this.gustY; p0.lastSafe.x = p0.x; p0.lastSafe.y = p0.y; }
      this.homeX = this.x; this.homeY = this.y;
      this.frame = 0;
      return;
    }
    const t = Math.sin(this.frame * this.speed * 0.02);
    const nfx = sp(this.axis === 'x' ? this.homeX + t * this.range : this.homeX);
    const nfy = sp(this.axis === 'y' ? this.homeY + t * this.range : this.homeY);
    const p = game.player;
    const onBoard = p && p.z <= 2 && p.cx > this.x && p.cx < this.x + this.w
      && p.cy > this.y - 2 && p.cy < this.y + this.h + 4;
    // The passenger is carried by the raft's subpixel delta, not its pixel one,
    // or a raft drifting slower than a pixel a frame would leave them behind.
    if (onBoard) {
      p.fx += nfx - this.fx; p.fy += nfy - this.fy;
      p.lastSafe.x = p.x; p.lastSafe.y = p.y;
    }
    this.fx = nfx; this.fy = nfy;
  }

  draw(ctx, game, ox, oy) {
    if (tideAt(game, this) < this.needTide) return;
    sprites.draw(ctx, this.sprite, ox + this.x, oy + this.y, { pal: this.pal });
    sprites.draw(ctx, this.sprite, ox + this.x + 16, oy + this.y, { pal: this.pal, flipX: true });
  }
}
defineEntity('raft', (x, y, o) => new Raft(x, y, o));

// --------------------------------------------------------------------------
// Float: the Cliffside Cistern's moving platform (S183)
// --------------------------------------------------------------------------

/**
 * Oracle of Seasons' INTERAC_MOVING_PLATFORM (movingPlatform.s), at its
 * largest size: a 32x32 slab that walks a little path script over holes and
 * carries Link while he stands on it. The picture, the speed (FLOAT_SPEED,
 * SPEED_80), the point it must be under Link (FLOAT_FOOT_DY), the script's
 * verbs (movingPlatformScriptTable.s: wait, up/right/down/left for so many
 * frames, setspeed, jump back) and the rule that it does not move while Link
 * plays an instrument (@substate1: wLinkPlayingInstrument -> ret nz; the conch
 * is ours) are all the cartridge's.
 *
 * OURS: A FLOAT RUNS ONLY WHILE ITS RACE RUNS. `race: [tx, ty]` names a tile of
 * the room; while the water there carries a current (a tile with `push`, read
 * through the live field) the script advances, and while it does not — LOW, or
 * the Squall Bellows' cone holding it one level down, or a drained tank — the
 * float stops wherever it is, waits and all. A float with no race always runs.
 *
 * `path` is a list of steps: ['wait', f], ['up'|'right'|'down'|'left', f],
 * ['speed', sp], ['loop', i] (jump back to step i). Moves are exact: f frames
 * at the speed, along one axis.
 */
export class Float extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.w = 32; this.h = 32;
    this.hb = { x: 0, y: 0, w: 32, h: 32 };
    this.sprite = 'o_float0';
    this.isFloat = true;
    this.harmless = true;
    this.shadow = false;
    this.depth = -9;
    this.caps = { jumping: true, swim: true, cutting: false };
    this.path = o.path || [];
    this.race = o.race || null;
    this.speed = FLOAT_SPEED;
    this.step = 0;
    this.left = 0;              // frames left in the current step
    this.dir = null;            // [dx, dy] while moving
    this.moved = false;         // did it move this frame (for a passenger)
    this.next();
  }

  /** Load the next step of the script, following speed and loop steps. */
  next() {
    for (let guard = 0; guard < 64 && this.path.length; guard++) {
      if (this.step >= this.path.length) this.step = 0;
      const [op, arg] = this.path[this.step++];
      if (op === 'speed') { this.speed = arg; continue; }
      if (op === 'loop') { this.step = arg; continue; }
      this.left = arg;
      this.dir = op === 'wait' ? null : FLOAT_DIRS[op];
      return;
    }
    this.left = 0; this.dir = null;
  }

  /** Is the water at its race running? */
  driven(game) {
    if (!this.race || !game.room) return true;
    return !!game.room.tile(this.race[0], this.race[1], game.tide).push;
  }

  /** Is this point (Link's feet, per the cartridge) on the float? */
  under(px, py) {
    return px >= this.x && px < this.x + this.w && py >= this.y && py < this.y + this.h;
  }

  /** Is the player standing on it? */
  carries(p) {
    return !!p && !p.dead && p.z <= 2 && !p.jumping && this.under(p.cx, p.cy + FLOAT_FOOT_DY);
  }

  update(game) {
    this.frame++;
    if (!this.driven(game)) return;
    if (this.left <= 0) this.next();
    if (!this.dir) { this.left--; return; }
    const p = game.player;
    if (p && p.conchTime > 0) return;
    const dx = this.dir[0] * this.speed, dy = this.dir[1] * this.speed;
    if (this.carries(p)) { p.fx += dx; p.fy += dy; }
    this.fx += dx; this.fy += dy;
    this.left--;
  }

  draw(ctx, game, ox, oy) {
    sprites.draw(ctx, this.sprite, ox + this.x, oy + this.y);
  }
}
defineEntity('float', (x, y, o) => new Float(x, y, o));


// --------------------------------------------------------------------------
// Tide valve: a dungeon fixture that unlocks or pins the tide
// --------------------------------------------------------------------------

export class TideValve extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.w = 16; this.h = 16;
    this.hb = { x: 1, y: 2, w: 14, h: 13 };
    this.solid = true;
    this.harmless = true;
    this.shadow = false;
    this.pal = 'rust';
    this.open = !!o.open;
    this.saveKey = o.saveKey || null;
    // What it says when it opens: a wheel on the Wind Loft (S184) opens a
    // gate a floor below, and says so.
    this.openSay = o.say || 'The sluice grinds open. Water can move again.';
    // A flag of the dungeon's own that opening it sets as well (S184): the
    // Wind Loft's wheels set the gates of the tanks below (`d4GateW` ...),
    // which `Tide.resolve` and the gate tiles read. `saveKey` is the entity's
    // own and is assigned by the room, so it cannot carry a name.
    this.sets = o.sets || null;
  }
  interact(game) {
    this.open = !this.open;
    if (this.saveKey) game.progress.flags[this.saveKey] = this.open;
    if (this.sets) game.progress.flags[this.sets] = this.open;
    game.audio.sfx('valve');
    game.say(this.open ? this.openSay : 'The sluice slams shut.');
    game.onValveToggled(this);
  }
  /**
   * A valve you already threw was shut again when you came back: `interact`
   * wrote the flag and nothing ever read it — the exact bug `GustWheel.update`
   * below was fixed for. Here it costs more than a wrong sprite. In a
   * `tideForce` room the water LEVEL is the actual effect, nothing else
   * records it, and `Tide.applyRoomRules` re-pins the room to its forced
   * level on every entry — unconditionally, by design, so a Bottled Tide can
   * still mean something in one. So a fork whose valve had already been
   * thrown reset to a level its own shaft cannot be safely crossed at, with
   * the valve that would fix it again on the far side of the very hazard
   * blocking the way there. Restoring the boolean AND re-throwing the tide
   * step once, the first update after a fresh room load, is what makes the
   * valve mean what its own sprite already claims to.
   *
   * Scoped to `tideForce` rooms only — the other rooms this entity type
   * appears in gate a door through `openDoors`, which is a persisted door
   * state already surviving re-entry on its own; stepping the GLOBAL tide
   * there on every return visit would be a surprising side effect nothing
   * asked for.
   */
  update(game) {
    if (this._restored) return;
    this._restored = true;
    if (!this.open && this.saveKey && game.progress.flags[this.saveKey]) {
      this.open = true;
      const room = game.room;
      if (room && room.def && room.def.tideForce != null) game.forceTideStep();
    }
  }
  spriteName() { return this.open ? 'o_valve_open' : 'o_valve'; }
}
defineEntity('valve', (x, y, o) => new TideValve(x, y, o));

// --------------------------------------------------------------------------
// Gust wheel: a sluice wheel too far to reach, turned by the Squall Bellows
// --------------------------------------------------------------------------

/**
 * A wheel spun by wind rather than by hand. `needTurns` gusts open it; it
 * coasts for a moment after the gust stops and then holds where it is, so a
 * wheel is a thing you have to keep blowing at rather than a thing you tap.
 *
 * It opens exactly what a TideValve opens, and for the same reason: the
 * interesting placement for a wheel is on the far side of the water it
 * controls, where a hand cannot reach it and a sustained directional gust can.
 *
 * A DROWNED WHEEL DOES NOT TURN, and that one line is the whole of the
 * Cliffside Cistern. Paddles under deep water never see the wind — the gust
 * breaks on the surface above them — so a wheel standing in water that is over
 * its axle is a wheel nothing can move. What frees it is the gust's OTHER
 * half: the cone holds the water inside it one level lower than the rest of
 * the room, so the same held breath that turns the wheel is what takes the
 * water off it. The level asked for is the level AT THE WHEEL'S OWN TILE
 * (`room.flagsAt` through the live field), never `tide.level`, because the
 * cone is precisely a place where those two disagree.
 */
export class GustWheel extends TideValve {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.needTurns = o.needTurns || 40;
    this.turns = 0;
    this.coast = 0;
    this.spin = 0;
    this.stalled = 0;             // frames spent taking wind while under water
    this._restored = false;
  }

  /** Is the water over this wheel deep enough to smother it? */
  drowned(game) {
    const room = game.room;
    if (!room) return false;
    const tx = Math.floor(this.cx / TILE), ty = Math.floor(this.cy / TILE);
    return !!(room.flagsAt(tx, ty, game.tide) & F.DEEP);
  }

  /** Called by Player.gust for every entity inside the cone. */
  onGust(game) {
    if (this.open) return;
    if (this.drowned(game)) {
      // Losing the progress rather than pausing it matters: a wheel that
      // remembered half a turn could be opened by pumping at it under water
      // for long enough, which is the exact reading the room is built to deny.
      this.turns = 0;
      this.stalled++;
      if (this.stalled % 10 === 1) game.spawnEffect('bubble', this.x, this.y - 4, { life: 20 });
      return;
    }
    this.stalled = 0;
    this.turns++;
    this.coast = BELLOWS_WHEEL_COAST;
    if (this.turns >= this.needTurns) {
      this.turns = 0;
      this.interact(game);
    }
  }

  update(game) {
    // A wheel you turned and walked away from was shut again when you came
    // back: `interact` wrote the flag and nothing ever read it. The door it
    // opened stayed open (that is a persisted tile), so the room was solved
    // and the fixture in it was lying about how.
    if (!this._restored) {
      this._restored = true;
      if (this.saveKey && game.progress.flags[this.saveKey]) this.open = true;
    }
    if (this.coast > 0) { this.coast--; this.spin++; }
  }

  /** Nothing reaches this by hand — that is the point of putting it here. */
  interactByHand(game) { game.say('The wheel is too far to reach. Something must blow it.'); }

  /** Turning while the wind is on it, so a wheel that moves looks it. */
  spriteName() {
    if (this.open) return 'o_valve_open';
    if (this.coast > 0 && Math.floor(this.spin / WHEEL_SPIN_BEAT) % 2) return 'o_valve_turn';
    return 'o_valve';
  }

  /**
   * A DROWNED WHEEL IS DRAWN UNDER THE WATER. Same picture, in the water's
   * own `deep` blues: its body takes the water's colour and only the dark
   * rim and slot show through, the way a thing on the bottom reads through
   * the surface. It is the answer to "my cone is not reaching" versus "the
   * water is still too deep here" (docs/ART-BACKLOG.md), read off the same
   * `drowned` test the gust itself asks, so the picture cannot disagree
   * with what the wheel will do.
   */
  draw(ctx, game, ox, oy) {
    const dry = this.pal;
    if (this.drowned(game)) this.pal = 'deep';
    super.draw(ctx, game, ox, oy);
    this.pal = dry;
  }
}
defineEntity('wheel', (x, y, o) => new GustWheel(x, y, o));

// --------------------------------------------------------------------------
// Sunken bell: answers the Resonance Rod, and points
// --------------------------------------------------------------------------

/**
 * A bell on the bottom. It does nothing at all until the Resonance Rod is
 * sounded in earshot, and then it chimes and throws sparks toward whatever it
 * is tuned to — `points: [tx, ty]`, in tiles.
 *
 * This is the Rod's navigation verb, and it is deliberately the weakest kind
 * of help: it tells you a DIRECTION and never a distance, so it narrows a
 * search without finishing it.
 */
export class SunkenBell extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.w = 16; this.h = 16;
    this.hb = { x: 2, y: 3, w: 12, h: 12 };
    this.solid = true;
    this.harmless = true;
    this.shadow = false;
    this.pal = 'rust';
    this.points = o.points || null;
    this.say = o.say || 'The bell hums, and something answers.';
    this.chime = 0;
  }

  /** Called by ringResonance for every entity in earshot. */
  onRing(game) {
    this.chime = BELL_CHIME_FRAMES;
    game.audio.sfx('chime');
    if (!this.points) { game.say(this.say); return; }
    const tx = this.points[0] * TILE + 8, ty = this.points[1] * TILE + 8;
    const dx = tx - this.cx, dy = ty - this.cy;
    const d = Math.hypot(dx, dy) || 1;
    for (let i = 1; i <= 4; i++) {
      game.spawnEffect('sparkle',
        this.cx - 8 + (dx / d) * i * 10, this.cy - 8 + (dy / d) * i * 10,
        { life: BELL_CHIME_FRAMES, pal: 'gold' });
    }
  }

  update() { if (this.chime > 0) this.chime--; }

  interact(game) { game.say('A bell, green with salt. Nothing you can reach will move it.'); }

  spriteName() { return this.chime > 0 ? 'o_valve_open' : 'o_valve'; }
}
defineEntity('bell', (x, y, o) => new SunkenBell(x, y, o));
