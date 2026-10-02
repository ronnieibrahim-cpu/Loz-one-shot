// THE OPENING (S168): what plays before the title, the way Seasons plays its
// ride to the temple. The human asked for a pixel-art intro "like Seasons and
// Ages" and chose a story of our own: a ship on a calm sea, a storm that takes
// it, and the shore the sea leaves Link on — the beach the game starts on.
//
// Every picture is the cartridge's (tools/rip-intro.py: the sea behind
// Seasons' linked ending, its ship and gull, its lightning; Link lying is the
// last frame of the Ages sheet's death band; the shore is the game's own first
// screen), and so is every rule for how they move that the cartridge has: the
// ship's and gulls' bob, the bolt's nine frames, the screen flash. The scenes,
// their order and their lengths are ours. No words: the Oracle openings have
// none, and ours are said by the two cards a new game opens on.
//
// Nothing here touches the game. The shore is drawn from rooms of its own
// (never `getRoom`'s, whose render cache the game is about to need) at fixed
// tide levels (never `game.tide`, whose stamp keys every room's cache).

import { SCREEN_W, SCREEN_H, paletteFade } from '../core/screen.js';
import { drawScreen, drawObject, screenImage } from '../gfx/screens.js';
import { sprites } from '../gfx/art.js';
import { MAPS } from '../world/maps.js';
import { Room } from '../world/room.js';
import { drawTideWipe } from './tide.js';
import {
  TITLE_FADE_FRAMES, TIDE_SWEEP_FRAMES,
  INTRO_SEA_FRAMES, INTRO_DARKEN_FRAMES, INTRO_STORM_FRAMES, INTRO_SWELL_FRAMES,
  INTRO_SWELL_RISE, INTRO_WHITE_FRAMES, INTRO_SHORE_HIGH_FRAMES, INTRO_SHORE_LOW_FRAMES,
  INTRO_SHIP_DRIFT, INTRO_SHIP_BOB, INTRO_GULL_BOB, INTRO_BOB_Z, INTRO_GULL_SPEED,
  INTRO_BOLT_HOLDS, INTRO_FLASH, INTRO_STRIKES,
} from '../data/feel.js';

// ---- layout (pixels on the 160x144 screen; not timing) ---------------------
const HORIZON = 88;                  // first row of sea in `introSea`
const SHIP_Y = 74;                   // where Seasons' ending moors its ship
const SHIP_X0 = 16;                  // where ours comes in from
const GULLS = [[150, 30], [176, 44], [204, 24]];
const BOLT_X = [36, 124, 76, 140, 52];
const BOLT_Y = 98;                   // where a bolt meets the water
// The shore is the screen a new game opens on, and Link lies a step below where
// it opens with him standing (progress.js's first respawn point, 72,40): in the
// tide pool, under the sea at HIGH and on the wet sand once it draws back.
const SHORE = { map: 'overworld', key: '0,4,9' };
const LINK_AT = [72, 52];
const SHORE_TOP = 8;                 // 128 rows of room in a 144-row screen

// The phases, as frame offsets from the start.
const P_DARK = INTRO_SEA_FRAMES;
const P_STORM = P_DARK + INTRO_DARKEN_FRAMES;
const P_SWELL = P_STORM + INTRO_STORM_FRAMES;
const P_WHITE = P_SWELL + INTRO_SWELL_FRAMES;
const P_SHORE = P_WHITE + INTRO_WHITE_FRAMES;
const P_WIPE = P_SHORE + INTRO_SHORE_HIGH_FRAMES;
const P_LOW = P_WIPE + TIDE_SWEEP_FRAMES;
export const INTRO_FRAMES = P_LOW + INTRO_SHORE_LOW_FRAMES;

// The storm, as a Game Boy Color does it: the palettes rewritten in four steps
// towards a dark sea-grey, never a shade laid over the scene.
const STORM_INK = [24, 32, 56];
const STORM = [null, 1, 2, 3, 4].map(k => k && {
  key: 'storm' + k,
  fn: (r, g, b) => [r, g, b].map((c, i) => Math.round(c - (c - STORM_INK[i]) * k / 7)),
});

/** Step of a four-step fade, 0..4, as `k` runs 0..1. */
function step4(k) { return Math.max(0, Math.min(4, Math.floor(k * 5))); }

export class Opening {
  constructor(game) {
    this.game = game;
    this.t = 0;
    this.shore = null;
  }

  /** One frame. True once it has played to its end. */
  update() {
    const t = this.t++;
    const a = this.game.audio;
    if (t === 0) a.sfx('wave');
    if (t === P_DARK) a.sfx('wind');
    for (const s of INTRO_STRIKES) if (t === P_STORM + s) a.sfx('lightning');
    if (t === P_SWELL) a.sfx('wave');
    if (t === P_WIPE) a.sfx('wave');
    return this.t >= INTRO_FRAMES;
  }

  draw(ctx) {
    const t = this.t;
    if (t < P_WHITE) this.drawSea(ctx, t);
    else if (t < P_SHORE) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, SCREEN_W, SCREEN_H); return; }
    else this.drawShore(ctx, t);
    // Fades: in from white at the start of each scene, out to white at the
    // end, as Seasons' palette thread does them (paletteFade).
    let white = 0;
    const F = TITLE_FADE_FRAMES;
    if (t < F) white = 1 - t / F;
    else if (t >= P_WHITE - F && t < P_WHITE) white = (t - P_WHITE + F) / F;
    else if (t >= P_SHORE && t < P_SHORE + F) white = 1 - (t - P_SHORE) / F;
    else if (t >= INTRO_FRAMES - F) white = (t - INTRO_FRAMES + F) / F;
    paletteFade(ctx, white, true);
  }

  // ---- the sea --------------------------------------------------------------

  drawSea(ctx, t) {
    let dark = 0;
    if (t >= P_DARK) dark = t >= P_STORM ? 4 : step4((t - P_DARK) / INTRO_DARKEN_FRAMES);
    const tint = STORM[dark];
    drawScreen(ctx, 'introSea', 0, 0, tint);

    // Gulls glide in from the right over the calm sea and climb away as the
    // weather turns; gone before the storm.
    if (t < P_STORM) {
      for (let i = 0; i < GULLS.length; i++) {
        const [gx, gy] = GULLS[i];
        const climb = t >= P_DARK ? (t - P_DARK) * INTRO_GULL_SPEED * 2 : 0;
        const x = gx - t * INTRO_GULL_SPEED - climb;
        const bob = INTRO_BOB_Z[(Math.floor(t / INTRO_GULL_BOB) + i * 3) % INTRO_BOB_Z.length];
        drawObject(ctx, 'introGull', x, gy + bob - climb, tint);
      }
    }

    // The ship drifts in on the calm and is tossed by the storm: the same bob,
    // stepped at a gull's pace rather than a ship's.
    const drift = Math.floor(Math.min(t, P_STORM) / INTRO_SHIP_DRIFT);
    const period = t >= P_STORM ? INTRO_GULL_BOB : INTRO_SHIP_BOB;
    const bob = INTRO_BOB_Z[Math.floor(t / period) % INTRO_BOB_Z.length] * (t >= P_STORM ? 2 : 1);
    drawObject(ctx, 'introShip', SHIP_X0 + drift, SHIP_Y + bob, tint);

    // The sea rises over it: the band of water below the horizon drawn again,
    // taller, its top climbing over the ship. Stretched rather than repeated —
    // the sea darkens toward the horizon, and a second copy under the first
    // shows as a hard seam; a row doubled here and there does not show at all.
    if (t >= P_SWELL) {
      const rise = Math.round(INTRO_SWELL_RISE * Math.min(1, (t - P_SWELL) / INTRO_SWELL_FRAMES));
      const band = SCREEN_H - HORIZON;
      const sea = screenImage('introSea', tint).canvas;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sea, 0, HORIZON, SCREEN_W, band, 0, HORIZON - rise, SCREEN_W, band + rise);
    }

    // Lightning, each strike with Seasons' screen flash.
    if (t >= P_STORM && t < P_SWELL) {
      const st = t - P_STORM;
      for (let i = 0; i < INTRO_STRIKES.length; i++) {
        const age = st - INTRO_STRIKES[i];
        if (age < 0) continue;
        if (age < INTRO_FLASH[INTRO_FLASH.length - 1]) {
          const n = INTRO_FLASH.filter(f => f <= age).length;
          if (n % 2 === 0) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, SCREEN_W, SCREEN_H); return; }
        }
        let k = 0, acc = 0;
        while (k < INTRO_BOLT_HOLDS.length && acc + INTRO_BOLT_HOLDS[k] <= age) acc += INTRO_BOLT_HOLDS[k++];
        if (k < INTRO_BOLT_HOLDS.length) drawObject(ctx, 'introBolt' + k, BOLT_X[i % BOLT_X.length], BOLT_Y);
      }
    }
  }

  // ---- the shore ------------------------------------------------------------

  /** The beach at HIGH and at LOW, each in a room of its own. */
  shoreRooms() {
    if (!this.shore) {
      const m = MAPS.get(SHORE.map);
      const make = () => new Room(m.roomDefs[SHORE.key], SHORE.key, m);
      this.shore = { high: make(), low: make(), canvases: [0, 1].map(() => {
        const c = document.createElement('canvas');
        c.width = 160; c.height = 128;
        return c;
      }) };
    }
    return this.shore;
  }

  /** One room at one level, its water moving, into its own canvas. */
  paint(room, level, canvas) {
    const g = canvas.getContext('2d');
    const f = this.game.frame;
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.drawImage(room.render(level, f), 0, 0);
    room.drawAnim(g, 0, 0, level, f);
    room.drawOver(g, 0, 0, level, f);
    return canvas;
  }

  drawShore(ctx, t) {
    const s = this.shoreRooms();
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    const low = this.paint(s.low, 0, s.canvases[1]);
    // Link is on the sand only once the sea has gone off it.
    sprites.draw(low.getContext('2d'), 'link_lie', LINK_AT[0], LINK_AT[1], { pal: 'link' });
    if (t < P_WIPE) {
      ctx.drawImage(this.paint(s.high, 2, s.canvases[0]), 0, SHORE_TOP);
    } else if (t < P_LOW) {
      drawTideWipe(ctx, 0, SHORE_TOP, this.paint(s.high, 2, s.canvases[0]), low, {
        t: (t - P_WIPE) / TIDE_SWEEP_FRAMES, phase: t - P_WIPE, rising: false, w: 160, h: 128,
      });
    } else {
      ctx.drawImage(low, 0, SHORE_TOP);
    }
  }
}
