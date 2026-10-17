import React from 'react';

/**
 * نص الشعار: الحروف بلون النص والتشكيل بالأحمر — من خط بلونين في طبقة واحدة
 * (الألوان معرّفة في الصنف logo-ink بملف index.css).
 */
export const InkText: React.FC<{ text: string }> = ({ text }) => <>{text}</>;
