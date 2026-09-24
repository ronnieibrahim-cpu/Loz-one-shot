# Reference footage

Used to frame-step the source games for `src/data/feel.js` (`measured` tags
must name the file and the frame). Not shipped in the build.

| File | What it is | Frame-exact? |
|---|---|---|
| `frames/*.png` | Clean still screens cut from the TAS by `tools/grab-footage-frames.py` (median of each 4x4 block, colours clustered back to the screen's palette): the file select (video frame 17691), the save prompt (6725), the item page (4570) and the developer card (6760). Read by `tools/rip-screens.py`. | — |
| `seasons-tas-rooster-adventure.mp4` | Oracle of Seasons (Japanese cartridge), a tool-assisted speedrun using the "Rooster Adventure" glitch, supplied by the human at S146. 5:05, 17 MB. | Yes: 59.73 fps (the GBC's own rate, one video frame per game frame) at 640x576, exactly 4x the 160x144 screen. Scale with `flags=neighbor` to get the real pixels back. |

A TAS plays frame-perfect inputs and cuts actions short on purpose, so
measure what the ENGINE does (speeds, scroll lengths, flash and blink
beats, knockback distance), not how long the player held something.
Some stretches are glitched (menus, warps); skip them.

Tools: `pip install imageio-ffmpeg numpy` gives a static ffmpeg at
`python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())"`.

First reading (S146), by comparing consecutive frames of the playfield:
a room-to-room scroll moves 4 px/frame — 40 frames left/right (160 px),
32 frames up/down (128 px). Seen at video frames 77, 1389, 2505, 3072
(horizontal) and 1864, 2057, 2267, 2665, 2820 (vertical).

## S147 readings

Decoding: `ffmpeg -i <mp4> -vf scale=160:144:flags=area -f rawvideo -pix_fmt
rgb24 frames.raw` gives 18233 frames of 160x144 (area-averaging the 4x4
blocks is cleaner than `neighbor` against the h264 noise). Useful per-frame
series, all cheap in numpy: Link's green tunic bbox (g > r+40 and g > b+20,
below the HUD), the whole-screen shift between consecutive frames (best
integer offset, per axis), the HUD's red heart pixels, and mean brightness
(fades). "Frame N" below is a 0-based index into that decode.

APPLIED (tagged `measured` in src/data/feel.js):

| What | Reading | Frames |
|---|---|---|
| Walk, straight | 1.5 px/f, steps alternate 1,2 | 9912-9960 (left, 72 px/48 f), 3835-3853 and 7090-7108 (up) |
| Walk, diagonal | ~1.04 px/f per axis = 1.5 overall | 1227-1297 (72/72 in 70), 1154-1190 (38/38 in 36) |
| Room scroll | 4 px/f: 40 f sideways, 32 f up/down | 77-116, 1864-1895 (+ the S146 list) |
| Link hit flash | red 4 f / normal 4 f, 33 f in all, starts red | 2758-2790, 9771-9803, 15516-15548 |
| Link hit, screen | no shake: whole-frame shift 0 | same three hits |
| Link hit, world | no freeze: the enemy beside him animates on | 15513-15521 |
| Enemy hit flash | the same 4 f beat, red/tan/black | 4104-4114 |
| Big-room camera | follows at 1 px/f while Link walks 1.5; starts when his middle passes the playfield's middle (+~4 px) | 3853-3879 (up), 5781-5814 (left) |

The hit palette is the same for Link and enemies: black outline, red
(~#e80000) body, tan (~#f8c850) light — frames 15523, 9779, 4105.

READ BUT NOT APPLIED:

- Sword swing: NOT MEASURABLE here. The run re-presses B about every four
  frames (e.g. 1960-1990, 8120-8132, 9770-9850), so a full swing never
  completes. What is visible: each swing shows its diagonal pose for about
  one frame, then the straight pose.
- Text speed: NOT MEASURABLE here. The run set message speed to 5 of 5
  (file-select screen, frames 6930 and 17700); lines appear whole, two frames
  per step (6675-6690, 12504-12551).
- Chest: the lid opens at 8133, the item appears at 8136 and rises 11 px
  over ~29 frames (y 59 -> 48, slowing: 2,1,1,0,1 then 1 px per 4 f), and
  the text box opens at 8169 — 36 frames after the lid. This game shows the
  text at once; a later session could add the delay.
- Fades: Seasons fades to WHITE, not black. Stairs: out over ~27 f
  (5688-5715), white held, back in over ~27 f (5746-5773). A door into a
  building or cave: an instant cut to white, 16 f of white, then ~20 f back
  in (3659-3695, 8598-8629, 14170-14199). The item menu: 10 f each way
  (1744-1754). Drowning: ~24 f out (4469-4493). None applied: it changes a
  look (white) and a pace nobody has asked for yet.
- Knockback distance: not isolable — the run is steering through every hit.
- Pit fall, feather jump: none on foot in the run (the cucco carries Link
  over every gap: 2262-2290, 8836-8916, 9350-9460 are flights, NOT walks).

## S148 — the overworld theme, transcribed

`src/data/audio.js` `TRACKS.overworld` is Seasons' Holodrum theme read off
`seasons-tas-rooster-adventure.mp4`'s own soundtrack (mono, 32 kHz via
imageio-ffmpeg). How, so it can be repeated or corrected:

- **Where it plays.** Chroma self-similarity finds one 96-row loop playing
  six times, in three pairs of two back-to-back plays: starting at audio
  seconds 34.656, 47.514 (frames ~2070-2840), 150.684, 163.543 (~9000-9770)
  and 260.814, 273.678 (~15576-16344). Spectral cross-correlation lines them
  up to 5 ms. The second play of each pair is cut off by a doorway from
  row 59 on, so rows 59-95 are the median of the three first plays only.
- **Tempo.** Onset autocorrelation: 0.134 s a step = 8 frames. The bass
  hits on steps 0-3, 6 and 9 of every 12, so a bar is 12 steps = 96 frames:
  four beats of three (a triplet lilt). The loop is 8 bars = 768 frames.
- **Notes.** A median spectrum across the plays (which drops every sound
  effect, since none repeats at the same place in the music) at half-step
  resolution (4 frames, a 2048-sample window), with harmonics of stronger
  peaks removed, then read by eye off piano-roll renders where the table
  was ambiguous. The quick runs up to the long notes (A4 B4 C5 D5) are one
  and a half steps each, which is why the track's row is 4 frames.
- **What is approximate.** The bass wobbles up to half a semitone either
  side of its note in the recording (vibrato or the channel's coarse
  tuning), so each bass note is the chord tone nearest the measurement.
  Four of the 96 steps (16, 17, 63, 65) match the recording worse than the
  rest (pitch-class similarity under 0.7; the mean is well above it): two
  sit under a sword sound in most plays, two are a fast upward flourish.
