# Next session — make the tideshade affordable

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/prompts/QUEUE.md` item 0 — the east wing, and what it costs.
- `docs/prompts/LEDGER.md`'s "Settled at S125" and "Settled at S124" sections.
- `docs/NEXT-SESSION.md`, the S125 entry only.
- `src/data/bosses.js`'s `tideshade`, and `tools/actor-runtime.mjs`'s `dBoss`.

## Why this, now
Three rooms of the last dungeon have never been played and exactly one thing
stands in front of them: the tideshade costs about twenty-five quarter-hearts
and the run reaches floor 1 of the Abyssal Keep on twenty-seven. Measured in
both wing orders at S125 — it kills the run on twenty-six and on nineteen. The
Keep's health is not the problem any more; the fight is. Behind it are the
level-2 Cleats and the Keep's Lens fork, both unplayed.

## The task
Find out WHY the tideshade costs twenty-five and make it cost less, in that
order. `node tools/measure-boss-combat.mjs d6 --qh=27` will not reach it (that
table fights Nereth), so measure it the way S113 and S114 measured Gloomtide:
read the damage hit by hit and find out what is actually landing. The two
candidates named by its own definition are the ink spread it casts every 120
frames and the submerge cycle in its second phase, which the swordsman may be
swinging at while it is down. If the answer is the VERB, fix `dBoss`; if the
answer is the FIGHT, `src/data/bosses.js`'s `tideshade` is the one file to
touch, and say in the commit which it was.

## Done means
- The tideshade beaten at 27 quarter-hearts or fewer, measured and stated.
- If it is beaten, the east wing added to `tools/playthrough-route.mjs` and
  `node tools/check-playthrough.mjs` green, ending in `d6/1,3,1` with six
  Essences and `cleats` at level 2 in the audit.
- If it is NOT beaten, the measurement written into `docs/NEXT-SESSION.md`
  with the hit-by-hit numbers, and nothing else changed.
- `node tools/check-drift.mjs`, `node tools/test.mjs`, `node tools/replay.mjs`,
  `node tools/check-bosses.mjs`, `node tools/check-lens.mjs`,
  `node tools/check-cleats.mjs`, `node tools/check-charms.mjs`.
- `npm run build` with `dist/oracle-of-tides.html` committed.
- A person reads the room table and sees Tideshade Hall in it.

## Out of scope
- Another fairy, another heart, another heart piece, anywhere. The Keep has two
  heals and that is settled; this task is about what the fight costs.
- The Barnacle Skin. Measured twice and it is not worth a re-tune.
- Giving the Brinehulk `drops: 'rich'`. It loses the game. Settled at S124.
- Weakening Nereth or the Brinehulk. Neither is in the way.
- Auditing the 460-frame fuse on every placed pickup. Written down, not this.
