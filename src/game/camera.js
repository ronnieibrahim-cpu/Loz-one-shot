// The camera. Only multi-screen dungeon rooms have one that moves.
//
// WHAT IT IS: the top-left corner, in room pixels, of the VIEW_W x VIEW_H
// window the player is looking through. `drawScene` subtracts it from every
// world coordinate; nothing else needs to know it exists.
//
// WHY A 1x1 ROOM IS SAFE BY CONSTRUCTION, rather than by care: the clamp is
// `[0, room.pw - VIEW_W]`, and in a one-screen room `pw === VIEW_W`, so both
// ends of that range are 0 and every clamp returns 0. There is no branch to
// forget and no room where the camera "should" be disabled — it is arithmetic.
// That is the mechanism behind the brief's "nothing here may alter a single
// pixel in a 1x1 room".
//
// DEADZONE, NOT CENTRING. The source holds the camera still until Link nears
// the edge of a box and then moves only as far as it must. A camera centred on
// the player every frame is a different, worse thing: it moves constantly, it
// makes the room feel like it is sliding under you, and it is what
// tools/replay.mjs's camera assertion exists to catch.

import { VIEW_W, VIEW_H, TILE } from '../core/screen.js';
import {
  CAM_DEADZONE_W, CAM_DEADZONE_H, CAM_MAX_SPEED, CAM_ACTIVATE_MARGIN,
} from '../data/feel.js';

function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

export class Camera {
  constructor(game) {
    this.game = game;
    this.x = 0;
    this.y = 0;
  }

  /** The furthest the window may travel in each axis. Zero in a 1x1 room. */
  limits(room) {
    return [Math.max(0, room.pw - VIEW_W), Math.max(0, room.ph - VIEW_H)];
  }

  /** Where the window WANTS to be, honouring the deadzone. */
  target(room, px, py) {
    const [mx, my] = this.limits(room);
    // Link's position inside the current window.
    const vx = px - this.x, vy = py - this.y;
    const l = VIEW_W / 2 - CAM_DEADZONE_W, r = VIEW_W / 2 + CAM_DEADZONE_W;
    const t = VIEW_H / 2 - CAM_DEADZONE_H, b = VIEW_H / 2 + CAM_DEADZONE_H;
    let nx = this.x, ny = this.y;
    if (vx < l) nx = this.x + (vx - l);
    else if (vx > r) nx = this.x + (vx - r);
    if (vy < t) ny = this.y + (vy - t);
    else if (vy > b) ny = this.y + (vy - b);
    return [clamp(Math.round(nx), 0, mx), clamp(Math.round(ny), 0, my)];
  }

  /**
   * Put the window where it belongs immediately.
   *
   * [A7] Room entry and respawn SNAP. A camera that eased into position on a
   * room entry would show the player a pan they did not ask for, and on
   * respawn it would animate away from the death they just watched.
   * CAM_MAX_SPEED governs play and nothing else.
   */
  snap(room, px, py) {
    const [mx, my] = this.limits(room);
    const [tx, ty] = this.target(room, px, py);
    this.x = clamp(tx, 0, mx);
    this.y = clamp(ty, 0, my);
  }

  /** One frame of following, rate-limited. Called after the player has moved. */
  update(room, px, py) {
    const [tx, ty] = this.target(room, px, py);
    const dx = tx - this.x, dy = ty - this.y;
    if (dx) this.x += clamp(dx, -CAM_MAX_SPEED, CAM_MAX_SPEED);
    if (dy) this.y += clamp(dy, -CAM_MAX_SPEED, CAM_MAX_SPEED);
  }

  /** Is the window flush against the room's far edge on this axis? */
  atClamp(room, axis) {
    const [mx, my] = this.limits(room);
    return axis === 'x' ? this.x >= mx : this.y >= my;
  }

  /**
   * The deadzone box and the window's travel, on KeyC. [A1]: KeyC rather than
   * the plan's KeyI (never whitelisted, would have done nothing) or the
   * review's KeyU (P5's anchor-radius cycle).
   *
   * Drawn in SCREEN space — it describes the window, not the room.
   */
  drawDebug(ctx, sox, soy, room) {
    if (!this.debug) return;
    const [mx, my] = this.limits(room);
    ctx.save();
    ctx.strokeStyle = '#f8f860';
    ctx.strokeRect(sox + VIEW_W / 2 - CAM_DEADZONE_W + 0.5, soy + VIEW_H / 2 - CAM_DEADZONE_H + 0.5,
      CAM_DEADZONE_W * 2, CAM_DEADZONE_H * 2);
    ctx.fillStyle = '#f8f860';
    ctx.fillText(`cam ${this.x},${this.y} / ${mx},${my}`, sox + 3, soy + 9);
    ctx.restore();
  }

  /**
   * [A3] Should this entity be simulated?
   *
   * Off-camera entities FREEZE — not despawn, not cull. The reason is P4:
   * a ground enemy draws from the seeded per-room stream to pick a direction
   * and replay.mjs asserts `game.rng.draws` at every checkpoint, so updating
   * three screens of enemies in a 3x1 room would draw from that stream about
   * three times as often and move every existing replay's numbers for reasons
   * that have nothing to do with the player.
   *
   * THE TEST IS ON THE ENTITY'S TILE, not its pixel, AND IT HAS HYSTERESIS.
   * Tile-quantising alone is not enough, which a unit test caught: the window
   * itself moves, so an enemy sitting exactly on the boundary flips every time
   * the camera crosses a tile — and the camera oscillates by a pixel whenever
   * the player jitters at the edge of the deadzone. That is precisely the
   * "steps in and out of the simulation on alternate frames" failure, arriving
   * by a different route than the pixel-vs-tile one.
   *
   * So an enemy WAKES at CAM_ACTIVATE_MARGIN and does not sleep again until
   * CAM_ACTIVATE_MARGIN + 1. The two boundaries differ by a whole tile, so no
   * amount of sub-tile camera motion can flip one. `_camLive` is per entity and
   * is a pure function of the frame sequence, so it replays identically.
   */
  isLive(e) {
    // ONLY ENEMIES FREEZE, and that is narrower than "everything off camera"
    // on purpose. The determinism argument is specifically about enemy AI:
    // that is what draws from the per-room stream every time it picks a
    // direction. Nothing else does so per frame.
    //
    // Freezing the rest would also be a leak. A Pickup counts its own `life`
    // down in `update` and removes itself at zero; a frozen one never expires,
    // so a wide room would accumulate every rupee that ever dropped out of
    // shot. Projectiles remove themselves on leaving the room the same way.
    // Both are short-lived and neither is worth a frame of simulation saved.
    if (!e.isEnemy) return true;
    if (e === this.game.player || e.isBoss || e.alwaysUpdate) return true;
    // Wider band to fall asleep in than to wake in: that gap is the hysteresis.
    const m = e._camLive ? CAM_ACTIVATE_MARGIN + 1 : CAM_ACTIVATE_MARGIN;
    const tx = Math.floor(e.cx / TILE), ty = Math.floor(e.cy / TILE);
    const x0 = Math.floor(this.x / TILE) - m, y0 = Math.floor(this.y / TILE) - m;
    const x1 = Math.floor((this.x + VIEW_W - 1) / TILE) + m;
    const y1 = Math.floor((this.y + VIEW_H - 1) / TILE) + m;
    e._camLive = tx >= x0 && tx <= x1 && ty >= y0 && ty <= y1;
    return e._camLive;
  }
}
