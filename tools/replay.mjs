// Deterministic replay harness.
//
// A replay is a seed plus a start state plus a flat list of button masks, one
// per fixed 60 Hz update. Replaying it steps the engine exactly that many times
// with exactly those buttons and asserts the final player position, health and
// world state match what was recorded — to the pixel, by exact float equality,
// not within a tolerance. A tolerance would hide the very drift this exists to
// catch.
//
// This is the check that makes every later fidelity claim mean anything. If a
// replay diverges, the engine has non-determinism in it and no measurement of
// how the game feels can be trusted until it is found.
//
//   node tools/replay.mjs                    replay every committed replay
//   node tools/replay.mjs village-walk       replay one by name
//   node tools/replay.mjs --record <name>    re-record it from its plan
//   node tools/replay.mjs --record-all       re-record every plan
//   node tools/replay.mjs --shots            also screenshot the final frame
//   node tools/replay.mjs --headed           watch it in a real browser
//
// WHY IT CAN PROVE ANYTHING
//
// Recording runs an actor — a pathfinder and a crude swordsman — that decides
// what to press and writes down the buttons. Replaying does NOT run the actor.
// It reads the buttons back and presses them blind. So a replay that lands on
// the same pixel proves the engine reached the same state from the same seed
// and the same inputs, which is exactly the property being claimed.
//
// The wall-clock loop in main.js cannot do this: how many fixed steps it takes
// per animation frame depends on how busy the machine is. `window.__harness`
// takes the clock away from it and steps by hand. Drawing keeps running, which
// is why nothing in a draw path may consume randomness — see the screen shake
// in game.js.

import { createServer } from 'node:http';
import { readFile, readdir, stat, mkdir, writeFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLANS } from './replay-plans.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const REPLAY_DIR = join(HERE, 'replays');
const SHOT_DIR = join(HERE, 'shots-replay');

const argv = process.argv.slice(2);
const WANT_SHOTS = argv.includes('--shots');
const HEADED = argv.includes('--headed');
const RECORD_ALL = argv.includes('--record-all');
const RECORD_AT = argv.indexOf('--record');
const RECORD = RECORD_AT >= 0 ? argv[RECORD_AT + 1] : null;
const NAMED = argv.filter(a => !a.startsWith('--') && a !== RECORD);

// How many frames to advance per round trip into the page. Big enough that the
// round trips are not the cost, small enough that no single evaluate() blocks
// long enough to look like a hang.
const CHUNK = 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png',
};

function serve(port) {
  const server = createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p.endsWith('/')) p += 'index.html';
      const full = join(ROOT, normalize(p).replace(/^(\.\.[/\\])+/, ''));
      const s = await stat(full).catch(() => null);
      if (!s || !s.isFile()) { res.writeHead(404).end('nf'); return; }
      res.writeHead(200, { 'Content-Type': MIME[extname(full)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(await readFile(full));
    } catch (e) { res.writeHead(500).end(String(e)); }
  });
  return new Promise(r => server.listen(port, () => r(server)));
}

// ESM ignores NODE_PATH, so fall back to the global install explicitly.
async function loadPlaywright() {
  let mod;
  try {
    mod = await import('playwright');
  } catch (e) {
    const { execSync } = await import('node:child_process');
    const root = execSync('npm root -g', { encoding: 'utf8' }).trim();
    mod = await import(join(root, 'playwright', 'index.js'));
  }
  return mod.chromium ? mod : mod.default;
}

let passed = 0;
const failures = [];
function check(name, cond, detail) {
  if (cond) { passed++; console.log('  ok   ' + name); }
  else { failures.push(name + (detail ? ' — ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
}

// ===========================================================================
// The page-side runtime.
//
// This whole function is serialised into the browser by page.evaluate. It may
// not close over anything from this file.
// ===========================================================================

async function installRuntime() {
  const ent = await import('/src/game/entity.js');
  const prog = await import('/src/game/progress.js');
  const rngMod = await import('/src/core/rng.js');
  const screen = await import('/src/core/screen.js');

  const TILE = screen.TILE, ROOM_W = screen.ROOM_W, ROOM_H = screen.ROOM_H;
  const VIEW_W = screen.VIEW_W, VIEW_H = screen.VIEW_H;
  const BUTTONS = ['up', 'down', 'left', 'right', 'a', 'b', 'start', 'select'];
  const BIT = {};
  BUTTONS.forEach((b, i) => { BIT[b] = 1 << i; });

  /**
   * An Input that reads a button mask handed to it each frame instead of a
   * keyboard. It reproduces the real pad's edge detection and its d-pad
   * cancellation, because the game reads `pressed`/`released` and a scripted
   * pad that skipped either would not replay what a player did.
   */
  class ScriptedInput {
    constructor() {
      this.held = Object.create(null);
      this.prev = Object.create(null);
      for (const b of BUTTONS) { this.held[b] = false; this.prev[b] = false; }
      this.mask = 0;
    }
    setMask(m) { this.mask = m | 0; }
    update() {
      for (const b of BUTTONS) {
        this.prev[b] = this.held[b];
        this.held[b] = (this.mask & BIT[b]) !== 0;
      }
      // Opposing directions cancel, exactly as the hardware pad does.
      if (this.held.left && this.held.right) { this.held.left = this.held.right = false; }
      if (this.held.up && this.held.down) { this.held.up = this.held.down = false; }
    }
    down(b) { return this.held[b]; }
    pressed(b) { return this.held[b] && !this.prev[b]; }
    released(b) { return !this.held[b] && this.prev[b]; }
    anyDir() { return this.held.up || this.held.down || this.held.left || this.held.right; }
    takeExtra() { return null; }
  }

  const maskOf = (keys) => (keys || []).reduce((m, k) => m | (BIT[k] || 0), 0);

  // ------------------------------------------------------------------ state

  function snapshot() {
    const g = window.__game;
    const p = g.player;
    return {
      frame: g.frame,
      mapId: g.mapId,
      room: g.room ? g.room.key : null,
      floor: g.room ? g.room.floor : null,
      x: p ? p.x : null, y: p ? p.y : null, z: p ? p.z : null, dir: p ? p.dir : null,
      // The player's entity id is a canary for spawn-order drift: it is 1 in
      // every clean boot, and any earlier entity creation shows up here before
      // it shows up as a position mismatch.
      playerId: p ? p.id : null,
      hearts: g.progress.hearts,
      maxHearts: g.progress.maxHearts,
      rupees: g.progress.rupees,
      kills: g.progress.kills,
      deaths: g.progress.deaths,
      keys: g.progress.keys[g.mapId] || 0,
      essences: g.progress.essences.slice(),
      items: Object.keys(g.progress.items).filter(k => g.progress.items[k] > 0).sort(),
      // Persisted world state. A chest opened, a door unlocked and a buried
      // secret dug up all land in a different bucket from `items`, and every
      // one of them is a thing a drifting run would get wrong.
      dungeonMap: !!g.progress.dungeonMaps[g.mapId],
      chartstone: !!g.progress.charts[g.mapId],
      flags: Object.keys(g.progress.flags).filter(k => g.progress.flags[k]).sort(),
      doorsChanged: Object.keys(g.progress.doors).length,
      secretsSeen: Object.keys(g.progress.secrets).length,
      chestsOpened: Object.keys(g.progress.chests).length,
      tide: g.tide.level,
      // THE FIELD, at the tiles the plan asked about. `tide` above is the base
      // — one number for the world — and a replay that only asserted that could
      // not tell a room held at two levels from a room held at one.
      //
      // Two readings per probe, because they fail differently. `probeLevels` is
      // what the engine BELIEVES, and catches the field going wrong. `probePix`
      // is a hash of the 16x16 tile as actually RENDERED, and catches the room
      // still being DRAWN at the old level while every query answers correctly
      // — a stale cache is invisible to collision and invisible to levelAt, and
      // it is the one mistake in this refactor that nothing else would see.
      probeLevels: probeLevels(),
      probePix: probePix(),
      mode: g.mode,
      entities: g.entities.length,
      enemies: g.entities.filter(e => e.isEnemy && !e.dead).length,
      // The draw counters are the sharpest test in here. Two runs can agree on
      // the final position by luck; agreeing on how many random numbers were
      // consumed on the way is not luck.
      roomSeed: g.rng.seed,
      roomDraws: g.rng.draws,
      globalSeed: rngMod.rng.seed,
      globalDraws: rngMod.rng.draws,
    };
  }

  /** The tide level the engine reports at each of the plan's probe tiles. */
  function probeLevels() {
    const g = window.__game;
    const probes = window.__rp && window.__rp.probes;
    if (!probes || !probes.length || !g.room) return null;
    return probes.map(([tx, ty]) => g.tide.levelAt(tx, ty, g.room));
  }

  /**
   * A hash of each probe tile as it is actually drawn — base layer, animated
   * layer and over layer composited the way drawScene does, with the animation
   * frame held at 0 so the number is about the tide and not about which frame
   * of the wave the tile happened to be on.
   */
  function probePix() {
    const g = window.__game;
    const probes = window.__rp && window.__rp.probes;
    if (!probes || !probes.length || !g.room) return null;
    const s = screen.offscreen(VIEW_W, VIEW_H);
    s.ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    s.ctx.drawImage(g.room.render(g.tide, 0), 0, 0);
    g.room.drawAnim(s.ctx, 0, 0, g.tide, 0);
    g.room.drawOver(s.ctx, 0, 0, g.tide, 0);
    return probes.map(([tx, ty]) => {
      const d = s.ctx.getImageData(tx * TILE, ty * TILE, TILE, TILE).data;
      let h = 2166136261;
      for (let i = 0; i < d.length; i++) { h ^= d[i]; h = Math.imul(h, 16777619); }
      return h >>> 0;
    });
  }

  function mark() {
    const g = window.__game, p = g.player;
    const m = {
      f: g.frame,
      x: p ? p.x : null, y: p ? p.y : null,
      hp: g.progress.hearts,
      e: g.entities.length,
      d: g.rng.draws,
      r: g.room ? g.room.key : null,
    };
    // A plan that names probe tiles gets the field at every checkpoint, not
    // just at the end. The end is the wrong place to assert a split: a run that
    // demonstrates the Anchor and then recalls it finishes with the room back
    // on one level, and the final snapshot would show nothing.
    const probes = window.__rp && window.__rp.probes;
    if (probes && probes.length) { m.pl = probeLevels(); m.pp = probePix(); }
    return m;
  }

  // ---------------------------------------------------------------- pathing

  const playerTile = (p) => ({
    tx: Math.floor((p.x + p.hb.x + p.hb.w / 2) / TILE),
    ty: Math.floor((p.y + p.hb.y + p.hb.h - 2) / TILE),
  });

  function passable(g, p, tx, ty) {
    if (tx < 0 || ty < 0 || tx >= ROOM_W || ty >= ROOM_H) return false;
    return ent.canOccupy(g, p, tx * TILE, ty * TILE, p.caps);
  }

  /** Breadth-first path over tile centres. Returns a list of tiles, or null. */
  function findPath(g, p, from, to) {
    const key = (t) => t.ty * ROOM_W + t.tx;
    const start = key(from), goal = key(to);
    if (start === goal) return [to];
    const prev = new Map([[start, -1]]);
    const q = [start];
    for (let head = 0; head < q.length; head++) {
      const cur = q[head];
      const cx = cur % ROOM_W, cy = (cur / ROOM_W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy, nk = ny * ROOM_W + nx;
        if (prev.has(nk) || !passable(g, p, nx, ny)) continue;
        prev.set(nk, cur);
        if (nk === goal) {
          const out = [];
          for (let k = nk; k !== -1; k = prev.get(k)) out.push({ tx: k % ROOM_W, ty: (k / ROOM_W) | 0 });
          out.reverse();
          return out.slice(1);
        }
        q.push(nk);
      }
    }
    return null;
  }

  /** Buttons that carry the player toward a pixel waypoint. */
  function steer(p, wx, wy) {
    let m = 0;
    if (p.x < wx - 1) m |= BIT.right; else if (p.x > wx + 1) m |= BIT.left;
    if (p.y < wy - 1) m |= BIT.down; else if (p.y > wy + 1) m |= BIT.up;
    return m;
  }

  // --------------------------------------------------------------- the actor
  //
  // Each directive is a generator that yields one button mask per frame. The
  // driver applies the mask, steps the engine once, and resumes the generator,
  // which then sees the state the step produced. Recording is the only thing
  // that runs any of this; replay never does.

  /**
   * An open dialogue freezes every entity while `mode` is still 'play'. Every
   * directive that waits on the world changing has to tap through one or it
   * will stand there pressing a direction at a frozen room until its frame
   * budget runs out — which is exactly how the first recording of the D1 route
   * ended up stuck in the crab room for two thousand frames. Returns a mask to
   * yield, or null if there is no dialogue to clear.
   */
  function dialogueMask(g, f) {
    if (!g.dialogue.active) return null;
    return (f % 6 === 0) ? BIT.a : 0;
  }

  function* dWait(n) {
    const g = window.__game;
    for (let i = 0; i < n; i++) { const d = dialogueMask(g, i); yield d === null ? 0 : d; }
  }

  function* dHold(keys, n) { const m = maskOf(keys); for (let i = 0; i < n; i++) yield m; }

  function* dTap(key, gap) {
    yield BIT[key] || 0;
    yield* dWait(gap == null ? 4 : gap);
  }

  function* dGoto(tx, ty, maxF) {
    const g = window.__game;
    let path = null, wi = 0, sinceReplan = 1e9, sinceProgress = 0;
    let lastX = null, lastY = null;
    for (let f = 0; f < (maxF || 600); f++) {
      const p = g.player;
      if (!p) return;
      const dm = dialogueMask(g, f);
      if (dm !== null) { yield dm; continue; }
      const wantX = tx * TILE, wantY = ty * TILE;
      if (Math.abs(p.x - wantX) <= 1 && Math.abs(p.y - wantY) <= 1) return;
      if (p.x === lastX && p.y === lastY) sinceProgress++; else sinceProgress = 0;
      lastX = p.x; lastY = p.y;
      if (!path || wi >= path.length || sinceReplan > 90 || sinceProgress > 20) {
        path = findPath(g, p, playerTile(p), { tx, ty });
        wi = 0; sinceReplan = 0; sinceProgress = 0;
        if (!path) { yield 0; continue; }
      }
      sinceReplan++;
      const w = path[wi];
      const wx = w.tx * TILE, wy = w.ty * TILE;
      if (Math.abs(p.x - wx) <= 1 && Math.abs(p.y - wy) <= 1) { wi++; continue; }
      yield steer(p, wx, wy);
    }
  }

  /** Hold a direction until the room or map changes, then let it settle. */
  function* dExit(dir, maxF) {
    const g = window.__game;
    const was = g.mapId + '/' + (g.room ? g.room.key : '');
    const m = BIT[dir] || 0;
    for (let f = 0; f < (maxF || 400); f++) {
      const now = g.mapId + '/' + (g.room ? g.room.key : '');
      // Keep walking for a moment after the room changes. A transition leaves
      // the player a pixel or two inside the new room, still on the seam, and
      // the next directive's first step back toward it re-triggers the exit —
      // which is how a `fight` in the room you just entered turns into a fight
      // in the room you just left.
      if (now !== was && !g.transition && !g.fadeDir && !g.dialogue.active) {
        for (let i = 0; i < 10; i++) yield m;
        yield* dWait(4);
        return;
      }
      const dm = dialogueMask(g, f);
      yield dm === null ? m : dm;
    }
  }

  /**
   * Tap through any open dialogue. An open dialogue freezes every entity while
   * `mode` is still 'play', so an actor that walks into a room whose puzzle
   * reward says something will stand there pressing directions at a frozen
   * world until its budget runs out.
   */
  function* dDialogue(maxF, grace) {
    const g = window.__game;
    const wait = grace == null ? 20 : grace;
    let seen = false;
    for (let f = 0; f < (maxF || 240); f++) {
      if (g.dialogue.active) { seen = true; yield (f % 6 === 0) ? BIT.a : 0; continue; }
      // A puzzle reward fires on the update after the last enemy dies, so a
      // check that gives up the instant it sees no dialogue misses it by one
      // frame and leaves the box to open under the next directive.
      if (seen || f >= wait) { yield* dWait(4); return; }
      yield 0;
    }
  }

  /**
   * Close on the nearest live enemy and swing at it.
   *
   * The naive version — walk at it, press B — loses. Contact damage lands the
   * moment the hitboxes touch, and the sword's box starts about eleven pixels
   * in front of Link and reaches to about twenty-two, so walking all the way
   * onto an enemy trades a hit for every hit. This lines up on one axis, holds
   * a standoff inside sword range but outside contact range, and swings from
   * there. On three hearts that is the difference between clearing Tidewash
   * Grotto and dying in the crab room.
   *
   * The standoff is not enough on its own, because a swing roots Link for its
   * whole duration and anything walking at him closes most of the gap while he
   * is stuck in it. So every swing is followed by a deliberate step back, held
   * from the moment the button goes down: the rooted frames cost nothing, and
   * the retreat starts on the first frame it can.
   *
   * That retreat is DIAGONAL, and it has to be. Since P3 the engine does not
   * normalise diagonals — both axes get the full step — so backing off on two
   * axes breaks contact roughly sqrt(2) times faster than backing off on one.
   * A cardinal retreat at the current walk speed does not clear the crab room:
   * the swordsman dies in it. This is the actor learning the same lesson the
   * source games teach a player in their first dungeon.
   */
  function* dFight(maxF, patience) {
    const g = window.__game;
    // How long to keep at it with nothing dying before giving the room up.
    // 420 frames was enough when enemies drifted; a shielded enemy on the
    // lattice turns to face you as a whole committed step rather than as a
    // one-frame flicker, so the swordsman needs several more passes to catch
    // one of the three crabs side-on. Under-set, this reads as "the room is
    // unclearable" and the route silently continues without the key it needed.
    const giveUp = patience == null ? 900 : patience;
    // Widening this band to one enemy step (16..24) was tried when the lattice
    // landed and is WORSE: standing further out means walking further in, and
    // the extra approach frames cost more health than the extra swings win. The
    // narrow band plus a longer patience is what gets through the Crab Pit.
    const NEAR = 16, FAR = 21, LINED = 4, BACKOFF = 26, EDGE = 12;
    // A `fight` directive means "clear THIS room", and `fence` below is the
    // main defence of that. This is the backstop for when the fence is not
    // enough — a transition can still fire from a corner the fence does not
    // cover, and a fight that carries on in the next room walks the actor into
    // that room's spawn list with whatever health is left.
    const home = g.mapId + '/' + (g.room ? g.room.key : '');
    let lastCount = -1, stale = 0;

    /**
     * Strip whichever directions would carry the player out of the room.
     *
     * A fight directive that ends in a different room than it started in is
     * worse than one that fails: every directive after it is addressed to a
     * room the player is not standing in, so the rest of the route quietly
     * becomes fiction while still recording perfectly well. It happened twice
     * while re-recording this route for P3, once backing out of a doorway
     * mid-retreat and once while stepping away from a foe at the seam.
     *
     * So it is applied to EVERY mask this directive yields, not just the
     * retreat — closing on a foe near an edge steps out just as easily.
     */
    const fence = (m) => {
      const q = g.player;
      if (!q) return m;
      if (q.x < EDGE) m &= ~BIT.left;
      if (q.x > VIEW_W - 16 - EDGE) m &= ~BIT.right;
      if (q.y < EDGE) m &= ~BIT.up;
      if (q.y > VIEW_H - 16 - EDGE) m &= ~BIT.down;
      return m;
    };
    for (let f = 0; f < (maxF || 900);) {
      const p = g.player;
      if (!p || g.mode !== 'play') { yield 0; f++; continue; }
      if (g.mapId + '/' + (g.room ? g.room.key : '') !== home) { yield* dWait(6); return; }
      const dm = dialogueMask(g, f);
      if (dm !== null) { yield dm; f++; continue; }
      const foes = g.entities.filter(e => e.isEnemy && !e.dead && !e.dormant && !e.hidden);
      if (!foes.length) return;
      // Some enemies sit in water the player cannot follow them into. Killing
      // nothing for a long stretch means this is one of those, not that the
      // swordsman needs longer — bail rather than burn the frame budget.
      if (foes.length === lastCount) { if (++stale > giveUp) return; } else { lastCount = foes.length; stale = 0; }

      let best = foes[0], bd = 1e9;
      for (const e of foes) { const d = p.distTo(e); if (d < bd) { bd = d; best = e; } }
      const dx = best.cx - p.cx, dy = best.cy - p.cy;

      /**
       * Approach on the axis that is not looking back at us.
       *
       * A `shield: 'front'` enemy blocks anything arriving at its facing side,
       * and the nearest axis is very often exactly that side. The swordsman
       * used to close on it anyway and swing into the shield forever: three
       * shielded crabs in the D1 Crab Pit is where that shows, and an
       * unclearable Crab Pit means no Small Key, which means the locked door
       * never opens and every directive after it addresses a room the player
       * never reached.
       *
       * A crab patrols along x, so its facing is left or right almost every
       * frame — approach it on y and the shield is irrelevant. Preferring the
       * unblocked axis is what a player does without thinking about it, and it
       * is cheaper and truer than widening the standoff band, which was tried
       * and made things worse: standing further out means walking further in,
       * and the extra approach frames cost more health than the extra swings
       * win.
       */
      const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
      const faceOn = (useX) => useX ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
      const shielded = (f2) => best.shield === 'all'
        || (best.shield === 'front' && OPP[f2] === best.dir);
      let axisX = Math.abs(dx) >= Math.abs(dy);
      if (best.shield && shielded(faceOn(axisX)) && !shielded(faceOn(!axisX))) axisX = !axisX;

      const along = axisX ? dx : dy;
      const perp = axisX ? dy : dx;
      const face = faceOn(axisX);

      if (Math.abs(perp) > LINED) {
        // Off the enemy's row or column: the sword box is narrow, so line up
        // before closing or the swing goes past it.
        yield fence(axisX ? (dy < 0 ? BIT.up : BIT.down) : (dx < 0 ? BIT.left : BIT.right));
        f++; continue;
      }
      const dist = Math.abs(along);
      if (dist > FAR) { yield fence(BIT[face]); f++; continue; }
      if (dist < NEAR) {
        yield fence(axisX ? (dx < 0 ? BIT.right : BIT.left) : (dy < 0 ? BIT.down : BIT.up));
        f++; continue;
      }
      // In the window: face, swing, then back off diagonally until the enemy
      // has to come and find us again.
      const backAlong = axisX ? (dx < 0 ? BIT.right : BIT.left) : (dy < 0 ? BIT.down : BIT.up);
      const backPerp = axisX ? (dy < 0 ? BIT.down : BIT.up) : (dx < 0 ? BIT.right : BIT.left);
      yield fence(BIT[face]); f++;
      yield BIT.b; f++;
      for (let i = 0; i < BACKOFF; i++) { yield fence(backAlong | backPerp); f++; }
    }
  }

  function* runPlan(steps) {
    const g = window.__game;
    for (let si = 0; si < steps.length; si++) {
      const s = steps[si];
      const [kind, ...a] = s;
      if (kind === 'wait') yield* dWait(a[0]);
      else if (kind === 'hold') yield* dHold(a[0], a[1]);
      else if (kind === 'tap') yield* dTap(a[0], a[1]);
      else if (kind === 'goto') yield* dGoto(a[0], a[1], a[2]);
      else if (kind === 'exit') yield* dExit(a[0], a[1]);
      else if (kind === 'fight') yield* dFight(a[0], a[1]);
      else if (kind === 'dialogue') yield* dDialogue(a[0], a[1]);
      else throw new Error('unknown replay directive: ' + kind);
      // A trace of where each directive left the player. Recording prints it;
      // it is how you find out that step 9 never reached the room step 10
      // assumes it is standing in, which is the failure mode of authoring a
      // route against a dungeon you cannot see.
      const p = g.player;
      window.__rp._trace.push({
        step: si, kind, frame: g.frame,
        room: g.mapId + ' ' + (g.room ? g.room.key : '-'),
        x: p ? Math.round(p.x) : null, y: p ? Math.round(p.y) : null,
        hp: g.progress.hearts, tide: g.tide.level,
        foes: g.entities.filter(e => e.isEnemy && !e.dead).length,
        // Keys and opened doors, because "the route silently continued without
        // the key it needed" is the failure mode this trace exists to catch and
        // it is invisible in a position.
        keys: g.progress.keys[g.mapId] || 0,
        doors: Object.keys(g.progress.doors).length,
      });
    }
  }

  // ------------------------------------------------------------------- boot

  function boot(setup) {
    const g = window.__game;
    window.__harness.takeOver();
    g.newGame(0, setup.playerName || 'LINK', setup.seed);
    // newGame opens the intro cutscene. A replay starts from a stated world
    // state, not from however many buttons it takes to skip a cutscene.
    g.cutscene = null;
    g.mode = 'play';
    g.dialogue.active = false;
    if (setup.items) {
      for (const id of Object.keys(setup.items)) prog.giveItem(g.progress, id, setup.items[id]);
    }
    if (setup.equipB !== undefined) g.progress.equipB = setup.equipB;
    if (setup.equipA !== undefined) g.progress.equipA = setup.equipA;
    if (setup.maxHearts != null) g.progress.maxHearts = setup.maxHearts;
    if (setup.hearts != null) g.progress.hearts = setup.hearts;
    if (setup.rupees != null) g.progress.rupees = setup.rupees;
    if (setup.keys) g.progress.keys[setup.keys[0]] = setup.keys[1];
    if (setup.bossKey) g.progress.bossKeys[setup.bossKey] = true;
    if (setup.flags) for (const k of setup.flags) g.progress.flags[k] = true;
    if (setup.tide != null) g.tide.setLevel(setup.tide, { instant: true });
    window.__rp.probes = setup.probes || [];
    const e = setup.enter;
    g.enterMap(e[0], e[1], e[2], e[3], e[4], e[5], e[6], { instant: true });
    // Start from a settled screen: no fade, no banner, no held item.
    g.fadeAmount = 0; g.fadeDir = 0; g.fadeThen = null;
    g.bannerTime = 0;
    g.itemShow = null;
    g.dialogue.active = false;
    // The title screen ran for an unknown number of frames before we took the
    // clock. Zero the counter so the run does not depend on how long the page
    // took to load — animation phases are derived from it.
    g.frame = 0;
    const input = new ScriptedInput();
    g.input = input;
    return input;
  }

  // ---------------------------------------------------------------- driver

  const rp = {
    TRAIL_EVERY: 60,

    /** Start recording: run the actor, write down what it pressed. */
    beginRecord(setup, steps) {
      this._input = boot(setup);
      this._it = runPlan(steps);
      this._log = [];
      this._trail = [];
      this._frames = 0;
      this._done = false;
      this._replay = null;
      this._trace = [];
      return snapshot();
    },

    /** Start replaying: press a recorded log back, blind. */
    beginReplay(setup, rle) {
      this._input = boot(setup);
      this._it = null;
      this._replay = { rle, i: 0, left: rle.length ? rle[0][1] : 0 };
      this._trail = [];
      this._frames = 0;
      this._done = false;
      return snapshot();
    },

    _nextReplayMask() {
      const r = this._replay;
      while (r.i < r.rle.length && r.left <= 0) { r.i++; r.left = r.i < r.rle.length ? r.rle[r.i][1] : 0; }
      if (r.i >= r.rle.length) return null;
      r.left--;
      return r.rle[r.i][0];
    },

    _push(mask) {
      this._frames++;
      if (this._log) {
        const last = this._log[this._log.length - 1];
        if (last && last[0] === mask) last[1]++;
        else this._log.push([mask, 1]);
      }
      if (this._frames % this.TRAIL_EVERY === 0) this._trail.push(mark());
    },

    /** Advance up to n frames. Returns { done, frames }. */
    pump(n) {
      for (let i = 0; i < n && !this._done; i++) {
        let mask;
        if (this._it) {
          const r = this._it.next();
          if (r.done) { this._done = true; break; }
          mask = r.value | 0;
        } else {
          mask = this._nextReplayMask();
          if (mask === null) { this._done = true; break; }
        }
        this._input.setMask(mask);
        window.__harness.step(1);
        this._push(mask);
      }
      return { done: this._done, frames: this._frames };
    },

    result() {
      return {
        input: this._log, frames: this._frames, trail: this._trail,
        trace: this._trace || [], state: snapshot(),
      };
    },
  };

  window.__rp = rp;
  window.__rpButtons = BUTTONS;
  return BUTTONS;
}

// ===========================================================================
// Node side
// ===========================================================================

async function listReplays() {
  await mkdir(REPLAY_DIR, { recursive: true });
  const files = (await readdir(REPLAY_DIR)).filter(f => f.endsWith('.json')).sort();
  return files.map(f => basename(f, '.json'));
}

async function newPage(browser) {
  const page = await browser.newPage({ viewport: { width: 800, height: 720 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + (e.stack || e.message)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  page._errs = errs;
  return page;
}

async function prepare(page, port) {
  await page.goto(`http://localhost:${port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__game && !!window.__harness, { timeout: 20000 });
  await page.evaluate(installRuntime);
}

async function drain(page, label) {
  let r = { done: false, frames: 0 };
  let rounds = 0;
  while (!r.done) {
    r = await page.evaluate(n => window.__rp.pump(n), CHUNK);
    if (++rounds > 400) throw new Error(`${label}: exceeded ${400 * CHUNK} frames — a directive is not terminating`);
  }
  return page.evaluate(() => window.__rp.result());
}

async function record(browser, port, name) {
  const plan = PLANS[name];
  if (!plan) throw new Error(`no plan named "${name}" in tools/replay-plans.mjs`);
  const page = await newPage(browser);
  await prepare(page, port);
  await page.evaluate(([s, st]) => window.__rp.beginRecord(s, st), [plan.setup, plan.steps]);
  const res = await drain(page, name);
  const buttons = await page.evaluate(() => window.__rpButtons);

  const doc = {
    name,
    note: plan.note,
    engine: 1,
    setup: plan.setup,
    buttons,
    frames: res.frames,
    input: res.input,
    trailEvery: 60,
    trail: res.trail,
    expect: res.state,
  };
  await mkdir(REPLAY_DIR, { recursive: true });
  await writeFile(join(REPLAY_DIR, name + '.json'), JSON.stringify(doc, null, 1) + '\n');
  for (const t of res.trace) {
    console.log(`    [${String(t.step).padStart(2)}] ${t.kind.padEnd(9)} f=${String(t.frame).padStart(6)} ` +
      `${t.room.padEnd(12)} (${t.x},${t.y}) hp=${t.hp} tide=${t.tide} foes=${t.foes} ` +
      `keys=${t.keys} doors=${t.doors}`);
  }
  console.log(`  recorded ${name}: ${res.frames} frames, ${res.input.length} input runs`);
  console.log(`    ends at ${doc.expect.mapId} ${doc.expect.room} (${doc.expect.x}, ${doc.expect.y}) ` +
    `hearts ${doc.expect.hearts}/${doc.expect.maxHearts} draws ${doc.expect.roomDraws}`);
  if (page._errs.length) console.log('    page errors: ' + page._errs.slice(0, 3).join(' | '));
  await page.close();
  return doc;
}

function diffState(want, got) {
  const bad = [];
  for (const k of Object.keys(want)) {
    const a = want[k], b = got[k];
    const same = Array.isArray(a) ? JSON.stringify(a) === JSON.stringify(b) : a === b;
    if (!same) bad.push(`${k}: expected ${JSON.stringify(a)}, got ${JSON.stringify(b)}`);
  }
  return bad;
}

async function replay(browser, port, name) {
  const doc = JSON.parse(await readFile(join(REPLAY_DIR, name + '.json'), 'utf8'));
  const page = await newPage(browser);
  await prepare(page, port);
  await page.evaluate(([s, r]) => window.__rp.beginReplay(s, r), [doc.setup, doc.input]);
  const res = await drain(page, name);

  console.log(`\n--- ${name} — ${doc.note || ''}`);
  console.log(`    seed ${doc.setup.seed}, ${doc.frames} frames`);
  check(`${name}: replays the same number of frames`, res.frames === doc.frames,
    `${doc.frames} -> ${res.frames}`);

  // Find the first divergence along the trail, so a failure names a frame
  // rather than just an endpoint. A run that goes wrong at frame 400 and a run
  // that goes wrong at frame 40000 look identical at the end.
  let firstBad = null;
  const n = Math.min(doc.trail.length, res.trail.length);
  for (let i = 0; i < n; i++) {
    const a = doc.trail[i], b = res.trail[i];
    if (a.x !== b.x || a.y !== b.y || a.hp !== b.hp || a.e !== b.e || a.d !== b.d || a.r !== b.r) {
      firstBad = { i, frame: a.f, want: a, got: b };
      break;
    }
  }
  check(`${name}: every checkpoint matches`, firstBad === null,
    firstBad ? `first divergence at frame ${firstBad.frame}: ` +
      `want ${JSON.stringify(firstBad.want)} got ${JSON.stringify(firstBad.got)}` : '');

  const bad = diffState(doc.expect, res.state);
  check(`${name}: final state matches to the pixel`, bad.length === 0, bad.slice(0, 6).join('; '));
  check(`${name}: no page errors`, page._errs.length === 0, page._errs.slice(0, 3).join(' | '));

  if (WANT_SHOTS) {
    await mkdir(SHOT_DIR, { recursive: true });
    const el = await page.$('#screen');
    if (el) await el.screenshot({ path: join(SHOT_DIR, name + '.png') });
  }
  if (!HEADED) await page.close();
  return res;
}

// --------------------------------------------------------------------------

const { chromium } = await loadPlaywright();
const PORT = 20000 + Math.floor(Math.random() * 20000);
const server = await serve(PORT);
const browser = await chromium.launch({ headless: !HEADED });

if (RECORD || RECORD_ALL) {
  const names = RECORD_ALL ? Object.keys(PLANS) : [RECORD];
  console.log('\n--- recording ---');
  for (const n of names) await record(browser, PORT, n);
  console.log('\nRe-run `node tools/replay.mjs` to prove the recordings replay.');
} else {
  const names = NAMED.length ? NAMED : await listReplays();
  if (!names.length) {
    console.log('No replays in tools/replays/. Record one with --record <name>.');
  }
  for (const n of names) await replay(browser, PORT, n);
  console.log('\n=== ' + passed + ' passed, ' + failures.length + ' failed ===');
  if (failures.length) {
    console.log('\nFailures:');
    for (const f of failures) console.log('  - ' + f);
  }
}

if (!HEADED) { await browser.close(); server.close(); }
process.exit(failures.length ? 1 : 0);
