/**
 * ختم الشمع الأحمر (حرف X): يُرسم بالكود على لوحة (canvas) حتى يكون واحداً في الصفحة وفي بطاقة المشاركة.
 * شمع مطفأ حقيقي: حافة متموّجة، إطار ملفوف سميك، قرص مضغوط بحبل مجدول وحلقة رفيعة، وحرف X بارز في الوسط،
 * مع ملمس حبيبي خفيف وظل تحته. الألوان ثابتة في كل المظاهر، والظل وحده أخف على الخلفيات الفاتحة.
 */

export const SEAL_MARK = 'X';
const MARK_FONT = "Georgia, 'Times New Roman', 'DejaVu Serif', serif";

// مولّد عشوائي ثابت البذرة: نفس الملمس في كل مرة
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** حافة الشمع: فصوص ناعمة غير منتظمة كشمع سال ثم ضُغط */
function blobPath(ctx: CanvasRenderingContext2D, r: number) {
  const n = 64;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k =
      1 +
      0.028 * Math.sin(a * 9 + 0.4) + // تموّج الحافة
      0.018 * Math.sin(a * 4 + 1.9) +
      0.012 * Math.sin(a * 13 + 3.1);
    const x = Math.cos(a) * r * k;
    const y = Math.sin(a) * r * k;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/** عنصر بارز: ظل داكن أسفل يمين، ضوء أعلى يسار، ثم اللون */
function embossed(ctx: CanvasRenderingContext2D, off: number, draw: () => void, fill: string | CanvasGradient) {
  ctx.save();
  ctx.translate(off, off);
  ctx.fillStyle = 'rgba(40, 4, 4, 0.75)';
  ctx.strokeStyle = 'rgba(40, 4, 4, 0.75)';
  draw();
  ctx.restore();
  ctx.save();
  ctx.translate(-off * 0.8, -off * 0.8);
  ctx.fillStyle = 'rgba(230, 140, 125, 0.55)';
  ctx.strokeStyle = 'rgba(230, 140, 125, 0.55)';
  draw();
  ctx.restore();
  ctx.fillStyle = fill;
  ctx.strokeStyle = fill;
  draw();
}

export function drawWaxSeal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  opts: { light?: boolean; rotate?: number } = {}
) {
  const { light = false, rotate = -0.14 } = opts;
  const rand = rng(7);
  const off = Math.max(0.6, r * 0.022);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotate);

  // 1) جسم الشمع وظله
  ctx.save();
  ctx.shadowColor = light ? 'rgba(60, 12, 8, 0.35)' : 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = r * 0.28;
  ctx.shadowOffsetX = r * 0.03;
  ctx.shadowOffsetY = r * 0.12;
  blobPath(ctx, r);
  const body = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r * 1.05);
  body.addColorStop(0, '#a9352f');
  body.addColorStop(0.6, '#8c2622');
  body.addColorStop(1, '#5f1513');
  ctx.fillStyle = body;
  ctx.fill();
  ctx.restore();

  // 2) الإطار الملفوف: حلقة سميكة مضيئة في منتصفها ومعتمة عند طرفيها
  ctx.save();
  blobPath(ctx, r);
  ctx.clip();
  const rimOuter = r * 0.98;
  const rimInner = r * 0.76;
  const torus = ctx.createRadialGradient(0, 0, rimInner, 0, 0, rimOuter);
  torus.addColorStop(0, 'rgba(50, 6, 6, 0.55)');
  torus.addColorStop(0.35, 'rgba(190, 80, 70, 0.28)');
  torus.addColorStop(0.6, 'rgba(160, 55, 48, 0.12)');
  torus.addColorStop(1, 'rgba(40, 5, 5, 0.6)');
  ctx.beginPath();
  ctx.arc(0, 0, rimOuter * 1.05, 0, Math.PI * 2);
  ctx.arc(0, 0, rimInner, 0, Math.PI * 2, true);
  ctx.fillStyle = torus;
  ctx.fill();
  // الضوء على الإطار من أعلى اليسار
  const rimLight = ctx.createLinearGradient(-r, -r, r * 0.6, r * 0.6);
  rimLight.addColorStop(0, 'rgba(255, 190, 175, 0.38)');
  rimLight.addColorStop(0.45, 'rgba(255, 190, 175, 0.0)');
  rimLight.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
  ctx.fillStyle = rimLight;
  ctx.fill();
  ctx.restore();

  // 3) القرص المضغوط: حافته الداخلية معتمة أعلاه ومضيئة أسفله (مقعّر)
  const field = r * 0.74;
  ctx.beginPath();
  ctx.arc(0, 0, field, 0, Math.PI * 2);
  const dish = ctx.createLinearGradient(-field, -field, field, field);
  dish.addColorStop(0, '#7a1f1c');
  dish.addColorStop(0.5, '#8a2622');
  dish.addColorStop(1, '#963029');
  ctx.fillStyle = dish;
  ctx.fill();
  ctx.lineWidth = Math.max(1, r * 0.045);
  const bevel = ctx.createLinearGradient(-field, -field, field, field);
  bevel.addColorStop(0, 'rgba(35, 3, 3, 0.8)');
  bevel.addColorStop(0.5, 'rgba(90, 15, 15, 0.25)');
  bevel.addColorStop(1, 'rgba(225, 130, 115, 0.6)');
  ctx.strokeStyle = bevel;
  ctx.stroke();

  const raised = '#9a2f29';

  // 4) الحبل المجدول: خطوط مائلة قصيرة على دائرة
  const ropeR = r * 0.64;
  const ropeW = r * 0.075;
  const twists = Math.max(36, Math.round(r * 0.9));
  embossed(
    ctx,
    off,
    () => {
      ctx.lineWidth = Math.max(0.7, r * 0.022);
      ctx.lineCap = 'round';
      for (let i = 0; i < twists; i++) {
        const a = (i / twists) * Math.PI * 2;
        const a2 = a + 0.09;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (ropeR - ropeW / 2), Math.sin(a) * (ropeR - ropeW / 2));
        ctx.lineTo(Math.cos(a2) * (ropeR + ropeW / 2), Math.sin(a2) * (ropeR + ropeW / 2));
        ctx.stroke();
      }
    },
    raised
  );

  // حلقة رفيعة داخل الحبل
  embossed(
    ctx,
    off * 0.8,
    () => {
      ctx.lineWidth = Math.max(0.7, r * 0.02);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.54, 0, Math.PI * 2);
      ctx.stroke();
    },
    raised
  );

  // نقطتان على الجانبين
  embossed(
    ctx,
    off * 0.7,
    () => {
      for (const sx of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(sx * r * 0.45, 0, Math.max(0.8, r * 0.028), 0, Math.PI * 2);
        ctx.fill();
      }
    },
    raised
  );

  // 5) حرف X بارز
  const size = r * 0.84;
  ctx.font = `700 ${size}px ${MARK_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const mark = ctx.createLinearGradient(0, -size / 2, 0, size / 2);
  mark.addColorStop(0, '#ad3a33');
  mark.addColorStop(1, '#8e2823');
  embossed(ctx, off * 1.3, () => ctx.fillText(SEAL_MARK, 0, size * 0.04), mark);

  // 6) ملمس الشمع: حبيبات وفقاعات صغيرة جداً
  ctx.save();
  blobPath(ctx, r);
  ctx.clip();
  const specks = Math.round(r * 2.2);
  for (let i = 0; i < specks; i++) {
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand()) * r;
    const s = Math.max(0.35, r * 0.012 * (0.5 + rand()));
    ctx.beginPath();
    ctx.arc(Math.cos(a) * d, Math.sin(a) * d, s, 0, Math.PI * 2);
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255, 200, 190, 0.10)' : 'rgba(30, 0, 0, 0.16)';
    ctx.fill();
  }
  // لمعة عريضة خافتة (الشمع مطفأ)
  const sheen = ctx.createRadialGradient(-r * 0.45, -r * 0.5, 0, -r * 0.45, -r * 0.5, r * 0.6);
  sheen.addColorStop(0, 'rgba(255, 220, 210, 0.16)');
  sheen.addColorStop(1, 'rgba(255, 220, 210, 0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();

  ctx.restore();
}

/** لا يحتاج الختم خطاً خاصاً (حرف X بخط النظام المعتاد)؛ نُبقي الدالة للتوافق */
export function loadSealFont(): Promise<unknown> {
  return Promise.resolve();
}
