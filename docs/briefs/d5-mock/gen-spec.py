#!/usr/bin/env python3
"""S185: the D5 mock's rooms, written once per sea, for tools/shoot-mock.mjs.

Source grids use the Shrine's legend plus four belt letters that are NOT in
it: e/w/n/s a belt running east/west/north/south. A belt is drawn as `,`
(the Ruins' second floor, a placeholder compose.py paints the cartridge's
belt tile over) at LOW and MID, and as `W` (deep) at HIGH: "a drowned belt
does not turn". compose.py reads the belt cells back out of belts.json.

    python3 docs/briefs/d5-mock/gen-spec.py > docs/briefs/d5-mock/mock-spec.json
"""
import json, sys, os

ROOMS = {
    # 2F 3,4 — the Hollow Crown: belts, alone. A belt runs east into two
    # knot-holes; the way north is across it. Fall in: you land in the
    # Rootbound Hall below, unhurt.
    'hollow_crown': [
        '##########.####',
        '#.............#',
        '#.............#',
        '#..eeeeeeeeeOO#',
        '#..eeeeeeeeeOO#',
        '#.............#',
        '#.U.........U.#',
        '#........./...#',
        '#.............#',
        '#.............#',
        '###############',
    ],
    # 2F 3,3 — the Belt Bough: a seed on a belt, and the stake as a buffer.
    # The belt runs east into a knot-hole at 12,2; the snarl at 10,1 is cut
    # from 10,2, a belt tile — and a swing on a running belt is carried on
    # into the hole. A seed thrown on the belt rides it while it grows and
    # comes up at 11,2: at MID that pillar is a wall the belt pushes Link
    # against, standing still under the snarl. At LOW it is a step he is
    # carried over. Rows 3-4 are sump, so nothing reaches 11,2 but the belt.
    'belt_bough': [
        '##########.####',
        '##########k####',
        '#..eeeeeeeeeO.#',
        '#..0000000000.#',
        '#..0000000000.#',
        '..............#',
        '#.............#',
        '#.U.........U.#',
        '#.............#',
        '#.............#',
        '#######.#######',
    ],
    # 2F 3,5 — the Grove Crown, over the Standing Grove: the first drop,
    # safe. A knot-hole at 7,5, directly over the plate below; a seed thrown
    # into it falls through and grows where it lands.
    'grove_crown': [
        '#######.#######',
        '#.............#',
        '#.............#',
        '#..U.......U..#',
        '#.............#',
        '.......O.......',
        '#.............#',
        '#..U.......U..#',
        '#.............#',
        '#.............#',
        '#######.#######',
    ],
    # 1F 3,5 — the Standing Grove, reworked: a hold plate on a one-tile dais
    # in a ring of sump two tiles wide — the Shrine's own seed-proof tile, so
    # no throw, no perch and no swim reaches it. The north door stays open
    # only while it is held. Seen on the very first visit.
    'standing_grove': [
        '#######D#######',
        '#.............#',
        '#..55.....55..#',
        '#..5.00000.5..#',
        '#....00000....#',
        '.....00.00.....',
        '#....00000....#',
        '#..5.00000.5..#',
        '#..55.....55..#',
        '#.U...........#',
        '#######.#######',
    ],
}


def at_sea(rows, sea):
    out = []
    for r in rows:
        s = ''
        for c in r:
            if c in 'ewns':
                s += 'W' if sea == 2 else ','
            else:
                s += c
        out.append(s)
    return out


def belts(rows):
    return [[x, y, c] for y, r in enumerate(rows) for x, c in enumerate(r) if c in 'ewns']


def main():
    for k, rows in ROOMS.items():
        assert len(rows) == 11 and all(len(r) == 15 for r in rows), k
    rooms, shots = {}, []
    for k, rows in ROOMS.items():
        for sea in (0, 1, 2):
            rooms[f'{k}@{sea}'] = at_sea(rows, sea)
            shots.append({'room': f'{k}@{sea}', 'tide': sea, 'out': f'{k}-{sea}.png',
                          'entities': [['switch', 7, 5, {}]] if k == 'standing_grove' else []})
    # The Standing Grove with a pillar grown on its islet from above.
    shots.append({'room': 'standing_grove@1', 'tide': 1, 'out': 'standing_grove-held-1.png',
                  'entities': [['switch', 7, 5, {}]], 'tiles': [[7, 5, 'coralPillar']]})
    for sea in (0, 1):
        shots.append({'room': f'belt_bough@{sea}', 'tide': sea, 'out': f'belt_bough-stake-{sea}.png',
                      'tiles': [[11, 2, 'coralPillar']], 'link': {'tx': 10, 'ty': 2, 'dir': 'up'} if sea == 1 else None})
    json.dump({'legend': 'dungeonWood', 'rooms': rooms, 'shots': shots}, sys.stdout)
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'belts.json'), 'w') as f:
        json.dump({k: belts(v) for k, v in ROOMS.items()}, f)


main()
