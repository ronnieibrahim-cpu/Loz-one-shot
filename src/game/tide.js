// The tide: a three-state FIELD that every tide tile in the world resolves
// against. This is the game's fundamental mechanic.
//
//   0 = LOW   sandbars and seafloor exposed, caves open, channels wadeable
//   1 = MID   the world's default state
//   2 = HIGH  shallows become deep, low walls submerge, rafts float to high ledges
//
// The Moon Conch cycles LOW -> MID -> HIGH -> LOW. Two presses reach any state.
//
// A FIELD, NOT A GLOBAL
//
// `level` is the BASE: what the conch last set, what the HUD gauge shows, what
// the save file stores. It is not what the water is doing at a given tile.
// `levelAt(tx, ty)` is, and almost everything wants that one — collision, tile
// resolution, rendering, enemies, the raft. A local OVERRIDE (the Tidewright's
// Anchor lays one) holds a disc of tiles at whatever level was current when it
// landed while the rest of the room goes on obeying the conch, so a room can be
// dry here and flooded there.
//
// Overrides are ROOM-SCOPED. Each carries the map and room it was laid in, and
// `levelAt` takes the room it is being asked about — defaulting to the one the
// game is in, but passed explicitly by Room's own queries. That is what keeps a
// room-slide transition correct for nothing: the outgoing room resolves against
// its own overrides and the incoming room against its, in the same frame.
//
// `stamp` bumps on ANY change to the base or the override list, and Room caches
// its rendered tile layer against it. Miss a bump and the room draws the old
// water while collision uses the new — it looks wrong and nothing fails.

import { VIEW_W, VIEW_H, offscreen } from '../core/screen.js';
import { F } from '../world/tileset.js';
import { TIDE_SWEEP_FRAMES } from '../data/feel.js';

export const TIDE_NAMES = ['LOW', 'MID', 'HIGH'];
export const TIDE_COUNT = 3;

export class Tide {
  constructor(game) {
    this.game = game;
    this.level = 1;            // the BASE level — see levelAt for the field
    this.prevLevel = 1;
    this.sweep = 0;            // 0 = idle, otherwise counts up to TIDE_SWEEP_FRAMES
    this.snapshot = null;      // pre-change render of the current room
    this.locked = false;       // room forbids tide changes
    this.forced = null;        // room pins the tide to a level
    this.listeners = [];
    // { id, mapId, roomKey, tx, ty, r, level } — a disc of tiles held at `level`.
    this.overrides = [];
    this.stamp = 0;
    this._nextId = 1;
  }

  get busy() { return this.sweep > 0; }

  // ------------------------------------------------------------- the field

  /**
   * The tide level at one tile of one room, 0-2.
   *
   * PASS `room` EXPLICITLY FROM ANY DRAW PATH. It defaults to the room the game
   * is in, which is right for game logic — an entity asking about the water it
   * is standing in is asking about the room it is standing in. It is WRONG
   * during a room-slide transition, where two rooms are on screen at once and
   * one of them is not `game.room`. Room's own queries pass `this`, so anything
   * going through `room.tile`/`flagsAt`/`solidAt`/`render` is already correct;
   * the rule binds direct callers of this method.
   *
   * LAST PLACED WINS. Overlapping overrides are searched newest-first, so two
   * anchors covering the same tile give a defined answer instead of one that
   * depends on the order the list happens to be in. (The Anchor allows only one
   * at a time, so today this never arises — it is defined so that the day a
   * second source of overrides appears, the behaviour is a decision rather than
   * an accident.)
   */
  levelAt(tx, ty, room) {
    const list = this.overrides;
    if (list.length) {
      const r = room !== undefined ? room : this.game.room;
      if (r) {
        const mapId = this.game.mapId, key = r.key;
        for (let i = list.length - 1; i >= 0; i--) {
          const o = list[i];
          if (o.roomKey !== key || o.mapId !== mapId) continue;
          if (this.covers(o, tx, ty)) return o.level;
        }
      }
    }
    return this.level;
  }

  /**
   * Is this tile inside the override's footprint?
   *
   * Two shapes, because at this scale the shape is legible to the player and
   * has to be predictable. A radius-2 Euclidean disc is 13 tiles and reads as a
   * fat plus sign — hard to eyeball the edge of. A square of the same radius is
   * 5x5 and reads as a clean region you can see the corners of. `square` is the
   * default for that reason; the debug key toggles between them so the choice
   * can be made by throwing the thing. See ANCHOR_SHAPE in feel.js.
   */
  covers(o, tx, ty) {
    const dx = Math.abs(tx - o.tx), dy = Math.abs(ty - o.ty);
    if (o.shape === 'disc') return dx * dx + dy * dy <= o.r * o.r;
    return dx <= o.r && dy <= o.r;
  }

  /** True if any override is live in this room — the cheap test for "is it split". */
  hasOverrideIn(room) {
    const key = room ? room.key : null;
    return this.overrides.some(o => o.roomKey === key && o.mapId === this.game.mapId);
  }

  overrideById(id) { return this.overrides.find(o => o.id === id) || null; }

  /**
   * Lay a local override. Returns its id.
   *
   * The caller owns the consequences: an override can put the player inside
   * water or a wall, so whoever adds one is responsible for reconciling the
   * player afterwards (see the Anchor, which refuses the placement outright
   * rather than drowning anyone).
   */
  addOverride({ mapId, roomKey, tx, ty, r, level, shape = 'square', src = null }) {
    // `src` names what laid it ('anchor'), which is how the item finds its own
    // override again from another room. Dropping it here was worth a session:
    // the anchor landed, the field was right, and the item could never see it.
    const o = { id: this._nextId++, mapId, roomKey, tx, ty, r, level, shape, src };
    this.overrides.push(o);
    this.touch();
    return o.id;
  }

  removeOverride(id) {
    const i = this.overrides.findIndex(o => o.id === id);
    if (i < 0) return false;
    this.overrides.splice(i, 1);
    this.touch();
    return true;
  }

  clearOverrides() {
    if (!this.overrides.length) return;
    this.overrides.length = 0;
    this.touch();
  }

  /**
   * Everything that changes the field goes through here.
   *
   * `stamp` IS MONOTONIC AND IS NEVER RESET — not by clearOverrides, not by a
   * new game, not by a load. Rooms cache their rendered tile layer against it,
   * and Room objects outlive a new game, so a stamp that went back to 0 could
   * collide with a key a cached canvas was already holding and render stale
   * water that nothing would flag. It only ever goes up.
   */
  touch() {
    this.stamp++;
    const g = this.game;
    if (g && g.room) g.room.invalidate();
  }

  /** Room rules: some rooms pin or forbid the tide. Called on every room entry. */
  applyRoomRules(room) {
    const d = room ? room.def : null;
    this.locked = !!(d && d.noTide);
    this.forced = (d && d.tideForce != null) ? d.tideForce : null;
    if (this.forced != null && this.level !== this.forced) {
      this.setLevel(this.forced, { instant: true });
    }
  }

  /** Why a conch press failed, or null if it would succeed. */
  blockedReason() {
    if (this.busy) return 'busy';
    if (this.forced != null) return 'forced';
    if (this.locked) return 'locked';
    return null;
  }

  cycle() {
    const why = this.blockedReason();
    if (why) return why;
    this.setLevel((this.level + 1) % TIDE_COUNT);
    return null;
  }

  setLevel(next, { instant = false } = {}) {
    next = ((next % TIDE_COUNT) + TIDE_COUNT) % TIDE_COUNT;
    if (next === this.level && !instant) return;
    const g = this.game;
    this.prevLevel = this.level;

    if (!instant && g.room) {
      // Snapshot the room as it looks now so the sweep can wipe between states.
      // `this` is the field, and the base has not moved yet, so the snapshot
      // carries the old water everywhere the conch reaches and the held water
      // everywhere an override does.
      if (!this.snapshot) this.snapshot = offscreen(VIEW_W, VIEW_H);
      this.snapshot.ctx.clearRect(0, 0, VIEW_W, VIEW_H);
      const before = g.room.render(this, g.frame);
      this.snapshot.ctx.drawImage(before, 0, 0);
      g.room.drawAnim(this.snapshot.ctx, 0, 0, this, g.frame);
      g.room.drawOver(this.snapshot.ctx, 0, 0, this, g.frame);
      this.sweep = 1;
    }

    this.level = next;
    if (g.progress) g.progress.tide = next;
    this.touch();
    for (const fn of this.listeners) fn(next, this.prevLevel, g);
    if (g.onTideChanged) g.onTideChanged(next, this.prevLevel);
  }

  update() {
    if (this.sweep > 0) {
      this.sweep++;
      if (this.sweep > TIDE_SWEEP_FRAMES) this.sweep = 0;
    }
  }

  /** Progress of the wipe, 0..1. */
  get sweepT() { return this.sweep > 0 ? Math.min(1, this.sweep / TIDE_SWEEP_FRAMES) : 1; }

  /**
   * Draw the room during a tide change: old state, then the new state revealed
   * behind an advancing wave front with foam at its edge.
   */
  drawSweep(ctx, ox, oy, newCanvas, drawNewExtras) {
    const t = this.sweepT;
    const front = Math.round(t * (VIEW_W + 40)) - 20;
    // old state on the right of the front
    if (this.snapshot) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(ox + Math.max(0, front), oy, VIEW_W, VIEW_H);
      ctx.clip();
      ctx.drawImage(this.snapshot.canvas, ox, oy);
      ctx.restore();
    }
    // new state on the left
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, Math.max(0, Math.min(VIEW_W, front)), VIEW_H);
    ctx.clip();
    ctx.drawImage(newCanvas, ox, oy);
    if (drawNewExtras) drawNewExtras();
    ctx.restore();

    // foam column at the wave front
    const rising = this.level > this.prevLevel || (this.prevLevel === 2 && this.level === 0);
    const pal = rising ? ['#ffffff', '#b0e8f8', '#58b0e0'] : ['#ffffff', '#e0c078', '#a88048'];
    for (let i = 0; i < 3; i++) {
      const x = front - i * 3;
      if (x < 0 || x >= VIEW_W) continue;
      ctx.fillStyle = pal[i];
      for (let y = 0; y < VIEW_H; y += 2) {
        const wob = Math.sin((y * 0.35) + this.sweep * 0.5) * 3;
        ctx.fillRect(ox + Math.round(x + wob), oy + y, 2, 2);
      }
    }
  }
}

/** Does this tile become impassable on foot at the given tide? (for hint UI) */
export function tileDrowns(flagsAtLevel) {
  return !!(flagsAtLevel & (F.DEEP | F.SOLID));
}
