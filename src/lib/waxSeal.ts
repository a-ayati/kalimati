/**
 * ختم الشمع الأحمر (حرف X): صورة الختم التي اعتمدها صاحب المنصة كما هي (public/seal-x.webp).
 * تُستعمل في الصفحة عنصرَ صورة، وتُرسم على لوحة بطاقة المشاركة.
 */
export const SEAL_SRC = '/seal-x.webp';

let sealImg: HTMLImageElement | null = null;
let sealReady: Promise<HTMLImageElement | null> | null = null;

/** تحميل صورة الختم مرة واحدة قبل الرسم على اللوحة */
export function loadSealImage(): Promise<HTMLImageElement | null> {
  if (!sealReady) {
    sealReady = new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        sealImg = img;
        resolve(img);
      };
      img.onerror = () => resolve(null);
      img.src = SEAL_SRC;
    });
  }
  return sealReady;
}

/** رسم الختم على لوحة: المركز (cx, cy) ونصف القطر r، مع ظل خفيف تحته */
export function drawWaxSeal(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, opts: { light?: boolean } = {}) {
  if (!sealImg) return;
  ctx.save();
  ctx.shadowColor = opts.light ? 'rgba(60, 12, 8, 0.3)' : 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = r * 0.25;
  ctx.shadowOffsetY = r * 0.1;
  ctx.drawImage(sealImg, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();
}
