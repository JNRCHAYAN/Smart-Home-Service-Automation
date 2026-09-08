import { Link } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync.js';
import { requestApi } from '../../api/index.js';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Icon from '../../components/common/Icon.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { CardSkeleton } from '../../components/common/Skeleton.jsx';
import { statusClass, formatDate } from '../../utils/format.js';
import { URGENCY_COLORS } from '../../constants/index.js';

export default function MyRequests() {
  const { data: requests, loading } = useAsync(() => requestApi.list(), []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">My requests</h1>
      <p className="mt-1 text-sm text-ink-400">Track every service you have booked.</p>

      <div className="mt-6 space-y-3">
        {loading ? (
          [0, 1, 2].map((i) => <CardSkeleton key={i} />)
        ) : requests && requests.length > 0 ? (
          requests.map((r) => (
            <Link key={r._id} to={`/request/${r._id}/track`}>
              <Card className="flex items-center justify-between gap-4 transition-all hover:shadow-md">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-bold text-ink-900">{r.serviceType}</h3>
                    <Badge className={URGENCY_COLORS[r.urgency]}>{r.urgency}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink-400">
                    {formatDate(r.preferredDate)} · {r.preferredTimeWindow.start}–{r.preferredTimeWindow.end}{' '}
                    · {r.location?.address}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge className={statusClass(r.status)}>{r.status}</Badge>
                  <Icon name="chevronright" size={18} className="text-ink-300" />
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <Card>
            <EmptyState
              icon="inbox"
              title="No requests yet"
              hint="Book your first home service and track it here."
              action={
                <Link
                  to="/new-request"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  <Icon name="plus" size={16} /> New request
                </Link>
              }
            />
          </Card>
        )}
      </div>
    </div>
  );
}
