const pillars = [
  {
    title: 'Ecological Integration',
    blurb: 'Reconnecting the street to nature beyond metrics.',
  },
  {
    title: 'Spatial Justice',
    blurb: 'Questioning who the street is actually for.',
  },
  {
    title: 'Organic Design',
    blurb: 'Moving away from rigid, "high-performance" corridor layouts.',
  },
  {
    title: 'Participatory Agency',
    blurb: 'Allowing lived data to drive institutional change.',
  },
];

export default function AboutPanel() {
  return (
    <div className="flex h-full flex-col">
      <p className="mb-4 text-sm leading-relaxed text-brand-green/80">
        StreetReader is a sensory re-reading of Madrid's Gran Vía. It maps the
        corridor through the people who live and walk it — their memories,
        their senses, their grievances — alongside the architectural plan.
      </p>

      <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-brand-green/60">
        The Four Pillars
      </p>
      <ul className="space-y-2">
        {pillars.map((p, i) => (
          <li key={p.title}>
            <div className="rounded-xl border border-white/30 bg-white/20 px-4 py-3">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-sm font-semibold text-brand-green/60">
                  0{i + 1}
                </span>
                <span className="font-display text-lg font-semibold text-brand-green">
                  {p.title}
                </span>
              </div>
              <p className="mt-1 text-sm leading-snug text-brand-green/75">
                {p.blurb}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
