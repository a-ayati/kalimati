import React from 'react';
import { CustomStyle, DialectId, FontId, Quote, ThemeId } from '../types';
import { useKalimati } from '../context/KalimatiContext';
import { dialectInfo, pickDialect } from '../utils/dialects';
import { stripTashkeel } from '../utils/tashkeel';

/** اسم الخط الفعلي لكل اختيار */
export const FONT_FAMILIES: Record<FontId, string> = {
  'ruqaa-ink': "'KalimatiInk', 'Aref Ruqaa Ink', 'Aref Ruqaa', serif",
  ruqaa: "'Aref Ruqaa', serif",
  rakkas: "'Rakkas', serif",
  // الكوفي الحبري يحمل ألواناً مدمجة لا تتبع المظهر، فنستعمل الكوفي نفسه بألوان المنصة
  'kufi-ink': "'Reem Kufi', sans-serif",
  amiri: "'Amiri', serif",
  kufi: "'Reem Kufi', sans-serif",
  naskh: "'Noto Naskh Arabic', serif",
  cairo: "'Cairo', sans-serif",
};

const FONT_WEIGHTS: Partial<Record<FontId, number>> = {
  'ruqaa-ink': 700,
  ruqaa: 700,
  'kufi-ink': 700,
  amiri: 700,
  kufi: 600,
  naskh: 600,
  cairo: 700,
};

/** الخط الملوّن الوحيد: ألوانه تُبدَّل عبر لوحات الألوان في index.css */
const INK_FONTS: FontId[] = ['ruqaa-ink'];

export function isLightTheme(theme: ThemeId) {
  return theme === 'vintage' || theme === 'white';
}

/**
 * ألوان المقولة تتبع المظهر وحده — وهي نفسها في كل الخطوط:
 * الفصحى: حروف بلون النص وتشكيل أحمر (أو اللون المختار)، واللهجة: حروف رمادية وتشكيل ذهبي.
 */
export function quoteColors(style: Pick<CustomStyle, 'themeId' | 'tashkeelColor'>) {
  const light = isLightTheme(style.themeId);
  const fushaLetters = light ? '#1a1410' : '#f3ead8';
  const accents: Record<string, string> = light
    ? { red: '#c62828', yellow: '#d97706', gold: '#a87f12' }
    : { red: '#e5483b', yellow: '#f59e0b', gold: '#c9a227' };
  return {
    fushaLetters,
    fushaMarks: style.tashkeelColor === 'inherit' ? fushaLetters : accents[style.tashkeelColor] || accents.red,
    dialectLetters: light ? '#6b645c' : '#aaa49c',
    dialectMarks: light ? '#a87f12' : '#d4a72c',
  };
}

/**
 * نص بلونين لخط عادي: طبقة كاملة بلون التشكيل، وفوقها الحروف وحدها بلون الحروف،
 * فيظهر التشكيل ملوّناً تماماً كما في الخط الحبري.
 */
const TwoTone: React.FC<{ text: string; letters: string; marks: string; showMarks: boolean }> = ({
  text,
  letters,
  marks,
  showMarks,
}) => {
  if (!showMarks || letters === marks) return <span style={{ color: letters }}>{showMarks ? text : stripTashkeel(text)}</span>;
  return (
    <span style={{ display: 'grid' }}>
      <span style={{ gridArea: '1 / 1', color: marks }}>{text}</span>
      <span aria-hidden="true" style={{ gridArea: '1 / 1', color: letters, userSelect: 'none', pointerEvents: 'none' }}>
        {stripTashkeel(text)}
      </span>
    </span>
  );
};

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
  quote: Pick<Quote, 'text' | 'language' | 'darja' | 'dialects'>;
  /** اللهجة المعروضة تحت الفصحى (افتراضياً: لهجة القارئ) */
  dialect?: DialectId;
  style: CustomStyle;
  /** حجم خط الفصحى بالبكسل؛ الدارجة تُعرض بنحو 70% منه */
  fontSize?: number;
  /** فاصل زخرفي بين الصيغتين */
  showDivider?: boolean;
  className?: string;
}

/**
 * يعرض القول: الفصحى بحروف بيضاء وتشكيل أحمر، وتحتها صيغته باللهجة التي اختارها القارئ
 * بحروف رمادية وتشكيل ذهبي — في آنٍ واحد.
 */
export const QuoteText: React.FC<Props> = ({ quote, style, fontSize, dialect, showDivider = true, className = '' }) => {
  const { preferredDialect } = useKalimati();
  const size = fontSize ?? style.fontSize;
  const family = FONT_FAMILIES[style.fontId] || FONT_FAMILIES['ruqaa-ink'];
  const weight = FONT_WEIGHTS[style.fontId] ?? 400;
  const ink = INK_FONTS.includes(style.fontId);
  const light = isLightTheme(style.themeId);
  const lineHeight = Math.max(2, style.lineHeight);
  const show = (t: string) => (style.showTashkeel ? t : stripTashkeel(t));

  // إن كان القول بالدارجة وحدها نعرضه بأسلوب الدارجة وبالحجم الكامل
  const fushaText = quote.language === 'fusha' ? quote.text : null;
  const picked = pickDialect(quote, dialect ?? preferredDialect);
  const darjaText = quote.language === 'darja' ? quote.text : picked?.variant.text || null;
  const darjaLang = quote.language === 'darja' ? 'ar-DZ' : picked ? dialectInfo(picked.id).lang : 'ar';

  const fushaStyle: React.CSSProperties = {
    fontFamily: family,
    fontWeight: weight,
    fontSize: `${size}px`,
    lineHeight,
    letterSpacing: 0, // أي تباعد بين الحروف يفسد اتصال الخط العربي
    ...(ink ? { fontPalette: fushaPalette(style) } : {}),
  };
  const colors = quoteColors(style);

  const darjaStyle: React.CSSProperties = {
    fontFamily: family,
    fontWeight: ink ? 400 : weight,
    fontSize: `${fushaText ? Math.round(size * 0.72) : size}px`,
    lineHeight: Math.max(1.9, lineHeight - 0.2),
    letterSpacing: 0,
    // اللهجة: حروف رمادية وتشكيل ذهبي في كل الخطوط
    ...(ink ? { fontPalette: light ? '--darja-light' : '--darja-dark' } : {}),
  };

  return (
    <div className={`text-center ${className}`} dir="rtl">
      {fushaText && (
        <p lang="ar" style={fushaStyle} className="m-0">
          {ink ? (
            show(fushaText)
          ) : (
            <TwoTone text={fushaText} letters={colors.fushaLetters} marks={colors.fushaMarks} showMarks={style.showTashkeel} />
          )}
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
        <p lang={darjaLang} style={darjaStyle} className="m-0">
          {ink ? (
            show(darjaText)
          ) : (
            <TwoTone text={darjaText} letters={colors.dialectLetters} marks={colors.dialectMarks} showMarks={style.showTashkeel} />
          )}
        </p>
      )}
    </div>
  );
};
