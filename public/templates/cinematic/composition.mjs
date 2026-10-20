/** Text coordinates are the user's original layout. Adapt scene assets, never these anchors. */
export const PHOTO_WINDOW = Object.freeze({ x: 0, y: 0, width: 1080, height: 1350 });
export const COPY_SAFE_ZONES = Object.freeze([
  { x: 260, y: 190, width: 560, height: 125 },
  { x: 275, y: 658, width: 500, height: 95 },
  { x: 65, y: 820, width: 950, height: 270 }
]);
export function drawScene(ctx, photo) {
  ctx.fillStyle = '#080a09'; ctx.fillRect(0, 0, 1080, 1350);
  const scale = Math.min(1080 / photo.naturalWidth, 1350 / photo.naturalHeight);
  const width = photo.naturalWidth * scale, height = photo.naturalHeight * scale;
  ctx.drawImage(photo, 0, 0, photo.naturalWidth, photo.naturalHeight,
    (1080 - width) / 2, (1350 - height) / 2, width, height);
}
export function headerLabels(year) {
  return [
    ['PERSONAL', 285, 220], ['VISUAL', 285, 238], ['STRIVE', 440, 220], ['TRUST', 546, 220],
    ['ALL RIGHTS', 795, 220, 15, 'right'], [`RESERVED ©${year}`, 795, 238, 15, 'right'],
    ['PURPOSE', 285, 292], ['HOPE', 795, 292, 15, 'right']
  ];
}
export function footerLabels(notes, author, source, measure) {
  const runs = notes.map((value, i) => ({ text: value.trim(), x: 297, y: [687,707,730][i], align: 'left', limit: 460 }));
  runs.push({ text: author.trim(), x: 540, y: 1260, align: 'center', limit: 930 }, { text: source.trim(), x: 540, y: 1287, align: 'center', limit: 930 });
  for (const run of runs) if (measure(run.text).width > run.limit) throw new Error('اختصر الملاحظة أو النسبة أو المصدر لتظهر كاملة في مكانها الأصلي.');
  return runs.filter(run => run.text);
}
