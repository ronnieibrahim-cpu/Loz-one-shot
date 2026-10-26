// The Abyssal Keep's ice chunks (S189).
//
// Seasons' INTERAC_D8_GRABBABLE_ICE (object_code/seasons/interactions/
// swordShieldMazeGrabbableIce.s): a chunk of the Sword & Shield Maze's ice that
// Link lifts and throws like a pot and that does NOT break where it lands; over
// a hole it goes down it (objectCheckIsOnHazard -> the INTERAC_FALLDOWNHOLE
// ball). In Seasons that is the dungeon's machine — ice thrown down the ice
// floor's holes freezes the lava of the fire floor beneath. Ours is the Keep's
// own sentence, "what the sea puts down, the line brings up":
//
//   * over a DRY drop hole (a Keep shaft at LOW) the chunk falls to the same
//     cell one floor down and rests there, whole — on a plate, it holds it;
//   * the Dredge Line dragged back over a FLOODED shaft searches the cell
//     beneath, and a chunk lying there comes up the shaft and into Link's
//     hands (`haulFromBelow`, called from DredgeLine.dragBack);
//   * in deep water it FLOATS where it lies (ice floats) — the cartridge
//     splashes it away; ours keeps it, out of reach of everything but the line,
//     and when the sea goes out from under it, it settles or goes down;
//   * Link cannot take a stair while holding it — no warp fires while he holds
//     anything (bank1.s checkTileWarps reads wLinkGrabState), so a chunk only
//     ever changes floor through a shaft.
//
// WHERE EACH CHUNK IS lives in the save, not on the entity: `progress.chunks`,
// id -> { map, floor, rx, ry, tx, ty }, written whenever one comes to rest. A
// chunk with no entry is where its room put it; a chunk lost into a pit with no
// floor beneath goes back there, as Seasons' comes back with its room.

import { Entity, defineEntity, moveEntity, overHole, spawnEntity } from './entity.js';
import { F } from '../world/tileset.js';
import { TILE } from '../core/screen.js';
import { cellBeneath } from '../world/maps.js';
import { sprites } from '../gfx/art.js';
import {
  LIFTED_THROW_RISE, LIFTED_THROW_GRAVITY, LIFTED_THROW_RADIUS, HOLE_FOOT_DY, KNOCK_THROWN, CHUNK_BOB_FRAMES,
} from '../data/feel.js';

export class IceChunk extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.w = 16; this.h = 16;
    // Seasons gives it collision radius 6 (objectSetCollideRadius $06).
    this.hb = { x: 2, y: 2, w: 12, h: 12 };
    this.chunkId = o.id || null;
    this.harmless = true;
    this.liftable = true;
    // objectPushLinkAwayOnCollision: Link cannot stand in it. Solid, as the
    // Keep's push blocks are, so it presses a plate it rests on.
    this.solid = true;
    // Squared onto its cell as it lands, it can come down over the edge of
    // whoever stands beside it: one already inside it may walk out.
    this.yieldsWhenInside = true;
    this.flight = null;
    this.floating = false;
    this.depth = -1;
    this.shadow = false;
    this.power = 3;
    // Down a Keep shaft to the floor beneath (Game.dropObjectThrough, `downTo`).
    this.fallsThrough = true;
  }

  // ---------------------------------------------------------------- where

  /** The tile it rests on: Seasons reads a hazard at y + 5 (objectCheckIsOnHazard). */
  restTile() {
    return { tx: Math.floor(this.cx / TILE), ty: Math.floor((this.cy + HOLE_FOOT_DY) / TILE) };
  }

  /** Write where it rests into the save. */
  record(game, floor, rx, ry, tx, ty) {
    if (!this.chunkId || !game.progress) return;
    game.progress.chunks[this.chunkId] = { map: game.mapId, floor, rx, ry, tx, ty };
  }

  recordHere(game) {
    const r = game.room;
    if (!r) return;
    const { tx, ty } = this.restTile();
    this.record(game, r.floor, r.rx, r.ry, tx, ty);
  }

  /** Lost for good (a pit with no floor under it): back to its room's own place. */
  lose(game) {
    this.remove = true;
    if (this.chunkId && game.progress) delete game.progress.chunks[this.chunkId];
  }

  /** Called by Game.dropObjectThrough: it has gone down to `c` (maps.cellBeneath). */
  downTo(game, c) {
    this.record(game, c.floor, c.rx, c.ry, c.tx, c.ty);
  }

  // ---------------------------------------------------------------- motion

  /** Thrown from Link's hands: the pot's own arc (itemBeginThrow). */
  launch(x, y, vx, vy, z) {
    this.x = x; this.y = y;
    this.flight = { vx, vy };
    this.z = z; this.vz = LIFTED_THROW_RISE;
    this.carried = false;
    this.remove = false;
    this.floating = false;
    this.shadow = true;
  }

  fly(game) {
    this.fz += this.vz;
    this.vz -= LIFTED_THROW_GRAVITY;
    const r = moveEntity(game, this, this.flight.vx, this.flight.vy, { jumping: true, swim: true });
    if (r.hitX) this.flight.vx = 0;
    if (r.hitY) this.flight.vy = 0;
    // It hits what it meets for the bracelet's 3, and does not break.
    const R = LIFTED_THROW_RADIUS;
    const a = { x: this.cx - R, y: this.cy - R, w: 2 * R, h: 2 * R };
    for (const e of game.entities) {
      if (!e.isEnemy || e.dead) continue;
      const b = e.contactRect();
      if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) {
        e.hurt(game, this.power, null, KNOCK_THROWN, this);
        this.flight.vx = 0; this.flight.vy = 0;
        break;
      }
    }
    if (this.fz > 0) return;
    this.fz = 0; this.vz = 0; this.flight = null; this.shadow = false;
    game.audio.sfx('place');
    this.settle(game);
  }

  /**
   * At rest (just landed, set down, or the sea has changed under it): a hole
   * takes it down or loses it, deep water floats it, anything else holds it.
   */
  settle(game) {
    if (this.remove) return;
    const hole = overHole(game, this);
    if (hole) {
      // Down the middle of the hole, as the ball goes (INTERAC_FALLDOWNHOLE).
      this.x = hole.tx * TILE; this.y = hole.ty * TILE;
      game.spawnEffect('hole', this.x, this.y);
      game.audio.sfx('fallInHole');
      if (!game.dropObjectThrough(this)) this.lose(game);
      return;
    }
    const { tx, ty } = this.restTile();
    const f = game.room && game.room.inBounds(tx, ty) ? game.room.flagsAt(tx, ty, game.tide) : 0;
    // IT SETTLES SQUARE ON ITS CELL (S189), the cell the save keeps and the
    // cell the line searches: a chunk left half over the next tile walled a
    // brace stand, and came back on the grid after a load anyway.
    this.x = tx * TILE; this.y = ty * TILE;
    const wasFloating = this.floating;
    this.floating = !!(f & F.DEEP);
    if (this.floating && !wasFloating) {
      game.spawnEffect('splash', this.x, this.y);
      game.audio.sfx('splash');
    }
    this.recordHere(game);
  }

  update(game) {
    this.frame++;
    if (this.attached) return;           // on the Dredge Line, coming home
    if (this.carried) return;
    if (this.flight) { this.fly(game); return; }
    // The sea moves under a resting chunk: check every frame, as Seasons'
    // @state1 calls objectCheckIsOnHazard every frame.
    const { tx, ty } = this.restTile();
    const f = game.room && game.room.inBounds(tx, ty) ? game.room.flagsAt(tx, ty, game.tide) : 0;
    if ((f & F.PIT) || !!(f & F.DEEP) !== this.floating) this.settle(game);
  }

  spriteName() { return 'o_icechunk0'; }

  draw(ctx, game, ox, oy) {
    // The ripped frame is 32x32 with the object's position at its middle.
    const bob = this.floating && Math.floor(this.frame / CHUNK_BOB_FRAMES) % 2 ? 1 : 0;
    sprites.draw(ctx, 'o_icechunk0', ox + this.x - 8, oy + this.y - 8 - this.z + bob);
  }
}
defineEntity('icechunk', (x, y, o) => new IceChunk(x, y, o));

/**
 * The room's chunks, as the save has them: called by Game.spawnRoomEntities.
 * A chunk the room places itself is skipped there if the save has moved it;
 * every chunk the save says is in THIS room is spawned here — unless it is the
 * one in Link's hands, which came in with him.
 */
export function spawnRecordedChunks(game) {
  const room = game.room;
  if (!room || !game.progress) return;
  const held = game.player && game.player.carrying;
  for (const [id, c] of Object.entries(game.progress.chunks || {})) {
    if (c.map !== game.mapId || c.floor !== room.floor || c.rx !== room.rx || c.ry !== room.ry) continue;
    if (held && held.chunkId === id) continue;
    const e = spawnEntity(game, 'icechunk', c.tx, c.ty, { id });
    if (e) e.settle(game);
  }
}

/** Is chunk `id` placed by its room (true) or moved by the save (false)? */
export function chunkAtHome(game, id) {
  return !(game.progress && game.progress.chunks && game.progress.chunks[id]);
}

/**
 * THE LINE BRINGS IT UP (S189): the Dredge Line's weight dragged back over a
 * flooded shaft at tx,ty searches the cell directly beneath, one floor down.
 * A chunk resting there comes up the shaft, hooked, and home to Link.
 * Returns the chunk, or null.
 */
export function haulFromBelow(game, line, tx, ty) {
  const room = game.room;
  if (!room || !game.map || !game.progress) return null;
  // The cell beneath by place on the map (S190): a wide room upstairs stands
  // over more than one room.
  const c = cellBeneath(game.mapId, room, tx, ty);
  if (!c) return null;
  let id = null;
  for (const [cid, k] of Object.entries(game.progress.chunks || {})) {
    if (k.map === game.mapId && k.floor === c.floor && k.rx === c.rx && k.ry === c.ry
        && k.tx === c.tx && k.ty === c.ty) { id = cid; break; }
  }
  // A chunk still where the room below placed it.
  if (!id) {
    for (const e of c.room.def.entities || []) {
      if (e[0] !== 'icechunk' || e[1] !== c.tx || e[2] !== c.ty) continue;
      const cid = e[3] && e[3].id;
      if (cid && chunkAtHome(game, cid)) { id = cid; break; }
    }
  }
  if (!id) return slateFromBelow(game, c, tx, ty);
  const chunk = spawnEntity(game, 'icechunk', tx, ty, { id });
  if (!chunk) return null;
  // On the line it is nowhere until it is set down; the save keeps it here,
  // at the shaft, so a save mid-haul finds it at the top of the shaft.
  chunk.record(game, room.floor, room.rx, room.ry, tx, ty);
  return chunk;
}

/**
 * A SLATE COMES UP THE SAME WAY (S212). The Keep's slates lie in the Hold on
 * cells no foot reaches, each as the room below's own `pickup` of kind
 * `slate`; under a flooded shaft the line hooks it and it comes home as a
 * pickup carrying the SAME save key, so taking it here is taking it there.
 * A chunk on the cell comes up first.
 */
function slateFromBelow(game, c, tx, ty) {
  const ents = c.room.def.entities || [];
  for (let i = 0; i < ents.length; i++) {
    const e = ents[i];
    if (e[0] !== 'pickup' || !e[3] || e[3].kind !== 'slate' || e[1] !== c.tx || e[2] !== c.ty) continue;
    const saveKey = `${game.mapId}:${c.room.key}:${i}`;
    if (game.progress.secrets[saveKey]) return null;
    return spawnEntity(game, 'pickup', tx, ty, { kind: 'slate', saveKey });
  }
  return null;
}
