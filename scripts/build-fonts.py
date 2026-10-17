# يبني خط المنصة من Aref Ruqaa Ink (رخصة OFL):
# - نسخة أحادية اللون (تُحذف جداول الألوان COLR/CPAL/SVG): تعمل في كل المتصفحات بما فيها Safari على الآيفون،
#   والألوان تُعطى من المنصة (حروف بلون، وتشكيل بلون آخر عبر طبقتين).
# - رفع التشكيل العلوي فوق قمم الحروف حتى لا يتداخل معها.
# التشغيل: python3 scripts/build-fonts.py  (يتطلب: pip install fonttools brotli)
import os, statistics
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = ROOT + '/node_modules/@fontsource/aref-ruqaa-ink/files/'
OUT = ROOT + '/public/fonts/'
TOP = 900   # الحد الأدنى لارتفاع التشكيل العلوي
DOWN = 30   # إنزال طفيف للتشكيل السفلي


def build(weight):
    f = TTFont(SRC + f'aref-ruqaa-ink-arabic-{weight}-normal.woff')
    st = f['GPOS'].table.LookupList.Lookup[2].SubTable[0]
    avg = {c: statistics.mean([r.BaseAnchor[c].YCoordinate for r in st.BaseArray.BaseRecord if r.BaseAnchor[c]] or [0])
           for c in range(st.ClassCount)}
    seen = set()
    for r in st.BaseArray.BaseRecord:
        for c, a in enumerate(r.BaseAnchor):
            if a is None or id(a) in seen:
                continue
            seen.add(id(a))
            if avg[c] > 200:
                a.YCoordinate = max(a.YCoordinate, TOP)
            else:
                a.YCoordinate -= DOWN
    for table in ('COLR', 'CPAL', 'SVG '):
        if table in f:
            del f[table]
    f.flavor = 'woff2'
    f.save(OUT + f'kalimati-ruqaa-{weight}.woff2')


for name in os.listdir(OUT):
    if name.endswith('.woff2'):
        os.remove(OUT + name)
for w in ('400', '700'):
    build(w)
print('ok')
