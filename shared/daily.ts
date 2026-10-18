export type DailyKind = 'original' | 'world' | 'folk';
export const DAILY_LABELS: Record<DailyKind, string> = {
  original: 'حكمة بالفصحى — بقلمي', world: 'اقتباس عالمي — إنجليزي أو فرنسي', folk: 'مثل معروف بلهجة عربية',
};
export interface DailyQuote {
  id?: string; slug: string; language: string; author?: string;
  featuredDate?: string; publishedAt?: string;
}
export function dayNumber(year: number, month: number, day: number): number {
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}
export function dailyKind(year: number, month: number, day: number): DailyKind {
  const offset = dayNumber(year, month, day) - dayNumber(2026, 10, 18);
  return (['original', 'world', 'folk'] as const)[((offset % 3) + 3) % 3];
}
export function quoteKind(q: Pick<DailyQuote, 'language' | 'author'>): DailyKind | null {
  if (q.language === 'en' || q.language === 'fr') return 'world';
  if (q.language === 'darja' && q.author === 'تراث شعبي') return 'folk';
  if (q.language === 'fusha' && q.author !== 'تراث شعبي') return 'original';
  return null;
}
export function dailyQuote<T extends DailyQuote>(quotes: T[], year: number, month: number, day: number): T | undefined {
  const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const sorted = [...quotes].sort((a, b) => (a.id || a.slug).localeCompare(b.id || b.slug));
  const selected = sorted.find(q => q.featuredDate === date);
  if (selected) return selected;
  const pool = sorted.filter(q => quoteKind(q) === dailyKind(year, month, day));
  const available = pool.length ? pool : sorted;
  const cycle = Math.floor((dayNumber(year, month, day) - dayNumber(2026, 10, 18)) / 3);
  return available[((cycle % available.length) + available.length) % available.length];
}
