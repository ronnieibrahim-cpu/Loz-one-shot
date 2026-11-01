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
    if (withFoe) { foe = spawnEntity(g, 'octorok', 0, 0, {}); foe.x = p.x + dx * 28; foe.y = p.y; foe.frozen = true; foe.spec = { ...foe.spec, ai() {} }; foe.hp = foe.maxHp = 10; }
    const hp0 = foe && foe.hp;
    const x0 = obj.x;
    p.throwCarried(g);
    let frames = 0;
    while (!obj.remove && frames < 120) { step(1); frames++; }
    return { lifted: true, frames, dist: Math.abs(obj.x - x0), hurt: foe ? foe.hp < hp0 || foe.dead : null, lost: foe ? hp0 - Math.max(0, foe.hp) : null, hp0, foeFrames: frames };
  };
  let fz = F.CARRY_HEIGHT * 256, vz = F.LIFTED_THROW_RISE, air = 0;
  while (fz > 0) { fz += vz; vz -= F.LIFTED_THROW_GRAVITY; air++; }
  out.throwAir = air;
  out.throwR = throwOnce('right', false);
  out.throwL = throwOnce('left', false);
  out.throwFoe = throwOnce('right', true);

  // A LIFTED BOMB, THROWN (S165), flies as itself and still goes off. It used
  // to be swapped for a stand-in rock that shattered, and never exploded.
  {
    g.enterMap('overworld', 0, 4, 7, 24, 80, 'right', { instant: true });
    g.entities = g.entities.filter(x => !x.isEnemy);
    const p = g.player; p.dir = 'right';
    const { Bomb } = await import('/src/game/items.js');
    const b = new Bomb(p.x, p.y); g.addEntity(b); step(1);
    p.carrying = b; b.carried = true;
    const x0 = p.x;
    p.throwCarried(g);
    let frames = 0, rocks = 0, landX = null, booms = 0;
    while (frames < F.BOMB_FUSE_FRAMES + 5) {
      step(1); frames++;
      rocks += g.entities.filter(x => x.constructor.name === 'ThrownObject').length;
      if (landX == null && !b.flight) landX = b.x;
      booms += g.entities.filter(x => x.constructor.name === 'Explosion').length ? 1 : 0;
      if (booms) break;
    }
    out.bomb = { rocks, travelled: landX == null ? null : landX - x0, frames, booms, removed: b.remove };
  }

  // THE OCTOROK'S ROCK (S227; parts/octorokProjectile.s). A wall, the shield
  // or the sword knocks it back the way it came with a hop (SPEED_40, speedZ
  // -$e0, gone after 32 frames), the shield and sword with SND_CLINK2 and a
  // wall silently; it hits Link's body and is simply gone. It never makes
  // the clink picture. The real octorok spits it: its AI is put at the last
  // frame of its wind-up, facing right, Link 64 px to its right on row 5.
  const rockAt = (opts) => {
    g.enterMap('overworld', 0, 4, 7, 24, 80, 'right', { instant: true });
    g.entities = g.entities.filter(x => !x.isEnemy && !x.isProjectile);
    if (g.dialogue) g.dialogue.active = false;
    const p = g.player;
    p.x = 24 + 64; p.y = 80; p.dir = 'left'; p.invuln = 0; p.shielding = false;
    p.swinging = 0; p.flicker = 0;
    g.progress.hearts = g.progress.maxHearts;
    if (opts.wall) { p.x = 140; g.room.setTile(5, 5, 'rock'); }
    if (opts.flashing) p.invuln = 200;
    const kind = opts.kind || 'octorok';
    const o = spawnEntity(g, kind, 0, 0, {});
    const aim = () => {
      o.x = 24; o.y = 80; o.dir = 'right';
      // Each at the frame before its own AI throws: the octorok at the end
      // of its wind-up, the wizzrobe one frame before WIZZROBE_FIRE_AT, the
      // moblin at the end of a pause on an odd throw (it throws only if the
      // direction it then rolls faces Link, so it is asked until it does).
      if (kind === 'octorok') { o.aiState = 'windup'; o.aiTimer = 1; }
      if (kind === 'wizzrobe') { o.aiState = 'stand'; o.aiTimer = F.WIZZROBE_FIRE_AT + 1; o.hidden = false; }
      if (kind === 'moblin') { o.aiState = 'pause'; o.aiTimer = 1; o.throws = 0; }
    };
    aim();
    const sounds = [], fx = [];
    const sfx0 = g.audio.sfx.bind(g.audio), fx0 = g.spawnEffect.bind(g);
    g.audio.sfx = (n, ...a) => { sounds.push(n); return sfx0(n, ...a); };
    g.spawnEffect = (n, ...a) => { fx.push(n); return fx0(n, ...a); };
    o.spec.ai(o, g);
    for (let i = 0; i < 64 && !g.pendingAdd.some(x => x.isProjectile); i++) { aim(); o.spec.ai(o, g); }
    o.update = () => {};
    g.flushPending();
    const rock = g.entities.find(x => x.isProjectile && x.owner === o);
    const r = { fired: !!rock, sounds, fx };
    if (!rock) { g.audio.sfx = sfx0; g.spawnEffect = fx0; return r; }
    const h0 = g.progress.hearts;
    let frames = 0, maxZ = rock.z, z0 = rock.z, turned = null, vx = null, swung = false, passed = false;
    while (!rock.remove && frames < 200) {
      if (opts.shield) { g.input._raw.b = true; p.dir = 'left'; }
      if (opts.sword && !swung && p.x - rock.x < 22) { p.dir = 'left'; p.startSwing(g, 1); swung = true; }
      step(1); frames++;
      if (rock.deflected > 0 && turned == null) { turned = frames; vx = rock.vx; }
      if (turned != null) maxZ = Math.max(maxZ, rock.z);
      if (!rock.remove && rock.x > p.x + 16) passed = true;
    }
    g.audio.sfx = sfx0; g.spawnEffect = fx0; g.input._raw.b = false;
    if (opts.wall) { g.room.override[5 * g.room.tw + 5] = null; g.room.invalidate(); }
    Object.assign(r, { frames, passed, turned, vx, rise: maxZ - z0, after: turned == null ? null : frames - turned,
      lost: h0 - g.progress.hearts, clink: fx.includes('spark'), deflectSound: sounds.includes('deflect') });
    return r;
  };
  out.rockWall = rockAt({ wall: true });
  out.rockShield = rockAt({ shield: true });
  out.rockSword = rockAt({ sword: true });
  out.rockBody = rockAt({});
  out.rockFlashing = rockAt({ flashing: true });
  out.rockFlashingShield = rockAt({ flashing: true, shield: true });
  for (const kind of ['moblin', 'wizzrobe']) {
    out[kind] = { wall: rockAt({ kind, wall: true }), shield: rockAt({ kind, shield: true }),
      sword: rockAt({ kind, sword: true }), body: rockAt({ kind }) };
  }
  out.deflectFrames = F.SHOT_DEFLECT_FRAMES;

  // THE SHIELD BUMP (S227; ENEMYCOLLISION_STANDARD_ENEMY against the L1
  // shield = COLLISIONEFFECT_SHIELD_BUMP_HIGH_KNOCKBACK). An octorok held
  // still 10 px to Link's left; Link facing it with the shield up, or not.
  const bump = (o) => {
    g.enterMap('overworld', 0, 4, 7, 24, 80, 'right', { instant: true });
    g.entities = g.entities.filter(x => !x.isEnemy && !x.isProjectile);
    if (g.dialogue) g.dialogue.active = false;
    const p = g.player;
    p.x = 88; p.y = 80; p.dir = o.face; p.invuln = 0; p.flicker = 0; p.hurtTime = 0;
    g.progress.hearts = g.progress.maxHearts;
    const e = spawnEntity(g, o.kind || 'octorok', 0, 0, {});
    e.x = 78; e.y = 80; e.spec = { ...e.spec, ai() {} };
    e.hidden = false; e.harmless = false; e.invuln = 0;
    g.flushPending();
    const sounds = []; const sfx0 = g.audio.sfx.bind(g.audio);
    g.audio.sfx = (n, ...a) => { sounds.push(n); return sfx0(n, ...a); };
    g.input._raw.b = !!o.shield;
    const h0 = g.progress.hearts, px = p.x, ex = e.x;
    let flashed = false, hurtPose = false;
    for (let i = 0; i < 40; i++) {
      p.dir = o.face; step(1);
      flashed = flashed || p.flicker > 0 || e.flicker > 0;
      hurtPose = hurtPose || String(p.spriteName ? p.spriteName(g) : '').startsWith('link_hurt');
    }
    g.input._raw.b = false; g.audio.sfx = sfx0;
    return { lost: h0 - g.progress.hearts, linkMoved: p.x - px, foeMoved: e.x - ex, flashed, hurtPose,
      thud: sounds.includes('shieldBump') };
  };
  out.bumpShield = bump({ shield: true, face: 'left' });
  out.bumpBack = bump({ shield: true, face: 'right' });
  out.bumpBare = bump({ shield: false, face: 'left' });
  out.bumpPincer = bump({ shield: true, face: 'left', kind: 'pincer' });
  out.pincerExpect = F.SHIELD_SHOVE_LINK[0][0] * F.PLAYER_KNOCK_SPEED / 256;
  // S228: the zol, the gel and the pincer take a blow without moving
  // (ENEMYCOLLISION_ZOL/GEL/PINCER: COLLISIONEFFECT_SWORD_NO_KNOCKBACK ->
  // ENEMYDMG_0c, invincibilityCounter $20, no knockback); the octorok is
  // shoved. Each held still 14 px to Link's left with a lot of health; one
  // swing.
  const struck = (kind) => {
    g.enterMap('overworld', 0, 4, 7, 24, 80, 'right', { instant: true });
    g.entities = g.entities.filter(x => !x.isEnemy && !x.isProjectile);
    if (g.dialogue) g.dialogue.active = false;
    const p = g.player;
    p.x = 88; p.y = 80; p.dir = 'left'; p.invuln = 200; p.flicker = 0; p.hurtTime = 0;
    const e = spawnEntity(g, kind, 0, 0, {});
    e.x = 74; e.y = 80; e.hp = 99; e.spec = { ...e.spec, ai() {}, onHurt: null, onTouchLink: null };
    g.flushPending();
    const ex = e.x, ey = e.y;
    p.startSwing(g, 1);
    let hitAt = null, inv = 0, moved = 0;
    for (let i = 0; i < 60; i++) {
      step(1);
      if (hitAt == null && e.hp < 99) { hitAt = i; inv = e.invuln; }
      moved = Math.max(moved, Math.abs(e.x - ex) + Math.abs(e.y - ey));
    }
    p.invuln = 0;
    return { hit: hitAt != null, inv, moved };   // inv: after that frame's own tick
  };
  out.unshovedInv = F.ENEMY_UNSHOVED_INVULN_FRAMES;
  out.struck = { zol: struck('zol'), gel: struck('gel'), octorok: struck('octorok') };
  out.bumpExpect = { link: F.SHIELD_BUMP[0][0] * F.PLAYER_KNOCK_SPEED / 256, foe: F.SHIELD_BUMP[0][2] * F.ENEMY_KNOCK_SPEED / 256 };
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
check("and it hits for Seasons' 3, harder than the starting sword's 2",
  r.throwFoe.lost === Math.min(3, r.throwFoe.hp0), JSON.stringify(r.throwFoe));
check('a lifted bomb thrown flies as itself, not as a stand-in rock',
  r.bomb.rocks === 0 && r.bomb.travelled > 32, JSON.stringify(r.bomb));
check('and it still goes off when its fuse ends', r.bomb.booms > 0 && r.bomb.removed, JSON.stringify(r.bomb));
const D = r.deflectFrames, J = (o) => JSON.stringify(o);
check("an octorok's rock that hits a wall is knocked back the way it came, slowly",
  r.rockWall.turned != null && r.rockWall.vx === -64, J(r.rockWall));
check('it hops up as it turns and is gone 32 frames later', r.rockWall.rise >= 5 && r.rockWall.after === D, J(r.rockWall));
check('off a wall it makes no sound and no clink picture', !r.rockWall.deflectSound && !r.rockWall.clink, J(r.rockWall));
check("Link's raised shield knocks it back with Seasons' clink, and he loses nothing",
  r.rockShield.turned != null && r.rockShield.vx === -64 && r.rockShield.after === D && r.rockShield.deflectSound && r.rockShield.lost === 0 && !r.rockShield.clink, J(r.rockShield));
check('so does his sword swung into it', r.rockSword.turned != null && r.rockSword.deflectSound && r.rockSword.lost === 0, J(r.rockSword));
check('it hits his body for its damage and is simply gone, no clink picture',
  r.rockBody.turned == null && r.rockBody.lost === 2 && !r.rockBody.clink && r.rockBody.frames < 60, J(r.rockBody));
// S228: checkLinkVulnerable — Link flashing after a hit collides with
// nothing, shield included, so the shot flies on through him.
check('while Link is flashing after a hit, the rock flies straight through him',
  r.rockFlashing.passed && r.rockFlashing.turned == null && r.rockFlashing.lost === 0 && !r.rockFlashing.clink, J(r.rockFlashing));
check('and his raised shield does not knock it back then either',
  r.rockFlashingShield.passed && r.rockFlashingShield.turned == null && !r.rockFlashingShield.deflectSound && r.rockFlashingShield.lost === 0, J(r.rockFlashingShield));
const SK = r.struck;
check('a zol struck by the sword is not knocked back, and is safe for 32 frames',
  SK.zol.hit && SK.zol.moved === 0 && SK.zol.inv + 1 === r.unshovedInv, J(SK.zol));
check('nor is a gel', SK.gel.hit && SK.gel.moved === 0 && SK.gel.inv + 1 === r.unshovedInv, J(SK.gel));
check('while an octorok struck the same way is shoved back',
  SK.octorok.hit && SK.octorok.moved >= 14 && SK.octorok.inv < r.unshovedInv, J(SK.octorok));
// S228: ENEMYCOLLISION_PINCER against the first shield is COLLISIONEFFECT_07:
// Link alone is shoved (LINKDMG_18, $19 frames), the pincer is untouched.
check("a pincer walking into Link's raised shield shoves only him, harder, and hurts nobody",
  r.bumpPincer.lost === 0 && r.bumpPincer.foeMoved === 0 && Math.abs(r.bumpPincer.linkMoved - r.pincerExpect) <= 1.5 && r.bumpPincer.thud,
  J({ ...r.bumpPincer, expect: r.pincerExpect }));
const M = r.moblin, W = r.wizzrobe;
check("a moblin's spear is knocked back off a wall like the rock, silently",
  M.wall.turned != null && M.wall.after === D && !M.wall.deflectSound && !M.wall.clink, J(M.wall));
check('and off the shield and the sword, with the clink, costing Link nothing',
  [M.shield, M.sword].every(x => x.turned != null && x.deflectSound && x.lost === 0 && !x.clink), J([M.shield, M.sword]));
check('it hits his body and is simply gone', M.body.turned == null && M.body.lost > 0 && !M.body.clink, J(M.body));
check("a wizzrobe's shot is gone on a wall without a sound or the clink picture",
  W.wall.frames < 60 && W.wall.after === 0 && !W.wall.deflectSound && !W.wall.clink, J(W.wall));
check('and gone off the shield and the sword with the clink, costing Link nothing',
  [W.shield, W.sword].every(x => x.after === 0 && x.deflectSound && x.lost === 0 && !x.clink), J([W.shield, W.sword]));
check('it hits his body and is simply gone', W.body.turned == null && W.body.lost > 0 && !W.body.clink, J(W.body));
const B = r.bumpShield, BE = r.bumpExpect;
check("an octorok walking into Link's raised shield costs him nothing", B.lost === 0, J(B));
check(`and shoves him back about ${BE.link} px and it about ${BE.foe} px, with Seasons' thud`,
  Math.abs(B.linkMoved - BE.link) <= 1 && Math.abs(B.foeMoved + BE.foe) <= 1 && B.thud, J(B));
check('neither flashes, and he is not drawn hurt', !B.flashed && !B.hurtPose, J(B));
check('with the shield up facing away, it hurts him', r.bumpBack.lost > 0 && !r.bumpBack.thud, J(r.bumpBack));
check('with no shield up, it hurts him', r.bumpBare.lost > 0 && !r.bumpBare.thud, J(r.bumpBare));
check('no page errors', errors.length === 0, errors[0]);
console.log(`\n=== ${pass} passed, ${fail.length} failed ===`);
await browser.close(); server.close();
process.exit(fail.length ? 1 : 0);
