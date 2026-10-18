/**
 * خطة 30 يوماً (من 19 أكتوبر إلى 17 نوفمبر 2026) حسب دورة الأيام الثلاثة:
 * فصحى الكاتب ← اقتباس عالمي ← مثل شعبي. هنا 20 يوماً: 10 اقتباسات عالمية بمصادرها الأصلية،
 * و10 أمثال شعبية معروفة. الأيام العشرة الباقية محجوزة لخواطر الكاتب بالفصحى.
 * كل منشور مجدول الساعة 13:00 بتوقيت الدوحة (10:00 UTC) ومخصّص لتاريخه، ويمكن تعديله أو حذفه من العيادة.
 */
export interface PlannedPost {
  id: string;
  slug: string;
  date: string; // YYYY-MM-DD
  language: 'en' | 'fr' | 'darja';
  dialect?: 'dz' | 'ma' | 'tn' | 'eg' | 'gulf' | 'sham';
  text: string;
  author: string;
  sourceNote?: string;
  sourceUrl?: string;
  topics: string[];
}

const FOLK = 'تراث شعبي';

export const MONTH_PLAN: PlannedPost[] = [
  // ——— اقتباسات عالمية ———
  { id: 'plan-w01', slug: 'donne-no-man-is-an-island', date: '2026-10-19', language: 'en', author: 'John Donne', text: 'No man is an island, entire of itself.', sourceNote: 'Devotions upon Emergent Occasions (1624), Meditation XVII. Spelling modernized.', sourceUrl: 'https://www.gutenberg.org/ebooks/23772', topics: ['العلاقات'] },
  { id: 'plan-w02', slug: 'voltaire-cultiver-notre-jardin', date: '2026-10-22', language: 'fr', author: 'Voltaire', text: 'Il faut cultiver notre jardin.', sourceNote: 'Candide, ou l’Optimisme (1759), chapitre XXX — phrase finale. Extrait.', sourceUrl: 'https://www.gutenberg.org/ebooks/4650', topics: ['التأمّل'] },
  { id: 'plan-w03', slug: 'keats-a-thing-of-beauty', date: '2026-10-25', language: 'en', author: 'John Keats', text: 'A thing of beauty is a joy for ever.', sourceNote: 'Endymion (1818), Book I, line 1.', sourceUrl: 'https://www.gutenberg.org/ebooks/24280', topics: ['التأمّل'] },
  { id: 'plan-w04', slug: 'la-fontaine-rien-ne-sert-de-courir', date: '2026-10-28', language: 'fr', author: 'Jean de La Fontaine', text: 'Rien ne sert de courir ; il faut partir à point.', sourceNote: 'Fables, livre VI, 10 — « Le Lièvre et la Tortue » (1668), vers 1.', sourceUrl: 'https://www.gutenberg.org/ebooks/56327', topics: ['البدايات'] },
  { id: 'plan-w05', slug: 'dickinson-hope-is-the-thing-with-feathers', date: '2026-10-31', language: 'en', author: 'Emily Dickinson', text: 'Hope is the thing with feathers\nThat perches in the soul.', sourceNote: 'Poems by Emily Dickinson, Series Two (1891), « Hope », lines 1–2.', sourceUrl: 'https://www.gutenberg.org/ebooks/2679', topics: ['الأمل'] },
  { id: 'plan-w06', slug: 'pascal-le-coeur-a-ses-raisons', date: '2026-11-03', language: 'fr', author: 'Blaise Pascal', text: 'Le cœur a ses raisons, que la raison ne connaît point.', sourceNote: 'Pensées, édition Didiot (1896), page 80. Extrait.', sourceUrl: 'https://fr.wikisource.org/wiki/Page:Pascal_-_Pens%C3%A9es,_%C3%A9d._Didiot,_1896.djvu/80', topics: ['العلاقات'] },
  { id: 'plan-w07', slug: 'pope-hope-springs-eternal', date: '2026-11-06', language: 'en', author: 'Alexander Pope', text: 'Hope springs eternal in the human breast.', sourceNote: 'An Essay on Man (1733), Epistle I, line 95.', sourceUrl: 'https://www.gutenberg.org/ebooks/2428', topics: ['الأمل'] },
  { id: 'plan-w08', slug: 'la-fontaine-patience-et-longueur-de-temps', date: '2026-11-09', language: 'fr', author: 'Jean de La Fontaine', text: 'Patience et longueur de temps\nFont plus que force ni que rage.', sourceNote: 'Fables, livre II, 11 — « Le Lion et le Rat » (1668).', sourceUrl: 'https://www.gutenberg.org/ebooks/56327', topics: ['الصبر'] },
  { id: 'plan-w09', slug: 'shakespeare-quality-of-mercy', date: '2026-11-12', language: 'en', author: 'William Shakespeare', text: 'The quality of mercy is not strain’d.', sourceNote: 'The Merchant of Venice, Act IV, Scene I — Portia. Excerpt.', sourceUrl: 'https://www.gutenberg.org/ebooks/1515', topics: ['العلاقات'] },
  { id: 'plan-w10', slug: 'descartes-je-pense-donc-je-suis', date: '2026-11-15', language: 'fr', author: 'René Descartes', text: 'Je pense, donc je suis.', sourceNote: 'Discours de la méthode (1637), quatrième partie, édition Victor Cousin (1824). Extrait.', sourceUrl: 'https://fr.wikisource.org/wiki/Discours_de_la_m%C3%A9thode_(%C3%A9d._Cousin)/Quatri%C3%A8me_partie', topics: ['التأمّل'] },

  // ——— أمثال شعبية معروفة (لهجة مختلفة كل مرة) ———
  { id: 'plan-f01', slug: 'mathal-dz-jamra', date: '2026-10-20', language: 'darja', dialect: 'dz', author: FOLK, text: 'مَا يْحَسّْ بِالْجَمْرَة غِيرْ اللِّي كْوَاتُو', topics: ['الصبر'] },
  { id: 'plan-f02', slug: 'mathal-eg-afreet', date: '2026-10-23', language: 'darja', dialect: 'eg', author: FOLK, text: 'اللِّي يِحَضَّرْ الْعِفْرِيتْ يِصْرِفُه', topics: ['التأمّل'] },
  { id: 'plan-f03', slug: 'mathal-ma-mzoud', date: '2026-10-26', language: 'darja', dialect: 'ma', author: FOLK, text: 'مَا حَاسّْ بِالْمْزُودْ غِيرْ اللِّي مَخْبُوطْ بِيهْ', topics: ['الصبر'] },
  { id: 'plan-f04', slug: 'mathal-sham-malayeh', date: '2026-10-29', language: 'darja', dialect: 'sham', author: FOLK, text: 'يَا رَايِحْ كَتِّرْ مِنْ الْمَلَايِحْ', topics: ['العلاقات'] },
  { id: 'plan-f05', slug: 'mathal-gulf-ain', date: '2026-11-01', language: 'darja', dialect: 'gulf', author: FOLK, text: 'الْعِينْ مَا تِعْلَى عَلَى الْحَاجِبْ', topics: ['عزّة النفس'] },
  { id: 'plan-f06', slug: 'mathal-tn-mzayen', date: '2026-11-04', language: 'darja', dialect: 'tn', author: FOLK, text: 'يَا مْزَيِّنْ مِنْ بَرَّا، آشْ حَالِكْ مِنْ دَاخِلْ', topics: ['التأمّل'] },
  { id: 'plan-f07', slug: 'mathal-dz-waqef', date: '2026-11-07', language: 'darja', dialect: 'dz', author: FOLK, text: 'الدَّنْيَا مْعَ الْوَاقَفْ', topics: ['عزّة النفس'] },
  { id: 'plan-f08', slug: 'mathal-eg-ghorbal', date: '2026-11-10', language: 'darja', dialect: 'eg', author: FOLK, text: 'اللِّي مَا يْشُوفْشْ مِنْ الْغُرْبَالْ يِبْقَى أَعْمَى', topics: ['التأمّل'] },
  { id: 'plan-f09', slug: 'mathal-ma-chah', date: '2026-11-13', language: 'darja', dialect: 'ma', author: FOLK, text: 'كُلّْ شَاة كَتْعَلَّقْ مَنْ كْرَاعْهَا', topics: ['التأمّل'] },
  { id: 'plan-f10', slug: 'mathal-sham-asal', date: '2026-11-16', language: 'darja', dialect: 'sham', author: FOLK, text: 'إِذَا كَانْ حَبِيبَكْ عَسَلْ لَا تِلْحَسُه كُلُّه', topics: ['العلاقات'] },
];
