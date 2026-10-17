import { Quote } from '../types';

/**
 * يدمج كل قول فصيح مع صيغته الجزائرية المرتبطة (النموذج القديم بسجلين) في سجل واحد،
 * حتى يُعرض القول بالفصحى والدارجة في آنٍ واحد ولا يتكرر في القوائم.
 */
export function mergePairs(quotes: Quote[]): Quote[] {
  const byId = new Map(quotes.map((q) => [q.id, q]));
  const absorbed = new Set<string>();
  const result: Quote[] = [];
  for (const q of quotes) {
    if (absorbed.has(q.id)) continue;
    const pair = q.pairedQuoteId ? byId.get(q.pairedQuoteId) : undefined;
    if (pair && !q.darja && !q.dialects?.dz && q.language !== pair.language) {
      const fusha = q.language === 'fusha' ? q : pair;
      const darja = q.language === 'fusha' ? pair : q;
      absorbed.add(darja.id);
      absorbed.add(fusha.id);
      const { pairedQuoteId: _drop, ...rest } = fusha;
      result.push({ ...rest, dialects: { dz: { text: darja.text, plainText: darja.plainText } } });
      continue;
    }
    result.push(q);
  }
  return result;
}

/** كل النص القابل للبحث في القول (الفصحى والدارجة) بلا تشكيل */
export function searchableText(q: Quote): string {
  return [q.plainText, q.darja?.plainText, ...Object.values(q.dialects || {}).map((v) => v?.plainText)].filter(Boolean).join(' ');
}
