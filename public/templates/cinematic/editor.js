import { drawScene, headerLabels, footerLabels } from './composition.mjs?v=safe-1';
import { POST_PRESETS, POST_CATEGORIES, postsForCategory } from './presets.mjs?v=safe-1';
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
  drawScene(ctx, photo);
  const burn = ctx.createRadialGradient(540, 950, 40, 540, 950, 530);
  burn.addColorStop(0, 'rgba(0,0,0,.66)'); burn.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = burn; ctx.fillRect(0, 0, 1080, 1350);
  try {
    for (const args of headerLabels(new Date().getFullYear())) label(...args);
    ctx.font = '16px Arial';
    for (const run of footerLabels([$('note1').value, $('note2').value, $('date').value], $('author').value, $('source').value, text => ctx.measureText(text))) label(run.text, run.x, run.y, 16, run.align);
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
  $('preset-photo').checked = false;
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
function libraryOptions() {
  const current = $('post-preset').value, posts = postsForCategory($('post-category').value);
  $('post-preset').replaceChildren(new Option('اختر بوستًا من المجموعة', ''));
  for (const post of posts) $('post-preset').append(new Option(`${post.category} · ${post.title}`, post.id));
  if (posts.some(post => post.id === current)) $('post-preset').value = current;
  $('post-count').textContent = `${posts.length} / ${POST_PRESETS.length}`;
  $('apply-post').disabled = !$('post-preset').value;
}
for (const category of POST_CATEGORIES) $('post-category').append(new Option(category, category));
$('post-category').addEventListener('change', libraryOptions);
$('post-preset').addEventListener('change', () => { $('apply-post').disabled = !$('post-preset').value; });
$('caption').addEventListener('input', () => { $('copy-caption').disabled = !$('caption').value.trim(); });
$('copy-caption').addEventListener('click', async () => {
  const value = $('caption').value.trim(); if (!value) return;
  try { await navigator.clipboard.writeText(value); $('caption-status').textContent = 'تم نسخ الكابشن.'; }
  catch { $('caption').focus(); $('caption').select(); $('caption-status').textContent = 'تعذّر النسخ التلقائي؛ النص محدّد لنسخه يدويًا.'; }
});
$('apply-post').addEventListener('click', async () => {
  const post = POST_PRESETS.find(item => item.id === $('post-preset').value); if (!post) return;
  const sequence = ++uploadSequence;
  $('line1').value = post.lines[0]; $('line2').value = post.lines[1]; $('keyword').value = post.keyword;
  $('color').value = post.color; $('translation').value = post.translation;
  $('author').value = ''; $('source').value = ''; // These editable suggestions are not attributed quotations.
  $('caption').value = post.caption; $('copy-caption').disabled = false; $('caption-status').textContent = '';
  $('caption-details').open = true;
  $('library-status').textContent = `تم تطبيق «${post.title}». النص والكابشن قابلان للتعديل.`;
  scheduleDraw();
  if ($('preset-photo').checked) {
    try { const image = await loadPhoto(`./backgrounds/${post.background}.jpg`); if (sequence === uploadSequence) { photo = image; draw(); } }
    catch { if (sequence === uploadSequence) $('library-status').textContent = 'تم تطبيق النص؛ تعذّر فتح الخلفية المقترحة. يمكنك رفع صورتك أو إعادة التطبيق.'; }
  }
});
libraryOptions();
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

// Background changes keep the current copy, accent and caption intact.
document.addEventListener('studio:background', async event => {
  const key = event.detail;
  if (!POST_PRESETS.some(post => post.background === key)) return;
  const sequence = ++uploadSequence;
  $('preset-photo').checked = false;
  $('background-status').textContent = 'جارٍ تطبيق الخلفية…';
  try {
    const image = await loadPhoto(`./backgrounds/${key}.jpg`);
    if (sequence !== uploadSequence) return;
    photo = image; draw(); $('background-status').textContent = 'تم تطبيق الخلفية.';
    document.dispatchEvent(new CustomEvent('studio:background-ready', { detail: key }));
  } catch (error) {
    if (sequence === uploadSequence) $('background-status').textContent = error.message;
  }
});
