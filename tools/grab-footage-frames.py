#!/usr/bin/env python3
"""Cut clean still screens out of the reference footage (S147).

The Seasons TAS in assets/footage/ is the only source this project has for
the game's own FILE SELECT, SAVE and INVENTORY screens — no sprite sheet in
assets/sheets/ holds them. This turns chosen video frames into PNGs in
assets/footage/frames/, which tools/rip-screens.py then reads like any sheet.

WHY IT IS A SEPARATE STEP. Decoding h264 needs ffmpeg (`pip install
imageio-ffmpeg numpy pillow`), and check-rippers re-runs every ripper on every
session; keeping the decode here means the ripper only ever reads committed
PNGs. Re-run this only to take a new frame.

HOW A FRAME IS CLEANED. The video is exactly 4x the 160x144 screen, but h264
smears colour across block edges. Each game pixel is the MEDIAN of the inner
2x2 of its 4x4 block, and the screen's colours are then clustered back to a
real palette (a Game Boy Color screen has at most 32): colours rounded to the
console's 8-step grid, near-duplicates merged, three rounds of k-means, and
every pixel snapped to its nearest survivor. The result is a flat-coloured
screen, not an approximation of one.

Usage: python3 tools/grab-footage-frames.py
"""
import os
import subprocess
import sys

try:
    import numpy as np
    from PIL import Image
    import imageio_ffmpeg
except ImportError:
    sys.exit('grab-footage-frames: needs `pip install imageio-ffmpeg numpy pillow`')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'footage', 'seasons-tas-rooster-adventure.mp4')
OUT = os.path.join(ROOT, 'assets', 'footage', 'frames')

# name -> 0-based video frame. Each is the first fully-coloured frame of a
# screen the run passes through (the fade in or out is on the frames around it).
FRAMES = {
    'seasons-file-select': 17691,   # "choose a file", slot 1 filled
    'seasons-save': 6725,           # the save prompt, three choices
    'seasons-inventory': 4570,      # the item page, seed satchel under the cursor
    'seasons-card': 6760,           # the developer card before the title
}


def frame(n):
    cmd = [imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i', SRC,
           '-vf', 'select=eq(n\\,%d)' % n, '-vframes', '1',
           '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
    b = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(b, np.uint8).reshape(576, 640, 3)


def native(n):
    f = frame(n).astype(np.int64).reshape(144, 4, 160, 4, 3)
    inner = f[:, 1:3, :, 1:3, :].transpose(0, 2, 1, 3, 4).reshape(144, 160, 4, 3)
    return np.median(inner, axis=2)


def snap(a, merge=28, minc=6):
    from collections import Counter
    px = a.reshape(-1, 3)
    q = (np.round(px / 8) * 8).clip(0, 248).astype(int)
    cnt = Counter(map(tuple, q))
    cents = []
    for c, n in sorted(cnt.items(), key=lambda kv: (-kv[1], kv[0])):
        if n < minc:
            break
        if all(np.abs(np.array(c) - np.array(k)).sum() > merge for k in cents):
            cents.append(c)
    C = np.array(cents, dtype=float)
    for _ in range(3):
        lab = ((px[:, None, :] - C[None, :, :]) ** 2).sum(-1).argmin(1)
        C = np.array([px[lab == i].mean(0) if (lab == i).any() else C[i] for i in range(len(C))])
    C = (np.round(C / 8) * 8).clip(0, 248).astype(int)
    lab = ((px[:, None, :] - C[None, :, :]) ** 2).sum(-1).argmin(1)
    return C[lab].reshape(a.shape).astype(np.uint8), len(C)


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, n in FRAMES.items():
        img, k = snap(native(n))
        Image.fromarray(img).save(os.path.join(OUT, name + '.png'))
        print('%s <- video frame %d, %d colours' % (name, n, k))


if __name__ == '__main__':
    main()
