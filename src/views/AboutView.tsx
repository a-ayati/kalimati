import React from 'react';
import { 
  Feather, 
  Sparkles, 
  Palette, 
  Smartphone, 
  ShieldCheck, 
  Clock, 
  Layers,
  Heart
} from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-8 text-right">
      
      {/* Hero Header */}
      <div className="text-center space-y-3 border-b border-white/10 pb-8">
        <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 mb-2">
          <Feather className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-amiri text-white tracking-wide">
          عَنْ مَنَصَّةِ «خَلْوَة»
        </h1>
        <p className="text-base text-amber-400 font-cairo">
          «خَلْوَةٌ لَا تَخْلُو…»
        </p>
        <p className="text-xs sm:text-sm text-stone-400 max-w-xl mx-auto leading-relaxed">
          فضاء أدبي أصيل مكرّس لجمال الكلمة المكتوبة باللغة العربية الفصحى والدارجة الجزائرية، في ثوب بصري يحتفي بالخط والزخرفة والسكينة.
        </p>
      </div>

      {/* 1. الفكرة والرسالة */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#141518] border border-white/10 space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span>1. فكرة المشروع ورسالته</span>
        </h2>
        <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-cairo">
          تنطلق منصة «خَلْوَة» من إيمان عميق بأن الكلمة الصادقة رزق يسوقه الله للقلوب في أوانه.
          خواطرها بالفصحى نتاج تجربة كتابية حقيقية، لا اقتباسات منسوخة ولا حشوًا عابرًا، وإلى جانبها أمثال شعبية معروفة من لهجات عربية مختلفة تُنسب إلى تراث أهلها.
          ويمكن قراءة كل ذلك وحفظه وتخصيص طريقة ظهوره بدقة متناهية.
        </p>
      </div>

      {/* 2. الهوية البصرية والخطوط والتشكيل */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#141518] border border-white/10 space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <Palette className="w-5 h-5 text-amber-400" />
          <span>2. الهوية البصرية والخط والزخرفة</span>
        </h2>
        <div className="space-y-3 text-xs sm:text-sm text-stone-300 leading-relaxed">
          <p>
            تعتمد الهوية الرسمية لبطاقات «خَلْوَة» على:
          </p>
          <ul className="list-disc list-inside space-y-2 text-stone-400 mr-2 text-xs">
            <li>
              <strong className="text-stone-200">الخلفية:</strong> سواد فاحم بملمس هادئ يحاكي الورق الطبيعي المعالج.
            </li>
            <li>
              <strong className="text-stone-200">لون التشكيل (الحركات):</strong> التشكيل <span className="text-rose-400 font-bold">الأحمر القاني</span> للعبارات الفصحى، والتشكيل <span className="text-amber-400 font-bold">الأصفر الخردلي</span> للعبارات الجزائرية، مع المحافظة التامة على اتصال الحروف العربية وعدم انقطاعها.
            </li>
            <li>
              <strong className="text-stone-200">الإطار المزدوج:</strong> إطار ذهبي خارجي رفيع وآخر داخلي بأركان ماسية هادئة وفواصل زهرية ناعمة.
            </li>
            <li>
              <strong className="text-stone-200">الخطوط المرخصة والمخطوطات:</strong> نستخدم خطوط ويب عربية أصيلة مفتوحة المصدر (Amiri, Aref Ruqaa, Reem Kufi, Cairo). وحين تُعرض كتابة مخطوطة فنية يدويًا، يتم التعامل معها كعمل فني مستقل بذاته دون ادعاء إمكانية تطبيقها آليًا على أي نص.
            </li>
          </ul>
        </div>
      </div>

      {/* 3. الفرق بين ميزات الإطلاق والتوسعات المستقبلية */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#141518] border border-white/10 space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-400" />
          <span>3. خارطة الطريق: ميزات الإطلاق والإضافات المستقبلية</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Launch features */}
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
            <div className="font-bold text-emerald-400 text-sm flex items-center gap-1.5">
              <span>ميزات الإطلاق الأول الحالية (المتاحة الآن):</span>
            </div>
            <ul className="space-y-1.5 text-stone-300 list-disc list-inside">
              <li>حكمة اليوم والمكتبة الشاملة وصفحات الاقتباسات والكاتب.</li>
              <li>«وصلتني في وقتها» مع تصنيف المشاعر والملاحظات الخاصة.</li>
              <li>مولّد بطاقات المشاركة بـ 3 مقاسات (Story, Square, Portrait).</li>
              <li>قسم «على ذوقك» للتخصيص البصري والخطوط.</li>
              <li>«لحظة سكون» مع عداد الخمول وميزة إبقاء الشاشة مضاءة Wake Lock.</li>
              <li>لوحة إدارة الكاتب وسجل التعديلات والتوثيق والجدولة.</li>
              <li>تطبيق ويب تقدّمي PWA يعمل دون اتصال للمحتوى المحفوظ.</li>
              <li>تجهيز الفهرسة وملف Sitemap وRobots وبيانات Schema.org.</li>
            </ul>
          </div>

          {/* Future roadmap */}
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
            <div className="font-bold text-amber-400 text-sm flex items-center gap-1.5">
              <span>التوسعات المستقبلية المخططة:</span>
            </div>
            <ul className="space-y-1.5 text-stone-300 list-disc list-inside">
              <li>«وراء الكلمات» بتسجيلات صوتية حصرية بصوت الكاتب.</li>
              <li>«رسالة إلى نفسي» تصلك في موعد تحدده لاحقًا.</li>
              <li>صيغ الإهداء التفاعلية: «حين قرأتها، تذكّرتك».</li>
              <li>رفع مخطوطات فنية أصلية مرسومة باليد لكل خاطرة.</li>
              <li>رحلات موضوعية أسبوعية متسلسلة.</li>
              <li>دراسة تطبيقات الويدجت (Widgets) حسب محددات نظامي iOS وأندرويد دون ادعاء إمكانية تثبيتها من المتصفح وحده.</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
};
