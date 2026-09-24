# Next session — measure feel against Ages footage

## Read first
- `docs/prompts/STATE.md` — objective 11 polish, area (d) feel, pass 1.
- `docs/prompts/QUEUE.md`'s "POLISH ROTATION", stub (d).
- `docs/FEEL-SPEC.md`: "Provenance", "How to earn a `measured`", "The
  sword is three verbs", "Knockback".
- `src/data/feel.js` — the constants you will re-tag, and their comments.
- `docs/NEXT-SESSION.md`, the S146 entry only.

## Why this, now
Areas (a)-(c) had a first pass at S146. `feel.js` has 0 of ~250
constants `measured`, because no reference footage was ever in hand. The
human has now given one: an Oracle of Ages playthrough,
https://youtu.be/ZE5K58TFzlI. At S146 the environment's network policy
refused youtube.com (proxy 403); the human was told how to allow it.

## The task
1. Fetch the footage: `pip install yt-dlp`, then download at the highest
   frame rate offered (`-F` lists formats; prefer 60 fps). If the host is
   still refused, ask the human to allow `youtube.com` and
   `googlevideo.com`, or to drop the file in the repo, and stop there.
2. Extract frames with `ffmpeg` (install if missing) around: plain
   walking, a sword swing, a spin, Link taking a hit (knockback distance
   and frames, invuln blink), an enemy taking a hit (flash beats — check
   S146's `hitflash` colours and `ENEMY_HIT_FLASH_BEAT`), a room scroll,
   a chest opening, text printing.
3. For each, count frames (convert from video fps to the GBC's ~59.73)
   and pixels against a 16px tile. Where the footage settles a number,
   set it in `feel.js`, tag it `measured`, and name the video, timestamp
   and what was counted in the comment. Where it only brackets it, say so
   and leave the tag.
Target: at least ten constants honestly `measured`.

## Done means
- `node tools/check-feel.mjs` green (it checks every `measured` names
  its source); `node tools/check-drift.mjs` shows the new count.
- `node tools/replay.mjs --record-all`, then `node tools/replay.mjs`
  green, committed in the same change (FEEL-SPEC's rule 4).
- `node tools/check-playthrough.mjs` green to THE END; if a changed
  number costs the run a fight, say so rather than un-measuring it.
- `npm run build` with `dist/` committed; the human plays it.

## Out of scope
- Any constant the footage does not show; leave it `guessed`.
- Music and sound (area e), even if the video has audio.
- Changing what any item or enemy does.
- The shallow-water swap noted at S146 — (c) pass 2.
- Upgrading `derived` to `measured` without a frame count.
