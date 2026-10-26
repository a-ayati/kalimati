import React, { useEffect, useMemo, useState } from 'react';
import { adminApi, StudioRequest } from '../lib/api';
import { Quote } from '../types';
import { DAILY_LABELS, dailyKind, quoteKind } from '../../shared/daily';
import { stripTashkeel } from '../utils/tashkeel';
import { WORLD_REFERENCES } from '../../shared/worldQuotes';
import { QuoteCard } from './QuoteCard';
import { useKalimati } from '../context/KalimatiContext';

const input = 'w-full p-3 rounded-xl bg-black/40 border border-white/15 text-stone-100';
const button = 'px-4 py-2 rounded-xl bg-amber-500 text-black font-bold disabled:opacity-50';
function dateValue(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function normalize(s: string) { return stripTashkeel(s).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').trim(); }
function similarity(a: string, b: string) {
  const aa = new Set(normalize(a).split(/\s+/)), bb = new Set(normalize(b).split(/\s+/));
  const common = [...aa].filter(v => bb.has(v)).length;
  return common / Math.max(1, aa.size + bb.size - common);
}
interface Props { quotes: Quote[]; onEdit: (text: string, language: 'fusha' | 'darja', assisted: boolean) => void; onChanged: () => Promise<void>; onReference: (reference: typeof WORLD_REFERENCES[number]) => void }
export function AuthorStudio({ quotes, onEdit, onChanged, onReference }: Props) {
  const { author, openShareModal } = useKalimati();
  const [available, setAvailable] = useState<boolean>();
  const [form, setForm] = useState<StudioRequest>({ mode: 'generate', word: '', text: '', count: 5, language: 'fusha', tone: 'تأمّلية', length: 'قصيرة' });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selected, setSelected] = useState('');
  const [assisted, setAssisted] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [start, setStart] = useState(() => { const d = new Date(); d.setDate(d.getDate()+1); return dateValue(d); });
  const [plan, setPlan] = useState<Record<string,string>>({});
  useEffect(() => { adminApi.studioStatus().then(s => setAvailable(s.available)).catch(() => setAvailable(false)); }, []);
  const days = useMemo(() => Array.from({length:7}, (_, i) => {
    const d = new Date(`${start}T13:00:00`); d.setDate(d.getDate()+i);
    return { date: dateValue(d), dateTime: d.toISOString(), kind: dailyKind(d.getFullYear(), d.getMonth()+1, d.getDate()) };
  }), [start]);
  const matches = useMemo(() => selected.trim() ? quotes.map(q => ({ q, score: similarity(selected,q.text) })).filter(m => m.score >= .45).sort((a,b) => b.score-a.score).slice(0,3) : [], [selected,quotes]);
  const preview: Quote = { id:'studio-preview', slug:'studio-preview', text:selected, plainText:stripTashkeel(selected), language:form.language as Quote['language'], author:author.name, status:'draft', topics:[], createdAt:new Date().toISOString(), publishedAt:new Date().toISOString(), revisions:[], stats:{readsCount:0,savesCount:0,sharesCount:0} };
  async function generate(mode: StudioRequest['mode']) {
    setBusy(true); setMessage('');
    try {
      const result = await adminApi.studio({...form, mode, text:selected || form.text});
      setSuggestions(result.suggestions);
      if (mode === 'plan') setMessage('هذه أفكار تحريرية؛ الاقتباسات العالمية والأمثال تحتاج نصوصًا ومصادر مؤكدة قبل الجدولة.');
    } catch(e) { setMessage(e instanceof Error ? e.message : 'تعذّر التوليد.'); }
    finally { setBusy(false); }
  }
  async function scheduleWeek() {
    const chosen = days.filter(d => plan[d.date]);
    if (!chosen.length) { setMessage('اختر نصًا ليوم واحد على الأقل.'); return; }
    if (new Set(chosen.map(d=>plan[d.date])).size !== chosen.length) { setMessage('اختر نصوصًا مختلفة لأيام الأسبوع.'); return; }
    setBusy(true); setMessage(''); let done = 0;
    try {
      for (const day of chosen) {
        const q = quotes.find(q => q.id === plan[day.date]);
        if (!q || quoteKind(q) !== day.kind) throw new Error('اختيار لا يطابق نوع اليوم.');
        if (new Date(day.dateTime).getTime() <= Date.now()) throw new Error('اختر موعدًا مستقبليًا.');
        await adminApi.update(q.id, {...q, status:'scheduled', publishedAt:day.dateTime, featuredDate:day.date, revisionNote:'اعتماد وجدولة من مخطط الاستوديو'});
        done++; setPlan(prev => { const next={...prev}; delete next[day.date]; return next; });
      }
      setMessage(`تم اعتماد وجدولة ${done} بطاقة الساعة 13:00 بتوقيت جهازك.`);
    } catch(e) { setMessage(`جُدولت ${done} بطاقات. ${e instanceof Error ? e.message : 'تعذّر إكمال الجدولة.'}`); }
    finally { await onChanged().catch(()=>undefined); setBusy(false); }
  }
  return <section className="p-5 rounded-3xl border border-amber-500/30 bg-[#141518] space-y-5" aria-labelledby="studio-title">
    <div><h2 id="studio-title" className="text-2xl font-amiri text-amber-300">استوديو خَلْوَة</h2><p className="text-xs text-stone-400 mt-2">من كلمة إلى مسودة، ثم تصميم واعتماد وجدولة. خاص بصاحب المنصة.</p></div>
    {available === false && <p role="status" className="text-sm text-amber-200">التوليد يحتاج ربط Workers AI بالخادم باسم AI. التحرير اليدوي والتصميم والمخطّط متاحة الآن.</p>}
    <div className="grid sm:grid-cols-2 gap-4 text-sm">
      <label>الكلمة أو الموضوع<input className={input} maxLength={200} placeholder="مثلًا: الغياب" value={form.word} onChange={e=>setForm({...form,word:e.target.value})}/></label>
      <label>لغة المسودات<select className={input} value={form.language} onChange={e=>setForm({...form,language:e.target.value})}><option value="fusha">العربية الفصحى</option><option value="darja">الدارجة الجزائرية</option></select></label>
      <label>النبرة<select className={input} value={form.tone} onChange={e=>setForm({...form,tone:e.target.value})}>{['تأمّلية','دافئة','حازمة','حزينة','متفائلة'].map(t=><option key={t}>{t}</option>)}</select></label>
      <label>عدد المقترحات<select className={input} value={form.count} onChange={e=>setForm({...form,count:Number(e.target.value) as 5|10})}><option value={5}>خمسة مقترحات</option><option value={10}>عشرة مقترحات</option></select></label>
      <label>طول العبارة<select className={input} value={form.length} onChange={e=>setForm({...form,length:e.target.value})}><option>قصيرة</option><option>متوسطة</option></select></label>
    </div>
    <div className="flex flex-wrap gap-3"><button className={button} disabled={busy || !available || !form.word.trim()} onClick={()=>generate('generate')}>من كلمة إلى حكمة</button><button className={button} disabled={busy || !available || !form.word.trim()} onClick={()=>generate('plan')}>اقترح أفكارًا للأسبوع</button></div>
    {message && <p role="status" className="text-sm text-amber-200 whitespace-pre-wrap">{message}</p>}
    {busy && <p role="status">جارٍ تنفيذ الطلب…</p>}
    <p className="text-xs text-stone-400">مقترحات الذكاء الاصطناعي مسودات، وفحص التشابه داخل مكتبتك لا يثبت أصالتها أو صحة نسبتها.</p>
    <div className="space-y-3">{suggestions.map((s,i)=><div key={i} className="p-3 border border-white/10 rounded-xl"><p className="leading-loose whitespace-pre-wrap">{s}</p><button className="text-amber-300 text-sm mt-2" onClick={()=>{ setHistory(h=>selected?[...h,selected]:h);setSelected(s);setAssisted(true); }}>اختيار للتحرير</button></div>)}</div>
    <label className="block text-sm">محرّر النصوص<textarea className={`${input} mt-2 leading-loose`} rows={4} maxLength={4000} value={selected} onFocus={()=>setHistory(h=>selected && h[h.length-1]!==selected?[...h,selected]:h)} onChange={e=>setSelected(e.target.value)} placeholder="اكتب نصك أو اختر مقترحًا…"/></label>
    <div className="flex flex-wrap gap-3">
      <button className={button} disabled={busy || !available || !selected.trim() || !form.word.trim()} onClick={()=>generate('refine')}>تنقيح واقتراح بدائل</button>
      <button className={button} disabled={!history.length} onClick={()=>{setSelected(history[history.length-1]);setHistory(h=>h.slice(0,-1));}}>استعادة النسخة السابقة</button>
      <button className={button} disabled={!selected.trim()} onClick={()=>openShareModal(preview)}>تصميم ستوري أو منشور بالختم</button>
      <button className={button} disabled={!selected.trim()} onClick={()=>onEdit(selected,form.language as 'fusha'|'darja',assisted)}>نقل إلى مسودة للمراجعة</button>
    </div>
    {matches.length>0 && <div className="p-3 border border-amber-500/30 rounded-xl text-sm"><h3>نصوص متشابهة في مكتبتك</h3>{matches.map(({q,score})=><p key={q.id} className="mt-2">{Math.round(score*100)}% — {q.plainText}</p>)}</div>}
    {selected && <QuoteCard quote={preview} showActions={false} />}
    <details className="p-3 border border-white/10 rounded-xl"><summary className="text-amber-300 cursor-pointer">اقتباسات عالمية بمصادرها — للمراجعة قبل النشر</summary>{WORLD_REFERENCES.map(reference=><div key={reference.text} className="mt-4 space-y-2"><p dir="ltr" lang={reference.language}>{reference.text} — {reference.author}</p><a href={reference.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm underline text-amber-200">قراءة المصدر</a><button className={`${button} block`} onClick={()=>onReference(reference)}>فتح في المحرّر كمسودة</button></div>)}</details>
    <div className="border-t border-white/10 pt-5 space-y-4"><h3 className="text-lg text-amber-300">مخطّط النشر — بطاقة مستقلة كل يوم</h3><p className="text-xs text-stone-400">فصحى أصلية ← اقتباس عالمي موثّق ← مثل شعبي معروف. لا يُنشر نص مولّد تلقائيًا. عند غياب محتوى لنوع يوم ما تعرض الصفحة قولًا متاحًا.</p>
      <label className="block text-sm">بداية الأسبوع<input type="date" className={input} value={start} required onChange={e=>{if(e.target.value){setStart(e.target.value);setPlan({});}}}/></label>
      {days.map(day=><label key={day.date} className="block p-3 rounded-xl bg-black/20 text-sm"><span>{day.date} — {DAILY_LABELS[day.kind]}</span><select aria-label={`بطاقة ${day.date}`} className={`${input} mt-2`} value={plan[day.date]||''} onChange={e=>setPlan({...plan,[day.date]:e.target.value})}><option value="">اختر نصًا معتمدًا من المكتبة</option>{quotes.filter(q=>quoteKind(q)===day.kind).map(q=><option key={q.id} value={q.id}>{q.plainText.slice(0,100)} — {q.author}{q.featuredDate ? ` (مخصّص لـ ${q.featuredDate})` : ''}</option>)}</select></label>)}
      <p className="text-xs text-stone-400">الجدولة الساعة 13:00 بتوقيت جهازك: {Intl.DateTimeFormat().resolvedOptions().timeZone}. تخصيص نص ليوم آخر ينقل تخصيصه السابق.</p>
      <button className={button} disabled={busy} onClick={scheduleWeek}>اعتماد وجدولة البطاقات المختارة</button>
    </div>
  </section>;
}
