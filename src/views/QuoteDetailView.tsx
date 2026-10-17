import React, { useState } from 'react';
import { useKalimati } from '../context/KalimatiContext';
import { QuoteCard } from '../components/QuoteCard';
import { stripTashkeel } from '../utils/tashkeel';
import { 
  ArrowRight, 
  Copy, 
  Check, 
  Share2, 
  User, 
  Calendar, 
  Tag, 
  Globe, 
  ShieldCheck, 
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';

export const QuoteDetailView: React.FC = () => {
  const { 
    quotes, 
    selectedQuoteId, 
    setActiveTab, 
    setSelectedQuoteId, 
    author, 
    openShareModal 
  } = useKalimati();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const quote = quotes.find((q) => q.id === selectedQuoteId) || quotes[0];

  // Related quotes sharing same topic
  const relatedQuotes = quotes.filter(
    (q) => q.id !== quote.id && q.status === 'published' && q.topics.some((t) => quote.topics.includes(t))
  ).slice(0, 3);

  const formattedDate = new Date(quote.publishedAt).toLocaleDateString('ar-DZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const quoteUrl = `https://kalimati.app/quote/${quote.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(quoteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  const handleCopyCleanText = async () => {
    try {
      const fullCitation = `"${stripTashkeel(quote.text)}"\n\n— بقلم: ${quote.author}\nالمصدر: منصة كلماتي (${quoteUrl})`;
      await navigator.clipboard.writeText(fullCitation);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch {}
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-8">
      
      {/* Schema.org Quotation Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Quotation',
            'text': stripTashkeel(quote.text),
            'creator': {
              '@type': 'Person',
              'name': quote.author,
              'url': 'https://kalimati.app/author',
            },
            'datePublished': quote.publishedAt,
            'inLanguage': quote.language === 'darja' ? 'ar-DZ' : 'ar',
            'isPartOf': {
              '@type': 'WebSite',
              'name': 'كلماتي',
              'url': 'https://kalimati.app',
            },
          }),
        }}
      />

      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between text-xs text-stone-400 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('library')}
          className="flex items-center gap-1.5 hover:text-amber-400 transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة إلى مكتبة الكلمات</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 border border-white/10 cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <LinkIcon className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'تم نسخ الرابط' : 'نسخ رابط الاقتباس'}</span>
          </button>
        </div>
      </div>

      {/* Main Quote Card */}
      <QuoteCard quote={quote} variant="featured" showActions={true} />

      {/* Section 11: Documented Attribution & Text Copying Section */}
      <div className="bg-[#141518] rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>توثيق النسبة وحقوق الكتابة الأصلية</span>
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              صفحة عامة ذات رابط ثابت ومحتوى قابل للقراءة والفهرسة
            </p>
          </div>

          <button
            onClick={handleCopyCleanText}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
          >
            {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedText ? 'تم نسخ النص مع النسبة' : 'نسخ النص للاقتباس'}</span>
          </button>
        </div>

        {/* Text Area for Screen Readers & Direct Copying */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
          <div className="text-xs font-semibold text-stone-400">النص الفعلي القابل للقراءة والنسخ:</div>
          <p className="text-base sm:text-lg font-cairo text-stone-200 leading-relaxed select-all">
            {stripTashkeel(quote.text)}
          </p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <div className="text-stone-400 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>الكاتب والمؤلف:</span>
            </div>
            <button
              onClick={() => setActiveTab('author')}
              className="font-bold text-stone-200 hover:text-amber-300 transition-colors text-sm underline cursor-pointer"
            >
              {quote.author}
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <div className="text-stone-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>تاريخ النشر الفعلي:</span>
            </div>
            <div className="font-semibold text-stone-200">{formattedDate}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <div className="text-stone-400 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>اللغة والأسلوب:</span>
            </div>
            <div className="font-semibold text-stone-200">
              {quote.language === 'darja' ? 'الدارجة الجزائرية الأصيلة' : 'اللغة العربية الفصحى'}
            </div>
          </div>
        </div>

        {/* Provenance and Legal Clarification (Section 11 requirement) */}
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20 text-[11px] text-stone-400 leading-relaxed space-y-1.5">
          <div className="font-bold text-amber-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>حول الفهرسة وحماية الحقوق الأدبية:</span>
          </div>
          <p>
            تحتفظ المنصة بسجل التعديلات والمسودات وتواريخ الإنشاء الداخلية كتوثيق لمسار الكتابة وتسهيل نسبة النصوص لصاحبها الأصلي شعيب المطوع.
            يُرجى العلم أن فهرسة جوجل لمحركات البحث هي أداة لاكتشاف المصدر وليست تسجيلًا قانونيًا رسميًا لحقوق التأليف. أهلية العبارات القصيرة للحماية تخضع لمدى أصالتها وقوانين الملكية الفكرية المعمول بها.
          </p>
        </div>
      </div>

      {/* Related Quotes Section */}
      {relatedQuotes.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-white/10">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-400" />
            <span>كلمات أخرى في ذات المعنى والموضوع</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedQuotes.map((rel) => (
              <div
                key={rel.id}
                onClick={() => {
                  setSelectedQuoteId(rel.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-4 rounded-2xl bg-[#141518] hover:bg-[#1a1c20] border border-white/10 hover:border-amber-500/30 transition-all cursor-pointer space-y-2 flex flex-col justify-between"
              >
                <p className="text-xs font-cairo text-stone-300 line-clamp-3 leading-relaxed">
                  {stripTashkeel(rel.text)}
                </p>
                <div className="flex items-center justify-between text-[10px] text-stone-500 pt-2 border-t border-white/5">
                  <span>{rel.author}</span>
                  <span className="text-amber-400 hover:underline">قراءة الاقتباس ←</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
