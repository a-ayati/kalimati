import React from 'react';
import { useKalimati } from '../context/KalimatiContext';
import { ActiveTab } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { 
  Sparkles, 
  BookOpen, 
  Heart, 
  Palette, 
  User, 
  Moon, 
  Lock,
  Feather
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, savedItems, setIsZenActive } = useKalimati();

  const NAV_ITEMS: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'today', label: 'اليوم', icon: Sparkles },
    { id: 'library', label: 'مكتبة الكلمات', icon: BookOpen },
    { id: 'saved', label: 'وصلتني في وقتها', icon: Heart },
    { id: 'customize', label: 'على ذوقك', icon: Palette },
    { id: 'account', label: 'حسابي', icon: User },
  ];

  return (
    <>
      {/* Top Desktop/Tablet Header */}
      <header className="sticky top-0 z-40 w-full bg-[#0d0e11]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Brand Logo & Slogan */}
          <div 
            onClick={() => setActiveTab('today')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-900/40 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shadow-xs">
              <span className="font-cairo text-lg font-bold">ك</span>
            </div>
            <div className="flex flex-col justify-center">
              <div className="font-cairo text-base font-bold text-white tracking-wide flex items-center gap-2 leading-tight">
                <span>كَلِمَاتِي</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-cairo hidden sm:inline-block">
                  أصيلة
                </span>
              </div>
              <div className="text-[11px] text-amber-500/90 font-medium tracking-normal mt-1 hidden sm:block">
                كَلِمَةٌ تَصِلُ فِي وَقْتِهَا
              </div>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isSavedTab = item.id === 'saved';

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer relative ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs'
                      : 'text-stone-300 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                  {isSavedTab && savedItems.length > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-rose-500/20 text-rose-300 font-bold">
                      {savedItems.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Header Utilities: PWA Install & Zen Button */}
          <div className="flex items-center gap-2">
            <PWAInstallButton />

            <button
              onClick={() => setIsZenActive(true)}
              className="p-2 rounded-xl text-stone-400 hover:text-amber-400 hover:bg-white/5 border border-white/5 transition-colors cursor-pointer"
              title="لحظة سكون — تأمل في هدوء"
            >
              <Moon className="w-4 h-4 text-amber-400" />
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Section 3 requirement) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0e0f11]/95 backdrop-blur-lg border-t border-white/10 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isSavedTab = item.id === 'saved';

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all relative ${
                isActive
                  ? 'text-amber-400 font-bold scale-105'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-stone-400'}`} />
                {isSavedTab && savedItems.length > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 text-[9px] rounded-full bg-rose-500 text-white font-bold leading-none">
                    {savedItems.length}
                  </span>
                )}
              </div>
              <span className="mt-1 leading-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
