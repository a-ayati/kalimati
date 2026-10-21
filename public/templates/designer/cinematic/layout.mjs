/** Typography shared by both apps. No glyph scaling, clipping overlays or maxWidth. */
export const FONT_SIZE = 78;
export const BASELINES = [918, 1045];
export const normalize = text => text.replace(/[ـ\p{M}،.!؟]/gu, '');
export function splitQuote(text) {
  const explicit = text.trim().split(/\n+/).filter(Boolean);
  if (explicit.length === 2) return explicit;
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return [words[0] || '', ''];
  let best = 1, delta = Infinity;
  for (let i = 1; i < words.length; i++) {
    const d = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
    if (d < delta) { best = i; delta = d; }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}
function joinSites(text) {
  const sites = [];
  for (let i = 0; i < text.length; i++) {
    if (!'بتثجحخسشصضطظعغفقكلمنهيئ'.includes(text[i])) continue;
    let next = i + 1;
    while (next < text.length && /\p{M}/u.test(text[next])) next++;
    if (/[\u0622-\u064A]/.test(text[next] || '') && text[next] !== 'ء' &&
        !(text[i] === 'ل' && 'اأإآ'.includes(text[next]))) sites.push(next);
  }
  return sites;
}
function extend(text, sites, counts) {
  for (let i = sites.length - 1; i >= 0; i--) {
    text = text.slice(0, sites[i]) + 'ـ'.repeat(counts[i]) + text.slice(sites[i]);
  }
  return text;
}
function inkWidth(measure, text) {
  const m = measure(text);
  return m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
}
export function layoutTitle(lines, measure) {
  if (lines.length !== 2 || lines.some(t => !t.trim())) throw new Error('أدخل العبارة في سطرين.');
  if (lines.some(t => t.length > 300 || /[\r\n]/.test(t))) throw new Error('اختصر العبارة إلى سطرين واضحين.');
  let target = Math.max(...lines.map(t => inkWidth(measure, t)));
  const prepared = lines.map(text => {
    const sites = joinSites(text);
    return { text, sites, counts: sites.map(() => 0) };
  });
  for (const line of prepared) {
    if (line.text.includes(' ') || !line.sites.length) continue;
    let step = 0;
    while (inkWidth(measure, extend(line.text, line.sites, line.counts)) < target && step < 100) {
      line.counts[step++ % line.counts.length]++;
    }
    target = Math.max(target, inkWidth(measure, extend(line.text, line.sites, line.counts)));
  }
  if (target > 930) throw new Error('العبارة طويلة لهذا القالب؛ اختصرها أو أعد تقسيم السطرين.');
  return prepared.map((line, index) => {
    let text = extend(line.text, line.sites, line.counts), step = 0;
    const gaps = (text.match(/ /g) || []).length;
    while (gaps && line.sites.length && step < 100) {
      const counts = [...line.counts]; counts[step % counts.length]++;
      const next = extend(line.text, line.sites, counts);
      if (inkWidth(measure, next) > target - gaps * 3) break;
      line.counts = counts; text = next; step++;
    }
    const words = text.split(/\s+/), metrics = words.map(measure);
    const space = measure(' ').width;
    const natural = metrics[0].actualBoundingBoxRight + metrics.slice(0, -1).reduce((sum, m) => sum + m.width, 0) +
      metrics.at(-1).actualBoundingBoxLeft + space * (words.length - 1);
    const gap = words.length > 1 ? space + (target - natural) / (words.length - 1) : 0;
    if (gap < 0) throw new Error('أعد تقسيم السطرين للحصول على تباعد طبيعي.');
    let cursor = 540 + target / 2 - metrics[0].actualBoundingBoxRight;
    const runs = words.map((word, i) => {
      const run = { word, x: cursor, baseline: BASELINES[index] };
      cursor -= metrics[i].width + gap;
      return run;
    });
    return { runs, width: target, gap };
  });
}
export function parseSeed(hash) {
  try {
    if (!hash || hash.length > 32768) return {};
    const input = JSON.parse(decodeURIComponent(hash.replace(/^#/, '')));
    if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
    const result = {};
    for (const key of ['text', 'line1', 'line2', 'keyword', 'translation', 'author', 'source', 'sourceUrl']) {
      if (typeof input[key] === 'string') result[key] = input[key].slice(0, key === 'text' ? 6000 : 3000);
    }
    if (result.sourceUrl) {
      const u = new URL(result.sourceUrl);
      if (!['http:', 'https:'].includes(u.protocol)) delete result.sourceUrl;
    }
    return result;
  } catch { return {}; }
}

