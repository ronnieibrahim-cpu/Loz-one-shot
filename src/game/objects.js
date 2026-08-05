// World objects: pickups, chests, NPCs, signs, pushable blocks, switches,
// torches, rafts, essences. All are spawnable from room data via entity tuples.

import { Entity, defineEntity, moveEntity, canOccupy, groundFlags, DIR_VEC } from './entity.js';
import { F } from '../world/tileset.js';
import { TILE } from '../core/screen.js';
import { sprites } from '../gfx/art.js';
import { drawText } from '../gfx/font.js';
import {
  addRupees, heal, addBombs, addSeeds, addKey, giveItem, addHeartContainer,
  addHeartPiece, HEART_UNITS, setFlag, flag,
} from './progress.js';
import { itemName, itemIcon, ITEMS } from './items.js';

// --------------------------------------------------------------------------
// Pickups
// --------------------------------------------------------------------------

export const PICKUPS = {
  rupee1: { sprite: 'p_rupee', pal: 'rupee', get(g) { addRupees(g.progress, 1); g.audio.sfx('rupee'); } },
  rupee5: { sprite: 'p_rupee5', pal: 'enemyr', get(g) { addRupees(g.progress, 5); g.audio.sfx('rupee'); } },
  rupee20: { sprite: 'p_rupee20', pal: 'enemyp', get(g) { addRupees(g.progress, 20); g.audio.sfx('rupeeBig'); } },
  rupee100: { sprite: 'p_rupee20', pal: 'gold', get(g) { addRupees(g.progress, 100); g.audio.sfx('rupeeBig'); } },
  heart: { sprite: 'p_heart', pal: 'heart', get(g) { heal(g.progress, HEART_UNITS); g.audio.sfx('heart'); } },
  fairy: {
    sprite: 'p_fairy', pal: 'magic', float: true,
    get(g) { heal(g.progress, HEART_UNITS * 6); g.audio.sfx('fairy'); },
  },
  bomb4: { sprite: 'p_bombs', pal: 'bomb', get(g) { addBombs(g.progress, 4); g.audio.sfx('rupee'); } },
  seeds5: {
    sprite: 'p_seeds', pal: 'tree',
    get(g) { addSeeds(g.progress, g.progress.seedSelected || 'ember', 5); g.audio.sfx('rupee'); },
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
  compass: {
    sprite: 'i_compass', pal: 'ui', persistent: true,
    get(g) { g.progress.compasses[g.mapId] = true; g.audio.sfx('key'); g.say('You found the Compass!'); },
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
  heartContainer: {
    sprite: 'p_heartcontainer', pal: 'heart', persistent: true,
    get(g) { addHeartContainer(g.progress); g.audio.jingle('fanfare'); g.say('You got a Heart Container!'); },
  },
};

export const DROP_TABLES = {
  none: [],
  common: [[40, null], [26, 'rupee1'], [16, 'heart'], [10, 'rupee5'], [8, 'bomb4']],
  good: [[16, null], [24, 'rupee5'], [26, 'heart'], [20, 'rupee1'], [14, 'bomb4']],
  rich: [[10, null], [30, 'rupee20'], [30, 'heart'], [20, 'rupee5'], [10, 'fairy']],
  hearts: [[30, null], [70, 'heart']],
};

export function rollDropTable(name) {
  const t = DROP_TABLES[name] || DROP_TABLES.none;
  let total = 0;
  for (const [w] of t) total += w;
  let r = Math.random() * total;
  for (const [w, item] of t) { r -= w; if (r <= 0) return item; }
  return null;
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
    this.life = spec.persistent ? Infinity : (o.life || 460);
    this.vy = o.vy != null ? o.vy : -1.2;
    this.z = 0;
    this.settle = 12;
    this.grabDelay = o.grabDelay != null ? o.grabDelay : 8;
    this.saveKey = o.saveKey || null;
    this.depth = -2;
  }

  update(game) {
    this.frame++;
    if (this.attached) return;
    if (this.settle > 0) {
      this.settle--;
      this.y += this.vy;
      this.vy += 0.16;
    }
    if (this.spec.float) {
      // Fairies drift about.
      if (this._fa == null) this._fa = Math.random() * 6.28;
      this._fa += 0.06;
      moveEntity(game, this, Math.cos(this._fa) * 0.7, Math.sin(this._fa * 1.3) * 0.6);
    }
    if (this.grabDelay > 0) this.grabDelay--;
    if (this.life !== Infinity && --this.life <= 0) { this.remove = true; return; }
    if (this.grabDelay <= 0 && game.player && this.overlaps(game.player)) this.collect(game);
  }

  collect(game) {
    this.remove = true;
    if (this.saveKey) game.progress.secrets[this.saveKey] = true;
    this.spec.get(game);
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
      if (this.frame % 90 === 0) this._wdir = ['up', 'down', 'left', 'right', null][(Math.random() * 5) | 0];
      if (this._wdir) {
        const [dx, dy] = DIR_VEC[this._wdir];
        const r = moveEntity(game, this, dx * 0.3, dy * 0.3);
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
//   ['shopItem', 7, 3, { ring: 'power', price: 80 }]
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
    this.ring = o.ring || null;
    this.label = o.name || null;
    this.saveKey = o.saveKey || null;
    this.once = o.once !== false;      // most stock is one-per-save
    this.sold = false;
    this.depth = -3;
  }

  get displayName() {
    if (this.label) return this.label;
    if (this.item) return itemName(this.item, this.level);
    if (this.ring) return 'a magic ring';
    return 'something';
  }

  get icon() {
    if (this.item) return itemIcon(this.item, this.level);
    if (this.ring) return 'i_ring';
    return (PICKUPS[this.pickup] || PICKUPS.rupee1).sprite;
  }

  interact(game) {
    if (this.sold) { game.say('Sold out, sorry.'); return; }
    const p = game.progress;
    if (p.rupees < this.price) {
      game.audio.sfx('deny');
      game.say(`${this.displayName} — ${this.price} Rupees.\nYou cannot afford it.`);
      return;
    }
    game.ask(`${this.displayName} — ${this.price} Rupees.\nBuy it?`, ['Yes', 'No'], (pick) => {
      if (pick !== 0) return;
      addRupees(p, -this.price);
      game.audio.sfx('rupee');
      if (this.item) {
        giveItem(p, this.item, this.level);
        game.autoEquip(this.item);
        if (this.item === 'bombs' && !p.maxBombs) { p.maxBombs = 10; addBombs(p, 10); }
        game.presentItem(this.item, this.level);
      } else if (this.ring) {
        p.rings[this.ring] = true;
        game.audio.jingle('fanfareShort');
        game.say('You got a magic ring! Check the Quest screen.');
      } else if (this.pickup) {
        (PICKUPS[this.pickup] || PICKUPS.rupee1).get(game);
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
    drawText(ctx, String(this.price), ox + this.x + 2, oy + this.y + 15, '#f8f8e8', '#181c18');
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
    this.ring = o.ring || null;
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
        if (this.item === 'satchel' && !p.maxSeeds) {
          p.maxSeeds = 20; addSeeds(p, 'ember', 20); p.seedSelected = 'ember';
        }
        if (this.item === 'bombs' && !p.maxBombs) { p.maxBombs = 10; addBombs(p, 10); }
        game.presentItem(this.item, this.level);
      } else if (this.ring) {
        p.rings[this.ring] = true;
        game.audio.jingle('fanfareShort');
        game.say('You got a magic ring!');
      } else if (this.pickup) {
        (PICKUPS[this.pickup] || PICKUPS.rupee1).get(game);
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
    this.slide = { tx: nx, ty: ny, dx, dy };
    game.audio.sfx('push');
    return true;
  }

  update(game) {
    if (!this.slide) return;
    const sp = 1;
    this.x += Math.sign(this.slide.tx - this.x) * sp;
    this.y += Math.sign(this.slide.ty - this.y) * sp;
    if (Math.abs(this.x - this.slide.tx) < 1 && Math.abs(this.y - this.slide.ty) < 1) {
      this.x = this.slide.tx; this.y = this.slide.ty;
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
    if (this.frame % 10 === 0) {
      game.spawnEffect('sparkle', this.x + (Math.random() * 10 - 5), this.y + (Math.random() * 10 - 5), { life: 16 });
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
  }

  update(game) {
    this.frame++;
    const active = game.tide.level >= this.needTide;
    if (!active) return;
    const t = Math.sin(this.frame * this.speed * 0.02);
    const nx = this.axis === 'x' ? this.homeX + t * this.range : this.homeX;
    const ny = this.axis === 'y' ? this.homeY + t * this.range : this.homeY;
    const p = game.player;
    const onBoard = p && p.z <= 2 && p.cx > this.x && p.cx < this.x + this.w
      && p.cy > this.y - 2 && p.cy < this.y + this.h + 4;
    if (onBoard) { p.x += nx - this.x; p.y += ny - this.y; p.lastSafe.x = p.x; p.lastSafe.y = p.y; }
    this.x = nx; this.y = ny;
  }

  draw(ctx, game, ox, oy) {
    if (game.tide.level < this.needTide) return;
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
