# Render Oracle dungeon floors from an oracles-disasm clone, for study.
import sys, os, re, importlib.util
from PIL import Image, ImageDraw
SP=os.environ['ORACLE_STUDY']  # a dir holding oracles-disasm/, flat-ages/, flat-seasons/, study/
D=SP+'/oracles-disasm/'
spec=importlib.util.spec_from_file_location('ro',os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','rip-objects.py'))
ro=importlib.util.module_from_spec(spec); spec.loader.exec_module(ro)
game=sys.argv[1]
ro.AGES=SP+'/flat-ages'; ro.SRC=SP+'/flat-seasons'
def tileset_rec(idx):
    return ro.tileset(idx, ro.AGES if game=='ages' else ro.SRC)
_cache={}
def TS(idx):
    if idx not in _cache:
        _cache[idx]=ro.Tileset(('ages',idx) if game=='ages' else idx)
    return _cache[idx]
_mt={}
def metatile(idx,m):
    k=(idx,m)
    if k not in _mt:
        ts=TS(idx)
        try:
            g,p=ts.metatile(m)
        except Exception as e:
            # mixed palettes: draw per quadrant
            g=[[0]*16 for _ in range(16)]; p=None
            tiles,attrs=ts.map[m*8:m*8+4],ts.map[m*8+4:m*8+8]
            im=Image.new('RGB',(16,16))
            for q in range(4):
                a=attrs[q]; tile=ts.vram[(a>>3)&1].get(ro.addr(tiles[q]))
                pal=ts.pals[a&7] or [(255,0,255)]*4
                for y in range(8):
                    for x in range(8):
                        sx=7-x if a&0x20 else x; sy=7-y if a&0x40 else y
                        c=pal[tile[sy][sx]] if tile else (255,0,255)
                        im.putpixel(((q%2)*8+x,(q//2)*8+y),c)
            _mt[k]=im; return im
        im=Image.new('RGB',(16,16))
        for y in range(16):
            for x in range(16): im.putpixel((x,y),p[g[y][x]])
        _mt[k]=im
    return _mt[k]
grpts={}
for g in (4,5):
    grpts[g]=open(D+'rooms/%s/group%dTilesets.bin'%(game,g),'rb').read()
def room_img(g,r,layoutgroup=None):
    ts=grpts[g][r]&0x7f
    rec=tileset_rec(ts)
    lg=layoutgroup if layoutgroup is not None else (g+1 if game=='seasons' else g)
    fn=D+'rooms/%s/large/room%02x%02x.bin'%(game,lg,r)
    b=open(fn,'rb').read()
    im=Image.new('RGB',(240,176))
    W=len(b)//11
    for y in range(11):
        for x in range(15):
            im.paste(metatile(ts,b[y*W+x]),(x*16,y*16))
    return im,b,ts
if __name__=='__main__':
    import json
    lay=json.loads(sys.argv[2])  # {"name":..,"group":g,"floors":[[rows]]}
    out=sys.argv[3]
    for fi,fl in enumerate(lay['floors']):
        rows=fl
        ys=[y for y in range(8) if any(rows[y])]; xs=[x for x in range(8) if any(rows[y][x] for y in range(8))]
        x0,x1,y0,y1=min(xs),max(xs),min(ys),max(ys)
        S=Image.new('RGB',((x1-x0+1)*244,(y1-y0+1)*180),(20,20,20))
        dr=ImageDraw.Draw(S)
        for y in range(y0,y1+1):
            for x in range(x0,x1+1):
                r=rows[y][x]
                if not r: continue
                try:
                    im,_,_=room_img(lay['group'],r)
                except Exception as e:
                    print('fail',r,e); continue
                S.paste(im,((x-x0)*244,(y-y0)*180))
                dr.rectangle([(x-x0)*244+2,(y-y0)*180+2,(x-x0)*244+30,(y-y0)*180+14],fill=(0,0,0))
                dr.text(((x-x0)*244+4,(y-y0)*180+3),'%02x'%r,fill=(255,255,0))
        S.save(out%fi)
        print(out%fi)
