import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AuthorStudio } from '../components/AuthorStudio';
import { QuoteCard } from '../components/QuoteCard';
import { useKalimati } from '../context/KalimatiContext';
import { Quote, Language, QuoteStatus, DialectId } from '../types';
import { ALL_TOPICS, INITIAL_AUTHOR } from '../data/seedQuotes';
import { stripTashkeel } from '../utils/tashkeel';
import { adminApi, ApiError, QuoteInput } from '../lib/api';
import { DIALECTS, FOLK_AUTHOR, isFolk, quoteDialectId, quoteLabel } from '../utils/dialects';
import { 
  Lock, 
  Unlock, 
  Plus, 
  Edit3, 
  Trash2, 
  History, 
  BarChart2, 
  Download, 
  Upload, 
  Search, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Share2, 
  Globe, 
  Sparkles,
  Link2,
  Calendar,
  Mic,
  Image as ImageIcon,
  Loader2,
  LogOut,
  PenLine,
  BookOpen,
  Settings,
  Stethoscope
} from 'lucide-react';
import { CountUp, DoctorBubble, SectionHeader, SpecialistTile, StatTile, greeting } from '../components/ClinicParts';

/** تحويل تاريخ ISO إلى قيمة حقل datetime-local بالتوقيت المحلي */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const AdminView: React.FC = () => {
  const { author, openShareModal, refreshQuotes } = useKalimati();

  // الدخول: كلمة مرور يتحقق منها الخادم، وجلسة في ملف تعريف آمن لا تصل إليه الصفحة
  const [authState, setAuthState] = useState<'checking' | 'out' | 'in' | 'unconfigured' | 'offline'>('checking');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const flash = useCallback((kind: 'ok' | 'error', text: string) => {
    setNotice({ kind, text });
    window.setTimeout(() => setNotice(null), 4000);
  }, []);

  const loadQuotes = useCallback(async () => {
    const { quotes: all } = await adminApi.list();
    setQuotes(all);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const me = await adminApi.me();
        if (!me.configured) return setAuthState('unconfigured');
        if (!me.authenticated) return setAuthState('out');
        await loadQuotes();
        setAuthState('in');
      } catch {
        setAuthState('offline');
      }
    })();
  }, [loadQuotes]);

  const handleError = useCallback(
    (e: unknown) => {
      if (e instanceof ApiError && e.status === 401) {
        setAuthState('out');
        return;
      }
      flash('error', e instanceof Error ? e.message : 'حدث خطأ غير متوقع.');
    },
    [flash]
  );

  /** بعد أي تعديل: نحدّث جدول الكاتب وما يراه القرّاء */
  const afterChange = useCallback(async () => {
    await loadQuotes();
    await refreshQuotes();
  }, [loadQuotes, refreshQuotes]);

  // Edit / Create Quote modal state
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form fields
  const [formText, setFormText] = useState('');
  const [formDialects, setFormDialects] = useState<Partial<Record<DialectId, string>>>({});
  const [formSource, setFormSource] = useState('');
  const [formSourceNote, setFormSourceNote] = useState('');
  const [formFeaturedDate, setFormFeaturedDate] = useState('');
  const [formAssisted, setFormAssisted] = useState(false);
  const [formAuthor, setFormAuthor] = useState(author.name);
  const [formLanguage, setFormLanguage] = useState<Language>('fusha');
  // القول باللهجة: لهجته، وهل هو مثل شعبي أم من كتابة شعيب
  const [formDialect, setFormDialect] = useState<DialectId>('dz');
  const [formFolk, setFormFolk] = useState(false);
  const [formTopics, setFormTopics] = useState<string[]>(['الطمأنينة']);
  const [formStatus, setFormStatus] = useState<QuoteStatus>('published');
  const [formPublishedAt, setFormPublishedAt] = useState(toLocalInput(new Date().toISOString()));
  const [formBehindTheWords, setFormBehindTheWords] = useState('');
  const [formPairedQuoteId, setFormPairedQuoteId] = useState<string>('');
  const [formRevisionNote, setFormRevisionNote] = useState('');

  // Selected quote for viewing revision history
  const [historyQuote, setHistoryQuote] = useState<Quote | null>(null);
  // معاينة المنشور كما سيراه القرّاء
  const [previewQuote, setPreviewQuote] = useState<Quote | null>(null);
  const [showFormPreview, setShowFormPreview] = useState(true);

  // Search in admin table
  const [adminSearch, setAdminSearch] = useState('');
  // قسم العيادة المفتوح
  const [section, setSection] = useState<'home' | 'studio' | 'schedule' | 'library' | 'stats' | 'log' | 'settings'>('home');

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || isBusy) return;
    setIsBusy(true);
    setPinError(null);
    try {
      await adminApi.login(pin);
      setPin('');
      await loadQuotes();
      setAuthState('in');
    } catch (err) {
      setPinError(err instanceof Error ? err.message : 'تعذّر تسجيل الدخول.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleLogout = async () => {
    try {
      await adminApi.logout();
    } catch {
      // حتى لو فشل الطلب نُغلق الواجهة
    }
    setQuotes([]);
    setAuthState('out');
  };

  const handleDelete = async (q: Quote) => {
    if (!confirm('هل أنت متأكد من حذف هذه الخاطرة نهائيًا؟')) return;
    try {
      await adminApi.remove(q.id);
      await afterChange();
      flash('ok', 'حُذفت الخاطرة.');
    } catch (err) {
      handleError(err);
    }
  };

  // نسخة احتياطية كاملة لكل الأقوال (مع المسودات وسجل التعديلات)
  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), quotes }, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `kalimati-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleImport = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data?.quotes)) throw new Error('الملف لا يحتوي على أقوال.');
      if (!confirm(`سيتم استيراد ${data.quotes.length} قولاً، وتحديث الموجود منها بنفس المعرّف. متابعة؟`)) return;
      const { imported } = await adminApi.importQuotes(data.quotes);
      await afterChange();
      flash('ok', `تم استيراد ${imported} قولاً.`);
    } catch (err) {
      handleError(err);
    }
  };

  // Open modal to create quote
  const handleStartCreate = () => {
    setIsCreatingNew(true);
    setEditingQuoteId(null);
    setFormText('');
    setFormSource(''); setFormSourceNote(''); setFormFeaturedDate(''); setFormAssisted(false);
    setFormDialects({});
    setFormAuthor(author.name);
    setFormLanguage('fusha');
    setFormDialect('dz');
    setFormFolk(false);
    setFormTopics(['الطمأنينة']);
    setFormStatus('published');
    setFormPublishedAt(toLocalInput(new Date().toISOString()));
    setFormBehindTheWords('');
    setFormPairedQuoteId('');
    setFormRevisionNote('');
  };

  // Open modal to edit existing quote
  const handleStartEdit = (quote: Quote) => {
    setEditingQuoteId(quote.id);
    setIsCreatingNew(false);
    setFormText(quote.text);
    setFormSource(quote.sourceUrl || ''); setFormSourceNote(quote.sourceNote || ''); setFormFeaturedDate(quote.featuredDate || ''); setFormAssisted(quote.aiAssisted || false);
    setFormDialects({});
    setFormAuthor(quote.author);
    setFormLanguage(quote.language);
    setFormDialect(quoteDialectId(quote));
    setFormFolk(isFolk(quote));
    setFormTopics(quote.topics);
    setFormStatus(quote.status);
    setFormPublishedAt(toLocalInput(quote.publishedAt));
    setFormBehindTheWords(quote.behindTheWords || '');
    setFormPairedQuoteId(quote.pairedQuoteId || '');
    setFormRevisionNote('');
  };

  /** المنشور كما سيظهر، من حقول المحرّر مباشرة */
  const draftPreview = (): Quote => {
    const existing = editingQuoteId ? quotes.find((q) => q.id === editingQuoteId) : undefined;
    const world = formLanguage === 'en' || formLanguage === 'fr';
    return {
      id: existing?.id || 'draft-preview',
      slug: existing?.slug || 'draft-preview',
      text: formText || '…',
      plainText: stripTashkeel(formText),
      language: formLanguage,
      dialect: formLanguage === 'darja' ? formDialect : undefined,
      author: world ? formAuthor : formLanguage === 'darja' && formFolk ? FOLK_AUTHOR : INITIAL_AUTHOR.name,
      sourceUrl: formSource || undefined,
      sourceNote: formSourceNote || undefined,
      topics: formTopics,
      status: formStatus,
      createdAt: existing?.createdAt || new Date().toISOString(),
      publishedAt: new Date(formPublishedAt || Date.now()).toISOString(),
      revisions: [],
      stats: { readsCount: 0, savesCount: 0, sharesCount: 0 },
    };
  };

  // حفظ القول على الخادم
  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formText.trim() || isBusy) return;

    const plainText = stripTashkeel(formText);
    const existing = editingQuoteId ? quotes.find((q) => q.id === editingQuoteId) : undefined;
    const payload: QuoteInput = {
      // الرابط يُولَّد على الخادم للقول الجديد، ويُحفظ كما هو عند التعديل حتى لا تنكسر الروابط المشاركة
      slug: existing?.slug || plainText,
      text: formText,
      plainText,
      author: formLanguage === 'en' || formLanguage === 'fr' ? formAuthor : formLanguage === 'darja' && formFolk ? FOLK_AUTHOR : INITIAL_AUTHOR.name,
      sourceUrl: formSource || undefined, sourceNote: formSourceNote || undefined, featuredDate: formFeaturedDate || undefined, aiAssisted: formAssisted,
      language: formLanguage,
      dialect: formLanguage === 'darja' ? formDialect : undefined,
      topics: formTopics,
      status: formStatus,
      publishedAt: new Date(formPublishedAt).toISOString(),
      behindTheWords: formBehindTheWords.trim() || undefined,
      pairedQuoteId: formPairedQuoteId || undefined,
      revisionNote: formRevisionNote.trim() || undefined,
    };

    setIsBusy(true);
    try {
      if (isCreatingNew) {
        await adminApi.create(payload);
        flash('ok', 'حُفظت الخاطرة.');
      } else if (editingQuoteId) {
        await adminApi.update(editingQuoteId, payload);
        flash('ok', 'حُفظت التعديلات.');
      }
      await afterChange();
      setIsCreatingNew(false);
      setEditingQuoteId(null);
    } catch (err) {
      handleError(err);
    } finally {
      setIsBusy(false);
    }
  };

  // Toggle topic selection
  const handleToggleTopic = (topic: string) => {
    if (formTopics.includes(topic)) {
      if (formTopics.length > 1) {
        setFormTopics(formTopics.filter((t) => t !== topic));
      }
    } else {
      setFormTopics([...formTopics, topic]);
    }
  };

  // Calculate aggregate stats
  const totalSaves = quotes.reduce((acc, q) => acc + (q.stats?.savesCount || 0), 0);
  const totalShares = quotes.reduce((acc, q) => acc + (q.stats?.sharesCount || 0), 0);
  const totalPublished = quotes.filter((q) => q.status === 'published').length;
  const totalDrafts = quotes.filter((q) => q.status === 'draft' || q.status === 'scheduled').length;

  if (authState !== 'in') {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-16 text-center">
        <div className="p-8 rounded-3xl bg-[#141518] border border-white/10 shadow-2xl space-y-5">
          <div className="w-16 h-16 rounded-full clinic-gradient text-white flex items-center justify-center mx-auto shadow-lg">
            <Stethoscope className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-white">
              عيادة <span className="clinic-accent">كلماتي</span>
            </h1>
            <p className="text-xs text-stone-400 mt-2 leading-relaxed">
              أهلاً بك. أدخل كلمة المرور لأعرض عليك حالة خواطرك.
            </p>
          </div>

          {authState === 'checking' && (
            <div className="flex justify-center py-4 text-stone-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}

          {authState === 'offline' && (
            <p className="text-xs text-rose-300 leading-relaxed">
              لا يمكن الوصول إلى الخادم الآن. تأكد من اتصالك بالإنترنت ثم أعد تحميل الصفحة.
            </p>
          )}

          {authState === 'unconfigured' && (
            <p className="text-xs text-amber-200 leading-relaxed">
              لم تُضبط كلمة مرور الكاتب على الخادم بعد. أضفها كسرّ باسم <code>ADMIN_PASSWORD</code> في إعدادات النشر.
            </p>
          )}

          {authState === 'out' && (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="كلمة المرور"
                  autoComplete="current-password"
                  className="w-full text-center text-lg p-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
                {pinError && (
                  <p className="text-xs text-rose-400 mt-2 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {pinError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isBusy || !pin}
                className="w-full py-3 rounded-xl font-bold text-sm clinic-gradient disabled:opacity-60 text-white transition-opacity cursor-pointer flex items-center justify-center gap-2"
              >
                {isBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>دخول</span>
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Filtered quotes in admin
  const filteredAdminQuotes = quotes.filter((q) => {
    if (!adminSearch.trim()) return true;
    const clean = stripTashkeel(adminSearch.toLowerCase());
    return (
      stripTashkeel(q.text.toLowerCase()).includes(clean) ||
      stripTashkeel(q.author.toLowerCase()).includes(clean) ||
      q.topics.some((t) => stripTashkeel(t.toLowerCase()).includes(clean))
    );
  });

  // ——— تشخيص الدكتور: ملخص الحالة من البيانات الفعلية ———
  const now = Date.now();
  const writerQuotes = quotes.filter((q) => !isFolk(q));
  const upcoming = quotes
    .filter((q) => q.status === 'scheduled' && new Date(q.publishedAt).getTime() > now)
    .sort((a, b) => +new Date(a.publishedAt) - +new Date(b.publishedAt));
  const drafts = quotes.filter((q) => q.status === 'draft' || q.status === 'review');
  const live = quotes.filter((q) => q.status === 'published' || (q.status === 'scheduled' && new Date(q.publishedAt).getTime() <= now));
  const totalReads = quotes.reduce((acc, q) => acc + (q.stats?.readsCount || 0), 0);
  const topRead = [...live].sort((a, b) => (b.stats?.readsCount || 0) - (a.stats?.readsCount || 0))[0];
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('ar', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', numberingSystem: 'latn' } as Intl.DateTimeFormatOptions);
  const snippetOf = (q: Quote, n = 60) => {
    const t = stripTashkeel(q.text);
    return t.length > n ? t.slice(0, n) + '…' : t;
  };

  const diagnosis: string[] = [];
  if (upcoming.length) diagnosis.push(`عندك ${upcoming.length} ${upcoming.length === 1 ? 'خاطرة مجدولة' : 'خواطر مجدولة'}، أقربها ${fmtDate(upcoming[0].publishedAt)}.`);
  else diagnosis.push('لا خاطرة مجدولة الآن؛ جدول الأيام القادمة فارغ.');
  if (drafts.length) diagnosis.push(`و${drafts.length} ${drafts.length === 1 ? 'مسودة تنتظر' : 'مسودات تنتظر'} لمستك الأخيرة.`);
  if (topRead && (topRead.stats?.readsCount || 0) > 0) diagnosis.push(`الأكثر قراءة: «${snippetOf(topRead, 40)}».`);

  // آخر ما حدث: كل التعديلات مرتبة من الأحدث
  const activity = quotes
    .flatMap((q) => (q.revisions || []).map((r) => ({ q, r })))
    .sort((a, b) => +new Date(b.r.timestamp) - +new Date(a.r.timestamp))
    .slice(0, 40);

  const statusLabel = (q: Quote) =>
    q.status === 'published' ? 'منشور' : q.status === 'scheduled' ? 'مجدول' : q.status === 'review' ? 'قيد المراجعة' : 'مسودة';
  const statusBadge = (q: Quote) =>
    q.status === 'published'
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      : q.status === 'scheduled'
      ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
      : q.status === 'review'
      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
      : 'bg-stone-500/15 text-stone-400 border-stone-500/30';

  /** بطاقة قول في قوائم العيادة، مع أزرار المعاينة والسجل والتعديل والحذف */
  const QuoteRow = ({ q, meta }: { q: Quote; meta?: React.ReactNode }) => (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
      <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
        <span className={`px-2 py-0.5 rounded-full border ${statusBadge(q)}`}>{statusLabel(q)}</span>
        <span className="px-2 py-0.5 rounded-full border border-white/10 text-stone-400">{quoteLabel(q)}</span>
        {q.topics.slice(0, 2).map((t) => (
          <span key={t} className="text-stone-500">#{t}</span>
        ))}
      </div>
      <p dir="auto" className="text-sm text-stone-200 leading-relaxed line-clamp-2 text-start">{stripTashkeel(q.text)}</p>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] text-stone-500 min-w-0 truncate">{meta ?? fmtDate(q.publishedAt)}</div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => setPreviewQuote(q)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-200 bg-white/5 border border-white/10 hover:border-[#e5483b]/40 flex items-center gap-1"
            title="معاينة المنشور"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>معاينة</span>
          </button>
          <button onClick={() => openShareModal(q)} className="p-2 rounded-lg text-stone-400 hover:text-amber-400 hover:bg-white/5" title="معاينة بطاقة المشاركة">
            <Share2 className="w-4 h-4" />
          </button>
          <button onClick={() => setHistoryQuote(q)} className="p-2 rounded-lg text-stone-400 hover:text-sky-400 hover:bg-white/5" title="سجل التعديلات">
            <History className="w-4 h-4" />
          </button>
          <button onClick={() => handleStartEdit(q)} className="p-2 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-white/5" title="تعديل">
            <Edit3 className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(q)} className="p-2 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-white/5" title="حذف">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const back = () => {
    setSection('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const open = (s: typeof section) => {
    setSection(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const topBy = (key: 'readsCount' | 'savesCount' | 'sharesCount') =>
    [...live].sort((a, b) => (b.stats?.[key] || 0) - (a.stats?.[key] || 0)).filter((q) => (q.stats?.[key] || 0) > 0).slice(0, 5);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {notice && (
        <div
          className={`fixed bottom-28 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-xs font-bold shadow-xl text-white ${
            notice.kind === 'ok' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {notice.text}
        </div>
      )}

      <a
        href="/templates/cinematic/index.html"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full rounded-2xl bg-amber-400 px-5 py-4 font-bold text-black shadow-lg shadow-amber-500/10 hover:bg-amber-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300"
      >
        <Sparkles className="w-5 h-5" aria-hidden="true" />
        القالب السينمائي — صمّم منشورًا
      </a>

      {section === 'home' && (
        <>
          {/* الرأس */}
          <div className="space-y-2 pt-2">
            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
              عيادة <span className="clinic-accent">كلماتي</span>
            </h1>
            <p className="text-sm text-stone-400 leading-relaxed">
              نسخة مصغّرة من «دكتور المحتوى» لمنصتك: دكتور يتابع حالة الخواطر، وفريق صغير معه للكتابة والمواعيد والأرقام.
            </p>
          </div>

          {/* الدكتور */}
          <DoctorBubble>{diagnosis.join(' ')}</DoctorBubble>

          {/* الترحيب والأرقام */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#141518] border border-white/10 space-y-5">
            <div className="space-y-2">
              <div className="text-sm font-semibold clinic-accent">{greeting()}</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">أهلاً بك في عيادة كلماتي</h2>
              <p className="text-sm text-stone-400 leading-relaxed">أتابع خواطرك وأمثالك، وما تحتاجه أحوّله إلى الاختصاصي المناسب.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatTile value={live.length} label="منشورة" tone="text-emerald-400" />
              <StatTile value={upcoming.length} label="قادمة" tone="text-sky-400" />
              <StatTile value={drafts.length} label="بانتظار مراجعتك" tone="text-amber-400" />
              <StatTile value={totalReads} label="قراءة" />
            </div>
          </div>

          {/* الاختصاصيون */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#141518] border border-white/10 space-y-2.5">
            <SpecialistTile icon={PenLine} title="الكاتب" desc="اكتب خاطرة جديدة أو أضف مثلاً شعبياً" onClick={handleStartCreate} />
            <SpecialistTile icon={Sparkles} title="الاستوديو" desc="من كلمة إلى حكمة، ومخطّط النشر لأسبوع كامل" onClick={() => open('studio')} />
            <SpecialistTile icon={Calendar} title="المواعيد" desc="الخواطر المجدولة والمسودات وموعد كل منها" badge={upcoming.length + drafts.length} onClick={() => open('schedule')} />
            <SpecialistTile icon={BookOpen} title="المكتبة" desc={`كل ما نُشر: ${writerQuotes.length} خاطرة و${quotes.length - writerQuotes.length} مثلاً`} onClick={() => open('library')} />
            <SpecialistTile icon={BarChart2} title="الإحصائي" desc="أكثر الخواطر قراءة وحفظاً ومشاركة" onClick={() => open('stats')} />
            <SpecialistTile icon={FileText} title="الملف" desc="سجل كل ما حدث في المنصة" onClick={() => open('log')} />
            <SpecialistTile icon={Settings} title="الإعدادات" desc="نسخة احتياطية، الفهرسة في جوجل، الخروج" onClick={() => open('settings')} />
          </div>
        </>
      )}

      {section === 'studio' && (
        <div className="space-y-5">
          <SectionHeader title="الاستوديو" desc="مسودات ومراجعة ومخطّط نشر أسبوعي. لا يُنشر شيء دون اعتمادك." onBack={back} />
          <AuthorStudio
            quotes={quotes}
            onChanged={afterChange}
            onReference={(reference) => {
              handleStartCreate();
              setFormText(reference.text);
              setFormLanguage(reference.language);
              setFormAuthor(reference.author);
              setFormSource(reference.sourceUrl);
              setFormSourceNote(reference.sourceNote);
              setFormStatus('draft');
            }}
            onEdit={(text, language, assisted) => {
              handleStartCreate();
              setFormText(text);
              setFormLanguage(language);
              setFormAssisted(assisted);
              setFormStatus('draft');
            }}
          />
        </div>
      )}

      {section === 'schedule' && (
        <div className="space-y-5">
          <SectionHeader
            title="المواعيد"
            desc="ما سيُنشر قريباً، وما ينتظر مراجعتك."
            onBack={back}
            action={
              <button onClick={handleStartCreate} className="clinic-gradient text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer active:scale-95">
                <Plus className="w-4 h-4" />
                <span>جدولة خاطرة</span>
              </button>
            }
          />
          <div className="space-y-2.5">
            <h3 className="text-sm font-bold text-stone-300">القادمة ({upcoming.length})</h3>
            {upcoming.length ? upcoming.map((q) => <QuoteRow key={q.id} q={q} meta={`تُنشر ${fmtDate(q.publishedAt)}`} />) : (
              <div className="p-6 rounded-2xl border border-dashed border-white/10 text-center text-xs text-stone-500">لا شيء مجدول. اختر «جدولة خاطرة» وحدّد موعدها.</div>
            )}
          </div>
          <div className="space-y-2.5">
            <h3 className="text-sm font-bold text-stone-300">بانتظار مراجعتك ({drafts.length})</h3>
            {drafts.length ? drafts.map((q) => <QuoteRow key={q.id} q={q} meta={`آخر تعديل ${fmtDate(q.revisions?.[0]?.timestamp || q.createdAt)}`} />) : (
              <div className="p-6 rounded-2xl border border-dashed border-white/10 text-center text-xs text-stone-500">لا مسودات.</div>
            )}
          </div>
        </div>
      )}

      {section === 'library' && (
        <div className="space-y-5">
          <SectionHeader
            title="المكتبة"
            desc="ابحث وعدّل واحذف، أو عاين بطاقة المشاركة."
            onBack={back}
            action={
              <button onClick={handleStartCreate} className="clinic-gradient text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer active:scale-95">
                <Plus className="w-4 h-4" />
                <span>جديد</span>
              </button>
            }
          />
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
              placeholder="ابحث في النصوص أو الموضوعات…"
              className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-[#e5483b]/60"
            />
          </div>
          <div className="text-xs text-stone-500">{filteredAdminQuotes.length} نتيجة</div>
          <div className="space-y-2.5">
            {filteredAdminQuotes.map((q) => (
              <QuoteRow key={q.id} q={q} />
            ))}
          </div>
        </div>
      )}

      {section === 'stats' && (
        <div className="space-y-5">
          <SectionHeader title="الإحصائي" desc="أرقام إجمالية دون تتبّع لأي قارئ بعينه." onBack={back} />
          <div className="grid grid-cols-3 gap-3">
            <StatTile value={totalReads} label="قراءة" />
            <StatTile value={totalSaves} label="حفظ" tone="text-rose-400" />
            <StatTile value={totalShares} label="مشاركة" tone="text-amber-400" />
          </div>
          {([
            { key: 'readsCount', title: 'الأكثر قراءة' },
            { key: 'savesCount', title: 'الأكثر حفظاً («وصلتني في وقتها»)' },
            { key: 'sharesCount', title: 'الأكثر مشاركة' },
          ] as const).map(({ key, title }) => {
            const list = topBy(key);
            return (
              <div key={key} className="p-4 rounded-3xl bg-[#141518] border border-white/10 space-y-2.5">
                <h3 className="text-sm font-bold clinic-accent">{title}</h3>
                {list.length ? (
                  list.map((q, i) => (
                    <div key={q.id} className="flex items-center gap-3 text-sm">
                      <span className="w-6 h-6 rounded-full bg-white/5 text-[11px] text-stone-400 flex items-center justify-center shrink-0">{i + 1}</span>
                      <span dir="auto" className="flex-1 min-w-0 truncate text-stone-200 text-start">{snippetOf(q, 70)}</span>
                      <span className="font-bold tabular-nums text-white">
                        <CountUp value={q.stats?.[key] || 0} />
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-stone-500">لا أرقام بعد.</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {section === 'log' && (
        <div className="space-y-5">
          <SectionHeader title="الملف" desc="آخر ما حدث: إضافة، تعديل، جدولة." onBack={back} />
          <div className="space-y-2">
            {activity.length ? (
              activity.map(({ q, r }) => (
                <button
                  key={r.id + q.id}
                  onClick={() => setHistoryQuote(q)}
                  className="w-full p-3.5 rounded-2xl bg-white/5 border border-white/10 text-right space-y-1 cursor-pointer hover:border-white/20"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-semibold clinic-accent">{r.note}</span>
                    <span className="text-stone-500 shrink-0">{fmtDate(r.timestamp)}</span>
                  </div>
                  <div dir="auto" className="text-xs text-stone-300 truncate text-start">{snippetOf(q, 80)}</div>
                </button>
              ))
            ) : (
              <div className="p-6 rounded-2xl border border-dashed border-white/10 text-center text-xs text-stone-500">لا شيء بعد.</div>
            )}
          </div>
        </div>
      )}

      {section === 'settings' && (
        <div className="space-y-5">
          <SectionHeader title="الإعدادات" onBack={back} />
          <div className="p-4 rounded-3xl bg-[#141518] border border-white/10 space-y-2.5">
            <h3 className="text-sm font-bold clinic-accent">النسخة الاحتياطية</h3>
            <p className="text-xs text-stone-400">ملف بكل الخواطر والأمثال مع المسودات وسجل التعديلات.</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleExport} className="py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-stone-200 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-white/10">
                <Download className="w-4 h-4" />
                <span>تنزيل</span>
              </button>
              <button onClick={() => importInputRef.current?.click()} className="py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-stone-200 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-white/10">
                <Upload className="w-4 h-4" />
                <span>استيراد</span>
              </button>
            </div>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImport(file);
                e.target.value = '';
              }}
            />
          </div>

          <div className="p-4 rounded-3xl bg-[#141518] border border-white/10 space-y-2.5">
            <h3 className="text-sm font-bold clinic-accent flex items-center gap-1.5">
              <Globe className="w-4 h-4" />
              <span>الظهور في جوجل</span>
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              الصفحات جاهزة للفهرسة: عناوين فريدة وروابط ثابتة و<code>robots.txt</code> و<code>sitemap.xml</code>. عند ربط نطاقك الخاص: أثبت ملكيته في Google Search Console، ثم أرسل <code>/sitemap.xml</code>، واطلب فهرسة الصفحة الرئيسية وأهم الخواطر.
            </p>
          </div>

          <button onClick={handleLogout} className="w-full py-3 rounded-2xl border border-rose-500/30 text-rose-400 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-rose-500/10">
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      )}

      {/* Create / Edit Quote Modal */}
      {(isCreatingNew || editingQuoteId) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#141518] border border-amber-500/40 rounded-3xl p-6 sm:p-8 text-right max-h-[90vh] overflow-y-auto my-auto shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>{isCreatingNew ? 'إضافة خاطرة جديدة للمنصة' : 'تعديل وتوثيق الخاطرة'}</span>
            </h2>

            <form onSubmit={handleSaveQuote} className="space-y-4 text-xs">
              {/* Quote Text with Tashkeel */}
              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  نص القول بلغته الأصلية:
                </label>
                <textarea
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="مَا لِي أُبَالِي بِمَنْ لَا يُبَالِي"
                  rows={3}
                  required
                  className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-stone-100 font-serif text-sm leading-relaxed focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* النوع: خاطرة بالفصحى لشعيب، أو قول باللهجة (له أو مثل من التراث الشعبي) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">النوع:</label>
                  <select
                    value={formLanguage !== 'darja' ? formLanguage : formFolk ? 'folk' : 'own'}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormLanguage(v === 'fusha' || v === 'en' || v === 'fr' ? v : 'darja');
                      setFormFolk(v === 'folk');
                    }}
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-stone-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="fusha">خاطرة بالفصحى — بالختم</option>
                    <option value="en">اقتباس معروف بالإنجليزية</option>
                    <option value="fr">اقتباس معروف بالفرنسية</option>
                    <option value="folk">مثل شعبي باللهجة — من التراث</option>
                    <option value="own">قول باللهجة — بالختم</option>
                  </select>
                </div>

                {formLanguage === 'darja' && (
                  <div>
                    <label className="block text-stone-300 font-semibold mb-1">اللهجة:</label>
                    <select
                      value={formDialect}
                      onChange={(e) => setFormDialect(e.target.value as DialectId)}
                      className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-stone-200 focus:outline-none focus:border-amber-500"
                    >
                      {DIALECTS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {(formLanguage === 'en' || formLanguage === 'fr') && <label className="block">اسم قائل الاقتباس<input required className="w-full p-3 rounded-xl bg-black/40 border border-white/10" value={formAuthor} onChange={e=>setFormAuthor(e.target.value)} /></label>}
              <label className="block">رابط المصدر<input type="url" dir="ltr" className="w-full p-3 rounded-xl bg-black/40 border border-white/10" value={formSource} onChange={e=>setFormSource(e.target.value)} placeholder="https://…" /></label>
              <label className="block">مرجع النص أو المثل (اسم الكتاب، الصفحة، المجموعة…)<input className="w-full p-3 rounded-xl bg-black/40 border border-white/10" value={formSourceNote} onChange={e=>setFormSourceNote(e.target.value)} /></label>
              <label className="block">تخصيص كحكمة اليوم في تاريخ (اختياري)<input type="date" className="w-full p-3 rounded-xl bg-black/40 border border-white/10" value={formFeaturedDate} onChange={e=>setFormFeaturedDate(e.target.value)} /></label>
              <label className="flex gap-2"><input type="checkbox" checked={formAssisted} onChange={e=>setFormAssisted(e.target.checked)} />مسودة بمساعدة الذكاء الاصطناعي — راجعتها قبل الاعتماد</label>
              {/* معاينة المنشور: تتحدّث مع كل حرف */}
              <div className="rounded-2xl border border-white/10 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowFormPreview((v) => !v)}
                  className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold bg-white/5 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 clinic-accent">
                    <Eye className="w-4 h-4" />
                    معاينة المنشور
                  </span>
                  <span className="text-stone-400 font-normal">{showFormPreview ? 'إخفاء' : 'إظهار'}</span>
                </button>
                {showFormPreview && (
                  <div className="p-2 sm:p-3">
                    {formText.trim() ? (
                      <QuoteCard quote={draftPreview()} showActions={false} />
                    ) : (
                      <p className="text-center text-stone-500 py-6">اكتب النص لترى المنشور كما سيظهر للقرّاء.</p>
                    )}
                    <button
                      type="button"
                      disabled={!formText.trim()}
                      onClick={() => openShareModal(draftPreview())}
                      className="mt-2 w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-stone-200 font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      معاينة بطاقة المشاركة (ستوري ومنشور)
                    </button>
                  </div>
                )}
              </div>

              {/* Publication Status & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">حالة النشر:</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as QuoteStatus)}
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-stone-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="published">منشور (عام وظاهر للجميع)</option>
                    <option value="scheduled">مجدول (تاريخ مستقبلي)</option>
                    <option value="review">قيد المراجعة والتنقيح</option>
                    <option value="draft">مسودة خاصة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">تاريخ النشر العام:</label>
                  <input
                    type="datetime-local"
                    value={formPublishedAt}
                    onChange={(e) => setFormPublishedAt(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Topics Multi-select */}
              <div>
                <label className="block text-stone-300 font-semibold mb-1.5">الموضوعات والتصنيفات:</label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_TOPICS.map((topic) => {
                    const active = formTopics.includes(topic);
                    return (
                      <button
                        type="button"
                        key={topic}
                        onClick={() => handleToggleTopic(topic)}
                        className={`px-3 py-1 rounded-full border transition-all cursor-pointer ${
                          active
                            ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold'
                            : 'bg-white/5 text-stone-400 border-white/10 hover:border-white/20'
                        }`}
                      >
                        #{topic}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* "Behind the Words" (وراء الكلمات) */}
              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  وراء الكلمات (شرح أو إضاءة من الكاتب):
                </label>
                <textarea
                  value={formBehindTheWords}
                  onChange={(e) => setFormBehindTheWords(e.target.value)}
                  placeholder="المناسبة، الحكاية خلف الخاطرة، أو البعد الوجداني الذي نبعت منه..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-stone-200 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Future Media: Manuscript & Audio Voice slots (Section 10) */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="font-semibold text-stone-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>وسائط فنية مستقبلية (تجهيز الإضافات القادمة):</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-400">
                  <div className="p-2 rounded-xl bg-black/30 border border-white/5 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>مخطوطة فنية مرسومة (قريبًا)</span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/30 border border-white/5 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-amber-400" />
                    <span>تسجيل صوتي بصوت الكاتب (قريبًا)</span>
                  </div>
                </div>
              </div>

              {/* Revision note if editing */}
              {editingQuoteId && (
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">
                    ملاحظة التعديل (لتوثيق مسار الكتابة):
                  </label>
                  <input
                    type="text"
                    value={formRevisionNote}
                    onChange={(e) => setFormRevisionNote(e.target.value)}
                    placeholder="سبب أو طبيعة التعديل (مثال: ضبط حركة إعرابية، تعديل كلمة)"
                    className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-stone-200 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setEditingQuoteId(null);
                  }}
                  className="px-4 py-2 rounded-xl text-stone-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="px-6 py-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-950 transition-colors flex items-center gap-2"
                >
                  {isBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isCreatingNew ? 'حفظ الخاطرة' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* معاينة المنشور كما يراه القرّاء */}
      {previewQuote && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs overflow-y-auto p-4" onClick={() => setPreviewQuote(null)}>
          <div className="max-w-2xl mx-auto my-6 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between text-white">
              <div>
                <div className="text-lg font-bold">معاينة المنشور</div>
                <div className="text-xs text-stone-400">
                  {statusLabel(previewQuote)} · {previewQuote.status === 'scheduled' ? `يُنشر ${fmtDate(previewQuote.publishedAt)}` : fmtDate(previewQuote.publishedAt)}
                </div>
              </div>
              <button onClick={() => setPreviewQuote(null)} className="px-3 py-1.5 rounded-xl bg-white/10 text-sm cursor-pointer">
                إغلاق ✕
              </button>
            </div>
            <QuoteCard quote={previewQuote} showActions={false} />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const q = previewQuote;
                  setPreviewQuote(null);
                  openShareModal(q);
                }}
                className="py-3 rounded-2xl bg-white/10 text-white text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                بطاقة المشاركة
              </button>
              <button
                onClick={() => {
                  const q = previewQuote;
                  setPreviewQuote(null);
                  handleStartEdit(q);
                }}
                className="py-3 rounded-2xl clinic-gradient text-white text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                تعديل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revision History Modal (سجل التعديلات والتوثيق) */}
      {historyQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg bg-[#141518] border border-amber-500/30 rounded-3xl p-6 text-right shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                <span>سجل التعديلات وتوثيق المسار الأدبي</span>
              </h3>
              <button
                onClick={() => setHistoryQuote(null)}
                className="text-stone-400 hover:text-white text-xs"
              >
                إغلاق ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-stone-300 font-serif">
              "{historyQuote.text}"
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1 text-xs">
              {historyQuote.revisions && historyQuote.revisions.length > 0 ? (
                historyQuote.revisions.map((rev, idx) => (
                  <div key={rev.id || idx} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-amber-400">
                      <span>الإصدار #{historyQuote.revisions.length - idx}</span>
                      <span>{new Date(rev.timestamp).toLocaleString('ar-DZ')}</span>
                    </div>
                    <div className="font-semibold text-stone-200">{rev.note}</div>
                    {rev.text && <button className="text-amber-300 underline py-1" onClick={() => { handleStartEdit(historyQuote); setFormText(rev.text!); setFormRevisionNote('استعادة نص إصدار سابق للمراجعة'); setHistoryQuote(null); }}>استعادة النص في المحرّر للمراجعة</button>}
                    {rev.textSnippet && (
                      <div className="text-stone-400 font-mono text-[11px] pt-1 border-t border-white/5">
                        {rev.textSnippet}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-stone-400 text-center py-6">
                  هذه الخاطرة في نسختها الأصلية الأولى المعتمدة ولم يطرأ عليها تعديلات لاحقة.
                </div>
              )}
            </div>

            <p className="text-[10px] text-stone-500 leading-relaxed border-t border-white/5 pt-3">
              * تسجيل مسار التعديل والتواريخ الداخلية يُعين على إثبات الأسبقية والأصالة الأدبية في التدوين الرقمي.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
