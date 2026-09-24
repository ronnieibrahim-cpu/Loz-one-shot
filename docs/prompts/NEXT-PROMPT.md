# Next session — measure feel against Seasons footage

## Read first
- `docs/prompts/STATE.md` — objective 11 polish, area (d) feel, pass 1.
- `assets/footage/README.md` — the video, how to decode it, first reading.
- `docs/FEEL-SPEC.md`: "Provenance", "How to earn a `measured`", "The
  sword is three verbs", "Knockback".
- `src/data/feel.js` — the constants you will re-tag, and their comments.
- `docs/NEXT-SESSION.md`, the S146 entry only.

## Why this, now
Areas (a)-(c) had a first pass at S146. `feel.js` has 0 of ~250
constants `measured`, because no frame-exact reference was ever in hand.
There is one now: `assets/footage/seasons-tas-rooster-adventure.mp4`,
Oracle of Seasons at 59.73 fps and exactly 4x scale — one video frame is
one game frame. The first reading already disagrees with the game: a
room scroll is 40 frames sideways and 32 up/down (4 px/frame), and
`ROOM_TRANSITION_FRAMES` is a guessed 34 for both.

## The task
1. Decode the video to 160x144 frames (`imageio-ffmpeg` + `numpy`, see
   the footage README). Reproduce the scroll reading first.
2. Measure, in this order, what the footage shows cleanly:
   room scroll (split into horizontal and vertical if the engine allows
   it); Link's walk speed in px/frame (track his sprite across a straight
   walk); sword swing length and spin; enemy hit flash beats and colours
   (against S146's `hitflash` and `ENEMY_HIT_FLASH_BEAT`); Link's damage
   blink and knockback distance/frames; text print speed (Japanese text,
   so frames per character, not per word); chest or item-get hold.
3. For each: write the number into `feel.js`, tag it `measured`, and put
   the file name, the video frame number(s) and what was counted in the
   comment. Where the footage only brackets a value, say so and keep
   `guessed`/`derived`. Record every reading, used or not, in
   `assets/footage/README.md`.
4. Show the human a short side-by-side (the original's frames next to
   ours) for anything that changes how the game feels.
Target: at least ten constants honestly `measured`.

## Done means
- `node tools/check-feel.mjs` green (every `measured` names its source);
  `node tools/check-drift.mjs` shows the new count.
- `node tools/replay.mjs --record-all`, then `node tools/replay.mjs`
  green, committed in the same change (FEEL-SPEC's rule 4).
- `node tools/check-playthrough.mjs` green to THE END; if a measured
  number costs the run a fight, fix the route, never the measurement.
- `node tools/check-camera.mjs` green if the scroll changed.
- `npm run build` with `dist/` committed; the human plays it.

## Out of scope
- Any constant the footage does not show; leave it `guessed`.
- Glitched stretches of the run (menus, warps) as evidence of anything.
- Music and sound (area e), even though the video has audio.
- Changing what any item or enemy does, or any art.
- Upgrading `derived` to `measured` without a frame count.
- YouTube: it will not serve this server; ask for files instead.
