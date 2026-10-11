// Things that go over a hole go DOWN it, as Oracle of Seasons draws it (S185).
//
// The cartridge replaces anything that ends up over a hole with one
// interaction, INTERAC_FALLDOWNHOLE (object_code/common/interactions/
// fallDownHole.s): a ball that shrinks in three pictures held 8, 12 and 12
// frames while it slides to the middle of the hole at SPEED_60, with
// SND_FALLINHOLE. Who becomes it:
//   * a thrown pot or rock that LANDS on a hole (bracelet.s @state3,
//     objectReplaceWithAnimationIfOnHazard) — it does not break, and drops
//     nothing;
//   * a push block that arrives on one (pushblock.s @func_449d);
//   * an ordinary enemy knocked onto one (enemies/commonCode.s
//     ecom_checkHazards): harmless at once, pulled half a pixel toward the
//     middle every 8 frames for up to 60, then down — counted as beaten,
//     dropping nothing;
//   * a dropped rupee or heart that comes to rest on one (itemDrop.s
//     itemDrop_checkOnHazard). A key does not.
// And what must NOT happen: an enemy walking about beside a hole never
// walks into it of its own accord (its avoid mask still holds off a knock).
//
// Driven in the real engine, on an open screen with holes laid by hand.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const server = createServer(async (req, res) => {
  try {
    const u = decodeURIComponent(req.url.split('?')[0]);
    const p = join(ROOT, u === '/' ? 'index.html' : u);
    res.writeHead(200, { 'Content-Type': extname(p) === '.js' ? 'text/javascript' : 'text/html' });
    res.end(await readFile(p));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, r));
async function launch() {
  try { return await chromium.launch(); }
  catch (err) {
    const f = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';
    if (!existsSync(f)) throw err;
    return chromium.launch({ executablePath: f });
  }
}
const browser = await launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
await page.goto(`http://localhost:${server.address().port}/index.html`);
await page.waitForFunction(() => !!window.__game);

let pass = 0; const fail = [];
const check = (n, c, d) => c ? (pass++, console.log('  ok   ' + n)) : (fail.push(n), console.log('  FAIL ' + n + (d ? ' — ' + d : '')));

const r = await page.evaluate(async () => {
  const g = window.__game;
  const { spawnEntity } = await import('/src/game/entity.js');
  const { giveItem } = await import('/src/game/progress.js');
  const F = await import('/src/data/feel.js');
  const step = (n) => { for (let i = 0; i < n; i++) g.update(); };
  const sounds = [];
  const sfx = g.audio.sfx.bind(g.audio);
  g.audio.sfx = (n, ...a) => { sounds.push(n); return sfx(n, ...a); };
  g.newGame && g.newGame();
  g.mode = 'play';
  giveItem(g.progress, 'sword'); giveItem(g.progress, 'bracelet');
  // Row 5 of 0,4,7 is open floor end to end.
  const fresh = (px, py, dir) => {
    g.enterMap('overworld', 0, 4, 7, px, py, dir || 'right', { instant: true });
    g.entities = g.entities.filter(e => !e.isEnemy && !e.isDrop && !e.isEffect);
    // Tiles laid by an earlier case outlive the re-entry: clear them.
    g.room.override.fill(null); g.room.invalidate();
    if (g.dialogue) g.dialogue.active = false;
    const p = g.player; p.invuln = 0;
    p.freeze = true;
    sounds.length = 0;
    return p;
  };
  const holes = (cells) => { for (const [x, y] of cells) g.room.setTile(x, y, 'sinkhole'); };
  const fx = () => g.entities.filter(e => e.isEffect && e.spec && e.spec.frames);
  const holeFx = () => fx().filter(e => e.spec.frames[0] === 'fx_hole0');
  const out = {};

  // 1. THE PICTURE. Spawned at a spot 5 px off a hole's middle, it shows
  // fx_hole0, 1, 2 for 8, 12, 12 frames, slides to the middle at SPEED_60,
  // and is gone after 32.
  {
    fresh(24, 40);
    holes([[5, 5]]);
    const e = g.spawnEffect('hole', 5 * 16 - 5, 5 * 16 - 3);
    const names = [], cx = [], cy = [];
    let life = 0;
    while (!e.remove && life < 100) { step(1); life++; if (!e.remove) { names.push(e.spriteName()); cx.push(e.x + 16); cy.push(e.y + 16); } }
    const runs = [];
    for (const n of names) { if (runs.length && runs[runs.length - 1][0] === n) runs[runs.length - 1][1]++; else runs.push([n, 1]); }
    out.pic = { life, runs, end: [cx[cx.length - 1], cy[cy.length - 1]], first: [cx[0], cy[0]] };
  }

  // 2. A THROWN ROCK THAT LANDS ON A HOLE goes down it: no shatter, no puff,
  // no drop; the hole picture and SND_FALLINHOLE instead.
  {
    const p = fresh(24, 80, 'right');
    p.freeze = false;
    p.dir = 'right';
    const tx = Math.floor((p.cx + F.LIFT_REACH) / 16), ty = Math.floor(p.cy / 16);
    g.room.setTile(tx, ty, 'rock');
    // The throw comes down about 40 px on: lay holes over the whole landing.
    holes([[4, ty], [5, ty], [6, ty], [4, ty + 1], [5, ty + 1], [6, ty + 1]]);
    const lifted = p.tryLift(g, 1);
    step(30);
    const obj = p.carrying;
    p.throwCarried(g);
    sounds.length = 0;
    let n = 0; let sawHole = false, sawPuff = false;
    while (!obj.remove && n < 120) { step(1); n++; }
    for (let i = 0; i < 3; i++) {
      sawHole = sawHole || holeFx().length > 0;
      sawPuff = sawPuff || fx().some(e => e.spec.frames[0] === 'fx_puff0');
      step(1);
    }
    out.rock = {
      lifted, gone: obj.remove, sawHole, sawPuff, sounds: [...sounds],
      drops: g.entities.filter(e => e.isDrop).length,
    };
  }
  // ...and the same throw onto plain floor still breaks, as before.
  {
    const p = fresh(24, 80, 'right');
    p.freeze = false; p.dir = 'right';
    const tx = Math.floor((p.cx + F.LIFT_REACH) / 16), ty = Math.floor(p.cy / 16);
    g.room.setTile(tx, ty, 'rock');
    p.tryLift(g, 1); step(30);
    const obj = p.carrying; p.throwCarried(g); sounds.length = 0;
    let n = 0; while (!obj.remove && n < 120) { step(1); n++; }
    out.rockFloor = { sounds: [...sounds], hole: holeFx().length };
  }

  // 3. A PUSH BLOCK PUSHED ONTO A HOLE goes down it.
  {
    fresh(24, 40);
    holes([[6, 5]]);
    const b = spawnEntity(g, 'block', 5, 5, {});
    step(1);
    const pushed = b.push(g, 1, 0);
    let n = 0, sawHole = false;
    while (!b.remove && n < 80) { step(1); n++; }
    sawHole = holeFx().length > 0;
    out.block = { pushed, gone: b.remove, n, sawHole, sound: sounds.includes('fallInHole') };
  }

  // 4. AN ENEMY KNOCKED ONTO A HOLE: harmless, pulled to the middle, down.
  {
    fresh(24, 40);
    holes([[6, 5], [7, 5], [6, 6], [7, 6]]);
    const e = spawnEntity(g, 'octorok', 5, 5, {});
    e.hp = e.maxHp = 10;
    step(1);
    e.x = 5 * 16 + 4; e.y = 5 * 16;
    const kills = g.progress.kills;
    e.hurt(g, 1, 'right', F.KNOCK_DEFAULT, g.player);
    let n = 0, startedAt = null, harmless = null, positions = [], hurtWhile = null;
    while (!e.remove && n < 200) {
      step(1); n++;
      if (e.holeFall > 0 && startedAt == null) {
        startedAt = n; harmless = e.harmless;
        hurtWhile = e.hurt(g, 1, 'right', 0, g.player);
      }
      if (e.holeFall > 0) positions.push([e.fx, e.fy]);
    }
    let moves = 0, maxMove = 0;
    for (let i = 1; i < positions.length; i++) {
      const d = Math.hypot(positions[i][0] - positions[i - 1][0], positions[i][1] - positions[i - 1][1]);
      if (d > 0) { moves++; maxMove = Math.max(maxMove, d); }
    }
    const pulled = startedAt == null ? null : n - startedAt;
    step(2);
    out.enemy = {
      startedAt, harmless, hurtWhile, pulled, moves, maxMove, gone: e.remove, dead: e.dead,
      kills: g.progress.kills - kills, sawHole: holeFx().length > 0,
      sound: sounds.includes('fallInHole'), puff: fx().some(x => x.spec.frames[0] === 'fx_kill0'),
      hp: e.hp,
    };
    step(200);
    out.enemy.drops = g.entities.filter(x => x.isDrop).length;
  }

  // 5. LEFT TO ITSELF beside holes, an enemy never walks into one.
  {
    fresh(24, 40);
    const cells = [];
    for (let x = 3; x <= 7; x++) cells.push([x, 3], [x, 7]);
    for (let y = 4; y <= 6; y++) cells.push([3, y], [7, y]);
    holes(cells);
    const es = [spawnEntity(g, 'octorok', 5, 5, {}), spawnEntity(g, 'moblin', 5, 4, {})].filter(Boolean);
    for (const e of es) e.hp = e.maxHp = 99;
    g.player.x = 9 * 16; g.player.y = 1 * 16;
    step(900);
    out.walk = { n: es.length, alive: es.filter(e => !e.remove).length, falling: es.filter(e => e.holeFall > 0).length };
  }

  // 6. A DROP THAT COMES DOWN ON A HOLE goes down it; a key stays.
  {
    fresh(24, 40);
    holes([[5, 5], [7, 5]]);
    const { Pickup } = await import('/src/game/objects.js');
    const d = new Pickup(5 * 16, 5 * 16, { kind: 'rupee1', pop: true }); g.addEntity(d);
    const k = new Pickup(7 * 16, 5 * 16, { kind: 'key' }); g.addEntity(k);
    let n = 0, upGone = false;
    while (!d.remove && n < 120) { step(1); n++; if (d.settle > 0 && d.remove) upGone = true; }
    out.drop = { gone: d.remove, n, upGone, key: !k.remove, sawHole: holeFx().length > 0 };
  }
  return out;
});

const R = JSON.stringify;
const pic = r.pic;
// Every effect in this engine is drawn once in the frame it appears, before
// its first update, and is gone in the update that ends it, so the 8, 12, 12
// of the table are drawn as 9, 12, 11 — the same 32 frames, starting one
// frame sooner, exactly as the puff and the kill puff are.
check('the hole picture is fx_hole0, 1, 2 at the cartridge holds 8, 12, 12 (interactionAnimation521fe)',
  R(pic.runs) === R([['fx_hole0', 9], ['fx_hole1', 12], ['fx_hole2', 11]]), R(pic.runs));
check('and is on screen for its 32 frames', pic.runs.reduce((a, x) => a + x[1], 0) === 32, R(pic));
check("it slides to the middle of the hole (fallDownHole.s @state1)",
  pic.end[0] === 5 * 16 + 8 && pic.end[1] === 5 * 16 + 8, R(pic));
check('at SPEED_60, not at once', pic.first[0] !== 5 * 16 + 8 || pic.first[1] !== 5 * 16 + 8, R(pic));
check('a thrown rock landing on a hole goes down it', r.rock.lifted && r.rock.gone && r.rock.sawHole, R(r.rock));
check('and does not break (no shatter, no puff)', !r.rock.sounds.includes('shatter') && !r.rock.sawPuff, R(r.rock));
check('with SND_FALLINHOLE', r.rock.sounds.includes('fallInHole'), R(r.rock));
check('and drops nothing', r.rock.drops === 0, R(r.rock));
check('thrown onto floor, the same rock still breaks', r.rockFloor.sounds.includes('shatter') && r.rockFloor.hole === 0, R(r.rockFloor));
check('a push block pushed onto a hole goes down it', r.block.pushed && r.block.gone && r.block.sawHole && r.block.sound, R(r.block));
check('an enemy knocked onto a hole starts to fall', r.enemy.startedAt != null, R(r.enemy));
check('and is harmless and cannot be hit while it falls', r.enemy.harmless === true && r.enemy.hurtWhile === false, R(r.enemy));
check(`it is pulled at most ${F_PULL()} frames, half a pixel every 8`,
  r.enemy.pulled != null && r.enemy.pulled <= 60 && r.enemy.maxMove <= 129 && r.enemy.moves <= Math.ceil(60 / 8), R(r.enemy));
check('then goes down the hole: the hole picture, SND_FALLINHOLE, no kill puff',
  r.enemy.gone && r.enemy.sawHole && r.enemy.sound && !r.enemy.puff, R(r.enemy));
check('counted as beaten', r.enemy.dead && r.enemy.kills === 1, R(r.enemy));
check('and dropping nothing', r.enemy.drops === 0, R(r.enemy));
check('left to themselves, enemies ringed by holes never walk into one',
  r.walk.n === 2 && r.walk.alive === 2 && r.walk.falling === 0, R(r.walk));
check('a dropped rupee that comes down on a hole goes down it', r.drop.gone && r.drop.sawHole && !r.drop.upGone, R(r.drop));
check('a key lying over a hole does not', r.drop.key, R(r.drop));
check('no page errors', errors.length === 0, errors[0]);
function F_PULL() { return 60; }
console.log(`\n=== ${pass} passed, ${fail.length} failed ===`);
await browser.close(); server.close();
process.exit(fail.length ? 1 : 0);
