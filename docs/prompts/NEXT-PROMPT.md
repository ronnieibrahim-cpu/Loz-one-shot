# Next session — route the run to the Keep's door

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/NEXT-SESSION.md`, the S117b entry only. It has the `trade` verb's
  contract, the twelve links by screen, and what the tour costs.
- `docs/prompts/LEDGER.md`'s "Settled at S117" section.
- `tools/check-trade.mjs`'s header, for what the Coastwise Chain is and what
  order it has to be walked in.
- `tools/playthrough-route.mjs`'s tail — the D5 section and the `GOAL` block.

## Why this, now
The route reaches `d5/0,3,1` with five Essences of six, on 44 of 44
quarter-hearts and no death. The Maku Tree's second beat is the hinge: at five
Essences she sets `makuOpenedKeep`, which is the only thing in the game that
opens the Keep's gate, and hands over the level-3 sword the Nereth fight is
measured against. What is left is one dungeon, and it is the one
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

`['trade', stage]` ALREADY EXISTS in `tools/actor-runtime.mjs` and is proved
through the first seven links in a scratch harness — nothing in the route
calls it yet. It names the stage and talks until `progress.trade.stage`
agrees, and it finds the link by asking the entities which of them holds the
live deal. It does not walk to the screen, deliberately. Read the S117b entry
before writing a directive: it has the twelve links by screen, the ordering
rule that makes a town link reliable, and the measured reason a `travel` of
three or more screens is where this run dies.

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
