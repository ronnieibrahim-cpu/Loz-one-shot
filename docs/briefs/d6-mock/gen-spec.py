#!/usr/bin/env python3
"""S188: the D6 mock's rooms upstairs (1F and 2F), for tools/shoot-mock.mjs.
The Keep's shafts are drawn with `4` (dDrain: an open pit at LOW, water
above) on 1F; a 2F shaft is flooded only at HIGH, so it is `O` (pit) at LOW
and MID and `4` at HIGH. The Hold (B1) is not in the engine yet: hold.py
draws it from Seasons' own ice tiles.

    python3 gen-spec.py > mock-spec.json
    node tools/shoot-mock.mjs docs/briefs/d6-mock/mock-spec.json <dir>
"""
import json
R = {}
R['slack'] = [  # 1F 5,3, reworked: two wells
    '#######.#######',
    '#######.#######',
    '####........###',
    '####.111111.###',
    '####.111111.###',
    '.....116111...D',
    '####.111111.###',
    '####........###',
    '####.4...4..###',
    '####........###',
    '###############',
]
R['weigh'] = [  # 1F 5,2, NEW: the Weighhouse, the Plumb's middle
    '###############',
    '#.............#',
    '#.U.........U.#',
    '#.............#',
    '#......4......#',
    'D..............',
    '#.............#',
    '#.............#',
    '#.U.........U.#',
    '#.............#',
    '#######.#######',
]
R['garden'] = [  # 1F 4,2, the Drowned Garden with a way east
    '###############',
    '###############',
    '####........###',
    '#######k#######',
    '####.0WWW0..###',
    '####...7.......',
    '####........###',
    '####........###',
    '#######.#######',
    '#######.#######',
    '#######.#######',
]
R['tally'] = [  # 1F 7,2 (1x2), the Tally Hall with a well on each bank
    '###############',
    '#.............#',
    '#..........6..#',
    '#..........1..#',
    '#.............#',
    '..............#',
    '#..........4..#',
    '#.............#',
    '#........q....#',
    '#.............#',
    '#OOOO7OOO7OOOO#',
    '#OOOOOOOOOOOOO#',
    '#OOOO..q..OOOO#',
    '#OOOOq....OOOO#',
    '#OOOOOOOOOOOOO#',
    '#OOOOOOOOOOOOO#',
    '.......3......#',
    '#......q......#',
    '#..........4..#',
    '#.............#',
    '#.............#',
    '###############',
]
def cs(s):  # 2F 4,2 (2x1), the Crossed Shafts: two shafts, flooded at HIGH only
    return [
        '##############################',
        '##############################',
        '######....#O.....OO..........#',
        '######..q.7O.q...OO..........#',
        '######....#O.....OO..........#',
        '..........#O.%...OO.....%....#'.replace('%', s),
        '######....#O...q3OO.q........#',
        '######....#O.....OO..........#',
        '####################.........#',
        '####################.........#',
        '##############################',
    ]
R['cs_dry'] = cs('O')
R['cs_wet'] = cs('4')
SW = ['switch', 0, 0, {'hold': False}]
def sw(x, y): return ['switch', x, y, {'hold': True}]
shots = [
    {'room': 'slack', 'tide': 0, 'entities': [sw(11, 9)], 'out': 'slack_low.png'},
    {'room': 'slack', 'tide': 1, 'entities': [sw(11, 9)], 'link': {'tx': 5, 'ty': 7, 'dir': 'down'}, 'out': 'slack_mid.png'},
    {'room': 'weigh', 'tide': 1, 'entities': [sw(4, 8)], 'link': {'tx': 7, 'ty': 3, 'dir': 'down'}, 'out': 'weigh_mid.png'},
    {'room': 'garden', 'tide': 2, 'out': 'garden_high.png'},
    {'room': 'tally', 'tide': 1, 'link': {'tx': 11, 'ty': 19, 'dir': 'up'}, 'out': 'tally_mid.png'},
    {'room': 'tally', 'tide': 0, 'link': {'tx': 11, 'ty': 5, 'dir': 'down'}, 'out': 'tally_low.png'},
    {'room': 'cs_dry', 'tide': 1, 'entities': [sw(15, 3), sw(23, 3)], 'out': 'cs_mid.png'},
    {'room': 'cs_wet', 'tide': 2, 'entities': [sw(15, 3), sw(23, 3)], 'link': {'tx': 24, 'ty': 4, 'dir': 'down'}, 'out': 'cs_high.png'},
]
print(json.dumps({'legend': 'dungeonAbyss', 'rooms': R, 'shots': shots}, indent=1))
