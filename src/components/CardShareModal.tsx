import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Quote, ThemeId, FontId } from '../types';
import { useKalimati } from '../context/KalimatiContext';
import { quoteUrl, siteHost } from '../lib/links';
import { stripTashkeel } from '../utils/tashkeel';
import { bylineSuffix, isFolk, isWriterQuote, pickDialect, quoteByline } from '../utils/dialects';
import { quoteColors } from './QuoteText';
import { drawWaxSeal, loadSealImage } from '../lib/waxSeal';
import { dialectFontOf, dialectRatio, ensureCardFonts, quoteFont } from '../lib/quoteFonts';
import { 
  X, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  Sparkles, 
  Gift, 
  Maximize2,
  CheckCircle2
} from 'lucide-react';

/** الخطوط المتاحة في بطاقة المشاركة */
const CARD_FONTS: { id: FontId; label: string }[] = [
  { id: 'ruqaa-ink', label: 'حبر الرقعة' },
  { id: 'ruqaa', label: 'الرقعة الفني' },
  { id: 'amiri', label: 'النسخ الأميري' },
  { id: 'kufi', label: 'الكوفي الحديث' },
  { id: 'naskh', label: 'النسخ المعاصر' },
  { id: 'cairo', label: 'الخط العصري' },
];

interface CardShareModalProps {
  quote: Quote;
  onClose: () => void;
}

type CardFormat = 'story' | 'square' | 'portrait';

interface FormatConfig {
  label: string;
  sub: string;
  width: number;
  height: number;
  aspectClass: string;
}

const FORMATS: Record<CardFormat, FormatConfig> = {
  story: {
    label: 'ستوري Story',
    sub: '1080 × 1920 (9:16)',
    width: 1080,
    height: 1920,
    aspectClass: 'aspect-[9/16] max-h-[520px]',
  },
  square: {
    label: 'مربع Square',
    sub: '1080 × 1080 (1:1)',
    width: 1080,
    height: 1080,
    aspectClass: 'aspect-square max-h-[440px]',
  },
  portrait: {
    label: 'عمودي Portrait',
    sub: '1080 × 1350 (4:5)',
    width: 1080,
    height: 1350,
    aspectClass: 'aspect-[4/5] max-h-[480px]',
  },
};


export const CardShareModal: React.FC<CardShareModalProps> = ({ quote, onClose }) => {
  const { author, customStyle, preferredDialect } = useKalimati();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [selectedFormat, setSelectedFormat] = useState<CardFormat>('story');
  // حجم الكتابة في التصميم (نسبة من الحجم التلقائي)
  const [textScale, setTextScale] = useState(1);
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(customStyle.themeId);
  const [selectedFont, setSelectedFont] = useState<FontId>(customStyle.fontId);
  const [selectedDialectFont, setSelectedDialectFont] = useState<FontId>(dialectFontOf(customStyle));
  const [showSavedStamp, setShowSavedStamp] = useState(true);
  const [isGiftMode, setIsGiftMode] = useState(false);
  const [giftRecipient, setGiftRecipient] = useState('');
  const [giftPersonalMessage, setGiftPersonalMessage] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);

  // Canvas drawing routine
  const renderCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config = FORMATS[selectedFormat];
    canvas.width = config.width;
    canvas.height = config.height;

    // Theme background colors
    let bgColor = '#0d0e11';
    let textColor = '#f9fafb';
    let borderColor = '#d97706'; // Mustard / gold
    let subtleColor = '#9ca3af';

    if (selectedTheme === 'vintage') {
      bgColor = '#f7f2e7';
      textColor = '#28211b';
      borderColor = '#8c592b';
      subtleColor = '#6b584a';
    } else if (selectedTheme === 'white') {
      bgColor = '#ffffff';
      textColor = '#111827';
      borderColor = '#4b5563';
      subtleColor = '#6b7280';
    }

    // Background fill
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, config.width, config.height);

    // Subtle grain texture simulation on canvas
    ctx.fillStyle = selectedTheme === 'white' ? 'rgba(0,0,0,0.015)' : 'rgba(255,255,255,0.018)';
    for (let x = 0; x < config.width; x += 14) {
      for (let y = 0; y < config.height; y += 14) {
        if ((x + y) % 28 === 0) {
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }

    // Outer ornamental double border
    const margin = 50;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(margin, margin, config.width - margin * 2, config.height - margin * 2);

    // Inner fine border
    ctx.strokeStyle = selectedTheme === 'dark' ? 'rgba(217, 119, 6, 0.35)' : 'rgba(100, 100, 100, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(margin + 16, margin + 16, config.width - (margin + 16) * 2, config.height - (margin + 16) * 2);

    // Corner diamond accents
    const corners = [
      [margin + 8, margin + 8],
      [config.width - margin - 8, margin + 8],
      [margin + 8, config.height - margin - 8],
      [config.width - margin - 8, config.height - margin - 8],
    ];
    ctx.fillStyle = borderColor;
    corners.forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Top Header: Brand Name «كلماتي»
    // «كلماتي» بمخطوطة الشعار: حروف حبر الرقعة وتشكيل أحمر فوقها
    ctx.textAlign = 'center';
    ctx.direction = 'rtl';
    const logoLight = selectedTheme !== 'dark';
    ctx.font = `700 72px "KQL-ruqaaink", serif`;
    ctx.fillStyle = logoLight ? '#1a1410' : '#f3ead8';
    ctx.fillText('كَلِمَاتِي', config.width / 2, margin + 102);
    ctx.font = `700 72px "KQM-ruqaaink", serif`;
    ctx.fillStyle = logoLight ? '#c62828' : '#e5483b';
    ctx.fillText('كَلِمَاتِي', config.width / 2, margin + 102);

    ctx.font = '500 20px "Cairo", sans-serif';
    ctx.fillStyle = subtleColor;
    ctx.fillText('«كَلِمَةٌ تَصِلُ فِي وَقْتِهَا»', config.width / 2, margin + 140);

    // Divider
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(config.width / 2 - 80, margin + 172);
    ctx.lineTo(config.width / 2 + 80, margin + 172);
    ctx.stroke();

    // Gift mode header if enabled
    let contentTop = margin + 260;
    if (isGiftMode) {
      ctx.fillStyle = selectedTheme === 'dark' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(200, 150, 50, 0.15)';
      const giftBoxW = config.width - 240;
      ctx.fillRect(120, margin + 190, giftBoxW, 90);
      ctx.strokeStyle = borderColor;
      ctx.strokeRect(120, margin + 190, giftBoxW, 90);

      ctx.fillStyle = textColor;
      ctx.font = 'bold 24px "Cairo", sans-serif';
      const toWhom = giftRecipient.trim() ? `إلى: ${giftRecipient}` : 'حِينَ قَرَأْتُهَا، تَذَكَّرْتُكَ..';
      ctx.fillText(toWhom, config.width / 2, margin + 235);

      if (giftPersonalMessage.trim()) {
        ctx.font = 'italic 19px "Cairo", sans-serif';
        ctx.fillStyle = subtleColor;
        ctx.fillText(`"${giftPersonalMessage}"`, config.width / 2, margin + 265);
      }
      contentTop = margin + 350;
    }

    // طبقتان متطابقتا القياسات: خط الحروف ثم خط التشكيل، كلٌّ بلونه
    const qf = quoteFont(selectedFont);
    const qd = quoteFont(selectedDialectFont);
    const fushaFamily = `"KQL-${qf.fam}", ${qf.fallback}`;
    const darjaFamily = `"KQL-${qd.fam}", ${qd.fallback}`;
    const marksFamily = `"KQM-${qf.fam}", ${qf.fallback}`;
    const darjaMarksFamily = `"KQM-${qd.fam}", ${qd.fallback}`;

    const world = quote.language === 'en' || quote.language === 'fr';
    const fushaText = quote.language === 'fusha' || world ? quote.text : null;
    const darjaText = quote.language === 'darja' ? quote.text : pickDialect(quote, preferredDialect)?.variant.text || null;
    const maxWidth = config.width - 240;

    const wrap = (text: string, font: string): string[] => {
      ctx.font = font;
      const words = text.split(' ');
      const out: string[] = [];
      let line = words[0];
      for (let i = 1; i < words.length; i++) {
        const test = line + ' ' + words[i];
        if (ctx.measureText(test).width > maxWidth) {
          out.push(line);
          line = words[i];
        } else {
          line = test;
        }
      }
      out.push(line);
      return out;
    };

    // حجم تلقائي حسب طول النص
    const baseLen = (fushaText || darjaText || '').length;
    let autoSize = config.height > 1500 ? 64 : 56;
    if (baseLen > 80) autoSize -= 8;
    if (baseLen > 140) autoSize -= 10;
    // حجم الكتابة الذي اختاره المستخدم، مع تصغير تلقائي إن لم يتّسع المكان
    const available = config.height - 2 * margin - 470;
    let fushaSize = 0, darjaSize = 0, fushaFont = '', darjaFont = '';
    let fushaLines: string[] = [], darjaLines: string[] = [];
    let fushaLH = 0, darjaLH = 0, gap = 0, totalTextHeight = 0;
    for (let size = Math.round(autoSize * textScale); ; size -= 2) {
      fushaSize = size;
      darjaSize = fushaText ? Math.round(size * dialectRatio(customStyle)) : size;
      fushaFont = world ? `italic ${fushaSize}px Georgia, serif` : `${qf.fusha} ${fushaSize}px ${fushaFamily}`;
      darjaFont = `${qd.dialect} ${darjaSize}px ${darjaFamily}`;
      fushaLines = fushaText ? wrap(fushaText, fushaFont) : [];
      darjaLines = darjaText ? wrap(darjaText, darjaFont) : [];
      fushaLH = fushaSize * 1.9;
      darjaLH = darjaSize * 1.9;
      gap = fushaLines.length && darjaLines.length ? 90 : 0;
      totalTextHeight = fushaLines.length * fushaLH + gap + darjaLines.length * darjaLH;
      if (totalTextHeight <= available || size <= 24) break;
    }
    let startY = (config.height - totalTextHeight) / 2 + fushaSize * 0.6;
    if (isGiftMode) startY = Math.max(startY, contentTop + 60);

    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    let y = startY;

    // نفس ألوان المقولة في الصفحة: تتبع المظهر وحده، أياً كان الخط
    const palette = quoteColors({ themeId: selectedTheme, tashkeelColor: customStyle.tashkeelColor });
    // الحروف بخط L ثم التشكيل بخط M فوقها — نمرّر الخطين صراحةً (المتصفح يعيد كتابة ctx.font بصيغته)
    const drawTwoTone = (line: string, letters: string, marks: string, atY: number, lettersFont: string, marksFont: string) => {
      ctx.font = lettersFont;
      ctx.fillStyle = letters;
      ctx.fillText(line, config.width / 2, atY);
      ctx.font = marksFont;
      ctx.fillStyle = marks;
      ctx.fillText(line, config.width / 2, atY);
      ctx.font = lettersFont;
    };
    const fushaMarksFont = `${qf.fusha} ${fushaSize}px ${marksFamily}`;
    const darjaMarksFont = `${qd.dialect} ${darjaSize}px ${darjaMarksFamily}`;

    fushaLines.forEach((line) => {
      ctx.font = fushaFont;
      if (world) { ctx.fillStyle = palette.fushaLetters; ctx.fillText(line, config.width / 2, y); }
      else drawTwoTone(line, palette.fushaLetters, palette.fushaMarks, y, fushaFont, fushaMarksFont);
      y += fushaLH;
    });

    if (gap) {
      // فاصل متموّج بين الصيغتين
      const midY = y - fushaLH + fushaSize * 0.55 + gap / 2;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(config.width / 2 - 170, midY);
      ctx.bezierCurveTo(config.width / 2 - 90, midY - 6, config.width / 2 - 40, midY + 6, config.width / 2, midY);
      ctx.bezierCurveTo(config.width / 2 + 40, midY - 6, config.width / 2 + 90, midY + 6, config.width / 2 + 170, midY);
      ctx.stroke();
      y += gap - fushaLH + fushaLH * 0.9;
    }

    darjaLines.forEach((line) => {
      ctx.font = darjaFont;
      drawTwoTone(line, palette.dialectLetters, palette.dialectMarks, y, darjaFont, darjaMarksFont);
      y += darjaLH;
    });
    const textBottom = y;

    // Stamp: «وصلتني في وقتها»
    if (showSavedStamp) {
      const stampY = textBottom + 20;
      ctx.font = 'bold 22px "Cairo", sans-serif';
      ctx.fillStyle = selectedTheme === 'dark' ? '#fb7185' : '#e11d48';
      ctx.fillText('♥ وَصَلَتْنِي فِي وَقْتِهَا', config.width / 2, stampY);
    }

    ctx.direction = 'rtl';
    // Bottom Footer: Author attribution & web link
    const footerY = config.height - margin - 80;
    // الأمثال تُنسب إلى التراث؛ خواطر الكاتب بلا اسم: الختم في الوسط مكان التوقيع
    const byline = quoteByline(quote);
    if (byline) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(config.width / 2 - 100, footerY - 40);
      ctx.lineTo(config.width / 2 + 100, footerY - 40);
      ctx.stroke();
      ctx.fillStyle = textColor;
      ctx.font = 'bold 26px "Cairo", sans-serif';
      ctx.fillText(byline, config.width / 2, footerY);
    }

    ctx.fillStyle = subtleColor;
    ctx.font = '18px "Cairo", sans-serif';
    ctx.fillText(siteHost(), config.width / 2, footerY + 36);

    // ختم الشمع باسم الكاتب في الزاوية السفلية كرسالة مختومة
    if (isWriterQuote(quote)) drawWaxSeal(ctx, config.width / 2, footerY - 52, 64, { light: selectedTheme !== 'dark' });
  }, [quote, selectedFormat, selectedTheme, selectedFont, showSavedStamp, isGiftMode, giftRecipient, giftPersonalMessage, author, preferredDialect, customStyle.tashkeelColor, selectedDialectFont, customStyle.fontSize, customStyle.dialectFontSize, textScale]);

  useEffect(() => {
    renderCanvas();
    // الرسم على اللوحة لا ينتظر الخطوط؛ نحمّلها ثم نعيد الرسم حتى لا تظهر البطاقة بخط بديل
    let cancelled = false;
    const sample = 'مَا لِي أُبَالِي';
    Promise.all([ensureCardFonts(selectedFont), ensureCardFonts(selectedDialectFont), ensureCardFonts('ruqaa-ink'), loadSealImage(), document.fonts.load('bold 26px "Cairo"', sample).catch(() => [])]).then(() => {
      if (!cancelled) renderCanvas();
    });
    return () => {
      cancelled = true;
    };
  }, [renderCanvas, selectedFont, selectedDialectFont]);

  // Handle Download PNG
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `kalimati-${quote.slug}-${selectedFormat}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  };

  // Handle Web Share
  const handleShare = async () => {
    setIsGenerating(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      if (navigator.share) {
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File([blob], `kalimati-${quote.slug}.png`, { type: 'image/png' });
          try {
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: 'كلماتي — كلمة تصل في وقتها',
                text: `${stripTashkeel(quote.text)}${pickDialect(quote, preferredDialect) ? '\n' + stripTashkeel(pickDialect(quote, preferredDialect)!.variant.text) : ''}${bylineSuffix(quote)}\n\nمنصة كلماتي: ${quoteUrl(quote)}`,
                files: [file],
              });
            } else {
              await navigator.share({
                title: 'كلماتي — كلمة تصل في وقتها',
                text: `${stripTashkeel(quote.text)}${bylineSuffix(quote)}`,
                url: quoteUrl(quote),
              });
            }
          } catch {
            // User cancelled share
          }
        }, 'image/png');
      } else {
        handleDownload();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy Image to Clipboard
  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2000);
      }, 'image/png');
    } catch {
      handleDownload();
    }
  };

  // Copy Link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(quoteUrl(quote));
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#141518] border border-amber-500/30 rounded-3xl shadow-2xl p-4 sm:p-7 text-right max-h-[92vh] flex flex-col my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">بطاقات المشاركة الأصلية</h2>
              <p className="text-xs text-stone-400">صمّم بطاقة بدقة عالية للمشاركة في ستوري إنستغرام والمنشورات</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left Preview Canvas, Right Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-4 overflow-y-auto pr-1">
          
          {/* Controls Column (7 cols) */}
          <div className="lg:col-span-7 space-y-5 order-2 lg:order-1 text-xs">
            
            {/* Format selection (Story, Square, Portrait) */}
            <div>
              <label className="block text-xs font-semibold text-amber-400 mb-2">مقاس البطاقة (Aspect Ratio):</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(FORMATS) as CardFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setSelectedFormat(fmt)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedFormat === fmt
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500 font-bold shadow-xs'
                        : 'bg-white/5 text-stone-300 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="font-semibold text-[13px]">{FORMATS[fmt].label}</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">{FORMATS[fmt].sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme selection */}
            <div>
              <label className="block text-xs font-semibold text-amber-400 mb-2">مظهر البطاقة:</label>
              <div className="keep-tone grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedTheme('dark')}
                  className={`p-2 rounded-xl border text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    selectedTheme === 'dark' ? 'border-amber-400 bg-amber-500/20 text-white font-bold' : 'border-white/10 bg-[#0d0e11] text-stone-300'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-stone-900 border border-amber-500" />
                  <span>الأسود والخردلي</span>
                </button>
                <button
                  onClick={() => setSelectedTheme('vintage')}
                  className={`p-2 rounded-xl border text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    selectedTheme === 'vintage' ? 'border-amber-700 bg-amber-900/30 text-amber-200 font-bold' : 'border-white/10 bg-[#f7f2e7] text-stone-900'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-[#f7f2e7] border border-amber-800" />
                  <span>الورق العتيق</span>
                </button>
                <button
                  onClick={() => setSelectedTheme('white')}
                  className={`p-2 rounded-xl border text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    selectedTheme === 'white' ? 'border-stone-400 bg-white/20 text-white font-bold' : 'border-white/10 bg-white text-stone-900'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-white border border-stone-400" />
                  <span>الأبيض البسيط</span>
                </button>
              </div>
            </div>

            {/* Font selection: الفصحى واللهجة كلٌّ بخطه */}
            {([
              { label: 'خط الفصحى:', value: selectedFont, set: setSelectedFont },
              { label: 'خط اللهجة:', value: selectedDialectFont, set: setSelectedDialectFont },
            ] as const).map((row) => (
              <div key={row.label}>
                <label className="block text-xs font-semibold text-amber-400 mb-2">{row.label}</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {CARD_FONTS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => row.set(item.id)}
                      className={`py-1.5 px-2 rounded-lg border text-xs transition-all cursor-pointer ${
                        row.value === item.id
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500 font-semibold'
                          : 'bg-white/5 text-stone-400 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* حجم الكتابة في التصميم */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="card-text-scale" className="text-xs font-semibold text-amber-400">حجم الكتابة:</label>
                <span className="text-xs font-bold text-stone-200 tabular-nums">{Math.round(textScale * 100)}%</span>
              </div>
              <input
                id="card-text-scale"
                type="range"
                min={0.6}
                max={1.6}
                step={0.05}
                value={textScale}
                onChange={(e) => setTextScale(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-500 mt-1">
                <span>أصغر</span>
                <button type="button" onClick={() => setTextScale(1)} className="underline cursor-pointer">الحجم التلقائي</button>
                <span>أكبر</span>
              </div>
            </div>

            {/* Stamp toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <div>
                <div className="font-semibold text-stone-200">إظهار ختم «وصلتني في وقتها»</div>
                <div className="text-[11px] text-stone-400">إضافة بصمة وجدانية تعبّر عن وصول الكلمة لقلبك</div>
              </div>
              <input
                type="checkbox"
                checked={showSavedStamp}
                onChange={(e) => setShowSavedStamp(e.target.checked)}
                className="w-4 h-4 accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Future sneak-peek: «حين قرأتها، تذكّرتك» (Gift dedication mode) */}
            <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <Gift className="w-4 h-4" />
                  <span>إهداء: «حين قرأتها، تذكّرتك»</span>
                </div>
                <input
                  type="checkbox"
                  checked={isGiftMode}
                  onChange={(e) => setIsGiftMode(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </div>
              {isGiftMode && (
                <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                  <input
                    type="text"
                    value={giftRecipient}
                    onChange={(e) => setGiftRecipient(e.target.value)}
                    placeholder="اسم الشخص المهدى إليه (مثال: صديقي العزيز)"
                    className="w-full p-2 rounded-lg bg-black/40 border border-white/10 text-stone-200 placeholder:text-stone-500 text-xs focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    value={giftPersonalMessage}
                    onChange={(e) => setGiftPersonalMessage(e.target.value)}
                    placeholder="رسالة شخصية قصيرة مرفقة في البطاقة"
                    className="w-full p-2 rounded-lg bg-black/40 border border-white/10 text-stone-200 placeholder:text-stone-500 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>

          </div>

          {/* Canvas Live Preview Column (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center order-1 lg:order-2 bg-black/40 p-3 rounded-2xl border border-white/10">
            <div className="text-[11px] text-stone-400 mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>معاينة حية للبطاقة النهائية</span>
            </div>
            
            <div className={`w-full flex items-center justify-center overflow-hidden rounded-xl shadow-2xl ${FORMATS[selectedFormat].aspectClass}`}>
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full object-contain rounded-lg border border-amber-500/20"
              />
            </div>
          </div>

        </div>

        {/* Modal Action Buttons Footer */}
        <div className="flex items-center justify-between gap-2 pt-4 border-t border-white/10 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs bg-white/5 hover:bg-white/10 text-stone-300 border border-white/10 cursor-pointer"
              title="نسخ الرابط المباشر"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'تم نسخ الرابط' : 'نسخ الرابط'}</span>
            </button>

            <button
              onClick={handleCopyImage}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs bg-white/5 hover:bg-white/10 text-stone-300 border border-white/10 cursor-pointer"
              title="نسخ الصورة للحافظة"
            >
              {copiedImage ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedImage ? 'تم نسخ الصورة' : 'نسخ الصورة'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>تنزيل البطاقة (PNG)</span>
            </button>

            <button
              onClick={handleShare}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>مشاركة بالجهاز</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
