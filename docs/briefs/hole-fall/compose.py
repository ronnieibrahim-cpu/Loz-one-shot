from PIL import Image, ImageDraw, ImageFont
import numpy as np, re, sys, os
S=sys.argv[1]
def load(name,i): return Image.open(f'{S}/holes/{name}-{i:03d}.png').convert('RGB')
def count(name):
    return len([f for f in os.listdir(f'{S}/holes') if f.startswith(name+'-')])
def first_ball(name):
    for i in range(count(name)):
        a=np.array(load(name,i)).astype(int)
        if ((a[...,0]==190)&(a[...,1]==95)&(a[...,2]==19)).sum()>3: return i
src=open('src/data/sprites-effects.js').read()
def art_img(n):
    m=re.search(n+r": \{ pal: '[^']+', art: `\n(.*?)` \}",src,re.S)
    rows=[r.strip() for r in m.group(1).split('\n')]
    cols=[c.strip().strip("'") for c in re.search(n+r": \[([^\]]+)\]",src).group(1).split(',')]
    im=Image.new('RGBA',(32,32),(0,0,0,0))
    for y,r in enumerate(rows):
        for x,c in enumerate(r):
            if c!='.': h=cols[int(c)]; im.putpixel((x,y),LCD[h]+(255,))
    return im
LCD={'#ff7b08':(190,95,19),'#ffd68c':(190,161,114),'#000000':(7,7,13)}  # as the game's screen filter draws them
T=[-30,-12,-1,0,6,12,22,31]
rows=[]
# The cartridge: its ball, its holds (8,12,12 then gone), its SPEED_60 drift to the hole's middle,
# over Seasons' own hole tile (the clean background is our screen's; the hole IS the Dragon tileset's).
base=load('pot',count('pot')-1)
holds=[(0,8,'fx_hole0'),(8,20,'fx_hole1'),(20,32,'fx_hole2')]
cx,cy=56+8,24+8           # middle of the hole's top-left cell, in the crop
sx,sy=145-88,86-40        # where our pot came down (same spot, for a fair side by side)
orig=[]
for t in T:
    im=base.copy()
    n=next((h[2] for h in holds if h[0]<=t<h[1]),None)
    if t>=0 and n:
        d=((cx-sx)**2+(cy-sy)**2)**.5; k=min(1,0.375*t/d) if d else 1
        x=round(sx+(cx-sx)*k); y=round(sy+(cy-sy)*k)
        a=art_img(n); im.paste(a,(x-16,y-16),a)
    orig.append(im)
rows.append(("Seasons, rebuilt from its\nown code: the ball, its\n8/12/12 holds and its\nslide to the middle",orig))
for name,label in [('pot','Ours: a pot thrown\nonto a hole'),('block','Ours: a block pushed\nonto a hole'),('enemy','Ours: an enemy knocked\nonto a hole')]:
    t0=first_ball(name)
    rows.append((label+f'\n(ball from frame {t0})',[load(name,max(0,min(count(name)-1,t0+t))) for t in T]))
SC=3; cw,ch=96,64; lw=170; gap=6
W=lw+len(T)*(cw*SC+gap); H=30+len(rows)*(ch*SC+gap)
sheet=Image.new('RGB',(W,H),(24,24,28)); d=ImageDraw.Draw(sheet); f=ImageFont.load_default()
for k,t in enumerate(T):
    d.text((lw+k*(cw*SC+gap)+4,8),('frame %+d' % t) if t else 'frame 0 (it goes over)',fill=(200,200,200),font=f)
for r,(label,ims) in enumerate(rows):
    y=30+r*(ch*SC+gap)
    d.multiline_text((6,y+10),label,fill=(235,235,235),font=f)
    for k,im in enumerate(ims): sheet.paste(im.resize((cw*SC,ch*SC),Image.NEAREST),(lw+k*(cw*SC+gap),y))
sheet.save(f'{S}/hole-compare.png'); print(sheet.size)
# a real-speed GIF of ours, the three cases one after another
fr=[]
for name in ['pot','block','enemy']:
    for i in range(count(name)): fr.append(load(name,i).resize((cw*4,ch*4),Image.NEAREST))
fr[0].save(f'{S}/hole-ours.gif',save_all=True,append_images=fr[1:],duration=17,loop=0)
