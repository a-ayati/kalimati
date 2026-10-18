import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useAnimate } from 'motion/react';
import { shouldPlay as introWillPlay } from './LogoIntro';
import { InkText } from './InkText';

const BOX = 40; // المربع النهائي
const WORD = 22; // حجم الكلمة داخل المربع وبجانبه
const KAF = 25; // حجم «كَ» النهائي
const PAD = 12;
const EASE: [number, number, number, number] = [0.65, 0, 0.35, 1];

// قصّ الحبر من اليمين إلى اليسار (مخفي ← ظاهر)
const CLIP_HIDDEN = 'inset(-60% -10% -60% 110%)'; // 110%: حتى أطراف الحروف البارزة يميناً تبقى مخفية
const CLIP_SHOWN = 'inset(-60% -10% -60% -10%)';

function reducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return true;
  }
}

const sleep = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

/**
 * شعار الشريط العلوي المتحرك: «كَلِمَاتِي» تُكتب داخل المربع، ثم ينكمش المربع فتبقى «كَ»
 * وتُكتب الكلمة بجانبه. تتكرر الحركة عند مرور المؤشر، ويمرّ بريق ذهبي خفيف على المربع بين حين وآخر.
 */
export const HeaderLogo: React.FC<{ showTagline?: boolean }> = ({ showTagline = true }) => {
  const [scope, animate] = useAnimate();
  const [still] = useState(reducedMotion);
  const [firstDelay] = useState(() => (introWillPlay() ? 3300 : 250));
  const [m, setM] = useState<{ word: number; kaf: number } | null>(null);
  const [settled, setSettled] = useState(still);
  const [primed, setPrimed] = useState(still);
  const running = useRef(false);
  const wordMeasure = useRef<HTMLSpanElement>(null);
  const kafMeasure = useRef<HTMLSpanElement>(null);

  // قياس الكلمة بعد تحميل خط الشعار
  useEffect(() => {
    if (still) return;
    let cancelled = false;
    const measure = () => {
      if (cancelled || !wordMeasure.current || !kafMeasure.current) return;
      setM({ word: wordMeasure.current.offsetWidth, kaf: kafMeasure.current.offsetWidth });
    };
    document.fonts.load(`700 ${WORD}px KQL-ruqaaink`, 'كَلِمَاتِي').then(measure, measure);
    const t = window.setTimeout(measure, 1200);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [still]);

  const wide = m ? m.word + PAD * 2 : BOX;
  const kafOffset = m ? m.word / 2 - m.kaf / 2 : 0; // مكان الكاف داخل الكلمة (أقصى اليمين)

  /** الانكماش: المربع يضيق إلى «كَ» والكلمة تُكتب بجانبه */
  const contract = useCallback(async () => {
    await Promise.all([
      animate('[data-box]', { width: BOX }, { duration: 0.8, ease: EASE }),
      animate('[data-word]', { opacity: 0, filter: 'blur(3px)' }, { duration: 0.28, ease: 'easeIn' }),
      animate('[data-kaf]', { opacity: 1 }, { duration: 0.18 }),
      animate('[data-kaf]', { x: 0, fontSize: `${KAF}px` }, { duration: 0.8, ease: EASE }),
      animate('[data-mark]', { clipPath: CLIP_SHOWN, opacity: 1 }, { duration: 0.75, delay: 0.3, ease: [0.33, 0, 0.2, 1] }),
      animate(
        '[data-box]',
        { boxShadow: ['0 0 0 rgba(201,162,39,0)', '0 0 18px rgba(201,162,39,0.45)', '0 0 0 rgba(201,162,39,0)'] },
        { duration: 1.4, delay: 0.5 }
      ),
    ]);
  }, [animate]);

  /** الحركة الأولى عند فتح الصفحة */
  const playFirst = useCallback(async () => {
    if (!m || running.current) return;
    running.current = true;
    // الحالة الابتدائية: مربع عريض، الكلمة مخفية، الكاف فوق كاف الكلمة
    await Promise.all([
      animate('[data-box]', { width: wide }, { duration: 0 }),
      animate('[data-word]', { clipPath: CLIP_HIDDEN, opacity: 1, filter: 'blur(0px)' }, { duration: 0 }),
      animate('[data-kaf]', { x: kafOffset, opacity: 0, fontSize: `${WORD}px` }, { duration: 0 }),
      animate('[data-mark]', { clipPath: CLIP_HIDDEN, opacity: 1 }, { duration: 0 }),
    ]);
    setPrimed(true);
    await sleep(firstDelay);
    await animate('[data-word]', { clipPath: CLIP_SHOWN }, { duration: 0.8, ease: [0.33, 0, 0.2, 1] });
    await sleep(550);
    await contract();
    running.current = false;
    setSettled(true);
  }, [m, wide, kafOffset, firstDelay, animate, contract]);

  /** إعادة الحركة عند مرور المؤشر: يتّسع المربع لتعود الكلمة، ثم ينكمش من جديد */
  const replay = useCallback(async () => {
    if (!m || still || running.current || !settled) return;
    running.current = true;
    await Promise.all([
      animate('[data-mark]', { opacity: 0.25 }, { duration: 0.3 }),
      animate('[data-box]', { width: wide }, { duration: 0.6, ease: EASE }),
      animate('[data-kaf]', { x: kafOffset, fontSize: `${WORD}px` }, { duration: 0.6, ease: EASE }),
      animate('[data-word]', { clipPath: CLIP_SHOWN, opacity: 1, filter: 'blur(0px)' }, { duration: 0.35, delay: 0.3 }),
      animate('[data-kaf]', { opacity: 0 }, { duration: 0.15, delay: 0.5 }),
      animate('[data-mark]', { clipPath: CLIP_HIDDEN }, { duration: 0.01, delay: 0.3 }),
    ]);
    await sleep(500);
    await contract();
    running.current = false;
  }, [m, still, settled, wide, kafOffset, animate, contract]);

  useLayoutEffect(() => {
    if (m && !still) playFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m]);

  const animating = !still;

  return (
    <div
      ref={scope}
      className="flex items-center gap-3"
      style={{ opacity: animating && !primed ? 0 : 1, transition: 'opacity 0.3s ease' }}
      onMouseEnter={replay}
    >
      {/* عناصر القياس (مخفية) */}
      {animating && !m && (
        <span className="logo-ink absolute opacity-0 pointer-events-none whitespace-nowrap" style={{ fontSize: WORD }} dir="rtl">
          <span ref={wordMeasure}>كَلِمَاتِي</span>
          <span ref={kafMeasure}>كَ</span>
        </span>
      )}

      <div
        data-box
        className="logo-sheen relative h-10 rounded-[11px] bg-[#0d0d0f] border border-[#c9a227]/45 flex items-center justify-center overflow-hidden shrink-0"
        style={{ width: BOX }}
      >
        <span
          data-word
          aria-hidden="true"
          className="logo-ink absolute whitespace-nowrap leading-none"
          dir="rtl"
          style={{ fontSize: WORD, opacity: 0 }}
        >
          <InkText text="كَلِمَاتِي" />
        </span>
        <span data-kaf className="logo-ink absolute leading-none" dir="rtl" style={{ fontSize: KAF }}>
          <InkText text="كَ" />
        </span>
      </div>

      <div className="flex flex-col justify-center">
        <div className="font-cairo text-base font-bold text-white flex items-center gap-2 leading-tight">
          <span data-mark className="logo-word logo-ink text-[22px] leading-none">
            <InkText text="كَلِمَاتِي" />
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-cairo hidden sm:inline-block">
            أصيلة
          </span>
        </div>
        {showTagline && (
          <div className="text-[11px] text-amber-500/90 font-medium tracking-normal mt-1 hidden sm:block">
            كَلِمَاتٌ تَبْقَى
          </div>
        )}
      </div>
    </div>
  );
};
