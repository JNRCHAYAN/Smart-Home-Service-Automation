import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync.js';
import { requestApi, apiError } from '../../api/index.js';
import ProviderMatchCard from '../../components/customer/ProviderMatchCard.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { CardSkeleton } from '../../components/common/Skeleton.jsx';
import { toast } from '../../store/toastStore.js';
import { formatDate } from '../../utils/format.js';

export default function MatchResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const { data: matches, loading, run } = useAsync(() => requestApi.matches(id), [id]);
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => {
    requestApi
      .get(id)
      .then((r) => setRequest(r))
      .catch((e) => toast.error(apiError(e)));
  }, [id]);

  const confirm = async (match) => {
    setConfirmId(match.providerId);
    try {
      await requestApi.confirm(id, match.providerId);
      toast.success(`${match.businessName} confirmed — slot locked!`);
      navigate(`/request/${id}/track`);
    } catch (err) {
      toast.error(apiError(err));
      await run();
    } finally {
      setConfirmId(null);
    }
  };

  return (
    <div className="container-page page-shell max-w-3xl">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-text">
          Smart match results
        </p>
        <h1 className="mt-1 font-heading text-2xl font-extrabold tracking-tight text-fg">
          Top providers for {request?.serviceType || 'your request'}
        </h1>
        {request && (
          <p className="mt-1.5 text-sm text-muted">
            {request.serviceType} · {formatDate(request.preferredDate)} ·{' '}
            {request.preferredTimeWindow.start}–{request.preferredTimeWindow.end} ·{' '}
            <span className="font-semibold text-fg">{request.urgency}</span>
          </p>
        )}
      </header>

      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : matches && matches.length > 0 ? (
        <div className="space-y-4">
          {matches.map((m, i) => (
            <ProviderMatchCard
              key={m.providerId}
              match={m}
              rank={i + 1}
              request={request || {}}
              onConfirm={confirm}
              confirming={confirmId === m.providerId}
            />
          ))}
        </div>
      ) : (
        <div className="card-surface">
          <EmptyState
            icon="search"
            title="No providers available right now"
            hint="Try adjusting your date or time window, or choose a different service."
          />
        </div>
      )}

      {request && (
        <div className="mt-6 flex justify-center">
          <Link
            to={`/request/${id}/track`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-fg"
          >
            Skip and view request tracking
          </Link>
        </div>
      )}
    </div>
  );
}
