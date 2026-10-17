import React from 'react';
import { Language } from '../types';

// Regex for Arabic diacritics (harakat & tashkeel)
export const TASHKEEL_REGEX = /[\u0617-\u061A\u064B-\u0652\u0657-\u065E\u0670]/g;

/**
 * Strips all diacritics/tashkeel from Arabic text for searching and clean plain-text copy.
 */
export function stripTashkeel(text: string): string {
  if (!text) return '';
  return text.replace(TASHKEEL_REGEX, '');
}

/**
 * Determines appropriate accent color for Tashkeel:
 * - Fusha (الفصحى): Deep carmine red (#e05252 / #ef4444)
 * - Algerian Darja (الدارجة الجزائرية): Warm mustard yellow / gold (#f59e0b / #d97706)
 */
export function getTashkeelColor(language: Language, overrideColor?: string): string {
  if (overrideColor && overrideColor !== 'inherit') {
    if (overrideColor === 'red') return '#ef4444';
    if (overrideColor === 'yellow') return '#f59e0b';
    if (overrideColor === 'gold') return '#eab308';
    return overrideColor;
  }
  return language === 'fusha' ? '#e05252' : '#f59e0b';
}

interface ColoredTashkeelProps {
  text: string;
  language: Language;
  showTashkeel?: boolean;
  overrideColor?: string;
  className?: string;
}

/**
 * Renders Arabic text. When showTashkeel is false, strips harakat.
 * In Arabic cursive typesetting, diacritics inherit cursive connection cleanly.
 */
export const FormattedArabicText: React.FC<ColoredTashkeelProps> = ({
  text,
  language,
  showTashkeel = true,
  overrideColor,
  className = '',
}) => {
  if (!showTashkeel) {
    return <span className={className}>{stripTashkeel(text)}</span>;
  }

  // To preserve pristine Arabic ligature connections without font clipping:
  // We apply the language Tashkeel theme class or styled tokenization
  const tashkeelColor = getTashkeelColor(language, overrideColor);

  return (
    <span
      className={`relative inline leading-[inherit] tracking-normal ${className}`}
      style={{
        fontVariantLigatures: 'normal',
      }}
      data-tashkeel-color={tashkeelColor}
    >
      {text}
    </span>
  );
};
