# يبني خطوط المقولات على شكل نسختين متطابقتين القياسات من كل خط:
#   KQL-*  الحروف وحدها (التشكيل فارغ)   ←  تُلوَّن بلون الحروف
#   KQM-*  التشكيل وحده (الحروف فارغة)   ←  تُلوَّن بلون التشكيل
# الطبقتان تحملان نفس النص ونفس العروض ونفس قواعد التشكيل والاتصال، فتُصفّان حرفاً بحرف
# في كل المتصفحات (Safari وChrome وشاشة توقف الـ Mac) ولا يمكن أن تنزاحا.
# خط الرقعة: يرتفع التشكيل العلوي فوق قمم الحروف حتى لا يتداخل معها.
# يُنتج: public/fonts/kq-*.woff2  و  src/quote-fonts.css
# التشغيل: python3 scripts/build-fonts.py  (يتطلب: pip install fonttools brotli)
import os, statistics
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._g_l_y_f import Glyph

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FS = ROOT + '/node_modules/@fontsource/'
OUT = ROOT + '/public/fonts/'
CSS = ROOT + '/src/quote-fonts.css'

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


def raise_marks(f, harakat, top=900, down=30):
    """خط الرقعة: رفع الحركات العلوية فوق قمم الحروف وإنزال السفلية قليلاً.
    فقط مجموعات الحركات — نقاط الحروف لها مجموعاتها الخاصة وتبقى في مكانها الأصلي."""
    st = f['GPOS'].table.LookupList.Lookup[2].SubTable[0]
    members = {}
    for g, rec in zip(st.MarkCoverage.glyphs, st.MarkArray.MarkRecord):
        members.setdefault(rec.Class, []).append(g)
    harakat_classes = {c for c, gs in members.items() if sum(g in harakat for g in gs) * 2 > len(gs)}
    avg = {c: statistics.mean([r.BaseAnchor[c].YCoordinate for r in st.BaseArray.BaseRecord if r.BaseAnchor[c]] or [0])
           for c in range(st.ClassCount)}
    seen = set()
    for r in st.BaseArray.BaseRecord:
        for c, a in enumerate(r.BaseAnchor):
            if a is None or id(a) in seen or c not in harakat_classes:
                continue
            seen.add(id(a))
            a.YCoordinate = max(a.YCoordinate, top) if avg[c] > 200 else a.YCoordinate - down
    return sorted(harakat_classes)


def mark_glyphs(f):
    """علامات التشكيل: صنف «علامة» في GDEF + كل ما يُغطّى كعلامة في جداول GPOS."""
    marks = set()
    gdef = f['GDEF'].table if 'GDEF' in f else None
    if gdef and gdef.GlyphClassDef:
        marks |= {g for g, c in gdef.GlyphClassDef.classDefs.items() if c == 3}
    if 'GPOS' in f:
        for lk in f['GPOS'].table.LookupList.Lookup:
            for st in lk.SubTable:
                st = getattr(st, 'ExtSubTable', st)
                for attr in ('MarkCoverage', 'Mark1Coverage'):
                    cov = getattr(st, attr, None)
                    if cov is not None:
                        marks |= set(cov.glyphs)
    return marks


# الحركات وحدها (لا نقاط الحروف): فتحة، ضمة، كسرة، تنوين، شدة، سكون، مدة، همزات فوقية/تحتية، ألف خنجرية
HARAKAT = list(range(0x064B, 0x0660)) + [0x0670, 0x06E1]
# كل ما عداها من الحروف العربية والأرقام وعلامات الترقيم
NON_HARAKAT = [u for u in list(range(0x0600, 0x0700)) + list(range(0x0750, 0x0780)) + list(range(0xFB50, 0xFE00)) + list(range(0xFE70, 0xFF00)) + list(range(0x20, 0x7F))
               if u not in HARAKAT]


def reachable_glyphs(f, unicodes):
    """كل الرسوم التي يمكن أن تنتج عن هذه الحروف (عبر جداول الاستبدال)."""
    from fontTools import subset
    opts = subset.Options()
    opts.layout_features = ['*']
    sub = subset.Subsetter(opts)
    cmap = f.getBestCmap()
    sub.populate(unicodes=[u for u in unicodes if u in cmap])
    sub._closure_glyphs(f)
    return set(sub.glyphs_retained)


def harakat_glyphs(f):
    """رسوم الحركات = العلامات التي لا تنتج عن الحروف وحدها (فنقاط الحروف تبقى مع الحروف)."""
    return mark_glyphs(f) - reachable_glyphs(f, NON_HARAKAT)


def strip(f, keep_marks):
    for t in ('COLR', 'CPAL', 'SVG ', 'sbix', 'CBDT', 'CBLC'):
        if t in f:
            del f[t]
    marks = harakat_glyphs(f)
    glyf = f['glyf']
    for g in f.getGlyphOrder():
        is_mark = g in marks
        if is_mark != keep_marks:
            glyf[g] = Glyph()  # رسم فارغ؛ العرض (hmtx) وقواعد التموضع تبقى كما هي
    return len(marks)


for name in os.listdir(OUT):
    if name.endswith('.woff2'):
        os.remove(OUT + name)

css = ['/* مولَّد آلياً بواسطة scripts/build-fonts.py — لا تعدّله يدوياً */']
for fam, faces in FAMILIES.items():
    for weight, path in faces:
        for layer, keep_marks in (('l', False), ('m', True)):
            f = TTFont(FS + path)
            if fam == 'ruqaaink':
                raise_marks(f, harakat_glyphs(f))
            n = strip(f, keep_marks)
            f.flavor = 'woff2'
            f.save(OUT + f'kq-{fam}-{weight}-{layer}.woff2')
            css.append(f"@font-face {{ font-family: 'KQ{layer.upper()}-{fam}'; src: url('/fonts/kq-{fam}-{weight}-{layer}.woff2') format('woff2'); "
                       f"font-weight: {weight}; font-display: block; }}")
        print(fam, weight, 'marks:', n)
open(CSS, 'w').write('\n'.join(css) + '\n')
print('ok')
