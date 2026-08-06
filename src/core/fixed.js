// 8.8 fixed-point positions.
//
// Every entity's position on the playfield is an integer number of SUBPIXELS,
// 256 to the pixel, plus a derived integer pixel position that rendering reads.
// Nothing on a movement path uses a float coordinate, and nothing on a drawing
// path rounds one.
//
// WHY, IN ORDER OF HOW MUCH IT COSTS TO GET WRONG
//
// 1. `| 0` truncates toward zero. `(-0.5) | 0` is 0, not -1. So a float
//    coordinate floored with `| 0` is a pixel too far right for every negative
//    x and a pixel too low for every negative y — and an entity sits at
//    negative x on every single room transition, because the incoming player is
//    placed at x = -3 and eased across the seam. The sprite jittered by a pixel
//    at exactly the moment the whole screen was sliding, which is why nobody
//    ever caught it by looking. `>> 8` is an arithmetic shift: it floors, and
//    it floors the same way on both sides of zero.
//
// 2. A float accumulator drifts. Adding 1.35 sixty times a second for a few
//    minutes gives a number whose low bits depend on the entire history of the
//    run, so two runs from the same seed and the same inputs can land on
//    different pixels. An integer accumulator cannot do that, which is what
//    makes tools/replay.mjs able to assert on exact equality.
//
// 3. Subpixel accumulation is what lets a speed slower than one pixel per frame
//    exist at all. A current pushing 0.12 px/f against an integer pixel
//    position rounds to nothing every frame and pushes you nowhere.
//
// THE UNITS
//
//   sp     subpixels; 256 sp = 1 px
//   sp/f   subpixels per frame at 60 Hz — the engine's native speed unit
//   px/f   pixels per frame; what enemy and projectile DATA is written in
//
// `moveEntity` and the `fx`/`fy`/`fz` accumulators speak sp. Data-facing
// helpers (the enemy AI toolkit, `fire`) convert with `sp()` at their edge, so
// a spec can keep saying `speed: 0.45` and still move on the fixed grid.

export const FP_BITS = 8;
export const FP_ONE = 1 << FP_BITS;      // 256 subpixels to the pixel
export const FP_HALF = FP_ONE >> 1;

/** Pixels (or px/f) -> subpixels. The one place a float may enter the grid. */
export function sp(px) {
  return Math.round(px * FP_ONE);
}

/**
 * Subpixels -> whole pixels, flooring on both sides of zero.
 * Never use `| 0`, `Math.trunc` or a plain divide here: see note 1 above.
 */
export function toPx(v) {
  return v >> FP_BITS;
}
