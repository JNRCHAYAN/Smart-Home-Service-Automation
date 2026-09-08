import { Link } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync.js';
import { requestApi } from '../../api/index.js';
import Badge from '../../components/common/Badge.jsx';
import Icon from '../../components/common/Icon.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { CardSkeleton } from '../../components/common/Skeleton.jsx';
import { buttonClass } from '../../components/common/Button.jsx';
import { statusClass, formatDate } from '../../utils/format.js';
import { URGENCY_VARIANTS } from '../../constants/index.js';

export default function MyRequests() {
  const { data: requests, loading } = useAsync(() => requestApi.list(), []);

  return (
    <div className="container-page page-shell">
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-fg">My requests</h1>
        <p className="mt-1 text-sm text-muted">Track every service you have booked.</p>
      </header>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : requests && requests.length > 0 ? (
        <ul className="space-y-3">
          {requests.map((r) => (
            <li key={r._id}>
              <Link
                to={`/request/${r._id}/track`}
                className="card-surface group flex items-center justify-between gap-4 p-5 transition-colors hover:border-brand-border"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-heading text-[15px] font-bold text-fg group-hover:text-brand-text">
                      {r.serviceType}
                    </h3>
                    <Badge variant={URGENCY_VARIANTS[r.urgency] || "neutral"}>{r.urgency}</Badge>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted">
                    {formatDate(r.preferredDate)} · {r.preferredTimeWindow.start}–{r.preferredTimeWindow.end}
                    {r.location?.address ? ` · ${r.location.address}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge variant={statusClass(r.status)}>{r.status}</Badge>
                  <Icon
                    name="chevronright"
                    size={18}
                    className="text-faint transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="card-surface">
          <EmptyState
            icon="inbox"
            title="No requests yet"
            hint="Book your first home service and track it here."
              action={
                <Link to="/new-request" className={buttonClass()}>
                  <Icon name="plus" size={16} aria-hidden="true" />
                  New request
                </Link>
              }
          />
        </div>
      )}
    </div>
  );
}
