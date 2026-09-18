# Next session — the Anchor's three early overworld screens

## Read first
- `docs/prompts/STATE.md` — item 7, the note at the top, and the file allowlist.
- `docs/NEXT-SESSION.md`, the S109 entry only.
- `tools/check-anchor.mjs`'s header and its `late` filter — what a gate has to
  prove, and why a dungeon from D3 on cannot hold one.
- `docs/prompts/LEDGER.md`, the "Measured and rejected" section's first two
  entries — the Bellows and the strands baseline are settled.
- `src/data/dungeons-a.js`, D1's declared `anchorGate` — the worked fixture.

## Why this, now
The Bellows met their half of item 7 at S109 and the Lens and Reefseed at S105
and S108. The Anchor is the only item left, and it is short on both halves: 1
of 5 dungeons and 0 overworld screens. Its dungeon half cannot move — from D3
on the player swims, so base HIGH already reaches anywhere an anchor could, and
`check-anchor` fails any such declaration by design. D2 is the only dungeon
between, and it already holds the one. So the overworld half is the whole job.

## The task
FIRST, put one question to the human and wait: **the Anchor's dungeon half is
capped at 1 by the game's own rules — should it be amended the way the Lens was
at S104, so the Anchor is done at 1 dungeon plus 3 overworld screens?** Nothing
else can close objective 7.

While waiting, do the half that does not depend on it: author THREE overworld
`anchorGate` screens in `src/data/overworld.js`, in regions the player crosses
BETWEEN D1 AND D3 — Dunes, Tidewatch, Marsh — so the crossing is made on foot,
which is the only model `check-anchor` can honestly prove outdoors. Copy D1's
declared gate rather than inventing one. Take `check-drift` to
`anchor ... overworld screens: 3`.

## Done means
- `node tools/check-anchor.mjs` — each new screen passes both clauses, and D1's
  and D2's rooms still pass.
- `node tools/check-drift.mjs` reads `anchor ... overworld screens: 3`.
- `node tools/validate.mjs`, `node tools/check-overworld.mjs`,
  `node tools/check-progression.mjs`, `node tools/check-strands.mjs`,
  `node tools/check-placement.mjs`, `node tools/check-ground.mjs`,
  `node tools/check-gates.mjs`, `node tools/check-items.mjs`,
  `node tools/test.mjs`, `node tools/check-playthrough.mjs`.
- `npm run build`, with `dist/oracle-of-tides.html` committed.
- A person looks at `node tools/shoot-rooms.mjs --tide=1 overworld,<key>` of
  each screen and can see what the held patch is for.

## Out of scope
- A fourth outdoor Bellows wheel, or a MID one. The Bellows met their number at
  S109 and the LEDGER says why a MID outdoor fixture cannot exist.
- An anchor gate in any dungeon from D3 on. `check-anchor`'s `late` filter
  fails it, and it is right to: base HIGH already goes everywhere.
- Opening a way into a sealed Bellows shelf to quiet `check-strands`. That
  breaks clause 6, which is the fixture. The baseline entry is the answer.
- `check-hearts`' two standing failures (23 heart pieces; D5 holds 1, not 2),
  and the three outdoor wheels all paying the same gold rupee, which waits on
  them. Both predate this objective and need a detour token.
- Guessing the amendment answer and declaring objective 7 closed on it.
