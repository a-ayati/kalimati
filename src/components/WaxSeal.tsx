import React, { useEffect, useRef } from 'react';
import { drawWaxSeal, loadSealFont, SEAL_NAME } from '../lib/waxSeal';

/** طابع شمع أحمر ثلاثي الأبعاد باسم «شعيب» */
export const WaxSeal: React.FC<{ size?: number; light?: boolean; className?: string }> = ({ size = 64, light = false, className = '' }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    // هامش حول الطابع للظل
    const box = Math.round(size * 1.5);
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    canvas.width = box * dpr;
    canvas.height = box * dpr;
    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, box, box);
      drawWaxSeal(ctx, box / 2, box / 2 - size * 0.05, size / 2, { light });
    };
    draw();
    let alive = true;
    loadSealFont().then(() => alive && draw());
    return () => {
      alive = false;
    };
  }, [size, light]);

  const box = Math.round(size * 1.5);
  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={`ختم ${SEAL_NAME}`}
      className={`select-none pointer-events-none ${className}`}
      style={{ width: box, height: box, margin: -(box - size) / 2 }}
    />
  );
};
