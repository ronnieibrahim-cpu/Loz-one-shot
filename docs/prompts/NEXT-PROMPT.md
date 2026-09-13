# Next session — give anglerfry a real deathFrame (the last one)

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s S86 entry (`siren_death`, the newest) — it
  flags that `anglerfry` is the LAST remaining `deathFrame` candidate.
  Read that entry's closing paragraph before doing anything else: this
  session finishes a sub-thread running since S26 (STATE.md's own
  numbering), and needs to leave the NEXT session a genuinely different
  task under objective #4, not "pick the next enemy" from a list that
  will be empty.

## Why this, now
Sixteen enemies have `deathFrame` already. `anglerfry` (hp 3, `terrain:
'water'`, `src/data/enemies.js`, "hangs in deep water, lunges when you
swim near") is the last one: `charge()` AI, `tideOnly: [1, 2]` — the same
general shape `octorokSea` (S80) and `jellyfish` (S79) already covered,
so this session is not expected to find a new mechanism, but check
properly anyway rather than assuming plainness — several "plain-looking"
targets in this thread turned out not to be.

## The task
1. Check `assets/sheets/oracle-seasons-enemies.png`'s own plate for
   `anglerfry_0`/`anglerfry_1` (boxes 43/44 per `tools/rip-enemies.py` —
   the comment there says this is a Cheep-Cheep substitution) for a
   collapse pose distinct from the two already used and from
   `anglerfry_hurt` (`sprites-enemies-hurt.js`). `pip install pillow`
   first if needed, and run `python3 tools/rip-enemies.py` once
   unmodified to confirm it still reproduces byte-identically before
   changing anything. Quantise and compare palettes directly for any
   candidate rather than trusting visual adjacency — `wizzrobe` (S83) and
   `siren` (S86) both found sheet-neighbours that turned out to be a
   different creature entirely.
2. If a real extra frame exists: add it to `FRAMES` in `tools/rip-enemies.py`
   and re-emit. Never hand-add a key to `sprites-enemies.js`.
3. If nothing extractable exists: add `anglerfry_death` to
   `ENEMY_HURT_ART` (`sprites-enemies-hurt.js`), following the same
   "reuse/squash the live frames, invent nothing" discipline recent
   sessions used.
4. Add the new sprite name to `sprite-manifest.js`'s `enemies` list (if
   hand-drawn).
5. Wire `deathFrame: 'anglerfry_death'` onto `anglerfry`'s `defineEnemy`
   call.
6. Verify in-engine:
   - Confirm `anglerfry` has no `z` field.
   - Non-lethal hit (hp 3 -> 1, `swordDamage()` 2) shows `anglerfry_hurt`
     and reverts correctly once the flicker window ends.
   - The lethal follow-up shows `anglerfry_death`, never
     `anglerfry_hurt`, held for the full `ENEMY_DEATH_FRAMES` stall, then
     `dead = true`.
   - `anglerfry` is `tideOnly: [1, 2]` — confirm the kill works the same
     at both tide levels it actually exists at, the same check
     `octorokSea` (S80) made.
7. Run `node tools/check-playthrough.mjs` and `node tools/replay.mjs`
   after everything else is green. `tektite` (S78) and `siren` (S86) both
   needed a replay re-record; `octorokSea`/`beetle`/`darknut`/`wizzrobe`/
   `pincer`/`moblin` didn't. Check rather than assume either way, and
   re-record whichever plan actually diverges
   (`node tools/replay.mjs --record <name>`) if one does.
8. **This is the last `deathFrame` target.** Once it's done, update
   `docs/ENEMIES.md`/`check-drift.mjs`'s own roster status mentally and
   write the NEXT-PROMPT.md for a genuinely different task under
   objective #4 (enemy-roster) — re-read the objective's own done
   condition in STATE.md (idle/walk/attack/hurt/death states, a one-line
   behavior spec per enemy, no two enemies teaching the same lesson) and
   figure out what's still missing now that every killable enemy has
   `walk`+`hurt`(where applicable)+`death`. `attackFrame` has no engine
   field yet (see `docs/prompts/LEDGER.md`) — deciding whether that's
   this thread's next real gap, or whether `docs/ENEMIES.md`'s one-line
   specs need auditing for the "no two enemies teach the same lesson"
   rule, is itself worth a paragraph in this session's own
   `docs/NEXT-SESSION.md` entry, even if it isn't fully resolved this
   session.

## Done means
- `anglerfry` shows a real collapse pose on the hit that kills it, proven
  by an in-engine probe, not by reading the code.
- `node tools/check-drift.mjs` shows `anglerfry: walk,hurt,death`.
- `node tools/validate.mjs`, `node tools/test.mjs` pass (83/83). If
  `sprites-enemies.js` changed, `node tools/check-rippers.mjs` is 17/17.
- `node tools/check-playthrough.mjs` is 21/21 and `node tools/replay.mjs`
  is 51/51 after this session's change, both confirmed by actually
  running them.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines) AND a clear statement that the deathFrame sub-thread is closed.
- NEXT-PROMPT.md (rewritten by this session, per the charter's own step 7)
  names a genuinely different task, not another enemy's `deathFrame`.

## Out of scope
- Any hand-wringing about which enemy comes "after" this one — there
  isn't one left. Don't invent a 17th `deathFrame` target that doesn't
  exist (`bubble`/`beamos`/`barnacle` are hp 999 and permanently out of
  scope, not secretly eligible).
- Fully redesigning `attackFrame` or auditing all 22 `docs/ENEMIES.md`
  lines in one sitting — naming the next real gap is in scope, closing it
  is a future session's work.
