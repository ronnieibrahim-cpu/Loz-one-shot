# Next session — audit enemy lessons against real code

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s S99 entry (newest) — the shape of bug this
  session hunts for more of: a `docs/ENEMIES.md` lesson that reads as
  true but isn't actually enforced anywhere in `src/`.

## Why this, now
S55 found that `urchin`'s "harmless on dry ground" lesson wasn't
actually true — its danger was never tide-gated, only its movement was
— and fixed it once the fix turned out to be a one-line reuse of an
existing engine flag (`e.harmless`, the same one `submerge()` already
toggles). That was found by accident, while comparing `urchin` against
other idle candidates, not by a deliberate audit. `docs/ENEMIES.md` has
21 other one-line lessons that have never been checked the same way —
each one is a specific, falsifiable claim about what the code actually
does, and this objective's rotation (#4, enemy-roster) is exactly the
one whose job is to keep that document honest.

## The task
1. For each of the 22 lessons in `docs/ENEMIES.md`'s table, read the
   enemy's real `ai()`/`hurt()`/spec fields in `src/data/enemies.js` (and
   `src/game/enemy.js` where a lesson depends on shared engine behavior,
   e.g. `shield`, `terrain`, `tideOnly`) and check whether the lesson's
   claim is actually enforced, not just plausible. Concrete things worth
   checking specifically, based on what tripped `urchin` up:
   - A claim of "harmless under condition X" — is contact damage actually
     gated (`e.harmless`/`e.dormant`/`hp`), or does only movement change?
   - A claim about aim/alignment ("only fires along its row/column",
     "aims at you") — does the actual `shoot()`/`shootRing()` call pass
     `aim: true`/`false` and the direction logic match the claim?
   - A claim about a shield's coverage ("shielded from the front only")
     — does `hurt()`'s shield check actually match the enemy's `dir`
     logic the way the lesson implies?
   - A claim tied to the tide (`jellyfish`'s drift speed, `octorokSea`'s
     tide-gated existence) — read the actual thresholds, don't assume
     they match the prose.
2. For anything that reads as true, move on — this is an audit, not a
   rewrite. Do not touch lessons that already check out.
3. For each real mismatch found, decide the SAME way S55 did: if the fix
   is small and reuses an existing engine mechanism (a flag already read
   elsewhere, like `e.harmless` was), fix it in this session and verify
   in-engine with a scratch probe. If it would need new engine concepts,
   new art, or a design decision, do NOT fix it — record it as a finding
   in `docs/NEXT-SESSION.md` (three lines, per the charter's own rule 5)
   and move to the next enemy. Do not spend the session's whole budget on
   one hard case.
4. After the audit, run the full regression sweep on whatever changed:
   `validate.mjs`, `test.mjs` (83/83), `check-feel.mjs`,
   `check-motion.mjs`, `check-playthrough.mjs` (21/21), `replay.mjs`
   (51/51), `check-rippers.mjs`, `check-build.mjs`.

## Done means
- All 22 lessons have been read against the real code at least once
  this objective's life (say so plainly if some were already checked in
  an earlier session and skip re-deriving them).
- Every mismatch found is either fixed-and-verified-in-engine, or
  recorded as a named finding for later — never silently dropped.
- Every checker in step 4 passes; `dist/oracle-of-tides.html` rebuilt
  and committed if anything in `src/` changed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- Rewriting a lesson's WORDING for style — only fix a lesson that is
  factually wrong about what the code does.
- Any of the 8 idle candidates S55 already ruled out, or the 5
  structurally-blocked `attack` cases (S52/S97) — both closed
  investigations, not to be reopened here.
- A fix that requires inventing a new engine mechanism, new hand-drawn
  art, or a design decision — name it and move on, per step 3.
- Any change to enemy damage, hp, or speed values beyond what a found
  mismatch's fix requires.
