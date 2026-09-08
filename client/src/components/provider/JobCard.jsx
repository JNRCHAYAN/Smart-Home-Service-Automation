import Button from '../common/Button.jsx';
import Badge from '../common/Badge.jsx';
import Icon from '../common/Icon.jsx';
import { bdt, formatDate, statusClass } from '../../utils/format.js';
import { URGENCY_VARIANTS } from '../../constants/index.js';

export function JobCard({ job, onAccept, onReject, onAdvance, busy }) {
  const canAccept = job.status === 'Requested';
  const active = ['Accepted', 'On the Way', 'In Progress'].includes(job.status);

  return (
    <article className="card-surface p-5 transition-shadow hover:shadow-pop">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading text-base font-bold text-fg">{job.serviceType}</h3>
            <Badge variant={URGENCY_VARIANTS[job.urgency] || 'neutral'}>{job.urgency}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">
            {job.location?.address} · {formatDate(job.preferredDate)} · {job.preferredTimeWindow.start}–
            {job.preferredTimeWindow.end}
          </p>
        </div>
        <Badge variant={statusClass(job.status)}>{job.status}</Badge>
      </div>

      {job.problemDetails && (
        <p className="mt-3 rounded-xl bg-inset px-3.5 py-2.5 text-sm italic text-muted">
          “{job.problemDetails}”
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="user" size={15} className="text-brand-text" aria-hidden="true" />
            {job.contact?.name}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="phone" size={14} aria-hidden="true" />
            {job.contact?.phone}
          </span>
          {job.price && (
            <span className="inline-flex items-center gap-1.5 font-semibold text-fg">
              <Icon name="dollar" size={14} className="text-brand-text" aria-hidden="true" />
              {bdt(job.price)}
            </span>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          {canAccept ? (
            <>
              <Button size="sm" variant="secondary" onClick={() => onReject(job)} disabled={busy}>
                <Icon name="x" size={15} aria-hidden="true" />
                Reject
              </Button>
              <Button size="sm" onClick={() => onAccept(job)} disabled={busy} icon="check">
                Accept
              </Button>
            </>
          ) : active ? (
            <Button size="sm" onClick={() => onAdvance(job)} disabled={busy}>
              {nextLabel(job.status)}
              <Icon name="arrowright" size={15} aria-hidden="true" />
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-faint">
              <Icon name="checkcircle" size={14} aria-hidden="true" />
              Completed
            </span>
          )}
        </div>
      </div>
    </article>
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
