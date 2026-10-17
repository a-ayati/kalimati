import React from 'react';
import { useKalimati } from '../context/KalimatiContext';
import { QuoteCard } from '../components/QuoteCard';
import { 
  User, 
  MapPin, 
  Award, 
  Share2, 
  Send, 
  CheckCircle, 
  Mail, 
  Sparkles,
  BookOpen
} from 'lucide-react';

export const AuthorView: React.FC = () => {
  const { author, quotes } = useKalimati();

  // Published quotes by this author
  const authorQuotes = quotes.filter((q) => q.status === 'published' && q.author === author.name);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-8 text-right">
      
      {/* Author Bio Banner */}
      <div className="p-6 sm:p-9 rounded-3xl bg-[#141518] border border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar / Seal */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-amber-600/30 to-amber-950/60 border-2 border-amber-500/40 p-1 flex items-center justify-center shrink-0 shadow-lg">
            <div className="w-full h-full rounded-xl bg-[#0d0e11] flex flex-col items-center justify-center text-amber-400">
              <span className="font-amiri text-3xl font-bold">ش</span>
              <span className="text-[10px] text-amber-500/80 font-cairo tracking-wider">المطوع</span>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 text-center sm:text-right space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold font-amiri text-white">
                    {author.name}
                  </h1>
                  <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400" title="كاتب ومؤلف معتمد">
                    <CheckCircle className="w-4 h-4" />
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-amber-400 font-medium mt-0.5">
                  {author.title}
                </p>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-xs text-stone-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>{author.location}</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-cairo">
              {author.bio}
            </p>

            {/* Social channels */}
            <div className="flex items-center justify-center sm:justify-start gap-2 pt-2 flex-wrap">
              {author.socials.x && (
                <a
                  href={author.socials.x}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 text-xs flex items-center gap-1.5 border border-white/5 transition-colors"
                >
                  <span>منصة X</span>
                </a>
              )}
              {author.socials.instagram && (
                <a
                  href={author.socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 text-xs flex items-center gap-1.5 border border-white/5 transition-colors"
                >
                  <span>إنستغرام</span>
                </a>
              )}
              {author.socials.telegram && (
                <a
                  href={author.socials.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 text-xs flex items-center gap-1.5 border border-white/5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-sky-400" />
                  <span>قناة تيليجرام</span>
                </a>
              )}
              {author.socials.email && (
                <a
                  href={`mailto:${author.socials.email}`}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs flex items-center gap-1.5 border border-amber-500/20 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>مراسلة الكاتب</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Statement of Originality (Section 11 requirement) */}
      <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/25 space-y-2 text-xs text-stone-300 leading-relaxed">
        <div className="flex items-center gap-2 font-bold text-amber-300">
          <Award className="w-4 h-4" />
          <span>بيان الأصالة وحقوق التأليف:</span>
        </div>
        <p className="text-stone-300 font-cairo">
          {author.statementOfOriginality}
        </p>
      </div>

      {/* Author's Published Works Feed */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <h2 className="text-lg font-bold text-white">كتابات منشورة بقلم الكاتب ({authorQuotes.length})</h2>
          </div>
        </div>

        <div className="space-y-6">
          {authorQuotes.map((quote) => (
            <QuoteCard key={quote.id} quote={quote} variant="standard" showActions={true} />
          ))}
        </div>
      </div>

    </div>
  );
};
