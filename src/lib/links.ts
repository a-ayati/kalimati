import { Quote } from '../types';

/** الرابط الدائم لقول — يعمل على أي نطاق تُنشر عليه المنصة */
export function quoteUrl(quote: Pick<Quote, 'slug'>): string {
  return `${window.location.origin}/q/${encodeURIComponent(quote.slug)}`;
}

/** اسم الموقع كما يظهر أسفل بطاقات المشاركة */
export function siteHost(): string {
  return window.location.host;
}
