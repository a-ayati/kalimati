/**
 * أمثال شعبية معروفة من كل لهجة — من التراث، لا تُنسب إلى كاتب المنصة.
 * تُضاف مرة واحدة إلى قاعدة البيانات، ويمكن تعديلها أو حذفها بعدها من لوحة الإدارة.
 */
export const FOLK_AUTHOR = 'تراث شعبي';

export interface FolkProverb {
  id: string;
  slug: string;
  dialect: 'dz' | 'ma' | 'tn' | 'eg' | 'gulf' | 'sham';
  text: string;
  topics: string[];
}

export const FOLK_PROVERBS: FolkProverb[] = [
  // الجزائر
  { id: 'folk-dz-1', slug: 'mathal-dz-khouk', dialect: 'dz', text: 'خُوكْ خُوكْ لَا يْغُرّْكْ صَاحْبَكْ', topics: ['العلاقات'] },
  { id: 'folk-dz-2', slug: 'mathal-dz-assel', dialect: 'dz', text: 'اللِّي يْحَبّْ الْعْسَلْ يَصْبَرْ لْقْرِيصْ النّْحَلْ', topics: ['الصبر'] },
  { id: 'folk-dz-3', slug: 'mathal-dz-khanfous', dialect: 'dz', text: 'كُلّْ خَنْفُوسْ عَنْدْ امُّو غْزَالْ', topics: ['العلاقات'] },
  { id: 'folk-dz-4', slug: 'mathal-dz-yed', dialect: 'dz', text: 'يَدّْ وَحْدَة مَا تْصَفَّقْشْ', topics: ['العلاقات'] },
  { id: 'folk-dz-5', slug: 'mathal-dz-kbir', dialect: 'dz', text: 'اللِّي مَا عَنْدُو كْبِيرْ يَشْرِيلُو كْبِيرْ', topics: ['التأمّل'] },
  // المغرب
  { id: 'folk-ma-1', slug: 'mathal-ma-rbeh', dialect: 'ma', text: 'اللِّي بْغَا يْرْبَحْ الْعَامْ طْوِيلْ', topics: ['الصبر'] },
  { id: 'folk-ma-2', slug: 'mathal-ma-sanayi', dialect: 'ma', text: 'سْبَعْ صْنَايَعْ وَالرّْزَقْ ضَايَعْ', topics: ['التأمّل'] },
  { id: 'folk-ma-3', slug: 'mathal-ma-hout', dialect: 'ma', text: 'حُوتْ يَاكُلْ حُوتْ وْقْلِيلْ الْجْهْدْ يْمُوتْ', topics: ['التأمّل'] },
  { id: 'folk-ma-4', slug: 'mathal-ma-lila', dialect: 'ma', text: 'اللِّي فَاتَكْ بْلِيلَة فَاتَكْ بْحِيلَة', topics: ['التأمّل'] },
  { id: 'folk-ma-5', slug: 'mathal-ma-flous', dialect: 'ma', text: 'اللِّي مَا عَنْدُو فْلُوسْ كْلَامُو مْسُوسْ', topics: ['عزّة النفس'] },
  // تونس
  { id: 'folk-tn-1', slug: 'mathal-tn-yahseb', dialect: 'tn', text: 'اللِّي يْحَسْبْ وَحْدُو يْفَضْلُو', topics: ['التأمّل'] },
  { id: 'folk-tn-2', slug: 'mathal-tn-taes', dialect: 'tn', text: 'اخْدِمْ يَا التَّاعِسْ لِلنَّاعِسْ', topics: ['التأمّل'] },
  { id: 'folk-tn-3', slug: 'mathal-tn-gerd', dialect: 'tn', text: 'الْقِرْدْ فِي عِينْ امُّو غْزَالْ', topics: ['العلاقات'] },
  { id: 'folk-tn-4', slug: 'mathal-tn-yaarfek', dialect: 'tn', text: 'اللِّي مَا يَعْرْفِكْشْ يْخَسْرِكْ', topics: ['عزّة النفس'] },
  { id: 'folk-tn-5', slug: 'mathal-tn-zitna', dialect: 'tn', text: 'زِيتْنَا فِي دْقِيقْنَا', topics: ['العلاقات'] },
  // مصر
  { id: 'folk-eg-1', slug: 'mathal-eg-ekhtashou', dialect: 'eg', text: 'اللِّي اخْتَشُوا مَاتُوا', topics: ['عزّة النفس'] },
  { id: 'folk-eg-2', slug: 'mathal-eg-wez', dialect: 'eg', text: 'ابْنْ الْوِزّْ عَوَّامْ', topics: ['العلاقات'] },
  { id: 'folk-eg-3', slug: 'mathal-eg-ezaz', dialect: 'eg', text: 'اللِّي بِيتُه مِنْ إِزَازْ مَا يِحْدِفْشْ النَّاسْ بِالطُّوبْ', topics: ['التأمّل'] },
  { id: 'folk-eg-4', slug: 'mathal-eg-maghloub', dialect: 'eg', text: 'يَا بَخْتْ مِنْ بَاتْ مَغْلُوبْ وْمَا بَاتْشْ غَالِبْ', topics: ['الطمأنينة'] },
  { id: 'folk-eg-5', slug: 'mathal-eg-ads', dialect: 'eg', text: 'اللِّي مَا يِعْرَفْشْ يِقُولْ عَدَسْ', topics: ['التأمّل'] },
  // الخليج
  { id: 'folk-gulf-1', slug: 'mathal-gulf-saqr', dialect: 'gulf', text: 'اللِّي مَا يَعْرِفْ الصَّقْرْ يِشْوِيهْ', topics: ['التأمّل'] },
  { id: 'folk-gulf-2', slug: 'mathal-gulf-ghareeb', dialect: 'gulf', text: 'يَا غَرِيبْ كُنْ أَدِيبْ', topics: ['الغربة والحنين'] },
  { id: 'folk-gulf-3', slug: 'mathal-gulf-sawani', dialect: 'gulf', text: 'مَا كِلّْ مَنْ صَفّْ الصَّوَانِي قَالْ أَنَا حَلْوَانِي', topics: ['التأمّل'] },
  { id: 'folk-gulf-4', slug: 'mathal-gulf-awwal', dialect: 'gulf', text: 'اللِّي مَا لَهْ أَوَّلْ مَا لَهْ تَالِي', topics: ['البدايات'] },
  { id: 'folk-gulf-5', slug: 'mathal-gulf-sadha', dialect: 'gulf', text: 'مَنْ صَادَهَا عَشَّى عْيَالَهْ', topics: ['الأمل'] },
  // الشام
  { id: 'folk-sham-1', slug: 'mathal-sham-mjarrab', dialect: 'sham', text: 'اللِّي بِيْجَرِّبْ الْمْجَرَّبْ عَقْلُو مْخَرَّبْ', topics: ['التأمّل'] },
  { id: 'folk-sham-2', slug: 'mathal-sham-asfour', dialect: 'sham', text: 'عُصْفُورْ بِالْإِيدْ وَلَا عَشَرَة عَالشَّجَرَة', topics: ['الطمأنينة'] },
  { id: 'folk-sham-3', slug: 'mathal-sham-tal', dialect: 'sham', text: 'بُكْرَا بِيْدُوبْ التَّلْجْ وْبِيْبَانْ الْمَرْجْ', topics: ['الأمل'] },
  { id: 'folk-sham-4', slug: 'mathal-sham-dik', dialect: 'sham', text: 'كُلّْ دِيكْ عَلَى مَزْبَلْتُو صَيَّاحْ', topics: ['عزّة النفس'] },
  { id: 'folk-sham-5', slug: 'mathal-sham-nakhle', dialect: 'sham', text: 'الطُّولْ طُولْ نَخْلَة وَالْعَقْلْ عَقْلْ سَخْلَة', topics: ['التأمّل'] },
];

/** نصوص الأمثال كما أُضيفت أول مرة (دون تشكيل): يُحدَّث المثل إلى نسخته المشكولة فقط إن لم يُعدَّل بعد */
export const FOLK_ORIGINAL_TEXT: Record<string, string> = {
  'folk-dz-1': 'خوك خوك لا يغرّك صاحبك',
  'folk-dz-2': 'اللي يحبّ العسل يصبر لقريص النحل',
  'folk-dz-3': 'كل خنفوس عند امّو غزال',
  'folk-dz-4': 'يد وحدة ما تصفّقش',
  'folk-dz-5': 'اللي ما عندو كبير يشريلو كبير',
  'folk-ma-1': 'اللي بغا يربح العام طويل',
  'folk-ma-2': 'سبع صنايع والرزق ضايع',
  'folk-ma-3': 'حوت ياكل حوت وقليل الجهد يموت',
  'folk-ma-4': 'اللي فاتك بليلة فاتك بحيلة',
  'folk-ma-5': 'اللي ما عندو فلوس كلامو مسوس',
  'folk-tn-1': 'اللي يحسب وحدو يفضلو',
  'folk-tn-2': 'اخدم يا التاعس للناعس',
  'folk-tn-3': 'القرد في عين امّو غزال',
  'folk-tn-4': 'اللي ما يعرفكش يخسرك',
  'folk-tn-5': 'زيتنا في دقيقنا',
  'folk-eg-1': 'اللي اختشوا ماتوا',
  'folk-eg-2': 'ابن الوز عوّام',
  'folk-eg-3': 'اللي بيته من إزاز ما يحدفش الناس بالطوب',
  'folk-eg-4': 'يا بخت من بات مغلوب وما باتش غالب',
  'folk-eg-5': 'اللي ما يعرفش يقول عدس',
  'folk-gulf-1': 'اللي ما يعرف الصقر يشويه',
  'folk-gulf-2': 'يا غريب كن أديب',
  'folk-gulf-3': 'ما كل من صفّ الصواني قال أنا حلواني',
  'folk-gulf-4': 'اللي ما له أوّل ما له تالي',
  'folk-gulf-5': 'من صادها عشّى عياله',
  'folk-sham-1': 'اللي بيجرّب المجرّب عقلو مخرّب',
  'folk-sham-2': 'عصفور باليد ولا عشرة عالشجرة',
  'folk-sham-3': 'بكرا بيدوب التلج وبيبان المرج',
  'folk-sham-4': 'كل ديك على مزبلتو صيّاح',
  'folk-sham-5': 'الطول طول نخلة والعقل عقل سخلة',
};
