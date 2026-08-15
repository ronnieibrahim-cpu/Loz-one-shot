# Play-test protocol

**This is the one document in the repo that cannot be executed by a tool, and
it exists because that is exactly the gap.**

**Except where it can be.** `tools/play-gates.mjs` is the first slice of Pass A
turned into a harness: it drives all five region gates the way a player meets
them and then does the awkward things to each — wrong item, right item, walk
away and come back, save and reload with every room rebuilt. The list in "the
ten things only a person triggers" below is not unautomatable, it is merely
UNCHECKED, and each item on it that gets a harness is one a person no longer
has to spend a session on. Automate down that list as you go; what is left at
the bottom is what a person is really for.

Nineteen checkers prove this game is completable, that its dungeons are not
stranded, that every item does the verb `docs/ITEMS.md` claims for it, that
movement is frame-identical to a recorded baseline, and that autotiling changed
no tile's flags in 273 rooms. Not one of them has an opinion about whether the
game is any good to play, or whether it feels like Oracle of Seasons. Every
dungeon on `docs/DUNGEON-STATUS.md` carries the same line at the bottom of its
write-up — *nobody has played it* — and that is the largest open item in the
project.

So: two passes, and they are different jobs with different outputs.

| Pass | Question | Output |
|---|---|---|
| **A — function** | Does it break under a person? | Bugs, with a repro |
| **B — faith** | Does it feel like the source games? | Findings against `feel.js`, with a number |

Do not mix them in one sitting. Pass A wants you poking at the seams; Pass B
wants you playing normally and watching your own hands. A session that tries
both at once produces a list of impressions and no repros.

---

## Before you start: what is already proved

**Do not spend play-test time re-testing these.** They are deterministic,
cheap, and they do not rationalise. Run them once at the top of the session so
you know the build you are playing is the build the board describes, then
forget them.

    node tools/validate.mjs && node tools/test.mjs && node tools/replay.mjs

Specifically, a tool already owns each of these and a hand-found "bug" in one
is far more likely to be a mis-read than a regression:

- **Completability and connectivity** — `walk-dungeons`, `check-overworld`,
  `check-towns`. If you think you are stuck, you are probably missing a verb,
  not standing in a stranded room. Check `docs/ITEMS.md` before reporting.
- **Item verbs** — `check-items` proves every item does all three of its verbs
  in-engine and that nothing hands out an item that does not exist.
- **Each dungeon's own idea** — `check-anchor`, `check-lens`, `check-cleats`,
  `check-bellows`, `check-reefseed`, `check-dredge`. Each proves its rooms
  cannot be answered the cheap way. "I got past it another way" IS worth
  reporting — it means the prover's model is wrong, which is a bigger finding
  than a bug.
- **Movement determinism** — `replay` walks 51 recorded runs to the pixel.
- **Terrain flags** — `check-autotile` builds the whole world twice and
  compares. A cliff you can walk through is not an autotiling bug.

What no tool can see, and what you are therefore for:

1. Anything a person does that a flood fill does not: leaving a room mid-puzzle,
   coming back, saving, dying, and doing it in the wrong order.
2. Anything about **time** — how long a walk-back feels, whether a wrong guess
   hurts the right amount, whether the difficulty curve across six dungeons
   goes the right way. Nobody has compared them.
3. Anything about **legibility in motion**. Four findings in
   `docs/ART-BACKLOG.md` are the same complaint — the mechanic is legible when
   it works and silent when it does not — and three of them were found by
   looking, not by a checker.
4. Everything in Pass B.

---

## Running it

Three ways, and they are not equivalent:

| How | Command | Use it for |
|---|---|---|
| Dev server | `npm run dev` then `http://localhost:8080` | Pass A and B. Live modules, console available. |
| The shipped build | open `dist/oracle-of-tides.html` from `file://` | **The last thing before you finish.** This is the game; the dev server is not. |
| Phone | copy `dist/oracle-of-tides.html` to a phone and open it | The touch layer. Nothing else tests it. |

`?seed=N` on the dev URL pins the world's seed so a run can be repeated. **Use
one and write it down** — a bug reported without a seed may not reproduce.

### Controls

| Pad | Keys |
|---|---|
| d-pad | arrows, or WASD |
| A | X, K, Space, M |
| B | Z, J, N |
| Start | Enter, Escape |
| Select | Shift, Tab |

### Debug keys — these are the play-tester's instruments

| Key | Shows |
|---|---|
| **O** | map id, room key, **base tide level and the local level under your feet when they differ**, x/y/z, facing, entity count, fps |
| **I** | the camera deadzone box and the window's position in the room |
| **U** / **Y** | cycle the Anchor's patch radius and shape |
| **P** | mute |

**Leave O on for the whole of Pass A.** The tide is a field, not a global —
`tide.levelAt(tx, ty, room)` — so "the sea is at MID" and "the water where I am
standing is at MID" are different claims, and the overlay is the only thing on
screen that distinguishes them. A bug report about tide behaviour without that
line is not actionable.

### Setting up a scenario

You should not have to play five dungeons to spend an hour on the sixth.

**Start a new game and let the opening finish first.** `warpTo` begins with
`if (this.fadeDir) return;`, so it is silently refused while any fade is
running — which includes the whole of the boot and the opening cutscene. If the
paste below appears to do nothing, that is why. Check with the **O** overlay,
or `__game.mode` (wants `'play'`) and `__game.fadeDir` (wants `0`).

Then, from the browser console:

```js
__harness.giveItem('dredge');           // grant an item the way the game does
__harness.giveItem('cleats', 2);        // an item with levels
__harness.giveItem('bombs');            // a COUNTED item: arrives with a full pouch
__game.progress.keys.d6 = 4;            // small keys, by map id
__game.progress.bossKeys.d6 = true;
__game.tide.setLevel(2, { instant: true });   // 0 LOW, 1 MID, 2 HIGH
__game.warpTo('d6', 0, 5, 3, null, 'down');   // map, floor, room x, room y — fades, ~1s
```

The ids are `sword shield lens conch bellows bottle coin rod dredge reefseed
bombs cleats anchor map chartstone`. `docs/ITEMS.md` is what each one is.

**Use `__harness.giveItem`, never `__game.progress.items.x = 1`.** A counted
item — bombs, a Reefseed, a bottle — arrives with a full pouch, and that rule
lives in `giveItem` and nowhere else (it sets `maxBombs`/`bombs`,
`maxReefseeds`/`reefseeds`, `maxBottles`/`bottles`). An inventory entry written
by hand is attached to an empty pouch and the B button denies for ever, so you
would report a bug the game does not have and miss the one it does. This is on
record in `docs/HANDOFF.md`; it cost a session. `__harness.giveItem` is the same
function `tools/replay.mjs` boots every recording with, which is why a repro
found this way ports to a replay plan unchanged.

**A scenario set up from the console is not a clean run.** Anything you find
this way has to be re-found on a real save before it goes on the board as a
progression bug, because the console skips every gate that would have taught
you the verb.

---

## How to report

One format, so findings are comparable across sessions and so a session that
finds something can hand it straight to a replay plan.

```
FINDING  <one line, what is wrong>
WHERE    <map/room key from the O overlay, or "overworld 4,7">
SEED     <the ?seed= you used, or "fresh">
SETUP    <clean run to this point | console: the exact lines>
REPRO    <numbered steps a stranger can follow>
SAW      <what happened>
WANTED   <what should have happened, and why you think so>
KIND     bug | soft-lock | legibility | feel | balance
```

Where each kind lands:

- **bug / soft-lock** → fix it, and **write a replay plan for it** in
  `tools/replay-plans.mjs`. A bug found by hand and fixed without a recording
  is a bug that comes back. The plan's `setup` block takes the same fields the
  console recipe above uses, which is why the console recipe uses those fields.
- **legibility** → `docs/ART-BACKLOG.md`, with a screenshot command that
  reproduces it (`node tools/shoot-rooms.mjs --tide=N --px=X --py=Y map,f,x,y`).
- **feel** → `docs/FEEL-SPEC.md` and the constant in `src/data/feel.js`. See
  Pass B for what a feel finding has to contain before it may touch a
  provenance tag.
- **balance / curve** → `docs/DUNGEON-STATUS.md`, under the dungeon.
- **anything surprising** → `docs/HANDOFF.md`, hard-won lessons. Cost paid once
  should not be paid twice.

---

# Pass A — function

Play to break it. The route below is ordered so that each stage can be reached
by the previous one; a stage you set up from the console is worth less.

## The ten things only a person triggers

Every one of these has bitten this project or is a class that has. Try each
deliberately in every dungeon you test.

1. **Walk away mid-puzzle and come back.** A wheel that fires once and is open
   for ever spawned a key in D4, and leaving the room without picking it up lost
   the reward with nothing left to release another. Both rooms now re-spawn in
   `onEnter` behind a `saveKey`. **Try it in every room that gives you
   something**: open the thing, leave without taking it, come back.
2. **Save, quit, reload, and check the room is where you left it.** Persistent
   transforms (`persist: true`) — a bombed wall, a cut snarl — should survive.
   A cut bush should not.

   **A walk-back is NOT this test.** `getRoom` memoises Room instances for the
   life of the process, so leaving a screen and returning hands you the same
   object with the same override grid, and a change survives that whether or
   not it was ever written down. Only quitting to the title and loading proves
   anything. `tools/play-gates.mjs` automates exactly this for the five region
   gates and is the worked example of the distinction.
3. **Die on purpose in the middle of the mechanic.** Where do you respawn, what
   state did the room keep, and can you still finish it?
4. **Do it in the wrong order.** Take the wrong branch of a D2 fork on purpose.
   Grow a Reefseed pillar in the stupidest reachable place — `check-reefseed`
   proves you cannot brick a room that way, so if you can, that is a real find.
   Plant, leave, come back.
5. **Change the tide at the worst moment.** Sound the conch while swimming,
   mid-hop, standing on a tile that is about to become deep, standing on one
   that is about to become solid. Standing inside an Anchor patch at its edge.
6. **Cross a room seam while something is happening.** Mid-swing, mid-hop,
   being knocked back, with a thrown item in the air, carrying something.
   Transitions are where fixed-point rounding bites — `| 0` truncates toward
   zero and misrounds across x=0, which happens on every transition.
7. **Stand on the seam of two tide levels.** The field resolves per tile, so a
   hitbox spanning the edge sees two answers. Watch the O overlay's local level.
8. **Use the wrong item on everything.** A bomb on a kelp snarl (must fail —
   `cut` is its only transform), the sword while swimming (must fail), the
   Bellows and the Dredge Line while in deep water or underwater (both must
   refuse — a weighted line is thrown from your heels).
9. **Spam.** Hold every button. Mash A through a cutscene, a chest, a dialogue,
   an essence claim. Open the menu during a transition, a cutscene, a death.
10. **Play a 2x1 / 1x2 room.** Only a handful exist (D2's Reefguard Hall and
    Spire Ascent, D6's Crossed Shafts). Watch the camera with **I** on: the
    deadzone constants are `guessed` and this is the only way to settle them.

## The route

Tick a stage only when you have done the ten things above inside it.

- [ ] **Boot** — title, new game, the name entry, the opening. Then quit to
      title and load, twice.
- [ ] **Tidewatch and the four towns** (`0,4,7`, `0,4,8`, `0,5,8`, `0,9,8`).
      Every door in and out, both ways. Talk to every townsperson — **nobody
      ever has**; the dialogue is proved by `validate` and by nothing else.
      Walk each town at all three tide levels.
- [ ] **The overworld between the towns.** Every region gate, from both sides.
      Note where you got lost and where you did not know what to do next.
- [ ] **D1 Tidewash Grotto** — the Anchor. Three anchor gates and the two
      tide-gauge rooms. The gauges' plaque: is it enough? (Open art job.)
- [ ] **D2 Coral Spire** — the Lens. **Both forks, taken wrong on purpose.**
      Then hold the Lens up and read the three shafts. This is the single most
      important legibility question in the game: shallow water, deep water and
      a pit come out 4–6 RGB units apart under the ghost, and a still frame
      throws away the texture and motion that separate them. **It wants a
      person holding the button.** Say plainly whether you can tell them apart.
- [ ] **D3 Bogwater Sanctum** — the Cleats. Both modes. A torrent is drawn as
      ordinary deep water with a faster ripple; in a still it is invisible.
      **Did you learn the mechanic, or were you swept out of a room once?**
- [ ] **D4 Cliffside Cistern** — the Bellows. Six wheels. Pump at a wheel at
      the *wrong* sea and say whether you could tell "my cone does not reach"
      from "the sea is still too deep". Those want opposite responses and the
      screen currently distinguishes them not at all.
- [ ] **D5 Drowned Wood Shrine** — the Reefseed. Five groves. The bole is the
      one mechanic in the game that is legible in a still frame — confirm that
      it teaches itself in the Standing Grove before anything depends on it.
- [ ] **D6 Abyssal Keep** — the Dredge Line. Three crossings, three caches, and
      the Crossed Shafts, which is the only room holding both crossing shapes.
- [ ] **The curve.** Having played all six: which was hardest, which was
      easiest, and does the order go the right way? **No session has ever
      compared them.** This is the highest-value thing in Pass A.
- [ ] **The shipped build**, from `file://`, for at least one full dungeon.
- [ ] **A phone**, for at least one town and one dungeon. The touch layer.

---

# Pass B — mechanical faith

> Oracle of Tides has one product requirement above all others: it must feel
> like Oracle of Seasons and Ages. That is a claim about frame counts, pixels
> per frame, and the exact width of an active hitbox window.
> — `docs/FEEL-SPEC.md`

**Nothing in `src/data/feel.js` is `measured`. Not one value.** Every timing
and speed in this game is a guess that somebody typed and that has felt
acceptable since. Pass B is the only route by which that changes, and CLAUDE.md
makes the bar explicit:

> Never silently upgrade a `guessed` to `measured` — that word means someone
> actually frame-stepped a reference and wrote down the number.

## The rule for a feel finding

An impression is not a finding. **"Link feels a bit floaty" changes nothing and
should not be written down.** A finding that may touch `feel.js` needs four
things, and the fourth is the one people skip:

1. **The constant.** Name it. If you cannot name which export you are talking
   about, you are describing a symptom of several.
2. **The direction and rough size.** "Too fast, by about a quarter."
3. **What you compared against.** A reference recording of Seasons or Ages,
   named — which game, which area, which action.
4. **The frame count you counted.** Stepped, not eyeballed. How many frames the
   action took in the reference, and how many it takes here.

With 1–3 you may write the finding into `docs/FEEL-SPEC.md` as an open
question. **Only with 4 may a tag move from `guessed` to `measured`,** and the
comment beside the constant has to say what was measured and how.

## The comparison method

Play the two side by side, same session, and alternate every few minutes —
memory of feel decays in minutes, not hours. Then, for anything you flagged,
stop playing and step frames.

Half the answers are visible without a reference at all, because they are
questions about *internal consistency*: whether the sword's active window
matches its animation, whether knockback lasts as long as the flash, whether
the same action takes the same time in a dungeon as outdoors.

## The cards

Take these in order. Each names what to watch and where the number lives.

### Walking and the diagonal
Walk a straight line, then a diagonal, then a circle. `WALK_SPEED` is the
ancestor of most of the file, so it is worth more than anything below it.

**Diagonal movement is not normalised and that is deliberate** — full speed on
both axes, so diagonal is faster than cardinal. It is a signature of the source
games. **Confirm it is still there and that it feels like theirs and not like a
bug.** If a session ever "fixes" this, the game stops being an Oracle game.

### Turning, and the corner
Tap a direction without moving. Walk into a wall at a shallow angle and see
whether you slide along it. Walk into an outside corner. The Oracles are
generous here; a game that is not feels sticky and nobody can say why.

### The sword
Swing standing, swing walking, swing into a wall, swing at a bush. Watch for:
the frame the hitbox opens against the frame the blade appears; whether you can
turn during a swing; whether the swing eats a step. `check-items` proves the
sword cuts; only you can say whether it cuts *when it looks like it does*.

### Damage, knockback and invincibility
Take a hit from an ordinary enemy, from a boss, and while swimming. Count the
flash. **P9 will re-tune this** — three hearts at start, half-heart contact
damage — so a measured number here is worth more than usual right now.

### Water
Wade, swim on the surface, sink to the floor with the Cleats, and cross a
torrent both ways. `TORRENT_PUSH` is deliberately greater than swim speed and
is `derived` from a `derived` from a guess — it is the shakiest important
number in the file. Also: the breath timer. The Kelp Locks crossing is 14 tiles
and 359 frames of an 800-frame breath, a 55% margin. **Did it feel like a 55%
margin, or did you panic?**

### The camera
Only in a multi-screen room, with **I** on. Three `guessed` constants and no
reference to check them against, so they are settled by watching the box and
the player fight over the view. Does the camera lead you or chase you?

### Room transitions
The scroll's duration and whether control is returned before or after it lands.
Cross the same seam at all three tide levels. Cross it going the other way.

### The tide
Sound the conch and watch. This is the one system with no counterpart in the
source games at all, so **there is nothing to be faithful to and the bar is
different**: it has to feel like it belongs in a game that is otherwise faithful
to them. Is the transition too slow to use, or so fast it reads as a light
switch?

### The HUD, the menu and the text
Text speed, the beep, whether a message can be advanced too fast to read, the
menu's open and close. `docs/ART-DIRECTION.md` binds anything visual here.

---

## The terrain card (new, and never played)

The cliff family landed this session: every cliff is now sixteen pieces and the
piece is derived from its neighbours, so a mass has a lit top, a base shadow,
side returns and an outline it never had. `check-autotile.mjs` proves it
changed no flags anywhere. **Nobody has walked past one.** Four questions only a
person can answer:

1. **The seam.** Off-room counts as SAME, so a cliff running off a screen grows
   no edge — right when the next screen continues the mass, wrong when it does
   not. **Cross every screen boundary that has a cliff on it and say whether
   the join shows.** This is the known weak point and there is no tool for it.
2. **Is the coping too bright?** It spends palette index 0, the lightest colour
   of every cliff palette, and it appears on nearly every screen in the game.
   In stone and in abyss it reads as a lit brink; in sand and marble it may
   read as a highlight that is doing too much.
3. **Does a cliff read as a wall now, or as a wall with a stripe on it?** The
   whole claim is that a mass reads as a thing standing in the world rather
   than as wallpaper. Bog Stair (`overworld 1,6`) and Bog Causeway (`0,2,7`)
   are the two screens with interior cliffs and are the clearest test.
4. **The cracked tile.** A bombable stretch keeps its fault line while the mass
   closes around it. Does the crack still read as "bomb this" now that the
   tiles either side of it have edges? Then bomb it, and say whether the hole
   it leaves looks like a hole blown in a wall or like a missing tile.

---

## Finishing a play-test session

- [ ] Every finding written in the format above.
- [ ] Every **bug** either fixed with a replay plan, or written into
      `docs/NEXT-SESSION.md` with its repro intact.
- [ ] Every **feel** finding in `docs/FEEL-SPEC.md`. A tag moved to `measured`
      only if you actually counted frames against a named reference.
- [ ] Every **legibility** finding in `docs/ART-BACKLOG.md` with a
      `shoot-rooms` command that reproduces it.
- [ ] The **curve** — your ranking of the six dungeons, in
      `docs/DUNGEON-STATUS.md`, even if it is only an opinion. An opinion from
      somebody who has played all six is worth more than every checker in the
      repo on that one question.
- [ ] `docs/NEXT-SESSION.md` updated losslessly, and anything surprising in
      `docs/HANDOFF.md`.
- [ ] `npm run build` run and `dist/oracle-of-tides.html` committed, even if
      you changed nothing in `src/`. The build is the game.

**Write down what you did NOT get to.** A play-test session that covers two
dungeons honestly is worth more than one that claims six, and the next session
needs to know which two.
