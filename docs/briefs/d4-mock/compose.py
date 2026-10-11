# Composes the S183 Cistern mock pictures: cartridge rooms beside ours.
import json, sys
from PIL import Image, ImageDraw, ImageFont
S = sys.argv[1]; OUT = sys.argv[2]
ST = S + '/study0/study/'; M = S + '/mock/'
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22)
F2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 16)
BG = (24, 24, 34); TITLE = (255, 236, 160); HEAD = (170, 210, 255); CAP = (225, 225, 225)
spec = json.load(open('/home/user/Loz-one-shot/docs/briefs/d4-mock/mock-spec.json'))
rooms = spec['rooms']

def crop(png, col, row):
    return Image.open(ST + png).convert('RGB').crop((col * 244, row * 180, col * 244 + 240, row * 180 + 176))

cart_spike = crop('seasons-d04-f1.png', 2, 1).crop((16, 48, 32, 64))
plat = Image.open(S + '/plat.png')

def ours(name, room=None, floats=(), spikes=True):
    im = Image.open(M + name + '.png').convert('RGB')
    if room and spikes:
        for y, row in enumerate(rooms[room]):
            for x, ch in enumerate(row):
                if ch == '^': im.paste(cart_spike, (x * 16, y * 16))
    if floats:
        base = im.copy()
        nolink = None
        try:
            nl = Image.open(M + name + '-nolink.png').convert('RGB')
            if room and spikes:
                for y, row in enumerate(rooms[room]):
                    for x, ch in enumerate(row):
                        if ch == '^': nl.paste(cart_spike, (x * 16, y * 16))
            nolink = nl
        except FileNotFoundError:
            pass
        for (px, py) in floats: im.paste(plat, (px, py), plat)
        if nolink is not None:
            for y in range(im.height):
                for x in range(im.width):
                    if base.getpixel((x, y)) != nolink.getpixel((x, y)):
                        im.putpixel((x, y), base.getpixel((x, y)))
    return im

def sheet(title, cols, out, scale=2):
    # cols: list of (header, [(image, caption)])
    cw = max(max(im.width for im, _ in c[1]) for c in cols) * scale
    rows = max(len(c[1]) for c in cols)
    rh = max(im.height for c in cols for im, _ in c[1]) * scale
    W = 16 + len(cols) * (cw + 16); H = 50 + 30 + rows * (rh + 40)
    pic = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(pic)
    d.text((16, 12), title, font=F, fill=TITLE)
    for i, (head, cells) in enumerate(cols):
        x = 16 + i * (cw + 16)
        d.text((x, 52), head, font=F, fill=HEAD)
        for j, (im, cap) in enumerate(cells):
            y = 84 + j * (rh + 40)
            pic.paste(im.resize((im.width * scale, im.height * scale), Image.NEAREST), (x, y))
            d.text((x, y + im.height * scale + 6), cap, font=F2, fill=CAP)
    pic.save(out); print('wrote', out, pic.size)

# 1. spikes
sheet('Spikes the sea covers: Seasons beside our Spike Basin (mock)', [
    ('Seasons - Dancing Dragon', [(crop('seasons-d04-f1.png', 2, 1), '1F $67: the spike floor, dry at every season')]),
    ('Ours - Spike Basin, LOW', [(ours('spike-low', 'spike_basin@0'), 'LOW: the key is behind bare spikes')]),
    ('Ours - MID', [(ours('spike-mid', 'spike_basin@1'), 'MID: still bare (a wade would sting)')]),
    ('Ours - HIGH', [(ours('spike-high', 'spike_basin@2'), 'HIGH: drowned and harmless - swim to it')]),
], OUT + '/mock-spikes.png')

# 2. floats
s5e = crop('seasons-d04-f0.png', 3, 1); s5e.paste(plat, (192, 128), plat)
sheet('Moving platforms: Seasons beside our floats (mock)', [
    ('Seasons - Dancing Dragon', [(s5e, 'B1 $5e: a platform over the holes')]),
    ('Ours - the Weir, MID', [(ours('weir-mid', 'weir@1', floats=[(48, 32)]), 'the race runs, so the float runs')]),
    ('Ours - the Long Race, MID', [(ours('race-mid', 'long_race@1', floats=[(64, 48)]), 'it never stops under the key')]),
    ('Ours - the Long Race, braked', [(ours('race-mid-cone', 'long_race@1', floats=[(112, 48)]), 'wind on the race: the float stops')]),
], OUT + '/mock-floats.png')

# 3. the machine
a6d = crop('ages-d07-f2.png', 1, 1)
loft = Image.open(M + 'loft-mid.png').convert('RGB')
for y, row in enumerate(rooms['wind_loft@1']):
    for x, ch in enumerate(row):
        if ch == '^': loft.paste(cart_spike, (x * 16, y * 16))
sheet('The sea you climb with, and the gates the wind opens (mock)', [
    ('Ages - Jabu-Jabu', [(a6d, '3F $6d: three buttons set the water'),
                          (crop('ages-d07-f1.png', 2, 1), '1F $5c: read on the floors below')]),
    ('Ours - 2F the Intake', [(ours('intake-mid', 'intake@1'), 'came up at MID: spikes, no conch'),
                              (ours('intake-high', 'intake@2'), 'came up at HIGH: swim on')]),
    ('Ours - 2F the East Tank', [(ours('tank-high-cone'), 'HIGH, wind alone: still drowned'),
                                 (ours('tank-high-gate-cone'), 'HIGH, gate open + wind: it turns')]),
    ('Ours - 2F the Float Tank', [(ours('float-high-cone', floats=[(112, 64)]), 'HIGH, wind alone: it runs on'),
                                  (ours('float-high-gate-cone', floats=[(112, 64)]), 'HIGH, gate open + wind: stops')]),
], OUT + '/mock-machine.png')
loft.paste(plat, (640, 80), plat)
W = loft.width * 2
pic = Image.new('RGB', (W + 32, loft.height * 2 + 100), BG); d = ImageDraw.Draw(pic)
d.text((16, 12), '3F the Wind Loft (mock): one wheel over each tank of the Sealed Cistern', font=F, fill=TITLE)
pic.paste(loft.resize((W, loft.height * 2), Image.NEAREST), (16, 50))
d.text((16, 60 + loft.height * 2), 'west: a sump shelf (MID)      middle: across the spikes (HIGH)      east: over the pit on a float', font=F2, fill=CAP)
pic.save(OUT + '/mock-loft.png'); print('wrote loft')
