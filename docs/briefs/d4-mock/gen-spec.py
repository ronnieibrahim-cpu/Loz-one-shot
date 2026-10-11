# Writes docs/briefs/d4-mock/mock-spec.json: the S183 Cistern mock rooms.
# 's' is the spike pool (spikes at LOW and MID, deep at HIGH); it is drawn
# per sea here because the tile does not exist yet: '^' dry, '3' deep.
import json
R = {}
R['spike_basin'] = [
 '#######.#######',
 '#.............#',
 '#..sssssssss..#',
 '#..sssssssss..#',
 '#..sss...sss..#',
 '...sss...sss..#',
 '#..sss...sss..#',
 '#..sssssssss..#',
 '#..sssssssss..#',
 '#.............#',
 '###############']
R['weir'] = [
 '#######L#######',
 '#######.#######',
 '#OOOOOOOOOOOOO#',
 '#OOOOOOOOOOOOO#',
 '#.............#',
 '...............',
 '#.............#',
 '#.............#',
 '#.U...........#',
 '#.......77777.#',
 '#######.#######']
R['long_race'] = [
 '###############',
 '#######.#######',
 '#######.#######',
 '#..OOOOOOOOO..#',
 '#..OOOOOOOOO..#',
 'L..OOOOOOOOO..D',
 '#..OOOOOOOOO..#',
 '#..OOO777OOO..#',
 '#..OOOOOOOOO..#',
 '#.U.OOOOOOO.U.#',
 '###############']
R['intake'] = [
 '#######L#######',
 '#.............#',
 '..U.........U.#',
 '#.............#',
 '#sssssssssssss#',
 '#sssssssssssss#',
 '#sssssssssssss#',
 '#.............#',
 '#.U....../.U..#',
 '#.............#',
 '###############']
R['east_tank'] = [
 '###############',
 '#.............#',
 '#.U.........U.#',
 '#....#####....#',
 '#....#333#....#',
 '#....#333#....#',
 '#....##9##....#',
 '#.....9.9.....#',
 '#......9......#',
 '#.............#',
 '#######L#######']
R['float_tank'] = [
 '###############',
 '#.............#',
 '..............#',
 '#OOOOOOOOOOOOO#',
 '#OOO77OOOO#####',
 '#OOO77OOO.9...#',
 '#OOO77OOOO#...#',
 '#OOOOOOOOO#####',
 '#.............#',
 '#.U.........U.#',
 '#######.#######']
W = ['###############',
     '#3OO.##########',
     '####.##.......#',
     '####0##.......#',
     '#...0.........#',
     '#.............#',
     '#.............#',
     '#..U.......U..#',
     '#.............#',
     '#.............#',
     '#######.#######']
C = ['###############',
     '#####1#########',
     '#####9#########',
     '#####.####....#',
     '#....sss......#',
     '#....sss......#',
     '#.............#',
     '#..U.......U..#',
     '#.............#',
     '#.............#',
     '###############']
E = ['###############',
     '##########OO3.#',
     '#.........OO#.#',
     '#.........OO#.#',
     '#.........OO..#',
     '#.........OOOO#',
     '#.........OOOO#',
     '#..U.......OOO#',
     '#.............#',
     '#.............#',
     '###############']
R['wind_loft'] = [w + c + e for w, c, e in zip(W, C, E)]
# fix the internal walls between the three screens: one open column each
R['wind_loft'] = [row[:14] + ('.' if 3 < i < 9 else '#') + ('.' if 3 < i < 9 else '#') + row[16:29] + ('.' if 3 < i < 9 else '#') + ('.' if 3 < i < 9 else '#') + row[31:]
                  for i, row in enumerate(R['wind_loft'])]

def at(room, tide):
    return [r.replace('s', '3' if tide == 2 else '^') for r in R[room]]

rooms, shots = {}, []
def shot(room, tide, out, **kw):
    name = room + '@' + str(tide)
    rooms[name] = at(room, tide)
    shots.append({'room': name, 'tide': tide, 'out': out, **kw})

shot('spike_basin', 0, 'spike-low.png', entities=[['chest', 7, 5, {'pickup': 'key'}], ['stalfos', 2, 2], ['keese', 12, 9]])
shot('spike_basin', 1, 'spike-mid.png', entities=[['chest', 7, 5, {'pickup': 'key'}], ['stalfos', 2, 2], ['keese', 12, 9]])
shot('spike_basin', 2, 'spike-high.png', entities=[['chest', 7, 5, {'pickup': 'key'}], ['stalfos', 2, 2], ['jellyfish', 5, 3], ['keese', 12, 9]])
shot('weir', 1, 'weir-mid.png', entities=[['keese', 3, 6]])
shot('long_race', 1, 'race-mid.png', entities=[['chest', 7, 1, {'pickup': 'key'}], ['keese', 12, 8]])
shot('long_race', 1, 'race-mid-cone.png', entities=[['chest', 7, 1, {'pickup': 'key'}], ['keese', 12, 8]],
     overrides=[{'tx': 7, 'ty': 4, 'r': 3, 'delta': -1, 'shape': 'cone', 'dx': 0, 'dy': 1}],
     link={'tx': 7, 'ty': 4, 'dir': 'down', 'bellows': True})
shot('intake', 0, 'intake-low.png', entities=[['keese', 4, 8]])
shot('intake', 2, 'intake-high.png', entities=[['keese', 4, 8], ['jellyfish', 9, 5]])
shot('intake', 1, 'intake-mid.png', entities=[['keese', 4, 8]], link={'tx': 8, 'ty': 7, 'dir': 'up'})
shot('east_tank', 2, 'tank-high-cone.png', entities=[['wheel', 7, 4, {'needTurns': 40}]],
     overrides=[{'tx': 7, 'ty': 7, 'r': 3, 'delta': -1, 'shape': 'cone', 'dx': 0, 'dy': -1}],
     link={'tx': 7, 'ty': 7, 'dir': 'up', 'bellows': True})
shot('east_tank', 2, 'tank-high-gate-cone.png', entities=[['wheel', 7, 4, {'needTurns': 40}]],
     overrides=[{'tx': 7, 'ty': 4, 'r': 1, 'delta': -1, 'shape': 'square'},
                {'tx': 7, 'ty': 7, 'r': 3, 'delta': -2, 'shape': 'cone', 'dx': 0, 'dy': -1}],
     link={'tx': 7, 'ty': 7, 'dir': 'up', 'bellows': True})
shot('float_tank', 2, 'float-high-cone.png', entities=[['chest', 12, 5, {'pickup': 'key'}]],
     overrides=[{'tx': 8, 'ty': 5, 'r': 3, 'delta': -1, 'shape': 'cone', 'dx': -1, 'dy': 0}],
     link={'tx': 8, 'ty': 5, 'dir': 'left', 'bellows': True})
shot('float_tank', 2, 'float-high-gate-cone.png', entities=[['chest', 12, 5, {'pickup': 'key'}]],
     overrides=[{'tx': 4, 'ty': 5, 'r': 1, 'delta': -1, 'shape': 'square'},
                {'tx': 8, 'ty': 5, 'r': 3, 'delta': -2, 'shape': 'cone', 'dx': -1, 'dy': 0}],
     link={'tx': 8, 'ty': 5, 'dir': 'left', 'bellows': True})
shot('wind_loft', 1, 'loft-mid.png', entities=[['wheel', 1, 1, {'needTurns': 30}], ['wheel', 20, 1, {'needTurns': 40}], ['wheel', 42, 1, {'needTurns': 40}], ['keese', 9, 6], ['keese', 33, 8]])
for sh in list(shots):
    if 'link' in sh:
        twin = dict(sh); del twin['link']; twin['out'] = sh['out'].replace('.png', '-nolink.png'); shots.append(twin)
spec = {'legend': 'dungeonCistern', 'rooms': rooms, 'shots': shots}
json.dump(spec, open('/home/user/Loz-one-shot/docs/briefs/d4-mock/mock-spec.json', 'w'))
print(len(shots), 'shots')
