import React from 'react';
import { stripTashkeel } from '../utils/tashkeel';

/**
 * نص بلونين يعمل في كل المتصفحات: طبقة كاملة بلون التشكيل، وفوقها الحروف وحدها بلون الحروف.
 * (بديل الخطوط الملوّنة التي لا يرسمها Safari على الآيفون)
 */
export const InkText: React.FC<{ text: string; letters?: string; marks?: string }> = ({
  text,
  letters = '#f3ead8',
  marks = '#e5483b',
}) => (
  <span style={{ display: 'inline-grid' }}>
    <span style={{ gridArea: '1 / 1', color: marks }}>{text}</span>
    <span aria-hidden="true" style={{ gridArea: '1 / 1', color: letters, userSelect: 'none', pointerEvents: 'none' }}>
      {stripTashkeel(text)}
    </span>
  </span>
);
