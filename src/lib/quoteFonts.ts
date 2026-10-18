import { CustomStyle, FontId } from '../types';

/**
 * خطوط المقولات المستضافة (مولّدة بواسطة scripts/build-fonts.py)، لكل خط نسختان متطابقتا القياسات:
 *   KQL-*  الحروف وحدها،  KQM-*  التشكيل وحده.
 * تُرسمان فوق بعض بلونين، فيُصفّ النص حرفاً بحرف في كل المتصفحات.
 */
export const QUOTE_FONTS: Record<FontId, { fam: string; fusha: number; dialect: number; weights: number[]; fallback: string }> = {
  'ruqaa-ink': { fam: 'ruqaaink', fusha: 700, dialect: 400, weights: [400, 700], fallback: 'serif' },
  ruqaa: { fam: 'ruqaa', fusha: 700, dialect: 700, weights: [700], fallback: 'serif' },
  rakkas: { fam: 'rakkas', fusha: 400, dialect: 400, weights: [400], fallback: 'serif' },
  'kufi-ink': { fam: 'kufi', fusha: 700, dialect: 600, weights: [600, 700], fallback: 'sans-serif' },
  amiri: { fam: 'amiri', fusha: 700, dialect: 700, weights: [700], fallback: 'serif' },
  kufi: { fam: 'kufi', fusha: 600, dialect: 600, weights: [600, 700], fallback: 'sans-serif' },
  naskh: { fam: 'naskh', fusha: 600, dialect: 600, weights: [600], fallback: 'serif' },
  cairo: { fam: 'cairo', fusha: 700, dialect: 700, weights: [700], fallback: 'sans-serif' },
};

export type FontLayer = 'L' | 'M';

export function quoteFont(id: FontId) {
  return QUOTE_FONTS[id] || QUOTE_FONTS['ruqaa-ink'];
}

/** اسم الخط في CSS لطبقة الحروف (L) أو التشكيل (M) */
export function fontFamilyCss(id: FontId, layer: FontLayer = 'L'): string {
  const f = quoteFont(id);
  return `'KQ${layer}-${f.fam}', ${f.fallback}`;
}

/** بطاقة المشاركة: نحمّل نسختي الخط قبل الرسم على اللوحة */
export async function ensureCardFonts(id: FontId): Promise<void> {
  const f = quoteFont(id);
  const jobs: Promise<unknown>[] = [];
  for (const w of f.weights) {
    for (const layer of ['L', 'M'] as const) jobs.push(document.fonts.load(`${w} 40px 'KQ${layer}-${f.fam}'`, 'كَلِمَة').catch(() => []));
  }
  await Promise.all(jobs);
}

/** خط اللهجة المختار (أو خط الفصحى إن لم يُختر) */
export function dialectFontOf(style: Pick<CustomStyle, 'fontId' | 'dialectFontId'>): FontId {
  return style.dialectFontId ?? style.fontId;
}

/** نسبة حجم اللهجة إلى حجم الفصحى، لتبقى ثابتة حين يُكبَّر النص (شاشة السكون، البطاقة) */
export function dialectRatio(style: Pick<CustomStyle, 'fontSize' | 'dialectFontSize'>): number {
  if (!style.dialectFontSize || !style.fontSize) return 0.72;
  return Math.min(1.2, Math.max(0.4, style.dialectFontSize / style.fontSize));
}
