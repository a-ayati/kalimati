import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useKalimati } from '../context/KalimatiContext';
import { quoteByline } from '../utils/dialects';
import { QuoteText } from './QuoteText';
import { Quote } from '../types';
import { Moon, Sparkles, X, Clock, Eye } from 'lucide-react';

interface ZenModeProps {
  // If active is controlled globally
  isOpen: boolean;
  onClose: () => void;
  previewQuote?: Quote;
}

export const ZenMode: React.FC<ZenModeProps> = ({ isOpen, onClose, previewQuote }) => {
  const { quotes, savedItems, zenSettings, customStyle, author } = useKalimati();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');
  const [quoteIndex, setQuoteIndex] = useState(0);
  const wakeLockRef = useRef<any>(null);

  // Pool of candidate quotes for Zen Mode
  const candidateQuotes: Quote[] = React.useMemo(() => {
    if (previewQuote) return [previewQuote];

    if (zenSettings.quoteSource === 'saved' && savedItems.length > 0) {
      const savedQuotes = quotes.filter((q) => savedItems.some((s) => s.quoteId === q.id));
      if (savedQuotes.length > 0) return savedQuotes;
    }

    if (zenSettings.quoteSource === 'short') {
      const shortList = quotes.filter((q) => q.text.length < 90);
      if (shortList.length > 0) return shortList;
    }

    // Default to published quotes or today's
    return quotes.filter((q) => q.status === 'published');
  }, [previewQuote, zenSettings.quoteSource, savedItems, quotes]);

  const activeQuote = candidateQuotes[quoteIndex % Math.max(1, candidateQuotes.length)] || quotes[0];

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('ar-DZ', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setCurrentDateStr(
        now.toLocaleDateString('ar-DZ', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Screen Wake Lock API
  useEffect(() => {
    if (!isOpen || !zenSettings.keepAwake) return;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && (navigator as any).wakeLock) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.warn('Wake Lock error:', err);
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [isOpen, zenSettings.keepAwake]);

  // Cycle through quotes if displayDuration is set (e.g. 10s, 60s)
  useEffect(() => {
    if (!isOpen || zenSettings.displayDurationSeconds === 0) return;

    const cycleInterval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % candidateQuotes.length);
    }, zenSettings.displayDurationSeconds * 1000);

    return () => clearInterval(cycleInterval);
  }, [isOpen, zenSettings.displayDurationSeconds, candidateQuotes.length]);

  // Dismiss on any keyboard stroke or tap
  useEffect(() => {
    if (!isOpen) return;

    const handleInteraction = (e: Event) => {
      // Don't close immediately if clicking the close icon specifically
      onClose();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleInteraction);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const fontClass = 
    customStyle.fontId === 'ruqaa-ink' ? 'font-ruqaa-ink' :
    customStyle.fontId === 'rakkas' ? 'font-rakkas' :
    customStyle.fontId === 'kufi-ink' ? 'font-kufi-ink' :
    customStyle.fontId === 'ruqaa' ? 'font-ruqaa' :
    customStyle.fontId === 'amiri' ? 'font-amiri' :
    customStyle.fontId === 'kufi' ? 'font-kufi' :
    customStyle.fontId === 'naskh' ? 'font-naskh' : 'font-cairo';

  // Animation class
  const animClass =
    zenSettings.animation === 'drift'
      ? 'animate-pulse duration-1000'
      : zenSettings.animation === 'fade'
      ? 'animate-in fade-in duration-1000'
      : '';

  return (
    <div 
      onClick={onClose}
      className="keep-tone fixed inset-0 z-50 bg-[#0a0a0c] text-stone-200 flex flex-col justify-between items-center p-6 sm:p-12 cursor-pointer select-none overflow-hidden"
    >
      {/* Background radial ambient glow */}
      <div className="absolute inset-0 bg-radial from-amber-600/5 via-transparent to-black pointer-events-none" />

      {/* Top bar: Clock & Date */}
      <div className="w-full max-w-4xl flex items-center justify-between text-xs text-stone-500 z-10">
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-amber-500/60" />
          <span className="font-medium text-stone-400">لحظة سكون — انقر في أي مكان للعودة</span>
        </div>

        {zenSettings.showClock && (
          <div className="flex items-center gap-2.5 font-cairo text-stone-400 font-medium">
            <span className="tabular-nums">{currentTime}</span>
            {zenSettings.showDate && <span className="hidden sm:inline text-stone-500">• {currentDateStr}</span>}
          </div>
        )}
      </div>

      {/* Center: Contemplative Quote */}
      <div className={`relative max-w-3xl text-center px-4 my-auto z-10 transition-all ${animClass}`}>
        <div className="text-amber-500/30 text-2xl mb-6">❦</div>
        
        <QuoteText
          quote={activeQuote}
          style={{ ...customStyle, themeId: 'dark' }}
          fontSize={Math.max(30, customStyle.fontSize + 4)}
          className="text-white drop-shadow-sm"
        />

        <div className="mt-8 flex items-center justify-center gap-3 text-amber-500/40">
          <span className="w-16 h-[1px] bg-amber-500/20" />
          <span className="text-sm">✦</span>
          <span className="w-16 h-[1px] bg-amber-500/20" />
        </div>

        <div className="mt-5 text-sm sm:text-base text-stone-300 font-cairo font-medium tracking-normal">
          {activeQuote.author ? quoteByline(activeQuote) : `بقلم: ${author.name}`}
        </div>
      </div>

      {/* Bottom Footer: Minimal brand watermark */}
      <div className="w-full max-w-4xl flex items-center justify-between text-xs text-stone-400 font-cairo z-10">
        <div className="flex items-center gap-1.5 text-stone-400 font-cairo">
          <Sparkles className="w-3.5 h-3.5 text-amber-500/60" />
          <span>كَلِمَاتِي — كَلِمَةٌ تَصِلُ فِي وَقْتِهَا</span>
        </div>

        <div className="flex items-center gap-1 text-stone-400 font-cairo">
          <Eye className="w-3.5 h-3.5" />
          <span>انقر أو حرّك الفأرة للاستئناف</span>
        </div>
      </div>
    </div>
  );
};
