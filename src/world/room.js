// Room: one 10x8 tile screen. Owns its tile grid, collision queries, a cached
// render of its static layer, and its spawn lists.
//
// ROOM DEFINITION FORMAT (contract for map data files):
//
//   {
//     map: [                        // exactly 8 rows of exactly 10 characters
//       'TTTTTTTTTT',
//       'Tgggggggg T',              // (extra whitespace is stripped)
//       ...
//     ],
//     legend: 'coast',              // name from LEGENDS, or an inline {char:tile} object
//     entities: [                   // compact tuples: [type, tileX, tileY, opts?]
//       ['octorok', 3, 4],
//       ['chest', 5, 2, { item: 'bombs' }],
//     ],
//     warps: [                      // [tileX, tileY, mapId, floor, roomX, roomY, opts?]
//       [4, 7, 'd1', 0, 3, 7],
//     ],
//     music: 'overworld',           // optional music override
//     tint: 'cave',                 // optional palette tint key
//     dark: false,                  // unlit room (needs a lit torch / Light Ring)
//     name: 'Tidewatch Village',    // optional display name for the map screen
//   }
//
// Coordinates: tileX 0..9, tileY 0..7. Pixel space within a room is
// tileX*16 .. tileX*16+15 and tileY*16 .. tileY*16+15.

import { TILE, ROOM_W, ROOM_H, VIEW_W, VIEW_H, offscreen } from '../core/screen.js';
import { tiles as tileSheet } from '../gfx/art.js';
import { F, resolveTile, getTileDef, tileArt } from './tileset.js';

export const LEGENDS = new Map();

/** Register a char->tile legend. `base` names another legend to inherit from. */
export function registerLegend(name, mapping, base) {
  const parent = base ? (LEGENDS.get(base) || {}) : {};
  LEGENDS.set(name, { ...parent, ...mapping });
}

export function getLegend(nameOrObj) {
  if (!nameOrObj) return LEGENDS.get('base') || {};
  if (typeof nameOrObj === 'object') return nameOrObj;
  return LEGENDS.get(nameOrObj) || LEGENDS.get('base') || {};
}

export class Room {
  constructor(def, key, mapDef) {
    this.def = def;
    this.key = key;                       // "floor,x,y"
    this.mapId = mapDef ? mapDef.id : '?';
    this.floor = 0; this.rx = 0; this.ry = 0;
    if (key) {
      const p = key.split(',').map(Number);
      this.floor = p[0]; this.rx = p[1]; this.ry = p[2];
    }
    const legend = getLegend(def.legend || (mapDef && mapDef.legend));
    this.legend = legend;

    // Base grid of tile *names* as authored (may be virtual tide tiles).
    this.base = new Array(ROOM_W * ROOM_H);
    const rows = (def.map || []);
    for (let y = 0; y < ROOM_H; y++) {
      const row = (rows[y] || '').replace(/\s+$/, '');
      for (let x = 0; x < ROOM_W; x++) {
        const ch = row[x] !== undefined ? row[x] : ' ';
        const t = legend[ch];
        this.base[y * ROOM_W + x] = t || legend[' '] || 'void';
      }
    }
    // Runtime overrides (opened doors, smashed bushes, lifted rocks).
    this.override = new Array(ROOM_W * ROOM_H).fill(null);

    this.music = def.music || null;
    this.tint = def.tint || null;
    this.dark = !!def.dark;
    this.name = def.name || null;

    this.warps = (def.warps || []).map(w => Array.isArray(w)
      ? { x: w[0], y: w[1], to: { map: w[2], floor: w[3] | 0, rx: w[4], ry: w[5] }, ...(w[6] || {}) }
      : w);

    this._cache = null;
    this._cacheTide = -1;
    this._cacheDirty = true;
    this.animCells = [];      // [{x,y,def}] refreshed with the cache
    this.overCells = [];      // tiles drawn above entities
    this.visited = false;
    this.cleared = false;     // all enemies defeated at least once (for locked rooms)
  }

  inBounds(tx, ty) { return tx >= 0 && ty >= 0 && tx < ROOM_W && ty < ROOM_H; }

  /** Authored (possibly virtual) tile name. */
  baseName(tx, ty) {
    if (!this.inBounds(tx, ty)) return 'void';
    return this.override[ty * ROOM_W + tx] || this.base[ty * ROOM_W + tx];
  }

  /** Concrete tile definition at the given tide level. */
  tile(tx, ty, tide) {
    if (!this.inBounds(tx, ty)) return getTileDef('void');
    return resolveTile(this.baseName(tx, ty), tide);
  }

  flagsAt(tx, ty, tide) { return this.tile(tx, ty, tide).flags; }

  setTile(tx, ty, name) {
    if (!this.inBounds(tx, ty)) return;
    this.override[ty * ROOM_W + tx] = name;
    this._cacheDirty = true;
  }

  clearTile(tx, ty) {
    if (!this.inBounds(tx, ty)) return;
    this.override[ty * ROOM_W + tx] = null;
    this._cacheDirty = true;
  }

  warpAt(tx, ty) {
    for (const w of this.warps) if (w.x === tx && w.y === ty) return w;
    return null;
  }

  invalidate() { this._cacheDirty = true; }

  /** Render (and cache) the static tile layer for a tide level. */
  render(tide, frame) {
    if (!this._cache) this._cache = offscreen(VIEW_W, VIEW_H);
    if (this._cacheDirty || this._cacheTide !== tide) {
      const ctx = this._cache.ctx;
      ctx.clearRect(0, 0, VIEW_W, VIEW_H);
      this.animCells.length = 0;
      this.overCells.length = 0;
      for (let y = 0; y < ROOM_H; y++) {
        for (let x = 0; x < ROOM_W; x++) {
          const d = this.tile(x, y, tide);
          if (d.flags & F.VOID) {
            ctx.fillStyle = '#000';
            ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
            continue;
          }
          // Tiles with transparent pixels sit on top of a base tile.
          if (d.underArt) {
            const u = getTileDef(d.underArt);
            tileSheet.draw(ctx, d.underArt, x * TILE, y * TILE, { pal: u.pal });
          }
          if (d.over) { this.overCells.push({ x, y, def: d }); continue; }
          if (d.anim) { this.animCells.push({ x, y, def: d }); continue; }
          tileSheet.draw(ctx, d.name, x * TILE, y * TILE, { pal: d.pal });
        }
      }
      this._cacheTide = tide;
      this._cacheDirty = false;
    }
    return this._cache.canvas;
  }

  /** Draw animated tiles (water, lava, torches) that sit below entities. */
  drawAnim(ctx, ox, oy, tide, frame) {
    for (const c of this.animCells) {
      tileSheet.draw(ctx, tileArt(c.def, frame), ox + c.x * TILE, oy + c.y * TILE, { pal: c.def.pal });
    }
  }

  /** Draw tiles that occlude entities (treetops, arches, pillars). */
  drawOver(ctx, ox, oy, tide, frame) {
    for (const c of this.overCells) {
      tileSheet.draw(ctx, tileArt(c.def, frame), ox + c.x * TILE, oy + c.y * TILE, { pal: c.def.pal });
    }
  }

  /**
   * Solidity of a single pixel, honouring sub-tile quadrant masks.
   * `caps` describes what the player can currently traverse.
   */
  solidAt(px, py, tide, caps) {
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    if (tx < 0 || ty < 0 || tx >= ROOM_W || ty >= ROOM_H) return true;
    const d = this.tile(tx, ty, tide);
    const f = d.flags;

    if (f & F.VOID) return true;
    if (f & F.SOLID) {
      if (d.mask === 15) return true;
      if (d.mask === 0) return false;
      const qx = (px % TILE) >= 8 ? 1 : 0;
      const qy = (py % TILE) >= 8 ? 1 : 0;
      const bit = 1 << (qy * 2 + qx);
      return (d.mask & bit) !== 0;
    }
    // Deep water is impassable on foot but fine while swimming.
    if (f & F.DEEP) return !(caps && (caps.swim || caps.jumping));
    // Gaps are crossed by jumping only.
    if (f & F.JUMPABLE) return !(caps && caps.jumping);
    // A ledge is the lip of a drop, not a floor. Nothing stands on it: the
    // player clears it in a hop (Player.tryLedgeHop) and is airborne while it
    // happens, so caps.jumping is what lets the hop through. Blocking it on
    // the ground is the half that makes the ledge one-way — otherwise you
    // could walk back up the drop or stroll along the lip.
    if (f & F.LEDGE) return !(caps && caps.jumping);
    if (f & F.BUSH) return !(caps && caps.cutting);
    if (f & F.ROCK) return true;
    return false;
  }
}
