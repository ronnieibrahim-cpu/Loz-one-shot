# Next session — re-measure the bosses S143's growth moved

## Read first
- `docs/prompts/STATE.md` — the whole file (objective 10 is MET; the human
  names the next one, and this task stands until they do).
- `docs/prompts/LEDGER.md`'s "Settled at S143", "Settled at S135" and
  "Settled at S136" sections.
- `docs/NEXT-SESSION.md`, the S143 entry and the S135 entry.
- `docs/HANDOFF.md`'s first seven hard-won lessons.
- `tools/measure-boss-combat.mjs`'s header: how a route arena is set up.

## Why this, now
S143 grew D4 and D3, and the run now reaches every later fight on a
different random stream. Gloomtide was won with 8 of 28 quarter-hearts left
(17-19 at S139). The King needed TWO walk-rounds of the Stairhead to be won
(S142 needed one). A route that only works on a re-roll is the fragile part
of the run, and nobody has measured these fights since the growth.

## The task
Re-measure, over 13 seeds from each route door (never `--at=route`), every
boss and miniboss the S143 growth moved: Gloomtide and Bogmaw (D3), Wyverna
and the Ironknight (D4), Rootmaw and Thornvine (D5), the Tideshade, the
Brinehulk and Nereth (D6). Record the table in LEDGER. If any reads worse
than its S135/S136/S142 number, find why and fix it from the route (entry
wait, a heal on the way, a planned exit) before touching the fight; retune
a fight only with 13 seeds either side and damage, not hp. The target is
the King won from the Stairhead without the double walk-round in
`tools/playthrough-route.mjs`.

## Done means
- `node tools/measure-boss-combat.mjs` rows for all nine fights, 13 seeds.
- `node tools/check-playthrough.mjs` green to THE END with no deaths.
- `replay`, `test.mjs`, `check-bosses`, `check-respawn` green.
- `check-drift` OK; `npm run build` with `dist/` committed.
- A person plays the Ebb Cell and the Two Weights once and says whether
  the sign in each makes the answer clear.

## Out of scope
- Adding rooms to any dungeon; every dungeon is at its ladder size.
- The Bellows' "shove light enemies into pits" verb, which does nothing
  today (written up in NEXT-SESSION S143) — its own session.
- Push-block theme art; torrent direction art; the pause menu's look.
- Changing a boss's hp (phase thresholds re-roll the fight — S137).
- Routing the optional rooms; they are proved by their item checkers.
