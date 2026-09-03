// Respawn harness. Boots headless and proves that dying puts the player back
// where the source games would put him, with everything the run has earned
// still in his pocket.
//
// WHY THIS EXISTS. `progress.respawn` was written ONCE, by `newProgress`, and
// nothing in the game ever wrote it again. Every death anywhere in the world —
// the Abyssal Keep's boss room, a cave on the far rim, the seafloor of D6 —
// put the player back on the tile outside the Maku Tree in Tidewatch Village.
// Nothing was LOST: keys, doors, chests, Essences and items all live in
// `progress` and in the Rooms, and none of them are rebuilt by a death. What
// was taken was the walk, every time, from the first screen of the game. That
// is the worst kind of punishment a game can hand out, because the walk is the
// part the player has already done.
//
// No checker in the table could see it. Every one of them models a PART: the
// floods do not die, the switch solver does not die, and check-playthrough has
// an assertion that the run never died at all. A death is a code path that
// nothing in this repository had ever taken.
//
// What this asserts, in the real engine with a live player:
//
//   1. a new game's point is the village, and the village is standable;
//   2. crossing an overworld seam MOVES it, to the screen just entered, at a
//      pixel position inside that room — `entryPos` hands a player walking
//      east an x of -3, which is right for the slide and wrong as a place to
//      be put back;
//   3. dying outdoors puts you back on the screen you died on, NOT in the
//      village — the assertion that would have gone red before this landed;
//   4. walking into a dungeon takes the point, and walking DEEPER does not
//      move it: die on the far side of D1 and you start at D1's mouth. This
//      is the difference between a setback and a death loop in a boss room;
//   5. the same for another floor of the same dungeon;
//   6. the same for a cave and for a house — "that instance", not the world;
//   7. EVERYTHING THE RUN HAS EARNED SURVIVES: an item, a Small Key, an
//      opened door, an opened chest, an Essence, the rupees and the heart
//      containers. Hearts come back full and nothing else moves;
//   8. the sea comes back as it stood, not forced to MID — the floor of a
//      seafloor room is only above water at LOW, and forcing MID would drown
//      the player at the point he was put back on;
//   9. the point is somewhere the player can actually STAND, asked of
//      `canOccupy` — the engine's own question, not a model of it;
//  10. and the run is written to its save slot, because a player who dies and
//      closes the tab on the game-over screen should not lose the hour;
//  11. dying to a REAL BOSS, in a fight that is actually running, lets go of
//      the boss handle (the HUD used to draw a bar for a ghost), does not mark
//      the dungeon beaten, puts the player at the dungeon's MOUTH rather than
//      back in the arena, and leaves the boss standing there to be fought
//      again at full health — a death is not a way to delete a boss;
//  12. and a death takes whatever was ON TOP of the game with it. `respawn`
//      sets `mode = 'play'` unconditionally, which is a claim about what the
//      game is doing: a cutscene, a text box and its queue, a room slide, a
//      pending fade callback and the item and room banners all used to survive
//      it and land on the room the player was put back in.
//
// Boot pattern copied from tools/check-gates.mjs.
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
  try { mod = await import('playwright'); }
  catch (e) {
    const { execSync } = await import('node:child_process');
    const root = execSync('npm root -g', { encoding: 'utf8' }).trim();
    mod = await import(join(root, 'playwright', 'index.js'));
  }
  return mod.chromium ? mod : mod.default;
}

let passed = 0; const failures = [];
function check(name, cond, detail) {
  if (cond) { passed++; console.log('  ok   ' + name); }
  else { failures.push(name + (detail ? ' — ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
}

const { chromium } = await loadPlaywright();
const PORT = 20000 + Math.floor(Math.random() * 20000);
const server = await serve(PORT);
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

// PIN THE SEED, and own the clock: `newProgress` falls back to Date.now(), and
// a harness that lets main.js drive the loop is a race (docs/HANDOFF.md).
await page.goto(`http://localhost:${PORT}/index.html?seed=20260806`, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.__game && !!window.__harness, { timeout: 15000 });
await page.evaluate(() => window.__harness.takeOver());

const frames = (n) => page.evaluate((k) => window.__harness.step(k), n);
const tap = async (code) => {
  await page.keyboard.down(code); await frames(2);
  await page.keyboard.up(code); await frames(1);
};

// New game, skip the intro.
await tap('Enter'); await frames(6);
await tap('Enter'); await frames(20);
for (let i = 0; i < 140 && await page.evaluate(() => window.__game.mode === 'cutscene'); i++) {
  await tap('Enter'); await frames(4);
}
await page.evaluate(() => { window.__game.mode = 'play'; });
await frames(4);

/** The recorded point, plus whether the engine says the player could stand on it. */
const point = () => page.evaluate(async () => {
  const g = window.__game;
  const { getRoom } = await import('/src/world/maps.js');
  return { ...g.progress.respawn };
});

/** Kill the player for real, wait out the game-over, and take the continue. */
const die = async () => {
  await page.evaluate(() => {
    const g = window.__game;
    g.progress.hearts = 1;
    g.player.invuln = 0;
    g.player.takeDamage(g, 99, null, {});
  });
  await frames(20);
  const over = await page.evaluate(() => window.__game.mode === 'gameover');
  await page.evaluate(() => window.__game.respawn());
  await frames(10);
  return over;
};

/** Where the player actually IS, and whether the engine will let him be there. */
const where = () => page.evaluate(async () => {
  const g = window.__game;
  const { canOccupy } = await import('/src/game/entity.js');
  return {
    map: g.mapId, floor: g.room.floor, rx: g.room.rx, ry: g.room.ry,
    x: Math.round(g.player.x), y: Math.round(g.player.y),
    mode: g.mode, tide: g.tide.level,
    hearts: g.progress.hearts, maxHearts: g.progress.maxHearts,
    standable: canOccupy(g, g.player, g.player.x, g.player.y, g.player.caps),
    pw: g.room.pw, ph: g.room.ph,
  };
});

const VILLAGE = (p) => p.map === 'overworld' && p.rx === 4 && p.ry === 7;

// --------------------------------------------------------------------------
console.log('\n--- 1. a new game starts pointed at the village ---');
{
  const p = await point();
  check('a new game respawns in Tidewatch Village', VILLAGE(p), JSON.stringify(p));
  check('and the point carries the sea it was taken at', typeof p.tide === 'number', JSON.stringify(p));
}

// --------------------------------------------------------------------------
console.log('\n--- 2. crossing a seam moves the point ---');
{
  await page.evaluate(() => {
    const g = window.__game;
    g.tide.setLevel(1, { instant: true });
    g.enterMap('overworld', 0, 4, 7, 72, 72, 'down', { instant: true });
  });
  await frames(6);
  // Walk east across the real seam, the slow way, so the point is taken by
  // `updateTransition` rather than by a warp.
  await page.keyboard.down('ArrowRight');
  await frames(150);
  await page.keyboard.up('ArrowRight');
  await frames(20);
  const room = await page.evaluate(() => `${window.__game.room.rx},${window.__game.room.ry}`);
  check('walking east actually crossed the seam', room === '5,7', room);
  const p = await point();
  check('the point moved to the screen just entered',
    p.map === 'overworld' && p.rx === 5 && p.ry === 7, JSON.stringify(p));
  check('and it is INSIDE that room, not three pixels outside it',
    p.px >= 0 && p.py >= 0 && p.px <= 160 - 16 && p.py <= 128 - 16, JSON.stringify(p));
}

// --------------------------------------------------------------------------
console.log('\n--- 3. dying outdoors leaves you outdoors, where you were ---');
{
  await page.evaluate(() => {
    window.__game.enterMap('overworld', 0, 8, 8, 72, 72, 'down', { instant: true });
  });
  await frames(6);
  const over = await die();
  const w = await where();
  check('taking lethal damage enters the game over', over);
  check('the continue returns to play', w.mode === 'play', w.mode);
  check('and lands on the screen the player died on, NOT in the village',
    w.map === 'overworld' && w.rx === 8 && w.ry === 8, JSON.stringify(w));
  check('on a tile the engine says he can stand on', w.standable, JSON.stringify(w));
  check('with hearts back to full', w.hearts === w.maxHearts, `${w.hearts}/${w.maxHearts}`);
}

// --------------------------------------------------------------------------
console.log('\n--- 4. a dungeon sends you back to its own door ---');
{
  // In through D1's mouth, exactly as the overworld warp does it.
  await page.evaluate(() => {
    window.__game.enterMap('d1', 0, 3, 7, 72, 96, 'up', { instant: true });
  });
  await frames(6);
  const atDoor = await point();
  check('walking into D1 takes the point', atDoor.map === 'd1', JSON.stringify(atDoor));
  check('and the point is D1\'s entrance room',
    atDoor.rx === 3 && atDoor.ry === 7 && atDoor.floor === 0, JSON.stringify(atDoor));

  // Deeper in, by a door rather than by the mouth.
  await page.evaluate(() => {
    window.__game.enterMap('d1', 0, 3, 4, 72, 72, 'up', { instant: true });
  });
  await frames(6);
  const deeper = await point();
  check('walking DEEPER into the same dungeon does not move it',
    deeper.map === 'd1' && deeper.rx === 3 && deeper.ry === 7, JSON.stringify(deeper));

  const over = await die();
  const w = await where();
  check('dying deep in D1 enters the game over', over);
  check('and puts the player back inside D1, not in the village',
    w.map === 'd1', JSON.stringify(w));
  check('at its mouth rather than in the room that killed him',
    w.rx === 3 && w.ry === 7 && w.floor === 0, JSON.stringify(w));
  check('on a tile the engine says he can stand on', w.standable, JSON.stringify(w));
}

// --------------------------------------------------------------------------
console.log('\n--- 5. another floor of the same dungeon is still that dungeon ---');
{
  await page.evaluate(() => {
    const g = window.__game;
    g.enterMap('d2', 0, 3, 7, 72, 96, 'up', { instant: true });
  });
  await frames(6);
  await page.evaluate(() => {
    window.__game.enterMap('d2', 1, 3, 1, 72, 72, 'up', { instant: true });
  });
  await frames(6);
  const p = await point();
  check('climbing to D2 floor 1 does not move the point',
    p.map === 'd2' && p.floor === 0 && p.rx === 3 && p.ry === 7, JSON.stringify(p));
  await die();
  const w = await where();
  check('dying on floor 1 puts the player at D2\'s ground-floor mouth',
    w.map === 'd2' && w.floor === 0 && w.rx === 3 && w.ry === 7, JSON.stringify(w));
}

// --------------------------------------------------------------------------
console.log('\n--- 6. a cave and a house are instances too ---');
for (const [id, label] of [['cave1', 'the Bluff Grotto'], ['houseHearth', 'a village house']]) {
  await page.evaluate((m) => {
    window.__game.enterMap(m, 0, 0, 0, 72, 96, 'up', { instant: true });
  }, id);
  await frames(6);
  const p = await point();
  check(`walking into ${label} takes the point`, p.map === id, JSON.stringify(p));
  await die();
  const w = await where();
  check(`dying in ${label} leaves you in ${label}`, w.map === id, JSON.stringify(w));
  check(`and standing somewhere real in ${label}`, w.standable, JSON.stringify(w));
}

// --------------------------------------------------------------------------
console.log('\n--- 7. the run survives the death ---');
{
  const before = await page.evaluate(async () => {
    const g = window.__game;
    const prog = await import('/src/game/progress.js');
    g.enterMap('d1', 0, 3, 7, 72, 96, 'up', { instant: true });
    prog.giveItem(g.progress, 'anchor', 1);
    g.progress.keys.d1 = 2;
    g.progress.bossKeys.d1 = true;
    g.progress.dungeonMaps.d1 = true;
    g.progress.doors['d1/0,3,5'] = true;
    g.progress.chests['d1/0,2,6:1'] = true;
    g.progress.flags.gotCoin = true;
    if (!g.progress.essences.includes(1)) g.progress.essences.push(1);
    g.progress.rupees = 214;
    g.progress.maxHearts = 20;
    g.progress.hearts = 20;
    return JSON.parse(JSON.stringify({
      items: g.progress.items, keys: g.progress.keys, bossKeys: g.progress.bossKeys,
      dungeonMaps: g.progress.dungeonMaps, doors: g.progress.doors,
      chests: g.progress.chests, flags: g.progress.flags,
      essences: g.progress.essences, rupees: g.progress.rupees,
      maxHearts: g.progress.maxHearts,
    }));
  });
  await frames(6);
  // Die somewhere else in the dungeon entirely.
  await page.evaluate(() => window.__game.enterMap('d1', 0, 3, 4, 72, 72, 'up', { instant: true }));
  await frames(6);
  await die();
  const after = await page.evaluate(() => JSON.parse(JSON.stringify({
    items: window.__game.progress.items, keys: window.__game.progress.keys,
    bossKeys: window.__game.progress.bossKeys, dungeonMaps: window.__game.progress.dungeonMaps,
    doors: window.__game.progress.doors, chests: window.__game.progress.chests,
    flags: window.__game.progress.flags, essences: window.__game.progress.essences,
    rupees: window.__game.progress.rupees, maxHearts: window.__game.progress.maxHearts,
  })));
  for (const k of Object.keys(before)) {
    check(`${k} survives the death`, JSON.stringify(after[k]) === JSON.stringify(before[k]),
      `${JSON.stringify(before[k])} -> ${JSON.stringify(after[k])}`);
  }
  const w = await where();
  check('and the hearts come back full, which is the only thing that moves',
    w.hearts === w.maxHearts && w.maxHearts === 20, `${w.hearts}/${w.maxHearts}`);
}

// --------------------------------------------------------------------------
console.log('\n--- 8. the sea comes back as it stood ---');
{
  await page.evaluate(() => {
    const g = window.__game;
    g.enterMap('overworld', 0, 4, 7, 72, 72, 'down', { instant: true });
    g.tide.setLevel(0, { instant: true });
    // Re-take the point at LOW by walking into a room at LOW.
    g.enterMap('overworld', 0, 10, 8, 72, 72, 'down', { instant: true });
  });
  await frames(6);
  const p = await point();
  check('the point records the level it was taken at', p.tide === 0, JSON.stringify(p));
  // Push the sea somewhere else, then die.
  await page.evaluate(() => window.__game.tide.setLevel(2, { instant: true }));
  await frames(6);
  await die();
  const w = await where();
  check('the respawn restores that level rather than forcing MID', w.tide === 0, JSON.stringify(w));
  check('and the player is standing on ground at it', w.standable, JSON.stringify(w));
}

// --------------------------------------------------------------------------
console.log('\n--- 9. the death is written to the save slot ---');
{
  const ok = await page.evaluate(async () => {
    const g = window.__game;
    const prog = await import('/src/game/progress.js');
    g.progress.rupees = 77;
    g.enterMap('d1', 0, 3, 7, 72, 96, 'up', { instant: true });
    g.progress.hearts = 1; g.player.invuln = 0;
    g.player.takeDamage(g, 99, null, {});
    return true;
  });
  await frames(20);
  await page.evaluate(() => window.__game.respawn());
  await frames(10);
  const saved = await page.evaluate(async () => {
    const prog = await import('/src/game/progress.js');
    const p = prog.loadSlot(window.__game.slot);
    return p && { rupees: p.rupees, pos: p.pos, respawn: p.respawn };
  });
  check('the slot holds what the run had earned', saved && saved.rupees === 77, JSON.stringify(saved));
  check('and reloading it would resume where the death put him',
    saved && saved.pos && saved.pos.map === 'd1' && saved.pos.rx === 3 && saved.pos.ry === 7,
    JSON.stringify(saved && saved.pos));
}

// --------------------------------------------------------------------------
// A REAL BOSS, IN A REAL FIGHT. Everything above this dies to a call to
// `takeDamage`, which is a death but not a death in the one room where dying
// is most likely and most expensive. `respawn` clears `this.boss` — the handle
// used to dangle and the HUD drew a health bar for something no longer in the
// world — and nothing had ever tested it with a boss alive.
console.log('\n--- 10. dying to Gohmaraq, with the fight actually running ---');
{
  await page.evaluate(() => {
    const g = window.__game;
    g.progress.maxHearts = 12; g.progress.hearts = 12;
    g.tide.setLevel(0, { instant: true });
    // Through the mouth, so the point is the mouth and not the arena — which
    // is the whole difference between a setback and a death loop.
    g.enterMap('d1', 0, 3, 7, 72, 96, 'up', { instant: true });
  });
  await frames(6);
  await page.evaluate(() => window.__game.enterMap('d1', 0, 3, 1, 72, 80, 'up', { instant: true }));
  // Let the intro run out and the fight start for real: no god mode, no
  // scripted state, just the boss's own AI moving and shooting.
  await frames(240);
  const live = await page.evaluate(() => {
    const g = window.__game;
    return { boss: !!g.boss, hp: g.boss && g.boss.hp, intro: g.boss && g.boss.introTime };
  });
  check('the boss is in the room and out of its intro', live.boss && live.hp > 0, JSON.stringify(live));
  const over = await die();
  check('dying with a boss alive reaches the game-over screen', over);
  const w = await where();
  check('and the continue puts the player at the DUNGEON MOUTH, not in the arena',
    w.map === 'd1' && w.rx === 3 && w.ry === 7, JSON.stringify(w));
  const after = await page.evaluate(() => {
    const g = window.__game;
    return {
      boss: !!g.boss,
      bossEntities: g.entities.filter(e => e.isBoss).length,
      beaten: !!(g.progress.beaten && g.progress.beaten.d1),
      mode: g.mode,
    };
  });
  check('the boss handle is let go, so the HUD is not drawing a bar for a ghost',
    after.boss === false, JSON.stringify(after));
  check('and no boss entity came back with the player', after.bossEntities === 0, JSON.stringify(after));
  check('dying to a boss does not mark the dungeon beaten', after.beaten === false, JSON.stringify(after));
  // A DEATH IS NOT A WAY TO DELETE A BOSS. Walking back in has to find it
  // there, at full health, with the fight to have again.
  await page.evaluate(() => window.__game.enterMap('d1', 0, 3, 1, 72, 80, 'up', { instant: true }));
  await frames(180);
  const again = await page.evaluate(() => {
    const g = window.__game;
    return { boss: !!g.boss, hp: g.boss && g.boss.hp, max: g.boss && g.boss.maxHp };
  });
  check('walking back in finds the boss there again, at full health',
    again.boss && again.hp === again.max, JSON.stringify(again));
}

// --------------------------------------------------------------------------
// `respawn` sets `mode = 'play'` unconditionally, and that is a CLAIM about
// what the game is doing. Anything that owns the mode has to be torn down with
// it, or the respawn room opens with the interrupted thing still on top of it.
console.log('\n--- 11. a death takes whatever was on top of the game with it ---');
const reviveFrom = async (setup) => {
  await page.evaluate(() => {
    const g = window.__game;
    g.progress.maxHearts = 12; g.progress.hearts = 12;
    g.tide.setLevel(1, { instant: true });
    g.enterMap('overworld', 0, 4, 7, 72, 72, 'down', { instant: true });
  });
  await frames(6);
  await page.evaluate(setup);
  await frames(4);
  await die();
  return page.evaluate(() => {
    const g = window.__game;
    return {
      mode: g.mode, cutscene: !!g.cutscene, dialogue: g.dialogue.active,
      queued: g.dialogue.queue.length, transition: !!g.transition,
      fadeThen: !!g.fadeThen, itemShow: !!g.itemShow, banner: g.bannerTime,
      fired: !!window.__respawnFadeFired,
    };
  });
};
{
  // MID-DIALOGUE. `update` returns before the player moves while a box is
  // open, so a box left standing is a respawn room the player cannot walk in.
  const d = await reviveFrom(() => {
    const g = window.__game;
    g.say('A line that was never read.');
    g.say('And one queued behind it.');
  });
  check('a death closes the text box that was open', d.dialogue === false, JSON.stringify(d));
  check('and drops what was queued behind it rather than showing it later',
    d.queued === 0, JSON.stringify(d));
  check('and the game is in play mode with nothing on top', d.mode === 'play', JSON.stringify(d));

  // MID-CUTSCENE. A scene that is still parked resumes the moment anything
  // sets the mode back to 'cutscene'.
  const c = await reviveFrom(() => { window.__game.startCutscene('intro'); });
  check('a death throws away the cutscene it interrupted', c.cutscene === false, JSON.stringify(c));
  check('and does not leave the game in cutscene mode', c.mode === 'play', JSON.stringify(c));

  // MID-TRANSITION. A slide left running is a slide back toward the room that
  // killed him.
  const t = await reviveFrom(() => {
    const g = window.__game;
    g.enterMap('overworld', 0, 5, 7, 8, 72, 'right');
  });
  check('a death cancels the room slide it interrupted', t.transition === false, JSON.stringify(t));

  // MID-FADE. `fadeOut`'s callback is a room change that has not happened yet,
  // holding the destination the death interrupted. `respawn` calls `fadeIn`,
  // which sets the direction the other way and leaves the callback parked for
  // whoever fades out NEXT — so it does not fire on the respawn, it fires on
  // the next door the player walks through, in place of that door.
  //
  // Timed by hand rather than through `die()`: FADE_RATE is 0.09, so a fade
  // takes about twelve frames and `die()`'s twenty-frame wait for the
  // game-over screen is long enough for the callback to run on its own before
  // the continue — which is a different question (`updateFade` runs above the
  // mode switch, so a fade started before a death does finish under the
  // game-over screen) and not the one this asserts.
  await page.evaluate(() => {
    const g = window.__game;
    window.__respawnFadeFired = false;
    g.progress.maxHearts = 12; g.progress.hearts = 1;
    g.tide.setLevel(1, { instant: true });
    g.enterMap('overworld', 0, 4, 7, 72, 72, 'down', { instant: true });
  });
  await frames(6);
  await page.evaluate(() => {
    const g = window.__game;
    g.fadeOut(() => { window.__respawnFadeFired = true; });
    g.player.invuln = 0;
    g.player.takeDamage(g, 99, null, {});
  });
  await frames(2);
  const wasOver = await page.evaluate(() => window.__game.mode === 'gameover');
  const heldBefore = await page.evaluate(() => !!window.__game.fadeThen);
  await page.evaluate(() => window.__game.respawn());
  await frames(4);
  const f = await page.evaluate(() => ({ fadeThen: !!window.__game.fadeThen }));
  check('the death happened before the fade could finish', wasOver && heldBefore,
    `gameover ${wasOver}, callback held ${heldBefore}`);
  check('a death drops the pending fade callback', f.fadeThen === false, JSON.stringify(f));
  await frames(120);
  const fired = await page.evaluate(() => !!window.__respawnFadeFired);
  check('and it never fires afterwards', fired === false, String(fired));

  // AN ITEM BANNER is a thing drawn over a place that is not there any more.
  const i = await reviveFrom(() => {
    const g = window.__game;
    g.itemShow = { id: 'conch', t: 600 };
    g.bannerText = 'Somewhere Else'; g.bannerTime = 600;
  });
  check('a death clears the item banner', i.itemShow === false, JSON.stringify(i));
  check('and the room banner', i.banner === 0, JSON.stringify(i));
}

check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));

console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
if (failures.length) for (const f of failures) console.log('  - ' + f);
await browser.close();
server.close();
process.exit(failures.length ? 1 : 0);
