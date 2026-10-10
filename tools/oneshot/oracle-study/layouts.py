import re,sys,json
D=sys.argv[1]; game=sys.argv[2]
lay=open(D+'data/%s/dungeonLayouts.s'%game).read()
allrows=[];starts={}
for m in re.finditer(r'(dungeon\w+Layout):|\.db ((?:\$\w\w ?)+)',lay):
    if m.group(1): starts[m.group(1)]=len(allrows)
    else: allrows.append([int(x,16) for x in re.findall(r'\$(\w\w)',m.group(2))])
dd=open(D+'data/%s/dungeonData.s'%game).read()
out={}
for m in re.finditer(r'dungeonData(\w\w):\n\s*m_DungeonData >wGroup(\d)RoomFlags, \$(\w\w), (\w+), \$(\w\w)',dd):
    g=int(m.group(2)); s=starts[m.group(4)]; nf=int(m.group(5),16)
    out[m.group(1)]=dict(group=g,floors=[allrows[s+f*8:s+f*8+8] for f in range(nf)])
print(json.dumps(out))
