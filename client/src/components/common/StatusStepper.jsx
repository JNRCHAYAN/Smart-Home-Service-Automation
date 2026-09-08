import { STATUS_FLOW } from '../../constants/index.js';
import Icon from './Icon.jsx';
import { formatDate } from '../../utils/format.js';
import { cn } from '../../utils/cn.js';

const STEP_ICONS = {
  Requested: 'inbox',
  Accepted: 'check',
  'On the Way': 'truck',
  'In Progress': 'hammer',
  Completed: 'check'
};

function timestampsFor(status, timeline = []) {
  return timeline.find((t) => t.status === status)?.timestamp;
}

export default function StatusStepper({ status, timeline = [] }) {
  const currentIdx = STATUS_FLOW.indexOf(status);
  const completed = currentIdx !== -1;
  const isRejected = status === 'Rejected' || status === 'Cancelled';

  return (
    <div>
      <ol className="flex overflow-x-auto pb-1" aria-label="Request progress">
        {STATUS_FLOW.map((step, i) => {
          const isDone = completed && i < currentIdx;
          const isCurrent = completed && status === step;
          const ts = timestampsFor(step, timeline);
          return (
            <li key={step} className="flex min-w-[86px] flex-1 items-start last:min-w-0 last:flex-none">
              <div className="flex flex-col items-center">
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors sm:h-10 sm:w-10',
                    isCurrent
                      ? 'border-brand bg-brand text-white shadow-glow'
                      : isDone
                        ? 'border-brand bg-brand text-white'
                        : 'border-line2 bg-surface text-faint'
                  )}
                >
                  <Icon name={STEP_ICONS[step]} size={16} strokeWidth={isDone ? 2.5 : 2} />
                </span>
                <span
                  className={cn(
                    'mt-1.5 whitespace-nowrap text-[11px] font-semibold sm:text-xs',
                    isCurrent ? 'text-brand-text' : isDone ? 'text-fg' : 'text-faint'
                  )}
                >
                  {step}
                </span>
                {ts && (
                  <span className="whitespace-nowrap text-[10px] text-faint">
                    {formatDate(ts).split(',')[0]}
                  </span>
                )}
              </div>
              {i < STATUS_FLOW.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'mx-2 mt-[17px] h-0.5 flex-1 rounded sm:mx-3',
                    isDone ? 'bg-brand' : 'bg-line2'
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
      {isRejected && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm font-medium text-danger-text">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            This request was {status.toLowerCase()}. You can request a new provider to continue.
          </span>
        </div>
      )}
    </div>
  );
}
