import { useState } from 'react';
import { useAsync } from '../../hooks/useAsync.js';
import { providerApi, requestApi, apiError } from '../../api/index.js';
import { JobCard } from '../../components/provider/JobCard.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Icon from '../../components/common/Icon.jsx';
import { toast } from '../../store/toastStore.js';
import { STATUS } from '../../constants/index.js';

const TABS = [
  { key: 'incoming', label: 'Incoming' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' }
];

const NEXT = { [STATUS.ACCEPTED]: STATUS.ON_THE_WAY, [STATUS.ON_THE_WAY]: STATUS.IN_PROGRESS, [STATUS.IN_PROGRESS]: STATUS.COMPLETED };

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
    return <div className="mx-auto max-w-5xl px-4 py-10"><div className="h-24 animate-pulse rounded-2xl bg-ink-100" /></div>;
  }

  const list = data[tab] || [];
  const activeJobCount = data.counts.activeJobCount || 0;
  const { provider } = data;

  const counters = [
    { label: 'Incoming', value: data.counts.incoming, icon: 'inbox', color: 'text-blue-500 bg-blue-50' },
    { label: 'Active jobs', value: data.counts.active, icon: 'hammer', color: 'text-orange-500 bg-orange-50' },
    { label: 'Completed', value: data.counts.completed, icon: 'check', color: 'text-green-500 bg-green-50' },
    { label: 'Load', value: activeJobCount, icon: 'dashboard', color: 'text-violet-500 bg-violet-50' }
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-ink-900">
            <Icon name="dashboard" size={24} className="text-brand-600" /> {provider?.businessName || 'Dashboard'}
          </h1>
          <p className="mt-1 text-sm text-ink-400">Manage incoming and active service jobs.</p>
        </div>
        <div className="rounded-xl bg-ink-50 px-4 py-2 text-sm font-semibold text-ink-500">
          Rating: <span className="text-amber-500">{'★'.repeat(Math.round(provider?.rating || 0))}</span>{' '}
          {(provider?.rating || 0).toFixed(1)}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {counters.map((c) => (
          <Card key={c.label} className="flex items-center gap-3">
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.color}`}>
              <Icon name={c.icon} size={20} />
            </span>
            <div>
              <div className="text-2xl font-extrabold text-ink-900">{c.value}</div>
              <div className="text-xs font-semibold text-ink-400">{c.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex gap-2 rounded-xl bg-ink-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              tab === t.key ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-400'
            }`}
          >
            {t.label} {data.counts[t.key] > 0 && <span className="ml-1 rounded-full bg-brand-600 px-1.5 text-xs text-white">{data.counts[t.key]}</span>}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {list.length === 0 ? (
          <Card>
            <EmptyState
              icon={tab === 'active' ? 'clock' : 'inbox'}
              title={tab === 'active' ? 'No active jobs' : tab === 'completed' ? 'Nothing completed yet' : 'No incoming requests'}
              hint={tab === 'incoming' ? 'New matched requests will appear here for you to accept.' : 'You are all caught up.'}
            />
          </Card>
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
