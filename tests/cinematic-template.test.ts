import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize, splitQuote, layoutTitle, parseSeed, FONT_SIZE } from '../public/templates/cinematic/layout.mjs';
// Metrics expose different ink overhangs so advance-only centering would fail.
function measure(text) {
  const visible = [...text.replace(/\p{M}/gu, '')].length;
  const width = visible * 10;
  return { width, actualBoundingBoxLeft: Math.max(0, width - 2), actualBoundingBoxRight: text ? 2 : 0 };
}
test('handoff preserves complete Arabic text and attribution without HTML interpretation', () => {
  const input = { text: 'لا تُصغّر نفسك لتناسب مكانًا.', author: 'اسم القائل', source: 'المصدر', sourceUrl: 'https://example.org/quote' };
  assert.deepEqual(parseSeed('#' + encodeURIComponent(JSON.stringify(input))), input);
  assert.equal(parseSeed('#' + encodeURIComponent(JSON.stringify({ sourceUrl: 'javascript:alert(1)', text: '<img onerror=alert(1)>' }))).sourceUrl, undefined);
  assert.deepEqual(parseSeed('#bad-json'), {});
  assert.deepEqual(parseSeed('#' + 'x'.repeat(40000)), {});
});
test('splitting keeps every original word and retains explicit two-line copy', () => {
  for (const text of ['عليك السعي لا موعد الوصول.', 'START NOW WITH WHAT YOU HAVE.', 'ليس كل ما تتحمله يجب أن تقبله.']) {
    const lines = splitQuote(text);
    assert.equal(lines.length, 2);
    assert.equal(lines.join(' '), text);
  }
  assert.deepEqual(splitQuote('ابدأ الآن\nبما لديك.'), ['ابدأ الآن', 'بما لديك.']);
});
test('both lines have equal ink edges centered on x540 with unchanged font size', () => {
  for (const lines of [['ابدأ الآن', 'بما لديك.'], ['ابدا', 'بما لديك.'], ['KEEP GOING', 'MAKE IT HAPPEN'], ['كل خطوة', 'تترك أثرا.']]) {
    const layout = layoutTitle(lines, measure);
    assert.equal(FONT_SIZE, 78);
    assert.equal(layout.length, 2);
    assert.ok(Math.abs(layout[0].width - layout[1].width) < .01);
    for (const line of layout) {
      const first = line.runs[0], last = line.runs.at(-1);
      const right = first.x + measure(first.word).actualBoundingBoxRight;
      const left = last.x - measure(last.word).actualBoundingBoxLeft;
      assert.ok(Math.abs((left + right) / 2 - 540) < .01);
      assert.ok(Math.abs(right - left - line.width) < .01);
      assert.equal(line.runs.length, lines[layout.indexOf(line)].split(' ').length);
    }
  }
});
test('keyword matching includes complete words, ignores diacritics and kashida', () => {
  assert.equal(normalize('أَثَــــرًا.'), normalize('أثرا'));
  assert.equal(normalize('نُــــور.'), 'نور');
});
test('invalid or overlong copy produces an explicit error rather than shrinking or clipping', () => {
  assert.throws(() => layoutTitle(['نص', ''], measure));
  assert.throws(() => layoutTitle(['كلمة\nكلمة', 'كلمة'], measure));
  assert.throws(() => layoutTitle(['a'.repeat(120), 'short'], measure));
});
