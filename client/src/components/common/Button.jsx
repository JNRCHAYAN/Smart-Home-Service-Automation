import Icon from './Icon.jsx';

const VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-600/20',
  accent: 'bg-accent-600 text-white hover:bg-accent-700 shadow-sm shadow-accent-600/25',
  secondary: 'bg-white text-ink-700 border border-ink-200 hover:border-ink-300 hover:bg-ink-50',
  ghost: 'bg-transparent text-ink-500 hover:bg-ink-100',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  outlineBrand: 'bg-transparent border border-brand-600 text-brand-700 hover:bg-brand-50'
};

const SIZES = {
  sm: 'px-3.5 py-2 text-sm min-h-[38px]',
  md: 'px-4 py-2.5 text-sm min-h-[44px]',
  lg: 'px-6 py-3 text-base min-h-[48px]'
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
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] ${
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
