const STROKE = '#1F3A2A';

export default function MapToolbar({
  vizMode,
  onToggleViz,
  onLocate,
  hasLocation,
}) {
  return (
    <div className="pointer-events-none absolute bottom-6 left-1/2 z-20 -translate-x-1/2">
      <div
        className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/40 px-2 py-1.5 shadow-md"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.45)',
          WebkitBackdropFilter: 'blur(14px) saturate(140%)',
          backdropFilter: 'blur(14px) saturate(140%)',
        }}
      >
        <button
          type="button"
          onClick={onToggleViz}
          className="rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] transition"
          style={{
            color: vizMode ? '#FAF5EB' : STROKE,
            backgroundColor: vizMode ? STROKE : 'transparent',
          }}
        >
          {vizMode ? 'Architectural' : 'Data Viz'}
        </button>

        <span className="h-4 w-px bg-brand-green/20" />

        <button
          type="button"
          onClick={onLocate}
          className="rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] transition hover:bg-white/30"
          style={{ color: STROKE }}
        >
          {hasLocation ? '◉ Located' : '◯ Locate me'}
        </button>
      </div>
    </div>
  );
}
