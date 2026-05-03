import { useState } from 'react';
import { getCategoryColors } from '../lib/categoryColors.js';
import EvidenceModal from './EvidenceModal.jsx';

const TYPE_LABEL = {
  Sensory: 'Sensory Cluster',
  Memory: 'Memory Cluster',
  Complaint: 'Complaint Cluster',
  Conflict: 'Protection Zone',
};

const TYPE_BULLET = {
  Sensory: '▸',
  Memory: '▸',
  Complaint: '▸',
  Conflict: '⚠',
};

export default function ImpactReport({ insights = [], onBack = () => {} }) {
  const isEmpty = insights.length === 0;
  const [evidenceFor, setEvidenceFor] = useState(null);

  return (
    <div className="flex h-full flex-col">
      <button
        type="button"
        onClick={onBack}
        className="mb-5 self-start text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-green transition hover:text-brand-green"
        style={{
          borderBottom: '1px solid rgba(31, 58, 42, 0.35)',
          paddingBottom: '3px',
        }}
      >
        ←&nbsp;&nbsp;Back to Experiences
      </button>

      <p className="mb-1 text-xs font-medium uppercase tracking-[0.25em] text-brand-green/60">
        Data Map
      </p>
      <h2 className="mb-2 font-display text-2xl font-semibold leading-tight text-brand-green">
        Actionable Urban Plan
      </h2>
      <p className="mb-5 text-xs italic leading-snug text-brand-green/65">
        Generated from clusters of 3+ stories within a 40-metre radius.
      </p>

      {isEmpty ? (
        <div
          className="flex flex-1 items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center"
          style={{ borderColor: 'rgba(31, 58, 42, 0.25)' }}
        >
          <p className="font-display text-sm italic leading-relaxed text-brand-green/70">
            Not enough clustered data yet. Pin more stories of the same
            category within 40&nbsp;m of each other to generate the plan.
          </p>
        </div>
      ) : (
        <ul className="flex-1 space-y-3 overflow-y-auto pr-1">
          {insights.map((insight) => {
            const isConflict = insight.type === 'Conflict';
            const colors = isConflict
              ? null
              : getCategoryColors(insight.type);

            const borderColor = isConflict ? '#1F3A2A' : colors.border;
            const backgroundColor = isConflict
              ? 'rgba(31, 58, 42, 0.10)'
              : colors.bg;
            const tagColor = isConflict ? '#1F3A2A' : colors.primary;
            const bullet = TYPE_BULLET[insight.type] || '▸';
            const zonePrefix = isConflict ? 'Segment' : 'Zone';

            return (
              <li
                key={insight.id}
                className="rounded-xl border p-5"
                style={{
                  borderColor,
                  backgroundColor,
                  boxShadow: isConflict
                    ? '0 0 0 1px rgba(31, 58, 42, 0.18)'
                    : 'none',
                }}
              >
                {/* Location header — sits at the very top of every card so
                    the planner sees the segment first. */}
                {insight.zone && (
                  <>
                    <p
                      className="text-[10px] font-semibold uppercase text-brand-green/60"
                      style={{ letterSpacing: '0.28em' }}
                    >
                      {zonePrefix}
                    </p>
                    <h3 className="mt-0.5 font-display text-lg font-bold leading-tight text-brand-green">
                      {insight.zone}
                    </h3>
                    <div
                      className="mt-3 mb-3 h-px"
                      style={{ backgroundColor: 'rgba(31, 58, 42, 0.18)' }}
                    />
                  </>
                )}

                <p
                  className="font-display text-[11px] font-semibold uppercase tracking-[0.22em]"
                  style={{ color: tagColor }}
                >
                  {TYPE_LABEL[insight.type] || insight.type}
                </p>

                <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-brand-green/85">
                  <span
                    aria-hidden
                    className="flex-shrink-0 select-none pt-0.5 font-semibold leading-none"
                    style={{ color: tagColor, fontSize: '14px' }}
                  >
                    {bullet}
                  </span>
                  <span>{insight.text}</span>
                </p>

                {insight.count != null && (
                  <button
                    type="button"
                    onClick={() => setEvidenceFor(insight)}
                    className="group mt-3 flex items-center gap-1 text-[9px] font-medium uppercase text-brand-green/55 transition hover:text-brand-green focus:text-brand-green focus:outline-none"
                    style={{ letterSpacing: '0.32em', cursor: 'pointer' }}
                  >
                    <span>
                      {insight.count}
                      {insight.count === 1 ? ' story' : ' stories'}
                      &nbsp;·&nbsp;clustered
                    </span>
                    <span
                      aria-hidden
                      className="transition group-hover:translate-x-0.5"
                    >
                      →
                    </span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Privacy footer — pinned at the bottom of the panel */}
      <p
        className="mt-4 text-[10px] italic leading-relaxed text-brand-green/55"
        style={{ fontFamily: '"Darker Grotesque", system-ui, sans-serif' }}
      >
        Data is spatially aggregated to protect participant privacy.
      </p>

      <EvidenceModal
        insight={evidenceFor}
        onClose={() => setEvidenceFor(null)}
      />
    </div>
  );
}
