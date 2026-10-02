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
// CENTRING, ONE PIXEL A FRAME
//
// As Seasons' updateCameraPosition (oracles-disasm bank1.s): the target is
// the camera that puts Link's centre in the middle of the view, clamped to the
// room, and the camera steps CAM_MAX_SPEED toward it each frame — so a walking
// Link drifts ahead of the middle and the view catches up when he stops, and
// a knockback or a warp cannot snap the view. There is no deadzone: S147 gave
// it one from footage, S171 read the cartridge and took it out.

// THE CAMERA IS NOT PART OF THE RENDER CACHE KEY, IN EITHER DIRECTION.
//
// Moving the camera does not change what the room looks like — it changes which
// part of it you can see — so `Room.cacheKeyFor` stays exactly as P5 left it and
// nothing in this file may ever call `room.invalidate()`. Keying the cache on
// the camera would re-render the whole room every frame you walk; letting the
// camera invalidate it would throw away the tide field's stamp discipline. Both
// are silent, and both are traps.

import { VIEW_W, VIEW_H } from '../core/screen.js';
import { CAM_MAX_SPEED } from '../data/feel.js';

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

export class Camera {
  constructor() {
    this.x = 0; this.y = 0;
  }

  maxX(room) { return Math.max(0, room.pw - VIEW_W); }
  maxY(room) { return Math.max(0, room.ph - VIEW_H); }

  /**
   * Put the camera where it would sit if the player had always been at `p`.
   * Used on room entry and on any teleport: Seasons' calculateCameraPosition,
   * the same centred-and-clamped target set at once instead of a pixel a frame.
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

    // Seasons' target: Link's centre in the middle of the view.
    let wantX = p.cx - VIEW_W / 2, wantY = p.cy - VIEW_H / 2;

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
