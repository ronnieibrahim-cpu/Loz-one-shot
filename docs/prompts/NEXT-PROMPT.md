# Next session (S162) — after the optional dungeons

## Read first
- CLAUDE.md, all of it (S161 added `check-whirlpool.mjs` to the table).
- `docs/NEXT-SESSION.md`, the S161 entry.
- `docs/DUNGEON-STATUS.md`, "The optional dungeons (S159 plan)" — all three
  are DONE.

## State
- Branch `claude/oracle-tides-optional-dungeons-c5eytd` holds S160 + S161
  (the Lower Vault, the Gullwind Eyrie, the Sunken Palace). S161 asked the
  human whether to merge it into main: check `git log origin/main` first. If
  it is merged, branch from main; if not, ask again before doing anything that
  depends on it.
- Whole table green; check-playthrough 44/44, THE END, never died.
- 28 heart pieces, cap 16. 31 charms. Art from both cartridges (Ages files in
  assets/objects/oracles-disasm/ages/).

## The task
Ask the human what is next, in plain words, offering what the notes suggest:
- Play the three optional dungeons from a save and report how they feel
  (pictures, and a clip of each theme working).
- The "noticed, not chased" list in S161 and S160 (robot combat on the
  optional bosses, check-anchor's phantom hop, the Palace's stairs art,
  Thalassor's pull reading the base tide, lit torches not remembered).
Do nothing large without the human's go-ahead.

## Done means
- Whatever the human chose, with the whole table green and check-playthrough
  44/44 or more, to THE END, never died.
- `npm run build`, dist/ committed, NEXT-SESSION.md and this file updated,
  pushed; ask before moving main.

## Out of scope
- Enemy damage and health (S150). A camera that frames bosses (S153).
- The pixel-art intro cutscene (tabled by the human).
