import { DialectId, Quote } from '../types';

export type StatKind = 'read' | 'save' | 'share';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json', ...(init.headers || {}) },
  });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json().catch(() => ({})) : {};
  if (!res.ok) {
    throw new ApiError((body as { error?: string }).error || 'تعذّر الاتصال بالخادم.', res.status);
  }
  if (!isJson) throw new ApiError('الخادم غير متاح حالياً.', 503);
  return body as T;
}

// ---- عام ----

export function fetchPublicQuotes(): Promise<{ quotes: Quote[] }> {
  return request('/api/quotes', { cache: 'no-cache' });
}

/** تسجيل إحصائية دون انتظار — لا تعطّل الواجهة أبداً */
export function trackEvent(quoteId: string, kind: StatKind): void {
  try {
    fetch('/api/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ quoteId, kind }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // تجاهل
  }
}

// ---- لوحة الكاتب ----

export type QuoteInput = Omit<Quote, 'id' | 'createdAt' | 'stats' | 'revisions' | 'darja' | 'dialects'> & {
  revisionNote?: string;
  /** الصيغ باللهجات المرافقة للفصحى: معرّف اللهجة ← النص بالتشكيل */
  dialectTexts?: Partial<Record<DialectId, string>>;
};

export interface StudioRequest { mode: 'generate' | 'refine' | 'plan'; word: string; text: string; count: 5 | 10; language: string; tone: string; length: string }
export const adminApi = {
  studioStatus: () => request<{ available: boolean }>('/api/admin/studio'),
  studio: (data: StudioRequest) => request<{ suggestions: string[] }>('/api/admin/studio', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request<{ authenticated: boolean; configured: boolean }>('/api/admin/me'),
  login: (password: string) => request<{ ok: true }>('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) }),
  logout: () => request<{ ok: true }>('/api/admin/logout', { method: 'POST' }),
  list: () => request<{ quotes: Quote[] }>('/api/admin/quotes'),
  create: (data: QuoteInput) => request<{ quote: Quote }>('/api/admin/quotes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: QuoteInput) =>
    request<{ quote: Quote }>(`/api/admin/quotes/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => request<{ ok: true }>(`/api/admin/quotes/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  importQuotes: (quotes: Quote[]) =>
    request<{ imported: number }>('/api/admin/import', { method: 'POST', body: JSON.stringify({ quotes }) }),
};
