import React, { useState, useMemo } from 'react';
import { useKalimati } from '../context/KalimatiContext';
import { QuoteCard } from '../components/QuoteCard';
import { ALL_TOPICS } from '../data/seedQuotes';
import { DIALECTS, allQuoteText, quoteDialectId } from '../utils/dialects';
import { stripTashkeel } from '../utils/tashkeel';
import { Search, Filter, BookOpen, Sparkles, X } from 'lucide-react';
import { DialectId, Language } from '../types';

export const LibraryView: React.FC = () => {
  const { quotes } = useKalimati();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<'all' | Language>('all');
  const [selectedDialect, setSelectedDialect] = useState<'all' | DialectId>('all');

  // Filter only published quotes for public library
  const publishedQuotes = useMemo(() => {
    return quotes.filter((q) => q.status === 'published');
  }, [quotes]);

  // Filter based on search query, topic, and dialect
  const filteredQuotes = useMemo(() => {
    const cleanQuery = stripTashkeel(searchQuery.trim().toLowerCase());

    return publishedQuotes.filter((quote) => {
      // Dialect filter
      if (selectedLanguage !== 'all' && quote.language !== selectedLanguage) {
        return false;
      }
      if (selectedLanguage === 'darja' && selectedDialect !== 'all' && quoteDialectId(quote) !== selectedDialect) {
        return false;
      }

      // Topic filter
      if (selectedTopic !== 'all' && !quote.topics.includes(selectedTopic)) {
        return false;
      }

      // Search query
      if (cleanQuery) {
        const cleanQuoteText = stripTashkeel(allQuoteText(quote).toLowerCase());
        const cleanAuthor = stripTashkeel(quote.author.toLowerCase());
        const cleanBehind = stripTashkeel((quote.behindTheWords || '').toLowerCase());
        const matchesTopic = quote.topics.some((t) => stripTashkeel(t.toLowerCase()).includes(cleanQuery));

        return (
          cleanQuoteText.includes(cleanQuery) ||
          cleanAuthor.includes(cleanQuery) ||
          cleanBehind.includes(cleanQuery) ||
          matchesTopic
        );
      }

      return true;
    });
  }, [publishedQuotes, searchQuery, selectedTopic, selectedLanguage, selectedDialect]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      
      {/* Header */}
      <div className="border-b border-white/10 pb-6 space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-amber-400">ديوان المنصة</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-cairo text-white pt-2 pb-1 leading-snug tracking-wide">
          مَكْتَبَةُ الْكَلِمَاتِ
        </h1>
        <p className="text-xs sm:text-sm text-stone-400 font-cairo">
          خواطر الكاتب بالفصحى، وأمثال شعبية معروفة من كل لهجة؛ ابحث بالمعنى أو الموضوع أو اللهجة.
        </p>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="space-y-3 bg-[#131417] p-4 rounded-2xl border border-white/10">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في نص الكلمات، الموضوعات، أو الشروح..."
            className="w-full pr-10 pl-10 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs sm:text-sm text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dialect Filter and Topics */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Dialect Toggle */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl text-xs shrink-0">
            <button
              onClick={() => setSelectedLanguage('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedLanguage === 'all'
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              الكل ({publishedQuotes.length})
            </button>
            <button
              onClick={() => setSelectedLanguage('fusha')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedLanguage === 'fusha'
                  ? 'bg-rose-500/30 text-rose-300 font-bold border border-rose-500/40'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              عربية فصحى
            </button>
            <button
              onClick={() => {
              setSelectedLanguage('darja');
              setSelectedDialect('all');
            }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedLanguage === 'darja'
                  ? 'bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              أمثال باللهجات
            </button>
            {(['en', 'fr'] as const).map(lang => <button key={lang} onClick={() => setSelectedLanguage(lang)} className={`px-3 py-1.5 rounded-lg ${selectedLanguage === lang ? 'bg-amber-500/20 text-amber-300' : 'text-stone-400'}`}>{lang === 'en' ? 'الإنجليزية' : 'الفرنسية'}</button>)}
          </div>

          {/* Result Count */}
          <div className="text-xs text-stone-400">
            عرض <strong className="text-amber-400 font-bold">{filteredQuotes.length}</strong> من أصل {publishedQuotes.length} خاطرة
          </div>
        </div>

        {/* اللهجات: تظهر عند اختيار الأمثال */}
        {selectedLanguage === 'darja' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" role="group" aria-label="اللهجة">
            {([{ id: 'all', name: 'كل اللهجات' }, ...DIALECTS] as { id: 'all' | DialectId; name: string }[]).map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDialect(d.id)}
                aria-pressed={selectedDialect === d.id}
                className={`px-3 py-1 rounded-full text-xs shrink-0 transition-all cursor-pointer ${
                  selectedDialect === d.id ? 'glass-pill text-[#e8b931] font-bold' : 'text-stone-400 hover:text-stone-200 border border-white/10'
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        )}

        {/* Topic Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <button
            onClick={() => setSelectedTopic('all')}
            className={`px-3 py-1 rounded-full text-xs shrink-0 border transition-all cursor-pointer ${
              selectedTopic === 'all'
                ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold'
                : 'bg-white/5 text-stone-400 border-white/10 hover:border-white/20'
            }`}
          >
            جميع الموضوعات
          </button>
          {ALL_TOPICS.map((topic) => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(selectedTopic === topic ? 'all' : topic)}
              className={`px-3 py-1 rounded-full text-xs shrink-0 border transition-all cursor-pointer ${
                selectedTopic === topic
                  ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold shadow-xs'
                  : 'bg-white/5 text-stone-400 border-white/10 hover:border-white/20'
              }`}
            >
              #{topic}
            </button>
          ))}
        </div>
      </div>

      {/* Quote Grid */}
      {filteredQuotes.length === 0 ? (
        <div className="text-center py-16 bg-[#131417] rounded-3xl border border-white/10 p-6">
          <Sparkles className="w-8 h-8 text-amber-500/50 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-200">لم نعثر على كلمات تطابق بحثك</h3>
          <p className="text-xs text-stone-400 mt-1">جرّب البحث بكلمة أخرى أو قم بإلغاء بعض عوامل التصفية.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedTopic('all');
              setSelectedLanguage('all');
            }}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-stone-950 hover:bg-amber-400"
          >
            إعادة تعيين البحث
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredQuotes.map((quote) => (
            <QuoteCard key={quote.id} quote={quote} variant="standard" showActions={true} />
          ))}
        </div>
      )}

    </div>
  );
};
