// check-sword — the sword hits where Oracle of Seasons' sword hits.
//
// "Swinging next to an enemy often results in a miss that doesn't match the
// source games" (the human, S149). It did not match because the blade was a
// box straight out in front, live only in the middle of the swing. On the
// cartridge the blade is live on EVERY frame of the swing and its hit area
// travels: out to Link's side, then the diagonal, then full reach, then drawn
// back (SWORD_ARC in src/data/feel.js, read from the oracles-disasm
// disassembly). An enemy's hit area is 12x12 on the middle of its sprite.
//
// Each case parks Link on open ground, stands one frozen octorok at a place
// relative to him, taps the sword once, runs the whole swing in the real
// engine and asks whether the octorok was hurt. The expected answers are
// what the cartridge's own arc gives for that place — including the misses:
// a foe on the side the swing ENDS on, or behind him, is not struck.
//
// Since S172 it also checks the SPIN (Link stands still; the blade hits from
// eight positions out where it is, SPIN_ARC), WHAT THE BLADE CUTS (one tile
// under one point per animation frame, SWORD_CUT_POINTS — a swing used to cut
// four tufts), and that a charged blade FLASHES in the cartridge's palette 5
// on 4-frame beats instead of throwing out sparkles; and the POKE (the held
// blade pushed into a wall or walked into an enemy) and the spin's double
// damage.
//
//   node tools/check-sword.mjs
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
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

let passed = 0; const failures = [];
function check(name, cond, detail) {
  if (cond) { passed++; console.log('  ok   ' + name); }
  else { failures.push(name); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
}
function section(s) { console.log('\n--- ' + s + ' ---'); }

const { chromium } = await loadPlaywright();
const PORT = 20000 + Math.floor(Math.random() * 20000);
const server = await serve(PORT);
// Fall back to a system Chromium when the installed browser build does not
// match the installed playwright package (see test.mjs / solve-switches.mjs).
const browser = await chromium.launch({ headless: true }).catch(async (err) => {
  const { existsSync } = await import('node:fs');
  const fallback = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';
  if (!existsSync(fallback)) throw err;
  return chromium.launch({ headless: true, executablePath: fallback });
});
const page = await browser.newPage({ viewport: { width: 800, height: 720 } });
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + (e.stack || e.message)));
page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

await page.goto(`http://localhost:${PORT}/index.html?seed=20260806`, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.__game && !!window.__harness, { timeout: 15000 });
await page.evaluate(() => window.__harness.takeOver());

/**
 * Park the player somewhere with an item, holding no buttons.
 *
 * `input` is stubbed rather than driven with real key events, because every
 * assertion here is about what an item DOES and none is about input plumbing —
 * and a stub makes "hold B for 40 frames" exact instead of approximate.
 */
await page.evaluate(async () => {
  const prog = await import('/src/game/progress.js');
  const ent = await import('/src/game/entity.js');
  window.__P = prog; window.__E = ent;
  window.__hold = (keys) => {
    const g = window.__game;
    const set = new Set(keys);
    g.input.down = (k) => set.has(k);
    g.input.pressed = (k) => false;
    g.input.released = (k) => false;
    g.input.anyDir = () => set.has('up') || set.has('down') || set.has('left') || set.has('right');
    g.input.takeExtra = () => null;
  };
  window.__tap = (k) => {
    const g = window.__game;
    let fired = false;
    g.input.down = () => false;
    g.input.pressed = (q) => (q === k && !fired) ? (fired = true) : false;
    g.input.released = () => false;
    g.input.anyDir = () => false;
    g.input.takeExtra = () => null;
  };
  window.__park = (o) => {
    const g = window.__game;
    g.newGame(0, 'PROBE');
    g.mode = 'play';
    g.enterMap(o.map, o.floor | 0, o.rx, o.ry, o.tx * 16, o.ty * 16, o.dir || 'down', { instant: true });
    g.mode = 'play';
    if (g.dialogue) g.dialogue.active = false;
    g.entities = g.entities.filter(e => { if (e === g.player) return true; e.remove = true; return false; });
    g.tide.clearOverrides();   // no override from a previous probe survives
    g.progress.hearts = g.progress.maxHearts = 40;
    g.player.x = o.tx * 16; g.player.y = o.ty * 16;
    g.player.z = 0; g.player.dir = o.dir || 'down';
    g.player.lastSafe.x = g.player.x; g.player.lastSafe.y = g.player.y;
    g.player.invuln = 100000;
    for (const [id, lv] of Object.entries(o.items || {})) window.__P.giveItem(g.progress, id, lv);
    g.progress.equipB = o.equipB || null;
    g.progress.equipA = o.equipA || 'sword';
    if (o.tide != null) g.tide.setLevel(o.tide, { instant: true });
    window.__hold([]);
  };
  window.__standable = (tx, ty) => window.__E.canOccupy(
    window.__game, window.__game.player, tx * 16, ty * 16,
    { jumping: false, swim: false, cutting: false });

});

const park = (o) => page.evaluate(o => window.__park(o), o);

async function swingAt(dir, dx, dy, splitFang) {
  await park({ map: 'overworld', rx: 4, ry: 7, tx: 4, ty: 4, tide: 1, dir, items: { sword: 1 } });
  return page.evaluate(async ([dir, dx, dy]) => {
    const g = window.__game, p = g.player;
    const ent = await import('/src/game/entity.js');
    const e = ent.spawnEntity(g, 'octorok', 0, 0, {});
    e.x = p.x + dx; e.y = p.y + dy;
    e.update = () => {};          // frozen: the question is the blade, not the AI
    g.entities.push(e);
    const hp0 = e.hp;
    p.dir = dir;
    window.__tap('a');
    window.__harness.step(1);
    window.__hold([]);
    window.__harness.step(24);
    return { hurt: e.hp < hp0 || e.dead, hp0, hp: e.hp };
  }, [dir, dx, dy]);
}

// [facing, enemy dx, enemy dy (px, sprite to sprite), expected, why]
const CASES = [
  ['down', 0, 16, true, 'in front'],
  ['down', 0, 32, true, 'two tiles in front: full reach'],
  ['down', -16, 0, true, 'beside him on the side the swing STARTS'],
  ['down', -16, 16, true, 'on the diagonal the swing passes through'],
  ['down', 16, 0, false, 'beside him on the side the swing ends on'],
  ['down', 0, -16, false, 'behind him'],
  ['up', 0, -16, true, 'in front'],
  ['up', 16, 0, true, 'beside him on the side the swing starts'],
  ['up', 16, -16, true, 'on the diagonal'],
  ['up', 0, 16, false, 'behind him'],
  ['right', 16, 0, true, 'in front'],
  ['right', 0, -16, true, 'above him, where the swing starts'],
  ['right', 16, -16, true, 'on the diagonal'],
  ['right', 0, 16, false, 'below him, where no part of the swing goes'],
  ['right', -16, 0, false, 'behind him'],
  ['left', -16, 0, true, 'in front'],
  ['left', 0, -16, true, 'above him, where the swing starts'],
  ['left', -16, -16, true, 'on the diagonal'],
  ['left', 16, 0, false, 'behind him'],
];

section('where one swing lands');
for (const [dir, dx, dy, want, why] of CASES) {
  const r = await swingAt(dir, dx, dy);
  check(`facing ${dir}, a foe ${why} (${dx},${dy}) is ${want ? 'hit' : 'missed'}`, r.hurt === want, JSON.stringify(r));
}

section('the blade is live from the first frame');
{
  await park({ map: 'overworld', rx: 4, ry: 7, tx: 4, ty: 4, tide: 1, dir: 'down', items: { sword: 1 } });
  const r = await page.evaluate(async () => {
    const g = window.__game, p = g.player;
    const ent = await import('/src/game/entity.js');
    const e = ent.spawnEntity(g, 'octorok', 0, 0, {});
    e.x = p.x - 16; e.y = p.y; e.update = () => {}; g.entities.push(e);
    const hp0 = e.hp;
    p.dir = 'down';
    window.__tap('a');
    window.__harness.step(1);   // the press is read after the player's update: the swing starts here
    window.__hold([]);
    window.__harness.step(1);   // ...and this is its first frame
    return { hurt: e.hp < hp0 };
  });
  check('a foe at Link\'s side is struck on the swing\'s very first frame', r.hurt, JSON.stringify(r));
}

// THE SPIN (S172). Seasons roots Link for the whole spin and hits with the
// blade where it is at each of eight positions (SPIN_ARC): an 18x18 box out at
// up to 19 px, so it reaches two tiles off on a cardinal — where the old 30x30
// square on Link reached 15 px — and still misses what is past the blade.
async function spinAt(dir, dx, dy) {
  await park({ map: 'overworld', rx: 4, ry: 7, tx: 4, ty: 4, tide: 1, dir, items: { sword: 1 } });
  return page.evaluate(async ([dir, dx, dy]) => {
    const g = window.__game, p = g.player;
    const ent = await import('/src/game/entity.js');
    const e = ent.spawnEntity(g, 'octorok', 0, 0, {});
    e.x = p.x + dx; e.y = p.y + dy;
    e.update = () => {};
    g.entities.push(e);
    const hp0 = e.hp;
    p.dir = dir;
    const x0 = p.x, y0 = p.y;
    p.startSpin(g);
    let moved = false;
    window.__hold([dir]);       // pushing the way he faces all spin long
    for (let i = 0; i < 25; i++) { window.__harness.step(1); if (p.spinning > 0 && (p.x !== x0 || p.y !== y0)) moved = true; }
    window.__hold([]);
    return { hurt: e.hp < hp0 || e.dead, moved };
  }, [dir, dx, dy]);
}

const SPIN_CASES = [
  ['down', 32, 0, true, 'two tiles to his side, past the old square'],
  ['down', 0, -28, true, 'most of two tiles behind him'],
  ['right', 24, 24, true, 'on the diagonal a tile and a half off'],
  ['down', 32, 32, false, 'two tiles off on the diagonal, past the blade'],
  ['up', 48, 0, false, 'three tiles off'],
];
section('where a spin lands, and that he stands still');
for (const [dir, dx, dy, want, why] of SPIN_CASES) {
  const r = await spinAt(dir, dx, dy);
  check(`spinning facing ${dir}, a foe ${why} (${dx},${dy}) is ${want ? 'hit' : 'missed'}`, r.hurt === want, JSON.stringify(r));
  check(`spinning facing ${dir} with the direction held, Link does not move`, !r.moved, JSON.stringify(r));
}

// WHAT THE BLADE CUTS (S172). The cartridge breaks ONE tile per animation
// frame that asks for it: the tile under a point 13-14 px from Link's centre
// (SWORD_CUT_POINTS). A swing cuts the tuft right in front of him and not the
// one beyond it, nor the one on the diagonal; a spin cuts all eight round him
// and the one he stands on.
async function cutPattern(spin, dir) {
  await park({ map: 'overworld', rx: 4, ry: 7, tx: 4, ty: 4, tide: 1, dir, items: { sword: 1 } });
  return page.evaluate(async ([spin, dir]) => {
    const g = window.__game, p = g.player, room = g.room;
    const tx = Math.floor(p.cx / 16), ty = Math.floor(p.cy / 16);
    const cells = [];
    for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) {
      room.setTile(tx + x, ty + y, 'tallgrass'); cells.push([x, y]);
    }
    p.dir = dir;
    if (spin) { p.startSpin(g); window.__hold([]); window.__harness.step(27); }
    else { window.__tap('a'); window.__harness.step(1); window.__hold([]); window.__harness.step(24); }
    const cut = cells.filter(([x, y]) => room.baseName(tx + x, ty + y) !== 'tallgrass').map(c => c.join(','));
    return cut.sort().join(' ');
  }, [spin, dir]);
}
section('what the blade cuts');
{
  const want = { down: '0,1', up: '0,-1', right: '1,0', left: '-1,0' };
  for (const dir of ['down', 'up', 'right', 'left']) {
    const r = await cutPattern(false, dir);
    check(`a swing facing ${dir} cuts the one tuft in front of him (${want[dir]})`, r === want[dir], r);
  }
  const ring = ['-1,-1', '-1,0', '-1,1', '0,-1', '0,0', '0,1', '1,-1', '1,0', '1,1'].sort().join(' ');
  const r = await cutPattern(true, 'down');
  check('a spin cuts the eight tufts round him and the one under him, nothing further', r === ring, r);
}

// CHARGED, THE BLADE FLASHES (S172): sword.s @state3 puts the blade in sprite
// palette 5 on alternate 4-frame beats from the frame it charges — orange
// where it was black — and throws out no sparkles.
section('a charged blade flashes');
{
  await park({ map: 'overworld', rx: 4, ry: 7, tx: 4, ty: 4, tide: 1, dir: 'down', items: { sword: 1 } });
  const r = await page.evaluate(async () => {
    const g = window.__game, p = g.player;
    const { CHARGE_FRAMES, CHARGE_FLASH_BEAT } = await import('/src/data/feel.js');
    const orange = () => {
      g.draw();
      const d = g.screen.ctx.getImageData(0, 0, g.screen.ctx.canvas.width, g.screen.ctx.canvas.height).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i] === 255 && d[i + 1] === 181 && d[i + 2] === 49) n++;
      return n;
    };
    window.__tap('a'); window.__harness.step(1);
    window.__hold(['a']);
    let sparkles = 0;
    const spawn = g.spawnEffect;
    g.spawnEffect = function (name, ...rest) { if (name === 'sparkle') sparkles++; return spawn.call(this, name, ...rest); };
    const before = orange();
    while (p.charge < CHARGE_FRAMES) window.__harness.step(1);
    const on = orange();
    for (let i = 0; i < CHARGE_FLASH_BEAT; i++) {
      window.__harness.step(1);
    }
    const off = orange();
    for (let i = 0; i < 30; i++) window.__harness.step(1);
    g.spawnEffect = spawn;
    return { before, on, off, sparkles, hold: p.spriteName(g) };
  });
  check('the blade is in its own colours while it charges', r.before === 0, JSON.stringify(r));
  check('on the frame it charges the blade turns orange', r.on > 10, JSON.stringify(r));
  check('a beat later it is back in its own colours', r.off === 0, JSON.stringify(r));
  check('no sparkles are thrown out', r.sparkles === 0, JSON.stringify(r));
}

// THE POKE (S172). Held out, the blade does not stay out against what it
// meets. Pushed into a wall Link pokes it — the blade jabs out and back over
// SWORD_POKE_PHASES, Link rooted, a clink off the wall — and the hold starts
// its charge over, so leaning on a wall never charges a spin. Walked into an
// enemy it lands one swing's worth of damage and is put away until the button
// is pressed again. Walked through grass it cuts nothing; poked into a bush,
// it cuts the bush.
async function holdInto(setupFn, keys, frames) {
  return page.evaluate(async ([setupSrc, keys, frames]) => {
    const g = window.__game, p = g.player;
    const ent = await import('/src/game/entity.js');
    const { CHARGE_FRAMES } = await import('/src/data/feel.js');
    const ctx = { g, p, ent };
    // The blade is out first, in open ground: a swing, then the hold.
    window.__tap('a'); window.__harness.step(1);
    window.__hold(['a']); window.__harness.step(24);
    const extra = new Function('ctx', setupSrc)(ctx) || {};
    const sounds = [];
    const sfx = g.audio.sfx.bind(g.audio);
    g.audio.sfx = (n, ...r) => { sounds.push(n); return sfx(n, ...r); };
    window.__hold(keys);
    let pokes = 0, maxCharge = 0, wasPoking = false, holdingAfterPoke = 0, x0 = null, movedInPoke = false;
    for (let i = 0; i < frames; i++) {
      window.__harness.step(1);
      if (p.poking > 0 && !wasPoking) { pokes++; x0 = [p.x, p.y]; }
      if (p.poking > 0 && x0 && (p.x !== x0[0] || p.y !== x0[1])) movedInPoke = true;
      if (pokes > 0 && p.poking === 0 && p.holding) holdingAfterPoke++;
      wasPoking = p.poking > 0;
      maxCharge = Math.max(maxCharge, p.charge);
    }
    g.audio.sfx = sfx;
    window.__hold(['a']); window.__harness.step(14);   // let go of the direction only
    const heldAfter = p.holding;
    window.__hold([]);
    const out = { heldAfter, pokes, charged: maxCharge >= CHARGE_FRAMES, holdingAfterPoke, movedInPoke,
      clinks: sounds.filter(n => n === 'block' || n === 'clinkHollow').length };
    if (extra.after) Object.assign(out, extra.after());
    return out;
  }, [setupFn, keys, frames]);
}
section('the poke');
{
  // A wall: tile row above Link made solid.
  await park({ map: 'overworld', rx: 4, ry: 7, tx: 4, ty: 4, tide: 1, dir: 'up', items: { sword: 1 } });
  let r = await holdInto(`
    const { g, p } = ctx; const tx = Math.floor(p.cx / 16), ty = Math.floor(p.cy / 16);
    for (let x = -2; x <= 2; x++) g.room.setTile(tx + x, ty - 1, 'cliff');`, ['a', 'up'], 200);
  check('pushing the held blade into a wall pokes it, and pokes again while he keeps pushing', r.pokes >= 2, JSON.stringify(r));
  check('each poke clinks off the wall', r.clinks >= r.pokes && r.clinks > 0, JSON.stringify(r));
  check('Link stands still while he pokes', !r.movedInPoke, JSON.stringify(r));
  check('once he stops pushing, the blade is held out again', r.heldAfter, JSON.stringify(r));
  check('leaning on a wall never charges a spin: each poke starts the charge over', !r.charged, JSON.stringify(r));

  await park({ map: 'overworld', rx: 4, ry: 7, tx: 4, ty: 4, tide: 1, dir: 'up', items: { sword: 1 } });
  r = await holdInto(`
    const { g, p } = ctx; const tx = Math.floor(p.cx / 16), ty = Math.floor(p.cy / 16);
    for (let x = -2; x <= 2; x++) g.room.setTile(tx + x, ty - 1, 'cliffCracked');
    const sounds = []; const sfx = g.audio.sfx.bind(g.audio);
    g.audio.sfx = (n, ...r) => { sounds.push(n); return sfx(n, ...r); };
    return { after: () => ({ hollow: sounds.filter(n => n === 'clinkHollow').length, plain: sounds.filter(n => n === 'block').length }) };`, ['a', 'up'], 60);
  check('poked, a wall a bomb would open clinks hollow', r.hollow > 0 && r.plain === 0, JSON.stringify(r));

  await park({ map: 'overworld', rx: 4, ry: 7, tx: 4, ty: 4, tide: 1, dir: 'down', items: { sword: 1 } });
  r = await holdInto(`
    const { g, p, ent } = ctx;
    const e = ent.spawnEntity(g, 'octorok', 0, 0, {}); e.x = p.x; e.y = p.y + 40; e.update = () => {};
    e.hp = 100; g.entities.push(e);
    return { after: () => ({ lost: 100 - e.hp }) };`, ['a', 'down'], 90);
  const { swordDamage } = await page.evaluate(async () => ({ swordDamage: (await import('/src/game/player.js')).swordDamage(1) }));
  check('walking the held blade into an enemy hits it once, for a swing\'s damage', r.lost === swordDamage, JSON.stringify(r) + ' swing=' + swordDamage);
  check('...pokes, and puts the sword away while the button is still held', r.pokes === 1 && r.holdingAfterPoke === 0 && !r.heldAfter, JSON.stringify(r));

  await park({ map: 'overworld', rx: 4, ry: 7, tx: 4, ty: 4, tide: 1, dir: 'down', items: { sword: 1 } });
  r = await holdInto(`
    const { g, p } = ctx; const tx = Math.floor(p.cx / 16), ty = Math.floor(p.cy / 16);
    for (let y = 1; y <= 3; y++) g.room.setTile(tx, ty + y, 'tallgrass');
    return { after: () => ({ grass: [1, 2, 3].filter(y => g.room.baseName(tx, ty + y) === 'tallgrass').length }) };`, ['a', 'down'], 50);
  check('walking the held blade through tall grass cuts nothing', r.grass >= 2 && r.pokes === 0, JSON.stringify(r));

  await park({ map: 'overworld', rx: 4, ry: 7, tx: 4, ty: 4, tide: 1, dir: 'down', items: { sword: 1 } });
  r = await holdInto(`
    const { g, p } = ctx; const tx = Math.floor(p.cx / 16), ty = Math.floor(p.cy / 16);
    g.room.setTile(tx, ty + 1, 'bush');
    return { after: () => ({ bush: g.room.baseName(tx, ty + 1) }) };`, ['a', 'down'], 60);
  check('poking the held blade into a bush cuts it', r.bush !== 'bush' && r.pokes >= 1, JSON.stringify(r));
}

section('a spin hits twice as hard as a swing');
{
  await park({ map: 'overworld', rx: 4, ry: 7, tx: 4, ty: 4, tide: 1, dir: 'down', items: { sword: 1 } });
  const r = await page.evaluate(async () => {
    const g = window.__game, p = g.player;
    const ent = await import('/src/game/entity.js');
    const e = ent.spawnEntity(g, 'octorok', 0, 0, {}); e.x = p.x; e.y = p.y + 20; e.update = () => {};
    e.hp = 100; g.entities.push(e);
    p.startSpin(g); window.__hold([]); window.__harness.step(26);
    return { lost: 100 - e.hp, swing: p.swordHit(g) };
  });
  check('the spin lands double the swing\'s damage', r.lost === r.swing * 2, JSON.stringify(r));
}

console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
if (errs.length) { console.log(errs.slice(0, 5).join('\n')); }
await browser.close(); server.close();
process.exit(failures.length || errs.length ? 1 : 0);
