// REAL BLOCK PUZZLES ARE PUZZLES (S204, docs/briefs/PUZZLE-PASS.md kind A).
//
// Every switch room used to be one push: a block seated next to its plate
// (solve-switches.mjs proves those). A room that declares
//
//   blockRoom: { pockets: [[x, y], ...], seas: [0, 1], door?: [x, y], anchor? }
//
// has blocks that move any number of times (`once: false`), and this searches
// it IN THE ENGINE: a state is where every block stands and the sea; a move is
// one push (the block's own `PushBlock.push`, then its own slide, so a block
// that lands on an open hole goes down it) from a tile Link can walk to at
// that sea, or a sound of the conch. Link's reach is flooded with the
// engine's own collision (tools/lib/collision.mjs, live in the page) with the
// blocks as walls, from the room's west door. It proves, per room:
//
//   1. the room can be solved: some sequence puts a block in every pocket;
//   2. no single sea solves it (the conch is part of the puzzle), and the
//      shortest solution sounds it at every sea in `seas`;
//   3. it is not one push per block: the shortest solution takes more pushes
//      than there are blocks;
//   4. the solution, played back through the real puzzle check, pays out;
//   5. with `anchor: { at, from, level }` (the Tidewright's Anchor, held at
//      `level` on `at`, thrown from `from`): no solution exists without it,
//      and the shortest one with it drops it.
//
// Usage: node tools/check-blocks.mjs
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { installRuntime } from './actor-runtime.mjs';
import { installData } from '../src/data/index.js';
import { MAPS } from '../src/world/maps.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
installData();

let pass = 0; const fail = [];
const check = (n, c, d) => c ? (pass++, console.log('  ok   ' + n))
  : (fail.push(n), console.log('  FAIL ' + n + (d ? ' — ' + d : '')));

const CLAIMS = [];
for (const [mapId, m] of MAPS) {
  for (const [key, def] of Object.entries(m.roomDefs || {})) {
    if (def.blockRoom) CLAIMS.push({ mapId, key, def, k: def.blockRoom });
  }
}
check('at least one room claims a real block puzzle', CLAIMS.length > 0);

const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const full = join(ROOT, normalize(p)); const s = await stat(full).catch(() => null);
  if (!s || !s.isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': extname(full) === '.html' ? 'text/html' : 'text/javascript' }); res.end(await readFile(full));
});
await new Promise(r => server.listen(0, r));
const browser = await chromium.launch().catch(() =>
  chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' }));
const page = await browser.newPage();
await page.goto(`http://localhost:${server.address().port}/index.html`);
await page.waitForFunction(() => window.__game && window.__harness);
await page.evaluate(installRuntime);

for (const c of CLAIMS) {
  const [f, rx, ry] = c.key.split(',').map(Number);
  const door = c.k.door || (c.def.map[5][0] === '.' ? [0, 5] : null);
  await page.evaluate(([setup]) => window.__rp.beginRecord(setup, [['wait', 2]]), [{
    seed: 20260930, items: { sword: 1, conch: 1 }, equipA: 'sword', equipB: 'conch',
    maxHearts: 24, hearts: 24, tide: 0,
    enter: [c.mapId, f, rx, ry, door ? door[0] * 16 + (door[0] ? 0 : 8) : 8, door ? door[1] * 16 + (door[1] ? 1 : 8) : 81, door && door[1] === 0 ? 'down' : 'right'],
  }]);
  await page.evaluate(() => window.__rp.pump(10));
  const r = await page.evaluate(async ([pockets, door, single, anchor]) => {
    const g = window.__game;
    const { PushBlock } = await import('/src/game/objects.js');
    const { tileWalkable, ROUTE_AVOID } = await import('/tools/lib/collision.mjs');
    const { sp } = await import('/src/core/fixed.js');
    const feel = await import('/src/data/feel.js');
    g.enemiesOff = true;
    for (const e of g.entities) if (e.isEnemy) e.remove = true;
    window.__harness.step(1);
    const room = g.room, T = 16;
    const blocks = g.entities.filter(e => e instanceof PushBlock);
    const caps = g.player.caps || { jumping: false, swim: false, cutting: false };
    const place = (b, x, y) => { b.fx = sp(x * T); b.fy = sp(y * T); b.slide = null; b.remove = false; b.moved = false; };
    // A state's sea is `level` or `level + 'a'` with the Anchor down.
    let held = null;
    const setSea = (s) => {
      const anc = typeof s === 'string';
      g.tide.setLevel(anc ? Number(s[0]) : s, { instant: true });
      if (held != null && !anc) { g.tide.removeOverride(held); held = null; }
      if (held == null && anc) held = g.tide.addOverride({
        mapId: g.mapId, roomKey: room.key, tx: anchor.at[0], ty: anchor.at[1],
        r: feel.ANCHOR_RADIUS_TILES, shape: feel.ANCHOR_SHAPE, level: anchor.level, src: 'anchor',
      });
    };
    const reach = (pos, sea) => {
      const solid = new Set(pos.filter(Boolean).map(p => p.join(',')));
      const seen = new Set([door.join(',')]); const q = [door];
      while (q.length) {
        const [x, y] = q.pop();
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
          if (seen.has(k) || !room.inBounds(nx, ny) || solid.has(k)) continue;
          if (!tileWalkable(room, nx, ny, g.tide, caps, ROUTE_AVOID)) continue;
          seen.add(k); q.push([nx, ny]);
        }
      }
      return seen;
    };
    // One push of block i in (dx, dy) from state `pos` at `sea`, by the
    // engine: null if it will not move, 'gone' if it went down a hole.
    const push = (pos, sea, i, dx, dy) => {
      setSea(sea);
      blocks.forEach((b, j) => pos[j] ? place(b, ...pos[j]) : place(b, -5, -5));
      const b = blocks[i];
      if (!b.push(g, dx, dy)) return null;
      for (let n = 0; n < 200 && b.slide && !b.remove; n++) b.update(g);
      if (b.remove) return 'gone';
      return [Math.round(b.x / T), Math.round(b.y / T)];
    };
    const start = blocks.map(b => [Math.round(b.x / T), Math.round(b.y / T)]);
    const goal = (pos) => pockets.every(([x, y]) => pos.some(p => p && p[0] === x && p[1] === y));
    const keyOf = (pos, sea) => sea + '|' + pos.map(p => p ? p.join(',') : '-').join(';');
    let useAnchor = false;
    const search = (seas) => {
      const first = { pos: start, sea: seas[0], path: [] };
      const seen = new Set([keyOf(start, seas[0])]); let q = [first];
      while (q.length) {
        const next = [];
        for (const s of q) {
          if (goal(s.pos)) return s;
          const anc = typeof s.sea === 'string';
          for (const lv of seas) {
            const sea = anc ? lv + 'a' : lv;
            if (sea === s.sea) continue;
            const k = keyOf(s.pos, sea);
            if (!seen.has(k)) { seen.add(k); next.push({ pos: s.pos, sea, path: [...s.path, ['sea', sea]] }); }
          }
          setSea(s.sea);
          const rch = reach(s.pos, s.sea);
          if (useAnchor && !anc && s.sea === anchor.level && rch.has(anchor.from.join(','))) {
            const sea = s.sea + 'a', k = keyOf(s.pos, sea);
            if (!seen.has(k)) { seen.add(k); next.push({ pos: s.pos, sea, path: [...s.path, ['anchor']] }); }
          }
          s.pos.forEach((p, i) => {
            if (!p) return;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              if (!rch.has((p[0] - dx) + ',' + (p[1] - dy))) continue;
              const to = push(s.pos, s.sea, i, dx, dy);
              if (!to) continue;
              const pos = s.pos.slice(); pos[i] = to === 'gone' ? null : to;
              const k = keyOf(pos, s.sea);
              if (!seen.has(k)) { seen.add(k); next.push({ pos, sea: s.sea, path: [...s.path, ['push', i, dx, dy]] }); }
            }
          });
        }
        q = next;
      }
      return null;
    };
    const out = { blocks: blocks.length };
    if (anchor) { out.bare = !!search([0, 1, 2]); useAnchor = true; }
    const best = search([0, 1, 2]);
    out.solved = !!best;
    if (best) {
      out.pushes = best.path.filter(p => p[0] === 'push').length;
      out.seas = [...new Set([0, ...best.path.filter(p => p[0] === 'sea').map(p => Number(String(p[1])[0]))])].sort();
      out.anchored = best.path.some(p => p[0] === 'anchor');
      out.path = best.path;
      // Played back through the room's own puzzle check.
      blocks.forEach((b, j) => place(b, ...start[j]));
      let pos = start.slice(), sea = 0;
      for (const st of best.path) {
        if (st[0] === 'sea') { sea = st[1]; continue; }
        if (st[0] === 'anchor') { sea = sea + 'a'; continue; }
        const to = push(pos, sea, st[1], st[2], st[3]);
        pos = pos.slice(); pos[st[1]] = to === 'gone' ? null : to;
      }
      setSea(sea);
      blocks.forEach((b, j) => pos[j] && place(b, ...pos[j]));
      for (let n = 0; n < 4; n++) window.__harness.step(1);
      out.paid = !!room._puzzleDone;
    }
    out.single = single.map(s => !!search([s]));
    return out;
  }, [c.k.pockets, door, [0, 1, 2], c.k.anchor || null]);
  const name = `${c.mapId} ${c.key} (${c.def.name})`;
  check(`${name}: has a door to start from`, !!door);
  check(`${name}: can be solved by pushing`, r.solved, JSON.stringify(r));
  check(`${name}: no single sea solves it`, r.single.every(x => !x), `solvable at ${r.single.map((x, i) => x ? i : null).filter(x => x !== null)}`);
  check(`${name}: the shortest solution sounds the conch for ${c.k.seas.join('/')}`,
    JSON.stringify(r.seas) === JSON.stringify([...c.k.seas].sort()), JSON.stringify(r.seas));
  check(`${name}: more than one push per block (${r.pushes} pushes for ${r.blocks} blocks)`, r.pushes > r.blocks);
  check(`${name}: the solution, played through the room's own puzzle check, pays out`, r.paid);
  if (c.k.anchor) {
    check(`${name}: cannot be solved without the Anchor`, r.bare === false);
    check(`${name}: the shortest solution drops the Anchor on ${c.k.anchor.at}`, r.anchored);
  }
}

await browser.close(); server.close();
console.log(`\n=== ${pass} passed, ${fail.length} failed ===`);
process.exit(fail.length ? 1 : 0);
