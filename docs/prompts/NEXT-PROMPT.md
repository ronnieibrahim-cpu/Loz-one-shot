# Next session — survey NPCs, add the drift metric

## Read first
- `docs/prompts/STATE.md` — objective #5 (npc-detail) and its file
  allowlist.
- `src/data/overworld.js` — every `['npc', ...]` and `['trader', ...]`
  entity literal (search both strings). Read the `FOLK` object near the
  top too; several npc/trader entries spread a `FOLK.*` preset instead of
  writing their own `sprite`.
- `src/data/story.js`'s `DIALOGUE` object — the actual line text keyed by
  each `dialogue`/`waiting`/`after`/`deals[].text` id.

## Why this, now
Objective #4 (enemy-roster) closed this session (S59) with the person
running these sessions confirming the idle-art question directly: `urchin`
stays the only idle pilot, and hurt/attack/death are complete or
structurally blocked roster-wide. Rotation moves to #5, npc-detail: "every
NPC has a unique sprite and >=2 dialogue states." A first read of
`overworld.js` already found real, specific non-uniqueness worth
recording precisely rather than from memory: `npc_fisher` is the sprite
for Mirren, Teel and Ossa (three different named traders) plus the plain
`fisher1` NPC; `npc_child` is Pell's trader sprite and also
`villageChild`'s and `hearthChild`'s; `npc_villager` is Dov's trader
sprite and also `sandpiper`'s; `npc_hood_blue` is both Wick's and
Sennit's; `npc_villager2` is both `villager2`'s and `hearthWife`'s. That
needs to be turned into an exact, complete table, not left as one read's
impression — and dialogue-state coverage looks much further along already
(`story.js`'s own "second states" comment block says every ordinary
townsperson already has two lines), so the actual gap may be narrower than
the rotation's headline suggests. No `docs/NPCS.md` exists yet and
`check-drift.mjs` has no npc-detail metric — objective #4 had both
(`docs/ENEMIES.md`, the section-6 census) before any art decision got
made, and this objective should start the same way.

## The task
1. Add an npc-detail section to `tools/check-drift.mjs`, same pattern as
   section 6 (the enemy census): import `MAPS` (already imported) and walk
   every room's `entities` for `'npc'`/`'trader'` literals — this reads
   the real, resolved objects (FOLK spreads already applied), not text.
   For each, resolve an identity label (`dialogue` for npc, the first
   `deals[].text` for trader — both are already-unique ids) and its
   `sprite`. Report: total named NPCs/traders, how many sprites are used
   by more than one identity (list the groups), and how many identities
   have fewer than 2 reachable dialogue ids (npc: `dialogue`+`after`;
   trader: `waiting`+every `deals[].text`+`after`).
2. Write `docs/NPCS.md` from that same data (by hand or a throwaway
   script — the file itself is what's kept): one row per named NPC/trader
   with its key/screen, sprite, and dialogue-state count, then a short
   section naming every sprite-reuse group found. Model the file's shape
   on `docs/ENEMIES.md` (a table plus prose, not just a dump).
3. Do not hand-draw or extract anything yet. This session is the count,
   not the fix — the fix needs `docs/ART-DIRECTION.md` + a sheet check per
   character, which is real work for a later session once the shape of
   the problem is on paper.

## Done means
- `node tools/check-drift.mjs` prints the new npc-detail line(s) and still
  exits 0.
- `docs/NPCS.md` exists, matches what the metric counts (same totals).
- `node tools/check-playthrough.mjs`, `node tools/test.mjs` still green
  (no engine file touched, so this should be a no-op check).
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- Hand-drawing or extracting any new NPC sprite this session.
- Writing new dialogue text — read what's already in `story.js`'s "second
  states" section before assuming a gap exists.
- Re-litigating objective #4 (enemy-roster) or its idle-art decision —
  closed, human-confirmed, S59.
- Advancing `OBJECTIVE OF RECORD` — #5 is not done until the metric and
  `docs/NPCS.md` both say so.
