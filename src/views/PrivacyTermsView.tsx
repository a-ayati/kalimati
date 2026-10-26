import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Scale, 
  Search, 
  FileText, 
  UserCheck, 
  Sparkles 
} from 'lucide-react';

export const PrivacyTermsView: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-8 text-right text-xs sm:text-sm text-stone-300">
      
      {/* Header */}
      <div className="border-b border-white/10 pb-6 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-amber-400">المعايير القانونية والشفافية</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-amiri text-white pt-2 pb-1 leading-normal tracking-wide">
          الخصوصية، شروط الاستخدام، وحقوق المحتوى
        </h1>
        <p className="text-xs sm:text-sm text-stone-400">
          بيان واضح وصريح يوضّح كيفية حماية خصوصيتك، وحقوق النصوص الأدبية، وآلية الفهرسة.
        </p>
      </div>

      {/* 1. الخصوصية الفردية وحرمة الخواطر */}
      <div className="p-6 rounded-3xl bg-[#141518] border border-white/10 space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>1. خصوصية القارئ وسرية الملاحظات (الخصوصية أولاً)</span>
        </h2>
        <div className="space-y-2 text-stone-300 leading-relaxed font-cairo">
          <p>
            تلتزم منصة «خَلْوَة» بأقصى درجات احترام الخصوصية الشخصية:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-stone-400 text-xs">
            <li>
              <strong>الخواطر والملاحظات خاصة تمامًا:</strong> أي ملاحظة تكتبها أو شعور تحدده عند الضغط على «وصلتني في وقتها» يُخزّن محليًا داخل متصفحك أو جهازك فقط، ولا يُرفع إلى خوادم عامة ولا يُشارك مع أي طرف آخر أو حتى صاحب المنصة.
            </li>
            <li>
              <strong>التصفح متاح بالكامل دون حساب:</strong> لا نلزمك بإنشاء حساب لتصفح الكلمات أو حفظها أو مشاركتها.
            </li>
            <li>
              <strong>التحكم المطلق في بياناتك:</strong> يمكنك في أي وقت تصدير نسختك الاحتياطية بصيغة JSON أو مسح جميع محفوظاتك بنقرة زر واحدة من قسم «حسابي».
            </li>
            <li>
              <strong>عدم وجود تتبّع تجسسي:</strong> الإحصاءات المعروضة في لوحة الإدارة هي أرقام إجمالية مجمعة مجهولة الهوية لعدد مرات الحفظ والمشاركة، لغرض تحسين المحتوى فقط دون المساس ببيانات الأفراد.
            </li>
          </ul>
        </div>
      </div>

      {/* 2. نسبة النصوص وحقوق الملكية الأدبية */}
      <div className="p-6 rounded-3xl bg-[#141518] border border-white/10 space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Scale className="w-4 h-4 text-amber-400" />
          <span>2. نسبة الكتابات وحقوق الملكية الفكرية</span>
        </h2>
        <div className="space-y-2.5 text-stone-300 leading-relaxed font-cairo">
          <p>
            جميع الخواطر المنشورة في «خَلْوَة» نتاج أدبي أصيل خاص بالمنصة. أما الأمثال الشعبية باللهجات فهي من التراث، وتُنسب إليه.
          </p>
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20 text-xs text-stone-300 space-y-2">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>توضيح قانوني وأدبي هام:</span>
            </div>
            <p>
              تحتفظ المنصة داخليًا بسجل التعديلات والمسودات وتواريخ الإنشاء للمساعدة في توثيق مسار الكتابة الأدبية والأسبقية الفكرية.
              ومع ذلك، لا ندّعي أن هذا التوثيق الرقمي يمثل إثباتًا قانونيًا حاسمًا أو بديلاً عن التسجيل الرسمي لدى مكاتب وهيئات حقوق المؤلف المعتمدة.
              كما ننوه إلى أن أهلية العبارات والحكم القصيرة للحماية القانونية كحقوق مؤلف تختلف بحسب درجة أصالتها الإبداعية والقوانين السارية في كل دولة.
            </p>
          </div>
        </div>
      </div>

      {/* 3. التمييز بين فهرسة محركات البحث والتسجيل القانوني */}
      <div className="p-6 rounded-3xl bg-[#141518] border border-white/10 space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Search className="w-4 h-4 text-amber-400" />
          <span>3. الفهرسة في جوجل وظهور النصوص</span>
        </h2>
        <div className="space-y-2 text-stone-300 leading-relaxed font-cairo text-xs">
          <p>
            تتبع المنصة أفضل ممارسات الفهرسة والزحف لمساعدة محركات البحث (مثل Google) على اكتشاف المصدر الأصلي للنصوص وربطها باسم كاتبها وتاريخ نشرها الفعلي.
          </p>
          <p className="text-stone-400">
            * نؤكد بوضوح أن الفهرسة وظهور الرابط في جوجل هو إجراء تقني للاكتشاف والوصول، وليس «تسجيل حقوق رسمي في جوجل». جوجل لا يضمن عرض اسم الكاتب بجوار كل مقتطف في نتائج البحث أو ترتيبًا ثابتًا للنتائج.
          </p>
        </div>
      </div>

      {/* 4. شروط الاقتباس والمشاركة */}
      <div className="p-6 rounded-3xl bg-[#141518] border border-white/10 space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-400" />
          <span>4. شروط الاقتباس والمشاركة</span>
        </h2>
        <p className="leading-relaxed font-cairo text-xs">
          يسعدنا ويسرنا مشاركة هذه الكلمات والخواطر لتعم الفائدة وتصل إلى كل من يحتاجها، مع الرجاء الأخلاقي والأدبي بالحفاظ على نسبة النص إلى «خَلْوَة» وإبقاء الختم وتوقيع المنصة على البطاقات المصممة.
          لا يُسمح بإعادة تجميع النصوص أو بيعها لأغراض تجارية دون إذن كتابي مسبق من الكاتب.
        </p>
      </div>

    </div>
  );
};
