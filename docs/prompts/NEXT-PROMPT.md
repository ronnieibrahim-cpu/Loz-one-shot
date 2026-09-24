# Next session — every place has its own music

## Read first
- `docs/prompts/STATE.md` — objective 11 polish, area (e) music, pass 1.
- `docs/prompts/QUEUE.md`, the "(e) music" stub.
- `src/data/audio.js` — the 23 tracks and 59 sounds, and their headers.
- `docs/NEXT-SESSION.md`, the S147 entry only.

## Why this, now
Areas (a)-(d) have had a first pass; (d) feel landed at S147 and moved the
walk to Seasons' 1.5 px/f. Rooms name a `music:` track; nobody has listed
which places share one, which have none, and which loop with a seam.
check-music proves the notes are legal and check-sfx that every sound
exists; neither says whether a place sounds like itself.

## The task
1. List every place the game can be (six regions, the village, six
   dungeons, caves, houses, every boss and miniboss, title, ending) against
   the track it actually plays — read it from the room data, not memory.
   Write the table into `docs/MUSIC.md`.
2. Mark each: its own track, shared (with what), or silent/wrong.
3. Write the missing tracks in the Game Boy register (check-music's channel
   and frequency rules), fewest first: one per dungeon before anything else.
4. Every verb makes a sound: run check-sfx and list any verb with none.
5. Show the human the table and play them the new tracks (a build) before
   calling any of it done.
Target: no dungeon shares a track with another dungeon.

## Done means
- `node tools/check-music.mjs`, `node tools/check-sfx.mjs`,
  `node tools/check-audio-render.mjs` green (re-baseline only a track that
  was meant to change, and say which).
- `node tools/check-drift.mjs` green; `node tools/check-playthrough.mjs`
  green to THE END.
- `npm run build` with `dist/` committed; the human listens.

## Out of scope
- Feel timing (area d): S147's readings wait for new footage.
- White fades, the door flash and the chest text delay (a look, and (d)).
- Changing any room's layout, enemy or item to fit a track.
- The overworld track: since S148 it IS Seasons' Holodrum theme, transcribed
  from the footage at the human's request. Leave it; other tracks stay ours.
- The actor and the route, unless a sound change moves the run.
