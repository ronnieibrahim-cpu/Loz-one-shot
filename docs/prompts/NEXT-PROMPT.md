# Next session — investigate whether a boss ripper is actually possible

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #3 (boss-art) and its file allowlist.
  Read the "Note" left by the previous objective (#2, art-provenance) too —
  it explains why that objective was marked done despite `check-drift.mjs`
  still printing a nonzero "untagged" count, in case that call needs
  revisiting.
- `src/data/sprites-bosses.js`'s own header (top of file) — "Drawn by hand,
  cell by cell" is the CURRENT state this objective is asking whether to
  change, not a fact to re-derive.
- `assets/sheets/README.md` — the sheet-sourcing and ripper-credit
  convention every existing `tools/rip-*.py` follows. Any new sheet has to
  fit this same pattern (Copyright section, ripper credit, True-Colors-vs-
  LCD half).

## Why this, now
STATE.md's objective of record is #3, boss-art: "for each boss, either a
`rip-bosses.py` extraction path exists, or the writeup says per boss why
the source sheets can't supply it." The premise CLAUDE.md and STATE.md
both currently state — "there is no rip script for it today" — turns out
to be about tooling, not about source availability: a web search this
session found individual Oracle of Seasons BOSS sprite sheets on
spriters-resource.com (the same site every existing sheet in
`assets/sheets/` was pulled from), including Onox, Dodongo, Gohma,
Digdogger, Gleeok, Mothula, Twinrova and Aquamentus — see
`https://www.spriters-resource.com/game_boy_gbc/thelegendofzeldaoracleofseasons/`
for the full listing. Nobody has checked whether that changes the answer.

## The task
This is a RESEARCH session, not a build-the-ripper session — the design
question underneath is harder than "is a sheet available" and needs
answering first, in writing, before any pixels are pulled:

This game's six dungeon bosses (Gohmaraq, Anemos, Gloomtide, Wyverna,
Rootmaw, Nereth — see `src/data/bosses.js`) are ORIGINAL CREATURES, not
Oracle of Seasons bosses under new names (Goal 2 in CLAUDE.md: mechanics,
items, dungeons and story are ours). Onox, Gohma, Digdogger etc. are
SPECIFIC NAMED CHARACTERS with their own designs, not generic creature
TYPES the way `sprites-enemies.js`'s octoroks and keese are — extraction
worked for enemies and NPCs because a "generic Zelda octorok" transfers
cleanly to "this game's octorok". A "generic Zelda final boss" does not
obviously transfer the same way to Nereth, who has to look like nothing
but himself.

So: for EACH of the six bosses (plus the two miniboss slots, if in scope —
check `docs/prompts/STATE.md`'s wording, it says "boss" not "miniboss"),
answer in writing, in a new doc or `docs/ART-BACKLOG.md`:
1. Does any sheet on spriters-resource.com contain a creature whose
   SILHOUETTE or POSE could genuinely inform this boss's design without
   importing the other game's specific character (the same "surface is
   theirs, subject is ours" test CLAUDE.md already applies to trade
   items and NPCs)?
2. If yes — name the sheet and the boss it could inform, and stop there
   this session; downloading and integrating a new asset is real
   copyright/attribution surface (see `assets/sheets/README.md`'s
   Copyright section) and is its own session's work once a source is
   picked, not something to rush through here.
3. If no for a given boss — write the one-sentence reason (this is what
   the objective's own done-condition asks for regardless of outcome).

## Done means
- A written answer for all six dungeon bosses (and a decision on whether
  minibosses are in scope), landed in `docs/ART-BACKLOG.md` or a new doc.
- If a usable sheet is identified for any boss, it is NAMED, not
  downloaded — no new file in `assets/sheets/` this session.
- No code changes are required for this to be a complete session; a
  finished writeup is the deliverable.
- STATE.md gets one new session-log row. If every boss comes back "no
  sheet applies, hand-drawn stays", that is a legitimate DONE state for
  the objective per its own wording — advance the rotation to #4 and say
  so plainly, the same judgement call #2 made for its own done-condition.

## Out of scope
- Downloading or integrating any new sheet — naming a candidate is the
  ceiling this session, per the copyright-surface reasoning above.
- Writing any part of `tools/rip-bosses.py` before a sheet is actually in
  `assets/sheets/` and its README entry is written.
- Touching `sprites-bosses.js` at all.
- Re-opening rotation #2 (art-provenance) — read STATE.md's Note on it,
  but do not act on it unless you have new evidence the call was wrong.
