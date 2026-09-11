STANDING SESSION CHARTER — Oracle of Tides. Run this verbatim each session.
Do not edit this prompt. Everything that changes lives in the files below.

FIRST SESSION ONLY: if docs/prompts/CHARTER.md does not exist, your entire task
is to create the three artifacts in SETUP and stop. Do no game work.

======================= SETUP (first session) =========================

A) tools/check-drift.mjs — plain Node, no browser. Prints one table and exits
   non-zero only if the SELF-CHECKS fail. It measures, it does not judge.
   Metrics:
     - sized rooms by size across all dungeons (count of 1x1/2x1/1x2/2x2/3x1)
     - per-item capability reuse: for each of the six dungeon items, how many
       DUNGEONS other than its own and how many OVERWORLD SCREENS require it.
       Measure by capability, not by string: deep water needs the Cleats,
       F.SNAG tiles and tiles with a `dredge` action need the Line, tiles with
       a `ring` action need the Rod, BOMBABLE needs Bombs. Reuse the engine's
       own tile/flag lookups; never re-derive collision.
     - feel.js constants by tag: measured / derived / guessed. Count TAGS in
       the provenance position, not the words in prose.
     - region rooms audited: read docs/AUDITED-ROOMS.md, count per region
       against the total rooms in that region.
   SELF-CHECKS (these are what make it exit non-zero):
     - docs/prompts/NEXT-PROMPT.md is <= 150 lines
     - docs/prompts/NEXT-PROMPT.md contains exactly one `## The task` heading
     - docs/prompts/STATE.md is <= 60 lines
     - STATE.md's last two session rows are not both `detour`
   Add it to CLAUDE.md's verification table. A session cannot end green
   without it.

B) docs/prompts/STATE.md — the only file that carries state between sessions.
   Hard cap 60 lines; when it overflows, delete oldest rows, never summarize.
     OBJECTIVE OF RECORD: <one of the four below>
     ROTATION (fixed, do not reorder):
       1 wide-rooms      — done when 4 of 6 dungeons have a 2x2 or 3x1
       2 region-art      — done when 90 of ~90 overworld rooms are in
                           docs/AUDITED-ROOMS.md with a verdict
       3 item-reuse      — done when every dungeon item is required in >=2
                           later dungeons and >=3 overworld screens
       4 feel-measure    — done when >=40 feel.js constants are tagged
                           `measured` against the emulator
     FILE ALLOWLIST for the current objective: <explicit paths>
     DETOUR TOKENS: 1
     SESSION LOG: one row per session — `S## | objective|detour | one line`

C) docs/AUDITED-ROOMS.md — one line per overworld room: key, name, date, and a
   one-sentence verdict. Empty at setup except the header.

====================== EVERY SESSION AFTER =========================

1. Branch from the current tip of main. One session = one branch. No PR unless
   asked. `git ls-remote --heads origin` for a branch that already did this.

2. Run `node tools/check-drift.mjs`. Paste its table into your first message.
   If a self-check fails, FIXING THAT IS THE WHOLE SESSION. A 200-line prompt
   or an overflowing STATE.md is a defect with the same standing as a red test.

3. Read, and nothing else: CLAUDE.md, docs/prompts/STATE.md,
   docs/prompts/NEXT-PROMPT.md, docs/prompts/LEDGER.md (only the section for
   the area you are touching). You may read at most TWO docs/NEXT-SESSION.md
   entries. If NEXT-PROMPT.md tells you to read more than two, that is the
   defect from step 2 — trim it and proceed.

4. Do the task in NEXT-PROMPT.md's `## The task`. Only that. Touch only files
   on STATE.md's allowlist for the current objective.

5. WHEN YOU FIND SOMETHING OFF-PLAN — a bug, a better idea, a rabbit hole:
   write it as three lines in docs/NEXT-SESSION.md and KEEP GOING. Do not
   chase it. Spending a session on it requires a DETOUR TOKEN: decrement it in
   STATE.md, log the row as `detour`, and a token regenerates only after two
   consecutive `objective` sessions. Two detours in a row is forbidden and
   check-drift enforces it. If the token is spent, the finding waits.
   A correctness bug is not an exception. The game has shipped with worse for
   longer than this objective has existed.

6. FINISH. All of:
   - the checkers CLAUDE.md's table names for what you touched, plus
     check-drift, plus check-playthrough, plus `npm run build` with dist
     committed
   - append ONE row to STATE.md's session log; delete the oldest if over 60
     lines
   - if the objective's done-condition in STATE.md is now met, advance
     OBJECTIVE OF RECORD to the next rotation item and rewrite the allowlist
   - move anything you proved settled into docs/prompts/LEDGER.md. Negations
     go there. They never go in the prompt.
   - commit message says what changed in the game, not in the code

7. REWRITE docs/prompts/NEXT-PROMPT.md for the next session. This is the step
   that decays, so it is mechanical. Exactly these headings, nothing else,
   <=150 lines total:
       # Next session — <task in six words>
       ## Read first          (<=5 bullets, <=2 NEXT-SESSION entries)
       ## Why this, now       (<=5 lines; state, not story)
       ## The task            (one task, named files, named target)
       ## Done means          (the literal commands, plus what a person looks at)
       ## Out of scope        (>=4 bullets, naming this session's temptations)
   BANNED in that file, because each one regrew last time: any struck-through
   line; any "LANDED"/"DONE, do not redo" entry; any paragraph about the file's
   own reliability; any list of prior session numbers; any state table longer
   than six rows; the phrase "pick the first one or two".
   If your draft needs a heading not on that list, the task is too big — cut
   it in half and put the other half in QUEUE.md.

======================= THE ONE JUDGEMENT CALL ======================

You do not choose what to work on. Rotation and done-conditions choose. If you
believe the objective of record is wrong, say so in one paragraph at the top of
your final message and change nothing. I will decide.
