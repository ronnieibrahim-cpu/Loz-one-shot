# Audited overworld rooms

One line per overworld room a session has actually looked at for region-art
consistency (STATE.md rotation objective #6). `Region` is free text — no
canonical region partition exists elsewhere in the data (see
`tools/check-drift.mjs`'s own comment on this), so use whatever name the
prose in `docs/ART-BACKLOG.md` already uses for that stretch of coast if one
exists, and be consistent with earlier rows before inventing a new one.
`Verdict` is one sentence: what you checked and what you found, not a
restatement of the room's contents.

`tools/check-drift.mjs` reads this file; do not hand-edit its table
structure without checking the column order still matches what it parses
(key, region, name, date, verdict).

| Key | Region | Name | Date | Verdict |
|---|---|---|---|---|
| 0,4,7 | Tidewatch Village | Tidewatch Village | 2026-09-14 | Checked against ART-DIRECTION.md at all 3 tides (identical — screen sits above the tideline); house, tree crowns, bushes, stump, chests, rocks and sign all read as clean extractions with solid outlines and no mixed registers; no defect found. |
| 0,5,7 | Tidewatch Village | Village East | 2026-09-14 | Checked at all 3 tides — the sand/water tide patch on the east side composites a proper jagged edge into the grass at every level (no hard pixel cut), and Mirren's newly-assigned npc_fisher2 sprite reads as a distinct person beside the shop and tree crowns; no defect found. |
| 0,4,8 | Tidewatch Village | Village Shore | 2026-09-14 | Checked at all 3 tides — the dry/wet pool edge composites cleanly (zoomed crop), crab and shoreSalter (FOLK.salter) extractions both clean; no defect found. |
| 0,5,8 | Tidewatch Village | Driftwood Strand | 2026-09-14 | Checked at all 3 tides — sand/water channel edges composited correctly; a smaller dark-teal bush beside a tree crown is a genuinely different decoration type, not a palette mismatch (zoomed and compared); octorok, gem pickup and the wooden ledge structure all read clean; no defect found. |
| 0,3,7 | Tidewatch Village | West Bluff | 2026-09-14 | Checked at all 3 tides — cave entrance, ledge and sign all read clean; the tide pool's sand-facing edges are a hard cut with no rim, but this matches the already-documented "narrow channel" limitation in ART-BACKLOG.md's shore-rim entry (water one tile wide with land on both sides), not a new defect. |
| 0,6,7 | Tidewatch Village | Sunken Reef | 2026-09-14 | Checked at all 3 tides — large HIGH-tide lake shows a proper composited shallow-water rim against sand; the hard-edged inner corner is deep water (waterD), which the shore-rim fix deliberately excludes per ART-BACKLOG.md; no new defect found. |
| 0,7,7 | Tidewatch Village | Shallows Gate | 2026-09-14 | Checked at all 3 tides — palm trees (zoomed) have a clean outline and flat 3-4 colour shading matching the register; sand-ripple dithering and the composited shallow-water rim both read correctly; no defect found. |
| 0,3,8 | Tidewatch Village | Shell Beach | 2026-09-14 | Checked at all 3 tides — grass/sand boundary composites correctly (zoomed); the cross-shaped HIGH-tide water is deep (hard edge against both sand and grass, matching the documented waterD exclusion); no new defect found. |
| 0,6,8 | Tidewatch Village | East Strand | 2026-09-14 | Checked at all 3 tides — sand/grass boundary and tide-pool growth both read clean, crab and tree/bush decorations consistent with the established register; no defect found. |
| 0,7,8 | Tidewatch Village | Dune Crossing | 2026-09-14 | Checked at all 3 tides — palm corners and sand-ripple dithering match Shallows Gate's; gel enemy and flower decorations read clean; deep-water hard edge again matches the documented waterD exclusion; no defect found. |
| 0,2,7 | Marsh | Bog Causeway | 2026-09-14 | Checked at all 3 tides — the marsh ground (grassBog) is a genuinely distinct dark-olive reed texture, not grass recoloured (zoomed and compared), and its shallow-water edge correctly shows the composited rim (zoomed, confirmed on both the horizontal and vertical edges); no defect found. |
| 0,2,8 | Marsh | Sunken Reeds | 2026-09-14 | Checked at all 3 tides — grassBog/grass/sand three-way boundary composites cleanly (zoomed); shallow water rims correctly at LOW, water goes deep (hard edge, matches documented waterD exclusion) by HIGH; keese and the gem pickup read clean; no defect found. |
| 0,8,7 | Dunes | Grotto Approach | 2026-09-14 | Checked at all 3 tides — same sand-ripple/palm-corner look as Shallows Gate/Dune Crossing (region-art's prior "Tidewatch Village" batch); the `dunes` legend sharing `coast`'s visual palette is a deliberate shared desert aesthetic, not a copy-paste mismatch (both read as one consistent sandy register). Ledge/dock tile at the south edge reads clean; no defect found. |
| 0,8,8 | Dunes | Grotto Mouth | 2026-09-14 | Checked at all 3 tides — the stone grotto entrance (arched doorway, brick texture) is a clean, well-outlined structure distinct from a plain cave mouth; shallow-water rim at LOW correctly degrades to a hard edge once deep by HIGH; no defect found. |
| 0,4,9 | Tidewatch Village | Fishing Stones | 2026-09-14 | Control check, same `coast` legend as the first 10 rows, this far from the village centre — sand-ripple dithering, grass/sand boundary and deep-water edge all consistent with the earlier batch; wandering villager sprite reads clean; no defect found. |
| 0,5,9 | Tidewatch Village | South Sands | 2026-09-14 | Checked at all 3 tides — same `coast` palette holds up; a leever-shaped enemy correctly straddles the shallow/deep water line as the tide rises; no defect found. |
