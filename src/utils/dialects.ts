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
export function quoteDialects(_q: Pick<Quote, 'dialects' | 'darja'>): Partial<Record<DialectId, QuoteVariant>> {
  // الفصحى تُعرض وحدها والأمثال باللهجات أقوال مستقلة: لا صيغ مرافقة
  return {};
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

/** كاتب الأمثال الشعبية */
export const FOLK_AUTHOR = 'تراث شعبي';

export function isFolk(q: Pick<Quote, 'author'>): boolean {
  return q.author === FOLK_AUTHOR;
}

/** لهجة القول المكتوب بالدارجة (الجزائرية افتراضياً للأقوال القديمة) */
export function quoteDialectId(q: Pick<Quote, 'dialect'>): DialectId {
  return isDialectId(q.dialect) ? q.dialect : DEFAULT_DIALECT;
}

/** وسم القول: فصحى، أو دارجة بلهجتها، أو مثل شعبي بلهجته */
export function quoteLabel(q: Pick<Quote, 'language' | 'dialect' | 'author'>): string {
  if (q.language === 'fusha') return 'عربية فصحى';
  const name = dialectInfo(quoteDialectId(q)).name.replace(/^ال/, ''); // جزائرية، مغربية…
  return isFolk(q) ? `مثل شعبي ${name.replace(/ة$/, '')}` : `دارجة ${name}`;
}

/** نسبة القول: «من التراث الشعبي …» للأمثال فقط؛ خواطر الكاتب بلا اسم (يكفيها الختم) */
export function quoteByline(q: Pick<Quote, 'language' | 'dialect' | 'author'>): string {
  return isFolk(q) ? `من التراث الشعبي ${dialectInfo(quoteDialectId(q)).name.replace(/ة$/, '')}` : '';
}

/** سطر النسبة في النص المنسوخ أو المشارَك (فارغ لخواطر الكاتب) */
export function bylineSuffix(q: Pick<Quote, 'language' | 'dialect' | 'author'>): string {
  const b = quoteByline(q);
  return b ? `\n\n— ${b}` : '';
}
