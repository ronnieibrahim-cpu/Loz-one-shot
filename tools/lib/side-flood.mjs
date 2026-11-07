// THE SIDE-VIEW FLOOD (S242, docs/briefs/SIDE-VIEW.md stage 2): where Link
// can be in a side-view passage (a room with `side: true`), cell by cell, with
// the movement src/game/sideview.js gives him there — taught here once, and
// asked by tools/lib/dungeon-flood.mjs (every dungeon tool) and
// tools/check-sideview.mjs alike, so the two cannot drift apart.
//
// A state is the cell his middle is in at a sea. The verbs, as sideview.js:
//   WALK     standing (something solid, or a ladder's top, under him), left
//            and right.
//   FALL     off the ground and off a ladder he falls; while falling he can
//            drift a cell sideways for each cell he drops (from rest he
//            falls 16 px in about 15 frames and walks 15 px in them).
//   LADDER   on a ladder (or its top) four ways; standing on a ladder's top,
//            down onto it.
//   SWIM     in water WITH the Cleats every way; floor mode (sinking to the
//            bed) reaches nothing swimming does not, so it is the same verb
//            here. WITHOUT them water drowns him and he is washed back to the
//            place he came in (`Player.updateWashing`, the cartridge's rule).
//   HOP      leaving the water upward he hops (SV_HOP, about 9 px): into the
//            cell above the surface and a cell either side of it.
//   CONCH    (unless the sea is held) the sea changes under him wherever he
//            is: dry -> he falls or stands; wet without the Cleats -> washed.
// The collision is the room's own tiles (`room.tile`, flags SOLID/VOID/DEEP
// and the `sv` field); nothing here decides what a tile is.
//
// Plain Node, after installData().

import { F } from '../../src/world/tileset.js';

const isLadderDef = d => !!d && (d.sv === 'ladder' || d.sv === 'ladderTop');

/** The questions a side room's tiles answer at sea t. */
export function sideCells(room) {
  const W = room.tw, H = room.th;
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const def = (x, y, t) => room.tile(x, y, t);
  const solid = (x, y, t) => !inb(x, y) || !!(def(x, y, t).flags & (F.SOLID | F.VOID));
  const wet = (x, y, t) => inb(x, y) && !!(def(x, y, t).flags & F.DEEP);
  const ladder = (x, y, t) => inb(x, y) && isLadderDef(def(x, y, t));
  const ladderTop = (x, y, t) => inb(x, y) && def(x, y, t).sv === 'ladderTop';
  const warp = (x, y, t) => inb(x, y) && !!(def(x, y, t).flags & F.WARP);
  const supported = (x, y, t) => solid(x, y + 1, t) || ladderTop(x, y + 1, t);
  /** A place he can be at rest: standing, on a ladder, or swimming. */
  const rest = (x, y, t, cleats) => !solid(x, y, t)
    && (ladder(x, y, t) || (wet(x, y, t) ? cleats : supported(x, y, t)));
  return { W, H, inb, solid, wet, ladder, ladderTop, warp, supported, rest };
}

/**
 * One step from (x, y) at sea t: the states his own movement takes him to,
 * at the same sea. Returns [[x, y], ...]; `drown` is set when the cell
 * drowns him (wet, no Cleats) and he goes nowhere under his own power.
 */
export function sideSteps(C, x, y, t, cleats) {
  const out = [];
  const add = (nx, ny) => { if (!C.solid(nx, ny, t)) out.push([nx, ny]); };
  if (C.wet(x, y, t)) {
    if (!cleats) return { out, drown: true };
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) add(x + dx, y + dy);
    if (!C.wet(x, y - 1, t) && !C.solid(x, y - 1, t)) {
      for (const dx of [-1, 1]) add(x + dx, y - 1);
    }
    return { out, drown: false };
  }
  if (C.ladder(x, y, t)) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) add(x + dx, y + dy);
    return { out, drown: false };
  }
  if (C.supported(x, y, t)) {
    add(x - 1, y); add(x + 1, y);
    if (C.ladder(x, y + 1, t)) out.push([x, y + 1]);
    return { out, drown: false };
  }
  // In the air: down, or down and a cell over.
  if (!C.solid(x, y + 1, t)) {
    out.push([x, y + 1]);
    for (const dx of [-1, 1]) if (!C.solid(x + dx, y, t) && !C.solid(x + dx, y + 1, t)) out.push([x + dx, y + 1]);
  }
  return { out, drown: false };
}

/**
 * Flood a side room. `starts`: [[x, y], ...] (the cells he arrives in).
 * `seas`: the levels he may be at — [t] holds the sea at t; [0, 1, 2] with
 * `conch: true` lets it change anywhere. A drowning sends him back to the
 * start he came in by (`entryOf`, default every start).
 * Returns { at: Set<'x,y@t'>, cells: Set<'x,y'>, restCells: Set<'x,y'>,
 *           warps: Set<'x,y'>, drowned: bool }.
 */
export function sideFlood(room, starts, o = {}) {
  const C = sideCells(room);
  const seas = o.seas || [0, 1, 2];
  const cleats = !!o.cleats;
  const at = new Set(), cells = new Set(), restCells = new Set(), warps = new Set();
  let drowned = false;
  const q = [];
  const push = (x, y, t) => {
    const k = x + ',' + y + '@' + t;
    if (at.has(k) || C.solid(x, y, t)) return;
    at.add(k); q.push([x, y, t]);
  };
  for (const [x, y] of starts) for (const t of seas) push(x, y, t);
  while (q.length) {
    const [x, y, t] = q.pop();
    cells.add(x + ',' + y);
    if (C.rest(x, y, t, cleats)) restCells.add(x + ',' + y);
    if (C.warp(x, y, t)) warps.add(x + ',' + y);
    const s = sideSteps(C, x, y, t, cleats);
    if (s.drown) {
      drowned = true;
      for (const [sx, sy] of starts) push(sx, sy, t);
    }
    for (const [nx, ny] of s.out) push(nx, ny, t);
    if (o.conch) for (const t2 of seas) if (t2 !== t) push(x, y, t2);
  }
  return { at, cells, restCells, warps, drowned };
}

/** Every cell he could be at rest in at some sea, Cleats or not: the side
 *  room's "floor", for a strand checker. */
export function sideRestCells(room, cleats) {
  const C = sideCells(room);
  const out = new Set();
  for (let y = 0; y < C.H; y++) for (let x = 0; x < C.W; x++) {
    if ([0, 1, 2].some(t => C.rest(x, y, t, cleats))) out.add(x + ',' + y);
  }
  return out;
}
