import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Quote, 
  SavedItem, 
  CustomStyle, 
  ZenSettings, 
  NotificationSettings, 
  AuthorProfile, 
  ActiveTab, 
  EmotionTag 
} from '../types';
import { SEED_QUOTES, INITIAL_AUTHOR, ALL_TOPICS } from '../data/seedQuotes';
import confetti from 'canvas-confetti';

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
  // Actions
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
  addQuote: (newQuote: Omit<Quote, 'id' | 'createdAt' | 'stats' | 'revisions'>) => Quote;
  updateQuote: (id: string, updates: Partial<Quote>, revisionNote?: string) => void;
  deleteQuote: (id: string) => void;
  exportBackupJson: () => string;
  importBackupJson: (jsonStr: string) => boolean;
  dismissPostSaveNotice: () => void;
}

const DEFAULT_STYLE: CustomStyle = {
  themeId: 'dark',
  fontId: 'ruqaa-ink',
  fontSize: 29,
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
  quoteSource: 'today',
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
  QUOTES: 'kalimati_quotes_v1',
  SAVED: 'kalimati_saved_items_v1',
  STYLE: 'kalimati_custom_style_v1',
  ZEN: 'kalimati_zen_settings_v1',
  NOTIFICATIONS: 'kalimati_notifications_v1',
  AUTHOR: 'kalimati_author_v1',
  TOPICS: 'kalimati_preferred_topics_v1',
};

export const KalimatiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load quotes
  const [quotes, setQuotes] = useState<Quote[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.QUOTES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((q: Quote) =>
            q.author === 'عبد الواحد عياتي' ? { ...q, author: 'شعيب المطوع' } : q
          );
        }
      }
    } catch (e) {
      console.error('Error loading stored quotes:', e);
    }
    return SEED_QUOTES;
  });

  // Load saved items
  const [savedItems, setSavedItems] = useState<SavedItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SAVED);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        quoteId: 'quote-1',
        savedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        emotionTag: 'طمأنتني',
        privateNote: 'قرأتها في لحظة ضيق فكانت كأنها كُتبت لأجلي.',
      },
    ];
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
        if (parsed.name === 'عبد الواحد عياتي') {
          parsed.name = 'شعيب المطوع';
        }
        return parsed;
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

  // UI state
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [isZenActive, setIsZenActive] = useState<boolean>(false);
  const [shareModalQuote, setShareModalQuote] = useState<Quote | null>(null);
  const [postSaveNotice, setPostSaveNotice] = useState<{ show: boolean; quoteText: string } | null>(null);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(quotes));
  }, [quotes]);

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

    // Increment anonymous stats counter on the quote
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
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      alert('متصفحك الحالي لا يدعم إشعارات الويب.');
      return false;
    }
    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    setNotificationSettings((prev) => ({ ...prev, granted, enabled: granted }));
    if (granted) {
      new Notification('كلماتي — مرحبًا بك', {
        body: 'سَتَصِلُكَ كَلِمَةُ الْيَوْمِ فِي مَوْعِدِهَا الْمُحَدَّدِ بِإِذْنِ اللَّهِ.',
        icon: '/pwa-192x192.png',
        dir: 'rtl',
        lang: 'ar',
      });
    }
    return granted;
  }, []);

  // Admin Actions
  const addQuote = useCallback((data: Omit<Quote, 'id' | 'createdAt' | 'stats' | 'revisions'>) => {
    const id = `quote-${Date.now()}`;
    const newQuote: Quote = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      stats: { savesCount: 0, sharesCount: 0, readsCount: 1 },
      revisions: [
        {
          id: `rev-${Date.now()}`,
          timestamp: new Date().toISOString(),
          note: 'إنشاء النص الأولي وحفظه في النظام',
          textSnippet: data.text.substring(0, 45) + '...',
        },
      ],
    };
    setQuotes((prev) => [newQuote, ...prev]);
    return newQuote;
  }, []);

  const updateQuote = useCallback((id: string, updates: Partial<Quote>, revisionNote?: string) => {
    setQuotes((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const newRevisions = revisionNote
          ? [
              {
                id: `rev-${Date.now()}`,
                timestamp: new Date().toISOString(),
                note: revisionNote,
                textSnippet: (updates.text || q.text).substring(0, 45) + '...',
              },
              ...q.revisions,
            ]
          : q.revisions;

        return {
          ...q,
          ...updates,
          revisions: newRevisions,
        };
      })
    );
  }, []);

  const deleteQuote = useCallback((id: string) => {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
    setSavedItems((prev) => prev.filter((s) => s.quoteId !== id));
  }, []);

  // Backup & Restore
  const exportBackupJson = useCallback(() => {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      quotes,
      savedItems,
      customStyle,
      author,
    };
    return JSON.stringify(backup, null, 2);
  }, [quotes, savedItems, customStyle, author]);

  const importBackupJson = useCallback((jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.quotes && Array.isArray(data.quotes)) setQuotes(data.quotes);
      if (data.savedItems && Array.isArray(data.savedItems)) setSavedItems(data.savedItems);
      if (data.customStyle) setCustomStyle(data.customStyle);
      if (data.author) setAuthor(data.author);
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }, []);

  const openShareModal = useCallback((quote: Quote) => {
    setShareModalQuote(quote);
    // increment share stat
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
        addQuote,
        updateQuote,
        deleteQuote,
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
