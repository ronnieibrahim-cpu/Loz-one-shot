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

**Unique sprite: the open half.** 7 of 22 identities have a sprite nobody
else uses. 15 of 22 share one of 6 sprites with at least one other named
character — a real, specific gap, not the vague "give everyone their own
look" the rotation line alone would suggest.

## Sprite-reuse groups

| Sprite | Shared by | Count |
|---|---|---|
| `npc_fisher` | Mirren (trader), the East Strand fisher (`fisher1`), Teel (trader), Ossa (trader) | 4 |
| `npc_child` | the village child (`villageChild`), Pell (trader), the Hearth child (`hearthChild`) | 3 |
| `npc_hood_blue` | Wick (trader), Sennit (trader) | 2 |
| `npc_villager2` | the second Tidewatch villager (`villager2`), the Hearth wife (`hearthWife`) | 2 |
| `npc_salter_d` | the shore Salter (`shoreSalter`), Hulla (trader) | 2 |
| `npc_villager` | Dov (trader), Sandpiper Row's `sandpiper` | 2 |

Every group above is genuinely different PEOPLE, not one character placed
twice — each has its own name, its own dialogue ids, and (bar Dov/Ossa/
Teel/Mirren, who are stops on the Coastwise Chain and never on screen
together) no two ever appear in the same room. `npc_fisher` is the worst
case: four separate named characters read as the same person on sight.

**One of the six groups is a different shape from the other five, and
should probably be left alone.** `npc_salter_d` (`shoreSalter`/Hulla) is
the only group where both entries spread the same `FOLK.salter` preset
(`src/data/overworld.js`'s own `FOLK` object) rather than writing a raw
`sprite:` field — and `story.js`'s own comment block above `DIALOGUE`
names exactly this as deliberate: "the peoples of Thalassia... the
Salters the pans" — both characters' own dialogue lines identify them as
Salters (`shoreSalter`: "Salter, up from the pans"; Hulla's `timberSalter`
waiting line: "Wood comes ashore, we cut it..."). A shared clan hood for
two members of the same people reads as a uniform, not a mistake — worth
flagging to the person running these sessions before touching it, the
same way idle-art's design-merit question got asked rather than assumed.
The other five groups (`npc_fisher`, `npc_child`, `npc_hood_blue`,
`npc_villager2`, `npc_villager`) all use a raw `sprite:` field with no
clan framing — generic archetypes reused ad hoc, not a uniform. Those are
the real gap.

**Three sprites are already extracted and sitting completely unused**,
found by checking every name `tools/rip-npcs.py`/`tools/rip-races.py`
emit against every placement in `src/data/overworld.js`: `npc_elder` and
`npc_zelda` (`rip-npcs.py`, the same sheet as `npc_villager`/`npc_fisher`/
`npc_child`) and `npc_brinewife` (`rip-races.py`, alongside `npc_brine_d`/
`npc_brine_u`). None is placed anywhere in the game. This is
`docs/ENEMIES.md`'s idle-art situation in reverse: there, every spare
frame near a candidate was already claimed; here, real spare frames exist
and nothing has claimed them yet — reassigning one to break up a
same-sprite collision costs zero new art, only a one-line `sprite:` edit
per identity plus a fresh look confirming it reads right on that
character (`npc_brinewife` toward `hearthWife`/`villager2` is the
obvious first try — the name alone fits one of them).

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
| `villager2` | npc | `npc_villager2` | overworld / 0,4,7 | villager2, villager2After | no — shares with the Hearth wife |
| Mirren (`mirrenTrade`) | trader | `npc_fisher` | overworld / 0,5,7 | coastFisher, mirrenTrade, mirrenAfter | no — shares with 3 others |
| `villageChild` | npc | `npc_child` | overworld / 0,5,7 | villageChild, child1 | no — shares with Pell, the Hearth child |
| Pell (`pellTrade`) | trader | `npc_child` | overworld / 0,4,8 | coastChild, pellTrade, pellAfter | no — shares with `villageChild`, the Hearth child |
| `shoreSalter` | npc | `npc_salter_d` | overworld / 0,4,8 | shoreSalter, shoreSalterAfter | no — shares with Hulla |
| Hulla (`hullaTrade`) | trader | `npc_salter_d` | overworld / 0,5,8 | timberSalter, hullaTrade, hullaAfter | no — shares with `shoreSalter` |
| `fisher1` | npc | `npc_fisher` | overworld / 0,9,8 | fisher1, fisher1After | no — shares with 3 others |
| Sennit (`sennitTrade`) | trader | `npc_hood_blue` | overworld / 0,9,8 | sandpiperKid, sennitTrade, sennitAfter | no — shares with Wick |
| Yarrow (`yarrowTrade`) | trader | `npc_kelper_d` | overworld / 0,1,9 | bogWitch, yarrowTrade, yarrowAfter | yes |
| Teel (`teelTrade`) | trader | `npc_fisher` | overworld / 0,4,9 | stoneFisher, teelTrade, teelAfter | no — shares with 3 others |
| Dov (`dovTrade`) | trader | `npc_villager` | overworld / 0,8,9 | wreckSurvivor, dovTrade, dovAfter | no — shares with `sandpiper` |
| `shopkeeper` | npc | `npc_shopkeeper` | houseShop / 0,0,0 | shopkeeper, shopkeeper2 | yes |
| `faroreHome` | npc | `npc_farore_0` | houseMaku / 0,0,0 | faroreHome, faroreHomeAfter | yes |
| `hearthWife` | npc | `npc_villager2` | houseHearth / 0,0,0 | hearthWife, hearthWifeAfter | no — shares with `villager2` |
| `hearthChild` | npc | `npc_child` | houseHearth / 0,0,0 | hearthChild, hearthChildAfter | no — shares with `villageChild`, Pell |
| Ossa (`ossaStart`) | trader | `npc_fisher` | houseNets / 0,0,0 | ossaWait, ossaStart, ossaEnd, ossaAfter | no — shares with 3 others |
| `sandpiper` | npc | `npc_villager` | houseSandpiper / 0,0,0 | sandpiper, netMender | no — shares with Dov |

## What this session did not do

No sprite was extracted, drawn, or reassigned. This is the count, not the
fix. A future session's real work under this objective: reassign the 3
already-extracted, already-unused sprites above to break 3 of the 5
generic-archetype collisions at zero art cost, then check
`assets/sheets/` for further spare frames for whatever's left (same
method as `docs/ENEMIES.md`'s idle-art search) before reaching for
`docs/ART-DIRECTION.md`'s hand-drawing rules — extraction first, per
CLAUDE.md. `npc_fisher`'s 4-way collision needs at least one new source
regardless (only one spare covers three gaps at most). Leave
`npc_salter_d` (`shoreSalter`/Hulla) alone pending a decision from the
person running these sessions on whether shared-clan-hood is a feature.
