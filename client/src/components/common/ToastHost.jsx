import { useToast } from '../../store/toastStore.js';
import Icon from './Icon.jsx';
import { cn } from '../../utils/cn.js';

// Renders the live toast queue (see store/toastStore.js) fixed at the bottom
// of the viewport. One instance is mounted once, in AppLayout.
const STYLES = {
  success: { wrap: 'border-success-border bg-success-soft text-success-text', icon: 'checkcircle' },
  error: { wrap: 'border-danger-border bg-danger-soft text-danger-text', icon: 'alertcircle' },
  info: { wrap: 'border-info-border bg-info-soft text-info-text', icon: 'info' }
};

export default function ToastHost() {
  const { toasts, remove } = useToast();
  return (
    // aria-live="polite" announces non-error toasts; errors switch each item
    // to role="alert" so screen readers treat them as urgent.
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((t) => {
        const s = STYLES[t.type] || STYLES.info;
        return (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-2.5 rounded-xl border px-4 py-3 shadow-pop backdrop-blur',
              s.wrap
            )}
          >
            <Icon name={s.icon} size={18} className="mt-px shrink-0" aria-hidden="true" />
            <p className="flex-1 text-sm font-semibold leading-snug">{t.message}</p>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => remove(t.id)}
              className="shrink-0 rounded-md p-0.5 opacity-70 transition-opacity hover:opacity-100"
            >
              <Icon name="x" size={15} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
