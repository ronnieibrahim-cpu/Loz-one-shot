# The Oracle dungeon design language

Written S180 from a reading of all eight Oracle of Ages dungeons (and Mermaid's
Cave's past half) and, for contrast, all eight of Seasons'. Every floor was
rendered from the cartridge's own room layouts and tilesets, every room's
objects listed from `objects/ages/mainData.s`, and the puzzle pieces read in
`object_code/ages/interactions/`. The study renders and listings are made by
`tools/oneshot/oracle-study/run.sh` (an oracles-disasm clone in, PNGs and
room lists out); a future dungeon session should run it and LOOK before it
designs anything.

Rooms are named as the disassembly names them: `Ages D3 1F $60` is group 4
room $60 of the Moonlit Grotto, on its upper floor. Floors are counted as the
map counts them (B1 below 1F).

**Read this before designing any dungeon.** It is the "why" behind the
counts in docs/DUNGEON-STATUS.md "S179". The short version is at the end.

---

## 0. The one-paragraph answer

An Ages dungeon is not a list of rooms with a puzzle each. It is ONE machine
with a small number of moving parts — a dungeon-wide state (an orb's
red/blue, a water level, four crystals, which era you are in) and a
geometry that is laid out so that state means something in many rooms at
once. Each room is a view onto that machine from one angle. The player
solves the dungeon, not the rooms, and the moment they understand the
machine the dungeon "clicks": rooms they already walked through read
differently. Seasons builds the same skeleton but spends its complexity on
movement and action (rollers, trampolines, magnet spinners, moving
platforms, side-view passages); Ages spends it on state.

---

## 1. Shape: the hub, the spine and the loop

**Every Ages dungeon has a centre that the player crosses more than once.**

- **Ages D3, the Moonlit Grotto.** 1F and B1 are the SAME footprint (a
  3-wide, 6-tall block with a two-room tail), stacked. On 1F a plus-shaped
  room `$60` sits in the middle with a spinner at its heart; four rooms
  `$5d $5f $61 $63` hold its four arms, each with a crystal. Directly below,
  `$52` is the same plus with a pit for a heart, and `$4f $51 $53 $55` hold
  its arms. The player passes through the centre on every trip, and the
  spinner turns which arm the centre connects to. The dungeon IS that cross.
- **Ages D5, the Crown Dungeon.** B1 is a ring of small rooms; 1F is a
  7x5 grid whose middle column (`$a7 $a9 $ac $b1`) is a north-south spine
  with a switchback room `$a9` at its top where the red and blue raised
  floors from four directions meet.
- **Ages D8, the Ancient Tomb.** The hub is a room, not a crossroads:
  `$8a`, the slate room, with four slots. The four slates are in four
  far corners of two floors (`$7c $7e $92 $94`), each at the end of its own
  arm. The dungeon is "go out four times and come back".
- **Ages D4, the Skull Dungeon.** The hub is a vehicle: minecart track runs
  through `$76 $77 $78 $7c $81` and across room seams, and its gates are
  switched from rooms the cart does not visit.

What this buys: the player builds a mental map fast, because the centre is
always where they last were. A hub turns backtracking into a loop rather
than a corridor.

**The entrance is south-centre, the boss north, and the item room is about
halfway — but never on the straight line between them.** Ages D3's Seed
Shooter is in `$58`, the far north-west corner of 1F, off the spine; Ages
D4's Switch Hook room `$87` sits directly above the entrance but is a
tile-filling puzzle you can only finish after looping round; Ages D5's Cane
is on the floor below the entrance (`$a5`). Seasons does the same (Poison
Moth's Lair's feather in the upper floor's corner).

**Size.** Ages 22-56 screens on 1-4 floors; Seasons 20-51 on 1-5. The
later the dungeon, the more floors rather than the wider the floor. A floor
is 4-6 rooms across.

---

## 2. Introducing the item: safe, twist, combination

Every dungeon teaches its item in three beats, almost always inside the
dungeon that hands it over.

1. **Safe use, right where you get it.** The item's room or the one beside
   it asks for the plainest use with nothing at stake. Ages D3: the room
   next to the Seed Shooter (`$59`) has an unlit torch you light with a
   bounced seed, and the game itself remembers it (`tileReplacement_group4Map59`).
   Ages D5: the Cane's own room `$a5` makes you push blocks — and the very
   next rooms have a button you hold down with a cane block.
2. **The twist: the same verb where it does something you did not expect.**
   Ages D3 `$4c` and `$4e` (B1): seed bounces off ROTATABLE_SEED_THING
   deflectors to hit an ORB you cannot reach, and the orb extends a bridge
   (EXTENDABLE_BRIDGE) across the pit you are standing beside — the shooter
   moves you, not only kills. Ages D5 `$bc`: four buttons, each held by
   something you made, and the chest exists ONLY while all four are held
   (`dungeonEvents` subid $17 — it vanishes if one is let go).
3. **The combination: the item and the dungeon's state machine together.**
   Ages D3's four crystals (`$5d $5f $61 $63`) are broken with the shooter;
   each one moves the dungeon's state (`wSwitchState` bits 4-7,
   `interaction21_subid18`), and all four collapse `$60`'s centre into
   `$52` below (`tileReplacement_group4Map52` literally loads the upper
   room's layout into the lower one). The item is the key to the machine.

The item is not a key. Every item in Ages gets at least three DIFFERENT
uses inside its own dungeon, and is asked for again, combined with the next
item, in the dungeons after it.

---

## 3. The puzzle pieces, and what kind of thinking each asks for

Read from the code. These are the GRAMMAR; none of them is ours to copy, and
every one of them has a reason it works that we can borrow.

| Piece (Ages) | Rooms | What it is | The thinking it asks for |
|---|---|---|---|
| Colour cube (`COLORED_CUBE`, `coloredCube.s`) | D1 `$20`, D2 `$2f $43`, D4 `$78 $90`, D6 `$21`, D8 `$90` | A die with three colours; pushing ROLLS it, so its top face depends on the path you pushed it along. Rolled onto a spot it lights the flames that colour | Plan a path backwards from the colour you need. The verb is the plain push; the depth is in the geometry |
| Toggle floor (`TOGGLE_FLOOR`) | D2 `$2e $32 $3b $42`, D4 `$72 $79 $7b`, D6p `$3f` | Red -> yellow -> blue each time Link lands on it after a jump | Parity and order; a 2x2 pattern check drops a key (`subid01`) |
| Floor colour changer + colour gels (`FLOOR_COLOR_CHANGER`) | D2 `$3e` (the Boss Key), D4 `$71`, D6p `$3f` | Hitting the floor's centre tile repaints every tile; gels of the wrong colour die only on their own colour | Combat that is also a puzzle; the Boss Key behind a fight you have to think through |
| Push-block synchroniser (`PUSHBLOCK_SYNCHRONIZER`) | D5 `$9b` (Boss Key), `$9e` | Push one block and EVERY block of the same kind moves the same way | Global consequences of a local act; the dungeon checks for Link getting stuck and resets (`miscPuzzles` "Checks if Link gets stuck in the d5 boss key puzzle") |
| Raisable floor + orb (`RAISABLE_FLOOR`, orbs) | D5 throughout; D8 3F | One orb toggles a DUNGEON-WIDE red/blue state: red blocks up and blue down, or the reverse | The state is set in one room and read in every other. WHERE you hit the orb matters, because you have to arrive in the next room in the right state |
| Crystals (`GROTTO_CRYSTAL`, `subid0d/18`) | D3 1F `$5d $5f $61 $63` | Four crystals, each a bit of a dungeon-wide state; all four change the layout of rooms on both floors | Cross-room, cross-floor state; the dungeon changes shape |
| Minecart + gates (`MINECART_GATE`) | D2 `$2f $3b`, D4 `$72 $78`, D8 `$90` | Track runs across seams; a switch on one side flips a gate the cart meets elsewhere | Route a vehicle through a network you can only partly see |
| Lever + lava filler (`LEVER_LAVA_FILLER`) | D4 `$7f $83 $84`, D8 `$8e $93` | Pull the lever: lava turns to floor tile by tile, holds, then flows back | A timed bridge; the room's geometry decides whether you outrun the return |
| Tile filler (`TILE_FILLER`) | D4 `$6f $87` (the Switch Hook!), D8 `$a6` (the Power Glove!) | Every blue tile turns red when walked off; all red spawns the chest; a tile can be crossed only once | A path-covering puzzle (a Hamiltonian path). Ages hangs TWO dungeon items on it |
| Extendable bridge + orb | D3 `$4c $4e`, D5 after the miniboss | An orb toggles a bridge across a pit | A ranged hit that makes terrain |
| Pattern shown while held (`subid16`) | D5 `$a5` (the Cane) | Stand on the switch and the floor shows a 6-tile colour pattern; step off and it is gone; push blocks into it | Memory: information in one state, action in another |
| Water level (`MISC_PUZZLES` "Jabu-jabu water level controller") | D7 3F `$6d` (three buttons) | Three buttons set the water of the whole dungeon to one of three heights; platforms appear on floors below only at the right level (`tileReplacement` D7 1st/2nd platform) | THE closest thing in either cartridge to our tide: a dungeon-wide three-level state, set in ONE room, read on every floor |
| Warp hole (`TILETYPE_WARPHOLE`) | D3 1F `$5f`; D7 all floors; D8 4F conveyors | Fall to the same spot one floor down. Underwater over a warp hole, diving takes you DOWN a level (link.s "Move down instead of up when over a warp hole (only used in jabu-jabu?)") | The floor below is reached at a PLACE, not at a staircase; a hole is a choice of where to arrive |
| Cracked floor (`TILETYPE_CRACKEDFLOOR`) | D2 `$32`, D4 `$78` | Stand on it 32 frames and it breaks into a hole (`commonCode.s @tileType_crackedFloor`; `breakCrackedFloor` plays SND_RUMBLE) | A one-way door you make; and a hole you made stays made |
| Era split (Mermaid's Cave, `$06` present / `$0c` past) | D6 | The same rooms in two times; what you do in the past is already done in the present (`tileReplacement` "D6 past: screen with retracting walls") | Cause in one map, effect in the other |
| Slates (D8) | `$7c $7e $92 $94` -> `$8a` | Four objects carried to one hub | A fetch structure for the last dungeon, every arm a different puzzle |

**What Seasons uses instead.** Counted from the same data: Seasons' D2-D8
place 6 rollers, 3-4 trampolines per dungeon from D3, magnet spinners (D7:
seven), 12 disappearing side-view platforms in D4, moving platforms in every
dungeon from D2, dragon-head shooters, falling fire, freezing lava (D8).
Its state pieces are few: a D4 floor trap, a D5 four-chest choice, a D7
four-armos button order, a D8 armos pattern. Seasons is a dungeon you move
THROUGH; Ages is one you THINK through. We want Ages' thinking with
Seasons' room furniture.

---

## 4. How the escalation is built

**Within a dungeon** the same piece appears three to five times, each time
asked a harder question:

- Ages D2 (Wing Dungeon) toggle floors: `$2e` (see it change), `$32` (a
  floor tile must be red to open the door — subid02), `$3b` (a toggle tile
  sets a switch bit — subid07 — that a MINECART GATE reads), `$42` (the
  2x2 pattern drops a key — subid01).
- Ages D4 colour cube: `$78` (roll it onto a spot), `$90` (roll it so its
  top is the colour the flames must turn — the chest only spawns when they
  are BLUE, subid12).
- Ages D5 orbs: the first orb rooms (`$9a $a1 $a2`) on B1 are one room
  each; by 1F `$a9` the red and blue floors of three rooms meet, and you
  have to arrive in `$a9` in the state its exit wants, so you hit the orb
  in the room BEFORE.

**Across the game** the pieces return in later dungeons combined with the
new item: the colour cube is in D1, D2, D4, D6 and D8; raised floors in D5
and D8; the tile filler in D4 and D8; the lava lever in D4 and D8. The last
dungeon (D8) is a museum of everything — ice, lava levers, a colour cube on
a minecart, raised floors, a tile filler, a spinner, sarcophagi — each in a
harder form, round the slate hub.

**The rule underneath:** a new piece is introduced in a room where it is
the ONLY thing happening. It is combined with another piece only after both
have been seen alone.

---

## 5. Multi-room and cross-floor puzzles

This is the gap docs/DUNGEON-STATUS.md "S179" named, and Ages has four
distinct kinds:

1. **A switch here, a door there.** Ages D2 `$3b`: the toggle-floor bit set
   in one room flips a minecart gate the cart meets in another. The player
   has to know the two rooms are wired together; Ages tells them by putting
   the track through both.
2. **A hole here, a room there.** Ages D3 1F `$5f` has warp holes that drop
   into B1 `$51` — the only way into part of it. Ages D7 is built on this:
   every floor's warp holes drop you to a specific spot of the floor below.
   The hole is placed so the room below is in TWO halves, and the hole
   chooses which.
3. **A change upstairs, a different room downstairs.** Ages D3's crystals
   collapse `$60`'s middle into `$52`; Ages D7's three buttons on 3F set the
   water on 1F and 2F, and the floating platforms only line up at the right
   height (`tileReplacement_group5Map5c`/`5d` checking the water level).
4. **An object carried between floors.** Ages D8's slates; D5's cane blocks
   do not travel, but the orb STATE does.

The common thread: **the connection is visible before it is understood.**
The minecart track enters both rooms; the hole is right there in the floor;
the dry platforms are drawn on the floor of the flooded room. The player is
never asked to guess that two rooms are linked — only to work out how.

---

## 6. State puzzles, and the "aha" of re-reading a room

The best Ages rooms are ones you walk through first without being able to
use, and come back to understanding.

- Ages D3 `$52` (B1 centre): on the first visit it is a pit you walk round.
  After the crystals, it is where the spinner from upstairs has fallen, and
  the route through the dungeon's middle is different. Same room, new
  reading.
- Ages D7: you walk the drained dungeon, see dry platforms in empty pools,
  then raise the water and those platforms are what you stand on.
- Ages D5 `$a9`: walked the first time with the wrong floor up, it is a
  dead end. Arriving with the other colour up, it is the crossroads.
- Ages D6: a wall that will not move in the present (`tileReplacement`
  "D6 present: screen with retracting wall") is open because you lit the
  torches in the past.

**The aha is always "this room has a second state, and I can choose it from
somewhere else".** It costs the designer one thing: the first visit must
SHOW the second state's affordance (the platform, the dry ledge, the
door), so that the return is recognition, not discovery by luck.

---

## 7. Key economy and backtracking loops

Counted from `chestData.s` and the key-dropping events: Ages gives 2-5
small keys per dungeon (D4 4, D5 5, D7 5, D8 4), roughly one per three or
four rooms after D3; Seasons 1-4.

- **Keys are earned by puzzles, not by finding.** Most Ages small keys come
  from a solved room: a key falls from the ceiling (`spawnSmallKeyFromCeiling`
  in subid01, 05, 0e, 0f, 13, 14), a chest appears (subid11, 12, 15, 17).
  Few are lying in an open chest.
- **The Boss Key is behind the dungeon's hardest instance of its signature
  piece.** Ages D2 `$3e` (the colour-gel floor), D5 `$9b` (synchronised
  blocks), D6 present `$1c` (two levers in the right order — `miscPuzzles`
  "Boss key puzzle in D6"), D3 `$50` (behind the crystal machine).
- **Loops, not dead ends.** A key door is placed so that what is behind it
  connects back to somewhere you have been, usually as a one-way shortcut
  (a ledge, a shutter that opens from the far side, a cracked floor that
  drops you home). The MINIBOSS_PORTAL in every entrance room (`$24`,
  `$46`, `$66`, `$91`, `$bb`) is the extreme case: once the miniboss is
  beaten, the entrance warps to its room — the dungeon's first half is
  folded away.

---

## 8. What is optional

Very little. Ages' optional content per dungeon is one or two rooms: a
gasha seed or ring chest (D1 `$15 $1c $1f`, D3 `$4e $5c $60`), the map or
compass a little off the path. The compass and map are almost always on
the critical path's edge — in a room you pass, behind one easy puzzle.
Optional rooms are where a piece is shown a fourth time for those who want
it, never where a NEW piece is introduced.

---

## 9. Room-level craft

From looking at every rendered room side by side with ours:

- **A room has interior geometry.** Ages rooms are full of internal walls,
  L-shaped corridors, block lines, raised floors and pits that make a PATH
  shape inside the 15x11 box (Ages D5 1F `$a9`, D4 1F `$7f`). Our rooms
  (D3 as of S179) are almost all an empty rectangle with one pool in the
  middle. The single biggest visual difference between a screen of ours and
  a screen of theirs is this.
- **Symmetry signals a puzzle; asymmetry signals a route.** A symmetrical
  room (Ages D3 `$60`, D5 `$b6`) says "the answer is about position";
  an L-shaped or switchback room says "go round".
- **One idea per room, then rooms that are pure traversal or a fight.**
  About a third of an Ages dungeon's rooms have no puzzle object at all:
  they are corridors with enemies, so the puzzle rooms stand out.
- **Every puzzle room shows its whole puzzle on entry.** The camera
  scrolls in Oracle-size rooms, but the puzzle elements are laid out so the
  first screen you see contains the question.

---

## 10. Translating it to the tide

What carries, as grammar, into a game whose state is the sea:

| Ages grammar | Ours |
|---|---|
| One orb toggles a dungeon-wide state, set in a fixed room | The conch moves the sea everywhere, but the player carries it. So WHERE the state is set has to come from the Anchor (a held patch that does not move with the conch) — the Anchor is our orb's fixed room |
| Jabu-Jabu's three water levels set from one room | Our sea already IS three levels; what Jabu adds is that the level decides which FLOOR's platforms you can use, and our dungeons have never used two floors with one sea |
| Warp holes: arrive at a place, not a staircase | Drop-through holes. Our twist: what the hole is depends on the sea above it |
| Cracked floor: a one-way door you make | A cracked floor that only holds while the water carries your weight, or that the sea breaks |
| Crystals: break four things, the dungeon changes shape | A dungeon-wide change you cause once (a sluice opened, a floor collapsed) that re-reads rooms on both floors |
| Colour cube: the verb is a push, the depth is the path | Our pushes (blocks, the Cleats carrying heavy things on the bottom) with a path that only exists at one sea |
| Era split: cause in one map, effect in the other | Surface and seafloor (the Cleats) are already two layers of one room |

And what never carries: the pieces themselves. No colour cube, no toggle
floor, no minecart, no crystals, no orb. Goal 2.

---

## 11. Checklist for designing one of our dungeons

1. Name the dungeon's MACHINE in one sentence: its state, where it is set,
   and where it is read. If it is "the conch, everywhere", it is not a
   machine yet.
2. Draw the hub and the loop before any room. Where does the player cross
   the middle, and which rooms does that crossing change?
3. Place the item room off the straight line, about halfway, and plan its
   three beats: safe, twist, combination with the machine.
4. At least two cross-room links and one cross-floor link, each one VISIBLE
   before it is understood.
5. At least one room the player passes early and re-reads late.
6. Keys from puzzles; the Boss Key behind the machine's hardest question;
   every key door a loop.
7. A third of the rooms are traversal or a fight. Every room has interior
   geometry.
8. Optional rooms show a known piece again, never a new one.
9. Every puzzle gets a checker: it cannot be skipped, it can be solved.
