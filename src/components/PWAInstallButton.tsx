import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Share, PlusSquare } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer shadow-xs active:scale-95"
        title="تثبيت كلماتي كتطبيق على هاتفك أو حاسوبك"
      >
        <Download className="w-3.5 h-3.5 text-amber-400" />
        <span>تثبيت التطبيق</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer shadow-xs"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          <span>حفظ على الشاشة (iOS)</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#16171a] border border-amber-500/30 p-6 shadow-2xl text-right animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  حفظ «كلماتي» على الشاشة الرئيسية
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs text-stone-300 leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 mt-0.5">
                    <Share className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white">الخطوة الأولى:</span> اضغط على زر المشاركة <strong>Share</strong> في شريط متصفح سفاري بالأسفل.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 mt-0.5">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white">الخطوة الثانية:</span> مرّر للأسفل واضغط على <strong>«إضافة إلى الشاشة الرئيسية»</strong> (Add to Home Screen).
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-stone-900 border border-amber-500/20 text-[11px] text-stone-400">
                  سيعمل التطبيق كأيقونة مستقلة سريعة بدون شريط المتصفح وتصفّح المحفوظات حتى بدون اتصال بالإنترنت.
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-amber-500 text-stone-950 text-xs font-bold hover:bg-amber-400 transition-colors"
              >
                فهمت، شكرًا
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
