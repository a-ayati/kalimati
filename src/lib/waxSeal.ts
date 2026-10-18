/**
 * طابع الشمع الأحمر باسم «شعيب»: يُرسم بالكود على لوحة (canvas) حتى يكون واحداً في الصفحة وفي بطاقة المشاركة.
 * الإيهام بالعمق: ظل تحت الشمع، تدرّج ضوئي من الأعلى يميناً، قرص مضغوط إلى الداخل، حروف بارزة، ولمعة.
 * ألوان الشمع ثابتة في كل المظاهر؛ والظل وحده يتكيّف (أخف على الخلفيات الفاتحة).
 */

export const SEAL_NAME = 'شعيب';
export const SEAL_FONT = "'KQL-ruqaaink', 'Aref Ruqaa', serif";

/** حافة الشمع غير المنتظمة: ثابتة دائماً (بذرة ثابتة) حتى لا يتغير شكل الطابع بين مرة وأخرى */
function blobPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const n = 22;
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const wobble =
      1 +
      0.045 * Math.sin(a * 3 + 0.7) +
      0.035 * Math.sin(a * 5 + 2.1) +
      0.03 * Math.sin(a * 7 + 4.2) +
      (i % 4 === 1 ? 0.05 : 0) + // نتوءات الشمع السائل
      (i % 7 === 3 ? 0.06 : 0);
    pts.push([cx + Math.cos(a) * r * wobble, cy + Math.sin(a) * r * wobble]);
  }
  ctx.beginPath();
  const mid = (p: [number, number], q: [number, number]): [number, number] => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  let m = mid(pts[n - 1], pts[0]);
  ctx.moveTo(m[0], m[1]);
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    m = mid(p, pts[(i + 1) % n]);
    ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]);
  }
  ctx.closePath();
}

export function drawWaxSeal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  opts: { light?: boolean; rotate?: number } = {}
) {
  const { light = false, rotate = -0.18 } = opts;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotate);

  // 1) جسم الشمع مع ظل يرفعه عن الورق
  ctx.save();
  ctx.shadowColor = light ? 'rgba(70, 10, 10, 0.32)' : 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = r * 0.32;
  ctx.shadowOffsetX = r * 0.04;
  ctx.shadowOffsetY = r * 0.14;
  blobPath(ctx, 0, 0, r);
  const body = ctx.createRadialGradient(-r * 0.38, -r * 0.42, r * 0.05, 0, 0, r * 1.12);
  body.addColorStop(0, '#f0634f');
  body.addColorStop(0.35, '#c81e22');
  body.addColorStop(0.75, '#9a0f16');
  body.addColorStop(1, '#5e070c');
  ctx.fillStyle = body;
  ctx.fill();
  ctx.restore();

  // حافة الشمع: خط مضيء رفيع من الأعلى وظل من الأسفل
  blobPath(ctx, 0, 0, r);
  const rim = ctx.createLinearGradient(-r, -r, r, r);
  rim.addColorStop(0, 'rgba(255, 170, 150, 0.55)');
  rim.addColorStop(0.5, 'rgba(255, 120, 100, 0.08)');
  rim.addColorStop(1, 'rgba(40, 0, 0, 0.5)');
  ctx.strokeStyle = rim;
  ctx.lineWidth = Math.max(1, r * 0.035);
  ctx.stroke();

  // 2) القرص المضغوط: الضوء معكوس (مقعّر) — مظلم أعلاه ومضيء أسفله
  const inner = r * 0.7;
  ctx.beginPath();
  ctx.arc(0, 0, inner, 0, Math.PI * 2);
  const dish = ctx.createLinearGradient(-inner, -inner, inner, inner);
  dish.addColorStop(0, '#7d0a11');
  dish.addColorStop(0.55, '#a8141b');
  dish.addColorStop(1, '#cf3a33');
  ctx.fillStyle = dish;
  ctx.fill();

  // حافة القرص المشطوفة
  ctx.lineWidth = Math.max(1, r * 0.06);
  const bevel = ctx.createLinearGradient(-inner, -inner, inner, inner);
  bevel.addColorStop(0, 'rgba(40, 0, 0, 0.75)');
  bevel.addColorStop(0.5, 'rgba(120, 10, 15, 0.2)');
  bevel.addColorStop(1, 'rgba(255, 150, 130, 0.65)');
  ctx.strokeStyle = bevel;
  ctx.stroke();

  // حلقة نقاط بارزة داخل القرص
  const ringR = inner * 0.82;
  const dots = 28;
  for (let i = 0; i < dots; i++) {
    const a = (i / dots) * Math.PI * 2;
    const x = Math.cos(a) * ringR;
    const y = Math.sin(a) * ringR;
    const d = Math.max(0.6, r * 0.022);
    ctx.beginPath();
    ctx.arc(x + d * 0.4, y + d * 0.4, d, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(50, 0, 0, 0.55)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, d, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 160, 140, 0.7)';
    ctx.fill();
  }

  // 3) الاسم بارز داخل القرص
  const size = r * 0.66;
  ctx.font = `700 ${size}px ${SEAL_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.direction = 'rtl';
  const ty = r * 0.02;
  const off = Math.max(0.8, r * 0.03);
  ctx.fillStyle = 'rgba(35, 0, 2, 0.85)';
  ctx.fillText(SEAL_NAME, off, ty + off);
  ctx.fillStyle = 'rgba(255, 190, 170, 0.95)';
  ctx.fillText(SEAL_NAME, -off * 0.7, ty - off * 0.7);
  const letters = ctx.createLinearGradient(0, -size / 2, 0, size / 2);
  letters.addColorStop(0, '#f2604f');
  letters.addColorStop(1, '#b8161d');
  ctx.fillStyle = letters;
  ctx.fillText(SEAL_NAME, 0, ty);

  // 4) لمعة الشمع
  ctx.beginPath();
  ctx.ellipse(-r * 0.42, -r * 0.55, r * 0.32, r * 0.12, -0.6, 0, Math.PI * 2);
  const gloss = ctx.createRadialGradient(-r * 0.42, -r * 0.55, 0, -r * 0.42, -r * 0.55, r * 0.32);
  gloss.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
  gloss.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gloss;
  ctx.fill();

  ctx.restore();
}

/** تحميل خط الاسم قبل الرسم */
export function loadSealFont(): Promise<unknown> {
  try {
    return document.fonts.load(`700 40px 'KQL-ruqaaink'`, SEAL_NAME).catch(() => []);
  } catch {
    return Promise.resolve();
  }
}
