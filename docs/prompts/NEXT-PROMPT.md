# Next session — teach the actor to stop touching bosses

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/NEXT-SESSION.md`, the S113 entry only. Its sweep table is the reason
  this task is what it is, and re-deriving it costs a session.
- `tools/actor-runtime.mjs`'s `dBoss` directive, all of it.
- `tools/measure-boss-combat.mjs`'s `FIGHTS` table and its `--seed` note.

## Why this, now
Gloomtide is already softened — hp 28, the MID current down to 1.25, the tide
grab out to 660/540 — and the run still cannot be driven through it. The sweep
in S113 measured eight boss configurations against the same ten fights and
found a cliff, not a slope: everything from 16 to 36 hp wins 0-3 of 10, and
hp 28 scored worse than hp 36 on identical points. The actor takes a contact
hit roughly every 200 frames whatever the boss does, at four quarter-hearts
each, so it dies near frame 1000. That is the actor, not the boss.

## The task
Make `dBoss` keep its distance. It currently closes and stays closed; the
contact hits it takes are its own blunders, not the boss cornering it. Give it
a retreat: after a swing connects, back off past the boss's body radius before
approaching again, and do not approach at all while the boss is charging.

Change `tools/actor-runtime.mjs` only. This changes no game data and no design.

Then re-run the same ten fights for d3 — seeds 20260806, 31337, 777, 4242,
99991 at `--tide=0` and `--tide=1` — and report the win count against S113's
`hp 28 / 1.25  0 of 10`. Also fix d4's `sword: 2` to `sword: 1` in the `FIGHTS`
table: at D4 the player holds three Essences and the L2 cave wants four.

## Done means
- `node tools/measure-boss-combat.mjs d3` wins a clear majority of those ten
  fights, with the before/after counts written into `docs/NEXT-SESSION.md`.
- `node tools/check-playthrough.mjs` and `node tools/replay.mjs` still green —
  the committed route runs through `dBoss` twice and both fights will re-time.
- `node tools/check-drift.mjs`, `node tools/test.mjs`, `node tools/check-bosses.mjs`.
- `npm run build` with `dist/oracle-of-tides.html` committed.
- A person reads the two health tables side by side and sees the actor finish
  the fight with hearts left rather than scraping in.

## Out of scope
- Weakening Gloomtide any further. S113 measured that road to its end: the
  only boss this actor beats reliably is a 14 hp one, weaker than five of the
  minibosses in the same file.
- Moving the L2 sword's `needEssences: 4` gate. The human declined it.
- Extending `tools/playthrough-route.mjs` into D3. The fight has to be winnable
  by the harness before the route through it is worth authoring.
- `check-hearts`'s two failures, still not on the allowlist.
- Re-recording a replay baseline to make a red run green before proving the new
  behaviour is the behaviour you meant.
