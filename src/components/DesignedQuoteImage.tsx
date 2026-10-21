import React, { useEffect, useRef, useState } from 'react';
import type { ReadyDesign } from '../../shared/readyDesign';
import { renderReadyDesign } from '../lib/readyDesigner';
export function DesignedQuoteImage({ design, text }: { design: ReadyDesign; text: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true, started = false;
    const load = () => { if (started) return; started = true; renderReadyDesign(design).then(image => { if (active) setUrl(image.url); }).catch(() => { if (active) setFailed(true); }); };
    setUrl(''); setFailed(false);
    const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { observer.disconnect(); load(); } }, { rootMargin: '300px' });
    if (host.current) observer.observe(host.current); else load();
    return () => { active = false; observer.disconnect(); };
  }, [design]);
  return <div ref={host} className="w-full rounded-2xl overflow-hidden bg-black/30" style={{ aspectRatio: '4 / 5' }}>
    {url ? <img src={url} alt={text} className="w-full h-full object-contain" /> : <div className="h-full flex items-center justify-center p-6 text-stone-400 text-center">{failed ? text : 'جارٍ تجهيز التصميم…'}</div>}
  </div>;
}

export function DesignedQuoteShare({ design, text, onClose }: { design: ReadyDesign; text: string; onClose(): void }) {
  const [error, setError] = useState('');
  const download = async () => {
    try { const result = await renderReadyDesign(design); const link = document.createElement('a'); link.href = result.url; link.download = `kalimati-${design.templateId}.${result.blob.type === 'image/jpeg' ? 'jpg' : 'png'}`; link.click(); } catch { setError('تعذّر تنزيل التصميم.'); }
  };
  return <div className="fixed inset-0 z-50 bg-black/90 overflow-y-auto p-4" role="dialog" aria-modal="true" aria-label="مشاركة التصميم" dir="rtl"><div className="max-w-lg mx-auto space-y-4"><button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/10 text-white">إغلاق</button><DesignedQuoteImage design={design} text={text} /><p className="text-stone-300 whitespace-pre-wrap leading-relaxed">{design.caption}</p><button onClick={download} className="w-full rounded-xl clinic-gradient text-white p-3 font-bold">تنزيل التصميم</button>{error && <p role="alert">{error}</p>}</div></div>;
}
