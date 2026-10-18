import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useKalimati } from '../context/KalimatiContext';
import { QuoteText } from '../components/QuoteText';
import { InkText } from '../components/InkText';
import { isDialectId, quoteByline } from '../utils/dialects';
import { useZenQuote } from '../hooks/useZenQuote';
import { DialectId, Quote } from '../types';

/**
 * شاشة السكون المستقلة: /zen
 * تُستعمل كشاشة توقف للحاسوب (WebViewScreenSaver على Mac) أو كإطار على الهاتف أثناء الشحن.
 * بلا قوائم ولا أزرار: مقولة كبيرة تتبدّل بهدوء، مع الساعة والتاريخ.
 *
 * خيارات الرابط:
 *   ?every=30        مدة كل مقولة بالثواني (10–600)
 *   ?dialect=eg      اللهجة تحت الفصحى (dz, ma, tn, eg, gulf, sham) أو none لإخفائها
 *   ?clock=0         إخفاء الساعة
 */

function readParams() {
  const p = new URLSearchParams(window.location.search);
  const every = Math.min(600, Math.max(10, Number(p.get('every')) || 30));
  const d = p.get('dialect');
  const dialect: DialectId | 'none' | null = d === 'none' ? 'none' : isDialectId(d) ? d : null;
  return { every, dialect, clock: p.get('clock') !== '0' };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function useViewport() {
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return vp;
}

export const ScreenSaverView: React.FC = () => {
  const { quotes, customStyle, preferredDialect } = useKalimati();
  const [params] = useState(readParams);
  const { w, h } = useViewport();
  const [now, setNow] = useState(new Date());
  const [index, setIndex] = useState(0);
  const [showExit, setShowExit] = useState(false);
  const exitTimer = useRef<number | undefined>(undefined);

  const published = useMemo(() => quotes.filter(q => q.status === 'published'), [quotes]);
  const quote = useZenQuote(published, 'all', true, params.every);
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  // إبقاء الشاشة مضاءة (للهاتف أثناء الشحن)
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const request = async () => {
      try {
        const wl = (navigator as unknown as { wakeLock?: { request: (t: 'screen') => Promise<typeof lock> } }).wakeLock;
        if (wl && document.visibilityState === 'visible') lock = await wl.request('screen');
      } catch {
        // غير مدعوم أو مرفوض — لا بأس
      }
    };
    request();
    const onVis = () => document.visibilityState === 'visible' && request();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      lock?.release().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    document.title = 'لحظة سكون — كلماتي';
  }, []);

  // لمسة على الهاتف تُظهر زر الخروج لثوانٍ
  const onTap = () => {
    setShowExit(true);
    window.clearTimeout(exitTimer.current);
    exitTimer.current = window.setTimeout(() => setShowExit(false), 3500);
  };

  // الحجم الأقصى حسب الشاشة، ثم يُصغَّر تلقائياً حتى تتسع المقولة كاملة في مساحتها
  const maxFont = Math.round(Math.max(26, Math.min(w * 0.05, h * 0.075, 76)));
  const [fit, setFit] = useState(maxFont);
  const stageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const fontSize = Math.min(fit, maxFont);
  const style = { ...customStyle, themeId: 'dark' as const, showTashkeel: true, lineHeight: 2 };
  const dialect = params.dialect === 'none' ? undefined : params.dialect ?? preferredDialect;
  const shownQuote =
    quote && params.dialect === 'none' ? { ...quote, dialects: undefined, darja: undefined } : quote;

  // عند تغيّر القول أو حجم الشاشة: نبدأ من الحجم الأقصى ثم نقيس
  useLayoutEffect(() => {
    setFit(maxFont);
  }, [shownQuote?.id, index, maxFont]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const content = contentRef.current;
    if (!stage || !content) return;
    const avail = stage.clientHeight * 0.94;
    const used = content.scrollHeight;
    if (used > avail && fit > 18) {
      // تصغير يتناسب مع الفائض (المساحة تتغير مع مربع الحجم تقريباً)
      setFit((f) => Math.max(18, Math.floor(f * Math.min(0.95, Math.sqrt(avail / used)))));
    }
  });

  const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('ar-DZ-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div
      className="keep-tone fixed inset-0 bg-[#0b0b0d] text-[#f3ead8] overflow-hidden select-none"
      style={{ cursor: showExit ? 'default' : 'none' }}
      onClick={onTap}
      dir="rtl"
    >
      {/* توهج خافت يتنفس ببطء */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(201,162,39,0.10), transparent 60%)' }}
        animate={{ opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative h-full flex flex-col">
      {params.clock && (
        <div className="shrink-0 flex flex-col items-center pt-[5vh] pb-[2vh] gap-1 pointer-events-none">
          <div className="font-cairo font-light tabular-nums text-[#f3ead8]/85" style={{ fontSize: Math.max(34, Math.min(w, h) * 0.075) }} dir="ltr">
            {time}
          </div>
          <div className="font-cairo text-[#c9a227]/80" style={{ fontSize: Math.max(13, Math.min(w, h) * 0.022) }}>
            {date}
          </div>
        </div>
      )}

      {/* مساحة المقولة: بين الساعة والشعار، ولا تتجاوزهما أبداً */}
      <div ref={stageRef} className="flex-1 min-h-0 flex items-center justify-center px-[7vw] overflow-hidden">
        <AnimatePresence mode="wait">
          {shownQuote && (
            <motion.div
              key={shownQuote.id}
              ref={contentRef}
              className="w-full max-w-[1100px]"
              initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
              transition={{ duration: 1.6, ease: [0.33, 0, 0.2, 1] }}
            >
              <QuoteText quote={shownQuote} style={style} fontSize={fontSize} dialect={dialect} />
              {quoteByline(shownQuote) && (
                <div className="mt-[3vh] flex items-center justify-center gap-3 text-[#c9a227]/75 font-cairo" style={{ fontSize: Math.max(13, fontSize * 0.32) }}>
                  <span className="h-px w-10 bg-[#c9a227]/40" />
                  <span>{quoteByline(shownQuote)}</span>
                  <span className="h-px w-10 bg-[#c9a227]/40" />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* الشعار */}
      <div className="shrink-0 pt-[2vh] pb-[4vh] flex justify-center pointer-events-none">
        <div className="flex items-center gap-2.5 opacity-70">
          <span className="w-8 h-8 rounded-[9px] border border-[#c9a227]/45 flex items-center justify-center">
            <span className="logo-ink text-[19px] leading-none">
              <InkText text="كَ" />
            </span>
          </span>
          <span className="logo-ink text-[18px] leading-none">
            <InkText text="كَلِمَاتِي" />
          </span>
        </div>
      </div>
      </div>

      <AnimatePresence>
        {showExit && (
          <motion.a
            href="/"
            onClick={(e) => e.stopPropagation()}
            className="glass-bar absolute top-[calc(env(safe-area-inset-top,0px)+14px)] left-4 px-4 h-10 rounded-full flex items-center text-sm font-cairo text-white"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            خروج
          </motion.a>
        )}
      </AnimatePresence>
    </div>
  );
};
