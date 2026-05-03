import { useEffect, useState } from 'react';
import { useTranslation } from '../lib/translations.jsx';

const BEIGE = '#FAF5EB';
const STROKE = '#1F3A2A';

// 6.5 s total: ~1.5 s enter → ~3.5 s hold → ~1.5 s exit
// Skippable: any click, scroll, or keypress triggers an early exit.
export default function IntroAnimation({ onComplete = () => {} }) {
  const [phase, setPhase] = useState('enter'); // 'enter' | 'hold' | 'exit'
  const { t } = useTranslation();

  // Auto-advance timeline.
  useEffect(() => {
    const t1 = setTimeout(
      () => setPhase((p) => (p === 'enter' ? 'hold' : p)),
      1500,
    );
    const t2 = setTimeout(
      () => setPhase((p) => (p !== 'exit' ? 'exit' : p)),
      5000,
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Once we're exiting, unmount after the fade-out finishes.
  useEffect(() => {
    if (phase !== 'exit') return;
    const t = setTimeout(() => onComplete(), 1500);
    return () => clearTimeout(t);
  }, [phase, onComplete]);

  // Skip handlers — fire once on first interaction.
  useEffect(() => {
    if (phase === 'exit') return;
    const skip = () => setPhase('exit');
    window.addEventListener('wheel', skip, { passive: true, once: true });
    window.addEventListener('keydown', skip, { once: true });
    window.addEventListener('touchstart', skip, { passive: true, once: true });
    return () => {
      window.removeEventListener('wheel', skip);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('touchstart', skip);
    };
  }, [phase]);

  const visible = phase !== 'exit';
  const animatedIn = phase !== 'enter';

  return (
    <div
      onClick={() => setPhase('exit')}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        backgroundColor: BEIGE,
        opacity: visible ? 1 : 0,
        transition: 'opacity 1500ms ease-out',
        pointerEvents: visible ? 'auto' : 'none',
        cursor: visible ? 'pointer' : 'default',
        fontFamily: '"Darker Grotesque", system-ui, sans-serif',
      }}
    >
      <h1
        className="font-display font-semibold leading-none tracking-tight"
        style={{
          color: STROKE,
          fontSize: 'clamp(72px, 12vw, 160px)',
          opacity: animatedIn ? 1 : 0,
          transform: animatedIn ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 1200ms ease-out, transform 1200ms ease-out',
        }}
      >
        StreetReader
      </h1>

      <p
        className="mt-6 italic"
        style={{
          color: STROKE,
          fontSize: '12px',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.4em',
          opacity: animatedIn ? 0.65 : 0,
          transform: animatedIn ? 'translateY(0)' : 'translateY(8px)',
          transition:
            'opacity 1200ms ease-out 350ms, transform 1200ms ease-out 350ms',
        }}
      >
        {t('intro.subtitle')}
      </p>
    </div>
  );
}
