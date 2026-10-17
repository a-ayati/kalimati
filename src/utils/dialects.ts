import { DialectId, Quote, QuoteVariant } from '../types';

export const DIALECTS: { id: DialectId; name: string; short: string; lang: string }[] = [
  { id: 'dz', name: 'الجزائرية', short: 'الجزائرية', lang: 'ar-DZ' },
  { id: 'ma', name: 'المغربية', short: 'المغربية', lang: 'ar-MA' },
  { id: 'tn', name: 'التونسية', short: 'التونسية', lang: 'ar-TN' },
  { id: 'eg', name: 'المصرية', short: 'المصرية', lang: 'ar-EG' },
  { id: 'gulf', name: 'الخليجية', short: 'الخليجية', lang: 'ar-AE' },
  { id: 'sham', name: 'الشامية', short: 'الشامية', lang: 'ar-SY' },
];

export const DEFAULT_DIALECT: DialectId = 'dz';

export function dialectInfo(id: DialectId) {
  return DIALECTS.find((d) => d.id === id) || DIALECTS[0];
}

export function isDialectId(v: unknown): v is DialectId {
  return typeof v === 'string' && DIALECTS.some((d) => d.id === v);
}

/** الصيغ المتوفرة لقول ما (مع دعم الحقل القديم darja) */
export function quoteDialects(q: Pick<Quote, 'dialects' | 'darja'>): Partial<Record<DialectId, QuoteVariant>> {
  const out: Partial<Record<DialectId, QuoteVariant>> = { ...(q.dialects || {}) };
  if (q.darja && !out.dz) out.dz = q.darja;
  return out;
}

export function availableDialects(q: Pick<Quote, 'dialects' | 'darja'>): DialectId[] {
  const all = quoteDialects(q);
  return DIALECTS.map((d) => d.id).filter((id) => all[id]?.text);
}

/** الصيغة التي تُعرض تحت الفصحى: لهجة القارئ إن وُجدت، وإلا لا شيء */
export function pickDialect(
  q: Pick<Quote, 'language' | 'dialects' | 'darja'>,
  preferred: DialectId
): { id: DialectId; variant: QuoteVariant } | null {
  if (q.language !== 'fusha') return null;
  const v = quoteDialects(q)[preferred];
  return v?.text ? { id: preferred, variant: v } : null;
}

/** كل نصوص القول (الفصحى وكل اللهجات) للبحث */
export function allQuoteText(q: Quote): string {
  const d = quoteDialects(q);
  return [q.text, ...Object.values(d).map((v) => v?.text || '')].join(' ');
}
