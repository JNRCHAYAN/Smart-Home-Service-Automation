import { useToast } from '../../store/toastStore.js';
import Icon from './Icon.jsx';

export default function ToastHost() {
  const { toasts } = useToast();
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg ${
            t.type === 'error' ? 'bg-rose-600' : t.type === 'info' ? 'bg-ink-700' : 'bg-brand-600'
          }`}
        >
          <Icon name={t.type === 'error' ? 'alert' : 'check'} size={18} />
          {t.message}
        </div>
      ))}
    </div>
  );
}
