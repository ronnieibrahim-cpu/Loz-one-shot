// Game: owns the mode stack, the current map/room, the entity list, and every
// callback the player and world objects reach for.
//
// ROOM SCRIPTING
//   A room definition may carry either a declarative `puzzle` block or an
//   imperative `script`, or both:
//
//     puzzle: {
//       switches: 'all',                  // 'all' | count
//       torches: 'all',
//       enemies: true,                    // clear every enemy
//       tide: 2,                          // tide must be at this level
//       reward: {
//         openDoors: [[4, 0]],            // tiles to switch to their open form
//         tiles: [[3, 4, 'dFloor']],      // arbitrary tile swaps
//         spawn: [['chest', 5, 3, { item: 'feather' }]],
//         say: 'A door opens somewhere...',
//         flag: 'd1_bridge',              // persists the solve
//       },
//     },
//     script: {
//       onEnter(game, room) {},
//       onEvent(game, name, data) {},     // 'switch' | 'torch' | 'block' | 'cleared'
//                                         // 'tide' | 'valve' | 'puzzle'
//     }

import {
  Screen, SCREEN_W, SCREEN_H, HUD_H, VIEW_W, VIEW_H, TILE, ROOM_W, ROOM_H, offscreen,
} from '../core/screen.js';
import { Input } from '../core/input.js';
import { audio } from '../core/audio.js';
import { tiles as tileSheet, sprites } from '../gfx/art.js';
import { TINTS } from '../gfx/palettes.js';
import { drawText, drawTextCentered, textWidth } from '../gfx/font.js';
import { F, transformFor, getTileDef, resolveTile } from '../world/tileset.js';
import { getMap, getRoom, hasRoom, resetRooms, MAPS } from '../world/maps.js';
import { Tide } from './tide.js';
import { Player } from './player.js';
import { spawnEntity, ENTITY_TYPES, Entity } from './entity.js';
import { spawnEffectAt, Explosion } from './effects.js';
import { Pickup, rollDropTable, PushBlock, Torch, FloorSwitch, Chest } from './objects.js';
import { ThrownObject, ITEMS, itemName, itemIcon } from './items.js';
import {
  newProgress, saveSlot, loadSlot, giveItem, addRupees, addKey, useKey, keyCount,
  itemLevel, hasItem, HEART_UNITS, addBombs, addSeeds, setFlag, flag,
} from './progress.js';
import { drawHud, drawAreaBanner, drawBossBar } from './hud.js';
import { Dialogue, drawBox, drawPanel, getText } from './dialogue.js';
import { Menu } from './menu.js';
import { RINGS } from './rings.js';
import { Title } from './title.js';
import { runCutscene, CUTSCENES } from './cutscene.js';
import { Stream, seedGlobal, roomStream, noise1 } from '../core/rng.js';
import {
  ROOM_TRANSITION_FRAMES, ROOM_EXIT_MARGIN, FADE_RATE, BANNER_FRAMES,
  SHAKE_LARGE, SHAKE_LARGE_FRAMES, BOSS_ESSENCE_DELAY_FRAMES,
  BOSS_MUSIC_RESUME_FRAMES, ITEM_PRESENT_FRAMES, ESSENCE_FREEZE_FRAMES,
  GAMEOVER_WAIT_FRAMES,
} from '../data/feel.js';

export class Game {
  constructor(screen, input) {
    this.screen = screen;
    this.ctx = screen.ctx;
    this.input = input;
    this.audio = audio;
    this.sprites = sprites;
    this.tiles = tileSheet;

    this.frame = 0;
    this.mode = 'title';
    // Set by main.js from ?seed= in the URL. A new game normally seeds itself
    // from the wall clock, which is right for play and wrong for any tool that
    // needs the same world twice — see tools/test.mjs.
    this.seedOverride = null;
    this.progress = newProgress();
    this.tide = new Tide(this);
    this.dialogue = new Dialogue(this);
    this.menu = new Menu(this);
    this.title = new Title(this);
    this.player = null;
    this.entities = [];
    this.pendingAdd = [];
    this.map = null;
    this.room = null;
    this.mapId = null;
    this.boss = null;
    this.shakeAmp = 0; this.shakeTime = 0;
    this.fadeAmount = 0; this.fadeDir = 0; this.fadeThen = null; this.fadeWhite = false;
    this.transition = null;
    this.bannerText = null; this.bannerTime = 0;
    this.cutscene = null;
    this.slot = 0;
    this.lure = null;
    this.linkPal = 'link';
    this.paused = false;
    this.debug = false;
    this.deathTime = 0;
    this.tintKey = 'none';
    this.roomSnapshot = offscreen(VIEW_W, VIEW_H);
    // The per-room stream. Replaced on every room entry from the save seed and
    // the room's identity, so a room replays identically. Everything that
    // rolls during play reads this, never Math.random and never the global
    // stream. Before a room exists it runs on a fixed seed so the title screen
    // is reproducible too.
    this.rng = new Stream(1, 'preroom');
  }

  // ------------------------------------------------------------------ setup

  newGame(slot, name = 'LINK', seed) {
    this.slot = slot;
    const useSeed = seed != null ? seed : this.seedOverride;
    this.progress = useSeed != null ? newProgress(name, useSeed) : newProgress(name);
    seedGlobal(this.progress.seed);
    resetRooms();
    this.entities.length = 0;
    this.boss = null;
    this.tide.level = this.progress.tide;
    const s = this.progress.pos;
    this.player = new Player(s.px, s.py);
    this.player.dir = s.dir;
    this.mode = 'play';
    this.enterMap(s.map, s.floor, s.rx, s.ry, s.px, s.py, s.dir, { instant: true });
    this.startCutscene('intro');
  }

  loadGame(slot) {
    const p = loadSlot(slot);
    if (!p) return false;
    this.slot = slot;
    this.progress = p;
    seedGlobal(p.seed);
    resetRooms();
    this.entities.length = 0;
    this.boss = null;
    this.tide.level = p.tide;
    const s = p.pos;
    this.player = new Player(s.px, s.py);
    this.player.dir = s.dir || 'down';
    this.mode = 'play';
    this.enterMap(s.map, s.floor, s.rx, s.ry, s.px, s.py, s.dir, { instant: true });
    return true;
  }

  save() {
    const p = this.progress;
    p.tide = this.tide.level;
    if (this.player && this.room) {
      p.pos = {
        map: this.mapId, floor: this.room.floor, rx: this.room.rx, ry: this.room.ry,
        px: Math.round(this.player.x), py: Math.round(this.player.y), dir: this.player.dir,
      };
    }
    return saveSlot(this.slot, p);
  }

  // ------------------------------------------------------------- map / room

  enterMap(mapId, floor, rx, ry, px, py, dir, o = {}) {
    const m = getMap(mapId);
    if (!m) { console.error('[game] no such map', mapId); return; }
    const changedMap = this.mapId !== mapId;
    this.map = m;
    this.mapId = mapId;
    this._warpLock = true;
    this.setRoom(floor, rx, ry, { spawnEntities: true });
    if (this.player) {
      if (px != null) this.player.x = px;
      if (py != null) this.player.y = py;
      if (dir) this.player.dir = dir;
      this.player.z = 0; this.player.vz = 0; this.player.jumping = false;
      this.player.lastSafe.x = this.player.x; this.player.lastSafe.y = this.player.y;
      this.player.reconcileWithTide(this);
    }
    if (changedMap || o.banner) {
      this.bannerText = m.kind === 'dungeon' ? m.name : (this.room && this.room.name) || m.name;
      this.bannerTime = BANNER_FRAMES;
    }
    if (!o.instant) this.fadeIn();
    this.updateMusic();
  }

  setRoom(floor, rx, ry, o = {}) {
    const r = getRoom(this.mapId, floor, rx, ry);
    if (!r) { console.warn('[game] missing room', this.mapId, floor, rx, ry); return; }
    this.room = r;
    // Rebuild the room's stream before anything in the room can roll: the room
    // script, the puzzle check and every entity spawned below all read it.
    this.rng = roomStream(this.progress.seed, this.mapId, r.key);
    r.visited = true;
    this.progress.secrets['seen:' + this.mapId + ':' + r.key] = true;
    this.tide.applyRoomRules(r);
    this.applyTint(r.tint);
    if (o.spawnEntities !== false) this.spawnRoomEntities();
    this.restoreRoomState();
    this.checkPuzzle();
    if (r.def.script && r.def.script.onEnter) r.def.script.onEnter(this, r);
    this.updateMusic();
  }

  applyTint(name) {
    const key = name || 'none';
    if (this.tintKey === key) return;
    this.tintKey = key;
    const t = TINTS[key] || null;
    tileSheet.setTint(t, key);
    sprites.setTint(t, key);
    tileSheet.flush();
    sprites.flush();
    if (this.room) this.room.invalidate();
  }

  /** Wipe entities (except the player) and spawn the current room's list. */
  spawnRoomEntities() {
    // Mark what is being dropped as removed before dropping it. The player
    // holds direct references to some of its own projectiles (`player.boomerang`
    // is the one that bit), and those guards read `.remove` to decide whether
    // the item is still in flight. Filtering the list without setting the flag
    // leaves a dangling reference that looks live forever — throw the boomerang,
    // walk through a door, and you can never throw it again for the rest of the
    // run. Nothing validates that; it just quietly stops working.
    for (const e of this.entities) if (e !== this.player) e.remove = true;
    this.entities = this.entities.filter(e => e === this.player);
    this.boss = null;
    this.lure = null;
    const room = this.room;
    if (!room) return;
    const list = room.def.entities || [];
    list.forEach((spec, i) => {
      const [type, tx, ty, opts] = Array.isArray(spec) ? spec : [spec.t, spec.x, spec.y, spec];
      const saveKey = `${this.mapId}:${room.key}:${i}`;
      const o = { ...(opts || {}), saveKey };
      // One-shot pickups and chests stay taken.
      if (this.progress.chests[saveKey] && type === 'chest') o.openedAlready = true;
      if (this.progress.secrets[saveKey] && (type === 'pickup' || type === 'essence')) return;
      if (o.needFlag && !flag(this.progress, o.needFlag)) return;
      if (o.hideFlag && flag(this.progress, o.hideFlag)) return;
      const e = spawnEntity(this, type, tx, ty, o);
      if (e && o.openedAlready) e.opened = true;
      if (e && e.isBoss) {
        if (this.progress.beaten[this.mapId] && e.oncePerGame !== false) { e.remove = true; }
        else this.boss = e;
      }
    });
    this.flushPending();
  }

  /** Re-apply persisted tile changes (opened doors, bombed walls). */
  restoreRoomState() {
    const room = this.room;
    if (!room) return;
    const prefix = `${this.mapId}:${room.key}:`;
    for (const [k, v] of Object.entries(this.progress.doors)) {
      if (!k.startsWith(prefix)) continue;
      const [tx, ty] = k.slice(prefix.length).split(',').map(Number);
      if (!isNaN(tx)) room.setTile(tx, ty, v);
    }
  }

  persistTile(tx, ty, tileName) {
    this.progress.doors[`${this.mapId}:${this.room.key}:${tx},${ty}`] = tileName;
  }

  // ------------------------------------------------------------ transitions

  /** Walk off the edge into the neighbouring room. */
  checkRoomExit() {
    if (this.transition || this.fadeDir || !this.player || this.dialogue.active) return;
    const p = this.player;
    const r = p.rect();
    const i = this.input;
    const M = ROOM_EXIT_MARGIN;
    let dir = null;
    if (i.down('right') && r.x + r.w >= VIEW_W - M) dir = 'right';
    else if (i.down('left') && r.x <= M) dir = 'left';
    else if (i.down('down') && r.y + r.h >= VIEW_H - M) dir = 'down';
    else if (i.down('up') && r.y <= M) dir = 'up';
    if (!dir) return;

    const d = { right: [1, 0], left: [-1, 0], down: [0, 1], up: [0, -1] }[dir];
    const nx = this.room.rx + d[0], ny = this.room.ry + d[1];
    if (!hasRoom(this.mapId, this.room.floor, nx, ny)) return;

    const next = getRoom(this.mapId, this.room.floor, nx, ny);
    if (this.map.scroll === false) {
      this.warpTo(this.mapId, this.room.floor, nx, ny, this.entryPos(dir, p), dir);
      return;
    }
    this.transition = {
      dir, t: 0, from: this.room, to: next, nx, ny,
      fromCanvas: this.room.render(this.tide.level, this.frame),
      startX: p.x, startY: p.y,
      endPos: this.entryPos(dir, p),
    };
    // Snapshot the outgoing room so animated tiles do not tick during the slide.
    this.roomSnapshot.ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    this.roomSnapshot.ctx.drawImage(this.transition.fromCanvas, 0, 0);
    this.room.drawAnim(this.roomSnapshot.ctx, 0, 0, this.tide.level, this.frame);
    this.room.drawOver(this.roomSnapshot.ctx, 0, 0, this.tide.level, this.frame);
  }

  entryPos(dir, p) {
    if (dir === 'right') return { x: -3, y: p.y };
    if (dir === 'left') return { x: VIEW_W - 13, y: p.y };
    if (dir === 'down') return { x: p.x, y: -8 };
    return { x: p.x, y: VIEW_H - 16 };
  }

  updateTransition() {
    const t = this.transition;
    t.t++;
    const k = t.t / ROOM_TRANSITION_FRAMES;
    const p = this.player;
    // Ease the player across the seam while the view slides.
    p.x = t.startX + (t.endPos.x + (t.dir === 'right' ? VIEW_W : t.dir === 'left' ? -VIEW_W : 0) - t.startX) * k;
    p.y = t.startY + (t.endPos.y + (t.dir === 'down' ? VIEW_H : t.dir === 'up' ? -VIEW_H : 0) - t.startY) * k;
    p.animT++;
    if (t.t >= ROOM_TRANSITION_FRAMES) {
      this.setRoom(this.room.floor, t.nx, t.ny);
      p.x = t.endPos.x; p.y = t.endPos.y;
      p.lastSafe.x = p.x; p.lastSafe.y = p.y;
      p.reconcileWithTide(this);
      this.transition = null;
    }
  }

  /** Hard cut with a fade: doors, stairs, cave mouths, whirlpools. */
  warpTo(mapId, floor, rx, ry, pos, dir, o = {}) {
    if (this.fadeDir) return;
    this.fadeOut(() => {
      const px = pos ? pos.x : null, py = pos ? pos.y : null;
      this.enterMap(mapId, floor, rx, ry, px, py, dir || (this.player && this.player.dir), o);
    }, o.white);
  }

  fadeOut(then, white = false) {
    this.fadeDir = 1; this.fadeAmount = 0; this.fadeThen = then; this.fadeWhite = white;
  }
  fadeIn() { this.fadeDir = -1; this.fadeAmount = 1; }

  updateFade() {
    if (!this.fadeDir) return;
    this.fadeAmount += this.fadeDir * FADE_RATE;
    if (this.fadeDir > 0 && this.fadeAmount >= 1) {
      this.fadeAmount = 1;
      const t = this.fadeThen; this.fadeThen = null; this.fadeDir = 0;
      if (t) t();
      if (!this.fadeDir) this.fadeIn();
    } else if (this.fadeDir < 0 && this.fadeAmount <= 0) {
      this.fadeAmount = 0; this.fadeDir = 0;
    }
  }

  // ------------------------------------------------------------ tile actions

  /**
   * Apply an action ('cut','bomb','fire','hook','magnet','boomerang') to the
   * tiles under a rect. `level` is the acting item's level; a transform that
   * asks for more is refused, which is how a gate names one specific item.
   */
  checkTileAction(rect, action, level = 99) {
    const room = this.room;
    if (!room) return false;
    let any = false;
    const x0 = Math.floor(rect.x / TILE), x1 = Math.floor((rect.x + rect.w - 1) / TILE);
    const y0 = Math.floor(rect.y / TILE), y1 = Math.floor((rect.y + rect.h - 1) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (!room.inBounds(tx, ty)) continue;
        if (this.applyTileAction(tx, ty, action, level)) any = true;
      }
    }
    // Torch entities respond to fire too.
    if (action === 'fire') {
      for (const e of this.entities) {
        if (e.flammable && !e.lit) {
          const r = e.rect();
          if (r.x < rect.x + rect.w && rect.x < r.x + r.w && r.y < rect.y + rect.h && rect.y < r.y + r.h) {
            e.ignite(this); any = true;
          }
        }
      }
    }
    return any;
  }

  breakTilesInRect(rect, action, level) { return this.checkTileAction(rect, action, level); }

  applyTileAction(tx, ty, action, level = 99) {
    const room = this.room;
    const name = room.baseName(tx, ty);
    // Resolve through tide variants so bombing a flooded crack still works.
    const concrete = resolveTile(name, this.tide.level).name;
    const tr = transformFor(name, action) || transformFor(concrete, action);
    if (!tr) return false;
    // A gate that names a specific item refuses the weaker one — and says so,
    // because a tile that simply ignores you reads as scenery, not as a lock.
    if (tr.level && level < tr.level) {
      if (tr.deny && !this.dialogue.active) this.say(tr.deny);
      return false;
    }
    room.setTile(tx, ty, tr.to);
    if (tr.persist) this.persistTile(tx, ty, tr.to);
    if (tr.fx) this.spawnEffect(tr.fx, tx * TILE, ty * TILE);
    if (tr.sfx) this.audio.sfx(tr.sfx);
    else this.audio.sfx(action === 'cut' ? 'cut' : 'break');
    if (tr.drop) this.rollDrop(tx * TILE, ty * TILE, tr.drop);
    this.roomEvent('tile', { tx, ty, action });
    return true;
  }

  liftTile(tx, ty, level, player) {
    const room = this.room;
    if (!room.inBounds(tx, ty)) return null;
    const name = room.baseName(tx, ty);
    const tr = transformFor(name, 'lift');
    if (!tr) return null;
    const def = getTileDef(name);
    if (def.liftLevel && level < def.liftLevel) { this.say('It is too heavy.'); return null; }
    room.setTile(tx, ty, tr.to);
    if (tr.persist) this.persistTile(tx, ty, tr.to);
    const obj = new ThrownObject(tx * TILE, ty * TILE, {
      sprite: def.liftSprite || (name.startsWith('pot') ? 'o_pot' : 'rock16'),
      pal: def.pal, vx: 0, vy: 0, z: 13, drops: tr.drop || 'none',
    });
    obj.vz = 0;
    obj.carried = true;
    obj.update = function (game) {
      // While carried the object just follows Link; throwing restores normal flight.
      if (this.carried) { this.frame++; return; }
      ThrownObject.prototype.update.call(this, game);
    };
    this.addEntity(obj);
    return obj;
  }

  digTile(tx, ty, player) {
    const room = this.room;
    const name = room.baseName(tx, ty);
    const tr = transformFor(name, 'dig');
    this.spawnEffect('dust', tx * TILE, ty * TILE, { life: 14 });
    if (tr) {
      room.setTile(tx, ty, tr.to);
      if (tr.persist) this.persistTile(tx, ty, tr.to);
      if (tr.drop) this.rollDrop(tx * TILE, ty * TILE, tr.drop);
      this.roomEvent('dig', { tx, ty });
      return true;
    }
    // Buried secrets are declared per-room.
    const buried = (room.def.buried || []).find(b => b[0] === tx && b[1] === ty);
    if (buried) {
      const key = `${this.mapId}:${room.key}:dig:${tx},${ty}`;
      if (!this.progress.secrets[key]) {
        this.progress.secrets[key] = true;
        this.spawnPickup(tx * TILE, ty * TILE, buried[2], { grabDelay: 14 });
        this.audio.jingle('secret');
      }
      return true;
    }
    return false;
  }

  tryPushBlock(tx, ty, dx, dy) {
    for (const e of this.entities) {
      if (e instanceof PushBlock) {
        if (Math.floor(e.cx / TILE) === tx && Math.floor(e.cy / TILE) === ty) {
          return e.push(this, dx, dy);
        }
      }
    }
    return false;
  }

  /** A-button interaction with a tile: locked doors, readable fixtures. */
  tileInteract(tx, ty, player) {
    const room = this.room;
    if (!room.inBounds(tx, ty)) return false;
    const name = room.baseName(tx, ty);
    const def = resolveTile(name, this.tide.level);
    if (name === 'dDoorLocked') {
      if (useKey(this.progress, this.mapId)) {
        room.setTile(tx, ty, 'dDoorOpen');
        this.persistTile(tx, ty, 'dDoorOpen');
        this.audio.sfx('unlock');
        this.say('The lock falls away.');
      } else {
        this.audio.sfx('deny');
        this.say('It is locked. You need a Small Key.');
      }
      return true;
    }
    if (name === 'dDoorBoss') {
      if (this.progress.bossKeys[this.mapId]) {
        room.setTile(tx, ty, 'dDoorOpen');
        this.persistTile(tx, ty, 'dDoorOpen');
        this.audio.sfx('unlock');
      } else {
        this.audio.sfx('deny');
        this.say('A great lock seals this door.');
      }
      return true;
    }
    const readable = (room.def.readable || []).find(r => r[0] === tx && r[1] === ty);
    if (readable) { this.say(readable[2]); return true; }
    return false;
  }

  /** Step onto a warp tile (cave mouth, stairs, open door). */
  checkWarpTile() {
    if (this.transition || this.fadeDir || !this.player) return;
    const p = this.player;
    if (p.z > 2) return;
    const tx = Math.floor(p.cx / TILE), ty = Math.floor((p.y + 12) / TILE);
    const f = this.room.flagsAt(tx, ty, this.tide.level);
    // Arriving on a warp tile must not bounce straight back through it: stay
    // locked until the player has stepped off any warp tile.
    if (!(f & F.WARP)) { this._warpLock = false; return; }
    if (this._warpLock) return;
    const w = this.room.warpAt(tx, ty);
    if (!w) return;
    if (w.needFlag && !flag(this.progress, w.needFlag)) return;
    this._warpLock = true;
    this.audio.sfx(w.sfx || 'stairs');
    this.warpTo(w.to.map, w.to.floor || 0, w.to.rx, w.to.ry,
      { x: w.to.px != null ? w.to.px : p.x, y: w.to.py != null ? w.to.py : p.y },
      w.to.dir || p.dir, { banner: true });
  }

  // ---------------------------------------------------------------- puzzles

  roomEvent(name, data) {
    const room = this.room;
    if (!room) return;
    if (room.def.script && room.def.script.onEvent) room.def.script.onEvent(this, name, data);
    this.checkPuzzle();
  }

  onSwitchChanged(sw) { this.roomEvent('switch', sw); }
  onTorchLit(t) { this.roomEvent('torch', t); }
  onBlockLanded(b) { this.roomEvent('block', b); }
  onValveToggled(v) { this.room.invalidate(); this.roomEvent('valve', v); }

  onTideChanged(next, prev) {
    if (this.player) this.player.reconcileWithTide(this);
    if (this.room) this.room.invalidate();
    this.roomEvent('tide', { next, prev });
  }

  onConchPlayed() {
    this.spawnEffect('sparkle', this.player.x, this.player.y - 8, { life: 30 });
  }

  onEnemyDefeated(e) {
    this.progress.kills++;
    if (e.isBoss) {
      this.progress.beaten[this.mapId] = true;
      this.boss = null;
      this.onBossDefeated(e);
      return;
    }
    if (!this.entities.some(x => x.isEnemy && !x.dead && x !== e)) {
      this.room.cleared = true;
      this.roomEvent('cleared', null);
    }
  }

  onBossDefeated(e) {
    const d = this.map && this.map.dungeon;
    this.shake(SHAKE_LARGE, SHAKE_LARGE_FRAMES);
    this.audio.stop();
    // Boss death opens the way to the essence.
    const room = this.room;
    if (d && d.essence != null) {
      this.frameLater(BOSS_ESSENCE_DELAY_FRAMES, () => {
        this.audio.jingle('bossClear');
        spawnEntity(this, 'essence', 4, 3, { index: d.index });
      });
    }
    // The boss track was stopped, so nothing would resume once the jingle ends.
    this.frameLater(BOSS_MUSIC_RESUME_FRAMES, () => this.updateMusic());
    if (room.def.script && room.def.script.onEvent) room.def.script.onEvent(this, 'bossDead', e);
  }

  checkPuzzle() {
    const room = this.room;
    if (!room || !room.def.puzzle || room._puzzleDone) return;
    const pz = room.def.puzzle;
    if (pz.flag && flag(this.progress, pz.flag)) { room._puzzleDone = true; this.applyReward(pz.reward, true); return; }

    if (pz.switches != null) {
      const sws = this.entities.filter(e => e instanceof FloorSwitch);
      const need = pz.switches === 'all' ? sws.length : pz.switches;
      if (!sws.length || sws.filter(s => s.pressed).length < need) return;
    }
    if (pz.torches != null) {
      const ts = this.entities.filter(e => e instanceof Torch);
      const need = pz.torches === 'all' ? ts.length : pz.torches;
      if (!ts.length || ts.filter(t => t.lit).length < need) return;
    }
    if (pz.enemies) {
      if (this.entities.some(e => e.isEnemy && !e.dead)) return;
    }
    if (pz.tide != null && this.tide.level !== pz.tide) return;
    if (pz.blocks) {
      const bs = this.entities.filter(e => e instanceof PushBlock);
      const ok = pz.blocks.every(([tx, ty]) =>
        bs.some(b => Math.round(b.x / TILE) === tx && Math.round(b.y / TILE) === ty));
      if (!ok) return;
    }
    if (pz.condition && !pz.condition(this, room)) return;

    room._puzzleDone = true;
    if (pz.flag) setFlag(this.progress, pz.flag);
    this.applyReward(pz.reward, false);
    this.roomEvent('puzzle', pz);
  }

  applyReward(reward, silent) {
    if (!reward) return;
    const room = this.room;
    if (reward.openDoors) {
      for (const [tx, ty] of reward.openDoors) {
        room.setTile(tx, ty, 'dDoorOpen');
        this.persistTile(tx, ty, 'dDoorOpen');
      }
    }
    if (reward.tiles) {
      for (const [tx, ty, name] of reward.tiles) {
        room.setTile(tx, ty, name);
        this.persistTile(tx, ty, name);
      }
    }
    if (reward.spawn) {
      for (const s of reward.spawn) spawnEntity(this, s[0], s[1], s[2], s[3] || {});
    }
    if (!silent) {
      // A reward that changes the room — a door opened, a tile swapped, a prize
      // released — is the discovery moment `secret` was written for. A reward
      // that only talks keeps the short sfx, and one that names its own wins.
      const opened = (reward.openDoors && reward.openDoors.length)
        || (reward.tiles && reward.tiles.length)
        || (reward.spawn && reward.spawn.length);
      if (reward.sfx) this.audio.sfx(reward.sfx);
      else if (opened) this.audio.jingle('secret');
      else this.audio.sfx('puzzle');
      if (reward.say) this.say(reward.say);
    }
  }

  // ------------------------------------------------------------- item grants

  openChest(chest) {
    const p = this.progress;
    if (chest.item) {
      const id = chest.item, lv = chest.level || 1;
      giveItem(p, id, lv);
      this.autoEquip(id);
      if (id === 'bombs') { p.maxBombs = Math.max(p.maxBombs, 10); addBombs(p, 10); }
      if (id === 'satchel') { p.maxSeeds = Math.max(p.maxSeeds, 20); addSeeds(p, 'ember', 20); p.seedSelected = 'ember'; }
      this.presentItem(id, lv);
    } else if (chest.pickup) {
      this.spawnPickup(chest.x, chest.y - 12, chest.pickup, { grabDelay: 10 });
    } else if (chest.rupees) {
      addRupees(p, chest.rupees);
      this.audio.sfx('rupeeBig');
      this.say(`You got ${chest.rupees} Rupees!`);
    } else {
      this.say('Nothing but sand.');
    }
  }

  /** Freeze, hold the item overhead, and describe it. */
  presentItem(id, lv) {
    const def = ITEMS[id];
    // `itemGet` is the rising arpeggio composed for exactly this beat — the
    // item held overhead. `fanfare` is the longer piece, kept for the moments
    // that earn it (heart container, essence, dungeon cleared).
    this.audio.jingle('itemGet');
    this.player.frozen = ITEM_PRESENT_FRAMES;
    this.itemShow = { id, lv, t: ITEM_PRESENT_FRAMES };
    const name = itemName(id, lv);
    this.say(`You got the ${name}!\n${def ? def.desc : ''}`);
  }

  autoEquip(id) {
    const p = this.progress;
    const def = ITEMS[id];
    if (!def || !def.equippable) return;
    if (!p.equipB) p.equipB = id;
    else if (!p.equipA) p.equipA = id;
  }

  claimEssence(index) {
    const p = this.progress;
    if (!p.essences.includes(index)) p.essences.push(index);
    p.essences.sort((a, b) => a - b);
    this.audio.jingle('essence');
    this.player.frozen = ESSENCE_FREEZE_FRAMES;
    this.startCutscene('essence' + index, { fallback: 'essenceGeneric', data: { index } });
  }

  spawnPickup(x, y, kind, o = {}) {
    const e = new Pickup(x, y, { kind, ...o });
    this.addEntity(e);
    return e;
  }

  rollDrop(x, y, table) {
    const kind = rollDropTable(table, this.rng);
    if (!kind) return null;
    return this.spawnPickup(x, y, kind);
  }

  // -------------------------------------------------------------- utilities

  addEntity(e) { this.pendingAdd.push(e); return e; }
  flushPending() {
    if (!this.pendingAdd.length) return;
    for (const e of this.pendingAdd) this.entities.push(e);
    this.pendingAdd.length = 0;
  }

  spawnEffect(name, x, y, opts) { return spawnEffectAt(this, name, x, y, opts); }

  shake(amp, frames) { this.shakeAmp = Math.max(this.shakeAmp, amp); this.shakeTime = Math.max(this.shakeTime, frames); }

  say(text, opts) { if (text) this.dialogue.show(text, opts); }

  /** Show a named dialogue script. Falls back to the id so gaps are visible. */
  startDialogue(id, npc) {
    const t = getText(id);
    if (t == null) { console.warn('[dialogue] missing text:', id); this.say('...'); return; }
    this.say(typeof t === 'function' ? t(this, npc) : t);
  }

  ask(text, options, onPick) { this.dialogue.show(text, { choices: options, onPick }); }

  hasRing(id) {
    const p = this.progress;
    return p.ringsEquipped.includes(id);
  }

  /** Run a callback after n frames (used for beats in scripted moments). */
  frameLater(n, fn) {
    (this._timers = this._timers || []).push({ n, fn });
  }

  updateTimers() {
    if (!this._timers || !this._timers.length) return;
    for (const t of this._timers) t.n--;
    const due = this._timers.filter(t => t.n <= 0);
    this._timers = this._timers.filter(t => t.n > 0);
    for (const t of due) t.fn();
  }

  updateMusic() {
    const want = this.room && this.room.music ? this.room.music
      : (this.map && this.map.music) || 'overworld';
    const track = this.boss ? (this.map.dungeon && this.map.dungeon.bossMusic || 'boss') : want;
    if (track) this.audio.play(track);
  }

  startCutscene(id, o = {}) {
    const cs = CUTSCENES[id] || (o.fallback ? CUTSCENES[o.fallback] : null);
    if (!cs) return false;
    this.cutscene = runCutscene(this, cs, o.data || {});
    this.mode = 'cutscene';
    return true;
  }

  startGaleWarp() {
    const spots = [{ name: 'Tidewatch Village', map: 'overworld', floor: 0, rx: 4, ry: 7, px: 72, py: 64 }];
    for (const m of MAPS.values()) {
      if (m.kind === 'dungeon' && m.dungeon && m.dungeon.entrance
        && this.progress.secrets['seen:' + m.id + ':' + '0,' + m.dungeon.startRoom]) {
        spots.push({ name: m.name, ...m.dungeon.entrance });
      }
    }
    if (spots.length === 1) {
      this.warpTo(spots[0].map, spots[0].floor, spots[0].rx, spots[0].ry, { x: spots[0].px, y: spots[0].py }, 'down', { banner: true });
      return;
    }
    this.ask('Where shall the wind take you?', spots.map(s => s.name), (i) => {
      const s = spots[i];
      this.warpTo(s.map, s.floor, s.rx, s.ry, { x: s.px, y: s.py }, 'down', { banner: true });
    });
  }

  enterWhirlpool(p) {
    if (this._whirl) return;
    this._whirl = true;
    const dest = (this.room.def.whirlpool) || null;
    this.audio.sfx('whirl');
    this.fadeOut(() => {
      this._whirl = false;
      if (dest) this.enterMap(dest.map, dest.floor || 0, dest.rx, dest.ry, dest.px, dest.py, 'down', { banner: true });
      else { const s = this.progress.respawn; this.enterMap(s.map, s.floor, s.rx, s.ry, s.px, s.py, s.dir); }
    });
  }

  onPlayerDied() {
    if (this.mode === 'gameover') return;
    this.mode = 'gameover';
    this.deathTime = 0;
    this.progress.deaths++;
    this.audio.stop();
    this.audio.jingle('gameOver');
  }

  respawn(keepProgress = true) {
    const p = this.progress;
    p.hearts = p.maxHearts;
    const s = p.respawn;
    this.mode = 'play';
    this.entities.length = 0;
    this.player = new Player(s.px, s.py);
    this.player.dir = s.dir || 'down';
    this.tide.setLevel(1, { instant: true });
    this.enterMap(s.map, s.floor, s.rx, s.ry, s.px, s.py, s.dir, { instant: true });
    this.fadeIn();
  }

  // ------------------------------------------------------------------ frame

  update() {
    this.frame++;
    this.input.update();
    this.audio.update();
    this.progress.frames++;
    this.updateTimers();
    this.updateFade();
    if (this.shakeTime > 0) { this.shakeTime--; if (this.shakeTime === 0) this.shakeAmp = 0; }

    const extra = this.input.takeExtra();
    if (extra === 'KeyP') { this.audio.toggleMute(); }
    if (extra === 'KeyO') { this.debug = !this.debug; }

    switch (this.mode) {
      case 'title': this.title.update(); return;
      case 'cutscene':
        this.dialogue.update();
        if (this.cutscene) {
          const done = this.cutscene.update();
          if (done) { this.cutscene = null; this.mode = 'play'; this.updateMusic(); }
        } else this.mode = 'play';
        return;
      case 'menu': this.menu.update(); return;
      case 'gameover': this.updateGameOver(); return;
    }

    // --- play mode ---
    this.tide.update();
    if (this.bannerTime > 0) this.bannerTime--;
    if (this.itemShow) { this.itemShow.t--; if (this.itemShow.t <= 0) this.itemShow = null; }
    if (this.lure) { if (--this.lure.life <= 0) this.lure = null; }

    if (this.dialogue.active) { this.dialogue.update(); this.flushPending(); return; }

    if (this.input.pressed('start')) {
      this.menu.open();
      this.audio.sfx('pause');
      return;
    }

    if (this.transition) { this.updateTransition(); this.flushPending(); return; }
    // The sweep was already stepped at the top of play mode. Stepping it again
    // here ran the wave front at double speed and made TIDE_SWEEP_FRAMES mean
    // half what it said; it also stretched the conch lock-out, because nothing
    // below this line runs during a sweep, so the player's own timers stall
    // for its whole length.
    if (this.tide.busy) return;
    if (this.fadeDir) return;

    if (this.player) this.player.update(this);
    for (const e of this.entities) {
      if (e === this.player || e.remove) continue;
      if (e.update) e.update(this);
    }
    this.flushPending();
    this.entities = this.entities.filter(e => !e.remove);

    this.checkRoomExit();
    this.checkWarpTile();
    this.checkPuzzle();
  }

  updateGameOver() {
    this.deathTime++;
    if (this.deathTime < GAMEOVER_WAIT_FRAMES) return;
    if (this.input.pressed('a') || this.input.pressed('start')) {
      if (this.deathChoice === undefined) this.deathChoice = 0;
      this.respawn();
      this.deathChoice = undefined;
    }
  }

  // ------------------------------------------------------------------- draw

  draw() {
    const ctx = this.ctx;
    if (this.mode === 'title') { this.title.draw(ctx); return; }

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    let ox = 0, oy = HUD_H;
    if (this.shakeTime > 0) {
      // draw() runs at display rate, not at the fixed 60 Hz step, so this must
      // not touch a stream — a slow machine would draw a different number of
      // times per update and silently advance the run's randomness. noise1 is
      // a pure hash of the frame counter: same shake, no state consumed.
      ox += Math.round(noise1(this.frame * 2) * this.shakeAmp);
      oy += Math.round(noise1(this.frame * 2 + 1) * this.shakeAmp);
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, HUD_H, VIEW_W, VIEW_H);
    ctx.clip();

    if (this.transition) this.drawTransition(ctx, ox, oy);
    else this.drawScene(ctx, ox, oy);

    ctx.restore();

    drawHud(ctx, this);
    drawAreaBanner(ctx, this);
    if (this.boss && !this.boss.dead) drawBossBar(ctx, this);
    this.dialogue.draw(ctx);

    if (this.mode === 'menu') this.menu.draw(ctx);
    if (this.mode === 'cutscene' && this.cutscene) this.cutscene.draw(ctx);
    if (this.mode === 'gameover') this.drawGameOver(ctx);

    if (this.fadeAmount > 0) this.screen.fade(this.fadeAmount, this.fadeWhite);
    if (this.debug) this.drawDebug(ctx);
  }

  drawScene(ctx, ox, oy) {
    const room = this.room;
    if (!room) return;
    const base = room.render(this.tide.level, this.frame);

    if (this.tide.busy) {
      this.tide.drawSweep(ctx, ox, oy, base, () => {
        room.drawAnim(ctx, ox, oy, this.tide.level, this.frame);
        room.drawOver(ctx, ox, oy, this.tide.level, this.frame);
      });
      // Link keeps standing there while the water changes around him.
      if (this.player) this.player.draw(ctx, this, ox, oy);
      return;
    }

    ctx.drawImage(base, ox, oy);
    room.drawAnim(ctx, ox, oy, this.tide.level, this.frame);

    const list = this.entities.slice();
    if (this.player && !list.includes(this.player)) list.push(this.player);
    list.sort((a, b) => (a.depth * 1000 + a.y + a.h) - (b.depth * 1000 + b.y + b.h));
    for (const e of list) { if (e.drawShadow) e.drawShadow(ctx, this, ox, oy); }
    for (const e of list) {
      if (e.hidden) continue;
      e.draw(ctx, this, ox, oy);
    }

    room.drawOver(ctx, ox, oy, this.tide.level, this.frame);

    if (room.dark && !flag(this.progress, 'lantern')) this.drawDarkness(ctx, ox, oy);
    if (this.itemShow) this.drawItemShow(ctx);
  }

  drawTransition(ctx, ox, oy) {
    const t = this.transition;
    const k = t.t / ROOM_TRANSITION_FRAMES;
    const d = { right: [-1, 0], left: [1, 0], down: [0, -1], up: [0, 1] }[t.dir];
    const sx = Math.round(d[0] * VIEW_W * k), sy = Math.round(d[1] * VIEW_H * k);
    ctx.drawImage(this.roomSnapshot.canvas, ox + sx, oy + sy);
    const nb = t.to.render(this.tide.level, this.frame);
    const nx = ox + sx - d[0] * VIEW_W, ny = oy + sy - d[1] * VIEW_H;
    ctx.drawImage(nb, nx, ny);
    t.to.drawAnim(ctx, nx, ny, this.tide.level, this.frame);
    t.to.drawOver(ctx, nx, ny, this.tide.level, this.frame);
    if (this.player) this.player.draw(ctx, this, ox + sx, oy + sy);
  }

  drawDarkness(ctx, ox, oy) {
    const p = this.player;
    const cx = ox + (p ? p.cx : VIEW_W / 2), cy = oy + (p ? p.cy : VIEW_H / 2);
    const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, 54);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.7, 'rgba(0,0,0,0.55)');
    g.addColorStop(1, 'rgba(0,0,0,0.88)');
    ctx.fillStyle = g;
    ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H);
  }

  drawItemShow(ctx) {
    const p = this.player;
    if (!p) return;
    const s = this.itemShow;
    sprites.draw(ctx, itemIcon(s.id, s.lv), p.x, HUD_H + p.y - 16,
      { pal: ITEMS[s.id] && ITEMS[s.id].pal });
  }

  drawGameOver(ctx) {
    const t = Math.min(1, this.deathTime / 60);
    this.screen.fade(t * 0.85);
    if (this.deathTime > 60) {
      drawTextCentered(ctx, 'YOU DIED', SCREEN_W / 2, 56, '#e04858');
      if (this.deathTime > GAMEOVER_WAIT_FRAMES && (this.frame >> 4) % 2 === 0) {
        drawTextCentered(ctx, 'Press A to continue', SCREEN_W / 2, 80, '#f8f8e8');
      }
    }
  }

  drawDebug(ctx) {
    const p = this.player;
    const lines = [
      `${this.mapId} ${this.room ? this.room.key : '-'} tide=${this.tide.level}`,
      p ? `x=${p.x.toFixed(0)} y=${p.y.toFixed(0)} z=${p.z.toFixed(1)} ${p.dir}` : '',
      `ents=${this.entities.length} fps~${this.fps || 0}`,
    ];
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, SCREEN_H - 28, SCREEN_W, 28);
    lines.forEach((l, i) => drawText(ctx, l, 2, SCREEN_H - 27 + i * 9, '#8fa'));
  }
}
