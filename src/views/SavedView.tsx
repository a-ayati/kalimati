import React, { useState, useMemo } from 'react';
import { useKalimati } from '../context/KalimatiContext';
import { QuoteCard } from '../components/QuoteCard';
import { EmotionTag } from '../types';
import { stripTashkeel } from '../utils/tashkeel';
import { 
  Heart, 
  Search, 
  Sparkles, 
  Download, 
  Upload, 
  Trash2, 
  FileText, 
  Share2,
  BookMarked
} from 'lucide-react';

export const SavedView: React.FC = () => {
  const { 
    savedItems, 
    quotes, 
    exportBackupJson, 
    importBackupJson, 
    setActiveTab 
  } = useKalimati();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [backupNotice, setBackupNotice] = useState<string | null>(null);

  // Join saved items with quote details
  const joinedSavedQuotes = useMemo(() => {
    return savedItems.map((item) => {
      const quote = quotes.find((q) => q.id === item.quoteId);
      return {
        ...item,
        quote,
      };
    }).filter((entry) => entry.quote !== undefined);
  }, [savedItems, quotes]);

  // Filter saved quotes
  const filteredSaved = useMemo(() => {
    const cleanQuery = stripTashkeel(searchQuery.trim().toLowerCase());

    return joinedSavedQuotes.filter((entry) => {
      if (!entry.quote) return false;

      // Emotion tag filter
      if (selectedTag !== 'all' && entry.emotionTag !== selectedTag) {
        return false;
      }

      // Search text
      if (cleanQuery) {
        const textMatch = stripTashkeel(entry.quote.text.toLowerCase()).includes(cleanQuery);
        const noteMatch = stripTashkeel((entry.privateNote || '').toLowerCase()).includes(cleanQuery);
        const topicMatch = entry.quote.topics.some((t) => stripTashkeel(t.toLowerCase()).includes(cleanQuery));
        return textMatch || noteMatch || topicMatch;
      }

      return true;
    });
  }, [joinedSavedQuotes, searchQuery, selectedTag]);

  // Handle Export Backup
  const handleExport = () => {
    const jsonStr = exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kalimati-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    setBackupNotice('تم تنزيل نسختك الاحتياطية بنجاح.');
    setTimeout(() => setBackupNotice(null), 3500);
  };

  // Handle Import Backup
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const success = importBackupJson(text);
      if (success) {
        setBackupNotice('تم استيراد محفوظاتك بنجاح.');
      } else {
        alert('حدث خطأ في قراءة ملف النسخة الاحتياطية.');
      }
      setTimeout(() => setBackupNotice(null), 3500);
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span className="text-xs font-semibold text-rose-400">مجموعتك الوجدانية الخاصة</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-cairo text-white pt-2 pb-1 leading-snug tracking-wide">
            وَصَلَتْنِي فِي وَقْتِهَا
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 font-cairo">
            الكلمات التي لامست قلبك وملاحظاتك الشخصية. محفوظة على جهازك بسرية تامة ولا تُشارك مع أحد.
          </p>
        </div>

        {/* Backup / Export actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs bg-white/5 hover:bg-white/10 text-stone-300 border border-white/10 transition-colors cursor-pointer"
            title="تصدير نسخة احتياطية من محفوظاتك وملاحظاتك"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>تصدير نسخة</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs bg-white/5 hover:bg-white/10 text-stone-300 border border-white/10 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>استيراد</span>
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>
        </div>
      </div>

      {/* Backup notification alert */}
      {backupNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between animate-in fade-in">
          <span>{backupNotice}</span>
        </div>
      )}

      {/* Search and Emotion Filter */}
      {savedItems.length > 0 && (
        <div className="space-y-3 bg-[#131417] p-4 rounded-2xl border border-white/10">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في محفوظاتك أو ملاحظاتك الخاصة..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs sm:text-sm text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-3 py-1 rounded-full text-xs border transition-all cursor-pointer ${
                selectedTag === 'all'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500 font-bold'
                  : 'bg-white/5 text-stone-400 border-white/10 hover:border-white/20'
              }`}
            >
              الكل ({savedItems.length})
            </button>
            {(['طمأنتني', 'عبّرت عنّي', 'أيقظتني', 'ألهمتني', 'داوتني'] as EmotionTag[]).map((tag) => {
              const count = savedItems.filter((s) => s.emotionTag === tag).length;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? 'all' : tag)}
                  className={`px-3 py-1 rounded-full text-xs border transition-all cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold'
                      : 'bg-white/5 text-stone-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  {tag} {count > 0 && `(${count})`}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {savedItems.length === 0 ? (
        <div className="text-center py-16 bg-[#131417] rounded-3xl border border-white/10 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">لم تحفظ أي خاطرة بعد</h3>
          <p className="text-xs sm:text-sm text-stone-400 max-w-md mx-auto leading-relaxed">
            حين تجد حكمة تلامس قلبك في صفحة اليوم أو المكتبة، اضغط على زر <strong>«وصلتني في وقتها»</strong> لحفظها هنا، وتدوين مشاعرك وملاحظاتك حولها.
          </p>
          <button
            onClick={() => setActiveTab('today')}
            className="mt-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors"
          >
            اكتشف كلمة اليوم
          </button>
        </div>
      ) : filteredSaved.length === 0 ? (
        <div className="text-center py-12 bg-[#131417] rounded-3xl border border-white/10 p-6">
          <p className="text-sm text-stone-300">لا توجد محفوظات تطابق كلمة البحث الحالية.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredSaved.map(({ quote, emotionTag, privateNote, savedAt }) => (
            <div key={quote!.id} className="relative space-y-2">
              <QuoteCard quote={quote!} variant="standard" showActions={true} />

              {/* Private note & emotion highlight banner */}
              {(emotionTag || privateNote) && (
                <div className="max-w-2xl mx-auto p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/25 text-xs text-stone-300 flex items-start gap-2.5">
                  <FileText className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-300">ملاحظتك الخاصة:</span>
                      {emotionTag && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px]">
                          شعورك: {emotionTag}
                        </span>
                      )}
                      <span className="text-[10px] text-stone-500">
                        ({new Date(savedAt).toLocaleDateString('ar-DZ')})
                      </span>
                    </div>
                    {privateNote && <p className="text-stone-200/90 font-cairo text-xs">"{privateNote}"</p>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
