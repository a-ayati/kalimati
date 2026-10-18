/** الإشعار اليومي «كلمة اليوم» عبر Web Push */

export type PushSupport = 'ok' | 'install-first' | 'unsupported';

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

/** على الآيفون تعمل الإشعارات فقط بعد إضافة المنصة إلى الشاشة الرئيسية */
export function pushSupport(): PushSupport {
  if (!window.isSecureContext) return 'unsupported';
  if (isIOS() && !isStandalone()) return 'install-first';
  if (!('serviceWorker' in navigator)) return 'unsupported';
  if (!('PushManager' in window) || !('Notification' in window)) {
    return isIOS() && !isStandalone() ? 'install-first' : 'unsupported';
  }
  return 'ok';
}

function keyToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function post(path: string, body: unknown) {
  const res = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || 'تعذّر الاتصال بالخادم.');
  return data;
}

async function registration() {
  const reg = await navigator.serviceWorker.getRegistration();
  if (reg?.active) return reg;
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('خدمة الإشعارات لم تصبح جاهزة. أعد تحميل المنصة أو افتحها في متصفح يدعمها.')), 12000); }),
    ]);
  } finally { clearTimeout(timer!); }
}

/** طلب الإذن والاشتراك (أو تحديث الموعد) */
export async function subscribeDaily(time: string): Promise<void> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('لم يُسمح بالإشعارات. فعّلها من إعدادات المتصفح أو الهاتف.');
  const reg = await registration();
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const response = await fetch('/api/push/key');
    if (!response.ok) throw new Error('تعذّر تجهيز مفتاح الإشعارات من الخادم.');
    const { publicKey } = await response.json();
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(publicKey) });
  }
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  // Some browser shells omit keys in toJSON(); getKey supplies the standard raw values.
  const raw = sub.toJSON();
  const encodeKey = (name: PushEncryptionKeyName) => {
    const value = sub!.getKey(name);
    if (!value) return undefined;
    let bytes = ''; for (const b of new Uint8Array(value)) bytes += String.fromCharCode(b);
    return btoa(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  const subscription = { endpoint: sub.endpoint, keys: {
    p256dh: raw.keys?.p256dh || encodeKey('p256dh'), auth: raw.keys?.auth || encodeKey('auth'),
  } };
  await post('/api/push/subscribe', { subscription, time, tz });
}

export async function unsubscribeDaily(): Promise<void> {
  const reg = await registration();
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  await post('/api/push/unsubscribe', { endpoint: sub.endpoint });
  await sub.unsubscribe();
}

export async function sendTestPush(): Promise<void> {
  const reg = await registration();
  const sub = await reg.pushManager.getSubscription();
  if (!sub) throw new Error('هذا الجهاز غير مشترك بعد.');
  await post('/api/push/test', { endpoint: sub.endpoint });
}

/** Check browser permission and the server record instead of trusting local settings. */
export async function dailyPushStatus(): Promise<{ subscribed: boolean; time?: string; tz?: string }> {
  if (pushSupport() !== 'ok' || Notification.permission !== 'granted') return { subscribed: false };
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return { subscribed: false };
  return post('/api/push/status', { endpoint: sub.endpoint });
}
