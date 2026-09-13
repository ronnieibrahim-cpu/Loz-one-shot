# Next session — decide idle art: re-audit sheets or stop

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/ENEMIES.md`'s "Idle states" section and its new "Audit" section
  (S56) — what is already ruled out and why, so this isn't re-derived.

## Why this, now
S53-S55 scoped and piloted `idleFrame`, landing it on `urchin` only; the
other 8 candidates (`beamos`, `barnacle`, `wizzrobe`, `siren`, `keese`,
`zol`, `tektite`, `pincer`) were judged against `urchin`'s own bar (does a
distinct pose teach something new) and none cleared it, independent of
whether art exists. S56 then audited all 22 `docs/ENEMIES.md` lessons
against the real code (not just `idle`) and found two real bugs (`beamos`
aim, `leever` timing) plus one wrong doc line (`anglerfry`), all fixed in
that same session. `check-drift.mjs` still reports 0 of 22 with the full
5-state set — objective #4 is not done, and the only lever left is
`idle`, since `walk`/`attack`/`hurt`/`death` are as complete as they can
get without new engine concepts.

## The task
Make an explicit, written decision on `idle`'s remaining 8 candidates,
rather than leaving it an open lead session after session:
1. Either do a genuine sheet RE-AUDIT for one or more of the 8 (not a
   repeat of S53's already-done search — look for anything S53 might have
   missed, or accept its "zero unclaimed frames" finding stands), OR
2. Conclude in writing that `urchin` is the only `idle` this roster is
   getting, and that objective #4 rotates on WITHOUT full 5-state
   coverage — i.e. surface to the user (per the charter's "one judgement
   call" section) that the done-condition as written may be unreachable
   without new hand-drawn art across 8 enemies, and ask whether that's
   worth doing.
Do not re-run S53/S55's own search a third time without a stated reason
the prior two passes could have missed something.

## Done means
- A written decision exists in `docs/ENEMIES.md` (or a clear escalation in
  this session's final message per the charter) — not a third repeat of
  the same scoping pass.
- If any art or wiring lands, it is verified in-engine with a scratch
  probe the way `urchin`'s was, and the full regression sweep passes:
  `validate.mjs`, `test.mjs` (83/83), `check-feel.mjs`, `check-motion.mjs`
  (8/8), `check-playthrough.mjs` (21/21), `replay.mjs` (51/51),
  `check-rippers.mjs` (17/17), `check-build.mjs`.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- Re-litigating `urchin`'s own pilot (S54) or its `harmless` fix (S55) —
  both closed and verified.
- Any of the S52/S97 structurally-blocked `attack` cases (`crab`, `gel`,
  `urchin`, `jellyfish`, plus `leever` ruled out at S97) — closed
  investigation, not to be reopened.
- Re-running S56's full 22-lesson audit again — it is done; only act on a
  SPECIFIC new claim if one surfaces, not a repeat sweep.
- A fix that requires inventing a new engine mechanism, new hand-drawn
  art without a stated reason, or a design decision beyond `idle` itself.
