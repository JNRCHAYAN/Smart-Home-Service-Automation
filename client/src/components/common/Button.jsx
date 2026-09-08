import Icon from './Icon.jsx';

const VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-600/20',
  secondary: 'bg-white text-ink-700 border border-ink-200 hover:bg-ink-50',
  ghost: 'bg-transparent text-ink-500 hover:bg-ink-100',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  outlineBrand: 'bg-transparent border border-brand-600 text-brand-700 hover:bg-brand-50'
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base'
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  full,
  className = '',
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${
        VARIANTS[variant]
      } ${SIZES[size]} ${full ? 'w-full' : ''} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <Icon name="loader" className="animate-spin" size={18} />
      ) : (
        icon && <Icon name={icon} size={18} />
      )}
      {children}
    </button>
  );
}
