# Next session — route the run through Dungeon 5

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/NEXT-SESSION.md`, the S116 entry only. It has the `bellows` verb's
  contract and the three findings the D4 leg paid for by hand.
- `docs/DUNGEON-STATUS.md`'s D5 row, for what the Drowned Wood Shrine holds
  and which room hands over the Reefseed.
- `tools/playthrough-route.mjs`'s tail — the D4 section and the `GOAL` block.
- `tools/check-reefseed.mjs`'s header, for what a snarl actually requires.

## Why this, now
The route reaches `d4/0,3,1` with four Essences of six, on 35 of 36
quarter-hearts and no death. D5's door is at overworld `0,5,4`, which
`check-progression` puts in round one — so the walk there is open ground and
the dungeon is the work. The Reefseed is a THROW that grows where it lands,
which is the Anchor's shape rather than the Bellows', and the actor's
`anchor` verb already knows how to verify a landing tile instead of
predicting one.

## The task
Extend `tools/playthrough-route.mjs` from Wyverna's arena to the Drowned Wood
Shrine's Essence. Walk out of D4, cross to the Shrine's mouth, take its keys
and the Reefseed, grow its stakes, and claim the fifth Essence. Then raise
`GOAL.essences` to `[1, 2, 3, 4, 5]`, `GOAL.room` to the Shrine's boss room
and `GOAL.keysNeeded`/`keysObtainable` to what the run actually spends, and
re-record with `node tools/check-playthrough.mjs --record`.

A seed grows a pillar where it lands and a pillar can seal a room shut. If
that needs a new verb in `tools/actor-runtime.mjs`, name the state it reaches
the way `tide`, `soles` and `bellows` do — never a count of presses, and
never a frame count that is really a copy of room data.

## Done means
- `node tools/check-playthrough.mjs` green with five Essences taken, and its
  own output naming the Shrine's boss room as where the run now ends.
- `node tools/check-drift.mjs`, `node tools/test.mjs`, `node tools/replay.mjs`,
  `node tools/walk-dungeons.mjs`, `node tools/check-dungeon-strands.mjs`,
  `node tools/check-reefseed.mjs`.
- `npm run build` with `dist/oracle-of-tides.html` committed.
- A person reads the trace and sees the run enter the Shrine, come out with
  the Reefseed, grow a stake across open water, and finish the fight with
  hearts left.

## Out of scope
- Fixing `dFight` so it can kill a shielded patroller. Three enemies and
  three sessions have now been answered by hand; it is written down, and a
  change to the verb every fight shares re-sweeps every recorded frame.
- Bog Causeway's south lobe, which promises a route the player's own box
  cannot take. Three lines in `docs/NEXT-SESSION.md` and keep going.
- Retuning any boss's health, speed or tide grab.
- Any art or terrain finding the crossing turns up.
- `check-hearts`'s two failures, still not on the allowlist.
