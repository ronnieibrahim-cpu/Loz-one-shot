from PIL import Image, ImageDraw, ImageFont
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22)
F2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12)
F3 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 12)
BG=(24,24,34); TITLE=(255,236,160); HEAD=(170,210,255)
OLD=(70,74,86); RE=(46,120,70); NEW=(150,110,30); BOSS=(130,40,50)
CW, CH = 146, 70
# (x, y, w, h, name, status, note)
F1 = [(3,7,1,1,'Cistern Head','old','entrance'),(3,6,1,1,'Rainwater Landing','old',''),
 (2,6,1,1,'Overflow Sluice','old','Dungeon Map'),(4,6,1,1,'SPIKE BASIN','re','Key 1 - spikes'),
 (3,5,1,1,'THE WEIR','re','first float'),(2,5,1,1,'Drowned Stair','old','Chartstone'),
 (4,5,1,1,'Rung Gallery','old','Heart Piece'),(5,5,1,1,'Cliffside Cell','old','charm'),
 (6,5,2,1,'Gull Roost','old','optional sill'),(4,4,3,1,'The Cistern Floor','old','Key 2 - block + plates'),
 (3,4,1,1,'Barnacle Cell','old',''),(2,4,1,1,'Winch Room','old',''),(1,4,1,1,'Bellows Vault','old','SQUALL BELLOWS'),
 (0,4,1,2,'The Ebb Cell','old','sill'),(1,5,1,1,'Spill Vault','old','Key'),(0,3,1,1,'Spill Gate','old',''),
 (1,3,1,1,'Squall Loft','old','sill 1 (MID)'),(2,3,1,1,'Drowned Sill','old','sill 2 (HIGH)'),
 (3,3,1,1,'Winding Stair','old',''),(4,3,1,1,'THE LONG RACE','re','float + wind: Key'),
 (5,3,2,1,'IRONKNIGHT GALLERY','re','miniboss; STAIR UP'),(2,2,1,1,'Cistern Gauge','old','sill 3: Key'),
 (3,2,1,1,'Cistern Gate','old','boss door'),(4,2,1,1,'CROSSED SLUICES','re','way home; no wheels'),
 (5,2,1,1,'Cliff Walk','old',''),(6,2,1,1,'Wind Gallery','old','optional sill'),
 (0,1,1,2,'Siphon Stair','old','optional'),(2,1,1,1,'West Overlook','old','fairy'),
 (3,1,1,1,'WYVERNA','boss',''),(4,1,1,1,'East Overlook','old','Heart Piece')]
F2L = [(6,3,1,1,'THE INTAKE','new','STAIR DOWN; spikes'),(5,3,1,1,'SPIKE GALLERY','new','fight; spikes'),
 (4,2,1,1,'WEST TANK','new','stair up; blocks: Key'),(5,2,1,1,'FLOAT TANK','new','brake the float'),
 (6,2,1,1,'EAST TANK','new','BOSS KEY')]
F3L = [(4,2,3,1,'THE WIND LOFT','new','three wheels, one over each tank; stair down (west)')]
COL={'old':OLD,'re':RE,'new':NEW,'boss':BOSS}
def floor(d, ox, oy, rooms, x0, y0, x1, y1, title):
    d.text((ox, oy), title, font=F, fill=HEAD)
    oy += 34
    for gx in range(x0, x1+1):
        for gy in range(y0, y1+1):
            d.rectangle((ox+(gx-x0)*CW, oy+(gy-y0)*CH, ox+(gx-x0+1)*CW-1, oy+(gy-y0+1)*CH-1), outline=(40,40,52))
    for (x,y,w,h,n,s,note) in rooms:
        a=(ox+(x-x0)*CW+3, oy+(y-y0)*CH+3, ox+(x-x0+w)*CW-4, oy+(y-y0+h)*CH-4)
        d.rectangle(a, fill=COL[s], outline=(220,220,220) if s!='old' else (110,110,120), width=2)
        d.text((a[0]+5,a[1]+5), n, font=F3, fill=(255,255,255))
        d.text((a[0]+5,a[1]+24), note, font=F2, fill=(235,235,235))
    return oy
W = 16 + 8*CW + 30 + 3*CW + 30 + 3*CW + 16
pic = Image.new('RGB', (W, 34+34+8*CH+120), BG); d = ImageDraw.Draw(pic)
d.text((16,8), 'D4 Cliffside Cistern - the plan (S183 design, not built): 44 screens on 3 floors', font=F, fill=TITLE)
oy = floor(d, 16, 44, F1, 0, 1, 7, 7, '1F the Lower Cistern - the conch works')
ox2 = 16 + 8*CW + 30
floor(d, ox2, 44, F2L, 4, 2, 6, 3, '2F the Sealed Cistern')
d.text((ox2, 44+34+2*CH+8), 'The conch is not heard here: the water\nstays at the sea you climbed with.\nEach tank has a shut gate; the wheel\nabove it on 3F opens it, and the tank\nthen stands one level under the sea.', font=F2, fill=(230,230,230))
ox3 = ox2 + 3*CW + 30
floor(d, ox3, 44, F3L, 4, 2, 6, 2, '3F the Wind Loft')
d.text((ox3, 44+34+CH+8), 'Open to the sky: the conch works.\nWest wheel -> West Tank gate\nMiddle wheel -> Float Tank gate\nEast wheel -> East Tank gate', font=F2, fill=(230,230,230))
ly = 44+34+7*CH+20
for i,(c,t) in enumerate([(OLD,'as now'),(RE,'reworked'),(NEW,'new'),(BOSS,'boss')]):
    d.rectangle((16+i*170, ly, 16+i*170+24, ly+18), fill=c); d.text((16+i*170+32, ly), t, font=F2, fill=(230,230,230))
d.text((16, ly+30), 'Stairs: 1F Ironknight Gallery (east half) <-> 2F Intake;  2F West Tank <-> 3F Wind Loft (west).  Boss Key: 2F East Tank; back down and round by the Crossed Sluices to the Cistern Gate.', font=F2, fill=(230,230,230))
pic.save('/home/user/Loz-one-shot/docs/briefs/d4-mock/d4-plan.png'); print(pic.size)
