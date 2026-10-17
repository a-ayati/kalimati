import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

/**
 * تحديث تلقائي: عند نشر نسخة جديدة يتسلّمها التطبيق ويعيد تحميل الصفحة فوراً،
 * حتى لا يبقى الهاتف على نسخة قديمة محفوظة للعمل دون اتصال.
 */
const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return;
    const check = () => registration.update().catch(() => undefined);
    // فحص عند العودة إلى التطبيق، وكل 30 دقيقة أثناء فتحه
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check();
    });
    window.setInterval(check, 30 * 60 * 1000);
  },
});
void updateSW;

createRoot(document.getElementById('root')!).render(<App />);
