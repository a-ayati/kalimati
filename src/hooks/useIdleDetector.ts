import { useEffect, useRef } from 'react';
import { useKalimati } from '../context/KalimatiContext';

export function useIdleDetector() {
  const { zenSettings, isZenActive, setIsZenActive } = useKalimati();
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!zenSettings.enabled || isZenActive) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      
      // Delay in ms based on user settings (10, 30, or 60 seconds)
      const timeoutMs = (zenSettings.idleSeconds || 30) * 1000;

      timerRef.current = setTimeout(() => {
        // Only trigger if document is active and visible
        if (document.querySelector('[aria-modal="true"]')) { resetTimer(); return; }
        if (document.visibilityState === 'visible') {
          setIsZenActive(true);
        }
      }, timeoutMs);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    // Start initial timer
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [zenSettings.enabled, zenSettings.idleSeconds, isZenActive, setIsZenActive]);
}
