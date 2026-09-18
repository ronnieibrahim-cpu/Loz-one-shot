# Next session — get the run through Gloomtide

## Read first
- `docs/prompts/STATE.md` — the whole file. The objective of record is new.
- `docs/NEXT-SESSION.md`, the S112 entry only. Its route notes are the
  difference between a working directive and a wasted run.
- `tools/playthrough-route.mjs`'s `GOAL` block and its last forty lines.
- `src/data/bosses.js`, the `gloomtide` entry and `gloomCurrent` beneath it.
- `src/data/caves.js`, the one chest with `needEssences: 4`.

## Why this, now
D3's three structural blockers are fixed and the actor can be walked from the
Sanctum's mouth to the boss door. One thing stops it: Gloomtide has 36 hp, it
drags the sea back to MID every 420 frames, and the player arriving in order
holds sword 1 — the L2 sword is gated behind four Essences. The actor ground
the boss to half in eighteen thousand frames. The committed route still ends
at `d2/1,3,1`, so nothing has changed about what the repo can claim.

## The task
Decide the Gloomtide fight, then commit the D3 route.

First, put ONE question to the human, because boss tuning is a design call:
the fight is unwinnable in order — should the sword gate move earlier, should
Gloomtide's hp or its `forceTide` come down, or should the actor learn to
re-sound the conch mid-fight (a `dBoss` change, not a game change)? Offer the
third first: it changes no design and `measure-boss-combat.mjs` can prove it.

Then extend `tools/playthrough-route.mjs` from the Coral Spire to D3's
Essence: the overworld leg to the Sanctum's mouth at `overworld 1,8`, the
interior, and the fight. Move `GOAL` to `essences: [1,2,3]`, room `d3/0,3,1`,
and raise `keysNeeded`/`keysObtainable` to match the three Small Keys.

## Done means
- `node tools/check-playthrough.mjs` green with the run ending in D3's arena
  holding three Essences, and `node tools/replay.mjs` green with it.
- `node tools/check-drift.mjs`, `node tools/test.mjs`, `node tools/walk-dungeons.mjs`,
  `node tools/check-cleats.mjs`, `node tools/check-bosses.mjs`.
- `npm run build` with `dist/oracle-of-tides.html` committed.
- A person reads the health table `check-playthrough` prints and sees the run
  leave the Sanctum alive with a margin, not on its last quarter-heart.

## Out of scope
- `capsForDungeonIndex` granting swim to the room that hands the Cleats over.
  It is named in S112 and it is a whole session of its own — every dungeon's
  flood shifts under it.
- `check-hearts`'s two failures. They have waited longer than this objective
  has existed and they are still not on the allowlist.
- D4 and anything past it. One dungeon a session is the objective's own rule.
- Re-tuning any boss before the human has answered the question above.
- Re-recording a replay baseline to make a red run green without first proving
  the new behaviour is the behaviour you meant.
