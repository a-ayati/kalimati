import React from 'react';
import { SEAL_SRC } from '../lib/waxSeal';

/** ختم الشمع الأحمر بحرف X على كتابات الكاتب — الصورة المعتمدة كما هي */
export const WaxSeal: React.FC<{ size?: number; light?: boolean; className?: string }> = ({ size = 64, light = false, className = '' }) => (
  <img
    src={SEAL_SRC}
    alt="ختم الكاتب"
    width={size}
    height={size}
    loading="lazy"
    decoding="async"
    draggable={false}
    className={`select-none pointer-events-none shrink-0 ${className}`}
    style={{
      width: size,
      height: size,
      filter: light ? 'drop-shadow(0 3px 5px rgba(60,12,8,0.28))' : 'drop-shadow(0 4px 7px rgba(0,0,0,0.55))',
    }}
  />
);
