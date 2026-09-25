# Next session — watch the new bosses fight, then the human's next list

## Read first
- CLAUDE.md, all of it.
- `docs/NEXT-SESSION.md`, the S152 entry only.
- `assets/bosses/README.md` and `tools/rip-bosses.py`'s header: how a boss is
  assembled from the cartridge, and which of ours is built from which.

## Why this, now
S152 finished S151's list. Every boss and miniboss that appears in the game
now wears Seasons art — extracted where Seasons had the creature, drawn in the
Oracle style around Seasons parts where the human wanted it to be its own —
each one approved by the human before the next. The gel clings, the bubble
takes the sword, and the spiked beetle flips on a shield, all ported from the
disassembly and proved in-engine by check-seasons-mechanics. The beamos's eye,
the leever's rise, the pincer's body and the darknut's sword came off the
enemy sheet. The run plays to the end, 42/42, never died.

Only STILLS of the new bosses were shown. The human has not seen them move.

## The task
1. Film each boss fight (a short strip or a few frames each, ours only; the
   human judges motion by eye) and send them. Ask what feels wrong. The tall
   ones (Anemos, Rootmaw, Nereth, Wyverna) may be cropped by the camera when
   Link is far below them — check in real play and propose a fix if so
   (never move a hitbox or a fight to fix art).
2. Ask the human what they want next. Candidates to offer, not to start
   unasked: the three unplaced bosses (Thalassor, Gustharpy, Saltwraith);
   dropping the darknut's hand-drawn square-up pose, which Seasons does not
   have; the robot buying the shield so the beetle's flip is played through;
   more Seasons music.
3. Whatever they choose: CLAUDE.md's rules, one change per commit, the
   checkers after each.

## Done means
- Every checker in CLAUDE.md's table green, `check-playthrough` 42/42, to
  THE END, never died; `check-rippers` green.
- `npm run build`, `dist/` committed, NEXT-SESSION.md updated.

## Out of scope
- Enemy damage and health (the human said no in S150).
