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
