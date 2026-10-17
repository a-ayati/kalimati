# يبني خطوط المنصة من Aref Ruqaa Ink (رخصة OFL) مع رفع التشكيل العلوي فوق قمم الحروف حتى لا يتداخل معها.
# التشغيل: python3 scripts/build-fonts.py  (يتطلب: pip install fonttools brotli)
import statistics
from fontTools.ttLib import TTFont
import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D=ROOT+'/node_modules/@fontsource/aref-ruqaa-ink/files/'
OUT=ROOT+'/public/fonts/'
TOP=900   # الحد الأدنى لارتفاع التشكيل العلوي (فوق قمم الحروف الطويلة)
DOWN=30   # إنزال طفيف للتشكيل السفلي

def fix(f):
    st=f['GPOS'].table.LookupList.Lookup[2].SubTable[0]
    avg={c: statistics.mean([r.BaseAnchor[c].YCoordinate for r in st.BaseArray.BaseRecord if r.BaseAnchor[c]] or [0]) for c in range(st.ClassCount)}
    seen=set()
    for r in st.BaseArray.BaseRecord:
        for c,a in enumerate(r.BaseAnchor):
            if a is None or id(a) in seen: continue
            seen.add(id(a))
            if avg[c] > 200: a.YCoordinate = max(a.YCoordinate, TOP)
            else: a.YCoordinate -= DOWN
    if 'SVG ' in f: del f['SVG ']
    f.flavor='woff2'
    return f

def palette(f, letters, marks):
    def col(h):
        from fontTools.ttLib.tables.C_P_A_L_ import Color
        h=h.lstrip('#'); return Color(red=int(h[0:2],16), green=int(h[2:4],16), blue=int(h[4:6],16), alpha=255)
    p=f['CPAL'].palettes[0]
    p[0]=col(letters); p[1]=col(letters); p[2]=col(marks); p[3]=col(marks); p[4]=col(marks)
    return f

for w in ('400','700'):
    fix(TTFont(D+f'aref-ruqaa-ink-arabic-{w}-normal.woff')).save(OUT+f'kalimati-ink2-{w}.woff2')
# نسختان للفصحى في بطاقة المشاركة (اللوحة لا تدعم تبديل الألوان): حروف فاتحة أو داكنة، وتشكيل أحمر
palette(fix(TTFont(D+'aref-ruqaa-ink-arabic-700-normal.woff')), '#f3ead8', '#e5483b').save(OUT+'kalimati-fusha-light2-700.woff2')
palette(fix(TTFont(D+'aref-ruqaa-ink-arabic-700-normal.woff')), '#17120e', '#c62828').save(OUT+'kalimati-fusha-dark2-700.woff2')
print('ok')
