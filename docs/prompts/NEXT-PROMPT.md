# Next session (S237)

## Read first
- CLAUDE.md, all of it.
- docs/NEXT-SESSION.md S236 and S235; docs/HANDOFF.md lessons (top ten).

## Standing permission (the human, S231)
- Oracle of Ages is a full reference for ALL work: read its code
  (oracles-disasm's ages.s, object_code/ages/, scripts/ages/, the ROM_AGES
  side of shared files) and rip its assets (tiles, sprites, sounds, music,
  layouts, behaviour) exactly as Seasons'. Compare against both cartridges;
  if Seasons has no answer, check Ages before drawing or guessing. CLAUDE.md
  says the same under the Ages rule.

## State
- S236: every dungeon's holes, pits and LOW drains are its own cartridge
  hole ($f3-$f7, lipped where floor meets them, never against a wall); D1
  and D2's boss doors and the Coral Spire's doors are their tilesets' own.
  Art only: check-playthrough 49/49, THE END, never died, low-water 5,
  316364 frames (same as S235). Picture: docs/briefs/s236/holes.png.
- S235: a boss waits for the shutters, then holds its own pose, then
  fights. S234: boss rooms shut behind Link, open after the smoke.
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
  after the smoke; S234 boss doors (played: feel right); S235 bosses wait
  for the shutters, then hold their pose (played: feels right, S236).

## The task
- Ask how S236's holes and doors look (the picture). Then carry on the
  look-through against BOTH originals (S236/S235 "Not done" lists, and
  S236's hand-art survey, the probe described there; clone
  github.com/Stewmath/oracles-disasm to a scratch folder).
  Pictures beside the original, sounds as files, ask before bigger changes.
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
