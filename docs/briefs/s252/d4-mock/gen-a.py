#!/usr/bin/env python3
"""Writes option-a-ice.json (the ice check, door standing open) and
option-a-shoot.json (the renders, door shut). Re-run after editing the grid."""
import json, sys

SHUT = [
    "###############",
    "##3OO.#.......#",
    "#####0#.....U.#",
    "#####0#0000000#",
    "#.............#",
    "#.........U....",
    "#.U.......#####",
    "#.........#...#",
    "#..333333.D...#",
    "#.........#...#",
    "###############",
]
OPEN = [r.replace('D', 'o') for r in SHUT]
for g in (SHUT, OPEN):
    assert len(g) == 11 and all(len(r) == 15 for r in g), [len(r) for r in g]

# --- the ice check: door stood open, block in the cell, plate at the top
ice = {
    "legend": "dungeonCistern",
    "rooms": {"penstock": OPEN},
    "claims": {"penstock": {"from": [14, 5], "seas": [0, 1], "blocks": [[12, 8]], "plates": [{"x": 8, "y": 1}]}},
}
json.dump(ice, open('option-a-ice.json', 'w'), indent=1)

# --- the Bellows check: a one-room dungeon-4 map (see run-bellows-mock.mjs)
bell = {
    "legend": "dungeonCistern",
    "rooms": {"penstock": SHUT},
    "bellowsRoom": {"wheel": [2, 1], "stand": [5, 1], "face": "left", "at": 1, "opens": [[10, 8]]},
}
json.dump(bell, open('option-a-bellows.json', 'w'), indent=1)

ents = lambda *e: [list(x) for x in e]
base = [("block", 12, 8, {"once": False}), ("switch", 8, 1), ("wheel", 2, 1, {"needTurns": 40}),
        ("chest", 12, 8)]
shots = [
    {"room": "penstock", "tide": 0, "out": "a-low.png",
     "entities": ents(("iceblock", 12, 8), ("switch", 8, 1), ("wheel", 2, 1, {"needTurns": 40}), ("tektite", 4, 5))},
    {"room": "penstock", "tide": 1, "out": "a-mid.png",
     "entities": ents(("iceblock", 12, 8), ("switch", 8, 1), ("wheel", 2, 1, {"needTurns": 40}), ("tektite", 4, 5))},
    {"room": "penstock", "tide": 2, "out": "a-high.png",
     "entities": ents(("iceblock", 12, 8), ("switch", 8, 1), ("wheel", 2, 1, {"needTurns": 40}), ("tektite", 4, 5))},
    # step 1 done: LOW, the shoved block caught in the first well it met
    {"room": "penstock", "tide": 0, "out": "a-low-caught.png",
     "entities": ents(("iceblock", 8, 8), ("switch", 8, 1), ("wheel", 2, 1, {"needTurns": 40}))},
    # step 2: MID, the block afloat in the well, the sump band under the lane
    {"room": "penstock", "tide": 1, "out": "a-mid-launch.png",
     "entities": ents(("iceblock", 8, 8), ("switch", 8, 1), ("wheel", 2, 1, {"needTurns": 40})),
     "link": {"tx": 8, "ty": 9, "dir": "up"}},
    # the cone, MID, Link at the stand (5,1) blowing left onto the wheel's well
    {"room": "penstock", "tide": 1, "out": "a-mid-cone.png",
     "entities": ents(("iceblock", 12, 8), ("switch", 8, 1), ("wheel", 2, 1, {"needTurns": 40})),
     "link": {"tx": 5, "ty": 1, "dir": "left", "bellows": True},
     "overrides": [{"tx": 5, "ty": 1, "r": 3, "delta": -1, "shape": "cone", "dx": -1, "dy": 0}]},
]
spec = {"legend": "dungeonCistern", "rooms": {"penstock": SHUT}, "shots": shots}
json.dump(spec, open('option-a-shoot.json', 'w'), indent=1)
print('ok')
