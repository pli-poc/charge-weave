from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

OUT = Path('content/blog/assets/the-platform-as-a-harness')
W, H = 1080, 1350
BG = '#F6F3EC'
INK = '#142D39'
MUTED = '#536C73'
TEAL = '#177D78'
MINT = '#D9ECE5'
PANEL = '#FFFFFF'
LINE = '#D8E2DC'
GOLD = '#D49A45'
CORAL = '#C46C56'
NAVY = '#203E4A'
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

def f(size, bold=False): return ImageFont.truetype(BOLD if bold else FONT, size)
def rounded(d, box, r, fill, outline=None, width=1): d.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)
def wrap(d, text, font, maxw):
    words=text.split(); lines=[]; line=''
    for word in words:
        test=(line+' '+word).strip()
        if d.textbbox((0,0),test,font=font)[2] <= maxw: line=test
        else:
            if line: lines.append(line)
            line=word
    if line: lines.append(line)
    return lines
def paragraph(d, text, xy, font, fill, maxw, leading=1.28):
    x,y=xy; lines=wrap(d,text,font,maxw); step=int(font.size*leading)
    for line in lines: d.text((x,y),line,font=font,fill=fill); y+=step
    return y
def base(kicker,title,num):
    im=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(im)
    d.text((72,52),kicker.upper(),font=f(22,True),fill=TEAL)
    y=paragraph(d,title,(72,95),f(51,True),INK,920,1.12)
    d.line((72, y+23, W-72, y+23),fill=LINE,width=3)
    d.text((72,H-60),'A PLATFORM DESIGN PRINCIPLE',font=f(17,True),fill=MUTED)
    d.text((W-115,H-65),num,font=f(20,True),fill=TEAL)
    return im,d,y+45

def arrow(d, a, b, fill=TEAL, width=5):
    d.line((a,b),fill=fill,width=width)
    import math
    ang=math.atan2(b[1]-a[1],b[0]-a[0]); L=18
    p1=(b[0]-L*math.cos(ang-.55), b[1]-L*math.sin(ang-.55))
    p2=(b[0]-L*math.cos(ang+.55), b[1]-L*math.sin(ang+.55))
    d.polygon([b,p1,p2],fill=fill)

def pill(d, x,y,text, fill=MINT, color=INK, size=18):
    font=f(size,True); b=d.textbbox((0,0),text,font=font); w=b[2]+30; h=b[3]+18
    rounded(d,(x,y,x+w,y+h),h//2,fill); d.text((x+15,y+8),text,font=font,fill=color)
    return w,h

# 1. Code generation vs governed platform harness
im,d,y=base('THE CENTRAL ARGUMENT','AI changes speed. A shared harness changes what can be maintained.', '01')
# outside panel
rounded(d,(72,y,1008,y+380),28,'#F0E8DF',outline='#E5D8CB',width=2)
d.text((108,y+28),'OUTSIDE THE HARNESS',font=f(24,True),fill=CORAL)
d.text((108,y+71),'Each project starts from its own assumptions',font=f(21),fill=INK)
# project nodes
xs=[135,410,685]
labels=[('AGENT A','local schema','custom tests'),('AGENT B','new mapping','different rules'),('AGENT C','bespoke flow','hidden context')]
for x,(head,a,b) in zip(xs,labels):
    rounded(d,(x,y+133,x+230,y+286),18,PANEL,outline='#E3CFC4',width=2)
    d.ellipse((x+18,y+153,x+48,y+183),fill=CORAL)
    d.text((x+60,y+153),head,font=f(17,True),fill=INK)
    d.text((x+20,y+204),a,font=f(19),fill=MUTED)
    d.text((x+20,y+238),b,font=f(19),fill=MUTED)
for x in (365,640): arrow(d,(x,y+210),(x+32,y+210),CORAL,4)
d.text((108,y+320),'Fast local output; integration and ownership accumulate later.',font=f(18),fill=MUTED)
# inside panel
z=y+414
rounded(d,(72,z,1008,z+385),28,'#E5F1EB',outline='#C5DDD2',width=2)
d.text((108,z+28),'INSIDE A SHARED PLATFORM',font=f(24,True),fill=TEAL)
d.text((108,z+70),'One intent. Shared contracts. A reviewable change.',font=f(21),fill=INK)
# shared spine
nodes=[('MEANING','ontology'),('RULES','policy + flow'),('BOUNDARY','adapters + data')]
for i,(a,b) in enumerate(nodes):
    x=108+i*285
    rounded(d,(x,z+132,x+250,z+230),18,PANEL,outline='#C5DDD2',width=2)
    d.text((x+18,z+149),a,font=f(17,True),fill=TEAL)
    d.text((x+18,z+184),b,font=f(20,True),fill=INK)
    if i<2: arrow(d,(x+253,z+181),(x+278,z+181),TEAL,4)
steps=['DRAFT','VALIDATE','SIMULATE','REVIEW','PUBLISH']
x=108
for label in steps:
    ww,_=pill(d,x,z+270,label,fill=TEAL if label=='PUBLISH' else '#D1E6DC',color='white' if label=='PUBLISH' else INK,size=16); x+=ww+12
d.text((108,z+327),'A change carries its rules, evidence and version forward.',font=f(18),fill=MUTED)
im.save(OUT/'shared-harness.png',optimize=True)

# 2. Platform anatomy stack
im,d,y=base('THE PLATFORM, AS A WHOLE','A model-driven platform is a set of connected responsibilities.', '02')
# vertical stack blocks and left rail
layers=[
 ('PEOPLE & EXPERIENCE','Tasks, forms and decisions', '#E5F1EB'),
 ('WORKFLOW & STATE','Steps, ownership, timers, checkpoints', '#DDEBE8'),
 ('POLICY & IDENTITY','Actors, permissions and guardrails', '#E9EEE4'),
 ('DOMAIN CAPABILITIES','Business actions with clear owners', '#E8E8D9'),
 ('ONTOLOGY & CONTRACTS','Shared meaning, relationships and constraints', '#D9ECE5'),
 ('ADAPTERS & RUNTIME PORTS','Virtual, observe, hybrid or live boundaries', '#E4EAF0'),
 ('STORES & EVIDENCE','Operational, temporal, telemetry and audit records', '#EBE5DB'),
]
y0=y+14; x0=180; bw=820; bh=98; gap=10
# left vertical intent/evidence spine
rounded(d,(72,y0,148,y0+7*(bh+gap)-gap),26,NAVY)
d.text((89,y0+105),'I',font=f(29,True),fill='white')
d.text((89,y0+345),'N',font=f(29,True),fill='white')
d.text((89,y0+585),'E',font=f(29,True),fill='white')
for i,(title,desc,color) in enumerate(layers):
    yy=y0+i*(bh+gap)
    rounded(d,(x0,yy,x0+bw,yy+bh),20,color,outline=LINE,width=2)
    d.ellipse((x0+22,yy+27,x0+64,yy+69),fill=TEAL if i in (1,4) else NAVY)
    d.text((x0+86,yy+20),title,font=f(19,True),fill=TEAL if i==4 else INK)
    d.text((x0+86,yy+56),desc,font=f(17),fill=MUTED)
    if i<6: arrow(d,(x0+bw//2,yy+bh+1),(x0+bw//2,yy+bh+gap-1),TEAL,3)
rounded(d,(72,1160,1008,1252),20,NAVY)
d.text((102,1180),'VALIDATE  ·  SIMULATE  ·  REVIEW  ·  VERSION',font=f(23,True),fill='white')
paragraph(d,'Shared meaning does not erase service ownership; it makes boundaries understandable.',(102,1216),f(16), '#D9E7E5',850,1.2)
im.save(OUT/'platform-layers.png',optimize=True)

# 3. Browser first to live
im,d,y=base('THE PROVING GROUND','Prove the journey in a browser before infrastructure is ready.', '03')
# browser frame
rounded(d,(72,y+12,1008,y+610),28,PANEL,outline=LINE,width=3)
rounded(d,(72,y+12,1008,y+76),28,NAVY)
d.rectangle((72,y+52,1008,y+76),fill=NAVY)
for i,col in enumerate((CORAL,GOLD,TEAL)): d.ellipse((101+i*29,y+34,117+i*29,y+50),fill=col)
d.text((205,y+31),'A COMPLETE VIRTUAL ENVIRONMENT',font=f(19,True),fill='white')
# inner panels
cards=[('VIRTUAL ADAPTERS','protocol-shaped inputs'),('SYNTHETIC DATA','safe, repeatable cases'),('VIRTUAL CLOCK','timers without waiting'),('FAULT INJECTION','delays, gaps, retries')]
for i,(a,b) in enumerate(cards):
    row=i//2; col=i%2; xx=105+col*443; yy=y+111+row*142
    rounded(d,(xx,yy,xx+410,yy+112),18,'#F3F6F1',outline=LINE,width=2)
    d.text((xx+22,yy+20),a,font=f(18,True),fill=TEAL)
    d.text((xx+22,yy+58),b,font=f(18),fill=MUTED)
# simulation/replay band
rounded(d,(105,y+407,975,y+510),18,MINT)
d.text((132,y+426),'RUN THE WHOLE BUSINESS JOURNEY',font=f(21,True),fill=INK)
d.text((132,y+464),'Forms  →  workflow  →  services  →  evidence  →  replay',font=f(19),fill=MUTED)
# deployment transition
arrow(d,(540,y+628),(540,y+686),TEAL,6)
labels=[('VIRTUAL','prove contracts'),('OBSERVE','compare safely'),('HYBRID','switch boundary by boundary'),('LIVE','connect real services')]
startx=72; yy=y+707; widths=[205,205,250,205]; gap=20
for i,(head,sub) in enumerate(labels):
    xx=startx+sum(widths[:i])+gap*i
    rounded(d,(xx,yy,xx+widths[i],yy+142),20,TEAL if i==3 else PANEL,outline=TEAL if i==3 else LINE,width=2)
    c='white' if i==3 else INK; muted='#D8EFEB' if i==3 else MUTED
    d.text((xx+17,yy+25),head,font=f(18,True),fill=c)
    paragraph(d,sub,(xx+17,yy+65),f(16),muted,widths[i]-34,1.22)
paragraph(d,'Virtual proof accelerates feedback. Real security, network and performance checks still belong before production.',(95,yy+169),f(18),MUTED,890,1.28)
im.save(OUT/'browser-proving-ground.png',optimize=True)

# 4. AI extension lifecycle
im,d,y=base('EXTENDING THE PLATFORM','The assistant works through the platform’s supported building blocks.', '04')
# visual vertical cycle with 5 numbered nodes, right text
steps=[
 ('1','STATE THE INTENT','A person describes the business change and its boundaries.'),
 ('2','DRAFT THE MODEL','The assistant proposes ontology, policy, flow, form or adapter changes.'),
 ('3','CHECK & SIMULATE','Constraints, permissions and complete journeys are exercised in-browser.'),
 ('4','REVIEW THE EVIDENCE','An accountable owner sees the differences, outcomes and unresolved questions.'),
 ('5','VERSION & REUSE','An approved package is published through the same platform contracts.'),
]
left=118; top=y+22; step_h=150
# continuous rail
for i,(n,title,desc) in enumerate(steps):
    yy=top+i*step_h
    if i<4: d.line((left+30,yy+65,left+30,yy+step_h+5),fill='#B8D5C9',width=8)
    d.ellipse((left,yy+7,left+62,yy+69),fill=TEAL if i in (0,4) else NAVY)
    bb=d.textbbox((0,0),n,font=f(24,True)); d.text((left+31-(bb[2]-bb[0])//2,yy+20),n,font=f(24,True),fill='white')
    rounded(d,(205,yy,1008,yy+128),22,PANEL,outline=LINE,width=2)
    d.text((235,yy+18),title,font=f(21,True),fill=TEAL)
    paragraph(d,desc,(235,yy+54),f(18),INK,720,1.28)
rounded(d,(72,top+5*step_h+4,1008,top+5*step_h+102),20,'#F0E8DF',outline='#E5D8CB',width=2)
d.text((102,top+5*step_h+20),'HUMAN JUDGMENT STAYS IN THE LOOP',font=f(20,True),fill=CORAL)
paragraph(d,'The platform supplies the guardrails; accountable people decide what becomes operational.',(102,top+5*step_h+54),f(17),INK,850,1.22)
im.save(OUT/'ai-extension-loop.png',optimize=True)

for p in sorted(OUT.glob('*.png')):
    im=Image.open(p)
    print(p, im.size, p.stat().st_size)
