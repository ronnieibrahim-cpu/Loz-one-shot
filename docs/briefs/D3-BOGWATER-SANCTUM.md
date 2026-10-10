# D3 — the Bogwater Sanctum, grown to two floors (S180 design, NOT YET BUILT)

**Status: a proposal shown to the human as a mock (S180). Nothing in `src/`
has changed. Build only what the human approved — see "Open questions".**

Written against docs/briefs/DUNGEON-DESIGN-LANGUAGE.md; read that first.
Pictures: `d3-mock/d3-plan.png` (both floors), `d3-mock/mock-holes.png`
(the drop holes beside Seasons' Poison Moth's Lair 1F $53/B1 $43 and Ages'
Moonlit Grotto 1F $5f/B1 $51), `d3-mock/mock-crack.png` (the cracked floor
beside Moth's Lair B1 $4c). The mock rooms are drawn in the real engine by
`tools/shoot-mock.mjs docs/briefs/d3-mock/mock-spec.json <out>`, with the
cartridge's own drop-hole and cracked-floor tiles pasted on (Moth's Lair
tileset $39, metatiles $48-$4b and $4d — our D3's own kit, so the build
extracts them from the very tileset the Sanctum already wears).

## The machine, in one sentence

**The bog is a sieve over a cellar: every hole lands on the same spot of the
room below, the sea decides what each hole is, and the Anchor — which stays
where you drop it when you leave the room — is how two floors stand at two
different seas.**

That last clause is the Ages lesson (docs/briefs/DUNGEON-DESIGN-LANGUAGE.md
§10): Ages' best dungeons have a state that is SET in one fixed room and READ
in others (the Crown Dungeon's orbs, Jabu-Jabu's three buttons). Our conch
goes everywhere with the player, so it cannot be that. The Anchor can: it
holds its patch in the room you left, and `items.js anchor.use` recalls it
from anywhere. The Sanctum is where the player learns that.

## Size and shape

- **1F, the Bog:** the 32 screens there now, keeping their positions, names,
  bosses and wings; six rooms reworked (green on the plan). Every room the
  build touches also gets interior geometry — S179's rooms are mostly an
  empty box with one pool, which is the plainest difference between a screen
  of ours and a screen of theirs (§9 of the language brief).
- **B1, the Undercroft:** 10 new screens directly under the middle of 1F
  (x 2-4, y 3-6). Total 42 screens on 2 floors — the S179 target (~40, 2F).
- Hub: the Bog Hub on 1F over the Three Pens on B1, the Ages D3 cross
  (`$60` over `$52`) in our terms.
- The Cleats stay in the Cistern Floor, north of the Weir: halfway, off the
  entrance-to-boss line.
- Floors renumber: the Bog becomes floor 1 and the Undercroft floor 0, so a
  hole's "room below" is `floor - 1`, as the Sunken Palace's whirlpools
  already read it (`Game.enterWhirlpool`).

## The two new terrains

**The shaft** (a tide tile, Bog legend `5` — the outdoor `channel` no indoor
room places, the Spire's and the Shrine's argument):

| Sea | What it is | Art |
|---|---|---|
| LOW | an open hole: step in and you fall to the same spot one floor down, landing standing | Moth's Lair warp hole ($48-$4b), the cartridge's fall |
| MID | flooded: deep water | the Sanctum's deep water |
| HIGH | flooded: deep water | the Sanctum's deep water |

A swimmer floats across a flooded shaft; a player SINKING with the Cleats
goes down it and arrives on the cellar's bottom at the same spot (Jabu-
Jabu's own rule: link.s "Move down instead of up when over a warp hole").
A drop that would land on a pit is no landing: the player is put back
upstairs as a pit fall (taking the pit's damage), so a hole over a dry pit
reads as a pit. Timing from the cartridge: Link's fall animation
(`linkState` substate1) and Seasons' landing.

**The cracked floor** (fixed, or under a sluice pool as a tide tile): stand on
it for 32 frames (`commonCode.s @tileType_crackedFloor`, wStandingOnTileCounter
>= 32; walking across at 1 px/f spends 16 frames on a tile, so walking never
breaks it) and it gives way with SND_RUMBLE (`breakCrackedFloor`) — into a
SHAFT, for good (persisted). So a crack is a hole you choose to make, and
what it becomes is tide terrain.

## The six puzzles, in the order they are met

Each piece is shown alone before it is combined (language brief §4).

**P1 — The Drowned Nave (1F 3,6) → Undercroft Landing (B1 3,6). Safe.**
The Nave's pool becomes a shaft. At LOW it is a hole; the room below is lit,
empty and has the stairs straight back up. *Aha: a hole is a door, and you
land where you fell.* Required: the Landing's north door is the only way to
the Three Pens.

**P2 — The Bog Hub (1F 3,5) over the Three Pens (B1 3,5). Which hole.**
The Hub's four pools become four shafts. Below, three walled pens (no door;
one-way ledges out) sit under three of them; Small Key 1 is in one, visible
from the Pens' corridor. *Aha: the Hub's pools are the pens' roofs — count
the position.* (Ages D3 `$5f`→`$51`, Moth's Lair `$53`→`$43`.)

**P3 — The Sluice Cell (1F 4,5, behind key door 1) over the Drain Weir
(B1 4,5). Two seas at once.** (mock-holes.png) The shaft sits in the cell's
pool. Directly below is a drain: a dry pit at LOW, wading at MID, deep at
HIGH. At LOW the hole is open but lands in the pit (no landing); at MID the
landing is wading but the hole is flooded, and without the Cleats there is no
going down a flooded hole. Answer: at LOW, drop the Anchor by the shaft;
sound the conch to MID; the held patch keeps the hole open while the cellar
fills; drop, wade to Small Key 2. The Lens shows the shaft filling at MID —
the warning, never the gate. The Drain Weir's west shutter opens from inside
when the key is taken (a loop back to the Pens). *Aha: the Anchor can hold a
hole open — two floors, two seas.*

**P4 — The Silt Cell (1F 2,4) over the Root Cellar (B1 2,4). The first
crack.** A crack in an alcove beside the obvious path; stand still and it
gives way into the Root Cellar, where the Chartstone is, with the Silt
Stair's stairs back up. Safe and rewarded. *Aha: standing still breaks it,
walking does not.*

**THE CLEATS — the Cistern Floor (1F 3,3, behind key door 2 in the Weir's
north wall).** Safe use in its own pool; the twist is the two torrent wings
that already exist (out along the seafloor, home on the surface).

**P5 — The Cistern Floor's well (1F 3,3) over the Sump (B1 3-4,3).
Combination: the Cleats and the hole.** The Cistern Floor's pool gets a
shaft. Below, the Sump: a dry pit field at LOW, deep above, with a plate on
its floor (`FloorSwitch.sunk`: only Link walking the bottom presses a plate
under deep water). At MID or HIGH, sink down the well, walk the bottom to the
plate: it opens the Undertow's door on 1F (the west wing, Small Key 3 and
Bogmaw), and the Sump's own shutter, which lets you out into the Undercroft
(Undertow Cellar → Root Cellar → Silt Stair → up). *Aha: the bottom of a
drowned room is a floor, and a switch down here opens a door up there.*
(Ages D2 `$3b`: a switch in one room, a gate in another.) Visible before
understood: the shut door is in the room with the well, and the Sump is on
the Dungeon Map.

**P6 — The Weir's crack (1F 3,4) over the Reliquary (B1 3,4). The Boss Key.
The hardest instance, and a room re-read.** (mock-crack.png) The Weir is
walked through early, on the way to the Cleats; a crack lies in its dry pool
at LOW (under water at MID, so only the low sea shows it). Below is the
Reliquary: sealed, DAMP (`damp: true` — the Kilnshell will not strike there),
with two unlit torches round the Boss Key's dais. Break the crack and you
fall onto the dais with nothing to light them with. Fire cannot be carried in
through water (deep water puts a shell out, in the hand or in the air), so it
has to come from above, dry: strike a Kilnshell in the Weir, pick it up, and
drop down the hole you made at LOW. Both torches lit, the Boss Key's chest
rises. The way out is a stair up into an alcove of the Weir that is only
left by a one-way ledge — so the stair is never a way in, and an early fall
is never a trap. *Aha: the crack you walked over at the start is the only dry
way into a room that no water may touch.*

## Key economy

| Key | Where | Opens |
|---|---|---|
| Small Key 1 | Three Pens (P2) | Sluice Cell door (from the Hub) |
| Small Key 2 | Drain Weir (P3) | the Weir's north door → the Cleats |
| Small Key 3 | Sunken Vestry (the west wing, opened by P5) | Drain Gallery |
| Small Key 4 | Eel Vault (east wing, as now) | Eel Hall's north door → Kelp Locks → Lock Gallery |
| Boss Key | the Reliquary (P6) | Lock Gallery's boss door → Gloomtide |

Every key from a puzzle (language brief §7). The Boss Key moves out of the
Drain Gallery, which keeps Bogmaw's approach. Every new key door is a loop:
the Drain Weir and the Sump open back into the Undercroft from inside.

## Checkers (one per puzzle, the check-anchor / check-lens pattern)

- `walk-dungeons` / `check-dungeon-strands` / the shared `dungeon-flood`:
  learn the shaft (LOW: drop to the cell below unless it is a pit; MID/HIGH:
  sink down once the dungeon index has the Cleats), the crack (stand: becomes
  a shaft), and the Anchor-held hole (a shaft held at LOW while the floor
  below is at another sea) — in the same commit as the tiles (CLAUDE.md).
- New `tools/check-shafts.mjs`, like check-whirlpool: every shaft and crack
  in the world has a room below with a standable or swimmable landing; in the
  real engine a LOW drop lands standing at the same pixel, a sink at HIGH
  arrives underwater on the bottom, a drop onto a dry pit is put back
  upstairs; a crack holds a walker and gives way to a stander at frame 32.
- Room claims, each proved both ways (cannot be skipped; can be solved):
  `shaftRoom` (P2: the key pen is reached only through its own hole), an
  anchor claim for P3 (no landing at any single sea; one Anchor at LOW then
  MID lands — extending check-anchor), a sunk-plate claim for P5 (the
  existing check-cleats `sunkPlates` clause, plus "only reached by the
  well"), a kiln claim for P6 (check-kiln: the room is damp, nothing can be
  thrown in lit, and a shell carried down the hole lights both torches).
- A check-side one-run scenario of the whole dungeon (S162's rule), and
  check-playthrough re-routed to 44/44 or more, THE END, never died.

## Open questions for the human

1. **The shaft's rule.** Proposed: a hole at LOW, flooded at MID and HIGH (you
   sink down it with the Cleats). The other reading is a hole at LOW and MID,
   flooded only at HIGH. The first makes MID the "hole is shut" sea, which is
   what P3 needs.
2. **The cracked floor under water.** Proposed: it shows and breaks only when
   the pool is dry (LOW); at MID it is under the water and cannot be seen.
   The alternative is a crack that is always visible and breakable.
3. **Scope.** All six puzzles and ten cellar screens in one build session, or
   P1-P4 and the Undercroft first, P5-P6 the session after.
