# Next session — find every fight the route arms wrong

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/prompts/LEDGER.md`'s "Settled at S126" section.
- `docs/NEXT-SESSION.md`, the S126 entry only.
- `tools/actor-runtime.mjs`'s `dFight` and `dBoss`, at `slotBit('sword')`.

## Why this, now
S126 cost eight full runs to a fault nothing in the repo could report: the
route had left the Dredge Line on A, the sword was in neither slot, and
`dBoss`'s `slotBit('sword') || BIT.b` fell through to B — so the swordsman
fought a miniboss by blowing a conch at it, and every directive reported
success. That room was found by accident. There are nineteen other `fight` and
`boss` directives in the route and nothing has ever asked what any of them is
holding.

## The task
Make an unarmed fight impossible to ship. Two halves, in this order.
1. In `tools/actor-runtime.mjs`, make `dFight` and `dBoss` REFUSE rather than
   fall back: if the sword is on neither button when the verb starts, throw,
   naming the room. `BIT.b` as a default is a guess dressed as a fallback.
2. Run `node tools/check-playthrough.mjs` and fix every route step the refusal
   catches, by putting the sword back on A where it belongs. Expect the frame
   shift to move things downstream; a fight that regresses regressed because
   its timing moved, not because it got harder.

## Done means
- `node tools/check-playthrough.mjs` green, ending in `d6/1,3,1` with six
  Essences and its deepest trough still outside the Abyssal Keep.
- Every fight the refusal caught named in `docs/NEXT-SESSION.md`, with how many
  there were. Zero is a real and reportable answer.
- `node tools/check-drift.mjs`, `node tools/test.mjs`, `node tools/replay.mjs`,
  `node tools/check-bosses.mjs`, `node tools/check-items.mjs`.
- `npm run build` with `dist/oracle-of-tides.html` committed.
- A person reads the commit and learns how many fights were being thrown
  bare-handed.

## Out of scope
- Turning `breakContact` on for any fight other than the tideshade. It loses
  Anemos. Settled at S126.
- Weakening any enemy or boss. Nothing is too strong; the swordsman was unarmed.
- Another fairy, heart or heart piece anywhere.
- Backing the swordsman off a submerged boss. Tried at S126 and it never fires.
- Auditing the 460-frame fuse on every placed pickup. Written down, not this.
