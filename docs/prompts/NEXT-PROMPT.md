# Next session — survey the remaining shoot() users for an attackFrame win

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s S88 entry (the `attackFrame` mechanism, the
  newest) — it built the actual engine feature and proved it on `moblin`
  using art that already existed. This session is a SURVEY, not a
  guaranteed rollout: check each remaining candidate honestly, and only
  wire the ones that actually qualify.

## Why this, now
`attackFrame` (`spec.attackFrame` + `e.attackTime`, `src/game/enemy.js`)
now exists and works, proven on `moblin`. Seven more enemies call
`shoot()`/`shootRing()` and could plausibly get the same treatment:
`octorok`, `octorokSea`, `beamos`, `wisp`, `wizzrobe`, `barnacle`,
`siren`. None have been checked yet for whether they have `moblin`'s
same lucky situation — an already-extracted pose currently doing
something else (or sitting entirely unused) that could serve as a real
attack telegraph with zero new art.

## The task
1. For each of the 7 enemies, read its `defineEnemy` block
   (`src/data/enemies.js`) and its sheet-extraction comment
   (`tools/rip-enemies.py`'s `FRAMES` dict) to see what art already
   exists for it — both the frames currently wired into `frames:` and
   any nearby unused sheet frame the way `darknut`/`pincer`/`wizzrobe`
   each found extras during the `deathFrame` thread.
2. For each one, decide HONESTLY whether a real attack-telegraph pose is
   available without drawing anything new:
   - A frame currently doing double duty as an alternate walk frame,
     the way `moblin_d1` did (check whether any of these enemies have a
     similar "idle, then a raised/wound-up variant" comment in
     `rip-enemies.py`).
   - Or a genuinely unused sheet frame that reads as a wind-up/attack
     pose, the way `wizzrobe`'s mid-transition frame or `pincer`'s
     eyes-only frame were found for `deathFrame` — but a candidate here
     has to read as ATTACKING, not just be unused and same-palette (the
     same bar `moblin` (S85) already applied when it correctly REJECTED
     two unused frames that didn't read as a collapse).
   - Some of these 7 may have NOTHING suitable without hand-drawing a
     new pose. That is a legitimate outcome — say so plainly for each one
     that doesn't qualify, don't force a weak fit.
3. Wire `attackFrame` on whichever enemies clearly qualify, following
   `moblin`'s exact wiring shape (`{ down, up, side }` for
   multi-directional enemies, or a plain string for enemies with a
   single `frames` array). Do NOT hand-draw new art this session — that
   is out of scope; only wire enemies where the art already exists.
4. Verify each wired enemy in-engine: `shoot()`/`shootRing()` sets
   `attackTime`, `spriteName()` shows the right pose immediately,
   correctly reverts once the timer runs out, and a hit mid-attack shows
   `hurtFrame` instead (the same interruption `moblin` already proved —
   confirm it holds on each new enemy too, don't assume it generalises
   for free).
5. Run `node tools/check-drift.mjs` and confirm every enemy you wired
   shows `attack` in its roster line.
6. Run the full regression sweep: `validate.mjs`, `test.mjs` (83/83),
   `check-feel.mjs`, `check-playthrough.mjs` (21/21), `replay.mjs`
   (51/51) — re-record anything that diverges — `check-build.mjs`.

## Done means
- Each of the 7 candidates has an honest, stated verdict: wired with
  existing art, or explicitly not eligible without new art (and why).
- Every enemy actually wired shows a real attack pose in-engine, proven
  by a probe, not by reading the code.
- `node tools/check-drift.mjs`'s roster print reflects every change made.
- `node tools/validate.mjs`, `node tools/test.mjs` (83/83),
  `node tools/check-feel.mjs`, `node tools/check-playthrough.mjs`
  (21/21), `node tools/replay.mjs` (51/51) all pass, confirmed by
  actually running them.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines), naming exactly which enemies got `attackFrame` and which
  didn't, and why.

## Out of scope
- Hand-drawing new attack-pose art for any enemy this session — only
  wire what already exists. A candidate needing new art is a finding for
  a LATER session, not something to draw now.
- The remaining melee-only enemies with no `shoot()`/`shootRing()` call
  at all (`crab`, `zol`, `gel`, `keese`, `leever`, `tektite`, `urchin`,
  `stalfos`, `darknut`, `anglerfry`, `jellyfish`, `pincer`) — whether
  they need a different kind of "attack" telegraph (a lunge/charge pose)
  is a separate design question, not this session's.
- `idle` states — still the separate, much larger undertaking noted in
  `docs/ENEMIES.md`'s own header.
- `bubble` — pure contact hazard, no `shoot()` call at all, not part of
  this survey's 7 candidates.
