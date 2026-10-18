import React, { useState } from 'react';
import { Quote, EmotionTag } from '../types';
import { quoteUrl } from '../lib/links';
import { useKalimati } from '../context/KalimatiContext';
import { stripTashkeel } from '../utils/tashkeel';
import { WaxSeal } from './WaxSeal';
import { QuoteText } from './QuoteText';
import { availableDialects, dialectInfo, isFolk, pickDialect, quoteByline, quoteLabel } from '../utils/dialects';
import { 
  Heart, 
  Share2, 
  PenTool, 
  Info, 
  Copy, 
  Check, 
  Languages, 
  Calendar, 
  User, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Trash2
} from 'lucide-react';

interface QuoteCardProps {
  quote: Quote;
  variant?: 'featured' | 'standard' | 'minimal';
  showActions?: boolean;
}

const EMOTION_OPTIONS: { label: EmotionTag; emoji: string }[] = [
  { label: 'طمأنتني', emoji: '🕊️' },
  { label: 'عبّرت عنّي', emoji: '🪞' },
  { label: 'أيقظتني', emoji: '⚡' },
  { label: 'ألهمتني', emoji: '✨' },
  { label: 'داوتني', emoji: '🌿' },
];

export const QuoteCard: React.FC<QuoteCardProps> = ({
  quote,
  variant = 'featured',
  showActions = true,
}) => {
  const { 
    isSaved, 
    saveQuote, 
    removeSavedQuote, 
    savedItems, 
    updateSavedQuote, 
    openShareModal, 
    quotes, 
    setSelectedQuoteId, 
    setActiveTab,
    customStyle,
    preferredDialect,
    setPreferredDialect
  } = useKalimati();

  const [copied, setCopied] = useState(false);
  const [showBehind, setShowBehind] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);


  // Current quote being viewed (either current or paired alternate dialect)
  const currentQuote = quote;
  const savedEntry = savedItems.find((s) => s.quoteId === currentQuote.id);
  const saved = !!savedEntry;

  const [noteText, setNoteText] = useState(savedEntry?.privateNote || '');
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionTag | undefined>(savedEntry?.emotionTag);


  const handleToggleSave = () => {
    if (saved) {
      removeSavedQuote(currentQuote.id);
      setShowNoteEditor(false);
    } else {
      saveQuote(currentQuote.id, selectedEmotion, noteText);
    }
  };

  const handleSaveNoteAndEmotion = () => {
    saveQuote(currentQuote.id, selectedEmotion, noteText);
    setShowNoteEditor(false);
  };

  const handleCopyText = async () => {
    try {
      const picked = pickDialect(currentQuote, preferredDialect);
      const darjaLine = picked ? `\n${stripTashkeel(picked.variant.text)}` : '';
      const textToCopy = `${stripTashkeel(currentQuote.text)}${darjaLine}\n\n— ${quoteByline(currentQuote)}\nمنصة كلماتي: ${quoteUrl(currentQuote)}`;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const formattedDate = new Date(currentQuote.publishedAt).toLocaleDateString('ar-DZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Apply typography and theme classes based on customStyle
  const fontClass = 
    customStyle.fontId === 'ruqaa-ink' ? 'font-ruqaa-ink' :
    customStyle.fontId === 'rakkas' ? 'font-rakkas' :
    customStyle.fontId === 'kufi-ink' ? 'font-kufi-ink' :
    customStyle.fontId === 'ruqaa' ? 'font-ruqaa' :
    customStyle.fontId === 'amiri' ? 'font-amiri' :
    customStyle.fontId === 'kufi' ? 'font-kufi' :
    customStyle.fontId === 'naskh' ? 'font-naskh' : 'font-cairo';

  const themeCardClasses = 
    customStyle.themeId === 'vintage' 
      ? 'bg-grain-vintage text-[#28211b] border-amber-900/20 shadow-amber-950/10' 
      : customStyle.themeId === 'white'
      ? 'bg-grain-white text-[#111827] border-stone-200 shadow-stone-200/50'
      : 'bg-grain-dark text-[#f5f5f7] border-amber-600/30 shadow-2xl';

  const innerBorderClasses =
    customStyle.themeId === 'vintage'
      ? 'border-amber-900/25'
      : customStyle.themeId === 'white'
      ? 'border-stone-300/80'
      : 'border-amber-500/20';

  const isDarja = currentQuote.language === 'darja';
  const dialects = isDarja ? [] : availableDialects(currentQuote);
  const shownDialect = pickDialect(currentQuote, preferredDialect)?.id ?? null;

  return (
    <div className="relative group transition-all duration-300 w-full max-w-2xl mx-auto">
      {/* Outer ornamental frame */}
      <div className={`p-2 rounded-3xl border-2 transition-all duration-500 ${themeCardClasses}`}>
        {/* Inner fine double frame with delicate corner accents */}
        <div className={`relative p-6 sm:p-9 rounded-2xl border ${innerBorderClasses} overflow-hidden`}>
          
          {/* Subtle ornamental corners */}
          <div className="absolute top-2 right-2 text-amber-500/40 text-xs select-none">✦</div>
          <div className="absolute top-2 left-2 text-amber-500/40 text-xs select-none">✦</div>
          <div className="absolute bottom-2 right-2 text-amber-500/40 text-xs select-none">✦</div>
          <div className="absolute bottom-2 left-2 text-amber-500/40 text-xs select-none">✦</div>

          {/* Top header: Dialect Badge, Topics, & Quick Copy */}
          <div className="flex items-center justify-between gap-2 mb-6 flex-wrap">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border ${
                isDarja
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                  : 'bg-rose-500/15 text-rose-400 border-rose-500/40'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isDarja ? 'bg-amber-400' : 'bg-rose-400'}`} />
                {shownDialect ? `فصحى · ${dialectInfo(shownDialect).name}` : quoteLabel(currentQuote)}
              </span>

              {/* Topics */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {currentQuote.topics.map((topic) => (
                  <span
                    key={topic}
                    className="px-2 py-0.5 rounded-md text-[11px] bg-white/5 text-stone-400 hover:text-stone-200 border border-white/5 transition-colors cursor-pointer"
                    onClick={() => {
                      setActiveTab('library');
                    }}
                  >
                    #{topic}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Actions (Copy, View Details) */}
            <div className="flex items-center gap-1">


              <button
                onClick={handleCopyText}
                className="p-1.5 rounded-lg text-stone-400 hover:text-amber-400 hover:bg-white/5 transition-colors cursor-pointer"
                title="نسخ نص الاقتباس"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Central Calligraphic Quote Body */}
          <div className="text-center my-6 sm:my-8 px-2 sm:px-4">
            {/* Top flourish */}
            <div className="flex items-center justify-center gap-2 mb-4 text-amber-500/40 select-none">
              <span className="w-8 h-[1px] bg-amber-500/30" />
              <span className="text-sm">❦</span>
              <span className="w-8 h-[1px] bg-amber-500/30" />
            </div>

            <QuoteText quote={currentQuote} style={customStyle} className="py-3 sm:py-4 transition-all duration-300" />

            {/* اختيار اللهجة: يظهر عند توفّر أكثر من صيغة، والاختيار يُحفظ لكل المقولات */}
            {dialects.length > 0 && (
              <div className="flex items-center justify-center gap-1.5 flex-wrap mt-4" role="group" aria-label="لهجة الصيغة المرافقة">
                {dialects.map((id) => {
                  const active = id === shownDialect;
                  return (
                    <button
                      key={id}
                      onClick={() => setPreferredDialect(id)}
                      aria-pressed={active}
                      className={`px-3 h-7 rounded-full text-[11px] transition-all cursor-pointer ${
                        active ? 'glass-pill text-[#e8b931] font-bold' : 'text-stone-400 hover:text-stone-200 border border-white/10'
                      }`}
                    >
                      {dialectInfo(id).name}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ختم الشمع باسم الكاتب يختم المقولة */}
            <div className="flex items-center justify-center gap-3 mt-6 select-none">
              <span className="w-12 h-[1px] bg-amber-500/30" />
              {isFolk(currentQuote) ? (
                <span className="text-xs">✦ ✧ ✦</span>
              ) : (
                <WaxSeal size={64} light={customStyle.themeId !== 'dark'} />
              )}
              <span className="w-12 h-[1px] bg-amber-500/30" />
            </div>
          </div>

          {/* Author Signature & Publication Meta */}
          <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-6 text-xs text-stone-400">
            <button
              onClick={() => {
                if (!isFolk(currentQuote)) setActiveTab('author');
              }}
              className="flex items-center gap-1.5 hover:text-amber-400 transition-colors font-medium font-cairo cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-cairo">
                {isFolk(currentQuote) ? (
                  <strong className="text-stone-200 font-semibold font-cairo">{quoteByline(currentQuote)}</strong>
                ) : (
                  <>بقلم: <strong className="text-stone-200 font-semibold font-cairo">{currentQuote.author}</strong></>
                )}
              </span>
            </button>

            <div className="flex items-center gap-1.5 text-stone-400 text-[11px]">
              <Calendar className="w-3.5 h-3.5 opacity-60" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Saved Tag & Note preview if already saved */}
          {saved && (
            <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  وصلتك في وقتها
                </span>
                {savedEntry?.emotionTag && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px]">
                    {savedEntry.emotionTag}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowNoteEditor(!showNoteEditor)}
                className="text-stone-400 hover:text-amber-300 text-[11px] underline cursor-pointer"
              >
                {savedEntry?.privateNote ? 'تعديل ملاحظتك' : 'إضافة ملاحظة'}
              </button>
            </div>
          )}

          {/* Interactive Note & Emotion Tag Drawer */}
          {showNoteEditor && (
            <div className="mt-4 p-4 rounded-xl bg-stone-900/90 border border-amber-500/30 space-y-3 text-right animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-300">كيف لامست هذه الكلمة قلبك؟ (خاصة بك)</h4>
                {saved && (
                  <button
                    onClick={() => {
                      removeSavedQuote(currentQuote.id);
                      setShowNoteEditor(false);
                    }}
                    className="text-rose-400 hover:text-rose-300 text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    حذف من المحفوظات
                  </button>
                )}
              </div>

              {/* Emotion tags */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {EMOTION_OPTIONS.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setSelectedEmotion(selectedEmotion === item.label ? undefined : item.label)}
                    className={`px-2.5 py-1 rounded-full text-xs flex items-center gap-1 border transition-all cursor-pointer ${
                      selectedEmotion === item.label
                        ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold shadow-xs'
                        : 'bg-white/5 text-stone-300 border-white/10 hover:border-amber-500/40'
                    }`}
                  >
                    <span>{item.emoji}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Private note text area */}
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="اكتب خاطرك أو الموقف الذي تذكرته حين قرأتها.. (لن يُنشر ويُحفظ على جهازك فقط)"
                rows={2}
                className="w-full p-2.5 text-xs rounded-lg bg-black/40 border border-white/10 text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowNoteEditor(false)}
                  className="px-3 py-1 rounded-lg text-xs text-stone-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveNoteAndEmotion}
                  className="px-4 py-1 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors"
                >
                  حفظ في مجموعتي
                </button>
              </div>
            </div>
          )}

          {/* "Behind the Words" (وراء الكلمات) Author Commentary */}
          {showBehind && currentQuote.behindTheWords && (
            <div className="mt-5 p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-stone-300 leading-relaxed space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 font-bold text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>وراء الكلمات — إضاءة الكاتب</span>
              </div>
              <p className="text-stone-300/95 font-cairo text-[13px] leading-relaxed">{currentQuote.behindTheWords}</p>
            </div>
          )}

          {/* Primary Action Buttons Bar (Section 4) */}
          {showActions && (
            <div className="flex items-center justify-between gap-1.5 sm:gap-2 mt-6 pt-4 border-t border-white/10 flex-wrap">
              {/* وصلتني في وقتها */}
              <button
                onClick={handleToggleSave}
                className={`flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer active:scale-95 ${
                  saved
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-xs'
                    : 'bg-white/5 hover:bg-rose-500/10 text-stone-300 hover:text-rose-300 border-white/10 hover:border-rose-500/30'
                }`}
                title="احفظ هذه الحكمة في مجموعتك الخاصة"
              >
                <Heart className={`w-4 h-4 ${saved ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{saved ? 'وصلتني في وقتها' : 'وصلتني في وقتها'}</span>
              </button>

              {/* مشاركة (توليد بطاقات) */}
              <button
                onClick={() => openShareModal(currentQuote)}
                className="flex-1 min-w-[90px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-white/5 hover:bg-amber-500/10 text-stone-300 hover:text-amber-300 border border-white/10 hover:border-amber-500/30 transition-all cursor-pointer active:scale-95"
                title="توليد بطاقات مشاركة للستوري والمنشورات"
              >
                <Share2 className="w-4 h-4 text-amber-400" />
                <span>مشاركة</span>
              </button>

              {/* اكتب خاطرك */}
              <button
                onClick={() => setShowNoteEditor(!showNoteEditor)}
                className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-stone-300 border border-white/10 transition-all cursor-pointer"
                title="تدوين ملاحظة شخصية خاصة بك"
              >
                <PenTool className="w-3.5 h-3.5 text-stone-400" />
                <span>اكتب خاطرك</span>
              </button>

              {/* وراء الكلمات (إن توفر شرح من الكاتب) */}
              {currentQuote.behindTheWords && (
                <button
                  onClick={() => setShowBehind(!showBehind)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1 cursor-pointer ${
                    showBehind
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-white/5 text-stone-400 hover:text-amber-300 border-white/10 hover:border-amber-500/20'
                  }`}
                  title="شرح وخلفية الاقتباس من الكاتب"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">وراء الكلمات</span>
                  {showBehind ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}

              {/* رابط الصفحة المستقلة */}
              <button
                onClick={() => {
                  setSelectedQuoteId(currentQuote.id);
                  setActiveTab('quote-detail');
                }}
                className="py-2 px-2.5 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-stone-400 hover:text-stone-200 border border-white/10 cursor-pointer"
                title="الصفحة الدائمة للاقتباس"
              >
                رابط مستقل
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
