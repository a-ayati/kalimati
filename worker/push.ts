/**
 * الإشعار اليومي «كلمة اليوم» عبر Web Push.
 * - مفاتيح الإرسال (VAPID) يولّدها الخادم بنفسه أول مرة ويحفظها في قاعدة البيانات: لا تمرّ بأي شخص أو أداة.
 * - كل جهاز مشترك يختار ساعة الإشعار، ويُرسَل له مرة واحدة يومياً حسب توقيته المحلي.
 * - المهمة المجدولة تعمل كل 15 دقيقة.
 */
import { validatePushSubscription } from './pushValidation';
import { dailyQuote } from '../shared/daily';
import { buildWebPushRequest } from './webPush';

export interface PushEnv {
  DB: D1Database;
}

interface QuoteLite {
  slug: string;
  plainText: string;
  language: string;
  author?: string;
  featuredDate?: string;
  id?: string;
}

export async function ensurePushSchema(env: PushEnv): Promise<void> {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS push_subs (
      endpoint TEXT PRIMARY KEY, p256dh TEXT NOT NULL, auth TEXT NOT NULL,
      time TEXT NOT NULL, tz TEXT NOT NULL, last_sent TEXT, created_at TEXT NOT NULL)`
  ).run();
}

function b64url(buf: ArrayBuffer): string {
  let s = '';
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** مفاتيح الإرسال: تُولَّد مرة واحدة وتبقى داخل قاعدة البيانات */
async function vapid(env: PushEnv): Promise<{ publicKey: string; privateJWK: JsonWebKey }> {
  const row = await env.DB.prepare("SELECT value FROM meta WHERE key = 'vapid'").first<{ value: string }>();
  if (row) return JSON.parse(row.value);
  const pair = (await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])) as CryptoKeyPair;
  const publicKey = b64url((await crypto.subtle.exportKey('raw', pair.publicKey)) as ArrayBuffer);
  const privateJWK = (await crypto.subtle.exportKey('jwk', pair.privateKey)) as JsonWebKey;
  const value = JSON.stringify({ publicKey, privateJWK });
  // INSERT OR IGNORE: إن سبقنا طلب آخر نعتمد مفاتيحه
  await env.DB.prepare("INSERT OR IGNORE INTO meta (key, value) VALUES ('vapid', ?)").bind(value).run();
  const saved = await env.DB.prepare("SELECT value FROM meta WHERE key = 'vapid'").first<{ value: string }>();
  return JSON.parse(saved!.value);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

/** التاريخ والساعة المحليان لمنطقة زمنية */
function localNow(tz: string, now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value])
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}`, year: +parts.year, month: +parts.month, day: +parts.day };
}

/** كلمة اليوم: نفس اختيار الصفحة الرئيسية (اليوم من السنة ÷ عدد الأقوال المنشورة) */
function quoteOfDay(quotes: QuoteLite[], y: number, m: number, d: number): QuoteLite | null {
  return dailyQuote(quotes, y, m, d) || null;
}

async function publishedQuotes(env: PushEnv): Promise<QuoteLite[]> {
  const { results } = await env.DB.prepare(
    "SELECT id, slug, data FROM quotes WHERE status IN ('published','scheduled') AND published_at <= ? ORDER BY published_at DESC"
  )
    .bind(new Date().toISOString())
    .all<{ id: string; slug: string; data: string }>();
  return results.map((r) => ({ ...JSON.parse(r.data), id: r.id, slug: r.slug }));
}

async function send(
  env: PushEnv,
  keys: { privateJWK: JsonWebKey },
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: Record<string, unknown>
): Promise<number> {
  const { endpoint, headers, body } = await buildWebPushRequest(keys.privateJWK, sub, payload);
  const res = await fetch(endpoint, { method: 'POST', headers, body });
  if (!res.ok) {
    // Only a short provider error code is retained; never log endpoints or keys.
    const detail = await res.text().catch(() => '');
    let reason = 'provider_rejected';
    try { const parsed = JSON.parse(detail); if (typeof parsed.reason === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(parsed.reason)) reason = parsed.reason; } catch { /* no untrusted response text in logs */ }
    console.warn('web_push_rejected', {provider:new URL(endpoint).hostname,status:res.status,reason});
  }
  // اشتراك منتهٍ: نحذفه
  if (res.status === 404 || res.status === 410) {
    await env.DB.prepare('DELETE FROM push_subs WHERE endpoint = ?').bind(sub.endpoint).run();
  }
  return res.status;
}

function dailyPayload(q: QuoteLite, origin: string) {
  const text = q.plainText.length > 160 ? q.plainText.slice(0, 160) + '…' : q.plainText;
  return { title: 'كلمة اليوم', body: text, url: `${origin}/q/${encodeURIComponent(q.slug)}`, tag: 'kalimati-daily' };
}

export async function handlePush(req: Request, env: PushEnv, path: string): Promise<Response | null> {
  if (req.method === 'POST') {
    const origin = req.headers.get('origin');
    if (origin && origin !== new URL(req.url).origin) return json({ error: 'طلب مرفوض.' }, 403);
  }
  if (path === '/api/push/status' && req.method === 'POST') {
    await ensurePushSchema(env);
    const body = await req.json().catch(() => null) as { endpoint?: string } | null;
    const sub = typeof body?.endpoint === 'string' ? await env.DB.prepare('SELECT time, tz FROM push_subs WHERE endpoint = ?').bind(body.endpoint).first<{ time: string; tz: string }>() : null;
    return json({ subscribed: Boolean(sub), time: sub?.time, tz: sub?.tz });
  }

  if (path === '/api/push/key' && req.method === 'GET') {
    await ensurePushSchema(env);
    return json({ publicKey: (await vapid(env)).publicKey });
  }

  if (path === '/api/push/subscribe' && req.method === 'POST') {
    await ensurePushSchema(env);
    const body = await req.json().catch(() => null);
    const parsed = validatePushSubscription(body);
    if (!parsed.ok) return json({ error: parsed.error, code: parsed.code }, 400);
    const { subscription: sub, time, tz } = parsed;
    // إن كان الموعد قد مضى اليوم فلا نرسل حتى الغد (حتى لا يصل إشعار فور التفعيل)
    const local = localNow(tz);
    const lastSent = local.time > time ? local.date : null;
    await env.DB.prepare(
      `INSERT INTO push_subs (endpoint, p256dh, auth, time, tz, last_sent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth, time = excluded.time,
         tz = excluded.tz, last_sent = CASE WHEN push_subs.last_sent = ? THEN push_subs.last_sent ELSE excluded.last_sent END`
    )
      .bind(sub.endpoint, sub.p256dh, sub.auth, time, tz, lastSent, new Date().toISOString(), local.date)
      .run();
    return json({ ok: true });
  }

  if (path === '/api/push/unsubscribe' && req.method === 'POST') {
    await ensurePushSchema(env);
    const body = (await req.json().catch(() => null)) as { endpoint?: string } | null;
    if (typeof body?.endpoint === 'string') {
      await env.DB.prepare('DELETE FROM push_subs WHERE endpoint = ?').bind(body.endpoint).run();
    }
    return json({ ok: true });
  }

  // إشعار تجريبي فوري لجهاز مشترك (للتأكد أن الإشعارات تصل)
  if (path === '/api/push/test' && req.method === 'POST') {
    await ensurePushSchema(env);
    const body = (await req.json().catch(() => null)) as { endpoint?: string } | null;
    const sub = typeof body?.endpoint === 'string'
      ? await env.DB.prepare('SELECT endpoint, p256dh, auth, tz FROM push_subs WHERE endpoint = ?')
          .bind(body.endpoint)
          .first<{ endpoint: string; p256dh: string; auth: string; tz: string }>()
      : null;
    if (!sub) return json({ error: 'هذا الجهاز غير مشترك.' }, 404);
    const local = localNow(sub.tz);
    const q = quoteOfDay(await publishedQuotes(env), local.year, local.month, local.day);
    if (!q) return json({ error: 'لا توجد أقوال منشورة.' }, 404);
    const status = await send(env, await vapid(env), sub, dailyPayload(q, new URL(req.url).origin));
    if (status < 200 || status >= 300) return json({ error: `رفضت خدمة الإشعارات الإرسال (${status}). أعد تفعيل الاشتراك ثم جرّب مجددًا.`, status }, 502);
    return json({ ok: true, status });
  }

  return null;
}

/** المهمة المجدولة: إرسال كلمة اليوم لكل من حلّ موعده ولم تصله اليوم */
export async function runDailyPush(env: PushEnv, origin: string): Promise<{ sent: number; failed: number }> {
  await ensurePushSchema(env);
  const { results } = await env.DB.prepare('SELECT * FROM push_subs').all<{
    endpoint: string; p256dh: string; auth: string; time: string; tz: string; last_sent: string | null;
  }>();
  if (!results.length) return { sent: 0, failed: 0 };
  const quotes = await publishedQuotes(env);
  const keys = await vapid(env);
  let sent = 0;
  let failed = 0;
  for (const sub of results) {
    const local = localNow(sub.tz);
    if (local.time < sub.time || sub.last_sent === local.date) continue;
    const q = quoteOfDay(quotes, local.year, local.month, local.day);
    if (!q) continue;
    try {
      const status = await send(env, keys, sub, dailyPayload(q, origin));
      if (status >= 200 && status < 300) {
        sent++;
        await env.DB.prepare('UPDATE push_subs SET last_sent = ? WHERE endpoint = ?').bind(local.date, sub.endpoint).run();
      } else failed++;
    } catch (e) {
      failed++;
      console.error('push failed', e);
    }
  }
  return { sent, failed };
}
