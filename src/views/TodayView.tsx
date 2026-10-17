import React, { useState } from 'react';
import { useKalimati } from '../context/KalimatiContext';
import { QuoteCard } from '../components/QuoteCard';
import { ALL_TOPICS } from '../data/seedQuotes';
import { 
  Sparkles, 
  Moon, 
  SlidersHorizontal, 
  Share2, 
  X, 
  BookmarkCheck, 
  BookOpen,
  Filter
} from 'lucide-react';

export const TodayView: React.FC = () => {
  const { 
    quotes, 
    preferredTopics, 
    setPreferredTopics, 
    setIsZenActive, 
    postSaveNotice, 
    dismissPostSaveNotice, 
    openShareModal, 
    activeTab, 
    setActiveTab 
  } = useKalimati();

  const [showTopicFilter, setShowTopicFilter] = useState(false);
  const [viewMode, setViewMode] = useState<'universal' | 'tailored'>('universal');

  // Filter published quotes only for public viewing
  const publishedQuotes = quotes.filter((q) => q.status === 'published');

  // Universal quote of the day (stable algorithm based on today's calendar date)
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
  );
  const universalTodayQuote = publishedQuotes[dayOfYear % publishedQuotes.length] || publishedQuotes[0];

  // Tailored quote based on user's preferred topics
  const tailoredQuotes = publishedQuotes.filter((q) =>
    q.topics.some((topic) => preferredTopics.includes(topic))
  );
  const tailoredTodayQuote = tailoredQuotes.length > 0
    ? tailoredQuotes[(dayOfYear + 3) % tailoredQuotes.length]
    : universalTodayQuote;

  const currentDisplayQuote = viewMode === 'universal' ? universalTodayQuote : tailoredTodayQuote;

  const toggleTopic = (topic: string) => {
    if (preferredTopics.includes(topic)) {
      if (preferredTopics.length > 1) {
        setPreferredTopics(preferredTopics.filter((t) => t !== topic));
      }
    } else {
      setPreferredTopics([...preferredTopics, topic]);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      
      {/* Top Welcome & Sub-header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold tracking-wider text-amber-400">
              كلمة اليوم المُختارة
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-cairo text-white tracking-wide pt-2 pb-1 leading-snug">
            كَلِمَةٌ تَصِلُ فِي وَقْتِهَا
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 font-cairo">
            خاطرة يومية من صميم الوجدان، تجمع بين بلاغة الفصحى ودفء الدارجة الجزائرية.
          </p>
        </div>

        {/* Quick Actions (Zen Moment button & Topic preferences) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsZenActive(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-amber-500/10 text-stone-300 hover:text-amber-300 border border-white/10 hover:border-amber-500/30 transition-all cursor-pointer shadow-xs active:scale-95"
            title="بدء وضع السكون والتأمل الآن"
          >
            <Moon className="w-3.5 h-3.5 text-amber-400" />
            <span>لحظة سكون</span>
          </button>

          <button
            onClick={() => setShowTopicFilter(!showTopicFilter)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showTopicFilter
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-white/5 text-stone-300 border-white/10 hover:border-white/20'
            }`}
            title="تخصيص موضوعاتك المفضلة"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>موضوعاتي ({preferredTopics.length})</span>
          </button>
        </div>
      </div>

      {/* Suggestion Notice after saving: «شاركها، لعلّها تصل لغيرك في وقتها.» */}
      {postSaveNotice && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-300">حُفِظَت في مجموعتك الخاصة بنجاح</p>
              <p className="text-xs text-stone-300 mt-0.5">
                «شَارِكْهَا، لَعَلَّهَا تَصِلُ لِغَيْرِكَ فِي وَقْتِهَا.»
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                dismissPostSaveNotice();
                openShareModal(currentDisplayQuote);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-stone-950 hover:bg-amber-400 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>مشاركة الآن</span>
            </button>
            <button
              onClick={dismissPostSaveNotice}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mode Switcher: Universal fixed vs Tailored to user interests */}
      <div className="flex items-center justify-between bg-white/5 p-1 rounded-2xl border border-white/10 text-xs">
        <button
          onClick={() => setViewMode('universal')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer font-medium text-center ${
            viewMode === 'universal'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          حكمة اليوم العامة (ثابتة لجميع القراء)
        </button>

        <button
          onClick={() => setViewMode('tailored')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer font-medium text-center ${
            viewMode === 'tailored'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          مختارة على ذوقك (وفق موضوعاتك المفضلة)
        </button>
      </div>

      {/* Collapsible Topic Filter Drawer */}
      {showTopicFilter && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#141518] border border-amber-500/20 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-stone-200">اختر الموضوعات التي تود أن تُقترح لك اليوم:</h3>
            </div>
            <button
              onClick={() => setPreferredTopics(ALL_TOPICS)}
              className="text-[11px] text-amber-400 hover:underline cursor-pointer"
            >
              تحديد الكل
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {ALL_TOPICS.map((topic) => {
              const active = preferredTopics.includes(topic);
              return (
                <button
                  key={topic}
                  onClick={() => toggleTopic(topic)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                    active
                      ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold shadow-xs'
                      : 'bg-white/5 text-stone-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  #{topic}
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-stone-500 leading-relaxed">
            * تحتفظ المنصة دومًا برابط عام ثابت لكل اقتباس، وتخصيص الموضوعات يغيّر فقط ما يُقترح لراحتك عند فتح الصفحة.
          </p>
        </div>
      )}

      {/* The Flagship Featured Quote Card */}
      <div className="pt-2">
        <QuoteCard quote={currentDisplayQuote} variant="featured" showActions={true} />
      </div>

      {/* Discover More in Library Banner */}
      <div className="text-center pt-4">
        <button
          onClick={() => setActiveTab('library')}
          className="inline-flex items-center gap-2 text-xs text-stone-400 hover:text-amber-400 transition-colors py-2 px-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>تصفّح مكتبة الكلمات الكاملة (أكثر من 30 حكمة وخاطرة أصيلة)</span>
        </button>
      </div>

    </div>
  );
};
