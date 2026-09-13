# Next session — extract new faces for the last 8 villagers

## Read first
- `docs/NPCS.md` — S61's "What's left" section: 3 collisions remain
  (`npc_fisher` x3, `npc_child` x3, `npc_hood_blue` x2), all already-
  extracted spares are spent, and an informal scan flagged sheet index
  69 (`oracle-seasons-npcs.png`) as an unconfirmed candidate.
- `tools/rip-npcs.py` and `tools/rip-races.py` — the FRAMES coordinate
  maps to extend. `npc_hood_blue` comes from `rip-races.py`'s sheet
  (check its own `SHEET` constant), the other two from `rip-npcs.py`'s.
- `docs/prompts/STATE.md` — objective #5's allowlist and done-condition
  (22 of 22 unique; currently 12 of 22).

## Why this, now
S60 measured the objective (dialogue done roster-wide; sprite uniqueness
the real gap, 6 groups). S61 spent the free lunch — three sprites already
extracted and sitting unused — closing 3 of 6 groups at zero art cost and
checking each in-engine. What's left needs actual new extraction: no
further already-extracted NPC sprite exists unclaimed. `npc_fisher`
(Mirren/`fisher1`/Teel) and `npc_child` (`villageChild`/Pell/
`hearthChild`) both need a genuinely new source; `npc_hood_blue` (Wick/
Sennit) is the smaller of the three, 2 identities. S61's informal sheet
scan (not a full audit — `find_sprites` over `oracle-seasons-npcs.png`'s
92 blobs, most of which are soldiers/Zoras/Subrosians per the ripper's
own comment, not townsfolk) found index 69 as one plausible recolour of
the fisher archetype but did not confirm it or look at the races sheet
at all for a `npc_hood_blue` alternative.

## The task
1. Render a labelled contact sheet of every unclaimed blob on
   `assets/sheets/oracle-seasons-npcs.png` (`tools/ripkit.py`'s
   `find_sprites`, same call `rip-npcs.py` uses: `size=16, y1=200`) and
   look at it directly — don't trust a palette-similarity score alone,
   per `docs/ENEMIES.md`'s S57 lesson (a shared colour family is not the
   same character). Confirm or reject index 69 first since it's already
   flagged, then look at the rest of the sheet for anything else usable
   as a front-facing townsperson (not a soldier, Zora, or Subrosian —
   `rip-npcs.py`'s own header names what this sheet's crowd art wants).
2. Do the same for `assets/sheets/oracle-seasons-races.png` (or whatever
   `rip-races.py`'s `SHEET` constant actually names — check it, don't
   assume) for a second `npc_hood_blue`-style recolour.
3. For each confirmed candidate: add it to the relevant ripper's `FRAMES`
   dict with a comment saying what it is and why it's a real, distinct
   pose/recolour (the same discipline `docs/ENEMIES.md`'s hand-drawn
   entries use), regenerate (`python3 tools/rip-npcs.py` /
   `rip-races.py`), reassign the sprite in `src/data/overworld.js`, and
   verify in-engine (`tools/shoot-rooms.mjs`, screenshotted) the same way
   S61 checked its three reassignments.
4. If a group's collision can't be closed by extraction (checked and
   genuinely nothing fits), say so plainly in `docs/NPCS.md` rather than
   force a bad match — a soldier recoloured as a fisherman would fail
   `docs/ART-DIRECTION.md`'s register even if the palette technically
   passes.

## Done means
- `node tools/check-drift.mjs`'s npc-detail line shows progress past 12
  of 22 (or an explicit, written reason for each group still stuck).
- `node tools/check-rippers.mjs` still green (18+ assertions if a ripper
  gained an entry — it re-derives its own count).
- Every newly-assigned sprite confirmed in-engine, not just in data.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines); `docs/NPCS.md` rewritten to match the new census.

## Out of scope
- Touching `shoreSalter`/Hulla (`npc_salter_d`) — still an open question
  for the person running these sessions, not this session's to resolve.
- Hand-drawing new NPC art before the sheet check above comes back empty
  for a given group.
- Re-running S60's full census from scratch — read `docs/NPCS.md`.
- Advancing `OBJECTIVE OF RECORD` before 22 of 22 (or a written, reasoned
  ceiling below it) is reached.
