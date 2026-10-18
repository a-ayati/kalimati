import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, Stethoscope, type LucideIcon } from 'lucide-react';

/**
 * قطع «عيادة كلماتي»: نسخة مصغّرة من واجهة «دكتور المحتوى» —
 * دكتور يشخّص الحالة، أرقام تعدّ من الصفر، واختصاصيون يفتح كلٌّ منهم قسمه.
 */

/** رقم يعدّ من الصفر إلى قيمته */
export const CountUp: React.FC<{ value: number; duration?: number }> = ({ value, duration = 900 }) => {
  const [n, setN] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    let reduce = false;
    try {
      reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      // تجاهل
    }
    if (reduce) {
      setN(value);
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(a + (value - a) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{n.toLocaleString('en-US')}</>;
};

/** فقاعة الدكتور: يلخّص الحالة في جملة أو جملتين */
export const DoctorBubble: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-start gap-3.5 p-4 sm:p-5 rounded-3xl bg-[#141518] border border-white/10">
    <div className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg clinic-gradient">
      <Stethoscope className="w-6 h-6" />
    </div>
    <div className="min-w-0 space-y-1">
      <div className="text-[11px] font-semibold text-stone-400">الدكتور</div>
      <div className="text-sm sm:text-[15px] leading-relaxed text-stone-200">{children}</div>
    </div>
  </div>
);

/** خانة رقم في بطاقة الترحيب */
export const StatTile: React.FC<{ value: number; label: string; tone?: string }> = ({ value, label, tone = 'text-white' }) => (
  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1">
    <div className={`text-2xl sm:text-3xl font-bold tabular-nums ${tone}`}>
      <CountUp value={value} />
    </div>
    <div className="text-[11px] text-stone-400">{label}</div>
  </div>
);

/** اختصاصي: عنوان ملوّن ووصف، ويفتح قسمه */
export const SpecialistTile: React.FC<{
  icon: LucideIcon;
  title: string;
  desc: string;
  badge?: number;
  onClick: () => void;
}> = ({ icon: Icon, title, desc, badge, onClick }) => (
  <button
    onClick={onClick}
    className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#e5483b]/40 transition-all text-right flex items-center gap-3.5 cursor-pointer active:scale-[0.99]"
  >
    <span className="shrink-0 w-10 h-10 rounded-xl bg-[#e5483b]/10 text-[#e5483b] flex items-center justify-center">
      <Icon className="w-5 h-5" />
    </span>
    <span className="flex-1 min-w-0">
      <span className="flex items-center gap-2">
        <span className="font-bold text-[15px] clinic-accent">{title}</span>
        {!!badge && (
          <span className="min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold text-white bg-[#e5483b] flex items-center justify-center">
            {badge}
          </span>
        )}
      </span>
      <span className="block text-xs text-stone-400 mt-0.5">{desc}</span>
    </span>
    <ChevronLeft className="w-4 h-4 text-stone-500 shrink-0" />
  </button>
);

/** رأس القسم مع زر العودة إلى العيادة */
export const SectionHeader: React.FC<{ title: string; desc?: string; onBack: () => void; action?: React.ReactNode }> = ({
  title,
  desc,
  onBack,
  action,
}) => (
  <div className="space-y-3">
    <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-stone-200 cursor-pointer">
      <ArrowRight className="w-4 h-4" />
      <span>العيادة</span>
    </button>
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold clinic-accent">{title}</h2>
        {desc && <p className="text-xs sm:text-sm text-stone-400 mt-1">{desc}</p>}
      </div>
      {action}
    </div>
  </div>
);

/** تحية حسب الوقت */
export function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'ليلة هادئة';
  if (h < 12) return 'صباح الخير';
  if (h < 18) return 'نهارك سعيد';
  return 'مساء الخير';
}
