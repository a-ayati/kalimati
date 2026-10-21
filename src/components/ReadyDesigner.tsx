import React, { useEffect, useRef, useState } from 'react';
import type { ReadyDesign } from '../../shared/readyDesign';
import { designFor, readyCatalog, ReadyItem, renderReadyDesign } from '../lib/readyDesigner';
import './ReadyDesigner.css';
export interface DesignedPostDraft { text: string; design: ReadyDesign; publishedAt: string; clientRequestId: string; }
interface Props { onClose(): void; onSchedule(post: DesignedPostDraft): Promise<void>; }
function localSlot() { const d = new Date(Date.now() + 3600000); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); }
function Thumbnail({ item, onSelect }: { item: ReadyItem; onSelect(): void }) {
  const [url, setUrl] = useState('');
  useEffect(() => { let live = true; renderReadyDesign(designFor(item)).then(i => { if (live) setUrl(i.url); }).catch(() => {}); return () => { live = false; }; }, [item]);
  return <button type="button" className="kd-card" onClick={onSelect} aria-label={`معاينة: ${item.text}`}><div className="kd-thumb">{url && <img src={url} alt="" loading="lazy" />}</div><span>{item.text}</span></button>;
}
export function ReadyDesigner({ onClose, onSchedule }: Props) {
  const [items, setItems] = useState<ReadyItem[]>([]), [style, setStyle] = useState<'cinematic' | 'art'>('cinematic');
  const [selected, setSelected] = useState<ReadyItem | null>(null), [design, setDesign] = useState<ReadyDesign | null>(null), [image, setImage] = useState('');
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [loading, setLoading] = useState(true), [editing, setEditing] = useState(false);
  const [schedule, setSchedule] = useState(false), [date, setDate] = useState(localSlot);
  const [edits, setEdits] = useState({ line1: '', line2: '', keyword: '', color: '#FFB52E', translation: '' });
  const requestId = useRef(crypto.randomUUID());
  const drafts = useRef(new Map<string, { design: ReadyDesign; image: string }>()), sequence = useRef(0), modal = useRef<HTMLDivElement>(null), closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { let active = true; const focus = document.activeElement as HTMLElement; const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; closeButton.current?.focus(); readyCatalog().then(c => { if (active) setItems(c.READY_POSTS); }).catch(() => { if (active) setError('تعذّر تحميل التصاميم. أغلق النافذة وحاول مجددًا.'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; sequence.current++; document.body.style.overflow = overflow; focus?.focus(); }; }, []);
  const switchStyle = (next: 'cinematic' | 'art') => { sequence.current++; setStyle(next); setSelected(null); setDesign(null); setError(''); setBusy(false); setEditing(false); };
  const choose = async (item: ReadyItem) => {
    const seq = ++sequence.current; requestId.current = crypto.randomUUID(); setError(''); setBusy(true);
    try { const previous = drafts.current.get(item.id), next = previous?.design || designFor(item), url = previous?.image || (await renderReadyDesign(next)).url; if (seq !== sequence.current) return; setSelected(item); setDesign(next); setImage(url); setEditing(false); setEdits({ line1: next.lines?.[0] || '', line2: next.lines?.[1] || '', keyword: next.keyword || '', color: next.color || '#FFB52E', translation: next.translation || '' }); drafts.current.set(item.id, { design: next, image: url }); modal.current?.scrollTo(0, 0); } catch (e) { if (seq === sequence.current) setError(e instanceof Error ? e.message : 'تعذّر فتح التصميم.'); } finally { if (seq === sequence.current) setBusy(false); }
  };
  const updateCaption = (caption: string) => { if (!design || !selected) return; const next = { ...design, caption }; setDesign(next); drafts.current.set(selected.id, { design: next, image }); };
  const applyEdits = async (event: React.FormEvent) => {
    event.preventDefault(); if (!design || !selected || busy) return; setBusy(true); setError('');
    const next: ReadyDesign = { ...design, lines: [edits.line1.trim(), edits.line2.trim()], keyword: edits.keyword.trim(), color: edits.color, translation: edits.translation.trim() };
    const seq = ++sequence.current;
    try { const result = await renderReadyDesign(next); if (seq !== sequence.current) return; setDesign(next); setImage(result.url); drafts.current.set(selected.id, { design: next, image: result.url }); setEditing(false); } catch (e) { if (seq === sequence.current) setError(e instanceof Error ? e.message : 'تعذّر تحديث التصميم.'); } finally { if (seq === sequence.current) setBusy(false); }
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (busy || !design || !selected) return; const when = new Date(date); if (!Number.isFinite(when.getTime()) || when.getTime() <= Date.now()) return setError('اختر يومًا ووقتًا في المستقبل.'); if (!design.caption.trim()) return setError('اكتب الكابشن قبل إضافة المنشور.');
    setBusy(true); setError('');
    try { await onSchedule({ text: design.lines?.join(' ') || selected.text, design, publishedAt: when.toISOString(), clientRequestId: requestId.current }); } catch (e) { setError(e instanceof Error ? e.message : 'تعذّرت إضافة المنشور. حاول مرة أخرى.'); } finally { setBusy(false); }
  };
  const download = async () => { if (!design || busy) return; setBusy(true); try { const result = await renderReadyDesign(design); const a = document.createElement('a'); a.href = result.url; a.download = `kalimati-${design.templateId}.${result.blob.type === 'image/jpeg' ? 'jpg' : 'png'}`; a.click(); } catch { setError('تعذّر تحميل التصميم.'); } finally { setBusy(false); } };
  useEffect(() => { if (schedule) modal.current?.querySelector<HTMLInputElement>('.kd-schedule input')?.focus(); }, [schedule]);
  const keyboard = (event: React.KeyboardEvent) => { if (event.key === 'Escape' && !busy) { if (schedule) setSchedule(false); else onClose(); } if (event.key === 'Tab') { const focusable = [...((schedule ? modal.current?.querySelector('.kd-schedule') : modal.current)?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),summary') || [])].filter(x => x.offsetParent !== null); const first = focusable[0], last = focusable.at(-1); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } } };
  return <div className="kd-overlay" ref={modal} role="dialog" aria-modal="true" aria-labelledby="kd-title" dir="rtl" onKeyDown={keyboard}>
    <div className="kd-workspace">
      <header className="kd-top"><div><h2 id="kd-title">تصاميم جاهزة</h2><p>اختر تصميمًا، راجع الكابشن، ثم حدّد موعد النشر.</p></div><button type="button" ref={closeButton} disabled={busy && schedule} onClick={onClose}>إغلاق</button></header>
      <nav className="kd-switch" role="tablist" aria-label="أسلوب التصميم">{([['cinematic', 'سينمائي'], ['art', 'الخط العربي الفني']] as const).map(([id, title]) => <button key={id} type="button" role="tab" aria-selected={style === id} disabled={schedule} onClick={() => switchStyle(id)}>{title}</button>)}</nav>
      {error && <p className="kd-error" role="alert">{error}</p>}
      {loading ? <p role="status">جارٍ تحميل التصاميم…</p> : !selected || !design ? <div className="kd-grid" role="tabpanel" aria-label={style === 'cinematic' ? 'التصاميم السينمائية' : 'تصاميم الخط العربي الفني'}>{items.filter(p => p.style === style).map(item => <Thumbnail key={item.id} item={item} onSelect={() => { if (!busy) choose(item); }} />)}</div> : <>
        <div className="kd-selected"><h3>{design.lines?.join(' ') || selected.text}</h3><button type="button" disabled={busy} onClick={() => { setSelected(null); setEditing(false); setError(''); }}>كل التصاميم</button></div>
        <div className="kd-compose"><section className="kd-preview" aria-label="معاينة المنشور"><small>كلماتي · 4:5</small><img src={image} alt={design.lines?.join(' ') || selected.text} /><p>{design.caption}</p></section>
          <section className="kd-fields"><label className="kd-field"><span>الكابشن</span><textarea aria-label="الكابشن" value={design.caption} maxLength={4000} onChange={e => updateCaption(e.target.value)} /></label>
            <div className="kd-editor"><button type="button" aria-expanded={editing} onClick={() => setEditing(!editing)}>تعديل التصميم {editing ? '−' : '+'}</button>{editing && (style === 'art' ? <p>الكتابة الفنية جزء من الصورة. يمكنك تعديل الكابشن وتنزيل التصميم الجاهز.</p> : <form onSubmit={applyEdits}>{([['line1', 'السطر الأول'], ['line2', 'السطر الثاني'], ['keyword', 'الكلمة الملوّنة'], ['translation', 'الترجمة — اختياري']] as const).map(([key, title]) => <label className="kd-field" key={key}><span>{title}</span><input aria-label={title} value={edits[key]} required={key !== 'translation'} maxLength={key === 'translation' ? 120 : 160} onChange={e => setEdits({ ...edits, [key]: e.target.value })} /></label>)}<label className="kd-field"><span>لون الكلمة</span><input aria-label="لون الكلمة" type="color" value={edits.color} onChange={e => setEdits({ ...edits, color: e.target.value })} /></label><button className="kd-primary" disabled={busy}>تحديث المعاينة</button></form>)}</div>
            <button type="button" className="kd-primary" disabled={busy || !design.caption.trim()} onClick={() => { setError(''); setSchedule(true); }}>إضافة إلى الرزنامة</button><small>اختر اليوم والساعة في الخطوة التالية. النشر على منصة كلماتي.</small>
            <button type="button" className="kd-download" disabled={busy} onClick={download}>تنزيل التصميم</button>
          </section></div>
        {schedule && <div className="kd-schedule" role="dialog" aria-modal="true" aria-labelledby="kd-schedule-title"><form onSubmit={submit}><h3 id="kd-schedule-title">موعد نشر المنشور</h3><p>يُضاف التصميم والكابشن إلى مواعيد كلماتي.</p><label className="kd-field"><span>تاريخ ووقت النشر — بتوقيت جهازك</span><input type="datetime-local" aria-label="تاريخ ووقت النشر" value={date} required onChange={e => setDate(e.target.value)} /></label>{error && <p className="kd-error" role="alert">{error}</p>}<div className="kd-schedule-actions"><button type="submit" className="kd-primary" disabled={busy}>{busy ? 'جارٍ الإضافة…' : 'تأكيد الإضافة والجدولة'}</button><button type="button" disabled={busy} onClick={() => { setSchedule(false); setError(''); }}>إلغاء</button></div></form></div>}
      </>}
    </div>
  </div>;
}
