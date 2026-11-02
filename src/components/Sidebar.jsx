import { useEffect, useState } from 'react';
import AboutPanel from './AboutPanel.jsx';
import LivedExperiences from './LivedExperiences.jsx';
import ImpactReport from './ImpactReport.jsx';
import FeedbackModal from './FeedbackModal.jsx';
import LanguageToggle from './LanguageToggle.jsx';
import { useTranslation } from '../lib/translations.jsx';

const TABS = [
  { id: 'about', tKey: 'sidebar.tab.about' },
  { id: 'experiences', tKey: 'sidebar.tab.experiences' },
];

const MOBILE_QUERY = '(max-width: 767px)';

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

export default function Sidebar({
  userExperiences,
  highlightedId,
  placingMode,
  currentUserId,
  isAdmin = false,
  activeTab = 'about',
  onChangeTab = () => {},
  onStartPlacing,
  onCancelPlacing,
  onDeleteExperience,
  currentLocation = null,
  onClearLocation = () => {},
  vizMode = false,
  onToggleViz = () => {},
  viewMode = 'experience',
  onSwitchToDataMap = () => {},
  onBackToExperience = () => {},
  insights = [],
  onMobileOpenChange = () => {},
}) {
  const inDataMap = viewMode === 'datamap';
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  // Mobile starts collapsed so the map is the focus; desktop is always open.
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-open on the data-map page so the Impact Report is reachable;
  // close again whenever the contributor enters pin-placement mode (the
  // map needs the full screen for tap targets).
  useEffect(() => {
    if (!isMobile) return;
    if (placingMode) setMobileOpen(false);
  }, [isMobile, placingMode]);

  // Lock the page behind the drawer while it's open on mobile so the map
  // can't catch stray scroll/tap events.
  useEffect(() => {
    if (!isMobile) return;
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isMobile, mobileOpen]);

  // Let App hide the floating overlays (language pill, nav hint, Legend)
  // while the mobile drawer is open so nothing sits on top of it.
  useEffect(() => {
    onMobileOpenChange(isMobile && mobileOpen);
  }, [isMobile, mobileOpen, onMobileOpenChange]);

  const showAside = !isMobile || mobileOpen;

  const sidebarBody = (
    <>
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-semibold leading-none tracking-tight text-brand-green sm:text-5xl">
            StreetReader
          </h1>
          {/* Mobile: inline EN | ES under the title while the drawer is
              open (the floating pill from App.jsx hides then). */}
          {isMobile && (
            <div className="mt-3">
              <LanguageToggle variant="inline" />
            </div>
          )}
        </div>
        <div className="flex flex-shrink-0 items-center gap-3">
          {/* Desktop: inline EN | ES toggle in the header. */}
          {!isMobile && <LanguageToggle variant="inline" />}
          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label={t('sidebar.closeMenu')}
              className="flex h-11 w-11 items-center justify-center rounded-full text-lg leading-none text-brand-green"
              style={{
                border: '1px solid rgba(31, 58, 42, 0.25)',
                backgroundColor: 'rgba(255, 255, 255, 0.4)',
              }}
            >
              ×
            </button>
          )}
        </div>
      </header>

      {!inDataMap && currentLocation && (
        <div className="mb-4 rounded-xl border border-brand-green/30 bg-white/40 p-3">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-brand-green/65">
              {t('sidebar.currentLocation')}
            </p>
            <button
              type="button"
              onClick={onClearLocation}
              className="text-xs leading-none text-brand-green/55 hover:text-brand-green"
              aria-label="clear location"
            >
              ×
            </button>
          </div>
          <p className="mt-1 font-display text-lg font-semibold leading-tight text-brand-green">
            {currentLocation.tags?.name}
          </p>
          {(currentLocation.tags?.shop ||
            currentLocation.tags?.tourism ||
            currentLocation.tags?.amenity ||
            currentLocation.tags?.railway) && (
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-brand-green/55">
              {currentLocation.tags.shop ||
                currentLocation.tags.tourism ||
                currentLocation.tags.amenity ||
                currentLocation.tags.railway}
            </p>
          )}
        </div>
      )}

      {!inDataMap && (
        <nav className="mb-5 flex gap-1 rounded-full border border-white/30 bg-white/20 p-1">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeTab(tab.id)}
                className="flex-1 rounded-full px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] transition md:py-1.5"
                style={{
                  backgroundColor: active ? '#1F3A2A' : 'transparent',
                  color: active ? '#FAF5EB' : '#1F3A2A',
                }}
              >
                {t(tab.tKey)}
              </button>
            );
          })}
        </nav>
      )}

      {/* Mobile: content takes its natural height and the drawer itself
          scrolls, so story cards are never clipped. */}
      <div className={isMobile ? '' : 'flex-1 overflow-hidden'}>
        {inDataMap ? (
          <ImpactReport insights={insights} onBack={onBackToExperience} />
        ) : (
          <>
            {activeTab === 'about' && (
              <AboutPanel onCtaClick={() => onChangeTab('experiences')} />
            )}
            {activeTab === 'experiences' && (
              <LivedExperiences
                userExperiences={userExperiences}
                highlightedId={highlightedId}
                placingMode={placingMode}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onStartPlacing={() => {
                  onStartPlacing?.();
                  if (isMobile) setMobileOpen(false);
                }}
                onCancelPlacing={onCancelPlacing}
                onDeleteExperience={onDeleteExperience}
                vizMode={vizMode}
                onToggleViz={onToggleViz}
                onSwitchToDataMap={onSwitchToDataMap}
              />
            )}
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => setFeedbackOpen(true)}
        className="mt-5 min-h-[44px] w-full rounded-full px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-green/75 transition hover:bg-white/40 hover:text-brand-green md:min-h-0 md:py-2"
        style={{
          backgroundColor: 'transparent',
          border: '1px solid rgba(31, 58, 42, 0.25)',
        }}
      >
        {t('sidebar.platformFeedback')}
      </button>

      <footer className="mt-4 border-t border-white/30 pt-4 text-xs text-brand-green/60">
        {t('sidebar.footer')}
      </footer>
    </>
  );

  // Desktop layout — original floating glass card.
  if (!isMobile) {
    return (
      <>
        <aside
          className="absolute left-6 top-6 bottom-6 z-10 flex w-96 flex-col rounded-2xl border border-white/40 p-6 shadow-xl"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.35)',
            WebkitBackdropFilter: 'blur(20px) saturate(140%)',
            backdropFilter: 'blur(20px) saturate(140%)',
          }}
        >
          {sidebarBody}
        </aside>
        <FeedbackModal
          open={feedbackOpen}
          onClose={() => setFeedbackOpen(false)}
        />
      </>
    );
  }

  // Mobile layout — collapsed pill button + drawer.
  return (
    <>
      {!mobileOpen && (
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label={t('sidebar.openMenu')}
          className="fixed left-4 top-4 z-30 flex min-h-[44px] items-center gap-2 rounded-full border border-white/40 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-green shadow-md"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            WebkitBackdropFilter: 'blur(14px) saturate(140%)',
            backdropFilter: 'blur(14px) saturate(140%)',
            top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
          }}
        >
          <span aria-hidden style={{ display: 'inline-flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ width: 14, height: 1.5, background: '#1F3A2A' }} />
            <span style={{ width: 14, height: 1.5, background: '#1F3A2A' }} />
            <span style={{ width: 14, height: 1.5, background: '#1F3A2A' }} />
          </span>
          {t('sidebar.menu')}
        </button>
      )}

      {mobileOpen && (
        <>
          {/* Scrim — taps close the drawer */}
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-20"
            style={{
              backgroundColor: 'rgba(31, 58, 42, 0.18)',
              WebkitBackdropFilter: 'blur(4px)',
              backdropFilter: 'blur(4px)',
            }}
          />
          <aside
            className="fixed inset-y-0 left-0 z-30 flex w-[88vw] max-w-[420px] flex-col overflow-y-auto overscroll-contain border-r border-white/40 p-5 shadow-2xl"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              WebkitBackdropFilter: 'blur(22px) saturate(140%)',
              backdropFilter: 'blur(22px) saturate(140%)',
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
            }}
          >
            {sidebarBody}
          </aside>
        </>
      )}

      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </>
  );
}
