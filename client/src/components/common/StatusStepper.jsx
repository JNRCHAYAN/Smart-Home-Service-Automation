import { STATUS_FLOW } from '../../constants/index.js';
import Icon from './Icon.jsx';
import { formatDate } from '../../utils/format.js';

const STEP_ICONS = {
  Requested: 'inbox',
  Accepted: 'check',
  'On the Way': 'truck',
  'In Progress': 'hammer',
  Completed: 'check',
  Rejected: 'ban',
  Cancelled: 'x'
};

function timestampsFor(status, timeline = []) {
  return timeline.find((t) => t.status === status)?.timestamp;
}

export default function StatusStepper({ status, timeline = [] }) {
  const completed = STATUS_FLOW.includes(status);
  const currentIdx = STATUS_FLOW.indexOf(status);
  const isRejected = status === 'Rejected' || status === 'Cancelled';

  return (
    <div className="my-6">
      <ol className="flex items-center">
        {STATUS_FLOW.map((step, i) => {
          const isDone = completed && i < currentIdx;
          const isCurrent = status === step;
          const ts = timestampsFor(step, timeline);
          return (
            <li key={step} className="flex-1 last:flex-none">
              <div className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                      isCurrent
                        ? 'border-brand-600 bg-brand-600 text-white pulse-dot'
                        : isDone
                          ? 'border-brand-500 bg-brand-500 text-white'
                          : 'border-ink-200 bg-white text-ink-300'
                    }`}
                  >
                    <Icon name={STEP_ICONS[step]} size={18} />
                  </div>
                  <span
                    className={`mt-1.5 text-center text-[11px] font-semibold ${
                      isCurrent ? 'text-brand-700' : isDone ? 'text-ink-700' : 'text-ink-300'
                    }`}
                  >
                    {step}
                  </span>
                  {ts && (
                    <span className="text-[10px] text-ink-300">{formatDate(ts).split(',')[0]}</span>
                  )}
                </div>
                {i < STATUS_FLOW.length - 1 && (
                  <div
                    className={`mx-1 mb-5 h-1 flex-1 rounded ${
                      isDone ? 'bg-brand-500' : 'bg-ink-200'
                    }`}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {isRejected && (
        <div className="mt-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
          This request was {status.toLowerCase()}. A new provider can be requested.
        </div>
      )}
    </div>
  );
}
