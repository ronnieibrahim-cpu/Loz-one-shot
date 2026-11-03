# Next session (S235)

## Read first
- CLAUDE.md, all of it.
- docs/NEXT-SESSION.md S234 and S233; docs/HANDOFF.md lessons (top ten).

## Standing permission (the human, S231)
- Oracle of Ages is a full reference for ALL work: read its code
  (oracles-disasm's ages.s, object_code/ages/, scripts/ages/, the ROM_AGES
  side of shared files) and rip its assets (tiles, sprites, sounds, music,
  layouts, behaviour) exactly as Seasons'. Compare against both cartridges;
  if Seasons has no answer, check Ages before drawing or guessing. CLAUDE.md
  says the same under the Ages rule.

## State
- S234: boss and miniboss rooms shut every way in behind Link (doors and
  plain gaps), open after the smoke; a beamos does not hold them. The robot
  plays the whole game behind them (cornerSwing, the Sluice anchor fix).
  check-playthrough 49/49, THE END, never died, low-water 5, 316170 frames.
- S233: a boss's prizes come when its explosion ENDS (the human: feels right).
- S232: Link walks himself into a boss room; silent until the fight.
- S231: bosses die Seasons' way.
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
  after the smoke; S234 boss doors (ask how they feel in play once).

## The task
- Ask the human how the shutting boss doors feel in play
  (docs/briefs/s234/boss-doors.png).
- Offer (ask first, it changes every fight): bosses starting when the
  shutters are down, as Seasons' do, instead of the guessed intro count.
- Carry on the look-through against BOTH originals (S234/S233 "Not done"
  lists; clone github.com/Stewmath/oracles-disasm to a scratch folder).
  Pictures beside the original, sounds as files, ask before bigger changes.
- Anything that changes a fight or a pickup on the route: compare
  route-prefix traces against a worktree of ORIGIN/main, line frames up
  with a wait where you can, else sweep with PATCH and run winners to THE
  END (HANDOFF S228-S234). Look at FRAMES before sweeping (S234).

## Done means
- Whole table green; check-playthrough 49/49 or more, THE END, never died;
  npm run build, dist/ committed; NEXT-SESSION.md and this file updated;
  pushed; merged to main when done.

## Out of scope
- Enemy damage and health (S150). A camera that frames bosses (S153).
