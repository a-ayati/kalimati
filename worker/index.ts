import { validateReadyDesign, readyRequestQuoteId, type ReadyDesign } from '../shared/readyDesign';
/**
 * خادم «كلماتي» على Cloudflare Workers
 *
 * - يقدّم ملفات الواجهة (dist) كتطبيق صفحة واحدة.
 * - /api/quotes          الأقوال المنشورة للعامة (تظهر المجدولة تلقائياً عند حلول موعدها).
 * - /api/events          إحصاءات حقيقية (قراءة/حفظ/مشاركة) — مرة لكل زائر لكل قول في اليوم.
 * - /api/admin/*         لوحة الكاتب — محمية بكلمة مرور مخزّنة كسرّ في Cloudflare (ADMIN_PASSWORD).
 * - /q/:slug             يحقن عنوان القول ووصفه في الصفحة لتظهر المعاينة الصحيحة عند المشاركة.
 * - /sitemap.xml         خريطة موقع تُبنى تلقائياً من الأقوال المنشورة.
 */

import { handleStudio } from './studio';
import { SEED } from './seed';
import { DIALECTS_FILL } from './dialects-fill';
import { FOLK_AUTHOR, FOLK_ORIGINAL_TEXT, FOLK_PROVERBS } from './folk-proverbs';
import { MONTH_PLAN } from './month-plan';
import { handlePush, runDailyPush } from './push';

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  ADMIN_PASSWORD?: string;
  AI?: Ai;
}

type Status = 'draft' | 'review' | 'scheduled' | 'published';
const STATUSES: Status[] = ['draft', 'review', 'scheduled', 'published'];
const EVENT_KINDS = ['read', 'save', 'share'] as const;
type EventKind = (typeof EVENT_KINDS)[number];

interface QuoteRow {
  id: string;
  slug: string;
  status: Status;
  published_at: string;
  created_at: string;
  updated_at: string;
  data: string;
  reads: number;
  saves: number;
  shares: number;
}

interface Revision {
  id: string;
  timestamp: string;
  note: string;
  textSnippet: string;
  text?: string;
}

const SESSION_COOKIE = 'kalimati_admin';
const SESSION_DAYS = 30;
const MAX_LOGIN_FAILURES = 5;
const LOCK_MINUTES = 15;

// ---------------------------------------------------------------------------
// أدوات عامة
// ---------------------------------------------------------------------------

const enc = new TextEncoder();

function json(body: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

function error(message: string, status: number): Response {
  return json({ error: message }, status);
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(text: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', enc.encode(text)));
}

async function hmac(key: string, message: string): Promise<string> {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return toHex(await crypto.subtle.sign('HMAC', k, enc.encode(message)));
}

/** مقارنة بزمن ثابت لتفادي هجمات التوقيت */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** بصمة مجهولة للزائر تتغير يومياً — لا نخزّن عنوان IP أبداً */
async function visitorId(req: Request, salt: string, withUserAgent = true): Promise<string> {
  const ip = req.headers.get('cf-connecting-ip') || 'unknown';
  const ua = withUserAgent ? req.headers.get('user-agent') || '' : '';
  return (await sha256(`${salt}|${today()}|${ip}|${ua}`)).slice(0, 32);
}

function getCookie(req: Request, name: string): string | null {
  const header = req.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

function rowToQuote(row: QuoteRow, includeAll = false) {
  const data = JSON.parse(row.data);
  // الحقل القديم darja صار dialects.dz
  if (data.darja) {
    data.dialects = { dz: data.darja, ...(data.dialects || {}) };
    delete data.darja;
  }
  const quote = {
    ...data,
    id: row.id,
    slug: row.slug,
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    stats: { readsCount: row.reads, savesCount: row.saves, sharesCount: row.shares },
  };
  if (!includeAll) {
    delete quote.aiAssisted;
    delete quote.revisions; // سجل التعديلات خاص بالكاتب
    quote.status = 'published'; // المجدول الذي حلّ موعده يظهر للقارئ كمنشور
  }
  return quote;
}

const VISIBLE_WHERE = `status IN ('published','scheduled') AND published_at <= ?`;

// ---------------------------------------------------------------------------
// جلسة الكاتب
// ---------------------------------------------------------------------------

async function sessionKey(env: Env): Promise<string> {
  // المفتاح مشتق من كلمة المرور: تغييرها يُخرج كل الجلسات القديمة تلقائياً
  return sha256(`kalimati-session-v1:${env.ADMIN_PASSWORD}`);
}

async function createSession(env: Env): Promise<string> {
  const exp = Date.now() + SESSION_DAYS * 86400_000;
  const sig = await hmac(await sessionKey(env), `admin:${exp}`);
  return `${exp}.${sig}`;
}

async function isAdmin(req: Request, env: Env): Promise<boolean> {
  if (!env.ADMIN_PASSWORD) return false;
  const value = getCookie(req, SESSION_COOKIE);
  if (!value) return false;
  const [expStr, sig] = value.split('.');
  const exp = Number(expStr);
  if (!exp || !sig || exp < Date.now()) return false;
  const expected = await hmac(await sessionKey(env), `admin:${exp}`);
  return safeEqual(sig, expected);
}

function sessionCookie(value: string, maxAge: number): string {
  return `${SESSION_COOKIE}=${value}; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

async function handleLogin(req: Request, env: Env): Promise<Response> {
  if (!env.ADMIN_PASSWORD) {
    return error('لم تُضبط كلمة مرور الإدارة بعد على الخادم.', 503);
  }
  // حماية التخمين تعتمد على العنوان وحده حتى لا يمكن تجاوزها بتغيير المتصفح
  const visitor = await visitorId(req, 'login', false);
  const now = Date.now();
  const attempt = await env.DB.prepare('SELECT failures, window_start FROM login_attempts WHERE visitor = ?')
    .bind(visitor)
    .first<{ failures: number; window_start: number }>();

  const windowMs = LOCK_MINUTES * 60_000;
  if (attempt && attempt.failures >= MAX_LOGIN_FAILURES && now - attempt.window_start < windowMs) {
    const minutes = Math.ceil((windowMs - (now - attempt.window_start)) / 60_000);
    return error(`محاولات كثيرة. حاول مجدداً بعد ${minutes} دقيقة.`, 429);
  }

  const body = (await req.json().catch(() => ({}))) as { password?: string };
  const given = typeof body.password === 'string' ? body.password : '';
  const key = await sessionKey(env);
  const ok = safeEqual(await hmac(key, given), await hmac(key, env.ADMIN_PASSWORD));

  if (!ok) {
    const reset = !attempt || now - attempt.window_start >= windowMs;
    await env.DB.prepare(
      `INSERT INTO login_attempts (visitor, failures, window_start) VALUES (?, 1, ?)
       ON CONFLICT(visitor) DO UPDATE SET failures = ?, window_start = ?`
    )
      .bind(visitor, now, reset ? 1 : attempt!.failures + 1, reset ? now : attempt!.window_start)
      .run();
    return error('كلمة المرور غير صحيحة.', 401);
  }

  await env.DB.prepare('DELETE FROM login_attempts WHERE visitor = ?').bind(visitor).run();
  return json({ ok: true }, 200, { 'set-cookie': sessionCookie(await createSession(env), SESSION_DAYS * 86400) });
}

// ---------------------------------------------------------------------------
// التحقق من بيانات القول القادمة من لوحة الإدارة
// ---------------------------------------------------------------------------

interface QuoteInput {
  design?: ReadyDesign;
  text: string;
  plainText: string;
  language: 'fusha' | 'darja' | 'en' | 'fr';
  sourceUrl?: string;
  sourceNote?: string;
  featuredDate?: string;
  aiAssisted?: boolean;
  author: string;
  topics: string[];
  status: Status;
  publishedAt: string;
  slug?: string;
  behindTheWords?: string;
  pairedQuoteId?: string;
  calligraphyManuscriptUrl?: string;
  audioRecitationUrl?: string;
  dialects?: Record<string, { text: string; plainText: string }>;
  /** لهجة القول حين يكون بالدارجة (dz, ma, tn, eg, gulf, sham) */
  dialect?: string;
}

const DIALECT_IDS = ['dz', 'ma', 'tn', 'eg', 'gulf', 'sham'];

function stripMarks(text: string): string {
  return text.replace(/[\u0617-\u061A\u064B-\u0652\u0657-\u065E\u0670]/g, '');
}

function str(v: unknown, max: number): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t ? t.slice(0, max) : undefined;
}

/** المنصة لكاتب واحد: كل الكتابات باسم شعيب المطوع، ولا يُقبل اسم آخر */
const SOLE_AUTHOR = 'شعيب المطوع';

function validateQuote(body: any): QuoteInput | string {
  const text = str(body?.text, 4000);
  const plainText = str(body?.plainText, 4000);
  // الفصحى لشعيب وحده؛ القول باللهجة إما له أو مثل من التراث الشعبي
  const world = body?.language === 'en' || body?.language === 'fr';
  const author = world ? str(body?.author, 200) : body?.language === 'darja' && body?.author === FOLK_AUTHOR ? FOLK_AUTHOR : SOLE_AUTHOR;
  if (!author) return 'اسم قائل الاقتباس مطلوب.';
  const sourceNote = str(body?.sourceNote, 1000);
  const sourceUrl = str(body?.sourceUrl, 1000);
  if (sourceUrl) { try { if (!['https:', 'http:'].includes(new URL(sourceUrl).protocol)) return 'رابط المصدر غير صالح.'; } catch { return 'رابط المصدر غير صالح.'; } }
  if (world && !sourceNote && !sourceUrl) return 'أضف مصدر الاقتباس العالمي قبل الحفظ.';
  const featuredDate = str(body?.featuredDate, 10);
  if (featuredDate && (!/^\d{4}-\d{2}-\d{2}$/.test(featuredDate) || !Number.isFinite(Date.parse(featuredDate + 'T00:00:00Z')) || new Date(featuredDate + 'T00:00:00Z').toISOString().slice(0,10) !== featuredDate)) return 'تاريخ حكمة اليوم غير صالح.';
  const dialect = body?.language === 'darja' ? (DIALECT_IDS.includes(body?.dialect) ? body.dialect : 'dz') : undefined;
  if (!text || !plainText) return 'نص القول مطلوب.';
  if (!['fusha', 'darja', 'en', 'fr'].includes(body.language)) return 'اللغة غير صحيحة.';
  if (!STATUSES.includes(body.status)) return 'حالة النشر غير صحيحة.';
  const date = new Date(body.publishedAt);
  if (isNaN(date.getTime())) return 'تاريخ النشر غير صحيح.';
  const topics = Array.isArray(body.topics)
    ? body.topics.filter((t: unknown) => typeof t === 'string' && t.trim()).map((t: string) => t.trim().slice(0, 60)).slice(0, 12)
    : [];
  const design = validateReadyDesign(body.design, text);
  if (typeof design === 'string') return design;
  if (design && body.status === 'scheduled' && date.getTime() <= Date.now()) return 'اختر موعدًا مستقبليًا لنشر التصميم.';
  // الصيغ باللهجات (اختيارية): { dz: "…", eg: "…" } — مع دعم الحقل القديم darjaText
  const rawDialects: Record<string, unknown> = {};
  // من النسخة الاحتياطية: { dialects: { dz: { text } } }
  if (body?.dialects && typeof body.dialects === 'object') {
    for (const [k, v] of Object.entries(body.dialects as Record<string, any>)) rawDialects[k] = v?.text;
  }
  if (body?.darja?.text && !rawDialects.dz) rawDialects.dz = body.darja.text;
  Object.assign(rawDialects, body?.dialectTexts || {});
  if (body?.darjaText && !rawDialects.dz) rawDialects.dz = body.darjaText;
  const dialects: Record<string, { text: string; plainText: string }> = {};
  for (const id of DIALECT_IDS) {
    const t = str(rawDialects[id], 4000);
    if (t) dialects[id] = { text: t, plainText: stripMarks(t) };
  }
  void dialects; // الفصحى تُعرض وحدها: لا صيغ لهجات مرافقة بعد اليوم
  return {
    design,
    dialects: undefined,
    dialect,
    text,
    plainText,
    author,
    language: body.language,
    sourceUrl, sourceNote, featuredDate, aiAssisted: body.aiAssisted === true,
    status: body.status,
    publishedAt: date.toISOString(),
    topics,
    slug: str(body.slug, 120),
    behindTheWords: str(body.behindTheWords, 4000),
    pairedQuoteId: str(body.pairedQuoteId, 80),
    calligraphyManuscriptUrl: str(body.calligraphyManuscriptUrl, 500),
    audioRecitationUrl: str(body.audioRecitationUrl, 500),
  };
}

function slugify(input: string): string {
  return (
    input
      .replace(/[ً-ٰٟ]/g, '') // إزالة التشكيل
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .trim()
      .split(/\s+/)
      .slice(0, 6)
      .join('-')
      .toLowerCase()
      .slice(0, 80) || 'qawl'
  );
}

async function uniqueSlug(env: Env, wanted: string, exceptId?: string): Promise<string> {
  const base = slugify(wanted);
  let candidate = base;
  for (let i = 2; i < 200; i++) {
    const row = await env.DB.prepare('SELECT id FROM quotes WHERE slug = ?').bind(candidate).first<{ id: string }>();
    if (!row || row.id === exceptId) return candidate;
    candidate = `${base}-${i}`;
  }
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

function snippet(text: string): string {
  return text.length > 45 ? text.slice(0, 45) + '...' : text;
}

function splitInput(input: QuoteInput) {
  const { status, publishedAt, slug, ...data } = input;
  return { status, publishedAt, slug, data };
}

// ---------------------------------------------------------------------------
// مسارات الإدارة
// ---------------------------------------------------------------------------

async function featuredConflict(env: Env, input: QuoteInput, exceptId = ''): Promise<boolean> {
  if (!input.featuredDate || !['scheduled', 'published'].includes(input.status)) return false;
  return Boolean(await env.DB.prepare("SELECT id FROM quotes WHERE id != ? AND status IN ('scheduled','published') AND json_extract(data, '$.featuredDate') = ? LIMIT 1").bind(exceptId, input.featuredDate).first());
}

async function handleAdmin(req: Request, env: Env, path: string): Promise<Response> {
  const method = req.method;

  if (path === '/api/admin/login' && method === 'POST') return handleLogin(req, env);
  if (path === '/api/admin/logout' && method === 'POST') {
    return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', 0) });
  }
  if (path === '/api/admin/me' && method === 'GET') {
    return json({ authenticated: await isAdmin(req, env), configured: Boolean(env.ADMIN_PASSWORD) });
  }

  if (!(await isAdmin(req, env))) return error('يلزم تسجيل الدخول.', 401);

  // حماية إضافية: الطلبات المعدِّلة يجب أن تكون JSON من نفس الموقع
  if (method !== 'GET') {
    const origin = req.headers.get('origin');
    if (origin && origin !== new URL(req.url).origin) return error('طلب مرفوض.', 403);
  }

  if (path === '/api/admin/studio') return handleStudio(req, env);

  if (path === '/api/admin/quotes' && method === 'GET') {
    const { results } = await env.DB.prepare('SELECT * FROM quotes ORDER BY published_at DESC').all<QuoteRow>();
    return json({ quotes: results.map((r) => rowToQuote(r, true)) });
  }

  if (path === '/api/admin/quotes' && method === 'POST') {
    const body = await req.json().catch(() => null) as any;
    const parsed = validateQuote(body);
    if (typeof parsed === 'string') return error(parsed, 400);
    const requestId = parsed.design ? readyRequestQuoteId(body?.clientRequestId) : undefined;
    if (parsed.design && !requestId) return error('أعد فتح المصمم ثم حاول الإضافة مجددًا.', 400);
    if (requestId) {
      const prior = await env.DB.prepare('SELECT * FROM quotes WHERE id = ?').bind(requestId).first<QuoteRow>();
      if (prior) return json({ quote: rowToQuote(prior, true) });
    }
    if (await featuredConflict(env, parsed)) return error('توجد بطاقة أخرى مخصصة لهذا اليوم. عدّل تخصيصها أولًا.', 409);
    const { status, publishedAt, slug, data } = splitInput(parsed);
    const now = new Date().toISOString();
    const id = requestId || `quote-${crypto.randomUUID()}`;
    const revisions: Revision[] = [
      { id: `rev-${crypto.randomUUID()}`, timestamp: now, note: 'إنشاء النص الأولي', textSnippet: snippet(data.text), text: data.text },
    ];
    const finalSlug = await uniqueSlug(env, slug || data.plainText);
    await env.DB.prepare(
      requestId ? 'INSERT OR IGNORE INTO quotes (id, slug, status, published_at, created_at, updated_at, data) VALUES (?, ?, ?, ?, ?, ?, ?)' : 'INSERT INTO quotes (id, slug, status, published_at, created_at, updated_at, data) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
      .bind(id, finalSlug, status, publishedAt, now, now, JSON.stringify({ ...data, revisions }))
      .run();
    const row = await env.DB.prepare('SELECT * FROM quotes WHERE id = ?').bind(id).first<QuoteRow>();
    return json({ quote: rowToQuote(row!, true) }, 201);
  }

  if (path === '/api/admin/import' && method === 'POST') {
    const body = (await req.json().catch(() => null)) as { quotes?: any[] } | null;
    if (!body || !Array.isArray(body.quotes)) return error('ملف النسخة الاحتياطية غير صالح.', 400);
    let imported = 0;
    const stmts: D1PreparedStatement[] = [];
    for (const raw of body.quotes.slice(0, 2000)) {
      const parsed = validateQuote(raw);
      if (typeof parsed === 'string' || typeof raw.id !== 'string') continue;
      const { status, publishedAt, slug, data } = splitInput(parsed);
      const now = new Date().toISOString();
      const revisions = Array.isArray(raw.revisions) ? raw.revisions.slice(0, 200) : [];
      stmts.push(
        env.DB.prepare(
          `INSERT INTO quotes (id, slug, status, published_at, created_at, updated_at, data) VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET status = excluded.status, published_at = excluded.published_at,
             updated_at = excluded.updated_at, data = excluded.data`
        ).bind(
          raw.id.slice(0, 80),
          await uniqueSlug(env, slug || data.plainText, raw.id),
          status,
          publishedAt,
          typeof raw.createdAt === 'string' ? raw.createdAt : now,
          now,
          JSON.stringify({ ...data, revisions })
        )
      );
      imported++;
    }
    if (stmts.length) await env.DB.batch(stmts);
    return json({ imported });
  }

  const match = path.match(/^\/api\/admin\/quotes\/([^/]+)$/);
  if (match) {
    const id = decodeURIComponent(match[1]);
    const existing = await env.DB.prepare('SELECT * FROM quotes WHERE id = ?').bind(id).first<QuoteRow>();
    if (!existing) return error('القول غير موجود.', 404);

    if (method === 'DELETE') {
      await env.DB.batch([
        env.DB.prepare('DELETE FROM quotes WHERE id = ?').bind(id),
        env.DB.prepare('DELETE FROM stat_events WHERE quote_id = ?').bind(id),
      ]);
      return json({ ok: true });
    }

    if (method === 'PUT') {
      const body = (await req.json().catch(() => null)) as any;
      const parsed = validateQuote(body);
      if (typeof parsed === 'string') return error(parsed, 400);
      if (await featuredConflict(env, parsed, id)) return error('توجد بطاقة أخرى مخصصة لهذا اليوم. عدّل تخصيصها أولًا.', 409);
      const { status, publishedAt, slug, data } = splitInput(parsed);
      const old = JSON.parse(existing.data);
      const now = new Date().toISOString();
      const note = str(body?.revisionNote, 300) || 'تحديث وتنقيح النص';
      const revisions: Revision[] = [
        { id: `rev-${crypto.randomUUID()}`, timestamp: now, note, textSnippet: snippet(data.text), text: data.text },
        ...(Array.isArray(old.revisions) ? old.revisions : []),
      ].slice(0, 200);
      // نحافظ على الرابط القديم ما لم يطلب الكاتب رابطاً جديداً — حتى لا تنكسر الروابط المشاركة
      const finalSlug = slug && slug !== existing.slug ? await uniqueSlug(env, slug, id) : existing.slug;
      await env.DB.prepare('UPDATE quotes SET slug = ?, status = ?, published_at = ?, updated_at = ?, data = ? WHERE id = ?')
        .bind(finalSlug, status, publishedAt, now, JSON.stringify({ ...data, revisions }), id)
        .run();
      const row = await env.DB.prepare('SELECT * FROM quotes WHERE id = ?').bind(id).first<QuoteRow>();
      return json({ quote: rowToQuote(row!, true) });
    }
  }

  return error('المسار غير موجود.', 404);
}

// ---------------------------------------------------------------------------
// المسارات العامة
// ---------------------------------------------------------------------------

async function handlePublicQuotes(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(`SELECT * FROM quotes WHERE ${VISIBLE_WHERE} ORDER BY published_at DESC`)
    .bind(new Date().toISOString())
    .all<QuoteRow>();
  return json({ quotes: results.map((r) => rowToQuote(r)) }, 200, {
    // تخزين قصير حتى يظهر القول المجدول بعد دقيقة على الأكثر من موعده
    'cache-control': 'public, max-age=60, stale-while-revalidate=300',
  });
}

async function handleEvent(req: Request, env: Env): Promise<Response> {
  const body = (await req.json().catch(() => null)) as { quoteId?: string; kind?: EventKind } | null;
  if (!body || typeof body.quoteId !== 'string' || !EVENT_KINDS.includes(body.kind as EventKind)) {
    return error('بيانات غير صالحة.', 400);
  }
  const kind = body.kind as EventKind;
  const quote = await env.DB.prepare(`SELECT id FROM quotes WHERE id = ? AND ${VISIBLE_WHERE}`)
    .bind(body.quoteId, new Date().toISOString())
    .first();
  if (!quote) return error('القول غير موجود.', 404);

  const visitor = await visitorId(req, 'stats');
  const inserted = await env.DB.prepare('INSERT OR IGNORE INTO stat_events (visitor, quote_id, kind, day) VALUES (?, ?, ?, ?)')
    .bind(visitor, body.quoteId, kind, today())
    .run();
  if (inserted.meta.changes > 0) {
    const column = kind === 'read' ? 'reads' : kind === 'save' ? 'saves' : 'shares';
    await env.DB.prepare(`UPDATE quotes SET ${column} = ${column} + 1 WHERE id = ?`).bind(body.quoteId).run();
  }
  return json({ counted: inserted.meta.changes > 0 });
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);
}

async function handleSitemap(req: Request, env: Env): Promise<Response> {
  const origin = new URL(req.url).origin;
  const { results } = await env.DB.prepare(`SELECT slug, updated_at FROM quotes WHERE ${VISIBLE_WHERE} ORDER BY published_at DESC`)
    .bind(new Date().toISOString())
    .all<{ slug: string; updated_at: string }>();
  const pages = ['/', '/library', '/about', '/contact', '/privacy'];
  const urls = [
    ...pages.map((p) => `<url><loc>${origin}${p}</loc></url>`),
    ...results.map(
      (r) => `<url><loc>${origin}/q/${escapeXml(encodeURIComponent(r.slug))}</loc><lastmod>${r.updated_at.slice(0, 10)}</lastmod></url>`
    ),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}

/**
 * يقدّم صفحة التطبيق مع بيانات المعاينة الصحيحة (العنوان، الوصف، الصورة بعنوان كامل، الرابط الأساسي)
 * حتى تظهر المعاينة سليمة في واتساب وX ومحركات البحث.
 */
async function serveShell(
  req: Request,
  env: Env,
  pagePath: string,
  meta?: { title: string; description: string },
  status = 200
): Promise<Response> {
  const url = new URL(req.url);
  const shell = await env.ASSETS.fetch(new Request(`${url.origin}/`, { headers: req.headers }));
  const pageUrl = `${url.origin}${pagePath}`;
  const image = `${url.origin}/og.png`;
  const setContent = (content: string) => ({ element: (el: Element) => { el.setAttribute('content', content); } });

  let rewriter = new HTMLRewriter()
    .on('meta[property="og:image"]', setContent(image))
    .on('meta[name="twitter:image"]', setContent(image))
    .on('head', {
      element: (el) => {
        el.append(`<meta property="og:url" content="${escapeXml(pageUrl)}" /><link rel="canonical" href="${escapeXml(pageUrl)}" />`, {
          html: true,
        });
      },
    });

  if (meta) {
    rewriter = rewriter
      .on('title', { element: (el) => { el.setInnerContent(meta.title); } })
      .on('meta[name="description"]', setContent(meta.description))
      .on('meta[property="og:title"]', setContent(meta.title))
      .on('meta[property="og:description"]', setContent(meta.description))
      .on('meta[name="twitter:title"]', setContent(meta.title))
      .on('meta[name="twitter:description"]', setContent(meta.description));
  }

  const res = rewriter.transform(shell);
  const headers = new Headers(res.headers);
  // الصفحة نفسها لا تُخزَّن: بعد كل تحديث يجب أن تشير إلى ملفات البرمجة الجديدة، وإلا ظهرت صفحة بيضاء
  headers.set('cache-control', 'no-cache');
  return new Response(res.body, { status, headers });
}

/** صفحة قول: نفس التطبيق مع عنوان القول ووصفه */
async function handleQuotePage(req: Request, env: Env, slug: string): Promise<Response> {
  const row = await env.DB.prepare(`SELECT * FROM quotes WHERE slug = ? AND ${VISIBLE_WHERE}`)
    .bind(slug, new Date().toISOString())
    .first<QuoteRow>();
  if (!row) return serveShell(req, env, '/', undefined, 404);

  const q = rowToQuote(row);
  const plain: string = q.plainText || '';
  return serveShell(req, env, `/q/${encodeURIComponent(row.slug)}`, {
    title: `«${plain.length > 70 ? plain.slice(0, 70) + '…' : plain}» — كلماتي`,
    description: q.author === FOLK_AUTHOR ? `${plain.slice(0, 180)} — مثل من التراث الشعبي` : plain.slice(0, 200),
  });
}

function handleRobots(req: Request): Response {
  const origin = new URL(req.url).origin;
  const body = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`;
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=86400' } });
}

// ---------------------------------------------------------------------------
// تجهيز قاعدة البيانات تلقائياً عند أول تشغيل (لا حاجة لأي خطوة يدوية)
// ---------------------------------------------------------------------------

let schemaReady: Promise<void> | null = null;

/**
 * إضافة صيغ اللهجات المقترحة (مرة واحدة):
 * - مقولة بالدارجة وحدها: يصبح أصلها الفصيح هو النص الرئيسي، وتنتقل الدارجة إلى صيغتها الجزائرية.
 * - لا تُستبدل أي صيغة موجودة.
 */
async function fillDialects(env: Env): Promise<void> {
  const done = await env.DB.prepare("SELECT value FROM meta WHERE key = 'dialects_fill_v1'").first();
  if (done) return;
  const { results } = await env.DB.prepare('SELECT * FROM quotes').all<QuoteRow>();
  const now = new Date().toISOString();
  const stmts: D1PreparedStatement[] = [];
  for (const row of results) {
    const fill = DIALECTS_FILL[row.id];
    if (!fill) continue;
    const data = JSON.parse(row.data);
    const dialects: Record<string, { text: string; plainText: string }> = { ...(data.dialects || {}) };
    if (data.darja && !dialects.dz) dialects.dz = data.darja;
    delete data.darja;
    if (data.language === 'darja' && fill.fusha) {
      if (!dialects.dz) dialects.dz = { text: data.text, plainText: data.plainText };
      data.text = fill.fusha;
      data.plainText = stripMarks(fill.fusha);
      data.language = 'fusha';
    }
    for (const id of DIALECT_IDS) {
      const t = (fill as Record<string, string | undefined>)[id];
      if (t && !dialects[id]?.text) dialects[id] = { text: t, plainText: stripMarks(t) };
    }
    data.dialects = dialects;
    data.revisions = [
      { id: `rev-${crypto.randomUUID()}`, timestamp: now, note: 'إضافة صيغ اللهجات', textSnippet: snippet(data.text), text: data.text },
      ...(Array.isArray(data.revisions) ? data.revisions : []),
    ].slice(0, 200);
    stmts.push(env.DB.prepare('UPDATE quotes SET data = ?, updated_at = ? WHERE id = ?').bind(JSON.stringify(data), now, row.id));
  }
  stmts.push(env.DB.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('dialects_fill_v1', ?)").bind(now));
  await env.DB.batch(stmts);
}

/**
 * ترحيل لمرة واحدة: كل قول فصيح مرتبط بصيغة جزائرية في سجل منفصل يصبح سجلاً واحداً
 * يحمل الصيغتين معاً، وتُضاف إحصاءات السجل الجزائري إليه ثم يُحذف.
 */
async function mergeLegacyPairs(env: Env): Promise<void> {
  const done = await env.DB.prepare("SELECT value FROM meta WHERE key = 'merge_pairs_v1'").first();
  if (done) return;
  const { results } = await env.DB.prepare('SELECT * FROM quotes').all<QuoteRow>();
  const byId = new Map(results.map((r) => [r.id, r]));
  const stmts: D1PreparedStatement[] = [];
  const handled = new Set<string>();
  for (const row of results) {
    if (handled.has(row.id)) continue;
    const data = JSON.parse(row.data);
    const pair = data.pairedQuoteId ? byId.get(data.pairedQuoteId) : undefined;
    if (!pair || data.darja) continue;
    const pairData = JSON.parse(pair.data);
    if (pairData.language === data.language) continue;
    const [fRow, fData, dRow, dData] = data.language === 'fusha' ? [row, data, pair, pairData] : [pair, pairData, row, data];
    handled.add(fRow.id);
    handled.add(dRow.id);
    delete fData.pairedQuoteId;
    fData.darja = { text: dData.text, plainText: dData.plainText };
    stmts.push(
      env.DB.prepare('UPDATE quotes SET data = ?, reads = reads + ?, saves = saves + ?, shares = shares + ? WHERE id = ?').bind(
        JSON.stringify(fData), dRow.reads, dRow.saves, dRow.shares, fRow.id
      ),
      env.DB.prepare('DELETE FROM quotes WHERE id = ?').bind(dRow.id)
    );
  }
  stmts.push(env.DB.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('merge_pairs_v1', ?)").bind(new Date().toISOString()));
  await env.DB.batch(stmts);
}

/**
 * فصل الفصحى عن اللهجات (مرة واحدة):
 * - الصيغ التي أضافها المساعد تحت الفصحى تُحذف.
 * - ما كتبه شعيب بالدارجة يعود قولاً مستقلاً باسمه (وما أُضيف له من فصحى يُحذف).
 * - تُضاف أمثال شعبية معروفة من كل لهجة باسم «تراث شعبي».
 */
async function splitStandalone(env: Env): Promise<void> {
  const done = await env.DB.prepare("SELECT value FROM meta WHERE key = 'split_v2'").first();
  if (done) return;
  const { results } = await env.DB.prepare('SELECT * FROM quotes').all<QuoteRow>();
  const now = new Date().toISOString();
  const stmts: D1PreparedStatement[] = [];
  const insert = (id: string, slug: string, status: string, publishedAt: string, createdAt: string, data: unknown) =>
    env.DB.prepare(
      'INSERT OR IGNORE INTO quotes (id, slug, status, published_at, created_at, updated_at, data) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, slug, status, publishedAt, createdAt, now, JSON.stringify(data));

  for (const row of results) {
    const data = JSON.parse(row.data);
    const fill = (DIALECTS_FILL[row.id] || {}) as Record<string, string | undefined>;
    const dialects: Record<string, { text: string; plainText: string }> = { ...(data.dialects || {}) };
    if (data.darja && !dialects.dz) dialects.dz = data.darja;
    if (!Object.keys(dialects).length && !data.darja) continue;
    delete data.darja;

    if (data.language === 'fusha' && fill.fusha && data.text === fill.fusha && dialects.dz) {
      // قول كُتب بالدارجة أصلاً: نعيده كما كتبه الكاتب
      data.text = dialects.dz.text;
      data.plainText = dialects.dz.plainText || stripMarks(dialects.dz.text);
      data.language = 'darja';
      data.dialect = 'dz';
    } else {
      // صيغ كتبها الكاتب نفسه (غير مضافة): تصير أقوالاً مستقلة باسمه
      for (const id of DIALECT_IDS) {
        const v = dialects[id];
        if (!v?.text || fill[id] === v.text) continue;
        const own = {
          ...data,
          text: v.text,
          plainText: v.plainText || stripMarks(v.text),
          language: 'darja',
          dialect: id,
          author: SOLE_AUTHOR,
          dialects: undefined,
          revisions: [{ id: `rev-${crypto.randomUUID()}`, timestamp: now, note: 'فُصلت عن صيغتها الفصحى', textSnippet: snippet(v.text) }],
        };
        stmts.push(insert(`${row.id}-${id}`, `${row.slug}-${id}`, row.status, row.published_at, row.created_at, own));
      }
    }
    delete data.dialects;
    data.revisions = [
      { id: `rev-${crypto.randomUUID()}`, timestamp: now, note: 'فصل الفصحى عن اللهجات', textSnippet: snippet(data.text), text: data.text },
      ...(Array.isArray(data.revisions) ? data.revisions : []),
    ].slice(0, 200);
    stmts.push(env.DB.prepare('UPDATE quotes SET data = ?, updated_at = ? WHERE id = ?').bind(JSON.stringify(data), now, row.id));
  }

  // الأمثال الشعبية: تواريخ نشر متتابعة قبل اليوم حتى لا تتصدّر كلها
  const base = Date.now() - 1000 * 60 * 60 * 24 * 40;
  FOLK_PROVERBS.forEach((p, i) => {
    const at = new Date(base + i * 1000 * 60 * 60 * 31).toISOString();
    stmts.push(
      insert(p.id, p.slug, 'published', at, at, {
        text: p.text,
        plainText: stripMarks(p.text),
        language: 'darja',
        dialect: p.dialect,
        author: FOLK_AUTHOR,
        topics: p.topics,
        revisions: [{ id: `rev-${crypto.randomUUID()}`, timestamp: now, note: 'مثل من التراث الشعبي', textSnippet: snippet(p.text) }],
      })
    );
  });

  stmts.push(env.DB.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('split_v2', ?)").bind(now));
  await env.DB.batch(stmts);
}

/** تشكيل الأمثال الشعبية (مرة واحدة)؛ لا يمس مثلاً عدّله الكاتب من لوحة الإدارة */
async function vocalizeFolk(env: Env): Promise<void> {
  const done = await env.DB.prepare("SELECT value FROM meta WHERE key = 'folk_tashkeel_v1'").first();
  if (done) return;
  const now = new Date().toISOString();
  const stmts: D1PreparedStatement[] = [];
  for (const p of FOLK_PROVERBS) {
    const row = await env.DB.prepare('SELECT data FROM quotes WHERE id = ?').bind(p.id).first<{ data: string }>();
    if (!row) continue;
    const data = JSON.parse(row.data);
    if (data.text !== FOLK_ORIGINAL_TEXT[p.id]) continue;
    data.text = p.text;
    data.plainText = stripMarks(p.text);
    data.revisions = [
      { id: `rev-${crypto.randomUUID()}`, timestamp: now, note: 'إضافة التشكيل', textSnippet: snippet(p.text) },
      ...(Array.isArray(data.revisions) ? data.revisions : []),
    ].slice(0, 200);
    stmts.push(env.DB.prepare('UPDATE quotes SET data = ?, updated_at = ? WHERE id = ?').bind(JSON.stringify(data), now, p.id));
  }
  stmts.push(env.DB.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('folk_tashkeel_v1', ?)").bind(now));
  await env.DB.batch(stmts);
}

/** خطة الشهر (مرة واحدة): 20 منشوراً مجدولاً لأيام الاقتباسات العالمية والأمثال؛ يُتخطّى أي يوم مخصّص مسبقاً */
async function seedMonthPlan(env: Env): Promise<void> {
  const done = await env.DB.prepare("SELECT value FROM meta WHERE key = 'month_plan_v1'").first();
  if (done) return;
  const now = new Date().toISOString();
  const stmts: D1PreparedStatement[] = [];
  for (const p of MONTH_PLAN) {
    const taken = await env.DB.prepare("SELECT id FROM quotes WHERE json_extract(data, '$.featuredDate') = ?").bind(p.date).first();
    if (taken) continue;
    const at = `${p.date}T10:00:00.000Z`; // 13:00 بتوقيت الدوحة
    const data = {
      text: p.text,
      plainText: stripMarks(p.text),
      language: p.language,
      dialect: p.dialect,
      author: p.author,
      sourceNote: p.sourceNote,
      sourceUrl: p.sourceUrl,
      featuredDate: p.date,
      topics: p.topics,
      revisions: [{ id: `rev-${crypto.randomUUID()}`, timestamp: now, note: 'خطة الشهر: جدولة تلقائية', textSnippet: snippet(p.text) }],
    };
    stmts.push(
      env.DB.prepare(
        'INSERT OR IGNORE INTO quotes (id, slug, status, published_at, created_at, updated_at, data) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(p.id, p.slug, 'scheduled', at, now, now, JSON.stringify(data))
    );
  }
  stmts.push(env.DB.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('month_plan_v1', ?)").bind(now));
  await env.DB.batch(stmts);
}

function ensureSchema(env: Env): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await env.DB.batch([
        env.DB.prepare(`CREATE TABLE IF NOT EXISTS quotes (
          id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'draft',
          published_at TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, data TEXT NOT NULL,
          reads INTEGER NOT NULL DEFAULT 0, saves INTEGER NOT NULL DEFAULT 0, shares INTEGER NOT NULL DEFAULT 0)`),
        env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_quotes_visible ON quotes (status, published_at)'),
        env.DB.prepare(`CREATE TABLE IF NOT EXISTS stat_events (
          visitor TEXT NOT NULL, quote_id TEXT NOT NULL, kind TEXT NOT NULL, day TEXT NOT NULL,
          PRIMARY KEY (visitor, quote_id, kind, day))`),
        env.DB.prepare(`CREATE TABLE IF NOT EXISTS login_attempts (
          visitor TEXT PRIMARY KEY, failures INTEGER NOT NULL DEFAULT 0, window_start INTEGER NOT NULL)`),
        env.DB.prepare('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)'),
      ]);
      await mergeLegacyPairs(env);
      const count = await env.DB.prepare('SELECT COUNT(*) AS n FROM quotes').first<{ n: number }>();
      if (!count || count.n === 0) {
        await env.DB.batch(
          SEED.map((q) =>
            env.DB.prepare(
              'INSERT OR IGNORE INTO quotes (id, slug, status, published_at, created_at, updated_at, data) VALUES (?, ?, ?, ?, ?, ?, ?)'
            ).bind(q.id, q.slug, q.status, q.publishedAt, q.createdAt, q.createdAt, JSON.stringify(q.data))
          )
        );
      }
      await fillDialects(env);
      await splitStandalone(env);
      await vocalizeFolk(env);
      await seedMonthPlan(env);
      // كاتب واحد: أي قول قديم باسم آخر يُنسب إلى شعيب المطوع (الاسم محفوظ داخل بيانات القول)
      await env.DB.prepare("UPDATE quotes SET data = json_set(data, '$.author', ?1) WHERE json_extract(data, '$.author') NOT IN (?1, 'تراث شعبي') AND json_extract(data, '$.language') NOT IN ('en', 'fr')").bind(SOLE_AUTHOR).run();
    })().catch((e) => {
      schemaReady = null; // نعيد المحاولة في الطلب التالي
      throw e;
    });
  }
  return schemaReady;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;

    try {
      const needsDb = path.startsWith('/api/') || path === '/sitemap.xml' || path.startsWith('/q/');
      if (needsDb) await ensureSchema(env);
      if (path.startsWith('/api/admin/')) return await handleAdmin(req, env, path);
      if (path === '/api/quotes' && req.method === 'GET') return await handlePublicQuotes(env);
      if (path === '/api/events' && req.method === 'POST') return await handleEvent(req, env);
      if (path.startsWith('/api/push/')) {
        // نحفظ عنوان الموقع لتستعمله المهمة المجدولة في روابط الإشعارات
        await env.DB.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('site_origin', ?)").bind(url.origin).run();
        const res = await handlePush(req, env, path);
        if (res) return res;
      }
      if (path.startsWith('/api/')) return error('المسار غير موجود.', 404);
      if (path === '/sitemap.xml') return await handleSitemap(req, env);
      if (path === '/robots.txt') return handleRobots(req);
      if (path === '/' && (req.method === 'GET' || req.method === 'HEAD')) return await serveShell(req, env, '/');

      const quoteMatch = path.match(/^\/q\/([^/]+)\/?$/);
      if (quoteMatch && (req.method === 'GET' || req.method === 'HEAD')) {
        return await handleQuotePage(req, env, decodeURIComponent(quoteMatch[1]));
      }
    } catch (e) {
      console.error('worker error', path, e);
      if (path.startsWith('/api/')) return error('حدث خطأ في الخادم.', 500);
    }

    return env.ASSETS.fetch(req);
  },

  /** كل 15 دقيقة: إرسال «كلمة اليوم» لمن حلّ موعده */
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      (async () => {
        await ensureSchema(env);
        const row = await env.DB.prepare("SELECT value FROM meta WHERE key = 'site_origin'").first<{ value: string }>();
        if (!row) return; // لا اشتراكات بعد
        const result = await runDailyPush(env, row.value);
        if (result.sent || result.failed) console.log('daily push', result);
      })()
    );
  },
} satisfies ExportedHandler<Env>;
