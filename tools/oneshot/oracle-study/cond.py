import re,sys
cur=None;ints=[];en=[]
def flush():
    if cur: print(cur,'|','; '.join(ints),'| E:',','.join(en))
for l in open(sys.argv[1]):
    l=l.rstrip()
    if l.startswith('-- room') or l.startswith('===') or l.startswith('   ') and not l.startswith('    '):
        if l.startswith('-- room') or l.startswith('==='):
            flush(); cur=l if l.startswith('--') else None; ints=[];en=[]
        print(l) if not l.startswith('--') else None
    elif 'Interaction' in l or 'CHEST' in l or 'Part' in l:
        ints.append(re.sub(r'\s+',' ',l.strip()))
    elif 'Enemy' in l:
        w=[x for x in l.split()[1:] if re.match(r'^[A-Z][A-Z_0-9]+$',x)]
        en+=w[:1]
flush()
