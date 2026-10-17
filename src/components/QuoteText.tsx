import React from 'react';
import { CustomStyle, FontId, Quote, ThemeId } from '../types';
import { stripTashkeel } from '../utils/tashkeel';

/** اسم الخط الفعلي لكل اختيار */
export const FONT_FAMILIES: Record<FontId, string> = {
  'ruqaa-ink': "'KalimatiInk', 'Aref Ruqaa Ink', 'Aref Ruqaa', serif",
  ruqaa: "'Aref Ruqaa', serif",
  rakkas: "'Rakkas', serif",
  'kufi-ink': "'Reem Kufi Ink', 'Reem Kufi', sans-serif",
  amiri: "'Amiri', serif",
  kufi: "'Reem Kufi', sans-serif",
  naskh: "'Noto Naskh Arabic', serif",
  cairo: "'Cairo', sans-serif",
};

const FONT_WEIGHTS: Partial<Record<FontId, number>> = {
  'ruqaa-ink': 700,
  ruqaa: 700,
  'kufi-ink': 600,
  amiri: 700,
  kufi: 600,
  naskh: 600,
  cairo: 700,
};

/** الخطوط الملوّنة: حروفها وتشكيلها بألوان مدمجة يمكن تبديلها */
const INK_FONTS: FontId[] = ['ruqaa-ink', 'kufi-ink'];

function isLightTheme(theme: ThemeId) {
  return theme === 'vintage' || theme === 'white';
}

/**
 * لوحة ألوان الخط الحبري للفصحى: حروف بلون النص وتشكيل باللون المختار
 * (معرّفة في index.css بالأسماء --fusha-<الخلفية>-<لون التشكيل>)
 */
function fushaPalette(style: CustomStyle): string {
  const bg = isLightTheme(style.themeId) ? 'light' : 'dark';
  const accent = style.tashkeelColor === 'inherit' ? 'plain' : style.tashkeelColor;
  return `--fusha-${bg}-${accent}`;
}

interface Props {
  quote: Pick<Quote, 'text' | 'language' | 'darja'>;
  style: CustomStyle;
  /** حجم خط الفصحى بالبكسل؛ الدارجة تُعرض بنحو 70% منه */
  fontSize?: number;
  /** فاصل زخرفي بين الصيغتين */
  showDivider?: boolean;
  className?: string;
}

/**
 * يعرض القول كما في البطاقة الرسمية: الفصحى بخط الرقعة الحبري بحروف داكنة وتشكيل أحمر،
 * وتحتها الصيغة الجزائرية بألوان الحبر (أحمر متدرّج وشدّة زرقاء) — في آنٍ واحد.
 */
export const QuoteText: React.FC<Props> = ({ quote, style, fontSize, showDivider = true, className = '' }) => {
  const size = fontSize ?? style.fontSize;
  const family = FONT_FAMILIES[style.fontId] || FONT_FAMILIES['ruqaa-ink'];
  const weight = FONT_WEIGHTS[style.fontId] ?? 400;
  const ink = INK_FONTS.includes(style.fontId);
  const light = isLightTheme(style.themeId);
  const lineHeight = Math.max(2, style.lineHeight);
  const show = (t: string) => (style.showTashkeel ? t : stripTashkeel(t));

  // إن كان القول بالدارجة وحدها نعرضه بأسلوب الدارجة وبالحجم الكامل
  const fushaText = quote.language === 'fusha' ? quote.text : null;
  const darjaText = quote.language === 'darja' ? quote.text : quote.darja?.text || null;

  const fushaStyle: React.CSSProperties = {
    fontFamily: family,
    fontWeight: weight,
    fontSize: `${size}px`,
    lineHeight,
    letterSpacing: 0, // أي تباعد بين الحروف يفسد اتصال الخط العربي
    ...(ink ? { fontPalette: fushaPalette(style) } : {}),
  };

  const darjaStyle: React.CSSProperties = {
    fontFamily: family,
    fontWeight: ink ? 400 : weight,
    fontSize: `${fushaText ? Math.round(size * 0.72) : size}px`,
    lineHeight: Math.max(1.9, lineHeight - 0.2),
    letterSpacing: 0,
    // الخط الحبري يحمل ألوانه الأصلية (الأحمر والأزرق)؛ وغيره يأخذ لون الدارجة
    ...(ink ? {} : { color: light ? '#b4231a' : '#f08a70' }),
  };

  return (
    <div className={`text-center ${className}`} dir="rtl">
      {fushaText && (
        <p lang="ar" style={fushaStyle} className="m-0">
          {show(fushaText)}
        </p>
      )}

      {fushaText && darjaText && showDivider && (
        <div className="flex justify-center my-3 sm:my-4" aria-hidden="true">
          <svg width="180" height="10" viewBox="0 0 180 10" className={light ? 'text-[#8a6a4a]/60' : 'text-amber-500/40'}>
            <path d="M2 5 C 40 1, 70 9, 90 5 S 140 1, 178 5" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </div>
      )}

      {darjaText && (
        <p lang="ar-DZ" style={darjaStyle} className="m-0">
          {show(darjaText)}
        </p>
      )}
    </div>
  );
};
