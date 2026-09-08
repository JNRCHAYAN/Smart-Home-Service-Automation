import { useAsync } from '../../hooks/useAsync.js';
import { providerApi } from '../../api/index.js';
import EmptyState from '../../components/common/EmptyState.jsx';
import Badge from '../../components/common/Badge.jsx';
import Icon from '../../components/common/Icon.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { formatDate, statusClass } from '../../utils/format.js';
import { URGENCY_VARIANTS } from '../../constants/index.js';

// /provider/schedule — read-only view of upcoming accepted jobs plus the
// provider's free (unbooked) availability slots for the coming days.
export default function ProviderSchedule() {
  const { data, loading } = useAsync(() => providerApi.schedule(), []);

  if (loading || !data) {
    return (
      <div className="container-page page-shell max-w-4xl space-y-4">
        <Skeleton className="h-9 w-56" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  const { upcoming, bookedSlots, provider } = data;
  const free = (provider?.availability || []).filter((s) => !s.isBooked);

  return (
    <div className="container-page page-shell max-w-4xl">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 font-heading text-2xl font-extrabold tracking-tight text-fg">
          <Icon name="calendar" size={22} className="text-brand" aria-hidden="true" />
          Schedule
        </h1>
        <p className="mt-1 text-sm text-muted">Your upcoming jobs and available time slots.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card-surface p-5">
          <h2 className="mb-1 font-heading text-base font-bold text-fg">Upcoming jobs</h2>
          <p className="mb-4 text-sm text-muted">{upcoming.length} scheduled</p>
          {upcoming.length === 0 ? (
            <EmptyState icon="calendar" title="No upcoming jobs" hint="Accepted jobs show up here." />
          ) : (
            <ul className="space-y-2.5">
              {upcoming.map((r) => (
                <li
                  key={r._id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-fg">{r.serviceType}</div>
                    <div className="text-xs text-muted">
                      {formatDate(r.preferredDate)} · {r.preferredTimeWindow.start}–
                      {r.preferredTimeWindow.end}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Badge variant={URGENCY_VARIANTS[r.urgency] || 'neutral'}>{r.urgency}</Badge>
                    <Badge variant={statusClass(r.status)}>{r.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card-surface p-5">
          <h2 className="mb-1 font-heading text-base font-bold text-fg">Availability</h2>
          <p className="mb-4 text-sm text-muted">
            {bookedSlots.length} booked · {free.length} free slots this week
          </p>
          {free.length === 0 ? (
            <EmptyState
              icon="clock"
              title="No free slots"
              hint="Open up availability in Settings to keep receiving matches."
            />
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {free.map((s, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-soft text-success-text">
                    <Icon name="check" size={15} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-fg">{formatDate(s.date)}</div>
                    <div className="text-[11px] text-muted">
                      {s.startTime}–{s.endTime}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
