# Next session — give three villagers their own look

## Read first
- `docs/NPCS.md` — the full census (S60): which of the 22 named NPCs/
  traders share a sprite, which sharing looks deliberate (the Salter
  clan hood) versus generic reuse, and the three already-extracted,
  already-unused sprites (`npc_elder`, `npc_zelda`, `npc_brinewife`).
- `docs/prompts/STATE.md` — objective #5 (npc-detail) and its allowlist.
- `tools/rip-npcs.py` / `tools/rip-races.py` — where `npc_elder`/
  `npc_zelda`/`npc_brinewife` come from, so a reassignment isn't a guess
  at what they look like.

## Why this, now
`check-drift.mjs`'s new npc-detail section (S60) found dialogue states
already done roster-wide (22 of 22 have >=2) — the real gap is sprite
uniqueness: 15 of 22 identities share one of 6 sprites. `docs/NPCS.md`
sharpened that further: one group (`npc_salter_d`, `shoreSalter`/Hulla)
spreads the same `FOLK.salter` preset on purpose — both characters'
own dialogue lines identify them as Salters, so a shared clan hood may be
a feature, not a bug, and needs a call from the person running these
sessions before it's touched (the idle-art precedent: ask, don't
default). The other five groups are generic reuse with no in-fiction
reason, and three sprites — `npc_elder`, `npc_zelda`, `npc_brinewife` —
are already extracted and sitting completely unused, found by diffing
every ripper-emitted name against every placement. Reassigning them
costs zero new art.

## The task
1. Put the Salter question to the person running these sessions (one
   short question, like the idle-art one): leave `shoreSalter`/Hulla
   sharing the hood as deliberate clan dress, or give one a different
   look anyway. Do not default either way.
2. Reassign `npc_brinewife`, `npc_elder`, `npc_zelda` to three of the
   five generic-reuse identities (`docs/NPCS.md`'s table) — one line each
   in `src/data/overworld.js` (`sprite: '...'`), no ripper or generated
   file touched. Pick recipients where the sprite plausibly fits (e.g.
   `npc_brinewife` toward `hearthWife` or `villager2` — check both
   against `docs/ART-DIRECTION.md`'s register before deciding, a
   fisherman's wife and a farmer's wife don't necessarily read the same).
   Screenshot or render each reassigned identity in its own room after,
   the same in-engine verification `docs/ENEMIES.md`'s art sessions used
   — a name fitting in prose doesn't guarantee the art reads right next
   to its room's other sprites.
3. `npc_fisher` (4 identities: Mirren/fisher1/Teel/Ossa) needs at least
   one NEW source regardless — the 3 spares above cover at most 3 of the
   5 non-clan gaps. Check `assets/sheets/oracle-seasons-npcs.png` and
   `oracle-seasons-races.png` (or whatever `rip-races.py`'s `SHEET`
   constant names) for a genuinely spare frame near the existing
   fisherman/child/villager plates before concluding none exists — don't
   assume the two rippers already found everything, the way `rip-enemies.
   py`'s near-the-block search missed frames a whole-sheet pass later
   found (S57).

## Done means
- `node tools/check-drift.mjs`'s npc-detail line shows more than 7 of 22
  unique, with `docs/NPCS.md` rewritten to match.
- Every reassigned identity checked in-engine (a scratch probe or
  screenshot showing the new sprite drawn, not just the data changed).
- `node tools/check-rippers.mjs` still green (no generated file
  hand-edited).
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- Touching `shoreSalter`/Hulla without an explicit answer to the Salter
  question.
- Hand-drawing new art before checking the sheets — extraction first,
  per CLAUDE.md.
- Re-running the S60 census from scratch — read `docs/NPCS.md`, don't
  rebuild it, unless the reassignments below make it stale.
- Advancing `OBJECTIVE OF RECORD` — #5 needs 22 of 22 unique, not 10.
