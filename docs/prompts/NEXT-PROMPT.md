# Next session (S240)

## Read first
- CLAUDE.md, all of it.
- docs/NEXT-SESSION.md S239 and S238; docs/HANDOFF.md lessons (top ten).

## Standing permission (the human, S231)
- Oracle of Ages is a full reference for ALL work: read its code
  (oracles-disasm's ages.s, object_code/ages/, scripts/ages/, the ROM_AGES
  side of shared files) and rip its assets (tiles, sprites, sounds, music,
  layouts, behaviour) exactly as Seasons'. Compare against both cartridges;
  if Seasons has no answer, check Ages before drawing or guessing. CLAUDE.md
  says the same under the Ages rule.

## State
- S239: no game change. The human kept S238's outdoor pieces (all, the faint
  salt-flat ledges too) and kept OUR indoor mooring posts, the Keep's silt
  and the Shrine's trees (offered the originals' stakes, dug floor and bush:
  docs/briefs/s239/indoor-candidates.png; "keep them all, don't swap").
  check-placement now proves every dungeon chest can be walked up to; the
  picture guide was re-shot on the current game.
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
  Spire's doors; S237 ground edges; S238 outdoor rocks, soil, holes, stakes,
  ledges; S239 our own mooring posts, silt, Shrine trees, grate.

## The task
- The hand-art look-through is finished (what is left is ours by design or
  kept). Next, from NEXT-SESSION.md's lists: a test that a tile named like a
  hand art cannot silently draw it (S239 "Found"); the walkable-chest proof
  for overworld and cave chests; then ask the human what to look at next
  (side-scrolling passages are a whole mechanic: ask first).
- Pictures beside the original, sounds as files, ask before bigger changes.
- Anything that changes a fight or a pickup on the route: compare
  route-prefix traces against a worktree of ORIGIN/main; if a boss's start
  moved by N frames, add N to the wait before it first (HANDOFF S235), else
  sweep with PATCH and run winners to THE END.

## Done means
- Whole table green; check-playthrough 49/49 or more, THE END, never died;
  npm run build, dist/ committed; NEXT-SESSION.md and this file updated;
  pushed; merged to main when done.

## Out of scope
- Enemy damage and health (S150). A camera that frames bosses (S153).
