#!/usr/bin/env python3
"""Cut the smoke puffs and the bomb blast out of Oracle of Seasons' own graphics (S165).

Regenerate with:  python3 tools/rip-effects.py

Source: assets/effects/oracles-disasm/seasons/, copied verbatim from
Stewmath's oracles-disasm (github.com/Stewmath/oracles-disasm, commit 7584d87).
Credit: the oracles-disasm project and its contributors, who took the cartridge
apart; the artwork is Nintendo's and Capcom's. Fan-work use only.

WHY THIS AND NOT A SHEET. The puff a thing vanishes in, the puff an enemy dies
in and the bomb's blast were hand-drawn (sprites-link.js, "no sheet in
assets/sheets/ has this art"). No sheet has them; the cartridge has all three,
on one graphics file every room keeps loaded (spr_common_sprites, VRAM bank 1,
gfx header GFXH_COMMON_SPRITES), and says exactly how to draw each:

  * THE PUFF is interaction $05, INTERAC_PUFF (interactionData.s: tile base,
    palette, VRAM bank), drawn by its animation 0 (interactionAnimations.s)
    through interaction05OamDataPointers (interactionOamData.s).
  * THE FALL INTO A HOLE (S185) is interaction $0f, INTERAC_FALLDOWNHOLE,
    drawn exactly as the puff is: what anything that goes over a hole is
    replaced by (code/bank0.s objectCreateFallingDownHoleInteraction).
  * THE KILL PUFF is part $02, PART_ENEMY_DESTROYED (partData.s b5 tile base,
    b6 oam flags), what every ordinary enemy turns into when it dies
    (code/bank0.s enemyDie -> @enemyCreateDeathPuff), drawn by its animation 0
    (partAnimations.s) through part02OamDataPointers (partOamData.s). Its code
    (enemyDestroyed.s) flips palette bit 0 every other frame, so each frame is
    cut twice: `fx_kill<k>` in its own palette and `fx_kill<k>b` in the other.
  * THE MOVING PLATFORM (S183) is interaction $79, INTERAC_MOVING_PLATFORM,
    at its largest (subid 5, 32x32), from spr_dungeon_sprites: the Cliffside
    Cistern's floats. Not an effect, but drawn by exactly the same machinery
    from the same tables, so it is cut here rather than by a second copy.
  * THE ICE CHUNK (S189) is interaction $68, INTERAC_D8_GRABBABLE_ICE, from
    spr_pedestal_ice in standard sprite palette 4: the Abyssal Keep's Hold.
  * THE EYEBALL (S211) is interaction $e2, INTERAC_STATUE_EYEBALL, from
    spr_polsvoice_hardhatbeetle_spikedbeetle_beamon: the Coral Spire's eye
    statues, with the pixel it moves to look (statueEyeball.s).
  * THE BLAST is ITEM_BOMB's animation 1 (itemAnimations.s, item03Animations)
    through item03OamDataPointers (itemOamData.s), with the tile base and oam
    flags itemInitializeBombExplosion (bombs.s) loads when the fuse ends.

How long each frame is held is timing, so it is in src/data/feel.js
(PUFF_HOLDS, KILL_PUFF_HOLDS, EXPLOSION_HOLDS), read from the same tables; this
file emits only the pictures, in the order those holds walk them.

A hardware sprite is 8x16 (8x16 OBJ mode: even tile numbers). Placed as
code/bank0.s @drawObject places it: screen y = object y + oam y - 16, screen
x = object x + oam x - 8, mirrored by oam flag bits 5 and 6, coloured by
(object oam flags XOR oam flags) & 7. Every frame is cut into a 32x32 cell
with the object's position at (16, 16), so the engine draws one at
(centre - 16, centre - 16) and nothing moves.

Colours are the cartridge's standard sprite palettes (paletteData.s,
standardSpritePaletteData), RGB555 scaled to 8 bits the way the GBC does.
"""
import os
import re

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'effects', 'oracles-disasm', 'seasons')
OUT = os.path.join(ROOT, 'src', 'data', 'sprites-effects.js')
SHEET = 'spr_common_sprites.png'
CELL = 32


def lines(name):
    with open(os.path.join(SRC, name)) as f:
        return [l.split(';')[0].rstrip() for l in f.read().split('\n')]


def after(ls, label):
    k = next(i for i, l in enumerate(ls) if re.match(r'^' + label + r':', l))
    return ls[k + 1:]


def dbs(line):
    return [int(x[1:], 16) for x in line.strip()[3:].split()]


def dws(ls, label):
    """The .dw labels that follow `label`, skipping labels that share the list."""
    out = []
    for l in after(ls, label):
        s = l.strip()
        if s.startswith('.dw'):
            out.append(s[3:].strip())
        elif re.match(r'^\w+:', s) and not out:
            continue
        else:
            break
    return out


def sequence(ls, label):
    """[(hold, oam index)] of an animation, up to the frame that ends it."""
    out = []
    for l in after(ls, label):
        s = l.strip()
        if not s.startswith('.db'):
            break
        hold, frame, param = dbs(s)
        if hold == 0xff or param == 0xff:
            break
        out.append((hold, frame // 2))
    return out


def oam(ls, label):
    body = [l for l in after(ls, label) if l.strip()]
    n = dbs(body[0])[0]
    return [dbs(body[1 + i]) for i in range(n)]


def palette(index):
    ls = lines('paletteData.s')
    start = ls.index('standardSpritePaletteData:') + 1
    cols = []
    for l in ls[start:]:
        m = re.search(r'm_RGB16 \$(\w+) \$(\w+) \$(\w+)', l)
        if m:
            cols.append(tuple(int(m.group(k), 16) for k in (1, 2, 3)))
        if len(cols) == (index + 1) * 4:
            return [tuple((c << 3) | (c >> 2) for c in rgb) for rgb in cols[index * 4:]]


def render(base, flags, entries, sheet=SHEET, cell=CELL):
    """One cell x cell frame (32x32 unless the picture needs more): rows of palette indices, and the palette it is drawn in."""
    im = Image.open(os.path.join(SRC, sheet))
    assert im.mode == 'P', f'{sheet} is not indexed'
    per_row = im.size[0] // 8
    grid = [[0] * cell for _ in range(cell)]
    pals = set()
    # The earlier hardware sprite is drawn in front, as on the CGB: paint in
    # reverse so the first entry lands last.
    for y, x, t, f in reversed(entries):
        f ^= flags
        pals.add(f & 7)
        spr = ((base + t) & 0xff) // 2
        col, row = spr % per_row, spr // per_row
        top = (y - 16 + cell // 2) & 0xff
        left = (x - 8 + cell // 2) & 0xff
        for yy in range(16):
            for xx in range(8):
                sx = 7 - xx if f & 0x20 else xx
                sy = 15 - yy if f & 0x40 else yy
                v = im.getpixel((col * 8 + sx, row * 16 + sy))
                if v:
                    py, px = top + yy, left + xx
                    assert 0 <= py < cell and 0 <= px < cell, 'frame outside its %dx%d cell' % (cell, cell)
                    grid[py][px] = v
    assert len(pals) == 1, 'a frame in more than one palette'
    return grid, pals.pop()


def ink(grid, pal):
    """Art rows and a four-colour ramp, by brightness: 0 lightest, 3 darkest."""
    used = {v for r in grid for v in r if v}
    cols = palette(pal)
    lum = {v: 3 * cols[v][0] + 6 * cols[v][1] + cols[v][2] for v in used}
    order = sorted(used, key=lambda v: -lum[v])
    if len(order) == 3:
        digit = {order[0]: '0', order[1]: '1', order[2]: '3'}
    elif len(order) == 2:
        digit = {order[0]: '0', order[1]: '3'}
    else:
        digit = {order[0]: '3'}
    inks = {d: '#%02x%02x%02x' % cols[v] for v, d in digit.items()}
    mid = inks.get('1', inks.get('0', '#000000'))
    ramp = [inks.get('0', mid), mid, mid, inks['3']]
    return [''.join(digit[v] if v else '.' for v in r) for r in grid], ramp


def interaction(iid, k=0):
    """An interaction on the common sprites, its animation k (0 unless named): (base, flags, [(hold, entries)])."""
    for l in lines('interactionData.s'):
        m = re.search(r'/\* \$%02x \*/ m_InteractionData \$(\w+) \$(\w+) \$(\w+)' % iid, l)
        if m:
            b1, b2 = int(m.group(2), 16), int(m.group(3), 16)
            break
    # b2: bits 4-6 palette, bit 7 VRAM bank (the common sprites are bank 1).
    assert b2 & 0x80, 'interaction $%02x is not on the bank-1 common sprites' % iid
    anim = dws(lines('interactionAnimations.s'), 'interaction%02xAnimations' % iid)[k]
    ptrs = dws(lines('interactionAnimations.s'), 'interaction%02xOamDataPointers' % iid)
    seq = sequence(lines('interactionAnimations.s'), anim)
    io = lines('interactionOamData.s')
    return b1 & 0x7f, (b2 >> 4) & 7, [(h, oam(io, ptrs[k])) for h, k in seq]


def puff():
    """INTERAC_PUFF."""
    return interaction(0x05)


def hole():
    """INTERAC_FALLDOWNHOLE (S185): what a pot, a block, an enemy or a drop
    becomes when it goes over a hole (objectReplaceWithAnimationIfOnHazard,
    ecom_fallDownHoleAndDelete, itemDrop_checkOnHazard). Its animation 0 is
    three pictures and an $ff frame that deletes it (fallDownHole.s @state1)."""
    return interaction(0x0f)


def dust():
    """INTERAC_FALLDOWNHOLE subid 1 (S218), its animation 1: the little puff
    Seasons kicks up behind a thing going fast — Link on Pegasus seeds
    (transformedLink.s), an enemy knocked back hard (enemies/commonCode.s),
    Aquamentus charging (aquamentus.s). fallDownHole.s @state0 adds the subid
    to the state and sets the animation from it; @state2 blinks it every frame
    (the engine's `blink`). Link landing from a jump makes NO dust in Seasons
    (link.s plays SND_LAND and nothing else), so this is not a landing."""
    return interaction(0x0f, 1)


def twinkle(pal):
    """INTERAC_SPARKLE (S218), the twinkle that grows from a dot into a cross,
    turns into an X and breaks into four (sparkle.s; subids 1, 2, 3 and 5:
    the Rod of Seasons, the Maku Tree's leaves and confetti, the owl statue).
    Its subid data is gfx header $50 (spr_triforce_sparkle, objectGfxHeaders.s),
    tile base $0a and animation 1 through interaction84OamDataPointers, in
    VRAM bank 0. Subid 1 draws it in standard sprite palette 2 (red) and 5 in
    palette 0 (green); `pal` picks one. The game draws it in palette 3, orange,
    where ours was gold (the human's choice, S218), and 2 where it was coral."""
    ls = lines('interactionData.s')
    rows = [dbs(l.replace('m_InteractionSubidData', '.db')) for l in after(ls, 'interaction84SubidData')
            if l.strip().startswith('m_InteractionSubidData') and 'End' not in l]
    gfx, b1, b2 = rows[1]
    assert gfx == 0x50, 'the sparkle is not on spr_triforce_sparkle'
    assert not b2 & 0x80, 'the sparkle is not in VRAM bank 0'
    ia = lines('interactionAnimations.s')
    anim = dws(ia, 'interaction84Animations')[b2 & 0x0f]
    ptrs = dws(ia, 'interaction84OamDataPointers')
    seq = sequence(ia, anim)
    io = lines('interactionOamData.s')
    return b1 & 0x7f, pal, [(h, oam(io, ptrs[k])) for h, k in seq]


def bubble():
    """INTERAC_BUBBLE $91 (S219): the bubble a swimmer under the water lets go
    of (link.s, Ages' underwater swimming: one every 50-81 frames) that drifts
    up wobbling and flickers out (bubble.s). interactionData $91 is tile base
    $16 and $90 — palette 1, the bank-1 common sprites — one picture held $7f
    and looped. Seasons carries the same entry; only Ages swims under."""
    return interaction(0x91)


def ember():
    """ITEM_EMBER_SEED burning (S219): what an ember seed turns into where it
    lands (seeds.s @loadGfxVarsWithIndex: its first @data row is the oam
    flags, $0a — palette 2, VRAM bank 1 — and the tile base, $06), drawn by
    item20's animation 0 through item20OamDataPointers. The animation's first
    two frames are the seed itself; the fire is its loop, which is all this
    cuts."""
    ls = after(lines('seeds.s'), '@data')
    flags, base = next(dbs(l.split('SND_')[0]) for l in ls if l.strip().startswith('.db'))[:2]
    ia = lines('itemAnimations.s')
    anim = dws(ia, 'item20Animations')[0]
    ptrs = dws(ia, 'item20OamDataPointers')
    seq = sequence(ia, anim + 'Loop')
    io = lines('itemOamData.s')
    return base, flags, [(h, oam(io, ptrs[k])) for h, k in seq]


def terrain(hold, *labels):
    """Seasons' terrain effects (S219, data/terrainEffects.s), drawn under or
    over an object by code/bank0.s _drawObjectTerrainEffects: the shadow of
    anything in the air (every other frame), and the little splash at the feet
    of anything standing in shallow water (puddleAnimationFrames, one picture
    every 8 frames of the global counter). Raw oam on the common sprites, no
    tile base: (y, x, tile, flags) from the object's position. `hold` is only
    for the listing: the code, not the data, times these."""
    ls = lines('terrainEffects.s')
    out = []
    for lab in labels:
        body = [l for l in after(ls, lab) if l.strip()]
        n = dbs(body[0])[0]
        out.append((hold, [dbs(body[1 + i]) for i in range(n)]))
    return 0, 0, out


def debris(iid):
    """One of Seasons' little break animations (S217), all run by the same
    code (breakTileDebris.s, interactionCode00-0c: play animation 0, delete on
    its $ff frame): INTERAC_GRASSDEBRIS $00, the leaves a cut bush or tuft
    throws (breakableTileModes' interaction nibble 0; its palette is
    wGrassAnimationModifier | 8, and green, the only grass this game has, is
    modifier 0, so the data's own palette 0); INTERAC_SPLASH $03; INTERAC_ROCKDEBRIS
    $06, what a pot or a rock breaks into (the same table's nibble 6, and what
    a thrown pot lands as, itemMakeInteractionForBreakableTile); and
    INTERAC_CLINK $07, the spark of a blade on something it cannot cut
    (objectCreateClinkInteraction)."""
    assert iid in (0x00, 0x03, 0x06, 0x07)
    return interaction(iid)


def kill():
    """PART_ENEMY_DESTROYED: (base, flags, [(hold, entries)])."""
    rows = [dbs(l) for l in after(lines('partData.s'), 'partData') if l.strip().startswith('.db')]
    row = rows[0x02]
    anim = dws(lines('partAnimations.s'), 'part02Animations')[0]
    ptrs = dws(lines('partAnimations.s'), 'part02OamDataPointers')
    seq = sequence(lines('partAnimations.s'), anim)
    po = lines('partOamData.s')
    return row[5], row[6], [(h, oam(po, ptrs[k])) for h, k in seq]


def blast():
    """ITEM_BOMB exploding: (base, flags, [(hold, entries)])."""
    ls = after(lines('bombs.s'), 'itemInitializeBombExplosion')
    body = '\n'.join(ls[:20])
    flags = int(re.search(r'Item\.oamFlagsBackup\s+ld a,\$(\w+)', body).group(1), 16)
    base = int(re.search(r'ld \(hl\),\$(\w+)', body).group(1), 16)
    anim = dws(lines('itemAnimations.s'), 'item03Animations')[1]
    ptrs = dws(lines('itemAnimations.s'), 'item03OamDataPointers')
    seq = sequence(lines('itemAnimations.s'), anim)
    io = lines('itemOamData.s')
    return base, flags, [(h, oam(io, ptrs[k])) for h, k in seq]


def platform():
    """INTERAC_MOVING_PLATFORM, its largest size: (base, flags, [(hold, entries)]).

    interaction79SubidData's entries are gfx header $57 (spr_dungeon_sprites),
    a tile base, and a byte whose high nibble is the palette and low nibble the
    animation (code/loadGraphics.s interactionLoadGraphics). Subid 5 is the
    32x32 platform (movingPlatform.s @collisionRadii $10 $10), drawn by its
    animation 5 through interaction79OamDataPointers.
    """
    ls = lines('interactionData.s')
    rows = [dbs(l.replace('m_InteractionSubidData', '.db')) for l in after(ls, 'interaction79SubidData')
            if l.strip().startswith('m_InteractionSubidData') and 'End' not in l]
    gfx, b1, b2 = rows[5]
    assert gfx == 0x57, 'the platform is not on spr_dungeon_sprites'
    ia = lines('interactionAnimations.s')
    anim = dws(ia, 'interaction79Animations')[b2 & 0x0f]
    ptrs = dws(ia, 'interaction79OamDataPointers')
    seq = sequence(ia, anim)
    io = lines('interactionOamData.s')
    return b1 & 0x7f, (b2 >> 4) & 7, [(h, oam(io, ptrs[k])) for h, k in seq]


def chunk():
    """INTERAC_D8_GRABBABLE_ICE (S189): the Sword & Shield Maze's chunk of ice,
    the thing Link lifts off the ice floor (swordShieldMazeGrabbableIce.s).
    interactionData $68 is gfx header $5b (spr_pedestal_ice, objectGfxHeaders.s),
    tile base $0a and flags $40 — palette 4 of the STANDARD sprite palettes,
    VRAM bank 0 — drawn by its animation 0 (one picture, held $7f and looped)
    through interaction68OamDataPointers."""
    for l in lines('interactionData.s'):
        m = re.search(r'/\* \$68 \*/ m_InteractionData \$(\w+) \$(\w+) \$(\w+)', l)
        if m:
            gfx, b1, b2 = (int(m.group(k), 16) for k in (1, 2, 3))
            break
    assert gfx == 0x5b, 'the ice chunk is not on spr_pedestal_ice'
    assert not b2 & 0x80, 'the ice chunk is not in VRAM bank 0'
    ia = lines('interactionAnimations.s')
    anim = dws(ia, 'interaction68Animations')[0]
    ptrs = dws(ia, 'interaction68OamDataPointers')
    seq = sequence(ia, anim)
    io = lines('interactionOamData.s')
    return b1 & 0x7f, (b2 >> 4) & 7, [(h, oam(io, ptrs[k])) for h, k in seq]


def eyeball():
    """INTERAC_STATUE_EYEBALL (S211): the eye on Seasons' eye statue
    (statueEyeball.s). interactionData $e2 is gfx header $72
    (spr_polsvoice_hardhatbeetle_spikedbeetle_beamon, objectGfxHeaders.s), tile
    base $1e, and $04 — standard sprite palette 0, VRAM bank 0, animation 4.
    The eye puzzle's eyes (subid 4) never change animation: they look by
    moving the object a pixel within its tile (@lowPositionValues, emitted as
    EYEBALL_LOOK), so this is one picture."""
    for l in lines('interactionData.s'):
        m = re.search(r'/\* \$e2 \*/ m_InteractionData \$(\w+) \$(\w+) \$(\w+)', l)
        if m:
            gfx, b1, b2 = (int(m.group(k), 16) for k in (1, 2, 3))
            break
    assert gfx == 0x72, 'the eyeball is not on spr_polsvoice_hardhatbeetle_spikedbeetle_beamon'
    assert not b2 & 0x80, 'the eyeball is not in VRAM bank 0'
    ia = lines('interactionAnimations.s')
    anim = dws(ia, 'interactione2Animations')[b2 & 0x0f]
    ptrs = dws(ia, 'interactione2OamDataPointers')
    seq = sequence(ia, anim)
    io = lines('interactionOamData.s')
    return b1 & 0x7f, (b2 >> 4) & 7, [(h, oam(io, ptrs[k])) for h, k in seq]


def eyeball_look():
    """@lowPositionValues: the low nibbles of the eye's y and x for each of the
    eight directions it can face (0 up, then clockwise), within its tile."""
    ls = lines('statueEyeball.s')
    i = next(k for k, l in enumerate(ls) if l.startswith('@lowPositionValues:'))
    rows = [dbs(l) for l in ls[i + 1:] if l.strip().startswith('.db')][:8]
    assert len(rows) == 8 and all(len(r) == 2 for r in rows)
    return rows


def build():
    art, pals, notes = {}, {}, []

    def cut(prefix, src, alt=False, sheet=SHEET, cell=CELL):
        base, flags, seq = src
        names, seen = [], {}
        for hold, entries in seq:
            key = repr(entries)
            if key not in seen:
                seen[key] = len(seen)
                k = seen[key]
                grid, pal = render(base, flags, entries, sheet, cell)
                for suffix, p in [('', pal)] + ([('b', pal ^ 1)] if alt else []):
                    name = f'{prefix}{k}{suffix}'
                    rows, ramp = ink(grid, p)
                    art[name] = rows
                    pals[name] = ramp
            names.append(f'{prefix}{seen[key]}')
        notes.append(f'//   {prefix}*: frames {" ".join(n[len(prefix):] for n in names)}'
                     f' (held {" ".join(str(h) for h, _ in seq)}), tile base ${base:02x}')
        return names

    cut('fx_puff', puff())
    cut('fx_hole', hole())
    cut('fx_kill', kill(), alt=True)
    cut('fx_boom', blast())
    cut('fx_leaves', debris(0x00), cell=48)
    cut('fx_wet', debris(0x03))
    cut('fx_shards', debris(0x06))
    cut('fx_clink', debris(0x07))
    cut('fx_dust', dust())
    cut('fx_twinkle', twinkle(3), sheet='spr_triforce_sparkle.png')
    cut('fx_twinkleR', twinkle(2), sheet='spr_triforce_sparkle.png')
    cut('fx_shadow', terrain(1, 'shadowAnimation'))
    cut('fx_puddle', terrain(8, *('puddleAnimationFrame%d' % k for k in range(4))))
    cut('fx_bubble', bubble())
    cut('fx_ember', ember())
    cut('o_float', platform(), sheet='spr_dungeon_sprites.png')
    cut('o_icechunk', chunk(), sheet='spr_pedestal_ice.png')
    cut('o_eyeball', eyeball(), sheet='spr_polsvoice_hardhatbeetle_spikedbeetle_beamon.png')
    return art, pals, notes


HEADER = '''// The smoke puffs, the fall into a hole, the bomb blast, the leaves, splash,
// shards and clink, the moving platform and the ice chunk, cut from Oracle of
// Seasons' own graphics; since S218 the dust and the twinkle; since S219 the
// shadow, the splash at the feet, the bubble and the ember's fire.
//
// Generated by tools/rip-effects.py — edit that, not this file.
// Source: Stewmath's oracles-disasm (github.com/Stewmath/oracles-disasm,
// commit 7584d87), assets/effects/oracles-disasm/seasons/: the common sprite
// graphics every room keeps loaded, spr_dungeon_sprites (the platform, from
// commit 21c924a; the tables are identical there) and spr_pedestal_ice (the
// ice chunk, the same commit), the tables that lay out
// INTERAC_PUFF, INTERAC_FALLDOWNHOLE, INTERAC_MOVING_PLATFORM,
// INTERAC_D8_GRABBABLE_ICE, INTERAC_STATUE_EYEBALL (S211, with statueEyeball.s),
// INTERAC_GRASSDEBRIS, INTERAC_SPLASH, INTERAC_ROCKDEBRIS and INTERAC_CLINK (S217),
// INTERAC_FALLDOWNHOLE's dust and INTERAC_SPARKLE (S218, the sparkle from
// spr_triforce_sparkle, commit 7584d87), the shadow and the splash at the feet
// (terrainEffects.s), INTERAC_BUBBLE and the burning ember seed (S219),
// PART_ENEMY_DESTROYED and the exploding ITEM_BOMB, and the standard sprite
// palettes. Credit: the oracles-disasm project and its contributors; the
// artwork is Nintendo's and Capcom's. This is fan-work art only.
//
// Every frame is 32x32 with the object's position at (16, 16) — the leaves'
// are 48x48 with it at (24, 24), as they fly further — and carries
// its own colours: draw sites must NOT pass a palette. How long each is held
// is in src/data/feel.js (PUFF_HOLDS, HOLE_FALL_HOLDS, KILL_PUFF_HOLDS,
// EXPLOSION_HOLDS, LEAVES_HOLDS, SPLASH_HOLDS, SHARDS_HOLDS, CLINK_HOLDS,
// DUST_HOLDS, TWINKLE_HOLDS, PUDDLE_HOLD, EMBER_HOLDS); the
// frame order those holds walk is listed here.
//'''


def emit(art, pals, notes):
    out = HEADER.split('\n') + ['// Built from:'] + notes + [
        '', "import { sprites } from '../gfx/art.js';",
        "import { registerPalettes } from '../gfx/palettes.js';", '',
        'export const EFFECT_ART = {']
    for name in art:
        out.append('  // extracted — pulled straight off the source graphics named '
                   'in this file\'s own header, by this ripper.')
        out.append(f"  {name}: {{ pal: '{name}', art: `")
        for r in art[name]:
            out.append('    ' + r)
        out[-1] += '` },'
    out.append('};')
    out.append('')
    out.append('const EFFECT_PALETTES = {')
    for name in pals:
        out.append(f"  {name}: [{', '.join(repr(c) for c in pals[name])}],")
    out.append('};')
    look = eyeball_look()
    out += ['', '// The eye statue\'s eye (S211), statueEyeball.s @lowPositionValues: for each',
            '// of the eight ways it can face (0 up, then clockwise), the low nibbles of',
            '// its y and x within its tile. The eye puzzle looks with these alone.',
            'export const EYEBALL_LOOK = [' + ', '.join(f'[{y}, {x}]' for y, x in look) + '];']
    out += ['', 'export function installEffectSprites() {',
            '  registerPalettes(EFFECT_PALETTES);',
            "  sprites.add(EFFECT_ART, 'ui');", '}', '']
    with open(OUT, 'w') as f:
        f.write('\n'.join(out))


if __name__ == '__main__':
    a, p, n = build()
    emit(a, p, n)
    print('rip-effects: wrote', len(a), 'sprites ->', os.path.relpath(OUT, ROOT))
    for line in n:
        print(line[4:])
