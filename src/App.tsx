import React, { useEffect } from 'react';
import { KalimatiProvider, useKalimati } from './context/KalimatiContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { TodayView } from './views/TodayView';
import { LibraryView } from './views/LibraryView';
import { SavedView } from './views/SavedView';
import { CustomizeView } from './views/CustomizeView';
import { AccountSettingsView } from './views/AccountSettingsView';
import { QuoteDetailView } from './views/QuoteDetailView';
import { AuthorView } from './views/AuthorView';
import { AboutView } from './views/AboutView';
import { PrivacyTermsView } from './views/PrivacyTermsView';
import { ContactView } from './views/ContactView';
import { AdminView } from './views/AdminView';
import { CardShareModal } from './components/CardShareModal';
import { ZenMode } from './components/ZenMode';
import { OfflineBanner } from './components/OfflineBanner';
import { useIdleDetector } from './hooks/useIdleDetector';

const AppContent: React.FC = () => {
  const { 
    activeTab, 
    shareModalQuote, 
    closeShareModal, 
    isZenActive, 
    setIsZenActive, 
    customStyle 
  } = useKalimati();

  // Activate idle detector for automatic Zen Moment
  useIdleDetector();

  // Scroll to top on tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Determine root theme styling
  const rootThemeClass = 
    customStyle.themeId === 'vintage' 
      ? 'bg-grain-vintage text-[#2b231d]' 
      : customStyle.themeId === 'white' 
      ? 'bg-grain-white text-[#111827]' 
      : 'bg-grain-dark text-[#f5f5f7]';

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${rootThemeClass}`}>
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-8">
        {activeTab === 'today' && <TodayView />}
        {activeTab === 'library' && <LibraryView />}
        {activeTab === 'saved' && <SavedView />}
        {activeTab === 'customize' && <CustomizeView />}
        {activeTab === 'account' && <AccountSettingsView />}
        {activeTab === 'quote-detail' && <QuoteDetailView />}
        {activeTab === 'author' && <AuthorView />}
        {activeTab === 'about' && <AboutView />}
        {activeTab === 'privacy-terms' && <PrivacyTermsView />}
        {activeTab === 'contact' && <ContactView />}
        {activeTab === 'admin' && <AdminView />}
      </main>

      {/* Footer */}
      <Footer />

      {/* Zen Mode Overlay («لحظة سكون») */}
      <ZenMode isOpen={isZenActive} onClose={() => setIsZenActive(false)} />

      {/* Card Share & High-Res PNG Generator Modal */}
      {shareModalQuote && (
        <CardShareModal quote={shareModalQuote} onClose={closeShareModal} />
      )}

      {/* Connectivity & Offline Banner */}
      <OfflineBanner />
    </div>
  );
};

export default function App() {
  return (
    <KalimatiProvider>
      <AppContent />
    </KalimatiProvider>
  );
}
