// World objects: pickups, chests, NPCs, signs, pushable blocks, switches,
// torches, rafts, essences. All are spawnable from room data via entity tuples.

import { Entity, defineEntity, moveEntity, canOccupy, groundFlags, tideAt, DIR_VEC } from './entity.js';
import { F } from '../world/tileset.js';
import { TILE } from '../core/screen.js';
import { FP_ONE, sp } from '../core/fixed.js';
import { sprites } from '../gfx/art.js';
import { drawText } from '../gfx/font.js';
import {
  addRupees, heal, addBombs, addReefseeds, addBottles, addKey, giveItem, addHeartContainer,
  addHeartPiece, HEART_UNITS, setFlag, flag,
} from './progress.js';
import { itemName, itemIcon, ITEMS } from './items.js';
import { CHARMS, giveCharm } from './scrimshaw.js';
import {
  PICKUP_LIFE_FRAMES, PICKUP_POP_SPEED, PICKUP_GRAVITY, PICKUP_SETTLE_FRAMES,
  PICKUP_GRAB_DELAY, FAIRY_DRIFT_TURN, FAIRY_DRIFT_X, FAIRY_DRIFT_Y,
  NPC_WANDER_PERIOD, NPC_WANDER_SPEED,
  ESSENCE_SPARKLE_EVERY, ESSENCE_SPARKLE_SPREAD,
  BELLOWS_PUSH, BELLOWS_RAFT_SCALE, BELLOWS_WHEEL_COAST, BELL_CHIME_FRAMES,
  CARVE_PRICE, CHARM_CASE_MAX, CHARM_LOW_ESSENCES, CHARM_HIGH_ESSENCES,
  CHARM_CASE_ESSENCES,
} from '../data/feel.js';

// --------------------------------------------------------------------------
// Pickups
// --------------------------------------------------------------------------

/**
 * `worth` is how many rupees the pickup is carrying. It is a FIELD rather than
 * a number baked into `get`, because the Beachcomber doubles what an enemy
 * drops and the doubling has to happen when the drop is rolled — a rupee
 * already lying on the floor was worth what it was worth when it fell.
 */
export const PICKUPS = {
  rupee1: { sprite: 'p_rupee', pal: 'rupee', worth: 1, get(g, e) { addRupees(g.progress, worthOf(e, 1)); g.audio.sfx('rupee'); } },
  rupee5: { sprite: 'p_rupee5', pal: 'enemyr', worth: 5, get(g, e) { addRupees(g.progress, worthOf(e, 5)); g.audio.sfx('rupee'); } },
  rupee20: { sprite: 'p_rupee20', pal: 'enemyp', worth: 20, get(g, e) { addRupees(g.progress, worthOf(e, 20)); g.audio.sfx('rupeeBig'); } },
  rupee100: { sprite: 'p_rupee20', pal: 'gold', worth: 100, get(g, e) { addRupees(g.progress, worthOf(e, 100)); g.audio.sfx('rupeeBig'); } },
  heart: { sprite: 'p_heart', pal: 'heart', get(g) { heal(g.progress, HEART_UNITS); g.audio.sfx('heart'); } },
  fairy: {
    sprite: 'p_fairy', pal: 'magic', float: true,
    get(g) { heal(g.progress, HEART_UNITS * 6); g.audio.sfx('fairy'); },
  },
  bomb4: { sprite: 'p_bombs', pal: 'bomb', get(g) { addBombs(g.progress, 4); g.audio.sfx('rupee'); } },
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
    sprite: 'p_key', pal: 'key', persistent: true,
    get(g) { addKey(g.progress, g.mapId); g.audio.sfx('key'); g.say('You found a Small Key!'); },
  },
  bossKey: {
    sprite: 'p_bosskey', pal: 'gold', persistent: true,
    get(g) { g.progress.bossKeys[g.mapId] = true; g.audio.jingle('fanfareShort'); g.say('You found the Boss Key!'); },
  },
  dungeonMap: {
    sprite: 'i_map', pal: 'ui', persistent: true,
    get(g) { g.progress.dungeonMaps[g.mapId] = true; g.audio.sfx('key'); g.say('You found the Dungeon Map!'); },
  },
  chartstone: {
    sprite: 'i_chart', pal: null, persistent: true,
    get(g) {
      g.progress.charts[g.mapId] = true;
      g.audio.sfx('key');
      g.say('You found the Chartstone!\nThe map will show what the tide moves.');
    },
  },
  heartPiece: {
    sprite: 'p_heartpiece', pal: 'heart', persistent: true,
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
    sprite: 'p_heartcontainer', pal: 'heart', persistent: true,
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
    // `vy` is px/f when a caller names one; the fallback is already sp/f.
    this.vy = o.vy != null ? sp(o.vy) : PICKUP_POP_SPEED;
    this.z = 0;
    this.settle = PICKUP_SETTLE_FRAMES;
    this.grabDelay = o.grabDelay != null ? o.grabDelay : PICKUP_GRAB_DELAY;
    this.saveKey = o.saveKey || null;
    this.depth = -2;
  }

  update(game) {
    this.frame++;
    if (this.attached) return;
    if (this.settle > 0) {
      this.settle--;
      this.fy += this.vy;
      this.vy += PICKUP_GRAVITY;
    }
    if (this.spec.float) {
      // Fairies drift about.
      if (this._fa == null) this._fa = game.rng.angle();
      this._fa += FAIRY_DRIFT_TURN;
      moveEntity(game, this,
        Math.round(Math.cos(this._fa) * FAIRY_DRIFT_X),
        Math.round(Math.sin(this._fa * 1.3) * FAIRY_DRIFT_Y));
    }
    if (this.grabDelay > 0) this.grabDelay--;
    if (this.life !== Infinity && --this.life <= 0) { this.remove = true; return; }
    if (this.grabDelay <= 0 && game.player && this.overlaps(game.player)) this.collect(game);
  }

  collect(game) {
    this.remove = true;
    if (this.saveKey) game.progress.secrets[this.saveKey] = true;
    this.spec.get(game, this);
    game.spawnEffect('sparkle', this.x, this.y, { life: 14 });
  }

  draw(ctx, game, ox, oy) {
    // Blink out as the timer runs down.
    if (this.life !== Infinity && this.life < 90 && (this.life >> 2) % 2 === 0) return;
    const bob = this.spec.persistent ? Math.round(Math.sin(this.frame * 0.08) * 1.5) : 0;
    sprites.draw(ctx, this.sprite, ox + this.x, oy + this.y + bob, { pal: this.pal });
  }
}
defineEntity('pickup', (x, y, o) => new Pickup(x, y, o));

// --------------------------------------------------------------------------
// Chest
// --------------------------------------------------------------------------

export class Chest extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.w = 16; this.h = 16;
    this.hb = { x: 1, y: 4, w: 14, h: 11 };
    this.pal = o.big ? 'gold' : 'chest';
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
  }

  interact(game, player) {
    if (this.opened) { game.say('Empty.'); return; }
    if (this.needsBossKey && !game.progress.bossKeys[game.mapId]) {
      game.say('A great lock. You need the Boss Key.');
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
    this.dialogue = o.dialogue || null;      // dialogue id
    this.dir = o.dir || 'down';
    this.wander = !!o.wander;
    this.rate = o.rate || 22;
    this.faceOnTalk = o.faceOnTalk !== false;
    this.onTalk = o.onTalk || null;
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

  interact(game, player) {
    if (this.faceOnTalk) {
      const dx = player.cx - this.cx, dy = player.cy - this.cy;
      this.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    }
    if (this.onTalk) { if (this.onTalk(game, this, player) === false) return; }
    if (this.dialogue) game.startDialogue(this.dialogue, this);
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

export class Sign extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.w = 16; this.h = 16;
    this.hb = { x: 2, y: 4, w: 12, h: 11 };
    this.sprite = 'o_sign';
    this.pal = 'wood';
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
    this.needEssences = o.needEssences || 0;
    this.needFlag = o.needFlag || null;
    this.giveFlag = o.flag || null;
    this.waitingText = o.waiting || null;
    this.afterText = o.after || null;
  }

  ready(game) {
    const p = game.progress;
    if (p.essences.length < this.needEssences) return false;
    if (this.needFlag && !flag(p, this.needFlag)) return false;
    return true;
  }

  interact(game, player) {
    const p = game.progress;
    if (this.faceOnTalk) {
      const dx = player.cx - this.cx, dy = player.cy - this.cy;
      this.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    }
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
        (PICKUPS[this.pickup] || PICKUPS.rupee1).get(game, null);
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
// The scrimshander: hand over a blank plus rupees, come back a tide later for
// a carved charm.
//
//   ['scrimshander', 1, 2, { sprite: 'npc_elder' }]
//
// She also opens the LOW and HIGH cases, and later widens all three. Those are
// progression, so they are keyed on ESSENCES rather than on rupees — the cases
// open because the story moved, not because you shopped. Each opening is a
// one-shot flag so the line is said once and the state is saved.
// --------------------------------------------------------------------------

export class Scrimshander extends NPC {
  constructor(x, y, o = {}) {
    super(x, y, { sprite: 'npc_elder', ...o });
    this.faceOnTalk = true;
  }

  /** Cases and case size open on essence count. Returns a line, or null. */
  checkUnlocks(game) {
    const p = game.progress;
    if (p.essences.length >= CHARM_LOW_ESSENCES && !p.charmOpen.low) {
      p.charmOpen.low = true;
      return 'I have cut you a second case — for the low water,\nwhen the floor of the sea is a road.';
    }
    if (p.essences.length >= CHARM_HIGH_ESSENCES && !p.charmOpen.high) {
      p.charmOpen.high = true;
      return 'And a third, for the high water. Bone keeps\nbetter wet than you would think.';
    }
    if (p.essences.length >= CHARM_CASE_ESSENCES && p.charmCase < CHARM_CASE_MAX) {
      p.charmCase = CHARM_CASE_MAX;
      return 'Every case takes two now. You have earned\nthe room.';
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
    this.sprite = o.sprite || 'o_block';
    this.pal = o.pal || 'stone';
    this.solid = true;
    this.harmless = true;
    this.shadow = false;
    this.once = o.once !== false;      // most blocks only move once
    this.moved = false;
    this.slide = null;
    this.axis = o.axis || null;        // 'x' | 'y' restriction
  }

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
    const step = FP_ONE;      // one pixel a frame, on the grid
    this.fx += Math.sign(this.slide.fx - this.fx) * step;
    this.fy += Math.sign(this.slide.fy - this.fy) * step;
    if (this.fx === this.slide.fx && this.fy === this.slide.fy) {
      this.slide = null;
      this.moved = true;
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
    this.pal = 'brick';
    this.pressed = false;
    this.hold = o.hold !== false;       // false = stays down once pressed
    this.group = o.group || 'default';
    this.depth = -8;
  }

  update(game) {
    let on = false;
    if (game.player && this.overlaps(game.player) && game.player.z <= 4) on = true;
    for (const e of game.entities) {
      if (e === this || e.isEffect || e.isDrop) continue;
      if ((e.solid || e.isEnemy) && this.overlaps(e)) { on = true; break; }
    }
    if (!this.hold && this.pressed) on = true;
    if (on !== this.pressed) {
      this.pressed = on;
      game.audio.sfx(on ? 'switchOn' : 'switchOff');
      game.onSwitchChanged(this);
    }
  }

  spriteName() { return this.pressed ? 'o_switch_down' : 'o_switch_up'; }
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
    this.pal = 'stone';
    this.lit = !!o.lit;
    this.group = o.group || 'default';
    this.flammable = true;
  }
  ignite(game) {
    if (this.lit) return false;
    this.lit = true;
    game.audio.sfx('fire');
    game.onTorchLit(this);
    return true;
  }
  spriteName() {
    if (!this.lit) return 'o_torch';
    return 'o_torch_lit' + (Math.floor(this.frame / 6) % 2);
  }
  update() { this.frame++; }
}
defineEntity('torch', (x, y, o) => new Torch(x, y, o));

// --------------------------------------------------------------------------
// Essence: the dungeon reward
// --------------------------------------------------------------------------

export class Essence extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.w = 16; this.h = 16;
    this.hb = { x: 3, y: 3, w: 10, h: 10 };
    this.pal = 'essence';
    this.harmless = true;
    this.shadow = false;
    this.index = o.index || 1;
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
  spriteName() { return 'p_essence' + (Math.floor(this.frame / 8) % 2); }
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
    this.sprite = 'o_raft';
    this.pal = 'wood';
    this.harmless = true;
    this.shadow = false;
    this.depth = -9;
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
  }
  interact(game) {
    this.open = !this.open;
    if (this.saveKey) game.progress.flags[this.saveKey] = this.open;
    game.audio.sfx('valve');
    game.say(this.open ? 'The sluice grinds open. Water can move again.' : 'The sluice slams shut.');
    game.onValveToggled(this);
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
 */
export class GustWheel extends TideValve {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.needTurns = o.needTurns || 40;
    this.turns = 0;
    this.coast = 0;
    this.spin = 0;
  }

  /** Called by Player.gust for every entity inside the cone. */
  onGust(game) {
    if (this.open) return;
    this.turns++;
    this.coast = BELLOWS_WHEEL_COAST;
    if (this.turns >= this.needTurns) {
      this.turns = 0;
      this.interact(game);
    }
  }

  update(game) {
    if (this.coast > 0) { this.coast--; this.spin++; }
  }

  /** Nothing reaches this by hand — that is the point of putting it here. */
  interactByHand(game) { game.say('The wheel is too far to reach. Something must blow it.'); }

  spriteName() { return this.open ? 'o_valve_open' : 'o_valve'; }
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
    game.audio.sfx('secret');
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
