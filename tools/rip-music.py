#!/usr/bin/env python3
"""Rip Oracle of Seasons' own music data into src/data/music-seasons.js (S151).

Source: assets/music/oracles-disasm/, copied verbatim from Stewmath's
oracles-disasm (github.com/Stewmath/oracles-disasm, commit 7584d87): the
channel scripts of the tracks this game plays (mus/*.s), the item-get
jingle (sfx/getItem.s), the spin attack (sfx/swordSpin.s), the wave channel's waveforms, the noise channel's
drum table, and the sound engine's frequency, envelope and vibrato tables
(audio-tables.s, from code/audio.s). Credit: the oracles-disasm project and
its contributors, who took these apart; the music is Nintendo's.

WHAT COMES OUT. Not a transcription: the cartridge's own command streams,
one flat list of events per track, which src/core/gbsound.js plays the way
code/audio.s does — one command step per frame, notes held for their frame
counts, square volume and envelopes as the engine writes them to the
hardware, vibrato from vibratoOffsetTable, the wave channel's 32-step
waveforms and the noise channel's NR42/NR43 pairs.

Event encoding (each a small array; `i` is an index into the same list):
  [0, note, frames]   play a note (a noise index on the noise channel)
  [1, frames]         rest
  [2, vol]            vol $X
  [3, start, end]     env start end
  [4, duty]           duty (a waveform index on the wave channel)
  [5, vib]            vibrato $XY
  [6, i]              goto
  [7]                 cmdff: the channel stops
  [8, sweep]          cmdf8
  [9, shift]          cmdfd (pitch shift)
  [10, x]             cmdf0 (channel 7: NR42 straight from the stream)

Deterministic: `python3 tools/rip-music.py` re-emits byte-identically, and
tools/check-rippers.mjs proves it. Never hand-edit the output.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'music', 'oracles-disasm')
OUT = os.path.join(ROOT, 'src', 'data', 'music-seasons.js')

# Our name -> (file, the label prefix its channels carry). Title, file
# select and overworld are the tracks the human asked for (S151); the two
# intro pieces are the Seasons opening, kept so the "Main Menu" recording
# can be matched against both.
TRACKS = [
    ('titlescreen', 'mus/titlescreen.s', 'musTitlescreen'),
    ('fileSelect', 'mus/fileSelect.s', 'musFileSelect'),
    ('overworld', 'mus/overworld.s', 'musOverworld'),
    ('intro1', 'mus/intro1.s', 'musIntro1'),
    ('intro2', 'mus/intro2.s', 'musIntro2'),
    ('getItem', 'sfx/getItem.s', 'sndGetItem'),
    # The spin attack's whoosh (S153): the noise channel alone, swept up and
    # back down over 32 frames. Played as a sound effect, not a jingle.
    ('swordSpin', 'sfx/swordSpin.s', 'sndSwordSpin'),
    # The Essence fanfare and the Game Over theme (S163, "everything to
    # cartridge" at the human's word).
    ('getEssence', 'mus/getEssence.s', 'musGetEssence'),
    ('gameover', 'mus/gameover.s', 'musGameover'),
]

# THE SOUND EFFECTS (S163): every effect the game plays that one of the two
# cartridges also plays, under the cartridge's own name. Each is a file in
# sfx/ (audio/common/sfx, both games), sfx-seasons/ or sfx-ages/; the label
# prefix is read from the file's own `...Start:` label. The ROM picks which
# side of an `.ifdef ROM_SEASONS` / `ROM_AGES` is built.
SFX = [
    # file stem, ROM
    ('swordSlash', 'ROM_SEASONS'), ('unknown5', 'ROM_SEASONS'), ('boomerang', 'ROM_SEASONS'),
    ('chargeSword', 'ROM_SEASONS'), ('damageLink', 'ROM_SEASONS'), ('jump', 'ROM_SEASONS'),
    ('land', 'ROM_SEASONS'), ('splash', 'ROM_SEASONS'), ('linkSwim', 'ROM_SEASONS'),
    ('pickUp', 'ROM_SEASONS'), ('throw', 'ROM_SEASONS'), ('breakRock', 'ROM_SEASONS'),
    ('linkFall', 'ROM_SEASONS'), ('explosion', 'ROM_SEASONS'), ('lightTorch', 'ROM_SEASONS'),
    ('damageEnemy', 'ROM_SEASONS'), ('killEnemy', 'ROM_SEASONS'), ('bossDamage', 'ROM_SEASONS'),
    ('bossDead', 'ROM_SEASONS'), ('beam', 'ROM_SEASONS'), ('clink', 'ROM_SEASONS'),
    ('enemyJump', 'ROM_SEASONS'), ('rupee', 'ROM_SEASONS'), ('gainHeart', 'ROM_SEASONS'),
    ('unknown7', 'ROM_SEASONS'), ('getSeed', 'ROM_SEASONS'), ('openChest', 'ROM_SEASONS'),
    ('solvePuzzle', 'ROM_SEASONS'), ('switch', 'ROM_SEASONS'), ('moveBlock', 'ROM_SEASONS'),
    ('cutGrass', 'ROM_SEASONS'), ('enterCave', 'ROM_SEASONS'), ('text', 'ROM_SEASONS'),
    ('text2', 'ROM_SEASONS'), ('menuMove', 'ROM_SEASONS'), ('selectItem', 'ROM_SEASONS'),
    ('error', 'ROM_SEASONS'), ('openMenu', 'ROM_SEASONS'), ('heartBeep', 'ROM_SEASONS'),
    ('bombLand', 'ROM_SEASONS'), ('rumble', 'ROM_SEASONS'),
]

NOTES = ['c', 'cs', 'd', 'ds', 'e', 'f', 'fs', 'g', 'gs', 'a', 'as', 'b']


def num(tok):
    tok = tok.strip().rstrip(',')
    if tok.startswith('$'):
        return int(tok[1:], 16)
    if tok.startswith('-'):
        return -num(tok[1:])
    return int(tok)


def note_value(tok):
    m = re.fullmatch(r'([a-g]s?)(\d)', tok)
    if m:
        return (int(m.group(2)) - 1) * 12 + NOTES.index(m.group(1))
    return num(tok)


def lines_of(path):
    with open(path) as f:
        for raw in f:
            yield raw.split(';', 1)[0].strip()


def parse_track(path, prefix, rom='ROM_SEASONS'):
    """Assemble a channel-script file to the cartridge's bytes, then read the
    bytes back the way code/audio.s reads them (S163).

    Two passes because the meaning of a byte depends on the channel's state,
    not on how the disassembly happened to spell it: after `cmdf0` on a square
    or wave channel the engine reads every note as a raw frequency (high byte,
    low byte, length), which the disassembly writes as `.db`; on channel 7 a
    note is a value for the noise register itself. Returns (events, starts)."""
    # Expand .rept/.endr first, keeping labels in place.
    src = list(lines_of(path))
    out = []

    def expand(i, depth_out):
        while i < len(src):
            ln = src[i]
            if ln.startswith('.rept'):
                count = num(ln.split()[1])
                body = []
                i = expand(i + 1, body)
                for _ in range(count):
                    depth_out.extend(body)
                continue
            if ln == '.endr':
                return i + 1
            depth_out.append(ln)
            i += 1
        return i
    expand(0, out)

    # Conditionals: the cartridge named by `rom`, built as it shipped.
    lines, stack = [], []
    for ln in out:
        if ln.startswith('.ifdef'):
            stack.append(ln.split()[1] in (rom, 'BUILD_VANILLA'))
            continue
        if ln == '.else':
            stack[-1] = not stack[-1]
            continue
        if ln == '.endif':
            stack.pop()
            continue
        if all(stack):
            lines.append(ln)

    # Pass 1: assemble (include/musicMacros.s). A goto's target stays a name.
    code, labels = [], {}
    for ln in lines:
        if not ln or ln.startswith('.define'):
            # `.define ...Channel6 MUSIC_CHANNEL_FALLBACK`: no such channel.
            continue
        if ln.endswith(':'):
            labels[ln[:-1]] = len(code)
            continue
        parts = ln.replace(',', ' ').split()
        op, args = parts[0], parts[1:]
        if op == '.db':
            code += [num(t) & 0xff for t in args]
        elif op == 'note':
            if len(args) != 2:
                sys.exit('%s: multi-note line not supported: %s' % (path, ln))
            code += [note_value(args[0]) & 0xff, num(args[1])]
        elif op == 'rest':
            code += [0x60, num(args[0])]
        elif op == 'vol':
            code += [0xd0 | num(args[0])]
        elif op == 'env':
            code += [0xe0 | num(args[0]), num(args[1])]
        elif op in ('cmdf0', 'duty', 'cmdf8', 'vibrato', 'cmdfd'):
            code += [{'cmdf0': 0xf0, 'duty': 0xf6, 'cmdf8': 0xf8,
                      'vibrato': 0xf9, 'cmdfd': 0xfd}[op], num(args[0]) & 0xff]
        elif op == 'goto':
            code += [0xfe, ('label', args[0])]
        elif op in ('cmdf1', 'cmdf2', 'cmdf3', 'cmdff'):
            code += [{'cmdf1': 0xf1, 'cmdf2': 0xf2, 'cmdf3': 0xf3, 'cmdff': 0xff}[op]]
        else:
            sys.exit('%s: unknown command: %s' % (path, ln))

    # Which channel owns each byte: the last `...ChannelN:` label before it.
    owner = {}
    for name, at in labels.items():
        m = re.fullmatch(re.escape(prefix) + r'Channel(\d)', name)
        if m:
            owner.setdefault(at, int(m.group(1)))

    # Pass 2: read the bytes as doNextChannelCommand does. `arb` is the
    # channel's arbitrary-frequency mode (channelCmdf0), reset at each
    # channel's own start.
    events, at_event, gotos = [], {}, []
    i, ch, arb = 0, None, False
    while i < len(code):
        if i in owner:
            ch, arb = owner[i], False
        at_event[i] = len(events)
        b = code[i]
        if isinstance(b, tuple):
            sys.exit('%s: a goto target read as a command' % path)
        if ch is None:
            # Bytes before any channel of this sound: nothing plays them.
            i += 1
            continue
        if b >= 0xf0:
            if b == 0xfe:
                gotos.append(len(events))
                events.append([6, code[i + 1][1]])
                i += 2
            elif b in (0xff, 0xfc, 0xfb, 0xfa, 0xf7, 0xf5, 0xf4):
                events.append([7])
                i += 1
            elif b in (0xf1, 0xf2, 0xf3):
                i += 1          # "does nothing" (code/audio.s)
            elif b == 0xf0:
                if ch == 7:
                    events.append([10, code[i + 1]])
                elif ch <= 5:
                    events.append([11, code[i + 1]])
                    arb = True
                i += 2
            else:
                x = code[i + 1]
                if ch < 6 or b == 0xf6:
                    events.append([{0xf6: 4, 0xf8: 8, 0xf9: 5, 0xfd: 9}[b], x])
                i += 2
        elif b >= 0xe0:
            events.append([3, b & 7, code[i + 1] & 7])
            i += 2
        elif b >= 0xd0:
            events.append([2, b & 15])
            i += 1
        elif ch == 7:
            events.append([0, b, code[i + 1]])
            i += 2
        elif ch <= 5 and arb:
            events.append([12, (b << 8) | code[i + 1], code[i + 2]])
            i += 3
        elif b == 0x60:
            events.append([1, code[i + 1]])
            i += 2
        elif b == 0x61 and ch <= 3:
            events.append([13, code[i + 1]])
            i += 2
        else:
            events.append([0, b, code[i + 1]])
            i += 2
    for k in gotos:
        name = events[k][1]
        if name not in labels:
            sys.exit('%s: goto to unknown label %s' % (path, name))
        events[k][1] = at_event[labels[name]]
    starts = {}
    for k in range(8):
        name = '%sChannel%d' % (prefix, k)
        if name in labels:
            starts[k] = at_event.get(labels[name], len(events))
    return events, starts


def parse_priorities(rom):
    """soundChannelPointers.s: each sound's channels, each with the priority
    playSound compares (the entry byte's high nibble, plus one). A sound takes
    a channel only from one of equal or lower priority."""
    path = os.path.join(SRC, 'soundChannelPointers-%s.s' % ('ages' if rom == 'ROM_AGES' else 'seasons'))
    out, cur, pend = {}, [], None
    for ln in lines_of(path):
        if ln.endswith(':'):
            if not cur or out.get(cur[-1]):
                cur = []
            cur.append(ln[:-1])
            out[ln[:-1]] = {}
            continue
        if ln.startswith('.db') and cur:
            b = num(ln.split()[1])
            if b == 0xff:
                cur = []
                continue
            pend = b
        elif ln.startswith('.dw') and cur and pend is not None:
            for name in cur:
                out[name][pend & 15] = (pend >> 4) + 1
            pend = None
    return out


def parse_tables():
    words = {}
    cur = None
    for ln in lines_of(os.path.join(SRC, 'audio-tables.s')):
        if ln.endswith(':'):
            cur = ln[:-1]
            words[cur] = []
            continue
        if cur and (ln.startswith('.dw') or ln.startswith('.db')):
            words[cur] += [num(t) for t in ln[3:].replace(',', ' ').split()]
    return words['soundFrequencyTable'], words['envelopeWaitTable'], words['vibratoOffsetTable']


def parse_waveforms():
    forms, cur = {}, None
    for ln in lines_of(os.path.join(SRC, 'waveforms.s')):
        m = re.match(r'm_waveform \$([0-9a-f]+)', ln)
        if m:
            cur = int(m.group(1), 16)
            continue
        if ln.startswith('@'):
            cur = None
            continue
        if cur is not None and ln.startswith('.db'):
            forms[cur] = [num(t) for t in ln[3:].split()]
            cur = None
    return forms


def parse_noise():
    table = {}
    for ln in lines_of(os.path.join(SRC, 'noise.s')):
        if ln.startswith('.db'):
            b = [num(t) for t in ln[3:].split()]
            if len(b) == 3:
                table[b[0]] = [b[1], b[2]]
    return table


def js(v):
    if isinstance(v, list):
        return '[' + ','.join(js(x) for x in v) + ']'
    return str(v)


def main():
    freq, envwait, vib = parse_tables()
    waves = parse_waveforms()
    noise = parse_noise()
    tracks = []
    used_waves, used_noise = set(), set()
    jobs = [(name, rel, prefix, 'ROM_SEASONS') for name, rel, prefix in TRACKS]
    for stem, rom in SFX:
        rel = None
        for d in ('sfx', 'sfx-seasons', 'sfx-ages'):
            if os.path.exists(os.path.join(SRC, d, stem + '.s')):
                rel = '%s/%s.s' % (d, stem)
                break
        if rel is None:
            sys.exit('sfx %s: no such file' % stem)
        start = next(ln[:-1] for ln in lines_of(os.path.join(SRC, rel)) if ln.endswith('Start:'))
        jobs.append((stem, rel, start[:-len('Start')], rom))
    prios = {rom: parse_priorities(rom) for rom in ('ROM_SEASONS', 'ROM_AGES')}
    for name, rel, prefix, rom in jobs:
        events, starts = parse_track(os.path.join(SRC, rel), prefix, rom)
        prio = prios[rom].get(prefix) if rel.startswith('sfx') and name != 'getItem' else None
        if prio is not None and set(prio) != set(starts):
            sys.exit('%s: the pointer table names channels %s, the file %s' % (name, sorted(prio), sorted(starts)))
        for k, s in starts.items():
            for ev in events[s:]:
                if ev[0] == 4 and k in (4, 5):
                    used_waves.add(ev[1])
                if ev[0] == 0 and k in (6, 7):
                    used_noise.add(ev[1])
        tracks.append((name, rel, events, starts, prio))
    # Every waveform a wave channel might select, whichever channel starts
    # where: a duty inside a stream reached only by a goto is still used.
    for name, rel, events, starts, prio in tracks:
        if 4 in starts or 5 in starts:
            for ev in events:
                if ev[0] == 4:
                    used_waves.add(ev[1])

    out = []
    out.append('// GENERATED by tools/rip-music.py from assets/music/oracles-disasm/ -- DO NOT EDIT.')
    out.append('// Oracle of Seasons\' own music data, from Stewmath\'s oracles-disasm')
    out.append('// (github.com/Stewmath/oracles-disasm, commit 7584d87); credit to that project')
    out.append('// and its contributors. Played by src/core/gbsound.js. See the ripper\'s header')
    out.append('// for the event encoding.')
    out.append('')
    out.append('/** soundFrequencyTable (code/audio.s): the hardware frequency register per note. */')
    out.append('export const GB_FREQ = ' + js(freq) + ';')
    out.append('')
    out.append('/** envelopeWaitTable (code/audio.s), 14 rows of 8. */')
    out.append('export const GB_ENV_WAIT = ' + js(envwait) + ';')
    out.append('')
    out.append('/** vibratoOffsetTable (code/audio.s). */')
    out.append('export const GB_VIBRATO = ' + js(vib) + ';')
    out.append('')
    out.append('/** waveformTable (audio/common/waveforms.s): 16 bytes, two 4-bit samples each. */')
    out.append('export const GB_WAVEFORMS = {')
    for k in sorted(used_waves):
        if k not in waves:
            sys.exit('waveform $%02x is used and not defined' % k)
        out.append('  0x%02x: %s,' % (k, js(waves[k])))
    out.append('};')
    out.append('')
    out.append('/** noiseFrequencyTable (audio/common/noise.s): note -> [NR42 low bits, NR43]. */')
    out.append('export const GB_NOISE = {')
    for k in sorted(noise):
        out.append('  0x%02x: %s,' % (k, js(noise[k])))
    out.append('};')
    out.append('')
    out.append('/** name -> { events, ch: { channel: index of its first event } }. */')
    out.append('export const SEASONS_MUSIC = {')
    for name, rel, events, starts, prio in tracks:
        out.append('  // %s' % rel)
        out.append('  %s: {' % name)
        out.append('    ch: { %s },' % ', '.join('%d: %d' % (k, v) for k, v in sorted(starts.items())))
        if prio:
            out.append('    prio: { %s },' % ', '.join('%d: %d' % (k, v) for k, v in sorted(prio.items())))
        out.append('    events: [')
        for i in range(0, len(events), 16):
            out.append('      ' + ','.join(js(e) for e in events[i:i + 16]) + ',')
        out.append('    ],')
        out.append('  },')
    out.append('};')
    out.append('')
    with open(OUT, 'w') as f:
        f.write('\n'.join(out))
    total = sum(len(t[2]) for t in tracks)
    print('rip-music: %d tracks, %d events, %d waveforms -> %s' % (
        len(tracks), total, len(used_waves), os.path.relpath(OUT, ROOT)))


if __name__ == '__main__':
    main()
