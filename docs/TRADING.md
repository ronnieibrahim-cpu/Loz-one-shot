# The Coastwise Chain

The trading sequence. Eleven traders, eleven objects, one reward: the
**Resonance Rod**, from the Maku Tree, for the rope off the old Tide Bell.

## What it is about

Thalassia's sea takes something off one person twice a day and puts it down in
front of another. Nobody on this coast has ever got their own property back
except by walking it round. The chain is that circulation done deliberately,
by hand, once — which is why it starts and ends with the same woman and the
same kettle, and why every object in it is a working tool that is useless to
whoever the water left it with. A cracked float is worthless to the net-mender
who needs it to float and perfect for the boy who needs something to sink.

Nothing in the chain is a treasure until the last link. That is the point of it.

## The links

Stage 1 is the only one that asks for nothing, and stage 12 is the only one
that hands over a real item. Every other link takes exactly what the previous
one gave — `tools/check-trade.mjs` proves that off the placed data rather than
off this table, so this table is a description and the entities are the truth.

| # | Who | Where | Takes | Gives |
|---|---|---|---|---|
| 1 | Ossa, the net-mender | The Net-mender's (village, off `0,4,8`) | — | Cracked Float |
| 2 | Pell | Village Shore `0,4,8` | Cracked Float | Crab Claw |
| 3 | Hulla, a Salter | Driftwood Strand `0,5,8` | Crab Claw | Salt Brick |
| 4 | Mirren, a fisher | Village East `0,5,7` | Salt Brick | Smoked Eel |
| 5 | Dov, off the wreck | Wrecked Hull `0,8,9` | Smoked Eel | Sounding Lead |
| 6 | Sennit | Sandpiper Row `0,9,8` | Sounding Lead | Ringing Whelk |
| 7 | Corriwig, a diver | Coral Hollow `0,9,5` | Ringing Whelk | Slackwater Pearl |
| 8 | Wick, a Kelper | Wood Heart `0,5,5` | Slackwater Pearl | Bogwood Cup |
| 9 | Yarrow, the bog witch | Witch's Hollow `0,1,9` | Bogwood Cup | Jar of Brine-Jelly |
| 10 | Teel, off the stones | Fishing Stones `0,4,9` | Jar of Brine-Jelly | **Cold Kettle** |
| 11 | Ossa again | The Net-mender's | Cold Kettle | Bell-Rope |
| 12 | The Maku Tree | The Maku Tree (off `0,4,7`) | Bell-Rope *and one Essence* | **Resonance Rod** |

The kettle goes out with the tide from the village shore and comes back up on a
line two screens away, and the chain walks the entire coast to carry it that
distance. Nobody involved finds this strange.

## How it is built

- One entity type, `trader` (`src/game/objects.js`), holding a list of **deals**.
  A deal is live when the chain's stage counter is sitting exactly one short of
  it, so **there is exactly one live deal in the whole world at any moment** —
  a trader two links ahead has nothing to say to you yet even if you are
  holding what they will eventually ask for. That is what makes it a chain
  rather than a set of numbered errands.
- Deals live on the trader, so **one NPC can hold two of them**. Ossa is stages
  1 and 11.
- `wants` is asserted, not consulted. The stage counter decides; `wants` exists
  to be wrong loudly if the two ever disagree.
- State is `progress.trade = { stage, item }`, which was declared and saved and
  read by nothing for the whole life of the project before this.
- The objects are in `src/data/trade.js` and their icons in
  `src/data/sprites-trade.js`. **A trade item is not an inventory item**: it is
  never in `progress.items`, has no level, no verbs and no button, and is not in
  `docs/ITEMS.md`'s roster — which `tools/check-items.mjs` asserts the item
  registry matches exactly, so putting one there would fail that tool.
- The Quest screen is the only place to look up what you are carrying. There is
  no room for it in the item grid and putting it there would offer to equip it.
- Every trader keeps the flavour line they had before the chain existed as their
  `waiting` line, so the coast sounds exactly the same to a player who never
  starts it.

## The one thing that could quietly break it

**The Rod opens the Salt Pans** (`saltVane`, `docs/ITEMS.md`), so the chain
that produces the Rod must be completable without it. A link placed inside the
Pans would be a gate holding its own key — circular, silent, and invisible to
every other checker in the repo, because none of them knows the chain exists.
`tools/check-trade.mjs` floods the overworld tile by tile from the village with
**bombs only** and asserts every link can be stood next to, and separately that
no link is on a screen the vanes seal.

Bombs are the chain's one item gate: Yarrow is in the Marsh, and the Marsh opens
to bombs, which come out of the Coral Spire — which is not gated.

## What proves it

`node tools/check-trade.mjs`, and it is in two halves on purpose. The offline
half proves the chain is a total order with no gap, fork or cycle, that every
object exists and is used exactly once, that every line it can say exists, and
the reachability above. The in-engine half **plays it**: it talks to all eleven
traders in order with the real entity, the real dialogue box and the real grant,
checks that a link whose turn has not come trades nothing and still speaks, that
a spent link cannot be run twice, that the Maku Tree refuses the rope until an
Essence is in hand — and then takes the Rod that comes out of the far end down
to the Abyssal Keep's Colonnade of the Drowned and rings the grate the whole
chain was built to justify.
