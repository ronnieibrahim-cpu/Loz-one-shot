# Reference footage

Used to frame-step the source games for `src/data/feel.js` (`measured` tags
must name the file and the frame). Not shipped in the build.

| File | What it is | Frame-exact? |
|---|---|---|
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
