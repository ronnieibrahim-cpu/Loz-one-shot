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
  Screen, SCREEN_W, SCREEN_H, HUD_H, VIEW_W, VIEW_H, TILE, offscreen,
} from '../core/screen.js';
import { Input } from '../core/input.js';
import { audio } from '../core/audio.js';
import { tiles as tileSheet, sprites } from '../gfx/art.js';
import { TINTS } from '../gfx/palettes.js';
import { drawText, drawTextCentered, textWidth } from '../gfx/font.js';
import { F, transformFor, getTileDef, resolveTile } from '../world/tileset.js';
import { getMap, getRoom, hasRoom, resetRooms, MAPS } from '../world/maps.js';
import { Tide, TIDE_COUNT } from './tide.js';
import { Player } from './player.js';
import { spawnEntity, ENTITY_TYPES, Entity, findSafeTile } from './entity.js';
import { spawnEffectAt, Explosion } from './effects.js';
import { Pickup, PICKUPS, rollDropTable, PushBlock, Torch, FloorSwitch, Chest } from './objects.js';
import { ThrownObject, ITEMS, itemName, itemIcon } from './items.js';
import {
  newProgress, saveSlot, loadSlot, giveItem, addRupees, addKey, useKey, keyCount,
  itemLevel, hasItem, HEART_UNITS, addBombs, addReefseeds, addBottles, setFlag, flag,
} from './progress.js';
import { drawHud, drawAreaBanner, drawBossBar } from './hud.js';
import { Dialogue, drawBox, drawPanel, getText } from './dialogue.js';
import { Menu } from './menu.js';
import { Camera } from './camera.js';
import { Scrimshaw, CHARMS, giveCharm, ownedCharms, openCasesFor } from './scrimshaw.js';
import { Title } from './title.js';
import { runCutscene, CUTSCENES } from './cutscene.js';
import { Stream, seedGlobal, roomStream, noise1, rng as rngGlobal } from '../core/rng.js';
import { sp } from '../core/fixed.js';
import {
  ROOM_TRANSITION_FRAMES, ROOM_EXIT_MARGIN, FADE_RATE, BANNER_FRAMES,
  SHAKE_LARGE, SHAKE_LARGE_FRAMES, BOSS_ESSENCE_DELAY_FRAMES,
  BOSS_MUSIC_RESUME_FRAMES, ITEM_PRESENT_FRAMES, ESSENCE_FREEZE_FRAMES,
  GAMEOVER_WAIT_FRAMES, ANCHOR_RADIUS_TILES, ANCHOR_SHAPE,
  LENS_FADE_FRAMES, LENS_GHOST_ALPHA, LENS_TINT_ALPHA, LENS_PHASE_ALPHA,
  LENS_SHIMMER_FRAMES, REEFSEED_CAPACITY, COIN_SWAP_DELAY_FRAMES, BOTTLE_CAPACITY,
  CARVE_TIDE_TURNS, QUARTERMASTER_BONUS, CHANDLER_FACTOR, LANTERN_RADIUS,
  GULLS_TALLY_FACTOR, CARVE_PRICE, PICKUP_LIFE_FRAMES,
  WRECK_GLIMMER_PERIOD, WRECK_GLIMMER_ON, WRECK_GLIMMER_ALPHA,
  CAM_DEADZONE_W, CAM_DEADZONE_H,
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
    this.scrim = new Scrimshaw(this);
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
    // null = use the feel.js constant. Debug-only overrides, see cycleAnchorRadius.
    this.anchorRadius = null;
    this.anchorShape = null;
    this.deathTime = 0;
    this.tintKey = 'none';
    // Which window of the room is on screen. Clamps to 0 in a 1x1 room, which
    // is every room the game currently has; see camera.js.
    this.camera = new Camera();
    this.debugCam = false;
    // The OUTGOING SCREEN WINDOW during a scroll transition, not the outgoing
    // room: the camera offset is baked in when it is captured, so the slide is
    // one screen wide however large either room is.
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
    this.tide.clearOverrides();
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
    // A placed anchor is run state, not save state: reloading returns it to
    // your pocket rather than restoring a frozen patch you cannot see the
    // reason for.
    this.tide.clearOverrides();
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
    // After the player is placed, never before: a room has no camera history to
    // deadzone against on the frame you arrive in it.
    this.camera.snap(this.room, this.player);
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
    // Barnacle Skin is "one free hit per room", so the shell regrows exactly
    // here and nowhere else. Doing it on tide change instead would make it a
    // charm about the conch, which is a different charm.
    if (this.player) this.player.barnacleUsed = false;
    this.applyTint(r.tint);
    if (o.spawnEntities !== false) this.spawnRoomEntities();
    this.respawnAnchor();
    this.restoreRoomState();
    this.checkPuzzle();
    if (r.def.script && r.def.script.onEnter) r.def.script.onEnter(this, r);
    this.camera.snap(r, this.player);
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
    // holds direct references to some of its own projectiles (`player.dredge`
    // is the one that bit), and those guards read `.remove` to decide whether
    // the item is still in flight. Filtering the list without setting the flag
    // leaves a dangling reference that looks live forever — cast the line,
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

  /**
   * Put the anchor's sprite back if one is held in the room being entered.
   *
   * `spawnRoomEntities` has just wiped every non-player entity, which is right:
   * the anchor's state does not live on the entity, it lives in the tide's
   * override list keyed to this map and room. This re-draws the picture. An
   * anchor still in flight when the room changed is simply gone, and no
   * override was ever registered for it — which is how a cancelled transition
   * mid-throw returns the item instead of stranding a frozen patch.
   */
  respawnAnchor() {
    const room = this.room;
    if (!room) return;
    const o = this.tide.overrides.find(
      v => v.src === 'anchor' && v.mapId === this.mapId && v.roomKey === room.key);
    if (!o) return;
    const a = spawnEntity(this, 'anchor', o.tx, o.ty, { state: 'held', overrideId: o.id });
    if (a && this.player) this.player.anchor = a;
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
    // One pixel. It was three, to catch a player who could step over the
    // boundary without ever landing on it; at 256 sp/f he advances a pixel at a
    // time and stops flush against the last legal column, so a one-pixel band
    // at the edge is enough. See ROOM_EXIT_MARGIN in feel.js.
    const M = ROOM_EXIT_MARGIN;
    let dir = null;
    // The ROOM's extent, not the screen's. An internal screen seam inside a
    // multi-screen room is not a boundary and never was — nothing here ever
    // looked for a seam, only for where the room stops.
    if (i.down('right') && r.x + r.w >= this.room.pw - M) dir = 'right';
    else if (i.down('left') && r.x <= M) dir = 'left';
    else if (i.down('down') && r.y + r.h >= this.room.ph - M) dir = 'down';
    else if (i.down('up') && r.y <= M) dir = 'up';
    if (!dir) return;

    // WHICH CELL YOU LEAVE FROM, on the map's grid of screens.
    //
    // A room's key is its top-left cell and it covers `sw x sh` of them, so a
    // 2x1 room's east neighbour is at `rx + 2` and its NORTH neighbour depends
    // on which of its two screens the player is standing in. For a 1x1 room
    // `sw`/`sh` are 1 and the sub-screen term is 0, so this is `rx + d[0]`
    // exactly as it always was.
    const room = this.room;
    const sub = (v, span, n) => Math.max(0, Math.min(n - 1, Math.floor(v / span)));
    const sx = sub(p.cx, VIEW_W, room.sw), sy = sub(p.cy, VIEW_H, room.sh);
    let nx, ny;
    if (dir === 'right') { nx = room.rx + room.sw; ny = room.ry + sy; }
    else if (dir === 'left') { nx = room.rx - 1; ny = room.ry + sy; }
    else if (dir === 'down') { nx = room.rx + sx; ny = room.ry + room.sh; }
    else { nx = room.rx + sx; ny = room.ry - 1; }
    if (!hasRoom(this.mapId, room.floor, nx, ny)) return;

    const next = getRoom(this.mapId, room.floor, nx, ny);
    const endPos = this.entryPos(dir, p, next);
    if (this.map.scroll === false) {
      this.warpTo(this.mapId, this.room.floor, nx, ny, endPos, dir);
      return;
    }
    // Where the camera will be standing once the slide lands. The transition is
    // drawn in SCREEN space — one screen out, one screen in — so both rooms'
    // camera offsets have to be known up front rather than discovered at the
    // end. In a 1x1 room both are 0 and every term below vanishes.
    const camTo = Camera.snapped(next, {
      cx: endPos.x + (p.cx - p.x), cy: endPos.y + (p.cy - p.y),
    });
    this.transition = {
      dir, t: 0, from: this.room, to: next, nx, ny,
      fromCanvas: this.room.render(this.tide, this.frame),
      startFx: p.fx, startFy: p.fy,
      endPos,
      camFrom: { x: this.camera.x, y: this.camera.y },
      camTo: { x: camTo.x, y: camTo.y },
    };
    // Snapshot the outgoing room so animated tiles do not tick during the slide.
    const cox = -this.camera.x, coy = -this.camera.y;
    this.roomSnapshot.ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    this.roomSnapshot.ctx.drawImage(this.transition.fromCanvas, cox, coy);
    this.room.drawAnim(this.roomSnapshot.ctx, cox, coy, this.tide, this.frame);
    this.room.drawOver(this.roomSnapshot.ctx, cox, coy, this.tide, this.frame);
  }

  /**
   * Where the player lands in the room being entered.
   *
   * The coordinate ACROSS the seam is fixed by the direction; the one along it
   * is preserved in GLOBAL screen-grid space rather than in room space. A room
   * sits at `rx * VIEW_W` in that space, so walking north out of the right-hand
   * screen of a 2x1 room and into a 1x1 room above lands you at the same world
   * column you left from, not one screen west of it. When both rooms are keyed
   * to the same cell — every transition the game has today — the two origins
   * cancel and this is `p.y` untouched.
   *
   * The clamp then catches a neighbour that is genuinely shorter or narrower
   * than the room being left, where the preserved coordinate would land outside
   * its grid: every tile query there answers `void` and the player is wedged in
   * stone.
   */
  entryPos(dir, p, next) {
    const cur = this.room;
    const gx = cur.rx * VIEW_W + p.x, gy = cur.ry * VIEW_H + p.y;
    const rawX = gx - next.rx * VIEW_W, rawY = gy - next.ry * VIEW_H;
    // Clamped only where the neighbour is strictly the smaller room, so an
    // equal-sized pair — every transition in the game today — takes the raw
    // value through untouched and no existing replay can move.
    const x = next.pw < cur.pw ? Math.max(0, Math.min(rawX, next.pw - 16)) : rawX;
    const y = next.ph < cur.ph ? Math.max(0, Math.min(rawY, next.ph - 16)) : rawY;
    if (dir === 'right') return { x: -3, y };
    if (dir === 'left') return { x: next.pw - 13, y };
    if (dir === 'down') return { x, y: -8 };
    return { x, y: next.ph - 16 };
  }

  updateTransition() {
    const t = this.transition;
    t.t++;
    const k = t.t / ROOM_TRANSITION_FRAMES;
    const p = this.player;
    // Ease the player across the seam while the view slides. The whole slide
    // runs in subpixels: the incoming player sits at a negative x for a third
    // of it, which is exactly the case a truncating floor gets wrong.
    // The camera terms carry the player across the change of window as well as
    // the change of room: he is drawn relative to the OUTGOING window all the
    // way through the slide, so his room-space target has to absorb the
    // difference between the two cameras. Both are 0 in a 1x1 room.
    const dcx = t.camFrom.x - t.camTo.x, dcy = t.camFrom.y - t.camTo.y;
    const endFx = sp(t.endPos.x + (t.dir === 'right' ? VIEW_W : t.dir === 'left' ? -VIEW_W : 0) + dcx);
    const endFy = sp(t.endPos.y + (t.dir === 'down' ? VIEW_H : t.dir === 'up' ? -VIEW_H : 0) + dcy);
    p.fx = t.startFx + Math.round((endFx - t.startFx) * k);
    p.fy = t.startFy + Math.round((endFy - t.startFy) * k);
    p.animT++;
    if (t.t >= ROOM_TRANSITION_FRAMES) {
      this.setRoom(this.room.floor, t.nx, t.ny);
      p.x = t.endPos.x; p.y = t.endPos.y;
      p.lastSafe.x = p.x; p.lastSafe.y = p.y;
      p.reconcileWithTide(this);
      this.camera.snap(this.room, p);
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
   * Apply an action ('cut','bomb','fire','dredge','ring') to the
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
    const concrete = resolveTile(name, this.tide.levelAt(tx, ty, room)).name;
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
    const def = resolveTile(name, this.tide.levelAt(tx, ty, room));
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
    const f = this.room.flagsAt(tx, ty, this.tide);
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
    // The Ferryman's Coin fires on the turn of the tide, not on a button. The
    // swap is DEFERRED rather than done here: this runs while the wave front
    // is still crossing the screen, and warping the player mid-sweep leaves
    // the sweep drawing a room nobody is standing in.
    if (this.progress.coin) this.coinSwapPending = COIN_SWAP_DELAY_FRAMES;
    // A carving takes a tide cycle, and this is the only place the tide is
    // known to have turned. Counting frames instead would let a player who
    // never sounds the conch collect one anyway, which is the opposite of
    // what the scrimshander is for.
    this.tickCarving();
    this.roomEvent('tide', { next, prev });
  }

  /**
   * Trade places with the Ferryman's Coin. Works across rooms and across maps,
   * which is the whole point — a coin that only worked inside one screen would
   * be a shorter walk rather than a teleport.
   */
  runCoinSwap() {
    const c = this.progress.coin;
    const p = this.player;
    if (!c || !p) { this.progress.coin = null; return; }
    const from = {
      map: this.mapId, floor: this.room ? this.room.floor : 0,
      rx: this.room ? this.room.rx : 0, ry: this.room ? this.room.ry : 0,
      px: p.x, py: p.y,
    };
    for (const e of this.entities) if (e.sprite === 'i_coin') e.remove = true;
    this.audio.jingle('secret');
    const sameRoom = from.map === c.map && from.floor === c.floor
      && from.rx === c.rx && from.ry === c.ry;
    // A white fade, the same one a whirlpool uses: the swap is a hard cut, and
    // dressing it as one costs nothing and stops it reading as a glitch.
    this.fadeOut(() => {
      if (sameRoom) {
        p.x = c.px; p.y = c.py;
        p.lastSafe.x = p.x; p.lastSafe.y = p.y;
        p.reconcileWithTide(this);
      } else {
        this.enterMap(c.map, c.floor, c.rx, c.ry, c.px, c.py, p.dir, { instant: true });
      }
      // The coin lands where Link was standing, so the trade is a trade.
      this.progress.coin = from;
      this.pendingCoinDrop = true;
      this.placeCoinIfHere();
    }, true);
  }

  /** Put the coin back on the board after a swap, in whatever room it is in. */
  placeCoinIfHere() {
    if (!this.pendingCoinDrop) return;
    const c = this.progress.coin;
    if (!c) { this.pendingCoinDrop = false; return; }
    if (this.mapId !== c.map || !this.room) return;
    if (this.room.floor !== c.floor || this.room.rx !== c.rx || this.room.ry !== c.ry) return;
    this.pendingCoinDrop = false;
    const e = spawnEntity(this, 'coin', 0, 0, { placed: true });
    if (e) { e.x = c.px; e.y = c.py; }
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
    // A room-level tide clause has no single tile to ask about, so it reads the
    // BASE — what the conch was last set to. A puzzle that wants the local
    // level (stand in the held water and the door opens) names the tile it
    // means with `tideAt: [tx, ty]`.
    if (pz.tide != null) {
      const lvl = pz.tideAt
        ? this.tide.levelAt(pz.tideAt[0], pz.tideAt[1], room)
        : this.tide.level;
      if (lvl !== pz.tide) return;
    }
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
      if (id === 'reefseed') {
        p.maxReefseeds = Math.max(p.maxReefseeds, REEFSEED_CAPACITY);
        addReefseeds(p, this.reefseedCap(), this.reefseedCap());
      }
      if (id === 'bottle') {
        p.maxBottles = Math.max(p.maxBottles, BOTTLE_CAPACITY);
        addBottles(p, BOTTLE_CAPACITY);
      }
      this.presentItem(id, lv);
    } else if (chest.charm) {
      // Charms in the world came only out of the shop and the scrimshander's
      // random carve until P8 started placing them by hand, and a chest is the
      // natural fixture for that. Granted outright rather than dropped: a charm
      // is not in PICKUPS and a pickup that fell onto the wrong tile would lose
      // it (see docs/HANDOFF.md on the Compass that landed on a pot).
      giveCharm(p, chest.charm);
      this.audio.jingle('fanfareShort');
      this.say('A carved charm! Slot it on the CHARM screen.');
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
    // A charm case opens ON THE ESSENCE — see openCasesFor in scrimshaw.js for
    // why that is the reading and not the scrimshander's door. The news is
    // appended to the essence's own scene rather than said afterwards, because
    // a `say` fired while a cutscene is running is swallowed by it.
    const opened = openCasesFor(p);
    const cs = CUTSCENES['essence' + index] || CUTSCENES.essenceGeneric;
    if (opened.length && cs) {
      this.cutscene = runCutscene(this, cs.concat(opened.map(t => ({ say: t }))), { index });
      this.mode = 'cutscene';
      return;
    }
    this.startCutscene('essence' + index, { fallback: 'essenceGeneric', data: { index } });
  }

  spawnPickup(x, y, kind, o = {}) {
    const e = new Pickup(x, y, { kind, ...o });
    this.addEntity(e);
    return e;
  }

  /**
   * An enemy's loot. Two charms land here rather than on the Pickup itself,
   * because both are about what the DROP was worth at the moment it fell: a
   * rupee found on the floor is not made bigger by putting a charm on.
   */
  rollDrop(x, y, table) {
    const kind = rollDropTable(table, this.rng);
    if (!kind) return null;
    const spec = PICKUPS[kind];
    const o = {};
    if (spec && spec.worth != null && this.charm('beachcomber')) o.worth = spec.worth * 2;
    if (this.charm('gullsTally')) o.life = Math.round(PICKUP_LIFE_FRAMES * GULLS_TALLY_FACTOR);
    return this.spawnPickup(x, y, kind, o);
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

  /**
   * Is this charm working right now? The one question the rest of the engine
   * asks the scrimshaw system, and the successor to `hasRing`.
   *
   * It is a pure read of state computed once per frame, so it is safe from a
   * draw path — see `drawDarkness`, which asks it at display rate.
   */
  charm(id) { return this.scrim.has(id); }

  /**
   * Commission a carving. The blank and the rupees go now; the charm arrives
   * after CARVE_TIDE_TURNS changes of the tide, which is one full turn of the
   * conch. Which charm it will be is decided HERE rather than on collection,
   * off the global stream — the scrimshander is reading the bone, not taking
   * an order, and a run that reloads before collecting must get the same charm
   * back or the save would be a re-roll button.
   */
  commissionCarving() {
    const p = this.progress;
    const pool = Object.keys(CHARMS).filter(id => !p.charms[id]);
    if (!pool.length) return null;
    const id = pool[Math.floor(rngGlobal.float() * pool.length) % pool.length];
    p.carve = { id, turns: CARVE_TIDE_TURNS };
    return id;
  }

  /**
   * How many Reefseeds the satchel holds right now. The Quartermaster's Mark
   * raises the CEILING, so taking the charm off does not destroy seeds you are
   * already carrying — `addReefseeds` clamps on collection, not per frame.
   */
  reefseedCap() {
    const base = this.progress.maxReefseeds || 0;
    if (base <= 0) return 0;
    return base + (this.charm('quartermaster') ? QUARTERMASTER_BONUS : 0);
  }

  /** What a shopkeeper actually asks, after the Chandler's Eye. */
  shopPrice(base) {
    return this.charm('chandlersEye') ? Math.ceil(base * CHANDLER_FACTOR) : base;
  }

  /** One tide change gone by. Called from the Tide's own listener list. */
  tickCarving() {
    const p = this.progress;
    if (p.carve && p.carve.turns > 0) p.carve.turns--;
  }

  /** Hand over a finished carving, if there is one. */
  collectCarving() {
    const p = this.progress;
    if (!p.carve || p.carve.turns > 0) return null;
    const id = p.carve.id;
    p.carve = null;
    giveCharm(p, id);
    return id;
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
    this.tide.clearOverrides();
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
    if (extra === 'KeyU') { this.cycleAnchorRadius(); }
    if (extra === 'KeyY') { this.cycleAnchorShape(); }
    if (extra === 'KeyI') { this.debugCam = !this.debugCam; }

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
    // Before anything reads a charm this frame. It has to run above the
    // dialogue early-return too: a charm going dark while a text box is open
    // would be a rule the player never sees applied.
    this.scrim.update();
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

    // The coin's swap waits for the sweep to finish; see onTideChanged.
    if (this.coinSwapPending > 0 && --this.coinSwapPending === 0) this.runCoinSwap();
    this.placeCoinIfHere();

    this.updatePhaseShift();

    if (this.player) this.player.update(this);
    for (const e of this.entities) {
      if (e === this.player || e.remove) continue;
      if (e.update) e.update(this);
    }
    this.flushPending();
    this.entities = this.entities.filter(e => !e.remove);

    // AFTER the player has moved and before anything draws. Not during a
    // transition or a tide sweep — both return above this line, and a camera
    // moving under the sweep's snapshot would smear the wipe.
    this.camera.update(this.room, this.player);

    this.checkRoomExit();
    this.checkWarpTile();
    this.checkPuzzle();
  }

  // ------------------------------------------------------- phase-shifted foes
  //
  // An entity authored with `phase: n` only genuinely exists while the tide is
  // at level n. At any other level it is somewhere adjacent to the room rather
  // than in it: not drawn, not dangerous, and — this is the part that matters —
  // NOT HITTABLE, so a sword swing into an empty-looking room does not
  // silently connect with something the player cannot see.
  //
  // The Brineglass Lens is what changes that. While it is up, a phased-out
  // enemy is drawn as a ghost and can be hit. It still cannot hurt you: it is
  // not in your tide level, and a preview that could kill you would make the
  // Lens a risk rather than the thing that removes one.
  //
  // Note this pass runs BEFORE the entity updates, so an enemy's own update
  // sees the flags this sets on the same frame.

  updatePhaseShift() {
    const lensUp = this.player ? this.player.lensT > 0 : false;
    for (const e of this.entities) {
      if (e.phase == null || e.dead) continue;
      // The BASE level, deliberately: a phased enemy belongs to a tide state
      // of the world, not to the patch of floor it happens to stand on. An
      // anchor holding one corner of the room at MID must not summon half a
      // creature into it.
      const here = this.tide.level === e.phase;
      e.phasedOut = !here;
      if (here) {
        if (e._phaseWas) { e.hidden = false; e.harmless = !!e._phaseHarmless; e.alpha = null; }
        e._phaseWas = false;
        continue;
      }
      if (!e._phaseWas) { e._phaseWas = true; e._phaseHarmless = !!e.harmless; }
      // Never a threat from the other level, Lens or no Lens.
      e.harmless = true;
      e.hidden = !lensUp;
      e.alpha = lensUp ? LENS_PHASE_ALPHA : null;
      // `Entity.hurt` early-returns on invuln, which is how "not hittable" is
      // expressed without every damage source needing to learn about phases.
      // Re-armed every frame so it lapses the instant the Lens comes up.
      if (!lensUp) e.invuln = Math.max(e.invuln, 2);
    }
  }

  /** The Bottled Tide's one step. Kept here so bosses can watch for it. */
  forceTideStep() {
    if (!this.tide.force()) return false;
    this.roomEvent('bottle', { level: this.tide.level });
    return true;
  }

  /**
   * Move an entity to the nearest tile it can legally stand on. Used when
   * terrain appears underneath something — a Reefseed pillar growing on an
   * occupied tile is the case it exists for. `findSafeTile` already knows how
   * to search; this is the one-line policy on top of it.
   */
  /**
   * Search the floor at a tile with the Dredge Line. Reads the room's own
   * `buried` list — the same one the shovel read, because a world of water
   * should be searched by dredging it rather than by digging a hole in the
   * sea. One find per tile, recorded in `secrets` so it stays found.
   */
  dredgeTile(tx, ty, line) {
    const room = this.room;
    if (!room) return false;
    const buried = (room.def.buried || []).find(b => b[0] === tx && b[1] === ty);
    if (!buried) return false;
    const key = `${this.mapId}:${room.key}:dredge:${tx},${ty}`;
    if (this.progress.secrets[key]) return false;
    this.progress.secrets[key] = true;
    this.spawnPickup(tx * TILE, ty * TILE, buried[2], { grabDelay: 14 });
    this.audio.jingle('secret');
    this.roomEvent('dredge', { tx, ty });
    return true;
  }

  shoveOffTile(e) {
    const safe = findSafeTile(this, e);
    if (!safe) return false;
    e.x = safe.x; e.y = safe.y;
    this.spawnEffect('puff', e.x, e.y);
    return true;
  }

  // --------------------------------------------------------- anchor tuning
  //
  // ANCHOR_RADIUS_TILES and ANCHOR_SHAPE are `guessed` and are meant to be
  // settled by throwing the thing, not by arithmetic — so both are tunable in
  // the hand. KeyU cycles the radius 1-4 and back to the constant; KeyY swaps
  // the footprint between a square and a disc.
  //
  // Both re-apply to an anchor ALREADY DOWN, so the water changes shape under
  // the key press and two radii can be compared without re-throwing.
  //
  // NEITHER TOUCHES DETERMINISM. The default is null — meaning "use the
  // constant" — no replay or checker ever sets them, and the value is read once
  // at placement into the override's own `r`, so a recorded replay carries the
  // radius it was recorded with whatever the key was last left on.

  cycleAnchorRadius() {
    const cur = this.anchorRadius;
    this.anchorRadius = cur == null ? 1 : (cur >= 4 ? null : cur + 1);
    this.retuneAnchor();
    const shown = this.anchorRadius == null ? ANCHOR_RADIUS_TILES + ' (default)' : this.anchorRadius;
    this.bannerText = 'anchor radius ' + shown;
    this.bannerTime = BANNER_FRAMES;
  }

  cycleAnchorShape() {
    const cur = this.anchorShape || ANCHOR_SHAPE;
    this.anchorShape = cur === 'square' ? 'disc' : 'square';
    this.retuneAnchor();
    this.bannerText = 'anchor ' + this.anchorShape;
    this.bannerTime = BANNER_FRAMES;
  }

  retuneAnchor() {
    for (const o of this.tide.overrides) {
      if (o.src !== 'anchor') continue;
      o.r = this.anchorRadius != null ? this.anchorRadius : ANCHOR_RADIUS_TILES;
      o.shape = this.anchorShape || ANCHOR_SHAPE;
    }
    this.tide.touch();
    if (this.player) this.player.reconcileWithTide(this);
  }

  /** The local tide under Link, shown in the debug overlay when it differs. */
  debugTideHere() {
    if (!this.player || !this.room) return '';
    const tx = Math.floor(this.player.cx / TILE), ty = Math.floor(this.player.cy / TILE);
    const here = this.tide.levelAt(tx, ty, this.room);
    const r = this.anchorRadius != null ? this.anchorRadius : ANCHOR_RADIUS_TILES;
    const tail = ` r=${r}${this.anchorRadius == null ? '*' : ''}/${this.anchorShape || ANCHOR_SHAPE}`;
    return (here === this.tide.level ? '' : ` here=${here}`) + tail;
  }

  /**
   * Outline the held patch. Debug-only: in normal play the frozen edge has to
   * read from the water itself, and drawing a ring over the room would be a
   * confession that it does not.
   */
  drawAnchorField(ctx, ox, oy) {
    const room = this.room;
    if (!room) return;
    for (const o of this.tide.overrides) {
      if (o.mapId !== this.mapId || o.roomKey !== room.key) continue;
      ctx.fillStyle = 'rgba(120, 220, 255, 0.85)';
      for (let ty = 0; ty < room.th; ty++) {
        for (let tx = 0; tx < room.tw; tx++) {
          if (!this.tide.covers(o, tx, ty)) continue;
          // Only the boundary: a tile inside the patch whose neighbour is not.
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            if (this.tide.covers(o, tx + dx, ty + dy)) continue;
            const x = ox + tx * TILE, y = oy + ty * TILE;
            if (dx) ctx.fillRect(dx > 0 ? x + TILE - 1 : x, y, 1, TILE);
            else ctx.fillRect(x, dy > 0 ? y + TILE - 1 : y, TILE, 1);
          }
        }
      }
    }
  }

  /**
   * KeyI: the deadzone box and where the camera is in the room.
   *
   * Debug-only for the same reason the anchor's patch outline is: the three
   * camera constants are `guessed` and there is no reference to check them
   * against, so they are settled by watching the box and the player fight over
   * the view. Drawn in SCREEN space — this is the one thing on the playfield
   * that is about the window rather than about the room.
   */
  drawCameraDebug(ctx) {
    const room = this.room;
    if (!room) return;
    const dx = (VIEW_W - CAM_DEADZONE_W) / 2, dy = (VIEW_H - CAM_DEADZONE_H) / 2;
    ctx.strokeStyle = 'rgba(255, 216, 96, 0.9)';
    ctx.lineWidth = 1;
    ctx.strokeRect(dx + 0.5, HUD_H + dy + 0.5, CAM_DEADZONE_W - 1, CAM_DEADZONE_H - 1);
    // The room, drawn as a bar, with the camera window inside it. A 1x1 room
    // shows a full bar and a window that fills it, which is the picture of the
    // camera being a no-op there.
    const bw = 60, bx = SCREEN_W - bw - 2, by = HUD_H + 2;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(bx, by, bw, 6);
    ctx.fillStyle = 'rgba(140, 240, 255, 0.9)';
    ctx.fillRect(bx + Math.round(this.camera.x / room.pw * bw), by,
      Math.max(2, Math.round(VIEW_W / room.pw * bw)), 6);
    drawText(ctx, `cam ${this.camera.x},${this.camera.y} ${room.sw}x${room.sh}`,
      2, HUD_H + 2, '#ffd860');
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
    else this.drawScene(ctx, ox - this.camera.x, oy - this.camera.y);
    if (this.debugCam && !this.transition) this.drawCameraDebug(ctx);

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
    const base = room.render(this.tide, this.frame);

    if (this.tide.busy) {
      this.tide.drawSweep(ctx, ox, oy, base, () => {
        room.drawAnim(ctx, ox, oy, this.tide, this.frame);
        room.drawOver(ctx, ox, oy, this.tide, this.frame);
      });
      // Link keeps standing there while the water changes around him.
      if (this.player) this.player.draw(ctx, this, ox, oy);
      return;
    }

    ctx.drawImage(base, ox, oy);
    room.drawAnim(ctx, ox, oy, this.tide, this.frame);

    const list = this.entities.slice();
    if (this.player && !list.includes(this.player)) list.push(this.player);
    list.sort((a, b) => (a.depth * 1000 + a.y + a.h) - (b.depth * 1000 + b.y + b.h));
    for (const e of list) { if (e.drawShadow) e.drawShadow(ctx, this, ox, oy); }
    for (const e of list) {
      if (e.hidden) continue;
      e.draw(ctx, this, ox, oy);
    }

    room.drawOver(ctx, ox, oy, this.tide, this.frame);

    if (this.charm('wreckersEye')) this.drawWrecksGlimmer(ctx, ox, oy);
    if (this.player && this.player.lensT > 0) this.drawLensGhost(ctx, ox, oy);
    if (this.debug && this.tide.overrides.length) this.drawAnchorField(ctx, ox, oy);
    if (room.dark && !flag(this.progress, 'lantern')) this.drawDarkness(ctx, ox, oy);
    if (this.itemShow) this.drawItemShow(ctx);
  }

  /**
   * The Wrecker's Eye: unopened chests and dredgeable ground wink through the
   * terrain. A glimmer, not an outline — it says "there is something here"
   * without saying what, which is the difference between a hint and a map.
   *
   * NOTHING HERE CONSUMES RANDOMNESS. This is a draw path, and draw runs at
   * display rate while update runs at a fixed step, so a draw from a stream
   * would desync the run on a slow machine. The twinkle is a pure function of
   * `frame` and the tile's own coordinates — the same rule the screen shake
   * and the Lens shimmer follow.
   */
  drawWrecksGlimmer(ctx, ox, oy) {
    const room = this.room;
    if (!room) return;
    ctx.save();
    for (const e of this.entities) {
      if (!(e instanceof Chest) || e.opened) continue;
      this.glimmerAt(ctx, ox + e.x + 8, oy + e.y + 8, e.x + e.y);
    }
    for (let ty = 0; ty < room.th; ty++) {
      for (let tx = 0; tx < room.tw; tx++) {
        const name = room.baseName(tx, ty);
        if (!transformFor(name, 'dredge')) continue;
        this.glimmerAt(ctx, ox + tx * TILE + 8, oy + ty * TILE + 8, tx * 7 + ty * 13);
      }
    }
    ctx.restore();
  }

  glimmerAt(ctx, cx, cy, phase) {
    const t = (this.frame + phase * 9) % WRECK_GLIMMER_PERIOD;
    if (t > WRECK_GLIMMER_ON) return;
    const a = Math.sin(t / WRECK_GLIMMER_ON * Math.PI);
    ctx.globalAlpha = a * WRECK_GLIMMER_ALPHA;
    ctx.fillStyle = '#f8f8c0';
    ctx.fillRect(cx - 1, cy - 4, 2, 8);
    ctx.fillRect(cx - 4, cy - 1, 8, 2);
    ctx.globalAlpha = 1;
  }

  /**
   * The Brineglass Lens: the room as it will be at the NEXT tide level, laid
   * over the room as it is. Drawn ABOVE the entities and above `drawOver`, so
   * the preview reads as glass held in front of the scene rather than as part
   * of it — under them it looked like the room had already changed, which is
   * the one thing the Lens must never seem to say.
   *
   * Nothing here consumes randomness. `draw()` runs at display rate and the
   * shimmer is a plain function of `frame`, for the same reason the screen
   * shake uses noise1.
   */
  drawLensGhost(ctx, ox, oy) {
    const room = this.room;
    if (!room) return;
    const t = this.player.lensT / LENS_FADE_FRAMES;
    const lv = itemLevel(this.progress, 'lens');
    // L1 shows the next level. L2 shows both other levels, nearest first, so
    // the two ghosts are told apart by how solid they are.
    const levels = [(this.tide.level + 1) % TIDE_COUNT];
    if (lv >= 2) levels.push((this.tide.level + 2) % TIDE_COUNT);

    const shimmer = 0.88 + 0.12 * Math.sin(this.frame * (Math.PI * 2 / LENS_SHIMMER_FRAMES));
    ctx.save();
    ctx.globalAlpha = LENS_TINT_ALPHA * t;
    ctx.fillStyle = '#a8f0e8';
    ctx.fillRect(ox, oy, room.pw, room.ph);
    for (let i = 0; i < levels.length; i++) {
      ctx.globalAlpha = (LENS_GHOST_ALPHA * t * shimmer) / (i + 1);
      // The FIELD at that base, not the bare level: an anchored patch is the
      // one part of the room that will not change, and the preview has to say
      // so. See Tide.viewAt.
      ctx.drawImage(room.renderAt(this.tide.viewAt(levels[i]), this.frame), ox, oy);
    }
    ctx.restore();
  }

  drawTransition(ctx, ox, oy) {
    const t = this.transition;
    const k = t.t / ROOM_TRANSITION_FRAMES;
    const d = { right: [-1, 0], left: [1, 0], down: [0, -1], up: [0, 1] }[t.dir];
    const sx = Math.round(d[0] * VIEW_W * k), sy = Math.round(d[1] * VIEW_H * k);
    ctx.drawImage(this.roomSnapshot.canvas, ox + sx, oy + sy);
    const nb = t.to.render(this.tide, this.frame);
    // The snapshot is already a screen window; the incoming room is a whole
    // room canvas, so it is blitted back by the camera it will arrive under.
    const nx = ox + sx - d[0] * VIEW_W - t.camTo.x, ny = oy + sy - d[1] * VIEW_H - t.camTo.y;
    ctx.drawImage(nb, nx, ny);
    t.to.drawAnim(ctx, nx, ny, this.tide, this.frame);
    t.to.drawOver(ctx, nx, ny, this.tide, this.frame);
    if (this.player) this.player.draw(ctx, this, ox + sx - t.camFrom.x, oy + sy - t.camFrom.y);
  }

  drawDarkness(ctx, ox, oy) {
    const p = this.player;
    const cx = ox + (p ? p.cx : VIEW_W / 2), cy = oy + (p ? p.cy : VIEW_H / 2);
    // Two charms carry a light, one in the MID case and one in the HIGH: the
    // Lamplighter's Wick and the Drowned Lantern do the same thing at
    // different tides, on purpose. A dark room you can cross at MID and not at
    // HIGH is a room the tide has made darker, which is the point.
    const lit = this.charm('lamplighter') || this.charm('drownedLantern');
    const r = lit ? LANTERN_RADIUS : 54;
    const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.7, lit ? 'rgba(0,0,0,0.30)' : 'rgba(0,0,0,0.55)');
    g.addColorStop(1, lit ? 'rgba(0,0,0,0.60)' : 'rgba(0,0,0,0.88)');
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
      `${this.mapId} ${this.room ? this.room.key : '-'} tide=${this.tide.level}${this.debugTideHere()}`,
      p ? `x=${p.x.toFixed(0)} y=${p.y.toFixed(0)} z=${p.z.toFixed(1)} ${p.dir}` : '',
      `ents=${this.entities.length} fps~${this.fps || 0}`,
    ];
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, SCREEN_H - 28, SCREEN_W, 28);
    lines.forEach((l, i) => drawText(ctx, l, 2, SCREEN_H - 27 + i * 9, '#8fa'));
  }
}
