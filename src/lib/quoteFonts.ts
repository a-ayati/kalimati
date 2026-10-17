import { FontId } from '../types';

/**
 * خطوط المقولات المستضافة (مولّدة بواسطة scripts/build-fonts.py):
 * كل خط بلونين في طبقة واحدة — الحروف بلون النص، والتشكيل بلون يُبدَّل عبر font-palette.
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

export function quoteFont(id: FontId) {
  return QUOTE_FONTS[id] || QUOTE_FONTS['ruqaa-ink'];
}

export function fontFamilyCss(id: FontId): string {
  const f = quoteFont(id);
  return `'KQ-${f.fam}', ${f.fallback}`;
}

/** اسم لوحة الألوان (معرّفة في quote-fonts.css) */
export function paletteName(id: FontId, key: string): string {
  return `--kq-${quoteFont(id).fam}-${key}`;
}

/** بطاقة المشاركة: اللوحة لا تدعم font-palette، فنحمّل نسخة التشكيل الذهبي للهجة عند الحاجة */
const loadedGold = new Set<string>();
export async function ensureCardFonts(id: FontId): Promise<void> {
  const f = quoteFont(id);
  const jobs: Promise<unknown>[] = [];
  for (const w of f.weights) {
    jobs.push(document.fonts.load(`${w} 40px 'KQ-${f.fam}'`, 'كَلِمَة'));
    const key = `${f.fam}-${w}`;
    if (!loadedGold.has(key)) {
      loadedGold.add(key);
      const face = new FontFace(`KQ-${f.fam}-gold`, `url(/fonts/kq-${f.fam}-${w}-gold.woff2)`, { weight: String(w) });
      document.fonts.add(face);
      jobs.push(face.load());
    }
  }
  await Promise.all(jobs.map((j) => j.catch(() => undefined)));
}
