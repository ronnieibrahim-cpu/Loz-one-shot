# Next session — the bosses' art, then the human's open questions

## Read first
- CLAUDE.md, all of it.
- `docs/NEXT-SESSION.md`, the S151 entry only (and its "Waiting on the human").
- `docs/ART-DIRECTION.md` and `docs/briefs/AGENTS.md` section J (the rip
  workflow) — the boss task below is an art task.

## Why this, now
S151 finished S150's list: Seasons' white fades and door reveal, the chest
rise, sixteen enemies moving as Seasons' do (read from the disassembly),
Seasons' height rule for leaping enemies, and — at the human's request —
Seasons' own title, file-select, overworld and item-get music, ripped from
the cartridge's channel scripts and played by a Game Boy sound model. The
run is played to the end again (42/42, never died).

The human then asked for an ACTION ITEM: **the boss art is a pixelated mess**.
Every enemy on screen is extracted Seasons art now; the bosses and minibosses
are hand-drawn and the difference shows at a glance, which is a Goal 1 failure
("a screen mixing an extracted Octorok and a hand-drawn boss must not betray
which is which").

## The task
1. BOSS ART, first and before anything else. For each of the six bosses
   (gohmaraq, anemos, gloomtide, wyverna, rootmaw, nereth, and thalassor /
   brinehulk as the data names them) and the minibosses (clawcrab, reefguard,
   bogmaw, ironknight, thornvine, saltwraith, gustharpy, tideshade):
   a. Photograph it in its own arena (`tools/shoot-rooms.mjs` or a scratch
      shooter; S151's pattern is in NEXT-SESSION) next to an extracted enemy.
   b. Look in `assets/sheets/` for a Seasons or Ages boss sheet. If none has
      what is needed, ASK THE HUMAN for one (e.g. a Spriters Resource boss
      sheet) rather than drawing from memory. A boss that is ours in DESIGN
      can still be built from extracted parts (a Seasons boss's shell, eye,
      claw) through a ripper — that is the preferred route.
   c. What must be drawn follows CLAUDE.md's art rules exactly: three colours
      plus transparency, a hard 1 px outline, no anti-aliasing or gradients,
      the silhouette first. Multi-cell bosses are assembled from 16x16 cells
      the way Seasons' are.
   d. Show the human before/after pictures (ours old / ours new / a Seasons
      boss beside them) and get a yes before moving to the next boss.
   Boss HITBOXES and fights must not change (check-bosses, check-playthrough).
2. The human's open questions from S151 (NEXT-SESSION "Waiting on the
   human"): the gel's cling, the bubble's sword lock, the spiked beetle's
   flip, and the "Get Item" recording. Do what they answer.
3. Art the ported enemies now need (only through rippers): the beamos's
   eight eye facings, the pincer's body segments, the leever's rise/sink
   frames, the darknut's sword.

## Done means
- Every checker in CLAUDE.md's table green, `check-playthrough` 42/42, to
  THE END, never died; `check-rippers` covers any new ripper.
- `npm run build`, `dist/` committed, NEXT-SESSION.md updated.

## Out of scope
- Enemy damage and health (the human said no in S150).
- Music beyond the four Seasons tracks, unless the human asks for more.
