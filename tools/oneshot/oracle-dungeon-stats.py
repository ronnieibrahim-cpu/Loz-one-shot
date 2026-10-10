# Oracle dungeon stats (S179): rooms per floor, terrain types per room, chest
# contents and puzzle objects for every Seasons and Ages dungeon, read from an
# oracles-disasm clone. Usage: git clone --depth 1 https://github.com/Stewmath/
# oracles-disasm <dir>; python3 tools/oneshot/oracle-dungeon-stats.py <dir>
# Asserts nothing; docs/DUNGEON-STATUS.md 'S179' holds what it printed.
import re, os, json, collections
import sys
D=sys.argv[1].rstrip('/')+'/'
TT={'HOLE':0xf3,}
def tiletypes(game):
    t=open(D+'data/%s/tile_properties/tileTypeMappings.s'%game).read()
    sec=t.split('@dungeons:')[1].split('.db $00')[0]
    m={}
    for a,b in re.findall(r'\.db \$(\w\w) TILETYPE_(\w+)',sec): m[int(a,16)]=b
    return m
def defines(game, prefix):
    m={}
    for f in ('constants/common/%s.s'%prefix,'constants/%s/%s.s'%(game,prefix)):
        if os.path.exists(D+f):
            for n,v in re.findall(r'\.define (\w+)\s+\$(\w+)',open(D+f).read()): m.setdefault(int(v,16),n)
    return m
def layouts(game):
    lay=open(D+'data/%s/dungeonLayouts.s'%game).read()
    allrows=[];starts={}
    for m in re.finditer(r'(dungeon\w+Layout):|\.db ((?:\$\w\w ?)+)',lay):
        if m.group(1): starts[m.group(1)]=len(allrows)
        else: allrows.append([int(x,16) for x in re.findall(r'\$(\w\w)',m.group(2))])
    dd=open(D+'data/%s/dungeonData.s'%game).read()
    out=[]
    for m in re.finditer(r'(dungeonData\w\w):\n\s*m_DungeonData >wGroup(\d)RoomFlags, \$(\w\w), (\w+), \$(\w\w)',dd):
        g=int(m.group(2)); s=starts[m.group(4)]; nf=int(m.group(5),16)
        floors=[]
        for f in range(nf):
            rows=allrows[s+f*8:s+f*8+8]
            floors.append([v for r in rows for v in r if v])
        out.append(dict(name=m.group(1),group=g,floors=floors))
    return out
def objdata(game):
    t=open(D+'objects/%s/mainData.s'%game).read()+open(D+'objects/%s/enemyData.s'%game).read()
    for f in ('extraData1.s','extraData2.s','extraData3.s'):
        t+=open(D+'objects/%s/%s'%(game,f)).read()
    blocks={}
    for m in re.finditer(r'^(\w+):\n((?:[ \t]+[^\n]*\n|\n)*)',t,re.M):
        blocks[m.group(1)]=m.group(2)
    return blocks
def roomobjs(blocks,label,seen=None):
    seen=seen or set(); inter=[]; enem=0
    if label in seen or label not in blocks: return inter,enem
    seen.add(label)
    for l in blocks[label].split('\n'):
        l=l.strip()
        mi=re.match(r'obj_Interaction \$(\w\w)',l)
        if mi: inter.append(int(mi.group(1),16))
        mi=re.match(r'obj_\w*Interaction\w* (?:\$\w\w )?\$(\w\w)',l)
        if 'Enemy' in l.split(' ')[0]: enem+=1
        mp=re.match(r'obj_(?:Pointer|BeforeEvent|AfterEvent) (\w+)',l)
        if mp:
            i,e=roomobjs(blocks,mp.group(1),seen); inter+=i; enem+=e
    return inter,enem
def chests(game):
    t=open(D+'data/%s/chestData.s'%game).read()
    out=collections.defaultdict(list)
    for gm in re.finditer(r'chestGroup(\d)Data:\n((?:\s*m_ChestData[^\n]*\n)*)',t):
        for r,tr in re.findall(r'm_ChestData \$\w\w, \$(\w\w), TREASURE_OBJECT_(\w+)',gm.group(2)):
            out[(int(gm.group(1)),int(r,16))].append(tr)
    return out
def analyse(game, filegroup):
    tt=tiletypes(game); inames=defines(game,'interactions'); blocks=objdata(game); ch=chests(game)
    res=[]
    for d in layouts(game):
        g=d['group']; rooms=[r for f in d['floors'] for r in f]
        terr=collections.Counter(); inter=collections.Counter(); enemies=0; chestl=[]
        for r in rooms:
            fn=D+'rooms/%s/large/room%02x%02x.bin'%(game,filegroup[g],r)
            if os.path.exists(fn):
                b=open(fn,'rb').read()
                for k in set(tt.get(x) for x in b if x in tt): terr[k]+=1
            i,e=roomobjs(blocks,'group%dMap%02xObjectData'%(g,r)); enemies+=e
            for x in set(i): inter[inames.get(x,'%02x'%x)]+=1
            chestl+=ch.get((g,r),[])
        res.append(dict(name=d['name'],floors=[len(f) for f in d['floors']],rooms=len(rooms),terrain=dict(terr),inter=dict(inter),enemies=enemies,chests=collections.Counter(re.sub(r'_\w\w$','',c) for c in chestl)))
    return res
out={'seasons':analyse('seasons',{4:5,5:6}),'ages':analyse('ages',{4:4,5:5})}

for g in out:
    for d in out[g]:
        print(g,d['name'],d['floors'],d['rooms'],'enemies',d['enemies'])
        print('   terrain',d['terrain'])
        print('   chests',dict(d['chests']))
        print('   inter',{k:v for k,v in d['inter'].items()})
