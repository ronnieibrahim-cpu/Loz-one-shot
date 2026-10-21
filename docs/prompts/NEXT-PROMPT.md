# Next session (S202) — the dialogue pass

## Read first
- CLAUDE.md, all of it.
- docs/NEXT-SESSION.md S201 and S200; docs/HANDOFF.md lessons (top ten).

## State
- S201: the written guide's Keep chapter rewritten (check-guide green again),
  the picture guide's secret caves/side quests/charms caught up, region S (the
  south shore east of the village) redrawn, and the bell-buoy echo built in
  Sunken Cove (Resonance Rod mini-game; prize a bigger seed bag; proved by
  tools/check-buoys.mjs).
- Whole table green; check-playthrough 49/49, THE END, never died.

## The task
The dialogue pass (queued by the human, S201).
- The human: townspeople's lines read long-winded, cryptic and "AI generated",
  and often do not actually convey anything. Study how Oracle of Seasons and
  Ages write their NPCs, then make ours less long-winded and more meaningful.
- Source: both cartridges' text is in oracles-disasm (text/ under seasons and
  ages; the repo copies parts in assets/*/oracles-disasm — check what is there,
  or fetch github.com/Stewmath/oracles-disasm). Measure it: words per line,
  pages per NPC, how often a line names a place, an item, a person or gives a
  direct hint, how jokes and personality land in few words.
- Then audit ours (src/data/story.js and every `say`/sign text in room data):
  flag the long, vague and purple ones. Show the human a before/after sample
  of 10-15 lines (with Seasons/Ages lines beside them for register) and ask
  before rewriting the rest. Keep every line's job (a hint must stay a hint;
  story beats keep their facts).
- check-dialogue, check-text and check-cutscenes/watch-cutscenes (caption
  reading time) must stay green; the guides quote some lines — update them.

## Other candidates, if asked
- Boxy regions left: B (the dark shore round the lighthouse, 0..3 x 0..1),
  C (the Salt Pans' edges), G (the coast strips beside Tidewatch).

## Done means
- Whole table green; check-playthrough 49/49 or more, THE END, never died;
  npm run build, dist/ committed; NEXT-SESSION.md and this file updated;
  pushed; merged to main when done.

## Out of scope
- Enemy damage and health (S150). A camera that frames bosses (S153).
