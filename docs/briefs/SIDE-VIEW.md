# Side-view passages — "the sea is the lift"

Agreed with the human at S241 (docs/briefs/s241/side-view.png shows the
originals and the sketch they agreed to). A whole new way of moving, so it
lands in stages; this file is the plan every stage builds to.

## What the human agreed

- **The core**: in a side-view passage the tide is a WATERLINE across the
  room. LOW: the water lies in the bottom of the passage and Link walks the
  floor. MID and HIGH: the line is higher, and Link (with the Cleats) swims
  up to ledges he cannot otherwise reach. The sea is the lift, which is how a
  game with no jump button gets vertical play out of a side view.
- **No jump.** Ladders, walking, falling, water. Seasons' passages lean on
  Roc's Feather; Ages' sea caves do not, and ours follow Ages.
- **The Cleats** (floor mode) sink Link to the bottom of side-view water, as
  the mermaid suit is to the flippers in Ages: the other half of the lift.
- **The conch works inside** (the human chose that over "the passage keeps
  the tide you came in with").
- **Where first: stair passages in dungeons**, as both cartridges use them:
  a stair in a top-down room drops into a short side-view tunnel whose ladder
  comes up in another room. Not sea caves, not a new dungeon part (yet).

## What the cartridges do (oracles-disasm, read at S241)

- A side-view room is a TILESET flag (`TILESETFLAG_SIDESCROLL $20`), not a
  room group. Seasons' side-view tilesets are $55-$60 and all share ONE
  metatile layout ($50, `GFXH_TILESET_SIDESCROLL`) recoloured per dungeon:
  $55 Hero's Cave, $56 Gnarled Root, $57 Snake's Remains, $58 Poison Moth's
  Lair, $59 Dancing Dragon, $5a Unicorn's Cave, $5b/$5c the Sword & Shield
  Maze ice/fire, $5f underwater, $60 Subrosia. Ages: $4b-$54 and $5c-$5e
  (Mermaid's Cave present $50 / past $51, Jabu-Jabu $52...).
  So each of our dungeons can have its passage in its own kit's colours:
  the Bogwater Sanctum (Poison Moth, $39) -> $58; the Cistern (Dancing
  Dragon, $3a) -> $59; the Grotto/Keep (Sword & Shield Maze, $41/$42) ->
  $5b/$5c; the Shrine (Ancient Ruins, $3c) has none of its own in Seasons.
- Layout $50's pieces (room data, rooms/seasons/large/room05NN for group 4):
  $01 air, $02 spikes (TILEINDEX_SS_SPIKE), $18 ladder, $19 ladder top,
  $1a ladder at the waterline, $1b water, $1c the water's surface, $1d-$1f
  seaweed in water, $26 a platform's top, $2a brick, $27 a ledge's top,
  $16/$17 ledge edges, $2d/$2e side walls, $3c/$3e ceiling, $3d undersea
  rock, $59 the sea bed. Collision is the SS tile types (tileTypes.s):
  hole $01 (a death line: respawn), water $20, ladder $10, ladder top $80,
  ice $40.
- Link (object_code/common/specialObjects/link.s `linkState01_sidescroll`,
  `linkUpdateInAir_sidescroll`, `linkUpdateSwimming_sidescroll`):
  - on the ground he moves horizontally only (`linkAdjustAngleInSidescrolling
    Area`); on a ladder tile he moves in all four directions; standing on a
    ladder TOP he does not climb up past y&15 = 9.
  - off the ground and off a ladder he falls: speedZ += $24 a frame (0.14
    px/f/f; $0e with bit 5 of wLinkInAir), capped at $0300 (3 px/f).
    Pressing UP while falling past a ladder catches it.
  - entering water: a splash; without TREASURE_FLIPPERS he drowns (respawn).
    In water he swims in all directions at the flippers' speed, faces only
    left/right, and makes a bubble every 50-81 frames.
  - leaving the water at the top: a splash and a hop, speedZ = -$1a0, unless
    the tile 8 px below is an underwater ladder.
  - the respawn point is not updated in a side-view room.

## Our rules (to build)

- A room declares `side: true` (and its map, or the room, its side-view kit).
  `Room` answers the same `solidAt` questions; what changes is the PLAYER's
  movement verbs and gravity, in one place, so every checker that asks the
  engine still gets the engine's answer.
- The waterline is ordinary tide tiles: a side-view water tile is a tide
  tile that is air at the seas it is dry and water at the seas it is wet,
  with the surface piece on its top row. The conch moves it like any other
  water; an Anchor's field moves it locally.
- Without the Cleats, water is the drown-and-respawn it is in Ages without
  flippers. With them, Link swims; floor mode sinks him to the bed and he
  walks it (his breath counts as it does top-down).
- Feel constants (gravity, fall cap, hop) go in feel.js as `derived` from
  the disassembly's numbers above, with the arithmetic in the comment.
- Pictures: the side-view kit is ripped from layout $50 in each dungeon's
  side-view palette by a ripper into a generated file. Link's side-view
  frames are his existing walk/swim side frames and his back frames for a
  ladder (as the cartridge draws him); nothing hand-drawn.

## Stages

1. Engine + kit + one mock passage, filmed for the human (no passage placed
   in the world yet, so no flood change is owed).
   DONE S241: src/game/sideview.js, the `sideBog` legend and `svBog*` kit,
   `link_swim2d_*`, tools/oneshot/film-side-mock.mjs and
   docs/briefs/s241/side-view-mock.gif (NEXT-SESSION.md S241 has the detail).
2. The dungeon flood learns the side-view verbs (walk, fall, ladder, swim at
   each sea, sink with the Cleats) in `tools/lib/dungeon-flood.mjs`, and a
   `check-sideview.mjs` proves each passage's claim in the real engine: what
   is reached at which sea, and that nothing strands Link.
3. The first real passage, optional, in the Bogwater Sanctum (Poison Moth's
   own side-view colours), its prize behind a waterline only one sea reaches.
4. More passages, one per dungeon from D3, each asking the waterline a
   different question.
