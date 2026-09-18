# Next session — route the run to the Keep's door

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/NEXT-SESSION.md`, the S117 entry only. It has the `reefseed` verb's
  contract and the four things the D5 leg paid for by hand.
- `docs/prompts/LEDGER.md`'s "Settled at S117" section.
- `tools/check-trade.mjs`'s header, for what the Coastwise Chain is and what
  order it has to be walked in.
- `tools/playthrough-route.mjs`'s tail — the D5 section and the `GOAL` block.

## Why this, now
The route reaches `d5/0,3,1` with five Essences of six, on 44 of 44
quarter-hearts and no death. What is left is one dungeon, and it is the one
that cannot be entered by walking: the Abyssal Keep's door is at overworld
`0,1,0`, behind the Salt Pans, and the Keep's own Colonnade of the Drowned is
sealed by a `dGrate` that only the Coastwise Chain's Resonance Rod retracts.
So the Chain is not optional colour — it is D6's key, and nothing has ever
played it in a real run.

## The task
Extend `tools/playthrough-route.mjs` from Rootmaw's arena to the moment the
run is standing inside the Abyssal Keep's mouth room holding the Resonance
Rod. Walk out of the Shrine, cross to whatever opens the Salt Pans, play the
Coastwise Chain end to end in the engine, and enter `d6` at `0,3,7`. Leave the
Keep's interior alone — that is the session after this one, and it is stubbed
in `docs/prompts/QUEUE.md`.

Then raise `GOAL.room` to `d6/0,3,7`, leave `GOAL.essences` at `[1,2,3,4,5]`,
and set `GOAL.keysNeeded`/`keysObtainable` to what the run actually spends.

Every trade in the Chain is a two-sided conversation with an NPC, and the
actor has no directive for one. If that needs a new verb in
`tools/actor-runtime.mjs`, name the STATE it reaches the way `tide`, `soles`,
`bellows` and `reefseed` do — the object that changed hands, read back out of
`progress` — never a count of button presses and never a frame count that is
really a copy of `trade.js`.

## Done means
- `node tools/check-playthrough.mjs` green, ending in `d6/0,3,7`, with its own
  output naming the Resonance Rod among the things the run acquired.
- `node tools/check-drift.mjs`, `node tools/test.mjs`, `node tools/replay.mjs`,
  `node tools/check-trade.mjs`, `node tools/check-overworld.mjs`,
  `node tools/check-progression.mjs`.
- `npm run build` with `dist/oracle-of-tides.html` committed.
- A person reads the trace and sees the run leave the Shrine, pass every link
  of the Chain in order, come out the far end with the Rod, and walk into the
  Keep with hearts to spare.

## Out of scope
- The Abyssal Keep's interior, its two floors, its Dredge Line and Nereth.
  That is one task and this is another; the stub is in `QUEUE.md`.
- Teaching `dFight` to beat a shielded enemy. Four enemies and four sessions
  have now been answered by walking past them, it is written down, and a
  change to the verb every fight shares re-sweeps every recorded frame.
- Teaching `dFight` a radius so a wide room can be cleared without crossing
  it. Same argument, same file.
- Retuning any boss's health, speed or tide grab.
- Any art, terrain or dialogue finding the crossing turns up — three lines in
  `docs/NEXT-SESSION.md` and keep going.
- `check-hearts`'s two failures, still not on the allowlist.
