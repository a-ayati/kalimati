import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Quote, 
  SavedItem, 
  CustomStyle, 
  ZenSettings, 
  NotificationSettings, 
  AuthorProfile, 
  ActiveTab, 
  EmotionTag,
  DialectId
} from '../types';
import { SEED_QUOTES, INITIAL_AUTHOR, ALL_TOPICS } from '../data/seedQuotes';
import confetti from 'canvas-confetti';
import { fetchPublicQuotes, trackEvent } from '../lib/api';
import { mergePairs } from '../utils/pairs';
import { DEFAULT_DIALECT, isDialectId } from '../utils/dialects';
import { subscribeDaily } from '../lib/push';

// ---------------------------------------------------------------------------
// الروابط: كل صفحة وكل قول لها عنوان حقيقي في المتصفح
// ---------------------------------------------------------------------------

const TAB_PATHS: Record<Exclude<ActiveTab, 'quote-detail'>, string> = {
  today: '/',
  library: '/library',
  saved: '/saved',
  customize: '/customize',
  account: '/account',
  author: '/', // صفحة الكاتب حُذفت: رابطها القديم يفتح الرئيسية
  about: '/about',
  'privacy-terms': '/privacy',
  contact: '/contact',
  admin: '/admin',
};

const TAB_TITLES: Record<ActiveTab, string> = {
  today: 'خَلْوَة — خَلْوَةٌ لَا تَخْلُو…',
  library: 'المكتبة — خَلْوَة',
  saved: 'محفوظاتي — خَلْوَة',
  customize: 'التخصيص — خَلْوَة',
  account: 'الإعدادات — خَلْوَة',
  author: 'عن الكاتب — خَلْوَة',
  about: 'عن المنصة — خَلْوَة',
  'privacy-terms': 'الخصوصية والشروط — خَلْوَة',
  contact: 'تواصل — خَلْوَة',
  admin: 'لوحة الكاتب — خَلْوَة',
  'quote-detail': 'خَلْوَة',
};

interface Route {
  tab: ActiveTab;
  slug: string | null;
}

function parseRoute(pathname: string): Route {
  const quoteMatch = pathname.match(/^\/q\/([^/]+)\/?$/);
  if (quoteMatch) {
    let slug = quoteMatch[1];
    try {
      slug = decodeURIComponent(slug);
    } catch {
      // اترك الرابط كما هو
    }
    return { tab: 'quote-detail', slug };
  }
  const clean = pathname.replace(/\/+$/, '') || '/';
  const tab = (Object.keys(TAB_PATHS) as Array<keyof typeof TAB_PATHS>).find((t) => TAB_PATHS[t] === clean);
  return { tab: tab || 'today', slug: null };
}

function routeToPath(route: Route): string {
  if (route.tab === 'quote-detail') return route.slug ? `/q/${encodeURIComponent(route.slug)}` : '/library';
  return TAB_PATHS[route.tab];
}

/** الأقوال التي يحق للقارئ رؤيتها من النسخة المضمّنة (عند غياب الاتصال) */
function visibleSeed(): Quote[] {
  const now = Date.now();
  return mergePairs(SEED_QUOTES).filter(
    (q) => (q.status === 'published' || q.status === 'scheduled') && new Date(q.publishedAt).getTime() <= now
  ).map((q) => ({ ...q, status: 'published' as const, stats: { savesCount: 0, sharesCount: 0, readsCount: 0 } }));
}

export type QuotesSource = 'server' | 'cache' | 'offline';

interface KalimatiContextType {
  quotes: Quote[];
  savedItems: SavedItem[];
  customStyle: CustomStyle;
  zenSettings: ZenSettings;
  notificationSettings: NotificationSettings;
  author: AuthorProfile;
  preferredTopics: string[];
  activeTab: ActiveTab;
  selectedQuoteId: string | null;
  isZenActive: boolean;
  shareModalQuote: Quote | null;
  postSaveNotice: { show: boolean; quoteText: string } | null;
  quotesSource: QuotesSource;
  preferredDialect: DialectId;
  setPreferredDialect: (d: DialectId) => void;
  // Actions
  refreshQuotes: () => Promise<void>;
  setActiveTab: (tab: ActiveTab) => void;
  setSelectedQuoteId: (id: string | null) => void;
  openShareModal: (quote: Quote) => void;
  closeShareModal: () => void;
  setIsZenActive: (active: boolean) => void;
  saveQuote: (quoteId: string, emotionTag?: EmotionTag, privateNote?: string) => void;
  removeSavedQuote: (quoteId: string) => void;
  updateSavedQuote: (quoteId: string, emotionTag?: EmotionTag, privateNote?: string) => void;
  isSaved: (quoteId: string) => boolean;
  setPreferredTopics: (topics: string[]) => void;
  setCustomStyle: React.Dispatch<React.SetStateAction<CustomStyle>>;
  resetToOfficialStyle: () => void;
  setZenSettings: React.Dispatch<React.SetStateAction<ZenSettings>>;
  setNotificationSettings: React.Dispatch<React.SetStateAction<NotificationSettings>>;
  requestNotificationPermission: () => Promise<boolean>;
  setAuthor: React.Dispatch<React.SetStateAction<AuthorProfile>>;
  exportBackupJson: () => string;
  importBackupJson: (jsonStr: string) => boolean;
  dismissPostSaveNotice: () => void;
}

const DEFAULT_STYLE: CustomStyle = {
  themeId: 'dark',
  fontId: 'ruqaa-ink',
  fontSize: 29,
  dialectFontId: 'ruqaa-ink',
  dialectFontSize: 29,
  lineHeight: 2.3,
  tashkeelColor: 'red',
  showTashkeel: true,
  borderStyle: 'double-gold',
  applyTo: 'all',
};

const DEFAULT_ZEN: ZenSettings = {
  enabled: true,
  idleSeconds: 30,
  displayDurationSeconds: 0, // stay until interaction
  quoteSource: 'all',
  animation: 'fade',
  showClock: true,
  showDate: true,
  keepAwake: true,
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  enabled: false,
  scheduledTime: '13:00',
  granted: false,
};

const KalimatiContext = createContext<KalimatiContextType | null>(null);

const STORAGE_KEYS = {
  QUOTES_CACHE: 'kalimati_quotes_cache_v2',
  SAVED: 'kalimati_saved_items_v1',
  STYLE: 'kalimati_custom_style_v1',
  ZEN: 'kalimati_zen_settings_v1',
  NOTIFICATIONS: 'kalimati_notifications_v1',
  AUTHOR: 'kalimati_author_v1',
  TOPICS: 'kalimati_preferred_topics_v1',
  DIALECT: 'kalimati_dialect_v1',
};

export const KalimatiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // الأقوال: آخر نسخة من الخادم محفوظة للعمل دون اتصال، وإلا النسخة المضمّنة
  const [quotes, setQuotes] = useState<Quote[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.QUOTES_CACHE);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return mergePairs(parsed);
      }
    } catch (e) {
      console.error('Error loading cached quotes:', e);
    }
    return visibleSeed();
  });
  const [quotesSource, setQuotesSource] = useState<QuotesSource>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.QUOTES_CACHE) ? 'cache' : 'offline';
    } catch {
      return 'offline';
    }
  });

  const refreshQuotes = useCallback(async () => {
    try {
      const fresh = mergePairs((await fetchPublicQuotes()).quotes);
      setQuotes(fresh);
      setQuotesSource('server');
      try {
        localStorage.setItem(STORAGE_KEYS.QUOTES_CACHE, JSON.stringify(fresh));
      } catch {
        // مساحة التخزين ممتلئة — لا بأس
      }
    } catch (e) {
      console.warn('تعذّر تحميل الأقوال من الخادم، نعرض آخر نسخة محفوظة.', e);
    }
  }, []);

  useEffect(() => {
    refreshQuotes();
    const onOnline = () => refreshQuotes();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [refreshQuotes]);

  // Load saved items
  const [savedItems, setSavedItems] = useState<SavedItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SAVED);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Load custom style
  const [customStyle, setCustomStyle] = useState<CustomStyle>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.STYLE);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.lineHeight || parsed.lineHeight < 2.2) {
          parsed.lineHeight = 2.3;
        }
        // الأمثال باللهجات صارت مستقلة: الحجم القديم الصغير (21) يعود مساوياً للفصحى
        if (parsed.dialectFontSize === 21) parsed.dialectFontSize = parsed.fontSize || 29;
        if (parsed.fontId === 'ruqaa') {
          parsed.fontId = 'ruqaa-ink';
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_STYLE;
  });

  // Load zen settings
  const [zenSettings, setZenSettings] = useState<ZenSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ZEN);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_ZEN;
  });

  // Load notification settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_NOTIFICATIONS;
  });

  // Load author profile
  const [author, setAuthor] = useState<AuthorProfile>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUTHOR);
      if (stored) {
        const parsed = JSON.parse(stored);
        // كاتب واحد للمنصة: الاسم ثابت دائماً
        return { ...INITIAL_AUTHOR, ...parsed, name: INITIAL_AUTHOR.name };
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_AUTHOR;
  });

  // Preferred topics for Today page
  const [preferredTopics, setPreferredTopicsState] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TOPICS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return ALL_TOPICS.slice(0, 4); // Default 4 topics
  });

  // لهجة القارئ التي تُعرض تحت الفصحى
  const [preferredDialect, setPreferredDialectState] = useState<DialectId>(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEYS.DIALECT);
      if (isDialectId(v)) return v;
    } catch {
      // تجاهل
    }
    return DEFAULT_DIALECT;
  });
  const setPreferredDialect = useCallback((d: DialectId) => {
    setPreferredDialectState(d);
    try {
      localStorage.setItem(STORAGE_KEYS.DIALECT, d);
    } catch {
      // تجاهل
    }
  }, []);

  // UI state
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.pathname));
  const activeTab = route.tab;
  const routeRef = useRef(route);
  routeRef.current = route;
  // آخر قول اختاره المستخدم (يُستعمل عند الانتقال إلى صفحة القول مباشرة بعد اختياره)
  const pendingSlugRef = useRef<string | null>(route.slug);
  const quotesRef = useRef(quotes);
  quotesRef.current = quotes;

  const selectedQuoteId = useMemo(() => {
    if (!route.slug) return null;
    return quotes.find((q) => q.slug === route.slug || q.id === route.slug)?.id ?? null;
  }, [route.slug, quotes]);

  const navigate = useCallback((next: Route, replace = false) => {
    const path = routeToPath(next);
    if (path !== window.location.pathname) {
      if (replace) window.history.replaceState(null, '', path);
      else window.history.pushState(null, '', path);
    }
    setRoute(next);
  }, []);

  const setActiveTab = useCallback(
    (tab: ActiveTab) => {
      if (tab === 'quote-detail') {
        navigate({ tab, slug: pendingSlugRef.current });
      } else {
        navigate({ tab, slug: null });
      }
    },
    [navigate]
  );

  const setSelectedQuoteId = useCallback(
    (id: string | null) => {
      const q = id ? quotesRef.current.find((x) => x.id === id) : null;
      pendingSlugRef.current = q ? q.slug : null;
      // إن كنا في صفحة قول (مثل «كلمات أخرى في ذات المعنى») ننتقل إلى رابط القول الجديد
      if (q && routeRef.current.tab === 'quote-detail') navigate({ tab: 'quote-detail', slug: q.slug });
    },
    [navigate]
  );

  // زر الرجوع والتقدّم في المتصفح
  useEffect(() => {
    const onPop = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // توحيد الروابط غير المعروفة إلى الصفحة الرئيسية
  useEffect(() => {
    if (route.tab === 'quote-detail') return;
    if (/^\/zen\/?$/.test(window.location.pathname)) return; // شاشة السكون المستقلة
    const path = routeToPath(route);
    const current = window.location.pathname.replace(/\/+$/, '') || '/';
    if (current !== path) window.history.replaceState(null, '', path);
  }, [route]);

  // عنوان الصفحة + احتساب القراءة عند فتح صفحة قول
  useEffect(() => {
    if (route.tab === 'quote-detail' && selectedQuoteId) {
      const q = quotes.find((x) => x.id === selectedQuoteId);
      if (q) {
        const plain = q.plainText.length > 60 ? q.plainText.slice(0, 60) + '…' : q.plainText;
        document.title = `«${plain}» — خَلْوَة`;
      }
    } else {
      document.title = TAB_TITLES[route.tab];
    }
  }, [route, selectedQuoteId, quotes]);

  useEffect(() => {
    if (route.tab === 'quote-detail' && selectedQuoteId) trackEvent(selectedQuoteId, 'read');
  }, [route.tab, selectedQuoteId]);
  const [isZenActive, setIsZenActive] = useState<boolean>(false);
  const [shareModalQuote, setShareModalQuote] = useState<Quote | null>(null);
  const [postSaveNotice, setPostSaveNotice] = useState<{ show: boolean; quoteText: string } | null>(null);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SAVED, JSON.stringify(savedItems));
  }, [savedItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STYLE, JSON.stringify(customStyle));
  }, [customStyle]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ZEN, JSON.stringify(zenSettings));
  }, [zenSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUTHOR, JSON.stringify(author));
  }, [author]);

  const setPreferredTopics = useCallback((topics: string[]) => {
    setPreferredTopicsState(topics);
    localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(topics));
  }, []);

  // Save / Bookmark action
  const saveQuote = useCallback((quoteId: string, emotionTag?: EmotionTag, privateNote?: string) => {
    setSavedItems((prev) => {
      const exists = prev.find((item) => item.quoteId === quoteId);
      if (exists) {
        return prev.map((item) =>
          item.quoteId === quoteId
            ? { ...item, emotionTag: emotionTag || item.emotionTag, privateNote: privateNote ?? item.privateNote }
            : item
        );
      }
      return [
        {
          quoteId,
          savedAt: new Date().toISOString(),
          emotionTag,
          privateNote,
        },
        ...prev,
      ];
    });

    // إحصائية حقيقية على الخادم + تحديث فوري للعرض
    trackEvent(quoteId, 'save');
    setQuotes((prev) =>
      prev.map((q) =>
        q.id === quoteId
          ? { ...q, stats: { ...q.stats, savesCount: q.stats.savesCount + 1 } }
          : q
      )
    );

    // Subtle gentle golden confetti feedback
    try {
      confetti({
        particleCount: 28,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#f59e0b', '#d97706', '#ef4444', '#fbbf24'],
        disableForReducedMotion: true,
      });
    } catch {
      // Ignore if canvas-confetti fails
    }

    // Display the thoughtful suggestion: «شاركها، لعلّها تصل لغيرك في وقتها.»
    const qObj = quotes.find((q) => q.id === quoteId);
    setPostSaveNotice({
      show: true,
      quoteText: qObj?.text || '',
    });
  }, [quotes]);

  const removeSavedQuote = useCallback((quoteId: string) => {
    setSavedItems((prev) => prev.filter((item) => item.quoteId !== quoteId));
  }, []);

  const updateSavedQuote = useCallback((quoteId: string, emotionTag?: EmotionTag, privateNote?: string) => {
    setSavedItems((prev) =>
      prev.map((item) =>
        item.quoteId === quoteId
          ? { ...item, emotionTag, privateNote }
          : item
      )
    );
  }, []);

  const isSaved = useCallback((quoteId: string) => {
    return savedItems.some((item) => item.quoteId === quoteId);
  }, [savedItems]);

  const resetToOfficialStyle = useCallback(() => {
    setCustomStyle(DEFAULT_STYLE);
  }, []);

  const dismissPostSaveNotice = useCallback(() => {
    setPostSaveNotice(null);
  }, []);

  // Notifications
  /** تفعيل الإشعار اليومي: إذن + اشتراك على الخادم بالموعد المختار (يرمي خطأ برسالة واضحة عند الفشل) */
  const requestNotificationPermission = useCallback(async () => {
    await subscribeDaily(notificationSettings.scheduledTime);
    setNotificationSettings((prev) => ({ ...prev, granted: true, enabled: true }));
    return true;
  }, [notificationSettings.scheduledTime]);

  // Backup & Restore
  const exportBackupJson = useCallback(() => {
    // نسخة شخصية: المحفوظات والملاحظات والتخصيص (الأقوال نفسها محفوظة على الخادم)
    const backup = {
      version: 2,
      exportedAt: new Date().toISOString(),
      savedItems,
      customStyle,
      zenSettings,
      preferredTopics,
    };
    return JSON.stringify(backup, null, 2);
  }, [savedItems, customStyle, zenSettings, preferredTopics]);

  const importBackupJson = useCallback((jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data || typeof data !== 'object') return false;
      if (Array.isArray(data.savedItems)) setSavedItems(data.savedItems);
      if (data.customStyle && typeof data.customStyle === 'object') setCustomStyle({ ...DEFAULT_STYLE, ...data.customStyle });
      if (data.zenSettings && typeof data.zenSettings === 'object') setZenSettings({ ...DEFAULT_ZEN, ...data.zenSettings });
      if (Array.isArray(data.preferredTopics)) setPreferredTopics(data.preferredTopics);
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }, [setPreferredTopics]);

  const openShareModal = useCallback((quote: Quote) => {
    setShareModalQuote(quote);
    trackEvent(quote.id, 'share');
    setQuotes((prev) =>
      prev.map((q) =>
        q.id === quote.id
          ? { ...q, stats: { ...q.stats, sharesCount: q.stats.sharesCount + 1 } }
          : q
      )
    );
  }, []);

  const closeShareModal = useCallback(() => {
    setShareModalQuote(null);
  }, []);

  return (
    <KalimatiContext.Provider
      value={{
        quotes,
        savedItems,
        customStyle,
        zenSettings,
        notificationSettings,
        author,
        preferredTopics,
        activeTab,
        selectedQuoteId,
        isZenActive,
        shareModalQuote,
        postSaveNotice,
        quotesSource,
        refreshQuotes,
        preferredDialect,
        setPreferredDialect,
        setActiveTab,
        setSelectedQuoteId,
        openShareModal,
        closeShareModal,
        setIsZenActive,
        saveQuote,
        removeSavedQuote,
        updateSavedQuote,
        isSaved,
        setPreferredTopics,
        setCustomStyle,
        resetToOfficialStyle,
        setZenSettings,
        setNotificationSettings,
        requestNotificationPermission,
        setAuthor,
        exportBackupJson,
        importBackupJson,
        dismissPostSaveNotice,
      }}
    >
      {children}
    </KalimatiContext.Provider>
  );
};

export function useKalimati() {
  const context = useContext(KalimatiContext);
  if (!context) {
    throw new Error('useKalimati must be used within a KalimatiProvider');
  }
  return context;
}
