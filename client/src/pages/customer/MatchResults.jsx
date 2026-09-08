import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync.js';
import { requestApi, apiError } from '../../api/index.js';
import ProviderMatchCard from '../../components/customer/ProviderMatchCard.jsx';
import Card from '../../components/common/Card.jsx';
import { CardSkeleton } from '../../components/common/Skeleton.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Button from '../../components/common/Button.jsx';
import { toast } from '../../store/toastStore.js';
import { formatDate } from '../../utils/format.js';

export default function MatchResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const { data: matches, loading, run } = useAsync(() => requestApi.matches(id), [id]);
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => {
    requestApi.get(id).then((r) => setRequest(r)).catch((e) => toast.error(apiError(e)));
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
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Smart match results
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">
          Top providers for your {request?.serviceType || 'service'}
        </h1>
        {request && (
          <p className="mt-1 text-sm text-ink-400">
            {request.serviceType} · {formatDate(request.preferredDate)} · {request.preferredTimeWindow.start}–
            {request.preferredTimeWindow.end} · <span className="font-semibold">{request.urgency}</span>
          </p>
        )}
      </div>

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
        <Card>
          <EmptyState
            icon="search"
            title="No providers available right now"
            hint="Try adjusting your date/time window or choosing a different service."
          />
        </Card>
      )}

      {request && (
        <div className="mt-6 flex justify-center">
          <Link
            to={`/request/${id}/track`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink-400 hover:text-ink-700"
          >
            Skip and view request tracking <IconArrow />
          </Link>
        </div>
      )}
    </div>
  );
}

function IconArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
