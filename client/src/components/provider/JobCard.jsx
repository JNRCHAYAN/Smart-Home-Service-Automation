import Button from '../common/Button.jsx';
import Badge from '../common/Badge.jsx';
import Icon from '../common/Icon.jsx';
import { bdt, formatDate, statusClass } from '../../utils/format.js';
import { URGENCY_COLORS } from '../../constants/index.js';

export function JobCard({ job, onAccept, onReject, onAdvance, busy }) {
  const canAccept = job.status === 'Requested';
  const active = ['Accepted', 'On the Way', 'In Progress'].includes(job.status);

  return (
    <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-extrabold text-ink-900">{job.serviceType}</h3>
            <Badge className={URGENCY_COLORS[job.urgency]}>{job.urgency}</Badge>
          </div>
          <p className="mt-1 text-sm text-ink-500">
            {job.location?.address} · {formatDate(job.preferredDate)} · {job.preferredTimeWindow.start}–
            {job.preferredTimeWindow.end}
          </p>
        </div>
        <Badge className={statusClass(job.status)}>{job.status}</Badge>
      </div>

      {job.problemDetails && (
        <p className="mt-3 rounded-xl bg-ink-50 px-3 py-2 text-sm text-ink-600">“{job.problemDetails}”</p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-4">
        <div className="text-sm text-ink-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Icon name="user" size={15} className="text-brand-600" /> {job.contact?.name}
            </span>
            <span className="flex items-center gap-1">
              <Icon name="phone" size={15} /> {job.contact?.phone}
            </span>
          </div>
        </div>

        {canAccept ? (
          <div className="flex gap-2">
            <Button size="sm" variant="danger" onClick={() => onReject(job)} disabled={busy} icon="ban">
              Reject
            </Button>
            <Button size="sm" onClick={() => onAccept(job)} disabled={busy} icon="check">
              Accept
            </Button>
          </div>
        ) : active ? (
          <Button size="sm" onClick={() => onAdvance(job)} disabled={busy} icon="arrowright">
            {nextLabel(job.status)}
          </Button>
        ) : (
          <span className="text-xs text-ink-300">{job.status === 'Completed' ? 'Completed' : ''}</span>
        )}
      </div>
    </div>
  );
}

function nextLabel(status) {
  const map = {
    Accepted: 'Start job',
    'On the Way': 'Mark in progress',
    'In Progress': 'Complete job'
  };
  return map[status] || 'Advance';
}
