import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useKalimati } from '../context/KalimatiContext';
import { Quote, Language, QuoteStatus, DialectId } from '../types';
import { ALL_TOPICS } from '../data/seedQuotes';
import { stripTashkeel } from '../utils/tashkeel';
import { adminApi, ApiError, QuoteInput } from '../lib/api';
import { DIALECTS, quoteDialects } from '../utils/dialects';
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
  LogOut
} from 'lucide-react';

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
  const [formAuthor, setFormAuthor] = useState(author.name);
  const [formLanguage, setFormLanguage] = useState<Language>('fusha');
  const [formTopics, setFormTopics] = useState<string[]>(['الطمأنينة']);
  const [formStatus, setFormStatus] = useState<QuoteStatus>('published');
  const [formPublishedAt, setFormPublishedAt] = useState(toLocalInput(new Date().toISOString()));
  const [formBehindTheWords, setFormBehindTheWords] = useState('');
  const [formPairedQuoteId, setFormPairedQuoteId] = useState<string>('');
  const [formRevisionNote, setFormRevisionNote] = useState('');

  // Selected quote for viewing revision history
  const [historyQuote, setHistoryQuote] = useState<Quote | null>(null);

  // Search in admin table
  const [adminSearch, setAdminSearch] = useState('');

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
    setFormDialects({});
    setFormAuthor(author.name);
    setFormLanguage('fusha');
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
    setFormDialects(
      Object.fromEntries(Object.entries(quoteDialects(quote)).map(([k, v]) => [k, v?.text || '']))
    );
    setFormAuthor(quote.author);
    setFormLanguage(quote.language);
    setFormTopics(quote.topics);
    setFormStatus(quote.status);
    setFormPublishedAt(toLocalInput(quote.publishedAt));
    setFormBehindTheWords(quote.behindTheWords || '');
    setFormPairedQuoteId(quote.pairedQuoteId || '');
    setFormRevisionNote('');
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
      dialectTexts: formLanguage === 'fusha' ? formDialects : undefined,
      plainText,
      author: formAuthor,
      language: formLanguage,
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
        <div className="p-8 rounded-3xl bg-[#141518] border border-amber-500/30 shadow-2xl space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <h1 className="text-xl font-bold font-amiri text-white">لوحة الكاتب</h1>
            <p className="text-xs text-stone-400 mt-2 leading-relaxed">
              لإدارة الأقوال والخواطر وجدولتها ومتابعة أثرها.
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
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-950 transition-colors cursor-pointer flex items-center justify-center gap-2"
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

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Unlock className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">صلاحيات الكاتب مفعلة</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-amiri text-white pt-2 pb-1 leading-normal tracking-wide">
            لوحة إدارة «كلماتي»
          </h1>
          <p className="text-xs text-stone-400">
            إدارة النصوص الأصلية، ربط الصيغ التوأم، جدولة المنشورات، وسجل التوثيق ومسار الكتابة.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleStartCreate}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-all cursor-pointer shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة خاطرة جديدة</span>
          </button>

          <button
            onClick={handleExport}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white border border-white/10 text-xs"
            title="تنزيل نسخة احتياطية من كل الأقوال"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => importInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white border border-white/10 text-xs"
            title="استيراد نسخة احتياطية"
          >
            <Upload className="w-4 h-4" />
          </button>
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

          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white border border-white/10 text-xs"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-xs font-bold shadow-xl ${
            notice.kind === 'ok' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Aggregate Stats Cards (Section 10 & 13: strictly anonymous aggregate metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-right">
        <div className="p-4 rounded-2xl bg-[#141518] border border-white/10 space-y-1">
          <div className="text-[11px] text-stone-400">إجمالي الأقوال المنشورة</div>
          <div className="text-2xl font-bold text-white font-amiri">{totalPublished}</div>
          <div className="text-[10px] text-emerald-400">متاحة للقراء وللفهرسة</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#141518] border border-white/10 space-y-1">
          <div className="text-[11px] text-stone-400">المسودات والمجدولة</div>
          <div className="text-2xl font-bold text-amber-400 font-amiri">{totalDrafts}</div>
          <div className="text-[10px] text-stone-500">مستبعدة من محركات البحث</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#141518] border border-white/10 space-y-1">
          <div className="text-[11px] text-stone-400">مرات الحفظ («وصلتني في وقتها»)</div>
          <div className="text-2xl font-bold text-rose-400 font-amiri">{totalSaves}</div>
          <div className="text-[10px] text-stone-500">إحصاء إجمالي دون كشف الخواطر</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#141518] border border-white/10 space-y-1">
          <div className="text-[11px] text-stone-400">مرات المشاركة والبطاقات</div>
          <div className="text-2xl font-bold text-amber-300 font-amiri">{totalShares}</div>
          <div className="text-[10px] text-stone-500">ستوري ومنشورات اجتماعية</div>
        </div>
      </div>

      {/* Section 12 Google Indexing & Search Console Readiness Guide */}
      <div className="p-5 rounded-3xl bg-amber-950/20 border border-amber-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span>جاهزية الفهرسة في Google Search Console</span>
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
            جاهز ومضبوط ✓
          </span>
        </div>
        <p className="text-xs text-stone-300 leading-relaxed">
          جميع الصفحات العامة معدّة للزحف الفوري: العناوين الفريدة، الروابط الثابتة، ملف <code>robots.txt</code>، خريطة الموقع <code>sitemap.xml</code>، وبيانات Schema.org المنظمة.
          عند نشر الموقع على نطاقك الخاص (Custom Domain)، اتبع الخطوات الأربع التالية:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-stone-400">
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
            <strong className="text-stone-200 block mb-0.5">1. التحقق:</strong>
            أثبت ملكية الموقع عبر Google Search Console بإضافة وسم أو سجل DNS.
          </div>
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
            <strong className="text-stone-200 block mb-0.5">2. إرسال الخريطة:</strong>
            أرسل رابط الخريطة: <code>/sitemap.xml</code> لجدولة الزحف الدوري.
          </div>
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
            <strong className="text-stone-200 block mb-0.5">3. طلب الفهرسة:</strong>
            افحص رابط الصفحة الرئيسية وأهم الاقتباسات واطلب فهرستها الأولوية.
          </div>
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
            <strong className="text-stone-200 block mb-0.5">4. متابعة التقارير:</strong>
            راقب أداء الكلمات المفتاحية واكتشاف المقالات وصحة الروابط Canonical.
          </div>
        </div>
      </div>

      {/* Quotes Management Table Toolbar */}
      <div className="bg-[#141518] p-4 rounded-3xl border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
              placeholder="ابحث في نصوص الأقوال أو الموضوعات للتحرير..."
              className="w-full pr-10 pl-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="text-xs text-stone-400">
            إجمالي السجلات: <strong className="text-white">{filteredAdminQuotes.length}</strong>
          </div>
        </div>

        {/* Quotes List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-white/10 text-stone-400">
                <th className="py-2.5 px-3">الخاطرة / القول</th>
                <th className="py-2.5 px-2">اللغة</th>
                <th className="py-2.5 px-2">الحالة</th>
                <th className="py-2.5 px-2">تاريخ النشر</th>
                <th className="py-2.5 px-2">الصيغة التوأم</th>
                <th className="py-2.5 px-3 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAdminQuotes.map((q) => {
                const isDarja = q.language === 'darja';
                const hasSister = !!q.pairedQuoteId;
                const statusBadge = 
                  q.status === 'published' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                  q.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' :
                  q.status === 'review' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                  'bg-stone-500/20 text-stone-400 border-stone-500/40';

                const statusLabel = 
                  q.status === 'published' ? 'منشور' :
                  q.status === 'scheduled' ? 'مجدول' :
                  q.status === 'review' ? 'قيد المراجعة' : 'مسودة';

                return (
                  <tr key={q.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 max-w-xs sm:max-w-md">
                      <div className="font-serif text-stone-200 line-clamp-2 leading-relaxed">
                        {q.text}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-stone-400">
                        {q.topics.map((t) => (
                          <span key={t} className="px-1.5 py-0.5 rounded bg-white/5">#{t}</span>
                        ))}
                        {q.behindTheWords && (
                          <span className="text-amber-400 flex items-center gap-0.5">
                            • به شرح
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-2 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] border ${
                        isDarja ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      }`}>
                        {isDarja ? 'دارجة' : 'فصحى'}
                      </span>
                    </td>

                    <td className="py-3 px-2 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] border ${statusBadge}`}>
                        {statusLabel}
                      </span>
                    </td>

                    <td className="py-3 px-2 whitespace-nowrap text-stone-400 text-[11px]">
                      {new Date(q.publishedAt).toLocaleDateString('ar-DZ')}
                    </td>

                    <td className="py-3 px-2 whitespace-nowrap">
                      {hasSister ? (
                        <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                          <Link2 className="w-3.5 h-3.5" />
                          مرتبطة
                        </span>
                      ) : (
                        <span className="text-[11px] text-stone-500">—</span>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap text-left">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openShareModal(q)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-amber-400 hover:bg-white/5"
                          title="معاينة بطاقة المشاركة"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setHistoryQuote(q)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-blue-400 hover:bg-white/5"
                          title="سجل التعديلات والتوثيق"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleStartEdit(q)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-white/5"
                          title="تعديل"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            handleDelete(q);
                          }}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-white/5"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

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
                  القول بالفصحى (مع التشكيل):
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

              {/* الصيغ باللهجات: تظهر تحت الفصحى حسب لهجة القارئ — اترك الحقل فارغاً إن لم تكتبها بعد */}
              {formLanguage === 'fusha' && (
                <div className="space-y-2.5 p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-stone-300 font-semibold">
                    الصيغ باللهجات (يرى كل قارئ لهجته تحت الفصحى):
                  </div>
                  {DIALECTS.map((d) => (
                    <div key={d.id}>
                      <label className="block text-stone-400 mb-1" htmlFor={`dialect-${d.id}`}>
                        {d.name}
                      </label>
                      <textarea
                        id={`dialect-${d.id}`}
                        value={formDialects[d.id] || ''}
                        onChange={(e) => setFormDialects((prev) => ({ ...prev, [d.id]: e.target.value }))}
                        rows={2}
                        className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-stone-100 font-serif text-sm leading-relaxed focus:outline-none focus:border-amber-500 resize-none"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Author & Dialect */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">اسم الكاتب:</label>
                  <input
                    type="text"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">اللغة / اللهجة:</label>
                  <select
                    value={formLanguage}
                    onChange={(e) => setFormLanguage(e.target.value as Language)}
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-stone-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="fusha">فصحى (مع صيغها باللهجات)</option>
                    <option value="darja">دارجة جزائرية فقط</option>
                  </select>
                </div>
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
