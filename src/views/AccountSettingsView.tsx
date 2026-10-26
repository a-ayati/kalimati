import React, { useEffect, useState } from 'react';
import { dailyPushStatus, pushSupport, sendTestPush, subscribeDaily, unsubscribeDaily } from '../lib/push';
import { useKalimati } from '../context/KalimatiContext';
import { 
  Bell, 
  Moon, 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  Lock, 
  Check, 
  Clock, 
  Shield, 
  Eye, 
  Sparkles,
  Smartphone
} from 'lucide-react';

export const AccountSettingsView: React.FC = () => {
  const { 
    notificationSettings, 
    setNotificationSettings, 
    requestNotificationPermission,
    zenSettings, 
    setZenSettings, 
    setIsZenActive, 
    exportBackupJson, 
    importBackupJson, 
    savedItems, 
    setActiveTab 
  } = useKalimati();

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [dataMsg, setDataMsg] = useState<string | null>(null);

  const support = pushSupport();
  const [busy, setBusy] = useState(false);
  const [checkingPush, setCheckingPush] = useState(true);
  const [pushState, setPushState] = useState('جارٍ التحقق من الاشتراك…');
  useEffect(() => {
    let active = true;
    dailyPushStatus().then(status => {
      if (!active) return;
      setNotificationSettings(prev => ({ ...prev, enabled: status.subscribed, granted: support === 'ok' && Notification.permission === 'granted', scheduledTime: status.time || prev.scheduledTime }));
      setPushState(status.subscribed ? 'الاشتراك مسجل على الخادم' : support === 'ok' ? 'غير مفعّلة على هذا الجهاز' : 'الإشعارات غير متاحة في وضع التصفح الحالي');
    }).catch(() => { if(active) setPushState('تعذّر التحقق من الاشتراك؛ تحقق من الاتصال.'); }).finally(() => {if(active) setCheckingPush(false);});
    return () => { active = false; };
  }, [support, setNotificationSettings]);
  const flashNote = (text: string) => {
    setNotificationMsg(text);
    window.setTimeout(() => setNotificationMsg(null), 5000);
  };

  // تفعيل / إيقاف الإشعار اليومي
  const handleToggleNotification = async () => {
    if (busy || checkingPush) return;
    if (support === 'install-first') {
      flashNote('على الآيفون: اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية»، وافتح خَلْوَة من أيقونتها ثم فعّل الإشعار.');
      return;
    }
    if (support === 'unsupported') {
      flashNote('هذا المتصفح لا يدعم الإشعارات.');
      return;
    }
    setBusy(true);
    try {
      if (!notificationSettings.enabled) {
        await requestNotificationPermission();
        setPushState('الاشتراك مسجل على الخادم');
        flashNote(`تم تفعيل الاشتراك الساعة ${notificationSettings.scheduledTime}. جرّب زر الإشعار التجريبي للتأكد من الوصول.`);
      } else {
        await unsubscribeDaily();
        setNotificationSettings((prev) => ({ ...prev, enabled: false }));
        setPushState('غير مفعّلة على هذا الجهاز');
        flashNote('تم إيقاف الإشعار اليومي.');
      }
    } catch (e) {
      flashNote(e instanceof Error ? e.message : 'تعذّر تفعيل الإشعار.');
    } finally {
      setBusy(false);
    }
  };

  // تغيير الموعد: يُحدَّث على الخادم مباشرة إن كان الإشعار مفعّلاً
  const handleTimeChange = async (time: string) => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return;
    if (busy || checkingPush) return;
    if (!notificationSettings.enabled) {
      setNotificationSettings(prev => ({...prev, scheduledTime: time}));
      flashNote('حُفظ الوقت على الجهاز. اضغط تفعيل الإشعار للاشتراك.');
      return;
    }
    setBusy(true);
    try {
      await subscribeDaily(time);
      setNotificationSettings(prev => ({...prev, scheduledTime: time}));
      flashNote(`حُفظ الموعد على الخادم: ${time}. إذا مضى موعد اليوم يبدأ الإرسال غدًا.`);
    } catch(e) { flashNote(e instanceof Error ? e.message : 'لم يُحفظ الموعد.'); }
    finally { setBusy(false); }
  };

  const handleTest = async () => {
    setBusy(true);
    try {
      await sendTestPush();
      flashNote('قبلت خدمة الإشعارات الطلب التجريبي. إذا لم يظهر، راجع إعدادات إشعارات المتصفح والنظام ووضع التركيز.');
    } catch (e) {
      flashNote(e instanceof Error ? e.message : 'تعذّر الإرسال.');
    } finally {
      setBusy(false);
    }
  };

  // Export JSON
  const handleExport = () => {
    const jsonStr = exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kalimati-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    setDataMsg('تم تنزيل النسخة الاحتياطية بنجاح.');
    setTimeout(() => setDataMsg(null), 3000);
  };

  // Import JSON
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const success = importBackupJson(text);
      if (success) {
        setDataMsg('تم استيراد بياناتك بنجاح.');
      } else {
        alert('الملف غير صالح كنسخة احتياطية لمنصة خَلْوَة.');
      }
      setTimeout(() => setDataMsg(null), 3000);
    };
    reader.readAsText(file);
  };

  // Clear all data
  const handleClearData = () => {
    if (confirm('هل أنت متأكد من مسح جميع محفوظاتك وملاحظاتك الشخصية من هذا الجهاز؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-8 text-right text-xs sm:text-sm">
      
      {/* Header */}
      <div className="border-b border-white/10 pb-6 space-y-3">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-amiri text-white pt-2 pb-1 leading-normal tracking-wide">
          إِعْدَادَاتِي
        </h1>
        <p className="text-xs sm:text-sm text-stone-400">
          إدارة تجربة القراءة، الإشعارات اليومية، وضع لحظة سكون، والتحكم في بياناتك المحلية.
        </p>
      </div>

      {/* 1. الإشعارات اليومية (Section 9) */}
      <div className="p-6 rounded-3xl bg-[#141518] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">إشعار كلمة اليوم</h2>
              <p className="text-xs text-stone-400">«كَلِمَةٌ لَكَ الْيَوْمَ…» تصلك بهدوء في الموعد الذي تختاره</p>
            </div>
          </div>

          <button
            onClick={handleToggleNotification}
            disabled={busy || checkingPush}
            className={`px-4 py-2 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
              notificationSettings.enabled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-white/5 text-stone-400 border-white/10 hover:border-white/20'
            }`}
          >
            {busy || checkingPush ? 'جارٍ التحقق…' : notificationSettings.enabled ? 'مفعلة ✓ — إيقاف' : 'تفعيل الإشعار'}
          </button>
        </div>

        <p role="status" className="text-xs text-amber-200">{pushState}</p>
        {notificationMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
            {notificationMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-stone-300 font-medium mb-1.5">موعد الإشعار اليومي:</label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                disabled={busy || checkingPush}
                value={notificationSettings.scheduledTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-stone-200 text-xs focus:outline-none focus:border-amber-500"
              />
              <span className="text-[11px] text-stone-500">(الموعد المقترح: الواحدة ظهرًا 13:00)</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-[11px] text-stone-400 leading-relaxed space-y-2">
            <p>بعد التفعيل تُرسل الكلمة بتوقيتك المحلي حتى والمنصة مغلقة على الأجهزة المدعومة. قد يتأخر وصولها بحسب الاتصال والنظام. الموعد الذي مضى يبدأ من الغد.</p>
            {support === 'install-first' && (
              <p className="text-amber-300">على الآيفون: أضف خَلْوَة إلى الشاشة الرئيسية أولاً، ثم فعّل الإشعار من داخلها.</p>
            )}
            {notificationSettings.enabled && (
              <button
                onClick={handleTest}
                disabled={busy}
                className="px-3 py-1.5 rounded-full text-[11px] font-bold glass-pill text-[#e8b931] cursor-pointer disabled:opacity-60"
              >
                أرسل إشعاراً تجريبياً الآن
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. إعدادات «لحظة سكون» (Section 8) */}
      <div className="p-6 rounded-3xl bg-[#141518] border border-white/10 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">إعدادات «لحظة سكون»</h2>
              <p className="text-xs text-stone-400">تتلاشى الواجهة بلطف عند التوقف عن التفاعل ليعيش قلبك مع الحكمة</p>
            </div>
          </div>

          <button
            onClick={() => setIsZenActive(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>معاينة الآن</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          {/* Enable toggle */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div>
              <div className="font-semibold text-stone-200">التشغيل التلقائي</div>
              <div className="text-[10px] text-stone-400">بدء السكون عند الخمول</div>
            </div>
            <input
              type="checkbox"
              checked={zenSettings.enabled}
              onChange={(e) => setZenSettings((prev) => ({ ...prev, enabled: e.target.checked }))}
              className="w-4 h-4 accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Idle delay */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
            <div className="font-semibold text-stone-200">بدء العرض بعد خمول:</div>
            <select
              value={zenSettings.idleSeconds}
              onChange={(e) => setZenSettings((prev) => ({ ...prev, idleSeconds: Number(e.target.value) as any }))}
              className="w-full p-1.5 rounded-lg bg-black/50 border border-white/10 text-stone-200 text-xs"
            >
              <option value={10}>10 ثوانٍ (تجربة سريعة)</option>
              <option value={30}>30 ثانية (متوازن ومريح)</option>
              <option value={60}>60 ثانية (دقيقة كاملة)</option>
            </select>
          </div>

          {/* Quote source */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
            <div className="font-semibold text-stone-200">مصدر الكلمات:</div>
            <select
              value={zenSettings.quoteSource}
              onChange={(e) => setZenSettings((prev) => ({ ...prev, quoteSource: e.target.value as any }))}
              className="w-full p-1.5 rounded-lg bg-black/50 border border-white/10 text-stone-200 text-xs"
            >
              <option value="all">جميع الحكم — دون تكرار حتى تنتهي المجموعة</option>
              <option value="today">حكمة اليوم فقط</option>
              <option value="saved">من محفوظاتي الخاصة ({savedItems.length})</option>
              <option value="short">كلمات قصيرة مكثفة</option>
            </select>
          </div>

          {/* Display duration */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
            <div className="font-semibold text-stone-200">مدة عرض كل حكمة:</div>
            <select
              value={zenSettings.displayDurationSeconds}
              onChange={(e) => setZenSettings((prev) => ({ ...prev, displayDurationSeconds: Number(e.target.value) as any }))}
              className="w-full p-1.5 rounded-lg bg-black/50 border border-white/10 text-stone-200 text-xs"
            >
              <option value={0}>حتى ألمس الشاشة (دائم)</option>
              <option value={10}>10 ثوانٍ لكل حكمة</option>
              <option value={60}>دقيقة كاملة</option>
            </select>
          </div>

          {/* Show clock and date */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div>
              <div className="font-semibold text-stone-200">إظهار الساعة والتاريخ</div>
              <div className="text-[10px] text-stone-400">ساعة عربية هادئة في الأعلى</div>
            </div>
            <input
              type="checkbox"
              checked={zenSettings.showClock}
              onChange={(e) => setZenSettings((prev) => ({ ...prev, showClock: e.target.checked }))}
              className="w-4 h-4 accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Keep awake toggle */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div>
              <div className="font-semibold text-stone-200">إبقاء الشاشة مضاءة</div>
              <div className="text-[10px] text-stone-400">منع إغلاق الهاتف أثناء السكون</div>
            </div>
            <input
              type="checkbox"
              checked={zenSettings.keepAwake}
              onChange={(e) => setZenSettings((prev) => ({ ...prev, keepAwake: e.target.checked }))}
              className="w-4 h-4 accent-amber-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 3. التحكم بالبيانات والنسخ الاحتياطي (Section 13) */}
      <div className="p-6 rounded-3xl bg-[#141518] border border-white/10 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">بياناتك ومحفوظاتك المحلية</h2>
            <p className="text-xs text-stone-400">تحكم كامل في محفوظاتك وتصديرها لنقلها بين أجهزتك بكل حرية</p>
          </div>
        </div>

        {dataMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
            {dataMsg}
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap pt-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-200 border border-white/10 text-xs font-semibold cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>تصدير نسخة احتياطية (JSON)</span>
          </button>

          <label className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-200 border border-white/10 text-xs font-semibold cursor-pointer">
            <Upload className="w-4 h-4 text-amber-400" />
            <span>استيراد نسخة احتياطية</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>

          <button
            onClick={handleClearData}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold cursor-pointer mr-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>مسح جميع المحفوظات</span>
          </button>
        </div>
      </div>

      {/* 4. لوحة الإدارة لصاحب المشروع */}
      <div className="p-5 rounded-3xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">لوحة إدارة الكاتب</h3>
            <p className="text-xs text-stone-400">مخصصة لصاحب المشروع لنشر الخواطر وتعديلها وإدارتها</p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('admin')}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors cursor-pointer"
        >
          الدخول للوحة الإدارة
        </button>
      </div>

    </div>
  );
};
