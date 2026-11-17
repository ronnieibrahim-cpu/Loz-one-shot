#!/usr/bin/env python3
"""Writes option-b-bridge.json (the held-bridge check), option-b-bellows.json
(the Bellows check, bridge down) and option-b-shoot.json (renders)."""
import json

# The bridge UP, the chest door shut: the room as it is entered.
UP = [
    "###############",
    "#.....OOO#.OO3#",
    "#33333OOO#0####",
    "#.....OOO#0####",
    "#.....OOO#....#",
    "#.....OOO.....#",
    "#44444OOO#....#",
    "#.....OOO###D##",
    "......OOO#....#",
    "......OOO#....#",
    "###############",
]
# The same room with the three planks laid: what check-bellows is shown, since
# it floods terrain only and a bridge down is floor.
DOWN = [r for r in UP]
DOWN = [list(r) for r in DOWN]
for x in (6, 7, 8):
    DOWN[5][x] = '.'
DOWN = [''.join(r) for r in DOWN]
for g in (UP, DOWN):
    assert len(g) == 11 and all(len(r) == 15 for r in g), [len(r) for r in g]

bridge = {
    "legend": "dungeonCistern",
    "rooms": {"weirwalk": UP},
    "claims": {"weirwalk": {"index": 4, "blocks": [[3, 7]], "bridge": {
        "from": [0, 8], "target": [11, 5], "plate": [3, 1],
        "planks": [[6, 5], [7, 5], [8, 5]], "seas": [1, 2, 0]}}},
}
json.dump(bridge, open('option-b-bridge.json', 'w'), indent=1)

bell = {
    "legend": "dungeonCistern",
    "rooms": {"weirwalk": DOWN},
    "bellowsRoom": {"wheel": [13, 1], "stand": [10, 1], "face": "right", "at": 1, "opens": [[12, 7]]},
}
json.dump(bell, open('option-b-bellows.json', 'w'), indent=1)

E = lambda *e: [list(x) for x in e]
common = [("block", 3, 7, {"once": False}), ("switch", 3, 1), ("wheel", 13, 1, {"needTurns": 40}),
          ("chest", 12, 9, {"pickup": "rupee50"}), ("keese", 11, 5)]
planks = [[x, 5, "dBridgeGrottoH"] for x in (6, 7, 8)]
shots = [
    {"room": "weirwalk", "tide": 0, "out": "b-low.png", "entities": E(*common)},
    {"room": "weirwalk", "tide": 1, "out": "b-mid.png", "entities": E(*common)},
    {"room": "weirwalk", "tide": 2, "out": "b-high.png", "entities": E(*common)},
    # step 2 of the solution: MID, the block carried over the drain to the
    # near side of the well band
    {"room": "weirwalk", "tide": 1, "out": "b-mid-carried.png",
     "entities": E(("block", 3, 3, {"once": False}), ("switch", 3, 1), ("wheel", 13, 1, {"needTurns": 40}),
                   ("chest", 12, 9, {"pickup": "rupee50"}))},
    # step 4: LOW, the block on its plate, the bridge down, Link on it
    {"room": "weirwalk", "tide": 0, "out": "b-low-bridged.png",
     "entities": E(("block", 3, 1, {"once": False}), ("switch", 3, 1), ("wheel", 13, 1, {"needTurns": 40}),
                   ("chest", 12, 9, {"pickup": "rupee50"})),
     "tiles": planks, "link": {"tx": 7, "ty": 5, "dir": "right"}},
    # step 6: MID, at the top of the drained-down column, the cone on the wheel
    {"room": "weirwalk", "tide": 1, "out": "b-mid-cone.png",
     "entities": E(("block", 3, 1, {"once": False}), ("switch", 3, 1), ("wheel", 13, 1, {"needTurns": 40}),
                   ("chest", 12, 9, {"pickup": "rupee50"})),
     "tiles": planks, "link": {"tx": 10, "ty": 1, "dir": "right", "bellows": True},
     "overrides": [{"tx": 10, "ty": 1, "r": 3, "delta": -1, "shape": "cone", "dx": 1, "dy": 0}]},
]
json.dump({"legend": "dungeonCistern", "rooms": {"weirwalk": UP}, "shots": shots},
          open('option-b-shoot.json', 'w'), indent=1)
print('ok')
