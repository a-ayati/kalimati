export interface ReadyDesign {
  templateId: string;
  style: 'cinematic' | 'art';
  caption: string;
  lines?: [string, string];
  keyword?: string;
  color?: string;
  translation?: string;
  background?: string;
}

const templates: Record<string, string> = {"hope-01":"cinematic","hope-02":"cinematic","hope-03":"cinematic","hope-04":"cinematic","hope-05":"cinematic","social-01":"cinematic","social-02":"cinematic","social-03":"cinematic","social-04":"cinematic","social-05":"cinematic","awareness-01":"cinematic","awareness-02":"cinematic","awareness-03":"cinematic","awareness-04":"cinematic","awareness-05":"cinematic","boundaries-01":"cinematic","boundaries-02":"cinematic","boundaries-03":"cinematic","boundaries-04":"cinematic","boundaries-05":"cinematic","growth-01":"cinematic","growth-02":"cinematic","growth-03":"cinematic","growth-04":"cinematic","growth-05":"cinematic","care-01":"cinematic","care-02":"cinematic","care-03":"cinematic","care-04":"cinematic","care-05":"cinematic","art-beginnings":"art","art-departure":"art","art-patience":"art"};
const normalized = (s: string) => s.trim().replace(/\s+/g, ' ');
const backgrounds: Record<string, string> = {"hope-01":"hope-01-hidden-v5","hope-02":"hope-02-hidden-v5","hope-03":"hope-03","hope-04":"hope-04","hope-05":"hope-05","social-01":"social-01-hidden-v5","social-02":"social-02-hidden-v5","social-03":"social-03-hidden-v5","social-04":"social-04-hidden-v5","social-05":"social-05-hidden-v5","awareness-01":"awareness-01-hidden-v5","awareness-02":"awareness-02","awareness-03":"awareness-03-hidden-v5","awareness-04":"awareness-04","awareness-05":"awareness-05","boundaries-01":"boundaries-01-hidden-v5","boundaries-02":"boundaries-02-hidden-v5","boundaries-03":"boundaries-03","boundaries-04":"boundaries-04-hidden-v5","boundaries-05":"boundaries-05","growth-01":"growth-01-hidden-v5","growth-02":"growth-02-hidden-v5","growth-03":"growth-03-hidden-v5","growth-04":"growth-04","growth-05":"growth-05-hidden-v5","care-01":"care-01-hidden-v5","care-02":"care-02-hidden-v5","care-03":"care-03-hidden-v5","care-04":"care-04","care-05":"care-05-hidden-v5"};
const unmark = (s: string) => s.replace(/[ـ\p{M}،.!؟]/gu, '');

/** Only a known template and bounded rendering settings cross the API boundary. */
export function validateReadyDesign(raw: unknown, text: string): ReadyDesign | string | undefined {
  if (raw == null) return undefined;
  if (typeof raw !== 'object' || Array.isArray(raw)) return 'إعدادات التصميم غير صالحة.';
  const d = raw as Record<string, unknown>;
  if (typeof d.templateId !== 'string' || !Object.hasOwn(templates, d.templateId) || templates[d.templateId] !== d.style) return 'اختر تصميمًا من المكتبة.';
  if (typeof d.caption !== 'string' || !d.caption.trim() || d.caption.length > 4000) return 'اكتب كابشن لا يتجاوز 4000 حرف.';
  const result: ReadyDesign = { templateId: d.templateId, style: d.style as ReadyDesign['style'], caption: d.caption.trim() };
  if (d.style === 'art') return result;
  if (!Array.isArray(d.lines) || d.lines.length !== 2 || d.lines.some(s => typeof s !== 'string' || !s.trim() || s.length > 160 || /[\r\n]/.test(s))) return 'اكتب العبارة في سطرين واضحين.';
  const lines = d.lines.map(s => (s as string).trim()) as [string, string];
  if (normalized(lines.join(' ')) !== normalized(text)) return 'يجب أن يطابق نص المنشور العبارة في التصميم.';
  if (typeof d.keyword !== 'string' || !d.keyword.trim() || d.keyword.length > 80 || lines.flatMap(s => s.split(/\s+/)).filter(s => unmark(s) === unmark((d.keyword as string).trim())).length !== 1) return 'اختر كلمة ملوّنة تظهر مرة واحدة في العبارة.';
  if (typeof d.color !== 'string' || !/^#[\da-f]{6}$/i.test(d.color)) return 'لون التصميم غير صالح.';
  if (typeof d.translation !== 'string' || d.translation.length > 120) return 'اختصر الترجمة إلى 120 حرفًا.';
  if (d.background !== backgrounds[d.templateId]) return 'خلفية التصميم غير صالحة.';
  return { ...result, lines, keyword: d.keyword.trim(), color: d.color, translation: d.translation.trim(), background: d.background as string };
}

export function readyRequestQuoteId(value: unknown): string | undefined {
  return typeof value === 'string' && /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(value) ? `design-${value.toLowerCase()}` : undefined;
}
