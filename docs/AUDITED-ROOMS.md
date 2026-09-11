# Audited overworld rooms

One line per overworld room a session has actually looked at for region-art
consistency (STATE.md rotation objective #2). `Region` is free text — no
canonical region partition exists elsewhere in the data (see
`tools/check-drift.mjs`'s own comment on this), so use whatever name the
prose in `docs/ART-BACKLOG.md` already uses for that stretch of coast if one
exists, and be consistent with earlier rows before inventing a new one.
`Verdict` is one sentence: what you checked and what you found, not a
restatement of the room's contents.

Empty until a session picks rotation objective #2. `tools/check-drift.mjs`
reads this file; do not hand-edit its table structure without checking the
column order still matches what it parses (key, region, name, date, verdict).

| Key | Region | Name | Date | Verdict |
|---|---|---|---|---|
