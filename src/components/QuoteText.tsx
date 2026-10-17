import React from 'react';
import { CustomStyle, DialectId, FontId, Quote, ThemeId } from '../types';
import { useKalimati } from '../context/KalimatiContext';
import { dialectInfo, pickDialect } from '../utils/dialects';
import { stripTashkeel } from '../utils/tashkeel';
import { QUOTE_FONTS, fontFamilyCss, quoteFont } from '../lib/quoteFonts';
import { TwoLayerText } from './InkText';

/** اسم الخط لكل اختيار (للمعاينات في صفحة التخصيص) */
export const FONT_FAMILIES: Record<FontId, string> = Object.fromEntries(
  (Object.keys(QUOTE_FONTS) as FontId[]).map((id) => [id, fontFamilyCss(id)])
) as Record<FontId, string>;

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
  const font = quoteFont(style.fontId);
  const family = fontFamilyCss(style.fontId, 'L');
  const light = isLightTheme(style.themeId);
  const lineHeight = Math.max(2, style.lineHeight);
  const colors = quoteColors(style);
  const lettersFont = fontFamilyCss(style.fontId, 'L');
  const marksFont = fontFamilyCss(style.fontId, 'M');

  // إن كان القول بالدارجة وحدها نعرضه بأسلوب الدارجة وبالحجم الكامل
  const fushaText = quote.language === 'fusha' ? quote.text : null;
  const picked = pickDialect(quote, dialect ?? preferredDialect);
  const darjaText = quote.language === 'darja' ? quote.text : picked?.variant.text || null;
  const darjaLang = quote.language === 'darja' ? 'ar-DZ' : picked ? dialectInfo(picked.id).lang : 'ar';

  const fushaStyle: React.CSSProperties = {
    fontFamily: family,
    fontWeight: font.fusha,
    fontSize: `${size}px`,
    lineHeight,
    letterSpacing: 0, // أي تباعد بين الحروف يفسد اتصال الخط العربي
  };

  const darjaStyle: React.CSSProperties = {
    fontFamily: family,
    fontWeight: font.dialect,
    fontSize: `${fushaText ? Math.round(size * 0.72) : size}px`,
    lineHeight: Math.max(1.9, lineHeight - 0.2),
    letterSpacing: 0,
  };

  return (
    <div className={`text-center ${className}`} dir="rtl">
      {fushaText && (
        <p lang="ar" style={fushaStyle} className="m-0">
          <TwoLayerText text={fushaText} letters={colors.fushaLetters} marks={colors.fushaMarks} lettersFont={lettersFont} marksFont={marksFont} showMarks={style.showTashkeel} />
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
          <TwoLayerText text={darjaText} letters={colors.dialectLetters} marks={colors.dialectMarks} lettersFont={lettersFont} marksFont={marksFont} showMarks={style.showTashkeel} />
        </p>
      )}
    </div>
  );
};
