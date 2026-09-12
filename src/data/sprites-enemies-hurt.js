// Hand-drawn enemy hurt/death frames — the ordinary-enemy counterpart to
// sprites-bosses.js's `boss_*_hurt` art, one flinch or death pose per enemy
// that has one. NOT generated: `sprites-enemies.js` is the ripper's own file
// and stays off limits (CLAUDE.md), so a per-species frame the sheet doesn't
// have lands here instead, following the same "hand-draw only once
// extraction is checked and comes up empty" discipline the boss roster used.
//
// Same grammar as every other sprite pack (src/gfx/art.js): silhouette first,
// a hard 1px '3' outline, flat 0-2 light-to-dark ramp, no gradients. Drawn to
// the boss precedent (sprites-bosses.js's own header): the SAME creature
// caught mid-recoil, not a recolour — eyes shut or squinted, expression
// changed a few pixels, body silhouette untouched so it still reads as the
// same thing on the same frame the walk cycle would have drawn. `_death`
// frames are the one deliberate exception to "silhouette untouched": a death
// pose is a collapsed final state, not a recoil, so the shape is allowed to
// change as long as the creature is still legibly itself (see stalfos_death
// below).

import { sprites } from '../gfx/art.js';

export const ENEMY_HURT_ART = {
  // Wisp — drawn: assets/sheets/oracle-seasons-enemies.png has no flinch pose
  // for Spark (the creature wisp_0/wisp_1 substitute in), only the two
  // lit/unlit frames already in sprites-enemies.js. Same spiky halo
  // silhouette as wisp_0 (rows 0-5 and 12-15 are pixel-identical to it), the
  // grinning face squinted shut and the wide grin pulled in to a small wince.
  wisp_hurt: `
    ....03300330....
    ..300333333003..
    .33333000033333.
    .03300000000330.
    0030330000330300
    3330033003300333
    3300033003300033
    0303000000003030
    0303300000033030
    3300000000000033
    3330000330000333
    0030000000000300
    .03300000000330.
    .33333000033333.
    ..300333333003..
    ....03300330....` ,

  // Stalfos death — drawn: assets/sheets/oracle-seasons-enemies.png's Sword
  // Stalfos has no collapse pose, only the standing walk frames stalfos_d0/
  // d1/s0/s1 already in sprites-enemies.js. A skeleton's own death is the one
  // case in this roster where "the same creature caught mid-recoil" doesn't
  // apply (see header) — a stalfos does not flinch when it dies, it comes
  // apart. Drawn as its own skull (same rounded cranium and two eye-socket
  // notches as stalfos_d0's head, rows 5-10 here) fallen onto a heap of its
  // own bones (rows 11-15), rather than a recolour or a generic cloud, so it
  // still reads as "this is what was chasing you" and not a shared effect.
  // Drawn in `enemyk`'s own four bone tones at runtime (stalfos already
  // passes `pal: 'enemyk'` — see src/data/enemies.js — so the palette here is
  // only the fallback for a direct lookup with no runtime override).
  stalfos_death: `
    ................
    ................
    ................
    ................
    ................
    ......3333......
    .....300003.....
    ....30300303....
    ....30000003....
    .....300003.....
    ......3333......
    ....30000003....
    ..300000000003..
    .30000000000003.
    .30111111111103.
    .33333333333333.` ,

  // Beetle hurt — drawn: assets/sheets/oracle-seasons-enemies.png's Spiked
  // Beetle has only its two upright frames (beetle_d0/d1) and two balled-charge
  // frames (beetle_s0/s1) already in sprites-enemies.js, no recoil pose. Every
  // outline, antenna and leg pixel here is beetle_d0's own, unchanged — only
  // seven pixels differ, a single zigzag crack punched down the shell's dead
  // centre (a clean solid-3 column in beetle_d0 with nothing else drawn over
  // it) from row 5 to row 11. `beetle` has `shield: 'front'` (src/data/
  // enemies.js) and only ever shows this on a hit that got PAST that shield,
  // so "the armour itself cracks" reads as the same creature struck from an
  // angle its shell doesn't cover, not a recolour or a different pose.
  beetle_hurt: `
    ...33......33...
    ...303....303...
    ...3003..3003...
    ...3013333103...
    3333133113313333
    3033333303333303
    3003333033333003
    .30033330333003.
    .31003333030013.
    .33113303331133.
    .31333330333313.
    .31113333031113.
    .33111000011133.
    .30331111113303.
    .30003333330003.
    ..333333333333..` ,

  // Gel death — drawn: the sheet's "Color-Changing Gel" strip (six frames,
  // red/yellow/blue x2) is only ever the same small round blob in a
  // different colour, no squashed pose; `gel_0`/`gel_1` already extract the
  // red pair. hp 1, deliberately: `gel` was ruled OUT for `hurtFrame` in S12
  // (a 1-hp enemy is removed the same frame it takes its only hit, before a
  // flicker window ever renders) — `deathFrame` has no such rule (see
  // docs/prompts/LEDGER.md), and this is that claim's sharpest test, not the
  // stalfos-shaped "hp happened to be above the cutoff" case. Shape changed
  // on purpose, per the `_death` exception in this file's own header:
  // `gel_0` is a compact round blob in rows 4-9; this is the same blob
  // flattened into a wide puddle low in the cell (rows 8-13) with two
  // isolated splash flecks at row 14, reading as "squashed", not a recolour.
  gel_death: `
    ................
    ................
    ................
    ................
    ................
    ................
    ................
    ................
    ......3113......
    .....301113.....
    ....31111113....
    ...3111111113...
    ..311111111113..
    .31111111111113.
    ..1..........1..
    ................` ,

  // Wisp death — drawn: Spark's two sheet frames (`wisp_0`/`wisp_1`, per
  // this game's own substitution note in `sprites-enemies.js`'s header) are
  // both full-size lit/unlit poses, no snuffed-out frame. `wisp` is the
  // first enemy in the roster to carry BOTH `hurtFrame` and `deathFrame` at
  // once (`src/data/enemies.js`) — proving `Enemy.spriteName()` really does
  // check `dying` before `hurtFrame` on a real enemy, not just in the two
  // separate single-field proofs S12/S13/S15/S16 gave. Shape changed on
  // purpose, per the `_death` exception: the full spiky halo (`wisp_hurt`
  // above, and the walk frames) collapsed down to a small dim ember at the
  // cell's centre — a flame going out, not a recoil, so it does not try to
  // keep `wisp_hurt`'s "same silhouette, squinted eyes" shape.
  wisp_death: `
    ................
    ................
    ................
    ................
    ................
    ................
    ......3333......
    .....300003.....
    .....311113.....
    ......3333......
    ................
    ................
    ................
    ................
    ................
    ................` ,

  // Darknut hurt — drawn: assets/sheets/oracle-seasons-enemies.png's own
  // "Darknut" plate was checked frame by frame (idle x2, side x2, walk-leg
  // pairs, a raised-sword windup, four side-lunge poses) and every one of
  // them is an aggressive stance, not a flinch — nothing on the sheet shows
  // this knight caught off guard. `darknut_d0`'s own grid (sprites-enemies.js)
  // is reused pixel-for-pixel, per this file's own header: same silhouette,
  // only the visor slot touched. The two red eye-dots (row 2) go black —
  // eyes shut, the boss roster's own "eyes shut or squinted" grammar — and
  // the tan nose bridge between them (row 3) goes black too, pulling the
  // visor into a scrunched wince. Reads as a knight staggering forward from
  // a hit it didn't see coming (its `shield: 'front'` in src/data/
  // enemies.js only covers the way it's facing), without moving a single
  // outline pixel of the armour itself. Eligible under the S12 hp rule:
  // hp 6 > swordDamage() 2, so the flicker window survives long enough to
  // show it.
  darknut_hurt: `
    ..33........333.
    ..3033333333003.
    ..303300033003..
    ...31313133033..
    ...313333313333.
    .333130303113003
    3003113331113103
    3013111311113113
    3113111311113333
    3333311311333113
    3113333333333113
    3333330001133333
    3001331111331003
    3000333333330003
    3000333330030003
    .33333333333333.` ,

  // Moblin hurt — drawn: assets/sheets/oracle-seasons-enemies.png's own
  // "Moblin & Goriya" plate was checked frame by frame the same way S18
  // checked Darknut's — idle front/back, two side-holding-spear poses, a
  // raised-spear windup (front and back), and four side-lunge throwing
  // poses — and every one is either a neutral stance or an active attack,
  // nothing caught off guard. `moblin_d0`'s own grid (sprites-enemies.js)
  // is reused pixel-for-pixel: the two red eye-dots sitting just under the
  // helmet's brow band (row 3, flanking the snout) go black — the same
  // "eyes shut" edit `darknut_hurt` used — and one pixel at the centre of
  // the flat tan snout (row 9) goes red, a small wince/flush mark on the
  // one part of the face with nothing else drawn over it. 3 pixels total,
  // silhouette untouched. Reads as the moment a hit actually catches this
  // ranged attacker before it can put distance back between itself and the
  // player (its `ai` in src/data/enemies.js only backs away once it's
  // already close). Eligible under the S12 hp rule: hp 4 > swordDamage()
  // 2, so the flicker window survives long enough to show it.
  moblin_hurt: `
    3333..3333..3333
    3111331111331113
    .31313111131313.
    .33330333303333.
    .31311311311313.
    3333311111133113
    3003033333303313
    3013031001303333
    3113310330133003
    .333100100013103
    .333331001333113
    .33311333331333.
    .3333300000333..
    .331113333333...
    .300100333333...
    .333333333......` ,

  // Wizzrobe hurt — drawn: assets/sheets/oracle-seasons-enemies.png's own
  // "Wizzrobe" plate was checked frame by frame (the two used idle poses,
  // two hood-only appear/disappear transition frames, and a turned 3/4
  // view) and none of them is a flinch — the extra frames are the
  // teleport transition its `submerge()` cycle already animates (src/data/
  // enemies.js), not a reaction to being hit. `wizzrobe_0`'s own grid
  // (sprites-enemies.js) is reused pixel-for-pixel. Its "eyes" (row 7-8,
  // col 6 and col 9) are the sprite's LIGHTEST colour sitting inside its
  // DARKEST — the same "shut the eyes" trick `darknut_hurt`/`moblin_hurt`
  // used would turn them the same colour as the visor around them and
  // vanish instead of reading as a change, so this one uses the sprite's
  // otherwise-unused THIRD colour (index 2, the runtime `enemyp` palette's
  // own mid-tone — see src/gfx/palettes.js) for a small bruise/wince mark
  // on the right cheek (rows 9-10, three pixels), guaranteed to contrast
  // against both the light face and the dark visor since nothing else in
  // this sprite uses that shade. Silhouette untouched. Verified harmless
  // to draw while surfaced: `submerge()` only clears `invuln` while
  // visible (`_subState === 'up'`) and sets it to 9999 while hidden, so
  // `Entity.hurt` can only ever land — and the flicker window can only
  // ever run — during the surfaced half of the cycle, when the sprite is
  // actually drawn. Eligible under the S12 hp rule: hp 3 > swordDamage()
  // 2, so the flicker window survives long enough to show it.
  wizzrobe_hurt: `
    .......33.......
    ......3003......
    .....310013.....
    ...3333333333...
    ..311111111113..
    .31111111111113.
    3331133333311333
    3003330330333003
    3000330330330003
    3100333333332213
    .31003333330213.
    ..300000000003..
    ..300011110003..
    .30000011000003.
    3000000000000003
    3333333333333333` ,

  // Siren hurt — drawn: assets/sheets/oracle-seasons-enemies.png's own
  // "River Zora" plate has exactly two frames for this creature —
  // `siren_0` (fanged mouth shut) and `siren_1` (open singing ring-shot
  // pose), both already used — and every neighbouring box on the sheet
  // near them belongs to a different creature entirely (Pols Voice, and
  // two unrelated coral/flower icons). Nothing to extract. `siren_0`'s
  // own grid (sprites-enemies.js) is reused pixel-for-pixel; this face
  // reads as a fanged mask rather than a face with distinct pupil-in-iris
  // eyes (unlike `darknut`/`moblin`), so this uses the same fallback S20
  // introduced for `wizzrobe`: the sprite's otherwise-unused THIRD colour
  // (index 2 — a distinct dark shade in the runtime `enemyb` palette,
  // `src/gfx/palettes.js` — separate from both the light body and the
  // near-black outline) for a small graze mark on the flat tan chin below
  // the mouth (row 14, three pixels), guaranteed to contrast whatever
  // palette this enemy renders in. Silhouette untouched. `siren` shares
  // `wizzrobe`'s `submerge()` primitive, so the same S20 finding applies
  // without re-deriving it: hidden sets `invuln = 9999` and `Entity.hurt`
  // early-returns on `invuln > 0`, so it can only ever be hit — and only
  // ever show this frame — while surfaced and visible. Eligible under the
  // S12 hp rule: hp 4 > swordDamage() 2, so the flicker window survives
  // long enough to show it.
  siren_hurt: `
    .......33.......
    ......3003......
    333...3003...333
    3003333333333003
    3000333333330003
    .30300333300303.
    .30300033000303.
    3003030000303003
    3003033333303003
    .30331100113303.
    3003113333113003
    3033131111313303
    0333111331113330
    0000333003330000
    ..000022200000..
    .....000000.....` ,

  // Anglerfry hurt — drawn: assets/sheets/oracle-seasons-enemies.png's own
  // "Cheep-Cheep" plate (per this file's own substitution note — anglerfry
  // has no direct source equivalent) has exactly two frames, both already
  // used as `anglerfry_0`/`anglerfry_1`; every neighbouring box on the
  // sheet belongs to a different creature. Nothing to extract, the fourth
  // session running to find this. `anglerfry_0`'s own grid (sprites-
  // enemies.js) is reused pixel-for-pixel. Unlike `wizzrobe`/`siren`, this
  // face DOES have distinct eyes — two short black bars (rows 5-6, col 3
  // and col 5) on the sprite's light tan face, separated by one tan pixel
  // (col 4) — so the `darknut`/`moblin` "shut the eyes" trick applies
  // directly, just in the opposite tone direction (dark marks on a light
  // face rather than light marks on a dark one): the single tan pixel
  // between the two eye-dots (col 4, both rows) turns black too, merging
  // them into one solid squeezed-shut bar. 2 pixels total, silhouette
  // untouched. `anglerfry`'s `light: true` flag (src/data/enemies.js) is
  // unrelated to rendering — it only lets the Squall Bellows push it
  // (src/game/enemy.js's own comment on the flag) — so it has no bearing
  // on whether this frame draws. Eligible under the S12 hp rule: hp 3 >
  // swordDamage() 2, so the flicker window survives long enough to show
  // it.
  anglerfry_hurt: `
    ......3333......
    .....300003.....
    ...333333003....
    ..30300333003...
    .3000000333333..
    .3033300333003..
    .3033300330003..
    .3000000300003..
    .3333003330033..
    .30003330033333.
    3000003000013003
    3033003000013003
    3000013000113003
    .310131001133003
    ..333111113..33.
    .....33333......` ,

  // octorokSea hurt — drawn: assets/sheets/oracle-seasons-enemies.png's own
  // "Octorok" plate has exactly four frames (front x2, side x2), all
  // already used as `octorok_d0`/`d1`/`s0`/`s1`; the one nearby box with a
  // matching pitch (963,307, right after `octorok_s1`) turns out to be a
  // shell/pickup icon in a visibly different orange, not a fifth Octorok
  // pose — confirmed against the sheet's own "Octorok" label, which sits
  // only over the first four boxes. Nothing to extract. `octorok_d0`'s own
  // grid (sprites-enemies.js) is reused pixel-for-pixel: its face has two
  // distinct black eye-squares (rows 6-8, centred on cols 5-6 and 9-10)
  // separated by a tan gap that narrows to 2 pixels at its middle row (row
  // 7, cols 7-8) — the same "merge two dark eye-shapes by filling the gap
  // between them" trick `anglerfry_hurt` used, not the `darknut`/`moblin`
  // "recolour red dots to the outline shade" variant, since these eyes are
  // already the outline's own colour (there is no lighter dot left to
  // shut). Only row 7's 2-pixel gap is filled — rows 6 and 8 keep their
  // wider tan gaps — so the eyes read as squeezed shut at their centre
  // without turning the whole nose bridge into a single black bar. 2
  // pixels total, silhouette untouched. `octorokSea` renders with
  // `pal: 'enemyb'` (`src/data/enemies.js`), not this sprite's own
  // extracted palette, and the grid never uses index 2 — so unlike this
  // edit, an unused-palette-slot mark was available here too, but the
  // eyes-shut trick applies cleanly and needed no fallback. Eligible under
  // the S12 hp rule: hp 3 > swordDamage() 2, so the flicker window
  // survives long enough to show it. `octorok` (the hp-2 land cousin)
  // shares this exact frame set but does not qualify for a `hurtFrame`
  // under that rule, hence the enemy-id-scoped key rather than
  // `octorok_hurt`.
  octorokSea_hurt: `
    .....333333.....
    3333311111133333
    3113111001113113
    .31311000011313.
    ..311110011113..
    ..310011110013..
    ..310300003013..
    ..310333333013..
    ..331030030133..
    .31310000001313.
    3113331111333113
    3133331001333313
    3333333333333333
    ...3110000113...
    ...3333333333...
    ................` ,

  // Stalfos hurt — drawn: the last hp > 2 enemy in the roster without a
  // `hurtFrame`, and the reverse-order case every prior session's prompt
  // flagged as out of scope — `stalfos` already has `deathFrame`
  // (`stalfos_death`, above), and `Enemy.spriteName()` (src/game/enemy.js)
  // checks `dying && deathFrame` BEFORE `flicker > 0 && hurtFrame`, so the
  // two coexist without conflict; S17 proved that ordering on `wisp`
  // (which has both), this is the second real case rather than a fresh
  // derivation. Checked the sheet's own "Stalfos, Sword Stalfos & Shrouded
  // Stalfos" plate first: the plain bone-white skeleton (blue trim) that
  // `stalfos_d0`/`d1` extract from has exactly two frames, both already
  // used; every other frame on the same labelled plate is green-hooded
  // Sword Stalfos art (idle stances and mid-swing attack poses, already
  // the substitution source for `stalfos_s0`/`s1`'s side view) — no third
  // pose of the plain skeleton itself exists to extract. `stalfos_d0`'s
  // own grid (sprites-enemies.js) is reused pixel-for-pixel: its eye
  // sockets are already solid black cave shapes, not a lighter dot with
  // headroom to "shut" (the same situation `octorokSea` hit two sessions
  // ago), and unlike `octorokSea` there's no clean 2px gap between two
  // separate dark shapes to merge — the black here is one continuous
  // area. So this uses the `wizzrobe`/`siren` fallback instead: the grid
  // never uses index 2, which is a genuinely distinct dark olive
  // (`#565640`) in the runtime `enemyk` bone palette (`src/gfx/
  // palettes.js`), so two pixels on the plain white forehead band (row 1,
  // columns 8-9 — the widest run of untouched white in the whole sprite)
  // turn to index 2, reading as a crack punched into the skull's own bone
  // — thematically apt for a skeleton, not just a bruise borrowed from an
  // enemy with skin. 2 pixels total, silhouette untouched. Eligible under
  // the S12 hp rule: hp 3 > swordDamage() 2, so the flicker window
  // survives long enough to show it.
  stalfos_hurt: `
    ......333333....
    .....30022003...
    ....3000100003..
    ....3033113303..
    .333303000030333
    .300310033001303
    .300333000033003
    .33000303303003.
    .313003333330313
    .333331133113313
    .300313311331333
    .300331133113003
    ..33333333333003
    ...330033311333.
    ...3000333333...
    ...33333........` ,

  // Keese death — drawn: the sheet's own "Keese" plate has exactly two
  // frames (wings-spread, wings-folded), both already extracted as
  // `keese_0`/`keese_1` (`tools/rip-enemies.py` — index 125 and a
  // `RECTS` entry respectively), confirmed against the sheet's own
  // "Keese" label sitting directly over just those two boxes. Nothing to
  // extract; hand-drawn instead. The first `deathFrame` target since
  // `gel_death` (S16) to actually test this file's own exception (see
  // header): a death pose is allowed to change silhouette, unlike a
  // `hurtFrame`. First draft tried the `stalfos_death`/`gel_death`
  // pattern of shifting the shape down to sit low in the cell — WRONG for
  // this creature specifically: `keese` has `z: 8` (an airborne height
  // offset, `src/data/enemies.js`), and `Enemy.update()`'s `dying` branch
  // (`src/game/enemy.js`) returns before touching `z` at all, so the
  // whole dying stall renders 8px up from the ground exactly where it
  // died — a "collapsed low in the cell" pose would read as hovering, not
  // fallen. `wisp` is the existing precedent for this (`z: 8`, `terrain:
  // 'air'`, already has `deathFrame` since S17): `wisp_death`'s own
  // shape stays CENTRED in the cell rather than dropping to the bottom,
  // reading as "fizzling out in place," not "landing" — checked that
  // shape before drawing this one rather than repeating the mismatch.
  // Base is `keese_1` (wings-folded, sprites-enemies.js) reused
  // pixel-for-pixel and centred the same way: its two eye-dots (rows 7-8,
  // columns 5 and 8) recoloured to the outline shade, closed for good;
  // its right foot-point (row 11, column 10) removed and its left one
  // (row 12, column 3) extended one row further down (row 13) — an
  // asymmetric droop reading as gone limp, rather than the tidy
  // fully-folded rest pose `keese_1` already is. 6 pixels changed total.
  // No hp constraint applies to `deathFrame` (`keese` is hp 1, same as
  // `gel` — `die()` runs exactly once regardless of hit count, per
  // S13/S16).
  keese_death: `
    ................
    ................
    ................
    .....3..3.......
    .....3..3.......
    ....33..33......
    ....333333......
    ...33333333.....
    ...33333333.....
    ...33333333.....
    ...33333333.....
    ...33....33.....
    ...3............
    ...3............
    ................
    ................` ,

  // Octorok (land) death — drawn: the sheet's own "Octorok" plate has
  // exactly four frames (front x2, side x2), all already extracted as
  // `octorok_d0`/`d1`/`s0`/`s1`, plus one more nearby box S24 already
  // identified as an unrelated shell/pickup icon (different orange
  // palette, confirmed against the sheet's own "Octorok" label spanning
  // only the first four boxes) — re-checked with a death pose in mind
  // specifically rather than trusting S24's hurt-pose conclusion blindly,
  // same result. Nothing to extract; hand-drawn instead. `octorok` (the
  // land enemy, hp 2 — distinct from `octorokSea`, hp 3, which already
  // has `hurtFrame`) has no `z` field at all (`src/data/enemies.js`), so
  // unlike `keese_death` (S26) there's no height-offset trap here: a
  // pose that sits low in the cell genuinely reads as "on the ground,"
  // confirmed by reading `Entity`'s own `fz` default (0) before drawing,
  // not assumed from the ground-pose precedent alone. `octorok_d0`'s own
  // grid (sprites-enemies.js) is squashed rather than shifted: every
  // other row from its top hood band down through its body (rows 0, 2,
  // 4, 6, 8, 10, 12 of the original 16) is kept, compressing the whole
  // 15-row silhouette into 7 rows sat at the very bottom of the cell —
  // the same "flatten the existing shape into a puddle" move
  // `gel_death` used, not a redraw from scratch, so it still reads as
  // the same creature deflated rather than a generic blob. Eligible
  // under no hp constraint (`deathFrame` has none, per S13/S16); hp 2
  // means `octorok` can never show a `hurtFrame` (`swordDamage()` is 2,
  // so any hit is lethal), making this its only possible death/hit
  // feedback.
  octorok_death: `
    ................
    ................
    ................
    ................
    ................
    ................
    ................
    ................
    ................
    .....333333.....
    3113111001113113
    ..311110011113..
    ..310300003013..
    ..331030030133..
    3113331111333113
    3333333333333333` ,

  // Crab death — drawn: the sheet's own "Sand Crab" plate has exactly two
  // frames, both already extracted as `crab_0`/`crab_1`, confirmed
  // against the sheet's own label spanning only those two boxes ("Rope"
  // and "Spiny Beetle" sit either side of it, both other creatures).
  // Nothing to extract; hand-drawn instead. First drafts tried the
  // `octorok_death` "keep every other row" squash and a full vertical
  // flip — both failed on inspection: the every-other-row squash breaks
  // apart the two claw columns (they're separated by a real gap in the
  // living sprite, unlike `octorok_d0`'s continuous hood band, so halving
  // the rows leaves them floating with no connecting body between them),
  // and a full flip pushes the shape to the TOP of the cell instead of
  // sitting low, which reads as an odd crop rather than "on its back."
  // What actually works: `crab_0`'s own LOWER half (rows 7-14 of its
  // grid, sprites-enemies.js — the legs/underside band, below where the
  // two raised claws split off) reused pixel-for-pixel and shifted down
  // to sit at the bottom of the cell. With the claws gone from the frame
  // entirely rather than redrawn, it reads as "flipped, claws tucked
  // under, only the legs and belly showing" — a real shape change
  // (allowed for `_death`, per this file's own header), not a squash of
  // the same silhouette. `crab` has no `z` field (ground/`terrain:
  // 'shallow'`, `src/data/enemies.js`), confirmed before drawing a
  // low-in-the-cell pose, same check `octorok_death`/`urchin_death` made.
  // No hp constraint applies (`deathFrame` has none); `crab` is hp 2, so
  // — same as `octorok`/`urchin` — this is its only possible death/hit
  // feedback, since `swordDamage()` (2) always kills it in one hit.
  crab_death: `
    ................
    ................
    ................
    ................
    ................
    ................
    ................
    ................
    3103013..3103013
    .31013333331013.
    ..313303303313..
    ..333303303333..
    ..331313313133..
    .30310311301303.
    3003110000113003
    3033311111133303` ,

  // Zol death — drawn: the sheet's own "Zol & Gel" plate has exactly two
  // frames (round at rest, stretched tall mid-hop), both already
  // extracted as `zol_0`/`zol_1`, confirmed against the sheet's own
  // label — the box immediately before it (index 341) is a different
  // creature entirely (green `#10ad42` palette, not `zol`'s red). Nothing
  // to extract; hand-drawn instead, following `gel_death`'s own template
  // (same file, S16) rather than inventing a new shape: `zol` splits INTO
  // two `gel`s on death (`onDie`, `src/data/enemies.js`), so echoing
  // `gel_death`'s wide flat puddle — just scaled up to `zol_0`'s own
  // larger blob size, with the same two isolated single-pixel "splash"
  // flecks at the base — reads as a visual link between the two rather
  // than an arbitrary new pose. `zol_0`'s round eye-marks (already the
  // outline's own dark colour, same "nothing lighter to shut" situation
  // `octorok`/`stalfos` hit) are dropped entirely rather than recoloured,
  // which the `_death` exception in this file's header explicitly allows
  // (silhouette may change) and which `gel_death` itself already does
  // (no eyes at all). Confirmed `zol` has no `z` field before drawing low
  // in the cell. **This is the first `deathFrame` target whose `onDie`
  // does something beyond a loot roll** — it spawns two `gel`s to either
  // side — and `Enemy.die()` (src/game/enemy.js) defers that spawn until
  // the `ENEMY_DEATH_FRAMES` stall this pose plays through actually ends
  // (`dying = true` returns early; `super.die(game)` — which calls
  // `onDie` — only runs once `update()`'s stall counter finishes). This
  // is the deferred-`onDie` mechanism S29's `docs/NEXT-SESSION.md` entry
  // theorised about for `check-playthrough.mjs`'s own timing shift,
  // verified here directly rather than left as theory: an in-engine probe
  // confirmed zero `gel`s exist during the stall and exactly two appear
  // the instant it ends, at the same `x` the `zol` died at (frozen by
  // `dying` skipping `update()`'s own movement), each carrying
  // `opts.split: true` so neither of them recurses into a third split.
  zol_death: `
    ................
    ................
    ................
    ................
    ................
    ................
    ................
    ....3333333.....
    ...311111113....
    ..31111111113...
    .3111111111113..
    311111111111113.
    31111111111111.3
    .11111111111111.
    .1..........1..1
    ................` ,
};

export function installEnemyHurtSprites() {
  sprites.add(ENEMY_HURT_ART, 'magic');
}
