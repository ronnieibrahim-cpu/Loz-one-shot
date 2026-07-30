// Input: unifies keyboard, gamepad and on-screen touch buttons into an 8-button
// Game Boy pad. Exposes both held state and one-frame edge state.

export const BUTTONS = ['up', 'down', 'left', 'right', 'a', 'b', 'start', 'select'];

const KEYMAP = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
  KeyZ: 'b', KeyX: 'a', KeyJ: 'b', KeyK: 'a',
  Space: 'a', KeyN: 'b', KeyM: 'a',
  Enter: 'start', ShiftRight: 'select', ShiftLeft: 'select', Tab: 'select',
  Escape: 'start',
};

export class Input {
  constructor() {
    this.held = Object.create(null);
    this.prev = Object.create(null);
    this._raw = Object.create(null);      // keyboard+touch accumulator
    // A key can go down and back up between two updates. The latch guarantees
    // such a tap is still seen for exactly one frame instead of vanishing.
    this._latch = Object.create(null);
    for (const b of BUTTONS) {
      this.held[b] = false; this.prev[b] = false;
      this._raw[b] = false; this._latch[b] = false;
    }
    this._touchKeys = Object.create(null);
    this.anyPressEver = false;

    window.addEventListener('keydown', (e) => {
      const b = KEYMAP[e.code];
      if (b) { this._raw[b] = true; this._latch[b] = true; this.anyPressEver = true; e.preventDefault(); }
      // Convenience: fullscreen + mute handled by the game, not the pad.
      if (e.code === 'KeyF' || e.code === 'KeyP' || e.code === 'KeyO' || e.code === 'KeyR') {
        this.extra = e.code;
      }
    }, { passive: false });

    window.addEventListener('keyup', (e) => {
      const b = KEYMAP[e.code];
      if (b) { this._raw[b] = false; e.preventDefault(); }
    }, { passive: false });

    window.addEventListener('blur', () => {
      for (const b of BUTTONS) { this._raw[b] = false; this._latch[b] = false; }
    });

    this._initTouch();
  }

  _initTouch() {
    const root = document.getElementById('touch');
    if (!root) return;
    const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (isTouch) document.body.classList.add('touch');

    const nodes = [...root.querySelectorAll('.tbtn')];
    const hit = (x, y) => nodes.find(n => {
      const r = n.getBoundingClientRect();
      return x >= r.left - 6 && x <= r.right + 6 && y >= r.top - 6 && y <= r.bottom + 6;
    });

    const apply = (touches) => {
      for (const k of BUTTONS) this._touchKeys[k] = false;
      for (const n of nodes) n.classList.remove('act');
      for (const t of touches) {
        const n = hit(t.clientX, t.clientY);
        if (n) { this._touchKeys[n.dataset.k] = true; n.classList.add('act'); this.anyPressEver = true; }
      }
    };

    const handler = (e) => { apply(e.touches); e.preventDefault(); };
    root.addEventListener('touchstart', handler, { passive: false });
    root.addEventListener('touchmove', handler, { passive: false });
    root.addEventListener('touchend', handler, { passive: false });
    root.addEventListener('touchcancel', handler, { passive: false });
  }

  _pollGamepad() {
    if (!navigator.getGamepads) return null;
    const pads = navigator.getGamepads();
    for (const p of pads) {
      if (!p) continue;
      const g = Object.create(null);
      const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
      g.left = p.buttons[14]?.pressed || ax < -0.4;
      g.right = p.buttons[15]?.pressed || ax > 0.4;
      g.up = p.buttons[12]?.pressed || ay < -0.4;
      g.down = p.buttons[13]?.pressed || ay > 0.4;
      g.a = p.buttons[0]?.pressed || p.buttons[1]?.pressed;
      g.b = p.buttons[2]?.pressed || p.buttons[3]?.pressed;
      g.start = p.buttons[9]?.pressed;
      g.select = p.buttons[8]?.pressed;
      if (BUTTONS.some(b => g[b])) this.anyPressEver = true;
      return g;
    }
    return null;
  }

  // Called once per fixed update, before game logic.
  update() {
    const gp = this._pollGamepad();
    for (const b of BUTTONS) {
      this.prev[b] = this.held[b];
      this.held[b] = !!(this._raw[b] || this._touchKeys[b] || (gp && gp[b]) || this._latch[b]);
      this._latch[b] = false;
    }
    // Opposing directions cancel, matching hardware d-pad behaviour.
    if (this.held.left && this.held.right) { this.held.left = this.held.right = false; }
    if (this.held.up && this.held.down) { this.held.up = this.held.down = false; }
  }

  down(b) { return this.held[b]; }
  pressed(b) { return this.held[b] && !this.prev[b]; }
  released(b) { return !this.held[b] && this.prev[b]; }
  anyDir() { return this.held.up || this.held.down || this.held.left || this.held.right; }
  takeExtra() { const e = this.extra; this.extra = null; return e; }
}
