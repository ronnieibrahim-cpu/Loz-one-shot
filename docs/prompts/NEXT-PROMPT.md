# Next session — item 7's bar no longer fits the game

## Read first
- `docs/prompts/STATE.md` — item 7, its LENS AMENDMENT, and the allowlist.
- `docs/prompts/LEDGER.md`, "Known and deliberately unfixed", the entry
  beginning "Rotation item 7 (item-reuse) has no task left" — all four item
  paragraphs, especially the Anchor's "S106 PROVED" text.
- `docs/NEXT-SESSION.md`, the S106 entry only.
- `tools/check-anchor.mjs`'s header, the swimming paragraph — the worked
  example of turning a suspicion into an assertion with a tripwire.

## Why this, now
Item 7 asks four items for `>=2 later dungeons` and `>=3 overworld screens`.
Two of the four are now known not to be able to meet it, for reasons in the
game rather than in any tool: the Lens may never gate a region (ITEMS.md), and
the Anchor can never gate a room the player can swim in (proved S106, asserted
every run). Both are at their true ceilings. The Bellows and the Reefseed have
not had the same treatment and may be in the same position. Grinding on the bar
as written cannot finish; the question is what the bar should say.

## The task
Give the Reefseed and the Bellows the treatment the Anchor got in S106: turn
each suspicion into an assertion the tool re-proves every run, or find the path
that is actually open. Take the Reefseed first; do the Bellows only if it is
still cheap afterwards.

- **Reefseed.** `tools/check-reefseed.mjs`'s `early` filter rejects a
  `reefseedRoom` in any dungeon below 5, reasoning the player cannot hold an
  item before the dungeon that grants it. That reasoning is sound and it caps
  the item at D6 alone, which is spent. Establish IN THE TOOL whether that is
  the real ceiling (as the Anchor's is) or an artefact of writing the filter as
  an index comparison when the question is about reachability.
- **Bellows.** `tools/check-bellows.mjs`'s overworld half wants a tile
  impassable in every mode at every sea while not `F.SOLID`. Whether the cone's
  `solidAt` line of sight should treat `F.PIT` as blocking is a MECHANIC
  question and is not yours — write down what it would take and stop there.

Then write one paragraph, at the top of your final message, recommending what
item 7's done-condition should become. Do not change the rotation yourself.

## Done means
- Each item's real ceiling is an assertion in its own checker with a message
  naming what would re-open it, not a comment — and you have shown it goes red
  by running it against a deliberately wrong input, the way S106 did.
- `node tools/check-anchor.mjs`, `node tools/check-lens.mjs`,
  `node tools/check-reefseed.mjs`, `node tools/check-bellows.mjs`,
  `node tools/test.mjs`, `node tools/check-drift.mjs`,
  `node tools/check-playthrough.mjs`.
- `npm run build`, with `dist/oracle-of-tides.html` committed.
- A person reads your recommendation paragraph and can decide in one sentence.

## Out of scope
- Changing `OBJECTIVE OF RECORD` or item 7's done-condition. You recommend; a
  human decides. That is the charter's own judgement-call rule.
- Deleting an assertion to make a number move. S106's whole value is that the
  filter was relaxed honestly and the wall turned out to be real.
- The Anchor's pre-item-half avenue (LEDGER, end of the Anchor paragraph). It
  redefines what "requires the Anchor" means and needs its own call.
- The `--lens` screenshot gap logged under S104. It needs a detour token.
- `check-hearts.mjs`, red on `main` since before S104 and unrelated.
