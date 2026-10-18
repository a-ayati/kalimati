import React, { useState } from 'react';
import { useKalimati } from '../context/KalimatiContext';
import { FontId, ThemeId, TashkeelColor, BorderStyle } from '../types';
import { QuoteText, FONT_FAMILIES } from '../components/QuoteText';
import { 
  Palette, 
  RotateCcw, 
  Type, 
  Sliders, 
  Sparkles, 
  Check, 
  Layers, 
  Eye,
  Languages
} from 'lucide-react';
import { quoteByline } from '../utils/dialects';
import { dialectFontOf } from '../lib/quoteFonts';

export const CustomizeView: React.FC = () => {
  const { customStyle, setCustomStyle, resetToOfficialStyle, quotes, preferredDialect, setPreferredDialect } = useKalimati();

  // التحكم في خط الفصحى وخط اللهجة كلٌّ على حدة
  const [fontTarget, setFontTarget] = useState<'fusha' | 'dialect'>('fusha');
  const isDialect = fontTarget === 'dialect';
  const currentFontId = isDialect ? dialectFontOf(customStyle) : customStyle.fontId;
  const currentSize = isDialect ? customStyle.dialectFontSize ?? customStyle.fontSize : customStyle.fontSize;
  const setFontFor = (id: FontId) =>
    setCustomStyle((prev) => (isDialect ? { ...prev, dialectFontId: id } : { ...prev, fontId: id }));
  const setSizeFor = (n: number) =>
    setCustomStyle((prev) => (isDialect ? { ...prev, dialectFontSize: n } : { ...prev, fontSize: n }));

  // Sample quote for live preview
  const previewQuote = quotes.find((q) => q.language === 'fusha') || quotes[0];
  // مثل باللهجة لمعاينة خط اللهجة وحجمه
  const previewDialect = quotes.find((q) => q.language === 'darja');

  const FONTS: { id: FontId; name: string; desc: string; sample: string }[] = [
    { id: 'ruqaa-ink', name: 'الرقعة — المطابق للبطاقة الرسمية', desc: 'خط رقعة حبري غني بالتشكيل المطابق تمامًا للصورة المرجعية الرسمية', sample: 'مَا لِي أُبَالِي بِمَنْ لَا يُبَالِي' },
    { id: 'ruqaa', name: 'الرقعة الكلاسيكي (Aref Ruqaa)', desc: 'خط وجداني انسيابي يعكس روح الخط اليدوي الأصيل', sample: 'خط الرقعة الجميل' },
    { id: 'rakkas', name: 'الخط المسرحي البارز (Rakkas)', desc: 'خط عربي جريء مستوحى من ملصقات الخط العربي الكلاسيكية', sample: 'جمال الحرف المسرحي' },
    { id: 'kufi-ink', name: 'الكوفي الحبري (Reem Kufi Ink)', desc: 'خط كوفي بنكهة حبرية رصينة يحاكي صياغة العبارات الجزائرية', sample: 'أصالة الخط الكوفي الحبري' },
    { id: 'amiri', name: 'النسخ الأميري (Amiri)', desc: 'خط كلاسيكي فاخر مستوحى من المطابع الأميرية', sample: 'جمال النسخ العربي' },
    { id: 'kufi', name: 'الكوفي الحديث (Reem Kufi)', desc: 'خط هندسي رصين يجمع بين العراقة والعصرية', sample: 'أصالة الخط الكوفي' },
    { id: 'naskh', name: 'خط النسخ المعاصر (Noto)', desc: 'وضوح قراءة فائق للشاشات والأجهزة المحمولة', sample: 'وضوح وراحة القراءة' },
    { id: 'cairo', name: 'الخط العصري المتوازن (Cairo)', desc: 'خط هندسي معاصر ممتاز لواجهات الاستخدام', sample: 'خط عصري متوازن' },
  ];

  const THEMES: { id: ThemeId; name: string; bgClass: string; borderClass: string; desc: string }[] = [
    {
      id: 'dark',
      name: 'الأسود والخردلي',
      bgClass: 'bg-[#0d0e11] text-[#f5f5f7]',
      borderClass: 'border-amber-500',
      desc: 'الهوية الرسمية الفاخرة لمنصة كلماتي بملمس خفيف وتشكيل ملوّن',
    },
    {
      id: 'vintage',
      name: 'الورق العتيق',
      bgClass: 'bg-[#f7f2e7] text-[#2c221a]',
      borderClass: 'border-amber-800',
      desc: 'دفء المخطوطات القديمة وأوراق البردي التراثية بدرجات الحبر البني',
    },
    {
      id: 'white',
      name: 'الأبيض البسيط',
      bgClass: 'bg-white text-[#111827]',
      borderClass: 'border-stone-400',
      desc: 'تصميم ناصع وهادئ يركّز على الكلمة بنقاء الحرف والتباين العالي',
    },
  ];

  const BORDERS: { id: BorderStyle; name: string }[] = [
    { id: 'double-gold', name: 'إطار مزدوج رفيع وزخرفة هادئة' },
    { id: 'arch-corner', name: 'إطار بأركان ماسية شرقية' },
    { id: 'minimal', name: 'إطار خفيف وبسيط' },
    { id: 'none', name: 'بدون إطار (نقاء مطلق)' },
  ];

  const fontClass = 
    customStyle.fontId === 'ruqaa-ink' ? 'font-ruqaa-ink' :
    customStyle.fontId === 'rakkas' ? 'font-rakkas' :
    customStyle.fontId === 'kufi-ink' ? 'font-kufi-ink' :
    customStyle.fontId === 'ruqaa' ? 'font-ruqaa' :
    customStyle.fontId === 'amiri' ? 'font-amiri' :
    customStyle.fontId === 'kufi' ? 'font-kufi' :
    customStyle.fontId === 'naskh' ? 'font-naskh' : 'font-cairo';

  const previewThemeClasses = 
    customStyle.themeId === 'vintage' 
      ? 'bg-grain-vintage text-[#28211b] border-amber-900/30' 
      : customStyle.themeId === 'white'
      ? 'bg-grain-white text-[#111827] border-stone-300'
      : 'bg-grain-dark text-[#f5f5f7] border-amber-500/30';

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-8">
      
      {/* Header with Reset Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400">التخصيص الفني الشخصي</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-amiri text-white pt-2 pb-1 leading-normal tracking-wide">
            عَلَى ذَوْقِكَ
          </h1>
          <p className="text-xs sm:text-sm text-stone-400">
            خصص طريقة قراءة وظهور الكلمات وفق ذوقك الشخصي، مع الحفاظ على أصالة الحرف العربي.
          </p>
        </div>

        <button
          onClick={resetToOfficialStyle}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-amber-500/15 text-stone-300 hover:text-amber-300 border border-white/10 hover:border-amber-500/30 transition-all cursor-pointer shadow-xs active:scale-95"
          title="الرجوع إلى الهوية الرسمية لمنصة كلماتي"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>تصميم كلماتي الأصلي</span>
        </button>
      </div>

      {/* Sticky Live Preview Card */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-stone-400">
          <div className="flex items-center gap-1.5 font-bold text-amber-400">
            <Eye className="w-4 h-4" />
            <span>معاينة حية ومباشرة للاختيارات</span>
          </div>
          <span className="text-[11px] text-stone-500">تُحفظ تفضيلاتك تلقائيًا على جهازك</span>
        </div>

        <div className={`p-4 sm:p-7 rounded-3xl border-2 transition-all duration-300 shadow-2xl ${previewThemeClasses}`}>
          <div className="border border-white/10 p-5 sm:p-8 rounded-2xl text-center">
            <div className="text-amber-500/40 text-xs mb-3">❦ ✦ ❦</div>
            <QuoteText quote={previewQuote} style={customStyle} className="transition-all" />
            <div className="mt-2 text-xs opacity-75">بقلم: {previewQuote.author}</div>
            {previewDialect && (
              <div className="mt-5 pt-4 border-t border-white/10">
                <QuoteText quote={previewDialect} style={customStyle} className="transition-all" />
                <div className="mt-2 text-xs opacity-75">{quoteByline(previewDialect)}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customization Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        
        {/* 1. Theme Palette */}
        <div className="bg-[#141518] p-5 rounded-3xl border border-white/10 space-y-3.5">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Palette className="w-4 h-4 text-amber-400" />
            <span>المظهر العام والخلفية</span>
          </div>
          <p className="text-stone-400 text-[11px]">اختر لوحة الألوان التي تريح عينك أثناء القراءة:</p>

          <div className="space-y-2">
            {THEMES.map((theme) => {
              const active = customStyle.themeId === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => setCustomStyle((prev) => ({ ...prev, themeId: theme.id }))}
                  className={`w-full p-3 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                    active
                      ? 'border-amber-400 bg-amber-500/10 shadow-xs'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`keep-tone w-8 h-8 rounded-xl border flex items-center justify-center font-bold text-xs ${theme.bgClass} ${theme.borderClass}`}>
                      ك
                    </div>
                    <div>
                      <div className="font-bold text-stone-200 text-xs">{theme.name}</div>
                      <div className="text-[10px] text-stone-400">{theme.desc}</div>
                    </div>
                  </div>
                  {active && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. الخطوط: الفصحى واللهجة كلٌّ بخطه وحجمه */}
        <div className="bg-[#141518] p-5 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Type className="w-4 h-4 text-amber-400" />
            <span>الخط والحجم</span>
          </div>
          <p className="text-stone-400 text-[11px]">اختر ما تريد ضبطه، ثم اختر خطه وحجمه:</p>

          <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-white/5 border border-white/10" role="tablist">
            {([
              { id: 'fusha', label: 'خط الفصحى' },
              { id: 'dialect', label: 'خط اللهجة' },
            ] as const).map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={fontTarget === t.id}
                onClick={() => setFontTarget(t.id)}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  fontTarget === t.id ? 'bg-amber-500 text-stone-950 shadow-xs' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {FONTS.map((font) => {
              const active = currentFontId === font.id;
              return (
                <button
                  key={font.id}
                  onClick={() => setFontFor(font.id)}
                  className={`w-full p-2.5 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                    active
                      ? 'border-amber-400 bg-amber-500/10 shadow-xs'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-200">{font.name}</span>
                      <span className="text-amber-400 text-base" style={{ fontFamily: FONT_FAMILIES[font.id] }}>({font.sample})</span>
                    </div>
                    <div className="text-[10px] text-stone-400 mt-0.5">{font.desc}</div>
                  </div>
                  {active && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="pt-1">
            <div className="flex justify-between text-stone-300 mb-1.5 font-medium">
              <span>{isDialect ? 'حجم خط اللهجة:' : 'حجم خط الفصحى:'}</span>
              <span className="text-amber-400 font-bold">{currentSize} بكسل</span>
            </div>
            <input
              type="range"
              min={isDialect ? 14 : 20}
              max={isDialect ? 36 : 42}
              value={currentSize}
              onChange={(e) => setSizeFor(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
              aria-label={isDialect ? 'حجم خط اللهجة' : 'حجم خط الفصحى'}
            />
          </div>
        </div>

        {/* 3. المسافات */}
        <div className="bg-[#141518] p-5 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>المسافات</span>
          </div>

          {/* Line height slider */}
          <div>
            <div className="flex justify-between text-stone-300 mb-1.5 font-medium">
              <span>تباعد الأسطر (Line Height):</span>
              <span className="text-amber-400 font-bold">{customStyle.lineHeight}</span>
            </div>
            <input
              type="range"
              min="2.0"
              max="3.4"
              step="0.05"
              value={customStyle.lineHeight}
              onChange={(e) => setCustomStyle((prev) => ({ ...prev, lineHeight: Number(e.target.value) }))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>
        </div>

        {/* 4. Tashkeel & Ornamentation */}
        <div className="bg-[#141518] p-5 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>التشكيل والزخرفة</span>
          </div>

          {/* Tashkeel toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
            <div>
              <div className="font-semibold text-stone-200">إظهار الحركات وتشكيل الحروف</div>
              <div className="text-[10px] text-stone-400">إظهار علامات الإعراب والتشكيل الفصيح والدارج</div>
            </div>
            <input
              type="checkbox"
              checked={customStyle.showTashkeel}
              onChange={(e) => setCustomStyle((prev) => ({ ...prev, showTashkeel: e.target.checked }))}
              className="w-4 h-4 accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Tashkeel color options */}
          <div>
            <label className="block text-stone-300 font-medium mb-1.5">لون التشكيل:</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'red', label: 'أحمر (فصحى)', colorClass: 'bg-rose-500' },
                { id: 'yellow', label: 'خردلي (جزائرية)', colorClass: 'bg-amber-400' },
                { id: 'gold', label: 'ذهبي أصيل', colorClass: 'bg-yellow-500' },
                { id: 'inherit', label: 'لون النص نفسه', colorClass: 'bg-stone-300' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setCustomStyle((prev) => ({ ...prev, tashkeelColor: opt.id as TashkeelColor }))}
                  className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    customStyle.tashkeelColor === opt.id
                      ? 'border-amber-400 bg-amber-500/20 text-white font-bold'
                      : 'border-white/10 bg-white/5 text-stone-400'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${opt.colorClass}`} />
                  <span className="text-[10px]">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Border style */}
          <div>
            <label className="block text-stone-300 font-medium mb-1.5">نمط الإطار والزخرفة:</label>
            <select
              value={customStyle.borderStyle}
              onChange={(e) => setCustomStyle((prev) => ({ ...prev, borderStyle: e.target.value as BorderStyle }))}
              className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-stone-200 text-xs focus:outline-none focus:border-amber-500"
            >
              {BORDERS.map((b) => (
                <option key={b.id} value={b.id} className="bg-stone-900 text-white">
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Apply To Scope */}
          <div>
            <label className="block text-stone-300 font-medium mb-1.5">تطبيق هذه التفضيلات على:</label>
            <div className="grid grid-cols-4 gap-1 text-center">
              {[
                { id: 'all', label: 'الجميع' },
                { id: 'reading', label: 'القراءة فقط' },
                { id: 'zen', label: 'لحظة سكون' },
                { id: 'cards', label: 'البطاقات' },
              ].map((scope) => (
                <button
                  key={scope.id}
                  onClick={() => setCustomStyle((prev) => ({ ...prev, applyTo: scope.id as any }))}
                  className={`py-1.5 px-1 rounded-lg border text-[11px] transition-all cursor-pointer ${
                    customStyle.applyTo === scope.id
                      ? 'bg-amber-500 text-stone-950 font-bold border-amber-400'
                      : 'bg-white/5 text-stone-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  {scope.label}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
