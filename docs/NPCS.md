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

**Unique sprite: 13 of 22 as of S62, up from 7 at S60.** S61 spent the
three sprites that were already extracted and sitting unused
(`npc_elder`, `npc_zelda`, `npc_brinewife`). S62 extracted one genuinely
NEW sprite (`npc_fisher2`, see "Landed" below) since no further free
already-extracted art remained. 9 identities across 4 groups remain.

## Sprite-reuse groups (current)

| Sprite | Shared by | Count |
|---|---|---|
| `npc_fisher` | the East Strand fisher (`fisher1`), Teel (trader) | 2 |
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
generic-archetype reuse with no in-fiction framing — 7 identities.

**Objective #5 (npc-detail) is CLOSED as of S63.** Dialogue states have
been complete roster-wide since S60. Sprite uniqueness reached 13 of 22
by spending every zero-cost option (S61's 3 free sprites) and every
extractable one (S62's `npc_fisher2`, plus confirming both source
sheets — `oracle-seasons-npcs.png` and `oracle-seasons-nonhuman-
races.png` — hold nothing further). The remaining 9 identities (this
group plus `npc_salter_d`) would need genuinely hand-drawn art to close.
Put to the person running these sessions directly (S63, the same posture
`docs/ENEMIES.md`'s idle-art question used): leave them as they are.
Objective advanced to #6 (region-art) in the same session. This file
stays as the record of the gap, not a to-do list — see
`docs/prompts/STATE.md`'s Note line for the exact citation.

## Landed — S62

One new extraction, `npc_fisher2` (`tools/rip-npcs.py`, sheet index 69 in
`find_sprites`' reading order — a whole-sheet pass, not just the frames
near `npc_fisher`'s own block, following `docs/ENEMIES.md`'s S57 lesson
that a near-the-block search can miss real candidates). A genuinely
different pose, not a recolour of `npc_fisher`: red kerchief, green vest,
both arms drawn low holding a red basket against the body, versus
`npc_fisher`'s arms-at-sides standing pose. Assigned to Mirren
(`mirrenTrade`), whose own line is about carrying catch to the reef and
losing half of it — the pose fits. Confirmed in-engine
(`tools/shoot-rooms.mjs overworld,5,7`, screenshotted): draws correctly,
reads as a different person standing beside `fisher1`'s own unchanged
`npc_fisher` sprite in the same town. `npc_fisher`'s group trims 3 -> 2
(`fisher1`/Teel remain). Two other candidates considered from the same
whole-sheet pass and REJECTED rather than forced: a figure holding a red
item overhead (sheet index 9) and a dark-haired figure with visible
"eye-hole" shading (index 16) both read as action poses or possibly
helmeted/armoured figures on closer crop, not clean standing townsfolk —
extracting either on a guess risked exactly the "someone's impression of
the source" failure CLAUDE.md's Goal 1 warns against, so neither was
used. `assets/sheets/oracle-seasons-nonhuman-races.png` (the
`npc_hood_blue` source) checked and confirmed to hold only the 4
canonical silhouettes already extracted (`rip-races.py`'s own header) —
`npc_hood_blue`/`npc_hood_red` are already spare recolours of the hood
shape, not a fifth silhouette; no further `npc_hood_blue` alternative
exists on that sheet, a real extraction (new pixels) would be needed to
give Wick or Sennit their own look. `npm run build` re-run, `dist/`
changed (sprite reassignment lives in `overworld.js`, bundled).

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
| Mirren (`mirrenTrade`) | trader | `npc_fisher2` | overworld / 0,5,7 | coastFisher, mirrenTrade, mirrenAfter | yes |
| `villageChild` | npc | `npc_child` | overworld / 0,5,7 | villageChild, child1 | no — shares with Pell, the Hearth child |
| Pell (`pellTrade`) | trader | `npc_child` | overworld / 0,4,8 | coastChild, pellTrade, pellAfter | no — shares with `villageChild`, the Hearth child |
| `shoreSalter` | npc | `npc_salter_d` | overworld / 0,4,8 | shoreSalter, shoreSalterAfter | no — shares with Hulla (left alone, clan hood) |
| Hulla (`hullaTrade`) | trader | `npc_salter_d` | overworld / 0,5,8 | timberSalter, hullaTrade, hullaAfter | no — shares with `shoreSalter` (left alone, clan hood) |
| `fisher1` | npc | `npc_fisher` | overworld / 0,9,8 | fisher1, fisher1After | no — shares with Teel |
| Sennit (`sennitTrade`) | trader | `npc_hood_blue` | overworld / 0,9,8 | sandpiperKid, sennitTrade, sennitAfter | no — shares with Wick |
| Yarrow (`yarrowTrade`) | trader | `npc_kelper_d` | overworld / 0,1,9 | bogWitch, yarrowTrade, yarrowAfter | yes |
| Teel (`teelTrade`) | trader | `npc_fisher` | overworld / 0,4,9 | stoneFisher, teelTrade, teelAfter | no — shares with `fisher1` |
| Dov (`dovTrade`) | trader | `npc_villager` | overworld / 0,8,9 | wreckSurvivor, dovTrade, dovAfter | yes |
| `shopkeeper` | npc | `npc_shopkeeper` | houseShop / 0,0,0 | shopkeeper, shopkeeper2 | yes |
| `faroreHome` | npc | `npc_farore_0` | houseMaku / 0,0,0 | faroreHome, faroreHomeAfter | yes |
| `hearthWife` | npc | `npc_brinewife` | houseHearth / 0,0,0 | hearthWife, hearthWifeAfter | yes |
| `hearthChild` | npc | `npc_child` | houseHearth / 0,0,0 | hearthChild, hearthChildAfter | no — shares with `villageChild`, Pell |
| Ossa (`ossaStart`) | trader | `npc_zelda` | houseNets / 0,0,0 | ossaWait, ossaStart, ossaEnd, ossaAfter | yes |
| `sandpiper` | npc | `npc_elder` | houseSandpiper / 0,0,0 | sandpiper, netMender | yes |

## What's left

Three groups, 7 identities, after S62's `npc_fisher2` extraction:
`npc_fisher` (`fisher1`/Teel, 2), `npc_child` (`villageChild`/Pell/
`hearthChild`, 3), `npc_hood_blue` (Wick/Sennit, 2). `npc_salter_d`
(`shoreSalter`/Hulla) is intentionally not counted here — see above,
pending a decision on whether the shared clan hood is a feature.

`npc_child` needs new extraction the same way `npc_fisher` did:
`oracle-seasons-npcs.png` has 71 unclaimed blobs as of S62 (down from 83
before S61/S62's four claims), most confirmed to be soldiers, Zoras,
Subrosians, decorative urns/birds, or walk-cycle repeats of an
already-used archetype — genuinely NOT more townsfolk. A full pass has
now looked at every unclaimed blob once (S62); nothing beyond
`npc_fisher2` was confirmed clean. `npc_hood_blue` has no fix available
by extraction at all: `oracle-seasons-nonhuman-races.png` (its source
sheet) holds only the 4 canonical silhouettes, all already used (S62
confirmed by reading `rip-races.py`'s own header) — closing this group
means either a hand-drawn frame (`docs/ART-DIRECTION.md`, after weighing
it the way `docs/ENEMIES.md`'s idle-art thread weighed hand-drawing) or
leaving it, the same open question as `npc_salter_d`.
