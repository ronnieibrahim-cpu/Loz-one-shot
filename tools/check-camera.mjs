// Camera harness. Pure arithmetic, no browser: the camera is a function of the
// room's size and the player's position, and it should be provable as one.
//
// The two assertions that matter most are the ones a plausible-looking camera
// fails. A camera CENTRED on the player passes "reaches its clamp at both ends"
// and fails "does not move inside the deadzone" — which is [A9] in the plan and
// the whole fidelity claim of the feature. And a camera without the clamp
// passes the deadzone test and shows the void past the room edge.
import { Camera } from '../src/game/camera.js';
import { VIEW_W, VIEW_H, TILE, ROOM_W, ROOM_H } from '../src/core/screen.js';
import {
  CAM_DEADZONE_W, CAM_MAX_SPEED, CAM_ACTIVATE_MARGIN,
} from '../src/data/feel.js';

let passed = 0; const failures = [];
function check(name, cond, detail) {
  if (cond) { passed++; console.log('  ok   ' + name); }
  else { failures.push(name); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
}
function section(s) { console.log('\n--- ' + s + ' ---'); }

/** A stand-in for Room: the camera only ever reads pw/ph. */
const room = (sw, sh) => ({
  sw, sh, tw: sw * ROOM_W, th: sh * ROOM_H,
  pw: sw * ROOM_W * TILE, ph: sh * ROOM_H * TILE,
});
const mkCam = () => new Camera({ player: null });

// ===========================================================================
section('a 1x1 room has no camera at all');

{
  const r = room(1, 1);
  const c = mkCam();
  const [mx, my] = c.limits(r);
  check('the clamp range is empty in both axes', mx === 0 && my === 0, `${mx},${my}`);
  // Walk the whole room, one pixel at a time, in both axes.
  let moved = false;
  for (let px = 0; px <= r.pw; px += 1) {
    for (const py of [0, r.ph >> 1, r.ph]) {
      c.update(r, px, py);
      if (c.x !== 0 || c.y !== 0) moved = true;
    }
  }
  check('the camera never leaves the origin, anywhere in the room', !moved,
    `ended at ${c.x},${c.y}`);
  c.snap(r, r.pw, r.ph);
  check('...and a snap to the far corner is still the origin', c.x === 0 && c.y === 0,
    `${c.x},${c.y}`);
}

// ===========================================================================
section('the deadzone — [A9], the assertion a centring camera fails');

{
  const r = room(3, 1);
  const c = mkCam();
  const midY = r.ph >> 1;
  const startX = r.pw >> 1;
  // CENTRE the player in the window. Repeatedly calling update with him
  // standing still would instead drive the camera until he sits exactly ON the
  // deadzone boundary, where tracking him 1:1 is the correct behaviour — the
  // first cut of this test did that and failed the implementation for it.
  c.x = startX - (VIEW_W >> 1);
  const settled = c.x;
  check('the camera settles somewhere off the left clamp', settled > 0, `x=${settled}`);

  // Now walk RIGHT by less than the deadzone half-width. It must not budge.
  let budged = false;
  for (let d = 1; d <= CAM_DEADZONE_W - 2; d++) {
    c.update(r, startX + d, midY);
    if (c.x !== settled) { budged = true; break; }
  }
  check('walking inside the deadzone does not move it at all', !budged,
    `settled=${settled} now=${c.x}`);

  // And walking well past it must.
  for (let i = 0; i < 60; i++) c.update(r, startX + CAM_DEADZONE_W * 3, midY);
  check('...and walking out of it does', c.x > settled, `${settled} -> ${c.x}`);
}

// ===========================================================================
section('clamping, and the guarantee the transition depends on — [A5]');

{
  const r = room(3, 1);
  const c = mkCam();
  const [mx] = c.limits(r);
  const midY = r.ph >> 1;

  for (let i = 0; i < 2000; i++) c.update(r, 0, midY);
  check('walking to the left wall clamps at 0', c.x === 0, `x=${c.x}`);

  // [A5] The exit fires at room.pw, so Link is flush against the far edge —
  // and THAT is the only reason the camera is guaranteed to be at its clamp
  // when a transition begins. Assert the implication directly.
  for (let i = 0; i < 2000; i++) c.update(r, r.pw, midY);
  check('walking to the right wall clamps at pw - VIEW_W', c.x === mx, `x=${c.x} max=${mx}`);
  check('...which is what atClamp reports', c.atClamp(r, 'x'));
  check('the window never shows past the room', c.x + VIEW_W <= r.pw, `${c.x + VIEW_W} > ${r.pw}`);

  const tall = room(1, 2);
  const c2 = mkCam();
  for (let i = 0; i < 2000; i++) c2.update(tall, tall.pw >> 1, tall.ph);
  check('the same holds vertically in a 1x2 room',
    c2.y === c2.limits(tall)[1] && c2.x === 0, `${c2.x},${c2.y}`);
}

// ===========================================================================
section('speed and snapping — [A7]');

{
  const r = room(3, 1);
  const c = mkCam();
  const midY = r.ph >> 1;
  c.snap(r, 0, midY);
  const before = c.x;
  c.update(r, r.pw, midY);
  check('one frame of following never exceeds CAM_MAX_SPEED',
    Math.abs(c.x - before) <= CAM_MAX_SPEED, `moved ${c.x - before}`);

  const c2 = mkCam();
  c2.snap(r, 0, midY);
  c2.snap(r, r.pw, midY);
  check('a snap ignores CAM_MAX_SPEED entirely', c2.x === c2.limits(r)[0], `x=${c2.x}`);
}

// ===========================================================================
section('what freezes off camera — [A3]');

{
  const r = room(3, 1);
  const c = mkCam();
  c.snap(r, 0, r.ph >> 1);
  const at = (tx, ty, extra) => ({ isEnemy: true, cx: tx * TILE + 8, cy: ty * TILE + 8, ...extra });

  check('an enemy on screen is live', c.isLive(at(2, 3)));
  check('an enemy just past the margin is frozen',
    !c.isLive(at(ROOM_W + CAM_ACTIVATE_MARGIN + 2, 3)));
  check('an enemy inside the margin is still live',
    c.isLive(at(ROOM_W + CAM_ACTIVATE_MARGIN - 1, 3)));
  check('a BOSS is never frozen', c.isLive(at(28, 3, { isBoss: true })));
  check('a non-enemy is never frozen — a frozen pickup would never expire',
    c.isLive({ isEnemy: false, cx: 28 * TILE, cy: 48 }));

  // The camera oscillates by a pixel whenever the player jitters at the edge
  // of the deadzone. An enemy sitting exactly on the activation boundary is
  // ALLOWED to wake once when the window first reaches it — that is the
  // feature. What it must never do is wake and sleep on alternate frames for
  // the rest of the wobble, which is the failure A3 names. So the assertion
  // counts TRANSITIONS, not distinct values: an earlier cut of this test
  // counted values, called the legitimate first wake a defect, and would have
  // sent someone hunting a bug that was not there.
  const e = at(ROOM_W + CAM_ACTIVATE_MARGIN, 3);
  c.x = 0; c.isLive(e);                       // settle its state
  const seq = [];
  for (let i = 0; i < 40; i++) { c.x = (i % 2) ? 1 : 0; seq.push(c.isLive(e)); }
  const flips = seq.reduce((n, v, i) => n + (i && v !== seq[i - 1] ? 1 : 0), 0);
  check('a one-pixel camera wobble cannot make liveness oscillate (hysteresis)',
    flips <= 1, `${flips} transitions across 40 frames of 1px wobble`);

  // ...and the hysteresis must not weld it permanently awake.
  c.x = 0;
  const far = at(ROOM_W + CAM_ACTIVATE_MARGIN + 6, 3);
  far._camLive = true;
  check('...but something genuinely far away still falls asleep', !c.isLive(far));
}

console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
process.exit(failures.length ? 1 : 0);
