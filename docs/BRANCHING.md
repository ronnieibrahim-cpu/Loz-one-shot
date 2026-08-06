# Branching

`main` is trunk. It carries the whole game — every session's work lands there.

## The rule

**One prompt = one session = one branch = one `/clear` afterward.**

Every session branches from `main` and merges back to `main`. Nothing branches
from another session's branch, and nothing is chained.

```
git fetch origin main
git checkout -b claude/<what-this-session-does> origin/main
```

When the session ends, its branch merges to `main` and is deleted. A branch
that has been merged is finished; follow-up work is a new branch off the new
`main`, not more commits on the old one.

## Why

Before this was written down, the repo had seven divergent `claude/*` branches
and a near-empty `main`. Two of them were byte-identical to each other. Any
session that started from `main` started from nothing, and every session that
started from a sibling branch inherited that sibling's guesses about where the
work was. Consolidating it cost a session on its own.

The point of trunk is that "where is the current state of the game" has exactly
one answer.

## Naming

`claude/<short-hyphenated-description>`. Describe the work, not the code —
`claude/tide-becomes-a-field`, not `claude/refactor-tide-js`. This matches the
commit-message rule in `CLAUDE.md`.

## Before a branch merges

Run the checkers. They are listed in the verification table in `CLAUDE.md` and
they are faster than reading the diff:

```
node tools/validate.mjs
node tools/walk-dungeons.mjs
node tools/check-overworld.mjs
```

And update `docs/NEXT-SESSION.md` losslessly, per the workflow rules — a future
session that reads only that file must be able to continue.

## The repo is private

It is personal and permanently unpublished. No LICENSE, no public-facing
README, no release tags, no CI badges, no publication scaffolding of any kind.
