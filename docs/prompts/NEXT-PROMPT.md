# Next session (S238)

## Read first
- CLAUDE.md, all of it.
- docs/NEXT-SESSION.md S237 and S236; docs/HANDOFF.md lessons (top ten).

## Standing permission (the human, S231)
- Oracle of Ages is a full reference for ALL work: read its code
  (oracles-disasm's ages.s, object_code/ages/, scripts/ages/, the ROM_AGES
  side of shared files) and rip its assets (tiles, sprites, sounds, music,
  layouts, behaviour) exactly as Seasons'. Compare against both cartridges;
  if Seasons has no answer, check Ages before drawing or guessing. CLAUDE.md
  says the same under the Ages rule.

## State
- S237: D2/D5/D6's one-way ledges are their wall rings' own runs (as D3's);
  the overworld's ground edges are Seasons' grass-patch edge tiles ($13-$1c
  of spring tileset $00) read as shapes, in each pair's colours. Art only:
  check-playthrough 49/49, THE END, never died, low-water 5, 316364 frames.
  Picture: docs/briefs/s237/ground-edges.png (ASK how it looks).
- The human said KEEP / LEAVE (do not re-ask): our text box, place-name
  label, Sandpiper Cottage without its side door; S216 caves and shop; S217
  leaves/shards/splash/clink; S218 twinkle, no landing dust; S219 water,
  shadow, bubbles, Rod twinkles; S220 Lens flicker, held-up Essences,
  splashes at others' feet; S221 opening on black, Nereth's size, held-up
  Bell, solid last card; S222 grass at the feet, counting bar; S223 key
  doors, sliding puzzle doors, quiet loose keys, ammo blip; S224 chests;
  S225 signs, lean hints, Noble Sword beam; S226 own sounds, sea octorok's
  walk; S227 bouncing shots, shield bump; S228 unshoved zols/gels/pincers,
  beamos statue, shots through a flashing Link; S229 darknut guard,
  shieldless crab; S230 floating keese/bubble, side-on hovering fairy,
  still floor treasures; S231 boss death; S232 boss-room entry; S233 prizes
  after the smoke; S234 boss doors; S235 bosses wait for the shutters, then
  hold their pose; S236 every dungeon's own holes, D1/D2 boss doors and the
  Spire's doors (looked at, S237: right).

## The task
- Ask how S237's ground edges look (the picture). Then carry on the
  look-through against BOTH originals: S237's overworld candidates
  (boulders, dig spots, cracked cliffs, ledges, posts, sinkhole — all in
  Seasons' spring tileset $00), then the older lists. The hand-art probe is
  described in S236; clone github.com/Stewmath/oracles-disasm to a scratch
  folder. Pictures beside the original, sounds as files, ask before bigger
  changes.
- Anything that changes a fight or a pickup on the route: compare
  route-prefix traces against a worktree of ORIGIN/main; if a boss's start
  moved by N frames, add N to the wait before it first (HANDOFF S235), else
  sweep with PATCH and run winners to THE END. Look at FRAMES before
  sweeping (S234); SETHP tells a health problem from a tactic one (S235).

## Done means
- Whole table green; check-playthrough 49/49 or more, THE END, never died;
  npm run build, dist/ committed; NEXT-SESSION.md and this file updated;
  pushed; merged to main when done.

## Out of scope
- Enemy damage and health (S150). A camera that frames bosses (S153).
