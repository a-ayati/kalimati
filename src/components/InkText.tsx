import React from 'react';
import { stripTashkeel } from '../utils/tashkeel';

/**
 * نص بلونين يعمل في كل المتصفحات: طبقة الحروف (خط بلا تشكيل) وفوقها طبقة التشكيل (خط بلا حروف).
 * النسختان متطابقتا القياسات، فتنطبقان حرفاً بحرف.
 */
export const TwoLayerText: React.FC<{
  text: string;
  letters: string;
  marks: string;
  lettersFont: string;
  marksFont: string;
  showMarks?: boolean;
  inline?: boolean;
}> = ({ text, letters, marks, lettersFont, marksFont, showMarks = true, inline = false }) => {
  if (!showMarks) return <span style={{ color: letters, fontFamily: lettersFont }}>{stripTashkeel(text)}</span>;
  return (
    <span style={{ display: inline ? 'inline-grid' : 'grid' }}>
      <span style={{ gridArea: '1 / 1', color: letters, fontFamily: lettersFont }}>{text}</span>
      <span
        aria-hidden="true"
        style={{ gridArea: '1 / 1', color: marks, fontFamily: marksFont, userSelect: 'none', pointerEvents: 'none' }}
      >
        {text}
      </span>
    </span>
  );
};

/** نص الشعار: حروف فاتحة وتشكيل أحمر بخط الرقعة */
export const InkText: React.FC<{ text: string }> = ({ text }) => (
  <TwoLayerText
    text={text}
    letters="var(--kq-ink, #f3ead8)"
    marks="var(--kq-ink-mark, #e5483b)"
    lettersFont="'KQL-ruqaaink', 'Aref Ruqaa', serif"
    marksFont="'KQM-ruqaaink', serif"
    inline
  />
);
