# Next session (S166) — the human's answers to S165's four questions

## Read first
- CLAUDE.md, all of it. Oracle of Ages is a full reference alongside
  Seasons, assets and all.
- `docs/NEXT-SESSION.md`, the S165 entry (its four questions), then S164.
- `docs/HANDOFF.md` hard-won lessons (S165's are at the top).

## State
- S165 is on branch claude/oracle-tides-s165, NOT merged unless the human
  said so: check `git log origin/main` first and branch from wherever S165 is.
- Whole table green; check-playthrough 44/44, THE END, never died.
- Enemies now die Seasons' way (knockback, then the cartridge's kill puff,
  then the drop and the room's clear); puffs and the bomb blast are ripped
  (tools/rip-effects.py); no hit freeze; one Seasons shake.

## The task
Act on the human's answers to S165's questions: (1) boss hit rules 32 f /
no shove, (2) remove the hand-drawn flinch poses, (3) the Lens puzzle on a
Salt Pans screen, (4) redraw our item icons 8 px wide. Item 5 (fight tuning)
is the human's. Ask before anything large.

## Done means
- Whatever the human chose, with the whole table green and check-playthrough
  44/44 or more, to THE END, never died.
- `npm run build`, dist/ committed, NEXT-SESSION.md and this file updated,
  pushed; ask before moving main.

## Out of scope
- Enemy damage and health (S150). A camera that frames bosses (S153).
- The pixel-art intro cutscene (tabled by the human).
