// Seasons' three enemy mechanics, driven in the real engine (S152):
//   * a GEL that touches Link clings for GEL_CLING_FRAMES — no sword, movement
//     every other frame, each button press shakes GEL_CLING_SHAKE_FRAMES off —
//     then hops away (gel.s gel_stateC/D);
//   * a BUBBLE's touch takes his sword away for BUBBLE_SWORD_LOCK_FRAMES
//     (bubble.s, wSwordDisabledCounter);
//   * a SPIKED BEETLE cannot be hurt right way up, is FLIPPED by his raised
//     shield, can be hurt while on its back, and rights itself after
//     BEETLE_FLIP_FRAMES (spikedBeetle.s).
// And (S157) a lifted rock THROWN flies Seasons' own arc — itemWeights row 0 —
// and hurts an enemy in its path; before S157 it broke at Link's feet.
// Each is asserted on the state the engine itself keeps, not on a model.
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

// Everything below steps the game by hand, frame by frame, from a quiet room.
const r = await page.evaluate(async () => {
  const g = window.__game;
  const { spawnEntity } = await import('/src/game/entity.js');
  const { giveItem } = await import('/src/game/progress.js');
  const F = await import('/src/data/feel.js');
  const out = {};
  const step = (n) => { for (let i = 0; i < n; i++) g.update(); };
  g.newGame && g.newGame();
  g.mode = 'play';
  giveItem(g.progress, 'sword'); giveItem(g.progress, 'shield');
  g.progress.equipA = 'sword'; g.progress.equipB = 'shield';
  const fresh = (type) => {
    g.enterMap('overworld', 0, 4, 7, 72, 104, 'right', { instant: true });
    g.entities = g.entities.filter(e => !e.isEnemy);
    if (g.dialogue) g.dialogue.active = false;
    const p = g.player; p.invuln = 0; p.swordLock = 0; p.clungBy = null;
    g.progress.hearts = g.progress.maxHearts;
    const e = spawnEntity(g, type, 6, 6, {});
    step(1);
    return e;
  };
  const touch = (e) => { const p = g.player; e.x = p.x + 2; e.y = p.y; e.z = 0; p.invuln = 0; p.updateContactDamage(g); };

  // GEL
  let e = fresh('gel'); touch(e);
  const p = g.player;
  out.gelClings = e.aiState === 'cling' && p.clungBy === e;
  out.gelLocks = p.swordLocked() && p.startSwing(g, 1) === true && p.swinging === 0;
  e.aiTimer = F.GEL_CLING_FRAMES;
  const t0 = e.aiTimer;
  g.input.held.a = true; g.input.prev.a = false;
  e.spec.ai(e, g);
  g.input.held.a = false;
  out.gelShake = t0 - e.aiTimer === F.GEL_CLING_SHAKE_FRAMES + 1;
  e.aiTimer = 1; e.spec.ai(e, g);
  out.gelHopsOff = e.aiState === 'hopoff';
  p.update(g);
  out.gelReleases = !p.clungBy && !p.swordLocked();

  // BUBBLE
  e = fresh('bubble'); touch(e);
  out.bubbleLock = g.player.swordLock === F.BUBBLE_SWORD_LOCK_FRAMES;
  out.bubbleNoSwing = g.player.startSwing(g, 1) === true && g.player.swinging === 0;

  // BEETLE
  e = fresh('beetle');
  out.beetleArmoured = e.hurt(g, 2, 'right', 0, g.player) === false && e.hp === e.maxHp;
  g.player.dir = 'right'; g.player.shielding = true;
  e.x = g.player.x + 10; e.y = g.player.y; g.player.invuln = 0;
  const hearts = g.progress.hearts;
  g.player.updateContactDamage(g);
  out.beetleFlips = e.aiState === 'flipped' && e.shield === null;
  out.beetleShieldTakesNoHit = g.progress.hearts === hearts;
  out.beetleHurtFlipped = e.hurt(g, 1, 'right', 0, g.player) !== false && e.hp < e.maxHp;
  e.aiTimer = 1; e.flicker = 0; e.fz = 0; e.vzS = 0; e.spec.ai(e, g);
  out.beetleRights = e.aiState !== 'flipped' && e.shield === 'all';

  // THROWING (S157). Lift a rock off open ground at 24,80 in 0,4,7 (row 5 is
  // open floor end to end) and throw it. Seasons' own arc (itemWeights row 0)
  // from CARRY_HEIGHT, simulated here from feel.js alone, says how long it
  // flies; the engine must agree to the frame and to the pixel.
  const throwOnce = (dir, withFoe) => {
    g.enterMap('overworld', 0, 4, 7, dir === 'left' ? 120 : 24, 80, dir, { instant: true });
    g.entities = g.entities.filter(x => !x.isEnemy);
    const p = g.player; p.dir = dir;
    const dx = dir === 'right' ? 1 : -1;
    const tx = Math.floor((p.cx + dx * F.LIFT_REACH) / 16), ty = Math.floor(p.cy / 16);
    g.room.setTile(tx, ty, 'rock');
    if (!p.tryLift(g, 1)) return { lifted: false };
    step(30);
    const obj = p.carrying;
    let foe = null;
    if (withFoe) { foe = spawnEntity(g, 'octorok', 0, 0, {}); foe.x = p.x + dx * 28; foe.y = p.y; foe.frozen = true; foe.spec = { ...foe.spec, ai() {} }; }
    const hp0 = foe && foe.hp;
    const x0 = obj.x;
    p.throwCarried(g);
    let frames = 0;
    while (!obj.remove && frames < 120) { step(1); frames++; }
    return { lifted: true, frames, dist: Math.abs(obj.x - x0), hurt: foe ? foe.hp < hp0 || foe.dead : null, foeFrames: frames };
  };
  let fz = F.CARRY_HEIGHT * 256, vz = F.LIFTED_THROW_RISE, air = 0;
  while (fz > 0) { fz += vz; vz -= F.LIFTED_THROW_GRAVITY; air++; }
  out.throwAir = air;
  out.throwR = throwOnce('right', false);
  out.throwL = throwOnce('left', false);
  out.throwFoe = throwOnce('right', true);
  return out;
});
check('a gel that touches Link clings to him', r.gelClings);
check('while it clings he cannot draw his sword', r.gelLocks);
check('each button press shakes its hold down by GEL_CLING_SHAKE_FRAMES', r.gelShake);
check('when its hold runs out it hops off', r.gelHopsOff);
check('and his sword comes back', r.gelReleases);
check("a bubble's touch takes the sword for BUBBLE_SWORD_LOCK_FRAMES", r.bubbleLock);
check('and a swing does nothing meanwhile', r.bubbleNoSwing);
check('a spiked beetle right way up cannot be hurt', r.beetleArmoured);
check("Link's raised shield flips it", r.beetleFlips);
check('and the shield takes no hit doing it', r.beetleShieldTakesNoHit);
check('on its back the sword hurts it', r.beetleHurtFlipped);
check('after BEETLE_FLIP_FRAMES it rights itself, armoured again', r.beetleRights);
const air = r.throwAir;
check(`a thrown rock stays in the air Seasons' ${air} frames, not breaking at Link's feet`,
  r.throwR.lifted && r.throwR.frames === air, JSON.stringify(r.throwR));
check(`and crosses about ${Math.round(air * 1.5)} px of floor (1.5 px a frame) before it lands and breaks`,
  Math.abs(r.throwR.dist - air * 1.5) <= 2, JSON.stringify(r.throwR));
check('thrown the other way it flies the same', r.throwL.frames === air && Math.abs(r.throwL.dist - air * 1.5) <= 2, JSON.stringify(r.throwL));
check('an enemy in its path is hurt, and the rock breaks on it early',
  r.throwFoe.hurt === true && r.throwFoe.frames < air, JSON.stringify(r.throwFoe));
check('no page errors', errors.length === 0, errors[0]);
console.log(`\n=== ${pass} passed, ${fail.length} failed ===`);
await browser.close(); server.close();
process.exit(fail.length ? 1 : 0);
