# NPCs — objective #5, npc-detail

`docs/prompts/STATE.md`'s rotation item 5: "every NPC has a unique sprite
and >=2 dialogue states." This file is the census `tools/check-drift.mjs`'s
npc-detail section measures against — read straight off `MAPS` (every
`['npc', ...]`/`['trader', ...]` entity literal, overworld screens and
interiors alike), never typed by hand from `src/data/overworld.js`'s own
text. Regenerate this table from the metric, don't hand-edit around it.

**Dialogue states: already done, roster-wide.** All 22 named characters
have 2 or more reachable dialogue ids (`check-drift` reports 0 short).
Every ordinary townsperson has their original line plus an Essence-gated
second one (`src/data/story.js`'s own "second states" comment block);
every Coastwise Chain trader has a `waiting` line, a trade line, and an
`after` line (Ossa, who opens and closes the chain, has four). This half
of the objective's done-condition needs no further work.

**Unique sprite: 12 of 22 as of S61, up from 7.** S60 found 7 unique / 6
shared sprites covering 15 identities. S61 spent the three sprites that
were already extracted and sitting unused (`npc_elder`, `npc_zelda`,
`npc_brinewife` — see "Landed" below) rather than hand-drawing anything,
and checked each in-engine after. 10 identities across 4 groups remain.

## Sprite-reuse groups (current)

| Sprite | Shared by | Count |
|---|---|---|
| `npc_fisher` | Mirren (trader), the East Strand fisher (`fisher1`), Teel (trader) | 3 |
| `npc_child` | the village child (`villageChild`), Pell (trader), the Hearth child (`hearthChild`) | 3 |
| `npc_hood_blue` | Wick (trader), Sennit (trader) | 2 |
| `npc_salter_d` | the shore Salter (`shoreSalter`), Hulla (trader) — left alone, see below | 2 |

`npc_salter_d` is a different shape from the other three and should
probably stay shared: both entries spread the same `FOLK.salter` preset
(`src/data/overworld.js`'s own `FOLK` object) rather than a raw `sprite:`
field, and `story.js`'s own comment above `DIALOGUE` names this on
purpose — "the peoples of Thalassia... the Salters the pans" — with both
characters' own lines identifying them as Salters (`shoreSalter`:
"Salter, up from the pans"; Hulla's `timberSalter` waiting line: "Wood
comes ashore, we cut it..."). A shared clan hood for two members of one
people reads as a uniform. Not touched this session; still pending a
call from the person running these sessions, same as idle-art's
design-merit question got asked rather than assumed.

The other three groups (`npc_fisher`, `npc_child`, `npc_hood_blue`) are
generic-archetype reuse with no in-fiction framing — the real remaining
gap, 8 identities. `npc_fisher`'s 3-way collision (down from 4 after
Ossa moved to `npc_zelda`) needs at least one genuinely NEW extraction;
no further already-extracted, unused NPC sprite remains after this
session spent all three that existed.

## Landed — S61

Zero new art. Three sprites `tools/rip-npcs.py`/`tools/rip-races.py`
already extract but nothing had ever placed were assigned to break up
three collisions, one `sprite:` line each in `src/data/overworld.js`,
each checked in-engine afterward (`tools/shoot-rooms.mjs`, screenshotted,
compared against the old sprite for anything broken or unauthored — none
was; `test.mjs`'s "art coverage" check independently confirms zero
unauthored sprite names):

- `hearthWife` (houseHearth): `npc_villager2` -> `npc_brinewife` (fits —
  the name alone says "wife," and her own line is about the family home).
  Also fully resolved `npc_villager2`'s old collision with `villager2`.
- Ossa (houseNets, `ossaStart`): `npc_fisher` -> `npc_zelda`. Ossa is
  written as a woman throughout her own lines ("my grandmother rang it")
  but had been wearing the male-coded "blue-clad man" sprite; this fixes
  the mismatch as a side effect of fixing the collision. Also trims
  `npc_fisher`'s group from 4 identities to 3.
- `sandpiper` (houseSandpiper): `npc_villager` -> `npc_elder`. Fits —
  `sandpiper`'s own `after` state (`netMender`) addresses the player as
  "boy" while handing down advice, an elder's register. Also fully
  resolved `npc_villager`'s old collision with Dov.

## Full census

One row per placement. `type` is `npc` (a plain villager) or `trader` (a
Coastwise Chain link, `deals`-driven). `identity` is the field that
actually names the character in the data — `dialogue` for an npc, the
first `deals[].text` for a trader.

| Identity | Type | Sprite | Map / room | Dialogue states | Sprite unique? |
|---|---|---|---|---|---|
| `salterElder` | npc | `npc_hood_red` | overworld / 0,5,1 | salterElder, salterElderAfter | yes |
| `reefFisher` | npc | `npc_reefkin_r` | overworld / 0,9,2 | reefFisher, reefFisherAfter | yes |
| Wick (`wickTrade`) | trader | `npc_hood_blue` | overworld / 0,5,5 | woodChild, wickTrade, wickAfter | no — shares with Sennit |
| Corriwig (`corriwigTrade`) | trader | `npc_reefkin_d` | overworld / 0,9,5 | coralDiver, corriwigTrade, corriwigAfter | yes |
| `villager1` | npc | `npc_brine_d` | overworld / 0,4,7 | villager1, elder1 | yes |
| `villager2` | npc | `npc_villager2` | overworld / 0,4,7 | villager2, villager2After | yes |
| Mirren (`mirrenTrade`) | trader | `npc_fisher` | overworld / 0,5,7 | coastFisher, mirrenTrade, mirrenAfter | no — shares with `fisher1`, Teel |
| `villageChild` | npc | `npc_child` | overworld / 0,5,7 | villageChild, child1 | no — shares with Pell, the Hearth child |
| Pell (`pellTrade`) | trader | `npc_child` | overworld / 0,4,8 | coastChild, pellTrade, pellAfter | no — shares with `villageChild`, the Hearth child |
| `shoreSalter` | npc | `npc_salter_d` | overworld / 0,4,8 | shoreSalter, shoreSalterAfter | no — shares with Hulla (left alone, clan hood) |
| Hulla (`hullaTrade`) | trader | `npc_salter_d` | overworld / 0,5,8 | timberSalter, hullaTrade, hullaAfter | no — shares with `shoreSalter` (left alone, clan hood) |
| `fisher1` | npc | `npc_fisher` | overworld / 0,9,8 | fisher1, fisher1After | no — shares with Mirren, Teel |
| Sennit (`sennitTrade`) | trader | `npc_hood_blue` | overworld / 0,9,8 | sandpiperKid, sennitTrade, sennitAfter | no — shares with Wick |
| Yarrow (`yarrowTrade`) | trader | `npc_kelper_d` | overworld / 0,1,9 | bogWitch, yarrowTrade, yarrowAfter | yes |
| Teel (`teelTrade`) | trader | `npc_fisher` | overworld / 0,4,9 | stoneFisher, teelTrade, teelAfter | no — shares with Mirren, `fisher1` |
| Dov (`dovTrade`) | trader | `npc_villager` | overworld / 0,8,9 | wreckSurvivor, dovTrade, dovAfter | yes |
| `shopkeeper` | npc | `npc_shopkeeper` | houseShop / 0,0,0 | shopkeeper, shopkeeper2 | yes |
| `faroreHome` | npc | `npc_farore_0` | houseMaku / 0,0,0 | faroreHome, faroreHomeAfter | yes |
| `hearthWife` | npc | `npc_brinewife` | houseHearth / 0,0,0 | hearthWife, hearthWifeAfter | yes |
| `hearthChild` | npc | `npc_child` | houseHearth / 0,0,0 | hearthChild, hearthChildAfter | no — shares with `villageChild`, Pell |
| Ossa (`ossaStart`) | trader | `npc_zelda` | houseNets / 0,0,0 | ossaWait, ossaStart, ossaEnd, ossaAfter | yes |
| `sandpiper` | npc | `npc_elder` | houseSandpiper / 0,0,0 | sandpiper, netMender | yes |

## What's left

`npc_fisher` (Mirren/`fisher1`/Teel) and `npc_child` (`villageChild`/
Pell/`hearthChild`) each need at least one genuinely new extraction —
every already-extracted, unused NPC sprite was spent this session.
`npc_hood_blue` (Wick/Sennit) is the smallest remaining gap, 2
identities. Check `assets/sheets/oracle-seasons-npcs.png` (via
`tools/rip-npcs.py`'s own `find_sprites`, same tool this session used to
confirm the three reassigned sprites weren't placed anywhere) for a real
spare frame before reaching for `docs/ART-DIRECTION.md`'s hand-drawing
rules — extraction first, per CLAUDE.md. A first pass over the sheet's
fisher/child rows (this session, informal) found mostly walk-cycle
repeats of the same two archetypes plus unrelated soldier/Zora art in
the same neighbourhood, and one promising recolour-shaped candidate
(index 69 on the sheet's own reading order) worth a proper look — not
confirmed or extracted, flagged for whoever does this next rather than
rushed.
