import { FONT_SIZE, normalize, splitQuote, layoutTitle, parseSeed } from './layout.mjs';
const $ = id => document.getElementById(id);
const canvas = $('canvas'), ctx = canvas.getContext('2d');
let photo = null, fontReady = false, pending = false, uploadSequence = 0;
const controls = ['line1', 'line2', 'keyword', 'color', 'translation', 'note1', 'note2', 'date', 'author', 'source'];
function status(message) { $('status').textContent = message; }
function label(text, x, y, size = 15, align = 'left', family = 'Arial') {
  ctx.font = `${size}px ${family}`; ctx.direction = 'ltr'; ctx.textAlign = align;
  ctx.fillStyle = '#f3eee5'; ctx.fillText(text, x, y);
}
function wrap(text, limit = 34) {
  const lines = []; let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && (line + ' ' + word).length > limit) { lines.push(line); line = word; }
    else line = line ? line + ' ' + word : word;
  }
  if (line) lines.push(line);
  return lines;
}
function draw() {
  $('download').disabled = true;
  if (!photo || !fontReady) return;
  ctx.clearRect(0, 0, 1080, 1350);
  let sw = photo.naturalWidth, sh = photo.naturalHeight;
  if (sw / sh > .8) sw = sh * .8; else sh = sw / .8;
  ctx.drawImage(photo, (photo.naturalWidth - sw) / 2, (photo.naturalHeight - sh) / 2, sw, sh, 0, 0, 1080, 1350);
  const burn = ctx.createRadialGradient(540, 950, 40, 540, 950, 530);
  burn.addColorStop(0, 'rgba(0,0,0,.66)'); burn.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = burn; ctx.fillRect(0, 550, 1080, 800);
  label('PERSONAL', 285, 220); label('VISUAL', 285, 238); label('STRIVE', 440, 220); label('TRUST', 546, 220);
  label('ALL RIGHTS', 795, 220, 15, 'right'); label(`RESERVED ©${new Date().getFullYear()}`, 795, 238, 15, 'right');
  label('PURPOSE', 285, 292); label('HOPE', 795, 292, 15, 'right');
  label($('note1').value, 297, 687, 16); label($('note2').value, 297, 707, 16); label($('date').value, 297, 730, 16);
  try {
    ctx.font = `900 ${FONT_SIZE}px Thmanyah`; ctx.direction = 'rtl'; ctx.textAlign = 'right';
    const lines = layoutTitle([$('line1').value.trim(), $('line2').value.trim()], t => ctx.measureText(t));
    const key = normalize($('keyword').value.trim()), accent = $('color').value;
    const matches = lines.flatMap(l => l.runs).filter(r => normalize(r.word) === key);
    if (!key || matches.length !== 1) throw new Error('اختر كلمة واحدة مطابقة لكلمة في العبارة لتلوينها.');
    for (const line of lines) for (const run of line.runs) {
      ctx.fillStyle = normalize(run.word) === key ? accent : '#f3eee5';
      ctx.fillText(run.word, run.x, run.baseline);
    }
    ctx.save(); ctx.translate(540, 1096); ctx.scale(1, .16);
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 165);
    glow.addColorStop(0, accent + '66'); glow.addColorStop(1, accent + '00');
    ctx.fillStyle = glow; ctx.fillRect(-170, -170, 340, 340); ctx.restore();
    const rule = ctx.createLinearGradient(380, 0, 700, 0);
    rule.addColorStop(0, accent + '00'); rule.addColorStop(.5, accent); rule.addColorStop(1, accent + '00');
    ctx.fillStyle = rule; ctx.fillRect(380, 1095.5, 320, 1.5);
    const translation = $('translation').value.trim();
    const translated = translation ? wrap('“' + translation + '”') : [];
    if (translated.length > 3) throw new Error('اختصر الترجمة إلى ثلاثة أسطر كحد أقصى.');
    translated.forEach((t, i) => label(t, 540, 1150 + i * 25, 22, 'center', 'Georgia'));
    ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.fillStyle = '#f3eee5'; ctx.font = '16px Arial';
    const attribution = $('author').value.trim(), source = $('source').value.trim();
    for (const [i, value] of [attribution, source].entries()) {
      if (ctx.measureText(value).width > 930) throw new Error('اختصر سطر النسبة أو المصدر ليظهر كاملًا.');
      ctx.fillText(value, 540, 1260 + i * 27);
    }
    status('المعاينة جاهزة — 1080 × 1350'); $('download').disabled = false;
  } catch (error) { status(error.message || 'تعذّر تجهيز النص.'); }
}
function scheduleDraw() {
  if (pending) return; pending = true;
  requestAnimationFrame(() => { pending = false; draw(); });
}
function loadPhoto(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => image.naturalWidth && image.naturalHeight ? resolve(image) : reject(new Error('الصورة غير صالحة.'));
    image.onerror = () => reject(new Error('تعذّر فتح الصورة؛ اختر صورة أخرى.'));
    image.src = src;
  });
}
$('photo').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  if (!file.type.startsWith('image/') || file.size > 20 * 1024 * 1024) { status('اختر صورة بحجم أقل من 20 ميغابايت.'); return; }
  const sequence = ++uploadSequence, url = URL.createObjectURL(file);
  $('download').disabled = true; status('جارٍ فتح الصورة…');
  try { const next = await loadPhoto(url); if (sequence === uploadSequence) { photo = next; draw(); } }
  catch (error) { if (sequence === uploadSequence) status(error.message); }
  finally { URL.revokeObjectURL(url); }
});
for (const id of controls) $(id).addEventListener('input', scheduleDraw);
$('download').addEventListener('click', () => {
  draw(); if ($('download').disabled) return;
  canvas.toBlob(blob => {
    if (!blob) { status('تعذّر تحميل الصورة؛ حاول مرة أخرى.'); return; }
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = 'cinematic-post-1080x1350.png'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
});
const seed = parseSeed(location.hash);
if (seed.text) {
  const lines = splitQuote(seed.text); $('line1').value = lines[0]; $('line2').value = lines[1];
  $('keyword').value = seed.keyword || normalize(lines.join(' ').split(/\s+/).find(w => normalize(w).length > 3) || '');
  $('translation').value = '';
}
for (const [key, value] of Object.entries(seed)) if ($(key)) $(key).value = value;
if (seed.sourceUrl && !seed.source) $('source').value = seed.sourceUrl;
$('date').value = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replaceAll(' ', ',').toUpperCase();
status('جارٍ تحميل الصورة وخط ثمانية…');
Promise.all([document.fonts.load(`900 ${FONT_SIZE}px Thmanyah`, 'كلمة ثمانية'), loadPhoto('./background.jpg')])
  .then(([fonts, image]) => {
    if (!fonts.length) throw new Error('لم يُحمّل خط ثمانية؛ أعد تحميل الصفحة.');
    fontReady = true; if (!photo) photo = image; draw();
  }).catch(error => { status(error.message || 'تعذّر تحميل القالب. أعد تحميل الصفحة.'); $('download').disabled = true; });
