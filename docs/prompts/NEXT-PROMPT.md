# Next session — Seasons' white fades, and Seasons' enemies

## Read first
- CLAUDE.md, all of it.
- `docs/NEXT-SESSION.md`, the S150 entry only (and its "human's answers").
- `assets/footage/README.md`, the S147 readings (fades, chest).
- `docs/patches/white-fades-and-chest.patch` — S150's parked change.

## Why this, now
S150 put Seasons' own collision boxes, knockback, text speed and pit timing
into the game, read from the disassembly (github.com/Stewmath/oracles-disasm;
clone read-only with `GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1`). The human
then approved three things: the white fades and the chest rise, more white
fades (menu, drowning, the dungeon entrance), and porting Seasons' enemy
behaviour. They said NO to Seasons' enemy damage — keep our damage ladder.

## The task
1. Apply `docs/patches/white-fades-and-chest.patch` (stairs fade to white
   27/31/27 f; doors and caves cut to white, 16 f, in over 20; the chest item
   rises out of the chest and the text opens 36 f after the lid). Delete the
   patch file once it is in.
2. The menu opens and closes through a 10-frame white fade each way (footage
   1744-1754); drowning fades to white over ~24 f (4469-4493). Read the
   frames, tag the numbers `measured` with the frames named.
3. The dungeon entrance: Seasons opens the first room from a vertical strip
   in the middle outward (footage 3676-3696). Frame-step it, then build it.
   Show the human side-by-side pictures (Seasons / ours) of 1-3 before
   calling any of it done.
4. Port Seasons' enemy behaviour for every enemy that has a Seasons
   counterpart (octorok, sand crab, zol, gel, keese, leever, bubble, beamos,
   beetle, tektite, whisp, moblin, stalfos, darknut, wizzrobe, pincer):
   `object_code/common/enemies/<name>.s` — speeds, walk and stand counters,
   when it turns toward Link, when it shoots, its projectile's speed. Every
   number goes in `src/data/feel.js` tagged `derived` with the file and table.
   Our own enemies (urchin, jellyfish, anglerfry, barnacle, siren, sea
   octorok) keep their design but may borrow a counterpart's movement feel.
   Do NOT change damage or health values.
   The 8 px lattice rule goes for ported enemies: update
   `tools/check-motion.mjs` and CLAUDE.md's table row to say what it now
   proves, rather than deleting the check.
   Do one enemy per commit, octorok first, and show the human one
   side-by-side (Seasons footage vs ours) of an octorok walking and shooting
   before doing the rest.
5. Re-record replays and re-route the playthrough until green. S150's
   method: `route-prefix.mjs` with `PATCH=` to sweep a fight's options in
   parallel, `FRAMES=` to see what happened (docs/HANDOFF.md lessons).

## Done means
- Every checker in CLAUDE.md's table green, `check-sword` and
  `check-playthrough` (42/42, to THE END, never died) included.
- `node tools/check-feel.mjs`, `node tools/check-rippers.mjs` green.
- `npm run build` with `dist/` committed; NEXT-SESSION.md updated.

## Out of scope
- Enemy damage and health (the human said no).
- Music (every dungeon has its own track since S150).
- Enemy ART: extraction is already the rule; a ported enemy that needs a
  frame the sheets have goes through its ripper, never by hand.
