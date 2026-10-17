# كلماتي — كلمة تصل في وقتها

منصة أدبية لأقوال وخواطر أصلية بالفصحى والدارجة الجزائرية: كلمة اليوم، مكتبة، محفوظات شخصية مع ملاحظات، بطاقات مشاركة، لحظة سكون، وتطبيق ويب يعمل دون اتصال (PWA).

## البنية

| الجزء | التقنية | المكان |
|---|---|---|
| الواجهة | React 19 + Vite + Tailwind | `src/` |
| الخادم | Cloudflare Worker | `worker/index.ts` |
| قاعدة البيانات | Cloudflare D1 | `migrations/` |
| النشر | GitHub Actions | `.github/workflows/deploy.yml` |

### ما يقدّمه الخادم

- `GET /api/quotes` — الأقوال المنشورة. القول **المجدول** يظهر وحده عند حلول موعده.
- `POST /api/events` — إحصاءات حقيقية (قراءة، حفظ، مشاركة): الزائر يُحسب مرة لكل قول ونوع في اليوم، ولا يُخزَّن عنوانه.
- `/q/<الرابط>` — صفحة دائمة لكل قول، بعنوانه ووصفه لتظهر المعاينة صحيحة في واتساب وX ومحركات البحث.
- `/sitemap.xml` و`/robots.txt` — يُبنيان تلقائياً.
- `/api/admin/*` — لوحة الكاتب على `/admin`، بكلمة مرور تُحفظ سرّاً على Cloudflare فقط، مع قفل لمدة 15 دقيقة بعد 5 محاولات خاطئة.

## النشر (مرة واحدة)

أضف هذه الأسرار في المستودع: **Settings → Secrets and variables → Actions → New repository secret**

| الاسم | القيمة |
|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | معرّف حسابك في Cloudflare (يظهر في لوحة Workers) |
| `CLOUDFLARE_API_TOKEN` | رمز API بصلاحيات: Workers Scripts (Edit)، D1 (Edit)، Account Settings (Read) |
| `ADMIN_PASSWORD` | كلمة مرور لوحة الكاتب — طويلة وقوية |

بعدها كل رفع إلى `main` يبني الموقع ويُنشئ قاعدة البيانات (أول مرة) ويطبّق التحديثات وينشر.
تغيير `ADMIN_PASSWORD` ثم إعادة النشر يُخرج كل الجلسات القديمة.

## التشغيل محلياً

```bash
npm install
echo 'ADMIN_PASSWORD="local-password"' > .dev.vars
npm run db:migrate:local
npm run preview          # الموقع كاملاً مع الخادم على http://localhost:8787
```

للعمل على الواجهة فقط مع إعادة التحميل الفوري: شغّل `npm run preview` في نافذة و`npm run dev` في أخرى (طلبات `/api` تُمرَّر إلى الخادم المحلي).
