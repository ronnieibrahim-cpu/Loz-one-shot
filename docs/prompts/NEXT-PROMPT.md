# Next session — check for a human decision on item-reuse's overworld gap

## Read first
- `docs/prompts/STATE.md`'s top note (added this session) — the rotation-
  level question raised to the person running these sessions. Check
  whether they have responded (in this file, in a commit message, or
  directly) before doing anything else.
- `docs/prompts/LEDGER.md`, "Known and deliberately unfixed", the final
  entry (S98) — the full evidence: ALL FOUR items' overworld halves are
  structurally blocked by the same gap, not four separate ones.
- `docs/NEXT-SESSION.md` S98 for how that conclusion was reached
  (including the corrected first-pass writeup, kept for the record).

## Why this, now
Many sessions running have worked objective #7 (item-reuse) to the edge of
what the current toolset allows: Bellows' dungeon bar is met (2/5); the
Anchor, Lens and Reefseed are each capped below the `>=2 dungeons` bar for
a tool reason, not a design one; and ALL FOUR items' `>=3 overworld
screens` bar is unreachable because `check-strands.mjs`/
`check-overworld.mjs` have no concept of any of the four items' gate
mechanisms at all (confirmed by grep, not by a failed build — see the
LEDGER entry). There is no more item-reuse work left to do inside the
current file allowlist without a `tools/` change bigger than a single
detour token was designed to cover — the exact situation
`docs/prompts/LEDGER.md`'s Lens entry already flagged as "worth raising
as a rotation-level question."

**This session raised it. Per the charter's own rule** ("You do not
choose what to work on... If you believe the objective of record is
wrong, say so... I will decide"), nothing about the objective or the
rotation was changed. `docs/prompts/STATE.md` carries the question at the
top.

## The task
Check whether the person running these sessions has responded to the
flagged question (a reply, a commit, a direct instruction). Two cases:

- **They have responded:** follow their direction exactly — it overrides
  everything below.
- **No response yet:** do NOT guess at scope (do not unilaterally build
  the shared flood-model fix, do not advance the rotation past #7, do not
  spend a token that doesn't exist). Instead: run
  `node tools/check-drift.mjs` and confirm its numbers still match this
  session's own (`anchor: 1/5,0`, `lens: 0/5,0`, `bellows: 2/5,0`,
  `reefseed: 1/5,0`). If they match, there is nothing new to do — log the
  session as `objective` with one line confirming the state is unchanged,
  and leave `docs/prompts/NEXT-PROMPT.md` as this same holding prompt
  (re-copy it, do not invent a new task). If the numbers have DRIFTED
  (something changed them outside this loop), investigate why before
  anything else — that is a real finding, not noise.

## Done means
- The flagged question's status is checked, not assumed.
- `node tools/check-drift.mjs` self-checks still pass.
- `docs/prompts/STATE.md` logs the session (`objective`, one line: either
  "no response, state unchanged" or the human's direction acted on).
- If no response: `docs/prompts/NEXT-PROMPT.md` stays this same holding
  prompt so the question isn't silently dropped.

## Out of scope
- Building the shared `check-strands.mjs`/`check-overworld.mjs`
  puzzle-door fix without an explicit go-ahead — it touches `tools/`,
  is bigger than one detour token, and is exactly the scope question
  that's pending.
- Advancing `OBJECTIVE OF RECORD` to rotation item #8 on your own
  initiative — that is the human's call, not a default to fall into
  after enough blocked sessions.
- Any new Anchor/Lens/Bellows/Reefseed dungeon or overworld room — every
  remaining angle on all four is now accounted for in the LEDGER.
