import Badge from '../common/Badge.jsx';
import Button from '../common/Button.jsx';
import Icon from '../common/Icon.jsx';
import { bdt, distanceLabel } from '../../utils/format.js';
import { URGENCY_VARIANTS } from '../../constants/index.js';
import { cn } from '../../utils/cn.js';

const FACTORS = [
  { key: 'expertise', label: 'Expertise', bar: 'bg-brand' },
  { key: 'availability', label: 'Availability', bar: 'bg-success' },
  { key: 'distance', label: 'Distance', bar: 'bg-info' },
  { key: 'rating', label: 'Rating', bar: 'bg-warning' },
  { key: 'price', label: 'Price', bar: 'bg-danger' }
];

export default function ProviderMatchCard({ match, rank, request, onConfirm, confirming }) {
  const scorePct = Math.round((match.score || 0) * 100);
  const best = rank === 1;

  return (
    <article
      className={cn(
        'card-surface relative overflow-hidden p-5 transition-shadow hover:shadow-pop',
        best && 'border-brand-border'
      )}
    >
      {best && (
        <div className="absolute right-0 top-0 flex items-center gap-1.5 rounded-bl-xl bg-brand px-3 py-1 text-xs font-bold text-white">
          <Icon name="star" size={13} aria-hidden="true" />
          Best match
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading text-lg font-bold text-fg">{match.businessName}</h3>
            <Badge variant={URGENCY_VARIANTS[request?.urgency] || 'neutral'}>{request?.urgency}</Badge>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1">
              <Icon name="star" size={15} className="fill-amber-400 text-amber-400" aria-hidden="true" />
              <span className="font-semibold text-fg">{Number(match.rating).toFixed(1)}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Icon name="mappin" size={15} aria-hidden="true" />
              {distanceLabel(match.distanceKm)}
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-fg">
              <Icon name="dollar" size={15} className="text-brand" aria-hidden="true" />
              {bdt(match.price)}
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right" aria-label={`${scorePct} percent match score`}>
          <div className={cn('font-heading text-3xl font-extrabold', best ? 'text-brand-text' : 'text-fg')}>
            {scorePct}
            <span className="text-base">%</span>
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-faint">Match</div>
        </div>
      </div>

      <p className="mt-3 flex items-start gap-2 rounded-xl bg-brand-soft px-3.5 py-2.5 text-sm font-medium text-brand-text">
        <Icon name="sparkles" size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
        {match.reason}
      </p>

      <div className="mt-4 space-y-2">
        {FACTORS.map((f) => {
          const pct = Math.round((match.breakdown?.[f.key] ?? 0) * 100);
          return (
            <div key={f.key} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs font-semibold text-muted">{f.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-inset">
                <div
                  className={cn('h-full rounded-full', f.bar)}
                  style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${f.label} ${pct} percent`}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-xs font-bold tabular-nums text-fg">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>

      <Button className="mt-5" full icon="check" loading={confirming} onClick={() => onConfirm(match)}>
        Confirm provider
      </Button>
    </article>
  );
}
