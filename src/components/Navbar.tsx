import React from 'react';
import { useKalimati } from '../context/KalimatiContext';
import { ActiveTab } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { HeaderLogo } from './HeaderLogo';
import { 
  Sparkles, 
  BookOpen, 
  Heart, 
  Palette, 
  User, 
  Moon, 
  Lock,
  Feather,
  type LucideIcon
} from 'lucide-react';
import { motion } from 'motion/react';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, savedItems, setIsZenActive } = useKalimati();

  const NAV_ITEMS: { id: ActiveTab; label: string; short: string; icon: LucideIcon }[] = [
    { id: 'today', label: 'اليوم', short: 'اليوم', icon: Sparkles },
    { id: 'library', label: 'مكتبة الكلمات', short: 'المكتبة', icon: BookOpen },
    { id: 'saved', label: 'وصلتني في وقتها', short: 'وصلتني', icon: Heart },
    { id: 'customize', label: 'على ذوقك', short: 'ذوقي', icon: Palette },
    { id: 'account', label: 'حسابي', short: 'حسابي', icon: User },
  ];

  return (
    <>
      {/* Top Desktop/Tablet Header */}
      {/* مسافة الأمان العلوية: على الآيفون يمتد المحتوى تحت شريط الساعة، فننزل الشريط تحته */}
      <header className="glass-header sticky top-0 z-40 w-full" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Brand Logo & Slogan */}
          <div 
            onClick={() => setActiveTab('today')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <HeaderLogo />
          </div>

          {/* روابط الحاسوب: كبسولة زجاجية بمؤشر ينزلق */}
          <nav className="hidden md:flex glass-bar rounded-full p-1 items-center" aria-label="التنقل الرئيسي">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isSavedTab = item.id === 'saved';

              return (
                <motion.button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  whileTap={{ scale: 0.94 }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex items-center gap-1.5 px-3.5 h-9 rounded-full text-xs cursor-pointer transition-colors ${
                    isActive ? 'text-[#e8b931] font-bold' : 'text-stone-300 hover:text-white font-semibold'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="desk-pill"
                      className="glass-pill absolute inset-0 rounded-full"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <Icon className="relative w-4 h-4" strokeWidth={isActive ? 2.2 : 1.8} />
                  <span className="relative">{item.label}</span>
                  {isSavedTab && savedItems.length > 0 && (
                    <span className="relative min-w-[18px] h-[18px] px-1 rounded-full bg-[#ff453a] text-white text-[10px] font-bold leading-[18px] text-center">
                      {savedItems.length}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* Header Utilities: PWA Install & Zen Button */}
          <div className="flex items-center gap-2">
            <PWAInstallButton />

            <button
              onClick={() => setIsZenActive(true)}
              className="glass-bar w-10 h-10 rounded-full flex items-center justify-center text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
              title="لحظة سكون — تأمل في هدوء"
            >
              <Moon className="w-4 h-4 text-amber-400" />
            </button>
          </div>

        </div>
      </header>

      {/* شريط التنقل العائم بزجاج ضبابي (أسلوب iOS) */}
      <nav
        className="md:hidden fixed inset-x-0 z-40 flex justify-center px-3 pointer-events-none"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)' }}
        aria-label="التنقل الرئيسي"
      >
        <div className="glass-bar pointer-events-auto w-full max-w-[440px] rounded-full p-1.5 flex items-stretch">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isSavedTab = item.id === 'saved';

            return (
              <motion.button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                whileTap={{ scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                aria-current={isActive ? 'page' : undefined}
                className="relative flex-1 min-w-0 h-[54px] flex flex-col items-center justify-center gap-[3px] rounded-full cursor-pointer"
              >
                {isActive && (
                  <motion.span
                    layoutId="tab-pill"
                    className="glass-pill absolute inset-0 rounded-full"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">
                  <Icon
                    className={`w-[22px] h-[22px] transition-colors ${isActive ? 'text-[#e8b931]' : 'text-stone-300'}`}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    fill={isActive ? 'currentColor' : 'none'}
                    fillOpacity={isActive ? (isSavedTab ? 1 : 0.22) : 0}
                  />
                  {isSavedTab && savedItems.length > 0 && (
                    <span className="absolute -top-1.5 -left-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#ff453a] text-white text-[10px] font-bold leading-[17px] text-center">
                      {savedItems.length}
                    </span>
                  )}
                </span>
                <span
                  className={`relative text-[10.5px] leading-none whitespace-nowrap transition-colors ${
                    isActive ? 'text-[#e8b931] font-bold' : 'text-stone-300 font-medium'
                  }`}
                >
                  {item.short}
                </span>
              </motion.button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
