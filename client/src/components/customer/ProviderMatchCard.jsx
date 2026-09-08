import Icon from '../common/Icon.jsx';
import Badge from '../common/Badge.jsx';
import Button from '../common/Button.jsx';
import { bdt, distanceLabel } from '../../utils/format.js';
import { URGENCY_COLORS } from '../../constants/index.js';

const FACTORS = [
  { key: 'expertise', label: 'Expertise', color: 'bg-brand-500' },
  { key: 'availability', label: 'Availability', color: 'bg-emerald-500' },
  { key: 'distance', label: 'Distance', color: 'bg-sky-500' },
  { key: 'rating', label: 'Rating', color: 'bg-violet-500' },
  { key: 'price', label: 'Price', color: 'bg-amber-500' }
];

export default function ProviderMatchCard({ match, rank, request, onConfirm, confirming }) {
  const scorePct = Math.round(match.score * 100);
  return (
    <div className="relative overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-sm">
      {rank === 1 && (
        <div className="absolute right-0 top-0 rounded-bl-2xl bg-brand-600 px-4 py-1 text-xs font-bold text-white">
          Best match
        </div>
      )}
      <div className="p-5 pt-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-ink-900">{match.businessName}</h3>
              <Badge className={URGENCY_COLORS[request.urgency]}>{request.urgency}</Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
              <span className="flex items-center gap-1">
                <Icon name="star" size={15} className="text-amber-400" />
                <span className="font-semibold text-ink-900">{match.rating.toFixed(1)}</span>
              </span>
              <span className="flex items-center gap-1">
                <Icon name="mappin" size={15} /> {distanceLabel(match.distanceKm)}
              </span>
              <span className="flex items-center gap-1 font-bold text-ink-900">
                <Icon name="dollar" size={15} className="text-brand-600" /> {bdt(match.price)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-extrabold ${rank === 1 ? 'text-brand-600' : 'text-ink-900'}`}>
              {scorePct}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-300">Match score</div>
          </div>
        </div>

        <div className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700">
          Why we picked this: {match.reason}
        </div>

        {/* breakdown */}
        <div className="mt-4 space-y-2">
          {FACTORS.map((f) => {
            const val = match.breakdown?.[f.key] ?? 0;
            const pct = Math.round(val * 100);
            return (
              <div key={f.key} className="flex items-center gap-3">
                <span className="w-24 text-xs font-semibold text-ink-500">{f.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
                  <div className={`h-full rounded-full ${f.color}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right text-xs font-bold text-ink-700">{pct}%</span>
              </div>
            );
          })}
        </div>

        <Button
          className="mt-5"
          full
          icon="check"
          loading={confirming}
          onClick={() => onConfirm(match)}
        >
          Confirm provider
        </Button>
      </div>
    </div>
  );
}
