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
  function loop(now) {
    requestAnimationFrame(loop);
    let dt = now - last;
    last = now;
    if (dt > 250) dt = STEP;             // tab was backgrounded: don't fast-forward
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 4) {
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
