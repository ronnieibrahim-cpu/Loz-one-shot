// The page-side actor runtime, shared by tools/replay.mjs and
// tools/check-playthrough.mjs.
//
// `installRuntime` is serialised into the browser by `page.evaluate`, so it may
// not close over ANYTHING — not an import of this file, not a constant defined
// beside it. Everything it needs is imported from the live module graph inside
// its own body. That is why it lives here as one self-contained function rather
// than as a module of small pieces: the only thing that crosses into the page is
// its source text.
//
// It was extracted from replay.mjs unchanged, because a playthrough is the
// replays joined up — the same pathfinder, the same crude swordsman, the same
// button-mask tape — and a second copy of a swordsman that has already learned
// about shields and diagonal retreats would start by forgetting all of it.
// tools/replay.mjs re-running 51 replays to the pixel is what proves the move
// was behaviour-preserving.

export async function installRuntime() {
  const ent = await import('/src/game/entity.js');
  // For `anchorOverride`: where the Anchor actually bit, read out of the live
  // tide field rather than predicted from the throw's arc.
  const items = await import('/src/game/items.js');
  const prog = await import('/src/game/progress.js');
  const rngMod = await import('/src/core/rng.js');
  const screen = await import('/src/core/screen.js');
  // The map registry, so the travel planner can ask whether a screen exists
  // rather than guessing from a room-key string. `hasRoom` resolves a
  // coordinate that lands INSIDE a multi-screen room; a raw key lookup does not.
  const mapsMod = await import('/src/world/maps.js');
  window.__hasRoom = mapsMod.hasRoom;

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

  /**
   * The button an equipped item is actually under.
   *
   * Every replay plan pins `equipB: 'sword'` in its setup, so for the whole life
   * of this actor "swing the sword" was spelled `BIT.b` and it was always right.
   * It is NOT right in a real playthrough: the intro cutscene gives the conch
   * first and the sword second, and `Game.autoEquip` fills B before A — so a new
   * game hands the player a conch on B and a sword on A, and an actor that
   * pressed B to fight would sound the conch at the enemy instead. Reading the
   * slot out of progress is identical for every existing plan (they all pin B)
   * and correct for a run that was never handed its equipment.
   */
  const slotBit = (id) => {
    const p = window.__game.progress;
    if (p.equipA === id) return BIT.a;
    if (p.equipB === id) return BIT.b;
    return 0;
  };
  const swordBit = () => slotBit('sword') || BIT.b;

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
    // Room-sized, so a probe tile in the second screen of a wide room is
    // actually inside the canvas being sampled.
    const s = screen.offscreen(g.room.pw, g.room.ph);
    s.ctx.clearRect(0, 0, g.room.pw, g.room.ph);
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

  // The ROOM's tile extent, so `goto` can path across a multi-screen room
  // instead of treating column 10 as the end of the world.
  const RW = (g) => (g.room ? g.room.tw : ROOM_W);
  const RH = (g) => (g.room ? g.room.th : ROOM_H);

  function passable(g, p, tx, ty) {
    if (tx < 0 || ty < 0 || tx >= RW(g) || ty >= RH(g)) return false;
    return ent.canOccupy(g, p, tx * TILE, ty * TILE, p.caps);
  }

  /** Breadth-first path over tile centres. Returns a list of tiles, or null. */
  function findPath(g, p, from, to) {
    const W = RW(g);
    const key = (t) => t.ty * W + t.tx;
    const start = key(from), goal = key(to);
    if (start === goal) return [to];
    const prev = new Map([[start, -1]]);
    const q = [start];
    for (let head = 0; head < q.length; head++) {
      const cur = q[head];
      const cx = cur % W, cy = (cur / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy, nk = ny * W + nx;
        if (prev.has(nk) || !passable(g, p, nx, ny)) continue;
        prev.set(nk, cur);
        if (nk === goal) {
          const out = [];
          for (let k = nk; k !== -1; k = prev.get(k)) out.push({ tx: k % W, ty: (k / W) | 0 });
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

  /**
   * Press whichever button an item is equipped to, n times.
   *
   * A plan cannot say `['tap','a']` and mean "sound the conch" unless something
   * has pinned the conch to A. `tools/check-playthrough.mjs` pins nothing — its
   * equipment is whatever the intro cutscene left — so it asks for the ITEM and
   * lets the runtime find the button. Yields 0 and gives up if the item is not
   * equipped at all, which is a route bug worth seeing as "nothing happened"
   * rather than as a stray press of an unrelated button.
   */
  function* dUse(id, times, gap) {
    const n = times == null ? 1 : times;
    for (let i = 0; i < n; i++) {
      const b = slotBit(id);
      if (!b) { yield* dWait(4); continue; }
      yield b;
      yield* dWait(gap == null ? 90 : gap);
    }
  }

  /**
   * Title screen to the first frame of play, pressing real buttons.
   *
   * This is the half of "no developer shortcuts" that is easiest to lose. Every
   * replay calls `g.newGame()` from outside and then throws the intro cutscene
   * away, which is right for a replay — it starts from a STATED world state —
   * and is exactly what a playthrough may not do, because the intro is where the
   * conch and the sword come from. Driving it means the run's first two items
   * were given by the game, in the order the game gives them.
   *
   * The seed still has to be pinned or the run plays a different world every
   * time (the defect P2 root-caused in test.mjs and check-gates.mjs re-learned).
   * That is done with `?seed=` on the URL, which sets `game.seedOverride` and is
   * read by the `newGame` the title screen itself calls — so the pin costs no
   * shortcut: the harness never touches progress.
   */
  function* dNewGame(maxF) {
    const g = window.__game;
    for (let f = 0; f < (maxF || 3000); f++) {
      if (g.mode === 'title') {
        // Logo -> file select -> slot 0. Both stages take `a`, and the cursor
        // starts on slot 0, so one button clears the whole screen. Tapped with
        // gaps because `pressed` is edge-triggered.
        yield (f % 12 === 0) ? BIT.a : 0;
        continue;
      }
      if (g.mode === 'cutscene') { yield (f % 8 === 0) ? BIT.a : 0; continue; }
      if (g.dialogue.active) { yield (f % 6 === 0) ? BIT.a : 0; continue; }
      if (g.mode === 'play' && !g.fadeDir && !g.itemShow) { yield* dWait(8); return; }
      yield 0;
    }
  }

  /**
   * Pick up what the room is holding: drops, and anything a chest popped.
   *
   * THIS IS NOT A SHORTCUT, and the distinction is the whole point of the
   * playthrough harness, so it is worth stating. `dFight` returns the instant
   * the last enemy dies, which leaves every heart those enemies dropped lying on
   * the floor — and the actor then walks into the next room on whatever health
   * it happened to end the last one with. A human picks the hearts up. On the
   * three hearts a new game actually starts with, that is not a nicety: without
   * it the run bleeds out in the Tide Gallery six rooms in, having fought
   * nothing unusual and made no mistake the game would punish a player for.
   *
   * So this is the actor learning to play, not the harness learning to cheat.
   * Nothing is granted; the run walks over a thing that is lying there.
   *
   * Re-planned every pass because a pickup has a lifetime and can expire
   * mid-walk, and because collecting one often leaves another closer.
   */
  function* dLoot(maxF) {
    const g = window.__game;
    const budget = maxF || 600;
    let spent = 0;
    for (let pass = 0; pass < 12 && spent < budget; pass++) {
      const p = g.player;
      if (!p) return;
      const dm = dialogueMask(g, pass);
      if (dm !== null) { yield dm; spent++; continue; }
      // `grabDelay` frames have to elapse before a fresh drop is collectable at
      // all. A sweep called the instant a puzzle reward spawns one — the fairy
      // in the Sunken Hall's push puzzle is the one that found this — sees a
      // `grabDelay` still counting down and used to read that as "nothing
      // here" and give up for good, leaving a full heal sitting on the floor
      // for the rest of the run. So the two are told apart: something present
      // but not yet grabbable is waited on; nothing present at all is the only
      // case that gives up.
      const pending = g.entities.filter(e => e.isDrop && !e.dead && !e.remove && !e.__skip
        && e.life > 30);
      if (!pending.length) return;
      const drops = pending.filter(e => e.grabDelay <= 0);
      if (!drops.length) { yield 0; spent++; continue; }
      let best = drops[0], bd = 1e9;
      for (const e of drops) { const d = p.distTo(e); if (d < bd) { bd = d; best = e; } }
      const t = { tx: Math.floor(best.cx / TILE), ty: Math.floor(best.cy / TILE) };
      if (!passable(g, p, t.tx, t.ty)) { yield 0; spent++; continue; }
      for (const m of dGoto(t.tx, t.ty, 200)) { yield m; spent++; if (spent > budget) break; }
      // A puzzle-reward pickup (the Crab Pit's key, the Sunken Hall's fairy)
      // pops a few pixels above the tile it logically spawned on and stays
      // there — see the `pickup, 4, 3` comment in dungeons-a.js: "a dropped
      // pickup pops about five pixels up and never comes back down". Standing
      // on the tile its CENTRE resolves to is not always standing on it: the
      // sprite reads one tile further up than `cy / TILE` says. So a stand
      // that did not collect it gets one retry a tile north before this drop
      // is given up on — a real player nudging up when the first step misses
      // is not a shortcut, it is the marginal reach the room was built with.
      if (g.entities.includes(best) && !best.dead && !best.remove
        && passable(g, p, t.tx, t.ty - 1)) {
        for (const m of dGoto(t.tx, t.ty - 1, 120)) { yield m; spent++; if (spent > budget) break; }
      }
      // A drop that survived both stands is one the walk could not actually
      // reach — in water, behind a pot. Give up on it rather than loop.
      if (g.entities.includes(best) && !best.dead && !best.remove) { best.__skip = true; }
      for (let i = 0; i < 6; i++) { yield 0; spent++; }
    }
  }

  /**
   * Walk to another SCREEN, working out the way there as it goes.
   *
   * Every replay plan spells its route out as `goto`/`exit` pairs, which is
   * right for a plan that walks four rooms and unmaintainable for one that
   * crosses the overworld and descends a dungeon. `walk-dungeons.mjs` already
   * has the flood that knows a dungeon's room graph, and the brief for this
   * harness names it as the route planner; this is that idea moved into the
   * page, where the answer comes from the engine's own `canOccupy` rather than
   * from a second model of it that can drift.
   *
   * It is deliberately NOT a full tile flood across screens. It plans over the
   * cheap graph — which screens exist next to which — and then LEARNS, because
   * a room-existence edge is not a walkable edge: a screen can have a northern
   * neighbour and no way north at the tide the player is standing in. So an exit
   * that is tried and does not fire is recorded as blocked and the plan is
   * recomputed without it. That is the same shape as walk-dungeons' flood
   * treating a locked door as a wall until a key is spent, and it means the
   * route survives a screen being re-authored under it.
   *
   * What it cannot do is sound the conch for itself. If a screen only opens at
   * LOW, the plan has to say so before travelling — and if the run gets stuck
   * because it did not, that is a finding about the world, not a bug here.
   */
  function bfsScreens(g, fromRx, fromRy, toRx, toRy, blocked) {
    const m = g.map;
    const floor = g.room ? g.room.floor : 0;
    const key = (x, y) => x + ',' + y;
    const has = (x, y) => !!(m.roomDefs && (m.roomDefs[`${floor},${x},${y}`]
      // A multi-screen room is keyed to its top-left cell, so a neighbour
      // coordinate can land INSIDE a room rather than on its key. Ask the
      // registry, which resolves that, and fall back to the raw key.
      || (window.__hasRoom && window.__hasRoom(g.mapId, floor, x, y))));
    const start = key(fromRx, fromRy), goal = key(toRx, toRy);
    if (start === goal) return [];
    const prev = new Map([[start, null]]);
    const q = [[fromRx, fromRy]];
    const DIRS = [['right', 1, 0], ['left', -1, 0], ['down', 0, 1], ['up', 0, -1]];
    for (let h = 0; h < q.length; h++) {
      const [cx, cy] = q[h];
      for (const [dir, dx, dy] of DIRS) {
        const nx = cx + dx, ny = cy + dy, nk = key(nx, ny);
        if (prev.has(nk) || !has(nx, ny)) continue;
        if (blocked.has(key(cx, cy) + '>' + dir)) continue;
        prev.set(nk, { from: key(cx, cy), dir, x: cx, y: cy });
        if (nk === goal) {
          const out = [];
          for (let k = nk; prev.get(k); k = prev.get(k).from) out.push(prev.get(k).dir);
          out.reverse();
          return out;
        }
        q.push([nx, ny]);
      }
    }
    return null;
  }

  /** The tiles along one edge of the current room, nearest the player first. */
  function edgeTiles(g, p, dir) {
    const room = g.room;
    const W = room.tw, H = room.th;
    const out = [];
    if (dir === 'left' || dir === 'right') {
      const x = dir === 'left' ? 0 : W - 1;
      for (let y = 0; y < H; y++) out.push({ tx: x, ty: y });
    } else {
      const y = dir === 'up' ? 0 : H - 1;
      for (let x = 0; x < W; x++) out.push({ tx: x, ty: y });
    }
    const pt = playerTile(p);
    return out
      .filter(t => passable(g, p, t.tx, t.ty))
      .sort((a, b) => (Math.abs(a.tx - pt.tx) + Math.abs(a.ty - pt.ty))
        - (Math.abs(b.tx - pt.tx) + Math.abs(b.ty - pt.ty)));
  }

  function* dTravel(rx, ry, maxF) {
    const g = window.__game;
    const budget = maxF || 6000;
    const blocked = new Set();
    let spent = 0;
    for (let leg = 0; leg < 80 && spent < budget; leg++) {
      const room = g.room;
      if (!room) { yield 0; spent++; continue; }
      if (room.rx === rx && room.ry === ry) return;
      const plan = bfsScreens(g, room.rx, room.ry, rx, ry, blocked);
      if (!plan || !plan.length) return;          // nowhere left to try
      const dir = plan[0];
      const here = room.rx + ',' + room.ry;
      const wasKey = g.mapId + '/' + room.key;
      // Stand on the edge first. Walking blind at a wall is how a leg burns its
      // whole budget without the room ever changing.
      let stepped = false;
      for (const t of edgeTiles(g, g.player, dir).slice(0, 6)) {
        const before = { x: g.player.x, y: g.player.y };
        for (const m of dGoto(t.tx, t.ty, 400)) { yield m; spent++; }
        const pt = playerTile(g.player);
        if (Math.abs(pt.tx - t.tx) + Math.abs(pt.ty - t.ty) > 1) {
          // could not even reach the edge tile; try the next one along
          if (g.player.x === before.x && g.player.y === before.y) continue;
          continue;
        }
        for (const m of dExit(dir, 220)) { yield m; spent++; }
        if (g.mapId + '/' + (g.room ? g.room.key : '') !== wasKey) { stepped = true; break; }
      }
      if (!stepped) blocked.add(here + '>' + dir);
    }
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
      if (q.x > (g.room ? g.room.pw : VIEW_W) - 16 - EDGE) m &= ~BIT.right;
      if (q.y < EDGE) m &= ~BIT.up;
      if (q.y > (g.room ? g.room.ph : VIEW_H) - 16 - EDGE) m &= ~BIT.down;
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
      yield swordBit(); f++;
      for (let i = 0; i < BACKOFF; i++) { yield fence(backAlong | backPerp); f++; }
    }
  }

  /**
   * FIGHT A BOSS.
   *
   *   ['boss', 4000]      fight whatever boss is in this room until it dies
   *
   * Every boss in this game is built on one rule (`defineBoss`, src/game/enemy.js):
   * a shelled boss IGNORES EVERY HIT unless `weakOpen` is set, and each boss
   * opens its own weak point off its own tell — Gohmaraq's eye opens after a
   * slam, and stays open TWICE AS LONG while the grotto is drained. So the verb
   * is not a script of one fight, it is the rule all of them share:
   *
   *   weak point open  -> close the distance and swing
   *   shelled          -> break contact, and keep moving off its axis so a
   *                       charge or a slam has to commit before you do
   *
   * This deliberately does NOT encode any single boss's timings. A per-boss
   * script would be a model of a fight, and a model does not notice when the
   * fight changes under it — the same reason the checkers here call the
   * engine's collision instead of copying it. If a boss ever needs more than
   * this (a tide level, an item), the ROUTE says so in the steps around this
   * one, where it is readable, rather than hiding inside the verb.
   */
  // STATUS: THIS VERB FIGHTS AND DOES NOT YET WIN. It finds the boss, stays in
  // the arena, waits out the shell, chains swings through a landed hit's own
  // invulnerability window, sidesteps a charge, and lands real hits —
  // Gohmaraq measured in REAL combat (12 quarter-hearts, no god mode, seed
  // 20260806) from 24 hp to 14, five hits landed, the player surviving to its
  // last half-heart before a final graze. The melee trade is close to
  // breakeven; what still kills a 3-heart player is ranged chip damage. A
  // reactive per-shot dodge was tried and measured NET NEGATIVE (it landed
  // fewer melee hits than leaving it alone, for no reliable safety in
  // return — see docs/NEXT-SESSION.md's boss-verb section for the measured
  // numbers and the wall-cornering failure mode before attempting it again).
  // It is committed because the scaffolding is right and the traps it
  // already closed are expensive to rediscover; it is NOT referenced by
  // tools/playthrough-route.mjs, because a route step that cannot reliably
  // finish is worse than one that is missing.
  function* dBoss(maxF) {
    const g = window.__game;
    for (let i = 0; i < 300 && !g.boss; i++) yield 0;
    if (!g.boss) throw new Error('boss: nothing to fight in ' + g.mapId + ' ' + (g.room && g.room.key));
    const sword = () => slotBit('sword') || BIT.b;
    // The same numbers dFight uses, for the same reasons: strike from the near
    // band, then break contact. A boss does contact damage like anything else,
    // and the first cut of this verb held the stick toward the boss while the
    // eye was open — three touches and a new game does not have a fourth.
    const NEAR = 18, BACKOFF = 30;
    // A charge (src/game/enemy.js `charge()`) commits to a straight dash at
    // 1.9 px/f down whichever axis it last saw the player on — far outrunning
    // every other move in this verb (1.0 px/f walking, ~1.4 diagonal). The
    // fix is not "outrun it", it's "step off the one axis it can hit on
    // before it starts moving" — the 18f `tell` freezes the boss in place
    // first (windUp/stun), so there is always a warning. Latched per charge
    // so the side doesn't reconsider mid-dash off a sign that's gone noisy.
    let chargeSide = 0;
    // CLAUDE.md: diagonal movement is not normalised, full speed both axes —
    // so a single-axis chase leaves real ground speed on the table. Measured
    // directly: closing on the far side of a knockback with one axis at a
    // time closed the gap at roughly half the rate a diagonal one does, which
    // is the difference between reaching swing range inside an invuln window
    // and not.
    const DIAG_SLACK = 3;
    const towardDiag = (ddx, ddy) => {
      let m = 0;
      if (Math.abs(ddx) > DIAG_SLACK) m |= (ddx > 0 ? BIT.right : BIT.left);
      if (Math.abs(ddy) > DIAG_SLACK) m |= (ddy > 0 ? BIT.down : BIT.up);
      return m;
    };
    const EDGE = 12;
    // Frames of invuln to leave unspent as a retreat allowance — see the
    // comment on RETREAT_MARGIN's use, below.
    const RETREAT_MARGIN = 20;
    // Is `a` within `margin` px of actually touching `b`, by their REAL
    // hitboxes (`Entity.rect()`, src/game/entity.js)? Measured this session:
    // Gohmaraq's hb is `{x:3,y:10,w:26,h:20}` on a 32x32 frame — off-centre
    // and far larger than the flat `NEAR`-vs-Manhattan-sum test below used to
    // assume. A frame-exact log of a real fight found the player taking a
    // full contact hit (4 quarter-hearts, boss's own `damage`) while the
    // verb's own distance math still read "far, keep closing" — dx=-18,
    // dy=-12 is Manhattan-sum 30, comfortably outside the old `NEAR+6`(24)
    // gate, and yet the two hitboxes already overlapped. A Manhattan sum is
    // the wrong shape for an oblong, off-centre box; this checks the actual
    // rectangles instead of guessing a radius, same reason `tools/lib/
    // collision.mjs` composes the engine's own tile checks rather than
    // re-deriving them.
    const nearlyTouching = (a, b, margin) => {
      const ra = a.rect(), rb = b.rect();
      return ra.x - margin < rb.x + rb.w && rb.x - margin < ra.x + ra.w &&
             ra.y - margin < rb.y + rb.h && rb.y - margin < ra.y + ra.h;
    };
    // Every mask goes through the fence. A boss arena has exits, and leaving
    // one wipes the room's entities — the boss with them. That reads exactly
    // like a kill (no boss, full health) and is a retreat; it is why this verb
    // reported six flawless victories before it had landed a single hit.
    const fence = (m) => {
      const q = g.player;
      if (!q) return m;
      if (q.x < EDGE) m &= ~BIT.left;
      if (q.x > (g.room ? g.room.pw : 160) - 16 - EDGE) m &= ~BIT.right;
      if (q.y < EDGE) m &= ~BIT.up;
      if (q.y > (g.room ? g.room.ph : 144) - 16 - EDGE) m &= ~BIT.down;
      return m;
    };
    const budget = maxF || 16000;
    for (let f = 0; f < budget;) {
      const b = g.boss;
      if (!b || b.dead) return;
      const p = g.player;
      if (!p) return;
      const dm = dialogueMask(g, f);
      if (dm !== null) { yield dm; f++; continue; }
      if (g.mode !== 'play') { yield (f % 8 === 0) ? BIT.a : 0; f++; continue; }
      if (b.charging) {
        if (chargeSide === 0) {
          chargeSide = (b.dir === 'up' || b.dir === 'down')
            ? (p.cx >= b.cx ? 1 : -1) : (p.cy >= b.cy ? 1 : -1);
        }
        const perp = (b.dir === 'up' || b.dir === 'down')
          ? (chargeSide > 0 ? BIT.right : BIT.left)
          : (chargeSide > 0 ? BIT.down : BIT.up);
        // Also retreat along the DASH's own axis, away from the boss's
        // current position. Free (diagonal isn't speed-limited here, CLAUDE.
        // md), and it fixes a bug the perpendicular dodge alone can't:
        // frame-logged, a vertical dash landed at a y the player happened to
        // already be standing at, and — because the dodge only ever moves
        // the PERPENDICULAR axis — that row alignment sat untouched through
        // the entire recovery window and re-triggered a fresh (this time
        // horizontal) charge the instant recovery ended. Back to back, with
        // no window to close in. `aligned()` (src/game/enemy.js) checks
        // ROW-or-COLUMN, either one; a dodge that only ever clears the
        // dash's axis leaves the other one exactly where chance left it.
        const along = (b.dir === 'up' || b.dir === 'down')
          ? (p.cy >= b.cy ? BIT.down : BIT.up)
          : (p.cx >= b.cx ? BIT.right : BIT.left);
        yield fence(perp | along); f++; continue;
      }
      chargeSide = 0;
      const dx = b.cx - p.cx, dy = b.cy - p.cy;
      const adx = Math.abs(dx), ady = Math.abs(dy);
      const axisX = adx > ady;
      const toward = axisX ? (dx > 0 ? BIT.right : BIT.left) : (dy > 0 ? BIT.down : BIT.up);
      const backAlong = axisX ? (dx > 0 ? BIT.left : BIT.right) : (dy > 0 ? BIT.up : BIT.down);
      const backPerp = axisX ? (dy > 0 ? BIT.up : BIT.down) : (dx > 0 ? BIT.left : BIT.right);

      if (b.weakOpen) {
        // Invulnerability frames are the only free hits in this game. A touch
        // costs a quarter of a new game's hearts and buys PLAYER_INVULN_FRAMES
        // (46f) of contact immunity, minus the 12f knockback lock that opens
        // it — call it 34 usable frames, enough for two 14f swings. The first
        // cut of this verb spent that window on one swing and a mandatory
        // 30-frame retreat, so a touch that had already been paid for went
        // half-used.
        //
        // RETREAT_MARGIN is the trap in doing better: invuln counts down
        // whether or not it is spent, so chaining swings until it hits zero
        // leaves the player adjacent to the boss at the exact frame contact
        // damage comes back live — a second touch for free, immediately. Bank
        // enough invuln to clear to a safe range before it lapses instead.
        if (p.invuln > RETREAT_MARGIN && p.hurtTime === 0) {
          const dx2 = b.cx - p.cx, dy2 = b.cy - p.cy;
          const ax2 = Math.abs(dx2), ay2 = Math.abs(dy2);
          const toward2 = towardDiag(dx2, dy2);
          if (ax2 + ay2 > NEAR + 6) { yield fence(toward2); f++; continue; }
          const faceOnly = ax2 >= ay2 ? (dx2 > 0 ? BIT.right : BIT.left) : (dy2 > 0 ? BIT.down : BIT.up);
          yield fence(faceOnly); f++;
          yield fence(faceOnly | sword()); f++;
          continue;
        }
        if (p.invuln > 0 && p.hurtTime === 0) {
          // Spending down the banked margin: break contact and hold clear
          // until invuln itself runs out, then re-approach it as a stranger.
          const dx2 = b.cx - p.cx, dy2 = b.cy - p.cy;
          const axisX2 = Math.abs(dx2) > Math.abs(dy2);
          const backAlong2 = axisX2 ? (dx2 > 0 ? BIT.left : BIT.right) : (dy2 > 0 ? BIT.up : BIT.down);
          const backPerp2 = axisX2 ? (dy2 > 0 ? BIT.up : BIT.down) : (dx2 > 0 ? BIT.left : BIT.right);
          yield fence(backAlong2 | backPerp2); f++;
          continue;
        }
        // No invuln banked: close the distance and take the shot. Retreating
        // first because the eye-open range READS as far is what pinned this
        // verb against a room wall for an entire fight, measured directly —
        // Gohmaraq's phase-1 tell is a stationary spray, not a charge closing
        // on us, so there is nothing here worth backing away from before the
        // swing.
        //
        // A "don't chase a distant eye-open window, wait for the boss to
        // patrol close instead" gate (hold room centre past ~90px) was tried
        // here and measured BYTE-IDENTICAL to not having it — Gohmaraq's
        // arena is small enough, and the eye stays open long enough, that the
        // gate essentially never triggers in the room that matters. Reverted
        // rather than kept as unproven complexity.
        //
        // What DOES matter, found by frame-exact logging (docs/NEXT-SESSION.md
        // has the trace): the old gate here compared `adx+ady` (a Manhattan
        // sum) against `NEAR+6` (24) to decide "still safely approaching".
        // Gohmaraq's hurtbox is a 26x20 rectangle, off-centre on a 32x32
        // frame — a real fight took a full unpaid contact hit at dx=-18,
        // dy=-12 (Manhattan sum 30, comfortably outside that gate) because
        // the two hitboxes were already overlapping; a Manhattan radius is
        // the wrong shape for an oblong, off-centre box. `nearlyTouching`
        // (above) asks the two entities' own `rect()`s instead of guessing a
        // number, so it says "contact is imminent" exactly when the geometry
        // says so, for any boss's hitbox shape. CONTACT_SOON is small enough
        // that the sword (`SWORD_REACH`+`SWORD_GAP`, src/data/feel.js) still
        // connects from here — the point isn't to stay further out, it's to
        // be SWINGING by the time a touch is unavoidable, so an unpaid graze
        // becomes a traded hit instead.
        const CONTACT_SOON = 4;
        if (!nearlyTouching(p, b, CONTACT_SOON)) { yield fence(towardDiag(dx, dy)); f++; continue; }
        // In range: face it, swing, then get out before it closes.
        yield fence(toward); f++;
        yield fence(toward | sword()); f++;
        for (let i = 0; i < BACKOFF && f < budget; i++) { yield fence(backAlong | backPerp); f++; }
        continue;
      }
      // Shelled: nothing to hit. Keep off it and wait out the tell.
      if (adx + ady < 72) { yield fence(backAlong | backPerp); f++; continue; }
      const room = g.room;
      const ox = (room ? room.pw : 160) / 2 - p.cx, oy = (room ? room.ph : 144) / 2 - p.cy;
      if (Math.abs(ox) > 12 || Math.abs(oy) > 12) {
        yield fence(Math.abs(ox) > Math.abs(oy) ? (ox > 0 ? BIT.right : BIT.left)
                                                : (oy > 0 ? BIT.down : BIT.up));
      } else {
        yield 0;
      }
      f++;
    }
    const b = g.boss;
    throw new Error(`boss: still alive after ${budget} frames (hp ${b ? b.hp : '?'})`);
  }

  /**
   * EQUIP AN ITEM ONTO A BUTTON, through the real pause menu.
   *
   *   ['equip', 'anchor', 'B']
   *
   * `Game.autoEquip` only fills an EMPTY slot (src/game/game.js), so the first
   * two equippables a new game is given — the sword and the conch — take A and
   * B, and every item found after that lands on no button at all. That is
   * correct game behaviour and it is invisible to every replay in the repo,
   * because replays pin `equipA`/`equipB` in their setup. A playthrough may not:
   * it was handed nothing, so the Anchor came out of its chest bound to
   * nothing, and `dAnchor` reported "could not land from any approach" when the
   * truth was "there is no button to press".
   *
   * The cursor is walked rather than computed. `updateItems` moves it with the
   * usual grid wrap (left at column 0 jumps to the row's end, up/down wrap
   * vertically), so rather than reimplement that arithmetic — the private-model
   * mistake this repo keeps paying for — this reads `menu.cursor` back every
   * frame and steps toward the target until the engine's own cursor agrees.
   */
  function* dEquip(id, slot, maxF) {
    const g = window.__game;
    const want = (slot || 'B').toUpperCase();
    const key = want === 'A' ? 'equipA' : 'equipB';
    if (g.progress[key] === id) return;
    const COLS = 5;
    // Open the menu.
    for (let i = 0; i < 60 && g.mode !== 'menu'; i++) yield (i % 8 === 0) ? BIT.start : 0;
    if (g.mode !== 'menu') throw new Error('equip: the menu would not open');
    const m = g.menu;
    const idx = () => m.items.findIndex(it => it.id === id);
    if (idx() < 0) throw new Error(`equip: ${id} is not in the item list`);
    for (let f = 0; f < (maxF || 400); f++) {
      const t = idx();
      const c = m.cursor;
      if (c === t) {
        yield want === 'A' ? BIT.a : BIT.b;
        yield 0;
        break;
      }
      const cr = Math.floor(c / COLS), tr = Math.floor(t / COLS);
      if (cr !== tr) yield (tr > cr) ? BIT.down : BIT.up;
      else yield (t > c) ? BIT.right : BIT.left;
      yield 0;                                  // release: `pressed` is an edge
    }
    // Close it again and hand control back to the field.
    for (let i = 0; i < 60 && g.mode === 'menu'; i++) yield (i % 8 === 0) ? BIT.start : 0;
    yield* dWait(4);
    if (g.progress[key] !== id) {
      throw new Error(`equip: ${id} is still not on ${want} (A=${g.progress.equipA}, B=${g.progress.equipB})`);
    }
  }

  /**
   * ANCHOR PLACEMENT — the verb that was missing, and the reason the
   * playthrough stopped inside D1 for the whole life of this harness.
   *
   *   ['anchor', tx, ty]   sink the Tidewright's Anchor on tile (tx, ty)
   *   ['unanchor']         recall it, from anywhere in the world
   *
   * THE ANCHOR IS A THROW, NOT A TILE PICKER. `items.js` spawns it moving in
   * the player's facing direction on an arc; it bites where it falls, or short
   * if it hits a wall. So "place it at (tx, ty)" is really "stand a throw's
   * length away, face it, and press the button", and the throw's length is not
   * a number this file is allowed to hard-code — ANCHOR_THROW_SPEED and the
   * arc constants live in src/data/feel.js and are exactly the kind of value
   * that gets retuned by a feel session that has never heard of this harness.
   *
   * So this does not PREDICT the landing tile, it VERIFIES it. Each candidate
   * standing tile is tried for real, and the result is read back out of the
   * live tide field via `anchorOverride`. A throw that lands somewhere else is
   * recalled and the next candidate is tried. That is slower than arithmetic
   * and it cannot drift when the constants move, which is the trade this repo
   * makes everywhere else: ask the engine, do not model it.
   */
  function* dAnchor(tx, ty, maxF) {
    const g = window.__game;
    const held = () => items.anchorOverride(g);
    // Already sitting exactly where it was asked for: nothing to do.
    const cur = held();
    if (cur && cur.tx === tx && cur.ty === ty) return;
    if (cur) yield* dUnanchor(120);

    // Candidates: every cardinal approach, at every plausible throw length.
    // Nearest first, because a short throw is the one least likely to be
    // stopped by scenery between the player and the target.
    const cands = [];
    for (const r of [2, 3, 1]) {
      for (const [dname, dx, dy] of [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]]) {
        cands.push({ dname, sx: tx - dx * r, sy: ty - dy * r });
      }
    }
    const budget = maxF || 1600;
    let spent = 0;
    // Why each approach was rejected. Without this the directive can only say
    // "no approach worked", which is true of a flooded room, an unreachable
    // standing tile and an anchor that is not on a button — three completely
    // different bugs with one message.
    const why = [];
    for (const c of cands) {
      if (spent >= budget) { why.push('budget'); break; }
      const p = g.player;
      if (!p) { why.push('no player'); continue; }
      if (!passable(g, p, c.sx, c.sy)) { why.push(`${c.sx},${c.sy} ${c.dname}: not standable`); continue; }
      // Walk there. If the tile cannot be reached this leg, try the next one.
      let before = g.frame;
      yield* dGoto(c.sx, c.sy, 300);
      spent += g.frame - before;
      const at = playerTile(g.player);
      if (at.tx !== c.sx || at.ty !== c.sy) {
        why.push(`${c.sx},${c.sy} ${c.dname}: walk ended at ${at.tx},${at.ty}`); continue;
      }

      // Face the target. A held direction with nothing in the way turns the
      // player without moving him off the tile only if he is already against
      // something, so this faces by tapping and then re-checks the tile.
      before = g.frame;
      for (let i = 0; i < 6; i++) yield BIT[c.dname];
      yield* dWait(2);
      const b = slotBit('anchor');
      if (!b) { spent += g.frame - before; why.push('anchor is on no button'); continue; }
      yield b;
      // Let it fly and bite. ANCHOR_SETTLE_FRAMES plus the arc is well under
      // this; the loop exits the moment the override appears.
      for (let i = 0; i < 90 && !held(); i++) yield 0;
      spent += g.frame - before;
      const o = held();
      if (o && o.tx === tx && o.ty === ty) return;
      // Wrong tile, or refused outright ("There is nowhere to stand if it bites
      // here"). Take it back and try the next approach.
      why.push(`${c.sx},${c.sy} ${c.dname}: bit ${o ? o.tx + ',' + o.ty : 'nothing'}`);
      if (o) yield* dUnanchor(120);
      yield* dDialogueClear(30);
    }
    const p2 = g.player, at2 = p2 ? playerTile(p2) : null;
    throw new Error(`anchor: could not land on ${tx},${ty}. room ${g.mapId} ${g.room && g.room.key}`
      + `, player ${at2 ? at2.tx + ',' + at2.ty : '?'}, tide ${g.tide.level}`
      + `, anchor slot ${slotBit('anchor') ? 'yes' : 'NO'} :: ${why.join(' | ')}`);
  }

  function* dUnanchor(maxF) {
    const g = window.__game;
    const b = slotBit('anchor');
    if (!b) return;
    if (!items.anchorOverride(g)) return;
    yield b;
    for (let i = 0; i < (maxF || 120) && items.anchorOverride(g); i++) yield 0;
  }

  /** Mash through whatever box the last action opened, if any. */
  function* dDialogueClear(maxF) {
    const g = window.__game;
    for (let f = 0; f < (maxF || 60); f++) {
      if (!g.dialogue.active) return;
      yield (f % 6 === 0) ? BIT.a : 0;
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
      // Playthrough directives. Nothing in tools/replay-plans.mjs uses these;
      // they exist because a run that is given nothing has to press its way
      // through a title screen, find its own buttons, and cross a map.
      else if (kind === 'newgame') yield* dNewGame(a[0]);
      else if (kind === 'use') yield* dUse(a[0], a[1], a[2]);
      else if (kind === 'travel') yield* dTravel(a[0], a[1], a[2]);
      else if (kind === 'loot') yield* dLoot(a[0]);
      else if (kind === 'boss') yield* dBoss(a[0]);
      else if (kind === 'equip') yield* dEquip(a[0], a[1], a[2]);
      else if (kind === 'anchor') yield* dAnchor(a[0], a[1], a[2]);
      else if (kind === 'unanchor') yield* dUnanchor(a[0]);
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
    window.__rp._god = !!setup.godMode;
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

  /**
   * Boot for a run that is given NOTHING.
   *
   * Every line `boot` above spends on setup — items, hearts, keys, flags, tide,
   * `enterMap` — is a shortcut a playthrough is not allowed, so this does none
   * of them. It takes the clock, swaps the keyboard for a scripted pad, zeroes
   * the frame counter, and leaves the game sitting on its own title screen. The
   * run starts from there by pressing buttons.
   *
   * The one thing it does share is the frame zero. The title screen ran for an
   * unknown number of frames before the page handed the clock over, and
   * animation phases are derived from `g.frame`, so a run that did not zero it
   * would record a tape that replays differently on a slower machine.
   */
  function bootPlaythrough() {
    const g = window.__game;
    window.__harness.takeOver();
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
      this._resetSpan();
      return snapshot();
    },

    /**
     * Start a playthrough recording: no setup at all, the actor from the title
     * screen on. `tools/check-playthrough.mjs` is the only caller.
     */
    beginPlaythrough(steps) {
      this._input = bootPlaythrough();
      this._it = runPlan(steps);
      this._log = [];
      this._trail = [];
      this._frames = 0;
      this._done = false;
      this._replay = null;
      this._trace = [];
      this._resetSpan();
      this._resetAudit();
      return snapshot();
    },

    /**
     * Replay a playthrough tape blind. Same boot, no actor — the proof that the
     * run is a tape and not a re-derivation, exactly as replay.mjs means it.
     */
    beginPlaythroughReplay(rle) {
      this._input = bootPlaythrough();
      this._it = null;
      this._replay = { rle, i: 0, left: rle.length ? rle[0][1] : 0 };
      this._trail = [];
      this._log = null;
      this._frames = 0;
      this._done = false;
      this._trace = [];
      this._resetSpan();
      this._resetAudit();
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
      this._resetSpan();
      return snapshot();
    },

    _nextReplayMask() {
      const r = this._replay;
      while (r.i < r.rle.length && r.left <= 0) { r.i++; r.left = r.i < r.rle.length ? r.rle[r.i][1] : 0; }
      if (r.i >= r.rle.length) return null;
      r.left--;
      return r.rle[r.i][0];
    },

    /**
     * What the run did to the room and to the camera, accumulated frame by
     * frame rather than sampled at the end.
     *
     * `roomChanges` is the count of transitions that actually fired — in a
     * `scroll: false` dungeon a transition is a warp and a fade rather than a
     * sliding `game.transition`, so counting room-key changes is the reading
     * that is true of both kinds and is what "exactly one transition fired"
     * has to mean there. The camera span is the pair of extremes the camera
     * reached, which is how "it got all the way to its clamp at both ends"
     * becomes a number a checker can fail on rather than a screenshot.
     */
    _observe() {
      const g = window.__game;
      const key = g.room ? g.mapId + '/' + g.room.key : null;
      if (key !== this._lastRoom) {
        if (this._lastRoom !== null) this._span.roomChanges++;
        this._lastRoom = key;
      }
      // WHAT A TILE BECAME, as a claim a plan can fail on.
      //
      // The span is otherwise about the shape of the run — how many rooms, how
      // far the camera went — and none of that can say "the seed landed here".
      // The Drowned Wood Shrine's replay exists to check a reproduction of the
      // Reefseed's flight against the engine's own, and the only evidence that
      // settles it is the name of the tile the seed came down on. Probes are
      // already declared per plan for the tide readings, so they name the tiles
      // to watch; this records what each one currently IS.
      const probes = window.__rp && window.__rp.probes;
      if (probes && probes.length && g.room) {
        this._span.probeNames = probes.map(([tx, ty]) => g.room.baseName(tx, ty)).join('|');
      }
      const c = g.camera;
      if (c) {
        const s = this._span;
        if (c.x < s.camMinX) s.camMinX = c.x;
        if (c.x > s.camMaxX) s.camMaxX = c.x;
        if (c.y < s.camMinY) s.camMinY = c.y;
        if (c.y > s.camMaxY) s.camMaxY = c.y;
        s.camEndX = c.x; s.camEndY = c.y;
      }
    },

    _resetSpan() {
      this._span = {
        roomChanges: 0, camMinX: 0, camMaxX: 0, camMinY: 0, camMaxY: 0, camEndX: 0, camEndY: 0,
        probeNames: '',
      };
      this._lastRoom = null;
    },

    /**
     * The playthrough audit: the things that are only true of a WHOLE run, and
     * that are invisible in a final snapshot because they are about what
     * happened on the way.
     *
     * "The player was never soft-locked" and "nothing was handed to it" are both
     * of that kind. A run that died in the crab room, reloaded, and carried on
     * finishes with the same inventory as one that never took a hit — the
     * difference is entirely in the middle, so it has to be watched frame by
     * frame or it cannot be asserted at all.
     */
    _resetAudit() {
      const g = window.__game;
      this._audit = {
        minHearts: g.progress ? g.progress.hearts : 0,
        deaths: 0,
        // Every item id the run ever held, with the frame it first held it.
        // This is the no-shortcuts evidence: the harness grants nothing, so
        // every entry here was picked up, opened or given by a cutscene, and
        // the frame says when.
        gained: [],
        // Modes the run entered. A playthrough that visits 'title' twice has
        // reloaded a save, which is the cheap reading of "soft-locked".
        modes: [],
        essenceFrames: [],
        maxHearts: g.progress ? g.progress.maxHearts : 0,
        rooms: [],
        // PUSH BLOCKS the run leaned on, and whether any of them ever moved.
        //
        // This is here because of what the first run of this harness found. A
        // block is `solid: true`, `Entity.solid` is documented as "blocks the
        // player like a pushable block", and NOTHING in the movement path reads
        // it — `canOccupy` tests tiles only. So the player walks through every
        // block in the game, `Player.tryPush` never fires (it needs a movement
        // HIT), and no block has ever been pushed. Recording it per run is what
        // turns that from a thing somebody noticed into a thing that stays
        // noticed.
        blocksTouched: 0,
        blocksMoved: 0,
        // Health at every room boundary — see _roomHealthTick's comment.
        roomHealth: [],
      };
      this._seenItems = new Set();
      this._seenRooms = new Set();
      this._blockHome = new Map();
      this._lastMode = null;
      this._curRoomKey = null;
      this._curRoomEntry = null;
      this._lastHeartsInRoom = null;
    },

    /**
     * One entry per room VISIT (a room entered twice gets two entries — the
     * health economy question is "what did this pass through the room cost",
     * not "what is true of the room in general"). Opened the instant the room
     * key changes and closed the same way.
     *
     * `damage` and `healing` are summed deltas, not `enter - exit`: a room
     * that costs three hearts and hands back two off a drop should not read
     * as "cost one heart" — the trough is what a player actually felt, and
     * `minHearts` is what carries that.
     */
    _roomHealthTick(g, p, rk) {
      if (rk !== this._curRoomKey) {
        if (this._curRoomEntry) {
          this._curRoomEntry.exitHearts = this._lastHeartsInRoom;
          this._curRoomEntry.exitFrame = this._frames;
          this._audit.roomHealth.push(this._curRoomEntry);
        }
        this._curRoomKey = rk;
        this._curRoomEntry = rk ? {
          room: rk, enterFrame: this._frames, enterHearts: p.hearts,
          minHearts: p.hearts, maxHearts: p.hearts, damage: 0, healing: 0,
        } : null;
        this._lastHeartsInRoom = rk ? p.hearts : null;
      }
      if (!this._curRoomEntry) return;
      const cur = p.hearts;
      if (this._lastHeartsInRoom != null && cur !== this._lastHeartsInRoom) {
        const d = cur - this._lastHeartsInRoom;
        if (d < 0) this._curRoomEntry.damage += -d; else this._curRoomEntry.healing += d;
      }
      if (cur < this._curRoomEntry.minHearts) this._curRoomEntry.minHearts = cur;
      if (cur > this._curRoomEntry.maxHearts) this._curRoomEntry.maxHearts = cur;
      this._lastHeartsInRoom = cur;
    },

    _audit_tick() {
      const g = window.__game, a = this._audit;
      if (!a || !g.progress) return;
      const p = g.progress;
      if (p.hearts < a.minHearts) a.minHearts = p.hearts;
      if (p.maxHearts > a.maxHearts) a.maxHearts = p.maxHearts;
      if (p.deaths > a.deaths) a.deaths = p.deaths;
      for (const id of Object.keys(p.items)) {
        const tag = id + '@' + p.items[id];
        if (!this._seenItems.has(tag)) {
          this._seenItems.add(tag);
          a.gained.push({ id, level: p.items[id], frame: this._frames });
        }
      }
      if (a.essenceFrames.length < p.essences.length) {
        a.essenceFrames.push({ index: p.essences[p.essences.length - 1], frame: this._frames });
      }
      if (g.mode !== this._lastMode) { this._lastMode = g.mode; a.modes.push(g.mode); }
      const rk = g.room ? g.mapId + '/' + g.room.key : null;
      if (rk && !this._seenRooms.has(rk)) { this._seenRooms.add(rk); a.rooms.push(rk); }
      this._roomHealthTick(g, p, rk);
      for (const e of g.entities) {
        if (!e.pushable && e.type !== 'block' && !(e.push && e.solid)) continue;
        const id = rk + '#' + e.id;
        if (!this._blockHome.has(id)) { this._blockHome.set(id, e.x + ',' + e.y); a.blocksTouched++; }
        else if (this._blockHome.get(id) !== e.x + ',' + e.y) {
          this._blockHome.set(id, '\u0000moved');
          a.blocksMoved++;
        }
      }
    },

    _push(mask) {
      this._frames++;
      this._observe();
      if (this._log) {
        const last = this._log[this._log.length - 1];
        if (last && last[0] === mask) last[1]++;
        else this._log.push([mask, 1]);
      }
      if (this._audit) this._audit_tick();
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
        // GOD MODE. Off unless a setup asks for it, and it is NOT a proof of
        // difficulty — a run with this on says nothing about whether the game
        // is fair, only about whether it is STRUCTURALLY completable: whether
        // every room, key, gate, boss and essence can actually be reached and
        // resolved in order. Kept honest by `state().godMode`, which every tool
        // that consumes a run must report; a green run with this flag set and
        // unreported would be the most misleading artifact in the repo.
        if (this._god) {
          const g = window.__game;
          const p = g.player;
          if (p) p.invuln = Math.max(p.invuln || 0, 600);
          if (g.progress) g.progress.hearts = g.progress.maxHearts;
        }
        window.__harness.step(1);
        this._push(mask);
      }
      return { done: this._done, frames: this._frames };
    },

    result() {
      // Close the still-open room-health entry, so the last room visited
      // shows up in the table too rather than only in `_curRoomEntry`.
      if (this._audit && this._curRoomEntry) {
        this._curRoomEntry.exitHearts = this._lastHeartsInRoom;
        this._curRoomEntry.exitFrame = this._frames;
        this._audit.roomHealth.push(this._curRoomEntry);
        this._curRoomEntry = null;
      }
      return {
        godMode: !!this._god,
        input: this._log, frames: this._frames, trail: this._trail,
        trace: this._trace || [], state: snapshot(),
        span: this._span, audit: this._audit || null,
      };
    },
  };

  window.__rp = rp;
  window.__rpButtons = BUTTONS;
  return BUTTONS;
}
