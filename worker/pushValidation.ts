export interface SubscriptionData { endpoint: string; p256dh: string; auth: string }
export type Validation = { ok: true; subscription: SubscriptionData; time: string; tz: string } | { ok: false; error: string; code: string };
const HOSTS = [/(^|\.)fcm\.googleapis\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)push\.apple\.com$/, /(^|\.)notify\.windows\.com$/];
/** Accept time input's optional seconds, Arabic digits and whitespace; store HH:mm. */
export function normalizePushTime(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const s = value.trim().replace(/[٠-٩]/g, d => String(d.charCodeAt(0)-0x660)).replace(/[۰-۹]/g, d => String(d.charCodeAt(0)-0x6f0));
  const match = /^(\d{1,2}):([0-5]\d)(?::[0-5]\d)?$/.exec(s);
  return match && +match[1] < 24 ? `${match[1].padStart(2,'0')}:${match[2]}` : null;
}
export function validatePushSubscription(body: unknown): Validation {
  const b = body as {subscription?: {endpoint?: unknown; keys?: {p256dh?: unknown; auth?: unknown}}; time?: unknown; tz?: unknown} | null;
  const fail = (code: string, error: string): Validation => ({ok:false,code,error});
  const time = normalizePushTime(b?.time);
  if (!time) return fail('invalid_time','موعد الإشعار غير صالح. اختر الساعة والدقيقة من حقل الوقت.');
  const tz = typeof b?.tz === 'string' ? b.tz.trim() : '';
  try { if (!tz || tz.length > 128) throw Error(); new Intl.DateTimeFormat('en-US',{timeZone:tz}).format(); }
  catch { return fail('invalid_timezone','تعذّر التعرّف على المنطقة الزمنية للجهاز. راجع إعداد الوقت والتاريخ ثم أعد المحاولة.'); }
  const sub = b?.subscription;
  if (!sub || typeof sub.endpoint !== 'string' || sub.endpoint.length > 8192) return fail('invalid_endpoint','لم يرسل المتصفح عنوان اشتراك صالحًا. أعد فتح الموقع في متصفحك الأساسي ثم فعّل الإشعار.');
  let url: URL;
  try { url = new URL(sub.endpoint); } catch { return fail('invalid_endpoint','عنوان خدمة الإشعارات غير صالح. أعد تفعيل الاشتراك.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port && url.port !== '443' || !HOSTS.some(r=>r.test(url.hostname))) {
    return fail('unsupported_provider','خدمة الإشعارات التي يستخدمها هذا المتصفح غير مدعومة حاليًا. جرّب Safari أو Chrome أو Firefox أو Edge.');
  }
  const p256dh = sub.keys?.p256dh, auth = sub.keys?.auth;
  if (typeof p256dh !== 'string' || typeof auth !== 'string' || !p256dh || !auth || p256dh.length > 200 || auth.length > 100) return fail('missing_keys','لم يرسل المتصفح مفاتيح الاشتراك كاملة. أعد إنشاء الاشتراك من زر تفعيل الإشعار.');
  return {ok:true,subscription:{endpoint:sub.endpoint,p256dh,auth},time,tz};
}
