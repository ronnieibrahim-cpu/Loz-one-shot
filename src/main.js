// Boot: install data, wire the engine, run a fixed 60 Hz loop.

import { Screen } from './core/screen.js';
import { Input } from './core/input.js';
import { audio } from './core/audio.js';
import { Game } from './game/game.js';
import { installData } from './data/index.js';
import { validateTiles } from './world/tileset.js';
import { validateMaps } from './world/maps.js';
import { tiles as tileSheet, sprites } from './gfx/art.js';

const STEP = 1000 / 60;

function boot() {
  const canvas = document.getElementById('screen');
  const screen = new Screen(canvas);
  const input = new Input();

  installData();

  // Surface data problems in the console rather than failing silently.
  const problems = [...validateTiles().map(p => 'tile: ' + p), ...validateMaps().map(p => 'map: ' + p)];
  if (problems.length) {
    console.warn('[data] %d problem(s):\n%s', problems.length, problems.slice(0, 40).join('\n'));
  }

  const game = new Game(screen, input);
  // ?seed=N pins the save seed a new game starts from. Play leaves it off and
  // gets a fresh world from the clock; tools that must replay the same world
  // twice pass it. Nothing else reads the URL.
  const urlSeed = new URLSearchParams(location.search).get('seed');
  if (urlSeed !== null && urlSeed !== '' && Number.isFinite(Number(urlSeed))) {
    game.seedOverride = Number(urlSeed) >>> 0;
  }
  window.__game = game;          // handy for the test harness and debugging

  // The audio context can only start from a user gesture.
  const kick = () => {
    if (audio.init()) {
      audio.play(game.mode === 'title' ? 'title' : 'overworld');
      window.removeEventListener('keydown', kick);
      window.removeEventListener('pointerdown', kick);
      window.removeEventListener('touchstart', kick);
    }
  };
  window.addEventListener('keydown', kick);
  window.addEventListener('pointerdown', kick);
  window.addEventListener('touchstart', kick);

  document.getElementById('boot')?.classList.add('hidden');

  let acc = 0, last = performance.now(), fpsT = last, frames = 0;
  let driven = false;

  // iPad backgrounds this app constantly (switching apps, the app switcher,
  // the lock button) and an AudioContext left running behind the scenes is
  // the usual reason audio never comes back: some engines suspend it
  // automatically on hide but never resume it, or keep spending CPU on a
  // context nobody can hear. requestAnimationFrame already stops firing while
  // hidden, so the loop needs no explicit pause — only the audio graph does,
  // and `acc`/`last` are reset on return so the frame-skip guard above never
  // has to eat a multi-minute backgrounded gap.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (audio.ctx && audio.ctx.state === 'running') audio.ctx.suspend();
    } else {
      if (audio.ctx && audio.ctx.state === 'suspended') audio.ctx.resume();
      acc = 0;
      last = performance.now();
    }
  });

  // Stepping hook for tools/replay.mjs. A replay has to advance the game one
  // fixed step at a time with scripted input; the wall-clock loop below cannot
  // do that, because how many times it steps depends on how busy the machine
  // is. `takeOver` stops it stepping at all and hands the clock to the caller.
  // Drawing keeps running so screenshots still work — nothing in draw() may
  // consume randomness, which is why the screen shake is a pure hash.
  window.__harness = {
    get driven() { return driven; },
    takeOver() { driven = true; },
    release() { driven = false; acc = 0; last = performance.now(); },
    /** Advance exactly n fixed updates. Only legal while driven. */
    step(n = 1) { for (let i = 0; i < n; i++) game.update(); return game.frame; },
    game,
  };

  function loop(now) {
    requestAnimationFrame(loop);
    let dt = now - last;
    last = now;
    if (dt > 250) dt = STEP;             // tab was backgrounded: don't fast-forward
    acc += dt;
    let steps = 0;
    if (driven) acc = 0;
    while (!driven && acc >= STEP && steps < 4) {
      game.update();
      acc -= STEP;
      steps++;
    }
    game.draw();
    frames++;
    if (now - fpsT >= 1000) { game.fps = frames; frames = 0; fpsT = now; }
  }
  requestAnimationFrame(loop);

  // Report unauthored art once the first frames have rendered.
  setTimeout(() => {
    const miss = [...tileSheet.missing, ...sprites.missing];
    if (miss.length) console.warn('[art] %d missing art name(s):\n%s', miss.length, miss.join(', '));
    window.__missingArt = miss;
  }, 1200);
}

try {
  boot();
} catch (e) {
  console.error(e);
  if (window.__showError) window.__showError('BOOT FAILED: ' + (e && (e.stack || e.message) || e));
}
