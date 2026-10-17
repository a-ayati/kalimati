import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { InkText } from './InkText';

const WORD_SIZE = 76; // حجم «كلماتي» داخل المربع
const ICON_SIZE = 120; // المربع النهائي
const ICON_LETTER = 74; // حجم «كَ» النهائي
const PAD_X = 44;
const BOX_H = 150;
const EASE: [number, number, number, number] = [0.65, 0, 0.35, 1];

// التوقيت (بالثواني)
const T_REVEAL = 0.25; // ظهور الكلمة بالحبر من اليمين إلى اليسار
const T_SHRINK = 1.55; // بداية انكماش المربع
const D_SHRINK = 0.85;
const T_END = 2.85; // اختفاء المقدّمة

const STORAGE_KEY = 'kalimati_intro_seen';

export function shouldPlay(): boolean {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    return sessionStorage.getItem(STORAGE_KEY) !== '1';
  } catch {
    return false;
  }
}

/**
 * مقدّمة الشعار: «كَلِمَاتِي» كاملة داخل مربع، ثم ينكمش المربع بسلاسة
 * فلا يبقى إلا حرف «كَ» كما في أيقونة المنصة. تظهر مرة واحدة في كل زيارة.
 */
export const LogoIntro: React.FC = () => {
  const [play] = useState(shouldPlay);
  const [visible, setVisible] = useState(play);
  const [ready, setReady] = useState(false);
  const [m, setM] = useState<{ w: number; k: number } | null>(null);
  const isoRef = useRef<HTMLSpanElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);

  // ننتظر خط الشعار (بحد أقصى ثانية) حتى لا تظهر الكلمة بخط بديل
  useEffect(() => {
    if (!play) return;
    let done = false;
    const go = () => {
      if (!done) {
        done = true;
        setReady(true);
      }
    };
    document.fonts.load(`700 ${WORD_SIZE}px KQL-ruqaaink`, 'كَلِمَاتِي').then(go, go);
    const t = window.setTimeout(go, 1000);
    return () => window.clearTimeout(t);
  }, [play]);

  useLayoutEffect(() => {
    if (!ready || !wordRef.current || !isoRef.current) return;
    setM({ w: wordRef.current.offsetWidth, k: isoRef.current.offsetWidth });
  }, [ready]);

  useEffect(() => {
    if (!m) return;
    const t = window.setTimeout(() => {
      setVisible(false);
      try {
        sessionStorage.setItem(STORAGE_KEY, '1');
      } catch {
        // تجاهل
      }
    }, T_END * 1000);
    return () => window.clearTimeout(t);
  }, [m]);

  if (!play) return null;

  const boxW = m ? m.w + PAD_X * 2 : 0;
  // «كَ» تبدأ فوق كاف الكلمة تماماً (محاذاة الحافة اليمنى) ثم تنتقل إلى المركز
  const kOffset = m ? m.w / 2 - m.k / 2 : 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0d0d0f]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeOut' } }}
          onClick={() => setVisible(false)}
          aria-hidden="true"
        >
          {/* قياس الكلمة قبل الحركة */}
          {!m && (
            <span className="logo-ink absolute opacity-0 pointer-events-none whitespace-nowrap" style={{ fontSize: WORD_SIZE }} dir="rtl">
              <span ref={wordRef}>كَلِمَاتِي</span>
              <span ref={isoRef}>كَ</span>
            </span>
          )}

          {m && (
            <div className="flex flex-col items-center">
              <motion.div
                className="relative overflow-hidden flex items-center justify-center bg-[#0d0d0f]"
                style={{ border: '1.5px solid rgba(201,162,39,0.45)' }}
                initial={{ width: boxW, height: BOX_H, borderRadius: 18, opacity: 0, scale: 0.94 }}
                animate={{
                  width: ICON_SIZE,
                  height: ICON_SIZE,
                  borderRadius: 28,
                  opacity: 1,
                  scale: 1,
                  boxShadow: ['0 0 0 rgba(201,162,39,0)', '0 0 0 rgba(201,162,39,0)', '0 0 48px rgba(201,162,39,0.28)'],
                }}
                transition={{
                  opacity: { duration: 0.5, ease: 'easeOut' },
                  scale: { duration: 0.7, ease: EASE },
                  width: { delay: T_SHRINK, duration: D_SHRINK, ease: EASE },
                  height: { delay: T_SHRINK, duration: D_SHRINK, ease: EASE },
                  borderRadius: { delay: T_SHRINK, duration: D_SHRINK, ease: EASE },
                  boxShadow: { delay: T_SHRINK, duration: D_SHRINK + 0.3, times: [0, 0.6, 1] },
                }}
              >
                {/* الكلمة كاملة: تُكتب بالحبر ثم تنسحب */}
                <motion.span
                  className="logo-ink absolute whitespace-nowrap"
                  dir="rtl"
                  style={{ fontSize: WORD_SIZE, lineHeight: 1 }}
                  initial={{ clipPath: 'inset(-40% -10% -40% 100%)', opacity: 1, filter: 'blur(0px)' }}
                  animate={{ clipPath: 'inset(-40% -10% -40% -10%)', opacity: 0, filter: 'blur(4px)' }}
                  transition={{
                    clipPath: { delay: T_REVEAL, duration: 0.9, ease: [0.33, 0, 0.2, 1] },
                    opacity: { delay: T_SHRINK, duration: 0.28, ease: 'easeIn' },
                    filter: { delay: T_SHRINK, duration: 0.28 },
                  }}
                >
                  <InkText text="كَلِمَاتِي" />
                </motion.span>

                {/* «كَ» وحدها: تنطلق من مكانها في الكلمة وتستقر في وسط المربع */}
                <motion.span
                  className="logo-ink absolute"
                  dir="rtl"
                  style={{ lineHeight: 1 }}
                  initial={{ x: kOffset, opacity: 0, fontSize: WORD_SIZE }}
                  animate={{ x: 0, opacity: 1, fontSize: ICON_LETTER }}
                  transition={{
                    opacity: { delay: T_SHRINK - 0.05, duration: 0.18 },
                    x: { delay: T_SHRINK, duration: D_SHRINK, ease: EASE },
                    fontSize: { delay: T_SHRINK, duration: D_SHRINK, ease: EASE },
                  }}
                >
                  <InkText text="كَ" />
                </motion.span>
              </motion.div>

              {/* الشعار اللفظي */}
              <motion.div
                className="mt-6 flex items-center gap-3 text-[#c9a227]"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: [0, 1, 1, 0], y: [6, 0, 0, -4] }}
                transition={{ duration: T_SHRINK + 0.2, times: [0, 0.45, 0.85, 1], delay: 0.3 }}
              >
                <span className="w-10 h-px bg-[#c9a227]/70" />
                <span className="text-sm font-cairo font-medium">كلمة تصل في وقتها</span>
                <span className="w-10 h-px bg-[#c9a227]/70" />
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
