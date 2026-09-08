import Icon from './Icon.jsx';

// Centred empty/placeholder panel. Props: icon (registry name), title, optional
// hint copy and an optional action node (e.g. a Button/Link).
export default function EmptyState({ icon = 'inbox', title, hint, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center px-4 py-14 text-center ${className}`}>
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-inset text-faint">
        <Icon name={icon} size={30} aria-hidden="true" />
      </span>
      <h3 className="font-heading text-base font-bold text-fg">{title}</h3>
      {hint && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
