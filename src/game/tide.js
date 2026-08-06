// The tide: a single global three-state variable that every tide tile in the
// world resolves against. This is the game's fundamental mechanic.
//
//   0 = LOW   sandbars and seafloor exposed, caves open, channels wadeable
//   1 = MID   the world's default state
//   2 = HIGH  shallows become deep, low walls submerge, rafts float to high ledges
//
// The Moon Conch cycles LOW -> MID -> HIGH -> LOW. Two presses reach any state.

import { VIEW_W, VIEW_H, offscreen } from '../core/screen.js';
import { F } from '../world/tileset.js';
import { TIDE_SWEEP_FRAMES } from '../data/feel.js';

export const TIDE_NAMES = ['LOW', 'MID', 'HIGH'];
export const TIDE_COUNT = 3;

export class Tide {
  constructor(game) {
    this.game = game;
    this.level = 1;
    this.prevLevel = 1;
    this.sweep = 0;            // 0 = idle, otherwise counts up to TIDE_SWEEP_FRAMES
    this.snapshot = null;      // pre-change render of the current room
    this.locked = false;       // room forbids tide changes
    this.forced = null;        // room pins the tide to a level
    this.listeners = [];
  }

  get busy() { return this.sweep > 0; }

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
      if (!this.snapshot) this.snapshot = offscreen(VIEW_W, VIEW_H);
      this.snapshot.ctx.clearRect(0, 0, VIEW_W, VIEW_H);
      const before = g.room.render(this.level, g.frame);
      this.snapshot.ctx.drawImage(before, 0, 0);
      g.room.drawAnim(this.snapshot.ctx, 0, 0, this.level, g.frame);
      g.room.drawOver(this.snapshot.ctx, 0, 0, this.level, g.frame);
      this.sweep = 1;
    }

    this.level = next;
    if (g.progress) g.progress.tide = next;
    if (g.room) g.room.invalidate();
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
