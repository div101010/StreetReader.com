import { useEffect, useRef } from 'react';
import { getCategoryColors } from '../lib/categoryColors.js';

const TYPE_LABEL = {
  Sensory: 'Sensory',
  Memory: 'Memory',
  Complaint: 'Complaint',
  Story: 'Story',
};

function timeAgo(iso) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d > 1 ? 's' : ''} ago`;
}

export default function LivedExperiences({
  userExperiences = [],
  highlightedId = null,
  placingMode = false,
  currentUserId = null,
  isAdmin = false,
  onStartPlacing = () => {},
  onCancelPlacing = () => {},
  onDeleteExperience = () => {},
  vizMode = false,
  onToggleViz = () => {},
  onSwitchToDataMap = () => {},
}) {
  const refs = useRef({});

  useEffect(() => {
    if (!highlightedId) return;
    const node = refs.current[highlightedId];
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedId]);

  const isEmpty = userExperiences.length === 0;

  return (
    <div className="flex h-full flex-col">
      <p className="mb-3 text-xs italic leading-snug text-brand-green/65">
        Click anywhere on the map to share a story.
      </p>

      <div className="mb-4 flex items-baseline justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand-green/60">
          Lived Experiences
        </p>
        <span className="text-[10px] uppercase tracking-[0.18em] text-brand-green/45">
          {userExperiences.length} {userExperiences.length === 1 ? 'story' : 'stories'}
        </span>
      </div>

      <button
        type="button"
        onClick={placingMode ? onCancelPlacing : onStartPlacing}
        className="mb-3 min-h-[44px] rounded-xl border px-4 py-3 text-left text-sm font-semibold transition md:min-h-0 md:py-2.5"
        style={{
          borderColor: placingMode ? '#1F3A2A' : 'rgba(31, 58, 42, 0.25)',
          backgroundColor: placingMode ? '#1F3A2A' : 'rgba(255, 255, 255, 0.4)',
          color: placingMode ? '#FAF5EB' : '#1F3A2A',
        }}
      >
        {placingMode ? '✕  Cancel — pick a spot on the map' : '+  Add your own story'}
      </button>

      {isEmpty ? (
        <div
          className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center"
          style={{ borderColor: 'rgba(31, 58, 42, 0.25)' }}
        >
          <p
            className="text-[10px] font-semibold uppercase text-brand-green/55"
            style={{ letterSpacing: '0.3em' }}
          >
            The map is currently silent
          </p>
          <p className="font-display text-sm italic leading-relaxed text-brand-green/70">
            Be the first to share a lived experience.
          </p>
        </div>
      ) : (
        <ul className="flex-1 space-y-3 overflow-y-auto pr-1">
          {userExperiences
            .slice()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((s) => {
              const highlighted = highlightedId === s.id;
              const owns =
                currentUserId != null && s.ownerId === currentUserId;
              const canDelete = isAdmin || owns;
              const colors = getCategoryColors(s.type);
              return (
                <li
                  key={s.id}
                  ref={(el) => (refs.current[s.id] = el)}
                  className="rounded-xl border p-4 transition"
                  style={{
                    borderColor: highlighted ? '#1F3A2A' : colors.border,
                    backgroundColor: highlighted ? colors.bgStrong : colors.bg,
                    boxShadow: highlighted
                      ? '0 0 0 2px rgba(31, 58, 42, 0.18)'
                      : 'none',
                  }}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className="font-display text-sm font-semibold"
                      style={{ color: colors.primary }}
                    >
                      {TYPE_LABEL[s.type] || s.type || 'Story'}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-brand-green/55">
                      {timeAgo(s.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-snug text-brand-green/85">
                    "{s.text}"
                  </p>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => onDeleteExperience(s.id)}
                      className="mt-2 text-[10px] uppercase tracking-[0.2em] text-brand-green/55 hover:text-brand-green"
                    >
                      delete{isAdmin && !owns ? ' (admin)' : ''}
                    </button>
                  )}
                </li>
              );
            })}
        </ul>
      )}

      {/* Tool toggles — pinned to the bottom of the panel */}
      <div className="mt-3 space-y-2 border-t border-white/30 pt-3">
        <button
          type="button"
          onClick={onToggleViz}
          className="w-full rounded-xl border px-4 py-3 text-left transition"
          style={{
            borderColor: vizMode ? '#1F3A2A' : 'rgba(31, 58, 42, 0.25)',
            backgroundColor: vizMode ? '#1F3A2A' : 'rgba(255, 255, 255, 0.4)',
            color: vizMode ? '#FAF5EB' : '#1F3A2A',
          }}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span>{vizMode ? '◉' : '◯'}</span>
            <span>Reveal Lived Intensity</span>
          </div>
          <p
            className="mt-1 pl-5 text-[10px] uppercase tracking-[0.18em]"
            style={{ opacity: vizMode ? 0.75 : 0.6 }}
          >
            Visualize real-time sensory & grievance hotspots
          </p>
        </button>
        <button
          type="button"
          onClick={onSwitchToDataMap}
          className="w-full rounded-xl border px-4 py-3 text-left transition"
          style={{
            borderColor: 'rgba(31, 58, 42, 0.25)',
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            color: '#1F3A2A',
          }}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span>◯</span>
            <span>Urban Impact Strategy</span>
          </div>
          <p
            className="mt-1 pl-5 text-[10px] uppercase tracking-[0.18em]"
            style={{ opacity: 0.6 }}
          >
            Algorithmic plan for institutional intervention
          </p>
        </button>
      </div>
    </div>
  );
}
