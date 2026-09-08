import { useState } from 'react';
import { useAsync } from '../../hooks/useAsync.js';
import { providerApi, requestApi, apiError } from '../../api/index.js';
import { JobCard } from '../../components/provider/JobCard.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Icon from '../../components/common/Icon.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { toast } from '../../store/toastStore.js';
import { STATUS } from '../../constants/index.js';
import { cn } from '../../utils/cn.js';

// /provider — provider home: stat counters from the dashboard endpoint, a
// tabbed job list (incoming/active/completed) and accept/reject/advance
// actions that patch the request status then re-fetch.
const TABS = [
  { key: 'incoming', label: 'Incoming' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' }
];

// NEXT drives the single "advance" action on active jobs (JobCard calls
// onAdvance with NEXT[status]); the request flows Accepted → On the Way →
// In Progress → Completed.
const NEXT = {
  [STATUS.ACCEPTED]: STATUS.ON_THE_WAY,
  [STATUS.ON_THE_WAY]: STATUS.IN_PROGRESS,
  [STATUS.IN_PROGRESS]: STATUS.COMPLETED
};

export default function ProviderDashboard() {
  const { data, loading, run } = useAsync(() => providerApi.dashboard(), []);
  const [tab, setTab] = useState('incoming');
  const [busy, setBusy] = useState(null);

  const execute = async (job, status, label) => {
    setBusy(job._id);
    try {
      await requestApi.updateStatus(job._id, status);
      toast.success(`${job.serviceType} ${label}`);
      await run();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(null);
    }
  };

  if (loading || !data) {
    return (
      <div className="container-page page-shell max-w-5xl space-y-4">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  const list = data[tab] || [];
  const { provider } = data;
  const counts = data.counts || {};

  const counters = [
    { label: 'Incoming', value: counts.incoming, icon: 'inbox', tone: 'info' },
    { label: 'Active jobs', value: counts.active, icon: 'hammer', tone: 'warning' },
    { label: 'Completed', value: counts.completed, icon: 'checkcircle', tone: 'success' },
    { label: 'Current load', value: counts.activeJobCount || 0, icon: 'dashboard', tone: 'brand' }
  ];

  const toneStyles = {
    brand: 'bg-brand-soft text-brand-text',
    info: 'bg-info-soft text-info-text',
    warning: 'bg-warning-soft text-warning-text',
    success: 'bg-success-soft text-success-text'
  };

  return (
    <div className="container-page page-shell max-w-5xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-fg">
            {provider?.businessName || 'Provider dashboard'}
          </h1>
          <p className="mt-1 text-sm text-muted">Manage incoming and active service jobs.</p>
        </div>
        {provider?.rating != null && (
          <div className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-semibold text-fg">
            <Icon name="star" size={16} className="fill-amber-400 text-amber-400" aria-hidden="true" />
            {Number(provider.rating).toFixed(1)}
            <span className="font-normal text-faint">rating</span>
          </div>
        )}
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {counters.map((c) => (
          <div key={c.label} className="card-surface flex items-center gap-3 p-4">
            <span
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                toneStyles[c.tone]
              )}
            >
              <Icon name={c.icon} size={20} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="font-heading text-2xl font-extrabold tabular-nums text-fg">{c.value}</div>
              <div className="truncate text-xs font-semibold text-muted">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div
        role="tablist"
        aria-label="Jobs"
        className="mt-6 inline-flex w-full gap-1 rounded-xl border border-line bg-surface p-1 sm:w-auto"
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors sm:flex-none',
              tab === t.key ? 'bg-brand text-white' : 'text-muted hover:bg-inset hover:text-fg'
            )}
          >
            {t.label}
            {counts[t.key] > 0 && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums',
                  tab === t.key ? 'bg-white/20 text-white' : 'bg-inset text-fg'
                )}
              >
                {counts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {list.length === 0 ? (
          <div className="card-surface">
            <EmptyState
              icon={tab === 'active' ? 'clock' : tab === 'completed' ? 'checkcircle' : 'inbox'}
              title={
                tab === 'active'
                  ? 'No active jobs'
                  : tab === 'completed'
                    ? 'Nothing completed yet'
                    : 'No incoming requests'
              }
              hint={
                tab === 'incoming'
                  ? 'New matched requests will appear here for you to accept.'
                  : 'You are all caught up.'
              }
            />
          </div>
        ) : (
          list.map((job) => (
            <JobCard
              key={job._id}
              job={job}
              busy={busy === job._id}
              onAccept={(j) => execute(j, STATUS.ACCEPTED, 'accepted')}
              onReject={(j) => execute(j, STATUS.REJECTED, 'rejected')}
              onAdvance={(j) => execute(j, NEXT[j.status], 'updated')}
            />
          ))
        )}
      </div>
    </div>
  );
}
