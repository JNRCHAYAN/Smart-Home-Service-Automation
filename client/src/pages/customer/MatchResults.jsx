import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync.js';
import { requestApi, apiError } from '../../api/index.js';
import ProviderMatchCard from '../../components/customer/ProviderMatchCard.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Icon from '../../components/common/Icon.jsx';
import { CardSkeleton } from '../../components/common/Skeleton.jsx';
import { toast } from '../../store/toastStore.js';
import { formatDate } from '../../utils/format.js';

// /request/:id/matches — shows the engine's ranked provider list for a
// request. Confirming one provider locks the slot (requestApi.confirm) and
// moves on to live tracking; failures refresh the match list. When no provider
// is free at the chosen time, the server's /availability endpoint supplies the
// next windows where providers are actually free, and selecting one re-matches
// via requestApi.updateSlot.
export default function MatchResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const { data: matches, loading, run } = useAsync(() => requestApi.matches(id), [id]);
  const [confirmId, setConfirmId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [slotBusy, setSlotBusy] = useState(null);

  useEffect(() => {
    requestApi
      .get(id)
      .then((r) => setRequest(r))
      .catch((e) => toast.error(apiError(e)));
  }, [id]);

  // The request slot changes after a re-match, so derive the key and re-query
  // availability whenever it (or the match outcome) changes.
  const slotKey = request
    ? `${request.preferredDate}|${request.preferredTimeWindow.start}-${request.preferredTimeWindow.end}`
    : '';
  const hasMatches = Array.isArray(matches) && matches.length > 0;

  useEffect(() => {
    if (!request || loading || hasMatches) {
      setSuggestions([]);
      return;
    }
    let live = true;
    setSuggestionsLoading(true);
    requestApi
      .availability(id)
      .then((d) => live && setSuggestions(d || []))
      .catch(() => live && setSuggestions([]))
      .finally(() => live && setSuggestionsLoading(false));
    return () => {
      live = false;
    };
  }, [id, slotKey, loading, hasMatches]);

  const confirm = async (match) => {
    // Track which card is busy so only its button shows the spinner.
    setConfirmId(match.providerId);
    try {
      await requestApi.confirm(id, match.providerId);
      toast.success(`${match.businessName} confirmed — slot locked!`);
      navigate(`/request/${id}/track`);
    } catch (err) {
      // Confirm failed (e.g. the slot was already taken): toast, then re-run
      // the match query so the stale provider drops out of the list.
      toast.error(apiError(err));
      await run();
    } finally {
      setConfirmId(null);
    }
  };

  // Pick one of the offered alternative times: persist it on the request,
  // refresh the request summary, then re-run the match engine.
  const pickSlot = async (slot) => {
    const key = `${slot.date}|${slot.startTime}`;
    setSlotBusy(key);
    try {
      const updated = await requestApi.updateSlot(id, {
        preferredDate: slot.date,
        start: slot.startTime,
        end: slot.endTime
      });
      setRequest(updated);
      toast.success('Time updated — finding providers for this slot');
      await run();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSlotBusy(null);
    }
  };

  return (
    <div className="container-page page-shell max-w-3xl">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-text">Smart match results</p>
        <h1 className="mt-1 font-heading text-2xl font-extrabold tracking-tight text-fg">
          Top providers for {request?.serviceType || 'your request'}
        </h1>
        {request && (
          <p className="mt-1.5 text-sm text-muted">
            {request.serviceType} · {formatDate(request.preferredDate)} · {request.preferredTimeWindow.start}–
            {request.preferredTimeWindow.end} ·{' '}
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
      ) : hasMatches ? (
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
        <div>
          <div className="card-surface">
            <EmptyState
              icon="clock"
              title="No provider is free at this time"
              hint={
                request
                  ? `No verified provider is available on ${formatDate(request.preferredDate)} between ${
                      request.preferredTimeWindow.start
                    } and ${request.preferredTimeWindow.end}. Pick one of the times below where providers are free.`
                  : 'No provider is available for the requested time.'
              }
            />
          </div>

          {/* Next times when providers are actually available */}
          <section className="card-surface mt-4 p-5" aria-live="polite">
            <h2 className="font-heading text-base font-bold text-fg">Next available times</h2>
            <p className="mt-1 text-sm text-muted">
              Choose a slot and we will instantly re-check matching providers for you.
            </p>

            {suggestionsLoading ? (
              <div className="mt-4 space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="skeleton h-14 rounded-lg" />
                ))}
              </div>
            ) : suggestions.length > 0 ? (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {suggestions.map((s) => {
                  const key = `${s.date}|${s.startTime}`;
                  const busy = slotBusy === key;
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => pickSlot(s)}
                        className="group flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 text-left transition-colors hover:border-brand-border hover:bg-brand-soft disabled:cursor-wait disabled:opacity-70"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-inset text-muted transition-colors group-hover:bg-brand group-hover:text-white">
                          {busy ? (
                            <Icon name="loader" size={16} className="animate-spin" aria-hidden="true" />
                          ) : (
                            <Icon name="calendar" size={16} aria-hidden="true" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-fg">
                            {formatDate(s.date)}
                          </span>
                          <span className="block text-xs text-muted">
                            {s.startTime} – {s.endTime} · {s.availableProviders} provider
                            {s.availableProviders === 1 ? '' : 's'} free
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 flex items-start gap-2 rounded-xl border border-line bg-inset/60 px-3.5 py-3 text-sm text-muted">
                <Icon name="alertcircle" size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                No free windows in the coming days either. Please try again later or choose another
                service.
              </p>
            )}
          </section>
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
