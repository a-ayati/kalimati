import React from 'react';
import { useKalimati } from '../context/KalimatiContext';
import { Feather, Heart, Lock, ShieldCheck } from 'lucide-react';
import { InkText } from './InkText';

export const Footer: React.FC = () => {
  const { setActiveTab, author } = useKalimati();

  return (
    <footer className="keep-tone w-full bg-[#0b0c0e] border-t border-white/10 mt-16 pb-32 md:pb-8 text-right text-xs text-stone-400">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        
        {/* Top footer row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-[#0d0d0f] border border-[#c9a227]/45 flex items-center justify-center">
              <span className="logo-ink text-[22px] leading-none"><InkText text="كَ" /></span>
            </div>
            <div>
              <div className="logo-ink text-[19px] leading-none mb-1"><InkText text="كَلِمَاتِي" /></div>
              <div className="text-[10px] text-amber-500/80 font-cairo">كَلِمَاتٌ تَبْقَى</div>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4 flex-wrap text-xs text-stone-400">
            <button
              onClick={() => setActiveTab('about')}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              عن كلماتي
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              التواصل
            </button>
            <button
              onClick={() => setActiveTab('privacy-terms')}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              الخصوصية وحقوق المحتوى
            </button>
          </div>
        </div>

        {/* Bottom footer row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-stone-500">
          <div>
            الخواطر المنشورة كتابات أصلية خاصة بالمنصة، أما الأمثال الشعبية فمن تراث أهلها.
          </div>
          <div className="flex items-center gap-1">
            <span>صُمِّمت بحب ورعاية للحرف العربي</span>
            <span className="text-amber-500">❦</span>
            <span>© {new Date().getFullYear()} كلماتي</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
