import React from 'react';
import { useKalimati } from '../context/KalimatiContext';
import { Feather, Heart, Lock, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActiveTab, author } = useKalimati();

  return (
    <footer className="w-full bg-[#0b0c0e] border-t border-white/10 mt-16 pb-20 md:pb-8 text-right text-xs text-stone-400">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        
        {/* Top footer row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-cairo font-bold text-xs border border-amber-500/30">
              ك
            </div>
            <div>
              <div className="font-bold text-stone-200 text-sm font-cairo">كَلِمَاتِي</div>
              <div className="text-[10px] text-amber-500/80 font-cairo">كَلِمَةٌ تَصِلُ فِي وَقْتِهَا</div>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4 flex-wrap text-xs text-stone-400">
            <button
              onClick={() => setActiveTab('author')}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              صفحة الكاتب
            </button>
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
            <button
              onClick={() => setActiveTab('admin')}
              className="hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1 text-[11px] text-stone-500"
            >
              <Lock className="w-3 h-3" />
              <span>لوحة الإدارة</span>
            </button>
          </div>
        </div>

        {/* Bottom footer row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-stone-500">
          <div>
            جميع النصوص والخواطر المنشورة هي كتابات أصلية بقلم الكاتب <strong>{author.name}</strong>.
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
