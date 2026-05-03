import { useEffect } from 'react';
import { getCategoryColors } from '../lib/categoryColors.js';
import { useTranslation } from '../lib/translations.jsx';

const STROKE = '#1F3A2A';

export default function EvidenceModal({ insight, onClose = () => {} }) {
  const { t } = useTranslation();
  // Esc to close.
  useEffect(() => {
    if (!insight) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [insight, onClose]);

  if (!insight) return null;

  const isConflict = insight.type === 'Conflict';
  const headerPalette = isConflict ? null : getCategoryColors(insight.type);
  const tagColor = isConflict ? STROKE : headerPalette.primary;
  const stories = insight.stories || [];

  return (
    <div
      onMouseDown={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        // Translucent cream wash over the whole UI — same hue as the modal
        // so it doesn't go gray, plus a soft blur. Sidebar text and map
        // recede into a faint backdrop, modal becomes the focal point.
        backgroundColor: 'rgba(252, 250, 242, 0.75)',
        WebkitBackdropFilter: 'blur(6px)',
        backdropFilter: 'blur(6px)',
        // Honour iOS safe areas so the modal doesn't sit under the
        // notch / home indicator on phones with viewport-fit=cover.
        padding: 'env(safe-area-inset-top, 0px) 16px env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-[480px] max-w-[90vw] flex-col overflow-hidden rounded-2xl border"
        style={{
          backgroundColor: '#FCFAF2',
          borderColor: 'rgba(31, 58, 42, 0.10)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
          fontFamily: '"Darker Grotesque", system-ui, sans-serif',
          color: STROKE,
          // Bottom padding grows by the safe-area inset so the privacy
          // footer never tucks under iOS browser chrome.
          padding: '28px 28px calc(28px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Header — eyebrow, title, close button */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p
              className="text-[10px] font-semibold uppercase text-brand-green/60"
              style={{ letterSpacing: '0.28em' }}
            >
              {t('evidence.eyebrow')}
            </p>
            <h2 className="mt-0.5 font-display text-2xl font-bold leading-tight text-brand-green">
              {insight.zone || t('evidence.zoneFallback')}
            </h2>
            <p
              className="mt-2 font-display text-[11px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: tagColor }}
            >
              {t(`category.${insight.type}`)} ·{' '}
              {insight.count ?? stories.length}{' '}
              {(insight.count ?? stories.length) === 1
                ? t('common.story')
                : t('common.stories')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg leading-none transition hover:bg-white/40"
            style={{
              color: STROKE,
              border: '1px solid rgba(31, 58, 42, 0.2)',
            }}
          >
            ×
          </button>
        </div>

        <div
          className="my-4 h-px"
          style={{ backgroundColor: 'rgba(31, 58, 42, 0.18)' }}
        />

        {/* Story list — scrollable. No usernames or timestamps. */}
        <ul className="flex-1 space-y-3 overflow-y-auto pr-1">
          {stories.length === 0 ? (
            <li className="text-sm italic leading-relaxed text-brand-green/65">
              {t('evidence.empty')}
            </li>
          ) : (
            stories.map((story, idx) => {
              const palette = getCategoryColors(story.type);
              return (
                <li
                  key={idx}
                  className="rounded-xl border p-4"
                  style={{
                    // Category-tinted card so each story keeps its
                    // orange / blue / red identity inside the modal.
                    backgroundColor: palette.bg,
                    borderColor: palette.border,
                  }}
                >
                  {isConflict && (
                    <p
                      className="mb-2 text-[9px] font-semibold uppercase"
                      style={{
                        color: palette.primary,
                        letterSpacing: '0.3em',
                      }}
                    >
                      {t(`category.${story.type}`)}
                    </p>
                  )}
                  <p
                    className="text-sm italic leading-relaxed"
                    style={{ color: STROKE, opacity: 0.88 }}
                  >
                    “{story.text}”
                  </p>
                </li>
              );
            })
          )}
        </ul>

        <p
          className="mt-4 text-[10px] italic leading-relaxed text-brand-green/55"
        >
          {t('evidence.footer')}
        </p>
      </div>
    </div>
  );
}
