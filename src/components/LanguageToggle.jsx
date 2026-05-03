import { useTranslation } from '../lib/translations.jsx';

const STROKE = '#1F3A2A';

// Minimal EN | ES toggle. Two render variants:
//   - "floating": fixed-position pill for mobile (next to the Menu button)
//   - "inline":   text-only segment for desktop (sits inside the sidebar header)
//
// The inactive language is dimmed; tap on either label to switch. We render
// both labels at all times so the layout never reflows, and the affordance
// is obvious (you can see the alternative).
export default function LanguageToggle({ variant = 'inline' }) {
  const { lang, setLang } = useTranslation();

  const labelStyle = (selected) => ({
    color: STROKE,
    opacity: selected ? 1 : 0.4,
    fontWeight: selected ? 700 : 500,
    textDecoration: selected ? 'none' : 'none',
    cursor: selected ? 'default' : 'pointer',
    fontFamily: '"Darker Grotesque", system-ui, sans-serif',
    transition: 'opacity 150ms ease',
  });

  const buttons = (
    <>
      <button
        type="button"
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        aria-label="Switch to English"
        style={{
          ...labelStyle(lang === 'en'),
          background: 'none',
          border: 'none',
          padding: 0,
          fontSize: 'inherit',
          letterSpacing: 'inherit',
          textTransform: 'inherit',
        }}
      >
        EN
      </button>
      <span aria-hidden style={{ opacity: 0.35, color: STROKE }}>
        |
      </span>
      <button
        type="button"
        onClick={() => setLang('es')}
        aria-pressed={lang === 'es'}
        aria-label="Cambiar a español"
        style={{
          ...labelStyle(lang === 'es'),
          background: 'none',
          border: 'none',
          padding: 0,
          fontSize: 'inherit',
          letterSpacing: 'inherit',
          textTransform: 'inherit',
        }}
      >
        ES
      </button>
    </>
  );

  if (variant === 'floating') {
    // Mobile-only floating pill. Sits to the right of the Menu button at
    // the same `top` value, never overlapping it (Menu pill is ≈110px wide
    // + 16px left margin → ~126px; we start at 140px to leave breathing
    // room and match the Menu pill's safe-area inset).
    return (
      <div
        className="fixed top-4 z-30 flex min-h-[44px] items-center gap-2 rounded-full border border-white/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] shadow-md"
        style={{
          left: 140,
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          WebkitBackdropFilter: 'blur(14px) saturate(140%)',
          backdropFilter: 'blur(14px) saturate(140%)',
          top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        }}
      >
        {buttons}
      </div>
    );
  }

  // Inline variant — sits inside the desktop sidebar header.
  return (
    <div
      className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em]"
      style={{ color: STROKE }}
    >
      {buttons}
    </div>
  );
}
