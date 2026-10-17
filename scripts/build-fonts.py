# يبني خطوط المقولات بلونين في طبقة واحدة (COLRv0) — تعمل في كل المتصفحات بما فيها Safari على الآيفون:
#   - الحروف بلون النص (لون CSS / fillStyle)، والتشكيل بلون من لوحة الخط يُبدَّل عبر font-palette.
#   - خط الرقعة: يرتفع التشكيل العلوي فوق قمم الحروف حتى لا يتداخل معها.
# يُنتج: public/fonts/kq-*.woff2  و  src/quote-fonts.css
# التشغيل: python3 scripts/build-fonts.py  (يتطلب: pip install fonttools brotli)
import os, statistics
from fontTools.ttLib import TTFont
from fontTools.colorLib.builder import buildCOLR, buildCPAL

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FS = ROOT + '/node_modules/@fontsource/'
OUT = ROOT + '/public/fonts/'
CSS = ROOT + '/src/quote-fonts.css'

# العائلة ← [(الوزن، الملف)]
FAMILIES = {
    'ruqaaink': [('400', 'aref-ruqaa-ink/files/aref-ruqaa-ink-arabic-400-normal.woff'),
                 ('700', 'aref-ruqaa-ink/files/aref-ruqaa-ink-arabic-700-normal.woff')],
    'ruqaa': [('700', 'aref-ruqaa/files/aref-ruqaa-arabic-700-normal.woff2')],
    'rakkas': [('400', 'rakkas/files/rakkas-arabic-400-normal.woff2')],
    'amiri': [('700', 'amiri/files/amiri-arabic-700-normal.woff2')],
    'kufi': [('600', 'reem-kufi/files/reem-kufi-arabic-600-normal.woff2'),
             ('700', 'reem-kufi/files/reem-kufi-arabic-700-normal.woff2')],
    'naskh': [('600', 'noto-naskh-arabic/files/noto-naskh-arabic-arabic-600-normal.woff2')],
    'cairo': [('700', 'cairo/files/cairo-arabic-700-normal.woff2')],
}

# ألوان التشكيل (تطابق quoteColors في QuoteText.tsx)
MARK_COLORS = {
    'red-dark': '#e5483b', 'red-light': '#c62828',
    'yellow-dark': '#f59e0b', 'yellow-light': '#d97706',
    'gold-dark': '#c9a227', 'gold-light': '#a87f12',
    'plain-dark': '#f3ead8', 'plain-light': '#1a1410',
    'dial-dark': '#d4a72c', 'dial-light': '#a87f12',
}
DEFAULT_MARK = '#e5483b'
CARD_GOLD = '#d4a72c'  # نسخة للوحة بطاقة المشاركة (اللوحة لا تدعم font-palette)


def rgba(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)) + (1.0,)


def raise_marks(f, top=900, down=30):
    """خط الرقعة: رفع التشكيل العلوي إلى خط موحّد فوق قمم الحروف."""
    st = f['GPOS'].table.LookupList.Lookup[2].SubTable[0]
    avg = {c: statistics.mean([r.BaseAnchor[c].YCoordinate for r in st.BaseArray.BaseRecord if r.BaseAnchor[c]] or [0])
           for c in range(st.ClassCount)}
    seen = set()
    for r in st.BaseArray.BaseRecord:
        for c, a in enumerate(r.BaseAnchor):
            if a is None or id(a) in seen:
                continue
            seen.add(id(a))
            a.YCoordinate = max(a.YCoordinate, top) if avg[c] > 200 else a.YCoordinate - down


def colorize(f, mark_color):
    for t in ('COLR', 'CPAL', 'SVG ', 'sbix', 'CBDT', 'CBLC'):
        if t in f:
            del f[t]
    marks = set()
    gdef = f['GDEF'].table if 'GDEF' in f else None
    if gdef and gdef.GlyphClassDef:
        marks = {g for g, c in gdef.GlyphClassDef.classDefs.items() if c == 3}
    glyf = f['glyf'] if 'glyf' in f else None
    layers = {}
    for g in f.getGlyphOrder():
        if glyf is not None:
            gl = glyf[g]
            if gl.numberOfContours == 0:
                continue
        # 0xFFFF = لون النص؛ 0 = لون التشكيل من لوحة الخط
        layers[g] = [(g, 0 if g in marks else 0xFFFF)]
    f['COLR'] = buildCOLR(layers, version=0)
    f['CPAL'] = buildCPAL([[rgba(mark_color)]])
    return len(marks)


for name in os.listdir(OUT):
    if name.endswith('.woff2'):
        os.remove(OUT + name)

css = ['/* مولَّد آلياً بواسطة scripts/build-fonts.py — لا تعدّله يدوياً */']
for fam, faces in FAMILIES.items():
    for weight, path in faces:
        for suffix, color in (('', DEFAULT_MARK), ('-gold', CARD_GOLD)):
            f = TTFont(FS + path)
            if fam == 'ruqaaink':
                raise_marks(f)
            n = colorize(f, color)
            f.flavor = 'woff2'
            f.save(OUT + f'kq-{fam}-{weight}{suffix}.woff2')
        print(fam, weight, 'marks:', n)
        css.append(f"@font-face {{ font-family: 'KQ-{fam}'; src: url('/fonts/kq-{fam}-{weight}.woff2') format('woff2'); "
                   f"font-weight: {weight}; font-display: swap; }}")
    for key, color in MARK_COLORS.items():
        css.append(f"@font-palette-values --kq-{fam}-{key} {{ font-family: 'KQ-{fam}'; override-colors: 0 {color}; }}")
open(CSS, 'w').write('\n'.join(css) + '\n')
print('ok')
