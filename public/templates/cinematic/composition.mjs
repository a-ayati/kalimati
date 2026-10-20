/** Reserved copy bands are outside the photo, never over a face or scene detail. */
export const PHOTO_WINDOW = Object.freeze({ x: 0, y: 112, width: 1080, height: 1096 });
export const HEADER_BAND = Object.freeze({ x: 0, y: 0, width: 1080, height: 112 });
export const FOOTER_BAND = Object.freeze({ x: 0, y: 1214, width: 1080, height: 136 });
export function drawScene(ctx, photo) {
  ctx.fillStyle = '#080a09'; ctx.fillRect(0, 0, 1080, 1350);
  let sw = photo.naturalWidth, sh = photo.naturalHeight;
  if (sw / sh > .8) sw = sh * .8; else sh = sw / .8;
  ctx.save(); ctx.beginPath();
  ctx.rect(PHOTO_WINDOW.x, PHOTO_WINDOW.y, PHOTO_WINDOW.width, PHOTO_WINDOW.height); ctx.clip();
  // Keep the complete upper scene; crop only the quiet lower tail after shifting below the header.
  ctx.drawImage(photo, (photo.naturalWidth - sw) / 2, (photo.naturalHeight - sh) / 2, sw, sh, 0, PHOTO_WINDOW.y, 1080, 1350);
  ctx.restore();
}
export function headerLabels(year) {
  return [
    ['PERSONAL', 80, 43], ['VISUAL', 80, 64], ['STRIVE', 340, 43], ['TRUST', 500, 43],
    ['PURPOSE', 340, 80], ['HOPE', 500, 80],
    ['ALL RIGHTS', 1000, 43, 15, 'right'], [`RESERVED ©${year}`, 1000, 64, 15, 'right']
  ];
}
export function footerLabels(notes, author, source, measure) {
  const runs = notes.map((value, i) => ({ text: value.trim(), x: 80, y: 1238 + i * 22, align: 'left' }));
  runs.push({ text: author.trim(), x: 1000, y: 1238, align: 'right' }, { text: source.trim(), x: 1000, y: 1264, align: 'right' });
  for (const run of runs) {
    if (measure(run.text).width > 420) throw new Error('اختصر الملاحظة أو النسبة أو المصدر لتبقى داخل المساحة المخصصة لها.');
  }
  return runs.filter(run => run.text);
}
