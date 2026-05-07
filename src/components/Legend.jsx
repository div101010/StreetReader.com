import { useEffect, useState } from 'react';
import { useTranslation } from '../lib/translations.jsx';

const STROKE = '#1F3A2A';        // brand dark green — used for housing dots, metro squares, ring strokes
const SAGE = '#8FAA90';          // tree green
const SAND = '#B5A992';          // warm grey/brown — lamps & food-truck rectangles

const MOBILE_QUERY = '(max-width: 767px)';

// Each row carries an i18n key for the label; the actual translation is
// resolved at render-time inside <LegendBody>.
const LEGEND_ITEMS = [
  { type: 'circle', color: SAND,   size: 7,            tKey: 'legend.item.lamps' },
  { type: 'circle', color: SAGE,   size: 9,            tKey: 'legend.item.trees' },
  { type: 'circle', color: STROKE, size: 9,            tKey: 'legend.item.housing' },
  { type: 'ring',   color: STROKE, size: 11,           tKey: 'legend.item.shops' },
  { type: 'rect',   color: SAND,   w: 14, h: 6,        tKey: 'legend.item.foodTrucks' },
  { type: 'square', color: STROKE, size: 9,            tKey: 'legend.item.metro' },
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(MOBILE_QUERY).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isMobile;
}

function LegendIcon({ item }) {
  const base = { flexShrink: 0, display: 'inline-block' };

  if (item.type === 'circle') {
    return (
      <span
        style={{
          ...base,
          width: item.size,
          height: item.size,
          borderRadius: '50%',
          backgroundColor: item.color,
        }}
      />
    );
  }

  if (item.type === 'ring') {
    return (
      <span
        style={{
          ...base,
          width: item.size,
          height: item.size,
          borderRadius: '50%',
          border: `1.5px solid ${item.color}`,
          backgroundColor: 'transparent',
          boxSizing: 'border-box',
        }}
      />
    );
  }

  if (item.type === 'square') {
    return (
      <span
        style={{
          ...base,
          width: item.size,
          height: item.size,
          backgroundColor: item.color,
        }}
      />
    );
  }

  if (item.type === 'rect') {
    return (
      <span
        style={{
          ...base,
          width: item.w,
          height: item.h,
          backgroundColor: item.color,
        }}
      />
    );
  }

  return null;
}

function LegendBody() {
  const { t } = useTranslation();
  return (
    <>
      <h2
        className="font-display text-base font-semibold uppercase tracking-[0.25em]"
        style={{ color: STROKE }}
      >
        {t('legend.title')}
      </h2>
      <p
        className="mt-1.5 text-[11px] uppercase tracking-[0.3em]"
        style={{ color: STROKE, opacity: 0.55 }}
      >
        {t('legend.subtitle')}
      </p>

      <ul
        className="mt-6 space-y-3"
        style={{ color: STROKE, fontSize: 12.5, lineHeight: 1.55 }}
      >
        {LEGEND_ITEMS.map((item) => (
          <li key={item.tKey} className="flex items-center gap-3.5">
            <span
              style={{
                width: 18,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <LegendIcon item={item} />
            </span>
            <span>{t(item.tKey)}</span>
          </li>
        ))}
      </ul>

      {/* Faint hairline + hover-feature footnote, scoped to the Legend
          body so it travels with both the desktop card and the mobile
          collapsible panel. */}
      <div
        className="mt-5 h-px"
        style={{ backgroundColor: 'rgba(31, 58, 42, 0.18)' }}
      />
      <p
        className="mt-3 text-[12px] font-medium italic leading-relaxed opacity-60"
        style={{ color: STROKE }}
      >
        {t('legend.footnote')}
      </p>
    </>
  );
}

export default function Legend() {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();

  // Desktop layout — original floating glass card, top-right.
  if (!isMobile) {
    return (
      <div
        className="pointer-events-none absolute right-6 top-6 z-20 w-[22rem] rounded-2xl border border-white/40 p-6 shadow-md"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.35)',
          WebkitBackdropFilter: 'blur(14px) saturate(140%)',
          backdropFilter: 'blur(14px) saturate(140%)',
        }}
      >
        <LegendBody />
      </div>
    );
  }

  // Mobile — small "Legend" pill in the bottom-right that expands into
  // a compact panel anchored above it. Keeps the narrow viewport
  // uncluttered until the user explicitly asks for the key.
  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        aria-expanded={mobileOpen}
        aria-label={mobileOpen ? t('legend.closeAria') : t('legend.openAria')}
        className="fixed bottom-4 right-4 z-20 flex items-center gap-2 rounded-full border border-white/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] shadow-md"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          WebkitBackdropFilter: 'blur(14px) saturate(140%)',
          backdropFilter: 'blur(14px) saturate(140%)',
          color: STROKE,
          marginBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <span aria-hidden style={{ fontSize: 12 }}>
          {mobileOpen ? '×' : 'ⓘ'}
        </span>
        {t('legend.openMobile')}
      </button>

      {mobileOpen && (
        <div
          className="fixed bottom-16 right-4 z-20 w-[78vw] max-w-[320px] rounded-2xl border border-white/40 p-5 shadow-lg"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            WebkitBackdropFilter: 'blur(16px) saturate(140%)',
            backdropFilter: 'blur(16px) saturate(140%)',
            marginBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          <LegendBody />
        </div>
      )}
    </>
  );
}
