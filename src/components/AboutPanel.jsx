import { useTranslation } from '../lib/translations.jsx';

const PILLAR_KEYS = ['ecological', 'spatial', 'organic', 'participatory'];

export default function AboutPanel() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col">
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
    </div>
  );
}
