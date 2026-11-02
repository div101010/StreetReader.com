import { useEffect, useState } from 'react';
import { useTranslation } from '../lib/translations.jsx';

const STROKE = '#1F3A2A';        // brand dark green — used for housing dots, metro squares, ring strokes
const SAGE = '#8FAA90';          // tree green
const SAND = '#B5A992';          // warm grey/brown — lamps & food-truck rectangles

const MOBILE_QUERY = '(max-width: 767px)';

// Each row carries an i18n key for the label; the actual translation is
// resolved at render-time inside <LegendBody>. Icon dimensions scaled up
// ~25% to track the larger typography in the legend container.
const LEGEND_ITEMS = [
  { type: 'circle', color: SAND,   size: 9,            tKey: 'legend.item.lamps' },
  { type: 'circle', color: SAGE,   size: 11,           tKey: 'legend.item.trees' },
  { type: 'circle', color: STROKE, size: 11,           tKey: 'legend.item.housing' },
  { type: 'ring',   color: STROKE, size: 14,           tKey: 'legend.item.shops' },
  { type: 'rect',   color: SAND,   w: 18, h: 8,        tKey: 'legend.item.foodTrucks' },
  { type: 'square', color: STROKE, size: 11,           tKey: 'legend.item.metro' },
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
          // Bumped ring stroke from 1.5 → 1.8 so the outline reads
          // proportionally at the larger icon scale.
          border: `1.8px solid ${item.color}`,
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
        className="font-display text-xl font-semibold uppercase tracking-[0.25em]"
        style={{ color: STROKE }}
      >
        {t('legend.title')}
      </h2>
      <p
        className="mt-2 text-[13px] font-medium uppercase tracking-[0.3em]"
        style={{ color: STROKE, opacity: 0.55 }}
      >
        {t('legend.subtitle')}
      </p>

      <ul
        className="mt-7 space-y-4"
        style={{ color: STROKE, fontSize: 15, lineHeight: 1.55, fontWeight: 500 }}
      >
        {LEGEND_ITEMS.map((item) => (
          <li key={item.tKey} className="flex items-center gap-4">
            <span
              style={{
                width: 24,
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
        className="mt-6 h-px"
        style={{ backgroundColor: 'rgba(31, 58, 42, 0.18)' }}
      />
      <p
        className="mt-4 text-[14px] font-medium italic leading-relaxed opacity-60"
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

  // Desktop layout — original floating glass card, top-right. Container
  // scaled up ~25% (w-[22rem] → w-[27rem], p-6 → p-8) to match the larger
  // typography. Stays anchored at right-6/top-6 so it doesn't collide
  // with the bottom-right Compass or the bottom-centre nav hint.
  if (!isMobile) {
    return (
      <div
        className="pointer-events-none absolute right-6 top-6 z-20 w-[27rem] rounded-2xl border border-white/40 p-8 shadow-md"
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
  // uncluttered until the user explicitly asks for the key. The pill sits
  // at bottom-12 so it clears the bottom-4 "Pinch to zoom" hint.
  return (
    <>
      {/* Transparent tap-catcher while open: any tap outside the legend
          only closes it and never reaches the map canvas or the Menu /
          language pills underneath. Closes on click (not pointerdown) so
          the trailing click can't fall through to the map. */}
      {mobileOpen && (
        <div
          aria-hidden
          className="fixed inset-0 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        aria-expanded={mobileOpen}
        aria-label={mobileOpen ? t('legend.closeAria') : t('legend.openAria')}
        className="fixed bottom-12 right-4 z-40 flex items-center gap-2 rounded-full border border-white/40 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.22em] shadow-md"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          WebkitBackdropFilter: 'blur(14px) saturate(140%)',
          backdropFilter: 'blur(14px) saturate(140%)',
          color: STROKE,
          marginBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <span aria-hidden style={{ fontSize: 14 }}>
          {mobileOpen ? '×' : 'ⓘ'}
        </span>
        {t('legend.openMobile')}
      </button>

      {mobileOpen && (
        <div
          className="fixed bottom-[7rem] right-4 z-40 w-[82vw] max-w-[380px] rounded-2xl border border-white/40 p-6 shadow-lg"
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
