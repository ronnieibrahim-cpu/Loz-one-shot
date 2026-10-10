import re,sys,json,os,collections
SP=os.environ['ORACLE_STUDY']  # a dir holding oracles-disasm/, flat-ages/, flat-seasons/, study/
D=SP+'/oracles-disasm/'
game=sys.argv[1]; dn=sys.argv[2]
L=json.load(open(SP+'/study/%s-layouts.json'%game))[dn]
def defines(prefix):
    m={}
    for f in ('constants/common/%s.s'%prefix,'constants/%s/%s.s'%(game,prefix)):
        if os.path.exists(D+f):
            for n,v in re.findall(r'\.define (\w+)\s+\$(\w+)',open(D+f).read()): m.setdefault(int(v,16),n)
    return m
IN=defines('interactions'); EN=defines('enemies'); PA=defines('parts'); TR=defines('treasure') or {}
t=''
for f in ('mainData.s','enemyData.s','extraData1.s','extraData2.s','extraData3.s'):
    p=D+'objects/%s/%s'%(game,f)
    if os.path.exists(p): t+=open(p).read()+'\n'
blocks={}
for m in re.finditer(r'^(\w+):\n((?:[ \t]+[^\n]*\n|\n)*)',t,re.M): blocks[m.group(1)]=m.group(2)
def objs(label,seen=None,pre=''):
    seen=seen or set(); out=[]
    if label in seen or label not in blocks: return out
    seen.add(label)
    for l in blocks[label].split('\n'):
        l=l.split(';')[0].strip()
        if not l or l=='obj_End': continue
        mp=re.match(r'obj_(Pointer|BeforeEvent|AfterEvent) (\w+)',l)
        if mp:
            out+=objs(mp.group(2),seen,pre+(mp.group(1)[0] if mp.group(1)!='Pointer' else '')); continue
        toks=l.split()
        k=toks[0]; a=[x for x in toks[1:]]
        def nm(tab,x):
            try: return tab.get(int(x.strip('$'),16),x)
            except: return x
        if k=='obj_Interaction': a[0]=nm(IN,a[0]).replace('INTERAC_','')
        elif 'Enemy' in k:
            i=1 if (k=='obj_RandomEnemy' or (k=='obj_SpecificEnemyA' and len(a)==5)) else 0
            a[i]=nm(EN,a[i]).replace('ENEMY_','')
        elif k=='obj_Part': a[0]=nm(PA,a[0]).replace('PART_','')
        out.append(pre+k.replace('obj_','')+' '+' '.join(a))
    return out
ch=open(D+'data/%s/chestData.s'%game).read()
chests=collections.defaultdict(list)
for gm in re.finditer(r'chestGroup(\d)Data:\n((?:\s*m_ChestData[^\n]*\n)*)',ch):
    for yx,r,tr in re.findall(r'm_ChestData \$(\w\w), \$(\w\w), TREASURE_OBJECT_(\w+)',gm.group(2)):
        chests[(int(gm.group(1)),int(r,16))].append(tr+'@'+yx)
TT={}
tm=open(D+'data/%s/tile_properties/tileTypeMappings.s'%game).read().split('@dungeons:')[1].split('.db $00')[0]
for a,b in re.findall(r'\.db \$(\w\w) TILETYPE_(\w+)',tm): TT[int(a,16)]=b
g=L['group']; fg=g+1 if game=='seasons' else g
for fi,fl in enumerate(L['floors']):
    print('=== floor',fi)
    for y,row in enumerate(fl):
        print('   '+' '.join('%02x'%v if v else '..' for v in row))
    for y,row in enumerate(fl):
        for x,r in enumerate(row):
            if not r: continue
            fn=D+'rooms/%s/large/room%02x%02x.bin'%(game,fg,r)
            b=open(fn,'rb').read() if os.path.exists(fn) else b''
            terr=collections.Counter(TT[v] for v in b if v in TT)
            print('-- room %02x (f%d %d,%d) terrain:%s'%(r,fi,x,y,dict(terr)))
            for c in chests.get((g,r),[]): print('     CHEST',c)
            for o in objs('group%dMap%02xObjectData'%(g,r)): print('     ',o)
