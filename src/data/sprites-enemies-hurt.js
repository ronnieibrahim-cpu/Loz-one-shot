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



  // Wisp attack (`shootRing()`'s telegraph, ENEMY_ATTACK_FRAMES) — drawn:
  // Spark's own plate (`wisp_0`/`wisp_1`'s substitution source) has exactly
  // 2 frames, both already spent on the ordinary lit/unlit flicker cycle —
  // re-confirmed, same result S89 already found. Reusing `wisp_1` (the
  // inverted-colour flicker frame) as the attack pose was considered and
  // rejected: it is not a materially different pose, only the same
  // silhouette a player already sees every other tick during ordinary idle
  // flicker, unlike `moblin_d1`'s genuinely different "spear raised" pose
  // that S43 got to reuse — freezing on it would not read as a telegraph.
  // Hand-drawn instead, extending `wisp_0`'s own established family rather
  // than inventing a new grammar: `wisp_hurt` (above) shrinks the wide grin
  // down to a small wince, and `wisp_death` collapses the whole halo to an
  // ember, so this pose goes the OTHER direction from `wisp_hurt` — the
  // same grin widened further, reading as the mouth opening wide right
  // before it unleashes the ring of orbs. `wisp_0`'s own grid
  // (sprites-enemies.js) is unchanged everywhere except 4 pixels in the
  // grin's lower rows (10-11): the two dark corner-teeth at row 10 extended
  // one column further in on each side, and row 11's centre dark span
  // widened by one column on each side to match — confirmed by rendering
  // both frames from their actual runtime `magic` palette before drawing,
  // the same technique `octorok_atk` (S90) used. The spiky halo (rows 0-5,
  // 12-15) and both eye wedges are untouched, so it stays unmistakably the
  // same creature mid-cast, not a different expression entirely.
  wisp_atk: `
    ....03300330....
    ..300333333003..
    .33333000033333.
    .03300000000330.
    0030330000330300
    3330033003300333
    3300003003000033
    0303000000003030
    0303300000033030
    3300033003300033
    3330033333300333
    0030003333000300
    .03300000000330.
    .33333000033333.
    ..300333333003..
    ....03300330....` ,

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

  // Darknut attack (charge()'s tell windup, ENEMY_ATTACK_FRAMES-equivalent
  // — this enemy's own tell, 22f) — drawn: `darknut_hurt`'s own comment
  // above already names what the sheet has near this plate ("a raised-
  // sword windup, four side-lunge poses") from S18's frame-by-frame check
  // for a FLINCH pose. Re-examined those same boxes with an ATTACK pose in
  // mind instead (boxes directly below darknut_d0/_death/_s0/_s1 in the
  // sheet's own layout, the same region `darknut_d1` already draws its top
  // half from) — inconclusive. Each is an oddly-tall, irregular box (the
  // flood-fill merging two touching sprites rather than one clean frame),
  // and what's visible reads as a raised tan ARM/fist repeated identically
  // under all four Darknut boxes, which is more consistent with bleed from
  // an unrelated neighbouring sprite than with four distinct lunge poses of
  // this knight — not a confident extraction (CLAUDE.md: compositing or
  // guessing at sheet content needs to be believed, not assumed). Hand-
  // drawn instead, rather than risk mis-extracting. This game's own
  // `darknut` doesn't swing a sword at all — `ai()` (src/data/enemies.js)
  // is a shield-forward charge, not a sword lunge — so a sword-raise pose
  // would have shown the wrong weapon anyway even if confidently found.
  // `darknut_d0`'s own grid (sprites-enemies.js) is reused pixel-for-pixel
  // except the shield band along its own bottom edge (row 12): widened
  // from a 4-pixel red span (columns 6-9) to an 8-pixel span (columns
  // 4-11) by recolouring the flanking black pixels to the shield's own
  // red — reads as the shield braced wider and further forward, matching
  // the actual attack rather than an invented weapon. 4 pixels changed;
  // helmet, visor and gauntlets all untouched.
  darknut_atk: `
    ..33........333.
    ..3033333333003.
    ..303100013003..
    ...31310133033..
    ...313333313333.
    .333130303113003
    3003113331113103
    3013111311113113
    3113111311113333
    3333311311333113
    3113333333333113
    3333330001133333
    3001111111111003
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

  // Wizzrobe attack (`shoot()`'s telegraph, ENEMY_ATTACK_FRAMES) — drawn:
  // `wizzrobe`'s third sheet frame is already extracted and already spent
  // on `deathFrame` (S83, re-confirmed S89/S92) — nothing left on the plate
  // for an attack pose. Rendered `wizzrobe_0`/`_1`/`_death`/`_hurt` from the
  // real runtime `enemyp` palette before drawing (S90/S91's own technique),
  // which is what made it obvious `wizzrobe_hurt`'s bruise mark (above) had
  // already claimed the right cheek with palette index 2 — this pose needed
  // a different part of the face. `wisp_atk` (S91) already owns the
  // "mouth widens" grammar, so this one uses the sprite's two narrow eye
  // slits instead: `wizzrobe_0`'s own grid (sprites-enemies.js) has each
  // eye as a single light column (rows 7-8, columns 6 and 9) inside the
  // dark hood. Widened each one column further inward (columns 5 and 10
  // added at both rows) so the two slits read as one wider, rounder eye
  // each — "eyes going wide as the orb charges" — rather than the thin,
  // half-lidded look of the idle frame. 4 pixels changed; the hat, hood,
  // collar and mouth are all byte-identical to `wizzrobe_0`. Verified safe
  // to draw at all: `shoot()` (inside `submerge()`'s own `whileUp`
  // callback, src/data/enemies.js) only ever runs while `wizzrobe` is
  // surfaced, the same half of the cycle `wizzrobe_hurt`'s own comment
  // already established `hurtFrame` is restricted to — so `attackTime`
  // can never be counting down while the sprite is hidden and undrawn.
  wizzrobe_atk: `
    .......33.......
    ......3003......
    .....310013.....
    ...3333333333...
    ..311111111113..
    .31111111111113.
    3331133333311333
    3003300330033003
    3000300330030003
    3100333333330013
    .31003333330013.
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

  // Anglerfry attack (charge()'s tell windup, this enemy's own tell, 26f)
  // — drawn: the "Cheep-Cheep" plate `anglerfry` substitutes in (per
  // `anglerfry_death`'s own header, below) has only the two frames already
  // in `anglerfry_0`/`_1`, an idle lure-bob/chomp cycle rather than a
  // windup — checked with an attack telegraph specifically in mind, same
  // result. Rendered `anglerfry_0` in flat debug colours (not the real
  // runtime palette) before drawing, since its actual blues sit close
  // enough together to blur which pixels are body versus fang at a glance
  // — that made the fang row (row 14, the sheet's own light-on-dark zigzag
  // along the jaw) unambiguous. `anglerfry_0`'s own grid (sprites-
  // enemies.js) is reused pixel-for-pixel except that fang band: widened
  // by recolouring one black outline pixel to fang colour on each side, at
  // both row 13 and row 14 (4 pixels total), so the jaw reads as opened
  // wider than either existing idle frame shows — the lunge telegraph,
  // not the ordinary breathing cycle. Eyes, lure and fins all untouched.
  anglerfry_atk: `
    ......3333......
    .....300003.....
    ...333333003....
    ..30300333003...
    .3000000333333..
    .3030300333003..
    .3030300330003..
    .3000000300003..
    .3333003330033..
    .30003330033333.
    3000003000013003
    3033003000013003
    3000013000113003
    .110131001131003
    ..331111111..33.
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



  // Octorok attack (`shoot()`'s telegraph, ENEMY_ATTACK_FRAMES) — drawn:
  // re-checked the sheet's own "Octorok" plate with a throwing pose
  // specifically in mind (same four-frame plate `octorok_death` and
  // `octorokSea_hurt` already confirmed empty, at S24/S27, plus the one
  // nearby shell/pickup icon in a different orange palette) — nothing new
  // to extract, same result a third time. Hand-drawn, following this
  // file's own header for attack poses: silhouette-close to the idle
  // frame, not a collapse like `_death` is allowed to be. `octorok_d0`'s
  // own grid (sprites-enemies.js) is untouched everywhere except the
  // small red-and-tan mouth patch at its own row 13 (visually confirmed
  // by rendering both frames from their palette rather than reading the
  // grid blind) — the two red "lip" pixels flanking its narrow tan slit
  // are recoloured to tan, stretching the opening from 4 pixels to the
  // patch's full 8-pixel width. Same grammar `barnacle_atk`'s own comment
  // already used ("the mouth stretched to its absolute fullest right
  // before it spits"), applied here as an actual pixel edit rather than a
  // frame swap since `octorok` has no spare frame to reuse. 4 pixels
  // changed, nothing else touched — every other row identical to
  // `octorok_d0`.
  //
  // Applied as ONE non-directional pose (`attackFrame: 'octorok_atk'`,
  // `src/data/enemies.js`), the same shape `beamos_atk`/`barnacle_atk`
  // already use, not a per-facing set like `moblin_d1`/`u1`/`s1`: unlike
  // moblin, `octorok_u0` (back view) has no face at all to open a mouth
  // on, so a real per-facing set would need a second new hand-drawn pose
  // for "up" anyway, and `spriteName()`'s own fallback (`a.up || a.down`)
  // would otherwise show this same front-facing mouth on a back view if
  // "up" were left unset — worse than the one accepted inconsistency of
  // showing a front telegraph while `octorok` happens to be facing up or
  // sideways when it fires, which lasts only `ENEMY_ATTACK_FRAMES` (16f,
  // guessed) before reverting. Decided explicitly here rather than
  // defaulted to, mirroring how S24/S80 decided the `octorokSea` reuse
  // question rather than assuming it.
  octorok_atk: `
    .....333333.....
    3333311111133333
    3113111001113113
    .31311000011313.
    ..311110011113..
    ..310011110013..
    ..310300003013..
    ..310330033013..
    ..331030030133..
    .31310000001313.
    3113331111333113
    3133331001333313
    3333333333333333
    ...3000000003...
    ...3333333333...
    ................` ,








  // Urchin idle — drawn: the sheet's own "Spiny Beetle" plate has exactly
  // three poses (docs/ENEMIES.md's idle scoping section): the two spiky
  // frames already extracted as `urchin_0`/`urchin_1`, and the smooth
  // retracted dome already spent on `urchin_death`. Nothing left to
  // extract; hand-drawn, the first `idleFrame` in the roster. Piloted
  // here specifically because `urchin` is the strongest AI-shape
  // candidate `docs/ENEMIES.md` found: `ai()` (src/data/enemies.js) does
  // nothing at all while the tide is below level 1, a real
  // "dormant, harmless" state, not a mechanical pause between actions.
  // `urchin_0`'s own grid (sprites-enemies.js) is reused pixel-for-pixel
  // for rows 4-15 — the notched shell texture and the leg/base silhouette
  // that read as "this is an urchin" are both untouched. Rows 0-3 (the
  // four tallest spike-tip rows) are blanked outright rather than edited a
  // few pixels at a time, the same "silhouette may change" latitude this
  // file's header reserves for `_death` — an idle pose needs the same
  // latitude for the opposite reason: a few-pixel edit (the `hurtFrame`
  // norm) rendered too close to `urchin_0` to read as a different state at
  // actual in-game size, confirmed by rendering both from the real
  // palette side by side before committing to this version. The result
  // sits visibly lower and flatter in the cell than `urchin_0`/`_1`'s full
  // spike crown, reading as spikes lowered/relaxed rather than extended,
  // while keeping the segmented notch pattern `urchin_death`'s single
  // smooth rounded dome fills in entirely — a real middle state, not a
  // step toward either neighbour. `urchin` has no `z` field, so no
  // height-offset consideration applies. Wired as `spec.idleFrame`
  // (src/data/enemies.js, src/game/enemy.js), gated on the same
  // `g.tide.level < 1` condition `ai()` already reads.
  urchin_idle: `
    ................
    ................
    ................
    ................
    .30010300301003.
    ..300130031003..
    ..333331133333..
    ..300133331003..
    .30010301311003.
    .30003001030003.
    333333000033333.
    33322300003223..
    32300333333003..
    322333322333323.
    303332322323223.
    .3...3222233303.` ,
  // Crab hurt — drawn: the sheet's "Sand Crab" plate has exactly its two
  // scuttling frames (crab_0/crab_1). crab_0's grid unchanged except its two
  // eye stalks: both light eye pixels shut to the outline shade, 4 pixels.
  crab_hurt: `
    ................
    ..333......333..
    .30003....30003.
    300033....330003
    3000303..3030003
    3000303..3030003
    3000303..3030003
    3103013..3103013
    .31013333331013.
    ..313333333313..
    ..333333333333..
    ..331313313133..
    .30310311301303.
    3003110000113003
    3033311111133303
    3333333333333333` ,

  // Zol hurt — drawn: the "Zol & Gel" plate has only the round rest frame
  // and the tall hop frame, both already zol_0/zol_1. zol_0 unchanged except
  // its two upright eye strokes, turned into a screwed-shut ">  <" wince.
  zol_hurt: `
    ................
    ................
    ................
    ................
    ................
    .....333333.....
    ....31111113....
    ...3111001113...
    ..311100001113..
    ..311110011113..
    ..311311113113..
    ..311131131113..
    ..311311113113..
    ..331111111133..
    ...3311111133...
    ....33333333....` ,

  // Gel hurt — drawn: the Color-Changing Gel strip is one blob in three
  // colours, no recoil. gel_0 unchanged except its two eyes, squeezed from
  // upright dots into flat shut dashes. Never seen from a sword: gel has one
  // hit point, so its death pose always wins the frame — it is here so a
  // future weaker hit or tougher gel has it waiting.
  gel_hurt: `
    ................
    ................
    ................
    ................
    ....10011.......
    ...1101111......
    ...1111111......
    ...1331331......
    ...1111111......
    ....11111.......
    ................
    ................
    ................
    ................
    ................
    ................` ,

  // Keese hurt — drawn: the Keese plate has only wings-spread and
  // wings-folded (keese_0/keese_1). keese_0 with its eyes narrowed to single
  // pixels and its four wingtips pulled in — the wings jerking shut on a hit.
  // Like gel_hurt, one hit point means this does not show on a sword kill.
  keese_hurt: `
    ................
    ................
    ................
    ................
    ................
    ..33..3..3..33..
    ..33333..33333..
    .33333333333333.
    .33333033033333.
    3333330330333333
    333..333333..333
    .......33.......
    ................
    ................
    ................
    ................` ,

  // Leever hurt — drawn: the Leever plate is a sand mound, a half-risen
  // frame (leever_death) and two risen frames (leever_0/leever_1), no recoil.
  // leever_0 with the pale insides of its two side claws shut dark: the
  // claws clench on a hit. Silhouette untouched.
  leever_hurt: `
    .......33.......
    .33...3003...33.
    .333..3003..333.
    .33333333333333.
    .33333300333333.
    .33333300333333.
    .31333300333313.
    ..313330033313..
    ..333331133333..
    3313333333333133
    0313333333333130
    0331133333311330
    3333311001133333
    0033333333333300
    .00333333333300.
    ..003003300300..` ,

  // Tektite hurt — drawn: the Tektite plate is its two hop frames only.
  // tektite_0 with its one big eye shut — the pupil lidded over and a closed
  // dark line across the middle. 4 pixels.
  tektite_hurt: `
    ................
    ................
    ................
    ................
    ................
    ..33........33..
    .30033333333003.
    3010331111330103
    3130311111130313
    3031313333131303
    3131313333131313
    3031311331131303
    3133331111333313
    3033333333333303
    3113330330333113
    .333..3333..333.` ,

  // Bubble hurt — drawn: the Anti-Fairy plate is its two spinning frames,
  // nothing else. bubble_0 with the skull's eye sockets squeezed to shut
  // slits. The bubble cannot be hurt by an ordinary blow at all; this only
  // shows once the Resonance Rod has rung it and a blow lands.
  bubble_hurt: `
    ......3333......
    .00003333333000.
    .00003333330000.
    .00003333330000.
    .00033000033000.
    .33330000003333.
    3333000000003333
    3333033003303333
    3333000330003333
    3333000000003333
    .33333000033333.
    .30033033033003.
    .00003033030000.
    .00003333330000.
    .00003333333000.
    ......3333......` ,


  // Beamos hurt — drawn: the Beamos plate is eight eye positions and its
  // beam, no recoil. beamos_1 with the eye lidded over and shut to one dark
  // line. Like the bubble, it only takes a hit once the Rod has rung it.
  beamos_hurt: `
    ................
    ................
    ......3333......
    ....33333333....
    ...3333113333...
    ...3333113333...
    ...3333333333...
    ..331113333333..
    .33111113333313.
    .33333333333313.
    .33111111333313.
    .33111111333313.
    .31311113333113.
    .33133333331133.
    ..331100001133..
    ...3333333333...` ,


};

export function installEnemyHurtSprites() {
  sprites.add(ENEMY_HURT_ART, 'magic');
}
