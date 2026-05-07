import { useTranslation } from '../lib/translations.jsx';

const PILLAR_KEYS = ['ecological', 'spatial', 'organic', 'participatory'];

export default function AboutPanel({ onCtaClick }) {
  const { t } = useTranslation();

  // Split the CTA copy around the link label so we can style just that
  // word as the affordance — keeps the surrounding sentence translatable
  // as a single string instead of three concatenated fragments.
  const ctaText = t('about.cta');
  const linkLabel = t('about.cta.linkLabel');
  const linkIdx = ctaText.indexOf(linkLabel);
  const ctaBefore = linkIdx >= 0 ? ctaText.slice(0, linkIdx) : ctaText;
  const ctaAfter = linkIdx >= 0 ? ctaText.slice(linkIdx + linkLabel.length) : '';

  return (
    <div className="flex h-full flex-col overflow-y-auto pr-1">
      <p className="mb-4 text-sm leading-relaxed text-brand-green/80">
        {t('about.intro')}
      </p>

      <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-brand-green/60">
        {t('about.fourPillars')}
      </p>
      <ul className="space-y-2">
        {PILLAR_KEYS.map((slug, i) => (
          <li key={slug}>
            <div className="rounded-xl border border-white/30 bg-white/20 px-4 py-3">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-sm font-semibold text-brand-green/60">
                  0{i + 1}
                </span>
                <span className="font-display text-lg font-semibold text-brand-green">
                  {t(`about.pillar.${slug}.title`)}
                </span>
              </div>
              <p className="mt-1 text-sm leading-snug text-brand-green/75">
                {t(`about.pillar.${slug}.blurb`)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {/* Closing CTA — narrative bridge from the pillars to the
          interactive Experiences tab. The whole block is a button so
          the entire surface is clickable, not just the underlined word. */}
      <button
        type="button"
        onClick={onCtaClick}
        disabled={!onCtaClick}
        className="group mt-5 w-full rounded-xl border border-brand-green/30 bg-brand-green/5 px-4 py-3 text-left transition hover:border-brand-green/60 hover:bg-brand-green/10 disabled:cursor-default disabled:hover:border-brand-green/30 disabled:hover:bg-brand-green/5"
        style={{ fontFamily: '"Darker Grotesque", system-ui, sans-serif' }}
      >
        <p className="text-sm leading-relaxed text-brand-green/85">
          {ctaBefore}
          <span className="font-semibold text-brand-green underline decoration-brand-green/40 underline-offset-4 transition group-hover:decoration-brand-green">
            {linkLabel}
          </span>
          {ctaAfter}
          <span
            aria-hidden
            className="ml-1 inline-block transition group-hover:translate-x-0.5"
          >
            →
          </span>
        </p>
      </button>
    </div>
  );
}
