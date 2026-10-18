import { useCallback, useEffect, useRef, useState } from 'react';
import { Quote } from '../types';
import { takeZenQuote } from '../lib/zenCycle';
export function useZenQuote(pool: Quote[], scope: string, enabled: boolean, seconds: number, preview?: Quote) {
  const [id, setId] = useState<string>();
  const started = useRef('');
  const ids = pool.map(q => q.id).sort().join('|');
  const advance = useCallback(() => {
    if (preview) { setId(preview.id); return; }
    const next = takeZenQuote(ids ? ids.split('|') : [], scope);
    setId(next);
  }, [ids, scope, preview]);
  useEffect(() => {
    if (!enabled) { started.current = ''; return; }
    const session = `${scope}:${ids}:${preview?.id || ''}`;
    if (started.current !== session) { started.current = session; advance(); }
    if (!seconds || preview) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') advance();
    }, seconds * 1000);
    return () => clearInterval(timer);
  }, [enabled, scope, ids, seconds, preview, advance]);
  return preview || pool.find(q => q.id === id);
}
