// Play the playthrough ROUTE from a new game up to directive N, print the
// trace from directive S on, and write the game state where it stopped. NOT a
// checker — it asserts nothing, and it does not replay or verify a tape.
//
// `check-playthrough.mjs` is the proof and it re-records and replays the
// whole run. When one dungeon's section of the route is being re-routed, the
// question "does the run get through THIS room now" wants an answer in
// seconds: the route plays about ninety thousand frames in three seconds
// headless, so the run up to any room is cheap, and the RNG history is the
// real one — which `try-room.mjs`'s stated setup cannot give.
//
//   node tools/route-prefix.mjs 604 760          trace 604.., stop before 760
//   node tools/route-prefix.mjs 604              trace 604.., run to the end
//   HITS=d4 node tools/route-prefix.mjs 600      also list every hit in d4
//
// S140 re-routed the whole of D4 with it.
import { createServer } from 'node:http';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const ROOT = process.env.ROOT || resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { installRuntime } = await import(ROOT + '/tools/actor-runtime.mjs');
const { ROUTE, SEED } = await import(ROOT + '/tools/playthrough-route.mjs?' + Date.now());
// PATCH='<index>=<json directive>[;...]' swaps directives for this run only,
// so an entry wait or a standoff can be swept without editing the route.
if (process.env.PATCH) for (const part of process.env.PATCH.split(';')) {
  const k = part.indexOf('=');
  ROUTE[Number(part.slice(0, k))] = JSON.parse(part.slice(k + 1));
}
// INSERT='<index>=<json directive>' puts one directive in before <index>
// (indices after it shift by one), so a wait can be swept where there was none.
// Several at once: 'i=json;j=json', each <index> counted in the route as
// written (they are applied from the last back).
if (process.env.INSERT) {
  const parts = process.env.INSERT.split(';').map(part => {
    const k = part.indexOf('=');
    return [Number(part.slice(0, k)), JSON.parse(part.slice(k + 1))];
  }).sort((a, b) => b[0] - a[0]);
  for (const [i, d] of parts) ROUTE.splice(i, 0, d);
}
const start = Number(process.argv[2]), end = Number(process.argv[3] || ROUTE.length);
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const full = join(ROOT, normalize(p)); const s = await stat(full).catch(() => null);
  if (!s || !s.isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': extname(full) === '.html' ? 'text/html' : 'text/javascript' }); res.end(await readFile(full));
});
const PORT = 30000 + Math.floor(Math.random() * 20000);
await new Promise(r => server.listen(PORT, r));
const browser = await chromium.launch().catch(() =>
  chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' }));
const page = await browser.newPage();
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.goto(`http://localhost:${PORT}/index.html?seed=${SEED}`);
await page.waitForFunction(() => !!window.__game && !!window.__harness);
await page.evaluate(installRuntime);
await page.evaluate(async () => {
  const mod = await import('/src/game/player.js');
  const orig = mod.Player.prototype.takeDamage;
  window.__hits = [];
  mod.Player.prototype.takeDamage = function (game, amount, source, o) {
    const before = game.progress.hearts;
    if (window.__god) return false;   // GOD=1: a survey, not a run
    const r = orig.call(this, game, amount, source, o);
    if (game.progress.hearts !== before) window.__hits.push(`f${game.frame} ${game.mapId} ${game.room && game.room.key} -${before - game.progress.hearts} ${source && source.isProjectile ? 'shot' : (source && (source.kind || source.type)) || '?'} at ${Math.round(this.x)},${Math.round(this.y)} tide ${game.tide.level}`);
    return r;
  };
});
if (process.env.TIDEHOOK) {
  await page.evaluate((from) => {
    const t = window.__game.tide, orig = t.setLevel.bind(t);
    window.__tides = [];
    t.setLevel = (n, o) => {
      const g = window.__game;
      if (g.frame >= from) window.__tides.push(`f${g.frame} ${g.mapId} ${g.room && g.room.key} ${t.level}->${n} ` + new Error().stack.split('\n').slice(2, 5).map(x => x.trim()).join(' | '));
      return orig(n, o);
    };
  }, Number(process.env.TIDEHOOK));
}
// TIDEHOOK=<frame> lists every tide change from that frame on, with who made it.
// FRAMES=<from>-<to> prints every frame in that window: Link, his hp and
// invulnerability, the buttons held, and every enemy's position.
if (process.env.FRAMES) {
  const [a, b] = process.env.FRAMES.split('-').map(Number);
  await page.evaluate(([a, b]) => {
    const g = window.__game, orig = g.update.bind(g);
    window.__frames = [];
    g.update = (...args) => {
      const r = orig(...args);
      if (g.frame >= a && g.frame <= b && g.player) {
        const p = g.player, i = g.input;
        const held = ['up', 'down', 'left', 'right', 'a', 'b'].filter(k => i.down(k)).join('');
        const foes = g.entities.filter(e => e.isEnemy && !e.dead).map(e => `${e.kind || e.type}@${Math.round(e.x)},${Math.round(e.y)}${e.dir ? e.dir[0] : ""}${e.knockTime ? "k" : ""}${e.isBoss ? ` hp${e.hp}i${e.invuln}${e.weakOpen ? "O" : ""}${e.charging ? "C" : ""}${e.stun ? "S" : ""}` : ""}`).join(" ");
        window.__frames.push(`F${g.frame} L${p.x},${p.y}${p.dir[0]} hp${g.progress.hearts} inv${p.invuln} sw${p.swinging} [${held}] ${foes}`);
      }
      return r;
    };
  }, [a, b]);
}
// BOSSSTART=1 lists the frame each boss or miniboss starts its fight (its
// wait for the shutters ends, S235), so a route's boss waits can be lined up
// against another build's.
if (process.env.BOSSSTART) await page.evaluate(async () => {
  const { Boss } = await import('/src/game/enemy.js');
  const orig = Boss.prototype.update;
  window.__starts = [];
  Boss.prototype.update = function (game) {
    const before = this.intro;
    const r = orig.call(this, game);
    if (before > 0 && this.intro === 0) {
      const tr = window.__rp._trace || [];
      window.__starts.push(`step ${tr.length ? tr[tr.length - 1].step + 1 : 0} f${game.frame} ${game.mapId} ${game.room && game.room.key} ${this.kind || this.type}`);
    }
    return r;
  };
});
// CHESTSIDES=1 opens every chest from whatever side the route stands on and
// lists the ones that were not opened from the front (S224).
if (process.env.GOD) await page.evaluate(() => { window.__god = true; });
if (process.env.CHESTSIDES) await page.evaluate(async () => {
  const { Chest } = await import('/src/game/objects.js');
  const orig = Chest.prototype.interact;
  window.__sides = [];
  Chest.prototype.interact = function (game, player) {
    if (!this.opened && player && (player.dir !== 'up' || player.cy <= this.cy)) {
      const tr = window.__rp._trace || [];
      window.__sides.push(`step ${tr.length ? tr[tr.length - 1].step + 1 : 0} ${game.mapId} ${game.room && game.room.key} chest ${this.x / 16},${this.y / 16} Link ${Math.round(player.x)},${Math.round(player.y)} ${player.dir}`);
      return orig.call(this, game, null);
    }
    return orig.call(this, game, player);
  };
});
// SAYS=<text> lists every text box whose words contain <text>, with the step.
if (process.env.SAYS) await page.evaluate(() => {
  const g = window.__game, orig = g.say.bind(g);
  window.__says = [];
  g.say = (t, o) => { const tr = window.__rp._trace || []; window.__says.push(`step ${tr.length ? tr[tr.length - 1].step + 1 : 0} f${g.frame} ${g.mapId} ${g.room && g.room.key} ${String(t).replace(/\n/g, ' ')}`); return orig(t, o); };
});
await page.evaluate(steps => window.__rp.beginPlaythrough(steps), ROUTE.slice(0, end));
let r; let err = null;
for (let i = 0; i < 4000; i++) {
  try { r = await page.evaluate(n => window.__rp.pump(n), 3000); } catch (e) { err = e.message.split('\n')[0]; break; }
  if (r.done || r.error) { if (r.error) err = r.error; break; }
}
const res = await page.evaluate(() => window.__rp.result());
for (const t of res.trace.filter(t => t.step >= start)) console.log(`${String(t.step).padStart(4)} ${t.kind.padEnd(9)} f${String(t.frame).padStart(6)} ${t.room.padEnd(12)} ${String(t.x).padStart(4)},${String(t.y).padStart(3)} hp ${t.hp}/${t.maxHp} tide ${t.tide} foes ${t.foes} keys ${t.keys} ${t.foeKinds ? '[' + t.foeKinds + ']' : ''}`);
const hits = await page.evaluate(() => window.__hits);
if (process.env.FRAMES) for (const x of await page.evaluate(() => window.__frames)) console.log(x);
if (process.env.BOSSSTART) for (const x of await page.evaluate(() => window.__starts)) console.log('START', x);
if (process.env.CHESTSIDES) for (const x of await page.evaluate(() => window.__sides)) console.log('SIDE', x);
if (process.env.SAYS) for (const x of await page.evaluate(() => window.__says)) if (x.includes(process.env.SAYS)) console.log('SAY', x);
if (process.env.TIDEHOOK) for (const x of await page.evaluate(() => window.__tides)) console.log('TIDE', x); if (process.env.HITS) for (const h of hits) if (h.includes(process.env.HITS)) console.log('HIT', h);
const st = await page.evaluate(() => { const g = window.__game; return { ents: g.entities.filter(e => !e.isEffect).map(e => (e.type || e.kind || e.constructor.name) + (e.pressed ? '*' : '') + '@' + Math.round(e.x) + ',' + Math.round(e.y)).join(' '), flags: Object.keys(g.progress.flags).filter(k => k.startsWith(g.mapId)).join(','), map: g.mapId, room: g.room && g.room.key, x: g.player.x, y: g.player.y, tide: g.tide.level, mode: g.mode, progress: g.progress }; });
if (process.argv[4]) await writeFile(process.argv[4], JSON.stringify(st));
// EVAL='<expr>' prints an expression read with the game as `g` at the end.
if (process.env.EVAL) console.log('EVAL', await page.evaluate(src => { const g = window.__game; return JSON.stringify(eval(src)); }, process.env.EVAL));
console.log('ENTS', st.ents, 'FLAGS', st.flags); console.log('END', st.map, st.room, st.x, st.y, 'tide', st.tide, 'mode', st.mode, 'hp', st.progress.hearts, '/', st.progress.maxHearts, err ? 'ERR ' + err : '', 'frames', res.frames);
await browser.close(); server.close();
