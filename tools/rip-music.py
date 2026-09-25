#!/usr/bin/env python3
"""Rip Oracle of Seasons' own music data into src/data/music-seasons.js (S151).

Source: assets/music/oracles-disasm/, copied verbatim from Stewmath's
oracles-disasm (github.com/Stewmath/oracles-disasm, commit 7584d87): the
channel scripts of the tracks this game plays (mus/*.s), the item-get
jingle (sfx/getItem.s), the wave channel's waveforms, the noise channel's
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


def parse_track(path, prefix):
    """Flatten a channel-script file into (events, labels, channel starts)."""
    # Expand .rept/.endr and .ifdef first, keeping labels in place.
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

    # Conditionals: this is Seasons, built as the cartridge was.
    lines, stack = [], []
    for ln in out:
        if ln.startswith('.ifdef'):
            stack.append(ln.split()[1] in ('ROM_SEASONS', 'BUILD_VANILLA'))
            continue
        if ln == '.else':
            stack[-1] = not stack[-1]
            continue
        if ln == '.endif':
            stack.pop()
            continue
        if all(stack):
            lines.append(ln)

    events, labels, pending = [], {}, []
    for ln in lines:
        if not ln or ln.startswith('.define') or ln.startswith('.db'):
            # `.define ...Channel6 MUSIC_CHANNEL_FALLBACK`: no such channel.
            # `.db $ff ...`: bank padding after the last channel, unreachable.
            continue
        if ln.endswith(':'):
            labels[ln[:-1]] = len(events)
            continue
        parts = ln.replace(',', ' ').split()
        op, args = parts[0], parts[1:]
        if op == 'note':
            if len(args) != 2:
                sys.exit('%s: multi-note line not supported: %s' % (path, ln))
            events.append([0, note_value(args[0]), num(args[1])])
        elif op == 'rest':
            events.append([1, num(args[0])])
        elif op == 'vol':
            events.append([2, num(args[0])])
        elif op == 'env':
            events.append([3, num(args[0]), num(args[1])])
        elif op == 'duty':
            events.append([4, num(args[0])])
        elif op == 'vibrato':
            events.append([5, num(args[0])])
        elif op == 'goto':
            events.append([6, args[0]])
        elif op == 'cmdff':
            events.append([7])
        elif op == 'cmdf8':
            events.append([8, num(args[0])])
        elif op == 'cmdfd':
            events.append([9, num(args[0])])
        elif op == 'cmdf0':
            events.append([10, num(args[0])])
        elif op in ('cmdf1', 'cmdf2', 'cmdf3'):
            continue            # "does nothing" (code/audio.s)
        else:
            sys.exit('%s: unknown command: %s' % (path, ln))
    for ev in events:
        if ev[0] == 6:
            if ev[1] not in labels:
                sys.exit('%s: goto to unknown label %s' % (path, ev[1]))
            ev[1] = labels[ev[1]]
    starts = {}
    for k in range(8):
        name = '%sChannel%d' % (prefix, k)
        if name in labels:
            starts[k] = labels[name]
    return events, starts


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
    for name, rel, prefix in TRACKS:
        events, starts = parse_track(os.path.join(SRC, rel), prefix)
        for k, s in starts.items():
            for ev in events[s:]:
                if ev[0] == 4 and k in (4, 5):
                    used_waves.add(ev[1])
                if ev[0] == 0 and k in (6, 7):
                    used_noise.add(ev[1])
        tracks.append((name, rel, events, starts))
    # Every waveform a wave channel might select, whichever channel starts
    # where: a duty inside a stream reached only by a goto is still used.
    for name, rel, events, starts in tracks:
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
    for name, rel, events, starts in tracks:
        out.append('  // %s' % rel)
        out.append('  %s: {' % name)
        out.append('    ch: { %s },' % ', '.join('%d: %d' % (k, v) for k, v in sorted(starts.items())))
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
