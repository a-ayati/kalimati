import type { Quote } from '../types';
import { quoteByline } from '../utils/dialects';

/** Content stays in the URL fragment; the template never sends the quote to a server. */
export function cinematicTemplateUrl(quote: Quote): string {
  const seed = {
    text: quote.text || quote.plainText,
    author: quoteByline(quote),
    source: [quote.sourceNote, quote.sourceUrl].filter(Boolean).join(' · '),
    sourceUrl: quote.sourceUrl || '',
  };
  return '/templates/cinematic/index.html#' + encodeURIComponent(JSON.stringify(seed));
}
