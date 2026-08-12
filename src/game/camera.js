// Camera: which 160x128 window of the current room is on screen.
//
// WHY THIS IS A NO-OP IN EVERY 1x1 ROOM, AND WHY THAT IS THE MECHANISM
//
// A 1x1 room is exactly one screen, so `room.pw - VIEW_W` and
// `room.ph - VIEW_H` are both 0, so the clamp below has a single legal value
// and `x`/`y` are 0 forever. That is not a convention and it is not an early
// return that someone could delete: it falls out of the clamp. Every existing
// room in the game is 1x1, and it is what guarantees that this file cannot
// alter a single pixel of any of them — the replays prove it, but the clamp is
// the reason they can.
//
// DEADZONE, NOT CENTRING
//
// The source games do not keep Link in the middle of a large room. The view
// holds still while he moves around inside it and only gives way when he
// pushes at an edge. So: a box in VIEW space; while Link's centre is inside it
// the camera does not move at all; when he leaves it the camera moves by
// exactly enough to put him back on the boundary, capped at CAM_MAX_SPEED so a
// knockback or a warp cannot snap the view.
//
// The three constants are in feel.js and all three are `guessed`. Nobody has
// frame-stepped a reference for them; `KeyI` draws the box so they can be
// settled by play, which is the same argument the anchor radius got.
//
// THE CAMERA IS NOT PART OF THE RENDER CACHE KEY, IN EITHER DIRECTION.
//
// Moving the camera does not change what the room looks like — it changes which
// part of it you can see — so `Room.cacheKeyFor` stays exactly as P5 left it and
// nothing in this file may ever call `room.invalidate()`. Keying the cache on
// the camera would re-render the whole room every frame you walk; letting the
// camera invalidate it would throw away the tide field's stamp discipline. Both
// are silent, and both are traps.

import { VIEW_W, VIEW_H } from '../core/screen.js';
import { CAM_DEADZONE_W, CAM_DEADZONE_H, CAM_MAX_SPEED } from '../data/feel.js';

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

export class Camera {
  constructor() {
    this.x = 0; this.y = 0;
  }

  maxX(room) { return Math.max(0, room.pw - VIEW_W); }
  maxY(room) { return Math.max(0, room.ph - VIEW_H); }

  /**
   * Put the camera where it would sit if the player had always been at `p`.
   * Used on room entry and on any teleport: the deadzone is a history-dependent
   * rule and a room you have just arrived in has no history.
   *
   * Centred-and-clamped rather than deadzoned, because the entry point of a
   * wide room is almost always at one end and the clamp resolves it to that end
   * anyway.
   */
  snap(room, p) {
    if (!room) { this.x = 0; this.y = 0; return this; }
    const cx = p ? p.cx : room.pw / 2, cy = p ? p.cy : room.ph / 2;
    this.x = clamp(Math.round(cx - VIEW_W / 2), 0, this.maxX(room));
    this.y = clamp(Math.round(cy - VIEW_H / 2), 0, this.maxY(room));
    return this;
  }

  /** Where `snap` would put a camera, without disturbing this one. */
  static snapped(room, p) { return new Camera().snap(room, p); }

  /**
   * One frame of following. Call AFTER the player has moved and BEFORE anything
   * draws, and never during a tide sweep — the sweep holds a snapshot of the
   * room and a camera moving under it would smear the wipe.
   */
  update(room, p) {
    if (!room) return;
    const mx = this.maxX(room), my = this.maxY(room);
    if (mx === 0 && my === 0) { this.x = 0; this.y = 0; return; }
    if (!p) { this.x = clamp(this.x, 0, mx); this.y = clamp(this.y, 0, my); return; }

    // The deadzone in ROOM space, i.e. the box slid to where the camera is.
    const dzx0 = this.x + (VIEW_W - CAM_DEADZONE_W) / 2;
    const dzx1 = dzx0 + CAM_DEADZONE_W;
    const dzy0 = this.y + (VIEW_H - CAM_DEADZONE_H) / 2;
    const dzy1 = dzy0 + CAM_DEADZONE_H;

    let wantX = this.x, wantY = this.y;
    if (p.cx < dzx0) wantX = this.x - (dzx0 - p.cx);
    else if (p.cx > dzx1) wantX = this.x + (p.cx - dzx1);
    if (p.cy < dzy0) wantY = this.y - (dzy0 - p.cy);
    else if (p.cy > dzy1) wantY = this.y + (p.cy - dzy1);

    wantX = clamp(Math.round(wantX), 0, mx);
    wantY = clamp(Math.round(wantY), 0, my);
    this.x = step(this.x, wantX);
    this.y = step(this.y, wantY);
  }
}

/** Move at most CAM_MAX_SPEED whole pixels toward a target. */
function step(from, to) {
  const d = to - from;
  if (d === 0) return from;
  if (Math.abs(d) <= CAM_MAX_SPEED) return to;
  return from + Math.sign(d) * CAM_MAX_SPEED;
}
