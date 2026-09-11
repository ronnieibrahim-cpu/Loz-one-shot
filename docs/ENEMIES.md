# Enemies — what each one teaches

One line per enemy: not what it does, but what fighting it teaches the
player. `docs/prompts/STATE.md`'s enemy-roster objective (rotation #4)
asks for exactly this, with the constraint that no two entries teach the
same lesson — read against each other, not written in isolation.
Behavior is read from `src/data/enemies.js`, the single source of truth;
if this file and that one ever disagree, the code is right and this file
is stale.

This is the documentation half of the objective. The art half — every
enemy having idle/walk/attack/hurt/death sprite states, which
`tools/check-drift.mjs` currently reports as 0 of 22 complete — is a
separate, much larger undertaking (new pixel art for every enemy) and is
not addressed here.

| Enemy | What fighting it teaches |
|---|---|
| `octorok` | Its rock-throw only fires when you're on its exact row or column — step off the line and it can't touch you at range. |
| `octorokSea` | Its bubble-shot AIMS at you instead of firing along a line, so alignment doesn't save you — only distance and cover do. |
| `crab` | Shielded from the front only; you have to get to its side or back to land a hit while it's watching you. |
| `zol` | Killing it doesn't end the threat — it splits into two weaker gels, so a kill can be the start of a new problem, not the end of one. |
| `gel` | Weak alone, dangerous as a pack: each one dies in a hit, but several chasing at once punishes standing still more than any single hit does. |
| `keese` | Rests, then bursts into an erratic dash — the fight is reading the burst's start, not predicting its wandering path. |
| `leever` | Spends most of its time buried and untouchable; you only get a window to hit it while it's surfaced and chasing. |
| `bubble` | Can't be killed at all — the only correct response is staying out of its bounce path. |
| `beamos` | Never moves and only fires straight along its own facing; step off its row or column and it's harmless. |
| `beetle` | Telegraphs a straight charge before committing to it — dodge the tell, then punish from the side, since its shield only covers the front. |
| `tektite` | Closes the distance in a slow, fixed rhythm of hops; the test is timing a hit into the gap between them. |
| `wisp` | Doesn't chase at all — it punishes you for staying inside its ring on a timer, so the fight is about WHEN to be near it, not whether you can dodge a shot. |
| `urchin` | Harmless on dry ground and only wakes up once the tide covers it — the sea itself decides when this one is dangerous. |
| `moblin` | A ranged attacker that actively backs away once you close in, so cornering it matters more than just approaching. |
| `stalfos` | Chases you down on its own, then hops back the instant you're in range — it's daring you to swing into empty air. |
| `darknut` | Combines a directional shield with a committed charge: survive or dodge the lunge, then still come at it from an angle it isn't watching. |
| `wizzrobe` | Teleports in, fires one aimed shot, teleports out — the punish window is short and needs closing distance fast, not just dodging. |
| `anglerfry` | Sits still like part of the scenery until you swim past, then commits to a single fast lunge — the lesson is not trusting empty-looking water. |
| `barnacle` | Can't be killed and aims its shot straight at you, so the alignment tricks that work on other turrets don't — you have to break its line of sight or its range instead. |
| `jellyfish` | Its drift speed and direction change with the tide level, so predicting where it's going means reading the sea, not the enemy. |
| `siren` | Surfaces and fires in every direction at once, so standing at an angle doesn't help — only range or timing the window before it fires does. |
| `pincer` | Never leaves its hole and always snaps exactly two tiles out and back, so once you've measured that reach you can stand just outside it and punish the recovery. |

## Why this ordering of lessons holds together

Three enemies (`bubble`, `beamos`, `barnacle`) are unkillable by design
(`hp: 999`, no drop) and form a deliberate progression rather than a
repeated idea: `bubble` is a pure contact hazard with no attack at all,
`beamos` adds a ranged attack but one that only fires along a fixed
axis, and `barnacle` adds aim, so the axis trick that neutralises
`beamos` stops working. Three more (`leever`, `wizzrobe`, `siren`) share
one engine primitive — `submerge()`, the surface/hide cycle — but each
uses the exposure window differently: `leever` becomes a melee chaser
while up, `wizzrobe` fires one aimed shot, `siren` fires in a full ring,
so "punish the window" means something different each time. `moblin` and
`stalfos` both retreat from a close player, but `moblin` retreats to
keep using a ranged attack while `stalfos` retreats with no attack at
all, purely to deny a swing — a zoner versus an evader. `zol`/`gel` and
the tide-linked pair `urchin`/`jellyfish` are similarly built to be read
together rather than alone.
