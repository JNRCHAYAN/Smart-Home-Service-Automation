import Icon from './Icon.jsx';

export default function EmptyState({ icon = 'inbox', title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Icon name={icon} size={30} />
      </div>
      <h3 className="font-bold text-ink-700">{title}</h3>
      {hint && <p className="mt-1 max-w-sm text-sm text-ink-400">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
