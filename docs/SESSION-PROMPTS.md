# Session Prompts — Oracle of Tides

Eleven paste-ready prompts. Each is short because the shared material lives in
**`docs/SESSION-HANDOFF.md`**, which every prompt tells the session to read.

- **`docs/SESSION-HANDOFF.md`** — the facts: current state (`§1`, `§2`/`A…`),
  the trap catalogue (`§3`/`T…`), the verification protocol (`§4`/`V…`), the
  house rules (`§5`/`R…`), the close-out checklist.
- **`docs/ROADMAP.md`** — the sequencing, the audit reasoning, and the arguments
  about scope.
- **This file** — the prompts.

## Before you paste anything

**`R0`: one session at a time, merged to `main` before the next starts.** The
series is void if run in parallel — a reconcile on 2026-08-29 found 72 unmerged
branches, five of which independently fixed the same bug and eight of which
independently reverted the same experiment.

**Run `git ls-remote --heads origin` first** and confirm nothing else is already
doing the session.

## The series at a glance

| # | Session | Model | Needs | Your eye/ear |
|---|---|---|---|---|
| ~~S1~~ | ~~Impact: hitstop and the feel constants~~ | Opus | — | **DONE — awaiting your ear.** See `docs/NEXT-SESSION.md` |
| ~~S2~~ | ~~Terrain extraction: the ground~~ | Opus | S1 | **DONE — awaiting your eye.** See `docs/NEXT-SESSION.md` |
| ~~S3~~ | ~~Terrain extraction: edges and towns~~ | Opus | S2 | **PARTLY DONE — 2 of 4 jobs; see `docs/NEXT-SESSION.md`** |
| S4 | Sound coverage and the sfx checker | Sonnet | S1 | Yes (listen) |
| S5 | Bosses winnable by design | Opus | S1 | **Critical** |
| S6 | Music engine: vibrato, echo, arpeggio | Sonnet | S4 | Yes (listen) |
| S7 | Music composition: intros and forms | Opus | S6 | **Critical** |
| S8 | Overworld map becomes a picture | Opus | S2, S3 | Yes |
| S9 | Townspeople react (half session) | Opus | S5 | Yes (read) |
| S10 | Cutscenes draw pictures; Nereth's intro | Opus | S5 | Yes (watch) |
| S11 | Orphaned checkers; feel.js measurement | Sonnet + Opus | S1 | Yes |

**The model rule:** Sonnet where a checker defines correctness; Opus where only
a person can judge. Seven of eleven are Opus, and every one needs you at the end
— that is what `§4.2` means in practice, not a scheduling flaw.

**If you run only one, run S1.** It is the only item felt on every frame of play,
it is one session rather than a programme, and no checker can ever tell you
whether a hit feels good.

---

## S1 — Impact: hitstop, shake weight, and the missing feel constants

> **DONE.** Hitstop exists (`Game.freeze`/`Game.hitstop`), the six shake
> constants were re-tuned and `bosses.js`'s fourteen bare shake literals came
> into `feel.js` with them, the text speed and fast-forward multiplier moved out
> of `dialogue.js`, the death poof was checked and deliberately left alone, and
> `ITEM_PRESENT_FRAMES` went 90 → 116 (`derived` from the `itemGet` jingle's own
> tempo). All 51 replays re-recorded; 65/65 in `test.mjs`, including six new
> assertions that the freeze stops the entity simulation and NOT the frame
> counter, the audio pump or the play clock — proved to fail in both directions.
> **The weight itself is unjudged and is the user's call (`§4.2`);
> `docs/NEXT-SESSION.md` names the five things to compare in the build.**


**Goal:** a sword hit, an enemy death and a player hit land with the weight they
have in the source games.

**Failure condition:** shipping a hitstop that freezes the *whole game* —
including the HUD, the music and the tide — rather than the entity simulation.
Oracle hitstop is a simulation pause, not a frame halt. **If the music stutters
on every sword swing, the session failed.**

**Model: Opus** — nothing here is checker-definable.  **Depends on:** nothing.

> Read `docs/SESSION-HANDOFF.md` first: `§0`, area `A1`, rules `R1`–`R3`, `R7`,
> `R9`, traps `T1`–`T8`, `T24`, verification `V11`, `V13`, `V16`, `§4.2`, and the
> close-out checklist in `§5`. Also read `docs/FEEL-SPEC.md`.
>
> Oracle of Tides has no hitstop — the concept does not exist anywhere in `src/`.
> Add it, then retune the impact constants around it.
>
> 1. **Hitstop.** A short simulation pause on a connecting hit, at three weights:
>    player sword landing on an enemy, enemy or hazard landing on the player, and
>    a boss dying. **It must pause the ENTITY SIMULATION ONLY** — the HUD, music,
>    tide sweep and shake offset all keep running. Check by ear, not by assertion.
> 2. **Shake.** The six constants at `src/data/feel.js:389-405` are all `guessed`
>    and were tuned with no hitstop in front of them. Retune — shake reads
>    completely differently when a freeze precedes it.
> 3. **Text speed.** `src/game/dialogue.js:33` hardcodes `this.speed = 1.6`, and
>    line 86 hardcodes the `fast ? 3 : 1` multiplier. **This violates `R3`.** Move
>    both into `feel.js` with units and provenance, and tune the cadence and text
>    beep against the source while you are there.
> 4. **Death poof timing and the item-get pose.** Check against the source and
>    adjust if off. **If they are already right, say so and change nothing** —
>    do not rewrite them to look busy.
>
> `T5` is the one that will cost you if you forget it: hitstop moves all 51
> recorded replays. That is expected churn, not breakage. **Re-record
> deliberately in the same commit and say so; never loosen a replay to pass.**
> Verify the churn is churn by watching one (`T6`).
>
> Prove it with `V16`, `V11`, `V13`. **Then stop and hand it to me**: build, and
> tell me which room, which enemy and which two things to compare in
> `dist/oracle-of-tides.html`. Per `§4.2`, do not call the weight "verified" —
> that is my call, and it is the point of the session.

---

## S2 — Terrain extraction, pass 1: the ground you stand on

> **DONE.** `grass` is extracted (Seasons' own field grass) and the hand-drawn
> original is deleted; `grassClump` joins it; ground tiles can declare
> `variants`, picked by a pure hash of room and cell, and `grass`/`grassDark`/
> `grassBog` scatter one cell in seven. **The rate was measured by rendering
> whole rooms, and an even mix — the obvious implementation — is a chessboard
> (`T61`).** The source has no multi-cell ground patterns and the scan that
> proves it is committed as `--supercells` (`T63`). `dFloor`'s one tonal match
> was a motif mismatch and was reverted (`T62`). `rockFloor` needs a tile no
> sheet has and is backlogged. **All 51 replays stayed green with no
> re-recording, which is the proof the change is draw-only.** Whether the grid
> is gone is the user's call (`§4.2`); `docs/NEXT-SESSION.md` names the shots.

**Goal:** grass, sand and ground textures come off the sheets with enough
variants that a field stops reading as one repeated cell.

**Failure condition:** hand-drawing new grass variants "to match" instead of
extracting them. That is exactly what `R5` exists to prevent and **no checker
will catch it.**

**Model: Opus.**  **Depends on:** S1 merged.

> Read `docs/SESSION-HANDOFF.md` first: `§0`, area `A2`, rules `R5`, `R7`, `R9`,
> traps `T1`, `T2`, `T10`, `T18`–`T24`, `T26`, verification `V1`, `V2`, `V3`,
> `V7`, `V11`, `V16`, `V18`, `§4.2`, and `§5`. Also read `docs/ART-DIRECTION.md`
> (the authority) and `docs/briefs/AGENTS.md` section J (the workflow).
>
> The base terrain in this game is hand-drawn and `R5` says it should not be.
> **This session does the ground only.** Cliffs, water edges and town fronts are
> S3 — do not start them.
>
> 1. Check `assets/sheets/` for grass, sand and ground textures. The sheets are
>    richest in exactly this. Extract every usable variant.
> 2. Add them to `tools/rip-terrain.py`'s coordinate map and re-emit
>    `src/data/tiles-terrain.js`. **Per `T19`, `pip install pillow` and run the
>    ripper ONCE BEFORE changing anything** to confirm byte-identical
>    reproduction. If it does not reproduce, **stop and report it** — that means
>    the generated file has been hand-edited, which is a separate problem.
> 3. Wire the variants in so a field picks among them. **Per `T2` the choice must
>    be a deterministic hash of tile coordinates, never a draw from the RNG
>    stream** — a variant from the stream desyncs every replay and makes the
>    ground flicker. `every(e, n)` is the precedent.
> 4. Retire hand-drawn originals from `tiles-core.js` **only** where an extracted
>    tile actually replaces them. List what the sheets could not cover in
>    `docs/ART-BACKLOG.md` for S3.
>
> Prove it with `V1`, `V2`, `V3`, `V7`, `V16`. **`V11` must stay green — a
> terrain change should NOT move a replay, and if it does your variant choice is
> leaking into simulation.** Run `V2`/`V3` after each placement batch, not at the
> end (`T10`).
>
> **Then show me `V18` screenshots across several overworld regions.** Per `T21`,
> `tools/preview.mjs` renders one palette and cannot settle this. Per `§4.2`,
> whether the grid is actually gone is my call, not yours.

---

## S3 — Terrain extraction, pass 2: edges, cliffs and town fronts

> **PARTLY DONE. Jobs 1 and 4 landed; jobs 2 and 3 are answered, not skipped.**
> **Job 1 (cliffs):** `cliff` and `cliffTop` extracted from Seasons' terraced
> cliffs, and an autotiler (`family` + `edgeArt`) now draws the lip on the top
> row of every cliff mass with ZERO room-grid changes. The real finding is
> `T65`: `cliffTop` was placed zero times in 1,307 cliff cells, so the game had
> one piece where the source has a set. Corner set still missing — backlogged
> with the reason. **Job 4 (town fronts):** audited, all 51 cells and 10 blocks
> already extracted, no gap, nothing changed. **Job 2 (water edges): BLOCKED** —
> the mechanism fits exactly and would be correct at all three tides for free,
> but water is animated and every sheet here is a static map, so foam cannot be
> extracted. **Job 3 (tree borders): NOT DONE ON PURPOSE** — the source's own
> tree borders repeat identically, so breaking the period is a deviation and
> `R9` says fidelity wins; the real difference is room data, not art.
> All 51 replays stayed green. See `docs/ART-BACKLOG.md` and
> `docs/NEXT-SESSION.md`.

**Goal:** cliff edges, water edges and town-building fronts stop betraying a
hand, and the tree borders stop repeating on a visible period.

**Failure condition:** severing a town screen. `T13` — four separate layouts died
of this before `check-towns.mjs` existed.

**Model: Opus.**  **Depends on:** S2 merged.

> Read `docs/SESSION-HANDOFF.md` first: `§0`, area `A2`, rules `R5`, `R7`, `R9`,
> traps `T10`–`T15`, `T18`–`T24`, `T27`, verification `V1`–`V4`, `V7`, `V11`,
> `V16`, `V18`, `§4.2`, `§5`. Also `docs/ART-DIRECTION.md`,
> `docs/briefs/AGENTS.md` section J, and the list S2 left in
> `docs/ART-BACKLOG.md`.
>
> Continue the extraction S2 started. That session did the ground; this one does
> the edges and the built environment, which is where a hand shows most.
>
> 1. **Cliff edges** — `cliff`, `cliffTop`, `cliffCracked` and the corner/base
>    pieces are hand-drawn. Extract replacements **and the full corner set**: a
>    cliff with a top, a base and outside corners but no *inside* corner reads
>    wrong immediately.
> 2. **Water edges** — the shoreline between water and every terrain it touches.
>    Three tide levels, so **every shoreline tile has to read at all three.**
> 3. **Tree borders.** These repeat on a visible period. The comment at
>    `tiles-core.js:406` explains why trees are one cell each and that constraint
>    survives extraction — extract variants and break the period.
> 4. **Town-building fronts** — 51 pieces in `TOWN_ART`. Audit which are
>    extracted and which authored, and close the gap.
>
> `T13` is the one that will cost you: a 10×8 town screen holding two 3×3
> buildings has **exactly one row crossing it**, so any three-tile-wide object in
> that row severs the screen — usually only at HIGH. Use `T11`/`find-ledges.mjs`
> for any ledge, and never place by eye.
>
> Prove it with `V1`, `V2`, `V3`, `V4`, `V7`, `V11`, `V16`, running the town and
> dungeon floods after **each** placement batch. **Then show me `V18` screenshots
> of every town screen at all three tide levels, plus one cliff region and one
> shoreline at all three.** Per `§4.2` the read is mine.

---

## S4 — Sound: close the silent gaps

**Goal:** every player action and world event makes a sound, and no call site is
a silent no-op.

**Failure condition:** adding twenty new sfx and leaving the four existing
no-ops still silent. **The bugs come first.**

**Model: Sonnet** — "which call sites resolve to a defined sfx" is exactly
checker-definable, and this session should *write that checker*. The new sound
design still needs an ear, so it ends with a hand-off.  **Depends on:** S1 merged.

> Read `docs/SESSION-HANDOFF.md` first: `§0`, area `A4`, rules `R3`, `R7`, traps
> `T44`–`T46`, verification `V10`, `V16`, `§4.2`, `§5`. `docs/ITEMS.md` is the
> item-verb roster.
>
> **Bugs first — four silent no-ops that have survived six sessions.** `A4` lists
> them with exact file:line. Note that `secret` is a **wrong-function** bug, not a
> missing asset (`T44` — a `secret` jingle exists and is called correctly
> elsewhere); decide whether that site wants the jingle or its own sfx. Note also
> that `boss` and `title` are **music tracks**, not sfx — do not "fix" them, and
> the six dynamically-called names listed in `A4` are **not** dead, so leave them
> alone.
>
> **Then the three genuinely dead definitions** (`dig`, `pegasus`, `shoot`):
> either wire each to the verb it was written for or remove it. Do not leave them.
>
> **Then the coverage audit.** Walk the player's verbs and the world's events and
> find what has no sound at all. At minimum: entering and leaving water at each
> tide, the tide sweep itself, every item's B-button verb in `docs/ITEMS.md`,
> taking a ledge, a locked door refusing, a heart piece vs a heart container, a
> boss phase change, the low-health warning, menu open/close, saving. **Report
> what you find before writing sounds for it.**
>
> **Then write the checker.** A tool that fails when `src/` calls an sfx name
> `src/data/audio.js` does not define permanently closes `T45`. Watch out for the
> dynamic names in `A4` — it must not false-positive on a data-driven name and
> must not miss one either. Wire it into `tools/test.mjs` and add a row to
> `CLAUDE.md`'s verification table and to `§4.1` of the handoff.
>
> **Prove the checker works: show it FAILING on `main` before your fix and passing
> after.** A checker that has never been red proves nothing. Then `V10`, `V16`.
>
> **Then hand it to me to listen to** — build, and name the specific actions to
> perform to hear each new sound. Per `§4.2` a checker proves a sound exists, not
> that it is right.

---

## S5 — Bosses: winnable by design, not by AI

**Goal:** all six bosses beatable by a real player at the hearts they would
realistically carry — by changing boss *specifications*, not the actor.

**Failure condition:** spending the session tuning `dBoss`. **`T34` — eight
strategies measured and reverted, seven converge on one wall. A ninth is
disproven before you write it.**

**Model: Opus** — "is this fight fair" is a design judgment. A checker can only
prove a fight is finishable *by a robot*, which is a different claim.
**Depends on:** S1 merged (hitstop changes every fight's timing).

> Read `docs/SESSION-HANDOFF.md` first: `§0`, area `A8`, rules `R7`–`R9`, `R12`,
> traps `T32`–`T43`, verification `V2`, `V9`, `V12`, `V13`, `V16`, `V17`, `§4.2`,
> `§5`. **Then read `docs/HANDOFF.md` → "Negative results — the boss-verb corpus"
> IN FULL.** It consolidates sixteen sessions and will save you the entire session
> if you skip it.
>
> **The central finding is `T33`: the ceiling is structural, not tactical.** An
> unlimited-health Gohmaraq run still sticks at 14 hp forever, because its
> melee-vulnerable range is a strict subset of its charge-trigger range.
> **Therefore this session changes `src/data/bosses.js`, not
> `tools/actor-runtime.mjs`.** The actor is a measuring instrument, not a player.
>
> Work in this order:
>
> 1. **Wyverna first — she may already be won.** `A8` has the numbers and the
>    heart-piece arithmetic. **Confirm with a route, not arithmetic.** If it
>    holds, that is one boss done for free.
> 2. **Gohmaraq — fix the range subset.** Its phase-2 charge `range` must not
>    cover the distance a player stands at to swing. That is a number in
>    `bosses.js` and it is the whole fix. **Verify it does not make the fight
>    trivial.**
> 3. **Nereth — separate the volley from the opening.** `A8` has the diagnosis.
>    **Do NOT go looking for a missing conch verb — that was checked and is
>    WRONG.**
> 4. **Anemos** — `A8` explains why its lash is designed, not broken. Judge the
>    ratio; change it only if you conclude it is unfair, and say which.
> 5. **Gloomtide and Rootmaw** — measure the same way and treat what you find.
>
> **Fix `T42` while you are in the file**: `e.charging` sticks true forever once a
> phase stops calling `charge()`, which Gohmaraq's final phase does.
>
> Use `V17` (`measure-boss-combat.mjs`) for real-combat numbers — **`T43`: three
> sessions rebuilt that harness by hand because a doc sentence described it and no
> tool existed.** Do not rebuild it a fourth time.
>
> Prove it with `V12` (**stating plainly that it is god mode, `T37`**), `V17` at
> the in-order heart count per boss with a before/after table in the commit
> message, then `V2`, `V9`, `V13`, `V16`. **Then hand each fight to me: per
> `§4.2`, a robot beating a boss is not a player beating a boss, and a boss the
> actor cannot beat may be perfectly fair.**
>
> Update `docs/DUNGEON-STATUS.md` as well as the close-out list.

---

## S6 — Music engine: vibrato, echo and arpeggio

**Goal:** `src/core/audio.js` grows the three channel techniques the source games
lean on, so S7 has something to compose with.

**Failure condition:** implementing vibrato as a smooth sine LFO on a continuous
oscillator. The hardware retriggers pitch on a frame grid; a smooth analogue
wobble sounds like a synth pad, not a GBC.

**Model: Sonnet** — a well-specified DSP task against an existing synth with a
clear reference, and `check-music.mjs` already defines much of correctness.
**Depends on:** S4 merged (both touch the audio engine — do not run them together).

> Read `docs/SESSION-HANDOFF.md` first: `§0`, area `A5`, rules `R3`, `R7`, `R9`,
> traps `T1`, `T2`, `T46`, verification `V10`, `V16`, `§4.2`, `§5`.
>
> `src/core/audio.js` is a 4-channel Game Boy-style synth supporting per-channel
> `duty`, `decay` and `glide` **and nothing else**. Add the three techniques the
> source leans on constantly, as data-driven per-channel and per-note options:
>
> 1. **Vibrato** — pitch wobble on sustained notes, with a delay before onset (the
>    source almost never wobbles from the attack), a rate and a depth. **It must
>    step on a frame grid, not glide smoothly.**
> 2. **Echo** — the classic GBC quieter, delayed repeat of the lead on the second
>    pulse channel. Decide whether it is a channel config or a pattern-authoring
>    convention, and **say why in a comment.**
> 3. **Arpeggio** — a fast cycle through a chord's notes on one channel, standing
>    in for polyphony the hardware does not have.
>
> All three must be expressible in `src/data/audio.js`'s existing pattern format
> **without breaking the 22 tracks already written.** A track that does not ask
> for the new options must sound byte-identical — **prove that, because a
> regression here is silent.**
>
> Per `T46`, `check-music.mjs` already asserts every note sits in its channel's
> real frequency range. **Vibrato depth can push a note out of range at the
> extremes — extend the checker to validate the swung extremes, not just the
> written pitch.** The noise channel takes percussion only; do not give it
> vibrato. Any rate or delay is a timing constant and belongs in `feel.js` (`R3`).
>
> **Do NOT recompose the existing tracks — that is S7.**
>
> Prove it with `V10` (extended), `V16`, and the byte-identical render. **Then
> hand me one track using each technique** — per `§4.2`, whether the vibrato
> sounds like a Game Boy or a synthesiser is the judgment the session turns on and
> there is no assertion for it.

---

## S7 — Music composition: intros and longer forms

**Goal:** tracks get intros and enough material that standing in a town for two
minutes does not mean hearing eight bars fifteen times.

**Failure condition:** making tracks longer by adding patterns that are
variations of A. **Length without development is worse than a short loop** — it
delays the repeat without hiding it.

**Model: Opus** — composition is the definition of a judgment call.
**Depends on:** S6 merged. This session needs the new techniques to exist.

> Read `docs/SESSION-HANDOFF.md` first: `§0`, area `A5`, rules `R3`, `R7`–`R9`,
> traps `T2`, `T46`, verification `V10`, `V16`, `§4.2`, `§5`.
>
> **Be accurate about what is already there — `A5` corrects the common framing.**
> Several tracks already have labelled bridges and `overworld` has a
> call-to-adventure flourish. **Do not rewrite what works.** What is genuinely
> missing:
>
> 1. **No track has an intro** — a non-looping lead-in played once before the loop
>    begins. The engine's `order`/`loop` model has no concept of one. Add it
>    (engine + data), then write intros **where they earn their place**. Not every
>    track wants one.
> 2. **Loop length.** Extend the tracks a player hears longest — overworld, towns,
>    dungeon themes — with **genuinely new material. If you cannot say in one
>    sentence what a new pattern does that the existing ones do not, do not add
>    it.**
> 3. **Use S6's vibrato, echo and arpeggio.** They are most of what separates a
>    source track from a chiptune approximation: sustained leads want vibrato, the
>    second pulse wants echo behind the lead, the wave channel wants arpeggios
>    where the harmony needs a chord.
>
> **`R8` still binds: the music is ours.** Borrow the genre's grammar — the
> fanfare gesture, call-and-response, modal shifts — **never a melody.**
> `overworld`'s pattern D already carries a comment drawing exactly this
> distinction; follow it.
>
> An intro is new structure, so **extend `check-music.mjs` to cover it** rather
> than letting intros go unvalidated. Prove with `V10` (extended) and `V16`.
> **Then hand me the three longest-heard tracks and tell me where to stand to hear
> a full loop.** Per `§4.2`: a checker can prove a note is legal, never that a
> phrase is good.

---

## S8 — The overworld map screen becomes a picture

**Goal:** opening the map on the overworld shows a drawn map of Thalassia, not a
grid of rectangles.

**Failure condition:** breaking the dungeon map, which is genuinely good and
shares this code path.

**Model: Opus.**  **Depends on:** S2 and S3 merged — the map should reflect the
final terrain.

> Read `docs/SESSION-HANDOFF.md` first: `§0`, area `A3`, rules `R7`, `R9`, traps
> `T2`, `T23`, `T24`, `T53`, verification `V11`, `V13`, `V16`, `V18`, `§4.2`,
> `§5`. Also `docs/ART-DIRECTION.md`.
>
> `Menu.drawMap` (`src/game/menu.js:270`) draws the overworld with the same
> `fillRect` grid loop it uses for a dungeon floor. A player opening the map sees
> coloured squares; both source games draw a picture of the land, and it is one of
> the screens a player looks at most.
>
> **The dungeon map is NOT the problem and must not regress** — `A3` says why it
> is good. Leave it alone except to split the code path.
>
> 1. Split the overworld map from the dungeon map so they no longer share a
>    drawing routine.
> 2. Draw Thalassia as a picture: coastline, regions, towns, dungeon entrances as
>    landmarks. Extract from `assets/sheets/` whatever the source map screens can
>    supply (`R5`); draw the rest to `T24`'s rules.
> 3. **Keep every piece of information the grid currently carries** — which
>    screens have been seen, where the player is, what the Chartstone reveals. **A
>    prettier map that tells the player less is a regression.**
> 4. The player marker must be legible against every part of the drawn map; the
>    source games blink it for exactly this reason.
>
> **The trap that will bite you is in the existing code's own comment: do not
> instantiate rooms to draw the map.** It reads from the room DEFINITION because
> "an instantiated room is one `liveRooms` will then save and restore the state
> of" — reading live rooms would silently corrupt save state. And per `T23`, draw
> from tiles/sprites or integer `fillRect`s, never paths, or it reads soft against
> a pixel-art game.
>
> Prove with `V11`, `V13`, `V16`. **Then screenshot the dungeon map before and
> after and show it is unchanged**, including a multi-screen room and the
> Chartstone pips — `T53`, assertions prove existence, never appearance. Screenshot
> the new overworld map at three states: unexplored, partly explored, fully
> explored with the Chartstone. **Then hand it to me.**

---

## S9 — Townspeople react to the plot (HALF SESSION)

**Goal:** ordinary townspeople's lines move with the story, so the world
acknowledges what the player has done.

**Failure condition:** rewriting the existing lines. **The writing is good.** This
session adds states; it does not re-voice anybody.

**Model: Opus** — it is writing. **Scope it as half a session**: pair it with S10
or accept a short one.  **Depends on:** S5 merged, so lines can react to beaten
bosses.

> Read `docs/SESSION-HANDOFF.md` first: `§0`, area `A6`, rules `R7`, `R8`, traps
> `T13`, `T47`–`T50`, verification `V7`, `V8`, `V16`, `§4.2`, `§5`.
>
> **First, correct the premise you may have been given.** `A6` has the counted
> numbers: coverage is **not** the problem, and the reactive machinery
> (`dialogue`/`waiting`/`after` on `npc`/`sign`/`giver`) **already exists and is
> already used by every quest-giver.** No engine work is needed unless the
> two-state model proves genuinely insufficient — **and if it does, say so rather
> than quietly building a third system.**
>
> Decide the six orphan ids listed in `A6`: place them or delete them.
>
> **The actual gap:** the ~21 ordinary townspeople listed in `A6` have exactly one
> line that never changes for the whole game. Give each at least one additional
> state keyed to a story beat a person in that town would plausibly know about —
> an Essence taken, a dungeon cleared, the tide behaving differently, a trade
> completed.
>
> **Do not rewrite the existing lines.** `A6` describes the register: the four
> peoples of Thalassia say what they think of each other by complaining, never by
> exposition. **A new line that explains the plot is wrong for this game.** Keep
> the format — three short lines, none much past 34 characters without a `\n` or a
> space to break on.
>
> `T47` is the failure mode to guard against: an id the map asks for and
> `story.js` does not define shows an **empty box**, silently. **Close it with a
> checker** proving every referenced id is defined and every defined id is
> referenced, wired into `tools/test.mjs` and added to `§4.1`.
>
> Prove with the new checker, `V7`, `V8`, `V16` — and per `T48`, re-run
> `check-trade.mjs` if you touch the `giver` or the shop. **Then paste me one
> town's lines at three story stages.** Per `§4.2`, whether they are in voice is
> my read, not a checker's.

---

## S10 — Cutscenes draw pictures, and Nereth gets an entrance

**Goal:** `src/game/cutscene.js` gains visual steps, and the orphaned
`nerethIntro` actually plays.

**Failure condition:** building a general animation system. **Add the specific
steps the 13 existing cutscenes need, and stop.**

**Model: Opus** for what the scenes should show; the engine steps are mechanical.
**Depends on:** S5 merged — `nerethIntro` is a boss intro.

> Read `docs/SESSION-HANDOFF.md` first: `§0`, area `A7`, rules `R3`, `R7`, `R9`,
> traps `T2`, `T23`, `T53`, verification `V2`, `V4`, `V11`, `V13`, `V16`, `V18`,
> `§4.2`, `§5`.
>
> `src/game/cutscene.js` has a rich step vocabulary and **not one step that draws
> anything** — it can move the world and talk about it, but cannot show a picture.
> `nerethIntro` (`story.js:237`) has no trigger anywhere in `src/`: it is written
> and has never played. Wire it to Nereth's boss room.
>
> **Add only the steps the existing scenes actually want:**
> 1. A camera step — pan to a point, hold, return. The source uses this constantly
>    to show a door opening across the room. **The camera already exists
>    (`src/game/camera.js`); use it, do not write a second one.**
> 2. A sprite/image step — draw a specific sprite or full-screen image for N
>    frames.
> 3. Whatever the 13 existing scenes are visibly working around. **Read all 13
>    first and let them tell you what is missing — do not design the vocabulary up
>    front.**
>
> Then use the new steps to make the scenes that most need them land: the opening,
> the essence gets, `nerethIntro`, and the ending.
>
> **Resist scope creep.** A general timeline/animation system is not the goal and
> will not be finished.
>
> Pan speeds, hold durations and fade lengths are timing constants (`R3`).
> A cutscene that warps, sets a flag or gives an item is on the progression path,
> so run `V4` and `V13` after any such change.
>
> Prove with `V2`, `V4`, `V11`, `V13`, `V16`, and prove `nerethIntro` fires by
> reaching Nereth's room in the harness. **`T53` is why this session needs
> screenshots: every boss's reveal rendered as an empty room for the project's
> whole life while assertions proved the boss existed.** Screenshot every cutscene
> you touch, mid-scene. **Then watch all 13 end to end with me** — per `§4.2`,
> pacing is not assertable.

---

## S11 — Recover the orphaned checkers, and pay down the feel.js measurement debt

**Goal:** multi-screen rooms get the two checkers written for them and never
merged; `feel.js` stops being entirely guesses.

**Failure condition:** marking constants `measured` without actually
frame-stepping a reference. **That word has a specific meaning here and inflating
it destroys the file's value permanently.**

**Model: Sonnet** for the checker recovery (mechanical; the checkers define their
own correctness). **Opus** for the frame-stepping, which is measurement against a
reference only a person can perform.  **Depends on:** S1 merged — it will have
moved several of these constants.

> Read `docs/SESSION-HANDOFF.md` first: `§0`, areas `A1`, `A9`, rules `R2`–`R4`,
> `R7`, traps `T3`–`T8`, `T9`, `T51`, `T52`, `T56`, verification `V11`, `V13`,
> `V16`, `§4.2`, `§5`. Also `docs/FEEL-SPEC.md`.
>
> **Job 1 — recover two orphaned checkers.** `A9`: multi-screen rooms shipped to
> `main` **without** `tools/check-camera.mjs` and `tools/check-wide-rooms.mjs`.
> The branch holding them is 90 commits behind, so **rewrite them from scratch
> against the current engine — do not port code you cannot read** (`T56`).
>
> They must prove: a room declaring a size in screens is internally consistent;
> the camera's deadzone follower behaves at every room size and is a genuine no-op
> in a one-screen room; internal seams between screens are not boundaries; a wide
> room's exits are on its outer edge only. **Per `R4` they must call the engine's
> own collision and camera code, never re-derive it.** Wire both into
> `tools/test.mjs`, add rows to `CLAUDE.md`'s table and to `§4.1`.
>
> **Job 2 — measure the feel constants.** `A1`: nothing in `feel.js` is
> `measured`; every value is a guess in a project whose first goal is fidelity.
> Frame-step a reference and convert as many as you honestly can, starting with
> what a player feels most: walk speed, sword swing duration, knockback distance
> and duration, invulnerability frames, room transition duration, and text speed
> (S1 will have moved it into the file).
>
> **`R3`/`T4` are absolute here: `measured` means someone actually frame-stepped a
> reference and wrote the number down.** If you cannot measure one, leave it
> `guessed` and say why. **A derivation you cannot measure should be written down
> and left unapplied.** Do not quietly upgrade provenance.
>
> `T5` applies again — changing a feel constant moves all 51 replays; re-record
> deliberately, never loosen. And per `T3`, **if a seeded run varies, that is an
> initialisation-order bug. Find it. Never add a retry.**
>
> **Prove both checkers work by showing them FAIL against a deliberately broken
> room**, then `V16`, `V11`, `V13`. Put a table in the commit message: constant,
> old value, new value, provenance, and what reference was stepped. **Then play it
> with me after each batch** — per `§4.2`, a measurement can be correct and still
> wrong for this game, since our sprites and rooms are not the source's.

---

## After the series

`docs/ROADMAP.md` holds the arguments about what **not** to do — in short: no
ninth boss-AI tuning session (`T34`), no full session on dialogue coverage
(`A6`), do not touch the HUD or the dungeon map (`A3`), do not rewrite the NPC
dialogue (`A6`), never add a retry to a flaky test (`T3`).

Each session must leave `docs/SESSION-HANDOFF.md` true: update `§1`/`§2` if you
changed a fact, and append new traps to `§3` with the next free number. **A stale
handoff is worse than none**, because eleven prompts point at it.
