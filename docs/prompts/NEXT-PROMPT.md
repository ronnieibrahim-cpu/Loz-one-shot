# Next session (S165) — polish, from the action-item list

## Read first
- CLAUDE.md, all of it. Oracle of Ages is a full reference alongside
  Seasons, assets and all.
- `docs/NEXT-SESSION.md`, the S164 entry (its FUTURE ACTION ITEMS list), then
  S162/S163 for the detail of each item.
- `docs/HANDOFF.md` hard-won lessons.

## State
- Check whether S164 (each dungeon's own stairs; our music played through
  the cartridge's own sound engine) is merged into main; if not, ask.
- Whole table green; check-playthrough 44/44, THE END, never died.
- OUR TUNES ARE KEPT and play on the Game Boy engine (the human's choice,
  S164): `compileForGb` -> gbsound.js. The tracker synth is gone. Effects
  take their channel out of the music (stems, Audio._duck).

## The task
The human said "proceed in order" through the list (S164). Done at S164:
each dungeon's own stairs; our tunes on the Game Boy engine ("Music sounds
great"); music making room for sound effects; Eyrie bats kept as they are.
Item 5 (fight tuning) is the human's. NEXT: item 6, the guessed timings,
from NEXT-SESSION.md S164's notes — ask the human the two open questions
there first (the low-health beep's threshold; the Pot Hauler charm vs
Seasons' no-slowdown carry), and settle the walk-speed puzzle before any
movement change. Then 7 the 50 unaudited overworld screens, 8 a Lens puzzle
on the overworld, 9 our item icons, 10 a phone check. Ask before anything
large.

## Done means
- Whatever the human chose, with the whole table green and check-playthrough
  44/44 or more, to THE END, never died.
- `npm run build`, dist/ committed, NEXT-SESSION.md and this file updated,
  pushed; ask before moving main.

## Out of scope
- Enemy damage and health (S150). A camera that frames bosses (S153).
- The pixel-art intro cutscene (tabled by the human).
