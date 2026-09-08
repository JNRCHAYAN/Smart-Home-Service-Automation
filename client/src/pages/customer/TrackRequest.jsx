import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { requestApi, apiError } from '../../api/index.js';
import StatusStepper from '../../components/common/StatusStepper.jsx';
import Card from '../../components/common/Card.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Icon from '../../components/common/Icon.jsx';
import { toast } from '../../store/toastStore.js';
import { statusClass, bdt, formatDate, timeAgo } from '../../utils/format.js';
import { STATUS } from '../../constants/index.js';

export default function TrackRequest() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);

  const load = async (silent) => {
    try {
      const res = await requestApi.get(id);
      setRequest(res);
      if (res.feedback?.rating) setRating(res.feedback.rating);
    } catch (err) {
      if (!silent) toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 4000);
    return () => clearInterval(t);
  }, [id]);

  const cancel = async () => {
    try {
      await requestApi.cancel(id);
      toast.info('Request cancelled');
      load();
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const feedback = async () => {
    if (!rating) return;
    try {
      await requestApi.feedback(id, rating, '');
      toast.success('Thanks for your feedback!');
      load(true);
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-10"><Skeleton className="h-8 w-1/2 mb-4" /><Skeleton className="h-24" /></div>;

  if (!request) return <div className="mx-auto max-w-3xl px-4 py-10 text-center text-ink-400">Request not found.</div>;

  const providerName = request.candidateMatches?.find((m) => m.providerId === request.matchedProviderId)?.businessName;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Live tracking</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">{request.serviceType}</h1>
        </div>
        <Badge className={statusClass(request.status)}>{request.status}</Badge>
      </div>
      <p className="text-sm text-ink-400">
        {formatDate(request.preferredDate)} · {request.preferredTimeWindow.start}–{request.preferredTimeWindow.end} ·{' '}
        {request.location?.address}
      </p>

      <Card className="mt-6">
        <StatusStepper status={request.status} timeline={request.timeline} />
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {providerName && (
          <Card>
            <div className="mb-2 flex items-center gap-2 font-bold text-ink-900">
              <Icon name="user" size={18} className="text-brand-600" /> Assigned provider
            </div>
            <p className="text-sm text-ink-700">{providerName}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-ink-400">
              <Icon name="phone" size={14} /> {request.contact?.phone}
            </p>
          </Card>
        )}

        <Card>
          <div className="mb-2 flex items-center gap-2 font-bold text-ink-900">
            <Icon name="inbox" size={18} className="text-brand-600" /> Summary
          </div>
          <div className="space-y-1 text-sm">
            <Row k="Requested" v={timeAgo(request.createdAt)} />
            <Row k="Problem" v={request.problemDetails || '—'} />
            {request.feedback?.rating && <Row k="Your rating" v={`${'★'.repeat(request.feedback.rating)}`} />}
          </div>
        </Card>
      </div>

      {/* timeline audit */}
      <Card className="mt-4">
        <div className="mb-3 font-bold text-ink-900">Activity timeline</div>
        <ol className="space-y-3">
          {request.timeline.map((t, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                className={`mt-1 h-2.5 w-2.5 rounded-full ${
                  i === request.timeline.length - 1 ? 'bg-brand-600 pulse-dot' : 'bg-ink-300'
                }`}
              />
              <div>
                <div className="text-sm font-semibold text-ink-800">{t.status}</div>
                <div className="text-xs text-ink-400">{formatDate(t.timestamp)} · {timeAgo(t.timestamp)}</div>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      {request.status === STATUS.COMPLETED && !request.feedback?.rating && (
        <Card className="mt-4">
          <div className="mb-2 font-bold text-ink-900">Rate this service</div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)} className="text-2xl">
                <span className={n <= rating ? 'text-amber-400' : 'text-ink-200'}>★</span>
              </button>
            ))}
            <Button className="ml-3" size="sm" onClick={feedback} disabled={!rating} icon="send">
              Submit
            </Button>
          </div>
        </Card>
      )}

      {request.status === STATUS.REQUESTED && (
        <div className="mt-4 flex justify-end">
          <Button variant="danger" size="sm" onClick={cancel} icon="ban">
            Cancel request
          </Button>
        </div>
      )}

      <div className="mt-6 text-center">
        <Link to="/my-requests" className="text-sm font-semibold text-ink-400 hover:text-ink-700">
          ← Back to my requests
        </Link>
      </div>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-ink-400">{k}</span>
      <span className="font-medium text-ink-700">{v}</span>
    </div>
  );
}
