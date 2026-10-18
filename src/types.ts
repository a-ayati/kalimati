export type Language = 'fusha' | 'darja' | 'en' | 'fr';

export type QuoteStatus = 'draft' | 'review' | 'scheduled' | 'published';

export interface QuoteRevision {
  id: string;
  timestamp: string;
  note: string;
  textSnippet: string;
  text?: string;
}

export type DialectId = 'dz' | 'ma' | 'tn' | 'eg' | 'gulf' | 'sham';

export interface QuoteVariant {
  text: string; // مع التشكيل
  plainText: string;
}

export interface Quote {
  id: string;
  slug: string;
  text: string; // Text with Tashkeel
  plainText: string; // Plain search text without Tashkeel
  language: Language;
  author: string;
  sourceUrl?: string;
  sourceNote?: string;
  featuredDate?: string;
  aiAssisted?: boolean;
  createdAt: string;
  publishedAt: string;
  status: QuoteStatus;
  topics: string[];
  behindTheWords?: string; // الشرح من الكاتب «وراء الكلمات»
  pairedQuoteId?: string; // (قديم) رابط بصيغة مقابلة — استُبدل بالحقل darja
  darja?: QuoteVariant; // (قديم) الصيغة الجزائرية — صارت dialects.dz
  dialects?: Partial<Record<DialectId, QuoteVariant>>; // (قديم) صيغ باللهجات تحت الفصحى — أُلغيت: كل قول يُعرض وحده
  dialect?: DialectId; // لهجة القول حين يكون بالدارجة
  calligraphyManuscriptUrl?: string; // مخطوطة فنية مستقبلية
  audioRecitationUrl?: string; // تسجيل صوتي مستقبلي
  stats: {
    savesCount: number;
    sharesCount: number;
    readsCount: number;
  };
  revisions: QuoteRevision[];
}

export type EmotionTag = 'طمأنتني' | 'عبّرت عنّي' | 'أيقظتني' | 'ألهمتني' | 'داوتني';

export interface SavedItem {
  quoteId: string;
  savedAt: string;
  emotionTag?: EmotionTag;
  privateNote?: string;
}

export type ThemeId = 'dark' | 'vintage' | 'white';

export type FontId = 'ruqaa-ink' | 'ruqaa' | 'rakkas' | 'kufi-ink' | 'amiri' | 'kufi' | 'naskh' | 'cairo';

export type BorderStyle = 'double-gold' | 'arch-corner' | 'minimal' | 'none';

export type TashkeelColor = 'red' | 'yellow' | 'gold' | 'inherit';

export interface CustomStyle {
  themeId: ThemeId;
  fontId: FontId;
  fontSize: number; // حجم خط الفصحى بالبكسل
  /** خط اللهجة (إن لم يُحدَّد فهو خط الفصحى) */
  dialectFontId?: FontId;
  /** حجم خط اللهجة بالبكسل (إن لم يُحدَّد فهو 72% من الفصحى) */
  dialectFontSize?: number;
  lineHeight: number; // 1.6 - 2.4
  tashkeelColor: TashkeelColor;
  showTashkeel: boolean;
  borderStyle: BorderStyle;
  applyTo: 'all' | 'reading' | 'zen' | 'cards';
}

export interface ZenSettings {
  enabled: boolean;
  idleSeconds: 10 | 30 | 60;
  displayDurationSeconds: 10 | 60 | 0; // 0 = until interaction
  quoteSource: 'today' | 'all' | 'saved' | 'short';
  animation: 'fade' | 'drift' | 'static';
  showClock: boolean;
  showDate: boolean;
  keepAwake: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  scheduledTime: string; // e.g. "13:00"
  granted: boolean;
}

export interface AuthorProfile {
  name: string;
  title: string;
  bio: string;
  location: string;
  statementOfOriginality: string;
  socials: {
    x?: string;
    instagram?: string;
    telegram?: string;
    email?: string;
  };
}

export type ActiveTab = 
  | 'today' 
  | 'library' 
  | 'saved' 
  | 'customize' 
  | 'account'
  | 'quote-detail'
  | 'author'
  | 'about'
  | 'privacy-terms'
  | 'contact'
  | 'admin';
