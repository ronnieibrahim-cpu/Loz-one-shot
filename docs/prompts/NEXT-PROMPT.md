# Next session (S188) — design D6's growth (the Abyssal Keep)

## Read first
- CLAUDE.md, all of it.
- docs/NEXT-SESSION.md S187 and S185 (how D5 was designed); docs/HANDOFF.md
  lessons (top five).
- docs/briefs/DUNGEON-DESIGN-LANGUAGE.md, then docs/briefs/D5-DROWNED-WOOD-
  SHRINE.md and D4-CLIFFSIDE-CISTERN.md as the shape a brief takes.
- docs/DUNGEON-STATUS.md (D6's row: ~52 screens on 3 floors; the S179 board).

## State
- S187 is on claude/drowned-wood-canopy-s187-v4hlw8 and merged to main: D5
  finished to its brief (K4 the Ford Crown, K5 the High Bough, the Boss Key
  held from above, crossings, check-canopy's follow-the-seed sweep, the guide).
  Whole table green; check-playthrough 47/47, THE END, never died.

## The task
1. Study the Keep against Seasons' D8 / Ages' late dungeons
   (tools/oneshot/oracle-study/run.sh) and write
   docs/briefs/D6-ABYSSAL-KEEP.md: one machine, one new piece of terrain
   from the cartridges, each puzzle stated with its "aha", key economy,
   checkers. It must not restate any earlier dungeon's tide theme.
2. Mock the new rooms in the real engine beside the cartridge
   (tools/shoot-mock.mjs or tools/oneshot/mock-render.mjs) and show the
   human. Ask before building; build only what is approved.

## Done means
- Brief + mock pictures committed; whole table green; check-playthrough
  47/47 or more, THE END, never died; npm run build, dist/ committed;
  NEXT-SESSION.md and this file updated; pushed; ask before moving main.

## Out of scope
- Enemy damage and health (S150). A camera that frames bosses (S153).
