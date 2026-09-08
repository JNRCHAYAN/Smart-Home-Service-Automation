import { useAsync } from '../../hooks/useAsync.js';
import { providerApi } from '../../api/index.js';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Badge from '../../components/common/Badge.jsx';
import Icon from '../../components/common/Icon.jsx';
import { formatDate, statusClass } from '../../utils/format.js';
import { URGENCY_COLORS } from '../../constants/index.js';
import { useAuth } from '../../store/authStore.js';

export default function ProviderSchedule() {
  const { data, loading } = useAsync(() => providerApi.schedule(), []);
  const { provider: profile } = useAuth();

  if (loading || !data)
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="h-24 animate-pulse rounded-2xl bg-ink-100" />
      </div>
    );

  const { upcoming, bookedSlots, provider } = data;
  const free = (provider?.availability || []).filter((s) => !s.isBooked);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-ink-900">
        <Icon name="calendar" size={24} className="text-brand-600" /> Schedule
      </h1>
      <p className="mt-1 text-sm text-ink-400">Your upcoming jobs and available time slots.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <div className="mb-3 font-bold text-ink-900">Upcoming jobs</div>
          {upcoming.length === 0 ? (
            <EmptyState icon="clock" title="No upcoming jobs" hint="Accepted jobs show up here." />
          ) : (
            <div className="space-y-2">
              {upcoming.map((r) => (
                <div
                  key={r._id}
                  className="flex items-center justify-between rounded-xl border border-ink-100 px-3 py-2.5"
                >
                  <div>
                    <div className="font-semibold text-ink-900">{r.serviceType}</div>
                    <div className="text-xs text-ink-400">
                      {formatDate(r.preferredDate)} · {r.preferredTimeWindow.start}–
                      {r.preferredTimeWindow.end}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={URGENCY_COLORS[r.urgency]}>{r.urgency}</Badge>
                    <Badge className={statusClass(r.status)}>{r.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-1 font-bold text-ink-900">Availability</div>
          <p className="mb-3 text-sm text-ink-400">
            {bookedSlots.length} booked · {free.length} free slots
          </p>
          <div className="grid grid-cols-2 gap-2">
            {free.map((s, i) => (
              <div key={i} className="rounded-lg border border-ink-100 px-3 py-2 text-xs">
                <div className="font-semibold text-ink-700">{formatDate(s.date)}</div>
                <div className="text-ink-400">
                  {s.startTime}–{s.endTime}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
